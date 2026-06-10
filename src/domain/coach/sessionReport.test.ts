import { describe, expect, it } from 'vitest';
import type { DailyPlan, TrainingLog } from '../types';
import {
  buildNextStepExplanations,
  buildReturnRecalibrationNote,
  buildWeeklyDigest,
  getReturnSessionMinutes,
} from './sessionReport';

function createLog(date: string, overrides?: Partial<TrainingLog>): TrainingLog {
  return {
    id: `${date}:b1`,
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

function createPlan(blocks: DailyPlan['blocks']): DailyPlan {
  return {
    date: '2026-06-10',
    sessionMinutes: 15,
    blocks,
    generatedFromWeaknessesAt: '2026-06-10T00:00:00.000Z',
  };
}

describe('buildWeeklyDigest', () => {
  it('returns undefined without recent done logs', () => {
    expect(buildWeeklyDigest([], '2026-06-10')).toBeUndefined();
    expect(buildWeeklyDigest([createLog('2026-05-01')], '2026-06-10')).toBeUndefined();
  });

  it('aggregates days, blocks, minutes and puzzles in the last 7 days', () => {
    const logs = [
      createLog('2026-06-09'),
      createLog('2026-06-10', {
        id: '2026-06-10:b2',
        blockId: 'b2',
        result: {
          source: 'lichess',
          kind: 'puzzle-activity',
          fetchedAt: '2026-06-10T10:10:00.000Z',
          since: '2026-06-10T10:00:00.000Z',
          until: '2026-06-10T10:10:00.000Z',
          puzzles: 10,
          wins: 7,
          losses: 3,
          themes: ['fork'],
        },
      }),
      createLog('2026-06-10', { id: '2026-06-10:b3', blockId: 'b3', status: 'skipped' }),
    ];

    const digest = buildWeeklyDigest(logs, '2026-06-10');

    expect(digest?.metrics).toEqual(['2 dias de treino', '2 blocos', '20 min']);
    expect(digest?.lines[0]).toContain('7 certos e 3 errados em 10 tentativas');
  });
});

describe('buildNextStepExplanations', () => {
  it('explains the step-back rule for hard feedback', () => {
    const plan = createPlan([
      {
        id: 'b1',
        title: 'Garfos',
        source: 'lichess',
        destination: { source: 'lichess', label: 'Puzzles' },
        estimatedMinutes: 10,
        task: 'Resolver puzzles',
        stopRule: 'Pare aos 10 min',
        reason: 'Tema da semana',
        coachNote: '',
        status: 'done',
        feedback: 'hard',
        updatedAt: '2026-06-10T10:00:00.000Z',
      },
    ]);

    const explanations = buildNextStepExplanations(plan);

    expect(explanations[0]).toContain('difícil');
    expect(explanations[0]).toContain('voltamos um passo');
  });

  it('asks instead of asserting when there is no signal (evidence lock)', () => {
    const plan = createPlan([
      {
        id: 'b1',
        title: 'Garfos',
        source: 'lichess',
        destination: { source: 'lichess', label: 'Puzzles' },
        estimatedMinutes: 10,
        task: 'Resolver puzzles',
        stopRule: 'Pare aos 10 min',
        reason: 'Tema da semana',
        coachNote: '',
        status: 'done',
        updatedAt: '2026-06-10T10:00:00.000Z',
      },
    ]);

    const explanations = buildNextStepExplanations(plan);

    expect(explanations).toHaveLength(1);
    expect(explanations[0]).toContain('?');
  });
});

describe('return recalibration after long gap', () => {
  it('reduces session minutes after 7+ days away', () => {
    expect(getReturnSessionMinutes({ daysSinceLastSession: 10 }, 60)).toBe(15);
    expect(getReturnSessionMinutes({ daysSinceLastSession: 7 }, 30)).toBe(15);
  });

  it('keeps the default for short gaps or already-short sessions', () => {
    expect(getReturnSessionMinutes({ daysSinceLastSession: 3 }, 60)).toBe(60);
    expect(getReturnSessionMinutes({ daysSinceLastSession: 12 }, 5)).toBe(5);
    expect(getReturnSessionMinutes({ daysSinceLastSession: 12 }, 15)).toBe(15);
  });

  it('writes a welcoming note only for long gaps', () => {
    expect(buildReturnRecalibrationNote(3)).toBeUndefined();
    expect(buildReturnRecalibrationNote(9)).toContain('9 dias');
    expect(buildReturnRecalibrationNote(9)).not.toContain('!');
  });
});
