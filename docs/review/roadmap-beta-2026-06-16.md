# Roadmap até o Beta Público — lichess-tutor / "Rotina"

**Data:** 2026-06-16 · **Autor:** Claude (Opus 4.8) · **Aprovação de escopo:** dono, 2026-06-16
**Alvo:** beta público com sync multi-dispositivo (P4) + versão-comunidade (P5) + todas as features.

Este documento é o plano-mestre. O prompt de execução autônoma do Codex está em
`prompts/codex-overnight-beta-2026-06-16.md` e referencia os milestones daqui.

---

## 0. Estado atual (auditoria 360° de 2026-06-16)

P0–P3 concluídas; cortes 0–7 + pacote M1–M5 fechados. App em produção em
`rotina-pied.vercel.app`. ~611 testes, cobertura ~86% stmts / ~80% branches / ~90% funcs.
Stack: React 19 + TS estrito + Vite + Dexie 4 (IndexedDB v11) + PWA Workbox. Local-first.

**Bugs/lacunas reais que a auditoria encontrou (entram na Fase A):**

1. **Diagnóstico Chess.com mudo** — 294 sinais reais → **zero fraquezas**. Limiares de `judgment`
   (>30%/50% blunders) e `clock` (10 jogos, 2 timeouts) foram calibrados para Lichess; Chess.com
   (que não dá blunders, só accuracy agregada) cai fora silenciosamente. **É a queixa do dono.**
2. **`addDays` off-by-one em `pendingItems.ts`** — usa `setDate` (hora local); a auditoria aponta
   off-by-one em GMT-3 (não só DST). Distorce todo o espaçamento adaptativo. (O teste atual usa UTC e
   mascara.) → investigar com teste que reproduz GMT-3, corrigir para `setUTCDate` + injetar `nowFn`.
3. **Pedagogia adaptativa morta** — `computeMastery` é calculado mas **não conectado** ao
   `generatePlan`; trilha `progress-diplomas` existe em `selectMethodTrack` mas nunca ativa.
4. **Race condition no sync** — `saveProfile` dispara Chess.com + Lichess em `Promise.allSettled`;
   ambos chamam `replaceWeaknesses` independente → o segundo sobrescreve o primeiro.
5. **`buildPuzzleThemeStats` double-counting** — dashboard + activity do mesmo período somam 2×.
6. **`clearAllData` não cancela operações in-flight** — sync em progresso reescreve banco recém-limpo.
7. **Backup incompleto** (10/16 tabelas no envelope) e **sem `migrateBackup`** — schema bump futuro
   quebra import de todos os backups antigos, sem recuperação.
8. **5 hooks de orquestração sem teste unitário** (`useOAuthActions`, `useStudyActions`,
   `useBackupActions`, `usePlanLifecycleActions`, `usePendingActions`) + `resourceSelector`,
   `learningPlanProposal` (com bug `getEvidenceLevel`), `progressOverview`, `curriculum`,
   `coachCatalog`, `trainingSession` sem teste direto.
9. **`getEvidenceLevel`** rotula low-confidence com score≥0.5 como "média".
10. **`observedAt` Chess.com** — confirmar se usa `end_time` da partida (senão sinais nunca decaem).

---

## 1. Decisões travadas (dono, 2026-06-16)

| # | Decisão | Valor |
|---|---|---|
| D1 | Escopo | P4 sync + P5 comunidade + todas as features |
| D2 | Login do sync | **Entrar com Lichess** (identidade OAuth, sem escopo de jogo) |
| D3 | Backend | Codex **constrói + testa local** (Workers/D1, wrangler/miniflare); **dono provisiona** depois |
| D4 | Privacidade do sync | **Cifrado ponta-a-ponta** (chave do login nunca sobe; tokens só no aparelho) |
| D5 | Deploy ao fim da noite | **Só commits** — dono revisa e deploya |
| D6 | Features liberadas | Todas, com teste máximo + jogar o fluxo + corrigir **antes de trocar de fase** |
| D7 | Nome público | **"usar outro nome"** — PENDENTE; até lá `APP_NAME='Rotina'` roteado por 1 ponto |

