# Analise dos PDFs Baixados + ONDA 3 - CODEX

Data de referencia: 2026-06-10

Pesquisador: Codex

Escopo: downloads em `output/chess-literature-library/files/`, manifesto
`docs/research/chess-literature/manifests/phase1-downloads.jsonl` e PDFs em
`LIVROS XADREZ PARA CONSULTA/onda 3 livros xadrez/`.

Convencoes: **(E)** evidencia observada no corpus ou no manifesto; **(I)** inferencia pedagogica;
**(P)** proposta de produto, sujeita a decisao do dono.

Regra clean-room: este relatorio nao reproduz exercicios, diagramas, FEN/PGN, variantes nem trechos
longos dos livros. O acervo pode influenciar principios, sequencia, metadados e formatos abstratos; a
execucao do treino continua em recursos licitos do Lichess e em texto original do app.

## Escopo tecnico da leitura

| item | achado | impacto |
|---|---:|---|
| Total de arquivos considerados | 75 | (E) Soma de downloads + ONDA 3. |
| DeepSeek-downloads | 39 arquivos: 31 PDF, 6 TXT, 2 EPUB | (E) Conjunto majoritariamente livre/manifestado. |
| ONDA 3 | 36 arquivos: 30 PDF, 3 DOCX, 1 DOC, 1 MP4, 1 TXT | (E) Foco desta analise: os 30 PDFs. |
| PDFs no total | 61 | (E) Base principal da rodada. |
| PDF corrompido/ilegivel por `pypdf` | 1 | (E) `pdfcoffee.com_livshitz-a-test-your-chess-iq...` nao abriu como PDF valido. |
| OCR/texto fraco | varios | (E) Alguns PDFs tinham 0 ou poucos caracteres nos primeiros blocos. Sem `pdftotext`/`tesseract` disponiveis, marquei como `parcialmente_lido`. |

Leitura tecnica: usei `pypdf` para paginas, metadata e extracao curta dos primeiros blocos. Quando o
PDF era scan/OCR fraco, usei nome do arquivo, metadata e comparacao com analises anteriores, sem
atribuir certeza alta ao conteudo interno. Isso e importante: a rodada e boa para **delta pedagogico**,
mas nao para afirmar que todos os arquivos foram lidos integralmente pagina a pagina.

## Passo 1 - Inventario e triagem

### Resumo por conjunto

| conjunto | formatos | leitura | valor pedagogico | status legal pratico |
|---|---|---|---|---|
| DeepSeek-downloads | 31 PDF + 6 TXT + 2 EPUB | misto; varios textos antigos e papers legiveis | medio: muito historico, alguns papers uteis, alguns problemas/finais | melhor conjunto clean-room; ainda ha itens `verificar` no manifesto |
| ONDA 3 | 30 PDF + nao-PDFs | misto; alguns scans/OCR fraco | alto para defesa, calculo, abertura por principios e PT-BR | sensivel: muitos nomes indicam PdfCoffee, Z-Library, epdf ou copyright ativo |

### Inventario dos PDFs

