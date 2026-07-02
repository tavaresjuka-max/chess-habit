/**
 * Fixtures do SPIKE D1 (classificador heurístico de temas sem engine).
 * Todas as posições foram validadas manualmente via chessops (lances legais,
 * `isCheckmate`/`isCheck`, geometria de `ray`/`between`) antes de entrar aqui
 * — ver `docs/specs/spike-d1-theme-classifier-RESULT.md` para a metodologia.
 *
 * Convenção: cada fixture é `{ fenBefore, bestUci, label }`. `label` é só
 * para legibilidade nos testes (não usado pelo classificador).
 */

export type ThemeFixture = {
  fenBefore: string;
  bestUci: string;
  label: string;
};

// ── mate-in-1 ───────────────────────────────────────────────────────────

export const MATE_IN_1_POSITIVE: ThemeFixture[] = [
  {
    // Damas x f7 no clássico ataque ao ponto fraco (Nf6?? deixa f7 indefeso).
    fenBefore: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
    bestUci: 'h5f7',
    label: 'Qxf7# (ataque ao ponto fraco f7)',
  },
  {
    // Mate na última fileira: torre e1-e8# com rei cercado pelos peões.
    fenBefore: '6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1',
    bestUci: 'e1e8',
    label: 'Re8# (também back-rank)',
  },
  {
    // Mate de corredor: dama entrega mate com rei cercado por f7/g7/h7.
    fenBefore: '6k1/5ppp/8/8/8/2B5/8/3Q2K1 w - - 0 1',
    bestUci: 'd1d8',
    label: 'Qd8# (rei cercado pelos 3 peões, sem casa de fuga)',
  },
];

export const MATE_IN_1_NEGATIVE: ThemeFixture[] = [
  {
    // Xeque, mas rei tem fuga (a8 não é mate: reis foge para d7/e7/f7...).
    fenBefore: '4k3/8/8/8/8/8/8/R3K3 w - - 0 1',
    bestUci: 'a1a8',
    label: 'Ra8+ (xeque, não mate — rei foge)',
  },
  {
    // Lance comum sem xeque nem mate (desenvolvimento).
    fenBefore: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    bestUci: 'e7e5',
    label: 'e5 (lance normal de abertura)',
  },
  {
    // Xeque de torre mas rei tem casa de fuga por peão faltando em g7.
    fenBefore: '6k1/5p1p/8/8/8/8/8/4R1K1 w - - 0 1',
    bestUci: 'e1e8',
    label: 'Re8+ (parece back-rank mas rei foge para g7)',
  },
  {
    // Captura simples sem qualquer xeque envolvido.
    fenBefore: '4k3/8/8/8/3n4/8/8/3RK3 w - - 0 1',
    bestUci: 'd1d4',
    label: 'Rxd4 (captura, sem xeque)',
  },
];

// ── fork ─────────────────────────────────────────────────────────────────

export const FORK_POSITIVE: ThemeFixture[] = [
  {
    // Cavalo garfo rei + torre (o clássico "fork real").
    fenBefore: 'r3k3/8/8/3N4/8/8/8/4K3 w - - 0 1',
    bestUci: 'd5c7',
    label: 'Nc7+ (garfo rei a8-e8 e torre a8)',
  },
  {
    // Cavalo garfo dama + torre (ambas de valor >= cavalo). Rei branco em h1,
    // fora das linhas de ataque de Qe8/Rc8 (evita xeque duplo acidental).
    fenBefore: '2r1q1k1/8/8/1N6/8/8/8/7K w - - 0 1',
    bestUci: 'b5d6',
    label: 'Nd6 garfo em Rc8/Qe8 (peças valiosas, não rei)',
  },
  {
    // Cavalo garfo dama + rei (lance não-captura, ambos alvos seguem no
    // tabuleiro após o lance) — alta confiança dupla.
    fenBefore: '2q1k3/8/8/1N6/8/8/8/4K3 w - - 0 1',
    bestUci: 'b5d6',
    label: 'Nd6 (garfo dama c8 e rei e8, ambos presentes pós-lance)',
  },
];

