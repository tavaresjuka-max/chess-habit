# Relatório Claude — Curadoria Lichess para Professor Lemos

Data: 2026-06-08
IA pesquisadora: **Claude (Opus 4.8)**
Projeto: lichess-tutor
Documento companheiro para comparação: `relatorio-codex-curadoria-lichess-professor-lemos-2026-06-08.md`

---

## Método e limites

Pesquisa feita apenas com páginas públicas do Lichess, a especificação OpenAPI oficial
(`lichess-org/api`), o código-fonte público (`lichess-org/lila`) e verificação de status HTTP.
**Não houve scraping de conteúdo, download de PGN, cópia de comentários, linhas ou capítulos de
estudos.** Onde li uma página pública, li somente metadados (título, autor, seções) — nunca o
conteúdo pedagógico em si.

**Diferencial deste relatório:** cada achado carrega um campo **Verificação** dizendo *como* foi
checado. Recursos oficiais foram verificados contra fonte canônica; estudos comunitários **não
podem ser verificados quanto à qualidade sem ler conteúdo protegido**, então entram marcados como
não-verificados e ficam fora do catálogo ativo por padrão. Há ainda uma seção final de auditoria
cruzada com o relatório do Codex (papel IA 7).

### Log de verificação (o que eu realmente checei)

| Fonte canônica | URL | Resultado |
|---|---|---|
| Lista oficial de temas de puzzle | https://raw.githubusercontent.com/lichess-org/lila/master/translation/source/puzzleTheme.xml | ✅ Lida — 70+ slugs extraídos (lista completa abaixo) |
| Estrutura ao vivo do Practice | https://lichess.org/practice | ✅ Lida — 5 seções e seus estudos confirmados |
| Inventário de escopos OAuth | `lichess-org/api` → `doc/specs/lichess-api.yaml` | ✅ Lido — lista exata de escopos (linhas 804–826) |
| Endpoints de puzzle + escopo | `doc/specs/tags/puzzles/*.yaml` | ✅ activity, dashboard, replay → todos `puzzle:read` |
| Endpoints de estudo | `doc/specs/tags/studies/*.yaml` | ✅ create, import-pgn, export confirmados |
| Status HTTP de 33 URLs citadas | curl `-I` em todas | ✅ Todas retornaram HTTP 200 |
| Atribuição de 2 vídeos | `/video/{id}` (metadados) | ✅ Astaneh e Kavutskiy / Chessfactor confirmados |

### Regra de ranking adotada

`official-practice` (conceito guiado) → `puzzle-theme` (repetição) → `tool` (rotina) →
`video` direto da biblioteca → `community-study` **somente após revisão humana**. Para cada
fraqueza: ensina-se o conceito primeiro, depois repete-se com puzzles, depois reforço opcional em
vídeo. Estudo comunitário nunca é recomendação automática nesta fase.

---

# PARTE 1 — Recursos oficiais (Practice / Learn / Puzzle)

## Achado 1

**Título:** Lichess Practice (catálogo-raiz oficial)
**Tipo:** official-practice
**URL:** https://lichess.org/practice
**Autor/Fonte:** Lichess
**Valor:** A
**Tema principal:** trilha interativa de prática guiada
**Fraquezas que treina:** mate-in-1, mate-in-2, fork, pin, skewer, discovered, endgame-pawn, endgame-rook, conversion, calculation, defensive-awareness
**Nível sugerido:** misto
**Duração estimada:** variável
**Verificação:** ✅ Estrutura lida ao vivo. Confirmadas 5 seções: **Checkmates** (Piece Checkmates I, Checkmate Patterns I–IV, Piece Checkmates II, Knight & Bishop Mate), **Fundamental Tactics** (The Pin, The Skewer, The Fork, Discovered Attacks, Double Check, Overloaded Pieces, Zwischenzug, X-Ray), **Advanced Tactics** (Zugzwang, Interference, Greek Gift, Deflection, Attraction, Underpromotion, Desperado, Counter Check, Undermining, Clearance), **Pawn Endgames** (Key Squares, Opposition, 7th-Rank Rook Pawn), **Rook Endgames** (Basic / Intermediate / Practical Rook Endings).
**Por que é útil:** É a única fonte interativa oficial, mantida e em clean-room — o app nunca precisa reconstruir tabuleiro nem copiar conteúdo. Serve como espinha dorsal do catálogo: cada lição vira uma entrada `official-practice` com `weaknessTags`.
**Quando o Professor Lemos deveria recomendar:** Sempre que o diagnóstico apontar uma fraqueza *conceitual* (não só execução), antes de mandar puzzles soltos.
**Como implementar no app:** Catálogo estático com `sectionSlug`, `studySlug`, `studyId`, `weaknessTags`, `priority`. Abrir via `open-url`. Practice ranqueia acima de tudo, exceto Learn para banda 0–800.
**Dados necessários:** `id`, `title`, `sectionSlug`, `studyId`, `weaknessTags`, `level`, `duration`, `lastVerifiedAt`.
**Riscos:** Conteúdo em inglês; progresso fica na conta Lichess (abrir não exige OAuth); IDs de estudo podem mudar — revalidar status HTTP periodicamente.
**Confiança:** alta

