# Analise dos PDFs Baixados + ONDA 3 - GEMINI

Este relatório consolida a análise pedagógica delta do lote de downloads (Conjunto A) e dos livros da Onda 3 (Conjunto B) para o projeto `lichess-tutor`. A análise visa enriquecer a escada curricular, aprimorar os blocos de treino (até 1200) e os formatos de exercícios (*drills*) do aplicativo pessoal do usuário.

---

## 1. Inventário e Triagem

A tabela abaixo lista todos os 67 arquivos encontrados nos diretórios indicados para a rodada de auditoria.

### Tabela de Triagem e Classificação de Arquivos

| conjunto | arquivo | formato | titulo_inferido | autor_inferido | status_leitura | status_legal_provavel | prioridade_analise | motivo |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| DeepSeek-downloads | `openalex/W4405860398-enhancing-chess-education...pdf` | PDF | Enhancing Chess Education through Interactive Teaching Strategies | Srbuhi Gevorgyan et al. | lido | open_access (CC-BY-NC) | A | Estudo estatístico empírico de alto valor sobre eficácia da reflexão de erros e autoavaliação. |
| ONDA3 | `O XADREZ NOS CONTEXTOS DO LAZER, DA ESCOLA...pdf` | PDF | O Xadrez nos Contextos do Lazer, da Escola e Profissional: Aspectos Psicológicos e Didáticos | Danielle Christofoletti | lido | open_access (UNESP) | A | Dissertação brasileira sobre psicologia e didática do xadrez; introduz a abordagem de "Tratamento de Pendências" (erros locais). |
| DeepSeek-downloads | `internet-archive/coas.ojpr.0902.03047z-Modern...pdf` | PDF | Modern Chess Instruction in School: Cognitive Effects, Pedagogical Strategies, and Teacher Training | Matije Z. Zorić | lido | open_access (CC-BY) | A | Defende a superioridade pedagógica do Lichess (estudos interativos, engine grátis) e papel secundário do Stockfish. |
| DeepSeek-downloads | `openalex/W4214640735-professional-competence...pdf` | PDF | Professional Competence of Primary School Teachers Implementing Chess Education Programmes | Olesya V. Konevskikh | lido | open_access (CC-BY) | A | Base teórica para capacitação pedagógica e a filosofia de Sukhin (sem componente competitivo/esportivo no ano 1). |
| ONDA3 | `1. meu_primeiro_livro_de_xadrez.pdf` | PDF | Meu Primeiro Livro de Xadrez | Augusto Tirado & Wilson da Silva | lido | verificar | A | Esqueleto nacional estruturado em 3 Diplomas (Peão, Torre, Rei) com testes de avanço bem marcados. |
| ONDA3 | `pdfcoffee.com_build-up-your-chess-1-pdf-free.pdf` | PDF | Build Up Your Chess 1: The Fundamentals | Artur Yusupov | parcialmente_lido | em_copyright | A | Modelo rigoroso de progresso baseado em "Lição -> Worked Examples -> Teste Pontuado com Tabela de Avaliação". |
| ONDA3 | `pdfcoffee.com_khmelnitsky-igor-chess-exam...pdf` | PDF | Chess Exam and Training Guide: Tactics | Igor Khmelnitsky | parcialmente_lido | em_copyright | A | Excelente taxonomia de diagnósticos para classificar erros e fraquezas de cálculo e lógica. |
| ONDA3 | `Xadrez_Vitorioso_-_Taticas_-_Yasser_Seirawan.pdf` | PDF | Xadrez Vitorioso - Táticas | Yasser Seirawan | parcialmente_lido | em_copyright | A | Guia estruturado de padrões táticos e mates em português com linguagem lúdico-pedagógica forte. |
| ONDA3 | `Xadrez_Vitorioso_-_Estrategias_-_Yasser_Seirawan.pdf` | PDF | Xadrez Vitorioso - Estratégias | Yasser Seirawan | parcialmente_lido | em_copyright | A | Excelente didática de introdução à estratégia elementar em português. |
| DeepSeek-downloads | `openalex/W4313225181-women-in-chess...pdf` | PDF | Women in Chess. Education-Related Problems During Talent Development Process | Alicja Baum | lido | open_access (CC-BY-ND) | B | Análise qualitativa sobre os atritos de gerenciar rotinas de estudo enxadrístico com a vida cotidiana (CMTD de Gagné). |
| DeepSeek-downloads | `internet-archive/o-perfeito-jogador-de-xadrez...pdf` | PDF | O Perfeito Jogador De Xadrez Ou Manual C | Henrique Velloso d'Oliveira | lido | dominio_publico | B | Livro clássico em português brasileiro de 1881. Importante apenas para validação de nomenclatura. |
| DeepSeek-downloads | `project-gutenberg/33870-chess-fundamentals.txt` | TXT | Chess Fundamentals | José Raúl Capablanca | lido | dominio_publico | B | Fonte clássica limpa para finais elementares e conceitos de atividade de peças. |
| DeepSeek-downloads | `internet-archive/chessstrategy05614gut...txt` | TXT | Chess Strategy | Edward Lasker | lido (partes) | dominio_publico | B | Excelente introdução a princípios lógicos de abertura e meio-jogo sem linhas decoradas. |
| ONDA3 | `2. Manual_de_Xadrez_DFE_2018.pdf` | PDF | Manual de Xadrez DFE 2018 | Hélio Neto (Sesc Cidadania) | lido | open_access | B | Manual escolar brasileiro simples, útil para ganchos didáticos rápidos e história básica. |
| ONDA3 | `Xadrez Para Leigos - pdf.pdf` | PDF | Xadrez Para Leigos | James Eade | parcialmente_lido | em_copyright | B | Ótima didática de iniciação com vocabulário adaptado ao público leigo brasileiro. |
| ONDA3 | `Aberturas de Xadrez Para Leigos - James Eade.pdf` | PDF | Aberturas de Xadrez Para Leigos | James Eade | parcialmente_lido | em_copyright | B | Excelente didática para desmistificar aberturas para iniciantes. |
| ONDA3 | `pdfcoffee.com_discovering-chess-openings...pdf` | PDF | Discovering Chess Openings | John Emms | parcialmente_lido | em_copyright | B | Foco absoluto em princípios de abertura em vez de memorização mecânica (1000-1200). |
| ONDA3 | `How to Defend in Chess...pdf` | PDF | How to Defend in Chess | Colin Crouch | parcialmente_lido | em_copyright | B | Guia denso de defesa e resiliência psicológica na desvantagem. |
| ONDA3 | `the-inner-game-of-chess-how-to-calculate...pdf` | PDF | The Inner Game of Chess: How to Calculate | Andy Soltis | parcialmente_lido | em_copyright | B | Foco no cálculo pragmático sob pressão e uso de lances candidatos. |
| ONDA3 | `pdfcoffee.com_andrew-soltis-how-to-choose...pdf` | PDF | How to Choose a Chess Move | Andy Soltis | parcialmente_lido | em_copyright | B | Processo de tomada de decisão prática no tabuleiro. |
| ONDA3 | `epdf.pub_secrets-of-chess-defence.pdf` | PDF | Secrets of Chess Defence | Mihail Marin | parcialmente_lido | em_copyright | B | Profilaxia e defesa para nível intermediário-avançado. |
| ONDA3 | `Antonio Lopz Manzano - O Xadrez dos Grandes...pdf` | PDF | O Xadrez dos Grandes Mestres | Antonio López Manzano | parcialmente_lido | em_copyright | B | 400 conselhos úteis para meio-jogo e conduta competitiva. |
| DeepSeek-downloads | `internet-archive/1990Ajedrez-Ajedrez.pdf` | PDF | Ajedrez | SENA Colômbia | lido (partes) | open_access | B | Curso profissionalizante de iniciação simples com boa progressão de exercícios. |
| ONDA3 | `capablanca - lies.elementares de xadrez.pdf` | PDF | Lições Elementares de Xadrez | José Raúl Capablanca | parcialmente_lido | verificar | B | Versão em português brasileiro do clássico de Capablanca. |
| ONDA3 | `Aprenda Xadrez com Gary Gasparov.pdf` | PDF | Aprenda Xadrez com Garry Kasparov | Garry Kasparov | parcialmente_lido | em_copyright | B | Curso introdutório de Kasparov, didática direta. |
| ONDA3 | `Duelos de Xadrez...Yasser Seirawan.pdf` | PDF | Duelos de Xadrez | Yasser Seirawan | parcialmente_lido | em_copyright | B | Partidas comentadas por Seirawan. Muito motivacional. |
| ONDA3 | `Gigantes do Xadrez Agressivo_ A - Neil...pdf` | PDF | Gigantes do Xadrez Agressivo | Neil McDonald | parcialmente_lido | em_copyright | B | Coletânea de partidas de ataque. Útil para ilustrar iniciativa. |
| DeepSeek-downloads | `internet-archive/chessgeneralship55278gut...epub` | EPUB | Chess Generalship, Vol. I. | Franklin K. Young | parcialmente_lido | dominio_publico | C | Teoria militar muito abstrata. Baixo valor prático. |
| DeepSeek-downloads | `internet-archive/thebluebookofche16377gut...txt` | TXT | The Blue Book of Chess | Desconhecido | parcialmente_lido | dominio_publico | C | Manual antigo de aberturas obsoletas. |
| DeepSeek-downloads | `internet-archive/chessandcheckers04913gut...txt` | TXT | Chess and Checkers: the Way to Mastership | Edward Lasker | parcialmente_lido | dominio_publico | C | Introdução elementar. Metade do livro é sobre damas. |
| DeepSeek-downloads | `internet-archive/bub_gb_yCUCAAAAYAAJ...pdf` | PDF | Morphy's games: a selection of the best... | Paul Morphy | parcialmente_lido | dominio_publico | C | Coletânea de partidas históricas. Útil para ilustrar iniciativa rápida. |
| DeepSeek-downloads | `internet-archive/2006700chessproblems_201910...pdf` | PDF | 700 Chess Problems | Mrs. W. J. Baird | parcialmente_lido | dominio_publico | C | Problemas artísticos compostos (mates em 2/3). |
| DeepSeek-downloads | `internet-archive/TavernerChessProblemsMadeEasy...pdf` | PDF | Chess problems made easy | Thomas Taverner | parcialmente_lido | dominio_publico | C | Instruções sobre como solucionar composições de mate. |
| DeepSeek-downloads | `internet-archive/bub_gb_5ZACAAAAQAAJ...pdf` | PDF | Chess studies; or endings of games | Joseph Kling & Bernhard Horwitz | parcialmente_lido | dominio_publico | C | Estudos de finais do século XIX. |
| ONDA3 | `cartilhaXadrez.pdf` | PDF | Cartilha de Xadrez | Ministério do Esporte | lido | open_access | C | Cartilha de 9 páginas. Muito básica. Útil apenas para terminologia nacional oficial. |
| ONDA3 | `Projeto xadrez na EE sene (1).pdf` | PDF | Projeto xadrez na EE sene | Desconhecido | lido (partes) | open_access | C | Roteiro de introdução escolar local. Sem conteúdo didático técnico. |
| ONDA3 | `101 Dicas de Importantes Xadrez.pdf` | PDF | 101 Dicas de Importantes Xadrez | Desconhecido | parcialmente_lido | verificar | C | Folheto simples de dicas. Redundante. |
| ONDA3 | `Curso de xadrez.pdf` | PDF | Curso de xadrez | Desconhecido | parcialmente_lido | verificar | C | Apostila básica em português. Redundante. |
| DeepSeek-downloads | `internet-archive/chesshistoryandr04902gut...txt` | TXT | Chess History and Reminiscences | Henry Edward Bird | fora_escopo | dominio_publico | D | Puramente histórico e reminiscente. Sem didática. |
| DeepSeek-downloads | `internet-archive/theexploitsandtr34180gut...epub` | EPUB | The Exploits and Triumphs, in Europe... | Frederick Milnes Edge | fora_escopo | dominio_publico | D | Biografia e histórias jornalísticas sobre Morphy na Europa. |
| DeepSeek-downloads | `internet-archive/bub_gb_DrUFAAAAIAAJ-The-Old...pdf` | PDF | The Old and the new magic | Henry Ridgely Evans | fora_escopo | dominio_publico | D | Documento incorreto (livro sobre mágica e ilusionismo). |
| DeepSeek-downloads | `internet-archive/bub_gb_oyUCAAAAYAAJ-The-Chess...pdf` | PDF | The Chess player's magazine | J. J. Löwenthal (ed.) | fora_escopo | dominio_publico | D | Periódico enxadrístico antigo (1863). |
| DeepSeek-downloads | `internet-archive/mandragorias-seu-historia...pdf` | PDF | Mandragorias, Seu Historia Shahiludii | Thomas Hyde | fora_escopo | dominio_publico | D | Tratado histórico de 1694 em latim sobre a história do xadrez. |
| DeepSeek-downloads | `internet-archive/bub_gb_N7kUAAAAYAAJ-An-attempt...pdf` | PDF | An attempt to analyse the automaton... | Robert Willis | fora_escopo | dominio_publico | D | História do funcionamento do robô "O Turco". |
| DeepSeek-downloads | `internet-archive/bub_gb_65caAAAAYAAJ-Le...pdf` | PDF | Le principali aperture del giuoco... | Serafino Dubois | parcialmente_lido | dominio_publico | D | Teoria de aberturas italiana de 1868. Obsoleta. |
| DeepSeek-downloads | `internet-archive/bub_gb__SUCAAAAYAAJ-The-chess...pdf` | PDF | The chess tournament | Howard Staunton | fora_escopo | dominio_publico | D | Partidas do torneio de Londres de 1851. |
| DeepSeek-downloads | `internet-archive/bub_gb_DfAKyaxSWSwC-The-book...pdf` | PDF | The book of the first American... | Willard Fiske | fora_escopo | dominio_publico | D | Partidas do congresso americano de 1857. |
| DeepSeek-downloads | `internet-archive/TheRoyallGameOfChessePlay...pdf` | PDF | The royall game of chesse-play | Gioachino Greco | parcialmente_lido | dominio_publico | D | Partidas curtas e armadilhas de 1656. |
| DeepSeek-downloads | `internet-archive/bub_gb_ohIXAAAAYAAJ_2-Schach...pdf` | PDF | Schach-almanach | Karl Portius | fora_escopo | dominio_publico | D | Almanaque histórico alemão (1846). |
| DeepSeek-downloads | `internet-archive/bub_gb_TlRAAAAAYAAJ-Lehrbuch...pdf` | PDF | Lehrbuch des Schachspiels | Max Lange | parcialmente_lido | dominio_publico | D | Manual alemão do século XIX. |
| DeepSeek-downloads | `internet-archive/bub_gb_fcsCAAAAYAAJ-Handbuch...pdf` | PDF | Handbuch der Schachspielkunst | Herrmann Hirschbach | fora_escopo | dominio_publico | D | Livro em alemão de 1865. |
| DeepSeek-downloads | `internet-archive/chess-endgames-Chess-Endgames.pdf` | PDF | Endgames in bidding chess | Urban Larsson et al. | fora_escopo | open_access | D | Variante de xadrez não-tradicional (bidding chess). |
| DeepSeek-downloads | `internet-archive/falken-schach-profi-chess...txt` | TXT | Falken Schach Commodore 64 Manual | Damian Lozano | lido | dominio_publico | D | Manual técnico de emulador. Sem valor pedagógico. |
| ONDA3 | `Aberturas de Xadrez para Leigos.doc` | DOC | Aberturas de Xadrez Para Leigos | James Eade | duplicado | em_copyright | D | Cópia idêntica em formato DOC do PDF do livro de Eade. |
| ONDA3 | `Como Jogar Xadrez...Iniciantes.mp4` | MP4 | Guia Completo para Iniciantes | Desconhecido | nao_pdf | verificar | D | Vídeo de internet fora do escopo da análise de literatura. |
| ONDA3 | `Eletiva-Lions-Clube-Xadrez.docx` | DOCX | Eletiva Lions Clube Xadrez | Desconhecido | nao_pdf | open_access | D | Projeto de eletiva muito simples e curto. |
| ONDA3 | `Histria do Xadrez - Regras do Xadrez.pdf` | PDF | História do Xadrez - Regras | Desconhecido | parcialmente_lido | verificar | D | Resumo simplificado de regras. Redundante. |
| ONDA3 | `Jogos de Xadrez.docx` | DOCX | Jogos de Xadrez | Desconhecido | nao_pdf | verificar | D | Arquivo Word escolar básico. |
| ONDA3 | `pdfcoffee.com_livshitz-a-test-your-chess-iq...pdf` | PDF | Test Your Chess IQ | A. Livshitz | ilegivel | em_copyright | D | Arquivo corrompido ("Cannot find Root object"). |
| ONDA3 | `Peas de Xadrez - Regras do Xadrez.pdf` | PDF | Peças de Xadrez - Regras | Desconhecido | parcialmente_lido | verificar | D | Apostila de 2 páginas sobre movimentos. Redundante. |
| ONDA3 | `Videos de Xadrez para assistir no Youtube.docx` | DOCX | Links de Vídeos do YouTube | Desconhecido | nao_pdf | verificar | D | Lista de URLs de vídeo. Fora de escopo. |
| ONDA3 | `Xadrez para celular.txt` | TXT | Links de Apps de Celular | Desconhecido | nao_pdf | verificar | D | Arquivo de texto curtíssimo com links de apps. |

