# Handoff Codex — Cortes K (mastery→espaçamento) e L (refator J5) — 2026-06-15

> **Diretor:** Claude Opus 4.8. **Executor:** Codex. Governança: `AGENTS.md`.
> Origem das decisões: `docs/review/consolidacao_analise_2026-06-15.md` (backlog J4/J5) +
> descoberta de escopo desta sessão (registrada em `memory/`).
> **Você é o executor.** As decisões de produto/arquitetura abaixo já estão FECHADAS pelo diretor —
> não reabra. Se encontrar ambiguidade real não coberta aqui, **PARE e pergunte** (não adivinhe).

## Estado atual (ponto de partida — verifique antes de começar)

- Branch `master`. Últimos commits desta rodada: `2215318` (J1+J2), `5b90d74` (J3),
  `81ff25b` (J4-ponte), `363c296` (J4-accuracy).
- **Gate verde obrigatório o tempo todo:** `npm run lint && npm run test && npm run build`.
  Hoje: lint limpo, **415 testes em 59 arquivos**, build OK. Você **não pode** reduzir a contagem de
  testes nem deixar o gate vermelho em nenhum commit.
- DNA travado (não viole): local-first, **sem backend**; OAuth opt-in só `puzzle:read`/`study:write`;
  P4/P5 congeladas; clean-room (sem ChessKing); **sem promessa de rating**; microcopy **pt-BR**;
  domínio (`src/domain`) puro (lint proíbe importar React/Dexie lá).
- **Sem dependências novas** sem aprovação. Sem `console.*` em `src` (não há nenhum hoje;
  use os setters de estado/`toErrorMessage` para erro visível).
- Commits atômicos por tarefa, mensagem `feat:`/`refactor:` em pt-BR, terminando com
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

# CORTE K — Mastery dirige o espaçamento da pendência (o "item 15" de verdade)

## Problema (verificado no código)

1. `advancePendingItem` (`src/domain/method/pendingItems.ts:87`) — o "SM-2 simplificado" — **não é
   chamado em lugar nenhum da produção**: só existe na definição + `pendingItems.test.ts`. Ou seja,
   quando um bloco de pendência (`pending-review`) é concluído, a pendência **nunca avança** pelo
   espaçamento. `openPendingItem` (`src/app/state.ts:973`) só abre a URL; `deferPendingItem` só adia.
2. `computeMastery` (`src/domain/method/mastery.ts:9`) é código morto.
3. `masteryTarget` (`src/domain/types.ts:159`) está **hardcoded `'review'`** em
   `createPendingPlanBlock` (`src/domain/plan/generatePlan.ts:220`) e **não é lido por nenhuma UI**.

## Decisões FECHADAS pelo diretor (não reabrir)

- **D-K1.** O avanço da pendência acontece **na conclusão do bloco `pending-review`** (status `done`),
  dentro de `updateBlockStatusWithTrainingLog` (`src/app/state.ts:1065`). O bloco tem `pendingItemId`;
  ache o item em `pendingItems`, chame `advancePendingItem(item, feedback, masteryTarget)`, persista e
  atualize o estado + regenere o plano (mesmo padrão de `deferPendingItem`).
- **D-K2.** `computeMastery` é calculado **no momento da conclusão**, a partir da **accuracy
  reconciliada do log recém-concluído** (`reconcileOutcome.log.result.themeStats`) para o tema do
  item (`item.lichessTheme`), mais o feedback. Accuracy do tema = `(attempts − losses) / attempts`.
- **D-K3.** Mastery **enviesa o espaçamento** (não cria UI nova):
  - `'advance'` → +1 nível extra de espaçamento além do delta do feedback (gradua mais rápido).
  - `'regress'` → volta ao nível 0 (`getNextDueDate(0)`, reaparece amanhã).
  - `'review'`/`undefined` → comportamento atual (só feedback).