export const FORK_NEGATIVE: ThemeFixture[] = [
  {
    // Cavalo ataca 2 peões (valor 1, abaixo do valor do cavalo) — não conta.
    fenBefore: '4k3/8/2p1p3/8/8/8/4N3/4K3 w - - 0 1',
    bestUci: 'e2d4',
    label: 'Nd4 (ataca 2 peões — valor insuficiente, não é fork)',
  },
  {
    // Cavalo ataca só 1 peça de valor (torre); segunda casa está vazia.
    fenBefore: '4k3/8/2r5/8/8/8/8/3NK3 w - - 0 1',
    bestUci: 'd1c3',
    label: 'Nc3 (não ataca 2 peças simultaneamente — alvo único)',
  },
  {
    // Peão avança sem capturar — não é ataque a nenhuma peça (excluído por role).
    fenBefore: '2r1r1k1/8/8/8/3P4/8/8/6K1 w - - 0 1',
    bestUci: 'd4d5',
    label: 'd5 (avanço de peão, não ataque — não é fork por definição do detector)',
  },
  {
    // Lance de rei nunca conta como fork (excluído por role).
    fenBefore: '2r1r1k1/8/8/8/8/8/8/4K3 w - - 0 1',
    bestUci: 'e1d2',
    label: 'Kd2 (lance de rei, nunca classificado como fork)',
  },
];

// ── hanging-piece ────────────────────────────────────────────────────────

export const HANGING_PIECE_POSITIVE: ThemeFixture[] = [
  {
    // Cavalo preto em d4 sem qualquer defensor — captura limpa.
    fenBefore: '4k3/8/8/8/3n4/8/8/3RK3 w - - 0 1',
    bestUci: 'd1d4',
    label: 'Rxd4 (cavalo indefeso)',
  },
  {
    // Torre preta indefesa capturada por bispo (diagonal a1-c3).
    fenBefore: '4k3/8/8/8/8/2r5/8/B3K3 w - - 0 1',
    bestUci: 'a1c3',
    label: 'Bxc3 (torre indefesa em diagonal)',
  },
  {
    // Dama preta indefesa capturada por cavalo.
    fenBefore: '4k3/8/2q5/8/3N4/8/8/4K3 w - - 0 1',
    bestUci: 'd4c6',
    label: 'Nxc6 (dama indefesa)',
  },
];

export const HANGING_PIECE_NEGATIVE: ThemeFixture[] = [
  {
    // Cavalo preto em d4 DEFENDIDO por peão em e5 — captura não deve contar.
    fenBefore: '4k3/8/8/4p3/3n4/8/8/3RK3 w - - 0 1',
    bestUci: 'd1d4',
    label: 'Rxd4?? (cavalo defendido por peão e5 — NÃO é hanging-piece)',
  },
  {
    // Lance não é captura (casa de destino vazia) — não deve disparar.
    fenBefore: '4k3/8/8/8/3n4/8/8/3RK3 w - - 0 1',
    bestUci: 'd1d3',
    label: 'Rd3 (não é captura)',
  },
  {
    // Peça defendida por outra peça do mesmo tipo (torre na mesma fileira) — não deve contar.
    fenBefore: '4k3/8/8/8/r2r4/8/8/3RK3 w - - 0 1',
    bestUci: 'd1d4',
    label: 'Rxd4?? (torre defendida por outra torre em a4)',
  },
];

// ── back-rank ────────────────────────────────────────────────────────────

