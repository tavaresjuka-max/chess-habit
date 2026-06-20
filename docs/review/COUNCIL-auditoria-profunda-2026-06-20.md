# Council — Auditoria profunda com notas (Chess Habit / lichess-tutor)

Data: 2026-06-20 · Método: council multi-agente de 8 dimensões (Sonnet), cada uma auditando o **código atual em disco** (inclui working tree não-commitada), seguida de um **verificador adversarial** por dimensão. Síntese, reconciliação e confirmação dos achados de maior impacto pelo modelo principal (Opus). Gates reais medidos antes da síntese.

Escala 0–10 (mesma do council de 19/06, que se autoavaliou em 8,2). As notas abaixo são **pós-verificação adversarial** — mais honestas e por isso mais baixas que uma auto-nota. **Não é regressão**: o código melhorou muito desde 19/06 (ver "o que foi corrigido"). A queda reflete (a) o desconto do verificador sobre otimismo e (b) um bug **crítico** novo confirmado.

---

## 0. Gates reais (estado objetivo, medido)

- `npm run lint` → **exit 0** (limpo)
- `npm test` → **677 testes, 82 arquivos, 100% verde** (17,9s)
- `npm run build` → **exit 0**; bundle principal 291 kB (gzip 84 kB), react-vendor 182 kB, dexie 95 kB
- PWA precache: **75 entradas / ~1,77 MB** (install pesado no 3G — ver SEG)
- Não rodado nesta auditoria: `coverage` 5× (gate de flakiness), `smoke:pwa`, `a11y`

A base de engenharia é sólida: tudo compila, tudo passa, lint limpo. Os problemas estão em **lacunas de comportamento, integridade de dados e dívida**, não em código quebrado em compilação.

---

## 1. Scorecard

| Dimensão | Nota (verif.) | Δ vs council 19/06 | Veredito |
|---|---|---|---|
| Pedagogia e método | **7,2** | — | Laço funciona; faltam gates de acurácia e persistência de estágio |
| UX e acessibilidade | **7,8** | ↑ (correções aplicadas) | Melhor dimensão; faltam alvos de toque e role=list |
| Correção / bugs | **7,2** | ↑ (race + reconcile corrigidos) | Sólido; Chess.com ainda meio-mudo, deps de hook |
| Arquitetura / código | **6,8** | — | Camadas limpas; DRY violado, lógica vazando p/ app/ui |
| Testes e gates | **6,8** | — | 677 verdes, mas migração Dexie e fluxo central sem cobertura |
| Dados e local-first | **6,5** ⚠ | ↓ (bug crítico confirmado) | **Restore de backup quebrado** com sinais |
| Segurança e privacidade | **8,4*** | ↑ (CSRF corrigido) | Melhor base; *não passou pelo verificador adversarial |
| Produto / prontidão beta | **6,8** | — | Visão coerente; bloqueadores de beta público em aberto |

**Nota geral ponderada: ~7,1 / 10** (pesos: pedagogia 1,5 · UX 1,3 · produto 1,3 · bugs 1,2 · dados 1,1 · testes 1,0 · arquitetura 0,9 · segurança 0,7).

Leitura: **beta local-first funcional e honesto, com dívida real e um furo crítico de recuperação**. O alvo "9,5 pronto p/ beta público" é alcançável e o caminho está abaixo.

---

## 2. O que MELHOROU desde 19/06 (corrigido, confirmado no código)

- **Confirmação de "Pular"** (PlanBlockCard.tsx:255-289): `isConfirmingSkip` com "Pular mesmo"/"Voltar". Fim da perda acidental no mobile.
- **Setas do carrossel com `aria-disabled`** nos extremos (BlockCarousel.tsx:153,187) via `canScrollPrev/Next`.
- **Race condition de diagnóstico** serializada (useDiagnosisActions.ts:55-65, `runExclusiveDiagnosisWrite`).
- **Warning do reconcile** agora exibido (trainingLogFlow.ts:71 → useTrainingActions.ts:191).
- **Filtro de 90 dias do Chess.com** corrigido (sinais chesscom isentos — useDiagnosisActions.ts:498-501).
- **Lembrete de backup vencido** no Hoje (Today.tsx:645-664, `role="status"`).
- **OAuth state/CSRF VALIDADO** (oauthFlow.ts:66) + PKCE S256 correto + token fora do backup. *(O agente de "produto" classificou como "aberto" por engano — está corrigido.)*
- **Contrato E2EE documentado** (docs/architecture/sync.md:51-65).
- **Hooks ganharam teste**: useDiagnosisActions (4 casos), useStudyActions (1), useTrainingActions (1), achievementsSync, oauthFlow.

