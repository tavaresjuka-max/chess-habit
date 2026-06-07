# Spec De Design: Rotina (ferramenta pessoal adaptativa, Lichess-first, clean-room)

- Data: 2026-06-06
- Planejador: Claude (claude-opus-4-8)
- Executor: Codex
- Moldura decidida pelo dono: **pessoal primeiro, comunidade depois.** O dono e a propria validacao;
  nao ha "Fase 0 de mercado" (entrevistas/landing) antes de codar para a ferramenta pessoal.
- Substitui: `2026-06-06-chess-tutor-unified-app-design.md` (marcado superseded).
- Incorpora as correcoes dos relatorios: Codex "Spec em Xeque", Claude/DeepSeek consolidacao,
  Antigravity analise de design (em `docs/review/`).
- Estado de execucao em 2026-06-06: P0-P3 concluidas; P4 e P5 congeladas por decisao do dono.

> Este documento e uma PROPOSTA aprovada pelo dono como base de execucao para a ferramenta pessoal.
> Nao sobrepoe `AGENTS.md`; ao contrario, `AGENTS.md` foi atualizado para esta moldura.
> O Codex implementa exatamente o escrito; diante de ambiguidade ou contrato de API divergente,
> PARA e pergunta, nunca adivinha.

---

## 1. Objetivo

Uma ferramenta pessoal (PWA local-first) que ajuda o dono a estudar xadrez melhor usando o Lichess:
entende o nivel/fraquezas a partir do historico real do Lichess, gera um plano adaptado ao tempo
disponivel, abre a tarefa certa no Lichess, registra progresso, pede feedback curto e adapta as
proximas licoes. OAuth pessoal foi autorizado pelo dono como opt-in, com escopos minimos
`puzzle:read` e `study:write`. Se ficar boa, uma versao para a comunidade pode voltar na Fase P5,
mas P5 esta congelada ate nova decisao.

Dor que resolve (do proprio dono): "abro o Lichess e nao sei por onde comecar; me perco, estudo
demais uma coisa, deixo lacunas, nao evoluo, e paro".

## 2. Correcoes obrigatorias herdadas dos relatorios (todas aceitas)

1. **Clean-room / IP:** app novo do zero em `lichess-tutor/`. **Proibido** copiar arquivos, pastas,
   dependencias ou assets de `chessking-tutor`/`chessking-assets`. Pode-se reimplementar do zero
   *conceitos proprios* (estrutura de blocos, time budget, cadeia Signal->Weakness->Plan). Nenhuma
   linha vem por copia.
2. **Sem taxonomia ChessKing:** ChessKing **nao** e `SourceId`. Estudo externo, se existir, e fonte
   generica "outro" com texto livre â€” sem cursos/secoes/estrutura de produto pago.
3. **Tipos estritos:** nada de `value: unknown`. `Signal.value` e union discriminada por `kind`.
4. **Sync seguro e adiado:** merge por registro (timestamp por item, preserva `done`), nao
   last-write-wins por secao. Entra **depois** do valor (loop de adaptacao), nao antes.
5. **Slugs Lichess dinamicos:** validar temas contra `lichess.org/training/themes` no runtime, com
   fallback para a lista conhecida.
6. **Erro/offline/migracao especificados:** ver secao 11.
7. **Linguagem de hipotese:** fraqueza e "sinal possivel", nunca "voce perde por X". Sem promessa de
   rating.
8. **Pessoal = um usuario:** OAuth PKCE e permitido como **opt-in** apenas para `puzzle:read`
   (atividade de puzzles) e `study:write` (criar/importar Study). Escopos de jogo continuam proibidos.

## 3. Nao-objetivos (cortar sem do)

- Sem tabuleiro proprio, sem jogo no app, sem ajuda durante partida ao vivo (nunca sugerir lance).
- Sem OAuth obrigatorio. P2/P3 usam OAuth PKCE apenas como opt-in: `puzzle:read` para reconciliar
  resultado de treino e `study:write` para criar/importar Study. Sem engine WASM, sem OCR/visao,
  sem backend enquanto P4 estiver congelada.
- Sem ChessKing como fonte. Sem screenshots remotos (so local). **Chess.com promovido para P1**
  como fonte primaria de diagnostico (secao 14): parse de PGN transiente, guardar so sinais derivados,
  nunca PGN completo.