---

## 2. Fichas Pedagógicas

### Fichas Individuais (Prioridade A)

#### Ficha 1: Gevorgyan (2024)
1. **Identificação**: *Enhancing Chess Education through Interactive Teaching Strategies: A Comprehensive Approach*; Srbuhi Gevorgyan, M. M. Ispiryan, Vahan Sargsyan, L. L. Gevorgyan, Lilit Vardanyan; Inglês/Russo; 2024; Crianças de 8-11 anos (Banda 600-1200); Validar estatisticamente que a interatividade e a autorreflexão estimulam a retenção cognitiva de xadrez em escolares.
2. **Status legal provável**: open_access (CC-BY-NC).
3. **Filosofia de ensino**: Foco na aprendizagem ativa e reflexão metacognitiva sob a luz da teoria sócio-histórica de Vygotsky. Recusa a memorização estéril de regras e foca no esforço de resolução e autoanálise. **(E)**
4. **Sequência**: Começa pelas ferramentas de comunicação e autoavaliação (reflexão local), evoluindo para a resolução de problemas em pequenos grupos e, por fim, projetos enxadrísticos de longo prazo (maiores que uma semana). **(E)**
5. **Como explica**: Usa a técnica de "conversação heurística" (diálogo socrático) para estimular o aluno a guiar o próprio raciocínio. **(E)**
6. **Como exercita**: Resolução cooperativa de problemas em aula e tarefas de longa duração ("projetos"). O aluno precisa justificar verbalmente os lances e prever refutações. **(E)**
7. **Como dá feedback / nomeia erro**: O feedback é focado em fazer o aluno avaliar as próprias respostas, identificando erros de cálculo ou pressa e refletindo especificamente sobre as tarefas de casa que falhou em solucionar. **(E)**
8. **O melhor que vale absorver**: 
   - A forte correlação estatística ($r=0.29$) que prova que **refletir especificamente sobre exercícios não resolvidos (tarefas falhadas)** é o maior vetor de progresso enxadrístico. **(E)**
   - O comentário verbal da solução ($r=0.18$) e a autoavaliação do progresso ($r=0.19$) como validadores cognitivos. **(E)**
