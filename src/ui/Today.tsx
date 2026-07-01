import { ExternalLink } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  buildLearningPlanProposal,
  buildDayCompletionSummary,
  buildNextStepExplanations,
  buildPuzzleThemeStats,
  buildReturnRecalibrationNote,
  buildSessionMilestoneSummary,
  computeConsistency,
  elapsedSecondsBetween,
  getAchievementDefinition,
  getPlanSessionSummaries,
  getPlanTotalMinutes,
  type Achievement,
  type DailyPlan,
  type LearnerBand,
  type ErrorType,
  type PlanBlock,
  type PlanBlockFeedback,
  type SessionMinutes,
  type TrainingLog,
  type TrainingRoadmapItem,
  type TutorQuestionAnswer,
  type Weakness,
} from '../domain';
import { computeRecentActivity } from '../domain/metrics/recentActivity';
import { buildMilestoneLine, buildFactualFooter } from '../domain/coach/retentionCopy';
import {
  findDiplomaSectionForTheme,
  SECTION_MIN_ATTEMPTS,
} from '../domain/method/diplomas';
import { buildSkillMap } from '../domain/metrics/progressOverview';
import { getMethodTrackTitle } from '../domain/method/methodTracks';
import type { PendingTrainingItem } from '../domain/method/types';
import type { BackupMeta } from '../app/backupStatus';
import type { LichessConnectionState } from '../app/state';
import { isDueToday } from '../domain/method/pendingItems';
import { Fold } from './Fold';
import { BlockCarousel } from './BlockCarousel';
import { LearningPlanProposalCard } from './LearningPlanProposalCard';
import { PendingReviewCard } from './PendingReviewCard';
import { PlanBlockCard } from './PlanBlockCard';
import { TodayHero } from './TodayHero';
import { TutorCard } from './TutorCard';
import {
  formatFriendlyDate,
  getActiveTrackId,
  getBackupReminder,
  playTimerBeep,
  themeFromTrainingUrl,
} from './todayHelpers';
import { DayCompletionCard, RoadmapList } from './TodayParts';
import { CalibrationInvite } from './CalibrationInvite';
import { TodayDayStatus } from './TodayDayStatus';

type TodayProps = {
  plan: DailyPlan | undefined;
  roadmap: TrainingRoadmapItem[];
  sessionMinutes: SessionMinutes;
  learnerBand: LearnerBand | undefined;
  trainingLogs: TrainingLog[];
  allTrainingLogs: TrainingLog[];
  pendingItems: PendingTrainingItem[];
  achievements: Achievement[];
  weaknesses: Weakness[];
  lichessConnectionState: LichessConnectionState;
  backupMeta?: BackupMeta;
  onSessionMinutesChange: (minutes: SessionMinutes) => Promise<void>;
  onCreateNextSession: (minutes: SessionMinutes) => Promise<void>;
  onAnswerTutorQuestion: (answer: TutorQuestionAnswer) => Promise<void>;
  onImportFreeActivity: () => Promise<void>;
  onReconcileLichessResults: () => Promise<void>;
  onApproveLearningPlan: () => Promise<void>;
  onRequestLearningPlanRevision: (note: string) => Promise<void>;
  onOpenPendingItem: (item: PendingTrainingItem) => Promise<void>;
  onDeferPendingItem: (item: PendingTrainingItem) => Promise<void>;
  onSavePendingFromHardFeedback: (blockId: string) => Promise<void>;
  onStartBlockTraining: (block: PlanBlock) => Promise<void>;
  onCompleteBlockTraining: (blockId: string, feedback?: PlanBlockFeedback, errorType?: ErrorType, selfExplanation?: string) => Promise<void>;
  onSkipBlockTraining: (blockId: string) => Promise<void>;
  // PROD-3: convite não-bloqueante para calibrar (usuário sem contas e sem calibração).
  showCalibrationInvite?: boolean;
  onStartCalibration?: () => void;
};

const sessionOptions = [5, 15, 30, 60] satisfies SessionMinutes[];