| conjunto | arquivo | status_leitura | status_legal_provavel | prioridade | motivo |
|---|---|---|---|---|---|
| DeepSeek-downloads | `1990Ajedrez-Ajedrez.pdf` | parcialmente_lido | verificar | C | Manual escolar/introdutorio; util para didatica, pouco diferencial. |
| DeepSeek-downloads | `2006700...700-Chess-Problems...pdf` | parcialmente_lido | dominio_publico | B | Banco historico de problemas; absorver formato, nao posicoes. |
| DeepSeek-downloads | `20200309...estrategии.pdf` | parcialmente_lido | verificar | C | Estrategia em russo; OCR fraco e utilidade baixa para fase atual. |
| DeepSeek-downloads | `bub_gb_5ZAC...Chess-studies...Kling-and-Horwitz...pdf` | parcialmente_lido | dominio_publico | B | Finais historicos; bom para conceito de final-estudo, nao para copiar estudos. |
| DeepSeek-downloads | `bub_gb_65ca...aperture...pdf` | parcialmente_lido | dominio_publico | C | Aberturas historicas; baixo valor para app 0-1200. |
| DeepSeek-downloads | `bub_gb__SU...chess-tournament...pdf` | parcialmente_lido | dominio_publico | C | Partidas historicas; util so como cultura/PGN licito. |
| DeepSeek-downloads | `bub_gb_DfA...first-American-chess-congress.pdf` | parcialmente_lido | dominio_publico | C | Historico/torneio; pouco valor metodologico direto. |
| DeepSeek-downloads | `bub_gb_DrU...Old-and-the-new-magic.pdf` | parcialmente_lido | verificar | D | Fora do escopo enxadristico pratico. |
| DeepSeek-downloads | `bub_gb_fcs...Handbuch...pdf` | parcialmente_lido | dominio_publico | C | Manual antigo; valor historico. |
| DeepSeek-downloads | `bub_gb_fd8...chess-players-handbook...pdf` | lido_parcial | dominio_publico | B | Manual classico; bom para sequencia historica, pesado para iniciante moderno. |
| DeepSeek-downloads | `bub_gb_l5m...Studies-of-chess...Caissa...pdf` | parcialmente_lido | dominio_publico | D | Mais literario/historico que treino. |
| DeepSeek-downloads | `bub_gb_N7k...automaton...pdf` | parcialmente_lido | dominio_publico | D | Curiosidade historica; nao entra no metodo. |
| DeepSeek-downloads | `bub_gb_njZ...Tschaturangavidja...pdf` | parcialmente_lido | dominio_publico | D | Bibliografia/historia; sem utilidade direta. |
| DeepSeek-downloads | `bub_gb_ohI...Schach-almanach.pdf` | parcialmente_lido | dominio_publico | D | Almanaque historico. |
| DeepSeek-downloads | `bub_gb_oyU...Chess-players-magazine.pdf` | parcialmente_lido | dominio_publico | C | Periodico historico; pode fornecer partidas, nao metodo. |
| DeepSeek-downloads | `bub_gb_TlR...Lehrbuch-des-Schachspiels.pdf` | parcialmente_lido | dominio_publico | C | Manual antigo em alemao; confirmatorio. |
| DeepSeek-downloads | `bub_gb_UBR...La-Regence...pdf` | parcialmente_lido | dominio_publico | D | Revista historica; baixo valor para P0/P1. |
| DeepSeek-downloads | `bub_gb_yCU...Morphys-games...pdf` | parcialmente_lido | dominio_publico | C | Partidas de Morphy; melhor como Study licito futuro. |
| DeepSeek-downloads | `CharlesDorlansJoueurDchecs...pdf` | lido_parcial | verificar | D | Historico/literario; fora do metodo. |
| DeepSeek-downloads | `chess-endgames-Chess-Endgames.pdf` | lido_parcial | open_access/verificar | D | Nao e xadrez padrao; trata variante/tema fora do escopo. |
| DeepSeek-downloads | `coas...Modern-Chess-Instruction-in-School...pdf` | lido_parcial | open_access | A | Paper moderno sobre instrucao; util para pedagogia, nao conteudo de treino. |
| DeepSeek-downloads | `Larobok-i-schack-for-nyborjare.pdf` | parcialmente_lido | dominio_publico/verificar | C | Manual iniciante sueco; confirmatorio. |
| DeepSeek-downloads | `ljs495...arabic...pdf` | ilegivel_scan | verificar | D | Sem texto extraivel; fora do escopo atual. |
| DeepSeek-downloads | `mandragorias...Thomas-Hyde-1694.pdf` | ilegivel_scan | dominio_publico/verificar | D | Historia antiga; nao vira metodo. |
| DeepSeek-downloads | `o-perfeito-jogador...pdf` | parcialmente_lido | verificar | B | Material antigo em portugues; potencial PT-BR/lusofono, precisa revisao legal. |
| DeepSeek-downloads | `space-chess...pdf` | ilegivel_scan | verificar | D | Variante space chess; fora do app. |
| DeepSeek-downloads | `TavernerChessProblemsMadeEasy...pdf` | parcialmente_lido | dominio_publico | B | Problemas historicos; formato de dificuldade graduada. |
| DeepSeek-downloads | `TheRoyallGameOfChessePlay...pdf` | parcialmente_lido | dominio_publico | C | Greco/historico; util so como cultura/partidas licitas. |
| DeepSeek-downloads | `W4214640735...teacher-competence...pdf` | lido_parcial | cc/open_access | A | Paper de competencia docente; bom para Professor Lemos como tutor. |
| DeepSeek-downloads | `W4313225181...women-in-chess...pdf` | lido_parcial | cc/open_access | B | Talento/desenvolvimento e viés; util para cuidado de linguagem e inclusao. |
| DeepSeek-downloads | `W4405860398...interactive-teaching-strategies...pdf` | lido_parcial | cc/open_access | A | Paper moderno de estrategias interativas; reforca explain/guided/retrieval. |
| ONDA3 | `1. meu_primeiro_livro_de_xadrez.pdf` | lido_parcial | verificar | A | PT-BR, fundamentos, didatica simples; bom para voz adulta adaptada. |
| ONDA3 | `101 Dicas de Importantes Xadrez.pdf` | parcialmente_lido | verificar | C | Dicas soltas; usar so como inspiracao fraca. |
| ONDA3 | `2. Manual_de_Xadrez_DFE_2018.pdf` | lido_parcial | verificar | A | Manual escolar PT-BR; forte para sequencia de fundamentos e microcopy. |
| ONDA3 | `Aberturas de Xadrez Para Leigos - James Eade.pdf` | lido_parcial | em_copyright/verificar | B | Aberturas em PT-BR; util como referencia pessoal, nao fonte limpa. |
| ONDA3 | `Antonio Lopez Manzano...400 Conselhos...pdf` | parcialmente_lido | em_copyright/verificar | B | Conselhos praticos; pode ajudar micro-regras, risco de lista protegida. |
| ONDA3 | `Aprenda Xadrez com Gary Gasparov.pdf` | lido_parcial | em_copyright/verificar | B | Introducao por campeao; confirmatorio de fundamentos/tatica. |
| ONDA3 | `capablanca - licoes.elementares de xadrez.pdf` | ilegivel_scan | verificar | B | Capablanca em PT; valor provavel alto, leitura tecnica baixa. |
| ONDA3 | `cartilhaXadrez.pdf` | lido_parcial | verificar | C | Cartilha curta; boa para linguagem, pouca novidade. |
| ONDA3 | `Curso de xadrez.pdf` | lido_parcial | verificar | C | Curso introdutorio generico. |
| ONDA3 | `Duelos de Xadrez...Yasser Seirawan.pdf` | lido_parcial | em_copyright | B | Partidas comentadas; bom formato de transferencia, comentario protegido. |
| ONDA3 | `epdf.pub_secrets-of-chess-defence.pdf` | lido_parcial | em_copyright | A | Defesa; fecha parcialmente lacuna conceitual, nao limpo para produto. |
| ONDA3 | `Gigantes do Xadrez Agressivo...Neil McDonald.pdf` | lido_parcial | em_copyright | B | Ataque/partidas-modelo; util acima de 1200. |
| ONDA3 | `Historia do Xadrez - Regras do Xadrez.pdf` | lido_parcial | verificar | D | Curto e redundante. |
| ONDA3 | `How to Defend in Chess...Colin Crouch...pdf` | parcialmente_lido | em_copyright | A | Defesa pratica; grande valor para lacuna 1000-1400, uso pessoal apenas. |
| ONDA3 | `O XADREZ NOS CONTEXTOS...ASPECTOS PSICOLOGICOS...pdf` | lido_parcial | verificar | B | Pedagogia/psicologia em portugues; util para tom e contexto educativo. |
| ONDA3 | `pdfcoffee...how-to-choose-a-chess-move...pdf` | parcialmente_lido | em_copyright | A | Decisao/candidatos; forte para calculo-ponte, OCR fraco. |
| ONDA3 | `pdfcoffee...build-up-your-chess-1...pdf` | parcialmente_lido | em_copyright | B | Curriculo graduado; ja conhecido por Onda 1/2. |
| ONDA3 | `pdfcoffee...why-we-lose-at-chess...pdf` | parcialmente_lido | em_copyright | A | Erros reais e diagnostico; excelente para transferencia/anti-blunder. |
| ONDA3 | `pdfcoffee...attacking-technique...pdf` | parcialmente_lido | em_copyright | B | Ataque; mais util acima de 1200. |
| ONDA3 | `pdfcoffee...discovering-chess-openings...pdf` | lido_parcial | em_copyright | A | Aberturas por principios; bom antidoto contra decoreba. |
| ONDA3 | `pdfcoffee...rateyourendgame...pdf` | parcialmente_lido | em_copyright | B | Autoavaliacao de finais; bom formato, nao fonte limpa. |
| ONDA3 | `pdfcoffee...how-to-calculate-chess-tactics...pdf` | parcialmente_lido | em_copyright | A | Processo de calculo tatico; ajuda calculo-ponte e 1200+. |
| ONDA3 | `pdfcoffee...chess-exam-and-training-guide-tactics...pdf` | parcialmente_lido | em_copyright | B | Diagnostico por areas; formato util, banco protegido. |
| ONDA3 | `pdfcoffee...test-your-chess-iq...pdf` | ilegivel | em_copyright/verificar | D | PDF corrompido; nao entra. |
| ONDA3 | `Pecas de Xadrez - Regras do Xadrez.pdf` | lido_parcial | verificar | D | Curto e redundante. |
| ONDA3 | `Projeto xadrez na EE sene (1).pdf` | lido_parcial | verificar | C | Projeto escolar; util apenas como contexto didatico. |
| ONDA3 | `the-inner-game-of-chess...pdf` | parcialmente_lido | em_copyright | A | Calculo e decisao; forte para pensamento candidato/resposta. |
| ONDA3 | `Xadrez Para Leigos - pdf.pdf` | parcialmente_lido | em_copyright/verificar | B | Fundamentos PT-BR; redundante com Eade/Seirawan. |
| ONDA3 | `Xadrez_Vitorioso_-_Estrategias...pdf` | parcialmente_lido | em_copyright | B | Estrategia em PT-BR; util depois de seguranca/tatica. |
| ONDA3 | `Xadrez_Vitorioso_-_Taticas...pdf` | lido_parcial | em_copyright | A | Tatica PT-BR; bom para microcopy, Lichess substitui exercicios. |

