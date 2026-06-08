import { describe, expect, it } from 'vitest';
import type { TrainingLog } from '../types';
import { buildPuzzleThemeStats } from './puzzleThemeStats';

function doneLog(input: {
  id: string;
  since: string;
  until: string;
  themeStats?: NonNullable<TrainingLog['result']>['themeStats'];
}): TrainingLog {
  return {
    id: input.id,
    date: input.until.slice(0, 10),
    blockId: `${input.id}-block`,
    blockTitle: 'Tema do dia',
    source: 'lichess',
    destinationLabel: 'Puzzles Lichess: Fork',
    plannedSeconds: 600,
    startedAt: input.since,
    completedAt: input.until,
    elapsedSeconds: 600,
    timeLimitReached: false,
    status: 'done',
    result: {
      source: 'lichess',
      kind: 'puzzle-activity',
      fetchedAt: input.until,
      since: input.since,
      until: input.until,
      puzzles: 3,
      wins: 1,
      losses: 2,
      themes: ['fork'],
      ...(input.themeStats === undefined ? {} : { themeStats: input.themeStats }),
    },
    updatedAt: input.until,
  };
}

describe('buildPuzzleThemeStats', () => {
  it('aggregates reconciled puzzle stats by theme', () => {
    const stats = buildPuzzleThemeStats([
      doneLog({
        id: 'a',
        since: '2026-06-08T10:00:00.000Z',
        until: '2026-06-08T10:10:00.000Z',
        themeStats: [
          { theme: 'fork', attempts: 3, losses: 2 },
          { theme: 'pin', attempts: 2, losses: 0 },
        ],
      }),
      doneLog({
        id: 'b',
        since: '2026-06-08T12:00:00.000Z',
        until: '2026-06-08T12:10:00.000Z',
        themeStats: [{ theme: 'fork', attempts: 2, losses: 1 }],
      }),
    ]);

    expect(stats).toEqual({
      since: '2026-06-08T10:00:00.000Z',
      until: '2026-06-08T12:10:00.000Z',
      themes: [
        { theme: 'fork', attempts: 5, losses: 3 },
        { theme: 'pin', attempts: 2, losses: 0 },
      ],
    });
  });

  it('returns undefined when logs do not have per-theme stats', () => {
    expect(
      buildPuzzleThemeStats([
        doneLog({
          id: 'a',
          since: '2026-06-08T10:00:00.000Z',
          until: '2026-06-08T10:10:00.000Z',
        }),
      ]),
    ).toBeUndefined();
  });
});
