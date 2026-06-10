# Plano Implementavel do Metodo Lichess - CODEX

Data de referencia: 2026-06-10

Escopo: executar o prompt `prompts/archive/2026-06-method/codex-plano-implementacao-metodo-lichess.md` e transformar a
analise diretora da Onda 3 em um plano tecnico para o repo atual. Este documento nao implementa codigo.

## 1. Veredito executivo

A melhor implementacao e tratar as 5 trilhas como uma camada de metodo sobre o loop que ja existe,
nao como um segundo produto. O app ja tem o suficiente para entregar valor: plano diario, blocos por
tempo, destinos Lichess, feedback local, reconciliacao de puzzles por `puzzle:read`, dashboard/replay
e Study privado do dia por `study:write`.

Decisao Codex: implementar em 3 cortes.

1. **Metodo local primeiro:** criar tipos e regras puras para `MethodTrack`, pendencias e diplomas,
   usando logs, feedback e `PuzzleThemeStats`. Sem API nova.
2. **Plano Hoje adaptado:** fazer o gerador escolher entre pendencia, calculo, defesa, abertura e
   diploma conforme sinais locais. Reaproveitar destinos Lichess existentes sempre que possivel.
3. **Study do dia melhorado:** manter `createDailyStudy`, mas enriquecer os capitulos com trilha,
   pergunta-guia, criterio de conclusao e destino Lichess. Criar studies permanentes por trilha so
   depois de validar manualmente que o fluxo diario ficou bom.

Nota geral: impacto 9/10, esforco 6/10, risco 4/10, prioridade 9/10.

## 2. Leitura do estado atual do repo

### O que ja existe

- `src/domain/types.ts` ja define `WeaknessTag`, `PlanResourceStage`, `PlanBlock`, `DailyPlan`,
  `TrainingLog`, `TrainingResult`, `PuzzleThemeStats`, OAuth scopes e `LichessStudyLink`.
- `src/domain/plan/timeBudget.ts` ja tem blocos para 5/15/30/60 min:
  `aquecimento`, `tema`, `revisao`, `transferencia`, `final`.
- `src/domain/plan/generatePlan.ts` ja escolhe fraqueza primaria, preserva progresso anterior,
  avanca `guided -> retrieval` por feedback e usa `recentThemeStats`.
- `src/domain/sources/resourceCatalog.ts`, `destinations.ts` e `resourceSelector.ts` ja mapeiam
  fraquezas para Lichess Practice, puzzle themes, puzzle modes, replay e recursos curados.
- `src/app/trainingLogFlow.ts` ja reconcilia logs de puzzle com `GET /api/puzzle/activity`, gera
  diagnostico com `GET /api/puzzle/dashboard/{days}` e replay com
  `GET /api/puzzle/replay/{days}/{theme}`.
- `src/infra/lichess/study.ts` ja cria Study privado/unlisted e importa PGN autoral de plano diario.
- `src/infra/storage/db.ts` esta na versao 3 com tabelas `profile`, `plans`, `logs`, `signals`,
  `weaknesses`, `chesscomMonthSignals`, `lichessOAuthTokens`, `lichessStudies`.
- `src/ui/Today.tsx` ja mostra proposta de fase, milestones, blocos, roadmap, diagnostico,
  reconciliacao Lichess e geracao de Study.

### O que falta

- Nao ha conceito explicito de trilha metodologica. Hoje o plano gira em torno de `WeaknessTag`.
- Nao ha fila de pendencias: erro recente, tema falhado, partida a revisar, due date e status.
- Nao ha diploma local com secoes, tentativas, score e criterio de avanco.
- `WeaknessTag` cobre temas taticos e alguns sintomas, mas nao deve carregar sozinho conceitos como
  `Tratamento de Pendencias` ou `Diploma`. Isso pede uma camada acima.
- `Study` do dia ainda e um sumario de blocos; nao modela capitulos por trilha nem perguntas-guia.
- `exportAllAsJson` e `clearAll` precisarao incluir novas tabelas locais, sem exportar tokens.

### Conflitos com o plano atual, se houver

- O `project-contract.md` ainda menciona ideias antigas como `chess.js` e tabuleiro proprio. Para este
  repo, `AGENTS.md` e `PLANO.md` vencem: nao criar tabuleiro proprio; treino abre no Lichess.