### Inventario secundario de nao-PDF

| conjunto | arquivo | formato | decisao |
|---|---|---|---|
| DeepSeek-downloads | `33870-chess-fundamentals.txt` | TXT | A: Capablanca limpo/PD; reforca final-first. |
| DeepSeek-downloads | `chessstrategy05614gut...txt` | TXT | A/B: Edward Lasker; estrategia classica limpa. |
| DeepSeek-downloads | `chessandcheckers04913gut...txt` | TXT | B: fundamentos historicos. |
| DeepSeek-downloads | `thebluebookofche16377gut...txt` | TXT | C: abertura/fundamentos antigos; pesado. |
| DeepSeek-downloads | `chesshistoryandr04902gut...txt` | TXT | D: historia. |
| DeepSeek-downloads | `falken...manual...txt` | TXT | D: manual de software. |
| DeepSeek-downloads | `chessgeneralship...epub` | EPUB | C: estrategia historica; verificar uso. |
| DeepSeek-downloads | `theexploitsandtriumphs...Morphy...epub` | EPUB | C: historia/partidas. |
| ONDA3 | `Aberturas de Xadrez para Leigos.doc` | DOC | duplicado provavel do PDF; nao analisado. |
| ONDA3 | `Como Jogar Xadrez...mp4` | MP4 | fora desta rodada. |
| ONDA3 | `Eletiva-Lions-Clube-Xadrez.docx` | DOCX | inventario escolar; nao analisado. |
| ONDA3 | `Jogos de Xadrez.docx` | DOCX | inventario escolar; nao analisado. |
| ONDA3 | `Videos de Xadrez para assistir no Youtube.docx` | DOCX | lista de links; nao analisada. |
| ONDA3 | `Xadrez para celular.txt` | TXT | irrelevante/curto. |

