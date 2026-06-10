# Analise dos Convertidos - CODEX

Data de referencia: 2026-06-09

Pesquisador: Codex

Escopo: textos convertidos em `LIVROS XADREZ PARA CONSULTA/_convertidos/`, manifesto de conversao e analises anteriores de DeepSeek, Gemini e Codex.

Convencoes: **(E)** evidencia verificada no arquivo convertido ou no manifesto; **(I)** inferencia pedagogica; **(P)** proposta de produto, sujeita a decisao do dono.
Regra clean-room: este documento nao reproduz exercicios, diagramas, variantes, solucoes nem blocos longos dos livros. O acervo influencia metadados, sequencia e formato pedagogico; a execucao continua no Lichess.

## Escopo e confianca da conversao

| item | achado | impacto |
|---|---:|---|
| Total no manifesto | 68 processados | (E) Base esperada da conversao. |
| Falhas no manifesto | 1 falha | (E) Um arquivo nao entra na analise textual. |
| Saidas `.txt` declaradas como OK | 67 | (E) Todas com qualidade marcada como `alta`. |
| Arquivos `.txt` unicos na pasta | 66 | (E) Ha uma colisao de nome de saida. |
| Colisao confirmada | 2 entradas de `Xadrez Vitorioso - finais praticos` apontam para nomes truncados equivalentes | (E) Ian Rogers e Miguel Illescas precisam de reconversao/renomeacao se forem usados. |

Leitura: a conversao e boa o bastante para os livros centrais, mas a contagem deve ser registrada como **66 textos unicos legiveis**, nao "67 arquivos independentes". A divergencia nao muda DAMP, Leitao, Movimento Forcado, Manual de Aberturas ou Capablanca; so reduz confianca nos itens de `Xadrez Vitorioso`.

## Passo 1 - Fichamento dos convertidos

| ficha | livro/grupo | evidencia central | inferencia para o metodo | valor marginal | confianca |
|---|---|---|---|---|---|
| C01 | `DAMP - O Algoritmo...` | (E) O texto define DAMP por **Defesa, Alinhamento, Mobilidade, Promocao** e o apresenta como busca de defeitos/debilidades taticas. | (I) DAMP e uma antena de deteccao tatica antes do calculo, nao um ritual geral de seguranca pre-lance. Pode ser usado tambem para vigiar a propria posicao, mas esse e um uso derivado. | Alto. Corrige uma premissa importante e da vocabulario PT-BR compacto para "detectar antes de calcular". | Alta |
| C02 | `Como montar uma programacao de treinamento de xadrez` | (E) O texto organiza faixas de estudo; para ate 1900, privilegia calculo/combinacoes, partidas classicas, finais e aberturas basicas, com percentuais explicitos. | (I) O app pode usar a proporcao como base de agenda, mas deve traduzir rating para sinais locais e tempo disponivel. | Alto. Da calibragem PT-BR de time budget sem prometer rating. | Alta |
| C03 | `Movimento forcado` vols. 1, 2, 3, 4 e 6 | (E) Os volumes verificados declaram faixas FIDE 1201-1400, 1401-1600, 1601-1800, 1801-2000 e 2201-2400; todos ensinam a escrever solucoes e treinam variantes forcadas. | (I) E ponte boa para calculo curto/intermediario, mas nao fecha diretamente 800-1200. Falta o volume 5 e falta metodo explicativo robusto; e mais banco/ritual de exercicio do que curso. | Medio-alto para 1200+; medio para o app atual. | Alta para faixas; media para encaixe 0-1200 |
| C04 | `Manual de Aberturas de Xadrez` vols. 1-4 | (E) A introducao fala em desenvolvimento, centro, seguranca dos reis, conformacao de peoes e planos compativeis com o meio-jogo; o corpo e amplo e cheio de variantes. | (I) Fecha parcialmente a lacuna de vocabulario e principios de abertura em PT-BR, mas nao e por si so um repertorio operacional 0-1200. | Medio-alto como referencia; medio como curriculo. | Alta |
| C05 | Colecoes `Escola...`, `Estrategia britanica`, `Gigantes do Xadrez Feminino`, `Xadrez passo a passo`, `Xadrez basico` | (E) 49 arquivos nesses grupos, com template recorrente "Jogue como X", introducao biografica, exercicios e solucoes. | (I) Valor principal e repertorio de partidas-modelo e diversidade de estilos, inclusive campeas. Como metodo, e redundante e juridicamente sensivel. | Medio como biblioteca; baixo como metodo novo. | Media-alta |
| C06 | `Fundamentos do xadrez - Jose Raul Capablanca` | (E) O texto convertido tem capitulos de finais, meios-jogos, teoria geral, estrategias de final e aberturas. | (I) Reforca fortemente a escada final -> principio -> partida, ja presente no metodo. O original e antigo, mas a traducao/edicao especifica ainda requer cuidado de direitos. | Alto, mas mais confirmatorio que novo. | Alta para conteudo; media para status legal da traducao |
| C07 | `113 exercicios...` vols. 1-3 | (E) Tres arquivos de exercicios infantis/iniciantes. | (I) Confirmam treino curto de mate/tatica simples, mas o tom infantil e o banco de posicoes nao entram no produto. | Baixo. Lichess cobre melhor a execucao. | Alta |
| C08 | `Treino tactico final com Artur Yusupov` e `Xadrez Vitorioso` | (E) Arquivos pequenos de exercicios/partidas de figuras especificas; `Xadrez Vitorioso` tem colisao de saida no manifesto. | (I) Bons como sinal de formato de estudo e finais praticos, mas nao devem orientar decisao central sem reconversao conferida. | Baixo-medio. | Media |

