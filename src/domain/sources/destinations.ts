import type { Destination, WeaknessTag } from '../types';
import { destinationFromResource, getPrimaryLichessResourceForWeakness } from './resourceCatalog';

const openingPrinciplesDestination = destinationFromResource(
  getPrimaryLichessResourceForWeakness('opening-principles'),
);

export const lichessDestinationsByWeakness = {
  'hanging-piece': destinationFromResource(getPrimaryLichessResourceForWeakness('hanging-piece')),
  fork: destinationFromResource(getPrimaryLichessResourceForWeakness('fork')),
  pin: destinationFromResource(getPrimaryLichessResourceForWeakness('pin')),
  skewer: destinationFromResource(getPrimaryLichessResourceForWeakness('skewer')),
  discovered: destinationFromResource(getPrimaryLichessResourceForWeakness('discovered')),
  'mate-in-1': destinationFromResource(getPrimaryLichessResourceForWeakness('mate-in-1')),
  'mate-in-2': destinationFromResource(getPrimaryLichessResourceForWeakness('mate-in-2')),
  'back-rank': destinationFromResource(getPrimaryLichessResourceForWeakness('back-rank')),
  'opening-principles': openingPrinciplesDestination,
  'time-trouble': destinationFromResource(getPrimaryLichessResourceForWeakness('time-trouble')),
  'endgame-pawn': destinationFromResource(getPrimaryLichessResourceForWeakness('endgame-pawn')),
  'endgame-rook': destinationFromResource(getPrimaryLichessResourceForWeakness('endgame-rook')),
  conversion: destinationFromResource(getPrimaryLichessResourceForWeakness('conversion')),
  'blunder-rate': destinationFromResource(getPrimaryLichessResourceForWeakness('blunder-rate')),
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

  if (destination.url !== undefined) {
    const normalizedByUrl = getLegacyDestinationForUrl(destination.url);

    if (normalizedByUrl !== undefined) {
      return normalizedByUrl;
    }
  }

  if (destination.url === 'https://lichess.org/practice' && destination.label.includes('finais de peoes')) {
    return lichessDestinationsByWeakness['endgame-pawn'];
  }

  if (destination.url === 'https://lichess.org/practice' && destination.label.includes('finais de torres')) {
    return lichessDestinationsByWeakness['endgame-rook'];
  }

  return destination;
}

function getLegacyDestinationForUrl(url: string): Destination | undefined {
  switch (url) {
    case 'https://lichess.org/training/fork':
      return lichessDestinationsByWeakness.fork;
    case 'https://lichess.org/training/pin':
      return lichessDestinationsByWeakness.pin;
    case 'https://lichess.org/training/skewer':
      return lichessDestinationsByWeakness.skewer;
    case 'https://lichess.org/training/discoveredAttack':
      return lichessDestinationsByWeakness.discovered;
    case 'https://lichess.org/training/mateIn1':
      return lichessDestinationsByWeakness['mate-in-1'];
    case 'https://lichess.org/training/mateIn2':
      return lichessDestinationsByWeakness['mate-in-2'];
    default:
      return undefined;
  }
}