## Passo 2 - Fichas pedagogicas

### Fichas nucleares

| ficha | documento/grupo | filosofia, sequencia, exercicio e feedback | absorver | descartar/risco | encaixe |
|---|---|---|---|---|---|
| F01 | Papers open access de ensino (`Modern Chess Instruction`, `Interactive Teaching`, `Teacher Competence`) | (E) Ensino de xadrez como intervencao estruturada: objetivo claro, interacao, professor/tutor como mediador, nao so lista de problemas. | (P) Reforcar `explain -> guided -> retrieval`, com pergunta curta antes de abrir o Lichess. | Nao prometer transferencia escolar/cognitiva; os estudos nao validam rating. | todos; `explain/guided/review`; confianca alta. |
| F02 | Capablanca/Edward Lasker/Staunton limpos | (E) Tradicao classica: fundamentos, finais, principios e partidas antes de abertura decorada. | (P) Manter final-first e abertura por principios. | Linguagem e analise antigas; usar so estrutura. | `0-600 fundamento`, `1000-1200 final`; confianca alta. |
| F03 | Problemas historicos Baird/Taverner/Kling-Horwitz | (E) Mostram graduacao por problemas e finais-estudo. | (P) Inspirar dificuldade progressiva e revisao por tema. | Nao copiar problemas/diagramas; Lichess Puzzle DB e melhor fonte limpa. | `tatica/final/review`; confianca media. |
| F04 | Manuais escolares/PT-BR da ONDA 3 (`Meu Primeiro Livro`, `Manual DFE`, cartilhas, projetos escolares) | (E) Sequencia brasileira simples: regras, pecas, tabuleiro, mates, valor, primeiros principios. | (P) Ajustar microcopy do Professor Lemos para PT-BR natural e adulto. | Tom infantil/escolar; status legal de PDFs deve ser verificado. | `0-600 fundamento`, `explain/guided`; confianca media-alta. |
| F05 | Defesa: Marin, Crouch `How to Defend`, Crouch `Why We Lose`, Avni ja analisado | (E/I) A ONDA 3 melhora a lacuna de defesa: ameaca adversaria, defesa ativa, erro recorrente, resistencia em posicoes ruins. | (P) Criar modulo `defesa-ativa`: ameaca dele -> defesa que resolve -> defesa que cria recurso. | PDFs parecem em copyright/uploads nao oficiais; nao copiar exemplos ou comentarios. | `1000-1400 defesa/profilaxia`, `guided/review`; confianca pedagogica alta, legal baixa. |
| F06 | Calculo/decisao: Soltis `How to Choose`, `Inner Game`, Beim, Khmelnitsky | (E/I) Fortalecem escolha de lance e calculo como processo: candidatos, forcantes, resposta adversaria, diagnostico de erro. | (P) Melhorar `calculo-ponte-800-1200` com candidato curto + resposta adversaria + justificativa. | OCR fraco em varios; fontes em copyright. Confirmar por fontes limpas e escrever do zero. | `800-1400 tatica/calculo`, `guided/retrieval/review`; confianca alta. |
| F07 | Aberturas por principios: Emms `Discovering`, Eade/Leigos, `Aberturas...`, FCO ja analisado | (E/I) Melhor ponte para abertura minima: descobrir ideias antes de memorizar linhas. | (P) Adicionar bloco de "abertura como intencao": centro, desenvolvimento, rei, estrutura e proximo plano. | Nao importar repertorio, linhas ou listas. | `1000-1200 abertura-principio`, `explain/transfer`; confianca alta. |
| F08 | Seirawan PT-BR (`Xadrez Vitorioso` taticas/estrategias, `Duelos`) | (E/I) Forte em linguagem acessivel, padroes e partidas-modelo. | (P) Usar como influencia de tom e de progressao explicativa, sempre com exemplos Lichess/licitos. | Comentarios e exercicios protegidos; nao copiar microcopy. | `600-1200 tatica`, `1000+ transferencia`; confianca media-alta. |
| F09 | Finais: `Rate Your Endgame`, Kling-Horwitz, Capablanca, pratica ja consolidada | (I) A rodada melhora formato de autoavaliacao de finais, nao a lista limpa de posicoes. | (P) Drill `final-checklist`: material, rei ativo, peao passado, tecnica conhecida. | Rate Your Endgame em copyright; final-estudos historicos nao devem ser banco bruto. | `1000-1400 final`, `guided/review`; confianca media. |
| F10 | Ataque: Crouch `Attacking Technique`, McDonald `Gigantes`, Seirawan partidas | (I) Bom para fase futura: ataque por pre-condicoes, nao por impulso. | (P) Guardar para 1200+: so atacar quando desenvolvimento, rei adversario e linhas abertas justificarem. | Muito cedo para dono atual; legal sensivel. | `1200+ ataque/plano`, `review/transfer`; confianca media. |
| F11 | `O Xadrez nos Contextos...` e materiais escolares | (E/I) Reforcam que ensino e contexto importam: lazer, escola, psicologia, didatica. | (P) Usar para tom: adulto, pratico, sem promessa de inteligencia/nota escolar. | Nao transformar em argumento de marketing. | transversal; confianca media. |
| F12 | Itens historicos/curiosidades/variantes | (E) Grande volume em DeepSeek-downloads nao tem valor para P0/P1. | (P) Arquivar como biblioteca, nao integrar. | Risco de ruido e perda de foco. | nenhum; confianca alta. |