- `package.json` usa Vite 8, enquanto o contrato antigo cita Vite 7. Seguir `package.json`.
- P4/P5 continuam congeladas. Qualquer sync PC-celular, comunidade, renomeacao publica ou hardening
  publico fica fora deste plano.

## 3. Mapa Lichess do metodo

### Endpoints existentes

- `GET /api/games/user/{username}` em `src/infra/lichess/games.ts`, com `moves=false`,
  `pgnInJson=false`, `opening=true`, `accuracy=true`, `finished=true`. Uso: sinais derivados de
  abertura, cor e julgamento. Nao persistir PGN.
- `GET /api/puzzle/activity` em `src/infra/lichess/puzzleActivity.ts`, escopo `puzzle:read`. Uso:
  reconciliar resultado do bloco de puzzle por janela de tempo.
- `GET /api/puzzle/dashboard/{days}` em `src/infra/lichess/puzzleDashboard.ts`, escopo
  `puzzle:read`. Uso: detectar temas fracos/fortes agregados.
- `GET /api/puzzle/replay/{days}/{theme}` em `src/infra/lichess/puzzleDashboard.ts`, escopo
  `puzzle:read`. Uso: transformar erro recente em revisao.
- `POST /api/study` em `src/infra/lichess/study.ts`, escopo `study:write`. Uso: criar Study privado
  ou unlisted.
- `POST /api/study/{studyId}/import-pgn` em `src/infra/lichess/study.ts`, escopo `study:write`.
  Uso: importar capitulos autorais no Study.

### Endpoints novos, se realmente necessarios

Nenhum endpoint novo e necessario no primeiro corte.

Nao usar:

- Board API, Bot API, Challenge API, mensagens, engine ou `puzzle:write`.
- API de "solve puzzle" porque o app nao deve virar tabuleiro proprio.
- Scraping de `training/themes` ou paginas HTML.

Opcional congelado para depois: pipeline offline sobre Lichess Puzzle Database public domain para
curadoria local. So deve entrar se o dono decidir aceitar download/dados locais maiores; ainda assim,
o destino de treino deve continuar sendo Lichess.

### Destinos por URL

Destinos prioritarios a garantir no catalogo, todos como deep link Lichess:

| trilha | destinos Lichess principais |
|---|---|
| Tratamento de Pendencias | `/training/{theme}` do tema fraco, replay quando houver `puzzle:read`, `analysis` so para partida terminada indicada |
| Calculo Ponte 800-1200 | `/training/fork`, `/training/discoveredAttack`, `/training/mateIn2`, `/training/deflection`, `/training/quietMove`, Puzzle Streak |
| Defesa Ativa | `/training/defensiveMove`, `/training/hangingPiece`, `/training/trappedPiece`, `/training/quietMove`, Practice quando houver recurso aprovado |
| Abertura Como Plano | Lichess Learn/Practice/video direto aprovado, Analysis/Explorer apenas para partida terminada e sem sugerir lance vivo |
| Diplomas de Progresso | Coordinates/Learn/Practice/Puzzle themes mistos, com score local manual ou reconciliado |

Alguns slugs talvez ainda nao existam no `resourceCatalog.ts`. A implementacao deve adicionar apenas
slugs confirmados manualmente e testados como formato de URL, sem fetch de pagina.

### Limites oficiais

- Lichess recomenda uma requisicao por vez.
- Em HTTP 429, esperar pelo menos 1 minuto antes de retomar.
- `POST /api/study` permite ate 30 novos Studies por dia.
- Study import pode criar capitulos e um Study tem limite de 64 capitulos.
- `puzzle:read` e `study:write` sao os unicos escopos aceitaveis aqui.
- Tokens continuam locais e fora de logs/export/bundle.

## 4. Modelo de dominio proposto

### Tipos novos

Adicionar em `src/domain/types.ts`, ou melhor em `src/domain/method/types.ts` e reexportar:

```ts
export type MethodTrackId =
  | 'pending-review'
  | 'calculation-bridge'
  | 'active-defense'
  | 'opening-as-plan'
  | 'progress-diplomas';

export type MethodTrackStatus = 'active' | 'review' | 'paused' | 'completed';

export type MethodTrack = {
  id: MethodTrackId;
  title: string;
  priority: number;
  status: MethodTrackStatus;
  focusWeaknessTags: WeaknessTag[];
  startedAt: string;
  updatedAt: string;
};

export type PendingItemOrigin = 'puzzle' | 'game-review' | 'manual' | 'diploma';

export type PendingTrainingItem = {
  id: string;
  origin: PendingItemOrigin;
  title: string;
  weaknessTag: WeaknessTag;
  methodTrackId: MethodTrackId;
  lichessTheme?: string;
  lichessUrl?: string;
  sourceLogId?: string;
  sourceGameId?: string;
  sourcePly?: number;
  prompt: string;
  dueAt: string;
  attempts: number;
  lastFeedback?: PlanBlockFeedback;
  status: 'open' | 'done' | 'deferred';
  createdAt: string;
  updatedAt: string;
};

export type DiplomaId = 'peao' | 'torre' | 'rei';

export type DiplomaAttempt = {
  id: string;
  diplomaId: DiplomaId;
  sectionId: string;
  scorePercent: number;
  totalItems: number;
  passed: boolean;
  source: 'local' | 'lichess';
  createdAt: string;
  updatedAt: string;
};
```

Extender `PlanBlock` de modo retrocompativel:

```ts
methodTrackId?: MethodTrackId;
methodStepId?: string;
pendingItemId?: string;
masteryTarget?: 'advance' | 'review' | 'regress';
```

Campos opcionais preservam planos antigos e evitam migracao destrutiva.

### Extensoes de `WeaknessTag` ou alternativas

Nao transformar trilha em `WeaknessTag`. Trilha e eixo pedagogico; fraqueza e sintoma.

Adicionar tags so quando representarem sinal enxadristico real:

```ts
| 'calculation'
| 'defensive-move'
```

`calculation` deve ser usada com cuidado: no app, ela geralmente se materializa por temas Lichess
como `fork`, `discovered`, `mate-in-2`, `deflection`, `quietMove`. Se isso gerar generalidade demais,
manter calculo como `MethodTrackId` e usar as tags taticas existentes.

Recomendacao inicial: adicionar apenas `defensive-move` se o catalogo precisar representar
`/training/defensiveMove`; manter `calculation-bridge` como trilha, nao como fraqueza.

### Estruturas para trilhas/pendencias/diplomas

Criar modulos:

- `src/domain/method/methodTracks.ts`: catalogo autoral das 5 trilhas, titulos, objetivos,
  perguntas-guia e criterios.
- `src/domain/method/pendingItems.ts`: cria pendencias a partir de logs, feedback `hard`,
  replay/dashboard e sinais manuais.
- `src/domain/method/mastery.ts`: calcula `advance/review/regress` usando acerto, volume minimo,
  feedback e recencia.
- `src/domain/method/diplomas.ts`: define Peao/Torre/Rei, secoes e thresholds.
- `src/domain/method/selectMethodTrack.ts`: escolhe a trilha ativa de modo deterministico.

### Persistencia Dexie

Adicionar versao 4 em `src/infra/storage/db.ts`:

```ts
this.version(4).stores({
  methodTracks: 'id, status, updatedAt',
  pendingItems: 'id, status, dueAt, methodTrackId, weaknessTag, updatedAt',
  diplomaAttempts: 'id, diplomaId, sectionId, createdAt, updatedAt',
});
```

Adicionar funcoes em `src/infra/storage/appData.ts`:

- `loadMethodTracks`, `saveMethodTracks`
- `loadOpenPendingItems`, `savePendingItem`, `replacePendingItems`
- `loadDiplomaAttempts`, `saveDiplomaAttempt`

Atualizar `clearAll` para limpar as novas tabelas. Atualizar `exportAllAsJson` para incluir
`methodTracks`, `pendingItems` e `diplomaAttempts`, mas continuar excluindo OAuth tokens.

## 5. Plano das 5 trilhas

### Tratamento de Pendencias

Dominio:

- `methodTrackId: 'pending-review'`
- Gera `PendingTrainingItem` quando:
  - bloco recebe feedback `hard`;
  - bloco de puzzle reconciliado tem perdas;
  - dashboard aponta tema fraco;
  - usuario marca manualmente "isso virou pendencia".
