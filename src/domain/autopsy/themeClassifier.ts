import { attacks, between, ray } from 'chessops/attacks';
import { Chess } from 'chessops/chess';
import { parseFen } from 'chessops/fen';
import { parseUci } from 'chessops/util';
import type { Color, NormalMove, Piece, Square } from 'chessops/types';
import type { Board } from 'chessops/board';
import type { Position } from 'chessops/chess';

// Domínio não pode importar infra (regra de lint `no-restricted-imports`);
// mesma convenção local mínima usada em `autopsyReport.ts`.

/**
 * SPIKE D1 — classificador heurístico de temas táticos em posição arbitrária,
 * SEM engine (ADR-006 proíbe avaliação; chessops só fornece regras/geração de
 * lances, o que é permitido).
 *
 * Cada detector é uma heurística geométrica/material barata, NÃO uma prova de
 * que o tema "existe" na posição em sentido pleno (um humano forte poderia
 * discordar em casos de fronteira). O campo `confidence` reflete o quanto a
 * heurística tende a acertar no conjunto de fixtures medido — ver
 * `docs/specs/spike-d1-theme-classifier-RESULT.md` para os números e o
 * veredito por tag (isto NÃO é uma alegação de eficácia; é só precisão de
 * classificação, medida em fixtures sintéticas, não em partidas reais).
 */

export type ThemeClassifierTag =
  | 'mate-in-1'
  | 'fork'
  | 'hanging-piece'
  | 'back-rank'
  | 'pin';

export type ThemeClassification = {
  tag: ThemeClassifierTag;
  confidence: 'high' | 'low';
};

const PIECE_VALUE: Record<Piece['role'], number> = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 100,
};

function opposite(color: Color): Color {
  return color === 'white' ? 'black' : 'white';
}

function loadPosition(fen: string): Position | undefined {
  const setupResult = parseFen(fen);
  if (setupResult.isErr) return undefined;
  const posResult = Chess.fromSetup(setupResult.value);
  if (posResult.isErr) return undefined;
  return posResult.value;
}

/** Todas as casas atacadas por peças de `byColor` na posição `pos`. */
function attackersOf(board: Board, square: Square, byColor: Color): Square[] {
  const result: Square[] = [];
  for (const [sq, piece] of board) {
    if (piece.color !== byColor) continue;
    if (attacks(piece, sq, board.occupied).has(square)) result.push(sq);
  }
  return result;
}

/**
 * Resolve `bestUci` para um `NormalMove` legal na posição. Retorna
 * `undefined` se o UCI for ausente, malformado, um drop (variantes com
 * pockets — não usadas aqui) ou ilegal na posição — nunca classificamos
 * "no escuro". `sanPlayed` não é usado para resolução hoje (ver
 * `classifyTheme`); `bestUci` é a única fonte de lance.
 */
function resolveMove(pos: Position, bestUci: string | undefined): NormalMove | undefined {
  if (!bestUci) return undefined;
  const move = parseUci(bestUci);
  if (!move || !('from' in move)) return undefined;
  if (!pos.isLegal(move)) return undefined;
  return move;
}

/**
 * mate-in-1 (high): existe um lance legal que dá xeque-mate, e `bestUci` é
 * exatamente esse lance. Geometricamente exaustivo — sem falso-positivo
 * possível (a checagem `isCheckmate()` do chessops é regra pura, não
 * avaliação), então quando dispara é sempre correto.
 */
function detectMateInOne(pos: Position, bestUci: string | undefined): ThemeClassification | undefined {
  const move = resolveMove(pos, bestUci);
  if (!move) return undefined;
  const clone = pos.clone();
  clone.play(move);
  if (clone.isCheckmate()) {
    return { tag: 'mate-in-1', confidence: 'high' };
  }
  return undefined;
}

/**
 * back-rank (low/high): mate/ameaça de mate na 1ª/8ª fileira com o rei
 * inimigo cercado pelos próprios peões (sem casa de fuga na fileira acima).
 * - high: o lance jogado (`bestUci`) já é mate imediato na back-rank.
 * - low: o rei está preso na back-rank (peões próprios bloqueiam fuga) mas
 *   não conseguimos confirmar mate neste lance — sinal fraco (pode ser só
 *   "vulnerabilidade", não necessariamente o padrão tático completo).
 */
