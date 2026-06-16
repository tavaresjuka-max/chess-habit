import { useState } from 'react';
import { toast } from 'sonner';
import { openExternalUrl } from '../app/externalOpen';
import { ConceptSeal } from './art/ConceptSeal';
import type { Confidence, LearnerBand } from '../domain';
import {
  applyCalibration,
  computePlacement,
  describePlacementConfidence,
  type PlacementAnswers,
  type PlacementCalibrationReport,
  type PlacementEndgames,
  type PlacementExperience,
  type PlacementResult,
  type PlacementTactics,
} from '../domain/placement/placement';

export type PlacementApplication = {
  band: LearnerBand;
  confidence: Confidence;
  calibrated: boolean;
};

type PlacementCardProps = {
  currentBand: LearnerBand;
  onApplyBand: (placement: PlacementApplication) => Promise<void>;
  // Dentro de um Fold o título vem do summary da dobra — sem h2 duplicado.
  hideHeading?: boolean;
  // No onboarding já entramos direto nas perguntas (sem a tela "Começar
  // avaliação"). Na Config segue 'idle' para não abrir tudo de uma vez.
  initialStep?: PlacementStep;
};

type PlacementStep = 'idle' | 'questions' | 'result';

const experienceOptions: { value: PlacementExperience; label: string }[] = [
  { value: 'nunca-joguei', label: 'Nunca joguei de verdade' },
  { value: 'sei-as-regras', label: 'Sei as regras, jogo de vez em quando' },
  { value: 'jogo-casual', label: 'Jogo casualmente há algum tempo' },
  { value: 'jogo-online-regular', label: 'Jogo online com frequência' },
  { value: 'jogo-competitivo', label: 'Jogo ou já joguei competitivamente' },
];

const tacticsOptions: { value: PlacementTactics; label: string }[] = [
  { value: 'nao-sei-nomear', label: 'Não sei nomear táticas (garfo, cravada…)' },
  { value: 'reconheco-basicos', label: 'Reconheço garfo e cravada quando aparecem' },
  { value: 'resolvo-rotineiro', label: 'Resolvo puzzles táticos com regularidade' },
  { value: 'resolvo-avancado', label: 'Resolvo combinações de vários lances' },
];

const endgamesOptions: { value: PlacementEndgames; label: string }[] = [
  { value: 'nao-sei-mate-simples', label: 'Ainda não sei dar mate com dama ou torre' },
  { value: 'sei-mates-basicos', label: 'Sei os mates básicos (dama, torre)' },
  { value: 'sei-finais-peao', label: 'Conheço regra do quadrado e oposição' },
  { value: 'sei-finais-torre', label: 'Jogo finais de torre com método' },
];

const calibrationOptions: { value: PlacementCalibrationReport; label: string }[] = [
  { value: 'quase-todos', label: 'Acertei quase todos' },
  { value: 'mais-da-metade', label: 'Acertei mais da metade' },
  { value: 'menos-da-metade', label: 'Acertei menos da metade' },
  { value: 'quase-nenhum', label: 'Acertei quase nenhum' },
];

