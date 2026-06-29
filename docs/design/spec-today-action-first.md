# SPEC — Fase 1: Tela "Hoje" action-first

Origem: council 2026-06-29 (DeepSeek V4 Pro + GLM 5.2 + Fugu Ultra), adjudicado por Opus, mockup v3 aprovado pelo dono. Ver memory `ux-action-first-decision`.

## Objetivo (1 frase)
A tela Hoje deixa de ser um painel de administração e passa a abrir ACTION-FIRST: faixa de progresso fixa no topo, retrato grande do Tavarez, e UM card de "missão de agora" com botão primário "Treinar agora" — tudo acima da dobra, sem rolar.

## NON-GOALS (anti-deriva — NÃO fazer nesta fase)
- NÃO alterar a lógica de seleção de treino, o agendador SR/SM-2, nem os tipos de dados (`PlanBlock`, `PendingTrainingItem`, etc.).
- NÃO mexer no fluxo de aprovar/revisar plano (`LearningPlanProposalCard` continua como está).
- NÃO refatorar a sidebar nem `Progress.tsx` (isso é Fase 2).
- NÃO remover o fluxo de treino real (`BlockCarousel`/`PlanBlockCard` com timer/rating) — ele continua sendo o que abre ao treinar.
- NÃO adicionar dependências novas. NÃO mudar paleta/fontes (reusar tokens de `index.css`).
- NÃO inventar handler de treino novo — REUSAR o handler que o botão de abrir/treinar do `PlanBlockCard` já usa para `heroBlock`.

## Escopo (o que fazer)
1. Criar componente novo `src/ui/TodayHero.tsx` (isolado, testável) — consome valores JÁ computados em `Today.tsx`, não recalcula regra de negócio.
2. Adicionar CSS do componente em `src/index.css` (reusar variáveis existentes).
3. Integrar `<TodayHero/>` como PRIMEIRO elemento do conteúdo da view Hoje em `Today.tsx`.
4. Remover o bloco do `TutorCard` herói standalone do topo do Today (o papel de retrato+fala passa pro TodayHero) — evitar retrato duplicado. Manter `TutorCard` se for usado em outro lugar; só remover a instância redundante do topo.
5. Criar teste `src/ui/TodayHero.test.tsx`.
6. Atualizar `Today.test.tsx` se a remoção do topo quebrar asserts.

## Contrato de dados (já existe em Today.tsx — passar como props para TodayHero)
- Missão: `heroBlock: PlanBlock | undefined` (Today.tsx:245). Campos: `.title`, `.estimatedMinutes`, `.coachNote`, `.destination`.
- Progresso do dia: `doneBlockCount` (Today.tsx:247) e `allBlocksOrdered.length` (Today.tsx:239).
- Sequência: `consistency.currentStreakDays` (Today.tsx:209).
- Faixa: `learnerBand` (Today.tsx:60), ex. `'800-1000'`.
- Fila de revisão (Fugu #3): derivar `dueItems = pendingItems.filter(isDueToday)` — `pendingItems` (Today.tsx:63), `isDueToday` de `method/pendingItems.ts` (usado em PendingReviewCard.tsx:13). Usar `dueItems.length`.
- Checkpoint: `sessionMilestoneSummary` (Today.tsx:255) → `.currentMilestone.targetHours/targetSessions`, `.nextCheckpoint`.
- Retrato: componente `TavarezPortrait` (TutorCard.tsx:44) com prop `pose`; imagem `/art/tavarez-pose-{pose}.webp`. Para o herói usar pose adequada (ex.: `poseFor(...)` já existente) e renderizar GRANDE.

## Critérios de aceite (binários)
1. O PRIMEIRO elemento renderizado na view Hoje é a faixa de progresso (sequência + `doneBlockCount/total` + faixa). Visível sem rolar.
2. A faixa mostra a VERDADE da fila: se `dueItems.length > 0`, exibe badge "N vencidas"; se 0, oculta o badge. (Fugu #3 — progresso não pode mentir.)
3. Retrato do Tavarez renderizado GRANDE no herói (≥ 110px de lado), com `alt` descritivo.
4. Card "missão de agora" vem de `heroBlock`: título, "≈ N min" (de `estimatedMinutes`), e a fala do coach (`coachNote`). Se `heroBlock` for `undefined` (dia concluído), mostrar estado "concluído" com mensagem positiva, sem botão de treinar.
5. Botão primário "Treinar agora" dispara a MESMA ação de abrir/treinar `heroBlock` que o fluxo atual usa (reuso de handler; zero lógica nova de treino).
6. Botão secundário (fantasma) "Trocar o foco de hoje" acima da dobra → revela/abre a lista de blocos ou o seletor de sessão JÁ existentes (reuso). É o escape do Fugu #1.
7. Três chips glanceable: "a recuperar" (`dueItems.length`), "checkpoint" (de `sessionMilestoneSummary`), "sessões" (restantes). NÃO escondidos atrás de clique.
8. No MÁXIMO UM `<details>`/Fold na região do herói ("Como montei seu plano"). Não múltiplos accordions.
9. Tema: tokens existentes de `index.css` (verde/papel/creme), títulos em `var(--font-display)` (Fraunces). Faixa do topo escura (verde profundo). Sem gradiente novo, sem cor fora dos tokens.
10. a11y: faixa de progresso nunca atrás de clique; botões com rótulo claro; retrato com alt; contraste AA.

## Gates (árbitro objetivo — devem passar)
- `npm run build` (inclui `tsc -b`) sem erro de tipo.
- `npm test` (vitest) verde, incluindo o novo `TodayHero.test.tsx`.
- `npm run lint` sem erro.
- Teste novo cobre: render da faixa, badge de vencidas só quando >0, card de missão a partir de heroBlock, estado "concluído" quando heroBlock undefined, presença dos botões treinar/trocar.

## Revisão de risco (Opus, pós-gates)
Opus revisa SÓ: (a) o reuso correto do handler de "Treinar agora" (não duplicou/alterou lógica de treino), (b) o cálculo de `dueItems` (semântica de vencidas correta), (c) que NON-GOALS foram respeitados (nada de Progress.tsx/sidebar/tipos). Resto: gates decidem.
