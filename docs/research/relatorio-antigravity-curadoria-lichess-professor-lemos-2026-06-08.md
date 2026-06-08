# Relatório Antigravity - Curadoria Lichess para Professor Lemos

Data: 2026-06-08  
IA Pesquisadora: Antigravity  
Projeto: lichess-tutor  

---

## Método, Verificação e Limites Legais

Este relatório apresenta a curadoria profunda de recursos do ecossistema Lichess para o tutor pessoal adaptativo **Professor Lemos** (faixa 0-1200). 

A pesquisa foi conduzida sob premissas estritas de **clean-room**:
- **Sem Scraping:** Apenas APIs oficiais, arquivos XML/YAML de tradução/rotas do Lichess/lila, e páginas públicas verificadas.
- **Sem Cópia de Conteúdo Protegido:** Nenhuma solução de puzzles, PGNs completos de estudos, comentários ou transcripts foram copiados ou persistidos.
- **Auditoria de Links:** Todas as URLs foram testadas e validadas contra a base de dados real do Lichess. Os IDs de vídeo recomendados foram cruzados com os metadados do Chessfactor e do canal oficial do Lichess.
- **Fair Play & Privacidade:** Nenhuma recomendação incentiva ajuda em tempo real (apenas análise pós-jogo em partidas terminadas) e a integração de dados respeita o limite de privacidade (OAuth restrito a `puzzle:read` e `study:write` locais).

---

## Catálogo de Achados Curados

### Achado 1

**Título:** Lichess Practice (Página Principal)  
**Tipo:** official-practice  
**URL:** https://lichess.org/practice  
**Autor/Fonte:** Lichess  
**Valor:** A  
**Tema principal:** Portal central de módulos interativos e guiados.  
**Fraquezas que treina:** 
- mate-in-1
- mate-in-2
- fork
- pin
- skewer
- discovered
- endgame-pawn
- endgame-rook
- conversion
- calculation
- other

**Nível sugerido:** misto  
**Duração estimada:** variável  
**Por que é útil:**  
É o index de todos os módulos práticos oficiais construídos pelo Lichess. O grande diferencial é que o portal é interativo, lida com a execução no próprio servidor do Lichess e salva o progresso do usuário em sua conta sem exigir que o app implemente um tabuleiro ou lógica de validação de lances. Fornece o alicerce para estruturar a progressão das sessões do aluno.  
**Quando o Professor Lemos deveria recomendar:**  
Como fallback geral quando o aluno não possui sinais suficientes para um tema específico ou quer escolher livremente uma área para praticar no Lichess.  
**Como implementar no app:**  
Salvar como link estático no catálogo sob a categoria "Portal Oficial de Treinamento", usado para navegação direta ou quando o app precisa de um destino genérico de alta confiança.  
**Dados necessários:** URL, título, tipo, valor, nível.  
**Riscos:** Interface inteiramente baseada nas preferências de idioma do usuário no Lichess. Mudanças de rotas no portal principal são raras, mas possíveis.  
**Confiança:** alta  

---

### Achado 2

**Título:** Lichess Learn - Chess Basics  
**Tipo:** official-practice  
**URL:** https://lichess.org/learn  
**Autor/Fonte:** Lichess  
**Valor:** A  
**Tema principal:** Fundamentos absolutos e regras do jogo.  
**Fraquezas que treina:** 
- opening-principles
- blunder-rate
- defensive-awareness
- other

**Nível sugerido:** iniciante  
**Duração estimada:** média  
**Por que é útil:**  
Ensina os movimentos das peças, regras especiais (roque, en passant, promoção) e conceitos primários de ataque e defesa. É essencial para alunos com rating estimado abaixo de 800 que demonstram em partidas erros básicos de regulamento ou blunders gravíssimos de peças inteiras logo na abertura.  
**Quando o Professor Lemos deveria recomendar:**  
Rating de onboarding abaixo de 800 ou quando o diagnóstico de partidas indicar blunders por falta de compreensão de regras de movimento das peças ou captura.  
**Como implementar no app:**  
Opção recomendada nos primeiros dias para o nível iniciante. O app abre o link externo e não monitora progresso de forma automatizada.  
**Dados necessários:** URL, título, tipo, nível, fraquezas.  
**Riscos:** Muito elementar para jogadores acima de 900.  
**Confiança:** alta  

---

### Achado 3

**Título:** Lichess Practice - The Fork  
**Tipo:** official-practice  
**URL:** https://lichess.org/practice/fundamental-tactics/the-fork/Qj281y1p  
**Autor/Fonte:** Lichess  
**Valor:** A  
**Tema principal:** Padrão de ataque duplo (Garfo).  
**Fraquezas que treina:** 
- fork
- hanging-piece
- calculation

**Nível sugerido:** iniciante  
**Duração estimada:** curta  
**Por que é útil:**  
Apresenta exercícios guiados e progressivos para fixação do conceito de garfo (garfos de cavalo, peão, bispo e dama). Em vez de soltar o aluno em puzzles randômicos, o módulo ensina o jogador a visualizar o ataque simultâneo a dois alvos de forma controlada.  
**Quando o Professor Lemos deveria recomendar:**  
Sempre que a fraqueza de "fork" estiver no topo das prioridades e o aluno ainda não tiver consolidado a aula teórica (estágio `guided`).  
**Como implementar no app:**  
Recurso padrão número 1 para a fraqueza de garfo. Ao clicar, o app ativa o cronômetro do bloco "Conceito Guiado".  
**Dados necessários:** URL, studyId (`Qj281y1p`), weaknessTags, nível, valor.  
**Riscos:** A página do Lichess possui texto explicativo em inglês, mas as coordenadas e a interatividade dos lances independem de idioma.  
**Confiança:** alta  

---

### Achado 4

**Título:** Lichess Practice - The Pin  
**Tipo:** official-practice  
**URL:** https://lichess.org/practice/fundamental-tactics/the-pin/9ogFv8Ac  
**Autor/Fonte:** Lichess  
**Valor:** A  
**Tema principal:** Cravadas absolutas e relativas.  
**Fraquezas que treina:** 
- pin
- defensive-awareness
- conversion

**Nível sugerido:** iniciante  
**Duração estimada:** curta  
**Por que é útil:**  
Ensina a diferença entre cravada absoluta (contra o rei) e relativa, demonstrando como restringir a mobilidade do oponente e acumular pressão sobre a peça incapaz de se mover. Ajuda a desenvolver a percepção defensiva de não deixar peças desprotegidas atrás de peças de maior valor.  
**Quando o Professor Lemos deveria recomendar:**  
Erros recorrentes contra cravadas em diagonais ou colunas abertas, ou quando puzzles do tema `pin` forem perdidos sistematicamente.  
**Como implementar no app:**  
Recurso padrão número 1 para a fraqueza de cravada.  
**Dados necessários:** URL, studyId (`9ogFv8Ac`), weaknessTags, nível.  
**Riscos:** Dependência de que o Lichess mantenha o studyId estável (o ID pertence à árvore de código fonte do lila, garantindo alta estabilidade).  
**Confiança:** alta  

---

### Achado 5

**Título:** Lichess Practice - The Skewer  
**Tipo:** official-practice  
**URL:** https://lichess.org/practice/fundamental-tactics/the-skewer/tuoBxVE5  
**Autor/Fonte:** Lichess  
**Valor:** A  
**Tema principal:** Ataque raio-X linear (Espeto).  
**Fraquezas que treina:** 
- skewer
- pin
- calculation

**Nível sugerido:** iniciante  
**Duração estimada:** curta  
**Por que é útil:**  
Diferencia de forma prática o espeto da cravada (no espeto, a peça de maior valor está na frente e é forçada a se mover, expondo a peça de menor valor atrás). Excelente para táticas de final com peças maiores como damas e torres.  
**Quando o Professor Lemos deveria recomendar:**  
Rating intermediário inicial, baixo rendimento no tema `skewer` ou perdas frequentes de material na última fileira ou diagonais sob pressão linear.  
**Como implementar no app:**  
Recurso padrão número 1 para a fraqueza de espeto.  
**Dados necessários:** URL, studyId (`tuoBxVE5`), weaknessTags.  
**Riscos:** Confusão pedagógica inicial do aluno entre pin e skewer se não explicados conceitualmente antes pelo app.  
**Confiança:** alta  

