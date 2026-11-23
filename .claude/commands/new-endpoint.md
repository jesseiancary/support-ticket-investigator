---
description: Scaffold an Express route + shared Zod request/response schemas + Supertest spec (test first)
argument-hint: <METHOD> <path> — e.g. POST /api/retrieve
---

Scaffold a new API endpoint **test-first**. Target: `$ARGUMENTS`.

Order of work (do not write the handler before its spec):

1. **Shared contract first.** Define the request and response shapes as **Zod schemas in
   `packages/shared`** (e.g. `RetrieveRequest` / `RetrieveResponse`), with TS types
   inferred via `z.infer`. Reuse existing shared enums/schemas (`sourceType`,
   `RetrievedChunk`, `InvestigationReport`) — never re-declare a shared shape locally. The
   web client will import these same schemas, so this is the single source of truth.

2. **RED — Supertest spec.** Write a `*.test.ts` in `packages/api` using Supertest that
   asserts the route's status, the response validates against the shared response schema,
   and that invalid input yields a typed 4xx (not a crash). Run it; confirm it fails
   because the route doesn't exist yet. Show the red output.

3. **GREEN — implement the route.** Add the Express handler: validate the request body
   with the shared request schema (reject invalid input with a 4xx), run the logic, and
   return a response that satisfies the shared response schema. Keep business logic out of
   the route handler where it belongs in a service/module. Confirm the spec passes.

4. **REFACTOR + gate.** Tidy up, then run `pnpm lint` and `pnpm typecheck`.

Notes:

- Match existing routing/error-handling conventions in `packages/api`.
- Do not introduce auth, rate-limiting, or other scope beyond the current phase's plan.
