import { describe, expect, it } from 'vitest';

import { health } from './health';

describe('health', () => {
  it("returns 'ok' to prove the toolchain is wired end-to-end", () => {
    expect(health()).toBe('ok');
  });
});
