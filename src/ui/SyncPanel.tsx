import { useState } from 'react';
import { toast } from 'sonner';
import { SYNC_BACKEND_URL, SYNC_LOCAL_USER_ID } from '../config/syncConfig';
import { defaultCanaryStore, type CanaryStore } from '../infra/sync/canaryStore';
import type { EncryptedBlob } from '../infra/sync/crypto';
import { createCanary, verifyCanary } from '../infra/sync/passphraseCanary';
import {
  pullAndDecrypt,
  pushEncrypted,
  type PullDecryptedInput,
  type PullResult,
  type PushEncryptedInput,
  type SyncPassphraseResult,
} from '../infra/sync/syncEngine';
import { createSyncClient, type SyncClient } from '../infra/sync/syncClient';

export interface SyncOperations {
  createCanary(passphrase: string): Promise<EncryptedBlob>;
  verifyCanary(canary: EncryptedBlob, passphrase: string): Promise<boolean>;
  pushEncrypted(input: PushEncryptedInput): Promise<SyncPassphraseResult>;
  pullAndDecrypt(input: PullDecryptedInput): Promise<PullResult>;
}

export const defaultSyncOperations: SyncOperations = {
  createCanary,
  verifyCanary,
  pushEncrypted,
  pullAndDecrypt,
};

