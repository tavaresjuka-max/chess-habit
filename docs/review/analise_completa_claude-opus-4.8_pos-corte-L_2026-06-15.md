# Análise Completa — lichess-tutor / "Rotina" (Claude Opus 4.8, 2026-06-15, pós-Corte L)

> Auditoria 360° honesta contra o **código real do HEAD atual** — depois dos cortes J1–J4 (higiene,
> CI, durabilidade, pedagogia) e da refatoração **Corte L** (quebra do God-hook `state.ts`). **Rodei os
> gates** (test, lint, typecheck, build, coverage) e li o código. Onde a auditoria consolidada de hoje
> de manhã apontava um problema, marquei **FIXED / OPEN / PARCIAL** com prova `arquivo:linha`. Relatório
> que contradiz o código perde. Não é elogio por educação; é a régua aplicada nos dois sentidos.
>
> **Diferença para a `consolidacao_analise_2026-06-15.md`:** aquela julgou 4 IAs contra um HEAD anterior.
> Esta audita o HEAD de agora (state.ts 440 ln, CI presente, sourcemaps, e2e smoke) e mede o que o
> trabalho do dia **realmente** consertou e o que sobrou. Método: gates + 5 subagentes de verificação por
> área + verificação manual dos achados-âncora (Opus como diretor).

---

## 0. Sumário executivo

O app está **sólido e entregável para uso pessoal** e **mediu progresso real** desde a auditoria da manhã:
o God-hook foi quebrado (`state.ts` 1296→440 ln), o **CI existe** (`.github/workflows/ci.yml`), os
usernames hardcoded sumiram do bundle, sourcemaps e code-splitting estão ligados, `aria-current` e alvos
de toque foram corrigidos, há **e2e smoke de PWA offline** e **82,99% de cobertura** medida. Dos ~22
achados confirmados da consolidação, **~11 estão FIXED, ~6 PARCIAIS e ~5 ainda OPEN**.

Em troca, a auditoria fresca encontrou **achados novos** que o estado anterior escondia: (1) o `observedAt`
do Chess.com é carimbado com a data do import, **anulando o filtro de frescor de 90 dias** — bug
pedagógico real; (2) `openExternalUrl` abre qualquer URL sem allowlist (vetor via backup importado);
(3) `useAppData` chama `generatePlan` **sem `diplomaAttempts`** no boot (trilha de diploma ignorada no
primeiro load); (4) `ui/Config.tsx` importa direto de `infra/` (única quebra de camada); (5) um teste é
**frágil a timing** (`trainingFlow.test.tsx:65`) — falha sob contenção de CPU, passa isolado.

**Gates (rodados nesta sessão, 2026-06-15):**

| Gate | Comando | Resultado |
|---|---|---|
| Testes | `npm run test` | **524 ✓ / 525**, 1 *flaky* (timing) — passa 22/22 isolado |
| Lint | `npm run lint` | **limpo**, exit 0 |
| Typecheck | `tsc -b` | **exit 0** |
| Build | `npm run build` | **exit 0**, sourcemaps + code-split, ~156 kB gzip no caminho principal |
| Coverage | `npm run coverage` | **82,99% stmts / 76,18% branch / 89,29% funcs** (baseline, sem threshold) |

**Nota global do diretor: 7,6 / 10** — "sólido, em trajetória de melhora, com débitos concentrados em
pedagogia adaptativa e endurecimento de borda". É acima dos 7,2 da consolidação porque o trabalho do dia
fechou achados caros (CI, refatoração, leak de PII, a11y), e abaixo de 8 porque a fresca expôs furos no
"cérebro" adaptativo e na fronteira de segurança. Não é média (média seria ~7,2): ponderei por impacto
para um app pessoal local-first (Domínio/Correção/Dados pesam mais que Processo/i18n).

**Tabela-resumo de notas (diretor):**