9. **O que descartar**: Atividades puramente grupais presenciais de escolas armênias que dependem de lousa digital interativa e interação social física, não aplicáveis ao app de usuário solo. **(I)**
10. **Encaixe**: `600-1400` + `tatica` / `calculo` + `review` / `transfer`.
11. **Mapeável no Lichess?**: Sim: Puzzle Replay, análise de partidas próprias derrotadas e criação de Lichess Studies interativos comentados. **(I)**
12. **NOVO vs método atual**: Adiciona e confirma. Dá embasamento acadêmico direto para o formato "Erro-Nomeado-Com-Correção" e orienta a criação do drill "Tratamento de Pendências". **(P)**

#### Ficha 2: Christofoletti (2007)
1. **Identificação**: *O Xadrez nos Contextos do Lazer, da Escola e Profissional: Aspectos Psicológicos e Didáticos*; Danielle Ferreira Auriemo Christofoletti; Português (Brasil); 2007; Faixa ativa inicial (0-1400); Investigar qualitativamente as práticas pedagógicas e os desafios metodológicos de instrutores de xadrez no Brasil sob a ótica da motricidade humana.
2. **Status legal provável**: open_access (Repositório UNESP).
3. **Filosofia de ensino**: Ensino integrado em que o jogo é uma atividade lúdica inicial, mas que para evoluir exige o tratamento sistemático das fraquezas e a tranquilidade psicológica nas avaliações. **(E)**
4. **Sequência**: Para crianças de 6 a 10 anos, enfatiza regras básicas, iniciação lúdica e ensinar a pensar. Para a faixa de 11 a 16 anos (intermediários), o foco migra maciçamente para o **tratamento de pendências (fraquezas)** e preparação teórica realista de torneios. **(E)**
5. **Como explica**: Foca na transposição didática adaptada ao contexto (lúdico para lazer/escola, analítico para competição). **(E)**
6. **Como exercita**: Aulas expositivas aliadas a partidas práticas e correção detalhada de lances. **(E)**
7. **Como dá feedback / nomeia erro**: Foca no diagnóstico das "pendências" do aluno (blunders, peças penduradas, erros táticos recorrentes) e em tranquilizar o estudante psicológicamente para que a derrota seja vista como extensão do aprendizado. **(E)**
8. **O melhor que vale absorver**: 
   - A definição curricular brasileira de priorizar o **"Tratamento de Pendências"** (trabalhar os erros de partidas e táticas que ficaram pendentes) a partir do nível intermediário. **(E)**
   - O foco na preparação psicológica desprovida de pressão material (rating), tratando a partida de teste como "mera extensão da sala de aula". **(E)**
