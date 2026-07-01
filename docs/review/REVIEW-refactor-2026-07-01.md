# Review: Refatoração 4fd07d9..0186885 (6 commits)

**Revisado em:** 2026-07-01
**Escopo:** 16 arquivos — extração de helpers puros, subcomponentes e contrato de tipo
**Gates informados como verdes:** 1372 testes vitest, `tsc -b`, eslint, `vite build`
**Método:** leitura completa do `git diff` de cada arquivo (não só do estado final), comparação byte-a-byte de todo trecho movido, verificação de call sites e wiring de props.

## Resumo

Revisei os 6 commits do range, arquivo por arquivo, comparando o diff completo
(antes/depois) — não apenas o resultado final. Nos 5 pontos de extração:

1. `Today.tsx` → `todayHelpers.ts`, `TodayParts.tsx`, `CalibrationInvite.tsx`, `TodayDayStatus.tsx`
2. `Config.tsx` → `ConfigDataFold.tsx`, `ConfigPrivacyFold.tsx`, `configHelpers.ts`
3. `PlanBlockCard.tsx` → `planBlockHelpers.ts`, `PatternRecognitionPrompt.tsx`
4. `state.ts` → `stateTypes.ts`
5. `useDiagnosisActions.ts` → `diagnosisHelpers.ts`

todo o código movido é **idêntico byte-a-byte** ao original (só mudou de
arquivo). Verifiquei especificamente os pontos pedidos:

- **Props do subcomponente vs. JSX original**: `totalBlocks={allBlocksOrdered.length}`,
  `chronicSupportSuggested={plan.chronicSupportSuggested === true}`,
  `organizerCeiling={plan.organizerCeiling === true}` — todos batem exatamente
  com a expressão original inline (`Today.tsx` antes, linhas 364-373 vs.
  `TodayDayStatus.tsx` depois).
- **Estado movido (`CalibrationInvite`)**: o `useState` com leitura de
  `localStorage` e a chave `chesshabit:calibration-invite-dismissed` já
  existiam no `Today.tsx` original (não são novos desta refatoração) — foram
  movidos para dentro do componente sem alteração de lógica, escopo por
  `block.id` não se aplica aqui (o convite não é por bloco).
- **Imports movidos**: `loadSignals` continua importado em
  `useDiagnosisActions.ts` (ainda usado em outros 4 call sites do arquivo,
  confirmado via grep); `filterFreshSignals`/`confidenceRank` foram
  corretamente movidos só para `diagnosisHelpers.ts`, sem duplicação.
  Confirmei que nenhum arquivo em `src/domain` mudou neste range — a
  dependência (`filterFreshSignals`) é a mesma função, no mesmo lugar.
- **Call sites de `mergePuzzleWeakness`/`filterSignalsForDiagnosis`/
  `latestSignalObservedAt`**: os 3 pontos de chamada em `useDiagnosisActions.ts`
  passam os argumentos na mesma ordem de antes.
- **Acessibilidade**: `aria-valuemin/max/now/valuetext` do `day-progress`,
  `role="progressbar"`, `aria-label`, `role="note"` do convite de calibração e
  do `PatternRecognitionPrompt` — todos preservados literalmente no texto
  movido.
- `tsc -b --noEmit` rodou limpo localmente durante a revisão, confirmando que
  não há tipo solto (ex.: `ComponentProps<typeof AccumulationStrip>['recentDays']`
  em `TodayDayStatus.tsx` é referência de tipo válida, não duplicação).

Não encontrei nenhuma diferença de comportamento real nos 6 commits. Isso é
consistente com o que os gates (testes + tsc + eslint + build) já indicavam,
mas a leitura manual do diff completo (não confiando só no estado final)
confirma que não há um caso de "movido com uma variável trocada" que os testes
não cobrissem.

## Critical Issues

Nenhum encontrado.

## Warnings

Nenhum encontrado.

## Info

Nenhum encontrado — nenhum item novo de estilo/nomeação/duplicação foi
introduzido por esta refatoração (o código movido manteve os mesmos
comentários, nomes e formatação do original).

## Conclusão

Resultado válido para refactor test-gated: **0 achados**. Os 6 commits são
extrações mecânicas corretas — props, estado, imports e a11y foram preservados
exatamente. Não há necessidade de ação de correção antes de mergear/aceitar
este range.

---

_Revisado: 2026-07-01_
_Revisor: Claude (revisão adversarial de código)_
_Profundidade: deep (leitura completa do diff de cada um dos 16 arquivos + verificação cruzada de call sites)_
