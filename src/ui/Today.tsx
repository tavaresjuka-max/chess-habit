import { Check, ExternalLink, RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { openExternalUrl } from '../app/externalOpen';
import {
  buildDayCompletionSummary,
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
import type { DiagnosisState, LichessConnectionState } from '../app/state';
import { TutorCard } from './TutorCard';

type TodayProps = {
  plan: DailyPlan | undefined;
  roadmap: TrainingRoadmapItem[];
  sessionMinutes: SessionMinutes;
  trainingLogs: TrainingLog[];
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
  const dayCompletionSummary = buildDayCompletionSummary({ plan, trainingLogs, roadmap });

  return (
    <section aria-labelledby="today-title" className="panel today-panel">
      <div className="section-heading">
        <div>
          <h1 id="today-title">Hoje</h1>
          <p>
            {plan.date} - {sessionSummaries.length} {sessionSummaries.length === 1 ? 'sessão' : 'sessões'} -{' '}
            {totalPlannedMinutes} min
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

      <DayCompletionCard summary={dayCompletionSummary} />

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
            {session.blocks.map((block) => (
              <PlanBlockCard
                block={block}
                key={block.id}
                nowIso={nowIso}
                trainingLog={trainingLogs.find((log) => log.blockId === block.id)}
                onStartBlockTraining={onStartBlockTraining}
                onCompleteBlockTraining={onCompleteBlockTraining}
                onSkipBlockTraining={onSkipBlockTraining}
              />
            ))}
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
  onCompleteBlockTraining,
  onSkipBlockTraining,
}: {
  block: PlanBlock;
  nowIso: string;
  trainingLog: TrainingLog | undefined;
  onStartBlockTraining: (block: PlanBlock) => Promise<void>;
  onCompleteBlockTraining: (blockId: string, feedback?: PlanBlockFeedback) => Promise<void>;
  onSkipBlockTraining: (blockId: string) => Promise<void>;
}) {
  const [isRating, setIsRating] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
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
      {timerStatus !== undefined ? <p className={`timer-status ${timerStatus.kind}`}>{timerStatus.label}</p> : null}
      {openWarning !== undefined ? (
        <p className="feedback-note" role="status">
          {openWarning}
        </p>
      ) : null}

      {isDone ? (
        <div className="button-row">
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
