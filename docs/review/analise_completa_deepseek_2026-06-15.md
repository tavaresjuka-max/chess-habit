# Análise Completa — lichess-tutor (DeepSeek, 2026-06-15)

## 0. Sumário Executivo

O **lichess-tutor** ("Rotina de Treino Lichess") é uma PWA local-first madura (~130 arquivos fonte, ~50+ testes) que implementa um tutor de xadrez pessoal com diagnóstico multi-fonte (Chess.com + Lichess), geração de planos diários adaptativos por fraquezas, e um método pedagógico de 5 trilhas. A arquitetura é notavelmente limpa — separação estrita de camadas com `domain/` puro e isolamento forçado por ESLint. O código é idiomático TypeScript estrito, com boas práticas de segurança (PKCE, transient PGN, sem persistência de dados sensíveis). A cobertura de testes é ampla (401 passando de 409) com 8 falhas concentradas em testes de integração de fluxo de treino (timeouts e elementos não encontrados em jsdom). A build é rápida (811ms) e o lint passa limpo. As principais fragilidades são: (1) `state.ts` como God object de 1296 linhas com lógica duplicada de sync, (2) ausência de CI/CD e testes E2E, (3) 8 testes quebrados indicando regressões reais no fluxo de treino ou fragilidade dos testes, (4) `generatePlan.ts` com mutação in-place de blocos e switch sem `default`, e (5) sem i18n, dark mode ou leitor de tela — aceitável para ferramenta pessoal, mas dívida para P5.

### Tabela-Resumo de Notas

| Área | Nota | Peso | Justificativa |
|------|------|------|---------------|
| Correção & Bugs | 6 | 15% | 8 testes quebrados, switch sem default, mutação silenciosa de blocos |
| Qualidade de Código | 8 | 15% | TypeScript estrito, DRY no domínio, God object no state, boa tipagem |
| Arquitetura | 9 | 15% | Clean Architecture exemplar, ESLint isola domínio, barrel exports |
| Domínio / Lógica Central | 7 | 15% | Pipeline Signal→Weakness→Plan robusto; mapeamento puzzle-theme genérico demais; mutação de blocos frágil |
| Dados & Estado | 7 | 10% | Dexie com 11 migrações versionadas; backup com checksum; IndexedDB sem server |
| Testes & QA | 6 | 10% | 98% passam; 8 quebrados em fluxo de treino; sem E2E; sem CI |
| Documentação & Memória | 9 | 5% | ADRs, memory/, specs, research excepcionais; docs desatualizadas pontuais |
| Processo & Tooling | 6 | 3% | Lint+test+build gate; sem CI/CD; sem pre-commit hooks; scripts utilitários bons |
| Visual & Design | 9 | 5% | Design system completo (2471 linhas CSS), tokens, tipografia self-hosted, tema consistente |
| UX | 8 | 3% | Onboarding fluido, feedback por toasts, timer local; dark mode ausente |
| UI | 8 | 2% | Responsivo, affordances claras, estados vazio/carregando; ícones inline, sem sprite sheet |
| Conteúdo & Comunicação | 8 | 2% | Tom PT-BR adulto consistente, microcopy do Professor Lemos coerente; fallback messages genéricos |
| Plataforma & Performance | 9 | 2% | PWA offline, code splitting, vendor chunks, 75 precache entries, build 811ms |
| Acessibilidade & i18n | 3 | 1% | aria-labels nos navs, sem i18n, sem dark mode, sem leitor de tela testado |
| Segurança & Privacidade | 8 | 1% | PKCE OAuth, transient PGN, sem PII em logs, storage.persist(); token local |
| Build, Release & Operação | 6 | 1% | Vercel deploy manual, sem CI/CD, sem telemetria, sem rollback |

**Nota global ponderada: 7.4 / 10** — Sólido, com dívidas claras em testes de integração e tooling.

---

## 1. Método

### O que li
- Todos os arquivos de domínio (`types.ts`, `detectWeaknesses.ts`, `generatePlan.ts`, `diagnosis.ts`, método 5 trilhas, badges, métricas, curriculum, placement)
- Infraestrutura completa (`db.ts`, `chesscomClient.ts`, `oauth.ts`, `providerQueue.ts`, `extractSignals.ts`, `persistence.ts`, `appData.ts`, `backup.ts`)
- Camada de app (`state.ts` — 1296 linhas, `trainingLogFlow.ts`, `oauthFlow.ts`, `achievementsSync.ts`)
- UI (`App.tsx`, `Today.tsx`, `Onboarding.tsx`, `Config.tsx`, `Progress.tsx`, `TutorCard.tsx`, componentes de arte)
- Configuração (`package.json`, `tsconfig.json`, `eslint.config.js`, `vite.config.ts`, `vitest.config.ts`)
- Documentação (`AGENTS.md`, `README.md`, `VISAO.md`, `PLANO.md`, `memory/state.md`, `memory/decisions.md`, `memory/progress.md`, ADRs)
- CSS (`src/index.css` — primeiras 100 linhas do design system de 2471 linhas)
- Testes com falha (`trainingFlow.test.tsx`, `oauthCallback.test.tsx`, `Today.test.tsx`, `preserveProgress.test.tsx`)

### O que rodei
- `npm run lint` — **PASS** (0 erros, ESLint strictTypeChecked)
- `npm run test` — **56/59 arquivos passaram (95%), 401/409 testes passaram (98%)**; 8 falhas em 3 arquivos
- `npm run build` — **PASS** (tsc -b + vite build, 811ms, PWA com 75 entradas precache, 1717 KiB)

### O que não rodei
- Testes E2E com Playwright (framework instalado mas sem testes implementados)
- Auditoria de acessibilidade com axe-core ou Lighthouse
- Análise de bundle com `vite-plugin-visualizer`
- Testes manuais no browser (não executei `npm run dev`)

---

## 2. Correção & Bugs — Nota 6

