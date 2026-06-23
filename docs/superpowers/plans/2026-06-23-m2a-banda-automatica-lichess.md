# M2a — Banda Automática a partir do Lichess (Plano FINAL, council incorporado)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development ou executing-plans. Steps em checkbox (`- [ ]`).

**Goal:** Ao sincronizar o Lichess, a `band` do `LearnerProfile` **sobe automaticamente** quando o rating de jogo rated do usuário indica força maior — lido de `/api/account`, com confiança alta. Nunca rebaixa sozinho; nunca usa rating de puzzle como número.

**Architecture:** App segue **orquestrador** (sem tabuleiro/dump offline). Adiciona (1) leitor de `/api/account`, (2) função pura `bandFromLichessGameRatings` (só ratings de jogo), (3) ligação **dentro do bloco guardado por `operationEpoch`** de `runDiagnosisSync`, aplicando a banda só se for MAIOR, antes do `generatePlan`.

**Tech Stack:** TypeScript, React hooks, Dexie/IndexedDB, Vitest + Testing Library, `lichessFetch`.

---

## Decisões FINAIS (council DeepSeek V4 Pro + GLM 5.2 incorporado)

- **DD1 — Fonte:** `GET /api/account` → `perfs` {puzzle, rapid, blitz, classical}, cada `{rating, games, prov}`.
- **DD2 — SÓ rating de JOGO. Sem puzzle como número, sem offset.** (Council convergiu: offset −300 é não-linear e erra; puzzle 1500 default vira faixa alta demais.) Entre `rapid`, `blitz`, `classical`: qualifica os com `prov !== true`; seleciona por **ordem de preferência fixa rapid > blitz > classical** (determinístico, mata o empate B1). `estimate = rating` do escolhido. Se nenhum qualifica → `undefined` (mantém placement manual). Puzzle NÃO entra no cálculo numérico nesta versão.
- **DD3 — Gate de confiabilidade = `prov !== true`** (Glicko já codifica RD/provisoriedade). Sem limiar de `games` arbitrário.
- **DD4 — SÓ SOBE.** A banda derivada só é aplicada se `learnerBands.indexOf(derived) > indexOf(atual)`. Nunca rebaixa automático (preserva agência/motivação TDAH; alinha à memória "a banda sobe sozinha").
- **DD5 — Epoch-safe (B4):** a aplicação da banda ocorre DENTRO do bloco `runExclusiveDiagnosisWrite` + checagem `isCurrentOperationEpoch`, ANTES de `generatePlan`, para o plano nascer com a banda certa e não competir com mudança manual concorrente.
- **DD6 — Best-effort:** falha de `/api/account` (rede/429) NÃO quebra o sync; pula o ajuste (com `console.warn`).
- **DD7 — Mensagem (B3):** a nota "Subi sua faixa para X" é **concatenada na mensagem final de sucesso**, não setada antes (senão é sobrescrita).
- **NON-GOALS:** sem tabuleiro/dataset offline; sem mudar schema Dexie; sem mudar scope OAuth; sem rebaixar banda; sem usar puzzleRatingAvg.

## Critérios de aceite (binários)

- **AC1:** `rapid {rating:1500, games:40, prov:false}`, banda atual `'400-800'` → sobe para `'1200-1600'`.
- **AC2:** Só `blitz {rating:1700, prov:false}` e `rapid {prov:true}` → usa blitz → `'1600-2000'` (rapid provisório ignorado).
- **AC3:** Banda atual `'2000-2200'`, `rapid {rating:900, prov:false}` → derivada `'800-1000'` é MENOR → **não aplica**; banda permanece `'2000-2200'`; `saveProfile` não chamado.
- **AC4:** Sem nenhum perf de jogo não-provisório (só puzzle) → `bandFromLichessGameRatings` retorna `undefined`; banda inalterada.
- **AC5:** Quando sobe, o `DailyPlan` do mesmo sync usa a banda nova; mensagem final inclui "Subi sua faixa para X".
- **AC6:** `npm run test && npm run typecheck && npm run lint && npm run build` verdes; nenhum teste pré-existente quebrado.

## File Structure

- **Create** `src/infra/lichess/account.ts` (+ `.test.ts`) — leitor `/api/account` (I/O + parse).
- **Create** `src/domain/placement/lichessBand.ts` (+ `.test.ts`) — pura `bandFromLichessGameRatings`.
- **Modify** `src/app/useDiagnosisActions.ts` — `setProfile` no input; aplicar banda dentro do bloco guardado de `runDiagnosisSync`.
- **Modify** `src/app/state.ts:188` — passar `setProfile` (já em escopo).
- **Modify** `src/app/useDiagnosisActions.test.tsx` — AC1/AC3/AC4 + mock `setProfile`/`fetchLichessAccount`.

---

## Task 1: Leitor `/api/account` (`account.ts`)

**Files:** Create `src/infra/lichess/account.ts`, `src/infra/lichess/account.test.ts`