- Sem cobrar, sem anuncio, sem paywall. Doacao so como link externo (e so na versao-comunidade).

## 4. Guardrails (o Codex obedece sempre)

- API Lichess: uma requisicao por vez; HTTP 429 -> esperar >=60s; backoff; `User-Agent` identificavel.
- Revalidar nomes de campos/parametros contra a doc oficial viva antes de escrever qualquer coletor
  (registrar em `docs/research/sources.md`).
- OAuth: somente opt-in, tokens so locais, nunca em logs/export/bundle; escopos permitidos para Study
  (`study:write`) e leitura de atividade de puzzles (`puzzle:read`); proibidos
  `puzzle:write` e escopos de jogo (`board:play`, `bot:play`, `challenge:*`).
- Privacidade: nada de PII em logs; nada de token; nada de PGN completo persistido (so derivados).
- Dominio puro: sem rede e sem React; funcoes deterministas e testaveis.
- Uma fase por vez (P0->P1->P2->...); commits atomicos; rodar o gate antes de fechar tarefa.
- Diante de ambiguidade: PARAR e perguntar.

## 5. Arquitetura

PWA novo (React + Vite + TypeScript) em `lichess-tutor/`. Camadas:

```
UI (React)            telas: Hoje, Progresso, Config
Aplicacao (hooks)     orquestra: carregar dados, gerar plano, registrar feito, (depois) sync
Dominio (TS puro)     types | weakness/ | plan/ | metrics/ | coach/ | sources/
Infra (efeitos)       services/ (fetch Lichess), storage (IndexedDB via Dexie), (P4) sync client
```

Regra de ouro: **Dominio nao importa Infra.**

## 6. Modelo de dados (contratos)

```ts
export type SourceId = 'lichess' | 'chesscom' | 'outro'   // ChessKing NUNCA aqui

export type Destination = {
  source: SourceId
  label: string
  url?: string            // deep link (Lichess). 'outro' nao tem url.
}

export type WeaknessTag =
  | 'hanging-piece' | 'fork' | 'pin' | 'skewer' | 'discovered'
  | 'mate-in-1' | 'mate-in-2' | 'back-rank'
  | 'opening-principles' | 'time-trouble' | 'endgame-pawn' | 'endgame-rook'
  | 'conversion' | 'blunder-rate'

export type Confidence = 'low' | 'medium' | 'high'

// union discriminada â€” substitui value: unknown
export type SignalValue =
  | { kind: 'rating'; perf: 'rapid' | 'blitz' | 'classical' | 'bullet'; rating: number }
  | { kind: 'opening'; eco: string; name: string; games: number; lossRate: number }
  | { kind: 'time-control'; speed: string; games: number; lossRate: number }
  | { kind: 'color'; color: 'white' | 'black'; games: number; lossRate: number }
  | { kind: 'judgment'; blunders: number; mistakes: number; inaccuracies: number; acpl?: number; games: number }
  | { kind: 'clock'; timeoutLosses: number; games: number }
  | { kind: 'manual'; tag: WeaknessTag; note?: string }

export type Signal = {
  source: SourceId
  value: SignalValue
  confidence: Confidence
  observedAt: string
}

export type Weakness = {
  tag: WeaknessTag
  score: number            // 0..1
  confidence: Confidence
  evidence: string         // hipotese curta, linguagem nao-determinista
}

export type LearnerProfile = {
  lichessUsername?: string
  band: '0-800' | '800-1200'        // ferramenta pessoal trava ate 1200; 1200+ e P5
  defaultSessionMinutes: 5 | 15 | 30 | 60
  goals: string[]
  updatedAt: string
}

export type PlanBlock = {
  id: string
  title: string
  source: SourceId
  destination: Destination
  estimatedMinutes: number
  task: string
  stopRule: string
  reason: string           // liga a uma Weakness
  coachNote: string
  status: 'pending' | 'done' | 'skipped'
  feedback?: 'easy' | 'good' | 'hard'
  updatedAt: string        // necessario para merge por registro no sync (P4)
}

export type DailyPlan = {
  date: string
  sessionMinutes: number
  blocks: PlanBlock[]
  generatedFromWeaknessesAt: string
}
```

Persistencia: IndexedDB via Dexie. Cada registro sincronizavel carrega `updatedAt`.