### Fichas coletivas de redundancia

| grupo | exemplos | diagnostico | decisao |
|---|---|---|---|
| Introducoes repetidas | `Xadrez Para Leigos`, `Aberturas...Leigos`, cartilhas, curso, pecas/regras | Repetem regras, valor das pecas e principios. | Absorver linguagem PT-BR; nao criar mais blocos basicos redundantes. |
| Bancos de exercicios/problemas | Baird, Taverner, Khmelnitsky, Livshitz corrompido | Bons como ideia de diagnostico e graduacao. | Lichess Puzzle DB substitui banco; nao copiar posicoes. |
| Partidas comentadas | Morphy, Seirawan, McDonald, torneios antigos | Boas para transferencia. | Usar PGNs/Studies licitos e comentario proprio. |
| Aberturas | Emms/Eade/Leigos/Dubois | Reforcam principios, mas podem puxar decoreba. | Uma abertura por principios; repertorio so por sinal real. |
| Historia/literatura/variantes | Old Magic, Automaton, Caissa, Space Chess, Bidding Chess | Baixo valor instrucional. | Arquivar. |

## Passo 3 - Sintese delta para o metodo

### Entrega 1 - Novos aportes por tradicao

| tradicao | documentos | o_que_adiciona | ideia_absorvivel | risco_clean_room | confianca |
|---|---|---|---|---|---|
| Defesa pratica | Marin, Colin Crouch, `Why We Lose`, Avni ja consolidado | Fecha parcialmente a lacuna de defesa/profilaxia 1000-1400. | Defender e tarefa ativa: reconhecer ameaca, escolher defesa, procurar recurso. | Alto: fontes ONDA 3 em copyright. | alta pedagogica / baixa legal |
| Calculo e escolha de lance | Soltis, Beim, Khmelnitsky, `Inner Game` | Melhora `calculo-ponte-800-1200`. | Dois candidatos + melhor resposta adversaria antes de escolher. | Alto: PDFs sensiveis; usar abstracao original. | alta pedagogica |
| Abertura por principios | Emms, Eade, manuais PT-BR | Melhora timing de abertura sem repertorio cedo. | Abertura = intencao para o meio-jogo, nao arvore de lances. | Medio/alto: nao copiar linhas. | alta |
| Pedagogia interativa limpa | Papers open access | Da suporte externo limpo a explain/guided/retrieval. | Cada bloco precisa de objetivo, interacao e criterio de conclusao. | Baixo. | alta |
| Fundamentos PT-BR | Meu Primeiro Livro, Manual DFE, cartilhas | Melhora microcopy de iniciante. | Linguagem brasileira simples, mas adulta. | Medio: verificar status. | media-alta |
| Final e autoavaliacao | Rate Your Endgame, Kling-Horwitz, Capablanca | Adiciona formato de checklist de final. | Avaliar final por rei ativo, peao passado, tecnica e plano. | Alto para livro moderno; baixo para fontes antigas. | media |
| Partida-modelo | Morphy, Seirawan, McDonald, torneios antigos | Reforca transferencia e momento critico. | Uma partida-modelo deve virar pergunta, nao leitura passiva. | Medio/alto. | media |

