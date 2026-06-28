import { ArrowLeft, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { SYNC_UI_ENABLED } from '../config/syncConfig';
import { createDefaultProfile, type LichessConnectionState } from '../app/state';
import {
  describeAutoBackupStatus,
  describePersistenceStatus,
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
import { PRIVACY_SUMMARY } from '../config/appIdentity';

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
const maxBackupImportBytes = 5 * 1024 * 1024;

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
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [pendingRestoreFile, setPendingRestoreFile] = useState<File | null>(null);
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

  function handleRestoreFile(file: File) {
    // Confirmação inline (não window.confirm): acessível para leitor de tela e
    // consistente com "Apagar tudo". O arquivo fica pendente até o usuário confirmar.
    setPendingRestoreFile(file);
  }

  async function confirmRestore() {
    if (pendingRestoreFile === null) {
      return;
    }

    if (pendingRestoreFile.size > maxBackupImportBytes) {
      setPendingRestoreFile(null);
      toast.error('Backup muito grande para restaurar no navegador.');
      return;
    }

    const result = await onImportBackup(await pendingRestoreFile.text());
    setPendingRestoreFile(null);

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

  async function handleToggleErrorCapture(nextEnabled: boolean) {
    if (onToggleErrorCapture === undefined) {
      return;
    }
    try {
      await onToggleErrorCapture(nextEnabled);
      toast.success(nextEnabled ? 'Registro de erros ativado.' : 'Registro de erros desligado.');
    } catch {
      toast.error('Não foi possível mudar o registro de erros.');
    }
  }

  async function handleExportErrors() {
    if (onExportErrorLog === undefined) {
      return;
    }
    try {
      const content = await onExportErrorLog();
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = `rotina-erros-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Erros exportados.');
    } catch {
      toast.error('Não foi possível exportar os erros.');
    }
  }

  async function handleToggleResearchOptIn(nextEnabled: boolean) {
    if (onToggleResearchOptIn === undefined) {
      return;
    }
    try {
      await onToggleResearchOptIn(nextEnabled);
      toast.success(
        nextEnabled ? 'Participação na pesquisa ativada.' : 'Participação na pesquisa desligada.',
      );
    } catch {
      toast.error('Não foi possível mudar a participação na pesquisa.');
    }
  }

  async function confirmClear() {
    setConfirmingClear(false);
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
              handleRestoreFile(file);
            }
          }}
        />
        <div className="button-row">
          <button type="button" className="secondary-button" onClick={() => void handleExport()}>
            Exportar backup JSON
          </button>
          {pendingRestoreFile !== null ? (
            <div className="button-row" role="group" aria-label="Confirmar restaurar backup">
              <span className="rating-prompt">Restaurar substitui todos os dados atuais. Continuar?</span>
              <button type="button" className="danger-button" onClick={() => void confirmRestore()}>
                Restaurar e recarregar
              </button>
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  setPendingRestoreFile(null);
                }}
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                restoreInputRef.current?.click();
              }}
            >
              Restaurar backup
            </button>
          )}
          <button type="button" className="secondary-button" onClick={() => void handleImportKnownManualSignals()}>
            Adicionar sinais manuais
          </button>
          <div className="error-capture-zone">
            <label className="field field-inline">
              <input
                type="checkbox"
                checked={errorCaptureEnabled}
                onChange={(event) => {
                  void handleToggleErrorCapture(event.target.checked);
                }}
              />
              <span>Registrar relatórios de erro (ajuda a melhorar o app)</span>
            </label>
            <p className="config-hint">
              Quando ligado, erros do app ficam só neste aparelho. Você pode exportar e enviar se
              quiser — nada é enviado automaticamente.
            </p>
            {errorCaptureEnabled ? (
              <button type="button" className="secondary-button" onClick={() => void handleExportErrors()}>
                Exportar erros
              </button>
            ) : null}
          </div>
          {confirmingClear ? (
            <div className="button-row" role="group" aria-label="Confirmar apagar tudo">
              <span className="rating-prompt">Apagar todos os dados locais?</span>
              <button type="button" className="danger-button" onClick={() => void confirmClear()}>
                <Trash2 aria-hidden="true" size={16} />
                Apagar definitivamente
              </button>
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  setConfirmingClear(false);
                }}
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="danger-button"
              onClick={() => {
                setConfirmingClear(true);
              }}
            >
              <Trash2 aria-hidden="true" size={16} />
              Apagar tudo
            </button>
          )}
        </div>
        </div>
      </Fold>

      <Fold concept="dados" title="Privacidade e consentimento">
        <div className="data-zone">
          <ul className="privacy-list">
            {PRIVACY_SUMMARY.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {consentedAt !== undefined ? (
            <p className="config-hint">
              Consentimento registrado em:{' '}
              {new Date(consentedAt).toLocaleString('pt-BR')}.
            </p>
          ) : (
            <p className="config-hint">
              Consentimento ainda não registrado — concluiu o onboarding em um
              app anterior a esta versão.
            </p>
          )}
          {adoptedAt !== undefined ? (
            <p className="config-hint">
              Usuário desde: {new Date(adoptedAt).toLocaleString('pt-BR')}.
            </p>
          ) : null}
          <div className="error-capture-zone">
            <label className="field field-inline">
              <input
                type="checkbox"
                checked={researchOptIn === true}
                disabled={onToggleResearchOptIn === undefined}
                onChange={(event) => {
                  void handleToggleResearchOptIn(event.target.checked);
                }}
              />
              <span>Participar da medição de eficácia em agregado (anônimo)</span>
            </label>
            <p className="config-hint">
              Seus dados continuam só no seu aparelho. Só uma contagem agregada anônima sai —
              nunca identificação pessoal. Você pode mudar esta opção a qualquer momento.
            </p>
          </div>
          <p>
            <a
              href="/docs/privacy/privacy-and-data.md"
              target="_blank"
              rel="noopener noreferrer"
              className="link-button"
            >
              Política de privacidade completa
            </a>
          </p>
          <p className="config-hint">
            Para apagar todos os dados locais (incluindo histórico de consentimento) use o
            botão &ldquo;Apagar tudo&rdquo; na seção &ldquo;Dados locais&rdquo; acima.
          </p>
        </div>
      </Fold>

      {SYNC_UI_ENABLED ? (
        <Fold concept="dados" title="Sincronização" meta="experimental">
          <SyncPanel />
        </Fold>
      ) : null}
      <p className="config-version">versão {__APP_VERSION__}</p>
    </section>
  );
}

function formatBackupMeta(meta: BackupMeta | undefined): string {
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
