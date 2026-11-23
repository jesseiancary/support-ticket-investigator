# Phase 5 — React Frontend

> **Goal:** A clean, demoable web UI that makes the RAG system legible to hiring
> managers: submit a ticket, read the structured report, **inspect the exact chunks
> that were retrieved (source, content, score, rank)**, and explore via follow-up Q&A
> with clickable citations.
>
> The retrieval inspector (PR 5.3) is the piece reviewers remember — build it well.

## Prerequisites

- [ ] Phase 3 (`POST /api/retrieve`) and Phase 4 (`/api/investigate`, follow-up) complete
- [ ] Shared Zod schemas in `packages/shared` are the single source of truth for all cross-package types (API request/response shapes, the `sourceType` enum, retrieval-result and report contracts) — per the Phase 1 ground rule; the web app infers its types from them and never re-declares a shape

## Stack

React + Vite + TypeScript, TanStack Query (server state), Tailwind (styling),
React Testing Library (components), Playwright (one E2E happy path).

---

### PR 5.1 — App shell & typed API client

**Objective:** A running, containerized React app that talks to the API with shared types.

- [ ] **Test-first:** a component test rendering the shell + a smoke test for the API client parsing a mocked response via shared schemas (red)
- [ ] Scaffold Vite + React + TS + Tailwind in `packages/web`
- [ ] Build a typed API client whose request/response types come from `packages/shared` Zod schemas (parse/validate responses); its base URL comes from a build-time `VITE_API_URL`, defaulting to the dev proxy / same origin
- [ ] Set up TanStack Query provider + base layout/navigation
- [ ] **Replace the Phase 1 placeholder `web` container with the real Vite build:** update the existing `web` multi-stage Dockerfile — the build stage runs `vite build`, and the runtime stage serves the static `dist/` from **`nginx:alpine`** with an `nginx.conf` providing **SPA history fallback** (unknown routes → `index.html`). In dev, use the Vite dev server proxying `/api` to the `api` service in the compose network. Rewire the `docker-compose.yml` `web` service accordingly (placeholder swapped out, not created)

**Acceptance criteria**
- [ ] `make up` serves the web app; it reaches the API in the compose network (dev proxy)
- [ ] The production web image serves the built SPA via `nginx` with working SPA history fallback
- [ ] The API client's base URL is configurable via `VITE_API_URL` (no hard-coded host)
- [ ] API responses are validated against shared schemas client-side
- [ ] Shell renders and the smoke tests pass

---

### PR 5.2 — Ticket submission & report view

**Objective:** Submit a ticket and render the structured investigation report.

- [ ] **Test-first:** component tests for the form (validation) and the report renderer (mocked report) (red)
- [ ] Ticket submission form with client-side validation (shared schema)
- [ ] One-click **sample tickets** (pre-filled examples, including the payment-timeout demo) so a hiring manager can try the app without composing a ticket
- [ ] Report view rendering category, severity (color-coded), suspected cause, recommended actions, and "additional information needed"
- [ ] Loading/empty/error states (including the legitimate "no relevant context found" case)

**Acceptance criteria**
- [ ] Submitting the demo payment ticket renders a complete report
- [ ] A reviewer can run the full flow from a pre-loaded sample ticket in one click (no typing, no API key)
- [ ] Severity/category are visually distinct and accessible
- [ ] All states (loading/empty/error) are handled and tested

---

### PR 5.3 — Retrieval inspector UI (headline feature)

**Objective:** Show the chunks that fed the LLM — source, content, similarity, rank.

- [ ] **Test-first:** component tests rendering a ranked chunk list with score/source/rank from a mocked `/api/retrieve` response (red)
- [ ] A panel that calls `POST /api/retrieve` and lists each chunk with: rank, source type badge, document title, content snippet (expandable to full), and similarity score (as a bar or percentage)
- [ ] Show the effective retrieval config (topK, threshold, filters) so the retrieval is transparent
- [ ] Allow toggling source-type filters and re-running retrieval live

**Acceptance criteria**
- [ ] A reviewer can see exactly what context the model received, ranked and scored
- [ ] Filters update the displayed chunks
- [ ] This view works standalone (independent of generating a report)

---

### PR 5.4 — Follow-up Q&A & citation links

**Objective:** Explore causes conversationally; connect evidence to its source chunk.

- [ ] **Test-first:** component tests for the chat panel and for citation-click highlighting the referenced chunk (red)
- [ ] A follow-up chat panel posting to the follow-up endpoint and rendering grounded answers
- [ ] Make each report evidence citation clickable: clicking scrolls to / highlights the corresponding chunk in the inspector
- [ ] Render follow-up answer citations the same way

**Acceptance criteria**
- [ ] Follow-up answers appear with resolvable citations
- [ ] Clicking a citation highlights its source chunk in the inspector
- [ ] Interaction is covered by component tests

---

### PR 5.5 — Component & E2E tests

**Objective:** Lock in behavior and provide a demoable end-to-end path.

- [ ] Fill any component-test gaps from PRs 5.1–5.4 (RTL)
- [ ] One Playwright E2E: submit the demo ticket → see report → open inspector → ask a follow-up → click a citation
- [ ] Wire the E2E into the test scripts (runs against the compose stack or a mocked API)

**Acceptance criteria**
- [ ] The Playwright happy path passes reliably
- [ ] Components have meaningful coverage (not just render smoke tests)
- [ ] The demo flow is reproducible for a reviewer

---

### PR 5.6 — CI gates: web component tests + E2E

**Objective:** Extend CI with the gates that only now have something to run: the web
**component tests (RTL)** and the Playwright **E2E** happy path. **`web` lint,
typecheck, and build already gate the package workspace-wide since Phase 1 (PR 1.3) —
those are not re-added here; this phase adds only the test gates, because the web
tests first exist now.**

- [ ] Add the web **component-test** gate to `ci.yml`: run `web` RTL component tests (lint/typecheck/build are already workspace-wide gates from Phase 1 — do not duplicate them)
- [ ] Add a Playwright E2E job: cache + install browsers, run the happy-path spec against the compose stack or a mocked API
- [ ] Upload Playwright traces/screenshots as artifacts on failure
- [ ] Blocking policy: web component tests **block**; the E2E happy path **blocks** (allow a bounded flaky-retry). (web lint/typecheck/build already block via the Phase 1 gates.)
- [ ] **Gate-scope note (document in-workflow):** web **component + E2E** gates were intentionally absent before this phase — there were no web tests to run yet (web lint/typecheck/build have gated the placeholder package since Phase 1)

**Acceptance criteria**
- [ ] CI runs web component tests on every PR (web lint/typecheck/build already covered since Phase 1)
- [ ] The Playwright happy path runs in CI and blocks on failure
- [ ] Failure artifacts (traces/screenshots) are retained for debugging

---

## Definition of Done (Phase 5)

- [ ] A hiring manager can run `make up`, open the app, and complete the full flow
- [ ] The retrieval inspector clearly exposes source / content / score / rank
- [ ] Citations link evidence to the exact retrieved chunk
- [ ] Frontend types are derived from shared Zod schemas (no drift from the API)
- [ ] CI now gates the web component tests (RTL) and the Playwright E2E happy path (web lint/typecheck/build have been gated workspace-wide since Phase 1)
