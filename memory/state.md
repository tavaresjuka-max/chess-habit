# Estado Atual

Data: 2026-06-09 (atualizado apos estabilizacao final da fase pessoal pos-P3).

## Status

- Moldura: **pessoal primeiro, comunidade depois** (decidida pelo dono).
- Fase de codigo: **aberta pelo dono** para a ferramenta pessoal.
- App: P0-P3 concluidas. PWA local-first roda com dominio puro, diagnostico Chess.com/Lichess,
  plano adaptado por fraquezas, timer/log local de treino, feedback facil/bom/dificil, foco semanal,
  roadmap, sessoes extras, selecao de recursos por estagio, OAuth PKCE opt-in, reconciliacao de puzzles,
  Study Lichess privado do dia, Dexie, export/apagar e offline-shell.
- Polish UX/UI de 2026-06-07 concluido: tela Hoje prioriza treino, diagnostico fica recolhido, card de
  treino tem avaliacao obrigatoria em duas etapas, Config foi separada em secoes, e feedback local usa
  toasts/icone contidos.
- Professor Lemos Etapa 1 concluida em 2026-06-08: tela Hoje agora tem card dedicado com abertura,
  retorno apos ausencia, fechamento por feedback, reconhecimento sobrio de constancia e diagnostico
  agregado travado por evidencia.
- Professor Lemos Etapa 2A concluida em 2026-06-08: o card explicita quando o plano esta em fallback
  por falta de sinais reais, blocos concluidos deixam de ser reescritos ao regenerar, e a proxima
  sessao troca para treino variado quando uma explicacao ja foi marcada como dificil. A pergunta do
  Lemos agora pode virar sinal manual local por botao, e o card expõe atalho para conferir puzzles
  quando houver log de puzzle sem resultado reconciliado.
- Curadoria Lichess profunda e auditoria de qualidade (Antigravity) concluida em 2026-06-08: relatorio com 45 achados auditados, mapeamento de fraquezas e catalogacao de novos recursos de elite comunitarios (NoseKnowsAll, jomega) em `docs/research/relatorio-antigravity-curadoria-lichess-professor-lemos-2026-06-08.md`.
- Professor Lemos Etapa 2B implementada em 2026-06-08: catalogo Lichess enriquecido com metadados
  de curadoria, videos diretos, estudos comunitarios seguros como reforco, rejeitados fora do ativo,
  ranking por estagio e normalizacao de destinos legados, sem abrir P4/P5.
- Catalogo Premium Lichess implementado em 2026-06-08: camada de sub-habilidades (`CatalogSkillNode`),
  seletor premium com faixa/estagio/tempo/erros recentes/recursos concluidos, Puzzle Dashboard e
  Puzzle Replay via OAuth `puzzle:read`, e sinais agregados por tema sem persistir IDs de puzzle,
  PGN, solucoes ou conteudo de estudos.
- Estabilizacao final da fase pessoal pos-P3 concluida em 2026-06-09: abertura externa do Lichess
  salva o log local antes de navegar, fechamento do dia cobre blocos feitos ou pulados, e nao ha
  pendencias abertas na fase ativa alem de uso real continuo.
- Backend/banco: congelado. P4/P5 nao devem ser implementadas ate nova decisao do dono.
- Spec de execucao vigente: `docs/superpowers/specs/2026-06-06-rotina-pessoal-adaptativa-design.md`.

## Decisoes Vigentes

- Ferramenta pessoal Lichess-first, local-first, adaptativa, faixa 0-1200.
- Clean-room: app novo do zero; proibido herdar codigo/assets do app pago. ChessKing fora do dominio.
- OAuth foi permitido pelo dono e reconciliado em `AGENTS.md`, `PLANO.md`, ADR-006 e spec. OAuth nunca
  e obrigatorio; escopos permitidos na ferramenta pessoal: `puzzle:read` para reconciliar atividade de
  puzzles e `study:write` para criar/importar o Study do dia. Tokens ficam locais e fora do export.
- Sem engine na ferramenta pessoal.
- Adaptativo via dados publicos do Lichess + a analise que o Lichess ja fez (sem rodar engine).
- Multi-fonte chegou ate P3. Sync (P4) e comunidade/renomeacao/disclaimers publicos (P5) estao congelados.
- Renomeacao publica continua reservada para a versao-comunidade congelada; OAuth pessoal e opt-in e restrito a `puzzle:read`/`study:write`.
- Tipos estritos, sync por registro, slugs por allowlist oficial/manual, erro/offline especificados, linguagem de hipotese.

