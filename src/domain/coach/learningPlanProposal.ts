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
    focusItems: getFocusItems(focusTag, roadmapFocusItems),
    estimate: `Estimativa inicial: ${String(firstPhaseHours)} horas, cerca de ${String(sessions)} sessões de ${String(input.sessionMinutes)} min. Treinando todo dia nesse ritmo, dá perto de ${String(weeksAtDailyPace)} semana${weeksAtDailyPace === 1 ? '' : 's'}.`,
    checkpoint: `Depois de ${String(checkpointHours)} horas, ou ${String(checkpointSessions)} sessões nesse tempo, fazemos um teste curto e ajustamos o plano.`,
    caveat:
      'Isso não é promessa de rating. É uma janela de treino para medir se os sinais melhoraram e se o plano precisa mudar.',
    reviewPrompt:
      'O que acha? Você pode aprovar o plano ou pedir revisão dizendo se quer mais exercícios, mais partidas, partidas de um tempo específico ou sessões mais longas.',
  };
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
