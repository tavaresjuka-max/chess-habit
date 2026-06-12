import type { TrainingRoadmapItem } from '../plan/planSessions';
import type { DailyPlan, PlanBlockFeedback, TrainingLog, TrainingResult } from '../types';
import { formatElapsedMinutes } from '../training/trainingSession';

export type DayCompletionSummary = {
  heading: string;
  lines: string[];
  metrics: string[];
};

export function buildDayCompletionSummary(input: {
  plan: DailyPlan;
  trainingLogs: TrainingLog[];
  roadmap: TrainingRoadmapItem[];
}): DayCompletionSummary | undefined {
  if (input.plan.blocks.length === 0 || input.plan.blocks.some((block) => block.status === 'pending')) {
    return undefined;
  }

  const doneBlocks = input.plan.blocks.filter((block) => block.status === 'done');
  const planBlockIds = new Set(input.plan.blocks.map((block) => block.id));
  const dayLogs = input.trainingLogs.filter((log) => log.date === input.plan.date && planBlockIds.has(log.blockId));
  const plannedMinutes = input.plan.blocks.reduce((sum, block) => sum + block.estimatedMinutes, 0);
  const elapsedSeconds = dayLogs.reduce((sum, log) => sum + (log.elapsedSeconds ?? 0), 0);
  const skippedBlocks = input.plan.blocks.filter((block) => block.status === 'skipped');
  const lines = [
    buildBlocksLine(doneBlocks.length, input.plan.blocks.length, skippedBlocks.length, elapsedSeconds),
    buildFeedbackLine(input.plan, dayLogs),
    buildPuzzleLine(dayLogs),
    buildNextLine(input.roadmap),
  ].filter((line): line is string => line !== undefined);

  return {
    heading: doneBlocks.length === 0 ? 'Dia encerrado.' : 'Dia concluído. Bom trabalho.',
    metrics: [
      `${String(doneBlocks.length)}/${String(input.plan.blocks.length)} ${formatNoun(
        input.plan.blocks.length,
        'bloco',
        'blocos',
      )} ${doneBlocks.length === 1 ? 'feito' : 'feitos'}`,
      `${String(plannedMinutes)} min planejado${plannedMinutes === 1 ? '' : 's'}`,
      `${formatElapsedMinutes(elapsedSeconds)} registrados`,
    ],
    lines,
  };
}

function buildBlocksLine(doneCount: number, totalCount: number, skippedCount: number, elapsedSeconds: number): string {
  const skippedPart =
    skippedCount > 0 ? ` e ${formatCount(skippedCount, 'bloco pulado', 'blocos pulados')}` : '';

  return `Você encerrou o plano com ${String(doneCount)} de ${String(totalCount)} ${formatNoun(
    totalCount,
    'bloco',
    'blocos',
  )} ${doneCount === 1 ? 'feito' : 'feitos'}${skippedPart} e registrou ${formatElapsedMinutes(
    elapsedSeconds,
  )} de treino.`;
}

function buildFeedbackLine(plan: DailyPlan, dayLogs: TrainingLog[]): string | undefined {
  const feedbackCounts = new Map<PlanBlockFeedback, number>();

  for (const block of plan.blocks) {
    const log = dayLogs.find((candidate) => candidate.blockId === block.id);
    const feedback = block.feedback ?? log?.feedback;

    if (feedback === undefined) {
      continue;
    }

    feedbackCounts.set(feedback, (feedbackCounts.get(feedback) ?? 0) + 1);
  }

  const parts = [
    formatFeedbackCount('easy', feedbackCounts.get('easy') ?? 0),
    formatFeedbackCount('good', feedbackCounts.get('good') ?? 0),
    formatFeedbackCount('hard', feedbackCounts.get('hard') ?? 0),
  ].filter((part): part is string => part !== undefined);

  if (parts.length === 0) {
    return undefined;
  }

  return `Feedback do dia: ${parts.join(', ')}.`;
}

function formatFeedbackCount(feedback: PlanBlockFeedback, count: number): string | undefined {
  if (count === 0) {
    return undefined;
  }

  switch (feedback) {
    case 'easy':
      return `fácil: ${String(count)}`;
    case 'good':
      return `bom: ${String(count)}`;
    case 'hard':
      return `difícil: ${String(count)}`;
  }
}

function buildPuzzleLine(dayLogs: TrainingLog[]): string | undefined {
  const completedPuzzleLogs = dayLogs.filter((log) => log.status === 'done' && isPuzzleLog(log));
  const puzzleResults = completedPuzzleLogs
    .map((log) => log.result)
    .filter((result): result is Extract<TrainingResult, { kind: 'puzzle-activity' }> => result?.kind === 'puzzle-activity');

  if (puzzleResults.length > 0) {
    const totals = puzzleResults.reduce(
      (acc, result) => ({
        puzzles: acc.puzzles + result.puzzles,
        wins: acc.wins + result.wins,
        losses: acc.losses + result.losses,
      }),
      { puzzles: 0, wins: 0, losses: 0 },
    );

    return `Puzzles conferidos: ${formatCount(totals.wins, 'certo', 'certos')} e ${formatCount(
      totals.losses,
      'errado',
      'errados',
    )} em ${formatCount(totals.puzzles, 'tentativa', 'tentativas')}.`;
  }

  if (completedPuzzleLogs.some((log) => log.result === undefined)) {
    return 'Puzzles ainda sem placar. Confira no Lichess para calibrar o plano.';
  }

  return undefined;
}

function buildNextLine(roadmap: TrainingRoadmapItem[]): string | undefined {
  const nextItem = roadmap.find((item) => item.status !== 'done');

  if (nextItem === undefined) {
    return undefined;
  }

  return `Na próxima sessão vamos estudar ${nextItem.title} (${String(nextItem.minutes)} min) em ${
    nextItem.destinationLabel
  }.`;
}

function isPuzzleLog(log: TrainingLog): boolean {
  return log.destinationLabel.includes('Puzzle') || log.destinationLabel.includes('Puzzles');
}

function formatCount(count: number, singular: string, plural: string): string {
  return `${String(count)} ${formatNoun(count, singular, plural)}`;
}

function formatNoun(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}
