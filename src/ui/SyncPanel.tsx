import { useState } from 'react';
import { toast } from 'sonner';
import { loadLichessOAuthToken } from '../infra/storage/appData';
import { SYNC_BACKEND_URL } from '../config/syncConfig';
import { pullBlobs, pushBlob } from '../infra/sync/syncEngine';
import { createSyncClient, type SyncClient } from '../infra/sync/syncClient';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export interface SyncPanelOperations {
  pushBlob: typeof pushBlob;
  pullBlobs: typeof pullBlobs;
  loadToken: () => Promise<string | undefined>;
}

export const defaultSyncPanelOperations: SyncPanelOperations = {
  pushBlob,
  pullBlobs,
  loadToken: async () => {
    const token = await loadLichessOAuthToken();
    return token?.accessToken;
  },
};

export function defaultCreateSyncClient(baseUrl: string, bearerToken: string): SyncClient | undefined {
  if (baseUrl.trim() === '') return undefined;
  try {
    return createSyncClient({ mode: 'oauth', baseUrl, bearerToken });
  } catch {
    return undefined;
  }
}

type SyncPanelProps = {
  operations?: SyncPanelOperations;
  createClient?: (baseUrl: string, bearerToken: string) => SyncClient | undefined;
  backendUrl?: string;
  probeRetryDelaysMs?: number[];
};

export function SyncPanel({
  operations = defaultSyncPanelOperations,
  createClient = defaultCreateSyncClient,
  backendUrl: initialBackendUrl = SYNC_BACKEND_URL ?? '',
  probeRetryDelaysMs = [250, 750],
}: SyncPanelProps) {
  const [backendUrl, setBackendUrl] = useState(initialBackendUrl);
  const [status, setStatus] = useState<string>('Pronto para sincronizar.');
  const [busy, setBusy] = useState(false);

  const backendReady = backendUrl.trim().length > 0;

  async function handleSync(): Promise<void> {
    if (!backendReady || busy) return;
    setBusy(true);
    try {
      const bearerToken = await operations.loadToken();
      if (bearerToken === undefined) {
        setStatus('Faça login com o Lichess antes de sincronizar.');
        toast.error('Login Lichess necessário para sincronizar.');
        return;
      }
      const client = createClient(backendUrl, bearerToken);
      if (client === undefined) {
        setStatus('URL do backend inválida.');
        toast.error('URL do backend inválida.');
        return;
      }

      const probe = { kind: 'sync-probe', at: Date.now() };
      await operations.pushBlob({
        client,
        collection: 'probe',
        clientMutationId: `probe-${Date.now().toString(36)}`,
        value: probe,
        updatedAt: Date.now(),
      });

      const probeAt = probe.at;
      const maxAttempts = 1 + probeRetryDelaysMs.length;
      let confirmed = false;
      let lastItemsLength = 0;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (attempt > 0) {
          await sleep(probeRetryDelaysMs[attempt - 1] ?? 0);
        }
        const pullResult = await operations.pullBlobs({
          client,
          collection: 'probe',
        });
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

      setStatus(`Sincronizado: ${String(lastItemsLength)} blob(s) no servidor.`);
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
      <label className="field">
        <span>URL do backend de sync</span>
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
          disabled={!backendReady || busy}
          onClick={() => {
            void handleSync();
          }}
        >
          Sincronizar agora
        </button>
      </div>

      <p aria-live="polite">{status}</p>
    </div>
  );
}
