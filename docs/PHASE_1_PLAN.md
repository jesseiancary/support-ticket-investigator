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
  The `/pr` command (PR 1.2) only emits copy-paste PR text; the human performs all git
  operations. The permission allowlist must not include `git add`/`commit`/`branch`/`push`.
- **Shared types have one home and one definition.** Every type that crosses a package
  boundary — API request/response shapes, domain enums (e.g. `source_type`), and the
  `ParsedDocument` / retrieval-result / `InvestigationReport` contracts — is defined
  **once** in `packages/shared` as a Zod schema, with TypeScript types **inferred** from
  it (`z.infer`), never hand-redeclared. The `api` and `web` packages import these; they
  never re-define a shared shape locally. Where a shared value must also exist in another
  system (notably the Drizzle `source_type` `pgEnum`), it is **derived from the shared
  Zod enum's value list**, so there is exactly one authoritative definition and no
  possibility of drift.
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

- [x] Initialize pnpm workspace (`pnpm-workspace.yaml`) with `packages/*`
- [x] Create `packages/shared`, `packages/api`, `packages/web` (per-package `package.json`); strict TypeScript via a root `tsconfig.base.json` + a single root `tsconfig.json` (no per-package tsconfigs)
- [x] **Build model:** `tsc` is **type-check-only** (`--noEmit`); **tsup/esbuild** bundles the apps, which enables genuinely **extensionless** relative imports. `@sti/shared` is a **source-only internal package** (`exports → ./src/index.ts`) that the apps bundle inline (`noExternal`)
- [x] Add ESLint (flat config) + Prettier config at the root; shared rules
- [x] Add Vitest at the root with workspace projects
- [x] **Test-first:** write `packages/shared/src/health.test.ts` asserting a trivial `health()` returns `"ok"` (red)
- [x] Implement `health()` to make it pass (green)
- [x] Author `docker-compose.yml`: `db` (`pgvector/pgvector:pg16`), `api`, `web` services with volumes + a shared network. The `web` service here is a **placeholder health-server container** (dev infra so the full stack boots), **not** the React app — that replaces it in Phase 5 (PR 5.1)
- [x] Add multi-stage `Dockerfile` for `api` and `web` (install → **tsup bundle** → runtime) that ship a **self-contained bundle** — the runtime image carries only `package.json` + `dist`, no `node_modules`. (`pnpm deploy`-based prod-dep pruning returns in Phase 2 when external deps land.) The `web` Dockerfile ships a minimal placeholder now; Phase 5 converts it to a Vite build
- [x] Add a `Makefile` with `up`, `down`, `test`, `lint`, `typecheck`, `logs` targets (plus `build`/`format`/`clean`/`help`)
- [x] Add `.env.example` documenting `OPENAI_API_KEY`, `DATABASE_URL`, ports
- [x] Add a `README.md` stub with a Docker-daemon troubleshooting note (the "address pools fully subnetted" auto-allocation fix); the full portfolio README is Phase 6 (PR 6.7)

**Acceptance criteria**
- [x] `make up` starts all three containers; `db` reports healthy
- [x] `make test` runs Vitest and the smoke test passes
- [x] `make lint` and `make typecheck` pass with zero errors

---

### PR 1.2 — Claude Code harness (`CLAUDE.md`, settings, commands, agents, skills, hooks)

**Objective:** Stand up the complete `.claude/` harness as one coherent unit — project
context, a safe permission profile, custom slash commands, subagents, skills, and
TDD-enforcing hooks.

**Why one PR:** this is all harness config/docs (markdown + `settings.json`), not
test-driven product code, so the small-PR discipline that protects the red→green→refactor
loop doesn't apply here — splitting it only adds ceremony and touches `settings.json`
across multiple PRs (commands/agents/skills are static config; the hooks live *in*
`settings.json` alongside the permission profile). Shipping it together also presents the
agentic workflow as a single portfolio artifact. The one piece with real executable
behavior is the **hooks** — the PR's testing notes must demonstrate them firing (don't let
that get lost among the markdown).