- [ ] **Step 1 — teste falhando** (mesma forma do rascunho anterior; parse de `perfs` em `{rating,games,provisional}`, fetch com Bearer, 429 → `LichessRateLimitError`).
- [ ] **Step 2 — rodar e ver falhar:** `npm run test -- account.test`
- [ ] **Step 3 — implementar** (idem código do rascunho: `fetchLichessAccount`, `parseLichessAccount`, `parsePerf` lendo `prov`):

```ts
import { lichessFetch } from '../http/providerQueue';
import { LichessRateLimitError } from './puzzleActivity';
const lichessBaseUrl = 'https://lichess.org';
export type LichessPerf = { rating: number; games: number; provisional: boolean };
export type LichessAccountSummary = { id: string; username: string; puzzle?: LichessPerf; rapid?: LichessPerf; blitz?: LichessPerf; classical?: LichessPerf };
export type FetchLichessAccountOptions = { token: string; fetcher?: typeof fetch };
const PERF_KEYS = ['puzzle', 'rapid', 'blitz', 'classical'] as const;
export async function fetchLichessAccount(options: FetchLichessAccountOptions): Promise<LichessAccountSummary | undefined> {
  const token = options.token.trim();
  if (token === '') throw new Error('Token Lichess ausente para ler a conta.');
  const response = await (options.fetcher ?? lichessFetch)(`${lichessBaseUrl}/api/account`, { headers: { Accept: 'application/json', Authorization: `Bearer ${token}` } });
  if (response.status === 429) throw new LichessRateLimitError();
  if (!response.ok) throw new Error(`Lichess respondeu HTTP ${String(response.status)}.`);
  return parseLichessAccount(await response.json());
}
export function parseLichessAccount(value: unknown): LichessAccountSummary | undefined {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.username !== 'string') return undefined;
  const perfs = isRecord(value.perfs) ? value.perfs : {};
  const summary: LichessAccountSummary = { id: value.id, username: value.username };
  for (const key of PERF_KEYS) { const perf = parsePerf(perfs[key]); if (perf !== undefined) summary[key] = perf; }
  return summary;
}
function parsePerf(value: unknown): LichessPerf | undefined {
  if (!isRecord(value) || typeof value.rating !== 'number' || typeof value.games !== 'number') return undefined;
  return { rating: value.rating, games: value.games, provisional: value.prov === true };
}
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null; }
```

- [ ] **Step 4 — passar.** **Step 5 — commit:** `feat(m2a): leitor de /api/account do Lichess (perfs)`

---

## Task 2: `bandFromLichessGameRatings` (só jogo, prov-gated, ordem de preferência)

**Files:** Create `src/domain/placement/lichessBand.ts`, `.test.ts`

- [ ] **Step 1 — teste falhando**

```ts
import { describe, expect, it } from 'vitest';
import { bandFromLichessGameRatings } from './lichessBand';
describe('bandFromLichessGameRatings', () => {
  it('AC1: usa rapid direto', () => {
    expect(bandFromLichessGameRatings({ rapid: { rating: 1500, games: 40, provisional: false } })?.band).toBe('1200-1600');
  });
  it('AC2: ignora provisório, usa blitz', () => {
    const r = bandFromLichessGameRatings({ rapid: { rating: 2100, games: 2, provisional: true }, blitz: { rating: 1700, games: 30, provisional: false } });
    expect(r?.band).toBe('1600-2000');
  });
  it('preferência rapid > blitz no desempate (determinístico)', () => {
    const r = bandFromLichessGameRatings({ rapid: { rating: 1100, games: 50, provisional: false }, blitz: { rating: 1800, games: 50, provisional: false } });
    expect(r?.band).toBe('1000-1200'); // rapid vence por preferência, não por games
  });
  it('AC4: sem perf de jogo não-provisório -> undefined', () => {
    expect(bandFromLichessGameRatings({ puzzle: { rating: 1500, games: 99, provisional: false } } as never)).toBeUndefined();
    expect(bandFromLichessGameRatings({})).toBeUndefined();
  });
});
```

- [ ] **Step 2 — falhar.**
- [ ] **Step 3 — implementar**

```ts
import type { Confidence, LearnerBand } from '../types';
import { bandFromEstimate } from './placement';
const GAME_PREFERENCE = ['rapid', 'blitz', 'classical'] as const;
type RatingPerf = { rating: number; games: number; provisional?: boolean };
export type LichessGameRatingsInput = { rapid?: RatingPerf; blitz?: RatingPerf; classical?: RatingPerf };
export type LichessBandResult = { band: LearnerBand; confidence: Confidence; reasons: string[]; estimate: number; source: (typeof GAME_PREFERENCE)[number] };
export function bandFromLichessGameRatings(input: LichessGameRatingsInput): LichessBandResult | undefined {
  for (const key of GAME_PREFERENCE) {
    const perf = input[key];
    if (perf !== undefined && perf.provisional !== true) {
      return { band: bandFromEstimate(perf.rating), confidence: 'high', reasons: [`Seu rating de ${key} no Lichess.`], estimate: perf.rating, source: key };
    }
  }
  return undefined;
}
```

