# 06 — UX Rationale

> Why the prototype in `../index.html` looks the way it does. Each section
> maps a screen to the decisions behind it. Read alongside the prototype.

## North star

The primary user is **a patient researching insurance, services, and
hospitals ahead of need** — not someone mid-emergency. That changes
priorities:
- **Trust signals over flash.** Regulator-verified badges, "verified 2 days
  ago" freshness, real insurance acceptance data.
- **Comparison over selection.** Side-by-side facility cards, not a feed.
- **Confidence before action.** A patient should feel they could
  confidently recommend a facility to family before they call.

The emergency triage screen exists for the edge case, and it's the **only**
place we use red, big phone numbers, and direct-call CTAs.

## 01 Landing

A single search bar with three pivots — service / location / insurance —
not a hero with marketing copy. Below, three "what brings you here" cards
that match what we know users come for (research, urgent care, second
opinion).

The county list is shown explicitly because Kenyans navigate by county.
Don't bury it in a dropdown.

## 02 Service selection

Categorized grid (Primary care / Specialist / Maternity & child / Diagnostics
/ Mental health / Pharmacy). Within each category, services are tagged with
the **symptoms** that map to them ("chest pain → Cardiology / ER") because
patients search by symptom, not specialty name. This is the small
ontology that makes the search box useful for non-medical users.

## 03 Location capture

Three methods on equal footing — GPS, county+ward, or full address —
because:
- GPS is fastest on mobile with permission already granted.
- County+ward is what most Kenyans actually know about themselves.
- Full address is the fallback for diaspora or planning ahead.

We don't try to be clever about geolocation; we ask, with explanation.

## 04 Search results — list + map

Split-pane on desktop, tabs on mobile. The list owns the trust info
(insurance, hours, distance, freshness); the map owns spatial relationships.
**Hovering a card highlights its pin** — this is the single biggest UX win
over the current implementation, where the two panes feel disconnected.

Filters are visible by default (not behind a button) because filtering is
how users build confidence: "show me only NHIF + open now + within 5km".

## 05 Facility detail

Tabs: Overview / Reviews / Hours / Insurance / Photos. The overview leads
with the three things that fail patients today:
1. **Insurance acceptance** — community-verified, not just self-reported.
2. **Hours** — with last-verified date prominent.
3. **Phone & WhatsApp** — both, big, tap-to-call.

A "Book" CTA leads to the appointment workflow (Temporal-backed; see doc 03).

## 06 Write review

A 3-step form because asking everything on one screen kills completion.
Step 1: rating + service. Step 2: aspect breakdown + insurance acceptance.
Step 3: free-text + anonymous toggle (default on, because medical info is
sensitive).

The "anonymous by default" choice and the moderation warning (no personal
medical details) are deliberate. Reviews fuel trust; abuse kills it.

## 07 Emergency triage

Visually distinct: red border, big phone CTAs at the top. We do **not**
make the user search for emergency services — we surface them by default.
Below, a list of nearest 24/7 ERs with one-tap dial and current triage wait
times (fed by FacilityVerificationWorkflow + community signals).

The "Signs that need immediate help" copy is non-negotiable. It exists for
the rare worst case.

## 08 Admin / facility dashboard

Designed for **non-technical facility admins** (a clinic receptionist, not
a developer). KPI cards at top so they can answer "are people finding us?"
in 2 seconds. "Pending actions" list because the highest-leverage thing for
data quality is making outdated info easy to fix.

The **listing freshness** widget is the engagement loop: green bars feel
good, partial bars nudge updates. This is what keeps facility data alive.

## 09 Booking

Three sequential steps (date → time → details), each revealing the next on
selection. Confirmation screen makes clear we're brokering: "We've
forwarded your request to X. You'll receive an SMS confirmation within ~30
minutes." This sets the right expectation for the underlying Temporal
workflow — async, with retries — and the user doesn't feel orphaned.

The small "Powered by Temporal workflows" note at the bottom is for ops
debugging, not user benefit. Hide it in prod or move it to a dev tools
panel.

## 10 Offline fallback

This is where HudumaCare wins over generic competitors: **Kenya has
patchy coverage**. Cached recent facilities + saved facilities + emergency
numbers should always work. The SMS short-code (`FIND maternity Nakuru →
22829`) is the true-offline path; route that through Africa's Talking.

## Things we deliberately did NOT include

- A chatbot. Symptom→service mapping is small enough to be a static
  ontology. A chatbot adds complexity and a hallucination surface for a
  problem we don't have yet.
- Telehealth. Defer until a credible provider partnership exists.
- A marketplace. We're a trust layer, not a transaction layer (until the
  booking workflow proves out).
- Reviews from the home page. Reviews matter at the **decision point**
  (facility detail), not as social-feed bait.
- Gamification. Health is not a game.

## Visual system

- **Type:** Manrope throughout. JetBrains Mono for codes/references/data
  fragments. Two families is plenty.
- **Color:** Warm off-white ground (`oklch(0.985 0.006 85)`) instead of
  white — feels less clinical, more like a Kenyan reception area. Deep ink
  for text. Trust-teal for primary actions. Calm green only for
  verification states. **Red only for emergency.**
- **Density:** Generous, with `max-width: 1280px` on most pages. Reads well
  on a 1366×768 cyber-café screen and on a 360×640 phone.
- **Iconography:** Hand-drawn SVG icons in a thin, friendly stroke. No
  emoji.
- **Imagery:** Placeholders in the prototype. In production: encourage
  facilities to upload real photos via the admin dashboard (carrot:
  "photos +40% to discoverability").

## Accessibility commitments

- Minimum 16px body text, 24px on slide-like marketing.
- All interactive targets ≥ 44×44px.
- Color contrast WCAG AA throughout. Emergency screen contrast is AAA.
- Form labels associated with inputs.
- Focus rings visible (don't strip them).
- Translatable — wrap user-facing strings for i18n; Swahili is a fast-follow.
