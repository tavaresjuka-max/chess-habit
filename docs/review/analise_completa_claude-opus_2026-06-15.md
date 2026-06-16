# Análise Completa — lichess-tutor / "Rotina" (Claude Opus 4.8, 2026-06-15)

> Revisão 360° honesta. Toda afirmação factual está ancorada em `arquivo:linha`. Onde não foi
> possível verificar, está marcado "não verificado" e rotulado como opinião/hipótese.
> Gates executados de verdade nesta passada (resultados na seção 1).

---

## 0. Sumário executivo

O **lichess-tutor** é uma ferramenta pessoal sólida e madura para o estágio em que está: um PWA
local-first (React 19 + Vite + TypeScript + Dexie, sem backend) que lê o histórico real de
Lichess/Chess.com, detecta fraquezas, gera um plano de estudo sensível ao tempo (5/15/30/60 min) e
acompanha progresso. A **camada de domínio é pura e auditável** (lint proíbe import de React/Dexie em
`src/domain`), a suíte tem **409 testes verdes em 59 arquivos**, e a identidade visual ("Gabinete do
Professor Lemos") é coesa e diferenciada. Os débitos reais são concentrados e na maioria de **baixo
esforço**: ausência total de CI, um hook `useAppState` de 1.296 linhas que concentra IO + negócio +
estado, lacunas pedagógicas na detecção de fraquezas (o diagnóstico de puzzles não alimenta o detector
de fraquezas), código morto pedagógico (`computeMastery`), e — o achado mais incômodo — **usernames
reais do dono hardcoded no bundle de produção**. Nada disso é crítico-de-quebrar; tudo é endereçável.

**Nota global ponderada: 7.0 / 10** — "sólido com débitos claros e dirigíveis". Os pesos (seção 6)
favorecem Domínio, Correção e UX, porque é onde mora o valor de um tutor pessoal para alguém com TDAH;
penalizam menos Acessibilidade/Visual (arte provisória por decisão do dono; usuário único).

| # | Área | Nota | Uma linha |
|---|---|---|---|
| 2 | Correção & Bugs | 6.5 | Falhas silenciosas e escritas não-atômicas; nenhuma quebra de fluxo principal |
| 3 | Qualidade de código | 7.5 | Idiomático, TS estrito, mas `state.ts` é um God-hook e há duplicação de sync |
| 4 | Arquitetura | 7.0 | Camadas limpas (domínio puro), mas orquestração toda em um hook de 1.296 linhas |
| 5 | Domínio / Lógica pedagógica | 6.5 | Fluxo correto, mas detector de fraquezas raso e `computeMastery` é código morto |
| 6 | Dados & Estado | 7.5 | Schema Dexie versionado até v11, export transacional; import valida pouco |
| 7 | Testes & QA | 7.0 | 409 testes de boa qualidade; `state.ts`/UI sem teste direto; sem cobertura medida |
| 8 | Documentação & Memória | 8.0 | Memória viva e coerente; 30 relatórios em `docs/review` sem índice geram ruído |
| 9 | Processo & Tooling | 4.0 | **Sem CI, sem pre-commit, Playwright morto**, pinagem de deps inconsistente |
| 10 | Visual & Design | 8.0 | Identidade forte e consistente; arte SVG provisória mas funcional |
| 11 | UX | 7.5 | Hero "Agora" claro, números visíveis (bom p/ TDAH); onboarding não cobre OAuth |
| 12 | UI | 7.0 | 2 colunas no desktop, empilha no mobile; `window.confirm` sobreviveu em 1 lugar |
| 13 | Conteúdo & Comunicação | 8.0 | Microcopy pt-BR firme, sem promessa de rating; slugs técnicos vazam em 1 tela |
| 14 | Plataforma & Performance | 7.0 | PWA limpa, JS ~165 kB gzip; precache 1.7 MB; sem smoke offline em prod |
| 15 | Acessibilidade & i18n | 6.5 | Bases boas (focus-visible, 44px, aria progressbar); faltam `aria-current` e ajustes |
| 16 | Segurança & Privacidade | 6.5 | PKCE S256 correto; **usernames reais no bundle**; import de backup pouco validado |
| 17 | Build, Release & Operação | 6.0 | manualChunks bom; sem sourcemap, sem versão semântica, deploy manual |

---

## 1. Método — o que li, o que rodei, o que não rodei

**Rodei (resultados reais, nesta passada, Windows + Node):**

- `npm run lint` → **exit 0, limpo** (ESLint 10, typescript-eslint 8.60).
- `npm run test` → **409 passed / 59 files**, 9.77s, exit 0 (Vitest 4.1.8).
- `npm run build` → **exit 0**, 1.09s. Bundle JS (gzip): `index` 65.6 kB, `react-vendor` 57.3 kB,
  `dexie` 31.3 kB, `icons` 6.4 kB, `Config` 4.0 kB, `Progress` 2.6 kB. CSS 36.5 kB (7.9 kB gzip).
  PWA precache: **75 entries / 1.717 MiB** (fontes woff2 + arte dominam).

**Li (em profundidade):** todo `src/app/state.ts`, `generatePlan.ts`, `detectWeaknesses.ts`,
`pendingItems.ts`, `mastery.ts`, `placement.ts`, camada `infra/storage/*`, `infra/lichess/*`,
`infra/chesscom/*`, `infra/http/providerQueue.ts`, `singleFlight.ts`, todo `src/ui/*` incluindo as
2.471 linhas de `index.css`, configs (`vite/vitest/eslint/tsconfig`), `PLANO.md`, `docs/`, `memory/`.
Amostrei testes para julgar qualidade de asserts (comportamento vs implementação).

**Verifiquei à mão dois achados de alto impacto** (não confiei nos subagentes):
`state.ts:1289-1290` (usernames hardcoded — **confirmado**) e `Fold.tsx:29` (`<h2>` em `<summary>` —
confirmado, mas **rebaixado de "Crítico/HTML inválido" para Médio**: o HTML Living Standard permite um
elemento de heading dentro de `<summary>`; o problema real é suporte inconsistente de leitores de tela,
não violação de spec).

**Não rodei:** testes E2E (não existem; Playwright está instalado mas sem config nem specs); smoke de
PWA offline em produção (não existe); medição de cobertura (`@vitest/coverage-v8` não configurado).
**Não verifiquei:** comportamento real em iOS standalone PWA do `window.confirm` (hipótese de
literatura, confiança média); tamanho gzip total incluindo fontes sob demanda (estimativa).

---

## 2. Correção & Bugs — **6.5/10**

Nenhum bug quebra o fluxo principal (a suíte cobre os caminhos felizes e vários de erro), mas há um
padrão recorrente de **falha silenciosa** e **escrita não-atômica** que cobra juros em durabilidade.

**Bom:** resiliência de rede testada de verdade (stream NDJSON com linha quebrada,
`trainingFlow.test.tsx:391`); `singleFlight.ts:9` resolve a race do StrictMode no OAuth; `latestPlanRef`
(`state.ts:372`) evita que sync de fundo sobrescreva aprovação do usuário.

**Faltas / achados:**

- `state.ts:1065` `updateBlockStatusWithTrainingLog` faz `saveTrainingLog` e depois `savePlan` **sem
  transação Dexie**. Crash/fechamento entre as duas escritas deixa log salvo e plano desatualizado.
  — **Alto / M / alta.** Fix: `db.transaction('rw', ...)` envolvendo as duas, ou tornar o status do
  bloco derivável do log na leitura (reconciliação lazy).
- `state.ts:563` `saveProfile` dispara dois syncs em IIFE `void (async () => …)()`; exceção dentro da
  IIFE é silenciada e o estado de erro por fonte pode não atualizar. — **Alto / M / alta.** Fix:
  `Promise.allSettled` com log explícito e `diagnosisState:'error'` por fonte.
- `trainingLogFlow.ts:67` `catch {}` trata erro de rede e token-expirado/resposta-malformada de forma
  idêntica (só um `warning` string). — **Médio / P / alta.** Fix: distinguir `LichessRateLimitError`
  (já feito noutro caminho) e logar o inesperado.
- `detectWeaknesses.ts:110` divisão `blunders/games` sem guarda explícita `games>0` (o filtro
  `games>=5` protege na prática, mas `NaN>threshold` silencia o sinal sem erro). — **Baixo / P / alta.**
- `Today.tsx:721` `playTimerBeep` cria um `AudioContext` novo a cada disparo de timer; vários blocos
  expirando próximos podem esgotar contextos do browser. — **Baixo / P / alta.** Fix: singleton via `useRef`.

**Alternativa pesquisada:** o padrão "estado derivável do log" (event-sourcing leve) é o que apps
local-first como Linear/Actual usam para evitar exatamente a corrupção do par log/plano.

**Pergunta:** aceita que "bloco done com plano não salvo" seja estado recuperável por leitura, ou exige
atomicidade no Dexie? A resposta decide a forma da correção do achado mais sério desta área.

---

## 3. Qualidade de código — **7.5/10**

Idiomático para React 19/TS estrito, convenções consistentes, domínio bem testado. Penaliza:
duplicação estrutural e um hook monolítico.

**Bom:** `generatePlan` é função **pura/determinística** (recebe `date` como string, sem `Date.now()`
interno) → totalmente testável (`generatePlan.ts`); `buildPlanContext` (extração recente) elimina ~60
linhas de montagem de opções repetida; `eslint.config.js:17` codifica a fronteira de camadas como lint.

**Faltas / achados:**

- `state.ts:381` e `:460` — `runChesscomSync` e `runLichessSync` são **90% código duplicado** (mesmo
  detect→replace→save→setWeaknesses→generatePlan→merge). — **Alto / M / alta.** Fix: extrair
  `runDiagnosisSync(source, fetcher, …)`.
- `state.ts` (todo) — `useAppState` tem **1.296 linhas**: persistência, OAuth, sync, plano, conquistas e
  ~20 fatias de estado num único hook; cadeias de `useCallback` recriam handlers e propagam re-render.
  — **Médio / G / alta.** Fix: dividir em `useAppData` (estado/derivados) + `useAppActions` (comandos),
  ou `useReducer`.
- `generatePlan.ts:490` / `trainingLogFlow.ts:231` — detecção de "log de puzzle" por
  `label.includes('Puzzle')` (string matching frágil). — **Médio / P / alta.** Fix: campo estrutural
  `kind: 'puzzle' | 'lesson' | …` no `TrainingLog`.
- `Today.tsx:283` e `:397` — `hasSavedPending` é O(N×M) por render (varre `pendingItems` × `trainingLogs`).
  — **Baixo / P / alta.** Fix: materializar um `Set<string>` antes do render dos blocos.

**Pergunta:** há apetite para a refatoração G do `state.ts` agora, ou ela fica como débito consciente
até a próxima fase de feature?

---

## 4. Arquitetura — **7.0/10**

Direção das dependências correta e **verificada por lint** (zero imports ascendentes de `src/domain`).
O ponto frágil é a concentração de orquestração.

**Bom:** domínio sem efeitos colaterais; `singleFlight`/`providerQueue` isolam concorrência de rede;
`latestPlanRef` é o idioma certo para closures async.

**Faltas / achados:**

- God-hook `state.ts` (ver §3) — é o gargalo arquitetural: cresce a cada feature e dificulta teste direto.
- `Today.tsx:32` importa tipos (`DiagnosisState`, `LichessConnectionState`) de `../app/state` → UI
  acoplada à camada App. — **Médio / P / alta.** Fix: re-exportar de `domain/types` ou `ui/types`.
- `state.ts:199` ordem de boot: auto-backup (escrita ao IndexedDB) **antes** de carregar perfil; se o
  backup rejeitar, há janela de `loadState` preso em `loading`. — **Alto / P / alta.** Fix: mover
  auto-backup para depois da carga, com `try/catch` próprio.

**Alternativa:** Zustand ou `useReducer`+context para separar leitura de comando — padrão dominante em
PWAs local-first dessa escala.

---

## 5. Domínio / Lógica pedagógica — **6.5/10**

O fluxo sinal→fraqueza→plano funciona ponta a ponta e a máquina de estágios de recurso
(explain→guided→retrieval→transfer→review, `generatePlan.ts:363`) é bem modelada e bem testada. Mas há
buracos pedagógicos e código morto.

**Status explícito (verificado):**
- **SM-2 "simplificado" ≠ SM-2 real.** `pendingItems.ts:78` usa tabela fixa `SPACING_DAYS=[1,3,7,14]`
  com deslocamento de índice por feedback (+2/+1/−1). **Está ativo e chamado** via `trainingLogFlow`.
  Funciona, mas não tem ease-factor — chamar de "SM-2" é impreciso. — **Médio (rótulo) / P.**
- **`computeMastery` é código morto.** `mastery.ts:9` é exportada e testada, mas **nenhuma chamada fora
  dos testes**; `masteryTarget` em `PlanBlock` nunca é preenchido com resultado real. — **Alto / M / alta.**
  Fix: ou ligar ao fluxo de conclusão de bloco (accuracy de puzzle reconciliada → advance/review/regress)
  ou remover e documentar como decisão futura.

**Outros achados:**
- `detectWeaknesses.ts:107` — dos 14 `WeaknessTag`, só ~4 são detectáveis por sinais reais; o resto
  entra só por fallback de banda ou sinal `manual`. **O diagnóstico de tema de puzzle
  (`diagnosis.ts:107`) não alimenta `detectWeaknesses`** — são dois caminhos paralelos. — **Alto / G /
  alta.** Fix: mapear `weakThemes` do puzzle dashboard → `WeaknessTag` como sinais `manual` de alta
  confiança.
- `extractSignals.ts:241` (Chess.com) — usa `accuracy < 70` como proxy de "blunder". Pedagogicamente
  incorreto: infla blunder-rate para qualquer iniciante. — **Alto / M / alta.** Fix: campo separado
  `kind:'accuracy'` com limiar por banda, ou remover o proxy.
- `placement.ts:132` — autorrelato pode chegar a `confidence:'high'`, equiparado a calibração real do
  Lichess. — **Médio / P / alta.** Fix: autorrelato no máximo `'medium'`.
- `pendingItems.ts:14` — com feedback `easy` repetido, item gradua em 2 repetições — prematuro p/ 0-800.
  — **Baixo / P / alta.** Fix: exigir ≥3 repetições para graduação.

**Perguntas (produto):** (a) `computeMastery` deve consumir accuracy reconciliada do Lichess apesar da
latência assíncrona? (b) o bloco `final` de 60 min é sempre `endgame-pawn` independente da banda — é
intencional (finais sempre ajudam) ou deve parametrizar por banda?

---

## 6. Dados & Estado — **7.5/10**

**Bom:** schema Dexie versionado até v11 com migrações explícitas; `exportAllAsJson` usa transação `'r'`
multistore (snapshot consistente — raro em SPAs locais); soft-delete preparado para sync futuro; URLs
sempre com `encodeURIComponent` e PGN sanitizado (`games.ts:176`, `study.ts:137`).

**Faltas / achados:**
- `appData.ts:424` — import de backup faz `as ProfileRecord[]` após validação que checa só 2-3 campos
  por tabela. Backup corrompido/adulterado é gravado inteiro. — **Alto / M / alta.** Fix: validação de
  PK obrigatória por tabela ou parse estrito (valibot/zod).
- `games.ts:85` — `fetchLichessGames` sem `max` (decisão do dono) carrega histórico inteiro em
  `response.text()`; contas grandes → risco de OOM no mobile. — **Médio / M / alta.** Fix: stream NDJSON
  incremental ou limite soft configurável.
- `appData.ts:390` — `backupMeta` não é restaurado no import: após restaurar, a UI diz "Nenhum backup
  exportado ainda". — **Baixo / P / alta.** Fix: gravar `backupMeta` sintético do arquivo importado.

---

## 7. Testes & QA — **7.0/10**

409 testes de **qualidade real** (testam comportamento, não implementação): adulteração de backup com
checksum (`appData.test.ts:416`), soft-delete verificado direto no Dexie (`:185`), `it.each`
parametrizado de feedback→URL (`trainingFlow.test.tsx:197`).

**Faltas / achados:**
- `vitest.config.ts` — sem `environment` global; cada arquivo JSX precisa de `// @vitest-environment
  jsdom` manual; novo arquivo que esquecer roda em `node` e pode passar falsamente. — **Alto / P / alta.**
  Fix: `test:{ environment:'jsdom' }`.
- `state.ts` (1.296 linhas) **sem teste direto** — coberto só indiretamente. — **Alto / G / alta.**
  Fix: extrair funções puras (como já foi feito com `achievementsSync`/`buildPlanContext`).
- `playwright ^1.60.0` em `package.json` **sem config nem specs** — dep morta (~150 MB). — **Médio / P /
  alta.** Fix: remover agora ou criar `playwright.config.ts` + smoke real.
- Sem `@vitest/coverage-v8` → nunca há % de cobertura. — **Médio / P.**
- `preserveProgress.test.tsx:11` precisa de `vi.stubGlobal('fetch')` para não ficar flaky → indica
  efeito de auto-sync observável em teste. — **Baixo / M / alta.** Fix: injetar `fetcher` em vez de stub global.

---

## 8. Documentação & Memória — **8.0/10**

**Bom:** `memory/decisions.md` é autoridade viva (o-quê/por-quê/quando); `AGENTS.md`+`PLANO.md` formam
moldura coerente "pessoal antes, comunidade depois"; `docs/research/` tem evidência acadêmica real, não
vaporware.

**Faltas / achados:**
- `docs/review/` tem **~30 relatórios sem índice** (Claude/Codex/Antigravity/Gemini) — ruído para
  onboarding. — **Médio / M / alta.** Fix: `docs/review/README.md` com "ativo / histórico / leitura p/
  novato".
- Sem **matriz de dependência** entre as 4 decisões vigentes em paralelo (local-first / OAuth opt-in /
  P4-P5 congeladas / clean-room). — **Alto / M / alta.** Fix: `memory/4-decisoes-vigentes.md`.
- `memory/state.md:3` data "2026-06-13" stale (commits até 06-15). — **Baixo / P / alta.**
- ADRs param em 2026-06-06 enquanto `decisions.md` continua: política de granularidade indefinida. — **Médio / M.**

---

## 9. Processo & Tooling — **4.0/10** (a nota mais baixa)

Funciona por disciplina manual; o risco cresce a cada commit autônomo de agente.

- **Sem CI** (`.github/workflows` não existe) — qualquer push pode quebrar build/test/lint sem aviso.
  — **Alto / M / alta.** Fix: Action mínima `npm ci && npm run build && npm test && npm run lint`.
- **Sem pre-commit hook** (só `.sample` em `.git/hooks`). — **Médio / P / alta.** Fix: husky + lint-staged.
- **Pinagem inconsistente**: `dexie`/`react`/`vite` pinados, mas `lucide-react ^1.17`, `sonner ^2`,
  `playwright ^1.60` com `^`. — **Médio / P / alta.** Fix: pinar deps de produção; sempre `npm ci`.

**Nota de peso:** é um app solo, então o impacto operacional é menor que o número sugere — por isso o
peso desta área é reduzido na nota global. Mas das 17 áreas, é a de **maior ROI**: um CI de ~30 min de
setup elimina toda uma classe de regressão.

---

## 10. Visual & Design — **8.0/10**

Identidade "Gabinete do Professor Lemos" consistente (mesa, textura, Fraunces nos títulos / Inter no
corpo); `ConceptSeal` como linguagem de seção; poses contextuais do Lemos (`TutorCard.tsx:24`) reagem ao
estado do aluno — diferencial real. SVGs marcados `artReady` mas provisórios por decisão do dono (arte
premium gerada virá pós-testes). Sem achados de severidade alta aqui.

---

## 11. UX — **7.5/10**

Hero "Agora" no topo, funil de 3 passos, streak e números visíveis — bom encaixe com TDAH (metas
pequenas, números à vista). `Fold.tsx:16` preserva estado aberto/fechado contra o tick do timer.

**Faltas:**
- `Onboarding.tsx` não menciona/linka o **OAuth do Lichess**: o usuário digita o username mas só
  descobre que precisa autorizar quando "Criar Study" falha. — **Médio / P / alta.** Fix: hint no passo 2.
- Mobile: a acumulação `section-heading + day-progress + day-stats + nav` empurra a hero para ~180px;
  em 320px com quebra de linha pode comprometer. Quando `!planApproved`, a proposal card adiciona ~400px
  acima das dobras. — **Alto / M / média.** Fix: colapsar `section-heading` no mobile.
- `Today.tsx:479` — no mobile, "Sincronizar e estudar" (ação pós-treino, às vezes a mais urgente) fica
  no fim do aside, sem âncora. — **Médio / M / alta.**

---

## 12. UI — **7.0/10**

2 colunas no desktop, empilha < 560px, botões full-width no mobile (decisão certa p/ TDAH).

- `Config.tsx:95` — **`window.confirm` sobreviveu no "Restaurar backup"**, inconsistente com o
  `confirmingClear` inline já feito no mesmo arquivo (Corte I); bloqueante e potencialmente suprimido em
  PWA standalone. — **Alto / P / alta.** Fix: replicar o padrão inline.
- `PlanBlockCard.tsx:181` — label "Abrir no Lichess" fixo mesmo quando o destino não é Lichess. — **Médio / P / média.**
- `Today.tsx:587` — loading "Lichess..." inconsistente com "Atualizando..." do Chess.com. — **Médio / P / alta.**

---

## 13. Conteúdo & Comunicação — **8.0/10**

Microcopy pt-BR firme, tom de professor sem pressão, **nenhuma promessa de rating** (regra de produto
respeitada). Único furo: `Progress.tsx:236` exibe `weakness.tag` em slug técnico inglês
(`hanging-piece`, `back-rank`) — `formatWeaknessTag` existe em `Today.tsx:745` mas não é reutilizada.
— **Médio / P / alta.** Fix: extrair `formatWeaknessTag` para módulo compartilhado.

---

## 14. Plataforma & Performance — **7.0/10**

PWA `generateSW` com `registerType:'prompt'` (correto); JS ~**165 kB gzip** total bem dividido
(`react-vendor`/`dexie`/`index`/`icons` via manualChunks). Precache **1.7 MB** (75 entries) dominado por
fontes woff2 e arte.

- Sem **smoke de offline em produção** (está no backlog da memória, nunca feito). — **Médio / M / alta.**
  Fix: `scripts/smoke-pwa.ts` (build→preview→offline→verifica UI).
- Sem **orçamento de bundle** automatizado (baseline 527→234 kB só no git log). — **Médio / M.** Fix:
  check de tamanho gzip com threshold no build.
- `providerQueue` é por-tab; cooldown 429 não é cross-tab. — **Baixo / M / média.** Fix: `navigator.locks`/`BroadcastChannel`.

---

## 15. Acessibilidade & i18n — **6.5/10**

**Bom:** `:focus-visible` global (`index.css:362`), 44px no mobile (`:2391`), progressbar com ARIA
completo (`Today.tsx:231`), `prefers-reduced-motion` universal (`:2007`), `ViewFallback` com `aria-live`
correto (`App.tsx:25`).

**Faltas:**
- `App.tsx:143/151/159` — nav-buttons sem `aria-current="page"`: leitor de tela não anuncia a aba ativa.
  — **Médio / P / alta.**
- `Fold.tsx:29` — `<h2>` em `<summary>`: **permitido pela spec**, mas exposição de heading é inconsistente
  entre leitores de tela. — **Médio / P / média.** Fix: `role="heading" aria-level="2"` num `<span>`, ou validar AT.
- `PlacementCard` radios com alvo ~24px (escapam da regra 44px). — **Alto / P / alta.** Fix:
  `label.radio-option { min-height:44px }` no mobile.
- i18n: tudo hardcoded em pt-BR (aceitável p/ ferramenta pessoal; sem política definida p/ comunidade).

---

## 16. Segurança & Privacidade — **6.5/10**

**Bom (verificado):** PKCE **S256** correto (`oauth.ts:25`): `crypto.getRandomValues` p/ state+verifier,
`crypto.subtle.digest('SHA-256')`, escopos restritos a `puzzle:read`/`study:write`, **nenhum secret
hardcoded**, `stripOAuthQuery` limpa a URL. `codeVerifier` em `sessionStorage` (não `localStorage`),
destruído no callback.

**Faltas / achados:**
- **`state.ts:1289-1290` — usernames reais do dono (`'jukasparov'`, `'jukatavares'`) hardcoded em
  `createDefaultProfile` e enviados no bundle de produção** (confirmado em `dist/`). Um novo usuário que
  salve sem preencher dispara sync dos dados do dono; e é PII no artefato público. — **Alto / P / alta.**
  Fix: trocar por `''`/`undefined`; esses nomes só em `*.test.*`.
- `appData.ts:424` — import de backup pouco validado (ver §6): superfície de corrupção. — **Alto / M.**
- Token OAuth em IndexedDB sem criptografia em repouso (aceitável para PWA local-first, mas é superfície;
  sem refresh → conexão expira em silêncio após ~1 ano). — **Baixo / G / média.**

---

## 17. Build, Release & Operação — **6.0/10**

manualChunks bom; `pwaConfig.test.ts` valida a config estática. Faltas: sem `build.sourcemap` (erros de
prod sem stack rastreável, agravado pelo SW) — **Médio / P / alta**; `version:"0.0.0"` sem versionamento
semântico, sem `__APP_VERSION__` para correlacionar bug↔versão — **Baixo / P / alta**; deploy manual via
export de 779 MB (constraint de ambiente conhecido, ver memória).

---

## Riscos / Quick wins / Dívida / Roadmap

### Top 5 riscos (Crítico/Alto)
1. **Usernames reais no bundle** (`state.ts:1289`) — vazamento de PII + sync acidental de terceiros. Mitigação: trocar por vazio (P).
2. **Escrita não-atômica log↔plano** (`state.ts:1065`) — corrupção de estado em crash. Mitigação: transação Dexie (M).
3. **Sem CI** — regressão silenciosa a cada commit. Mitigação: Action de gate (M).
4. **Import de backup pouco validado** (`appData.ts:424`) — corrupção via arquivo malformado. Mitigação: parse estrito (M).
5. **Diagnóstico de puzzle não alimenta detector de fraquezas** (`detectWeaknesses.ts:107`) — o tutor "vê" menos do que poderia. Mitigação: ponte de sinais (G).

### Top 10 quick wins (alto impacto / baixo esforço — todos P, exceto onde indicado)
1. Trocar usernames hardcoded por vazio (`state.ts:1289`).
2. `environment:'jsdom'` global no vitest (`vitest.config.ts`).
3. Remover `playwright` morto do `package.json` (ou adicionar config).
4. `aria-current="page"` nos nav-buttons (`App.tsx`).
5. `window.confirm` → confirmação inline no restore (`Config.tsx:95`).
6. Reutilizar `formatWeaknessTag` no Progress (`Progress.tsx:236`).
7. 44px nos radios do PlacementCard (CSS mobile).
8. `build.sourcemap:true` (`vite.config.ts`).
9. Unificar microcopy de loading "Atualizando Lichess…" (`Today.tsx:587`).
10. `AudioContext` singleton no timer beep (`Today.tsx:721`).

### Dívida técnica priorizada (paga juros agora)
- `state.ts` God-hook (1.296 linhas) — bloqueia testabilidade e amplia raio de regressão. **Dividir (G).**
- Duplicação `runChesscomSync`/`runLichessSync` — toda correção precisa ser feita em dois lugares. **Extrair (M).**
- `computeMastery` morto — ou liga ou remove; manter testes "no vácuo" engana a cobertura. **(M).**

### Roadmap sugerido até o próximo marco (release pessoal estável)
1. **Corte de higiene/segurança (1 dia):** quick wins 1-10 + CI mínimo + pre-commit. Gate verde de novo.
2. **Corte de durabilidade (1-2 dias):** transação atômica log↔plano; validação estrita de import; boot de auto-backup pós-perfil.
3. **Corte pedagógico (2-3 dias, requer decisão de produto):** ponte puzzle→fraqueza; ligar `computeMastery`; corrigir proxy de accuracy Chess.com; calibrar limiares de banda 800-1200.
4. **Corte de refatoração (quando houver fôlego):** dividir `state.ts`; smoke PWA offline; orçamento de bundle.

### O que NÃO fazer (YAGNI / não sobre-engenharar)
- **Não** implementar SM-2 completo com ease-factor agora — o sistema de 4 níveis é suficiente para 0-1200; só renomeie o comentário.
- **Não** descongelar P4 (sync/D1) nem P5 (comunidade) — decisão do dono de 2026-06-06 ainda vale.
- **Não** adicionar i18n/l10n — é ferramenta pessoal pt-BR; vira escopo de P5.
- **Não** criptografar token OAuth em repouso — custo/benefício ruim num app local-first de usuário único.
- **Não** perseguir 100% de cobertura — os 409 testes comportamentais valem mais que % cego; mire `state.ts` extraído.

---

## Perguntas abertas ao dono do produto

1. **"Pronto" para o release pessoal:** é gates verdes + os Cortes de higiene/durabilidade, ou inclui o Corte pedagógico (ponte puzzle→fraqueza)?
2. **Quick Start com `jukasparov`/`jukatavares`:** o onboarding é só seu ou outros vão usar? Se outros, isso vaza seus dados como ponto de partida — confirma a troca por vazio?
3. **Atomicidade vs reconciliação:** prefere transação Dexie (garante) ou estado derivável do log (recupera)? Decide a forma da correção #2.
4. **`computeMastery`:** liga ao fluxo de conclusão (apesar da latência da accuracy reconciliada) ou remove e documenta como futuro?
5. **Bloco `final` de 60 min sempre `endgame-pawn`:** intencional (finais sempre ajudam) ou parametrizar por banda?
6. **CI + deploy:** topa um GitHub Action de gate agora, mesmo mantendo o deploy manual via prebuilt no Vercel?

---

## Apêndice — achados por `file:line` (severidade · esforço · confiança)

| Área | file:line | Severidade | Esf. | Conf. |
|---|---|---|---|---|
| Segurança | `src/app/state.ts:1289` | Alto | P | alta |
| Correção | `src/app/state.ts:1065` | Alto | M | alta |
| Correção | `src/app/state.ts:563` | Alto | M | alta |
| Arquitetura | `src/app/state.ts:199` | Alto | P | alta |
| Qualidade | `src/app/state.ts:381`/`:460` | Alto | M | alta |
| Qualidade | `src/app/state.ts` (1.296 ln) | Médio | G | alta |
| Domínio | `src/domain/method/mastery.ts:9` (morto) | Alto | M | alta |
| Domínio | `src/domain/weakness/detectWeaknesses.ts:107` | Alto | G | alta |
| Domínio | `src/infra/chesscom/extractSignals.ts:241` | Alto | M | alta |
| Domínio | `src/domain/placement/placement.ts:132` | Médio | P | alta |
| Domínio | `src/domain/method/pendingItems.ts:14` (rótulo SM-2 + graduação) | Médio | P | alta |
| Dados | `src/infra/storage/appData.ts:424` | Alto | M | alta |
| Dados | `src/infra/lichess/games.ts:85` (OOM) | Médio | M | alta |
| Dados | `src/infra/storage/appData.ts:390` (backupMeta) | Baixo | P | alta |
| Testes | `vitest.config.ts` (sem env global) | Alto | P | alta |
| Testes | `package.json` (playwright morto) | Médio | P | alta |
| Processo | `.github/workflows` ausente (CI) | Alto | M | alta |
| Processo | pre-commit ausente | Médio | P | alta |
| Processo | pinagem `^` inconsistente (`package.json`) | Médio | P | alta |
| UI | `src/ui/Config.tsx:95` (window.confirm) | Alto | P | alta |
| UX | `src/ui/Onboarding.tsx` (sem OAuth) | Médio | P | alta |
| UX | mobile hero/proposal acima da dobra (`Today.tsx`) | Alto | M | média |
| A11y | nav sem `aria-current` (`App.tsx:143`) | Médio | P | alta |
| A11y | radios < 44px (`PlacementCard`/CSS) | Alto | P | alta |
| A11y | `<h2>` em `<summary>` (`Fold.tsx:29`) | Médio | P | média |
| Conteúdo | slug técnico (`Progress.tsx:236`) | Médio | P | alta |
| Build | sem sourcemap (`vite.config.ts`) | Médio | P | alta |
| Plataforma | sem smoke offline em prod | Médio | M | alta |
| Doc | `docs/review/` sem índice (30 arq.) | Médio | M | alta |
| Doc | sem matriz das 4 decisões | Alto | M | alta |

**Notas de honestidade:** "UX mobile acima da dobra" e "window.confirm em iOS PWA" têm confiança
**média** (análise estrutural/literatura, não medição em dispositivo). O rebaixamento do `Fold.tsx:29`
de Crítico→Médio foi uma **correção minha sobre o subagente** após checar a spec do HTML. Pesos da nota
global na seção 6 do prompt — justificados em §0. Tudo o mais com confiança **alta** foi lido no código.
