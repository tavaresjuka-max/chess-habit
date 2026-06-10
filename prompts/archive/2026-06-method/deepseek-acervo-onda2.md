# DeepSeek - ONDA 2: Ler O Novo Acervo E Extrair O Melhor De Cada Forma De Ensinar Xadrez

Voce e o **DeepSeek** atuando como pesquisador pedagogico senior do projeto `lichess-tutor`, uma
ferramenta pessoal PT-BR que estuda os jogos do dono, diagnostica fraquezas e manda treinos para o
Lichess. Data de referencia: 2026-06-09.

> Identifique-se: comece sua resposta com o titulo `# Analise do Acervo ONDA 2 - DEEPSEEK` e
> salve/entregue o resultado como `analise-acervo-ONDA2-DEEPSEEK.md`. O dono vai rodar este MESMO prompt
> em outra IA (Gemini) em paralelo e depois cruzar as duas analises, entao mantenha o esquema deste
> prompt **exatamente** para ficar comparavel (ver "Saida Comparavel").

## Contexto: Esta E A Segunda Onda

Ja existe um metodo consolidado a partir da primeira onda (124 livros), em
`docs/pedagogy/metodo-consolidado-acervo-2026-06-09.md`, com escada 0->2200+, blocos 0-1200, biblioteca
de drill_formats e regras de gerador de plano. **Leia esse documento primeiro.** Sua tarefa nao e
recomecar do zero: e analisar os **novos** livros e dizer o que eles **adicionam, confirmam, contradizem
ou substituem** no metodo ja construido.

Em especial, a onda 1 apontou duas lacunas que esta onda parece preencher: **material em PT-BR** e
**cálculo profundo / nivel avancado**. Avalie se isso se confirma.

## A Tarefa

O dono baixou uma segunda leva de livros de xadrez para **uso pessoal e proprio**. Eles estao nesta
pasta:

```
C:\Users\tavar\OneDrive\Documentos\CLAUDE CODE\APRENDER XADREZ\lichess-tutor\LIVROS XADREZ PARA CONSULTA\ONDA 2 LIVROS\
```

**Entre na pasta, enumere todos os PDFs e leia/analise o acervo inteiro da onda 2.** Nao espere o dono
enviar arquivo por arquivo - o material ja esta la. Trabalhe sobre o conjunto completo.

Sua missao, nas palavras do dono: "analise os livros e tire o que ha de melhor em maneiras de ensinar
xadrez". Voce esta minerando **pedagogia**: como cada autor explica, sequencia, exercita, da feedback e
leva o aluno do iniciante ate o nivel alto. A meta e **unir tudo de bom que voce encontrar** ao metodo
ja existente.

## O Metodo Nao Tem Teto

O metodo e uma **escada completa, do zero ate onde o material permitir** (nivel avancado/mestre). Nao
limite a 1200.

- **Foco ativo agora**: a faixa **0->1200**, porque e onde o dono esta hoje (~800 de rating). Essa e a
  fase atual de implementacao, **nao** o limite do metodo.
- Faixas de forca: `0-600`, `600-1000`, `1000-1400`, `1400-1800`, `1800-2200`, `2200+`. Detalhe denso
  ate 1200; esboce com solidez as faixas acima.

## Regra De Uso Do Conteudo

Leitura e analise: **liberadas e desejadas** - e uso pessoal, aprenda com tudo.

O que entra no **metodo e no app** deve ser **original**: principios, sequencias e formatos de treino
escritos por voce. Nao cole no produto final o texto literal, os diagramas, as listas de variantes nem
os exercicios numerados dos livros; reescreva como ideia e estrutura suas. Conceitos de dominio
(oposicao, garfo, peca solta, regra do quadrado) sao conhecimento comum - use livremente.

Separe sempre tres coisas: **(E) evidencia / consenso** entre os livros, **(I) inferencia sua**, **(P)
decisao de produto** a confirmar com o dono.

## Contexto Do Produto

- Publico: 1 adulto autodidata. Subir o mais longe possivel, sem **prometer** rating.
- Loop central: `sinal real -> fraqueza provavel -> foco da fase -> recurso Lichess -> treino com tempo
  -> resultado -> ajuste`.
- Estagios de treino ja codificados: `explain`, `guided`, `retrieval`, `review`, `transfer`.
- Pedagogia adotada: pratica deliberada, recuperacao ativa, repeticao espacada, worked examples antes de
  problema livre, interleaving leve, feedback por categoria de erro, transferencia para partidas
  encerradas.
- **Progresso medido por sinal local, nunca por rating nem por vitoria contra engine.**
- O treino roda no **Lichess** (Practice, Puzzle Themes, Streak, Studies, replay). O app orquestra; nao
  recria tabuleiro nem gera conteudo proprio.
- Privacidade local-first: sem PGN completo persistido, sem banco de puzzles proprietario.
- Voz "Professor Lemos": PT-BR adulto, frases curtas, uma ideia por bloco, sem infantilizar, sem
  prometer QI/nota/genialidade.

Modelo de metadados por bloco de treino (sua sintese deve preencher estes campos):

- `stage`: fundamento | seguranca | mate | final | tatica | abertura-principio | plano | transferencia
  | (estrutura, profilaxia, finais-tecnicos, calculo-profundo, defesa, conversao para faixas altas)
