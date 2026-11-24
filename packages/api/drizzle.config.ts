import { defineConfig } from 'drizzle-kit';

/**
 * drizzle-kit configuration for the api package.
 *
 * - `generate` diffs `schema.ts` against the stored snapshot and emits SQL into `./drizzle`
 *   (no database needed).
 * - `migrate` applies those SQL files to the database at `DATABASE_URL`.
 *
 * `make migrate` (host) points `DATABASE_URL` at the dev db container's mapped port
 * (localhost); the fallback below keeps a bare `drizzle-kit migrate` working in that same
 * dev setup.
 */
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // Prefer an explicit DATABASE_URL (what `make migrate` sets, honoring DB_PORT). The
    // fallback assumes the default dev setup on port 5432 — a bare `drizzle-kit migrate`
    // run outside `make migrate` with a custom DB_PORT should pass DATABASE_URL itself.
    url: process.env.DATABASE_URL ?? 'postgres://sti:sti@localhost:5432/sti',
  },
  // `strict` / `verbose` only affect `drizzle-kit push` (an interactive diff + confirm).
  // This project never uses push — it generates + applies versioned migrations — so these
  // are inert here; kept as a safety net in case push is ever used ad hoc.
  strict: true,
  verbose: true,
});
