# Plano pedagogico a partir do acervo baixado

Data: 2026-06-09

## Escopo

Este documento transforma a primeira leitura do acervo baixado em decisao pedagogica para o
`lichess-tutor`. Ele nao cataloga todo o acervo. Ele responde a uma pergunta pratica: o que deve
entrar no nosso metodo, o que deve ficar para depois, e o que nao deve ser usado.

O uso do acervo aqui e clean-room: os livros, artigos e teses orientam principios, sequenciamento,
criterios de exercicio e linguagem pedagogica. Nao devemos copiar texto, diagramas, listas extensas
de variantes, problemas protegidos, taxonomias proprietarias ou conteudo pago. Quando houver conteudo
public-domain ou open-access, ele ainda deve passar por ficha de fonte antes de qualquer reutilizacao
direta.

## Tese pedagogica

O acervo aponta para uma pedagogia mais forte que a ideia generica de "fazer puzzles":

1. Ensinar clareza antes de volume.
2. Comecar por seguranca, xeque-mate e finais-modelo, nao por memorizacao de aberturas.
3. Transformar cada conceito em decisao observavel no tabuleiro.
4. Usar repeticao curta com recuperacao ativa: o aluno tenta, explica e recebe feedback.
5. So depois levar o aluno para planos, partidas-modelo e abertura como principios.

Para o Professor Lemos, isso significa um metodo adulto, direto e adaptativo: diagnostica uma
fragilidade real, escolhe um microtema, mostra um modelo minimo, treina por recuperacao ativa no
Lichess, e fecha com uma explicacao curta do aluno.

## O que usar agora

| Fonte do acervo | Uso pedagogico recomendado | Aplicacao no app |
| --- | --- | --- |
| Capablanca, `Chess Fundamentals` | Finais e posicoes-modelo como base da compreensao. Ensinar um principio, um modelo e um plano em etapas. | Trilhas iniciais de mate basico, finais rei+peao, conversao de material e "plano em 2 ou 3 passos". |
| Edward Lasker, `Chess Strategy` | Progressao gradual: primeiro evitar perda material, depois desenvolvimento, centro, peoes e planos. | Checklist de seguranca antes de temas estrategicos: peca solta, ameaca adversaria, troca ruim, rei exposto. |
| `The Blue Book of Chess`, `Chess-player's Handbook`, `O Perfeito Jogador De Xadrez` | Regras, movimento das pecas, orientacao do tabuleiro, formas de responder a xeque e primeiros jogos guiados. | Modulo zero para fundamentos, com microdrills e perguntas simples antes de enviar o aluno ao Lichess. |
| Taverner, `Chess Problems Made Easy`; Baird, `700 Chess Problems` | Calculo exato: lance-chave, todas as defesas, refutacao de respostas erradas e aumento gradual de dificuldade. | Inspirar formato de treino: "ache o lance", "liste a defesa", "por que as alternativas falham". Usar conteudo do Lichess, nao copiar problemas. |
| Literatura sobre Morphy e `Chess Generalship` | Partidas-modelo para cooperacao de pecas, desenvolvimento, iniciativa e ataque ao ponto fraco. | Usar depois dos blocos taticos: revisao de partida encerrada e estudo de modelo historico com foco em 1 principio. |
| Artigos modernos de educacao enxadristica | Aprendizagem interativa, participacao ativa, feedback, formacao do professor e inclusao. | Estruturar aulas como ciclos ativos, com autoexplicacao, feedback curto, metacognicao e cuidado para nao vender beneficios cognitivos exagerados. |

## O que nao usar agora

| Material | Motivo |
| --- | --- |
| Enciclopedias antigas de aberturas e gambitos | Tendem a ensinar por arvore de variantes. Para iniciante, isso cria ilusao de conhecimento e pouca transferencia. |
| Tabelas longas de abertura em notacao antiga | Baixo valor para o MVP, alto custo de limpeza, alto risco de confundir o aluno. |
| Problemas compostos como base principal do treino | Bons para calculo preciso, mas podem ficar artificiais. Para transferencia, o treino deve usar temas praticos do Lichess. |
| Livros de partidas historicas sem curadoria | Sao valiosos, mas so depois de haver pergunta pedagogica clara. Partida inteira sem foco vira leitura passiva. |
| `Chess Endgames` sobre variantes nao ortodoxas como bidding/random-turn chess | Nao serve para o curriculo principal de xadrez classico. Fica como curiosidade, nao como fonte pedagogica. |
| Linguagem moralizante ou arcaica dos manuais antigos | Pode inspirar a ideia de "pensar consequencias", mas nao deve virar microcopy do app. |

## Curriculo recomendado para o Professor Lemos

### 0. Tabuleiro, pecas e xeque

Objetivo: o aluno entende o tabuleiro, move pecas sem ambiguidade e sabe responder a xeque.

Fontes-base: manuais introdutorios antigos, especialmente `The Blue Book of Chess`,
`Chess-player's Handbook` e `O Perfeito Jogador De Xadrez`.

