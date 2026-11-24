#!/usr/bin/env node
// Stop hook — the real TDD gate.
//
// When Claude tries to finish a turn, run `typecheck` + the full Vitest suite. If either
// fails, block "done" and feed the failure back so the session can't end green while the
// code is red.
//
// Loop safety: Claude Code sets `stop_hook_active: true` on the input once a Stop hook has
// already fired and been continued. We honor it and exit 0 to avoid an infinite stop loop.
//
// Exit codes (Claude Code Stop contract):
//   0 → allow the stop
//   2 → block the stop; stderr is shown to Claude as the reason to keep working

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

function readStdin() {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function run(cmd) {
  try {
    execSync(cmd, { cwd: projectDir, stdio: 'pipe', encoding: 'utf8' });
    return { ok: true, out: '' };
  } catch (err) {
    return { ok: false, out: `${err.stdout || ''}${err.stderr || ''}`.trim() };
  }
}

try {
  const input = JSON.parse(readStdin() || '{}');
  if (input?.stop_hook_active) process.exit(0); // already gating — don't loop

  const failures = [];

  const typecheck = run('pnpm typecheck');
  if (!typecheck.ok) failures.push(`# typecheck failed\n${typecheck.out}`);

  const test = run('pnpm test');
  if (!test.ok) failures.push(`# tests failed\n${test.out}`);

  if (failures.length > 0) {
    process.stderr.write(
      `Stop blocked: the TDD gate is red. Fix these before finishing:\n\n` +
        `${failures.join('\n\n')}\n`,
    );
    process.exit(2);
  }

  process.exit(0);
} catch {
  // Fail open: if the gate script itself errors, don't trap the session.
  process.exit(0);
}
