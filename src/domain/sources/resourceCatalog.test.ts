import { describe, expect, it } from 'vitest';
import type { WeaknessTag } from '../types';
import {
  destinationFromResource,
  getLichessResourcesForWeakness,
  getPrimaryLichessResourceForWeakness,
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
