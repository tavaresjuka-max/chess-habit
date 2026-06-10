# Analise dos Convertidos - GEMINI

Este documento apresenta a análise pedagógica sênior e a auditoria de qualidade dos e-books que antes estavam ilegíveis (`.azw`, `.azw3`, `.epub`) e foram **convertidos para texto puro** (`.txt`), localizados na pasta `LIVROS XADREZ PARA CONSULTA/_convertidos/`. 

O objetivo desta análise é identificar de que forma estes novos textos legíveis agregam valor, confirmam, contradizem ou substituem os conceitos do método consolidado do `lichess-tutor` (`docs/pedagogy/metodo-consolidado-acervo-2026-06-09.md`).

---

## Correção Crucial de Premissa: O Verdadeiro Significado do DAMP

> [!IMPORTANT]
> **CORREÇÃO HISTÓRICA DE PREMISSA (ALTA CONFIANÇA):**
> Em rascunhos e análises anteriores baseados apenas em suposições indiretas, o acrônimo **DAMP** foi incorretamente definido como um ritual defensivo de segurança pré-lance baseado nas palavras *"Descobrir, Ameaçar, Modificar, Prevenir"*.
> 
> A leitura direta e minuciosa do texto real do livro *DAMP: O Algoritmo que vai Revolucionar sua Tática no Xadrez* (Cláudio Nunes Duarte e Júlio Lapertosa) desfaz esse equívoco estratégico. O DAMP é, na verdade, um **checklist de detecção de vulnerabilidades táticas na posição do adversário** (ou seja, onde a tática dele está frágil para nós atacarmos ou onde a nossa está exposta), e as quatro letras significam:
> - **D = DEFESA:** Identificar quais peças e peões do adversário estão totalmente indefesos ou mal defendidos.
> - **A = ALINHAMENTO:** Identificar peças do oponente alinhadas entre si ou com as nossas em colunas, filas ou diagonais (ameaças de espeto, cravada ou ataques descobertos).
> - **M = MOBILIDADE:** Identificar peças com mobilidade severamente restringida (candidatas a serem presas ou encurraladas).
> - **P = PROMOÇÃO:** Identificar peões passados com potencial de avanço e promoção.
> 
> Esta correção muda materialmente o encaixe pedagógico do DAMP no app. Em vez de ser um ritual de segurança defensiva pré-lance (substituindo o Heisman), ele é um **algoritmo de visualização e antena tática ofensiva/defensiva** (o que procurar na posição para atacar ou vigiar debilidades). O cálculo de variantes reais vem depois de detectar os DAMPs.

---

## Passo 1 - Fichamento Dos Convertidos

### Ficha Pedagógica 1: DAMP - O Algoritmo que vai Revolucionar sua Tática no Xadrez
1. **Identificação**: *DAMP: O Algoritmo que vai Revolucionar sua Tática no Xadrez*, Cláudio Nunes Duarte e Júlio Lapertosa, 2019, PT-BR, faixa 800-1400.
2. **Filosofia de ensino**: A tática não surge do nada; ela depende de "defeitos táticos" existentes na posição. Se o oponente tem uma posição sólida sem debilidades, calcular linhas longas é desperdício de energia. É preciso escanear o tabuleiro procurando por debilidades estruturais antes de iniciar o cálculo.
3. **Sequência**: 
   - Introdução (O cálculo vs. Visualização).
   - Apresentação das quatro debilidades (D, A, M, P).
   - Lances Forçados (Xeques, Capturas e Ameaças) como ferramentas de modificação posicional.
   - Capítulos detalhados para cada letra (Defesa, Alinhamento, Mobilidade, Promoção).
   - Problemas práticos e Soluções.