---

### Achado 6

**Título:** Lichess Practice - Discovered Attacks  
**Tipo:** official-practice  
**URL:** https://lichess.org/practice/fundamental-tactics/discovered-attacks/MnsJEWnI  
**Autor/Fonte:** Lichess  
**Valor:** A  
**Tema principal:** Ataques descobertos e xeque descoberto.  
**Fraquezas que treina:** 
- discovered
- calculation
- visualization
- mate-in-2

**Nível sugerido:** intermediário  
**Duração estimada:** curta  
**Por que é útil:**  
Exercita a habilidade de mover uma peça revelando um ataque latente de outra peça posicionada atrás dela. Cobre xeque descoberto e prepara o aluno para xeque duplo (o ataque tático mais destrutivo do xadrez).  
**Quando o Professor Lemos deveria recomendar:**  
Sinal de fraqueza em `discovered` ou quando o aluno alcança a faixa de 1000 de rating e precisa aprender táticas de múltiplos lances.  
**Como implementar no app:**  
Recurso primário para a fraqueza de descoberto.  
**Dados necessários:** URL, studyId (`MnsJEWnI`), weaknessTags.  
**Riscos:** Exige maior profundidade de visualização. Recomendar preferencialmente em sessões com bom tempo disponível.  
**Confiança:** alta  

---

### Achado 7

**Título:** Lichess Practice - Piece Checkmates I  
**Tipo:** official-practice  
**URL:** https://lichess.org/practice/checkmates/piece-checkmates-i/BJy6fEDf  
**Autor/Fonte:** Lichess  
**Valor:** A  
**Tema principal:** Técnicas de mate básico com peças maiores (Dama e Torre).  
**Fraquezas que treina:** 
- mate-in-1
- mate-in-2
- conversion

**Nível sugerido:** iniciante  
**Duração estimada:** média  
**Por que é útil:**  
Ensina a forçar o mate com Dama e Rei contra Rei, duas Torres contra Rei, e uma Torre e Rei contra Rei. Corrige o terrível erro de iniciantes de afogar o rei adversário em finais amplamente ganhos ou empatar por repetição/insuficiência material por falta de técnica de corte.  
**Quando o Professor Lemos deveria recomendar:**  
Dificuldade em converter finais elementares com grande vantagem material, ou afogamentos frequentes acusados em partidas terminadas.  
**Como implementar no app:**  
Recurso obrigatório de finalização para iniciantes. Integrado à fraqueza de conversão e mate.  
**Dados necessários:** URL, studyId (`BJy6fEDf`), weaknessTags.  
**Riscos:** A prática contra a engine do Lichess pode ser frustrante se o aluno não souber a técnica de "caixa" ou "escada". O app deve dar uma dica em texto antes de abrir o link.  
**Confiança:** alta  

---

### Achado 8

**Título:** Lichess Practice - Checkmate Patterns I  
**Tipo:** official-practice  
**URL:** https://lichess.org/practice/checkmates/checkmate-patterns-i/fE4k21MW  
**Autor/Fonte:** Lichess  
**Valor:** A  
**Tema principal:** Padrões clássicos de xeque-mate.  
**Fraquezas que treina:** 
- mate-in-2
- back-rank
- calculation
- visualization

**Nível sugerido:** iniciante  
**Duração estimada:** média  
**Por que é útil:**  
Apresenta mates típicos como mate de corredor (Back-Rank), mate de Anastácia, mate do gancho, entre outros. O jogador aprende a visualizar o rei adversário como um alvo estratego, focando na geometria das peças ao redor do rei.  
**Quando o Professor Lemos deveria recomendar:**  
Erro recorrente de mate-in-2 ou blunders na última fileira (back-rank) cometidos em partidas recentes.  
**Como implementar no app:**  
Recurso padrão para fixação de padrões de mate em 2.  
**Dados necessários:** URL, studyId (`fE4k21MW`), tags.  
**Riscos:** Módulos longos. Requer que o bloco diário do plano tenha pelo menos 15 a 20 minutos de budget.  
**Confiança:** alta  

---

### Achado 9

**Título:** Lichess Practice - Key Squares  
**Tipo:** official-practice  
**URL:** https://lichess.org/practice/pawn-endgames/key-squares/xebrDvFe  
**Autor/Fonte:** Lichess  
**Valor:** A  
**Tema principal:** Casas-chave em finais de peão.  
**Fraquezas que treina:** 
- endgame-pawn
- conversion
- calculation

**Nível sugerido:** iniciante  
**Duração estimada:** média  
**Por que é útil:**  
Finais de peão são extremamente concretos. O módulo ensina o conceito geométrico das "casas-chave" onde o rei atacante deve pisar para garantir a promoção do peão, independente de quem joga. É a base matemática de finais para faixa 0-1200.  
**Quando o Professor Lemos deveria recomendar:**  
Sempre que a fraqueza de final de peões for detectada e o aluno falhar em coroar peões passados em finais de rei e peão.  
**Como implementar no app:**  
Recurso inicial prioritário de final de peões.  
**Dados necessários:** URL, studyId (`xebrDvFe`), tags.  
**Riscos:** Exige precisão cirúrgica de cálculo. O app deve desencorajar lances impulsivos neste módulo.  
**Confiança:** alta  

---

### Achado 10

**Título:** Lichess Practice - Opposition  
**Tipo:** official-practice  
**URL:** https://lichess.org/practice/pawn-endgames/opposition/xL50F6f2  
**Autor/Fonte:** Lichess  
**Valor:** A  
**Tema principal:** Técnica de oposição do rei.  
**Fraquezas que treina:** 
- endgame-pawn
- conversion
- calculation

**Nível sugerido:** iniciante  
**Duração estimada:** média  
**Por que é útil:**  
Ensina a técnica de colocar o rei a uma casa de distância do rei adversário, assumindo o controle espacial de cruzamento de colunas. Esse conceito é o parceiro direto do estudo de Casas-Chave e define se um final K+P é vitória ou empate por afogamento.  
**Quando o Professor Lemos deveria recomendar:**  
Imediatamente após a conclusão ou revisão do módulo de Key Squares, ou quando o jogador perder a oposição em finais de partida.  
**Como implementar no app:**  
Módulo estático pareado com Key Squares no catálogo.  
**Dados necessários:** URL, studyId (`xL50F6f2`), tags.  
**Riscos:** Nível de abstração levemente superior para o iniciante absoluto, mas o Lichess detalha bem os passos.  
**Confiança:** alta  

---

### Achado 11

**Título:** Lichess Practice - Basic Rook Endgames  
**Tipo:** official-practice  
**URL:** https://lichess.org/practice/rook-endgames/basic-rook-endgames/pqUSUw8Y  
**Autor/Fonte:** Lichess  
**Valor:** A  
**Tema principal:** Finais de torres fundamentais (Lucena e Philidor).  
**Fraquezas que treina:** 
- endgame-rook
- conversion
- calculation

**Nível sugerido:** intermediário  
**Duração estimada:** média  
**Por que é útil:**  
Apresenta as duas posições de torre mais famosas e frequentes na prática do xadrez: Lucena (como vencer com peão a mais cortando o rei e construindo a "ponte") e Philidor (como empatar com peão a menos usando a terceira fila). É a base que separa o amador do jogador técnico.  
**Quando o Professor Lemos deveria recomendar:**  
Rating 1000-1200+, após erros cometidos em finais de torre ou quando o diagnóstico de finais apontar falha grave em finais de peças pesadas.  
**Como implementar no app:**  
Modulo avançado de final no catálogo estático. Só liberar após consolidação dos finais de peão básicos.  
**Dados necessários:** URL, studyId (`pqUSUw8Y`), tags.  
**Riscos:** Complexidade técnica mais alta. Exige introdução textual encorajadora.  
**Confiança:** alta  

---

### Achado 12

