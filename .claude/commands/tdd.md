---
description: Drive a strict red → green → refactor TDD cycle for a named unit
argument-hint: <unit/behavior to build, e.g. "chunker splits on a token budget">
---

Build this behavior **test-first**, following the project's non-negotiable
red → green → refactor loop (see `CLAUDE.md` → "TDD workflow"):

**Unit to build:** $ARGUMENTS

Proceed strictly in this order. Do not skip or reorder.

1. **Locate the home.** Decide which package it belongs to (`@sti/shared`, `@sti/api`,
   `@sti/web`) and the co-located `*.test.ts` path. Shared cross-boundary types must be a
   Zod schema in `packages/shared` with the TS type inferred via `z.infer` — never
   hand-redeclared.

2. **RED — write the failing test first.** Write only the `*.test.ts` that specifies the
   behavior (happy path + at least one edge/error case). **Do not write any
   implementation yet.** Run `pnpm test <file>` and confirm it fails _for the right
   reason_ (missing impl / wrong result — not a typo or import error). Show the red output.

3. **GREEN — minimum implementation.** Write the least code needed to make the test pass.
   Run the test; confirm green. Show the passing output.

4. **REFACTOR.** Clean up names, duplication, and structure with the test as a safety net.
   Re-run to confirm still green.

5. **Verify the gate.** Run `pnpm lint` and `pnpm typecheck`; fix any issues.

**Hard rule:** if you catch yourself about to write implementation before a failing test
exists for it, stop and write the test first. If the request is ambiguous about the
expected behavior, ask before writing the test — a test encodes a decision.
