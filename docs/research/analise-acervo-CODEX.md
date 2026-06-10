# Analise do Acervo (Onda 1 + Onda 2) - CODEX

Data de referencia: 2026-06-09  
Pesquisador: Codex  
Escopo: acervo local em `LIVROS XADREZ PARA CONSULTA/`, artefatos existentes do projeto e varredura tecnica dos arquivos no disco.

## Contagem confirmada

| item | contagem real | observacao |
|---|---:|---|
| Onda 1 - PDFs diretamente na raiz | 124 | Confirma a contagem usada no metodo consolidado. |
| Onda 2 - PDFs em `ONDA 2 LIVROS/` | 167 | O prompt esperava cerca de 91; o disco tem 167 PDFs. |
| Onda 2 - e-books nao-PDF | 68 | 42 `.azw3`, 25 `.azw`, 1 `.epub`; explicam a contagem 235 citada pelo Gemini. |
| Total estrito de PDFs analisaveis como PDF | 291 | 124 + 167. |
| Total de arquivos-livro no acervo das duas ondas | 359 | 124 PDFs da Onda 1 + 235 arquivos da Onda 2. |

Leitura tecnica: usei `pypdf`/`pdfplumber` porque `pdftotext` e `pdfinfo` nao estao instalados. Dos 291 PDFs, 250 tiveram texto extraivel nos primeiros blocos; 41 tiveram OCR fraco, scan pesado ou texto pouco extraivel. Cinco PDFs geraram erro de leitura parcial: `Chess_and_Children`, `How_Not_to_Play_Chess`, `Aperfeicoamento_no_Xadrez`, `Chess Tactics For Advanced Players` e `en passant Historias de Xadrez`. Para e-books `.azw/.azw3`, nao havia Calibre/`ebook-convert`; eles entram como catalogacao por nome/formato e como comparacao com os relatorios ja existentes. Nenhum texto bruto de PDF/e-book foi incorporado a este documento.

Artefatos lidos antes da sintese: `docs/pedagogy/metodo-consolidado-acervo-2026-06-09.md`, `analise-acervo-DEEPSEEK.md`, `analise-acervo-GEMINI.md`, `analise-acervo-ONDA2-DEEPSEEK.md`, `analise-acervo-ONDA2-GEMINI.md`, `docs/research/chess-literature/fichas-pedagogicas-batch1.md`, `docs/research/fichas_batch2.md`, `docs/research/fichas_batch3.md`.

Convencoes: **(E)** evidencia/consenso; **(I)** inferencia minha; **(P)** decisao de produto proposta, nao autoridade final.

## Passo 1 - Fichamento das duas ondas

### Fichas pedagogicas nucleares

