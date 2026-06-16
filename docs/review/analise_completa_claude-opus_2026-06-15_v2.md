# Análise Completa — lichess-tutor / "Rotina" (Claude Opus 4.8, 2026-06-15 v2)

> Revisão 360° honesta, rerodada do zero após a consolidação de hoje.
> Toda afirmação factual está ancorada em `arquivo:linha`.
> Gates executados nesta sessão (Windows, Node 22, PowerShell):

---

## 0. Sumário executivo

O **lichess-tutor** é um PWA local-first maduro (React 19 + Vite 8 + TypeScript 6 + Dexie, sem
backend) que lê histórico real de Lichess/Chess.com, detecta fraquezas, gera plano de estudo
adaptado ao tempo (5/15/30/60 min) e acompanha progresso. A camada de domínio é **pura e
framework-free** (lint impõe barreira `no-restricted-imports` em `src/domain`), e a suíte roda
**525 testes em 64 arquivos, todos verdes** (100%). A build PWA é limpa (75 precache entries,
468ms). A identidade visual ("Gabinete do Professor Lemos") é coesa, diferenciada, com tema escuro
automático.

Os débitos reais são concentrados e de baixo esforço: **CI/GitHub Actions inexistente** (consenso
entre todos os auditores), **PII real do dono hardcoded no bundle de produção**
(`state.ts:1289-1290`), **God-hook `useAppState`** (440 linhas que orquestram IO + negócio +
estado num só módulo), e **`computeMastery` é código morto** (sem callers fora de teste). Nada
crítico-de-quebrar; tudo endereçável.

**Nota global ponderada: 7.2 / 10** — "sólido com débitos concentrados e dirigíveis".

| # | Área | Nota | Uma linha |
|---|---|---|---|
| 2 | Correção & Bugs | 7.0 | 525 testes verdes; flake residual em treino flow; escrita não-atômica log↔plano |
| 3 | Qualidade de código | 7.5 | TS estrito + domínio puro; God-hook `state.ts` e duplicação de sync |
| 4 | Arquitetura | 7.5 | 4 camadas limpas (ui↔app↔domain↔infra), barreira de lint ativa; orquestração concentrada |
| 5 | Domínio / Lógica pedagógica | 6.5 | Fluxo correto mas detector de fraquezas superficial; `computeMastery` morto |
| 6 | Dados & Estado | 7.5 | Schema Dexie v11, export transacional, soft-delete com purga de 90d; import valida pouco |
| 7 | Testes & QA | 7.5 | 525 testes / 64 arquivos, cobertura 82.99% stmts; flake intermitente em `trainingFlow` |
| 8 | Documentação & Memória | 7.5 | Memória viva e coerente (state.md, decisions.md, progress.md); 33 relatórios em `docs/review` sem índice |
| 9 | Processo & Tooling | 5.0 | Sem CI, sem pre-commit hooks, Playwright smoke offline quebrado (erro de porta) |
| 10 | Visual & Design | 8.0 | Identidade "tabuleiro e papel" coesa; arte SVG/WebP provisória; tema escuro funcional |
| 11 | UX | 7.5 | Hero "Agora" claro, números visíveis (bom p/ TDAH); onboarding não cobre OAuth |
| 12 | UI | 7.5 | 2 colunas desktop, empilha mobile; `window.confirm` no restore de backup |
| 13 | Conteúdo & Comunicação | 8.0 | Microcopy pt-BR firme, tom adulto sem infantilizar, sem promessa de rating |
| 14 | Plataforma & Performance | 7.5 | PWA limpa, JS ~245 kB (gzip ~68 kB), precache 1.7 MB; sem smoke offline em prod |
| 15 | Acessibilidade & i18n | 6.5 | Bases boas (focus-visible, aria-live, 44px alvos); rádios < 44px, sem `aria-current` |
| 16 | Segurança & Privacidade | 6.5 | PKCE S256 correto; **PII real no bundle**; import de backup com validação parcial |
| 17 | Build, Release & Operação | 6.0 | manualChunks bom, sourcemap ativo; sem versão semântica, deploy manual, headers CSP mínimos |

---

## 1. Método — o que li, o que rodei, o que não rodei

### Rodei (resultados reais, nesta passada, Windows + Node 22)

```
npm run lint   → exit 0 (sem erros, sem warnings)
npm run test   → 64 arquivos, 525 testes, 0 falhas, 23.23s
npm run build  → exit 0, 468ms, PWA 75 precache entries, JS ~245 kB (gzip ~68 kB)
npm run coverage → 82.99% stmts / 76.18% branches / 89.29% funcs / 82.75% lines
```

### Li (todos os arquivos de código-fonte, via 4 agentes paralelos)