## 2. Restrições que PERSISTEM (não afrouxam com P4/P5)

Clean-room (zero linha de ChessKing); sem scraping (só APIs oficiais); sem tabuleiro próprio; sem
ajuda em partida ao vivo; OAuth só `puzzle:read`+`study:write` (sync adiciona só identidade), tokens
locais; rate-limit Lichess 1 req/vez, 429→≥1min; **PGN transiente, nunca persistir**; sem PII de
perfil; AGPL-3.0 (Juka Tavarez); sem promessa de rating ("fraqueza como hipótese"); sem engine.
Currículo denso 1200-2200 (Corte 8) segue **bloqueado** pelo gate de eficácia ~2026-07-08.

---

## 3. Milestones (M1–M15)

Cada milestone tem **Gate objetivo** que substitui checkpoint humano. Ninguém avança sem o gate verde
**+ o Protocolo de QA da §4** (testar + jogar o fluxo com prints + corrigir).

### Fase A — Fundação: teste profundo, caça-bugs, segurança

**M1 — Harness E2E com prints (Playwright)**
- Escopo: expandir `e2e/` para cobrir TODOS os fluxos com screenshots por etapa:
  onboarding (7 perfis: só-Lichess c/ e s/ OAuth, só-Chess.com, ambos, muitos dados, sem conta, poucos
  jogos), Hoje (treino start→timer→completar→feedback→log), reconciliar puzzles, Config (perfil/OAuth/
  backup/clear), Progresso, export/import de backup, callbacks OAuth (sucesso/cancelado), offline/PWA.
  Visual snapshots (baseline). Mover smoke+E2E para rodar em PRs no CI.
- Gate: `npm run smoke:pwa` + nova suíte E2E verdes; screenshots gerados em `e2e/__screenshots__/`.

**M2 — Profundidade de teste unitário**
- Escopo: `renderHook` para os 5 hooks sem cobertura; teste direto de `resourceSelector` (matriz
  tag×stage×band×minutos), `learningPlanProposal`, `progressOverview`, `curriculum`, `coachCatalog`,
  `trainingSession`, `knownManualSignals`, `puzzleThemeStats`; edge cases de `oauthFlow` (state
  mismatch, sessionStorage corrompido, erro de troca), `useDiagnosisActions` (lichess sync, syncing→
  error, race), `useTrainingActions` (start/skip).
- Gate: cobertura **≥ 85% branches** (sobe de ~80%); todos os testes verdes.

**M3 — Caça-bugs adversarial + fixes reais**
- Escopo (bugs da auditoria, TDD — teste que reproduz primeiro): `addDays` off-by-one (GMT-3);
  `buildPuzzleThemeStats` double-count; race condition `runDiagnosisSync` (singleflight/mutex em
  weaknesses); `clearAllData` cancelar in-flight; `getEvidenceLevel` (confidence antes de score);
  confirmar `observedAt`=end_time; **backup completo (16 tabelas) + `migrateBackup` v1→v2**; validação
  de shape no import (enum `signal.kind`/`weakness.tag`) + guard de tamanho antes do `JSON.parse`.
- Gate: cada bug com teste de regressão; suíte verde; build verde.

**M4 — Hardening de segurança para exposição pública**
- Escopo: rodar o prompt de auditoria de segurança por **agente fresco** (sem viés); apertar CSP;
  `npm audit` + revisão de deps; revisar allowlist `openExternalUrl`; `Retry-After`-aware cooldown +
  jitter no `providerQueue`; runtime cache `art/*.webp` (Workbox CacheFirst) reduzindo o install do SW;
  auditoria final no-PGN/no-PII/no-token em logs/bundle/backup.
