import type { LichessOAuthScope, LichessOAuthToken } from '../../domain';

export type LichessOAuthRequest = {
  authorizationUrl: string;
  state: string;
  codeVerifier: string;
  scopes: LichessOAuthScope[];
  redirectUri: string;
};

export type LichessOAuthCallback =
  | { kind: 'success'; code: string; state: string }
  | { kind: 'error'; error: string }
  | { kind: 'none' };

export type LichessTokenResponse = {
  token_type: string;
  access_token: string;
  expires_in: number;
};

const lichessBaseUrl = 'https://lichess.org';
export const allowedLichessOAuthScopes = ['puzzle:read', 'study:write'] as const satisfies readonly LichessOAuthScope[];

export async function createLichessOAuthRequest(input: {
  clientId: string;
  redirectUri: string;
  username?: string;
  scopes?: LichessOAuthScope[];
}): Promise<LichessOAuthRequest> {
  const scopes = input.scopes ?? [...allowedLichessOAuthScopes];
  const state = randomBase64Url(32);
  const codeVerifier = randomBase64Url(64);
  const codeChallenge = await sha256Base64Url(codeVerifier);
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: input.clientId,
    redirect_uri: input.redirectUri,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    scope: scopes.join(' '),
    state,
  });

  if (input.username !== undefined && input.username.trim() !== '') {
    params.set('username', input.username.trim());
  }

  return {
    authorizationUrl: `${lichessBaseUrl}/oauth?${params.toString()}`,
    state,
    codeVerifier,
    scopes,
    redirectUri: input.redirectUri,
  };
}

export function parseLichessOAuthCallback(url: string): LichessOAuthCallback {
  const parsed = new URL(url);
  const code = parsed.searchParams.get('code');
  const state = parsed.searchParams.get('state');
  const error = parsed.searchParams.get('error');

  if (error !== null) {
    return { kind: 'error', error };
  }

  if (code === null || state === null) {
    return { kind: 'none' };
  }

  return { kind: 'success', code, state };
}

export async function exchangeLichessOAuthCode(input: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
  clientId: string;
  scopes: LichessOAuthScope[];
  nowIso: string;
  fetcher?: typeof fetch;
}): Promise<LichessOAuthToken> {
  const fetcher = input.fetcher ?? fetch;
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: input.code,
    code_verifier: input.codeVerifier,
    redirect_uri: input.redirectUri,
    client_id: input.clientId,
  });
  const response = await fetcher(`${lichessBaseUrl}/api/token`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Lichess OAuth respondeu HTTP ${String(response.status)}.`);
  }

  const tokenResponse = (await response.json()) as unknown;

  if (!isTokenResponse(tokenResponse) || tokenResponse.token_type !== 'Bearer') {
    throw new Error('Resposta OAuth Lichess inesperada.');
  }

  return {
    accessToken: tokenResponse.access_token,
    tokenType: 'Bearer',
    scopes: input.scopes,
    obtainedAt: input.nowIso,
    expiresAt: new Date(Date.parse(input.nowIso) + tokenResponse.expires_in * 1000).toISOString(),
  };
}

export async function revokeLichessOAuthToken(input: { token: string; fetcher?: typeof fetch }): Promise<void> {
  const fetcher = input.fetcher ?? fetch;
  const response = await fetcher(`${lichessBaseUrl}/api/token`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${input.token}`,
    },
  });

  if (!response.ok && response.status !== 401) {
    throw new Error(`Lichess nao revogou o token: HTTP ${String(response.status)}.`);
  }
}

export function stripOAuthQuery(url: string): string {
  const parsed = new URL(url);
  parsed.searchParams.delete('code');
  parsed.searchParams.delete('state');
  parsed.searchParams.delete('error');
  parsed.searchParams.delete('error_description');

  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

function isTokenResponse(value: unknown): value is LichessTokenResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.token_type === 'string' &&
    typeof value.access_token === 'string' &&
    typeof value.expires_in === 'number'
  );
}

function randomBase64Url(bytes: number): string {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);

  return bytesToBase64Url(buffer);
}

async function sha256Base64Url(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);

  return bytesToBase64Url(new Uint8Array(hash));
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
