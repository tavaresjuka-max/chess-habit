import { describe, expect, it } from 'vitest';
import type { WeaknessTag } from '../types';
import { catalogSkillNodes } from './catalogSkills';
import { findLichessResourceById, lichessPuzzleThemes } from './resourceCatalog';

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

describe('catalogSkillNodes', () => {
  it('covers every Professor Lemos weakness with at least one sub-skill', () => {
    for (const tag of weaknessTags) {
      expect(catalogSkillNodes.some((node) => node.weaknessTag === tag)).toBe(true);
    }
  });

  it('maps only to resources already present in the curated catalog', () => {
    for (const node of catalogSkillNodes) {
      expect(node.resourceIds.length).toBeGreaterThan(0);

      for (const resourceId of node.resourceIds) {
        expect(findLichessResourceById(resourceId), `${node.id} -> ${resourceId}`).toBeDefined();
      }
    }
  });

  it('maps puzzle themes to official puzzle theme slugs from the catalog', () => {
    const officialThemeIds = new Set(lichessPuzzleThemes.map((resource) => resource.id.replace('puzzle:', '')));

    for (const node of catalogSkillNodes) {
      expect(node.themeSlugs.length).toBeGreaterThan(0);

      for (const slug of node.themeSlugs) {
        expect(officialThemeIds.has(slug), `${node.id} -> ${slug}`).toBe(true);
      }
    }
  });

  it('has original Professor Lemos cues and practical fit metadata', () => {
    for (const node of catalogSkillNodes) {
      expect(node.lemosCue.length).toBeGreaterThan(20);
      expect(node.bands.length).toBeGreaterThan(0);
      expect(node.stageFit.length).toBeGreaterThan(0);
      expect(node.timeFits.length).toBeGreaterThan(0);
    }
  });
});
