# DECISÃO — Protocolo de Falsificação (n=1) do Método

- **Status:** DECIDIDO (dono aprovou em 2026-07-02; "siga")
- **Origem:** 2 councils DIVERGIR/VERIFICAR (DeepSeek V4 Pro + GLM 5.2) + selo Fugu Ultra + adjudicação do maestro (2026-07-01 → 2026-07-02)
- **Relacionados:** `e2e4-efficacy-methodology-DECISION.md` (metodologia RTM/AR(1)), `e3-preregistration-FROZEN.md` (pré-registro v1, imutável), `pedagogical-concept-contracts-blind-retrieval-SPEC.md` (blind evidence)

## Postura (inegociável)

Este app **tenta se falsificar, não se provar**. Evidência favorável = **ausência de
falsificação**, nunca "eficácia comprovada". Nenhuma superfície do produto (UI, docs,
marketing) pode alegar eficácia comprovada. Com n pequeno, alegação causal forte é
pseudociência; o que fazemos é um **protocolo de competência n=1** com gates objetivos
pré-registrados.

## O gate duplo (por nó conceitual, quando o dado existir)

Após **30 dias** de treino num nó (referência temporal: `RETENTION_GATE_DAYS`), a alegação
"o método causa retenção transferível" para aquele nó **sobrevive** somente se AMBOS:

1. **Sonda de transferência:** ≥ **70%** de acerto numa sonda **inédita** de **10 itens**
   derivados de **partidas reais** do tema (nunca vistos em treino; sem overlap com o pool
   de puzzles treinados).
2. **Blunder-rate do tema:** taxa de blunder grave do tema nas partidas reais pós-diploma
   cai para **< metade** do baseline (baseline = **20 partidas** pré-treino).

Falha em **qualquer um** ⇒ hipótese **falsificada para aquele nó** (resultado publicado,
não escondido). Repetição em **3 nós independentes** ⇒ robustez. `< 20` partidas de
baseline ⇒ `insufficient-data` (nunca falso-positivo por amostra curta).

### Definição de "blunder" (decisão D3 — proxy declarado)

- **Alvo final:** perda > **300cp** por lance (exige `evals`/lances da API — ver D1).
- **Enquanto D1 não roda:** usa-se a categoria agregada `analysis.blunder`/`acpl` que o
  Lichess já fornece por partida, **declarada como proxy** em toda superfície que a exibir.
  Proxy é agregado por partida — **não** atribuível a nó tático. Portanto, enquanto o proxy
  vigorar, o gate é **GLOBAL** (método inteiro), nunca por nó — rotulado como tal.

### Granularidade por nó — pré-requisito técnico (D1 + spike)

Atribuir posições de partidas reais a um dos 14 nós exige: (a) ligar `moves`/`pgnInJson`
na API (escopado: ~30 partidas, 1 perf, cache); (b) parser PGN→FEN; (c) **spike de
viabilidade (1–2 dias)** de classificação de temas em posição arbitrária **sem engine**
(ADR-006 proíbe engine no app). Spike falha ⇒ gate segue global-declarado, sem fraude
de granularidade. **Exceção:** a autópsia de derrotas injeta a **posição exata** do erro
no SM-2 — não precisa de classificador (a posição real é o item).

## Adesão — desfecho zero

O método só pode causar retenção se antes causar **retorno**. Pré-condição de qualquer
gate: **adesão** medida como % de dias com ≥ 1 bloco completado na janela do gate.
Adesão abaixo do piso pré-registrado ⇒ gate retorna **`not-evaluable`** (não "passou"
nem "falsificou"). A janela de adesão do gate (30d por nó) é independente da janela de
dose mínima do pré-registro E3 (90d) — gates distintos, não intercambiáveis.

## Cláusula do experimentador (dogfood)

Enquanto o aluno n=1 for o próprio dono (que conhece as hipóteses e lê o código),
**cegamento é impossível**: resultado **positivo** no dogfood vale como **calibração do
instrumento**, não como evidência. Resultado **negativo** vale cheio (se mesmo sabendo
não transfere, a falsificação é ainda mais dura). Evidência começa no primeiro aluno
que não é o dono.

## Nós-fantasma (escalonados, com cláusula de morte)

Controle interno opcional: 2–3 conceitos nunca ensinados, sondados na mesma cadência.
Só entram **após** o 1º nó real demonstrar transferência. Guardrails: seleção aleatória
(nunca por fraqueza), dificuldade basal equiparável, sondagem esparsa e fixa, análise por
diferença de inclinação + parallel-trends como placebo. **Cláusula de morte:** se após
2 nós reais validados os fantasmas não mostrarem parallel-trends, o instrumento é
abandonado (fallback: protocolo segue sem fantasmas). No dogfood, fantasma só calibra
(ver cláusula do experimentador).

## Não-objetivos

- NÃO reabrir o diploma por acurácia (80%/30) — decisão de 2026-06-19.
- NÃO usar proxy de abertura/ECO para atribuir blunder a nó tático (fraude metodológica).
- NÃO rodar engine no app (ADR-006).
- NÃO alegar causalidade populacional a partir de n=1.
