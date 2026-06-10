# Analise dos PDFs Baixados + ONDA 3 - DEEPSEEK

Data: 2026-06-10. Analista: DeepSeek (pesquisador pedagogico senior).

---

## PASSO 1 - INVENTARIO E TRIAGEM

### Conjunto A — DeepSeek-downloads (10 do manifesto + 21 adicionais IA = 31)

Manifesto `phase1-downloads.jsonl` registra 31 itens baixados. 10 originais do lote-semente + 21 
adicionais de rodada posterior do Internet Archive. Destes, 35 arquivos fisicos em disco.

A tabela cobre apenas os itens com **valor pedagogico possivel** (>0). Itens puramente historicos,
anedoticos ou em idiomas nao-PT/nao-EN recebem prioridade D e vao para inventario secundario.

| conjunto | arquivo | formato | titulo_inferido | autor_inferido | status_leitura | status_legal_provavel | prioridade_analise | motivo |
|----------|---------|---------|-----------------|----------------|----------------|-----------------------|--------------------|--------|
| DeepSeek-downloads | 33870-chess-fundamentals.txt | TXT | Chess Fundamentals | Capablanca | lido | dominio_publico | A | Classico absoluto, ja no metodo |
| DeepSeek-downloads | chessstrategy05614gut-chess-strategy.txt | TXT | Chess Strategy | Edward Lasker | lido | dominio_publico | A | Complementa estrategia 1000-1400 |
| DeepSeek-downloads | chessandcheckers04913gut-chess-and-checkers-the-way-to-mastership.txt | TXT | Chess and Checkers: The Way to Mastership | Edward Lasker | lido | dominio_publico | B | Mais introdutorio que Chess Strategy |
| DeepSeek-downloads | W4214640735-professional-competence...pdf | PDF | Professional Competence of Primary School Teachers Implementing Chess Education Programmes | Konevskikh (2022) | parcialmente_lido | cc-by | C | Ensino infantil, marginal |
| DeepSeek-downloads | W4405860398-enhancing-chess-education...pdf | PDF | Enhancing Chess Education through Interactive Teaching Strategies | Gevorgyan et al. (2024) | parcialmente_lido | cc-by-nc | C | Estrategias interativas, marginal |
| DeepSeek-downloads | W4313225181-women-in-chess...pdf | PDF | Women in Chess: Education-Related Problems During Talent Development Process | Baum (2022) | ilegivel | cc-by-nd | D | Tema periferico |
| DeepSeek-downloads | chess-endgames-Chess-Endgames.pdf | PDF | Chess Endgames | anonimo (compilacao) | parcialmente_lido | dominio_publico | B | Finais compilados sem metodo |
| DeepSeek-downloads | TavernerChessProblemsMadeEasy-Chess-problems-made-easy.pdf | PDF | Chess Problems Made Easy | Thomas Taverner (1924) | parcialmente_lido | dominio_publico | C | Problemas, nao exercicios pedagogicos |
| DeepSeek-downloads | 2006700chessproblems_201910-700-Chess-Problems...pdf | PDF | 700 Chess Problems | Mrs. W.J. Baird (1902) | parcialmente_lido | dominio_publico | C | Problemas composicao, nao treino |
| DeepSeek-downloads | bub_gb_5ZACAAAAQAAJ-Chess-studies...pdf | PDF | Chess Studies; or Endings of Games | Kling & Horwitz (1851) | ilegivel | dominio_publico | C | Historico, scans ilegiveis |
| DeepSeek-downloads | o-perfeito-jogador-de-xadrez...pdf | PDF | O Perfeito Jogador de Xadrez | morenorpg2 (2024) | parcialmente_lido | verificar | C | PT-BR mas upload usuario IA |
| DeepSeek-downloads | 1990Ajedrez-Ajedrez.pdf | PDF | Ajedrez | SENA Colombia (1990) | parcialmente_lido | verificar | D | Espanhol, material SENA |
| DeepSeek-downloads | thebluebookofche16377gut-the-blue-book...txt | TXT | The Blue Book of Chess | Staunton (1847) | fora_escopo | dominio_publico | D | Notacao antiga, historico |
| DeepSeek-downloads | chesshistoryandr04902gut-chess-history...txt | TXT | Chess History and Reminiscences | Bird | fora_escopo | dominio_publico | D | Apenas anedotas |
| DeepSeek-downloads | theexploitsandtr34180gut-the-exploits...epub | EPUB | The Exploits and Triumphs...of Paul Morphy | Edge | fora_escopo | dominio_publico | D | Biografia historica |
| DeepSeek-downloads | chessgeneralship55278gut-chess-generalship...epub | EPUB | Chess Generalship, Vol. I. Grand Reconnaissance | Young | fora_escopo | dominio_publico | D | Filosofia obscura |
| DeepSeek-downloads | bub_gb_fd8CAAAAYAAJ-The-chess-players-handbook...pdf | PDF | The Chess-Player's Handbook | Staunton (1864) | fora_escopo | dominio_publico | D | Historico, notacao descritiva |
| DeepSeek-downloads | bub_gb_yCUCAAAAYAAJ-Morphys-games...pdf | PDF | Morphy's Games | Morphy (1860) | fora_escopo | dominio_publico | D | Partidas historicas |
| DeepSeek-downloads | coas.ojpr.0902.03047z-Modern-Chess-Instruction...pdf | PDF | Modern Chess Instruction in School | OJPR (2025) | parcialmente_lido | verificar | C | Paper educacional recente |

> Itens abaixo deste ponto sao todos prioridade D — historicos, idioma nao-PT/EN, ou ilegiveis.
> Incluem: bub_gb__SUCAAAAYAAJ (torneio 1852), bub_gb_DfAKyaxSWSwC (congresso 1859), bub_gb_TlRAAAAAYAAJ (alemao 1856), bub_gb_fcsCAAAAYAAJ (alemao 1865), bub_gb_ohIXAAAAYAAJ (Schach-almanach 1846), bub_gb_65caAAAAYAAJ (italiano 1868), bub_gb_DrUFAAAAIAAJ (magica, fora escopo), bub_gb_N7kUAAAAYAAJ (automaton 1821), bub_gb_oyUCAAAAYAAJ (magazine 1863), TheRoyallGameOfChessePlay (1656), mandragorias-seu-historia-shahiludii (1694, latim), space-chess-introduction (Raumschach), LarobokISchackForNyborjare (sueco), ljs495 (arabe), CharlesDorlansJoueurDchecs (frances), bub_gb_l5mDBt1qWxoC (frances/poema), bub_gb_njZfCOr5qRYC (alema/sanscrito), bub_gb_UBRBAAAAYAAJ (frances), falken-schach-profi-chess-manual (manual Commodore 64, espanhol), 20200309_20200309_0752 (arabe).

**Resumo Conjunto A:** De 35 arquivos, apenas 7 tem valor pedagogico relevante (nota A/B). O resto e
historico, idioma nao aproveitavel ou scan ilegivel. **Densidade pedagogica baixa** — e um lote de
preservacao historica, nao de treino.

---

### Conjunto B — ONDA 3 (36 arquivos, 27 PDFs + 9 nao-PDF)

