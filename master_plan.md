# AI Analytics & Content Intelligence Platform — Master Development Plan

**Type:** POC / MVP build plan
**Approach:** Vertical slice first (one working end-to-end flow), then breadth
**Scope rule:** Only PRD sections with an explicit FR tag are in scope. Untagged sections (Monitoring, Security Requirements, Testing, CI/CD) are deferred — see Section 9.

---

## 1. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| App framework | Next.js (App Router) | Single codebase for frontend + API routes |
| CMS + data layer | Payload CMS 3.0, embedded in the Next.js app | Not just content — used as the primary data layer for the whole app (see Section 3) |
| Database | Postgres (Neon or Supabase, free tier) | Payload's native Postgres adapter, no separate ORM |
| Auth | Auth.js (NextAuth) — email/password, Google, GitHub | Sessions synced into Payload's Users collection |
| AI | Claude/GPT API via Vercel AI SDK | One SDK, reused for generation, SEO recommendations, and chatbot |
| Search | Meilisearch Cloud (free tier) | Typo tolerance + search-as-you-type built in, no manual analyzer config |
| Cache | Upstash Redis (free tier) | Serverless-friendly, no server process to manage |
| Billing | Stripe (test mode), hosted Checkout + Customer Portal | Avoids building custom billing UI |
| Deployment | Vercel (free tier) | One deploy covers app, API, and Payload admin panel |

---

## 2. FR Coverage Map

| PRD Section | FRs | In this plan? |
|---|---|---|
| Authentication | FR-1 | Yes — Phase 1 |
| Content Management | FR-2, FR-3 | Yes — Phase 2 |
| AI Content Generation | FR-4, FR-5, FR-6 | Yes — Phase 3 |
| Streaming UI | FR-7, FR-8 | Yes — Phase 3 |
| SEO Analysis Engine | FR-9, FR-10 | Yes — Phase 4 |
| Search Engine | FR-11 | Yes — Phase 5 |
| Analytics Dashboard | FR-12, FR-13 | Yes — Phase 6 |
| AI Assistant | FR-14 | Yes — Phase 7 |
| Stripe Integration | FR-15, FR-16 | Yes — Phase 8 |
| Performance Optimization | FR-17 | Yes — Phase 9 |
| User Roles | *(no FR, but implied by FR-1 and FR-3)* | Yes — folded into Phase 1 |
| Monitoring, Security, Testing, CI/CD | *(no FR)* | Deferred — Section 9 |

---

## 3. Core Architecture Decisions

These apply across every phase below, so stating them once up front:

- **Payload is the single data layer, not just "the CMS."** Users, Content, SEOScores, AnalyticsEvents, SearchHistory, and DashboardPreferences are all modeled as Payload collections. This gets an admin UI and a REST/GraphQL API for free on every entity, and avoids running a second ORM (e.g. Prisma) alongside Payload's own.
- **Auth.js owns the OAuth handshake; Payload's Users collection owns identity.** On sign-in, the session is synced into a Payload user record via Payload's Local API, so every other collection (Content, AnalyticsEvents, etc.) can reference one canonical user ID.
- **One streaming code path, three surfaces.** The Vercel AI SDK integration built in Phase 3 for content generation is reused as-is for SEO recommendation text (Phase 4) and the chatbot (Phase 7) — not rebuilt three times.
- **Search sync happens via a Payload hook, not a separate job.** An `afterChange` hook on the Content collection pushes to Meilisearch whenever content is published or edited — no cron, no queue.
- **Billing UI is Stripe's, not custom-built.** Hosted Checkout for upgrades and the Customer Portal for self-service management/invoices cover FR-15/16 without a custom billing screen.

---

## 4. Phase 0 — Foundation & Setup

Goal: a deployed, empty skeleton that proves the hosted-only pipeline works before any feature work starts. This is important because local Docker isn't part of this build — the app needs to prove it runs on free-tier hosted infra from day one, not at the end.

### 4.1 Repo & app scaffold
Initialize a Next.js (App Router, TypeScript) project. Set up the base folder structure: `app/`, `collections/` (Payload), `lib/`, `components/`. Add `.env.example` covering every credential this plan will eventually need.

### 4.2 Embed Payload CMS
Install `@payloadcms/next` and `@payloadcms/db-postgres`. Configure `payload.config.ts`, mount the admin route (`/admin`) and the Payload API route inside the Next.js app. Confirm the admin panel boots locally against a provisioned database.

### 4.3 Provision hosted infra (free tiers)
Create accounts/instances for: Postgres (Neon or Supabase), Upstash Redis, Meilisearch Cloud, Stripe (test mode), an LLM API key (Anthropic or OpenAI), and a Vercel project. Populate real values into `.env.local` and Vercel's environment settings.

