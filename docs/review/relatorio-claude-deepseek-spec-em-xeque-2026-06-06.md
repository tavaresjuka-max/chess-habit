# Relatorio De Revisao: Spec em Xeque — Claude/DeepSeek V4 Pro (Consultor)

- IA/autoria: Claude (DeepSeek V4 Pro) — Consultor independente
- Nome proprio do relatorio: Relatorio Spec em Xeque
- Data da analise: 2026-06-06
- Documento analisado: `docs/superpowers/specs/2026-06-06-rotina-pessoal-adaptativa-design.md`
- Spec autoria: Claude (claude-opus-4-8) — planejador
- Moldura: pessoal primeiro (ADR-004). Divergencia de mercado NÃO sera relatigada.
- Sugestao de nome de arquivo: `relatorio-claude-deepseek-spec-em-xeque-2026-06-06.md`

---

## 1. Veredito Executivo

**Nota: 6.8/10.** Aprovavel com correcoes pontuais. Nao ha P0s de governanca — todos os P0 dos
relatorios anteriores foram incorporados. O spec e executavel pelo Codex, mas tem **7 ambiguidades
que causariam PARADA** e **3 decisoes tecnicas questionaveis** que merecem revisao antes da primeira
linha de codigo.

Comparacao com o spec anterior (unificado, 4.0/10): melhoria radical. O planejador aprendeu.
Clean-room, ChessKing fora, sem `value: unknown`, sync adiado, slugs dinamicos, erro/offline — tudo
corrigido. O que resta sao lacunas de precisao que um executor literal como o Codex transformaria em
bugs ou perguntas bloqueantes.

---

## 2. Correcoes Herdadas — Verificacao Item A Item

| # | Correcao exigida pelos relatorios | Status no spec | Verificado? |
|---:|---|---|---|
| 1 | Clean-room: zero copia de chessking-tutor | Linhas 32-35 | ✅ Confirmado por inspecao das pastas. `lichess-tutor/` nao tem codigo. `chessking-tutor/` tem 10 arquivos .ts, nenhum importado. |
| 2 | ChessKing nunca e SourceId | Linha 82: `SourceId = 'lichess' \| 'chesscom' \| 'outro'` | ✅ `'chessking'` ausente. `'outro'` e generico. |
| 3 | Nada de `value: unknown` | Linhas 98-106: `SignalValue` e union discriminada | ✅ Cada `kind` tem payload tipado. |
| 4 | Sync adiado + merge por registro | Linha 275: P3 depois de P2. Linhas 237-239: merge por item com `updatedAt` | ✅ |
| 5 | Slugs Lichess dinamicos | Linha 172: validar contra `lichess.org/training/themes` | ✅ Guardrail correto. Ver secao 5.1 para nuances. |
| 6 | Erro/offline/migracao especificados | Secao 11 completa | ✅ |
| 7 | Linguagem de hipotese | Linha 159: "Every evidence em linguagem de hipotese" | ✅ Intencao declarada. Ver secao 5.3 para lacuna. |
| 8 | Pessoal = um usuario, sem OAuth | Linhas 46-47, ADR-006 | ✅ |
| 9 | Chess.com so em P4 | Linha 53, 245-249 | ✅ |
| 10 | Banda 0-1200 | Linha 124 | ✅ |
| 11 | Coach como tom, nao personagem | Secao 16: "tom, nao personagem" | ✅ |

**Conclusao desta secao:** Zero violacoes das Regras Inquebraveis. Zero P0. Todos os P0 dos
relatorios anteriores foram resolvidos. O spec merece avancar.

---

## 3. Execucao-Prontidao Para O Codex (Ambiguidades Que Causariam PARADA)

O Codex implementa literalmente. Diante de ambiguidade, ele PARA — por design. Abaixo, os 7 pontos
onde o spec atual nao tem detalhe suficiente para implementacao sem adivinhar.

### 3.1 P0 fase: `generatePlan` com `weaknesses` vazio? (P0-BLOCK)

> Linhas 206-215: P0 gera plano fixo. `generatePlan(profile, weaknesses, sessionMinutes, date) -> DailyPlan`. P1: tema vem das fraquezas.

