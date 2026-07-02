import { lichessFetch } from '../http/providerQueue';
import { isRecord } from '../utils/typeGuards';

/**
 * Contrato do client de autópsia. `parseGameRef` normaliza o link/id de
 * entrada; `fetchGameForAutopsy` busca o export da partida no Lichess.
 */

export type AutopsyFetchResult =
  | { kind: 'ok'; exportJson: unknown; gameId: string }
  | { kind: 'not-found' }
  | { kind: 'no-analysis'; gameId: string }
  | { kind: 'rate-limited' }
  | { kind: 'invalid-ref' }
  | { kind: 'network-error' };

const lichessBaseUrl = 'https://lichess.org';

// Timeout dedicado (~10s) para a autópsia, mais curto que o timeout padrão
// da fila serial (30s) — a SPEC pede resposta útil em <15s por partida, e
// um fetch travado não deve consumir esse orçamento inteiro.
const AUTOPSY_TIMEOUT_MS = 10_000;

// Cache in-memory por gameId (só respostas 'ok'). Evita re-buscar a mesma
// partida ao reabrir a autópsia na mesma sessão — a SPEC pede 1 chamada por
// partida.
const autopsyCache = new Map<string, { kind: 'ok'; exportJson: unknown; gameId: string }>();

/**
 * Limpa o cache in-memory de autópsias. Uso: testes.
 */
export function clearAutopsyCache(): void {
  autopsyCache.clear();
}

/**
 * Busca o export de uma partida do Lichess (GET /game/export/{id} com
 * Accept: application/json, evals=true) para a autópsia. Partida pública,
 * sem OAuth.
 */
export async function fetchGameForAutopsy(
  gameRef: string,
  options: { fetcher?: typeof fetch } = {},
): Promise<AutopsyFetchResult> {
  const gameId = parseGameRef(gameRef);

  if (gameId === null) {
    return { kind: 'invalid-ref' };
  }

  const cached = autopsyCache.get(gameId);
  if (cached !== undefined) {
    return cached;
  }

  const fetcher = options.fetcher ?? lichessFetch;
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, AUTOPSY_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetcher(autopsyExportUrl(gameId), {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
  } catch {
    return { kind: 'network-error' };
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 404) {
    return { kind: 'not-found' };
  }

  if (response.status === 429) {
    return { kind: 'rate-limited' };
  }

  if (!response.ok) {
    return { kind: 'network-error' };
  }

  let exportJson: unknown;
  try {
    exportJson = await response.json();
  } catch {
    return { kind: 'network-error' };
  }

  if (!isRecord(exportJson) || exportJson.analysis === undefined) {
    return { kind: 'no-analysis', gameId };
  }

  const result: AutopsyFetchResult = { kind: 'ok', exportJson, gameId };
  autopsyCache.set(gameId, result);
  return result;
}

function autopsyExportUrl(gameId: string): string {
  const params = new URLSearchParams({ evals: 'true' });
  return `${lichessBaseUrl}/game/export/${gameId}?${params.toString()}`;
}

const GAME_ID_PATTERN = /^[a-zA-Z0-9]{8}$/;

/**
 * Aceita:
 * - id puro de 8 chars alfanuméricos (ex.: "abcd1234")
 * - URLs completas: lichess.org/{id}, lichess.org/{id}/black, com âncoras
 *   (#N) e/ou query string, com ou sem protocolo/www.
 *
 * Retorna o id normalizado (8 chars) ou null se não reconhecer o formato.
 */
export function parseGameRef(input: string): string | null {
  const trimmed = input.trim();

  if (trimmed === '') {
    return null;
  }

  if (GAME_ID_PATTERN.test(trimmed)) {
    return trimmed;
  }

  const idFromUrl = extractGameIdFromUrl(trimmed);
  return idFromUrl;
}

function extractGameIdFromUrl(input: string): string | null {
  const withProtocol = /^https?:\/\//i.test(input) ? input : `https://${input}`;

  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./i, '').toLowerCase();
  if (host !== 'lichess.org') {
    return null;
  }

  // Path pode ser /{id}, /{id}/black, /{id}/white, opcionalmente com
  // segmentos extras (ex.: /training/{id} não é suportado aqui — é puzzle,
  // não partida). Pegamos o primeiro segmento não vazio do path.
  const segments = url.pathname.split('/').filter((segment) => segment !== '');
  const first = segments[0];

  if (first === undefined) {
    return null;
  }

  // O id de partida do Lichess pode vir com sufixo de cor coladas ao final
  // em alguns links antigos (raro) — mas o formato padrão é sempre um
  // segmento de path próprio. Validamos só contra o padrão de 8 chars.
  return GAME_ID_PATTERN.test(first) ? first : null;
}