## 7. Detector de fraquezas (Dominio puro) â€” P1

Entrada `Signal[]` -> saida `Weakness[]` ordenado por `score`. Deterministico, 100% testado por
fixtures. Quando faltar analise do Lichess, usar so sinais baratos com `confidence` menor. Toda
`evidence` em linguagem de hipotese. Regras-base (limiares exatos no plano de implementacao):

| Sinal | Weakness | Confianca |
|---|---|---|
| judgment.blunders alto por jogo | blunder-rate | high |
| clock.timeoutLosses relevante | time-trouble | medium |
| opening.lossRate alto numa abertura recorrente | opening-principles | medium |
| color.lossRate desbalanceado | opening-principles | low |
| derrotas longas (muitos lances) | conversion / endgame-* | low-medium |
| manual | tag informada | low |

## 8. Mapa fraqueza -> destino Lichess â€” P1

**CORRIGIDO (rodada 2, Codex):** NAO validar slugs por fetch/parse de `lichess.org/training/themes`
em runtime â€” isso e scraping de HTML e viola o `AGENTS.md` (so APIs oficiais). Usar uma **allowlist
estatica** de slugs no codigo, validada manualmente contra a pagina oficial durante o desenvolvimento;
testes verificam apenas o FORMATO da URL, sem fetch. Revalidacao manual antes de release. Allowlist:

| WeaknessTag | URL Lichess (fallback) |
|---|---|
| hanging-piece | `/training/hangingPiece` |
| fork | `/training/fork` |
| pin | `/training/pin` |
| skewer | `/training/skewer` |
| discovered | `/training/discoveredAttack` |
| mate-in-1 | `/training/mateIn1` |
| mate-in-2 | `/training/mateIn2` |
| back-rank | `/training/backRankMate` |
| endgame-pawn / endgame-rook | `/practice` |
| opening-principles | `/learn` ou `/analysis` da partida |
| time-trouble | recomendacao de ritmo + revisao (sem url de puzzle) |
| conversion | `/analysis` da partida |
| blunder-rate | mix de `/training` + revisao |

Bloco de revisao abre `https://lichess.org/{gameId}` apenas para partidas TERMINADAS (nunca ao vivo).

## 9. Coletor Lichess (Infra) â€” P1

Base conhecida 2026-06-06 (revalidar antes de codar em `https://lichess.org/api`):

- `GET /api/user/{username}` (perfil/perfs)
- `GET /api/user/{username}/rating-history`
- `GET /api/games/user/{username}` com `Accept: application/x-ndjson`,
  `max=30`, `rated=true`, `perfType=rapid,classical,blitz` (bullet fora do diagnostico),
  `opening=true`, `accuracy=true`, `clocks=true`, `finished=true`, `ongoing=false`,
  `moves=false`, `pgnInJson=false`, `sort=dateDesc`.
- **CORRIGIDO (rodada 2):**
  - **Remover `analysed=true`** (DeepSeek): ele filtra no servidor so jogos analisados e descartaria
    os sinais baratos (abertura/cor/ritmo/relogio) dos nao-analisados. Buscar todos os 30 e o parser
    trata `analysis` como opcional.
  - **Remover `evals=true`** (Codex): para o detector basta o agregado `players.*.analysis`
    (blunder/mistake/inaccuracy/acpl), que vem sem `evals`. `evals=true` traria eval por lance (pesado).
  - **Sem `User-Agent` no fetch do browser** (Codex): o browser proibe setar `User-Agent` via JS.
    Em P1/P2 (client-side) usar so `Accept`, cache e requisicao serial. `User-Agent` identificavel so
    quando houver proxy/backend (P4/P5). NAO criar backend so para UA.
  - **Partidas TERMINADAS** = `status NOT IN ('started','created','aborted')`. `aborted` nao conta.
- Campos: `opening{eco,name}`, `players.*.analysis{inaccuracy,mistake,blunder,acpl,accuracy}`,
  `players.*.user.{id,name}`, `winner`, `speed`, `status`, `clock`. Parser TOLERANTE: se
  `players.*.analysis` undefined, nao gerar Signal `judgment` daquele jogo, mas ainda extrair
  opening/color/clock.
- Funcao pura obrigatoria `getPlayerSide(game, username): 'white'|'black'|null` (case-fold; trata
  user ausente/AI/deletado; ignora variantes nao-standard).
