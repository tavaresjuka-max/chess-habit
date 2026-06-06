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
