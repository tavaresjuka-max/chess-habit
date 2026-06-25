# SPEC — P1: âncora de banda pelo rating verificado do Chess.com

## Contexto (decisão fechada do council 2026-06-25)
Ancorar a banda no RATING EXTERNO VERIFICADO. O Lichess já tem isso
(`src/domain/placement/lichessBand.ts` → `bandFromLichessGameRatings`, aplicado no M2a
em `src/app/useDiagnosisActions.ts`). O Chess.com NÃO: hoje o rating do Chess.com só vira
"signal" genérico de fraqueza, nunca ancora a banda. Um usuário só-Chess.com fica sem
âncora de rating → banda potencialmente mal-calibrada (o confound que contamina a medição
de eficácia).

## Objetivo
Dar ao Chess.com o MESMO mecanismo de âncora do Lichess: rating verificado do Chess.com →
banda, aplicado no caminho de sync/import do Chess.com, **só sobe**, confidence alta.

## Teste primeiro (vitest — TDD obrigatório)
1. **Unidade** — `bandFromChesscomRating(rating, format)` novo (em `src/domain/placement/`,
   espelhando `lichessBand.ts`):
   - rapid/blitz **não-provisório** → banda, via `bandFromEstimate(rating - OFFSET)`.
   - Asserta vários ratings cobrindo a espinha 0-2400, preferência de formato, e que
     rating provisório é ignorado.
2. **Integração** — no caminho de import/sync do Chess.com, a banda derivada do rating
   verificado promove o perfil (**só sobe**; pega a MAIOR entre banda atual e derivada).
   Asserta: banda baixa + rating Chess.com alto verificado → banda sobe; rating baixo →
   **não desce**; sem conta/provisório → não mexe.

Rode SÓ esses testes e confirme VERMELHO antes do fix.

## Offset (provisório, sinalizado pra calibração)
Chess.com rapid/blitz correm ~100-150 pts ACIMA do Lichess em força comparável. Como a
banda **só sobe** (over-placement é pegajoso e nocivo), use offset CONSERVADOR (tende a
sub-colocar, não super): `bandFromEstimate(rating - OFFSET)`, OFFSET ≈ **150** pra
rapid/blitz. Documentar no código como **PROVISÓRIO — recalibrar com dado real do beta**.
NÃO construir tabela complexa de conversão (o council avisou: tabela de conversão = erro
extra) — um único offset documentado.

## Fix (mínimo)
- Novo `bandFromChesscomRating` espelhando `lichessBand.ts` (mesma estrutura, confidence,
  regra só-sobe).
- Fiar no caminho de sync do Chess.com (onde `importChesscomSignals` já roda), reusando o
  padrão M2a de promoção "só sobe" SEM tocar o caminho do Lichess.

## NON-GOALS (fronteira de risco)
- NÃO tocar `src/domain/placement/lichessBand.ts` nem o caminho M2a do Lichess.
- NÃO tocar `src/domain/method/diplomas.ts` nem `src/domain/method/bandProgression.ts`
  (branch paralelo do Codex — PROIBIDO).
- NUNCA descer a banda (só sobe). Se o usuário tem Lichess E Chess.com, pega a MAIOR banda
  derivada (não double-promove nem entra em conflito com o M2a Lichess).
- NÃO inventar studyId/puzzle IDs; NÃO reproduzir conteúdo de livro.
- NÃO commitar. NÃO rodar council. NÃO agir como maestro.

## Gate de aceite (binário)
- Testes novos: VERMELHO antes, VERDE depois.
- `npm test` (suíte cheia) VERDE. `npm run lint` + `npm run build` VERDES.

## Entrega
Arquivos mudados + diff resumido + saída do teste antes/depois + arquivos lidos pra decidir
a fiação. NÃO commitar — o maestro (Opus) revisa risco e commita.