- Gate: auditoria sem findings de severidade alta; build + smoke verdes.

### Fase B — Pedagogia que faz o produto funcionar

**M5 — Diagnóstico Chess.com que FUNCIONA (a queixa do dono)**
- Escopo: `detectWeaknesses` **Chess.com-aware por SourceId** — limiares próprios para o dataset de
  accuracy agregada do Chess.com, de modo que 294 sinais gerem fraquezas reais por tema (não só
  `blunder-rate low`). Garantir `observedAt`=end_time. Mensagem do diagnóstico explica o que falta
  quando ainda não há sinal concentrado (já melhorado no onboarding; estender ao Hoje).
- Gate: teste com fixture de 294 sinais Chess.com → ≥1 fraqueza temática; E2E do perfil só-Chess.com
  mostra diagnóstico real (com print).

**M6 — Mastery vivo + diplomas conectados**
- Escopo: conectar `computeMastery` ao `generatePlan` (`masteryTargetFromCompletedLog` enviesa o stage
  do próximo bloco de tema); ativar `progress-diplomas` em `selectMethodTrack` após diploma recente;
  espaçamento adaptativo real (SM-2 simplificado) ligado na conclusão de bloco; badge "Diplomado".
- Gate: testes provando advance/regress de stage por mastery e ativação da trilha pós-diploma.

**M7 — Puzzle→fraqueza durável + eficácia persistida**
- Escopo: persistir resultado de bloco de puzzle como sinal `WeaknessTag` com decay 90d (alimenta
  `selectMethodTrack` sem depender de OAuth); `EfficacyBaseline` snapshot na weekly digest + comparação
  before/after no Progress (habilita o gate de eficácia de ~2026-07-08).
- Gate: round-trip de storage testado; painel mostra before/after (print).

### Fase C — Conteúdo, gamificação, insights, acessibilidade, UX

**M8 — Currículo & conteúdo**
- Escopo: coach notes específicas por tag para os 6 temas prioritários (fork já tem; + hanging-piece,
  mate-in-2, endgame-pawn, discovered, opening-principles); trilha **"Finais Essenciais"**
  (endgame-as-plan) análoga a opening-as-plan; `knownManualSignals` 5→9+ tags; ampliar
  `puzzleThemeLabel` (20→cobertura maior); implementar `avoidWhen` no selector (hoje ignorado).
  **Currículo denso 1200-2200 (Corte 8): só scaffold + TODO marcado — bloqueado pelo gate de eficácia.**
- Gate: testes de conteúdo; nenhum tema cai em fallback silencioso.

**M9 — Gamificação & conquistas**
- Escopo: marcos elásticos 100h/500h/1000h (sem streak punitivo); novos badges de esforço/hábito;
  reforço de progresso no Hoje/Progresso.
- Gate: testes de conquista; E2E com print das celebrações sóbrias.

**M10 — Insights & métricas visíveis**
- Escopo: accuracy por tema no Today (via `buildSkillMap`); painel Progresso mais profundo (tendências,
  eficácia por tema, before/after, tempo até retorno).
- Gate: testes de métricas; print do painel.

**M11 — Acessibilidade + i18n base + polimento UX**
- Escopo: auditoria a11y completa (navegação por teclado, ARIA, contraste AA, foco gerenciado em todas
  as telas/dobras); extração de strings p/ base i18n; estados vazios/erro consistentes; performance
  percebida; offline banner (consumir `offlineReady`); `npm run deploy` encapsulando o prebuilt.
- Gate: axe-core sem violações sérias; E2E de teclado; build verde.

### Fase D — Sync multi-dispositivo (P4)