## Achado 2

**Título:** Lichess Practice — lições primárias por fraqueza (deep-links verificados)
**Tipo:** official-practice
**URL (todas retornaram HTTP 200):**
- The Fork → https://lichess.org/practice/fundamental-tactics/the-fork/Qj281y1p
- The Pin → https://lichess.org/practice/fundamental-tactics/the-pin/9ogFv8Ac
- The Skewer → https://lichess.org/practice/fundamental-tactics/the-skewer/tuoBxVE5
- Discovered Attacks → https://lichess.org/practice/fundamental-tactics/discovered-attacks/MnsJEWnI
- Piece Checkmates I → https://lichess.org/practice/checkmates/piece-checkmates-i/BJy6fEDf
- Checkmate Patterns I → https://lichess.org/practice/checkmates/checkmate-patterns-i/fE4k21MW
- Key Squares → https://lichess.org/practice/pawn-endgames/key-squares/xebrDvFe
- Basic Rook Endgames → https://lichess.org/practice/rook-endgames/basic-rook-endgames/pqUSUw8Y

**Autor/Fonte:** Lichess
**Valor:** A
**Tema principal:** mapeamento 1:1 lição-oficial → fraqueza do Professor Lemos
**Fraquezas que treina:** fork, pin, skewer, discovered, mate-in-1, mate-in-2, back-rank, endgame-pawn, endgame-rook, conversion
**Nível sugerido:** iniciante → intermediário
**Duração estimada:** curta a média
**Verificação:** ✅ Os 8 deep-links acima foram testados com curl e retornaram HTTP 200. Os estudos **Opposition, Double Check, X-Ray, Overloaded Pieces, Knight & Bishop Mate, Checkmate Patterns II–IV** existem na página ao vivo, mas **não fabriquei IDs de estudo para eles** — devem ser linkados via `/practice` até captura manual do ID.
**Por que é útil:** Dá ao Professor Lemos uma resposta conceitual direta para cada motivo tático básico, reduzindo tentativa-e-erro cego antes da bateria de puzzles.
**Quando o Professor Lemos deveria recomendar:** Imediatamente após diagnosticar a fraqueza correspondente; a lição precede o tema de puzzle de mesmo nome.
**Como implementar no app:** Entradas primárias por fraqueza. Sequência recomendada: lição → 5–10 puzzles do tema equivalente → autoavaliação local.
**Dados necessários:** `studyId`, `sectionSlug`, `weaknessTags`, `priority`, `lastVerifiedAt`.
**Riscos:** Inglês; não copiar linhas/comentários; IDs sem verificação manual não devem ser inventados.
**Confiança:** alta (para os 8 verificados)

## Achado 3

**Título:** Lichess Learn — Chess Basics
**Tipo:** official-practice
**URL:** https://lichess.org/learn (HTTP 200)
**Autor/Fonte:** Lichess
**Valor:** A (apenas banda 0–800)
**Tema principal:** regras e fundamentos
**Fraquezas que treina:** opening-principles, blunder-rate, defensive-awareness, other
**Nível sugerido:** iniciante
**Duração estimada:** média
**Verificação:** ✅ URL resolve. Conteúdo não lido (não necessário).
**Por que é útil:** Cobre movimento de peças, roque, en passant, promoção e xeque-mate básico para quem ainda erra regras. Único recurso que faz sentido *antes* de qualquer tática.
**Quando o Professor Lemos deveria recomendar:** Primeiro uso, rating muito baixo, ou sinal manual de dúvida sobre regras.
**Como implementar no app:** Entrada de altíssima prioridade restrita à banda 0–800 e a fraquezas de regra. Não há endpoint de progresso — apenas `open-url`.
**Dados necessários:** URL, nível, tags, prioridade, nota "sem OAuth".
**Riscos:** Página genérica; nenhum sinal de progresso volta ao app.
**Confiança:** alta

## Achado 4

