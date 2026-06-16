# Handoff Codex — Corte L4 (parte 2: terminar o split) + L5 — 2026-06-15

> **Diretor:** Claude Opus 4.8. **Executor:** Codex. Governança: `AGENTS.md`.
> Continuação do `prompts/codex-corte-K-L-mastery-e-refator-2026-06-15.md` (cortes K e L1–L4.5 já
> feitos e revisados pelo diretor — gate verde, 423 testes; flake do `preserveProgress` corrigido em
> `08a11ed`). **Você é o executor.** Decisões abaixo FECHADAS — não reabra. Ambiguidade real → **PARE
> e pergunte** (não adivinhe, não "conserte" teste para passar).

## Estado atual (verifique antes de começar)

- Branch `master`. `src/app/state.ts` tem ~905 linhas (L4.1–L4.5 já extraíram `useAppData`,
  `usePendingActions`, `useDiagnosisActions`).
- **Gate verde obrigatório sempre:** `npm run lint && npm run test && npm run build`. Hoje: lint limpo,
  **423 testes em 59 arquivos**, build OK. Rode a suíte **algumas vezes** (≥3) ao fim de cada extração:
  há testes de integração pesados sensíveis a timing — não introduza flake.
- DNA travado: local-first/sem backend; OAuth só `puzzle:read`/`study:write`; P4/P5 congeladas;
  clean-room; sem promessa de rating; pt-BR; domínio puro; **sem `console.*` em `src`**; **sem dep nova
  sem aprovação**. Commits atômicos `refactor:`/`feat:`/`test:` com trailer
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

# CORTE L4 — parte 2: terminar o split do `useAppState`

**Objetivo:** continuar reduzindo `state.ts` extraindo os comandos restantes em hooks coesos, mantendo
`useAppState` como compositor que re-exporta a **mesma interface pública** (`App.tsx` não muda).
**Refator puro: zero mudança de comportamento.** A suíte inteira (423+) passa **sem editar asserções**.

## Regras duras (idênticas à parte 1)

- **Incremental:** um grupo por commit, gate verde (e ≥3 execuções da suíte) entre cada. **Não**
  reescreva `state.ts` de uma vez.
- **Preserve:** `latestPlanRef` (espelho do plano para o auto-sync), a **transação atômica do J3**
  (`saveTrainingLogAndPlan` em `updateBlockStatusWithTrainingLog`/`skipBlockTraining`), o **wiring de
  mastery do Corte K** (avanço da pendência + `masteryTargetFromCompletedLog`), e os arrays de
  dependência dos `useCallback`/`useEffect`.
- **Padrão de hook:** siga o que `usePendingActions`/`useDiagnosisActions` já fazem — o hook recebe via
  parâmetro o estado e os setters de que precisa (de `useAppData`) e devolve os comandos. Não duplique
  estado; não exponha internals novos aos testes.
- Se um teste exigir mudança de asserção para passar, **PARE e pergunte** — é sinal de regressão de
  comportamento, não de teste errado.

## Ordem das extrações (risco crescente — transação de treino por ÚLTIMO)

### L4.6 — `useBackupActions` (baixo risco)
Extrair de `state.ts`: `enableAutoBackup` (~:751), `disableAutoBackup` (~:779), `clearAllData` (~:794).
Novo `src/app/useBackupActions.ts`. Recebe o que precisar (status de auto-backup, setters, `clearAll`,
regeneração pós-clear se houver). Cobertura: os fluxos de backup/limpar já têm teste de integração —
devem passar sem edição.
Commit: `refactor: Corte L4.6 — extrai acoes de backup de useAppState`.

### L4.7 — `useStudyActions` (médio risco — rede Lichess)
Extrair: `createLichessStudy` (~:483), `reconcileLichessResults` (~:386), `importFreeActivity` (~:442).
Novo `src/app/useStudyActions.ts`. Estes tocam a fila de rede Lichess e estados de mensagem/erro —
**preserve** os estados `lichessMessage`/`lichessConnectionState` e o tratamento de
`LichessRateLimitError`. Testes de `trainingFlow.test.tsx` (Study, reconcile) devem passar sem edição.
Commit: `refactor: Corte L4.7 — extrai acoes de Study/resultados Lichess de useAppState`.

### L4.8 — `useOAuthActions` (médio risco)
Extrair: `connectLichess` (~:365), `disconnectLichess` (~:369). Novo `src/app/useOAuthActions.ts`.
A **conclusão** do OAuth no boot já vive em `useAppData` — **não** mova isso; só os comandos de
conectar/desconectar. Preserve o `singleFlight`/estado de token. Não altere escopos
(`puzzle:read`/`study:write`).
Commit: `refactor: Corte L4.8 — extrai acoes de OAuth de useAppState`.

### L4.9 — `usePlanLifecycleActions` (médio risco)
Extrair: `regeneratePlan` (~:297), `createNextSession` (~:321), `updateLearningPlanResponse` (~:540),
`approveLearningPlan` (~:558), `requestLearningPlanRevision` (~:565), `savePlacementResult` (~:288),
`completeOnboarding` (~:787). Novo `src/app/usePlanLifecycleActions.ts`. Vários usam `buildPlanContext`
+ `generatePlan` + `savePlan` — **preserve** a montagem idêntica e o `latestPlanRef` onde aplicável.
Commit: `refactor: Corte L4.9 — extrai ciclo de plano/placement/onboarding de useAppState`.