| Área | Nota | Δ vs consolidação | Uma linha |
|---|:--:|:--:|---|
| Correção & Bugs | 7,0 | = | Suíte verde (1 flaky); bugs reais agora são `observedAt`/freshness e `diplomaAttempts` no boot |
| Qualidade de código | 7,5 | = | Split de hooks limpo; `[input]` quebra memo, `isPuzzleTrainingLog` casa por string |
| Arquitetura | 7,5 | = | Domínio puro exemplar; única quebra: `ui/Config.tsx → infra/` |
| Domínio / Pedagogia | 6,5 | = | Engine funciona; loop adaptativo com furos (final hardcoded, freshness, puzzle→fraqueza não-persistido) |
| Dados & Estado | 7,5 | = | Log↔plano atômico ✓; falta atomicidade em `saveProfile`/reconcile, validação de shape rasa |
| Testes & QA | 7,5 | = | 524 testes + 83% cobertura + e2e smoke real; hooks sem teste direto, 1 flaky |
| Documentação & Memória | 7,5 | = | Índice de review criado ✓; drift em `privacy-and-data.md`, sem README raiz |
| Processo & Tooling | 6,5 | ▲ +1,5 | **CI existe** ✓; falta pre-commit, `output/playwright/` fora do gitignore |
| Visual & Design | 8,0 | = | Identidade coesa; arte SVG provisória por decisão do dono |
| UX | 7,5 | = | Hero action-first + números visíveis (bom p/ TDAH); sem focus-mgmt no lazy load, "Pular" sem undo |
| UI | 7,5 | ▲ | `window.confirm` removido ✓; falta busy-state em botões async, `h2` dentro de `<summary>` |
| Conteúdo & Comunicação | 7,5 | = | pt-BR firme; escopos OAuth e "atividade livre"/"sinais manuais" sem explicação |
| Plataforma & Performance | 7,5 | = | PWA limpa, code-split, ~156 kB gzip, smoke offline; sem versão semântica |
| Acessibilidade & i18n | 7,0 | ▲ | `aria-current`/alvos 44px ✓, dark+reduced-motion ✓; `h2`-in-`summary` recorrente |
| Segurança & Privacidade | 6,5 | = | Leak de PII **FIXED** ✓, PKCE S256 ✓, token no Dexie ✓; faltam headers HTTP + allowlist |
| Build, Release & Operação | 6,5 | ▲ | sourcemaps + CI ✓; sem `__APP_VERSION__`, smoke fora do CI, versão 0.0.0 |

---

## 1. Método — o que li, o que rodei, o que não rodei

- **Rodei** (exit codes reais acima): `npm run test`, `npm run lint`, `tsc -b`, `npm run build`,
  `npm run coverage`. Re-rodei `trainingFlow.test.tsx` **isolado** para classificar o flaky (passa 22/22
  em 4,2 s; falhou só sob contenção de CPU com lint+build concorrentes).
- **Li** a `consolidacao_analise_2026-06-15.md` inteira (o pacote de decisão anterior) e usei sua matriz
  de 22 achados como checklist de regressão FIXED/OPEN.
- **Verifiquei por subagente** (5 agentes Sonnet, em paralelo, cada um ancorando em `file:line`):
  Segurança+Dados; Domínio/Pedagogia; UI/UX/A11y/Conteúdo; Qualidade+Arquitetura;
  Testes+Docs+Processo+Build. Mapa: `domain/` (lógica pura), `infra/` (storage Dexie + clients HTTP),
  `app/` (hooks/estado), `ui/` (React).
- **Verifiquei à mão** os achados-âncora de maior severidade: `externalOpen.ts` (allowlist),
  `useAppData.ts:184` (`diplomaAttempts`), `createDefaultProfile` (leak), coverage de `state.ts`.
- **Não rodei**: o app num device físico (achados de "abaixo da dobra no mobile" ficam **confiança
  média**, análise estrutural); não rodei `smoke:pwa` (o build de produção já passou; o spec existe e é
  real). Não auditei a arte SVG (provisória por decisão do dono — fora de régua).
- **Confiança**: tudo marcado "CONFIRMADO/FIXED/OPEN" foi lido no código nesta sessão. Itens de viewport
  e de comportamento assíncrono de runtime ficam "média".

---

## 2. Correção & Bugs — **7,0**

**Bom:** suíte verde de fato (524/525; o "1 fail" é flaky de timing, não feature quebrada — verifiquei
isolado). Typecheck e lint limpos. TS estrito + domínio puro pegam classes inteiras de bug em compilação.
Casos degenerados (atividade vazia, all-wins, zero jogos) são tratados com fallback de 3 níveis
(`generatePlan.ts:532-571`), sem caminho de crash.

**Falta / fraco:**
- **[Alto × P]** `useAppData` gera o plano de boot **sem `diplomaAttempts`** — `useAppData.ts:184` e `:191`
  passam `previousPlan/recentThemeStats/openedBlockIds/openPendingItems/weakThemesFromDashboard` mas
  **não** `diplomaAttempts`, enquanto todos os outros callsites usam `buildPlanContext` (que os inclui).
  Efeito: no primeiro load, `selectMethodTrack` não enxerga diploma recém-ganho até o próximo sync
  regenerar o plano. *Verifiquei à mão.* Fix: trocar as duas chamadas por `buildPlanContext({...,
  diplomaAttempts: storedDiplomaAttempts})`. Confiança: alta.
- **[Alto × M]** Chess.com carimba `observedAt = new Date().toISOString()` no import
  (`chesscomClient.ts:45`), então jogos de 2 anos atrás viram "sinal recente" e o filtro de 90 dias
  (`detectWeaknesses.ts:39`) nunca os poda. `filterRecentArchives` existe (`:74`) mas só é chamado em
  teste. Fix: propagar a data real da partida para `observedAt`. Confiança: alta.
- **[Médio × P]** Teste frágil a timing — `trainingFlow.test.tsx:65` usa `waitFor` sem timeout sobre
  `getByText(/Treinando há/i)`; falha sob contenção. Fix: `findByText(/Treinando há/i, {}, {timeout:5000})`
  ou `vi.useFakeTimers()`.
