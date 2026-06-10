# Analise dos Convertidos - DEEPSEEK

**Data:** 2026-06-09
**Fonte:** 67 TXT convertidos de AZW/AZW3/EPUB via Calibre
**Metodo base:** `docs/pedagogy/metodo-consolidado-acervo-2026-06-09.md`

---

# PASSO 1 — Fichamento dos Convertidos

## 1.1 — Verificacao de Afirmacoes Anteriores

### CORRECAO: DAMP = Defesa, Alinhamento, Mobilidade, Promocao

**Confirmado pela leitura do indice e capitulos do livro.** O Gemini afirmou "Descobrir/Ameaçar/Modificar/Prevenir" — **ERRADO**. O texto real mostra:

| Letra | Significado real | Funcao |
|-------|-----------------|--------|
| **D** | Defesa | Rei adversario esta exposto? Peca indefesa? Roque fraco? |
| **A** | Alinhamento | Pecas alinhadas na mesma coluna/diagonal? (espeto, cravada, raio-X) |
| **M** | Mobilidade | Peca adversaria tem poucas casas? (zugzwang, afogamento, mate sufocado) |
| **P** | Promocao | Peao proximo de promover? (desvio, bloqueio, promocao tatica) |

DAMP e um **checklist de DETECCAO** — onde procurar tatica. Nao e um ritual de seguranca (como Heisman LPDO). **(E) — confirmado pelo texto.**

### CORRECAO: "Como montar programacao" e de GM Rafael Leitao

O livro e transcricao de uma palestra do **GM Rafael Leitao** (hexacampeao brasileiro, unico GM brasileiro com esse historico). A analise anterior tratou como generico — e muito mais autoritativo. Estruturado em 3 faixas:
- Ate 1900
- 1900-2300
- Acima de 2300

**(E) — confirmado pelo texto.**

### DESCOBERTA: Autor unico por tras de varias colecoes

**John C. Murray** e o autor de TODAS estas series:
- Movimento Forcado (6 volumes)
- Xadrez Passo a Passo (7 volumes)
- Escola Sovietica de Xadrez (9 volumes)
- Escola Alema de Xadrez (4 volumes)
- Escola Francesa de Xadrez (8 volumes)
- Escola Canadense de Xadrez (5 volumes)
- Escola Japonesa de Xadrez (6 volumes)
- Escola Americana de Xadrez (2 volumes)
- Estrategia Britanica de Xadrez (4 volumes)
- Gigantes do Xadrez Feminino (7 volumes)
- Xadrez Vitorioso (2 volumes)
- Xadrez Basico (2 volumes)

**~60 livros do MESMO autor, mesmo formato.** O formato e padronizado: biografia do jogador + partidas anotadas + exercicios (adivinhe o lance). Isso explica a redundancia observada entre as colecoes. **(E) — confirmado pela comparacao de creditos em 4 livros diferentes.**

---

## 1.2 — Fichas por Livro Individual

### DAMP — O Algoritmo da Tatica (Claudio Nunes Duarte & Julio Lapertosa) [PT-BR, 2019]
- **Faixa real:** 600-1400
- **Filosofia:** Checklist de deteccao tatica. Em vez de esperar a tatica "saltar aos olhos", o aluno aplica DAMP sistematicamente em cada posicao.
- **Como explica:** Cada letra ganha um capitulo proprio com exemplos. Progressao: ver DAMP em posicoes simples → aplicar em posicoes complexas → problemas.
- **Como exercita:** 10 capitulos de problemas (do simples ao complexo). Resposta: identificar qual elemento DAMP esta presente E achar o lance.
- **Feedback:** Solucoes no final. Sem taxonomia de erro.
- **Melhor que vale absorver:** (1) **Primeiro metodo tatico BRASILEIRO original.** (2) DAMP como checklist de DETECCAO — ensina ONDE procurar, nao so qual lance. (3) Complementa CCT (Hertan) que e sobre LANCES forcados, nao sobre DETECCAO de temas.
- **O que descartar:** Nao substitui treino de puzzles — e o "pre-puzzle": ensina a ver QUE ha tatica.
- **Encaixe:** 600-1400, tatica, explain → guided → retrieval. Novo drill_format: DAMP-scan.
- **Mapeavel no Lichess?:** Parcial — puzzles tematicos para cada letra (Defesa→/training/hangingPiece, Alinhamento→/training/pin+skewer, Mobilidade→/training/knightEndgame, Promocao→/training/pawnEndgame)
- **Valor marginal:** ALTO. Metodo original PT-BR. A lacuna de "checklist tatico em portugues" esta fechada.
- **Nota:** 9 — unico no genero em PT-BR, metodo original.