**Título:** Catálogo oficial de temas de puzzle (`/training/{slug}` + página de temas)
**Tipo:** puzzle-theme
**URL:** https://lichess.org/training/themes (HTTP 200) · ex.: https://lichess.org/training/hangingPiece (HTTP 200)
**Autor/Fonte:** Lichess
**Valor:** A
**Tema principal:** repetição temática por motivo
**Fraquezas que treina:** todas as mapeáveis (ver tabela na Parte 2)
**Nível sugerido:** misto
**Duração estimada:** curta
**Verificação:** ✅ **Lista completa de slugs extraída da fonte canônica** (`puzzleTheme.xml`). A própria spec da API aponta para esse arquivo como referência oficial. Slugs `hangingPiece`, `fork`, `mateIn2` testados via HTTP 200.
**Por que é útil:** Cada slug é uma allowlist confiável para gerar `/training/{slug}`. É o motor de repetição após a lição conceitual.
**Quando o Professor Lemos deveria recomendar:** Depois da lição Practice equivalente, ou quando a fraqueza for de execução e não de conceito.
**Como implementar no app:** Tabela estática `weaknessTag → [slugs]` (Parte 2). Regra fixa: "conceito oficial primeiro, tema depois". Validar slugs contra allowlist curada, **não** por parsing de HTML.
**Dados necessários:** `themeSlug`, `weaknessTags`, `priority`, `level`, `lastVerifiedAt`.
**Riscos:** Sem OAuth o app não sabe o resultado; com OAuth, somente `puzzle:read`. Treino temático "dá pista" — alternar com `mix`.
**Confiança:** alta

## Achado 5

**Título:** Ferramentas oficiais de rotina — Streak, Storm, Daily Puzzle, Coordinate Trainer
**Tipo:** tool
**URL (todas HTTP 200):**
- Puzzle Streak → https://lichess.org/streak
- Puzzle Storm → https://lichess.org/storm
- Coordinate Trainer → https://lichess.org/training/coordinate
- Daily Puzzle (API) → endpoint `GET /api/puzzle/daily` (sem escopo)
**Autor/Fonte:** Lichess
**Valor:** A (Streak, Coordinate, Daily) / B (Storm)
**Tema principal:** rotina diária e visão de tabuleiro
**Fraquezas que treina:** blunder-rate, calculation, defensive-awareness (Streak); time-trouble (Storm); **visualization / board-vision** (Coordinate Trainer)
**Nível sugerido:** misto
**Duração estimada:** curta
**Verificação:** ✅ URLs resolvem; endpoint `/api/puzzle/daily` confirmado na spec.
**Por que é útil:** **Coordinate Trainer é um achado que o relatório Codex não cobriu** e é o único treino oficial direto de visão de casas — base para `visualization`. Streak calibra precisão sem virar corrida. Daily Puzzle vira "aquecimento do dia" sem OAuth.
**Quando o Professor Lemos deveria recomendar:** Coordinate Trainer quando a fraqueza for `visualization`/cegueira de tabuleiro; Streak para aquecimento de 5–15 min; Storm só após precisão mínima; Daily como ritual de abertura de sessão.
**Como implementar no app:** Blocos de rotina com `open-url` + autoavaliação local. Storm com pré-condição: não recomendar se `blunder-rate` estiver alto.
**Dados necessários:** URL, tipo, fraquezas, pré-condição, tempo recomendado, resultado manual opcional.
**Riscos:** Storm incentiva chute; resultados automáticos exigiriam OAuth/endpoints específicos.
**Confiança:** alta

## Achado 6

**Título:** Analysis Board + Opening Explorer (revisão de partidas terminadas)
**Tipo:** tool
**URL:** https://lichess.org/analysis (HTTP 200) · Opening Explorer embutido / `GET /api/opening explorer`
**Autor/Fonte:** Lichess
**Valor:** A
**Tema principal:** revisão pós-jogo e princípios de abertura
**Fraquezas que treina:** conversion, blunder-rate, calculation, defensive-awareness, time-trouble, opening-principles
**Nível sugerido:** misto
**Duração estimada:** média
**Verificação:** ✅ `/analysis` resolve. Opening Explorer é endpoint público documentado.
**Por que é útil:** Único recurso oficial para revisar posições *terminadas*. Vira bloco guiado: "abra sua partida terminada, marque 1 erro, escreva o porquê". O Explorer ajuda a discutir abertura por estatística, não decoreba.
**Quando o Professor Lemos deveria recomendar:** Após partida finalizada, especialmente em dias cujo plano é revisão de erro/conversão.
**Como implementar no app:** Entrada `analysis:finished-game-review`. **Microcopy obrigatório com "partida terminada".** Nunca abrir/monitorar jogo ao vivo.
**Dados necessários:** URL, motivo da revisão, nota local, tags; **nunca PGN completo**.
**Riscos:** ⚠️ Fair play — recurso de análise é proibido durante jogo em andamento. O app deve banir linguagem de "lance ao vivo".
**Confiança:** alta

---

# PARTE 2 — Mapa verificado de temas de puzzle → fraquezas (IA 2)

> Todos os slugs abaixo foram extraídos da fonte canônica `puzzleTheme.xml`. Nenhum slug foi inventado.

