import { lichessFetch } from '../http/providerQueue';

export type ImportPgnResult =
  | { kind: 'ok'; gameId: string; url: string }
  | { kind: 'rate-limited' }
  | { kind: 'invalid-pgn' }
  | { kind: 'network-error' };

const IMPORT_TIMEOUT_MS = 10_000;

/**
 * Importa um PGN no Lichess via `POST /api/import` (funciona anônimo —
 * spike validado 2026-07-02, ver docs/specs/onboarding-v3-SPEC.md). Segue o
 * padrão de fetcher injetável + timeout do autopsyClient.ts.
 */
export async function importPgnToLichess(
  pgn: string,
  options?: { fetcher?: typeof fetch },
): Promise<ImportPgnResult> {
  const fetcher = options?.fetcher ?? lichessFetch;
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, IMPORT_TIMEOUT_MS);

  let response: Response;
  try {
    const form = new URLSearchParams();
    form.set('pgn', pgn);
    response = await fetcher('https://lichess.org/api/import', {
      method: 'POST',
      // Accept é OBRIGATÓRIO: sem ele o Lichess segue o redirect e devolve a
      // PÁGINA HTML do jogo importado (200 text/html), quebrando o parse do
      // JSON — bug achado em verificação ao vivo no navegador (2026-07-02).
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: form.toString(),
      signal: controller.signal,
    });
  } catch {
    clearTimeout(timer);
    return { kind: 'network-error' };
  }
  clearTimeout(timer);

  if (response.status === 429) {
    return { kind: 'rate-limited' };
  }

  if (response.status === 400) {
    return { kind: 'invalid-pgn' };
  }

  if (!response.ok) {
    return { kind: 'network-error' };
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    return { kind: 'network-error' };
  }

  if (typeof json !== 'object' || json === null) {
    return { kind: 'network-error' };
  }

  const obj = json as Record<string, unknown>;
  const id = obj.id;
  const url = obj.url;
  if (typeof id !== 'string' || typeof url !== 'string' || id === '' || url === '') {
    return { kind: 'network-error' };
  }

  return { kind: 'ok', gameId: id, url };
}
