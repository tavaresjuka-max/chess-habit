# Metodo Consolidado a partir do Acervo (DeepSeek + Gemini)

Data: 2026-06-09

## Como este documento foi construido

Dois pesquisadores de IA (DeepSeek e Gemini) analisaram independentemente os 124 livros do acervo
(`LIVROS XADREZ PARA CONSULTA/`) com o mesmo prompt. Suas saidas estao em `analise-acervo-DEEPSEEK.md`
e `analise-acervo-GEMINI.md`; as fichas por livro estao em `docs/research/chess-literature/fichas-pedagogicas-batch1.md`,
`docs/research/fichas_batch2.md`, `docs/research/fichas_batch3.md`.

Este documento e a **fusao** das duas analises, decidida na tabela de convergencia:

- **Base e criterios de progresso**: DeepSeek (progresso por sinais locais, nunca por rating).
- **Ganchos pedagogicos e esqueleto de execucao**: Gemini (LPDO, CCT, dialogo socratico, auditoria de
  desequilibrios, mapeamento para arquivos reais).
- **Espinha curricular**: consenso dos dois — e coincide com o curriculo ja adotado no projeto.

Convencoes: **(E)** evidencia/consenso entre os livros · **(I)** inferencia · **(P)** decisao de produto
a confirmar pelo dono.

## Decisao central: progresso por sinal local, nao por rating

O conflito mais importante entre as duas IAs foi como medir avanco. O Gemini amarrou o avanco a numero
de rating de puzzle (1200/1600/2200) e a vencer Stockfish nivel X. **Rejeitado**: contradiz o principio
do projeto ("nao prometer rating, nao usar tempo/rating como prova de dominio"). Adotamos o criterio do
DeepSeek:

- avanco se mede por **acerto em puzzle reconciliado** (rotulado e misto), **reducao de blunders em
  partidas terminadas** e **capacidade de explicar o padrao**.
- rating e, no maximo, indicador secundario de contexto — nunca porta de avanco nem promessa.
- partida contra Stockfish e **destino de treino opcional**, nunca o juiz que libera a proxima fase.

## Espinha do metodo (consenso das duas IAs)

1. Seguranca antes de estrategia. Heisman domina 0-1000; Silman (imbalances) so entra a partir de 1400. **(E)**
2. Automatizar o basico antes de teorizar. Fischer (padroes) baixo; Nimzowitsch (sistema) 1400-1800+. **(E)**
3. Worked example antes de problema livre (carga cognitiva). **(E)**
4. Abertura por principios; zero variantes decoradas antes de ~1400. **(E)**
5. Separar reconhecer padrao de calcular (Neiman: "antena tatica" antes do calculo). **(E)**
6. Transferencia via autoanalise de partida propria encerrada. **(E)**

Ganchos absorvidos: **LPDO** (Loose Pieces Drop Off — Heisman) para seguranca; **CCT** (Cheques,
Capturas, Ameacas — Hertan) para calculo; **dialogo socratico** (Weeramantry) e **auditoria de
desequilibrios** (Silman) como formatos de feedback do Professor Lemos.

Na familia "detectar-antes-de-calcular" entra tambem o **DAMP**: **Defesa, Alinhamento, Mobilidade,
Promocao** (Duarte & Lapertosa, PT-BR). Aqui ele entra como **checklist de deteccao tatica** para achar
onde ha defeito na posicao; **nao** substitui LPDO/ritual de seguranca nem o CCT. DAMP acha onde ha
tatica; LPDO e CCT tratam seguranca do proprio lance e calculo.

## Escada completa (0 -> nivel alto)

Detalhe denso ate 1200 (fase ativa); esboco solido acima para o metodo ja nascer com a escada inteira.

