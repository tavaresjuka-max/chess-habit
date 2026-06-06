import { useAppState } from '../app/state';
import { Config } from './Config';
import { Today } from './Today';

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
      <nav className="top-nav" aria-label="Navegacao principal">
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

      {appState.errorMessage !== undefined ? <p className="app-error">{appState.errorMessage}</p> : null}

      {shouldShowConfig ? (
        <Config
          profile={appState.profile}
          onSave={appState.saveProfile}
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
          onSessionMinutesChange={appState.regeneratePlan}
          onCreateNextSession={appState.createNextSession}
          onSyncChesscomDiagnosis={appState.syncChesscomDiagnosis}
          onStartBlockTraining={appState.startBlockTraining}
          onCompleteBlockTraining={appState.completeBlockTraining}
          onSkipBlockTraining={appState.skipBlockTraining}
        />
      )}
    </main>
  );
}
