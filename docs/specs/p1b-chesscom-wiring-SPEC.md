# SPEC — P1b: wiring de bandFromChesscomRating no runChesscomSync

## Contexto
P1 (commit 6bd89bf) entregou a fn de domínio `bandFromChesscomRating`
(src/domain/placement/chesscomBand.ts) + teste, mas ela é **dead code** até ser fiada no
sync. Este SPEC fia: um rating de jogo verificado do Chess.com promove a banda (SÓ SOBE),
espelhando o caminho M2a do Lichess (runLichessSync).

## Design (decidido pelo maestro — NÃO reabrir)
1. **Fetcher leve novo** em infra (espelha `fetchLichessAccount`): busca `/stats` e devolve o
   input já normalizado pra fn de domínio. Decoupla a derivação-de-banda (ANTES do sync) do
   `importChesscomSignals` (que roda DENTRO do sync).
2. **Gate de "provisório" = contagem de jogos** (`record.win+loss+draw < MIN`). Chess.com `last`
   NÃO expõe `rd`/provisional (ver src/infra/chesscom/types.ts:23-34) — então uso games como
   proxy conservador. `MIN_CHESSCOM_GAMES = 10`, PROVISÓRIO (recalibrar no beta). Direção
   segura: poucos jogos → trata como provisório → NÃO promove. Banda só-sobe; over-promote é
   pegajoso e nocivo.

## Mudanças (3 arquivos)

### A) src/infra/chesscom/chesscomClient.ts — ADICIONAR fetcher exportado
- `import type { ChesscomGameRatingsInput } from '../../domain/placement/chesscomBand';`
- Nova const (com comentário PROVISÓRIO): `const MIN_CHESSCOM_GAMES = 10;`
- Nova fn exportada (REUSA `fetchJson`, `statsUrl`, `chesscomFetch`, `ChesscomStatsResponse`,
  todos já no arquivo):
```ts
export async function fetchChesscomGameRatings(
  username: string,
  options: { fetcher?: typeof fetch } = {},
): Promise<ChesscomGameRatingsInput> {
  const normalizedUsername = username.trim();
  if (normalizedUsername === '') {
    return {};
  }
  const fetcher = options.fetcher ?? chesscomFetch;
  const stats = await fetchJson<ChesscomStatsResponse>(statsUrl(normalizedUsername), fetcher);
  const input: ChesscomGameRatingsInput = {};
  for (const [key, category] of [
    ['rapid', stats.chess_rapid],
    ['blitz', stats.chess_blitz],
  ] as const) {
    const rating = category?.last?.rating;
    if (rating === undefined) {
      continue;
    }
    const games =
      (category?.record?.win ?? 0) +
      (category?.record?.loss ?? 0) +
      (category?.record?.draw ?? 0);
    input[key] = { rating, games, provisional: games < MIN_CHESSCOM_GAMES };
  }
  return input;
}
```
  - Erros (429 → `ChesscomRateLimitError`; outros → `Error`) PROPAGAM — o chamador trata.

### B) src/infra/chesscom/chesscomClient.bandRatings.test.ts — NOVO teste unitário (vitest)
Mocka `fetcher`. Casos (VERMELHO antes / VERDE depois):
1. rapid com record somando >=10 jogos → `{ rapid: { rating, games, provisional: false } }`.
2. rapid com <10 jogos → `provisional: true`.
3. categoria sem `record` → games 0 → `provisional: true`.
4. rapid ausente, blitz presente (>=10) → só `blitz`.
5. nenhum `last.rating` → `{}`.
6. resposta status 429 → rejeita com `ChesscomRateLimitError`.
7. username vazio → `{}` sem chamar o fetcher.

Mock do fetcher compatível com o uso em `fetchJson` (ele faz `response.status`, `response.ok`,
`await response.json()`): devolver `{ status, ok: status < 400, json: async () => body }`.

### C) src/app/useDiagnosisActions.ts — FIAR no runChesscomSync (~linha 282)
- Import: adicionar `fetchChesscomGameRatings` ao import existente de
  '../infra/chesscom/chesscomClient' (linha 27); adicionar
  `import { bandFromChesscomRating } from '../domain/placement/chesscomBand';`.
- `learnerBands` e `LearnerBand` JÁ estão importados (linhas 12/14) — reutilizar, não duplicar.
- Dentro de `runChesscomSync`, DEPOIS do guard `if (targetProfile.chesscomUsername === undefined
  || ...)` e ANTES do `try { const result = await runDiagnosisSync({ source: 'chesscom', ...`,
  inserir bloco espelhando o Lichess (runLichessSync ~linhas 338-356):
```ts
let derivedBand: LearnerBand | undefined;
// P1: lê /stats do Chess.com best-effort ANTES do sync para derivar a banda
// (SÓ SOBE). Falha de rede/429 aqui NÃO quebra o sync — derivada fica undefined.
try {
  const ratings = await fetchChesscomGameRatings(targetProfile.chesscomUsername ?? '');
  const derived = bandFromChesscomRating(ratings);
  // DD4: SÓ SOBE — aplica apenas se o índice for maior que o atual.
  if (
    derived !== undefined &&
    learnerBands.indexOf(derived.band) > learnerBands.indexOf(targetProfile.band)
  ) {
    derivedBand = derived.band;
  }
} catch (error) {
  console.warn('Falha ao ler stats Chess.com; mantendo banda.', error);
}
```
- No objeto passado a `runDiagnosisSync`, adicionar a propriedade `derivedBand,` (runDiagnosisSync
  JÁ aceita `derivedBand?` — NÃO mudar a assinatura dele).

## PROIBIDO TOCAR
diplomas.ts, bandProgression.ts, lichessBand.ts, runLichessSync, evaluateDiplomas, a assinatura
de runDiagnosisSync, o domínio chesscomBand.ts. NÃO mudar MIN/OFFSET. NÃO commitar.

## Gate de aceite (o maestro roda — você NÃO)
Testes novos VERMELHO→VERDE; `npm test` (suíte cheia)/`lint`/`build` verdes.

## Entrega
Lista de arquivos mudados + diff unificado + o teste novo. NÃO commitar.
