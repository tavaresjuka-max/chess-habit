# Metodo Professor Tavarez

Data: 2026-06-09

Este documento define como o app decide o que o aluno precisa estudar, como mede progresso e quais
referencias sustentam o metodo. Ele complementa `docs/pedagogy/lichess-study-plan-playbook.md` e a
spec vigente da ferramenta pessoal.

## Tese

O problema central do aluno iniciante nao e falta de conteudo. O Lichess ja tem Practice, Puzzle
Themes, Streak, Studies, videos e analise. O problema e decidir o que abrir hoje, por quanto tempo,
com qual criterio de parada e como ligar isso aos erros reais.

Formula do app:

```text
sinal real -> fraqueza provavel -> foco da fase -> recurso Lichess -> treino com tempo -> resultado -> ajuste
```

O metodo e classico nos fundamentos e inovador na orquestracao.

- Classico: pratica deliberada, recuperacao ativa, repeticao espacada, exemplos guiados, feedback e
  transferencia para partidas.
- Inovador: usa dados reais de Chess.com/Lichess, preserva privacidade local-first, abre treino no
  Lichess em vez de criar outro tabuleiro, e explica em PT-BR o plano e a confianca da hipotese.

## Como O App Decide O Que Estudar

1. Coleta sinais permitidos.
   - Chess.com publico: rating por ritmo, resultados por abertura/cor/tempo e accuracy quando existe.
   - Lichess publico ou OAuth opt-in: partidas terminadas, puzzle activity/dashboard e replay agregado.
   - Manual local: percepcao do aluno sobre tempo, calculo, peca solta ou tema conhecido.

2. Converte sinais em fraquezas provaveis.
   - Exemplos: muitos blunders em jogos analisados viram `blunder-rate`; perdas por tempo viram
     `time-trouble`; tema de puzzle com erros suficientes vira fraqueza de tema.
   - A linguagem deve ser sempre de hipotese: "os sinais sugerem", nao "voce perde porque".

3. Escolhe uma habilidade-foco.
   - O maior score vira foco da semana/fase.
   - Sem dados suficientes, o app usa fallback por faixa: `0-800` tende a peca pendurada; `800-1200`
     tende a garfos.

4. Escolhe o estagio de treino.
   - `explain`: explicacao curta ou video direto.
   - `guided`: Lichess Practice quando o conceito ainda precisa de guia.
   - `retrieval`: Puzzle Theme variado quando o conceito ja foi visto.
   - `review`: replay/revisao quando houve erro recente.
   - `transfer`: tarefa menos guiada para aproximar de partida real.

5. Ajusta pela resposta do aluno.
   - `hard`: reduz carga ou volta para explicacao.
   - `good`: mantem desafio com variacao.
   - `easy`: avanca para repeticao/transferencia.
   - Sem feedback, aula guiada ja aberta conta como exposicao suficiente para evitar repeticao mecanica.

## Como O App Mede Progresso

O progresso nao e definido por XP nem por promessa de rating. O app mede habito e habilidade.

Habito:

- sessoes concluidas;
- horas treinadas;
- blocos feitos ou pulados;
- retorno apos ausencia sem punicao;
- checkpoints de 6h, 12h, 24h e ciclos seguintes.

Habilidade:

- acerto em puzzles reconciliados;
- erros por tema de puzzle;
- tendencia de acerto entre sessoes;
- temas que ficaram mais estaveis;
- queda de feedback `hard`;
- capacidade de explicar o padrao antes do lance.

Limite honesto: feedback manual e tempo treinado nao provam dominio. Eles indicam adesao e carga. O
sinal mais forte, quando disponivel, e primeira tentativa em puzzle ou erro real em partida terminada.

## Referencias De Estudo

Base pedagogica usada:

- Recuperacao ativa e repeticao espacada: revisoes de psicologia da aprendizagem indicam que recuperar
  ativamente e espacadamente tende a reter melhor que releitura ou maratona.
- Worked examples e carga cognitiva: iniciantes aprendem melhor com exemplo/guiamento antes de
  problema livre; por isso o app usa Practice/video antes de puzzle variado quando o tema e novo.
- Interleaving leve: uma habilidade-foco por vez, com aquecimento anti-blunder e transferencia para
  reduzir decoreba por tema.
- Pratica deliberada no xadrez: treino estruturado e feedback importam, mas nao explicam tudo. Por
  isso o app fala em rotina e sinais, nao em garantia de rating.
