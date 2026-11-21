# Phase 1 — Claude Code Dev Harness & Project Foundation

> **Goal:** Stand up the development environment that will build the rest of the
> project: a fully containerized pnpm monorepo wired for Test-Driven Development,
> plus a complete Claude Code harness (`.claude/` folder) that encodes the project's
> conventions, enforces TDD, and demonstrates mastery of Claude Code to reviewers.
>
> This phase ships **no product features**. It ships the machine that builds them.

## Why this phase is first

The project's primary purpose is to attract hiring managers. A clean, opinionated
Claude Code harness — custom commands, subagents, skills, and TDD-enforcing hooks —
is itself a portfolio artifact that signals you can operate an agentic coding
workflow, not just write code. Building it first also means every later phase is
developed through the same disciplined, test-first loop.

## Project ground rules (apply to every phase)

- **This is a portfolio project, not a production app.** Target **≤ 1 week** of build
  time. Aim for *polished and good quality*, not perfect — favor a clear, working,
  well-tested demo over exhaustive completeness.
- **Hiring managers must be able to try it with zero setup.** Ship **seed/sample
  data** plus a **public demo** (Phase 6) and one-click sample tickets (Phase 5) so a
  reviewer can evaluate it without an API key or local install.
- **Git is human-owned. Claude never creates branches, stages, commits, or pushes.**
  The `/pr` command (PR 1.3) only emits copy-paste PR text; the human performs all git
  operations. The permission allowlist must not include `git add`/`commit`/`branch`/`push`.
- **If time-constrained, these are safe to trim** to hit the week budget: the
  blocking happy-path Playwright E2E gate (Phase 5, PRs 5.5–5.6) and the depth of
  answer-quality eval (Phase 6, PR 6.2). Keep the retrieval eval, the hermetic test
  suite, the seed-data demo, and the **portfolio screenshot capture (Phase 6, PR 6.5)**
  — it produces the images the portfolio needs (and gives Playwright a home even if
  the blocking E2E is cut).

## Prerequisites

- [ ] Docker + Docker Compose installed
- [ ] Node.js 22 + `corepack enable` (for pnpm)
- [ ] An OpenAI API key available (not needed to pass Phase 1 tests, but set the env var now)

## Tech baseline locked in this phase

| Concern | Choice |
|---|---|
| Runtime | Node.js 22 + TypeScript (strict) |
| Monorepo | pnpm workspaces — `packages/shared`, `packages/api`, `packages/web` |
| Test runner | Vitest + Supertest; Testcontainers for DB integration (used from Phase 2) |
| Lint/format | ESLint + Prettier |
| Containers | `docker-compose` (postgres+pgvector, api, web) + multi-stage Dockerfiles |

---

### PR 1.1 — Repo & monorepo scaffolding

**Objective:** A containerized pnpm monorepo that boots and runs a passing smoke test.

- [ ] Initialize pnpm workspace (`pnpm-workspace.yaml`) with `packages/*`
- [ ] Create `packages/shared`, `packages/api`, `packages/web` with per-package `package.json` + `tsconfig.json`; root `tsconfig.base.json` (strict mode)
- [ ] Add ESLint + Prettier config at the root; shared rules
- [ ] Add Vitest at the root with workspace projects
- [ ] **Test-first:** write `packages/shared/src/health.test.ts` asserting a trivial `health()` returns `"ok"` (red)
- [ ] Implement `health()` to make it pass (green)
- [ ] Author `docker-compose.yml`: `db` (`pgvector/pgvector:pg16`), `api`, `web` services with volumes + a shared network
- [ ] Add multi-stage `Dockerfile` for `api` and `web` (deps → build → runtime)
- [ ] Add a `Makefile` with `up`, `down`, `test`, `lint`, `typecheck`, `logs` targets
- [ ] Add `.env.example` documenting `OPENAI_API_KEY`, `DATABASE_URL`, ports

**Acceptance criteria**
- [ ] `make up` starts all three containers; `db` reports healthy
- [ ] `make test` runs Vitest and the smoke test passes
- [ ] `make lint` and `make typecheck` pass with zero errors

---

### PR 1.2 — `CLAUDE.md` + `.claude/settings.json`

**Objective:** Encode project context and a safe permission profile for Claude Code.