### Entrega 2 - Ajustes na escada

| band | stage | mudanca_proposta | documento_que_motiva | tipo(E/I/P) | confianca |
|---|---|---|---|---|---|
| 0-600 | fundamento | Revisar microcopy de regras e valor material com PT-BR mais natural. | `Meu Primeiro Livro`, `Manual DFE` | I/P | media |
| 600-1000 | seguranca | Separar mais explicitamente "peca solta" de "ameaca dele". | Crouch/Why We Lose + Heisman anterior | I/P | alta |
| 800-1200 | calculo | Criar ponte curta de escolha de lance: 2 candidatos, resposta adversaria, justificativa. | Soltis, Beim, `Inner Game` | E/I/P | alta |
| 1000-1200 | abertura-principio | Abrir bloco de abertura por intencao: centro, desenvolvimento, roque, estrutura, plano. | Emms, Eade | E/I/P | alta |
| 1000-1400 | defesa | Introduzir `defesa-ativa-01`: "o que ele ameaca?" antes de qualquer ataque. | Marin, Crouch | E/I/P | alta pedagogica |
| 1000-1400 | final | Adicionar autoavaliacao de final antes de treinar no Lichess. | Rate Your Endgame, Capablanca, Kling-Horwitz | I/P | media |
| 1200+ | ataque/plano | Guardar ataque sistematico para depois de seguranca/tatica estavel. | McDonald, Crouch attacking | I/P | media |

### Entrega 3 - Novos drill formats

| nome | descricao_curta | passo_a_passo_original | band_alvo | stage_alvo | exerciseMode | como_mapear_no_lichess | sinal_de_dominio | sourceInfluence | armadilha |
|---|---|---|---|---|---|---|---|---|---|
| `defesa-ativa-3-perguntas` | Defesa como escolha ativa, nao passividade. | 1. Nomear ameaca dele. 2. Achar defesa que resolve. 3. Procurar defesa que tambem cria recurso. | 1000-1400 | defesa/profilaxia | guided->review | `defensiveMove`, Analysis pos-partida, Study privado | Nomeia ameaca adversaria em 3 partidas revisadas. | Marin/Crouch | Virar paranoia defensiva e parar de atacar quando deve. |
| `calculo-ponte-2-candidatos` | Ponte entre puzzle curto e calculo real. | 1. Listar 2 candidatos. 2. Para cada um, dar a melhor resposta dele. 3. Escolher e justificar. | 800-1200 | tatica/calculo | guided->retrieval | Puzzle Streak lento, Analysis sem engine | Menos blunders por resposta adversaria obvia. | Soltis/Beim | Exigir arvore profunda cedo demais. |
| `por-que-perdi` | Revisao de derrota por categoria. | 1. Abrir partida terminada. 2. Achar momento critico. 3. Classificar: tatico, defesa, final, abertura, tempo. 4. Gerar proximo treino. | 800-1400 | transferencia | review->transfer | Lichess Analysis so apos partida | 3 derrotas com erro nomeado e treino derivado. | Crouch/Heisman | Culpar engine/adversario. |
| `abertura-intencao` | Abertura por plano minimo. | 1. Centro. 2. Pecas menores. 3. Rei seguro. 4. Estrutura/peoes. 5. Plano de meio-jogo em 1 frase. | 1000-1200 | abertura-principio | explain->transfer | Study/video + partida 10+5 | 10 partidas sem violacao grave de principio. | Emms/Eade | Decorar variante. |
| `final-autoavaliacao` | Checklist antes do treino de final. | 1. Rei ativo? 2. Peao passado? 3. Torre atras? 4. Tecnica conhecida? 5. Plano curto. | 1000-1400 | final | guided->review | Practice Pawn/Rook Endgames + Analysis | Explica plano do final antes de mover. | Rate Your Endgame/Capablanca | Substituir pratica por checklist. |
| `paper-tutor-interativo` | Uma micro-aula com pergunta obrigatoria. | 1. Explicar uma ideia. 2. Perguntar. 3. Fazer o aluno prever. 4. Abrir recurso Lichess. 5. Registrar resultado. | todos | transversal | explain->guided | App local + Lichess | Menos blocos sem criterio. | Papers open access | Aula longa demais. |

