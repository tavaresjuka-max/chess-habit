import { getCoachNote } from '../coach/coachCatalog';
import { assertNever } from '../assertNever';
import { weaknessTagFromPuzzleTheme } from '../coach/puzzleThemeStats';
import { getRecentlyEarnedDiploma } from '../method/diplomas';
import { getMethodTrackTitle } from '../method/methodTracks';
import { isDueToday } from '../method/pendingItems';
import { selectMethodTrack } from '../method/selectMethodTrack';
import type { DiplomaAttempt, MethodTrackId, PendingTrainingItem } from '../method/types';
import { getDestinationForWeakness } from '../sources/destinations';
import { findLichessResourceByUrl } from '../sources/resourceCatalog';
import type {
  DailyPlan,
  LearnerBand,
  LearnerProfile,
  PlanBlock,
  PlanBlockFeedback,
  PlanResourceStage,
  PuzzleThemeStats,
  SessionMinutes,
  Weakness,
  WeaknessTag,
  WeeklyFocus,
} from '../types';
import { getTimeBudget, type PlanBlockKind } from './timeBudget';
import { weaknessTitleByTag } from '../weakness/weaknessTitles';

type BlockCopy = {
  title: string;
  task: string;
  stopRule: string;
  reason: string;
  weaknessTag: WeaknessTag;
};

export type GeneratePlanOptions = {
  previousPlan?: DailyPlan;
  sessionNumber?: number;
  recentThemeStats?: PuzzleThemeStats;
  completedResourceIds?: readonly string[];
  openedBlockIds?: readonly string[];
  openPendingItems?: readonly PendingTrainingItem[];
  weakThemesFromDashboard?: readonly string[];
  // Decisão 3: conquistar um diploma há pouco promove à trilha progress-diplomas.
  // generatePlan calcula a recência a partir das tentativas + a data do plano.
  diplomaAttempts?: readonly DiplomaAttempt[];
};

type LatestThemeSignal = {
  feedback?: PlanBlockFeedback;
  resourceStage?: PlanResourceStage;
  source: 'feedback' | 'prior-guided';
};

// Tema padrao por banda quando nao ha sinal real. Bandas acima de 1200 usam
// padroes provisorios ate o curriculo denso do Corte 8.
const primaryThemeByBand = {
  '0-400': 'hanging-piece',
  '400-800': 'hanging-piece',
  '800-1000': 'fork',
  '1000-1200': 'fork',
  '1200-1600': 'mate-in-2',
  '1600-2000': 'conversion',
  '2000-2200': 'conversion',
} satisfies Record<LearnerProfile['band'], WeaknessTag>;

type FinalWeaknessTag = 'endgame-pawn' | 'endgame-rook' | 'conversion';

export function generatePlan(
  profile: LearnerProfile,
  weaknesses: Weakness[],
  sessionMinutes: SessionMinutes,
  date: string,
  options: GeneratePlanOptions = {},
): DailyPlan {
  const primaryWeakness = selectPrimaryWeakness(profile, weaknesses, options.recentThemeStats);
  const secondaryWeakness = selectSecondaryWeakness(weaknesses, primaryWeakness);
  const updatedAt = toPlanTimestamp(date);
  const sessionNumber = options.sessionNumber ?? 1;
  const latestThemeSignal = getLatestThemeSignalForWeakness(
    options.previousPlan,
    primaryWeakness.tag,
    date,
    sessionNumber,
    options.openedBlockIds,
  );
  // Fallback persistido (PED-3): sem sinal do plano anterior, retoma o estágio
  // alcançado por tema em vez de cair sempre no 'guided'.
  const persistedThemeStage = profile.themeStages?.[primaryWeakness.tag];
  const completedResourceIds = getCompletedResourceIds(options.previousPlan, options.completedResourceIds);
  const weeklyFocus = createWeeklyFocus(date, primaryWeakness);
  const learningPlanResponse =
    options.previousPlan?.date === date ? options.previousPlan.learningPlanResponse : undefined;
  const duePendingItems = (options.openPendingItems ?? []).filter((item) => isDueToday(item));
  const activeTrack = selectMethodTrack({
    openPendingItems: [...(options.openPendingItems ?? [])],
    primaryWeakness: primaryWeakness.tag,
    weakThemes: [...(options.weakThemesFromDashboard ?? [])],
    recentlyEarnedDiploma:
      options.diplomaAttempts !== undefined &&
      getRecentlyEarnedDiploma([...options.diplomaAttempts], date) !== undefined,
  });
  const reviewRatio = getReviewRatioForPendingCount(duePendingItems.length);
  const budget = applyAdaptiveReviewRatio(getTimeBudget(sessionMinutes), reviewRatio, duePendingItems.length > 0);
  const blocks = budget.map((budgetBlock, index) =>
    inheritPreviousProgress(
      duePendingItems.length > 0 && index === 0
        ? createPendingPlanBlock({
            date,
            index,
            sessionNumber,
            minutes: budgetBlock.minutes,
            pendingItem: duePendingItems[0],
            updatedAt,
          })
        : createPlanBlock({
            profile,
            date,
            index,
            sessionNumber,
            kind: budgetBlock.kind,
            minutes: budgetBlock.minutes,
            primaryWeakness,
            secondaryWeakness,
            latestThemeSignal,
            persistedThemeStage,
            recentThemeStats: options.recentThemeStats,
            completedResourceIds,
            updatedAt,
            activeTrack,
          }),
      options.previousPlan,
    ),
  );

  return {
    date,
    sessionMinutes,
    weeklyFocus,
    ...(learningPlanResponse === undefined ? {} : { learningPlanResponse }),
    blocks,
    generatedFromWeaknessesAt: updatedAt,
  };
}

