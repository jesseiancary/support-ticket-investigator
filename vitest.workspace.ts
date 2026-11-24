import { defineWorkspace } from 'vitest/config';

// Two projects over the same packages, split by filename convention so the fast,
// Docker-free unit tests and the heavier integration tests (Testcontainers/DB, Phase 2+)
// run under separate commands:
//   - `pnpm test`             → --project unit        (Stop gate + base CI run this)
//   - `pnpm test:integration` → --project integration (needs Docker; wired into CI in 2.6)
//
// `*.integration.test.ts` is the convention for any test that needs a real container.
const integrationGlob = '**/*.integration.test.ts';

export default defineWorkspace([
  {
    test: {
      name: 'unit',
      include: ['packages/*/src/**/*.test.ts'],
      exclude: ['**/node_modules/**', '**/dist/**', integrationGlob],
    },
  },
  {
    test: {
      name: 'integration',
      include: ['packages/*/src/**/*.integration.test.ts'],
      exclude: ['**/node_modules/**', '**/dist/**'],
    },
  },
]);