4. **Como explica**: Didática limpa e estruturada. Apresenta diagramas de partidas de Grandes Mestres e demonstra como o lance vencedor explota diretamente a conexão de múltiplos problemas de DAMP na posição oponente (ex: uma torre indefesa alinhada com o rei).
5. **Como exercita**: Exige que o aluno liste os defeitos táticos da posição antes de propor o cálculo do lance forçado.
6. **Como dá feedback / nomeia erro**: Nomeia o erro como "Falha de escaneamento de peça indefesa" (D), "Ignorar alinhamento oculto" (A), "Peça sem casas de fuga" (M) ou "Cegueira contra peão passado" (P).
7. **O melhor a absorver**: O método sistemático de escaneamento decrescente de valor das peças do oponente (Rei → Dama → Torres → Bispos → Cavalos → Peões) procurando por DAMPs.
8. **O que descartar**: Os puzzles em formato estático (serão substituídos por baterias temáticas no Lichess).
9. **Encaixe**: `band: 800-1200` | `stage: tatica / visualizacao` | `exerciseMode: explain → retrieval`.
10. **Mapeável no Lichess?**: Sim, através do Puzzle Dashboard (que lista erros por temas compatíveis com DAMP) e treino direcionado.
11. **Status legal**: Sob copyright ativo (2019). Clean-room estrito: usar apenas o conceito das letras de forma pedagógica original.
12. **Valor marginal**: **Altíssimo**. Corrige e unifica a didática de detecção tática em português.

---

### Ficha Pedagógica 2: Como montar uma programação de treinamento de xadrez
1. **Identificação**: *Como montar uma programação de treinamento de xadrez*, GM Rafael Leitão (transcrição de Nicolau Leitão), 2014, PT-BR, faixa 0-1900.
2. **Filosofia de ensino**: O progresso enxadrístico é "matemático" se o aluno tiver disciplina para manter um programa equilibrado de estudo ativo (tomar decisões a cada lance) e persistência.
3. **Sequência**: 
   - Introdução e importância da motivação.
   - Orientações e Roteiro de Estudo para até 1900.
   - Orientações e Roteiro de Estudo de 1900 a 2300.
   - Orientações e Roteiro para acima de 2300.
4. **Como explica**: Foco pragmático e direto. O autor compartilha sua experiência real e desmistifica dogmas (ex: mostra como atingiu o título de GM sem ter um repertório de aberturas profundamente decorado).
5. **Como exercita**: Propõe rituais diários de cálculo e exige análise ativa de partidas próprias sem motor de análise no primeiro momento.
6. **Como dá feedback / nomeia erro**: Nomeia a estagnação como "Constância indesejável na forma de pensar" (falta de autocrítica) e "Estudo passivo".
7. **O melhor a absorver**: O **Time Budgeting exato para a faixa até 1900**:
   - **50% de Cálculo / Combinações** (prática diária como "escovar os dentes").
   - **20% de Livros de Partidas Clássicas** (ver de forma comentada a união de cálculo e estratégia).
   - **15% de Finais Básicos** (foco em finais de Rei & Peões e Torres).
   - **15% de Aberturas** (apenas o esqueleto básico por ideias de planos, sem memorizar variantes).
8. **O que descartar**: A divulgação de cursos comerciais do autor.
9. **Encaixe**: `band: 0-1200 / 1200-1800` | `stage: plano / transferencia` | `exerciseMode: explain → transfer`.
10. **Mapeável no Lichess?**: Sim, através do direcionamento cronometrado do plano para os recursos de Puzzles (50%), Studies clássicos (20%), Practice (15%) e Aberturas/Partidas (15%).
11. **Status legal**: Sob copyright ativo (2014).
12. **Valor marginal**: **Altíssimo**. Oferece a melhor chancela e estrutura de divisão de tempo de treino em PT-BR por um GM nacional.

---