export const BACK_RANK_POSITIVE: ThemeFixture[] = [
  {
    // Mate na 8ª fileira, rei cercado por f7/g7/h7.
    fenBefore: '6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1',
    bestUci: 'e1e8',
    label: 'Re8# (back-rank clássico, alta confiança)',
  },
  {
    // Mate na 1ª fileira (espelhado, rei branco).
    fenBefore: '4r1k1/8/8/8/8/8/5PPP/6K1 b - - 0 1',
    bestUci: 'e8e1',
    label: 'Re1# (back-rank espelhado, brancas cercadas)',
  },
  {
    // Xeque na back-rank sem confirmação de mate: rei cercado pelos peões
    // mas a dama em a8 pode capturar a torre (Qxe8) — sinal de baixa
    // confiança (o detector marca "back-rank" pela geometria, não sabe que
    // a defesa existe).
    fenBefore: 'q5k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1',
    bestUci: 'e1e8',
    label: 'Re8+ (rei cercado por peões mas dama a8 pode capturar — low confidence)',
  },
];

export const BACK_RANK_NEGATIVE: ThemeFixture[] = [
  {
    // Rei tem fuga (falta peão em g7) — não é back-rank.
    fenBefore: '6k1/5p1p/8/8/8/8/8/4R1K1 w - - 0 1',
    bestUci: 'e1e8',
    label: 'Re8+ (rei foge para g7 — NÃO é back-rank)',
  },
  {
    // Rei não está na back-rank (fora do padrão).
    fenBefore: '8/6k1/5ppp/8/8/8/8/4R1K1 w - - 0 1',
    bestUci: 'e1e7',
    label: 'Re7+ (rei na 7ª fileira, não back-rank)',
  },
  {
    // Lance não dá xeque algum (captura neutra) — não deve disparar.
    fenBefore: '6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1',
    bestUci: 'g1f1',
    label: 'Kf1 (lance neutro, sem xeque)',
  },
];

// ── pin ──────────────────────────────────────────────────────────────────

export const PIN_POSITIVE: ThemeFixture[] = [
  {
    // Cravada absoluta clássica: torre crava cavalo contra o rei na coluna a.
    fenBefore: 'k7/8/n7/8/8/8/8/R3K3 w - - 0 1',
    bestUci: 'a1a5',
    label: 'Ra5 (crava cavalo a6 contra rei a8)',
  },
  {
    // Bispo se desloca (sem capturar) para a diagonal a1-h8, cravando o
    // cavalo e5 contra o rei h8 — cravada real, não captura do cravado.
    fenBefore: '7k/8/8/4n3/1B6/8/8/4K3 w - - 0 1',
    bestUci: 'b4c3',
    label: 'Bc3 (crava cavalo e5 contra rei h8 na diagonal a1-h8)',
  },
  {
    // Dama se desloca (sem capturar) para a coluna e, cravando a torre e4
    // contra o rei e8 — cravada real, não captura do cravado.
    fenBefore: '4k3/8/8/8/4r3/8/8/3Q1K2 w - - 0 1',
    bestUci: 'd1e2',
    label: 'Qe2 (crava torre e4 contra rei e8 na coluna e)',
  },
];

export const PIN_NEGATIVE: ThemeFixture[] = [
  {
    // Torre avança na coluna a, mas rei está fora da coluna (b8) — sem cravada.
    fenBefore: '1k6/8/n7/8/8/8/8/R3K3 w - - 0 1',
    bestUci: 'a1a5',
    label: 'Ra5 (rei em b8, fora da coluna a — NÃO é cravada)',
  },
  {
    // Cavalo (peça não-deslizante) nunca pode cravar — detector exclui por role.
    fenBefore: '4k3/8/8/3n4/8/8/8/4NK2 w - - 0 1',
    bestUci: 'e1d3',
    label: 'Nd3 (cavalo não pode cravar — excluído por role)',
  },
  {
    // Duas peças entre atacante e rei (peão e4 + cavalo e6) — bloqueio duplo,
    // não é cravada absoluta (mover qualquer uma não expõe o rei).
    fenBefore: '4k3/8/4n3/8/4p3/8/8/4R1K1 w - - 0 1',
    bestUci: 'e1e2',
    label: 'Re2 (duas peças entre torre e rei — não conta como cravada absoluta)',
  },
];