### 4.4 Base Users collection
Define the Payload Users collection with `auth: true` and a `role` field (`visitor | author | editor | admin`), defaulting new users to `visitor`.

### 4.5 Deploy the skeleton
Push the empty app (admin panel + a placeholder homepage) to Vercel. Confirm the live URL works end-to-end against the hosted Postgres instance. **This checkpoint should pass before Phase 1 starts** — it's the point where "does the free-tier-only, no-local-Docker approach actually work" gets answered.

---

## 5. Phase 1 — Auth & Roles *(FR-1)*

### 5.1 Configure Auth.js providers
Set up credentials (email/password), Google OAuth, and GitHub OAuth providers in Auth.js.

### 5.2 Sync sessions into Payload
On successful sign-in, upsert the user into Payload's Users collection via the Local API, so there's one identity record regardless of which provider was used.

### 5.3 Role-based access control
Add route/action guards based on the `role` field: authors can create content, editors can approve/publish, admins manage settings. Keep this to simple conditional checks — not a full permissions framework, since Section 3 (User Roles) has no FR of its own beyond enabling FR-1 and FR-3.

### 5.4 Auth UI
Build login/signup pages, OAuth sign-in buttons, and a session-aware navigation bar.

---

## 6. Phase 2 — CMS Core *(FR-2, FR-3)*

### 6.1 Content collection
Define content in Payload as a single unified `Content` collection with a `type` field (`blog | guide | faq | tutorial | landing-page`) rather than five separate collections. This keeps the AI generation, SEO scoring, and search-indexing code (Phases 3–5) working against one shape instead of five.

### 6.2 Draft/publish workflow
Use Payload's native drafts & versioning (built in, don't hand-roll a status machine) with a `published` boolean plus Payload's draft system. Publishing is restricted to the `editor`/`admin` roles per Phase 1.

### 6.3 Author-facing content UI
Build a frontend authoring screen outside `/admin` — end users (authors/editors) shouldn't need to touch Payload's admin panel directly. This is the screen that will later host the AI generation and SEO panels.

### 6.4 Public content pages
Basic list and detail pages for visitors to browse published content.

---

## 7. Phase 3 — AI Content Generation & Streaming *(FR-4, FR-5, FR-6, FR-7, FR-8)*

This is the core differentiator of the build — get it solid, since it's reused in Phases 4 and 7.

### 7.1 Vercel AI SDK integration
Wire a Route Handler using `streamText` (or equivalent) connected to the LLM API, returning a proper streamed response.

### 7.2 Prompt templates
One template per generation type: title, outline, article, FAQ, summary. Store these as a Payload collection (`PromptTemplates`) rather than hardcoded strings — makes them editable without a redeploy, and it's effectively free since Payload is already the data layer.

### 7.3 Model selection
A dropdown in the generation UI to pick provider/model, passed through to the AI SDK call at request time.

### 7.4 Streaming UI
Progressive rendering component consuming the SSE stream, with a typing-indicator animation while tokens arrive. **Watch for:** on Vercel, streaming responses generally need the Node runtime rather than Edge depending on the SDK/provider combo — confirm this early, since a misconfigured runtime silently buffers the whole response instead of streaming it.

### 7.5 Wire into the content editor
Generated output saves directly into a `Content` record from Phase 2, as a draft ready for review.

---

## 8. Phase 4 — SEO Analysis Engine *(FR-9, FR-10)*

### 8.1 Rule-based scorer
Deterministic checks: keyword density, heading hierarchy (H1/H2 structure), meta tag presence/length, internal link count, and a readability score (Flesch-Kincaid via a small npm package — no need to implement the formula by hand).

### 8.2 AI-generated recommendations
A second LLM call (reusing the Phase 3 AI SDK setup) that takes the rule-based findings plus the content itself and produces human-readable improvement suggestions. Deterministic scoring + AI commentary on top, rather than either alone.

### 8.3 Score display UI
A panel attached to the content editor showing the score breakdown and recommendations.

### 8.4 Persistence
Store scores as a field group on `Content` or a linked `SEOScores` collection — whichever keeps querying simplest for the analytics dashboard in Phase 6.

---

## 9. Phase 5 — Search *(FR-11)*

### 9.1 Meilisearch index
Define an index schema mirroring the searchable fields of `Content` (title, body, type, tags, published date).

### 9.2 Sync on publish
A Payload `afterChange` hook on `Content` pushes/updates the corresponding Meilisearch document whenever content is published or edited.

### 9.3 Search UI
Search bar using Meilisearch's built-in typo tolerance (fuzzy matching) and search-as-you-type (autosuggest), plus filters (content type, date range, tags).

### 9.4 Search history
Log queries per user in a `SearchHistory` Payload collection; surface a simple "recent searches" list in the UI.

---

## 10. Phase 6 — Analytics Dashboard *(FR-12, FR-13)*