| band | foco | nucleo | fontes-influencia |
|------|------|--------|-------------------|
| 0-600 | fundamentos + seguranca | tabuleiro, regras, mates elementares (D+R, T+R), captura, valor relativo, peca pendurada | Capablanca (PT-BR), Maizelis, Fischer, Heisman |
| 600-1000 | tatica curta + mates | garfo, cravada, espeto, descoberto, eliminar defensor; mate em 1 e 2; misto sem rotulo | Seirawan, Chandler, Polgar, Hertan, Neiman, DAMP (Duarte & Lapertosa) |
| 1000-1200 | finais-modelo + abertura-principio + calculo | rei+peao (quadrado, oposicao), torre (Lucena/Philidor), 3 principios de abertura, checklist de candidatos, autoanalise | Capablanca (PT-BR), Keres, Chernev, Benjamin, Lazzarotto |
| 1400-1800 | estrategia + estrutura + calculo profundo | imbalances (Silman), estrutura de peoes (Flores Rios/Shankland), CCT profundo, profilaxia, ataque ao roque, defesa, finais tecnicos | Silman, Stean, Watson, Vukovic, Marin, Nunn, Murray |
| 1800-2200 | dinamismo + conversao | sacrificio posicional, calculo de mestre, conversao sem pressa | Watson, Aagaard, Muller, Rowson |
| 2200+ | maestria | aluno ja autonomo — fora do escopo do app | — |

> Nota de suficiencia (DeepSeek): o acervo cobre 0-1800 com folga; acima de 1800 faltam Dvoretsky e
> calculo profundo dedicado. Nao e bloqueante — o app implementa hoje ate 1200.

## Blocos de treino consolidados (0-1200) — prontos para o app

Campos compativeis com o modelo de metadados ja usado no projeto. IDs no formato `band-stage-NN`.
Os 5 `exerciseMode` existentes sao mantidos (explain, guided, retrieval, review, transfer) — sem inventar
modos novos; os formatos especiais (visualizacao, socratico) vivem como `drill_formats` dentro de
retrieval/review.

### Banda 0-600 — fundamentos e seguranca

| id | stage | signal | weakness | learningGoal | exerciseMode | lichess_destino | tempo_min | sourceInfluence | avoid | criterio_conclusao | microcopy (Professor Lemos) |
|----|-------|--------|----------|--------------|--------------|-----------------|-----------|-----------------|-------|--------------------|------------------------------|
| 0-600-fundamento-01 | fundamento | conta nova / sem partidas | nao conhece regras nem coordenadas | mover as 6 pecas e nomear casas sem hesitar | explain → guided | Lichess Learn (Piece moves); /training/coordinate | 15 | Capablanca (PT-BR), Maizelis | decorar nome sem praticar | 20 acertos em 30s no Coordinates | "O tabuleiro e um mapa de ruas. Antes de qualquer ataque, voce precisa achar as casas de olhos fechados. Sem pressa." |
| 0-600-fundamento-02 | fundamento | movimentos ok | nao entende captura nem valor | capturar peca solta e saber valor relativo (1-3-3-5-9) | explain → guided → retrieval | Lichess Learn (Captures); Practice: Checkmates | 15 | Capablanca (PT-BR), Seirawan | capturar sem ver a resposta | 10 capturas corretas em sequencia | "Peao 1, cavalo e bispo 3, torre 5, dama 9. So troque quando ganhar material — ou quando vem mate atras." |
| 0-600-fundamento-03 | mate | captura dominada | nao da mate elementar | mate de R+D e R+T contra rei sozinho | guided → retrieval | Practice: Checkmates (Piece Checkmates I) | 20 | Capablanca (PT-BR), Fischer, Maizelis | perseguir o rei sem usar a dama como parede | 2 mates elementares concluidos | "Primeiro encurrale: corte as casas de fuga. O mate vem depois que o rei esta na parede. E cuidado com o afogamento — ele salva meio ponto perdido." |
| 0-600-fundamento-04 | fundamento | mate elementar feito | confunde regras especiais | roque, en passant, promocao, afogamento | explain → guided | Lichess Learn (Check/Checkmate/Intermediate) | 15 | Capablanca (PT-BR) | nao rocar "porque expoe o rei" | explicar cada regra com palavras proprias | "Roque protege o rei e ativa a torre num lance so. En passant e promocao confundem — pratique ate virar automatico." |
| 0-600-seguranca-01 | seguranca | regras ok; pendura peca | nao ve pecas soltas (LPDO) | detectar pecas desprotegidas (suas e dele) em ~5s | explain → guided → retrieval | Practice: Fundamental Tactics; Puzzles: hangingPiece | 15 | Heisman (LPDO), Avni | ignorar a propria peca pendurada | ≥90% em 30 puzzles de peca pendurada | "LPDO: peca solta cai. Antes de cada lance, duas perguntas em 5 segundos — alguma peca minha esta sem defesa? Ele deixou algo solto?" |
| 0-600-seguranca-02 | seguranca | peca pendurada sob controle | troca mal | avaliar troca por valor material | guided → retrieval | Puzzles: advantage, hangingPiece | 10 | Capablanca, Seirawan | trocar por impulso | ≥80% em 15 puzzles de troca | "Trocar so quando voce ganha. Dama por torre e mau negocio — a menos que venha mate." |