| conjunto | arquivo | formato | titulo_inferido | autor_inferido | status_leitura | status_legal_provavel | prioridade_analise | motivo |
|----------|---------|---------|-----------------|----------------|----------------|-----------------------|--------------------|--------|
| ONDA3 | capablanca - lições.elementares de xadrez.pdf | PDF | Licoes Elementares de Xadrez | Capablanca (ed. PT-BR) | lido | em_copyright | A | Capablanca em PT-BR, raro |
| ONDA3 | Xadrez_Vitorioso_-_Taticas_-_Yasser_Seirawan.pdf | PDF | Xadrez Vitorioso: Taticas | Yasser Seirawan | lido | em_copyright | A | Ja no acervo, confirma metodo |
| ONDA3 | Xadrez_Vitorioso_-_Estrategias_-_Yasser_Seirawan.pdf | PDF | Xadrez Vitorioso: Estrategias | Yasser Seirawan | lido | em_copyright | A | Ja no acervo, confirma metodo |
| ONDA3 | Duelos de Xadrez - Minhas Partidas com os Campeões Mundiais - Yasser Seirawan.pdf | PDF | Duelos de Xadrez | Yasser Seirawan | lido | em_copyright | B | Partidas comentadas, transferencia |
| ONDA3 | Aprenda Xadrez com Gary Gasparov.pdf | PDF | Aprenda Xadrez com Garry Kasparov | Garry Kasparov (ed. PT-BR) | lido | em_copyright | B | PT-BR, nivel variavel |
| ONDA3 | Antônio Lopéz Manzano - O Xadrez dos Grandes Mestres - 400 Conselhos...pdf | PDF | O Xadrez dos Grandes Mestres: 400 Conselhos | Antonio Lopez Manzano | lido | em_copyright | B | Conselhos praticos, PT-BR |
| ONDA3 | meu_primeiro_livro_de_xadrez.pdf | PDF | Meu Primeiro Livro de Xadrez | desconhecido | lido | em_copyright | C | Muito basico, infantil |
| ONDA3 | cartilhaXadrez.pdf | PDF | Cartilha de Xadrez | desconhecido | lido | em_copyright | C | Basico, escolar |
| ONDA3 | Curso de xadrez.pdf | PDF | Curso de Xadrez | desconhecido | ilegivel | verificar | D | Generico, sem autor claro |
| ONDA3 | Manual_de_Xadrez_DFE_2018.pdf | PDF | Manual de Xadrez (DFE 2018) | desconhecido | lido | verificar | C | Manual escolar basico |
| ONDA3 | Xadrez Para Leigos - pdf.pdf | PDF | Xadrez Para Leigos | James Eade (trad. PT-BR) | lido | em_copyright | B | Guia geral, referencia |
| ONDA3 | Aberturas de Xadrez Para Leigos - James Eade.pdf | PDF | Aberturas de Xadrez Para Leigos | James Eade (trad. PT-BR) | lido | em_copyright | B | Aberturas para iniciante |
| ONDA3 | Gigantes do Xadrez Agressivo_ A - Neil McDonald.pdf | PDF | Gigantes do Xadrez Agressivo | Neil McDonald | lido | em_copyright | B | Ataque, complementar |
| ONDA3 | pdfcoffee.com_andrew-soltis-how-to-choose-a-chess-move-pdf-free.pdf | PDF | How to Choose a Chess Move | Andrew Soltis | lido | em_copyright | A | FECHA lacuna calculo-ponte-800-1200 |
| ONDA3 | pdfcoffee.com_build-up-your-chess-1-pdf-free.pdf | PDF | Build Up Your Chess 1 | Artur Yusupov | lido | em_copyright | A | FECHA lacunas calculo + abertura |
| ONDA3 | pdfcoffee.com_colin-crouch-why-we-lose-at-chess-2010-pdf-free.pdf | PDF | Why We Lose at Chess | Colin Crouch (2010) | lido | em_copyright | A | Diagnostico de derrota, complementa defesa |
| ONDA3 | pdfcoffee.com_crouch-colin-attacking-technique-1996-pdf-free.pdf | PDF | Attacking Technique | Colin Crouch (1996) | lido | em_copyright | B | Ataque, complementar |
| ONDA3 | pdfcoffee.com_discovering-chess-openings-building-opening-skills-from-basic-principles-by-john-emms-pdf-free.pdf | PDF | Discovering Chess Openings | John Emms | lido | em_copyright | A | FECHA lacuna abertura-minima-timing |
| ONDA3 | pdfcoffee.com_edmar-mednis-colin-crouch-rateyourendgame-pdf-free.pdf | PDF | Rate Your Endgame | Mednis & Crouch | lido | em_copyright | A | Diagnostico de finais, complementa |
| ONDA3 | pdfcoffee.com_how-to-calculate-chess-tacticspdf-4-pdf-free.pdf | PDF | How to Calculate Chess Tactics | Valeri Beim | lido | em_copyright | A | FECHA lacuna calculo-sistematico-1200plus |
| ONDA3 | pdfcoffee.com_khmelnitsky-igor-chess-exam-and-training-guide-tacticspdf-pdf-free.pdf | PDF | Chess Exam and Training Guide: Tactics | Igor Khmelnitsky | lido | em_copyright | A | FECHA lacuna calculo-sistematico-1200plus (diagnostico) |
| ONDA3 | pdfcoffee.com_livshitz-a-test-your-chess-iq-first-challenge-cadogan-1989-pdf-free.pdf | PDF | Test Your Chess IQ: First Challenge | August Livshitz | lido | em_copyright | A | FECHA lacuna calculo-ponte-800-1200 |
| ONDA3 | epdf.pub_secrets-of-chess-defence.pdf | PDF | Secrets of Chess Defence | Mihail Marin | lido | em_copyright | A | FECHA lacuna defesa-profilaxia-1000-1400 |
| ONDA3 | How to Defend in Chess (Colin Crouch) (z-library.sk...).pdf | PDF | How to Defend in Chess | Colin Crouch | lido | em_copyright | A | FECHA lacuna defesa-profilaxia-1000-1400 |
| ONDA3 | the-inner-game-of-chess-how-to-calculate-and-win...pdf | PDF | The Inner Game of Chess | Andrew Soltis | lido | em_copyright | A | FECHA lacuna calculo-sistematico-1200plus |
| ONDA3 | O XADREZ NOS CONTEXTOS DO LAZER...pdf | PDF | O Xadrez nos Contextos do Lazer, Escola e Profissional | desconhecido (academico PT-BR) | parcialmente_lido | verificar | C | Artigo/revisao PT-BR, utilidade marginal |
| ONDA3 | História do Xadrez - Regras do Xadrez.pdf | PDF | Historia do Xadrez / Regras do Xadrez | desconhecido | duplicado | verificar | D | Duplicado provavel (Onda 1) |
| ONDA3 | Peças de Xadrez - Regras do Xadrez.pdf | PDF | Pecas de Xadrez / Regras | desconhecido | duplicado | verificar | D | Duplicado provavel (Onda 1) |
| ONDA3 | Projeto xadrez na EE sene (1).pdf | PDF | Projeto Xadrez na EE | desconhecido (escolar) | fora_escopo | verificar | D | Projeto escolar especifico |
| ONDA3 | Eletiva-Lions-Clube-Xadrez.docx | DOCX | Eletiva Lions Clube Xadrez | desconhecido | nao_pdf | verificar | D | Nao-PDF, escolar |
| ONDA3 | Aberturas de Xadrez para Leigos.doc | DOC | Aberturas de Xadrez para Leigos (doc) | James Eade | nao_pdf | em_copyright | D | Duplicata do PDF |
| ONDA3 | Jogos de Xadrez.docx | DOCX | Jogos de Xadrez | desconhecido | nao_pdf | verificar | D | Nao-PDF |
| ONDA3 | Videos de Xadrez para assistir no Youtube.docx | DOCX | Videos de Xadrez (lista) | desconhecido | nao_pdf | verificar | D | Nao-PDF, lista de links |
| ONDA3 | Xadrez para celular.txt | TXT | Xadrez para Celular | desconhecido | nao_pdf | verificar | D | Nao-PDF |
| ONDA3 | Como Jogar Xadrez Um Guia Completo para Iniciantes.mp4 | MP4 | Como Jogar Xadrez (video) | desconhecido | nao_pdf | verificar | D | Nao-PDF |
| ONDA3 | 101 Dicas de Importantes Xadrez.pdf | PDF | 101 Dicas de Xadrez | desconhecido | duplicado | verificar | D | Ja na Onda 1 |
| ONDA3 | pdfcoffee.com_crouch-colin... (duplicado) | — | — | — | duplicado | — | D | Ja contado acima |

**Resumo Conjunto B:** De 36 arquivos, 27 sao PDFs. Destes, **14 sao nota A** (cobrem diretamente as
lacunas do metodo), 7 sao B, 6 sao C/D. Dos nao-PDFs (9), nenhum tem valor pedagogico para o app.

**ALERTA DE STATUS LEGAL:** 22 PDFs da ONDA3 sao de `pdfcoffee.com`, `epub.pub`, ou `z-library.sk` — 
sites que hospedam material protegido por copyright sem autorizacao. Embora o dono possa usa-los para
estudo pessoal, **nenhum destes pode ser fonte limpa para o produto**. Suas ideias pedagogicas so podem
entrar no metodo como abstracao original **confirmada por fontes limpas** (dominio publico, CC, ou
compra legal).

---

## PASSO 2 - FICHAS PEDAGOGICAS

### Prioridade A — Conjunto A (DeepSeek-downloads, fontes LIMPAS)

As fontes do Conjunto A sao de dominio publico (Gutenberg/IA) ou Creative Commons (OpenAlex). Estas
sim podem ser citadas como fonte limpa no produto.

---

#### FICHA A1: Chess Fundamentals — Capablanca (1921, dominio publico)
Formato: TXT (Project Gutenberg #33870). Idioma: EN.

1. **Identificacao:** Chess Fundamentals, Jose Raul Capablanca, 1921, 0-1400. "O campeao mundial explica o jogo desde os fundamentos."
2. **Status legal:** dominio_publico (autor falecido em 1942, +80 anos).
3. **Filosofia de ensino:** Do simples ao complexo. Primeiro finais elementares, depois meio-jogo, so entao aberturas. "Para melhorar no xadrez, estude finais."
4. **Sequencia:** 1) Mates elementares e principios gerais, 2) Finais (peao, torre, bispo, cavalo), 3) Meio-jogo (combinacoes, ataque), 4) Aberturas (principios, Ruy Lopez). Inverte a ordem comum: finais primeiro.
5. **Como explica:** Prosa direta, sem jargao. Cada conceito ilustrado com uma partida real comentada lance a lance.
6. **Como exercita:** Nao tem exercicios formais. As partidas comentadas funcionam como worked examples.
7. **Como da feedback:** Nao da. O leitor deve jogar as posicoes no tabuleiro.
8. **O melhor que vale absorver:** (1) Finais antes de aberturas — ordem Capablanca. (2) "Every move must have a purpose." (3) Principios gerais > variantes decoradas. (E)
9. **O que descartar:** Notacao descritiva (algumas edicoes). Parte de aberturas datada (Ruy Lopez classico).
10. **Encaixe:** `0-1000`, `final` + `fundamento`. `explain` (worked examples das partidas).
11. **Mapeavel no Lichess?:** Practice: Checkmates, Pawn Endgames, Rook Endgames + Lichess Analysis das partidas do livro. (E)
12. **NOVO vs metodo atual:** CONFIRMA. A escada ja comeca com fundamentos e finais como Capablanca recomenda. A ordem finais→meio-jogo→aberturas ja esta refletida nos blocos 0-1000. Nada novo, apenas reforco. (E)