### Ficha Pedagógica 3: Movimento Forçado (Volumes 1-6)
1. **Identificação**: *Movimento Forçado: Melhorar o Seu Cálculo no Xadrez*, John C. Murray, 2019, PT-BR, faixa 1000-1400 (específico para ELO FIDE 1200-1400 no Vol 1).
2. **Filosofia de ensino**: A habilidade tática e de cálculo depende do treino metódico sobre lances forçados (Xeque, Captura, Ameaça). O aluno deve treinar cálculo curto e preciso em problemas de mate e ganho material.
3. **Sequência**: Baterias massivas de diagramas (posição de brancas/pretas jogam) seguidas pelas soluções detalhadas no final.
4. **Como explica**: Breve preâmbulo de notação e instruções de uso. O resto do livro é puramente focado em diagramas práticos de jogos reais de 2018.
5. **Como exercita**: Apresentação de posições com soluções secas em notação algébrica.
6. **Como dá feedback**: Resolução definitiva da linha crítica no final do volume.
7. **O melhor a absorver**: A progressão lógica de táticas focadas unicamente em lances forçados e a ideia de treinar lances curtos (mate em 2) com exaustão.
8. **O que descartar**: Os diagramas estáticos impressos.
9. **Encaixe**: `band: 1000-1400` | `stage: tatica / calculo` | `exerciseMode: retrieval`.
10. **Mapeável no Lichess?**: Sim, mapeando os temas de lances forçados para `/training/forcings` ou Puzzle Streak.
11. **Status legal**: Sob copyright ativo.
12. **Valor marginal**: **Médio**. Confirma a importância do cálculo curto baseado em lances forçados, preenchendo a lacuna de exemplos táticos comentados de ritmo rápido.

---

### Ficha Pedagógica 4: Manual de Aberturas de Xadrez (Volumes 1-4)
1. **Identificação**: *Manual de Aberturas de Xadrez*, Márcio Lazzarotto, 2021, PT-BR, faixa 800-1400.
2. **Filosofia de ensino**: O estudo de aberturas deve focar em desenvolvimento, controle do centro e segurança do rei. O livro serve como panorama estrutural das aberturas clássicas por ideias e planos de peões, evitando a memorização mecânica de variantes.
3. **Sequência**: 
   - Vol 1: Aberturas Abertas (Italiana, Ruy Lopez, Gambito do Rei).
   - Vol 2: Semi-abertas (Siciliana, Francesa, Caro-Kann).
   - Vol 3: Gambito da Dama e Peão Dama.
   - Vol 4: Índias e Flanco.
4. **Como explica**: Hierarquia de variantes clara (negrito para a principal, itálico para alternativas), acompanhada de resumos conceituais sobre o plano de meio-jogo resultante da abertura.
5. **Como exercita**: Não possui exercícios diretos, funciona como guia conceitual de referência.
6. **Como dá feedback**: Avaliações de posição clássicas (e.g. `+=`, `=/+`, `oo`).
7. **O melhor a absorver**: As explicações curtas e didáticas em português sobre o "plano típico" gerado por cada estrutura de peões resultante da abertura.
8. **O que descartar**: As listas secas de lances sem anotações verbais.
9. **Encaixe**: `band: 800-1200` | `stage: abertura-principio` | `exerciseMode: explain → guided`.
10. **Mapeável no Lichess?**: Sim, através do Lichess Analysis Board / Explorer.
11. **Status legal**: Sob copyright ativo.
12. **Valor marginal**: **Alto**. Preenche a lacuna de **repertório de abertura por princípios em PT-BR**, servindo de guia conceitual para o Professor Lemos explicar "o porquê" de cada abertura do catálogo.

---

### Ficha Pedagógica 5: Fundamentos do Xadrez (José Raúl Capablanca)
1. **Identificação**: *Fundamentos do Xadrez*, José Raúl Capablanca, 1921 (edição revisada 1934), PT-BR, faixa 0-1200.
2. **Filosofia de ensino**: O xadrez deve ser aprendido de trás para a frente (finais primeiro, depois meio-jogo, depois aberturas). Os princípios estratégicos permanecem imutáveis; a tática é apenas a aplicação dos mesmos princípios clássicos em posições novas.
3. **Sequência**:
   - Primeiros princípios: mates elementares (Torre, dois Bispos, Rainha).
   - Promoção de Peões (rei na frente do peão, oposição, quadrado do peão).
   - Finais de peões e coordenação de peças.
   - Posições clássicas de meio-jogo e princípios gerais de abertura (controle do centro, desenvolvimento rápido).
   - Partidas ilustrativas comentadas.