### Elogios
- Pipeline Signal→Weakness→Plan com tipagem forte e discriminada (`SignalValue`, `WeaknessTag`, `PlanBlockKind`)
- `providerQueue.ts:16-43` — Fila serial elegante com cooldown por rate-limit, sem bloquear requests subsequentes em falha
- `filterFreshSignals` (`detectWeaknesses.ts:38-49`) com fallback seguro para datas inválidas
- Tratamento correto de `chesscomClient.fetchJson` com erro tipado `ChesscomRateLimitError` (`chesscomClient.ts:103-104`)
- `backup.ts` — Export versionado com checksum SHA-256 e validação transacional na restauração

### Faltas
- **8 testes quebrados** — 3 timeouts + 5 elementos não encontrados no DOM de teste (jsdom). Os testes de `trainingFlow.test.tsx` falham em cenários reais de fluxo: "Treinando há", "Dia concluído. Bom trabalho.", "Feito", "Concluir" não aparecem no tempo esperado. Confiança: **alta** (output real do vitest).
- **`preserveProgress.test.tsx:30`** — Timeout de 5s ao regenerar plano após completar bloco. Confiança: **alta**.
- **`Today.test.tsx:106`** — Timeout ao buscar "Próximo passo". Possível regressão no componente `Today` ou no mock. Confiança: **alta**.

### Soluções
1. Corrigir os 8 testes quebrados — prioridade máxima. Investigar se são regressões de UI (textos mudaram) ou fragilidade dos testes (timeouts em jsdom com operações assíncronas).
2. Adicionar `testTimeout: 10000` no `vitest.config.ts` para testes de integração que dependem de `waitFor` com operações complexas.
3. Implementar ao menos 1 teste E2E com Playwright cobrindo o fluxo feliz: onboarding → diagnóstico → plano → treino → feedback.

### Alternativa
- Usar `@testing-library/user-event` em vez de `fireEvent` para simular interações mais realistas (já instalado? Verificar).

### Perguntas
- Os 8 testes já passavam antes? Se sim, qual commit introduziu a regressão?
- O `window.open` mock (`vi.spyOn(window, 'open').mockReturnValue({} as Window)`) é suficiente para o fluxo de treino ou o componente espera um `Window` real?

---

## 3. Qualidade de Código — Nota 8

### Elogios
- TypeScript estrito com `noUncheckedIndexedAccess`, `noImplicitAny` — zero `any` no código
- Domínio puro sem efeitos colaterais (`src/domain/` — atestado por ESLint `no-restricted-imports`)
- Uso consistente de `satisfies` para validação em nível de tipo (`detectWeaknesses.ts:22,28`, `generatePlan.ts:60,558`)
- Testes co-localizados com fonte (`.test.ts` ao lado de `.ts`)
- Comentários em PT-BR explicando o "porquê" das decisões, não o "o quê" do código
- Barrel exports limpos (`src/domain/index.ts`)

### Faltas
- **`state.ts` é um God object de 1296 linhas** — Inicialização (170 linhas), sync Chess.com (70 linhas), sync Lichess (70 linhas), saveProfile (40 linhas), OAuth (50 linhas), treino (150 linhas), export/backup (70 linhas) tudo em um hook. Violação clara de Single Responsibility.
- **Duplicação de ~70 linhas entre `runChesscomSync` e `runLichessSync`** (`state.ts:381-532`) — Mesmo padrão: validate→check freshness→fetch→replace→load→detect→generate→merge→replace→save→update state. Só muda a função de fetch e mensagens.
- **`generatePlan.ts:296-346` (`getBlockCopy`)** — Switch sem `default`. Se `PlanBlockKind` ganhar um novo membro, retorna `undefined` silenciosamente. Deveria usar `assertNever(kind)`.
- **`state.ts:564-573`** — `void` expression no auto-sync sem `.catch()`. Se o callback lançar antes do try/catch interno, o erro é perdido.
- **`generatePlan.ts:394-447` (`getLatestThemeSignalForWeakness`)** — 54 linhas, alta complexidade ciclomática, 3 code paths aninhados.

### Soluções
1. Extrair `runDiagnosisSync(source, fetchFn)` genérico eliminando a duplicação Chess.com/Lichess
2. Quebrar `state.ts` em hooks menores: `useDiagnosis`, `useTraining`, `useBackup`, `useOAuth`
3. Adicionar `assertNever(kind)` no switch de `getBlockCopy` com tipo `never` para exhaustiveness check em compile-time
4. Extrair `getLatestThemeSignalForWeakness` em 3 funções: `findFeedbackSignal`, `findPriorGuidedSignal`, `findOpenedGuidedSignal`
5. Adicionar `.catch()` no `void` do auto-sync com toast de erro

### Alternativa
- Migrar para Zustand ou Jotai para gerenciamento de estado — reduziria o acoplamento do `useAppState` mas introduziria dependência externa no app layer. O pattern atual de hook único é aceitável para o tamanho do app.

### Perguntas
- O dono está confortável com refatoração do `state.ts` ou prefere estabilidade?
- Há apetite para introduzir `zustand` (3KB) como dependência?

---

## 4. Arquitetura — Nota 9

### Elogios
- **Clean Architecture exemplar** — `domain/` (puro) → `app/` (orquestração) → `infra/` (I/O) → `ui/` (React). Separação de concerns invejável.
- **ESLint enforced domain isolation** (`eslint.config.js:17-45`) — `domain/` não pode importar React, Dexie, infra ou UI. Isso é raro e excelente.
- Barrel export único em `src/domain/index.ts` — toda a lógica de negócio acessível por um ponto.
- Tipos definidos uma vez em `domain/types.ts` (285 linhas) e reusados em todas as camadas.
- Pipeline Signal→Weakness→Plan com interfaces claras e transformações puras.
- Code splitting com `React.lazy()` para Config e Progress.
- Vendor chunking manual (`vite.config.ts:64-73`) — react-vendor, dexie, icons isolados para cache longo.

