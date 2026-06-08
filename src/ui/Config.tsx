import { useState } from 'react';
import { createDefaultProfile, type LichessConnectionState } from '../app/state';
import type { LearnerBand, LearnerProfile, LichessOAuthToken, SessionMinutes } from '../domain';

type ConfigProps = {
  profile: LearnerProfile | undefined;
  lichessToken: LichessOAuthToken | undefined;
  lichessConnectionState: LichessConnectionState;
  lichessMessage: string | undefined;
  onSave: (profile: LearnerProfile) => Promise<void>;
  onConnectLichess: () => Promise<void>;
  onDisconnectLichess: () => Promise<void>;
  onImportKnownManualSignals: () => Promise<number>;
  onExport: () => Promise<string>;
  onClear: () => Promise<void>;
};

const sessionOptions = [5, 15, 30, 60] satisfies SessionMinutes[];

export function Config({
  profile,
  lichessToken,
  lichessConnectionState,
  lichessMessage,
  onSave,
  onConnectLichess,
  onDisconnectLichess,
  onImportKnownManualSignals,
  onExport,
  onClear,
}: ConfigProps) {
  const initialProfile = profile ?? createDefaultProfile();
  const [lichessUsername, setLichessUsername] = useState(initialProfile.lichessUsername ?? 'jukasparov');
  const [chesscomUsername, setChesscomUsername] = useState(initialProfile.chesscomUsername ?? 'jukatavares');
  const [band, setBand] = useState<LearnerBand>(initialProfile.band);
  const [defaultSessionMinutes, setDefaultSessionMinutes] = useState<SessionMinutes>(
    initialProfile.defaultSessionMinutes,
  );
  const [statusMessage, setStatusMessage] = useState<string | undefined>(undefined);

  async function handleSubmit() {
    await onSave({
      lichessUsername: lichessUsername.trim() === '' ? undefined : lichessUsername.trim(),
      chesscomUsername: chesscomUsername.trim() === '' ? undefined : chesscomUsername.trim(),
      band,
      defaultSessionMinutes,
      goals: initialProfile.goals,
      updatedAt: new Date().toISOString(),
    });
    setStatusMessage('Configuração salva.');
  }

  async function handleExport() {
    const content = await onExport();
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `rotina-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatusMessage('Backup exportado.');
  }

  async function handleImportKnownManualSignals() {
    const count = await onImportKnownManualSignals();
    setStatusMessage(`${String(count)} sinais manuais salvos.`);
  }

  async function handleClear() {
    const confirmed = window.confirm('Apagar todos os dados locais da Rotina?');

    if (!confirmed) {
      return;
    }

    await onClear();
    setStatusMessage('Dados locais apagados.');
  }

  return (
    <section aria-labelledby="config-title" className="panel">
      <h1 id="config-title">Configuração</h1>
      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
        <section className="config-section" aria-labelledby="config-essential-title">
          <h2 id="config-essential-title">Essencial</h2>
          <p className="config-hint">Dados usados para montar a rotina local e ajustar o tamanho das sessões.</p>

          <label className="field">
            <span>Usuário Lichess</span>
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
            <select
              value={band}
              onChange={(event) => {
                setBand(event.target.value as LearnerBand);
              }}
            >
              <option value="0-800">0-800</option>
              <option value="800-1200">800-1200</option>
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
            <button type="submit">Salvar</button>
          </div>
        </section>
      </form>

      <section
        className="config-section connection-box"
        aria-labelledby="lichess-connection-title"
        aria-live="polite"
      >
        <h2 id="lichess-connection-title">
          Lichess <span className="optional-tag">opcional</span>
        </h2>
        <p className="config-hint">Conectar habilita reconciliação de puzzles e criação do Study do dia.</p>
        <p>{formatLichessConnection(lichessToken, lichessConnectionState)}</p>
        {lichessMessage !== undefined ? <p>{lichessMessage}</p> : null}
        <div className="button-row">
          <button
            type="button"
            disabled={lichessConnectionState === 'syncing'}
            onClick={() => {
              void onConnectLichess();
            }}
          >
            {lichessToken === undefined ? 'Conectar Lichess' : 'Reconectar Lichess'}
          </button>
          <button
            type="button"
            className="secondary-button"
            disabled={lichessToken === undefined || lichessConnectionState === 'syncing'}
            onClick={() => {
              void onDisconnectLichess();
            }}
          >
            Remover conexão
          </button>
        </div>
      </section>

      <section className="config-section data-zone" aria-labelledby="config-data-title">
        <h2 id="config-data-title">Dados locais</h2>
        <p className="config-hint">Backups, sinais manuais e limpeza ficam só neste dispositivo.</p>

        <div className="button-row">
          <button type="button" className="secondary-button" onClick={() => void handleExport()}>
            Exportar backup JSON
          </button>
          <button type="button" className="secondary-button" onClick={() => void handleImportKnownManualSignals()}>
            Adicionar sinais manuais
          </button>
          <button type="button" className="danger-button" onClick={() => void handleClear()}>
            Apagar tudo
          </button>
        </div>
      </section>

      {statusMessage !== undefined ? <p className="status-message">{statusMessage}</p> : null}
    </section>
  );
}

function formatLichessConnection(
  token: LichessOAuthToken | undefined,
  state: LichessConnectionState,
): string {
  if (state === 'syncing') {
    return 'Sincronizando com o Lichess.';
  }

  if (state === 'error') {
    return 'Conexão Lichess precisa de atenção.';
  }

  if (token === undefined) {
    return 'Desconectado. Conectar habilita reconciliar puzzles e criar o Study do dia.';
  }

  return `Conectado com escopos: ${token.scopes.join(', ')}.`;
}
