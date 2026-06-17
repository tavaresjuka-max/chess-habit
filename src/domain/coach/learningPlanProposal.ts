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
    // O fluxo do método em uma linha — detalhe vive nos methodSteps.
    methodSummary: 'Sinal → foco → treino → registro → ajuste.',
    evidenceLevel: getEvidenceLevel(input.weaknesses[0]),
    methodSteps: [
      'Diagnóstico: sinais viram hipóteses.',
      'Treino: conceito novo, depois puzzles variados.',
      'Transferência: revisão até o sinal melhorar.',
    ],
    focusItems: getFocusItems(focusTag, roadmapFocusItems),
    progressCriteria: getProgressCriteria(focusTag),
    estimate: `≈${String(firstPhaseHours)}h · ${String(sessions)} sessões de ${String(input.sessionMinutes)} min · ~${String(weeksAtDailyPace)} semana${weeksAtDailyPace === 1 ? '' : 's'}`,
    checkpoint: `Checkpoint: ${String(checkpointHours)}h · ${String(checkpointSessions)} sessões — teste curto, plano ajustado.`,
    caveat:
      'Isso não é promessa de rating. É uma janela de treino para medir se os sinais melhoraram e se o plano precisa mudar.',
    reviewPrompt:
      'O que acha? Você pode aprovar o plano ou pedir revisão dizendo se quer mais exercícios, mais partidas, partidas de um tempo específico ou sessões mais longas.',
    estimateHours: firstPhaseHours,
    estimateSessions: sessions,
    estimateMinutes: input.sessionMinutes,
    estimateWeeks: weeksAtDailyPace,
    checkpointHours,
    checkpointSessions,
  };
}

function getEvidenceLevel(primaryWeakness: Weakness | undefined): string {
  if (primaryWeakness === undefined) {
    return 'Confiança: inicial. Ainda faltam sinais reais suficientes; o foco vem da faixa atual e será recalibrado com treino.';
  }

  switch (primaryWeakness.confidence) {
    case 'high':
      if (primaryWeakness.score >= 0.7) {
        return 'Confiança: forte para rotina. Há sinais consistentes o bastante para priorizar este tema, sem tratar isso como diagnóstico definitivo.';
      }

      return 'Confiança: média. O tema aparece como hipótese prática; vamos confirmar pelo resultado dos próximos treinos.';
    case 'medium':
      return 'Confiança: média. O tema aparece como hipótese prática; vamos confirmar pelo resultado dos próximos treinos.';
    case 'low':
      if (primaryWeakness.score >= 0.5) {
        return 'Confiança: média. O tema aparece como hipótese prática; vamos confirmar pelo resultado dos próximos treinos.';
      }

      return 'Confiança: baixa. O tema serve como teste curto, não como conclusão sobre seu xadrez.';
  }
}

function getIntro(weaknessCount: number): string {
  if (weaknessCount > 0) {
    return 'Olhei seus sinais — este é o caminho.';
  }

  return 'Poucos dados ainda: plano inicial seguro, calibramos treinando.';
}

function getFocusItems(focusTag: WeaknessTag, roadmapFocusItems: readonly string[]): string[] {
  const baseItems = focusItemsByWeakness[focusTag];
  const items = [...baseItems, ...roadmapFocusItems];

  return [...new Set(items)].slice(0, 5);
}

function getProgressCriteria(focusTag: WeaknessTag): string[] {
  const base = ['Chegar ao checkpoint de 6h.', 'Registrar: fácil / bom / difícil.'];
  const themeCriteria = progressCriteriaByWeakness[focusTag];

  return [...base, ...themeCriteria];
}

// Itens curtos: viram chips na UI — 3 a 6 palavras cada.
const focusItemsByWeakness = {
  'hanging-piece': ['Não deixar peça solta.', 'Checar antes de mover.'],
  fork: ['Garfos: cavalo, bispo, peão, dama.', 'Preparar garfos com antecedência.', 'Puzzles variados de garfo.'],
  pin: ['Reconhecer peça presa.', 'Usar cravadas com intenção.'],
  skewer: ['Ver alinhamentos de espeto.', 'Treinar ataques em linha.'],
  discovered: ['Ver a linha que abre.', 'Ataque e xeque descoberto.'],
  'mate-in-1': ['Achar mate sem pressa.', 'Falar a ameaça antes de clicar.'],
  'mate-in-2': ['Ver a resposta forçada.', 'Padrões curtos de mate.'],
  'back-rank': ['Reconhecer rei preso.', 'Pressão com torre e dama.'],
  'opening-principles': ['Desenvolver sem perder tempo.', 'Centro + rei seguro.'],
  'time-trouble': ['Menos decisões por impulso.', 'Checagem curta antes de acelerar.'],
  'endgame-pawn': ['Ativar o rei.', 'Contar peões e casas-chave.'],
  'endgame-rook': ['Ativar a torre.', 'Final básico, sem complicar.'],
  conversion: ['Vantagem vira plano simples.', 'Trocar peças, reduzir contra-jogo.'],
  'blunder-rate': ['Checar peças soltas.', 'Rotina anti-blunder antes de mover.'],
} satisfies Record<WeaknessTag, readonly string[]>;

const progressCriteriaByWeakness = {
  'hanging-piece': ['Menos erros de peça solta.', 'Ver defensores antes do lance.'],
  fork: ['Mais garfos certos na 1ª tentativa.', 'Nomear os dois alvos antes do lance.'],
  pin: ['Ver a peça presa e o alvo atrás.', 'Menos erros de cravada.'],
  skewer: ['Ver a linha inteira antes de calcular.', 'Menos erros de espeto.'],
  discovered: ['Nomear peça que sai e linha que abre.', 'Mais ataques descobertos certos.'],
  'mate-in-1': ['Checar fugas e defesas do rei.', 'Mate direto sem clicar no automático.'],
  'mate-in-2': ['Ver a continuação após a 1ª ameaça.', 'Melhora em mate em 2.'],
  'back-rank': ['Conferir casas de fuga.', 'Menos erros de última fileira.'],
  'opening-principles': ['Centro + desenvolvimento + rei seguro.', 'Revisar partidas sem decorar linhas.'],
  'time-trouble': ['Checagem mínima antes de acelerar.', 'Menos "difícil" por pressa.'],
  'endgame-pawn': ['Rei ativo, oposição, promoção.', 'Reconstruir a linha sem olhar.'],
  'endgame-rook': ['Torre ativa primeiro.', 'Manter o plano no final.'],
  conversion: ['Vantagem vira plano simples.', 'Explicar como reduzir contra-jogo.'],
  'blunder-rate': ['Varredura anti-blunder antes de mover.', 'Menos erros de peça solta e defesa.'],
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
