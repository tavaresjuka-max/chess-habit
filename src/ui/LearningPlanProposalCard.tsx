import { Check, ClipboardList, Flag, Route, Target } from 'lucide-react';
import { useState } from 'react';
import type { LearningPlanProposal, LearningPlanResponse } from '../domain';
import { getMethodTrackTitle } from '../domain/method/methodTracks';
import type { MethodTrackId } from '../domain/method/types';
import { Fold } from './Fold';

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

  const planChips = (
    <>
      <div className="learning-plan-summary">
        <strong className="learning-plan-phase">
          <Target aria-hidden="true" size={15} />
          {proposal.phaseTitle}
        </strong>
        <div className="learning-plan-chips">
          {activeTrackId !== undefined ? (
            <span className="metric-chip learning-plan-chip-icon">
              <Route aria-hidden="true" size={13} />
              {getMethodTrackTitle(activeTrackId)}
            </span>
          ) : null}
          {proposal.focusItems.map((item) => (
            <span key={item} className="metric-chip">
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="learning-plan-numbers">
        <ul className="day-stats" aria-label="Estimativa da fase">
          <li>
            <strong>≈{proposal.estimateHours}</strong>
            <span>horas</span>
          </li>
          <li>
            <strong>{proposal.estimateSessions}</strong>
            <span>sessões</span>
          </li>
          <li>
            <strong>{proposal.estimateMinutes}</strong>
            <span>min cada</span>
          </li>
        </ul>
        <span className="metric-chip learning-plan-chip-icon">
          <Flag aria-hidden="true" size={13} />
          Checkpoint: {proposal.checkpointHours}h · {proposal.checkpointSessions} sessões
        </span>
      </div>
    </>
  );

  // Plano aprovado: sai do caminho. Vira uma dobra compacta no fim da tela —
  // confirmação + referência rápida (chips e números) + opção de revisar.
  if (response?.status === 'approved' && !isReviewing) {
    return (
      <Fold concept="plano" title="Plano de hoje" meta="✓ aprovado">
        {planChips}
        <div className="button-row">
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
      </Fold>
    );
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

      {/* Zona de decisão: fase, focos em chips e os números — o suficiente
          para aprovar. Método e medição são contexto e vivem nas dobras. */}
      {planChips}

      <Fold concept="plano" title="Como o plano foi montado" meta={shortEvidence(proposal.evidenceLevel)}>
        <p>{proposal.methodSummary}</p>
        <ol className="learning-plan-steps">
          {proposal.methodSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </Fold>

      <Fold
        concept="avaliacao"
        title="Como vamos medir progresso"
        meta={`${String(proposal.progressCriteria.length)} critérios`}
      >
        <ul className="learning-plan-criteria">
          {proposal.progressCriteria.map((criterion) => (
            <li key={criterion}>{criterion}</li>
          ))}
        </ul>
      </Fold>

      {response?.status === 'approved' ? (
        <p className="learning-plan-status">
          <Check aria-hidden="true" size={16} />
          Plano aprovado. Começamos por este caminho e revisamos no checkpoint.
        </p>
      ) : null}

      {response?.status === 'revision-requested' ? (
        <div className="learning-plan-review-note">
          <strong>Revisão registrada.</strong>
          {response.note !== undefined ? <p>{response.note}</p> : null}
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

// "Confiança: média. O tema aparece..." → "Confiança: média" (meta da dobra).
function shortEvidence(evidenceLevel: string): string {
  return evidenceLevel.split('.')[0] ?? evidenceLevel;
}