- Cache por endpoint (TTL): perfil 24h; rating-history 24h; games 30min. Botao de atualizar manual;
  `AbortController`/timeout em todo fetch; nunca refetch em loop.
- `max=30` (nao 50): suficiente para um usuario, mais leve. Revalidar todos os params contra a yaml
  oficial (`lichess-org/api`) antes de codar.

## 10. Gerador de plano sensivel ao tempo â€” P0 (fixo) / P1 (adaptado)

`generatePlan(profile, weaknesses, sessionMinutes, date) -> DailyPlan` (puro).

- 5 min: 1 micro-bloco (ex.: 8 puzzles do tema mais fraco).
- 15 min: 1 tema + revisao curta.
- 30 min: aquecimento + tema + transferencia.
- 60 min: aquecimento(10)+tema(20)+transferencia(20)+final(10).
- Prioriza a `Weakness` de maior `score`. P0: tema fixo (sem detector) so para validar fluxo.
  P1: tema vem das fraquezas reais.

## 11. Erro, offline e migracao

- **Offline:** se nao houver rede, manter o ultimo `DailyPlan` salvo e mostrar aviso "sem conexao;
  mostrando seu plano salvo". Abrir treino no Lichess exige rede (avisar).
- **Erro de API (429/5xx/timeout):** backoff; UI mostra "Lichess ocupado, tento de novo em X"; nunca
  travar o app â€” cair para sinais ja cacheados.
- **Migracao:** app novo, IndexedDB do zero; sem migracao de dados do `chessking-tutor`.

## 12. Loop de adaptacao â€” P2 (o valor)

- Abrir um bloco com destino Lichess inicia um timer local com o tempo planejado do bloco. Ao atingir
  o limite, o app emite aviso sonoro curto e visual; o aluno pode continuar. Ao concluir, grava o
  tempo real treinado. Se concluir antes do limite, a UI mostra "Treinou por X min".
- Feedback por bloco: `easy`/`good`/`hard` (um toque) -> ajusta o estagio de recurso do proximo plano
  (`hard` volta para explicacao; `good` mantem o estagio atual; `easy` avanca para repeticao/retrieval).
- Ao abrir o app: refetch (respeitando TTL) -> recomputa sinais -> regenera plano do dia preservando
  blocos `done`.
- Revisao semanal (metrics): escolhe o tema da proxima semana pela fraqueza dominante real.
- Resultado oficial de puzzles Lichess: usar apenas `GET /api/puzzle/activity` com OAuth `puzzle:read`,
  uma requisicao por vez; correlacionar por janela `startedAt`/`completedAt`. Sem OAuth, preservar log
  local e reconciliar futuramente quando o token existir.

## 12.5 Gerador de Study Lichess via OAuth — P3

OAuth entra como opt-in pessoal, nao como requisito de diagnostico. O app deve funcionar sem login,
usando deep-links de analise/treino; quando o dono autorizar OAuth, o app pode criar/atualizar um
Study "Seu treino de hoje" com capitulos das posicoes fracas.

Guardrails P3:

- Fluxo OAuth: Authorization Code Flow com PKCE, `code_challenge_method=S256`, `state` verificado.
- Escopos permitidos: `study:write` para criar/atualizar; `study:read` so se realmente precisar ler
  estudos privados existentes. Nenhum escopo de jogo, mensagem, desafio, board, bot ou engine.
- Token: armazenado somente localmente, fora do export JSON padrao, nunca logado, nunca versionado,
  nunca enviado a backend de sync.
- Visibilidade default: `private` ou `unlisted`; `public` so em fluxo manual futuro/revisao P5.
- Conteudo: capitulos gerados por PGN minimo/transiente a partir de posicoes ou partidas terminadas.
  Nunca persistir PGN completo; se o PGN completo for necessario para chamada da API, montar em memoria
  e descartar apos o request.
- Limites oficiais a respeitar: ate 30 novos estudos/dia; ate 64 capitulos por study; uma requisicao
  por vez; 429 -> esperar pelo menos 1 minuto.
- Fair play: nunca criar/atualizar estudo a partir de partida ao vivo; nunca sugerir lance durante jogo.

## 13. Sync PC<->celular — P4 (CONGELADA em 2026-06-06)

