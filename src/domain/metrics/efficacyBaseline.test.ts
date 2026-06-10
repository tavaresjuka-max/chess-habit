import { describe, expect, it } from 'vitest';
import type { Signal, TrainingLog } from '../types';
import { buildEfficacyBaseline } from './efficacyBaseline';

function createLog(date: string, overrides?: Partial<TrainingLog>): TrainingLog {
  return {
    id: `${date}:${overrides?.blockId ?? 'b1'}`,
    date,
    blockId: 'b1',
    blockTitle: 'Garfos',
    source: 'lichess',
    destinationLabel: 'Puzzles Lichess',
    plannedSeconds: 600,
    startedAt: `${date}T10:00:00.000Z`,
    elapsedSeconds: 600,
    timeLimitReached: false,
    status: 'done',
    updatedAt: `${date}T10:10:00.000Z`,
    ...overrides,
  };
}

describe('buildEfficacyBaseline', () => {
  it('returns an empty-but-honest baseline without data', () => {
    const baseline = buildEfficacyBaseline({ allLogs: [], signals: [], today: '2026-06-10' });

    expect(baseline.capturedAt).toBe('2026-06-10');
    expect(baseline.puzzleAttempts).toBe(0);
    expect(baseline.overallPuzzleAccuracyPercent).toBeUndefined();
    expect(baseline.sessionCompletionPercent).toBeUndefined();
    expect(baseline.averageDaysBetweenSessions).toBeUndefined();
    expect(baseline.blundersPerGame).toBeUndefined();
  });

  it('computes the four approved metrics from local data', () => {
    const logs = [
      createLog('2026-06-04'),
      createLog('2026-06-07', { blockId: 'b2' }),
      createLog('2026-06-10', {
        blockId: 'b3',
        result: {
          source: 'lichess',
          kind: 'puzzle-dashboard',
          fetchedAt: '2026-06-10T10:10:00.000Z',
          since: '2026-06-03T00:00:00.000Z',
          until: '2026-06-10T10:10:00.000Z',
          days: 7,
          puzzles: 10,
          wins: 8,
          losses: 2,
          themes: ['fork'],
          themeStats: [{ theme: 'fork', attempts: 10, losses: 2 }],
          weakThemes: [],
          strongThemes: ['fork'],
        },
      }),
      createLog('2026-06-10', { blockId: 'b4', status: 'skipped' }),
    ];
    const signals: Signal[] = [
      {
        source: 'chesscom',
        confidence: 'medium',
        observedAt: '2026-06-09T00:00:00.000Z',
        value: { kind: 'judgment', blunders: 12, mistakes: 8, inaccuracies: 4, games: 10 },
      },
    ];

    const baseline = buildEfficacyBaseline({ allLogs: logs, signals, today: '2026-06-10' });

    expect(baseline.overallPuzzleAccuracyPercent).toBe(80);
    expect(baseline.puzzleAttempts).toBe(10);
    expect(baseline.sessionCompletionPercent).toBe(75);
    expect(baseline.averageDaysBetweenSessions).toBe(3);
    expect(baseline.blundersPerGame).toBe(1.2);
  });
});