### Banda 600-1000 — tatica curta e mates

| id | stage | signal | weakness | learningGoal | exerciseMode | lichess_destino | tempo_min | sourceInfluence | avoid | criterio_conclusao | microcopy |
|----|-------|--------|----------|--------------|--------------|-----------------|-----------|-----------------|-------|--------------------|-----------|
| 600-1000-tatica-00 | tatica | acerta tema isolado mas nao sabe onde procurar tatica em posicao nova | olho vai direto ao lance sem detectar o defeito | identificar o defeito DAMP antes de calcular | explain → guided | puzzles tematicos por letra: hangingPiece (D), pin/skewer (A), trapped (M), pawnEndgame (P) | 15 | DAMP (Duarte & Lapertosa), Neiman | pular o scan e chutar lance | nomeia o defeito provavel antes do lance em ≥80% de 10-20 posicoes | "Antes do lance bonito, ache o defeito dele: Defesa (peca solta), Alinhamento (pecas na mesma reta), Mobilidade (peca presa) ou Promocao (peao quase virando dama). O calculo vem depois." |
| 600-1000-tatica-01 | tatica | seguranca ≥80% | nao reconhece garfo | achar garfo de cavalo/peao/dama em 1-2 lances | explain → guided → retrieval | Practice: The Fork; /training/fork | 20 | Seirawan, Chandler, Polgar | so procurar garfo de cavalo | ≥80% em 30 puzzles rotulados de garfo | "Garfo e alvo duplo: uma peca ataca duas. O cavalo e rei do garfo, mas peao e dama tambem. Pergunte: posso atacar duas de uma vez?" |
| 600-1000-tatica-02 | tatica | garfo ≥80% | nao reconhece cravada | identificar cravada absoluta e relativa | explain → guided → retrieval | Practice: The Pin; /training/pin | 20 | Seirawan, Polgar, Heisman | confundir absoluta com relativa | ≥80% em 30 puzzles de cravada | "Cravada: a peca nao pode sair porque expoe algo atras. Se for o rei, e proibido mexer (absoluta)." |
| 600-1000-tatica-03 | tatica | cravada ≥80% | nao reconhece espeto | identificar espeto (skewer) | explain → guided → retrieval | Practice: The Skewer; /training/skewer | 15 | Seirawan | ver cravada onde ha espeto | ≥80% em 25 puzzles | "Espeto e a cravada ao contrario: a peca da frente e a mais valiosa. Ela foge, voce pega a de tras." |
| 600-1000-tatica-04 | tatica | espeto/cravada/garfo ≥75% | nao ve descoberto | achar ataque e cheque descoberto | explain → guided → retrieval | Practice: Discovered Attack; /training/discoveredAttack | 20 | Hertan, Seirawan | esquecer que a peca da frente vai a qualquer casa | ≥75% em 25 puzzles | "Voce mexe uma peca e revela o ataque da peca de tras. No cheque descoberto, a da frente vai a QUALQUER casa — o mais perigoso do jogo." |
| 600-1000-tatica-05 | tatica | descoberto ≥75% | nao elimina defensor | capturar a peca que defende o alvo | guided → retrieval | Practice: Deflection; /training/deflection | 15 | Seirawan, Polgar | capturar defensor sem calcular o que vem depois | ≥70% em 20 puzzles | "Tire o defensor primeiro. Mas calcule o lance seguinte — as vezes ha um recurso que voce nao viu." |
| 600-1000-mate-01 | mate | taticas basicas ≥70% misto | nao reconhece mate em 1 | reconhecer 10 padroes de mate em 1 em ~10s | guided → retrieval | /training/mateIn1; Practice: Checkmates | 15 | Fischer, Chandler, Polgar | decorar nome sem reconhecer o padrao | ≥90% em 30 mates em 1 | "Aprenda os padroes: corredor, fundo, beijo da morte. Em partida ninguem avisa que ha mate — o olho precisa pegar sozinho." |
| 600-1000-mate-02 | mate | mate em 1 ≥90% | nao resolve mate em 2 | resolver mate em 2 com sacrificio | guided → retrieval | /training/mateIn2 | 15 | Fischer, Chandler, Polgar | parar de calcular apos o 1o lance | ≥70% em 25 mates em 2 | "Cheque agora (as vezes sacrificando), mate no proximo. O sacrificio volta com juros: o rei dele." |
| 600-1000-tatica-06 | tatica | todos os temas ≥70% | nao reconhece tema quando misturado | resolver puzzle misto sem rotulo | retrieval → review | Puzzle Streak; Puzzle Storm; /training | 15 | Neiman, Polgar, Lichess | acertar rotulado e errar misto (ilusao de competencia) | ≥70% em 50 puzzles mistos | "Agora sem dica. Ligue a antena: procure pecas soltas, rei exposto, pecas alinhadas. O gap entre rotulado e misto e o que falta transferir." |