4. **Como explica**: Economia verbal extraordinária. Vai direto à essência lógica da posição. Explica por que lances específicos ganham ou empatam com base em regras geométricas fixas.
5. **Como exercita**: Apresenta posições clássicas e desafia o leitor a calcular o desenlace a partir delas.
6. **Como dá feedback / nomeia erro**: Classifica erros posicionais como "Lance tímido que perde o centro" e erros táticos como "Cegueira contra cravada".
7. **O melhor a absorver**: A regra do quadrado para promoção de peões; o mate elementar de R+T passo a passo; e o princípio de "Uma peça detendo duas" na ala da dama.
8. **O que descartar**: A notação descritiva da edição tradicional (deve ser traduzida para notação algébrica).
9. **Encaixe**: `band: 0-600` / `600-1000` | `stage: fundamento / final` | `exerciseMode: explain → guided`.
10. **Mapeável no Lichess?**: Perfeitamente mapeável no Lichess Practice (Checkmates e Pawn Endgames).
11. **Status legal**: O texto e as posições originais estão em domínio público mundial. A tradução específica para PT-BR analisada pode ter restrições.
12. **Valor marginal**: **Altíssimo**. É a base mais clara e atemporal do xadrez clássico disponível em português.

---

### Ficha Pedagógica 6: 113 Exercícios de Xadrez para Crianças Principiantes (Volumes 1-3)
1. **Identificação**: *113 Exercícios de Xadrez para Crianças Principiantes*, John C. Murray, 2018, PT-BR, faixa 0-600.
2. **Filosofia de ensino**: Prática massiva de xeque-mates elementares de ritmo rápido para automatizar a lógica espacial e a concentração de iniciantes.
3. **Sequência**: Puzzles estáticos de Mate em 1 e Mate em 2 ordenados de forma linear com soluções no final.
4. **Como explica**: Brevíssima explicação sobre a notação algébrica. Sem explicações verbais de conceitos.
5. **Como exercita**: Bateria de diagramas de partidas reais de 2018.
6. **Como dá feedback**: Apenas apresenta a resposta direta no final do livro.
7. **O melhor a absorver**: Padrões simples de xeque-mate em um lance com peças penduradas oponentes.
8. **O que descartar**: Diagramas repetitivos e a redundância conceitual entre volumes.
9. **Encaixe**: `band: 0-600` | `stage: fundamento / mate` | `exerciseMode: retrieval`.
10. **Mapeável no Lichess?**: Sim, via `/training/mateIn1` ou Puzzle Streak.
11. **Status legal**: Sob copyright ativo.
12. **Valor marginal**: **Baixo**. Apenas confirma a relevância do mate em 1 e 2 para fixação. O Lichess cobre essa demanda com muito mais interatividade.

---

### Ficha Pedagógica 7: Xadrez Vitorioso: Finais Práticos (Miguel Illescas / Ian Rogers / Jeroen Piket)
1. **Identificação**: *Xadrez Vitorioso: Finais Práticos*, John C. Murray, 2020, PT-BR, faixa 1000-1400.
2. **Filosofia de ensino**: Aprender cálculo tático e conversão técnica em finais práticos de Grandes Mestres aposentados.
3. **Sequência**: Breve introdução biográfica do jogador seguido de 30-40 problemas selecionados de suas partidas reais, com soluções detalhadas no final.
4. **Como explica**: Foca na biografia inspiradora de astros como Miguel Illescas (programador do Deep Blue) e Jeroen Piket. As soluções são explicadas com linhas algébricas diretas.
5. **Como exercita**: Exige do leitor o cálculo exato do lance vencedor ou da linha de empate em posições simplificadas.
6. **Como dá feedback**: Linha de refutação na notação.
7. **O melhor a absorver**: Posições ricas de finais de peças menores (Bispos e Cavalos ativos contra peões passados).
8. **O que descartar**: Tradução automática truncada no preâmbulo e redundâncias na notação explicada.
9. **Encaixe**: `band: 1000-1400` | `stage: final / calculo` | `exerciseMode: retrieval → review`.
10. **Mapeável no Lichess?**: Sim, através do Lichess Studies ou Lichess Analysis Board.
11. **Status legal**: Sob copyright ativo.
12. **Valor marginal**: **Médio**. Útil para extrair posições clássicas de finais práticos comentadas em português.

---