**Ambiguidade:** Em P0, o detector de fraquezas (P1) nao existe. O array `weaknesses` chega vazio ou
com um default? Se vazio, o gerador nao tem tema para priorizar. O spec diz "tema fixo" mas nao diz
QUAL tema fixo. O Codex vai PARAR.

**Solucao:** Definir em P0: `generatePlan` em P0 ignora `weaknesses` e usa um tema fixo hardcoded
(ex.: `'hanging-piece'` para 0-800, `'fork'` para 800-1200, conforme a `band` do perfil). Escrever
explicitamente: "P0: `weaknesses` e ignorado; tema fixo mapeado de `band`."

**Impacto nao resolvido:** Alto. Sem esta definicao, P0 nao compila com sentido.

### 3.2 `Weakness.score` — sem formula (P1-BLOCK)

> Linha 117: `score: number // 0..1`. Linhas 160-168: tabela de regras com confidence, mas sem score.

**Ambiguidade:** A spec diz que `Weakness[]` e ordenado por `score`, mas nao ha uma unica linha
explicando como `score` e calculado. A tabela da secao 7 mapeia Signal -> WeaknessTag + Confidence.
Mas score (0..1) e diferente de confidence (low/medium/high). O Codex precisa de uma funcao:
`computeScore(signals: Signal[]): number` ou de um mapeamento. Exemplos de perguntas que o Codex
faria:
- Multiplos sinais da mesma fraqueza somam scores?
- `confidence: 'high'` = score 0.9? 0.8?
- `opening.lossRate` de 70% vs 55% — score diferente?
- Fraquezas vindas de `judgment.blunders` com `games=30` vs `games=5` tem scores diferentes?

**Solucao:** Especificar pelo menos a funcao-base: `score = baseConfidenceScore * frequencyFactor`.
Exemplo: `low=0.3, medium=0.6, high=0.9`, multiplicado por `min(1.0, signalCount / minGamesForFullConfidence)`.
Ou delegar ao plano de implementacao, mas DECLARAR que o plano de implementacao deve definir a formula
antes da Fase P1 comecar.

**Impacto nao resolvido:** P1 nao sai do papel sem isso. Medio-alto.

### 3.3 Feedback binario `easy`/`hard` — sem `ok` (P2-DESIGN)

> Linha 141: `feedback?: 'easy' | 'hard'`. Comparar com spec anterior: `'easy' | 'ok' | 'hard'`.

**Ambiguidade de produto:** So duas opcoes. O que o usuario escolhe se a tarefa foi "normal, nem
facil nem dificil"? Se ele nao escolher nada (feedback undefined), o loop de adaptacao nao ajusta?
Se escolher `easy` quando foi normal, o app sobe a dificuldade indevidamente.

**Analise:** O spec removeu `'ok'` deliberadamente (linha 141 vs spec unificado linha 138). Isso
pode ser intencional — forcar uma decisao binaria. Mas sem justificativa documentada, parece omissao.
Para um usuario unico (o dono), talvez `easy` e `hard` bastem se `hard` significar "precisa de mais
pratica" e `easy` significar "ja dominei, pode avancar". Ainda assim, a ausencia de feedback
(undefined) precisa de comportamento definido: tratar como `'ok'` implicito (mantem tudo)?

**Solucao:** Ou restaurar `'ok'` com comportamento "mantem tema e volume", ou documentar que
feedback ausente = sem ajuste no proximo plano.

**Impacto nao resolvido:** Baixo para P2, mas a decisao e de produto e afeta a qualidade da
adaptacao.

### 3.4 `PlanBlock.coachNote` em P0 — o que escrever? (P0-BLOCK)

> Linha 139: `coachNote: string`. Linha 257-261: tom adulto, sem prometer rating.

**Ambiguidade:** Em P0, sem detector de fraquezas, o `coachNote` de cada bloco diz o que? O spec diz
que `coachNote` e um campo do `PlanBlock`, gerado pelo `generatePlan`. Mas em P0, sem fraquezas, nao
ha "reason" real. O Codex precisa de um catalogo de mensagens P0 ou de uma regra de geracao.

**Solucao minima:** Em P0, `coachNote` e fixo por tipo de bloco. Ex.: aquecimento -> "Vamos aquecer
com alguns puzzles do seu nivel.", tema -> "Este tema ajuda a reduzir erros comuns na sua faixa.",
transferencia -> "Aplique o que treinou numa partida pensada."

