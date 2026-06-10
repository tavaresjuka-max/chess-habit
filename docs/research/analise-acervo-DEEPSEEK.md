# Analise do Acervo - DEEPSEEK

**Data:** 2026-06-09
**Pesquisador:** DeepSeek (Claude como executor)
**Acervo analisado:** 124 livros de xadrez em PDF (~2.2 GB)
**Fichas completas:** `docs/research/chess-literature/fichas-pedagogicas-batch1.md`, `docs/research/fichas_batch2.md`, `docs/research/fichas_batch3.md`
**Documentos de apoio:** `docs/research/academic_evidence.md`, `docs/research/curriculum_map.md`, `docs/research/method_synthesis.md`

---

# PASSO 1 — Fichamento do Acervo

As fichas pedagogicas completas dos 124 livros estao nos 3 arquivos de batch (acima). Este documento foca no **Passo 2 (Sintese)** e **Passo 3 (Avaliacao)**.

**Resumo estatistico do acervo:**

| Metrica | Valor |
|---------|-------|
| Total de livros | 124 |
| Nota media (valor pedagogico) | 6.2 / 10 |
| Livros com nota >= 8 (excelentes) | 28 |
| Livros com nota <= 3 (fracos/descartaveis) | 19 |
| Redundantes com recursos Lichess gratuitos | 31 |
| Dominio publico provavel | 8 |
| Em copyright (uso pessoal apenas) | 116 |

---

# PASSO 2 — Sintese em Metodo Proprio

## Entrega 1 — O Melhor de Cada Tradicao

Agrupo os 124 livros por **filosofia de ensino** (como o autor acredita que se aprende xadrez), extraio a UMA ideia central de cada grupo e resolvo conflitos entre tradicoes.

### Grupo A: A ESCOLA DE PADROES (Pattern Recognition)

**Livros-chave:** Chandler (*How to Beat Your Dad*, *Chess Tactics for Kids*), Hertan (*Forcing Chess Moves*), Engqvist (*300 Most Important...*), Willemze (*1001 Endgame Exercises*), Polgar (*5334 Problems*), Neiman (*Tune Your Chess Tactics Antenna*), Fischer (*Bobby Fischer Teaches Chess*), Justesen (*Blindfold Endgame Visualization*)

**Tese central:** Xadrez se aprende por exposicao massiva a padroes. O cerebro e uma maquina de reconhecimento de padroes; quanto mais posicoes voce ve, mais rapido reconhece. Calcular e lento; reconhecer e instantaneo.

**O que acerta:** 
- Evidencia forte da psicologia cognitiva (Gobet & Simon, chunking). Experts reconhecem ~50.000 padroes.
- Funciona para tatica e finais. Ideal para 0-1400 onde partidas sao decididas por padroes nao reconhecidos.
- Chandler: nomear padroes ("Kiss of Death", "See-Saw") cria ganchos mnemonicos — (E) comprovado em pedagogia.

**O que erra/data:**
- Sem heuristica de pensamento: o aluno reconhece padroes mas nao sabe CALCULAR quando o padrao nao esta la.
- Risco de "decorar sem entender" — o aluno acerta puzzles mas nao transfere para partidas reais.

**A UMA ideia que entra no nosso metodo:**
> **Treino de reconhecimento separado do treino de calculo.** O aluno primeiro aprende a DETECTAR o padrao (Neiman: "tactics antenna") em posicoes rotuladas. Depois pratica CALCULAR em posicoes nao rotuladas. Isso resolve o conflito com a escola de calculo (Grupo D). **(E)** Forte apoio em Neiman, Engqvist, e na meta-analise de Burgoyne et al. (2016) sobre correlacao entre habilidade e processamento.

### Grupo B: A ESCOLA SOVIETICA (Sistematica, Finais-Primeiro, Estruturada)

**Livros-chave:** Maizelis (*The Soviet Chess Primer*), Alburt (*Chess Training Pocket Book*, *Russian Chess Masters*, *300 Positions*), Kotov (via tradicao), Yusupov (*Build Up Your Chess 1*), Grishin (*The ABC of Chess*), Dvoretsky (via tradicao), Keres (*Practical Chess Endings*)

**Tese central:** Xadrez e uma disciplina academica. Comeca-se pelos finais (poucas pecas = clareza de ideias), sobe-se para meio-jogo e so depois aberturas. Treino diario, plano fixo, exercicios graduados. O professor e essencial.

**O que acerta:**
- Sequencia finais-primeiro e a mais logica (confirmada por Capablanca, Lasker, Steps Method). Finais ensinam poder relativo das pecas e calculo exato.
- Enfase em "estudar seriamente" = deliberate practice. Evidencia forte: Charness et al. (2005).
- Maizelis (Soviet Primer) e o melhor livro-texto escolar ja escrito para iniciante — 50% exercicios, progressao milimetrica, zero salto logico.

**O que erra/data:**
- Dependia de infraestrutura estatal (treinadores, escolas dedicadas). O autodidata nao tem o "professor que corrige".
- Estilo sovietico pode ser arido para o aluno moderno acostumado a gamificacao.

**A UMA ideia que entra no nosso metodo:**
> **O app assume o papel do treinador sovietico: orquestrar, sequenciar, corrigir.** O app nao e so um recomendador de links — e o substituto do treinador ausente. A progressao "final basico → tatica → plano → abertura" e a espinha dorsal do metodo. **(E)** Consenso entre Soviet School, Capablanca, Steps Method. **(I)** O app pode fazer o que o treinador sovietico fazia: diagnosticar, prescrever, verificar, ajustar.

### Grupo C: A ESCOLA DE PRINCIPIOS E PLANOS (Strategic Understanding)