function createPlanBlock(input: {
  profile: LearnerProfile;
  date: string;
  index: number;
  sessionNumber: number;
  kind: PlanBlockKind;
  minutes: number;
  primaryWeakness: Weakness;
  secondaryWeakness?: Weakness;
  latestThemeSignal: LatestThemeSignal | undefined;
  persistedThemeStage?: PlanResourceStage;
  recentThemeStats?: PuzzleThemeStats;
  completedResourceIds: readonly string[];
  updatedAt: string;
  activeTrack: MethodTrackId;
}): PlanBlock {
  const resourceStage = getResourceStage(input.kind, input.latestThemeSignal, input.persistedThemeStage);
  const copy = getBlockCopy(
    input.kind,
    input.primaryWeakness,
    resourceStage,
    input.profile.band,
    input.secondaryWeakness,
  );
  const destination = getDestinationForWeakness(copy.weaknessTag, resourceStage, {
    learnerBand: input.profile.band,
    blockMinutes: input.minutes,
    recentThemeStats: input.recentThemeStats,
    completedResourceIds: input.completedResourceIds,
  });

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
    coachNote: getCoachNote(input.kind, {
      weaknessTag: copy.weaknessTag,
      resourceStage,
    }),
    status: 'pending',
    methodTrackId: input.activeTrack,
    guidingQuestion: getGuidingQuestion(input.activeTrack),
    updatedAt: input.updatedAt,
  };
}

