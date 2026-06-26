# SPEC — E1b-fetch: cliente de rede da rating-history do Lichess

## Contexto
E1a (commit 49682ae) entregou `parseRatingHistory` PURO (sem rede). Este SPEC adiciona o cliente
HTTP fino que busca o endpoint e delega o parse ao E1a. **NÃO inclui persistência Dexie** —
E1b-persist (migração) fica para DEPOIS da decisão de tier do estimador
([[e2e4-efficacy-methodology-DECISION]]), pra não cravar schema que o tier pode mudar (DATA é
caro de reverter).

## Design (decidido pelo maestro — NÃO reabrir)
- Endpoint **público** `GET /api/user/{username}/rating-history` (SEM token OAuth — difere de
  /api/account). Espelha `fetchLichessAccount` (account.ts): `lichessFetch` da fila de provider,
  429→`LichessRateLimitError`, !ok→`Error`, parse via E1a.
- Arquivo NOVO `src/infra/lichess/ratingHistoryClient.ts` (NÃO mexe no parser puro do E1a; mantém
  a separação rede≠transformação que o cabeçalho do E1a declara).
- `username` vazio → `[]` sem chamar a rede (best-effort, espelha o chesscom fetcher).
- `encodeURIComponent(username)` na URL.

## A) src/infra/lichess/ratingHistoryClient.ts — NOVO
```ts
import { lichessFetch } from '../http/providerQueue';
import { LichessRateLimitError } from './puzzleActivity';
import { parseRatingHistory, type LichessRatingSeries } from './ratingHistory';

const lichessBaseUrl = 'https://lichess.org';

export type FetchLichessRatingHistoryOptions = {
  fetcher?: typeof fetch;
};

// E1b: lê a série temporal de rating (endpoint público, sem token). Best-effort:
// quem chama envolve em try/catch. Delega o parse ao E1a (parseRatingHistory).
export async function fetchLichessRatingHistory(
  username: string,
  options: FetchLichessRatingHistoryOptions = {},
): Promise<LichessRatingSeries[]> {
  const normalized = username.trim();
  if (normalized === '') {
    return [];
  }

  const response = await (options.fetcher ?? lichessFetch)(
    `${lichessBaseUrl}/api/user/${encodeURIComponent(normalized)}/rating-history`,
    { headers: { Accept: 'application/json' } },
  );

  if (response.status === 429) {
    throw new LichessRateLimitError();
  }

  if (!response.ok) {
    throw new Error(`Lichess respondeu HTTP ${String(response.status)}.`);
  }

  return parseRatingHistory(await response.json());
}
```

## B) src/infra/lichess/ratingHistoryClient.test.ts — NOVO (vitest)
Mocka `fetcher` (mesmo estilo de account.test.ts: objeto `{ status, ok: status < 400,
json: async () => body }`). Casos VERMELHO→VERDE:
1. resposta 200 com array válido (ex.: `[{ name: 'Blitz', points: [[2024, 0, 15, 1532]] }]`) →
   retorna `[{ perf: 'blitz', points: [{ date: '2024-01-15', rating: 1532 }] }]` (integra E1a).
2. username vazio (`''` e `'   '`) → `[]` SEM chamar o fetcher (assert fetcher NÃO chamado).
3. status 429 → rejeita com `LichessRateLimitError`.
4. status 404 (não-ok) → rejeita com `Error` cuja mensagem contém "HTTP 404".
5. URL: username com caractere especial (ex.: `'a b'`) → fetcher chamado com a URL
   `https://lichess.org/api/user/a%20b/rating-history` (assert encodeURIComponent).
6. resposta 200 com corpo `[]` → `[]`.

## PROIBIDO TOCAR
ratingHistory.ts (parser E1a — NÃO mexer), account.ts, games.ts, db.ts, diplomas.ts,
bandProgression.ts, lichessBand.ts, runLichessSync, providerQueue.ts, puzzleActivity.ts.
NÃO criar persistência/Dexie. NÃO commitar.

## Gate (o maestro roda — você NÃO)
Testes novos VERMELHO→VERDE; `npm test`/`lint`/`build` verdes. Lint strict no-unsafe-any: o parse
já é tipado pelo E1a, então o cliente NÃO deve introduzir `any`.

## Entrega
Lista de arquivos mudados + diff unificado + o teste novo. NÃO commitar.