**Impacto nao resolvido:** Codex PARA em P0 sem saber o que colocar no `coachNote`.

### 3.5 Status "terminada" de partida — quais valores? (P1-BLOCK)

> Linha 190: "apenas para partidas TERMINADAS (nunca ao vivo)". Linha 202: `status` como campo do export.

**Ambiguidade:** O campo `status` da API Lichess retorna valores como: `'started'`, `'created'`,
`'aborted'`, `'mate'`, `'resign'`, `'timeout'`, `'draw'`, `'stalemate'`, `'cheat'`, `'outoftime'`,
`'unknownFinish'`. O spec diz "terminadas" mas nao lista quais valores sao considerados terminados.
O Codex precisa saber se `'aborted'` conta (nao deveria — partida abandonada sem conclusao), se
`'unknownFinish'` conta (provavelmente sim, mas sem certeza), se `'cheat'` conta (sim, terminou).

**FATO (doc Lichess API):** O campo `status` no GameExported e uma string com os valores listados
acima. Fonte: API spec (lichess-org/api, doc/specs/lichess-api.yaml).

**Solucao:** Listar explicitamente: `status NOT IN ('started', 'created')`. Ou listar os inclusos:
`status IN ('mate', 'resign', 'timeout', 'draw', 'stalemate', 'cheat', 'outoftime', 'unknownFinish')`.

**Impacto nao resolvido:** Sem isso, o Codex pode filtrar errado e quebrar a regra "nunca ao vivo",
ou filtrar demais e perder partidas validas.

### 3.6 `rating-history` coletado mas nao usado (P1-WASTE)

> Linha 197: `GET /api/user/{username}/rating-history`. Secao 7: tabela de deteccao — zero regras
baseadas em rating history.

**Ambiguidade funcional:** O spec manda coletar `rating-history` mas nenhuma regra do detector usa
esse dado. Para que serve? Duas possibilidades: (a) e um artefato do spec unificado que nao foi
limpo, ou (b) sera usado em P2 (loop de adaptacao) para ajustar `band`. Se for (b), precisa ser
explicitado.

**Solucao:** Se o rating-history vai ser usado para auto-ajuste de `band` ou para metrica semanal
(P2), declarar. Senao, remover do coletor P1 para nao fazer fetch desnecessario (lembrete: rate
limit se aplica mesmo com um usuario; cada request conta).

**Impacto nao resolvido:** Baixo. Mas fere o principio de nao fazer trabalho inutil e gera trafego
desnecessario no Lichess.

### 3.7 `opening-principles` duplicado no detector (P1-MERGE)

> Linhas 165 e 166: `opening.lossRate alto numa abertura recorrente` -> `opening-principles`
(medium). `color.lossRate desbalanceado` -> `opening-principles` (low).

**Ambiguidade de merge:** Dois sinais diferentes produzem a mesma `WeaknessTag`. Se ambos dispararem
para o mesmo usuario (ex.: perde muito de pretas E perde muito na Siciliana), o detector deve gerar
UMA fraqueza `opening-principles` com score/confidence combinados, ou DUAS fraquezas separadas?
O spec nao define a estrategia de merge/agregacao de sinais com mesmo `WeaknessTag`.

**Solucao:** Definir que sinais com mesmo `WeaknessTag` sao agregados em uma unica `Weakness`,
com `confidence = max(confidences)` e `score` recalculado com todos os sinais contribuintes. Ou,
alternativamente, gerar fraquezas separadas e deixar o `generatePlan` decidir qual priorizar pelo
score mais alto.

**Impacto nao resolvido:** Medio. Sem merge definido, o plano pode recomendar "abertura" duas vezes
no mesmo dia, o que e redundante.

---

## 4. Arquitetura — O Que Esta Certo E O Que Esta Fragil

### 4.1 Acertos

**Separacao Dominio/Infra (linhas 66-77):** Correta. `Dominio nao importa Infra`. As quatro camadas
(UI, Aplicacao, Dominio, Infra) sao bem definidas. Esta arquitetura e diretamente implementavel.

