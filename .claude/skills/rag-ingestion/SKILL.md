---
name: rag-ingestion
description: Conventions for the document ingestion write-path — parsing, chunking, embedding, and the documents/chunks metadata schema. Use when parsing sources, splitting into chunks, generating embeddings, or deciding what metadata to store (Phase 2).
---

# RAG ingestion conventions

The write-path of RAG for this project: **parse → chunk → embed → upsert**. Everything
here must stay consistent with the retrieval read-path (see the `pgvector-queries` skill) —
the embedding model and dimensions, in particular, must match on both sides.

## Data model (authoritative)

```
documents                      chunks
---------                      ------
id            (pk)      1──*   id            (pk)
source_type   (enum)           document_id   (fk → documents)
title                          chunk_index   (ordering, 0-based)
uri/path      (UNIQUE)         content       (text)
raw_hash                       embedding     vector(1536)   -- text-embedding-3-small
metadata      (jsonb)          metadata      (jsonb)        -- source_type, product, heading…
created_at                     token_count
                               created_at
```

- `source_type ∈ { technical_doc, historical_ticket, troubleshooting_guide, app_log }`.
  Defined **once** as the shared Zod `sourceType` enum in `packages/shared`; parsers,
  filters, the Drizzle `pgEnum`, and citations all reuse it — never re-list the literals.
- `documents.uri/path` is **UNIQUE** — it is the stable identity key ingestion upserts
  against (not the content hash).

## Parsing

- Normalize every input format into a single `ParsedDocument` (Zod schema in
  `packages/shared`): markdown (strip formatting, keep headings as metadata), JSON tickets
  (map fields → content + metadata incl. resolution), plain-text logs (preserve
  timestamps/levels as metadata), PDF (extract text, handle multi-page).
- A dispatcher selects the parser by file type / `source_type`.
- Unsupported input fails with a **clear typed error**, never a crash.

## Chunking

- Token-aware chunker with **configurable** target tokens + overlap tokens — never
  hard-coded. Overlap preserves context across boundaries.
- Propagate metadata onto **every** chunk: `source_type`, `document_id`, heading/section,
  `product`. This metadata is what Phase 3 filtering depends on — if it isn't on the chunk,
  you can't filter on it later.
- Preserve `chunk_index` ordering. Invariant: no chunk exceeds max tokens; concatenated
  chunks cover the source (minus overlap).

## Embedding

- Model **`text-embedding-3-small`**, **1536 dims** — must match the `vector(1536)` column
  and the query-time embedding exactly.
- Go through the `EmbeddingsProvider` interface. **Batch** inputs to respect token/request
  limits; **retry with backoff** on rate-limits/5xx; **log token usage + estimated cost**
  per batch. (See the `openai-integration` skill.)
- Tests use the deterministic **fake** provider — no network.

## Idempotent upsert (keyed on uri/path)

Compute `raw_hash` of the source. If a `documents` row with that `uri/path` exists and its
`raw_hash` is unchanged → **no-op**. If the content changed → update the document row and
**replace its chunks** (delete old chunks, then re-chunk + re-embed). Never leave duplicate
or orphaned chunks.

## Tuning defaults (recall vs. precision)

Chunk size/overlap, `topK`, and `minSimilarity` trade recall against precision. Keep them
configuration, document chosen defaults with rationale, and keep the ingest-time chunk
settings in sync with what retrieval expects.