### Banda 1000-1200 — finais-modelo, abertura por principios, calculo, transferencia

| id | stage | signal | weakness | learningGoal | exerciseMode | lichess_destino | tempo_min | sourceInfluence | avoid | criterio_conclusao | microcopy |
|----|-------|--------|----------|--------------|--------------|-----------------|-----------|-----------------|-------|--------------------|-----------|
| 1000-1200-final-01 | final | tatica mista ≥70% | nao sabe final de peao | quadrado, oposicao, R+P vs R (ganha/empata) | explain → guided → retrieval | Practice: Pawn Endgames; /training/pawnEndgame | 20 | Capablanca (PT-BR), Keres, Seirawan | calcular casa a casa em vez de usar o quadrado | ≥80% em finais basicos de peao | "Aqui o rei vira heroi. Quadrado do peao decide a corrida; oposicao decide quem cede. Plano pequeno: cortar, aproximar, executar." |
| 1000-1200-final-02 | final | final de peao ≥80% | nao sabe final de torre | Lucena (ganha) e Philidor (empata) | explain → guided | Practice: Rook Endgames | 20 | Capablanca (PT-BR), Keres, Nunn, Silman | por a torre na frente do peao | conceito Lucena+Philidor compreendido | "Final de torre e o mais comum. Duas chaves: Lucena (a ponte que promove) e Philidor (a torre na 6a que segura o empate)." |
| 1000-1200-abertura-01 | abertura-principio | tatica mista ≥60%, finais ok | abertura sem principios | jogar 10 partidas respeitando centro/desenvolvimento/roque | explain → guided → transfer | Video: Opening Principles; partidas 10+5 | 20 | Seirawan, Capablanca (PT-BR), Chernev, Lazzarotto (principios PT-BR, nao repertorio) | decorar variante em vez de principio | 10 partidas sem violar os 3 principios | "Abertura nao e decoreba: 1) ocupe o centro, 2) desenvolva (cavalos antes de bispos), 3) roque ate o lance 10. Dama cedo, nao." |
| 1000-1200-calculo-01 | calculo | abertura por principios ≥80% | joga o 1o lance que pensa | listar 2-3 candidatos e prever a melhor resposta (CCT) | explain → guided → retrieval | Lichess Analysis (sem engine); /training/forcings | 20 | Benjamin, Reinfeld, Hertan (CCT) | mecanizar o checklist sem pensar | checklist aplicado em 10 posicoes ≥70% | "Antes de jogar, PARE. Cheques, Capturas, Ameacas — nessa ordem. Liste 2-3 candidatos e pergunte: qual a melhor resposta dele? So depois decida." |
| 1000-1200-transferencia-01 | transferencia | checklist aplicado | nao analisa as proprias partidas | identificar 1 momento critico e nomear o tipo de erro | review → transfer | Lichess Analysis (1o sem engine, depois com) | 15 | Chernev, Heisman, Weeramantry (socratico) | culpar azar ou o adversario; ligar a engine antes de pensar | nomear o tipo de erro em 3 partidas seguidas | "Reveja sua ultima partida sem engine. Onde tudo mudou? Que erro foi — peca pendurada? tatica nao vista? final mal jogado? Uma licao por partida." |