- [ ] Write `CLAUDE.md`: project overview, architecture diagram (ASCII), package layout, naming conventions, **the TDD workflow (red → green → refactor)**, and how to run the stack
- [ ] Document the "tests-first, always" rule and the PR conventions in `CLAUDE.md`
- [ ] Document the **git ground rule** in `CLAUDE.md`: Claude never creates branches, stages, commits, or pushes — the human owns all git operations; `/pr` only emits copy-paste PR text
- [ ] Document the **project scope** in `CLAUDE.md`: portfolio piece (not production), ~1-week budget, "polished and good, not perfect," and that seed/sample data + a public demo are how hiring managers evaluate it
- [ ] Create `.claude/settings.json` with a permission allowlist for routine **read-only** commands (`pnpm *`, `docker compose *`, `make *`, `drizzle-kit generate`/`migrate`, read-only git: `git status`/`diff`/`log`)
- [ ] Explicitly **do not** allowlist `git add`/`commit`/`branch`/`push` — these stay human-owned
- [ ] Set project env defaults in settings (non-secret only)

**Acceptance criteria**
- [ ] `CLAUDE.md` describes the full dev loop, the git ground rule, and the project scope
- [ ] Routine `pnpm`/`docker`/`make` commands run without permission prompts
- [ ] No secrets are committed in `settings.json`
- [ ] No git write operations (`add`/`commit`/`branch`/`push`) are allowlisted

---

### PR 1.3 — Custom slash commands (`.claude/commands/`)

**Objective:** One-command workflows for the repetitive loops of this project.

**Core workflow commands**
- [ ] `/tdd` — drive a strict red→green→refactor cycle for a named unit (write failing test first, confirm red, implement, confirm green, refactor)
- [ ] `/new-endpoint` — scaffold an Express route + Zod request/response schema + Supertest spec (test first)
- [ ] `/migrate` — generate + apply a Drizzle migration and its Testcontainers integration test
- [ ] `/eval` — run the RAG evaluation harness (wired for real in Phase 6) and print metrics
- [ ] `/review` — lightweight pre-flight: run lint + typecheck + the full test suite and summarize the diff (fast gate; distinct from the deeper `/pr-reviewer`)

**Review & PR commands**
- [ ] `/pr-reviewer` — **read-only** review of **all uncommitted changes** (staged + unstaged + untracked). Reports findings grouped by severity (**Critical / High / Medium / Low**), each with `file:line`, an explanation, and a suggested fix. It checks for:
  - [ ] Deviation from the phase plan in `docs/` (scope creep, skipped tests, unmet acceptance criteria)
  - [ ] Deviation from industry standards (naming, structure, error handling, basic security)
  - [ ] Deviation from 3rd-party library recommended usage (OpenAI SDK, Drizzle, Zod, Express, React/TanStack Query, Testcontainers)
  - [ ] Potential bugs (logic errors, unhandled rejections, race conditions, type/data mismatches)
  - [ ] Code smells (duplication, dead code, over-complex functions, leaky abstractions)
  - [ ] **Never edits, branches, stages, or commits** — it only reports
- [ ] `/pr` — the ship-it workflow, executed in order:
  - [ ] 1. Run `/pr-reviewer` and automatically **fix all Critical, High, and Medium** findings (re-running tests after fixes)
  - [ ] 2. Run Claude Code's built-in `/code-review` and automatically **fix all Critical, High, and Medium** findings
  - [ ] 3. Collect all **Low** findings and present them to the user, asking which to address; fix only the chosen ones
  - [ ] 4. Re-run lint + typecheck + the full test suite and confirm green
  - [ ] 5. Output a **PR title + description in raw markdown** (copy-paste ready): what changed, link to the relevant `docs/` phase/PR, what was fixed, and any accepted Low findings
  - [ ] **Hard rule:** `/pr` never creates a branch, never stages, never commits, never pushes — the human uses the generated output to do all git operations

**Acceptance criteria**
- [ ] Each command file documents its inputs and the test-first expectation
- [ ] `/tdd` visibly refuses to write implementation before a failing test exists
- [ ] `/pr-reviewer` reports severity-grouped findings with `file:line` + suggested fixes and makes **no** edits
- [ ] `/pr` auto-fixes Critical/High/Medium from **both** reviewers, prompts on Low, ends with copy-paste PR title+description, and performs **no** git branch/stage/commit/push

---

### PR 1.4 — Subagents (`.claude/agents/`)

**Objective:** Specialized agents for recurring, well-scoped tasks.

