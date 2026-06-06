> **SUPERSEDED em 2026-06-06.** Este spec foi substituido por
> `2026-06-06-rotina-pessoal-adaptativa-design.md` apos a revisao de tres relatorios
> (Codex, Claude/DeepSeek, Antigravity) e a decisao do dono pela moldura "pessoal primeiro".
> Mantido apenas como historico. NAO executar. Correcoes aceitas: clean-room (app novo do zero, sem
> herdar `chessking-tutor`), ChessKing fora do dominio, tipos estritos, sync por registro e adiado,
> slugs dinamicos, erro/offline especificados, sem OAuth na ferramenta pessoal.

# Spec De Design: Chess Tutor Unificado (multi-fonte, local-first) [SUPERSEDED]

- Data: 2026-06-06
- Autoria do planejamento: Claude (claude-opus-4-8)
- Executor: Codex (implementa a partir deste spec e do plano de implementacao derivado)
- Base de codigo: evoluir o app existente em `chessking-tutor` (React + Vite + TS, local-first)
- Status: aguardando revisao do usuario antes de gerar o plano de implementacao

> Divisao de papeis: este documento e os planos derivados sao **ordens de execucao**. O Codex
> implementa exatamente o que esta escrito, sem inferir escopo novo. Toda ambiguidade encontrada
> pelo Codex deve PARAR a tarefa e ser perguntada, nao adivinhada.

---

## 1. Objetivo

Um unico PWA, pessoal e local-first, que:

1. entende o nivel e as fraquezas do usuario a partir do historico real (Lichess via API publica;
   Chess.com via API publica; e prints/registro manual de outros apps de estudo);
2. gera um plano de treino adaptado ao **tempo que o usuario escolher** (ex.: 5, 15, 30, 60 min);
3. abre as tarefas certas na fonte certa (Lichess: `training/{tema}`, practice, study, analysis;
   ChessKing: curso > secao registrado manualmente);
4. acompanha progresso, pede feedback curto ("facil/ok/dificil") e adapta as proximas licoes;
5. sincroniza progresso entre computador e celular de forma simples (um usuario, sem conta).

O app serve estudo no **Lichess e no ChessKing ao mesmo tempo**: "Lichess" e "ChessKing" sao
**fontes de treino** dentro do mesmo app, escolhidas por configuracao. Melhorias no nucleo (dominio)
beneficiam todas as fontes por construcao.

## 2. Nao-objetivos (cortar sem do)

- Nao criar tabuleiro proprio nem jogo dentro do app.
- Nao ajudar durante partida ao vivo. Nunca sugerir lances.
- Nao usar OAuth do Lichess no MVP (so dados publicos por username).
- Nao rodar engine (Stockfish WASM) no MVP. Usar a analise que o Lichess **ja fez**.
- Nao fazer leitura automatica de prints (OCR/visao) no MVP. Print = upload + registro manual.
- Nao armazenar token, senha, nem PGN completo por padrao.
- Nao copiar conteudo proprietario do ChessKing (cursos, puzzles, textos). Usar apenas NOMES de
  curso/secao que o usuario registra e o progresso que ele informa.
- Nao cobrar, sem paywall, sem anuncio.

## 3. Guardrails obrigatorios (o Codex deve obedecer sempre)

- **API Lichess:** uma requisicao por vez; ao receber HTTP 429, esperar no minimo 60s antes de nova
  tentativa; backoff exponencial em falhas. Definir `User-Agent` identificavel.
- **API Chess.com:** publica, read-only; sem paralelizar; `User-Agent` identificavel.
- **Revalidacao:** antes de implementar qualquer coletor, o Codex DEVE revalidar nomes de campos e
  parametros contra a doc oficial viva (ver secao 6.1). Os contratos abaixo sao a base conhecida em
  2026-06-06, mas a doc oficial vence.
- **Privacidade:** nada de PII em logs. Nada de token. Nada de PGN completo persistido por padrao
  (so derivados). Username de xadrez e dado publico, pode ser guardado.
- **Determinismo:** detector de fraquezas e gerador de plano sao funcoes puras e testaveis
  (entrada -> saida), sem efeitos colaterais e sem rede dentro do dominio.
- **Sem scope creep:** implementar exatamente a fase corrente. Nao adiantar fases futuras.

## 4. Arquitetura

Um PWA (evolucao do `chessking-tutor`). Camadas:

```
UI (React)                         telas: Hoje, Progresso, Fontes/Config, Revisao semanal
  |
Aplicacao (hooks/estado)           orquestra: carregar dados, gerar plano, registrar feito, sync
  |
Dominio (TS puro, sem rede/React)  <- "nucleo compartilhado por construcao"
  • types
  • weakness/  (detector de fraquezas: Signal[] -> Weakness[])
  • plan/      (gerador: Profile + Weakness[] + timeBudget -> DailyPlan)
  • metrics/   (constancia, revisao semanal)
  • coach/     (voz Lemos: catalogo + selecao por contexto)
  • sources/   (abstracao Source/Destination; mapa fraqueza->destino por fonte)
  |
Infra (efeitos)                    services/ (fetch Lichess, fetch Chess.com), storage (IndexedDB/localStorage), sync client
```

Regra de ouro: **Dominio nao importa Infra.** Infra entrega dados ao Dominio; Dominio devolve
decisoes; Aplicacao liga os dois.

## 5. Modelo de dados (contratos)

Estender os tipos atuais de `chessking-tutor/src/domain/types.ts`. Tipos novos/alterados (o Codex
deve adaptar nomes existentes para nao quebrar o que ja funciona; migracao em Fase 0):

```ts
export type SourceId = 'lichess' | 'chessking' | 'chesscom' | 'screenshot'

export type Destination = {
  source: SourceId
  label: string            // ex.: "Lichess > Treino > Peca pendurada"
  url?: string             // deep link quando a fonte for web (Lichess). ChessKing nao tem url.
}

export type WeaknessTag =
  | 'hanging-piece' | 'fork' | 'pin' | 'skewer' | 'discovered'
  | 'mate-in-1' | 'mate-in-2' | 'back-rank'
  | 'opening-principles' | 'time-trouble' | 'endgame-pawn' | 'endgame-rook'
  | 'conversion' | 'blunder-rate'

export type Confidence = 'low' | 'medium' | 'high'

export type Signal = {
  source: SourceId
  kind: 'rating' | 'opening' | 'time-control' | 'color' | 'judgment' | 'clock' | 'manual'
  // payload pequeno e derivado; NUNCA PGN completo
  value: unknown
  confidence: Confidence
  observedAt: string       // ISO
}

export type Weakness = {
  tag: WeaknessTag
  score: number            // 0..1, prioridade
  confidence: Confidence
  evidence: string         // texto curto explicando o porque (mostrado pelo coach)
}

export type LearnerProfile = {
  lichessUsername?: string
  chesscomUsername?: string
  band: '0-800' | '800-1200' | '1200-1600'   // MVP trava ate 1600
  defaultSessionMinutes: number              // 5 | 15 | 30 | 60 (configuravel)
  goals: string[]
  updatedAt: string
}

export type PlanBlock = {
  id: string
  title: string
  source: SourceId
  destination: Destination
  estimatedMinutes: number
  task: string             // o que fazer
  stopRule: string         // quando parar
  reason: string           // por que este bloco hoje (liga a uma Weakness)
  coachNote: string
  status: 'pending' | 'done' | 'skipped'
  feedback?: 'easy' | 'ok' | 'hard'         // "o que achou da licao"
}

export type DailyPlan = {
  date: string
  sessionMinutes: number
  blocks: PlanBlock[]
  generatedFromWeaknessesAt: string
}
```

Persistencia: IndexedDB para dados estruturados e prints; localStorage so para flags leves.
`AppData` passa a conter `profile`, `plans`, `signals`, `weaknesses`, `dailyLogs`, `metrics`.

## 6. Fontes

### 6.1 Lichess (coletor publico) — Fase A/B

Endpoints (base conhecida 2026-06-06; **revalidar antes de codar** em `https://lichess.org/api`):

- Perfil/perfs: `GET https://lichess.org/api/user/{username}`
- Historico de rating: `GET https://lichess.org/api/user/{username}/rating-history`
- Export de partidas: `GET https://lichess.org/api/games/user/{username}`
  - Headers: `Accept: application/x-ndjson`, `User-Agent: chess-tutor (contato)`
  - Query: `max=50`, `rated=true`, `opening=true`, `evals=true`, `accuracy=true`,
    `analysed=true` (para o detector de veredito), `clocks=true`, `sort=dateDesc`,
    `pgnInJson=false`, `moves=false`.
  - Campos usados por partida: `opening{eco,name}`, `players.white/black.analysis{inaccuracy,mistake,
    blunder,acpl}`, `players.white/black.user.name`, `winner`, `speed`, `status`, `clock`, `rated`.
