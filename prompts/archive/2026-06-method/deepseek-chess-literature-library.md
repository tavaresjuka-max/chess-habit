# DeepSeek - Biblioteca Profunda De Literatura E Ensino De Xadrez

Voce e DeepSeek atuando como pesquisador senior para o projeto `lichess-tutor`, uma ferramenta pessoal
PT-BR para estudar xadrez com destinos de treino no Lichess. Sua tarefa e pesquisar profundamente a
literatura disponivel sobre xadrez e ensino de xadrez, organizada em 5 frentes complementares.

Data de referencia: 2026-06-09. Use informacao atual, com links verificaveis. Quando preco, licenca,
disponibilidade ou URL puder ter mudado, confira na fonte atual e informe a data da verificacao.

## Regras Inquebraveis

- Nao baixar, copiar, transcrever ou reconstruir conteudo pago/protegido.
- Nao usar fontes piratas, shadow libraries, torrents, z-library, libgen, uploads suspeitos ou mirrors
  nao autorizados.
- Nao copiar conteudo de ChessKing nem usar ChessKing como taxonomia/fonte.
- Nao coletar PGNs completos, bancos proprietarios de puzzles, diagramas protegidos ou textos de aula
  proprietarios.
- Separar claramente: `download legal`, `candidato com revisao de licenca`, `somente compra`.
- Para material pago, listar link oficial/revendedor confiavel, preco, formato e prioridade de compra.
- Toda afirmacao importante deve ter fonte/link. Se nao conseguir verificar, marque como `nao verificado`.

## Contexto Do Projeto

O produto quer criar um metodo proprio de estudo, limpo e original, para levar um iniciante/baixo nivel
ate aproximadamente 1000-1200 de forca rapida, sem prometer rating. O app recomenda tarefas no Lichess,
mede sinais locais, usa repeticao, feedback, revisao e treino adaptativo.

Arquivos locais ja existentes para encaixar sua pesquisa:

- `docs/research/chess-literature/phase1-acquisition-plan.md`
- `docs/research/chess-literature/open-sources.md`
- `docs/research/chess-literature/paid-buylist.md`
- `docs/research/chess-literature/phase1-seed-report.md`
- `docs/research/chess-literature/manifests/phase1-downloads.jsonl`

## As 5 Frentes

### Frente 1 - Acervo Livre E Baixavel Legalmente

Objetivo: encontrar o maior numero possivel de livros, artigos, teses, manuais e documentos sobre
xadrez que possam ser baixados legalmente.

Fontes prioritarias:

- Project Gutenberg;
- Internet Archive, com cautela: preferir colecao Gutenberg, dominio publico claro ou obra antiga;
- HathiTrust public domain, quando houver download permitido;
- OpenAlex, DOAJ, Crossref, Unpaywall;
- repositorios universitarios open access;
- OATD, DART-Europe, ERIC, HAL, SciELO, Redalyc, Dialnet, BASE, CORE, Shodhganga, CAPES/BDTD quando aplicavel.

Entregavel:

- tabela `open_download_candidates` com colunas:
  `id`, `title`, `authors`, `year`, `language`, `type`, `topic`, `source`, `landing_url`,
  `download_url`, `license_or_rights`, `confidence`, `why_legal`, `priority`, `notes`.
- separar `download_now`, `needs_license_review` e `reject`.
- meta: propor caminho realista para chegar a 1000 downloads legais, por lotes e fontes.

### Frente 2 - Pesquisa Academica Sobre Ensino, Cognicao E Pedagogia Do Xadrez

Objetivo: mapear estudos, teses, revisoes e experimentos sobre ensinar xadrez, transferencia cognitiva,
matematica, escola, treino deliberado, expertise, motivacao, memoria, recuperacao ativa, repeticao
espacada, carga cognitiva e curriculos.

Perguntas:

- O que tem evidencia forte, moderada ou fraca?
- O que funciona para iniciantes?
- O que funciona para criancas, adultos e autodidatas?
- Quais estudos sobre xadrez escolar sao metodologicamente bons ou ruins?
- Quais resultados nao devem ser prometidos?

