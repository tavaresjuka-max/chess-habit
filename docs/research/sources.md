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

## Pesquisa Pontual Em 2026-06-16: Auditoria 360 Codex GPT-5

Pesquisa executada para `docs/review/analise_completa_codex-gpt-5_2026-06-16.md`.

- [Lichess API Tips](https://lichess.org/page/api-tips): revalidou preferencia por endpoint oficial em vez de scraping/browser automation, uma requisicao por vez e espera de 1 minuto apos HTTP 429.
- [Lichess games export spec](https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/tags/games/api-games-user-username.yaml): revalidou export em NDJSON/PGN, risco de respostas muito longas e parametros `max`, `moves`, `pgnInJson`, `accuracy`, `opening`, `finished` e `sort`.
- [Lichess OAuth endpoint spec](https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/tags/oauth/oauth.yaml): revalidou Authorization Code Flow with PKCE, `code_verifier`, `state`, `code_challenge_method=S256` e checagem de `state` no callback.
- [Lichess Create Study spec](https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/tags/studies/api-study.yaml): revalidou `POST /api/study`, limite de 30 novos estudos/dia, `visibility` e escopo `study:write`.
- [Chess.com Help Center: PubAPI](https://support.chess.com/en/articles/9650547-what-is-the-pubapi-and-how-do-i-use-it): revalidou API REST read-only, JSON-LD, ausencia de dados privados como chat, cache/ETag, 429 e recomendacao de acesso serial e user-agent identificavel.
- [Chess.com Published-Data API](https://www.chess.com/news/view/published-data-api): revalidou endpoints publicos, cache, respostas 304/429, rate limit em requisicoes paralelas e restricoes de marca/IP.
- [MDN: Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable): revalidou requisitos de manifest, icones 192/512, `start_url`, `display`, HTTPS/localhost/loopback e uso comum de service worker para experiencia offline.

## Pesquisa Pontual Em 2026-06-17: Analise Completa Do Sistema

Pesquisa executada para `docs/review/analise-completa-sistema-2026-06-17-{IA_NOME}.md`.

- [Lichess API Tips](https://lichess.org/page/api-tips): revalidou regra operacional de uma requisicao por vez e espera minima de 1 minuto apos HTTP 429; usada para avaliar `providerQueue.ts` e riscos de `Retry-After`.
- [Lichess API specification](https://github.com/lichess-org/api/blob/master/doc/specs/lichess-api.yaml): revalidou OAuth PKCE para clientes publicos, ausencia de refresh token, cuidado para nao expor tokens e existencia de escopos de jogo proibidos (`board:play`, `bot:play`) que nao devem entrar no app.
- [Chess.com Help Center: What is the PubAPI and how do I use it?](https://support.chess.com/en/articles/9650547-what-is-the-pubapi-and-how-do-i-use-it): revalidou que a PubAPI e REST/JSON-LD, read-only, sem comandos de jogo nem dados privados como chat; usada para confirmar a moldura do importador Chess.com.
- [Chess.com Published-Data API](https://www.chess.com/news/view/published-data-api): revalidou endpoints de `stats`, arquivos mensais de partidas e campos de resposta como `pgn`, `end_time`, `accuracies`; usada para confirmar que PGN deve continuar transiente.
- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP): revalidou que CSP reduz riscos como XSS e clickjacking; usada para avaliar `vercel.json`.
- [MDN: Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API): revalidou uso de service worker para cache offline, atualizacao de recursos e remocao de caches antigos; usada para avaliar PWA/offline e smoke.
- [Cloudflare D1 local development](https://developers.cloudflare.com/d1/best-practices/local-development/): revalidou fluxo local com Wrangler/Miniflare e separacao entre dados locais e producao; usada para avaliar P4 sync local.
- [Cloudflare Workers local development](https://developers.cloudflare.com/workers/local-development/): revalidou `wrangler dev`, simulacao local e Miniflare/workerd; usada para avaliar testabilidade local do backend P4.
- [Vercel vercel.json](https://vercel.com/docs/project-configuration): revalidou suporte a `headers` no `vercel.json`; usada para avaliar anti-indexacao e hardening de headers.
- [GNU AGPLv3](https://www.gnu.org/licenses/agpl-3.0.html): revalidou obrigacao de disponibilizar codigo-fonte correspondente a usuarios via rede; usada para avaliar readiness P5 e exibicao publica da licenca.

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

## Pesquisa Externa Em 2026-06-08: Curadoria Lichess Professor Lemos

Pesquisa executada para `docs/research/relatorio-codex-curadoria-lichess-professor-lemos-2026-06-08.md`.
Objetivo: mapear recursos oficiais, temas de puzzle, videos diretos, estudos comunitarios candidatos e
viabilidade tecnica/API para o catalogo adaptativo do Professor Lemos. Nao houve scraping, download de
PGN completo, copia de comentarios/capitulos, nem uso de conteudo pago/proprietario.

- [Lichess Practice](https://lichess.org/practice): confirmou secoes oficiais Checkmates,
  Fundamental Tactics, Advanced Tactics, Pawn Endgames e Rook Endgames, usadas como recursos A do catalogo.
- [Lichess Practice source](https://raw.githubusercontent.com/lichess-org/lila/master/modules/practice/src/main/PracticeSections.scala)
  e [PracticeStructure source](https://raw.githubusercontent.com/lichess-org/lila/master/modules/practice/src/main/PracticeStructure.scala):
  revalidaram `sectionId`, `studyId`, titulos oficiais e estrutura de Practice.
- [Lichess Learn](https://lichess.org/learn): confirmado como destino oficial para fundamentos basicos,
  sem necessidade de OAuth do app.
- [Lichess Puzzle Themes](https://lichess.org/training/themes) e
  [puzzleTheme.xml](https://raw.githubusercontent.com/lichess-org/lila/master/translation/source/puzzleTheme.xml):
  revalidaram slugs como `hangingPiece`, `fork`, `pin`, `skewer`, `discoveredAttack`, `mateIn1`,
  `mateIn2`, `backRankMate`, `pawnEndgame`, `rookEndgame`, `defensiveMove`, `advantage`, `crushing`,
  `long`, `veryLong` e `healthy mix`.
- [Lichess API Tips](https://lichess.org/page/api-tips): revalidou regra de uma requisicao por vez e
  espera minima de 1 minuto apos HTTP 429.
- [Lichess Fair Play](https://lichess.org/page/fair-play): revalidou proibicao de assistencia externa
  durante jogos em andamento; catalogo deve recomendar analise apenas de partidas terminadas.
- [Lichess Database](https://database.lichess.org/): revalidou CC0 dos exports e formato dos puzzles,
  mas a decisao desta rodada foi nao criar tabuleiro proprio nem persistir puzzles/PGNs.
- [Puzzle activity](https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/tags/puzzles/api-puzzle-activity.yaml),
  [Puzzle dashboard](https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/tags/puzzles/api-puzzle-dashboard-days.yaml),
  [Puzzle next](https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/tags/puzzles/api-puzzle-next.yaml),
  [Puzzle batch](https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/tags/puzzles/api-puzzle-batch-angle.yaml),
  [Puzzle by ID](https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/tags/puzzles/api-puzzle-id.yaml) e
  [Puzzle replay](https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/tags/puzzles/api-puzzle-replay-days-theme.yaml):
  confirmaram viabilidade de leitura com `puzzle:read`, existencia de `puzzle:write` no batch solve
  (proibido pelo projeto), e alerta oficial para nao enumerar puzzles via API.
- [Create a Study](https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/tags/studies/api-study.yaml) e
  [Import PGN into a Study](https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/tags/studies/api-study-studyId-import-pgn.yaml):
  revalidaram `study:write`, limite de criacao/chapters e viabilidade do Study privado do dia com PGN
  transiente e limpo.
- [Study metadata/export specs](https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/tags/studies/api-study-by-username.yaml),
  [study PGN export](https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/tags/studies/api-study-studyId.pgn.yaml) e
  [chapter PGN export](https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/tags/studies/api-study-studyId-chapterId.pgn.yaml):
  confirmaram que exportar estudos envolve PGN/comentarios/variacoes; usar apenas para verificacao
  tecnica futura, nao para copiar conteudo comunitario.
- [Games user export](https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/tags/games/api-games-user-username.yaml),
  [User public data](https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/tags/users/api-user-username.yaml),
  [Rating history](https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/tags/users/api-user-username-rating-history.yaml) e
  [Perf stats](https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/tags/users/api-user-username-perf-perf.yaml):
  revalidaram sinais publicos/terminados e parametros para evitar PGN completo (`moves=false`,
  `pgnInJson=false`) quando o Lichess for fonte secundaria.
- Videos diretos da biblioteca Lichess verificados como candidatos especificos:
  [Opening Principles](https://lichess.org/video/gpsZAim-mYc),
  [Hanging Pieces](https://lichess.org/video/wod7uXzkrTc),
  [Fork](https://lichess.org/video/mbiR0tcdqBY),
  [Pin](https://lichess.org/video/VjwSudAqLn8),
  [Skewer](https://lichess.org/video/ZexQ1kow1MM),
  [Discovered Attack](https://lichess.org/video/nMADfn1scbI),
  [Back Rank](https://lichess.org/video/spMQR31h0-0),
  [Mating Patterns](https://lichess.org/video/uhQhasudq9M),
  [Pawn Endgames](https://lichess.org/video/QUqq7wSLE78),
  [Calculation](https://lichess.org/video/-OoPm17P8xA),
  [Avoid Blunders](https://lichess.org/video/AYy2A6HIcU0) e
  [Convert Material Advantage](https://lichess.org/video/0-ouahZH8X4).
- Estudos comunitários candidatos/verificados por busca manual responsável:
  [Jomega Studies Table of Contents](https://lichess.org/study/vK3z4Pvu),
  [Beginner: Tactics (jomega)](https://lichess.org/study/g6vPzJv7),
  [Beginner: Simple Tactics I (jomega)](https://lichess.org/study/s3iOCawc),
  [Beginner: Simple Tactics II (jomega)](https://lichess.org/study/6JAUFQ5p),
  [Intermediate: Tactics Internalized (jomega)](https://lichess.org/study/q9bJ8YdY),
  [Beginner Endgames You Must Know (NoseKnowsAll)](https://lichess.org/study/wukLYIXj),
  [Intermediate Endgames You Must Know (NoseKnowsAll)](https://lichess.org/study/UsqmCsgC),
  [Advanced Endgames You Must Know (NoseKnowsAll)](https://lichess.org/study/UO2zqigQ),
  [Rook Endgames You Must Know (NoseKnowsAll)](https://lichess.org/study/bnboDhFM),
  [Mate in 2 CAN YOU SEE IT?](https://lichess.org/study/APSzIEsV),
  [Practical Endings: Pawns PART 1](https://lichess.org/study/dXKWlrkg) e
  [Pawn Endgames!](https://lichess.org/study/izZ71JC2). Decisão: comunitários entram como candidatos com revisão humana; estudos com risco de direitos/qualidade foram marcados como D no relatório.

## Pesquisa Pontual Em 2026-06-08: Implantacao Etapa 2B Catalogo Curado

Pesquisa executada durante a implantacao do catalogo curado. Nao houve scraping, download de PGN,
transcricao de estudos, copia de capitulos ou leitura de comentarios; a verificacao foi limitada a
status HTTP `HEAD` sequencial de URLs publicas.

- Videos diretos da biblioteca Lichess ativados no catalogo responderam `200`: `wod7uXzkrTc`,
  `mbiR0tcdqBY`, `VjwSudAqLn8`, `ZexQ1kow1MM`, `nMADfn1scbI`, `spMQR31h0-0`, `uhQhasudq9M`,
  `QUqq7wSLE78`, `-OoPm17P8xA`, `AYy2A6HIcU0` e `0-ouahZH8X4`.
- Estudos NoseKnowsAll ativados como `approved` responderam `200`: `wukLYIXj`, `UsqmCsgC` e
  `bnboDhFM`.
- Estudos jomega `Iof6LzcT`, `s3iOCawc`, `6JAUFQ5p` e `wzFrgluQ` responderam `200` e entram como
  `needs-human-review`; os candidatos `g6vPzJv7` e `q9bJ8YdY` responderam `404` e nao foram usados.
- Estudos rejeitados continuam fora do catalogo ativo: `dXKWlrkg`, `izZ71JC2` e `APSzIEsV`.

## Pesquisa Pontual Em 2026-06-08: Catalogo Premium Puzzle Dashboard/Replay

Pesquisa executada antes da implementacao local-first do catalogo premium. Nao houve scraping nem
persistencia de puzzle IDs, PGN, solucoes ou comentarios.

- [Puzzle Dashboard endpoint](https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/tags/puzzles/api-puzzle-dashboard-days.yaml):
  confirmou `GET /api/puzzle/dashboard/{days}`, resposta JSON e OAuth `puzzle:read`.
- [PuzzleDashboard schema](https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/schemas/PuzzleDashboard.yaml)
  e [exemplo oficial](https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/examples/puzzles-getYourPuzzleDashboard.json.yaml):
  confirmaram campos `days`, `global` e `themes`, com agregados `nb`, `firstWins`,
  `replayWins`, `puzzleRatingAvg` e `performance`. O app usa apenas agregados por tema.
- [Puzzle Replay endpoint](https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/tags/puzzles/api-puzzle-replay-days-theme.yaml):
  confirmou `GET /api/puzzle/replay/{days}/{theme}`, OAuth `puzzle:read` e 404 quando nao ha puzzles
  para replay.
- [PuzzleReplay schema](https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/schemas/PuzzleReplay.yaml)
  e [exemplo oficial](https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/examples/puzzles-getPuzzlesToReplay.json.yaml):
  confirmaram que a resposta inclui IDs em `remaining`; implementacao descarta esses IDs imediatamente
  e salva apenas `theme`, `days`, `nb`, `remainingCount` e destino publico seguro `/training/{theme}`.

## Pesquisa Pontual Em 2026-06-09: Garfos Sem Repetir Practice Fixo

Pesquisa executada apos uso real mostrar repeticao da aula fixa `The Fork` em dias consecutivos.

- [Lichess Puzzle Themes](https://lichess.org/training/themes): revalidou que `Fork` e um tema publico
  de puzzles com grande banco variado, adequado para repeticao diaria via `/training/fork`.
- [Puzzles: Fork](https://lichess.org/training/fork): confirmado como destino publico de treino variado
  por tema, sem criar tabuleiro proprio e sem API/escopo novo.
- [Lichess Practice: The Fork](https://lichess.org/practice/fundamental-tactics/the-fork/Qj281y1p):
  confirmado como aula guiada fixa de Practice, apropriada como primeira explicacao mas inadequada para
  repeticao automatica em dias seguidos.

## Pesquisa Pontual Em 2026-06-09: Metodo Professor Lemos

Pesquisa e consolidacao executadas para documentar o metodo pedagogico do app em
`docs/pedagogy/metodo-professor-lemos.md` e para explicitar na tela Hoje como o plano e montado,
como a confianca e comunicada e como progresso deve ser medido sem promessa de rating.

- [Spacing and retrieval review](https://www.nature.com/articles/s44159-022-00089-1): usado como base
  para tratar repeticao espacada e recuperacao ativa como mecanismos fortes de retencao, sem afirmar
  que so isso garante evolucao em xadrez.
- [Retrieval practice systematic review](https://link.springer.com/article/10.1007/s10648-021-09595-9):
  usado para sustentar que recuperar ativamente informacao/habilidade e melhor que apenas reler ou
  consumir explicacao, especialmente quando ha feedback.
- [Worked examples / cognitive load](https://www.sciencedirect.com/science/article/pii/S0361476X1000055X):
  usado para justificar `explain` e `guided` antes de `retrieval` para iniciantes, reduzindo carga
  cognitiva antes de puzzle variado.
- [The Role of Deliberate Practice in Chess Expertise](https://doi.org/10.1002/acp.1106) e
  [Deliberate Practice: Necessary But Not Sufficient](https://doi.org/10.1177/0963721411421922):
  usados para enquadrar pratica deliberada como importante no xadrez, mas insuficiente para promessa
  causal forte ou promessa de rating.
- [Learning Outcomes, Assessment, and Evaluation in Educational Recommender Systems](https://arxiv.org/abs/2407.09500):
  usado para registrar a lacuna de sistemas recomendadores educacionais: muitos recomendam recursos,
  menos medem efeito pedagogico real. Decisao: o app comunica confianca e limita suas metricas.
- Apps estudados em relatorios anteriores: Chess.com/Chessable, Aimchess, Noctie, Dr. Wolf,
  ChessTempo, Listudy e Chessdriller foram usados apenas como padroes abstratos de produto
  (repeticao, plano personalizado, coach contextual e revisao de erros), sem copiar conteudo,
  taxonomia paga, assets ou textos.

## Pesquisa Pontual Em 2026-06-09: Biblioteca De Literatura De Xadrez

Pesquisa executada para abrir a fase 1 de biblioteca local sobre livros, teses, artigos e metodos
de ensino de xadrez. Decisao legal: baixar apenas dominio publico, Project Gutenberg/espelho,
Creative Commons ou open access com PDF/licenca identificavel; material pago, preview, borrow,
assinatura, CDL ou upload moderno suspeito entra em lista de compra/revisao, nao em download.

- [Internet Archive Advanced Search](https://archive.org/advancedsearch.php): usado para consultar
  metadados de `mediatype:texts` por titulo/assunto/colecao e saida JSON.
- [Internet Archive Metadata API](https://archive.org/metadata/): usado para obter lista de arquivos
  por item antes de baixar.
- [Internet Archive Developers - Bots](https://archive.org/developers/bots.html): usado para orientar
  User-Agent descritivo, delays e respeito a bloqueios/rate limits.
- [Project Gutenberg permissions](https://www.gutenberg.org/policy/permission.html) e
  [Project Gutenberg robot access](https://www.gutenberg.org/policy/robot_access.html): usados para
  separar descoberta legal de raspagem e manter cuidado com marca/jurisdicao.
- [Gutendex](https://gutendex.com/): usado como discovery JSON de metadados Gutenberg, com filtro
  posterior contra falsos positivos como `duchess`.
- [OpenAlex Works API](https://docs.openalex.org/api-entities/works): usado para descobrir artigos OA
  com `open_access.is_oa:true` e `has_pdf_url:true`.
- [OpenAlex rate limits/authentication](https://docs.openalex.org/how-to-use-the-api/rate-limits-and-authentication):
  usado para tratar API como freemium/rate-limited e manter coleta em lotes.

## Lichess

- [Lichess API](https://lichess-org.github.io/api/): referencia oficial dos endpoints.
- [Lichess API Tips](https://lichess.org/page/api-tips): orientacao de rate limit. Regra central: uma requisicao por vez; apos 429, esperar pelo menos 1 minuto.
- [Lichess Database](https://database.lichess.org/): base publica. O site informa que exports sao CC0 e inclui puzzles, jogos e avaliacoes.
- [Lichess About](https://lichess.org/about): filosofia de app gratuito, livre, open-source e sustentado por doacoes.
- [Lichess Terms of Service](https://lichess.org/page/tos): revisar antes de qualquer feature publica.
- 2026-06-08: [lichess-org/api `api-puzzle-activity.yaml`](https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/tags/puzzles/api-puzzle-activity.yaml) e [schema `PuzzleActivity.yaml`](https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/schemas/PuzzleActivity.yaml) confirmaram `GET /api/puzzle/activity`, resposta `application/x-ndjson`, OAuth `puzzle:read`, parametros `max`, `before`, `since`, e campos `date`, `win`, `puzzle.id`, `puzzle.rating`, `puzzle.themes`. Usado para resumir estatisticas locais por tema sem guardar PGN ou solucao.
- 2026-06-10: [lichess-org/api `api-study.yaml`](https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/tags/studies/api-study.yaml) e [`api-study-studyId-import-pgn.yaml`](https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/tags/studies/api-study-studyId-import-pgn.yaml) confirmaram `POST /api/study`, `POST /api/study/{studyId}/import-pgn`, OAuth `study:write`, corpo `application/x-www-form-urlencoded`, PGN com multiplos jogos criando multiplos capitulos e limite oficial de 64 capitulos por Study.

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

## Pesquisa Frente 4 Em 2026-06-09: Paid Buylist de Livros e Recursos

Pesquisa executada para construir lista priorizada de recursos pagos (livros, cursos, software) de publishers oficiais.

### Plataformas e Lojas Oficiais Pesquisadas

- [New In Chess - Quality Chess page](https://www.newinchess.com/quality-chess): confirmou Yusupov Complete Series (Paperback €189.95 out of stock, Hardcover €299.90 out of stock / €224.93 special price), livros Quality Chess ~€23.99-34.99 cada.
- [New In Chess - search "Yusupov"](https://www.newinchess.com/catalogsearch/result/?q=Yusupov): confirmou precos individuais dos livros Yusupov (~€23.99-29.99), series Build Up/Boost/Chess Evolution (~€69.95 cada serie de 3 livros), The Fundamentals Series (€69.95).
- [New In Chess - search "Woodpecker Method"](https://www.newinchess.com/catalogsearch/result/?q=Woodpecker+Method): confirmou The Woodpecker Method (€34.99), The Woodpecker Method 2 (€29.99).
- [New In Chess - search "Steps Method"](https://www.newinchess.com/catalogsearch/result/?q=Steps+Method): confirmou The Complete Step-by-Step Method (€99.95, 6 manuais + 6 workbooks), completo com extras (€199.95), workbooks individuais (€5.95), manuais (€12.50).
- [New In Chess - search "Silman Complete Endgame"](https://www.newinchess.com/catalogsearch/result/?q=Silman+Complete+Endgame): confirmou Silman's Complete Endgame Course (€27.95, discontinued), How to Reassess your Chess (€32.95, discontinued).
- [New In Chess - search "Logical Chess Move by Move"](https://www.newinchess.com/catalogsearch/result/?q=Logical+Chess+Move+by+Move): confirmou Logical Chess Move by Move (€19.95, discontinued).
- [New In Chess - search "My System Nimzowitsch"](https://www.newinchess.com/catalogsearch/result/?q=My+System+Nimzowitsch): confirmou My System (€21.99), My System FastTrack Edition (€19.95), My System & Chess Praxis (€26.95), Chess Praxis (€21.99).
- [New In Chess - search "1001 Chess Exercises"](https://www.newinchess.com/catalogsearch/result/?q=1001+Chess+Exercises): confirmou 1001 Chess Exercises for Advanced Club Players (€22.95), 1001 Chess Endgame Exercises for Club Players (€24.95). Precos dos volumes Beginners e Club Players nao exibidos.
- [New In Chess - search "How to Beat Your Dad"](https://www.newinchess.com/catalogsearch/result/?q=How+to+Beat+Your+Dad): nao encontrado na NIC. Gambit Publications e a editora original.
- [New In Chess - search "Capablanca Chess Fundamentals"](https://www.newinchess.com/catalogsearch/result/?q=Capablanca+Chess+Fundamentals): nao encontrado. Capablanca's Endgame Technique (€19.95) esta disponivel.
- [ChessBase Shop](https://shop.chessbase.com/en/): confirmou Fritz 21 (€69.90), Fritz your Chess Coach 2 (€19.99), Fritz & Chesster series (€29.00 cada), Smart by Chess (€19.90), 10 Golden Rules of Endgame Play (€19.90), Openings #1 The Open Games (€29.90), ChessBase 26 Single Program (€199.90), cursos Fritztrainer (€9.90-€59.90).
- [Forward Chess](https://forwardchess.com/): plataforma de ebooks interativos. Confirmou The Woodpecker Method ($23.99), 100 Endgames You Must Know 6th ed ($17.99), How to Study Chess on Your Own ($17.99), Improve Your Chess Calculation ($22.99), Amateur to IM ($19.99), Chess Structures ($23.99), The Russian Endgame Handbook ($17.99), World's Most Instructive Amateur Game Book ($14.99), Play Winning Chess New Edition ($21.99, em breve). Precos em USD. Editoras: Quality Chess, New in Chess, Mongoose Press, Thinkers Publishing, Russell Enterprises, Everyman Chess, Chess Elevation, Popular Chess, etc.
- [Thinkers Publishing](https://thinkerspublishing.com/): editora belga de livros de xadrez (abertura, meio-jogo, final, taticas, estrategia, psicologia). Ebooks disponiveis via Forward Chess.
- [Silman-James Press](https://www.silmanjamespress.com/): Siles Press e a divisao de xadrez. Site principal foca em cinema/livros de atuacao. Livros do Silman devem ser verificados diretamente na Siles Press ou Amazon.

### Plataformas com Problemas de Acesso

- [Gambit Publications](https://www.gambitbooks.com/): erro de transporte (site offline ou bloqueando). Livros Gambit devem ser verificados na Amazon.
- [Everyman Chess](https://www.everymanchess.com/): erro de transporte. Livros Everyman disponiveis via New In Chess (distribuidor), Forward Chess (ebooks) e Amazon.
- [Chessable](https://www.chessable.com/courses/most-popular): site requer JavaScript; nao foi possivel extrair precos via webfetch. Necessaria pesquisa manual com navegador.

### Itens com Precos Nao Verificados (necessaria pesquisa manual)

- How to Beat Your Dad at Chess (Gambit Publications)
- Everyone's First Chess Workbook (New In Chess)
- Chess Tactics from Scratch (Quality Chess)
- 100 Tactical Patterns You Must Know (New In Chess)
- Play Winning Chess / Winning Chess series (Seirawan, Everyman/Chess Elevation)
- Bobby Fischer Teaches Chess (Bantam)
- Chess Training Pocket Book (Alburt)
- The Amateur's Mind (Siles Press)
- How to Reassess Your Chess (Siles Press)
- Pump Up Your Rating (Quality Chess)
- Simple Chess (Dover)
- Practical Chess Exercises (Wheatmark)
- Chess Mastery by Question and Answer (Russell Enterprises)
- Chess Fundamentals physical (Dover/Everyman)
- Chess for Zebras (Gambit)
- Modern Chess Strategy (Dover)
- Cursos Chessable 0-1200 rating
- Livros Silman na Siles Press (precos exatos)

### Observacoes

- Muitos classicos (Silman, Logical Chess, Back to Basics) aparecem como "discontinued" na New In Chess. Isso nao significa que o livro esta fora de catalogo — apenas que a NIC parou de distribuir. As editoras originais (Siles Press, Batsford, Russell Enterprises) ou Amazon devem ter estoque.
- Yusupov Complete Series esta "out of stock" em ambas edicoes na NIC. E possivel comprar volumes individuais ou as series de 3 livros (Fundamentals/Beyond Basics/Mastery) separadamente.
- Forward Chess e a melhor plataforma para ebooks interativos de xadrez. Engine integrado permite jogar lances e variantes no tabuleiro digital.
- Fritz 21 (€69.90) e Fritz your Chess Coach 2 (€19.99) sao as opcoes de software de treino da ChessBase. O Fritz 21 inclui oponentes com personalidade, treino de aberturas e calculo.
- Deliverable completo em `docs/research/paid_buylist.md`.

## Pesquisa Profunda Em 2026-06-09: 5 Frentes De Literatura De Xadrez

Pesquisa executada como DeepSeek (Claude como pesquisador) para cobrir as 5 frentes do prompt
`prompts/archive/2026-06-method/deepseek-chess-literature-library.md`. Todos os entregaveis em PT-BR com links verificaveis.

### Frente 1: Acervo Livre — Fontes de descoberta

- [Gutendex API](https://gutendex.com/): pesquisa por `chess`, `xadrez`, `ajedrez`, `echecs`. API
  retornou 503/offline em 2026-06-09. Tentar novamente.
- [Internet Archive Advanced Search (JSON)](https://archive.org/advancedsearch.php): query
  `subject:chess + mediatype:texts + license:publicdomain/cc` retornou 303 livros; `title:chess`
  retornou 223 livros. Fonte mais produtiva para livros completos em dominio publico ou CC.
- [OpenAlex Works API](https://api.openalex.org/works): query `title.search:chess + is_oa:true +
  has_pdf_url:true` retornou 1762 papers. Usado para descobrir artigos academicos com PDF open access.
- [DOAJ API](https://doaj.org/api/search/articles/chess): retornou 1074 artigos (muitos falsos
  positivos — CHESS como acronimo medico/astronomico). ~16 relevantes para educacao de xadrez.
- OATD, ERIC, PubMed: inacessiveis por bloqueio de rede/transporte ou reCAPTCHA em 2026-06-09.

### Frente 2: Evidencia Academica

- [Google Scholar](https://scholar.google.com/): 8 queries em ingles, portugues e espanhol para
  localizar estudos sobre xadrez e educacao, cognicao, transferencia.
- [Sala & Gobet (2016) - meta-analise](https://doi.org/10.1016/j.edurev.2016.02.002): 24 estudos,
  efeito global g=0.34. Paywall Elsevier.
- [Sala, Foley & Gobet (2017) - revisao critica](https://doi.org/10.3389/fpsyg.2017.00238): placebo
  e o maior problema metodologico. CC BY 4.0. Acesso livre.
- [Sala & Gobet (2017) - grupo de controle ativo](https://doi.org/10.3758/s13420-017-0280-3): xadrez
  = damas = Go. Nenhuma superioridade. CC BY 4.0.
- [Rosholm et al. (2017) - Dinamarca](https://doi.org/10.1371/journal.pone.0177257): efeito modesto
  em padroes (g=0.10-0.18). CC BY 4.0.
- [Jerrim et al. (2016) - IoE/EEF UK RCT](https://educationendowmentfoundation.org.uk/projects-and-evaluation/projects/chess-in-schools):
  N=3865, nenhum efeito de longo prazo. Maior RCT ate hoje.
- [Bart (2014) - revisao](https://doi.org/10.3389/fpsyg.2014.00762): revisao narrativa. CC BY 4.0.
- [Trinchero & Sala (2016) - heuristicas](https://doi.org/10.12973/eurasia.2016.1255a): metodo de
  ensino IMPORTA. EJMSTE, provavelmente CC BY.
- [Charness et al. (2005) - deliberate practice](https://doi.org/10.1002/acp.1106): DP explica ~34%
  da variancia em rating. Paywall Wiley.
- [Campitelli & Gobet (2011) - DP necessario mas nao suficiente](https://doi.org/10.1177/0963721411421922):
  paywall SAGE.
- [Burgoyne et al. (2016) - cognicao e xadrez](https://doi.org/10.1016/j.intell.2016.08.002):
  meta-analise. Paywall Elsevier.
- [Blanch (2022) - vies de publicacao](https://doi.org/10.1007/s10648-021-09649-2): "wishful
  thinking". Paywall Springer.

### Frente 3: Metodos e Curriculos

- [Stappenmethode (Steps Method)](https://www.stappenmethode.nl/en/): site oficial com descricao
  dos 6 steps, samples gratuitos, puzzles semanais e solucoes abertas.
- [New In Chess / Quality Chess](https://www.newinchess.com/quality-chess): Yusupov Series, Steps
  Method, Woodpecker Method, Silman, Nimzowitsch.
- [FIDE Chess in Schools](https://cis.fide.com/): framework publico de 7 areas para treinadores.
- [Lichess Practice](https://lichess.org/practice): 5 secoes oficiais (Checkmates, Fundamental
  Tactics, Advanced Tactics, Pawn Endgames, Rook Endgames) — gratuito e open source.
- [Lichess Learn](https://lichess.org/learn): fundamentos interativos gratuitos.
- [Project Gutenberg - Capablanca Chess Fundamentals](https://www.gutenberg.org/ebooks/33870):
  dominio publico, gratuito.

### Frente 4: Lista De Compra (ja documentada na secao anterior)

Ver secao "Pesquisa Frente 4 Em 2026-06-09: Paid Buylist de Livros e Recursos" acima.

### Frente 5: Sintese Para Metodo Proprio

- [Metodo Professor Lemos](docs/pedagogy/metodo-professor-lemos.md): documento canonico do metodo
  pedagogico do app.
- [Plano pedagogico a partir do acervo baixado](docs/pedagogy/plano-pedagogico-acervo-baixado-2026-06-09.md):
  leitura aplicada dos livros/artigos baixados, separando o que vira pedagogia, o que fica para depois
  e o que nao deve ser usado.
- [Method Synthesis](docs/research/method_synthesis.md): 10 principios, 8 anti-padroes, sequencia
  de 9 blocos, templates de sessao, sinais de avaliacao, candidatos de implementacao.
- [Spacing and retrieval review (Nature)](https://www.nature.com/articles/s44159-022-00089-1):
  base para spaced repetition e retrieval practice.
- [Retrieval practice systematic review (Springer)](https://link.springer.com/article/10.1007/s10648-021-09595-9):
  recuperar ativamente > reler.
- [Worked examples / cognitive load (ScienceDirect)](https://www.sciencedirect.com/science/article/pii/S0361476X1000055X):
  explain + guided antes de retrieval para iniciantes.

### Arquivos gerados

| Arquivo | Frente | Conteudo |
|---------|--------|----------|
| `docs/research/open_download_candidates.md` | 1 | 85+ itens com download legal catalogados |
| `docs/research/academic_evidence.md` | 2 | 24 estudos com tabela de evidencia e sintese |
| `docs/research/curriculum_map.md` | 3 | 17 metodos mapeados + sequencia de 9 blocos |
| `docs/research/paid_buylist.md` | 4 | 60+ itens precificados com prioridades A/B/C/D |
| `docs/research/method_synthesis.md` | 5 | Principios, anti-padroes, templates, sinais, implementacao |
| `docs/pedagogy/plano-pedagogico-acervo-baixado-2026-06-09.md` | 5 | Plano de uso pedagogico dos livros/artigos baixados |

## Pesquisa de Recursos para Lacunas do Método (2026-06-09)

Pesquisa executada para suprir as 8 lacunas de pedagogia e engenharia cognitiva do Método Professor Lemos (prompt `prompts/archive/2026-06-method/gemini-lacunas-pesquisa-recursos.md`).

### Fontes de Cálculo e Tática (`calculo-ponte-800-1200` e `calculo-sistematico-1200plus`)
- **[Chess Tactics from Scratch](https://www.newinchess.com/chess-tactics-from-scratch) (Martin Weteschnik):** Quality Chess, 2012. Ensina tática a partir da mecânica física de cada peça.
- **[How to Choose a Chess Move](https://www.amazon.com.br/) (Andrew Soltis):** Batsford, edição revista de 2024. Fornece gatilhos e atalhos cognitivos para lances candidatos.
- **[How to Calculate Chess Tactics](https://www.newinchess.com/how-to-calculate-chess-tactics) (Valeri Beim):** Gambit Publications, 2002. Ensina o processo de pensamento integrado com a intuição e regras lógicas de variantes.

### Fontes de Defesa e Profilaxia (`defesa-profilaxia-1000-1400`)
- **[Survive & Thrive](https://www.chessable.com/course/survive-thrive-how-to-blunder-less-and-defend-better/) (FM Dalton Perrine):** Curso interativo na Chessable focado em diminuir blunders e melhorar a visão defensiva no ELO 1000-1400.
- **[Cadernos Práticos 9 - Defesa e Contra-ataque](https://www.estantevirtual.com.br/) (Antonio Gude):** Editora Solis. Exercícios práticos e didáticos de sobrevivência tática e reação para amadores em português.
- **[How to Defend in Chess](https://archive.org/details/howtodefendinche0000crou) (Colin Crouch):** Gambit, 2007. Disponível para empréstimo digital no Internet Archive.

### Evidência de Engenharia Cognitiva e Metodologia (`threshold-dominio`, `proporcao-revisao-vs-novo`, `intervalos-repeticao-espacada`, `interleaving-sessao`, `abertura-minima-timing`)
- **[Learning for Mastery](https://scholar.google.com/) (Benjamin Bloom, 1968):** Estabelece o padrão pedagógico de 80% a 90% em testes formativos para validar o progresso antes do próximo nível.
- **[Spacing effects in learning (temporal ridgeline)](http://www.yorku.ca/ncepeda/publications/CepedaPashlerVulWixtedRohrer2008.pdf) (Nicholas Cepeda et al., 2008):** Demonstra a regra de 10-20% para a escala ótima de revisão espaçada (SRS).
- **[The shuffling of mathematics problems improves learning](https://scholar.google.com/) (Doug Rohrer & Kelli Taylor, 2007):** Demonstra que a prática alternada (interleaving) de problemas táticos melhora o desempenho em 2x em relação a blocos homogêneos.
- **[Novice Nook: When to Study Openings](https://www.danheisman.com/novice-nooks.html) (Dan Heisman):** Estudo de diretrizes sobre abertura, recomendando focar em princípios gerais e na revisão pós-jogo, sem memorização de variantes até ELO 1400+.

### Ferramentas de Código Aberto
- **[Listudy](https://listudy.org/en):** Motor PWA de repetição espaçada aplicado a xadrez sob licença livre.
- **[OpeningTree](https://www.openingtree.com/):** Analisador de repertório de aberturas com base nas partidas reais do usuário.

## Pesquisa Codex para Lacunas do Metodo (2026-06-10)

Pesquisa executada para o prompt `prompts/archive/2026-06-method/codex-lacunas-pesquisa-recursos.md`, como terceiro vertice
da triangulacao: open source, datasets, ferramentas, APIs oficiais e evidencia tecnica/academica.
Relatorio gerado em `docs/research/relatorio-codex-lacunas-pesquisa-recursos.md`.

### Fontes oficiais e datasets abertos

- **[Lichess Puzzle Database](https://database.lichess.org/#puzzles):** dataset oficial de puzzles,
  atualizado em 2026-06-04, com campos `Rating`, `RatingDeviation`, `Popularity`, `NbPlays`,
  `Themes`, `GameUrl` e `OpeningTags`. Base A para selecao local de puzzles por tema, dificuldade,
  popularidade e comprimento, sem copiar PGN completo para o app.
- **[Lichess Puzzle Themes](https://lichess.org/training/themes):** catalogo oficial vivo de temas e
  contagens. Usado para validar volume em `fork`, `pin`, `defensiveMove`, `mateIn2`, `short`, `long`
  e outros temas relevantes.
- **[Lichess API](https://lichess.org/api) / [API Tips](https://lichess.org/page/api-tips) /
  [OpenAPI spec](https://github.com/lichess-org/api/blob/master/doc/specs/lichess-api.yaml):**
  referencia viva para endpoints oficiais, limites de uso, puzzles, studies e restricoes de integracao.
- **[Lichess Practice](https://lichess.org/practice):** taxonomia oficial de aulas interativas para
  taticas, mates e finais. Uso recomendado como destino externo guiado, nao como conteudo copiado.
- **[Hugging Face: Lichess/chess-puzzles](https://huggingface.co/datasets/Lichess/chess-puzzles):**
  espelho util do dataset de puzzles, mas a fonte canonica continua sendo `database.lichess.org`.

### Ferramentas tecnicas avaliadas

- **[SCID](https://scid.sourceforge.net/):** banco de partidas gratuito/open source para analise local,
  util como referencia tecnica de tooling, nao como dependencia direta do app pessoal.
- **[ChessDB cloud book API](https://chessdb.cn/cloudbookc_api_en.html):** API publica de consulta de
  livro/nuvem; classificada como risco para dependencia central por aproximar engine/cloud advice.
- **[lichess-tactics-generator](https://github.com/vitogit/lichess-tactics-generator):** referencia de
  geracao/seletores de taticas a partir de Lichess, util para leitura de abordagem, sem copiar codigo.
- **[chess-puzzle-maker](https://github.com/linrock/chess-puzzle-maker):** referencia de UX/editoria de
  puzzles, sem reaproveitamento de conteudo.
- **[better_tactics](https://github.com/catchouli/better_tactics):** extensao/complemento comunitario
  para treino no Lichess, avaliado como inspiracao externa.
- **[chessli](https://github.com/pwenker/chessli) /
  [chessli2](https://github.com/pwenker/chessli2):** treino open source de linhas/repertorio; util para
  comparar repeticao e fluxo de estudo.
- **[chessdriller](https://github.com/gtim/chessdriller):** ferramenta aberta de drilling de posicoes.
- **[FSRS](https://github.com/open-spaced-repetition/free-spaced-repetition-scheduler) /
  [fsrs4anki](https://github.com/open-spaced-repetition/fsrs4anki):** referencia tecnica aberta para
  repeticao espacada; recomendada apenas depois de haver telemetria local suficiente.
- **[ChessTempo Manual](https://chesstempo.com/manual/en/manual.html) /
  [Memberships](https://chesstempo.com/memberships/):** custom sets e spaced repetition externos. Preco
  observado em 2026-06-10: Gold US$4/mes ou US$35/ano. Bom como ferramenta pessoal externa, nao como
  fonte principal do app.

### Evidencia academica e cognitiva

- **[Cepeda et al. 2006](https://pubmed.ncbi.nlm.nih.gov/16719566/):** revisao de spacing effect.
- **[Cepeda et al. 2008](https://pubmed.ncbi.nlm.nih.gov/19076480/):** intervalo otimo de revisao em
  funcao do atraso ate o teste; base indireta para agenda 1/3/7/14/30.
- **[Roediger & Karpicke 2006](https://pubmed.ncbi.nlm.nih.gov/16507066/):** retrieval practice como
  melhor consolidacao que releitura.
- **[Rohrer, Dedrick & Stershic 2015](https://doi.org/10.1037/edu0000001):** interleaving em pratica
  matematica; evidencia indireta para alternancia de temas apos dominio inicial.
- **[Chen et al. 2021](https://doi.org/10.1007/s10648-020-09564-6):** spacing e interleaving em
  categorias visuais; evidencia indireta para classificacao de padroes.
- **[Mastery learning review](https://pmc.ncbi.nlm.nih.gov/articles/PMC10159400/):** base pedagogica
  geral para thresholds, sem porcentagem especifica de xadrez.
- **[EDM 2025 mastery threshold](https://educationaldatamining.org/EDM2025/proceedings/2025.EDM.short-papers.4/index.html):**
  evidencia recente nao-xadrez sobre thresholds altos em mastery learning.
- **[Chase & Simon / Simon & Chase](https://iiif.library.cmu.edu/file/Simon_box00066_fld05052_bdl0001_doc0001/Simon_box00066_fld05052_bdl0001_doc0001.pdf):**
  evidencia classica de chunking e memoria especifica de xadrez.
- **[Bilalic, McLeod & Gobet 2009](https://doi.org/10.1111/j.1551-6709.2009.01030.x):** especializacao
  e reconhecimento em xadrez; relevante para limites de transferencia.
- **[de Bruin, Rikers & Schmidt 2005](https://doi.org/10.1002/acp.1109):** auto-regulacao e estudo em
  finais de xadrez.
- **[Charness et al. 2005](https://doi.org/10.1002/acp.1106):** deliberate practice e rating de xadrez.

## Planejamento de Implementacao do Metodo Lichess (2026-06-10)

Pesquisa executada para criar os prompts de planejamento `deepseek-plano-implementacao-metodo-lichess`,
`gemini-plano-implementacao-metodo-lichess` e `codex-plano-implementacao-metodo-lichess`.

- **[Lichess API docs](https://lichess.org/api):** referencia oficial viva dos endpoints Lichess para
  Studies, Puzzles, OAuth e demais recursos. Usar como fonte canonica antes de qualquer integracao nova.
- **[Lichess API Tips](https://lichess.org/page/api-tips):** confirma que o Lichess prefere endpoints
  oficiais a scraping/browser automation; regra operacional: uma requisicao por vez e, em HTTP 429,
  esperar pelo menos 1 minuto antes de retomar.
- **[OpenAPI spec do Lichess](https://github.com/lichess-org/api/blob/master/doc/specs/lichess-api.yaml):**
  confirma `POST /api/study` com `study:write`, `POST /api/study/{studyId}/import-pgn` com
  `study:write`, `GET /api/puzzle/activity`, `GET /api/puzzle/dashboard/{days}` e
  `GET /api/puzzle/replay/{days}/{theme}` com `puzzle:read`.
- **[Lichess Puzzle Database](https://database.lichess.org/#puzzles):** base publica de puzzles citada
  pela spec oficial; continua sendo fonte limpa de selecao/curadoria, mas a implementacao atual deve
  priorizar deep links e telemetria Lichess sem criar tabuleiro proprio.
- **Rechecagem Codex do plano implementavel (2026-06-10):** fontes oficiais acima foram consultadas
  novamente antes de gerar `docs/research/plano-implementacao-metodo-lichess-CODEX.md`, confirmando a moldura de
  Studies, Puzzle Activity/Dashboard/Replay, escopos minimos e rate limit.
- **Rechecagem diretora do consenso de implementacao (2026-06-10):** as mesmas fontes oficiais foram
  consultadas novamente antes de gerar `docs/research/plano-implementacao-metodo-lichess-DIRETOR.md`. Decisao:
  consenso suficiente para implementar sem nova rodada de planejamento; manter `puzzle:read`,
  `study:write`, deep links, Study do dia e rate limit oficial.

## Rechecagem Codex Da Auditoria Geral (2026-06-13)

Pesquisa executada para a auditoria geral registrada em
`docs/review/relatorio-codex-auditoria-geral-2026-06-13.md` e para alinhar documentacao de API/PWA.

- **[Lichess API Tips](https://lichess.org/page/api-tips):** revalidou preferencia por endpoints
  oficiais em vez de scraping/browser automation; regra operacional continua sendo uma requisicao por
  vez e espera de 1 minuto completo apos HTTP 429.
- **[Chess.com Help Center: What is the PubAPI and how do I use it?](https://support.chess.com/en/articles/9650547-what-is-the-pubapi-and-how-do-i-use-it):**
  artigo atualizado em 2026-04-20; revalidou que a PubAPI e read-only, nao envia lances/comandos de
  jogo, nao inclui dados privados como chat, e que acesso serial evita rate limit 429.
- **[MDN: CycleTracker - Service workers](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Tutorials/CycleTracker/Service_workers):**
  revalidou responsabilidades de service worker para offline/update: lista de recursos, versao/cache,
  instalacao, atualizacao e remocao de arquivos antigos.
- **[Vite PWA: Prompt for new content refreshing](https://vite-pwa-org.netlify.app/guide/prompt-for-update):**
  revalidou o fluxo de `virtual:pwa-register`, prompt de atualizacao e chamada `updateSW()` usado pela
  configuracao atual com `vite-plugin-pwa`.

## Rechecagem Codex Critica Nota 9,5 (2026-06-14)

Pesquisa executada para `docs/review/relatorio-codex-revisao-critica-nota-95-2026-06-14.md`,
com foco em API, PWA, privacidade/local storage e base pedagogica para revisao espaciada.

- **[Lichess API Tips](https://lichess.org/page/api-tips):** revalidou que o uso correto e via
  endpoints oficiais, com uma requisicao por vez e espera de 1 minuto completo apos HTTP 429.
- **[Lichess OpenAPI raw](https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/lichess-api.yaml):**
  revalidou rate limit, uso de NDJSON streaming em endpoints aplicaveis e cuidados com tokens/OAuth PKCE.
- **[Chess.com Published Data API](https://www.chess.com/news/view/published-data-api):** artigo
  atualizado em 2026-04-22; revalidou que a PubAPI e read-only, que acesso serial evita rate limit,
  e que respostas suportam `ETag`/`Last-Modified` e `304 Not Modified`.
- **[MDN StorageManager.persist](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist):**
  confirmou retorno booleano, contexto seguro e excecoes possiveis de `navigator.storage.persist()`.
- **[web.dev Persistent storage](https://web.dev/articles/persistent-storage):** recomenda solicitar
  persistencia ao salvar dado critico, idealmente com gesto do usuario, e nao durante page load/bootstrap.
- **[Carpenter, Pan & Butler 2022](https://www.nature.com/articles/s44159-022-00089-1):** revisao
  academica sobre spacing e retrieval practice como estrategias gerais de aprendizagem.
- **[SuperMemo SM-2](https://super-memory.com/english/ol/sm2.htm):** referencia historica para
  ajustar intervalos por qualidade de resposta; util apenas como inspiracao para uma versao simplificada.

## Rechecagem Codex Analise Completa (2026-06-15)

Pesquisa executada para `docs/review/analise_completa_codex_2026_06_15.md`, com foco em API,
rate limit, PWA/storage, headers de deploy e seguranca frontend.

- **[Lichess API Tips](https://lichess.org/page/api-tips):** revalidou que o Lichess prefere
  endpoints oficiais a scraping/browser automation; regras operacionais continuam sendo uma
  requisicao por vez e espera de um minuto completo apos HTTP 429.
- **[Chess.com Help Center: What is the PubAPI and how do I use it?](https://support.chess.com/en/articles/9650547-what-is-the-pubapi-and-how-do-i-use-it):**
  revalidou PubAPI read-only, cache/refresh de ate 12h e orientacao de acesso serial para evitar
  rate limit 429.
- **[MDN StorageManager.persist](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist):**
  revalidou que `persist()` exige contexto seguro, retorna booleano e pode ser negado por regras do
  navegador.
- **[web.dev Persistent storage](https://web.dev/articles/persistent-storage):** reforcou que a melhor
  hora para pedir persistencia e quando o usuario salva dado critico; nao no carregamento/bootstrap.
- **[MDN Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP):**
  revalidou CSP como defesa em profundidade contra XSS, clickjacking e `javascript:`/inline script,
  preferencialmente via header HTTP.
- **[Vercel vercel.json](https://vercel.com/docs/project-configuration/vercel-json):** confirmou que
  `vercel.json` versionado suporta a propriedade `headers`, usada hoje apenas para `X-Robots-Tag`.

## Rechecagem Codex Execucao Cortes M1-M5 (2026-06-16)

Pesquisa executada para `docs/review/relatorio-codex-execucao-cortes-M1-M5-2026-06-15.md` e para
os itens M2.1, M4.1 e M4.3 do pacote de pendencias.

- **[Chess.com Help Center: What is the PubAPI and how do I use it?](https://support.chess.com/en/articles/9650547-what-is-the-pubapi-and-how-do-i-use-it):**
  revalidou PubAPI read-only, ausencia de comandos de jogo e recomendacao operacional de acesso
  serial para reduzir risco de 429.
- **[Chess.com Published Data API](https://www.chess.com/news/view/published-data-api):** artigo
  atualizado em 2026-04-22; revalidou arquivos mensais, ordem por `end_time`, campos `end_time`,
  `accuracies` e `pgn`, e suporte a cache condicional.
- **[Vercel vercel.json](https://vercel.com/docs/project-configuration/vercel-json):** confirmou que
  `headers` versionado em `vercel.json` e o ponto correto para os headers defensivos do deploy.
- **[MDN Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy):**
  revalidou CSP como header HTTP de defesa em profundidade, incluindo restricoes de `script-src`.
- **[Lichess OpenAPI spec](https://github.com/lichess-org/api/blob/master/doc/specs/lichess-api.yaml):**
  revalidou os endpoints oficiais usados pelo app para Puzzle Activity, Dashboard, Replay e Studies;
  sem scraping, sem Board/Bot/Challenge API.

## Rechecagem Codex Overnight Beta M1 (2026-06-17)

Pesquisa executada para `prompts/codex-overnight-beta-2026-06-16.md`, milestone M1 (harness E2E
prints + CI).

- **[Playwright Screenshots](https://playwright.dev/docs/screenshots):** confirmou o uso de
  `page.screenshot({ path, fullPage: true })` para gerar evidencias visuais em arquivo por etapa.
- **[Playwright Continuous Integration](https://playwright.dev/docs/ci):** confirmou a pratica de
  rodar Playwright em CI com `npm ci`, `npx playwright install --with-deps` e execucao sequencial
  (`workers: 1`) para estabilidade.
- **[GitHub Actions: pull_request event](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request):**
  confirmou que workflows podem rodar em `pull_request`; por padrao, cobre `opened`, `synchronize`
  e `reopened`, suficiente para o smoke/E2E do PR.

## Rechecagem Codex Finalizar App (2026-06-17)

Pesquisa executada para `prompts/codex-finalizar-app-2026-06-17.md`, cobrindo API, PWA, CSP,
privacidade e plano P4/P5 local-only.

- **[Lichess API Tips](https://lichess.org/page/api-tips):** revalidou endpoints oficiais,
  uma requisicao por vez e espera de pelo menos 1 minuto apos HTTP 429.
- **[Lichess Puzzle Activity OpenAPI](https://github.com/lichess-org/api/blob/master/doc/specs/tags/puzzles/api-puzzle-activity.yaml):**
  confirmou `application/x-ndjson`, escopo `puzzle:read` e parametros oficiais `max`/`before`;
  o corte por `since` fica local, nao na query.
- **[Chess.com PubAPI Help](https://support.chess.com/en/articles/9650547-what-is-the-pubapi-and-how-do-i-use-it):**
  revalidou PubAPI read-only e orientacao de acesso serial para evitar rate limit.
- **[Chess.com Published Data API](https://www.chess.com/news/view/published-data-api):**
  revalidou arquivos mensais, cache condicional e uso read-only sem login.
- **[Cloudflare Workers local development](https://developers.cloudflare.com/workers/local-development/):**
  revalidou que Workers/D1 podem ser desenvolvidos e testados localmente sem provisionar producao.
- **[Cloudflare D1 local development](https://developers.cloudflare.com/d1/best-practices/local-development/):**
  revalidou ambiente local D1/Miniflare para futura P4, mantendo secrets/provisionamento fora do agente.
- **[MDN Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP):**
  revalidou CSP por header HTTP, `upgrade-insecure-requests` e reducao de superficie de XSS.
- **[MDN Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API):**
  revalidou o modelo offline/PWA usado nos smokes de service worker.