- **Sem OAuth.** Puzzle dashboard/activity (que exige OAuth) fica fora do MVP.
- Cache: guardar somente sinais derivados; TTL de re-fetch ao abrir o app (nao a cada navegacao).

### 6.2 Chess.com (importador de nivel) — Fase D

Reusar e generalizar `chessking-tutor/src/services/publicChess.ts` (ja funciona). Endpoints:
`GET https://api.chess.com/pub/player/{username}/stats` e `.../games/archives` (ultimo arquivo).
Uso: detectar nivel inicial (rating por ritmo, volume recente). Nao vira plano por si; vira `Signal`
de nivel/banda. Nao prometer equivalencia exata de rating Chess.com vs Lichess.

### 6.3 ChessKing (registro manual) — ja existe, manter

Continua manual: o usuario registra curso/secao/progresso e cola prints (IndexedDB). Destinos sem
url (rotulo "ChessKing > curso > secao"). Nao automatizar, nao copiar conteudo.

### 6.4 Screenshot / outro app (registro manual) — Fase D

Upload de imagem (IndexedDB como evidencia) + formulario curto: nivel aproximado, o que estudou,
temas fracos percebidos. Vira `Signal` `kind:'manual'` com `confidence:'low'`. Leitura automatica
(OCR/visao) e Fase E, fora do MVP.

## 7. Detector de fraquezas (Dominio, puro) — Fase B

Entrada: `Signal[]`. Saida: `Weakness[]` ordenado por `score`. Regras deterministas (todas com
teste unitario). Exemplos de regras (o plano de implementacao detalha limiares exatos):

| Sinal observado | Vira Weakness | Confianca |
|---|---|---|
| Muitos `blunder` por partida (analysis.blunder alto em jogos analisados) | `blunder-rate` | high |
| Derrotas com `clock` baixo no fim / status timeout | `time-trouble` | medium |
| Perde mais como uma cor / numa abertura recorrente | `opening-principles` | medium |
| Derrotas em partidas longas (muitos lances) | `conversion` / `endgame-*` | low-medium |
| acpl medio alto vs banda | `blunder-rate` | medium |
| Sinal manual do usuario ("erro X") | tag correspondente | low |

Quando faltar analise (jogo nao analisado), usar so sinais baratos (abertura, ritmo, cor, relogio,
contagem de lances). `confidence` reflete a forca do sinal. Nunca afirmar causalidade de rating.

## 8. Mapa fraqueza -> destino (por fonte) — Fase B

O gerador traduz cada `WeaknessTag` em `Destination`. Lichess usa temas de puzzle reais (o Codex
deve confirmar os slugs vivos em `lichess.org/training/themes`):

| WeaknessTag | Lichess destino (url) | ChessKing destino (rotulo) |
|---|---|---|
| hanging-piece | `lichess.org/training/hangingPiece` | curso de ganho de material |
| fork | `lichess.org/training/fork` | tatica principiantes |
| pin | `lichess.org/training/pin` | tatica |
| skewer | `lichess.org/training/skewer` | tatica |
| discovered | `lichess.org/training/discoveredAttack` | xeque descoberto |
| mate-in-1 | `lichess.org/training/mateIn1` | mate em 1 |
| mate-in-2 | `lichess.org/training/mateIn2` | mate em 2 |
| back-rank | `lichess.org/training/backRankMate` | mate / oitava |
| endgame-pawn | `lichess.org/practice` (finais de peoes) | finais de peoes |
| endgame-rook | `lichess.org/practice` (finais de torre) | finais de torre |
| opening-principles | `lichess.org/learn` ou analysis da partida | abertura por principios |
| time-trouble | recomendar ritmo mais lento + revisao | (n/a) |
| conversion | analysis da partida ganha e perdida | (n/a) |
| blunder-rate | `lichess.org/training/` (mix) + revisao | manutencao de tatica |

Bloco de "revisao de partida" abre `lichess.org/{gameId}` ou `/analysis` da partida especifica.

## 9. Gerador de plano sensivel ao tempo — Fase A (fixo) / B (adaptado)

Funcao pura: `generatePlan(profile, weaknesses, sessionMinutes, date) -> DailyPlan`.

