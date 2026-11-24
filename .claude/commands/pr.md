---
description: Ship-it workflow — review, auto-fix Critical/High/Medium, prompt on Low, emit copy-paste PR text. Never touches git.
---

The ship-it workflow for the current set of changes. Execute these steps **in order**.

**Hard rule (read first):** `/pr` **never** creates a branch, stages, commits, or pushes.
Git history is human-owned (see `CLAUDE.md`). Your final output is copy-paste PR text; the
human performs all git operations.

1. **Project review.** Run the `/pr-reviewer` review over all uncommitted changes.
   Automatically **fix every Critical, High, and Medium** finding. Re-run `pnpm test`
   after fixing. Keep fixes test-first: if a fix changes behavior, update/add the test
   first.

2. **Low findings → ask.** Collect all **Low** findings from the review into one list
   (deduplicated, each with `file:line`). Present them to the user and ask which to
   address. Fix **only** the ones the user chooses.

3. **Green gate.** Re-run `pnpm lint`, `pnpm typecheck`, and `pnpm test`. Do not proceed
   until all three are green; if something can't be made green, stop and report why.

4. **Emit the PR text.** Output a **PR title + description in raw markdown**, copy-paste
   ready, inside a fenced block.
   - **Title:** Conventional Commit style (`feat:` / `fix:` / `docs:` / …).

   The description has these sections, in order:
   - **Summary** — a short paragraph on what this PR does and why.
   - **Changes** — concise bullet points of what changed, grouped by package.
   - **Technical Details** — notable implementation decisions, trade-offs, and anything
     deferred; include the relevant `docs/PHASE_*_PLAN.md` phase/PR this satisfies and
     what Critical/High/Medium review findings were fixed (plus any accepted Low items).
   - _(Optional)_ Any additional section warranted by the change (e.g. **Migration Notes**,
     **Breaking Changes**, **Screenshots**) — include only when it adds real value.
   - **Testing** — the commands run and their result, as a checklist.

   **Checklist formatting.** For the **Testing** section (and any other list of
   completed/verified items), use GitHub task-list syntax — `- [x]` for done, `- [ ]`
   for not done. Do **not** use `→ ✓`, `✅`, or other ad-hoc done markers.

   **Do not** append a "Generated with Claude" / "🤖 Generated with Claude Code" note (or
   any similar attribution footer) to the PR description.

Then stop. Do not run any git command. The human copies the output to open the PR.

> Note: Claude Code's built-in `/code-review` is **not** part of this workflow — it can't
> be invoked programmatically. Run it yourself before opening the PR if you want a second,
> independent review pass.