- **D-K4.** Sem dados de puzzle reconciliados para o tema (sem `themeStats`, ou `attempts < 3`),
  `minVolumeReached = false` → `computeMastery` devolve `'review'` → nenhum viés. Comportamento
  conservador, igual ao de hoje. Pendência sem `lichessTheme` também cai aqui.
- **D-K5.** `recentFeedbacks` para `computeMastery`: use os 2 mais recentes disponíveis —
  `[item.lastFeedback, feedbackAtual]` filtrando `undefined`. (PendingTrainingItem só guarda
  `lastFeedback`; não invente histórico.)
- **D-K6.** Mantenha `masteryTarget` no bloco (`generatePlan.ts:220`) **deixe como `'review'`** por ora
  — a mastery age no espaçamento, não no bloco. **Não** tente ligar masteryTarget à UI (fora de escopo;
  ninguém lê). Não remova o campo (pode ser usado depois).

## Tarefas (TDD-first, uma por commit)

### K1 — `advancePendingItem` aceita mastery (domínio puro)
`src/domain/method/pendingItems.ts`
- Assinatura: `advancePendingItem(item, feedback?, masteryTarget?: MasteryResult)`.
- Importe `MasteryResult` de `../method/mastery` (mesmo diretório: `./mastery`).
- Regras D-K3 aplicadas sobre o `nextSpacingAttempts` atual:
  - `'regress'` → `attempts = 0`, `dueAt = getNextDueDate(0)`, `status = 'open'` (sobrepõe o feedback).
  - `'advance'` → soma +1 ao resultado de `nextSpacingAttempts` (respeitando o clamp em
    `GRADUATION_ATTEMPTS`); `dueAt = getNextDueDate(attempts)`; pode graduar (`status` conforme já é).
  - demais → inalterado.
  - **Importante:** quando `feedback === 'hard'`, a regra atual de "reaparece amanhã" continua valendo
    para `'review'`/`undefined`; mas `'regress'` e `'advance'` mandam no resultado quando presentes.
    Defina a precedência explicitamente: mastery (quando `'advance'`/`'regress'`) **vence** o ajuste de
    `dueAt` por feedback. Documente em comentário.
- **TDD** em `pendingItems.test.ts`: (a) `'advance'` gradua em menos repetições que sem mastery;
  (b) `'regress'` zera attempts e marca due amanhã mesmo com feedback `'good'`;
  (c) `'review'`/`undefined` não muda nada vs. a chamada de 2 args (retrocompat).
- **Não** quebre os testes existentes de `advancePendingItem` (chamadas de 1–2 args devem continuar
  idênticas — o 3º param é opcional).

### K2 — helper de mastery a partir do log concluído (domínio puro)
`src/domain/method/mastery.ts` (ou um novo `masteryFromLog.ts` no mesmo dir, se preferir coesão)
- Exporte `masteryTargetFromCompletedLog(input: { lichessTheme?: string; themeStats?: PuzzleThemeStat[]; lastFeedback?: PlanBlockFeedback; currentFeedback?: PlanBlockFeedback; attempts: number }): MasteryResult`.
- Lógica:
  - ache o `PuzzleThemeStat` cujo `theme === lichessTheme`; se não houver tema ou `attempts < 3`,
    chame `computeMastery({ accuracyPercent: 0, recentFeedbacks: [...], minVolumeReached: false })`.
  - senão `accuracyPercent = ((attempts − losses) / attempts) * 100` e `minVolumeReached: true`.
  - `recentFeedbacks = [lastFeedback, currentFeedback].filter(Boolean)` (D-K5).
- **TDD** em `mastery.test.ts`: accuracy alta + sem hard → `'advance'`; accuracy média → `'review'`;
  accuracy baixa → `'regress'`; sem themeStats do tema → `'review'`.
- Tipos: `PuzzleThemeStat` e `PlanBlockFeedback` vêm de `../types`.

