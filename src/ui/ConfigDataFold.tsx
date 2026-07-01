import { Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  describeAutoBackupStatus,
  describePersistenceStatus,
  type AutoBackupStatus,
  type BackupImportResult,
  type BackupMeta,
  type StoragePersistenceStatus,
} from '../app/backupStatus';
import { Fold } from './Fold';
import { downloadJsonFile, formatBackupMeta } from './configHelpers';

const maxBackupImportBytes = 5 * 1024 * 1024;

type ConfigDataFoldProps = {
  storagePersistence: StoragePersistenceStatus | undefined;
  backupMeta: BackupMeta | undefined;
  autoBackupStatus: AutoBackupStatus;
  autoBackupFileName: string | undefined;
  onEnableAutoBackup: () => Promise<void>;
  onDisableAutoBackup: () => Promise<void>;
  onExport: () => Promise<string>;
  onImportBackup: (json: string) => Promise<BackupImportResult>;
  onClear: () => Promise<void>;
  onImportKnownManualSignals: () => Promise<number>;
  errorCaptureEnabled?: boolean;
  onToggleErrorCapture?: (enabled: boolean) => Promise<void>;
  onExportErrorLog?: () => Promise<string>;
};

export function ConfigDataFold({
  storagePersistence,
  backupMeta,
  autoBackupStatus,
  autoBackupFileName,
  onEnableAutoBackup,
  onDisableAutoBackup,
  onExport,
  onImportBackup,
  onClear,
  onImportKnownManualSignals,
  errorCaptureEnabled = false,
  onToggleErrorCapture,
  onExportErrorLog,
}: ConfigDataFoldProps) {
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [pendingRestoreFile, setPendingRestoreFile] = useState<File | null>(null);

  async function handleExport() {
    const content = await onExport();
    downloadJsonFile(content, `rotina-backup-${new Date().toISOString().slice(0, 10)}.json`);
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
      downloadJsonFile(content, `rotina-erros-${new Date().toISOString().slice(0, 10)}.json`);
      toast.success('Erros exportados.');
    } catch {
      toast.error('Não foi possível exportar os erros.');
    }
  }

  async function confirmClear() {
    setConfirmingClear(false);
    await onClear();
    toast.success('Dados locais apagados.');
  }

  return (
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
  );
}
