import { Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { createDefaultProfile, type LichessConnectionState } from '../app/state';
import type { BackupImportResult } from '../infra/storage/appData';
import { learnerBands, type LearnerBand, type LearnerProfile, type LichessOAuthToken, type SessionMinutes } from '../domain';
import { describeAutoBackupStatus, type AutoBackupStatus } from '../infra/storage/autoBackup';
import { PlacementCard } from './PlacementCard';
import type { BackupMetaRecord } from '../infra/storage/db';
import { describePersistenceStatus, type StoragePersistenceStatus } from '../infra/storage/persistence';

type ConfigProps = {
  profile: LearnerProfile | undefined;
  lichessToken: LichessOAuthToken | undefined;
  lichessConnectionState: LichessConnectionState;
  lichessMessage: string | undefined;
  storagePersistence: StoragePersistenceStatus | undefined;
  backupMeta: BackupMetaRecord | undefined;
  autoBackupStatus: AutoBackupStatus;
  autoBackupFileName: string | undefined;
  onEnableAutoBackup: () => Promise<void>;
  onDisableAutoBackup: () => Promise<void>;
  onSave: (profile: LearnerProfile) => Promise<void>;
  onConnectLichess: () => Promise<void>;
  onDisconnectLichess: () => Promise<void>;
  onImportKnownManualSignals: () => Promise<number>;
  onExport: () => Promise<string>;
  onImportBackup: (json: string) => Promise<BackupImportResult>;
  onClear: () => Promise<void>;
};

const sessionOptions = [5, 15, 30, 60] satisfies SessionMinutes[];

export function Config({
  profile,
  lichessToken,
  lichessConnectionState,
  lichessMessage,
  storagePersistence,
  backupMeta,
  autoBackupStatus,
  autoBackupFileName,
  onEnableAutoBackup,
  onDisableAutoBackup,
  onSave,
  onConnectLichess,
  onDisconnectLichess,
  onImportKnownManualSignals,
  onExport,
  onImportBackup,
  onClear,
}: ConfigProps) {
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const initialProfile = profile ?? createDefaultProfile();
  const [lichessUsername, setLichessUsername] = useState(initialProfile.lichessUsername ?? 'jukasparov');
  const [chesscomUsername, setChesscomUsername] = useState(initialProfile.chesscomUsername ?? 'jukatavares');
  const [band, setBand] = useState<LearnerBand>(initialProfile.band);
  const [defaultSessionMinutes, setDefaultSessionMinutes] = useState<SessionMinutes>(
    initialProfile.defaultSessionMinutes,
  );

  async function handleSubmit() {
    await onSave({
      lichessUsername: lichessUsername.trim() === '' ? undefined : lichessUsername.trim(),
      chesscomUsername: chesscomUsername.trim() === '' ? undefined : chesscomUsername.trim(),
      band,
      defaultSessionMinutes,
      goals: initialProfile.goals,
      updatedAt: new Date().toISOString(),
    });
    toast.success('Configuração salva.');
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
    toast.success('Backup exportado.');
  }

  async function handleRestoreFile(file: File) {
    const confirmed = window.confirm(
      'Restaurar este backup SUBSTITUI os dados atuais (perfil, planos, logs, pendências, diplomas). Continuar?',
    );

    if (!confirmed) {
      return;
    }

    const result = await onImportBackup(await file.text());

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(`Backup de ${new Date(result.exportedAt).toLocaleString('pt-BR')} restaurado (${String(result.recordCount)} registros). Recarregando…`);
    window.setTimeout(() => {
      window.location.reload();
    }, 1200);
  }

  async function handleImportKnownManualSignals() {
    const count = await onImportKnownManualSignals();
    toast.success(`${String(count)} sinais manuais salvos.`);
  }

  async function handleClear() {
    const confirmed = window.confirm('Apagar todos os dados locais da Rotina?');

    if (!confirmed) {
      return;
    }

    await onClear();
    toast.success('Dados locais apagados.');
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
            <small className="field-hint">
              Não precisa conectar nem fazer login: o app lê só os dados públicos desse usuário.
              Para puxar o diagnóstico, use o botão &quot;Atualizar Chess.com&quot; na tela Hoje.
            </small>
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
            <small className="field-hint">
              A faixa organiza o conteúdo do curso; não é meta nem nota. Em dúvida, use a avaliação
              de entrada abaixo.
            </small>
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
            <button type="submit">Salvar</button>
          </div>
        </section>
      </form>

      <PlacementCard
        currentBand={band}
        onApplyBand={async (nextBand) => {
          setBand(nextBand);
          await onSave({
            lichessUsername: lichessUsername.trim() === '' ? undefined : lichessUsername.trim(),
            chesscomUsername: chesscomUsername.trim() === '' ? undefined : chesscomUsername.trim(),
            band: nextBand,
            defaultSessionMinutes,
            goals: initialProfile.goals,
            updatedAt: new Date().toISOString(),
          });
        }}
      />

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
        {storagePersistence !== undefined ? (
          <p aria-live="polite">{describePersistenceStatus(storagePersistence)}</p>
        ) : null}
        <p>{formatBackupMeta(backupMeta)}</p>
        <p aria-live="polite">{describeAutoBackupStatus(autoBackupStatus, autoBackupFileName)}</p>
        {autoBackupStatus !== 'unsupported' ? (
          <div className="button-row">
            {autoBackupStatus === 'disabled' ? (
              <button type="button" className="secondary-button" onClick={() => void onEnableAutoBackup()}>
                Ativar backup automático
              </button>
            ) : (
              <>
                {autoBackupStatus !== 'enabled' ? (
                  <button type="button" className="secondary-button" onClick={() => void onEnableAutoBackup()}>
                    Reativar backup automático
                  </button>
                ) : null}
                <button type="button" className="secondary-button" onClick={() => void onDisableAutoBackup()}>
                  Desligar backup automático
                </button>
              </>
            )}
          </div>
        ) : null}

        <input
          ref={restoreInputRef}
          type="file"
          accept="application/json,.json"
          hidden
          aria-label="Selecionar arquivo de backup para restaurar"
          onChange={(event) => {
            const file = event.target.files?.[0];

            event.target.value = '';

            if (file !== undefined) {
              void handleRestoreFile(file);
            }
          }}
        />
        <div className="button-row">
          <button type="button" className="secondary-button" onClick={() => void handleExport()}>
            Exportar backup JSON
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              restoreInputRef.current?.click();
            }}
          >
            Restaurar backup
          </button>
          <button type="button" className="secondary-button" onClick={() => void handleImportKnownManualSignals()}>
            Adicionar sinais manuais
          </button>
          <button type="button" className="danger-button" onClick={() => void handleClear()}>
            <Trash2 aria-hidden="true" size={16} />
            Apagar tudo
          </button>
        </div>
      </section>

    </section>
  );
}

function formatBackupMeta(meta: BackupMetaRecord | undefined): string {
  if (meta === undefined) {
    return 'Nenhum backup exportado ainda. Exporte um backup para proteger seu progresso.';
  }

  const date = new Date(meta.exportedAt);
  const formatted = Number.isNaN(date.getTime())
    ? meta.exportedAt
    : date.toLocaleString('pt-BR');

  return `Último backup: ${formatted} (${String(meta.recordCount)} registros).`;
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