- **Opt-in.** Codigo de sync forte (>=24 chars) gerado uma vez; digitado no 2o aparelho;
  chave = `hash(codigo)`.
- **Merge por registro** (corrige a critica): sincronizar itens individuais com `updatedAt`
  (blocos, profile, logs), comparando timestamp por item; nunca sobrescrever secao inteira; preservar
  sempre `status:'done'`.
- **Backend:** preferir Cloudflare **D1** (consistencia imediata) a KV (eventualmente consistente)
  para o estado sincronizavel; reutilizar o modelo de eventos de `docs/architecture/sync.md`.
- **Nunca sincronizar** imagens/screenshots por padrao. Tratar codigo de sync como senha (sem log).

## 14. Chess.com como fonte primaria de diagnostico â€” P1 (promovido)

> **DECISAO do dono (2026-06-06):** ele joga no Chess.com (amigos estao la). Como e onde estao as
> partidas, o Chess.com vira a **fonte primaria de diagnostico** e e **antecipado para P1**, com uso
> mais completo da API publica (nao so `/stats`). Os DESTINOS de treino continuam sendo o Lichess
> (puzzles/practice/analysis gratuitos). O Lichess como fonte de diagnostico vira secundario (P2),
> quando o dono tambem treinar la.

### 14.1 Coletor Chess.com (Infra, P1) â€” API publica, sem login

Endpoints (Chess.com Published Data API, read-only; revalidar antes de codar):

- `GET /pub/player/{username}/stats` â€” rating por ritmo (rapid/blitz/bullet/daily), recordes W/L/D,
  tactics/puzzle rush. Vira Signal `rating` e informa a `band`.
- `GET /pub/player/{username}/games/archives` â€” lista de arquivos mensais.
- `GET /pub/player/{username}/games/{YYYY}/{MM}` â€” partidas do mes (JSON), incluindo `pgn`,
  `time_class`, `time_control`, `rated`, `white/black{username,rating,result}`, `eco`/`ECOUrl` (no
  PGN), e `accuracies{white,black}` **quando a partida foi analisada/revisada**.

Regras (privacidade e limite):

- **Profundidade (decisao do dono):** o dono joga pouco ultimamente, entao importar o **historico
  completo** (todos os arquivos mensais via `/games/archives`), **serial** e com **cache** (arquivos
  de meses passados sao imutaveis -> cache longo; mes corrente -> TTL curto). Mesmo com historico
  completo, o detector **pondera por recencia** ao calcular score. O limite real e performance
  (serial + cache), nao corte de meses.
- **Parse transiente:** ler o PGN em memoria, extrair sinais derivados, **descartar o PGN** â€” nunca
  persistir PGN completo (regra inquebravel). Guardar so `Signal[]` derivados.
- **Sem PII de perfil:** nao buscar/guardar nome real, avatar, localizacao (`/pub/player/{username}`
  basico so se necessario para validar o username). 
- **Serial, sem paralelizar;** `User-Agent` identificavel **so e possivel com proxy/backend** (browser
  proibe via JS) â€” em P1 client-side usar `Accept` e requisicao serial; se o volume exigir UA, isso
  vira motivo para um proxy minimo (avaliar, nao assumir).
- `AbortController`/timeout; cache por arquivo mensal (arquivos passados sao imutaveis -> cache longo;
  mes corrente -> TTL curto).

### 14.2 Sinais do Chess.com (mapeamento para o detector)

Chess.com **nao** da o agregado de judgment do Lichess (inaccuracy/mistake/blunder/acpl). Mapear:

| Dado Chess.com | Signal | Observacao |
|---|---|---|
| `/stats` rating por ritmo | `rating` | informa `band` |
| `accuracies.{cor do dono}` baixa (quando houver) | proxy de `blunder-rate` | so partidas revisadas; `confidence` menor que o judgment do Lichess |
| `eco`/`ECOUrl` do PGN, agregado por abertura | `opening` (lossRate) | precisa funcao de lado do dono |
| `time_class` + `result` (`timeout`/`outoftime`) | `time-trouble` | por ritmo |
| cor + `result` | `color` | low confidence |

Funcao pura obrigatoria `getPlayerSideChesscom(game, username)` (case-fold). Detector e o MESMO
(secao 7 + Adendo 22.2); so a EXTRACAO de sinais difere por fonte.

