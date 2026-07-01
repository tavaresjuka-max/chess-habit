# Decisoes

## 2026-06-06: Projeto Separado

Decidido criar `lichess-tutor` separado do app pago anterior. Motivo: evitar confusao de escopo, conteudo, nome, dados e arquitetura.

## 2026-06-06: Lichess-first

O app sera construido ao redor do Lichess por ser aberto, gratuito, documentado e alinhado ao modelo do produto.

## 2026-06-06: PWA Com Sync — REVISADA em 2026-06-06

**Original:** O produto deve funcionar em computador e mobile. PWA foi escolhida como primeira distribuicao. Sync entre dispositivos exige backend minimo.

**Revisao do Diretor Geral:** Sync e backend adiados para Fase 2. MVP Fase 1 sera PWA local-first sem backend. Sync permanece como objetivo de longo prazo.

## 2026-06-06: Gratuito E Aberto

Modelo definido: gratuito. Open-source/AGPL era o plano original; SUPERSEDIDO em 2026-06-30 por app proprietario/codigo fechado, doacao externa e sem recurso pago funcional.

## 2026-06-06: Sem Tabuleiro Proprio No MVP

O MVP nao deve repetir a dificuldade mecanica do app anterior. O treino abre no Lichess; o tutor organiza, mede e orienta. **Mantido e reforcado.**

## 2026-06-06: Governanca Multi-IA Da Auditoria Global

Decidido que Claude sera o Diretor Geral da auditoria estrategica: ele consolida os relatorios, arbitra divergencias e emite diretivas. Codex sera o Executor: realiza apenas tarefas claras, pequenas e verificaveis, sempre subordinado ao `AGENTS.md`. DeepSeek e Gemini serao Consultores: suas analises entram como insumo critico, mas nao tem autoridade final.

Essa governanca vale especialmente para os relatorios do fluxo `global-strategic-audit`. Nenhuma IA pode aprovar implementacao, app, backend, banco, `package.json`, `src` ou dependencias enquanto a fase de implementacao nao estiver formalmente aprovada.

## 2026-06-06: Consolidacao Do Diretor Geral

Apos receber os relatorios Codex e Antigravity, o Diretor Geral (Claude) emitiu:

### Decisao 1: Renomeacao Obrigatoria
Nome publico "Lichess Tutor" rejeitado. Nome de trabalho interno mantido. Novo nome sera escolhido via experimento na Fase 0.

### Decisao 2: MVP Local-First Puro
MVP sem backend, sem OAuth, sem sync, sem Chess.com. PWA com IndexedDB, regras locais, username Lichess opcional, foco 0-1200.

### Decisao 3: Fase 0 de Validacao
Nenhum codigo antes de validar: experimento de nome, landing page, 20 entrevistas, piloto manual com 10 usuarios, prototipo Figma.

### Decisao 4: Arquitetura em Tres Fases
Fase 0 (validacao sem app) → Fase 1 (MVP local-first) → Fase 2 (sync + OAuth + Chess.com) → Fase 3 (expansao 1200-2000, i18n).

### Decisao 5: Professor Lemos Como Tom
No MVP, Professor Lemos e tom de voz (microcopy), nao promessa de tutor ou personagem central. Expansao futura se usuarios responderem bem.

### Decisao 6: Chess.com Adiado
Importador Chess.com movido para Fase 2+. Foco total em Lichess.

### Decisao 7: Sem Tabuleiro Proprio Mantido
Reafirmado e permanente para Fase 1.

Fonte: `docs/review/relatorio-claude-diretor-geral-consolidado-2026-06-06.md`

## 2026-06-06: Decisao Do Dono — Moldura Pessoal-Primeiro (SUBSTITUI parte da consolidacao acima)

Apos receber tres relatorios revisando o spec unificado (Codex "Spec em Xeque", Claude/DeepSeek
consolidacao, Antigravity), o **dono** esclareceu que isto e, antes de tudo, uma **ferramenta pessoal**
para ele estudar no Lichess, a ser compartilhada com a comunidade apenas depois, se ficar boa.

Decisao: adotar a moldura **pessoal primeiro, comunidade depois**.

Consequencias que substituem decisoes anteriores:

- **A "Fase 0 de validacao de mercado" (entrevistas, landing, waitlist, piloto manual) NAO se aplica
  a ferramenta pessoal.** O dono e a propria validacao. Esse frame fica reservado para a versao-
  comunidade (Fase P5). (Substitui a Decisao 3 da consolidacao para o escopo pessoal.)
- **A fase de codigo foi aberta pelo dono.** Codigo permitido em `lichess-tutor`.
- **Escopo adaptativo e multi-fonte aprovado, porem faseado:** Lichess (P1), adaptacao (P2), sync (P3),
  Chess.com leve (P4). (Atualiza as Decisoes 2 e 6 da consolidacao: nao sao cortados, sao faseados.)
  **Nota posterior:** roadmap revisado apos P0: Chess.com ficou P1, Study/OAuth P3 e sync P4.
- **Renomeacao e OAuth ficam para a Fase P5 (comunidade).** Na ferramenta pessoal (um usuario), nome
  interno basta e nao ha OAuth. **Nota posterior:** a parte de OAuth foi substituida pela decisao
  "OAuth Permitido Pelo Dono Para Evolucao Futura" abaixo; renomeacao publica continua em P5.

Correcoes tecnicas/legais dos tres relatorios **aceitas integralmente**:

- Clean-room: app novo do zero; proibido herdar codigo/assets de `chessking-tutor`/`chessking-assets`.
- ChessKing **nao** e fonte nem taxonomia no app; estudo externo vira fonte generica "outro" (texto livre).
- Tipos estritos (sem `value: unknown`; union discriminada por `kind`).
- Sync por registro (timestamp por item, preserva `done`), adiado para depois do valor; D1 preferido a KV.
- Slugs de tema do Lichess validados dinamicamente.
- Erro/offline/migracao especificados.
- Linguagem de fraqueza como hipotese; sem promessa de rating.

Spec de execucao vigente: `docs/superpowers/specs/2026-06-06-rotina-pessoal-adaptativa-design.md`.
ADRs: ADR-004 (pessoal-primeiro), ADR-005 (clean-room/sem ChessKing), ADR-006 (revisado: OAuth
opt-in para Study, sem engine/escopos de jogo), ADR-007 (sync depois do valor, por registro). Spec
unificado anterior: superseded.

## 2026-06-06: Banda E Chess.com Antecipado

