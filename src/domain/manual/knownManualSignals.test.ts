import { describe, expect, it } from 'vitest';
import { createKnownManualSignals } from './knownManualSignals';

describe('createKnownManualSignals', () => {
  it('creates generic manual weakness signals without PGN text', () => {
    const signals = createKnownManualSignals('2026-06-06T00:00:00.000Z');

    expect(signals).toHaveLength(5);
    expect(signals.every((signal) => signal.source === 'outro')).toBe(true);
    expect(signals.every((signal) => signal.value.kind === 'manual')).toBe(true);
    expect(JSON.stringify(signals)).not.toContain('PGN');
  });
});
