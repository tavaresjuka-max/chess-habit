# DeepSeek - Ler O Acervo E Extrair O Melhor De Cada Forma De Ensinar Xadrez

Voce e o **DeepSeek** atuando como pesquisador pedagogico senior do projeto `lichess-tutor`, uma
ferramenta pessoal PT-BR que estuda os jogos do dono, diagnostica fraquezas e manda treinos para o
Lichess. Data de referencia: 2026-06-09.

> Identifique-se: comece sua resposta com o titulo `# Analise do Acervo - DEEPSEEK` e salve/entregue o
> resultado como `analise-acervo-DEEPSEEK.md`. Prefixe cada secao com a sua autoria quando fizer sentido.
> O dono vai rodar este MESMO prompt em outra IA (Gemini) em paralelo e depois cruzar as duas analises,
> entao mantenha o esquema deste prompt **exatamente** para ficar comparavel (ver "Saida Comparavel").

## A Tarefa

O dono baixou ~95 livros de xadrez (classicos e modernos) para **uso pessoal e proprio**. Eles estao
nesta pasta:

```
C:\Users\tavar\OneDrive\Documentos\CLAUDE CODE\APRENDER XADREZ\lichess-tutor\LIVROS XADREZ PARA CONSULTA\
```

**Entre na pasta, enumere todos os PDFs e leia/analise o acervo inteiro.** Nao espere o dono enviar
arquivo por arquivo - o material ja esta la. Trabalhe sobre o conjunto completo.

Sua missao, nas palavras do dono: "analise os livros e tire o que ha de melhor em maneiras de ensinar
xadrez". Voce esta minerando **pedagogia**: como cada autor explica, sequencia, exercita, da feedback e
leva o aluno do iniciante ate o nivel alto. O produto disso e um **metodo de estudo proprio** do dono e
insumo aplicavel no app. A meta e **unir tudo de bom que voce encontrar** num so metodo.

## O Metodo Nao Tem Teto

O metodo e uma **escada completa, do zero ate onde o material permitir** (nivel avancado/mestre). Nao
limite a 1200.

- O acervo cobre desde fundamentos absolutos ate alto nivel (ex: My System, Watson, Aagaard, Marin,
  Shankland, Flores Rios, Muller). Use tudo isso para desenhar a escada inteira.
- **Foco ativo agora**: a faixa **0->1200**, porque e onde o dono esta hoje (~800 de rating). Essa e a
  fase atual de implementacao, **nao** o limite do metodo.
- Organize por **faixas de forca**, sugestao a refinar: `0-600`, `600-1000`, `1000-1400`, `1400-1800`,
  `1800-2200`, `2200+`. Para cada faixa: o que dominar, com quais livros, em que ordem. Detalhe denso
  ate 1200; esboce com solidez as faixas acima para o metodo ja nascer com a escada completa.

## Regra De Uso Do Conteudo

Leitura e analise: **liberadas e desejadas** - e uso pessoal, aprenda com tudo.

O que entra no **metodo e no app** deve ser **original**: principios, sequencias e formatos de treino
escritos por voce. Nao cole no produto final o texto literal, os diagramas, as listas de variantes nem
os exercicios numerados dos livros; reescreva como ideia e estrutura suas. Conceitos de dominio
(oposicao, garfo, peca solta, regra do quadrado) sao conhecimento comum - use livremente.

Separe sempre tres coisas: **(E) evidencia / consenso** entre os livros, **(I) inferencia sua**, **(P)
decisao de produto** a confirmar com o dono.

## Contexto Do Produto (Onde Isto Vai Encaixar)

Metodo atual do `lichess-tutor`:

- Publico: 1 adulto autodidata. Subir o mais longe possivel, sem **prometer** rating.
- Loop central: `sinal real -> fraqueza provavel -> foco da fase -> recurso Lichess -> treino com tempo
  -> resultado -> ajuste`.
- Estagios de treino ja codificados: `explain`, `guided`, `retrieval`, `review`, `transfer`.
- Pedagogia ja adotada: pratica deliberada, recuperacao ativa, repeticao espacada, worked examples antes
  de problema livre, interleaving leve, feedback por categoria de erro, transferencia para partidas
  encerradas.
- O treino roda no **Lichess** (Practice, Puzzle Themes, Streak, Studies, replay). O app orquestra; nao
  recria tabuleiro nem gera conteudo proprio.
