import type { LearnerBand, PlanResourceStage, PuzzleThemeStat, PuzzleThemeStats, WeaknessTag } from '../types';
import { getCatalogSkillNodesForWeakness, type CatalogSkillNode } from './catalogSkills';
import {
  findLichessResourceById,
  getLichessResourcesForWeakness,
  getPrimaryLichessResourceForWeakness,
  type LichessResource,
  type LichessResourceKind,
} from './resourceCatalog';

export type SelectLichessResourceInput = {
  weaknessTag: WeaknessTag;
  resourceStage: PlanResourceStage;
  learnerBand?: LearnerBand;
  blockMinutes?: number;
  recentThemeStats?: PuzzleThemeStats;
  completedResourceIds?: readonly string[];
};

export const resourceKindPreferenceByStage = {
  explain: [
    'video-lesson',
    'practice-study',
    'learn-basics',
    'puzzle-theme',
    'puzzle-mode',
    'puzzle-replay',
    'community-study',
    'analysis-tool',
  ],
  guided: [
    'practice-study',
    'learn-basics',
    'video-lesson',
    'puzzle-theme',
    'puzzle-mode',
    'puzzle-replay',
    'community-study',
    'analysis-tool',
  ],
  retrieval: [
    'puzzle-theme',
    'puzzle-mode',
    'puzzle-replay',
    'practice-study',
    'video-lesson',
    'community-study',
    'learn-basics',
    'analysis-tool',
  ],
  transfer: [
    'puzzle-theme',
    'puzzle-mode',
    'community-study',
    'practice-study',
    'video-lesson',
    'puzzle-replay',
    'learn-basics',
    'analysis-tool',
  ],
  review: [
    'puzzle-replay',
    'puzzle-theme',
    'puzzle-mode',
    'practice-study',
    'video-lesson',
    'community-study',
    'learn-basics',
    'analysis-tool',
  ],
} satisfies Record<PlanResourceStage, readonly LichessResourceKind[]>;

export function selectLichessResource(input: SelectLichessResourceInput): LichessResource {
  const replayResource = createReplayResourceIfUseful(input);

  if (replayResource !== undefined) {
    return replayResource;
  }

  const resources = getCandidateResources(input);
  const completedResourceIds = new Set(input.completedResourceIds ?? []);
  const hasAlternative = resources.some((resource) => !completedResourceIds.has(resource.id));
  const scored = resources
    .map((resource) => ({
      resource,
      score: scoreResource(resource, input, hasAlternative),
    }))
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.resource.priority - left.resource.priority ||
        left.resource.title.localeCompare(right.resource.title),
    );

  return scored[0]?.resource ?? getPrimaryLichessResourceForWeakness(input.weaknessTag);
}

function getCandidateResources(input: SelectLichessResourceInput): LichessResource[] {
  const resources = getLichessResourcesForWeakness(input.weaknessTag).filter((resource) => {
    return (
      resource.qualityStatus !== 'rejected' &&
      fitsBand(resource, input.learnerBand) &&
      fitsStage(resource, input.resourceStage)
    );
  });
  const timedResources = resources.filter((resource) => fitsTime(resource, input.blockMinutes, input.resourceStage));

  if (timedResources.length > 0) {
    return timedResources;
  }

  if (resources.length > 0) {
    return resources;
  }

  return [getPrimaryLichessResourceForWeakness(input.weaknessTag)];
}

function scoreResource(resource: LichessResource, input: SelectLichessResourceInput, hasAlternative: boolean): number {
  const completedResourceIds = new Set(input.completedResourceIds ?? []);
  const skillNodes = getFittingSkillNodes(input);
  const nodeScore = getNodeScore(resource, skillNodes);
  const weakThemeScore = getWeakThemeScore(resource, input.recentThemeStats, skillNodes);
  const completionPenalty = hasAlternative && completedResourceIds.has(resource.id) ? -900 : 0;

  return (
    resource.priority +
    getKindPreferenceScore(resource.kind, input.resourceStage) +
    getQualityScore(resource) +
    nodeScore +
    weakThemeScore +
    completionPenalty
  );
}