9. **O que descartar**: Discussões teóricas de motricidade humana pura ou burocracias escolares brasileiras de lazer/clube físico. **(I)**
10. **Encaixe**: `600-1200` + `tatica` / `transferencia` + `guided` / `review`.
11. **Mapeável no Lichess?**: Sim: Uso de ferramentas de análise local sem engine e Lichess Studies interativos focados no erro do aluno. **(I)**
12. **NOVO vs método atual**: Confirma e Adiciona. Valida a eliminação do rating ou daStockfish como juízes agressivos e adiciona a nomenclatura brasileira de "Tratamento de Pendências". **(P)**

#### Ficha 3: Zorić (2025)
1. **Identificação**: *Modern Chess Instruction in School: Cognitive Effects, Pedagogical Strategies, and a Model of Accredited Teacher Training*; Matije Z. Zorić; Inglês; 2025; Faixa elementar e intermediária (0-1400); Apresentar as bases didáticas e ferramentas digitais de um programa nacional de ensino de xadrez em escolas (Montenegro).
2. **Status legal provável**: open_access (CC-BY 4.0).
3. **Filosofia de ensino**: Abordagem baseada na pedagogia digital moderna. O aprendizado deve ser visualmente rico e autodirigido, utilizando plataformas de xadrez online para motivar a prática autônoma. **(E)**
4. **Sequência**: Princípios didáticos gerais (atenção e metacognição) -> Regras do jogo -> Uso do livro digital interativo -> Prática e análise online em plataformas -> Organização profissional de eventos. **(E)**
5. **Como explica**: Projeção interativa das posições no tabuleiro digital para discussões e análises colaborativas, enriquecendo a visualização espacial do estudante. **(E)**
6. **Como exercita**: Atividades práticas e torneios nas plataformas Lichess e Chess.com. **(E)**
7. **Como dá feedback / nomeia erro**: Utilização da engine integrada do Lichess de forma assistida para que o próprio aluno compare seus lances candidatos com as melhores linhas teóricas. **(E)**
8. **O melhor que vale absorver**: 
   - A defesa do **Lichess como plataforma pedagógica superior** devido à facilidade de criar estudos interativos e usar a análise computacional gratuita de forma educativa. **(E)**
   - A distinção nítida de papéis: engines e softwares como Fritz/Swiss Manager são ferramentas **exclusivas para o professor preparar as aulas**, não devem ser usados diretamente pelos alunos como árbitros ou parceiros de treino diário. **(E)**
9. **O que descartar**: Treinamentos específicos sobre a operação do Swiss Manager (gerenciamento de torneios escolares) e o software Fritz. **(I)**
10. **Encaixe**: `0-1200` + `fundamento` / `calculo` / `transferencia` + `explain` / `guided` / `transfer`.
11. **Mapeável no Lichess?**: 100% mapeável, pois valida o ecossistema do Lichess como a base prática do aplicativo. **(P)**
12. **NOVO vs método atual**: Confirma fortemente. Respalda a decisão do projeto de usar o Lichess como o destino final de treino e a recusa em usar robôs (como Stockfish) como adversários rotineiros para o aluno iniciante. **(P)**

#### Ficha 4: Konevskikh (2022)
1. **Identificação**: *Professional Competence of Primary School Teachers Implementing Chess Education Programmes*; Olesya Vladimirovna Konevskikh; Russo (com sumário em Inglês); 2022; Faixa de iniciação (0-1000); Definir a estrutura de competências didáticas necessárias para o ensino eficaz de xadrez em escolas primárias.
2. **Status legal provável**: open_access (CC-BY 4.0).
3. **Filosofia de ensino**: O xadrez escolar deve ser puramente cognitivo e educacional. Recusa a abordagem focada em criar campeões esportivos precoces ou focar em rating. **(E)**
4. **Sequência**: Iniciação básica orientada à saúde mental e diversão, evoluindo para conceitos táticos simples, e só mais tarde introduzindo elementos competitivos. No primeiro ano de estudo, o esporte é banido do currículo (método de Sukhin). **(E)**
5. **Como explica**: Ensina conceitos abstratos por meio de brincadeiras no tabuleiro e contos históricos. **(E)**
6. **Como exercita**: Jogos temáticos de peças individuais e atividades que evitam o estresse da derrota direta. **(E)**
7. **Como dá feedback / nomeia erro**: Focado em autopsicologia — ajudar o aluno a refletir sobre os motivos que o fizeram perder peças ou partidas em uma atmosfera livre de culpa. **(E)**
8. **O melhor que vale absorver**: 
   - A recomendação de Sukhin de **excluir o caráter puramente competitivo/esportivo no primeiro ano de treino (0-600)** para evitar o desconforto psicológico e o abandono precoce do estudo. **(E)**
   - A divisão da competência enxadrística em competência especial (teoria), metodológica (técnica de ensino), social e autopsicológica (habilidade de refletir sobre as próprias ações no tabuleiro). **(E)**
9. **O que descartar**: Diretrizes de formação universitária russa de pedagogos e regulamentações estatais locais. **(I)**
10. **Encaixe**: `0-600` / `600-1000` + `fundamento` + `explain` / `guided`.
11. **Mapeável no Lichess?**: Sim: Lichess Learn e mini-games temáticos focados no movimento de peças únicas. **(I)**
12. **NOVO vs método atual**: Confirma e Adiciona. Valida a recusa em focar o progresso do app em números de rating e motiva a inclusão de rituais mais gentis e menos punitivos no estágio elementar. **(P)**

#### Ficha 5: Tirado & Silva (1999)
1. **Identificação**: *Meu Primeiro Livro de Xadrez*; Augusto Tirado & Wilson da Silva; Português (Brasil); 1999; Faixa de 0 a 1200; Oferecer um curso de xadrez escolar simplificado dividido em estágios pedagógicos progressivos com testes de controle local.
2. **Status legal provável**: verificar (direitos autorais dos autores).
3. **Filosofia de ensino**: A metodologia visa simplificar o jogo por meio de analogias artísticas e testes curtos de fixação teórica ao fim de capítulos fechados. **(E)**
4. **Sequência**: 
   - Capítulo 1 (Diploma do Peão): Tabuleiro, peças, capturas, en passant, roque, xeque e mate básico. **(E)**
   - Capítulo 2 (Diploma da Torre): Empates, anotação, centro e combinação (temas táticos: ataque duplo, cravada, descoberta, desvio, atração, intercepção, sobrecarga, sacrifício). **(E)**
   - Capítulo 3 (Diploma do Rei): Abertura (princípios), meio-jogo, finais elementares (dois bispos, bispo e cavalo, rei e peão). **(E)**
5. **Como explica**: Uso de desenhos artísticos do tabuleiro, lendas de xadrez (como Sessa) e explicações verbais amigáveis em português. **(E)**
6. **Como exercita**: Diagramas estáticos com perguntas sobre lances específicos, perguntas de nomeação de casas e exercícios de mate em 1 ou 2. **(E)**
7. **Como dá feedback / nomeia erro**: Comparação manual com as respostas no fim do livro. O erro indica que o aluno precisa revisar o capítulo para tentar o teste de diploma novamente. **(E)**
8. **O melhor que vale absorver**: 
   - A estrutura baseada em **Diplomas de Progresso (Peão, Torre e Rei)** como milestones de banda. **(I)**
   - A nomenclatura clássica de táticas em português (Ataque Duplo, Cravada, Xeque Descoberto, Desvio, Atração, Intercepção e Sobrecarga). **(E)**
