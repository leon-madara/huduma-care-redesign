# 🏥 HudumaCare — Redesign Prototype

> **Huduma** (Swahili) — *service, care, assistance.*

A hi-fi clickable prototype and full engineering roadmap for a **Kenya-wide healthcare facility finder** — helping patients find hospitals, clinics, labs, pharmacies, and specialists near them, with real insurance acceptance data, verified hours, and appointment booking.

---

## ✨ What is this?

HudumaCare is a redesign of an existing Next.js healthcare platform. This repo contains:

- 🖥️ **A fully clickable hi-fi prototype** — 10 screens covering every patient and admin flow, built with React + Babel (no build step needed)
- 📐 **A complete engineering roadmap** — architecture, refactor plan, Temporal workflows, Kubernetes deployment, data model, UX rationale, and phased rollout plan — all in `docs/`

The prototype shows **what** the product should feel like. The docs explain **how** to ship it at scale without painting yourself into a corner.

---

## 🗺️ The 10 Screens

| # | Screen | Description |
|---|--------|-------------|
| 1 | 🏠 **Landing** | Search bar with service / location / insurance pivots. County-first navigation. |
| 2 | 🩺 **Service Selection** | Categorized grid with symptom-to-service mapping for non-medical users. |
| 3 | 📍 **Location Capture** | GPS, county+ward, or full address — three methods on equal footing. |
| 4 | 🔍 **Search Results** | Split-pane list + map. Filters visible by default. Card hover highlights map pin. |
| 5 | 🏢 **Facility Detail** | Insurance acceptance, verified hours, phone + WhatsApp, reviews, booking CTA. |
| 6 | ✍️ **Write Review** | 3-step form. Anonymous by default. Aspect ratings + insurance acceptance. |
| 7 | 📅 **Booking Request** | Date → time → details flow. Async broker model backed by Temporal workflows. |
| 8 | 🚨 **Emergency Triage** | Visually distinct. Nearest 24/7 ERs, one-tap dial, triage wait times. |
| 9 | ⚙️ **Admin Dashboard** | For facility admins (non-technical). KPIs, pending actions, listing freshness. |
| 10 | 📵 **Offline Fallback** | Cached facilities + saved facilities + emergency numbers. SMS short-code path. |

---

## 🚀 Running the Prototype

No install, no build step. Just open it:

```bash
# Clone the repo
git clone https://github.com/leon-madara/huduma-care-redesign.git
cd huduma-care-redesign

# Open in your browser
open index.html   # macOS
start index.html  # Windows
```

Or serve it locally:

```bash
npx serve .
# → http://localhost:3000
```

Navigate between screens using the sidebar. URL hash updates with each screen (`#results`, `#facility`, `#booking`, etc.) so you can deep-link directly.

---

## 🏗️ Target Architecture

The roadmap moves from a monolithic Next.js app to **three deployable units** behind a single ingress:

```
                    ┌─────────────────────────────┐
                    │   Ingress (NGINX / Traefik)  │
                    │   huduma.care · admin.*      │
                    └──────────┬──────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
     ┌────▼─────┐        ┌─────▼─────┐        ┌────▼─────┐
     │   web    │        │    api    │        │  worker  │
     │ (Next 14)│        │ (Fastify) │        │(Temporal)│
     └────┬─────┘        └──┬─────┬──┘        └────┬─────┘
          │                 │     │                 │
          └────────┬────────┘     └────────┬────────┘
                   │                       │
          ┌────────▼──────┐       ┌────────▼──────┐
          │ Supabase PG   │       │  Redis cache  │
          │ + PostGIS/RLS │       │  + rate limit │
          └───────────────┘       └───────────────┘
```

| Service | Role | Scales on |
|---------|------|-----------|
| `web` | Next.js — UI, SSR, read-mostly | CPU + request concurrency |
| `api` | Fastify — writes, starts workflows | CPU + p95 latency |
| `worker` | Temporal — all long-running work | Task queue depth (KEDA) |
| `webhook` | Hono — M-Pesa, SMS, KMHFR callbacks | Fixed (always up) |

---

## ⚡ Temporal Workflows