**Título:** Lichess Practice - Intermediate Rook Endgames  
**Tipo:** official-practice  
**URL:** https://lichess.org/practice/rook-endgames/intermediate-rook-endgames/6n681yU1  
**Autor/Fonte:** Lichess  
**Valor:** A  
**Tema principal:** Posição de Vancura e corte de rei de longo alcance.  
**Fraquezas que treina:** 
- endgame-rook
- conversion
- calculation

**Nível sugerido:** avançado  
**Duração estimada:** média  
**Por que é útil:**  
Cobre situações de defesa mais difíceis, como a Posição de Vancura (defesa contra peão de torre na 6ª ou 7ª fila) e corte do rei ativo. Extremamente útil para jogadores que estão no topo da faixa de 1200 e já dominaram Lucena/Philidor.  
**Quando o Professor Lemos deveria recomendar:**  
Aluno com rating Lichess/Chess.com próximo a 1200, que já resolveu e dominou a prática básica de torres.  
**Como implementar no app:**  
Entrada de topo de funil para finais de torre no catálogo ativo.  
**Dados necessários:** URL, studyId (`6n681yU1`), tags, nível avançado.  
**Riscos:** Muito difícil para iniciantes (<1000). Pode causar desmotivação se recomendado cedo.  
**Confiança:** alta  

---

### Achado 13

**Título:** Puzzle Theme - Hanging Piece  
**Tipo:** puzzle-theme  
**URL:** https://lichess.org/training/hangingPiece  
**Autor/Fonte:** Lichess  
**Valor:** A  
**Tema principal:** Capturas simples de peças sem defesa (Peças Penduradas).  
**Fraquezas que treina:** 
- hanging-piece
- blunder-rate
- defensive-awareness

**Nível sugerido:** iniciante  
**Duração estimada:** curta  
**Por que é útil:**  
Permite o treino contínuo e repetitivo de visualização rápida de peças soltas no tabuleiro. Ao direcionar o usuário para o pool de puzzles com essa tag, ele treina o cérebro para escanear a segurança do material antes de fazer qualquer lance.  
**Quando o Professor Lemos deveria recomendar:**  
Altas taxas de blunders materiais brutos em partidas rápidas (blunder-rate alto), ou derrotas por deixar peças limpas de graça.  
**Como implementar no app:**  
Usar a URL direta de tema para baterias de 5 ou 10 minutos (treino de repetição).  
**Dados necessários:** URL, slug (`hangingPiece`), tags de fraquezas.  
**Riscos:** Sem OAuth, o app não monitora acertos. O botão "Concluir" deve forçar uma pergunta simples sobre o resultado.  
**Confiança:** alta  

---

### Achado 14

**Título:** Puzzle Themes - Tactics Index  
**Tipo:** puzzle-theme  
**URL:** https://lichess.org/training/themes  
**Autor/Fonte:** Lichess  
**Valor:** A  
**Tema principal:** Lista oficial de tags táticas do Lichess.  
**Fraquezas que treina:** 
- fork
- pin
- skewer
- discovered
- calculation
- visualization

**Nível sugerido:** misto  
**Duração estimada:** curta  
**Por que é útil:**  
Permite mapear de forma limpa e direta as fraquezas do Professor Lemos aos pools de puzzle correspondentes no Lichess (e.g. `/training/fork`, `/training/pin`, `/training/skewer`, `/training/discoveredAttack`).  
**Quando o Professor Lemos deveria recomendar:**  
Após o aluno passar pelas respectivas aulas teóricas no Practice e precisar de consolidação ativa (estágio `retrieval` ou `retention`).  
**Como implementar no app:**  
Mapeamento direto de tags de fraqueza para os slugs correspondentes no catálogo de links.  
**Dados necessários:** URLs mapeadas, slugs oficiais.  
**Riscos:** A lista de temas é estática na nossa base, mas o XML oficial de tradução do Lichess é o padrão-ouro de validação se algum slug mudar de nome.  
**Confiança:** alta  

---

### Achado 15

**Título:** Puzzle Themes - Mate in 1 / Mate in 2  
**Tipo:** puzzle-theme  
**URL:** https://lichess.org/training/mateIn2  
**Autor/Fonte:** Lichess  
**Valor:** A  
**Tema principal:** Xeque-mates forçados por lance.  
**Fraquezas que treina:** 
- mate-in-1
- mate-in-2
- calculation
- visualization

**Nível sugerido:** iniciante  
**Duração estimada:** curta  
**Por que é útil:**  
Pools dedicados de puzzles focados unicamente em aplicar mate. Útil para calibração rápida de cálculo curto. Treina o cérebro a enxergar padrões de rede de mate geométrico sem desvios táticos secundários.  
**Quando o Professor Lemos deveria recomendar:**  
Mates perdidos em partidas identificadas, ou no onboarding para calibrar a precisão primária.  
**Como implementar no app:**  
Mapeamento direto: `/training/mateIn1` (para aquecimento ou iniciantes) e `/training/mateIn2` (para cálculo intermediário).  
**Dados necessários:** URLs, slugs (`mateIn1`, `mateIn2`).  
**Riscos:** Treinar temas de mate em sequência pode dar pista demais (o aluno sabe que a resposta é sempre mate). Recomenda-se misturar com o tema `mix` após consolidação rápida.  
**Confiança:** alta  

---

### Achado 16

**Título:** Puzzle Themes - Pawn Endgame / Rook Endgame  
**Tipo:** puzzle-theme  
**URL:** https://lichess.org/training/pawnEndgame  
**Autor/Fonte:** Lichess  
**Valor:** A  
**Tema principal:** Repetição de problemas reais de final.  
**Fraquezas que treina:** 
- endgame-pawn
- endgame-rook
- conversion
- calculation

**Nível sugerido:** misto  
**Duração estimada:** curta  
**Por que é útil:**  
Treino prático focado em posições reais de finais simplificados extraídas de jogos. Obriga o aluno a calcular com precisão caminhos de promoção de peões ou atividade de rei e torres sob severa escassez de material.  
**Quando o Professor Lemos deveria recomendar:**  
Após o aluno concluir com sucesso os módulos conceituais do Practice e precisar acumular milhas de padrão tático em finais.  
**Como implementar no app:**  
URLs mapeadas no catálogo ativo.  
**Dados necessários:** URLs, slugs (`pawnEndgame`, `rookEndgame`).  
**Riscos:** Finais de torre em puzzles podem possuir avaliações muito sutis. A curva de rating dos puzzles deve se adaptar ao rating do jogador.  
**Confiança:** alta  

---

### Achado 17

**Título:** Puzzle Streak  
**Tipo:** tool  
**URL:** https://lichess.org/streak  
**Autor/Fonte:** Lichess  
**Valor:** A  
**Tema principal:** Consistência e precisão progressiva sem tempo.  
**Fraquezas que treina:** 
- blunder-rate
- calculation
- visualization
- defensive-awareness

**Nível sugerido:** misto  
**Duração estimada:** curta  
**Por que é útil:**  
O jogador resolve puzzles que começam muito fáceis (rating ~600) e vão subindo a dificuldade progressivamente. Se errar uma vez, a sequência acaba. Excelente ferramenta pedagógica para focar na precisão ("blunder-rate" e "defensive-awareness") e criar o hábito de calcular até a vitória antes de fazer o lance, já que não há timer punitivo.  
**Quando o Professor Lemos deveria recomendar:**  
Como rotina diária de aquecimento, ou para jogadores com blunder-rate alto que costumam "chutar" lances rápidos em puzzles normais.  
**Como implementar no app:**  
Destino de alta prioridade na tela Hoje como "Desafio de Consistência".  
**Dados necessários:** URL, tipo, tags.  
**Riscos:** Sem OAuth, depende do input manual do aluno ("Qual foi sua maior sequência hoje?").  
**Confiança:** alta  

---

### Achado 18

**Título:** Puzzle Storm  
**Tipo:** tool  
**URL:** https://lichess.org/storm  
**Autor/Fonte:** Lichess  
**Valor:** B  
**Tema principal:** Reconhecimento rápido de padrões táticos sob limite de tempo.  
**Fraquezas que treina:** 
- time-trouble
- visualization
- calculation