### Entrega 4 - Blocos novos ou revisados (0->1200)

| id | band | stage | signal | weakness | learningGoal | exerciseMode | recurso_lichess | sourceInfluence | microcopy_professor_lemos | avoid | criterio_de_progresso |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `0-600-fundamento-05` | 0-600 | fundamento | onboarding mostra duvida em regras/valor | fundamentos estao soltos | explicar regra, valor e objetivo da peca em linguagem propria | explain->guided | Lichess Learn + Coordinates | Meu Primeiro Livro, Manual DFE | "Hoje e mapa e seguranca. Peca que voce entende, voce nao entrega de graca." | Infantilizar ou virar cartilha escolar. | Explica movimento/valor das pecas e completa treino basico. |
| `800-1200-calculo-02` | 800-1200 | tatica/calculo | puzzles errados por resposta adversaria ignorada | calculo unilateral | escolher lance depois de 2 candidatos e resposta dele | guided->retrieval | Puzzle Streak lento ou Analysis sem engine | Soltis, Beim, Inner Game | "Seu lance nao joga sozinho. Antes de decidir, de ao adversario a melhor resposta." | Arvore de calculo grande demais. | 10 posicoes com candidato, resposta e justificativa curta. |
| `1000-1200-defesa-01` | 1000-1200 | defesa | perde apos ataque adversario simples | nao pergunta o que ele ameaca | reconhecer ameaca adversaria e escolher defesa ativa | explain->guided->review | `https://lichess.org/training/defensiveMove` + Analysis pos-partida | Marin, Crouch | "Antes do seu plano, o plano dele. Se voce nao sabe o que ele ameaca, voce esta jogando no escuro." | Defesa passiva ou medo de jogar. | Nomeia ameaca adversaria em 3 revisoes. |
| `1000-1200-abertura-03` | 1000-1200 | abertura-principio | sai da abertura sem plano | decora lance sem saber ideia | transformar abertura em plano de meio-jogo | explain->transfer | Study/video de principios + partida 10+5 | Emms, Eade | "Abertura boa deixa suas pecas prontas para uma historia simples: centro, rei seguro e um alvo." | Explorer solto/variante longa. | 10 partidas sem dama cedo/rei no centro/peca repetida sem motivo. |
| `1000-1200-final-03` | 1000-1200 | final | final basico vira chute | nao avalia posicao de final | usar checklist de rei ativo, peao passado e tecnica | guided->review | Practice Pawn/Rook Endgames | Capablanca, Rate Your Endgame | "No final, o plano cabe em poucas palavras. Rei ativo, peao que corre, torre trabalhando." | Checklist sem praticar. | Explica plano antes de mover em 5 finais. |
| `800-1200-transferencia-03` | 800-1200 | transferencia | repete erro em derrotas | nao transforma derrota em treino | classificar a derrota e gerar um bloco de reparo | review->transfer | Lichess Analysis de partida terminada | Crouch, Heisman, papers de ensino | "Perder sem revisar e pagar a aula e sair antes da explicacao. Uma derrota, uma causa, um treino." | Ligar engine antes de pensar. | 3 derrotas com erro nomeado e proximo treino coerente. |

### Entrega 5 - Lacunas, redundancias e riscos

