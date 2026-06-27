import { describe, expect, it } from 'vitest';
import type { TrainingLog } from '../types';
import { buildSkillMap } from '../metrics/progressOverview';
import { applyDiplomaProgress } from './evaluateDiplomas';

const NOW = '2026-06-19T12:00:00.000Z';

function dashboardLog(themeStats: { theme: string; attempts: number; losses: number }[]): TrainingLog[] {
  const puzzles = themeStats.reduce((sum, stat) => sum + stat.attempts, 0);
  const losses = themeStats.reduce((sum, stat) => sum + stat.losses, 0);

  return [
    {
      id: '2026-06-19:lichess-puzzle-dashboard',
      date: '2026-06-19',
      blockId: 'lichess-puzzle-dashboard',
      blockTitle: 'Snapshot do Lichess',
      source: 'lichess',
      destinationLabel: 'Lichess Puzzles',
      logKind: 'standard',
      plannedSeconds: 0,
      startedAt: NOW,
      completedAt: NOW,
      elapsedSeconds: 0,
      timeLimitReached: false,
      status: 'done',
      updatedAt: NOW,
      result: {
        source: 'lichess',
        kind: 'puzzle-dashboard',
        fetchedAt: NOW,
        since: '2026-05-20T00:00:00.000Z',
        until: NOW,
        days: 30,
        puzzles,
        wins: puzzles - losses,
        losses,
        themes: themeStats.map((stat) => stat.theme),
        themeStats,
        weakThemes: [],
        strongThemes: themeStats.map((stat) => stat.theme),
      },
    },
  ];
}

describe('buildSkillMap → applyDiplomaProgress → promoção de banda', () => {
  it('promove de 400-800 para 800-1000 quando o dashboard fecha o diploma do Peão', () => {
    const logs = dashboardLog([
      { theme: 'hangingPiece', attempts: 30, losses: 3 },
      { theme: 'mateIn1', attempts: 30, losses: 3 },
    ]);

    const skillMap = buildSkillMap(logs);
    const outcome = applyDiplomaProgress(skillMap, [], '400-800', NOW);

    expect(outcome.bandChanged).toBe(true);
    expect(outcome.promotedBand).toBe('800-1000');
    expect(skillMap.find((entry) => entry.theme === 'hangingPiece')).toMatchObject({
      attempts: 30,
      wins: 27,
    });
  });

  it('NÃO promove quando o volume está abaixo do piso (SECTION_MIN_ATTEMPTS)', () => {
    const logs = dashboardLog([
      { theme: 'hangingPiece', attempts: 10, losses: 0 },
      { theme: 'mateIn1', attempts: 10, losses: 0 },
    ]);

    const outcome = applyDiplomaProgress(buildSkillMap(logs), [], '400-800', NOW);

    expect(outcome.bandChanged).toBe(false);
    expect(outcome.promotedBand).toBe('400-800');
  });

  it('NÃO promove passando só temas da Torre estando na banda do Peão (gate por banda atual)', () => {
    const logs = dashboardLog([
      { theme: 'fork', attempts: 30, losses: 3 },
      { theme: 'pin', attempts: 30, losses: 3 },
      { theme: 'skewer', attempts: 30, losses: 3 },
    ]);

    const outcome = applyDiplomaProgress(buildSkillMap(logs), [], '400-800', NOW);

    expect(outcome.bandChanged).toBe(false);
    expect(outcome.promotedBand).toBe('400-800');
  });
});