9. **O que descartar**: Os diagramas de exercícios literais e os finais hiper-complexos de Bispo + Cavalo contra Rei para a faixa inicial (violam a regra de não sobrecarregar cognitivamente antes de ~1200). **(I)**
10. **Encaixe**: `0-1200` + `fundamento` / `tatica` / `final` + `explain` / `guided` / `review`.
11. **Mapeável no Lichess?**: Sim: Lichess Studies temáticos cobrindo os testes de diploma de forma interativa. **(I)**
12. **NOVO vs método atual**: Adiciona e confirma. Acrescenta uma estrutura perfeita de marcos curriculares locais ("Diplomas") que resolve o problema de medir o progresso sem rating. **(P)**

#### Ficha 6: Yusupov (2007)
1. **Identificação**: *Build Up Your Chess 1: The Fundamentals*; Artur Yusupov; Inglês (versões originais alemãs); 2007-2008; Faixa 1000 a 1600 (embora no livro conste "até 1500 ELO"); Promover um método rigoroso de fundações enxadrísticas baseado na escola soviética de xadrez com baterias de testes calibradas.
2. **Status legal provável**: em_copyright.
3. **Filosofia de ensino**: A excelência vem da prática deliberada estruturada: explicação conceitual concisa -> worked examples resolvidos -> teste de 12 exercícios com pontuação fixa de desempenho. **(E)**
4. **Sequência**: Inicia por mates básicos e temas táticos curtos, migrando para finais de peão elementares, táticas de desvio/atração, e então conceitos posicionais básicos e aberturas simples. **(E)**
5. **Como explica**: Foco no "Worked Example" (Exemplo Resolvido): apresenta a posição e explica minuciosamente o processo de pensamento por trás dos lances candidatos antes de dar os problemas livres. **(E)**
6. **Como exercita**: Bateria fixa de 12 posições de teste por tema. O estudante deve escrever os lances e variantes secundárias. Cada acerto confere 1 a 4 pontos. **(E)**
7. **Como dá feedback / nomeia erro**: Através de uma tabela de pontuação de esforço no final de cada capítulo (ex: <8 pontos = repetir o capítulo; 8-10 pontos = passou; 11-12 = excelente). **(E)**
8. **O melhor que vale absorver**: 
   - O fluxo de treino rígido: **Worked Examples (explain/guided) -> Teste de Esforço Misto (retrieval) -> Avaliação por Pontos de Desempenho (review)**. **(E)**
   - O rigor de não permitir avançar de lição caso a pontuação mínima no teste do capítulo não seja atingida. **(E)**
9. **O que descartar**: A totalidade dos exercícios físicos protegidos por direito autoral do livro. Apenas a estrutura metodológica de pontuação e o fluxo de treino são adotados. **(I)**
10. **Encaixe**: `1000-1400` + `tatica` / `calculo` + `retrieval` / `review`.
11. **Mapeável no Lichess?**: Sim: Baterias de puzzles rotulados ou Studies com temporizador e conferência de lances. **(I)**
12. **NOVO vs método atual**: Confirma e refina. Confirma a importância do worked example e refina o critério de domínio de fase usando o score de acertos sobre uma bateria fixa. **(P)**

#### Ficha 7: Seirawan (2003)
1. **Identificação**: *Winning Chess Series (Táticas & Estratégias)*; Yasser Seirawan; Português (Brasil) / Inglês; 2003-2005; Faixa 600 a 1400; Ensinar os conceitos mais complexos de tática e estratégia de forma acessível e visualmente rica para iniciantes e amadores.
2. **Status legal provável**: em_copyright.
3. **Filosofia de ensino**: Didática amigável, focada em analogias cotidianas simples e na construção paulatina de planos estratégicos de longo prazo. **(E)**
4. **Sequência**: 
   - Táticas: Garfo, cravada, espeto, ataque descoberto, desvio, atração, xeque-mate básico e combinações complexas de mate. **(E)**
   - Estratégias: Os quatro elementos (Força, Tempo, Espaço, Estrutura de Peões) e como usá-los para formular planos. **(E)**
5. **Como explica**: Explicações detalhadas em português, usando metáforas visuais (como o cavalo como polvo, cravadas como âncoras) e narrativas sobre partidas famosas. **(E)**
6. **Como exercita**: Diagramas clássicos e perguntas com lances conceituais candidatos. **(E)**
7. **Como dá feedback / nomeia erro**: Focado em explicar pedagogicamente por que um lance falha conceitualmente (perda de tempo, fragilidade do rei) e não apenas dando a linha do computador. **(E)**
8. **O melhor que vale absorver**: 
   - A conceituação dos **4 elementos de Seirawan (Força, Tempo, Espaço, Estrutura)** como checklist simplificado de meio-jogo para a banda 1000-1200. **(E)**
   - O tom de voz acolhedor, adulto e extremamente direto na classificação das táticas fundamentais em português. **(E)**
9. **O que descartar**: As partidas longas comentadas autorais ou os testes de finais complexos protegidos. **(I)**
10. **Encaixe**: `600-1200` + `tatica` / `abertura-principio` / `plano` + `explain` / `guided`.
11. **Mapeável no Lichess?**: Sim: Exercícios do Lichess Practice de táticas curtas e estudos temáticos de meio-jogo. **(I)**
12. **NOVO vs método atual**: Confirma e Adiciona. Serve como excelente insumo para o vocabulário e tom de voz ("microcopy") do Professor Lemos na transição de bandas. **(P)**

#### Ficha 8: Khmelnitsky (2004)
1. **Identificação**: *Chess Exam and Training Guide: Tactics*; Igor Khmelnitsky; Inglês; 2004; Faixa de 1000 a 1800; Propor um exame diagnóstico minucioso que mapeia e rotula as fraquezas específicas do jogador em categorias cognitivas e táticas.
2. **Status legal provável**: em_copyright.
3. **Filosofia de ensino**: A correção do jogo requer primeiro um diagnóstico científico do processo de pensamento. Separa os erros em táticos, posicionais, de cálculo ou psicológicos. **(E)**
4. **Sequência**: Exame diagnóstico de posições mistas de múltiplas escolhas -> Classificação estatística dos erros -> Plano de estudos focado especificamente na fraqueza identificada. **(E)**
5. **Como explica**: Foca na estruturação taxonômica dos erros (por exemplo: falha em ver recursos defensivos do oponente, subestimar a atividade do adversário). **(E)**
6. **Como exercita**: Questionários complexos com lances candidatos que exigem avaliar a consequência de múltiplos lances. **(E)**
7. **Como dá feedback / nomeia erro**: Nomeação estrita da categoria do erro cometido de forma matemática, gerando um mapa de calor das fraquezas do jogador. **(E)**
8. **O melhor que vale absorver**: 
   - A técnica de **Exame Diagnóstico Misto** para rotular as fraquezas do jogador no app. **(I)**
   - A categorização didática das falhas cognitivas (impulsividade, cálculo curto, não ver o recurso do outro). **(E)**
