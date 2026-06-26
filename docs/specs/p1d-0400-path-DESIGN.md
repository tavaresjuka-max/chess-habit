# DESIGN — P1d: caminho 0-400 (iniciante absoluto)

> **STATUS: DESENHADO — precisa de 1 DECISÃO DO DONO antes de implementar (gated).** Council
> DIVERGIR: DeepSeek V4 Pro (forte, EXIT=0); GLM 5.2 falhou (EXIT=127). Parte da Decisão #1
> ([[beta-plan-council-2026-06-25]]). NÃO implementar até o OK do dono no corte A/B abaixo.

## Pergunta
A Decisão #1 incluía um "caminho 0-400 separado" pra iniciante absoluto (sem rating). COMO
detectar quem é esse aluno e o que entregar?

## Achados decisivos do council (DeepSeek)
1. **Autorrelato é o PIOR instrumento justo nessa população.** Dunning-Kruger é máximo em
   habilidade baixa: quem sabe as regras se diz "intermediário"; um 1200 tímido se diz
   "iniciante" e, jogado no tutorial de coordenadas, vira churn garantido.
2. **CONSTRAINT DURO: o app não tem tabuleiro (por design).** Notação algébrica é o pré-requisito
   mais fundamental — e ensinar coordenadas/regras sem tabuleiro interativo é frágil. Redirect
   pro coordinate trainer do Lichess é redirect EXTERNO na onboarding (custo de retenção).
3. **Falsos zeros e falsos não-zeros:** rating só em time-control excluído (1900 bullet, 0
   rapid/blitz → fetcher acha nada → joga no caminho iniciante por engano); rating provisional/RD
   alto (iniciante real perde 3 e fica "900?" com RD enorme → coloca na Banda 2 errado);
   "voltando após anos" (1600 em 2018, conta nova → parece zero).
4. **Handoff churn:** termina o caminho iniciante SEM partida ranqueada → sem âncora pro
   currículo principal.

## Desenho proposto (adjudicado pelo maestro)
- **Gate de entrada NÃO é autorrelato puro.** Ordem:
  (a) qualquer rating externo **não-provisional** (incluir bullet/correspondence como SINAL, não
      como âncora de banda) ⇒ NÃO é zero absoluto → rota coaching/curadoria normal;
  (b) sem rating, OU provisional/RD alto ⇒ tratar como ausente → apresentar o gap-map.
- **Gap-map binário (sei/não-sei)** no lugar de autoavaliação ordinal: nomear casas, movimento
  das peças, xeque/xeque-mate, mate K+R vs K, roque, en passant. Cada "não sei" = pré-requisito
  num DAG de módulos, NÃO uma banda. Degrada gracioso: se mentir/subestimar, o pior caso é pular
  módulo (clicar "já sei"), não travar.
- **Entrega = rota personalizada pras ferramentas DE INICIANTE do Lichess** (Learn / Practice /
  coordinate trainer) conforme as lacunas do gap-map. Honra o non-goal orquestrador (não hospeda
  conteúdo nem tabuleiro; roteia).
- **Critério de saída:** "jogue N partidas rapid no Lichess" (o aluno já está lá após as
  ferramentas) → gera a âncora pro currículo principal (mitiga o handoff churn).

## ⚠️ DECISÃO DO DONO (A vs B) — única coisa que falta pra destravar P1d
O constraint do tabuleiro é a razão: não dá pra entregar tutorial de iniciante in-app sem
tabuleiro. As duas saídas honestas:
- **(A) [recomendado] 0-400 DENTRO do beta:** gap-map + rota pras ferramentas iniciante do
  Lichess. Consistente com a filosofia orquestradora; aceita o custo do redirect externo na
  onboarding de iniciantes absolutos.
- **(B) 0-400 FORA do beta:** gate "já jogou ~10 partidas online? não → vá jogar (aqui está
  onde), volte". Mais simples; **corta** iniciantes absolutos do beta (redução de escopo).

## NON-GOALS
NÃO inventar tabuleiro in-app. NÃO inventar IDs de puzzle/study (404 = fragilidade). NÃO usar
autorrelato ordinal como gate único. NÃO tratar rating provisional/RD alto como âncora. NÃO
implementar antes do OK do dono.
