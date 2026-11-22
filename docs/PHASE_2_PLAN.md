# Phase 2 — Document Ingestion Pipeline

> **Goal:** Turn raw knowledge sources (technical docs, historical tickets,
> troubleshooting guides, application logs) into searchable vector embeddings stored
> in PostgreSQL + pgvector, with metadata preserved for later filtering.
>
> This is the "write path" of RAG: **parse → chunk → embed → store.**

## Learning objectives (secondary goal)

- How documents are split into useful retrieval units (chunking + overlap)
- How text becomes vectors (embeddings) and how to batch them economically
- How embeddings, text, and metadata live together in a vector store

## Prerequisites

- [ ] Phase 1 complete (monorepo, Docker, TDD harness, pgvector container)
- [ ] `OPENAI_API_KEY` set in `.env`

## Data model (introduced here)

```
documents            chunks
----------           ----------
id (pk)        1───*  id (pk)
source_type           document_id (fk)
title                 chunk_index
uri/path              content (text)
raw_hash              embedding (vector(1536))   -- text-embedding-3-small
metadata (jsonb)      metadata (jsonb)           -- source_type, product, etc.
created_at            token_count
                      created_at
```

`source_type ∈ { technical_doc, historical_ticket, troubleshooting_guide, app_log }`

---

### PR 2.1 — Database schema & migrations

**Objective:** Create the `documents` and `chunks` tables with a pgvector column.

- [ ] **Test-first:** write a Testcontainers integration test that boots `pgvector/pgvector:pg16`, runs migrations, and asserts both tables + the `vector` column exist (red)
- [ ] Enable the `vector` extension in the first migration
- [ ] Define Drizzle schema for `documents` and `chunks` (embedding `vector(1536)`, metadata `jsonb`, `source_type` enum)
- [ ] Add a **unique constraint on `documents.uri/path`** — the stable identity key that ingestion upserts against (so changed content updates in place rather than inserting a duplicate; see PR 2.5)
- [ ] Add an index strategy note (IVFFlat/HNSW) — create the vector index in a migration
- [ ] Wire `drizzle-kit` generate/apply into the `/migrate` command and `Makefile`

**Acceptance criteria**
- [ ] Integration test spins up Postgres, migrates, and passes in CI-like isolation
- [ ] `make migrate` applies cleanly against the dev `db` container
- [ ] Re-running migrations is idempotent

---

### PR 2.2 — Source parsers

**Objective:** Normalize each input format into a common `ParsedDocument` record.

- [ ] Define `ParsedDocument` Zod schema in `packages/shared`
- [ ] **Test-first:** unit tests with fixtures for each parser (red)
- [ ] Markdown parser (strip formatting, keep headings as metadata)
- [ ] JSON parser for historical tickets (map fields → content + metadata, including resolution)
- [ ] Plain-text log parser (preserve timestamps/levels as metadata)
- [ ] PDF parser (extract text; handle multi-page)
- [ ] A dispatcher that selects a parser by file type/`source_type`

**Acceptance criteria**
- [ ] Every parser has fixture-based unit tests covering a happy path + one malformed input
- [ ] All parsers emit a valid `ParsedDocument` (schema-validated)
- [ ] Unsupported inputs fail with a clear, typed error (not a crash)

---

### PR 2.3 — Chunking

**Objective:** Split documents into token-aware chunks with overlap and metadata.

- [ ] **Test-first:** tests asserting chunk size bounds, overlap correctness, and metadata propagation (red)
- [ ] Implement a configurable chunker (target tokens, overlap tokens)
- [ ] Attach source metadata to every chunk (`source_type`, `document_id`, heading/section, product)
- [ ] Preserve `chunk_index` ordering
- [ ] Property tests: no chunk exceeds max tokens; concatenated chunks cover the source (minus overlap)