> **Nota GLM:** ordem de preferência é a regra de seleção (rapid primeiro). Não usar contagem de `games` para escolher — foi o que gerou o empate ambíguo (B1).

- [ ] **Step 4 — passar.** **Step 5 — commit:** `feat(m2a): bandFromLichessGameRatings (só rating de jogo, prov-gated)`

---

## Task 3: Aplicar banda (só sobe, epoch-safe) em `runLichessSync`/`runDiagnosisSync`

**Files:** Modify `src/app/useDiagnosisActions.ts`, `src/app/state.ts:188`

- [ ] **Step 1 — input:** adicionar `setProfile: Dispatch<SetStateAction<LearnerProfile | undefined>>` em `UseDiagnosisActionsInput`; desestruturar; importar `saveProfile`, `savePlacementResult` de `../infra/storage/appData`; importar `bandFromLichessGameRatings` e `fetchLichessAccount`.

- [ ] **Step 2 — buscar a banda derivada ANTES do sync, aplicar DENTRO do guard.** Em `runLichessSync`, carregar token e buscar a conta best-effort:
```ts
let token: LichessOAuthToken | undefined;
let derivedBand: LearnerBand | undefined;
try {
  token = await loadLichessOAuthToken();
  if (token?.accessToken) {
    try {
      const account = await fetchLichessAccount({ token: token.accessToken });
      const d = account ? bandFromLichessGameRatings(account) : undefined;
      // SÓ SOBE: aplica apenas se índice maior que o atual.
      if (d && learnerBands.indexOf(d.band) > learnerBands.indexOf(targetProfile.band)) {
        derivedBand = d.band;
      }
    } catch (e) { console.warn('Falha ao ler /api/account; mantendo banda.', e); }
  }
  // ...continua para runDiagnosisSync com targetProfile possivelmente ajustado...
```
Passar `derivedBand` para `runDiagnosisSync` (novo arg opcional). DENTRO do bloco `runExclusiveDiagnosisWrite`, após `isCurrentOperationEpoch` ok e antes de `generatePlan`, se `derivedBand` definido: construir `effectiveProfile = { ...args.targetProfile, band: derivedBand, updatedAt: nowIso }`, `await saveProfile(effectiveProfile)`, `setProfile(effectiveProfile)`, `await savePlacementResult({...})` (espelhar shape de `src/ui/App.tsx:267`), e usar `effectiveProfile` em `generatePlan`/`detectWeaknesses`. Importar `learnerBands` de `../domain/bands` ou `../domain`.

> **Nota GLM:** o `setProfile`/`saveProfile` da banda DEVE estar sob a mesma guarda de epoch do resto do write (B4). Não gravar a banda fora do `runExclusiveDiagnosisWrite`.

- [ ] **Step 3 — mensagem (DD7):** na montagem da mensagem final de sucesso de `runLichessSync`, se `derivedBand` definido, concatenar `` ` Subi sua faixa para ${derivedBand}.` ``.

- [ ] **Step 4 — construtor:** em `src/app/state.ts:188`, adicionar `setProfile,` ao objeto de `useDiagnosisActions({...})`.

- [ ] **Step 5 — gates:** `npm run typecheck && npm run lint`. **Step 6 — commit:** `feat(m2a): banda sobe sozinha no sync do Lichess (epoch-safe, só sobe)`

---

## Task 4: Testes de integração (AC1/AC3/AC4 + best-effort)

**Files:** Modify `src/app/useDiagnosisActions.test.tsx`

- [ ] AC1: `rapid 1500` + banda `'400-800'` → `setProfile`/`saveProfile` com `band:'1200-1600'`.
- [ ] AC3: banda `'2000-2200'` + `rapid 900` → `saveProfile` NÃO chamado (só sobe).
- [ ] AC4: sem perf de jogo → `saveProfile` NÃO chamado.
- [ ] Best-effort: `fetchLichessAccount` rejeita (429) → sync completa, sem throw, banda intacta.
- [ ] mock: adicionar `setProfile: vi.fn()` ao input; `vi.mock('../infra/lichess/account')` e `../infra/storage/appData`.
- [ ] Commit: `test(m2a): cobre banda automática (AC1/AC3/AC4/best-effort)`

---

## Task 5: Gates finais + roadmap

- [ ] `npm run test && npm run typecheck && npm run lint && npm run build` verdes.
- [ ] Atualizar memória: M2a "banda automática (só sobe, rating de jogo)" CONCLUÍDO; puzzle-como-número e dump offline ADIADOS (council + decisão orquestrador).
- [ ] Commit final.

## Self-Review
- Cobertura: AC1/AC2 → Task 2; AC3/AC4 → Task 4; AC5 → Task 3 (banda dentro do guard antes do plano); AC6 → Task 5.
- Sem placeholder de lógica; único ponto delegado a GLM é casar o shape de `StoredPlacementResult` (ler `appData.ts:293` + `App.tsx:267`).
- Tipos: `bandFromEstimate` reutilizado; `learnerBands.indexOf` para "só sobe"; `setProfile` igual aos outros hooks.