- **Orcamento de tempo** preenche blocos ate `sessionMinutes`:
  - 5 min  -> 1 micro-bloco (ex.: 8 puzzles do tema mais fraco).
  - 15 min -> 1 tema + revisao curta.
  - 30 min -> aquecimento + tema + transferencia.
  - 60 min -> aquecimento(10) + tema(20) + transferencia(20) + final(10) (estrutura atual do app).
- Prioriza a `Weakness` de maior `score`; mistura fontes quando fizer sentido (ex.: tatica no
  ChessKing + revisao no Lichess).
- Reaproveitar a logica de `buildDailyTutorAssignments` (blocos, task, stopRule, coachNote) — ela ja
  e o formato certo; o que muda e (a) destinos vem do mapa da secao 8, (b) tema vem do detector da
  secao 7 em vez de progresso fixo do ChessKing, (c) numero/tamanho de blocos vem do orcamento.
- Em Fase A: tema e blocos fixos (sem detector) so para validar fluxo. Em Fase B: tema vem das
  fraquezas reais.

## 10. Loop de adaptacao — Fase D

- Cada bloco aceita `feedback` (`easy`/`ok`/`hard`) com um toque -> ajusta volume/dificuldade do
  proximo plano (regra simples: `hard` reduz volume e mantem tema; `easy` aumenta dificuldade ou
  troca tema; `ok` mantem).
- Ao abrir o app: re-fetch dos jogos recentes -> recomputa sinais -> regenera plano do dia
  preservando blocos ja concluidos.
- Revisao semanal (reusar `metrics`/`WeeklyReview`): escolhe o tema principal da proxima semana a
  partir da fraqueza dominante real.

## 11. Sync PC <-> celular — Fase C

Modelo mais simples que funciona para **um usuario**, sem conta, sem OAuth, sem event-sourcing:

- **Codigo de sync:** string aleatoria forte gerada uma vez (ex.: 24 chars). O usuario digita o
  mesmo codigo no segundo aparelho. Derivar a chave de armazenamento como `hash(codigo)`.
- **Backend:** um Cloudflare Worker + KV (free tier). Dois endpoints:
  - `PUT /state/{keyHash}`  body = JSON do estado + `updatedAt`. Grava no KV.
  - `GET /state/{keyHash}`  retorna o JSON ou 404.
- **Cliente:** ao mudar estado, debounce ~2s e `PUT`. Ao abrir/focar a aba, `GET`; se
  `remoto.updatedAt > local.updatedAt`, fazer merge **last-write-wins por secao de topo**,
  preservando sempre `status:'done'` de blocos (nunca "desconcluir" algo ja feito).
- **Seguranca/privacidade:** o estado nao contem PII obrigatoria (so usernames publicos + progresso).
  O codigo de sync e o unico segredo; tratar como senha (nao logar). HTTPS sempre.
- **Conflitos de plano:** preservar conclusoes do aluno e regenerar plano depois (regra ja prevista
  nos docs de sync do projeto).

Isto atualiza conscientemente a decisao antiga "sem backend no MVP": o backend e minimo e existe
apenas para o sync de um usuario.

## 12. Voz do coach (Lemos)

Reusar o conceito atual (task/stopRule/coachNote). Catalogo de mensagens por contexto
(`welcome`/`correction`/`return`/`progress`). Tom: PT-BR, frases curtas, sem emoji, sem vergonha,
sem prometer rating. Banlist conforme `docs/pedagogy/professor-lemos.md`. Durante partida ao vivo:
silencio.

## 13. Privacidade (atualizacao da postura)

- Local-first; dados no aparelho. Sync opcional guarda 1 JSON no KV atras do codigo de sync.
- Guardar: usernames (publicos), preferencias, plano, conclusoes, notas, sinais derivados, prints
  que o usuario subir.
- Nunca: token, senha, PGN completo, PII em logs.
- Direitos: exportar tudo (JSON), apagar tudo (local + remoto), desconectar fontes.
- Atualizar `docs/privacy/privacy-and-data.md` para refletir o sync por codigo.

## 14. Plano de fases (cada fase entrega app usavel; criterio de aceite explicito)

> Cada fase vira um conjunto de ordens atomicas no plano de implementacao (passo seguinte:
> skill writing-plans). Aqui ficam objetivo, arquivos-alvo e Definition of Done.

