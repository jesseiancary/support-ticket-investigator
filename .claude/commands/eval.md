---
description: Run the RAG evaluation harness and print retrieval / answer-quality metrics
argument-hint: '[retrieval|answer|all] (default: all)'
---

Run the project's RAG evaluation harness and report the metrics. Scope: `$ARGUMENTS`
(default `all`).

**Status:** the eval harness is wired for real in **Phase 6** (see
`docs/PHASE_6_PLAN.md`). Until that code lands:

- If an eval entrypoint exists (e.g. `pnpm eval` / a script under `packages/api`), run it
  and present the results.
- If it does **not** exist yet, do **not** fabricate numbers. Say so plainly, point to the
  Phase 6 plan, and stop.

When the harness exists, run it and summarize:

- **Retrieval metrics:** recall@k / precision@k, MRR or hit-rate against the labeled
  query→relevant-chunk set over the seed corpus.
- **Answer-quality metrics:** groundedness / citation-validity (every `evidence.citation`
  resolves to a retrieved chunk) and schema-conformance rate for `InvestigationReport`.
- Print a compact table (metric, value, and the k / threshold config used), then call out
  any regression versus the documented baseline.

Interpret, don't just dump: note which knob (`topK`, `minSimilarity`, chunk size) most
likely explains a weak number, and suggest the next experiment. Make no code edits unless
explicitly asked — this command reports.
