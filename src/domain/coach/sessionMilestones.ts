import type { PlanBlockFeedback, SessionMinutes, TrainingLog } from '../types';

export type SessionMilestoneStatus = 'done' | 'current' | 'future';

export type SessionMilestone = {
  id: string;
  label: string;
  targetHours: number;
  targetSessions: number;
  completedHours: number;
  completedSessions: number;
  progressPercent: number;
  status: SessionMilestoneStatus;
};

export type SessionMilestoneStats = {
  completedSessions: number;
  completedHours: number;
  completedBlocks: number;
  skippedBlocks: number;
  feedback: Record<PlanBlockFeedback, number>;
  puzzleAttempts: number;
  puzzleWins: number;
  puzzleLosses: number;
  puzzleAccuracy?: number;
  puzzleAccuracyTrend?: {
    previous: number;
    recent: number;
    delta: number;
  };
  bestTheme?: string;
  weakTheme?: string;
  improvementLines: string[];
};

export type SessionMilestoneSummary = {
  heading: string;
  intro: string;
  currentMilestone: SessionMilestone;
  milestones: SessionMilestone[];
  stats: SessionMilestoneStats;
  skillSignals: string[];
  nextCheckpoint: string;
  nextSignalToMeasure: string;
};

export function buildSessionMilestoneSummary(input: {
  logs: readonly TrainingLog[];
  sessionMinutes: SessionMinutes;
}): SessionMilestoneSummary {
  const trainingLogs = input.logs.filter(isTrainingSessionLog);
  const completedTrainingLogs = trainingLogs.filter((log) => log.status === 'done');
  const completedSeconds = completedTrainingLogs.reduce((sum, log) => sum + (log.elapsedSeconds ?? 0), 0);
  const completedHours = roundToTenth(completedSeconds / 3600);
  const completedSessions = countCompletedSessions(completedTrainingLogs);
  const feedback = summarizeFeedback(completedTrainingLogs);
  const puzzleStats = summarizePuzzleResults(input.logs);
  const milestones = buildMilestones({
    completedHours,
    completedSessions,
    sessionMinutes: input.sessionMinutes,
  });
  const currentMilestone = milestones.find((milestone) => milestone.status === 'current') ?? milestones[milestones.length - 1];

  if (currentMilestone === undefined) {
    throw new Error('Session milestone definitions cannot be empty.');
  }

  const stats: SessionMilestoneStats = {
    completedSessions,
    completedHours,
    completedBlocks: completedTrainingLogs.length,
    skippedBlocks: trainingLogs.filter((log) => log.status === 'skipped').length,
    feedback,
    puzzleAttempts: puzzleStats.attempts,
    puzzleWins: puzzleStats.wins,
    puzzleLosses: puzzleStats.losses,
    ...(puzzleStats.accuracy === undefined ? {} : { puzzleAccuracy: puzzleStats.accuracy }),
    ...(puzzleStats.accuracyTrend === undefined ? {} : { puzzleAccuracyTrend: puzzleStats.accuracyTrend }),
    ...(puzzleStats.bestTheme === undefined ? {} : { bestTheme: puzzleStats.bestTheme }),
    ...(puzzleStats.weakTheme === undefined ? {} : { weakTheme: puzzleStats.weakTheme }),
    improvementLines: buildImprovementLines({
      completedHours,
      completedSessions,
      feedback,
      puzzleStats,
    }),
  };

  return {
    heading: 'Metas da fase',
    intro: 'Vamos medir a fase por sessões e horas concluídas, com marcos para ajustar o plano.',
    currentMilestone,
    milestones,
    stats,
    skillSignals: buildSkillSignals(stats),
    nextCheckpoint: buildNextCheckpoint(currentMilestone, completedHours),
    nextSignalToMeasure: buildNextSignalToMeasure(stats),
  };
}

