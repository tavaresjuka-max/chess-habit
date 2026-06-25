# Fichas Pedagógicas — Batch 4 (elite) · orientadas ao LEVER

**Data:** 2026-06-24
**Propósito:** alimentar o mapa **conceito → themeSet** (o lever decidido em 2026-06-24:
acoplar cada conceito ensinado aos puzzle themes / Study do Lichess no estágio certo).
Estas fichas NÃO são resumos genéricos — cada uma mapeia o método do mestre para o nosso
vocabulário (estágios `explain→guided→retrieval→transfer→review`, tags de fraqueza, e os
**74 slugs verificados** de `lichessPuzzleThemes`).
**Método:** council externo (DeepSeek V4 Pro + GLM 5.2, mesmo prompt, modelos diferentes =
cross-check de alucinação); maestro adjudica, corrige e escreve. **Sem upload de conteúdo** —
o council trabalhou do conhecimento próprio dos livros.
**Guarda de IP:** só ABORDAGEM/MÉTODO/ESTRUTURA. Nenhuma posição, FEN, lance, linha, diagrama,
problema específico ou trecho. Quando incerto → confiança rebaixada, nunca invenção.
**Confiança:** alta | média | baixa, por ficha.

---

## 1. Síntese para o lever — sementes do mapa `conceito → themeSet`

Insight central da síntese: **dois livros formam o arco tático completo**. Reinfeld dá o
**volume de retrieval** (drill por tema) mas quase não ensina; **Nunn (Learn Chess Tactics)
dá o explain/guided** dos mesmos motivos. O Lichess já hospeda os puzzles — o app **roteia para
o theme**, não reimplementa posições.

Camada **tática** (em-faixa 800–1200, bem alimentada):

| Conceito (tag) | explain/guided (ensina) | retrieval → themeSet Lichess (verificado) | fonte-mestre |
|---|---|---|---|
| `fork` | Nunn LCT — garfo | `fork` | Nunn LCT + Reinfeld |
| `pin` | Nunn LCT — cravada | `pin` | Nunn LCT + Reinfeld |
| `skewer` | Nunn LCT — espeto | `skewer` | Nunn LCT + Reinfeld |
| `discovered` | Nunn LCT — descoberto | `discoveredAttack`, `discoveredCheck`, `doubleCheck` | Nunn LCT + Reinfeld |
| remoção do defensor / desvio | Nunn LCT — deflexão/atração | `deflection`, `capturingDefender`, `clearance`, `attraction` | Nunn LCT + Reinfeld |
| `hanging-piece` | segurança de captura básica | `hangingPiece`, `trappedPiece` | Lichess + Reinfeld |

Camada **mate** (em-faixa, Reinfeld *1001 Checkmate* = drill puro):

| Conceito | retrieval → themeSet Lichess (verificado) | nota |
|---|---|---|
| `mate-in-2` / mate básico | `mateIn1`, `mateIn2`, `mate`, `oneMove` | núcleo 800–1200 |
| mate de corredor | `backRankMate` | alto valor (erro comum na faixa) |
| mate sufocado | `smotheredMate` | padrão nomeado |
| mates nomeados avançados | `anastasiaMate`, `arabianMate`, `bodenMate`, … | faixa superior dentro de "mate" |

Camadas com **GAP honesto** (sem drill conceito→theme limpo em-faixa — NÃO forçar):

| Conceito | situação | encaminhamento |
|---|---|---|
| `blunder-rate`, `time-trouble` | Krogius é diagnóstico psicológico — **sem theme** | checklist Study + módulo de **review** pós-partida; não é puzzle |
| posicional (casa-fraca/outpost, peça ruim) | Stean, **acima da faixa** (~1200+) | precisa Study + tags futuras `outpost`/`bad-piece`; fora do lever imediato |
| `endgame-pawn`, `endgame-rook` | nenhum livro-mestre **em-faixa** neste batch | themes existem (`pawnEndgame`, `advancedPawn`, `rookEndgame`, `queenRookEndgame`) mas falta fonte-mestre de ensino 0–1200 |

> Validade dos slugs: garantida pela guarda anti-404 do gap1 (`resourceCatalog.test.ts`, commit
> `a93a5e5`) — todo slug acima ∈ catálogo `lichessPuzzleThemes` verificado/link-checked. Nenhum
> slug inventado nesta ficha.

---

## 2. Fichas

### Simple Chess — Michael Stean
- **Conceito(s)-núcleo:** posicional básico — casa-fraca/outpost, peão fraco, coluna aberta/7ª
  fileira, peão passado, ataque de minoria. Sem tag tática direta (tangencia `opening-principles`,
  `conversion`).
- **Método em 1 frase:** cada capítulo introduz UM conceito posicional e demonstra o plano que o
  explora em partidas-modelo anotadas, sem árvore de variantes.
- **Escalonamento:** `explain` (enuncia o "porquê" posicional) → `guided` (partida anotada conduz
  a decisão lance a lance). **Não chega a retrieval/transfer** — não tem exercícios próprios.
