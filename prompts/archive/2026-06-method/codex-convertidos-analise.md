# Codex - Analise Dos Livros Convertidos (PT-BR Kindle/EPUB -> Texto)

Voce e o **Codex** atuando como pesquisador pedagogico senior do projeto `lichess-tutor`, rodando
localmente neste repositorio com acesso ao disco. Data de referencia: 2026-06-09.

Os e-books que antes estavam ilegiveis (`.azw/.azw3/.epub`) foram **convertidos para texto** e agora
podem ser lidos. Voce pode abrir os `.txt` direto. Faca a sua analise independente e sirva como
**terceira voz / arbitro** quando DeepSeek e Gemini divergirem.

> Identifique-se: comece com `# Analise dos Convertidos - CODEX` e salve como
> `analise-convertidos-CODEX.md`. Mantenha o esquema deste prompt para ficar comparavel com as outras
> duas IAs.

## Onde Estao Os Arquivos

```
C:\Users\tavar\OneDrive\Documentos\CLAUDE CODE\APRENDER XADREZ\lichess-tutor\LIVROS XADREZ PARA CONSULTA\_convertidos\
```

~66 textos convertidos (quase todos PT-BR) + `_manifesto-conversao.md`. **Leia o manifesto primeiro**:
considere a qualidade da conversao (textos `parcial`/`baixa` tem ruido — confianca menor). Confirme a
contagem real de arquivos e quantos sao aproveitaveis.

## Leia Antes (Terceira Voz Informada)

- `docs/pedagogy/metodo-consolidado-acervo-2026-06-09.md`
- todas as analises anteriores: `analise-acervo-DEEPSEEK.md`, `analise-acervo-GEMINI.md`,
  `analise-acervo-CODEX.md`, `analise-acervo-ONDA2-DEEPSEEK.md`, `analise-acervo-ONDA2-GEMINI.md`

Produza **deltas**, nao reescrita. Onde concorda, confirme com evidencia do texto; onde discorda,
justifique; desempate os pontos em que DeepSeek e Gemini divergirem.

## Destaques A Verificar No Texto Real

- **DAMP** (`DAMP-O-Algoritmo...txt`): leia o texto e **confirme** as 4 letras. O indice indica
  **D=Defesa, A=Alinhamento, M=Mobilidade, P=Promocao** — um checklist de **deteccao tatica** (onde ha
  tatica), nao um ritual de seguranca como o Gemini afirmou antes. Confirme ou corrija com citacao do
  proprio arquivo.
- **Como montar uma programacao de treinamento** (Lapertosa): time budgeting PT-BR.
- **Movimento forcado: Melhorar o Seu Calculo** (vols 1-6): calculo PT-BR — candidato a fechar a lacuna
  de calculo intermediario 1000-1400.
- **Manual de Aberturas de Xadrez** (vols 1-4 PT-BR): candidato a fechar a lacuna de repertorio de
  abertura por principios em PT-BR. Verifique se e por principios ou decoreba de variantes.
- Colecoes "Jogue como X" (Escola X, Gigantes do Xadrez Feminino, Xadrez passo a passo): partidas-modelo,
  provavelmente redundantes entre si — ficha coletiva.

## Restricoes Do Produto (Travadas)

- Progresso por **sinal local, nunca rating** nem vitoria contra engine.
- `exerciseMode` fixos: explain | guided | retrieval | review | transfer. Sem modos novos.
- Treino roda no Lichess; app orquestra, nao gera conteudo proprio. Privacidade local-first.
- Voz "Professor Lemos": PT-BR adulto, sem promessas.
- **Clean-room**: nao copie texto/diagramas/exercicios para o produto nem para a sua saida; so metadados
  e sintese. Se extrair trechos para analisar, nao os reproduza nem comite.
- Separe **(E)** evidencia, **(I)** inferencia, **(P)** decisao de produto.

Metadados por bloco: `band`, `stage`, `signal`, `weakness`, `learningGoal`, `exerciseMode`,
`lichess_destino`, `tempo_min`, `sourceInfluence`, `avoid`, `criterio_conclusao`, `microcopy`.

## Passo 1 - Fichamento Dos Convertidos
Ficha curta por livro (coletiva para colecoes redundantes), com `valor marginal` (novo vs ja coberto) e
confianca conforme a qualidade da conversao.

## Passo 2 - Deltas No Metodo
1. Novos aportes por tradicao (enfase PT-BR e calculo intermediario).
2. Deltas na escada: `band`, `stage`, `mudanca_proposta`, `livro_que_motiva`, `tipo` (E/I/P).
3. Novos drill_formats (ex: DAMP como deteccao tatica PT-BR, encaixado no drill "Detectar-antes-de-calcular").
4. Blocos novos/revisados (0->1200) + microcopy; IDs `band-stage-NN`.
5. Regras SE/ENTAO novas (por sinal local) + atualizacao de `fontes_dominio_publico_provavel`.

## Passo 3 - Avaliacao, Concordancia E Lacunas
1. **Nota dos convertidos** (0-10); compare com as notas que voce e os outros deram nas ondas anteriores.
2. **Suficiencia**: fecham repertorio de abertura PT-BR, calculo intermediario e defesa? sim/parcial/nao.
3. **Cobertura adicionada**: `area` x `o_que_adicionou` x `forca`.
4. **Concordancia/desempate**: tabela `ponto`, `concordo/discordo/ajusto`, `justificativa` — focando os
   pontos onde DeepSeek e Gemini divergirem (incluindo a expansao do DAMP).
5. **O QUE FALTA PARA O METODO** apos convertidos + ondas 1-2 — por area, nivel e formato.
6. **Redundancia** e nucleo duro enxuto.
7. **Veredito**: mudam materialmente o metodo ou so reforcam?

## Saida E Integracao
Esquemas/campos deste prompt; IDs `band-stage-NN`; `confianca` marcada; cite o livro de origem; nao
reproduza texto. Termine com **proximos passos para integrar ao
`docs/pedagogy/metodo-consolidado-acervo-2026-06-09.md`** (quais secoes/arquivos tocar).