---

## 3. ACHADO CRÍTICO (parar e corrigir)

### 🔴 DATA-1 — Restore de backup falha com qualquer backup que tenha sinais
- **Arquivo:** `src/infra/storage/backup.ts:182-183` + tipo `Signal` (appData.ts:563-570).
- **Evidência confirmada diretamente:** `validateBackupData` faz `if (typeof item.kind !== 'string' …) entityError('signals', i, 'kind')`. Mas `Signal = { source, value, confidence, observedAt }` — **não tem `kind` no topo**; o discriminador fica em `value.kind` (`value: { kind: 'judgment' | 'accuracy' | 'clock' | 'rating' | 'opening' | … }`). Logo `item.kind` é sempre `undefined` → import **rejeita** com "O backup contém dados inválidos: signals[0].kind".
- **Impacto:** num app local-first sem backend, o export/import JSON é o **único** caminho de recuperação. Como o usuário acumula sinais após qualquer diagnóstico (Lichess/Chess.com), **um backup real não restaura**. O safety-net do dono está quebrado.
- **Por que está mascarado:** o round-trip de backup nos testes não exercita restauração com `signals` populados (gap TQ-2/TQ-3).
- **Correção (P):** trocar a checagem para o que existe de fato em `Signal` (`item.source`/`item.observedAt`, ou validar `item.value` é objeto) **e** adicionar teste de round-trip export→import **com sinais reais**. Severidade **crítica**, esforço **P**.

---

## 4. Por dimensão — o que ainda dói (achados validados)

### Pedagogia (7,2)
- **PED-2 (P):** `selectMethodTrack.ts:13-47` — `pin`/`skewer`/`backRankMate`/`pawnEndgame`/`rookEndgame`/`timeControl` caem no default `calculation-bridge` → guiding question "Quais meus 2 candidatos?" errada para cravada/back-rank. *Confirmado.*
- **PED-3 (M):** `generatePlan.ts:459-512` — `advanceThemeStage` só lê `previousPlan` (um plano). Aluno **intermitente (perfil TDAH)** que some 1+ dia volta sempre a `'guided'`, nunca progride a `retrieval`/`transfer`. *Confirmado.* Persistir `resourceStage` por tema.
- **PED-1 (M):** `pendingItems.ts:124-158` — graduação por volume. `masteryTarget` já é passado (useTrainingActions.ts:144), mas vem de `themeStats` que é `undefined` quando o Lichess não reconcilia → sem gate de acurácia, aluno que clica "Bom" gradua errando. *Ajustado pelo verificador.*
- **PED-4 (P):** `curriculum.ts:179-186` — Fase 4 (Autonomia) `weeks:[]`. Quem chega lá não tem horizonte. Declarar 2-3 semanas placeholder.
- **PED-5 (P):** `diagnosis.ts:83-106` — puzzle-theme eclipsa weakness de partida de **alta confiança**. Priorizar `confidence>='high'` antes do tema de puzzle.
- **PED-7 (baixa, latente):** `diplomas.ts:72,88,110` — campo `band: '0-600'/'600-1000'/'1000-1200'` **não** são bandas válidas do spine de 7 bandas. **Promoção está correta** (usa `bandProgression.ts`, não o campo), então é só cosmético/footgun. Alinhar ou remover o campo.

