import type {
  DailyPlan,
  LearningPlanProposal,
  SessionMinutes,
  Weakness,
  WeaknessTag,
} from '../types';
import type { TrainingRoadmapItem } from '../plan/planSessions';

type BuildLearningPlanProposalInput = {
  plan: DailyPlan;
  roadmap: readonly TrainingRoadmapItem[];
  sessionMinutes: SessionMinutes;
  weaknesses: readonly Weakness[];
};

const firstPhaseHoursByFocus = {
  'hanging-piece': 24,
  fork: 30,
  pin: 24,
  skewer: 24,
  discovered: 24,
  'mate-in-1': 18,
  'mate-in-2': 30,
  'back-rank': 24,
  'opening-principles': 18,
  'time-trouble': 18,
  'endgame-pawn': 24,
  'endgame-rook': 30,
  conversion: 30,
  'blunder-rate': 24,
} satisfies Record<WeaknessTag, number>;

export function buildLearningPlanProposal(input: BuildLearningPlanProposalInput): LearningPlanProposal {
  const focusTag = input.plan.weeklyFocus?.tag ?? input.weaknesses[0]?.tag ?? 'blunder-rate';
  const focusTitle = input.plan.weeklyFocus?.title ?? weaknessTitleByTag[focusTag];
  const firstPhaseHours = firstPhaseHoursByFocus[focusTag];
  const sessions = Math.ceil((firstPhaseHours * 60) / input.sessionMinutes);
  const checkpointHours = Math.min(6, firstPhaseHours);
  const checkpointSessions = Math.ceil((checkpointHours * 60) / input.sessionMinutes);
  const weeksAtDailyPace = Math.max(1, Math.ceil(sessions / 7));
  const roadmapFocusItems = input.roadmap
    .filter((item) => item.status !== 'done')
    .slice(0, 3)
    .map((item) => `${item.label}: ${item.title}`);

  return {
    heading: 'Entendi o que você precisa.',
    intro: getIntro(input.weaknesses.length),
    phaseTitle: `Primeira fase: ${focusTitle}`,
    methodSummary:
      'O método é: observar sinais reais, escolher uma habilidade-foco, treinar no Lichess, registrar resultado e ajustar a próxima sessão.',
    evidenceLevel: getEvidenceLevel(input.weaknesses[0]),
    methodSteps: [
      'Diagnóstico: sinais de partidas, puzzles e respostas manuais viram hipóteses de fraqueza.',
      'Treino: conceito guiado quando o tema é novo, depois recuperação ativa em puzzles variados.',
      'Transferência: revisão e prática voltam ao tema até ele aparecer melhor nos próximos sinais.',
    ],
    focusItems: getFocusItems(focusTag, roadmapFocusItems),
    progressCriteria: getProgressCriteria(focusTag),
    estimate: `Estimativa inicial: ${String(firstPhaseHours)} horas, cerca de ${String(sessions)} sessões de ${String(input.sessionMinutes)} min. Treinando todo dia nesse ritmo, dá perto de ${String(weeksAtDailyPace)} semana${weeksAtDailyPace === 1 ? '' : 's'}.`,
    checkpoint: `Depois de ${String(checkpointHours)} horas, ou ${String(checkpointSessions)} sessões nesse tempo, fazemos um teste curto e ajustamos o plano.`,
    caveat:
      'Isso não é promessa de rating. É uma janela de treino para medir se os sinais melhoraram e se o plano precisa mudar.',
    reviewPrompt:
      'O que acha? Você pode aprovar o plano ou pedir revisão dizendo se quer mais exercícios, mais partidas, partidas de um tempo específico ou sessões mais longas.',
  };
}

function getEvidenceLevel(primaryWeakness: Weakness | undefined): string {
  if (primaryWeakness === undefined) {
    return 'Confiança: inicial. Ainda faltam sinais reais suficientes; o foco vem da faixa atual e será recalibrado com treino.';
  }

  if (primaryWeakness.confidence === 'high' && primaryWeakness.score >= 0.7) {
    return 'Confiança: forte para rotina. Há sinais consistentes o bastante para priorizar este tema, sem tratar isso como diagnóstico definitivo.';
  }

  if (primaryWeakness.confidence === 'medium' || primaryWeakness.score >= 0.5) {
    return 'Confiança: média. O tema aparece como hipótese prática; vamos confirmar pelo resultado dos próximos treinos.';
  }

  return 'Confiança: baixa. O tema serve como teste curto, não como conclusão sobre seu xadrez.';
}

function getIntro(weaknessCount: number): string {
  if (weaknessCount > 0) {
    return 'Olhei seus sinais de treino e montei um caminho para as próximas sessões com base no que dá para melhorar agora.';
  }

  return 'Ainda faltam dados reais suficientes, então montei um plano inicial seguro para começarmos e calibrarmos com os próximos treinos.';
}