function buildMilestones(input: {
  completedHours: number;
  completedSessions: number;
  sessionMinutes: SessionMinutes;
}): SessionMilestone[] {
  const targetHours = buildTargetHours(input.completedHours);
  let foundCurrent = false;

  return targetHours.map((target) => {
    const status = getMilestoneStatus(target, input.completedHours, foundCurrent);

    if (status === 'current') {
      foundCurrent = true;
    }

    return {
      id: `hours-${String(target)}`,
      label: formatMilestoneLabel(target),
      targetHours: target,
      targetSessions: Math.ceil((target * 60) / input.sessionMinutes),
      completedHours: input.completedHours,
      completedSessions: input.completedSessions,
      progressPercent: Math.min(100, Math.round((input.completedHours / target) * 100)),
      status,
    };
  });
}

function buildTargetHours(completedHours: number): number[] {
  const targets = [6, 12, 24];
  let nextCycle = 48;

  while (completedHours >= nextCycle) {
    targets.push(nextCycle);
    nextCycle += 24;
  }

  targets.push(nextCycle);

  return targets;
}

function getMilestoneStatus(target: number, completedHours: number, foundCurrent: boolean): SessionMilestoneStatus {
  if (completedHours >= target) {
    return 'done';
  }

  if (!foundCurrent) {
    return 'current';
  }

  return 'future';
}

function formatMilestoneLabel(targetHours: number): string {
  if (targetHours === 6) {
    return 'Marco 6h';
  }

  if (targetHours === 12) {
    return 'Marco 12h';
  }

  if (targetHours === 24) {
    return 'Primeiro ciclo 24h';
  }

  return `Ciclo ${String(targetHours)}h`;
}

function countCompletedSessions(logs: readonly TrainingLog[]): number {
  return new Set(logs.map(getSessionKey)).size;
}

function getSessionKey(log: TrainingLog): string {
  const match = /^(\d{4}-\d{2}-\d{2})(?:-(s\d{2}))?-/.exec(log.blockId);

  if (match?.[1] !== undefined) {
    const session = match[2] ?? 's01';

    return `${match[1]}:${session}`;
  }

  return `${log.date}:s01`;
}

function summarizeFeedback(logs: readonly TrainingLog[]): Record<PlanBlockFeedback, number> {
  return logs.reduce<Record<PlanBlockFeedback, number>>(
    (counts, log) => {
      if (log.feedback !== undefined) {
        counts[log.feedback] += 1;
      }

      return counts;
    },
    { easy: 0, good: 0, hard: 0 },
  );
}

function summarizePuzzleResults(logs: readonly TrainingLog[]): {
  attempts: number;
  wins: number;
  losses: number;
  accuracy?: number;
  accuracyTrend?: { previous: number; recent: number; delta: number };
  bestTheme?: string;
  weakTheme?: string;
} {
  const resultLogs = logs
    .filter((log) => log.status === 'done' && log.result !== undefined)
    .slice()
    .sort((left, right) => (left.completedAt ?? left.updatedAt).localeCompare(right.completedAt ?? right.updatedAt));
  const totals = resultLogs.reduce(
    (sum, log) => ({
      attempts: sum.attempts + (log.result?.puzzles ?? 0),
      wins: sum.wins + (log.result?.wins ?? 0),
      losses: sum.losses + (log.result?.losses ?? 0),
    }),
    { attempts: 0, wins: 0, losses: 0 },
  );
  const themeStats = collectThemeStats(resultLogs);
  const bestTheme = findBestTheme(themeStats);
  const weakTheme = findWeakTheme(themeStats);

  return {
    ...totals,
    ...(totals.attempts === 0 ? {} : { accuracy: Math.round((totals.wins / totals.attempts) * 100) }),
    ...(buildPuzzleAccuracyTrend(resultLogs) ?? {}),
    ...(bestTheme === undefined ? {} : { bestTheme }),
    ...(weakTheme === undefined ? {} : { weakTheme }),
  };
}

function buildPuzzleAccuracyTrend(
  logs: readonly TrainingLog[],
): { accuracyTrend: { previous: number; recent: number; delta: number } } | undefined {
  if (logs.length < 2) {
    return undefined;
  }

  const midpoint = Math.floor(logs.length / 2);
  const previous = summarizePuzzleAccuracy(logs.slice(0, midpoint));
  const recent = summarizePuzzleAccuracy(logs.slice(midpoint));

  if (previous === undefined || recent === undefined) {
    return undefined;
  }

  return {
    accuracyTrend: {
      previous,
      recent,
      delta: recent - previous,
    },
  };
}

