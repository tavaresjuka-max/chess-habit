# Decisoes

## 2026-06-06: Projeto Separado

Decidido criar `lichess-tutor` separado do app pago anterior. Motivo: evitar confusao de escopo, conteudo, nome, dados e arquitetura.

## 2026-06-06: Lichess-first

O app sera construido ao redor do Lichess por ser aberto, gratuito, documentado e alinhado ao modelo do produto.

## 2026-06-06: PWA Com Sync — REVISADA em 2026-06-06

**Original:** O produto deve funcionar em computador e mobile. PWA foi escolhida como primeira distribuicao. Sync entre dispositivos exige backend minimo.

**Revisao do Diretor Geral:** Sync e backend adiados para Fase 2. MVP Fase 1 sera PWA local-first sem backend. Sync permanece como objetivo de longo prazo.

## 2026-06-06: Gratuito E Aberto

Modelo definido: gratuito, open-source, AGPL-3.0 planejada, doacao externa e sem recurso pago funcional. **Mantido.**

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
  sinais derivados; nunca PGN completo; sem PII de perfil; bound de recencia (~3 meses/~100 jogos).
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
5. **Implantacao Etapa 2B:** jomega entra no catalogo ativo apenas como `needs-human-review`. Na checagem de link da implementacao, `Iof6LzcT`, `s3iOCawc`, `6JAUFQ5p` e `wzFrgluQ` responderam `200`; `g6vPzJv7` e `q9bJ8YdY` responderam `404` e nao devem ser usados.

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
