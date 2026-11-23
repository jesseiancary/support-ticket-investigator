---
description: Read-only review of ALL uncommitted changes, findings grouped by severity. Never edits.
---

Perform a **read-only** review of **all uncommitted changes** — staged, unstaged, **and
untracked**. Make **no** edits, and never stage, branch, commit, or push. You only report.

Gather the full diff first:

- `git status --short` to enumerate changes (including untracked files).
- `git diff` (unstaged) and `git diff --staged`.
- Read each untracked file in full (it won't appear in `git diff`).

Review every change against these axes:

- **Phase-plan adherence** (`docs/`): scope creep, skipped/absent tests, unmet acceptance
  criteria for the PR being worked on.
- **Industry standards:** naming, structure, error handling, basic security (input
  validation, no secrets, no injection-prone string SQL outside the intentional hand-written
  pgvector queries).
- **3rd-party library usage:** recommended patterns for OpenAI SDK, Drizzle, Zod, Express,
  React / TanStack Query, Testcontainers.
- **Potential bugs:** logic errors, unhandled promise rejections, race conditions,
  type/data mismatches, off-by-one, missing `await`.
- **Code smells:** duplication, dead code, over-complex functions, leaky abstractions,
  shared types re-declared instead of imported from `packages/shared`.

**Output format** — group findings by severity, most severe first:

```
## Critical
- `path/to/file.ts:42` — <what's wrong> → <why it matters> → <suggested fix>

## High
...

## Medium
...

## Low
...
```

Each finding needs `file:line`, a one-line explanation, and a concrete suggested fix. If a
severity bucket is empty, write "_none_". End with a short summary line (counts per
severity). Do not modify anything — handing fixes to `/pr` or the human is the next step.
