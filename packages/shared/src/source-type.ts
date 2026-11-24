import { z } from 'zod';

/**
 * The kinds of knowledge sources the investigator ingests and retrieves over.
 *
 * This is the **single source of truth** for the `source_type` domain enum. Everything
 * that needs these values — the Drizzle `pgEnum`, parsers, retrieval filters, and
 * citations — derives them from `sourceType.options` rather than re-listing the literals,
 * so there is exactly one authoritative definition and no drift.
 *
 * Values are `snake_case` per the project's domain-enum convention.
 */
export const sourceType = z.enum([
  'technical_doc',
  'historical_ticket',
  'troubleshooting_guide',
  'app_log',
]);

export type SourceType = z.infer<typeof sourceType>;
