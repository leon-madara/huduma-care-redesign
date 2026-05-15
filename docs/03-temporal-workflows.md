# 03 — Temporal Workflows

> Every workflow we need, with its trigger, activity signatures, retry policy,
> and what the user sees while it runs. Implement these in
> `packages/temporal/src/workflows/` with activities in
> `apps/worker/src/activities/`.

## Why Temporal at all

The honest answer: most of HudumaCare's pain points are **multi-step
coordinations with humans and 3rd parties that can fail at any step**. Cron +
status columns + "we'll retry on next request" gets fragile fast. Temporal
gives durable execution, retries, timers, and human-in-the-loop signals as
first-class primitives.

If a workflow below is the only stateful flow you need, you don't need
Temporal — use a queue. But once you have 3+ of these, Temporal pays for
itself.

---

## Workflows

### 1. `KmhfrSyncWorkflow` — Facility data sync from KMHFR

**Trigger:** Scheduled, daily at 03:00 EAT, plus on-demand from admin UI.

**Why a workflow:** KMHFR's API is slow, paginated, and occasionally returns
500s. We need retries with backoff, a final "what changed" report to ops,
and the ability to resume mid-sync if the worker pod is rescheduled.

```ts
export async function KmhfrSyncWorkflow(input: { force?: boolean } = {}) {
  const runId = workflowInfo().runId;
  const counties = await acts.listCounties();

  let totalUpdated = 0, totalNew = 0, errors = [] as string[];

  for (const county of counties) {
    try {
      const result = await acts.syncCounty({ county, force: input.force });
      totalUpdated += result.updated;
      totalNew += result.created;
      await sleep('30 seconds');                  // rate-limit politeness
    } catch (e) {
      errors.push(`${county}: ${String(e)}`);
    }
  }

  await acts.postSyncReport({ runId, totalUpdated, totalNew, errors });
  await acts.invalidateSearchCache();
}
```

**Activities:**
- `listCounties(): string[]` — 1s, no retry needed
- `syncCounty({county, force}): { created, updated }` — 15 min timeout, 5 retries
- `postSyncReport(...)` — posts to Slack + writes a `sync_runs` row
- `invalidateSearchCache()` — flushes Redis search keys

**User-visible:** Admin dashboard shows "Last synced 2 hours ago" with a
"Sync now" button that signals the workflow.

---

### 2. `ReviewModerationWorkflow` — Submit → moderate → publish

**Trigger:** `api.post('/reviews')` starts it, returns `pending` immediately.

```ts
export async function ReviewModerationWorkflow(input: { reviewId: string }) {
  const review = await acts.loadReview(input.reviewId);

  // Automated checks
  const scores = await acts.runAutomatedModeration(review.text);

  if (scores.toxicity > 0.9 || scores.spamLikelihood > 0.85) {
    await acts.setReviewStatus(input.reviewId, 'rejected', { reason: 'auto-rejected' });
    return;
  }

  if (scores.toxicity > 0.4 || scores.containsPersonalMedical) {
    // Human review needed — wait for a signal from the moderation queue UI
    await acts.setReviewStatus(input.reviewId, 'in_review');
    const decision = await condition(() => moderationDecision !== null, '7 days');
    if (!decision) {
      await acts.setReviewStatus(input.reviewId, 'rejected', { reason: 'moderation timeout' });
      return;
    }
    if (moderationDecision === 'reject') {
      await acts.setReviewStatus(input.reviewId, 'rejected', { reason: 'human-rejected' });
      return;
    }
  }

  await acts.setReviewStatus(input.reviewId, 'approved');
  await acts.notifyUser(review.userId, 'review_approved', { facilityId: review.facilityId });
  await acts.invalidateFacilityCache(review.facilityId);
}

// Signal handler
let moderationDecision: 'approve' | 'reject' | null = null;
setHandler(moderationSignal, (d) => { moderationDecision = d; });
```

**Why it matters:** Reviews are the trust layer. Bad reviews getting through
or good reviews disappearing both kill the product. Doing this with a cron
job and a `status` column means "stuck in pending" is a real failure mode.
Temporal makes it durable and visible.

---

### 3. `BookingCoordinationWorkflow` — Patient ↔ Facility appointment broker

**Trigger:** `api.post('/bookings')` starts it.

This is the **flagship workflow** — see the prototype's Booking screen.
HudumaCare brokers the request: SMS the facility, wait for a response,
retry via another channel, escalate to a human coordinator if needed.