function createPendingPlanBlock(input: {
  date: string;
  index: number;
  sessionNumber: number;
  minutes: number;
  pendingItem: PendingTrainingItem | undefined;
  updatedAt: string;
}): PlanBlock {
  if (input.pendingItem === undefined) {
    throw new Error('Cannot create a pending review block without a pending item.');
  }

  const destination = {
    source: 'lichess' as const,
    label: input.pendingItem.lichessTheme
      ? `Pendência Lichess: ${input.pendingItem.lichessTheme}`
      : 'Pendência Lichess',
    ...(input.pendingItem.lichessUrl === undefined ? {} : { url: input.pendingItem.lichessUrl }),
  };

  return {
    id: createPlanBlockId(input.date, input.sessionNumber, input.index, 'revisao'),
    sessionNumber: input.sessionNumber,
    title: input.pendingItem.title,
    source: destination.source,
    destination,
    weaknessTag: input.pendingItem.weaknessTag,
    resourceStage: 'review',
    estimatedMinutes: input.minutes,
    task: input.pendingItem.prompt,
    stopRule: 'Pare depois de reentender o erro e registrar se ficou fácil, bom ou difícil.',
    reason: `Pendência vencida da trilha ${getMethodTrackTitle(input.pendingItem.methodTrackId)}.`,
    // Sem repetir a lede do card de pendências — aqui a dica é de execução.
    coachNote: 'Refaça com calma: o objetivo é entender o lance, não acertar rápido.',
    status: 'pending',
    pendingItemId: input.pendingItem.id,
    methodTrackId: 'pending-review',
    masteryTarget: 'review',
    drillFormatId: 'pendency-treatment',
    guidingQuestion: input.pendingItem.prompt,
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

  return previous;
}

function createPlanBlockId(date: string, sessionNumber: number, index: number, kind: PlanBlockKind): string {
  const sessionSegment = sessionNumber <= 1 ? '' : `-s${String(sessionNumber).padStart(2, '0')}`;

  return `${date}${sessionSegment}-${String(index + 1).padStart(2, '0')}-${kind}`;
}

export function getReviewRatioForPendingCount(pendencyCount: number): number {
  return pendencyCount > 0 ? Math.min(0.7, 0.4 + pendencyCount * 0.05) : 0.3;
}

function applyAdaptiveReviewRatio(
  budget: ReturnType<typeof getTimeBudget>,
  reviewRatio: number,
  hasDuePendingItems: boolean,
): ReturnType<typeof getTimeBudget> {
  if (!hasDuePendingItems) {
    return budget;
  }

  const totalMinutes = budget.reduce((sum, block) => sum + block.minutes, 0);
  const targetReviewMinutes = totalMinutes * reviewRatio;
  let reviewMinutes = budget
    .filter((block, index) => index === 0 || block.kind === 'revisao')
    .reduce((sum, block) => sum + block.minutes, 0);

  return budget.map((block, index) => {
    if (index === 0 || reviewMinutes >= targetReviewMinutes || block.kind === 'aquecimento') {
      return block;
    }

    if (block.kind === 'transferencia' || block.kind === 'final') {
      reviewMinutes += block.minutes;
      return { ...block, kind: 'revisao' };
    }

    return block;
  });
}

function getGuidingQuestion(trackId: MethodTrackId): string {
  const questions: Record<MethodTrackId, string> = {
    'pending-review': 'Qual sinal do tabuleiro você ignorou?',
    'calculation-bridge': 'Quais são meus 2 candidatos?',
    'active-defense': 'O que o oponente ameaça?',
    'opening-as-plan': 'Essa jogada desenvolve peças e protege o rei?',
    'progress-diplomas': 'Você confia nessa decisão?',
  };

  return questions[trackId];
}

function getBlockCopy(
  kind: PlanBlockKind,
  primaryWeakness: Weakness,
  resourceStage: PlanResourceStage,
  band: LearnerBand,
  secondaryWeakness?: Weakness,
): BlockCopy {
  // O bloco de transferência treina a fraqueza secundária quando existe uma real
  // e distinta da primária (decisão 1 do dono): reduz monotonia e ataca uma
  // segunda frente. Os demais blocos seguem a fraqueza primária.
  const themeWeakness =
    kind === 'transferencia' && secondaryWeakness !== undefined ? secondaryWeakness : primaryWeakness;
  const primaryTheme = themeWeakness.tag;

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
      return getFinalBlockCopy(getFinalThemeByBand(band));
    default:
      return assertNever(kind);
  }
}

function getFinalThemeByBand(band: LearnerBand): FinalWeaknessTag {
  switch (band) {
    case '0-400':
    case '400-800':
      return 'endgame-pawn';
    case '800-1000':
    case '1000-1200':
      return 'endgame-rook';
    case '1200-1600':
    case '1600-2000':
    case '2000-2200':
      return 'conversion';
  }
}

function getFinalBlockCopy(theme: FinalWeaknessTag): BlockCopy {
  switch (theme) {
    case 'endgame-pawn':
      return {
        title: 'Final de peões',
        task: 'Treine finais de peões e conte material, rei ativo e promoção antes de calcular.',
        stopRule: 'Pare no fim do tempo ou após uma linha que você consiga reconstruir sem olhar.',
        reason: 'Finais de peões consolidam oposição, regra do quadrado e precisão sem engine no app.',
        weaknessTag: theme,
      };
    case 'endgame-rook':
      return {
        title: 'Final de torre',
        task: 'Treine finais de torre e procure atividade, rei ativo e peões passados antes de calcular.',
        stopRule: 'Pare no fim do tempo ou após uma linha que você consiga reconstruir sem olhar.',
        reason: 'Finais de torre aparecem cedo em partidas reais e exigem plano simples antes de variantes.',
        weaknessTag: theme,
      };
    case 'conversion':
      return {
        title: 'Conversão de vantagem',
        task: 'Treine converter vantagem: simplifique quando fizer sentido, ative peças e corte contra-jogo.',
        stopRule: 'Pare no fim do tempo ou após uma linha que você consiga explicar em uma frase.',
        reason: 'Converter vantagem fecha o treino: transformar acerto tático em ponto prático.',
        weaknessTag: theme,
      };
    default:
      return assertNever(theme);
  }
}

