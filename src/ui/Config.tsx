import { useState } from 'react';
import { createDefaultProfile } from '../app/state';
import type { LearnerBand, LearnerProfile, SessionMinutes } from '../domain';

type ConfigProps = {
  profile: LearnerProfile | undefined;
  onSave: (profile: LearnerProfile) => Promise<void>;
  onExport: () => Promise<string>;
  onClear: () => Promise<void>;
};

const sessionOptions = [5, 15, 30, 60] satisfies SessionMinutes[];

export function Config({ profile, onSave, onExport, onClear }: ConfigProps) {
  const initialProfile = profile ?? createDefaultProfile();
  const [lichessUsername, setLichessUsername] = useState(initialProfile.lichessUsername ?? 'jukasparov');
  const [band, setBand] = useState<LearnerBand>(initialProfile.band);
  const [defaultSessionMinutes, setDefaultSessionMinutes] = useState<SessionMinutes>(
    initialProfile.defaultSessionMinutes,
  );
  const [statusMessage, setStatusMessage] = useState<string | undefined>(undefined);

  async function handleSubmit() {
    await onSave({
      lichessUsername: lichessUsername.trim() === '' ? undefined : lichessUsername.trim(),
      band,
      defaultSessionMinutes,
      goals: initialProfile.goals,
      updatedAt: new Date().toISOString(),
    });
    setStatusMessage('Configuracao salva.');
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
      <h1 id="config-title">Config</h1>
      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
        <label className="field">
          <span>Usuario Lichess</span>
          <input
            autoComplete="username"
            value={lichessUsername}
            onChange={(event) => {
              setLichessUsername(event.target.value);
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
          <span>Tempo padrao</span>
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
          <button type="button" className="secondary-button" onClick={() => void handleExport()}>
            Exportar backup JSON
          </button>
          <button type="button" className="danger-button" onClick={() => void handleClear()}>
            Apagar tudo
          </button>
        </div>
      </form>
      {statusMessage !== undefined ? <p className="status-message">{statusMessage}</p> : null}
    </section>
  );
}