- **[Médio × P]** `void` IIFE no auto-sync (`state.ts:233-250`) — agora cada fonte tem `try/catch` com
  `setErrorMessage` (parcialmente corrigido), mas rejeição fora dos try/catch ainda escapa. Fix:
  `Promise.allSettled` com log por fonte.

**Alternativa pesquisada:** para o flaky, Testing Library recomenda `findBy*` (polling com timeout
explícito) sobre `waitFor(expect)` — elimina a corrida sem inflar timeout global.

**Perguntas:** o boot sem `diplomaAttempts` já causou plano "errado" observável, ou só teórico? Vale um
teste de regressão que prove `diplomaAttempts` no primeiro load?

---

## 3. Qualidade de código — **7,5**

**Bom:** o **Corte L** entregou um split coeso por domínio (treino/diagnóstico/estudo/plano/backup/oauth/
pending), cada hook comentado; `runDiagnosisSync` unificou a duplicação `runChesscomSync`/`runLichessSync`
(`useDiagnosisActions.ts:88-148`); `buildPlanContext` matou 12 montagens duplicadas de
`GeneratePlanOptions` (`stateHelpers.ts:38-53`); `assertNever` nos dois switches mais importantes do
domínio.

**Falta / fraco:**
- **[Médio × P]** Anti-padrão `[input]` em dep arrays de `useDiagnosisActions`, `usePendingActions`,
  `useBackupActions` (ex.: `useDiagnosisActions.ts:148`). O objeto `input` é recriado a cada render →
  invalida todo `useCallback` → memoização inútil. Fix: desestruturar `input` no topo (como
  `useTrainingActions` já faz, `:47-62`) e listar valores individuais.
- **[Médio × M]** `isPuzzleTrainingLog` identifica log de puzzle por **match de string** em
  `destinationLabel` (`trainingLogFlow.ts:230-235`) — qualquer rename pt-BR quebra a reconciliação em
  silêncio (a 3ª cláusula `'Pendência Lichess:'` foi remendo). Fix: discriminante estrutural
  (`logKind`/`source`+`blockId`).
- **[Baixo × P]** `getQualityRank`/`getKindRank` (`resourceCatalog.ts:981-1009`) são switches exaustivos
  **sem** `assertNever` — caem fora do switch se um variant novo surgir. Fix: `default: return
  assertNever(x)`.
- **[Baixo × P]** `saveProfile` (51 ln inline em `useAppState`, `state.ts:200-251`) é a última ação não
  extraída; magic number `AUTO_SYNC_FRESHNESS_MS` mora no orquestrador, longe da lógica que o usa.

**Alternativa:** o threading de setters (até 20 por hook) é sintoma do modelo "todo estado em `useAppData`
+ `useState`". `useReducer` com `dispatch` único, ou Context, eliminaria o threading — porém é refator de
fôlego; **YAGNI** para uso pessoal hoje.

**Perguntas:** vale padronizar dep-arrays agora (lint rule `react-hooks/exhaustive-deps`) ou deixar para
quando entrar perf real?

---

## 4. Arquitetura — **7,5**

**Bom:** **pureza de domínio exemplar** — grep não acha `react`, `dexie` nem `infra/` em `src/domain/`.
Topologia de camadas correta; hooks não se importam entre si (sem ciclo). `latestPlanRef` evita
stale-closure em sync de fundo. `isMounted` guard no boot (`useAppData.ts:92-136`).

**Falta / fraco:**
- **[Alto × M]** **Única quebra de camada confirmada:** `ui/Config.tsx` importa direto de `infra/storage/`
  4 vezes (`Config.tsx:5,7,11,12`) — incluindo o tipo Dexie `BackupMetaRecord` e funções de string
  (`describeAutoBackupStatus`, `describePersistenceStatus`). UI não deveria conhecer storage. Fix:
  reexportar via `app/` (um `app/backupStatus.ts`) ou mover os `describe*` para `ui/`.
- **[Médio × M]** `useAppData` (289 ln) faz **dado + lógica de negócio** (gera/normaliza plano, computa
  return-session) num único `useEffect` de 145 ln; um `catch` único colapsa a granularidade de erro. Fix:
  separar load-de-dados de inicialização-de-negócio.
- **[Médio × M]** Threading de 13–20 setters por hook (`state.ts:174-354`) — funciona, mas frágil a
  escala.

**Perguntas:** o teto de complexidade do `useAppData` é aceitável para o marco pessoal, ou já vale o
`useReducer`?

---

## 5. Domínio / Pedagogia — **6,5** (a área de maior ROI)

**Bom:** thresholds de blunder/accuracy **por banda** (`detectWeaknesses.ts:7-15`); decaimento de 90 dias
de sinais; spacing de pending items com **override de mastery** por accuracy real do Lichess
(`pendingItems.ts:91-117` + `useTrainingActions.ts:138-158`); fallback de 3 níveis garante plano nunca
vazio. `weaknessTagFromPuzzleTheme` mapeia 18 temas Lichess.

**Falta / fraco (o "cérebro" adaptativo tem furos reais):**
- **[Alto × M]** `observedAt` do Chess.com = data do import → frescor de 90 dias **não funciona** para
  histórico longo (ver §2). É o achado pedagógico mais importante.