### Desempate inicial sobre DAMP

O ponto esta resolvido: **DAMP nao significa Descobrir/Ameacar/Modificar/Prevenir**. A leitura direta confirma **Defesa, Alinhamento, Mobilidade e Promocao**. O encaixe correto e:

| aspecto | veredito Codex |
|---|---|
| Natureza | (E/I) Checklist de deteccao de defeitos taticos. |
| Momento de uso | (I) Antes de calcular lances forcados; depois de seguranca basica estar minimamente estavel. |
| Papel no app | (P) Drill format sob `stage: tatica`, nao novo `exerciseMode`. |
| O que nao deve virar | (P) Substituto de Heisman/Avni para "meu lance esta seguro?". |

## Passo 2 - Deltas no metodo

### 2.1 Novos aportes por tradicao

| tradicao | aporte novo | fonte | forca | observacao |
|---|---|---|---|---|
| Deteccao tatica PT-BR | DAMP como mapa de defeitos taticos: defesa, alinhamento, mobilidade, promocao. | DAMP | Forte | Corrige o metodo consolidado onde DAMP ainda estava pendente ou mal definido. |
| Rotina de estudo PT-BR | Divisao de tempo com enfase em calculo, partidas classicas, finais e abertura basica. | Leitao | Forte | Adaptar a sinais locais, nao a rating. |
| Calculo forcado graduado | Escrita de solucoes e treino por faixas crescentes. | Movimento Forcado | Medio | Mais util a partir de 1200; para 800-1200 precisa versao simplificada propria. |
| Aberturas por principios + referencia | Centro, desenvolvimento, seguranca, peoes e plano de meio-jogo em PT-BR. | Manual de Aberturas | Medio-alto | O corpo ainda e referencia de variantes, entao o app deve extrair so principios e plano. |
| Partidas-modelo em PT-BR | Estudo por jogador/escola, inclusive campeas e estilos variados. | Series Murray | Medio | Usar como inspiracao para Studies licitos, nao como comentarios copiados. |
| Classico final-first em PT-BR | Capablanca convertido reforca finais e principios cedo. | Fundamentos | Alto confirmatorio | Nao muda o metodo; fortalece a base. |

### 2.2 Deltas na escada