Entregavel:

- tabela `academic_evidence` com:
  `title`, `authors`, `year`, `type`, `population`, `intervention`, `outcome`,
  `method_quality`, `main_finding`, `limits`, `url`, `pdf_url`, `license`.
- sintese curta por nivel de evidencia: `forte`, `moderada`, `fraca`, `promissora`, `evitar`.

### Frente 3 - Mapa Mundial De Metodos, Curriculos E Sequencias De Ensino

Objetivo: mapear como xadrez e ensinado por metodos reconhecidos, escolas, federacoes, livros e cursos,
sem copiar conteudo proprietario.

Incluir:

- Chess Steps Method;
- Yusupov series;
- Silman, Seirawan, Chernev, Capablanca, Lasker, Polgar, Chandler;
- FIDE school chess / trainer resources quando publicos;
- curriculos nacionais ou escolares abertos;
- metodos de clubes, federacoes e universidades;
- materiais PT-BR, espanhol, ingles, frances, alemao, russo quando encontraveis.

Entregavel:

- tabela `curriculum_map` com:
  `method_or_author`, `level_range`, `sequence`, `core_topics`, `practice_style`,
  `assessment_style`, `strengths`, `weaknesses`, `legal_status`, `buy_or_download_url`.
- nao copiar exercicios/textos; resumir apenas estrutura abstrata.
- produzir uma proposta de macrosequencia limpa para 0-1200:
  `fundamentos`, `seguranca`, `taticas curtas`, `mates`, `finais basicos`,
  `abertura por principios`, `calculo`, `revisao de partidas`, `habito`.

### Frente 4 - Lista De Compra Com Prioridade, Links E Precos

Objetivo: montar uma lista de compra de livros, cursos e bases legais pagos, priorizada pelo impacto no
metodo proprio.

Fontes preferidas:

- New In Chess / Quality Chess / Popular Chess;
- Chessable;
- Forward Chess;
- ChessBase;
- Thinkers Publishing;
- Russell Enterprises;
- Gambit;
- Silman-James Press;
- lojas oficiais de autores/editoras;
- Amazon ou revendedores somente quando necessario.

Entregavel:

- tabela `paid_buylist` com:
  `priority`, `title`, `author`, `publisher`, `topic`, `level`, `format`,
  `official_url`, `price`, `currency`, `availability`, `why_buy`, `risk`, `checked_at`.
- classificar prioridade:
  `A = comprar primeiro`, `B = comprar depois`, `C = opcional`, `D = nao comprar agora`.
- explicar quais compras mais ajudam a criar um metodo original sem copiar conteudo.

### Frente 5 - Traducao Para Metodo Proprio E Implementacao No App

Objetivo: transformar a pesquisa em principios aplicaveis ao `lichess-tutor`, sem copiar conteudo.

Perguntas:

- Que principios pedagogicos devem virar regras do gerador de plano?
- Que sinais indicam fraqueza real?
- Como medir progresso sem prometer rating?
- Como adaptar sessoes de 5/15/30/60 minutos?
- Como separar explicacao, pratica guiada, recuperacao ativa, revisao e transferencia?
- Que lacunas precisam de revisao humana antes de virar produto?

Entregavel:

- documento `method_synthesis` com:
  `principles`, `anti_patterns`, `progression_0_1200`, `session_templates`,
  `assessment_signals`, `implementation_candidates`, `risks`.
- cada principio deve apontar as fontes que o sustentam.
- marcar explicitamente o que e evidencia, o que e inferencia e o que e decisao de produto.

## Formato Final Da Resposta

Entregue em portugues, com:

1. resumo executivo;
2. status por frente;
3. tabelas em Markdown;
4. links diretos para fontes;
5. lista de downloads legais recomendados;
6. lista de compras com preco/data;
7. riscos juridicos e metodologicos;
8. proximos passos para Codex executar localmente.

Nao entregue longas transcricoes de livros/artigos. Faca sintese, metadados e links.
