# Handoff Codex — Cortes M1–M5: zerar TODAS as pendências do lichess-tutor

**Autor do handoff:** Claude Opus 4.8 (diretor). **Data:** 2026-06-15.
**Executor:** Codex. **Objetivo:** implementar **todas** as pendências confirmadas das auditorias 360°
de hoje e deixar o app **sem nada por fazer** dentro do escopo do marco pessoal. As 8 decisões de
produto **já foram aprovadas pelo dono** (ver §"Decisões travadas"). Não há mais nada a perguntar:
**execute do começo ao fim.**

Fonte de verdade (leia antes de começar):
- `docs/review/consolidacao_analise_2026-06-15_v2-pos-corte-L.md` (matriz de achados + verdict por código).
- `docs/review/analise_completa_claude-opus-4.8_pos-corte-L_2026-06-15.md` (detalhe por área, com file:line).

---

## 0. Regras de execução (inegociáveis)

1. **TDD em toda mudança de comportamento:** escreva o teste que falha **antes** do código. Para mudanças
   mecânicas (gitignore, doc, headers), teste não se aplica — mas rode o gate.
2. **Commit atômico por item**, mensagem `tipo(corte): descrição` (pt-BR), ex.:
   `fix(M1.1): passa diplomaAttempts no generatePlan do boot`.
3. **Gate verde antes de cada commit:** rode **os três** — `npm run lint && npm run test && npm run build`.
   O `npm run build` é obrigatório: o `tsc -b` pega erros estritos (`noUncheckedIndexedAccess`, mocks
   tipados) que o `vitest` **não** pega. Nunca confie só no vitest.
4. **Não quebre a interface pública** `AppState` / `App.tsx` sem necessidade. Refatorações de camada
   devem ser comportamento-idêntico.
5. **Escopo congelado — NÃO faça:** nada de i18n/l10n, dark mode (já existe em `index.css:1920`), SM-2 com
   ease-factor, telemetria/RUM, P4 (sync/D1) ou P5 (comunidade), criptografia de token em repouso,
   `LearnerBand` acima de 1200 (fora do alcance do produto). Se algo te empurrar para isso, pare e anote
   em vez de implementar.
6. **Stack:** React 19 + TS estrito, Vite 8, Vitest 4, Dexie, Playwright (smoke isolado). Camadas:
   `domain/` (puro, sem React/Dexie/infra), `infra/` (storage + http), `app/` (hooks/estado), `ui/` (React).
7. **Ao final de cada Fase (A/B/C/D):** rode `npm run lint && npm run test && npm run build` +
   `npm run coverage`. Ao final de tudo, rode também `npm run smoke:pwa`.
8. **Repositório:** trabalhe no branch atual (`master`). Não faça push nem deploy — só commits locais.

---

## Decisões travadas (dono aprovou em 2026-06-15) — não reabrir

1. Escopo "pronto" = **M1+M2+M3**; pedagogia (**M4**) é fase à parte mas **pré-aprovada** → faça também.
2. **Puzzle→fraqueza DURÁVEL: SIM.**
3. **accuracy<70 Chess.com: recalibrar por banda** (65% p/ `0-400`/`400-800`; 70% p/ resto).
4. **Bloco `final` por banda** (mapa abaixo).
5. **`hard`→`retrieval`: investigar com teste, depois aplicar correção conservadora** (detalhe em M4.4).
6. **Métricas de eficácia: manter só display** — NÃO realimentar o plano.
7. **Atomicidade `saveProfile`/reconcile: ENTRA** (transação Dexie).
8. **Endurecer TUDO agora:** headers HTTP + allowlist de URL + pre-commit + threshold de cobertura.

---

## FASE A — Quick wins + endurecimento de borda (Cortes M1+M2)

### M1.1 — `useAppData` gera plano de boot sem `diplomaAttempts`  *(Alto × P)*
- **Onde:** `src/app/useAppData.ts:184` e `:191` — as duas chamadas a `generatePlan(...)` montam as
  options à mão e **omitem `diplomaAttempts`**, enquanto todo o resto usa `buildPlanContext`
  (`src/app/stateHelpers.ts:38`, que já inclui `diplomaAttempts`).