**`SignalValue` como union discriminada (linhas 98-106):** Forte. Cada `kind` tem payload proprio.
`acpl?` opcional no `judgment` e correto — partidas nao analisadas nao terao ACPL. `kind: 'manual'`
com `tag: WeaknessTag` permite o usuario registrar sua propria percepcao de fraqueza, o que e um bom
escape hatch.

**`updatedAt` em `PlanBlock` (linha 142):** Correto para o merge por registro no sync. Resolve a
critica do relatorio Antigravity sobre LWW por secao inteira.

### 4.2 Fragilidades

**F1 — `LearnerProfile.band` e estatico (linha 124):** A `band` e definida no onboarding e nunca
atualizada automaticamente. Se o usuario comeca como `0-800` e melhora, o plano continua gerando
tarefas de iniciante. O spec nao preve recalculo automatico de `band` a partir de sinais (rating,
rating-history). Isso deveria ser uma regra simples em P2: "se rating rapido medio > 800 por 4
semanas, sugerir migrar para banda 800-1200". Sem isso, o app fica estatico e a adaptacao so ocorre
DENTRO da banda, nunca ENTRE bandas.

**F2 — `sessionMinutes` fixo apos onboarding (linha 125):** O usuario escolhe 5/15/30/60 no
onboarding e esse valor e usado para sempre. Mas "tempo disponivel" varia por dia. Um usuario que
configurou 60min pode num dia corrido so ter 15min. O spec nao preve ajuste rapido de sessao na tela
"Hoje". Isso e uma friccao real de UX. Nao e bloqueante para P0, mas e uma omissao de produto que o
dono vai sentir.

**F3 — `generatePlan` pode gerar blocos para `time-trouble` sem URL (linha 186-187):** A fraqueza
`time-trouble` nao tem destino Lichess com URL. O spec diz "recomendacao de ritmo + revisao (sem url
de puzzle)". Isso significa que o `PlanBlock.destination.url` fica `undefined`. A UI precisa tratar
esse caso (mostrar so texto, sem botao "Abrir no Lichess"). O spec nao menciona este tratamento na
camada de UI. Codex implementaria o dominio corretamente, mas a UI quebraria ou mostraria um link
vazio.

