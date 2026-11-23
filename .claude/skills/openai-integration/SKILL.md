---
name: openai-integration
description: Patterns for calling OpenAI in this project — chat + embeddings wrappers behind interfaces, retry/backoff, structured output validated with Zod, token/cost logging, and deterministic fakes for tests. Use when writing or reviewing any OpenAI integration code (Phases 2 and 4).
---

# OpenAI integration patterns

All OpenAI access goes through **narrow interfaces** with an OpenAI implementation and a
deterministic **fake** — so core logic is unit-tested with **no network and no API key**.

## Interfaces + fakes (the key rule)

- `EmbeddingsProvider` (Phase 2) and `ChatProvider` (Phase 4) are interfaces. Production
  code depends on the interface, not the SDK directly.
- Every unit test uses the **fake** implementation: deterministic outputs, no network.
  Only a single, explicitly **flagged** integration test per provider may hit the real API.
- CI runs green with **no `OPENAI_API_KEY` and no network egress**.

## Embeddings

- Model **`text-embedding-3-small`**, **1536 dims** — must match the `vector(1536)` column
  and the query-time embedding (see `rag-ingestion` / `pgvector-queries`).
- **Batch** inputs to respect token/request limits; one request per batch, not per item.
- **Retry with backoff** on 429 / 5xx.
- **Log token usage + estimated cost** per batch.

## Chat + structured output

- Request **JSON structured output constrained to the schema**, then **validate with Zod**
  (`InvestigationReport` in `packages/shared`). The Zod schema is the contract — the model
  output is untrusted until it parses.
- On validation failure, run **one bounded repair attempt** (feed the error back), then
  **fail cleanly** with a typed error. No unbounded retry loops.
- Add request **timeout** + **retry/backoff**; **log token usage + cost**.
- **Grounding:** after validation, cross-check every `evidence.citation.chunkId` against
  the chunks actually retrieved. Drop/flag any citation that doesn't resolve — a report may
  never cite a chunk that wasn't retrieved (anti-hallucination guard).

## Conventions

- Keep assemblers/transformers **pure and testable**; isolate the network call at the edge.
- Never log full secrets. The API key comes from `OPENAI_API_KEY` in `.env` (gitignored) —
  never hard-coded, never committed.
- Types that cross package boundaries are Zod schemas in `packages/shared` with `z.infer`.
