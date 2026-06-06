# Playbook De Planos De Estudo Lichess

Data: 2026-06-06

Este documento traduz a pesquisa acumulada em `C:\Users\tavar\OneDrive\Documentos\CLAUDE CODE\LEARN CHESS`
para planos de estudo que usam a base oficial do Lichess. O Lichess continua sendo o lugar onde o aluno treina;
este app decide o que abrir, por quanto tempo, como registrar o resultado e quando repetir.

## Guarda Clean-Room

- Foram usados apenas documentos de sintese, memoria, pesquisa pedagogica, auditoria e roadmap da pasta
  `LEARN CHESS`.
- Nao foram usados APKs brutos, codigo decompilado, assets, textos de aula, bancos proprietarios, listas de
  puzzles pagos ou conteudo protegido.
- Padroes de concorrentes foram tratados como ideias abstratas de produto e ensino: coach contextual, repeticao
  espacada, onboarding guiado, mini-sessoes, feedback causal e planos semanais.
- Os destinos concretos deste app sao recursos oficiais do Lichess: Learn, Practice, Puzzle Themes, Puzzle
  Streak, Puzzle Storm, Video Library, Analysis e Studies via OAuth.
- Estudos gerados a partir de erros pessoais devem ser privados ou unlisted por padrao. Estudos publicos so
  entram quando forem genericos, revisados e seguros para comunidade.

## Fontes Locais Lidas

Fontes principais da pasta `LEARN CHESS`:

| Grupo | Arquivos | Como usar aqui |
|---|---|---|
| Contrato do produto antigo | `PROJECT_MEMORY.md`, `PLANO.md`, `ROADMAP.md` | Extrair o loop de aprendizagem, invariantes e ordem de habilidades. |
| Sintese-mestra | `docs/research/MASTER-SINTESE-PESQUISAS-2026-06-04.md` | Preservar decisoes vivas: erro -> causa -> repeticao -> transferencia. |
| Pedagogia | `zero-to-1000.md`, `RELATORIO-PEDAGOGIA-CODEX.md`, `META-ANALISE-PEDAGOGIA.md`, `SINTESE-PEDAGOGIA-ANTIGRAVITY.md` | Definir prioridade curricular, repeticao, primeira tentativa, interleaving e transferencia. |
| Puzzles | `PESQUISA-PUZZLES-PEDAGOGIA-CONSOLIDADA.md` | Usar `conceptVariant`, `difficultyStep`, formatos variados e progressao conceitual como inspiracao. |
| Concorrencia | sinteses em `docs/history/research/competitive-analysis/` | Usar apenas padroes abstratos: plano personalizado, coach, SRS, game feel, revisao de erros e leveza. |

## Tese Consolidada

O Lichess ja tem conteudo excelente. O problema do aluno iniciante nao e falta de conteudo; e nao saber qual
conteudo abrir hoje, em que ordem, com qual regra de parada e como ligar aquilo aos erros reais das partidas.

Formula do produto:

```text
sinal real -> fraqueza provavel -> recurso Lichess certo -> tempo combinado -> resultado -> revisao futura
```

O app nao deve virar outro tabuleiro, outro banco de aulas ou outro resolvedor de puzzle. Ele deve ser o
orquestrador da pratica.

## Principios Pedagogicos

1. **Erro real antes de preferencia declarada.**
   O plano deve pesar mais o que apareceu em partida, puzzle activity ou revisao do que o que o aluno diz que quer
   estudar. Preferencia pode ajustar tom e tempo, mas nao substituir evidencia.

2. **Uma habilidade-foco por dia, com interleaving leve.**
   O aluno precisa saber o que esta treinando hoje. Mas sessoes longas devem misturar um pouco de revisao vencida,
   seguranca de pecas e transferencia para evitar decoreba por tema.

3. **Worked example -> pratica guiada -> recuperacao ativa -> transferencia.**
   Se o conceito e novo, abrir Practice ou video primeiro. Se ja foi visto, abrir puzzle theme. Se o erro veio de
   partida, abrir analise/Study da posicao terminada.

4. **Primeira tentativa e o sinal honesto.**
   Retry ensina, mas nao deve contar como dominio independente. Ao integrar `puzzle:read`, guardar acertos/erros
   como evidencia de treino, mas manter a distincao entre primeira tentativa e conclusao.

5. **Seguranca de pecas e ameacas do adversario nunca somem.**
   Abaixo de 1200, peca pendurada, mate simples e ameaca ignorada aparecem antes de taticas bonitas. Mesmo quando o
   foco for abertura ou final, o plano deve manter uma dose curta de anti-blunder.

