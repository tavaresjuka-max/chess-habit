import { ExternalLink, RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
  getAchievementDefinition,
  getPlanSessionSummaries,
  getPlanTotalMinutes,
  type Achievement,
  type DailyPlan,
  type DayCompletionSummary,
  type LearnerBand,
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
import { CurriculumCard } from './CurriculumCard';
import { Fold } from './Fold';
import { LearningPlanProposalCard } from './LearningPlanProposalCard';
import { PendingReviewCard } from './PendingReviewCard';
import { PlanBlockCard } from './PlanBlockCard';
import { SessionMilestonesCard, type NextDiplomaSummary } from './SessionMilestonesCard';
import { TutorCard } from './TutorCard';
import { formatWeaknessTag } from './formatWeakness';

type TodayProps = {
  plan: DailyPlan | undefined;
  roadmap: TrainingRoadmapItem[];
  sessionMinutes: SessionMinutes;
  learnerBand: LearnerBand | undefined;
  trainingLogs: TrainingLog[];
  allTrainingLogs: TrainingLog[];
  pendingItems: PendingTrainingItem[];
  diplomaAttempts: DiplomaAttempt[];
  achievements: Achievement[];
  weaknesses: Weakness[];
  diagnosisState: DiagnosisState;
  diagnosisMessage: string | undefined;
  lichessConnectionState: LichessConnectionState;
  lichessConnected: boolean;
  lichessMessage: string | undefined;
  lichessStudyLink: LichessStudyLink | undefined;
  onSessionMinutesChange: (minutes: SessionMinutes) => Promise<void>;
  onCreateNextSession: (minutes: SessionMinutes) => Promise<void>;
  onAnswerTutorQuestion: (answer: TutorQuestionAnswer) => Promise<void>;
  onImportFreeActivity: () => Promise<void>;
  onSyncChesscomDiagnosis: () => Promise<void>;
  onSyncLichessDiagnosis: () => Promise<void>;
  onReconcileLichessResults: () => Promise<void>;
  onCreateLichessStudy: () => Promise<void>;
  onConnectLichess: () => Promise<void>;
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
  learnerBand,
  trainingLogs,
  allTrainingLogs,
  pendingItems,
  diplomaAttempts,
  achievements,
  weaknesses,
  diagnosisState,
  diagnosisMessage,
  lichessConnectionState,
  lichessConnected,
  lichessMessage,
  lichessStudyLink,
  onSessionMinutesChange,
  onCreateNextSession,
  onAnswerTutorQuestion,
  onImportFreeActivity,
  onSyncChesscomDiagnosis,
  onSyncLichessDiagnosis,
  onReconcileLichessResults,
  onCreateLichessStudy,
  onConnectLichess,
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
        <p>Configure o app para gerar seu plano.</p>
      </section>
    );
  }

  const sessionSummaries = getPlanSessionSummaries(plan);
  const totalPlannedMinutes = getPlanTotalMinutes(plan);
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
          ],
        };
  const consistency = computeConsistency(allTrainingLogs, plan.date);
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
  const planApproved = plan.learningPlanResponse?.status === 'approved';

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
            // O porquê do foco já chega pelo TutorCard e pelo próprio bloco.
            <p className="weekly-focus">Foco da semana: {plan.weeklyFocus.title}</p>
          ) : null}
        </div>
      </div>

      <div
        className="day-progress"
        role="progressbar"
        aria-label="Progresso do dia"
        aria-valuemin={0}
        aria-valuemax={allBlocksOrdered.length}
        aria-valuenow={doneBlockCount}
        aria-valuetext={
          allBlocksOrdered.length === 0
            ? 'Sem blocos planejados'
            : `${String(doneBlockCount)} de ${String(allBlocksOrdered.length)} blocos`
        }
      >
        <div
          className="day-progress-fill"
          style={{
            width: `${String(allBlocksOrdered.length === 0 ? 0 : Math.round((doneBlockCount / allBlocksOrdered.length) * 100))}%`,
          }}
        />
      </div>

      <ul className="day-stats" aria-label="Números de hoje">
        <li>
          <strong>
            {doneBlockCount}/{allBlocksOrdered.length}
          </strong>
          <span>{allBlocksOrdered.length === 1 ? 'bloco' : 'blocos'}</span>
        </li>
        <li>
          <strong>{minutesTrainedToday}</strong>
          <span>min hoje</span>
        </li>
        {consistency.currentStreakDays >= 2 ? (
          <li>
            <strong>{consistency.currentStreakDays}</strong>
            <span>dias seguidos</span>
          </li>
        ) : null}
      </ul>

      {/* Ação primeiro: o próximo passo (ou "treinando agora") fica logo abaixo
          das métricas do dia, acima do contexto do professor. Decisão de UX
          (Corte D1): reduzir fricção no mobile — o dono abre o app e age. */}
      {heroBlock !== undefined ? (
        <section className="hero-now" aria-labelledby="hero-now-title">
          <h2 id="hero-now-title" className="hero-now-label">
            {activeBlock !== undefined ? 'Treinando agora' : 'Próximo passo'}
          </h2>
          <PlanBlockCard
            block={heroBlock}
            nowIso={nowIso}
            trainingLog={trainingLogs.find((log) => log.blockId === heroBlock.id)}
            hasSavedPending={pendingItems.some(
              (item) =>
                item.id === heroBlock.pendingItemId ||
                item.sourceLogId === trainingLogs.find((log) => log.blockId === heroBlock.id)?.id,
            )}
            onSavePendingFromHardFeedback={onSavePendingFromHardFeedback}
            onStartBlockTraining={onStartBlockTraining}
            onCompleteBlockTraining={onCompleteBlockTraining}
            onSkipBlockTraining={onSkipBlockTraining}
          />
        </section>
      ) : (
        <section className="hero-now" aria-labelledby="hero-done-title">
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
      )}

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
          {allBlocksOrdered.some((block) => block.id !== heroBlock?.id) ? (
            <div className="block-list">
              {activeTrackId !== undefined ? (
                <p className="active-track-line">Trilha: {getMethodTrackTitle(activeTrackId)}</p>
              ) : null}
              {sessionSummaries.map((session) => {
                const remainingBlocks = session.blocks.filter((block) => block.id !== heroBlock?.id);

                if (remainingBlocks.length === 0) {
                  return null;
                }

                return (
                  <section
                    className="session-group"
                    key={session.sessionNumber}
                    aria-labelledby={`session-${String(session.sessionNumber)}`}
                  >
                    <div className="session-heading">
                      <h3 id={`session-${String(session.sessionNumber)}`}>Sessão {session.sessionNumber}</h3>
                      <span>{session.minutes} min</span>
                    </div>
                    {remainingBlocks.map((block) => {
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
                );
              })}
            </div>
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

      <aside className="today-aside" aria-label="Resumo e contexto">

      <Fold
        concept="sessao"
        title={sessionMilestoneSummary.heading}
        meta={`${String(sessionMilestoneSummary.currentMilestone.progressPercent)}%`}
      >
        <SessionMilestonesCard
          summary={sessionMilestoneSummary}
          openPendingCount={pendingItems.length}
          nextDiploma={nextDiploma}
          hideHeading
        />
      </Fold>

      <Fold concept="trilha" title="O que você vai aprender">
        <CurriculumCard band={learnerBand} weeklyFocusTag={plan.weeklyFocus?.tag} hideHeading />
      </Fold>

      {weeklyDigest !== undefined ? (
        <Fold concept="ritmo" title={weeklyDigest.heading}>
          <div className="weekly-report" aria-label={weeklyDigest.heading}>
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
          </div>
        </Fold>
      ) : null}

      {weaknesses.length > 0 ? (
        <Fold
          concept="diagnostico"
          title="O que seus jogos revelam"
          meta={String(weaknesses.length)}
        >
          <div className="weakness-row">
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
        </Fold>
      ) : null}

      <Fold
        concept="lichess"
        title="Sincronizar e estudar"
        {...(lichessConnected ? {} : { meta: 'conectar' })}
      >
        <div className="diagnosis-strip" aria-live="polite">
          {!lichessConnected ? (
            <div className="diagnosis-group diagnosis-connect">
              <p className="config-hint">
                Conecte sua conta do Lichess para criar o Study do dia e conferir o resultado dos seus
                puzzles. O diagnóstico das partidas já funciona sem conectar.
              </p>
              <div className="diagnosis-actions">
                <button
                  type="button"
                  disabled={lichessConnectionState === 'syncing'}
                  onClick={() => {
                    void onConnectLichess();
                  }}
                >
                  <ExternalLink aria-hidden="true" size={16} />
                  Conectar Lichess
                </button>
              </div>
            </div>
          ) : null}

          <div className="diagnosis-group">
            <p className="config-hint">
              Puxa suas partidas recentes — o professor usa para achar onde você trava.
            </p>
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
            </div>
          </div>

          <div className="diagnosis-group">
            <p className="config-hint">
              Reúne os exercícios do dia num tabuleiro só, dentro do Lichess. Útil para treinar sem
              pular entre links.
            </p>
            <div className="diagnosis-actions">
              <button
                type="button"
                className="secondary-button"
                disabled={lichessConnectionState === 'syncing'}
                onClick={() => {
                  void onCreateLichessStudy();
                }}
              >
                Gerar Study do dia
              </button>
              {lichessStudyLink !== undefined ? (
                <a
                  className="button-link secondary-link"
                  href={lichessStudyLink.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir Study do dia
                </a>
              ) : null}
            </div>
          </div>

          <div className="diagnosis-messages">
            {diagnosisMessage !== undefined ? <p>{diagnosisMessage}</p> : null}
            {lichessMessage !== undefined ? <p>{lichessMessage}</p> : null}
          </div>
        </div>
      </Fold>
      </aside>
      </div>
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

// O título "Próximos passos" vem do Fold que embrulha a lista.
function RoadmapList({ items }: { items: TrainingRoadmapItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <ol className="roadmap-list" aria-label="Próximos passos do roteiro">
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