- **Tipos de exercício → themes:** **sem theme Lichess — precisa Study** (são decisões de plano,
  não puzzles táticos agudos).
- **Study que replicaria:** por conceito — (1) explain abstrato; (2) 2–3 partidas-âncora anotadas;
  (3) lista de "sinais" reconhecíveis. Sem posições concretas no esqueleto.
- **Encaixe:** banda ~1200–1700 (**acima** do aluno principal 800–1200). Aproveitável só como
  *sinal de roteamento* ("antes do plano, identificar casa-fraca/peão-fraco"), não como puzzle.
  O núcleo de design — **um conceito por unidade, sem variantes** — é ouro instrucional.
- **Confiança:** **média** — método e pegada (conceito→partida anotada, organização por TEMA
  posicional) sólidos. *Cross-check:* descartada a alegação (DeepSeek, alta confiança) de que o
  livro se estrutura em "3 partidas-modelo" — GLM e revisão do maestro confirmam organização por
  **conceito posicional**, não por 3 jogos. Nomenclatura exata de capítulos não garantida.

### Psychology in Chess — Nikolai Krogius
- **Conceito(s)-núcleo:** erro de origem psicológica — atenção instável, "imagem da posição"
  (viés de avaliação prévia / jogar a posição de lances atrás), regulação emocional, fadiga/tempo.
  Casa com `blunder-rate`, `time-trouble`.
- **Método em 1 frase:** trata a psicologia do erro — classifica mecanismos mentais que causam
  blunders e como observá-los, via casos de partidas reais (não exercícios).
- **Escalonamento:** `explain` (define cada fator psicológico) → consolidação por
  auto-observação. **Sem guided/retrieval formais.**
- **Tipos de exercício → themes:** **sem theme Lichess — precisa Study/checklist**; mapeia para
  tags `blunder-rate`/`time-trouble` como rotina, não puzzle.
- **Study que replicaria:** módulos — atenção · ilusões de avaliação ("imagem retida") · regulação
  emocional · fadiga/tempo. Cada módulo = checklist de sinais + regra de parada (ex.: pausar antes
  de mover quando X). Sem posições.
- **Encaixe:** princípios valem **já em 800–1200** (blunder e time-trouble são a maior perda na
  faixa). Estágios `explain` + `review` recorrente. **Aplicação direta:** mini-relatório pós-Review
  do Lichess ("seus últimos blunders mostram padrão de imagem retida") — gera diagnóstico, não treino.
- **Confiança:** **média** — convergência dos dois modelos na pegada (Krogius, psicologia soviética,
  "imagem da posição", atenção). Lista exata de capítulos/nomes originais incerta.

### Learn Chess Tactics — John Nunn  *(reframe do council; ver nota)*
- **Conceito(s)-núcleo:** motivos táticos — cravada, espeto, garfo, ataque descoberto,
  deflexão/atração, captura do defensor, limpeza. Casa com `fork`, `pin`, `skewer`, `discovered`,
  e produz `mate-in-2`.
- **Método em 1 frase:** por motivo — conceito curto → exemplo resolvido passo a passo → bateria
  de exercícios.
- **Escalonamento:** `explain` (explica o motivo) → `guided` (resolve demonstrado) → `retrieval`
  (exercícios); `transfer` implícito em posições mistas no fim. **É o explain/guided que falta ao
  Reinfeld.**
- **Tipos de exercício → themes:** quase 1:1 — garfo→`fork`; cravada→`pin`; espeto→`skewer`;
  descoberto→`discoveredAttack`/`discoveredCheck`/`doubleCheck`; deflexão→`deflection`;
  atração→`attraction`; defensor→`capturingDefender`; limpeza→`clearance`.
- **Study que replicaria:** um capítulo por motivo (explain + 2–3 worked) + bloco final misto
  (retrieval→transfer). Sequência: fork → pin → skewer → discovered → deflexão/atração →
  remoção do defensor.
- **Encaixe:** banda **600–1400**, alinhado ao aluno principal 800–1200. **Fonte-mestre da camada
  tática do mapa**, lado explain/guided.
- **Confiança:** **alta** no método/encaixe; **média** na lista exata de capítulos.
- **Nota (reframe):** o batch4 pedia "Nunn" genérico. *Secrets of Practical Chess* (a 1ª escolha
  do DeepSeek) é faixa ~1400–2000 — **acima** do foco. GLM trocou para **Learn Chess Tactics**
  (2003), tático introdutório e em-faixa: melhor insumo de lever. *Secrets of Practical Chess* fica
  como opção de banda alta (checklist anti-relaxamento pós-vantagem, útil no `review`).

### Secrets of Modern Chess Strategy — John Watson
- **Conceito(s)-núcleo:** revisão crítica dos princípios posicionais clássicos (Nimzowitsch) à luz
  da prática moderna — "regras como tendências, não leis". Posicional avançado, sem tag direta.