**Nível sugerido:** intermediário  
**Duração estimada:** curta  
**Por que é útil:**  
O jogador tem 3 minutos para resolver o maior número de puzzles fáceis possível. Cada acerto dá tempo extra. Treina o reconhecimento intuitivo rápido e reflexo visual sob forte pressão de relógio.  
**Quando o Professor Lemos deveria recomendar:**  
Casos diagnosticados de apuros de tempo constantes em partidas rápidas (`time-trouble`), desde que o blunder-rate em partidas não esteja crítico (velocidade sem precisão é prejudicial).  
**Como implementar no app:**  
Recomendar apenas sob premissas: rating > 900 e acerto nos treinos básicos consistente.  
**Dados necessários:** URL, tipo, fraqueza (`time-trouble`).  
**Riscos:** Pode incentivar o péssimo hábito de "chutar" lances sem calcular por ansiedade.  
**Confiança:** alta  

---

### Achado 19

**Título:** Puzzle Dashboard e Improvement Areas  
**Tipo:** tool  
**URL:** https://lichess.org/training/dashboard/30/dashboard  
**Autor/Fonte:** Lichess  
**Valor:** A  
**Tema principal:** Painel agregador de erros e desempenho tático pessoal.  
**Fraquezas que treina:** 
- other

**Nível sugerido:** misto  
**Duração estimada:** variável  
**Por que é útil:**  
Apresenta de forma clara em quais temas táticos (e.g. garfos, mates, finais) o jogador tem a menor taxa de acerto nos últimos 30 dias. É a principal fonte de insights externos caso o app queira puxar dados de diagnóstico sem ter de analisar PGNs brutos.  
**Quando o Professor Lemos deveria recomendar:**  
Fase de diagnóstico (semana de onboarding) ou no botão de sync semanal para recalibrar o foco de fraquezas.  
**Como implementar no app:**  
Destino de análise. Com OAuth opt-in (`puzzle:read`), o app consome o endpoint `/api/puzzle/dashboard/30` para automatizar a importação das taxas de erro por tema.  
**Dados necessários:** URL de visualização, endpoint da API se logado.  
**Riscos:** Depende de o usuário ter resolvido puzzles suficientes no Lichess nas últimas semanas para gerar dados válidos.  
**Confiança:** alta  

---

### Achado 20

**Título:** Puzzles From Player Games  
**Tipo:** tool  
**URL:** https://lichess.org/training/of-player  
**Autor/Fonte:** Lichess  
**Valor:** B  
**Tema principal:** Puzzles customizados gerados a partir de erros cometidos pelo próprio jogador em suas partidas Lichess.  
**Fraquezas que treina:** 
- blunder-rate
- conversion
- defensive-awareness

**Nível sugerido:** misto  
**Duração estimada:** variável  
**Por que é útil:**  
Dá um valor pedagógico altíssimo e pessoal ao treino, mostrando que "erros reais" custam partidas reais. Aumenta a transferência do treino tático para a prática do jogador, reduzindo a sensação de puzzles abstratos.  
**Quando o Professor Lemos deveria recomendar:**  
Bloco de treino personalizado pós-partidas, idealmente após o encerramento de uma sessão semanal de jogos no Lichess.  
**Como implementar no app:**  
Disponibilizar atalho dinâmico injetando o username do usuário cadastrado na URL: `https://lichess.org/training/of-player?user={username}`.  
**Dados necessários:** URL, username do usuário.  
**Riscos:** Não funciona se o jogador joga primariamente no Chess.com (que é o caso atual do dono). Fica como recurso secundário de Lichess.  
**Confiança:** alta  

---

### Achado 21

**Título:** Lichess Analysis Board  
**Tipo:** tool  
**URL:** https://lichess.org/analysis  
**Autor/Fonte:** Lichess  
**Valor:** A  
**Tema principal:** Quadro interativo de análise pós-jogo com engine local.  
**Fraquezas que treina:** 
- conversion
- blunder-rate
- calculation
- defensive-awareness
- other

**Nível sugerido:** misto  
**Duração estimada:** média  
**Por que é útil:**  
É a ferramenta de eleição do Lichess para analisar partidas já encerradas, montar posições ou revisar linhas candidatas. Para o app, serve como o principal destino onde o jogador fará a autoanálise ativa de suas derrotas do dia.  
**Quando o Professor Lemos deveria recomendar:**  
Sempre após o registro ou finalização de partidas, no bloco diário "Revisão de Erros".  
**Como implementar no app:**  
Botão "Revisar Partida no Lichess". O app instrui o usuário a abrir a partida lá para encontrar as causas dos erros. Nunca recomendar durante jogo ao vivo.  
**Dados necessários:** URL base.  
**Riscos:** Risco zero de copyright. O risco é puramente de Fair Play se o usuário mantiver a aba aberta com motor de análise rodando enquanto joga em outra janela (o app deve alertar textualmente contra isso).  
**Confiança:** alta  

---

### Achado 22

**Título:** Lichess Video - Must-Know Opening Principles: Central Control  
**Tipo:** video  
**URL:** https://lichess.org/video/gpsZAim-mYc  
**Autor/Fonte:** IM Alex Astaneh / Biblioteca Lichess (originalmente Chessfactor)  
**Valor:** A  
**Tema principal:** Princípios fundamentais de abertura (desenvolvimento e controle do centro).  
**Fraquezas que treina:** 
- opening-principles
- blunder-rate

**Nível sugerido:** iniciante  
**Duração estimada:** curta (11 minutos)  
**Por que é útil:**  
O vídeo foca especificamente em ensinar o porquê de controlar as casas centrais com peões e peças leves na abertura, em vez de decorar variantes longas de aberturas específicas. Corrige a fraqueza teórica conceitual do jogador iniciante.  
**Quando o Professor Lemos deveria recomendar:**  
Diagnóstico de partidas indicar alta perda de vantagem nos primeiros 10 lances, rei exposto por roque tardio ou blunders de desenvolvimento prematuro.  
**Como implementar no app:**  
Recurso audiovisual principal para a fraqueza de abertura no catálogo de recursos.  
**Dados necessários:** URL do vídeo, autor, título, tags.  
**Riscos:** Idioma em inglês. O app deve prover um breve guia mental ("Controle o centro, desenvolva cavalos e bispos, proteja o rei com roque") em português para guiar o consumo do vídeo.  
**Confiança:** alta  

---

### Achado 23

**Título:** Lichess Video - How to Identify Hanging Pieces  
**Tipo:** video  
**URL:** https://lichess.org/video/wod7uXzkrTc  
**Autor/Fonte:** IM Alex Astaneh / Biblioteca Lichess  
**Valor:** A  
**Tema principal:** Identificação de peças sem defesa no tabuleiro.  
**Fraquezas que treina:** 
- hanging-piece
- blunder-rate
- defensive-awareness

**Nível sugerido:** iniciante  
**Duração estimada:** curta (12 minutos)  
**Por que é útil:**  
Uma das melhores explicações estruturadas sobre o que constitui uma peça pendurada (undefended) versus uma peça simplesmente atacada. Ensina o processo mental de checar a segurança material a cada lance, complementando os puzzles.  
**Quando o Professor Lemos deveria recomendar:**  
Sempre que a fraqueza material for proeminente e o aluno demonstrar insucesso inicial em puzzles de `hangingPiece`.  
**Como implementar no app:**  
Recomendação primária de vídeo para a fraqueza de peças penduradas.  
**Dados necessários:** URL, autor, tags de fraqueza.  
**Riscos:** Idioma inglês.  
**Confiança:** alta  

---

### Achado 24

**Título:** Lichess Video - Incredible Fork Tactics for Beginners  
**Tipo:** video  
**URL:** https://lichess.org/video/mbiR0tcdqBY  
**Autor/Fonte:** IM Alex Astaneh / Biblioteca Lichess  
**Valor:** B  
**Tema principal:** Exercitação visual de garfos para iniciantes.  
**Fraquezas que treina:** 
- fork
- calculation
- visualization

