import type { Destination, PlanResourceStage, WeaknessTag } from '../types';
import {
  destinationFromResource,
  getPrimaryLichessResourceForWeakness,
} from './resourceCatalog';
import { selectLichessResource, type SelectLichessResourceInput } from './resourceSelector';

const openingPrinciplesDestination = destinationFromResource(
  getPrimaryLichessResourceForWeakness('opening-principles'),
);
type DestinationContext = Omit<SelectLichessResourceInput, 'weaknessTag' | 'resourceStage'>;

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

export function getDestinationForWeakness(
  tag: WeaknessTag,
  stage: PlanResourceStage = 'guided',
  context: DestinationContext = {},
): Destination {
  return destinationFromResource(
    selectLichessResource({
      weaknessTag: tag,
      resourceStage: stage,
      ...context,
    }),
  );
}

export function normalizeDestination(destination: Destination, stage?: PlanResourceStage): Destination {
  if (
    destination.label.includes('abertura') &&
    (destination.url === 'https://lichess.org/learn' || destination.url === 'https://lichess.org/analysis#explorer')
  ) {
    return openingPrinciplesDestination;
  }

  if (destination.url !== undefined && stage !== 'retrieval') {
    const normalizedByUrl = getLegacyDestinationForUrl(destination.url);

    if (normalizedByUrl !== undefined) {
      return normalizedByUrl;
    }
  }

  if (
    destination.url === 'https://lichess.org/practice' &&
    (destination.label.includes('finais de peões') || destination.label.includes('finais de peoes'))
  ) {
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
    case 'https://lichess.org/video?tags=beginner%2Fopening':
    case 'https://lichess.org/video/gpsZAim-mYc?tags=opening+principles':
    case 'https://lichess.org/video?tags=opening+principles':
      return lichessDestinationsByWeakness['opening-principles'];
    default:
      return undefined;
  }
}
