import { describe, expect, it } from 'vitest';
import { weaknessTitleByTag } from '../domain/weakness/weaknessTitles';
import type { Weakness } from '../domain';
import { formatWeaknessTag } from './formatWeakness';

const ALL_TAGS: Weakness['tag'][] = [
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

describe('formatWeaknessTag', () => {
  it('mapeia tags conhecidas para rótulos pt-BR legíveis (não o slug)', () => {
    expect(formatWeaknessTag('fork')).toBe('garfos');
    expect(formatWeaknessTag('hanging-piece')).toBe('peças penduradas');
    expect(formatWeaknessTag('back-rank')).toBe('mate na última fileira');
    expect(formatWeaknessTag('blunder-rate')).toBe('segurança');
  });

  it('devolve um rótulo não-vazio e sem hífen-de-slug para toda WeaknessTag', () => {
    for (const tag of ALL_TAGS) {
      const label = formatWeaknessTag(tag);

      expect(label.length).toBeGreaterThan(0);
      expect(label).not.toBe(tag);
    }
  });

  it('delega ao weaknessTitleByTag do domínio para tags sem rótulo curto de UI', () => {
    expect(formatWeaknessTag('fork')).toBe(weaknessTitleByTag.fork);
    expect(formatWeaknessTag('hanging-piece')).toBe(weaknessTitleByTag['hanging-piece']);
    expect(formatWeaknessTag('back-rank')).toBe(weaknessTitleByTag['back-rank']);
    expect(formatWeaknessTag('pin')).toBe(weaknessTitleByTag.pin);
    expect(formatWeaknessTag('conversion')).toBe(weaknessTitleByTag.conversion);
  });
});
