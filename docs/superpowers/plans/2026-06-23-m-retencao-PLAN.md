# M-Retenção — PLANO EXECUTÁVEL (decisões fechadas)

> Executor: Sonnet 4.6 (TDD). NÃO commitar (Opus commita após revisar risco).
> Gates ao fim: `npm run test`, `npm run lint`, `npm run build`.

## Decisão central (council DeepSeek+GLM 2026-06-23, aprovada pelo dono)
O contador "dias seguidos" é o RISCO: vira placar e pune na quebra → evitação no
TDAH. **Trocar por ACUMULAÇÃO** (sessões que se juntam, nunca "quebram") +
**marca inline sóbria** (nunca modal). Tom Lemos: SEM 'parabéns', sem confete,
sem ícone festivo, sem cor de alarme. Constatação calma, não celebração.

## Realidade (reuso — NÃO recriar)
- `computeConsistency(logs, today)` em `src/domain/metrics/consistency.ts:13` já dá
  `currentStreakDays`, `longestStreakDays`, `daysSinceLastSession`, `returnedAfterGap`.
- Streak hoje exibido em `src/ui/Today.tsx:347-352` (texto "X dias seguidos" se ≥2) — É ISSO que vamos SUBSTITUIR.
- Re-entrada: `buildReturn()` / `buildReturnRecalibrationNote()` / `getReturnSessionMinutes()` em `src/domain/coach/`.
- `BANNED_PHRASES` em `src/domain/coach/sessionMessage.ts:12` — toda copy nova passa por aqui.
- Storage: derivar de `logs` (status 'done') por `date`. SEM nova tabela.

## Task 1 — Domínio: acumulação (TDD)
**Arquivo novo:** `src/domain/metrics/recentActivity.ts` (+ teste).
`computeRecentActivity(logs, today, windowDays = 14)` → 
```
{ todayMinutes: number; weekSessions: number; recentDays: { date: string; active: boolean }[] }
```
- `recentDays`: os últimos `windowDays` (inclusive hoje), em ordem cronológica; `active` = houve ≥1 log status 'done' naquele dia. Dia sem sessão = `active:false` (espaço em branco, NÃO "quebra").
- `weekSessions`: nº de DIAS distintos com sessão nos últimos 7 dias.
- `todayMinutes`: soma de `elapsedSeconds`/60 (arredondado) dos logs 'done' de hoje.
Testes: janela com buracos (dias inativos viram blank, não resetam nada); virada de semana; sem logs (zeros); fuso local (usar a MESMA convenção de data local de consistency.ts, não UTC).

## Task 2 — Copy (tom Lemos, passa BANNED_PHRASES)
**Arquivo:** `src/domain/coach/` (onde fizer sentido — provável `sessionReport.ts` ou um novo `retentionCopy.ts`).
- **Marca de marco (inline, 1x):** quando `currentStreakDays === longestStreakDays && currentStreakDays >= 3`, emitir UMA linha sóbria, ex.: "Esta é a sua sequência mais longa até aqui." (sem '!', sem ícone). Em dia normal: nada.
- **Rodapé factual:** ex.: "Hoje: {min} min · Esta semana: {n} sessões." Puro fato, sem juízo.
- **Re-entrada:** garantir que ao voltar (`returnedAfterGap`, gap ≥2) aparece UMA ação clara + copy sem-vergonha (reusar `buildReturn`). NÃO inventar frase nova punitiva.
- TODA string nova precisa de um teste que a passe por `BANNED_PHRASES`.

## Task 3 — UI: faixa de acumulação (substitui o contador)
**Arquivo:** `src/ui/Today.tsx` (bloco 347-352) + componente novo se ajudar (ex.: `src/ui/AccumulationStrip.tsx`).
- REMOVER o texto "X dias seguidos".
- ADICIONAR uma faixa horizontal sóbria: os `recentDays` como blocos pequenos monocromáticos; ativo = preenchido, inativo = vazio/contorno. Sem números grandes, sem chama, sem cor de alerta. Acessível (aria-label tipo "12 de 14 dias com treino").
- Abaixo, o rodapé factual (Task 2).
- A marca de marco (Task 2) entra no relatório do dia (perto de `Today.tsx:205-221`, onde já aparecem conquistas sóbrias) — como linha de texto, mesmo estilo das conquistas.
- Respeitar `prefers-reduced-motion` (sem animação de "enchimento").

## NON-GOALS
- Sem modal/confete/badge persistente/'parabéns'. Sem notificação push.
- Sem heatmap/calendário completo (a faixa de 14 dias é o MVP; calendário cheio = fase 2).
- Não tocar M2a / DD-Ped6 / gating de estágio / pedagogia.
- Sem nova tabela Dexie.

## Critérios de aceite (binários)
- `computeRecentActivity` coberto (buracos, semana, vazio, fuso).
- "X dias seguidos" não aparece mais; faixa de acumulação + rodapé factual no lugar.
- Marca de recorde aparece só quando bate recorde (teste), 1x por estado, e some em dia normal.
- Toda copy nova passa em `BANNED_PHRASES` (teste).
- `npm run test && npm run lint && npm run build` verdes; E2E existentes seguem verdes (o teste E2E de "streak" pode precisar de ajuste — atualizar, não burlar).

## Regras
- NÃO commitar, NÃO deploy, NÃO git. Se um teste revelar bug REAL na produção, PARAR e reportar.
- RELATÓRIO curto: arquivos criados/modificados; nº de testes antes/depois; gates PASS/FAIL; qualquer ajuste em E2E; desvios do plano.