### Como Montar Uma Programacao de Treinamento (GM Rafael Leitao) [PT-BR]
- **Faixa real:** 0-2300 (todos os niveis)
- **Filosofia:** Time budgeting + priorizacao de areas por faixa de forca. Dividir o tempo de estudo entre abertura, meio-jogo, final, tatica e partidas.
- **Sequencia por faixa:**
  - **Ate 1900:** 50% tatica, 20% finais, 15% aberturas, 15% partidas. Foco em nao perder pecas.
  - **1900-2300:** 40% tatica, 20% estrategia, 20% finais, 20% aberturas + partidas. Foco em plano e estrutura.
  - **2300+:** 30% aberturas (preparacao), 25% calculo, 20% finais, 25% partidas/analise.
- **Como explica:** Palestra transcrita — tom coloquial, direto. Dicas praticas de um GM brasileiro.
- **Como exercita:** Nao e livro de exercicios — e guia de COMO ESTUDAR.
- **Feedback:** Nao se aplica (e meta-livro).
- **Melhor que vale absorver:** (1) **Time budgeting por faixa** — diretamente aplicavel ao gerador de plano. (2) Prioridades do GM #1 do Brasil. (3) Em PT-BR — acessivel. (4) Divide treino entre "estudo" e "pratica" — alinhado com deliberate practice.
- **Encaixe:** Transversal (meta-aprendizagem). Influencia as regras de proporcao do gerador.
- **Mapeavel no Lichess?:** Sim — as recomendacoes de Leitão mapeiam diretamente (Puzzles=tatica, Practice/Studies=estrategia, Analysis=partidas).
- **Valor marginal:** ALTO. Time budgeting de um GM brasileiro. Nao havia nada similar em PT-BR.
- **Nota:** 9 — guia de treino autoritativo em PT-BR.

### Movimento Forcado (John C. Murray, vols 1-6) [PT-BR, traduzido do frances]
- **Faixa real:** 1200-2000 (vol 1: 1200-1400, vol 6: 1800+)
- **Filosofia:** Treino de CALCULO por exercicios graduados. Cada volume foca em um tema (vol 1: mate em 2; vol 2+: temas progressivos).
- **Como exercita:** Exercicios (mate em 2 no vol 1, ~200 paginas de problemas). Posicoes de partidas reais de 2018. Solucoes no final.
- **Melhor que vale absorver:** (1) Serie graduada de calculo — progressao clara de dificuldade. (2) Em PT-BR (traduzido). (3) Posicoes modernas (2018), nao classicas.
- **O que descartar:** Volume 1 e SO mate em 2 — util mas estreito. Nao ensina METODO de calculo, so dao exercicios.
- **Encaixe:** 1000-1800, calculo, retrieval. Complementa Ramesh/Edouard com material PT-BR.
- **Mapeavel no Lichess?:** Sim — /training/mateIn2, Puzzle Streak.
- **Valor marginal:** MEDIO. Bom banco de exercicios PT-BR, mas nao e metodologico — e pratica pura.
- **Nota:** 7 — exercicios uteis, falta metodo.

### Manual de Aberturas de Xadrez (Marcio Lazzarotto, vols 1-4) [PT-BR, 2021]
- **Faixa real:** 1000-1800
- **Filosofia:** **Principios primeiro, variantes depois.** Comeca com "Objetivos da abertura" (desenvolvimento, centro, seguranca do rei). Depois apresenta cada abertura com: ideias estrategicas → planos tipicos → variantes principais.
- **Como explica:** Cada abertura: explicacao conceitual + tabelas de variantes. Inclui codigos ECO. Estruturado como referencia, nao como curso.
- **Melhor que vale absorver:** (1) Aberturas em PT-BR com principios ANTES de variantes. (2) Conecta abertura a plano de meio-jogo. (3) 4 volumes cobrem todas as aberturas — referencia completa.
- **O que descartar:** Para <1200, so a secao "Objetivos da abertura" e relevante. O resto e referencia para quando o aluno ESCOLHEU uma abertura.
- **Encaixe:** 1000-1800, abertura-principio (explain) → abertura escolhida (guided, 1400+).
- **Mapeavel no Lichess?:** Sim — Lichess Opening Explorer + Studies por abertura.
- **Valor marginal:** ALTO. Preenche a lacuna de "repertorio de abertura PT-BR por principios".
- **Nota:** 8 — excelente referencia PT-BR.