#### Context & permissions — `CLAUDE.md` + `.claude/settings.json`
- [x] Write `CLAUDE.md`: project overview, architecture diagram (ASCII), package layout, naming conventions, **the TDD workflow (red → green → refactor)**, and how to run the stack
- [x] Document the "tests-first, always" rule and the PR conventions in `CLAUDE.md`
- [x] Document the **git ground rule** in `CLAUDE.md`: Claude never creates branches, stages, commits, or pushes — the human owns all git operations; `/pr` only emits copy-paste PR text
- [x] Document the **project scope** in `CLAUDE.md`: portfolio piece (not production), ~1-week budget, "polished and good, not perfect," and that seed/sample data + a public demo are how hiring managers evaluate it
- [x] Document the **`pnpm deploy` local caveat** in `CLAUDE.md`: `pnpm deploy` is used **only** inside the api Docker build (`packages/api/Dockerfile`) to produce a lean runtime image — never run it by hand. Running it locally flips the workspace `node_modules` into a state that aborts the next `pnpm <script>` with `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`; a plain `pnpm install` restores it, and CI sets `CI=true` so pnpm reconciles non-interactively
- [x] Create `.claude/settings.json` with a permission allowlist, honestly categorized (the allowlist is about *what is safe to auto-approve in a dev loop*, not about being side-effect-free):
  - [x] **Truly read-only** (no state change): `git status` / `git diff` / `git log`
  - [x] **State-changing but safe local-dev commands** (intentionally allowlisted for flow — these *do* mutate local/dev state such as the DB, containers, and schema; that is acceptable and is not "read-only"): `pnpm *`, `docker compose *`, `make *`, `drizzle-kit generate` / `drizzle-kit migrate`
- [x] Explicitly **do not** allowlist `git add`/`commit`/`branch`/`push` — these stay human-owned (the real safety boundary; git history is never written by Claude)
- [x] Set project env defaults in settings (non-secret only)

#### Custom slash commands (`.claude/commands/`)

*One-command workflows for the repetitive loops of this project.*

**Core workflow commands**
- [x] `/tdd` — drive a strict red→green→refactor cycle for a named unit (write failing test first, confirm red, implement, confirm green, refactor)
- [x] `/new-endpoint` — scaffold an Express route + Zod request/response schema + Supertest spec (test first)
- [x] `/migrate` — generate + apply a Drizzle migration and its Testcontainers integration test
- [x] `/eval` — run the RAG evaluation harness (wired for real in Phase 6) and print metrics
- [x] `/review` — lightweight pre-flight: run lint + typecheck + the full test suite and summarize the diff (fast gate; distinct from the deeper `/pr-reviewer`)

**Review & PR commands**
- [x] `/pr-reviewer` — **read-only** review of **all uncommitted changes** (staged + unstaged + untracked). Reports findings grouped by severity (**Critical / High / Medium / Low**), each with `file:line`, an explanation, and a suggested fix. It checks for:
  - [x] Deviation from the phase plan in `docs/` (scope creep, skipped tests, unmet acceptance criteria)
  - [x] Deviation from industry standards (naming, structure, error handling, basic security)
  - [x] Deviation from 3rd-party library recommended usage (OpenAI SDK, Drizzle, Zod, Express, React/TanStack Query, Testcontainers)
  - [x] Potential bugs (logic errors, unhandled rejections, race conditions, type/data mismatches)
  - [x] Code smells (duplication, dead code, over-complex functions, leaky abstractions)
  - [x] **Never edits, branches, stages, or commits** — it only reports
- [x] `/pr` — the ship-it workflow, executed in order:
  - [x] 1. Run `/pr-reviewer` and automatically **fix all Critical, High, and Medium** findings (re-running tests after fixes)
  - [x] 2. Run Claude Code's built-in `/code-review` and automatically **fix all Critical, High, and Medium** findings
  - [x] 3. Collect all **Low** findings and present them to the user, asking which to address; fix only the chosen ones
  - [x] 4. Re-run lint + typecheck + the full test suite and confirm green
  - [x] 5. Output a **PR title + description in raw markdown** (copy-paste ready): what changed, link to the relevant `docs/` phase/PR, what was fixed, and any accepted Low findings
  - [x] **Hard rule:** `/pr` never creates a branch, never stages, never commits, never pushes — the human uses the generated output to do all git operations

#### Subagents (`.claude/agents/`)

*Specialized agents for recurring, well-scoped tasks.*

- [x] `test-writer` — given a spec, produces failing tests first; never writes implementation
- [x] `code-reviewer` — reviews a diff for correctness, test coverage, and convention adherence
- [x] `rag-evaluator` — runs retrieval/answer-quality evals and interprets the metrics
- [x] `db-migrator` — authors Drizzle schema changes + migrations + integration tests
- [x] Give each agent a focused description, tool scope, and model guidance in its frontmatter

#### Skills (`.claude/skills/`)

*Reusable, on-demand knowledge for the project's recurring patterns.*

- [x] `rag-ingestion` — parsing/chunking/embedding conventions and metadata schema
- [x] `openai-integration` — chat + embeddings wrapper patterns, retries, structured output via Zod, token/cost logging
- [x] `pgvector-queries` — how similarity search is written by hand (operators, indexes, metadata filtering)
- [x] `project-conventions` — monorepo layout, error handling, test structure, naming
- [x] Each skill is a folder with a `SKILL.md` and a tight trigger description

#### TDD-enforcing hooks (in `settings.json`)

*Make the harness mechanically enforce the test-first discipline.*

