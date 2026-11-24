import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Migrations live at packages/api/drizzle; this test sits at packages/api/src/db.
const migrationsFolder = resolve(dirname(fileURLToPath(import.meta.url)), '../../drizzle');

// Testcontainers pulls/boots a real Postgres; give it room on a cold cache.
const BOOT_TIMEOUT_MS = 120_000;

describe('database schema (migrations against pgvector/pgvector:pg16)', () => {
  let container: StartedPostgreSqlContainer;
  let pool: Pool;
  let db: NodePgDatabase;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('pgvector/pgvector:pg16').start();
    pool = new Pool({ connectionString: container.getConnectionUri() });
    db = drizzle(pool);
    await migrate(db, { migrationsFolder });
  }, BOOT_TIMEOUT_MS);

  afterAll(async () => {
    await pool?.end();
    await container?.stop();
  });

  it('enables the vector extension', async () => {
    const { rows } = await pool.query(`SELECT 1 FROM pg_extension WHERE extname = 'vector'`);
    expect(rows).toHaveLength(1);
  });

  it('creates the source_type enum with exactly the shared values', async () => {
    const { rows } = await pool.query<{ value: string }>(
      `SELECT e.enumlabel AS value
         FROM pg_type t
         JOIN pg_enum e ON e.enumtypid = t.oid
        WHERE t.typname = 'source_type'
        ORDER BY e.enumsortorder`,
    );
    expect(rows.map((r) => r.value)).toEqual([
      'technical_doc',
      'historical_ticket',
      'troubleshooting_guide',
      'app_log',
    ]);
  });

  it('creates the documents table', async () => {
    const { rows } = await pool.query(
      `SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'documents'`,
    );
    expect(rows).toHaveLength(1);
  });

  it('creates the chunks table with a vector(1536) embedding column', async () => {
    const { rows } = await pool.query<{ udt_name: string; dims: number | null }>(
      `SELECT c.udt_name, a.atttypmod AS dims
         FROM information_schema.columns c
         JOIN pg_attribute a
           ON a.attrelid = 'chunks'::regclass AND a.attname = c.column_name
        WHERE c.table_schema = 'public'
          AND c.table_name = 'chunks'
          AND c.column_name = 'embedding'`,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.udt_name).toBe('vector');
    // pgvector stores the dimension count directly in atttypmod (no +4 header).
    expect(rows[0]?.dims).toBe(1536);
  });

  it('enforces a unique constraint on documents.uri (the upsert identity key)', async () => {
    const { rows } = await pool.query(
      `SELECT 1
         FROM pg_constraint con
         JOIN pg_class rel ON rel.oid = con.conrelid
         JOIN pg_attribute att
           ON att.attrelid = con.conrelid AND att.attnum = ANY (con.conkey)
        WHERE rel.relname = 'documents'
          AND con.contype = 'u'
          AND att.attname = 'uri'`,
    );
    expect(rows).toHaveLength(1);
  });

  it('creates a vector similarity index on chunks.embedding', async () => {
    const { rows } = await pool.query<{ indexdef: string }>(
      `SELECT indexdef FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = 'chunks' AND indexdef ILIKE '%USING hnsw%'`,
    );
    expect(rows.length).toBeGreaterThanOrEqual(1);
    // The index op-class must match the cosine distance operator used at query time.
    expect(rows[0]?.indexdef).toMatch(/vector_cosine_ops/);
  });

  it('re-running the migrator is a journal-tracked no-op', async () => {
    // Drizzle records applied migrations in __drizzle_migrations and skips them on re-run,
    // so this asserts the *migrator's* idempotency (the acceptance criterion), not that the
    // raw DDL is independently re-runnable — which drizzle's journal model does not require.
    // The only hand-added statement that must be safe to re-apply is the extension create,
    // which is guarded with IF NOT EXISTS in the migration SQL.
    await expect(migrate(db, { migrationsFolder })).resolves.not.toThrow();
  });
});