### Xadrez Passo a Passo (John C. Murray, vols 1-7) [PT-BR]
- **Faixa real:** 800-1600
- **Formato:** Biografia da campea + "Jogue como [campea]" — partidas anotadas com exercicios de adivinhar o lance.
- **Filosofia:** Aprender por IMERSAO em partidas-modelo de campeas mundiais.
- **Melhor que vale absorver:** (1) Progressao em 7 volumes (do mais simples ao mais complexo). (2) Partidas de campeas mundiais — diversidade de estilos.
- **O que descartar:** Formato "adivinhe o lance" sem metodo de pensamento explicito. Redundante com colecoes "Escola".
- **Valor marginal:** BAIXO. Bom material de pratica, mas formato identico as outras series Murray.
- **Nota:** 6

### Colecoes "Escola" (Murray): Sovietica (9), Alema (4), Francesa (8), Canadense (5), Japonesa (6), Americana (2), Britanica (4), Gigantes (7)

**~45 livros do mesmo autor com formato identico:**
1. Biografia do jogador (3-5 paginas)
2. Partidas anotadas do jogador
3. Exercicios "adivinhe o lance"
4. Solucoes

- **Filosofia:** Aprender por IMERSAO no estilo de um mestre. Estudar varios mestres de diferentes escolas.
- **Melhor que vale absorver:** (1) Conceito de "estudar UM mestre por vez" — imersao. (2) Keres, Nejmetdinov, Tartakower, Tal em PT-BR. (3) Cobertura enciclopedica de estilos (sovietico, alemao, frances, britanico).
- **O que descartar:** EXTREMAMENTE redundantes entre si. Mesmo formato, mesmo autor. ~45 livros poderiam ser 5 sem perda.
- **Valor marginal:** BAIXO. O formato e valido, mas a redundancia e massiva. Bons como biblioteca de partidas anotadas PT-BR, nao como metodo.
- **Nota:** 5 (coletivo — individuais variam de 3 a 7)

### Outros Convertidos Relevantes

| Livro | Autor | Valor | Nota |
|-------|-------|-------|------|
| Xadrez Vitorioso (2 vols) | Murray | Finais praticos PT-BR — exercicios de final | 7 |
| Treino tatico final c/ Yusupov | Murray | Tatica com Yusupov — exercicios | 6 |
| 100 posicoes para testar xadrez | — | CORROMPIDO — nao convertido | 0 |
| 113 exercicios para criancas (3 vols) | Murray | Exercicios infantis basicos | 5 |
| Gigantes do Xadrez Feminino (5 vols) | Murray | Partidas de campeas mundiais | 6 |

---

# PASSO 2 — O Que Muda no Metodo (Deltas)

## Entrega 1 — Novos Aportes por Tradicao

| Grupo | O que adiciona | Livro | Impacto |
|-------|---------------|-------|---------|
| **Deteccao tatica PT-BR** | Checklist DAMP (Defesa/Alinhamento/Mobilidade/Promocao) — ensina ONDE procurar tatica. Metodo original brasileiro. | Duarte & Lapertosa, DAMP | **ALTO** |
| **Time budgeting PT-BR** | Divisao de tempo de estudo por faixa segundo GM Rafael Leitao. Diretamente aplicavel ao gerador. | Leitao, Como montar treinamento | **ALTO** |
| **Aberturas PT-BR por principios** | Manual de aberturas que comeca pelos principios, nao pela decoreba. | Lazzarotto, Manual de Aberturas | **ALTO** |
| **Calculo PT-BR** | Serie graduada de exercicios de calculo. | Murray, Movimento Forcado | **MEDIO** |
| **Partidas-modelo PT-BR** | ~60 livros de partidas anotadas de mestres. | Murray, series Escola | **BAIXO** |

