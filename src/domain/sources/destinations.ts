import type { Destination, WeaknessTag } from '../types';

const openingPrinciplesDestination = {
  source: 'lichess',
  label: 'Lichess Videos: aulas de abertura para iniciantes',
  url: 'https://lichess.org/video?tags=beginner%2Fopening',
} satisfies Destination;

export const lichessDestinationsByWeakness = {
  'hanging-piece': {
    source: 'lichess',
    label: 'Puzzles Lichess: peças penduradas',
    url: 'https://lichess.org/training/hangingPiece',
  },
  fork: {
    source: 'lichess',
    label: 'Puzzles Lichess: garfos',
    url: 'https://lichess.org/training/fork',
  },
  pin: {
    source: 'lichess',
    label: 'Puzzles Lichess: cravadas',
    url: 'https://lichess.org/training/pin',
  },
  skewer: {
    source: 'lichess',
    label: 'Puzzles Lichess: espetos',
    url: 'https://lichess.org/training/skewer',
  },
  discovered: {
    source: 'lichess',
    label: 'Puzzles Lichess: ataques descobertos',
    url: 'https://lichess.org/training/discoveredAttack',
  },
  'mate-in-1': {
    source: 'lichess',
    label: 'Puzzles Lichess: mate em 1',
    url: 'https://lichess.org/training/mateIn1',
  },
  'mate-in-2': {
    source: 'lichess',
    label: 'Puzzles Lichess: mate em 2',
    url: 'https://lichess.org/training/mateIn2',
  },
  'back-rank': {
    source: 'lichess',
    label: 'Puzzles Lichess: mate na ultima fileira',
    url: 'https://lichess.org/training/backRankMate',
  },
  'opening-principles': {
    ...openingPrinciplesDestination,
  },
  'time-trouble': {
    source: 'lichess',
    label: 'Ritmo de decisao: revisar sem link automatico',
  },
  'endgame-pawn': {
    source: 'lichess',
    label: 'Lichess Practice: finais de peoes',
    url: 'https://lichess.org/practice',
  },
  'endgame-rook': {
    source: 'lichess',
    label: 'Lichess Practice: finais de torres',
    url: 'https://lichess.org/practice',
  },
  conversion: {
    source: 'lichess',
    label: 'Revisao de conversao: escolher uma partida terminada',
  },
  'blunder-rate': {
    source: 'lichess',
    label: 'Puzzles Lichess: seguranca de pecas',
    url: 'https://lichess.org/training/hangingPiece',
  },
} satisfies Record<WeaknessTag, Destination>;

export function getDestinationForWeakness(tag: WeaknessTag): Destination {
  return lichessDestinationsByWeakness[tag];
}

export function normalizeDestination(destination: Destination): Destination {
  if (
    destination.label.includes('abertura') &&
    (destination.url === 'https://lichess.org/learn' || destination.url === 'https://lichess.org/analysis#explorer')
  ) {
    return openingPrinciplesDestination;
  }

  return destination;
}