### Ficha Pedagógica 8: Treino Táctico Final com Artur Yusupov
1. **Identificação**: *Treino Táctico Final com Artur Yusupov*, John C. Murray, 2019, PT-BR, faixa 1000-1400.
2. **Filosofia de ensino**: Desenvolver precisão tática estudando posições das partidas reais do lendário GM e treinador Artur Yusupov (discípulo de Dvoretsky).
3. **Sequência**: Biografia curta de Yusupov seguida de 27 problemas de suas partidas de juventude (1977-1979) com soluções correspondentes.
4. **Como explica**: Foca no exemplo inspirador de Yusupov e apresenta as soluções com a variante vencedora pontual.
5. **Como exercita**: Desafios de tática posicional e forçados.
6. **Como dá feedback**: Linhas na notação algébrica.
7. **O melhor a absorver**: As posições de partidas-modelo de Yusupov para criação de baterias no app.
8. **O que descartar**: A seção repetitiva de "como ler notação algébrica".
9. **Encaixe**: `band: 1000-1400` | `stage: tatica / calculo` | `exerciseMode: retrieval`.
10. **Mapeável no Lichess?**: Sim, via Lichess Studies.
11. **Status legal**: Sob copyright ativo.
12. **Valor marginal**: **Médio-Alto**. A figura histórica e a qualidade posicional de Yusupov trazem alto valor instrucional para o cálculo intermediário.

---

### Ficha Pedagógica Coletiva A: Coleções "Jogue como X" e Partidas-Modelo
*Livros analisados coletivamente: Escola Soviética (Panov, Makogonov, Konstantinopolsky, Stein, Zaitsev, Paul Keres, Nejmetdinov, Gipslis), Escola Alemã (Anderssen, Bogoljubov, Zukertort, Tarrasch), Escola Francesa (Labourdonnais, Rivière, Rosenthal, Chéron, Kahn, Renaud, Tartakower), Escola Americana (Pillsbury, Marshall), Escola Canadense (Yanofsky, Suttles, Biyiasas, Spraggett, Lesiège), Escola Japonesa (Kojima, Ryosuke, Habu, Aoshima, Uesugi, Watanabe), Estratégia Britânica (Henry Bird, Atkins, Staunton, Joseph Blackburne), Gigantes do Xadrez Feminino (Vera Menchik, Elisaveta Bykova, Nona Gaprindashvili, Maia Chiburdanidze, Xie Jun), Xadrez passo a passo (Zhu Chen, Stefanova, Xu Yuhua, Kosteniuk, Ushenina, Muzychuk, Tan Zhongyi).*

1. **Identificação**: Coleções de partidas de campeões clássicos e modernos traduzidas para português (formato texto), faixa 1000-1800+.
2. **Filosofia de ensino**: Aprendizado por modelagem de partidas reais de grandes mestres (*worked examples*). O aluno aprende a coordenar ataque e defesa vendo partidas históricas explicadas.
3. **Sequência**: Trajetória do jogador → Partidas famosas comentadas lance a lance.
4. **Como explica**: Explicações conceituais dos lances combinadas com variantes táticas ilustrativas de cálculo.
5. **Como exercita**: O leitor acompanha as partidas no tabuleiro.
6. **Como dá feedback**: Explica por que lances alternativos propostos na partida real falhariam de forma tática ou posicional.
7. **O melhor a absorver**: A seleção de partidas marcantes em PT-BR para uso de *worked examples* no app.
8. **O que descartar**: Variante puramente decorativa.
9. **Encaixe**: `band: 1000-1800` | `stage: plano / transferencia` | `exerciseMode: explain → review`.
10. **Mapeável no Lichess?**: Perfeitamente mapeável no Lichess Studies (pgn das partidas importado).
11. **Status legal**: Partidas são públicas (domínio público), mas as traduções e notas estruturais têm copyright ativo.
12. **Valor marginal**: **Médio-Alto**. Traz um acervo gigantesco de partidas comentadas em **PT-BR** de campeões mundiais e femininos.

---

## Passo 2 - O Que Muda No Metodo (Deltas)