6. **Progressao e conceitual, nao so por rating do puzzle.**
   Garfo simples, garfo com xeque, garfo com distrator e garfo em dois lances nao sao a mesma habilidade. No app,
   isso vira historico por tema, contexto e futuramente `conceptVariant`/`difficultyStep`.

7. **Formato unico vicia.**
   So abrir `best move` ensina o aluno a procurar golpe vencedor. O plano precisa alternar: achar ameaca, defender,
   avaliar troca, resolver sequencia, revisar posicao real e jogar partida lenta.

8. **Abertura antes de 1200 e principio, nao linha.**
   Para `opening-principles`, nao abrir explorador solto como se fosse aula. Usar video/Practice/analise guiada por
   checklist: centro, desenvolvimento, roque, seguranca do rei e nao mover a dama cedo sem motivo.

9. **Revisao vencida e bloco central.**
   O plano diario deve tratar erro antigo como tarefa de hoje, nao como painel escondido. A fila ideal mistura
   puzzles vencidos, erros de partida, estudos gerados e feedback `hard`.

10. **Retorno sem vergonha.**
    Se o aluno ficou dias sem treinar, o app reduz carga e oferece uma sessao curta. Nao cobrar atraso.

## Papeis Dos Recursos Lichess

| Recurso | Papel pedagogico | Quando recomendar | Quando evitar |
|---|---|---|---|
| Lichess Learn | Fundamentos absolutos | Regras, movimento, xeque, mate, roque, promocao | Como destino generico para tema especifico |
| Lichess Practice | Aula guiada | Primeiro contato com garfo, cravada, espeto, descoberta, finais | Quando o aluno ja viu o tema varias vezes na semana |
| Puzzle Theme | Recuperacao ativa | Repetir tema ja explicado, medir precisao e erro | Como primeira aula de conceito novo dificil |
| Puzzle Streak | Precisao sem pressa | Anti-blunder, retomada, treino leve | Se virar pressa ou streak punitivo |
| Puzzle Storm | Reconhecimento sob tempo | 800-1200, `time-trouble`, sessoes curtas | 0-800 ou quando a pessoa erra por ansiedade |
| Video Library | Explicacao | Abertura por principios, fundamentos sem Practice bom | Como substituto permanente de pratica |
| Analysis | Transferencia | Partida terminada, posicao de erro, revisao de causa | Durante partida ao vivo ou para sugerir lance |
| Puzzles from player games | Ponte com jogos reais | Repetir padroes vindos do proprio historico Lichess | Se depender de scraping ou dados nao oficiais |
| Studies | Pacote persistente | P3: estudo privado/unlisted de erros do dia/semana | Publicar automaticamente erros pessoais |

## Studies Publicos

Vale a pena gerar estudos publicos, mas nao como primeira resposta automatica.

Camadas recomendadas:

1. **Study pessoal diario ou semanal.**
   Gerado via OAuth `study:write`, privado ou unlisted, com capitulos de posicoes terminadas e temas fracos. Objetivo:
   continuidade entre PC e celular e revisao recorrente.

2. **Study-template generico.**
   Publico somente quando nao contem dados pessoais, PGN privado, padrao de erro individual ou texto copiado. Exemplo:
   "Principios de abertura para 0-1000: centro, desenvolvimento e rei seguro", usando posicoes proprias/autorizadas
   ou estruturas genericas.

3. **Biblioteca comunitaria P5.**
   Depois de renomeacao, disclaimers e revisao publica, criar estudos publicos curados que outras pessoas possam
   seguir. Aqui o app vira tambem editor de curriculos, nao so ferramenta pessoal.

Regra: Study publico e produto editorial. Study pessoal e ferramenta de treino. Nao misturar os dois sem revisao.

## Selecionador Ideal

O seletor deve escolher nao apenas o tema, mas o estagio da aprendizagem:

```text
novo conceito        -> explicacao/Practice
conceito ja visto    -> Puzzle Theme
erro pessoal         -> Analysis ou Study privado
erro repetido        -> Study + puzzle theme + revisao futura
facil demais         -> tema irmao ou dificuldade maior
dificil demais       -> Practice/video + carga menor
sem dados suficientes -> anti-blunder conservador
```

Campos de decisao recomendados:

- `weaknessTag`: fraqueza principal.
- `learnerBand`: `0-800` ou `800-1200`.
- `stage`: `explain`, `guided`, `retrieval`, `transfer`, `review`.
- `recentResources`: recursos abertos nos ultimos 7 dias.
- `feedback`: `easy`, `hard`, `skipped`, `done`.
- `objectiveEvidence`: puzzle activity, game review, tempo treinado, finalizacao.