| band | stage | mudanca_proposta | livro_que_motiva | tipo |
|---|---|---|---|---|
| 600-1000 | tatica | Introduzir `DAMP-scan` depois de pecas soltas e mates basicos: identificar o defeito antes de calcular. | DAMP | E/I/P |
| 600-1000 | seguranca | Manter ritual de seguranca separado: "o que ele ameaca?" e "meu lance pendura algo?". | Heisman/Avni + correcao DAMP | I/P |
| 0-1200 | meta | Usar Leitao como proporcao inicial de treino, reponderada por fraqueza local e tempo do dono. | Como montar programacao | E/I/P |
| 1000-1200 | abertura-principio | Revisar bloco de abertura para ligar desenvolvimento/centro/rei a estrutura de peoes e plano de meio-jogo, sem arvore de variante. | Manual de Aberturas | E/I/P |
| 1000-1400 | tatica/calculo | Criar ponte `calculo-forcado-curto`: dois candidatos, resposta adversaria, linha curta escrita. | Movimento Forcado | E/I/P |
| 800-1200 | transferencia | Adicionar partidas-modelo como estudo pergunta-resposta, mas apenas com PGN/comentario licito e texto original do app. | Series Jogue como | I/P |
| 0-1000 | final | Reforcar finais elementares e peoes antes de abertura profunda. | Capablanca PT | E/I |

### 2.3 Drill formats novos ou revisados

Os `exerciseMode` continuam travados: `explain | guided | retrieval | review | transfer`.

| drill_format | descricao | band | stage | exerciseMode | lichess_destino | sinal local | sourceInfluence | avoid |
|---|---|---|---|---|---|---|---|---|
| `damp-defeito-tatico-scan` | Escanear defeitos taticos antes de calcular. | 600-1200 | tatica | explain -> guided -> retrieval | Puzzle themes relacionados a hanging piece, pin/skewer, trapped piece/mobility e pawn/endgame quando fizer sentido. | Nomeia o defeito provavel antes do lance em amostra curta. | DAMP | Virar ritual longo ou substituir checagem de seguranca. |
| `roteiro-tempo-leitao` | Dividir a semana por enfase, com calculo/tatica como nucleo e finais/partidas/aberturas em dose menor. | todos | meta | explain -> review | App local + destinos Lichess ja permitidos. | Plano semanal nao fica monotematico e reage a fraqueza real. | Como montar programacao | Usar rating como porta ou impor percentual rigido. |
| `calculo-forcado-curto` | Escrever solucao curta: candidato, resposta forte, conclusao. | 1000-1400 | tatica/calculo | guided -> retrieval -> review | Puzzle Streak, Puzzle Theme e Analysis pos-partida sem engine. | Menos chute no primeiro lance; linha curta justificavel. | Movimento Forcado | Copiar exercicios ou exigir calculo GM cedo demais. |
| `abertura-plano-estrutura` | Estudar abertura como desenvolvimento, rei, centro, estrutura e plano seguinte. | 1000-1200 | abertura-principio | explain -> guided -> transfer | Lichess Study/Practice/video direto, nao explorer solto. | Em partidas encerradas, menos dama cedo/rei no centro/peca repetida sem motivo. | Manual de Aberturas | Virar decoreba de variantes. |
| `partida-modelo-pergunta` | Uma partida/modelo licita com perguntas de plano e momento critico. | 800-1200 | transferencia | explain -> review -> transfer | Lichess Study licito e privado. | Aluno nomeia um momento critico e uma ideia. | Colecoes Jogue como | Importar comentario protegido. |

### 2.4 Blocos novos ou revisados para 0->1200

