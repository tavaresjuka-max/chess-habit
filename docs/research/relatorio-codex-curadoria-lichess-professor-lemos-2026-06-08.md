# Relatorio Codex - Curadoria Lichess para Professor Lemos

Data: 2026-06-08
IA pesquisadora: Codex
Projeto: lichess-tutor

## Metodo e limites

Pesquisa feita com paginas publicas do Lichess, documentacao oficial da API, fonte publica do projeto
Lichess/lila e busca manual responsavel. Nao foi feito scraping, nao foram baixados PGNs completos
de estudos, nao foram copiados textos integrais de estudos, comentarios, capitulos ou PGNs.

Regra de ranking adotada: recurso oficial do Lichess > tema de puzzle oficial > video direto e
especifico da biblioteca Lichess > estudo comunitario com utilidade pedagogica clara > pagina generica
ou estudo de qualidade incerta. Estudos comunitarios ficam, por padrao, em revisao humana antes de
entrar no catalogo ativo.

Fontes-base verificadas:

- Lichess Practice: https://lichess.org/practice
- Fonte oficial Practice: https://raw.githubusercontent.com/lichess-org/lila/master/modules/practice/src/main/PracticeSections.scala
- Puzzle Themes: https://lichess.org/training/themes
- Fonte oficial de temas: https://raw.githubusercontent.com/lichess-org/lila/master/translation/source/puzzleTheme.xml
- Lichess API Tips: https://lichess.org/page/api-tips
- Lichess API spec: https://github.com/lichess-org/api/blob/master/doc/specs/lichess-api.yaml
- Fair Play: https://lichess.org/page/fair-play
- Lichess Database: https://database.lichess.org/

## Achado 1

**Titulo:** Lichess Practice
**Tipo:** official-practice
**URL:** https://lichess.org/practice
**Autor/Fonte:** Lichess
**Valor:** A
**Tema principal:** trilha oficial de pratica guiada
**Fraquezas que treina:** mate-in-1, mate-in-2, fork, pin, skewer, discovered, endgame-pawn, endgame-rook, conversion, calculation
**Nivel sugerido:** misto
**Duracao estimada:** variavel
**Por que e util:** A pagina oficial agrupa Checkmates, Fundamental Tactics, Advanced Tactics, Pawn Endgames e Rook Endgames. E o melhor ponto de partida porque ja e interativo, mantido pelo Lichess e evita o app criar tabuleiro proprio. Serve como "catalogo raiz" para o Professor Lemos ranquear blocos por fraqueza.
**Quando o Professor Lemos deveria recomendar:** Quando o diagnostico mostrar uma fraqueza conceitual especifica e o aluno precisar de aula guiada antes de repetir puzzles soltos.
**Como implementar no app:** Manter catalogo estatico com `sectionId`, `studyId`, slug, `weaknessTags`, prioridade e URL direta. Ordenar Practice acima de estudos comunitarios.
**Dados necessarios:** `id`, `title`, `type`, `url`, `sectionId`, `studyId`, `weaknessTags`, `level`, `duration`, `lastVerifiedAt`.
**Riscos:** Interface/conteudo majoritariamente em ingles; estrutura pode mudar; progresso salvo no Lichess depende de conta, mas abrir o treino nao exige OAuth do app.
**Confianca:** alta

## Achado 2

**Titulo:** Lichess Learn - Chess basics
**Tipo:** official-practice
**URL:** https://lichess.org/learn
**Autor/Fonte:** Lichess
**Valor:** A
**Tema principal:** fundamentos basicos do xadrez
**Fraquezas que treina:** opening-principles, blunder-rate, defensive-awareness, other
**Nivel sugerido:** iniciante
**Duracao estimada:** media
**Por que e util:** E a entrada oficial para regras, movimento das pecas e conceitos iniciais. Para um aluno 0-800, pode corrigir lacunas antes de recomendar taticas mais especificas. O app so precisa abrir a pagina, sem reproduzir o conteudo.
**Quando o Professor Lemos deveria recomendar:** Primeiro uso, rating muito baixo, sinais manuais de duvida sobre regras, erros de roque/en passant/promocao ou baixa confianca declarada.
**Como implementar no app:** Entrada de catalogo de prioridade alta apenas para banda 0-800 e para fraquezas de regra/fundamento.
**Dados necessarios:** URL, tipo, nivel, tags de fraqueza, prioridade, observacao "sem OAuth".
**Riscos:** Link e pagina sao genericos; nao ha endpoint oficial para progresso do Learn no app.
**Confianca:** alta

## Achado 3

**Titulo:** Lichess Practice - The Fork
**Tipo:** official-practice
**URL:** https://lichess.org/practice/fundamental-tactics/the-fork/Qj281y1p
**Autor/Fonte:** Lichess
**Valor:** A
**Tema principal:** garfo / ataque duplo
**Fraquezas que treina:** fork, hanging-piece, calculation
**Nivel sugerido:** iniciante
**Duracao estimada:** curta
**Por que e util:** E uma aula oficial e focada para transformar a palavra "garfo" em padrao visual. Excelente antes de jogar o aluno direto em `/training/fork`, porque reduz tentativa e erro cego. Tambem treina atencao a pecas de alto valor simultaneamente atacadas.
**Quando o Professor Lemos deveria recomendar:** Depois de derrotas com perda de dama/torre por cavalo, alta taxa de blunders materiais ou erro recorrente em puzzles de `fork`.
**Como implementar no app:** Recurso primario para `fork`; depois recomendar uma bateria curta de puzzles `fork` ou `short`.
**Dados necessarios:** URL, `studyId=Qj281y1p`, `sectionId=fundamental-tactics`, `weaknessTags=["fork"]`, prioridade alta.
**Riscos:** Texto em ingles; o app nao deve copiar explicacoes ou PGN.
**Confianca:** alta

## Achado 4

**Titulo:** Lichess Practice - The Pin
**Tipo:** official-practice
**URL:** https://lichess.org/practice/fundamental-tactics/the-pin/9ogFv8Ac
**Autor/Fonte:** Lichess
**Valor:** A
**Tema principal:** cravada
**Fraquezas que treina:** pin, defensive-awareness, conversion
**Nivel sugerido:** iniciante
**Duracao estimada:** curta
**Por que e util:** Cravada e um motivo basico que aparece tanto em ganho de material quanto em defesa. O estudo oficial permite praticar a ideia em contexto guiado, sem depender de estudo comunitario. Bom para aprender tambem que peca cravada pode nao defender.
**Quando o Professor Lemos deveria recomendar:** Erros contra bispo/torre em linhas abertas, lances que deixam rei ou dama em linha, ou desempenho ruim em `pin`.
**Como implementar no app:** Recurso primario de `pin`; no ranking, parear com `xRayAttack` quando o aluno ja estiver no nivel 800-1200.
**Dados necessarios:** URL, `studyId=9ogFv8Ac`, tags, prioridade, idioma.
**Riscos:** Nao armazenar comentarios/linhas do estudo.
**Confianca:** alta