## Planos Por Faixa

### 0-800: Fundacao Anti-Blunder

Objetivo: jogar partidas legais, ver ameacas simples e parar de entregar material.

Prioridade:

1. Regras e fundamentos no Lichess Learn, so quando houver lacuna real.
2. `hangingPiece`, `mateIn1`, `oneMove` e Puzzle Streak sem pressa.
3. Practice de mates basicos.
4. Revisao de uma posicao terminada por vez.
5. Abertura so por principios: centro, desenvolvimento e rei seguro.

Semana padrao:

| Dia | Foco | Recurso |
|---|---|---|
| 1 | Peca pendurada | `training/hangingPiece` ou Streak curto |
| 2 | Ameaca do adversario | `training/defensiveMove` ou revisao de partida terminada |
| 3 | Mate simples | Practice `Piece Checkmates I` ou `training/mateIn1` |
| 4 | Garfo simples | Practice `The Fork` |
| 5 | Partida lenta | Jogar sem ajuda e depois revisar um erro |
| 6 | Retomada leve | Puzzle Streak ou video curto |
| 7 | Descanso/revisao | Repetir erro mais recente |

### 800-1200: Calculo Curto E Transferencia

Objetivo: calcular 1-2 lances, reconhecer padroes recorrentes, converter vantagem simples e revisar derrotas.

Prioridade:

1. Practice de taticas fundamentais: garfo, cravada, espeto, descoberta.
2. Puzzle themes correspondentes, preferindo `short` antes de `long`.
3. Finais de peoes e torres.
4. Revisao de partidas terminadas com uma causa principal.
5. Abertura por principios ligada ao proprio historico, nao memorizacao de linha.

Semana padrao:

| Dia | Foco | Recurso |
|---|---|---|
| 1 | Tema guiado | Practice do tema fraco |
| 2 | Recuperacao ativa | `training/{theme}` + `short` |
| 3 | Anti-blunder | `hangingPiece`, `defensiveMove`, Streak |
| 4 | Final | Practice `Key Squares`, `Opposition` ou `Basic Rook Endgames` |
| 5 | Transferencia | Analysis de partida terminada ou Study privado |
| 6 | Pressao controlada | Storm curto se nao aumentar pressa; senao Streak |
| 7 | Fechamento | Revisao dos itens `hard` da semana |

## Templates Por Tempo

### 10 minutos

- 1 min: ler o foco do dia.
- 7 min: recurso principal no Lichess.
- 2 min: concluir no app, registrar dificuldade e proximo passo.

Se clicar em concluir antes do tempo, mostrar "treinou por X minutos" e salvar mesmo assim.

### 15 minutos

- 10 min: recurso principal.
- 3 min: revisao de erro ou segundo recurso curto.
- 2 min: fechamento.

### 30 minutos

- 5 min: anti-blunder.
- 15 min: tema principal.
- 8 min: transferencia em Analysis/Study.
- 2 min: fechamento.

### 60 minutos

- 10 min: revisao vencida.
- 20 min: tema principal.
- 20 min: partida lenta ou analise de partida terminada.
- 10 min: final/resumo.

Nao transformar uma sessao de 60 minutos em quatro temas aleatorios. A sessao longa ainda tem um eixo central.

## Mapeamento Para O Catalogo Lichess

| Fraqueza | Primeiro recurso | Segundo recurso | Transferencia |
|---|---|---|---|
| `hanging-piece` | `training/hangingPiece` | `training/trappedPiece` ou Streak | revisar uma posicao onde uma peca ficou solta |
| `blunder-rate` | `training/hangingPiece` | `training/defensiveMove` | checklist antes de partida lenta |
| `fork` | Practice `The Fork` | `training/fork` + `short` | procurar dois alvos em partida terminada |
| `pin` | Practice `The Pin` | `training/pin` + `xRayAttack` | revisar linha rei/peca valiosa/defensor |
| `skewer` | Practice `The Skewer` | `training/skewer` | revisar alinhamento de peca valiosa |
| `discovered` | Practice `Discovered Attacks` | `training/discoveredAttack` + `discoveredCheck` | revisar bloqueadores e linhas longas |
| `mate-in-1` | Practice `Piece Checkmates I` | `training/mateIn1` + `oneMove` | dizer a ameaca antes do lance |
| `mate-in-2` | Practice `Checkmate Patterns I` | `training/mateIn2` + `long` | revisar ataque ao rei em partida terminada |
| `back-rank` | `training/backRankMate` | Practice `Checkmate Patterns I/II` | revisar casas de fuga e seguranca do rei |
| `opening-principles` | video `beginner/opening` | `training/opening`, `castling`, `attackingF2F7` | revisar primeiros 8-10 lances de partida terminada |
| `endgame-pawn` | Practice `Key Squares` | Practice `Opposition`, `training/pawnEndgame` | reconstruir linha sem olhar resposta |
| `endgame-rook` | Practice `Basic Rook Endgames` | `training/rookEndgame` | revisar atividade da torre e rei |
| `time-trouble` | Analysis de partida terminada | Streak sem pressa, Storm so se ajudar | achar o primeiro momento em que o relogio mandou |
| `conversion` | Analysis de partida terminada | final/tatica conforme causa | escrever uma frase: como converter a vantagem |