This is self-built end to end — no third-party analytics service (see conversation note on Mixpanel: the PRD names it as a product category, not a required dependency; FR-12 explicitly says "build").

### 10.1 Event capture
A lightweight client-side tracking call on key actions (page view, content view, search performed, AI generation used), hitting an API route that writes to an `AnalyticsEvents` Payload collection.

### 10.2 Aggregation queries
Server-side functions computing each metric: traffic over time, top content, a conversion proxy, keyword-ranking proxy (from search click-throughs), and content performance.

### 10.3 Dashboard UI
Recharts or ECharts components for each chart type listed in FR-12.

### 10.4 Date filtering
A date-range picker wired into the aggregation queries from 10.2.

### 10.5 Custom dashboards & widget management
Keep this deliberately minimal — this is the most open-ended part of the FR list. A toggle for which widgets are visible plus basic reordering, with the layout stored as a JSON field (e.g. on a `DashboardPreferences` collection or the user record), is enough to satisfy FR-13 without turning into its own product.

---

## 11. Phase 7 — AI Assistant / Chatbot *(FR-14)*

### 11.1 Chat UI
Reuses the streaming component built in Phase 3.

### 11.2 Context injection
Relevant content/SEO/analytics data is pulled into the system prompt so answers are grounded — e.g. a "rewrite this paragraph" request needs the actual paragraph text passed in, not just a generic instruction.

### 11.3 Three capability modes
Content suggestions, SEO recommendations, and content rewriting, selectable as distinct modes within the same chat UI rather than three separate interfaces.

---

## 12. Phase 8 — Stripe Billing *(FR-15, FR-16)*

### 12.1 Plan setup
Define Free/Creator/Business plans with monthly and annual prices directly in the Stripe dashboard.

### 12.2 Hosted Checkout
Upgrade flow uses Stripe's hosted Checkout page — no custom payment form.

### 12.3 Customer Portal
Stripe's hosted Customer Portal covers subscription management and invoice access (FR-16) without custom UI.

### 12.4 Webhook handler
A Route Handler receiving Stripe events (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`), syncing plan/status onto the corresponding Payload user record. Since local dev is out of scope here, this gets tested against the live Vercel deployment rather than via Stripe CLI forwarding.

### 12.5 Coupons
Enabled through Stripe Checkout's built-in promo code support — no custom code needed.

### 12.6 Plan gating
One visible enforcement point (e.g. an AI generation quota tied to plan tier), so the billing tier demonstrably does something rather than just existing as a database field.

---

## 13. Phase 9 — Performance *(FR-17)*

### 13.1 Caching
Upstash Redis in front of expensive reads — search results and aggregated analytics queries — with a short TTL.

### 13.2 Lazy loading & code splitting
`next/dynamic` for heavy components (dashboard charts, the chat widget), leaning on Next.js's automatic code splitting rather than manual config.

### 13.3 Debouncing
Applied to the search-as-you-type input and autosuggest calls from Phase 5.

### 13.4 Infinite scroll
Applied to the content list and search results pagination.

---

## 14. Phase 10 — Integration Pass & Deployment

### 14.1 End-to-end smoke pass
Walk the full vertical slice manually: create content → generate an AI draft → get an SEO score → publish → find it via search → confirm it shows up in the analytics dashboard → ask the chatbot about it. This is the single most important checkpoint — it's the difference between a demo and a pile of disconnected features.

### 14.2 Environment audit
Confirm every credential from Phase 0's `.env.example` is set correctly in Vercel's production environment.

### 14.3 Demo/seed data
Seed a handful of realistic content records and a demo user account so the deployed app is immediately presentable, not empty on first load.

---

## 15. Explicitly Out of Scope (No FR Tag)

Deferred, not abandoned — revisit only after the FR-tagged scope above is solid:

- **Monitoring** — Sentry, SonarQube
- **Security Requirements** — CORS, CSP, rate limiting, XSS/CSRF hardening
- **Testing** — the 80% unit coverage target, the E2E test suite
- **CI/CD** — the build/test/lint/sonar/docker/deploy pipeline

---

## 16. Known Risk Points

| Phase | Risk | Mitigation |
|---|---|---|
| 0 | Hosted-only pipeline (no local Docker) might hit friction | Deploy the empty skeleton first; don't build features against an unproven pipeline |
| 3 | SSE streaming can silently buffer on the wrong Vercel runtime | Confirm Node vs Edge runtime against the AI SDK/provider combo before building the UI on top of it |
| 6 | Widget management (FR-13) is open-ended and can scope-creep | Cap it at toggle + reorder; resist adding a full drag-and-drop dashboard builder |
| 8 | Stripe webhooks need a public endpoint | Test against the live Vercel URL directly, since local CLI forwarding isn't part of this workflow |