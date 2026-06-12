import { Check, ExternalLink } from 'lucide-react';
import { useState, type MouseEvent } from 'react';
import { openExternalUrl } from '../app/externalOpen';
import {
  elapsedSecondsBetween,
  formatElapsedMinutes,
  type PlanBlock,
  type PlanBlockFeedback,
  type TrainingLog,
} from '../domain';

type PlanBlockCardProps = {
  block: PlanBlock;
  nowIso: string;
  trainingLog: TrainingLog | undefined;
  hasSavedPending: boolean;
  onSavePendingFromHardFeedback: (blockId: string) => Promise<void>;
  onStartBlockTraining: (block: PlanBlock) => Promise<void>;
  onCompleteBlockTraining: (blockId: string, feedback?: PlanBlockFeedback) => Promise<void>;
  onSkipBlockTraining: (blockId: string) => Promise<void>;
};

export function PlanBlockCard({
  block,
  nowIso,
  trainingLog,
  onStartBlockTraining,
  hasSavedPending,
  onSavePendingFromHardFeedback,
  onCompleteBlockTraining,
  onSkipBlockTraining,
}: PlanBlockCardProps) {
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
        {/* h3: o título do bloco fica subordinado ao h2 da seção (hero ou Sessão N). */}
        <h3>{block.title}</h3>
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
