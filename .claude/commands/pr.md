---
description: Ship-it workflow — dual review, auto-fix Critical/High/Medium, prompt on Low, emit copy-paste PR text. Never touches git.
---

The ship-it workflow for the current set of changes. Execute these steps **in order**.

**Hard rule (read first):** `/pr` **never** creates a branch, stages, commits, or pushes.
Git history is human-owned (see `CLAUDE.md`). Your final output is copy-paste PR text; the
human performs all git operations.

1. **Project review.** Run the `/pr-reviewer` review over all uncommitted changes.
   Automatically **fix every Critical, High, and Medium** finding. Re-run `pnpm test`
   after fixing. Keep fixes test-first: if a fix changes behavior, update/add the test
   first.

2. **Built-in code review.** Run Claude Code's built-in `/code-review`. Automatically
   **fix every Critical, High, and Medium** finding it reports. Re-run the tests again.

3. **Low findings → ask.** Collect all **Low** findings from both reviewers into one list
   (deduplicated, each with `file:line`). Present them to the user and ask which to
   address. Fix **only** the ones the user chooses.

4. **Green gate.** Re-run `pnpm lint`, `pnpm typecheck`, and `pnpm test`. Do not proceed
   until all three are green; if something can't be made green, stop and report why.

5. **Emit the PR text.** Output a **PR title + description in raw markdown**, copy-paste
   ready, inside a fenced block. Include:
   - **Title:** Conventional Commit style (`feat:` / `fix:` / `docs:` / …).
   - **What changed** — concise bullets, grouped by package.
   - **Plan link** — the relevant `docs/PHASE_*_PLAN.md` phase/PR this satisfies.
   - **Review fixes** — what Critical/High/Medium were fixed (from both reviewers).
   - **Accepted Low findings** — any Low items the user chose to address (or "none").
   - **Testing** — the commands run and their green result.

Then stop. Do not run any git command. The human copies the output to open the PR.
