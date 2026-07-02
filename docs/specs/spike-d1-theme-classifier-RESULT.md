# SPIKE D1 — Resultado: classificador heurístico de temas SEM engine

- **Status:** SPIKE concluído (grupo SPIKE-D1, 2026-07-02)
- **Origem:** `falsification-protocol-DECISION.md` — seção "Granularidade por nó —
  pré-requisito técnico (D1 + spike)"; este documento é o veredito do spike de 1–2 dias ali
  previsto
- **Código:** `src/domain/autopsy/themeClassifier.ts` (+ `.test.ts`, `.fixtures.ts`)
- **Relacionados:** ADR-006 (proíbe engine de avaliação; `chessops` para regras/geração de
  lances é permitido), `autopsyReport.ts` (fonte dos erros reais — `fenBefore`/`bestUci`),
  `pedagogical-concept-contracts-blind-retrieval-SPEC.md` (catálogo de 14 nós)

## Pergunta do spike

É viável atribuir uma posição de partida real a um dos 14 nós do catálogo (fork, pin,
skewer, discovered, mate-in-1, mate-in-2, back-rank, hanging-piece, ...) **sem rodar
engine**, usando só geometria/regras (`chessops`)? Se sim, com que precisão, e para quais
tags especificamente?

## Método

Implementados **5 detectores** de alta precisão plausível (dos 14 nós do catálogo — os
outros 9 são discutidos em "Fora de escopo" abaixo). Cada detector é uma função pura
`(Position, bestUci) => ThemeClassification | undefined`, geometria/material apenas —
nenhuma avaliação de posição (ADR-006 respeitado).

Para cada detector, construí **manualmente** (validando cada FEN/lance via chessops antes
de commitar — `isLegal`, `isCheckmate`, `isCheck`, `ray`/`between`) um conjunto de fixtures:

- **≥3 positivos**: posições onde o tema genuinamente ocorre no lance jogado.
- **≥3 negativos adversariais**: posições que *parecem* o tema mas não são (captura
  defendida, garfo de peça de baixo valor, xeque sem mate, rei com fuga, cravada com
  bloqueio duplo) — desenhados para expor falso-positivo, não só "caso óbvio que não é nada".

O teste (`themeClassifier.test.ts`) roda `classifyTheme` em cada fixture e agrega
`truePositives / falseNegatives / trueNegatives / falsePositives` por tag
(`measurePrecision`). Os números abaixo são **lidos direto do resultado do teste**, não
estimados.

## Resultado medido (por tag)

| Tag             | Positivos | Negativos | TP  | FN  | TN  | FP  | Precisão* | Recall* | Veredito              |
|-----------------|-----------|-----------|-----|-----|-----|-----|-----------|---------|------------------------|
| `mate-in-1`     | 3         | 4         | 3   | 0   | 4   | 0   | 100%      | 100%    | **viável-alta-precisão** |
| `hanging-piece` | 3         | 3         | 3   | 0   | 3   | 0   | 100%      | 100%    | **viável-alta-precisão** |
| `back-rank`     | 3         | 3         | 3   | 0   | 3   | 0   | 100%      | 100%    | **viável-alta*/baixa mista** (ver nota) |
| `fork`          | 3         | 4         | 3   | 0   | 4   | 0   | 100%      | 100%    | **viável-alta/baixa mista** (ver nota) |
| `pin`           | 3         | 3         | 3   | 0   | 3   | 0   | 100%      | 100%    | **viável-baixa** (confidence sempre `low`) |

\* Precisão/recall são sobre o **conjunto de fixtures sintéticas construídas**, não sobre uma
amostra de partidas reais — ver "Limitações" abaixo. 100% neste conjunto pequeno e
adversarial-mas-controlado é um sinal forte de que a geometria de cada detector está correta,
**não** uma alegação de que o detector acerta 100% em partidas reais arbitrárias.

**Nota `back-rank`/`fork`:** cada detector retorna `confidence: 'high'` OU `'low'` conforme o
caso — a tabela agrega os dois níveis sob "detectou a tag correta"; a métrica de interesse
real é **quantos dos positivos vieram como `high`**:
- `back-rank`: 2/3 fixtures positivos vieram `high` (mate confirmado), 1/3 veio `low` (xeque
  sem confirmação de mate) — por desenho do detector, não falha.