- Privacidade local-first: sem PGN completo persistido, sem banco de puzzles proprietario.
- Voz "Professor Lemos": PT-BR adulto, frases curtas, uma ideia por bloco, sem infantilizar, sem
  prometer QI/nota/genialidade.

Curriculo de referencia atual da **fase 0->1200**, que voce deve **criticar, refinar e depois estender
para cima**:

0. Tabuleiro, pecas e xeque
1. Seguranca material
2. Xeque-mate e finais-modelo
3. Calculo tatico por recuperacao ativa
4. Aberturas como principios
5. Planejamento simples
6. Transferencia para partidas reais

Modelo de metadados que o app usa por bloco de treino (sua sintese deve preencher estes campos):

- `stage`: fundamento | seguranca | mate | final | tatica | abertura-principio | plano | transferencia
  | (proponha novos estagios para faixas acima de 1200, ex: estrutura, profilaxia, finais tecnicos,
  calculo profundo, defesa, conversao)
- `band`: faixa de forca alvo (0-600, 600-1000, 1000-1400, 1400-1800, 1800-2200, 2200+)
- `signal`: sinal observavel que ativa o bloco
- `weakness`: fragilidade treinada
- `learningGoal`: habilidade observavel ao final
- `exerciseMode`: explain | guided | retrieval | review | transfer
- `sourceInfluence`: de qual livro/tradicao veio a ideia (credito da influencia, nao conteudo copiado)
- `avoid`: armadilha do bloco (ex: decorar variante, analisar partida ao vivo)

## Passo 1 - Varredura E Fichamento Do Acervo

Leia os PDFs da pasta e produza, para cada livro, uma **Ficha Pedagogica** curta:

1. **Identificacao**: titulo, autor, faixa de forca real que ele serve, e a "promessa" do livro em 1
   frase.
2. **Filosofia de ensino**: como esse autor acredita que se aprende xadrez (padroes, calculo,
   principios, partidas comentadas, repeticao, imbalances, sistema...).
3. **Sequencia**: em que ordem apresenta os temas e por que comeca pelo que comeca.
4. **Como explica**: a tecnica didatica mais forte do livro (aprendizagem programada de Fischer,
   "move by move" de Chernev, thinking technique de Silman, defesa critica nos problemas...).
5. **Como exercita**: formato dos exercicios, progressao de dificuldade, como pede a resposta do aluno.
6. **Como da feedback / nomeia erro**.
7. **O melhor que vale absorver**: 1-3 ideias mais fortes desse livro.
8. **O que descartar**: o que data, confunde ou nao serve.
9. **Encaixe**: a quais `band` + `stage` + `exerciseMode` contribui.
10. **Mapeavel no Lichess?**: vira Practice / Puzzle Theme / Streak / Study / replay?
11. **Status legal provavel** (so triagem): dominio publico provavel | verificar | em copyright; marque
    candidatos a fornecer posicoes/partidas reais no futuro (ex: Capablanca 1921, Nimzowitsch, Tartakower,
    Lasker, Znosko-Borovsky).

Seja honesto: se um livro for fraco ou redundante, diga. Nem todo livro precisa entrar no metodo. Se a
pasta tiver mais arquivos do que cabe numa resposta, processe em lotes e numere o progresso, mas conduza
voce mesmo a varredura ate cobrir tudo.

## Passo 2 - Sintese Em Metodo Proprio (Entregas)

Depois de fichar o acervo, una tudo num metodo **original** que combina o melhor de cada tradicao:

### Entrega 1 - O Melhor De Cada Tradicao
Agrupe os livros por filosofia de ensino. Para cada grupo: o que acerta, o que erra/data, e a UMA ideia
que entra no nosso metodo. Aponte e **resolva** conflitos entre tradicoes (Silman imbalances vs Heisman
safety-first vs Nimzowitsch sistema vs Fischer padroes-por-repeticao): qual serve cada faixa de forca e
por que.

### Entrega 2 - Escada Completa 0 -> Nivel Alto
Tabela `curriculo` com: `band`, `stage`, `objetivo_observavel`, `pre_requisito`, `criterio_de_avancar`,
`criterio_de_voltar`, `erro_tipico`, `livros_que_sustentam`, `risco`. Cubra a escada inteira; detalhe
denso ate 1200, esboco solido acima. Marque cada decisao como (E), (I) ou (P).

