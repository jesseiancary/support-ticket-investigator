#!/usr/bin/env node
// PreToolUse hook (optional guard) — tests-first nudge.
//
// Before writing/editing a `packages/*/src/**` source file that has NO co-located
// `*.test.ts` sibling, emit a non-blocking warning. This is a gentle reminder of the
// tests-first rule — it never blocks the edit (the Stop hook is the hard gate).
//
// Non-blocking by contract: we exit 0 and surface the warning via JSON
// `permissionDecision: "allow"` with a reason, so the edit proceeds either way.

import { existsSync } from "node:fs";
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

function allow(reason) {
  if (reason) {
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "allow",
          permissionDecisionReason: reason,
        },
      }),
    );
  }
  process.exit(0);
}

try {
  const input = JSON.parse(readStdin() || "{}");
  const filePath = input?.tool_input?.file_path;
  if (!filePath) allow();

  const rel = isAbsolute(filePath) ? relative(projectDir, filePath) : filePath;

  // Only source files under a package's src/ — and not test files themselves.
  const isSrc = /^packages\/[^/]+\/src\/.+\.(ts|tsx)$/.test(rel);
  const isTest = /\.test\.(ts|tsx)$/.test(rel);
  if (!isSrc || isTest) allow();

  const testSibling = filePath.replace(/\.(ts|tsx)$/, ".test.$1");
  if (existsSync(testSibling)) allow();

  allow(
    `Tests-first reminder: ${rel} has no co-located *.test.ts. ` +
      `Per this project's TDD rule, write the failing test before implementation ` +
      `(the /tdd command or test-writer agent can do this). Proceeding anyway.`,
  );
} catch {
  allow(); // fail open
}