export function Today({
  plan,
  roadmap,
  sessionMinutes,
  learnerBand,
  trainingLogs,
  allTrainingLogs,
  pendingItems,
  achievements,
  weaknesses,
  lichessConnectionState,
  backupMeta,
  onSessionMinutesChange,
  onCreateNextSession,
  onImportFreeActivity,
  onApproveLearningPlan,
  onRequestLearningPlanRevision,
  onOpenPendingItem,
  onDeferPendingItem,
  onSavePendingFromHardFeedback,
  onStartBlockTraining,
  onCompleteBlockTraining,
  onSkipBlockTraining,
  onAnswerTutorQuestion,
  onReconcileLichessResults,
  showCalibrationInvite = false,
  onStartCalibration,
}: TodayProps) {
  const [nowIso, setNowIso] = useState(() => new Date().toISOString());
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const alertedLogs = useRef<Set<string>>(new Set());
  const hasActiveTraining = trainingLogs.some((log) => log.status === 'active');

  useEffect(() => {
    if (!hasActiveTraining) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNowIso(new Date().toISOString());
    }, 1_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [hasActiveTraining]);

  useEffect(() => {
    for (const log of trainingLogs) {
      if (log.status !== 'active' || alertedLogs.current.has(log.id)) {
        continue;
      }

      if (elapsedSecondsBetween(log.startedAt, nowIso) >= log.plannedSeconds) {
        alertedLogs.current.add(log.id);
        playTimerBeep();
      }
    }
  }, [nowIso, trainingLogs]);

  if (plan === undefined) {
    return (
      <section aria-labelledby="today-title" className="panel empty-state-panel">
        <img
          src="/art/vazio-sem-dados.webp"
          alt=""
          aria-hidden="true"
          className="empty-state-art"
          width={160}
          height={160}
        />
        <h1 id="today-title">Hoje</h1>
        <p>Sem plano para hoje. Posso montar um agora com base no seu perfil.</p>
        <button
          type="button"
          onClick={() => {
            setIsCreatingPlan(true);
            void onCreateNextSession(sessionMinutes).finally(() => {
              setIsCreatingPlan(false);
            });
          }}
          disabled={isCreatingPlan}
        >
          {isCreatingPlan ? 'Montando seu plano…' : 'Montar meu plano de hoje'}
        </button>
      </section>
    );
  }

  const sessionSummaries = getPlanSessionSummaries(plan);
  const totalPlannedMinutes = getPlanTotalMinutes(plan);
  const consistency = computeConsistency(allTrainingLogs, plan.date);
  const recentActivity = computeRecentActivity(allTrainingLogs, plan.date, 14);
  const milestoneLine = buildMilestoneLine(consistency);
  const factualFooter = buildFactualFooter({
    todayMinutes: recentActivity.todayMinutes,
    weekSessions: recentActivity.weekSessions,
  });
  // Conquistas desbloqueadas hoje entram como linhas sóbrias no relatório do
  // dia (spec de badges: sem modal, sem confete).
  const achievementsUnlockedToday = achievements.filter(
    (achievement) => achievement.unlockedAt.slice(0, 10) === plan.date,
  );
  const baseDayCompletionSummary = buildDayCompletionSummary({ plan, trainingLogs, roadmap });
  const dayCompletionSummary =
    baseDayCompletionSummary === undefined
      ? undefined
      : {
          ...baseDayCompletionSummary,
          lines: [
            ...baseDayCompletionSummary.lines,
            ...buildNextStepExplanations(plan, buildPuzzleThemeStats(trainingLogs)),
            ...achievementsUnlockedToday.map(
              (achievement) => getAchievementDefinition(achievement.id).reportLine,
            ),
            // Marca de recorde de sequência — linha sóbria, 1x por estado, sem modal.
            ...(milestoneLine !== undefined ? [milestoneLine] : []),
          ],
        };
  // Hero "Agora": o bloco ativo (treinando) ou o primeiro pendente. Uma ação
  // clara visível no topo — o app decide, o aluno só executa.
  const allBlocksOrdered = sessionSummaries.flatMap((session) => session.blocks);
  const activeBlock = allBlocksOrdered.find(
    (block) =>
      block.status === 'pending' &&
      trainingLogs.some((log) => log.blockId === block.id && log.status === 'active'),
  );
  const heroBlock = activeBlock ?? allBlocksOrdered.find((block) => block.status === 'pending');
  const isDayComplete = heroBlock === undefined;
  const doneBlockCount = allBlocksOrdered.filter((block) => block.status === 'done').length;
  const minutesTrainedToday = Math.round(
    trainingLogs
      .filter((log) => log.status === 'done')
      .reduce((total, log) => total + (log.elapsedSeconds ?? 0), 0) / 60,
  );
  const returnNote = buildReturnRecalibrationNote(consistency.daysSinceLastSession);
  const sessionMilestoneSummary = buildSessionMilestoneSummary({ logs: allTrainingLogs, sessionMinutes });
  const activeTrackId = getActiveTrackId(plan);
  // PROD-5: progresso do tema do bloco rumo ao diploma (números visíveis no treino).
  const skillMap = buildSkillMap(allTrainingLogs);
  const diplomaChipForBlock = (
    block: PlanBlock,
  ): { label: string; attempts: number; target: number } | undefined => {
    const theme = themeFromTrainingUrl(block.destination.url);
    if (theme === undefined) {
      return undefined;
    }

    const found = findDiplomaSectionForTheme(theme);
    if (found === undefined) {
      return undefined;
    }

    const attempts = (found.section.lichessThemes ?? []).reduce(
      (sum, sectionTheme) => sum + (skillMap.find((entry) => entry.theme === sectionTheme)?.attempts ?? 0),
      0,
    );

    return { label: found.section.title, attempts, target: SECTION_MIN_ATTEMPTS };
  };
  const learningPlanProposal = buildLearningPlanProposal({
    plan,
    roadmap,
    sessionMinutes,
    weaknesses,
  });
  const planApproved = plan.learningPlanResponse?.status === 'approved';
  const backupReminder = getBackupReminder(backupMeta, plan.date, allTrainingLogs.length > 0);

  // TodayHero: valores JÁ computados, derivados sem regra de negócio nova.
  // dueItems = fila de revisão que venceu hoje (mesma semântica do PendingReviewCard).
  const dueItems = pendingItems.filter((item) => isDueToday(item));
  // O chip do herói já tem o cabeçalho "Marco"; remove o prefixo redundante
  // do label do marco (ex.: "Marco 6h" -> "6h") para não exibir "Marco Marco 6h".
  const checkpointLabel = sessionMilestoneSummary.currentMilestone.label.replace(/^marco\s*/i, '');
  const remainingSessions = Math.max(
    0,
    sessionMilestoneSummary.currentMilestone.targetSessions -
      sessionMilestoneSummary.currentMilestone.completedSessions,
  );
  // "Trocar o foco de hoje": revela o carrossel existente (modo foco + "Ver lista").
  const focusCarouselId = 'foco-do-dia';
  const revealFocusCarousel = (): void => {
    if (typeof document === 'undefined') {
      return;
    }
    document
      .getElementById(focusCarouselId)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section aria-labelledby="today-title" className="panel today-panel">
      <div className="today-columns">
      <div className="today-main">
      <div className="section-heading">
        <div>
          <h1 id="today-title">Hoje</h1>
          <p>
            {formatFriendlyDate(plan.date)} - {sessionSummaries.length}{' '}
            {sessionSummaries.length === 1 ? 'sessão' : 'sessões'} - {totalPlannedMinutes} min
          </p>
          {plan.weeklyFocus !== undefined ? (
            // O porquê do foco já chega pelo TodayHero e pelo próprio bloco.
            <p className="weekly-focus">Foco da semana: {plan.weeklyFocus.title}</p>
          ) : null}
        </div>
      </div>

      <TodayHero
        heroBlock={heroBlock}
        doneBlockCount={doneBlockCount}
        totalBlocks={allBlocksOrdered.length}
        currentStreakDays={consistency.currentStreakDays}
        learnerBand={learnerBand}
        dueCount={dueItems.length}
        checkpointLabel={checkpointLabel}
        remainingSessions={remainingSessions}
        onStartBlockTraining={onStartBlockTraining}
        onChangeFocus={revealFocusCarousel}
      />

      <CalibrationInvite show={showCalibrationInvite} onStartCalibration={onStartCalibration} />

      <TodayDayStatus
        doneBlockCount={doneBlockCount}
        totalBlocks={allBlocksOrdered.length}
        minutesTrainedToday={minutesTrainedToday}
        recentDays={recentActivity.recentDays}
        factualFooter={factualFooter}
        chronicSupportSuggested={plan.chronicSupportSuggested === true}
        organizerCeiling={plan.organizerCeiling === true}
        routingEmphasis={plan.routingEmphasis}
        backupReminder={backupReminder}
      />

      {/* A ação (próximo passo / "treinando agora") — carrossel em modo foco,
          um bloco grande por vez. O TodayHero já abre a missão de agora acima;
          aqui fica o fluxo real de treino (timer/rating via PlanBlockCard). */}
      {allBlocksOrdered.length > 0 ? (
        <section
          id={focusCarouselId}
          className={`hero-now${isDayComplete ? ' plan-archived' : ''}`}
          aria-labelledby="hero-now-title"
        >
          <h2 id="hero-now-title" className="hero-now-label">
            {activeBlock !== undefined ? 'Treinando agora' : isDayComplete ? 'Plano do dia' : 'Próximo passo'}
          </h2>
          {/* Modo foco: um bloco grande por vez, arraste para o lado para ver os
              próximos passos. Começa no próximo pendente; com o dia completo, abre no último. */}
          <BlockCarousel
            blocks={allBlocksOrdered}
            ariaLabel="Plano do dia"
            initialIndex={Math.max(
              0,
              heroBlock === undefined
                ? allBlocksOrdered.length - 1
                : allBlocksOrdered.findIndex((block) => block.id === heroBlock.id),
            )}
            renderBlock={(block) => {
              const trainingLog = trainingLogs.find((log) => log.blockId === block.id);

              return (
                <PlanBlockCard
                  block={block}
                  nowIso={nowIso}
                  trainingLog={trainingLog}
                  hasSavedPending={pendingItems.some(
                    (item) => item.id === block.pendingItemId || item.sourceLogId === trainingLog?.id,
                  )}
                  onSavePendingFromHardFeedback={onSavePendingFromHardFeedback}
                  onStartBlockTraining={onStartBlockTraining}
                  onCompleteBlockTraining={onCompleteBlockTraining}
                  onSkipBlockTraining={onSkipBlockTraining}
                  diplomaProgress={diplomaChipForBlock(block)}
                  hideCoachNote={heroBlock !== undefined && block.id === heroBlock.id}
                />
              );
            }}
          />
        </section>
      ) : null}

      {/* O acompanhamento do Professor vem APÓS a ação (não compete com o herói
          action-first no topo): intro pré-sessão, Q&A pós-sessão (sinal manual de
          fraqueza) e "Conferir puzzles" (reconciliação Lichess). Realocado do topo
          para cá no redesign action-first — ver docs/design/spec-today-action-first.md. */}
      <TutorCard
        plan={plan}
        weaknesses={weaknesses}
        trainingLogs={trainingLogs}
        allTrainingLogs={allTrainingLogs}
        today={plan.date}
        onAnswerTutorQuestion={onAnswerTutorQuestion}
        onReconcileLichessResults={onReconcileLichessResults}
        suppressPreSessionMessage
      />

      {isDayComplete ? (
        <section className="hero-now day-complete-moment" aria-labelledby="hero-done-title">
          <h2 id="hero-done-title" className="hero-now-label">
            Dia completo
          </h2>
          <DayCompletionCard summary={dayCompletionSummary} />
          <div className="button-row">
            <button
              type="button"
              aria-label="Fazer próxima sessão"
              disabled={hasActiveTraining}
              onClick={() => {
                void onCreateNextSession(sessionMinutes);
              }}
            >
              Fazer próxima sessão ({sessionMinutes} min)
            </button>
          </div>
        </section>
      ) : null}

      {returnNote !== undefined ? (
        <p className="return-note" aria-live="polite">
          {returnNote}
        </p>
      ) : null}

      {/* Depois da ação (hero no topo), o professor explica o plano ("Entendi o
          que você precisa") e cobra o que ficou aberto. Aprovado, o plano sai
          daqui e vira uma dobra no fim (abaixo). */}
      {!planApproved ? (
        <LearningPlanProposalCard
          proposal={learningPlanProposal}
          response={plan.learningPlanResponse}
          activeTrackId={activeTrackId}
          onApprovePlan={onApproveLearningPlan}
          onRequestPlanRevision={onRequestLearningPlanRevision}
        />
      ) : null}

      <PendingReviewCard
        pendingItems={pendingItems}
        onOpenItem={(item) => {
          void onOpenPendingItem(item);
        }}
        onDeferItem={(item) => {
          void onDeferPendingItem(item);
        }}
      />

      {/* Plano num lugar só: o resumo da fase aprovada (chips + números) no topo
          e, abaixo, a lista de blocos do dia. O hero já mostra o próximo passo;
          aqui fica o panorama, dobrado. Antes eram duas dobras ("Plano do dia" e
          "Plano de hoje") que pareciam a mesma coisa. */}
      {planApproved || allBlocksOrdered.some((block) => block.id !== heroBlock?.id) ? (
        <Fold
          concept="plano"
          title="Plano"
          meta={`${String(doneBlockCount)}/${String(allBlocksOrdered.length)} blocos`}
        >
          {planApproved ? (
            <LearningPlanProposalCard
              proposal={learningPlanProposal}
              response={plan.learningPlanResponse}
              activeTrackId={activeTrackId}
              onApprovePlan={onApproveLearningPlan}
              onRequestPlanRevision={onRequestLearningPlanRevision}
              compact
            />
          ) : null}
          {/* A lista de blocos virou o carrossel (modo foco) acima; aqui resta só
              a trilha do método. "Ver lista completa" fica dentro do carrossel. */}
          {activeTrackId !== undefined ? (
            <p className="active-track-line">Trilha: {getMethodTrackTitle(activeTrackId)}</p>
          ) : null}
        </Fold>
      ) : null}

      {/* "O que vem agora" = a próxima sessão (ação) + o roadmap dos próximos
          passos, num lugar só. Antes eram duas dobras ("Próxima sessão" e
          "Próximos passos") com nomes que se confundiam. */}
      <Fold
        concept="sessao"
        title="O que vem agora"
        {...(roadmap.length > 0 ? { meta: `${String(roadmap.length)} passos` } : {})}
      >
        <div className="session-actions">
          <label className="compact-field">
            <span>Tempo</span>
            <select
              value={sessionMinutes}
              onChange={(event) => {
                void onSessionMinutesChange(Number(event.target.value) as SessionMinutes);
              }}
            >
              {sessionOptions.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} min
                </option>
              ))}
            </select>
          </label>
          {!isDayComplete ? (
            <button
              type="button"
              className="secondary-button"
              disabled={hasActiveTraining}
              onClick={() => {
                void onCreateNextSession(sessionMinutes);
              }}
            >
              Fazer próxima sessão
            </button>
          ) : null}
          <button
            type="button"
            className="secondary-button"
            disabled={lichessConnectionState === 'syncing'}
            onClick={() => {
              void onImportFreeActivity();
            }}
          >
            <ExternalLink aria-hidden="true" size={16} />
            Importar atividade livre
          </button>
        </div>
        {roadmap.length > 0 ? (
          <div className="next-roadmap">
            <RoadmapList items={roadmap} />
          </div>
        ) : null}
      </Fold>
      </div>
      </div>
    </section>
  );
}
