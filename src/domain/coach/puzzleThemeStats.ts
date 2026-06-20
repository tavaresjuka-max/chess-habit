import type { PuzzleThemeStats, TrainingLog, WeaknessTag } from '../types';

export function buildPuzzleThemeStats(logs: TrainingLog[]): PuzzleThemeStats | undefined {
  const activityStats = buildPuzzleActivityThemeStats(logs);

  if (activityStats !== undefined) {
    return activityStats;
  }

  return buildLatestPuzzleDashboardThemeStats(logs);
}

function buildPuzzleActivityThemeStats(logs: TrainingLog[]): PuzzleThemeStats | undefined {
  const byTheme = new Map<string, { theme: string; attempts: number; losses: number }>();
  let since: string | undefined;
  let until: string | undefined;

  for (const log of logs) {
    const result = log.result;

    if (result?.kind !== 'puzzle-activity' || result.themeStats === undefined || result.themeStats.length === 0) {
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

function buildLatestPuzzleDashboardThemeStats(logs: TrainingLog[]): PuzzleThemeStats | undefined {
  const dashboardResults = logs
    .flatMap((log) => {
      const result = log.result;

      if (result?.kind !== 'puzzle-dashboard' || result.themeStats.length === 0) {
        return [];
      }

      return [result];
    })
    .sort((left, right) => right.until.localeCompare(left.until));
  const latestDashboard = dashboardResults[0];

  if (latestDashboard === undefined) {
    return undefined;
  }

  return {
    since: latestDashboard.since,
    until: latestDashboard.until,
    themes: latestDashboard.themeStats
      .map((theme) => ({
        theme: theme.theme,
        attempts: theme.attempts,
        losses: theme.losses,
      }))
      .sort(
        (left, right) =>
          right.losses - left.losses || right.attempts - left.attempts || left.theme.localeCompare(right.theme),
      ),
  };
}

// Fonte única do mapa tema-de-puzzle (chave camelCase do Lichess) → fraqueza
// tática interna. Usada pelo diagnóstico (mensagem do coach) e pela seleção de
// tema do plano (ponte puzzle→fraqueza).
const puzzleThemeToWeaknessTag: Partial<Record<string, WeaknessTag>> = {
  backRankMate: 'back-rank',
  discoveredAttack: 'discovered',
  discoveredCheck: 'discovered',
  fork: 'fork',
  hangingPiece: 'hanging-piece',
  mate: 'mate-in-2',
  mateIn1: 'mate-in-1',
  mateIn2: 'mate-in-2',
  pin: 'pin',
  skewer: 'skewer',
  advantage: 'conversion',
  crushing: 'conversion',
  // defensiveMove = "encontre o lance defensivo preciso" (anti-erro), não
  // conversão de vantagem. Alinha com destinations/resourceCatalog (puzzle
  // primário de blunder-rate), diagnosis ("defesa precisa") e selectMethodTrack
  // (active-defense). Antes mapeava para 'conversion' por engano.
  defensiveMove: 'blunder-rate',
  capturingDefender: 'conversion',
  deflection: 'conversion',
  pawnEndgame: 'endgame-pawn',
  advancedPawn: 'endgame-pawn',
  promotion: 'endgame-pawn',
  underPromotion: 'endgame-pawn',
  rookEndgame: 'endgame-rook',
};

export function weaknessTagFromPuzzleTheme(theme: string): WeaknessTag | undefined {
  return puzzleThemeToWeaknessTag[theme];
}