function getFocusItems(focusTag: WeaknessTag, roadmapFocusItems: readonly string[]): string[] {
  const baseItems = focusItemsByWeakness[focusTag];
  const items = [...baseItems, ...roadmapFocusItems];

  return [...new Set(items)].slice(0, 5);
}

function getProgressCriteria(focusTag: WeaknessTag): string[] {
  const base = [
    'Concluir sessões suficientes para chegar ao checkpoint de 6h.',
    'Registrar feedback honesto: fácil, bom ou difícil.',
  ];
  const themeCriteria = progressCriteriaByWeakness[focusTag];

  return [...base, ...themeCriteria];
}

const focusItemsByWeakness = {
  'hanging-piece': ['Parar de deixar peça sem defesa.', 'Checar ameaça antes do primeiro lance.'],
  fork: ['Ver garfos com cavalo, bispo, peão e dama.', 'Preparar garfos alguns lances antes.', 'Repetir puzzles variados de garfo.'],
  pin: ['Reconhecer peça presa.', 'Usar cravada sem jogar no automático.'],
  skewer: ['Ver alinhamentos entre alvo maior e alvo menor.', 'Treinar ataques em linha.'],
  discovered: ['Perceber a linha que abre quando uma peça sai.', 'Treinar ataque descoberto e cheque descoberto.'],
  'mate-in-1': ['Encontrar mate direto sem pressa.', 'Falar a ameaça antes de clicar.'],
  'mate-in-2': ['Ver resposta forçada do adversário.', 'Treinar padrões curtos de mate.'],
  'back-rank': ['Reconhecer rei preso na última fileira.', 'Treinar pressão com torres e dama.'],
  'opening-principles': ['Desenvolver peças sem perder tempo.', 'Brigar pelo centro e cuidar do rei.'],
  'time-trouble': ['Reduzir decisões por impulso.', 'Treinar checagem curta antes de lances rápidos.'],
  'endgame-pawn': ['Ativar o rei.', 'Contar peões e casas-chave.'],
  'endgame-rook': ['Ativar a torre.', 'Treinar final de torre básico sem complicar.'],
  conversion: ['Transformar vantagem em plano simples.', 'Trocar peças quando isso reduz contra-jogo.'],
  'blunder-rate': ['Checar peças soltas.', 'Criar uma rotina anti-blunder antes de mover.'],
} satisfies Record<WeaknessTag, readonly string[]>;

const progressCriteriaByWeakness = {
  'hanging-piece': ['Reduzir erros em puzzles de peça pendurada.', 'Ver defensores antes de escolher lance candidato.'],
  fork: ['Acertar mais puzzles de garfo na primeira tentativa.', 'Explicar os dois alvos antes do lance.'],
  pin: ['Reconhecer a peça presa e o alvo atrás dela.', 'Errar menos puzzles do tema pin/cravada.'],
  skewer: ['Identificar a linha inteira antes de calcular.', 'Errar menos puzzles de espeto e x-ray.'],
  discovered: ['Nomear a peça que sai e a linha que abre.', 'Acertar mais ataques descobertos sem pressa.'],
  'mate-in-1': ['Checar fugas, defesas e capturas do rei.', 'Acertar mates diretos sem clicar no automático.'],
  'mate-in-2': ['Ver a continuação depois da primeira ameaça.', 'Melhorar acerto em mate em 2 e temas de mate.'],
  'back-rank': ['Conferir casas de fuga do rei.', 'Errar menos temas de última fileira.'],
  'opening-principles': ['Sair da abertura com centro, desenvolvimento e rei seguro.', 'Revisar partidas terminadas sem decorar linhas.'],
  'time-trouble': ['Decidir uma checagem mínima antes de acelerar.', 'Diminuir feedback difícil causado por pressa.'],
  'endgame-pawn': ['Contar rei ativo, oposição e casa de promoção.', 'Reconstruir uma linha simples sem olhar.'],
  'endgame-rook': ['Priorizar atividade da torre.', 'Revisar finais de torre sem trocar plano a cada lance.'],
  conversion: ['Transformar vantagem em plano simples.', 'Explicar como reduzir contra-jogo antes de atacar.'],
  'blunder-rate': ['Fazer varredura anti-blunder antes de mover.', 'Reduzir erros em hangingPiece/defensiveMove.'],
} satisfies Record<WeaknessTag, readonly string[]>;

const weaknessTitleByTag = {
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
  'endgame-rook': 'finais de torre',
  conversion: 'conversão',
  'blunder-rate': 'segurança anti-blunder',
} satisfies Record<WeaknessTag, string>;