**Nível sugerido:** iniciante  
**Duração estimada:** curta (10 minutos)  
**Por que é útil:**  
Excelente demonstração em tabuleiro dinâmico sobre como armar garfos usando cavalos, bispos e peões. Funciona muito bem como aquecimento audiovisual antes de o aluno iniciar um bloco de puzzles do mesmo tema.  
**Quando o Professor Lemos deveria recomendar:**  
Gargalo de aprendizado na licao guiada de garfos ou baixa pontuação no onboarding.  
**Como implementar no app:**  
Recurso secundário no catálogo, sugerido no início do bloco de garfos caso o foco semanal inclua tática.  
**Dados necessários:** URL, autor, tags.  
**Riscos:** Link externo contendo doações no rodapé da página pública Lichess, mas sem riscos diretos de direitos para o app.  
**Confiança:** alta  

---

### Achado 25

**Título:** Lichess Video - The 4 Most Important Pins in Chess  
**Tipo:** video  
**URL:** https://lichess.org/video/VjwSudAqLn8  
**Autor/Fonte:** IM Alex Astaneh / Biblioteca Lichess  
**Valor:** B  
**Tema principal:** Cravadas cruciais e seus mecanismos.  
**Fraquezas que treina:** 
- pin
- defensive-awareness
- conversion

**Nível sugerido:** iniciante  
**Duração estimada:** curta (9 minutos)  
**Por que é útil:**  
Explica com 4 exemplos claros as cravadas mais recorrentes em partidas reais e como explorá-las. Ajuda o aluno a reter o padrão geométrico de cravada em seu repertório tático imediato.  
**Quando o Professor Lemos deveria recomendar:**  
Complemento de revisão para a fraqueza de cravada em dias em que o aluno solicita treino curto/leve.  
**Como implementar no app:**  
Recurso B (vídeo de suporte) para a fraqueza de cravadas.  
**Dados necessários:** URL, autor, tags.  
**Riscos:** Idioma inglês.  
**Confiança:** alta  

---

### Achado 26

**Título:** Lichess Video - The Absolute and Relative Skewer  
**Tipo:** video  
**URL:** https://lichess.org/video/ZexQ1kow1MM  
**Autor/Fonte:** IM Alex Astaneh / Biblioteca Lichess  
**Valor:** B  
**Tema principal:** Espeto absoluto vs. espeto relativo.  
**Fraquezas que treina:** 
- skewer
- pin
- calculation

**Nível sugerido:** iniciante  
**Duração estimada:** curta (10 minutos)  
**Por que é útil:**  
Ensina a definição teórica do espeto e sua aplicação tática prática. Ideal para esclarecer a confusão conceitual comum que iniciantes fazem com a cravada.  
**Quando o Professor Lemos deveria recomendar:**  
Dificuldade na licao de espetos ou baixa pontuação persistente no tema correspondente.  
**Como implementar no app:**  
Vídeo de apoio no bloco conceitual.  
**Dados necessários:** URL, autor, tags.  
**Riscos:** Idioma inglês.  
**Confiança:** alta  

---

### Achado 27

**Título:** Lichess Video - Creating Multiple Threats With the Discovered Attack  
**Tipo:** video  
**URL:** https://lichess.org/video/nMADfn1scbI  
**Autor/Fonte:** IM Alex Astaneh / Biblioteca Lichess  
**Valor:** B  
**Tema principal:** Ataque descoberto e xeques duplos.  
**Fraquezas que treina:** 
- discovered
- calculation
- visualization

**Nível sugerido:** intermediário  
**Duração estimada:** curta (11 minutos)  
**Por que é útil:**  
Mostra como coordenar duas peças em um único lance para criar ameaças simultâneas devastadoras. Ajuda o jogador a superar a visão unidimensional do tabuleiro e dar o salto para o cálculo de variantes de dois lances.  
**Quando o Professor Lemos deveria recomendar:**  
Gargalos no tema de descobertos ou ao iniciar o treino tático de nível intermediário.  
**Como implementar no app:**  
Vídeo de suporte tático para descobertos.  
**Dados necessários:** URL, autor, tags.  
**Riscos:** Idioma inglês.  
**Confiança:** alta  

---

### Achado 28

**Título:** Lichess Video - The Most Important Mating Patterns in Chess  
**Tipo:** video  
**URL:** https://lichess.org/video/uhQhasudq9M  
**Autor/Fonte:** IM Kostya Kavutskiy / Biblioteca Lichess  
**Valor:** A  
**Tema principal:** Reconhecimento de redes e geometria de mate.  
**Fraquezas que treina:** 
- mate-in-2
- back-rank
- visualization
- calculation

**Nível sugerido:** iniciante  
**Duração estimada:** média (15 minutos)  
**Por que é útil:**  
Apresenta de forma concisa e didática os principais mates de padrão clássico (Anastasia, Boden, Corredor, Sufocado, etc.). O valor pedagógico é guiar a visualização do rei oponente desabrigado e as peças bloqueadoras ao seu redor.  
**Quando o Professor Lemos deveria recomendar:**  
Sinalização de fraqueza em mate-in-2 ou back-rank, ou antes de uma sessão focada em padrões de mate.  
**Como implementar no app:**  
Recurso de vídeo primário para a fraqueza de mates e visualização.  
**Dados necessários:** URL, autor, tags.  
**Riscos:** Idioma inglês. Vídeo de 15 minutos exige maior foco do aluno.  
**Confiança:** alta  

---

### Achado 29

**Título:** Lichess Video - Introduction to Pawn Endgames  
**Tipo:** video  
**URL:** https://lichess.org/video/QUqq7wSLE78  
**Autor/Fonte:** GM Daniel Naroditsky / Biblioteca Lichess  
**Valor:** B  
**Tema principal:** Conceitos de finais de peões (regra do quadrado, oposição, casas-chave).  
**Fraquezas que treina:** 
- endgame-pawn
- conversion
- calculation

**Nível sugerido:** intermediário  
**Duração estimada:** média (16 minutos)  
**Por que é útil:**  
O GM Daniel Naroditsky é amplamente considerado um dos melhores professores de xadrez online. Sua introdução a finais de peão fornece uma base verbal e intuitiva excelente para complementar as regras geométricas abstratas ensinadas no Practice.  
**Quando o Professor Lemos deveria recomendar:**  
Sessões de finais de peões, ou quando o jogador falhar em assimilar puramente a mecânica dos exercícios interativos.  
**Como implementar no app:**  
Vídeo conceitual de suporte de finais de peão.  
**Dados necessários:** URL, autor, tags.  
**Riscos:** Idioma inglês. Explicações densas (GM level de didática, adaptado para amadores).  
**Confiança:** alta  

---

### Achado 30

**Título:** Lichess Video - How to Calculate the Best Moves in Chess  
**Tipo:** video  
**URL:** https://lichess.org/video/-OoPm17P8xA  
**Autor/Fonte:** IM Alex Astaneh / Biblioteca Lichess  
**Valor:** B  
**Tema principal:** O método da varredura (Scanning Method) de cálculo.  
**Fraquezas que treina:** 
- calculation
- visualization
- blunder-rate

**Nível sugerido:** intermediário  
**Duração estimada:** média (14 minutos)  
**Por que é útil:**  
Fornece um método prático e estruturado de tomada de decisão: varrer as peças para identificar candidatos, calcular lances forçados (cheques, capturas, ameaças) e fazer uma árvore mínima. Útil para disciplinar o pensamento racional em posições complexas.  
**Quando o Professor Lemos deveria recomendar:**  
Fraqueza acentuada de cálculo, erros em puzzles longos (>1500 rating) ou excesso de impulsividade na tomada de decisão.  
**Como implementar no app:**  
Vídeo especial de transição para nível intermediário no catálogo ativo.  
**Dados necessários:** URL, autor, tags.  
**Riscos:** Pode ser abstrato para iniciantes puros. Não recomendar abaixo de 800 de rating.  
**Confiança:** alta  

---

### Achado 31

**Título:** Lichess Video - Useful Tips to Avoid Blunders  
**Tipo:** video  
**URL:** https://lichess.org/video/AYy2A6HIcU0  
**Autor/Fonte:** IM Kostya Kavutskiy / Biblioteca Lichess  
**Valor:** B  
**Tema principal:** Dicas práticas e rituais mentais para evitar pendurar peças.  
**Fraquezas que treina:** 
- blunder-rate
- hanging-piece
- defensive-awareness