- Usa agenda 1/3/7/14 dias, guardando `dueAt`.

Tela Hoje:

- Um bloco ou card "Pendencia de hoje" antes do tema novo quando houver item vencido.
- Texto: "Qual erro meu este treino esta tentando parar de repetir?"

Destino Lichess:

- Se tiver `lichessTheme`, abrir `/training/{theme}` ou replay se disponivel.
- Se vier de partida terminada, abrir URL de analysis da partida, sem engine no app e sem lance vivo.

Telemetria:

- `TrainingLog.feedback`
- `TrainingLog.result.themeStats`
- `PendingTrainingItem.attempts/status/lastFeedback`
- Mastery: 80%+ avanca; 50-79 revisa; <50 volta para guiado.

### Calculo Ponte 800-1200

Dominio:

- `methodTrackId: 'calculation-bridge'`
- Pergunta-guia por bloco:
  1. Qual e a ameaca dele?
  2. Quais sao meus 2 candidatos?
  3. Qual e a melhor resposta dele?
  4. A posicao final ficou melhor, igual ou pior?
- Nao armazenar variantes de livros. O app armazena apenas checklist autoral e tema Lichess.

Tela Hoje:

- Bloco "Calculo ponte" substitui ou complementa `Tema do dia` quando `fork`, `discovered`,
  `mate-in-2`, `conversion` ou feedback de calculo forem dominantes.

Destino Lichess:

- `fork`, `discoveredAttack`, `mateIn2`, `deflection`, `quietMove`, `puzzleStreak`.
- Para `review`, preferir `puzzle-replay` quando houver perdas no dashboard.

Telemetria:

- Acerto por tema.
- Feedback hard/good/easy.
- Item de pendencia se o usuario registra "joguei o primeiro lance visto".

### Defesa Ativa

Dominio:

- `methodTrackId: 'active-defense'`
- Provavel nova tag: `defensive-move`.
- Checklist autoral:
  1. Estou em perigo?
  2. Qual e a ameaca concreta?
  3. Posso neutralizar?
  4. Posso trocar para aliviar?
  5. Posso criar contra-jogo?

Tela Hoje:

- Bloco "Defesa ativa" quando houver `blunder-rate`, `hanging-piece`, perdas em `defensiveMove` ou
  feedback manual de perigo nao visto.

Destino Lichess:

- `/training/defensiveMove`, `/training/hangingPiece`, `/training/trappedPiece`,
  `/training/quietMove`.
- Se o catalogo ainda nao tiver estes slugs, adicionar em commit proprio com testes.

Telemetria:

- Perdas em `defensiveMove`, `hangingPiece`, `trappedPiece`.
- Reducao de blunders por `judgment` em partidas terminadas.

### Abertura Como Plano

Dominio:

- `methodTrackId: 'opening-as-plan'`
- Usa `WeaknessTag: 'opening-principles'`.
- Criterio de maturidade: 5 partidas terminadas com revisao manual dos 3 principios:
  centro, desenvolvimento, rei seguro.

Tela Hoje:

- Bloco curto de abertura entra depois de seguranca/tatica minima, ou quando sinais de abertura
  aparecerem com confianca media.
- Nao transformar em repertorio longo.

Destino Lichess:

- Recursos aprovados ja existentes no catalogo para abertura.
- Lichess Analysis/Explorer apenas em partida terminada. O app nao sugere lance.

Telemetria:

- Sinais de abertura de Chess.com/Lichess.
- `DiplomaAttempt` ou `PendingTrainingItem` manual com checkboxes dos 3 principios.

### Diplomas de Progresso

Dominio:

- `methodTrackId: 'progress-diplomas'`
- `DiplomaId: 'peao' | 'torre' | 'rei'`
- Diplomas sao checkpoints de decisao, nao medalhas decorativas.

Tela Hoje:

- Integrar ao `SessionMilestonesCard` ou criar card pequeno "Checkpoint de dominio".
- Mostrar "avancar", "revisar" ou "voltar para guiado".

Destino Lichess:

- Peao: Learn/Coordinates/mates basicos.
- Torre: puzzle themes de seguranca e tatica basica.
- Rei: calculo curto, abertura por principios, finais e uma revisao de partida terminada.

Telemetria:

- `DiplomaAttempt.scorePercent`
- score por secao.
- Thresholds:
  - Peao >=90
  - Torre >=80
  - Rei >=70-80 por secao

## 6. Mudancas no gerador de plano

### Regras SE/ENTAO

Adicionar `src/domain/method/selectMethodTrack.ts` com regras puras:

```txt
SE ha pendencia aberta vencida ENTAO trilha = pending-review
SENAO SE dashboard tem tema fraco de defesa ENTAO trilha = active-defense
SENAO SE fraqueza primaria em fork/discovered/mate-in-2/conversion ENTAO trilha = calculation-bridge
SENAO SE opening-principles tem score >= medio ENTAO trilha = opening-as-plan
SENAO SE chegou em checkpoint de horas/sessoes ENTAO trilha = progress-diplomas
SENAO manter trilha da fraqueza primaria atual
```

Adicionar `methodTrackId` e `masteryTarget` em `createPlanBlock`.

### Tempo 5/15/30/60

`getTimeBudget` pode evoluir de modo minimo:

- 5 min: 1 bloco, preferir pendencia vencida ou tema principal.
- 15 min: 10 min pendencia/tema + 5 min revisao.
- 30 min: 5 aquecimento + 15 trilha ativa + 10 transferencia/revisao.
- 60 min: 10 aquecimento + 20 trilha ativa + 15 pendencias/replay + 10 final/abertura + 5 registro.

Primeiro corte: nao precisa criar `registro` como novo bloco; usar stopRule e feedback. Segundo corte:
adicionar `PlanBlockKind = 'pendencia' | 'checkpoint'` se a UX pedir.

### Progresso por feedback e puzzle stats

Criar `computeMasteryState(input)`:

- `advance` se `accuracy >= 0.8`, volume minimo atingido e feedback recente nao e `hard`.
- `review` se `0.5 <= accuracy < 0.8` ou se feedback alterna entre `good` e `hard`.
- `regress` se `accuracy < 0.5`, duas respostas `hard` seguidas ou perdas concentradas no mesmo
  tema.

Nao usar rating como porta de avanco.

### Tratamento de pendencias

Quando `completeBlockTraining` recebe feedback `hard`, criar ou atualizar pendencia local.
Quando reconciliacao Lichess traz perdas por tema, criar pendencia agregada por tema, nao uma
pendencia por puzzle individual. Isso evita armazenar conteudo desnecessario e reduz ruido.

## 7. Study builder

### Se deve reaproveitar `createDailyStudy`

Sim. Reaproveitar `createDailyStudy` no primeiro corte. Ele ja:

- cria Study privado por padrao;
- reaproveita `existingStudyId` em retry;
- importa PGN autoral;
- trata 429 com `LichessRateLimitError`;
- nao exige endpoint novo.

### Se precisa de studies por trilha ou Study do dia melhorado

Primeiro corte: **Study do dia melhorado**.

Motivos:

- evita criar 5 studies permanentes antes de validar o fluxo;
- respeita limite de 30 studies/dia;
- reduz risco de estudos vazios/orfaos;
- conversa com o botao existente "Gerar Study".

Segundo corte opcional: criar studies por trilha so por acao manual explicita:

- `Metodo - Tratamento de Pendencias`
- `Metodo - Calculo Ponte`
- `Metodo - Defesa Ativa`
- `Metodo - Abertura Como Plano`
- `Metodo - Diplomas`

### Limites: 30 studies/dia, 64 capitulos/study

- Um Study do dia deve ter no maximo o numero de blocos do plano, normalmente 1 a 4 capitulos.
- Studies por trilha, se entrarem, devem ser reaproveitados e nunca recriados diariamente.
- O builder deve falhar com mensagem clara se tentarmos passar de 64 capitulos.

### Formato de PGN autoral seguro

Evoluir `buildBlockPgn` para incluir apenas:

- titulo autoral;
- trilha;
- pergunta-guia;
- tarefa;
- stop rule;
- criterio de conclusao;
- destino Lichess;
- nenhuma variante de livro;
- nenhum FEN/PGN protegido;
- nenhum trecho copiado.

Exemplo de comentario permitido:

```txt
{ Trilha: Calculo Ponte 800-1200 }
{ Pergunta: quais sao meus 2 candidatos e qual a melhor resposta dele? }
{ Destino: https://lichess.org/training/fork }
```

