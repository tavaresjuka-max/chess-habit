# Gemini - Analise Dos Livros Convertidos (PT-BR Kindle/EPUB -> Texto)

Voce e o **Gemini** atuando como pesquisador pedagogico senior do projeto `lichess-tutor`. Data de
referencia: 2026-06-09.

Os e-books que antes estavam ilegiveis (`.azw/.azw3/.epub`) foram **convertidos para texto** e agora
podem ser lidos. Sua tarefa e analisa-los como nas ondas anteriores e dizer o que eles **adicionam,
confirmam, contradizem ou substituem** no metodo ja consolidado — com fichas, notas e lacunas.

> Identifique-se: comece com `# Analise dos Convertidos - GEMINI` e salve como
> `analise-convertidos-GEMINI.md`. O mesmo prompt sera rodado por DeepSeek e Codex em paralelo e depois
> cruzado, entao mantenha o esquema deste prompt para ficar comparavel.

## Onde Estao Os Arquivos

Pasta com os textos convertidos (~66 livros, quase todos PT-BR), em `.txt`:

```
C:\Users\tavar\OneDrive\Documentos\CLAUDE CODE\APRENDER XADREZ\lichess-tutor\LIVROS XADREZ PARA CONSULTA\_convertidos\
```

Ha um `_manifesto-conversao.md` com a qualidade de cada conversao. **Leia o manifesto primeiro** e
considere a qualidade: textos `parcial`/`baixa` podem ter ruido de OCR/conversao — trate com confianca
menor.

## Leia Antes (Para Nao Recomecar Do Zero)

- `docs/pedagogy/metodo-consolidado-acervo-2026-06-09.md` (metodo atual)
- analises anteriores: `analise-acervo-DEEPSEEK.md`, `analise-acervo-GEMINI.md`, `analise-acervo-CODEX.md`,
  `analise-acervo-ONDA2-DEEPSEEK.md`, `analise-acervo-ONDA2-GEMINI.md`

Sua tarefa e **delta**: o que estes convertidos mudam no metodo. Nao reescreva a escada inteira.

## Destaques A Verificar No Texto Real

- **DAMP** (`DAMP-O-Algoritmo...txt`): **leia o texto e confirme o que significam as 4 letras.** Atencao:
  uma analise anterior (sua, Gemini) afirmou "Descobrir/Ameacar/Modificar/Prevenir" — a verificacao no
  indice do livro indica **D=Defesa, A=Alinhamento, M=Mobilidade, P=Promocao**, ou seja, um checklist de
  **deteccao tatica** (onde existe tatica), e nao um ritual de seguranca. **Corrija a afirmacao anterior
  com base no texto real.** Nao afirme a expansao sem confirmar no arquivo.
- **Como montar uma programacao de treinamento de xadrez** (Lapertosa): time budgeting em PT-BR.
- **Movimento forcado: Melhorar o Seu Calculo** (vols 1-6): calculo em PT-BR — pode preencher a lacuna
  de "calculo intermediario 1000-1400".
- **Manual de Aberturas de Xadrez** (vols 1-4, PT-BR): pode preencher a lacuna de "repertorio de
  abertura por principios em PT-BR". Avalie se ensina por principios ou por decoreba de variantes.
- Colecoes "Jogue como X" (Escola Sovietica/Alema/Francesa/Britanica, Gigantes do Xadrez Feminino,
  Xadrez passo a passo): partidas-modelo. Provavelmente muito redundantes entre si — use ficha coletiva.

## Restricoes Do Produto (Travadas)

- Progresso por **sinal local, nunca rating** nem vitoria contra engine.
- `exerciseMode` fixos: explain | guided | retrieval | review | transfer. Sem modos novos; formatos
  especiais sao `drill_formats`.
- Treino roda no **Lichess**; o app orquestra, nao recria tabuleiro nem gera conteudo proprio.
- Voz "Professor Lemos": PT-BR adulto, frases curtas, sem prometer QI/nota/rating.
- **Clean-room**: aprenda com o texto, nao copie texto/diagramas/exercicios para o produto. Conceitos de
  dominio sao livres; siglas de autores (ex: DAMP) viram microcopy so reescritas como ideia propria.
- Separe sempre **(E)** evidencia, **(I)** inferencia, **(P)** decisao de produto. Nao afirme com alta
  confianca o que voce nao confirmou no texto.

Metadados por bloco: `band`, `stage`, `signal`, `weakness`, `learningGoal`, `exerciseMode`,
`lichess_destino`, `tempo_min`, `sourceInfluence`, `avoid`, `criterio_conclusao`, `microcopy`.

## Passo 1 - Fichamento Dos Convertidos
Ficha curta por livro (use ficha coletiva para colecoes redundantes): titulo, autor, idioma, faixa,
filosofia, como ensina/exercita/da feedback, o melhor a absorver, o que descartar, encaixe
(`band`+`stage`+`exerciseMode`), mapeavel no Lichess?, status legal, e **valor marginal** (novo vs ja
coberto). Marque a confianca conforme a qualidade da conversao.

## Passo 2 - O Que Muda No Metodo (Deltas)
1. **Novos aportes por tradicao** (com enfase em PT-BR e calculo intermediario).
2. **Deltas na escada**: tabela `band`, `stage`, `mudanca_proposta`, `livro_que_motiva`, `tipo` (E/I/P).
3. **Novos drill_formats** (so os que estes livros trazem; ex: DAMP como deteccao tatica PT-BR).
4. **Blocos novos ou revisados (0->1200)** com microcopy do Professor Lemos; IDs `band-stage-NN`.
5. **Regras SE/ENTAO novas** (por sinal local) + atualizacao de `fontes_dominio_publico_provavel`.

## Passo 3 - Avaliacao E Lacunas (Obrigatorio)
1. **Nota dos convertidos** (0-10) como aporte ao metodo. Justifique sem inflar.
2. **Suficiencia**: fecham as lacunas que continuavam abertas (repertorio de abertura PT-BR, calculo
   intermediario, defesa)? sim/parcial/nao.
3. **Cobertura adicionada**: tabela `area` x `o_que_adicionou` x `forca`.
4. **O QUE FALTA PARA O METODO**: depois destes convertidos + ondas 1 e 2, liste explicitamente o que
   ainda falta — "buscar mais conteudo aqui" — por area, nivel e formato.
5. **Redundancia**: quanto dos convertidos e redundante (ex: colecoes "Jogue como X" entre si) e pode
   ser arquivado.
6. **Veredito**: mudam materialmente o metodo, ou so confirmam/reforcam?

## Saida Comparavel
Esquemas/campos exatamente deste prompt; IDs `band-stage-NN`; marque `confianca`; cite o livro de origem;
nao reproduza texto dos livros. Termine com **proximos passos para integrar ao metodo consolidado**.
