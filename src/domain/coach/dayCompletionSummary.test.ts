import { describe, expect, it } from 'vitest';
import type { TrainingRoadmapItem } from '../plan/planSessions';
import type { DailyPlan, TrainingLog } from '../types';
import { buildDayCompletionSummary } from './dayCompletionSummary';

const plan: DailyPlan = {
  date: '2026-06-08',
  sessionMinutes: 30,
  weeklyFocus: {
    tag: 'fork',
    title: 'garfos',
    reason: 'Tema conservador.',
    startsOn: '2026-06-08',
  },
  blocks: [
    {
      id: 'warmup',
      sessionNumber: 1,
      title: 'Aquecimento tatico',
      source: 'lichess',
      destination: {
        source: 'lichess',
        label: 'Puzzles Lichess: Fork',
        url: 'https://lichess.org/training/fork',
      },
      weaknessTag: 'fork',
      resourceStage: 'retrieval',
      estimatedMinutes: 5,
      task: 'Resolva puzzles.',
      stopRule: 'Pare no tempo.',
      reason: 'Aquecimento.',
      coachNote: 'Procure dois alvos.',
      status: 'done',
      feedback: 'good',
      updatedAt: '2026-06-08T10:05:00.000Z',
    },
    {
      id: 'theme',
      sessionNumber: 1,
      title: 'Tema do dia: garfos',
      source: 'lichess',
      destination: {
        source: 'lichess',
        label: 'Lichess Practice: The Fork',
        url: 'https://lichess.org/practice/fundamental-tactics/the-fork/Qj281y1p',
      },
      weaknessTag: 'fork',
      resourceStage: 'guided',
      estimatedMinutes: 25,
      task: 'Estude a licao guiada.',
      stopRule: 'Pare no tempo.',
      reason: 'Tema do dia.',
      coachNote: 'Confirme o alvo.',
      status: 'done',
      feedback: 'hard',
      updatedAt: '2026-06-08T10:30:00.000Z',
    },
  ],
  generatedFromWeaknessesAt: '2026-06-08T09:00:00.000Z',
};

const roadmap: TrainingRoadmapItem[] = [
  {
    id: '2026-06-08:session:1',
    date: '2026-06-08',
    label: 'Hoje',
    minutes: 30,
    title: 'Tema do dia: garfos',
    destinationLabel: 'Lichess Practice: The Fork',
    status: 'done',
  },
  {
    id: '2026-06-09:session:1',
    date: '2026-06-09',
    label: 'Amanha',
    minutes: 30,
    title: 'Repeticao: garfos',
    destinationLabel: 'Puzzles Lichess: Fork',
    status: 'future',
  },
];

describe('buildDayCompletionSummary', () => {
  it('waits until every plan block has left pending state', () => {
    expect(
      buildDayCompletionSummary({
        plan: {
          ...plan,
          blocks: plan.blocks.map((block) => (block.id === 'theme' ? { ...block, status: 'pending' } : block)),
        },
        trainingLogs: [],
        roadmap,
      }),
    ).toBeUndefined();
  });

  it('summarizes feedback, puzzle results, time, and the next session', () => {
    const summary = buildDayCompletionSummary({
      plan,
      trainingLogs: [
        doneLog({
          blockId: 'warmup',
          elapsedSeconds: 300,
          result: {
            source: 'lichess',
            kind: 'puzzle-activity',
            fetchedAt: '2026-06-08T10:06:00.000Z',
            since: '2026-06-08T10:00:00.000Z',
            until: '2026-06-08T10:05:00.000Z',
            puzzles: 4,
            wins: 3,
            losses: 1,
            themes: ['fork'],
            themeStats: [{ theme: 'fork', attempts: 4, losses: 1 }],
          },
        }),
        doneLog({ blockId: 'theme', elapsedSeconds: 1200 }),
      ],
      roadmap,
    });

    expect(summary?.heading).toBe('Dia concluído. Bom trabalho.');
    expect(summary?.metrics).toEqual(['2/2 blocos feitos', '30 min planejados', '25 min registrados']);
    expect(summary?.lines).toContain('Feedback do dia: bom: 1, difícil: 1.');
    expect(summary?.lines).toContain('Puzzles conferidos: 3 certos e 1 errado em 4 tentativas.');
    expect(summary?.lines).toContain(
      'Na próxima sessão: Repeticao: garfos (30 min) em Puzzles Lichess: Fork.',
    );
  });

  it('mentions unresolved puzzle logs without inventing a score', () => {
    const summary = buildDayCompletionSummary({
      plan,
      trainingLogs: [doneLog({ blockId: 'warmup', elapsedSeconds: 300 }), doneLog({ blockId: 'theme', elapsedSeconds: 900 })],
      roadmap,
    });

    expect(summary?.lines).toContain('Puzzles sem placar. Confira no Lichess para calibrar o plano.');
  });

  it('closes the day when every block was skipped without inventing puzzle work', () => {
    const skippedPlan: DailyPlan = {
      ...plan,
      blocks: plan.blocks.map((block) => ({ ...block, status: 'skipped' })),
    };
    const summary = buildDayCompletionSummary({
      plan: skippedPlan,
      trainingLogs: [skippedLog('warmup')],
      roadmap,
    });

    expect(summary?.heading).toBe('Dia encerrado.');
    expect(summary?.metrics).toEqual(['0/2 blocos feitos', '30 min planejados', 'menos de 1 min registrados']);
    expect(summary?.lines).toContain(
      'Plano encerrado com 0 de 2 blocos feitos e 2 blocos pulados e menos de 1 min de treino.',
    );
    expect(summary?.lines.some((line) => line.includes('Puzzles sem placar'))).toBe(false);
  });
});

function doneLog(input: Pick<TrainingLog, 'blockId' | 'elapsedSeconds'> & Partial<TrainingLog>): TrainingLog {
  return {
    id: `2026-06-08:${input.blockId}`,
    date: '2026-06-08',
    blockId: input.blockId,
    blockTitle: input.blockId,
    source: 'lichess',
    destinationLabel: input.blockId === 'warmup' ? 'Puzzles Lichess: Fork' : 'Lichess Practice: The Fork',
    logKind: input.blockId === 'warmup' ? 'puzzle' : 'standard',
    plannedSeconds: 600,
    startedAt: '2026-06-08T10:00:00.000Z',
    completedAt: '2026-06-08T10:10:00.000Z',
    elapsedSeconds: input.elapsedSeconds,
    timeLimitReached: false,
    status: 'done',
    feedback: input.feedback,
    result: input.result,
    updatedAt: '2026-06-08T10:10:00.000Z',
  };
}

function skippedLog(blockId: string): TrainingLog {
  return {
    ...doneLog({ blockId, elapsedSeconds: 0 }),
    status: 'skipped',
    completedAt: '2026-06-08T10:00:00.000Z',
  };
}
