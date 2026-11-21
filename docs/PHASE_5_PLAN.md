# Phase 5 — React Frontend

> **Goal:** A clean, demoable web UI that makes the RAG system legible to hiring
> managers: submit a ticket, read the structured report, **inspect the exact chunks
> that were retrieved (source, content, score, rank)**, and explore via follow-up Q&A
> with clickable citations.
>
> The retrieval inspector (PR 5.3) is the piece reviewers remember — build it well.

## Prerequisites

- [ ] Phase 3 (`POST /api/retrieve`) and Phase 4 (`/api/investigate`, follow-up) complete
- [ ] Shared Zod schemas in `packages/shared` are the single source of truth for API types

## Stack

React + Vite + TypeScript, TanStack Query (server state), Tailwind (styling),
React Testing Library (components), Playwright (one E2E happy path).

---

### PR 5.1 — App shell & typed API client

**Objective:** A running, containerized React app that talks to the API with shared types.

- [ ] **Test-first:** a component test rendering the shell + a smoke test for the API client parsing a mocked response via shared schemas (red)
- [ ] Scaffold Vite + React + TS + Tailwind in `packages/web`
- [ ] Build a typed API client whose request/response types come from `packages/shared` Zod schemas (parse/validate responses)
- [ ] Set up TanStack Query provider + base layout/navigation
- [ ] Add the `web` multi-stage Dockerfile and wire it into `docker-compose.yml` (dev proxy to `api`)

**Acceptance criteria**
- [ ] `make up` serves the web app; it reaches the API in the compose network
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

### PR 5.6 — CI gates: web package + E2E

**Objective:** Extend CI to cover the new `web` package and the Playwright happy
path. **These gates land now because the frontend first exists in this phase.**

- [ ] Add web gates to `ci.yml`: `web` lint, typecheck, component tests (RTL), and `web` build
- [ ] Add a Playwright E2E job: cache + install browsers, run the happy-path spec against the compose stack or a mocked API
- [ ] Upload Playwright traces/screenshots as artifacts on failure
- [ ] Blocking policy: web lint/typecheck/component tests/build **block**; the E2E happy path **blocks** (allow a bounded flaky-retry)
- [ ] **Gate-scope note (document in-workflow):** web + E2E gates intentionally absent before this phase — there was no frontend to protect

**Acceptance criteria**
- [ ] CI runs web lint/typecheck/test/build on every PR
- [ ] The Playwright happy path runs in CI and blocks on failure
- [ ] Failure artifacts (traces/screenshots) are retained for debugging

---

## Definition of Done (Phase 5)

- [ ] A hiring manager can run `make up`, open the app, and complete the full flow
- [ ] The retrieval inspector clearly exposes source / content / score / rank
- [ ] Citations link evidence to the exact retrieved chunk
- [ ] Frontend types are derived from shared Zod schemas (no drift from the API)
- [ ] CI now gates the web package (lint/typecheck/test/build) and the Playwright E2E happy path
