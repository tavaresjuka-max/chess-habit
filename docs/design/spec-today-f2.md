# SPEC — Fase 2: separar administração de ação (Today só ação; resto → Progresso)

Aprovado pelo dono 2026-06-30. Regra: **a tela Hoje mostra só a AÇÃO; metas, trilha, ritmo, diagnóstico e sync vão para a tela Progresso.** Continuação do action-first (ver spec-today-action-first.md). Branch `feat/today-action-first`.

## Objetivo
Remover o `<aside>` (sidebar de 5 folds) da tela Hoje. Mover os cards ÚNICOS (Metas, Trilha, Sincronizar) para a tela Progresso. Ritmo e Diagnóstico já existem em Progresso → apenas remover do Today (não duplicar).

## NON-GOALS
- NÃO alterar a LÓGICA dessas features (sync, milestones, currículo) — só MOVER a renderização e re-passar props/handlers.
- NÃO mexer no fluxo de treino (hero, carrossel, PlanBlockCard), na proposta de plano, nem no PendingReviewCard do Today.
- NÃO mudar tipos de domínio. NÃO adicionar dependências.
- `onReconcileLichessResults` PERMANECE no Today (usado pelo TutorCard) — NÃO mover.
- `sessionMilestoneSummary` e `learnerBand` CONTINUAM computados/usados no Today (o hero usa para os chips checkpoint/sessões) — NÃO remover do Today.

## Mapa atual (fatos do código)
- Today.tsx sidebar `<aside>` ≈ linhas 624–773: folds Metas (SessionMilestonesCard), Trilha (CurriculumCard), Ritmo (inline, usa weeklyDigest), Diagnóstico (inline, weakness chips top 3), Sincronizar (inline diagnosis-strip).
- Computados no Today: weeklyDigest (≈256), sessionMilestoneSummary (≈257), nextDiploma (≈259).
- Progress.tsx props hoje: `today, allTrainingLogs, diplomaAttempts, achievements, weaknesses, signals`. Já tem folds: Ritmo, Habilidades, Esforço, Diplomas, Conquistas, Linha base, Onde ainda trava.
- SessionMilestonesCard props: `summary: SessionMilestoneSummary; openPendingCount?; nextDiploma?; hideHeading?`.
- CurriculumCard props: `band: LearnerBand | undefined; weeklyFocusTag: WeaknessTag | undefined; hideHeading?`.
- App.tsx passa a Progress só dados de análise; passa a Today ~28 props incl. handlers de sync.

## Escopo (o que fazer)

### Today.tsx
1. Remover todo o `<aside>` (os 5 folds Metas/Trilha/Ritmo/Diagnóstico/Sincronizar).
2. Remover computações que ficaram SÓ para a sidebar: `weeklyDigest` e `nextDiploma` (se não usados em outro lugar — confirmar com busca). MANTER `sessionMilestoneSummary` e `learnerBand` (usados pelo hero).
3. Remover do destructuring e do tipo `TodayProps` os props/handlers que passam a ser exclusivos de Progresso e não são mais usados no Today: `onSyncChesscomDiagnosis`, `onSyncLichessDiagnosis`, `onConnectLichess`, `onCreateLichessStudy`, `diagnosisState`, `diagnosisMessage`, `lichessConnected`, `lichessConnectionState`, `lichessMessage`, `lichessStudyLink`. (Confirmar via busca que nenhum é usado fora da sidebar antes de remover; se algum for, manter.)

### Progress.tsx
4. Adicionar a `ProgressProps`: `sessionMinutes: number; learnerBand: LearnerBand | undefined; weeklyFocusTag: WeaknessTag | undefined; pendingItems: PendingTrainingItem[]; plan?` (o que for necessário p/ computar) + estado de sync (`diagnosisState, diagnosisMessage, lichessConnected, lichessConnectionState, lichessMessage, lichessStudyLink`) + handlers (`onConnectLichess, onSyncChesscomDiagnosis, onSyncLichessDiagnosis, onCreateLichessStudy`).
5. Computar em Progress (do mesmo jeito que o Today faz hoje — copiar a chamada): `sessionMilestoneSummary` (buildSessionMilestoneSummary) e `nextDiploma`.
6. Adicionar novas seções/folds em Progress, em ordem coerente (sugestão: Metas no topo do bloco de progresso, depois Trilha; Sincronizar por último): SessionMilestonesCard (Metas), CurriculumCard (Trilha), e o bloco de sync (mover o JSX do diagnosis-strip do Today para cá, com os mesmos handlers).

### App.tsx
7. Passar a `<Progress/>` os novos dados/handlers (sessionMinutes, learnerBand, weeklyFocusTag de plan.weeklyFocus?.tag, pendingItems, plan se preciso, estado+handlers de sync).
8. Parar de passar a `<Today/>` os props removidos no passo 3.

### Testes
9. Atualizar Today.test.tsx (remover asserts/props da sidebar se houver) e Progress.test.tsx (cobrir as seções movidas: presença de Metas/Trilha/Sincronizar, e que sync handlers disparam). Adicionar props novas nos renders de teste de Progress.
10. Buscar e corrigir QUALQUER teste de integração que sincronizava a PARTIR da tela Hoje (ex.: clicar "Atualizar Lichess"/"Conectar Lichess" no Today) — agora isso vive em Progresso.

## Critérios de aceite (binários)
1. A tela Hoje NÃO renderiza mais a sidebar (`<aside>` removido); o conteúdo da view Hoje termina no fluxo de ação (hero, carrossel, proposta/pending, TutorCard).
2. A tela Progresso renderiza Metas (SessionMilestonesCard), Trilha (CurriculumCard) e Sincronizar (controles de sync funcionais com os mesmos handlers).
3. Nenhuma feature perde função: sync, milestones e trilha funcionam em Progresso (handlers disparam).
4. `onReconcileLichessResults`, `sessionMilestoneSummary` e `learnerBand` continuam no Today (hero/TutorCard intactos).
5. Sem props órfãos: nada que App passe a Today fica sem uso; nada que Progress use fica sem ser passado.

## Gates (árbitro)
`npm run build` (tsc -b) + `npm test` (vitest) + `npm run lint` — todos verdes. GLM ajusta os testes afetados.

## Revisão de risco (Opus, pós-gates)
(a) Nenhuma feature de sync/milestone/trilha perdeu função (handlers ligados em Progress). (b) Today não ficou com props órfãos nem perdeu hero/TutorCard. (c) Computação de sessionMilestoneSummary/nextDiploma replicada corretamente (funções puras). (d) Sem mudança de lógica de domínio.