- Banda inicial do dono confirmada: **800-1200** (tema fixo de P0 = `fork`).
- O dono joga no Chess.com (amigos la). Decisao: **Chess.com promovido a fonte primaria de
  diagnostico e antecipado para P1**, com uso mais completo da API publica (`/stats` + arquivos
  mensais recentes de partidas), nao so o snapshot `/stats`. Parse de PGN transiente; guardar so
  sinais derivados; nunca PGN completo; sem PII de perfil; historico completo serial/cacheado. Recencia e peso/utilitario opt-in, nao cutoff fixo.
  Destinos de treino seguem no Lichess. Lichess vira fonte de diagnostico secundaria (P2). Ver ADR-008.
- Rodada 2 de revisao (Codex, Antigravity, DeepSeek): convergiu, aprovado com correcoes ja aplicadas
  no spec (Adendo 22). Plano P0 atomico escrito. Nao e necessaria nova rodada de debates para iniciar.

## 2026-06-06: OAuth Permitido Pelo Dono Para Evolucao Futura

O dono decidiu: **"vamos usar oauth sim"**. A P0 permanece sem rede/OAuth, mas a decisao remove a
restricao anterior como direcao de produto futura. Reconciliacao aplicada em `AGENTS.md`, `PLANO.md`,
ADR-006 e spec: OAuth PKCE e opt-in, restrito a `study:write` para Study e `puzzle:read` para
reconciliar puzzles, tokens somente locais, sem escopos de jogo e sem ajuda durante partidas ao vivo.

## 2026-06-06: Ajuste Do Signal De Cor Para P1

Durante a implementacao P1, o contrato `SignalValue.kind === 'color'` foi ajustado para incluir
`games`. Motivo: o Adendo 22.2 exige minimo de partidas para disparar a hipotese de desequilibrio
entre brancas e pretas; sem `games`, o detector teria que adivinhar frequencia ou persistir sinais
por partida. O app continua persistindo apenas sinais derivados, nunca PGN completo.

## 2026-06-06: Puzzle Activity Como Leitura Opt-In

O dono pediu que concluir um treino tente salvar como foi o resultado do exercicio no Lichess. A API
oficial exige OAuth `puzzle:read` para `/api/puzzle/activity`. Decisao: permitir `puzzle:read` como
escopo opt-in minimo de leitura para reconciliar resultado de puzzles, sem `puzzle:write`, sem escopos
de jogo, sem engine, sem token em logs/export/bundle. Enquanto OAuth nao estiver ligado, o app salva
timer/log local (`startedAt`, `completedAt`, `elapsedSeconds`) e pode reconciliar depois.

## 2026-06-06: P3 Fechada E P4/P5 Congeladas

O dono pediu para fazer tudo ate P3 completo e congelar P4/P5. Decisao aplicada:

- P0-P3 ficam como escopo atual da ferramenta pessoal.
- P4 (sync PC<->celular, backend/D1, merge por registro e texto livre "outro estudo") fica congelada.
- P5 (versao-comunidade, renomeacao publica, disclaimers publicos, i18n, polish e revisao publica)
  fica congelada.
- Study gerado em P3 e privado por padrao. Estudo publico/seguivel para outros usuarios e assunto de P5,
  nao da ferramenta pessoal atual.
- Escopos OAuth ativos no app pessoal: `puzzle:read` e `study:write`; sem escopos de jogo, sem
  `puzzle:write`, sem mensagens, sem engine.

## 2026-06-08: Licao Guiada Nao Deve Repetir Todo Dia

Uso real mostrou que o foco fixo `fork` na faixa 800-1200 fazia o app abrir a mesma licao guiada do
Lichess Practice em dias diferentes. Decisao: o plano novo deve consultar o plano anterior salvo como
memoria de progresso, e feedback `good` depois de `guided` avanca para `retrieval`. Assim a rotina
passa para puzzle theme variado (`/training/fork`) em vez de repetir o mesmo Practice estatico; `hard`
continua voltando para explicacao.

## 2026-06-08: Professor Lemos Etapa 1 Fica No Envelope De Sessao

Decisao operacional aplicada a partir do plano `2026-06-08-professor-lemos-tutor-etapa1.md`:
Professor Lemos entra primeiro como envelope de sessao na tela Hoje, nao como chat livre nem analise
lance a lance. O dominio usa funcoes puras sem rede/React: constancia, mensagem de sessao e diagnostico
agregado travado por evidencia. O retorno apos ausencia, nesta etapa pre-treino, e definido por
`daysSinceLastSession >= 2`. Diagnostico por tema de puzzle via `puzzle:read` fica para plano proprio
de Etapa 2.

## 2026-06-08: Filtros De Video Do Lichess Nao Sao Tarefa Concreta

Uso real mostrou que links como `https://lichess.org/video?tags=beginner%2Ftactics` ainda deixam o
aluno numa pagina de busca/lista. Decisao: o app nao gera mais destinos `/video?tags=...`; quando
usar video, deve ser aula direta `/video/:id`. Para explicacao de taticas, preferir Practice especifico
do tema. Planos salvos com filtro generico de video sao normalizados pelo `weaknessTag`.

## 2026-06-08: Adaptacao Acontece Na Proxima Sessao, Historico Feito Nao E Reescrito

Uso real mostrou que o app parecia nao atualizar e, ao mesmo tempo, podia reescrever o bloco ja feito
quando regenerava o plano. Decisao: bloco concluido e historico do que foi feito e deve ser preservado
como estava. A adaptacao por feedback aparece no proximo bloco/sessao/dia. Se uma explicacao do tema
ja foi marcada como dificil, a proxima sessao troca para treino variado do tema em vez de repetir a
mesma licao guiada.

Tambem fica decidido que o Professor Lemos deve explicitar fallback: quando nao ha fraquezas reais
salvas, o card diz que o plano e inicial e precisa de Chess.com/Lichess atualizados para calibrar.
Quando houver resultado real de puzzles reconciliado com `themeStats`, o diagnostico por tema pode
vir antes do agregado; sem volume minimo, continua perguntando.

Complemento da mesma decisao: a pergunta do Lemos deve ser acionavel. As respostas `Tempo`,
`Calculo` e `Peca solta` viram sinais manuais locais (`time-trouble`, `fork` como proxy de calculo
tatico curto, `hanging-piece`) sem apagar outros sinais `source:'outro'`. Isso mantem a trava de
evidencia: o app registra a percepcao do aluno como hipotese, nao como fato engine.

## 2026-06-08: Curadoria Lichess E Diretrizes De Conteudo E Copyright