| Fraqueza (Professor Lemos) | Slugs oficiais (verificados) | Prioridade | Observação pedagógica |
|---|---|---:|---|
| hanging-piece | `hangingPiece`, `trappedPiece`, `defensiveMove` | Alta | Melhor alavanca para reduzir blunder material em 0–1200. |
| fork | `fork`, `advantage`, `crushing` | Alta | Lição "The Fork" antes da bateria. |
| pin | `pin`, `xRayAttack` | Alta | Reforçar com lição/vídeo de cravada. |
| skewer | `skewer`, `xRayAttack` | Alta | Vem depois de `pin` (conceitos se confundem). |
| discovered | `discoveredAttack`, `discoveredCheck`, `doubleCheck` | Alta | Ponte para visualização/cálculo. |
| mate-in-1 | `mateIn1`, `oneMove`, `mate` | Alta | Aquecimento curto. |
| mate-in-2 | `mateIn2`, `mate`, `smotheredMate`, `exposedKing` | Alta | Alternar com `mix` p/ evitar pista. |
| back-rank | `backRankMate`, `defensiveMove` | Alta | Treinar ataque **e** defesa. |
| opening-principles | `opening`, `castling`, `attackingF2F7` | Média | Puzzle não substitui aula de princípios. |
| time-trouble | `oneMove`, `short`, `mix` + ferramenta Storm | Média | Storm só após precisão mínima. |
| endgame-pawn | `pawnEndgame`, `advancedPawn`, `promotion`, `underPromotion`, `zugzwang` | Alta | Key Squares/Opposition antes. |
| endgame-rook | `rookEndgame`, `queenRookEndgame`, `endgame` | Alta | Após algum domínio de final de peão. |
| conversion | `advantage`, `crushing`, `capturingDefender`, `deflection`, `attraction`, `clearance`, `quietMove` | Média | Vários são avançados — filtrar por nível. |
| blunder-rate | `hangingPiece`, `defensiveMove`, `oneMove`, `short`, `mix` | Alta | Misturar temático + `mix` p/ transferência. |
| calculation | `long`, `veryLong`, `quietMove`, `intermezzo`, `defensiveMove` | Média | Evitar antes dos motivos básicos. |
| visualization | `xRayAttack`, `discoveredAttack`, `long`, `veryLong` + Coordinate Trainer | Média | Subir gradualmente. |
| defensive-awareness | `defensiveMove`, `equality`, `exposedKing`, `trappedPiece`, `hangingPiece` | Alta | Foco em "o que o adversário ameaça?". |

**Slugs de origem/dificuldade (não mapeiam fraqueza, servem de filtro):** `oneMove`, `short`, `long`, `veryLong`, `master`, `masterVsMaster`, `superGM`, `playerGames`, `opening`, `middlegame`, `endgame`, `mix`.

**Slugs de padrão de mate disponíveis mas de baixa prioridade nesta fase** (úteis no futuro, não para iniciante): `anastasiaMate`, `arabianMate`, `bodenMate`, `dovetailMate`, `hookMate`, `killBoxMate`, `vukovicMate`, `epauletteMate`, `swallowstailMate` etc. — manter na allowlist, fora do ranking inicial.

---

# PARTE 3 — Vídeos da biblioteca Lichess (IA 5)

> Política: somente links diretos `/video/{id}`. **Nunca** a página de busca/tag genérica. Todos os IDs abaixo retornaram HTTP 200; dois tiveram autoria confirmada por leitura de metadados (marcados ✅✅).

## Achado 7 — pacote de vídeos diretos

**Tipo:** video · **Autor/Fonte:** Chessfactor (na biblioteca oficial Lichess) · **Valor:** A/B

| Tema | URL | Instrutor (conforme metadados) | Fraqueza | Valor | Verificação |
|---|---|---|---|---|---|
| Opening principles: central control | https://lichess.org/video/gpsZAim-mYc | IM Alex Astaneh | opening-principles | A | ✅✅ título+autor lidos |
| Mating patterns | https://lichess.org/video/uhQhasudq9M | IM Kostya Kavutskiy | mate-in-2, back-rank, visualization | A | ✅✅ título+autor lidos |
| Identify hanging pieces | https://lichess.org/video/wod7uXzkrTc | (lib. Lichess) | hanging-piece, blunder-rate | A | ✅ HTTP 200 |
| Fork tactics for beginners | https://lichess.org/video/mbiR0tcdqBY | (lib. Lichess) | fork | B | ✅ HTTP 200 |
| The 4 most important pins | https://lichess.org/video/VjwSudAqLn8 | (lib. Lichess) | pin | B | ✅ HTTP 200 |
| Absolute & relative skewer | https://lichess.org/video/ZexQ1kow1MM | (lib. Lichess) | skewer | B | ✅ HTTP 200 |
| Discovered attack threats | https://lichess.org/video/nMADfn1scbI | (lib. Lichess) | discovered | B | ✅ HTTP 200 |
| Intro to pawn endgames | https://lichess.org/video/QUqq7wSLE78 | (lib. Lichess) | endgame-pawn | B | ✅ HTTP 200 |
| How to calculate best moves | https://lichess.org/video/-OoPm17P8xA | (lib. Lichess) | calculation | B | ✅ HTTP 200 |
| Tips to avoid blunders | https://lichess.org/video/AYy2A6HIcU0 | (lib. Lichess) | blunder-rate | B | ✅ HTTP 200 |