- **[Alto × P]** Bloco `final` de 60 min **sempre** `endgame-pawn` (`generatePlan.ts:339-346`),
  independente de banda ou fraqueza detectada. Fix: `finalThemeByBand` análogo a `primaryThemeByBand`.
- **[Médio × M]** Puzzle→fraqueza é **inferência episódica, não persistida**: perdas de puzzle viram
  fallback em `selectPrimaryWeakness` (`generatePlan.ts:547-561`) com `score:0, confidence:'low'`, mas
  **nunca** geram um `Weakness` durável via `detectWeaknesses`. Some entre regenerações sem jogo. Fix:
  `createWeaknessFromPuzzleStats` como sinal de 1ª classe.
- **[Médio × M]** Proxy Chess.com `accuracy < 70` ainda **hardcoded** (`extractSignals.ts:180`) — não
  calibrado por banda (embora o sinal agora seja `kind:'accuracy'` com `confidence:'low'`, não mais
  rotulado "blunder" — melhoria parcial). Fix: limiar por banda (65 p/ iniciante, 70 p/ resto).
- **[Médio × P]** Loop só **parcialmente fechado**: conclusão de bloco *regular* (não-pending) não
  atualiza mastery nem spacing. Sinais de métrica (`buildEfficacyBaseline`, `buildSkillMap`,
  `buildTrackEffort`) são computados mas **só alimentam UI**, nunca o planejamento.
- **[Baixo × P]** Placement: `'nunca-joguei'` + táticas/finais máximos cai em `800-1000`
  (`placement.ts:52-72`). Fix: `experience==='nunca-joguei' ⇒ band='0-400'`.

**Trace do loop adaptativo (entregável-chave):** sinais de jogo (judgment/accuracy/opening/clock/color) →
`detectWeaknesses` → `generatePlan`/`selectMethodTrack` = **VIVO**. Feedback (conclusão→mastery→spacing) =
**vivo só para pending items**. Puzzle stats → seleção de fraqueza = **vivo só como fallback**.
`rating`/efficacy/digest/track-effort = **computados, não consumidos** no planejamento.

**Alternativa pesquisada:** o sistema de 4 slots (`SPACING_DAYS=[1,3,7,14]`) é suficiente para 0–1200 —
**não** migrar para SM-2 com ease-factor (YAGNI); a melhoria de maior valor é fechar puzzle→fraqueza e
corrigir o `observedAt`.

**Perguntas (pacote do dono):** (a) puzzle→fraqueza durável: autorizo? (maior ganho pedagógico); (b)
`accuracy<70`: remover ou recalibrar por banda? (c) bloco `final` por banda ou sempre peão? (d) métricas
de eficácia devem realimentar o plano ou ficam só display?

---

## 6. Dados & Estado — **7,5**

**Bom:** `saveTrainingLogAndPlan` **transacional** (`appData.ts:80-85`, usado em `useTrainingActions`) —
fecha o risco mais crítico (log+bloco commitam juntos); export com **snapshot transacional de leitura** +
**checksum SHA-256** verificado no import; import **atômico** (`clear`+`bulkPut` em 12 tabelas, tudo-ou-
nada); migrations versionadas v1→v11 com `upgrade()` callbacks.

**Falta / fraco:**
- **[Alto × P]** `saveProfile` faz `saveStoredProfile` + `savePlan` **sem transação** (`state.ts:211-212`)
  — janela de perfil-novo/plano-velho. Fix: `saveProfileAndPlan` transacional.
- **[Alto × P]** `reconcileLichessResults` salva logs em **loop sem transação** + `savePlan`
  (`useStudyActions.ts:84-86`). Fix: `bulkPut` em transação única.
- **[Médio × P]** Validação de import rasa para `pendingItems`/`methodTracks`/`diplomaAttempts` (só
  `isValidId`, `backup.ts:172-188`) — campos obrigatórios não checados. Fix: validar `status`/`weaknessTag`.
- **[Médio × P]** Cache `chesscomMonthSignals` pode sobreviver a um restore e mascarar refetch
  (`appData.ts`). Fix: limpar dentro da transação de import.
- **[Baixo × P]** `loadLichessOAuthToken` valida só `expiresAt`, não `scopes` (`appData.ts:188`) — erro de
  escopo só estoura na API. Fix: comparar `token.scopes` com os permitidos no load.

**Perguntas:** atomicidade de `saveProfile`/reconcile entra no marco "pronto" ou é aceitável o risco de
janela curta para 1 usuário?

---

## 7. Testes & QA — **7,5**

**Bom:** 524 testes / 65 arquivos, **82,99% stmts / 76,18% branch / 89,29% funcs**; `trainingFlow.test.tsx`
cobre o loop inteiro com IndexedDB real (fake-indexeddb) + render real; `appData.test.ts` cobre
export/import com exclusão de token, detecção de tamper (checksum) e inclusão de links de Study; **e2e
smoke de PWA offline real** (`e2e/pwa-offline.spec.ts` + `playwright.config.ts` com `webServer`).

