import { describe, expect, it } from 'vitest';
import type { TrainingLog } from '../types';
import { buildProgressTrend, buildSkillMap, buildTrackEffort } from './progressOverview';

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
    completedAt: `${date}T10:10:00.000Z`,
    elapsedSeconds: 600,
    timeLimitReached: false,
    status: 'done',
    updatedAt: `${date}T10:10:00.000Z`,
    ...overrides,
  };
}

describe('buildSkillMap', () => {
  it('uses only the latest dashboard snapshot to avoid double counting', () => {
    const logs = [
      createLog('2026-06-09', {
        result: {
          source: 'lichess',
          kind: 'puzzle-dashboard',
          fetchedAt: '2026-06-09T10:10:00.000Z',
          since: '2026-06-02T00:00:00.000Z',
          until: '2026-06-09T10:10:00.000Z',
          days: 7,
          puzzles: 20,
          wins: 14,
          losses: 6,
          themes: ['fork', 'pin'],
          themeStats: [
            { theme: 'fork', attempts: 12, losses: 3 },
            { theme: 'pin', attempts: 8, losses: 3 },
          ],
          weakThemes: ['pin'],
          strongThemes: ['fork'],
        },
      }),
      createLog('2026-06-10', {
        blockId: 'b2',
        result: {
          source: 'lichess',
          kind: 'puzzle-dashboard',
          fetchedAt: '2026-06-10T10:10:00.000Z',
          since: '2026-06-03T00:00:00.000Z',
          until: '2026-06-10T10:10:00.000Z',
          days: 7,
          puzzles: 4,
          wins: 4,
          losses: 0,
          themes: ['fork'],
          themeStats: [{ theme: 'fork', attempts: 4, losses: 0 }],
          weakThemes: [],
          strongThemes: ['fork'],
        },
      }),
    ];

    const skillMap = buildSkillMap(logs);

    expect(skillMap).toEqual([{ theme: 'fork', attempts: 4, wins: 4, accuracyPercent: 100 }]);
  });

  it('aggregates real puzzle activity when no dashboard snapshot exists', () => {
    const logs = [
      createLog('2026-06-09', {
        result: {
          source: 'lichess',
          kind: 'puzzle-activity',
          fetchedAt: '2026-06-09T10:10:00.000Z',
          since: '2026-06-09T10:00:00.000Z',
          until: '2026-06-09T10:10:00.000Z',
          puzzles: 12,
          wins: 9,
          losses: 3,
          themes: ['fork'],
          themeStats: [{ theme: 'fork', attempts: 12, losses: 3 }],
        },
      }),
      createLog('2026-06-10', {
        blockId: 'b2',
        result: {
          source: 'lichess',
          kind: 'puzzle-activity',
          fetchedAt: '2026-06-10T10:10:00.000Z',
          since: '2026-06-10T10:00:00.000Z',
          until: '2026-06-10T10:10:00.000Z',
          puzzles: 4,
          wins: 4,
          losses: 0,
          themes: ['fork'],
          themeStats: [{ theme: 'fork', attempts: 4, losses: 0 }],
        },
      }),
    ];

    expect(buildSkillMap(logs)).toEqual([{ theme: 'fork', attempts: 16, wins: 13, accuracyPercent: 81 }]);
  });

  it('returns empty without reconciled data', () => {
    expect(buildSkillMap([createLog('2026-06-10')])).toEqual([]);
  });
});

describe('buildTrackEffort', () => {
  it('sums minutes and blocks per method track, bucketing legacy logs', () => {
    const logs = [
      createLog('2026-06-09', { methodTrackId: 'calculation-bridge' }),
      createLog('2026-06-10', { blockId: 'b2', methodTrackId: 'calculation-bridge', elapsedSeconds: 300 }),
      createLog('2026-06-10', { blockId: 'b3' }),
      createLog('2026-06-10', { blockId: 'b4', status: 'skipped' }),
    ];

    const effort = buildTrackEffort(logs);

    expect(effort[0]).toMatchObject({ trackId: 'calculation-bridge', minutes: 15, blocks: 2 });
    expect(effort[0]?.title).toBe('Cálculo Ponte 800-1200');
    expect(effort[1]).toMatchObject({ trackId: 'sem-trilha', minutes: 10, blocks: 1 });
  });
});

describe('buildProgressTrend', () => {
  it('returns undefined with no recent training', () => {
    expect(buildProgressTrend([], '2026-06-10')).toBeUndefined();
  });

  it('compares this week with the previous week', () => {
    const logs = [
      createLog('2026-06-10'),
      createLog('2026-06-09', { blockId: 'b2', elapsedSeconds: 1200 }),
      createLog('2026-06-01', { blockId: 'b3', elapsedSeconds: 1800 }),
    ];

    const trend = buildProgressTrend(logs, '2026-06-10');

    expect(trend?.thisWeekMinutes).toBe(30);
    expect(trend?.previousWeekMinutes).toBe(30);
    expect(trend?.line).toContain('Ritmo mantido');
  });

  it('encourages without scolding when the week shrank', () => {
    const logs = [
      createLog('2026-06-10', { elapsedSeconds: 300 }),
      createLog('2026-06-01', { blockId: 'b2', elapsedSeconds: 3600 }),
    ];

    const trend = buildProgressTrend(logs, '2026-06-10');

    expect(trend?.line).toContain('contam');
    expect(trend?.line).not.toContain('!');
  });
});