Apos auditoria profunda realizada por Antigravity (`docs/research/relatorio-antigravity-curadoria-lichess-professor-lemos-2026-06-08.md`), ficam decididas as seguintes regras de conteudo para o catalogo de recursos:

1. **Rejeicao Estrita Por Copyright:** Qualquer estudo comunitario que adapte, transcreva ou reproduza livros de xadrez protegidos por direitos autorais (como o estudo de finais de peao adaptado de Paul Keres em `/study/dXKWlrkg`) sera descartado do catalogo ativo e catalogado como "rejeitado" para preservar a integridade clean-room do projeto.
2. **Rejeicao Por Baixa Qualidade Pedagógica:** Recursos desorganizados, sem explicacoes claras ou com foco promocional/juvenil (como `/study/izZ71JC2`) sao marcados como valor D e descartados.
3. **Novas Fontes De Elite Aprovadas:** A serie "Endgames You Must Know!" do autor NoseKnowsAll (do iniciante ao avancado) e o "Table of Contents" do autor jomega sao aprovados e incorporados como recursos pedagogicos comunitarios de altissimo valor para suprir a falta de ferramentas interativas nativas do Lichess em finais avancados.
4. **Validacao De Vídeos:** Confirmado que o Lichess utiliza o proprio ID do Youtube como rota dos videos em `/video/:id`. Os IDs `-OoPm17P8xA` (Alex Astaneh - calculo) and `uhQhasudq9M` (Kostya Kavutskiy - mate) foram verificados como ativos e integrados a biblioteca oficial, resolvendo a ambiguidade de links quebrados.

## 2026-06-09: Metodologia e Currículo da Onda 2 (DAMP, Woodpecker, de la Villa, Aagaard) [parcialmente supersedida pelos convertidos]

Após a análise pedagógica executada por Gemini em `analise-acervo-ONDA2-GEMINI.md`, foram tomadas as seguintes decisões para a escada e os blocos de treino:

1. **[SUPERSEDIDO em 2026-06-09 pelos convertidos] Ritual DAMP em PT-BR para Nível 600-1200:** a proposta original do relatório Gemini tratava DAMP como ritual de segurança; a decisão vigente posterior corrigiu DAMP para **Defesa, Alinhamento, Mobilidade, Promocao** como deteccao tatica.
2. **Método Woodpecker de Repetição Cíclica:** Adotar o formato de drill **Ciclo Woodpecker** para tática intermediária (1000-1800): o aluno repetirá um pool fixo de puzzles errados/reconciliados visando reduzir o tempo em 50% a cada ciclo até atingir reações intuitivas e subconscientes.
3. **Progressão Enxuta de Finais de de la Villa:** O currículo de finais será enquadrado no pool das posições essenciais práticas do livro *100 Endgames You Must Know* (Jesus de la Villa) e do clássico em PT-BR *Técnicas de Finais em Xadrez* (Euwe & Hooper).
4. **Cálculo Avançado de Kotov e Aagaard (1400+):** A faixa de cálculo profundo adotará a disciplina de listar lances candidatos e calcular ramificações de forma serial sem desvios, com foco na profilaxia ativa (resposta mais forte do oponente).
5. **Redundâncias Descartadas:** Cerca de 30% da Onda 2 (manuais genéricos "Chess for Beginners" rasos auto-publicados) foi arquivada para poupar espaço.
6. **Implantacao Etapa 2B:** jomega entra no catalogo ativo apenas como `needs-human-review`. Na checagem de link da implementacao, `Iof6LzcT`, `s3iOCawc`, `6JAUFQ5p` e `wzFrgluQ` responderam `200`; `g6vPzJv7` e `q9bJ8YdY` responderam `404` e nao devem ser usados.

## 2026-06-08: Catalogo Premium Lichess Com Sinais Agregados De Puzzle

Decisao: evoluir o catalogo estatico para uma camada premium local-first, sem abrir P4/P5.

- `WeaknessTag` continua estavel; sub-habilidades vivem em `CatalogSkillNode` e mapeiam temas oficiais
  de puzzle, estagios, duracoes, faixas e recursos curados.
- A selecao de destino passa por `selectLichessResource`, que considera faixa, estagio, minutos,
  `PuzzleThemeStats` recentes e recursos ja concluidos. `getDestinationForWeakness` fica como wrapper
  compativel.
- Puzzle Dashboard e Puzzle Replay entram somente via OAuth opt-in `puzzle:read`. Dashboard salva
  agregados por tema; Replay descarta IDs imediatamente e salva apenas `theme`, `days`, `nb`,
  `remainingCount` e `/training/{theme}` como destino publico seguro.
- Estudos comunitarios `needs-human-review` nunca devem superar recurso oficial equivalente; recursos
  `rejected` seguem fora do catalogo ativo.
- Sem `puzzle:write`, Board API, Bot API, Challenge API, engine, mensagens, escopos de jogo, PGN
  persistido, solucoes de puzzle, transcript ou comentario de estudo.

## 2026-06-08: Fechamento Do Dia Depois De Todos Os Blocos

Uso real mostrou que marcar todos os blocos como feitos deixava a tela sem um encerramento claro.
Decisao: quando todos os blocos do plano do dia deixam de estar `pending`, a tela Hoje mostra um
cartao de fechamento objetivo com resumo de progresso local: blocos feitos, tempo registrado,
feedback do dia, resultado real de puzzles apenas se ja estiver reconciliado e a proxima sessao do
roadmap. O cartao usa tom adulto ("Dia concluido. Bom trabalho.") em vez de motivacional vazio e nao
abre novas APIs nem persiste dados novos.

## 2026-06-09: Abertura Externa So Depois De Persistir Log

Para fechar a fase pessoal pos-P3 sem pendencia de navegacao externa, o clique em treino Lichess deve
aguardar `onStartBlockTraining` salvar o log local antes de chamar a abertura externa. Reabrir bloco
feito continua sem recriar log ativo. Essa decisao nao abre P4/P5 e nao adiciona rede, engine,
escopos OAuth ou dados persistidos novos.

## 2026-06-09: Abertura Do Lichess Nao Deve Tirar O Aluno Da Tela Do Lemos

Uso real mostrou que `window.open(..., "noopener,noreferrer")` podia abrir uma nova aba e ainda assim
retornar `null`; o app interpretava isso como popup bloqueado e chamava `window.location.assign`,
carregando o Lichess tambem na aba atual. Decisao: treino externo nunca deve navegar automaticamente a
aba atual. O app salva o log local, tenta abrir nova aba, corta `opener` quando houver handle e, se a
aba for bloqueada, mostra aviso mantendo a tela do Lemos aberta.

