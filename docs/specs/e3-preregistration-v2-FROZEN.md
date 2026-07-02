# E3 — Pré-registro do estudo de eficácia — **v2** (amendamento datado)

Status: **CONGELADO (FROZEN) em 2026-07-02**, ANTES de qualquer dado real da coorte
(coorte real ainda não iniciada; estimador validado só em dado SIMULADO, conforme exige o v1).

- **v1 permanece IMUTÁVEL:** `e3-preregistration-FROZEN.md`, congelado em 2026-06-28,
  commit `234375a`, blob git `8c5f9caf1f679b5630f1e3bf095e0bb114116f82`. Este v2 NÃO
  substitui o v1 — é o amendamento datado + justificado que o próprio v1 prevê.
- **O que NÃO muda (reafirmado, intocado):** hipótese primária única; formato primário
  rapid; limiar +50 Glicko rapid/90d; dose mínima 8 sessões/6 dias; janelas PRÉ/PÓS 90d
  ancoradas em `adoptedAt`; regra de dropout; correções múltiplas; frase EXATA do
  resultado nulo (§8 do v1); todos os non-goals.

## Amendamento 1 — Fórmula EXATA do estimador (agora implementada em código)

O v1 fixou a FORMA (Beaven–Hutson com AR(1)) e exigiu validação em dado simulado antes
da coorte. A implementação existe em `src/domain/efficacy/rtmCorrection.ts` e é copiada
aqui LITERALMENTE como parte congelada:

- `ρ` = autocorrelação lag-1 da série PRÉ (`estimateLag1Autocorrelation`); séries com
  n < 3 ou variância zero ⇒ ρ = 0 (sem correção aplicável).
- `rawDelta = média(PÓS) − média(PRÉ)`.
- `RTM_esperada = (1 − ρ) · (populationMean − baselineMean)`, com
  `baselineMean = média(PRÉ)` e, **na ausência de população externa (Tier 1)**,
  `populationMean = média da série COMBINADA PRÉ+PÓS` (proxy do nível de longo prazo
  do próprio sujeito; Tier 1.5/2 substituirá por média populacional real sem mudar a
  assinatura).
- `correctedDelta = rawDelta − RTM_esperada`.

**Justificativa do amendamento (convenção de sinal):** a forma TEXTUAL do doc de
metodologia (`e2e4`) escrevia `E[pós−pré|nulo] = (1−ρ)·(média_pré − média_pop)`. Sob
RTM pura (baseline em vale, abaixo do nível de longo prazo), esse termo fica negativo e
`rawDelta − termo` AUMENTARIA o delta em vez de encolhê-lo — o oposto do que "corrigir
RTM" significa e o oposto do Beaven–Hutson clássico. A implementação usa o sinal
clássico (acima), verificado numericamente por property-test: 200 séries AR(1) sob H0
pura (PRNG seedado, reprodutível) ⇒ média de `correctedDelta` dentro de ±10 pontos de 0;
cenário "vale + reversão" ⇒ `|correctedDelta| < |rawDelta|`. Isso conforma a implementação
à INTENÇÃO do v1 (corrigir RTM), não altera hipótese/limiar/janelas/dose.

## Amendamento 2 — Adesão como desfecho zero (gate de avaliabilidade)

Registra-se o gate de adesão de `falsification-protocol-DECISION.md` (2026-07-02):
adesão = % de dias com ≥ 1 bloco concluído na janela avaliada
(`src/domain/metrics/adherence.ts`). Adesão abaixo do piso ⇒ o gate correspondente
retorna **`not-evaluable`** (nem "passou" nem "falsificou"). A janela de adesão por nó
(30d) é **independente** da dose mínima do primário (90d, §4 do v1) — gates distintos,
nunca intercambiáveis. Este amendamento ADICIONA um gate de avaliabilidade; não altera
o estimador primário.

## Amendamento 3 — Protocolo de falsificação por nó (registro cruzado)

O gate duplo por nó (sonda inédita ≥70%/10 itens + blunder-rate < metade do baseline de
20 partidas) está registrado em `docs/specs/falsification-protocol-DECISION.md` e NÃO é
o primário do E3 — é um protocolo de falsificação independente, com a granularidade por
nó condicionada a D1+spike (enquanto o proxy agregado vigorar, o gate é GLOBAL e
declarado como proxy). Cláusula do experimentador vigente: resultado positivo em
dogfood = calibração, não evidência.

## Selo

Ao commitar este arquivo: o hash do commit e o blob git desta versão são o selo (mesmo
mecanismo do v1). Alteração posterior = v3 datado + justificado. Nenhuma escolha
analítica restante pode ser feita depois de ver dado real.
