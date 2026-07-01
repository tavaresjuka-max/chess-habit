import { getCoachNote } from '../coach/coachCatalog';
import { assertNever } from '../assertNever';
import { buildInterleavePool, shouldForceRotation, weaknessTagFromPuzzleTheme } from '../coach/puzzleThemeStats';
import { computeMastery } from '../method/mastery';
import { isOrganizerCeilingBand } from '../bands';
import { getRecentlyEarnedDiploma } from '../method/diplomas';
import { getErrorRoutingCoach, getErrorRoutingEmphasis, type ErrorRoutingCoach } from '../method/errorRouting';
import { getConceptContract } from '../pedagogy/conceptContracts';
import { INTERLEAVE_STAGES } from './schedulerConstants';
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
  TrainingLog,
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
  // Fase 1 (2026-06-24): logs recentes para derivar errorType predominante via
  // errorRouting. Opcional — sem dado, fallback para comportamento atual.
  recentTrainingLogs?: readonly TrainingLog[];
};

type LatestThemeSignal = {
  feedback?: PlanBlockFeedback;
  resourceStage?: PlanResourceStage;
  source: 'feedback' | 'prior-guided' | 'feedback-expired';
};

// DD-Ped6 (2026-06-23): feedback explícito com mais de 14 dias deixa de FORÇAR o
// estágio; a acurácia recente volta a gatear. Council (DeepSeek) alertou que um
// corte seco vira "penhasco motivacional" para o aprendiz TDAH que some por uns
// dias — por isso a expiração NUNCA regride abaixo do estágio já alcançado
// (ver masteryAwareFallback). Limiar inclusivo: exatamente 14 dias ainda vale.
const FEEDBACK_EXPIRY_DAYS = 14;

// Council (GLM 5.2, 2026-06-23): a acurácia só pode PROMOVER o estágio sobre uma
// amostra robusta — avançar com 3 puzzles a ≥80% "fabrica progresso sobre ruído"
// (variância empurra a acurácia pra cima por acaso e o floor trava o avanço pra
// sempre). Alinhado ao padrão de graduação do projeto (SECTION_MIN_ATTEMPTS=30).
// Regredir/segurar em amostra fina continua permitido (direção segura).
const MIN_ATTEMPTS_FOR_STAGE_ADVANCE = 30;

// R2b (council 2026-06-23): kill-switch da detecção de suporte crônico. Lógica
// nova de baixo risco (só-leitura, não altera plano/estágio) — desligável.
const CHRONIC_SUPPORT_DETECTION_ENABLED: boolean = true;

// Detecta o "penhasco de incompetência": o aluno está num estágio AVANÇADO
// (retrieval/transfer) SEGURADO pelo floor (feedback expirado, sem feedback novo)
// mas a acurácia real caiu de forma sustentada (regress) com amostra robusta (≥30).
// Só-leitura: NÃO toca profile.themeStages nem a composição do plano — apenas
// sinaliza para uma oferta sóbria de "reforçar a base" (decisão de UI, fase 2).
function detectChronicSupportNeed(input: {
  latestThemeSignal: LatestThemeSignal | undefined;
  persistedThemeStage: PlanResourceStage | undefined;
  recentThemeStats: PuzzleThemeStats | undefined;
  tag: WeaknessTag;
}): boolean {
  if (!CHRONIC_SUPPORT_DETECTION_ENABLED) return false;
  // Só relevante em estágio avançado (pouco andaime); em explain/guided o aluno
  // já recebe apoio.
  if (input.persistedThemeStage !== 'retrieval' && input.persistedThemeStage !== 'transfer') return false;
  // Feedback explícito recente vence — não inferir crônico se o aluno acabou de
  // dar sinal (DD-Ped1). Só agimos quando o estágio está SEGURADO sem feedback.
  if (input.latestThemeSignal?.feedback !== undefined) return false;
  const stat = input.recentThemeStats?.themes.find((s) => weaknessTagFromPuzzleTheme(s.theme) === input.tag);
  if (stat === undefined || stat.attempts < MIN_ATTEMPTS_FOR_STAGE_ADVANCE) return false;
  const accuracyPercent =
    stat.accuracy !== undefined ? stat.accuracy : ((stat.attempts - stat.losses) / stat.attempts) * 100;
  return computeMastery({ accuracyPercent, recentFeedbacks: [], minVolumeReached: true }) === 'regress';
}