Complemento: se um bloco guiado de garfos ja tiver log local de abertura, mesmo ainda `pending`, isso
conta como exposicao suficiente para reparar plano salvo antigo e trocar o proximo destino para
`https://lichess.org/training/fork`.

## 2026-06-09: Practice Fixo Nao Repete Sem Feedback

Uso real mostrou que a licao guiada `The Fork` podia repetir em dias seguidos quando o bloco anterior
ficava sem feedback, mesmo que o dono ja tivesse aberto/feito o treino no Lichess. Decisao: Practice
fixo e primeira exposicao; se o mesmo tema guiado ja apareceu em plano anterior, o proximo plano usa
`retrieval` com puzzle theme variado (`/training/fork`) mesmo sem feedback explicito. Feedback explicito
continua tendo prioridade. Sem API nova, sem scraping, sem armazenar puzzle IDs/PGN/solucoes.

## 2026-06-09: DAMP Corrigido E Integrado Ao Metodo Consolidado

Leitura direta dos livros convertidos prevalece sobre a interpretacao provisoria da analise ONDA 2 do
Gemini. Fica decidido:

- **DAMP = Defesa, Alinhamento, Mobilidade, Promocao** (Duarte & Lapertosa), em PT-BR.
- DAMP entra como **checklist de deteccao tatica** dentro de `stage: tatica`, na familia
  "detectar-antes-de-calcular".
- DAMP **nao** e ritual de seguranca, **nao** substitui LPDO/Heisman e **nao** substitui CCT/Hertan.
- A proporcao-base de treino do GM Rafael Leitao pode ser usada pelo gerador como ponto de partida
  elastico, sempre reponderado por fraqueza local e tempo disponivel, nunca por rating.
- `Manual de Aberturas` (Lazzarotto) entra como referencia PT-BR de principios e vocabulario, nao como
  repertorio pronto; `Fundamentos do Xadrez` (Capablanca, PT-BR) entra como influencia de fundamentos e
  finais; `Movimento Forcado` (Murray) fica restrito a calculo 1200+ como banco de exercicios, nao como
  metodo completo.

## 2026-06-09: Professor Lemos Introduz O Conceito Antes Da Aula

Uso real mostrou que abrir um treino de garfos sem uma introducao deixava o exercicio mecanico demais.
Decisao: quando o bloco principal do dia for garfos, seja aula guiada ou puzzles variados, a nota do
Professor Lemos deve explicar em linguagem simples o que e um garfo, por que ele importa, quais pecas
podem dar garfo (cavalo, bispo, peao, dama) e que o objetivo do treino e aprender a ver e preparar esse
padrao alguns lances antes. O texto deve ser curto, simples e adequado a um aluno jovem/iniciante, sem
termos dificeis nem promessa de rating.

## 2026-06-09: Aquecimento Abre Com Saudacao Simples Do Lemos

Uso real pediu que o aquecimento nao fosse apenas uma tarefa seca. Decisao: o bloco de aquecimento
deve abrir com uma saudacao curta ("que bom ver voce novamente") e um convite simples para ativar o
cerebro antes do treino. O texto deve lembrar que aquecimento nao e prova de velocidade: olhar o
tabuleiro inteiro, procurar pecas soltas e seguir com calma. Sem infantilizar, sem promessa de
resultado e sem termos dificeis.

## 2026-06-09: Lemos Deve Propor Uma Fase Antes Do Treino

Uso real mostrou que o aluno abria a tela Hoje sem entender para onde o treino ia levar, quanto tempo
a primeira fase poderia levar ou quando haveria reavaliacao. Decisao: antes da lista de blocos, a tela
Hoje mostra uma proposta local do Professor Lemos com: "entendi o que voce precisa", foco da primeira
fase, itens que serao treinados, estimativa de horas/sessoes, checkpoint de revisao e botoes para
aprovar ou pedir revisao. A estimativa e explicitamente uma janela de treino, nao promessa de rating.

A resposta (`approved` ou `revision-requested` com nota livre) fica persistida no plano local do dia e
e preservada se o plano for regenerado no mesmo dia. Nao ha nova API, backend, scraping, engine,
escopo OAuth, P4/P5 ou dado sensivel novo.

## 2026-06-09: Metas Acumuladas Por Sessoes E Horas

Uso real pediu uma visao mais clara de fase: primeiras horas concluidas, progresso por sessoes e
estatisticas do que melhorou. Decisao: a tela Hoje deve mostrar um cartao local de metas da fase com
checkpoints em 6h e 12h, primeiro ciclo em 24h e ciclos seguintes de 24h. O metodo mede horas e
sessoes concluidas a partir dos logs locais, sem prometer rating.

As estatisticas exibidas podem usar feedback local e resultados de puzzles reconciliados pelo Lichess
quando existirem. Logs diagnosticos de Puzzle Dashboard/Replay entram nas estatisticas de puzzles, mas
nao contam como sessao treinada nem como hora treinada. A tela carrega historico completo de logs para
o painel acumulado, mantendo a geracao do plano do dia baseada apenas nos logs do dia.

## 2026-06-09: Metodo Do Professor Lemos Deve Ser Explicito

Uso real e revisao estrategica pediram clareza sobre como o app decide o que estudar, como mede
progresso e qual e a base pedagogica. Decisao: o metodo canonico fica documentado em
`docs/pedagogy/metodo-professor-lemos.md` e a tela Hoje deve mostrar, dentro da proposta de fase,
o resumo do metodo, nivel de confianca da evidencia e criterios de progresso.

O metodo e assumido como classico nos fundamentos (pratica deliberada, recuperacao ativa, repeticao
espacada, exemplos guiados, feedback e transferencia) e inovador na orquestracao local-first de
recursos Lichess/Chess.com. Proibido prometer rating: o app mede sinais, habito, feedback e resultados
de puzzles quando existem. Sem nova API, backend, engine, scraping, escopo OAuth, P4/P5 ou dado
sensivel novo.

## 2026-06-09: Biblioteca De Literatura De Xadrez So Baixa Fonte Legal Clara

