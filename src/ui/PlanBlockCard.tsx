import { Check, ExternalLink, Feather, Flag, HelpCircle, Lightbulb, Loader2, Target } from 'lucide-react';
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { isAllowedExternalUrl, openExternalUrl } from '../app/externalOpen';
import { TacticDiagram } from './art/TacticDiagram';
import {
  elapsedSecondsBetween,
  formatElapsedMinutes,
  type ErrorType,
  type PlanBlock,
  type PlanBlockFeedback,
  type TrainingLog,
} from '../domain';
import { ERROR_TYPE_LABELS, SELF_EXPLANATION_PROMPT } from '../domain/method/errorRouting';

type PlanBlockCardProps = {
  block: PlanBlock;
  nowIso: string;
  trainingLog: TrainingLog | undefined;
  hasSavedPending: boolean;
  onSavePendingFromHardFeedback: (blockId: string) => Promise<void>;
  onStartBlockTraining: (block: PlanBlock) => Promise<void>;
  onCompleteBlockTraining: (blockId: string, feedback?: PlanBlockFeedback, errorType?: ErrorType, selfExplanation?: string) => Promise<void>;
  onSkipBlockTraining: (blockId: string) => Promise<void>;
  // Progresso do tema do bloco rumo ao diploma (PROD-5); ausente = bloco sem tema mensurável.
  diplomaProgress?: { label: string; attempts: number; target: number };
  // O herói action-first (TodayHero) já mostra o coachNote do bloco atual; suprime
  // aqui para não duplicar a mesma frase na tela. Default false p/ outros usos.
  hideCoachNote?: boolean;
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
  diplomaProgress,
  hideCoachNote = false,
}: PlanBlockCardProps) {
  const [isRating, setIsRating] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [isSavingPending, setIsSavingPending] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState<PlanBlockFeedback | undefined>(undefined);
  const [openWarning, setOpenWarning] = useState<string | undefined>(undefined);
  const [isConfirmingSkip, setIsConfirmingSkip] = useState(false);
  // Fase 1 — seletor de errorType: aparece SÓ após feedback='hard', não bloqueia
  const [pendingHardFeedback, setPendingHardFeedback] = useState(false);
  const [selectedErrorType, setSelectedErrorType] = useState<ErrorType | undefined>(undefined);
  const [selfExplanation, setSelfExplanation] = useState('');
  const skipTriggerRef = useRef<HTMLButtonElement>(null);
  const skipCancelRef = useRef<HTMLButtonElement>(null);
  const prevConfirmingSkipRef = useRef(false);
  // a11y: ao abrir a confirmação de pular, move o foco para a opção SEGURA (Voltar),
  // nunca a destrutiva; ao cancelar, devolve o foco ao gatilho "Pular".
  useEffect(() => {
    if (isConfirmingSkip && !prevConfirmingSkipRef.current) {
      skipCancelRef.current?.focus();
    } else if (!isConfirmingSkip && prevConfirmingSkipRef.current) {
      skipTriggerRef.current?.focus();
    }
    prevConfirmingSkipRef.current = isConfirmingSkip;
  }, [isConfirmingSkip]);
  const [justCompleted, setJustCompleted] = useState(false);
  const prevStatusRef = useRef(block.status);
  // Carimbo "FEITO" (council UX): anima SÓ na transição para concluído nesta sessão.
  // Bloco que já monta concluído (reload) não recarimba — o status-pill já marca.
  useEffect(() => {
    if (block.status === 'done' && prevStatusRef.current !== 'done') {
      setJustCompleted(true);
    }
    prevStatusRef.current = block.status;
  }, [block.status]);
  const timerStatus = trainingLog === undefined ? undefined : formatTimerStatus(trainingLog, nowIso);
  const isDone = block.status === 'done';
  const isSubmittingFeedback = submittingFeedback !== undefined;
  const safeDestinationUrl =
    block.destination.url !== undefined && isAllowedExternalUrl(block.destination.url)
      ? block.destination.url
      : undefined;

  useEffect(() => {
    setIsRating(false);
    setIsOpening(false);
    setIsSavingPending(false);
    setSubmittingFeedback(undefined);
    setOpenWarning(undefined);
    setIsConfirmingSkip(false);
    setPendingHardFeedback(false);
    setSelectedErrorType(undefined);
    setSelfExplanation('');
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

  // O registro do feedback espera a reconciliação com o Lichess (rede), que leva
  // alguns segundos. Sem estado de "anotando", o clique parecia não funcionar.
  function submitFeedback(feedback: PlanBlockFeedback): void {
    if (isSubmittingFeedback) {
      return;
    }

    setIsConfirmingSkip(false);

    // Fase 1: para 'hard', mostra o seletor de errorType antes de completar.
    // Não bloqueia — o aluno pode pular com "Registrar assim" e completar sem errorType.
    if (feedback === 'hard') {
      setPendingHardFeedback(true);
      return;
    }

    setSubmittingFeedback(feedback);
    void onCompleteBlockTraining(block.id, feedback).finally(() => {
      setSubmittingFeedback(undefined);
    });
  }

  // Confirma o treino 'hard' (com ou sem errorType selecionado).
  function confirmHardFeedback(errorType?: ErrorType): void {
    if (isSubmittingFeedback) return;
    setPendingHardFeedback(false);
    setIsRating(false);
    setSubmittingFeedback('hard');
    void onCompleteBlockTraining(
      block.id,
      'hard',
      errorType,
      selfExplanation.trim().length > 0 ? selfExplanation.trim() : undefined,
    ).finally(() => {
      setSubmittingFeedback(undefined);
    });
  }

  return (
    <article className="plan-block" aria-labelledby={`block-title-${block.id}`}>
      {justCompleted ? (
        <span className="block-stamp" aria-hidden="true">
          Boa!
        </span>
      ) : null}
      <div className="block-header">
        {/* h3: o título do bloco fica subordinado ao h2 da seção (hero ou Sessão N).
            O id rotula o <article> inteiro (aria-labelledby): o leitor de tela
            anuncia o bloco ao entrar, dando contexto aos botões "Concluir"/"Pular". */}
        <h3 id={`block-title-${block.id}`}>{block.title}</h3>
        <span className={`status-pill status-${block.status}`}>{formatStatus(block.status)}</span>
      </div>
      {/* Diagrama do conceito tático: imagem vale mais que texto para memorizar. */}
      {block.weaknessTag !== undefined ? <TacticDiagram tag={block.weaknessTag} /> : null}
      <p className="block-meta">
        {block.estimatedMinutes} min - {formatResourceStage(block.resourceStage)} - {block.destination.label}
      </p>
      {/* PROD-5: liga o treino do dia à meta — progresso do tema rumo ao diploma. */}
      {diplomaProgress !== undefined ? (
        <p className="block-diploma">
          <span
            className="metric-chip"
            aria-label={`Rumo ao diploma — ${diplomaProgress.label}: ${String(Math.min(diplomaProgress.attempts, diplomaProgress.target))} de ${String(diplomaProgress.target)} puzzles do tema`}
          >
            🏅 {diplomaProgress.label}: {Math.min(diplomaProgress.attempts, diplomaProgress.target)}/
            {diplomaProgress.target}
          </span>
        </p>
      ) : null}
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
      {hideCoachNote ? null : (
        <p className="block-line coach-note">
          <Feather aria-hidden="true" size={15} />
          {block.coachNote}
        </p>
      )}
      {block.guidingQuestion !== undefined ? (
        <p className="block-line guiding-question">
          <HelpCircle aria-hidden="true" size={15} />
          {block.guidingQuestion}
        </p>
      ) : null}
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
        pendingHardFeedback ? (
          /* Fase 1 — seletor de errorType: aparece SÓ após 'Difícil'. Não bloqueia:
             1 toque confirma; "Registrar assim" conclui sem errorType. O campo de
             autoexplicação é convite (TDAH — fricção zero), enviado só se preenchido. */
          <div className="rating-row error-type-selector" role="group" aria-label={SELF_EXPLANATION_PROMPT}>
            <p className="rating-prompt" role="status" aria-live="polite">
              {isSubmittingFeedback ? (
                <>
                  <Loader2 className="rating-spinner" aria-hidden="true" size={15} /> Anotando seu resultado…
                </>
              ) : (
                SELF_EXPLANATION_PROMPT
              )}
            </p>
            {!isSubmittingFeedback ? (
              <p className="rating-subprompt">Sem cobrança — marque se quiser.</p>
            ) : null}
            {!isSubmittingFeedback ? (
              <div className="self-explanation-row">
                <input
                  type="text"
                  className="self-explanation-input"
                  placeholder="Por que esse lance? (opcional)"
                  value={selfExplanation}
                  maxLength={200}
                  aria-label="Autoexplicação opcional"
                  onChange={(event) => {
                    setSelfExplanation(event.target.value);
                  }}
                />
              </div>
            ) : null}
            <div className="button-row" aria-busy={isSubmittingFeedback}>
              {(Object.entries(ERROR_TYPE_LABELS) as [ErrorType, string][]).map(([type, label]) => (
                <button
                  key={type}
                  type="button"
                  className={`secondary-button${selectedErrorType === type ? ' active' : ''}`}
                  disabled={isSubmittingFeedback}
                  aria-pressed={selectedErrorType === type}
                  onClick={() => {
                    setSelectedErrorType(type);
                    confirmHardFeedback(type);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            {!isSubmittingFeedback ? (
              <div className="button-row">
                <button
                  type="button"
                  className="link-button"
                  onClick={() => {
                    confirmHardFeedback(undefined);
                  }}
                >
                  Registrar assim
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rating-row" role="group" aria-label="Como foi o treino?">
            <p className="rating-prompt" role="status" aria-live="polite">
              {isSubmittingFeedback ? (
                <>
                  <Loader2 className="rating-spinner" aria-hidden="true" size={15} /> Anotando seu resultado…
                </>
              ) : (
                'Como foi o treino?'
              )}
            </p>
            <div className="button-row" aria-busy={isSubmittingFeedback}>
              <button
                type="button"
                className="secondary-button"
                disabled={isSubmittingFeedback}
                onClick={() => {
                  submitFeedback('easy');
                }}
              >
                Fácil
              </button>
              <button
                type="button"
                className="secondary-button"
                disabled={isSubmittingFeedback}
                onClick={() => {
                  submitFeedback('good');
                }}
              >
                Bom
              </button>
              <button
                type="button"
                className="secondary-button"
                disabled={isSubmittingFeedback}
                onClick={() => {
                  submitFeedback('hard');
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
                disabled={isSubmittingFeedback}
              >
                Voltar
              </button>
            </div>
          </div>
        )
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
          {isConfirmingSkip ? (
            <div className="button-row" role="group" aria-label="Confirmar pular bloco">
              <span className="rating-prompt">Pular este bloco?</span>
              <button
                type="button"
                className="danger-button"
                onClick={() => {
                  setIsConfirmingSkip(false);
                  void onSkipBlockTraining(block.id);
                }}
              >
                Pular mesmo
              </button>
              <button
                ref={skipCancelRef}
                type="button"
                className="link-button"
                onClick={() => {
                  setIsConfirmingSkip(false);
                }}
              >
                Voltar
              </button>
            </div>
          ) : (
            <button
              ref={skipTriggerRef}
              type="button"
              className="link-button"
              onClick={() => {
                setIsConfirmingSkip(true);
              }}
            >
              Pular
            </button>
          )}
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
    // Métrica honesta: nº de exercícios feitos (real, do Lichess) em vez do
    // relógio de parede. Tempo, quando há, é a estimativa por timestamp.
    const result = log.result;

    if (result !== undefined && result.puzzles > 0) {
      const plural = result.puzzles === 1 ? '' : 's';
      const seconds = result.kind === 'puzzle-activity' ? (result.activeSeconds ?? 0) : 0;
      const time = seconds > 0 ? ` · ~${formatElapsedMinutes(seconds)}` : '';

      return {
        kind: 'timer-done',
        label: `${String(result.puzzles)} exercício${plural} feito${plural}${time}.`,
      };
    }

    return {
      kind: 'timer-done',
      label: 'Concluído.',
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

// Sem prefixo "Professor Tavarez:" — o card do tutor já carrega retrato e nome;
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