## Achado 5

**Titulo:** Lichess Practice - The Skewer
**Tipo:** official-practice
**URL:** https://lichess.org/practice/fundamental-tactics/the-skewer/tuoBxVE5
**Autor/Fonte:** Lichess
**Valor:** A
**Tema principal:** espeto
**Fraquezas que treina:** skewer, pin, calculation
**Nivel sugerido:** iniciante
**Duracao estimada:** curta
**Por que e util:** Espeto e confundido com cravada por iniciantes. A aula oficial ajuda a separar os dois conceitos e reforca leitura de linhas. E forte para quem perde material em diagonais/colunas por nao ver a peca atras.
**Quando o Professor Lemos deveria recomendar:** Baixa performance em `skewer`, erros em finais/posicoes abertas com rei exposto, ou confusao manual entre pin e skewer.
**Como implementar no app:** Recurso primario de `skewer`; seguir com puzzle theme `skewer`.
**Dados necessarios:** URL, `studyId=tuoBxVE5`, tags, prioridade, banda.
**Riscos:** Ingles; estrutura do Practice pode mudar.
**Confianca:** alta

## Achado 6

**Titulo:** Lichess Practice - Discovered Attacks
**Tipo:** official-practice
**URL:** https://lichess.org/practice/fundamental-tactics/discovered-attacks/MnsJEWnI
**Autor/Fonte:** Lichess
**Valor:** A
**Tema principal:** ataque descoberto
**Fraquezas que treina:** discovered, calculation, visualization, mate-in-2
**Nivel sugerido:** intermediario
**Duracao estimada:** curta
**Por que e util:** Ataque descoberto exige visualizar duas pecas trabalhando em sequencia. Para 800-1200, e uma ponte natural entre taticas de uma jogada e calculo de duas jogadas. O Lichess tambem tem `Double Check` como extensao do mesmo bloco.
**Quando o Professor Lemos deveria recomendar:** Quando o aluno acerta taticas simples mas falha em ameacas encadeadas, ou quando temas `discoveredAttack`/`discoveredCheck` aparecem fracos.
**Como implementar no app:** Recurso primario para `discovered`; se o aluno ja domina, sugerir `/training/discoveredAttack` e `/training/discoveredCheck`.
**Dados necessarios:** URL, `studyId=MnsJEWnI`, temas relacionados, nivel, prioridade.
**Riscos:** Nao copiar linhas; algumas posicoes podem exigir paciencia maior que blocos de 5 minutos.
**Confianca:** alta

## Achado 7

**Titulo:** Lichess Practice - Piece Checkmates I
**Tipo:** official-practice
**URL:** https://lichess.org/practice/checkmates/piece-checkmates-i/BJy6fEDf
**Autor/Fonte:** Lichess
**Valor:** A
**Tema principal:** mates basicos com pecas
**Fraquezas que treina:** mate-in-1, mate-in-2, conversion
**Nivel sugerido:** iniciante
**Duracao estimada:** media
**Por que e util:** Ensina o aluno a converter posicoes ganhas sem depender de engine ou tabuleiro proprio. E melhor que puzzle aleatorio quando o problema e "nao sei finalizar". O estudo irmao `Checkmate Patterns I` deve entrar logo depois no ranking.
**Quando o Professor Lemos deveria recomendar:** Vitorias perdidas por falta de conversao, erro em mate simples ou dificuldade declarada para finalizar.
**Como implementar no app:** Recurso primario para `mate-in-1` e fallback para `conversion` em 0-800.
**Dados necessarios:** URL, `studyId=BJy6fEDf`, tags, prioridade, duracao.
**Riscos:** Mates de tecnica podem ser mais longos que puzzles; calibrar bloco para 15/30 min.
**Confianca:** alta

## Achado 8

**Titulo:** Lichess Practice - Checkmate Patterns I
**Tipo:** official-practice
**URL:** https://lichess.org/practice/checkmates/checkmate-patterns-i/fE4k21MW
**Autor/Fonte:** Lichess
**Valor:** A
**Tema principal:** padroes de mate
**Fraquezas que treina:** mate-in-2, back-rank, calculation, visualization
**Nivel sugerido:** iniciante
**Duracao estimada:** media
**Por que e util:** Reforca reconhecimento de padroes antes de treinar `mateIn2` solto. Muito valioso para jogador que ve capturas, mas nao ve o rei como alvo. Deve ser preferido a estudos comunitarios de mate em 2 quando o objetivo e confiabilidade.
**Quando o Professor Lemos deveria recomendar:** Falhas em `mateIn2`, perda de oportunidades de mate, ou baixa precisao em ataques ao rei.
**Como implementar no app:** Recurso primario para `mate-in-2`; depois abrir `https://lichess.org/training/mateIn2`.
**Dados necessarios:** URL, `studyId=fE4k21MW`, tags, prioridade.
**Riscos:** Ingles; nao ha export de progresso para o app sem conta Lichess.
**Confianca:** alta

## Achado 9

**Titulo:** Lichess Practice - Key Squares
**Tipo:** official-practice
**URL:** https://lichess.org/practice/pawn-endgames/key-squares/xebrDvFe
**Autor/Fonte:** Lichess
**Valor:** A
**Tema principal:** finais de peoes
**Fraquezas que treina:** endgame-pawn, conversion, calculation
**Nivel sugerido:** iniciante
**Duracao estimada:** media
**Por que e util:** Casa-chave e fundamento de finais de peao. Para 0-1200, e uma das melhores maneiras de converter vantagem pequena sem decorar centenas de finais. O estudo `Opposition` deve aparecer como proximo passo.
**Quando o Professor Lemos deveria recomendar:** Derrotas/empates com peao a mais, dificuldade em finais K+P, ou fraqueza `pawnEndgame`.
**Como implementar no app:** Recurso primario para `endgame-pawn`; depois `Opposition` e puzzle theme `pawnEndgame`.
**Dados necessarios:** URL, `studyId=xebrDvFe`, sequencia recomendada, tags.
**Riscos:** Requer mais concentracao; evitar em bloco de 5 minutos se o aluno estiver cansado.
**Confianca:** alta

## Achado 10

**Titulo:** Lichess Practice - Basic Rook Endgames
**Tipo:** official-practice
**URL:** https://lichess.org/practice/rook-endgames/basic-rook-endgames/pqUSUw8Y
**Autor/Fonte:** Lichess
**Valor:** A
**Tema principal:** finais de torre basicos
**Fraquezas que treina:** endgame-rook, conversion, calculation
**Nivel sugerido:** intermediario
**Duracao estimada:** media
**Por que e util:** Lucena e Philidor aparecem como fundamentos praticos de finais de torre. Para 800-1200, e mais util que conteudo comunitario extenso porque e oficial e focado. Deve entrar quando o aluno ja entende finais de peao basicos.
**Quando o Professor Lemos deveria recomendar:** Empates perdidos em finais de torre, tendencia a trocar para finais sem plano, ou fraqueza `rookEndgame`.
**Como implementar no app:** Recurso primario para `endgame-rook`; usar somente apos algum progresso em `endgame-pawn`.
**Dados necessarios:** URL, `studyId=pqUSUw8Y`, pre-requisito, tags, prioridade.
**Riscos:** Conteudo pode ser pesado para iniciante absoluto.
**Confianca:** alta