### K3 — ligar no fluxo de conclusão (app)
`src/app/state.ts` — dentro de `updateBlockStatusWithTrainingLog`, no ramo `status === 'done'`,
**depois** de `saveTrainingLogAndPlan(...)` (a transação log↔plano que o J3 introduziu):
- Se `block.pendingItemId !== undefined`, ache `const item = pendingItems.find(p => p.id === block.pendingItemId)`.
- Se achou: `const masteryTarget = masteryTargetFromCompletedLog({ lichessTheme: item.lichessTheme, themeStats: reconcileOutcome.log.result?.themeStats, lastFeedback: item.lastFeedback, currentFeedback: feedback, attempts: item.attempts })`.
- `const advanced = advancePendingItem(item, feedback, masteryTarget)`.
- Persistir: `await savePendingItem(advanced)` e, se `advanced.status === 'done'`,
  `await updatePendingItemStatus(advanced.id, 'done')` (siga o padrão de persistência já usado;
  confira `savePendingItem` em `src/infra/storage/appData.ts` para saber se ele já grava o status —
  **não duplique** escrita; use o que for coerente com `deferPendingItem`).
- Atualizar estado: `setPendingItems` com o item substituído/filtrado (espelhe o padrão de
  `deferPendingItem` em `state.ts:983`), e regenerar o plano via `buildPlanContext` com os
  `pendingItems` atualizados (de novo, espelhe `deferPendingItem`).
- **Atenção à transação do J3:** não desfaça a atomicidade log↔plano. O avanço da pendência é uma
  escrita adicional **após** a transação; aceitável (a pendência é derivável/reentrante). Não tente
  meter a pendência dentro da mesma transação do log/plano sem necessidade.
- **TDD** (integração) em `src/app/trainingFlow.test.tsx` ou `preserveProgress.test.tsx`: ao concluir
  um bloco `pending-review` com feedback, o item correspondente avança (`attempts`/`dueAt` mudam) e é
  persistido. Use o padrão de stub de `fetch` já presente nos testes para evitar flake de auto-sync.

### K4 — gate + commit
- `npm run lint && npm run test && npm run build` verdes (contagem de testes **≥ 415 + novos**).
- Commit: `feat: Corte K — mastery dirige o espacamento da pendencia (computeMastery vivo)`.

---

# CORTE L — Refatoração e dívida (J5)

Faça **nesta ordem**, **um commit por item**, gate verde entre cada. L1–L3 são baixo risco; **L4 é o
grande refator — só comece depois de L1–L3 verdes e trate com cuidado redobrado.**

### L1 — `assertNever` defensivo nos switches de união (baixo risco)
- Em `src/domain/plan/generatePlan.ts`: `getBlockCopy` (switch em `kind`, ~:304) e `getResourceStage`
  (~:349); em `src/domain/weakness/detectWeaknesses.ts`: `signalToCandidates`.
- Adicione um helper `function assertNever(value: never): never { throw new Error(...) }` (em
  `src/domain/` util, ou local) e um `default` que chame `assertNever(...)` onde a união é fechada.
  Objetivo: adicionar um `kind` novo no futuro passa a **quebrar o build** em vez de retornar
  `undefined` silencioso. **Não** mude o comportamento atual (todos os casos já são cobertos).
- TDD: opcional (o ganho é de compile-time); não remova testes.
- Commit: `refactor: Corte L1 — assertNever fecha os switches de uniao`.

### L2 — deduplicar `runChesscomSync` / `runLichessSync` (médio risco)
- `src/app/state.ts:381` e `:460` são ~90% idênticos (detect→replace→save→setWeaknesses→generatePlan→merge).
- Extraia `runDiagnosisSync({ source, targetProfile, fetchSignals, options })` que recebe a função de
  fetch específica por fonte e centraliza o resto (inclusive o merge via `latestPlanRef`).
- **Preserve exatamente** o comportamento: guarda de validade (`maxAgeMs`), estados `diagnosisState`/
  `lichessConnectionState`/`lichessMessage`, e a aprovação de plano via `latestPlanRef`. Os testes de
  `trainingFlow.test.tsx` (stream NDJSON quebrado etc.) **devem continuar passando sem alteração**.
