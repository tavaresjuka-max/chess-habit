import { useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Check } from 'lucide-react';
import { loadLichessOAuthToken } from '../infra/storage/appData';
import { SYNC_BACKEND_URL } from '../config/syncConfig';
import { pullBlobs, pushBlob } from '../infra/sync/syncEngine';
import { createSyncClient, type SyncClient } from '../infra/sync/syncClient';
import { syncAllCollections } from '../infra/sync/syncStorage';

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
}: SyncPanelProps) {
  const [backendUrl, setBackendUrl] = useState(initialBackendUrl);
  const [status, setStatus] = useState<string>('Pronto para sincronizar.');
  const [statusKind, setStatusKind] = useState<'idle' | 'ok' | 'warn' | 'error'>('idle');
  const [busy, setBusy] = useState(false);

  const backendReady = backendUrl.trim().length > 0;

  async function handleSync(): Promise<void> {
    if (!backendReady || busy) return;
    setBusy(true);
    try {
      const bearerToken = await operations.loadToken();
      if (bearerToken === undefined) {
        setStatusKind('error');
        setStatus('Faça login com o Lichess antes de sincronizar.');
        toast.error('Login Lichess necessário para sincronizar.');
        return;
      }
      const client = createClient(backendUrl, bearerToken);
      if (client === undefined) {
        setStatusKind('error');
        setStatus('URL do backend inválida.');
        toast.error('URL do backend inválida.');
        return;
      }

      const result = await syncAllCollections({ client });

      if (!result.ok) {
        // result.reason === 'unauthorized'
        setStatusKind('error');
        setStatus('Sua sessão do Lichess expirou — entre de novo.');
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }

      const { totals, perCollection } = result;
      const failedCollections = perCollection
        .filter((c) => c.error !== undefined)
        .map((c) => c.collection);

      const summary = `Sincronizado: ${String(totals.pushed)} registros enviados em ${String(totals.collectionsOk)} coleções.`;

      if (failedCollections.length > 0) {
        const failList = failedCollections.join(', ');
        setStatusKind('warn');
        setStatus(`${summary} Falha em: ${failList}.`);
        toast.warning(`Sync concluído com erros em: ${failList}`);
      } else {
        setStatusKind('ok');
        setStatus(summary);
        toast.success('Sincronização concluída.');
      }
    } catch (err) {
      setStatusKind('error');
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

      <p
        aria-live="polite"
        className={`sync-status${statusKind === 'idle' ? '' : ` sync-status--${statusKind}`}`}
      >
        {statusKind === 'ok' ? <Check aria-hidden="true" size={14} /> : null}
        {statusKind === 'warn' || statusKind === 'error' ? (
          <AlertTriangle aria-hidden="true" size={14} />
        ) : null}
        {status}
      </p>
    </div>
  );
}
