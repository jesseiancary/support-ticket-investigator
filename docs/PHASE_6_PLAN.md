# Phase 6 — Evaluation, Edge Cases, Deployment & Polish

> **Goal:** Make the project credible and shippable: measure retrieval and answer
> quality, harden the edges, wire CI, deploy publicly on Railway, and polish the
> portfolio-facing documentation. This is what turns a demo into a job-winning piece.

## Learning objectives (secondary goal)

- How to measure retrieval relevance (recall@k, MRR)
- How to measure whether answers are actually grounded in evidence
- How to operate the system (CI, deploy, config, observability)

## Prerequisites

- [ ] Phases 1–5 complete; app runs locally via `make up`
- [ ] A Railway account (and the Railway integration available)

---

### PR 6.1 — RAG retrieval evaluation harness

**Objective:** Quantify retrieval quality against a labeled set.

- [ ] **Test-first:** unit tests for the metric functions (recall@k, MRR) with known inputs (red)
- [ ] Build a labeled eval set: queries → expected source chunks/documents (derived from the seed corpus)
- [ ] Implement an evaluator that runs retrieval and computes recall@k and MRR
- [ ] Wire it into the `/eval` command and a `pnpm eval:retrieval` script; print a metrics table
- [ ] Record baseline numbers in `docs/` (or README)

**Acceptance criteria**
- [ ] Metric functions are unit-tested and correct
- [ ] `/eval` prints retrieval metrics over the labeled set
- [ ] Baseline metrics are documented for comparison when tuning

---

### PR 6.2 — Answer-quality evaluation

**Objective:** Measure groundedness and citation coverage of generated reports.

- [ ] **Test-first:** tests for the groundedness/citation-coverage scorers on canned reports (red)
- [ ] Implement checks: every evidence item cites a retrieved chunk; proportion of claims backed by citations; schema validity rate
- [ ] Add `pnpm eval:answers`; summarize pass rates
- [ ] Document results and known failure modes

**Acceptance criteria**
- [ ] Reports are scored for groundedness and citation coverage
- [ ] Ungrounded/hallucinated citations are counted and reported
- [ ] Results are reproducible and documented

---

### PR 6.3 — Edge cases & resilience

**Objective:** Behave well when inputs or dependencies misbehave.

- [ ] **Test-first:** tests for each edge case below (red)
- [ ] Empty/low-relevance retrieval → report clearly states insufficient context + requests info (no fabrication)
- [ ] Oversized documents/tickets → handled by chunking + token-budget trimming without error
- [ ] Malformed inputs → typed 4xx responses with helpful messages
- [ ] OpenAI rate limits / 5xx → backoff + graceful degradation surfaced to the UI
- [ ] Centralized error handling middleware in the API

**Acceptance criteria**
- [ ] Each edge case is covered by a test and handled gracefully
- [ ] No unhandled rejections or stack traces reach the client
- [ ] The "not enough context" path never fabricates evidence

---

### PR 6.4 — CI/CD finalization

**Objective:** Finalize the CI pipeline that was built *incrementally* across earlier
phases and add continuous deployment. **CI is not created here** — the base workflow
landed in Phase 1 and was extended in Phases 2 (DB integration), 4 (hermetic LLM),
and 5 (web + E2E). This PR audits, hardens, and adds CD.

- [ ] Audit `ci.yml`: confirm all gates are present and sensibly ordered — lint, typecheck, unit, DB integration (Testcontainers), hermetic LLM, web, and Playwright E2E
- [ ] Add the eval jobs (PRs 6.1–6.2) as **non-blocking** CI steps: run on `main` or via `workflow_dispatch` only, since they may need API keys and incur cost — never gate routine PRs on them
- [ ] Cache the pnpm store and Playwright browsers for speed
- [ ] Add a `deploy.yml` workflow: on push to `main`, **after CI passes**, run migrations and deploy `api`/`web` to Railway (see PR 6.6)
- [ ] Gate deploy on green CI; source all secrets from Railway/GitHub secrets (never committed)
- [ ] Add CI **and** deploy status badges to the README

**Gate-scope note:** eval gates are deliberately non-blocking — coupling PR merges
to external API spend would violate the "gates protect only what's required" rule.

