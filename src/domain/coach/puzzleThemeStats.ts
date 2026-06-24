import type { LearnerProfile, PuzzleThemeStats, TrainingLog, WeaknessTag } from '../types';
import {
  GRADUATION_ACCURACY,
  GRADUATION_MIN_PUZZLES,
  POOL_MAX_PER_SESSION,
  PRIMARY_SESSION_CEILING,
} from '../plan/schedulerConstants';

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
export const puzzleThemeToWeaknessTag: Partial<Record<string, WeaknessTag>> = {
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

// ---------------------------------------------------------------------------
// D5 — Guarda do sinal diagnóstico (SPEC 2026-06-22)
// ---------------------------------------------------------------------------

/**
 * Sufixos de blockId cujos resultados NÃO devem alimentar selectPrimaryWeakness.
 * Blocos de pool (-revisao e -transferencia em modo intercalado) contêm puzzles
 * de temas secundários; incluí-los no diagnóstico causaria ping-pong de tema.
 * Blocos diagnósticos válidos: -tema, -aquecimento (e outros sem sufixo especial).
 */
const POOL_BLOCK_SUFFIXES = ['-revisao', '-transferencia'] as const;

function isDiagnosticLog(log: TrainingLog): boolean {
  return !POOL_BLOCK_SUFFIXES.some((suffix) => log.blockId.endsWith(suffix));
}

/**
 * D5: variante filtrada de buildPuzzleThemeStats que exclui resultados de blocos
 * de pool (-revisao/-transferencia). Use esta função para alimentar
 * selectPrimaryWeakness em vez de buildPuzzleThemeStats, evitando ping-pong.
 */
export function buildDiagnosticThemeStats(logs: TrainingLog[]): PuzzleThemeStats | undefined {
  const diagnosticLogs = logs.filter(isDiagnosticLog);

  return buildPuzzleThemeStats(diagnosticLogs);
}

// ---------------------------------------------------------------------------
// D3 — Pool de rotação (SPEC 2026-06-22)
// ---------------------------------------------------------------------------

/**
 * D3: deriva o pool de temas intercalados a partir de profile.graduatedThemes,
 * excluindo o tema primário atual. A seleção retorna ≤ POOL_MAX_PER_SESSION temas.
 * Ordenação futura (least-recently-reviewed) pode ser adicionada com dados de log;
 * por ora retorna na ordem da lista (determinística e estável).
 */
export function buildInterleavePool(profile: LearnerProfile, primaryTag: WeaknessTag): WeaknessTag[] {
  const graduated = profile.graduatedThemes ?? [];

  return graduated.filter((tag): tag is WeaknessTag => tag !== primaryTag).slice(0, POOL_MAX_PER_SESSION);
}

// ---------------------------------------------------------------------------
// D4 — Critério de graduação (SPEC 2026-06-22)
// ---------------------------------------------------------------------------

/**
 * D4: tema graduado = acurácia ≥ GRADUATION_ACCURACY (80%) sobre ≥
 * GRADUATION_MIN_PUZZLES (30) tentativas. Reutiliza os mesmos limiares do
 * gate de diploma (SECTION_ACCURACY_TARGET / SECTION_MIN_ATTEMPTS).
 */
export function isThemeGraduated(entry: { attempts: number; wins: number }): boolean {
  if (entry.attempts < GRADUATION_MIN_PUZZLES) {
    return false;
  }

  const accuracyPercent = Math.round((entry.wins / entry.attempts) * 100);

  return accuracyPercent >= GRADUATION_ACCURACY;
}

/**
 * D4 — teto anti-trava: retorna true quando o tema esteve como primário por
 * mais de PRIMARY_SESSION_CEILING (12) sessões sem graduar, forçando rotação.
 */
export function shouldForceRotation(sessionsOnPrimary: number): boolean {
  return sessionsOnPrimary > PRIMARY_SESSION_CEILING;
}
