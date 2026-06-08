import { createSingleFlight } from './singleFlight';
import {
  createLichessOAuthRequest,
  exchangeLichessOAuthCode,
  parseLichessOAuthCallback,
  stripOAuthQuery,
} from '../infra/lichess/oauth';
import { saveLichessOAuthToken } from '../infra/storage/appData';
import type { LichessOAuthToken } from '../domain';
import { toLichessErrorMessage } from './errorMessages';

const oauthClientId = 'lichess-tutor-local';
const oauthSessionStorageKey = 'lichess-tutor:oauth-pending';

export type OAuthCompletionResult =
  | { kind: 'connected'; token: LichessOAuthToken }
  | { kind: 'cancelled'; message: string }
  | { kind: 'none' };

const oauthCompletionFlight = createSingleFlight<OAuthCompletionResult>();

type StoredOAuthRequest = {
  state: string;
  codeVerifier: string;
  redirectUri: string;
  scopes: LichessOAuthToken['scopes'];
};

export async function startLichessOAuthConnection(username: string | undefined): Promise<void> {
  const request = await createLichessOAuthRequest({
    clientId: oauthClientId,
    redirectUri: getOAuthRedirectUri(),
    username,
  });

  sessionStorage.setItem(oauthSessionStorageKey, JSON.stringify(request));
  window.location.assign(request.authorizationUrl);
}

export async function completeLichessOAuthIfNeeded(): Promise<OAuthCompletionResult> {
  // Em StrictMode o efeito de carga roda duas vezes; o codigo de autorizacao do
  // Lichess so pode ser trocado uma vez. O single-flight garante uma unica troca
  // e ambas as execucoes recebem o mesmo resultado, entao a execucao viva consegue
  // marcar a conexao como conectada sem depender de um refresh manual.
  return oauthCompletionFlight(runLichessOAuthCompletion);
}

async function runLichessOAuthCompletion(): Promise<OAuthCompletionResult> {
  const callback = parseLichessOAuthCallback(window.location.href);

  if (callback.kind === 'none') {
    return { kind: 'none' };
  }

  // Cancelamento/recusa nao pode derrubar o boot do app; vira mensagem
  // recuperavel e a query e sempre limpa para o reload nao repetir o erro.
  if (callback.kind === 'error') {
    sessionStorage.removeItem(oauthSessionStorageKey);
    clearOAuthQueryFromUrl();

    return { kind: 'cancelled', message: oauthCancelMessage(callback.error) };
  }

  const pending = readPendingOAuthRequest();

  if (pending === undefined || pending.state !== callback.state) {
    clearOAuthQueryFromUrl();

    return {
      kind: 'cancelled',
      message: 'O retorno do Lichess não confere com a solicitação local. Tente conectar de novo.',
    };
  }

  try {
    const token = await exchangeLichessOAuthCode({
      code: callback.code,
      codeVerifier: pending.codeVerifier,
      redirectUri: pending.redirectUri,
      clientId: oauthClientId,
      scopes: pending.scopes,
      nowIso: new Date().toISOString(),
    });

    await saveLichessOAuthToken(token);
    sessionStorage.removeItem(oauthSessionStorageKey);
    clearOAuthQueryFromUrl();

    return { kind: 'connected', token };
  } catch (error) {
    sessionStorage.removeItem(oauthSessionStorageKey);
    clearOAuthQueryFromUrl();

    return { kind: 'cancelled', message: toLichessErrorMessage(error) };
  }
}

function clearOAuthQueryFromUrl(): void {
  window.history.replaceState(null, document.title, stripOAuthQuery(window.location.href));
}

function oauthCancelMessage(error: string): string {
  if (error === 'access_denied') {
    return 'Você cancelou a conexão com o Lichess. Pode tentar de novo quando quiser.';
  }

  return `O Lichess recusou a conexão (${error}). Tente conectar de novo.`;
}

function readPendingOAuthRequest(): StoredOAuthRequest | undefined {
  const raw = sessionStorage.getItem(oauthSessionStorageKey);

  if (raw === null) {
    return undefined;
  }

  const parsed = JSON.parse(raw) as unknown;

  if (!isStoredOAuthRequest(parsed)) {
    return undefined;
  }

  return parsed;
}

function getOAuthRedirectUri(): string {
  return `${window.location.origin}${window.location.pathname}`;
}

function isStoredOAuthRequest(value: unknown): value is StoredOAuthRequest {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as {
    state?: unknown;
    codeVerifier?: unknown;
    redirectUri?: unknown;
    scopes?: unknown;
  };

  return (
    typeof candidate.state === 'string' &&
    typeof candidate.codeVerifier === 'string' &&
    typeof candidate.redirectUri === 'string' &&
    Array.isArray(candidate.scopes) &&
    candidate.scopes.every(isLichessOAuthScope)
  );
}

function isLichessOAuthScope(scope: unknown): scope is LichessOAuthToken['scopes'][number] {
  return scope === 'puzzle:read' || scope === 'study:write';
}
