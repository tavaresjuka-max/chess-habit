# E3 — Pré-registro do estudo de eficácia (DRAFT congelável)

Status: **DRAFT congelável**. Congelar (virar `-FROZEN` + hash) só quando o dono fechar a decisão de
TIER (ver docs/specs/e2e4-efficacy-methodology-DECISION.md). Este artefato existe para travar o protocolo
ANTES de ver qualquer outcome — é o anti-p-hacking. Origem: council de metodologia + decisões 2026-06-27
([[launch-readiness-council-2026-06-27]], decisão D2 = construir o piso tier-agnóstico, decidir o
estimador causal depois dos dados).

## Princípio inegociável
Nenhuma escolha de janela, formato, estimador ou frase de resultado pode ser feita DEPOIS de ver o dado.
Tudo abaixo é fixado agora. Mudança vira nova versão datada + hash, com justificativa registrada.

## 1. Hipótese primária (única, numérica)
"Entre usuários que atingiram a dose mínima de treino (def. §4), a inclinação (slope) de rating no
formato primário no período PÓS-adoção é maior que no período PRÉ-adoção, em magnitude ≥ ao limiar de
efeito praticamente relevante (§3), após correção de regressão à média (§5)."

## 2. Formato primário
**rapid** (único). blitz/classical são secundários EXPLORATÓRIOS, nunca agregados num só número.

## 3. Limiar de efeito praticamente relevante
A FIXAR com o dono ao congelar (sugestão de partida: +N pontos de rating sustentados em 90 dias, com N
calibrado por densidade de partidas). Sem este número, o estudo não é interpretável.

## 4. Dose mínima (gate de elegibilidade)
A FIXAR ao congelar (sugestão: ≥ X sessões de treino concluídas em ≥ Y dias distintos dentro da janela
pós). Abaixo da dose, o usuário NÃO entra na análise primária (entra em análise de intenção-de-tratar
separada).

## 5. Estimador exato (travado em dado SIMULADO antes de ver dado real)
- Janelas: PRÉ = [T−90d, T), PÓS = [T, T+90d]. T = `adoptedAt` (carimbo write-once imutável, Fase 1).
- Ingredientes descritivos: slope OLS por janela (já implementado, `computeRatingSlopes`, rotulado
  não-causal).
- Correção de regressão à média: AR(1) / Beaven–Hutson (A IMPLEMENTAR após decisão de tier — NÃO usar
  delta pré/pós nu como prova; o código atual já adverte isso).
- Placebo de tendências paralelas no PRÉ: exigido; reportar junto.
- Tier (controle): **PENDENTE do dono** (Tier 1 honesto sem controle / Tier 1.5 controle leve / Tier 2
  DiD escalonado Callaway–Sant'Anna). O tier define se a alegação é "sugestiva não-identificada" ou
  "causal identificada".

## 6. Regra de dropout / ITT
LOCF + imputação múltipla (NÃO LOCF puro). Dropout informativo reportado.

## 7. Comparações múltiplas
Correção (Holm/BH) sobre os secundários exploratórios; o primário é único e não corrigido.

## 8. Frase EXATA do resultado nulo (fixada agora)
"Os dados desta coorte não permitiram rejeitar a hipótese nula de ausência de efeito do método sobre a
inclinação de rating no formato primário, ao limiar pré-registrado. Isto não prova ausência de efeito;
reflete o poder estatístico disponível e os limites do desenho." — esta frase é publicada como está se o
resultado for nulo.

## 9. Persistência / congelamento
Ao congelar: gravar em Dexie/doc "pré-registrado em T com hash H" (hash do conteúdo FROZEN). Migração que
mexa nisso = revisão classe DATA. Consentimento do usuário (D5) é pré-requisito de incluir qualquer dado
na coorte.

## NON-GOALS (reafirmados)
Nunca mostrar delta pré/pós nu como prova · nunca escolher janela/estimador após ver dado · nunca agregar
rapid+blitz+classical num número · nunca rodar estudo sub-poderado · não implementar o estimador causal
antes do OK de tier do dono.