| ficha | onda | titulo/autor | idioma/faixa/promessa | filosofia, sequencia, explicacao, exercicio, feedback | absorver, descartar, encaixe, Lichess, legal, valor marginal |
|---|---:|---|---|---|---|
| F01 | 1 + 2 | Capablanca, `Chess Fundamentals`; e-book PT-BR `Fundamentos do xadrez` | EN/PT-BR; 0-1200; ensinar o jogo por finais e principios antes de variantes. | Endgame-first. Comeca por mates/finais simples, depois principios e partidas. Explica com economia logica; exercita por posicoes-modelo e partidas; feedback e implicito pela clareza da demonstracao. | Absorver sequencia final -> principio -> partida. Descartar analise datada e qualquer texto literal. Encaixe: `0-600/fundamento`, `1000-1400/final`, `explain/guided`. Lichess: Learn, Practice Endgames, Studies. Legal: dominio publico provavel para original; traducoes verificar. Valor marginal: altissimo, ainda mais em PT-BR. |
| F02 | 1 | Maizelis `The Soviet Chess Primer`, Grishin `ABC of Chess`, Yusupov `Build Your Chess 1` | EN; 0-1500; curriculo sistematico de escola. | Escola sovietica: progresso graduado, exercicio depois de conceito, finais e geometria cedo. Feedback por precisao e score. | Absorver progressao milimetrica e verificacao por etapa. Descartar rigidez excessiva e densidade para iniciante absoluto. Encaixe: `fundamento/final/tatica`, `explain->guided->retrieval`. Lichess: Practice + Study. Legal: copyright/verificar. Valor marginal: alto para arquitetura curricular. |
| F03 | 1 | Heisman `A Guide to Chess Improvement`, `Back to Basics: Tactics`; Avni `Danger in Chess` | EN; 600-1600; parar de perder por processo ruim. | Safety-first e metacognicao. Sequencia: ver ameacas, pecas soltas, taticas basicas, analise propria. Explica por erro real; exercita por checklist; feedback nomeia erro de processo. | Absorver LPDO, pergunta "o que ele ameaca?", taxonomia anti-blunder. Descartar softwares antigos. Encaixe: `600-1000/seguranca`, `guided/review/transfer`. Lichess: Analysis pos-partida, Puzzle Themes. Legal: copyright. Valor marginal: essencial para o app pessoal. |
| F04 | 2 + e-books | Heisman `Is Your Move Safe?`; e-book `DAMP` de Claudio Nunes Duarte/Julio Lapertosa | EN/PT-BR; 600-1200; ritual pre-lance de seguranca. | Confirmam que seguranca nao e tema, e habito antes de soltar a peca. O e-book DAMP existe na Onda 2, mas nao como PDF; sem extracao de texto nesta execucao. | Absorver ritual curto em portugues, mas com confianca **media** para DAMP ate leitura completa do e-book. Descartar copia do acronimo se houver risco legal; reescrever como ritual proprio. Encaixe: `seguranca`, `guided->retrieval`. Lichess: partidas 10+5 + autoanalise. Legal: copyright. Valor marginal: alto para PT-BR, pendente de revisao direta. |
| F05 | 1 | Seirawan `Winning Chess` series | EN; 0-1600; ensinar o xadrez completo com linguagem acessivel. | Serie modular: fundamentos, taticas, estrategia, aberturas, finais e partidas. Explica por principios, exercita ao fim de capitulos, feedback por solucoes comentadas. | Absorver clareza e divisao em modulos. Descartar tom juvenil quando infantiliza. Encaixe: `0-1400`, `explain/guided`. Lichess: Learn, Practice, Studies. Legal: copyright. Valor marginal: alto como modelo de linguagem simples. |
| F06 | 1 | Fischer `Teaches Chess`, Chandler, Polgar, puzzle books basicos | EN; 0-1000; automatizar mate/tatica por padrao. | Instrucao programada e volume. Sequencia de mates e padroes curtos; explicacao minima; exercicio massivo; feedback binario. | Absorver microvariacao e repeticao curta. Descartar diagramas/exercicios e infantilizacao. Encaixe: `mate/tatica`, `guided/retrieval/review`. Lichess: mateIn1, mateIn2, Puzzle Streak. Legal: copyright. Valor marginal: bom, mas Lichess substitui o banco de problemas. |
| F07 | 1 | Hertan `Forcing Chess Moves`, Neiman `Tune Your Tactics Antenna`, Engqvist tatico | EN; 1000-1800; detectar forcas e sinais antes de calcular. | Separar antena tatica de calculo. Sequencia: gatilhos visuais, cheques/capturas/ameacas, posicoes-modelo. Feedback mostra por que o lance forcante era invisivel. | Absorver CCT e "detectar antes de calcular". Descartar dificuldade alta para 0-1000. Encaixe: `tatica`, `retrieval/review`. Lichess: Puzzle Streak, themes, mixed. Legal: copyright. Valor marginal: alto para transicao 1000+. |
| F08 | 2 | Woodpecker 1 e 2, `Tactics Time`, Justesen `Tactics Ladder` | EN; 800-1800; consolidar padroes por repeticao ciclica. | Repeticao do mesmo pool, medindo tempo e erro. Explica menos; treina automatismo. Feedback por acerto, tempo e repeticao de erro. | Absorver ciclo de replay dos erros reais. Descartar pools proprietarios. Encaixe: `tatica/review`, `retrieval->review`. Lichess: Puzzle Replay, Study privado com posicoes proprias/licitas. Legal: copyright. Valor marginal: altissimo para log local. |
| F09 | 2 | Marcio Lazzarotto `O Livro de Taticas de Xadrez` | PT-BR; 600-1400; explicar taticas com terminologia nacional. | Taticas por tema e dificuldade; explicacao em portugues; exercicios tematicos; feedback por solucao. | Absorver vocabulario PT-BR: garfo, cravada, espeto, desvio, sobrecarga. Descartar posicoes. Encaixe: `tatica`, `explain/guided`. Lichess: Practice + puzzle themes. Legal: copyright. Valor marginal: alto para microcopy. |
| F10 | 1 + 2 | Chernev, Euwe, Tal, Fischer 60, Carlsen 60, Soltis/Lakdawala move-by-move | EN/PT-BR parcial; 800-1800; aprender por partidas-modelo. | Narrativa lance a lance, pergunta implicita, momento critico. Exercita por prever lance/plano. Feedback compara plano humano e consequencia. | Absorver formato "partida pergunta-resposta" e "momento critico". Descartar comentarios textuais e analises pre-engine literais. Encaixe: `transferencia/plano`, `explain/review/transfer`. Lichess: Study interativo. Legal: misto; partidas antigas verificar, comentarios copyright. Valor marginal: alto para transferencia. |
| F11 | 1 | Silman, Stean, Watson, Nimzowitsch, Flores Rios, Shankland | EN; 1200-2200; pensar por desequilibrios, estruturas e planos. | Estrategia por elementos: imbalances, outposts, estruturas de peoes, excecoes modernas. Exercita avaliacao escrita e planos. Feedback por contraste entre plano e posicao. | Absorver avaliacao por estrutura so depois da seguranca. Descartar para <1200 como prioridade. Encaixe: `plano/estrutura/profilaxia`, `explain/review`. Lichess: Studies por estrutura. Legal: copyright; Nimzowitsch original PD provavel. Valor marginal: essencial acima de 1200. |
| F12 | 2 | Pachman PT-BR, Nimzowitsch PT-BR, Sakaev, Perelshteyn, Hawkins | PT-BR/EN; 1200-2000; dar ponte de estrategia avancada. | Estrategia sistematica, avaliacao escrita, finais como plano, peca ruim vs peca boa. Feedback por plano explicado. | Absorver vocabulario PT-BR de estrategia e "peca critica". Descartar densidade para fase ativa 0-1200. Encaixe: `estrutura/finais-tecnicos/plano`, `explain/review`. Lichess: Studies. Legal: copyright/traducao verificar. Valor marginal: alto para fases futuras. |
| F13 | 1 + 2 | Keres, Nunn, Willemze, de la Villa, Timman, Euwe-Hooper, Shereshevsky, Muller | EN/PT-BR; 1000-2200; finais essenciais e tecnicos. | Dois polos: final como tecnica essencial e final como estrategia. Sequencia material por material; exercicio por posicao-modelo; feedback por regra/falha tecnica. | Absorver curadoria essencialista de finais e plano em finais. Descartar manuais exaustivos para <1200. Encaixe: `final/finais-tecnicos/conversao`, `explain/guided/retrieval`. Lichess: Pawn/Rook Endgames, Tablebase para conferencia, Studies. Legal: copyright; posicoes teoricas comuns, comentarios nao. Valor marginal: muito alto. |
| F14 | 1 + 2 | Benjamin, Reinfeld, Aagaard, Edouard, Ramesh, Kotov, Chernyshov, Adams/Hurtado | EN; 1000-2200+; calcular melhor e decidir sem impulso. | Lances candidatos, CCT, visualizacao, escrita da variante, resposta do adversario. Exercita por problemas longos; feedback por erro de busca/profundidade. | Absorver candidato -> resposta adversaria -> verificacao. Descartar arvores rigidas e problemas GM para iniciante. Encaixe: `tatica` ate 1200; `calculo-profundo` 1400+. Lichess: Analysis sem engine, Puzzle Streak. Legal: copyright. Valor marginal: alto, mas faseado. |
| F15 | 1 + 2 | FCO, Watson Openings, Hellsten, Alburt, Sielecki, Moret, repertorios e MCO | EN; 1000-2200; aberturas por ideias ou repertorio. | Melhor tradicao: aberturas como planos e estruturas. Pior tradicao: enciclopedia de variantes. Exercicios raros; feedback por partida-modelo. | Absorver principios e transicao para meio-jogo. Descartar decoreba <1400. Encaixe: `abertura-principio`, `explain/transfer`. Lichess: Opening Practice/Studies, nao explorer como tarefa solta. Legal: copyright. Valor marginal: medio para 0-1200, alto depois. |
| F16 | 1 + 2 | Weeramantry, Van Delft, Giannatos, `Xad_na_esc`, `Como montar uma programacao...` e-book | EN/PT-BR; professor/designer; ensinar melhor. | Pedagogia de intervencao: diagnosticar aluno, uma ideia por licao, workbook, treino cronometrado. Feedback humano/socratico. | Absorver "ensinar o aluno, nao o livro" e time budget. Descartar material escolar infantil direto. Encaixe: transversal, `explain/guided/review`. Lichess: roteiros e Studies. Legal: copyright. Valor marginal: muito alto para o app como tutor. |
| F17 | 1 + 2 | Rowson, Gobet, Krogius, Schweitzer, Anand `Mind Master` | EN; 1200+; psicologia, vieses, nervosismo e estudo. | Meta-aprendizagem: tilt, imagem do adversario, tempo, desejo, foco. Poucos exercicios; feedback por nomear comportamento. | Absorver taxonomia de habitos, nao promessas cognitivas. Descartar autoajuda sem verificacao. Encaixe: `transferencia/defesa`, `review/transfer`. Lichess: revisao pos-partida. Legal: copyright. Valor marginal: medio-alto. |
| F18 | 1 + 2 | Vukovic, Marin, Hodgson PT-BR, `Ataque e Contra-Ataque` | EN/PT-BR; 1200-2000; ataque e defesa como tecnicas. | Ataque por pre-condicoes; defesa ativa; contra-ataque. Exercita por partidas e posicoes. Feedback por ataque prematuro ou defesa passiva. | Absorver "quando atacar" e "defender criando recurso". Descartar para <1200 exceto motivos simples. Encaixe: `defesa/profilaxia/plano`, `review`. Lichess: Studies. Legal: copyright. Valor marginal: fecha lacuna de defesa parcialmente. |
| F19 | 2 | Manuais PT-BR: Becker, Barden, Carvalho, Cabrerizo, Alvaro Pereira | PT-BR; 0-1000; ensinar regras e primeiros principios em lingua nativa. | Didatica enciclopedica/intro. Sequencia tradicional: regras, mate, abertura, tatica, finais. Exercicios variam. | Absorver terminologia e tom natural brasileiro. Descartar repeticao do que Lichess Learn faz melhor. Encaixe: `fundamento`, `explain`. Lichess: Learn/Practice. Legal: verificar. Valor marginal: alto para voz, medio para conteudo. |
| F20 | 2 | Series `Escola ... de Xadrez`, campeas mundiais, manuais de aberturas PT-BR em AZW/AZW3 | PT-BR; 1000-1800; aprender por modelos historicos e repertorios. | Partidas-modelo por jogador/escola, muito conteudo historico. Exercita por replay e pergunta "qual plano?". | Absorver selecao de estilos e diversidade, inclusive mulheres campeas. Descartar biografia extensa e comentarios sem licenca. Encaixe: `transferencia/plano`, `explain/review`. Lichess: Studies. Legal: verificar. Valor marginal: medio, bom para biblioteca futura. |
| F21 | 1 + 2 | Ficcao, historia geral, IA/computacao nao instrucional, KDP generico | EN/PT-BR; N/A ou 0-600; marketing, entretenimento ou historia. | Pouca ou nenhuma pedagogia enxadristica. | Absorver quase nada para o metodo. Arquivar. Encaixe: nenhum ou referencia cultural. Lichess: nao se aplica. Legal: copyright. Valor marginal: baixo. |