- Commit: `refactor: Corte L2 — runDiagnosisSync deduplica os syncs Chess.com/Lichess`.

### L3 — índice de `docs/review/` (baixo risco, sem código)
- Crie `docs/review/README.md` com 3 seções: **Ativo** (consolidação + auditoria 2026-06-15),
  **Histórico** (lista datada dos ~30 relatórios), **Leitura p/ novo dev** (3–5 essenciais:
  `analise_completa_claude-opus_2026-06-15.md`, `consolidacao_analise_2026-06-15.md`, `PLANO.md`,
  `AGENTS.md`, `memory/`).
- Commit: `docs: Corte L3 — indice de docs/review`.

### L4 — split do `useAppState` (ALTO risco — o grande refator)
`src/app/state.ts` tem ~1.300 linhas e concentra persistência, OAuth, sync, plano, conquistas e ~20
fatias de estado num único hook. Objetivo: separar **leitura/estado** de **comandos**.
- Abordagem aprovada: dividir em `useAppData` (carga inicial, estado derivado, getters) e
  `useAppActions` (comandos: saveProfile, sync, updateBlockStatus, pendências, OAuth…), compondo em
  `useAppState` que re-exporta a mesma interface pública **sem mudar a API consumida por `App.tsx`**.
- **Restrições duras:**
  - **Zero mudança de comportamento.** É refator puro: a suíte inteira (415+) passa sem editar testes
    (exceto imports, se algum teste importa internals — evite expor internals).
  - Faça **incremental**: extraia um grupo coeso por vez (ex.: primeiro o bloco de pendências, depois
    OAuth, depois sync), rodando o gate a cada extração. **Não** reescreva o arquivo de uma vez.
  - Preserve `latestPlanRef`, a ordem de boot (J3: auto-backup só com `hasData`), a transação
    log↔plano (J3) e os arrays de dependência dos `useCallback`/`useEffect`.
  - Se em algum ponto o comportamento ficar ambíguo ou um teste exigir mudança de asserção, **PARE e
    pergunte** — não "conserte" o teste para passar.
- Commits: um por extração (`refactor: Corte L4.x — extrai <área> de useAppState`).

### L5 — (opcional, se sobrar fôlego) baseline de cobertura + smoke PWA
- `@vitest/coverage-v8` (dev dep — **peça aprovação antes** de adicionar) com relatório, sem
  threshold bloqueante ainda.
- `scripts/smoke-pwa.*` que faz `build`→`preview`→offline e verifica que a UI abre. **Sem** nova
  dep pesada sem aprovação (o `playwright` foi removido de propósito no J1).
- Commit(s) separados; se exigir dep nova, **PARE e pergunte**.

---

## O que NÃO fazer (rejeitado pelo diretor)

- **Não** implementar SM-2 completo com ease-factor (a tabela de 4 níveis basta para 0-1200; só não
  chame de SM-2 onde o comentário enganar).
- **Não** criar UI nova para `masteryTarget` (fora de escopo; mastery age no espaçamento).
- **Não** descongelar P4/P5, **não** adicionar i18n, **não** criptografar token OAuth.
- **Não** adicionar dependências sem aprovação. **Não** usar `console.*` em `src`.
- **Não** "consertar" testes para passar num refator — refator é comportamento-neutro.
- **Não** mexer no proxy de accuracy (J4-accuracy já fechou) nem na ponte puzzle→fraqueza (J4-ponte).

## Critério de pronto (cada corte)

`npm run lint && npm run test && npm run build` verdes, contagem de testes ≥ a anterior, sem dep nova
não-aprovada, DNA respeitado. Entregue um relatório curto por corte (o que mudou, file:line, testes
adicionados, resultado do gate). Em ambiguidade real: **PARE e pergunte ao diretor/dono.**

## Ordem recomendada

K1 → K2 → K3 → K4 (feature de mastery, maior valor pedagógico) → L1 → L2 → L3 → L4 (grande refator,
por último, incremental) → L5 (se houver fôlego).