function isFeedbackExpired(blockDate: string, currentDate: string): boolean {
  const ageDays = (Date.parse(currentDate) - Date.parse(blockDate)) / 86_400_000;
  return ageDays > FEEDBACK_EXPIRY_DAYS;
}

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
  '2200-2400': 'conversion',
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
  // DD-Ped1: acurácia real refina o fallback SÓ quando não há feedback explícito
  // recente. Feedback vence acurácia. Mínimo 3 tentativas (DD-Ped4).
  // C1: weaknessTagFromPuzzleTheme já importado — sem mapeamento reverso necessário.
  // C4: computeMastery direto, sem masteryTargetFromCompletedLog.
  const masteryAwareFallback: PlanResourceStage = (() => {
    if (latestThemeSignal?.feedback !== undefined) return persistedThemeStage ?? 'guided';
    const primaryStat = options.recentThemeStats?.themes.find(
      (s) => weaknessTagFromPuzzleTheme(s.theme) === primaryWeakness.tag,
    );
    if (primaryStat === undefined || primaryStat.attempts < 3) return persistedThemeStage ?? 'guided';
    // C3: accuracy nativo do Lichess se disponível; fallback para (attempts-losses)/attempts.
    const accuracyPercent =
      primaryStat.accuracy !== undefined
        ? primaryStat.accuracy
        : ((primaryStat.attempts - primaryStat.losses) / primaryStat.attempts) * 100;
    const mastery = computeMastery({ accuracyPercent, recentFeedbacks: [], minVolumeReached: true });
    // Avanço exige amostra robusta (anti-ratchet do council): abaixo do mínimo,
    // a acurácia não promove — segura no estágio persistido.
    if (mastery === 'advance' && primaryStat.attempts >= MIN_ATTEMPTS_FOR_STAGE_ADVANCE) {
      return advanceThemeStage(persistedThemeStage, 'transfer');
    }
    if (mastery === 'regress') {
      // DD-Ped6 + council: feedback EXPIRADO nunca regride abaixo do estágio já
      // alcançado (evita penhasco motivacional ao voltar de uma pausa). Sem
      // feedback algum (nunca houve), mantém o rebaixamento padrão para 'guided'.
      return latestThemeSignal?.source === 'feedback-expired'
        ? persistedThemeStage ?? latestThemeSignal.resourceStage ?? 'guided'
        : 'guided';
    }
    return persistedThemeStage ?? 'guided';
  })();
  // D1/D3 (scheduler híbrido): pool de intercalação só existe quando o tema
  // primário já saiu da aquisição (estágio em retrieval/transfer). Em aquisição
  // (explain/guided) o pool fica vazio → revisao/transferencia seguem o primário.
  const primaryThemeStage = getResourceStage('tema', latestThemeSignal, masteryAwareFallback);
  const interleavePool = INTERLEAVE_STAGES.includes(primaryThemeStage)
    ? buildInterleavePool(profile, primaryWeakness.tag)
    : [];
  // D4: teto anti-trava — sinaliza que o tema primário deve rotar (consumo do
  // sinal e incremento de sessionsOnPrimaryTheme ficam na camada de estado).
  const primaryThemeForced = shouldForceRotation(profile.sessionsOnPrimaryTheme ?? 0);
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
  // Fase 1 (1c, 2026-06-24): sinal de errorType predominante nos logs recentes.
  // ADITIVO puro — só ajusta coachNote/guidingQuestion do bloco tema; NÃO toca
  // estágio (masteryAwareFallback), track (selectMethodTrack), floor
  // (FEEDBACK_EXPIRY_DAYS) nem M-Retenção. Sem dado → undefined → copy usual.
  const errorEmphasis = getErrorRoutingEmphasis([...(options.recentTrainingLogs ?? [])]);
  const errorCoach = getErrorRoutingCoach(errorEmphasis);
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
            interleavePool,
            latestThemeSignal,
            persistedThemeStage: masteryAwareFallback,
            recentThemeStats: options.recentThemeStats,
            completedResourceIds,
            updatedAt,
            activeTrack,
            errorCoach,
          }),
      options.previousPlan,
    ),
  );

  // R2b: detecção só-leitura do penhasco de incompetência (estágio avançado
  // segurado pelo floor + acurácia caída sustentada). Não altera os blocos acima.
  const chronicSupportSuggested = detectChronicSupportNeed({
    latestThemeSignal,
    persistedThemeStage: masteryAwareFallback,
    recentThemeStats: options.recentThemeStats,
    tag: primaryWeakness.tag,
  });

  return {
    date,
    sessionMinutes,
    weeklyFocus,
    ...(learningPlanResponse === undefined ? {} : { learningPlanResponse }),
    blocks,
    generatedFromWeaknessesAt: updatedAt,
    ...(primaryThemeForced ? { primaryThemeForced: true } : {}),
    ...(chronicSupportSuggested ? { chronicSupportSuggested: true } : {}),
    // Teto explícito (council 2026-06-24): banda FM 2200-2400 = organizador, não tier novo.
    ...(isOrganizerCeilingBand(profile.band) ? { organizerCeiling: true } : {}),
    // A1' transparência: expõe a ênfase de erro SÓ quando há um bloco-tema que
    // recebeu o coaching aditivo (createPlanBlock só anexa a dica em kind='tema').
    // Caça-bugs council 2026-06-24: sem essa guarda, uma sessão sem bloco-tema (ex.:
    // 5 min com item de revisão pendente no índice 0) mostraria a nota "foco de hoje"
    // sem nenhum bloco entregar o foco — promessa sem coaching.
    ...(errorEmphasis !== 'default' && blocks.some((b) => b.id.endsWith('-tema'))
      ? { routingEmphasis: errorEmphasis }
      : {}),
  };
}

