import { describe, expect, it } from 'vitest';
import { puzzleThemeToWeaknessTag } from '../coach/puzzleThemeStats';
import type { WeaknessTag } from '../types';
import { methodTrainingDestinationAllowlist } from './destinations';
import {
  destinationFromResource,
  getCuratedStudyForWeakness,
  getLichessResourcesForWeakness,
  getPrimaryLichessResourceForWeakness,
  hasCuratedStudy,
  lichessCommunityStudies,
  lichessPracticeStudies,
  lichessPuzzleThemes,
  lichessResourceCatalog,
  lichessVideoLessons,
  rejectedLichessResources,
} from './resourceCatalog';

const allowedResourceUrl =
  /^https:\/\/lichess\.org\/(analysis|learn|practice\/[a-z0-9-]+\/[a-z0-9-]+\/[A-Za-z0-9]+|streak|storm|study\/[A-Za-z0-9]+|training(?:\/(?:[A-Za-z0-9]+|of-player|themes))?|video\/[A-Za-z0-9_-]+)$/;

describe('lichessResourceCatalog', () => {
  it('catalogs official Lichess Practice studies and puzzle themes', () => {
    expect(lichessPracticeStudies).toHaveLength(32);
    expect(lichessPuzzleThemes.length).toBeGreaterThanOrEqual(70);
    expect(lichessVideoLessons).toHaveLength(12);
    expect(lichessCommunityStudies).toHaveLength(7);
    expect(lichessResourceCatalog.length).toBeGreaterThan(125);
  });

  it('uses only allowlisted Lichess destination shapes', () => {
    for (const resource of lichessResourceCatalog) {
      if (resource.url !== undefined) {
        expect(resource.url).toMatch(allowedResourceUrl);
      }
    }
  });

  it('does not catalog generic video search pages as training resources', () => {
    expect(lichessResourceCatalog.every((resource) => !resource.url?.includes('/video?'))).toBe(true);
  });

  it('stores curation metadata for every active resource', () => {
    for (const resource of lichessResourceCatalog) {
      expect(resource.qualityStatus).not.toBe('rejected');
      expect(resource.value).toMatch(/^[ABCD]$/);
      expect(resource.rightsRisk).toMatch(/^(low|medium|high)$/);
      expect(resource.language).toMatch(/^(pt-BR|en|other)$/);
      expect(resource.requiresOAuth).toBe(false);
      expect(resource.oauthScopes).toEqual([]);
      expect(resource.lastVerifiedAt).toBe('2026-06-08');
      expect(resource.lastLinkCheckStatus).toBe('ok');
      expect(resource.reviewCadenceDays).toBeGreaterThan(0);
    }
  });

  it('keeps community studies reviewed and below official resources', () => {
    for (const resource of lichessCommunityStudies) {
      expect(resource.kind).toBe('community-study');
      expect(resource.author).toBeTruthy();
      expect(resource.rightsRisk).toMatch(/^(low|medium)$/);
      expect(resource.qualityStatus).toMatch(/^(approved|needs-human-review)$/);
      expect(resource.url).toMatch(/^https:\/\/lichess\.org\/study\/[A-Za-z0-9]+$/);
    }

    const pawnEndgames = getLichessResourcesForWeakness('endgame-pawn');
    const keySquaresIndex = pawnEndgames.findIndex((resource) => resource.id === 'practice:pawn-endgames:key-squares');
    const communityIndex = pawnEndgames.findIndex((resource) => resource.kind === 'community-study');

    expect(keySquaresIndex).toBeGreaterThanOrEqual(0);
    expect(communityIndex).toBeGreaterThan(keySquaresIndex);
  });

  it('keeps rejected studies outside the active catalog', () => {
    const activeUrls = new Set(lichessResourceCatalog.map((resource) => resource.url));

    for (const rejected of rejectedLichessResources) {
      expect(rejected.qualityStatus).toBe('rejected');
      expect(activeUrls.has(rejected.url)).toBe(false);
      expect(rejected.replacementResourceId).toBeTruthy();
    }
  });

  it('has one primary recommendation for every weakness tag', () => {
    const weaknessTags = [
      'hanging-piece',
      'fork',
      'pin',
      'skewer',
      'discovered',
      'mate-in-1',
      'mate-in-2',
      'back-rank',
      'opening-principles',
      'time-trouble',
      'endgame-pawn',
      'endgame-rook',
      'conversion',
      'blunder-rate',
    ] satisfies WeaknessTag[];

    for (const tag of weaknessTags) {
      expect(getPrimaryLichessResourceForWeakness(tag).recommendedFor).toContain(tag);
    }
  });

  it('prefers guided Practice lessons where Lichess has a matching lesson', () => {
    expect(getPrimaryLichessResourceForWeakness('fork')).toMatchObject({
      kind: 'practice-study',
      title: 'The Fork',
      url: 'https://lichess.org/practice/fundamental-tactics/the-fork/Qj281y1p',
    });
    expect(getPrimaryLichessResourceForWeakness('endgame-pawn')).toMatchObject({
      kind: 'practice-study',
      title: 'Key Squares',
    });
  });

  it('keeps raw puzzle themes as fallback recommendations after guided lessons', () => {
    const forkRecommendations = getLichessResourcesForWeakness('fork');

    expect(forkRecommendations[0]?.kind).toBe('practice-study');
    expect(forkRecommendations.some((resource) => resource.id === 'puzzle:fork')).toBe(true);
  });

  it('turns catalog resources into app destinations without leaking catalog-only fields', () => {
    expect(destinationFromResource(getPrimaryLichessResourceForWeakness('opening-principles'))).toEqual({
      source: 'lichess',
      label: 'Lichess Video (em inglês): abertura - centro, desenvolvimento e rei seguro',
      url: 'https://lichess.org/video/gpsZAim-mYc',
    });
  });
});