- Sistemas recomendadores educacionais: a literatura mostra lacuna em medir efeito pedagogico real,
  entao o app deve ser transparente sobre suas metricas e nao vender recomendacao como prova.
- Acervo baixado de literatura enxadristica: os livros classicos e artigos open-access devem orientar
  sequenciamento, formatos de treino e criterios de feedback, nao funcionar como banco bruto de texto,
  diagramas ou problemas copiados. Ver `docs/pedagogy/plano-pedagogico-acervo-baixado-2026-06-09.md`.

Apps e escolas digitais estudados como padroes abstratos:

- Chess.com/Chessable: repeticao espacada, cursos, MoveTrainer e ecossistema fechado.
- Aimchess: diagnostico por partidas e planos personalizados.
- Noctie/Dr. Wolf: coach contextual e feedback mais conversacional.
- ChessTempo/Listudy/Chessdriller: treino focado, repeticao e ferramentas mais abertas.
- Lichess: base principal de recursos gratuitos, oficiais e auditaveis.

Aprendizado principal: os melhores produtos reduzem decisao e repetem o erro certo. O risco dos apps
pagos e transformar estudo em colecao de conteudo ou gamificacao. O app deve ficar do lado de rotina,
evidencia e sobriedade.

## O Que Ja Esta Bom

- O loop Signal -> Weakness -> Plan existe e e testado em dominio puro.
- O app ja preserva privacidade: sem PGN completo persistido, sem tokens em backup, sem scraping.
- O catalogo Lichess ja diferencia recursos oficiais, videos diretos, estudos aprovados e rejeitados.
- A tela Hoje ja mostra proposta de fase, metas acumuladas e feedback por bloco.
- O app ja evita repetir aula fixa quando deve passar para puzzle variado.

## O Que Ainda Pode Melhorar

- Detector ainda e raso para causas posicionais. Sem engine e sem PGN persistido, ele nao sabe
  profundamente por que uma posicao foi perdida.
- Progresso por tema ainda depende de puzzle activity/dashboard quando OAuth existe. Sem isso, o app
  usa feedback manual e tempo.
- Nao ha modelo robusto de dominio conceitual por sub-habilidade, como "garfo com distrator" versus
  "garfo em dois lances".
- Ainda falta um painel dedicado de Progresso separado de Hoje.
- A eficacia do app precisa ser validada em uso real: clareza, consistencia, acerto por tema e, so
  depois, rating como indicador secundario.

## Protocolo De Validacao Pessoal

Validar por ciclos, sem promessa de rating.

- Baseline: usar o app por 2 semanas com sessoes reais.
- Checkpoint 6h: revisar se a tarefa diaria ficou clara e se o aluno voltou ao app.
- Checkpoint 12h: comparar feedback `hard/good/easy` e primeiros resultados de puzzles.
- Checkpoint 24h: decidir se o foco da fase precisa mudar.
- Indicadores bons: menos duvida sobre o que estudar, mais sessoes concluidas, mais acerto em temas
  treinados, menos repeticao mecanica, mais revisao de erro real.

## Politica De Promessa

Permitido:

- "Vamos medir se os sinais melhoraram."
- "Este e o foco mais provavel para agora."
- "Depois do checkpoint, ajustamos."

Proibido:

- Prometer subir rating.
- Diagnosticar causa como certeza quando a evidencia e fraca.
- Usar progresso de tempo como prova de dominio.
- Recomendar lance durante partida ao vivo.

## Fontes Principais

- Spacing e retrieval: https://www.nature.com/articles/s44159-022-00089-1
- Retrieval practice em sala: https://link.springer.com/article/10.1007/s10648-021-09595-9
- Worked examples e carga cognitiva: https://www.sciencedirect.com/science/article/pii/S0361476X1000055X
- Pratica deliberada no xadrez: https://doi.org/10.1002/acp.1106 e https://doi.org/10.1177/0963721411421922
- Sistemas recomendadores educacionais: https://arxiv.org/abs/2407.09500
- Playbook interno: `docs/pedagogy/lichess-study-plan-playbook.md`
- Plano pedagogico a partir do acervo baixado:
  `docs/pedagogy/plano-pedagogico-acervo-baixado-2026-06-09.md`
- Catalogo curado Lichess: `docs/research/relatorio-antigravity-curadoria-lichess-professor-lemos-2026-06-08.md`