## Regra Especial Para Aberturas

Quando o sinal for "a abertura King's Pawn Opening 1...e5 apareceu varias vezes com resultado dificil", a tarefa
nao deve abrir o explorador de aberturas sozinho.

Plano melhor:

1. Abrir videos de abertura para iniciantes ou material guiado de principios.
2. Pedir uma missao curta: centro, desenvolvimento, rei seguro.
3. Depois abrir Analysis de uma partida terminada do proprio aluno nos primeiros 8-10 lances.
4. Se OAuth Study estiver ativo, criar Study privado com 3-5 capitulos: "centro", "desenvolvimento", "roque",
   "dama cedo", "peca pendurada na abertura".

O explorador pode aparecer como ferramenta secundaria para curiosidade, nao como aula nem exercicio principal.

## Backlog Para Aplicar No App

### Implementado Em P2

- `weeklyFocus` no plano diario para explicitar o foco da semana.
- `weaknessTag` e `resourceStage` nos blocos de treino.
- Seletor por estagio: `guided` usa recurso primario curado, `explain` prefere video quando existe,
  `retrieval` usa Puzzle Theme e `transfer`/`review` abrem Analysis de partida terminada.
- Feedback `easy`/`hard` salvo no bloco/log local; ao regenerar, `easy` avanca para repeticao e `hard`
  volta para explicacao.
- Normalizacao de planos antigos preserva puzzle theme quando o bloco novo e repeticao deliberada.

### P2 - Selecionador De Recurso Por Estagio

- Evoluir de `resourceStage` local para historico multi-dia.
- Se veio de erro pessoal: priorizar Analysis ou Study privado.
- Se feedback `hard`: reduzir carga, nao apenas trocar recurso.
- Se feedback `easy`: passar para tema irmao quando houver evidencia suficiente.

### P2 - Tema Semanal

- Guardar semana, tema, dias ativos, recursos usados e feedback.
- Alternar `Practice -> Puzzle Theme -> Analysis/Study -> revisao`.

### P2 - Reconciliacao Objetiva

- Ao abrir Lichess, iniciar timer local.
- Ao bater o tempo, avisar sem bloquear continuidade.
- Ao concluir, salvar tempo real e buscar atividade oficial quando houver OAuth `puzzle:read`.
- Se o usuario esquecer de concluir, reconciliar depois quando a atividade aparecer.

### P3 - Study Pessoal

- OAuth PKCE opt-in com `study:write`.
- Criar estudo privado/unlisted "Treino da semana".
- Importar capitulos por FEN/PGN minimo de posicoes terminadas, sem persistir PGN completo no app.
- Atualizar capitulos quando novos erros recorrentes aparecerem.

### P5 - Studies Publicos Curados

- Criar biblioteca publica apenas com conteudo generico, revisado e limpo.
- Separar estudos pessoais de estudos editoriais.
- Incluir disclaimer de app nao oficial e revisao publica.

## Criterios De Qualidade

Um plano recomendado e bom quando:

- abre um recurso especifico, nao uma pagina generica;
- cabe no tempo combinado;
- tem regra de parada;
- registra resultado real ou feedback leve;
- conecta o treino a uma fraqueza observada;
- evita ajuda durante partida ao vivo;
- nao depende de engine, scraping ou conteudo proprietario;
- deixa o aluno saber exatamente o que observar.

## Decisao Pratica

Para a ferramenta pessoal, a melhor ordem e:

1. P2: melhorar seletor de recursos e tema semanal usando este playbook.
2. P2: concluir OAuth `puzzle:read` para reconciliar resultado objetivo.
3. P3: gerar Study pessoal privado/unlisted com OAuth `study:write`.
4. P5: so depois criar estudos publicos curados para outras pessoas seguirem.

Isso preserva o valor principal: plano adaptativo pessoal hoje, sem transformar material bruto em produto publico
antes da hora.
