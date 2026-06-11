import { describe, expect, it } from 'vitest';
import type { TrainingLog } from '../types';
import { buildSessionMilestoneSummary } from './sessionMilestones';

describe('buildSessionMilestoneSummary', () => {
  it('starts with a 6h checkpoint and no fake progress', () => {
    const summary = buildSessionMilestoneSummary({ logs: [], sessionMinutes: 30 });

    expect(summary.currentMilestone.label).toBe('Checkpoint 6h');
    expect(summary.currentMilestone.targetSessions).toBe(12);
    expect(summary.currentMilestone.progressPercent).toBe(0);
    expect(summary.stats.completedSessions).toBe(0);
    expect(summary.stats.improvementLines[0]).toContain('Ainda não há sessões concluídas');
    expect(summary.skillSignals).toContain('Hábito: ainda não há sessões concluídas.');
    expect(summary.nextSignalToMeasure).toContain('concluir uma sessão');
  });

  it('counts a plan session once even when it has multiple blocks', () => {
    const summary = buildSessionMilestoneSummary({
      logs: [
        trainingLog({
          id: '2026-06-09:2026-06-09-01-warmup',
          blockId: '2026-06-09-01-warmup',
          elapsedSeconds: 900,
          feedback: 'good',
        }),
        trainingLog({
          id: '2026-06-09:2026-06-09-02-theme',
          blockId: '2026-06-09-02-theme',
          elapsedSeconds: 900,
          feedback: 'easy',
        }),
        trainingLog({
          id: '2026-06-09:2026-06-09-s02-01-theme',
          blockId: '2026-06-09-s02-01-theme',
          elapsedSeconds: 1800,
          feedback: 'hard',
        }),
      ],
      sessionMinutes: 30,
    });

    expect(summary.stats.completedSessions).toBe(2);
    expect(summary.stats.completedHours).toBe(1);
    expect(summary.stats.completedBlocks).toBe(3);
    expect(summary.stats.feedback).toEqual({ easy: 1, good: 1, hard: 1 });
    expect(summary.skillSignals[0]).toContain('2 sessões');
    expect(summary.nextSignalToMeasure).toContain('reconciliar puzzles');
  });

  it('moves the active milestone after completing the first 24h cycle', () => {
    const summary = buildSessionMilestoneSummary({
      logs: [
        trainingLog({
          elapsedSeconds: 86_400,
          feedback: 'good',
        }),
      ],
      sessionMinutes: 30,
    });

    expect(summary.milestones.map((milestone) => [milestone.label, milestone.status])).toEqual([
      ['Checkpoint 6h', 'done'],
      ['Checkpoint 12h', 'done'],
      ['Primeiro ciclo 24h', 'done'],
      ['Ciclo 48h', 'current'],
    ]);
    expect(summary.currentMilestone.progressPercent).toBe(50);
  });

  it('uses diagnostic puzzle logs for stats without counting them as sessions', () => {
    const summary = buildSessionMilestoneSummary({
      logs: [
        trainingLog({
          elapsedSeconds: 1800,
          feedback: 'good',
          result: {
            source: 'lichess',
            kind: 'puzzle-activity',
            fetchedAt: '2026-06-09T10:30:00.000Z',
            since: '2026-06-09T10:00:00.000Z',
            until: '2026-06-09T10:30:00.000Z',
            puzzles: 10,
            wins: 7,
            losses: 3,
            themes: ['fork', 'pin'],
            themeStats: [
              { theme: 'fork', attempts: 6, losses: 1 },
              { theme: 'pin', attempts: 4, losses: 3 },
            ],
          },
        }),
        trainingLog({
          id: '2026-06-09:lichess-puzzle-dashboard',
          blockId: 'lichess-puzzle-dashboard',
          blockTitle: 'Diagnostico de puzzles Lichess',
          plannedSeconds: 0,
          elapsedSeconds: 0,
          destinationLabel: 'Lichess Puzzle Dashboard',
          result: {
            source: 'lichess',
            kind: 'puzzle-dashboard',
            fetchedAt: '2026-06-09T10:31:00.000Z',
            since: '2026-05-10T00:00:00.000Z',
            until: '2026-06-09T10:31:00.000Z',
            days: 30,
            puzzles: 5,
            wins: 4,
            losses: 1,
            themes: ['fork'],
            themeStats: [{ theme: 'fork', attempts: 5, losses: 1 }],
            weakThemes: [],
            strongThemes: ['fork'],
            accuracy: 80,
          },
        }),
      ],
      sessionMinutes: 30,
    });

    expect(summary.stats.completedSessions).toBe(1);
    expect(summary.stats.puzzleAttempts).toBe(15);
    expect(summary.stats.puzzleWins).toBe(11);
    expect(summary.stats.puzzleAccuracy).toBe(73);
    expect(summary.stats.bestTheme).toBe('Fork');
    expect(summary.stats.weakTheme).toBe('Pin');
    expect(summary.skillSignals).toContain('Habilidade: 73% de acerto nos puzzles reconciliados.');
    expect(summary.nextSignalToMeasure).toContain('Pin');
  });

  it('shows puzzle accuracy trend when both halves have enough attempts', () => {
    const summary = buildSessionMilestoneSummary({
      logs: [
        trainingLog({
          id: '2026-06-09:2026-06-09-01-theme',
          blockId: '2026-06-09-01-theme',
          result: puzzleResult({ wins: 2, losses: 4, until: '2026-06-09T10:30:00.000Z' }),
        }),
        trainingLog({
          id: '2026-06-10:2026-06-10-01-theme',
          date: '2026-06-10',
          blockId: '2026-06-10-01-theme',
          result: puzzleResult({ wins: 5, losses: 1, until: '2026-06-10T10:30:00.000Z' }),
        }),
      ],
      sessionMinutes: 30,
    });

    expect(summary.stats.puzzleAccuracyTrend).toEqual({
      previous: 33,
      recent: 83,
      delta: 50,
    });
    expect(summary.stats.improvementLines).toContain('Comparando as sessões, o acerto subiu de 33% para 83%.');
  });
});

function trainingLog(overrides: Partial<TrainingLog> = {}): TrainingLog {
  return {
    id: '2026-06-09:2026-06-09-01-theme',
    date: '2026-06-09',
    blockId: '2026-06-09-01-theme',
    blockTitle: 'Tema do dia: garfos',
    source: 'lichess',
    destinationLabel: 'Puzzles Lichess: Fork',
    plannedSeconds: 1800,
    startedAt: '2026-06-09T10:00:00.000Z',
    completedAt: '2026-06-09T10:30:00.000Z',
    elapsedSeconds: 1800,
    timeLimitReached: true,
    status: 'done',
    updatedAt: '2026-06-09T10:30:00.000Z',
    ...overrides,
  };
}

function puzzleResult(input: { wins: number; losses: number; until: string }): NonNullable<TrainingLog['result']> {
  return {
    source: 'lichess',
    kind: 'puzzle-activity',
    fetchedAt: input.until,
    since: '2026-06-09T10:00:00.000Z',
    until: input.until,
    puzzles: input.wins + input.losses,
    wins: input.wins,
    losses: input.losses,
    themes: ['fork'],
    themeStats: [{ theme: 'fork', attempts: input.wins + input.losses, losses: input.losses }],
  };
}
