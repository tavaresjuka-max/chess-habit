import { Loader2 } from 'lucide-react';
import { getConceptContract, type PatternRecognition, type PlanBlock } from '../domain';

export function PatternRecognitionPrompt({
  block,
  isSubmitting,
  onAnswer,
  onSkip,
}: {
  block: PlanBlock;
  isSubmitting: boolean;
  onAnswer: (answer: PatternRecognition) => void;
  onSkip: () => void;
}) {
  const question =
    block.conceptContractId === undefined
      ? 'Você reconheceu o padrão antes de calcular?'
      : getConceptContract(block.conceptContractId).postAttemptReflection;

  return (
    <div className="rating-row" role="group" aria-label="Reconhecimento do padrão">
      <p className="rating-prompt" role="status" aria-live="polite">
        {isSubmitting ? (
          <>
            <Loader2 className="rating-spinner" aria-hidden="true" size={15} /> Anotando seu resultado…
          </>
        ) : (
          question
        )}
      </p>
      {!isSubmitting ? <p className="rating-subprompt">Opcional. Isso ajuda o professor a calibrar a revisão.</p> : null}
      <div className="button-row" aria-busy={isSubmitting}>
        <button type="button" className="secondary-button" disabled={isSubmitting} onClick={() => { onAnswer('yes'); }}>
          Sim
        </button>
        <button type="button" className="secondary-button" disabled={isSubmitting} onClick={() => { onAnswer('partial'); }}>
          Mais ou menos
        </button>
        <button type="button" className="secondary-button" disabled={isSubmitting} onClick={() => { onAnswer('no'); }}>
          Não
        </button>
        <button type="button" className="link-button" disabled={isSubmitting} onClick={onSkip}>
          Pular
        </button>
      </div>
    </div>
  );
}
