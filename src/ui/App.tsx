import { CalendarDays, ChartNoAxesColumn, Settings } from 'lucide-react';
import { Toaster } from 'sonner';
import { getTodayDate } from '../app/date';
import { useAppState } from '../app/state';
import { Config } from './Config';
import { Progress } from './Progress';
import { Today } from './Today';

export function App() {
  const appState = useAppState();
  const activeView = appState.profile === undefined ? 'config' : appState.activeView;
  const shouldShowConfig = activeView === 'config';
  const shouldShowProgress = activeView === 'progress';

  if (appState.loadState === 'loading') {
    return (
      <main className="app-shell">
        <section className="panel" aria-live="polite">
          <h1>Rotina</h1>
          <p>Carregando seus dados locais.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <Toaster richColors position="bottom-right" />
      <nav className="top-nav" aria-label="Navegação principal">
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
          onConnectLichess={appState.connectLichess}
          onDisconnectLichess={appState.disconnectLichess}
          onImportKnownManualSignals={appState.importKnownManualSignals}
          onExport={appState.exportBackup}
          onImportBackup={appState.importBackup}
          onClear={appState.clearAllData}
        />
      ) : shouldShowProgress ? (
        <Progress
          today={appState.todayPlan?.date ?? getTodayDate()}
          allTrainingLogs={appState.allTrainingLogs}
          diplomaAttempts={appState.diplomaAttempts}
          weaknesses={appState.weaknesses}
        />
      ) : (
        <Today
          plan={appState.todayPlan}
          roadmap={appState.roadmap}
          sessionMinutes={appState.sessionMinutes}
          trainingLogs={appState.trainingLogs}
          allTrainingLogs={appState.allTrainingLogs}
          pendingItems={appState.pendingItems}
          diplomaAttempts={appState.diplomaAttempts}
          weaknesses={appState.weaknesses}
          diagnosisState={appState.diagnosisState}
          diagnosisMessage={appState.diagnosisMessage}
          lichessConnectionState={appState.lichessConnectionState}
          lichessMessage={appState.lichessMessage}
          lichessStudyLink={appState.lichessStudyLink}
          onSessionMinutesChange={appState.regeneratePlan}
          onCreateNextSession={appState.createNextSession}
          onAnswerTutorQuestion={appState.answerTutorQuestion}
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