function detectBackRank(pos: Position, bestUci: string | undefined): ThemeClassification | undefined {
  const move = resolveMove(pos, bestUci);
  if (!move) return undefined;
  const clone = pos.clone();
  clone.play(move);

  const defender = clone.turn; // lado que teria acabado de levar o lance
  const kingSq = clone.board.kingOf(defender);
  if (kingSq === undefined) return undefined;

  const backRank = defender === 'white' ? 0 : 7;
  const kingRank = Math.floor(kingSq / 8);
  if (kingRank !== backRank) return undefined;

  // Rei cercado: todas as casas da fileira imediatamente à frente (na
  // direção do centro) que seriam fuga estão ocupadas por peões do próprio
  // lado (ou fora do tabuleiro).
  const file = kingSq % 8;
  const aheadRank = defender === 'white' ? 1 : 6;
  const escapeFiles = [file - 1, file, file + 1].filter((f) => f >= 0 && f <= 7);
  const boxed = escapeFiles.every((f) => {
    const sq = aheadRank * 8 + f;
    const piece = clone.board.get(sq);
    return piece?.color === defender && piece.role === 'pawn';
  });
  if (!boxed) return undefined;

  if (clone.isCheckmate()) {
    return { tag: 'back-rank', confidence: 'high' };
  }
  if (clone.isCheck()) {
    return { tag: 'back-rank', confidence: 'low' };
  }
  return undefined;
}

/**
 * fork (high com rei/dama, senão low): o lance jogado move uma peça para uma
 * casa de onde ela ataca >= 2 peças inimigas de valor >= peça atacante (ou o
 * rei inimigo, que sempre conta). Heurística puramente geométrica+material —
 * não verifica se as peças atacadas têm defesa suficiente para a troca
 * final compensar (isso exigiria avaliação, proibida por ADR-006), então
 * confidence reflete só "geometria de garfo clássico", não o resultado
 * material real da sequência.
 */
function detectFork(pos: Position, bestUci: string | undefined): ThemeClassification | undefined {
  const move = resolveMove(pos, bestUci);
  if (!move) return undefined;
  const mover = pos.board.get(move.from);
  if (!mover) return undefined;
  // Peão não conta como "garfo" clássico no nosso catálogo (ataque de peão a
  // duas peças é comum demais e raramente é o padrão ensinado como "fork").
  if (mover.role === 'pawn' || mover.role === 'king') return undefined;

  const clone = pos.clone();
  clone.play(move);

  const attackerValue = PIECE_VALUE[mover.role];
  const enemyColor = opposite(mover.color);
  const attackedSquares = attacks(mover, move.to, clone.board.occupied);

  let hitsKing = false;
  let hitsQueen = false;
  let qualifyingTargets = 0;

  for (const sq of attackedSquares) {
    const target = clone.board.get(sq);
    if (!target || target.color !== enemyColor) continue;
    if (target.role === 'king') {
      hitsKing = true;
      qualifyingTargets += 1;
      continue;
    }
    if (target.role === 'queen') hitsQueen = true;
    const targetValue = PIECE_VALUE[target.role];
    if (targetValue >= attackerValue) {
      qualifyingTargets += 1;
    }
  }

  if (qualifyingTargets >= 2) {
    return { tag: 'fork', confidence: hitsKing || hitsQueen ? 'high' : 'low' };
  }
  return undefined;
}

/**
 * hanging-piece (high): o lance jogado é uma captura de uma peça que não
 * tinha nenhum defensor inimigo (do lado capturado) na posição ANTES da
 * captura. Geometria pura via `attacks`/`attackersOf` — sem ambiguidade de
 * avaliação (não pesamos se a "troca" seria boa, só se a peça tinha zero
 * defensores).
 */
function detectHangingPiece(pos: Position, bestUci: string | undefined): ThemeClassification | undefined {
  const move = resolveMove(pos, bestUci);
  if (!move) return undefined;
  const captured = pos.board.get(move.to);
  if (!captured) return undefined; // não é captura
  const mover = pos.board.get(move.from);
  if (!mover || mover.color === captured.color) return undefined;

  const defenders = attackersOf(pos.board, move.to, captured.color).filter((sq) => sq !== move.from);
  if (defenders.length === 0) {
    return { tag: 'hanging-piece', confidence: 'high' };
  }
  return undefined;
}