## Achado 11

**Titulo:** Puzzle Theme - Hanging Piece
**Tipo:** puzzle-theme
**URL:** https://lichess.org/training/hangingPiece
**Autor/Fonte:** Lichess
**Valor:** A
**Tema principal:** peca pendurada
**Fraquezas que treina:** hanging-piece, blunder-rate, defensive-awareness
**Nivel sugerido:** iniciante
**Duracao estimada:** curta
**Por que e util:** E provavelmente o tema mais diretamente ligado a reducao de blunders em 0-1200. O aluno aprende a perguntar "o que ficou sem defesa?". Funciona bem em blocos curtos porque o motivo e claro e repetivel.
**Quando o Professor Lemos deveria recomendar:** Perda recorrente de material sem compensacao, erros manuais de "deixei uma peca", ou puzzle dashboard fraco em `hangingPiece`.
**Como implementar no app:** Recurso primario para `hanging-piece` e `blunder-rate`; prioridade alta em 0-800.
**Dados necessarios:** `themeSlug=hangingPiece`, URL, fraquezas, prioridade, ultima verificacao.
**Riscos:** Sem OAuth o app nao sabe resultado no Lichess; com OAuth usar apenas `puzzle:read`.
**Confianca:** alta

## Achado 12

**Titulo:** Puzzle Themes - Fork, Pin, Skewer, Discovered Attack
**Tipo:** puzzle-theme
**URL:** https://lichess.org/training/themes
**Autor/Fonte:** Lichess
**Valor:** A
**Tema principal:** motivos taticos fundamentais
**Fraquezas que treina:** fork, pin, skewer, discovered, calculation, visualization
**Nivel sugerido:** misto
**Duracao estimada:** curta
**Por que e util:** Os slugs oficiais `fork`, `pin`, `skewer`, `discoveredAttack` e `discoveredCheck` permitem treino tematico direto. Sao bons depois de uma licao de Practice, nao necessariamente antes. O catalogo pode usar a pagina de temas e o XML oficial como allowlist.
**Quando o Professor Lemos deveria recomendar:** Depois de uma fraqueza diagnosticada por tema ou quando o aluno completou uma aula Practice correspondente.
**Como implementar no app:** Criar entradas por slug e usar regra "conceito oficial primeiro, puzzle theme depois".
**Dados necessarios:** slug, URL, grupo do tema, fraquezas, prioridade, nivel sugerido.
**Riscos:** Validacao dinamica da lista por HTML nao e ideal; preferir allowlist curada e revalidacao manual.
**Confianca:** alta

## Achado 13

**Titulo:** Puzzle Themes - Mate in 1, Mate in 2, Back Rank Mate
**Tipo:** puzzle-theme
**URL:** https://lichess.org/training/mateIn2
**Autor/Fonte:** Lichess
**Valor:** A
**Tema principal:** reconhecimento de mate
**Fraquezas que treina:** mate-in-1, mate-in-2, back-rank, calculation
**Nivel sugerido:** iniciante
**Duracao estimada:** curta
**Por que e util:** `mateIn1`, `mateIn2` e `backRankMate` sao mapeamentos diretos para as fraquezas do Professor Lemos. Back rank e especialmente util porque mistura ataque e defesa. Deve ser treino frequente, mas em blocos curtos para evitar automatismo sem transferencia.
**Quando o Professor Lemos deveria recomendar:** Erros em puzzles de mate, falhas em ataques ao rei, ou partidas perdidas por mate na ultima fileira.
**Como implementar no app:** Entradas separadas: `mateIn1` para aquecimento, `mateIn2` para calculo curto, `backRankMate` para padrao recorrente.
**Dados necessarios:** slugs, URLs, fraquezas, dificuldade relativa, prioridade.
**Riscos:** Treino tematico pode dar pista demais; alternar com `mix` apos consolidar.
**Confianca:** alta

## Achado 14

**Titulo:** Puzzle Themes - Pawn Endgame and Rook Endgame
**Tipo:** puzzle-theme
**URL:** https://lichess.org/training/pawnEndgame
**Autor/Fonte:** Lichess
**Valor:** A
**Tema principal:** finais por tema
**Fraquezas que treina:** endgame-pawn, endgame-rook, conversion, calculation
**Nivel sugerido:** misto
**Duracao estimada:** curta
**Por que e util:** `pawnEndgame` e `rookEndgame` dao repeticao apos a aula conceitual do Practice. Para conversao, ajudam o aluno a transformar vantagem em plano. Devem ser usados com menos volume que taticas basicas, mas com revisao regular.
**Quando o Professor Lemos deveria recomendar:** Depois de blocos `Key Squares`, `Opposition` ou `Basic Rook Endgames`, ou quando o diagnostico mostrar erro em finais.
**Como implementar no app:** `pawnEndgame` antes de `rookEndgame`; usar `advancedPawn`, `promotion` e `zugzwang` como extensoes.
**Dados necessarios:** slugs, URL, pre-requisitos, fraquezas, duracao.
**Riscos:** Dificuldade pode variar muito; usar `difficulty=easier/normal` apenas se a API for usada com `puzzle:read`.
**Confianca:** alta

## Achado 15

**Titulo:** Puzzle Streak
**Tipo:** tool
**URL:** https://lichess.org/streak
**Autor/Fonte:** Lichess
**Valor:** A
**Tema principal:** precisao tatico-progressiva
**Fraquezas que treina:** blunder-rate, time-trouble, calculation, defensive-awareness
**Nivel sugerido:** misto
**Duracao estimada:** curta
**Por que e util:** Como nao e corrida pura, e melhor que Storm para calibrar precisao. Serve para aquecimento e para medir consistencia sem transformar tudo em velocidade. Bom para dias curtos.
**Quando o Professor Lemos deveria recomendar:** Sessao de 5-15 minutos, baixa consistencia recente, ou apos erro de blunder-rate.
**Como implementar no app:** Bloco de treino "sequencia sem pressa"; o app abre o link e registra autoavaliacao local.
**Dados necessarios:** URL, tipo, fraquezas, tempo recomendado, resultado manual opcional.
**Riscos:** Resultado automatico depende de OAuth/endpoint especifico; nao inferir score se o usuario nao informar.
**Confianca:** alta

## Achado 16

