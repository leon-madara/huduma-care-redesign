# 02 — Refactor Plan

> Refactor _before_ you scale. The current codebase has business logic glued
> to Next.js route handlers, which makes it impossible to call the same logic
> from a Temporal activity or a CLI. This doc lays out the move in 4 phases
> that can ship incrementally — no big-bang rewrite.

## The core problem

Today, a route handler like `app/api/facilities/search/route.ts` does all of:
- Parse and validate input
- Build the SQL query
- Call Supabase
- Shape the response
- Log analytics

That's fine until you need to:
- Run the same search inside a Temporal workflow (e.g. "find 3 alternates if the booked facility cancels")
- Cache by canonical query key
- Unit-test the logic without spinning up Next

The fix is a `packages/core/` module where **all business logic lives as
plain functions with explicit dependencies**. Route handlers, Temporal
activities, CLIs, and tests all import from there.

## Phase 1 — Carve out `packages/core/` (2–3 days)

Create the package structure:

```
packages/core/src/
├── facilities/
│   ├── search.ts           # findFacilities({ near, service, insurance, …}, deps)
│   ├── byId.ts             # getFacility(id, deps)
│   ├── verify.ts           # markVerified(facilityId, source, deps)
│   └── types.ts
├── reviews/
│   ├── submit.ts           # submitReview(input, deps)
│   ├── moderate.ts         # moderateReview(reviewId, deps)
│   └── types.ts
├── bookings/
│   ├── request.ts          # requestBooking(input, deps)
│   ├── confirm.ts          # confirmBooking(id, by, deps)
│   └── types.ts
├── insurance/
│   ├── checkAcceptance.ts
│   └── types.ts
├── geo/
│   ├── geocode.ts          # geocodeAddress(addr, deps)
│   ├── distance.ts         # km between two points
│   └── counties.ts         # Kenya county data
└── ports/
    ├── db.ts               # interface DbPort { …only the queries core needs }
    ├── notifier.ts         # interface NotifierPort { sendSms, sendWhatsApp }
    ├── geocoder.ts         # interface GeocoderPort { geocode(addr) }
    ├── moderation.ts       # interface ModerationPort { score(text) }
    └── clock.ts            # interface ClockPort { now() }  // for testability
```

**Key rules for `core/`:**
1. **No Next.js imports.** No `next/headers`, no `NextRequest`, no `revalidatePath`.
2. **No direct Supabase imports.** Take a `DbPort` interface; the adapter lives in `packages/db/`.
3. **Inject dependencies.** Every exported function takes a `deps` object as its last argument. Test by passing fakes.
4. **Zod schemas for inputs.** Re-exported from `packages/schemas/` so `web` can validate forms with the same shape.
5. **Pure where possible.** Side effects only happen through ports.

### Example refactor

**Before** (`app/api/facilities/search/route.ts`):

```ts
export async function GET(req: NextRequest) {
  const params = new URL(req.url).searchParams;
  const supabase = createServerClient(/* … */);
  const { data, error } = await supabase
    .from('facilities')
    .select('*')
    .ilike('services', `%${params.get('service')}%`)
    .limit(20);
  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ facilities: data });
}
```

**After:**

```ts
// packages/core/src/facilities/search.ts
import { z } from 'zod';

export const SearchInput = z.object({
  near: z.object({ lat: z.number(), lng: z.number() }).optional(),
  county: z.string().optional(),
  service: z.string().optional(),
  insurance: z.array(z.string()).optional(),
  openNow: z.boolean().default(false),
  limit: z.number().int().min(1).max(50).default(20),
});
export type SearchInput = z.infer<typeof SearchInput>;

export async function findFacilities(
  rawInput: unknown,
  deps: { db: DbPort; clock: ClockPort },
) {
  const input = SearchInput.parse(rawInput);
  return deps.db.facilities.search({
    ...input,
    nowUtc: deps.clock.now(),
  });
}
```

