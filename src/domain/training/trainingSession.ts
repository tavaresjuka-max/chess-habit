import type { PlanBlock, PlanBlockFeedback, TrainingLog, TrainingResult } from '../types';

export function createTrainingLog(input: { block: PlanBlock; date: string; startedAt: string }): TrainingLog {
  return {
    id: trainingLogId(input.date, input.block.id),
    date: input.date,
    blockId: input.block.id,
    blockTitle: input.block.title,
    source: input.block.source,
    destinationLabel: input.block.destination.label,
    plannedSeconds: input.block.estimatedMinutes * 60,
    startedAt: input.startedAt,
    timeLimitReached: false,
    status: 'active',
    updatedAt: input.startedAt,
  };
}

export function completeTrainingLog(input: {
  log: TrainingLog;
  completedAt: string;
  feedback?: PlanBlockFeedback;
}): TrainingLog {
  const elapsedSeconds = elapsedSecondsBetween(input.log.startedAt, input.completedAt);

  return {
    ...input.log,
    completedAt: input.completedAt,
    elapsedSeconds,
    timeLimitReached: elapsedSeconds >= input.log.plannedSeconds,
    status: 'done',
    ...(input.feedback === undefined ? {} : { feedback: input.feedback }),
    updatedAt: input.completedAt,
  };
}

export function skipTrainingLog(input: { log: TrainingLog; skippedAt: string }): TrainingLog {
  const elapsedSeconds = elapsedSecondsBetween(input.log.startedAt, input.skippedAt);

  return {
    ...input.log,
    completedAt: input.skippedAt,
    elapsedSeconds,
    timeLimitReached: elapsedSeconds >= input.log.plannedSeconds,
    status: 'skipped',
    updatedAt: input.skippedAt,
  };
}

export function reconcileTrainingLogResult(input: { log: TrainingLog; result: TrainingResult }): TrainingLog {
  const completedAt = input.log.completedAt ?? input.result.until;
  const elapsedSeconds = input.log.elapsedSeconds ?? elapsedSecondsBetween(input.log.startedAt, completedAt);
  const shouldMarkDone = input.log.status === 'active' && input.result.puzzles > 0;

  return {
    ...input.log,
    completedAt,
    elapsedSeconds,
    timeLimitReached: elapsedSeconds >= input.log.plannedSeconds,
    status: shouldMarkDone ? 'done' : input.log.status,
    result: input.result,
    updatedAt: input.result.fetchedAt,
  };
}

export function elapsedSecondsBetween(startedAt: string, nowIso: string): number {
  const started = Date.parse(startedAt);
  const now = Date.parse(nowIso);

  if (Number.isNaN(started) || Number.isNaN(now) || now <= started) {
    return 0;
  }

  return Math.floor((now - started) / 1000);
}

export function formatElapsedMinutes(seconds: number): string {
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${String(minutes)} min`;
}

function trainingLogId(date: string, blockId: string): string {
  return `${date}:${blockId}`;
}