## Entrega 2 — Deltas na Escada

| band | stage | mudanca | livro | tipo |
|------|-------|---------|-------|------|
| 600-1000 | tatica | NOVO: adicionar DAMP como checklist de deteccao ANTES de CCT (Hertan). DAMP acha ONDE ha tatica; CCT acha O LANCE. | DAMP | **E** |
| 600-1000 | tatica | DAMP substitui "Detectar-Antes-de-Calcular" (Neiman) como drill_format em PT-BR. | DAMP | **I** |
| Transversal | meta | Time budgeting do Leitao: ~50% tatica, ~20% finais, ~15% abertura, ~15% partidas para <1900. Ajusta proporcoes do gerador. | Leitao | **E** |
| 1000-1400 | abertura-principio | Manual de Aberturas (Lazzarotto) como referencia PT-BR para principos + primeiras variantes. | Lazzarotto | **E** |
| 1000-1800 | calculo | Movimento Forcado como banco de exercicios graduados de calculo PT-BR. | Murray | **E** |

## Entrega 3 — Novos Drill Formats

| nome | descricao | passo a passo | band | stage | exerciseMode | mapa Lichess | sinal | origem | armadilha |
|------|-----------|---------------|------|-------|--------------|-------------|-------|--------|-----------|
| **DAMP-Scan** | Checklist de deteccao tatica em PT-BR. Antes de calcular, escanear a posicao com as 4 letras. | 1. **D**efesa: O rei adversario esta exposto? Pecas indefesas? 2. **A**linhamento: Pecas na mesma coluna/diagonal? (espeto, cravada) 3. **M**obilidade: Peca adversaria tem poucas casas? 4. **P**romocao: Peao proximo de promover? 5. So depois calcular lances. | 600-1400 | tatica | explain → guided → retrieval | Puzzles tematicos: hangingPiece (D), pin+skewer (A), zugzwang (M), pawnEndgame (P) | Identifica o elemento DAMP correto em >80% antes de achar o lance | DAMP (Duarte & Lapertosa) (E) | Pular o scan e ir direto ao lance |
| **Time-Budget-Leitao** | Divisao do tempo de treino por area conforme GM Leitao. O gerador de plano respeita proporcoes. | 1. Definir faixa do aluno. 2. Alocar % do tempo: <1900 = 50% tatica/20% finais/15% abertura/15% partidas. 3. Gerar blocos na proporcao. 4. Rebalancear semanalmente. | Transversal | meta | explain (no inicio da fase) | Lichess: puzzles (tatica), Practice: endgames (finais), videos (abertura), jogar 10+5 (partidas) | Proporcao de tempo dos ultimos 7 dias dentro de 10% da meta | Leitao (E) | Ser rigido — permitir flexibilidade por fraqueza detectada |

## Entrega 4 — Blocos Novos ou Revisados (0->1200)

### Bloco NOVO: DAMP-Scan (Substitui "Detectar-Antes-de-Calcular" com metodo PT-BR)

| id | band | stage | signal | weakness | learningGoal | exerciseMode | lichess_destino | tempo_min | sourceInfluence | avoid | criterio_conclusao | microcopy |
|----|------|-------|--------|----------|--------------|--------------|-----------------|-----------|-----------------|-------|--------------------|-----------|
| 600-1000-tatica-00 | 600-1000 | tatica | seguranca >80%, pronto para tatica | olha a posicao e nao sabe POR ONDE comecar a procurar tatica | Aplicar DAMP: em 30 segundos, identificar qual elemento (Defesa/Alinhamento/Mobilidade/Promocao) esta presente na posicao | explain → guided | Lichess puzzles tematicos (hangingPiece→D, pin+skewer→A, knightEndgame→M, pawnEndgame→P) | 15 | DAMP (Duarte & Lapertosa) (E) | pular o scan e chutar lance | Acerta elemento DAMP em >80% em 20 posicoes | "DAMP: seu radar tatico. **D**efesa: o rei dele esta exposto? Peca indefesa? **A**linhamento: pecas na mesma reta? **M**obilidade: alguma peca presa? **P**romocao: tem peao perto de virar dama? Rodeie o DAMP em 30 segundos antes de calcular lances." |