- `fork`: todos os 3 positivos vieram `high` neste conjunto (todos envolviam rei ou dama);
  o detector também suporta `low` (peças valiosas sem rei/dama), não testado com um positivo
  dedicado a esse subcaso específico — risco documentado abaixo.

## Veredito por tag (para decisão de wiring futuro)

### `mate-in-1` — viável-alta-precisão
Detector é **exaustivo por construção**: `isCheckmate()` do chessops é regra pura (não
avaliação), então não há ambiguidade possível — se o lance jogado é `bestUci` e resulta em
xeque-mate, a tag está sempre correta. Nenhum falso-positivo é geometricamente possível.
**Recomendação: pode ser ligado como `high` sem reservas.**

### `hanging-piece` — viável-alta-precisão
Detector verifica "captura de peça com zero defensores" via `attacks()` exaustivo sobre
todas as peças do lado capturado. Também exaustivo/determinístico — não há ambiguidade de
avaliação (não julgamos se a troca resultante é "boa", só se a peça tinha defensor).
**Limitação real:** não considera *ataques indiretos* (uma peça pode estar "defendida" no
sentido de reocupar a casa, mas a recaptura pode perder material por outro motivo — ex.
cravada do defensor, xeque descoberto ao recapturar). Isso é uma limitação de **profundidade
tática**, não de precisão geométrica: o detector responde corretamente "a peça tinha
defensor geométrico sim/não", que é uma pergunta mais restrita que "a captura foi um erro".
**Recomendação: pode ser ligado como `high`,** com a ressalva de que "defendida
geometricamente" ≠ "captura seria má ideia" (não afirmamos isso).

### `back-rank` — viável-alta (subset) / viável-baixa (subset)
Quando o detector confirma `isCheckmate()` após o lance, é tão exaustivo quanto
`mate-in-1` (`high`, sem falso-positivo possível). Quando só confirma `isCheck()` com o rei
geometricameante cercado, é uma heurística mais fraca (`low`) — o rei pode ter defensor que
capture ou bloqueie o cheque (como no fixture `q5k1/.../4R1K1`), então "cercado pelos peões"
não implica ameaça real inescapável.
**Recomendação: ligar só o subset `high` (mate confirmado);** o subset `low` é
vulnerabilidade geométrica, não o padrão tático "back-rank mate" completo — não ligar como
sinal de tema sem revisão adicional.

### `fork` — viável-alta (subset com rei/dama) / não testado exaustivamente (subset sem rei/dama)
A heurística (peça não-peão/não-rei ataca ≥2 peças inimigas de valor ≥ peça atacante, pós
lance) é geometricamente sólida para o **caso testado** (todos os 3 positivos envolviam
rei ou dama, retornando `high`). O código também classifica forks **sem** rei/dama como
`low` (dois alvos de valor comparável, nenhum é rei/dama) — este subcaso **não tem um
fixture positivo dedicado** no conjunto atual (é coberto só indiretamente pela lógica dos
negativos, que confirmam que peças de valor insuficiente NÃO disparam). Antes de ligar o
subset `low` em produção, adicionar fixtures positivos específicos para ele.
**Limitação real conhecida (não testada, documentada por inspeção):** o detector não avalia
se as peças "atacadas" têm defesa suficiente para a sequência de captura compensar — um
"fork" geométrico onde ambos os alvos são bem defendidos não é uma ameaça tática real. Isso
é inerente a não rodar engine (ADR-006); é uma limitação de **julgamento posicional**, não
um bug do detector.
**Recomendação: ligar só o subset `high` (envolve rei ou dama)** — é o caso onde "geometria
= ameaça real" é quase sempre verdade (rei não pode ser "defendido" contra captura; dama
raramente vale trocar por peça mais barata). Não ligar o subset `low` sem fixtures
adicionais e provavelmente sem checagem de defesa dos alvos.

### `pin` — viável-baixa (sempre)
O detector confirma cravada absoluta geométrica (exatamente 1 peça inimiga entre a peça
deslizante recém-movida e o rei inimigo, na direção que essa peça cobre). Geometricamente
correto e exaustivo dentro da própria definição (`ray`/`between` são regras puras). **Mas
a definição em si é fraca como sinal pedagógico:** cravar um peão sem consequência tática
(ex. peão cravado que já não ia se mover) é geometricamente idêntico a cravar uma peça
decisiva. O detector nunca sabe diferenciar "cravada relevante" de "cravada trivial" sem
avaliação — por isso `confidence` é **sempre `'low'`**, por design.
**Recomendação: NÃO ligar como sinal de autópsia/tema** sem uma camada adicional de
julgamento (fora de escopo deste spike, exigiria heurística extra ou avaliação — proibida).