- **Efeito:** no primeiro load, `selectMethodTrack` ignora diploma recém-ganho até o próximo sync.
- **Fix:** trocar as duas montagens manuais por
  `buildPlanContext({ previousPlan, recentThemeStats, openedBlockIds, openPendingItems: storedPendingItems, trainingLogs: storedAllTrainingLogs, diplomaAttempts: storedDiplomaAttempts, weakThemesFromDashboard: getWeakThemesFromThemeStats(recentThemeStats) })` (confira a assinatura real em `stateHelpers.ts` e passe os argumentos que ela exige). Garanta que `storedDiplomaAttempts` está disponível no escopo (carregue-o no load se ainda não estiver).
- **Teste:** regressão provando que, no primeiro load com um `DiplomaAttempt` aprovado recente, o plano
  inicial seleciona a trilha de diploma (`'progress-diplomas'`).

### M1.2 — Teste frágil a timing  *(Médio × P)*
- **Onde:** `src/app/trainingFlow.test.tsx:65` (e quaisquer `waitFor(() => expect(screen.getByText(...)))`
  semelhantes no mesmo arquivo).
- **Fix:** trocar por `await screen.findByText(/Treinando há/i, {}, { timeout: 5000 })` (polling com
  timeout explícito). Aplique o mesmo padrão a outros `waitFor`+`getByText` frágeis do arquivo.
- **Verificação:** rode o arquivo isolado 3× (`npx vitest run src/app/trainingFlow.test.tsx`) — verde nas 3.

### M1.3 — `openExternalUrl` sem allowlist  *(Médio × P, segurança)*
- **Onde:** `src/app/externalOpen.ts:1` — abre qualquer `url: string` com `window.open`. URLs vêm do
  IndexedDB (`src/app/usePendingActions.ts:37`, `src/app/useStudyActions.ts`), que pode ser populado por
  backup importado → vetor `javascript:`/`data:`.
- **Fix:** adicionar guarda `isAllowedExternalUrl(url)` que só aceita `https://lichess.org/...`
  (use `new URL(url)` e cheque `protocol === 'https:'` e `hostname === 'lichess.org'`; rejeite o resto,
  incluindo `javascript:`/`data:`/outros hosts). Se rejeitado, **não** abra e retorne mensagem de erro
  pt-BR ("Link inválido — só abrimos páginas do lichess.org.").
- **Teste:** rejeita `javascript:alert(1)`, `data:text/html,...`, `https://evil.com/x`; aceita
  `https://lichess.org/training`.

### M1.4 — `output/playwright/` fora do `.gitignore`  *(Baixo × P)*
- **Fix:** adicionar linha `output/playwright/` ao `.gitignore`. Não commitar os PNG/JSON já untracked.

### M1.5 — Drift de doc: links de Study no backup  *(Médio × P)*
- **Onde:** `docs/privacy/privacy-and-data.md:50` diz que o backup **não** exporta links de Study, mas
  `src/infra/storage/appData.test.ts:457-459` prova que **entram** (Corte F.2).
- **Fix:** corrigir o texto: o backup **inclui** os links de Study como dado durável do usuário; o que
  **não** é exportado é o **token OAuth**. Ajuste também `:23` se houver contradição. Marque os itens de
  "Riscos a revisar" que são de P4/P5 como "fora do escopo do marco atual".

### M1.6 — Switches sem `assertNever`  *(Baixo × P)*
- **Onde:** `src/domain/sources/resourceCatalog.ts:981` (`getQualityRank`) e `:991` (`getKindRank`).
- **Fix:** adicionar `default: return assertNever(x)` (import de `../assertNever`) em ambos, garantindo
  exaustividade em compilação.

### M2.1 — Headers de segurança no deploy  *(Médio × P)*
- **Onde:** `vercel.json` (hoje só `X-Robots-Tag`).
- **Fix:** adicionar para `source: "/(.*)"`:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://lichess.org https://api.chess.com; worker-src 'self'; manifest-src 'self'; frame-ancestors 'none'; base-uri 'self'`
- **Cuidado:** a CSP **não pode quebrar** o service worker (workbox), as fontes self-hosted (fontsource)
  nem o registro do PWA. **Valide rodando `npm run build && npm run smoke:pwa`** após a mudança; se algo
  quebrar, relaxe **minimamente** (ex.: `worker-src 'self' blob:` se o workbox exigir) e **documente** no
  commit o porquê. Não use `unsafe-eval`.

