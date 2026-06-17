import type { PuzzleThemeStat, WeaknessTag } from '../types';
import { isDueToday } from './pendingItems';
import type { MethodTrackId, PendingTrainingItem } from './types';

export type TrackSelectionInput = {
  openPendingItems: PendingTrainingItem[];
  primaryWeakness?: WeaknessTag;
  weakThemes: string[];
  puzzleThemeStats?: PuzzleThemeStat[];
  recentlyEarnedDiploma?: boolean;
};

const calculationThemes: readonly string[] = ['fork', 'discoveredAttack', 'mateIn2', 'deflection', 'quietMove'];
const defenseThemes: readonly string[] = ['defensiveMove', 'hangingPiece', 'trappedPiece'];
const defenseWeaknessTags: readonly WeaknessTag[] = ['hanging-piece', 'blunder-rate'];
const calculationWeaknessTags: readonly WeaknessTag[] = ['fork', 'discovered', 'mate-in-2', 'conversion'];

export function selectMethodTrack(input: TrackSelectionInput): MethodTrackId {
  if (input.openPendingItems.some((item) => isDueToday(item))) {
    return 'pending-review';
  }

  // Conquistou um diploma há pouco: promove à trilha de diplomas por uma ou duas
  // semanas (decisão 3). A revisão de pendências vencidas continua tendo prioridade.
  if (input.recentlyEarnedDiploma === true) {
    return 'progress-diplomas';
  }

  if (
    input.weakThemes.some((theme) => defenseThemes.includes(theme)) ||
    (input.primaryWeakness !== undefined && defenseWeaknessTags.includes(input.primaryWeakness))
  ) {
    return 'active-defense';
  }

  if (
    input.weakThemes.some((theme) => calculationThemes.includes(theme)) ||
    (input.primaryWeakness !== undefined && calculationWeaknessTags.includes(input.primaryWeakness))
  ) {
    return 'calculation-bridge';
  }

  if (input.primaryWeakness === 'opening-principles') {
    return 'opening-as-plan';
  }

  return 'calculation-bridge';
}
