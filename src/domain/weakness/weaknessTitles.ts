import type { WeaknessTag } from '../types';

export const weaknessTitleByTag: Record<WeaknessTag, string> = {
  'hanging-piece': 'peças penduradas',
  fork: 'garfos',
  pin: 'cravadas',
  skewer: 'espetos',
  discovered: 'ataques descobertos',
  'mate-in-1': 'mate em 1',
  'mate-in-2': 'mate em 2',
  'back-rank': 'mate na última fileira',
  'opening-principles': 'princípios de abertura',
  'time-trouble': 'gestão de tempo',
  'endgame-pawn': 'finais de peões',
  'endgame-rook': 'finais de torres',
  conversion: 'conversão',
  'blunder-rate': 'segurança',
} satisfies Record<WeaknessTag, string>;
