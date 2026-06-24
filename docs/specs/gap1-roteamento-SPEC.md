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

## STATUS (2026-06-24, fase em curso)
- ✅ **Pilar B (eixo SR/graduação)** — commit `1d3b124`. `difficultyFit.ts` puro + gate em
  `advancePendingItem`: too-hard observado VENCE o autorrelato e PRECEDE a graduação
  (fecha o buraco de graduar contra sinal cego); cai pra Study curada ou adia. Retrocompat dura.
- ✅ **Pilar A (split honesto + surfacing)** — commit `64a8664`. Split já era honesto
  (explain/guided=Study/vídeo; retrieval+=tema; sem alegação de dificuldade no tema); a
  deferReason do adiamento agora aparece pro aluno no banner (não some em silêncio).
- ✅ **Guarda copy offline** — auditado: nenhuma promessa de "treino offline" (só `offlineReady`
  do PWA = cache do app-shell). PASS.
- ⏳ **Eixo de ESTÁGIO (critério "promoção bloqueada quando too-hard", linha 52)** — EM COUNCIL
  (DIVERGIR, não-bloqueante). Conflito real: gatear o estágio no sinal observado contesta a
  DD-Ped6 (feedback explícito <14d FORÇA o estágio — anti-penhasco TDAH) e pode ser RISCO
  REDUNDANTE, já que a graduação (a falha mais grave) já é gateada no eixo SR. Decidir após o digest.
- ✅ **Pilar C — função pura (`pickRouteByHistory`)** — `routeHistory.ts` + testes (7) verdes.
  Conservadora p/ n=1: só sobrepõe a ordem atual quando há histórico ROBUSTO (≥3 desfechos) e
  majoritariamente POSITIVO (>50% moveu o score) PARA O CONCEITO; senão cold-start (ordem de hoje).
  Assinatura refinada p/ 3 args (`candidates, history, weaknessTag`) — escopo por conceito
  self-contained, mais correto/testável que o atalho de 2 args do contrato. Não fabrica sinal de ruído.
- ⏳ **Pilar C — gravação + wiring** — pendente (DEFERIDO p/ a passada pós-council no generatePlan):
  registrar `RouteOutcome` (rota moveu weakness.score?) e plugar `pickRouteByHistory` na seleção
  tocam generatePlan/fluxo de fraqueza → serializar com a decisão do eixo de estágio (mesmos arquivos).
- ⏳ **Guarda theme-map ⊆ Lichess** — pendente; exige ancorar a lista canônica de temas do Lichess
  (sem inventar slugs). Fazer com cuidado.
- ✅ **Study-rot fallback** — coberto estruturalmente: o seletor mantém o tema como fallback de menor
  prioridade DEPOIS da Study (teste `resourceCatalog.test.ts` "keeps raw puzzle themes as fallback");
  + curadoria com link-check/cadência. Detecção de 404 em runtime é impossível offline (por design).