Pedido do dono abriu a fase 1 de uma grande biblioteca de livros, teses, artigos e metodos de ensino
de xadrez. Decisao: downloads locais so podem incluir dominio publico claro, Project Gutenberg/espelho,
Creative Commons ou open access com PDF/licenca identificavel. Material pago, preview, borrow, CDL,
assinatura, upload moderno suspeito ou licenca incerta entra em lista de compra/revisao, nao em
download. Os arquivos baixados ficam em `output/chess-literature-library/files/` fora do Git; manifestos
com URL, licenca, tamanho e SHA-256 ficam em `docs/research/chess-literature/manifests/`.

## 2026-06-09: Pesquisa Profunda De Literatura — 5 Frentes Concluidas

A pesquisa em 5 frentes foi executada e consolidada. Decisoes resultantes:

1. **Metodo proprio sera sintese original, nao copia.** A sequencia de 9 blocos para 0-1200 e
   abstracao de padroes comuns observados em 17 metodos mapeados, sem copiar exercicios, textos
   ou conteudo proprietario de nenhum metodo. `docs/research/method_synthesis.md` registra os
   10 principios pedagogicos e 8 anti-padroes que guiam a implementacao.

2. **Spaced repetition e interleaving sao candidatos prioritarios de implementacao.** A evidencia
   na psicologia cognitiva geral e forte; a aplicacao ao xadrez e por extrapolacao razoavel.
   O Woodpecker Method (compra Prioridade A) e um exemplo de spaced repetition aplicado a tacticas.

3. **Sinais de progresso sem prometer rating.** O app mede taxa de acerto em puzzles por tema,
   reducao de blunders, tempo de resolucao e capacidade de nomear erros. Rating e consequencia,
   nao causa. Comunicar confianca (1-5 estrelas) em vez de "rating estimado".

4. **Compra prioritaria definida.** ~€360-400 em itens Prioridade A para aprofundar o metodo:
   Steps Method completo (€99.95), Yusupov Fundamentals (€69.95), Woodpecker Method (€34.99),
   How to Study Chess (€24.95), Silman Complete Endgame Course (~€27.95). Material pago e para
   leitura e pesquisa pessoal; nao pode ser copiado para o app.

5. **O metodo e hipotese, nao verdade comprovada.** A sequencia de 9 blocos e a sintese dos
   principios sao inferencia a partir de evidencia externa e consenso entre metodos. O metodo
   precisa ser validado com uso real (dono = n=1). Tratar como parametrico e configuravel.

## 2026-06-09: Acervo Baixado Entra Como Pedagogia, Nao Como Banco Bruto

A primeira leitura aplicada dos livros e artigos baixados foi consolidada em
`docs/pedagogy/plano-pedagogico-acervo-baixado-2026-06-09.md`.

Decisao: o acervo deve orientar sequenciamento, formatos de treino e criterios de feedback do
Professor Lemos, mas nao deve ser copiado para dentro do app como texto, diagrama, problema ou lista
de variantes. A ordem pedagogica recomendada para 0-1200 e: fundamentos claros; seguranca material;
mates e finais-modelo; calculo tatico por recuperacao ativa; aberturas como principios; planejamento
simples; transferencia para partidas reais encerradas.

Livros de abertura antigos, tabelas longas, notacao arcaica, colecoes historicas sem curadoria e
problemas compostos sem pipeline de direitos ficam fora do MVP. Eles podem informar pesquisa e
catalogacao futura, desde que cada reutilizacao direta passe por ficha de fonte e licenca.

## 2026-06-10: Integração de Metacognição Científica e Milestones baseados em Diplomas (Onda 3)

A análise do lote de downloads (Conjunto A) e da Onda 3 (Conjunto B) introduziu três diretrizes pedagógicas de alto impacto no `lichess-tutor`:

1. **Tratamento de Pendências e Autorreflexão**: O estudo de Gevorgyan (2024) comprovou que a autorreflexão e estudo específico sobre exercícios e tarefas não resolvidos tem a maior correlação estatística ($r=0.29$) com o avanço enxadrístico, seguido pela justificação verbal da lógica ($r=0.18$). Adota-se o formato de treino **Tratamento de Pendências** (Christofoletti 2007) para que o jogador re-resolva ativamente seus próprios erros locais e puzzles falhados.
2. **Milestones baseados em Diplomas**: Em vez de depender de rating para medir avanço, adota-se a estrutura brasileira de Tirado & Silva (1999) baseada em 3 marcos claros de avaliação teórica: **Diploma do Peão** (0-600), **Diploma da Torre** (600-1000) e **Diploma do Rei** (1000-1200), que servem como travas didáticas no gerador de planos para consolidar as bandas de aprendizagem de forma estruturada.
3. **Restrição de Motores (Engines)**: Conforme Zorić (2025), engines como Fritz/Stockfish devem ser tratados puramente como ferramentas de apoio e preparação do instrutor (ou do gerador interno do app), sendo desencorajados como parceiros ou juízes diretos de treino do estudante, priorizando o Lichess Study interativo.

## 2026-06-10: Decisoes Pos-Analise Geral (confirmadas pelo dono)

1. **Teto do curso: 0→2200, faixa 2200+ = autonomia.** "3000" era numero informal; o curso
   ensina ate o aluno nao precisar mais do app. Atualizar PLANO.md e project.md para alinhar.
2. **Meta escondida: marcos elasticos da literatura, nao numero fixo.** Marcos: 100h, 500h,
   1.000h+ com metas semanais/mensais visiveis. Base: Charness et al. (2005) e Campitelli &
   Gobet (2011) — "30 mil horas" descartado.
3. **Gamificacao aprovada como incentivo positivo puro.** Badges por esforco e habito (horas,
   puzzles, constancia), nunca por rating, nunca gerando ansiedade ou tristeza, sem streak
   punitivo. Spec detalhada obrigatoria antes de implementar qualquer badge.
4. **Sync multi-dispositivo e intencao declarada para P4.** As mitigacoes locais de dados
   (storage.persist + export automatico) tem prioridade maxima — devem entrar antes de
   qualquer feature nova da visao. P4 permanece congelada mas e a proxima grande fase apos
   R-1 mitigado. Schema Dexie deve considerar merge-key por registro desde ja.

## 2026-06-10: Visao Do Dono Registrada E Rodada De Debate Da Analise Geral

O dono declarou a visao de longo prazo (curso completo 0->topo, placement por questionario +
historico Lichess/Chess.com, pesquisa pedagogica continua, plataforma colaborativa futura, UX
familiar Lichess/Chess.com, gratis com doacao, recompensa por ESFORCO e horas — nunca rating,
treinador que analisa cada sessao e explica a proxima, botao de importar atividade livre,
painel amplo de progresso). Decisoes aplicadas:

- A visao fica registrada como documento canonico em `docs/VISAO.md`. Ela orienta direcao,
  mas so vira escopo ativo por decisao explicita registrada aqui. P4/P5 continuam congeladas.
- Analise geral profunda do projeto contra a visao: `docs/review/relatorio-claude-analise-geral-2026-06-10.md`
  (6 erros/staleness, 6 contradicoes/ambiguidades, risco critico R-1 de perda de dados em
  IndexedDB, 11 lacunas, 8 cortes priorizados).
- Correcoes de staleness aplicadas no mesmo dia: README reescrito (dizia que nao havia
  codigo), `memory/state.md` atualizado (metodo concluido, nao "iniciado"), numeracao duplicada
  da secao Onda 2 corrigida neste arquivo.
- Rodada de contestacao aberta: prompts em `prompts/analise-geral-2026-06-10/` para DeepSeek,
  Gemini e Codex gerarem relatorios nomeados em `docs/review/`. Implementacao apenas depois da
  contra-argumentacao do Claude e arbitragem final.
- ~~Pendentes de decisao do dono apos o debate~~ (nota stale corrigida em 2026-06-10): C-1,
  C-2 e C-3 foram fechadas na secao "Decisoes Pos-Analise Geral" acima (itens 1-3). A-3, A-4 e
  A-6 foram fechadas na rodada 2 pos-arbitragem (ver secao "Decisoes da Rodada 2" abaixo).

## 2026-06-10: Organizacao Pos-Metodo

Para reduzir ruído operacional depois da implementação do Metodo Professor Lemos:

- Prompts executados da rodada de pesquisa/planejamento/implementacao ficam arquivados em
  `prompts/archive/2026-06-method/`.
- `prompts/` fica reservado a prompts ainda reutilizaveis de auditoria e handoff.
- Relatorios e sinteses ficam em `docs/research/`; documentos canonicos de ensino ficam em
  `docs/pedagogy/`.
- Scripts de download/conversao/auditoria de acervo ficam em `scripts/research/`, fora do runtime do app.
- Downloads, caches, PDFs e colecoes pessoais permanecem fora do Git por higiene e direitos autorais.

## 2026-06-10: Decisoes da Rodada 2 (pos-arbitragem das contestacoes)

Apos a arbitragem dos tres relatorios de contestacao
(`docs/review/relatorio-claude-arbitragem-contestacoes-2026-06-10.md`), o dono respondeu a
todas as perguntas pendentes e travou as seguintes decisoes:

1. **Sequencia de cortes aprovada como esta**: 0 Higiene → 1 Data Safety v1 → 2 Spine 0-2200 →
   3 Placement v1 → 4 Relatorio pos-sessao → 5 Painel Progresso MVP → 6 Importacao de
   atividade livre → 7 Badges (spec em paralelo desde os cortes 1-3) → 8 Curriculo denso.
2. **LICENSE AGPL-3.0 confirmada** (A-6 fechado). Copyright holder: **Juka Tavarez**.
   O argumento do DeepSeek para adiar foi rejeitado (a clausula 13 da AGPL cobre SaaS).
3. **Comunicacao publica "0→autonomia"** aprovada; 2200 fica apenas como referencia interna
   de sequenciamento do modelo de bandas. Refina o C-1 sem alterar o teto tecnico.
4. **Trilha paralela de validacao de eficacia aprovada**: registrar baseline desde ja
   (acerto por tema-foco, blunders/partida, taxa de conclusao de sessao, tempo ate retorno),
   revisao em ~4 semanas (≈2026-07-08); resultado vira gate do Corte 8. Nao bloqueia cortes.
5. **Execucao autonoma**: Claude executa corte a corte sem checkpoint obrigatorio, parando
   apenas diante de decisao de produto nao coberta pelas decisoes registradas.
6. **Spine com 7 bandas** (Corte 2): 0-400, 400-800, 800-1000, 1000-1200, 1200-1600,
   1600-2000, 2000-2200. Degraus menores no inicio (metas pequenas, TDAH-friendly);
   migracao Dexie divide '0-800' e '800-1200' em duas bandas cada.
7. **Placement v1 = automatico + autorrelato** (Corte 3): com login Lichess, leitura do
   historico de puzzles via escopo `puzzle:read` ja permitido; sem login, deep link
   `/training/<tema>` + autorrelato. Sem tabuleiro proprio, sem novo escopo OAuth.

A-3 fechado: a correcao e ESCREVER o spec de design do metodo 5 trilhas implementado em
`docs/superpowers/specs/` (nao mover arquivo) e atualizar o ponteiro de `AGENTS.md`.
A-4 fechado: ADR-006 recebe adendo/nota, sem renomear arquivo (imutabilidade de ADR).

## 2026-06-11: Primeiro Uso Real No Celular (PWA instalada) E Direcao Visual

App hospedado para uso pessoal em https://rotina-pied.vercel.app (Vercel, noindex,
sem backend; nao descongela P4/P5). Primeiras impressoes do dono no celular:

1. **Direcao visual decidida**: apos a fase de testes pessoais, o dono quer uma passada
   visual intensa com IMAGENS GERADAS POR TERCEIROS de qualidade premium — prompts para
   todas as funcoes, botoes, fundos, badges e Professor Lemos. Os SVGs atuais sao
   provisorios. Restricoes a manter na spec futura: clean-room (nada derivado de marcas),
   licenca compativel com AGPL, e atencao ao tema escuro (raster nao adapta sozinho como
   SVG com tokens).
2. Bugs de uso real corrigidos no mesmo dia: nav estourava a largura no celular
   (Config inacessivel sem arrastar) e textos sem acentuacao em PT-BR.
3. Descoberta: o dono procurou "conectar Chess.com" — nao existe login; e campo de
   usuario na Config + botao Atualizar na Hoje. Hint adicionado na UI.

## 2026-06-13: Badges V1 Aprovados E Auditoria Geral Zerada

O dono declarou: **"BADGE APROVADO"**. Decisao aplicada:

- A spec `docs/superpowers/specs/2026-06-10-badges-spec-draft.md` deixa de ser rascunho e passa a ser
  contrato aprovado do Corte 7 para a ferramenta pessoal.
- V1 aprovada: Retorno de Ouro, Primeira Hora, Tratador de Pendencias, Semana Inteira e Calibrado.
- Badges sao conquistas unicas, exportadas/backupeadas via Dexie, sem ranking, sem badge bloqueado,
  sem streak punitivo, sem som/confete/modal e sem qualquer premio por rating.
