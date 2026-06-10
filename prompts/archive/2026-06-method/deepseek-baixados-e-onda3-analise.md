# DeepSeek - Analise Dos PDFs Baixados + ONDA 3

Voce e o **DeepSeek** atuando como pesquisador pedagogico senior do projeto `lichess-tutor`, uma
ferramenta pessoal PT-BR que estuda os jogos do dono, diagnostica fraquezas e manda treinos para o
Lichess. Data de referencia: 2026-06-10.

> Identifique-se: comece sua resposta com o titulo
> `# Analise dos PDFs Baixados + ONDA 3 - DEEPSEEK` e salve/entregue o resultado como
> `analise-pdfs-baixados-onda3-DEEPSEEK.md`. O dono vai rodar um prompt espelhado no Gemini e depois
> cruzar as duas analises, entao mantenha o esquema deste prompt **exatamente** para ficar comparavel.

## Contexto: Esta E Uma Rodada Delta

Ja existem analises anteriores do acervo e do metodo:

- `docs/pedagogy/metodo-consolidado-acervo-2026-06-09.md`
- `docs/pedagogy/metodo-professor-lemos.md`
- `analise-acervo-DEEPSEEK.md`
- `analise-acervo-GEMINI.md`
- `analise-acervo-CODEX.md`
- `analise-acervo-ONDA2-DEEPSEEK.md`
- `analise-acervo-ONDA2-GEMINI.md`
- `analise-convertidos-DEEPSEEK.md`
- `analise-convertidos-GEMINI.md`
- `analise-convertidos-CODEX.md`
- `relatorio-codex-lacunas-pesquisa-recursos.md`

Leia o metodo consolidado e, se possivel, as analises anteriores antes de fichar os novos documentos.
Sua tarefa **nao** e recomecar do zero: e descobrir o que os PDFs baixados e a ONDA 3 **adicionam,
confirmam, contradizem ou tornam redundante** no metodo ja consolidado.

## Corpus A Analisar

### Conjunto A - Downloads Baixados/Selecionados Por DeepSeek

Use como fonte principal do conjunto baixado:

```
C:\Users\tavar\OneDrive\Documentos\CLAUDE CODE\APRENDER XADREZ\lichess-tutor\output\chess-literature-library\files\
```

Use o manifesto como indice e trilha de auditoria:

```
C:\Users\tavar\OneDrive\Documentos\CLAUDE CODE\APRENDER XADREZ\lichess-tutor\docs\research\chess-literature\manifests\phase1-downloads.jsonl
```

Tambem consulte, se existir, o resumo:

```
C:\Users\tavar\OneDrive\Documentos\CLAUDE CODE\APRENDER XADREZ\lichess-tutor\docs\research\chess-literature\phase1-seed-report.md
```

Esse conjunto inclui PDFs, EPUBs e textos baixados em rodada de recursos livres/open access. Priorize
os PDFs, mas registre tambem EPUB/TXT quando forem parte do manifesto e tiverem valor pedagogico.

### Conjunto B - ONDA 3 Livros Xadrez

Analise os PDFs desta pasta:

```
C:\Users\tavar\OneDrive\Documentos\CLAUDE CODE\APRENDER XADREZ\lichess-tutor\LIVROS XADREZ PARA CONSULTA\onda 3 livros xadrez\
```

Atualmente a pasta tem PDFs e tambem alguns arquivos `.doc`, `.docx`, `.mp4` e `.txt`. O foco desta
rodada sao **PDFs**. Registre os nao-PDFs em inventario secundario e analise apenas se for simples
abrir e houver valor claro; nao deixe a rodada travar por arquivo nao-PDF.

### O Que Nao Fazer

- Nao reanalise a raiz inteira de `LIVROS XADREZ PARA CONSULTA` como Onda 1.
- Nao reanalise `ONDA 2 LIVROS` nem `_convertidos`, exceto como contexto/comparacao.
- Nao baixe novos livros sem necessidade. Se precisar validar licenca/status, consulte fonte oficial
  ou marque `verificar`.

