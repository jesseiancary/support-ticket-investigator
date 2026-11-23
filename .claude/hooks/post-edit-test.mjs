#!/usr/bin/env node
// PostToolUse hook — TDD feedback.
//
// After an Edit/Write to a `packages/*/src/**` TypeScript file, run the related
// Vitest file(s) and surface failures back to Claude. This keeps the red→green→refactor
// loop honest: you see immediately whether the unit you just touched is green or red.
//
// Fail-open by design: any unexpected error in this hook exits 0 so it can never wedge an
// editing session. The real gate is the Stop hook (stop-gate.mjs).
//
// Exit codes (Claude Code PostToolUse contract):
//   0  → silent / informational (success, or nothing to run)
//   2  → feed stderr back to Claude (related tests failed — act on it)

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { relative, isAbsolute } from "node:path";

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

try {
  const input = JSON.parse(readStdin() || "{}");
  const filePath = input?.tool_input?.file_path;
  if (!filePath) process.exit(0);

  const rel = isAbsolute(filePath) ? relative(projectDir, filePath) : filePath;

  // Only care about TypeScript source under a package's src/.
  if (!/^packages\/[^/]+\/src\/.+\.(ts|tsx)$/.test(rel)) process.exit(0);

  // `vitest related` runs the tests that import the changed file (and, for a changed
  // test file, that test itself). --passWithNoTests keeps brand-new, not-yet-tested
  // source non-blocking — the PreToolUse guard is what nudges about a missing test.
  const cmd = `pnpm exec vitest related --run --passWithNoTests "${rel}"`;

  try {
    execSync(cmd, { cwd: projectDir, stdio: "pipe", encoding: "utf8" });
    process.exit(0); // related tests passed (or none exist yet)
  } catch (err) {
    const out = `${err.stdout || ""}${err.stderr || ""}`.trim();
    process.stderr.write(
      `TDD hook: related tests are RED after editing ${rel}.\n` +
        `Make them green before moving on (or write the missing test).\n\n` +
        `${out}\n`,
    );
    process.exit(2);
  }
} catch {
  process.exit(0); // fail open — never block editing on a hook bug
}
