/**
 * Rótulos PT-BR para temas de puzzle do Lichess (SPEC T7, 2026-06-26).
 *
 * INTENÇÃO: eliminar slugs crus na UI (ex.: "hangingPiece") substituindo-os por
 * rótulos legíveis em português. A função lichessThemeLabel retorna o rótulo PT-BR
 * se houver mapeamento, ou o slug original (fallback seguro) caso contrário.
 *
 * Fonte dos slugs: src/domain/sources/resourceCatalog.ts + Lichess Puzzle DB.
 */

const LICHESS_THEME_LABELS_PT: Readonly<Record<string, string>> = {
  // Motivos táticos principais
  fork: 'Garfo',
  pin: 'Cravada',
  skewer: 'Espeto',
  hangingPiece: 'Peça solta',
  trappedPiece: 'Peça presa',
  discoveredAttack: 'Ataque descoberto',
  discoveredCheck: 'Xeque descoberto',
  doubleCheck: 'Xeque duplo',
  defensiveMove: 'Lance defensivo',
  deflection: 'Desvio',
  attraction: 'Atração',
  clearance: 'Limpeza de linha',
  interference: 'Interferência',
  intermezzo: 'Interlúdio',
  quietMove: 'Lance silencioso',
  xRayAttack: 'Ataque raio-X',
  zugzwang: 'Zugzwang',
  sacrifice: 'Sacrifício',
  capturingDefender: 'Capturar o defensor',
  collinearMove: 'Lance colinear',
  kingsideAttack: 'Ataque no lado do rei',
  queensideAttack: 'Ataque no lado da dama',
  exposedKing: 'Rei exposto',
  attackingF2F7: 'Ataque em f2/f7',
  advancedPawn: 'Peão avançado',

  // Mates
  mate: 'Xeque-mate',
  mateIn1: 'Mate em 1',
  mateIn2: 'Mate em 2',
  mateIn3: 'Mate em 3',
  mateIn4: 'Mate em 4',
  mateIn5: 'Mate em 5+',
  anastasiaMate: 'Mate de Anastásia',
  arabianMate: 'Mate árabe',
  backRankMate: 'Mate na última fileira',
  balestraMate: 'Mate Balestra',
  blindSwineMate: 'Mate dos porcos cegos',
  bodenMate: 'Mate de Boden',
  cornerMate: 'Mate no canto',
  doubleBishopMate: 'Mate dos dois bispos',
  dovetailMate: 'Mate em rabo de andorinha',
  epauletteMate: 'Mate em dragonas',
  hookMate: 'Mate em gancho',
  killBoxMate: 'Mate na caixa',
  morphysMate: 'Mate de Morphy',
  operaMate: 'Mate da ópera',
  pillsburysMate: 'Mate de Pillsbury',
  smotheredMate: 'Mate sufocado',
  swallowstailMate: 'Mate em cauda de andorinha',
  triangleMate: 'Mate em triângulo',
  vukovicMate: 'Mate de Vuković',

  // Fases da partida
  opening: 'Abertura',
  middlegame: 'Meio-jogo',
  endgame: 'Final',
  rookEndgame: 'Final de torres',
  bishopEndgame: 'Final de bispos',
  pawnEndgame: 'Final de peões',
  knightEndgame: 'Final de cavalos',
  queenEndgame: 'Final de damas',
  queenRookEndgame: 'Final dama e torre',

  // Metas
  advantage: 'Vantagem',
  crushing: 'Esmagamento',
  equality: 'Igualdade',

  // Movimentos especiais
  castling: 'Roque',
  enPassant: 'En passant',
  promotion: 'Promoção',
  underPromotion: 'Subpromoção',

  // Comprimento do puzzle
  oneMove: 'Um lance',
  short: 'Puzzle curto',
  long: 'Puzzle longo',
  veryLong: 'Puzzle muito longo',

  // Mix e origem
  mix: 'Mistura',
  master: 'Partidas de mestre',
  masterVsMaster: 'Mestre vs. Mestre',
  superGM: 'Super-GM',
};

/**
 * Retorna o rótulo PT-BR do tema ou o slug original se não houver mapeamento.
 */
export function lichessThemeLabel(slug: string): string {
  return LICHESS_THEME_LABELS_PT[slug] ?? slug;
}