**F4 — Ausencia de `WeaknessTag` para erros taticos especificos alem dos listados:** A lista de
`WeaknessTag` (linhas 90-94) cobre 13 temas. Mas o Lichess tem dezenas de temas de puzzle
(https://lichess.org/training/themes). O detector so consegue mapear sinais para esses 13 tags.
Se o usuario tem fraqueza real em `'deflection'`, `'interference'`, `'trappedPiece'`, ou
`'attackingF2F7'`, o detector nao tem tag correspondente. Esses sinais seriam perdidos ou mapeados
genericamente para `'blunder-rate'`. Para 0-1200, os 13 tags provavelmente bastam. Mas a limitacao
deveria ser documentada.

---

## 5. Detector De Fraquezas — Solidez Para 0-1200

### 5.1 Regras — avaliacao

| Regra | Avaliacao | Problema |
|---|---|---|
| judgment.blunders alto | ✅ Correta para 0-1200. Blunders sao o sinal mais forte nessa faixa. | "Alto" precisa de limiar. Sugestao: `blunders/games > 0.5` em vez de "muitos". |
| clock.timeoutLosses relevante | ✅ Timeout e comum em iniciantes. | "Relevante" precisa de limiar: `timeoutLosses >= 2` no conjunto? |
| opening.lossRate alto | ✅ Valido. Perder sempre na mesma abertura e sinal real. | `lossRate > 0.6` e `games >= 5` como condicao minima. |
| color.lossRate desbalanceado | ⚠️ Baixa confianca (low), correto. Mas `desbalanceado` e vago. | Definir: `abs(whiteLossRate - blackLossRate) > 0.2`. |
| derrotas longas -> conversion | ⚠️ A logica e invertida. Derrotas em partidas longas podem indicar problema de CONVERSAO (se estava ganhando e perdeu) OU problema de FINAL (se o final foi jogado mal). | Separar em duas regras ou detectar por material: se tinha vantagem > +2 e perdeu -> conversion; se o jogo foi longo e equilibrado -> endgame. |
| manual | ✅ Escape hatch correto. | Sempre `confidence: 'low'`, mas pode ser o sinal mais valioso se o dono se conhece bem. |

### 5.2 `confidence` como qualificador — acerto

Usar `confidence` em vez de afirmar causalidade e a decisao mais madura do spec. Separar sinais
fortes (blunders altos = high) de sinais fracos (cor desbalanceada = low) evita que o plano persiga
fantasmas. Para um usuario de 0-1200, isso e suficiente.

### 5.3 `evidence` — lacuna de exemplos

> Linha 119: `evidence: string // hipotese curta, linguagem nao-determinista`

O spec diz O QUE o campo deve conter (hipotese, nao afirmacao), mas nao mostra COMO. Sem exemplos
concretos, o Codex pode gerar textos tecnicos demais ("blunder rate 0.7 em 30 jogos") ou vagos demais
("voce erra as vezes"). Exemplos que faltam:

- Bom: "Nos seus ultimos jogos, a analise do Lichess registrou erros graves em varias partidas —
  pode ser util revisar o basico de pecas penduradas."
- Ruim: "Blunder rate alto."
- Bom: "Voce perdeu no tempo em 3 partidas recentes — talvez um ritmo um pouco mais lento ajude."
- Ruim: "Time trouble detectado."

**Solucao:** Incluir 3-4 exemplos de `evidence` boa e 2 de `evidence` proibida (deterministica) no
plano de implementacao.

---

## 6. Lichess — Contratos De API

### 6.1 Verificacao dos endpoints

| Endpoint | Uso no spec | Correto? |
|---|---|---|
| `GET /api/user/{username}` | Perfil, rating por ritmo, banda inicial | ✅ Publico, sem auth. |
| `GET /api/user/{username}/rating-history` | Coletado mas nao usado (ver 3.6) | ✅ Publico. |
| `GET /api/games/user/{username}` | Sinais de fraqueza | ✅ Publico, parametros via query. |
| `lichess.org/training/themes` | Validacao dinamica de slugs | ✅ Lista publica de temas. |

### 6.2 Parametros do export de partidas — checagem

> Linhas 198-201: `max=30`, `rated=true`, `opening=true`, `evals=true`, `accuracy=true`,
`analysed=true`, `clocks=true`, `moves=false`, `pgnInJson=false`, `sort=dateDesc`.

**FATO (doc viva):** O parametro `analysed` e um filtro booleano. Com `analysed=true`, a API retorna
**apenas partidas analisadas** pelo servidor Lichess (fora jogos ao vivo/em andamento por definicao).
Isso resolve automaticamente o problema de "nunca partida ao vivo" — partidas `started`/`created`
nao tem analise e nao serao retornadas com `analysed=true`.

**Porem:** Filtrar `analysed=true` elimina partidas NAO analisadas, que ainda tem sinais uteis
(abertura, cor, ritmo, relogio). O spec usa esses sinais "baratos" na secao 7. Se `analysed=true`
filtra fora partidas sem analise, perdemos os sinais de abertura, cor, ritmo e relogio dessas
partidas.

**INFERENCIA:** O `analysed=true` deveria ser **dois fetches separados** ou um fetch sem
`analysed=true` + filtro local: processar TODAS as partidas (max=30), usando `judgment` apenas nas
que tem `analysis` populado, e usando sinais baratos (opening, clock, color) em todas. O spec nao
faz essa distincao — trata como um unico fetch com `analysed=true` e espera que o parser tolere
ausencia de `analysis`. Mas se `analysed=true` filtra as partidas no servidor, as sem analise NEM
CHEGAM ao parser. Isso e uma contradicao.

**Solucao:** Remover `analysed=true` do fetch. Baixar `max=30` partidas sem filtrar por analise.
No parser, `players.white.analysis` e `players.black.analysis` podem ser `undefined` — o parser ja
e especificado como "TOLERANTE a ausencia de analysis/accuracy" (linha 202). Isso garante que
partidas nao-analisadas ainda contribuem com sinais de abertura, cor e relogio.

**Impacto:** Medio. Com `analysed=true`, o detector perde sinais baratos de partidas nao-analisadas,
reduzindo a base de dados para fraquezas como `opening-principles` e `time-trouble`.

### 6.3 Rate limit e fair play

> Linhas 58-59: uma requisicao por vez; 429 -> >=60s; backoff; User-Agent identificavel.

**FATO (Lichess API Tips, 2026-06-06):** Confirmado — "Only make one request at a time" e "If you
receive HTTP 429, wait a full minute." Fonte: https://lichess.org/page/api-tips.

Para **um usuario** (jukasparov), com `max=30` partidas e cache TTL 30min, o volume de requisicoes e
irrelevante: ~3 chamadas na abertura do app (perfil, rating-history, games), uma vez a cada 30 min.
Sem risco de 429.

**Fair play:** O spec nao usa Board API, Bot API ou Challenge API. Nao sugere lances. So abre URLs
do Lichess para estudo pos-partida. Zero risco de violacao. ✅

### 6.4 Risco do parser com `accuracy` ausente

> Linha 200: `accuracy=true`. Linha 202: parser "TOLERANTE a ausencia de analysis/accuracy."

**FATO:** `accuracy` so e retornado quando a partida foi analisada com engine. Se a partida nao foi
analisada, o campo `accuracy` vem ausente ou null. O parser precisa tratar `players.white.analysis`
inteiro como potencialmente undefined. O spec diz "tolerante" mas nao especifica o comportamento:
- Se `analysis` ausente: pular `judgment` signal para esta partida, mas ainda extrair `opening`,
  `clock`, `color`.
- Se `analysis` presente mas `accuracy` ausente: usar `inaccuracy`, `mistake`, `blunder` e `acpl`
  (se disponivel).

**Solucao:** Especificar o fallback no contrato do parser: "se `players.*.analysis` for undefined,
nao gerar `judgment` signal desta partida. Se existir mas `accuracy` for undefined, gerar `judgment`
com `acpl?: undefined`."

---

## 7. Sync — Avaliacao Do Design (P3)

### 7.1 Merge por registro — resolve a perda de dados?

**SIM**, resolve. O problema do spec anterior era "LWW por secao de topo" — se o dispositivo A
escrevesse `profile` e o dispositivo B escrevesse `profile` 1 segundo depois, o A inteiro era
sobrescrito. Com merge por registro (cada `PlanBlock`, `LearnerProfile` como item individual com
`updatedAt`), apenas itens mais recentes sobrescrevem os mais antigos. A preservacao de
`status: 'done'` mesmo com timestamp antigo e a protecao correta contra "desconcluir" tarefas.

### 7.2 D1 vs KV — decisao correta?

**SIM.** KV e eventualmente consistente: um `PUT` pode demorar ate 60s para ser visivel em um `GET`
global. Se o usuario salva no celular e imediatamente abre no PC, pode ver estado antigo. D1 e
consistencia imediata (SQLite). Para sync de estado, D1 e a escolha certa.

### 7.3 Lacunas no design de sync

**L1 — Hash sem algoritmo especificado:** "hash(codigo)" (linha 237) — SHA-256? Use SHA-256. O
codigo de sync e usado como chave de armazenamento. Especificar o algoritmo evita que o Codex use
MD5 ou uma funcao nao-criptografica.

**L2 — O worker valida o hash mas nao tem auth alem disso:** Qualquer pessoa que conheca o hash pode
ler/escrever o estado. Para um usuario, isso e aceitavel (o codigo de 24 chars e o segredo). Mas o
spec deveria notar que isso e "security through obscurity" e que o D1 deve ter limite de rate no
worker para evitar bruteforce do codigo.

**L3 — Conflito de `updatedAt` identico:** Dois dispositivos podem modificar o mesmo `PlanBlock` com
o mesmo `updatedAt` (resolucao de milissegundos pode colidir). O spec nao define desempate. Sugestao:
incluir `clientId` no registro e, em caso de empate de timestamp, o `clientId` lexicograficamente
maior vence. Ou usar UUID v7 (timestamp-ordered) em vez de ISO string.

**L4 — Sem estrategia de limpeza do D1:** O que acontece com registros antigos? Planos de 6 meses
atras ficam no D1 para sempre? O spec deveria mencionar uma politica de retencao (ex.: planos com
mais de 90 dias sao removidos do D1 no proximo sync).

---

## 8. Privacidade E IP

### 8.1 Status: LIMPO

- Zero tokens armazenados. Zero PGNs persistidos. Zero PII em logs.
- Username Lichess e dado publico. ✅
- Sync armazena so estado sincronizavel, nunca imagens. ✅
- Export JSON e delete local implementados. ✅
- Sem OAuth — sem token para vazar. ✅

### 8.2 Unico ponto de atencao

O spec diz "nada de PII em logs" (linha 61) mas nao define o que constitui "log". Se o `console.log`
do browser for usado para debug, e se ele logar o objeto `LearnerProfile` inteiro, o username
(jukasparov) aparece. Isso nao e PII (e dado publico), mas e uma ma pratica. Sugestao: adicionar
"console.log em producao nunca deve conter objetos de dominio completos" aos guardrails.

---

## 9. Ordem Das Fases — Correta?

| Fase | O que entrega | Ordem correta? |
|---|---|---|
| P0 | Scaffold + time budget + plano fixo | ✅ Base sem a qual nada funciona. |
| P1 | Lichess adaptativo | ✅ Valor central: plano baseado em fraquezas reais. |
| P2 | Loop de adaptacao (feedback + revisao semanal) | ✅ O valor: o plano melhora com uso. |
| P3 | Sync | ✅ Conveniencia depois do valor. Correto. |
| P4 | Multi-fonte leve | ✅ Expansao sem pressa. |
| P5 | Comunidade | ✅ Fora do escopo pessoal. |

**Veredito:** Ordem correta. Nao ha conveniencia antes de valor. A unica ressalva e que P0 entrega
plano "fixo" — o dono usaria isso por semanas enquanto P1 e construido? Ou P0 e P1 sao proximos o
suficiente para serem construidos em sequencia rapida? O spec nao estima tempo entre fases.

---

## 10. O Que Cortar, O Que Falta, O Que Esta Perigoso

### 10.1 Cortar (nao agrega na ferramenta pessoal)

- **`rating-history` fetch em P1 se nao for usado:** Remover do coletor ate que exista uma regra
  que consuma esse dado (ex.: auto-ajuste de `band` em P2).
- **`chesscom` em P4 se o dono nao tiver conta ativa la:** O spec diz que e "snapshot de nivel". Se
  o dono nao joga no Chess.com, P4 e trabalho morto. Perguntar ao dono antes de implementar P4.

### 10.2 Falta (lacunas que o plano de implementacao precisa preencher)

1. **Formula de `score` (sec 3.2 acima).** Sem isso, P1 nao implementa.
2. **Catalogo de `coachNote` para P0 (sec 3.4 acima).** Codex precisa de strings concretas.
3. **Limiares quantitativos para o detector (sec 5.1 acima).** "Alto", "relevante", "desbalanceado"
   precisam virar numeros.
4. **Exemplos de `evidence` boa e ruim (sec 5.3 acima).** Codex precisa de modelos.
5. **Comportamento da UI quando `destination.url` e undefined.** Para `time-trouble` e notas manuais.
6. **Auto-ajuste de `band` em P2.** Senao o plano fica estatico para sempre.
7. **Tratamento de `sessionMinutes` flexivel por dia.** UX gap que o dono sentira.

### 10.3 Perigoso (riscos subestimados)

**P1.1 — P0 gera "plano fixo" que o dono pode achar inutil e abandonar o projeto:** P0 entrega
tema fixo ignorando as fraquezas reais. Se o dono usa por 2 semanas e o plano sempre recomenda o
mesmo tema, a percepcao de valor e baixa. Isso e um risco de abandono do projeto ANTES de chegar
em P1 (que e onde o valor real aparece). Mitigacao: reduzir o tempo entre P0 e P1 ao maximo. Ou
fazer P0 com um mini-detector hardcoded (ex.: 3 regras manuais) so para dar variedade.

**P1.2 — `max=30` partidas pode ser pouco se o dono joga muito:** Se o dono joga 10 partidas por
dia, `max=30` cobre 3 dias. Sazonalidade semanal (fim de semana vs dia util) some. `max=50` (spec
anterior) ou `max=50` com `since=last7days` seria mais robusto. Por outro lado, `max=30` e mais leve
e reduz risco de timeout no parse. Para um usuario, 30 partidas e uma janela razoavel de 7-10 dias
para um jogador casual. Avaliar com o dono.

**P1.3 — Lichess muda slugs de `training/themes` e o fallback fica desatualizado:** O spec preve
validacao dinamica (linha 172), o que e correto. Mas se o endpoint de `training/themes` mudar de
formato, o parser quebra. O fallback hardcoded e a ultima linha de defesa. Isso e um risco aceitavel.

---

## 11. Recomendacoes Ao Planejador (Claude Opus)

### Antes de liberar para o Codex:

1. **Escrever a secao "P0: Comportamento sem detector"** — definir tema fixo por `band`, catalogo de
   `coachNote`, e comportamento do `generatePlan` com `weaknesses: []`.

2. **Especificar a formula de `score`** — `baseScore` (low=0.3, medium=0.6, high=0.9) *
   `frequencyFactor` (min(1.0, signalCount/minGames)). Ou delegar ao plano de implementacao com
   a instrucao explicita de definir antes de P1.

3. **Definir limiares quantitativos** — `blunders/games > 0.5`, `timeoutLosses >= 2`, `lossRate > 0.6
   && games >= 5`, `abs(whiteLossRate - blackLossRate) > 0.2`. Nao precisam ser permanentes, mas
   precisam EXISTIR para a primeira implementacao. Ajustes finos vem depois com uso real.

4. **Resolver `analysed=true`** — remover do fetch. Deixar o parser tratar `analysis` como optional.
   Isso garante que partidas nao-analisadas ainda contribuem com sinais baratos.

5. **Adicionar exemplos de `evidence`** — 3 bons, 2 proibidos. Codex precisa ver o tom.

6. **Definir `status` de partidas terminadas** — listar os valores explicitamente.

7. **Especificar algoritmo de hash para sync** — SHA-256. Desempate de timestamp identico.

### Para considerar (nao bloqueante):

- Flexibilizar `sessionMinutes` na tela Hoje (ajuste rapido).
- Auto-ajuste de `band` em P2.
- Mini-detector hardcoded em P0 para dar variedade ao plano fixo.
- `feedback` com 3 opcoes (`easy`/`ok`/`hard`) em vez de 2, ou documentar a intencao do binario.

---

## 12. Conclusao

**Este spec e uma melhoria dramatica sobre o spec unificado.** O planejador incorporou TODAS as
correcoes dos tres relatorios anteriores. Nao ha violacoes de governanca. A arquitetura e solida.
A execucao e viavel.

O que separa este spec de "pronto para o Codex" sao **7 ambiguidades de implementacao** (secao 3)
que fariam o Codex PARAR, e **6 lacunas de especificacao** (secao 10.2) que o plano de
implementacao precisaria preencher com adivinhacao. Resolver as 7 ambiguidades antes de passar para
o Codex reduz o risco de ciclos de pergunta-resposta e acelera a entrega.

**Nota final: 6.8/10.** Sobe para **8.0/10** se as 7 ambiguidades da secao 3 forem resolvidas.
Sobe para **8.5/10** se adicionalmente as lacunas da secao 10.2 forem preenchidas no plano de
implementacao.

Recomendacao: **APROVAR COM CORRECOES.** O spec e a base correta para a ferramenta pessoal.
Corrigir as ambiguidades antes da primeira task do Codex.

---

## Resumo Do Que O Planejador Nao Viu (Ou Nao Especificou)

| # | Ponto cego | Severidade | Secao |
|---|---|---|---|
| 1 | P0 sem tema definido — `generatePlan` com fraquezas vazias | Codex bloqueia | 3.1 |
| 2 | `score` sem formula — detector nao tem como rankear | P1 inviavel | 3.2 |
| 3 | `coachNote` sem conteudo para P0 | Codex bloqueia | 3.4 |
| 4 | `analysed=true` filtra partidas com sinais baratos | Perda de dados | 6.2 |
| 5 | `status` de partida "terminada" sem lista de valores | Risco fair-play | 3.5 |
| 6 | `opening-principles` duplicado sem regra de merge | Redundancia | 3.7 |
| 7 | `rating-history` fetch sem uso — trafego desperdicado | Rate limit | 3.6 |
| 8 | `band` nunca atualizada automaticamente | Plano estatico | 4.2 (F1) |
| 9 | `sessionMinutes` fixo — sem ajuste rapido diario | Friccao UX | 4.2 (F2) |
| 10 | Hash de sync sem algoritmo especificado | Seguranca | 7.3 (L1) |
