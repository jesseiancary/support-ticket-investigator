# Phase 3 — Retrieval Pipeline

> **Goal:** Given a support ticket, find the most relevant chunks from the vector
> store — the "read path" of RAG: **embed query → similarity search → filter → rank.**
> This phase ends with the project's standout feature: a retrieval-inspection API
> that exposes exactly what would be sent to the LLM, with source, score, and rank.

## Learning objectives (secondary goal)

- How semantic (vector) similarity search actually works
- How metadata filtering restricts retrieval by document type / product
- How chunk size, top-K, and thresholds trade off recall vs. precision

## Prerequisites

- [ ] Phase 2 complete (populated vector store via `pnpm seed`)
- [ ] Reusing the `EmbeddingsProvider` from PR 2.4 to embed queries

---

### PR 3.1 — Query embedding + similarity search

**Objective:** Hand-written pgvector similarity search returning top-K chunks.

- [ ] **Test-first:** integration test over seeded data asserting a known query returns the expected chunk(s) in the top results (red)
- [ ] Embed the incoming query with the same model/dims used at ingest
- [ ] Write the similarity SQL **by hand** using the pgvector distance operator (`<=>` cosine), ordered ascending, `LIMIT k`
- [ ] Return chunk id, content, metadata, and a normalized **similarity score** (convert distance → score)
- [ ] Add a short note in `pgvector-queries` skill on why the index + operator must match

**Acceptance criteria**
- [ ] A seeded "payments failing intermittently" query surfaces the payment-timeout material
- [ ] Top-K is configurable; results are ordered by similarity
- [ ] The SQL is explicit (not hidden behind an ORM helper), for learning value

---

### PR 3.2 — Metadata filtering

**Objective:** Restrict retrieval by `source_type` and/or product.

- [ ] **Test-first:** tests asserting a `source_type` filter excludes other types, and product filters scope correctly (red)
- [ ] Add optional filter params (source types, product) to the retrieval function
- [ ] Combine the metadata predicate with the vector ordering in one query
- [ ] Validate filter inputs with Zod; reject unknown `source_type` values

**Acceptance criteria**
- [ ] Filtering by `source_type` returns only matching chunks
- [ ] Combined filter + similarity ordering is covered by a test
- [ ] Invalid filters produce a typed 4xx-style error, not a crash

---

### PR 3.3 — Ranking & result shaping

**Objective:** Produce a clean, stable, UI-ready result set.

- [ ] **Test-first:** tests asserting deterministic ordering and the result shape (red)
- [ ] Shape each result: `{ chunkId, documentTitle, sourceType, snippet, similarity, rank }`
- [ ] Assign `rank` (1..k) after ordering; ensure ties break deterministically
- [ ] Truncate/format `snippet` for display without losing the full content reference

**Acceptance criteria**
- [ ] Result shape matches a shared Zod schema reused by the API and web app
- [ ] Ordering is stable across repeated identical queries
- [ ] `rank` and `similarity` are both present and consistent

---

### PR 3.4 — Retrieval-tuning knobs

**Objective:** Make chunk size, top-K, and score threshold first-class config.

- [ ] **Test-first:** tests asserting threshold filtering drops low-score chunks and top-K caps results (red)
- [ ] Expose `topK`, `minSimilarity`, and (documented) chunk-size defaults via config
- [ ] Apply the similarity threshold after ordering
- [ ] Document recommended defaults and their recall/precision tradeoff in the `rag-ingestion` / `pgvector-queries` skills

**Acceptance criteria**
- [ ] Changing `topK`/`minSimilarity` changes results predictably under test
- [ ] Defaults are documented with rationale
- [ ] Below-threshold queries can legitimately return an empty set (handled downstream in Phase 4)

---

### PR 3.5 — Retrieval inspection API (headline feature)

**Objective:** Expose retrieved chunks *before* generation — source, content, score, rank.

- [ ] **Test-first:** Supertest spec asserting `POST /api/retrieve` returns ranked chunks with source/score/rank (red)
- [ ] Implement an Express route that runs the retrieval pipeline and returns the shaped results **without** calling the LLM
- [ ] Include the query echo and the effective config (topK, threshold, filters) in the response for transparency
- [ ] Reuse shared Zod schemas for request/response
- [ ] Document the endpoint (this is the feature reviewers will click first)

**Acceptance criteria**
- [ ] `POST /api/retrieve` returns inspectable chunks decoupled from generation
- [ ] Response includes source, content snippet, similarity score, and rank per chunk
- [ ] The endpoint is covered by an integration test over seeded data

---

## CI gates (this phase)

**No new CI gate or workflow change is added in Phase 3.** The new retrieval tests
and the `POST /api/retrieve` Supertest spec run inside the unit and
Testcontainers-integration jobs already established in Phases 1–2 (the integration
job migrates + seeds, so endpoint tests over seeded data are covered). Adding a new
gate here would protect nothing that the existing gates don't already cover — so per
the "never land a gate before it's required" rule, we add none.

- [ ] Confirm the new retrieval + `/api/retrieve` tests execute within the existing CI jobs (no `ci.yml` change needed)

---

## Definition of Done (Phase 3)

- [ ] Retrieval is accurate on the seed corpus and fully test-covered
- [ ] Metadata filtering, ranking, and tuning knobs all work and are documented
- [ ] `POST /api/retrieve` exposes the retrieval internals for the Phase 5 inspector UI
- [ ] Similarity SQL is hand-written and explained (learning goal satisfied)
- [ ] New retrieval/API tests pass under the existing CI gates with no new workflow added