### Entrega 3 - Biblioteca De Formatos De Treino
Destile os **formatos mentais** dos melhores livros (ex: candidato -> resposta critica -> confirmacao;
lance-chave provado contra a melhor defesa; worked example antes de problema livre; visualizacao;
final como mini-plano cortar/aproximar/executar; profilaxia "o que ele quer?") como **moldes abstratos
reutilizaveis**, sem copiar exercicios. Tabela `drill_formats`: `nome`, `descricao_curta`,
`passo_a_passo`, `band_alvo`, `stage_alvo`, `exerciseMode`, `como_mapear_no_lichess`, `sinal_de_dominio`,
`livro_de_origem`, `armadilha`.

### Entrega 4 - Blocos De Treino Prontos Para O App
Tabela `blocos`: `id`, `band`, `stage`, `signal`, `weakness`, `learningGoal`, `exerciseMode`,
`lichess_destino` (tipo de recurso + criterio de selecao, sem inventar URLs), `tempo_min` (5/15/30/60),
`sourceInfluence`, `avoid`, `criterio_conclusao`, + **microcopy de direcao** no tom do Professor Lemos.
**Cubra a fase ativa 0->1200 de forma densa e pronta para implementar**; deixe estagios acima esbocados.
Use `id` estavel no formato `band-stage-NN` (ex: `600-1000-tatica-03`) para ficar comparavel entre IAs.

### Entrega 5 - Regras Do Gerador De Plano + Lacunas
- regras `SE <sinal/fraqueza/band> ENTAO <stage/exerciseMode/tempo>`, prontas para virar logica.
- `sinais_de_dominio` por estagio/faixa: o que conta como progresso real sem prometer rating.
- `anti_patterns`: o que o metodo recusa (decoreba de variante, gamificacao vazia, promessa cognitiva,
  recomendar lance ao vivo).
- `lacunas_para_revisao_humana`: decisoes que precisam do dono antes de virar produto.
- `fontes_dominio_publico_provavel`: titulos que poderiam fornecer posicoes/partidas reais legalmente
  numa fase futura (so triagem; o dono confirma depois).

## Passo 3 - Avaliacao Final Do Acervo (Obrigatorio)

No fim de tudo, avalie o acervo como base para construir o metodo. Seja critico e honesto, nao
elogioso por padrao.

1. **Nota geral**: de 0 a 10 para o acervo como base de um metodo **inovador, simples e eficaz** do zero
   ate alto nivel. Justifique a nota.
2. **Suficiencia**: o material e bom o suficiente para construir esse metodo unindo o melhor de tudo?
   Responda direto: sim / parcial / nao, e por que.
3. **Cobertura por area**: tabela `cobertura` com `area` (fundamentos, seguranca, mate, finais, tatica,
   calculo, estrategia, estrutura de peoes, aberturas por principio, planejamento, defesa/profilaxia,
   psicologia/processo de decisao, transferencia, ensino/pedagogia) x `forca_no_acervo`
   (forte/media/fraca/ausente) x `melhores_fontes` x `o_que_falta`.
4. **Avisos de lacuna**: liste explicitamente **toda area que ficou vaga, fraca ou ausente** e diga
   "buscar mais conteudo aqui" - para cada uma, sugira que tipo de material procurar (tema, nivel,
   formato), sem precisar de titulo exato.
5. **Redundancia**: aponte onde o acervo tem excesso do mesmo (ex: muitos manuais de iniciante
   repetidos) e poderia ser enxugado.
6. **Veredito**: em 3-5 linhas, diga se da para comecar a construir o metodo agora com o que existe, ou
   se vale fechar lacunas criticas antes.

## Saida Comparavel (Para Cruzamento Entre IAs)

O dono vai cruzar a sua analise com a de outra IA. Para que o merge seja limpo:

- Use **exatamente** os esquemas de tabela e os nomes de campo deste prompt.
- Use IDs de bloco estaveis no formato `band-stage-NN`.
- Marque **confianca** (alta/media/baixa) nas afirmacoes-chave e nas notas.
- Cite sempre o **livro de origem** de cada ideia/influencia.
- Nao tente adivinhar o que a outra IA respondeu; apenas seja consistente com este esquema e fiel ao
  acervo.

## Formato Da Resposta

Portugues, direto, tabelas em Markdown quando a entrega pedir. Titulo `# Analise do Acervo - DEEPSEEK`.
Ordem: fichas (Passo 1, em lotes se preciso) -> Entregas 1-5 (Passo 2) -> Avaliacao final (Passo 3) ->
**proximos passos para o Codex implementar localmente** (quais arquivos/estruturas tocar). Foque em
**metodo, estrutura e metadados originais** - aprenda com tudo o que esta na pasta, copie nada para o
produto.