function summarizePuzzleAccuracy(logs: readonly TrainingLog[]): number | undefined {
  const totals = logs.reduce(
    (sum, log) => ({
      attempts: sum.attempts + (log.result?.puzzles ?? 0),
      wins: sum.wins + (log.result?.wins ?? 0),
    }),
    { attempts: 0, wins: 0 },
  );

  if (totals.attempts < 3) {
    return undefined;
  }

  return Math.round((totals.wins / totals.attempts) * 100);
}

function collectThemeStats(logs: readonly TrainingLog[]): Map<string, { label: string; attempts: number; losses: number }> {
  const byTheme = new Map<string, { label: string; attempts: number; losses: number }>();

  for (const log of logs) {
    for (const stat of log.result?.themeStats ?? []) {
      if (stat.attempts <= 0) {
        continue;
      }

      const key = stat.theme.toLowerCase();
      const current = byTheme.get(key) ?? { label: formatThemeLabel(stat.theme), attempts: 0, losses: 0 };

      byTheme.set(key, {
        label: current.label,
        attempts: current.attempts + stat.attempts,
        losses: current.losses + stat.losses,
      });
    }
  }

  return byTheme;
}

function findBestTheme(stats: Map<string, { label: string; attempts: number; losses: number }>): string | undefined {
  const [best] = [...stats.values()]
    .filter((stat) => stat.attempts >= 2 && stat.losses / stat.attempts <= 0.5)
    .sort((left, right) => left.losses / left.attempts - right.losses / right.attempts || right.attempts - left.attempts);

  return best?.label;
}

function findWeakTheme(stats: Map<string, { label: string; attempts: number; losses: number }>): string | undefined {
  const [weak] = [...stats.values()]
    .filter((stat) => stat.attempts >= 2 && stat.losses / stat.attempts >= 0.4)
    .sort((left, right) => right.losses / right.attempts - left.losses / left.attempts || right.attempts - left.attempts);

  return weak?.label;
}

function buildImprovementLines(input: {
  completedHours: number;
  completedSessions: number;
  feedback: Record<PlanBlockFeedback, number>;
  puzzleStats: {
    attempts: number;
    wins: number;
    losses: number;
    accuracy?: number;
    accuracyTrend?: { previous: number; recent: number; delta: number };
    bestTheme?: string;
    weakTheme?: string;
  };
}): string[] {
  if (input.completedSessions === 0) {
    return [
      'Sem sessões concluídas. Conclua blocos para ativar este painel.',
      'Com puzzles reconciliados, comparo acerto e temas fortes e fracos.',
    ];
  }

  const lines = [
    `${formatHours(input.completedHours)} em ${formatSessionCount(input.completedSessions)} concluída${input.completedSessions === 1 ? '' : 's'}.`,
  ];
  const positiveFeedback = input.feedback.easy + input.feedback.good;

  if (positiveFeedback > input.feedback.hard) {
    lines.push('Feedback recente mais fácil/bom que difícil; libera repetição ou transferência no próximo ajuste.');
  } else if (input.feedback.hard > positiveFeedback) {
    lines.push('Feedback pesado em difícil: explicação curta e treino guiado antes de subir a carga.');
  }

  if (input.puzzleStats.accuracy !== undefined) {
    lines.push(
      `Puzzles reconciliados: ${String(input.puzzleStats.wins)}/${String(input.puzzleStats.attempts)} acertos (${String(input.puzzleStats.accuracy)}%).`,
    );
  }

  if (input.puzzleStats.accuracyTrend !== undefined) {
    const trend = input.puzzleStats.accuracyTrend;

    if (trend.delta > 0) {
      lines.push(`Comparando as sessões, o acerto subiu de ${String(trend.previous)}% para ${String(trend.recent)}%.`);
    } else if (trend.delta < 0) {
      lines.push(`O acerto caiu de ${String(trend.previous)}% para ${String(trend.recent)}%; vamos revisar antes de acelerar.`);
    } else {
      lines.push(`Comparando as sessões, o acerto ficou estável em ${String(trend.recent)}%.`);
    }
  }

  if (input.puzzleStats.bestTheme !== undefined) {
    lines.push(`Tema mais estável até agora: ${input.puzzleStats.bestTheme}.`);
  }

  if (input.puzzleStats.weakTheme !== undefined) {
    lines.push(`Tema para observar no próximo ciclo: ${input.puzzleStats.weakTheme}.`);
  }

  if (input.puzzleStats.accuracy === undefined) {
    lines.push('Sem resultados reconciliados. Confira no Lichess para medir o acerto.');
  }

  return lines;
}

