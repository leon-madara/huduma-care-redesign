# 07 — Rollout Plan

> A phased migration from today's monolithic Next.js app to the target
> architecture, with no flag-day rewrite and no user-visible downtime.
> Built around shipping value at every milestone.

## Phasing

```
  Now ────► P1 Refactor ──► P2 Visual ──► P3 API split ──► P4 Temporal ──► P5 K8s ──► P6 Scale
            (2 weeks)       (2 weeks)     (1 week)         (2 weeks)       (1 week)   (ongoing)
```

The order matters: refactor first so each later step is mechanical. **Do
not** try to move to K8s before the API and worker split exists.

---

## P1 — Refactor (2 weeks)

**Goal:** All business logic lives in `packages/core/`. Zero changes to
user-facing behavior.

**Deliverables:**
- Monorepo restructured (pnpm or turborepo workspaces).
- `packages/core/`, `packages/db/`, `packages/schemas/` created.
- All `app/api/**/route.ts` handlers are < 20 lines each, importing from `core`.
- README rewritten to describe HudumaCare (not the original template).
- Tests on `packages/core/` ≥ 50% coverage.

**Risk:** Refactor-shaped scope creep. **Counter:** No new features in this
phase; if a feature lands, it must follow the new structure but no others
get retrofitted opportunistically.

---

## P2 — Visual refresh (2 weeks)

**Goal:** Ship the redesigned UI from `../index.html` behind a feature flag.

**Deliverables:**
- Manrope + design tokens added (`packages/ui/tokens.css`).
- Refactored components for: landing, services, location, results, facility detail, reviews.
- Old screens still reachable via `?legacy=1` query param for 4 weeks.
- Lighthouse perf ≥ 85 mobile, ≥ 95 desktop.

**Risk:** Half-shipped redesign across pages (mixing old + new looks
broken). **Counter:** Ship by user flow, not by screen — entire "find
care" flow goes new in one release; admin and booking can lag.

---

## P3 — API split (1 week)

**Goal:** `apps/api` exists, owning all write endpoints.

**Deliverables:**
- Fastify app in `apps/api/` running locally and in staging.
- All write routes (`POST`, `PUT`, `DELETE`) moved from Next handlers to `apps/api`.
- `apps/web/` calls `apps/api/` via internal URL; from the browser it goes through `/api/` ingress path.
- Staging proves the split is invisible.

**Risk:** CORS / cookie domain issues. **Counter:** Same parent domain,
same cookie settings, integration test for each migrated route.

---

## P4 — Temporal introduction (2 weeks)

**Goal:** First two workflows running in production: `KmhfrSyncWorkflow`
and `ReviewModerationWorkflow`.

**Deliverables:**
- Temporal Cloud namespace + service account.
- `apps/worker` deployed (still on the current Vercel/Render infra is fine).
- `KmhfrSyncWorkflow` replaces the existing sync mechanism. Old sync code archived.
- `ReviewModerationWorkflow` handles new reviews; old pending reviews are migrated to the workflow via a one-time script.
- Booking endpoint **doesn't** start a workflow yet — keep returning `pending` synchronously until P5.

**Risk:** Worker pod crashes lose tasks. **Counter:** Use Temporal Cloud
from day one — durability is the entire point. Even in self-hosted, never
start a workflow from code that doesn't go through the Temporal client.

---

## P5 — Kubernetes migration (1 week)

**Goal:** Production traffic on the K8s cluster.

**Deliverables:**
- Cluster + node pools provisioned (Terraform).
- Helm charts for `web`, `api`, `worker`, `webhook`.
- External Secrets Operator + Doppler integration.
- NGINX ingress + cert-manager + Cloudflare in front.
- Argo CD reconciling from `infra/k8s/envs/prod`.
- Cutover: DNS swung from Vercel/Render to the new ingress in low-traffic window. Old infra kept up for 72h.

**Risk:** First-week K8s incident. **Counter:** Roll back via DNS — old
infra stays warm for 72 hours. Have a written runbook for the cutover and
rehearse it in staging.

---

## P6 — Scaling & polish (ongoing)

Once the foundation is in:
- **`BookingCoordinationWorkflow`** ships — booking becomes async + reliable.
- HPA tuned (cf. K8s doc): web on RPS, worker on queue depth.
- Redis cache layer added in front of the search query.
- Add `FacilityVerificationWorkflow` (weekly callbacks).
- Add `NotificationFanOutWorkflow` for public health alerts.
- Multi-language: Swahili toggle. Strings extracted in P2 should make this trivial.
- Africa's Talking integration for the SMS short-code fallback (`FIND … → 22829`).

## Anti-goals

- **Don't migrate everything to K8s before refactoring.** You'll just have a tangled monolith running on more expensive infra.
- **Don't introduce Temporal for the first time AND restructure the codebase in the same week.** Pick one new failure mode at a time.
- **Don't rewrite from scratch.** The existing code has hard-won knowledge about Kenyan healthcare data quirks. Refactor it; don't throw it away.

## Definition of done for the whole rollout

- Every workflow described in doc 03 is running in production.
- p95 search latency < 400 ms.
- Booking workflow success rate (confirmed + alternates) ≥ 80%.
- Zero secrets in the repository.
- A new engineer can: clone, run `pnpm dev`, see the app, run `pnpm test`, all under 10 minutes.
- The redesigned UI in `../index.html` matches production within reason.

## Open questions to answer before you start

These aren't blockers, but they shape choices:
- **Cloud provider?** GKE / EKS / DOKS each have trade-offs; Doppler / Secret Manager / Doppler likewise. Pick once, stick with it.
- **Temporal Cloud or self-hosted?** Doc 04 recommends Cloud for v1.
- **Africa's Talking, Twilio, or Safaricom direct?** AT is the most Kenya-native; Twilio has better global coverage.
- **M-Pesa integration scope?** Just facility payouts (P6+), or in-app payment for bookings? The latter is a much bigger box.
- **Privacy / data residency?** If the gov mandates Kenya-region hosting (it might), revisit cloud choice early.

Answer these in writing before P1 ends so they don't surprise P5.