/**
 * pin (low): o lance jogado desloca uma peça deslizante (bispo/torre/dama)
 * para uma casa de onde ela alinha (mesma fileira/coluna/diagonal, conforme
 * o tipo de peça) com o rei inimigo, com exatamente UMA peça inimiga entre
 * elas (cravada absoluta). Confidence `low`: não distinguimos cravadas
 * "relevantes" (peça de valor) de cravadas triviais (ex. peão cravado sem
 * consequência), então o sinal é fraco — mais "há uma cravada geométrica"
 * do que "há uma cravada tática explorável".
 */
function detectPin(pos: Position, bestUci: string | undefined): ThemeClassification | undefined {
  const move = resolveMove(pos, bestUci);
  if (!move) return undefined;
  const mover = pos.board.get(move.from);
  if (!mover) return undefined;
  if (mover.role !== 'bishop' && mover.role !== 'rook' && mover.role !== 'queen') return undefined;

  const clone = pos.clone();
  clone.play(move);

  const enemyColor = opposite(mover.color);
  const kingSq = clone.board.kingOf(enemyColor);
  if (kingSq === undefined) return undefined;
  if (kingSq === move.to) return undefined;

  const line = ray(move.to, kingSq);
  if (!line.nonEmpty() || !line.has(move.to) || !line.has(kingSq)) return undefined;

  // A peça deslizante precisa conseguir se mover ao longo dessa direção
  // (bispo só em diagonais, torre só em fileira/coluna); `ray` já garante
  // alinhamento geométrico, mas checamos que o tipo de peça cobre essa
  // direção usando os próprios ataques pseudo-legais da peça sem bloqueio.
  const sameFile = move.to % 8 === kingSq % 8;
  const sameRank = Math.floor(move.to / 8) === Math.floor(kingSq / 8);
  const isDiagonal = !sameFile && !sameRank;
  if (mover.role === 'bishop' && !isDiagonal) return undefined;
  if (mover.role === 'rook' && isDiagonal) return undefined;

  const squaresBetween = between(move.to, kingSq);
  const piecesBetween: Square[] = [];
  for (const sq of squaresBetween) {
    if (clone.board.get(sq)) piecesBetween.push(sq);
  }
  if (piecesBetween.length !== 1) return undefined;

  const pinnedSq = piecesBetween[0];
  const pinnedPiece = pinnedSq !== undefined ? clone.board.get(pinnedSq) : undefined;
  if (!pinnedPiece || pinnedPiece.color !== enemyColor) return undefined;

  return { tag: 'pin', confidence: 'low' };
}

const DETECTORS: ((
  pos: Position,
  bestUci: string | undefined,
) => ThemeClassification | undefined)[] = [
  detectMateInOne,
  detectBackRank,
  detectFork,
  detectHangingPiece,
  detectPin,
];

/**
 * Classifica uma posição de partida real (FEN antes do lance + lance
 * jogado/melhor lance) em zero ou mais temas do catálogo, SEM rodar engine
 * (ADR-006). `sanPlayed` é aceito por assinatura para uso futuro (ex.
 * resolver o lance quando `bestUci` faltar), mas hoje só `bestUci` é
 * consumido — ver limitações no RESULT.md.
 *
 * Retorna lista vazia se a posição for inválida ou nenhum detector disparar
 * (o que é o caso comum: a maioria dos erros reais não é nenhum destes 5
 * padrões geométricos simples — ver RESULT.md para a discussão de cobertura).
 */
export function classifyTheme(
  fenBefore: string,
  bestUci?: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- reservado p/ fallback futuro (ver RESULT.md); assinatura já reflete o contrato pedido
  sanPlayed?: string,
): ThemeClassification[] {
  const pos = loadPosition(fenBefore);
  if (!pos || !bestUci) return [];

  const results: ThemeClassification[] = [];
  for (const detector of DETECTORS) {
    const hit = detector(pos, bestUci);
    if (hit) results.push(hit);
  }
  return results;
}
