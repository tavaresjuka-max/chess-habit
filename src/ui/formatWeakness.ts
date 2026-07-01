import { weaknessTitleByTag } from '../domain/weakness/weaknessTitles';
import type { Weakness } from '../domain';

const UI_SHORT_LABEL: Partial<Record<Weakness['tag'], string>> = {
  'opening-principles': 'abertura',
  'time-trouble': 'tempo',
  'endgame-pawn': 'final de peões',
  'endgame-rook': 'final de torres',
  'blunder-rate': 'segurança',
};

export function formatWeaknessTag(tag: Weakness['tag']): string {
  return UI_SHORT_LABEL[tag] ?? weaknessTitleByTag[tag];
}