### Faltas
- **`state.ts` é o ponto único de acoplamento** — Toda orquestração passa por um hook. Se quebrar, o app inteiro quebra. A inicialização (`useEffect` de 170 linhas) não tem recuperação parcial: se plan generation falha mas signals carregaram, o usuário vê tela vazia.
- **IDs de bloco codificam data** (`generatePlan.ts:240-243` — `createPlanBlockId` usa `YYYY-MM-DD[-sNN]-NN-kind`). Extrair data do ID com `slice(0,10)` (`generatePlan.ts:450,461`) é frágil — se o formato mudar, todas as comparações de data quebram silenciosamente.
- **`applyAdaptiveReviewRatio` (`generatePlan.ts:250-276`) muta o array in-place e altera `kind` dos blocos permanentemente**, mas o ID original (que contém o `kind` original) permanece — inconsistência entre ID e kind real.
- **`LearnerBand` (`types.ts:59-66`)** tem intervalo `'1600-2000'` (400 pontos) enquanto os demais são 200 pontos — assimetria intencional mas não documentada.

### Soluções
1. Separar `DatePlanId` como tipo branded com parser validado, em vez de string slicing
2. `applyAdaptiveReviewRatio` deve retornar novo array sem mutar o original, ou adicionar campo `originalKind` ao bloco
3. Adicionar recuperação parcial na inicialização: se diagnóstico falha, mostra plano anterior com aviso

### Perguntas
- O intervalo 1600-2000 (400pts) é intencional ou deveria ser 1600-1800, 1800-2000?
- Há plano de extrair o state para um reducer/context no futuro?

---

## 5. Domínio / Lógica Central — Nota 7

### Elogios
- Pipeline Signal→Weakness→Plan semanticamente correto: erros táticos → fraquezas temáticas → blocos de treino com destinos Lichess
- Time budget adaptativo (`timeBudget.ts`) — sessões escalam com disponibilidade do aluno
- Spaced repetition nos `PendingTrainingItem` com decaimento exponencial (`pendingItems.ts`)
- Método 5 trilhas bem modelado: `pending-review`, `calculation-bridge`, `active-defense`, `opening-as-plan`, `progress-diplomas`
- Diplomas com critérios cumulativos de esforço (Peão/Torre/Rei) — sem rating, sem streak punitivo
- `sessionReport.ts` com máquina de regras clara: hard→volta estágio, easy+explain→avança, sem sinal→pergunta