### M2.2 — `__APP_VERSION__` (build rastreável)  *(Médio × P)*
- **Fix:** em `vite.config.ts`, `define: { __APP_VERSION__: JSON.stringify(process.env.npm_package_version) }`.
  Declare `declare const __APP_VERSION__: string;` em `src/vite-env.d.ts`. Exiba a versão de forma discreta
  no rodapé da tela Config (ex.: "versão 0.0.0"). Mantenha `package.json` em `0.0.0` (decisão do dono).

### M2.3 — Bloco `final` por banda  *(Alto × P, pedagogia pré-aprovada)*
- **Onde:** `src/domain/plan/generatePlan.ts` — `getBlockCopy`, `case 'final'` (hoje `weaknessTag:
  'endgame-pawn'` fixo).
- **Fix:** passar a `band: LearnerBand` para `getBlockCopy` (ou computar o tema antes e injetar). Mapa
  pré-aprovado (use **apenas** tags válidas da union `WeaknessTag`):
  - `'0-400'`, `'400-800'` → `'endgame-pawn'`
  - `'800-1000'`, `'1000-1200'` → `'endgame-rook'`
  - `'1200-1600'`, `'1600-2000'`, `'2000-2200'` → `'conversion'`
  Ajuste o `task`/`title`/`reason` do bloco para refletir o tema (ex.: "Final de torre" quando rook).
  Crie um helper `finalThemeByBand(band)` análogo a `primaryThemeByBand`.
- **Teste:** banda `0-400` → bloco final com `endgame-pawn`; banda `1000-1200` → `endgame-rook`; banda
  `1200-1600` → `conversion`.

**➡ Gate de Fase A:** `npm run lint && npm run test && npm run build && npm run coverage` verdes, e
`npm run smoke:pwa` verde (por causa da CSP).

---

## FASE B — Durabilidade & camada (Corte M3)

### M3.1 — Atomicidade `saveProfile` + plano  *(Médio × P)*
- **Onde:** `src/app/state.ts:211` (`saveStoredProfile` seguido de `savePlan` sem transação).
- **Fix:** criar `saveProfileAndPlan(profile, plan)` em `src/infra/storage/appData.ts` usando
  `db.transaction('rw', [db.profile, db.plans], ...)`, no padrão do `saveTrainingLogAndPlan` já existente.
  Trocar o callsite por essa função.
- **Teste:** atomicidade — se o `put` do plano lançar, o perfil também não persiste (ou ambos commitam).

### M3.2 — Atomicidade `reconcileLichessResults`  *(Médio × P)*
- **Onde:** `src/app/useStudyActions.ts:84-86` (loop de `saveTrainingLog` + `savePlan`).
- **Fix:** criar `saveTrainingLogsAndPlan(logs, plan)` em `appData.ts` com
  `db.transaction('rw', [db.logs, db.plans], async () => { await db.logs.bulkPut(logs); await db.plans.put(plan); })`.
  Trocar o loop por essa função.
- **Teste:** todos os logs reconciliados + plano commitam juntos (ou nenhum).

### M3.3 — Desacoplar `ui/Config.tsx` de `infra/`  *(Médio × M)*
- **Onde:** `src/ui/Config.tsx:5,7,11,12` importam direto de `infra/storage/*`
  (`appData`, `autoBackup`, `db` (`BackupMetaRecord`), `persistence`).
- **Fix:** criar `src/app/backupStatus.ts` que **reexporta** os tipos/funções que a UI precisa
  (`BackupImportResult`, `StoredPlacementResult`, `AutoBackupStatus`, `describeAutoBackupStatus`,
  `StoragePersistenceStatus`, `describePersistenceStatus`) e um DTO seguro no lugar do tipo Dexie cru
  `BackupMetaRecord`. `Config.tsx` passa a importar **só** de `../app/...`. Comportamento idêntico.
- **Teste:** `Config.test.tsx` continua verde sem importar de `infra/`.

### M3.4 — Validação de shape no import de backup  *(Médio × P)*
- **Onde:** `src/infra/storage/backup.ts:172-188` — `pendingItems`/`methodTracks`/`diplomaAttempts`
  validam só `isValidId(item.id)`.
- **Fix:** validar campos obrigatórios mínimos por tabela (ex.: `pendingItems` exige `status` válido e
  `weaknessTag`; `diplomaAttempts` exige `diplomaId`/`passed`), no mesmo estilo já usado para `plans`/`logs`.
  Rejeitar o import com mensagem clara se algum registro estiver malformado.
