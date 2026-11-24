import { defineConfig } from 'tsup';

// Placeholder bundling for the web health-server (Phase 5 replaces this with Vite).
// Bundles @sti/shared inline; esbuild resolves extensionless imports at build time.
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node22',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  noExternal: ['@sti/shared'],
});