## Biblioteca de formatos de treino (drill_formats)

Moldes abstratos reutilizaveis (sem copiar exercicios). Base DeepSeek (11) + delta verificado dos convertidos + ganchos unicos do Gemini.

| nome | descricao | passo a passo | band | stage | exerciseMode | mapa no Lichess | sinal de dominio | origem | armadilha |
|------|-----------|---------------|------|-------|--------------|-----------------|------------------|--------|-----------|
| Varredura Anti-Blunder (LPDO) | checagem de seguranca antes de calcular ataque | listar pecas soltas suas e dele → checar destino seguro → checar cheques/capturas/ameacas dele | 600-1000 | seguranca | guided | Puzzle Streak (1o lance, sem pressa) | 15 acertos seguidos sem erro de captura | Heisman | calcular plano profundo durante a varredura |
| Detectar-Antes-de-Calcular | separa reconhecimento de calculo | mostrar posicao → "qual o tema?" → so depois "qual o lance?" | 600-1400 | tatica | explain → retrieval | tema rotulado → tema oculto | acerta o tema antes do lance em >80% | Neiman | querer achar o lance antes de detectar o sinal |
| damp-scan | checklist DAMP de deteccao tatica antes do calculo | D (peca indefesa/rei exposto) → A (pecas alinhadas: cravada/espeto/raio-X) → M (peca com pouca mobilidade/presa) → P (peao perto de promover) → so depois calcular | 600-1200 | tatica | explain → guided → retrieval | hangingPiece (D), pin + skewer (A), trapped/mobility (M), pawnEndgame (P) | nomeia o defeito provavel antes do lance em >80% | DAMP (Duarte & Lapertosa) | confundir deteccao com calculo apressado |
| Algoritmo CCT | prioriza lances forcados | listar todos cheques → capturas → ameacas → calcular nessa ordem | 1000-1800 | tatica/calculo | retrieval | Puzzles forcings / Streak | acha o forcado "feio" vencedor >70% | Hertan | calcular cheque irracional quando a posicao pede calma |
| Worked-Example-Antes-do-Problema | explicacao guiada antes do exercicio | ver 2-3 exemplos resolvidos → resolver 5-10 similares | 0-1000 | todos | explain → guided → retrieval | Lichess Practice | ≥80% nos 5 primeiros apos exemplos | carga cognitiva (Sweller) | exemplo demais, pratica de menos |
| Tema-Rotulado-Depois-Misto | mede transferencia real | bloco rotulado → bloco misto → comparar gap | 600-1400 | tatica | guided → retrieval | /training/<tema> → /training | gap rotulado-misto <15% | Polgar, Steps | so fazer rotulado (ilusao de competencia) |
| Dialogo Socratico | auditoria do pensamento | aluno verbaliza a ideia → app aponta a fraqueza criada → aluno ajusta | 1000-1400 | plano | review | Lichess Study interativo | propoe lance por desequilibrio, nao por desejo | Weeramantry | o app dar a resposta antes do esforco |
| Auditoria de Desequilibrios | gera plano de meio-jogo | preencher imbalances brancas/pretas → achar o favoravel → rota de 3 lances | 1400-1800 | plano | explain | Study por estrutura | plano coincide com a 1a linha da engine | Silman | aplicar a tabela em posicao tatica aguda |
| Partida-Pergunta-Resposta | partida comentada que para e pergunta | mostrar ate momento critico → "o que joga? por que?" → revelar lance + razao | 1000-1800 | transferencia | explain → retrieval | Study interativo | antecipa o lance do mestre >40% | Chernev, Tal | ler a resposta sem pensar |
| Erro-Nomeado-Com-Correcao | autoanalise pos-partida | rever sem engine → marcar 1-3 momentos → classificar erro → 1 frase de correcao → conferir | 800-2200 | transferencia | review → transfer | Analysis + comentarios | nomeia o tipo de erro >60% | Heisman, Avni | culpar fatores externos |
| Micro-Sessao-Repetida | repeticao espacada | 10-20 posicoes nucleo → re-resolver em 1, 3, 7, 14 dias | 0-1800 | todos | review | Puzzle Replay / Study | ≥90% em <30s na 4a sessao | spaced repetition (Cepeda) | largar apos a 2a sessao |
| Finais Invisiveis | visualizacao por coordenadas | receber coordenadas em texto → reconstruir de cabeca → calcular a linha | 1000-1800 | final/calculo | retrieval | Study (lances invisiveis) | resolve final de 3 lances sem ver o tabuleiro | Justesen | usar com mais de 6 pecas |

