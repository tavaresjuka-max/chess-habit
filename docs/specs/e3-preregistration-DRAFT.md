# E3 — Pré-registro do estudo de eficácia (DRAFT congelável)

Status: **DRAFT congelável — TIER DECIDIDO 2026-06-28 (Tier 1 honesto como primário).** Falta só o dono
confirmar 2 campos (§3 limiar de efeito + §4 dose mínima) para virar `-FROZEN` + hash. Este artefato
existe para travar o protocolo ANTES de ver qualquer outcome — é o anti-p-hacking. Origem: council de
metodologia + decisões 2026-06-27/28 ([[launch-readiness-council-2026-06-27]]).

> CORREÇÃO importante sobre D2: "decidir o estimador depois dos dados" NÃO é honesto para o PRIMÁRIO —
> escolher a análise após ver o resultado é p-hacking. O primário é travado AGORA (Tier 1). "Depois dos
> dados" só vale para checar a VIABILIDADE de um secundário exploratório pré-especificado (§5).

## Princípio inegociável
Nenhuma escolha de janela, formato, estimador ou frase de resultado pode ser feita DEPOIS de ver o dado.
Tudo abaixo é fixado agora. Mudança vira nova versão datada + hash, com justificativa registrada.

## 1. Hipótese primária (única, numérica)
"Entre usuários que atingiram a dose mínima de treino (def. §4), a inclinação (slope) de rating no
formato primário no período PÓS-adoção é maior que no período PRÉ-adoção, em magnitude ≥ ao limiar de
efeito praticamente relevante (§3), após correção de regressão à média (§5)."

## 2. Formato primário
**rapid** (único). blitz/classical são secundários EXPLORATÓRIOS, nunca agregados num só número.

## 3. Limiar de efeito praticamente relevante  ⟵ CONFIRMAR (proposto)
**Proposto:** **+50 pontos Glicko rapid** na inclinação pós vs pré em 90 dias (após correção de RTM),
como limiar de relevância prática. Racional: ~meia faixa de banda; abaixo disso o sinal se confunde com
ruído de Glicko para quem joga poucas partidas/mês. **Confirmar/ajustar com o dono antes do freeze.**
Sem este número, o estudo não é interpretável.

## 4. Dose mínima (gate de elegibilidade)  ⟵ CONFIRMAR (proposto)
**Proposto:** **≥ 8 sessões de treino concluídas em ≥ 6 dias distintos** dentro da janela pós (90d).
Abaixo da dose, o usuário NÃO entra na análise primária (entra em análise de intenção-de-tratar separada).
Racional: dose mínima plausível para esperar transferência ao jogo real sem exigir uso intenso.
**Confirmar/ajustar com o dono antes do freeze.**

## 5. Estimador exato (travado em dado SIMULADO antes de ver dado real)
- Janelas: PRÉ = [T−90d, T), PÓS = [T, T+90d]. T = `adoptedAt` (carimbo write-once imutável, Fase 1).
- Ingredientes descritivos: slope OLS por janela (já implementado, `computeRatingSlopes`, rotulado
  não-causal).
- Correção de regressão à média: AR(1) / Beaven–Hutson. **A IMPLEMENTAR com cuidado** (estatística
  subtil; validar a fórmula com council vivo + teste property-based; não-urgente: não há dado por ≥60d).
  NÃO usar delta pré/pós nu como prova; o código atual já adverte isso.
- Placebo de tendências paralelas no PRÉ: exigido; reportar junto.
- Tier (controle): **DECIDIDO 2026-06-28 → Tier 1 HONESTO como PRIMÁRIO** (within-subject, sem controle
  externo; alegação rotulada "sugestiva, não-identificada"). Racional: E2EE → só exporters analisáveis
  (N baixo); SUTVA quebra controle interno escalonado (mesmo pool Lichess); controle externo inviável
  (sem descoberta na API) + colider de Ashenfelter. **Tier 2 escalonado (Callaway–Sant'Anna)** fica como
  **SECUNDÁRIO exploratório pré-especificado**, rodado SÓ se limiares de suficiência (N, datas de adoção
  distintas, taxa de export) baterem, sempre com ressalva de SUTVA/RTM, nunca como manchete.

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