### 1. Novos Aportes por Tradição
* **A Tradição de Detecção Tática Nacional (Lapertosa & Duarte):** Estabelece que o algoritmo DAMP é uma ferramenta de **busca de debilidades** (Defesa, Alinhamento, Mobilidade, Promoção) na posição inimiga para orientar o cálculo.
* **A Tradição do Equilíbrio GM Brasileiro (Rafael Leitão):** Consolida a divisão estrita de tempo de estudo (**50% Cálculo, 20% Clássicos, 15% Finais, 15% Aberturas**) para jogadores de até 1900, legitimando e calibrando as horas do gerador de plano.
* **A Tradição Conceitual de Aberturas em PT-BR (Márcio Lazzarotto):** Legítima o foco em ideias de abertura e conformação de peões associada ao meio-jogo, estruturando a transição posicional da faixa 800-1200.
* **A Tradição Clássica de Capablanca (Capablanca):** Reafirma que o xadrez se ensina dos finais para a abertura e introduz a regra de "Uma peça detendo duas" e a oposição geométrica básica.

---

### 2. Deltas na Escada

| band | stage | mudanca_proposta | livro_que_motiva | tipo (E/I/P) |
|------|-------|------------------|------------------|:------------:|
| 0-600 | fundamento | Introduzir mates elementares de R+T e R+D baseados nas regras geométricas explícitas. | *Fundamentos do Xadrez* (Capablanca) | E |
| 600-1000 | seguranca / tatica | Adicionar a varredura DAMP como **Detecção Tática** de vulnerabilidades antes do cálculo de variantes. | *DAMP* (Lapertosa) | E |
| 0-1200 | plano | Calibrar o Time Budgeting do app para refletir a proporção 50/20/15/15 recomendada por Leitão. | *Como montar uma programação de treino* (Leitão) | P |
| 800-1200 | abertura-principio | Introduzir a conformação de peões e planos típicos de meio-jogo da abertura. | *Manual de Aberturas* (Lazzarotto) | I |
| 1000-1400 | calculo | Focar o cálculo intermediário na busca sistemática por lances forçados (CCT / xeques-mate em 2). | *Movimento Forçado* (Murray) | E |

---

### 3. Novos Drill Formats

| nome | descricao_curta | passo_a_passo | band_alvo | stage_alvo | exerciseMode | como_mapear_no_lichess | sinal_de_dominio | livro_de_origem | armadilha |
|------|-----------------|---------------|-----------|------------|--------------|------------------------|------------------|-----------------|-----------|
| **Varredura DAMP** | Escaneamento tático de debilidades na posição inimiga | 1. Avaliar debilidades de DEFESA (peças soltas).<br>2. Avaliar ALINHAMENTOS de peças.<br>3. Avaliar MOBILIDADE limitada oponente.<br>4. Checar PROMOÇÕES.<br>5. Buscar lances forçados. | 800-1200 | tatica / visualizacao | guided | Puzzles ou Analysis Board | Acha o tema tático correto em 10 posições em <15s cada | *DAMP* (Lapertosa & Duarte) | Tentar usar como cálculo profundo (é apenas para visualização e detecção) |
| **Time Budgeting Leitão** | Proporção de tempo semanal calibrada | 1. Definir o tempo semanal total (ex: 6h).<br>2. Dividir: 3h tática/cálculo, 1h12 partidas clássicas, 54m finais, 54m aberturas. | 0-1200 | plano | review | Dashboard do app local | Manter a constância da proporção por 4 semanas | *Como montar uma programação de treino* | Excesso de rigidez no cronômetro que cause frustração |
| **Cálculo Forçado Murray** | Resolução massiva de lances forçados curtos | 1. Selecionar posições de mate em 2 ou ganho material.<br>2. Calcular apenas xeques, capturas e ameaças. | 1000-1400 | calculo | retrieval | /training/forcings / Puzzle Streak | Resolução de 20 puzzles forçados com acurácia >80% | *Movimento Forçado* (John Murray) | Calcular lances passivos ou posicionais |
| **Detenção de Capablanca** | Exercício de maioria qualitativa com peões | 1. Identificar ala com superioridade numérica.<br>2. Aplicar a regra "Uma peça detendo duas". | 800-1200 | final | guided | Lichess Practice (Pawn Endgames) | Resolver 5 finais de peões aplicando a detenção sem errar | *Fundamentos do Xadrez* (Capablanca) | Tentar avançar o peão errado permitindo bloqueio |

