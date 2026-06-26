# DECISÃO — Metodologia de eficácia (E2-E4): o pré/pós ingênuo é uma armadilha

> **STATUS: METODOLOGIA DECIDIDA + 1 DECISÃO DO DONO pendente (Tier do estimador causal).**
> Council DIVERGIR (DeepSeek V4 Pro EXIT=0 + GLM 5.2 EXIT=0, mesmo prompt, sem papéis). Os dois
> **convergiram sozinhos** no mesmo achado fatal. Refina a Decisão #3 de [[beta-plan-council-2026-06-25]].
> A instrumentação E1 (série de rating) NÃO é bloqueada por esta decisão — é Tier-agnóstica.

## Achado convergente (DeepSeek + GLM, independentes) — o que MATA o desenho

**Adoção do app é ENDÓGENA.** O aluno não começa a treinar num dia aleatório — começa **depois de
uma sequência ruim / platô frustrante / queda de rating**. Logo o "pré" de 90 dias amostra
**sistematicamente o fundo do vale** (rating abaixo da média verdadeira do sujeito). O "pós" então
**reverte à média independentemente de qualquer efeito do app**. O contraste slope-pré (negativo,
descendo pro vale) vs slope-pós (positivo, subindo de volta) **fabrica um efeito artificial onde não
há efeito nenhum**. É regressão-à-média (RTM) dirigida por *seleção no próprio outcome* — e
**nenhum período pré mais longo conserta; só piora** (alonga a janela que captura a descida).
Excluir "quem caiu antes" é *collider bias* — piora o viés. Confounds secundários (também convergentes):
**maturação natural** (curva de melhora não-linear/convexa) e **survivorship/dropout** (censura
informativa: quem abandona provavelmente não melhorava → complete-case infla o efeito pra cima).

Consequência direta pro projeto: **um `efetcacyReport` que mostre um delta pré/pós como "o app
funciona" produziria um resultado CONFIANTEMENTE ERRADO** — exatamente o "sinal FALSO que destrava o
Corte 8" que a Decisão #3 queria evitar. O E2 como "calcule um slope pré/pós" é necessário mas
**insuficiente e perigoso se rotulado como causal**.

## A divergência REAL (a única) — como consertar

- **DeepSeek:** dá pra salvar *sem* grupo de controle externo, via **dose-resposta intra-usuário com
  efeitos fixos + defasagem distribuída + termo AR(1)**:
  `Δrating_it = α_i + Σ β_k·treino_{i,t−k} + γ·partidas_it + δ·rating_{i,t−1} + ε_it`.
  α_i (efeito fixo de usuário) absorve a seleção; δ·rating_{t−1} modela a RTM explicitamente como
  AR(1); β_k (k≥1) captura aprendizado defasado; γ controla volume. + adoção escalonada/waitlist se
  viável.
- **GLM:** **sem um grupo de controle pareado da população do Lichess (milhões de não-usuários =
  controle de graça), NÃO há estimativa causal — ponto.** "Qualquer efeito é, no melhor caso, um
  limite superior não-identificável." A correção não é um slope mais robusto; é **injetar o controle
  que já existe**: DiD sobre *mudança de slope* (`Δslope_usuário − Δslope_controle`), modelo misto
  ponderado por **1/RD²** (Glicko-2), Theil-Sen como robustez, Callaway–Sant'Anna se adoção
  escalonada. Vantagem do xadrez: **medida externa objetiva (rating) + pool doador gigante**.

## Adjudicação (maestro) — três tiers de rigor

- **Tier 0 (ARMADILHA, REJEITADO):** within-subject pré/pós slope nu, rotulado causal. Fabrica RTM.
  **Nunca** mostrar como prova de eficácia.
- **Tier 1 (honesto-mas-limitado):** within-subject dose-resposta + **AR(1)/correção de RTM
  (Beaven–Hutson: `E[pós−pré|nulo] = (1−ρ)·(média_pré − média_pop)`)** + pré-registro congelado +
  **placebo de tendências paralelas no pré dividido em duas metades**. Roda **sem** infra de controle
  externo. Rotular: "sugestivo, não-identificado". (Caminho DeepSeek.)
- **Tier 2 (padrão-ouro):** Tier 1 **+ coorte de controle pareada da população do Lichess** (DiD sobre
  mudança de slope). Identifica o efeito causal. Lift de engenharia: buscar N históricos de
  não-usuários e parear por nível-pré + slope-pré + densidade de jogos + mix de formato. **É um script
  de análise OFFLINE** (o dono roda sobre dados de beta consentidos via API pública do Lichess), **não
  infra in-app** — o que o torna viável mesmo com a arquitetura local-only. (Caminho GLM.)

### O que muda em E2-E4 (independe do tier escolhido)
- **E2 (slope) — RE-ROTULADO:** computa **ingredientes DESCRITIVOS** (segmentos de slope por
  formato + covariáveis: densidade, volume, pesos 1/RD²), **explicitamente NÃO-CAUSAIS**. Não é o
  estimador de eficácia; é insumo do estimador.
- **E3 (pré-registro) — ELEVADO a linchpin:** artefato CONGELADO *antes* de ver outcome — hipótese
  primária única e numérica, **UM formato primário** (ex.: rapid), threshold de efeito praticamente
  relevante (não só p<0.05), dose gate, **estimador exato travado (script rodando em dado SIMULADO)**,
  janelas pré/pós fixas, regra ITT/dropout (LOCF + imputação múltipla), correção de comparações
  múltiplas, **frase exata do resultado nulo**, placebo de tendências paralelas. A parte Dexie (E3)
  só persiste "pré-registrado em T com hash H" (migração = revisão DATA do maestro).
- **E4 (dose gate + efficacyReport) — ANTI-ARMADILHA:** o report apresenta o estimador **identificado**
  (DiD vs controle, ou AR(1)-corrigido) com a ressalva de RTM e o resultado do placebo — **NUNCA** um
  delta pré/pós nu. Honra a frase pré-registrada de resultado nulo.

## ⚠️ DECISÃO DO DONO — Tier do estimador causal (vai pro pacote de aprovação)
- **(Tier 1)** honesto-mas-limitado, sem controle externo. Mais rápido; rótulo "não-identificado".
- **(Tier 1.5 / 2-lite) [RECOMENDO]** Tier 1 + **coorte de controle LEVE** (centenas de não-usuários
  pareados do Lichess, não milhões) pra DiD. Captura o "você precisa de controle" do GLM sem a
  engenharia de escala; identifica o efeito; é script offline. Coerente com a Decisão #3 (o dono
  escolheu RIGOR — Tier 1 sozinho arrisca o falso-positivo que ele quis evitar).
- **(Tier 2)** controle sintético completo da população. Padrão-ouro; lift maior; possivelmente
  over-engineering pro N de um beta inicial.

Recomendação: **Tier 1.5**. E1 (plumbing de série de rating) procede já, é igual nos três tiers.

## NON-GOALS
NÃO mostrar delta pré/pós nu como prova de eficácia (Tier 0). NÃO escolher janela/estimador/responder
DEPOIS de ver o dado (garden of forking paths). NÃO agregar rapid+blitz+classical num só número (pools
distintos). NÃO rodar estudo sub-poderado e vendê-lo como evidência (declarar MDE no pré-registro).
NÃO implementar o estimador causal antes do OK do dono no tier. NÃO bloquear E1 por esta decisão.