### Fichas coletivas de redundancia e descarte

| grupo | onda | exemplos | diagnostico pedagogico | decisao recomendada |
|---|---:|---|---|---|
| Manuais genericos `Chess for Beginners` e similares | 1 + 2 | Dave Schloss, Tammy May, Cory Klein, Maxen Tarafa, George Collins, varios pseudonimos | Redundantes: regras, valor das pecas, dicas rasas, pouca pratica e feedback fraco. | Arquivar. Lichess Learn + Becker/Barden/Capablanca PT cobrem melhor. |
| Livros de "ganhe de seus amigos" e armadilhas | 1 + 2 | `Beating Your Friends`, `How to Beat Anyone`, "deadly traps" | Incentivam dependencia de erro adversario e decoreba de truques. | Evitar como metodo. So usar como anti-pattern. |
| Enciclopedias de abertura e repertorios estreitos | 1 + 2 | MCO, Catalan, King's Indian, Pirc, London, Queen's Gambit, Caro-Kann | Bons para consulta 1400+, ruins como prioridade 0-1200. | Arquivar por abertura; entrar apenas quando o historico real pedir repertorio. |
| Panfletos/titulos Tim Sawyer e monografias de abertura-tatica | 2 | Caro-Kann Tactics, French Tactics, Ruy Lopez Tactics, Queen's Gambit Playbook | Valor local se a abertura for escolhida; excesso de especificidade. | Nao entram no metodo geral. |
| Bancos massivos de puzzles proprietarios | 1 + 2 | Polgar, Tactics Time, 1001, Woodpecker, Masetti, Erwich | Metodo de volume e repeticao vale; posicoes e solucoes nao entram no app. | Usar como influencia de formato, nunca como banco bruto. |
| Partidas-modelo historicas | 1 + 2 | Tartakower, Tal, Fischer, Carlsen, campeoes por escola | Boa cultura e transferencia, mas risco de comentarios protegidos. | Usar PGNs publicos/licitos e comentarios originais do app. |
| Ficcao/historia/computacao | 1 + 2 | `Chessmen of Doom`, `Luzhin Defense`, `Go To`, `Von Neumann`, historia medieval | Baixo valor para treino pessoal. | Arquivar fora do curriculo. |
| Materiais PT-BR de escola/criancas | 2 | `Xad_na_esc`, 113 exercicios, Kids/Kids Guide | Valiosos para sequencia e clareza, mas tom infantil. | Extrair estrutura didatica, adaptar voz adulta. |

## Passo 2 - Sintese do metodo

### Entrega 1 - O melhor de cada tradicao

| tradicao | o que acerta | o que erra/data | uma ideia que entra no metodo | faixa em que serve | confianca |
|---|---|---|---|---|---|
| Seguranca e anti-blunder | Heisman, Avni e `Is Your Move Safe?` mostram que o iniciante perde por nao ver ameacas e pecas soltas. | Pode virar checklist mecanico se nunca transferir para partida real. | Ritual pre-lance: pecas soltas, ameacas do adversario, seguranca do meu lance. | 0-1200 | alta (E) |
| Padroes taticos | Fischer, Chandler, Polgar, Seirawan, Lazzarotto e Neiman criam vocabulario visual. | Puzzles rotulados geram ilusao de competencia. | Tema rotulado primeiro; depois misto sem rotulo. | 0-1400 | alta (E) |
| Repeticao ciclica | Woodpecker e puzzle books mostram que repetir erro reduz latencia. | Decorar posicao visual sem entender pode virar falso dominio. | Repetir um pool de erros reais do Lichess ate acerto e tempo estabilizarem. | 800-1800 | alta (E/I) |
| Escola sovietica/finais primeiro | Capablanca, Maizelis, Keres, Shereshevsky e Yusupov dao estrutura e rigor. | Densa demais sem tutor; pode afastar autodidata. | Finais-modelo cedo, mas em blocos pequenos e mapeados ao Lichess. | 0-1600 | alta (E) |
| Partidas comentadas | Chernev, Euwe, Tal, Fischer e Seirawan ensinam transferencia e causa-efeito. | Leitura passiva sem pergunta vira entretenimento. | Study pergunta-resposta: prever lance, nomear momento critico, comparar. | 800-1800 | alta (E/I) |
| Estrategia por desequilibrios | Silman, Stean, Flores Rios, Watson, Shankland e Pachman organizam o meio-jogo. | Precoce para quem ainda pendura dama. | Estrategia so destrava apos seguranca e tatica curta; antes disso, plano simples de 2-3 lances. | 1200+ | alta (E) |
| Calculo e decisao | Benjamin, Hertan, Aagaard, Ramesh, Kotov e Chernyshov dao processo. | Aagaard/Kotov frustram abaixo de 1400; arvore rigida e datada. | Para 1000-1200: 2 candidatos e a melhor resposta adversaria; para 1400+: variantes escritas e profilaxia. | 1000+ | alta (E/I) |
| PT-BR adulto | Becker, Barden, Lazzarotto, Capablanca PT, Pachman PT, Euwe-Hooper PT dao idioma e ritmo local. | Muitos manuais PT-BR sao repetitivos ou densos. | Professor Lemos deve falar em portugues natural: garfo, cravada, espeto, peca solta, sem promessa de rating. | todos | alta (E) |
| Pedagogia/coaching | Weeramantry, Van Delft, Giannatos, `Como montar...` e `Xad_na_esc` tratam ensino como diagnostico. | Alguns materiais sao infantis ou escolares. | Uma sessao = uma fraqueza, uma ideia, uma tarefa, um criterio de conclusao. | todos | media-alta (E/I) |
| Defesa/profilaxia | Marin, Avni, Nimzowitsch, Ramesh e Shereshevsky lembram que defender e habilidade ativa. | A maioria e avancada demais para 0-1200. | Pergunta transversal: "o que o lance dele ameaca?" antes de atacar. | 1000+ | media (E/I) |