function getResourceStage(
  kind: PlanBlockKind,
  latestThemeSignal: LatestThemeSignal | undefined,
  fallbackStage?: PlanResourceStage,
): PlanResourceStage {
  switch (kind) {
    case 'aquecimento':
      return 'retrieval';
    case 'tema':
      return getThemeResourceStage(latestThemeSignal, fallbackStage);
    case 'revisao':
      return 'review';
    case 'transferencia':
      return 'transfer';
    case 'final':
      return 'guided';
    default:
      return assertNever(kind);
  }
}

// Progressão de dificuldade do tema, do mais apoiado ao mais autônomo.
const THEME_STAGE_ORDER: readonly PlanResourceStage[] = ['explain', 'guided', 'retrieval', 'transfer'];

/**
 * Avança UM estágio a partir do anterior, sem ultrapassar o teto. Sem estágio
 * anterior registrado, fica em 'guided' (não dá para avançar do que não se sabe).
 * Exportada para teste de regressão (council 2026-06-19, M2).
 */
export function advanceThemeStage(previous: PlanResourceStage | undefined, cap: PlanResourceStage): PlanResourceStage {
  if (previous === undefined) {
    return 'guided';
  }

  const rawStart = THEME_STAGE_ORDER.indexOf(previous);
  const start = rawStart < 0 ? THEME_STAGE_ORDER.indexOf('guided') : rawStart;
  const capIndex = THEME_STAGE_ORDER.indexOf(cap);
  const nextIndex = Math.min(start + 1, capIndex);
  return THEME_STAGE_ORDER[nextIndex] ?? 'guided';
}

function getThemeResourceStage(
  latestThemeSignal: LatestThemeSignal | undefined,
  fallbackStage: PlanResourceStage = 'guided',
): PlanResourceStage {
  if (latestThemeSignal?.source === 'prior-guided') {
    return 'retrieval';
  }

  switch (latestThemeSignal?.feedback) {
    case 'hard':
      // 'difícil' pede mais suporte, não mais desafio: recua para explicação.
      return 'explain';
    case 'good':
      // Avança um estágio sem pular consolidação; teto em 'retrieval'.
      return advanceThemeStage(latestThemeSignal.resourceStage, 'retrieval');
    case 'easy':
      // 'fácil' avança um estágio (não pula direto para 'retrieval') e pode chegar a 'transfer'.
      return advanceThemeStage(latestThemeSignal.resourceStage, 'transfer');
    case undefined:
      // Sem sinal recente: retoma o estágio persistido do tema (PED-3); 'guided' por padrão.
      return fallbackStage;
  }
}

function getLatestThemeSignalForWeakness(
  plan: DailyPlan | undefined,
  tag: WeaknessTag,
  currentDate: string,
  currentSessionNumber: number,
  openedBlockIds: readonly string[] = [],
): LatestThemeSignal | undefined {
  if (plan === undefined) {
    return undefined;
  }

  const openedBlockIdSet = new Set(openedBlockIds);
  const themeBlocks = plan.blocks.filter((candidate) => candidate.weaknessTag === tag);
  const block = themeBlocks
    .slice()
    .reverse()
    .find((candidate) => candidate.feedback !== undefined);

  if (block?.feedback === undefined) {
    const priorBlocks = themeBlocks.filter((candidate) => {
      return isBeforeCurrentSession(candidate, currentDate, currentSessionNumber);
    });
    const priorGuidedBlock = priorBlocks
      .slice()
      .reverse()
      .find((candidate) => candidate.resourceStage === 'guided');
    const openedGuidedBlock = themeBlocks
      .slice()
      .reverse()
      .find((candidate) => {
        return (
          candidate.resourceStage === 'guided' &&
          openedBlockIdSet.has(candidate.id) &&
          isAtOrBeforeCurrentSession(candidate, currentDate, currentSessionNumber)
        );
      });
    const guidedBlock = priorGuidedBlock ?? openedGuidedBlock;

    if (guidedBlock === undefined) {
      return undefined;
    }

    return {
      resourceStage: guidedBlock.resourceStage,
      source: 'prior-guided',
    };
  }

  return {
    feedback: block.feedback,
    resourceStage: block.resourceStage,
    source: 'feedback',
  };
}

