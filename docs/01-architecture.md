# 01 — Target Architecture

## The shape

```
                       ┌─────────────────────────────────────────┐
                       │            Ingress (NGINX / Traefik)    │
                       │     huduma.care · admin.huduma.care     │
                       └────────────────┬────────────────────────┘
                                        │
            ┌───────────────────────────┼──────────────────────────┐
            │                           │                          │
       ┌────▼─────┐               ┌─────▼─────┐              ┌─────▼─────┐
       │   web    │               │    api    │              │  webhook  │
       │ (Next 14)│               │ (Fastify) │              │  (Hono)   │
       │ N replicas│              │ N replicas│              │ M-Pesa,   │
       └────┬─────┘               └──┬─────┬──┘              │  KMHFR,   │
            │                        │     │                 │  SMS in   │
            │  reads                 │     │                 └─────┬─────┘
            │                  reads │     │ starts workflows      │
            │                        │     │                       │
    ┌───────▼──────────┐         ┌───▼─────▼───────────┐    ┌──────▼──────┐
    │   Supabase PG    │◄────────┤   Temporal Server   │◄───┤ worker pool │
    │  (PostGIS + RLS) │         │  (or Temporal Cloud)│    │ N replicas  │
    └───────┬──────────┘         └─────────────────────┘    └──────┬──────┘
            │                                                       │
            │                          ┌────────────────────────────┘
            │                          │
            ▼                          ▼
       ┌────────┐                ┌──────────┐
       │  Redis │                │  Object  │
       │ (cache,│                │ storage  │
       │  rate) │                │ (photos) │
       └────────┘                └──────────┘
```

## Why three services, not one

| Concern | Reason |
| --- | --- |
| **`web` is stateless and read-mostly** | Next.js SSR + static-ish pages. Cache aggressively at the edge. Scales differently than write paths. |
| **`api` exists for writes & coordination** | Booking, reviews, admin edits, account ops. Talks to Temporal to start workflows. Different SLO than reads. |
| **`worker` is for slow / unreliable things** | KMHFR sync, SMS fan-out, callback escalations — these belong out of the request path. Different scaling signal (queue depth, not RPS). |
| **`webhook` is a small high-availability surface** | Payment + SMS provider callbacks must always 200. Isolating it means a bad deploy of `web` can't drop M-Pesa retries. |

You can ship the first cut as **just `web` + `worker`** (no separate `api`)
and split the api out once write traffic justifies it. The refactor in doc 02
makes that split trivial.

## Traffic flow — three representative requests

**A patient searches for a maternity clinic in Nakuru:**
1. Browser → CDN → `web` (Next.js)
2. `web` queries Redis facility cache (`maternity:nakuru:gps:-0.30,36.08`)
3. Cache miss → Postgres PostGIS query (`ST_DWithin` + service filter)
4. Result cached in Redis, returned. **No Temporal involved.** Hot path stays cheap.

**A patient submits a review:**
1. Browser → `web` → `api.post('/reviews')`
2. `api` validates, persists review row with `status='pending'`
3. `api` calls `temporal.start('ReviewModerationWorkflow', { reviewId })`
4. Returns immediately with `pending` state
5. Worker runs: profanity check → similarity check (spam) → optional manual queue → publish
6. Worker writes back `status='approved'` and notifies the user via SMS

**A patient books an appointment:**
1. `api.post('/bookings')` → starts `BookingCoordinationWorkflow`
2. Workflow: send WhatsApp to facility → wait up to 30 min for response signal
3. On timeout: retry via SMS → wait 30 min → escalate to coordinator dashboard
4. Throughout: workflow state is queryable, so the user can poll a status endpoint and see exactly where their request is.

The booking flow above is the single best argument for Temporal. Doing it
with cron + a status column collapses the moment retries get nuanced.

## Capacity targets (initial)

| Service | Replicas (min/max) | CPU req | Mem req | Notes |
| --- | --- | --- | --- | --- |
| `web` | 3 / 30 | 200m | 256Mi | HPA on CPU 70% + request concurrency |
| `api` | 2 / 20 | 200m | 256Mi | HPA on CPU 70% |
| `worker` | 2 / 50 | 300m | 512Mi | HPA on Temporal queue depth (custom metric) |
| `webhook` | 2 / 6 | 100m | 128Mi | Pinned modest range, always up |
| `redis` | 1 (managed) | — | — | Use a managed Redis; don't run your own for v1 |

Postgres stays on Supabase managed for now. Move to a self-managed/PgBouncer
fronted cluster only when row counts on `facilities`, `reviews`, and
`booking_requests` cross seven figures.

## What lives where

```
huduma-care/
├── apps/
│   ├── web/                  # Next.js — UI only
│   ├── api/                  # Fastify — write endpoints, starts workflows
│   ├── webhook/              # Hono — provider callbacks
│   └── worker/               # Temporal worker — workflows + activities
├── packages/
│   ├── core/                 # ⭐ business logic, no framework deps
│   ├── db/                   # Supabase client + generated types
│   ├── temporal/             # workflow + activity definitions
│   ├── schemas/              # zod schemas shared by api, web, worker
│   └── ui/                   # shared React components
├── infra/
│   ├── k8s/                  # manifests / Helm charts
│   ├── terraform/            # cluster + managed services
│   └── migrations/           # Supabase SQL migrations
└── docs/
```

`packages/core/` is the single biggest win — see `02-refactor-plan.md`.
