import type { WeaknessTag } from '../../domain';

/** Casa do diagrama, 0-indexada; linha 0 no topo. */
export type DiagramSquare = { col: number; row: number };

/** Peça desenhada com glifo Unicode; `side` define a cor de preenchimento. */
export type DiagramPiece = { at: DiagramSquare; glyph: string; side: 'white' | 'black' };

/** Seta do golpe (de uma casa a outra). */
export type DiagramArrow = { from: DiagramSquare; to: DiagramSquare };

export type TacticDiagramSpec = {
  /** Dimensão do mini-tabuleiro (size×size). */
  size: number;
  pieces: DiagramPiece[];
  arrows: DiagramArrow[];
  /** Casas destacadas (fugas cobertas no mate, centro na abertura). */
  marks?: DiagramSquare[];
  /** Descrição lida por leitores de tela e usada como aria-label. */
  label: string;
};

const sq = (col: number, row: number): DiagramSquare => ({ col, row });

// Glifos Unicode de peças. Brancas (claras) e pretas (escuras).
const WN = '♘'; // ♘ cavalo branco
const WB = '♗'; // ♗ bispo branco
const WR = '♖'; // ♖ torre branca
const WQ = '♕'; // ♕ dama branca
const WK = '♔'; // ♔ rei branco
const WP = '♙'; // ♙ peão branco
const BK = '♚'; // ♚ rei preto
const BQ = '♛'; // ♛ dama preta
const BN = '♞'; // ♞ cavalo preto
const BB = '♝'; // ♝ bispo preto
const BP = '♟'; // ♟ peão preto

const white = (glyph: string, at: DiagramSquare): DiagramPiece => ({ at, glyph, side: 'white' });
const black = (glyph: string, at: DiagramSquare): DiagramPiece => ({ at, glyph, side: 'black' });

/**
 * Mini-diagramas por conceito tático. `time-trouble` fica de fora de propósito:
 * é comportamental, não tem motivo de tabuleiro — o componente devolve null.
 * Correção pedagógica (cravada vs espeto = peça da frente; espeto != garfo) é
 * verificada visualmente no preview antes do commit.
 */
export const tacticDiagrams: Partial<Record<WeaknessTag, TacticDiagramSpec>> = {
  fork: {
    size: 5,
    pieces: [white(WN, sq(2, 2)), black(BK, sq(4, 1)), black(BQ, sq(0, 3))],
    arrows: [
      { from: sq(2, 2), to: sq(4, 1) },
      { from: sq(2, 2), to: sq(0, 3) },
    ],
    label: 'Garfo: o cavalo ataca o rei e a dama ao mesmo tempo.',
  },
  pin: {
    size: 5,
    pieces: [white(WB, sq(0, 4)), black(BN, sq(2, 2)), black(BK, sq(4, 0))],
    arrows: [{ from: sq(0, 4), to: sq(4, 0) }],
    marks: [sq(2, 2)],
    label: 'Cravada: o cavalo não pode sair da linha porque o rei está logo atrás.',
  },
  skewer: {
    size: 5,
    pieces: [white(WB, sq(0, 4)), black(BK, sq(2, 2)), black(BQ, sq(4, 0))],
    arrows: [{ from: sq(0, 4), to: sq(4, 0) }],
    label: 'Espeto: o rei é atacado e, ao sair, deixa a dama atrás exposta.',
  },
  discovered: {
    size: 5,
    pieces: [white(WR, sq(0, 2)), white(WB, sq(2, 2)), black(BK, sq(4, 2))],
    arrows: [
      { from: sq(2, 2), to: sq(3, 1) },
      { from: sq(0, 2), to: sq(4, 2) },
    ],
    label: 'Ataque descoberto: o bispo sai da frente e revela o ataque da torre ao rei.',
  },
  'hanging-piece': {
    size: 5,
    pieces: [white(WB, sq(0, 4)), black(BN, sq(3, 1))],
    arrows: [{ from: sq(0, 4), to: sq(3, 1) }],
    label: 'Peça pendurada: o cavalo está sem defensor e pode ser capturado de graça.',
  },
  'mate-in-1': {
    size: 5,
    pieces: [black(BK, sq(4, 0)), white(WQ, sq(3, 1)), white(WK, sq(2, 2))],
    arrows: [{ from: sq(3, 1), to: sq(4, 0) }],
    marks: [sq(3, 0), sq(4, 1)],
    label: 'Mate em 1: a dama dá xeque-mate e o rei não tem casa de fuga.',
  },
  'mate-in-2': {
    size: 5,
    pieces: [black(BK, sq(4, 0)), white(WQ, sq(2, 2)), white(WR, sq(0, 1))],
    arrows: [
      { from: sq(2, 2), to: sq(2, 0) },
      { from: sq(0, 1), to: sq(0, 0) },
    ],
    label: 'Mate em 2: forçar o rei com um lance e dar o mate no lance seguinte.',
  },
  'back-rank': {
    size: 5,
    pieces: [black(BK, sq(4, 0)), black(BP, sq(3, 1)), black(BP, sq(4, 1)), white(WR, sq(0, 0))],
    arrows: [{ from: sq(0, 0), to: sq(4, 0) }],
    label: 'Mate do corredor: o rei preso atrás dos próprios peões leva mate na última fileira.',
  },
  'opening-principles': {
    size: 6,
    pieces: [
      white(WP, sq(2, 2)),
      white(WP, sq(3, 2)),
      white(WN, sq(1, 3)),
      white(WN, sq(4, 3)),
      white(WR, sq(4, 5)),
      white(WK, sq(5, 5)),
    ],
    arrows: [],
    marks: [sq(2, 2), sq(3, 2)],
    label: 'Princípios de abertura: domine o centro, desenvolva as peças e proteja o rei no roque.',
  },
  'endgame-pawn': {
    size: 5,
    pieces: [white(WP, sq(2, 1)), white(WK, sq(2, 3)), black(BK, sq(4, 2))],
    arrows: [{ from: sq(2, 1), to: sq(2, 0) }],
    label: 'Final de peão: o rei apoia o peão até a promoção.',
  },
  'endgame-rook': {
    size: 5,
    pieces: [white(WR, sq(1, 0)), white(WP, sq(3, 2)), white(WK, sq(3, 3)), black(BK, sq(0, 2))],
    arrows: [
      { from: sq(1, 0), to: sq(1, 4) },
      { from: sq(3, 2), to: sq(3, 1) },
    ],
    label: 'Final de torre: a torre corta o rei e o peão avança para promover.',
  },
  conversion: {
    size: 5,
    pieces: [black(BK, sq(0, 0)), white(WQ, sq(1, 1)), white(WK, sq(2, 2))],
    arrows: [{ from: sq(1, 1), to: sq(0, 0) }],
    marks: [sq(0, 1), sq(1, 0)],
    label: 'Conversão: com vantagem material, simplifique e finalize com segurança.',
  },
  'blunder-rate': {
    size: 5,
    pieces: [white(WN, sq(2, 2)), black(BB, sq(0, 4))],
    arrows: [{ from: sq(0, 4), to: sq(2, 2) }],
    label: 'Erros graves: cuidado para não deixar a sua peça sem defesa.',
  },
};

export function getTacticDiagram(tag: WeaknessTag | undefined): TacticDiagramSpec | undefined {
  return tag === undefined ? undefined : tacticDiagrams[tag];
}