Delta sobre DeepSeek/Gemini: confirmo o nucleo do metodo consolidado, mas ajusto dois pontos. Primeiro, DAMP existe na Onda 2 como e-book nao-PDF; nao o trato como evidencia PDF verificada nesta execucao. Segundo, a Onda 2 nao torna o acervo "suficiente com folga" para 2200+: ela melhora muito calculo e PT-BR, mas defesa didatica intermediaria e repertorio simples em PT-BR ainda ficam como lacunas.

### Entrega 2 - Escada completa 0 -> nivel alto

| band | stage | objetivo_observavel | pre_requisito | criterio_de_avancar por sinal local | criterio_de_voltar | erro_tipico | livros_que_sustentam | confirma/muda | risco |
|---|---|---|---|---|---|---|---|---|---|
| 0-600 | fundamento | Mover pecas, reconhecer casas, dar xeque/mate simples, explicar regras especiais. | nenhum | 20+ acertos em coordenadas/pecas e explicar roque, promocao, afogamento. | erra regra basica ou confunde xeque/mate. | Avancar para tatica sem mapa do tabuleiro. | Capablanca, Becker, Barden, Seirawan, Maizelis. | confirma | Tedio se virar aula teorica. |
| 0-600 | seguranca | Ver peca solta propria e adversaria em poucos segundos. | regras basicas | >=80% em puzzles de peca pendurada e nenhuma troca absurda em revisao curta. | perde material limpo em partida lenta. | Olhar so para ataque proprio. | Heisman, Avni, Lazzarotto. | confirma | Checklist decorado sem uso em partida. |
| 600-1000 | mate | Reconhecer mate em 1 e redes simples de mate em 2. | seguranca minima | mateIn1 >=90%; mateIn2 >=70% em puzzles do Lichess. | deixa passar mate em 1 proprio ou adversario. | Parar apos o primeiro xeque. | Fischer, Chandler, Polgar, Seirawan. | confirma | Decorar nomes sem transferencia. |
| 600-1000 | tatica | Garfo, cravada, espeto, descoberto, eliminar defensor, sobrecarga basica. | mate e seguranca | rotulado >=80% e misto >=70% com primeira tentativa. | gap rotulado-misto >25 pontos. | So acerta quando o tema vem escrito. | Seirawan, Heisman, Polgar, Neiman, Lazzarotto. | confirma | Ilusao de competencia por puzzle tematico. |
| 800-1200 | tatica | Calcular 2-3 lances simples sem jogar o primeiro impulso. | taticas basicas | em 10 posicoes, listar 2 candidatos e resposta adversaria plausivel em >=70%. | blunders por resposta adversaria obvia. | Calculo unilateral. | Benjamin, Reinfeld, Hertan, Edouard Level 1, Ramesh. | **ajusto**: inserir ponte de calculo iniciante. | Pode ficar pesado; usar poucas posicoes. |
| 1000-1400 | final | Quadrado, oposicao, rei ativo, Lucena/Philidor como ideias. | tatica curta estavel | resolver finais basicos no Practice e explicar plano sem variantes longas. | perde final ganho por rei passivo. | Calcular tudo casa a casa. | Capablanca, de la Villa, Euwe-Hooper, Keres, Seirawan. | confirma + reforca Onda 2 | Finais de torre densos cedo demais. |
| 1000-1400 | abertura-principio | Jogar abertura com centro, desenvolvimento, roque e peca repetida sob controle. | seguranca e tatica minima | 10 partidas sem violar os 3 principios de forma grave. | dama cedo, rei no centro, varias pecas em casa. | Decorar variante. | Seirawan, Chernev, FCO, Alburt, Hellsten. | confirma | Explorer vira distração. |
| 1000-1400 | transferencia | Revisar partida encerrada, achar 1 momento critico e nomear erro. | algum historico real | 3 partidas revisadas com erro nomeado e treino derivado. | culpa azar ou engine sem autoanalise. | Ligar engine antes de pensar. | Chernev, Euwe, Heisman, Weeramantry. | confirma | Feedback vago sem acao. |
| 1400-1800 | plano | Avaliar estrutura, peca ruim, casa forte e plano de 2-3 lances. | blunders simples reduzidos | planos escritos batem com temas objetivos em partidas revisadas. | volta a pendurar material. | "Nao sei o que fazer" apos abertura. | Silman, Stean, Flores Rios, Pachman, Hawkins. | confirma | Estrategia antes de taticas. |
| 1400-1800 | profilaxia | Antecipar plano adversario e encontrar defesa ativa. | plano basico | em revisao, nomear ameaca adversaria antes de propor lance. | ataques sofridos por cegueira defensiva. | Defesa passiva. | Nimzowitsch, Marin, Avni, Ramesh. | reforca | Falta material simples para 1000-1400. |
| 1400-1800 | calculo-profundo | Listar candidatos, calcular variantes forcadas e registrar linha. | tatica mista madura | variantes escritas sem buracos obvios; erro cai em puzzles longos. | chute rapido em posicao critica. | Calcular so primeiro candidato. | Aagaard, Kotov, Ramesh, Edouard, Adams/Hurtado. | reforca Onda 2 | Frustracao por dificuldade GM. |
| 1800-2200 | finais-tecnicos | Converter vantagem, defender finais inferiores, saber tecnicas-chave. | finais basicos | conversao/defesa em estudos e partidas revisadas. | pressa em final superior. | "ganho sozinho" sem tecnica. | de la Villa, Shereshevsky, Nunn, Muller, Hawkins. | reforca | Dvoretsky completo ainda falta. |
| 2200+ | conversao | Autonomia de estudo, repertorio, analise profunda e preparacao. | 1800-2200 estavel | sinais locais definidos pelo proprio jogador/coach. | nao se aplica ao app atual. | excesso de conteudo. | Aagaard, Dvoretsky parcial, Watson, Sakaev. | esboco | Fora do escopo atual. |

### Entrega 3 - Biblioteca de drill formats

