import type { Weakness } from '../domain';

// Rótulo em pt-BR de cada fraqueza tática. Compartilhado por Hoje e Progresso
// para não vazar o slug técnico interno (ex.: "hanging-piece") na interface.
export function formatWeaknessTag(tag: Weakness['tag']): string {
  switch (tag) {
    case 'hanging-piece':
      return 'peças penduradas';
    case 'fork':
      return 'garfos';
    case 'pin':
      return 'cravadas';
    case 'skewer':
      return 'espetos';
    case 'discovered':
      return 'ataques descobertos';
    case 'mate-in-1':
      return 'mate em 1';
    case 'mate-in-2':
      return 'mate em 2';
    case 'back-rank':
      return 'mate na última fileira';
    case 'opening-principles':
      return 'abertura';
    case 'time-trouble':
      return 'tempo';
    case 'endgame-pawn':
      return 'final de peões';
    case 'endgame-rook':
      return 'final de torres';
    case 'conversion':
      return 'conversão';
    case 'blunder-rate':
      return 'anti-blunder';
  }
}