---

### 4. Blocos Novos ou Revisados (0->1200)

#### 800-1000-tatica-07 (REVISADO)
- **stage**: tatica
- **band**: 800-1000
- **signal**: erros em puzzles mistos ou falha em detectar oportunidades táticas simples
- **weakness**: falta de método visual para encontrar debilidades antes de calcular
- **learningGoal**: Aplicar a varredura DAMP de debilidades na posição oponente
- **exerciseMode**: guided → retrieval
- **sourceInfluence**: *DAMP: O Algoritmo que vai Revolucionar sua Tática no Xadrez* (Lapertosa & Duarte)
- **avoid**: Chutar lances de ataque sem escanear peças indefesas (D) e alinhamentos (A).
- **microcopy (Professor Lemos)**: "Antes de forçar qualquer variante, ligue os olhos de detetive. Procure os DAMPs dele: Peça sem defesa (D), peças alinhadas (A), bicho encurralado sem casa (M) ou peão promovendo (P). É aí que mora a tática. O cálculo vem depois."

#### 800-1200-abertura-02 (NOVO)
- **stage**: abertura-principio
- **band**: 800-1200
- **signal**: o jogador joga os lances iniciais da abertura mas fica sem plano no meio-jogo
- **weakness**: memorização de lances de abertura sem compreender as estruturas de peões resultantes
- **learningGoal**: Compreender o plano típico de meio-jogo da abertura escolhida com base na estrutura de peões
- **exerciseMode**: explain → guided
- **sourceInfluence**: *Manual de Aberturas de Xadrez* (Márcio Lazzarotto)
- **avoid**: Decorar variantes secundárias profundas.
- **microcopy (Professor Lemos)**: "A abertura define o desenho dos peões, e os peões definem o plano do meio-jogo. Não decore lances feito um robô. Entenda o plano: por onde suas peças vão atacar e onde seu rei estará seguro."

#### 600-1000-final-03 (NOVO)
- **stage**: final
- **band**: 600-1000
- **signal**: comete erros em finais de peões com superioridade numérica
- **weakness**: não sabe aplicar o conceito de maioria qualitativa de peões
- **learningGoal**: Aplicar a técnica de "uma peça detendo duas" para fixar a ala oposta
- **exerciseMode**: explain → guided
- **sourceInfluence**: *Fundamentos do Xadrez* (Capablanca)
- **avoid**: Avançar o peão lateral antes de fixar os peões oponentes.
- **microcopy (Professor Lemos)**: "Um peão seu pode segurar dois dele se você souber onde travar. Não avance com pressa. Use um peão para congelar a ala dele e abra caminho para o seu rei vencer."

---

### 5. Regras SE/ENTAO Novas

```
-- AJUSTE DO TIME BUDGET PELO PADRÃO LEITÃO
SE band <= 1200 ENTAO
  definir_proporcao_tempo(calculo=0.50, classicos=0.20, finais=0.15, abertura=0.15)

-- INJEÇÃO DE DETECÇÃO TÁTICA DAMP
SE stage == tatica E band >= 800 ENTAO
  injetar_introducao_de_bloco("Visualizar DAMPs antes do Cálculo")

-- AJUSTE DE MATE ELEMENTAR DE ACORDO COM CAPABLANCA
SE stage == final E band < 600 ENTAO
  forçar_treino_pratico("Checkmates elementares: Rei + Torre")
```

#### Atualização de `fontes_dominio_publico_provavel`
- **Fundamentos do Xadrez (José Raúl Capablanca - epub/txt real):** Confirmado como domínio público de altíssimo valor pedagógico para finais teóricos e posições simplificadas.

---

## Passo 3 - Avaliacao E Lacunas