### UX e acessibilidade (7,8)
- **UX-CRÍTICO-a11y (P):** dots do carrossel a **30px em todos os aparelhos** (index.css:244-247) — abaixo do alvo 44px. *O verificador pegou; o auditor tinha deixado passar.*
- **UX-1 (P):** `.link-button { min-height: auto }` (index.css:612) — "Pular"/"Voltar"/"Começar rápido" sub-44px no desktop.
- **UX-2 (P):** ~10 listas com `list-style:none` sem `role="list"` (VoiceOver iOS silencia). Priorizar `.day-stats`, `.completion-metrics`, `.roadmap-list`.
- **UX-3 (P):** `App.tsx:172-176` — foco não volta ao `#main-content` ao retornar para "Hoje" (`activeView !== 'today'` exclui o caso).
- **UX-8 (P):** microcopy do backup sem acento ("nao"/"ultimo", Today.tsx:647,663).
- Menores (P): `Fold` sem aria-label; carrossel modo-lista sem `role="region"`; confirmação de Pular sem `aria-live`.

### Bugs / correção (7,2)
- **LOG-1 (P):** `detectWeaknesses.ts:15` — `ACCURACY_LOW_RATE_BEGINNER=0.8` **inalterado**: exige 80% das partidas ruins, quase nunca dispara p/ iniciante. (decisão pedagógica — ver §6)
- **LOG-3 (M):** `useDiagnosisActions.ts:498-501` — a isenção do filtro de 90 dias para chesscom ficou **sem limite de idade**: ratings/aberturas de anos atrás nunca expiram → fraquezas-fantasma. Usar **latest-wins por perf**.
- **LOG-5 (P):** `useStudyActions.ts:130-132` — `saveDiplomaAttempt` em loop **sem transação** → promoção de banda parcial se o app fechar no meio. Usar `bulkPut` transacional.
- **LOG-2/4/6 + ARQ (P):** `useCallback` com deps incompletos em `completeBlockTraining` (228), `importFreeActivity` (201), `startBlockTraining` (88), **e — mais grave — `reconcileLichessResults` (160)** que cobre o caminho crítico de promoção de banda: stale-closure latente.

### Arquitetura (6,8)
- **ARQ-1 (P):** `weaknessTitleByTag` **triplicado com acentos divergentes** (detectWeaknesses.ts:22, generatePlan.ts:633, learningPlanProposal.ts:158) — texto sem acento já aparece ao usuário. Há ainda um **4º mapa** (`puzzleThemeLabelByTheme`, diagnosis.ts). Centralizar em `weaknessTitles.ts`.
- **ARQ-2 (P):** `confidenceRank` duplicado em 3 arquivos.
- **ARQ-3 (P):** `diagnosisWriteQueue` é **var de módulo** (não `useRef`) — risco em HMR/StrictMode/testes.
- **ARQ-4/7 (P):** lógica de domínio em UI/app (`getActiveTrackId`/`getNextDiplomaSummary` em Today.tsx; `mergePuzzleWeakness`/`filterSignalsForDiagnosis`/`sortWeaknessesByScore` em useDiagnosisActions) → mover p/ `domain`.
- **ARQ-8/9 (P):** boot sequencial (14+ awaits) em useAppData → `Promise.all`; `generatePlan` chamado em duplicidade; `loadProfile` chamado 2× (linhas 113 e 133).
- **Today.tsx** ~772 linhas — extrair.

