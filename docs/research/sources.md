# Fontes Oficiais E Pesquisa Base

Esta pagina registra as fontes que sustentam a arquitetura proposta. Antes de implementar, agentes devem revalidar detalhes atuais nas fontes oficiais.

## Pesquisa Pontual Em 2026-06-06: Lichess Studies

Pesquisa executada para avaliar se a ferramenta pessoal deveria criar/usar estudos do Lichess como destino de treino.

- [Lichess API specification](https://github.com/lichess-org/api/blob/master/doc/specs/lichess-api.yaml): confirmou tag `Studies`, escopos OAuth `study:read` e `study:write`, e regra geral de rate limit.
- [Lichess OAuth endpoint spec](https://github.com/lichess-org/api/blob/master/doc/specs/tags/oauth/oauth.yaml): confirmou Authorization Code Flow com PKCE, `code_verifier`, `state`, `code_challenge_method=S256`, redirecionamento com `code`/`state` e cuidado para nao expor `code_verifier`.
- [Create a new Study](https://github.com/lichess-org/api/blob/master/doc/specs/tags/studies/api-study.yaml): confirmou `POST /api/study`, criacao de estudo vazio, limite de ate 30 novos estudos por dia e exigencia de `study:write`.
- [Import PGN into a study](https://github.com/lichess-org/api/blob/master/doc/specs/tags/studies/api-study-studyId-import-pgn.yaml): confirmou `POST /api/study/{studyId}/import-pgn`, criacao de capitulos por PGN, modos `practice`, `conceal` e `gamebook`, limite de 64 capitulos por estudo e exigencia de `study:write`.
- [Update study chapter moves](https://github.com/lichess-org/api/blob/master/doc/specs/tags/studies/api-study-studyId-chapterId-moves.yaml): confirmou substituicao da arvore de lances por PGN em capitulo existente e exigencia de `study:write`.
- [Export all chapters](https://github.com/lichess-org/api/blob/master/doc/specs/tags/studies/api-study-studyId.pgn.yaml): confirmou exportacao PGN de estudo, leitura publica limitada a estudos publicos nao-unlisted quando sem autenticacao, e leitura completa com `study:read`.
- [Lichess API Tips](https://lichess.org/page/api-tips): revalidou preferencia por API oficial em vez de scraping/browser automation, regra de uma requisicao por vez e espera minima de 1 minuto apos HTTP 429.

## Pesquisa Pontual Em 2026-06-06: Fechamento P3 OAuth/Studies/Lichess

Pesquisa revalidada antes de fechar P3 e congelar P4/P5.

- [Lichess API specification](https://github.com/lichess-org/api/blob/master/doc/specs/lichess-api.yaml): revalidou endpoint base `https://lichess.org`, rate limit de uma requisicao por vez, espera minima apos HTTP 429, PKCE, tokens long-lived e cuidado para nao hardcodar/expor tokens.
- [Lichess OAuth endpoint spec](https://github.com/lichess-org/api/blob/master/doc/specs/tags/oauth/oauth.yaml): revalidou Authorization Code Flow with PKCE, `state`, `code_verifier`, `code_challenge_method=S256`, `scope` e hint `username`.
- [Lichess token endpoint spec](https://github.com/lichess-org/api/blob/master/doc/specs/tags/oauth/api-token.yaml): revalidou `POST /api/token` com `authorization_code`, `code_verifier`, `redirect_uri`, `client_id`, resposta `Bearer`/`expires_in`, e `DELETE /api/token` para revogar.
- [Get your puzzle activity](https://github.com/lichess-org/api/blob/master/doc/specs/tags/puzzles/api-puzzle-activity.yaml): revalidou `GET /api/puzzle/activity`, NDJSON, parametros `max`, `before`, `since` e escopo `puzzle:read`.
- [Lichess games export spec](https://github.com/lichess-org/api/blob/master/doc/specs/tags/games/api-games-user-username.yaml): revalidou export NDJSON de partidas de usuario; o app usa `moves=false`, `pgnInJson=false`, `opening=true`, `accuracy=true`, `finished=true`, `sort=dateDesc` e nao envia `analysed=true`, para nao descartar sinais baratos de abertura/cor.
- [Create a new Study](https://github.com/lichess-org/api/blob/master/doc/specs/tags/studies/api-study.yaml): revalidou `POST /api/study`, `visibility` public/unlisted/private, limite de 30 estudos/dia e exigencia de `study:write`.
- [Import PGN into a study](https://github.com/lichess-org/api/blob/master/doc/specs/tags/studies/api-study-studyId-import-pgn.yaml): revalidou `POST /api/study/{studyId}/import-pgn`, multiplos capitulos por PGN, limite de 64 capitulos e exigencia de `study:write`.
- [Study user selection schema](https://github.com/lichess-org/api/blob/master/doc/specs/schemas/StudyUserSelection.yaml): revalidou valores permitidos `nobody`, `owner`, `contributor`, `member`, `everyone` para permissoes do Study.

## Pesquisa Pontual Em 2026-06-06: PWA P0

Pesquisa executada durante a implementacao P0 do app instalavel/offline-shell.

- [MDN: Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable): confirmou manifest como requisito de instalabilidade, uso comum de service worker para experiencia offline, e icones 192px/512px.
- [MDN: CycleTracker manifest and iconography](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Tutorials/CycleTracker/Manifest_file): confirmou membros de manifest usados na P0 (`name`, `short_name`, `start_url`, `display`, cores e icones) e que HTTPS/localhost permite reconhecimento como PWA.
- [MDN: start_url](https://developer.mozilla.org/en-US/docs/Web/Manifest/Reference/start_url): confirmou que `start_url` define a URL aberta ao iniciar o app instalado e pode ser requisito de instalabilidade em alguns browsers.

## Pesquisa Pontual Em 2026-06-06: Chess.com P1

Pesquisa executada antes de implementar o coletor P1 de diagnostico primario.

- [Chess.com Help Center: What is the PubAPI and how do I use it?](https://support.chess.com/en/articles/9650547-what-is-the-pubapi-and-how-do-i-use-it): confirmou que a PubAPI e REST, JSON-LD e read-only, nao inclui dados privados como chat, documenta cache, `ETag`/`Last-Modified`, resposta 429 e recomenda acesso serial para evitar rate limit.
- [Chess.com Published-Data API](https://www.chess.com/news/view/published-data-api): confirmou endpoints `GET /pub/player/{username}/stats`, `GET /pub/player/{username}/games/archives` e `GET /pub/player/{username}/games/{YYYY}/{MM}`, campos dos jogos mensais (`pgn`, `time_class`, `rules`, `white/black.result`, `accuracies`, `eco`) e codigos de resultado como `win`, `timeout`, `resigned`, `checkmated`, `stalemate`, `timevsinsufficient`.

## Pesquisa Pontual Em 2026-06-06: Lichess Puzzle Activity P2

Pesquisa executada antes de preparar a reconciliacao de resultados de treino em puzzles.

- [Lichess API specification](https://github.com/lichess-org/api/blob/master/doc/specs/lichess-api.yaml): confirmou endpoints de puzzles e escopo OAuth `puzzle:read` para ler atividade de puzzles; manteve escopos de jogo (`board:play`, `bot:play`, `challenge:*`) fora do escopo permitido.
- [Get your puzzle activity](https://github.com/lichess-org/api/blob/master/doc/specs/tags/puzzles/api-puzzle-activity.yaml): confirmou `GET /api/puzzle/activity`, resposta `application/x-ndjson`, ordenacao por ordem cronologica reversa, parametros `max`, `before` e `since`, e exigencia de OAuth `puzzle:read`.
- [PuzzleActivity schema](https://github.com/lichess-org/api/blob/master/doc/specs/schemas/PuzzleActivity.yaml): confirmou campos `date`, `win` e `puzzle{id,rating,themes}` usados para resumir puzzles resolvidos, acertos, erros e temas.

## Pesquisa Pontual Em 2026-06-06: Destino De Abertura P2

Pesquisa executada apos observar que `https://lichess.org/learn` era generico demais e que o
explorador em `https://lichess.org/analysis#explorer` era uma ferramenta livre, nao uma aula guiada,
para o bloco "principios de abertura".

- [Lichess Features](https://lichess.org/features): confirmou que o Lichess oferece ferramentas
  especificas de `Analysis board`, `Openings` e `Video library`.
- [Lichess beginner + opening videos](https://lichess.org/video?tags=beginner%2Fopening): confirmou
  uma pagina filtrada de aulas de abertura para iniciantes, incluindo conteudo de principios/ideias de
  abertura, mais adequada para o bloco de "principios de abertura" que o explorador livre.
- [Lichess opening principles videos](https://lichess.org/video?tags=opening+principles): confirmou que
  a busca especifica por `opening principles` reduz a lista para 3 aulas focadas, em vez de uma biblioteca
  generica de abertura.
- [Must-Know Opening Principles - Central Control](https://lichess.org/video/gpsZAim-mYc?tags=opening+principles):
  confirmado como destino direto para principios de abertura porque a propria pagina descreve os tres objetivos
  centrais da abertura: controle central, desenvolvimento e seguranca do rei.

## Pesquisa Pontual Em 2026-06-06: Catalogo De Recursos Lichess P2

Pesquisa executada para trocar uma allowlist rasa de destinos por um catalogo tipado de estudos,
temas de puzzle, modos de treino e filtros de video. O catalogo e estatico/curado: nao faz scraping,
nao baixa puzzles, nao persiste PGN e so guarda metadados de destinos oficiais.

- [Lichess API Tips](https://lichess.org/page/api-tips): revalidou preferencia por API oficial em vez
  de scraping/browser automation e regra de uma requisicao por vez com espera minima de 1 minuto apos
  HTTP 429.
- [Lichess Practice source](https://raw.githubusercontent.com/lichess-org/lila/master/modules/practice/src/main/PracticeSections.scala):
  confirmou a estrutura oficial atual de Practice: 5 secoes e 32 estudos (`Checkmates`,
  `Fundamental Tactics`, `Advanced Tactics`, `Pawn Endgames`, `Rook Endgames`).
- [Lichess Practice structure source](https://raw.githubusercontent.com/lichess-org/lila/master/modules/practice/src/main/PracticeStructure.scala):
  confirmou que os estudos de Practice sao identificados por `StudyId`, slug de nome e capitulos
  preenchidos pelo backend, com 233 capitulos totais na estrutura oficial.
- [Lichess puzzle theme source](https://raw.githubusercontent.com/lichess-org/lila/master/translation/source/puzzleTheme.xml):
  confirmou os slugs oficiais de temas de puzzle usados em `/training/{theme}`, como `fork`,
  `hangingPiece`, `pin`, `skewer`, `mateIn2`, `backRankMate`, `pawnEndgame`, `rookEndgame` e outros.
- [Lichess puzzle API specs](https://github.com/lichess-org/api/tree/master/doc/specs/tags/puzzles):
  confirmou que resultados pessoais de puzzles dependem de endpoints oficiais e OAuth `puzzle:read`;
  o catalogo local guarda apenas destinos/temas, nao dados de resolucao.
- [Lichess Video module](https://raw.githubusercontent.com/lichess-org/lila/master/modules/video/src/main/Video.scala)
  e [Video API source](https://raw.githubusercontent.com/lichess-org/lila/master/modules/video/src/main/VideoApi.scala):
  confirmaram que a biblioteca de videos e dinamica e filtravel por tags; o app recomenda filtros
  estaveis como `beginner/opening`, em vez de tentar congelar a lista completa de videos.
- [Lichess training themes](https://lichess.org/training/themes), [Puzzle Streak](https://lichess.org/streak),
  [Puzzle Storm](https://lichess.org/storm) e [Puzzles from player games](https://lichess.org/training/of-player):
  confirmaram destinos publicos de treino que podem ser recomendados sem criar tabuleiro proprio.

## Pesquisa Pontual Em 2026-06-08: Videos Lichess Como Destino Concreto

Pesquisa executada apos uso real mostrar que filtros de video como `/video?tags=beginner%2Ftactics`
levavam a paginas de busca/lista, genericas demais para o bloco diario.

- [Lichess routes source](https://github.com/lichess-org/lila/blob/master/conf/routes): confirmou as
  rotas oficiais `GET /video` para a biblioteca e `GET /video/:id` para uma aula especifica.
- [Lichess Video API source](https://raw.githubusercontent.com/lichess-org/lila/master/modules/video/src/main/VideoApi.scala):
  confirmou que `byTags` recebe tags e retorna uma pagina paginada de videos; portanto `?tags=...` e
  um filtro de biblioteca, nao uma aula fechada.
- [Must-Know Opening Principles - Central Control](https://lichess.org/video/gpsZAim-mYc): revalidado
  como aula direta de principios de abertura em `/video/:id`. Decisao de implementacao: destinos novos
  do app podem usar video direto `/video/:id`, Practice ou puzzle theme; filtros genericos `/video?tags=...`
  ficam apenas como legado a normalizar.

## Pesquisa Local Em 2026-06-06: LEARN CHESS

Pesquisa executada para sintetizar auditorias, estudos de concorrentes e pesquisa pedagogica da pasta local
`C:\Users\tavar\OneDrive\Documentos\CLAUDE CODE\LEARN CHESS` em um playbook de planos Lichess.

- `PROJECT_MEMORY.md`, `PLANO.md` e `ROADMAP.md`: usados para recuperar contrato pedagogico, invariantes e
  ordem de habilidades.
- `docs/research/MASTER-SINTESE-PESQUISAS-2026-06-04.md`: usado para a tese central de erro -> causa ->
  repeticao -> transferencia.
- `docs/research/zero-to-1000.md`, `RELATORIO-PEDAGOGIA-CODEX.md`, `META-ANALISE-PEDAGOGIA.md` e
  `SINTESE-PEDAGOGIA-ANTIGRAVITY.md`: usados para principios de primeira tentativa, transferencia, interleaving,
  progressao conceitual e revisao espacada.
- `docs/research/PESQUISA-PUZZLES-PEDAGOGIA-CONSOLIDADA.md`: usado como fonte de alto nivel para
  `conceptVariant`, `difficultyStep`, formatos variados e curadoria por qualidade.
- Sinteses em `docs/history/research/competitive-analysis/`: usadas somente para padroes abstratos de produto
  e ensino, como coach contextual, planos personalizados, SRS, revisao de erros e game feel.
- Nao foram usados APKs brutos, codigo decompilado, assets, textos de aula, bancos proprietarios, listas de
  puzzles pagos ou conteudo protegido. O playbook gerado aplica apenas recursos oficiais do Lichess e principios
  pedagogicos abstratos.

## Pesquisa Externa Em 2026-06-06: Auditoria Global Estrategica

Pesquisa executada para `docs/review/relatorio-codex-torre-aberta-lichess-tutor.md`.

- [Lichess API Tips](https://lichess.org/page/api-tips): confirmou regra de uma requisicao por vez e espera minima de 1 minuto apos HTTP 429.
- [Lichess Terms of Service](https://lichess.org/terms-of-service): confirmou restricoes de fair play, uso de servicos, doacoes e risco de assistencia externa.
- [Lichess Fair Play](https://lichess.org/page/fair-play): confirmou proibicao de assistencia externa durante partidas em tempo real e cuidado com extensoes/programas.
- [Lichess API specification](https://github.com/lichess-org/api/blob/master/doc/specs/lichess-api.yaml): confirmou escopos OAuth, incluindo escopos a evitar no MVP como `board:play`, `bot:play`, `challenge:*` e `msg:write`.
- [Lichess About](https://lichess.org/about): confirmou modelo gratuito/open-source/doacoes e escala publica declarada.
- [Lichess Features](https://lichess.org/features): confirmou recursos gratuitos existentes, como puzzles, studies, insights, analise e Learn from your mistakes.
- [Lichess Database](https://database.lichess.org/): confirmou licenca CC0 e dados publicos de jogos, puzzles e avaliacoes.
- [Chess.com Membership](https://www.chess.com/membership): revisao de recursos e precos premium exibidos em 2026-06-06.
- [Chess.com Courses announcement](https://www.chess.com/news/view/announcing-courses): confirmou integracao de recursos Chessable/Courses e MoveTrainer no ecossistema Chess.com.
- [Chess.com MoveTrainer scheduling](https://support.chess.com/en/articles/10319322-how-does-the-spaced-repetition-scheduling-work): confirmou modelo de revisao espacada por niveis.
- [Chess.com Q1 2026 Quarterly Report](https://www.chess.com/board-reports/2026-q1): usado para sinais de crescimento de Chessable/Courses e ChessKid.
- [Aimchess](https://aimchess.com/): revisao de concorrente com analytics, licoes personalizadas, planos semanais e precos.
- [ChessTempo Memberships](https://chesstempo.com/memberships/): revisao de concorrente de tacticas, finais, abertura, database e planos pagos.
- [DecodeChess Features](https://decodechess.com/features/): revisao de explicacao de lances, planos e analise baseada em Stockfish.
- [Learn Chess with Dr. Wolf](https://www.learnchesswithdrwolf.com/): revisao de app de coach/tutor com licoes, comentarios e treino de erros.
- [Noctie](https://noctie.ai/): revisao de AI trainer human-like, treino de aberturas, feedback e puzzles de erros.
- [Lucas Chess](https://lucaschess.pythonanywhere.com/): revisao de suite gratuita de treino desktop.
- [Listudy](https://listudy.org/en): revisao de ferramenta gratuita/open-source de repeticao espacada.
- [OpeningTree GitHub](https://github.com/openingtree/openingtree): revisao de ferramenta open-source para arvore de aberturas com jogos Chess.com/Lichess/PGN.
- [Cloudflare Workers Pricing](https://developers.cloudflare.com/workers/platform/pricing/): revisao de custo atual de Workers.
- [Cloudflare Workers Limits](https://developers.cloudflare.com/workers/platform/limits/): revisao de limites de requests, CPU e subrequests.
- [Cloudflare D1 Pricing](https://developers.cloudflare.com/d1/platform/pricing/): revisao de rows read/written e storage.
- [MDN: Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable): revisao de requisitos de instalabilidade PWA.
- [Reddit r/chess: The Lichess Tutor](https://www.reddit.com/r/chess/comments/1r6uo9x/the_lichess_tutor/): evidencia comunitaria de que existe recurso/rota Lichess Tutor em 2026. Usar apenas como sinal comunitario, nao como fonte oficial.

## Pesquisa Externa Em 2026-06-06: Revisao Codex Do Spec Unificado

Pesquisa executada para `docs/review/relatorio-codex-revisao-spec-unificado-2026-06-06.md`.

- [Lichess API Tips](https://lichess.org/page/api-tips): revalidou uma requisicao por vez e espera minima de 1 minuto apos HTTP 429.
- [Lichess API specification](https://github.com/lichess-org/api/blob/master/doc/specs/lichess-api.yaml): revalidou OAuth PKCE, token long-lived, escopos sensiveis e endpoints disponiveis.
- [Lichess games export spec](https://github.com/lichess-org/api/blob/master/doc/specs/tags/games/api-games-user-username.yaml): revalidou `GET /api/games/user/{username}`, NDJSON, filtros e parametros como `max`, `rated`, `analysed`, `moves`, `pgnInJson`, `clocks`, `evals`, `accuracy`, `opening`, `finished` e `sort`.
- [Lichess user public data spec](https://github.com/lichess-org/api/blob/master/doc/specs/tags/users/api-user-username.yaml): revalidou leitura publica de usuario.
- [Lichess rating history spec](https://github.com/lichess-org/api/blob/master/doc/specs/tags/users/api-user-username-rating-history.yaml): revalidou historico publico de rating.
- [Lichess Puzzle Themes](https://lichess.org/training/themes): revalidou temas publicos de puzzles e confirmou categorias como fork, hanging piece, pin, skewer, mate in 1, mate in 2, back rank mate, pawn endgame e rook endgame.
- [Lichess Fair Play](https://lichess.org/page/fair-play): revalidou proibicao de assistencia externa durante partidas real-time.
- [Chess.com Published Data API](https://www.chess.com/news/view/published-data-api): revalidou API publica read-only, dados publicos, caching, 429 em acesso paralelo e recomendacao de user-agent identificavel.
- [MDN: Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable): revalidou requisitos de instalabilidade PWA.
- [Cloudflare Workers KV - How KV works](https://developers.cloudflare.com/kv/concepts/how-kv-works/): revalidou que KV e read-heavy e eventualmente consistente; mudancas podem levar ate 60s ou mais para aparecer em outras localidades.

## Pesquisa Externa Em 2026-06-06: Revisao Codex Da Proposta 2

Pesquisa executada para `docs/review/relatorio-codex-revisao-proposta2-rotina-pessoal-2026-06-06.md`.

- [Lichess API Tips](https://lichess.org/page/api-tips): revalidou regra de uma requisicao por vez, espera minima de 1 minuto apos HTTP 429 e preferencia por endpoint oficial em vez de scraping/browser automation.
- [Lichess games export spec](https://github.com/lichess-org/api/blob/master/doc/specs/tags/games/api-games-user-username.yaml): revalidou `GET /api/games/user/{username}`, streaming PGN/NDJSON, throttling anonimo/autenticado, e parametros `max`, `rated`, `perfType`, `analysed`, `moves`, `pgnInJson`, `clocks`, `evals`, `accuracy`, `opening`, `ongoing`, `finished` e `sort`.
- [Lichess raw games export spec](https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/tags/games/api-games-user-username.yaml): usado para conferir detalhes dos parametros sem ruido de HTML.
- [Lichess GameJson schema](https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/schemas/GameJson.yaml): revalidou campos de jogo em JSON/NDJSON e presenca de `analysis` top-level quando disponivel.
- [Lichess GamePlayerUser schema](https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/schemas/GamePlayerUser.yaml): revalidou `players.white/black.analysis` com `inaccuracy`, `mistake`, `blunder`, `acpl` e `accuracy` quando disponivel.
- [Lichess rating history spec](https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/tags/users/api-user-username-rating-history.yaml): revalidou historico publico de rating por usuario e formato `[year, month, day, rating]`.
- [Lichess user public data spec](https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/tags/users/api-user-username.yaml): revalidou leitura publica de usuario.
- [Lichess Fair Play](https://lichess.org/page/fair-play): revalidou proibicao de assistencia externa durante partidas real-time e restricoes a programas/extensoes que ajudem lances.
- [Lichess Puzzle Themes](https://lichess.org/training/themes): revalidou existencia de temas e links publicos, mas tambem mostrou que a "validacao dinamica" por runtime dependeria de HTML, nao de API oficial documentada.
- [Chess.com Published Data API](https://www.chess.com/news/view/published-data-api): revalidou API publica read-only, acesso serial, 429 para requisicoes paralelas, cache por ETag/Last-Modified, campos ausentes em `/stats` e recomendacao de user-agent reconhecivel.
- [Cloudflare D1 Pricing](https://developers.cloudflare.com/d1/platform/pricing/): revalidou limites Free de D1, billing por rows read/written e storage, e ausencia de custo de egress de D1.
- [Cloudflare D1 Global Read Replication](https://developers.cloudflare.com/d1/best-practices/read-replication/): revalidou que read replicas sao assincronas e que Sessions API garante consistencia sequencial por sessao.
- [Cloudflare Workers KV - How KV works](https://developers.cloudflare.com/kv/concepts/how-kv-works/): revalidou consistencia eventual de KV e inadequacao para operacoes atomicas/transacionais.
- [MDN: Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable): revalidou requisitos de manifest, icones 192/512, `start_url`, `display`, HTTPS/localhost/loopback e papel opcional, mas comum, de service worker para offline.

## Pesquisa Externa Em 2026-06-07: UX/UI E Bibliotecas Prontas

Pesquisa executada para criar o prompt de auditoria multi-IA em `prompts/ux-ui-community-audit.md`.
Objetivo: orientar avaliacao de funcionamento UX/UI e investigacao de componentes prontos da comunidade,
sem violar clean-room, privacidade, PWA local-first ou fases congeladas.

- [Radix UI Primitives](https://www.radix-ui.com/primitives/docs/overview/introduction): confirmou primitives
  open-source, acessiveis, sem estilo, adotaveis incrementalmente e tree-shakeable por componente.
- [shadcn/ui manual installation](https://ui.shadcn.com/docs/installation/manual): confirmou dependencia de
  Tailwind CSS e pacotes como `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react` e
  `tw-animate-css`.
- [shadcn/ui project ready / registries](https://ui.shadcn.com/docs/new): confirmou modelo de copiar codigo
  dos componentes para o projeto, blocos prontos e registries comunitarias.
- [React Aria](https://react-aria.adobe.com/): confirmou componentes style-free com foco em acessibilidade,
  interacoes touch/keyboard/screen reader, forms e internacionalizacao.
- [Ariakit Components](https://ariakit.com/components): confirmou componentes acessiveis baseados em padroes
  WAI-ARIA para dialog, disclosure, menu, select, tabs, toolbar e tooltip.
- [Headless UI](https://headlessui.com/): confirmado como biblioteca de componentes React sem estilo e
  orientada a acessibilidade.
- [Mantine](https://mantine.dev/): confirmou biblioteca completa de componentes e hooks React, componentes
  prontos responsivos mantidos pela comunidade e numeros publicos de adocao exibidos pelo site.
- [Material UI overview](https://mui.com/material-ui/getting-started/): confirmou biblioteca React completa,
  open-source, pronta para producao e baseada em Material Design.
- [Chakra UI components](https://chakra-ui.com/docs/components/concepts/overview): confirmou catalogo amplo de
  componentes modernos e acessiveis, incluindo dialogs, drawers, alerts, data list, date picker e forms.
- [Lucide React](https://lucide.dev/guide/react): confirmou pacote React de icones SVG inline, tree-shakeable,
  TypeScript e licenca ISC.
- [Sonner GitHub](https://github.com/emilkowalski/sonner): confirmou toast React MIT, suporte a React 18/19
  declarado em `peerDependencies` e uso simples por `<Toaster />` + `toast()`.
- [Recharts GitHub](https://github.com/recharts/recharts): confirmou biblioteca React/D3 para graficos, MIT,
  componentes declarativos e necessidade de `react-is` compatibilizado com a versao de React.
- [Open Props](https://open-props.style/): confirmou biblioteca MIT de design tokens CSS, framework-agnostic,
  util para padronizar spacing, radius, shadows, cores e animacoes sem trocar React/CSS.
- [Playwright visual comparisons](https://playwright.dev/docs/test-snapshots): confirmou suporte nativo a
  screenshot visual regression via `toHaveScreenshot()`.
- [Playwright accessibility testing](https://playwright.dev/docs/accessibility-testing): confirmou integracao
  recomendada com `@axe-core/playwright`, tags WCAG e limitacao de testes automatizados.
- [Testing Library user-event](https://testing-library.com/docs/user-event/intro/): confirmou simulacao de
  interacoes de usuario mais realista que `fireEvent`, util para fluxos de UX em testes React.
- Pesquisa complementar executada em 2026-06-07 para
  `docs/review/ux-ui-community-audit/relatorio-codex-ux-ui-comunidade-2026-06-07.md`:
  `npm view` confirmou versoes/licencas/peer dependencies de `@radix-ui/react-dialog`,
  `@radix-ui/react-select`, `react-aria-components`, `@ariakit/react`, `@headlessui/react`,
  `@base-ui-components/react`, `@mantine/core`, `@mui/material`, `@chakra-ui/react`, `sonner`,
  `lucide-react`, `recharts`, `@axe-core/playwright`, `@testing-library/user-event`, `open-props`,
  `@picocss/pico` e `tailwindcss`.
- [Base UI About](https://base-ui.com/react/overview/about): confirmado como alternativa headless acessivel
  open-source, ainda em `1.0.0-rc.0` na verificacao npm.
- [Pico CSS](https://picocss.com/): confirmou framework CSS minimalista para HTML semantico, MIT,
  responsivo e sem JavaScript.
- [Tremor](https://npm.tremor.so/): confirmou componentes React/Tailwind voltados a dashboards e charts,
  uteis como comparativo para uma futura tela de progresso, mas inadequados como dependencia imediata.
- Playwright via runtime bundled do Codex foi usado para capturar `Config`, `Hoje`, treino ativo e bloco
  concluido em desktop/mobile; artefatos salvos em `output/playwright/`.

## Lichess

- [Lichess API](https://lichess-org.github.io/api/): referencia oficial dos endpoints.
- [Lichess API Tips](https://lichess.org/page/api-tips): orientacao de rate limit. Regra central: uma requisicao por vez; apos 429, esperar pelo menos 1 minuto.
- [Lichess Database](https://database.lichess.org/): base publica. O site informa que exports sao CC0 e inclui puzzles, jogos e avaliacoes.
- [Lichess About](https://lichess.org/about): filosofia de app gratuito, livre, open-source e sustentado por doacoes.
- [Lichess Terms of Service](https://lichess.org/page/tos): revisar antes de qualquer feature publica.

## Chess.com

- [Chess.com Published Data API](https://www.chess.com/news/view/published-data-api): API publica read-only. Usar apenas importacao por username, sem login Chess.com no MVP.

## PWA

- [MDN: Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable): requisitos de instalabilidade e comportamento esperado.

## Cloudflare

- [Cloudflare Workers](https://developers.cloudflare.com/workers/): runtime planejado para API minima.
- [Cloudflare D1](https://developers.cloudflare.com/d1/): banco planejado para sync.
- [Cloudflare Workers Limits](https://developers.cloudflare.com/workers/platform/limits/): revisar limites antes do deploy.
- [Cloudflare Workers Pricing](https://developers.cloudflare.com/workers/platform/pricing/): revisar custo antes do deploy.

## Pesquisa Pedagogica Herdada Como Ideia

Do app antigo de estudo, aproveitar apenas principios:

- Erro vira explicacao causal.
- Repeticao espacada importa mais que XP.
- Primeira tentativa e sinal mais forte que retry.
- Partida revisada e ponte para transferencia.
- Tutor nao envergonha o aluno.

Nao copiar conteudo protegido, assets, puzzles proprietarios ou estrutura paga.
