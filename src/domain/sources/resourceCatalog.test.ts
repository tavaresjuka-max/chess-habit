import { describe, expect, it } from 'vitest';
import type { WeaknessTag } from '../types';
import {
  destinationFromResource,
  getLichessResourcesForWeakness,
  getPrimaryLichessResourceForWeakness,
  lichessPracticeStudies,
  lichessPuzzleThemes,
  lichessResourceCatalog,
} from './resourceCatalog';

const allowedResourceUrl =
  /^https:\/\/lichess\.org\/(analysis|learn|practice\/[a-z0-9-]+\/[a-z0-9-]+\/[A-Za-z0-9]+|streak|storm|training(?:\/(?:[A-Za-z0-9]+|of-player|themes))?|video(?:\/[A-Za-z0-9_-]+)?\?tags=[A-Za-z0-9%+'-]+(?:%2F[A-Za-z0-9%+'-]+)*)$/;

describe('lichessResourceCatalog', () => {
  it('catalogs official Lichess Practice studies and puzzle themes', () => {
    expect(lichessPracticeStudies).toHaveLength(32);
    expect(lichessPuzzleThemes.length).toBeGreaterThanOrEqual(70);
    expect(lichessResourceCatalog.length).toBeGreaterThan(100);
  });

  it('uses only allowlisted Lichess destination shapes', () => {
    for (const resource of lichessResourceCatalog) {
      if (resource.url !== undefined) {
        expect(resource.url).toMatch(allowedResourceUrl);
      }
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
      label: 'Lichess Video: abertura - centro, desenvolvimento e rei seguro',
      url: 'https://lichess.org/video/gpsZAim-mYc?tags=opening+principles',
    });
  });
});