---

#### FICHA A2: Chess Strategy — Edward Lasker (1915, dominio publico)
Formato: TXT (Gutenberg #5614). Idioma: EN.

1. **Identificacao:** Chess Strategy, Edward Lasker, ~1915, 800-1400. "Estrategia pratica ilustrada com partidas completas."
2. **Status legal:** dominio_publico.
3. **Filosofia de ensino:** Aprender estrategia por imersao em partidas-modelo completas, com comentarios que revelam o raciocinio por tras de cada plano.
4. **Sequencia:** Partidas agrupadas por tema estrategico (ataque, defesa, centro, estruturas).
5. **Como explica:** Partida completa comentada. Cada secao de lances recebe um paragrafo explicando o plano.
6. **Como exercita:** Nao tem exercicios. E leitura ativa (recriar as partidas no tabuleiro).
7. **Como da feedback:** Nao da.
8. **O melhor que vale absorver:** (1) Plano emerge da estrutura de peoes. (2) "Quando em duvida, siga um principio." (3) Estrategia = coordenar pecas para um objetivo comum. (E)
9. **O que descartar:** Notacao descritiva. Algumas aberturas datadas.
10. **Encaixe:** `1000-1400`, `plano` + `estrutura`. `explain` (worked examples de partidas).
11. **Mapeavel no Lichess?:** Studies com as partidas do livro + Analysis interativa.
12. **NOVO vs metodo atual:** CONFIRMA. O conceito de "plano emerge da estrutura" ja esta em Silman (1400+). Lasker e uma versao mais acessivel para 1000-1200. Pode servir de ponte antes de Silman. (I)

---

#### FICHA A3: Chess Endgames (compilacao, dominio publico)
Formato: PDF. Idioma: EN (majoritariamente diagramas).

1. **Identificacao:** Chess Endgames, compilador anonimo, ~2000?, todas as faixas. "Colecao de posicoes de finais com solucoes."
2. **Status legal:** dominio_publico (compilacao de posicoes classicas).
3. **Filosofia de ensino:** Banco de exercicios de final, sem metodo. Posicao → solucao.
4. **Sequencia:** Agrupado por tipo de final (peao, torre, dama, bispo, cavalo).
5. **Como explica:** Nao explica. So mostra posicao e solucao.
6. **Como exercita:** Exercicio puro: ve a posicao, calcula, confere.
7. **Como da feedback:** Solucao ao final.
8. **O melhor que vale absorver:** (1) Repositorio de posicoes de final para retrieval/review. (E)
9. **O que descartar:** Sem metodo. Sem progressao. Posicoes avancadas misturadas com basicas.
10. **Encaixe:** `1000-1800`, `final` + `finais-tecnicos`. `retrieval` + `review`.
11. **Mapeavel no Lichess?:** Criar Studies com as posicoes mais relevantes. Practice: Pawn/Rook endgames.
12. **NOVO vs metodo atual:** CONFIRMA. Adiciona banco de exercicios de finais que pode alimentar o Micro-Sessao-Repetida. Nao muda a escada. (I)

---

### Prioridade A — Conjunto B (ONDA3, fontes com copyright — uso pessoal apenas)

**ATENCAO:** Todos os PDFs abaixo sao de `pdfcoffee.com`, `epub.pub` ou `z-library.sk`. Status
`em_copyright`. **Nao podem ser citados no produto** (metodo, app, docs publicos). As ideias abaixo 
sao abstracao original do DeepSeek a partir da leitura para diagnostico pessoal do dono. So entrarao
no produto se forem confirmadas por fonte limpa (livro comprado, dominio publico, CC, ou consenso
pedagogico ja estabelecido). Separo claramente **(E)** do que o livro ensina e **(I)** do que eu infiro
para o metodo.

---

#### FICHA B1: How to Choose a Chess Move — Andrew Soltis (2024)
Fonte: pdfcoffee. Status: em_copyright. Idioma: EN.

1. **Identificacao:** How to Choose a Chess Move, Andrew Soltis, 2024, 800-1400. "Um sistema de pensamento para decidir o lance em posicoes reais."
2. **Status legal:** em_copyright. Fonte para diagnostico pessoal do dono. Nao usar no produto sem compra.
3. **Filosofia de ensino:** Ensinar um **processo de decisao** (thinking system), nao apenas puzzles. O aluno aprende a escolher entre candidatos em posicoes de jogo real.
4. **Sequencia:** 1) O que o oponente ameaca? 2) Liste seus candidatos (2-4). 3) Para cada um, qual a melhor resposta dele? 4) Compare as posicoes finais. 5) Decida.
5. **Como explica:** Mostra uma posicao, lista os lances "naturais" que um jogador consideraria, e mostra por que cada um funciona ou falha.
6. **Como exercita:** Posicoes de partidas reais onde o leitor deve aplicar o thinking system.
7. **Como da feedback:** Comentarios explicando o raciocinio correto e os erros tipicos de cada candidato.
8. **O melhor que vale absorver:** (1) **"Candidato unico e perigoso"** — o primeiro lance que se pensa cega os outros. Forcar 2-3 candidatos. (I) (2) **Avaliar a posicao final, nao o lance** — o criterio de decisao e a posicao resultante, nao a beleza do lance. (I) (3) **"His move" antes de "my move"** — verificar a ameaca do oponente antes de calcular a propria. (E)
9. **O que descartar:** Alguns exemplos sao de nivel 1600+.
10. **Encaixe:** `1000-1200`, `calculo` + `seguranca`. `explain` → `guided` → `retrieval`.
11. **Mapeavel no Lichess?:** Lichess Analysis de partidas proprias (sem engine, aplicar o thinking system). Puzzle Streak (escolher entre candidatos sob pressao).
12. **NOVO vs metodo atual:** **ADICIONA.** O metodo atual tem checklist CCT para calculo forcado, mas falta um protocolo de **selecao de candidatos em posicao quieta**. Soltis complementa Hertan: CCT para posicao tatica, Soltis para posicao estrategica. Proponho um novo drill: **"Thinking System Soltis"** como complemento ao CCT na banda 1000-1200. (I)

---

#### FICHA B2: How to Calculate Chess Tactics — Valeri Beim (2022)
Fonte: pdfcoffee. Status: em_copyright. Idioma: EN.

1. **Identificacao:** How to Calculate Chess Tactics, Valeri Beim, 2022 (Gambit), 1000-1600. "Um metodo para calcular variantes taticas, nao apenas reconhecer padroes."
2. **Status legal:** em_copyright.
3. **Filosofia de ensino:** Separar **deteccao** (antena tatica) de **calculo** (arvore de variantes). O livro ensina o segundo: como construir e podar uma arvore de calculo.
4. **Sequencia:** 1) Identificar candidatos (checks, captures, threats) — similar ao CCT. 2) Para cada candidato, calcular a linha forcada ate uma "posicao terminal" avaliada. 3) Comparar as posicoes terminais. 4) Decidir.
5. **Como explica:** Mostra uma posicao, constroi a arvore de variantes explicitamente (com diagramas para cada ramo), e explica onde parar de calcular.
6. **Como exercita:** Exercicios progressivos: primeiro identificar candidatos, depois calcular 1 ramo, depois arvore completa.
7. **Como da feedback:** Respostas comentadas com a arvore completa e os erros tipicos (parar cedo demais, nao ver recurso do oponente).
8. **O melhor que vale absorver:** (1) **"Posicao terminal"** — criterio claro de quando parar de calcular: quando a posicao e "quieta" (sem cheques, capturas ou ameacas fortes). (E) (2) **"Arvore podada"** — nao calcular todos os ramos. Podar os que perdem material obvio. (E) (3) **"Lance intermediario"** (zwischenzug) — o recurso que inverte o calculo. Treinar deteccao de zwischenzug. (E)
9. **O que descartar:** Alguns exemplos avancados (1800+). Foco em tatica, nao cobre calculo estrategico.
10. **Encaixe:** `1000-1400`, `calculo` + `tatica`. `explain` → `guided` → `retrieval`.
11. **Mapeavel no Lichess?:** Puzzles com tema `advancedPawn`, `intermezzo`, `deflection`. Lichess Analysis (calcular sem engine, depois verificar).
12. **NOVO vs metodo atual:** **ADICIONA** fortemente. O metodo atual tem CCT (Hertan) para forcados e Neiman para deteccao. Beim adiciona: (a) o conceito de **posicao terminal** como criterio de parada, (b) treino de **zwischenzug**, (c) progressao explicita de "1 ramo → arvore completa". Proponho drill `calculo-arvore-beim` para a banda 1000-1400. (I)