| nome | descricao_curta | passo_a_passo | band_alvo | stage_alvo | exerciseMode | como_mapear_no_lichess | sinal_de_dominio | livro_de_origem | armadilha |
|---|---|---|---|---|---|---|---|---|---|
| Varredura Peca Solta | Checar pecas sem defesa antes de calcular. | 1. Listar pecas minhas soltas. 2. Listar pecas dele soltas. 3. Ver capturas imediatas. | 0-1000 | seguranca | guided | Practice/Puzzles `hangingPiece`. | >=80% e queda de blunders. | Heisman, Avni | Fazer so quando o app manda. |
| Lance Seguro | Verificar se meu lance cria resposta tatica. | 1. Escolher candidato. 2. Depois do lance, listar cheques/capturas/ameacas dele. 3. Trocar candidato se houver refutacao. | 600-1200 | seguranca | guided->retrieval | Analysis sem engine antes/depois de partida. | 3 partidas sem peca limpa pendurada. | Heisman `Is Your Move Safe?`, DAMP e-book | Virar ritual longo em blitz. |
| Detectar Antes de Calcular | Nomear o motivo antes do lance. | 1. Olhar sinais: rei exposto, peca solta, alinhamento. 2. Nomear tema. 3. So entao calcular. | 600-1400 | tatica | explain->retrieval | Puzzle theme rotulado, depois mixed. | Tema correto antes do lance em >=80%. | Neiman, Engqvist | Procurar lance sem diagnostico. |
| Tema Rotulado -> Misto | Medir transferencia real. | 1. Fazer bloco tematico. 2. Fazer bloco misto. 3. Comparar gap. | 600-1400 | tatica | guided->retrieval | `/training/fork` -> Puzzle Streak/mixed. | Gap <15 pontos. | Polgar, Seirawan, Steps-like | Ficar so no tema facil. |
| CCT Curto | Cheques, capturas, ameacas para lances forcados. | 1. Listar cheques. 2. Capturas. 3. Ameacas. 4. Calcular a resposta forte. | 800-1400 | tatica | guided->retrieval | Puzzles forcados e Streak. | >=70% em posicoes sem rotulo. | Hertan, Benjamin, Ramesh | Calcular xeque ruim por obediencia cega. |
| Woodpecker Local | Repetir pool de erros reais. | 1. Selecionar 20-40 erros por tema. 2. Resolver com tempo. 3. Repetir em 3/7/14 dias. | 800-1800 | tatica | review | Puzzle Replay/OAuth ou Study privado com fonte licita. | Tempo cai e acerto sobe sem chute. | Woodpecker | Memorizar imagem e nao ideia. |
| Final Modelo Essencial | Aprender so final que decide partida. | 1. Ver regra. 2. Jogar no Practice. 3. Explicar plano. 4. Repetir lado oposto. | 1000-1600 | final | explain->guided->retrieval | Lichess Practice Pawn/Rook Endgames. | Explica regra e executa 2 vezes. | Capablanca, de la Villa, Euwe-Hooper | Saltar para torre complexo cedo. |
| Partida Momento Critico | Revisar jogo proprio como mini-aula. | 1. Abrir partida encerrada. 2. Sem engine, achar momento critico. 3. Nomear erro. 4. Conferir. | 800-1800 | transferencia | review->transfer | Lichess Analysis pos-partida. | 3 revisoes com erro e treino derivado. | Chernev, Euwe, Heisman | Ligar engine primeiro. |
| Pergunta Socratica | O aluno externaliza raciocinio. | 1. Perguntar plano. 2. Pedir motivo. 3. Apontar fraqueza criada. 4. Ajustar. | 1000-1800 | plano | guided->review | Study com comentarios/perguntas. | Resposta melhora entre revisoes. | Weeramantry, Silman | Bot dar resposta cedo. |
| Avaliacao Escrita | Escrever avaliacao curta antes da solucao. | 1. Posicao. 2. Escrever melhor lado, alvo, candidato. 3. Comparar. | 1200-2200 | estrutura | retrieval->review | Lichess Study/Analysis sem engine. | Avaliacao identifica alvo real. | Silman, Perelshteyn, Hawkins | Texto longo demais. |
| Visualizacao Cognitiva | Reconstruir posicao apos lances. | 1. Mostrar posicao simples. 2. Ditado de 3-6 lances. 3. Perguntar casa/peca. 4. Conferir. | 1000-1800 | calculo-profundo | retrieval | Coordinates + Study. | >=70% com poucas pecas. | Chernyshov, Justesen | Usar muitas pecas cedo. |
| Defesa Ativa | Defender criando recurso. | 1. Nomear ameaca. 2. Listar defesa passiva e ativa. 3. Escolher a que cria contrajogo. | 1200-1800 | defesa | guided->review | Studies de defesa, Analysis pos-partida. | Encontra recurso defensivo em revisao. | Marin, Avni, Ramesh | Defender tudo sem contrajogo. |
| Plano Por Estrutura | Estrutura de peoes vira plano. | 1. Nomear estrutura. 2. Alvo de cada lado. 3. Plano em 2-3 lances. | 1400-2200 | estrutura | explain->review | Studies por estrutura. | Plano coerente com estrutura. | Flores Rios, Shankland, Pachman | Aplicar em posicao tatica aguda. |
| Abertura Como Plano | Aprender ideia, nao linha. | 1. Centro/desenvolvimento/roque. 2. Estrutura tipica. 3. Partida modelo. | 1000-1600 | abertura-principio | explain->transfer | Study ou video direto + partida 10+5. | 10 partidas sem erro grave de principio. | FCO, Seirawan, Alburt, Hellsten | Memorizar variante do engine. |

### Entrega 4 - Blocos para o app (0->1200)

