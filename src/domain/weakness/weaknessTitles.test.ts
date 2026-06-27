import { describe, expect, it } from 'vitest';
import type { WeaknessTag } from '../types';
import { weaknessTitleByTag } from './weaknessTitles';

const ALL_TAGS: readonly WeaknessTag[] = [
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
];

describe('weaknessTitleByTag', () => {
  it('cobre toda a união de WeaknessTag sem sobras nem faltas', () => {
    expect(Object.keys(weaknessTitleByTag).sort()).toEqual([...ALL_TAGS].sort());
  });

  it('trava a copy canônica acentuada de cada tag (golden anti-deriva de acento)', () => {
    expect(weaknessTitleByTag).toEqual({
      'hanging-piece': 'peças penduradas',
      fork: 'garfos',
      pin: 'cravadas',
      skewer: 'espetos',
      discovered: 'ataques descobertos',
      'mate-in-1': 'mate em 1',
      'mate-in-2': 'mate em 2',
      'back-rank': 'mate na última fileira',
      'opening-principles': 'princípios de abertura',
      'time-trouble': 'gestão de tempo',
      'endgame-pawn': 'finais de peões',
      'endgame-rook': 'finais de torres',
      conversion: 'conversão',
      'blunder-rate': 'segurança anti-blunder',
    });
  });

  it('nunca devolve o slug cru: título não vazio e diferente da própria tag', () => {
    for (const tag of ALL_TAGS) {
      const title = weaknessTitleByTag[tag];

      expect(title.length).toBeGreaterThan(0);
      expect(title).not.toBe(tag);
      expect(title).toBe(title.trim());
    }
  });
});