**Fase 0 — Refatorar dominio (sem feature nova)**
- Introduzir `SourceId`/`Destination` e generalizar destinos (hoje fixos em ChessKing).
- Introduzir `sessionMinutes` no gerador (orcamento de tempo) mantendo o comportamento de 60min.
- Alvos: `src/domain/types.ts`, `src/domain/tutor.ts`, testes.
- DoD: `npm run lint && npm run test && npm run build` verdes; app roda igual a hoje, mas o gerador
  aceita `sessionMinutes` e destinos genericos; testes cobrindo 5/15/30/60.

**Fase A — Lichess como fonte (plano fixo)**
- `services/lichess.ts` (coletor publico: perfil, rating-history; ainda sem detector).
- Destinos Lichess no mapa (secao 8) e blocos apontando para Lichess.
- Tela Config: inserir `lichessUsername` e `defaultSessionMinutes`.
- DoD: com um username real, o app mostra um plano do dia com blocos que abrem URLs corretas do
  Lichess; rate limit/429 respeitados; testes do parser de perfil.

**Fase B — Detector de fraquezas (adaptado)**
- `services/lichess.ts`: export de partidas (params da secao 6.1).
- `domain/weakness/`: regras da secao 7 (puras, testadas).
- Gerador escolhe tema pela fraqueza dominante (secao 9).
- DoD: o tema principal do plano muda conforme o historico real; testes com fixtures de partidas
  (analisadas e nao analisadas) produzindo as `Weakness` esperadas.

**Fase C — Sync PC<->celular**
- Worker + KV (secao 11) e `sync/` cliente.
- Tela Config: gerar/colar codigo de sync; status de sync.
- DoD: concluir um bloco no aparelho 1 aparece no aparelho 2 apos abrir; conclusoes nunca se perdem
  em conflito; testes do merge last-write-wins preservando `done`.

**Fase D — Multi-fonte + adaptacao**
- Import Chess.com (nivel) generalizando `publicChess.ts`.
- Upload de print + formulario manual -> `Signal`.
- Feedback `easy/ok/hard` por bloco + ajuste do proximo plano + revisao semanal escolhendo tema.
- UI de tempo (5/15/30/60).
- DoD: onboarding detecta banda inicial via Chess.com/print; feedback altera o proximo plano; revisao
  semanal define tema; testes das regras de adaptacao.

**Fase E — Depois (fora do MVP)**
- Leitura automatica de print (visao), engine WASM, OAuth (puzzle dashboard), PWA polish, faixa
  1600-2000, e entao empacotar para compartilhar com a comunidade.

## 15. ADRs a registrar (durante o planejamento)

1. ADR-004: App unico multi-fonte (atualiza ADR-001 "projetos separados"); ChessKing e Lichess viram
   fontes no mesmo codigo.
2. ADR-005: Sync de um usuario via codigo + Worker/KV (atualiza "sem backend no MVP").
3. ADR-006: Prints manuais antes de leitura automatica; sem LLM/visao no core do MVP.
4. ADR-007: Sem OAuth/sem engine no MVP; usar analise existente do Lichess e dados publicos.

## 16. Estrategia de testes

- Dominio (weakness, plan, metrics): unit tests deterministas com fixtures (Vitest, ja no projeto).
- Services: testes de contrato dos parsers (mock de payload ndjson Lichess e JSON Chess.com).
- Sync: teste do algoritmo de merge (last-write-wins + preservacao de `done`).
- Gate por fase: `npm run lint && npm run test && npm run build` verdes antes de fechar a fase.

## 17. Perguntas abertas / a confirmar com o usuario

1. Banda do MVP: travar em `0-1600` (como acima) esta ok, ou focar so `0-1200` primeiro?
2. Quantas partidas recentes analisar por padrao (`max=50`) e suficiente?
3. O codigo de sync gerado pelo app (sem login) atende, ou voce quer um identificador mais memoravel?
4. Onde hospedar o Worker de sync (conta Cloudflare existente?).

## 18. Convencoes de execucao para o Codex

- Implementar uma fase por vez, na ordem 0->A->B->C->D. Nao adiantar fases.
- Commits atomicos por tarefa; mensagem clara; rodar o gate de testes antes de fechar tarefa.
- Revalidar contratos de API vivos antes de escrever coletores (secao 6.1).
- Diante de ambiguidade ou contrato divergente: PARAR e perguntar, nunca adivinhar.
- Nao introduzir dependencias novas sem necessidade; preferir o que ja esta no `package.json`.
- Manter Dominio sem rede e sem React.
