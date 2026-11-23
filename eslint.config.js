// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    // Build output, deps, and generated artifacts are never linted.
    ignores: ["**/dist/**", "**/node_modules/**", "**/coverage/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "no-console": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // Tests may use a looser console policy; keep type-safety rules intact.
    files: ["**/*.test.ts"],
    rules: {
      "no-console": "off",
    },
  },
  {
    // Claude Code hook scripts are plain Node ESM — give them Node globals.
    files: [".claude/hooks/**/*.mjs"],
    languageOptions: {
      globals: { process: "readonly", console: "readonly" },
    },
  },
  // Keep ESLint focused on code quality; formatting is owned by Prettier.
  prettier,
);