| id | band | stage | signal | weakness | learningGoal | exerciseMode | lichess_destino | tempo_min | sourceInfluence | avoid | criterio_conclusao | confianca | microcopy |
|---|---|---|---|---|---|---|---|---:|---|---|---|---|---|
| 0-600-fundamento-01 | 0-600 | fundamento | sem partidas ou dificuldade com casas | coordenadas e movimento instaveis | achar casas e mover as seis pecas | explain->guided | Lichess Learn + Coordinates | 10 | Capablanca, Becker, Seirawan | taticas antes de saber o mapa | 20 acertos em coordenadas e sem erro de movimento | alta | "Primeiro o mapa. Casa, peca, destino. Sem isso, qualquer plano vira chute." |
| 0-600-fundamento-02 | 0-600 | fundamento | confunde captura/valor | troca por impulso | entender captura e valor relativo | explain->guided | Lichess Learn Captures | 10 | Becker, Barden, Seirawan | decorar 1-3-3-5-9 sem olhar resposta | 10 capturas/trocas simples corretas | alta | "Material e conta simples, mas com uma pergunta: depois da troca, quem ficou melhor?" |
| 0-600-mate-01 | 0-600 | mate | sabe mover mas nao fecha partida | nao coordena rei/dama/torre | dar mate elementar sem afogar | guided | Practice Checkmates | 15 | Capablanca, Fischer | perseguir rei sem cortar fuga | 2 mates elementares concluidos | alta | "Corte as casas de fuga primeiro. O mate aparece quando o rei nao tem para onde respirar." |
| 0-600-fundamento-03 | 0-600 | fundamento | erros em roque/promocao/afogamento | regras especiais frouxas | explicar regra especial com exemplo | explain->guided | Lichess Learn Intermediate | 10 | Capablanca, manuais PT-BR | avancar sem entender afogamento | explicar roque, en passant, promocao e empate | media | "Regra especial so vira problema quando voce descobre tarde. Vamos deixar isso claro agora." |
| 0-600-seguranca-01 | 0-600 | seguranca | perde peca limpa | nao ve peca solta | detectar peca solta propria e alheia | explain->guided->retrieval | `/training/hangingPiece` | 15 | Heisman, Avni | atacar antes de checar seguranca | >=80% em 20 puzzles | alta | "Peca solta chama problema. Antes de atacar, veja o que esta sem defesa." |
| 0-600-seguranca-02 | 0-600 | seguranca | troca mal | nao calcula recaptura | avaliar troca simples | guided->retrieval | Puzzles advantage/hangingPiece | 10 | Seirawan, Becker | trocar porque pode | 15 trocas simples com justificativa | alta | "Nao e trocar por trocar. E perguntar: depois das capturas, o que sobrou para mim?" |
| 600-1000-mate-01 | 600-1000 | mate | nao ve mate em 1 | padroes de mate fracos | reconhecer mate imediato | guided->retrieval | `/training/mateIn1` | 10 | Fischer, Chandler, Lazzarotto | decorar nomes sem ver fuga do rei | >=90% em 30 mates | alta | "Mate em 1 nao perdoa. Olhe cheques, casas de fuga e defesa do rei." |
| 600-1000-mate-02 | 600-1000 | mate | para apos primeiro xeque | nao calcula mate em 2 | ver sacrificio e resposta forcada | guided->retrieval | `/training/mateIn2` | 15 | Fischer, Polgar, Chandler | sacrificar sem calcular resposta | >=70% em 25 mates em 2 | alta | "O primeiro lance aperta. O segundo fecha. Calcule os dois antes de jogar." |
| 600-1000-tatica-01 | 600-1000 | tatica | erra garfos | alvo duplo invisivel | encontrar garfos de cavalo, peao, bispo e dama | explain->guided->retrieval | Practice Fork -> `/training/fork` | 15 | Seirawan, Heisman, Lazzarotto | procurar so garfo de cavalo | >=80% rotulado, depois mixed | alta | "Garfo e ataque duplo. Nao procure so cavalo: peao, bispo e dama tambem fazem o servico." |
| 600-1000-tatica-02 | 600-1000 | tatica | erra alinhamentos | cravada/espeto confusos | diferenciar cravada e espeto | explain->guided | Practice Pin/Skewer | 15 | Seirawan, Lazzarotto | chamar tudo de cravada | 20 posicoes nomeadas corretamente | alta | "Alinhamento manda. Na cravada, a peca protege algo atras. No espeto, a peca valiosa foge e deixa a outra." |
| 600-1000-tatica-03 | 600-1000 | tatica | nao ve ataque descoberto | peca da frente bloqueia a mente | achar ataque/cheque descoberto | guided->retrieval | `/training/discoveredAttack` | 15 | Seirawan, Hertan | mover a peca da frente sem objetivo | >=75% em 20 puzzles | alta | "Quando uma peca sai da frente, outra acorda. Veja a linha escondida." |
| 600-1000-tatica-04 | 600-1000 | tatica | ataque falha por defensor | nao remove defesa | eliminar defensor do alvo | guided->retrieval | `/training/deflection` ou Practice | 15 | Polgar, Seirawan | capturar defensor sem ver recaptura | >=70% em 20 puzzles | media | "Antes de ganhar o alvo, pergunte quem esta defendendo. As vezes o primeiro lance tira o guarda." |
| 600-1000-seguranca-03 | 600-1000 | seguranca | seguranca basica ok, ainda pendura em partida | nao verifica o proprio lance | checar resposta adversaria apos meu lance | guided->transfer | Lichess Analysis sem engine + partidas 10+5 | 15 | Heisman, Avni, DAMP e-book | fazer checklist so em puzzle | 3 partidas revisadas com menos blunders de 1 lance | media-alta | "Depois do meu lance, o que ele ganha? Se a resposta for uma peca sua, volte um passo." |
| 600-1000-tatica-05 | 600-1000 | tatica | acerta tema isolado, erra misto | dependencia do rotulo | resolver tema misto | retrieval->review | Puzzle Streak ou `/training` mixed | 15 | Neiman, Woodpecker, Polgar | fazer so treino rotulado | mixed >=70% e gap <15 pontos | alta | "Agora sem placa dizendo o tema. Partida real nao avisa que tem garfo." |
| 800-1200-tatica-06 | 800-1200 | tatica | joga o primeiro lance | impulsividade | listar 2 candidatos e resposta forte | explain->guided->retrieval | Lichess Analysis sem engine | 20 | Benjamin, Reinfeld, Ramesh | calcular cinco lances quando dois bastam | 10 posicoes com 2 candidatos escritos | media-alta | "Dois caminhos antes da escolha. Para cada um, a melhor resposta dele. Depois voce decide." |
| 800-1200-tatica-07 | 800-1200 | tatica | repete erro de tema | padrao nao consolidado | repetir pool de erros reais | review | Puzzle Replay ou Study privado licito | 15 | Woodpecker | decorar imagem sem entender motivo | 3 ciclos com acerto subindo e tempo caindo | alta | "O erro volta ate virar conhecido. Nao e castigo: e memoria de trabalho virando reflexo." |
| 1000-1200-final-01 | 1000-1200 | final | erra corrida de peao | quadrado/oposicao fracos | dominar rei+peao vs rei | explain->guided->retrieval | Practice Pawn Endgames | 20 | Capablanca, de la Villa, Euwe-Hooper | calcular tudo sem regra | >=80% em finais de peao basicos | alta | "No final, o rei trabalha. Quadrado e oposicao economizam calculo." |
| 1000-1200-final-02 | 1000-1200 | final | final de torre vira caos | nao conhece ponte/defesa | entender Lucena e Philidor como ideias | explain->guided | Practice Rook Endgames | 20 | Keres, de la Villa, Seirawan | decorar linha sem plano | explicar ponte e defesa pela sexta | media | "Final de torre tem tecnica. Aprenda a ponte para ganhar e a barreira para segurar." |
| 1000-1200-abertura-principio-01 | 1000-1200 | abertura-principio | rei fica no centro, dama sai cedo | abertura sem principio | jogar 10 partidas com centro, desenvolvimento e roque | explain->transfer | Video/Study direto + partidas 10+5 | 20 | Seirawan, Chernev, FCO | memorizar variante | 10 partidas sem violacao grave de principio | alta | "Abertura e higiene: centro, pecas saindo, rei seguro. Variante vem depois." |
| 1000-1200-transferencia-01 | 1000-1200 | transferencia | repete mesmo erro | nao revisa partida propria | achar 1 momento critico e nomear erro | review->transfer | Lichess Analysis de partida terminada | 15 | Chernev, Euwe, Heisman, Weeramantry | engine antes de pensar | 3 partidas com erro nomeado e treino derivado | alta | "Uma partida, uma licao. Ache onde a historia virou e diga o nome do erro." |
| 1000-1200-plano-01 | 1000-1200 | plano | sem ideia apos abertura | plano simples ausente | formular plano de 2 lances por alvo claro | explain->guided | Study simples de partidas-modelo | 15 | Chernev, Stean, Seirawan | estrategia abstrata demais | plano em 1 frase para 5 posicoes simples | media | "Plano bom cabe numa frase: melhorar esta peca, atacar este alvo, impedir esta ideia." |

