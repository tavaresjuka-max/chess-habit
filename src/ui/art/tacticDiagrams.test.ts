import { describe, expect, it } from 'vitest';
import type { WeaknessTag } from '../../domain';
import { getTacticDiagram, tacticDiagrams, type DiagramSquare } from './tacticDiagrams';

const MOTIF_TAGS: WeaknessTag[] = [
  'fork',
  'pin',
  'skewer',
  'discovered',
  'hanging-piece',
  'mate-in-1',
  'mate-in-2',
  'back-rank',
  'opening-principles',
  'endgame-pawn',
  'endgame-rook',
  'conversion',
  'blunder-rate',
];

describe('tacticDiagrams', () => {
  it('cobre todos os motivos táticos com um spec válido', () => {
    for (const tag of MOTIF_TAGS) {
      const spec = tacticDiagrams[tag];

      expect(spec, `faltou diagrama para ${tag}`).toBeDefined();
      if (spec === undefined) continue;

      expect(spec.size, `${tag}: tabuleiro pequeno demais`).toBeGreaterThanOrEqual(4);
      expect(spec.pieces.length, `${tag}: sem peças`).toBeGreaterThanOrEqual(1);
      expect(spec.label.trim().length, `${tag}: label vazio`).toBeGreaterThan(0);

      const within = (s: DiagramSquare): boolean =>
        s.col >= 0 && s.col < spec.size && s.row >= 0 && s.row < spec.size;

      for (const piece of spec.pieces) {
        expect(within(piece.at), `${tag}: peça fora do tabuleiro`).toBe(true);
        expect(piece.glyph.length, `${tag}: glifo vazio`).toBeGreaterThan(0);
      }
      for (const arrow of spec.arrows) {
        expect(within(arrow.from) && within(arrow.to), `${tag}: seta fora do tabuleiro`).toBe(true);
      }
      for (const mark of spec.marks ?? []) {
        expect(within(mark), `${tag}: marca fora do tabuleiro`).toBe(true);
      }
    }
  });

  it('não inventa diagrama para conceitos comportamentais (time-trouble)', () => {
    expect(getTacticDiagram('time-trouble')).toBeUndefined();
  });

  it('getTacticDiagram devolve undefined sem tag', () => {
    expect(getTacticDiagram(undefined)).toBeUndefined();
    expect(getTacticDiagram('fork')).toBeDefined();
  });
});
