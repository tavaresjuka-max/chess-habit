// Conquistas de esforço e hábito (Corte 7).
// Spec: docs/superpowers/specs/2026-06-10-badges-spec-draft.md
// Princípios travados: premiar esforço/hábito (nunca rating), sem streak
// punitivo, métrica de qualidade acoplada, tom sóbrio do Professor Lemos.

import type { Confidence, TrainingLog } from '../types';
import type { PendingTrainingItem } from '../method/types';

export type AchievementId =
  | 'retorno-de-ouro'
  | 'primeira-hora'
  | 'tratador-de-pendencias'
  | 'semana-inteira'
  | 'calibrado';

// Estado persistido do placement que a conquista Calibrado consulta.
export type PlacementCompletion = {
  confidence: Confidence;
  calibrated: boolean;
};

export type Achievement = {
  id: AchievementId;
  unlockedAt: string;
};

export type AchievementDefinition = {
  id: AchievementId;
  title: string;
  description: string;
  reportLine: string;
};

export const ACHIEVEMENT_DEFINITIONS: readonly AchievementDefinition[] = [
  {
    id: 'retorno-de-ouro',
    title: 'Retorno de Ouro',
    description: 'Voltou depois de uma semana ou mais fora e concluiu o treino do dia.',
    reportLine: 'Você voltou depois de uma pausa longa e concluiu o treino. Voltar é a parte mais difícil.',
  },
  {
    id: 'primeira-hora',
    title: 'Primeira Hora',
    description: 'Uma hora de treino real acumulada, em pelo menos três dias diferentes.',
    reportLine: 'Sua primeira hora de treino real, construída em mais de um dia. Isso é rotina se formando.',
  },
  {
    id: 'tratador-de-pendencias',
    title: 'Tratador de Pendências',
    description: 'Dez pendências fechadas com revisão espaçada e última revisão tranquila.',
    reportLine: 'Você fechou dez pendências com revisão espaçada. Isso tem nome: constância.',
  },
  {
    id: 'semana-inteira',
    title: 'Semana Inteira',
    description: 'Cinco dias de treino na mesma semana, cada um com bloco concluído.',
    reportLine: 'Cinco dias de treino na mesma semana. A rotina venceu a semana.',
  },
  {
    id: 'calibrado',
    title: 'Calibrado',
    description: 'Avaliação de entrada completa, com calibração por puzzles e confiança média ou alta.',
    reportLine: 'Avaliação calibrada com puzzles reais. O curso começa no seu ponto certo.',
  },
];

export function getAchievementDefinition(id: AchievementId): AchievementDefinition {
  const definition = ACHIEVEMENT_DEFINITIONS.find((candidate) => candidate.id === id);

  if (definition === undefined) {
    throw new Error(`Conquista desconhecida: ${id}`);
  }

  return definition;
}

export type EvaluateAchievementsInput = {
  logs: TrainingLog[];
  donePendingItems: PendingTrainingItem[];
  unlocked: Achievement[];
  now: string;
  placement?: PlacementCompletion;
};

// Retorna apenas as conquistas NOVAS (não repetíveis — decisão default do spec).
export function evaluateAchievements(input: EvaluateAchievementsInput): Achievement[] {
  const unlockedIds = new Set(input.unlocked.map((achievement) => achievement.id));
  const checks: Record<AchievementId, () => boolean> = {
    'retorno-de-ouro': () => isRetornoDeOuro(input.logs),
    'primeira-hora': () => isPrimeiraHora(input.logs),
    'tratador-de-pendencias': () => isTratadorDePendencias(input.donePendingItems),
    'semana-inteira': () => isSemanaInteira(input.logs),
    calibrado: () => isCalibrado(input.placement),
  };

  return ACHIEVEMENT_DEFINITIONS.filter(
    (definition) => !unlockedIds.has(definition.id) && checks[definition.id](),
  ).map((definition) => ({ id: definition.id, unlockedAt: input.now }));
}

const MS_PER_DAY = 86_400_000;

function toUtcDayIndex(date: string): number {
  const [year, month, day] = date.split('-').map(Number);

  if (year === undefined || month === undefined || day === undefined || Number.isNaN(year)) {
    throw new Error(`Data inválida: ${date}`);
  }

  return Math.floor(Date.UTC(year, month - 1, day) / MS_PER_DAY);
}

// Semana de segunda a domingo: 1970-01-01 foi quinta (índice 0), então a
// segunda-feira anterior fica no índice -3.
function toWeekKey(dayIndex: number): number {
  return Math.floor((dayIndex + 3) / 7);
}

function getDoneDayIndexes(logs: TrainingLog[]): number[] {
  return [...new Set(logs.filter((log) => log.status === 'done').map((log) => log.date))]
    .map(toUtcDayIndex)
    .sort((left, right) => left - right);
}

// Gap >= 7 dias entre dois dias de treino concluído: o dia seguinte ao gap é
// um retorno concluído (qualidade: sessão fechada, não só aberta).
function isRetornoDeOuro(logs: TrainingLog[]): boolean {
  const doneDays = getDoneDayIndexes(logs);

  for (let index = 1; index < doneDays.length; index += 1) {
    const previous = doneDays[index - 1];
    const current = doneDays[index];

    if (previous !== undefined && current !== undefined && current - previous >= 7) {
      return true;
    }
  }

  return false;
}

// 60 min reais acumulados em pelo menos 3 dias distintos (não 1 maratona).
function isPrimeiraHora(logs: TrainingLog[]): boolean {
  const doneLogs = logs.filter((log) => log.status === 'done' && (log.elapsedSeconds ?? 0) > 0);
  const totalSeconds = doneLogs.reduce((total, log) => total + (log.elapsedSeconds ?? 0), 0);
  const distinctDays = new Set(doneLogs.map((log) => log.date)).size;

  return totalSeconds >= 3_600 && distinctDays >= 3;
}

// 10 pendências fechadas após as 4 revisões espaçadas, com última revisão
// 'good' ou 'easy' (qualidade: fechou tranquilo, não no desespero).
function isTratadorDePendencias(donePendingItems: PendingTrainingItem[]): boolean {
  const qualified = donePendingItems.filter(
    (item) =>
      item.status === 'done' &&
      item.attempts >= 4 &&
      (item.lastFeedback === 'good' || item.lastFeedback === 'easy'),
  );

  return qualified.length >= 10;
}

// Avaliação de entrada completa COM calibração por puzzles e confiança que
// saiu de 'low' (qualidade: não basta responder o questionário no chute).
function isCalibrado(placement: PlacementCompletion | undefined): boolean {
  return placement !== undefined && placement.calibrated && placement.confidence !== 'low';
}

// 5 dias com bloco concluído dentro da mesma semana (segunda a domingo).
function isSemanaInteira(logs: TrainingLog[]): boolean {
  const dayCountByWeek = new Map<number, number>();

  for (const dayIndex of getDoneDayIndexes(logs)) {
    const week = toWeekKey(dayIndex);

    dayCountByWeek.set(week, (dayCountByWeek.get(week) ?? 0) + 1);
  }

  return [...dayCountByWeek.values()].some((days) => days >= 5);
}