### Entrega 5 - Regras do gerador e lacunas

#### Regras SE/ENTAO

```text
SE sem dados reais OU primeiro uso
ENTAO stage=fundamento/seguranca; exerciseMode=explain->guided; tempo=10-15

SE perde_peca_limpa OU hanging_piece alto
ENTAO stage=seguranca; foco=peca_solita->lance_seguro; bloquear plano/abertura abstrata

SE mateIn1 < 90%
ENTAO stage=mate; foco=mateIn1; exerciseMode=guided->retrieval

SE mateIn1 >= 90% E mateIn2 < 70%
ENTAO stage=mate; foco=mateIn2; tempo=15

SE tema_tatico_rotulado < 80%
ENTAO stage=tatica; foco=tema_fraco; exerciseMode=explain/guided

SE tema_tatico_rotulado >= 80% E tema_misto < 70%
ENTAO stage=tatica; foco=misto_sem_rotulo; exerciseMode=retrieval

SE tema_misto >= 70% E tempo_medio_alto OU erro_recorrente
ENTAO stage=tatica; drill=Woodpecker_Local; exerciseMode=review

SE impulsividade OU erro_por_resposta_adversaria
ENTAO stage=tatica; drill=CCT_Curto/Lance_Seguro; tempo=15-20

SE finais_de_peao_errados
ENTAO stage=final; foco=quadrado/oposicao/rei_ativo; exerciseMode=explain->guided

SE abertura_ruim E seguranca_estavel
ENTAO stage=abertura-principio; foco=centro/desenvolvimento/roque; exerciseMode=explain->transfer

SE partida_terminada DISPONIVEL
ENTAO stage=transferencia; exerciseMode=review->transfer; tarefa=1_momento_critico

SE feedback=dificil
ENTAO regredir modo ou reduzir escopo

SE feedback=facil E acerto_real_estavel
ENTAO avancar para misto/review/transfer
```

#### Sinais de dominio por estagio

| stage | sinais_de_dominio | confianca |
|---|---|---|
| fundamento | regras explicadas, coordenadas suficientes, nenhuma confusao de movimento | alta |
| seguranca | reducao de pecas penduradas, acerto em `hangingPiece`, revisao mostra lance seguro | alta |
| mate | mateIn1 >=90%, mateIn2 >=70%, reconhece defesa/fuga | alta |
| tatica | tema rotulado >=80%, misto >=70%, primeira tentativa melhora | alta |
| final | executa final de peao e explica regra; entende plano de torre basico | alta |
| abertura-principio | 10 partidas sem dama cedo/rei preso/peca repetida sem motivo | media-alta |
| transferencia | 3 partidas com momento critico e erro nomeado | media |
| plano | plano em 1 frase coerente com alvo simples | media |
| estrutura/profilaxia/defesa | nomeia ameaca adversaria e recurso defensivo | media |
| calculo-profundo | candidatos escritos e resposta adversaria considerada | media |

#### Anti-patterns

- Prometer rating, QI, genialidade ou "mestre rapido".
- Usar rating como porta de avanco.
- Usar vitoria contra engine como criterio central.
- Abrir abertura por variantes antes de seguranca/tatica.
- Copiar texto, diagrama, posicao proprietaria, solucao ou lista numerada de livro.
- Fazer o app virar tabuleiro proprio ou ajuda em partida ao vivo.
- Dar feedback longo sem tarefa concreta.
- Usar Puzzle Theme rotulado como prova de transferencia.
- Deixar e-books KDP genericos poluirem a curadoria.

#### Lacunas para revisao humana

| lacuna | status apos Onda 1+2 | acao |
|---|---|---|
| DAMP e programacao de treino | existem como `.azw/.azw3`, nao lidos diretamente por falta de ferramenta local | converter/revisar manualmente antes de virar decisao forte |
| defesa 1000-1400 | parcialmente coberta; bons livros sao avancados | criar modulo proprio simples: ameaca do adversario -> defesa ativa |
| calculo intermediario 1000-1400 | melhorou com Edouard/Ramesh, mas ainda precisa graduacao | usar posicoes simples e poucos candidatos |
| repertorio PT-BR simples | ha manuais de abertura, mas risco de variantes | criar abordagem propria por principios |
| direitos de comentarios/posicoes | muitos livros protegidos | usar apenas principios e fontes publicas/CC0/Study proprio |
| OCR/arquivos problematicos | 41 PDFs fracos e 5 erros | revisao manual se algum virar fonte central |

#### Fontes de dominio publico provavel

Triagem, nao liberacao juridica final.

| titulo | autor | uso potencial | risco |
|---|---|---|---|
| `Chess Fundamentals` | Capablanca | finais, principios e partidas-modelo | traducoes modernas verificar |
| `My System` / `Chess Praxis` | Nimzowitsch | profilaxia, bloqueio, estrutura | traducao PT-BR verificar |
| Znosko-Borovsky varios | Eugene Znosko-Borovsky | erros comuns, combinacao, abertura, meio-jogo | edicoes/traducoes verificar |
| `The Art of Sacrifice` | Spielmann | taxonomia de sacrificio | edicoes verificar |
| Tarrasch/Lasker antigos | varios | principios classicos | confirmar edicao |
| Partidas historicas antigas | dominio comum em muitos casos | Studies com comentarios originais | direitos de bases/comentarios variam |

## Passo 3 - Avaliacao final e concordancia

### 1. Nota do acervo completo

Minha nota: **8.0/10** como base de um metodo inovador, simples e eficaz do zero ao alto nivel. Confianca: media-alta.

Comparacao: fico acima do DeepSeek (6.5) porque a Onda 2, incluindo e-books, fecha uma lacuna real de PT-BR, repeticao ciclica, finais essenciais e calculo avancado. Fico abaixo do Gemini (8.5/9.5) porque a biblioteca tambem tem muito ruido: manuais genericos, repertorios estreitos, ficcao, material sem extracao facil e muito copyright ativo. Para o app atual 0-1200, a base e mais que suficiente; para 1800-2200+, ainda e parcial.

### 2. Suficiencia

| escopo | suficiencia | motivo |
|---|---|---|
| App pessoal 0-1200 | sim | Fundamentos, seguranca, taticas, mates, finais basicos, abertura por principios e transferencia estao cobertos com redundancia util. |
| Metodo 0-1800 | sim/parcial | Conteudo existe, mas precisa curadoria e simplificacao forte. |
| Alto nivel 1800-2200+ | parcial | Aagaard, Ramesh, Dvoretsky parcial, Sakaev, Watson ajudam; faltam defesa e finais avancados completos com pipeline didatico. |
| Conteudo livre reutilizavel no app | parcial | Muito material e copyright; usar principios, nao conteudo. |

### 3. Cobertura por area

