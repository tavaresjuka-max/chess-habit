import { useAppState } from '../app/state';
import { Config } from './Config';
import { Today } from './Today';
import { Toaster } from 'sonner';

export function App() {
  const appState = useAppState();
  const shouldShowConfig = appState.activeView === 'config' || appState.profile === undefined;

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
          className={shouldShowConfig ? 'nav-button' : 'nav-button nav-button-active'}
          type="button"
          onClick={() => {
            appState.setActiveView('today');
          }}
        >
          Hoje
        </button>
        <button
          className={shouldShowConfig ? 'nav-button nav-button-active' : 'nav-button'}
          type="button"
          onClick={() => {
            appState.setActiveView('config');
          }}
        >
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
          onSave={appState.saveProfile}
          onConnectLichess={appState.connectLichess}
          onDisconnectLichess={appState.disconnectLichess}
          onImportKnownManualSignals={appState.importKnownManualSignals}
          onExport={appState.exportBackup}
          onClear={appState.clearAllData}
        />
      ) : (
        <Today
          plan={appState.todayPlan}
          roadmap={appState.roadmap}
          sessionMinutes={appState.sessionMinutes}
          trainingLogs={appState.trainingLogs}
          weaknesses={appState.weaknesses}
          diagnosisState={appState.diagnosisState}
          diagnosisMessage={appState.diagnosisMessage}
          lichessConnectionState={appState.lichessConnectionState}
          lichessMessage={appState.lichessMessage}
          lichessStudyLink={appState.lichessStudyLink}
          onSessionMinutesChange={appState.regeneratePlan}
          onCreateNextSession={appState.createNextSession}
          onSyncChesscomDiagnosis={appState.syncChesscomDiagnosis}
          onSyncLichessDiagnosis={appState.syncLichessDiagnosis}
          onReconcileLichessResults={appState.reconcileLichessResults}
          onCreateLichessStudy={appState.createLichessStudy}
          onStartBlockTraining={appState.startBlockTraining}
          onCompleteBlockTraining={appState.completeBlockTraining}
          onSkipBlockTraining={appState.skipBlockTraining}
        />
      )}
    </main>
  );
}