```ts
export async function BookingCoordinationWorkflow(input: BookingInput) {
  const booking = await acts.persistBooking(input);

  // Try WhatsApp first (cheapest, richest)
  await acts.sendFacilityWhatsApp(booking.id);
  let response = await condition(() => facilityResponse !== null, '30 minutes');

  if (!response) {
    await acts.sendFacilitySms(booking.id);
    await acts.notifyPatient(booking.id, 'still_waiting');
    response = await condition(() => facilityResponse !== null, '30 minutes');
  }

  if (!response) {
    // Escalate — appears in coordinator dashboard
    await acts.escalateToCoordinator(booking.id);
    response = await condition(() => facilityResponse !== null, '4 hours');
  }

  if (!response) {
    await acts.setBookingStatus(booking.id, 'no_response');
    await acts.suggestAlternates(booking.id);    // pull from core.findFacilities
    await acts.notifyPatient(booking.id, 'alternates_suggested');
    return;
  }

  if (facilityResponse === 'declined') {
    await acts.setBookingStatus(booking.id, 'declined');
    await acts.suggestAlternates(booking.id);
    return;
  }

  await acts.setBookingStatus(booking.id, 'confirmed');
  await acts.notifyPatient(booking.id, 'confirmed');

  // Set a reminder 1 hour before the appointment
  const reminderTime = booking.scheduledFor.minus({ hours: 1 });
  await sleepUntil(reminderTime);
  await acts.notifyPatient(booking.id, 'reminder');
}
```

**Signals:** `facilityResponse` (`'confirmed' | 'declined' | 'reschedule'`)
sent by the facility admin clicking Accept / Decline in their dashboard, or
by the webhook receiving an SMS reply.

**Queries:** `getBookingState()` lets the patient's status page show
"Waiting for facility (2 of 30 minutes elapsed)…" without polling the DB.

---

### 4. `NotificationFanOutWorkflow` — Broadcast safety alerts

**Trigger:** Admin posts a public health notice (e.g. cholera outbreak
in Kisumu, vaccination drive Saturday).

```ts
export async function NotificationFanOutWorkflow(input: { noticeId: string }) {
  const recipients = await acts.queryRecipients(input.noticeId);  // by county/service interest
  const batches = chunk(recipients, 200);

  for (const batch of batches) {
    await acts.sendSmsBatch(batch, input.noticeId);
    await sleep('5 seconds');   // SMS provider rate limit
  }

  await acts.markNoticeSent(input.noticeId);
}
```

**Why:** SMS provider rate limits make this naturally a slow, retryable
process. If the worker crashes mid-fanout, Temporal picks up where it left
off — no duplicate sends, no missed recipients.

---

### 5. `FacilityVerificationWorkflow` — Periodic listing freshness check

**Trigger:** Scheduled weekly, plus when a community correction is filed.

For each facility:
1. Try to call the listed phone number (via Africa's Talking voice).
2. If unanswered, send an SMS to verify hours.
3. If still no response in 48h, flag the listing as "needs review".
4. Surface flagged listings to the facility admin dashboard.

This is what powers the "Verified 2 days ago" badge in the prototype.

---

### 6. `GeocodingEnrichmentWorkflow` — Backfill coords + neighborhood info

**Trigger:** On `facility.created` or when address changes.

```ts
export async function GeocodingEnrichmentWorkflow(input: { facilityId: string }) {
  const facility = await acts.loadFacility(input.facilityId);
  const geo = await acts.geocode(facility.address);          // 3 retries, then dead-letter
  await acts.updateFacilityGeo(input.facilityId, geo);
  await acts.indexInPostGIS(input.facilityId);
}
```

Short-lived but worth durable execution because geocoding APIs flake. Dead-letter to a "needs manual geocoding" queue in the admin UI.

---

## Retry policies (defaults)

| Workflow / Activity class | initial | backoff | max attempts | timeout |
| --- | --- | --- | --- | --- |
| 3rd party HTTP (KMHFR, geocoding) | 5s | 2× | 5 | 15 min |
| SMS / WhatsApp send | 10s | 2× | 8 | 2 min |
| DB write | 1s | 2× | 5 | 30 s |
| Slack / Sentry post | 3s | 2× | 3 | 30 s |
| Human signal wait | n/a — use `condition()` with explicit timeouts |

## Worker configuration

```ts
// apps/worker/src/index.ts
import { Worker } from '@temporalio/worker';
import * as activities from './activities';

const worker = await Worker.create({
  workflowsPath: require.resolve('@huduma/temporal/workflows'),
  activities,
  taskQueue: 'huduma-main',
  maxConcurrentActivityTaskExecutions: 50,
  maxConcurrentWorkflowTaskExecutions: 100,
});
await worker.run();
```

In K8s, scale this Deployment on **Temporal task queue depth** as a custom
metric (KEDA + Temporal scaler). CPU-based scaling is a poor proxy because
workflows are I/O bound.

## Testing workflows

Temporal's `TestWorkflowEnvironment` lets you time-travel: assert that the
`BookingCoordinationWorkflow` correctly escalates after 30 simulated minutes
without burning real time. Add a workflow test for every retry path before
shipping that flow.

## What we are explicitly _not_ using Temporal for

- Plain CRUD on facility data. Just a DB transaction.
- The search endpoint. Stateless, fast — Redis cache + Postgres is enough.
- Auth flows. Supabase handles these.

A good rule: if the work is **synchronous, fast, and stateless**, do not put
it in Temporal. The cost is debugging complexity.