9. **O que descartar**: A totalidade das posições e perguntas de múltipla escolha sob copyright do livro. **(I)**
10. **Encaixe**: `1000-1800` + `calculo` / `transferencia` + `retrieval` / `review`.
11. **Mapeável no Lichess?**: Sim: Lichess Analysis e Studies montados localmente com posições diagnóstico clássicas de domínio público. **(I)**
12. **NOVO vs método atual**: Adiciona. Provê a estrutura metodológica perfeita para guiar as decisões de produto de como classificar erros e fraquezas no gerador de planos do app. **(P)**

---

### Fichas Coletivas (Prioridades B, C e D)

#### Grupo 1: Guias e Manuais de Iniciação e Princípios
* **Documentos**: *Women in Chess* (Baum, 2022); *Manual de Xadrez DFE 2018* (Sesc/Hélio Neto); *Ajudrez* (SENA Colômbia); *Cartilha do Ministério do Esporte* (Antonio Villar et al.); *Xadrez Para Leigos* (James Eade).
* **Status legal provável**: open_access (CC-BY, Sesc, SENA, Ministério do Esporte) / verificar (Eade, em copyright).
* **Filosofia de Ensino**: Ensino simplificado e sem jargões complexos para introduzir as regras e conceitos básicos em português. Foca em centro, desenvolvimento acelerado e o roque como pilares de segurança na abertura. **(E)**
* **O que absorver**:
  - A estruturação simples e didática de explicações de mate elementar e coordenadas. **(E)**
  - O uso de cartilhas curtas oficiais brasileiras para embasamento de terminologia linguística direta. **(E)**
  - O alerta de Baum (2022) sobre o **estresse da rotina de estudos**: o app deve oferecer planos curtos e altamente adaptáveis para evitar sobrecarga na vida prática do jogador amador amigável. **(I)**
* **O que descartar**: Biografias, listas administrativas escolares ou regras repetitivas e redundantes de movimento de peças. **(I)**
* **Encaixe**: `0-1000` + `fundamento` / `abertura-principio` + `explain` / `guided`.

