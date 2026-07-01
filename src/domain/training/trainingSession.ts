import type { Destination, ErrorType, PatternRecognition, PlanBlock, PlanBlockFeedback, TrainingLog, TrainingLogKind, TrainingResult } from '../types';

export function createTrainingLog(input: { block: PlanBlock; date: string; startedAt: string }): TrainingLog {
  return {
    id: trainingLogId(input.date, input.block.id),
    date: input.date,
    blockId: input.block.id,
    blockTitle: input.block.title,
    source: input.block.source,
    destinationLabel: input.block.destination.label,
    logKind: getTrainingLogKindFromBlock(input.block),
    plannedSeconds: input.block.estimatedMinutes * 60,
    startedAt: input.startedAt,
    timeLimitReached: false,
    status: 'active',
    ...(input.block.methodTrackId === undefined ? {} : { methodTrackId: input.block.methodTrackId }),
    ...(input.block.conceptContractId === undefined ? {} : { conceptContractId: input.block.conceptContractId }),
    ...(input.block.isBlindAttempt === undefined ? {} : { isBlindAttempt: input.block.isBlindAttempt }),
    ...(input.block.hintWasVisible === undefined ? {} : { hintWasVisible: input.block.hintWasVisible }),
    ...(input.block.platformThemeLeakRisk === undefined
      ? {}
      : { platformThemeLeakRisk: input.block.platformThemeLeakRisk }),
    updatedAt: input.startedAt,
  };
}

export function ensureTrainingLogKind(log: TrainingLog, block: PlanBlock): TrainingLog {
  return log.logKind === undefined ? { ...log, logKind: getTrainingLogKindFromBlock(block) } : log;
}

export function isPuzzleTrainingLog(log: TrainingLog): boolean {
  if (log.logKind !== undefined) {
    return log.logKind === 'puzzle' || log.logKind === 'free-activity';
  }

  return log.result !== undefined;
}

export function completeTrainingLog(input: {
  log: TrainingLog;
  completedAt: string;
  feedback?: PlanBlockFeedback;
  // Fase 1 (2026-06-24): taxonomia de erro (SÓ quando feedback='hard'). Opcional.
  errorType?: ErrorType;
  // Autoexplicação de 1 frase. Convite — nunca obrigatório.
  selfExplanation?: string;
  patternRecognition?: PatternRecognition;
}): TrainingLog {
  const elapsedSeconds = elapsedSecondsBetween(input.log.startedAt, input.completedAt);

  return {
    ...input.log,
    completedAt: input.completedAt,
    elapsedSeconds,
    timeLimitReached: elapsedSeconds >= input.log.plannedSeconds,
    status: 'done',
    ...(input.feedback === undefined ? {} : { feedback: input.feedback }),
    // errorType só faz sentido junto com feedback='hard'; ignoramos caso contrário.
    ...(input.errorType !== undefined && input.feedback === 'hard' ? { errorType: input.errorType } : {}),
    ...(input.selfExplanation !== undefined && input.feedback === 'hard'
      ? { selfExplanation: input.selfExplanation }
      : {}),
    ...(input.patternRecognition === undefined ? {} : { patternRecognition: input.patternRecognition }),
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
  if (seconds <= 0) {
    return 'menos de 1 min';
  }

  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${String(minutes)} min`;
}

function trainingLogId(date: string, blockId: string): string {
  return `${date}:${blockId}`;
}

function getTrainingLogKindFromBlock(block: PlanBlock): TrainingLogKind {
  return isLichessPuzzleDestination(block.destination) ? 'puzzle' : 'standard';
}

function isLichessPuzzleDestination(destination: Destination): boolean {
  if (destination.source !== 'lichess' || destination.url === undefined) {
    return false;
  }

  try {
    const url = new URL(destination.url);

    return url.protocol === 'https:' && url.hostname === 'lichess.org' && url.pathname.startsWith('/training');
  } catch {
    return false;
  }
}
