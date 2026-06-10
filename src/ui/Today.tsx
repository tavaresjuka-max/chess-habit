import { Check, ExternalLink, RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { openExternalUrl } from '../app/externalOpen';
import {
  buildLearningPlanProposal,
  buildDayCompletionSummary,
  buildNextStepExplanations,
  buildPuzzleThemeStats,
  buildReturnRecalibrationNote,
  buildSessionMilestoneSummary,
  buildWeeklyDigest,
  computeConsistency,
  elapsedSecondsBetween,
  formatElapsedMinutes,
  getPlanSessionSummaries,
  getPlanTotalMinutes,
  type DailyPlan,
  type DayCompletionSummary,
  type LichessStudyLink,
  type PlanBlock,
  type PlanBlockFeedback,
  type SessionMinutes,
  type TrainingLog,
  type TrainingRoadmapItem,
  type TutorQuestionAnswer,
  type Weakness,
} from '../domain';
import { DIPLOMAS, getDiplomaProgress } from '../domain/method/diplomas';
import { getMethodTrackTitle } from '../domain/method/methodTracks';
import type { DiplomaAttempt, MethodTrackId, PendingTrainingItem } from '../domain/method/types';
import type { DiagnosisState, LichessConnectionState } from '../app/state';
import { LearningPlanProposalCard } from './LearningPlanProposalCard';
import { PendingReviewCard } from './PendingReviewCard';
import { SessionMilestonesCard, type NextDiplomaSummary } from './SessionMilestonesCard';
import { TutorCard } from './TutorCard';

type TodayProps = {
  plan: DailyPlan | undefined;
  roadmap: TrainingRoadmapItem[];
  sessionMinutes: SessionMinutes;
  trainingLogs: TrainingLog[];
  allTrainingLogs: TrainingLog[];
  pendingItems: PendingTrainingItem[];
  diplomaAttempts: DiplomaAttempt[];
  weaknesses: Weakness[];
  diagnosisState: DiagnosisState;
  diagnosisMessage: string | undefined;
  lichessConnectionState: LichessConnectionState;
  lichessMessage: string | undefined;
  lichessStudyLink: LichessStudyLink | undefined;
  onSessionMinutesChange: (minutes: SessionMinutes) => Promise<void>;
  onCreateNextSession: (minutes: SessionMinutes) => Promise<void>;
  onAnswerTutorQuestion: (answer: TutorQuestionAnswer) => Promise<void>;
  onSyncChesscomDiagnosis: () => Promise<void>;
  onSyncLichessDiagnosis: () => Promise<void>;
  onReconcileLichessResults: () => Promise<void>;
  onCreateLichessStudy: () => Promise<void>;
  onApproveLearningPlan: () => Promise<void>;
  onRequestLearningPlanRevision: (note: string) => Promise<void>;
  onOpenPendingItem: (item: PendingTrainingItem) => Promise<void>;
  onDeferPendingItem: (item: PendingTrainingItem) => Promise<void>;
  onSavePendingFromHardFeedback: (blockId: string) => Promise<void>;
  onStartBlockTraining: (block: PlanBlock) => Promise<void>;
  onCompleteBlockTraining: (blockId: string, feedback?: PlanBlockFeedback) => Promise<void>;
  onSkipBlockTraining: (blockId: string) => Promise<void>;
};

const sessionOptions = [5, 15, 30, 60] satisfies SessionMinutes[];

export function Today({
  plan,
  roadmap,
  sessionMinutes,
  trainingLogs,
  allTrainingLogs,
  pendingItems,
  diplomaAttempts,
  weaknesses,
  diagnosisState,
  diagnosisMessage,
  lichessConnectionState,
  lichessMessage,
  lichessStudyLink,
  onSessionMinutesChange,
  onCreateNextSession,
  onAnswerTutorQuestion,
  onSyncChesscomDiagnosis,
  onSyncLichessDiagnosis,
  onReconcileLichessResults,
  onCreateLichessStudy,
  onApproveLearningPlan,
  onRequestLearningPlanRevision,
  onOpenPendingItem,
  onDeferPendingItem,
  onSavePendingFromHardFeedback,
  onStartBlockTraining,
  onCompleteBlockTraining,
  onSkipBlockTraining,
}: TodayProps) {
  const [nowIso, setNowIso] = useState(() => new Date().toISOString());
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
      <section aria-labelledby="today-title" className="panel">
        <h1 id="today-title">Hoje</h1>
        <p>Salve sua configuração para gerar o plano local.</p>
      </section>
    );
  }

  const sessionSummaries = getPlanSessionSummaries(plan);
  const totalPlannedMinutes = getPlanTotalMinutes(plan);
  const baseDayCompletionSummary = buildDayCompletionSummary({ plan, trainingLogs, roadmap });
  const dayCompletionSummary =
    baseDayCompletionSummary === undefined
      ? undefined
      : {
          ...baseDayCompletionSummary,
          lines: [
            ...baseDayCompletionSummary.lines,
            ...buildNextStepExplanations(plan, buildPuzzleThemeStats(trainingLogs)),
          ],
        };
  const consistency = computeConsistency(allTrainingLogs, plan.date);
  const returnNote = buildReturnRecalibrationNote(consistency.daysSinceLastSession);
  const weeklyDigest = buildWeeklyDigest(allTrainingLogs, plan.date);
  const sessionMilestoneSummary = buildSessionMilestoneSummary({ logs: allTrainingLogs, sessionMinutes });
  const activeTrackId = getActiveTrackId(plan);
  const nextDiploma = getNextDiplomaSummary(diplomaAttempts);
  const learningPlanProposal = buildLearningPlanProposal({
    plan,
    roadmap,
    sessionMinutes,
    weaknesses,
  });

  return (
    <section aria-labelledby="today-title" className="panel today-panel">
      <div className="section-heading">
        <div>
          <h1 id="today-title">Hoje</h1>
          <p>
            {formatFriendlyDate(plan.date)} - {sessionSummaries.length}{' '}
            {sessionSummaries.length === 1 ? 'sessão' : 'sessões'} - {totalPlannedMinutes} min
          </p>
          {plan.weeklyFocus !== undefined ? (
            <p className="weekly-focus">
              Semana: {plan.weeklyFocus.title} - {plan.weeklyFocus.reason}
            </p>
          ) : null}
        </div>
      </div>

      <TutorCard
        plan={plan}
        weaknesses={weaknesses}
        trainingLogs={trainingLogs}
        today={plan.date}
        onAnswerTutorQuestion={onAnswerTutorQuestion}
        onReconcileLichessResults={onReconcileLichessResults}
      />

      {returnNote !== undefined ? (
        <p className="return-note" aria-live="polite">
          {returnNote}
        </p>
      ) : null}

      <LearningPlanProposalCard
        proposal={learningPlanProposal}
        response={plan.learningPlanResponse}
        activeTrackId={activeTrackId}
        onApprovePlan={onApproveLearningPlan}
        onRequestPlanRevision={onRequestLearningPlanRevision}
      />

      <SessionMilestonesCard
        summary={sessionMilestoneSummary}
        openPendingCount={pendingItems.length}
        nextDiploma={nextDiploma}
      />

      <PendingReviewCard
        pendingItems={pendingItems}
        onOpenItem={(item) => {
          void onOpenPendingItem(item);
        }}
        onDeferItem={(item) => {
          void onDeferPendingItem(item);
        }}
      />

      <DayCompletionCard summary={dayCompletionSummary} />

      {weeklyDigest !== undefined ? (
        <section className="weekly-report" aria-labelledby="weekly-report-title">
          <h2 id="weekly-report-title">{weeklyDigest.heading}</h2>
          <div className="weekly-report-metrics">
            {weeklyDigest.metrics.map((metric) => (
              <span key={metric} className="metric-chip">
                {metric}
              </span>
            ))}
          </div>
          {weeklyDigest.lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </section>
      ) : null}

      {weaknesses.length > 0 ? (
        <div className="weakness-row" aria-label="Hipóteses atuais">
          {weaknesses
            .slice()
            .sort((left, right) => right.score - left.score)
            .slice(0, 3)
            .map((weakness) => (
              <span className="weakness-chip" key={weakness.tag}>
                {formatWeaknessTag(weakness.tag)} ({Math.round(weakness.score * 100)}%)
              </span>
            ))}
        </div>
      ) : null}

      <div className="block-list">
        {activeTrackId !== undefined ? (
          <p className="active-track-line">Trilha: {getMethodTrackTitle(activeTrackId)}</p>
        ) : null}
        {sessionSummaries.map((session) => (
          <section
            className="session-group"
            key={session.sessionNumber}
            aria-labelledby={`session-${String(session.sessionNumber)}`}
          >
            <div className="session-heading">
              <h2 id={`session-${String(session.sessionNumber)}`}>Sessão {session.sessionNumber}</h2>
              <span>{session.minutes} min</span>
            </div>
            {session.blocks.map((block) => {
              const trainingLog = trainingLogs.find((log) => log.blockId === block.id);
              const hasSavedPending = pendingItems.some((item) => {
                return item.id === block.pendingItemId || item.sourceLogId === trainingLog?.id;
              });

              return (
                <PlanBlockCard
                  block={block}
                  key={block.id}
                  nowIso={nowIso}
                  trainingLog={trainingLog}
                  hasSavedPending={hasSavedPending}
                  onSavePendingFromHardFeedback={onSavePendingFromHardFeedback}
                  onStartBlockTraining={onStartBlockTraining}
                  onCompleteBlockTraining={onCompleteBlockTraining}
                  onSkipBlockTraining={onSkipBlockTraining}
                />
              );
            })}
          </section>
        ))}
      </div>

      <section className="next-session" aria-label="Próxima sessão">
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
        </div>
      </section>

      <RoadmapList items={roadmap} />

      <details className="diagnosis-details">
        <summary>Diagnóstico</summary>
        <div className="diagnosis-strip" aria-live="polite">
          <div className="diagnosis-actions">
            <button
              type="button"
              className="secondary-button"
              disabled={diagnosisState === 'syncing'}
              onClick={() => {
                void onSyncChesscomDiagnosis();
              }}
            >
              <RefreshCw aria-hidden="true" size={16} />
              {diagnosisState === 'syncing' ? 'Atualizando...' : 'Atualizar Chess.com'}
            </button>
            <button
              type="button"
              className="secondary-button"
              disabled={lichessConnectionState === 'syncing'}
              onClick={() => {
                void onSyncLichessDiagnosis();
              }}
            >
              <RefreshCw aria-hidden="true" size={16} />
              {lichessConnectionState === 'syncing' ? 'Lichess...' : 'Atualizar Lichess'}
            </button>
            <button
              type="button"
              className="secondary-button"
              disabled={lichessConnectionState === 'syncing'}
              onClick={() => {
                void onReconcileLichessResults();
              }}
            >
              Reconciliar puzzles
            </button>
            <button
              type="button"
              className="secondary-button"
              disabled={lichessConnectionState === 'syncing'}
              onClick={() => {
                void onCreateLichessStudy();
              }}
            >
              Gerar Study
            </button>
          </div>
          <div className="diagnosis-messages">
            {diagnosisMessage !== undefined ? <p>{diagnosisMessage}</p> : null}
            {lichessMessage !== undefined ? <p>{lichessMessage}</p> : null}
            {lichessStudyLink !== undefined ? (
              <a className="button-link secondary-link" href={lichessStudyLink.url} target="_blank" rel="noreferrer">
                Abrir Study do dia
              </a>
            ) : null}
          </div>
        </div>
      </details>
    </section>
  );
}