| tema | decisao Codex |
|---|---|
| Lacuna `defesa-profilaxia-1000-1400` | Parcialmente melhorada pela ONDA 3, especialmente Marin/Crouch. Ainda precisa fonte limpa ou modulo proprio original. |
| Lacuna `calculo-ponte-800-1200` | Melhorada de verdade: Soltis/Beim/Inner Game apontam processo de escolha de lance. Implementar como drill curto, nao como teoria longa. |
| Lacuna `abertura-minima-timing` | Melhorada: Emms/Eade reforcam abertura por principios e plano. Mantem regra: nada de repertorio antes de seguranca/tatica estavel. |
| Lacuna `threshold-dominio` | Nao muda. Continua sendo telemetria local + criterios provisiorios. |
| Lacuna `proporcao-revisao-vs-novo` | Nao muda substancialmente alem do que Leitao/spacing ja deram. |
| Redundancia | Alta em introducoes, regras, historicos e partidas comentadas. O valor real esta em defesa/calculo/abertura. |
| Risco legal | Alto na ONDA 3. Nomes PdfCoffee/Z-Library/epdf indicam que nada disso deve virar fonte direta do produto. |
| Risco pedagogico | Abrir muita frente: defesa, calculo, abertura e finais ao mesmo tempo. Integrar por sinais locais, nao por entusiasmo de acervo. |

## Passo 4 - Avaliacao final

### Nota da rodada

**7.4/10** como aporte ao metodo.

Justificativa: a rodada tem deltas importantes em defesa, calculo e abertura por principios, que eram
lacunas reais. Mas a nota nao sobe mais porque a maior parte da ONDA 3 tem status legal sensivel e
varios PDFs tem OCR fraco. Como acervo pessoal, e forte; como base limpa de produto, exige abstracao e
confirmacao por fontes oficiais/livres.

### Nota por conjunto

| conjunto | nota | motivo |
|---|---:|---|
| DeepSeek-downloads | 6.6/10 | Limpo e auditavel, com alguns papers bons, Capablanca/Lasker e problemas historicos; muito ruido historico/fora de escopo. |
| ONDA 3 | 8.0/10 pessoal; 5.5/10 produto | Muito forte em defesa/calculo/abertura/PT-BR, mas legalmente sensivel. |

### Cobertura adicionada

| area | o_que_adicionou | forca | limite |
|---|---|---|---|
| Defesa | Defesa ativa e revisao de perdas reais. | alta | fontes sensiveis; precisa modulo proprio. |
| Calculo | Escolha de lance e ponte curta 800-1200. | alta | OCR fraco e copyright; nao copiar exemplos. |
| Abertura | Principios como intencao e plano. | alta | risco de virar repertorio cedo. |
| Fundamentos PT-BR | Tom simples e local. | media | redundancia e tom escolar. |
| Finais | Autoavaliacao de final. | media | fonte moderna sensivel; fontes antigas nao bastam para app moderno. |
| Pedagogia limpa | Papers open access sobre ensino interativo. | media-alta | nao provar rating ou transferencia escolar. |

### Nucleo duro

| prioridade | documentos | uso recomendado |
|---|---|---|
| A limpo | `33870-chess-fundamentals.txt`, `chessstrategy...txt`, papers open access | Confirmar estrutura pedagogica e final-first. |
| A pessoal, nao direto | Marin/Crouch/Soltis/Beim/Emms/Seirawan PT-BR | Inspirar modulos originais de defesa, calculo e abertura. |
| B util | Baird/Taverner/Kling-Horwitz, Manual DFE, Meu Primeiro Livro | Formato, linguagem e graduacao. |
| C/D arquivar | Historia, magia, variantes, revistas historicas, scans sem texto, docs nao-PDF escolares | Biblioteca/contexto, nao integracao. |

### Arquivar/ignorar

- Variantes fora do xadrez padrao (`space chess`, `bidding chess`).
- Historia/literatura sem formato de treino.
- Manuais de regras muito curtos e redundantes.
- PDF corrompido `Test Your Chess IQ`.
- Listas de dicas que nao trazem processo verificavel.

### Prioridade de integracao Codex

1. Criar/atualizar no metodo um bloco `1000-1200-defesa-01` com defesa ativa, sem copiar exemplos de Marin/Crouch.
2. Atualizar `calculo-ponte-800-1200` com drill `calculo-ponte-2-candidatos`.
3. Atualizar abertura minima com `abertura-intencao`, sem repertorio nem explorer solto.
4. Marcar ONDA 3 como **uso pessoal / nao fonte limpa direta** em memoria do projeto.
5. Se for implementar, escrever testes garantindo: sem rating como gate, sem conteudo protegido, sem live-game assistance, sem Board API.

## Veredito

A ONDA 3 muda materialmente o metodo **no detalhe operacional**, nao na espinha. A espinha continua:
seguranca -> tatica curta -> finais/abertura por principios -> calculo/transferencia. O delta real e
que agora ha material pessoal forte para desenhar tres pontes que estavam fracas:

1. defesa/profilaxia simples;
2. calculo de escolha de lance para 800-1200;
3. abertura como plano, nao repertorio.

Mas a integracao precisa ser clean-room: usar Lichess, fontes abertas e texto original do Professor
Lemos; os PDFs sensiveis ficam como leitura pessoal e influencia abstrata.