### 14.3 Import de nivel/temas conhecidos (inclui ChessKing) como Signals manuais genericos â€” P1 onboarding

O dono quer trazer o que ja sabe do proprio nivel â€” inclusive o que um app externo (ChessKing)
"entendeu" a partir dos prints. **Compativel com ADR-005 SE feito assim:**

- Importar apenas o **insumo universal**: nivel aproximado + **temas de xadrez** que ja treinou
  (forcas) e que pratica pouco (fraquezas). Temas como "xeque descoberto", "mate em 2", "finais de
  peoes" sao conceitos universais de xadrez, **nao** propriedade do ChessKing.
- **Proibido** (clean-room): copiar codigo/assets do `chessking-tutor`/`chessking-assets`, ou espelhar
  a **taxonomia de cursos/secoes** do ChessKing (nomes de curso, estrutura, numeracao). O app **nao**
  indexa o produto pago.
- Forma: cada tema vira `Signal { source:'outro', value:{kind:'manual', tag} }`. Para fraqueza
  conhecida, `confidence:'medium'` (auto-relato do dono sobre si e sinal valioso, nao `low`).
- Os **prints** (imagens) sao opcionais e ficam **so locais** (IndexedDB), nunca sincronizados, com
  aviso de direitos. **Sem OCR** (sem leitura automatica). O dono informa os temas (ou confirma o
  mapeamento proposto pelo planejador).
- Entra no onboarding (P1) e alimenta o detector junto com os sinais do Chess.com.

Mapeamento a partir dos prints (CONFIRMADO pelo dono em 2026-06-06):

| Do ChessKing (prints) | Vira tema universal | Tipo |
|---|---|---|
| Mate em 1, Capturas simples, Tatica p/ principiantes, Finais p/ iniciantes | dominados | forca |
| Ganho de material | `fork` / `hanging-piece` | fraqueza |
| Xeque descoberto / Xeque duplo | `discovered` | fraqueza |
| Mate em 2 | `mate-in-2` | fraqueza |
| Finais de peoes | `endgame-pawn` | fraqueza |
| "Qual seria sua jogada?" (calculo/candidatos) | nota manual (sem tag direta) | fraqueza |

### 14.4 "Outro estudo" generico — P4 (CONGELADA em 2026-06-06)

Formulario livre (nivel aproximado, o que estudou, fraqueza percebida) -> Signal `manual`. Print
opcional **so local**, nunca sincronizado, com aviso de direitos. Sem OCR.

## 15. Versao-comunidade — P5 (CONGELADA em 2026-06-06)

Renomeacao publica (resolve P0 de marca), disclaimer de nao-afiliacao e fair play, polish PWA, i18n.
OAuth PKCE ja existe como opt-in pessoal desde P3. Na comunidade, reentra em revisao publica,
disclaimers, nome e seguranca apenas se P5 for descongelada.

## 16. Voz do coach (tom, nao personagem)

Microcopy PT-BR adulto, frases curtas, sem emoji, sem vergonha, sem prometer rating. `task`,
`stopRule`, `reason`, `coachNote`. Persona completa "Professor Lemos" so se houver evidencia (P5).
Durante partida ao vivo: silencio.

## 17. Privacidade

Local-first; dados no aparelho. Guardar: username (publico), preferencias, plano, conclusoes, notas,
sinais derivados e token OAuth opt-in somente no IndexedDB local. Nunca: token em backup JSON/log/bundle,
senha, PGN completo persistido, PII em log. Direitos: exportar JSON, apagar tudo, limpar cache.
Sync (P4) esta congelado.

## 18. Fases, alvos e Definition of Done

