// Helpers puros do estado do app — extraídos de state.ts para teste unitário
// direto e para manter o hook focado em orquestração.

import type { DailyPlan, PuzzleThemeStats, SessionMinutes, TrainingLog } from '../domain';
import type { DiplomaAttempt, PendingTrainingItem } from '../domain/method/types';
import type { GeneratePlanOptions } from '../domain/plan/generatePlan';

export function toSessionMinutes(minutes: number, fallback: SessionMinutes): SessionMinutes {
  switch (minutes) {
    case 5:
    case 15:
    case 30:
    case 60:
      return minutes;
    default:
      return fallback;
  }
}

export function combinePlanHistory(currentPlan: DailyPlan, previousPlan: DailyPlan | undefined): DailyPlan {
  if (previousPlan === undefined) {
    return currentPlan;
  }

  return {
    ...currentPlan,
    blocks: [...previousPlan.blocks, ...currentPlan.blocks],
  };
}

export function getOpenedTrainingBlockIds(logs: readonly TrainingLog[]): string[] {
  return [...new Set(logs.map((log) => log.blockId))].sort();
}

// Monta as opções repetidas de generatePlan num lugar só (antes duplicadas em 12
// callsites do state.ts). Inclui o flag de diploma (decisão 3): o recentThemeStats
// é passado pronto para preservar a variável já calculada em cada handler.
export function buildPlanContext(args: {
  previousPlan?: DailyPlan;
  recentThemeStats: PuzzleThemeStats | undefined;
  trainingLogs: readonly TrainingLog[];
  pendingItems: readonly PendingTrainingItem[];
  diplomaAttempts: readonly DiplomaAttempt[];
}): GeneratePlanOptions {
  return {
    ...(args.previousPlan === undefined ? {} : { previousPlan: args.previousPlan }),
    recentThemeStats: args.recentThemeStats,
    openedBlockIds: getOpenedTrainingBlockIds(args.trainingLogs),
    openPendingItems: [...args.pendingItems],
    weakThemesFromDashboard: getWeakThemesFromThemeStats(args.recentThemeStats),
    diplomaAttempts: args.diplomaAttempts,
    // Fase 1 (2026-06-24): passa os logs para errorRouting derivar o sinal de
    // errorType predominante. Read-only — não altera o plano, apenas o sinal.
    recentTrainingLogs: args.trainingLogs,
  };
}

export function getWeakThemesFromThemeStats(stats: PuzzleThemeStats | undefined): string[] {
  return (stats?.themes ?? [])
    .filter((theme) => theme.losses > 0)
    .map((theme) => theme.theme)
    .sort();
}

export function getLichessThemeFromUrl(url: string | undefined): string | undefined {
  if (url === undefined) {
    return undefined;
  }

  const prefix = 'https://lichess.org/training/';

  if (!url.startsWith(prefix)) {
    return undefined;
  }

  const theme = url.slice(prefix.length);

  return theme === '' || theme.includes('/') ? undefined : theme;
}

export function upsertPendingItem(items: PendingTrainingItem[], nextItem: PendingTrainingItem): PendingTrainingItem[] {
  const existingIndex = items.findIndex((item) => item.id === nextItem.id);

  if (existingIndex === -1) {
    return [...items, nextItem];
  }

  return items.map((item, index) => (index === existingIndex ? nextItem : item));
}