describe('hasCuratedStudy / getCuratedStudyForWeakness (Pilar A/B, council 2026-06-24)', () => {
  it('tags com Study curada retornam a Study (rota controlável no mismatch)', () => {
    for (const tag of ['fork', 'pin', 'skewer', 'endgame-pawn', 'endgame-rook'] satisfies WeaknessTag[]) {
      const study = getCuratedStudyForWeakness(tag);

      expect(hasCuratedStudy(tag)).toBe(true);
      expect(study?.kind).toBe('practice-study');
      expect(study?.url).toMatch(/^https:\/\/lichess\.org\/practice\//);
    }
  });

  it('tags sem Study (só vídeo/puzzle) → sem rota controlável → mismatch adia', () => {
    for (const tag of ['hanging-piece', 'opening-principles', 'time-trouble', 'blunder-rate'] satisfies WeaknessTag[]) {
      expect(hasCuratedStudy(tag)).toBe(false);
      expect(getCuratedStudyForWeakness(tag)).toBeUndefined();
    }
  });
});

describe('guarda anti-404: temas emitidos ⊆ catálogo verificado de temas do Lichess', () => {
  // O catálogo (lichessPuzzleThemes) é a allowlist canônica: slugs verificados/link-checked,
  // todos com URL training/<slug>. Toda lista satélite que emite um tema do Lichess precisa
  // ficar DENTRO dele — senão geramos uma URL 404 (fragilidade de orquestrador). Guarda
  // data-driven: pega o rombo no instante em que alguém adiciona um slug fora do catálogo.
  // (A validade catálogo↔Lichess real é mantida pela curadoria/link-check, não por este teste.)
  const knownThemeSlugs = new Set(
    lichessPuzzleThemes.map((resource) => resource.id.replace(/^puzzle:/, '')),
  );

  it('o lichessTheme de todo destino de training está no catálogo', () => {
    for (const destination of methodTrainingDestinationAllowlist) {
      expect(
        knownThemeSlugs.has(destination.lichessTheme),
        `destino '${destination.weaknessTag}' emite training/${destination.lichessTheme}, fora do catálogo`,
      ).toBe(true);
    }
  });

  it('toda chave do mapa tema→fraqueza é um tema conhecido do Lichess', () => {
    for (const theme of Object.keys(puzzleThemeToWeaknessTag)) {
      expect(knownThemeSlugs.has(theme), `tema '${theme}' do mapa não está no catálogo Lichess`).toBe(true);
    }
  });
});