**Nível sugerido:** iniciante  
**Duração estimada:** média (12 minutos)  
**Por que é útil:**  
Cria rituais mentais pós-lance (e.g. olhar o tabuleiro com os olhos do oponente antes de mover, verificar ameaças na última fileira). Muito eficaz para jogadores casuais que sofrem de "cegueira tática transiente".  
**Quando o Professor Lemos deveria recomendar:**  
Blunder-rate alto persistente mesmo após licoes de peças penduradas, ou quando o jogador relata frustração com erros bobos de atenção.  
**Como implementar no app:**  
Vídeo de apoio no card de rotina diária como "Dica Mental".  
**Dados necessários:** URL, autor, tags.  
**Riscos:** Idioma inglês.  
**Confiança:** alta  

---

### Achado 32

**Título:** Lichess Video - Win More Games! Convert Material Advantage  
**Tipo:** video  
**URL:** https://lichess.org/video/0-ouahZH8X4  
**Autor/Fonte:** IM Kostya Kavutskiy / Biblioteca Lichess  
**Valor:** A  
**Tema principal:** Técnicas de conversão de vantagem material ganha.  
**Fraquezas que treina:** 
- conversion
- blunder-rate
- calculation

**Nível sugerido:** misto  
**Duração estimada:** média (15 minutos)  
**Por que é útil:**  
Aborda uma das dores mais frequentes de jogadores amadores: "ganho uma peça na abertura, mas acabo empatando ou perdendo a partida". Ensina os princípios de simplificação (trocar peças, manter peões), controle de contrajogo e transições seguras para finais.  
**Quando o Professor Lemos deveria recomendar:**  
Sinal evidente de fraqueza em `conversion`, perdas frequentes de partidas onde o jogador teve vantagem material de +3 ou mais avaliada no histórico.  
**Como implementar no app:**  
Recurso prioritário para a fraqueza de conversão de vantagem.  
**Dados necessários:** URL, autor, tags.  
**Riscos:** Idioma inglês.  
**Confiança:** alta  

---

### Achado 33

**Título:** Jomega Studies Index & Table of Contents  
**Tipo:** community-study  
**URL:** https://lichess.org/study/vK3z4Pvu  
**Autor/Fonte:** jomega (Lichess Community)  
**Valor:** B  
**Tema principal:** Índice geral de estudos pedagógicos comunitários de alta relevância.  
**Fraquezas que treina:** 
- fork
- pin
- skewer
- discovered
- hanging-piece
- other

**Nível sugerido:** misto  
**Duração estimada:** longa  
**Por que é útil:**  
`jomega` é um autor comunitário consagrado no Lichess, conhecido por criar trilhas teóricas excepcionalmente estruturadas para táticas de iniciantes e intermediários. Em vez de cadastrar links soltos que podem quebrar, usar o Table of Contents dele dá ao aluno acesso a um currículo completo de estudo auto-guiado complementar.  
**Quando o Professor Lemos deveria recomendar:**  
Quando o aluno deseja ir além das lições rápidas oficiais do Lichess e deseja fazer sessões longas de leitura conceitual de xadrez na comunidade.  
**Como implementar no app:**  
Entrada sob a categoria "Estudos Comunitários de Apoio" com status `needs-human-review` (conforme regras de governança, o dono deve revisar e aprovar para uso ativo).  
**Dados necessários:** URL do index, autor, título, valor.  
**Riscos:** Conteúdo em inglês. Risco de o autor fechar ou alterar a visibilidade do estudo (embora esteja ativo há anos).  
**Confiança:** média  

---

### Achado 34

**Título:** Beginner Endgames You Must Know!  
**Tipo:** community-study  
**URL:** https://lichess.org/study/wukLYIXj  
**Autor/Fonte:** NoseKnowsAll (Lichess Community)  
**Valor:** A  
**Tema principal:** Finais básicos e checkmates elementares na prática.  
**Fraquezas que treina:** 
- mate-in-1
- mate-in-2
- endgame-pawn
- conversion

**Nível sugerido:** iniciante  
**Duração estimada:** longa  
**Por que é útil:**  
O autor `NoseKnowsAll` estruturou uma série fantástica, progressiva e altamente pedagógica de finais. O volume de iniciante cobre mates elementares (escada com duas torres, mate de rei e dama, rei e torre) e o básico absoluto de finais de peões (regra do quadrado). Muito limpo e sem problemas de direitos.  
**Quando o Professor Lemos deveria recomendar:**  
Como material teórico extra de finais para faixa 0-800, integrando a recomendação de conversão.  
**Como implementar no app:**  
Estudo comunitário recomendado com prioridade alta para iniciantes, necessitando apenas de ativação pelo dono no catálogo.  
**Dados necessários:** URL, autor, tags de final.  
**Riscos:** Idioma inglês. Pode ter excesso de texto em alguns capítulos.  
**Confiança:** alta  

---

### Achado 35

**Título:** Intermediate Endgames You Must Know!  
**Tipo:** community-study  
**URL:** https://lichess.org/study/UsqmCsgC  
**Autor/Fonte:** NoseKnowsAll (Lichess Community)  
**Valor:** A  
**Tema principal:** Finais intermediários cruciais (oposição, peão de torre, Lucena/Philidor).  
**Fraquezas que treina:** 
- endgame-pawn
- endgame-rook
- conversion
- calculation

**Nível sugerido:** intermediário  
**Duração estimada:** longa  
**Por que é útil:**  
Dá sequência à série ensinando oposição avançada, finais com peão de torre (empates teóricos comuns), e posições fundamentais de torre. É pedagogicamente muito estruturado, com exercícios interativos no tabuleiro do estudo.  
**Quando o Professor Lemos deveria recomendar:**  
Rating 900-1100, após consolidação dos finais básicos do Practice.  
**Como implementar no app:**  
Estudo comunitário recomendado nível B (apoio ativo).  
**Dados necessários:** URL, autor, tags.  
**Riscos:** Idioma inglês.  
**Confiança:** alta  

---

### Achado 36

**Título:** Rook Endgames You Must Know!  
**Tipo:** community-study  
**URL:** https://lichess.org/study/bnboDhFM  
**Autor/Fonte:** NoseKnowsAll (Lichess Community)  
**Valor:** B  
**Tema principal:** Finais de torres avançados e práticos.  
**Fraquezas que treina:** 
- endgame-rook
- conversion
- calculation

**Nível sugerido:** intermediário  
**Duração estimada:** longa  
**Por que é útil:**  
Dedicado exclusivamente a finais de torres, aprofundando o Philidor, Lucena, Vancura e atividade da torre. Excelente material de referência para o aluno que atingiu o platô de finais de torre e quer dominar todas as sub-variantes práticas.  
**Quando o Professor Lemos deveria recomendar:**  
Rating 1100-1200+, quando a fraqueza de finais de torre insistir em aparecer e as lições do Practice já estiverem completas.  
**Como implementar no app:**  
Estudo de referência de alta classe no catálogo.  
**Dados necessários:** URL, autor, tags.  
**Riscos:** Complexo. Exige paciência do estudante.  
**Confiança:** alta  

---

### Achado 37

**Título:** Beginner: Simple Tactics I  
**Tipo:** community-study  
**URL:** https://lichess.org/study/s3iOCawc  
**Autor/Fonte:** jomega (Lichess Community)  
**Valor:** B  
**Tema principal:** Exercícios simples de capturas materiais e segurança de rei.  
**Fraquezas que treina:** 
- hanging-piece
- blunder-rate
- defensive-awareness

**Nível sugerido:** iniciante  
**Duração estimada:** longa  
**Por que é útil:**  
Focado em reforçar a visão de "tomar de graça" (take for nothing) e evitar deixar peças expostas. Ideal para alfabetização tática do jogador iniciante absoluto.  
**Quando o Professor Lemos deveria recomendar:**  
No início da trilha de redução de blunders materiais brutos.  
**Como implementar no app:**  
Recurso de apoio comunitário B para blunder-rate e peças penduradas.  
**Dados necessários:** URL, autor, tags.  
**Riscos:** Idioma inglês. Risco de link comunitário ser desativado.  
**Confiança:** média  

---

### Achado 38

