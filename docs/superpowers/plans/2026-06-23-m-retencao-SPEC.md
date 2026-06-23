# M-Retenção — SPEC (rascunho p/ aprovação)

> Decisão do dono + council 2026-06-23: a milestone de maior valor para o aluno
> TDAH é RETENÇÃO (voltar a abrir o app), não diagnósticos visíveis.

## Realidade descoberta (Explore)
A FUNDAÇÃO JÁ EXISTE — milestone é ~80% UI/copy, sem nova tabela:
- `computeConsistency()` (`src/domain/metrics/consistency.ts:13`): `currentStreakDays`,
  `longestStreakDays`, `daysSinceLastSession`, `returnedAfterGap` (gap ≥ 2).
- Streak já exibido em `Today.tsx:347-352` (só texto, se ≥ 2 dias).
- Re-entrada: `buildReturn()` "Sem cobrança. O tabuleiro espera." + `buildReturnRecalibrationNote()`
  (≥ 7 dias) + `getReturnSessionMinutes()` reduz p/ 15 min pós-gap.
- Tom Lemos: `BANNED_PHRASES` inclui **'parabéns'**; sem confete; sóbrio/acolhedor.

## Goal
Dar PESO ao que já é calculado: reforço imediato (fechar a sessão "conta") +
re-entrada sem vergonha — dentro do tom Lemos (sem 'parabéns', sem confete).

## NON-GOALS
- Sem nova tabela Dexie (streak é derivado de `logs` por data).
- Sem confete / 'parabéns' / badges estilo jogo casual (viola BANNED_PHRASES).
- Sem notificação push (PWA local, sem backend).
- Não tocar M2a / DD-Ped6 / gating de estágio / pedagogia.
- Sem heatmap/calendário de consistência (candidato a fase 2).

## Escopo MVP (a confirmar no pacote de aprovação)
1. **Marco de streak sóbrio:** quando o aluno bate um novo recorde (`longestStreakDays`)
   ou cruza um marco (ex.: 3/7/14 dias), uma marca SÓBRIA (sem 'parabéns') — formato
   a decidir (linha no relatório do dia vs modal leve 1x).
2. **Re-entrada sem vergonha reforçada:** ao voltar após pausa, UMA ação clara +
   "continue de onde parou", zero punição. Avaliar estender o "recomeço leve" do
   gap ≥ 7 para o range curto (≥ 2 dias).
3. **Fechamento diário satisfatório:** tornar visível que a sessão de hoje "contou"
   para o streak (peso imediato), sem épico.

## Critérios de aceite (binários)
- Novo recorde de streak dispara a marca SÓBRIA exatamente 1x (não repete).
- Toda mensagem nova passa no guard `BANNED_PHRASES` (teste).
- Re-entrada mostra ação única + copy sem-vergonha (teste de fluxo).
- `npm run test && npm run lint && npm run build` verdes + E2E existentes verdes.

## Decisões de produto pendentes (pacote de aprovação)
- A) Formato do marco: inline sóbrio vs modal leve 1x vs ambos.
- B) Re-entrada: estender recomeço-leve do gap ≥7 para ≥2, ou manter ≥7.
- C) Peso visual do streak: número sóbrio (atual) + marco vs ícone/chama discreto.