**Falta / fraco:**
- **[Médio × M]** Os 8 hooks de `app/` (`useAppData`, `useTrainingActions`, `useDiagnosisActions`, …) **não
  têm teste direto** — só são exercitados via render de integração. Fix: `renderHook` por hook.
- **[Médio × P]** `achievementsSync.ts` e `oauthFlow.ts` sem teste dedicado.
- **[Médio × P]** Sem **thresholds** de cobertura (`vitest.config.ts:16-17`, baseline intencional) — uma
  regressão que apaga caminho crítico passa no gate. Fix: `thresholds:{lines:70,functions:70}`.
- **[Médio × P]** O flaky (§2) é um risco de CI-vermelho intermitente.

**Alternativa:** asserts atuais testam **comportamento** (bom). Antes de perseguir % cega, priorizar
`renderHook` nos hooks de maior risco (`useDiagnosisActions`, `useTrainingActions`).

**Perguntas:** ligar threshold de cobertura no CI agora ou manter baseline livre?

---

## 8. Documentação & Memória — **7,5**

**Bom:** `docs/review/README.md` **agora existe** como índice (Ativo/Histórico/Leitura-novo-dev) — fecha o
achado anterior; memória viva (`memory/*.md`) excelente para onboarding de sessão.

**Falta / fraco:**
- **[Médio × P]** **Drift:** `docs/privacy/privacy-and-data.md:50` diz "não exporta links de Study", mas
  `appData.test.ts:457-459` prova que **entram** no backup (Corte F.2). Corrigir o **doc** (não o código).
- **[Baixo × P]** "Riscos a revisar" do privacy doc lista itens de P4/P5 (congelados) sem rótulo "fora de
  escopo" — confunde dev novo.
- **[Baixo × P]** Sem `README.md` na raiz (clone "cego"). Aceitável p/ ferramenta pessoal, mas anotado.

**Perguntas:** mantemos o índice de review curado à mão ou geramos por script?

---

## 9. Processo & Tooling — **6,5** (▲ +1,5: CI nasceu)

**Bom:** **CI existe** (`.github/workflows/ci.yml`): `npm ci → lint → test → build` em push (`main`/
`master`) e PR, Node 22, `cache: npm`. `.gitignore` limpo (dist/coverage/node_modules/.vercel/artefatos).

**Falta / fraco:**
- **[Médio × P]** Sem **pre-commit** (`.husky/` ausente, sem `lint-staged`) — só o CI (pós-push) barra
  erro. Fix: husky + lint-staged (`eslint --fix` + `tsc --noEmit` no staged).
- **[Médio × P]** `output/playwright/` **não** está no `.gitignore` (14 PNG/JSON efêmeros aparecem
  untracked). Fix: adicionar a linha.
- **[Baixo × P]** Pinagem mista (`dexie` exato vs `@playwright/test ^1.60.0`) — caret no Playwright pode
  auto-quebrar o smoke. Fix: pinar exato.

**Perguntas:** pre-commit agora, ou o CI já basta para 1 dev?

---

## 10. Visual & Design — **8,0**

**Bom:** identidade coesa (tokens semânticos por camada, `index.css:9-110`), **dark mode** completo
token-a-token (`:1920-2003`), `prefers-reduced-motion` global (`:2007-2014`). Arte SVG é **provisória por
decisão do dono** (não penalizo; ver memória `visual-premium-images`).

**Falta / fraco:** risco colorblind baixo (estados usam bg+fg, não só cor) — manter. **[Baixo]** alguns
selos/ícones SVG ainda são placeholder até a fase de imagens premium.

**Perguntas:** a troca por imagens geradas premium é pós-testes — confirma que não bloqueia o marco atual?

---

## 11. UX — **7,5**

**Bom:** funil de onboarding enxuto; hero decide o "próximo passo"; números visíveis (streak, blocos,
minutos) — alinhado ao perfil TDAH.

**Falta / fraco:**
- **[Médio × P]** Sem **focus-management** ao resolver `<Suspense>` de Config/Progress (`App.tsx:194-219`)
  — foco fica na nav; já há padrão `funnelRef` para copiar.
- **[Médio × P]** "Pular" bloco sem confirmação/undo (`PlanBlockCard.tsx:213-220`) — clique impulsivo
  perde o bloco. `sonner` já suporta toast com ação "Desfazer".
- **[Médio × M]** No mobile, `aside` empurra "Conectar Lichess" para baixo de 5 Folds de contexto
  (`Today.tsx:480`).

**Perguntas:** "Pular" deve pedir confirmação ou oferecer undo? (TDAH = impulsivo).

---

## 12. UI — **7,5**

**Bom:** `window.confirm` no restore foi **substituído por confirmação inline** (`Config.tsx:96-98`);
progressbar de dia com ARIA completo (`Today.tsx:232-251`); disciplina de `hideHeading` nos cards dentro
de Fold.

**Falta / fraco:**
- **[Médio × P]** Botões async sem **busy-state** (`PendingReviewCard.tsx:58-74`, `TutorCard.tsx:108-118`)
  — padrão `isOpening` de `PlanBlockCard.tsx:35` deveria ser reusado.