| area | forca_no_acervo | melhores_fontes | o_que_falta |
|---|---|---|---|
| Fundamentos | forte | Capablanca, Becker, Barden, Seirawan, Maizelis | pouco; so adaptar ao Lichess |
| Seguranca | forte | Heisman, Avni, `Is Your Move Safe?`, DAMP e-book | leitura direta do DAMP e versao propria limpa |
| Mate | forte | Fischer, Chandler, Polgar, Seirawan, Lichess | nada para 0-1200 |
| Tatica | muito forte | Seirawan, Heisman, Hertan, Neiman, Lazzarotto, Woodpecker | pipeline de transferencia misto |
| Calculo | forte | Benjamin, Hertan, Edouard, Ramesh, Aagaard, Kotov | graduacao 1000-1400 |
| Finais | muito forte | Capablanca, de la Villa, Euwe-Hooper, Keres, Nunn, Shereshevsky | simplificar torre para iniciante |
| Abertura | media | FCO, Seirawan, Alburt, Hellsten, Watson, Sielecki | repertorio PT-BR minimalista por principios |
| Estrategia | forte | Silman, Stean, Flores Rios, Pachman, Hawkins, Shankland | introducao leve 1000-1200 |
| Defesa/profilaxia | media | Marin, Avni, Nimzowitsch, Ramesh, Shereshevsky | defesa simples para 1000-1400 |
| Psicologia/habito | media-alta | Rowson, Gobet, Krogius, Schweitzer, Heisman | traduzir para micro-feedback sem psicologizar demais |
| Pedagogia | media-alta | Weeramantry, Van Delft, Giannatos, `Xad_na_esc` | converter AZW e validar tom adulto |
| PT-BR | forte | Becker, Barden, Lazzarotto, Pachman, Euwe-Hooper, Capablanca PT | revisar direitos e evitar copiar fraseado |

### 4. Concordancia com o metodo consolidado

| ponto | concordo/discordo/ajusto | justificativa |
|---|---|---|
| Progresso por sinal local, nao rating | concordo | E o ponto mais importante. O acervo apoia dominio por acerto, revisao e reducao de erro, nao promessa de rating. |
| Cinco `exerciseMode` fixos | concordo | Drill formats cobrem a variedade sem criar novos modos. |
| Seguranca antes de estrategia | concordo | Heisman/Avni/Seirawan reforcam. |
| Worked example antes de retrieval | concordo | Forte em Seirawan, Chernev, Maizelis, pedagogia geral. |
| DAMP como ritual central | ajusto | O arquivo existe como e-book nao-PDF; nao foi lido diretamente nesta execucao. Eu manteria como candidato/apoio PT-BR, nao como eixo ate revisao. |
| Woodpecker | concordo | A Onda 2 confirma fortemente repeticao ciclica de erros. |
| Calculo iniciante 800-1200 | ajusto | Deve existir como ponte, mas com stage `tatica` no modelo atual e poucos candidatos. |
| Suficiencia total 2200+ | discordo parcialmente | Ha material avancado bom, mas nao pipeline completo nem legalmente reutilizavel. |
| Nota Gemini alta | ajusto | A qualidade do nucleo e alta; a media do acervo e reduzida pelo ruido. |
| Nota DeepSeek baixa | ajusto | Onda 2 melhora demais PT-BR, final e calculo para ficar em 6.5. |

### 5. Avisos de lacuna

- Converter/revisar e-books `.azw/.azw3` centrais antes de qualquer decisao forte baseada neles.
- Construir defesa/profilaxia simples para 1000-1400 com linguagem propria.
- Evitar que livros avancados de calculo virem tarefas frustrantes.
- Criar regras de uso legal para PGNs, estudos e comentarios.
- Definir threshold real de dominio por tema no uso do dono.
- Testar microcopy PT-BR com o proprio uso, nao com gosto abstrato.

### 6. Redundancia e nucleo duro

Estimativa: **40-50% do acervo total e arquivavel para o metodo atual**. Se contar apenas a Onda 2 inteira (235 arquivos), a proporcao de ruido e maior por causa de KDP, monografias estreitas, ficcao e series historicas repetitivas.

Nucleo duro enxuto:

| funcao | fontes |
|---|---|
| Fundamento/final basico | Capablanca, Seirawan, Becker/Barden PT |
| Seguranca | Heisman, Avni, `Is Your Move Safe?`, Lazzarotto PT |
| Tatica/mate | Seirawan Tactics, Chandler, Fischer, Polgar, Neiman, Hertan |
| Repeticao | Woodpecker, Puzzle Replay Lichess |
| Finais | de la Villa, Euwe-Hooper PT, Keres, Nunn/Silman se disponivel |
| Transferencia | Chernev, Euwe, Weeramantry, Heisman |
| Estrategia 1200+ | Silman, Stean, Flores Rios, Pachman PT, Hawkins |
| Calculo 1200+ | Benjamin, Ramesh, Aagaard, Kotov, Edouard |
| Defesa/profilaxia | Avni, Marin, Nimzowitsch, Ramesh |
| Pedagogia | Van Delft, Giannatos, `Xad_na_esc`, `Como montar...` |

### 7. Veredito

Da para construir e implementar agora para 0-1200. O que priorizar:

1. Consolidar blocos 0-1200 com seguranca, mate, tatica, finais basicos, abertura por principios e transferencia.
2. Implementar drill formats como metadados, nao novos `exerciseMode`.
3. Usar DAMP apenas depois de leitura direta/conversao do e-book; enquanto isso, base verificada: Heisman/Avni/CCT curto.
4. Nao importar conteudo dos livros; usar Lichess como execucao e texto original do Professor Lemos.

## Proximos passos para integrar ao metodo consolidado

| arquivo/secao | acao recomendada |
|---|---|
| `docs/pedagogy/metodo-consolidado-acervo-2026-06-09.md` | Atualizar contagem real: PDFs 124 + 167, Onda2 completa 235 arquivos com 68 e-books. |
| mesma doc, decisao DAMP | Rebaixar para "candidato verificado por existencia de e-book; pendente de leitura direta" ou converter/revisar antes. |
| mesma doc, drill formats | Adicionar `Lance Seguro`, `Woodpecker Local`, `Final Modelo Essencial`, `Avaliacao Escrita`, `Defesa Ativa`. |
| `src/domain/types.ts` | Se implementar escada alta, adicionar apenas stages permitidos ja previstos; evitar criar `calculo` se o contrato usa `calculo-profundo`. |
| `src/domain/sources/catalogSkills.ts` | Mapear subskills: peca solta, lance seguro, mateIn1/2, garfo, cravada/espeto, descoberto, misto, final peao, abertura principio, revisao partida. |
| `src/domain/plan/generatePlan.ts` | Regras SE/ENTAO por sinal local, com trava de seguranca e tema misto apos rotulado. |
| testes | Cobrir: sem rating como gate, seguranca bloqueia plano abstrato, tema rotulado nao prova transferencia, feedback dificil reduz escopo. |
| memoria do projeto | Registrar que esta analise Codex e terceira voz e que os e-books nao-PDF mudam a contagem. |

---

Nota clean-room: este documento nao copia texto, diagramas, exercicios, linhas de variantes ou solucoes dos livros. Ele usa nomes de obras, metadados, categorias e sintese pedagogica original.
