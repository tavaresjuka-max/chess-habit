import { describe, expect, it } from 'vitest';
import { assertNever } from './assertNever';

describe('assertNever', () => {
  it('throws with the unexpected union value', () => {
    expect(() => assertNever('unexpected' as never)).toThrow(/unexpected/);
  });
});
