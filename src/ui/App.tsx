import { CalendarDays, ChartNoAxesColumn, Settings } from 'lucide-react';
import { Suspense, lazy, useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { getTodayDate } from '../app/date';
import { useAppState } from '../app/state';
import { LemosAvatar } from './art/LemosAvatar';
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
  const activeView = appState.profile === undefined ? 'config' : appState.activeView;
  const shouldShowConfig = activeView === 'config';
  const shouldShowProgress = activeView === 'progress';

  if (appState.loadState === 'loading') {
    return (
      <main className="app-shell">
        <section className="panel loading-panel" aria-live="polite">
          <img
            src="/art/lemos-pose-boas-vindas.webp"
            alt=""
            aria-hidden="true"
            className="loading-art"
            width={180}
            height={180}
          />
          <span className="brand brand-loading" aria-hidden="true">
            Rotina
          </span>
          <p>O professor está arrumando o tabuleiro.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <Toaster richColors theme={getPreferredToastTheme()} position="bottom-right" />
      <nav className="top-nav" aria-label="Navegação principal">
        <span className="brand" aria-hidden="true">
          <LemosAvatar size={26} className="brand-avatar" />
          <span>Rotina</span>
        </span>
        <button
          className={activeView === 'today' ? 'nav-button nav-button-active' : 'nav-button'}
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
          trainingLogs={appState.trainingLogs}
          allTrainingLogs={appState.allTrainingLogs}
          pendingItems={appState.pendingItems}
          diplomaAttempts={appState.diplomaAttempts}
          achievements={appState.achievements}
          weaknesses={appState.weaknesses}
          diagnosisState={appState.diagnosisState}
          diagnosisMessage={appState.diagnosisMessage}
          lichessConnectionState={appState.lichessConnectionState}
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
