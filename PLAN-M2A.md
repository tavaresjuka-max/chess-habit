# PLAN-M2a: Lichess Puzzle Rating → Band Auto-selection

## Contexto

A maioria do M2a já está implementada:
- OAuth PKCE, token storage, puzzle activity fetch, reconciliação com logs de treino: DONE
- CSP permite lichess.org e api.lichess.org: DONE

O que falta (roadmap: `/api/user/{u}/perfs.puzzle → rating → banda`):
1. Buscar rating de puzzles do Lichess (API pública, sem OAuth)
2. Emitir como sinal `puzzle-perf` novo (backward-compatible com `SignalValue`)
3. Usar no placement para auto-selecionar banda com confiança alta

## Escopo M2a (mínimo correto)

NÃO incluir nesta entrega:
- Fetch histórico de puzzle activity para diagnóstico (risco mobile: NDJSON grande)
- Puzzle dashboard como diagnóstico (OAuth obrigatório, já funciona via reconcileLogIfPossible)
- Mudança na lógica de runDiagnosisSync (council: não misturar fetch assíncrono no loop)

## Tarefas

### Task 1 — Novo sinal `puzzle-perf` em `src/domain/types.ts`

Arquivo: `src/domain/types.ts`

Adicionar na union `SignalValue` ANTES da linha `| { kind: 'manual'; ... }`:

```typescript
| { kind: 'puzzle-perf'; rating: number; games: number }
```

Proteção de band instability: não modifica `kind: 'rating'` existente.

### Task 2 — `fetchLichessPuzzlePerf` em `src/infra/lichess/games.ts`

Adicionar APÓS a função `importLichessSignals` existente (linha ~75):

```typescript
export async function fetchLichessPuzzlePerf(
  username: string,
  options: { fetcher?: typeof fetch } = {},
): Promise<{ rating: number; games: number } | null> {
  const fetcher = options.fetcher ?? lichessFetch;
  const url = `${lichessBaseUrl}/api/user/${encodeURIComponent(username.trim())}/perf/puzzle`;

  try {
    const response = await fetcher(url, { headers: { Accept: 'application/json' } });
    if (response.status === 404) return null;  // usuário sem puzzles
    if (response.status === 429) throw new LichessRateLimitError();
    if (!response.ok) return null;
    const data = (await response.json()) as unknown;
    return parsePuzzlePerf(data);
  } catch (error) {
    if (error instanceof LichessRateLimitError) throw error;
    return null;  // falha silenciosa: rede offline, JSON malformado, etc.
  }
}

function parsePuzzlePerf(data: unknown): { rating: number; games: number } | null {
  if (typeof data !== 'object' || data === null) return null;
  const record = data as Record<string, unknown>;
  const stat = record.stat;
  if (typeof stat !== 'object' || stat === null) return null;
  const statRecord = stat as Record<string, unknown>;
  const resultStr = statRecord.resultStreak;
  // lichess /api/user/{u}/perf/{perf} retorna { perf: { glicko: { rating, deviation } }, stat: {...}, ... }
  const perf = record.perf;
  if (typeof perf !== 'object' || perf === null) return null;
  const perfRecord = perf as Record<string, unknown>;
  const glicko = perfRecord.glicko;
  if (typeof glicko !== 'object' || glicko === null) return null;
  const glickoRecord = glicko as Record<string, unknown>;
  const rating = glickoRecord.rating;
  const games = statRecord.count;
  if (typeof rating !== 'number') return null;
  const gamesTotal = typeof games === 'object' && games !== null
    ? (games as Record<string, unknown>).all
    : undefined;
  return {
    rating: Math.round(rating),
    games: typeof gamesTotal === 'number' ? gamesTotal : 0,
  };
}
```

Também importar `LichessRateLimitError` de `./puzzleActivity` no topo do games.ts (já está importado).

### Task 3 — Emitir `puzzle-perf` sinal em `importLichessSignals`

No final de `importLichessSignals` (games.ts), ANTES do `return`:

```typescript
// Busca rating de puzzles (API pública, sem OAuth).
// Falha silenciosa: não bloqueia o import de partidas.
const puzzlePerf = await fetchLichessPuzzlePerf(options.username, {
  fetcher: options.fetcher,
}).catch(() => null);

const puzzlePerfSignal: Signal[] = puzzlePerf === null || puzzlePerf.games < 10
  ? []
  : [{
      source: 'lichess' as const,
      value: { kind: 'puzzle-perf' as const, rating: puzzlePerf.rating, games: puzzlePerf.games },
      confidence: 'high' as const,
      observedAt: options.observedAt ?? new Date().toISOString(),
    }];

return [...extractSignalsFromLichessGames(
  options.username,
  games,
  options.observedAt ?? new Date().toISOString(),
), ...puzzlePerfSignal];
```

NOTA: games < 10 → descarta (amostra insuficiente para confiança).

### Task 4 — `bandFromPuzzlePerfSignal` em `src/domain/placement/placement.ts`

Adicionar no final do arquivo, APÓS `describePlacementConfidence`:

```typescript
import type { Signal } from '../types';

/**
 * Lê o sinal puzzle-perf dos sinais de diagnóstico e retorna a banda
 * auto-selecionada com confiança alta, ou null se não há dados Lichess.
 * Proteção de instabilidade: só muda banda se rating delta > 200 pts
 * vs bandaBandActual (evita ping-pong do Glicko-2 ±50 pts).
 */
export function bandFromPuzzlePerfSignal(
  signals: Signal[],
  currentBand?: LearnerBand,
): { band: LearnerBand; rating: number } | null {
  const signal = signals
    .filter((s) => s.source === 'lichess' && s.value.kind === 'puzzle-perf')
    .sort((a, b) => b.observedAt.localeCompare(a.observedAt))[0];

  if (signal === undefined || signal.value.kind !== 'puzzle-perf') return null;
  const { rating } = signal.value;
  const suggestedBand = bandFromEstimate(rating);

  // Proteção anti-ping-pong: só muda se delta > 200 pts vs meio da banda atual.
  if (currentBand !== undefined) {
    const [lo, hi] = currentBand.split('-').map(Number);
    const mid = lo !== undefined && hi !== undefined ? (lo + hi) / 2 : 0;
    if (Math.abs(rating - mid) < 200) return { band: currentBand, rating };
  }

  return { band: suggestedBand, rating };
}
```

### Task 5 — Exportar `bandFromPuzzlePerfSignal` em `src/domain/index.ts`

Verificar se `placement.ts` já é exportado via `export * from './placement/placement'` (já existe).
Se sim, `bandFromPuzzlePerfSignal` fica disponível via `import from '../domain'` automaticamente.

### Task 6 — Usar no onboarding/Config (App)

Arquivo: `src/app/useDiagnosisActions.ts`

Em `runLichessSync`, APÓS `setLichessConnectionState`:

```typescript
// Auto-sugestão de banda a partir do rating de puzzles Lichess.
// Só aplica se banda ainda não foi confirmada manualmente (confidence !== 'high').
const puzzleBand = bandFromPuzzlePerfSignal(result.signals, targetProfile.band);
if (puzzleBand !== null && targetProfile.band !== puzzleBand.band) {
  // Store suggestion: dispatch via setLichessMessage para UI reagir.
  // Não modifica profile aqui — UI decide se confirma.
  setLichessMessage(
    `Lichess atualizado. Rating de puzzles: ${puzzleBand.rating} → banda sugerida: ${puzzleBand.band}.`,
  );
}
```

NOTA: A UI mostra a sugestão. O usuário confirma na tela de Config ou onboarding. Não modificar `profile.band` automaticamente — previne ping-pong.

### Task 7 — Tests

**Arquivo: `src/infra/lichess/games.test.ts`** (ou criar `perf.test.ts`):

```typescript
describe('fetchLichessPuzzlePerf', () => {
  it('returns rating and games for valid response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({
        perf: { glicko: { rating: 1340.5 } },
        stat: { count: { all: 150 } },
      }),
    });
    const result = await fetchLichessPuzzlePerf('testuser', { fetcher: mockFetch });
    expect(result).toEqual({ rating: 1341, games: 150 });
  });

  it('returns null on 404 (user has no puzzles)', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    const result = await fetchLichessPuzzlePerf('newuser', { fetcher: mockFetch });
    expect(result).toBeNull();
  });

  it('returns null on network failure (graceful degradation)', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('network error'));
    const result = await fetchLichessPuzzlePerf('user', { fetcher: mockFetch });
    expect(result).toBeNull();
  });
});
```

**Arquivo: `src/domain/placement/placement.test.ts`** (adicionar):

```typescript
describe('bandFromPuzzlePerfSignal', () => {
  it('returns correct band for rating 1340', () => {
    const signals: Signal[] = [{
      source: 'lichess',
      value: { kind: 'puzzle-perf', rating: 1340, games: 150 },
      confidence: 'high',
      observedAt: new Date().toISOString(),
    }];
    const result = bandFromPuzzlePerfSignal(signals);
    expect(result?.band).toBe('1200-1600');
    expect(result?.rating).toBe(1340);
  });

  it('keeps current band if rating delta < 200 (anti-ping-pong)', () => {
    const signals: Signal[] = [{
      source: 'lichess',
      value: { kind: 'puzzle-perf', rating: 1050, games: 50 }, // mid de 800-1000 = 900, delta = 150 < 200
      confidence: 'high',
      observedAt: new Date().toISOString(),
    }];
    const result = bandFromPuzzlePerfSignal(signals, '800-1000');
    expect(result?.band).toBe('800-1000'); // mantém banda atual
  });

  it('returns null when no puzzle-perf signal exists', () => {
    expect(bandFromPuzzlePerfSignal([])).toBeNull();
  });
});
```

## Gates de Aceitação

1. `npm test` — 779+ testes passando
2. `npm run build` — sem erros TypeScript
3. `npx playwright test e2e/a11y.spec.ts` — 6/6
4. Manual: ao salvar usuário Lichess na Config com username válido, mensagem mostra rating de puzzles e banda sugerida
5. Band não muda automaticamente — usuário precisa confirmar na UI

## Arquivos a modificar (resumo)

- `src/domain/types.ts` — +1 kind no SignalValue
- `src/infra/lichess/games.ts` — +fetchLichessPuzzlePerf +puzzle-perf signal
- `src/domain/placement/placement.ts` — +bandFromPuzzlePerfSignal
- `src/app/useDiagnosisActions.ts` — lê bandFromPuzzlePerfSignal após Lichess sync
- `src/infra/lichess/games.test.ts` — testes fetchLichessPuzzlePerf
- `src/domain/placement/placement.test.ts` — testes bandFromPuzzlePerfSignal

## Fora de escopo (próximos milestones)

- M2b: sync multi-device via Cloudflare Workers + D1 (bloqueado, aguarda provisioning)
- Puzzle activity histórica como fonte diagnóstica (risco mobile, aguarda M2b para storage server-side)
- UI explícita de "confirmar banda" além da mensagem (M3 UX)