## Fora de escopo (9 tags do catálogo NÃO cobertas por este spike)

`skewer`, `discovered`, `mate-in-2`, `opening-principles`, `time-trouble`, `endgame-pawn`,
`endgame-rook`, `conversion`, `blunder-rate` **não têm detector implementado**. Análise
rápida por categoria (sem implementação, só avaliação de viabilidade a priori):

- **`skewer`, `discovered`**: geometricamente similares a `pin` (mesma família de
  detectores via `ray`/`between`), plausivelmente viáveis com esforço comparável — não
  implementados por escopo do spike (tempo), não por inviabilidade aparente.
- **`mate-in-2`**: exigiria busca em profundidade 2 sobre respostas do oponente — muito
  mais caro computacionalmente que mate-in-1 (que é O(lances legais)); teoricamente viável
  sem engine (é busca de jogo completo, não avaliação), mas fora do escopo barato deste
  spike.
- **`opening-principles`, `time-trouble`, `endgame-pawn`, `endgame-rook`, `conversion`,
  `blunder-rate`**: são temas **posicionais/estruturais ou agregados por partida**, não
  padrões táticos pontuais num único lance. Não são detectáveis por geometria de um lance
  isolado — exigiriam avaliação posicional (fase de jogo, estrutura de peões, atividade de
  peças) que ADR-006 proíbe, ou são inerentemente agregados (blunder-rate já é um agregado
  declarado como proxy global no protocolo de falsificação, não um tema por posição).
  **Veredito a priori: inviável-sem-engine** para estes 6.

## Limitações honestas (leitura obrigatória antes de qualquer wiring)

1. **Fixtures são sintéticas, não partidas reais.** 100% de precisão neste conjunto mede
   "a geometria do detector está implementada corretamente para os casos que pensei em
   testar", não "o detector classifica corretamente uma amostra representativa de erros
   reais de enxadrista amador". Partidas reais têm posições muito mais confusas (peças
   penduradas MAS o adversário também está com o rei exposto, garfos que existem mas custam
   material em outra frente, etc.) que nenhuma fixture sintética captura totalmente.
2. **Nenhum detector avalia "vale a pena".** Todos são geometria/material puros — um
   `hanging-piece` pode estar tecnicamente indefeso mas capturá-lo pode ser um erro maior
   (abre a posição do próprio rei, por exemplo). O classificador NUNCA afirma isso; afirma
   só o fato geométrico restrito descrito em cada detector.
3. **Cobertura de 5/14 tags.** A maioria dos nós do catálogo pedagógico (9/14) não é
   coberta por este spike, por serem estruturalmente diferentes (agregados de partida,
   posicionais, ou buscas mais caras) — ver "Fora de escopo".
4. **Múltiplas tags podem disparar no mesmo lance** (ex. `Re8#` é `mate-in-1` E
   `back-rank` simultaneamente) — isto é esperado e correto (não é um bug de exclusividade),
   mas significa que o classificador não produz uma tag única por posição.

## Recomendação final

**Só as classificações `confidence: 'high'` de `mate-in-1`, `hanging-piece`, `back-rank`
(subset mate confirmado) e `fork` (subset rei/dama) devem ser consideradas para ligar aos
itens de autópsia** — e mesmo assim, como **hipótese adicional de rotulagem**, nunca como
prova de eficácia (postura do `falsification-protocol-DECISION.md` continua valendo:
zero alegação de eficácia comprovada). `pin` não deve ser ligado (confidence sempre baixa
por definição). As 9 tags fora de escopo continuam sem qualquer caminho de granularidade
por nó sem engine.

**A granularidade por nó continua PARCIAL.** O gate global-declarado (proxy agregado de
`blunder-rate` por partida, conforme D3 do `falsification-protocol-DECISION.md`) **permanece
o default** para qualquer alegação de retenção — este spike não desbloqueia o gate por nó
para o método como um todo, só demonstra que uma fração pequena e específica de tags (as de
alta confiança) *poderia* alimentar uma rotulagem adicional/opcional em itens de autópsia
individuais, caso um wiring futuro decida usá-la para fins de exibição/organização (não de
gate de eficácia). Wiring é explicitamente **fora de escopo** deste grupo (SPIKE-D1).