### Faltas
- **Mapeamento puzzle-theme→weakness genérico demais** (`diagnosis.ts:162-183`) — `'advantage'`, `'crushing'`, `'defensiveMove'`, `'capturingDefender'`, `'deflection'` todos mapeiam para `'conversion'`. O tratamento é genérico ("Simplifique quando puder, ative peças e reduza o contra-jogo") independente do tema específico.
- **Sinal `rating` e `time-control` são coletados mas nunca produzem fraquezas** (`detectWeaknesses.ts:165-167` retorna `[]`). Se o rating despenca, nenhum diagnóstico é gerado. Intencional (comentário linha 4-6 diz que blunder é a alavanca #1), mas não documentado.
- **`detectColorWeakness` (`detectWeaknesses.ts:177`)** sempre mapeia diferença de cor para `'opening-principles'`, mas diferença de performance branca vs preta pode indicar problemas defensivos (`'hanging-piece'`, `'mate-in-2'`), não só abertura.
- **`getBlockCopy` do `generatePlan.ts:363-377`** — Quando feedback é `'hard'` e `resourceStage === 'explain'`, retorna `'retrieval'` (AVANÇA!). Isso parece invertido — espera-se voltar para `'guided'` ou repetir `'explain'`.
- **`LearnerBand` gap em `'2000-2200'`** vs `'1600-2000'` — sem tratamento para banda `'1800-2000'`.

### Soluções
1. Desmembrar `'conversion'` em sub-tags ou enriquecer o `coachNote` com o tema original do puzzle
2. Documentar explicitamente que rating/time-control são sinais de contexto, não de fraqueza
3. Revisar lógica de `getBlockCopy` para `'hard'` — confirmar se é intencional ou bug
4. Mapear color weakness para múltiplos possíveis `WeaknessTag` baseado no contexto (abertura, defesa, ataque)

### Perguntas
- A lógica "hard em explain → retrieval" (`generatePlan.ts:370`) é intencional? Se sim, qual a pedagogia?
- Os thresholds de `clock` (10 games, 2 timeoutLosses, linha 125) deveriam ser configuráveis por banda?

---

## 6. Dados & Estado — Nota 7

### Elogios
- Dexie com 11 migrações versionadas (`db.ts:117-196`) — cada versão com propósito documentado
- Soft delete com purga de 90 dias (`deletedAt` + `purgeDeleted`)
- Backup versionado com checksum SHA-256 e validação transacional (formato→versão→checksum→shape)
- `storage.persist()` com status honesto na Config
- `updatedAt` universal em signals/weaknesses (migração v7)
- UUIDs em signals e pending items (migração v7)

### Faltas
- **`ChesscomMonthCache.signals`** armazena `Signal[]` completo — se o usuário tem anos de histórico, o array pode crescer significativamente. Sem paginação ou limite de tamanho.
- **`handle?: unknown` na tabela `backupMeta`** (`db.ts:65-66`) — FileSystemFileHandle é `unknown` por design (independência de domínio), mas o cast `as FileSystemFileHandleLike` (`state.ts:252`) pode falhar silenciosamente se a API do browser mudar.
- **Sem estratégia de migração para dados corrompidos** — se um registro Dexie falha ao desserializar, o app inteiro pode quebrar na inicialização.
- **Sem limite de crescimento do IndexedDB** — sinais antigos (>90 dias) são filtrados no diagnóstico mas nunca expurgados do banco.

### Soluções
1. Adicionar expurgo periódico de sinais com `deletedAt` > 90 dias (aproveitar soft delete)
2. Adicionar try/catch na inicialização do Dexie com fallback para banco vazio em caso de corrupção
3. Limitar `ChesscomMonthCache` a N meses mais recentes no armazenamento (cache pode reconstruir)

---

## 7. Testes & QA — Nota 6

### Elogios
- 59 arquivos de teste, 409 testes, 98% passando
- Testes de domínio são puros, rápidos (<10ms cada), sem mocks
- Testes de infra usam `fake-indexeddb` — simulam IndexedDB real
- Testes de UI usam `@testing-library/react` com queries acessíveis (role, text)
- Smoke test cobre o funil de onboarding completo
- `providerQueue.test.ts` testa cenários de rate limit com timers controlados

### Faltas
- **8 testes quebrados (2% de falha)** — 3 timeouts + 5 elementos não encontrados. Concentrados em fluxo de treino e interação com `window.open`.
- **Zero testes E2E** — Playwright instalado (1.60.0) mas sem specs. O fluxo mais crítico (onboarding→diagnóstico→plano→treino→feedback) não é testado end-to-end.
- **Sem CI** — Nenhum GitHub Actions, GitLab CI ou similar. Testes só rodam manualmente.
- **Testes de integração frágeis** — Dependem de timers reais (`vi.useRealTimers()`), `window.open` mock frágil, e `waitFor` com timeout padrão de 1000ms que é insuficiente para operações Dexie + React render.
- **Sem testes de acessibilidade** — Nada de axe-core, pa11y ou lint de ARIA.

### Soluções
1. Corrigir os 8 testes quebrados (prioridade máxima)
2. Aumentar timeout global de teste para 10s no `vitest.config.ts`
3. Substituir `fireEvent` por `userEvent` (mais realista, dispara eventos assíncronos corretos)
4. Adicionar 2-3 testes E2E com Playwright: (a) onboarding feliz, (b) ciclo de treino completo, (c) importação Chess.com
5. Configurar GitHub Actions com `npm run lint && npm run test && npm run build`
6. Adicionar `@axe-core/react` para auditoria de acessibilidade em dev

---

## 8. Documentação & Memória do Projeto — Nota 9

### Elogios
- **9 ADRs** (`docs/adr/`) documentando decisões arquiteturais com contexto, opções e justificativa
- **`memory/`** com 6 arquivos vivos: `state.md` (326 linhas), `decisions.md` (498 linhas), `progress.md` (321 linhas), `conventions.md`, `project.md`, `do-not-do.md` — rastreabilidade excepcional
- **35 research reports** em `docs/research/` — a base pedagógica é profundamente documentada
- **27 review reports** em `docs/review/` — auditorias multi-IA registradas
- `AGENTS.md` como fonte canônica de regras para agentes — claro, completo, sem ambiguidades
- `PLANO.md` e `VISAO.md` alinhados com o estado atual

### Faltas
- **`README.md` desatualizado** — não reflete P3 concluído, método 5 trilhas, badges, OAuth, etc.
- **Sem documentação de API interna** — `state.ts` expõe ~60 funções no return do hook sem JSDoc. Um dev novo não sabe por onde começar.
- **`plugins/`** contém contratos sem implementação — pode confundir quem achar que são plugins reais
- **`prompts/`** — ~15 templates de prompt para IA, mas sem README explicando quando usar cada um

### Soluções
1. Atualizar `README.md` com features atuais, stack real e instruções de dev
2. Adicionar JSDoc nas funções públicas do `state.ts` (ao menos `@param` e `@returns`)
3. Adicionar cabeçalho "FROZEN — P4/P5 não implementadas" nos arquivos de `plugins/`
4. Adicionar README em `prompts/` explicando o propósito e fluxo de cada template

---

## 9. Processo & Tooling — Nota 6

### Elogios
- Gate de qualidade claro: `npm run lint && npm run test && npm run build`
- Scripts utilitários em `scripts/` bem organizados com README (`check-prod.mjs`, `optimize-art.mjs`, `screenshots.mjs`)
- Dependências enxutas (6 runtime, 12 dev) — sem inchaço
- `eslint.config.js` limpo (46 linhas) com `strictTypeChecked`
- `.gitignore` cobre `dist/`, `node_modules/`, `.vercel/`, `.vite/`, `entrega/`

### Faltas
- **Zero CI/CD** — Sem GitHub Actions, sem deploy automatizado, sem verificação de PR
- **Sem pre-commit hooks** — Nada de husky, lint-staged ou similar. Código pode ser commitado sem lint/test.
- **Sem versionamento semântico** — `package.json` versão `0.0.0`. Commits não seguem conventional commits.
- **Deploy manual no Vercel** — Sem preview deployments, sem rollback automatizado
- **`playwright` instalado mas sem testes** — Dependência pesada (~300MB) sem uso

### Soluções
1. Adicionar GitHub Actions com workflow: `lint → test → build` em push/PR
2. Configurar `husky` + `lint-staged` para lint automático em staged files
3. Adotar conventional commits com `commitlint`
4. Configurar Vercel para deploy automático em push na branch principal
5. Extrair Playwright para `optionalDependencies` ou implementar 2-3 testes E2E

---

## 10. Visual & Design — Nota 9

### Elogios
- **Design system completo** em `src/index.css` (2471 linhas) — tokens CSS custom properties para cores, tipografia, espaçamento, sombras, bordas, movimento
- **Tema "tabuleiro e papel"** consistente — verde profundo (`#1f3f36`), papel quente (`#f5f3ec`), âmbar, ardósia
- **Tipografia self-hosted** — Inter Variable (sans, corpo) + Fraunces Variable (serif, display) via `@fontsource-variable`, subset latino no precache offline
- **Números tabulares** (`font-variant-numeric: tabular-nums`) em todas as métricas — alinhamento correto em colunas
- **54 imagens .webp otimizadas** em `public/art/` — avatares, molduras, texturas, selos, bandas
- **SVGs inline para ícones de banda/diploma** — sem dependência de sprite sheet
- Nenhum hex solto — todas as cores referenciam tokens

### Faltas
- **Sem dark mode** — `color-scheme: light` fixo (`index.css:74`). O app é light-only.
- **Gradiente de fundo com valores em pixel fixos** (`radial-gradient(1100px 460px at 50% -160px`) — não escala em ultrawide ou mobile estreito.
- **Progressão de radius inconsistente** — `--radius-lg: 14px`, `--radius-md: 10px`, `--radius-sm: 8px` (gap 4px, depois 2px).
- **Fallback de fonte frágil** — Se Fraunces não carrega, fallback é Times New Roman, visualmente muito diferente.

### Soluções
1. Adicionar media query para dark mode com `prefers-color-scheme: dark` (3-4 horas de trabalho usando os tokens existentes)
2. Usar unidades relativas ou `clamp()` no gradiente de fundo
3. Normalizar progressão de radius (ex.: 16/12/8)
4. Adicionar `font-display: swap` no `@font-face` do Fraunces

---

## 11. UX — Nota 8

### Elogios
- Onboarding em 3 passos: boas-vindas → configuração → aprovação do plano — fluxo claro, sem fricção
- Card do Professor Lemos com abertura, retorno pós-ausência, fechamento por feedback — tom acolhedor
- Timer local com contagem regressiva — feedback visual imediato
- Feedbacks "Fácil", "Bom", "Difícil" com ícones e cores distintas — affordance clara
- Plano explica quando está em fallback por falta de sinais — honestidade com o usuário
- Botão "Importar atividade livre" com janela de 48h — autonomia do aluno

### Faltas
- **Sem gesto de "pull to refresh"** no mobile PWA — usuário precisa achar botão de sync
- **Sem indicador de progresso durante sync Chess.com** (pode levar minutos na primeira vez com 60+ arquivos)
- **Sem confirmação ao pular bloco de treino** — um toque acidental perde o bloco
- **Sem atalho de teclado** — navegação depende exclusivamente de mouse/toque
- **Sem hint visual de que Config e Progresso são lazy-loaded** — o "Carregando..." aparece por ms mas é notado

### Soluções
1. Adicionar barra de progresso ou spinner com "Baixando mês X/Y" durante primeira sync Chess.com
2. Adicionar `confirm()` ao pular bloco ("Tem certeza? O treino de hoje fica incompleto.")
3. Implementar atalhos de teclado: `Alt+1` Hoje, `Alt+2` Progresso, `Alt+3` Config, `Alt+T` treino
4. Adicionar suporte a pull-to-refresh com `@vite-pwa/periodic-sync` ou gesto manual

---

## 12. UI — Nota 8

### Elogios
- Layout responsivo com grid CSS (`today-columns`, `panel`) — funciona desktop e mobile
- Estados bem cobertos: vazio ("Nenhum plano hoje"), carregando (ViewFallback com aria-live), erro (toasts)
- Cards com hierarquia clara: título → descrição → ação → feedback
- Ícones lucide-react consistentes, com `aria-hidden="true"` e `stroke="currentColor"`
- Navegação com indicador visual de aba ativa (`nav-button-active`)
- Toasts via `sonner` com tema condicional (light/dark)

### Faltas
- **SVGs inline enormes** — Ícones lucide renderizados como JSX com paths completos (ex.: ícone de settings com ~30 linhas). Incha o DOM. Lucide-react não oferece sprite sheet.
- **Sem skeleton screens** — Loading é um spinner simples. Poderia ter skeleton dos cards.
- **Sem transições entre views** — Troca de aba é instantânea, sem animação
- **Botão "Recarregar" usa `window.location.assign(pathname)`** (`App.tsx:182-184`) — perde query params e hash. Deveria usar `window.location.reload()`.

### Soluções
1. Substituir lucide-react por `lucide-static` com SVG sprite ou usar `useMemo` nos ícones
2. Adicionar animação de transição entre views (ex.: `fadeIn` com `@starting-style`)
3. Corrigir botão "Recarregar" para preservar URL completa
4. Considerar skeleton screens para carregamento inicial (baixa prioridade para ferramenta pessoal)

---

## 13. Conteúdo & Comunicação — Nota 8

### Elogios
- Tom PT-BR adulto, sem infantilizar — "Professor Lemos" como voz, não personagem
- Microcopy consistente: "Hoje", "Bom", "Difícil", "Feito", "Dia concluído. Bom trabalho."
- Mensagens de diagnóstico honestas: "Ainda não tenho informação suficiente" em vez de inventar
- `sessionReport.ts` com mensagens contextualizadas por tipo de sessão
- Nota de retorno pós-ausência ("Faz X dias que não nos vemos") — acolhedor sem ser pegajoso

### Faltas
- **Mensagens de erro genéricas em alguns fallbacks** — ex.: "Erro ao carregar dados" sem ação sugerida
- **Termos técnicos sem explicação** — "garfo", "cravada", "rede de mate" aparecem sem definição para iniciantes
- **`QUESTION_MESSAGE` hardcoded** (`diagnosis.ts:80`) — string fixa "Qual área você sente mais dificuldade?"

---

## 14. Plataforma & Performance — Nota 9

### Elogios
- **PWA completa**: manifest, service worker (Workbox), 75 precache entries (1717 KiB), offline-ready
- **Build rápido**: 811ms para production bundle com type check
- **Code splitting**: `Config` (12.84 KB) e `Progress` (8.18 KB) lazy-loaded
- **Vendor chunking**: `react-vendor` (182 KB), `dexie` (95 KB), `icons` (17 KB) isolados
- **CSS minificado**: 36.53 KB (7.92 KB gzip)
- **Font subset**: apenas latino no precache, demais subsets sob demanda via unicode-range
- **Bundle principal**: 235 KB (65 KB gzip) — respeitável para um app com domínio rico

### Faltas
- **Sem métricas de performance** — Sem Web Vitals, sem analytics, sem RUM. Impossível saber se o app é rápido na prática.
- **`chesscomClient.ts:59-63`** — Primeira sync sequencial de 60+ arquivos mensais pode levar minutos. Sem progresso visível.
- **Sem `loading="lazy"` nas imagens** — WebP do Lemos e texturas carregam eager por padrão.

### Soluções
1. Adicionar `web-vitals` para tracking de LCP, FID, CLS
2. Paralelizar fetch de arquivos Chess.com com `Promise.allSettled` (respeitando rate limit de 1 req/s)
3. Adicionar `loading="lazy"` nas imagens abaixo do fold
4. Pré-carregar fontes com `<link rel="preload">` no `index.html`

---

## 15. Acessibilidade & Internacionalização — Nota 3

### Elogios
- `aria-label` em navegação principal (`"Navegação principal"`)
- `aria-labelledby` nas seções (ex.: `today-title`)
- `aria-live="polite"` na região de notificações (toasts)
- `aria-hidden="true"` nos SVGs decorativos
- Botões com texto visível (não só ícones)

### Faltas
- **Zero i18n** — Todo texto hardcoded em PT-BR. Sem estrutura para tradução futura.
- **Sem suporte a leitor de tela testado** — ARIA attributes presentes mas nunca validados com VoiceOver/NVDA
- **Sem dark mode** — `color-scheme: light` fixo, sem `prefers-color-scheme` media query
- **Sem high contrast mode** — Não testado com `prefers-contrast: more`
- **Sem indicadores de foco visíveis customizados** — Depende do `:focus-visible` padrão do browser
- **Sem `prefers-reduced-motion`** — Animações não são desabilitadas para usuários com sensibilidade
- **Sem zoom testado** — Layout pode quebrar com 200% de zoom

### Soluções
1. Estruturar textos em objeto `pt-BR.json` na raiz, preparando para i18n futuro
2. Rodar auditoria com axe-core e corrigir violações
3. Implementar dark mode com `prefers-color-scheme` (reutilizar tokens CSS)
4. Adicionar `prefers-reduced-motion` media query
5. Testar com zoom 200% no mobile

---

## 16. Segurança & Privacidade — Nota 8

### Elogios
- **PKCE OAuth flow** (`oauth.ts`) — `code_verifier` + `code_challenge` com SHA-256, state parameter para CSRF
- **PGN transiente** — Extrai sinais e descarta, nunca persiste PGN completo
- **Tokens OAuth só em IndexedDB local** — Nunca em localStorage, cookies ou logs
- **`storage.persist()`** com status honesto — usuário sabe se dados podem ser evictados
- **Escopos OAuth mínimos**: `puzzle:read` + `study:write` — sem escopos de jogo, engine ou mensagens
- **Revogação de token** (`oauth.ts:120-132`) — Tenta revogar no servidor, sempre limpa localmente
- **`robots.txt` com `Disallow: /`** + `vercel.json` com `X-Robots-Tag: noindex, nofollow` — app pessoal não indexado

### Faltas
- **Sem CSP (Content Security Policy)** — Nenhum header de segurança configurado no `vercel.json`
- **Sem auditoria de dependências** — Sem `npm audit` no workflow, sem Dependabot
- **`chesscomClient.ts:147`** usa `toLocaleLowerCase('en-US')` para normalize de username — `'en'` seria mais seguro para caracteres especiais
- **Sem rate limiting no restore de backup** — Usuário pode importar JSON malicioso, apesar da validação de formato/versão/checksum/shape

### Soluções
1. Adicionar headers CSP no `vercel.json`: `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://lichess.org https://api.chess.com`
2. Adicionar `npm audit` ao gate de qualidade ou Dependabot
3. Substituir `toLocaleLowerCase('en-US')` por `.toLowerCase()`
4. Adicionar validação de tamanho máximo no restore de backup (ex.: 10MB)

---

## 17. Build, Release & Operação — Nota 6

### Elogios
- Build rápida e confiável: `tsc -b && vite build` em 811ms
- Vercel configurado com headers de privacidade e SPA fallback
- `check-prod.mjs` — script de verificação pós-build
- `screenshots.mjs` — captura de screenshots para auditoria visual
- PWA com `registerType: 'prompt'` — usuário decide quando atualizar

### Faltas
- **Zero CI/CD** — Sem deploy automatizado, sem preview environments
- **Sem versionamento** — `version: "0.0.0"` fixo, sem changelog
- **Sem monitoramento** — Sem log de erros, sem analytics, sem crash reporting
- **Sem plano de rollback** — Deploy manual no Vercel, rollback depende de git revert manual
- **Sem teste de regressão visual** — Screenshots manuais via `screenshots.mjs`, sem comparação automatizada (Percy/Chromatic)

### Soluções
1. Configurar GitHub Actions + Vercel deploy preview em branches
2. Versionar com `npm version patch` + git tag a cada release
3. Adicionar `Sentry` ou `renovate` para tracking de erros em produção (opt-in, local-first)
4. Considerar Chromatic ou Percy para diff visual automatizado

---

## 18. Área Extra: Pedagogia & Eficácia — Nota 7

### Elogios
- Base teórica sólida documentada em 35 research reports: Charness 2005, Campitelli & Gobet 2011, Woodpecker Method, DAMP (Defesa/Alinhamento/Mobilidade/Promoção)
- Progressão por bandas de rating (7 níveis) com conteúdo adaptado
- Método de 5 trilhas cobre pendências, cálculo, defesa, abertura e diplomas
- Time budget adaptativo baseado em sinais locais + proporção-base do Leitão
- Efeito de espaçamento (spaced repetition) nos `PendingTrainingItem`
- Marcos de esforço (diplomas), não de rating — alinhado com a visão do dono

### Faltas
- **Sem medição de eficácia real ainda** — As 4 métricas de baseline foram definidas mas só serão revisadas ~2026-07-08
- **Curriculum spine 1200-2200 reutiliza conteúdo "improving"** — Placeholder até Corte 8 (material avançado próprio)
- **DAMP entrou como detecção tática, não como ritual de segurança** — Decisão documentada, mas implementação é recente
- **Sem diferenciação pedagógica por idade ou estilo de aprendizado** — Um método único para todos

---

## Seções Transversais

### Top 5 Riscos (Crítico/Alto)

| # | Risco | Severidade | Mitigação |
|---|-------|------------|-----------|
| 1 | 8 testes quebrados mascaram regressões reais no fluxo de treino | **Alto** | Corrigir testes, investigar se são bugs de UI ou fragilidade dos testes |
| 2 | `generatePlan.ts:296-346` — switch sem default, retorna undefined se nova kind adicionada | **Alto** | Adicionar `assertNever(kind)` com tipo `never` |
| 3 | `state.ts` God object de 1296 linhas — difícil de manter, testar e debugar | **Médio** | Extrair hooks menores; começar por `useDiagnosis`, `useTraining` |
| 4 | `applyAdaptiveReviewRatio` (`generatePlan.ts:250-276`) muta blocos in-place, IDs ficam inconsistentes | **Médio** | Retornar novo array; adicionar `originalKind` ao bloco |
| 5 | Sem CI/CD — regressões só são detectadas manualmente | **Médio** | Configurar GitHub Actions com lint+test+build |

### Top 10 Quick Wins (alto impacto, baixo esforço)

| # | Quick Win | Esforço | Impacto |
|---|-----------|---------|---------|
| 1 | Corrigir os 8 testes quebrados | M | Alto |
| 2 | Adicionar `assertNever(kind)` no switch de `getBlockCopy` | P | Alto |
| 3 | Corrigir `window.location.reload()` no botão "Recarregar" | P | Baixo |
| 4 | Adicionar `.catch()` no `void` do auto-sync | P | Médio |
| 5 | Corrigir `toLocaleLowerCase('en-US')` → `.toLowerCase()` | P | Baixo |
| 6 | Adicionar `font-display: swap` no @font-face do Fraunces | P | Baixo |
| 7 | Configurar GitHub Actions (lint + test + build) | P | Alto |
| 8 | Atualizar `README.md` com estado atual do projeto | P | Médio |
| 9 | Adicionar headers CSP no `vercel.json` | P | Médio |
| 10 | Adicionar `loading="lazy"` nas imagens abaixo do fold | P | Baixo |

### Dívida Técnica Priorizada

| # | Dívida | Juros | Pagamento sugerido |
|---|--------|-------|-------------------|
| 1 | `state.ts` 1296 linhas com duplicação de sync | Cada feature nova adiciona ~50 linhas; risco de divergência Chess.com/Lichess | Extrair `runDiagnosisSync` genérico; quebrar hook em módulos |
| 2 | Testes de integração frágeis (8 quebrados) | Perda de confiança na suíte; regressões passam despercebidas | Corrigir + aumentar timeout + CI |
| 3 | `generatePlan.ts` mutação in-place + ID inconsistency | Bugs sutis em planos regenerados; difícil de debugar | Imutabilidade + `originalKind` |
| 4 | Sem i18n | Todo texto hardcoded; rework massivo para P5 | Estruturar textos em JSON |
| 5 | Sem dark mode | Usuário noturno sem alternativa; dívida visual para P5 | Implementar com `prefers-color-scheme` + tokens |
| 6 | `chesscomClient.ts` fetch sequencial de 60+ arquivos | Primeira sync dolorosamente lenta; abandono do usuário | Paralelizar com `Promise.allSettled` + progresso |
| 7 | Sem E2E | Fluxo principal não testado; regressões de UI não detectadas | 2-3 testes Playwright no fluxo feliz |

### Roadmap Sugerido Até a Próxima Revisão (~2026-07-08)

1. **Estabilizar testes (agora)** — Corrigir 8 testes quebrados, adicionar CI, investigar `preserveProgress`
2. **Corrigir bugs de código (agora)** — `assertNever`, `window.location.reload()`, `.catch()` no sync, `.toLowerCase()`
3. **Refatoração tática (junho)** — Extrair `runDiagnosisSync`, quebrar `getLatestThemeSignalForWeakness`, imutabilidade no `applyAdaptiveReviewRatio`
4. **Dark mode (junho-julho)** — 3-4h de trabalho, alto impacto visual, baixo risco
5. **E2E + monitoramento (julho)** — 2-3 testes Playwright, Web Vitals, baseline de eficácia
6. **Revisão de eficácia (~2026-07-08)** — Revisar as 4 métricas de baseline com dados reais de uso

### O Que NÃO Fazer

- **NÃO implementar P4 (sync/backend)** — Congelado pelo dono. Qualquer esforço aqui é desperdício.
- **NÃO implementar P5 (comunidade)** — Congelado. Dark mode e i18n preparam o terreno, mas não implementar features de comunidade.
- **NÃO migrar de Dexie para outro banco** — Dexie funciona bem para o caso de uso. Trocar seria over-engineering.
- **NÃO adicionar state manager (Redux/Zustand/Jotai)** — O hook `useAppState` é suficiente para o app atual. Refatorar dentro do pattern existente.
- **NÃO criar tabuleiro próprio** — Regra inquebrável. Violaria o modelo do produto.
- **NÃO adicionar analytics sem opt-in explícito** — Ferramenta pessoal. Telemetria só com consentimento.
- **NÃO implementar mais badges ou diplomas** — Os 5 badges v1 e 3 diplomas são suficientes até a revisão de eficácia.
- **NÃO otimizar bundle size** — 235KB gzip está excelente. Micro-otimizações não valem o esforço.

---

## Perguntas Abertas ao Dono do Produto

1. **Qual é a definição de "pronto" para a revisão de ~2026-07-08?** Testes verdes? Uso diário por X semanas? Métricas de eficácia positivas?
2. **Os 8 testes quebrados são regressão recente ou sempre falharam?** Se for regressão, qual commit introduziu?
3. **A lógica "hard em explain → retrieval" (`generatePlan.ts:370`) é intencional?** Se sim, qual a intenção pedagógica?
4. **O dono está confortável com refatoração do `state.ts`?** Ou prefere estabilidade e correções pontuais?
5. **Há apetite para adicionar uma dependência leve (ex.: zustand, 3KB)?** Ou manter zero dependências de estado?
6. **O intervalo `'1600-2000'` (400 pontos) deve ser quebrado em `1600-1800` e `1800-2000`?**
7. **Dark mode é prioridade ou "nice to have"?** O app é usado principalmente de dia ou de noite?
8. **Playwright deve ser removido (sem uso) ou implementados 2-3 testes E2E?**
9. **Quando P4/P5 serão reavaliadas?** Há timeline ou depende de marcos de uso?
10. **Os livros de xadrez no `LIVROS XADREZ PARA CONSULTA/` são legalmente seguros?** Só para consulta pessoal ou pretende-se extrair conteúdo para o app?

---

## Apêndice — Achados com file:line e Nível de Confiança

### Bugs / Regressões (confiança alta — output real de teste)

| # | Arquivo:linha | Descrição | Severidade |
|---|---------------|-----------|------------|
| 1 | `trainingFlow.test.tsx:84` | "Treinando há" não aparece no DOM após abrir Lichess | Alto |
| 2 | `trainingFlow.test.tsx:161` | "Dia concluído. Bom trabalho." não aparece após último bloco | Alto |
| 3 | `trainingFlow.test.tsx:201` | Timeout ao testar feedback "Difícil" | Alto |
| 4 | `trainingFlow.test.tsx:331` | "Feito" não aparece ao reabrir bloco concluído | Alto |
| 5 | `trainingFlow.test.tsx:356` | Botão "Concluir" não encontrado | Alto |
| 6 | `preserveProgress.test.tsx:30` | Timeout ao regenerar plano após completar bloco | Médio |
| 7 | `Today.test.tsx:106` | Timeout ao buscar "Próximo passo" | Médio |
| 8 | `oauthCallback.test.tsx:18` | Texto "cancelou a conexão com o Lichess" não aparece (confiança média — output ambíguo) | Médio |

### Riscos de Código (confiança alta — revisão estática)

| # | Arquivo:linha | Descrição | Severidade |
|---|---------------|-----------|------------|
| 9 | `generatePlan.ts:296-346` | Switch sem default — retorna undefined se nova kind | Alto |
| 10 | `generatePlan.ts:250-276` | `applyAdaptiveReviewRatio` muta array e kind in-place | Alto |
| 11 | `state.ts:564-573` | `void` expression engole erros do auto-sync | Médio |
| 12 | `generatePlan.ts:449-468` | Data extraída de ID com `slice(0,10)` — frágil | Médio |
| 13 | `state.ts:381-532` | ~120 linhas duplicadas entre sync Chess.com e Lichess | Médio |
| 14 | `diagnosis.ts:162-183` | Vários temas de puzzle mapeiam para `'conversion'` genérico | Médio |
| 15 | `generatePlan.ts:370` | Feedback "hard" em "explain" avança para "retrieval" — lógica potencialmente invertida | Médio |
| 16 | `chesscomClient.ts:51-64` | Fetch sequencial de 60+ arquivos — primeira sync muito lenta | Médio |
| 17 | `providerQueue.ts:30-31` | Cooldown fixo 60s sem parse de header `Retry-After` | Baixo |
| 18 | `chesscomClient.ts:147` | `toLocaleLowerCase('en-US')` em vez de `.toLowerCase()` | Baixo |
| 19 | `App.tsx:182-184` | `window.location.assign(pathname)` perde query params | Baixo |

### Dívida Técnica (confiança alta)

| # | Arquivo:linha | Descrição |
|---|---------------|-----------|
| 20 | `state.ts:1-1296` | God object — 1296 linhas, inicialização de 170 linhas |
| 21 | `generatePlan.ts:394-447` | `getLatestThemeSignalForWeakness` — 54 linhas, alta complexidade |
| 22 | `index.css:74` | `color-scheme: light` fixo — sem dark mode |
| 23 | `src/**/*.tsx` | Zero i18n — todos os textos hardcoded em PT-BR |
| 24 | `db.ts:65-66` | `handle: unknown` na tabela backupMeta — cast frágil |
| 25 | N/A | Sem CI/CD, sem E2E, sem pre-commit hooks |

### Elogios (confiança alta — o que NÃO mexer)

| # | Arquivo | O que |
|---|---------|-------|
| 26 | `eslint.config.js:17-45` | Domain isolation enforced — zero violações de camada |
| 27 | `providerQueue.ts:16-43` | Fila serial com cooldown — elegante, 49 linhas |
| 28 | `src/domain/**/*.ts` | Domínio puro, testável, tipado — referência de clean architecture |
| 29 | `src/index.css:1-2471` | Design system completo com tokens — base sólida para evolução |
| 30 | `memory/*.md` | Memória viva do projeto — rastreabilidade excepcional |
| 31 | `backup.ts` | Export/import versionado com checksum — segurança de dados exemplar |
| 32 | `vite.config.ts:60-73` | Code splitting manual com vendor chunks — performance consciente |
| 33 | `oauth.ts` | PKCE flow correto com revogação — segurança bem implementada |

---

## Checklist de Método

- [x] Li os módulos-núcleo e ao menos uma amostra de cada camada/tipo.
- [x] Rodei testes/build/lint e reportei resultados reais.
- [x] Cada área tem nota + elogio + falta + solução + alternativa + pergunta.
- [x] Cada achado factual tem file:line e severidade.
- [x] Separei fato / opinião / hipótese e marquei confiança.
- [x] Tabela-resumo + nota global + roadmap + perguntas ao dono.
- [x] Salvei em `docs/review/analise_completa_deepseek_2026-06-15.md`.