- **[Médio × P]** `h2` dentro de `<summary>` (`Fold.tsx:29`) — semântica de heading inválida, recorrente
  em 7+ Folds. Fix: `role="heading" aria-level="3"`.
- **[Baixo × P]** Calibration: 4 botões secundários em linha quebram irregular no mobile
  (`PlacementCard.tsx:261-275`).

---

## 13. Conteúdo & Comunicação — **7,5**

**Bom:** pt-BR firme, tom "Professor Lemos" sem prometer rating.

**Falta / fraco:**
- **[Médio × P]** Escopos OAuth técnicos expostos ("Conectado com escopos: puzzle:read…",
  `Config.tsx:420`). Fix: frase amigável.
- **[Médio × P]** "Importar atividade livre" (`Today.tsx:469`) e "Adicionar sinais manuais"
  (`Config.tsx:351`) sem explicação para iniciante.
- **[Baixo × P]** Data ISO crua "vence em 2026-07-01" (`PendingReviewCard.tsx:95`). Fix:
  `toLocaleDateString('pt-BR')`.
- **[Baixo × P]** `toDiagnosisErrorMessage` fala "Chess.com" mesmo em erro de Lichess
  (`errorMessages.ts:13`).

---

## 14. Plataforma & Performance — **7,5**

**Bom:** PWA `generateSW`, precache 75 entradas (~1,73 MiB), **code-split** (`Progress`/`Config` lazy;
`react-vendor`/`dexie`/`icons` separados), **sourcemaps** ligados, ~156 kB gzip no caminho principal
(index 67,7 + react-vendor 57,4 + dexie 31,3) + CSS 7,9 kB. e2e offline smoke real.

**Falta / fraco:** **[Baixo × P]** sem orçamento de bundle no CI; **[Baixo]** dexie 31 kB gzip é o maior
custo evitável (ok para o valor entregue).

---

## 15. Acessibilidade & i18n — **7,0** (▲)

**Bom:** `aria-current="page"` nos nav-buttons (`App.tsx:144,155,166`) **FIXED**; alvos de toque 44px na
label inteira do radio (`index.css:2399-2402`) **FIXED**; `aria-live` correto no `ViewFallback`; dark +
reduced-motion.

**Falta / fraco:**
- **[Médio × P]** `h2`-in-`<summary>` recorrente (ver §12) — impacto de leitor de tela.
- **[Médio × P]** `CurriculumCard` usa `<details open={status==='current'}>` **controlado** — re-render do
  pai fecha fases que o usuário abriu (`CurriculumCard.tsx:31`). Fix: `useState` como `Fold`.
- **[Médio × P]** Beep de timer sem equivalente visual ativo se o card está fora da viewport
  (`Today.tsx:722-743`). Fix: toast/banner.
- i18n: fora de escopo (ferramenta pessoal pt-BR) — **não** adicionar.

---

## 16. Segurança & Privacidade — **6,5**

**Bom:** **leak de username FIXED** (`createDefaultProfile` agora `undefined`, `state.ts:428-440`; reais só
em `*.test.*`); **PKCE S256 correto** (`oauth.ts`, hash real `crypto.subtle`, `state` validado antes do
exchange); token no **Dexie**, não localStorage; export/import atômico + checksum.

**Falta / fraco:**
- **[Médio × P]** `openExternalUrl` **sem allowlist** (`externalOpen.ts:1`) — abre qualquer string; um
  backup importado com `javascript:`/`data:` em `lichessUrl` (`usePendingActions.ts:37`) seria aberto.
  *Verifiquei à mão.* Fix: exigir prefixo `https://lichess.org/`.
- **[Médio × P]** Sem **headers de segurança** (`vercel.json` só tem `X-Robots-Tag`) — sem CSP/X-Frame/
  X-Content-Type-Options/Referrer-Policy; XSS hipotético exfiltraria token+IndexedDB. *Defesa em
  profundidade.* Fix: adicionar os headers (CSP `connect-src` lichess+chess.com).
- **[Baixo × P]** `codeVerifier` da PKCE em `sessionStorage` (`oauthFlow.ts:36`) — legível por XSS;
  mitigado pelo CSP acima.

**Nota de severidade (diretor):** num app **single-user, local-first, sem superfície de UGC e sem scripts
de terceiros**, esses são **Médios de defesa-em-profundidade**, não Críticos. Mas o allowlist de
`openExternalUrl` é barato e vale fazer já (vetor concreto via import).

---

## 17. Build, Release & Operação — **6,5** (▲)

**Bom:** sourcemaps + `manualChunks` + CI de gate.

**Falta / fraco:**
- **[Médio × P]** Sem `__APP_VERSION__` (`vite.config.ts`) e `package.json` em `0.0.0` — build implantado
  não é rastreável a um SHA. Fix: `define:{__APP_VERSION__:JSON.stringify(npm_package_version)}`.
- **[Médio × P]** `smoke:pwa` **fora do CI** (`ci.yml` não chama) — regressão de PWA/offline pode subir.
  Fix: job `smoke` separado ou aceitar e documentar.
