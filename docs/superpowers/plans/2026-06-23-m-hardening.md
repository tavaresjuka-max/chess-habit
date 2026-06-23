# M-Hardening — Limpeza segura + testes de resiliência (Plano)

> **For agentic workers:** executor GLM. TDD onde houver lógica. NÃO commitar (Opus commita). NÃO tocar .env/segredos. NÃO deploy. Gates ao fim: `npm run test`, `npm run lint`, `npm run build`.

**Goal:** subir as notas das áreas *Saúde de código*, *Testes/Resiliência* e *Backup* sem mudar comportamento de produto. Consolidar utilitários duplicados e fechar lacunas de teste de resiliência apontadas na auditoria.

**NON-GOALS (vão pro backlog do próximo ciclo, NÃO mexer aqui):**
- `computeMastery` (wire pedagógico) — decisão de produto + council.
- `puzzle-perf` plumbing (remover vs repurposar como nudge) — decisão de produto.
- Merge para produção — decisão do dono.

---

## Task 1: Consolidar `isRecord` duplicado (5 cópias → 1)

**Files:**
- Create: `src/infra/utils/typeGuards.ts`
- Modify: `src/infra/lichess/account.ts`, `games.ts`, `oauth.ts`, `puzzleActivity.ts`, `puzzleDashboard.ts`

- [ ] **Step 1:** Criar `src/infra/utils/typeGuards.ts`:
```ts
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
```
- [ ] **Step 2:** Em cada um dos 5 arquivos: remover a função privada `isRecord` local e adicionar `import { isRecord } from '../utils/typeGuards';` (ajustar o caminho relativo — de `src/infra/lichess/*` é `../utils/typeGuards`). Confirmar que nenhum outro símbolo quebrou.
- [ ] **Step 3:** `npm run test && npm run lint` — verde. Os parsers (account/games/oauth/puzzleActivity/puzzleDashboard) já têm testes; devem continuar passando sem alteração.

## Task 2: Consolidar `parseJsonLineOrUndefined` duplicado (2 → 1)

**Files:**
- Create: `src/infra/utils/ndjson.ts`
- Modify: `src/infra/lichess/games.ts`, `src/infra/lichess/puzzleActivity.ts`

- [ ] **Step 1:** Mover a função `parseJsonLineOrUndefined` (idêntica em games.ts:123 e puzzleActivity.ts:158) para `src/infra/utils/ndjson.ts` e exportar. Assinatura: `export function parseJsonLineOrUndefined(line: string): unknown`.
- [ ] **Step 2:** Importar nos 2 arquivos, remover as cópias locais.
- [ ] **Step 3:** `npm run test && npm run lint` — verde.

## Task 3: Testes de resiliência — Backup restore (edge cases)

**Files:** Modify `src/infra/storage/backup.test.ts` (ou `appData.test.ts` onde está `importBackupFromJson`).

- [ ] Adicionar casos (TDD: escreve, vê passar/falhar, ajusta):
  - **Checksum inválido:** `importBackupFromJson` com checksum corrompido → rejeita/retorna erro, NÃO limpa as tabelas (atomicidade preservada).
  - **JSON com tabela ausente** (ex.: backup antigo sem `achievements`): restaura o que existe sem lançar; tabelas ausentes ficam vazias, não quebram.
  - **JSON malformado** (não-JSON) → erro tratado, sem corromper estado.
- [ ] `npm run test` — verde.

## Task 4: Testes de resiliência — HTTP queue (retry/timeout/429)

**Files:** Modify `src/infra/http/providerQueue.test.ts`.

- [ ] Casos:
  - **Timeout** por requisição (a fila tem timeout 30s) → rejeita com erro de timeout sem travar a fila para as próximas.
  - **429 + Retry-After:** respeita o cooldown (não dispara imediatamente).
  - **Serialização:** duas chamadas concorrentes na MESMA fila não rodam em paralelo (ordem preservada).
- [ ] `npm run test` — verde.

## Task 5: Testes de resiliência — Pending items (transições de estado)

**Files:** Modify `src/app/usePendingActions.test.tsx` ou `src/domain/method/pendingItems.test.ts`.

- [ ] Casos de transição: criação por feedback 'hard' → `open` (estudar) → `defer` (reagenda `dueAt`) → volta a ficar `due`. Asserir cada transição persiste o campo certo.
- [ ] `npm run test` — verde.

## Task 6: Gates finais

- [ ] `npm run test && npm run lint && npm run build` — tudo verde.
- [ ] RELATÓRIO: arquivos criados/modificados; nº de testes antes/depois; resultado de cada gate; qualquer desvio.

---

## Self-Review
- Cobertura: Tasks 1-2 = *Saúde de código* (dedup). Tasks 3-5 = *Resiliência/Testes* (lacunas PARCIAIS da auditoria). Task 6 = gates.
- Sem mudança de comportamento de produto (só refactor + testes). Risco baixo.
- Órfãos (computeMastery, puzzle-perf) intencionalmente NÃO tocados — backlog.