- **Método em 1 frase:** tratado teórico que desconstrói dogmas posicionais via partidas de GM
  anotadas, por contraste histórico (regra clássica → exceção moderna → por quê).
- **Escalonamento:** `explain` denso → exemplos de GM (`guided` avançado). Sem exercícios, sem
  retrieval.
- **Tipos de exercício → themes:** nenhum → **sem theme Lichess** (e a Study seria de faixa alta).
- **Study que replicaria:** **não replicar para 0–1200** — o aluno precisa aprender as regras
  antes de quando quebrá-las. Risco de confundir é alto.
- **Encaixe:** **~1800+, fora da faixa.** Os dois modelos convergiram nisso. Único proveito em
  800–1200: o *design* da explicação por contraste — no máximo nota no `explain`, **não rota**.
- **Confiança:** **média-alta** na tese central (modernização de *My System*, tom anti-dogma);
  lista de capítulos/partidas incerta. **Arquivado honesto: não é insumo de lever na nossa faixa.**

### 1001 Brilliant Ways to Checkmate / 1001 Winning Chess Sacrifices and Combinations — Fred Reinfeld
- **Conceito(s)-núcleo:** reconhecimento de padrão por **volume** (mate + combinação). Casa com
  `mate-in-2` e a maioria dos motivos táticos.
- **Método em 1 frase:** coleção massiva de "joga e ganha / dá mate" agrupada por motivo, com
  solução enxuta — **drill de padrão, sem teoria**.
- **Escalonamento:** quase **nada de explain/guided** — é essencialmente `retrieval` puro;
  consolidação pela repetição/volume. (Cross-check: GLM corrigiu o DeepSeek aqui — Reinfeld
  **não** entrega o arco explain→transfer; entrega volume de drill.)
- **Tipos de exercício → themes (split dos 2 volumes, GLM):**
  - *1001 Checkmate* → `mate`, `mateIn1`, `mateIn2`, `mateIn3`, `backRankMate`, `smotheredMate`,
    `anastasiaMate`, `arabianMate` (família *Mate).
  - *1001 Sacrifices/Combinations* → `sacrifice`, `fork`, `pin`, `skewer`, `discoveredAttack`,
    `deflection`, `attraction`, `clearance`, `promotion`.
- **Study que replicaria:** **mínima** — o Lichess já tem esses themes. Não empacotar como Study
  própria; rotear o aluno ao theme nativo. Scaffold opcional: (1) "como reconheço este motivo?"
  checklist de atenção; (2) link ao theme; (3) autorrevisão do erro.
- **Encaixe:** banda **~800–1500**, acessível ao aluno principal. Estágio `retrieval` (drill).
  Valor real: **sinal de "qual theme bombardear"** por tag de fraqueza.
- **Confiança:** **alta** no método; **média** na divisão temática exata entre os dois volumes.
- **⚠️ Caveat de curadoria (GLM):** as soluções do Reinfeld (notação antiga) **às vezes têm erro**.
  **Nunca importar posições do livro** — usar os themes equivalentes do Lichess (verificados) no
  lugar. Esta é a razão técnica de o app ser orquestrador aqui, não provedor.

---

## 3. Procedência e cross-check (council)

- **Modelos:** DeepSeek V4 Pro (`deepseek-v4-pro`) + GLM 5.2 (`zai/glm-5.2`), prompts idênticos,
  paralelos, timeout-guarded. Diversidade pelo modelo, não por papel.
- **Convergiram:** Krogius (psicológico→`blunder-rate`/`time-trouble`, sem theme), Watson (fora da
  faixa), Reinfeld (mapa near-1:1, rotear ao theme nativo).
- **Cross-check pegou:** alucinação do DeepSeek em Stean ("3 partidas-modelo" em alta confiança) →
  descartada (estrutura é por conceito posicional). Reinfeld: GLM corrigiu o exagero de escalonamento
  (é retrieval, não arco completo) e adicionou o caveat de soluções imprecisas.
- **Divergência útil:** Nunn — GLM trocou para *Learn Chess Tactics* (em-faixa) vs *Secrets of
  Practical Chess* (acima). Maestro adotou o reframe (melhor lever) e registrou os dois.
- **Gate objetivo (anti-404): PASS** — todo slug emitido pelos dois ∈ catálogo verificado de 74
  temas; a guarda `resourceCatalog.test.ts` (gap1, `a93a5e5`) protege isso em CI.

## 4. Próximo lever (deriva destas fichas, NÃO feito aqui)
1. Promover a tabela §1 a um **mapa concept→themeSet curado** versionado (código/dados), consumível
   pelo seletor — fechando a lacuna de "puzzle genérico" do council 2026-06-24.
2. Preencher os **gaps honestos**: fonte-mestre de **endgame** em-faixa (Nunn é mestre de finais,
   mas *Learn Chess Tactics* não cobre) e tags posicionais futuras (`outpost`/`bad-piece`).
3. Ligar Krogius ao **módulo de review** (diagnóstico de padrão de blunder pós-partida), não ao drill.
