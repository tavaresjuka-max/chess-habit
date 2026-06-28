import { useEffect, useRef, useState } from 'react';
import {
  buildLearningPlanProposal,
  betaEligibleBands,
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
import { PlacementCard, type PlacementApplication } from './PlacementCard';
import { Welcome } from './Welcome';
import { ConsentStep } from './ConsentStep';

export type OnboardingStep = 'welcome' | 'consent' | 'accounts' | 'importing' | 'questions' | 'plan';

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
  // Grava consentedAt + researchOptIn e avança para 'accounts'. Opcional:
  // quando ausente o passo 'consent' não é exibido (ex.: testes legados).
  onAcceptConsent?: (researchOptIn: boolean) => Promise<void>;
  // Salva o perfil (sem auto-sync) e segue: com conta → Importando; sem conta → Avaliação.
  onContinueAccounts: (profile: LearnerProfile) => Promise<void>;
  // Salva o perfil e dispara o OAuth do Lichess (redireciona; volta na tela Importando).
  onConnectLichess: (profile: LearnerProfile) => Promise<void>;
  // Executa a importação awaitada e devolve a contagem de fraquezas (total e confiáveis).
  onRunImport: () => Promise<{ weaknessCount: number; confidentWeaknessCount: number }>;
  // Roteia após a importação: com fraqueza CONFIÁVEL → plano; sem → avaliação.
  onImportDone: (result: { weaknessCount: number; confidentWeaknessCount: number }) => void;
  onApplyPlacement: (placement: PlacementApplication) => Promise<void>;
  onSkipQuestions: () => void;
  onApprovePlan: () => Promise<void>;
  onRequestPlanRevision: (note: string) => Promise<void>;
};

const sessionOptions = [5, 15, 30, 60] satisfies SessionMinutes[];

// O caminho do funil tem comprimento variável (com/sem dados, com/sem conta),
// então em vez de "Passo X de N" mostramos o nome da etapa atual.
const stepLabel: Record<OnboardingStep, string> = {
  welcome: 'Boas-vindas',
  consent: 'Privacidade',
  accounts: 'Suas contas',
  importing: 'Importando',
  questions: 'Avaliação de entrada',
  plan: 'Seu plano',
};

