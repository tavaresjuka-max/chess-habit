import { Check, ClipboardList } from 'lucide-react';
import { useState } from 'react';
import type { LearningPlanProposal, LearningPlanResponse } from '../domain';
import { getMethodTrackTitle } from '../domain/method/methodTracks';
import type { MethodTrackId } from '../domain/method/types';

type LearningPlanProposalCardProps = {
  proposal: LearningPlanProposal;
  response: LearningPlanResponse | undefined;
  activeTrackId?: MethodTrackId;
  onApprovePlan: () => Promise<void>;
  onRequestPlanRevision: (note: string) => Promise<void>;
};

const reviewSuggestions = [
  'Quero mais exercícios.',
  'Quero mais partidas.',
  'Quero partidas de 15+10.',
  'Quero sessões de 30 min.',
] as const;

export function LearningPlanProposalCard({
  proposal,
  response,
  activeTrackId,
  onApprovePlan,
  onRequestPlanRevision,
}: LearningPlanProposalCardProps) {
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function approvePlan(): Promise<void> {
    setIsSaving(true);

    try {
      await onApprovePlan();
      setIsReviewing(false);
    } finally {
      setIsSaving(false);
    }
  }

  async function requestRevision(): Promise<void> {
    setIsSaving(true);

    try {
      await onRequestPlanRevision(reviewNote.trim() || 'Quero revisar o plano antes de seguir.');
      setIsReviewing(false);
    } finally {
      setIsSaving(false);
    }
  }

  function addSuggestion(suggestion: string): void {
    setReviewNote((current) => {
      if (current.includes(suggestion)) {
        return current;
      }

      return current.trim() === '' ? suggestion : `${current.trim()} ${suggestion}`;
    });
  }

  return (
    <section className="learning-plan-card" aria-labelledby="learning-plan-title">
      <div className="learning-plan-heading">
        <ClipboardList aria-hidden="true" size={18} />
        <div>
          <h2 id="learning-plan-title">{proposal.heading}</h2>
          <p>{proposal.intro}</p>
        </div>
      </div>

      <div className="learning-plan-summary">
        <strong>{proposal.phaseTitle}</strong>
        {activeTrackId !== undefined ? <p>Trilha atual: {getMethodTrackTitle(activeTrackId)}</p> : null}
        <ul>
          {proposal.focusItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="method-note-panel learning-plan-method" aria-label="Método do plano">
        <strong>Como o plano foi montado</strong>
        <p>{proposal.methodSummary}</p>
        <p>{proposal.evidenceLevel}</p>
        <ol>
          {proposal.methodSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      <div className="method-note-panel learning-plan-progress" aria-label="Como vamos medir progresso">
        <strong>Como vamos medir progresso</strong>
        <ul>
          {proposal.progressCriteria.map((criterion) => (
            <li key={criterion}>{criterion}</li>
          ))}
        </ul>
      </div>

      <p>{proposal.estimate}</p>
      <p>{proposal.checkpoint}</p>
      <p className="learning-plan-caveat">{proposal.caveat}</p>
      <p>{proposal.reviewPrompt}</p>

      {response?.status === 'approved' ? (
        <p className="learning-plan-status">
          <Check aria-hidden="true" size={16} />
          Plano aprovado. Começamos por este caminho e revisamos no checkpoint.
        </p>
      ) : null}

      {response?.status === 'revision-requested' ? (
        <div className="learning-plan-review-note">
          <strong>Revisão registrada.</strong>
          <p>{response.note ?? 'Você pediu para revisar o plano antes de seguir.'}</p>
        </div>
      ) : null}

      {isReviewing ? (
        <div className="learning-plan-review-form">
          <label className="field">
            <span>O que você quer mudar?</span>
            <textarea
              value={reviewNote}
              onChange={(event) => {
                setReviewNote(event.target.value);
              }}
              placeholder="Ex.: mais exercícios de garfo, mais partidas rápidas, sessões de 30 min..."
            />
          </label>
          <div className="button-row" role="group" aria-label="Sugestões de revisão">
            {reviewSuggestions.map((suggestion) => (
              <button
                className="secondary-button"
                key={suggestion}
                type="button"
                onClick={() => {
                  addSuggestion(suggestion);
                }}
              >
                {formatSuggestionLabel(suggestion)}
              </button>
            ))}
          </div>
          <div className="button-row">
            <button type="button" disabled={isSaving} onClick={() => void requestRevision()}>
              Enviar revisão
            </button>
            <button
              type="button"
              className="link-button"
              disabled={isSaving}
              onClick={() => {
                setIsReviewing(false);
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="button-row">
          {response?.status !== 'approved' ? (
            <button type="button" disabled={isSaving} onClick={() => void approvePlan()}>
              Aprovar plano
            </button>
          ) : null}
          <button
            type="button"
            className="secondary-button"
            disabled={isSaving}
            onClick={() => {
              setIsReviewing(true);
            }}
          >
            Revisar plano
          </button>
        </div>
      )}
    </section>
  );
}

function formatSuggestionLabel(suggestion: string): string {
  return suggestion.replace(/^Quero /, '').replace(/\.$/, '');
}