function formatFriendlyDate(date: string): string {
  const parsed = new Date(`${date}T12:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  const formatted = parsed.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function DayCompletionCard({ summary }: { summary: DayCompletionSummary | undefined }) {
  if (summary === undefined) {
    return null;
  }

  return (
    <section className="day-completion-card" aria-labelledby="day-completion-title">
      <div>
        <h2 id="day-completion-title">{summary.heading}</h2>
        <ul className="completion-metrics" aria-label="Resumo do treino">
          {summary.metrics.map((metric) => (
            <li key={metric}>{metric}</li>
          ))}
        </ul>
      </div>
      {summary.lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </section>
  );
}

function RoadmapList({ items }: { items: TrainingRoadmapItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="roadmap-section" aria-labelledby="roadmap-title">
      <div className="section-subheading">
        <h2 id="roadmap-title">Próximos passos</h2>
      </div>
      <ol className="roadmap-list">
        {items.map((item) => (
          <li className={`roadmap-item roadmap-${item.status}`} key={item.id}>
            <div>
              <strong>{item.label}</strong>
              <span>{item.minutes} min</span>
            </div>
            <p>{item.title}</p>
            <small>
              {formatRoadmapStatus(item.status)} - {item.destinationLabel}
            </small>
          </li>
        ))}
      </ol>
    </section>
  );
}

function PlanBlockCard({
  block,
  nowIso,
  trainingLog,
  onStartBlockTraining,
  hasSavedPending,
  onSavePendingFromHardFeedback,
  onCompleteBlockTraining,
  onSkipBlockTraining,
}: {
  block: PlanBlock;
  nowIso: string;
  trainingLog: TrainingLog | undefined;
  hasSavedPending: boolean;
  onSavePendingFromHardFeedback: (blockId: string) => Promise<void>;
  onStartBlockTraining: (block: PlanBlock) => Promise<void>;
  onCompleteBlockTraining: (blockId: string, feedback?: PlanBlockFeedback) => Promise<void>;
  onSkipBlockTraining: (blockId: string) => Promise<void>;
}) {
  const [isRating, setIsRating] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [isSavingPending, setIsSavingPending] = useState(false);
  const [openWarning, setOpenWarning] = useState<string | undefined>(undefined);
  const timerStatus = trainingLog === undefined ? undefined : formatTimerStatus(trainingLog, nowIso);
  const isDone = block.status === 'done';

  async function openTrainingDestination(event: MouseEvent<HTMLAnchorElement>): Promise<void> {
    event.preventDefault();

    if (block.destination.url === undefined || isOpening) {
      return;
    }

    setIsOpening(true);
    setOpenWarning(undefined);

    try {
      await onStartBlockTraining(block);
      setOpenWarning(openExternalUrl(block.destination.url));
    } finally {
      setIsOpening(false);
    }
  }

  return (
    <article className="plan-block">
      <div className="block-header">
        <h2>{block.title}</h2>
        <span className={`status-pill status-${block.status}`}>{formatStatus(block.status)}</span>
      </div>
      <p className="block-meta">
        {block.estimatedMinutes} min - {formatResourceStage(block.resourceStage)} - {block.destination.label}
      </p>
      <p>{block.reason}</p>
      <p>{block.task}</p>
      <p className="coach-note">{block.coachNote}</p>
      <p className="stop-rule">{block.stopRule}</p>
      {block.feedback !== undefined ? <p className="feedback-note">Feedback: {formatFeedback(block.feedback)}</p> : null}
      {block.feedback !== undefined ? <p className="feedback-note">{getFeedbackCelebration(block.feedback)}</p> : null}
      {timerStatus !== undefined ? <p className={`timer-status ${timerStatus.kind}`}>{timerStatus.label}</p> : null}
      {openWarning !== undefined ? (
        <p className="feedback-note" role="status">
          {openWarning}
        </p>
      ) : null}

      {isDone ? (
        <div className="button-row">
          {block.feedback === 'hard' &&
          block.weaknessTag !== undefined &&
          block.methodTrackId !== undefined &&
          !hasSavedPending ? (
            <button
              type="button"
              className="secondary-button"
              disabled={isSavingPending}
              onClick={() => {
                setIsSavingPending(true);
                void onSavePendingFromHardFeedback(block.id).finally(() => {
                  setIsSavingPending(false);
                });
              }}
            >
              Guardar como pendência para revisão amanhã
            </button>
          ) : null}
          {block.destination.url !== undefined ? (
            <a
              className="button-link"
              href={block.destination.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Abrir de novo: ${block.title}`}
              aria-busy={isOpening}
              onClick={(event) => {
                void openTrainingDestination(event);
              }}
            >
              <ExternalLink aria-hidden="true" size={16} />
              Abrir de novo
            </a>
          ) : null}
        </div>
      ) : isRating ? (
        <div className="rating-row" role="group" aria-label="Como foi o treino?">
          <p className="rating-prompt">Como foi o treino?</p>
          <div className="button-row">
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                void onCompleteBlockTraining(block.id, 'easy');
              }}
            >
              Fácil
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                void onCompleteBlockTraining(block.id, 'good');
              }}
            >
              Bom
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                void onCompleteBlockTraining(block.id, 'hard');
              }}
            >
              Difícil
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRating(false);
              }}
              className="link-button"
            >
              Voltar
            </button>
          </div>
        </div>
      ) : (
        <div className="button-row">
          {block.destination.url !== undefined ? (
            <a
              className="button-link"
              href={block.destination.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Abrir no Lichess: ${block.title}`}
              aria-busy={isOpening}
              onClick={(event) => {
                void openTrainingDestination(event);
              }}
            >
              <ExternalLink aria-hidden="true" size={16} />
              Abrir no Lichess
            </a>
          ) : (
            <button
              type="button"
              onClick={() => {
                void onStartBlockTraining(block);
              }}
            >
              Iniciar bloco
            </button>
          )}
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setIsRating(true);
            }}
          >
            <Check aria-hidden="true" size={16} />
            Concluir
          </button>
          <button
            type="button"
            className="link-button"
            onClick={() => {
              void onSkipBlockTraining(block.id);
            }}
          >
            Pular
          </button>
        </div>
      )}
    </article>
  );
}

function getActiveTrackId(plan: DailyPlan): MethodTrackId | undefined {
  return plan.blocks.find((block) => block.methodTrackId !== undefined)?.methodTrackId;
}

function getNextDiplomaSummary(attempts: DiplomaAttempt[]): NextDiplomaSummary | undefined {
  for (const diploma of DIPLOMAS) {
    const progress = getDiplomaProgress(attempts, diploma.id);

    if (progress === null) {
      continue;
    }

    const passedSections = progress.sections.filter((section) => section.passed).length;
    const progressPercent = Math.round((passedSections / progress.sections.length) * 100);

    if (!progress.overallPassed) {
      return {
        title: progress.diploma.title,
        progressPercent,
      };
    }
  }

  return undefined;
}

function formatTimerStatus(
  log: TrainingLog,
  nowIso: string,
): { kind: 'timer-running' | 'timer-done' | 'timer-over' | 'timer-skipped'; label: string } {
  const elapsedSeconds = log.status === 'active' ? elapsedSecondsBetween(log.startedAt, nowIso) : (log.elapsedSeconds ?? 0);

  if (log.status === 'done') {
    return {
      kind: 'timer-done',
      label: `Treinou por ${formatElapsedMinutes(elapsedSeconds)}.`,
    };
  }

  if (log.status === 'skipped') {
    return {
      kind: 'timer-skipped',
      label: `Pulou após ${formatElapsedMinutes(elapsedSeconds)}.`,
    };
  }

  if (elapsedSeconds >= log.plannedSeconds) {
    return {
      kind: 'timer-over',
      label: 'Tempo combinado atingido. Pode continuar; conclua quando terminar.',
    };
  }

  return {
    kind: 'timer-running',
    label: `Treinando há ${formatElapsedMinutes(elapsedSeconds)}. Faltam ${formatElapsedMinutes(log.plannedSeconds - elapsedSeconds)}.`,
  };
}

function formatResourceStage(stage: PlanBlock['resourceStage']): string {
  switch (stage) {
    case 'explain':
      return 'explicação';
    case 'guided':
      return 'guiado';
    case 'retrieval':
      return 'repetição';
    case 'transfer':
      return 'transferência';
    case 'review':
      return 'revisão';
    case undefined:
      return 'treino';
  }
}

function formatFeedback(feedback: PlanBlockFeedback): string {
  switch (feedback) {
    case 'easy':
      return 'fácil';
    case 'good':
      return 'bom: interessante e desafiador';
    case 'hard':
      return 'difícil';
  }
}

function getFeedbackCelebration(feedback: PlanBlockFeedback): string {
  switch (feedback) {
    case 'easy':
      return 'Professor Lemos: está ficando mais fácil, sinal de progresso real.';
    case 'good':
      return 'Professor Lemos: bom desafio. Esse é o peso certo para evoluir.';
    case 'hard':
      return 'Professor Lemos: esse foi difícil. Dá para guardar para revisão amanhã.';
  }
}

function playTimerBeep(): void {
  try {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.42);

    window.setTimeout(() => {
      void audioContext.close();
    }, 600);
  } catch {
    // Audio can be blocked by the browser; the visible timer message still carries the warning.
  }
}

function formatWeaknessTag(tag: Weakness['tag']): string {
  switch (tag) {
    case 'hanging-piece':
      return 'peças penduradas';
    case 'fork':
      return 'garfos';
    case 'pin':
      return 'cravadas';
    case 'skewer':
      return 'espetos';
    case 'discovered':
      return 'ataques descobertos';
    case 'mate-in-1':
      return 'mate em 1';
    case 'mate-in-2':
      return 'mate em 2';
    case 'back-rank':
      return 'mate na última fileira';
    case 'opening-principles':
      return 'abertura';
    case 'time-trouble':
      return 'tempo';
    case 'endgame-pawn':
      return 'final de peoes';
    case 'endgame-rook':
      return 'final de torres';
    case 'conversion':
      return 'conversão';
    case 'blunder-rate':
      return 'anti-blunder';
  }
}

function formatStatus(status: PlanBlock['status']): string {
  switch (status) {
    case 'pending':
      return 'Pendente';
    case 'done':
      return 'Feito';
    case 'skipped':
      return 'Pulado';
  }
}

function formatRoadmapStatus(status: TrainingRoadmapItem['status']): string {
  switch (status) {
    case 'current':
      return 'Planejado';
    case 'done':
      return 'Feito';
    case 'future':
      return 'Próximo';
  }
}