**Acceptance criteria**
- [ ] The full CI gate suite runs on PRs and blocks merge appropriately
- [ ] Deployment to Railway runs only after CI passes on `main`
- [ ] Eval jobs run (on main / dispatch) without blocking routine PRs
- [ ] CI and deploy badges reflect current status

---

### PR 6.5 — Portfolio screenshot capture (Playwright)

**Objective:** Generate polished, reproducible screenshots (and optionally a short
clip) of the app for the portfolio/README — produced by an E2E run so they stay
current. **Extends the Phase 5 Playwright setup (PRs 5.5–5.6); does not introduce it.**

- [ ] Add a dedicated Playwright **"portfolio" spec/project** (separate from the blocking happy-path E2E) that drives the full demo flow against the seeded stack: sample ticket → structured report → retrieval inspector → follow-up Q&A with a clicked citation
- [ ] Run it against a **deterministic seed + a stubbed/recorded LLM response** so images are stable and need no live API key
- [ ] Use a **fixed viewport + device scale factor** for crisp, consistent images (capture light/dark if the UI supports it)
- [ ] Capture full-page screenshots of each headline state into `assets/screenshots/`: landing, structured report (severity/category), **retrieval inspector (source/score/rank)**, follow-up Q&A with a highlighted citation
- [ ] (Optional, trim-if-tight) capture a short video/GIF of the end-to-end flow
- [ ] Add `pnpm screenshots` + a `make screenshots` target to regenerate them on demand
- [ ] Note that the images are build artifacts refreshed by the script — the **human** commits them (Claude never stages/commits)

**Acceptance criteria**
- [ ] `pnpm screenshots` regenerates a consistent image set with no live API dependency
- [ ] Screenshots cover the headline features (structured report + retrieval inspector + citations)
- [ ] Images are crisp (fixed viewport/scale) and deterministic across runs
- [ ] The README (PR 6.7) embeds these images

---

### PR 6.6 — Deploy to Railway

**Objective:** A public, running demo.

- [ ] Provision a Railway project with a PostgreSQL database and enable `pgvector`
- [ ] Deploy the `api` and `web` services (from the existing Dockerfiles)
- [ ] Configure env/secrets (`OPENAI_API_KEY`, `DATABASE_URL`) in Railway, not in git
- [ ] Run migrations and seed the production corpus as a release/one-off step
- [ ] Smoke-test the deployed `/api/retrieve` and `/api/investigate`
- [ ] Document the deploy steps (and note alternatives: Fly.io, Render + Neon)

**Acceptance criteria**
- [ ] The app is reachable at a public URL and completes the demo flow
- [ ] Secrets are managed in the platform, never committed
- [ ] Migrations + seed run cleanly against the hosted DB

---

### PR 6.7 — README, architecture diagram & demo polish

**Objective:** Make the repo sell the work in under two minutes.

- [ ] Top-level README: problem statement, live demo link, architecture diagram, RAG data-flow diagram, stack rationale, and the eval numbers
- [ ] **"Try it in 60 seconds"** section: public demo link + pre-seeded sample tickets so a hiring manager can evaluate it with **no setup and no API key**
- [ ] Embed the Playwright-generated screenshots from PR 6.5 — retrieval inspector + a generated report (and the GIF if captured)
- [ ] Document the Claude Code harness (`.claude/`) as a highlight — commands (incl. `/pr-reviewer` and `/pr`), agents, skills, TDD hooks
- [ ] "Run it locally in 3 commands" quickstart; "What I learned" section tying back to RAG concepts
- [ ] A short **"Scope & tradeoffs"** note framing it as a ~1-week portfolio piece (good and polished, not production-perfect)
- [ ] Final pass on copy, badges, and licensing

**Acceptance criteria**
- [ ] The README communicates the problem, solution, and skills at a glance
- [ ] The live demo link works and a hiring manager can complete the flow from a sample ticket with zero setup
- [ ] The Claude Code harness is called out as a deliberate engineering choice

---

## Definition of Done (Phase 6)

- [ ] Retrieval and answer-quality metrics exist, run via `/eval`, and are documented
- [ ] Edge cases are handled and tested; the full CI gate suite is green on every PR, and CD deploys from `main`
- [ ] A reproducible Playwright run generates polished portfolio screenshots of the headline features
- [ ] A public Railway deployment completes the full demo flow
- [ ] The README makes the project immediately legible and compelling to hiring managers
