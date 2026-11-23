import { defineConfig } from "tsup";

// Bundles the api (inlining @sti/shared) into a self-contained ESM file. esbuild
// resolves extensionless imports at build time, so the source never needs `.js`
// suffixes and Node never sees a bare relative specifier.
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  platform: "node",
  target: "node22",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  noExternal: ["@sti/shared"],
});