### Bloco REVISADO: Time Budget Leitao (atualiza proporcoes do gerador)

| id | band | stage | signal | weakness | learningGoal | exerciseMode | lichess_destino | tempo_min | sourceInfluence | avoid | criterio_conclusao | microcopy |
|----|------|-------|--------|----------|--------------|--------------|-----------------|-----------|-----------------|-------|--------------------|-----------|
| 0-1200-meta-01 | 0-1200 | meta | inicio de nova fase | nao sabe como dividir o tempo de estudo | Organizar tempo: ~50% tatica, ~20% finais, ~15% principios de abertura, ~15% partidas lentas | explain | — | 5 (explicacao) | Leitao (E) | ser rigido — ajustar por fraqueza detectada | aluno entendeu a proporcao | "Seu tempo e limitado. O GM Rafael Leitao recomenda: metade do tempo em tatica, um quinto em finais, o resto entre abertura e partidas. Isso nao e fixo — se voce esta pendurando pecas, mais seguranca. Se esta perdendo finais ganhos, mais finais." |

## Entrega 5 — Atualizacao de Regras e Lacunas

### Novas regras SE-ENTAO

```
-- DAMP DETECTION (nova)
SE tatica_primeiro_contato ENTAO
  drill_format = DAMP-Scan (antes de puzzles tematicos)
  sequence = DAMP-explain → DAMP-guided → puzzle-tematico-retrieval

-- TIME BUDGET LEITAO (nova)
SE gerando_plano_semanal ENTAO
  proporcao_tatica = 0.50 (min 0.40 se fraqueza_seguranca)
  proporcao_finais = 0.20
  proporcao_abertura = 0.15
  proporcao_partidas = 0.15
  SE fraqueza_detectada ENTAO ajustar_proporcao(fraqueza, +0.10)

-- ABERTURA PT-BR (atualizada)
SE band >= 1000 E usuario_prefere_pt_br ENTAO
  referencia_abertura = Lazzarotto_Manual_Aberturas
  iniciar_com = Objetivos_da_Abertura (principios)
```

### Lacunas que os Convertidos FECHAM

| Lacuna | Status |
|--------|--------|
| Checklist de deteccao tatica em PT-BR | **FECHADA** — DAMP |
| Time budgeting em PT-BR | **FECHADA** — Leitao |
| Repertorio de abertura PT-BR por principios | **FECHADA** — Lazzarotto |
| Calculo intermediario PT-BR | **PARCIAL** — Movimento Forcado cobre, mas so exercicios |
| Partidas-modelo em PT-BR | **FECHADA** — series Murray (~60 livros) |

### Lacunas que CONTINUAM ABERTAS

| Lacuna | O que falta |
|--------|-------------|
| **Metodo de calculo em PT-BR** (nao so exercicios) | Livro que ensine COMO calcular em portugues — com heuristica, checklist, candidatos. Movimento Forcado so dao exercicios. |
| **Defesa em PT-BR** | Material dedicado a defesa em portugues. |
| **Estrategia em PT-BR** | Pachman PT cobre, mas e denso. Algo mais acessivel como Stean (Simple Chess) em PT-BR. |

### Fontes em Dominio Publico Atualizadas

| titulo | autor | idioma | status |
|--------|-------|--------|--------|
| Fundamentos do Xadrez | Capablanca | PT-BR (epub convertido) | dominio_publico_provavel (1921) |
| Manual de Xadrez | Idel Becker | PT-BR | verificar © (autor brasileiro ~1970) |
| A Pratica de Meu Sistema | Nimzowitsch | PT-BR | dominio_publico_provavel (original 1929) |

---

# PASSO 3 — Avaliacao e Lacunas

## 1. Nota dos Convertidos: 8.0 / 10

**Justificativa:** Os convertidos trazem 3 contribuicoes de ALTO impacto que as ondas anteriores nao tinham:

1. **DAMP** — primeiro metodo tatico original brasileiro. Preenche lacuna crucial: ensinar ONDE procurar tatica, nao so qual lance. **(9/10)**
2. **Leitao** — time budgeting de um GM brasileiro. Autoritativo e diretamente aplicavel ao gerador de plano. **(9/10)**
3. **Lazzarotto** — aberturas em PT-BR por principios. Fecha a lacuna de "repertorio em portugues". **(8/10)**