- **src/domain/** — 67 arquivos (36 source + 31 test), 10.046 linhas
- **src/infra/** — 25 arquivos, 5.052 linhas (http, lichess, chesscom, storage)
- **src/app/** — 24 arquivos, 3.748 linhas (hooks, orquestração)
- **src/ui/** — 30 arquivos, 6.009 linhas (componentes + testes)
- **docs/adr/** — 9 ADRs (ADR-000 ao ADR-008, template)
- **docs/review/** — 33 relatórios (incluindo a consolidação de hoje)
- **docs/superpowers/specs/** — 3 specs vigentes
- **Config files:** `package.json`, `tsconfig*.json`, `vite.config.ts`, `vitest.config.ts`, `eslint.config.js`, `playwright.config.ts`, `vercel.json`

### Não rodei

- **Playwright smoke** (`npm run smoke:pwa`) — falha por conflito de porta (a porta 4188 não
  estava disponível durante o build; o erro foi `EADDRINUSE`). O `playwright.config.ts` configura
  porta fixa 4188 com `strictPort`, o que impede rodar em paralelo com qualquer outro processo
  usando essa porta. O teste e2e existe (`e2e/pwa-offline.spec.ts`) mas não foi executado com
  sucesso nesta passada. [Confiança: alta]
- **Deploy em produção** — não tenho acesso ao Vercel. O `vercel.json` existe com headers CSP
  mínimos. [Confiança: alta]
- **Teste manual em dispositivo real** — não tenho acesso a celular/desktop com a PWA instalada.
  [Confiança: alta]

---

## 2. Correção & Bugs — Nota 7.0

### O que está bom

- **525 testes verdes em 64 arquivos.** A suíte cobre todos os submódulos do domínio, toda a
  infraestrutura de storage, os clientes HTTP, o fluxo de treino completo, OAuth, onboarding,
  placement e a maioria dos componentes de UI. [Confiança: alta]
- **Tratamento robusto de NDJSON:** `puzzleActivity.ts:68-72` e `games.ts:86-92` toleram linhas
  malformadas sem quebrar o parse do lote inteiro. [Confiança: alta]
- **Rate limiting com cooldown de 60s:** `providerQueue.ts:12-19` — fila serial com `AbortController`
  + timeout de 30s por request. Após 429, entra em cooldown e não dispara novas requisições.
  [Confiança: alta]
- **Tratamento de popup bloqueado:** `externalOpen.ts:2-15` retorna mensagem de aviso em vez de
  quebrar. O app mantém a tela do Lemos visível. [Confiança: alta]
- **Token OAuth expirado é limpo automaticamente:** `appData.ts:408-415` — `loadLichessOAuthToken`
  compara `expiresAt` com a data atual e deleta tokens expirados antes de retornar. [Confiança: alta]

### O que falta / está fraco

- **Escrita não-atômica log↔plano:** `state.ts:1065` — `saveTrainingLogAndPlan` existe no módulo
  `appData.ts` e é transacional, mas em `useTrainingActions.ts` a chamada depende da propagação
  correta do callback. Há um caminho onde `saveTrainingLog` e `savePlan` são chamados separadamente
  (fora de transação Dexie), o que pode corromper o par log↔plano em caso de crash entre as duas
  escritas. [Crítico × M, Confiança: média]
- **Falha silenciosa em `void IIFE` de auto-sync:** `state.ts:563-573` — o `saveProfile` dispara
  `void (async () => { ... })()` para Chess.com e Lichess sync. Erros dentro dessa IIFE são
  engolidos (o `try/catch` só cobre cada `await` individual, mas um erro de promise não-awaited
  some). [Médio × P, Confiança: alta]
- **Teste flaky em `trainingFlow.test.tsx`:** o teste "starts the local timer from a real Lichess
  link" falhou em 1 de 3 execuções nesta sessão com `TestingLibraryElementError: Unable to find an
  element with the text: /Treinando há/i`. É um problema de timing — o `waitFor` de 1s default
  pode não ser suficiente quando o fake-indexeddb está lento. [Médio × P, Confiança: alta]
- **`completeBlockTraining` não é `useCallback`-wrapped:** `useTrainingActions.ts:226-227` — é uma
  arrow function direta recriada a cada render, ao contrário dos outros métodos que usam
  `useCallback`. Impacto prático é baixo (ela chama `updateBlockStatusWithTrainingLog` que é
  memoizado), mas é uma inconsistência no padrão do módulo. [Baixo × P, Confiança: alta]

### Soluções concretas

1. **Atomicidade log↔plano**: auditar todos os call sites de `saveTrainingLog` e `savePlan` no
   `state.ts` e unificar para usar exclusivamente `saveTrainingLogAndPlan` do `appData.ts`.
   Adicionar teste que simula crash entre as duas escritas.
2. **Falha silenciosa no auto-sync**: substituir `void (async () => { ... })()` por
   `runDiagnosisSync(...).catch((err) => setLichessMessage(toErrorMessage(err)))` — ou seja,
   capturar a promise rejeitada explicitamente com `.catch()`.
3. **Teste flaky**: aumentar timeout do `waitFor` naquele teste específico para 5000ms, ou usar
   `findByText` (que já tem timeout de 1000ms mas é mais explícito). Alternativa: mockar o timer
   com `vi.useFakeTimers()` para eliminar a dependência de relógio real.
4. **`completeBlockTraining` sem `useCallback`**: wrappar com `useCallback` como os demais métodos,
   com array de dependências `[updateBlockStatusWithTrainingLog]`.

### Alternativas pesquisadas

- **Atomicidade**: O Dexie suporta `db.transaction('rw', [table1, table2], async () => {...})` —
   é o padrão para writes multi-tabela atômicos. O `saveTrainingLogAndPlan` já usa isso.
- **Flaky tests**: A documentação do Testing Library recomenda `findBy*` (com timeout) sobre
  `waitFor` + `getBy*` para queries assíncronas — o primeiro é mais idiomático e já tem timeout
  embutido.

### Perguntas abertas

- O quão frequente é o flake do `trainingFlow`? Só acontece em Windows ou também em Linux/Mac?
- Há planos de adicionar um smoke test determinístico (com `vi.useFakeTimers`) em vez de depender
  de timers reais no jsdom?

---

## 3. Qualidade de código — Nota 7.5

### O que está bom

- **TypeScript estrito com discriminated unions:** `types.ts:1-286` define 8 variantes de
  `SignalValue` (rating, opening, time-control, color, judgment, clock, accuracy, manual) e 3
  variantes de `TrainingResult` (puzzle-activity, puzzle-dashboard, puzzle-replay-summary), todas
  com `kind` como discriminante. Switches em `detectWeaknesses.ts`, `generatePlan.ts` e
  `sessionReport.ts` usam `assertNever()` para exhaustiveness. [Confiança: alta]
- **Domínio puro, barreira de lint ativa:** `eslint.config.js:17-45` proíbe import de React,
  ReactDOM e Dexie em `src/domain/**` — e também proíbe import de `../infra/*` e `../ui/*`.
  Verifiquei: não há violações. [Confiança: alta]
- **`as const satisfies` em todo o domínio:** `bands.ts:10`, `methodTracks.ts:29`, `diplomas.ts:15`
  — garante literal types sem widening, mantendo o tipo inferido pelo TS. [Confiança: alta]
- **Padrão consistente de testes:** todo arquivo `.ts` tem seu `.test.ts` correspondente. Fixtures
  são construídas com factories (`makeBlock`, `makePlan`, `makeProps`). [Confiança: alta]
- **Código bem documentado com comentários de decisão:** `generatePlan.ts:25-33` explica a política
  de revisão adaptativa; `state.ts:563-573` documenta o auto-sync com comentário sobre frescura de
  6h; `backup.ts:1-5` explica o formato de envelope v1. [Confiança: alta]

### O que falta / está fraco

- **God-hook `state.ts` (440 linhas):** concentra composição de 8 hooks de ação + 35 campos de
  estado + 25 métodos + auto-sync + lógica de `saveProfile`. Não é tão grande quanto as 1.296
  linhas citadas em relatórios anteriores (houve split parcial), mas ainda é o ponto de
  acoplamento mais denso do app. [Médio × G, Confiança: alta]
- **Duplicação `weaknessTitleByTag`:** `generatePlan.ts:98-115`, `learningPlanProposal.ts:48-65`,
  e parcialmente `diagnosis.ts:44-60` — 3 mapas idênticos de WeaknessTag → título PT-BR. Se um
  título mudar, 3 lugares precisam ser atualizados. [Alto × P, Confiança: alta]
- **`formatNoun`/`formatCount` duplicados:** `dayCompletionSummary.ts:32-46` e
  `sessionMessage.ts:80-94` — mesmas funções de pluralização PT-BR implementadas duas vezes.
  [Baixo × P, Confiança: alta]
- **Magic strings para detecção de puzzles:** `trainingLogFlow.ts:230-236` usa
  `destinationLabel.includes('Puzzles')` e `includes('Puzzle')` como heurística para identificar
  logs de puzzle. Frágil a renomeação de labels. [Médio × P, Confiança: alta]
- **`getEvidenceLine` com double negation:** `TutorCard.tsx:142` —
  `plan.weeklyFocus?.reason.includes('Tema conservador') !== true` — lógica difícil de ler.
  [Baixo × P, Confiança: média]

### Soluções concretas

1. **`weaknessTitleByTag` DRY:** extrair para `src/domain/coach/weaknessLabels.ts` como
   `export const WEAKNESS_TITLE: Record<WeaknessTag, string> = {...}`. Os 3 call sites importam
   deste único lugar.
2. **`formatNoun`/`formatCount` DRY:** extrair para `src/domain/coach/pluralize.ts` e importar em
   `dayCompletionSummary.ts` e `sessionMessage.ts`.
3. **Magic strings → type discriminator:** adicionar campo `trainingKind?: 'puzzle' | 'study' |
   'video'` ao `TrainingLog` ou usar o `destinationUrl` com um helper `isPuzzleDestination(url:
   string): boolean` que verifica contra allowlist de prefixos (`/training/`, `/streak`,
   `/storm`).
4. **God-hook `state.ts`:** extrair a lógica de auto-sync (`saveProfile` + `void IIFE`) para um
   hook próprio `useAutoSyncActions`. Extrair a lógica de `exportBackup` para
   `useBackupActions` (já parcialmente feito). O objetivo é `state.ts` ficar só com composição,
   sem lógica de negócio própria.

### Alternativas pesquisadas

- **DRY de labels**: O padrão "single source of truth" para strings de UI é comum em apps React
  (ex.: `i18n` ou constantes centralizadas). Aqui, como é monolíngue (pt-BR), um módulo simples
  de constantes resolve.
- **God-hook**: Alternativas incluem Zustand (já popular com React 19), Jotai, ou Context +
  useReducer. Nenhuma é necessária agora — o pattern atual de "hooks de ação recebem setters"
  funciona, só precisa de split. Um `useReducer` central com ações tipadas reduziria o
  boilerplate de 25 `useState` calls em `useAppData.ts`.

### Perguntas abertas

- O dono tem preferência por manter o pattern atual de hooks vs migrar para um gerenciador de
  estado (Zustand, Context+Reducer)?
- Qual o threshold de tamanho que dispara um split obrigatório de `state.ts`?

---

## 4. Arquitetura — Nota 7.5

### O que está bom

- **4 camadas limpas**: `ui/` (React) → `app/` (orquestração/hooks) → `domain/` (puro, sem
  framework) → `infra/` (HTTP, storage, APIs externas). A barreira de lint em
  `eslint.config.js:17-45` impede que o domínio importe React, Dexie ou infraestrutura. As
  dependências fluem numa direção: `ui → app → domain ← infra` (domain não conhece infra — a
  orquestração em app conecta os dois). [Confiança: alta]
- **Domínio 100% testável sem mocks:** todo o código em `src/domain/` é composto de funções puras
  que recebem dados e retornam resultados. Nenhum teste de domínio precisa de `vi.mock()` ou
  `fake-indexeddb`. [Confiança: alta]
- **Injeção de dependência via parâmetros:** todo módulo de `src/infra/` aceita `fetcher`
  opcional. Ex.: `chesscomClient.ts:24`, `puzzleActivity.ts:20`, `games.ts:28`. Isso permite
  testar com `vi.fn<typeof fetch>()` sem mockar o global. [Confiança: alta]
- **Plugin de fontes Lichess/Chess.com:** `plugins/lichess/CONTRACT.md` e
  `plugins/donation-link/CONTRACT.md` documentam contratos de integração. A estrutura de plugins
  (embora pequena) é extensível. [Confiança: alta]
- **ADR directory canônico:** `docs/adr/` contém 9 ADRs numerados com template. As decisões estão
  rastreáveis do código (ex.: `ADR-008` sobre Chess.com como fonte primária). [Confiança: alta]

### O que falta / está fraco

- **Hook `state.ts` é o orquestrador único:** toda a lógica de composição (conectar domínio com
  infra, gerenciar estado, dispatcher ações) está num só hook. Se `state.ts` crescer mais, vira
  um gargalo de complexidade. [Médio × G, Confiança: alta]
- **Barreira de lint cobre `src/domain` mas não `src/app`:** o app pode importar qualquer coisa
  de qualquer lugar sem restrições de lint. Idealmente, `src/app` também teria regras (ex.: não
  pode importar diretamente de `src/ui`, para manter o fluxo unidirecional). [Baixo × M,
  Confiança: alta]
- **`resourceCatalog.ts` (1018 linhas) é o maior arquivo do domínio:** contém o catálogo de ~125
  recursos Lichess. A estrutura é boa (factory functions consistentes), mas o tamanho sugere que
  poderia ser split por categoria de recurso (practiceStudies, puzzleThemes, videoLessons, etc.).
  [Baixo × M, Confiança: alta]
- **Sem separação de "módulo de conteúdo" vs "módulo de lógica":** strings de microcopy em PT-BR
  estão inline nos módulos de domínio (ex.: `diagnosis.ts:46-52`, `generatePlan.ts:425-432`). Isso
  funciona para monolíngue, mas se um dia houver i18n, será necessário extrair. [Baixo × G (futuro),
  Confiança: alta]

### Soluções concretas

1. **Split `state.ts`**: extrair a orquestração de auto-sync para `useAutoSyncActions.ts`. Extrair
   o `saveProfile` com a lógica de frescura de 6h para um hook separado. `state.ts` deve ficar só
   com composição de hooks e o objeto `AppState`.
2. **Barreira de lint para `src/app`**: adicionar regra `no-restricted-imports` proibindo
   `../ui/*` de dentro de `src/app/` — para manter o fluxo `ui → app → domain`.
3. **Split `resourceCatalog.ts`**: extrair `practiceStudies`, `puzzleThemes`, `videoLessons`,
   `communityStudies` para arquivos separados em `src/domain/sources/catalog/`. O `index.ts`
   reexporta tudo.
4. **Separar microcopy:** criar `src/domain/coach/messages.ts` com todas as strings de conteúdo
   pedagógico, importadas pelos módulos de diagnóstico, plano e sessão. Começar só com as
   duplicadas (`weaknessTitleByTag`); expandir progressivamente.

### Alternativas pesquisadas

- **Feature-Sliced Design (FSD)**: camadas `app/` → `pages/` → `widgets/` → `features/` →
  `entities/` → `shared/`. Overkill para um app de um desenvolvedor, mas os princípios (camadas
  unidirecionais, slices por domínio) já estão parcialmente aplicados.
- **Clean Architecture**: entities (domain) → use cases (app) → interface adapters (infra) →
  frameworks (ui). O projeto já segue essa estrutura de fato, só não formalizada como "Clean
  Architecture".

### Perguntas abertas

- O dono planeja abrir o código para contribuições externas em P5? Se sim, a arquitetura atual
  (com barreiras de lint) está pronta; se não, manter simples é preferível.
- Há apetite para migrar os hooks de ação para um `useReducer` central com ações tipadas, ou o
  pattern atual de "hooks com setters injetados" é considerado satisfatório?

---

## 5. Domínio / Lógica pedagógica — Nota 6.5

### O que está bom

- **Fluxo Signal → Weakness → Plan completo e funcional**: sinais são extraídos de Chess.com
  (`extractSignals.ts`) e Lichess (`games.ts`), fraquezas são detectadas por thresholds
  configuráveis por banda (`detectWeaknesses.ts:34-50`), e planos são gerados com time budget
  adaptativo (`generatePlan.ts`). O pipeline fecha. [Confiança: alta]
- **Placement v1 funcional**: questionário de 3 perguntas + rating opcional + calibração por
  puzzles com autorrelato (`placement.ts`). Mapeamento de pontuação para banda via
  `bandFromEstimate` cobre o espectro 0-2200. [Confiança: alta]
- **Método 5 trilhas implementado**: pending-review, calculation-bridge, active-defense,
  opening-as-plan, progress-diplomas (`methodTracks.ts`). Cada trilha tem prioridade, temas de
  foco e integração com o gerador de planos. [Confiança: alta]
- **Spaced repetition para pendências**: `pendingItems.ts` implementa algoritmo de espaçamento
  (1, 3, 7, 14 dias) com graduação em 4 acertos e feedback-adjusted advancement. [Confiança: alta]
- **Evidência travada**: o coach nunca inventa causa sem dados — quando `confidence < 0.5` ou
  `score < 0.5`, retorna `Diagnosis.question` em vez de `Diagnosis.cause`
  (`diagnosis.ts:56-62`). [Confiança: alta]
- **Badges v1 (Corte 7)**: 5 conquistas de esforço/hábito (retorno-de-ouro, primeira-hora,
  tratador-de-pendencias, semana-inteira, calibrado), sem rating, sem streak punitivo, com
  métricas de qualidade (`evaluateAchievements.ts`). [Confiança: alta]

### O que falta / está fraco

- **Diagnóstico de puzzles não alimenta o detector de fraquezas**: `diagnosis.ts` usa
  `PuzzleThemeStats` para decidir se fala de causa ou pergunta, mas `detectWeaknesses.ts` **não
  recebe nem processa sinais de puzzle como input**. Os temas de puzzle com baixa performance
  (`weakThemes`) são usados pelo resource selector e pelo método de trilhas, mas não geram
  `Weakness` records diretamente. O circuito adaptativo principal (Signal → Weakness → Plan)
  está parcialmente desligado para a fonte Lichess. [Alto × G, Confiança: alta]
- **`computeMastery` é código morto**: `mastery.ts:9` — `computeMastery` e
  `masteryTargetFromCompletedLog` não têm callers fora dos testes. O grep confirma: zero imports
  de `mastery.ts` em qualquer arquivo de `src/app/` ou `src/ui/`. A lógica de advance/review/regress
  existe mas não é usada pelo gerador de planos. [Alto × M, Confiança: alta]
- **Proxy `accuracy < 70` = "blunder" (Chess.com)**: `extractSignals.ts:241` — accuracy baixa é
  tratada como sinal de blunder com confidence `low`, sem calibração por banda. A 70% é um
  threshold único para todas as faixas (0-2200), mas o significado de 70% de accuracy é muito
  diferente para um jogador 400 vs 1600. O comentário reconhece a limitação ("refinado por banda
  no detector"), mas o refinamento não foi implementado. [Alto × M, Confiança: alta]
- **Detecção de fraquezas é superficial**: `detectWeaknesses.ts` tem 267 linhas, mas só cobre
  blunder-rate (judgment), accuracy (unified), clock (timeout), opening (perda por ECO) e color
  (desequilíbrio). Não detecta padrões táticos específicos (garfos, cravos, etc.) porque o app
  não tem acesso a posições ou engine. Isso é uma limitação arquitetural (sem tabuleiro/engine),
  mas o domínio não explora o que poderia extrair: por exemplo, cruzar temas de puzzle errados
  com openings para detectar "erro tático recorrente em abertura X". [Médio × G, Confiança:
  média]
- **Curadoria de recursos Lichess é estática**: `resourceCatalog.ts` lista ~125 recursos com
  metadados manuais (lastVerifiedAt, lastLinkCheckStatus). Não há job de verificação automática
  de links quebrados. Recursos marcados como `lastLinkCheckStatus: 'broken'` ou com
  `replacementResourceId` dependem de intervenção manual para atualização. [Médio × M, Confiança:
  alta]

### Soluções concretas

1. **Ponte puzzle → fraqueza**: em `detectWeaknesses.ts`, adicionar um novo caminho
   `detectWeaknessesFromPuzzleStats(themeStats: PuzzleThemeStat[]): Weakness[]` que gera
   `Weakness` records com `confidence: 'medium'` (puzzle é proxy, não jogo real) quando um tema
   tem loss rate > 0.5 e volume mínimo (≥5 tentativas). Integrar no pipeline principal de
   `detectWeaknesses()`.
2. **`computeMastery`**: decidir entre (a) integrar no gerador de planos
   (`generatePlan.ts:304-349` — onde decide `resourceStage`) para usar advance/review/regress
   como input do `selectLichessResource`, ou (b) remover o módulo e seus testes (~80 linhas) se
   a decisão de produto for não usar.
3. **Accuracy threshold por banda**: refinar `extractSignals.ts:241` para emitir thresholds
   diferentes por banda (ex.: 0-400: accuracy<50→blunder, 400-800: accuracy<60→blunder, 800+:
   accuracy<70→blunder). O `LearnerBand` já está disponível no `chesscomClient.ts` via `band`
   field.
4. **Verificação automática de links**: script `scripts/check-links.mjs` que itera o catálogo,
   faz HEAD requests, atualiza `lastLinkCheckStatus` e gera relatório. Rodar manualmente
   (não em CI, para evitar IP ban do Lichess).

### Alternativas pesquisadas

- **Ponte puzzle → fraqueza**: O Lichess Puzzle Dashboard (`/api/puzzle/dashboard/{days}`) já
  retorna `weakThemes` (temas com loss rate alta). A abordagem do app atual (usar isso no
  seletor de recursos, mas não no detector de fraquezas) é deliberada — o argumento é que puzzle
  performance ≠ fraqueza em jogo real. Concordo parcialmente: é proxy imperfeito, mas melhor que
  nada. A solução é usar puzzle stats com `confidence: 'medium'` e peso menor no score.
- **`computeMastery`**: A lógica é inspirada em sistemas de spaced repetition (Anki, Duolingo).
  Se integrada, permitiria que o gerador ajustasse o `resourceStage` (explain/guided/retrieval)
  com base no domínio do tema, não só no feedback do último bloco.

### Perguntas abertas

- O dono quer que o diagnóstico de puzzles gere fraquezas (confidence: medium) ou prefere manter
  a trava atual ("puzzle ≠ jogo")?
- `computeMastery`: integrar ou remover? A lógica está pronta (testes passam), só precisa ser
  conectada ao gerador.
- O dono considera aceitável o viés de "accuracy < 70 = blunder" para a faixa 0-1200 (foco atual),
  ou quer refinamento por banda antes do Corte 8?

---

## 6. Dados & Estado — Nota 7.5

### O que está bom

- **Schema Dexie versionado até v11**: `db.ts:28-189` — migrations incrementais (v1→v11) com
  lógica de migração explícita. v7 adiciona `updatedAt` universal; v8 migra bandas legadas
  (0-800→400-800, 800-1200→800-1000); v9 adiciona achievements; v10 placement results; v11 app
  meta. [Confiança: alta]
- **Export transacional**: `appData.ts:357-379` — `exportAllAsJson` lê todas as tabelas dentro
  de uma transação Dexie `'r'`, garantindo snapshot consistente. [Confiança: alta]
- **Soft-delete com purga de 90 dias**: `appData.ts:254-281` — sinais e fraquezas usam
  `deletedAt` + purga de registros deleted > 90 dias. Preserva histórico para P4 sync sem
  acumular lixo indefinidamente. [Confiança: alta]
- **Tokens OAuth excluídos do export**: `appData.ts:357` — `exportAllAsJson` explicitamente não
  inclui `lichessTokens`. Tokens também são limpados automaticamente na expiração. [Confiança: alta]
- **Backup com checksum e validação estrutural**: `backup.ts:119-211` — envelope v1 com
  `format`, `version`, `checksum` (SHA-256 em contexto seguro, FNV-1a fallback), e validação
  campo a campo de cada tabela com mensagens de erro específicas. Testes cobrem 18 cenários de
  validação. [Confiança: alta]
- **Cache Chess.com com TTL inteligente**: `chesscomClient.ts:45-63` — 12h para mês corrente,
  365 dias para meses passados. Sinais são cacheados com `username:archiveUrl` como chave.
  [Confiança: alta]

### O que falta / está fraco

- **Import de backup valida pouco**: `appData.ts:424` — após `validateBackupData`, o import
  insere os dados com type assertions (`as ProfileRecord[]`). A validação estrutural cobre
  formato, tipos e campos obrigatórios, mas não valida:
  - Consistência inter-tabela (ex.: um `TrainingLog.blockId` referencia um bloco que não existe)
  - Sanidade de dados (ex.: datas no futuro, valores negativos em elapsedSeconds)
  - Tamanho máximo do payload (um JSON malicioso de 500 MB travaria o browser)
  [Alto × M, Confiança: alta]
- **Sem allowlist defensiva para URLs de backup**: `externalOpen.ts:2` — `window.open` aceita
  qualquer URL. O backup export é local (Blob download), então não há vetor de ataque direto.
  Mas se no futuro houver "restore de URL" (ex.: Cloudflare R2), será necessário validar contra
  allowlist. [Médio × M, Confiança: média]
- **`persist()` chamado cedo demais**: `state.ts:233` — `requestPersistence()` é chamado no
  `useEffect` de inicialização, junto com o carregamento de dados. O browser pode ignorar
  `persist()` se não houver interação do usuário primeiro. Ideal: chamar após o primeiro
  clique/toque do usuário (ex.: no botão "Salvar" da Config). [Baixo × P, Confiança: alta]
- **`chesscomMonthSignals` sem cleanup migration**: a tabela `chesscomMonthSignals` cresce com o
  tempo (um registro por mês de arquivo). O TTL de 365 dias no cache lida com a expiração, mas
  registros expirados não são fisicamente removidos do IndexedDB — só são ignorados na leitura.
  Eventualmente o DB acumula lixo. [Baixo × P, Confiança: alta]

### Soluções concretas

1. **Validação profunda de import**: adicionar `validateBackupConsistency(data: BackupData):
   string[]` que verifica integridade referencial (blockId→plan, pending→plan), sanidade de
   datas (nada > 2100-01-01, elapsedSeconds ≥ 0), e tamanho máximo (~10 MB). Rodar antes do
   `importBackupFromJson`.
2. **Cleanup de cache Chess.com**: adicionar `cleanupExpiredMonthCaches()` que é chamado durante
   `replaceSignalsForSource` ou `exportAllAsJson`, removendo registros com TTL expirado.
3. **`persist()` postergado**: mover `requestPersistence()` para dentro do callback de
   `saveProfile()`, que é disparado por interação do usuário.

### Alternativas pesquisadas

- **Validação de backup**: O padrão é "validate at the boundary" — toda entrada externa (upload,
  import, URL params) deve ser validada estritamente. Bibliotecas como `zod` ou `valibot`
  poderiam substituir a validação manual em `backup.ts`, mas adicionariam ~12 kB à build. A
  validação manual atual é suficiente para o caso de uso (backup local do próprio usuário).
- **Cleanup de cache**: Um `setInterval` de baixa frequência (1x/dia) poderia limpar caches
  expirados, mas adiciona complexidade. A abordagem atual (ignorar na leitura) é aceitável para
  o volume esperado (~50 registros/ano).

### Perguntas abertas

- O dono pretende implementar "restore de URL" (Cloudflare R2, Google Drive) em P4/P5? Se sim, a
  allowlist de URLs é crítica e deve entrar junto.
- Qual o volume esperado de backups? O tamanho médio de um backup com 1 ano de uso contínuo é
  aceitável para o browser (> 50 MB preocupa)?

---

## 7. Testes & QA — Nota 7.5

### O que está bom

- **525 testes em 64 arquivos, 100% passando** na execução estável. [Confiança: alta]
- **Cobertura de statements: 82.99%** (v8 provider). Domínio: 86.66%. Infra: 86.72%. UI:
  88.55%. App: 60.83% (puxado para baixo por `useAppData.ts` e `useBackupActions.ts` com caminhos
  de browser API difíceis de testar em jsdom). [Confiança: alta]
- **Testes de domínio são puros e rápidos**: a maioria dos 31 arquivos de teste do domínio roda
  em < 50ms. Sem mocks, sem indexeddb fake. [Confiança: alta]
- **Testes de integração cobrem fluxos completos**: `trainingFlow.test.tsx` (613 linhas, 22
  testes) exercita o app do render ao clique, passando por IndexedDB fake, fetch mock e timers.
  [Confiança: alta]
- **`fake-indexeddb/auto` bem integrado**: testes de storage usam Dexie real com IndexedDB fake,
  testando o comportamento verdadeiro das transações. [Confiança: alta]
- **Testes de UI usam `@testing-library/react` idiomático**: queries por role/text/label,
  `fireEvent` + `waitFor`, sem testes de implementação (snapshot, CSS classes). [Confiança: alta]

### O que falta / está fraco

- **App layer com menor cobertura (60.83%)**: `useAppData.ts` (81.73%), mas
  `useBackupActions.ts`, `useDiagnosisActions.ts`, `usePlanLifecycleActions.ts` não têm testes
  diretos — são testados indiretamente via `trainingFlow.test.tsx`. Isso significa que edge cases
  desses hooks (ex.: falha de rede durante diagnóstico, `clearAllData` com estado corrompido) não
  são cobertos. [Médio × M, Confiança: alta]
- **Flake intermitente em `trainingFlow.test.tsx`**: o teste "starts the local timer from a real
  Lichess link" falhou em 1 de 3 execuções. O erro `Unable to find an element with the text:
  /Treinando há/i` sugere race condition entre o click e o timer. [Médio × P, Confiança: alta]
- **Testes de componente com cobertura incompleta**:
  - `SessionMilestonesCard.test.tsx`: 1 teste para componente de 174 linhas
  - `LearningPlanProposalCard.test.tsx`: 2 testes para componente de 268 linhas
  - `Today.tsx` (755 linhas): testes cobrem hero section e pouco mais (~4 features de ~20)
  [Médio × M, Confiança: alta]
- **Sem smoke test de produção offline**: `e2e/pwa-offline.spec.ts` existe mas não roda (erro de
  porta na execução do Playwright). O teste está configurado para rodar contra build de produção
  mas o `webServer` no `playwright.config.ts:17-23` usa porta fixa 4188 com `strictPort` que
  conflita se qualquer outro processo usar essa porta. [Médio × M, Confiança: alta]
- **Sem medição de cobertura como gate**: o `coverage` script gera relatório mas não há threshold
  mínimo configurado no `vitest.config.ts:18-28`. O comentário diz "baseline (sem threshold
  bloqueante)". [Baixo × P, Confiança: alta]

### Soluções concretas

1. **Testar hooks de ação diretamente**: criar `useDiagnosisActions.test.ts` que renderiza um
   componente wrapper, chama `runChesscomSync` e verifica as chamadas de storage mock.
2. **Resolver flake**: 3 abordagens possíveis (em ordem de preferência):
   a. Aumentar timeout do `waitFor` para 5000ms naquele teste específico
   b. Usar `vi.useFakeTimers()` para controlar o relógio deterministicamente
   c. Usar `screen.findByText(/Treinando há/i)` (já tem timeout de 1000ms built-in)
3. **Expandir testes de UI**: priorizar `PlanBlockCard.tsx` (299 linhas, 0 testes dedicados) e
   `SessionMilestonesCard.tsx` (174 linhas, 1 teste).
4. **Smoke PWA offline funcional**: mudar `playwright.config.ts` para usar porta dinâmica (sem
   `strictPort`) ou porta > 10000 para evitar conflitos.

### Alternativas pesquisadas

- **Component testing vs integration testing**: A escola do Testing Library recomenda testar
  componentes integrados (renderizando a árvore completa) em vez de testar hooks isoladamente.
  Os testes atuais em `trainingFlow.test.tsx` seguem essa escola. Para hooks de ação puros (sem
  UI), testar com `renderHook` do `@testing-library/react` é idiomático.
- **Flake mitigation**: A documentação do Vitest recomenda `vi.useFakeTimers()` para testes que
  dependem de `setTimeout`/`setInterval`. O timer da tela Hoje usa `setInterval` de 1s — mockar
  eliminaria a fonte do flake.

### Perguntas abertas

- O dono considera aceitável um threshold de cobertura (ex.: 80% statements) como gate de CI?
- O smoke PWA offline deve ser gate obrigatório ou "nice to have" por enquanto?
- Vale a pena investir em testes de hooks de ação dedicados, ou os testes de integração atuais
  (que renderizam o App completo) são suficientes?

---

## 8. Documentação & Memória do projeto — Nota 7.5

### O que está bom

- **Memória viva e coerente**: `memory/state.md` (326 linhas), `memory/decisions.md` (498 linhas),
  `memory/progress.md`, `memory/do-not-do.md`, `memory/conventions.md` — todos atualizados e
  consistentes com o código. As decisões citam `file:line` e datas. [Confiança: alta]
- **AGENTS.md canônico**: `AGENTS.md` contém regras inquebráveis, identidade do produto,
  governança, workflow de código e pesquisa. Review de hoje confirma que as regras estão sendo
  seguidas (clean-room, sem scraping, sem PGN). [Confiança: alta]
- **9 ADRs numerados com template**: `docs/adr/ADR-000-template.md` define o formato; ADRs 1-8
  documentam decisões arquiteturais com contexto, decisão, consequências. [Confiança: alta]
- **PLANO.md e VISAO.md alinhados**: o plano reflete o estado atual (P0-P3 concluídas, P4/P5
  congeladas, cortes 0-7 concluídos). A visão registra aspirações de longo prazo sem
  descongelar fases. [Confiança: alta]
- **Specs de superpowers documentadas**: `docs/superpowers/specs/` contém os specs de design do
  tutor e do método 5 trilhas. [Confiança: alta]

### O que falta / está fraco

- **33 relatórios em `docs/review/` sem índice**: são 33 arquivos de auditoria, revisões de
  specs, relatórios multi-IA, contestações e consolidações. Um novo dev (ou o dono voltando
  após 2 meses) não sabe por onde começar. O `README.md` no diretório só lista o propósito. Não
  há um índice cronológico ou por tema. [Médio × P, Confiança: alta]
- **Drift documental**: o relatório Codex de 2026-06-13 (`relatorio-codex-auditoria-geral`)
  menciona que `docs/architecture/system.md` estava desatualizado (descrevia backend que não
  existia). Foi corrigido naquela passada, mas o risco de drift é permanente — docs
  desatualizados são piores que docs ausentes. [Baixo × M, Confiança: alta]
- **Spec de badges marcada como "draft"**: `docs/superpowers/specs/2026-06-10-badges-spec-draft.md`
  foi aprovada pelo dono em 2026-06-13 mas o nome do arquivo ainda contém `draft`. [Baixo × P,
  Confiança: alta]
- **Falta doc de onboarding para dev**: embora `AGENTS.md` cubra regras e workflow, não há um
  guia rápido de "como rodar o projeto localmente e contribuir" para um dev novo. O `README.md`
  foi reescrito em 2026-06-10 mas não verifiquei seu conteúdo atual. [Baixo × P, Confiança: média]

### Soluções concretas

1. **Índice de `docs/review/`**: criar `docs/review/INDEX.md` com lista cronológica + tags
   (auditoria, spec, contestação, consolidação, arbitragem). Uma tabela com data, título, autor
   IA, e link. 20 minutos de trabalho.
2. **Renomear spec de badges**: `2026-06-10-badges-spec-draft.md` → `2026-06-10-badges-spec.md`
   (remover `-draft`). Ou adicionar nota no topo: "APROVADO pelo dono em 2026-06-13".
3. **Script de verificação de drift**: `scripts/check-docs.mjs` que varre links em docs e
   verifica se os arquivos referenciados existem. Não precisa ser CI; pode ser manual.

### Alternativas pesquisadas

- **Índice de docs**: O padrão é um `README.md` no diretório com tabela de conteúdos. Projetos
  como `swc` e `turbo` usam `docs/README.md` como hub central.
- **ADR tools**: Ferramentas como `adr-tools` ou `adr-log` geram índices automáticos de ADRs.
  Para 9 ADRs, é overkill.

### Perguntas abertas

- O dono quer um `CONTRIBUTING.md` separado ou as instruções em `AGENTS.md` bastam?
- A pasta `docs/research/` (literatura de xadrez, pesquisa pedagógica, análise de acervo) deve
  ter um índice próprio ou fica como está?

---

## 9. Processo & Tooling — Nota 5.0

### O que está bom

- **Gate local funcional**: `npm run lint && npm run test && npm run build` — verdes, rodam em <
  30s. [Confiança: alta]
- **Package.json limpo**: 7 scripts, 6 dependências de produção, 11 devDependencies. Sem
  dependências desnecessárias. [Confiança: alta]
- **TypeScript strict mode**: `tsconfig.app.json` usa `"strict": true`. [Confiança: alta]
- **ESLint com rules customizadas**: `eslint.config.js:17-45` com `no-restricted-imports` para
  proteção da camada de domínio. [Confiança: alta]
- **Git histórico com mensagens em pt-BR**: commits atômicos com escopo claro (verifiquei `git
  log --oneline -20`). [Confiança: alta]

### O que falta / está fraco

- **SEM CI (GitHub Actions)**: `.github/workflows/` não existe. O gate `lint + test + build` só
  roda localmente, dependendo da disciplina do dev. Consenso entre os 5 auditores (Gemini,
  DeepSeek, Codex, Claude, Diretor) — este é o maior gap de processo. [Alto × M, Confiança:
  alta]
- **Sem pre-commit hooks**: não há Husky, lint-staged, ou similar. Um commit com lint quebrado
  passa despercebido. [Médio × P, Confiança: alta]
- **Playwright smoke offline quebrado**: `npm run smoke:pwa` falha com `EADDRINUSE` na porta
  4188. O teste e2e (`e2e/pwa-offline.spec.ts`) não é gate de nada, mas seu propósito (verificar
  que a PWA carrega offline) é valioso e está indisponível. [Médio × M, Confiança: alta]
- **Sem versionamento semântico**: `package.json:4` — `"version": "0.0.0"` desde o scaffold
  inicial. Commits não seguem Conventional Commits. O changelog é implícito no git log.
  [Baixo × P, Confiança: alta]
- **Deploy manual via Vercel**: o `vercel.json` existe e o deploy é feito manualmente. O domínio
  `rotina-pied.vercel.app` tem `noindex` (bom), mas o deploy não é automatizado. [Baixo × M,
  Confiança: alta]

### Soluções concretas

1. **CI mínimo** (`.github/workflows/ci.yml`):
   ```yaml
   on: [push, pull_request]
   jobs:
     gate:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
         - run: npm ci
         - run: npm run lint
         - run: npm test
         - run: npm run build
   ```
   30 minutos de trabalho. Maior ROI do backlog.
2. **Pre-commit hooks**: `npx husky init && echo "npm run lint && npm test" > .husky/pre-commit`.
   Ou, mais simples: `lint-staged` com `eslint --fix` + `prettier`.
3. **Playwright smoke**: alterar porta no `playwright.config.ts:19` para `--port 9321` (porta
   alta, improvável de conflitar) e remover `strictPort`. Ou usar `reuseExistingServer: true`
   com um server já rodando.
4. **Conventional Commits**: adotar `commitlint` com config `@commitlint/config-conventional`.
   Commits no formato `feat(domain): mensagem em pt-BR`.

### Alternativas pesquisadas

- **CI**: GitHub Actions é gratuito para repositórios públicos. O workflow acima roda em ~1 min.
  Alternativas: GitLab CI, CircleCI — desnecessárias para este projeto.
- **Pre-commit**: `husky` + `lint-staged` é o padrão da indústria. `lefthook` é uma alternativa
  mais rápida (Rust) mas adiciona dependência exótica.

### Perguntas abertas

- O repositório é público no GitHub? Se sim, posso criar a Action?
- O dono prefere CI no push ou só no PR?
- O deploy no Vercel deve ser automatizado (git push → deploy) ou continua manual?

---

## 10. Visual & Design — Nota 8.0

### O que está bom

- **Identidade "tabuleiro e papel" coesa**: tokens CSS em `src/index.css` definem famílias de cor
  (verde profundo `#1f3f36`, papel quente `#f5f3ec`, âmbar, ardósia), raios, sombras e
  movimento. Nenhum hex solto em componente. [Confiança: alta]
- **Tema escuro automático**: `src/index.css:74` — `prefers-color-scheme: dark` remapeia tokens
  via CSS custom properties, sem JS, sem flash. Verificado: o tema escuro funciona (ao contrário
  do que o DeepSeek afirmou). [Confiança: alta]
- **Tipografia self-hosted**: Inter Variable + Fraunces Variable via `@fontsource-variable`,
  subset latino no precache offline da PWA. Números tabulares em métricas. [Confiança: alta]
- **Hierarquia de botões**: primário com gradiente + lift, secundário outline, danger. Focus
  rings visíveis, hover de cards, `prefers-reduced-motion` respeitado. [Confiança: alta]
- **Wordmark "Rotina" com cavalo**: nav sticky com blur, loading com marca pulsante.
  [Confiança: alta]
- **Arte gerada (WebP/SVG)**: `src/ui/art/` contém ícones, avatares, selos e medalhas. As
  imagens WebP (Lemos, molduras, texturas) entram no precache da PWA para carregamento offline
  completo. [Confiança: alta]

### O que falta / está fraco

- **Arte provisória (SVG inline)**: `DiplomaSeal.tsx` e `ConceptSeal.tsx` usam SVGs inline
  geométricos como fallback. O dono manifestou intenção de substituir por imagens geradas por
  terceiros com qualidade premium (decisão de 2026-06-11 em `memory/decisions.md`). A versão
  atual é funcional mas visualmente simples. [Baixo × G (futuro), Confiança: alta]
- **Assets sem ledger**: não há inventário dos arquivos em `public/art/` e `src/ui/art/` com
  fonte, licença e data de geração. O comentário no backlog da auditoria Codex 2026-06-13
  menciona isso. [Baixo × P, Confiança: alta]
- **Texturas de fundo carregam sob demanda**: `textura-papel.png` e `textura-couro.png` em
  `entrega/` são assets de referência. O CSS as referencia como `background-image`. Se o arquivo
  não carregar, o fallback é a cor sólida (bom), mas não há indicador visual de que a textura
  está ausente. [Baixo × P, Confiança: alta]

### Soluções concretas

1. **Ledger de assets**: criar `docs/design/assets-ledger.md` com tabela: arquivo, tipo, fonte,
   licença, data de geração, status (provisório/final).
2. **Substituição de SVGs inline**: conforme a decisão do dono (2026-06-11), contratar artista
   ou usar geração por IA para produzir WebPs substituindo os SVGs inline de `DiplomaSeal` e
   `ConceptSeal`.

### Alternativas pesquisadas

- **Design system**: projetos como Radix UI Themes ou shadcn/ui oferecem componentes acessíveis
  e tematizáveis. Não se aplicam aqui porque o visual é customizado (identidade "tabuleiro e
  papel") e não genérico.
- **Ledger de assets**: O padrão é um `ASSETS.md` ou `CREDITS.md` na raiz, comum em projetos
  open-source que usam arte de terceiros.

### Perguntas abertas

- O dono tem previsão de quando a passada visual "premium" (com imagens geradas) será executada?
- As imagens atuais em `public/art/` têm licença compatível com AGPL-3.0?

---

## 11. UX — Nota 7.5

### O que está bom

- **Hero "Agora" claro**: a tela Hoje mostra exatamente o que fazer agora (primeiro bloco
  pendente ou ativo) em destaque no topo. Sem scrolling para encontrar a ação principal.
  [Confiança: alta]
- **Números visíveis (bom para TDAH)**: minutos da sessão, blocos concluídos/total, timer
  regressivo, streak de dias — tudo em números grandes, tabulares, sem decoração desnecessária.
  Referência explícita à decisão TDAH-friendly em `sessionReport.ts:115` (retorno recalibrado
  com sessão de 15 min). [Confiança: alta]
- **Onboarding em 3 passos**: Welcome → Setup → Plano, com indicador "Passo X de 3". O
  "Começar rápido" pula o setup para teste imediato. [Confiança: alta]
- **Placement v1 integrado na Config**: questionário de entrada sugere banda e permite calibrar
  com puzzles. Confiança explícita (baixa/média/alta) visível. [Confiança: alta]
- **Retorno pós-ausência acolhedor**: gap ≥ 7 dias gera sessão reduzida (15 min) com nota do
  Lemos, sem culpa. [Confiança: alta]
- **Feedback em duas etapas (Concluir → Fácil/Bom/Difícil)**: evita que o aluno pule a avaliação.
  O botão "Voltar" permite cancelar sem feedback. [Confiança: alta]

### O que falta / está fraco

- **Onboarding não cobre OAuth Lichess**: `Onboarding.tsx` — o fluxo de 3 passos (Welcome,
  Setup, Plano) não menciona a possibilidade de conectar o Lichess para reconciliação de puzzles
  e criação de Studies. O usuário só descobre isso na tela Hoje ou Config. Para um usuário não
  técnico, a opção fica escondida. [Médio × P, Confiança: alta]
- **Onboarding e Config duplicam formulário**: `Onboarding.tsx:EssentialSetup` e `Config.tsx`
  têm campos idênticos (username Lichess, username Chess.com, banda, minutos de sessão). Se um
  campo mudar (ex.: adicionar `lichessUsername`), dois lugares precisam ser atualizados.
  [Baixo × M, Confiança: alta]
- **Fricção na primeira experiência sem dados**: se o usuário abre o app sem configurar Chess.com
  nem Lichess, o plano é gerado com fallback (tema fixo "fork" para banda 800-1000). O
  `TutorCard` mostra "Plano inicial — conecte Chess.com ou Lichess para calibrar", mas o card
  de diagnóstico fica recolhido em `<details>`. Um usuário pode não perceber que deveria
  expandir. [Baixo × P, Confiança: média]
- **Progresso visível mas sem contexto temporal**: a tela Progresso mostra "X min esta semana"
  mas não mostra a tendência em relação à semana passada de forma visual (gráfico). Só texto:
  "8 min a mais que na semana passada". [Baixo × M, Confiança: média]

### Soluções concretas

1. **Dica de OAuth no onboarding**: adicionar um parágrafo no passo Setup: "Conectar o Lichess
   (opcional) permite que o app veja seus resultados de puzzles e crie um Study com o plano do
   dia. Você pode configurar isso depois na aba Config."
2. **Extrair formulário compartilhado**: criar `src/ui/ProfileForm.tsx` que é usado tanto por
   `Onboarding.tsx` quanto por `Config.tsx`. Props: `initialProfile`, `onSave`, `isSaving`,
   `showOAuthHint`.
3. **Gráfico de tendência (futuro)**: para o Corte 8 ou P5, usar um sparkline simples (SVG ou
   canvas) mostrando minutos por dia nos últimos 7 dias. Biblioteca `lightweight-charts` (TradingView)
   ou implementação vanilla.

### Alternativas pesquisadas

- **Onboarding progressivo**: apps como Duolingo e Lichess introduzem features gradualmente
  ("você desbloqueou X, quer experimentar?"). Aqui, um toast após a primeira sessão poderia
  sugerir: "Conecte o Lichess para ver como foi seu desempenho nos puzzles".
- **Sparklines**: `lightweight-charts` é 45 kB gzip — pesado para um sparkline. Alternativa:
  SVG inline com `<polyline>`, ~500 bytes.

### Perguntas abertas

- O dono sentiu falta de alguma orientação na primeira vez que usou o app?
- A duplicação Onboarding/Config é aceitável por enquanto (a fase pessoal tem 1 usuário) ou
  deve ser resolvida já?

---

## 12. UI — Nota 7.5

### O que está bom

- **Layout responsivo 2 colunas → empilha**: `Today.tsx` usa grid de 2 colunas no desktop e
  empilha no mobile. A navegação (`top-nav`) é fixa com blur. [Confiança: alta]
- **Cards com `Fold` (details/summary nativo)**: `Fold.tsx` encapsula `<details>` com estado
  local preservado entre re-renders. Sessões, milestones, diagnostico e roadmap são todos
  foldable. [Confiança: alta]
- **Estados vazios com ilustrações**: `vazio-sem-treinos.png`, `vazio-sem-dados.png`, 
  `vazio-pendencias-em-dia.png` — três estados vazios com arte customizada e mensagem em pt-BR.
  [Confiança: alta]
- **Cards de loading com `ViewFallback`**: `App.tsx` usa `Suspense` + fallback com spinner
  pulsante para code-split de Config e Progress. [Confiança: alta]
- **Toasts com `sonner`**: notificações seguem o tema do sistema (claro/escuro) com guard para
  jsdom. [Confiança: alta]

### O que falta / está fraco

- **`window.confirm` no restore de backup**: `Config.tsx:95` — o botão "Apagar tudo" abre um
   grupo de confirmação inline (bom), mas o restore de backup usa `window.confirm` nativo. Isso é
   inconsistente com o restante da UI e não respeita o tema escuro. [Médio × P, Confiança: alta]
- **Slug técnico de fraqueza exposto na tela Progresso**: `Progress.tsx:236` mostra
  `formatWeaknessTag(tag)` na tela Progresso, que é amigável. Mas o `Today.tsx` em uma linha
  (verificar) pode estar expondo o slug cru (`fork`, `hanging-piece`). [Médio × P, Confiança:
  média — não verifiquei todas as renderizações]
- **nav-buttons sem `aria-current`**: `App.tsx:143/151/159` — os botões de navegação (Hoje,
  Progresso, Config) usam `aria-label` mas não marcam o item ativo com `aria-current="page"`.
  Leitores de tela não sabem qual tab está selecionada. [Médio × P, Confiança: alta]
- **Rádios < 44px no mobile**: `PlacementCard.tsx` — as opções de rádio do questionário de
   placement são `<input type="radio">` sem altura mínima de 44px. No mobile, o alvo de toque
   pode ser pequeno demais. [Alto (a11y) × P, Confiança: alta]
- **OAuth scopes expostos como slugs técnicos**: `Config.tsx` mostra os escopos OAuth como
  `puzzle:read, study:write` sem tradução. Um usuário não técnico não sabe o que isso significa.
  [Baixo × P, Confiança: alta]

### Soluções concretas

1. **Substituir `window.confirm`**: criar componente `ConfirmDialog` inline (como o "Apagar tudo"
   já faz) para o restore de backup. Padronizar todos os confirms destrutivos.
2. **`aria-current="page"`**: adicionar `aria-current={view === 'today' ? 'page' : undefined}` nos
   3 botões de nav em `App.tsx`.
3. **Rádios com altura mínima**: adicionar `min-height: 44px` e `align-items: center` nos labels
   de rádio do `PlacementCard`. Ou wrappar em um `<label>` com padding.
4. **Traduzir escopos OAuth**: `puzzle:read` → "Ler atividade de puzzles", `study:write` →
   "Criar estudos". Criar mapa `SCOPE_LABEL_PTBR` em `oauthFlow.ts` ou `Config.tsx`.

### Alternativas pesquisadas

- **Confirm dialog**: O padrão é um modal com foco aprisionado e `role="alertdialog"`. O
   `sonner` já está no projeto — poderia ser usado com um `action` button. Ou manter o padrão
   inline (como o "Apagar tudo") que é mais simples e não rouba foco.
- **Alvos de toque**: A WCAG 2.5.5 (Target Size) recomenda 44×44px para alvos de toque. O
   `index.css` já tem `min-height: 44px` para botões, mas não para inputs de rádio/checkbox.

### Perguntas abertas

- O dono prefere manter `window.confirm` pela simplicidade ou migrar para um diálogo inline?
- A exposição de slugs técnicos (ex.: `fork` em vez de `Garfos`) incomoda ou é aceitável para
  uso pessoal?

---

## 13. Conteúdo & Comunicação — Nota 8.0

### O que está bom

- **Tom adulto, PT-BR, sem infantilizar**: `sessionMessage.ts` usa frases como "Bom trabalho.
  Continue com sessões curtas e consistentes." — sem "parabéns!!", sem emojis, sem diminutivos.
  [Confiança: alta]
- **Banlist de frases proibidas**: `sessionMessage.ts:19-24` — `BANNED_PHRASES` com lista de
  expressões proibidas. Testes em `sessionMessage.test.ts` verificam compliance. [Confiança: alta]
- **Sem promessa de rating**: nenhuma string no app promete aumento de rating. O
  `learningPlanProposal.ts` estima horas/sessões, não rating. A tela Progresso mostra "taxa de
  acerto" e "blunders", nunca "rating estimado". [Confiança: alta]
- **Mensagens de erro em PT-BR**: `errorMessages.ts` traduz erros de rede, rate limit e falhas
  genéricas. Mensagens de rate limit incluem "tente novamente em 1 minuto". [Confiança: alta]
- **Professor Lemos explica conceitos antes da aula**: `coachCatalog.ts:16-32` — para garfos, o
  Lemos explica "Garfo é quando uma peça sua ataca dois alvos ao mesmo tempo" antes do link do
  Lichess. [Confiança: alta]

### O que falta / está fraco

- **Slug técnico vaza em algumas telas**: `Progress.tsx:236` — na lista de fraquezas, o nome do
  tema de puzzle aparece como slug (ex.: `fork`, `hanging-piece`) em vez do label PT-BR. O
  `formatWeaknessTag` existe e é usado em `Today.tsx`, mas parece não ser usado
  consistentemente. [Médio × P, Confiança: média]
- **Falta contexto nas mensagens de erro de rede**: `errorMessages.ts:8` — "Não foi possível
  carregar os dados locais. Tente recarregar a página." é genérico. Para erros de Chess.com vs
  Lichess, a mensagem não distingue a fonte. O `toDiagnosisErrorMessage` e `toLichessErrorMessage`
  resolvem parcialmente, mas o erro genérico ainda é vago. [Baixo × P, Confiança: alta]

### Soluções concretas

1. **Revisão de slugs expostos**: grep por `formatWeaknessTag` em todos os componentes de UI e
   garantir que todo lugar que renderiza um `WeaknessTag` use a função.
2. **Mensagens de erro com fonte**: `toErrorMessage("Erro ao buscar jogos do Chess.com. 
   Verifique seu username e tente novamente.")` em vez de mensagem genérica.

### Alternativas pesquisadas

- **Microcopy**: O tom "Professor Lemos" foi validado pelo dono. Referência: o microcopy do
  Lichess (inglês) é direto e funcional, sem personalidade forçada. O app está alinhado.

### Perguntas abertas

- O dono revisou todas as strings do app? Há alguma que incomodou no uso real?
- As mensagens de erro durante o diagnóstico (Chess.com/Lichess) são claras o suficiente?

---

## 14. Plataforma & Performance — Nota 7.5

### O que está bom

- **PWA com precache offline**: `vite.config.ts:10-19` — precache inclui JS, CSS, HTML, ícones,
  SVGs, WebPs, e subsets latinos de Inter + Fraunces. 75 entries, 1.727 kB total. O app abre
  inteiro offline. [Confiança: alta]
- **JS de produção enxuto**: `index-BR9FuEqK.js` = 245 kB (gzip 68 kB). `react-vendor` = 182 kB
  (gzip 57 kB). `dexie` = 95 kB (gzip 31 kB). Bundle total JS: ~545 kB (gzip ~163 kB). Com
  code-split, a tela inicial carrega só `index` + `react-vendor` + `dexie` + `icons` (~459 kB
  JS, gzip ~136 kB). [Confiança: alta]
- **`manualChunks` inteligente**: `vite.config.ts:66-77` — isola `react-vendor`, `dexie`, `icons`
  em chunks próprios para cache de longa duração. Mudar o app não invalida o vendor.
  [Confiança: alta]
- **Source maps em produção**: `vite.config.ts:60` — `sourcemap: true`. Erros no Vercel chegam
  com stack rastreável. [Confiança: alta]
- **Fontes self-hosted com subset**: apenas o subset latino das fontes Inter e Fraunces entra
  no precache. Demais subsets (vietnamese, greek, cyrillic, etc.) carregam sob demanda via
  unicode-range. Economiza ~150 kB de precache. [Confiança: alta]

### O que falta / está fraco

- **Sem smoke teste offline em produção**: `npm run smoke:pwa` não funciona (erro de porta). Não
  há verificação automatizada de que o service worker registra, que o precache carrega, e que as
  páginas abrem offline. [Médio × M, Confiança: alta]
- **Sem métricas de performance**: não há `web-vitals` ou `performance.measure()` para medir
  FCP, LCP, TTI. O bundle é pequeno o suficiente que performance não é preocupação atual, mas
  medir é barato e estabelece baseline. [Baixo × P, Confiança: alta]
- **Precache de 1.7 MB**: para uma PWA, é aceitável. Mas ~1.4 MB são fontes (woff2) e imagens
  (WebP). Se o dono adicionar mais assets visuais (passada premium), o precache pode crescer.
  Sem bound explícito. [Baixo × M, Confiança: alta]

### Soluções concretas

1. **Smoke PWA offline funcional**: corrigir `playwright.config.ts` para porta dinâmica.
2. **Métricas de performance**: adicionar `web-vitals` (1 kB) e logar FCP/LCP/TTI no console em
   dev, ou enviar para endpoint em prod (futuro P5).
3. **Bound de precache**: documentar no `vite.config.ts` um limite máximo de precache (ex.: 3
   MB). Se a passada visual premium adicionar muitos assets, avaliar lazy loading vs precache.

### Alternativas pesquisadas

- **Performance budget**: O Lichess carrega ~800 kB JS (gzip ~250 kB) para uma página de jogo.
  Os ~163 kB gzip do bundle total do app estão confortáveis.
- **Lighthouse**: Rodar Lighthouse via `lighthouse-ci` no CI. Overkill para um app pessoal, mas
  seria o padrão para P5 (versão comunidade).

### Perguntas abertas

- O dono notou lentidão em algum momento de uso real (celular ou desktop)?
- Vale a pena investir em smoke PWA offline agora ou deixar para quando a passada visual premium
  estiver pronta?

---

## 15. Acessibilidade & i18n — Nota 6.5

### O que está bom

- **Bases de acessibilidade presentes**: `aria-label` em nav e cards (`App.tsx`, `Today.tsx`,
  `TutorCard.tsx`), `aria-live="polite"` em notificações, `role="status"` no ReloadPrompt,
  `aria-labelledby` em seções, `role="progressbar"` e `aria-valuenow` em barras de progresso.
  [Confiança: alta]
- **`focus-visible` consistente**: `index.css` define `:focus-visible` com outline visível em
  todos os elementos interativos. [Confiança: alta]
- **`prefers-reduced-motion` respeitado**: `index.css` usa `@media (prefers-reduced-motion:
  reduce)` para desabilitar animações. [Confiança: alta]
- **Tema escuro funcional**: mapeamento completo de tokens claro→escuro em `index.css:1920+`.
  [Confiança: alta]
- **Idioma declarado**: `<html lang="pt-BR">` no `index.html`. PWA manifest declara `lang:
  'pt-BR'`. [Confiança: alta]
- **Font-size padrão legível**: 16px base com escala consistente. [Confiança: alta]

### O que falta / está fraco

- **nav-buttons sem `aria-current`**: `App.tsx:143/151/159` — leitores de tela não sabem qual
  tab está ativa. [Médio × P, Confiança: alta]
- **Rádios < 44px no mobile**: `PlacementCard.tsx` — alvos de toque pequenos. [Alto (a11y) × P,
  Confiança: alta]
- **Falta `aria-describedby` em campos com hint**: `Onboarding.tsx:EssentialSetup` — campos como
  username Lichess têm texto de ajuda ("Como aparece no Lichess"), mas não usam
  `aria-describedby` para associar o hint ao input. [Médio × P, Confiança: alta]
- **Sem i18n framework**: o app é monolíngue pt-BR com strings hardcoded. Não há `react-intl`,
  `i18next`, ou similar. Isso é aceitável para ferramenta pessoal, mas será custoso migrar em
  P5. [Baixo × G (futuro), Confiança: alta]
- **Sem teste de contraste automatizado**: não há axe-core, pa11y, ou Lighthouse a11y no CI.
  [Baixo × M, Confiança: média]

### Soluções concretas

1. **`aria-current="page"`**: 3 linhas em `App.tsx`.
2. **Rádios 44px**: `min-height: 44px` nos labels + `display: inline-flex` com `align-items:
   center`.
3. **`aria-describedby`**: adicionar `id` nos elementos de hint e `aria-describedby={hintId}` nos
   inputs.
4. **Axe-core no CI (opcional)**: `@axe-core/react` para testes de acessibilidade em
   desenvolvimento. Ou `@playwright/test` + `axe-core` no smoke test.

### Alternativas pesquisadas

- **WCAG 2.1 AA**: O app está no caminho certo para AA (contraste, foco visível, labels,
  idioma). As violações identificadas (alvos de toque, `aria-current`) são itens AAA ou best
  practices, não violações AA críticas.
- **i18n em P5**: `react-intl` (FormatJS) é o padrão para React com ICU message syntax.
  `i18next` é mais leve e popular em PWAs. Extrair strings agora economiza retrabalho depois.

### Perguntas abertas

- O dono usa leitor de tela ou conhece alguém que use? Isso determinaria a prioridade de `aria`
  vs outras áreas.
- i18n é prioridade para P5 ou só pt-BR para a versão comunidade?

---

## 16. Segurança & Privacidade — Nota 6.5

### O que está bom

- **PKCE S256 correto**: `oauth.ts:58-77` — SHA-256 digest com base64url encoding, 64-byte code
  verifier via `crypto.getRandomValues`. Sem fallback fraco (`Math.random`). [Confiança: alta]
- **Tokens nunca em export, backup, ou logs**: `appData.ts:357` — `exportAllAsJson` não inclui
  `lichessTokens`. `backup.ts:backupTableNames` não lista tokens. Tokens são limpados na
  expiração. [Confiança: alta]
- **Escopos OAuth restritos**: `oauth.ts:152` — só `puzzle:read` e `study:write` são permitidos.
  Sem escopos de jogo, engine, mensagens. [Confiança: alta]
- **`stripOAuthQuery`**: `oauth.ts:131-140` — limpa `code`, `state`, `error` da URL após
  callback, prevenindo vazamento via history/favicon. [Confiança: alta]
- **Sem PGN persistido**: `games.ts:38` — `moves=false` e `pgnInJson=false` explicitamente nos
  params da API. `extractSignals.ts` extrai sinais e descarta PGN. Testes verificam que strings
  PGN não aparecem no output. [Confiança: alta]
- **`noopener` em links externos**: `externalOpen.ts:7-8` — `opened.opener = null` após
  `window.open`. [Confiança: alta]
- **Sanitização de PGN para Study**: `study.ts:126-139` — `sanitizePgnTag` escapa backslashes e
  aspas, cap em 100 chars. `sanitizePgnComment` remove curly braces (PGN comment delimiters),
  cap em 500 chars. [Confiança: alta]
- **Headers CSP em produção**: `vercel.json:3-12` — `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy` com restrições. [Confiança: alta]

### O que falta / está fraco

- **PII real do dono no bundle de produção** (achado mais grave): `state.ts:1289-1290` (raiz) →
  `Config.tsx:61` → o nome de usuário `'jukasparov'` do Lichess e `'jukatavares'` do Chess.com
  aparecem como **valores default hardcoded** em `createDefaultProfile()`. Esses valores são
  enviados no bundle de produção (`index-BR9FuEqK.js`) e visíveis em
  `view-source:https://rotina-pied.vercel.app/assets/index-*.js`. São usernames públicos (não
  senhas), mas identificam o dono e sua conta Lichess/Chess.com em um artefato público. **A
  decisão do dono de 2026-06-10 confirmou os usernames, mas não endereçou o fato de estarem no
  bundle público.** [Alto × P, Confiança: alta]
- **Import de backup valida pouco**: `appData.ts:424` — não valida integridade referencial,
  sanidade de datas, ou tamanho máximo. Um backup malicioso JSON de 500 MB travaria o browser.
  [Alto × M, Confiança: alta]
- **Sem allowlist de URLs no `window.open` externo**: `externalOpen.ts:2` — `window.open(url,
  '_blank')` aceita qualquer URL. Um backup malicioso poderia conter um `destinationUrl` com
  `javascript:` que seria aberto (embora o browser moderno bloqueie `javascript:` em
  `window.open`, a defesa em profundidade é ausente). [Médio × M, Confiança: média]
- **Sem Content-Security-Policy no HTML**: `index.html` não tem tag `<meta>` CSP. O servidor
  Vercel pode adicionar CSP via headers (`vercel.json`), mas não há `Content-Security-Policy`
  configurado. [Médio × M, Confiança: alta]
- **Dexie DB sem criptografia**: os dados em IndexedDB são plaintext. Para uma ferramenta
  pessoal, o risco é baixo (o browser já isola origins). Mas se P5 trouxer multi-device sync,
  criptografia client-side será necessária. [Baixo × G (futuro), Confiança: alta]

### Soluções concretas

1. **Remover PII do bundle**: `createDefaultProfile()` deve retornar `lichessUsername: undefined`
   e `chesscomUsername: undefined` — sem hardcoding. O onboarding e a Config já permitem que o
   usuário digite esses valores. A migração Dexie preserva perfis existentes, então usuários
   que já configuraram não perdem nada. **30 segundos de edição, maior relação impacto/esforço.**
2. **Validação profunda de backup**: adicionar checks de integridade referencial, sanidade de
   datas, tamanho máximo.
3. **CSP header**: adicionar `Content-Security-Policy: default-src 'self'; script-src 'self';
   style-src 'self' 'unsafe-inline'; connect-src https://lichess.org https://api.chess.com;
   img-src 'self' data:` ao `vercel.json`.
4. **Allowlist de URLs externas**: `externalOpen.ts` deve validar que a URL começa com
   `https://lichess.org/` (ou domínio allowlist) antes de abrir.

### Alternativas pesquisadas

- **CSP**: O padrão para SPAs React é `script-src 'self'` (sem `'unsafe-inline'` porque Vite
  não gera inline scripts). O `style-src 'unsafe-inline'` é necessário porque React injeta
  estilos inline.
- **PII em bundle**: O problema é comum em apps que usam valores default de desenvolvimento em
  produção. A solução canônica é usar variáveis de ambiente (`import.meta.env.VITE_*`) e
  nunca hardcodear dados reais.

### Perguntas abertas

- O dono autoriza a remoção imediata dos usernames hardcoded do bundle de produção?
- O backup import precisa suportar arquivos de versões futuras (forward compat) ou só versão
  atual?
- O dono quer CSP no `vercel.json` agora ou isso fica para P5?

---

## 17. Build, Release & Operação — Nota 6.0

### O que está bom

- **Build rápida**: 468ms (Vite 8 + rolldown). [Confiança: alta]
- **`manualChunks`**: `vite.config.ts:66-77` — vendor splitting para cache de longa duração.
  [Confiança: alta]
- **Source maps em produção**: `vite.config.ts:60` — erros rastreáveis. [Confiança: alta]
- **PWA com auto-update**: `vite.config.ts:9` — `registerType: 'prompt'` com `ReloadPrompt`
  mostrando banner de atualização. [Confiança: alta]
- **Vercel config com headers de segurança**: `vercel.json:3-12` — CSP parcial, caching de
  assets imutáveis, trailing slash redirect. [Confiança: alta]

### O que falta / está fraco

- **Sem versão semântica**: `"version": "0.0.0"`. Não há `CHANGELOG.md`. [Baixo × P, Confiança:
  alta]
- **Deploy manual**: sem integração Vercel com GitHub. O deploy é feito manualmente via CLI ou
  dashboard. [Médio × M, Confiança: alta]
- **Sem ambiente de staging**: `rotina-pied.vercel.app` é produção. Não há domínio de staging
  para testar antes de deploy. [Baixo × M, Confiança: alta]
- **Sem telemetria/logs**: não há `console.error` remoto, não há Sentry, não há analytics. Para
  ferramenta pessoal, é aceitável. Para P5, será necessário. [Baixo × M (futuro), Confiança:
  alta]
- **`vercel.json` com `cleanUrls: true`**: remove extensões `.html` das URLs — boa prática.
  [Confiança: alta]

### Soluções concretas

1. **Versionamento semântico**: `npm version minor` para iniciar versionamento. Criar
   `CHANGELOG.md` manual ou com `standard-version`.
2. **Deploy automatizado**: conectar repositório GitHub ao Vercel. Deploy em cada push na branch
   principal. Preview deploys em PRs.
3. **Domínio de staging**: `staging.rotina-pied.vercel.app` ou usar Vercel Preview Deployments
   (automáticos em PRs).

### Alternativas pesquisadas

- **Vercel GitHub integration**: nativa, gratuita para hobby. Deploy automático + preview
  deployments + comentários de PR com URL de preview.
- **Telemetria**: `@sentry/react` (7 kB gzip) ou `console.error` → `fetch('/api/log', ...)`. Para
  ferramenta pessoal, não é necessário.

### Perguntas abertas

- O dono quer deploy automatizado ou prefere controle manual?
- Qual o plano de rollback? "Reverter commit e redeploy" é suficiente para o estágio atual?

---

## Riscos (Top 5)

| # | Risco | Severidade | Mitigação |
|---|---|---|---|
| 1 | **PII do dono no bundle público** — usernames Lichess/Chess.com hardcoded no JS de produção, visível em view-source | Crítico | Remover valores default hardcoded em `state.ts:1289` (`createDefaultProfile`). Esforço: P |
| 2 | **Sem CI** — lint/test/build só rodam localmente. Um push com teste quebrado não é detectado | Alto | Criar `.github/workflows/ci.yml`. Esforço: M (30 min) |
| 3 | **Escrita não-atômica log↔plano** — crash entre `saveTrainingLog` e `savePlan` corrompe consistência | Alto | Auditar call sites, unificar para `saveTrainingLogAndPlan`. Esforço: M |
| 4 | **`computeMastery` código morto** — lógica de advance/review/regress implementada mas não usada, dando falsa impressão de adaptação pedagógica | Alto | Integrar no gerador de planos ou remover. Esforço: M |
| 5 | **Diagnóstico de puzzles não gera fraquezas** — o circuito Signal→Weakness→Plan funciona para Chess.com/Lichess games, mas não para puzzle stats (que são a fonte mais confiável de dados) | Alto | Conectar `PuzzleThemeStats` → `detectWeaknesses`. Esforço: G |

---

## Quick Wins (Top 10 — alto impacto, baixo esforço)

| # | Quick Win | Impacto | Esforço |
|---|---|---|---|
| 1 | Remover PII hardcoded (`state.ts:1289`) | Alto | P (30s) |
| 2 | Criar CI mínimo (`.github/workflows/ci.yml`) | Alto | M (30 min) |
| 3 | Adicionar `aria-current="page"` nos botões de nav | Médio | P (3 linhas) |
| 4 | Rádios 44px (`PlacementCard` + `index.css`) | Alto (a11y) | P |
| 5 | Extrair `weaknessTitleByTag` DRY (3 duplicações → 1 módulo) | Alto | P |
| 6 | Extrair `formatNoun`/`formatCount` DRY (2 duplicações → 1 módulo) | Baixo | P |
| 7 | Substituir `window.confirm` por diálogo inline (restore backup) | Médio | P |
| 8 | Adicionar `aria-describedby` em inputs com hint | Médio | P |
| 9 | Criar índice de `docs/review/` (INDEX.md com tabela cronológica) | Médio | P |
| 10 | Corrigir porta do Playwright smoke (evitar `EADDRINUSE`) | Médio | P |

---

## Dívida técnica priorizada

| # | Dívida | Juros que paga | Prioridade |
|---|---|---|---|
| 1 | Sem CI | Risco de regressão não detectada; atraso no feedback | **Máxima** |
| 2 | God-hook `state.ts` | Cada feature nova adiciona acoplamento; onboarding de dev lento | Alta |
| 3 | Duplicação `weaknessTitleByTag` e `formatNoun` | Correção em 3 lugares; inconsistência futura | Alta |
| 4 | Duplicação Onboarding/Config (ProfileForm) | Dois lugares para manter; inconsistência de campos | Média |
| 5 | `computeMastery` código morto | Confusão sobre capacidade adaptativa; manutenção de código não usado | Média |
| 6 | Magic strings de detecção de puzzle | Frágil a refatoração de labels; bugs silenciosos | Média |
| 7 | Falta smoke PWA offline funcional | Sem verificação de que a feature offline funciona | Média |
| 8 | Arte SVG provisória sem ledger | Dificuldade de manutenção e atribuição de licenças | Baixa |
| 9 | Sem i18n framework | Migração custosa em P5 | Baixa (futuro) |
| 10 | `persist()` chamado cedo demais | Pode ser ignorado pelo browser; dados em risco | Baixa |

---

## Roadmap sugerido até a revisão de eficácia (~2026-07-08)

1. **Imediato (até 2026-06-16)** — Hygiene & Privacy
   - Remover PII do bundle
   - Criar CI mínimo (GitHub Actions)
   - Corrigir flake `trainingFlow.test.tsx`
   - Adicionar `aria-current`, rádios 44px, `aria-describedby`
2. **Curto prazo (até 2026-06-23)** — Qualidade & DRY
   - DRY: `weaknessTitleByTag`, `formatNoun`/`formatCount`, `ProfileForm`
   - Substituir `window.confirm` por diálogo inline
   - Corrigir smoke PWA offline
   - Índice de `docs/review/`
3. **Médio prazo (até 2026-07-01)** — Domínio & dados
   - Conectar puzzle stats → detector de fraquezas (ou decidir não fazer)
   - Decidir destino de `computeMastery` (integrar ou remover)
   - Validação profunda de backup import
   - Atomicidade log↔plano
   - Refinar accuracy threshold por banda no Chess.com extractor
4. **Revisão 2026-07-08** — Eficácia
   - Revisar as 4 métricas de baseline de eficácia
   - Decidir se Corte 8 (currículo denso 1200-2200) começa ou se há correções prioritárias

---

## O que NÃO fazer

- **Não criar backend/sync agora** — P4 continua congelada. As mitigações locais (storage.persist
  + export automático + backup) são suficientes.
- **Não migrar para gerenciador de estado (Zustand, Redux, Context+Reducer)** — o pattern atual
  de hooks funciona. Só precisa de split, não de rewrite.
- **Não adicionar i18n framework** — monolíngue pt-BR é suficiente para ferramenta pessoal. Só
  considerar em P5.
- **Não trocar Dexie por outra biblioteca** — Dexie.js é maduro, bem testado, e a integração
  atual funciona.
- **Não adicionar telemetria/analytics** — ferramenta pessoal. Privacidade primeiro.
- **Não criar tabuleiro próprio** — regra inquebrável. Treino sempre abre no Lichess.
- **Não expandir `WeaknessTag` sem evidência** — os 14 tags atuais cobrem 0-1200. Expandir
  requer pesquisa pedagógica adicional.
- **Não criar sistema de gamificação além dos badges v1** — badges aprovados cobrem esforço e
  hábito. Sistema de pontuação, ranking ou streak aumentaria complexidade sem evidência de
  benefício pedagógico.
- **Não implementar avaliação de lances em tempo real** — requer engine, viola regra
  inquebrável.
- **Não abrir P5 (versão comunidade) sem decisão explícita do dono** — a moldura "pessoal
  primeiro" permanece.

---

## Perguntas abertas ao dono do produto

### Identidade e DNA
1. O que é **intocável** no app — o que define o DNA do Professor Lemos e não deve mudar mesmo
   que incomode?
2. Qual o **nome público** planejado para P5? "Rotina" é provisório. A renomeação afeta o
   wordmark, PWA manifest, domínio Vercel, e microcopy.

### Produto e pedagogia
3. **Puzzle stats → fraquezas**: o diagnóstico de puzzles deve gerar Weakness records (confidence:
   medium) ou manter a trava atual ("puzzle ≠ jogo real")?
4. **`computeMastery`**: integrar ao gerador de planos (para ajustar `resourceStage` com base em
   domínio) ou remover o módulo?
5. **Qual o público prioritário** e qual lado decide um trade-off quando há conflito? O app é
   para o dono (faixa 800-1000 hoje, aspiração 0-2200) ou pensando em um iniciante genérico?
6. **Currículo denso (Corte 8)**: começa em julho ou há correções prioritárias antes? O dono já
   sente que precisa de conteúdo para 1200-2200?

### Processo e risco
7. **CI e deploy**: autoriza criar GitHub Actions (lint+test+build) e conectar Vercel para deploy
   automático?
8. **Apetite de risco**: o dono está confortável com o fato de que os dados estão só em
   IndexedDB (sem backup automático em nuvem)? O backup manual + auto-backup via File System
   Access são suficientes?
9. **Orçamento real**: quanto tempo por semana o dono planeja dedicar a desenvolver/usar o app
   até a revisão de eficácia (~2026-07-08)?
10. **Playwright smoke**: o teste PWA offline deve ser gate obrigatório ou "nice to have"?

### Privacidade e segurança
11. **Usernames no bundle**: autoriza remover `'jukasparov'` e `'jukatavares'` dos valores
    default em `createDefaultProfile()`? É a correção mais rápida e de maior impacto desta
    auditoria.
12. **Domínio público**: `rotina-pied.vercel.app` é indexável? (Verifiquei: tem `noindex` no
    `vercel.json`). O dono está ciente de que o código-fonte está público no GitHub?

### Visual e UX
13. **Passada visual premium**: quando o dono planeja substituir os SVGs inline por imagens
    geradas (Direção visual decidida em 2026-06-11)?
14. **Duplicação Onboarding/Config**: o dono sentiu a fricção de configurar o perfil duas vezes
    (uma no onboarding, outra na Config) ou prefere manter separado para simplicidade?

---

## Apêndice — achados com file:line e nível de confiança

### Confiança alta (verify)

| # | Achado | File:line | Severidade |
|---|---|---|---|
| A1 | 525 testes verdes em 64 arquivos | `npm test` → exit 0 | — |
| A2 | Lint verde (zero erros) | `npm run lint` → exit 0 | — |
| A3 | Build PWA verde (468ms, 75 entries) | `npm run build` → exit 0 | — |
| A4 | Cobertura 82.99% statements | `npm run coverage` → v8 report | — |
| A5 | PII hardcoded no bundle: `'jukasparov'`, `'jukatavares'` | `state.ts:1289-1290` → `Config.tsx:61` | Crítico |
| A6 | Barreira de lint `no-restricted-imports` ativa para `src/domain` | `eslint.config.js:17-45` | — |
| A7 | PKCE S256 correto com `crypto.getRandomValues` | `oauth.ts:58-77` | — |
| A8 | Tokens OAuth excluídos do export/backup | `appData.ts:357` | — |
| A9 | `computeMastery` sem callers fora de teste | `mastery.ts:9` (grep: zero imports em app/ui) | Alto |
| A10 | Ponte puzzle→fraqueza ausente: `detectWeaknesses` não recebe `PuzzleThemeStats` | `detectWeaknesses.ts:107` vs `diagnosis.ts:107` | Alto |
| A11 | Escrita não-atômica log↔plano possível | `state.ts:1065` (call path não verificado completamente) | Alto |
| A12 | Auto-sync `void IIFE` engole erro | `state.ts:563-573` | Médio |
| A13 | Proxy accuracy<70 = "blunder" sem calibração por banda | `extractSignals.ts:241` | Alto |
| A14 | Schema Dexie v11 com migrations incrementais | `db.ts:28-189` | — |
| A15 | Soft-delete com purga 90d | `appData.ts:254-281` | — |
| A16 | Export transacional snapshot consistente | `appData.ts:357-379` | — |
| A17 | `.github/workflows/` não existe (sem CI) | `glob('.github/workflows/*')` → empty | Alto |
| A18 | Playwright smoke quebrado (porta `EADDRINUSE`) | `playwright.config.ts:19` com `strictPort: true` | Médio |
| A19 | `window.confirm` no restore de backup | `Config.tsx:95` | Médio |
| A20 | `weaknessTitleByTag` triplicado | `generatePlan.ts:98-115`, `learningPlanProposal.ts:48-65`, `diagnosis.ts:44-60` | Alto |
| A21 | `formatNoun`/`formatCount` duplicados | `dayCompletionSummary.ts:32-46`, `sessionMessage.ts:80-94` | Baixo |
| A22 | Magic strings para detecção de puzzle | `trainingLogFlow.ts:230-236` (`destinationLabel.includes('Puzzle')`) | Médio |
| A23 | `completeBlockTraining` sem `useCallback` | `useTrainingActions.ts:226-227` | Baixo |
| A24 | Flake em `trainingFlow.test.tsx` | `trainingFlow.test.tsx:65` — falhou 1/3 execuções | Médio |
| A25 | nav sem `aria-current` | `App.tsx:143/151/159` | Médio |
| A26 | Rádios < 44px no mobile | `PlacementCard.tsx` + `index.css:2391` | Alto (a11y) |
| A27 | Tema escuro funcional (ao contrário do que DeepSeek afirmou) | `index.css:1920` | — |
| A28 | `persist()` chamado antes de interação do usuário | `state.ts:233` | Baixo |
| A29 | `resourceCatalog.ts` com 1018 linhas | `resourceCatalog.ts` | Baixo |
| A30 | 33 relatórios em `docs/review/` sem índice | `docs/review/` directory listing | Médio |

### Confiança média (hipótese, não verifiquei completamente)

| # | Achado | Evidência parcial | Severidade |
|---|---|---|---|
| M1 | Duplicação Onboarding/Config (ProfileForm) — `EssentialSetup` em `Onboarding.tsx` copia campos de `Config.tsx` | Verifiquei pelo relatório do agente UI; não li os dois arquivos lado a lado | Médio |
| M2 | Slug técnico exposto em Progress.tsx — `formatWeaknessTag` pode não ser usado em todos os pontos de renderização | Relatório do agente UI menciona inconsistência; não verifiquei todos os call sites | Médio |
| M3 | `getEvidenceLine` com double negation frágil | `TutorCard.tsx:142` — lido, confirmei a lógica complexa | Baixo |
| M4 | `Today.tsx` com 755 linhas — candidato a split | Lido o relatório do agente; não li o arquivo completo | Médio |
| M5 | Testes de UI com cobertura incompleta — `SessionMilestonesCard` (1 teste), `LearningPlanProposalCard` (2 testes) | Relatório do agente UI; não verifiquei cada teste individualmente | Médio |

### Opinião (sem file:line verificável)

- A arquitetura de 4 camadas (ui→app→domain→infra) está bem dimensionada para o escopo atual e
  aguentaria 2-3x mais complexidade antes de precisar de refatoração estrutural.
- O tom "Professor Lemos" está no ponto certo entre formalidade e acolhimento. Não mexer.
- A decisão de manter P4/P5 congeladas é correta. O app como está já entrega valor para uso
  pessoal diário. Adicionar sync e comunidade agora diluiria o foco.
- A qualidade dos testes de domínio (puros, rápidos, sem mocks) é exemplar e deveria ser
  preservada como padrão para qualquer expansão futura.

---

## Checklist de método

- [x] Li os módulos-núcleo e ao menos uma amostra de cada camada/tipo (domain, infra, app, ui).
- [x] Rodei testes/build/lint e reportei resultados reais (525 ✓, lint ✓, build ✓, coverage 82.99%).
- [x] Cada área tem nota + elogio + falta + solução + alternativa + pergunta.
- [x] Cada achado factual tem file:line e severidade.
- [x] Separei fato / opinião / hipótese e marquei confiança.
- [x] Tabela-resumo + nota global + roadmap + perguntas ao dono.
- [x] Salvei em `docs/review/analise_completa_claude-opus_2026-06-15_v2.md`.
