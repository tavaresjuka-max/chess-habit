import type { SyncEnv } from './types';

const LOCAL_HEADER = 'x-sync-user';
const USER_ID_RE = /^[a-zA-Z0-9_-]{1,64}$/;

const LICHESS_ACCOUNT_URL = 'https://lichess.org/api/account';
const CACHE_TTL_MS = 30_000; // 30 segundos

export type AuthResult =
  | { ok: true; userId: string }
  | { ok: false; status: number; error: string };

// ---------------------------------------------------------------------------
// Cache em memória do isolate (Map token → {userId, expiresAt})
// Evita estourar o rate-limit por IP do Worker: hits dentro do TTL não chamam
// o Lichess de novo.
// ---------------------------------------------------------------------------
interface CacheEntry {
  userId: string;
  expiresAt: number; // Date.now() + CACHE_TTL_MS
}

// Exportado para testes (limpar entre casos)
export const _oauthCache = new Map<string, CacheEntry>();

// ---------------------------------------------------------------------------
// Modo local (M12) — header x-sync-user
// ---------------------------------------------------------------------------
function authenticateLocal(request: Request): AuthResult {
  const raw = request.headers.get(LOCAL_HEADER);
  const userId = raw === null ? '' : raw.trim();
  if (!USER_ID_RE.test(userId)) {
    return {
      ok: false,
      status: 401,
      error: 'cabeçalho X-Sync-User ausente ou inválido (modo local).',
    };
  }
  return { ok: true, userId };
}

// ---------------------------------------------------------------------------
// Modo oauth (M13) — Bearer token validado no Lichess
// ---------------------------------------------------------------------------

/** Tipo mínimo retornado por /api/account do Lichess */
interface LichessAccountResponse {
  id?: string;
  username?: string;
}

export type LichessFetcher = (
  url: string,
  init: RequestInit,
) => Promise<Response>;

async function validateOAuthToken(
  token: string,
  lichessUrl: string,
  fetcher: LichessFetcher,
): Promise<AuthResult> {
  const now = Date.now();
  const cached = _oauthCache.get(token);
  if (cached !== undefined && cached.expiresAt > now) {
    return { ok: true, userId: cached.userId };
  }

  let response: Response;
  try {
    response = await fetcher(lichessUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    return {
      ok: false,
      status: 502,
      error: 'falha ao contatar o Lichess para validar o token OAuth.',
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      status: 401,
      error: 'token OAuth inválido ou expirado.',
    };
  }

  let account: LichessAccountResponse;
  try {
    account = (await response.json()) as LichessAccountResponse;
  } catch {
    return {
      ok: false,
      status: 502,
      error: 'resposta inesperada do Lichess ao validar token OAuth.',
    };
  }

  // Campo `id` é o username em minúsculas; fallback para `username`
  const rawId = account.id ?? account.username ?? '';
  const userId = rawId.trim().toLowerCase();

  if (!USER_ID_RE.test(userId)) {
    return {
      ok: false,
      status: 401,
      error: 'userId derivado do token OAuth tem formato inválido.',
    };
  }

  _oauthCache.set(token, { userId, expiresAt: now + CACHE_TTL_MS });

  return { ok: true, userId };
}

// ---------------------------------------------------------------------------
// Ponto de entrada público — assíncrono (necessário para oauth)
// ---------------------------------------------------------------------------

export async function authenticate(
  request: Request,
  env: SyncEnv,
  fetcher: LichessFetcher = globalThis.fetch,
): Promise<AuthResult> {
  const mode = env.SYNC_AUTH_MODE;

  if (mode === 'local') {
    return authenticateLocal(request);
  }

  if (mode === 'oauth') {
    const authHeader = request.headers.get('Authorization') ?? '';
    const match = /^Bearer\s+(\S+)$/i.exec(authHeader);
    if (match === null || match[1] === undefined || match[1].length === 0) {
      return {
        ok: false,
        status: 401,
        error: 'cabeçalho Authorization: Bearer <token> ausente ou malformado.',
      };
    }
    const token = match[1];
    const lichessUrl = env.LICHESS_VALIDATE_URL ?? LICHESS_ACCOUNT_URL;
    return validateOAuthToken(token, lichessUrl, fetcher);
  }

  return {
    ok: false,
    status: 501,
    error:
      "SYNC_AUTH_MODE não configurado. Defina 'local' para dev/testes ou 'oauth' para produção (M13).",
  };
}
