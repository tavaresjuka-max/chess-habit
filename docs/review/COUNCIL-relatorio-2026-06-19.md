# Council — Relatório do que pode ser feito (Chess Habit / lichess-tutor)

Data: 2026-06-19 · Síntese de um council de 6 agentes (pedagogia, UX/a11y, bugs, arquitetura, testes, dados/sync) revisada pelo modelo principal.

Objetivo: levantar **tudo** que ainda pode ser feito, priorizado por valor×esforço e pelo perfil do dono (usuário único, TDAH, iniciante 0→autonomia). Esforço: **P** (≲1h), **M** (algumas horas), **G** (dia+). Valor: alto/médio/baixo.

---

## 0. Correções de premissa (o council errou em 1 ponto)

- **Diploma por acurácia JÁ está plugado.** O agente de dados/sync afirmou que "o código que grava DiplomaAttempt ao atingir o gate não existe ainda" — **falso**. Foi implementado nesta sessão: `reconcileLichessResults` ([src/app/useStudyActions.ts](../../src/app/useStudyActions.ts)) chama `applyDiplomaProgress` → `evaluateDiplomaSections` (gate 80%/30 por seção) → `saveDiplomaAttempt` → `promoteBandForDiplomas`. **Nuance válida (vale corrigir):** isso só dispara no botão **"Conferir puzzles"** (reconcile manual), não no auto-sync do `saveProfile` nem após concluir bloco. Logo a banda pode demorar a subir. → **Ação real:** rodar `applyDiplomaProgress` também no `runLichessSync`/auto-sync. (alto, P)

---

## 1. Tier 1 — ganhos altos e baratos (fazer primeiro)

### 1.1 Chess.com mudo: 294 sinais → 0 fraquezas (o bug nº 1 do dono)
Causa dupla confirmada no código:
- **Filtro de 90 dias descarta sinais agregados do Chess.com.** `filterFreshSignals` ([detectWeaknesses.ts:61-71](../../src/domain/weakness/detectWeaknesses.ts)) corta sinais com `observedAt` > 90 dias; o Chess.com deriva `observedAt` do `end_time` real do jogo ([extractSignals.ts:306-313](../../src/infra/chesscom/extractSignals.ts)) → histórico antigo é jogado fora antes de virar fraqueza.
- **Limiar de acurácia alto demais p/ iniciante.** `ACCURACY_LOW_RATE_BEGINNER = 0.8` ([detectWeaknesses.ts:15](../../src/domain/weakness/detectWeaknesses.ts)) exige 80% das partidas ruins — quase nunca dispara. Deveria ser ~0.5.
- **Sinais que viram nada:** `rating`/`color`/`time-control` retornam `[]` em `signalToCandidates`; sobram só `accuracy`/`clock`/`opening`, todos com gate difícil.
- **Correção:** exceção do filtro de 90d para sinais agregados do Chess.com (ou usar `nowIso` do sync como `observedAt`) **+** baixar `ACCURACY_LOW_RATE_BEGINNER` p/ ~0.5. **As duas juntas** (corrigir uma só pode não destravar). Valor **alto**, esforço **P**.

### 1.2 `computeMastery` nunca alimenta o `generatePlan` (código morto pedagógico)
`masteryTargetFromCompletedLog` existe ([mastery.ts:37](../../src/domain/method/mastery.ts)) mas `masteryTarget` nos blocos normais nunca é setado (só hardcoded `'review'` em createPendingPlanBlock). Aluno que domina e aluno travado recebem o mesmo próximo bloco. → Chamar no `createPlanBlock` e usar para escolher `resourceStage` (advance→transfer, regress→explain) + expor na UI. Fecha o laço diagnóstico→treino. Alto, **P**.

### 1.3 Progresso do diploma visível (TDAH: meta invisível desmotiva)
Hoje é só "passou/não passou". Usar `getDiplomaProgress` (já existe, [diplomas.ts:152](../../src/domain/method/diplomas.ts)) p/ mostrar "43/30 · 76% — faltam ~4pts" e um coachNote no bloco ("Seu Diploma da Torre trava aqui: treine garfos"). Alto, **P**.

### 1.4 Guard de graduação por acurácia no spaced repetition
`SPACING_DAYS=[1,3,7,14]` + `GRADUATION_ATTEMPTS=4` ([pendingItems.ts:6,124](../../src/domain/method/pendingItems.ts)): um item "forma" após 4 revisões mesmo se o aluno ainda erra. → Só graduar se acurácia do tema ≥70% (dado já disponível). Alto, **P**.

### 1.5 `selectMethodTrack` cai sempre em `calculation-bridge` no default
([selectMethodTrack.ts:47](../../src/domain/method/selectMethodTrack.ts)) pin/skewer/back-rank/endgame/time-trouble caem no default → guiding question errada ("quais meus 2 candidatos?") pra padrões que não são de cálculo. → casos explícitos por tema (ou `getGuidingQuestion` por tema). Alto, **P**.

### 1.6 Botão "Pular" sem confirmação (perda de dado no mobile)
([PlanBlockCard.tsx:254](../../src/ui/PlanBlockCard.tsx)) toque acidental pula o bloco e o carrossel avança. → confirmação inline (padrão do "Apagar tudo") ou toast com desfazer (sonner já é dep). Alto, **P**.

