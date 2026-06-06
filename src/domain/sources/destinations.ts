import type { Destination, PlanResourceStage, WeaknessTag } from '../types';
import {
  destinationFromResource,
  getLichessResourcesForWeakness,
  getPrimaryLichessResourceForWeakness,
  type LichessResource,
  type LichessResourceKind,
} from './resourceCatalog';

const openingPrinciplesDestination = destinationFromResource(
  getPrimaryLichessResourceForWeakness('opening-principles'),
);
const analysisDestination = destinationFromResource(getPrimaryLichessResourceForWeakness('conversion'));

const resourceKindPreferenceByStage = {
  explain: ['video-lesson', 'video-filter', 'practice-study', 'learn-basics', 'puzzle-theme', 'puzzle-mode', 'analysis-tool'],
  guided: ['practice-study', 'video-lesson', 'video-filter', 'learn-basics', 'puzzle-theme', 'puzzle-mode', 'analysis-tool'],
  retrieval: ['puzzle-theme', 'puzzle-mode', 'practice-study', 'video-lesson', 'video-filter', 'learn-basics', 'analysis-tool'],
  transfer: ['analysis-tool', 'puzzle-mode', 'puzzle-theme', 'practice-study', 'video-lesson', 'video-filter', 'learn-basics'],
  review: ['analysis-tool', 'puzzle-mode', 'puzzle-theme', 'practice-study', 'video-lesson', 'video-filter', 'learn-basics'],
} satisfies Record<PlanResourceStage, readonly LichessResourceKind[]>;

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

export function getDestinationForWeakness(tag: WeaknessTag, stage: PlanResourceStage = 'guided'): Destination {
  return destinationFromResource(getResourceForWeaknessAndStage(tag, stage));
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

  if (destination.url === 'https://lichess.org/practice' && destination.label.includes('finais de peoes')) {
    return lichessDestinationsByWeakness['endgame-pawn'];
  }

  if (destination.url === 'https://lichess.org/practice' && destination.label.includes('finais de torres')) {
    return lichessDestinationsByWeakness['endgame-rook'];
  }

  return destination;
}

function getResourceForWeaknessAndStage(tag: WeaknessTag, stage: PlanResourceStage): LichessResource {
  const primaryResource = getPrimaryLichessResourceForWeakness(tag);

  if (stage === 'transfer' || stage === 'review') {
    return {
      id: 'analysis:finished-game-review',
      kind: 'analysis-tool',
      title: 'Analysis board',
      label: 'Lichess Analysis: revisar partida terminada',
      description: 'Prancheta de analise para revisar apenas partidas terminadas.',
      url: analysisDestination.url,
      source: 'lichess-training-page',
      bands: ['0-800', '800-1200'],
      recommendedFor: [tag],
      priority: 100,
    };
  }

  if (stage === 'guided') {
    return primaryResource;
  }

  const resources = getLichessResourcesForWeakness(tag);

  if (stage === 'explain') {
    return (
      resources.find((candidate) => candidate.kind === 'video-lesson') ??
      resources.find((candidate) => candidate.kind === 'video-filter') ??
      primaryResource
    );
  }

  const preferredKinds = resourceKindPreferenceByStage[stage];

  for (const kind of preferredKinds) {
    const resource = resources.find((candidate) => candidate.kind === kind);

    if (resource !== undefined) {
      return resource;
    }
  }

  return primaryResource;
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
    case 'https://lichess.org/video?tags=opening+principles':
      return lichessDestinationsByWeakness['opening-principles'];
    default:
      return undefined;
  }
}