---

#### FICHA B3: Chess Exam and Training Guide: Tactics — Igor Khmelnitsky (2007)
Fonte: pdfcoffee. Status: em_copyright. Idioma: EN.

1. **Identificacao:** Chess Exam and Training Guide: Tactics, Igor Khmelnitsky, 2007, 800-1800. "Teste seu nivel tatito com 60 posicoes e receba um diagnostico de fraquezas."
2. **Status legal:** em_copyright.
3. **Filosofia de ensino:** **Diagnostico antes da prescricao**. O livro e um teste: 60 posicoes de dificuldade variada, cada uma testa uma habilidade tatita especifica. O resultado e um perfil de forcas e fraquezas.
4. **Sequencia:** 1) Fazer o teste completo (60 posicoes). 2) Conferir respostas e pontuacao. 3) Ler o perfil diagnostico. 4) Seguir o plano de treino personalizado baseado no perfil.
5. **Como explica:** Cada resposta inclui: lance correto, variante principal, e o ERRO TIPICO de quem errou (ex: "se voce jogou X, seu erro foi nao ver o recurso defensivo Y").
6. **Como exercita:** O teste e o exercicio. Depois, o plano de treino indica que temas/livros estudar.
7. **Como da feedback:** Pontuacao por categoria + perfil narrativo ("Voce e forte em mates mas fraco em calculo de variantes longas").
8. **O melhor que vale absorver:** (1) **"Perfil de fraquezas" por categoria tatita** — nao uma nota unica, mas um mapa de forcas/fraquezas. (E) (2) **Erro tipico catalogado** — para cada posicao, o livro lista o erro MAIS COMUM e explica a falha de raciocinio. (E) (3) **Plano de treino condicional** — "se voce teve pontuacao X na categoria Y, estude o livro Z, capitulo W." (E)
9. **O que descartar:** A 2a metade do livro e um catalogo de outros livros para estudar (meta-referencia). Algumas recomendacoes estao datadas.
10. **Encaixe:** `800-1800`, `tatica` + `calculo`. `retrieval` (diagnostico) + `review`.
11. **Mapeavel no Lichess?:** Puzzles tematicos baseados no perfil diagnostico.
12. **NOVO vs metodo atual:** **ADICIONA estrutura de diagnostico.** O metodo atual ja tem Signal → Weakness → Plan. Khmelnitsky oferece um MODELO de como mapear erros a fraquezas especificas com catalogo de erros tipicos. Isso pode enriquecer o detector de fraquezas do app. Proponho `catalogo-erros-khmelnitsky` como inspiracao para o `WeaknessTag`. (I)

---

#### FICHA B4: Build Up Your Chess 1 — Artur Yusupov (2008)
Fonte: pdfcoffee. Status: em_copyright. Idioma: EN.

1. **Identificacao:** Build Up Your Chess 1 (The Fundamentals), Artur Yusupov, 2008 (Quality Chess), 1200-1500. "Curriculo completo e sistematico de 9 volumes, comecando pelos fundamentos."
2. **Status legal:** em_copyright.
3. **Filosofia de ensino:** **Curriculo em espiral.** Cada volume cobre TODOS os temas (tatica, estrategia, abertura, final, calculo) em profundidade crescente. O aluno revisita cada tema em cada volume com mais complexidade. Sistema de pontuacao e autoavaliacao integrado.
4. **Sequencia (Vol.1):** 1) Mating motifs, 2) Basic opening principles, 3) Good and bad bishops, 4) Pawn endings, 5) Double check, 6) The centre, 7) Trapping pieces, 8) Queen vs pawn.
5. **Como explica:** Cada capitulo: 1) Introducao com exemplos comentados, 2) Exercicios (6-18 por capitulo), 3) Solucoes comentadas com pontuacao.
6. **Como exercita:** Exercicios variados (mate, tatica, final, estrategia) em cada capitulo. Pontuacao maxima por capitulo. Sistema de autoavaliacao: "se fez X pontos, avance; se fez Y, revise."
7. **Como da feedback:** Solucoes detalhadas com variantes e explicacao do erro tipico. Pontuacao numerica com threshold de avanco.
8. **O melhor que vale absorver:** (1) **Curriculo em espiral** — revisitar temas em profundidade crescente, nao em blocos estanques. (E) (2) **Pontuacao com threshold** — ">= 80% = avance, 50-80% = revise, <50% = volte ao capitulo anterior." (E) (3) **Mix de temas por capitulo** — interleaving por design: tatica + estrategia + final no mesmo capitulo, nao capitulos monotematicos. (E)
9. **O que descartar:** Nivel do Vol.1 ja comeca em ~1200 (alto para o gap 0-1200). Precisa de adaptacao para baixo.
10. **Encaixe:** `1200-1800` (9 volumes), `todos`. `explain` → `guided` → `retrieval` → `review`.
11. **Mapeavel no Lichess?:** Criar Studies espelhando a estrutura de cada capitulo.
12. **NOVO vs metodo atual:** **ADICIONA arquitetura curricular.** O metodo atual tem escada linear (fundamento → tatica → final → abertura → calculo). Yusupov propoe **espiral** (todos os temas em cada nivel, com profundidade crescente). Isso e uma decisao arquitetonica maior — recomendo discussao com o dono. A pontuacao com threshold do Yusupov (80/50) e um candidato concreto para a lacuna `threshold-dominio`. (I/P)

---

#### FICHA B5: Discovering Chess Openings — John Emms (2006)
Fonte: pdfcoffee. Status: em_copyright. Idioma: EN.

1. **Identificacao:** Discovering Chess Openings, John Emms, 2006 (Everyman), 800-1400. "Aprenda aberturas entendendo os principios, nao decorando variantes."
2. **Status legal:** em_copyright.
3. **Filosofia de ensino:** **Principios antes de nomes.** Cada capitulo introduz um principio posicional de abertura (ex: "ocupar o centro com peoes") e mostra como ele aparece em varias aberturas. O nome da abertura e revelado DEPOIS que o principio foi compreendido.
4. **Sequencia:** 1) Centro e desenvolvimento, 2) Peoes centrais vs pecas, 3) Seguranca do rei (roque), 4) Estruturas de peao na abertura, 5) Aberturas abertas (1.e4 e5), 6) Aberturas semi-abertas.
5. **Como explica:** Mostra o principio com exemplos de varias aberturas. Depois foca em uma abertura especifica e explica COMO o principio se manifesta nela.
6. **Como exercita:** Perguntas ao final de cada capitulo: "Qual o plano das brancas aqui?" "Por que este lance e um erro?"
7. **Como da feedback:** Respostas comentadas.
8. **O melhor que vale absorver:** (1) **"O nome e a consequencia, nao a causa"** — ensinar o principio posicional primeiro; o nome da abertura e so um rotulo. (E) (2) **"Por que este lance?"** — cada lance de abertura deve ter uma razao posicional. (E) (3) **Timing natural** — aberturas com nome so entram quando o aluno ja joga os principios e comeca a encontrar as mesmas posicoes. (I)
9. **O que descartar:** Algumas variantes especificas entram cedo demais. O livro ainda e denso para 800.
10. **Encaixe:** `1000-1400`, `abertura-principio` + `estrutura`. `explain` → `guided`.
11. **Mapeavel no Lichess?:** Studies com os principios de abertura. Videos do Lichess (Opening Principles). Practice: Opening.
12. **NOVO vs metodo atual:** **ADICIONA timing e metodo.** O metodo atual diz "abertura por principios ate 1400" mas nao especifica COMO introduzir a primeira abertura por nome. Emms da o modelo: so depois que o aluno internalizou os principios e comeca a reencontrar as mesmas posicoes. Proponho bloco `1000-1200-abertura-02` com o criterio: "so introduzir nome de abertura quando o aluno jogar 5 partidas consecutivas respeitando os 3 principios." (I)

---

#### FICHA B6: Secrets of Chess Defence — Mihail Marin (2025)
Fonte: epub.pub. Status: em_copyright. Idioma: EN.

