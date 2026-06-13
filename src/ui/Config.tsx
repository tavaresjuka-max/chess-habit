import { ArrowLeft, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { createDefaultProfile, type LichessConnectionState } from '../app/state';
import type { BackupImportResult, StoredPlacementResult } from '../infra/storage/appData';
import { learnerBands, type LearnerBand, type LearnerProfile, type LichessOAuthToken, type SessionMinutes } from '../domain';
import { describeAutoBackupStatus, type AutoBackupStatus } from '../infra/storage/autoBackup';
import { BandaIcon } from './art/BandaIcon';
import { Fold } from './Fold';
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
  onSavePlacementResult: (result: StoredPlacementResult) => Promise<void>;
  onConnectLichess: () => Promise<void>;
  onDisconnectLichess: () => Promise<void>;
  onImportKnownManualSignals: () => Promise<number>;
  onExport: () => Promise<string>;
  onImportBackup: (json: string) => Promise<BackupImportResult>;
  onClear: () => Promise<void>;
  onBack?: () => void;
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
  onSavePlacementResult,
  onConnectLichess,
  onDisconnectLichess,
  onImportKnownManualSignals,
  onExport,
  onImportBackup,
  onClear,
  onBack,
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
    const confirmed = window.confirm('Este backup substitui todos os dados atuais. Continuar?');

    if (!confirmed) {
      return;
    }

    const result = await onImportBackup(await file.text());

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(`Backup de ${new Date(result.exportedAt).toLocaleString('pt-BR')} restaurado. Recarregando…`);
    window.setTimeout(() => {
      window.location.reload();
    }, 1200);
  }

  async function handleImportKnownManualSignals() {
    const count = await onImportKnownManualSignals();
    toast.success(`${String(count)} sinais manuais salvos.`);
  }

  async function handleClear() {
    const confirmed = window.confirm('Apagar todos os dados locais?');

    if (!confirmed) {
      return;
    }

    await onClear();
    toast.success('Dados locais apagados.');
  }

  return (
    <section aria-labelledby="config-title" className="panel">
      {onBack !== undefined ? (
        <button type="button" className="link-button config-back" onClick={onBack}>
          <ArrowLeft aria-hidden="true" size={15} />
          Voltar à recepção
        </button>
      ) : null}
      <h1 id="config-title">Configuração</h1>

      {/* Mesma lógica do Hoje e do Progresso: cada seção é uma dobra. O
          essencial abre direto; o resto expande quando o aluno quiser. */}
      <Fold concept="essencial" title="Essencial" defaultOpen>
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
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
              Só dados públicos, sem login. O diagnóstico atualiza na tela Hoje.
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
              Organiza o curso — não é nota. Na dúvida, faça a avaliação abaixo.
            </small>
            <div className="band-field">
              <BandaIcon band={band} size={44} />
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
            </div>
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
        </form>
      </Fold>

      <Fold concept="avaliacao" title="Avaliação de entrada">
        <PlacementCard
          hideHeading
          currentBand={band}
          onApplyBand={async (placement) => {
          setBand(placement.band);
          // Perfil primeiro: a faixa aplicada é o dado essencial. Se o registro
          // do placement falhar depois, o perfil já está coerente e a conquista
          // Calibrado apenas fica para a próxima avaliação.
          await onSave({
            lichessUsername: lichessUsername.trim() === '' ? undefined : lichessUsername.trim(),
            chesscomUsername: chesscomUsername.trim() === '' ? undefined : chesscomUsername.trim(),
            band: placement.band,
            defaultSessionMinutes,
            goals: initialProfile.goals,
            updatedAt: new Date().toISOString(),
          });
          await onSavePlacementResult({
            band: placement.band,
            confidence: placement.confidence,
            calibrated: placement.calibrated,
            completedAt: new Date().toISOString(),
          });
          }}
        />
      </Fold>

      <Fold concept="lichess" title="Lichess" meta="opcional">
        <div className="connection-box" aria-live="polite">
          <p className="config-hint">Conectar sincroniza puzzles e cria o Study do dia.</p>
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
        </div>
      </Fold>

      <Fold concept="dados" title="Dados locais">
        <div className="data-zone">
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
        </div>
      </Fold>
    </section>
  );
}

function formatBackupMeta(meta: BackupMetaRecord | undefined): string {
  if (meta === undefined) {
    return 'Nenhum backup exportado ainda.';
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

  // O benefício de conectar já está no hint da seção — aqui só o estado.
  if (token === undefined) {
    return 'Desconectado.';
  }

  return `Conectado com escopos: ${token.scopes.join(', ')}.`;
}