- `band`: faixa de forca alvo
- `signal`, `weakness`, `learningGoal`
- `exerciseMode`: explain | guided | retrieval | review | transfer (sem inventar modos novos)
- `sourceInfluence`: livro/tradicao de origem (credito da influencia, nao conteudo copiado)
- `avoid`: armadilha do bloco

## Passo 1 - Varredura E Fichamento Da Onda 2

Leia os PDFs da pasta ONDA 2 e produza, para cada livro, uma **Ficha Pedagogica** curta:

1. **Identificacao**: titulo, autor, idioma, faixa de forca real, "promessa" em 1 frase.
2. **Filosofia de ensino**.
3. **Sequencia**: ordem dos temas e por que comeca pelo que comeca.
4. **Como explica**: a tecnica didatica mais forte do livro.
5. **Como exercita**: formato, progressao, como pede a resposta.
6. **Como da feedback / nomeia erro**.
7. **O melhor que vale absorver**: 1-3 ideias mais fortes.
8. **O que descartar**.
9. **Encaixe**: `band` + `stage` + `exerciseMode`.
10. **Mapeavel no Lichess?**.
11. **Status legal provavel** (so triagem): dominio publico provavel | verificar | em copyright.
12. **NOVO vs ONDA 1**: este livro adiciona algo que a onda 1 nao tinha (ex: PT-BR, cálculo profundo,
    pedagogia de ensino, defesa) ou e redundante com livros ja analisados? Diga qual.

Seja honesto: se um livro for fraco ou redundante, diga. Esta onda parece ter muitos manuais genericos
de iniciante ("Chess for Beginners" repetidos) - marque a redundancia com clareza.

## Passo 2 - Sintese: O Que A Onda 2 Muda No Metodo

### Entrega 1 - Novos Aportes Por Tradicao
Agrupe os novos livros por filosofia de ensino. Para cada grupo: o que adiciona ao metodo da onda 1, e a
UMA ideia que vale incorporar. Destaque material PT-BR e material de nivel avancado.

### Entrega 2 - Ajustes Na Escada (Delta)
Nao reescreva a escada inteira. Liste apenas os **deltas**: estagios/bandas onde os novos livros mudam
objetivo, criterio, fonte ou risco. Tabela: `band`, `stage`, `mudanca_proposta`, `livro_que_motiva`,
`tipo` (E/I/P).

### Entrega 3 - Novos Drill Formats
So os formatos **novos** que estes livros trazem (que nao estao na biblioteca da onda 1). Tabela:
`nome`, `descricao_curta`, `passo_a_passo`, `band_alvo`, `stage_alvo`, `exerciseMode`,
`como_mapear_no_lichess`, `sinal_de_dominio`, `livro_de_origem`, `armadilha`.

### Entrega 4 - Blocos Novos Ou Revisados (0->1200)
So blocos **novos** ou **revisados** pela onda 2 (especialmente os que ganham fonte PT-BR). Mesmos campos
do modelo de metadados + microcopy do Professor Lemos. IDs no formato `band-stage-NN`.

### Entrega 5 - Atualizacao De Regras E Lacunas
- novas regras `SE/ENTAO` que os livros sugiram (por sinal local, nunca rating).
- lacunas que a onda 2 fecha e lacunas que continuam abertas.
- atualizacao de `fontes_dominio_publico_provavel` com os novos titulos (atencao aos classicos PT-BR).

## Passo 3 - Avaliacao Final Da Onda 2 (Obrigatorio)

1. **Nota da onda 2**: 0 a 10 como aporte ao metodo. Justifique.
2. **Suficiencia**: a onda 2 fecha as lacunas da onda 1 (PT-BR, calculo profundo, pedagogia)? sim/parcial/nao.
3. **Cobertura adicionada**: tabela `area` x `o_que_a_onda2_adicionou` x `forca`.
4. **Avisos de lacuna**: o que AINDA falta depois das duas ondas - "buscar mais conteudo aqui".
5. **Redundancia**: quanto da onda 2 e redundante (manuais de iniciante repetidos) e pode ser arquivado.
6. **Veredito**: a onda 2 muda materialmente o metodo, ou so confirma a onda 1?

## Saida Comparavel (Para Cruzamento Entre IAs)

- Use **exatamente** os esquemas de tabela e nomes de campo deste prompt.
- IDs de bloco no formato `band-stage-NN`.
- Marque **confianca** (alta/media/baixa) nas afirmacoes-chave e notas.
- Cite sempre o **livro de origem**.
- Nao tente adivinhar o que a outra IA respondeu; seja consistente com este esquema e fiel ao acervo.

## Formato Da Resposta

Portugues, direto, tabelas em Markdown. Titulo `# Analise do Acervo ONDA 2 - DEEPSEEK`. Ordem: fichas
(Passo 1, em lotes se preciso) -> Entregas 1-5 (Passo 2) -> Avaliacao final (Passo 3) -> **proximos
passos para o Codex integrar ao metodo consolidado** (quais secoes/arquivos atualizar). Foque em
**metodo, estrutura e metadados originais** - aprenda com tudo, copie nada para o produto.