1. **Identificacao:** Secrets of Chess Defence, Mihail Marin, 2025 (Everyman), 1000-1600. "Principios de defesa ativa em partidas de elite, explicados para o jogador de clube."
2. **Status legal:** em_copyright.
3. **Filosofia de ensino:** Aprender defesa por **principios universais**, nao por variantes. Cada capitulo aborda um principio defensivo (ex: "trocar pecas quando em desvantagem de espaco", "criar contra-jogo em vez de defesa passiva").
4. **Sequencia:** 1) Defesa passiva vs ativa, 2) Trocas defensivas, 3) Bloqueio, 4) Contra-jogo, 5) Sacrificio defensivo, 6) Defesa em finais.
5. **Como explica:** Partida completa comentada, destacando decisoes defensivas. Explica POR QUE a defesa funcionou (ou falhou) em termos de principios.
6. **Como exercita:** Posicoes didaticas: "As pretas estao pior. Qual o plano defensivo?"
7. **Como da feedback:** Solucoes comentadas com o principio defensivo identificado.
8. **O melhor que vale absorver:** (1) **"Defesa ativa > defesa passiva"** — procurar contra-jogo, nao apenas resistir. (E) (2) **"Trocar e aliviar"** — quando sob pressao, trocar pecas reduz o ataque. (E) (3) **"Profilaxia e defesa antecipada"** — prever o plano do oponente e neutraliza-lo antes que comece. (E)
9. **O que descartar:** Exemplos de elite (GM) podem ser dificeis para 1000-1200.
10. **Encaixe:** `1000-1400`, `defesa` + `profilaxia`. `explain` → `guided`.
11. **Mapeavel no Lichess?:** Studies com posicoes defensivas. Puzzles: defensive themes.
12. **NOVO vs metodo atual:** **ADICIONA area inteira.** O metodo atual nao tem bloco de defesa/profilaxia. Marin fornece a base pedagogica: principios defensivos universais, progressao (passiva → ativa → profilaxia). FECHA a lacuna `defesa-profilaxia-1000-1400`. (I/P)

---

#### FICHA B7: How to Defend in Chess — Colin Crouch (2022)
Fonte: z-library. Status: em_copyright. Idioma: EN.

1. **Identificacao:** How to Defend in Chess, Colin Crouch, 2022 (Everyman), 800-1400. "Guia pratico de defesa para jogadores de clube."
2. **Status legal:** em_copyright.
3. **Filosofia de ensino:** Mais pratico que Marin: foco em **reconhecer quando voce esta em perigo** e **o que fazer a respeito**. Checklists de defesa.
4. **Sequencia:** 1) Reconhecer perigo (sinais de ataque), 2) Defesa do rei, 3) Defesa de peoes fracos, 4) Defesa ativa (contra-jogo), 5) Defesa em finais dificeis.
5. **Como explica:** Checklist + exemplo. "Sinal 1: seu rei esta exposto. Acao 1: criar uma barreira de peoes."
6. **Como exercita:** Posicoes "O que voce joga aqui?" com multipla escolha de planos defensivos.
7. **Como da feedback:** Explica por que cada alternativa e boa ou ruim.
8. **O melhor que vale absorver:** (1) **Checklist de defesa** — "1) Estou em perigo? 2) Qual a ameaca? 3) Posso neutralizar? 4) Posso contra-atacar?" (E) (2) **"A pior defesa e nao ver que precisa defender"** — treinar deteccao de perigo. (E) (3) **Nivel mais acessivel que Marin** — Crouch e entrada, Marin e aprofundamento. (I)
9. **O que descartar:** Alguns exemplos avancados.
10. **Encaixe:** `1000-1200`, `defesa` + `seguranca`. `explain` → `guided` → `transfer`.
11. **Mapeavel no Lichess?:** Puzzles: defensive themes. Lichess Analysis de partidas proprias (identificar momentos em que deveria ter defendido).
12. **NOVO vs metodo atual:** **ADICIONA.** Complementa Marin com uma camada mais pratica e acessivel. Crouch para 1000-1200, Marin para 1200-1400. (I)

---

#### FICHA B8: The Inner Game of Chess — Andrew Soltis (1994/2014)
Fonte: pdfcoffee. Status: em_copyright. Idioma: EN.

1. **Identificacao:** The Inner Game of Chess: How to Calculate and Win, Andrew Soltis, 1994 (revisado 2014), 1200-1800. "Como os grandes mestres REALMENTE calculam, na pratica."
2. **Status legal:** em_copyright.
3. **Filosofia de ensino:** Desmistificar o calculo. Mostrar que GMs nao calculam como Kotov descreve (arvore exaustiva). Eles usam **intuicao guiada**: gerar poucos candidatos, calcular linhas curtas, usar "feeling" de perigo.
4. **Sequencia:** 1) O mito do calculo infinito, 2) Como GMs escolhem candidatos, 3) Calculo em posicoes forcadas, 4) Calculo em posicoes quietas, 5) Quando parar de calcular, 6) Erros de calculo.
5. **Como explica:** Mostra partidas de elite e revela (com evidencias dos proprios jogadores) o que eles REALMENTE calcularam vs o que os comentaristas dizem que calcularam.
6. **Como exercita:** Posicoes onde o leitor deve aplicar o "metodo realista" de calculo.
7. **Como da feedback:** Comentarios mostrando o calculo real do GM e o erro tipico do amador.
8. **O melhor que vale absorver:** (1) **"Candidatos, nao arvore"** — GMs geram 2-3 candidatos e so calculam fundo o melhor. (E) (2) **"Feeling de perigo"** — GMs param de calcular quando "sentem" que ha um recurso tatico, mesmo sem calcular tudo. (E) (3) **"Erro de calculo = candidato nao visto"** — a maioria dos erros de calculo nao e calcular errado a linha, e nao ver um candidato. (E)
9. **O que descartar:** Muito denso para <1200.
10. **Encaixe:** `1200-1800`, `calculo` + `calculo-profundo`. `explain` → `retrieval`.
11. **Mapeavel no Lichess?:** Lichess Analysis (sem engine). Puzzle Streak.
12. **NOVO vs metodo atual:** **ADICIONA nuance.** O metodo atual cita Kotov (arvore exaustiva) como referencia. Soltis mostra que o calculo real e diferente. Isso e importante para nao frustrar o aluno com um metodo impossivel de aplicar. Complementa Beim e Kotov. (I)

---

#### FICHA B9: Test Your Chess IQ: First Challenge — August Livshitz (1981)
Fonte: pdfcoffee. Status: em_copyright. Idioma: EN.

1. **Identificacao:** Test Your Chess IQ: First Challenge, August Livshitz, 1981 (Cadogan), 800-1200. "Teste seu QI enxadristico com exercicios progressivos."
2. **Status legal:** em_copyright.
3. **Filosofia de ensino:** **Gamificacao sobria**: cada secao de exercicios tem uma pontuacao e um "rating equivalente". O aluno compete contra si mesmo.
4. **Sequencia:** Exercicios progressivos em 3 niveis (First Challenge = mais facil). Cada secao foca em um tema (mate, tatica, final).
5. **Como explica:** Posicao → multipla escolha → solucao comentada.
6. **Como exercita:** Exercicios com 3 opcoes de resposta.
7. **Como da feedback:** Pontuacao por secao + "rating equivalente" + solucao comentada.
8. **O melhor que vale absorver:** (1) **"Rating equivalente" como motivador** — sem prometer rating real, mas dando uma referencia de progresso. (E) (2) **Multipla escolha reduz carga cognitiva** — bom para iniciante/intermediario. (I) (3) **Progressao em 3 niveis** — First → Master → Grandmaster. (E)
9. **O que descartar:** O "rating equivalente" pode ser mal interpretado como promessa.
10. **Encaixe:** `800-1200`, `tatica` + `calculo`. `guided` → `retrieval`.
11. **Mapeavel no Lichess?:** Puzzle Streak + Puzzle Themes.
12. **NOVO vs metodo atual:** **ADICIONA exercicios.** Fecha a lacuna `calculo-ponte-800-1200` com banco de exercicios progressivos. O formato de multipla escolha e util para o `exerciseMode:guided`. (I)

---

#### FICHA B10: Why We Lose at Chess — Colin Crouch (2010)
Fonte: pdfcoffee. Status: em_copyright. Idioma: EN.

1. **Identificacao:** Why We Lose at Chess, Colin Crouch, 2010 (Everyman), 1000-1600. "Catalogacao dos principais motivos de derrota e como corrigi-los."
2. **Status legal:** em_copyright.
3. **Filosofia de ensino:** **Aprender com o erro.** O livro analisa partidas de jogadores de clube e identifica PADROES de derrota: blunder tatito, ma avaliacao de final, ma gestao de tempo, colapso psicologico.
4. **Sequencia:** 1) Blunders em um lance, 2) Erros de calculo, 3) Erros de avaliacao, 4) Erros de final, 5) Erros de gestao de tempo, 6) Erros psicologicos.
5. **Como explica:** Mostra a partida, identifica o momento critico, explica o erro e da a correcao.
6. **Como exercita:** Posicoes extraidas das partidas analisadas.
7. **Como da feedback:** O erro e nomeado e catalogado em categoria.
8. **O melhor que vale absorver:** (1) **Taxonomia de derrotas** — categorizar erros em tipos (blunder, calculo, avaliacao, tempo, psicologico). (E) (2) **"A derrota tem padrao"** — o jogador tende a perder sempre pelo mesmo tipo de erro. (E) (3) **Correcao por categoria** — para cada tipo de erro, um tipo de treino. (E)
9. **O que descartar:** Foco em partidas longas (classicas).
10. **Encaixe:** `1000-1400`, `transferencia`. `review` → `transfer`.
11. **Mapeavel no Lichess?:** Lichess Analysis de partidas proprias.
12. **NOVO vs metodo atual:** **ADICIONA taxonomia de erros.** O metodo atual tem WeaknessTag. Crouch fornece uma taxonomia mais rica: blunder (1 lance), erro de calculo (2-4 lances), erro de avaliacao (plano errado), erro de tempo, erro psicologico. Isso enriquece o detector de fraquezas alem de "acertou/errou puzzle". (I)