export function PlacementCard({
  currentBand,
  onApplyBand,
  hideHeading = false,
  initialStep = 'idle',
}: PlacementCardProps) {
  const sectionAria = hideHeading
    ? { 'aria-label': 'Avaliação de entrada' }
    : { 'aria-labelledby': 'placement-title' };
  const [step, setStep] = useState<PlacementStep>(initialStep);
  const [experience, setExperience] = useState<PlacementExperience | undefined>(undefined);
  const [tactics, setTactics] = useState<PlacementTactics | undefined>(undefined);
  const [endgames, setEndgames] = useState<PlacementEndgames | undefined>(undefined);
  const [knownRating, setKnownRating] = useState('');
  const [result, setResult] = useState<PlacementResult | undefined>(undefined);
  const [calibrated, setCalibrated] = useState(false);

  function handleSuggest() {
    if (experience === undefined || tactics === undefined || endgames === undefined) {
      return;
    }

    const parsedRating = Number.parseInt(knownRating, 10);
    const answers: PlacementAnswers = {
      experience,
      tactics,
      endgames,
      ...(Number.isNaN(parsedRating) || parsedRating <= 0 ? {} : { knownRating: parsedRating }),
    };

    setResult(computePlacement(answers));
    setCalibrated(false);
    setStep('result');
  }

  function handleCalibrationReport(report: PlacementCalibrationReport) {
    if (result === undefined) {
      return;
    }

    setResult(applyCalibration(result, { report, source: 'self-report' }));
    setCalibrated(true);
  }

  async function handleApply() {
    if (result === undefined) {
      return;
    }

    await onApplyBand({ band: result.band, confidence: result.confidence, calibrated });
    toast.success(`Faixa ${result.band} aplicada ao seu plano.`);
    setStep('idle');
  }

  if (step === 'idle') {
    return (
      <section className="config-section" {...sectionAria}>
        {hideHeading ? null : (
          <h2 id="placement-title">
            <ConceptSeal concept="avaliacao" size={26} /> Avaliação de entrada
          </h2>
        )}
        <p className="config-hint">
          Três perguntas rápidas para achar sua faixa. Atual: {currentBand}.
        </p>
        <div className="button-row">
          <button
            type="button"
            onClick={() => {
              setStep('questions');
            }}
          >
            Começar avaliação (2 min)
          </button>
        </div>
      </section>
    );
  }

  if (step === 'questions') {
    return (
      <section className="config-section" {...sectionAria}>
        {hideHeading ? null : <h2 id="placement-title">Avaliação de entrada</h2>}

        <fieldset className="field">
          <legend>Qual é a sua experiência com xadrez?</legend>
          {experienceOptions.map((option) => (
            <label key={option.value} className="radio-option">
              <input
                type="radio"
                name="placement-experience"
                value={option.value}
                checked={experience === option.value}
                onChange={() => {
                  setExperience(option.value);
                }}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </fieldset>

        <fieldset className="field">
          <legend>E com táticas?</legend>
          {tacticsOptions.map((option) => (
            <label key={option.value} className="radio-option">
              <input
                type="radio"
                name="placement-tactics"
                value={option.value}
                checked={tactics === option.value}
                onChange={() => {
                  setTactics(option.value);
                }}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </fieldset>

        <fieldset className="field">
          <legend>E com finais?</legend>
          {endgamesOptions.map((option) => (
            <label key={option.value} className="radio-option">
              <input
                type="radio"
                name="placement-endgames"
                value={option.value}
                checked={endgames === option.value}
                onChange={() => {
                  setEndgames(option.value);
                }}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </fieldset>

        <label className="field">
          <span>Seu rating online (opcional)</span>
          <input
            inputMode="numeric"
            placeholder="ex.: 850"
            value={knownRating}
            onChange={(event) => {
              setKnownRating(event.target.value);
            }}
          />
        </label>

        <div className="button-row">
          <button
            type="button"
            disabled={experience === undefined || tactics === undefined || endgames === undefined}
            onClick={handleSuggest}
          >
            Ver sugestão de faixa
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setStep('idle');
            }}
          >
            Cancelar
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="config-section" aria-live="polite" {...sectionAria}>
      {hideHeading ? null : <h2 id="placement-title">Avaliação de entrada</h2>}
      {result !== undefined ? (
        <>
          <p>
            Sugestão: começar na faixa <strong>{result.band}</strong> (
            {describePlacementConfidence(result.confidence)}).
          </p>
          <ul>
            {result.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>

          {!calibrated ? (
            <>
              <p className="config-hint">
                Opcional: resolva ~10 puzzles no Lichess e conte como foi.
              </p>
              <div className="button-row">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    openExternalUrl(`https://lichess.org/training/${result.calibrationTheme}`);
                  }}
                >
                  Abrir puzzles de calibração
                </button>
              </div>
              <div className="button-row">
                {calibrationOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      handleCalibrationReport(option.value);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          <div className="button-row">
            <button type="button" onClick={() => void handleApply()}>
              Usar a faixa {result.band}
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setStep('questions');
              }}
            >
              Refazer perguntas
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}
