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

3. **Generate the migration:** `make generate` (→ `drizzle-kit generate`). Review the
   generated SQL — confirm it matches intent. Note: drizzle-kit does **not** emit
   `CREATE EXTENSION` — if a change first introduces a `vector` column or index, hand-add
   `CREATE EXTENSION IF NOT EXISTS vector;` as the migration's first statement (as
   `drizzle/0000_*.sql` does). Any **hand-added** statement must be safe to re-apply (use
   `IF NOT EXISTS`); drizzle-generated DDL is applied once and need not be.

4. **Apply + GREEN:** run `make migrate` against the dev `db` container, then re-run the
   integration test (`make test-integration`); confirm green. "Idempotent" here means the
   **migrator** is a no-op on re-run (it journals applied migrations in
   `__drizzle_migrations` and skips them) — not that the raw SQL is independently
   re-runnable.

5. **Gate:** `pnpm lint` and `pnpm typecheck`.

Reminder: `pnpm deploy` is Docker-build-only — never run it by hand (see `CLAUDE.md`).