- **[Baixo × P]** Sem gate de cobertura no CI (liga ao threshold ausente).
- Deploy manual via prebuilt no Vercel é **aceitável** (decisão do dono; `output/` 779 MB quebra upload
  direto).

---

## Top 5 riscos (Crítico/Alto) + mitigação

1. **`observedAt` Chess.com anula frescor de 90 dias** (`chesscomClient.ts:45`) → diagnóstico estagnado em
   fraqueza velha. *Mitigar:* usar data real da partida. **Alto × M.**
2. **`useAppData` gera plano sem `diplomaAttempts`** (`useAppData.ts:184`) → trilha de diploma ignorada no
   boot. *Mitigar:* usar `buildPlanContext`. **Alto × P.**
3. **Escritas não-atômicas** `saveProfile`/`reconcileLichess` (`state.ts:211`, `useStudyActions.ts:84`) →
   janela de estado híbrido. *Mitigar:* transação Dexie. **Alto × P.**
4. **`ui/Config.tsx → infra/`** (`Config.tsx:5-12`) → erosão de camada; bug de storage vaza para UI.
   *Mitigar:* reexportar via `app/`. **Médio-Alto × M.**
5. **Teste flaky no CI** (`trainingFlow.test.tsx:65`) → CI vermelho intermitente mina confiança no gate.
   *Mitigar:* `findByText`/fake timers. **Médio × P** (mas ataca a fundação do processo).

## Top 10 quick wins (alto impacto ÷ baixo esforço)

1. `buildPlanContext` nas 2 chamadas de `useAppData` (corrige `diplomaAttempts`). 
2. `findByText` no teste flaky.
3. Allowlist `https://lichess.org/` em `openExternalUrl`.
4. `output/playwright/` no `.gitignore`.
5. Corrigir drift de `privacy-and-data.md:50` (links de Study **entram** no backup).
6. Bloco `final` por banda (`finalThemeByBand`).
7. `assertNever` em `resourceCatalog.ts:981/991`.
8. `formatDueDate` pt-BR + escopos OAuth → frase amigável.
9. Headers de segurança no `vercel.json`.
10. `CurriculumCard` → `useState` (não fechar fases no re-render).

## Dívida técnica priorizada

1. **Pedagogia adaptativa** (loop parcialmente aberto: puzzle→fraqueza não-persistido, métricas não
   realimentam) — paga juros em **valor do produto**.
2. **Atomicidade restante** (`saveProfile`/reconcile) — juros em integridade.
3. **`[input]` dep-arrays + threading de setters** — juros em manutenção/perf.
4. **Hooks sem teste direto** — juros em regressão (o refator L aumentou a superfície sem teste de unidade).

## Roadmap sugerido até o "release pessoal estável"

Gate objetivo entre fases: `lint && test && build` verdes (o CI já roda).

- **Fase A — Quick wins + endurecimento (½–1 dia):** itens 1–5 e 9 acima. Sem decisão de produto. Começa já.
- **Fase B — Durabilidade (½ dia):** transações em `saveProfile`/reconcile; validação de shape no import.
- **Fase C — Pedagogia adaptativa (1–2 dias, exige dono):** `observedAt` real; bloco `final` por banda;
  puzzle→fraqueza durável; `accuracy<70` por banda. **Após** respostas do §"Perguntas ao dono".
- **Fase D — Débito/teste (oportunístico):** `renderHook` nos hooks de risco; threshold de cobertura;
  `ui/Config.tsx` desacoplado de `infra/`; pre-commit; `__APP_VERSION__`; smoke no CI.

## O que NÃO fazer (YAGNI / over-engineering)

- **Não** migrar para SM-2 com ease-factor — 4 slots bastam p/ 0–1200. Só corrigir comentários (já feito).
- **Não** adicionar i18n/l10n — ferramenta pessoal pt-BR (escopo P5).
- **Não** criptografar token em repouso — local-first, 1 usuário, escopos mínimos; ROI baixo.
- **Não** perseguir % de cobertura cega — priorizar `renderHook` nos hooks críticos.
- **Não** reescrever para `useReducer` agora — o threading incomoda mas funciona; só quando entrar perf real.
- **Não** descongelar P4 (sync/D1) nem P5 (comunidade); CSP só vira urgente quando P5 abrir (fazer o
  básico agora como defesa, não a suíte completa).

---

## Perguntas abertas ao dono do produto (pacote único de aprovação)

1. **Puzzle→fraqueza durável:** autorizo transformar perdas de puzzle em `Weakness` persistido (o tutor
   "lembra" de temas táticos entre sessões sem jogo)? *Maior ganho pedagógico.* — destrava Fase C.
2. **`accuracy<70` Chess.com:** remover ou recalibrar por banda (65 p/ iniciante)?
3. **Bloco `final` de 60 min:** por banda ou sempre peão (intencional)?
4. **Métricas de eficácia** (`buildEfficacyBaseline`, skill map, track effort): devem realimentar o plano,
   ou ficam só display (status atual)?