### 1.7 Acessibilidade — 3 correções baratas
- Setas do carrossel sem `aria-disabled` nos extremos (Embla expõe `canScrollPrev/Next`). ([BlockCarousel.tsx](../../src/ui/BlockCarousel.tsx)) Alto, P.
- Foco não recuperado após lazy-load de Config/Progresso (quebra teclado). ([App.tsx:173](../../src/ui/App.tsx)) Alto, P.
- `role="list"` nas listas com `list-style:none` (VoiceOver iOS). Médio, P.

### 1.8 Dados/segurança baratos e críticos
- **Lembrete de backup vencido (Android):** banner no Hoje quando `backupMeta.exportedAt` > 7 dias (risco de perda total). Alto, **P**.
- **OAuth state sem validação (CSRF):** validar `state` contra sessionStorage. ([oauth.ts:58](../../src/infra/lichess/oauth.ts)) Alto, **P**.
- **Precache Workbox de 50+ webp:** mover `**/*.webp` p/ runtimeCaching (install leve no 3G). ([vite.config.ts:26](../../vite.config.ts)) Alto, **P**.

### 1.9 DRY: labels de WeaknessTag triplicadas (com acentos divergentes)
Mapa repetido em detectWeaknesses.ts:20, generatePlan.ts:633, learningPlanProposal.ts:158. → único `weaknessTitles.ts`. Médio, **P**.

---

## 2. Tier 2 — valor alto, esforço médio

- **Race condition `replaceWeaknesses`** (Chess.com + Lichess em paralelo sobrescrevem um ao outro) → `replaceWeaknessesForSource` (where source) ou serializar os syncs. ([useDiagnosisActions.ts:192](../../src/app/useDiagnosisActions.ts), [appData.ts:176](../../src/infra/storage/appData.ts)) Alto, P/M.
- **`advanceThemeStage` só lembra o último plano** ([generatePlan.ts:459](../../src/domain/plan/generatePlan.ts)): aluno que some 3 dias volta pro 'guided'. → mapa `stagePorTema` persistido. Alto, M.
- **Diploma também no auto-sync** (ver §0): a banda sobe sem precisar do "Conferir puzzles". Alto, P/M.
- **Cobertura dos 5 hooks de app sem teste** (useStudyActions, useBackupActions, usePlanLifecycleActions, usePendingActions, useOAuthActions) — fluxos críticos só cobertos indireto. Alto, M/G.
- **`diagnosisWriteQueue` como var de módulo** (flaky em teste/HMR) → `useRef`. Médio, P.
- **`completeBlockTraining` sem `useCallback`** ([useTrainingActions.ts:228](../../src/app/useTrainingActions.ts)). Médio, P.
- **Lógica de domínio em app** (mergePuzzleWeakness/confidenceRank em useDiagnosisActions; getNextDiplomaSummary/getActiveTrackId em Today.tsx) → mover p/ domain. Médio, P/M.
- **Warning silencioso do reconcile** não é exibido ([trainingLogFlow.ts:68](../../src/app/trainingLogFlow.ts)). Médio, P.

## 3. Tier 3 — base do futuro / maior

- **Fundação do P4 sync (barato agora, caro depois):** `src/infra/sync/syncContract.ts` (tipos: quais tabelas sincronizam, merge strategy por tabela) + **adicionar `updatedAt` obrigatório em plans/logs** (sem isso, merge last-write-wins perde dado). Alto, P/M.
- **E2E diploma→banda + teste de integração do reconcile** (a feature central só tem teste unitário). Alto, G.
- **Testes de migração do Dexie (v7/v8)** — 0% de branch; bug aqui corrompe os dados do dono. Alto, G.
- **Imagens premium** (substituir SVGs provisórios; prompts já existem). Alto, G — depende do dono gerar.
- **Fase 4 (Autonomia) currículo vazio** ([curriculum.ts:180](../../src/domain/curriculum/curriculum.ts)) — abandono no ponto mais difícil. Médio, M.
- **CSP `unsafe-inline`** ainda presente ([vite.config.ts:13](../../vite.config.ts)). Médio, M.
- **Refactors menores:** Today.tsx (741 linhas → extrair sidebar/helpers), useAppData boot sequencial (paralelizar leituras), índice `deletedAt`, esqueleto de migração de backup, ReloadPrompt do PWA, clearAll cancelar in-flight. Médio/baixo.

---

## 4. Riscos transversais
- O bug do Chess.com (§1.1) é **duplo** — corrigir só metade não destrava.
- Race de `replaceWeaknesses` corrompe diagnóstico **sem erro visível**.
- Sem `updatedAt` em plans/logs, o P4 sync nasce perdendo dado.
- Migração do Dexie sem teste = risco de corromper os dados do único usuário real.
- Backup Android sem lembrete = risco de perda total se o IndexedDB for limpo.

## 5. Sequência recomendada
1. **Lote "destravar o uso real" (P):** §1.1 Chess.com, §1.2 mastery, §1.3 progresso do diploma, §0 diploma no auto-sync, §1.6 Pular, §1.8 backup+OAuth+precache. Tudo P, alto valor, pouco risco.
2. **Lote "fechar o método" (P/M):** §1.4 graduação por acurácia, §1.5 tracks por tema, §2 advanceThemeStage, §1.9 DRY.
3. **Lote "robustez" (M):** §2 race condition, hooks sem teste, queue/useCallback, warnings.
4. **Lote "futuro" (P→G):** §3 fundação do P4 (syncContract + updatedAt), E2E/migração, Fase 4, CSP, imagens premium.
