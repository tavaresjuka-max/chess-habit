import type { PuzzleThemeStats, TrainingLog } from '../types';

export function buildPuzzleThemeStats(logs: TrainingLog[]): PuzzleThemeStats | undefined {
  const byTheme = new Map<string, { theme: string; attempts: number; losses: number }>();
  let since: string | undefined;
  let until: string | undefined;

  for (const log of logs) {
    const result = log.result;

    if (result?.themeStats === undefined || result.themeStats.length === 0) {
      continue;
    }

    since = since === undefined || result.since < since ? result.since : since;
    until = until === undefined || result.until > until ? result.until : until;

    for (const stat of result.themeStats) {
      const current = byTheme.get(stat.theme) ?? { theme: stat.theme, attempts: 0, losses: 0 };

      byTheme.set(stat.theme, {
        theme: stat.theme,
        attempts: current.attempts + stat.attempts,
        losses: current.losses + stat.losses,
      });
    }
  }

  if (byTheme.size === 0 || since === undefined || until === undefined) {
    return undefined;
  }

  return {
    since,
    until,
    themes: [...byTheme.values()].sort(
      (left, right) =>
        right.losses - left.losses || right.attempts - left.attempts || left.theme.localeCompare(right.theme),
    ),
  };
}