**Por que é útil:** reforço audiovisual para aluno que não transfere o Practice. Sempre complemento, nunca substituto da prática ativa.
**Quando recomendar:** após falha persistente no tema mesmo depois da lição, ou em dia de baixa energia.
**Como implementar:** entradas `video` rank abaixo de Practice/tema. Guardar só URL + metadados.
**Dados necessários:** URL, instrutor, fraqueza, idioma, prioridade.
**Riscos:** ⚠️ inglês; páginas de vídeo contêm links externos/doações e PGN no site do autor — **linkar o vídeo, nunca importar material externo**. Autoria dos 8 não-fetchados deve ser confirmada na página antes de exibir o nome no app.
**Confiança:** alta (URLs) / média (autoria dos não-fetchados)

---

# PARTE 4 — Estudos comunitários (IA 3 e IA 4)

> **Posição honesta:** não existe API oficial para ranquear estudos por qualidade pedagógica, e
> avaliar qualidade exigiria ler conteúdo protegido. Portanto **nenhum estudo comunitário entra no
> catálogo ativo** nesta fase. Listo abaixo apenas os que têm URL estável (HTTP 200) como
> *candidatos* para revisão humana — não como recomendação.

## Achado 8

**Título:** Beginner: Tactics (série jomega) — candidato
**Tipo:** community-study
**URL:** https://lichess.org/study/Iof6LzcT (HTTP 200)
**Autor/Fonte:** jomega / comunidade Lichess
**Valor:** C (candidato; **não** B sem revisão)
**Tema principal:** táticas básicas estruturadas
**Fraquezas que treina:** hanging-piece, pin, fork, blunder-rate (declarado, não verificado em conteúdo)
**Nível sugerido:** iniciante
**Duração estimada:** longa
**Verificação:** ⚠️ Apenas URL resolve. Qualidade, licença e adequação **não verificadas** (verificar exigiria ler o conteúdo).
**Por que é útil:** série citada com frequência na comunidade; *pode* servir de curso amplo quando o Practice for curto demais.
**Quando recomendar:** somente se revisão humana aprovar e o aluno aceitar inglês.
**Como implementar:** `qualityStatus = "needs-human-review"`, fora do ranking automático.
**Dados necessários:** URL, autor, título, status de revisão; **nada de conteúdo de capítulos**.
**Riscos:** licença não declarada; conteúdo pode mudar; risco de cópia se importado.
**Confiança:** baixa (sobre adequação)

## Achado 9

**Título:** Rook Endgames You Must Know! — candidato
**Tipo:** community-study
**URL:** https://lichess.org/study/bnboDhFM (HTTP 200)
**Autor/Fonte:** NoseKnowsAll / comunidade Lichess
**Valor:** C (candidato)
**Tema principal:** finais de torre práticos
**Fraquezas que treina:** endgame-rook, conversion (declarado)
**Nível sugerido:** intermediário+
**Duração estimada:** longa
**Verificação:** ⚠️ Apenas URL resolve.
**Por que é útil:** *pode* dar profundidade após "Basic Rook Endgames" oficial.
**Quando recomendar:** apenas pós-Practice e pós-revisão humana, para 1200+.
**Como implementar:** candidato com `requiresHumanReview = true`.
**Dados necessários:** URL, autor, tema, status; sem PGN.
**Riscos:** licença incerta, dificuldade alta.
**Confiança:** baixa (sobre adequação)

> **Estudos comunitários que descarto preventivamente nesta fase:** qualquer estudo cuja descrição
> indique adaptação de livro (ex.: finais baseados em Keres/Dvoretsky) → risco de direitos
> clean-room; e qualquer estudo com forte tom promocional/social. Não os listo individualmente para
> não dar a impressão de curadoria que não fiz — a regra geral basta.

---

# PARTE 5 — Análise técnica de API e OAuth (IA 6)

> Inventário **completo e exato** de escopos, lido de `doc/specs/lichess-api.yaml` (linhas 804–826).
> Esta é a maior correção factual em relação a interpretações superficiais.

