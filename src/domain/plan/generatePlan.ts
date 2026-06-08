import { getCoachNote } from '../coach/coachCatalog';
import { getDestinationForWeakness } from '../sources/destinations';
import type {
  DailyPlan,
  LearnerProfile,
  PlanBlock,
  PlanBlockFeedback,
  PlanResourceStage,
  SessionMinutes,
  Weakness,
  WeaknessTag,
  WeeklyFocus,
} from '../types';
import { getTimeBudget, type PlanBlockKind } from './timeBudget';

type BlockCopy = {
  title: string;
  task: string;
  stopRule: string;
  reason: string;
  weaknessTag: WeaknessTag;
};

type GeneratePlanOptions = {
  previousPlan?: DailyPlan;
  sessionNumber?: number;
};

type LatestThemeSignal = {
  feedback: PlanBlockFeedback;
  resourceStage?: PlanResourceStage;
};

const primaryThemeByBand = {
  '0-800': 'hanging-piece',
  '800-1200': 'fork',
} satisfies Record<LearnerProfile['band'], WeaknessTag>;

export function generatePlan(
  profile: LearnerProfile,
  weaknesses: Weakness[],
  sessionMinutes: SessionMinutes,
  date: string,
  options: GeneratePlanOptions = {},
): DailyPlan {
  const primaryWeakness = selectPrimaryWeakness(profile, weaknesses);
  const updatedAt = toPlanTimestamp(date);
  const sessionNumber = options.sessionNumber ?? 1;
  const latestThemeSignal = getLatestThemeSignalForWeakness(options.previousPlan, primaryWeakness.tag);
  const weeklyFocus = createWeeklyFocus(date, primaryWeakness);
  const blocks = getTimeBudget(sessionMinutes).map((budgetBlock, index) =>
    inheritPreviousProgress(
      createPlanBlock({
        date,
        index,
        sessionNumber,
        kind: budgetBlock.kind,
        minutes: budgetBlock.minutes,
        primaryWeakness,
        latestThemeSignal,
        updatedAt,
      }),
      options.previousPlan,
    ),
  );

  return {
    date,
    sessionMinutes,
    weeklyFocus,
    blocks,
    generatedFromWeaknessesAt: updatedAt,
  };
}

function createPlanBlock(input: {
  date: string;
  index: number;
  sessionNumber: number;
  kind: PlanBlockKind;
  minutes: number;
  primaryWeakness: Weakness;
  latestThemeSignal: LatestThemeSignal | undefined;
  updatedAt: string;
}): PlanBlock {
  const resourceStage = getResourceStage(input.kind, input.latestThemeSignal);
  const copy = getBlockCopy(input.kind, input.primaryWeakness, resourceStage);
  const destination = getDestinationForWeakness(copy.weaknessTag, resourceStage);

  return {
    id: createPlanBlockId(input.date, input.sessionNumber, input.index, input.kind),
    sessionNumber: input.sessionNumber,
    title: copy.title,
    source: destination.source,
    destination,
    weaknessTag: copy.weaknessTag,
    resourceStage,
    estimatedMinutes: input.minutes,
    task: copy.task,
    stopRule: copy.stopRule,
    reason: copy.reason,
    coachNote: getCoachNote(input.kind),
    status: 'pending',
    updatedAt: input.updatedAt,
  };
}

function inheritPreviousProgress(block: PlanBlock, previousPlan: DailyPlan | undefined): PlanBlock {
  if (previousPlan === undefined) {
    return block;
  }

  const previous = previousPlan.blocks.find((candidate) => candidate.id === block.id);

  if (previous === undefined || previous.status === 'pending') {
    return block;
  }

  return {
    ...block,
    status: previous.status,
    feedback: previous.feedback,
    updatedAt: previous.updatedAt,
  };
}

function createPlanBlockId(date: string, sessionNumber: number, index: number, kind: PlanBlockKind): string {
  const sessionSegment = sessionNumber <= 1 ? '' : `-s${String(sessionNumber).padStart(2, '0')}`;

  return `${date}${sessionSegment}-${String(index + 1).padStart(2, '0')}-${kind}`;
}

function getBlockCopy(kind: PlanBlockKind, primaryWeakness: Weakness, resourceStage: PlanResourceStage): BlockCopy {
  const primaryTheme = primaryWeakness.tag;

  switch (kind) {
    case 'aquecimento':
      return {
        title: 'Aquecimento tático',
        task: 'Resolva puzzles simples e confirme se há peça solta antes do primeiro lance candidato.',
        stopRule: 'Pare ao fechar o tempo do bloco, mesmo se houver uma sequência boa em andamento.',
        reason: 'Aquecimento mantém segurança de peças presente mesmo quando o foco do dia é outro.',
        weaknessTag: 'blunder-rate',
      };
    case 'tema':
      return {
        title: `Tema do dia: ${weaknessTitleByTag[primaryTheme]}`,
        task: getThemeTask(primaryTheme, resourceStage),
        stopRule: 'Pare quando o tempo acabar ou quando errar duas vezes seguidas por pressa.',
        reason: primaryWeakness.evidence,
        weaknessTag: primaryTheme,
      };
    case 'revisao':
      return {
        title: 'Revisão curta',
        task: `Revise ${weaknessTitleByTag[primaryTheme]} em um treino curto e explique mentalmente qual padrão decidiu a posição.`,
        stopRule: 'Pare depois de uma posição bem entendida.',
        reason: 'Revisão consolida o tema do dia sem cair em uma análise genérica.',
        weaknessTag: primaryTheme,
      };
    case 'transferencia':
      return {
        title: 'Transferência para partida',
        task: `Resolva uma rodada menos guiada de ${weaknessTitleByTag[primaryTheme]} e procure o padrão antes de calcular lances candidatos.`,
        stopRule: 'Pare ao encontrar uma posição em que você consiga explicar o plano em uma frase.',
        reason: 'Transferência evita que o tema fique preso ao formato de puzzle.',
        weaknessTag: primaryTheme,
      };
    case 'final':
      return {
        title: 'Final básico',
        task: 'Treine finais simples e conte material, rei ativo e promoção antes de calcular.',
        stopRule: 'Pare no fim do tempo ou após uma linha que você consiga reconstruir sem olhar.',
        reason: 'Finais curtos consolidam precisão sem depender de engine no app.',
        weaknessTag: 'endgame-pawn',
      };
  }
}