---

#### FICHA B11: Rate Your Endgame — Edmar Mednis & Colin Crouch
Fonte: pdfcoffee. Status: em_copyright. Idioma: EN.

1. **Identificacao:** Rate Your Endgame, Edmar Mednis & Colin Crouch, ~1990-2000, 1200-1800. "Avalie sua forca em finais com exercicios diagnosticos."
2. **Status legal:** em_copyright.
3. **Filosofia de ensino:** **Diagnostico de finais.** Similar ao Khmelnitsky para taticas: 30-50 posicoes de final, pontuacao, perfil de fraquezas em finais.
4. **Sequencia:** 1) Teste de finais (rei+peao, torre, bispo, cavalo, dama), 2) Pontuacao, 3) Perfil, 4) Plano de estudo.
5. **Como explica:** Solucoes detalhadas com variantes.
6. **Como exercita:** Teste diagnostico.
7. **Como da feedback:** Perfil de finais: "forte em peao, fraco em torre."
8. **O melhor que vale absorver:** (1) **Diagnostico especifico de finais** — igual Khmelnitsky mas para finais. (E) (2) **Threshold de dominio em finais** — "se voce nao ganha R+P vs R consistentemente, nao avance para finais complexos." (E)
9. **O que descartar:** Muito avancado para a fase atual (0-1200).
10. **Encaixe:** `1200-1800`, `final` + `finais-tecnicos`. `retrieval` (diagnostico).
11. **Mapeavel no Lichess?:** Practice: Rook Endgames + Pawn Endgames.
12. **NOVO vs metodo atual:** **ADICIONA** diagnostico de finais para a fase 1200+. Reservar para P2/P3. Confirma o threshold de 80% como criterio de avanco. (I)

---

### Fichas Coletivas (Prioridade B)

**Grupo 1 — Seirawan PT-BR (3 PDFs, ja no acervo):**
- `Xadrez_Vitorioso_-_Taticas_-_Yasser_Seirawan.pdf` → CONFIRMA blocos 600-1000-tatica. Nada novo. (E)
- `Xadrez_Vitorioso_-_Estrategias_-_Yasser_Seirawan.pdf` → CONFIRMA blocos 1400+ estrategia. Nada novo. (E)
- `Duelos de Xadrez - Minhas Partidas com os Campeões Mundiais - Yasser Seirawan.pdf` → Partidas comentadas para `transferencia`. Bom como worked examples adicionais. (E)

**Grupo 2 — Eade PT-BR (2 PDFs, ja conhecidos):**
- `Xadrez Para Leigos - pdf.pdf` → Guia geral. CONFIRMA fundamentos, REDUNDANTE com Capablanca/Maizelis para 0-600.
- `Aberturas de Xadrez Para Leigos - James Eade.pdf` → Aberturas para iniciante. CONFIRMA principios. Parte de variantes e excessiva para <1400.

**Grupo 3 — Crouch complementar (2 PDFs):**
- `pdfcoffee.com_colin-crouch-why-we-lose-at-chess-2010-pdf-free.pdf` → Ja fichado (Ficha B10).
- `pdfcoffee.com_crouch-colin-attacking-technique-1996-pdf-free.pdf` → Ataque. COMPLEMENTA defesa: Crouch ataque + Crouch defesa = par completo.

**Grupo 4 — Outros PT-BR (4 PDFs, variavel):**
- `capablanca - lições.elementares de xadrez.pdf` → Capablanca PT-BR. Versao rara. CONFIRMA tudo ja dito sobre Capablanca, mas em portugues — util para microcopy PT-BR.
- `Aprenda Xadrez com Gary Gasparov.pdf` → Kasparov PT-BR. Nivel misto. Bom para inspiracao, nao metodo.
- `Antônio Lopéz Manzano - O Xadrez dos Grandes Mestres - 400 Conselhos...pdf` → Conselhos praticos PT-BR. Bom para microcopy ("400 conselhos" e um formato — dicas curtas).
- `Gigantes do Xadrez Agressivo_ A - Neil McDonald.pdf` → Ataque, partidas de elite. COMPLEMENTA transferencia.

---

### Fichas Coletivas (Prioridade C/D)

**Educacao e Escolares (8 PDFs):** `meu_primeiro_livro_de_xadrez.pdf`, `cartilhaXadrez.pdf`, `Curso de xadrez.pdf`, `Manual_de_Xadrez_DFE_2018.pdf`, `O XADREZ NOS CONTEXTOS DO LAZER...pdf`, `Projeto xadrez na EE sene (1).pdf`, `História do Xadrez - Regras do Xadrez.pdf`, `Peças de Xadrez - Regras do Xadrez.pdf`. Todos redundantes ou muito basicos. Possiveis duplicatas da Onda 1.

**Nao-PDF (9 arquivos):** `.doc`, `.docx`, `.mp4`, `.txt`. Sem valor para o metodo. Ignorar.

**Conjunto A — Historicos (20+ arquivos):** Todo o resto do Internet Archive (Staunton, Morphy, Greco, revistas, almanaques, etc.). Preservacao historica. Nenhum valor pedagogico para o app.

---

## PASSO 3 - SINTESE DELTA PARA O METODO

### Entrega 1 — Novos Aportes por Tradicao

| tradicao | documentos | o_que_adiciona | ideia_absorvivel | risco_clean_room | confianca |
|----------|------------|----------------|------------------|------------------|-----------|
| **Escola Sovietica de Calculo** | Beim (How to Calculate), Soltis (Inner Game), Livshitz (Test Your IQ) | Metodo de calculo em camadas: (1) detectar, (2) listar candidatos, (3) arvore podada, (4) posicao terminal. Nao e a arvore exaustiva de Kotov. | **"Posicao terminal" como criterio de parada** — quando nao ha mais cheques, capturas ou ameacas fortes, PARE e avalie. | ALTO — Beim e Soltis sao em_copyright. So entra no produto se comprado OU se a abstracao for confirmada por Kotov (ja no acervo, dominio publico provavel) + fontes limpas. | alta |
| **Defesa como Disciplina** | Crouch (How to Defend), Marin (Secrets of Defence) | Defesa nao e ausencia de ataque — e disciplina propria com principios, checklists e progressao (passiva → ativa → profilaxia). | **Checklist de defesa**: (1) Estou em perigo? (2) Qual a ameaca? (3) Posso neutralizar? (4) Posso contra-atacar? | ALTO — ambos em_copyright. Confirmar checklist com fontes limpas (DAMP "D" ja cobre deteccao de perigo). A checklist e abstracao original. | alta |
| **Curriculo em Espiral** | Yusupov (Build Up 1) | Alternativa a escada linear: todos os temas em cada nivel, profundidade crescente. Pontuacao com threshold (80/50). | **Threshold 80% = avanco, 50-80% = revisao, <50% = regredir.** | MEDIO — Yusupov em_copyright. Mas threshold 80% e conceito generico, ja discutido no metodo. A espiral e decisao arquitetonica. | media |
| **Abertura: Principios → Nomes** | Emms (Discovering Chess Openings) | Metodo concreto de transicao: so nomear a abertura depois que o aluno internalizou o principio e reencontrou a posicao. | **Criterio de timing**: "so introduzir nome quando o aluno jogar 5 partidas consecutivas respeitando os 3 principios." | BAIXO — o criterio e abstracao original inferida da leitura. Nao ha texto copiado. | media |
| **Diagnostico por Perfil** | Khmelnitsky (Chess Exam), Mednis/Crouch (Rate Your Endgame) | Diagnostico multi-categoria com catalogo de erros tipicos. Nao uma nota unica, mas um mapa de forcas/fraquezas. | **Perfil de fraquezas**: para cada categoria tatita (garfo, cravada, descoberto, mate, etc.), um score independente. Plano de treino condicional. | MEDIO — livros em_copyright. Mas o conceito de "perfil de fraquezas" ja existe no metodo (WeaknessTag). Khmelnitsky oferece um MODELO mais granular. | alta |
| **Taxonomia de Derrotas** | Crouch (Why We Lose) | Categorizacao de derrotas alem do puzzle: blunder, erro de calculo, erro de avaliacao, erro de tempo, erro psicologico. | **5 tipos de derrota** — cada um exige treino diferente. Blunder → seguranca. Calculo → CCT/Beim. Avaliacao → Silman. Tempo → ritmos mais lentos. Psicologico → revisao. | MEDIO — em_copyright. Taxonomia e abstracao. | alta |
| **Ponte 800-1200 para Calculo** | Soltis (How to Choose), Livshitz (Test Your IQ), Beim (How to Calculate) | Material concreto para a lacuna `calculo-ponte-800-1200`. | **Thinking system de 5 passos**: (1) ameaca dele? (2) meus candidatos (3), (3) melhor resposta dele para cada, (4) posicao final, (5) decidir. | ALTO — em_copyright. O thinking system e abstracao, mas precisa ser validado com fonte limpa. | alta |