| Fase | Objetivo | Alvos | DoD |
|---|---|---|---|
| **P0** | Concluida: scaffold limpo + dominio tipado + time budget | `package.json`, `src/`, `domain/{types,plan,metrics}`, Dexie | `lint+test+build` verdes; gera plano fixo para 5/15/30/60; dominio sem rede |
| **P1** | Concluida: Chess.com adaptativo (diagnostico primario) + destinos Lichess | `services/chesscom.ts` (stats + archives, parse transiente), `domain/weakness/`, mapa destino Lichess (allowlist) | com `username` Chess.com real, tema do plano vem das fraquezas derivadas; so sinais derivados persistidos (zero PGN); 429 respeitado; testes de fixture |
| **P2** | Concluida: loop de valor + Lichess como fonte secundaria | timer/log de treino, `services/lichess.ts`, feedback `easy/good/hard`, roadmap, sessoes extras | abrir treino inicia timer; limite apita sem bloquear; concluir salva tempo real; feedback altera proximo plano; `done` preservado; sinais do Lichess somam aos do Chess.com; testes |
| **P3** | Concluida: OAuth + puzzle activity + Study (`study:write`) | `infra/lichess/oauth.ts`, `infra/lichess/puzzleActivity.ts`, `infra/lichess/study.ts` | login Lichess opt-in; token so local; reconcilia puzzles; cria study privado; PGN transiente |
| **P4** | **CONGELADA**: Sync opt-in + "outro estudo" local | D1 + worker + merge por registro; formulario manual -> Signal | nao implementar ate nova decisao do dono |
| **P5** | **CONGELADA**: Comunidade | rename, disclaimers, i18n, polish, revisao publica e seguranca OAuth | nao implementar ate nova decisao do dono |

## 19. ADRs registrados (ver `docs/adr/`)

- ADR-004: Moldura pessoal-primeiro; fase de codigo aberta pelo dono.
- ADR-005: Clean-room â€” app novo do zero; proibido herdar codigo do app pago; ChessKing nao e fonte.
- ADR-006: Adaptativo com OAuth opt-in para Study; sem engine nem escopos de jogo.
- ADR-007: Sync depois do valor, opt-in, merge por registro, D1 preferido a KV.
- ADR-008: Chess.com promovido a fonte primaria de diagnostico (P1), API publica mais completa
  (stats + archives recentes), parse transiente, so sinais derivados; destinos seguem no Lichess.

## 20. Testes

Dominio (weakness/plan/metrics): unit deterministas com fixtures (Vitest). Services: testes de
contrato dos parsers (mock ndjson Lichess). Sync (P4): teste do merge por registro preservando `done`.
Gate por fase: `npm run lint && npm run test && npm run build` verdes.

## 21. Perguntas abertas

1. `band` pessoal confirmada pelo dono: **800-1200** (tema fixo de P0 = `fork`).
2. Username Lichess fixado: **jukasparov** (usar em P1).
3. Conta Cloudflare para D1 fica irrelevante enquanto P4 estiver congelada.

---

## 22. Adendo Da Rodada 2 (consenso de Codex + Antigravity + DeepSeek)

Tres consultores revisaram este spec. Zero violacoes de governanca; todos aprovam a direcao. As
correcoes abaixo fecham as ambiguidades que fariam o Codex parar/adivinhar. Elas tem precedencia
sobre o texto anterior onde houver conflito.

### 22.1 Conflito de params de API resolvido

Antigravity afirmou que `accuracy=true` e `sort=dateDesc` seriam invalidos. Codex revalidou contra a
yaml oficial (`lichess-org/api`) e listou ambos como validos. **Decisao:** manter `accuracy=true`
(retorna accuracy quando ha analise) e `sort=dateDesc` (e o default, inofensivo). O Codex DEVE
revalidar a lista viva antes de codar; em caso de divergencia real, remover o param invalido.

### 22.2 Detector â€” formula de score e limiares (fecha P1)

`Weakness.score in [0,1]`. Para cada `WeaknessTag`, agregar todos os Signals daquela tag:

```
baseConfidence: low=0.3, medium=0.6, high=0.9
frequencyFactor = min(1, contributingSignals / minGames(tag))
score = baseConfidence * frequencyFactor
confidence final = max(confidence dos signals contribuintes)
```

Sinais com o MESMO `WeaknessTag` agregam em UMA `Weakness` (resolve o `opening-principles` duplicado).
Limiares minimos (primeira versao; ajustaveis com uso, mas precisam existir):

| Regra | Dispara quando | minGames |
|---|---|---|
| blunder-rate | `blunders/analysedGames > 0.5` | minAnalysedGames=5 |
| time-trouble | `timeoutLosses >= 2` no ritmo | minGames(ritmo)=10 |
| opening-principles (abertura) | `lossRate > 0.6` numa abertura | games(abertura)>=5 |
| opening-principles (cor) | `abs(whiteLossRate-blackLossRate) > 0.2`, confidence low | minGames=10 |
| manual | informado pelo usuario | 1 |

