import { describe, expect, it } from 'vitest';

import { sourceType } from './source-type';

describe('sourceType', () => {
  // These four values are the single source of truth for the `source_type` domain enum
  // (the Drizzle pgEnum, parsers, and retrieval filters all derive from this list). This
  // test pins them so a drift is caught here rather than silently in a migration.
  it('exposes exactly the four knowledge-source kinds', () => {
    expect(sourceType.options).toEqual([
      'technical_doc',
      'historical_ticket',
      'troubleshooting_guide',
      'app_log',
    ]);
  });

  it('accepts a valid value and rejects an unknown one', () => {
    expect(sourceType.parse('app_log')).toBe('app_log');
    expect(sourceType.safeParse('unknown_kind').success).toBe(false);
  });
});