Os ~60 livros de Murray (series Escola, Passo a Passo, etc.) tem valor como biblioteca de partidas anotadas, mas sao extremamente redundantes entre si. O formato e sempre o mesmo. Se fossem 5 livros em vez de 60, a nota seria a mesma.

## 2. Suficiencia: PARCIAL

**SIM** para fechar deteccao tatica PT-BR (DAMP), time budgeting (Leitao), e repertorio de abertura PT-BR (Lazzarotto).

**NAO** para calculo (so exercicios, falta metodo), defesa PT-BR, e estrategia acessivel PT-BR.

## 3. Cobertura Adicionada

| area | o que adicionou | forca |
|------|-----------------|-------|
| Deteccao tatica | DAMP (checklist PT-BR) | FORTE |
| Meta-aprendizagem | Leitao (time budgeting) | FORTE |
| Aberturas PT-BR | Lazzarotto (principios + variantes) | FORTE |
| Calculo PT-BR | Murray Movimento Forcado (exercicios) | MEDIA |
| Partidas-modelo | Murray series (60 livros) | MEDIA (redundante) |

## 4. O Que Falta Para o Metodo

Depois de Onda 1 (124 livros) + Onda 2 PDFs (77 uteis) + Onda 2 AZW (67 convertidos) = **~268 livros analisados**:

| Area | O que ainda falta | Sugestao |
|------|-------------------|----------|
| Metodo de calculo PT-BR | Livro que ensine COMO calcular, nao so exercicios | Algo como "Pense Como um Grande Mestre" em PT-BR |
| Defesa PT-BR | Material dedicado a COMO DEFENDER | Traduzir conceitos de Marin/Aagaard |
| Estrategia acessivel PT-BR | Algo como Stean "Simple Chess" em portugues | Nao encontrado no acervo |
| Microcopy Professor Lemos | Validacao do tom com brasileiros nativos | Testar com 3-5 pessoas |
| Progressao granular | Thresholds exatos de "dominio" por faixa | Decisao do dono (P) |

## 5. Redundancia

**Massiva nas colecoes Murray:** ~60 dos 67 livros convertidos sao do mesmo autor com o mesmo formato. Recomendacao:
- Manter 1-2 volumes de cada serie como amostra do formato
- Arquivar o resto — podem ser consultados como biblioteca de partidas, mas nao como metodo
- DAMP, Leitao e Lazzarotto sao os UNICOS livros verdadeiramente originais entre os convertidos

## 6. Veredito

**Os convertidos MUDAM materialmente o metodo em 3 pontos especificos:**
1. DAMP como checklist de deteccao tatica PT-BR (substitui "Detectar-Antes-de-Calcular" do Neiman com metodo brasileiro)
2. Leitao como fonte de time budgeting (substitui estimativas genericas com recomendacao de GM)
3. Lazzarotto como referencia de aberturas PT-BR (fecha lacuna)

**Fora isso, os convertidos majoritariamente CONFIRMAM a Onda 2** — as colecoes Murray sao biblioteca de partidas, nao inovacao metodologica. A grande descoberta foi o DAMP e a autoria do Leitao, que as analises anteriores (sem acesso ao texto) nao podiam verificar.

---

# Proximos Passos

1. **Integrar DAMP** ao `src/drillFormats.ts` como `DAMP-Scan`
2. **Integrar Leitao** como regra de proporcao no gerador de plano (`generatePlan.ts`)
3. **Adicionar Lazzarotto** como `sourceInfluence` nos blocos de abertura-principio
4. **Adicionar bloco** `600-1000-tatica-00` (DAMP-Scan) e `0-1200-meta-01` (Time Budget Leitao)
5. **Gate:** `npm run lint && npm run test && npm run build`

---
*Documento gerado em 2026-06-09. DeepSeek — analise dos convertidos. Texto lido dos arquivos convertidos; nenhum conteudo copiado para o produto. Correcoes: DAMP=Defesa/Alinhamento/Mobilidade/Promocao (Gemini errou); Leitao e o autor de "Como montar treinamento"; Murray e autor de ~60 livros das colecoes.*