**Titulo:** Puzzle Storm
**Tipo:** tool
**URL:** https://lichess.org/storm
**Autor/Fonte:** Lichess
**Valor:** B
**Tema principal:** reconhecimento sob tempo
**Fraquezas que treina:** time-trouble, calculation, visualization
**Nivel sugerido:** intermediario
**Duracao estimada:** curta
**Por que e util:** E bom para rapidez de reconhecimento, mas pode piorar habitos de chute em iniciante. Deve entrar depois que o aluno ja tem precisao razoavel em Streak ou temas basicos. Valor alto para treinar pressao, nao para aprender conceito novo.
**Quando o Professor Lemos deveria recomendar:** Quando o diagnostico marca `time-trouble`, mas a precisao basica ja esta aceitavel.
**Como implementar no app:** Regra de ranking com pre-condicao: nao recomendar se `blunder-rate` estiver alto demais.
**Dados necessarios:** URL, tempo, fraquezas, pre-condicao de precisao, resultado manual opcional.
**Riscos:** Incentiva velocidade sem qualidade; nao usar como primeira recomendacao para iniciante.
**Confianca:** alta

## Achado 17

**Titulo:** Puzzle Dashboard e Improvement Areas
**Tipo:** tool
**URL:** https://lichess.org/training/dashboard/30/dashboard
**Autor/Fonte:** Lichess
**Valor:** A
**Tema principal:** desempenho pessoal em puzzles
**Fraquezas que treina:** other
**Nivel sugerido:** misto
**Duracao estimada:** variavel
**Por que e util:** O dashboard e o endpoint oficial `/api/puzzle/dashboard/{days}` agregam resultados por tema. Para o Professor Lemos, isso e o sinal mais limpo para mapear tema fraco sem armazenar PGN ou solucao. A janela de 30 dias e um bom default.
**Quando o Professor Lemos deveria recomendar:** Quando o usuario opta por OAuth e quer diagnostico mais fiel dos puzzles do Lichess.
**Como implementar no app:** Importacao opt-in com OAuth `puzzle:read`; salvar apenas agregados por tema, nao puzzle completo.
**Dados necessarios:** tema, tentativas, acertos/erros agregados, periodo, timestamp de sync, sem PGN.
**Riscos:** Depende de OAuth `puzzle:read`; tokens devem ficar locais e nunca em logs; requisicoes seriais.
**Confianca:** alta

## Achado 18

**Titulo:** Puzzles from player games
**Tipo:** tool
**URL:** https://lichess.org/training/of-player
**Autor/Fonte:** Lichess
**Valor:** B
**Tema principal:** puzzles derivados de jogos de um jogador
**Fraquezas que treina:** blunder-rate, conversion, calculation
**Nivel sugerido:** misto
**Duracao estimada:** variavel
**Por que e util:** Pode aumentar transferencia porque o treino parece "meus jogos". E util para dono que joga no Lichess, mas o projeto tambem usa Chess.com como diagnostico primario; portanto nao cobre todos os casos. Deve ser destino, nao fonte central.
**Quando o Professor Lemos deveria recomendar:** Usuario com conta Lichess ativa e interesse em revisar erros proprios no ecossistema Lichess.
**Como implementar no app:** Entrada de catalogo; abrir pagina publica. Se usar API de replay pessoal, escopo `puzzle:read`.
**Dados necessarios:** URL, username Lichess opcional, escolha do usuario, sem PGN.
**Riscos:** Nao serve para jogos Chess.com; risco de confundir com analise durante partida se mal contextualizado. Sempre dizer "partidas terminadas".
**Confianca:** media

## Achado 19

**Titulo:** Analysis Board
**Tipo:** tool
**URL:** https://lichess.org/analysis
**Autor/Fonte:** Lichess
**Valor:** A
**Tema principal:** revisao de partidas terminadas
**Fraquezas que treina:** conversion, blunder-rate, calculation, defensive-awareness, time-trouble
**Nivel sugerido:** misto
**Duracao estimada:** media
**Por que e util:** E a ferramenta oficial para revisar posicoes e partidas terminadas. Para o app, e destino de revisao, nao assistente de jogo. Pode virar bloco guiado: "abra sua partida terminada, marque 1 erro, escreva o motivo".
**Quando o Professor Lemos deveria recomendar:** Depois de uma partida finalizada, especialmente quando o plano do dia e revisao de erro ou conversao.
**Como implementar no app:** Entrada `analysis:finished-game-review`; microcopy sempre inclui "partida terminada". Nunca abrir/monitorar partida ao vivo.
**Dados necessarios:** URL, motivo da revisao, nota local do usuario, tags de fraqueza; nao salvar PGN completo.
**Riscos:** Fair play: proibido usar assistencia externa em partida em andamento. O app deve bloquear linguagem de lance ao vivo.
**Confianca:** alta

## Achado 20

**Titulo:** Lichess Video - Must-Know Opening Principles: Central Control
**Tipo:** video
**URL:** https://lichess.org/video/gpsZAim-mYc
**Autor/Fonte:** IM Alex Astaneh / Chessfactor na biblioteca Lichess
**Valor:** A
**Tema principal:** principios de abertura
**Fraquezas que treina:** opening-principles, blunder-rate
**Nivel sugerido:** iniciante
**Duracao estimada:** curta
**Por que e util:** Video direto e especifico, melhor que uma pagina generica de busca. Cobre o inicio da partida como principios, nao decoreba de repertorio. Bom para o app quando Chess.com mostra perdas cedo por desenvolvimento ruim.
**Quando o Professor Lemos deveria recomendar:** Erros frequentes nos primeiros lances, rei exposto, muitas perdas por nao desenvolver pecas, ou bloco de abertura do plano.
**Como implementar no app:** Recurso primario atual para `opening-principles`; guardar apenas URL e metadados.
**Dados necessarios:** URL, autor, idioma, tags, duracao estimada, fraqueza.
**Riscos:** Video em ingles; contem links externos/donativos na pagina; nao copiar transcript.
**Confianca:** alta

## Achado 21

**Titulo:** Lichess Video - How to identify Hanging Pieces
**Tipo:** video
**URL:** https://lichess.org/video/wod7uXzkrTc
**Autor/Fonte:** IM Alex Astaneh / Chessfactor na biblioteca Lichess
**Valor:** A
**Tema principal:** identificar pecas penduradas
**Fraquezas que treina:** hanging-piece, blunder-rate, defensive-awareness
**Nivel sugerido:** iniciante
**Duracao estimada:** curta
**Por que e util:** Excelente complemento ao tema `hangingPiece`, porque ensina a diferenca entre peca desprotegida e peca capturavel. Ajudaria o Professor Lemos a variar o treino quando o aluno erra por cegueira material.
**Quando o Professor Lemos deveria recomendar:** Antes ou depois de 10 puzzles `hangingPiece`, principalmente se o aluno nao entende por que perdeu material.
**Como implementar no app:** Entrada de video secundaria para `hanging-piece`; ranking abaixo de Practice/tema, acima de comunidade.
**Dados necessarios:** URL, autor, idioma, fraquezas, nota de risco de conteudo externo.
**Riscos:** Ingles e links externos; nao baixar PGN oferecido pelo autor.
**Confianca:** alta

## Achado 22

