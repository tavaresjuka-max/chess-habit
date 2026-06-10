import { improvingAndUpBands, learnerBands } from '../bands';
import type { LearnerBand, PlanResourceStage, WeaknessTag } from '../types';

export type CatalogSkillNode = {
  id: string;
  weaknessTag: WeaknessTag;
  title: string;
  themeSlugs: readonly string[];
  bands: readonly LearnerBand[];
  stageFit: readonly PlanResourceStage[];
  timeFits: readonly number[];
  resourceIds: readonly string[];
  lemosCue: string;
  avoidWhen?: readonly string[];
};

const allBands = learnerBands;
const allStages = ['explain', 'guided', 'retrieval', 'transfer', 'review'] as const;
const shortAndMedium = [5, 10, 15] as const;
const mediumAndLong = [10, 15, 20, 30, 60] as const;

export const catalogSkillNodes = [
  {
    id: 'piece-safety-hanging',
    weaknessTag: 'hanging-piece',
    title: 'Segurança de peças soltas',
    themeSlugs: ['hangingPiece', 'trappedPiece', 'short'],
    bands: allBands,
    stageFit: allStages,
    timeFits: shortAndMedium,
    resourceIds: ['video:hanging-pieces', 'puzzle:hangingPiece', 'puzzle:trappedPiece', 'puzzle:short'],
    lemosCue: 'Antes de abrir o Lichess, escolha uma peça sua e uma do rival: quem defende cada uma?',
    avoidWhen: ['Evite se a sessão pede final guiado ou revisão de mate específico.'],
  },
  {
    id: 'anti-blunder-scan',
    weaknessTag: 'blunder-rate',
    title: 'Varredura anti-blunder',
    themeSlugs: ['hangingPiece', 'defensiveMove', 'mix', 'short'],
    bands: allBands,
    stageFit: ['explain', 'retrieval', 'review', 'transfer'],
    timeFits: [5, 10, 15, 20],
    resourceIds: ['video:avoid-blunders', 'puzzle:hangingPiece', 'puzzle:defensiveMove', 'puzzle:mix', 'puzzle-mode:streak'],
    lemosCue: 'Entre no treino com uma regra simples: cheques, capturas, ameaças e peças sem defesa.',
  },
  {
    id: 'fork-two-targets',
    weaknessTag: 'fork',
    title: 'Garfo: dois alvos',
    themeSlugs: ['fork', 'short'],
    bands: allBands,
    stageFit: allStages,
    timeFits: shortAndMedium,
    resourceIds: ['practice:fundamental-tactics:the-fork', 'video:fork', 'puzzle:fork', 'puzzle:short'],
    lemosCue: 'Procure primeiro os dois alvos. O lance vem depois; o padrão vem antes.',
  },
  {
    id: 'pin-line-pressure',
    weaknessTag: 'pin',
    title: 'Cravada: linha e peça presa',
    themeSlugs: ['pin', 'xRayAttack', 'short'],
    bands: allBands,
    stageFit: allStages,
    timeFits: shortAndMedium,
    resourceIds: ['practice:fundamental-tactics:the-pin', 'video:pin', 'puzzle:pin', 'puzzle:xRayAttack'],
    lemosCue: 'Antes do primeiro clique, pergunte qual peça não pode se mexer e o que está atrás dela.',
  },
  {
    id: 'skewer-line-pressure',
    weaknessTag: 'skewer',
    title: 'Espeto: alvo maior na frente',
    themeSlugs: ['skewer', 'xRayAttack', 'short'],
    bands: allBands,
    stageFit: allStages,
    timeFits: shortAndMedium,
    resourceIds: ['practice:fundamental-tactics:the-skewer', 'video:skewer', 'puzzle:skewer', 'puzzle:xRayAttack'],
    lemosCue: 'Veja a linha inteira: se a peça grande sair, o que fica exposto atrás?',
  },
  {
    id: 'discovered-open-line',
    weaknessTag: 'discovered',
    title: 'Ataque descoberto: linha que abre',
    themeSlugs: ['discoveredAttack', 'discoveredCheck', 'doubleCheck', 'xRayAttack'],
    bands: allBands,
    stageFit: allStages,
    timeFits: [5, 10, 15, 20],
    resourceIds: [
      'practice:fundamental-tactics:discovered-attacks',
      'video:discovered-attack',
      'puzzle:discoveredAttack',
      'puzzle:discoveredCheck',
      'puzzle:doubleCheck',
    ],
    lemosCue: 'Antes de calcular, identifique a peça que sai da frente e a linha que ela libera.',
  },
  {
    id: 'mate-one-move',
    weaknessTag: 'mate-in-1',
    title: 'Mate em 1: ameaça final',
    themeSlugs: ['mateIn1', 'oneMove', 'mate'],
    bands: allBands,
    stageFit: allStages,
    timeFits: shortAndMedium,
    resourceIds: [
      'practice:checkmates:piece-checkmates-i',
      'video:mating-patterns',
      'puzzle:mateIn1',
      'puzzle:oneMove',
      'puzzle:mate',
    ],
    lemosCue: 'Procure casas de fuga, defesas e capturas do rei. Se todas somem, o lance aparece.',
  },
  {
    id: 'mate-two-patterns',
    weaknessTag: 'mate-in-2',
    title: 'Mate em 2: padrão e continuação',
    themeSlugs: ['mateIn2', 'mate', 'long', 'doubleCheck', 'exposedKing'],
    bands: allBands,
    stageFit: allStages,
    timeFits: [10, 15, 20, 30, 60],
    resourceIds: [
      'practice:checkmates:checkmate-patterns-i',
      'video:mating-patterns',
      'puzzle:mateIn2',
      'puzzle:mate',
      'puzzle:long',
    ],
    lemosCue: 'Não corra para o lance bonito: primeiro veja a ameaça que continua depois da defesa.',
  },
  {
    id: 'back-rank-safety',
    weaknessTag: 'back-rank',
    title: 'Última fileira',
    themeSlugs: ['backRankMate', 'mate', 'mateIn2'],
    bands: allBands,
    stageFit: allStages,
    timeFits: [5, 10, 15, 20],
    resourceIds: [
      'practice:checkmates:checkmate-patterns-i',
      'video:back-rank',
      'puzzle:backRankMate',
      'puzzle:mateIn2',
    ],
    lemosCue: 'Olhe o rei preso, as peças que bloqueiam fuga e quem controla a última fileira.',
  },
  {
    id: 'opening-principles-core',
    weaknessTag: 'opening-principles',
    title: 'Abertura: centro, desenvolvimento e rei',
    themeSlugs: ['opening', 'castling', 'attackingF2F7'],
    bands: allBands,
    stageFit: ['explain', 'guided', 'retrieval', 'review'],
    timeFits: mediumAndLong,
    resourceIds: ['video:opening-principles-central-control', 'puzzle:opening', 'puzzle:castling', 'puzzle:attackingF2F7'],
    lemosCue: 'Entre com uma pergunta só: meu lance disputa o centro, desenvolve ou melhora a segurança do rei?',
  },
  {
    id: 'time-pressure-streak',
    weaknessTag: 'time-trouble',
    title: 'Precisão sob limite',
    themeSlugs: ['short', 'mix'],
    bands: allBands,
    stageFit: ['retrieval', 'transfer', 'review'],
    timeFits: [5, 10, 15],
    resourceIds: ['puzzle-mode:streak', 'puzzle-mode:storm', 'puzzle:short', 'puzzle:mix'],
    lemosCue: 'O treino não é correr: é decidir uma checagem mínima antes de acelerar.',
    avoidWhen: ['Evite Storm se o erro recente foi pressa; Streak é o padrão conservador.'],
  },
  {
    id: 'pawn-endgame-core',
    weaknessTag: 'endgame-pawn',
    title: 'Finais de peões: rei e promoção',
    themeSlugs: ['pawnEndgame', 'advancedPawn', 'promotion', 'underPromotion', 'endgame'],
    bands: allBands,
    stageFit: allStages,
    timeFits: mediumAndLong,
    resourceIds: [
      'practice:pawn-endgames:key-squares',
      'practice:pawn-endgames:opposition',
      'video:pawn-endgames',
      'puzzle:pawnEndgame',
      'puzzle:promotion',
    ],
    lemosCue: 'Conte rei ativo, oposição e casa de promoção antes de calcular qualquer corrida.',
  },
  {
    id: 'rook-endgame-core',
    weaknessTag: 'endgame-rook',
    title: 'Finais de torre: atividade',
    themeSlugs: ['rookEndgame', 'queenRookEndgame', 'endgame'],
    bands: improvingAndUpBands,
    stageFit: ['guided', 'retrieval', 'review', 'transfer'],
    timeFits: mediumAndLong,
    resourceIds: [
      'practice:rook-endgames:basic-rook-endgames',
      'puzzle:rookEndgame',
      'puzzle:queenRookEndgame',
      'study:noseknowsall:rook-endgames-you-must-know',
    ],
    lemosCue: 'Antes da linha, pergunte se a torre está ativa ou só defendendo passivamente.',
  },
  {
    id: 'conversion-material',
    weaknessTag: 'conversion',
    title: 'Converter vantagem',
    themeSlugs: ['advantage', 'crushing', 'capturingDefender', 'defensiveMove', 'deflection'],
    bands: allBands,
    stageFit: allStages,
    timeFits: mediumAndLong,
    resourceIds: [
      'video:convert-material-advantage',
      'puzzle:advantage',
      'puzzle:crushing',
      'puzzle:capturingDefender',
      'puzzle:defensiveMove',
      'practice:fundamental-tactics:overloaded-pieces',
    ],
    lemosCue: 'Vantagem não é pressa: simplifique, ative peças e corte o contrajogo antes do golpe final.',
  },
] as const satisfies readonly CatalogSkillNode[];

export function getCatalogSkillNodesForWeakness(tag: WeaknessTag): CatalogSkillNode[] {
  return catalogSkillNodes.filter((node) => node.weaknessTag === tag);
}