- Celebracao permitida: linha sobria no relatorio do dia e exibicao apenas de conquistas ja obtidas na
  tela Progresso.

Na mesma passada, a auditoria Codex de 2026-06-13 realinhou documentacao e gate:

- `docs/architecture/system.md` agora descreve a arquitetura ativa real: PWA local-first sem backend.
  Worker/D1/sync continuam congelados para P4.
- `docs/review/relatorio-codex-auditoria-geral-2026-06-13.md` registra notas por area, achados e
  melhorias futuras.
- Melhorias como fila/cooldown central de API, smoke PWA de producao/offline, ADR sobre
  `vite-plugin-pwa`, validacao profunda de backup e ledger de assets sao backlog tecnico; nao
  descongelam P4/P5 por si mesmas.

## 2026-06-16: Fechamento Codex Cortes M1-M5

- O pacote `prompts/codex-cortes-M1-M5-zerar-pendencias-2026-06-15.md` foi executado em commits
  atomicos M1.1-M5.4, sem push.
- Para M4.3, prevalece a decisao travada do dono: accuracy baixa no Chess.com usa limiar 65 nas
  faixas 0-400 e 400-800, e 70 nas demais. A frase contraditoria do prompt sobre 67 para iniciante
  foi tratada como desvio documentado, nao como nova decisao.
- Para M5.4, `TrainingLog` ganhou `logKind?` opcional (`puzzle`, `free-activity`, `standard`) como
  discriminante estrutural. Nao houve migracao Dexie porque o campo nao e indexado; logs novos gravam
  o discriminante e logs ativos antigos sao enriquecidos no fechamento do bloco.
- CI passa a exigir coverage com thresholds e smoke PWA; pre-commit local usa Husky/lint-staged com
  ESLint e `tsc -b --noEmit`.

## 2026-06-17: Overnight Beta M1 - Harness E2E Com Prints

- M1 usa Playwright como harness E2E local-first: mocks de Chess.com/Lichess cobrem contratos oficiais
  sem rede real, scraping, Board/Bot/Challenge API, PGN persistido ou token em logs.
- Prints ficam em `e2e/__screenshots__/` como evidencia gerada por etapa em desktop e mobile. Neste
  corte, eles nao viram baseline de diff visual bloqueante porque ainda nao ha politica aprovada de
  tolerancia e ambiente.
- O job `smoke` do GitHub Actions roda tambem em `pull_request`, atendendo ao roadmap beta M1.

## 2026-06-17: Finalizar App - Identidade Publica E Fonte AGPL

- `APP_NAME` fica centralizado em `src/config/appIdentity.ts` com placeholder `Rotina` ate o dono
  fornecer o nome publico final; manifest, marca do app, titulo runtime e PGN transitorio de Study
  passam pela constante.
- Como o repositorio local nao tem `git remote`, a UI mostra "Codigo-fonte: URL publica pendente." em
  vez de apontar para um GitHub presumido. A URL real deve ser preenchida em `SOURCE_CODE_URL` antes do
  beta publico.
- Motivo: link falso prejudicaria conformidade AGPL e confianca; a troca ficou em uma constante unica.

## 2026-06-19: Beta Local-First E CSP Com Limite Do Sonner

- O escopo "pronto" desta rodada e beta publico **local-first**, sem backend/sync implementado. P4
  segue como fase seguinte, documentada por contrato E2EE e runbook, sem deploy/provisionamento pelo agente.
- A CSP strict sem `style-src 'unsafe-inline'` foi tentada e testada via smoke. O app proprio teve os
  estilos inline auditados removidos, mas `sonner` injeta estilo runtime e bloqueia a remocao completa.
  Decisao: manter `style-src 'self' 'unsafe-inline'` por enquanto, com follow-up explicito para
  substituir `sonner` ou carregar seus estilos estaticamente.
- Transparencia P5 local-first entra na UI: resumo de privacidade visivel, AGPL/disclaimer mantidos,
  `FEEDBACK_URL` opcional e `SOURCE_CODE_URL` ainda pendente ate o dono fornecer URL real.
- Naquele fechamento, o nome publico ainda seguia como placeholder centralizado; nenhuma URL/nome foi inventado. Supersedido em 2026-06-26 por `APP_NAME='Chess Habit'`.

## 2026-06-26: Governanca Fugu, Chess Habit E Professor Tavarez

- O dono aprovou que fugu-ultra assuma o papel de diretor operacional do projeto: sintetiza, decide e revisa; **GLM 5.2 executa tudo por padrao**; GLM + DeepSeek formam o council; gates objetivos continuam sendo o arbitro final.
- Nome publico aprovado: `APP_NAME='Chess Habit'`. Decisao posterior de 2026-06-30 removeu `SOURCE_CODE_URL` e manteve `FEEDBACK_URL` pendente ate canal oficial/dominio proprio.
- Persona/voz aprovada: **Professor Tavarez**. O nome interno da pasta/repo local pode continuar `lichess-tutor`; nomes de formato/DB de backup podem permanecer internos para compatibilidade.
- Antes de P4 sync real, integridade de dados continua bloqueante: backup/restore, migrações, reconciliação restore↔sync e testes locais precisam estar verdes. Nenhum deploy/provisionamento/secrets pelo agente.

## 2026-06-26: P4 M12 Backend Local-Only E Key-Agnostic

Implementado o backend de sync (P4 M12) **local-only e key-agnostic**, isolando propositamente
a decisao de KDF/passphrase (M13).

- **Storage opaco:** o servidor so armazena `ciphertext` (blob ja cifrado pelo cliente) na tabela
  `blobs` (PK `userId, collection, clientMutationId`). Nao ha coluna de plaintext, passphrase,
  chave ou token. O servidor jamais decodifica/interpreta ciphertext.
- **Auth local apenas:** `SYNC_AUTH_MODE='local'` confia no header `X-Sync-User` (teste/dev).
  Qualquer outro valor (ou ausente) retorna **501** apontando para M13. O worker nunca confia em
  header por padrao - producao exigira OAuth Lichess (M13), ainda nao implementado. `userId` do
  storage vem sempre do auth, nunca do payload do cliente (isolamento entre usuarios).
- **Sem deps pesadas / sem nuvem:** nao adicionou wrangler/miniflare. O handler `fetch` e puro e
  os testes injetam um fake D1 em memoria com a mesma forma da API D1. Sem deploy, provisionamento
  ou secrets pelo agente.