function isBeforeCurrentSession(block: PlanBlock, currentDate: string, currentSessionNumber: number): boolean {
  const blockDate = block.id.slice(0, 10);
  const blockSessionNumber = block.sessionNumber ?? 1;

  if (blockDate < currentDate) {
    return true;
  }

  return blockDate === currentDate && blockSessionNumber < currentSessionNumber;
}

function isAtOrBeforeCurrentSession(block: PlanBlock, currentDate: string, currentSessionNumber: number): boolean {
  const blockDate = block.id.slice(0, 10);
  const blockSessionNumber = block.sessionNumber ?? 1;

  if (blockDate < currentDate) {
    return true;
  }

  return blockDate === currentDate && blockSessionNumber <= currentSessionNumber;
}

function getCompletedResourceIds(
  previousPlan: DailyPlan | undefined,
  providedResourceIds: readonly string[] | undefined,
): string[] {
  const completedResourceIds = new Set(providedResourceIds ?? []);

  for (const block of previousPlan?.blocks ?? []) {
    if (block.status !== 'done' || block.destination.url === undefined) {
      continue;
    }

    const resource = findLichessResourceByUrl(block.destination.url);

    if (resource === undefined) {
      continue;
    }

    completedResourceIds.add(resource.id);

    if (block.destination.label.includes('Replay') && resource.id.startsWith('puzzle:')) {
      completedResourceIds.add(`puzzle-replay:${resource.id.slice('puzzle:'.length)}`);
    }
  }

  return [...completedResourceIds].sort();
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

function selectSecondaryWeakness(weaknesses: Weakness[], primary: Weakness): Weakness | undefined {
  return [...weaknesses]
    .sort((left, right) => right.score - left.score)
    .find((weakness) => weakness.tag !== primary.tag);
}

function selectPrimaryWeakness(
  profile: LearnerProfile,
  weaknesses: Weakness[],
  recentThemeStats?: PuzzleThemeStats,
): Weakness {
  const [firstWeakness] = [...weaknesses].sort((left, right) => right.score - left.score);

  if (firstWeakness !== undefined) {
    return firstWeakness;
  }

  // Ponte puzzle→fraqueza: sem sinal de partida, a fraqueza real dos puzzles
  // conferidos no Lichess vence o tema genérico da banda. Os temas já chegam
  // ordenados por mais erros (buildPuzzleThemeStats), então o primeiro mapeável
  // é o mais fraco. Sinais de partida continuam tendo prioridade (acima).
  for (const theme of recentThemeStats?.themes ?? []) {
    if (theme.losses <= 0) {
      continue;
    }

    const tag = weaknessTagFromPuzzleTheme(theme.theme);

    if (tag !== undefined) {
      return {
        tag,
        score: 0,
        confidence: 'low',
        evidence: `Sinal dos puzzles conferidos no Lichess: ${weaknessTitleByTag[tag]} concentrou ${String(theme.losses)} erro(s) recente(s).`,
      };
    }
  }

  const fallbackTag = primaryThemeByBand[profile.band];

  return {
    tag: fallbackTag,
    score: 0,
    confidence: 'low',
    evidence: 'Tema conservador da faixa atual enquanto ainda faltam sinais suficientes do histórico real.',
  };
}

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
      return 'Treine uma sequência curta no Puzzle Streak e pare para checar antes de cada lance impulsivo.';
    case 'endgame-pawn':
    case 'endgame-rook':
      return 'Estude a lição guiada de final simples e conte plano, oposição ou atividade antes de calcular.';
    case 'conversion':
      return 'Treine posições de vantagem e explique como simplificar, ativar peças ou remover contra-jogo.';
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
