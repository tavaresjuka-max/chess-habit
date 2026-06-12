// Helpers puros do estado do app — extraídos de state.ts para teste unitário
// direto e para manter o hook focado em orquestração.

import type { DailyPlan, PuzzleThemeStats, SessionMinutes, TrainingLog } from '../domain';
import type { PendingTrainingItem } from '../domain/method/types';

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