- **Idempotencia:** push usa UPSERT por `(userId, collection, clientMutationId)`; reenvios do mesmo
  mutation nao duplicam (o conteudo mais recente vence).
- **Gate:** `npm run typecheck:worker && npm run test:worker` verdes; gates do app (`lint`, `test`,
  `build`) inalterados e verdes. Council externo fica reservado para M13 (auth real + KDF E2EE),
  ponto irreversivel/seguro que toca identidade e derivacao de chave.

## 2026-06-26: P4 M13 Parcial - Cliente E2EE Local-Only

Implementado o cliente E2EE local-only sem ativar sync de produto e sem decidir OAuth real/merge:

- **Passphrase independente:** chave E2EE derivada por PBKDF2-SHA256 de uma passphrase que so o
  usuario sabe; nunca da identidade publica do Lichess nem de token OAuth. Decisao canonica: `sync.md`
  prevalece sobre o roadmap antigo.
- **Envelope opaco:** `encryptJson` gera envelope versionado com salt/iv aleatorios, AES-GCM 256 e
  chave nao-extraivel. O servidor M12 armazena apenas a string serializada em `ciphertext`.
- **Cliente HTTP sem segredos:** `createSyncClient` so trafega `ciphertext`, `collection`,
  `clientMutationId` e `updatedAt`; nao tem acesso a passphrase, chave, token ou plaintext.
- **M13 publico pendente:** fila offline persistente, validacao OAuth Lichess real, backend Cloudflare/D1
  provisionado e E2E dois-dispositivos. Sem provisionamento/secrets Cloudflare pelo agente.
- **Hardening pos-council:** envelopes com base64 invalido, `iterations` nao-inteiro/acima de
  2.000.000 e valores JSON nao-serializaveis agora falham antes de derivar chave; erro HTTP 200
  com corpo nao-JSON vira `SyncHttpError`; upsert do backend bloqueia rollback/clobber com
  `WHERE excluded.updatedAt > blobs.updatedAt`, mantendo retry com mesmo timestamp como no-op.
- **UI/canary local-only:** painel de sync em Config existe atras de `SYNC_UI_ENABLED=false`; o canary
  local verifica a passphrase sem persistir passphrase/chave/token. Sem backend URL o botao de sync fica
  desabilitado. A UI avisa que perder a passphrase torna blobs sincronizados irrecuperaveis.
- **Limpeza segura e probe robusto:** limpar a passphrase local e best-effort, mas a UI so zera canary/status
  se `canaryStore.clear()` retornar sucesso; se falhar, mostra erro e preserva o estado. A sonda de sync
  tem retry curto (250ms/750ms) antes de declarar falha, reduzindo falso-negativo por consistencia eventual.

## 2026-06-27: P4 M13b - Merge Dexie Por Mutacao De Entidade

- O council rejeitou snapshot inteiro por colecao por risco de clobber em dois aparelhos. A fatia local
  agora usa blobs cifrados por mutacao de entidade, mantendo o backend M12 existente
  `(userId, collection, clientMutationId)`.
- `src/infra/sync/syncRecords.ts` define allowlist deny-by-default de colecoes sincronizaveis e exclui
  tokens OAuth, cache Chess.com, metadata de backup e handles de auto-backup. `clientMutationId` nao vaza
  `entityId` em claro: usa hash estavel.
- `src/infra/sync/syncStorage.ts` implementa `pull -> merge -> push` local por colecao, com LWW por
  `updatedAt`, tombstones preservados e testes contra divergencia de dois aparelhos.
- Ainda pendem para sync publico: fila offline persistente, OAuth real de identidade, backend Cloudflare/D1
  provisionado, CSP `connect-src` para URL do Worker e E2E dois-dispositivos real.

## 2026-06-26: P5 Docs/Checks Beta Publico

- `Chess Habit` e o nome publico aprovado. `Rotina` e `Lichess Tutor` ficam rejeitados como nomes
  publicos em entry points; `lichess-tutor` pode permanecer como nome interno de pasta/repo e artefatos
  historicos.
- `docs/privacy/privacy-and-data.md` deve refletir o estado beta publico: app nao oficial, proprietario/codigo fechado, disclaimer/copyright visiveis, feedback pendente, tokens locais, PGN transiente, P4 sync opt-in conta-normal com progresso legivel no servidor, sem E2EE/passphrase.
- Teste `appIdentity.test.ts` e o gate que bloqueia regressao de nomes publicos; qualquer mudanca de nome
  publico deve atualizar `APP_NAME` e o teste em conjunto.
- Flaky `preserveProgress.test.tsx` foi estabilizado sem mudar produto: Config e lazy/Suspense agora usam
  timeout explicito no teste e limpeza forte entre arquivos.

## 2026-06-27: Push E Deploy Vercel Do Beta Publico

- `master` foi enviado para `origin/master`; CI GitHub do push ficou verde.
- Deploy de producao feito via fluxo obrigatorio prebuilt: `vercel build --prod --yes` seguido de
  `vercel deploy --prebuilt --prod --yes`.
- URL estavel verificada: `https://rotina-pied.vercel.app` retorna HTTP 200, titulo
  `Chess Habit - treino de xadrez`, `X-Robots-Tag: noindex, nofollow` e CSP esperada.
- O deploy inicial era apenas do PWA estatico/local-first; esta leitura foi supersedida pelo flip posterior do sync opt-in.

## 2026-06-30: Sync Conta-Normal, Licenca Proprietaria E CSP Do Worker

- Decisao vigente do dono: sync P4 usa modelo conta-normal, sem E2EE/passphrase. O progresso sincronizado fica legivel no Worker/D1 para operar o app; isso e declarado na UI/docs de privacidade. Tokens OAuth continuam so no aparelho e nao sao sincronizados como blob.
- `SYNC_UI_ENABLED=true` e `SYNC_BACKEND_URL='https://rotina-sync.chesshabit.workers.dev'`. Portanto Vite/Vercel precisam permitir esse host em `connect-src`; a CSP foi alinhada e os testes passaram a exigir o Worker.
- App vigente e proprietario/codigo fechado: `LICENSE` proprietaria, `package.json` `UNLICENSED`, rodape com copyright. Decisoes antigas de AGPL/open-source ficam historicas/superseded.
- Runbook do backend passa a refletir producao OAuth (`SYNC_AUTH_MODE='oauth'`) e o campo legado `ciphertext` como JSON legivel, nao cifra.
- Proximos gates: lint, testes, build, typecheck/test worker, smoke PWA e dogfood de sync real em dois aparelhos.