- **Teste:** backup com `pendingItem` sem `status` é rejeitado; backup válido passa.

**➡ Gate de Fase B:** os três verdes + testes novos de transação e de validação.

---

## FASE C — Pedagogia adaptativa (Corte M4, pré-aprovada)

### M4.1 — `observedAt` = data real da partida  *(Alto × M)*
- **Onde:** `src/infra/chesscom/chesscomClient.ts:45` carimba `observedAt = new Date().toISOString()`
  para todos os sinais → jogos antigos viram "sinal recente" e `filterFreshSignals` (90d,
  `src/domain/weakness/detectWeaknesses.ts:39`) nunca os poda.
- **Fix:** propagar a **data real** de cada arquivo mensal/partida para o `observedAt` do sinal
  correspondente (o archive do Chess.com tem ano/mês; use o fim do mês ou a data da partida quando
  disponível). Faça o mesmo onde houver carimbo análogo no caminho do Lichess, se existir.
- **Teste:** importar dois meses (um recente, um de >90 dias atrás) e provar que `filterFreshSignals`
  mantém só o recente.

### M4.2 — Puzzle→fraqueza DURÁVEL  *(Médio × M)*
- **Onde:** hoje a perda de puzzle só vira fallback episódico em `selectPrimaryWeakness`
  (`src/domain/plan/generatePlan.ts:547-561`), com `score:0, confidence:'low'`, e **não** é persistida.
- **Fix:** criar `createWeaknessFromPuzzleStats(themeStats, observedAt)` em
  `src/domain/weakness/detectWeaknesses.ts` (ou módulo vizinho) que transforma temas de puzzle perdidos
  em `Weakness` de 1ª classe (usando o mapa `weaknessTagFromPuzzleTheme` já existente em
  `puzzleThemeStats.ts`), com `confidence` apropriada e sujeito ao decaimento de 90 dias como os demais
  sinais. Integrar essas fraquezas ao conjunto persistido de `weaknesses` no fluxo de diagnóstico
  (onde `detectWeaknesses` é consumido — `useDiagnosisActions.ts`), de modo que o tutor "lembre" do tema
  entre sessões mesmo sem novos jogos. Sinal de jogo continua tendo prioridade sobre o de puzzle.
- **Teste:** após registrar perdas em um tema de puzzle, uma `Weakness` correspondente é persistida e
  sobrevive a uma regeneração de plano sem novos jogos; decai após 90 dias.

### M4.3 — `accuracy<70` Chess.com por banda  *(Médio × M)*
- **Onde:** `src/infra/chesscom/extractSignals.ts:180` (`accuracy < 70` fixo).
- **Fix:** receber a `band` em `extractSignalsFromChesscomGames` (ou computá-la antes) e usar limiar
  `band === '0-400' || band === '400-800' ? 65 : 70`. Mantenha o sinal como `kind:'accuracy'`,
  `confidence:'low'`.
- **Teste:** com banda iniciante, partida de 67% conta como baixa-accuracy; com banda alta, não.

### M4.4 — Transição de feedback `hard` no estágio `explain`  *(Baixo × P — investigar e resolver)*
- **Onde:** `src/domain/plan/generatePlan.ts:376` — `getThemeResourceStage`:
  `case 'hard': return latestThemeSignal.resourceStage === 'explain' ? 'retrieval' : 'explain';`
  Hoje, marcar `hard` **enquanto está em `explain`** AVANÇA para `retrieval` (mais difícil).