**Titulo:** Lichess Video - Incredible Fork Tactics for Beginners
**Tipo:** video
**URL:** https://lichess.org/video/mbiR0tcdqBY
**Autor/Fonte:** IM Alex Astaneh / Chessfactor na biblioteca Lichess
**Valor:** B
**Tema principal:** garfos para iniciantes
**Fraquezas que treina:** fork, calculation, visualization
**Nivel sugerido:** iniciante
**Duracao estimada:** curta
**Por que e util:** Bom reforco audiovisual para aluno que le pouco ou nao entendeu o Practice. Tem foco claro em fork e padroes taticos. Como e video, deve ser complemento, nao substituto da pratica ativa.
**Quando o Professor Lemos deveria recomendar:** Se o aluno falha em `fork` apos a aula oficial, ou prefere assistir antes de praticar.
**Como implementar no app:** Recurso secundario para `fork`; sugerir junto de `The Fork` e `/training/fork`.
**Dados necessarios:** URL, autor, fraqueza, idioma, prioridade.
**Riscos:** Links externos; nao copiar exemplos ou PGN.
**Confianca:** alta

## Achado 23

**Titulo:** Lichess Video - The 4 most important Pins in Chess
**Tipo:** video
**URL:** https://lichess.org/video/VjwSudAqLn8
**Autor/Fonte:** IM Alex Astaneh / Chessfactor na biblioteca Lichess
**Valor:** B
**Tema principal:** cravadas
**Fraquezas que treina:** pin, conversion, defensive-awareness
**Nivel sugerido:** iniciante
**Duracao estimada:** curta
**Por que e util:** Video direto sobre pin, especifico o bastante para catalogo. Bom para variar explicacao quando o aluno nao transfere o Practice para puzzles. Tambem pode ajudar a reconhecer defesas que falham por peca cravada.
**Quando o Professor Lemos deveria recomendar:** Depois de erros em `pin` ou como revisao leve em dia sem energia para estudo interativo.
**Como implementar no app:** Entrada `video:pin-important`; rank B por ser complemento.
**Dados necessarios:** URL, autor, tema, idioma, fraquezas.
**Riscos:** Conteudo de terceiros dentro da biblioteca Lichess; nao importar texto/PGN.
**Confianca:** alta

## Achado 24

**Titulo:** Lichess Video - The absolute and relative Skewer
**Tipo:** video
**URL:** https://lichess.org/video/ZexQ1kow1MM
**Autor/Fonte:** IM Alex Astaneh / Chessfactor na biblioteca Lichess
**Valor:** B
**Tema principal:** espetos absolutos e relativos
**Fraquezas que treina:** skewer, pin, calculation
**Nivel sugerido:** iniciante
**Duracao estimada:** curta
**Por que e util:** Ajuda a diferenciar skewer de pin, uma confusao comum. Deve ser usado como reforco audiovisual, especialmente quando a fraqueza e conceitual. O link e direto e especifico.
**Quando o Professor Lemos deveria recomendar:** Confusao entre cravada/espeto ou baixo resultado em `skewer`.
**Como implementar no app:** Entrada secundaria para `skewer`; combinar com Practice oficial e puzzle theme.
**Dados necessarios:** URL, autor, fraquezas, prioridade.
**Riscos:** Ingles; links externos.
**Confianca:** alta

## Achado 25

**Titulo:** Lichess Video - Creating multiple Threats with the Discovered Attack
**Tipo:** video
**URL:** https://lichess.org/video/nMADfn1scbI
**Autor/Fonte:** IM Alex Astaneh / Chessfactor na biblioteca Lichess
**Valor:** B
**Tema principal:** ataque descoberto
**Fraquezas que treina:** discovered, calculation, visualization
**Nivel sugerido:** intermediario
**Duracao estimada:** curta
**Por que e util:** Foca em ameacas multiplas, o que casa com a transicao para calculo. E um bom complemento se o aluno acerta motivos de uma jogada mas falha em combinacoes. Link direto e especifico.
**Quando o Professor Lemos deveria recomendar:** Depois de falhas em `discoveredAttack` ou quando o bloco de estudo e visualizacao.
**Como implementar no app:** Entrada secundaria para `discovered`; subir prioridade em 800-1200.
**Dados necessarios:** URL, autor, fraquezas, nivel.
**Riscos:** Conteudo externo/ingles; nao copiar transcript.
**Confianca:** alta

## Achado 26

**Titulo:** Lichess Video - The most important Mating Patterns in Chess
**Tipo:** video
**URL:** https://lichess.org/video/uhQhasudq9M
**Autor/Fonte:** IM Kostya Kavutskiy / Chessfactor na biblioteca Lichess
**Valor:** A
**Tema principal:** padroes de mate
**Fraquezas que treina:** mate-in-1, mate-in-2, back-rank, visualization
**Nivel sugerido:** iniciante
**Duracao estimada:** media
**Por que e util:** Cobre padroes de mate de forma concentrada e pode preparar o aluno para `mateIn2` e `backRankMate`. Para aluno visual, e um complemento forte ao Practice. Deve ser usado com resumo proprio do Professor Lemos, sem transcrever o video.
**Quando o Professor Lemos deveria recomendar:** Baixo desempenho em mate, perda de oportunidades de ataque ao rei, ou bloco de reconhecimento de padroes.
**Como implementar no app:** Recurso de video de alta prioridade para `mate-in-2` e `back-rank`.
**Dados necessarios:** URL, autor, fraquezas, duracao estimada, idioma.
**Riscos:** Ingles; links externos e PGN externo mencionado na pagina.
**Confianca:** alta

## Achado 27

**Titulo:** Lichess Video - Introduction to Pawn Endgames
**Tipo:** video
**URL:** https://lichess.org/video/QUqq7wSLE78
**Autor/Fonte:** GM Daniel Naroditsky na biblioteca Lichess
**Valor:** B
**Tema principal:** introducao a finais de peoes
**Fraquezas que treina:** endgame-pawn, conversion, calculation
**Nivel sugerido:** intermediario
**Duracao estimada:** media
**Por que e util:** Bom material de apoio para finais, especialmente quando o aluno precisa ouvir o raciocinio. Nao substitui `Key Squares` e `Opposition`, mas ajuda a dar contexto. O autor/fonte e verificavel na biblioteca Lichess.
**Quando o Professor Lemos deveria recomendar:** Depois de uma sessao de finais de peoes ou quando o aluno marca "nao entendi o plano".
**Como implementar no app:** Entrada secundaria para `endgame-pawn`; priorizar em blocos de 30/60 min.
**Dados necessarios:** URL, autor, fraquezas, duracao estimada.
**Riscos:** Ingles; video pode ser mais longo/menos direto que Practice.
**Confianca:** alta

## Achado 28

