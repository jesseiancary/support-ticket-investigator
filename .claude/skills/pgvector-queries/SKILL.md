---
name: pgvector-queries
description: How vector similarity search is written by hand for this project — pgvector distance operators, index choice, and metadata filtering. Use when writing or reviewing retrieval SQL against the chunks table (Phase 3).
---

# Hand-written pgvector similarity search

Retrieval SQL is written **by hand** in this project (not hidden behind an ORM helper) —
that explicitness is deliberate, both for learning value and to make the headline
retrieval-inspection feature legible. The read-path is: **embed query → similarity search →
filter → rank**.

## The core query

- Column: `chunks.embedding vector(1536)` (from `text-embedding-3-small`). The query must
  be embedded with the **same model and dimensions** used at ingest, or distances are
  meaningless.
- Distance operator: **cosine `<=>`**, ordered **ascending** (smaller distance = more
  similar), `LIMIT k`.

```sql
SELECT id, document_id, content, metadata,
       1 - (embedding <=> $1) AS similarity   -- normalize distance → 0..1 score
FROM chunks
ORDER BY embedding <=> $1
LIMIT $2;
```

- Return `chunkId`, content, metadata, and a **normalized similarity score** (convert the
  distance; cosine distance `d` → similarity `1 - d`). Higher score = better.
- Pass the query embedding as a bound parameter (`$1`), never string-interpolated.

## Index ↔ operator must match

The vector index (IVFFlat or HNSW) is created with an **operator class** tied to a distance
metric (e.g. `vector_cosine_ops`). The index is only used if the query's `ORDER BY`
operator matches that class. **If you order by `<=>` (cosine), the index must be the cosine
op-class** — otherwise Postgres falls back to a full scan and the index buys nothing. Keep
operator, op-class, and the ingest-time normalization consistent.

## Metadata filtering

- Filter on `source_type` and/or `product` by combining a predicate on the `jsonb`
  metadata (or the typed column) with the vector `ORDER BY` in **one** query — filter and
  rank together, don't post-filter in app code after a broad fetch.
- Validate filter inputs with Zod against the shared `sourceType` enum; reject unknown
  `source_type` values with a typed 4xx — never a locally re-declared list of literals.

```sql
... FROM chunks
WHERE metadata->>'source_type' = ANY($3)   -- validated against shared sourceType enum
ORDER BY embedding <=> $1
LIMIT $2;
```

## Ranking, shaping, tuning

- Assign `rank` (1..k) **after** ordering; break ties deterministically (e.g. by `chunkId`)
  so repeated identical queries return identical order.
- Result shape is the shared `RetrievedChunk` Zod schema
  (`{ chunkId, documentTitle, sourceType, snippet, similarity, rank }`) in
  `packages/shared` — reused verbatim by the API and web client, never re-declared.
- Apply the `minSimilarity` threshold **after** ordering; `topK` caps results. An
  all-below-threshold query may legitimately return an empty set (handled in Phase 4).
  Higher `topK`/lower threshold → recall; lower `topK`/higher threshold → precision.