function createReplayResourceIfUseful(input: SelectLichessResourceInput): LichessResource | undefined {
  if (input.resourceStage !== 'review' || input.recentThemeStats === undefined) {
    return undefined;
  }

  const skillNodes = getFittingSkillNodes(input);
  const matchingTheme = input.recentThemeStats.themes.find((stat) => {
    return stat.losses > 0 && skillNodes.some((node) => node.themeSlugs.includes(stat.theme));
  });

  if (matchingTheme === undefined) {
    return undefined;
  }

  const themeResource = findLichessResourceById(`puzzle:${matchingTheme.theme}`);

  if (themeResource === undefined || themeResource.url === undefined) {
    return undefined;
  }

  const id = `puzzle-replay:${matchingTheme.theme}`;

  if ((input.completedResourceIds ?? []).includes(id)) {
    return undefined;
  }

  const title = `Replay: ${themeResource.title}`;

  return {
    id,
    kind: 'puzzle-replay',
    title,
    label: `Lichess Replay: revisar erros recentes em ${themeResource.title}`,
    description: 'Revisao guiada por tema com base em erros recentes agregados do Puzzle Dashboard/Activity.',
    url: themeResource.url,
    source: 'lichess-api-puzzles',
    bands: themeResource.bands,
    recommendedFor: [input.weaknessTag],
    priority: 100,
    value: 'A',
    qualityStatus: 'approved',
    rightsRisk: 'low',
    language: 'en',
    requiresOAuth: true,
    oauthScopes: ['puzzle:read'],
    lastVerifiedAt: themeResource.lastVerifiedAt,
    lastLinkCheckStatus: themeResource.lastLinkCheckStatus,
    reviewCadenceDays: 30,
  };
}

function getFittingSkillNodes(input: SelectLichessResourceInput): CatalogSkillNode[] {
  const nodes = getCatalogSkillNodesForWeakness(input.weaknessTag).filter((node) => {
    return (
      node.stageFit.includes(input.resourceStage) &&
      (input.learnerBand === undefined || node.bands.includes(input.learnerBand)) &&
      (input.blockMinutes === undefined || node.timeFits.includes(input.blockMinutes))
    );
  });

  if (nodes.length > 0) {
    return nodes;
  }

  return getCatalogSkillNodesForWeakness(input.weaknessTag);
}

function getNodeScore(resource: LichessResource, nodes: readonly CatalogSkillNode[]): number {
  let bestScore = 0;

  for (const node of nodes) {
    const resourceIndex = node.resourceIds.indexOf(resource.id);

    if (resourceIndex !== -1) {
      bestScore = Math.max(bestScore, 250 - resourceIndex * 10);
    }

    if (resource.kind === 'puzzle-theme' && node.themeSlugs.includes(getPuzzleThemeSlug(resource))) {
      bestScore = Math.max(bestScore, 180);
    }
  }

  return bestScore;
}

function getWeakThemeScore(
  resource: LichessResource,
  recentThemeStats: PuzzleThemeStats | undefined,
  nodes: readonly CatalogSkillNode[],
): number {
  if (recentThemeStats === undefined || resource.kind !== 'puzzle-theme') {
    return 0;
  }

  const slug = getPuzzleThemeSlug(resource);
  const themeStat = recentThemeStats.themes.find((stat) => stat.theme === slug);

  if (themeStat === undefined || themeStat.losses === 0) {
    return 0;
  }

  const nodeMatch = nodes.some((node) => node.themeSlugs.includes(slug));

  return nodeMatch ? 160 + getLossRate(themeStat) * 100 : 60;
}

function fitsBand(resource: LichessResource, learnerBand: LearnerBand | undefined): boolean {
  return learnerBand === undefined || resource.bands.includes(learnerBand);
}

function fitsStage(resource: LichessResource, stage: PlanResourceStage): boolean {
  return resourceKindPreferenceByStage[stage].includes(resource.kind);
}

function fitsTime(resource: LichessResource, minutes: number | undefined, stage: PlanResourceStage): boolean {
  if (minutes === undefined) {
    return true;
  }

  if (minutes <= 5) {
    return resource.kind === 'puzzle-theme' || resource.kind === 'puzzle-mode' || resource.kind === 'puzzle-replay';
  }

  if (minutes <= 10 && stage !== 'explain') {
    return resource.kind !== 'community-study' && resource.kind !== 'analysis-tool';
  }

  if (minutes < 20) {
    return resource.kind !== 'community-study';
  }

  return true;
}

function getKindPreferenceScore(kind: LichessResourceKind, stage: PlanResourceStage): number {
  const preferences = resourceKindPreferenceByStage[stage];
  const index = preferences.indexOf(kind);

  return index === -1 ? 0 : (preferences.length - index) * 120;
}

function getQualityScore(resource: LichessResource): number {
  switch (resource.qualityStatus) {
    case 'approved':
      return resource.source === 'lichess-community-study' ? 700 : 900;
    case 'needs-human-review':
      return 100;
    case 'rejected':
      return -10_000;
  }
}

function getPuzzleThemeSlug(resource: LichessResource): string {
  return resource.id.startsWith('puzzle:') ? resource.id.slice('puzzle:'.length) : resource.id;
}

function getLossRate(stat: PuzzleThemeStat): number {
  return stat.attempts === 0 ? 0 : stat.losses / stat.attempts;
}