## Inventário de escopos OAuth (fonte canônica)

| Escopo | Descrição oficial | Uso no lichess-tutor |
|---|---|---|
| `preference:read` / `preference:write` | Ler/escrever preferências | ❌ não usar |
| `email:read` | Ler e-mail | ❌ não usar |
| `engine:read` / `engine:write` | Engines externas | ❌ não usar |
| `challenge:read` / `challenge:write` | Ler/criar/aceitar desafios | ⛔ **proibido (jogo)** |
| `study:read` | Ler estudos **privados** e broadcasts | ⚠️ só se criar estudo privado do dia |
| `study:write` | Criar/editar/apagar estudos | ⚠️ opt-in, "estudo do dia" |
| `tournament:write` | Criar torneios | ❌ não usar |
| `racer:write` | Criar/entrar em puzzle races | ❌ não usar |
| `puzzle:read` | **Ler atividade de puzzle** | ✅ **único escopo central** (dashboard/activity/replay) |
| `puzzle:write` | **Escrever atividade de puzzle** | ⛔ **proibido pelo projeto** (não registrar resultados via API) |
| `team:read` / `team:write` | Times | ❌ não usar |
| `follow:read` / `follow:write` | Seguir jogadores | ❌ não usar |
| `msg:write` | Enviar mensagens privadas | ⛔ **nunca** |
| `board:play` | Board API | ⛔ **proibido (jogo)** |
| `bot:play` | Bot API | ⛔ **proibido (jogo)** |
| `web:mod` | Ferramentas de moderação | ❌ não usar |

> **Correção pública:** `puzzle:write` **existe** na spec ("Write puzzle activity") — não é um escopo
> inventado. A decisão correta do projeto é **não solicitá-lo**, pois registrar resoluções via API
> não traz valor pedagógico e amplia a superfície de permissão. O diagnóstico de puzzles usa apenas
> `puzzle:read`.

## Achado 10 — Endpoints de puzzle (diagnóstico opt-in)

**Tipo:** other (API) · **Valor:** A · **Verificação:** ✅ lido na spec
**Endpoints (todos `puzzle:read`, exceto onde indicado):**
- `GET /api/puzzle/daily` — puzzle do dia (**sem escopo**, público)
- `GET /api/puzzle/{id}` — puzzle por id (**sem escopo**)
- `GET /api/puzzle/next` — próximo puzzle (por tema/dificuldade)
- `GET /api/puzzle/activity` — sua atividade de puzzle → `puzzle:read`
- `GET /api/puzzle/dashboard/{days}` — agregados por tema → `puzzle:read`
- `GET /api/puzzle/replay/{days}/{theme}` — puzzles a revisar → `puzzle:read`

**Por que é útil:** `/api/puzzle/dashboard/{days}` é o sinal **mais limpo** para detectar tema fraco sem armazenar PGN nem solução. Janela de 30 dias é bom default.
**Como implementar no app:** OAuth **PKCE local**, escopo único `puzzle:read`, requisições **seriais**, respeitar HTTP 429. Persistir **só agregados por tema** (tentativas, acertos, erros, período, timestamp). Nunca PGN/solução. Token só em memória/keychain local, **nunca em log**.
**Riscos:** depende de OAuth opt-in; rate limit; `/api/puzzle/dashboard` exige conta com histórico de puzzles **no Lichess** — não cobre quem só joga Chess.com.
**Confiança:** alta

## Achado 11 — Endpoints de estudo (criação opt-in) e exportação

**Tipo:** other (API) · **Valor:** B · **Verificação:** ✅ lido na spec
**Endpoints relevantes:**
- `POST /api/study` — criar estudo → `study:write`
- `POST /api/study/{id}/import-pgn` — importar PGN (modos practice/conceal/gamebook) → `study:write`
- `GET /api/study/{id}.pgn` — exportar estudo **público** (**sem escopo**); privado exige `study:read`
- `GET /api/study/by/{username}/export.pgn` — exportar estudos de um usuário (privados → `study:read`)

**Por que é útil:** permite um "Estudo do dia" privado gerado pelo próprio app, sem depender de conteúdo de terceiros.
**Como implementar no app:** fluxo **opt-in** com `study:write`, estudo *unlisted/privado*, importando **apenas PGN transiente gerado pelo app** ou posições limpas. **Não** persistir o PGN completo localmente após o envio.
**Riscos:** ⚠️ exportar estudos comunitários para construir conteúdo local = risco de direitos; limite de estudos/capítulos; nunca pedir `study:read` sem necessidade real.
**Confiança:** alta

## Achado 12 — Exportação de partidas terminadas (diagnóstico secundário)