// Funil de primeira vez: uma tela por vez, só a ação necessária. As abas
// (Hoje/Progresso/Config) ficam escondidas até o aluno terminar e cair no Hoje.
export function Onboarding(props: OnboardingProps) {
  return (
    <>
      <p className="onboarding-step">{stepLabel[props.step]}</p>
      {props.step === 'welcome' ? (
        <Welcome
          {...(props.notice === undefined ? {} : { notice: props.notice })}
          onStart={props.onQuickStart}
          onConfigure={props.onStartSetup}
        />
      ) : props.step === 'consent' && props.onAcceptConsent !== undefined ? (
        <ConsentStep onAccept={props.onAcceptConsent} />
      ) : props.step === 'accounts' ? (
        <AccountsStep
          defaults={props.defaults}
          onBack={props.onBackToWelcome}
          onContinue={props.onContinueAccounts}
          onConnectLichess={props.onConnectLichess}
        />
      ) : props.step === 'importing' ? (
        <ImportingStep
          profile={props.defaults}
          onRunImport={props.onRunImport}
          onImportDone={props.onImportDone}
        />
      ) : props.step === 'questions' ? (
        <QuestionsStep
          defaults={props.defaults}
          onApplyPlacement={props.onApplyPlacement}
          onSkip={props.onSkipQuestions}
        />
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

// Passo 2 — contas + faixa + tempo. O usuário pode informar Lichess e/ou
// Chess.com (ou nenhum), opcionalmente conectar o Lichess (OAuth, melhora
// puzzles/Study) e seguir. Conectar e Continuar salvam o perfil antes.
function AccountsStep({
  defaults,
  onBack,
  onContinue,
  onConnectLichess,
}: {
  defaults: LearnerProfile;
  onBack: () => void;
  onContinue: (profile: LearnerProfile) => Promise<void>;
  onConnectLichess: (profile: LearnerProfile) => Promise<void>;
}) {
  const [lichessUsername, setLichessUsername] = useState(defaults.lichessUsername ?? '');
  const [chesscomUsername, setChesscomUsername] = useState(defaults.chesscomUsername ?? '');
  const [band, setBand] = useState<LearnerBand>(defaults.band);
  const [defaultSessionMinutes, setDefaultSessionMinutes] = useState<SessionMinutes>(defaults.defaultSessionMinutes);
  const [busy, setBusy] = useState(false);

  function buildProfile(): LearnerProfile {
    return {
      lichessUsername: lichessUsername.trim() === '' ? undefined : lichessUsername.trim(),
      chesscomUsername: chesscomUsername.trim() === '' ? undefined : chesscomUsername.trim(),
      band,
      defaultSessionMinutes,
      goals: defaults.goals,
      updatedAt: new Date().toISOString(),
    };
  }

  async function handleContinue() {
    setBusy(true);
    try {
      await onContinue(buildProfile());
    } finally {
      setBusy(false);
    }
  }

  async function handleConnectLichess() {
    setBusy(true);
    try {
      await onConnectLichess(buildProfile());
    } finally {
      setBusy(false);
    }
  }

  const hasLichess = lichessUsername.trim() !== '';

  return (
    <section className="panel" aria-labelledby="accounts-title">
      <button type="button" className="link-button config-back" onClick={onBack}>
        Voltar
      </button>
      <h1 id="accounts-title">Suas contas</h1>
      <p>
        Informe onde você joga para eu buscar suas partidas. Não joga online? Deixe em branco e
        continue — eu faço algumas perguntas para calibrar.
      </p>

      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          void handleContinue();
        }}
      >
        <label className="field">
          <span>Usuário Lichess</span>
          <small className="field-hint">Buscamos suas partidas públicas. Conectar é opcional (melhora puzzles e Study).</small>
          <input
            autoComplete="username"
            value={lichessUsername}
            onChange={(event) => {
              setLichessUsername(event.target.value);
            }}
          />
        </label>

        {hasLichess ? (
          <div className="button-row">
            <button type="button" className="secondary-button" disabled={busy} onClick={() => void handleConnectLichess()}>
              Conectar Lichess (opcional)
            </button>
          </div>
        ) : null}

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
          <small className="field-hint">Organiza o curso — não é nota. Dá para refinar com a avaliação.</small>
          <select
            value={band}
            onChange={(event) => {
              setBand(event.target.value as LearnerBand);
            }}
          >
            {betaEligibleBands.map((bandOption) => (
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
          <button type="submit" disabled={busy}>
            Continuar
          </button>
        </div>
      </form>
    </section>
  );
}

// Passo 3 — importação real com loading. Ao montar, dispara a importação
// awaitada (uma única vez, mesmo sob StrictMode) e, ao terminar, devolve a
// contagem de fraquezas para o App decidir a próxima tela.
function ImportingStep({
  profile,
  onRunImport,
  onImportDone,
}: {
  profile: LearnerProfile;
  onRunImport: () => Promise<{ weaknessCount: number; confidentWeaknessCount: number }>;
  onImportDone: (result: { weaknessCount: number; confidentWeaknessCount: number }) => void;
}) {
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;

    void (async () => {
      const result = await onRunImport();
      onImportDone(result);
    })();
  }, [onRunImport, onImportDone]);

  const sources = [
    (profile.lichessUsername ?? '').trim() === '' ? undefined : 'Lichess',
    (profile.chesscomUsername ?? '').trim() === '' ? undefined : 'Chess.com',
  ].filter((source): source is string => source !== undefined);

  return (
    <section className="panel loading-panel" aria-live="polite" aria-busy="true">
      <img
        src="/art/loading-tavarez.webp"
        alt=""
        aria-hidden="true"
        className="loading-art"
        width={220}
        height={220}
      />
      <h1>Buscando suas partidas…</h1>
      <p>
        {sources.length === 0
          ? 'Organizando seu diagnóstico.'
          : `Importando do ${sources.join(' e ')}. Isso pode levar alguns segundos.`}
      </p>
      <p className="config-hint">O professor está lendo seus jogos para montar o plano com dados reais.</p>
    </section>
  );
}

// Passo 4 (condicional) — avaliação de entrada. Aparece para quem não tem conta
// ou cujo histórico ainda não deu sinal concentrado o bastante. Reusa o
// PlacementCard já entrando nas perguntas.
function QuestionsStep({
  defaults,
  onApplyPlacement,
  onSkip,
}: {
  defaults: LearnerProfile;
  onApplyPlacement: (placement: PlacementApplication) => Promise<void>;
  onSkip: () => void;
}) {
  const hasAccount =
    (defaults.lichessUsername ?? '').trim() !== '' || (defaults.chesscomUsername ?? '').trim() !== '';

  return (
    <section className="panel" aria-labelledby="questions-title">
      <h1 id="questions-title">Vamos calibrar seu plano</h1>
      <p>
        {hasAccount
          ? 'Seus jogos ainda não deram um sinal concentrado o bastante. Sem problema — três perguntas rápidas acham sua faixa.'
          : 'Sem partidas para analisar ainda, três perguntas rápidas acham seu ponto de partida.'}
      </p>

      <PlacementCard hideHeading currentBand={defaults.band} initialStep="questions" onApplyBand={onApplyPlacement} />

      <div className="button-row">
        <button type="button" className="link-button" onClick={onSkip}>
          Pular e usar a faixa {defaults.band}
        </button>
      </div>
    </section>
  );
}

// Passo final — aprovar o plano em tela cheia. Ao aprovar, o funil termina e o
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