- [x] Add a **PostToolUse** hook that, after edits to `packages/*/src/**`, runs the related Vitest file(s) and surfaces failures
- [x] Add a **Stop** hook that runs `typecheck` + the full test suite and blocks "done" on failure
- [x] (Optional) Add a **PreToolUse** guard that warns when a source file is edited with no corresponding test file present
- [x] Document every hook in `CLAUDE.md` (what it does, how to bypass intentionally)

**Acceptance criteria**

*Context & permissions*
- [x] `CLAUDE.md` describes the full dev loop, the git ground rule, and the project scope
- [x] The allowlist is documented by category (truly read-only vs. safe-but-state-changing); nothing is mislabeled as "read-only" that actually mutates state
- [x] Routine `pnpm`/`docker`/`make`/`drizzle-kit` commands run without permission prompts
- [x] No secrets are committed in `settings.json`
- [x] No git write operations (`add`/`commit`/`branch`/`push`) are allowlisted

*Commands*
- [x] Each command file documents its inputs and the test-first expectation
- [x] `/tdd` visibly refuses to write implementation before a failing test exists
- [x] `/pr-reviewer` reports severity-grouped findings with `file:line` + suggested fixes and makes **no** edits
- [x] `/pr` auto-fixes Critical/High/Medium from **both** reviewers, prompts on Low, ends with copy-paste PR title+description, and performs **no** git branch/stage/commit/push

*Agents*
- [x] Each agent has a single clear responsibility and a scoped tool list
- [x] `test-writer` and `db-migrator` enforce the tests-first rule in their instructions

*Skills*
- [x] Skills load only when relevant (descriptions are specific, not generic)
- [x] `pgvector-queries` and `rag-ingestion` reflect the schema introduced in Phase 2

*Hooks*
- [x] Editing source with failing/absent tests produces visible hook feedback
- [x] The Stop hook prevents a session from ending green while tests are red
- [x] Hooks are documented and reproducible on a fresh clone

---

### PR 1.3 — CI foundation (GitHub Actions)

**Objective:** Establish the base CI pipeline that gates every PR from here forward.
**Gate scope:** only code that exists *now*. Lint/typecheck/build run **workspace-wide
and cover all three existing packages — `shared`, `api`, and `web`** (the `web`
package, a placeholder, exists as of PR 1.1, so it is gated from the start). Deferred
until their code lands: web *component tests* and *E2E* (Phase 5), DB/integration
(Phase 2), and LLM (Phase 4).

- [x] Add `.github/workflows/ci.yml` triggered on `push` and `pull_request`
- [x] Setup steps: checkout → Node 22 + pnpm via corepack → cache pnpm store → `pnpm install --frozen-lockfile`
- [x] **Gate:** lint (`pnpm lint`) — workspace-wide (`shared`, `api`, `web`)
- [x] **Gate:** typecheck (`pnpm typecheck`) — workspace-wide (`shared`, `api`, `web`)
- [x] **Gate:** unit tests (`pnpm test`) — the smoke/unit suite that exists today
- [x] **Gate:** build (`pnpm build`) — workspace-wide; all three packages (`shared`, `api`, `web`) exist as of Phase 1, so `web` is built/gated now rather than deferred
- [x] Add a CI status badge placeholder to `CLAUDE.md`/README (finalized in Phase 6)
- [x] **Gate-scope note (document in-workflow):** no Docker/integration gate here — the DB and integration tests don't exist yet (lands in Phase 2); no web *component/E2E* gate yet either — those tests arrive in Phase 5. Each gate lands exactly when the code it protects does

**Acceptance criteria**
- [x] CI runs on every PR and blocks merge on lint/type/test/build failure
- [x] The workflow references only scripts and packages that currently exist (no gate for not-yet-built code)
- [x] A green run is reproducible from a fresh clone with no secrets

---

## Definition of Done (Phase 1)

- [ ] `make up && make test` is green on a fresh clone
- [x] GitHub Actions CI gates lint, typecheck, unit tests, and build on every PR — lint/typecheck/build run workspace-wide across `shared`/`api`/`web` (base pipeline only)
- [x] `.claude/` contains settings, ≥7 commands (including `/pr-reviewer` and `/pr`), ≥4 agents, ≥4 skills, and TDD hooks
- [x] `/pr-reviewer` reports severity-grouped findings and makes no edits; `/pr` auto-fixes Critical/High/Medium, prompts on Low, and emits copy-paste PR text — without creating a branch, staging, or committing
- [x] `CLAUDE.md` documents the architecture, TDD loop, the git ground rule (no Claude branches/commits), and the project scope
- [x] No product/business logic beyond the `health()` smoke unit
- [ ] A reviewer can clone, read `CLAUDE.md`, run `make up`, and understand the project in minutes