**Tipo:** other (API) · **Valor:** B · **Verificação:** ✅ endpoint existe na spec
**Endpoint:** `GET /api/games/user/{username}` (PGN ou NDJSON; filtros `finished`, `since`, `until`, `perfType`, `moves`, `pgnInJson`, `opening`, `analysed`).
**Por que é útil:** sinais derivados de partidas **terminadas** (resultado, ritmo, cor, abertura, precisão agregada). Secundário, pois Chess.com é a fonte primária do dono.
**Como implementar no app:** NDJSON com `moves=false`, `pgnInJson=false`, `opening=true`; usar `since`/`until` para limitar; **descartar bruto**, guardar só sinais agregados. **Não usar** filtros que tragam jogo em andamento.
**Riscos:** ⚠️ filtro errado pode incluir partida ao vivo → fair play; streaming longo; rate limit. Endpoint público para jogos públicos, mas respeitar `Accept` e 429.
**Confiança:** alta

---

# PARTE 6 — Auditoria cruzada vs. Relatório Codex (IA 7)

Comparei meu levantamento verificado com o relatório do Codex. Resumo do que **confirmo**, **corrijo** e **acrescento**:

### ✅ Confirmações (Codex estava certo — verifiquei de forma independente)
- Estrutura do Practice (5 seções) e os 8 deep-links de lição → todos HTTP 200.
- Slugs de puzzle (`hangingPiece`, `fork`, `mateIn2`, `pawnEndgame`, `rookEndgame` etc.) → batem com `puzzleTheme.xml`.
- Atribuição dos vídeos de Astaneh e Kavutskiy (Chessfactor) → confirmada por metadados.
- Endpoints `/api/puzzle/{activity,dashboard,replay}` → todos exigem `puzzle:read`.
- `study:write` para criar/importar estudo; export público sem escopo.

### ⚠️ Correções / divergências
1. **`puzzle:write`** — Codex disse "existe mas é proibido". **Confirmo que existe** ("Write puzzle activity", linha 817). A frase do Codex está correta; reforço que a ação certa é simplesmente **não solicitar** o escopo.
2. **Inventário de escopos incompleto no Codex** — faltaram `engine:*`, `challenge:read`, `tournament:write`, `racer:write`, `team:*`, `follow:*`, `msg:write`. Listei todos (Parte 5) — relevante para a allow/deny-list de segurança.
3. **Estudos comunitários** — Codex deu valores **B** a alguns (jomega, NoseKnowsAll). Eu os rebaixo a **C/candidato**, porque atribuir B implica um juízo de qualidade que **nenhuma IA pode fazer sem ler o conteúdo protegido**. Diferença metodológica, não factual.
4. **`/training/of-player`** (Codex Achado 18) — o **slug de tema** equivalente é `playerGames` (em `puzzleTheme.xml`); a página é só a interface. Vale registrar o slug, não só a URL.

### ➕ Acréscimos meus (ausentes no Codex)
- **Coordinate Trainer** (`/training/coordinate`) — único treino oficial de visão de casas → `visualization`.
- **Daily Puzzle via `/api/puzzle/daily`** — aquecimento sem OAuth.
- **Opening Explorer** — discussão de abertura por estatística.
- **Estudos do Practice que o Codex não nomeou** mas existem ao vivo: Double Check, X-Ray, Overloaded Pieces, Knight & Bishop Mate, Checkmate Patterns II–IV, Greek Gift, Opposition (linkar via `/practice` até captura manual de ID — **não inventei IDs**).
- **Campo `verificationStatus`** na estrutura de dados (abaixo).

---

# Resumo Executivo

## Top 10 Achados
1. Lichess Practice — Fundamental Tactics (The Fork / Pin / Skewer / Discovered) — deep-links verificados
2. Catálogo de temas de puzzle (`puzzleTheme.xml` como allowlist canônica)
3. Practice — Checkmate Patterns I + Piece Checkmates I (mate-in-1/2, back-rank)
4. `/api/puzzle/dashboard/{days}` com `puzzle:read` (diagnóstico mais limpo, sem PGN)
5. Practice — Key Squares + Basic Rook Endgames (finais)
6. Puzzle Theme — `hangingPiece` (maior alavanca contra blunder em 0–1200)
7. **Coordinate Trainer** (visualization — acréscimo deste relatório)
8. Analysis Board (revisão de partidas **terminadas**)
9. Vídeos Chessfactor diretos (Astaneh/Kavutskiy) como reforço
10. `POST /api/study` + `import-pgn` (estudo do dia opt-in, clean-room)

