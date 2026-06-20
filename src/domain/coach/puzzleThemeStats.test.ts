import { describe, expect, it } from 'vitest';
import type { PuzzleThemeStat, TrainingLog } from '../types';
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

function dashboardLog(input: {
  id: string;
  since: string;
  until: string;
  themeStats: PuzzleThemeStat[];
}): TrainingLog {
  return {
    id: input.id,
    date: input.until.slice(0, 10),
    blockId: `${input.id}-block`,
    blockTitle: 'Dashboard Lichess',
    source: 'lichess',
    destinationLabel: 'Dashboard Lichess',
    plannedSeconds: 0,
    startedAt: input.until,
    completedAt: input.until,
    elapsedSeconds: 0,
    timeLimitReached: false,
    status: 'done',
    result: {
      source: 'lichess',
      kind: 'puzzle-dashboard',
      fetchedAt: input.until,
      since: input.since,
      until: input.until,
      days: 30,
      puzzles: input.themeStats.reduce((total, theme) => total + theme.attempts, 0),
      wins: input.themeStats.reduce((total, theme) => total + theme.attempts - theme.losses, 0),
      losses: input.themeStats.reduce((total, theme) => total + theme.losses, 0),
      themes: input.themeStats.map((theme) => theme.theme),
      weakThemes: input.themeStats.filter((theme) => theme.losses > 0).map((theme) => theme.theme),
      strongThemes: [],
      themeStats: input.themeStats,
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

  it('does not double-count puzzle dashboard diagnostic snapshots', () => {
    const activityLog = doneLog({
      id: 'activity',
      since: '2026-06-08T10:00:00.000Z',
      until: '2026-06-08T10:10:00.000Z',
      themeStats: [{ theme: 'fork', attempts: 3, losses: 2 }],
    });
    const dashboardLog: TrainingLog = {
      ...activityLog,
      id: 'dashboard',
      blockId: 'lichess-puzzle-dashboard',
      result: {
        source: 'lichess',
        kind: 'puzzle-dashboard',
        fetchedAt: '2026-06-08T10:11:00.000Z',
        since: '2026-05-09T10:11:00.000Z',
        until: '2026-06-08T10:11:00.000Z',
        days: 30,
        puzzles: 40,
        wins: 30,
        losses: 10,
        themes: ['fork'],
        weakThemes: ['fork'],
        strongThemes: [],
        themeStats: [{ theme: 'fork', attempts: 40, losses: 10 }],
      },
    };

    expect(buildPuzzleThemeStats([activityLog, dashboardLog])).toEqual({
      since: '2026-06-08T10:00:00.000Z',
      until: '2026-06-08T10:10:00.000Z',
      themes: [{ theme: 'fork', attempts: 3, losses: 2 }],
    });
  });

  it('uses the latest puzzle dashboard snapshot when no activity stats exist', () => {
    const stats = buildPuzzleThemeStats([
      dashboardLog({
        id: 'old-dashboard',
        since: '2026-05-08T10:00:00.000Z',
        until: '2026-06-07T10:00:00.000Z',
        themeStats: [{ theme: 'pin', attempts: 10, losses: 6 }],
      }),
      dashboardLog({
        id: 'latest-dashboard',
        since: '2026-05-09T10:00:00.000Z',
        until: '2026-06-08T10:00:00.000Z',
        themeStats: [
          { theme: 'fork', attempts: 8, losses: 5 },
          { theme: 'pin', attempts: 9, losses: 2 },
        ],
      }),
    ]);

    expect(stats).toEqual({
      since: '2026-05-09T10:00:00.000Z',
      until: '2026-06-08T10:00:00.000Z',
      themes: [
        { theme: 'fork', attempts: 8, losses: 5 },
        { theme: 'pin', attempts: 9, losses: 2 },
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