## Regras do gerador de plano (SE-ENTAO) — por sinal local, sem rating

Proporcao-base elastica para ate ~1900, absorvida de Rafael Leitao: **~50% calculo/tatica, ~20%
partidas classicas + revisao, ~15% finais, ~15% abertura por principios**. O gerador repondera isso por
fraqueza local detectada e tempo disponivel; nunca por rating. Se ha perda de material, sobe
seguranca/tatica; se perde finais ganhos, sobe finais. Como nota operacional `0-1200-meta-01`
(explain unico, sem novo `stage`): "Abertura entra, mas nao engole o treino. Primeiro calculo, final e
revisao honesta de partida."

```
-- ORCAMENTO-BASE (Leitao, elastico)
distribuir_tempo_base = 50% calculo/tatica, 20% partidas_classicas+revisao, 15% finais, 15% abertura-principio
SE fraqueza_local_forte(seguranca_ou_tatica) ENTAO aumentar_fatia(seguranca_tatica)
SE fraqueza_local_forte(final) ENTAO aumentar_fatia(finais)
SE tempo_disponivel_curto ENTAO preservar_prioridade(calculo_tatica) + revisao_curta_de_1_partida_critica

-- FUNDAMENTOS
SE conta_nova OU sem_partidas_analisadas ENTAO stage=fundamento; modo=explain→guided; band=0-600

-- SEGURANCA (trava de avanco)
SE taxa_blunder_partidas > 30% OU (sem_bloco_seguranca E erra_peca_pendurada) ENTAO
  stage=seguranca; foco=peca_pendurada→troca; modo=explain→guided→retrieval
  DESABILITAR blocos de plano e abertura ate seguranca estabilizar

-- TATICA
SE taxa_blunder < 20% E acerto_tema(X) < 70% ENTAO
  stage=tatica; foco=tema_de_menor_acerto; modo = explain(novo) | guided(visto) | retrieval(>70% rotulado)

-- PROGRESSAO NA TATICA
SE acerto_rotulado(tema) > 80% ENTAO modo=retrieval(sem rotulo)
SE acerto_misto > 70% ENTAO avancar_tema()
SE acerto_misto < 50% ENTAO voltar_para_rotulado(tema)

-- MATE / FINAL / ABERTURA / CALCULO seguem a escada por acerto, nunca por rating
SE todos_temas > 70% E mate1 < 90% ENTAO stage=mate
SE tatica_mista > 70% E mate1 > 90% ENTAO stage=final (peao→torre)
SE finais_basicos ok E abertura_ruim > 40% ENTAO stage=abertura-principio; modo=explain→transfer
SE abertura ok E impulsividade > 30% ENTAO stage=calculo (checklist CCT)

-- TRANSFERENCIA E REVISAO (transversais)
SE partida_terminada ENTAO stage=transferencia; modo=review→transfer
SE tema(X) sem treino > 7 dias ENTAO modo=review; interleaving = X + Y_ja_dominado

-- FEEDBACK
SE feedback=dificil ENTAO regredir modo (retrieval→guided→explain)
SE feedback=facil ENTAO avancar modo
SE feedback=bom ENTAO manter com variacao

-- DOMINIO
SE acerto > 80% em retrieval ENTAO bloco_concluido()
SE acerto < 50% em retrieval ENTAO sinalizar_fraqueza(); revisitar em 1 dia
```

