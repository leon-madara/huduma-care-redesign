# HudumaCare — Refactor & Scale Roadmap

> A living set of guide documents that map the codebase from where it is today
> to where it needs to be: a maintainable, horizontally-scalable, Kenya-wide
> healthcare facility finder running on Kubernetes with Temporal for all
> long-running and stateful work.

This folder is the **engineering companion** to the visual redesign in
`../index.html`. The prototype shows _what_ the product should feel like;
these docs explain _how_ to ship it without painting yourself into a corner.

---

## How to read these docs

| Doc | What it covers | Who should read it |
| --- | --- | --- |
| **[01-architecture.md](./01-architecture.md)** | Target architecture: services, data stores, K8s topology, traffic flow | Eng leads, platform |
| **[02-refactor-plan.md](./02-refactor-plan.md)** | Concrete refactor of the existing Next.js code — modules, boundaries, what moves where, in what order | All app engineers |
| **[03-temporal-workflows.md](./03-temporal-workflows.md)** | Every Temporal workflow we need, with activity signatures and retry policies | Backend engineers |
| **[04-kubernetes-deployment.md](./04-kubernetes-deployment.md)** | K8s manifests, autoscaling, ingress, secrets, observability | Platform / DevOps |
| **[05-data-model.md](./05-data-model.md)** | Supabase schema cleanup, PostGIS use, RLS, KMHFR sync model | Backend / data |
| **[06-ux-rationale.md](./06-ux-rationale.md)** | Why the prototype's flows look the way they do — decisions and trade-offs | Product, design, eng |
| **[07-rollout-plan.md](./07-rollout-plan.md)** | Phased migration from current monolith to target state without downtime | Eng leads, PM |

---

## The 60-second summary

**Today.** A single Next.js 14 app that does everything: server-renders pages,
talks to Supabase directly from route handlers, runs ad-hoc background jobs
inline, and has the KMHFR (Kenya Master Health Facility Registry) sync logic
tangled into the same process that serves user traffic. README still references
a ChatGPT extractor template — leftover scaffolding that needs to go.

**Target.** Three deployable units behind one ingress:

1. **`web`** — Next.js for the user-facing app. Stateless. Read-mostly.
   Horizontally scaled.
2. **`api`** — A small Fastify (or Hono on Node) service for write-heavy and
   long-running endpoints. Talks to the database **and** to Temporal.
3. **`worker`** — A Temporal worker process that runs all workflows and
   activities: KMHFR sync, review moderation, notifications, booking
   coordination, geocoding, periodic verification.

Backed by:

- **Supabase Postgres** (with PostGIS) — primary data store; tighter RLS.
- **Temporal Cloud** (or self-hosted Temporal on K8s) — durable execution.
- **Redis** — facility search cache, rate limiting, edge geo cache.
- **Object storage** (Supabase Storage or S3) — facility photos, exports.

**On Kubernetes.** Each unit is a `Deployment` with an `HPA`. `web` scales on
CPU + request concurrency, `worker` scales on Temporal task queue depth,
`api` on CPU + p95 latency. Single `Ingress` fronts them; a `Service` per
deployment internally.

**Refactor first, then scale.** The biggest win on day one isn't K8s — it's
extracting business logic out of route handlers into a `core/` package so the
same logic can be called from a Temporal activity, a CLI, or a future API.
See `02-refactor-plan.md`.

---

## What's in `../index.html`

The sibling prototype contains 10 clickable, responsive screens covering every
patient and admin flow we discussed: landing, service selection, location
capture, results (list + map), facility detail, write review, booking,
emergency triage, admin dashboard, and the offline fallback. It's a static
hi-fi reference — wire each screen up to the refactored API as you build it.
