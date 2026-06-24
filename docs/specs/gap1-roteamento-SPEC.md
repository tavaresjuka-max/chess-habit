# SPEC — Gap #1: Roteamento por resultado observado (fase inteira)

Decisão: council 2026-06-24 (ver memory `routing-concept-puzzle-decision`). Dificuldade é
INGOVERNÁVEL no Lichess (serve por rating global, não por estágio). Lever = gate por
RESULTADO OBSERVADO + split honesto de camadas + roteamento aprendido. NÃO curar mapa de IDs.

## NON-GOALS (não fazer)
- NÃO inventar `studyId`/IDs de puzzle do Lichess (404 = fragilidade de orquestrador). Só Studies
  que já existem no catálogo.
- NÃO prometer treino offline (treino é online por natureza; offline = só o PLANO).
- NÃO curar listas de IDs de puzzle por conceito×nível (não escala, apodrece).
- NÃO quebrar o SR/retention gate já shipado: retrocompat dura — item SEM sinal observado se
  comporta exatamente como hoje.

## Pilar B — Gate por resultado observado (núcleo)
Módulo puro novo `src/domain/method/difficultyFit.ts`:
- `classifyDifficultyFit({ attempts, losses }, opts?) → 'insufficient' | 'too-hard' | 'fit' | 'too-easy'`
  - solveRate = (attempts − losses) / attempts.
  - `attempts < minAttempts` (default 4) → `insufficient` (sem sinal confiável ainda).
  - solveRate < `TOO_HARD_BELOW` (0.40) → `too-hard`.
  - solveRate > `TOO_EASY_ABOVE` (0.85) → `too-easy`.
  - senão → `fit`.
- `decideMismatchAction(fit, ctx: { hasCuratedStudy: boolean }) → 'route-study' | 'defer' | 'continue'`
  - `too-hard` + hasCuratedStudy → `route-study` (cai pro layer controlável).
  - `too-hard` + !hasCuratedStudy → `defer` (adia com nota honesta).
  - senão → `continue`.

Wiring:
- Promoção de estágio só ocorre quando o fit observado ∈ {`fit`, `too-easy`}. `too-hard` NÃO promove
  (dispara mismatch action); `insufficient` segura no estágio (segue dando volume), não promove.
- Aplicado na reconciliação/pós-bloco (call site `useTrainingActions`), usando solve-rate RECENTE
  da reconciliação Lichess — não só o cumulativo.

## Pilar A — Split honesto de camadas
- `hasCuratedStudy(tag): boolean` sobre o catálogo existente (sem inventar IDs).
- Selector mantém: explain/guided = Study (pedagogia controlável); retrieval+ = tema (volume puro).
  Remover qualquer alegação de "dificuldade" atribuída ao tema (coachNote honesto: tema é volume).
- Onde NÃO há Study e fit=too-hard → defer com nota ("precisa de base antes").

## Pilar C — Roteamento aprendido por aluno
- Registrar, por conceito, se a rota MOVEU o sinal de fraqueza (weakness.score caiu) após a sessão.
- `pickRouteByHistory(candidates, history) → candidate` (puro): prefere rota com melhor histórico de
  queda de score PARA ESTE ALUNO. Cold-start (sem histórico) → ordem atual (comportamento de hoje).

## Guardas (fragilidade de orquestrador)
- Teste + const: chaves do nosso mapa de temas ⊆ lista conhecida de temas do Lichess (shipar a lista).
- Study-rot: ao rotear pra Study, degradar pra tema se indisponível (graceful fallback).
- Copy: auditar que não há promessa de "treino offline" (offline = só plano).

## Critérios de aceite (binários)
- [ ] `difficultyFit.ts` puro + testes: too-hard / fit / too-easy / insufficient + decideMismatchAction.
- [ ] Promoção de estágio bloqueada quando fit observado = `too-hard` (teste).
- [ ] too-hard + hasStudy → route-study; too-hard + !hasStudy → `status:'deferred'` + nota (teste).
- [ ] Retrocompat: item sem sinal observado → comportamento idêntico ao atual (suíte atual verde).
- [ ] Pilar C: `pickRouteByHistory` puro + teste cold-start = ordem atual.
- [ ] Guarda: teste mapa de temas ⊆ lista conhecida do Lichess.
- [ ] Gates: 1026+ testes, lint, tsc, build verdes.
