/**
 * Fixtures do export do Lichess (GET /game/export/{id} com Accept:
 * application/json, evals) — shape real observado, reduzido ao necessário
 * para os testes de `buildAutopsyReport`.
 */

/**
 * Partida com `judgment` explícito (o caso mais comum quando o Lichess já
 * rodou a análise completa). Brancas jogam 1.e4 e2 e5 ... e cometem um
 * blunder no ply 5 (3.Bxf7+?? seria irreal geometricamente, então usamos
 * uma sequência simples e plausível: 1.e4 e5 2.Nf3 Nc6 3.d4?? exd4 — 3.d4 é
 * marcado blunder pelo Lichess).
 */
export const GAME_WITH_JUDGMENTS = {
  id: 'abcd1234',
  moves: 'e4 e5 Nf3 Nc6 d4 exd4',
  players: {
    white: { user: { name: 'AlunoBranco' } },
    black: { user: { name: 'RivalPreto' } },
  },
  analysis: [
    { eval: 20 },
    { eval: 15 },
    { eval: 25 },
    { eval: 10 },
    {
      eval: -180,
      judgment: { name: 'Blunder', comment: 'Perde um peão central sem compensação.' },
    },
    { eval: -190 },
  ],
};

/**
 * Partida só com `eval` (sem `judgment`) — força o FALLBACK por queda de
 * avaliação. Pretas cometem um erro grave no ply 6 (após 3...Nc6?? branco
 * ganha ~350cp na perspectiva de pretas ao negar o eval cru).
 */
export const GAME_WITH_EVALS_ONLY = {
  id: 'efgh5678',
  moves: 'd4 d5 c4 e6 Nc3 dxc4',
  players: {
    white: { user: { name: 'BrancoEval' } },
    black: { user: { name: 'PretoEval' } },
  },
  analysis: [
    { eval: 30 },
    { eval: 35 },
    { eval: 40 },
    { eval: 45 },
    { eval: 50 },
    // Ply 6 (pretas jogam dxc4): eval bruto após o lance é da perspectiva
    // de quem tem a vez a seguir (brancas) = +400 ⇒ perspectiva de pretas
    // (que jogaram) = -400. evalBefore (perspectiva de pretas, negando o
    // eval bruto anterior de brancas = 50) = -50. Queda = -50 - (-400) =
    // 350 ⇒ blunder.
    { eval: 400 },
  ],
};

/** Partida sem análise disponível — Lichess não processou ainda. */
export const GAME_WITHOUT_ANALYSIS = {
  id: 'ijkl9012',
  moves: 'e4 c5 Nf3 d6',
  players: {
    white: { user: { name: 'SemAnalise1' } },
    black: { user: { name: 'SemAnalise2' } },
  },
};

/**
 * Partida com um lance decisivo por mate (`mate` em vez de `eval`). Ply 7
 * (4.Qxf7??, brancas) é um blunder que entrega a dama: `analysis[6].mate: 1`
 * simula um caso onde o Lichess reporta mate cravado após o lance de
 * pretas seguinte (valor sentinela testado independente da narrativa
 * xadrezística exata).
 */
export const GAME_WITH_MATE_SCORE = {
  id: 'mnop3456',
  moves: 'e4 e5 Qh5 Nc6 Bc4 Nf6 Qxf7',
  players: {
    white: { user: { name: 'MateWhite' } },
    black: { user: { name: 'MateBlack' } },
  },
  analysis: [
    { eval: 20 },
    { eval: 10 },
    { eval: -50 },
    { eval: -40 },
    { eval: 0 },
    { eval: -60 },
    {
      mate: 1,
      judgment: { name: 'Blunder', comment: 'A dama cai após ...Nxf7, sem compensação.' },
    },
  ],
};