```ts
// apps/web/app/api/facilities/search/route.ts
import { findFacilities } from '@huduma/core/facilities/search';
import { deps } from '@/lib/deps';

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(new URL(req.url).searchParams);
  try {
    const facilities = await findFacilities(params, deps());
    return NextResponse.json({ facilities });
  } catch (e) {
    return errorResponse(e);
  }
}
```

The handler is now ~5 lines and contains zero business logic. The same
`findFacilities` function is called from the `BookingCoordinationWorkflow`
when it needs to suggest alternates.

## Phase 2 — Split `apps/api` from `apps/web` (1 week)

Once `core` exists, splitting the API surface is mechanical:

1. Create `apps/api/` (Fastify). It imports the same `core/` package.
2. Move all `app/api/**/route.ts` handlers to `apps/api/src/routes/`.
3. In `apps/web/`, replace inline route handlers with `fetch` calls to `api`.
4. Update the K8s ingress to route `/api/*` to `api` service.

You can do this **one route at a time.** Until a route moves, the Next.js
handler still works.

## Phase 3 — Introduce Temporal (1 week)

Add `apps/worker/` and `packages/temporal/`. See `03-temporal-workflows.md`
for the full workflow list. The smallest valuable first workflow is
**`KmhfrSyncWorkflow`** — extract the KMHFR sync logic currently running
inline and convert it to a scheduled workflow.

```ts
// packages/temporal/src/workflows/kmhfr-sync.ts
import * as activities from './activities';
import { proxyActivities, sleep } from '@temporalio/workflow';

const acts = proxyActivities<typeof activities>({
  startToCloseTimeout: '15 minutes',
  retry: { initialInterval: '5s', maximumAttempts: 5 },
});

export async function KmhfrSyncWorkflow() {
  const counties = await acts.listCounties();
  for (const c of counties) {
    await acts.syncCounty(c);    // each is retryable
    await sleep('30 seconds');   // be polite to the upstream
  }
}
```

The **activity** itself is a thin wrapper around `core/facilities/verify.ts`:

```ts
// apps/worker/src/activities/kmhfr.ts
import { syncCountyFacilities } from '@huduma/core/facilities/verify';
import { deps } from '../deps';

export const syncCounty = (county: string) =>
  syncCountyFacilities(county, deps());
```

## Phase 4 — Clean up legacy debris (ongoing)

The current repo has artifacts that should be deleted or moved:

- `README.md` still references a "ChatGPT extractor" template — rewrite to describe HudumaCare.
- Remove any unused dependencies left over from the template.
- `chatgpt_extractor.json` if present anywhere → delete.
- Consolidate the two parallel type definition styles (zod-inferred vs hand-written) → keep zod-inferred only.
- Drop `console.log` calls; route everything through a structured logger (`pino`).

## Folder reorganization summary

| Today | Tomorrow |
| --- | --- |
| `app/api/**/route.ts` (logic inline) | `apps/api/src/routes/**` (thin) + `packages/core/src/**` (logic) |
| `app/(routes)/**` | `apps/web/app/(routes)/**` (unchanged structure) |
| `lib/supabase.ts` | `packages/db/src/client.ts` + `packages/db/src/adapter.ts` (implements `DbPort`) |
| Ad-hoc cron in route handler | Temporal scheduled workflow in `apps/worker/` |
| `lib/whatsapp.ts`, `lib/sms.ts` | `packages/core/src/ports/notifier.ts` + adapters in `apps/worker/src/adapters/` |
| No tests | `packages/core/` is now trivially testable — start there |

## What's _not_ in scope here

- Authentication overhaul — Supabase Auth stays. Just thread the user into `deps`.
- Multi-tenancy — single tenant for now.
- GraphQL — REST + zod is fine. Don't add an extra spec layer.

## Definition of done for the refactor

- `packages/core/` exists and is the only place business logic lives.
- `apps/web/` has zero direct Supabase imports.
- At least one workflow runs in Temporal in production.
- Test coverage on `packages/core/` ≥ 70%.
- The README explains the actual product, not the template's product.
