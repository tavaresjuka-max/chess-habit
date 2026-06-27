import type { SyncEnv } from './types';

const LOCAL_HEADER = 'x-sync-user';
const USER_ID_RE = /^[a-zA-Z0-9_-]{1,64}$/;

export type AuthResult =
  | { ok: true; userId: string }
  | { ok: false; status: number; error: string };

export function authenticate(request: Request, env: SyncEnv): AuthResult {
  const mode = env.SYNC_AUTH_MODE;
  if (mode !== 'local') {
    return {
      ok: false,
      status: 501,
      error:
        "M12 local-only: defina SYNC_AUTH_MODE='local' para testes; producao exige validacao OAuth Lichess (M13).",
    };
  }
  const raw = request.headers.get(LOCAL_HEADER);
  const userId = raw === null ? '' : raw.trim();
  if (!USER_ID_RE.test(userId)) {
    return {
      ok: false,
      status: 401,
      error: 'missing or invalid X-Sync-User header (local mode).',
    };
  }
  return { ok: true, userId };
}