**Livros-chave:** Silman (*How to Reassess Your Chess*, *The Amateur's Mind*, *Complete Book of Chess Strategy*), Stean (*Simple Chess*), Watson (*Secrets of Modern Chess Strategy*, *Mastering Chess Openings*), Flores Rios (*Chess Structures*), Euwe (*Chess Master vs Chess Amateur*), Nimzowitsch (*My System & Chess Praxis*)

**Tese central:** Xadrez se aprende entendendo PRINCIPIOS e DESEQUILIBRIOS, nao decorando variantes. Avalie a posicao, identifique desequilibrios (bispo vs cavalo, estrutura, espaco, material, etc.), formule um plano. O "como pensar" e mais importante que o "o que jogar".

**O que acerta:**
- Silman: o sistema de imbalances e a melhor ferramenta de AVALIACAO de posicao ja inventada para jogador 1200-2000.
- Stean: *Simple Chess* prova que estrategia pode ser ensinada em 160 paginas. Nomeia conceitos com clareza (peao passado, maioria, torre na setima, bispo bom/mau).
- Watson: mostra que regras estrategicas tem excecoes — ensina a PENSAR, nao a obedecer regras.
- Flores Rios: conecta estrutura de peoes a plano — a lacuna que Silman deixa.

**O que erra/data:**
- Silman e inutil abaixo de 1200: o aluno de 800 perde pecas, nao por desequilibrio mal avaliado, mas por nao ver que a dama esta pendurada.
- Nimzowitsch e denso demais para <1800; sua prosa confunde mais que esclarece.
- Regras estrategicas do seculo XX (Watson) podem ser contraditas por engines modernas.

**A UMA ideia que entra no nosso metodo:**
> **Imbalances como ferramenta de AVALIACAO (1400+), nao de ENSINO (<1200).** Resolvo o conflito Silman vs Heisman (safety-first): para 0-1200, Heisman esta certo — primeiro nao perca pecas. Para 1400+, Silman esta certo — aprenda a avaliar. **(I)** A transicao ocorre quando o aluno para de perder material por nao ver ameacas simples. **(P)** O criterio de "subir de banda" deve incluir taxa de blunders <5% em partidas lentas.

### Grupo D: A ESCOLA DE CALCULO (Calculation and Decision-Making)

**Livros-chave:** Aagaard (*Inside the Chess Mind*, *Mastering Chess Exchanges*), Benjamin (*Better Thinking Better Chess*), Edouard (*Chess Calculation Training*), Reinfeld (*How to Think Ahead in Chess*), Kotov (via *Think Like a Grandmaster*), Shankland (*Small Steps to Giant Improvement*)

**Tese central:** Xadrez e CALCULO. Nao importa o que voce "sabe" — importa o que voce VE e CALCULA no tabuleiro. Treine a arvore de variantes, candidate moves, verificacao de lances.

**O que acerta:**
- Benjamin: diagnostica os vicios de pensamento do amador (trocar pecas sem motivo, nao ver lances do adversario, pressupor que o oponente vai jogar o que voce quer).
- Aagaard: exercicios de dificuldade extrema (exigem 20-30 minutos de calculo) — treina profundidade.
- Reinfeld: ensina a PENSAR ADIANTE (3-5 lances) com exercicios graduados.

**O que erra/data:**
- Aagaard e para 1800+ — frustrante para qualquer nivel abaixo.
- Kotov: a "arvore de variantes rigida" (um galho por vez, sem voltar) e irrealista — nem GMs pensam assim (evidencia: Gobet & Simon).
- Edouard: volume 1 e denso, exercicios com solucoes de 2 paginas.

**A UMA ideia que entra no nosso metodo:**
> **Checklist de pensamento em 3 passos para 600-1200: (1) O que o adversario ameaca? (2) Quais meus 2-3 lances candidatos? (3) Se eu jogar X, o que ele joga?** Isso e heuristica explicita (Trinchero & Sala 2016: metodo de ensino IMPORTA para transferencia). **(E)** Forte. Mais avancado (1400+): adicionar "Verifiquei capturas, cheques e ameacas em cada variante?" — checklist de Benjamin.

### Grupo E: A ESCOLA NARRATIVA (Learning from Games)

**Livros-chave:** Chernev (*Logical Chess Move by Move*, *Winning Chess*, *Chess Strategy and Tactics*), Tal (*Study Chess with Tal*), Tartakower (*500 Master Games*), Znosko-Borovsky (*The Art of Chess Combination*, *How Not to Play Chess*, *How to Play Chess Endings*, *How to Play the Chess Openings*, *The Middle Game in Chess*), Euwe (*Chess Master vs Chess Amateur*)

**Tese central:** Aprende-se xadrez vendo partidas de mestres comentadas lance a lance. A explicacao do "porque" de cada lance constroi intuicao. Nao ha exercicios — a partida inteira e o exercicio.

**O que acerta:**
- Chernev: *Logical Chess* e o livro mais amado por iniciantes ha 70 anos. O metodo "move by move" e brilhante: cada lance tem uma RAZAO explicada em linguagem simples.
- Tal: ensina ATACAR mostrando como o maior atacante PENSava — raro.
- Znosko-Borovsky: conjunto de 5 livros curtos que cobrem toda a cadeia (abertura, meio-jogo, finais, combinacao, erros comuns). Filosofia coerente: xadrez e compreensao, nao memoria.

**O que erra/data:**
- Analises pre-engine (Chernev, Tartakower): alguns lances sao objetivamente inferiores. Mas a PEDAGOGIA e atemporal.
- Znosko-Borovsky: estilo datado (1920-1930), exemplos de partidas desconhecidas para o aluno moderno.
- Sem exercicios ativos — e aprendizado passivo que requer complemento com pratica.

**A UMA ideia que entra no nosso metodo:**
> **O formato "partida comentada com pergunta ao leitor" como exercicio de transferencia.** No `exerciseMode: transfer`, o app apresenta uma partida curta do proprio aluno e pergunta "qual foi o momento critico?" — versao moderna do Chernev aplicada a partidas REAIS do usuario. **(E)** Consistente com deliberate practice e autoanalise (Charness 2005). **(P)** Implementar via Lichess Analysis + comentarios do Professor Lemos.

### Grupo F: A ESCOLA DE META-APRENDIZAGEM (How to Study)

**Livros-chave:** Heisman (*A Guide to Chess Improvement*), Rowson (*Chess for Zebras*), Lakdawala (*In the Zone*), Gobet (*The Psychology of Chess*), Krogius (*Psychology in Chess*), Avni (*Danger in Chess*)

**Tese central:** A maioria dos jogadores nao melhora porque estuda ERRADO — nao porque nao estuda. Aprender COMO estudar e mais importante que estudar mais.

**O que acerta:**
- Heisman: diagnostico de "hope chess" (jogar esperando que o adversario nao veja) como o vicio #1 do amador. Anti-patterns de estudo (jogar so blitz, nao analisar partidas, estudar aberturas demais).
- Rowson: xadrez como desenvolvimento pessoal. "Talk to your pieces" (converse com suas pecas — peca a cada uma o que ela quer fazer). Ideia de "não fazer" (deliberate non-action).
- Avni: unico livro dedicado a EVITAR BLUNDERS. Taxonomia de erros: otimismo, pressa, nao ver ameaca do adversario, complacencia.
- Gobet: evidencia cientifica — o que FUNCIONA e o que e MITO.

**O que erra/data:**
- Rowson: filosofico demais — o aluno de 800 precisa de tatica, nao de reflexao existencial.
- Krogius: psicologia sovietica dos anos 1970 — datada.

**A UMA ideia que entra no nosso metodo:**
> **O Professor Lemos como coach de META-APRENDIZAGEM, nao so de xadrez.** Alem de recomendar treinos, ele educa o aluno sobre COMO estudar: "Nao jogue so blitz", "Analise suas partidas antes de ligar a engine", "Voce esta jogando hope chess — esta assumindo que o adversario nao vai ver sua ameaca". **(I)** Isso diferencia o tutor de um mero recomendador de puzzles. **(E)** Forte apoio em Heisman, Rowson, Charness (deliberate practice > jogo livre).

### Grupo G: A ESCOLA DE ABERTURAS COMO PLANOS (Opening Strategy, Not Memorization)

**Livros-chave:** Watson (*Mastering the Chess Openings 3-4*), Hellsten (*Mastering Opening Strategy*), Van der Sterren (*FCO*), Seirawan (*Winning Chess Openings*), Alburt (*Chess Openings for Black Explained*), Sedlak (*Winning with the Modern London System*), De Firmian (*MCO*), Korn (*MCO*)

**Tese central:** Aberturas devem ser aprendidas como PLANOS e ESTRUTURAS, nao como sequencias de lances. Entenda as ideias tipicas e os planos de meio-jogo que emergem de cada abertura.

**O que acerta:**
- Watson: o melhor equilibrio entre explicacao conceitual e detalhe concreto. Ensina "por que" cada lance e conecta ao meio-jogo.
- Hellsten: exercicios estrategicos baseados em aberturas — une abertura a plano. Unico no genero.

**O que erra/data:**
- MCO (De Firmian, Korn): biblia de variantes — inutil e prejudicial para <1800. Decoreba pura.
- Sedlak: especifico demais (London System) — so serve se o aluno adotar essa abertura.

**A UMA ideia que entra no nosso metodo:**
> **Para <1200: ZERO variantes de abertura. So principios (centro, desenvolvimento, roque).** Para 1400+: introduzir UMA abertura por vez, estudada por PLANOS (Watson/Hellsten), nao por variantes (MCO). **(E)** Consenso entre todos os metodos (Steps, Soviet, Capablanca, Silman). **(I)** A primeira abertura a estudar deve ser a que o aluno ja joga naturalmente — detectar via historico de partidas.

### Resolucao de Conflitos Entre Tradicoes

| Conflito | Resolucao | Justificativa |
|----------|-----------|---------------|
| **Silman (imbalances) vs Heisman (safety-first)** | Heisman 0-1000, Silman 1400+. Transicao quando blunders <5%. | (I) Inferencia. (E) Apoio: Sala & Gobet (2017) — tatica decide partidas de iniciante. |
| **Fischer (programmed repetition) vs Nimzowitsch (sistema conceitual)** | Fischer 0-800, Nimzowitsch 1800+. O aluno precisa primeiro AUTOMATIZAR o basico para depois TEORIZAR. | (E) Apoio: deliberate practice > teoria para iniciantes (Charness 2005). |
| **Polgar (puzzles massivos) vs Kotov (calculo profundo)** | Polgar 0-1400 (volume), Kotov/Aagaard 1800+ (profundidade). Primeiro reconheca; depois calcule. | (I) Extrapolacao de Neiman (detectar antes de calcular). |
| **Chernev (passivo) vs Yusupov (ativo)** | Chernev 600-1200 (explicacao guiada), Yusupov 1400+ (autoestudo ativo). Worked examples antes de problema livre. | (E) Apoio: cognitive load theory (Sweller) — explain antes de retrieval para iniciantes. |
| **Tradicao vs Engine** | Analises pre-engine sao PEDAGOGICAMENTE validas mesmo quando tecnicamente imperfeitas. Chernev e Staunton ensinam COMO PENSAR. | (I) Decisao de produto: o valor pedagogico do "porque" humano supera a precisao da engine. |

---

## Entrega 2 — Escada Completa 0 -> Nivel Alto

Tabela `curriculo`. Convencoes: **(E)** = evidencia/consenso entre livros, **(I)** = inferencia minha, **(P)** = decisao de produto a confirmar.

### Banda 0-600: FUNDAMENTOS E SEGURANCA

| band | stage | objetivo_observavel | pre_requisito | criterio_de_avancar | criterio_de_voltar | erro_tipico | livros_que_sustentam | risco |
|------|-------|---------------------|---------------|---------------------|--------------------|-------------|---------------------|-------|
| 0-600 | fundamento-tabuleiro | Nomear casas por coordenadas. Mover as 6 pecas sem errar regra. | Nenhum | 100% acerto em mover cada peca em exercicio guiado | Não reconhece casa por coordenada | Confundir bispo com cavalo, nao saber roque | Capablanca (E), Maizelis (E), Lichess Learn (E) | Abandono por frustracao com notacao |
| 0-600 | fundamento-captura | Capturar peca desprotegida em 1 lance. Dar xeque e identificar 3 saidas. | Mover pecas | >90% acerto em 20 puzzles de captura simples | Erra captura obvia >30% | Nao ver que pode capturar | Capablanca (E), Maizelis (E) | Passar rapido demais |
| 0-600 | fundamento-mate-elementar | Dar mate de Rei+Dama e Rei+Torre em ate 20 lances contra rei sozinho. | Xeque e captura | Concluir 2 mates elementares em sequencia | Nao consegue mate de Rei+Dama | Perseguir o rei sem usar a dama como barreira | Capablanca (E), Maizelis (E), Lichess Practice (E) | Frustracao — e mais dificil do que parece |
| 0-600 | fundamento-regras | Roque, en passant, promocao, empates (afogamento, insuficiencia). | Mate elementar | Explicar com palavras proprias cada regra especial | Confunde afogamento com xeque-mate | Pensar que afogamento e mate | Capablanca (E), Blue Book of Chess (E) | Avancar sem dominar afogamento |
| 0-600 | seguranca-peca-pendurada | Identificar pecas desprotegidas (proprias e adversarias) em 5 segundos. | Regras completas | >90% acerto em 30 puzzles de peca pendurada | Erra >20% | Nao ver a propria peca pendurada | Heisman Back to Basics (E), Danger in Chess (E) | Vicio de nao ver o tabuleiro inteiro |
| 0-600 | seguranca-troca | Avaliar troca por valor material (1-3-3-5-9). | Peca pendurada | >80% acerto em trocas simples | Troca dama (9) por torre (5) achando que ganhou | Memorizar valores sem entender valor RELATIVO na posicao | Capablanca (E), Seirawan Play Winning Chess (E) | Automatizar sem pensar |

### Banda 600-1000: TATICA E MATES

| band | stage | objetivo_observavel | pre_requisito | criterio_de_avancar | criterio_de_voltar | erro_tipico | livros_que_sustentam | risco |
|------|-------|---------------------|---------------|---------------------|--------------------|-------------|---------------------|-------|
| 600-1000 | tatica-garfo | Encontrar garfo de cavalo, peao e dama em 1-2 lances. | Seguranca | >80% acerto em 30 puzzles de garfo (tema rotulado) | <60% acerto | So procura garfo de cavalo, ignora dama e peao | Seirawan (E), Chandler (E), Polgar (E), Steps Method (E) | Automatizar sem reconhecer em partida |
| 600-1000 | tatica-cravada | Identificar cravada absoluta e relativa. | Garfo | >80% acerto em 30 puzzles | <60% | Confundir cravada com espeto | Seirawan (E), Polgar (E), Steps Method (E), Huczek A to Z (E) | Decorar definicao sem aplicar |
| 600-1000 | tatica-espeto | Identificar espeto (skewer). | Cravada | >80% acerto em 30 puzzles | <60% | Ver cravada onde ha espeto | Seirawan (E), Polgar (E) | Baixa frequencia em puzzles |
| 600-1000 | tatica-descoberto | Encontrar ataque descoberto e cheque descoberto. | Espeto, cravada, garfo | >75% acerto em 25 puzzles | <50% | Nao ver que pode mover a peca da frente para qualquer casa | Hertan Forcing Chess Moves (E), Seirawan (E) | Dificil de detectar sem dica |
| 600-1000 | tatica-defensor | Eliminar o defensor (capturar peca que protege). | Ataque descoberto | >70% acerto em 20 puzzles | <40% | Capturar defensor sem calcular a sequencia seguinte | Polgar (E), Seirawan (E), Steps Method (E) | Requer calculo de 2-3 lances |
| 600-1000 | mate-padroes-1 | Reconhecer 10 padroes de mate em 1: beijo da morte, corredor, fundo, Legal, Greco, etc. | Taticas basicas | >90% acerto em mate em 1 (tema rotulado) | <70% | Nao ver mate em 1 do adversario | Chandler How to Beat Your Dad (E), Polgar (E), Lichess Practice (E) | Decorar nomes sem reconhecer |
| 600-1000 | mate-padroes-2 | Resolver mate em 2 com sacrificio. | Mate em 1 | >70% acerto | <40% | Calcular 1 lance e parar | Chandler (E), Polgar (E) | Frustracao com profundidade |
| 600-1000 | tatica-mix-sem-dica | Resolver puzzles de tema misto (garfo, cravada, espeto, descoberto, mate). | Todos os temas acima | >70% acerto em 50 puzzles sem rotulo | <50% | So encontrar o tema quando sabe qual e | Lichess Puzzle Streak/Storm (E), Polgar (E), Alburt (E) | Ilusao de competencia (acerta rotulado, erra misto) |

### Banda 1000-1400: FINAIS, ABERTURA POR PRINCIPIOS, CALCULO

| band | stage | objetivo_observavel | pre_requisito | criterio_de_avancar | criterio_de_voltar | erro_tipico | livros_que_sustentam | risco |
|------|-------|---------------------|---------------|---------------------|--------------------|-------------|---------------------|-------|
| 1000-1400 | final-peao | Quadrado do peao, oposicao, casas-chave, Rei+Peao vs Rei. | Tatica mix | >80% acerto em finais basicos de peao | Nao entende oposicao | Calcular casa por casa em vez de usar quadrado | Capablanca (E), Keres (E), Silman Endgame (E), Willemze (E) | Chato — alto risco de abandono |
| 1000-1400 | final-torre | Lucena, Philidor, torre atras do peao. | Final de peao | >70% acerto | Nao entende Lucena | Colocar torre na frente do peao (erro classico) | Silman (E), Keres (E), Nunn Endgame Exercise (E) | Muito tecnico para 1000 |
| 1000-1400 | final-dama | Dama vs peao na 7a. | Final de torre | Conceito compreendido | — | Subestimar peao na 7a | Silman (E), Keres (E) | Pouca frequencia em jogo real |
| 1000-1400 | abertura-principios | Explicar com palavras: centro, desenvolvimento, roque, nao mexer dama cedo, nao repetir peca. | Tatica mix | Jogar 10 partidas sem violar principios | Sai com dama no lance 3 | Decorar variante em vez de principio | Seirawan Play Winning Chess (E), Capablanca (E), Euwe (E) | Falsa sensacao de "ja sei aberturas" |
| 1000-1400 | calculo-candidatos | Listar 2-3 lances candidatos. Verificar ameacas do adversario apos cada lance proprio. | Abertura por principios | Aplicar checklist em 10 posicoes com >70% acerto | Joga o primeiro lance que ve | So ver os proprios lances, ignorar defesa | Benjamin (E), Reinfeld (E), Aagaard Exchanges (E) | Mecanizar checklist sem pensar |
| 1000-1400 | tatica-combinacao | Resolver combinacoes de 2-3 lances com sacrificio. | Todos os temas taticos | >60% acerto em puzzles de combinacao | <30% | Comecar pelo sacrificio sem calcular depois | Polgar (E), Znosko-Borovsky Art of Combination (E) | Frustracao — requer paciencia |
| 1000-1400 | transferencia-autoanalise | Analisar partida propria: identificar 1 momento critico e o tipo de erro. | Calculo-candidatos | Nomear corretamente o tipo de erro em 3 partidas seguidas | "Nao sei por que perdi" | Culpar "azar" ou "adversario forte" | Chernev Logical Chess (E), Heisman Guide (E), Euwe (E) | Desmotivacao ao ver os proprios erros |

### Banda 1400-1800 (ESBOCO)

| band | stage | nucleo | livros_que_sustentam |
|------|-------|--------|---------------------|
| 1400-1800 | estrategia-imbalances | Avaliar posicao por imbalances (Silman). Formular plano. | Silman (E), Stean (E), Flores Rios (E) |
| 1400-1800 | estrutura-peoes | Identificar estrutura e plano associado. Maioria de peoes, peao passado, cadeia, isolado. | Flores Rios (E), Shankland (E), Watson (E) |
| 1400-1800 | calculo-profundo | Calcular 4-6 lances com ramificacoes. Candidatos, verificacao dupla. | Aagaard (E), Edouard (E), Benjamin (E) |
| 1400-1800 | profilaxia | Perguntar "o que o adversario quer?" antes de cada lance. Restringir contra-jogo. | Nimzowitsch (E), Watson (E), Marin (E) |
| 1400-1800 | ataque-ao-rei | Ataque ao roque: sacrificios tematicos (Bxh7, Ng5, etc.), abrir colunas. | Vukovic (E), Tal (E), Lakdawala (E) |
| 1400-1800 | defesa | Defender posicoes dificeis. Defesa ativa vs passiva. | Marin (E), Avni (E) |
| 1400-1800 | aberturas-escolhidas | Estudar 1-2 aberturas por PLANOS (Watson), nao variantes (MCO). | Watson (E), Hellsten (E) |
| 1400-1800 | finais-tecnicos | Finais de bispos, cavalos, torres complexos. | Silman (E), Nunn (E), Muller (E) |

### Banda 1800-2200 (ESBOCO)

| band | stage | nucleo | livros_que_sustentam |
|------|-------|--------|---------------------|
| 1800-2200 | estrategia-avancada | Dinamismo, sacrificio posicional, compressao (squeeze). | Watson (E), Rowson (E), Lakdawala (E) |
| 1800-2200 | calculo-mestre | Visualizacao profunda, finais complexos calculados ate o fim. | Aagaard (E), Dvoretsky (E) |
| 1800-2200 | conversao | Converter vantagem: tecnica, simplificacao, sem pressa. | Muller (E), Nunn (E) |
| 1800-2200 | preparacao | Preparar repertorio, estudar adversarios. | Fora do escopo do app |

### Banda 2200+ (ESBOCO)

| band | stage | nucleo |
|------|-------|--------|
| 2200+ | maestria | Alem do escopo deste metodo. O aluno ja e autonomo. |

---

## Entrega 3 — Biblioteca de Formatos de Treino (drill_formats)

Tabela `drill_formats`: moldes abstratos reutilizaveis, sem copiar exercicios.

| nome | descricao_curta | passo_a_passo | band_alvo | stage_alvo | exerciseMode | como_mapear_no_lichess | sinal_de_dominio | livro_de_origem | armadilha |
|------|-----------------|---------------|-----------|------------|--------------|----------------------|-----------------|----------------|-----------|
| **Detectar-Antes-De-Calcular** | Separa reconhecimento de calculo. Primeiro o aluno so DETECTA qual tema tatico esta presente (sem achar o lance). Depois CALCULA a solucao. | 1. Mostrar posicao. 2. Perguntar: "Qual tema tatico?" (garfo, cravada...). 3. So depois: "Qual o lance?" | 600-1400 | tatica | explain → retrieval | Puzzle theme rotulado → Puzzle sem rotulo | Acerta o tema antes do lance em >80% | Neiman Tune Your Chess Tactics Antenna (E) | Pular etapa de deteccao — o aluno quer achar o lance rapido |
| **Candidato-Resposta-Defesa** | Treino de calculo: o aluno propoe 3 candidatos, calcula a melhor defesa do adversario para cada um, escolhe o melhor. | 1. Posicao sem dica. 2. Aluno lista 3 lances candidatos. 3. Para cada um, calcula a MELHOR resposta do adversario. 4. Escolhe o lance cuja pior consequencia e a melhor. 5. Confere com solucao. | 1000-1800 | calculo | retrieval → review | Lichess Analysis (modo "tente voce mesmo" sem engine) | Consegue prever a melhor defesa em >60% | Benjamin Better Thinking (E), Aagaard Inside the Chess Mind (E) | Listar candidatos sem calcular defesa |
| **Lance-Chave-Provado** | O aluno deve provar que seu lance candidato funciona contra TODAS as defesas razoaveis. | 1. Posicao tatica. 2. Aluno encontra lance candidato. 3. Lista todas as defesas possiveis do adversario. 4. Para cada defesa, mostra a continuacao vencedora. 5. Se uma defesa falhar, volta ao passo 2. | 1400-2200 | calculo/tatica | retrieval | Lichess Analysis com engine desligada (so depois liga para verificar) | Prova contra 3+ defesas em >50% | Aagaard (E), Dvoretsky (E), Edouard (E) | Aceitar "parece que ganha" sem verificar |
| **Worked-Example-Antes-De-Problema** | Explicacao guiada antes de exercicio. O aluno ve 2-3 exemplos resolvidos com explicacao, depois resolve 5-10 similares. | 1. Mostrar posicao-exemplo. 2. Explicar o conceito e o lance. 3. Repetir com 2-3 exemplos. 4. Aluno resolve 5-10 posicoes similares sozinho. | 0-1000 | todos | explain → guided → retrieval | Lichess Practice (ja e worked example interativo) | Acerto >80% nos primeiros 5 exercicios apos exemplos | Cognitive Load Theory (E), Steps Method (E), Capablanca (E) | Exemplo demais, pratica de menos |
| **Partida-Pergunta-Resposta** | Partida comentada onde o texto PARA e pergunta ao leitor "o que voce jogaria aqui?" antes de revelar o lance. | 1. Mostrar partida ate momento critico. 2. Parar e perguntar: "O que jogar aqui? Por que?" 3. Aluno decide. 4. Revelar o lance do mestre + explicacao. 5. Continuar partida. | 1000-1800 | transferencia | explain → retrieval | Lichess Study interativo com perguntas nos comentarios | Antecipa o lance do mestre em >40% | Chernev Logical Chess (E), Tal Study Chess with Tal (E), Euwe (E) | Ler a resposta sem pensar — modo passivo |
| **Posicao-Modelo-Estudo-Ativo** | Memorizar posicoes arquetipicas cobrindo o texto e tentando articular o plano/padrao antes de ler. | 1. Diagrama da posicao-modelo. 2. Cobrir texto. 3. Observar 1-2 min. 4. Dizer em voz alta: "O plano e X. Os lances seriam Y." 5. Descobrir e comparar com o texto. 6. Revisitar em 1 dia, 3 dias, 1 semana. | 1200-2200 | estrategia/plano | explain → review | Lichess Study com capitulos por posicao-modelo (spaced repetition manual) | Recorda plano correto em >70% na primeira revisao espacada | Engqvist 300 Positions (E), Alburt Pocket Book (E) | Decorar o diagrama sem entender o conceito |
| **Jogue-Como-Mestre** | O aluno joga o lado vencedor de uma partida classica contra a engine no lado perdedor. A engine joga os lances historicos do perdedor. | 1. Partida classica carregada. 2. Aluno joga o lado do vencedor. 3. Engine joga o lado do perdedor (com os lances historicos). 4. Se o aluno desviar do script, a engine responde naturalmente. 5. Comparar com a partida original apos. | 1200-2000 | transferencia | transfer | Lichess Board Editor + Play with Friend / Engine | Vence a engine em posicao ganhadora | Tal (E), Tartakower (E), Euwe (E) | Frustracao se engine joga defesa melhor que a historica |
| **Erro-Nomeado-Com-Correcao** | Apos cada partida, identificar 1-3 erros e classifica-los por tipo (tatico, estrategico, abertura, final, blunder). Corrigir cada um com uma frase. | 1. Partida encerrada. 2. Aluno revê sem engine. 3. Marca 1-3 momentos criticos. 4. Classifica cada erro. 5. Escreve 1 frase de correcao. 6. Liga engine para verificar. | 800-2200 | transferencia | review → transfer | Lichess Analysis + comentarios | Nomeia o tipo de erro corretamente em >60% | Heisman (E), Avni (E), Chernev (E) | Culpar fatores externos — nao reconhecer o proprio erro |
| **Tema-Rotulado-Depois-Misto** | Primeiro pratica puzzles com tema indicado (ex: "todos sao garfos"). Depois pratica puzzles mistos sem indicacao de tema. | 1. Bloco A: 10-20 puzzles rotulados (tema visivel). 2. Bloco B: 15-30 puzzles mistos (tema oculto). 3. Comparar taxa de acerto A vs B. 4. Gap >20% indica que reconhecimento nao esta transferindo. | 600-1400 | tatica | guided → retrieval | Lichess /training/fork (rotulado) → /training (misto) | Gap A-B <15% | Steps Method (E), Polgar (E), Seirawan (E) | Fazer so rotulado — ilusao de competencia |
| **Micro-Sessao-Repetida** | Sessoes muito curtas (5 min) repetidas em intervalos crescentes (1 dia, 3 dias, 1 semana, 2 semanas) com o mesmo conjunto de 10-20 posicoes nucleares. | 1. Selecionar 10-20 posicoes essenciais. 2. Sessao 1: resolver (5 min). 3. Sessao 2 (1 dia depois): re-resolver. 4. Sessao 3 (3 dias): re-resolver rapido. 5. Sessao 4 (1 semana): re-resolver. 6. Posicoes com >2 erros voltam ao ciclo. | 0-1800 | todos | review | Lichess Puzzle Replay ou Study com spaced repetition manual | Resolve >90% em <30s na 4a sessao | Alburt (E), Woodpecker Method (E), spaced repetition (E, Cepeda) | Largar depois da 2a sessao — requer disciplina |
| **Auto-Avaliacao-Escrita** | Aluno escreve um paragrafo avaliando a posicao: "Brancas estao melhores porque... O plano e... Os 2-3 lances candidatos sao..." So depois confere com engine/treinador. | 1. Posicao de meio-jogo. 2. Aluno escreve: avaliacao, plano, 3 candidatos. 3. Confere com engine (avaliacao) ou solucao do livro. 4. Compara pensamento proprio com o do autor. | 1400-2200 | estrategia/plano | retrieval → transfer | Lichess Analysis com comentarios escritos | Avaliacao correta (>80% concordancia com engine em direcao) | Silman Amateur's Mind (E), Silman How to Reassess (E) | Pular a escrita — "pensar" sem externalizar |

---

## Entrega 4 — Blocos de Treino Prontos para o App (0->1200)

Tabela `blocos`: densa para 0->1200, pronta para implementar. IDs estaveis no formato `band-stage-NN`.

| id | band | stage | signal | weakness | learningGoal | exerciseMode | lichess_destino | tempo_min | sourceInfluence | avoid | criterio_conclusao | microcopy |
|----|------|-------|--------|----------|-------------|--------------|-----------------|-----------|-----------------|-------|--------------------|-----------|
| 0-600-fundamento-01 | 0-600 | fundamento | Nenhum — primeiro contato | Nao conhece as regras | Mover as 6 pecas corretamente e nomear casas por coordenada | explain → guided | Lichess Learn (Piece moves) | 15 | Capablanca (E), Maizelis (E) | Decorar nomes sem praticar | Completar Lichess Learn: todas as pecas | "Vamos comecar pelo basico. Abra o Lichess Learn e pratique o movimento de cada peca. Sem pressa — e como aprender as letras antes de ler." |
| 0-600-fundamento-02 | 0-600 | fundamento | Conhece movimentos basicos | Nao entende captura e valor das pecas | Capturar pecas desprotegidas e saber o valor relativo (1-3-3-5-9) | explain → guided → retrieval | Lichess Learn (Captures); Lichess Practice: Checkmates (primeira secao) | 15 | Capablanca (E), Seirawan (E) | Capturar sem pensar na reposta | 10 capturas corretas em sequencia | "Agora aprenda a capturar. Cada peca tem um valor: peao=1, cavalo e bispo=3, torre=5, dama=9. Troque so quando ganhar material." |
| 0-600-fundamento-03 | 0-600 | fundamento | Captura dominada | Nao da xeque-mate elementar | Dar mate de rei+dama e rei+torre contra rei sozinho | guided → retrieval | Lichess Practice: Checkmates (Rei+Dama, Rei+Torre) | 20 | Capablanca (E), Maizelis (E) | Perseguir o rei sem usar a dama como barreira | 2 mates elementares concluidos | "Xeque-mate com dama e torre e o primeiro grande dominio. A dama encurrala, o rei ajuda. Use a dama como uma parede que empurra o rei adversario para a borda." |
| 0-600-fundamento-04 | 0-600 | fundamento | Mate elementar feito | Confunde regras especiais (roque, en passant, promocao) | Executar roque, en passant, promocao e identificar afogamento | explain → guided | Lichess Learn (Check, Checkmate, Intermediate) | 15 | Capablanca (E), Blue Book of Chess (E) | Nao rocar "porque o rei fica exposto" | Explicar cada regra com palavras proprias | "Roque, en passant, promocao. Tres regras que confundem. Roque protege o rei E ativa a torre. E o unico lance que mexe duas pecas. Nao subestime o afogamento — ele salva meio ponto de posicoes perdidas." |
| 0-600-seguranca-01 | 0-600 | seguranca | Regras dominadas | Perde pecas por nao ver que estao penduradas (en prise) | Identificar pecas desprotegidas (proprias e adversarias) em ate 5s | explain → guided → retrieval | Lichess Practice: Fundamental Tactics (primeiras secoes); videos: Hanging Pieces | 15 | Heisman Back to Basics (E), Avni Danger in Chess (E) | Ignorar a propria peca pendurada | >90% em 30 puzzles de peca pendurada | "O erro mais comum: deixar peca pendurada. Antes de cada lance, pergunte: 'Alguma peca minha esta desprotegida? O adversario deixou algo pendurado?' Em 5 segundos voce deve responder." |
| 0-600-seguranca-02 | 0-600 | seguranca | Peca pendurada sob controle | Troca mal — perde material em trocas desfavoraveis | Avaliar troca por valor material (ex: capturar torre com dama so se ganhar algo maior em seguida) | guided → retrieval | Lichess Puzzles: advantage, hangingPiece | 10 | Capablanca (E), Seirawan (E) | Trocar por impulso sem avaliar | >80% em 15 puzzles de troca | "Trocar pecas: so se voce ganhar material. Uma dama (9) por uma torre (5) e um mau negocio — a menos que venha mate em seguida." |
| 600-1000-tatica-01 | 600-1000 | tatica | Seguranca satisfatoria (>80% acerto) | Nao reconhece garfo (fork) | Encontrar garfo de cavalo, peao e dama em 1-2 lances no maximo | explain → guided → retrieval | Lichess Practice: Fundamental Tactics (The Fork); Lichess Puzzles: /training/fork | 20 | Seirawan Winning Chess Tactics (E), Steps Method (E), Polgar (E) | So procurar garfo de cavalo | >80% acerto em 30 puzzles rotulados de garfo | "O garfo: uma peca ataca duas ao mesmo tempo. O cavalo e o rei dos garfos, mas o peao e a dama tambem dao. A ideia: alvos duplos. Pergunte: 'Posso atacar duas pecas com uma so?'" |
| 600-1000-tatica-02 | 600-1000 | tatica | Garfo >80% | Nao reconhece cravada (pin) | Identificar cravada absoluta e relativa | explain → guided → retrieval | Lichess Practice: Fundamental Tactics (The Pin); Lichess Puzzles: /training/pin | 20 | Seirawan (E), Steps Method (E), Polgar (E) | Confundir cravada absoluta com relativa | >80% acerto em 30 puzzles de cravada | "A cravada: uma peca nao pode se mover porque expoe uma peca mais valiosa atras. Se a peca de tras for o rei, e absoluta (proibido mexer). Se for dama/torre, e relativa (pode mexer, mas com custo)." |
| 600-1000-tatica-03 | 600-1000 | tatica | Cravada >80% | Nao reconhece espeto (skewer) | Identificar espeto | explain → guided → retrieval | Lichess Practice: Fundamental Tactics (The Skewer); Lichess Puzzles: /training/skewer | 15 | Seirawan (E), Steps Method (E) | Ver cravada onde ha espeto | >80% acerto em 25 puzzles | "O espeto e a cravada ao contrario: a peca da frente e a MAIS valiosa. Ela foge, e voce captura a de tras. Pense num espeto de churrasco: fura a primeira para pegar a segunda." |
| 600-1000-tatica-04 | 600-1000 | tatica | Espeto, cravada, garfo >75% | Nao reconhece ataque descoberto | Encontrar ataque descoberto e cheque descoberto | explain → guided → retrieval | Lichess Practice: Fundamental Tactics (Discovered Attack); Lichess Puzzles: /training/discoveredAttack | 20 | Hertan Forcing Chess Moves (E), Seirawan (E) | Nao ver que a peca da frente pode ir a qualquer casa — nao so capturar | >75% acerto em 25 puzzles | "Ataque descoberto: voce mexe uma peca e REVELA um ataque da peca de tras. Magica! Quando a peca de tras da cheque, e cheque descoberto — o mais perigoso do xadrez porque a peca da frente pode ir a QUALQUER casa." |
| 600-1000-tatica-05 | 600-1000 | tatica | Descoberto >75% | Nao ve eliminacao do defensor | Capturar a peca que defende o alvo | guided → retrieval | Lichess Practice: Fundamental Tactics (Deflection); Lichess Puzzles: /training/attraction | 15 | Seirawan (E), Polgar (E), Steps Method (E) | Capturar defensor sem calcular o que vem depois | >70% acerto em 20 puzzles | "Eliminar o defensor: a peca que protege o alvo. Capture-a primeiro. Mas CUIDADO: calcule o que acontece depois. As vezes o adversario tem um recurso que voce nao viu." |
| 600-1000-mate-01 | 600-1000 | mate | Taticas basicas dominadas (>70% mix) | Nao reconhece padroes de mate em 1 | Reconhecer 10 padroes de mate em 1 e da-los em ate 10s | guided → retrieval | Lichess Puzzles: /training/mateIn1; Lichess Practice: Checkmates (todas as secoes) | 15 | Chandler (E), Polgar (E) | Decorar nomes sem reconhecer o padrao | >90% acerto em 30 mates em 1 | "Mate em 1: o xeque-mate que voce DA em um lance. Parece simples, mas em partida real e facil nao ver. Aprenda os padroes: beijo da morte (dama colada no rei), corredor (torre na fileira do rei preso), fundo (torre na 8a/1a)." |
| 600-1000-mate-02 | 600-1000 | mate | Mate em 1 >90% | Nao resolve mate em 2 com sacrificio | Resolver mate em 2 que envolve sacrificio no primeiro lance | guided → retrieval | Lichess Puzzles: /training/mateIn2 | 15 | Chandler (E), Polgar (E) | Parar de calcular depois do primeiro lance | >70% acerto em 25 mates em 2 | "Mate em 2: voce da cheque no primeiro lance (as vezes sacrificando material) e mate no segundo. O sacrificio e temporario — voce recebe de volta com juros: o rei adversario." |
| 600-1000-tatica-06 | 600-1000 | tatica | Todos os temas taticos individuais >70% | Nao reconhece temas taticos quando misturados | Resolver puzzles de tema MISTO sem indicacao do tipo | retrieval → review | Lichess Puzzle Streak; Lichess Puzzle Storm; Lichess /training (mixed) | 15 | Lichess (E), Polgar (E), Alburt (E) | Acertar no rotulado e errar no misto — ilusao de competencia | >70% acerto em 50 puzzles mistos | "Agora sem dica. Numa partida real, ninguem avisa 'Atencao: garfo disponivel!' Treine puzzles mistos. Seu cerebro precisa aprender a detectar o padrao sozinho." |
| 1000-1200-final-01 | 1000-1200 | final | Tatica mix >70% | Nao conhece finais basicos de peao | Quadrado do peao, oposicao, Rei+Peao vs Rei (ganha ou empata?) | explain → guided → retrieval | Lichess Practice: Pawn Endgames; Lichess Puzzles: /training/pawnEndgame | 20 | Capablanca (E), Keres (E), Silman (E) | Calcular casa por casa — usar quadrado | >80% em finais basicos de peao | "Finais com poucas pecas: aqui o rei vira heroi. Aprenda o quadrado do peao (se o rei entra no quadrado, empata; se nao, o peao promove). Aprenda oposicao: colocar seu rei de frente para o rei inimigo, forcando-o a ceder." |
| 1000-1200-final-02 | 1000-1200 | final | Final de peao >80% | Nao conhece finais basicos de torre | Lucena (ganha), Philidor (empata) | explain → guided | Lichess Practice: Rook Endgames | 20 | Silman (E), Keres (E), Nunn (E) | Colocar torre na frente do peao | Conceito compreendido (Lucena e Philidor) | "Finais de torre sao os mais comuns. Duas posicoes-chave: Lucena (as brancas ganham construindo uma ponte com a torre) e Philidor (as pretas empatam com a torre na 6a fileira)." |
| 1000-1200-abertura-01 | 1000-1200 | abertura-principio | Tatica mix >60%, finais basicos compreendidos | Joga abertura sem principios — sai com dama, nao roca, move mesma peca | Jogar 10 partidas seguidas respeitando os 3 principios (centro, desenvolvimento, roque) | explain → guided → transfer | Lichess Video: Opening Principles; Lichess Learn; jogar partidas 10+5 | 20 | Seirawan Play Winning Chess (E), Capablanca (E), Euwe (E) | Decorar variante em vez de principio | 10 partidas sem violar principios | "Abertura nao e sobre decorar lances — e sobre 3 principios: 1-Ocupe o centro (e4, d4). 2-Desenvolva pecas (cavalos antes de bispos). 3-Roque ate o lance 10. NAO saia com a dama cedo. NAO mova a mesma peca duas vezes." |
| 1000-1200-calculo-01 | 1000-1200 | calculo | Abertura por principios >80% | Joga o primeiro lance que pensa — nao considera alternativas nem preve resposta | Listar 2-3 lances candidatos. Para cada um, prever a melhor resposta do adversario. Escolher o melhor. | explain → guided → retrieval | Lichess Analysis (posicoes selecionadas, sem engine) | 20 | Benjamin Better Thinking (E), Reinfeld (E) | Jogar o primeiro lance que ve sem verificar | Aplica checklist em 10 posicoes com >70% acerto | "Antes de jogar: PARE. Liste 2-3 lances candidatos. Para cada um, pergunte: 'O que o adversario jogaria de melhor?' So depois escolha. Isso evita o erro mais comum: jogar o primeiro lance que vem a cabeca." |
| 1000-1200-transferencia-01 | 1000-1200 | transferencia | Calculo checklist aplicado | Nao analisa as proprias partidas | Identificar 1-3 momentos criticos. Classificar erro. Extrair 1 licao. | review → transfer | Lichess Analysis (partida terminada, sem engine, depois com engine) | 15 | Chernev Logical Chess (E), Heisman (E), Euwe (E) | Culpar o adversario ou "azar" | Nomeia tipo de erro em 3 partidas seguidas | "Revise sua ultima partida. Sem engine primeiro. Ache o momento em que tudo mudou. Que tipo de erro foi? Peca pendurada? Tatica nao vista? Final mal jogado? Uma licao por partida. Isso e o que separa quem melhora de quem estagna." |

---

## Entrega 5 — Regras do Gerador de Plano + Lacunas

### Regras SE-ENTAO para o gerador

```
-- FUNDAMENTOS (0-600)
SE usuario.nova_conta OU sem_partidas_analisadas ENTAO
  stage = fundamento
  exerciseMode = explain → guided
  banda = 0-600

-- SEGURANCA
SE usuario.taxa_blunder > 30% OU (usuario.rating < 600 E sem_bloco_seguranca) ENTAO
  stage = seguranca
  foco = peca_pendurada → troca_favoravel
  exerciseMode = explain → guided → retrieval

-- TATICA (600-1000)
SE usuario.taxa_blunder < 20% E usuario.taxa_tatica_tema_X < 70% ENTAO
  stage = tatica
  foco = tema com menor taxa de acerto
  exerciseMode = explain (se primeiro contato) OU guided (se ja viu) OU retrieval (se >70% rotulado)

-- PROGRESSAO DENTRO DA TATICA
SE acerto_rotulado(tema) > 80% ENTAO
  exerciseMode = retrieval (puzzles do tema sem rotulo)
SE acerto_misto > 70% ENTAO
  avancar_proximo_tema()
SE acerto_misto < 50% ENTAO
  voltar_para_rotulado(tema)

-- MATE
SE todos_temas_taticos > 70% E acerto_mate1 < 90% ENTAO
  stage = mate
  foco = mate em 1 → mate em 2

-- FINAIS (1000-1200)
SE tatica_mix > 70% E mate_em_1 > 90% E (usuario.rating >= 900 OU tem_sinais_suficientes) ENTAO
  stage = final
  foco = peao → torre
  exerciseMode = explain → guided

-- ABERTURA POR PRINCIPIOS (1000-1200)
SE finais_basicos > 70% E usuario.taxa_abertura_ruim > 40% ENTAO
  stage = abertura-principio
  exerciseMode = explain → transfer (jogar aplicando principios)

-- CALCULO (1000-1200)
SE abertura_principios_ok E usuario.erro_impulsividade > 30% ENTAO
  stage = calculo
  exerciseMode = guided → retrieval (checklist em posicoes)

-- TRANSFERENCIA (transversal)
SE partida_terminada E usuario.quer_analisar ENTAO
  stage = transferencia
  exerciseMode = review → transfer

-- REVISAO ESPACADA (transversal)
SE tema_X_ultimo_treino > 7_dias ENTAO
  exerciseMode = review
  interleaving = tema_X + tema_Y (outro tema ja dominado)

-- FEEDBACK
SE usuario.feedback == "dificil" ENTAO
  regredir_exerciseMode(explain ← guided ← retrieval)
SE usuario.feedback == "facil" ENTAO
  avancar_exerciseMode(explain → guided → retrieval)
SE usuario.feedback == "bom" ENTAO
  manter_exerciseMode_com_variacao()

-- SINAL DE DOMINIO
SE acerto > 80% EM exerciseMode = retrieval ENTAO
  marcar_bloco_concluido()
SE acerto < 50% EM exerciseMode = retrieval ENTAO
  sinalizar_fraqueza() → revisitar em 1 dia
```

### Sinais de Dominio (sem prometer rating)

| Sinal | Como medir | Confianca |
|-------|------------|-----------|
| Taxa de acerto em puzzle do tema >80% (rotulado) | Lichess puzzle activity reconciliada | Alta (E) |
| Taxa de acerto em puzzle misto >70% | Lichess Puzzle Streak/Storm stats | Alta (E) |
| Tempo medio de resolucao <15s para mate em 1 | Lichess puzzle activity (deduzir de data/win) | Media (I) |
| Reducao de blunders/partida | Lichess game analysis | Alta (E) |
| Nomeacao correta do tipo de erro apos partida | Autoanalise guiada (local) | Media (I) |
| Sessoes concluidas sem pular | Log local de treino | Alta (E) |
| Feedback "bom" ou "facil" consistente (>3 sessoes) | Log local de feedback | Media (I) |
| Progressao no Puzzle Streak (high score) | Lichess Puzzle Streak | Media (I) |

### Anti-Patterns (o que o metodo recusa)

| Anti-pattern | Justificativa |
|-------------|---------------|
| Decoreba de variantes de abertura para <1400 | Golpe de Scholar e variantes decoradas criam ilusao de progresso; desmorona contra qualquer adversario que saia do script (E — consenso entre todos os metodos) |
| Gamificacao vazia (badges, streaks, pontos sem aprendizado real) | Placebo de curto prazo (E — Blanch 2022: "wishful thinking") |
| Promessa de aumento de QI, cognicao ou notas escolares | Sem evidencia robusta (E — Sala & Gobet 2017, Jerrim 2016) |
| Recomendar lance durante partida ao vivo | Violacao do Fair Play do Lichess e principios eticos (E — Lichess ToS) |
| Sessoes >60 min sem pausa | Massed practice < spaced practice (E — Cepeda, Ebbinghaus) |
| "So jogue e voce vai melhorar" | Jogo livre sem analise nao e deliberate practice (E — Charness 2005) |
| Foco exclusivo em blitz/bullet | Blitz vicia em reconhecimento superficial, nao em pensamento profundo (E — Heisman, Rowson) |
| Estudar aberturas de GM para <1800 | Inutil — partidas de amador nunca chegam a posicoes de teoria profunda (E — consenso) |

### Lacunas para Revisao Humana

| Lacuna | Decisao necessaria | Impacto |
|--------|--------------------|---------|
| **Threshold exato de "dominio" para avancar** | 80%? 90%? Depende da dificuldade do puzzle? | Alto — define quando o aluno sobe de banda |
| **Proporcao revisao vs conteudo novo** | 30% revisao, 70% novo? Varia por banda? | Alto — afeta retencao vs progresso |
| **Interleaving: quantos temas misturar** | 2 temas por sessao? 3? Rotacao semanal? | Medio — afeta transferencia |
| **Spaced repetition: intervalos exatos** | 1-3-7-30 dias? Depende da dificuldade? | Alto — afeta retencao de longo prazo |
| **Tom do Professor Lemos para correcao de erro** | "Isso e um garfo mal calculado" vs "Quase! Olhe de novo: ha duas ameacas aqui" | Medio — afeta engajamento e aprendizagem |
| **Quando introduzir aberturas por nome** | Nunca antes de 1200? Ou 1 abertura aos 1000? | Medio — afeta progressao |
| **Criterio de "pronto para subir de banda"** | So acerto em puzzle? Ou tambem requer partidas reais? Quantas? | Alto — define certificacao |
| **Uso de engine pelo aluno** | Permitir so depois da autoanalise? Ou liberado? | Medio — afeta desenvolvimento de calculo proprio |

### Fontes em Dominio Publico Provavel (triagem para uso futuro)

| Titulo | Autor | Ano | Uso potencial |
|--------|-------|-----|---------------|
| Chess Fundamentals | Capablanca | 1921 | Posicoes de finais, partidas comentadas |
| My System | Nimzowitsch | 1925 | Posicoes estrategicas classicas |
| Chess Praxis | Nimzowitsch | 1929 | Partidas do autor |
| The Game of Chess | Tarrasch | 1931 | Partidas comentadas |
| Lasker's Manual of Chess | Lasker | 1925 | Posicoes-modelo e partidas |
| The Art of Chess Combination | Znosko-Borovsky | 1936 | Posicoes de combinacao |
| How Not to Play Chess | Znosko-Borovsky | 1931 | Exemplos de erros classicos |
| The Middle Game in Chess | Znosko-Borovsky | 1930 | Posicoes de meio-jogo |

**Status:** Esses titulos sao provavelmente dominio publico (autor falecido ha >70 anos, publicacao pre-1930). Confirmar jurisdicao antes de usar posicoes/partidas no app.

---

# PASSO 3 — Avaliacao Final do Acervo

## 1. Nota Geral: 6.5 / 10

**Justificativa:** O acervo tem EXCELENTES livros individuais (28 com nota >=8) mas como BASE para um metodo INOVADOR, SIMPLES e EFICAZ, ele e apenas BOM, nao otimo. Motivos:

- **Forca (+):** Cobre bem tatica (muitos livros excelentes), finais (Keres, Silman, Nunn) e estrategia (Silman, Stean, Watson). A diversidade de tradicoes pedagogicas e grande (padroes, sovietica, principios, narrativa, meta-aprendizagem).
- **Forca (+):** Tem os classicos indiscutiveis: Capablanca, Nimzowitsch, Chernev, My System, Tal.
- **Fraqueza (-):** 31 livros sao redundantes com o Lichess gratuito (guias genericos de iniciante, colecoes de puzzles basicos). Eles ocupam espaco mas nao adicionam nada que o Lichess Learn/Practice/Puzzles ja nao faca melhor.
- **Fraqueza (-):** 19 livros tem nota <=3 (fracos, auto-publicados, ficcao, ou anti-pedagogicos). Poluem o acervo.
- **Fraqueza (-):** Faltam livros de PEDAGOGIA DO XADREZ (como ensinar, nao o que ensinar). Apenas Heisman e Weeramantry tocam nisso seriamente.
- **Fraqueza (-):** O acervo e quase todo em ingles. Faltam materiais em PT-BR (so o Lichess em portugues supre).

## 2. Suficiencia: PARCIAL

**SIM** para construir o metodo 0-1800: ha material suficiente. A combinacao Capablanca + Seirawan + Steps Method + Silman + Chernev + Polgar cobre toda a escada.

**NAO** completamente para 1800+: faltam Dvoretsky, Aagaard volume 3+, e treino de calculo em profundidade. Mas o app atualmente so implementa ate 1200, entao isso nao e bloqueante.

**PARCIAL** para pedagogia: o acervo ensina xadrez, mas poucos ensinam COMO ENSINAR. Isso e a lacuna que o DeepSeek preenche com esta sintese.

## 3. Cobertura por Area

| area | forca_no_acervo | melhores_fontes | o_que_falta |
|------|-----------------|-----------------|-------------|
| Fundamentos | FORTE | Capablanca, Seirawan, Maizelis, Lichess Learn | Nada — coberto com excelencia |
| Seguranca | MEDIA | Heisman, Avni | Mais exercicios graduados de "peca pendurada" |
| Mate | FORTE | Chandler, Polgar, Lichess Practice | Nada — coberto |
| Finais | FORTE | Capablanca, Keres, Silman, Nunn, Willemze | Nada — coberto ate nivel avancado |
| Tatica | FORTE | Seirawan, Polgar, Hertan, Engqvist, Huczek, Neiman | Nada — excesso ate (ver redundancia) |
| Calculo | MEDIA | Benjamin, Reinfeld, Edouard, Aagaard | Mais exercicios de calculo INTERMEDIARIO (1000-1600) — a maioria e muito facil ou muito dificil |
| Estrategia | FORTE | Silman, Stean, Watson, Flores Rios, Euwe | Nada — coberto |
| Estrutura de peoes | FORTE | Flores Rios, Shankland, Watson | Nada |
| Aberturas por principio | MEDIA | Seirawan, Capablanca, Euwe | Material didatico que conecte principios a partidas REAIS do aluno |
| Planejamento | FORTE | Silman, Stean, Watson | Nada — coberto |
| Defesa/Profilaxia | MEDIA | Marin, Avni, Nimzowitsch | Poucos livros dedicados a DEFESA (so Marin e um pedaco de Avni) |
| Psicologia/Processo de decisao | MEDIA | Benjamin, Rowson, Krogius, Gobet | Material moderno sobre vieses cognitivos no xadrez |
| Transferencia | FRACA | Chernev, Heisman, Euwe | Metodo sistematico de autoanalise para <1200 |
| Ensino/Pedagogia | FRACA | Heisman, Weeramantry | Livros sobre COMO ENSINAR xadrez (nao sobre xadrez em si) |

## 4. Avisos de Lacuna

| Area vaga/fraca | Sugestao de busca |
|-----------------|-------------------|
| **Ensino/Pedagogia** — livros sobre COMO ensinar xadrez | Buscar: "chess teaching methodology", "how to coach chess", manuais de treinador FIDE, material de formacao de professores de xadrez. Formato: livro ou curso. Nivel: basico a intermediario. |
| **Defesa** — como defender posicoes dificeis | Buscar: livros dedicados a defesa em xadrez (so Marin cobre bem). Sugestao: "Chess Defence" de Aagaard ou similares. Nivel: 1400+. |
| **Calculo intermediario** — exercicios de 2-4 lances para 1000-1400 | Buscar: puzzle books com foco em CALCULO, nao so em padrao tatico. Ex: "Chess Calculation Training for Club Players". Nivel: 1000-1600. |
| **Psicologia cognitiva aplicada ao xadrez** — vieses, tomada de decisao | Buscar: livros pos-2010 sobre psicologia do xadrez baseada em evidencia (nao so anedota). Ex: Gobet, Rowson complementado por ciencia cognitiva recente. |
| **Aberturas como planos para 1000-1400** — material que ensine a PENSAR aberturas | Buscar: livros que conectam principios de abertura a planos de meio-jogo sem decorar variantes. Hellsten e uma excecao bem-vinda. |
| **Autoanalise para iniciantes** — metodo simples de revisar a propria partida | Buscar: guias praticos de "how to analyze your own games for beginners". Ou criar -- esta e uma lacuna que o app pode preencher com design original. |

## 5. Redundancia

O acervo tem EXCESSO de:
- **Manuais de iniciante genericos (11 livros):** Chess for Beginners (4 edicoes!), Chess for Dummies, Chess 101, Ultimate Chess Guide, etc. Todos ensinam as mesmas regras. O Lichess Learn substitui TODOS com vantagem (interativo, gratuito, PT-BR). Sugestao: arquivar, nao integrar ao metodo.
- **Colecoes de puzzles basicos (8 livros):** 399 Super Easy, Chess Exercises for Beginners, Best Chess Puzzles, etc. Lichess Puzzles e infinito, adaptativo e gratuito. Sugestao: usar Lichess; livros so como referencia de CURADORIA (quais puzzles sao "essenciais").
- **Livros de abertura desatualizados (4 livros):** MCO (De Firmian, Korn) — biblia de variantes, inutil para <1800. FCO (Van der Sterren) e melhor mas ainda excessivo para <1400.

Sugestao de enxugamento: dos 124 livros, ~40 sao redundantes ou substituiveis por Lichess gratuito. O nucleo duro do metodo pode ser construido com ~30 livros de altissima qualidade.

## 6. Veredito

**Da para comecar a construir o metodo agora com o que existe.** O acervo contem os classicos fundacionais (Capablanca, Nimzowitsch, Chernev, Tal), a serie completa Seirawan, os metodos modernos essenciais (Silman, Yusupov, Steps), e a escola de meta-aprendizagem (Heisman, Rowson). A escada 0-1200 ja esta pronta para implementacao. As lacunas (defesa, pedagogia do ensino, calculo intermediario) sao preenchiveis com 5-8 livros adicionais e com o design original do app preenchendo os buracos (especialmente autoanalise guiada). O maior risco nao e falta de conteudo — e dispersao: 124 livros e muita coisa. O metodo precisa ESCOLHER e PRIORIZAR, nao absorver tudo. Esta sintese faz exatamente isso.

---

# Proximos Passos para o Codex Implementar

1. **Atualizar `docs/research/method_synthesis.md`** com os `drill_formats` e `blocos` desta analise (secao 4 e 3)
2. **Atualizar `docs/pedagogy/metodo-professor-lemos.md`** com a escada completa (Entrega 2)
3. **Criar `src/curriculum.ts`** com as constantes de band/stage/exerciseMode e a tabela de progressao
4. **Criar `src/drillFormats.ts`** com os formatos de treino reutilizaveis (Entrega 3)
5. **Criar `src/trainingBlocks.ts`** com os 18+ blocos da Entrega 4, incluindo microcopy em PT-BR
6. **Atualizar o gerador de plano** com as regras SE-ENTAO da Entrega 5
7. **Validar contra o spec vigente** (`docs/superpowers/specs/2026-06-06-rotina-pessoal-adaptativa-design.md`)
8. **Gate:** `npm run lint && npm run test && npm run build`

---
*Documento gerado em 2026-06-09. DeepSeek. Sintese original — principios, sequencias e formatos de treino escritos pelo pesquisador. Nenhum texto, diagrama, exercicio ou variante foi copiado dos livros analisados. Conceitos de dominio (oposicao, garfo, peca solta, regra do quadrado) sao conhecimento comum — usados livremente.*