Nao incluir posicoes de PDFs sensiveis no repo. Se o dono montar manualmente estudo privado no Lichess
com base em leitura pessoal, isso fica fora do produto publico e fora do versionamento.

## 8. UX proposta

Mudancas pequenas na tela Hoje:

1. No `LearningPlanProposalCard`, mostrar a trilha ativa alem da fraqueza atual.
2. Abaixo de `SessionMilestonesCard`, adicionar `MethodTrackCard` ou incorporar uma linha:
   "Trilha atual: Tratamento de Pendencias".
3. Em cada `PlanBlockCard`, exibir uma linha curta quando houver `methodTrackId`:
   "Metodo: Calculo Ponte".
4. Adicionar acao discreta depois do feedback `hard`: "Guardar como pendencia".
5. No card de milestones, mostrar o proximo diploma/checkpoint quando aplicavel.
6. No diagnostico, manter "Gerar Study" como acao manual; nao criar Study automaticamente.

Nada de landing page, nada de hero, nada de gamificacao visual grande. O app e uma mesa de estudo.

## 9. Privacidade e clean-room

- O repo armazena apenas abstracoes autorais, slugs Lichess, URL Lichess, status, feedback e
  telemetria.
- Nao armazenar textos, diagramas, FEN, PGN, comentarios ou variantes de livros protegidos.
- Nao usar ChessKing como `SourceId`, taxonomia ou conteudo.
- Tokens continuam na tabela local `lichessOAuthTokens` e fora de `exportAllAsJson`.
- Chess.com continua read-only; PGN transiente; persistir somente sinais derivados.
- Partida viva nunca entra como destino de analise.
- `analysis` so para partida terminada e sem sugestao de lance no app.

## 10. Testes obrigatorios

### Dominio

- `src/domain/method/methodTracks.test.ts`
  - catalogo contem exatamente as 5 trilhas;
  - cada trilha aponta para tags permitidas;
  - nenhum texto sensivel ou fonte protegida aparece.
- `src/domain/method/mastery.test.ts`
  - >=80 avanca;
  - 50-79 revisa;
  - <50 regride;
  - feedback `hard` impede avanco.
- `src/domain/method/pendingItems.test.ts`
  - feedback `hard` cria pendencia;
  - puzzle losses agregam por tema;
  - pendencia concluida nao volta como vencida.
- `src/domain/plan/generatePlan.test.ts`
  - pendencia vencida ganha prioridade;
  - calculo ponte usa tema tatico correto;
  - defesa ativa usa `defensiveMove` quando presente;
  - opening nao aparece antes de seguranca/tatica se nao houver sinal forte.

### Infra Lichess

- `src/infra/lichess/study.test.ts`
  - Study PGN inclui trilha/pergunta/criterio;
  - comentarios sao sanitizados;
  - nao importa mais de 64 capitulos;
  - 429 continua virando `LichessRateLimitError`.
- `src/infra/lichess/puzzleDashboard.test.ts`
  - replay segue agregando `remainingCount` sem guardar puzzle bruto alem do necessario.

### Storage

- `src/infra/storage/appData.test.ts`
  - Dexie v4 cria novas tabelas;
  - export inclui metodo/pendencias/diplomas;
  - export nao inclui token;
  - clear apaga novas tabelas.

### React

- `src/ui/LearningPlanProposalCard.test.tsx`
  - mostra trilha ativa.
- `src/ui/SessionMilestonesCard.test.tsx`
  - mostra diploma/checkpoint sem prometer rating.
- `src/app/trainingFlow.test.tsx`
  - feedback hard oferece/gera pendencia;
  - abrir Lichess continua salvando log antes;
  - Study do dia continua manual.

### Regressao

Rodar no fechamento da implementacao:

```bash
npm run lint
npm run test
npm run build
```

Verificar desktop/mobile no browser se houver mudanca visivel na tela Hoje.

## 11. Fases e commits atomicos

### Commit 1 - Dominio do metodo

Arquivos provaveis:

- `src/domain/types.ts`
- `src/domain/method/methodTracks.ts`
- `src/domain/method/mastery.ts`
- `src/domain/method/pendingItems.ts`
- `src/domain/method/diplomas.ts`
- `src/domain/index.ts`
- testes novos.