function buildSkillSignals(stats: SessionMilestoneStats): string[] {
  if (stats.completedSessions === 0) {
    return [
      'Hábito: sem sessões concluídas.',
      'Habilidade: falta treino reconciliado ou feedback para medir melhora real.',
    ];
  }

  const signals = [
    `Hábito: ${formatSessionCount(stats.completedSessions)} registradas, com ${formatHours(stats.completedHours)} de treino.`,
  ];
  const positiveFeedback = stats.feedback.easy + stats.feedback.good;

  if (stats.puzzleAccuracy !== undefined) {
    signals.push(`Habilidade: ${String(stats.puzzleAccuracy)}% de acerto nos puzzles reconciliados.`);
  } else {
    signals.push('Habilidade: sem acerto de puzzle ainda — usando feedback e tempo treinado.');
  }

  if (stats.puzzleAccuracyTrend !== undefined) {
    const trend = stats.puzzleAccuracyTrend;
    const direction = trend.delta > 0 ? 'subiu' : trend.delta < 0 ? 'caiu' : 'ficou estável';
    signals.push(`Tendência: o acerto ${direction} de ${String(trend.previous)}% para ${String(trend.recent)}%.`);
  }

  if (positiveFeedback > stats.feedback.hard) {
    signals.push('Carga: repetir com variação ou transferir para tarefa menos guiada.');
  } else if (stats.feedback.hard > positiveFeedback) {
    signals.push('Carga: explicação curta antes de aumentar dificuldade.');
  }

  return signals;
}

function buildNextSignalToMeasure(stats: SessionMilestoneStats): string {
  if (stats.completedSessions === 0) {
    return 'Próximo sinal: concluir uma sessão e registrar fácil, bom ou difícil.';
  }

  if (stats.puzzleAttempts === 0) {
    return 'Próximo sinal: reconciliar puzzles do Lichess para medir acerto por tema.';
  }

  if (stats.weakTheme !== undefined) {
    return `Próximo sinal: repetir ${stats.weakTheme} e verificar se os erros caem no próximo ciclo.`;
  }

  if (stats.feedback.hard > stats.feedback.easy + stats.feedback.good) {
    return 'Próximo sinal: reduzir carga e ver se o feedback difícil diminui.';
  }

  return 'Próximo sinal: manter o tema até o marco e comparar acerto, feedback e constância.';
}

function buildNextCheckpoint(currentMilestone: SessionMilestone, completedHours: number): string {
  const remainingHours = roundToTenth(Math.max(0, currentMilestone.targetHours - completedHours));

  if (remainingHours === 0) {
    return `${currentMilestone.label} concluído. O próximo ciclo usa as mesmas métricas, sem promessa de rating.`;
  }

  return `Próximo marco: ${currentMilestone.label}. Faltam cerca de ${formatHours(remainingHours)} para revisar.`;
}

function formatSessionCount(count: number): string {
  return `${String(count)} ${count === 1 ? 'sessão' : 'sessões'}`;
}

function formatHours(hours: number): string {
  if (hours === 0) {
    return '0h';
  }

  return Number.isInteger(hours) ? `${String(hours)}h` : `${hours.toFixed(1)}h`;
}

function formatThemeLabel(theme: string): string {
  const spaced = theme
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .trim();

  if (spaced === '') {
    return theme;
  }

  return spaced
    .split(/\s+/)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function isTrainingSessionLog(log: TrainingLog): boolean {
  return log.plannedSeconds > 0;
}

function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10;
}