**Titulo:** Lichess Video - How to calculate the best Moves in Chess
**Tipo:** video
**URL:** https://lichess.org/video/-OoPm17P8xA
**Autor/Fonte:** IM Alex Astaneh / Chessfactor na biblioteca Lichess
**Valor:** B
**Tema principal:** tecnicas de calculo
**Fraquezas que treina:** calculation, visualization, blunder-rate
**Nivel sugerido:** intermediario
**Duracao estimada:** media
**Por que e util:** Ataca uma fraqueza transversal: nao basta conhecer o motivo se o aluno nao calcula candidatos. Bom para 800-1200, apos fundamentos de taticas. Nao e recurso inicial para 0-800.
**Quando o Professor Lemos deveria recomendar:** Quando o usuario acerta temas isolados, mas falha em puzzles longos ou escolhas candidatas.
**Como implementar no app:** Entrada de video para `calculation`; usar junto de puzzle themes `long`, `quietMove`, `intermezzo`.
**Dados necessarios:** URL, autor, nivel, fraquezas.
**Riscos:** Ingles; risco de passividade se nao for seguido por treino ativo.
**Confianca:** alta

## Achado 29

**Titulo:** Lichess Video - Useful Tips to avoid Blunders
**Tipo:** video
**URL:** https://lichess.org/video/AYy2A6HIcU0
**Autor/Fonte:** IM Kostya Kavutskiy / Chessfactor na biblioteca Lichess
**Valor:** B
**Tema principal:** evitar blunders
**Fraquezas que treina:** blunder-rate, hanging-piece, defensive-awareness
**Nivel sugerido:** iniciante
**Duracao estimada:** media
**Por que e util:** Complementa o tema `hangingPiece` com uma rotina mental mais ampla. Pode virar micro-habito do Professor Lemos: olhar ameacas, pecas desprotegidas e consequencias. E menos direto que Practice, mas pedagogicamente bom.
**Quando o Professor Lemos deveria recomendar:** Blunder-rate alto, derrotas por relaxamento em posicao ganha, ou feedback do usuario "entreguei peca de novo".
**Como implementar no app:** Entrada secundaria; apos video, bloco obrigatorio de 5 puzzles `hangingPiece` ou `defensiveMove`.
**Dados necessarios:** URL, autor, tags, prioridade, idioma.
**Riscos:** Ingles e links externos; nao copiar lista/roteiro integral.
**Confianca:** alta

## Achado 30

**Titulo:** Beginner: Tactics / Beginner: Simple Tactics I-II
**Tipo:** community-study
**URL:** https://lichess.org/study/Iof6LzcT
**Autor/Fonte:** jomega / comunidade Lichess
**Valor:** B
**Tema principal:** taticas basicas para iniciantes
**Fraquezas que treina:** hanging-piece, pin, fork, blunder-rate, calculation, defensive-awareness
**Nivel sugerido:** iniciante
**Duracao estimada:** longa
**Por que e util:** A serie aparece em topicos publicos do Lichess com alta relevancia e capitulos focados em fundamentos. Pode ser boa para estudo estruturado quando o Practice oficial for curto demais. Ainda assim, por ser comunitaria, deve passar por revisao humana antes de virar recomendacao automatica.
**Quando o Professor Lemos deveria recomendar:** Quando o aluno precisa de curso comunitario mais amplo de taticas basicas e aceita material em ingles.
**Como implementar no app:** Entrada `qualityStatus=needs-human-review`; rank abaixo de recursos oficiais. Guardar tambem links relacionados `https://lichess.org/study/s3iOCawc` e `https://lichess.org/study/6JAUFQ5p`.
**Dados necessarios:** URL, autor, titulo, temas, valor, status de revisao, sem conteudo dos capitulos.
**Riscos:** Licenca/conteudo nao explicitados; pagina pode mudar; evitar copiar textos, linhas e comentarios.
**Confianca:** media

## Achado 31

**Titulo:** Intermediate: Tactics Internalized
**Tipo:** community-study
**URL:** https://lichess.org/study/wzFrgluQ
**Autor/Fonte:** jomega / comunidade Lichess
**Valor:** B
**Tema principal:** internalizacao de motivos taticos
**Fraquezas que treina:** pin, skewer, fork, discovered, calculation, visualization
**Nivel sugerido:** intermediario
**Duracao estimada:** longa
**Por que e util:** A estrutura parece pedagogicamente orientada por motivo, com links/chapters para pin, skewer e outros temas. Bom para aluno 800-1200 que ja conhece o motivo mas nao transfere para jogo real. Nao deve entrar sem revisao de direitos/qualidade.
**Quando o Professor Lemos deveria recomendar:** Quando Practice + puzzles nao bastarem e o aluno quiser estudo mais conceitual.
**Como implementar no app:** Catalogar como estudo comunitario revisavel; nao usar como recurso primario automatico.
**Dados necessarios:** URL, autor, temas, status de revisao, data de verificacao.
**Riscos:** Conteudo comunitario; possiveis referencias externas/livros; nao exportar PGN nem copiar comentarios.
**Confianca:** media

## Achado 32

**Titulo:** Rook Endgames You Must Know!
**Tipo:** community-study
**URL:** https://lichess.org/study/bnboDhFM
**Autor/Fonte:** NoseKnowsAll / comunidade Lichess
**Valor:** B
**Tema principal:** finais de torre praticos
**Fraquezas que treina:** endgame-rook, conversion, calculation
**Nivel sugerido:** intermediario
**Duracao estimada:** longa
**Por que e util:** Estudo comunitario bastante especifico sobre finais de torre, com topicos como Philidor/Lucena e exercicios. Pode complementar o Practice oficial quando o aluno precisar de profundidade. Melhor para 1200+ ou para dono motivado, nao para iniciante absoluto.
**Quando o Professor Lemos deveria recomendar:** Depois de concluir `Basic Rook Endgames` oficial e ainda mostrar erros em finais de torre.
**Como implementar no app:** Entrada comunitaria B, `requiresHumanReview=true`, com prioridade menor que Practice.
**Dados necessarios:** URL, autor, tema, nivel, status de revisao, sem PGN.
**Riscos:** Conteudo comunitario sem licenca clara; possivel excesso de dificuldade.
**Confianca:** media

## Achado 33

**Titulo:** Mate in 2 CAN YOU SEE IT?
**Tipo:** community-study
**URL:** https://lichess.org/study/APSzIEsV
**Autor/Fonte:** Amazing_tactics / comunidade Lichess
**Valor:** C
**Tema principal:** mate em 2
**Fraquezas que treina:** mate-in-2, calculation, visualization
**Nivel sugerido:** misto
**Duracao estimada:** media
**Por que e util:** Tem foco direto em mate em 2 e organizacao por niveis, o que parece util. Mas a pagina tem bastante promocao/social e precisa de revisao de qualidade. O app ja tem opcoes oficiais melhores para a mesma fraqueza.
**Quando o Professor Lemos deveria recomendar:** Somente se revisao humana aprovar e se o aluno quiser variedade extra depois de `mateIn2`.
**Como implementar no app:** Manter em lista de candidatos, nao no catalogo ativo inicial.
**Dados necessarios:** URL, autor, tema, status `candidate`, motivo de cautela.
**Riscos:** Qualidade incerta, links/promocoes, possivel instabilidade, sem licenca clara.
**Confianca:** media