| id | band | stage | signal | weakness | learningGoal | exerciseMode | lichess_destino | tempo_min | sourceInfluence | avoid | criterio_conclusao | microcopy |
|---|---|---|---|---|---|---|---|---:|---|---|---|---|
| `600-1000-tatica-00` | 600-1000 | tatica | Acerta tema isolado, mas nao sabe onde procurar tatica em posicao nova. | Olhar vai direto para lance candidato sem detectar defeito. | Identificar um defeito DAMP antes de calcular. | explain -> guided | Puzzle theme simples ou posicao de revisao propria. | 10-15 | DAMP | Chutar lance agressivo. | Em 10 posicoes simples, nomeia o defeito provavel antes do lance. | "Antes do lance bonito, ache o defeito: defesa, alinhamento, mobilidade ou promocao. O calculo vem depois." |
| `0-1200-meta-01` | 0-1200 | meta | Plano semanal desequilibrado ou excesso de abertura. | Treino disperso e pouca pratica ativa. | Distribuir tempo com prioridade para calculo/tatica, partidas classicas/revisao, finais e abertura basica. | explain -> review | App local orquestra destinos Lichess. | 5 | Leitao | Transformar percentual em promessa de rating. | A semana tem foco principal e blocos secundarios sem perder a fraqueza real. | "Abertura entra, mas nao engole o treino. Primeiro calculo, final e revisao honesta de partida." |
| `1000-1200-abertura-02` | 1000-1200 | abertura-principio | Sai da abertura sem plano ou com rei inseguro. | Memorizacao de lances sem entender estrutura. | Ligar centro, desenvolvimento, seguranca do rei e peoes ao plano de meio-jogo. | explain -> guided -> transfer | Study/video direto + partida 10+5 encerrada para revisao. | 15-20 | Manual de Aberturas | Explorer solto e variantes longas. | 3 partidas revisadas sem violacao grave de principio. | "A abertura nao e lista de lances: e arrumar as pecas para o meio-jogo que voce vai jogar." |
| `1000-1200-tatica-08` | 1000-1200 | tatica | Erra puzzles por resposta adversaria ignorada. | Calcula so o proprio golpe. | Escrever dois candidatos e a melhor defesa/resposta em uma linha curta. | guided -> retrieval | Puzzle Streak ou tema forca curto. | 15-20 | Movimento Forcado | Calculo profundo demais para a faixa. | 10 exercicios com candidato e resposta adversaria registrados. | "Seu lance nao joga sozinho. Para cada candidato, de a melhor resposta dele antes de escolher." |
| `800-1200-transferencia-02` | 800-1200 | transferencia | Entende tema em puzzle, mas nao leva para partida. | Falta de ponte entre exemplo e partida real. | Revisar uma partida-modelo licita e uma partida propria terminada, nomeando o mesmo tipo de decisao. | review -> transfer | Lichess Study privado + Analysis de partida encerrada. | 20-30 | Colecoes Jogue como + Capablanca | Copiar comentario de livro. | 1 momento critico nomeado em partida propria. | "A partida-modelo serve para treinar o olhar. A licao so conta quando voce acha algo parecido no seu jogo." |

### 2.5 Regras SE/ENTAO novas ou ajustadas

```text
SE stage == tatica
E seguranca_basica_estavel
E tema_misto_ou_posicao_nova_gera_chute
ENTAO inserir drill_format=damp-defeito-tatico-scan
COM exerciseMode=explain->guided->retrieval

SE gerando_plano_semanal
ENTAO usar proporcao-base inspirada em Leitao
MAS reponderar por fraqueza local, tempo disponivel e feedback recente
E nunca usar rating como gate

SE abertura_ruim
E seguranca/tatica_curta ainda instaveis
ENTAO manter abertura em principios minimos
E bloquear repertorio/variante profunda

SE abertura_ruim
E seguranca/tatica_curta estaveis
ENTAO usar abertura-plano-estrutura
COM foco em centro, desenvolvimento, rei e plano de meio-jogo

SE calculo_curto_falha_por_resposta_adversaria
ENTAO usar calculo-forcado-curto
COM dois candidatos + melhor resposta adversaria + conclusao

SE partida_modelo_for_usada
ENTAO usar PGN/comentario licito ou texto original do app
E nao copiar comentario/traducao/exercicio do acervo convertido
```

### 2.6 Fontes de dominio publico provavel

| fonte | status para o metodo | cautela |
|---|---|---|
| Capablanca, `Fundamentos do xadrez` / `Chess Fundamentals` | Fortalece lista de dominio publico provavel para o original. | Traducao/edicao PT-BR convertida pode ter direitos proprios. |
| Partidas historicas antigas nas colecoes | PGNs de partidas podem ser obtidos por fontes publicas/licitas. | Comentarios, selecao, exercicios e traducoes das colecoes continuam protegidos. |
| Tarrasch/Staunton/Blackburne e outros jogadores historicos nas series | Podem orientar busca de partidas-modelo publicas. | Nao usar o texto das colecoes como comentario-base. |

## Passo 3 - Avaliacao, concordancia e lacunas

### 3.1 Nota dos convertidos

Minha nota: **8.1/10** para o projeto atual.
Fico alinhado ao DeepSeek convertido (8.0) e abaixo do Gemini convertido (9.0). A diferenca vem de tres freios: redundancia massiva, copyright ativo e o fato de `Manual de Aberturas`/`Movimento Forcado` serem mais referencia/banco de pratica do que curriculo pronto 0-1200.