Uso pratico:

- Orientacao do tabuleiro e posicao inicial.
- Movimento das pecas com exercicios curtos.
- Xeque, mate, captura do rei proibida e tres respostas a xeque: mover o rei, capturar a peca
  atacante ou bloquear a linha.
- Primeiro jogo guiado apenas quando essas respostas estiverem claras.

### 1. Seguranca material

Objetivo: reduzir derrotas por pecas penduradas e ameacas simples.

Fontes-base: `Chess Strategy` e principios gerais de desenvolvimento dos manuais classicos.

Uso pratico:

- Pergunta fixa antes do treino: "o que meu adversario ameaca?"
- Checklist: meu rei esta em perigo, alguma peca esta sem defesa, posso ganhar material, estou
  entregando material?
- So depois de estabilizar isso o aluno entra em planos posicionais mais finos.

### 2. Xeque-mate e finais-modelo

Objetivo: fazer o aluno converter vantagem e reconhecer padroes de mate.

Fontes-base: `Chess Fundamentals`, secoes de finais do `Chess-player's Handbook`, estudos de
Kling/Horwitz com curadoria futura.

Uso pratico:

- Mate com dama.
- Mate com torre.
- Rei e peao: corrida, oposicao, promocao e peao passado.
- Finais como pequenas historias de objetivo: cortar o rei, aproximar o rei, reduzir espaco,
  executar mate.

### 3. Calculo tatico por recuperacao ativa

Objetivo: trocar "eu vi uma ideia" por "eu calculei e conferi as respostas".

Fontes-base: Taverner e Baird, sem copiar problemas.

Uso pratico:

- Mate em 1 e mate em 2.
- Garfo, cravada, espeto, ataque descoberto, raio-x, peca sobrecarregada e peca solta.
- Formato de resposta: lance candidato, resposta critica do adversario, confirmacao.
- Feedback curto: erro de observacao, erro de calculo, erro de prioridade ou erro de padrao.

### 4. Aberturas como principios

Objetivo: jogar os primeiros lances sem depender de decoracao.

Fontes-base: Capablanca, Lasker e manuais antigos, usando-os contra o excesso de variantes.

Uso pratico:

- Centro, desenvolvimento, roque, seguranca do rei, nao mover a mesma peca sem motivo, evitar saidas
  prematuras da dama.
- Uma abertura nao e "uma lista de lances"; e uma promessa de desenvolvimento e seguranca.
- Memorizacao de linha so entra se a analise das partidas do aluno mostrar repeticao real de erro.

### 5. Planejamento simples

Objetivo: passar de "achei um lance" para "sei melhorar minha posicao".

Fontes-base: `Chess Fundamentals`, `Chess Strategy`, literatura de Morphy e `Chess Generalship`.

Uso pratico:

- Identificar pior peca.
- Identificar alvo fraco.
- Melhorar coordenacao.
- Trocar quando ajuda o plano, evitar troca automatica.
- Cada plano deve caber em uma frase operacional: "quero atacar este peao", "quero entrar na coluna",
  "quero ativar esta peca".

### 6. Transferencia para partidas reais

Objetivo: conectar estudo e jogo do dono, sem ajuda durante partida ao vivo.

Fontes-base: partidas-modelo historicas e artigos modernos sobre ensino interativo.

Uso pratico:

- Analisar somente partidas terminadas.
- Transformar erros recorrentes em microtarefas de treino.
- Depois do treino, pedir ao aluno uma explicacao curta: "qual era o sinal?", "qual foi o plano?",
  "qual erro esse exercicio evita?"
- Usar partidas-modelo apenas com foco: uma partida para desenvolvimento, uma para ataque ao rei, uma
  para conversao, uma para final.

## Formato de aula recomendado

Cada aula deve seguir um ciclo curto:

1. Diagnostico: qual sinal apareceu nas partidas ou nos puzzles?
2. Nomeacao: qual fraqueza isso revela?
3. Modelo: uma posicao simples mostra a ideia.
4. Tentativa: o aluno resolve no Lichess ou em exercicio autorizado.
5. Feedback: explicar o erro em uma categoria pequena.
6. Transferencia: uma tarefa para a proxima partida ou proximo bloco.

Esse ciclo conversa bem com a cadeia ja aceita do projeto: `Signal -> Weakness -> Plan`.

## Como isso deve virar produto

### Dados pedagogicos

Em fase de implementacao, cada bloco de treino deve carregar metadados pedagogicos simples:

- `stage`: fundamento, seguranca, mate, final, tatica, abertura-principio, plano, transferencia.
- `signal`: sinal que ativa o bloco.
- `weakness`: fragilidade treinada.
- `learningGoal`: habilidade observavel.
- `exerciseMode`: explicacao, recuperacao ativa, puzzle externo, revisao de partida ou reflexao.
- `sourceInfluence`: influencia pedagogica, nao conteudo copiado.
- `avoid`: armadilhas do bloco, como decorar variante ou analisar partida ao vivo.