5. **"Pronto" do marco:** é Fase A+B (quick wins + durabilidade) **ou** inclui Fase C (pedagogia)?
6. **Atomicidade `saveProfile`/reconcile:** entra no marco ou aceito a janela curta para 1 usuário?
7. **Threshold de cobertura + pre-commit:** ligo agora ou o CI pós-push basta?
8. **Headers de segurança:** aplico o pacote defensivo agora (barato), mesmo com P5 congelado?

---

## Apêndice — status dos achados da consolidação (FIXED/OPEN/PARCIAL, com prova)

| # | Achado (consolidação) | Status no HEAD | Prova `file:line` |
|---|---|---|---|
| 1 | Usernames reais no bundle | **FIXED** | `state.ts:428-440` (`undefined`); reais só em `*.test.*` |
| 2 | Escrita não-atômica log↔plano | **FIXED** | `appData.ts:80-85` `saveTrainingLogAndPlan` transacional |
| 3 | Auto-sync `void` engole erro | **PARCIAL** | `state.ts:233-250` try/catch por fonte; rejeição fora dele ainda escapa |
| 4 | `computeMastery` morto | **FIXED** | `useTrainingActions.ts:142` → `masteryTargetFromCompletedLog` → `computeMastery` (pending items) |
| 5 | Puzzle≠detector de fraqueza | **PARCIAL** | inferência em `generatePlan.ts:547`; **não** persiste `Weakness` |
| 6 | Proxy `accuracy<70` | **PARCIAL** | `extractSignals.ts:180` ainda 70 fixo; mas `kind:'accuracy'`/`confidence:'low'` (não mais "blunder") |
| 7 | Recência Chess.com | **OPEN** | `chesscomClient.ts:45` `observedAt=now`; `filterRecentArchives:74` só em teste |
| 8 | Import valida pouco | **PARCIAL** | `backup.ts` valida perfil/plano/log/sinal; `pendingItems`/`methodTracks` só `id` (`:172-188`) |
| 9 | Sem allowlist de URL | **OPEN** | `externalOpen.ts:1` (verificado à mão) |
| 10 | Sem CI/CD | **FIXED** | `.github/workflows/ci.yml` (lint+test+build, push/PR, Node 22) |
| 11 | God-hook `state.ts` | **FIXED/PARCIAL** | `state.ts` 440 ln; resíduo `saveProfile` inline `:200-251`; `useAppData` 289 ln concentra |
| 12 | Duplicação chesscom/lichess sync | **FIXED** | `runDiagnosisSync` `useDiagnosisActions.ts:88-148` |
| 13 | `window.confirm` no restore | **FIXED** | `Config.tsx:96-98` confirmação inline |
| 14 | nav sem `aria-current` | **FIXED** | `App.tsx:144,155,166` |
| 15 | Radios < 44px | **FIXED** | `index.css:2399-2402` (label = alvo de 44px) |
| 16 | Slug técnico de fraqueza | **FIXED** | `Today.tsx:529` + `Progress.tsx:237` usam `formatWeaknessTag` |
| 17 | Playwright dep morta | **FIXED** | `package.json:26` + `playwright.config.ts` + `e2e/pwa-offline.spec.ts` real |
| 18 | switches sem `assertNever` | **FIXED/PARCIAL** | `generatePlan.ts:348/365` ✓; **novo** furo `resourceCatalog.ts:981/991` |
| 19 | Headers de deploy mínimos | **OPEN** | `vercel.json` só `X-Robots-Tag` |
| 20 | `persist()` cedo demais | **FIXED** | `useAppData.ts:96` dentro do load async |
| 21 | Onboarding sem OAuth | **PARCIAL** | hint em `Onboarding.tsx:123`; sem passo no funil |
| 22 | Hero abaixo da dobra (mobile) | **FIXED** | `Today.tsx:275-313` hero logo após stats (conf. média, sem device) |
| 23 | `docs/review` sem índice | **FIXED** | `docs/review/README.md` |
| 24 | Drift backup×privacy doc | **OPEN** | `privacy-and-data.md:50` vs `appData.test.ts:457-459` |
| 25 | SM-2 rótulo enganoso | **FIXED** | `pendingItems.ts` sem "SM-2"; comentário descreve 4 slots `[1,3,7,14]` |

**Achados NOVOS desta auditoria (não estavam na consolidação):** `useAppData` sem `diplomaAttempts`
(`:184`); `observedAt` Chess.com anula frescor; `ui/Config.tsx→infra/` (`:5-12`); `[input]` dep-arrays
(memo morta); `isPuzzleTrainingLog` por string (`trainingLogFlow.ts:230`); bloco `final` hardcoded
(`generatePlan.ts:339`); teste flaky (`trainingFlow.test.tsx:65`); `resourceCatalog` switches sem
`assertNever`; `output/playwright/` fora do gitignore; sem `__APP_VERSION__`; smoke fora do CI.

**Confiança:** alta em tudo lido nesta sessão; **média** em "hero abaixo da dobra" (sem device) e no
impacto de runtime do `void` IIFE. A nota global 7,6 pondera por impacto para app pessoal local-first.