### Testes (6,8)
- **TQ-2 (M):** **migrações Dexie v7/v8 sem nenhum teste** (db.ts:148-181) — `.upgrade()` backfill `updatedAt` e `migrateLegacyBand` no perfil; bug aqui corrompe os dados do dono **sem rollback** (IndexedDB não regride versão).
- **TQ-3/TQ-6 (M):** **fluxo diploma→promoção de banda** (Decisão #1, o mais crítico do produto) só tem teste unitário com mocks; sem integração nem E2E.
- **TQ-1 (M):** 4 hooks sem teste: `useBackupActions`, `usePlanLifecycleActions`, `usePendingActions`, `useOAuthActions` (apagar dados, aprovar plano, pular pendência, desconectar OAuth).
- **TQ-4 (P):** thresholds de coverage **não bloqueiam** `npm test` nem CI — suíte pode regredir sem gate.
- **TQ-5 (P):** `operationEpoch` singleton sem reset entre suítes → flakiness por ordem.

### Dados e local-first (6,5 ⚠)
- **DATA-1 (crítico)** — ver §3 (restore quebrado).
- **DATA-2 (P):** `importBackupFromJson` (appData.ts:417-489) **não inclui `db.backupMeta` nem `db.autoBackup`** na transação nem os atualiza → após restaurar, o lembrete de backup e o auto-backup ficam com estado obsoleto. *Confirmado diretamente.*
- **PLAN.updatedAt (P):** `DailyPlan` (types.ts:166-173) sem `updatedAt` → merge P4 sem âncora temporal no nível do plano. Trivial agora, bloqueante depois.
- **PED-3-import (P):** import de backup é sempre destrutivo sem comparar datas — restaurar um backup mais **antigo** sobrescreve dados mais novos sem aviso.
- **syncContract.ts (P):** ausente — tipar tabelas sincronizáveis + estratégia de merge (fundação P4 barata).
- **Risco aceito:** sem backup remoto, IndexedDB limpo no Android = perda total. `navigator.storage.persist()` mitiga, não elimina. → DATA-1 torna isso **muito** pior (o backup que existe não volta).

### Segurança (8,4*)
- *Não passou pelo verificador adversarial (o agente falhou no output estruturado e foi refeito isolado).* Pontos fortes confirmados: CSRF validado, PKCE S256, token fora do export, zero `dangerouslySetInnerHTML`, sourcemaps off, CSP testada.
- **SEC-6 (P):** adicionar `object-src 'none'` explícito.
- **SEC-9 (P):** `Permissions-Policy` expandir (`payment=(), usb=()`).
- **SEC-5 (P):** auditar `connect-src` vs todos os endpoints de `src/infra/`.
- **SEC-3 (M):** precache 75/1,77 MB → mover decorativos p/ `runtimeCaching`.
- **SEC-1 (M):** `style-src 'unsafe-inline'` forçado pelo `sonner` (zero `style={{` próprio). Fechar exige trocar/contornar o sonner — **documentar como limite conhecido** (não bloqueia beta).

### Produto / beta (6,8)
- **PROD-1 (P, dono):** `FEEDBACK_URL` e `SOURCE_CODE_URL` = `undefined` (appIdentity.ts:13,27) — **bloqueiam beta público** (canal de feedback + AGPL/código-fonte).
- **PROD-2 (P, dono):** README ainda "Rotina" vs `APP_NAME='Chess Habit'` — inconsistência.
- **PROD-3 (P/M):** Quick Start cria perfil com banda **0-400 hardcoded** sem placement → estranho pode ficar no material errado sem saber que há avaliação. Oferecer calibração.
- **PROD-4 (P):** empty-state do Hoje ("Configure o app…") sem ação/botão → e pode aparecer p/ usuário já autenticado.
- **PROD-5 (P):** progresso do diploma só no aside; sem vínculo com o bloco ativo (chip "🏅 Torre — garfos: 18/30" no PlanBlockCard).
- **PROD-6 (P/M, dono):** diploma sobe a banda **só** no botão manual "Conferir puzzles" — invisível p/ novo usuário (rodar `applyDiplomaProgress` no auto-sync). *(= §0 do council anterior, ainda aberto.)*

---

## 5. Correções que o council/verificador trouxe (disciplina adversarial)

- **OAuth CSRF NÃO está aberto** — está corrigido (oauthFlow.ts:66). O agente de produto errou; o de segurança e o de bugs confirmaram.
- **DATA-1 era subestimado** pelo verificador ("dado malformado passa") — a confirmação direta mostrou o oposto e pior: **backup válido é rejeitado**.
- **PED-7 (band field)** não é bug funcional — promoção usa `bandProgression.ts`, não o campo `.band`. Rebaixado a cosmético.
- **PED-1** teve evidência desatualizada (auditor disse "masteryTarget não é passado"; é passado) — o gap real é `themeStats undefined`.

---

## 6. Pacote de decisões do dono (aprovar antes da fase autônoma)

1. **Chess.com meio-mudo (bug nº1):** baixar `ACCURACY_LOW_RATE_BEGINNER` de 0,8 → **0,6** (recomendado) ou 0,5 (mais agressivo) **+** limitar idade dos sinais chesscom (latest-wins por perf, LOG-3). As duas juntas.
2. **Diploma no auto-sync (PROD-6):** rodar `applyDiplomaProgress` em `runLichessSync` para a banda subir sem o botão manual. Recomendado: sim (avaliação é idempotente).
3. **Próximo passo desta sessão:** executar Tier 0 (integridade de dados) agora · gerar brief de implementação p/ Codex · ou só entregar o relatório.

**Fora de escopo / decisões travadas (não fazer agora):** P4 sync/backend, `computeMastery→generatePlan`, currículo avançado 1200-2200, trocar `sonner` p/ fechar CSP. Nome público final e URL do código-fonte dependem do dono.

---

## 7. Plano completo em fases (gate-to-gate, autônomo após aprovação)

Gate de cada tarefa: `lint` + `test` verdes + `build` exit 0; 1 commit atômico por tarefa.

**FASE 0 — Integridade de dados (parar tudo). Esforço total ~1-2h.**
- DATA-1: corrigir `validateBackupData` (signals) + teste de round-trip export→import **com sinais**.
- DATA-2: incluir `backupMeta`/`autoBackup` na transação de import + atualizar `backupMeta` pós-restore.
- LOG-5: `saveDiplomaAttempts` transacional (atomicidade da promoção).

**FASE 1 — Destravar o uso real (P, alto valor). Requer decisões #1 e #2.**
- LOG-1 + LOG-3: tuning Chess.com (limiar + idade de sinais).
- PROD-6: diploma no auto-sync.
- PED-2: rotas explícitas em `selectMethodTrack` + guiding question por tema.
- PROD-5: progresso do diploma vinculado ao bloco ativo.
- PLAN.updatedAt (fundação P4).

**FASE 2 — UX/a11y (P).**
- Dots 44px, `link-button` min-height, `role="list"`, foco ao voltar p/ Hoje, acentos do backup, aria menores.

**FASE 3 — Robustez e testes (M).**
- Migração Dexie v7/v8 (`db.test.ts`); E2E/integração diploma→banda; 4 hooks sem teste; `useCallback` deps (esp. `reconcileLichessResults`); `operationEpoch` reset + coverage no CI.

**FASE 4 — Arquitetura/DRY (P).**
- `weaknessTitles.ts` único (+`confidenceRank`, +4º mapa); mover lógica de domínio (Today.tsx, useDiagnosisActions); `diagnosisWriteQueue`→`useRef`; boot `Promise.all` + dedup `generatePlan`/`loadProfile`; dividir Today.tsx.

**FASE 5 — Pedagogia profunda (M).**
- `advanceThemeStage` persistente; gate de acurácia na graduação; diagnosis não eclipsar weakness de alta confiança; Fase 4 placeholder.

**FASE 6 — Produto/beta público (dono + P).**
- `FEEDBACK_URL`/`SOURCE_CODE_URL`/nome/README; Quick Start→placement; empty-state com ação; privacidade mais proeminente.

**FASE 7 — Segurança hardening (P/M).**
- `object-src`, `Permissions-Policy`, `connect-src` audit; precache→runtimeCaching; documentar limite do `sonner`.

---

## 8. Sequência recomendada

1. **Fase 0** imediatamente (o safety-net do dono está quebrado — risco real de perda total).
2. **Fase 1** após decisões #1/#2 (é o que faz o app "falar" com o usuário).
3. **Fase 3** (robustez) antes de divulgar o beta — o fluxo central (diploma→banda) e as migrações Dexie não podem regredir em silêncio.
4. **Fases 2/4/5/6/7** em lotes P por área, com Fase 6 logo antes de abrir o beta público.