## Achado 34

**Titulo:** Practical Endings: Pawns (PART 1)
**Tipo:** community-study
**URL:** https://lichess.org/study/dXKWlrkg
**Autor/Fonte:** Blue_Knight5 / comunidade Lichess
**Valor:** D
**Tema principal:** finais de peoes
**Fraquezas que treina:** endgame-pawn, conversion
**Nivel sugerido:** avancado
**Duracao estimada:** longa
**Por que e util:** Parece extenso e organizado, mas a propria descricao aponta uso/adaptacao de livro de Paul Keres. Isso cria risco de direitos para um catalogo clean-room. Mesmo que a pagina publica exista, nao recomendo para o app sem revisao juridica/humana.
**Quando o Professor Lemos deveria recomendar:** Nao recomendar no catalogo inicial.
**Como implementar no app:** Registrar como descartado por risco de direitos; substituir por Practice oficial `Key Squares`, `Opposition` e video Naroditsky.
**Dados necessarios:** URL, motivo de descarte, data de verificacao.
**Riscos:** Direitos autorais, texto adaptado de livro, extensao alta, conteudo comunitario.
**Confianca:** alta

## Achado 35

**Titulo:** Pawn Endgames!
**Tipo:** community-study
**URL:** https://lichess.org/study/izZ71JC2
**Autor/Fonte:** Player9128 / comunidade Lichess
**Valor:** D
**Tema principal:** finais de peoes
**Fraquezas que treina:** endgame-pawn
**Nivel sugerido:** iniciante
**Duracao estimada:** media
**Por que e util:** O tema seria relevante, mas a pagina parece promocional/juvenil e nao demonstra curadoria pedagogica forte no trecho verificado. Ha recursos oficiais muito superiores. Deve ser descartado para evitar ruido no catalogo.
**Quando o Professor Lemos deveria recomendar:** Nao recomendar.
**Como implementar no app:** Lista de rejeicao/nao-recomendados para auditoria de qualidade.
**Dados necessarios:** URL, motivo de descarte, data.
**Riscos:** Qualidade duvidosa, tom desalinhado com produto adulto, links comunitarios, instabilidade.
**Confianca:** media

## Achado 36

**Titulo:** Lichess Puzzle API - Activity, Dashboard e Replay
**Tipo:** other
**URL:** https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/tags/puzzles/api-puzzle-dashboard-days.yaml
**Autor/Fonte:** Lichess API
**Valor:** A
**Tema principal:** diagnostico tecnico de puzzles
**Fraquezas que treina:** other
**Nivel sugerido:** misto
**Duracao estimada:** variavel
**Por que e util:** `/api/puzzle/activity` e `/api/puzzle/dashboard/{days}` permitem ler resultados pessoais de puzzles com OAuth `puzzle:read`. O dashboard agrega temas e permite recriar areas de melhoria. `/api/puzzle/replay/{days}/{theme}` pode ajudar a reabrir puzzles a revisar sem armazenar PGN.
**Quando o Professor Lemos deveria recomendar:** Nao e recurso de treino direto; e fonte de diagnostico opt-in.
**Como implementar no app:** OAuth PKCE local com escopo `puzzle:read`; serializar requisicoes; salvar somente agregados por tema e ids estritamente necessarios.
**Dados necessarios:** tema, win/loss agregado, rating aproximado do puzzle, data, id do puzzle se necessario para replay; sem PGN/solucao.
**Riscos:** Depende de OAuth; `puzzle:write` e proibido pelo projeto; nao usar endpoint para mass download; respeitar 429.
**Confianca:** alta

## Achado 37

**Titulo:** Lichess Studies API - criar Study e importar PGN
**Tipo:** other
**URL:** https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/tags/studies/api-study.yaml
**Autor/Fonte:** Lichess API
**Valor:** B
**Tema principal:** criacao opt-in de estudo privado do dia
**Fraquezas que treina:** other
**Nivel sugerido:** misto
**Duracao estimada:** variavel
**Por que e util:** `POST /api/study` cria estudo com OAuth `study:write`, e `POST /api/study/{studyId}/import-pgn` importa PGN em modos como practice/conceal/gamebook. Isso e viavel para um Study privado do dia, desde que o app gere material proprio/limpo e nao persista PGN completo.
**Quando o Professor Lemos deveria recomendar:** Quando o dono optar por criar um Study do dia no Lichess, nao como requisito do treino.
**Como implementar no app:** Fluxo opt-in com `study:write`, estudo privado/unlisted, sem escopos de jogo. Importar apenas PGN transiente criado pelo app ou posicoes limpas.
**Dados necessarios:** `studyId`, URL do estudo, nome, data, visibilidade, sem token em logs, sem PGN completo versionado.
**Riscos:** OAuth; limite de estudos/capitulos; risco de direitos se importar posicoes/textos de terceiros; nunca usar `study:read` sem necessidade.
**Confianca:** alta

## Achado 38

**Titulo:** Lichess Games/User API para diagnostico terminado
**Tipo:** other
**URL:** https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/tags/games/api-games-user-username.yaml
**Autor/Fonte:** Lichess API
**Valor:** B
**Tema principal:** sinais derivados de partidas terminadas
**Fraquezas que treina:** blunder-rate, conversion, opening-principles, time-trouble
**Nivel sugerido:** misto
**Duracao estimada:** variavel
**Por que e util:** O endpoint permite exportar jogos de usuario em PGN ou NDJSON, com filtros e opcao `finished=true`. Para o projeto, deve usar sinais derivados e evitar moves/PGN quando possivel. E secundario porque Chess.com e a fonte primaria atual do dono.
**Quando o Professor Lemos deveria recomendar:** Como diagnostico Lichess secundario, apenas para partidas terminadas.
**Como implementar no app:** Usar NDJSON, `finished=true`, `moves=false`, `pgnInJson=false`, `opening=true`, `accuracy=true` se necessario; descartar bruto.
**Dados necessarios:** resultado, ritmo, cor, abertura, acuracia agregada, data, sinais derivados; nao salvar PGN completo.
**Riscos:** Pode incluir jogo em andamento se filtros forem errados; fair play; streaming longo; respeitar rate limit.
**Confianca:** alta

# Mapa Consolidado De Temas De Puzzle