## Historico Da Auditoria (insumo, ja absorvido)

- `relatorio-codex-torre-aberta-lichess-tutor.md` e `relatorio-antigravity-torre-aberta-lichess-tutor.md`
  (auditoria estrategica inicial).
- `relatorio-claude-diretor-geral-consolidado-2026-06-06.md` (consolidacao no frame de mercado).
- Revisoes do spec unificado: `relatorio-codex-revisao-spec-unificado-2026-06-06.md`,
  `relatorio-claude-revisao-spec-unificado-2026-06-06.md`, `relatorio-antigravity-analise-design-unificado.md`.
  Correcoes tecnicas/legais aceitas; recomendacao de "validar mercado antes de codar" reservada para P5.

## Proxima Etapa

P0, P1, P2 e P3 foram fechadas em 2026-06-06; a rodada de polish UX/UI foi fechada em 2026-06-08;
Professor Lemos Etapa 1, Etapa 2A e Etapa 2B foram fechadas em 2026-06-08. A curadoria profunda de
recursos Lichess e o Catalogo Premium Lichess tambem foram concluidos em 2026-06-08. P4 e P5 estao congeladas por decisao do dono. A
proxima etapa valida e usar o app pessoalmente por sessoes reais e corrigir dores pequenas observadas
no uso, sem criar backend/sync/comunidade. Diagnostico por tema agora usa resultados de puzzle
reconciliados quando houver `themeStats`; sem resultado real por tema, o tutor pergunta e permite
registrar a resposta como sinal manual local.

Implementado ate P3:

- Chess.com PubAPI read-only como diagnostico primario (`stats`, `games/archives`, `games/{YYYY}/{MM}`),
  acesso serial, cache mensal de sinais derivados e parse PGN apenas transiente.
- Lichess como diagnostico secundario por export NDJSON de partidas analisadas, sem moves/PGN persistido.
- Timer/log local ao abrir treino no Lichess; concluir salva tempo real e feedback `easy`/`good`/`hard`.
- Reconciliacao de puzzles via OAuth opt-in `puzzle:read`, tanto manual quanto oportunista ao concluir.
- Study Lichess privado do dia via OAuth opt-in `study:write`; PGN gerado e importado transientemente,
  sem armazenar PGN completo.
- Roadmap local, foco semanal, recursos por estagio, sessoes extras no mesmo dia e abertura direta de
  aulas/Practice/puzzle themes especificos.
- Estabilizacao de 2026-06-07: blocos concluidos ocultam acoes destrutivas, abertura de treino usa
  link real com timer iniciado no clique, token OAuth expirado e limpo ao carregar, PWA config tem smoke
  unitario e `state.ts` foi dividido em modulos auxiliares. Em 2026-06-09, links externos passaram a
  aguardar a persistencia do log antes de abrir o Lichess; se o navegador usar a aba atual, o treino ja
  esta salvo antes da saida.
- Polish de 2026-06-07/2026-06-08: `sonner` e `lucide-react` adicionados; Hoje ficou treino-first com
  diagnostico em `<details>`; card pendente mostra `Abrir no Lichess`, `Concluir` e `Pular`, e so conclui
  depois de `Facil`/`Bom`/`Dificil`; Config tem secoes Essencial, Lichess opcional e Dados locais;
  `npm run lint`, `npm run test` e `npm run build` passaram no fechamento; capturas finais Playwright
  desktop/mobile foram salvas em `output/playwright/`.
- Ajuste de uso real em 2026-06-08: sem partida terminada especifica, blocos `review`/`transfer` nao devem
  abrir `https://lichess.org/analysis`; para garfos e outros temas taticos eles ficam em treino concreto
  do tema. Planos antigos com `Revisao curta` apontando para Analysis sao normalizados para o foco semanal.
- Ajuste de uso real em 2026-06-08: plano diario nao pode reiniciar sempre na mesma licao guiada de
  Practice. Ao criar/reparar o plano do dia, o app consulta o plano anterior salvo; `good` depois de
  `guided` avanca para `retrieval`, abrindo puzzle theme variado como `https://lichess.org/training/fork`.
- Ajuste de uso real em 2026-06-08: filtros genericos da biblioteca de videos do Lichess (`/video?tags=...`)
  nao sao mais destinos gerados. O app usa video direto `/video/:id`, Practice especifico ou puzzle theme;
  planos antigos com filtro de video sao normalizados para recurso concreto da fraqueza.