## Sinais de dominio (sem prometer rating)

| sinal | como medir | confianca |
|-------|------------|-----------|
| acerto em puzzle do tema >80% (rotulado) | puzzle activity reconciliada | alta (E) |
| acerto em puzzle misto >70% | Streak/Storm stats | alta (E) |
| reducao de blunders/partida | game analysis (PGN terminado) | alta (E) |
| 5 partidas lentas seguidas sem blunder de pendurar peca | auditoria local do PGN | alta (E) |
| nomear o tipo de erro apos a partida | autoanalise guiada local | media (I) |
| sessoes concluidas sem pular | log local | alta (E) |
| feedback "bom"/"facil" consistente (>3 sessoes) | log local | media (I) |

## Anti-patterns (o que o metodo recusa) — consenso

- Decoreba de variantes de abertura para <1400/<1800.
- Gamificacao vazia (badges/pontos sem aprendizado).
- Promessa de QI, foco, nota escolar ou "mestre em 30 dias".
- Recomendar lance durante partida ao vivo (viola Fair Play do Lichess).
- Sessoes longas sem pausa; foco exclusivo em blitz/bullet.
- "So jogue que voce melhora" (jogo livre sem analise nao e pratica deliberada).
- **Novo (decisao desta fusao):** usar rating ou vitoria contra Stockfish como porta de avanco.

## Lacunas para revisao humana (decisao do dono)

| lacuna | status / decisao necessaria | impacto |
|--------|----------------------------|---------|
| threshold exato de "dominio" | 80%? 90%? varia por dificuldade do puzzle? | alto |
| proporcao revisao vs novo | parcialmente melhorada pela proporcao-base do Leitao; calibracao fina por banda e rotina real segue aberta | alto |
| interleaving: quantos temas por sessao | 2? 3? rotacao semanal? | medio |
| intervalos de repeticao espacada | 1-3-7-14-30 dias? | alto |
| quando introduzir 1a abertura por nome | nunca antes de 1200? 1 abertura aos 1000? | medio |
| repertorio minimo adaptativo | parcialmente melhorado: Lazzarotto entra como referencia/vocabulario PT-BR; continua aberto e nao vira repertorio pronto | medio |
| calculo 1200+ | parcialmente melhorado: Movimento Forcado entra como banco de exercicios acima de 1200; e exercicio, nao metodo | medio |
| calculo-ponte 800-1200 | ainda aberto; Movimento Forcado comeca acima disso e nao fecha a lacuna | alto |
| defesa/profilaxia pratica 1000-1400 | ainda aberto; DAMP "D" ajuda a detectar, mas nao substitui manual de defesa | alto |
| microcopy PT-BR validada | ainda aberto; depende de uso real do dono | medio |
| tom do Professor Lemos na correcao | direto ("garfo mal calculado") vs encorajador ("quase! ha duas ameacas") | medio |
| orcamento de tempo padrao | parcialmente melhorado pelo Leitao; 15/30 min ainda precisam validar com a rotina real | medio |