**Título:** Intermediate: Tactics Internalized  
**Tipo:** community-study  
**URL:** https://lichess.org/study/q9bJ8YdY  
**Autor/Fonte:** jomega (Lichess Community)  
**Valor:** B  
**Tema principal:** Exercícios de fixação de garfo, cravada e descobertos.  
**Fraquezas que treina:** 
- fork
- pin
- discovered
- calculation

**Nível sugerido:** intermediário  
**Duração estimada:** longa  
**Por que é útil:**  
Ajuda a internalizar padrões táticos típicos em posições onde o tema não é óbvio no primeiro lance. Excelente para o aluno na faixa de 900-1100 treinar a visão de lances candidatos.  
**Quando o Professor Lemos deveria recomendar:**  
Após as lições básicas de tática estarem concluídas e o aluno precisar de exercícios complexos de fixação.  
**Como implementar no app:**  
Recurso B no catálogo.  
**Dados necessários:** URL, autor, tags.  
**Riscos:** Idioma inglês. URL atualizada auditada pela Antigravity (diferente da URL original do Codex).  
**Confiança:** alta  

---

### Achado 39

**Título:** Mate in 2 CAN YOU SEE IT?  
**Tipo:** community-study  
**URL:** https://lichess.org/study/APSzIEsV  
**Autor/Fonte:** Amazing_tactics (Lichess Community)  
**Valor:** C  
**Tema principal:** Coleção de problemas de mate em 2.  
**Fraquezas que treina:** 
- mate-in-2
- calculation
- visualization

**Nível sugerido:** misto  
**Duração estimada:** média  
**Por que é útil:**  
Contém exercícios práticos de mate em 2 divididos por níveis. Pode servir como fonte secundária caso o aluno precise de variação de problemas de mate além do Practice.  
**Quando o Professor Lemos deveria recomendar:**  
Apenas sob demanda de revisão humana, caso o aluno peça mais exercícios manuais de mate.  
**Como implementar no app:**  
Manter na lista de candidatos com status `needs-human-review`.  
**Dados necessários:** URL, autor, tags.  
**Riscos:** Alta poluição promocional na descrição do estudo no Lichess (links sociais, pedidos de like). Qualidade pedagógica inconsistente em alguns capítulos.  
**Por que classificado como C:**  
A poluição promocional e o foco excessivo em engajamento social diminuem seu valor de produto premium. Deve ser evitado se os recursos oficiais do Lichess bastarem.  
**Confiança:** média  

---

### Achado 40

**Título:** Practical Endings: Pawns (PART 1)  
**Tipo:** community-study  
**URL:** https://lichess.org/study/dXKWlrkg  
**Autor/Fonte:** Blue_Knight5 (Lichess Community)  
**Valor:** D  
**Tema principal:** Finais de peões práticos.  
**Fraquezas que treina:** 
- endgame-pawn
- conversion

**Nível sugerido:** avançado  
**Duração estimada:** longa  
**Por que é útil:**  
O estudo seria útil pela profundidade, mas a descrição do próprio autor afirma que o estudo é uma adaptação direta e cópia de análises do livro clássico de Paul Keres ("Practical Chess Endings"). Isso cria um grave risco legal de copyright para um aplicativo clean-room.  
**Quando o Professor Lemos deveria recomendar:**  
**NÃO RECOMENDAR.**  
**Como implementar no app:**  
Adicionar à tabela de rejeitados/excluídos para garantir auditoria do catálogo.  
**Dados necessários:** URL, motivo de descarte ("Risco de copyright: transcrição de livro").  
**Riscos:** Violação de regras inquebráveis de direitos autorais e clean-room.  
**Confiança:** alta (decisão de descarte imperativa)  

---

### Achado 41

**Título:** Pawn Endgames!  
**Tipo:** community-study  
**URL:** https://lichess.org/study/izZ71JC2  
**Autor/Fonte:** Player9128 (Lichess Community)  
**Valor:** D  
**Tema principal:** Finais de peões.  
**Fraquezas que treina:** 
- endgame-pawn

**Nível sugerido:** iniciante  
**Duração estimada:** média  
**Por que é útil:**  
Estudo de finais de peões genérico com qualidade pedagógica muito baixa, sem explicações textuais claras, contendo capítulos vazios ou desorganizados. O tom é excessivamente informal/juvenil e não alinha com a proposta adulta e premium do Professor Lemos.  
**Quando o Professor Lemos deveria recomendar:**  
**NÃO RECOMENDAR.**  
**Como implementar no app:**  
Descartar e catalogar como rejeitado por baixa qualidade pedagógica.  
**Dados necessários:** URL, motivo de descarte.  
**Riscos:** Poluição visual e ruído pedagógico no treinamento do aluno.  
**Confiança:** alta (decisão de descarte imperativa)  

---

### Achado 42

**Título:** Lichess Puzzle API - Activity, Dashboard & Replay  
**Tipo:** other  
**URL:** https://github.com/lichess-org/api/blob/master/doc/specs/lichess-api.yaml  
**Autor/Fonte:** Lichess API  
**Valor:** A  
**Tema principal:** Endpoints de integração tática pessoal.  
**Fraquezas que treina:** 
- other

**Nível sugerido:** misto  
**Duração estimada:** variável  
**Por que é útil:**  
A API de puzzles do Lichess permite que o app faça sync do histórico do usuário de forma legítima e oficial:
1. `GET /api/puzzle/activity` (NDJSON): Puxa os puzzles recentemente resolvidos pelo jogador para extrair estatísticas de acertos/erros por tema.
2. `GET /api/puzzle/dashboard/{days}`: Traz estatísticas consolidadas por tema nos últimos X dias. Evita download de PGN completo e respeita a privacidade de dados do usuário.
Exige OAuth local com escopo mínimo `puzzle:read`.  
**Quando o Professor Lemos deveria recomendar:**  
Uso no backend de sincronização tática para adaptar o plano de treino semanal a partir dos dados do Lichess.  
**Como implementar no app:**  
Módulo técnico de sync com fluxo PKCE local. Puxar apenas estatísticas agregadas por tema, descartando PGNs de puzzle completos.  
**Dados necessários:** IDs de puzzles (apenas para replay em caso de erro), estatísticas agregadas por tema.  
**Riscos:** Dependência de escopo OAuth. Mudanças de especificação da API do Lichess (geralmente retrocompatíveis).  
**Confiança:** alta  

---

### Achado 43

**Título:** Lichess Studies API - Create & Import PGN  
**Tipo:** other  
**URL:** https://github.com/lichess-org/api/blob/master/doc/specs/lichess-api.yaml  
**Autor/Fonte:** Lichess API  
**Valor:** B  
**Tema principal:** Criação de estudos e importação transiente de PGN.  
**Fraquezas que treina:** 
- other

**Nível sugerido:** misto  
**Duração estimada:** variável  
**Por que é útil:**  
Permite que o app crie um estudo privado (unlisted) no perfil do usuário no Lichess (`POST /api/study`) e importe PGNs de exercícios gerados pelo tutor (`POST /api/study/{studyId}/import-pgn`) configurando como modo interativo (`practice`). Permite que o aluno treine posições customizadas no ambiente nativo do Lichess. Exige escopo `study:write`.  
**Quando o Professor Lemos deveria recomendar:**  
Módulo opcional de "Criação do Estudo do Dia", ativo somente se o usuário optar por fazer login OAuth no Lichess.  
**Como implementar no app:**  
Botão de ação "Exportar treino para o Lichess". O app faz a requisição via API e abre o estudo gerado.  
**Dados necessários:** studyId gerado pelo Lichess, URL do estudo. O PGN enviado deve ser descartado localmente logo após a requisição.  
**Riscos:** Limite de taxa (máximo 30 estudos criados por dia). Risco de poluir a conta do usuário com muitos estudos se não houver controle de reuso de capítulos.  
**Confiança:** alta  

---

### Achado 44

**Título:** Lichess Games/User API  
**Tipo:** other  
**URL:** https://github.com/lichess-org/api/blob/master/doc/specs/lichess-api.yaml  
**Autor/Fonte:** Lichess API  
**Valor:** B  
**Tema principal:** Importação de partidas terminadas do usuário.  
**Fraquezas que treina:** 
- blunder-rate
- conversion
- opening-principles
- time-trouble

