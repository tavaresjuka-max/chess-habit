import { CalendarDays, ChartNoAxesColumn, Settings, Stethoscope } from 'lucide-react';
import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { Toaster } from 'sonner';
import { getTodayDate } from '../app/date';
import { createDefaultProfile, useAppState } from '../app/state';
import {
  APP_COPYRIGHT,
  APP_LEGAL_DISCLAIMER,
  APP_NAME,
  DONATION_URL,
  FEEDBACK_URL,
  PRIVACY_SUMMARY,
} from '../config/appIdentity';
import { TavarezAvatar } from './art/TavarezAvatar';
import { DiplomaCelebration } from './DiplomaCelebration';
import { Onboarding, type OnboardingStep } from './Onboarding';
import { ReloadPrompt } from './ReloadPrompt';
import { Today } from './Today';

// Fase do funil de primeira vez. Fica em sessionStorage para sobreviver ao
// redirect do OAuth do Lichess (que recarrega o app): ao voltar conectado,
// retomamos direto na tela "Importando" em vez de reiniciar o funil.
type FunnelPhase = 'welcome' | 'consent' | 'accounts' | 'importing' | 'questions' | 'plan';
const ONBOARDING_PHASE_KEY = 'rotina:onboarding-phase';

function readStoredFunnelPhase(): FunnelPhase | undefined {
  try {
    const stored = sessionStorage.getItem(ONBOARDING_PHASE_KEY);
    if (
      stored === 'consent' ||
      stored === 'accounts' ||
      stored === 'importing' ||
      stored === 'questions' ||
      stored === 'plan'
    ) {
      return stored;
    }
  } catch {
    // sessionStorage pode falhar (modo privado/iframe); o funil começa do início.
  }

  return undefined;
}

// Hoje é a tela padrão e fica no chunk principal; Config, Progresso e Autópsia
// chegam sob demanda (code-split) para encurtar o carregamento inicial no
// celular — Autópsia carrega `chessops` (parser SAN/FEN), que senão infla o
// chunk principal para quem nunca usa a função.
const Config = lazy(() => import('./Config').then((module) => ({ default: module.Config })));
const Progress = lazy(() => import('./Progress').then((module) => ({ default: module.Progress })));
const AutopsyView = lazy(() => import('./AutopsyView').then((module) => ({ default: module.AutopsyView })));

// O app força o tema verde/escuro sempre (ver index.css, "@media all"), então o
// toast também é sempre escuro — independe do prefers-color-scheme do SO.
function getPreferredToastTheme(): 'light' | 'dark' {
  return 'dark';
}

function ViewFallback() {
  // A região live monta vazia e o texto entra por mutação: leitores de tela
  // só anunciam mudanças DENTRO de uma região já presente no DOM.
  const [message, setMessage] = useState('');

  useEffect(() => {
    setMessage('Carregando…');
  }, []);

  return (
    <section className="panel" aria-live="polite">
      {message === '' ? null : <p>{message}</p>}
    </section>
  );
}

