import { useState } from 'react';
import {
  buildLearningPlanProposal,
  learnerBands,
  type DailyPlan,
  type LearnerBand,
  type LearnerProfile,
  type LearningPlanResponse,
  type SessionMinutes,
  type TrainingRoadmapItem,
  type Weakness,
} from '../domain';
import type { MethodTrackId } from '../domain/method/types';
import { LearningPlanProposalCard } from './LearningPlanProposalCard';
import { Welcome } from './Welcome';

export type OnboardingStep = 'welcome' | 'setup' | 'plan';

type OnboardingProps = {
  step: OnboardingStep;
  notice?: string;
  defaults: LearnerProfile;
  plan: DailyPlan | undefined;
  roadmap: TrainingRoadmapItem[];
  sessionMinutes: SessionMinutes;
  weaknesses: Weakness[];
  learningPlanResponse: LearningPlanResponse | undefined;
  onStartSetup: () => void;
  onQuickStart: () => Promise<void>;
  onBackToWelcome: () => void;
  onSaveProfile: (profile: LearnerProfile) => Promise<void>;
  onApprovePlan: () => Promise<void>;
  onRequestPlanRevision: (note: string) => Promise<void>;
};

const sessionOptions = [5, 15, 30, 60] satisfies SessionMinutes[];
const stepNumber: Record<OnboardingStep, number> = { welcome: 1, setup: 2, plan: 3 };

// Funil de primeira vez: uma tela por vez, só a ação necessária. As abas
// (Hoje/Progresso/Config) ficam escondidas até o aluno terminar e cair no Hoje.
export function Onboarding(props: OnboardingProps) {
  return (
    <>
      <p className="onboarding-step" aria-label={`Passo ${String(stepNumber[props.step])} de 3`}>
        Passo {stepNumber[props.step]} de 3
      </p>
      {props.step === 'welcome' ? (
        <Welcome
          {...(props.notice === undefined ? {} : { notice: props.notice })}
          onStart={props.onQuickStart}
          onConfigure={props.onStartSetup}
        />
      ) : props.step === 'setup' ? (
        <EssentialSetup defaults={props.defaults} onBack={props.onBackToWelcome} onSave={props.onSaveProfile} />
      ) : (
        <PlanStep
          plan={props.plan}
          roadmap={props.roadmap}
          sessionMinutes={props.sessionMinutes}
          weaknesses={props.weaknesses}
          learningPlanResponse={props.learningPlanResponse}
          onApprovePlan={props.onApprovePlan}
          onRequestPlanRevision={props.onRequestPlanRevision}
        />
      )}
    </>
  );
}

// Passo 2 — só o essencial: importar Lichess + Chess.com, faixa e tempo.
// Campos já vêm preenchidos, então "Salvar" é um toque. (A conexão OAuth do
// Lichess, backup e avaliação ficam na aba Config, depois do funil.)
function EssentialSetup({
  defaults,
  onBack,
  onSave,
}: {
  defaults: LearnerProfile;
  onBack: () => void;
  onSave: (profile: LearnerProfile) => Promise<void>;
}) {
  const [lichessUsername, setLichessUsername] = useState(defaults.lichessUsername ?? '');
  const [chesscomUsername, setChesscomUsername] = useState(defaults.chesscomUsername ?? '');
  const [band, setBand] = useState<LearnerBand>(defaults.band);
  const [defaultSessionMinutes, setDefaultSessionMinutes] = useState<SessionMinutes>(defaults.defaultSessionMinutes);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit() {
    setIsSaving(true);

    try {
      await onSave({
        lichessUsername: lichessUsername.trim() === '' ? undefined : lichessUsername.trim(),
        chesscomUsername: chesscomUsername.trim() === '' ? undefined : chesscomUsername.trim(),
        band,
        defaultSessionMinutes,
        goals: defaults.goals,
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="panel" aria-labelledby="setup-title">
      <button type="button" className="link-button config-back" onClick={onBack}>
        Voltar
      </button>
      <h1 id="setup-title">Vamos configurar</h1>
      <p>Só o essencial para eu montar seu plano. Dá para ajustar depois na aba Config.</p>

      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
        <label className="field">
          <span>Usuário Lichess</span>
          <small className="field-hint">
            Para criar o Study do dia e conferir puzzles, conecte o Lichess na aba Config depois de salvar.
          </small>
          <input
            autoComplete="username"
            value={lichessUsername}
            onChange={(event) => {
              setLichessUsername(event.target.value);
            }}
          />
        </label>

        <label className="field">
          <span>Usuário Chess.com</span>
          <small className="field-hint">Só dados públicos, sem login.</small>
          <input
            autoComplete="username"
            value={chesscomUsername}
            onChange={(event) => {
              setChesscomUsername(event.target.value);
            }}
          />
        </label>

        <label className="field">
          <span>Faixa atual</span>
          <small className="field-hint">Organiza o curso — não é nota. Dá para refinar com a avaliação na Config.</small>
          <select
            value={band}
            onChange={(event) => {
              setBand(event.target.value as LearnerBand);
            }}
          >
            {learnerBands.map((bandOption) => (
              <option key={bandOption} value={bandOption}>
                {bandOption}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Tempo padrão</span>
          <select
            value={defaultSessionMinutes}
            onChange={(event) => {
              setDefaultSessionMinutes(Number(event.target.value) as SessionMinutes);
            }}
          >
            {sessionOptions.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} min
              </option>
            ))}
          </select>
        </label>

        <div className="button-row">
          <button type="submit" disabled={isSaving}>
            Salvar
          </button>
        </div>
      </form>
    </section>
  );
}

// Passo 3 — aprovar o plano em tela cheia. Ao aprovar, o funil termina e o
// app cai no Hoje (a conclusão do onboarding é marcada pelo App).
function PlanStep({
  plan,
  roadmap,
  sessionMinutes,
  weaknesses,
  learningPlanResponse,
  onApprovePlan,
  onRequestPlanRevision,
}: {
  plan: DailyPlan | undefined;
  roadmap: TrainingRoadmapItem[];
  sessionMinutes: SessionMinutes;
  weaknesses: Weakness[];
  learningPlanResponse: LearningPlanResponse | undefined;
  onApprovePlan: () => Promise<void>;
  onRequestPlanRevision: (note: string) => Promise<void>;
}) {
  if (plan === undefined) {
    return (
      <section className="panel" aria-live="polite">
        <p>O professor está montando seu plano…</p>
      </section>
    );
  }

  const proposal = buildLearningPlanProposal({ plan, roadmap, sessionMinutes, weaknesses });
  const activeTrackId: MethodTrackId | undefined = plan.blocks.find(
    (block) => block.methodTrackId !== undefined,
  )?.methodTrackId;

  return (
    <section className="panel" aria-labelledby="learning-plan-title">
      <LearningPlanProposalCard
        proposal={proposal}
        response={learningPlanResponse}
        {...(activeTrackId === undefined ? {} : { activeTrackId })}
        onApprovePlan={onApprovePlan}
        onRequestPlanRevision={onRequestPlanRevision}
      />
    </section>
  );
}