All multi-step, stateful, or human-in-the-loop work runs through [Temporal](https://temporal.io/):

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| 🔄 `KmhfrSyncWorkflow` | Daily 03:00 EAT | Syncs facility data from Kenya Master Health Facility Registry |
| 🛡️ `ReviewModerationWorkflow` | On review submit | Auto-moderation → human queue → publish/reject |
| 📅 `BookingCoordinationWorkflow` | On booking request | WhatsApp → SMS → coordinator escalation → alternates |
| 📢 `NotificationFanOutWorkflow` | Admin broadcast | Batched SMS fan-out for public health alerts |
| ✅ `FacilityVerificationWorkflow` | Weekly + on correction | Phone/SMS verification, freshness score update |
| 🌍 `GeocodingEnrichmentWorkflow` | On facility create/update | Geocode address → PostGIS index |

---

## 🗄️ Data Model Highlights

Built on **Supabase Postgres + PostGIS**:

- `facilities` — core table with `geography(point, 4326)` for spatial queries, `services text[]` + `insurances_accepted text[]` with GIN indexes
- `reviews` — moderation status, aspect ratings, insurance acceptance, Temporal workflow handle
- `booking_requests` — full booking lifecycle, facility response tracking
- `facility_corrections` — community-sourced data corrections
- `sync_runs` — KMHFR sync audit trail

Hot-path search uses `ST_DWithin` + service/insurance array overlap + open-now function, cached in Redis with 5-minute TTL.

---

## 📦 Monorepo Structure (target)

```
huduma-care/
├── apps/
│   ├── web/          # Next.js — UI only
│   ├── api/          # Fastify — write endpoints
│   ├── webhook/      # Hono — provider callbacks
│   └── worker/       # Temporal worker
├── packages/
│   ├── core/         # ⭐ all business logic, no framework deps
│   ├── db/           # Supabase client + generated types
│   ├── temporal/     # workflow + activity definitions
│   ├── schemas/      # shared Zod schemas
│   └── ui/           # shared React components
├── infra/
│   ├── k8s/          # Helm charts + manifests
│   ├── terraform/    # cluster + managed services
│   └── migrations/   # Supabase SQL migrations
└── docs/             # 📖 engineering companion docs
```

The `packages/core/` extraction is the single biggest win — business logic becomes callable from Temporal activities, CLIs, and tests without spinning up Next.js.

---

## 📋 Rollout Phases

| Phase | Duration | Goal |
|-------|----------|------|
| **P1** Refactor | 2 weeks | Extract `packages/core/`, all route handlers < 20 lines |
| **P2** Visual refresh | 2 weeks | Ship redesigned UI behind feature flag |
| **P3** API split | 1 week | `apps/api` owns all write endpoints |
| **P4** Temporal | 2 weeks | KMHFR sync + review moderation in production |
| **P5** Kubernetes | 1 week | Full K8s migration, DNS cutover |
| **P6** Scale | Ongoing | Booking workflow, Redis cache, SMS short-code, Swahili |

---

## 🎨 Design System

- **Typefaces:** Manrope (UI) + JetBrains Mono (codes/data)
- **Ground color:** Warm off-white `oklch(0.985 0.006 85)` — less clinical, more welcoming
- **Accent:** Trust-teal for primary actions, calm green for verification states
- **Red:** Emergency screen only — never decorative
- **Density:** `max-width: 1280px`, readable on a 1366×768 cyber-café screen and a 360×640 phone
- **Accessibility:** WCAG AA contrast throughout, AAA on emergency screen, all targets ≥ 44×44px

---

## 📚 Engineering Docs

| Doc | Contents |
|-----|----------|
| [`docs/01-architecture.md`](docs/01-architecture.md) | Target architecture, traffic flows, capacity targets |
| [`docs/02-refactor-plan.md`](docs/02-refactor-plan.md) | 4-phase refactor with before/after code examples |
| [`docs/03-temporal-workflows.md`](docs/03-temporal-workflows.md) | Every workflow with activity signatures and retry policies |
| [`docs/04-kubernetes-deployment.md`](docs/04-kubernetes-deployment.md) | K8s manifests, HPA, ingress, secrets, CI/CD |
| [`docs/05-data-model.md`](docs/05-data-model.md) | Full Postgres schema, RLS policies, hot-path query |
| [`docs/06-ux-rationale.md`](docs/06-ux-rationale.md) | Design decisions and trade-offs for every screen |
| [`docs/07-rollout-plan.md`](docs/07-rollout-plan.md) | Phased migration plan, anti-goals, definition of done |

---

## 🛠️ Tech Stack

**Prototype**
- React 18 (UMD, no build step)
- Babel Standalone
- Manrope + JetBrains Mono (Google Fonts)

**Target production stack**
- Next.js 14, Fastify, Hono, Temporal
- Supabase Postgres + PostGIS
- Redis, Kubernetes (GKE/EKS/DOKS)
- Africa's Talking (SMS/WhatsApp), M-Pesa
- Prometheus + Grafana + Loki, Sentry
- Argo CD, External Secrets Operator, KEDA

---

## 🌍 Kenya-specific context

- Facilities sourced from **KMHFR** (Kenya Master Health Facility Registry) — 47 counties
- Insurance data covers **NHIF/SHA**, AAR, Jubilee, CIC, Britam, Madison, APA, Old Mutual, and more
- **Offline-first** fallback for patchy coverage — SMS short-code `FIND maternity Nakuru → 22829`
- County-first navigation because Kenyans navigate by county
- Swahili i18n is a fast-follow (strings extracted from P2)

---

## 📄 License

MIT

---

<div align="center">
  <sub>Built with ❤️ for Kenya's healthcare ecosystem</sub>
</div>