Entrega: tipos, catalogo das 5 trilhas, thresholds e pendencias puras.

### Commit 2 - Catalogo Lichess por trilha

Arquivos provaveis:

- `src/domain/sources/resourceCatalog.ts`
- `src/domain/sources/catalogSkills.ts`
- `src/domain/sources/resourceSelector.ts`
- testes correspondentes.

Entrega: `defensiveMove`, `quietMove`, `trappedPiece` e recursos de calculo/defesa confirmados por
allowlist manual.

### Commit 3 - Gerador de plano com trilha

Arquivos provaveis:

- `src/domain/plan/generatePlan.ts`
- `src/domain/plan/timeBudget.ts`
- `src/domain/plan/planSessions.ts`
- testes de plano.

Entrega: blocos recebem `methodTrackId`, pendencias vencidas sobem prioridade, mastery controla
guided/retrieval/review.

### Commit 4 - Persistencia Dexie v4

Arquivos provaveis:

- `src/infra/storage/db.ts`
- `src/infra/storage/appData.ts`
- `src/infra/storage/appData.test.ts`

Entrega: tabelas locais para trilhas, pendencias e diplomas; export/clear atualizados.

### Commit 5 - UX minima na tela Hoje

Arquivos provaveis:

- `src/ui/Today.tsx`
- `src/ui/LearningPlanProposalCard.tsx`
- `src/ui/SessionMilestonesCard.tsx`
- possivel `src/ui/MethodTrackCard.tsx`
- `src/index.css`
- testes React.

Entrega: trilha visivel, pendencia de hoje, diploma/checkpoint sem poluir a tela.

### Commit 6 - Study do dia melhorado

Arquivos provaveis:

- `src/infra/lichess/study.ts`
- `src/infra/lichess/study.test.ts`
- `src/app/state.ts` se precisar passar contexto.

Entrega: capitulos autorais com trilha/pergunta/criterio, limite de 64 capitulos e sem conteudo
protegido.

### Commit 7 - Integracao final e docs

Arquivos provaveis:

- `docs/research/sources.md`
- `memory/state.md`
- `memory/progress.md`
- testes de regressao se necessario.

Entrega: gate verde, memoria atualizada e fontes oficiais registradas.

## 12. Notas comparativas

| item | impacto | esforco | risco | prioridade |
|---|---:|---:|---:|---:|
| Tratamento de Pendencias | 10 | 6 | 4 | 10 |
| Calculo Ponte 800-1200 | 9 | 5 | 3 | 9 |
| Defesa Ativa | 8 | 5 | 4 | 8 |
| Abertura Como Plano | 7 | 4 | 3 | 7 |
| Diplomas de Progresso | 7 | 6 | 5 | 7 |
| Study do dia melhorado | 8 | 4 | 3 | 8 |
| Studies permanentes por trilha | 6 | 7 | 6 | 4 |

Leitura: o maior ganho imediato vem de pendencias + calculo. Studies permanentes por trilha sao
sedutores, mas entram depois.

## 13. Perguntas abertas

1. O dono quer que pendencias sejam criadas automaticamente por feedback `hard`, ou prefere confirmar
   item por item?
2. Para revisao de partidas terminadas, basta guardar `gameId`/URL e nota autoral, ou o dono quer um
   campo privado de anotacao mais longo?
3. Devemos adicionar `defensive-move` como `WeaknessTag`, ou mapear defesa ativa por `blunder-rate` +
   `hanging-piece` + temas Lichess?
4. Diplomas devem ter teste manual no app ou apenas checklist guiado por destinos Lichess?
5. O Study privado do dia deve usar modo normal, `gamebook` ou `conceal` no import PGN? O modo normal
   e o menor risco no primeiro corte.

## 14. Recomendacao final

Implementar primeiro **Tratamento de Pendencias + Calculo Ponte** dentro do plano diario existente.
Isso cria a ponte entre "eu treinei no Lichess" e "o Professor Lemos sabe o que precisa voltar".

Nao criar cinco Studies permanentes agora. Melhorar o Study do dia, fazer o app marcar pendencias,
usar puzzle dashboard/replay para revisao e deixar os diplomas como checkpoint local. Depois de duas
semanas de uso real, decidir se vale promover as trilhas para studies fixos privados.