### L4.10 — `useTrainingActions` (ALTO risco — por último, cuidado redobrado)
Extrair: `startBlockTraining` (~:589), `updateBlockStatusWithTrainingLog` (~:615),
`skipBlockTraining` (~:744). Novo `src/app/useTrainingActions.ts`.
- **Este grupo guarda a transação atômica do J3 e o wiring de mastery do K.** Mova **sem alterar uma
  linha de lógica**: `saveTrainingLogAndPlan` continua a única escrita atômica log↔plano; o ramo
  `block.pendingItemId` (avanço da pendência + `masteryTargetFromCompletedLog` + regeneração do plano)
  continua **após** a transação, idêntico.
- `saveProfile` (~:235) pode ficar onde estiver melhor (lifecycle ou um `useProfileActions`); se mover,
  preserve o disparo de auto-sync com `try/catch` por fonte (J3) e o `latestPlanRef`.
- **Rode a suíte completa ≥5 vezes** após esta extração (é onde mora o risco de flake/regressão).
Commit: `refactor: Corte L4.10 — extrai acoes de treino (transacao J3 + mastery K) de useAppState`.

**Meta de tamanho:** `state.ts` deve sobrar essencialmente como o compositor `useAppState` + o `return`
da interface (idealmente < ~250 linhas). Se algum comando não se encaixar limpo em nenhum grupo,
**PARE e pergunte** antes de criar um hook "diversos".

---

# CORTE L5 — cobertura + smoke PWA (DEPS APROVADAS pelo dono em 2026-06-15)

> **Atualização do diretor:** o dono **aprovou** as duas dependências abaixo. Pode instalar:
> `@vitest/coverage-v8` (L5.1) e uma ferramenta de browser headless para o smoke (L5.2 —
> `playwright` autorizado a voltar **só para o smoke**, não para a suíte unitária). Continua valendo:
> versões pinadas; nada além dessas duas; `npm ci` deve seguir consistente (atualize o lock).

### L5.1 — baseline de cobertura (APROVADO)
- Adicione `@vitest/coverage-v8` (devDep, versão pinada compatível com vitest 4.1.8).
- Configure `coverage` no `vitest.config.ts`: provider `v8`, reporter `text`+`html`, **sem threshold
  bloqueante** (só baseline). Exclua arquivos de teste e `*.config.*` do relatório.
- Script `"coverage": "vitest run --coverage"` em `package.json`.
- **Não** ligue cobertura no `npm test` default (mantém o gate rápido). Rode `npm run coverage` uma vez
  e **reporte os números** (linhas/branches por pasta), destacando lacunas conhecidas: `Config.tsx`,
  `Onboarding.tsx`, `PlacementCard.tsx`, `state.ts` (hoje sem teste direto).
- Commit: `chore: Corte L5.1 — baseline de cobertura (vitest coverage-v8)`.

### L5.2 — smoke PWA offline em produção (APROVADO usar browser headless)
- Reintroduza `playwright` (devDep pinada) **isolado do gate unitário**: crie `playwright.config.ts` e
  uma pasta `e2e/` própria; **não** deixe o smoke rodar no `npm test` (vitest). Script dedicado, ex.:
  `"smoke:pwa": "playwright test e2e/pwa-offline.spec.ts"`.
- O smoke deve: `npm run build` → subir `vite preview` (porta fixa) → abrir a página → esperar o SW
  registrar e o precache concluir → **`context.setOffline(true)`** → recarregar → asseverar que a UI
  principal renderiza offline **e** que dados locais (IndexedDB) persistem entre reloads.
- Use o `chromium` do Playwright; baixe o browser no setup (`npx playwright install chromium`).
- **Não** acople ao CI ainda (o `.github/workflows/ci.yml` do J2 segue só lint+test+build); deixe o
  smoke como script manual. Se quiser propor um job de CI separado para o smoke, **descreva e pergunte**
  antes — não edite o CI por conta própria.
- Commit: `test: Corte L5.2 — smoke de PWA/offline em producao (playwright isolado)`.

### Verificação final do L5
- `npm run lint && npm run test && npm run build` seguem verdes (o smoke roda **fora** do `npm test`).
- `npm run smoke:pwa` passa localmente. Reporte o resultado + os números de cobertura.

---

## O que NÃO fazer

- **Não** mudar comportamento em nenhuma extração do L4 (refator puro). **Não** "consertar" testes para
  passar — PARE e pergunte.
- **Não** tocar na lógica do Corte K (mastery), J3 (transação), J4-ponte/accuracy — só mover código.
- **Não** adicionar dependência (coverage/PWA) sem aprovação explícita.
- **Não** mexer em OAuth scopes, P4/P5, i18n, rating.

## Critério de pronto (cada corte)

`npm run lint && npm run test && npm run build` verdes; suíte estável em ≥3 execuções (≥5 no L4.10);
contagem de testes ≥ anterior; sem dep nova não-aprovada; `App.tsx` e interface pública inalterados.
Relatório curto por corte (o que moveu, novo arquivo, nº de linhas que `state.ts` perdeu, resultado do
gate + nº de execuções estáveis). Ambiguidade real → **PARE e pergunte**.

## Ordem recomendada

L4.6 → L4.7 → L4.8 → L4.9 → **L4.10 (cuidado redobrado, ≥5 runs)** → L5.1 (se dep aprovada) →
L5.2 (se viável sem dep). Ao terminar o L4.10, devolva o `state.ts` final para revisão do diretor
**antes** de considerar o split "fechado".
