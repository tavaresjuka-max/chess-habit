import { useEffect, useRef, useState } from 'react';
import {
  elapsedSecondsBetween,
  formatElapsedMinutes,
  type DailyPlan,
  type PlanBlock,
  type SessionMinutes,
  type TrainingLog,
  type Weakness,
} from '../domain';
import type { DiagnosisState } from '../app/state';

type TodayProps = {
  plan: DailyPlan | undefined;
  sessionMinutes: SessionMinutes;
  trainingLogs: TrainingLog[];
  weaknesses: Weakness[];
  diagnosisState: DiagnosisState;
  diagnosisMessage: string | undefined;
  onSessionMinutesChange: (minutes: SessionMinutes) => Promise<void>;
  onSyncChesscomDiagnosis: () => Promise<void>;
  onStartBlockTraining: (block: PlanBlock) => Promise<void>;
  onCompleteBlockTraining: (blockId: string) => Promise<void>;
  onSkipBlockTraining: (blockId: string) => Promise<void>;
};

const sessionOptions = [5, 15, 30, 60] satisfies SessionMinutes[];

export function Today({
  plan,
  sessionMinutes,
  trainingLogs,
  weaknesses,
  diagnosisState,
  diagnosisMessage,
  onSessionMinutesChange,
  onSyncChesscomDiagnosis,
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
        <p>Salve sua configuracao para gerar o plano local.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="today-title" className="panel today-panel">
      <div className="section-heading">
        <div>
          <h1 id="today-title">Hoje</h1>
          <p>{plan.date} · {plan.blocks.length} blocos · {plan.sessionMinutes} min</p>
        </div>
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
      </div>

      <div className="diagnosis-strip" aria-live="polite">
        <button
          type="button"
          className="secondary-button"
          disabled={diagnosisState === 'syncing'}
          onClick={() => {
            void onSyncChesscomDiagnosis();
          }}
        >
          {diagnosisState === 'syncing' ? 'Atualizando...' : 'Atualizar Chess.com'}
        </button>
        {diagnosisMessage !== undefined ? <p>{diagnosisMessage}</p> : null}
      </div>

      {weaknesses.length > 0 ? (
        <div className="weakness-row" aria-label="Hipoteses atuais">
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
        {plan.blocks.map((block) => (
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
      </div>
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
  onCompleteBlockTraining: (blockId: string) => Promise<void>;
  onSkipBlockTraining: (blockId: string) => Promise<void>;
}) {
  const timerStatus = trainingLog === undefined ? undefined : formatTimerStatus(trainingLog, nowIso);

  return (
    <article className="plan-block">
            <div className="block-header">
              <h2>{block.title}</h2>
              <span className={`status-pill status-${block.status}`}>{formatStatus(block.status)}</span>
            </div>
            <p className="block-meta">{block.estimatedMinutes} min · {block.destination.label}</p>
            <p>{block.reason}</p>
            <p>{block.task}</p>
            <p className="coach-note">{block.coachNote}</p>
            <p className="stop-rule">{block.stopRule}</p>
            {timerStatus !== undefined ? <p className={`timer-status ${timerStatus.kind}`}>{timerStatus.label}</p> : null}
            <div className="button-row">
              <button
                type="button"
                onClick={() => {
                  void onStartBlockTraining(block);
                }}
              >
                {block.destination.url !== undefined ? 'Abrir no Lichess' : 'Iniciar bloco'}
              </button>
              <button
                type="button"
                onClick={() => {
                  void onCompleteBlockTraining(block.id);
                }}
              >
                Concluir
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  void onSkipBlockTraining(block.id);
                }}
              >
                Pular
              </button>
            </div>
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
      label: `Pulou apos ${formatElapsedMinutes(elapsedSeconds)}.`,
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
    label: `Treinando ha ${formatElapsedMinutes(elapsedSeconds)}. Faltam ${formatElapsedMinutes(log.plannedSeconds - elapsedSeconds)}.`,
  };
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
      return 'pecas penduradas';
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
      return 'mate na ultima fileira';
    case 'opening-principles':
      return 'abertura';
    case 'time-trouble':
      return 'tempo';
    case 'endgame-pawn':
      return 'final de peoes';
    case 'endgame-rook':
      return 'final de torres';
    case 'conversion':
      return 'conversao';
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