export function LegalFooter() {
  return (
    <footer className="legal-footer" aria-label={`Avisos legais de ${APP_NAME}`}>
      <span>{APP_LEGAL_DISCLAIMER}</span>
      <span>{APP_COPYRIGHT}</span>
      <details className="privacy-disclosure">
        <summary>Privacidade e seus dados</summary>
        <ul>
          {PRIVACY_SUMMARY.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </details>
      <a
        href="/docs/legal/termos-de-servico.md"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Termos de serviço (abre em nova aba)"
      >
        Termos de serviço
      </a>
      {FEEDBACK_URL === undefined ? null : (
        <a
          href={FEEDBACK_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="Enviar feedback (abre em nova aba)"
        >
          Enviar feedback
        </a>
      )}
      {DONATION_URL === undefined ? null : (
        <a href={DONATION_URL} target="_blank" rel="noreferrer" aria-label="Apoiar o projeto (abre em nova aba)">
          Apoiar
        </a>
      )}
    </footer>
  );
}

export function App() {
  const appState = useAppState();
  // Funil de primeira vez: Boas-vindas → Suas contas → Importando →
  // (Avaliação?) → Aprovar plano → Hoje. A fase fica em sessionStorage para
  // sobreviver ao redirect do OAuth do Lichess.
  const [funnelPhase, setFunnelPhaseState] = useState<FunnelPhase>(() => readStoredFunnelPhase() ?? 'welcome');
  const funnelRef = useRef<HTMLElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);

  const setFunnelPhase = useCallback((phase: FunnelPhase) => {
    try {
      sessionStorage.setItem(ONBOARDING_PHASE_KEY, phase);
    } catch {
      // Sem sessionStorage o funil ainda funciona; só não resume após o OAuth.
    }
    setFunnelPhaseState(phase);
  }, []);

  const onboardingDone = appState.onboardingCompletedAt !== undefined;
  const planApproved = appState.todayPlan?.learningPlanResponse?.status === 'approved';
  // App principal só com perfil presente; resolvido por flag persistida OU por
  // plano aprovado (cobre quem já usava antes do funil existir).
  const onboardingResolved = appState.profile !== undefined && (onboardingDone || planApproved);
  // PROD-3: convite de calibração para quem entrou sem contas e ainda não calibrou
  // (sem dado para auto-diagnóstico). Some ao calibrar (achievement 'calibrado') ou ao
  // conectar uma conta. A banda sobe sozinha depois; este é só um atalho opcional.
  const showCalibrationInvite =
    appState.profile !== undefined &&
    (appState.profile.lichessUsername ?? '').trim() === '' &&
    (appState.profile.chesscomUsername ?? '').trim() === '' &&
    !appState.achievements.some((achievement) => achievement.id === 'calibrado');
  // Sem perfil: boas-vindas, consentimento ou o formulário de contas. Com
  // perfil: a fase guiada (importando/avaliação/plano); 'welcome' aqui é um
  // usuário migrado sem fase salva — mostramos o plano para aprovar.
  const onboardingStep: OnboardingStep =
    appState.profile === undefined
      ? funnelPhase === 'consent'
        ? 'consent'
        : funnelPhase === 'accounts'
          ? 'accounts'
          : 'welcome'
      : funnelPhase === 'welcome'
        ? 'plan'
        : funnelPhase === 'consent'
          ? 'consent'
          : funnelPhase;

  // Marca a conclusão quando perfil existe e o plano foi aprovado (fim do funil
  // ou migração de usuário antigo). Persiste para reabrir direto no Hoje e
  // limpa a fase do funil para não vazar para uma sessão futura.
  useEffect(() => {
    if (!onboardingDone && appState.profile !== undefined && planApproved) {
      try {
        sessionStorage.removeItem(ONBOARDING_PHASE_KEY);
      } catch {
        // Ignorado: limpar a fase é só higiene, não muda o estado resolvido.
      }
      void appState.completeOnboarding();
    }
  }, [onboardingDone, planApproved, appState.profile, appState.completeOnboarding]);

  // Foco vai para a tela do passo a cada transição do funil (acessibilidade).
  useEffect(() => {
    if (!onboardingResolved) {
      funnelRef.current?.focus();
    }
  }, [onboardingStep, onboardingResolved]);

  const activeView = appState.activeView;
  const shouldShowConfig = activeView === 'config';
  const shouldShowProgress = activeView === 'progress';
  const shouldShowAutopsy = activeView === 'autopsy';

  const didMountFocusRef = useRef(false);
  useEffect(() => {
    if (!onboardingResolved) {
      return;
    }

    // Não rouba o foco na primeira pintura; move para o conteúdo principal quando
    // o usuário TROCA de aba — inclusive ao VOLTAR para o Hoje, que antes ficava
    // sem foco e obrigava o teclado a re-tabular toda a navegação.
    if (!didMountFocusRef.current) {
      didMountFocusRef.current = true;
      return;
    }

    // Ao TROCAR de aba, a nova tela sempre abre no topo. O container de scroll é a
    // página (top-nav é sticky), então rolamos a janela; sem isto, a rolagem da aba
    // anterior "vazava" para a nova (ex.: descer no Hoje e abrir Ajustes já rolado).
    // preventScroll no focus para o foco de acessibilidade não desfazer o scrollTo.
    window.scrollTo(0, 0);
    viewRef.current?.focus({ preventScroll: true });
  }, [activeView, onboardingResolved]);

  if (appState.loadState === 'loading') {
    return (
      <main className="app-shell">
        <section className="panel loading-panel" aria-live="polite">
          <img
            src="/art/loading-tavarez.webp"
            alt=""
            aria-hidden="true"
            className="loading-art"
            width={220}
            height={220}
          />
          <span className="brand brand-loading" aria-hidden="true">
            {APP_NAME}
          </span>
          <p>O professor está arrumando o tabuleiro.</p>
        </section>
      </main>
    );
  }

  // Funil de primeira vez: sem abas, uma tela por vez.
  if (!onboardingResolved) {
    return (
      <main className="app-shell onboarding-shell" ref={funnelRef} tabIndex={-1}>
        <Toaster richColors theme={getPreferredToastTheme()} position="bottom-right" />
        <ReloadPrompt />
        {appState.errorMessage !== undefined ? (
          <div className="app-error" role="alert">
            {appState.errorMessage}
          </div>
        ) : null}
        <Onboarding
          step={onboardingStep}
          {...(appState.lichessMessage === undefined ? {} : { notice: appState.lichessMessage })}
          defaults={appState.profile ?? createDefaultProfile()}
          plan={appState.todayPlan}
          roadmap={appState.roadmap}
          sessionMinutes={appState.sessionMinutes}
          weaknesses={appState.weaknesses}
          learningPlanResponse={appState.todayPlan?.learningPlanResponse}
          onStartSetup={() => {
            // Consentimento ANTES de coletar/usar dados: novo usuário passa por
            // 'consent' logo após 'welcome'. Quem já consentiu pula direto.
            setFunnelPhase(appState.consentedAt === undefined ? 'consent' : 'accounts');
          }}
          onAcceptConsent={async (researchOptIn) => {
            await appState.acceptConsent(researchOptIn);
            setFunnelPhase('accounts');
          }}
          onQuickStart={async () => {
            // "Começar rápido" também registra consentimento (opt-in por padrão);
            // o usuário ajusta depois no fold de Privacidade da Config.
            if (appState.consentedAt === undefined) {
              await appState.acceptConsent(true);
            }
            await appState.saveProfile(createDefaultProfile());
            setFunnelPhase('plan');
          }}
          onBackToWelcome={() => {
            setFunnelPhase('welcome');
          }}
          onContinueAccounts={async (nextProfile) => {
            await appState.saveProfile(nextProfile, { autoSync: false });
            const hasAccount =
              (nextProfile.lichessUsername ?? '').trim() !== '' ||
              (nextProfile.chesscomUsername ?? '').trim() !== '';
            setFunnelPhase(hasAccount ? 'importing' : 'questions');
          }}
          onConnectLichess={async (nextProfile) => {
            // Salva o usuário e fixa a fase ANTES do redirect: ao voltar do
            // Lichess, o boot lê 'importing' do sessionStorage e retoma ali.
            await appState.saveProfile(nextProfile, { autoSync: false });
            setFunnelPhase('importing');
            await appState.connectLichess();
          }}
          onRunImport={() => appState.runOnboardingImport(appState.profile ?? createDefaultProfile())}
          onImportDone={({ confidentWeaknessCount }) => {
            // Só pula a calibração quando há fraqueza CONFIÁVEL (amostra suficiente).
            // Poucos jogos geram só sinais de baixa confiança → vai para a calibração.
            setFunnelPhase(confidentWeaknessCount > 0 ? 'plan' : 'questions');
          }}
          onApplyPlacement={async (placement) => {
            await appState.savePlacementResult({
              band: placement.band,
              confidence: placement.confidence,
              calibrated: placement.calibrated,
              completedAt: new Date().toISOString(),
            });
            if (appState.profile !== undefined) {
              await appState.saveProfile(
                { ...appState.profile, band: placement.band, updatedAt: new Date().toISOString() },
                { autoSync: false },
              );
            }
            setFunnelPhase('plan');
          }}
          onSkipQuestions={() => {
            setFunnelPhase('plan');
          }}
          onApprovePlan={appState.approveLearningPlan}
          onRequestPlanRevision={appState.requestLearningPlanRevision}
        />
        <LegalFooter />
      </main>
    );
  }

  return (
    <main className="app-shell">
      <Toaster richColors theme={getPreferredToastTheme()} position="bottom-right" />
      <ReloadPrompt />
      <DiplomaCelebration diplomaAttempts={appState.diplomaAttempts} />
      <a className="skip-link" href="#main-content">
        Pular para o conteúdo
      </a>
      <nav className="top-nav" aria-label="Navegação principal">
        <span className="brand" aria-hidden="true">
          <TavarezAvatar size={26} className="brand-avatar" />
          <span>{APP_NAME}</span>
        </span>
        <button
          className={activeView === 'today' ? 'nav-button nav-button-active' : 'nav-button'}
          aria-current={activeView === 'today' ? 'page' : undefined}
          type="button"
          onClick={() => {
            appState.setActiveView('today');
          }}
        >
          <CalendarDays aria-hidden="true" size={16} />
          Hoje
        </button>
        <button
          className={shouldShowProgress ? 'nav-button nav-button-active' : 'nav-button'}
          aria-current={shouldShowProgress ? 'page' : undefined}
          type="button"
          onClick={() => {
            appState.setActiveView('progress');
          }}
        >
          <ChartNoAxesColumn aria-hidden="true" size={16} />
          Progresso
        </button>
        <button
          className={shouldShowAutopsy ? 'nav-button nav-button-active' : 'nav-button'}
          aria-current={shouldShowAutopsy ? 'page' : undefined}
          type="button"
          onClick={() => {
            appState.setActiveView('autopsy');
          }}
        >
          <Stethoscope aria-hidden="true" size={16} />
          Autópsia
        </button>
        <button
          className={shouldShowConfig ? 'nav-button nav-button-active' : 'nav-button'}
          aria-current={shouldShowConfig ? 'page' : undefined}
          type="button"
          onClick={() => {
            appState.setActiveView('config');
          }}
        >
          <Settings aria-hidden="true" size={16} />
          Ajustes
        </button>
      </nav>

      {appState.errorMessage !== undefined ? (
        <div className="app-error" role="alert">
          {appState.errorMessage}
          {appState.loadState === 'error' ? (
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                window.location.assign(window.location.pathname);
              }}
            >
              Recarregar
            </button>
          ) : null}
        </div>
      ) : null}

      <div id="main-content" className="view-content" ref={viewRef} tabIndex={-1}>
        {shouldShowConfig ? (
          <Suspense fallback={<ViewFallback />}>
            <Config
              profile={appState.profile}
              lichessToken={appState.lichessToken}
              lichessConnectionState={appState.lichessConnectionState}
              lichessMessage={appState.lichessMessage}
              storagePersistence={appState.storagePersistence}
              backupMeta={appState.backupMeta}
              autoBackupStatus={appState.autoBackupStatus}
              autoBackupFileName={appState.autoBackupFileName}
              onEnableAutoBackup={appState.enableAutoBackup}
              onDisableAutoBackup={appState.disableAutoBackup}
              onSave={appState.saveProfile}
              onSavePlacementResult={appState.savePlacementResult}
              onConnectLichess={appState.connectLichess}
              onDisconnectLichess={appState.disconnectLichess}
              onImportKnownManualSignals={appState.importKnownManualSignals}
              onExport={appState.exportBackup}
              onImportBackup={appState.importBackup}
              onClear={appState.clearAllData}
              errorCaptureEnabled={appState.errorCaptureEnabled}
              onToggleErrorCapture={appState.setErrorCapture}
              onExportErrorLog={appState.exportErrorLog}
              {...(appState.consentedAt === undefined ? {} : { consentedAt: appState.consentedAt })}
              {...(appState.researchOptIn === undefined ? {} : { researchOptIn: appState.researchOptIn })}
              onToggleResearchOptIn={appState.setResearchOptIn}
            />
          </Suspense>
        ) : shouldShowProgress ? (
          <Suspense fallback={<ViewFallback />}>
            <Progress
              today={appState.todayPlan?.date ?? getTodayDate()}
              allTrainingLogs={appState.allTrainingLogs}
              diplomaAttempts={appState.diplomaAttempts}
              achievements={appState.achievements}
              weaknesses={appState.weaknesses}
              signals={appState.signals}
              sessionMinutes={appState.sessionMinutes}
              learnerBand={appState.profile.band}
              weeklyFocusTag={appState.todayPlan?.weeklyFocus?.tag}
              pendingItems={appState.pendingItems}
              diagnosisState={appState.diagnosisState}
              diagnosisMessage={appState.diagnosisMessage}
              lichessConnectionState={appState.lichessConnectionState}
              lichessConnected={appState.lichessToken !== undefined}
              lichessMessage={appState.lichessMessage}
              lichessStudyLink={appState.lichessStudyLink}
              onConnectLichess={appState.connectLichess}
              onSyncChesscomDiagnosis={appState.syncChesscomDiagnosis}
              onSyncLichessDiagnosis={appState.syncLichessDiagnosis}
              onCreateLichessStudy={appState.createLichessStudy}
            />
          </Suspense>
        ) : shouldShowAutopsy ? (
          <Suspense fallback={<ViewFallback />}>
            <AutopsyView lichessUsername={appState.profile.lichessUsername} />
          </Suspense>
        ) : (
          <Today
            plan={appState.todayPlan}
            roadmap={appState.roadmap}
            sessionMinutes={appState.sessionMinutes}
            learnerBand={appState.profile.band}
            trainingLogs={appState.trainingLogs}
            allTrainingLogs={appState.allTrainingLogs}
            pendingItems={appState.pendingItems}
            achievements={appState.achievements}
            weaknesses={appState.weaknesses}
            lichessConnectionState={appState.lichessConnectionState}
            backupMeta={appState.backupMeta}
            onSessionMinutesChange={appState.regeneratePlan}
            onCreateNextSession={appState.createNextSession}
            onAnswerTutorQuestion={appState.answerTutorQuestion}
            onImportFreeActivity={appState.importFreeActivity}
            onReconcileLichessResults={appState.reconcileLichessResults}
            onApproveLearningPlan={appState.approveLearningPlan}
            onRequestLearningPlanRevision={appState.requestLearningPlanRevision}
            onOpenPendingItem={appState.openPendingItem}
            onDeferPendingItem={appState.deferPendingItem}
            onSavePendingFromHardFeedback={appState.savePendingFromHardFeedback}
            onStartBlockTraining={appState.startBlockTraining}
            onCompleteBlockTraining={appState.completeBlockTraining}
            onSkipBlockTraining={appState.skipBlockTraining}
            showCalibrationInvite={showCalibrationInvite}
            onStartCalibration={() => {
              appState.setActiveView('config');
            }}
          />
        )}
      </div>

      <LegalFooter />
    </main>
  );
}