**M12 — Backend Cloudflare Workers + D1 (local-only)**
- Escopo: novo pacote `backend/` (ou `worker/`) com schema D1, API `push`/`pull` de blobs E2EE, auth
  **Sign-in-with-Lichess** (validar identidade via token do usuário, escopo mínimo), storage de blobs
  cifrados (servidor não lê). Rodar com **wrangler/miniflare local + testes**. **NÃO provisionar
  nuvem, NÃO criar conta, NÃO tocar secrets de prod.** Escrever `DEPLOY-BACKEND.md` (runbook do dono).
- Gate: testes do worker passam em miniflare; runbook completo.

**M13 — Engine de sync no cliente**
- Escopo: motor de sync no app (push/pull; resolução de conflito por `updatedAt` + merge; derivação de
  chave **E2EE** a partir da identidade Lichess — chave nunca sai do aparelho; **tokens OAuth NÃO
  sobem**); offline-first com reconciliação; UI de Config (status, "sincronizar agora", on/off).
- Gate: testes de conflito/merge/cifragem; E2E simulando 2 aparelhos (com print).

### Fase E — Comunidade / beta público (P5)

**M14 — Rename público + conformidade**
- Escopo: aplicar `APP_NAME` em manifest, títulos, README, disclaimers; disclaimer de não-afiliação ao
  Lichess; AGPL à mostra; link de doação (placeholder); doc `privacy-and-data` atualizado; revisão de
  copy pública (sem promessa de rating). **Usa `APP_NAME='Rotina'` até o dono fornecer o nome final.**
- Gate: nenhuma string `lichess-tutor` externa; build verde.

**M15 — Prontidão beta**
- Escopo: página sobre/landing simples; onboarding para usuário público de 1ª vez; canal de feedback;
  auditoria final de segurança + E2E completo + prints; release notes; checklist "beta-ready".
- Gate: checklist completo; suíte + E2E + smoke verdes; relatório final.

---

## 4. Protocolo de QA por milestone (obrigatório antes de avançar)

O dono pediu: **"testando tudo ao máximo, jogando e arrumando na hora antes de mudar de fase."** Então,
para FECHAR qualquer milestone:

1. **Gates de código:** `npm run lint && npm test && npm run build` verdes. `npm run coverage` ≥
   thresholds. `npm run smoke:pwa` verde.
2. **Testes E2E com prints:** rodar a suíte Playwright; gerar/atualizar screenshots dos fluxos tocados
   pelo milestone; anexar caminhos no commit/relatório.
3. **"Jogar o fluxo":** dirigir o app real (Playwright headed ou dev server) pelo caminho que o
   milestone alterou — onboarding até o Hoje, iniciar um bloco, completar com feedback, reconciliar —
   e **conferir o resultado nos prints**. Achou regressão visual/comportamental → **corrige antes de
   avançar.**
4. **Caça-bug do milestone:** revisão adversarial do diff (não alucinar — traçar input→output errado
   antes de reportar). Corrigir reais.
5. **Commit atômico** com o que mudou, arquivos, verificações e riscos remanescentes.

## 5. Registro de riscos (da auditoria)

- `addDays` GMT-3 afeta TODO o espaçamento adaptativo → prioridade máxima em M3.
- Sync E2EE: derivação de chave a partir da identidade Lichess precisa ser determinística por usuário
  sem expor a chave; revisar antes de M13.
- Gate de eficácia ~2026-07-08 (n=1) pode bloquear Corte 8 → currículo 1200-2200 fica em scaffold.
- Backup incompleto + sem migração = dataset único do dono em risco → M3 resolve antes de qualquer
  schema bump do sync (M12/M13).
- Provisionamento de nuvem fica com o dono (D3) → o run NÃO depende de credenciais; nunca trava.

## 6. Expectativa realista de uma noite

O Codex vai milestone-a-milestone, em ordem, com gate em cada um. Uma noite **não** entrega P5 público
com backend no ar — mas deve fechar a **Fase A** inteira e provavelmente entrar na **B/C**, deixando
tudo commitado e verde. Para num milestone verde quando acabar a noite; o dono revisa de manhã e
deploya (D5).
