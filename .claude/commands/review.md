---
description: Pre-flight gate — run lint + typecheck + full test suite and summarize the diff
allowed-tools: Bash(pnpm:*), Bash(make:*), Bash(git status:*), Bash(git diff:*), Read, Grep, Glob
---

Fast pre-flight gate before handing work off. This is the lightweight sibling of
`/pr-reviewer` (deep severity-graded review) and `/pr` (full ship-it flow) — it just runs
the mechanical checks and summarizes what changed.

Do all of this:

1. Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` (the full Vitest suite).
2. Report each as ✅ pass / ❌ fail. For any failure, show the relevant output and name the
   offending `file:line`.
3. Summarize the working diff: run `git status --short` and `git diff` (plus untracked
   files) and give a tight bullet list of what changed and why, grouped by package.
4. Flag anything that looks out of scope for the current phase/PR, any source file missing
   a co-located `*.test.ts`, and any obvious TDD violation (implementation with no test).

Do **not** edit code and do **not** touch git (no add/commit/branch/push). End with a
one-line verdict: **ready to hand off** or **blocked on: …**.
