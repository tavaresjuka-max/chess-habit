# SPEC — PROD-6: diploma promove no sync (não só no boot/botão manual)

## Contexto (confirmado por trace 2026-06-25)
App "orquestrador": o aluno treina puzzles no lichess.org; o app reconcilia os
resultados e avalia diplomas por acurácia de tema. Decisão de produto FECHADA:
"a banda sobe sozinha no sync do Lichess".

## Bug
`applyDiplomaProgress` (definida em `src/domain/method/evaluateDiplomas.ts:91`) só é
chamada dentro de `reconcileLichessResults()` (`src/app/useStudyActions.ts:139`). Essa
função roda apenas:
- no boot, silenciosa (`src/app/state.ts:353`), uma vez por boot; e
- no botão manual "Conferir puzzles".

O auto game-sync `runLichessSync` (`src/app/useDiagnosisActions.ts:303`) →
`runDiagnosisSync` (~linha 200) atualiza a banda por **rating de jogo** (M2a), mas
**não** avalia o diploma por **acurácia de puzzle**. Resultado: o aluno volta do
Lichess, dispara o sync, a banda por rating sobe — mas o diploma de puzzle só conta no
próximo boot ou no botão manual. Para o aprendiz TDAH, "fiz e nada mudou" é o penhasco
motivacional a evitar.

## Comportamento desejado
Quando o aluno reconcilia/sincroniza após treinar (o caminho que ele dispara ao voltar
ao app), o diploma de puzzle DEVE ser avaliado e a banda promovida na hora — sem exigir
reboot nem botão manual. Honra a decisão "banda sobe sozinha no sync".

## Teste primeiro (o árbitro — TDD obrigatório)
Escreva um teste (vitest) que:
1. Monte um estado onde os logs de treino de puzzle cruzam o limiar de um diploma
   (≥80% na contagem exigida de tentativas do tema), SEM reboot e SEM chamar o reconcile
   manual.
2. Dispare o caminho de sync/retorno automático que o app usa de fato (o mesmo gatilho do
   boot/sync, conforme o código real — investigue o ponto correto).
3. Asserte que a banda promove (o diploma é avaliado e a banda efetiva avança).

Rode SÓ esse arquivo de teste e CONFIRME que ele falha (VERMELHO) no código atual.
Se ele passar (VERDE) sem fix, PROD-6 é falso-positivo — PARE e reporte isso com a evidência.

## Fix (mínimo)
Fie a avaliação de diploma no caminho de sync/retorno automático, reusando
`applyDiplomaProgress` com o `skillMap` fresco (de `buildSkillMap` sobre os logs já
reconciliados). É idempotente — `applyDiplomaProgress` já faz merge dos diplomas; NÃO
duplique avaliação nem refaça fetch desnecessário.

## NON-GOALS (não ultrapassar — fronteira de risco)
- NÃO modificar `src/domain/method/diplomas.ts` nem `src/domain/method/bandProgression.ts`
  (estão vivos num branch paralelo do Codex — PROIBIDO tocar).
- NÃO mudar os CRITÉRIOS de diploma (80% / contagem de tentativas) nem a regra
  `promoteBandForDiplomas`.
- NÃO tocar o caminho de banda-por-rating (M2a) na parte de rating do `runLichessSync`.
- NÃO inventar studyId/puzzle IDs; NÃO reproduzir conteúdo de livro.
- NÃO commitar. NÃO rodar council. NÃO agir como maestro/orquestrador.

## Gate de aceite (binário)
- Teste novo: VERMELHO antes, VERDE depois.
- `npm test` (suíte cheia) VERDE.
- `npm run lint` e `npm run build` VERDES.

## Entrega
Reporte em texto: arquivos mudados + diff resumido + saída do teste antes (vermelho) e
depois (verde) + os arquivos que você precisou ler pra decidir o ponto de fiação. NÃO
commite — o maestro (Opus) revisa risco e commita.