### Regra de escolha de treino

A ordem recomendada para o gerador de plano e:

1. Se ha erro de regra ou xeque, voltar ao modulo 0.
2. Se ha perda de material simples, treinar seguranca antes de estrategia.
3. Se ha falha de mate/conversao, priorizar finais-modelo.
4. Se ha erro tatico recorrente, usar recuperacao ativa com tema especifico.
5. Se a abertura gera posicoes ruins repetidas, ensinar principio, nao linha longa.
6. Se a posicao sai jogavel mas o aluno nao progride, entrar em plano simples.
7. Se o aluno acerta no treino mas erra em jogo, usar transferencia e revisao de partida encerrada.

### Microcopy

Tom recomendado:

- PT-BR adulto.
- Frases curtas.
- Uma ideia por bloco.
- Sem prometer aumento de QI, notas escolares ou "genialidade".
- Sem linguagem infantilizada.
- Sem copiar frases antigas, mesmo quando public-domain, se elas soarem arcaicas.

Exemplos de direcao, nao texto final obrigatorio:

- "Antes de atacar, veja se algo seu esta pendurado."
- "O final tem um plano pequeno: cortar, aproximar, executar."
- "Nao memorize essa abertura ainda. Entenda a tarefa dos seus lances."
- "Seu erro nao foi falta de tatica; foi nao perguntar qual era a ameaca."

## Prioridade de implementacao

### Prioridade 1: MVP pedagogico

- Modulo 0: regras, xeque e movimento.
- Modulo 1: seguranca material.
- Modulo 2: mate basico e finais-modelo.
- Modulo 3: tatica por tema com feedback de erro.

Esses quatro blocos sustentam a ferramenta pessoal e reduzem ruido antes de qualquer ambicao maior.

### Prioridade 2: abertura-principio

- Centro, desenvolvimento, roque e seguranca.
- Sem tabelas historicas.
- Linhas especificas so quando as partidas do dono mostrarem erro recorrente.

### Prioridade 3: planejamento e partidas-modelo

- Pior peca.
- Alvo fraco.
- Coordenacao.
- Partidas historicas curadas por principio, nao por celebridade.

### Prioridade 4: camada de professor

- Feedback por categoria.
- Autoexplicacao.
- Inclusao e cuidado com frustracao.
- Registro de qual intervencao funcionou.

## Fontes do acervo mais uteis nesta fase

| Prioridade | Fonte | Papel |
| --- | --- | --- |
| Alta | Capablanca, `Chess Fundamentals` | Sequencia de finais, principios e planejamento. |
| Alta | Edward Lasker, `Chess Strategy` | Desenvolvimento gradual, seguranca material, centro e peoes. |
| Alta | Taverner, `Chess Problems Made Easy` | Formato mental de problemas: chave, defesas, refutacoes. |
| Alta | Baird, `700 Chess Problems` | Progressao mate-em-2/mate-em-3 e nocao de dificuldade. |
| Media | `The Blue Book of Chess` | Regras, movimento e alerta contra excesso de abertura. |
| Media | `Chess-player's Handbook` | Estrutura classica de regras, jogos e finais; OCR exige cuidado. |
| Media | `O Perfeito Jogador De Xadrez` | Apoio historico em portugues; usar apenas como referencia de ideias. |
| Media | Artigos open-access sobre ensino de xadrez | Interatividade, formacao docente, inclusao e uso de plataformas. |
| Baixa agora | Livros longos de aberturas antigas | Referencia historica, nao curriculo inicial. |
| Baixa agora | Colecoes extensas de partidas antigas | Usar so apos curadoria por principio. |

## Riscos e cuidados

- O acervo ainda nao esta catalogado em fichas individuais completas.
- Alguns PDFs e EPUBs tem OCR ruim; qualquer decisao baseada neles deve ser revisada antes de virar
  conteudo de produto.
- Livros antigos misturam boas intuicoes com pedagogia datada.
- Muitos materiais tratam xadrez como memorizacao de variantes; nosso metodo deve resistir a isso.
- Artigos modernos ajudam no desenho de aula, mas nao autorizam promessas fortes sobre transferencia
  cognitiva ampla.
- Qualquer reutilizacao direta de posicoes, diagramas, problemas ou texto precisa de ficha de fonte,
  licenca e decisao explicita.

## Decisao

Para a pedagogia do `lichess-tutor`, o acervo baixado deve ser usado principalmente como base de
sequenciamento e desenho didatico, nao como banco bruto de conteudo.

O metodo recomendado e:

1. fundamentos claros;
2. seguranca material;
3. mates e finais-modelo;
4. calculo tatico por recuperacao ativa;
5. abertura por principios;
6. planejamento simples;
7. transferencia para partidas reais encerradas.

Essa ordem deve guiar a proxima fase de implementacao pedagogica e a catalogacao do acervo.