// Extrai o estágio alcançado por tema dos blocos de tema do plano (id terminando
// em '-tema'), para persistir em profile.themeStages (PED-3). Bloco mais recente
// vence — em planos com várias sessões, a última sessão reflete o estágio atual.
export function extractThemeStages(plan: DailyPlan): Partial<Record<WeaknessTag, PlanResourceStage>> {
  const stages: Partial<Record<WeaknessTag, PlanResourceStage>> = {};

  for (const block of plan.blocks) {
    if (block.id.endsWith('-tema') && block.weaknessTag !== undefined && block.resourceStage !== undefined) {
      stages[block.weaknessTag] = block.resourceStage;
    }
  }

  return stages;
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
  interleavePool: WeaknessTag[];
  latestThemeSignal: LatestThemeSignal | undefined;
  persistedThemeStage?: PlanResourceStage;
  recentThemeStats?: PuzzleThemeStats;
  completedResourceIds: readonly string[];
  updatedAt: string;
  activeTrack: MethodTrackId;
  // Fase 1 (1c): copy pedagógica derivada do errorType predominante. Aplica-se
  // SÓ ao bloco tema; undefined mantém a copy usual do gerador.
  errorCoach?: ErrorRoutingCoach;
}): PlanBlock {
  const resourceStage = getResourceStage(input.kind, input.latestThemeSignal, input.persistedThemeStage);
  // D2: na pós-aquisição (pool não-vazio), a revisão puxa um tema do pool
  // (recuperação espaçada) e a transferência vira detecção sem rótulo. Aquecimento
  // e tema permanecem âncora.
  // Revisão puxa o 1º tema do pool; transferência (detecção sem rótulo) puxa o 2º
  // quando existe, senão o 1º — garante prática de tema intercalado também em
  // sessões sem bloco de revisão (30/60 min têm transferência, não revisão).
  const interleaveTag =
    input.interleavePool.length === 0
      ? undefined
      : input.kind === 'revisao'
        ? input.interleavePool[0]
        : input.kind === 'transferencia'
          ? (input.interleavePool[1] ?? input.interleavePool[0])
          : undefined;
  const isDiscrimination = input.kind === 'transferencia' && input.interleavePool.length > 0;
  const copy = getBlockCopy(
    input.kind,
    input.primaryWeakness,
    resourceStage,
    input.profile.band,
    input.secondaryWeakness,
    interleaveTag,
  );
  const destination = getDestinationForWeakness(copy.weaknessTag, resourceStage, {
    learnerBand: input.profile.band,
    blockMinutes: input.minutes,
    recentThemeStats: input.recentThemeStats,
    completedResourceIds: input.completedResourceIds,
  });

  // Fase 1 (1c) + auditoria council 2026-06-24: o bloco tema GANHA a dica de erro
  // quando há sinal predominante, mas de forma ADITIVA — anexa ao coachNote base do
  // tema em vez de SUBSTITUIR. A ênfase é global (não por-tema), então substituir
  // arriscava orientar a habilidade errada num tema que não gerou o erro; anexar
  // preserva a orientação correta do tema e só acrescenta o lembrete do modo de erro.
  const themeErrorCoach = input.kind === 'tema' ? input.errorCoach : undefined;
  const baseCoachNote = getCoachNote(input.kind, {
    weaknessTag: copy.weaknessTag,
    resourceStage,
  });
  const blindMetadata = getBlindAttemptMetadata(resourceStage, destination.url);
  const conceptContract = getConceptContract(copy.weaknessTag);

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
    coachNote:
      themeErrorCoach !== undefined ? `${baseCoachNote} ${themeErrorCoach.coachNote}` : baseCoachNote,
    status: 'pending',
    methodTrackId: input.activeTrack,
    guidingQuestion:
      themeErrorCoach?.guidingQuestion ?? getGuidingQuestion(input.activeTrack, copy.weaknessTag),
    conceptContractId: conceptContract.id,
    ...blindMetadata,
    ...(isDiscrimination ? { isDiscrimination: true } : {}),
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
  const conceptContract = getConceptContract(input.pendingItem.weaknessTag);
  const blindMetadata = getBlindAttemptMetadata('review', destination.url);

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
    conceptContractId: conceptContract.id,
    ...blindMetadata,
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

const THEME_GUIDING_QUESTIONS: Partial<Record<WeaknessTag, string>> = {
  pin: 'Qual peça está cravada e qual valor fica atrás dela?',
  skewer: 'Qual peça valiosa está na frente e o que fica exposto quando ela foge?',
  'back-rank': 'O rei está preso na última fileira? Qual peça dá o xeque decisivo?',
  'mate-in-1': 'Qual o lance que dá xeque-mate agora?',
  'endgame-pawn': 'Qual peão avança e o rei adversário chega a tempo de pará-lo?',
  'endgame-rook': 'Como ativar seu rei e qual peão adversário vai cair?',
  'time-trouble': 'Antes de tocar: qual peça está pendurada e qual é a ameaça?',
};

function getGuidingQuestion(trackId: MethodTrackId, themeTag?: WeaknessTag): string {
  const themeQuestion = themeTag === undefined ? undefined : THEME_GUIDING_QUESTIONS[themeTag];

  if (themeQuestion !== undefined) {
    return themeQuestion;
  }

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
  interleaveTag?: WeaknessTag,
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
    case 'revisao': {
      // D2: na pós-aquisição, a revisão intercala um tema já graduado (recuperação
      // espaçada). Em aquisição (interleaveTag undefined), revisa o tema do dia.
      const reviewTag = interleaveTag ?? primaryTheme;
      return {
        title: 'Revisão curta',
        task: `Revise ${weaknessTitleByTag[reviewTag]} em um treino curto e explique mentalmente qual padrão decidiu a posição.`,
        stopRule: 'Pare depois de uma posição bem entendida.',
        reason: 'Revisão consolida temas já vistos sem cair em uma análise genérica.',
        weaknessTag: reviewTag,
      };
    }
    case 'transferencia': {
      // D2: na pós-aquisição, a transferência vira detecção de um tema já visto
      // (interleaveTag), sem rótulo. Em aquisição, segue a fraqueza secundária/primária.
      const transferTag = interleaveTag ?? primaryTheme;
      return {
        title: 'Transferência para partida',
        task: `Resolva uma rodada menos guiada de ${weaknessTitleByTag[transferTag]} e procure o padrão antes de calcular lances candidatos.`,
        stopRule: 'Pare ao encontrar uma posição em que você consiga explicar o plano em uma frase.',
        reason: 'Transferência evita que o tema fique preso ao formato de puzzle.',
        weaknessTag: transferTag,
      };
    }
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
    case '2200-2400':
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

function getBlindAttemptMetadata(
  resourceStage: PlanResourceStage,
  destinationUrl: string | undefined,
): Pick<PlanBlock, 'isBlindAttempt' | 'hintWasVisible' | 'platformThemeLeakRisk'> {
  const isBlindStage = resourceStage === 'retrieval' || resourceStage === 'review' || resourceStage === 'transfer';
  const platformThemeLeakRisk = isBlindStage && isThemeSpecificLichessDestination(destinationUrl);

  return {
    isBlindAttempt: isBlindStage && !platformThemeLeakRisk,
    hintWasVisible: !isBlindStage,
    platformThemeLeakRisk,
  };
}

function isThemeSpecificLichessDestination(url: string | undefined): boolean {
  if (url === undefined) {
    return false;
  }

  try {
    const parsed = new URL(url);

    return parsed.hostname === 'lichess.org' && /^\/training\/[A-Za-z0-9]+$/.test(parsed.pathname);
  } catch {
    return /^https:\/\/lichess\.org\/training\/[A-Za-z0-9]+$/.test(url);
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
      // 'difícil' = zona certa de aprendizado; guided oferece dicas sem re-explicar do zero.
      return 'guided';
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

  // DD-Ped6: feedback com mais de 14 dias não força mais o estágio — devolve só o
  // estágio alcançado (sem o campo feedback) para a acurácia recente voltar a gatear.
  if (isFeedbackExpired(block.id.slice(0, 10), currentDate)) {
    return {
      resourceStage: block.resourceStage,
      source: 'feedback-expired',
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