Comparacao com minha analise anterior do acervo completo: antes eu dei **8.0/10** com DAMP pendente; agora os convertidos sobem a confianca em DAMP e Leitao, mas nao mudam a nota global de forma dramatica porque a maior parte dos 66 textos unicos e redundante.

### 3.2 Suficiencia por lacuna pedida

| lacuna | status | decisao Codex |
|---|---|---|
| Repertorio de abertura PT-BR | Parcial forte | Ha referencia PT-BR util e principios claros, mas o app ainda precisa construir um repertorio minimo proprio por sinais locais. |
| Calculo intermediario 1000-1400 | Parcial | Movimento Forcado cobre 1201+ e treina escrita/forcantes, mas nao fecha 800-1200 nem substitui metodo de calculo. |
| Defesa/profilaxia | Nao fecha | DAMP tem "Defesa" como defeito tatico, nao como manual de defesa de posicoes inferiores. Heisman/Avni/Marin continuam mais importantes para seguranca e defesa. |

### 3.3 Cobertura adicionada

| area | o_que_adicionou | forca |
|---|---|---|
| Deteccao tatica | DAMP real, em PT-BR, para procurar defeitos antes de calcular. | Forte |
| Agenda de estudo | Percentuais e prioridades de treino vindos de uma fonte brasileira. | Forte |
| Abertura por ideias | Centro, desenvolvimento, rei, peoes e plano de meio-jogo em PT-BR. | Media-alta |
| Calculo curto | Ritual de solucao escrita e variantes forcadas graduadas. | Media |
| Partidas-modelo | Muitas portas de entrada para estilos, escolas e campeas. | Media, com redundancia alta |
| Fundamentos/finais | Capablanca PT reforca final-first e principios classicos. | Alta, confirmatoria |

### 3.4 Concordancia e desempate

| ponto | concordo/discordo/ajusto | justificativa |
|---|---|---|
| DAMP = Defesa, Alinhamento, Mobilidade, Promocao | Concordo | A leitura direta confirma os quatro termos e o foco em debilidades/defeitos taticos. |
| DAMP como ritual de seguranca | Discordo | Pode ajudar a vigiar a propria posicao, mas sua funcao primaria e deteccao tatica. O ritual de lance seguro deve continuar separado. |
| Leitao muda o gerador de plano | Concordo com ajuste | A proporcao e util, mas no produto vira base elastica por sinal local, nao regra por rating. |
| Manual de Aberturas fecha repertorio PT-BR | Ajusto | Fecha referencia e vocabulario, nao repertorio pronto. O corpo e varianteiro demais para 0-1200 se usado sem filtro. |
| Movimento Forcado fecha calculo 1000-1400 | Ajusto | Ajuda muito no topo da faixa e acima, mas o volume 1 comeca em 1201 e a serie e mais exercicio que metodo. |
| Colecoes "Jogue como" tem alto valor | Ajusto para medio | Boas para diversidade e transferencia, mas repetem template e nao podem ser fonte de comentarios copiados. |
| Capablanca PT entra forte | Concordo | Fortalece a base classica e final-first; a cautela e a traducao/edicao. |
| Nota 9.0 dos convertidos | Ajusto para 8.1 | Tres achados centrais sao fortes; o conjunto completo tem ruido e redundancia. |
| "DAMP pendente" na analise Codex anterior | Atualizo | Com os `.txt`, DAMP deixa de ser pendencia e vira evidencia forte, com encaixe corrigido. |

### 3.5 O que falta para o metodo

| area | nivel | formato que falta | por que ainda falta |
|---|---|---|---|
| Defesa pratica | 1000-1400 | Modulo simples de ameaca adversaria, defesa ativa, recurso defensivo e profilaxia curta. | DAMP nao e manual de defesa; fontes boas sao mais avancadas. |
| Calculo iniciante | 800-1200 | Ponte curta e nao frustrante: candidatos, resposta adversaria, linha de 2-3 lances. | Movimento Forcado comeca acima e e exercicio-driven. |
| Repertorio minimalista | 1000-1200 | Repertorio pessoal pequeno por estruturas e partidas reais do dono. | Manual de Aberturas e referencia, nao plano adaptativo. |
| Direitos/uso de partidas | todos | Politica clara de PGN publico, comentario original e Studies privados. | Comentarios e exercicios das colecoes tem copyright. |
| Thresholds reais | todos | Criterios empiricos por uso do dono: acerto, tempo, retorno apos erro, transferencia. | O acervo sugere, mas o app valida pelo uso pessoal. |