- Professor Lemos Etapa 1 em 2026-06-08: dominio puro ganhou `computeConsistency`, `diagnose` e
  `buildSessionMessage`; a tela Hoje renderiza `TutorCard` depois do cabecalho. Sem rede nova, sem
  engine, sem PGN persistido e sem diagnostico por tema ainda.
- Professor Lemos Etapa 2A em 2026-06-08: plano de implementacao registrado em
  `docs/superpowers/plans/2026-06-08-professor-lemos-tutor-etapa2a.md`; `diagnose` usa `PuzzleThemeStats`
  quando ha volume claro, `summarizePuzzleActivity` preserva `themeStats`, e o gerador aplica adaptacao
  na proxima sessao sem reescrever blocos feitos. `createTutorQuestionSignal` registra respostas do
  Lemos como sinais manuais sem apagar sinais anteriores.
- Professor Lemos Etapa 2B em 2026-06-08: catalogo ativo passou a ter metadados de curadoria, 12 videos
  diretos, 7 estudos comunitarios de reforco e lista separada de estudos rejeitados. Ranking por estagio
  agora usa video direto em `explain`, Practice em `guided` quando existir, puzzle themes/ferramentas em
  `retrieval/review/transfer`, Puzzle Streak para `time-trouble` e evita Analysis generico. Gate final
  verde: `npm run test -- --run`, `npm run lint`, `npm run build`; smoke Playwright desktop/mobile salvo
  em `output/playwright/catalog-2b-today-*-2026-06-08.png`.
- Catalogo Premium Lichess em 2026-06-08: `fetchPuzzleDashboard` e `fetchPuzzleReplay` usam apenas
  endpoints oficiais e escopo `puzzle:read`; replay salva somente `theme`, `days`, `nb`,
  `remainingCount` e destino seguro `/training/{theme}`. O gerador passa `profile.band`, minutos e
  `PuzzleThemeStats` para o seletor; revisao curta pode virar replay quando ha erro real no tema.
  Gate verde: `npm run lint`, `npm run test`, `npm run build`; smoke Browser desktop Today/TutorCard e
  Playwright CLI desktop/mobile salvos em `output/playwright/premium-catalog-*-2026-06-08.png`.
- Ajuste de uso real em 2026-06-08: ao concluir todos os blocos do dia, a tela Hoje mostra um resumo
  de fechamento com blocos feitos, tempo registrado, feedback, placar de puzzles quando reconciliado
  e a proxima sessao do roadmap. O placar curto do Professor Lemos tambem passou a pluralizar
  corretamente `certo/errado`.
- Estabilizacao final em 2026-06-09: o resumo de fechamento tambem aparece quando todos os blocos
  foram pulados, sem contar bloco pulado como puzzle pendente; abertura/reabertura no Lichess aguarda
  `saveTrainingLog` antes de chamar `window.open`.
- Ajuste de uso real em 2026-06-09: aula guiada fixa de Practice (`The Fork`) nao deve repetir em dias
  seguidos so porque o bloco anterior ficou sem feedback. Se o tema guiado ja apareceu em plano anterior,
  o proximo plano usa treino variado de puzzles (`https://lichess.org/training/fork`).

Dados do dono confirmados: Lichess `jukasparov`; Chess.com `jukatavares`; band **800-1200**
(tema fixo P0 = `fork`). P1: Chess.com como fonte primaria de diagnostico, **historico completo**
(serial + cache), parse transiente, so sinais derivados. O Signal `color` carrega `games` alem de
`lossRate`, porque a regra de desequilibrio por cor exige minimo de partidas. Onboarding P1 importa nivel/temas conhecidos
(inclusive observados no ChessKing) como Signals manuais genericos `source:'outro'` (ver spec 14.3,
ADR-005, ADR-008) — sem taxonomia ChessKing, prints so locais, sem OCR. Mapeamento de temas CONFIRMADO
pelo dono (forcas: mate em 1/capturas/tatica basica/finais basicos; fraquezas: fork/hanging-piece,
discovered, mate-in-2, endgame-pawn, calculo). short_name do PWA: "Rotina" (provisorio).
Handoff de execucao P0 para o Codex: `prompts/handoff-codex-P0.md`. Tarefa 1 (scaffold) estava feita
antes desta retomada; tarefas 2-9 executadas pelo Codex nesta sessao. Dev server local em
`http://127.0.0.1:5173/` foi deixado rodando para teste manual.
