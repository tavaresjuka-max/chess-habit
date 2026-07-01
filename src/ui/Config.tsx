import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { SYNC_UI_ENABLED } from '../config/syncConfig';
import { createDefaultProfile, type LichessConnectionState } from '../app/state';
import {
  type AutoBackupStatus,
  type BackupImportResult,
  type BackupMeta,
  type StoragePersistenceStatus,
  type StoredPlacementResult,
} from '../app/backupStatus';
import { learnerBands, type LearnerBand, type LearnerProfile, type LichessOAuthToken, type SessionMinutes } from '../domain';
import { BandaIcon } from './art/BandaIcon';
import { Fold } from './Fold';
import { PlacementCard } from './PlacementCard';
import { SyncPanel } from './SyncPanel';
import { ConfigDataFold } from './ConfigDataFold';
import { ConfigPrivacyFold } from './ConfigPrivacyFold';
import { formatLichessConnection } from './configHelpers';

type ConfigProps = {
  profile: LearnerProfile | undefined;
  lichessToken: LichessOAuthToken | undefined;
  lichessConnectionState: LichessConnectionState;
  lichessMessage: string | undefined;
  storagePersistence: StoragePersistenceStatus | undefined;
  backupMeta: BackupMeta | undefined;
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
  // Captura mínima de erros (opt-in, Fase 1). Opcionais: o Config funciona
  // também sem esses handlers (ex.: mocks de teste) — toggle segue desligado.
  errorCaptureEnabled?: boolean;
  onToggleErrorCapture?: (enabled: boolean) => Promise<void>;
  onExportErrorLog?: () => Promise<string>;
  // Consentimento informado (Fase 3). Opcionais: fold fica somente-leitura
  // quando onToggleResearchOptIn está ausente (ex.: mocks de teste).
  consentedAt?: string;
  adoptedAt?: string;
  researchOptIn?: boolean;
  onToggleResearchOptIn?: (enabled: boolean) => Promise<void>;
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
  errorCaptureEnabled = false,
  onToggleErrorCapture,
  onExportErrorLog,
  consentedAt,
  adoptedAt,
  researchOptIn,
  onToggleResearchOptIn,
  onBack,
}: ConfigProps) {
  const initialProfile = profile ?? createDefaultProfile();
  const [lichessUsername, setLichessUsername] = useState(initialProfile.lichessUsername ?? '');
  const [chesscomUsername, setChesscomUsername] = useState(initialProfile.chesscomUsername ?? '');
  const [band, setBand] = useState<LearnerBand>(initialProfile.band);
  const [defaultSessionMinutes, setDefaultSessionMinutes] = useState<SessionMinutes>(
    initialProfile.defaultSessionMinutes,
  );

  async function handleSubmit() {
    await onSave({
      // Espalha o perfil atual primeiro para preservar campos que esta tela nao
      // edita (goals, themeStages do PED-3, etc.); so os campos abaixo mudam.
      ...initialProfile,
      lichessUsername: lichessUsername.trim() === '' ? undefined : lichessUsername.trim(),
      chesscomUsername: chesscomUsername.trim() === '' ? undefined : chesscomUsername.trim(),
      band,
      defaultSessionMinutes,
      updatedAt: new Date().toISOString(),
    });
    toast.success('Configuração salva.');
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
              Só dados públicos, sem login. Diagnóstico atualiza na tela Hoje.
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
            // Preserva campos nao editados aqui (goals, themeStages do PED-3, etc.).
            ...initialProfile,
            lichessUsername: lichessUsername.trim() === '' ? undefined : lichessUsername.trim(),
            chesscomUsername: chesscomUsername.trim() === '' ? undefined : chesscomUsername.trim(),
            band: placement.band,
            defaultSessionMinutes,
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

      <ConfigDataFold
        storagePersistence={storagePersistence}
        backupMeta={backupMeta}
        autoBackupStatus={autoBackupStatus}
        autoBackupFileName={autoBackupFileName}
        onEnableAutoBackup={onEnableAutoBackup}
        onDisableAutoBackup={onDisableAutoBackup}
        onExport={onExport}
        onImportBackup={onImportBackup}
        onClear={onClear}
        onImportKnownManualSignals={onImportKnownManualSignals}
        errorCaptureEnabled={errorCaptureEnabled}
        onToggleErrorCapture={onToggleErrorCapture}
        onExportErrorLog={onExportErrorLog}
      />

      <ConfigPrivacyFold
        consentedAt={consentedAt}
        adoptedAt={adoptedAt}
        researchOptIn={researchOptIn}
        onToggleResearchOptIn={onToggleResearchOptIn}
      />

      {SYNC_UI_ENABLED ? (
        <Fold concept="dados" title="Sincronização" meta="experimental">
          <SyncPanel />
        </Fold>
      ) : null}
      <p className="config-version">versão {__APP_VERSION__}</p>
    </section>
  );
}
