import {
  elapsedSecondsBetween,
  formatElapsedMinutes,
  type PlanBlock,
  type PlanBlockFeedback,
  type TrainingLog,
} from '../domain';

export function formatTimerStatus(
  log: TrainingLog,
  nowIso: string,
): { kind: 'timer-running' | 'timer-done' | 'timer-over' | 'timer-skipped'; label: string } {
  const elapsedSeconds = log.status === 'active' ? elapsedSecondsBetween(log.startedAt, nowIso) : (log.elapsedSeconds ?? 0);

  if (log.status === 'done') {
    // Métrica honesta: nº de exercícios feitos (real, do Lichess) em vez do
    // relógio de parede. Tempo, quando há, é a estimativa por timestamp.
    const result = log.result;

    if (result !== undefined && result.puzzles > 0) {
      const plural = result.puzzles === 1 ? '' : 's';
      const seconds = result.kind === 'puzzle-activity' ? (result.activeSeconds ?? 0) : 0;
      const time = seconds > 0 ? ` · ~${formatElapsedMinutes(seconds)}` : '';

      return {
        kind: 'timer-done',
        label: `${String(result.puzzles)} exercício${plural} feito${plural}${time}.`,
      };
    }

    return {
      kind: 'timer-done',
      label: 'Concluído.',
    };
  }

  if (log.status === 'skipped') {
    return {
      kind: 'timer-skipped',
      label: `Pulou após ${formatElapsedMinutes(elapsedSeconds)}.`,
    };
  }

  if (elapsedSeconds >= log.plannedSeconds) {
    return {
      kind: 'timer-over',
      label: 'Tempo atingido. Conclua quando terminar.',
    };
  }

  return {
    kind: 'timer-running',
    label: `Treinando há ${formatElapsedMinutes(elapsedSeconds)}. Faltam ${formatElapsedMinutes(log.plannedSeconds - elapsedSeconds)}.`,
  };
}

export function formatResourceStage(stage: PlanBlock['resourceStage']): string {
  switch (stage) {
    case 'explain':
      return 'explicação';
    case 'guided':
      return 'guiado';
    case 'retrieval':
      return 'repetição';
    case 'transfer':
      return 'transferência';
    case 'review':
      return 'revisão';
    case undefined:
      return 'treino';
  }
}

// Sem prefixo "Professor Tavarez:" — o card do tutor já carrega retrato e nome;
// repetir a assinatura em cada fala era ruído.
export function getFeedbackCelebration(feedback: PlanBlockFeedback): string {
  switch (feedback) {
    case 'easy':
      return 'Está ficando mais fácil — sinal de progresso real.';
    case 'good':
      return 'Bom desafio. O peso certo para evoluir.';
    case 'hard':
      return 'Esse foi difícil. Dá para guardar para revisar amanhã.';
  }
}

export function formatStatus(status: PlanBlock['status']): string {
  switch (status) {
    case 'pending':
      return 'Pendente';
    case 'done':
      return 'Feito';
    case 'skipped':
      return 'Pulado';
  }
}
