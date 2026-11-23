import { sourceType, type SourceType } from "@sti/shared";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

/**
 * Drizzle schema for the RAG write-path store (Phase 2 data model).
 *
 * `documents` holds one row per ingested knowledge source; `chunks` holds its
 * token-aware pieces with their embeddings. See `docs/PHASE_2_PLAN.md`.
 */

/**
 * The `source_type` Postgres enum is built from the **shared** Zod enum's value list —
 * the single source of truth. The literals are never re-typed here (see `@sti/shared`'s
 * `sourceType`), so the DB enum can never drift from the parsers / filters / citations.
 */
// `pgEnum` wants a non-empty tuple; `sourceType.options` is the authoritative value list
// (typed as a plain array). The assertion narrows the type only — the values still come
// solely from the shared enum, so there is no re-typed literal and no drift.
export const sourceTypeEnum = pgEnum(
  "source_type",
  sourceType.options as [SourceType, ...SourceType[]],
);

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceType: sourceTypeEnum("source_type").notNull(),
  title: text("title").notNull(),
  // The stable identity key ingestion upserts against (PR 2.5) — UNIQUE so changed
  // content updates in place rather than inserting a duplicate.
  uri: text("uri").notNull().unique(),
  // Content hash of the source; lets ingestion skip unchanged documents as a no-op.
  rawHash: text("raw_hash").notNull(),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const chunks = pgTable(
  "chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    chunkIndex: integer("chunk_index").notNull(),
    content: text("content").notNull(),
    // 1536 dims = OpenAI `text-embedding-3-small`; must match the query-time embedding.
    embedding: vector("embedding", { dimensions: 1536 }).notNull(),
    metadata: jsonb("metadata").notNull().default({}),
    tokenCount: integer("token_count").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // One row per (document, position); also keeps chunk ordering unique per document.
    // Its leftmost column (document_id) also serves fk-keyed lookups, document-scoped
    // queries, and the chunk-replacement delete during re-ingest — so no separate btree
    // on document_id is needed.
    unique("chunks_document_id_chunk_index_unique").on(table.documentId, table.chunkIndex),
    // Approximate-nearest-neighbour index for similarity search.
    //
    // Index strategy: HNSW over IVFFlat. HNSW gives better recall/latency at this corpus
    // size, needs no training (IVFFlat's list centroids require representative data to
    // exist first — awkward for a seed-then-query demo), and stays accurate as rows are
    // added incrementally during ingestion. The cost (slower build, more memory) is
    // immaterial for a demo-scale store.
    //
    // The op-class (`vector_cosine_ops`) must match the cosine distance operator (`<=>`)
    // used by the Phase 3 retrieval query, or Postgres falls back to a full scan.
    index("chunks_embedding_hnsw_idx").using("hnsw", table.embedding.op("vector_cosine_ops")),
  ],
);