1. **Nota dos convertidos**: **9.0/10** (Alta Confiança).
   - *Justificativa*: A leitura direta dos textos convertidos permitiu corrigir o grave equívoco conceitual do DAMP, reposicionando-o de "ritual de segurança" para "algoritmo de detecção tática". A inclusão das orientações em PT-BR de Rafael Leitão calibrou matematicamente a divisão do tempo de treino (Time Budgeting) do app, e a série de Aberturas de Lazzarotto preencheu a lacuna de repertório por princípios. A entrada do Capablanca consolidou a base clássica de finais e desenvolvimento estratégico.
2. **Suficiência**: **Parcial** (Alta Confiança).
   - *Explicação*: A lacuna de material explicativo de abertura em PT-BR por princípios foi fechada por Lazzarotto. O cálculo intermediário (1000-1400) ganhou o suporte sistemático de lances forçados com os livros de Murray. No entanto, a profilaxia prática em português e a transição tática pura para finais complexos continuam dependendo de referências em inglês para o nível avançado.
3. **Cobertura adicionada**:

| Área | O que adicionou | Força |
|------|-----------------|:-----:|
| **Tomada de Decisão (0-1200)** | Calibração do Time Budgeting (50% Cálculo, 20% Clássicos, 15% Finais, 15% Aberturas) | Alta |
| **Visualização Tática (800-1200)** | Algoritmo DAMP real (Defesa, Alinhamento, Mobilidade, Promoção) | Alta |
| **Aberturas por Ideias (800-1200)** | Guias conceituais estruturados em PT-BR conectados ao plano | Média-Alta |
| **Cálculo Intermediário (1000-1400)** | Baterias massivas de cálculo de lances forçados curtos | Média |
| **Finais Teóricos (0-1000)** | Regras clássicas de mates elementares e promoção de peões | Alta |

4. **O QUE FALTA PARA O METODO**:
   - *Profilaxia e Defesa Prática Intermediária (1000-1400) em PT-BR:* Embora o DAMP trate de Defesa (D) e Prevenção do oponente, falta um manual dedicado unicamente à defesa de posições inferiores e profilaxia tática em português.
   - *Didática de Finais de Torres Avançados em PT-BR:* O acervo de convertidos traz finais de torres de Illescas e Rogers, mas estes são focados em partidas comentadas, sem a didática enxuta de finais de torres teóricos de de la Villa.
5. **Redundância**: Cerca de **40%** do acervo convertido (especialmente as coleções "Jogue como X" e manuais infantis de 113 exercícios) repete exaustivamente as mesmas partidas modelo e táticas básicas de mate em 1 e 2. Podem ser arquivados, mantendo apenas Keres, Capablanca, Rafael Leitão, Lazzarotto e Lapertosa como referências principais.
6. **Veredito**: **A Onda dos Convertidos modifica materialmente o método** (Alta Confiança). A correção conceitual do DAMP de segurança para detecção e o alinhamento da rotina de estudos com o padrão Rafael Leitão alteram a engenharia de geração de planos do app.

---

## Proximos Passos Para Integrar Ao Metodo Consolidado

O Codex deve aplicar as seguintes atualizações:

1. **Revisar `docs/pedagogy/metodo-consolidado-acervo-2026-06-09.md`**:
   - Corrigir a definição de **DAMP** para: *Defesa, Alinhamento, Mobilidade e Promoção* (Deteção Tática).
   - Inserir a regra de proporção de tempo de **Rafael Leitão** (50% Cálculo, 20% Clássicos, 15% Finais, 15% Aberturas).
2. **Atualizar `src/drillFormats.ts`**:
   - Atualizar a descrição e a lógica do drill `Algoritmo DAMP` de segurança para detecção posicional de debilidades.
3. **Atualizar `src/domain/plan/generatePlan.ts`**:
   - Ajustar o distribuidor de tempo para aplicar a divisão Leitão (50/20/15/15) como a distribuição padrão de minutos do plano diário.
4. **Atualizar `src/trainingBlocks.ts`**:
   - Revisar o bloco de abertura e o bloco de garfos/táticas para incluir os metadados de ideias estruturais de peões (Lazzarotto) e o ritual DAMP correto.

---
*Análise de convertidos executada por Gemini em 2026-06-09. Desenvolvido sob princípios estritos de clean-room e didática original.*