### 3.6 Redundancia e nucleo duro enxuto

O nucleo duro dos convertidos e pequeno:

| funcao | fontes nucleares |
|---|---|
| Deteccao tatica PT-BR | DAMP |
| Time budget | Como montar uma programacao de treinamento |
| Abertura por principios/referencia | Manual de Aberturas, filtrado |
| Calculo forcado graduado | Movimento Forcado, com cautela de faixa |
| Fundamento/final | Capablanca PT |
| Transferencia/modelos | Amostras das colecoes Jogue como, sem copiar comentarios |

Todo o restante deve ficar como biblioteca de consulta. Para implementacao 0-1200, nao ha motivo para deixar dezenas de volumes de template igual entrarem no gerador de plano.

### 3.7 Veredito

Os convertidos **mudam materialmente o metodo em dois pontos e meio**:

1. **Mudam de verdade:** DAMP agora esta verificado e deve entrar como deteccao tatica, nao seguranca.
2. **Mudam de verdade:** Leitao calibra a divisao de tempo e reforca o combate ao excesso de abertura.
3. **Mudam parcialmente:** Manual de Aberturas e Movimento Forcado melhoram PT-BR para abertura/calculo, mas exigem filtragem propria.

O restante reforca o metodo ja consolidado: finais cedo, treino ativo, repeticao, partidas-modelo e transferencia para partidas reais encerradas.

## Originality Contamination Gate

Artifact: `analise-convertidos-CODEX.md`

Intended use: relatorio interno de pesquisa pedagogica e integracao ao metodo.

Source IDs: textos convertidos locais do acervo, manifesto de conversao e analises anteriores.

| Risk area | Level | Evidence | Required change |
|---|---|---|---|
| Texto protegido reproduzido | Low | O relatorio usa sintese, metadados e categorias; nao inclui exercicios/solucoes/variantes. | Manter assim nas integracoes. |
| Lista/metodo proprietario copiado | Medium | DAMP como acronimo e conceito central vem de fonte protegida. | Usar como `sourceInfluence`; escrever microcopy propria; nao copiar sequencia, exemplos ou problemas. |
| Comentarios de partidas das colecoes | Medium | Series "Jogue como" dependem de comentarios/traducoes. | Usar PGNs licitos e comentario original do app. |
| Traducoes PT-BR | Medium | Capablanca original pode ser PD, traducao especifica pode nao ser. | Separar status do original e da edicao/traducao. |

Decision: **Allowed to proceed: yes**, como sintese interna clean-room.

Required rewrite: nenhuma neste relatorio; integracoes futuras devem preservar texto original do Professor Lemos.

## Proximos passos para integrar ao metodo consolidado

| arquivo/secao | acao recomendada |
|---|---|
| `docs/pedagogy/metodo-consolidado-acervo-2026-06-09.md` | Corrigir DAMP para Defesa/Alinhamento/Mobilidade/Promocao e mover de seguranca para deteccao tatica. |
| mesma doc, time budget | Adicionar Leitao como influencia de proporcao-base, explicitando que o app usa sinais locais e nao rating. |
| mesma doc, lacunas | Marcar abertura PT-BR e calculo intermediario como parcialmente melhorados, defesa ainda aberta. |
| `memory/state.md` | Registrar que a pendencia DAMP foi resolvida pela leitura direta dos convertidos. |
| `memory/progress.md` | Marcar esta analise Codex dos convertidos como concluida. |
| codigo futuro | Se virar implementacao, adicionar apenas `drill_format`/metadados; nao criar novo `exerciseMode`. |
| testes futuros | Cobrir: DAMP nao substitui seguranca; rating nao vira gate; abertura nao passa na frente de seguranca/tatica; textos protegidos nao entram no app. |
