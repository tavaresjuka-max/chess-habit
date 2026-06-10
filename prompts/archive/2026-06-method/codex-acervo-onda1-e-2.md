# Codex - Analise Propria Do Acervo Completo (ONDA 1 + ONDA 2)

Voce e o **Codex** atuando como pesquisador pedagogico senior do projeto `lichess-tutor`, uma ferramenta
pessoal PT-BR que estuda os jogos do dono, diagnostica fraquezas e manda treinos para o Lichess. Data de
referencia: 2026-06-09.

Diferente das outras IAs, voce roda localmente neste repositorio, com acesso ao disco. Voce pode
enumerar e abrir os PDFs, extrair texto (ex: `pdftotext`, scripts) e ler os artefatos ja existentes.
Faca a **sua propria analise independente** das duas ondas de livros. Sua saida sera cruzada com as
analises de DeepSeek e Gemini, entao mantenha o esquema deste prompt para ficar comparavel.

> Identifique-se: salve o resultado como `analise-acervo-CODEX.md`, comecando com o titulo
> `# Analise do Acervo (Onda 1 + Onda 2) - CODEX`.

## Onde Esta O Acervo (Atencao A Estrutura De Pastas)

Pasta-mae:

```
C:\Users\tavar\OneDrive\Documentos\CLAUDE CODE\APRENDER XADREZ\lichess-tutor\LIVROS XADREZ PARA CONSULTA\
```