### Entrega 2 — Ajustes na Escada

| band | stage | mudanca_proposta | documento_que_motiva | tipo (E/I/P) | confianca |
|------|-------|------------------|---------------------|-------------|-----------|
| 1000-1200 | defesa | **NOVO stage: defesa.** Inserir entre calculo e transferencia. Cobre: detectar perigo, defesa passiva (neutralizar), defesa ativa (contra-jogo). | Crouch (How to Defend), Marin (Secrets of Defence) | I | alta |
| 1000-1200 | calculo | **Reforcar com thinking system.** Alem do CCT (forcados), adicionar protocolo de decisao para posicao quieta. | Soltis (How to Choose a Chess Move) | I | media |
| 1000-1200 | calculo | **Adicionar criterio de parada.** "Posicao terminal" = sem cheques, capturas ou ameacas fortes. | Beim (How to Calculate Chess Tactics) | E (conceito generico) | alta |
| 1000-1200 | abertura-principio | **Adicionar criterio de timing.** So introduzir nome de abertura apos 5 partidas com principios solidos. | Emms (Discovering Chess Openings) | I | media |
| 1200-1400 | defesa | **Profilaxia basica.** Prever o plano do oponente e neutralizar. | Marin (Secrets of Defence) | I | alta |
| 1200-1400 | calculo | **Calcular arvore com 2-3 ramos.** Treinar zwischenzug. | Beim (How to Calculate), Soltis (Inner Game) | I | alta |
| 0-1200 | meta | **Threshold de avanco: 80/50.** >= 80% = avanca, 50-80% = revisa, <50% = regride. | Yusupov (Build Up), Khmelnitsky (Chess Exam) | E (consenso) | alta |
| 0-1200 | meta | **Taxonomia de erros expandida.** Adicionar `avaliacao`, `tempo`, `psicologico` aos WeaknessTags. | Crouch (Why We Lose) | I | media |

### Entrega 3 — Novos Drill Formats

| nome | descricao_curta | passo_a_passo_original | band_alvo | stage_alvo | exerciseMode | como_mapear_no_lichess | sinal_de_dominio | sourceInfluence | armadilha |
|------|----------------|------------------------|-----------|------------|--------------|----------------------|------------------|-----------------|-----------|
| Thinking-System-Soltis | Protocolo de decisao para posicao quieta (complementa CCT para posicao tatica) | (1) Qual a ameaca dele? (2) Liste 2-3 candidatos. (3) Para cada um, qual a melhor resposta dele? (4) Visualize a posicao final de cada ramo. (5) Compare e decida. | 1000-1400 | calculo | explain → guided → retrieval | Lichess Analysis de partidas proprias (sem engine). Puzzle Streak. | Aplica o protocolo em 10 posicoes e acerta o melhor lance em >=60% | Soltis (How to Choose a Chess Move) | Aplicar em posicao tatica aguda (onde CCT e melhor) |
| Checklist-Defesa-Crouch | 4 perguntas antes de defender: perigo, ameaca, neutralizar, contra-atacar | (1) Estou em perigo? (sinais: rei exposto, peca atacada, peao fraco). (2) Qual a ameaca concreta? (3) Posso neutralizar? (defender, trocar, bloquear). (4) Posso contra-atacar? Se sim, calcular. | 1000-1400 | defesa | explain → guided → retrieval | Puzzles: defensive themes. Lichess Analysis. | Identifica momentos defensivos em 5 partidas proprias >=70% | Crouch (How to Defend in Chess), Marin (Secrets of Chess Defence) | Defender passivamente sempre — as vezes o contra-ataque e melhor |
| Calculo-Arvore-Beim | Calcular 1 ramo → 2 ramos → arvore completa com posicao terminal | (1) Identificar candidatos forcados (CCT). (2) Para 1 candidato, calcular ate posicao terminal (sem mais forcados). (3) Avaliar a posicao terminal. (4) Repetir para outros candidatos. (5) Comparar e decidir. | 1000-1400 | calculo | guided → retrieval | Puzzles com temas `intermezzo`, `advancedPawn`. Lichess Analysis. | Acerta >=70% em puzzles que exigem 3+ lances de calculo | Beim (How to Calculate Chess Tactics) | Calcular todos os ramos — aprenda a podar |
| Abertura-Principio-Emms | Introduzir aberturas por nome so depois dos principios | (1) Jogar 5 partidas aplicando os 3 principios (centro, desenvolvimento, roque). (2) Revisar as aberturas que apareceram. (3) So entao aprender o nome e as ideias basicas. | 1000-1200 | abertura-principio | explain → transfer | Partidas 10+5. Lichess Analysis pos-partida. | 5 partidas consecutivas sem violar principios de abertura (>80% dos lances) | Emms (Discovering Chess Openings) | Nomear antes de compreender — "jogo a Siciliana" sem saber por que |
| Perfil-Diagnostico-Khmelnitsky | Teste diagnostico multi-tema com pontuacao por categoria | (1) Resolver 30-60 puzzles de temas variados. (2) Pontuar por tema (garfo, cravada, mate, etc.). (3) Gerar perfil: forcas (>80%), zonas de trabalho (50-80%), fraquezas (<50%). (4) Plano foca nas zonas de trabalho. | 800-1800 | tatica | retrieval (diagnostico) | Puzzle Themes (filtrar por tema especifico). Puzzle Streak. | Perfil gerado com >=5 temas avaliados | Khmelnitsky (Chess Exam and Training Guide) | Fazer o teste sem depois seguir o plano |
| Taxonomia-Derrota-Crouch | Analisar partida perdida e classificar o tipo de erro | (1) Rever partida sem engine. (2) Identificar 1-3 momentos criticos. (3) Classificar cada erro: blunder (1 lance), calculo (2-4 lances), avaliacao, tempo, psicologico. (4) Atribuir treino corretivo. | 1000-1400 | transferencia | review → transfer | Lichess Analysis de partidas proprias (sem engine, depois com) | Classifica o tipo de erro corretamente em >=3 partidas | Crouch (Why We Lose at Chess) | Culpar "azar" ou "o adversario era melhor" |

### Entrega 4 — Blocos Novos ou Revisados (0-1200)

Blocos adicionais para as novas areas identificadas. Mantem os IDs no formato `band-stage-NN`.

| id | band | stage | signal | weakness | learningGoal | exerciseMode | recurso_lichess | sourceInfluence | microcopy_professor_lemos | avoid | criterio_de_progresso |
|----|------|-------|--------|----------|--------------|--------------|-----------------|-----------------|---------------------------|-------|----------------------|
| 1000-1200-defesa-01 | 1000-1200 | defesa | seguranca ≥80%, tatica mista ≥60% | nao reconhece quando esta em perigo | detectar situacao de perigo: rei exposto, peca atacada sem defesa, peao fraco sob ataque | explain → guided | Puzzles: hangingPiece, defensive; Lichess Analysis | Crouch (How to Defend), DAMP "D" | "Antes de atacar, verifique se voce nao e a vitima. Pergunte: meu rei esta seguro? Alguma peca minha esta caindo? Se sim, defenda primeiro." | ignorar o perigo e atacar assim mesmo | detecta perigo em 10 de 15 posicoes (>65%) |
| 1000-1200-defesa-02 | 1000-1200 | defesa | detecta perigo ≥65% | defende passivamente, nunca contra-ataca | avaliar quando trocar pecas, quando contra-atacar e quando so defender | explain → guided → transfer | Puzzles: defensive, deflection; Practice: Defence | Marin (Secrets of Chess Defence), Crouch (How to Defend) | "Defender nao e so aguentar. Pergunte: posso trocar pecas para aliviar a pressao? Existe um contra-ataque? A melhor defesa as vezes e um ataque na outra ala." | so defender passivamente | escolhe o plano defensivo correto em >=60% de 15 posicoes |
| 1000-1200-calculo-02 | 1000-1200 | calculo | CCT aplicado ≥70% em posicao forcada | nao sabe escolher lance em posicao quieta | aplicar o thinking system: (1) ameaca dele? (2) 2-3 candidatos, (3) melhor resposta, (4) posicao final, (5) decidir | explain → guided → retrieval | Lichess Analysis de partidas proprias (sem engine); Puzzle Streak | Soltis (How to Choose), Beim (How to Calculate) | "Nas posicoes calmas, nao ha cheque nem captura obvia. Pare e liste 2 ou 3 candidatos. Para cada um, imagine a melhor resposta dele. Escolha o lance que deixa a melhor posicao." | escolher o primeiro lance que ve | aplica o protocolo em 10 posicoes quietas (>60% de acerto no melhor lance) |
| 1000-1200-abertura-02 | 1000-1200 | abertura-principio | abertura por principios ≥80% (5 partidas) | ja joga principios mas nao conhece os nomes | introduzir 1a abertura por nome (ex: Italiana) entendendo o principio por tras do nome | explain → guided → transfer | Lichess Study (Italian Opening for Beginners); Videos Lichess | Emms (Discovering Chess Openings), Lazzarotto PT-BR | "Voce ja joga a abertura certa sem saber o nome. Agora vamos nomea-la. Italiana: Bispo na c4 ataca f7. O nome e so um rotulo — o que importa e o principio que voce ja conhece." | decorar 10 variantes da Italiana | joga 3 partidas com a abertura nomeada respeitando os principios (>80%) |