#### Grupo 2: Estudos de Finais e Aberturas Clássicas em Domínio Público
* **Documentos**: *Chess Fundamentals* (Capablanca); *Chess Strategy* (Edward Lasker); *O Perfeito Jogador de Xadrez* (Henrique Velloso d'Oliveira); *Chess Studies* (Kling & Horwitz); *The Chess-Player's Handbook* (Howard Staunton); *Morphy's Games* (Paul Morphy); *Le Principali Aperture* (Dubois); *The Book of the First American Chess Congress* (Fiske); *Lehrbuch des Schachspiels* (Lange); *The Royall Game of Chess-play* (Greco).
* **Status legal provável**: dominio_publico.
* **Filosofia de Ensino**: O xadrez clássico da era romântica e moderna: foca na atividade máxima das peças na abertura (Lasker, Morphy) e na exatidão cirúrgica nos finais práticos (Capablanca, Kling & Horwitz). **(E)**
* **O que absorver**:
  - A regra clássica do quadrado e oposição de Capablanca. **(E)**
  - A utilização de partidas modelo românticas curtas (como as de Morphy ou as miniaturas de Greco) para ilustrar os perigos de não rocar e pendurar peças na abertura (foco em 600-1000). **(I)**
  - A nomenclatura clássica de finais de torre (Lucena e Philidor). **(E)**
* **O que descartar**: Análises de aberturas obsoletas baseadas em teorias antigas do século XIX ou descrições em latim. **(I)**
* **Encaixe**: `1000-1200` + `final` / `calculo` + `retrieval` / `transfer`.

#### Grupo 3: Teoria de Defesa, Profilaxia e Psicologia Enxadrística
* **Documentos**: *How to Defend in Chess* & *Why We Lose at Chess* (Colin Crouch); *Secrets of Chess Defence* (Mihail Marin); *How to Choose a Chess Move* & *The Inner Game of Chess* (Andy Soltis); *O Xadrez dos Grandes Mestres* (Manzano); *Discovering Chess Openings* (John Emms).
* **Status legal provável**: em_copyright.
* **Filosofia de Ensino**: O xadrez sob a ótica da resiliência mental e da profilaxia (pensar no que o adversário quer fazer antes de atacar). **(E)**
* **O que absorver**:
  - A psicologia do blunder de Crouch: falhas acontecem por cansaço, perda de foco e subestimar as ameaças do oponente. **(E)**
  - A profilaxia elementar de Marin: fazer o lance que impede o contra-jogo ativo do adversário. **(E)**
  - O método de Soltis para cálculo prático: listar 2-3 lances candidatos e calcular apenas as variantes forçadas primárias para economizar energia mental. **(E)**
* **O que descartar**: Análises de linhas profundas de grande mestre ou exercícios específicos sob copyright. **(I)**
* **Encaixe**: `1000-1800` + `calculo` / `defesa` + `guided` / `retrieval`.

#### Grupo 4: Fora de Escopo / Históricos / Redundantes
* **Documentos**: *The Old and the new magic* (Evans - ilusionismo); *Chess Endgames (Bidding Chess)* (Larsson - variante); *Falken Schach Manual* (Lozano - emulador C64); *An attempt to analyse the automaton chess player* (Willis - histórico); *Mandragorias* (Hyde - história em latim); *Test Your Chess IQ* (Livshitz - corrompido).
* **Status legal provável**: dominio_publico / open_access.
* **Filosofia de Ensino**: Nenhuma aplicável ao xadrez tradicional pedagógico.
* **O que absorver / O que descartar**: Arquivar e ignorar todos por completo. Não possuem relevância instrutiva ou técnica para o loop principal do tutor. **(P)**

---

## 3. Síntese Delta para o Método

### Entrega 1 - Novos Aportes por Tradição

A tabela abaixo resume as tradições identificadas na literatura e como suas ideias abstratas enriquecem o método atual.

| tradicao | documentos | o_que_adiciona | ideia_absorvivel | risco_clean_room | confianca |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Psicologia Educacional e Metacognição** | Gevorgyan (2024), Konevskikh (2022), Baum (2022), Zorić (2025), Christofoletti (2007) | Validação empírica de que a autoavaliação guiada e a reflexão sobre erros cometidos geram o maior avanço cognitivo. Defesa do Lichess como ambiente de treino ideal e não-punitivo. | **"Tratamento de Pendências"**: focar o treino nos erros e táticas que o jogador falhou em resolver anteriormente. Excluir rating como prova de progresso. | Nenhum. As conclusões são conceituais e de artigos científicos em open access. | Alta |
| **Currículo de Escolas Nacionais (Brasil)** | Tirado & Silva (1999), Hélio Neto (2018), Cartilha do Ministério do Esporte | Estruturação de marcos de aprendizado claros baseados em "Diplomas" e testes de verificação locais em português brasileiro. | **"Diplomas de Progresso"**: Teste do Peão (0-600), Teste da Torre (600-1000), Teste do Rei (1000-1200) como travas didáticas de banda. | Não copiar os diagramas nem as perguntas específicas das avaliações do livro. | Alta |
| **Treinamento Estruturado e Autodiagnóstico** | Yusupov (2007), Khmelnitsky (2004), Soltis | Fluxo didático rigoroso baseado em worked examples antes de exercícios livres e baterias de testes pontuados por esforço cognitivo. | **"Score Test"**: baterias diagnósticas mistas onde o jogador pontua pela profundidade do seu cálculo estratégico e não por velocidade de clique. | Não reutilizar nenhuma posição ou exercício dos livros sob copyright. | Alta |
| **Didática Estratégica e Profilaxia** | Seirawan (2003), Emms, Eade, Crouch | Tom de voz lúdico em português e desmistificação das fases do jogo (abertura por princípios simples e os 4 elementos de Seirawan). | **"Checklist de Lances Candidatos"**: simplificar o cálculo focando nos 4 elementos de Seirawan e limitando a árvore de cálculo. | Não reproduzir as anedotas literais ou as partidas comentadas autorais. | Alta |

---

### Entrega 2 - Ajustes na Escada

Modificações e inserções sugeridas para a escada curricular de progresso (deltas em relação ao método consolidado anterior):

| band | stage | mudanca_proposta | documento_que_motiva | tipo(E/I/P) | confianca |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `0-600` | `fundamento` | Inserir o milestone **"Teste do Peão"** (marcando a obtenção do Diploma do Peão) ao consolidar regras e movimentos elementares. | Tirado & Silva (1999) | (P) | Alta |
| `600-1000` | `seguranca` / `tatica` | Adicionar o drill **"Tratamento de Pendências"** para re-resolver puzzles falhados do perfil do jogador. | Gevorgyan (2024), Christofoletti (2007) | (E) | Alta |
| `600-1000` | `tatica` | Inserir o milestone **"Teste da Torre"** (Diploma da Torre) cobrando a detecção mista das táticas básicas em português. | Tirado & Silva (1999) | (P) | Alta |
| `1000-1200` | `calculo` | Adicionar baterias de teste de **Tomada de Decisão com Pontuação** (Score Test) em vez de rating puro de velocidade. | Yusupov (2007), Khmelnitsky (2004) | (I) | Média |
| `1000-1200` | `transferencia` | Inserir o milestone **"Teste do Rei"** (Diploma do Rei) avaliando princípios de abertura, finais Capablanca e partidas-modelo. | Tirado & Silva (1999) | (P) | Alta |
| `1400-1800` | `defesa` | Criar um estágio formal de **Defesa e Profilaxia** utilizando o conceito de "não-agressão" e cálculo defensivo sob pressão. | Crouch (2010), Marin | (E) | Alta |

---

### Entrega 3 - Novos Drill Formats

Formatos de exercícios abstratos novos ou aprimorados introduzidos nesta rodada:

#### 1. Tratamento de Pendências (Foco no Erro)
* **Descrição curta**: Sessão de treino focada exclusivamente na revisão de erros e puzzles falhados pelo jogador.
* **Passo a passo original**: O app recupera do perfil do jogador (ou de um banco local de erros) 5-10 puzzles/lances de partidas que ele errou anteriormente -> Apresenta a posição limpa (sem dizer o tema nem o erro original) -> O jogador faz um lance candidato -> O app valida. Se o jogador errar de novo, pede para ele verbalizar ou classificar o erro antes de mostrar a resposta.
* **Band alvo**: `600-1400`
* **Stage alvo**: `tatica` / `calculo`
* **exerciseMode**: `review` → `transfer`
* **Como mapear no Lichess**: Menu de Puzzles Falhados (Lichess Dashboard / Puzzle Replay) ou exportar as posições de erros das partidas terminadas do jogador para um Lichess Study interativo local.
* **Sinal de domínio**: Resolução correta de 8 a 10 posições anteriormente erradas, justificando por que o erro original ocorreu.
* **SourceInfluence**: Gevorgyan (2024), Christofoletti (2007) ("trabalhar as pendências").
* **Armadilha**: O jogador tentar chutar lances sem refletir sobre por que errou o primeiro lance na partida real.

#### 2. Autoavaliação de Esforço (Score Test)
* **Descrição curta**: Teste diagnóstico misto com pontuação de esforço para medir a precisão cognitiva de cálculo e estratégia.
* **Passo a passo original**: Apresentar uma bateria de 10 posições sem rótulo -> O jogador tem até 3 minutos por posição para analisar e registrar seu lance candidato e sua linha de variantes principal -> O app revela a solução e as variantes corretas -> O próprio jogador atribui pontos a si mesmo baseado no seu esforço (ex: 3 pontos para o lance principal e variante correta; 1 ponto se viu apenas o plano geral; 0 pontos para blunders) -> O score total é comparado com uma tabela de avanço.
* **Band alvo**: `1000-1800`
* **Stage alvo**: `calculo` / `plano`
* **exerciseMode**: `retrieval` → `review`
* **Como mapear no Lichess**: Lichess Study privado com posições de teste configuradas de modo interativo (sem exibir a solução nas primeiras jogadas).
* **Sinal de domínio**: Pontuação superior a 70% do máximo possível na bateria.
* **SourceInfluence**: Yusupov (2007) (*Build Up Your Chess*), Khmelnitsky (2004) (*Chess Exam*).
* **Armadilha**: O jogador ser complacente consigo mesmo e dar pontos para lances incorretos ou não respeitar o temporizador.

---

### Entrega 4 - Blocos Novos ou Revisados (0->1200)

Blocos de treino criados/revisados para a fase ativa inicial do usuário (até 1200), prontos para a implementação:

| id | band | stage | signal | weakness | learningGoal | exerciseMode | recurso_lichess | sourceInfluence | microcopy_professor_lemos | avoid | criterio_de_progresso |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `0-600-fundamento-05` | `0-600` | `fundamento` | Concluiu os blocos de fundamentos elementares e deseja obter a primeira certificação. | Insegurança sobre regras especiais (roque, en passant, afogamento) antes de iniciar tática. | Passar no "Teste do Peão" para obter o Diploma do Peão. | `review` | Lichess Interactive Study (compilando testes de coordenadas, roque e mates básicos). | Tirado & Silva (1999) | "Chegou a hora do seu primeiro grande teste: o Diploma do Peão. Vou avaliar se você domina as coordenadas, as regras especiais e os mates elementares. Sem pressa, cada lance conta. Mostre que a base está sólida." | Chutar lances táticos antes de ter certeza das regras de captura e roque. | Acerto $\ge 90\%$ nas questões conceituais do Teste do Peão. |
| `600-1000-tatica-07` | `600-1000` | `tatica` | Acerta puzzles por tema isolado, mas comete blunders em partidas reais por falta de reflexão sobre os próprios erros. | Não rever os próprios erros, repetindo os mesmos blunders táticos ("pendências"). | Realizar o "Tratamento de Pendências" (re-resolver puzzles falhados e explicar verbalmente o motivo do erro). | `review` → `transfer` | Puzzle Replay (histórico de puzzles falhados do perfil Lichess) + Lichess Study de erros de partidas locais. | Gevorgyan (2024), Christofoletti (2007) | "Não adianta só acertar o que é fácil. O verdadeiro aprendizado está em olhar para os seus próprios erros. Vamos puxar suas 'pendências' táticas e resolvê-las. Quero que você comente em voz alta por que errou da primeira vez." | Tentar adivinhar a solução sem analisar por que o lance original falhou. | Resolução bem sucedida de 10 puzzles anteriormente falhados com classificação correta do tipo de erro em pelo menos 8 deles. |
| `600-1000-tatica-08` | `600-1000` | `tatica` | Concluiu todos os temas táticos curtos isolados e deseja validar sua antena tática. | Ansiedade ou hesitação em posições com tática mista sem indicação de tema. | Passar no "Teste da Torre" cobrando temas combinatórios integrados para obter o Diploma da Torre. | `review` | Lichess Study interativo com posições mistas (garfo, cravada, descoberto, sobrecarga). | Tirado & Silva (1999) | "Você já conhece os golpes táticos mais comuns. Agora, no Teste da Torre, o tabuleiro está limpo e eu não vou dizer qual é o tema. Use o scan DAMP e encontre a combinação vencedora para conquistar o seu segundo diploma." | Calcular lances muito complexos em posições que exigem apenas segurança material básica (LPDO). | Acerto de $\ge 80\%$ das combinações no Teste da Torre. |

---

### Entrega 5 - Lacunas, Redundâncias e Riscos

1. **Quais lacunas do método foram fechadas?**
   - **Metacognição e autoanálise**: Fechada com a prova científica (Gevorgyan 2024) de que a autorreflexão ativa sobre tarefas de casa falhadas é o estimulador número um de progressão.
   - **Pontes curriculares em português**: A lacuna de termos e rituais didáticos adaptados ao Brasil foi mitigada pelas estruturas de Tirado & Silva (1999) e Christofoletti (2007), introduzindo os Diplomas locais e o conceito de "Tratamento de Pendências".
   - **Validação de Ferramentas Digitais**: Zorić (2025) dá embasamento acadêmico direto para o uso pedagógico do Lichess como superior ao Chess.com e Stockfish para o estudante.
2. **Quais lacunas continuam abertas?**
   - **Tamanho e formatação dos testes**: A duração exata em minutos e quantidade ideal de posições para as baterias de "Score Test" ainda precisam ser calibradas de acordo com o tempo livre do usuário. **(I)**
   - **Integração automatizada da Lichess API**: Como extrair de forma nativa e sem fricção os puzzles falhados do perfil do jogador (precisa de validação de chamada da API pública de atividades de puzzles). **(P)**
3. **O que é redundante com as ondas anteriores?**
   - A cartilha do Ministério do Esporte, o Manual Sesc Cidadania e as regras básicas de Capablanca e Edward Lasker são altamente redundantes no que tange à movimentação das peças e regras elementares (que o usuário já domina). **(E)**
4. **O que deve ser descartado por risco legal, baixa qualidade ou incompatibilidade com Lichess?**
   - **Softwares Proprietários**: As instruções de Fritz e Swiss Manager devem ser ignoradas por não serem integradas ao Lichess e violarem o escopo local-first. **(P)**
   - **Documentos Irrelevantes**: O livro de mágica de Henry Evans, o documento de Bidding Chess e o manual de C64. **(P)**
   - **Uso Direto de Livros sob Copyright**: Yusupov, Khmelnitsky, Seirawan, Crouch, Soltis, Emms e Eade são mantidos em copyright. Suas posições, FEN, PGN, diagramas e textos literais **foram descartados por completo**, restando apenas as estruturas abstratas dos métodos de pontuação e taxonomia de erros. **(P)**
5. **Que fontes limpas deveriam confirmar ideias vindas de material em copyright?**
   - A técnica de testes estruturados com pontuação de Yusupov é confirmada pela teoria da Carga Cognitiva de Sweller (open access) e pela estrutura didática nacional de Tirado & Silva (1999). **(I)**
   - A taxonomia de fraquezas de Khmelnitsky é validada pela autopsicologia de Audryanskaya (2018) citada em Konevskikh (2022) e pelo Tratamento de Pendências de Christofoletti (2007). **(I)**

---

## 4. Avaliação Final

1. **Nota da rodada**: **8.5/10**. A rodada trouxe forte embasamento científico para os processos de revisão (erros/pendências) e consolidou uma estrutura didática nacional ("Diplomas") que resolve o progresso sem depender de rating.
2. **Nota por conjunto**:
   - **DeepSeek-downloads (Conjunto A)**: **8.0/10**. Os artigos acadêmicos (Gevorgyan, Zorić, Konevskikh) são excelentes, mas o conjunto veio com muitos PDFs redundantes ou fora de escopo (históricos/mágica/C64).
   - **ONDA 3 (Conjunto B)**: **9.0/10**. A adição do livro de Tirado & Silva e da dissertação de Christofoletti em português brasileiro forneceu um valor imediato e perfeitamente aplicável ao produto.
3. **Suficiência**: Esta rodada altera materialmente o método. Ela introduz a estrutura de milestones locais ("Diplomas"), formaliza o drill "Tratamento de Pendências" e valida empiricamente a reflexão ativa como prioridade de treino.
4. **Cobertura adicionada**:

| area | o_que_adicionou | forca | limite |
| :--- | :--- | :--- | :--- |
| **Metacognição / Revisão** | Prova empírica do valor de re-resolver exercícios falhados e verbalizar lances candidatos. | Muito Forte | Depende da disciplina do jogador em anotar/classificar erros sem pular etapas. |
| **Escada Curricular** | Marcos baseados em Diplomas (Peão, Torre, Rei) com testes sem rating. | Forte | Não prescreve posições físicas (apenas moldes abstratos). |
| **Defesa e Profilaxia** | Foco na resiliência psicológica e cálculo defensivo (1400-1800). | Média | Conceitos teóricos sob copyright exigem reconstrução autoral de posições. |

5. **Núcleo duro** (documentos essenciais):
   - Srbuhi Gevorgyan et al. (2024) - *Enhancing Chess Education through Interactive Teaching Strategies*
   - Danielle F. A. Christofoletti (2007) - *O Xadrez nos Contextos do Lazer, da Escola...*
   - Augusto Tirado & Wilson da Silva (1999) - *Meu Primeiro Livro de Xadrez*
   - Matije Z. Zorić (2025) - *Modern Chess Instruction in School*
6. **Arquivar/ignorar**:
   - Henry Ridgely Evans - *The Old and the new magic*
   - Urban Larsson - *Chess Endgames (Bidding Chess)*
   - Damian Lozano - *Falken Schach Manual*
   - Robert Willis - *Automaton Chess Player*
   - Thomas Hyde - *Mandragorias*
   - A. Livshitz - *Test Your Chess IQ* (corrompido)
7. **Prioridade de integração Codex**:
   - **Alta**: Atualizar `docs/pedagogy/metodo-consolidado-acervo-2026-06-09.md` para integrar a estrutura de Diplomas de Tirado & Silva e o Tratamento de Pendências de Christofoletti/Gevorgyan.
   - **Média**: Implementar as novas tipagens em `src/domain/types.ts` e calibrar o gerador de plano (`src/domain/plan/generatePlan.ts`) para incluir o drill de Tratamento de Pendências.
   - **Baixa**: Criar os blocos de treino 0-1200 atualizados em `src/trainingBlocks.ts`.

---

## 5. Próximos Passos para o Codex Integrar

1. **Atualizar Metodologia Consolidada**: O Codex deve ler `docs/pedagogy/metodo-consolidado-acervo-2026-06-09.md` e anexar os deltas aprovados nesta análise:
   - Adicionar os marcos de progresso **"Diploma do Peão"**, **"Diploma da Torre"** e **"Diploma do Rei"** como milestones de validação de banda.
   - Incorporar o drill **"Tratamento de Pendências"** no estágio de tática e cálculo.
2. **Atualizar Tipos Enxadrísticos**: Em `src/domain/types.ts`, expandir os tags e tipos de exercícios para dar suporte à classificação de erros (penduras, pressa, cálculo incorreto) e suporte a milestones de diplomas.
3. **Calibrar Gerador de Planos**: Modificar `src/domain/plan/generatePlan.ts` para que, ao identificar uma fraqueza em tática, o gerador priorize o drill de Tratamento de Pendências (puzzles falhados do histórico do jogador) antes de injetar novos blocos temáticos.