- **Fix (decisão do dono = correção conservadora):** primeiro escreva um teste de caracterização que
  documente o comportamento atual. Depois **altere para que `hard` nunca aumente a dificuldade**: em
  `explain`, `hard` deve **permanecer em `explain`** (dar mais apoio), e nos demais estágios `hard`
  continua regredindo para `explain`/`guided`. Deixe um comentário de 1 linha explicando a regra
  ("`hard` nunca avança o estágio — iniciante com dificuldade precisa de mais suporte, não de mais
  desafio") para o dono poder reverter no futuro se quiser.
- **Teste:** `feedback:'hard'` em qualquer estágio nunca retorna um estágio mais avançado que o atual.

**➡ Gate de Fase C:** os três verdes + os testes de freshness, puzzle→fraqueza, accuracy por banda e
`hard`-não-avança.

---

## FASE D — Débito de teste & processo (Corte M5)

### M5.1 — Testes diretos dos hooks de maior risco  *(Médio × M)*
- Adicionar testes `renderHook` (de `@testing-library/react`) para `useDiagnosisActions` e
  `useTrainingActions` (caminhos de sync e de conclusão de bloco). Adicionar testes unitários para
  `src/app/achievementsSync.ts` e `src/app/oauthFlow.ts` (hoje sem teste dedicado).

### M5.2 — Threshold de cobertura + smoke no CI  *(Médio × P)*
- Em `vitest.config.ts`, adicionar `coverage.thresholds: { lines: 78, functions: 85, branches: 72 }`
  (abaixo do baseline atual 82,99/89,29/76,18 para não falhar por ruído; ajuste se necessário).
- Em `.github/workflows/ci.yml`, adicionar passo `npm run coverage` e um **job separado** `smoke` que roda
  `npm run smoke:pwa` no push para `main`/`master` (instale os browsers do Playwright no job:
  `npx playwright install --with-deps chromium`).

### M5.3 — Pre-commit  *(Médio × P)*
- Adicionar `husky` + `lint-staged`: `npm i -D husky lint-staged`, `"prepare": "husky"` no `package.json`,
  `.husky/pre-commit` rodando `lint-staged`; configurar `lint-staged` para `*.{ts,tsx}` →
  `eslint --fix` e `tsc -b --noEmit` (ou `tsc --noEmit` no projeto).

### M5.4 — Limpeza de débito de código  *(Baixo–Médio × P)*
- `[input]` dep-arrays: em `useDiagnosisActions`, `usePendingActions`, `useBackupActions`, **desestruturar
  `input`** no topo e listar valores individuais nos dep-arrays (padrão que `useTrainingActions` já usa) —
  restaura a memoização.
- `isPuzzleTrainingLog` (`src/app/trainingLogFlow.ts:230-235`): trocar o match por string por um
  discriminante estrutural — adicionar `logKind: 'puzzle' | 'free-activity' | 'standard'` a `TrainingLog`
  (setado na criação) **ou** derivar de `source`+`blockId`. Migre dados antigos se necessário (nova versão
  Dexie com `upgrade` que preenche `logKind`). Mantenha os testes existentes verdes.
- Auto-sync `void` IIFE (`src/app/state.ts:233`): trocar por `Promise.allSettled` com log de erro por
  fonte (já há `try/catch` por fonte; isto é polimento).

**➡ Gate de Fase D:** os três verdes + `npm run coverage` acima do threshold + `npm run smoke:pwa` verde.

---

## Definição de "PRONTO — nada por fazer"

Ao terminar, **tudo** abaixo deve ser verdade:
- [ ] `npm run lint` — exit 0.
- [ ] `npm run test` — 100% verde, **sem flaky** (rode 3×).
- [ ] `npm run build` — exit 0 (tsc estrito + vite).
- [ ] `npm run coverage` — acima do threshold configurado.
- [ ] `npm run smoke:pwa` — verde (offline shell renderiza com a CSP ativa).
- [ ] Todos os itens M1–M5 commitados atomicamente, cada um com gate verde.
- [ ] `docs/privacy/privacy-and-data.md` sem drift.
- [ ] Nenhum item das auditorias (`consolidacao_analise_2026-06-15_v2-pos-corte-L.md` §2) permanece OPEN,
      exceto os explicitamente rejeitados no §8 ("O que NÃO fazer").

## Entregável final (um relatório só, sem updates intermediários)

Ao final, escreva `docs/review/relatorio-codex-execucao-cortes-M1-M5-2026-06-15.md` com:
1. Tabela item × commit × status (feito / desviado / bloqueado) com o SHA de cada commit.
2. Resultado dos gates finais (cole a saída de test/build/coverage/smoke).
3. Qualquer **desvio** do plano e o porquê (ex.: relaxe de CSP, migração Dexie nova).
4. Cobertura antes/depois.
5. Lista do que (se algo) ficou conscientemente fora e por quê — idealmente vazia.

**Não peça confirmação durante a execução.** Gates objetivos substituem checkpoints humanos. Só pare se
houver bloqueio externo real (ex.: a CSP quebrar o PWA e não houver relaxe mínimo seguro) — e, nesse caso,
documente o bloqueio em vez de adivinhar.