## Fontes em dominio publico provavel (para posicoes/partidas reais no futuro)

So triagem; confirmar jurisdicao antes de qualquer reuso direto.

| titulo | autor | ano | status do original | status da traducao/edicao PT-BR | uso potencial |
|--------|-------|-----|--------------------|----------------------------------|---------------|
| Chess Fundamentals | Capablanca | 1921 | provavel dominio publico | a verificar | finais e partidas comentadas |
| Fundamentos do Xadrez | Capablanca (ed. PT-BR) | edicao BR posterior | original provavel dominio publico | traducao/edicao brasileira a verificar | referencia PT-BR para fundamentos, finais e partidas comentadas |
| My System / Chess Praxis | Nimzowitsch | 1925-29 | provavel dominio publico | a verificar | posicoes estrategicas, bloqueio, peao passado |
| Lasker's Manual / Common Sense in Chess | Lasker | 1896-1925 | provavel dominio publico | a verificar | posicoes-modelo e partidas |
| The Game of Chess | Tarrasch | 1931 | provavel dominio publico | a verificar | partidas comentadas |
| 500 Master Games | Tartakower | 1952 | verificar | a verificar | partidas-modelo (verificar) |
| Art of Combination / How Not to Play / Middle Game | Znosko-Borovsky | 1930-36 | provavel dominio publico | a verificar | combinacao, erros classicos, meio-jogo |

## Proximos passos para o Codex implementar (esqueleto Gemini, adaptado)

Mantendo os 5 `exerciseMode` atuais (sem adicionar modos novos — os formatos especiais sao drill_formats):

1. **`src/domain/types.ts`** — expandir `LearnerBand` para `0-600 | 600-1000 | 1000-1400 | 1400-1800 | 1800-2200 | 2200+`; adicionar `WeaknessTag`: `profilaxia`, `estrutura-peoes`, `calculo-profundo`, `finais-tecnicos` (alem dos taticos ja existentes).
2. **`src/curriculum.ts`** (novo) — constantes band/stage e a tabela de progressao desta escada.
3. **`src/drillFormats.ts`** (novo) — os 12 formatos da biblioteca acima.
4. **`src/trainingBlocks.ts`** (novo) — os ~19 blocos 0-1200 com microcopy PT-BR.
5. **`src/domain/sources/catalogSkills.ts`** — novos nos de skill (CCT, finais invisiveis, deteccao de tema) ligados aos blocos.
6. **`src/domain/plan/generatePlan.ts`** — implementar as regras SE-ENTAO por sinal local; trava de seguranca quando taxa de blunder alta.
7. **Testes** — `diagnosis.test.ts` e `generatePlan.test.ts`: transicao entre bandas e bloqueio por seguranca.
8. **Gate:** `npm run lint && npm run test && npm run build`.

---
*Fusao das analises DeepSeek + Gemini (2026-06-09), com deltas verificados dos convertidos integrados no
mesmo dia. Metodo original — principios, sequencias e formatos escritos a partir da influencia
pedagogica dos livros, sem copiar texto, diagramas ou exercicios. Conceitos de dominio (oposicao,
garfo, peca solta, regra do quadrado) sao conhecimento comum.*
