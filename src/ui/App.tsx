import { CalendarDays, ChartNoAxesColumn, Settings } from 'lucide-react';
import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Toaster } from 'sonner';
import { getTodayDate } from '../app/date';
import { createDefaultProfile, useAppState } from '../app/state';
import { LemosAvatar } from './art/LemosAvatar';
import { Onboarding, type OnboardingStep } from './Onboarding';
import { ReloadPrompt } from './ReloadPrompt';
import { Today } from './Today';

// Hoje é a tela padrão e fica no chunk principal; Config e Progresso chegam
// sob demanda (code-split) para encurtar o carregamento inicial no celular.
const Config = lazy(() => import('./Config').then((module) => ({ default: module.Config })));
const Progress = lazy(() => import('./Progress').then((module) => ({ default: module.Progress })));

// jsdom nao implementa matchMedia; o tema do toast cai em light nos testes.
function getPreferredToastTheme(): 'light' | 'dark' {
  if (typeof window.matchMedia !== 'function') {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
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

export function App() {
  const appState = useAppState();
  // Funil de primeira vez: avança Boas-vindas → Configurar → Aprovar plano →
  // Hoje. startedSetup distingue Boas-vindas de Configurar (não persiste).
  const [startedSetup, setStartedSetup] = useState(false);
  const funnelRef = useRef<HTMLElement>(null);

  const onboardingDone = appState.onboardingCompletedAt !== undefined;
  const planApproved = appState.todayPlan?.learningPlanResponse?.status === 'approved';
  // App principal só com perfil presente; resolvido por flag persistida OU por
  // plano aprovado (cobre quem já usava antes do funil existir).
  const onboardingResolved = appState.profile !== undefined && (onboardingDone || planApproved);
  const onboardingStep: OnboardingStep =
    appState.profile === undefined ? (startedSetup ? 'setup' : 'welcome') : 'plan';

  // Marca a conclusão quando perfil existe e o plano foi aprovado (fim do funil
  // ou migração de usuário antigo). Persiste para reabrir direto no Hoje.
  useEffect(() => {
    if (!onboardingDone && appState.profile !== undefined && planApproved) {
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

  if (appState.loadState === 'loading') {
    return (
      <main className="app-shell">
        <section className="panel loading-panel" aria-live="polite">
          <img
            src="/art/loading-lemos.webp"
            alt=""
            aria-hidden="true"
            className="loading-art"
            width={220}
            height={220}
          />
          <span className="brand brand-loading" aria-hidden="true">
            Rotina
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
          <p className="app-error" role="alert">
            {appState.errorMessage}
          </p>
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
            setStartedSetup(true);
          }}
          onQuickStart={async () => {
            await appState.saveProfile(createDefaultProfile());
          }}
          onBackToWelcome={() => {
            setStartedSetup(false);
          }}
          onSaveProfile={appState.saveProfile}
          onApprovePlan={appState.approveLearningPlan}
          onRequestPlanRevision={appState.requestLearningPlanRevision}
        />
      </main>
    );
  }

  return (
    <main className="app-shell">
      <Toaster richColors theme={getPreferredToastTheme()} position="bottom-right" />
      <ReloadPrompt />
      <nav className="top-nav" aria-label="Navegação principal">
        <span className="brand" aria-hidden="true">
          <LemosAvatar size={26} className="brand-avatar" />
          <span>Rotina</span>
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
          className={shouldShowConfig ? 'nav-button nav-button-active' : 'nav-button'}
          aria-current={shouldShowConfig ? 'page' : undefined}
          type="button"
          onClick={() => {
            appState.setActiveView('config');
          }}
        >
          <Settings aria-hidden="true" size={16} />
          Config
        </button>
      </nav>

      {appState.errorMessage !== undefined ? (
        <p className="app-error" role="alert">
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
        </p>
      ) : null}

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
          />
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
          diplomaAttempts={appState.diplomaAttempts}
          achievements={appState.achievements}
          weaknesses={appState.weaknesses}
          diagnosisState={appState.diagnosisState}
          diagnosisMessage={appState.diagnosisMessage}
          lichessConnectionState={appState.lichessConnectionState}
          lichessConnected={appState.lichessToken !== undefined}
          lichessMessage={appState.lichessMessage}
          lichessStudyLink={appState.lichessStudyLink}
          onSessionMinutesChange={appState.regeneratePlan}
          onCreateNextSession={appState.createNextSession}
          onAnswerTutorQuestion={appState.answerTutorQuestion}
          onImportFreeActivity={appState.importFreeActivity}
          onSyncChesscomDiagnosis={appState.syncChesscomDiagnosis}
          onSyncLichessDiagnosis={appState.syncLichessDiagnosis}
          onReconcileLichessResults={appState.reconcileLichessResults}
          onCreateLichessStudy={appState.createLichessStudy}
          onConnectLichess={appState.connectLichess}
          onApproveLearningPlan={appState.approveLearningPlan}
          onRequestLearningPlanRevision={appState.requestLearningPlanRevision}
          onOpenPendingItem={appState.openPendingItem}
          onDeferPendingItem={appState.deferPendingItem}
          onSavePendingFromHardFeedback={appState.savePendingFromHardFeedback}
          onStartBlockTraining={appState.startBlockTraining}
          onCompleteBlockTraining={appState.completeBlockTraining}
          onSkipBlockTraining={appState.skipBlockTraining}
        />
      )}
    </main>
  );
}
