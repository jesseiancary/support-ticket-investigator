---
name: project-conventions
description: This monorepo's layout, shared-type rule, error handling, test structure, naming, and build model. Use when adding files/packages, deciding where a type lives, or checking that code matches repo conventions.
---

# Project conventions

Canonical reference is `CLAUDE.md`; this skill is the quick, load-on-demand version.

## Monorepo layout

pnpm workspace, three packages under `packages/*`:

- `@sti/shared` — **single source of truth** for cross-boundary types. Source-only
  internal package (`exports → ./src/index.ts`); the apps bundle it inline (`noExternal`).
- `@sti/api` — Express API, RAG ingestion/retrieval/report pipeline, Drizzle + pgvector.
- `@sti/web` — React SPA (Phase 5).

## Shared types — one home, one definition

Every type crossing a package boundary (API request/response shapes, `source_type`,
`ParsedDocument`, `RetrievedChunk`, `InvestigationReport`) is defined **once** in
`packages/shared` as a **Zod schema**, with the TS type **inferred** via `z.infer` — never
hand-redeclared. `api` and `web` import these; they never re-define a shared shape. Where a
value must also exist elsewhere (the Drizzle `source_type` `pgEnum`), it is **derived from
the shared Zod enum's value list** — no re-typed literals, no drift.

## Build model

- `tsc --noEmit` is **type-check only** (single root `tsconfig.json` + `tsconfig.base.json`,
  strict; no per-package tsconfigs).
- **tsup/esbuild** bundles the apps → source uses **extensionless** relative imports
  (`./foo`, not `./foo.js`).

## Naming

- Files/dirs: `kebab-case`. Types/schemas: `PascalCase`. Vars/functions: `camelCase`.
- Domain enum **values** + DB columns: `snake_case` (e.g. `source_type`).
- Packages: `@sti/*`. Tests: co-located `*.test.ts`.

## Error handling

- Validate external input with Zod at the boundary; reject invalid input with a **typed
  4xx-style error**, never a crash.
- Unsupported/parse failures return clear typed errors (parsers, filters, structured
  output). No swallowed exceptions; no unhandled promise rejections (always `await`).

## Test structure

- Vitest, co-located `*.test.ts`; Supertest for Express routes; Testcontainers for DB
  integration (Phase 2+).
- Tests are **hermetic**: deterministic, no real network/clock. OpenAI via **fake**
  providers; CI needs no key and no egress.
- **Test-first, always** — red → green → refactor. No implementation before a failing test.

## Git & process

- **Git is human-owned.** Claude never branches, stages, commits, or pushes; `/pr` only
  emits copy-paste PR text.
- One PR = one plan item (`docs/PHASE_*_PLAN.md`); Conventional Commit titles.
- Never run `pnpm deploy` by hand (Docker-build-only).