export function defaultCreateSyncClient(baseUrl: string, userId: string): SyncClient | undefined {
  if (baseUrl.trim() === '') return undefined;
  try {
    return createSyncClient({ baseUrl, userId });
  } catch {
    return undefined;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

type SyncPanelProps = {
  operations?: SyncOperations;
  canaryStore?: CanaryStore;
  createClient?: (baseUrl: string, userId: string) => SyncClient | undefined;
  backendUrl?: string;
  userId?: string;
  probeRetryDelaysMs?: number[];
};

export function SyncPanel({
  operations = defaultSyncOperations,
  canaryStore = defaultCanaryStore,
  createClient = defaultCreateSyncClient,
  backendUrl: initialBackendUrl = SYNC_BACKEND_URL ?? '',
  userId = SYNC_LOCAL_USER_ID,
  probeRetryDelaysMs = [250, 750],
}: SyncPanelProps) {
  const [passphrase, setPassphrase] = useState('');
  const [backendUrl, setBackendUrl] = useState(initialBackendUrl);
  const [canary, setCanary] = useState<EncryptedBlob | undefined>(() => canaryStore.load());
  const [status, setStatus] = useState<string>(() =>
    canary === undefined
      ? 'Sem passphrase definida neste aparelho.'
      : 'Passphrase definida — verifique antes de sincronizar.',
  );
  const [busy, setBusy] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);

  const passphraseReady = passphrase.trim().length > 0;
  const backendReady = backendUrl.trim().length > 0;

  async function handleDefinePassphrase(): Promise<void> {
    if (!passphraseReady || busy) return;
    setBusy(true);
    try {
      const created = await operations.createCanary(passphrase);
      if (!canaryStore.save(created)) {
        setStatus('Não foi possível salvar a passphrase neste aparelho (armazenamento indisponível).');
        toast.error('Não foi possível salvar a passphrase neste aparelho.');
        return;
      }
      setCanary(created);
      setStatus('Passphrase definida neste aparelho.');
      toast.success('Passphrase de sincronização definida.');
    } catch {
      setStatus('Não foi possível derivar a chave. Use uma passphrase válida.');
      toast.error('Passphrase inválida.');
    } finally {
      setBusy(false);
    }
  }

  function handleClearPassphrase(): void {
    if (busy) return;
    if (!canaryStore.clear()) {
      setStatus('Não foi possível remover a passphrase deste aparelho (armazenamento indisponível).');
      toast.error('Não foi possível remover a passphrase deste aparelho.');
      return;
    }
    setConfirmingClear(false);
    setCanary(undefined);
    setStatus('Sem passphrase definida neste aparelho.');
    toast.success('Passphrase local removida deste aparelho.');
  }

  async function handleSync(): Promise<void> {
    if (!passphraseReady || !backendReady || busy) return;
    if (canary === undefined) {
      setStatus('Defina a passphrase primeiro.');
      return;
    }
    const client = createClient(backendUrl, userId);
    if (client === undefined) {
      setStatus('URL do backend inválida.');
      return;
    }
    setBusy(true);
    const probe = { kind: 'sync-probe', at: Date.now() };
    try {
      const pushResult = await operations.pushEncrypted({
        passphrase,
        canary,
        client,
        collection: 'probe',
        clientMutationId: `probe-${Date.now().toString(36)}`,
        value: probe,
        updatedAt: Date.now(),
      });
      if (!pushResult.ok) {
        setStatus('Passphrase incorreta para seus blobs cifrados.');
        toast.error('Passphrase incorreta.');
        return;
      }
      const probeAt = probe.at;
      const maxAttempts = 1 + probeRetryDelaysMs.length;
      let confirmed = false;
      let lastItemsLength = 0;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (attempt > 0) {
          await sleep(probeRetryDelaysMs[attempt - 1] ?? 0);
        }
        const pullResult = await operations.pullAndDecrypt({
          passphrase,
          canary,
          client,
          collection: 'probe',
        });
        if (!pullResult.ok) {
          setStatus('Passphrase incorreta ao decifrar blobs.');
          toast.error('Passphrase incorreta.');
          return;
        }
        lastItemsLength = pullResult.items.length;
        const echoed = pullResult.items.find((item) => {
          const value = item.value;
          return (
            value !== null &&
            typeof value === 'object' &&
            (value as { kind?: unknown }).kind === 'sync-probe' &&
            (value as { at?: unknown }).at === probeAt
          );
        });
        if (echoed !== undefined) {
          confirmed = true;
          break;
        }
      }
      if (!confirmed) {
        setStatus('Sincronização não confirmada: a sonda enviada não voltou do servidor.');
        toast.error('Sincronização não confirmada.');
        return;
      }
      setStatus(`Sincronizado: ${String(lastItemsLength)} blob(s) cifrado(s) decifrado(s).`);
      toast.success('Sincronização concluída.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Falha na sincronização.');
      toast.error('Falha na sincronização.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sync-zone">
      <p className="sync-warning" role="note">
        <strong>Atenção:</strong> a passphrase de sincronização <strong>não pode ser recuperada</strong>.
        Se você perdê-la, os dados sincronizados ficam <strong>irrecuperáveis</strong> — ninguém, nem nós,
        consegue decifrá-los. Anote em local seguro e não use a mesma senha do Lichess.
      </p>
      <p className="config-hint">
        A passphrase é independente do seu login Lichess e fica só na memória deste aparelho; nunca é
        enviada nem persistida.
      </p>

      <label className="field">
        <span>Passphrase de sincronização</span>
        <input
          type="password"
          autoComplete="off"
          value={passphrase}
          onChange={(event) => {
            setPassphrase(event.target.value);
          }}
        />
      </label>

      <label className="field">
        <span>URL do backend local</span>
        <small className="field-hint">
          Local/test: <code>http://127.0.0.1:8787</code>. Sem backend configurado, a sincronização fica
          desabilitada.
        </small>
        <input
          type="url"
          placeholder="http://127.0.0.1:8787"
          value={backendUrl}
          onChange={(event) => {
            setBackendUrl(event.target.value);
          }}
        />
      </label>

      <div className="button-row">
        <button
          type="button"
          disabled={!passphraseReady || busy || canary !== undefined}
          onClick={() => {
            void handleDefinePassphrase();
          }}
        >
          Definir passphrase
        </button>
        <button
          type="button"
          className="secondary-button"
          disabled={!passphraseReady || !backendReady || busy || canary === undefined}
          onClick={() => {
            void handleSync();
          }}
        >
          Sincronizar agora
        </button>
      </div>

      {canary !== undefined ? (
        confirmingClear ? (
          <div className="button-row" role="group" aria-label="Confirmar limpeza da passphrase">
            <span className="rating-prompt">
              Limpar a passphrase deste aparelho? Seus dados e os blobs do servidor não são apagados.
            </span>
            <button type="button" className="danger-button" onClick={handleClearPassphrase}>
              Limpar
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
          <div className="button-row">
            <button
              type="button"
              className="secondary-button"
              disabled={busy}
              onClick={() => {
                setConfirmingClear(true);
              }}
            >
              Limpar passphrase deste aparelho
            </button>
            <small className="field-hint">
              Remove só a passphrase deste aparelho (caso você tenha esquecido, por exemplo). Não apaga
              seus dados locais nem os blobs do servidor.
            </small>
          </div>
        )
      ) : null}

      <p aria-live="polite">{status}</p>
    </div>
  );
}
