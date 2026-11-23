---
description: Generate + apply a Drizzle migration and its Testcontainers integration test (test first)
argument-hint: <schema change, e.g. "add chunks.token_count int not null">
---

Author a Drizzle schema change **test-first**. Change: `$ARGUMENTS`.

The DB schema lives in `packages/api`. The `source_type` enum is **derived from the
shared Zod `sourceType` value list** — the Drizzle `pgEnum` references those values, it
never re-lists the literals. Preserve that single source of truth.

Order of work:

1. **RED — integration test first.** Write/extend a **Testcontainers** integration test
   that boots `pgvector/pgvector:pg16`, runs migrations, and asserts the new schema state
   (table/column/constraint/index exists, types correct). Run it; confirm it fails against
   the current schema. Show the red output.

2. **Edit the Drizzle schema** to express the change. If it touches `source_type`, change
   the shared Zod enum and let the `pgEnum` follow — do not hardcode literals in the schema.

3. **Generate the migration:** `pnpm drizzle-kit generate`. Review the generated SQL —
   confirm it matches intent, enables any needed extension (`vector`), and is idempotent /
   re-runnable.

4. **Apply + GREEN:** run `make migrate` (or the project's apply target) against the dev
   `db` container, then re-run the integration test; confirm green. Verify re-running
   migrations is a no-op.

5. **Gate:** `pnpm lint` and `pnpm typecheck`.

Reminder: `pnpm deploy` is Docker-build-only — never run it by hand (see `CLAUDE.md`).
