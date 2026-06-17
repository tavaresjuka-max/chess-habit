import { Check, ExternalLink, Feather, Flag, Lightbulb, Target } from 'lucide-react';
import { useEffect, useState, type MouseEvent } from 'react';
import { isAllowedExternalUrl, openExternalUrl } from '../app/externalOpen';
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
  const safeDestinationUrl =
    block.destination.url !== undefined && isAllowedExternalUrl(block.destination.url)
      ? block.destination.url
      : undefined;

  useEffect(() => {
    setIsRating(false);
    setIsOpening(false);
    setIsSavingPending(false);
    setOpenWarning(undefined);
  }, [block.id]);

  async function openTrainingDestination(event: MouseEvent<HTMLAnchorElement>): Promise<void> {
    event.preventDefault();

    if (safeDestinationUrl === undefined || isOpening) {
      return;
    }

    setIsOpening(true);
    setOpenWarning(undefined);

    try {
      await onStartBlockTraining(block);
      setOpenWarning(openExternalUrl(safeDestinationUrl));
    } finally {
      setIsOpening(false);
    }
  }

  return (
    <article className="plan-block" aria-labelledby={`block-title-${block.id}`}>
      <div className="block-header">
        {/* h3: o título do bloco fica subordinado ao h2 da seção (hero ou Sessão N).
            O id rotula o <article> inteiro (aria-labelledby): o leitor de tela
            anuncia o bloco ao entrar, dando contexto aos botões "Concluir"/"Pular". */}
        <h3 id={`block-title-${block.id}`}>{block.title}</h3>
        <span className={`status-pill status-${block.status}`}>{formatStatus(block.status)}</span>
      </div>
      <p className="block-meta">
        {block.estimatedMinutes} min - {formatResourceStage(block.resourceStage)} - {block.destination.label}
      </p>
      {/* Cada linha com seu ícone: porquê, tarefa, dica do professor e regra
          de parada — escaneável sem ler tudo. */}
      <p className="block-line block-reason">
        <Lightbulb aria-hidden="true" size={15} />
        {block.reason}
      </p>
      <p className="block-line block-task">
        <Target aria-hidden="true" size={15} />
        {block.task}
      </p>
      <p className="block-line coach-note">
        <Feather aria-hidden="true" size={15} />
        {block.coachNote}
      </p>
      <p className="block-line stop-rule">
        <Flag aria-hidden="true" size={15} />
        {block.stopRule}
      </p>
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
              Guardar para revisar amanhã
            </button>
          ) : null}
          {safeDestinationUrl !== undefined ? (
            <a
              className="button-link"
              href={safeDestinationUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Abrir de novo: ${block.title} (abre em nova aba)`}
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
          {safeDestinationUrl !== undefined ? (
            <a
              className="button-link"
              href={safeDestinationUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Abrir no Lichess: ${block.title} (abre em nova aba)`}
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
      label: 'Tempo atingido. Conclua quando terminar.',
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

// Sem prefixo "Professor Lemos:" — o card do tutor já carrega retrato e nome;
// repetir a assinatura em cada fala era ruído.
function getFeedbackCelebration(feedback: PlanBlockFeedback): string {
  switch (feedback) {
    case 'easy':
      return 'Está ficando mais fácil — sinal de progresso real.';
    case 'good':
      return 'Bom desafio. O peso certo para evoluir.';
    case 'hard':
      return 'Esse foi difícil. Dá para guardar para revisar amanhã.';
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
