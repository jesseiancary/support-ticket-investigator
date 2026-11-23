# CLAUDE.md

[![CI](https://github.com/jesseiancary/support-ticket-investigator/actions/workflows/ci.yml/badge.svg)](https://github.com/jesseiancary/support-ticket-investigator/actions/workflows/ci.yml)

Guidance for Claude Code (and humans) working in this repository. Read this first.

> CI badge above is a placeholder (finalized in Phase 6). The base GitHub Actions
> pipeline ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) gates every push
> and PR on lint + typecheck + unit tests + build, workspace-wide across `shared`,
> `api`, and `web`.

## What this project is

**Support Ticket Investigator** is a RAG-powered assistant that investigates customer
support tickets and produces structured, evidence-cited engineering investigation
reports with follow-up Q&A. Given a ticket, it embeds the query, runs similarity
search over a pgvector store of knowledge sources, and asks an LLM to produce a
schema-validated report — while exposing exactly which chunks were retrieved
(source, content, score, rank).

The build is split into phases; see [`docs/`](docs/) for the full phased plan. Each
phase is implemented as a series of small PRs. **We are early** — only the dev harness
and a trivial `health()` smoke unit exist today.

## Project scope — read before adding anything

- **This is a portfolio project, not a production app.** Its primary purpose is to
  demonstrate skill to hiring managers. Target **≤ 1 week** of total build time.
- **Aim for polished and good, not perfect.** Favor a clear, working, well-tested demo
  over exhaustive completeness. Don't gold-plate; don't add features beyond the current
  phase's plan.
- **Hiring managers must be able to try it with zero setup.** Seed/sample data plus a
  public demo are how the project is evaluated — those matter more than edge-case
  coverage.
- **Stay within the current PR's scope.** The `docs/PHASE_*_PLAN.md` files are the
  source of truth for what each PR should and should not contain. Scope creep is a bug.

## Git ground rule — Claude never writes git history

**Git is human-owned.** Claude **never** creates branches, stages (`git add`), commits,
or pushes. The human performs all git operations. This is the project's real safety
boundary and it is enforced mechanically in [`.claude/settings.json`](.claude/settings.json):
`git add` / `commit` / `branch` / `push` are explicitly **denied**, and only read-only
git commands (`status`, `diff`, `log`) are allowlisted.

The `/pr` command only ever **emits copy-paste PR text** — a title and description in raw
markdown. It does not touch git. The human uses that output to open the PR.

## TDD workflow — tests first, always

Every unit of behavior is built **test-first**, in a strict **red → green → refactor**
loop:

1. **Red** — write the failing test that specifies the behavior. Run it; confirm it
   fails for the right reason.
2. **Green** — write the minimum implementation to make the test pass. Run it; confirm
   green.
3. **Refactor** — clean up with the test as a safety net; keep it green.

Rules:

- **Never write implementation before a failing test exists.** If asked to implement
  something untested, write the test first.
- Tests live beside the code as `*.test.ts` (e.g. [`packages/shared/src/health.test.ts`](packages/shared/src/health.test.ts)).
  DB/Testcontainers integration tests use the `*.integration.test.ts` suffix so they run
  as a **separate Vitest project** — kept out of the fast, Docker-free default suite.
- Run the fast unit suite with `make test` (or `pnpm test`); `pnpm test:watch` for the
  inner loop. Integration tests (need Docker) run via `make test-integration` (or
  `pnpm test:integration`) — these boot their own `pgvector` container and are gated in
  CI from Phase 2 (PR 2.6).
- Hooks enforce this mechanically (run related tests on edit; block "done" on red) — see
  "TDD-enforcing hooks" below. The discipline holds even when a hook is bypassed.

## PR conventions

- **One PR = one plan item.** Each PR maps to a `PR x.y` entry in a `docs/PHASE_*_PLAN.md`.
  Keep PRs small and reviewable; don't bundle unrelated changes.
- **Conventional Commit** style for titles: `feat:`, `fix:`, `docs:`, `chore:`, `test:`,
  `refactor:` — matching the existing history.
- Every PR must leave `make lint`, `make typecheck`, and `make test` green.
- A PR description states what changed, links the relevant `docs/` phase/PR, and notes
  anything deferred.

## Architecture

```
                         ┌──────────────────────────────────────────┐
                         │                packages/web               │
                         │        React SPA (Phase 5) — submit a     │
                         │     ticket, read the report, inspect the  │
                         │     retrieved chunks, ask follow-ups      │
                         └───────────────────┬──────────────────────┘
                                             │ HTTP (typed contracts)
                                             ▼
   ┌───────────────┐        ┌──────────────────────────────────────────┐
   │ knowledge     │        │                packages/api               │
   │ sources:      │ ingest │                                           │
   │ docs, past    │───────▶│  Ingestion:  parse → chunk → embed        │
   │ tickets,      │        │  Retrieval:  embed query → similarity     │
   │ guides, logs  │        │              search → filter → rank       │
   └───────────────┘        │  Report:     ticket + context → LLM →     │
                            │              schema-validated report +    │
                            │              follow-up Q&A                │
                            └───────┬───────────────────────┬──────────┘
                                    │ Drizzle               │ OpenAI
                                    ▼                       ▼
                         ┌────────────────────┐   ┌────────────────────┐
                         │ Postgres + pgvector│   │  OpenAI (chat +     │
                         │  embeddings +      │   │  embeddings)        │
                         │  metadata          │   └────────────────────┘
                         └────────────────────┘

                 packages/shared — Zod schemas + inferred TS types
                 (the single source of truth imported by api & web)
```

## Package layout

Containerized **pnpm workspace** monorepo. Three packages under `packages/*`:

| Package       | Role                                                                                                                                            |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `@sti/shared` | **Single source of truth** for every cross-boundary type. Source-only internal package (`exports → ./src/index.ts`); the apps bundle it inline. |
| `@sti/api`    | Backend: Express API, RAG ingestion/retrieval/report pipeline, Drizzle + pgvector. Currently a placeholder health server.                       |
| `@sti/web`    | Frontend: React SPA (Phase 5). Currently a placeholder health server.                                                                           |

### Shared types have one home and one definition

Every type that crosses a package boundary — API request/response shapes, domain enums
(e.g. `source_type`), and the `ParsedDocument` / retrieval-result / `InvestigationReport`
contracts — is defined **once** in `packages/shared` as a **Zod schema**, with the
TypeScript type **inferred** via `z.infer` — never hand-redeclared. `api` and `web`
import these; they never re-define a shared shape locally. Where a shared value must also
exist in another system (notably the Drizzle `source_type` `pgEnum`), it is **derived
from the shared Zod enum's value list**, so there is exactly one authoritative definition
and no drift.

### Build model

- **`tsc` is type-check-only** (`tsc --noEmit`) via a single root `tsconfig.json` +
  `tsconfig.base.json` (strict). There are no per-package tsconfigs.
- **tsup/esbuild** bundles the apps. Because bundlers resolve imports, source code uses
  **extensionless** relative imports (`./foo`, not `./foo.js`).
- `@sti/shared` is bundled **inline** (`noExternal`) into the apps — no separate build,
  no published artifact.

## Naming conventions

- Files & directories: `kebab-case` (e.g. `retrieval-result.ts`).
- Types, interfaces, Zod schema types: `PascalCase` (e.g. `ParsedDocument`).
- Variables & functions: `camelCase`.
- Domain enum **values** and DB columns: `snake_case` (e.g. `source_type`).
- Tests: co-located `*.test.ts` next to the unit under test.
- Packages are namespaced `@sti/*`.

## Running the stack

The stack is containerized (Postgres+pgvector, api, web) and driven through the
`Makefile`. Host commands (test/lint/typecheck) run via pnpm; the stack runs via
docker compose.

```bash
cp .env.example .env    # fill in OPENAI_API_KEY when needed (Phase 2+)
pnpm install
make up                 # build + start db, api, web (all report healthy)
make test               # fast unit Vitest suite (no Docker)
make test-integration   # Testcontainers DB integration tests (needs Docker)
make down               # stop the stack
```

Common targets: `make up` / `make down` / `make logs` / `make test` /
`make test-integration` / `make lint` / `make typecheck` / `make build` / `make format` /
`make clean`. Run `make help` for the full list.

If `make up` fails with _"all predefined address pools have been fully subnetted"_, see
the Docker-daemon troubleshooting note in [`README.md`](README.md) — it is a host/daemon
condition, not a project bug.

## `pnpm deploy` caveat — never run it by hand

`pnpm deploy` is used **only** inside the api Docker build
([`packages/api/Dockerfile`](packages/api/Dockerfile)) to produce a lean runtime image.
**Do not run it locally.** Running it by hand flips the workspace `node_modules` into a
state that aborts the next `pnpm <script>` with
`ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`. A plain `pnpm install` restores it. CI sets
`CI=true` so pnpm reconciles this non-interactively.

## The Claude Code harness

The `.claude/` folder encodes this project's conventions and is itself a portfolio
artifact. It contains:

- **[`settings.json`](.claude/settings.json)** — permission profile, env defaults, and the
  TDD hooks (below).
- **[`commands/`](.claude/commands/)** — slash commands: `/tdd`, `/new-endpoint`,
  `/migrate`, `/eval`, `/review`, `/pr-reviewer`, `/pr`.
- **[`agents/`](.claude/agents/)** — subagents: `test-writer`, `code-reviewer`,
  `rag-evaluator`, `db-migrator`.
- **[`skills/`](.claude/skills/)** — on-demand knowledge: `rag-ingestion`,
  `openai-integration`, `pgvector-queries`, `project-conventions`.
- **[`hooks/`](.claude/hooks/)** — the TDD-enforcing hook scripts.

### Permission allowlist (`.claude/settings.json`)

The allowlist is about **what is safe to auto-approve in a dev loop** — not about being
side-effect-free. It is honestly categorized:

- **Truly read-only** (no state change): `git status`, `git diff`, `git log`.
- **State-changing but safe local-dev commands** (allowlisted for flow — these _do_
  mutate local/dev state such as the DB, containers, and schema; that is acceptable and
  is **not** "read-only"): `pnpm *`, `docker compose *`, `make *`,
  `drizzle-kit generate` / `drizzle-kit migrate`.
- **Explicitly denied** (the real safety boundary): `git add` / `commit` / `branch` /
  `push`. Git history is never written by Claude.

No secrets live in `settings.json` — only non-secret env defaults. Real secrets
(`OPENAI_API_KEY`, DB creds) go in `.env`, which is gitignored.

### TDD-enforcing hooks

The harness mechanically enforces the test-first discipline through three hooks wired in
`settings.json` and implemented as Node scripts in [`.claude/hooks/`](.claude/hooks/). They
`fail open` — any error in a hook script exits 0, so a hook bug can never wedge a session.

| Hook                                                                                | Trigger                                                                                            | Behavior                                                              | Blocks?                      |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------- |
| **PreToolUse** — [`pre-edit-test-guard.mjs`](.claude/hooks/pre-edit-test-guard.mjs) | `Edit`/`Write`/`MultiEdit` of a `packages/*/src/**` source file with **no** co-located `*.test.ts` | Emits a tests-first reminder                                          | **No** (warn only)           |
| **PostToolUse** — [`post-edit-test.mjs`](.claude/hooks/post-edit-test.mjs)          | After editing a `packages/*/src/**` TS file                                                        | Runs `vitest related --project unit` for that file; surfaces failures | Feeds failures back (exit 2) |
| **Stop** — [`stop-gate.mjs`](.claude/hooks/stop-gate.mjs)                           | Claude tries to finish a turn                                                                      | Runs `pnpm typecheck` + `pnpm test` (unit); blocks "done" while red   | **Yes** (exit 2 until green) |

The PostToolUse hook uses `--passWithNoTests`, so a brand-new source file with no test yet
is non-blocking — the PreToolUse guard is what nudges you to write the test. The Stop gate
honors Claude Code's `stop_hook_active` flag to avoid an infinite stop loop.

**Bypassing intentionally.** These are a dev-loop aid, not a cage. To work without them for
a spike or an emergency, either:

- Remove/comment the relevant block under `hooks` in `.claude/settings.json` (revert when
  done), or
- Set a personal override in `.claude/settings.local.json` (gitignored) — e.g. an empty
  `"hooks": {}` — so the shared config stays intact.

The red state the Stop hook reports is real: prefer fixing the test over bypassing the gate.