- **ONDA 1** = os PDFs **diretamente na raiz** dessa pasta (~124 livros). NAO inclui subpastas.
- **ONDA 2** = os PDFs dentro da subpasta `ONDA 2 LIVROS\` (~91 livros).

Enumere as duas separadamente (nao conte duas vezes), e marque cada ficha com `onda: 1` ou `onda: 2`.
Total esperado: ~215 livros. Comece confirmando a contagem real de cada onda.

## Leia Primeiro Os Artefatos Existentes

Antes de analisar, leia para nao recomecar do zero e para poder concordar/discordar com fundamento:

- `docs/pedagogy/metodo-consolidado-acervo-2026-06-09.md` (metodo ja fundido de DeepSeek + Gemini)
- `analise-acervo-DEEPSEEK.md` e `analise-acervo-GEMINI.md` (analises da onda 1)
- `analise-acervo-ONDA2-DEEPSEEK.md` e `analise-acervo-ONDA2-GEMINI.md` se ja existirem (onda 2)
- fichas ja feitas: `docs/research/chess-literature/fichas-pedagogicas-batch1.md`,
  `docs/research/fichas_batch2.md`, `docs/research/fichas_batch3.md`

Sua tarefa: produzir uma **terceira voz independente**. Onde voce concorda com o metodo consolidado,
confirme com evidencia dos livros. Onde discorda, diga e justifique. Onde os livros da onda 2 mudam algo,
proponha o delta.

## Regras Inquebraveis

- Leitura e analise dos PDFs: **liberadas** (uso pessoal). Voce pode extrair texto para analisar.
- O que entra no **metodo e no app** deve ser **original**: principios, sequencias e formatos escritos
  por voce. Nao cole no produto final texto literal, diagramas, listas de variantes ou exercicios
  numerados dos livros. Conceitos de dominio (oposicao, garfo, peca solta, regra do quadrado) sao
  conhecimento comum - use livremente.
- Se voce extrair texto de PDF para um arquivo temporario, **nao** comite esse texto no repositorio nem
  o reproduza na sua saida. So metadados e sintese.
- Separe sempre: **(E) evidencia/consenso** · **(I) inferencia sua** · **(P) decisao de produto**.

## Restricoes Do Produto (Travadas - Nao Reabrir)

- Publico: 1 adulto autodidata. Subir o mais longe possivel, sem **prometer** rating.
- Loop central: `sinal real -> fraqueza provavel -> foco da fase -> recurso Lichess -> treino com tempo
  -> resultado -> ajuste`.
- **Progresso medido por sinal local, NUNCA por rating nem por vitoria contra engine.** (Esta foi a
  divergencia ja resolvida contra a proposta do Gemini - mantenha.)
- `exerciseMode` fixos: `explain | guided | retrieval | review | transfer`. Nao inventar modos novos;
  formatos especiais sao `drill_formats`.
- Treino roda no **Lichess** (Practice, Puzzle Themes, Streak, Studies, replay). O app orquestra; nao
  recria tabuleiro nem gera conteudo proprio. Privacidade local-first.
- Voz "Professor Lemos": PT-BR adulto, frases curtas, uma ideia por bloco, sem infantilizar, sem
  prometer QI/nota/genialidade.

Modelo de metadados por bloco (preencher): `band`, `stage`, `signal`, `weakness`, `learningGoal`,
`exerciseMode`, `lichess_destino`, `tempo_min`, `sourceInfluence`, `avoid`, `criterio_conclusao`,
`microcopy`. `stage` em: fundamento | seguranca | mate | final | tatica | abertura-principio | plano |
transferencia | estrutura | profilaxia | finais-tecnicos | calculo-profundo | defesa | conversao.
`band` em: 0-600 | 600-1000 | 1000-1400 | 1400-1800 | 1800-2200 | 2200+.

## Passo 1 - Fichamento Das Duas Ondas

Para cada livro (das duas ondas), uma **Ficha Pedagogica** curta. Se o volume for grande, processe em
lotes e agrupe os redundantes (ex: dezenas de "Chess for Beginners") em **Fichas Coletivas**. Campos:

1. `onda` (1 ou 2), titulo, autor, idioma, faixa de forca real, "promessa" em 1 frase.
2. filosofia de ensino; 3. sequencia; 4. como explica; 5. como exercita; 6. como da feedback;
7. o melhor que vale absorver (1-3 ideias); 8. o que descartar; 9. encaixe (`band`+`stage`+`exerciseMode`);
10. mapeavel no Lichess?; 11. status legal provavel (dominio publico | verificar | copyright);
12. **valor marginal**: este livro adiciona algo que o acervo ja nao tinha (PT-BR, calculo profundo,
    pedagogia de ensino, defesa) ou e redundante? qual.

Seja honesto e direto: marque os fracos e redundantes como tais.

## Passo 2 - Sua Sintese Do Metodo (Acervo Completo)

### Entrega 1 - O Melhor De Cada Tradicao
Agrupe os ~215 livros por filosofia de ensino. Para cada grupo: o que acerta, o que erra/data, a UMA
ideia que entra no metodo. Resolva conflitos entre tradicoes indicando qual serve cada faixa. Destaque o
que os livros PT-BR e os tecnicos avancados (Hawkins, Aagaard, Shereshevsky, Heisman, Perelshteyn)
acrescentam.

### Entrega 2 - Escada Completa 0 -> Nivel Alto (Sua Versao)
Tabela `curriculo`: `band`, `stage`, `objetivo_observavel`, `pre_requisito`, `criterio_de_avancar`
(por sinal local), `criterio_de_voltar`, `erro_tipico`, `livros_que_sustentam`, `risco`. Compare com a
escada do metodo consolidado: marque onde voce **confirma** e onde **propoe mudar** (com motivo).

### Entrega 3 - Biblioteca De Drill Formats
Moldes abstratos reutilizaveis (sem copiar exercicios). Inclua os que ja existem (confirmando) e os
**novos** que esta analise revela. Tabela: `nome`, `descricao_curta`, `passo_a_passo`, `band_alvo`,
`stage_alvo`, `exerciseMode`, `como_mapear_no_lichess`, `sinal_de_dominio`, `livro_de_origem`, `armadilha`.

### Entrega 4 - Blocos Para O App (0->1200), Com Reforco PT-BR
Tabela `blocos` com todos os campos do modelo + microcopy do Professor Lemos. IDs `band-stage-NN`.
Aproveite os livros PT-BR para microcopy e sequenciamento mais natural na lingua. Densa para 0->1200.

### Entrega 5 - Regras Do Gerador + Lacunas
- regras `SE <sinal/fraqueza> ENTAO <stage/exerciseMode/tempo>` (por sinal local, nunca rating).
- `sinais_de_dominio` por estagio.
- `anti_patterns`.
- `lacunas_para_revisao_humana`.
- `fontes_dominio_publico_provavel` (incluir classicos PT-BR e estrangeiros).

## Passo 3 - Avaliacao Final E Concordancia

1. **Nota do acervo completo** (0-10) como base de um metodo inovador, simples e eficaz do zero ao alto
   nivel. Justifique. Compare com as notas ja dadas (DeepSeek 6.5, Gemini 8.5) e posicione a sua.
2. **Suficiencia**: o acervo completo basta para o metodo? sim/parcial/nao, e por que.
3. **Cobertura por area**: tabela `area` x `forca_no_acervo` x `melhores_fontes` x `o_que_falta`.
4. **Concordancia com o metodo consolidado**: tabela com `ponto`, `concordo/discordo/ajusto`,
   `justificativa`. Foco nos pontos onde DeepSeek e Gemini divergiram (criterio de progresso, nota,
   exerciseMode, suficiencia) - desempate como terceira voz.
5. **Avisos de lacuna**: o que ainda falta apos as duas ondas - "buscar mais conteudo aqui".
6. **Redundancia**: quanto do acervo total e arquivavel; qual o nucleo duro (lista enxuta).
7. **Veredito**: da para construir/implementar agora? o que priorizar.

## Saida Comparavel

- Use os esquemas de tabela e nomes de campo deste prompt.
- IDs de bloco `band-stage-NN`; marque `confianca` (alta/media/baixa) nas afirmacoes-chave.
- Cite o livro de origem de cada ideia.
- Nao reproduza texto dos livros; so metadados e sintese.

## Formato Da Resposta E Entrega

Escreva `analise-acervo-CODEX.md` (titulo `# Analise do Acervo (Onda 1 + Onda 2) - CODEX`), em portugues,
direto, com tabelas em Markdown. Ordem: contagem confirmada das duas ondas -> fichas (Passo 1, em lotes/
coletivas) -> Entregas 1-5 (Passo 2) -> Avaliacao e concordancia (Passo 3) -> **proximos passos para
integrar ao `docs/pedagogy/metodo-consolidado-acervo-2026-06-09.md`** (quais secoes e arquivos de codigo
tocar). Aprenda com tudo o que esta nas duas pastas; copie nada para o produto.