function getResourceStage(kind: PlanBlockKind, latestThemeSignal: LatestThemeSignal | undefined): PlanResourceStage {
  switch (kind) {
    case 'aquecimento':
      return 'retrieval';
    case 'tema':
      return getThemeResourceStage(latestThemeSignal);
    case 'revisao':
      return 'review';
    case 'transferencia':
      return 'transfer';
    case 'final':
      return 'guided';
  }
}

function getThemeResourceStage(latestThemeSignal: LatestThemeSignal | undefined): PlanResourceStage {
  switch (latestThemeSignal?.feedback) {
    case 'hard':
      return 'explain';
    case 'good':
      return getNextGoodResourceStage(latestThemeSignal.resourceStage);
    case 'easy':
      return 'retrieval';
    case undefined:
      return 'guided';
  }
}

function getNextGoodResourceStage(previousStage: PlanResourceStage | undefined): PlanResourceStage {
  switch (previousStage) {
    case 'explain':
      return 'guided';
    case 'guided':
    case 'retrieval':
    case 'transfer':
    case 'review':
      return 'retrieval';
    case undefined:
      return 'guided';
  }
}

function getLatestThemeSignalForWeakness(plan: DailyPlan | undefined, tag: WeaknessTag): LatestThemeSignal | undefined {
  if (plan === undefined) {
    return undefined;
  }

  const block = plan.blocks
    .slice()
    .reverse()
    .find((candidate) => candidate.weaknessTag === tag && candidate.feedback !== undefined);

  if (block?.feedback === undefined) {
    return undefined;
  }

  return {
    feedback: block.feedback,
    resourceStage: block.resourceStage,
  };
}

function createWeeklyFocus(date: string, primaryWeakness: Weakness): WeeklyFocus {
  return {
    tag: primaryWeakness.tag,
    title: weaknessTitleByTag[primaryWeakness.tag],
    reason: primaryWeakness.evidence,
    startsOn: getWeekStartDate(date),
  };
}

function getWeekStartDate(date: string): string {
  const parsed = new Date(`${date.slice(0, 10)}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime())) {
    return date.slice(0, 10);
  }

  const day = parsed.getUTCDay() === 0 ? 7 : parsed.getUTCDay();
  parsed.setUTCDate(parsed.getUTCDate() - day + 1);

  return parsed.toISOString().slice(0, 10);
}

function selectPrimaryWeakness(profile: LearnerProfile, weaknesses: Weakness[]): Weakness {
  const [firstWeakness] = [...weaknesses].sort((left, right) => right.score - left.score);

  if (firstWeakness !== undefined) {
    return firstWeakness;
  }

  const fallbackTag = primaryThemeByBand[profile.band];

  return {
    tag: fallbackTag,
    score: 0,
    confidence: 'low',
    evidence: 'Tema conservador da faixa atual enquanto ainda faltam sinais suficientes do histórico real.',
  };
}

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
  'endgame-rook': 'finais de torres',
  conversion: 'conversão',
  'blunder-rate': 'segurança anti-blunder',
} satisfies Record<WeaknessTag, string>;

function getThemeTask(tag: WeaknessTag, stage: PlanResourceStage): string {
  if (stage === 'retrieval') {
    return `Resolva puzzles de ${weaknessTitleByTag[tag]} e confirme a ideia antes do primeiro lance.`;
  }

  if (stage === 'explain') {
    return `Revise uma explicação curta de ${weaknessTitleByTag[tag]} e anote uma regra para testar no treino.`;
  }

  switch (tag) {
    case 'fork':
      return 'Estude a lição guiada de garfo e procure dois alvos antes de confirmar o lance.';
    case 'hanging-piece':
      return 'Treine puzzles de peça pendurada e confirme quem defende cada alvo.';
    case 'mate-in-1':
    case 'mate-in-2':
    case 'back-rank':
      return 'Estude o bloco guiado de mates curtos e fale a ameaça antes de clicar no primeiro lance.';
    case 'opening-principles':
      return 'Assista uma aula curta de abertura e anote uma regra para testar na próxima partida: centro, desenvolvimento ou rei seguro.';
    case 'time-trouble':
      return 'Revise uma partida terminada e marque onde o relógio passou a mandar na decisão.';
    case 'endgame-pawn':
    case 'endgame-rook':
      return 'Estude a lição guiada de final simples e conte plano, oposição ou atividade antes de calcular.';
    case 'conversion':
      return 'Revise uma posição ganha já terminada e explique como transformar vantagem em ponto.';
    case 'blunder-rate':
      return 'Treine puzzles de segurança de peças e faça uma checagem curta antes de cada lance.';
    case 'pin':
    case 'skewer':
    case 'discovered':
      return 'Estude a lição guiada do padrão tático e confirme a peça-alvo antes de escolher o lance.';
  }
}

function toPlanTimestamp(date: string): string {
  return date.includes('T') ? date : `${date}T00:00:00.000Z`;
}