Regra "sem dados suficientes": se nenhum limiar bater, gerar plano conservador por `band` (nao inventar
fraqueza). **Cortado de P1:** a regra "derrotas longas -> conversion/endgame" (precisa de `plyCount`,
incompativel com `moves=false`; adiar ate haver fonte confiavel).

### 22.3 P0 â€” comportamento sem detector (fecha 4 bloqueios do Codex)

Em P0 o detector (P1) nao existe. Portanto:

- `generatePlan` em P0 **ignora `weaknesses`** e usa **tema fixo por `band`**: `0-800` -> `hanging-piece`;
  `800-1200` -> `fork`. Escrever isso explicitamente; nao deixar o Codex escolher.
- `coachNote` em P0 vem de um **catalogo fixo por tipo de bloco** (aquecimento/tema/transferencia/final),
  tom adulto, sem prometer rating. (3-5 frases por tipo.)
- Divisao exata do orcamento de tempo:
  - 5 min: 1 bloco (tema, 5).
  - 15 min: tema(10) + revisao(5).
  - 30 min: aquecimento(5) + tema(15) + transferencia(10).
  - 60 min: aquecimento(10) + tema(20) + transferencia(20) + final(10).
- `jukasparov` e **default editavel** na config, nunca constante hardcoded no dominio.

### 22.4 Exemplos de `evidence` (contrato de tom)

Bom: "Nas suas partidas analisadas recentes apareceram mais erros graves que o esperado; hoje vamos
testar uma rotina curta anti-blunder." / "Voce perdeu por tempo em 3 partidas recentes; talvez um
ritmo um pouco mais lento ajude." Proibido (determinista): "Voce perde porque deixa peca pendurada." /
"Blunder rate alto." O dominio retorna `evidenceCode` + parametros; a camada coach monta o texto PT-BR
(mantem o dominio testavel sem acoplar a copy).

### 22.5 P0 â€” itens que entram no DoD (consenso)

- PWA minimo instalavel: manifest (`name`, `short_name`, icones 192/512, `start_url`, `display`),
  HTTPS/localhost, service worker basico de offline-shell.
- Botao "Exportar backup (JSON)" e "Apagar tudo" visiveis desde P0 (mitiga perda de IndexedDB).
- Schema Dexie versionado: stores `profile`, `plans`, `logs`, `signals`, `weaknesses`; indices e
  `version` definidos no plano P0.
- Dependencias e versoes fixadas no plano P0 (React, Vite, TS, Dexie, Vitest, ESLint, plugin PWA).

### 22.6 Ajustes de P2 e produto

- **Auto-ajuste de `band`**: NAO implementado. Estava previsto como ideia para P2, mas a `band` continua
  definida manualmente na Config. Reservado para reavaliacao futura junto com P4/P5 (congeladas).
- **`sessionMinutes` ajustavel por dia** na tela Hoje (override rapido do default). Implementado.
- `feedback`: `easy`/`good`/`hard`; ausencia de feedback = sem ajuste. `hard` volta para explicacao,
  `good` mantem o estagio, `easy` avanca para repeticao. Implementado.
- `rating-history` fora do coletor enquanto nao houver regra que o use (o auto-ajuste de band que o
  consumiria nao foi implementado).

### 22.7 Sync P4 — lacunas a detalhar no plano de P4 (nao bloqueiam P0/P1)

`serverSeq` monotono no D1; `clientId`; tombstones (`deletedAt`) para exclusao; desempate por
`serverSeq` depois `clientId`; `hash = SHA-256(codigo)`; endpoints `push` idempotente / `pull?afterSeq`;
rate limit no worker contra bruteforce do codigo; retencao (planos > 90 dias podem ser podados);
sincronizar profile/logs/feedback/notas/manual-signals (nao o `DailyPlan` inteiro, que e regeneravel);
nunca sincronizar imagens. D1 sem read-replica (ou Sessions API) para consistencia sequencial.

### 22.8 Clean-room â€” barreira operacional

O plano de implementacao PROIBE abrir/ler/copiar `chessking-tutor/src/*` durante o coding. Checklist
anti-copia no DoD de P0. Inspecao de `chessking-tutor` so para auditoria documental expressa, nunca
como referencia de codigo.