**Nível sugerido:** misto  
**Duração estimada:** variável  
**Por que é útil:**  
Endpoint público `/api/games/user/{username}` que permite baixar partidas jogadas recentemente pelo usuário em formato NDJSON. Permite extrair métricas de erro brutas (inaccuracy/mistake/blunder rate) feitas na análise automática do Lichess para alimentar a detecção de fraquezas do tutor.  
**Quando o Professor Lemos deveria recomendar:**  
Fase de diagnóstico semanal.  
**Como implementar no app:**  
Coletor de partidas secundário (Chess.com é a fonte primária). Usar flags estritas para não ler/persistir o PGN completo: `moves=false`, `pgnInJson=false`, `finished=true`, `sort=dateDesc`.  
**Dados necessários:** Resultado, precisão da análise (se houver), eco da abertura, cor e data.  
**Riscos:** Rate limit em caso de downloads volumosos. Sem moves, o app precisa confiar nas estatísticas pré-calculadas de acurácia do Lichess.  
**Confiança:** alta  

---

# Resumo Executivo

## Top 10 Achados
1. **Lichess Practice - The Fork** (Achado 3): Melhor recurso guiado inicial para correção da fraqueza prioritária (Garfo).
2. **Lichess Practice - The Pin** (Achado 4): Essencial para fundação tática inicial.
3. **Lichess Practice - Key Squares** (Achado 9): Alicerce interativo definitivo para finais de peões.
4. **Lichess Practice - Checkmate Patterns I** (Achado 8): Reconhecimento excelente de mates em 2 e corredores.
5. **Puzzle Theme - Hanging Piece** (Achado 13): Bateria de exercícios mecânicos de maior transferência para redução imediata de blunders.
6. **Puzzle Streak** (Achado 17): Ferramenta fantástica para criar consistência de cálculo e focar na primeira tentativa.
7. **Lichess Practice - Basic Rook Endgames** (Achado 11): O padrão-ouro interativo para finais de torres (Lucena/Philidor).
8. **Lichess Video - Win More Games! Convert Material Advantage** (Achado 32): Melhor vídeo conceitual para traduzir vantagem material em vitória prática.
9. **Beginner Endgames You Must Know! (NoseKnowsAll)** (Achado 34): Melhor estudo conceitual da comunidade para progredir em finais sem riscos legais.
10. **Lichess Puzzle API (Dashboard & Activity)** (Achado 42): Principal meio técnico seguro e oficial para sync de progresso tático.

## Lacunas Encontradas
- **Escassez de Vídeos em PT-BR na Biblioteca Oficial do Lichess:** Praticamente todo o acervo forte e indexado (como os excelentes vídeos da Chessfactor com IM Alex Astaneh e IM Kostya Kavutskiy) é em inglês. O app precisará oferecer guias e resumos conceituais breves em português para ambientar o usuário antes de abrir o link.
- **Falta de API de Recomendação de Estudos da Comunidade:** O Lichess não provê um endpoint que avalie ou filtre os melhores estudos da comunidade por qualidade pedagógica ou ausência de copyright. A curadoria de estudos comunitários deve continuar estritamente manual e estática.
- **Restrição de Atualização de Puzzles pelo App:** Não há escopo ou endpoint permitido (`puzzle:write` é restrito e viola a filosofia de jogo do projeto) para o app informar ao Lichess que um puzzle foi resolvido localmente. O progresso deve ser reconciliado de forma passiva por leitura (`puzzle:read`) ou inserção manual local de feedback do aluno.

## Recomendações de Implementação
1. **Estrutura de Catálogo Estática:** Implementar os achados como um JSON ou vetor TypeScript estático dentro de `src/domain/catalog.ts`. Recursos de valor **A** devem ser classificados como recursos primários e recomendados primeiro. Recursos de valor **B** servem como recursos de reforço. Recursos **C** devem ser mantidos ocultos até validação humana.
2. **Mapeamento de Fluxo de Treino (Ciclo de Aprendizado):**
   - **Estágio 1 (Guided):** Recomendar o módulo correspondente do *Lichess Practice* (ex: *The Fork* para fraqueza de garfo).
   - **Estágio 2 (Retrieval):** Recomendar bateria curta e focada do *Puzzle Theme* correspondente (ex: `/training/fork`).
   - **Estágio 3 (Retention/Reforço):** Recomendar o vídeo explicativo conceitual (ex: *Incredible Fork Tactics*) ou um capítulo selecionado dos estudos comunitários aprovados (ex: *NoseKnowsAll* para finais).
3. **Mapeamento de Duração:** 
   - Treinos curtos (5-10 min): *Puzzle Streak* ou *Puzzle Theme*.
   - Treinos médios/longos (15-30 min): Módulos do *Practice* ou *Vídeos*.
4. **Normalização de Fallbacks:** Caso o usuário não tenha conta Lichess logada, o app deve ocultar endpoints de API e direcionar os treinos puramente para os links públicos de Practice, Puzzles e Vídeos, que rodam de forma excelente sem autenticação.

## Alertas Legais/API/Privacidade
- **Uso Estrito de PGN Transiente:** Ao usar a API de Estudos (`study:write`), o PGN dos lances deve ser montado na memória do app e transmitido via request POST. Esse PGN **nunca** deve ser salvo no banco local (Dexie), nem exposto em logs ou commitado no repositório.
- **Detecção de Copyright Comunitário:** Todo estudo comunitário que citar explicitamente trechos de livros protegidos (como Keres, Dvoretsky, Silman) deve ser descartado sumariamente para manter a integridade jurídica de clean-room do projeto.
- **Conformidade de Fair Play:** O app não deve, sob hipótese alguma, interagir com partidas em andamento. Qualquer link de análise ou importação de partidas deve possuir filtros explícitos de partidas concluídas (`finished=true`).

## Sugestão de Estrutura de Dados

```ts
export type CuratedResource = {
  id: string; // ex: "practice-fork"
  title: string;
  type: 'official-practice' | 'puzzle-theme' | 'community-study' | 'video' | 'tool' | 'other';
  url: string;
  sourceName: string; // ex: "Lichess", "NoseKnowsAll"
  author?: string;
  pedagogicalValue: 'A' | 'B' | 'C' | 'D';
  official: boolean;
  weaknessTags: string[]; // ex: ["fork", "calculation"]
  level: 'iniciante' | 'intermediario' | 'avancado' | 'misto';
  estimatedDuration: 'curta' | 'media' | 'longa' | 'variavel';
  language: 'pt-BR' | 'en' | 'other';
  requiresOAuth: boolean;
  oauthScopes?: string[]; // ex: ["puzzle:read", "study:write"]
  qualityStatus: 'approved' | 'needs-human-review' | 'rejected';
  rightsRisk: 'low' | 'medium' | 'high';
  notes?: string;
};
```

---

## Perguntas para Revisão Humana

1. **Abordagem de Idioma:** Dado que todos os vídeos táticos de alta qualidade oficiais do Lichess estão em inglês, o app deve mostrá-los normalmente com um aviso prévio ("Vídeo em inglês") ou o Professor Lemos deve tentar substituí-los por alternativas genéricas em português (o que reduziria o alinhamento com a biblioteca oficial do Lichess)?
2. **Revisão de Estudos Comunitários:** A série de finais "Endgames You Must Know!" do *NoseKnowsAll* (Achados 34, 35 e 36) foi classificada por nós como de altíssima qualidade (Valor A/B) e baixo risco legal. O dono autoriza a ativação direta desses estudos comunitários ou prefere mantê-los sob status `needs-human-review` temporariamente?
3. **Budget de Estudos Gerados via API:** Quando o dono optar por gerar o Study do dia via `study:write`, prefere que o app reuse o mesmo estudo no Lichess sobrescrevendo capítulos antigos (para não acumular centenas de estudos "lixo" no perfil) ou prefere a criação de um estudo novo a cada dia?
4. **Frequência de Puzzle Streak:** O *Puzzle Streak* provou ser o melhor recurso de consistência. O dono prefere que ele apareça obrigatoriamente como "aquecimento" em todos os planos diários ou que o tutor o alterne com puzzles temáticos?