**Acceptance criteria**
- [ ] Chunk size and overlap are configuration, not hard-coded
- [ ] Metadata on each chunk is sufficient for Phase 3 filtering
- [ ] Property tests pass across varied input lengths

---

### PR 2.4 — Embeddings client

**Objective:** A tested, mockable OpenAI embeddings wrapper.

- [ ] **Test-first:** unit tests against a **fake** embeddings provider (no network) asserting batching, retry, and output shape (red)
- [ ] Implement an `EmbeddingsProvider` interface + OpenAI implementation (`text-embedding-3-small`, 1536 dims)
- [ ] Batch inputs to respect token/request limits
- [ ] Add retry with backoff for rate limits/5xx
- [ ] Log token usage + estimated cost per batch
- [ ] Provide a deterministic fake implementation for tests/CI

**Acceptance criteria**
- [ ] Core logic is unit-tested without hitting the network (fake provider)
- [ ] Batching + retry are covered by tests
- [ ] A single documented integration test may hit the real API behind a flag

---

### PR 2.5 — Ingestion orchestrator + CLI + seed data

**Objective:** End-to-end `parse → chunk → embed → upsert`, runnable and idempotent.

- [ ] **Test-first:** integration test ingesting a small fixture corpus and asserting rows in `documents`/`chunks` with non-null embeddings (red)
- [ ] Implement the orchestrator pipeline tying PRs 2.2–2.4 to the DB
- [ ] Make ingestion idempotent keyed on the stable `uri/path` identity (not the content hash): compute the source `raw_hash`; if a document with that `uri/path` exists and its `raw_hash` is unchanged, skip (no-op); if the content changed, update the document row and **replace its chunks** (delete old chunks, then re-chunk + re-embed) so nothing is duplicated or orphaned
- [ ] Add a CLI entry (`pnpm ingest <path>`) wired into the Makefile
- [ ] Create a `seed/` corpus: sample technical docs, resolved tickets, troubleshooting guides, and incident logs (including a payment-timeout example matching the project's demo ticket)
- [ ] Add `pnpm seed` to load the corpus into the dev DB

**Acceptance criteria**
- [ ] `pnpm seed` populates the DB and the integration test passes
- [ ] Re-ingesting unchanged content is a no-op; re-ingesting changed content updates the document and replaces its chunks (no duplicate rows, no orphaned chunks)
- [ ] The seed corpus is rich enough to make Phase 3/4 demos meaningful

---

### PR 2.6 — CI gate: database integration tests

**Objective:** Extend the Phase 1 CI workflow to run the Testcontainers DB
integration tests now that they exist. **This gate lands now because the schema,
migrations, and integration tests exist as of this phase — not before.**

- [ ] Add an `integration` job (or step) to `.github/workflows/ci.yml` running the Testcontainers suite (Docker is available on GitHub-hosted runners)
- [ ] **Gate:** migrations apply cleanly and the schema / `vector` extension assertions pass
- [ ] **Gate:** ingestion integration test passes against the ephemeral `pgvector/pgvector:pg16` container
- [ ] Keep unit and integration as separate jobs/steps so failures are legible
- [ ] Ensure embeddings-dependent tests use the **fake** provider so CI needs no OpenAI key or network
- [ ] **Gate-scope note (document in-workflow):** still no LLM/web/E2E gates — those arrive in Phases 4 and 5 when that code lands

**Acceptance criteria**
- [ ] CI spins up pgvector via Testcontainers and runs migrations + integration tests on every PR
- [ ] The full CI suite passes with no `OPENAI_API_KEY` and no network egress
- [ ] Integration failures block merge

---

## Definition of Done (Phase 2)

- [ ] `make up && pnpm seed` yields a populated, queryable vector store
- [ ] CI now gates Testcontainers DB integration tests on every PR (still key-free, network-free)
- [ ] Every PR shipped with tests written first
- [ ] Embedding generation is mockable and covered without network calls
- [ ] Chunk metadata supports the filtering Phase 3 will rely on
