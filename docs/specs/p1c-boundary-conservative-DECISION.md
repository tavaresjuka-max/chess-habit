# DECISÃO — P1c: boundary probe → colocação conservadora + promoção existente

> **STATUS: DECIDIDO (maestro adjudicou).** Sem código novo de probe. Council DIVERGIR:
> DeepSeek V4 Pro (forte, EXIT=0); GLM 5.2 falhou (EXIT=127, tentou re-disparar council).
> Parte da Decisão #1 de placement ([[beta-plan-council-2026-06-25]]).

## Pergunta
A Decisão #1 incluía um "boundary probe" pra confirmar a banda quando a âncora externa é
incerta (rating perto de fronteira, ou só autorrelato). COMO fazer o probe?

## Abordagem óbvia (REJEITADA)
"Dá N puzzles da banda de cima; se acertar X% sobe." Por que NÃO:
1. **Dois-medidores insolúvel.** O probe é um mini-motor de rating PIOR que o rating externo
   (sinal Glicko-2 sobre centenas de partidas reais com relógio). Quando divergem, qualquer
   regra de combinação é ad-hoc e **não-validável** — não há dataset rotulado.
2. **Incalibrável sem volume.** Puzzle rating do Lichess ≠ força de jogo. Sem milhares de alunos
   nos MESMOS itens não há parâmetros de IRT (dificuldade/discriminação/guessing). O probe mede
   algo, mas não se sabe o quê.
3. **Fracasso front-loaded na onboarding.** O probe roda antes do aluno ver valor; ele erra a
   banda de cima e a 1ª experiência vira "o app me deu algo difícil e eu falhei" — justo nos
   alunos mais incertos do próprio nível.
4. **Assimetria path-dependent sob "só sobe".** 1395 vs 1405 na fronteira 1400 terminam em
   bandas diferentes com a mesma força real, travados pela regra de não-descer.

## Decisão (ADOTADA)
**A colocação conservadora + a promoção por acurácia JÁ existente SÃO o probe.** Um instrumento
só (o currículo real), sem contradição, sem motor de puzzle pra manter/calibrar.
- **Colocar na banda de BAIXO** quando a âncora estiver perto de fronteira. O caminho Chess.com
  já sub-coloca de propósito (`CHESSCOM_TO_LICHESS_OFFSET = 150`, ver chesscomBand.ts). "Só
  sobe" (DD4) garante que sub-colocação se auto-corrige e nunca há over-placement (que é o dano
  pegajoso a evitar).
- **A promoção existente eleva o sub-colocado organicamente:** `applyDiplomaProgress` (acurácia
  de tema, banda só-sobe) é exatamente o "probe implícito" — mede com o próprio currículo, nos
  primeiros problemas REAIS, sem tela separada.

## Impacto de código: ~ZERO
- Chess.com: já conservador (OFFSET). Nada a mudar.
- Lichess (`lichessBand.ts`/`runLichessSync`): **PROIBIDO TOCAR** (dono M2a/Codex). Margem
  conservadora ali, se desejada, fica com o dono daquele caminho — fora deste escopo.
- **P1c é uma DECISÃO, não uma implementação.** Não há arquivo a escrever.

## Risco residual (documentado, aceito pro beta)
Dois alunos de mesma força perto de fronteira podem cair em bandas diferentes se um tiver rating
logo acima. Mitigado por: só-sobe (nunca super-coloca) + promoção (sub-colocado sobe). Revisitar
com dado real do beta.

## NON-GOALS
NÃO construir motor de rating por puzzle. NÃO combinar dois medidores por regra ad-hoc. NÃO
mexer no caminho Lichess (dono externo).