| Fraqueza Professor Lemos | Slugs Lichess recomendados | Prioridade | Observacao |
|---|---|---:|---|
| hanging-piece | `hangingPiece`, `trappedPiece`, `defensiveMove`, `oneMove`, `short` | Alta | Melhor entrada para reduzir blunders materiais. |
| fork | `fork`, `short`, `advantage`, `crushing` | Alta | Usar Practice The Fork antes de bateria tematica. |
| pin | `pin`, `xRayAttack`, `defensiveMove` | Alta | Complementar com estudo/video de cravada. |
| skewer | `skewer`, `xRayAttack`, `collinearMove` | Alta | Bom depois de pin, pois conceitos se confundem. |
| discovered | `discoveredAttack`, `discoveredCheck`, `doubleCheck`, `xRayAttack` | Alta | Ponte para visualizacao e calculo. |
| mate-in-1 | `mateIn1`, `oneMove`, `mate` | Alta | Aquecimento curto para 0-800. |
| mate-in-2 | `mateIn2`, `mate`, `doubleCheck`, `exposedKing`, `smotheredMate`, `short` | Alta | Alternar com mix para evitar pista tematica demais. |
| back-rank | `backRankMate`, `mateIn2`, `defensiveMove` | Alta | Usar tanto ofensivo quanto defensivo. |
| opening-principles | `opening`, `castling`, `attackingF2F7` | Media | Puzzles de abertura nao substituem aula de principios. |
| time-trouble | `oneMove`, `short`, `mix`; ferramenta `Puzzle Storm` | Media | Storm so apos precisao minima. |
| endgame-pawn | `pawnEndgame`, `advancedPawn`, `promotion`, `underPromotion`, `zugzwang` | Alta | Practice Key Squares/Opposition antes. |
| endgame-rook | `rookEndgame`, `queenRookEndgame`, `endgame` | Alta | Recomendado para 800-1200+ ou apos final de peao. |
| conversion | `advantage`, `crushing`, `capturingDefender`, `deflection`, `attraction`, `clearance`, `interference`, `intermezzo`, `quietMove`, `sacrifice` | Media | Usar com cuidado; varios sao avancados. |
| blunder-rate | `hangingPiece`, `defensiveMove`, `healthy mix`, `oneMove`, `short`, `crushing` | Alta | Misturar tematico e mix para transferencia. |
| calculation | `long`, `veryLong`, `quietMove`, `intermezzo`, `defensiveMove`, `advantage` | Media | Evitar para iniciante antes de motivos basicos. |
| visualization | `xRayAttack`, `discoveredAttack`, `discoveredCheck`, `long`, `veryLong`, `collinearMove` | Media | Subir gradualmente. |
| defensive-awareness | `defensiveMove`, `equality`, `backRankMate`, `exposedKing`, `trappedPiece`, `hangingPiece` | Alta | Bom para "o que o adversario ameaca?". |

# Resumo Executivo

## Top 10 Achados

1. Lichess Practice - The Fork
2. Lichess Practice - The Pin
3. Lichess Practice - The Skewer
4. Lichess Practice - Checkmate Patterns I
5. Puzzle Theme - Hanging Piece
6. Puzzle Themes - Mate in 1 / Mate in 2 / Back Rank Mate
7. Lichess Practice - Key Squares
8. Lichess Practice - Basic Rook Endgames
9. Puzzle Dashboard API com OAuth `puzzle:read`
10. Analysis Board para revisao de partidas terminadas

## Lacunas Encontradas

- Poucos recursos oficiais em PT-BR com link direto; a maior parte forte esta em ingles.
- Nao ha API oficial documentada para "buscar os melhores estudos comunitarios por qualidade pedagogica".
- Estudos comunitarios raramente declaram licenca; alguns citam/adaptam livros, criando risco clean-room.
- Paginas de video por tag sao genericas; o catalogo deve usar somente `/video/{id}`.
- Nao ha caminho permitido para o app registrar puzzles resolvidos via API: `puzzle:write` existe mas e proibido pelas regras do projeto.
- Nao ha base segura para recomendar qualquer ajuda durante jogo ao vivo; revisao so de partidas terminadas.
- Temas de conversion/calculation sao muito amplos; precisam de ranking por nivel e historico.

## Recomendacoes De Implementacao

- Criar ou manter catalogo estatico curado com prioridade: official Practice, puzzle theme, tool, direct video, community candidate.
- Usar `weaknessTags` como chave primaria de ranking e `level`/`duration` como filtros secundarios.
- Para cada fraqueza, recomendar primeiro uma aula/conceito oficial; depois puzzle theme; depois video ou estudo comunitario.
- Marcar estudos comunitarios com `qualityStatus: "needs-human-review"` ate revisao do dono.
- Usar OAuth somente opt-in: `puzzle:read` para dashboard/activity/replay e `study:write` para Study do dia.
- Nao usar `puzzle:write`, Board API, Bot API, Challenge API ou qualquer escopo de jogo.
- Implementar fila de requisicoes Lichess: uma requisicao por vez e pausa minima de 1 minuto em HTTP 429.

## Alertas Legais/API/Privacidade

- Nao armazenar PGN completo, transcript, comentarios de estudos ou solucoes de puzzles.
- Nao baixar estudos comunitarios em PGN para construir conteudo local.
- Lichess Database informa CC0 para exports, mas o produto atual nao deve criar tabuleiro proprio; usar como fonte tecnica futura exigiria decisao separada.
- Videos Lichess podem ter links externos, doacoes e PGN no site do autor; o app deve linkar o video, nao importar material externo.
- Estudos comunitarios com base em livros devem ser descartados ou passar por revisao juridica.
- Fair play: qualquer recurso de analise deve ser limitado a partidas terminadas.

## Sugestao De Estrutura De Dados

```ts
type CuratedResource = {
  id: string;
  title: string;
  type:
    | 'official-practice'
    | 'puzzle-theme'
    | 'community-study'
    | 'video'
    | 'tool'
    | 'article'
    | 'other';
  url: string;
  sourceName: string;
  author?: string;
  value: 'A' | 'B' | 'C' | 'D';
  official: boolean;
  weaknessTags: WeaknessTag[];
  puzzleThemeSlugs?: string[];
  level: 'iniciante' | 'intermediario' | 'avancado' | 'misto';
  estimatedDuration: 'curta' | 'media' | 'longa' | 'variavel';
  language?: 'pt-BR' | 'en' | 'other';
  requiresOAuth: boolean;
  oauthScopes: string[];
  qualityStatus: 'approved' | 'needs-human-review' | 'rejected';
  rightsRisk: 'low' | 'medium' | 'high';
  implementationMode: 'open-url' | 'api-read-aggregate' | 'create-study' | 'candidate-only';
  lastVerifiedAt: string;
  notes?: string;
};
```

Campos que nao devem existir no catalogo: PGN completo, comentarios copiados, solucoes, transcript,
token OAuth, dados pessoais de perfil, mensagens, partidas ao vivo.

## Perguntas Para Revisao Humana

1. O catalogo ativo deve aceitar videos em ingles como recomendacao normal, ou devem ficar como "extra" ate haver alternativa PT-BR?
2. Estudos comunitarios do jomega podem entrar como candidatos B apos revisao humana, ou o produto deve ficar 100% oficial na fase pessoal?
3. Para finais, o dono quer estudar conteudo mais longo comunitario ou manter apenas Practice + puzzles?
4. O app deve pedir `study:write` apenas no momento de criar o Study do dia, ou manter esse recurso escondido ate ser solicitado?
5. Qual o limite minimo de acerto antes de liberar Puzzle Storm como treino de `time-trouble`?
