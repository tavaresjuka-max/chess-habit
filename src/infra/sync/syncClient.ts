export interface StoredBlob {
  readonly collection: string;
  readonly clientMutationId: string;
  readonly ciphertext: string;
  readonly updatedAt: number;
}

export interface HealthResponse {
  readonly ok: boolean;
  readonly service?: string;
  readonly version?: string;
  readonly mode?: string;
  readonly db?: string;
  readonly time?: number;
}

export interface SyncClientConfig {
  readonly baseUrl: string;
  readonly userId: string;
  readonly fetcher?: typeof fetch;
  readonly timeoutMs?: number;
}

export interface PushBlobInput {
  readonly collection: string;
  readonly clientMutationId: string;
  readonly ciphertext: string;
  readonly updatedAt: number;
}

export class SyncHttpError extends Error {
  readonly status: number;
  constructor(status: number, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'SyncHttpError';
    this.status = status;
  }
}

const DEFAULT_TIMEOUT_MS = 15_000;
const LOCAL_USER_HEADER = 'x-sync-user';

const USER_ID_RE = /^[a-zA-Z0-9_-]{1,64}$/;
const COLLECTION_RE = /^[a-zA-Z0-9_-]{1,64}$/;

function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim();
  if (trimmed.length === 0) {
    throw new Error('baseUrl nao pode ser vazio.');
  }
  return trimmed.replace(/\/+$/, '');
}

function requireUserId(userId: string): void {
  if (!USER_ID_RE.test(userId)) {
    throw new Error(
      'userId (X-Sync-User) deve casar com ^[a-zA-Z0-9_-]{1,64}$ (modo local/test).',
    );
  }
}

function requireCollection(collection: string): void {
  if (!COLLECTION_RE.test(collection)) {
    throw new Error('collection deve casar com ^[a-zA-Z0-9_-]{1,64}$.');
  }
}

interface RequestOptions {
  readonly method: 'GET' | 'POST';
  readonly path: string;
  readonly query?: Record<string, string>;
  readonly body?: unknown;
}

export interface SyncClient {
  health(): Promise<HealthResponse>;
  pushBlob(input: PushBlobInput): Promise<void>;
  listBlobs(collection: string): Promise<StoredBlob[]>;
  snapshot(): Promise<StoredBlob[]>;
}

export function createSyncClient(config: SyncClientConfig): SyncClient {
  const baseUrl = normalizeBaseUrl(config.baseUrl);
  requireUserId(config.userId);
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const fetcher: typeof fetch | undefined =
    config.fetcher ?? (globalThis as { fetch?: typeof fetch }).fetch;

  if (fetcher === undefined) {
    throw new Error('fetch indisponivel: forneca `fetcher` em config.');
  }
  const doFetch: typeof fetch = fetcher;

  async function request<T>(options: RequestOptions): Promise<T> {
    const url = new URL(baseUrl + options.path);
    if (options.query !== undefined) {
      for (const [key, value] of Object.entries(options.query)) {
        url.searchParams.set(key, value);
      }
    }

    const headers = new Headers({ [LOCAL_USER_HEADER]: config.userId });
    let bodyText: string | undefined;
    if (options.body !== undefined) {
      bodyText = JSON.stringify(options.body);
      headers.set('content-type', 'application/json; charset=utf-8');
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, timeoutMs);
    let response: Response;
    try {
      response = await doFetch(url, {
        method: options.method,
        headers,
        body: bodyText,
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timer);
      throw new SyncHttpError(0, 'falha de rede ao falar com o backend de sync.', {
        cause: err,
      });
    }
    clearTimeout(timer);

    if (!response.ok) {
      const message = await readErrorMessage(response);
      throw new SyncHttpError(response.status, message);
    }

    try {
      return (await response.json()) as T;
    } catch (err) {
      throw new SyncHttpError(
        response.status,
        `resposta ${String(response.status)} com corpo nao-JSON do backend de sync.`,
        { cause: err },
      );
    }
  }

  return {
    async health(): Promise<HealthResponse> {
      return request<HealthResponse>({ method: 'GET', path: '/health' });
    },

    async pushBlob(input: PushBlobInput): Promise<void> {
      requireCollection(input.collection);
      if (typeof input.ciphertext !== 'string' || input.ciphertext.length === 0) {
        throw new Error('ciphertext (blob opaco) e obrigatorio e nao pode ser vazio.');
      }
      await request<{ ok: boolean }>({
        method: 'POST',
        path: '/blobs',
        body: {
          collection: input.collection,
          clientMutationId: input.clientMutationId,
          ciphertext: input.ciphertext,
          updatedAt: input.updatedAt,
        },
      });
    },

    async listBlobs(collection: string): Promise<StoredBlob[]> {
      requireCollection(collection);
      const body = await request<{ blobs: StoredBlob[] }>({
        method: 'GET',
        path: '/blobs',
        query: { collection },
      });
      return body.blobs;
    },

    async snapshot(): Promise<StoredBlob[]> {
      const body = await request<{ blobs: StoredBlob[] }>({
        method: 'GET',
        path: '/snapshot',
      });
      return body.blobs;
    },
  };
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: unknown };
    if (typeof body.error === 'string' && body.error.length > 0) {
      return body.error;
    }
  } catch {
  }
  return `erro HTTP ${String(response.status)} do backend de sync.`;
}
