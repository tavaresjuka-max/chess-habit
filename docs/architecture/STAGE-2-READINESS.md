# Stage 2 — Readiness & Gate (Fase 4)

Status: **GATED**. Decisões travadas pelo dono 2026-06-27 ([[launch-readiness-council-2026-06-27]]):
Stage 1 = beta da FERRAMENTA em 400-1200 (validado) + abrir a coorte; Stage 2 = multi-nível completo,
**atrás dos dados do Stage 1**. Construir Stage 2 agora contradiria D1/D2/D3 — por isso este doc o deixa
shovel-ready e registra o gate, em vez de código prematuro.

## Por que está gated (não é preguiça — é a decisão do dono)
- O currículo denso 1200+ ("Corte 8") só destrava **com eficácia comprovada** (gate histórico do
  projeto). Construir conteúdo alto antes da prova = investir no escuro.
- 0-400 discovery-mode completo e coaching de bandas altas foram explicitamente colocados em **Stage 2**
  (D3 = "B-lite agora + discovery-mode depois"; D2 = bandas altas dependem da prova de eficácia).
- O onboarding do Stage 1 já **restringe a 400-1200** (filtro de banda, Fase 1) e já trata 0-400 com a
  orientação B-lite e 1200+ com aviso honesto + clamp. Logo nada quebra hoje sem o Stage 2.

## O que o Stage 2 contém (shovel-ready)

### S2.1 — 0-400 discovery-mode completo
Hoje: B-lite (tela de orientação → Lichess Learn). Stage 2: **gap-map binário** (sei/não-sei → DAG de
pré-requisitos) + roteamento curado (Lichess Learn + puzzles temáticos via `puzzle:read`) + revisão
espaçada dos erros do próprio aluno. Orquestração pura (não fere o non-goal "sem tabuleiro próprio").
Custo estimado: 1-2 semanas.

### S2.2 — Coaching de bandas altas (1200-2200)
NÃO é conteúdo oco/paráfrase de livro. É: diagnóstico + rotear pra fontes públicas/CC (Lichess Practice
é CC; tablebases de final = factual; **jogos do próprio aluno = zero-IP**) + revisão espaçada dos erros.
Label honesto ("a biblioteca cresce conforme a eficácia é comprovada"). Reusa o bridge de motif-tag
Chess.com→puzzles Lichess (lever `catalogSkillNodes`).

### S2.3 — Corte 8 (currículo denso 1200-2200)
HARD-GATED pela prova de eficácia. Só desenhar/construir quando o estimador (decisão de tier do dono)
mostrar efeito no Stage 1.

### S2.4 — Estimador causal de eficácia
RTM/AR(1) (Beaven–Hutson) + decisão de tier (Tier 1 honesto / Tier 1.5 / Tier 2 escalonado
Callaway–Sant'Anna). Ver `docs/specs/e2e4-efficacy-methodology-DECISION.md` e o pré-registro
`docs/specs/e3-preregistration-DRAFT.md` (congelar antes de ver dado). **Não implementar antes do OK de
tier do dono** (non-goal vigente). Lembrar riscos vigentes: sync conta-normal deixa progresso legivel no servidor quando opt-in; analise de eficacia depende de consentimento/researchOptIn, N suficiente, escalonamento e **SUTVA** (early vs not-yet jogam no mesmo pool Lichess → DiD viesado).

## O que DESTRAVA o Stage 2 (critérios objetivos)
1. Stage 1 no ar (ferramenta) + coorte recrutada de forma **escalonada** (timing = instrumento do DiD).
2. Dados suficientes: N de adoção em datas diferentes + taxa de export que torne o estimador
   identificável (validar com o dogfood N=1 do pipeline consentimento→dados sincronizados/exportados→slope antes de investir).
3. Decisão de tier do dono fechada + pré-registro E3 congelado (hash).
4. Sinal de eficácia positivo no formato primário (rapid) acima do limiar pré-registrado → só então S2.3.

## Pré-requisitos operacionais (fora de código, do dono)
- D8: canal/critério de recrutamento escalonado. Deploy. (D11 AGPL removido — app é proprietário/fechado desde 2026-06-30.)
- Antes de ampliar sync multi-dispositivo alem do beta pessoal: itens A–F de `docs/architecture/SYNC-HARDENING.md`, E2E real dois-aparelhos, dogfood, retencao/compactacao e privacidade/suporte.
