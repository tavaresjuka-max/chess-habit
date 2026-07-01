import { describe, expect, it } from 'vitest';
import { createKnownManualSignals, createTutorQuestionSignal } from './knownManualSignals';

describe('createKnownManualSignals', () => {
  it('creates generic manual weakness signals without PGN text', () => {
    const signals = createKnownManualSignals('2026-06-06T00:00:00.000Z');

    expect(signals).toHaveLength(5);
    expect(signals.every((signal) => signal.source === 'outro')).toBe(true);
    expect(signals.every((signal) => signal.value.kind === 'manual')).toBe(true);
    expect(JSON.stringify(signals)).not.toContain('PGN');
  });

  it('turns a Professor Tavarez answer into a single manual signal', () => {
    const signal = createTutorQuestionSignal('loose-piece', '2026-06-08T10:00:00.000Z');

    expect(signal).toMatchObject({
      source: 'outro',
      confidence: 'medium',
      observedAt: '2026-06-08T10:00:00.000Z',
      value: {
        kind: 'manual',
        tag: 'hanging-piece',
      },
    });
    expect(signal.value.kind === 'manual' ? signal.value.note : undefined).toContain('peça solta');
  });
});