- [ ] `test-writer` — given a spec, produces failing tests first; never writes implementation
- [ ] `code-reviewer` — reviews a diff for correctness, test coverage, and convention adherence
- [ ] `rag-evaluator` — runs retrieval/answer-quality evals and interprets the metrics
- [ ] `db-migrator` — authors Drizzle schema changes + migrations + integration tests
- [ ] Give each agent a focused description, tool scope, and model guidance in its frontmatter

**Acceptance criteria**
- [ ] Each agent has a single clear responsibility and a scoped tool list
- [ ] `test-writer` and `db-migrator` enforce the tests-first rule in their instructions

---

### PR 1.5 — Skills (`.claude/skills/`)

**Objective:** Reusable, on-demand knowledge for the project's recurring patterns.

- [ ] `rag-ingestion` — parsing/chunking/embedding conventions and metadata schema
- [ ] `openai-integration` — chat + embeddings wrapper patterns, retries, structured output via Zod, token/cost logging
- [ ] `pgvector-queries` — how similarity search is written by hand (operators, indexes, metadata filtering)
- [ ] `project-conventions` — monorepo layout, error handling, test structure, naming
- [ ] Each skill is a folder with a `SKILL.md` and a tight trigger description

**Acceptance criteria**
- [ ] Skills load only when relevant (descriptions are specific, not generic)
- [ ] `pgvector-queries` and `rag-ingestion` reflect the schema introduced in Phase 2

---

### PR 1.6 — TDD-enforcing hooks (in `settings.json`)

**Objective:** Make the harness mechanically enforce the test-first discipline.

- [ ] Add a **PostToolUse** hook that, after edits to `packages/*/src/**`, runs the related Vitest file(s) and surfaces failures
- [ ] Add a **Stop** hook that runs `typecheck` + the full test suite and blocks "done" on failure
- [ ] (Optional) Add a **PreToolUse** guard that warns when a source file is edited with no corresponding test file present
- [ ] Document every hook in `CLAUDE.md` (what it does, how to bypass intentionally)

**Acceptance criteria**
- [ ] Editing source with failing/absent tests produces visible hook feedback
- [ ] The Stop hook prevents a session from ending green while tests are red
- [ ] Hooks are documented and reproducible on a fresh clone

---

### PR 1.7 — CI foundation (GitHub Actions)

**Objective:** Establish the base CI pipeline that gates every PR from here forward.
**Gate scope:** only code that exists *now* — no DB/integration/web gates yet.

- [ ] Add `.github/workflows/ci.yml` triggered on `push` and `pull_request`
- [ ] Setup steps: checkout → Node 22 + pnpm via corepack → cache pnpm store → `pnpm install --frozen-lockfile`
- [ ] **Gate:** lint (`pnpm lint`)
- [ ] **Gate:** typecheck (`pnpm typecheck`)
- [ ] **Gate:** unit tests (`pnpm test`) — the smoke/unit suite that exists today
- [ ] **Gate:** build (`pnpm build`) for the packages that currently exist (`shared`, `api`)
- [ ] Add a CI status badge placeholder to `CLAUDE.md`/README (finalized in Phase 6)
- [ ] **Gate-scope note (document in-workflow):** no Docker/integration gate here — the DB and integration tests don't exist yet; that gate lands in Phase 2 exactly when the code it protects does

**Acceptance criteria**
- [ ] CI runs on every PR and blocks merge on lint/type/test/build failure
- [ ] The workflow references only scripts and packages that currently exist (no gate for not-yet-built code)
- [ ] A green run is reproducible from a fresh clone with no secrets

---

## Definition of Done (Phase 1)

- [ ] `make up && make test` is green on a fresh clone
- [ ] GitHub Actions CI gates lint, typecheck, unit tests, and build on every PR (base pipeline only)
- [ ] `.claude/` contains settings, ≥7 commands (including `/pr-reviewer` and `/pr`), ≥4 agents, ≥4 skills, and TDD hooks
- [ ] `/pr-reviewer` reports severity-grouped findings and makes no edits; `/pr` auto-fixes Critical/High/Medium, prompts on Low, and emits copy-paste PR text — without creating a branch, staging, or committing
- [ ] `CLAUDE.md` documents the architecture, TDD loop, the git ground rule (no Claude branches/commits), and the project scope
- [ ] No product/business logic beyond the `health()` smoke unit
- [ ] A reviewer can clone, read `CLAUDE.md`, run `make up`, and understand the project in minutes