## Lacunas encontradas
- Quase nada oficial em **PT-BR** com link direto — o conteúdo forte é em inglês.
- **Não existe API** para ranquear estudos comunitários por qualidade pedagógica.
- Estudos comunitários **raramente declaram licença**; qualidade não é verificável sem ler conteúdo.
- Diagnóstico via `puzzle:read` **só cobre quem joga puzzles no Lichess** — o dono usa Chess.com como fonte primária. Há um descasamento de plataforma a resolver no produto.
- Temas `conversion`/`calculation` são amplos demais — precisam de filtro por nível e histórico.
- IDs de estudo do Practice (além dos 8 verificados) precisam de **captura manual** — não devem ser inventados.

## Recomendações de implementação
- Catálogo estático curado, ranqueado por `weaknessTags`; ordem fixa: Practice → puzzle-theme → tool → video → community-candidate.
- Para cada fraqueza: **conceito oficial primeiro**, depois repetição com tema, depois reforço opcional em vídeo.
- Estudos comunitários: `qualityStatus = "needs-human-review"`, fora do ranking automático.
- OAuth só **opt-in**: `puzzle:read` (dashboard/activity/replay) e, se o dono quiser, `study:write` (estudo do dia). **Nada mais.**
- Fila de requisições Lichess: 1 por vez, recuo em 429.
- Adicionar `verificationStatus` + `lastVerifiedAt` e rodar um job periódico de revalidação de status HTTP.

## Alertas legais / API / privacidade
- ⛔ **Proibidos:** `board:play`, `bot:play`, `challenge:*`, `puzzle:write`, `msg:write` e qualquer escopo de jogo.
- 🚫 **Nunca persistir:** PGN completo, comentários, soluções, transcrições, token OAuth, dados de perfil.
- ⚠️ **Fair play:** todo recurso de análise é só para **partidas terminadas**; banir linguagem de "lance ao vivo".
- ⚠️ Vídeos têm links externos/doações/PGN do autor — **linkar, nunca importar**.
- ⚠️ Estudos baseados em livros → descartar (risco de direitos clean-room).
- Token OAuth: PKCE local, em keychain/memória, **nunca em log**.

## Sugestão de estrutura de dados

```ts
type CuratedResource = {
  id: string;
  title: string;
  type:
    | 'official-practice'
    | 'puzzle-theme'
    | 'tool'
    | 'video'
    | 'community-study'
    | 'api-source'
    | 'other';
  url: string;
  official: boolean;
  author?: string;
  value: 'A' | 'B' | 'C' | 'D';
  weaknessTags: WeaknessTag[];
  puzzleThemeSlugs?: string[];       // só slugs presentes em puzzleTheme.xml
  studyId?: string;                  // só quando verificado (HTTP 200)
  level: 'iniciante' | 'intermediario' | 'avancado' | 'misto';
  estimatedDuration: 'curta' | 'media' | 'longa' | 'variavel';
  language?: 'pt-BR' | 'en' | 'other';
  requiresOAuth: boolean;
  oauthScopes: Array<'puzzle:read' | 'study:write'>; // allowlist estrita
  qualityStatus: 'approved' | 'needs-human-review' | 'rejected';
  verificationStatus: 'verified-canonical' | 'verified-http-200' | 'unverified';
  rightsRisk: 'low' | 'medium' | 'high';
  implementationMode: 'open-url' | 'api-read-aggregate' | 'create-study' | 'candidate-only';
  lastVerifiedAt: string;            // ISO date
  notes?: string;
};
```

**Proibido no catálogo:** PGN completo, comentários/linhas de estudo, soluções de puzzle, transcrição
de vídeo, token OAuth, dados pessoais, qualquer estado de partida ao vivo.

## Perguntas para revisão humana
1. O produto pessoal aceita vídeos/Practice **em inglês** como recomendação normal, ou só como "extra" até haver alternativa PT-BR?
2. Estudos comunitários entram como **candidatos C** após revisão humana, ou o produto fica **100% oficial** nesta fase?
3. Como resolver o **descasamento Chess.com × Lichess**: o diagnóstico `puzzle:read` só funciona para quem treina puzzles no Lichess — vale pedir ao dono que migre puzzles para o Lichess, ou manter o diagnóstico Lichess como opcional?
4. Vale o esforço de **captura manual** dos IDs de estudo do Practice restantes (Opposition, Double Check, X-Ray, etc.) para deep-links, ou linkar a seção basta?
5. Habilitar `study:write` para "estudo do dia" agora, ou manter escondido até ser pedido?
6. Qual o **limite mínimo de precisão** antes de liberar Puzzle Storm como treino de `time-trouble`?

---

*Relatório gerado por Claude (Opus 4.8). Todos os achados marcados ✅ foram verificados contra fonte
canônica (`puzzleTheme.xml`, spec OpenAPI `lichess-org/api`, página `/practice` ao vivo) ou por status
HTTP 200. Achados marcados ⚠️ têm URL estável mas qualidade/adequação não verificável sem ler conteúdo
protegido — por isso ficam fora do catálogo ativo.*