## Regra Clean-Room De Uso Do Conteudo

Leitura e analise para uso pessoal sao permitidas. O que entra no **metodo e no app** deve ser
original.

Proibido copiar para o produto ou para o relatorio:

- texto literal longo dos livros;
- diagramas;
- exercicios numerados;
- listas de posicoes;
- FEN/PGN;
- variantes completas;
- comentarios autorais reescritos de modo muito proximo.

Permitido extrair:

- principios pedagogicos;
- sequencias de aprendizagem;
- formatos abstratos de treino;
- categorias de erro;
- criterios de progresso;
- lacunas e riscos;
- inspiracao de microcopy, desde que reescrita em voz original do Professor Lemos.

Separe sempre:

- **(E)** evidencia/consenso observado no corpus;
- **(I)** inferencia sua;
- **(P)** decisao de produto a confirmar com o dono.

Se um arquivo parecer pirata, upload nao autorizado ou de status duvidoso, **nao use como fonte limpa
para produto**. Ele pode informar diagnostico pessoal, mas deve ser marcado como `em copyright` ou
`verificar`, e suas ideias so podem entrar como abstracao original confirmada por outras fontes limpas.

## Contexto Do Produto

- Publico: 1 adulto autodidata. Subir o mais longe possivel, sem prometer rating.
- Loop central: `sinal real -> fraqueza provavel -> foco da fase -> recurso Lichess -> treino com tempo
  -> resultado -> ajuste`.
- Estagios de treino codificados: `explain`, `guided`, `retrieval`, `review`, `transfer`.
- Pedagogia adotada: pratica deliberada, recuperacao ativa, repeticao espacada, worked examples antes
  de problema livre, interleaving leve, feedback por categoria de erro, transferencia para partidas
  encerradas.
- Progresso medido por sinal local, nunca por rating nem por vitoria contra engine.
- O treino abre recursos do Lichess; o app orquestra, nao recria tabuleiro nem banco proprietario.
- Privacidade local-first: sem PGN completo persistido, sem tokens, sem PII em logs.
- Voz "Professor Lemos": PT-BR adulto, direto, frases curtas, uma ideia por bloco, sem infantilizar.

Modelo de metadados por bloco:

- `stage`: fundamento | seguranca | mate | final | tatica | abertura-principio | plano |
  transferencia | estrutura | profilaxia | finais-tecnicos | calculo-profundo | defesa | conversao
- `band`: `0-600` | `600-1000` | `1000-1400` | `1400-1800` | `1800-2200` | `2200+`
- `signal`, `weakness`, `learningGoal`
- `exerciseMode`: explain | guided | retrieval | review | transfer
- `sourceInfluence`: documento/tradicao de origem, sem copiar conteudo
- `avoid`: armadilha do bloco

## Passo 1 - Inventario E Triagem

Crie uma tabela inicial com todos os arquivos considerados:

`conjunto` | `arquivo` | `formato` | `titulo_inferido` | `autor_inferido` | `status_leitura` |
`status_legal_provavel` | `prioridade_analise` | `motivo`

Valores sugeridos:

- `conjunto`: DeepSeek-downloads | ONDA3
- `status_leitura`: lido | parcialmente_lido | ilegivel | duplicado | fora_escopo | nao_pdf
- `status_legal_provavel`: dominio_publico | open_access | cc | em_copyright | verificar
- `prioridade_analise`: A | B | C | D

Registre duplicatas provaveis contra ondas anteriores e contra outros arquivos da propria rodada.

## Passo 2 - Fichas Pedagogicas

Para cada documento prioritario A/B, produza uma **Ficha Pedagogica** curta:

1. **Identificacao**: titulo, autor, idioma, ano aproximado, faixa de forca real, promessa em 1 frase.
2. **Status legal provavel**: dominio_publico | open_access | cc | em_copyright | verificar.
3. **Filosofia de ensino**.
4. **Sequencia**: ordem dos temas e por que comeca pelo que comeca.
5. **Como explica**: tecnica didatica mais forte.
6. **Como exercita**: formato, progressao, tipo de resposta pedida.
7. **Como da feedback / nomeia erro**.
8. **O melhor que vale absorver**: 1-3 ideias abstratas.
9. **O que descartar**.
10. **Encaixe**: `band` + `stage` + `exerciseMode`.
11. **Mapeavel no Lichess?**: Practice, Puzzle Theme, Study, Puzzle Streak, Analysis pos-partida etc.
12. **NOVO vs metodo atual**: adiciona, confirma, contradiz ou e redundante? Diga onde.

Para documentos C/D, use **Fichas Coletivas** por grupo de redundancia, sem gastar paginas em cada um.

## Passo 3 - Sintese Delta Para O Metodo

### Entrega 1 - Novos Aportes Por Tradicao

Agrupe os documentos por filosofia de ensino. Para cada grupo:

`tradicao` | `documentos` | `o_que_adiciona` | `ideia_absorvivel` | `risco_clean_room` | `confianca`

### Entrega 2 - Ajustes Na Escada

Liste apenas deltas:

`band` | `stage` | `mudanca_proposta` | `documento_que_motiva` | `tipo(E/I/P)` | `confianca`

### Entrega 3 - Novos Drill Formats

Somente formatos novos ou melhorados por esta rodada:

`nome` | `descricao_curta` | `passo_a_passo_original` | `band_alvo` | `stage_alvo` | `exerciseMode` |
`como_mapear_no_lichess` | `sinal_de_dominio` | `sourceInfluence` | `armadilha`

### Entrega 4 - Blocos Novos Ou Revisados (0->1200)

Crie apenas blocos novos/revisados para a fase atual do dono. IDs no formato `band-stage-NN`.

Campos obrigatorios:

`id` | `band` | `stage` | `signal` | `weakness` | `learningGoal` | `exerciseMode` |
`recurso_lichess` | `sourceInfluence` | `microcopy_professor_lemos` | `avoid` | `criterio_de_progresso`

### Entrega 5 - Lacunas, Redundancias E Riscos

- Quais lacunas do metodo foram fechadas?
- Quais lacunas continuam abertas?
- O que e redundante com Onda 1/Onda 2/convertidos?
- O que deve ser descartado por risco legal, baixa qualidade ou incompatibilidade com Lichess?
- Que fontes limpas deveriam confirmar ideias vindas de material em copyright?

## Passo 4 - Avaliacao Final

1. **Nota da rodada**: 0 a 10 como aporte ao metodo. Justifique sem inflar.
2. **Nota por conjunto**: DeepSeek-downloads vs ONDA3.
3. **Suficiencia**: esta rodada muda materialmente o metodo ou so confirma o que ja estava decidido?
4. **Cobertura adicionada**: tabela `area` x `o_que_adicionou` x `forca` x `limite`.
5. **Nucleo duro**: lista enxuta dos documentos que realmente importam.
6. **Arquivar/ignorar**: lista ou grupos de arquivos que nao merecem integracao.
7. **Prioridade de integracao Codex**: ordem pratica de atualizacao dos docs/metodo.

## Enfase Especifica Para DeepSeek

Seja especialmente rigoroso em:

- inventario;
- status legal provavel;
- redundancia;
- custo/beneficio de integrar;
- separacao entre fonte limpa e fonte apenas pessoal;
- recomendacoes objetivas para o Codex.

## Saida Comparavel

- Use os nomes de campos exatamente como pedidos.
- Marque confianca: alta | media | baixa.
- Cite sempre o documento de origem pelo nome do arquivo e titulo inferido.
- Nao tente prever o que Gemini dira.
- Nao copie trechos longos, exercicios, diagramas, FEN/PGN ou variantes.

## Formato Da Resposta

Portugues, direto, tabelas em Markdown. Ordem:

1. inventario e triagem;
2. fichas pedagogicas;
3. sintese delta;
4. blocos/drills;
5. avaliacao final;
6. proximos passos para o Codex integrar ao metodo consolidado.