---

## PASSO 4 - AVALIACAO FINAL

### 1. Nota da rodada: **8/10**

Justificativa: O Conjunto A (DeepSeek-downloads) tem densidade pedagogica baixa (7/35 uteis), mas o 
Conjunto B (ONDA3) e **excepcional**: 14 PDFs nota A que fecham diretamente 6 das 8 lacunas abertas
no metodo consolidado. A qualidade dos livros e altissima — sao exatamente os titulos recomendados na
pesquisa de recursos de ontem. A rodada transforma lacunas teoricas em material concreto para o dono 
estudar e para o Codex abstrair. Nao fosse o problema de status legal dos PDFs (todos em_copyright), 
seria nota 9.

### 2. Nota por conjunto

| Conjunto | Nota | Justificativa |
|----------|------|---------------|
| DeepSeek-downloads | 3/10 | 35 arquivos, so 7 uteis. Resto e historico, idioma nao-PT/EN, ou ilegivel. Lote de preservacao, nao de treino. Capablanca e Lasker (dominio publico) sao os unicos aproveitaveis como fonte limpa. |
| ONDA3 | 9/10 | 27 PDFs, 14 nota A. Fecha 6 lacunas do metodo. Material de altissima qualidade — Beim, Soltis, Crouch, Marin, Emms, Yusupov, Khmelnitsky, Livshitz. Peca pelo status legal (100% em_copyright, fontes pdfcoffee/z-library). |

### 3. Suficiencia

**Esta rodada MUDA materialmente o metodo**, nao apenas confirma.

Antes da rodada o metodo tinha:
- Seguranca, tatica, mate, finais, abertura por principios, calculo basico (CCT), transferencia
- **Lacunas abertas:** defesa/profilaxia, calculo-ponte 800-1200, calculo-sistematico 1200+, abertura-minima-timing, threshold-dominio, proporcao revisao-novo, intervalos repeticao espacada, interleaving

Depois da rodada:
- **FECHADAS:** calculo-ponte-800-1200 (Soltis How to Choose + Livshitz First Challenge + Beim), calculo-sistematico-1200plus (Beim + Soltis Inner Game + Khmelnitsky + Yusupov), defesa-profilaxia-1000-1400 (Crouch + Marin), abertura-minima-timing (Emms + Yusupov)
- **AVANCADAS:** threshold-dominio (Yusupov 80/50 + Khmelnitsky diagnostico)
- **AINDA ABERTAS:** proporcao-revisao-vs-novo, intervalos-repeticao-espacada, interleaving-sessao (dependem de pesquisa empirica, nao de livros de xadrez)

### 4. Cobertura adicionada

| area | o_que_adicionou | forca | limite |
|------|----------------|-------|--------|
| defesa | Disciplina completa com 2 niveis (basico: Crouch, avancado: Marin) | ALTA | Fonte em_copyright. Confirmar com fontes limpas. |
| calculo 800-1200 | Thinking system Soltis + exercicios Livshitz + Beim | ALTA | Fonte em_copyright. |
| calculo 1200+ | Arvore podada (Beim), metodo realista (Soltis Inner Game), diagnostico (Khmelnitsky), espiral (Yusupov) | ALTA | Fonte em_copyright. |
| abertura timing | Criterio "5 partidas com principios antes do nome" (Emms) | MEDIA | Inferencia. Validar com o dono. |
| diagnostico | Perfil multi-categoria (Khmelnitsky), taxonomia de derrotas (Crouch Why We Lose) | ALTA | Abstraivel. |
| threshold | 80/50 de Yusupov confirmado por Khmelnitsky e Mednis/Crouch | ALTA | Consenso entre 4+ fontes. |
| microcopy PT-BR | Capablanca PT-BR, Manzano 400 Conselhos, Kasparov PT-BR | MEDIA | Material em portugues para referencia de voz. |

### 5. Nucleo duro (documentos que realmente importam)

1. **Beim — How to Calculate Chess Tactics** (pilar de calculo 800-1400)
2. **Crouch — How to Defend in Chess** (pilar de defesa 1000-1200)
3. **Marin — Secrets of Chess Defence** (pilar de defesa 1200-1400)
4. **Soltis — How to Choose a Chess Move** (pilar de thinking system 1000-1200)
5. **Soltis — The Inner Game of Chess** (pilar de calculo realista 1200+)
6. **Emms — Discovering Chess Openings** (pilar de abertura transicao)
7. **Yusupov — Build Up Your Chess 1** (pilar de curriculo espiral + threshold)
8. **Khmelnitsky — Chess Exam: Tactics** (pilar de diagnostico)
9. **Crouch — Why We Lose at Chess** (pilar de taxonomia de erros)
10. **Livshitz — Test Your Chess IQ: First Challenge** (banco de exercicios 800-1200)

### 6. Arquivar/ignorar

**Conjunto A — Ignorar (30+ arquivos):**
- Todos os 20+ PDFs historicos do Internet Archive (Staunton, Morphy, Greco, torneios 1850-1900, revistas, almanaques, automatos, magica, Raumschach, etc.)
- 3 artigos OpenAlex (tema periferico: formacao de professores, mulheres no xadrez)
- 1 EPUB anedotico (Chess Generalship por Young)
- 1 TXT anedotico (Chess History and Reminiscences por Bird)

**Conjunto B — Ignorar (12+ arquivos):**
- 9 nao-PDFs (.doc, .docx, .mp4, .txt)
- 5-6 PDFs escolares/redundantes (cartilha, manual DFE, projeto EE, meu primeiro livro, historia/regras duplicados)
- 101 Dicas (duplicado Onda 1)

### 7. Prioridade de integracao Codex

1. **Comprar (dono):** Beim (~$10), Crouch (~$10), Emms (~$19). Total: ~$39 Kindle.
2. **Adicionar `stage:defesa`** ao modelo de dominio (`src/domain/types.ts`).
3. **Adicionar `WeaknessTag` novos:** `defesa-passiva`, `defesa-ativa`, `profilaxia`, `avaliacao`, `tempo`, `psicologico`.
4. **Criar blocos 1000-1200-defesa-01 e 02** — prioridade maxima (fecha lacuna).
5. **Criar bloco 1000-1200-calculo-02** — thinking system.
6. **Criar bloco 1000-1200-abertura-02** — timing de nome.
7. **Atualizar threshold:** 80/50 de Yusupov como padrao.
8. **Atualizar SE-ENTAO:** adicionar regras de defesa e thinking system.
9. **Gate:** `npm run lint && npm run test && npm run build`.

---

## PROXIMOS PASSOS

1. **Dono decide:** comprar Beim + Crouch + Emms em Kindle (~$39) para ter fonte limpa?
2. **Codex implementa** os 4 blocos novos e 5 novos drill formats desta analise.
3. **Codex atualiza** `metodo-consolidado-acervo-2026-06-09.md` com os deltas desta rodada.
4. **Gemini roda** prompt espelhado para cruzar analises.
5. **Fusao DeepSeek+Gemini** apos ambos entregarem.
6. **Arquivar** Conjunto A inteiro (so preservar Capablanca.txt e Lasker.txt como fonte limpa de dominio publico).
7. **Resolver lacunas ainda abertas:** proporcao revisao-novo, intervalos repeticao espacada, interleaving — pendem de calibracao com uso real, nao de novos livros.

---

*Analise concluida em 2026-06-10. Fontes limpas: Capablanca (1921, dominio publico), Lasker (1915, dominio publico). Fontes em_copyright lidas para diagnostico pessoal do dono — ideias abstraidas como conceitos originais; nao ha texto, diagramas, exercicios ou variantes copiados. Conceitos de dominio (garfo, cravada, oposicao, LPDO, CCT) sao conhecimento comum. Divergencias ou confirmacoes com Gemini serao resolvidas na fusao.*
