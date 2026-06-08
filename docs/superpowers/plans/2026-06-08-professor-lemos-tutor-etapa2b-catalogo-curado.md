# Professor Lemos - Etapa 2B (Catalogo Curado E Ranking De Recursos Lichess)

Data: 2026-06-08
Status: implementado em 2026-06-08
Base: spec `docs/superpowers/specs/2026-06-08-professor-lemos-tutor-design.md`
Relatorios de curadoria: Antigravity e Codex em `docs/research/`
Implementacao: catalogo, ranking, normalizacao, testes e registro de fontes concluidos pelo Codex.

## Onde Claude Parou

Claude escreveu o spec do "Tutor Completo" e dividiu a implantacao em etapas. A Etapa 1 colocou o
Professor Lemos como envelope de sessao. A Etapa 2A corrigiu personalizacao honesta, anti-repeticao,
diagnostico por tema reconciliado e pergunta acionavel.

Depois disso, a pesquisa profunda de recursos Lichess foi concluida por Antigravity e Codex. O ponto
faltante nao e criar nova fase de produto nem abrir P4/P5. O ponto faltante e transformar a curadoria
em catalogo executavel e ranking seguro dentro do app pessoal.

## Objetivo

Implantar no app a curadoria Lichess aprovada, enriquecendo o catalogo atual com metadados de
qualidade, idioma, risco de direitos, status de revisao e rotas diretas. O Professor Lemos deve
recomendar recursos melhores para cada fraqueza sem copiar conteudo protegido, sem inventar URLs,
sem usar paginas genericas e sem ajudar durante partida ao vivo.

## Escopo

- Enriquecer `src/domain/sources/resourceCatalog.ts` com metadados de curadoria.
- Incluir videos diretos e especificos da biblioteca Lichess como recursos de explicacao.
- Incluir estudos comunitarios aprovados apenas como reforco, nunca acima de recursos oficiais.
- Bloquear recursos comunitarios rejeitados ou arriscados para que nao entrem no catalogo ativo.
- Ajustar ranking por `PlanResourceStage` para usar:
  - `guided`: Practice oficial quando existir.
  - `explain`: video direto especifico ou Practice oficial; nunca filtro `/video?tags=...`.
  - `retrieval/review/transfer`: puzzle theme ou ferramenta concreta, evitando Analysis generico.
- Preservar a regra de que Analysis so aparece para revisao de partida terminada.
- Atualizar testes do catalogo, destinos e plano para cobrir os novos recursos e guardrails.

## Fora De Escopo

- Nada de P4/P5: sem sync, backend, D1, versao-comunidade, renomeacao publica ou disclaimer publico.
- Nada de nova API externa nesta etapa.
- Nada de `puzzle:write`, Board API, Bot API, Challenge API, engine, mensagens ou escopos de jogo.
- Nada de baixar/exportar estudos comunitarios em PGN.
- Nada de armazenar PGN completo, solucoes de puzzle, comentarios de estudo ou transcript de video.
- Nada de tabuleiro proprio.

## Arquivos Alvo

- `src/domain/sources/resourceCatalog.ts`
- `src/domain/sources/resourceCatalog.test.ts`
- `src/domain/sources/destinations.ts`
- `src/domain/sources/destinations.test.ts`
- `src/domain/plan/generatePlan.ts`
- `src/domain/plan/generatePlan.test.ts`
- `src/domain/plan/normalizePlan.ts`
- `src/domain/plan/normalizePlan.test.ts`
- `src/domain/types.ts`
- `docs/research/sources.md` somente se alguma fonte nova for revalidada
- `memory/state.md`
- `memory/progress.md`

## Modelo De Dados A Implantar

Estender `LichessResource` sem quebrar chamadas existentes:

```ts
type CuratedValue = 'A' | 'B' | 'C' | 'D';
type QualityStatus = 'approved' | 'needs-human-review' | 'rejected';
type RightsRisk = 'low' | 'medium' | 'high';
type ResourceLanguage = 'pt-BR' | 'en' | 'other';

type LichessResource = {
  id: string;
  kind: LichessResourceKind;
  title: string;
  label: string;
  description: string;
  url?: string;
  source: LichessCatalogSource;
  bands: readonly LearnerBand[];
  recommendedFor: readonly WeaknessTag[];
  priority: number;
  value?: CuratedValue;
  qualityStatus?: QualityStatus;
  rightsRisk?: RightsRisk;
  language?: ResourceLanguage;
  requiresOAuth?: boolean;
  oauthScopes?: readonly LichessOAuthScope[];
  lastVerifiedAt?: string;
};
```

Defaults de seguranca no helper `resource()`:

- `value: 'B'` se omitido.
- `qualityStatus: 'approved'` para recursos oficiais do Lichess.
- `rightsRisk: 'low'` para recursos oficiais e videos diretos da biblioteca Lichess.
- `language: 'en'` para Practice/videos quando nao houver garantia de PT-BR.
- `requiresOAuth: false`, `oauthScopes: []`.
- `lastVerifiedAt: '2026-06-08'`.

## Recursos A Ativar

### Oficiais Ja Existentes No Catalogo

Manter como prioridade alta:

- Practice: The Fork, The Pin, The Skewer, Discovered Attacks.
- Practice: Piece Checkmates I, Checkmate Patterns I.
- Practice: Key Squares, Opposition, Basic Rook Endgames.
- Puzzle themes: `hangingPiece`, `fork`, `pin`, `skewer`, `discoveredAttack`,
  `discoveredCheck`, `mateIn1`, `mateIn2`, `backRankMate`, `pawnEndgame`, `rookEndgame`,
  `defensiveMove`, `advantage`, `crushing`, `short`, `long`, `mix`.
- Ferramentas: Puzzle Streak, Puzzle Storm, Puzzles from player games, Analysis board.

Corrigir ranking de `time-trouble`: Puzzle Streak deve ser preferido para treino curto; Analysis board
so deve aparecer como transferencia/revisao de partida terminada.

### Videos Diretos A Adicionar

Adicionar como `kind: 'video-lesson'`, `source: 'lichess-video-library'`, `official: false` pelo
autor, mas `qualityStatus: 'approved'` porque estao na biblioteca Lichess e foram verificados:

- `https://lichess.org/video/wod7uXzkrTc` - Hanging Pieces.
- `https://lichess.org/video/mbiR0tcdqBY` - Fork.
- `https://lichess.org/video/VjwSudAqLn8` - Pin.
- `https://lichess.org/video/ZexQ1kow1MM` - Skewer.
- `https://lichess.org/video/nMADfn1scbI` - Discovered Attack.
- `https://lichess.org/video/spMQR31h0-0` - Back Rank.
- `https://lichess.org/video/uhQhasudq9M` - Mating Patterns.
- `https://lichess.org/video/QUqq7wSLE78` - Pawn Endgames.
- `https://lichess.org/video/-OoPm17P8xA` - Calculation.
- `https://lichess.org/video/AYy2A6HIcU0` - Avoid Blunders.
- `https://lichess.org/video/0-ouahZH8X4` - Convert Material Advantage.
- Manter `https://lichess.org/video/gpsZAim-mYc` como video primario de opening principles.

Regra: video em ingles deve aparecer no label ou description como "video em ingles", sem copiar
transcript nem lista integral de pontos do video.

### Estudos Comunitarios A Adicionar Como Reforco

Adicionar somente se houver metadados de seguranca:

- NoseKnowsAll:
  - `https://lichess.org/study/wukLYIXj` - Beginner Endgames You Must Know.
  - `https://lichess.org/study/UsqmCsgC` - Intermediate Endgames You Must Know.
  - `https://lichess.org/study/bnboDhFM` - Rook Endgames You Must Know.
- jomega:
  - `https://lichess.org/study/Iof6LzcT` - Beginner: Tactics.
  - `https://lichess.org/study/s3iOCawc` - Beginner: Simple Tactics I.
  - `https://lichess.org/study/6JAUFQ5p` - Beginner: Simple Tactics II.
  - `https://lichess.org/study/wzFrgluQ` ou URL auditada equivalente para Intermediate:
    Tactics Internalized. Se houver divergencia entre relatorios, revalidar antes de codar.

Status destes recursos:

- `kind: 'community-study'`.
- `qualityStatus: 'approved'` apenas para NoseKnowsAll ja aceito em `memory/decisions.md`.
- jomega pode entrar como `needs-human-review` se a revisao humana ainda nao confirmou a serie.
- `rightsRisk: 'medium'` para comunitarios ate revisao completa; `low` somente se o dono aprovar.
- Prioridade abaixo de Practice oficial e abaixo de puzzle themes, acima de videos apenas quando o
  tema for final longo ou estudo conceitual.

### Recursos Bloqueados

Nao adicionar ao catalogo ativo:

- `https://lichess.org/study/dXKWlrkg` - risco de copyright por adaptacao de livro.
- `https://lichess.org/study/izZ71JC2` - baixa qualidade pedagogica e tom desalinhado.
- `https://lichess.org/study/APSzIEsV` - manter fora do ativo, no maximo candidato C em documento.

Se for util registrar rejeicoes em codigo, criar `rejectedLichessResources` separado do catalogo ativo
e garantir por teste que `getLichessResourcesForWeakness()` nunca retorna rejeitados.

## Regras De Ranking

### Ordem Geral

1. Recurso oficial Lichess aprovado.
2. Puzzle theme oficial.
3. Ferramenta oficial concreta (`streak`, `storm`, `training/of-player`).
4. Video direto da biblioteca Lichess.
5. Estudo comunitario aprovado ou em revisao humana, somente como reforco.
6. Rejeitados nunca aparecem.

### Por Estagio

- `guided`: Practice oficial primeiro; se nao houver, Learn ou video direto.
- `explain`: video direto se existir e estiver aprovado; senao Practice oficial; nunca URL generica.
- `retrieval`: puzzle theme primeiro; Puzzle Streak pode entrar para `blunder-rate`/`time-trouble`.
- `review`: puzzle theme ou estudo curto; Analysis apenas quando o bloco falar explicitamente de
  partida terminada.
- `transfer`: puzzle theme, Puzzle Streak ou Analysis de partida terminada, nesta ordem.

### Por Tempo

- 5 min: puzzle theme, Puzzle Streak, mate in 1/2, hanging piece.
- 15 min: Practice curto ou puzzle theme.
- 30 min: Practice + video direto ou estudo comunitario curto.
- 60 min: pode incluir estudo comunitario longo, mas nunca como primeira recomendacao automatica sem
  `qualityStatus` aprovado.

## Tarefas De Implementacao

### Tarefa 1 - Metadados E Tipos Do Catalogo

- Estender `LichessResourceKind` com `community-study`.
- Estender `LichessCatalogSource` com `lichess-community-study` e, se necessario,
  `lichess-curation-report`.
- Adicionar os metadados de curadoria ao tipo `LichessResource`.
- Atualizar helper `resource()` para preencher defaults seguros.
- Atualizar regex de URLs permitidas para aceitar `/study/{id}` apenas quando `kind` for
  `community-study`.

Teste esperado:

- Catalogo continua com todos os primarios atuais.
- Todos os recursos ativos tem `qualityStatus !== 'rejected'`.
- Todo recurso comunitario tem `author`, `rightsRisk`, `qualityStatus` e URL `/study/{id}`.

### Tarefa 2 - Videos Diretos De Explicacao

- Adicionar os videos listados em `lichessOtherResources` ou em colecao propria
  `lichessVideoLessons`.
- Mapear cada video para `recommendedFor`.
- Dar prioridade suficiente para `explain`, mas nao para substituir Practice em `guided`.

Teste esperado:

- `getDestinationForWeakness('fork', 'explain')` abre video direto de fork, nao `/video?tags=...`.
- `getDestinationForWeakness('pin', 'explain')`, `skewer`, `discovered`, `mate-in-2`,
  `endgame-pawn`, `conversion`, `blunder-rate` retornam recursos concretos quando houver video.
- Nenhum recurso contem `/video?`.

### Tarefa 3 - Estudos Comunitarios Seguros

- Adicionar NoseKnowsAll como reforco de finais.
- Adicionar jomega com status conservador (`needs-human-review`) se a decisao do dono ainda nao
  estiver registrada como aprovada.
- Nao adicionar recursos D ao catalogo ativo.

Teste esperado:

- `getLichessResourcesForWeakness('endgame-pawn')` contem Practice oficial antes de NoseKnowsAll.
- `getLichessResourcesForWeakness('endgame-rook')` contem Basic Rook Endgames antes de Rook Endgames
  You Must Know.
- Rejeitados nunca aparecem em `lichessResourceCatalog`.

### Tarefa 4 - Ranking Por Estagio

- Ajustar `resourceKindPreferenceByStage` em `destinations.ts` para incluir `community-study`.
- Garantir que `guided` privilegia `practice-study`.
- Garantir que `explain` privilegia `video-lesson` somente quando direto e aprovado.
- Garantir que `retrieval/review/transfer` privilegiam `puzzle-theme` e ferramentas concretas.
- Corrigir `time-trouble` para preferir Puzzle Streak/Storm conforme estagio; Analysis so com
  partida terminada.

Teste esperado:

- `fork`: guided Practice, explain video, retrieval puzzle theme.
- `endgame-pawn`: guided Key Squares, explain video ou Practice, reinforcement/community depois.
- `time-trouble`: retrieval Streak; Analysis nao aparece como destino primario generico.
- `conversion`: nao cai em Analysis generico se houver video/tema concreto apropriado.

### Tarefa 5 - Normalizacao De Planos Antigos

- Atualizar `normalizePlan.ts` para reparar:
  - `/video?tags=...` para video direto ou Practice.
  - `analysis` generico em `review/transfer` com `weaknessTag` para puzzle theme correspondente,
    exceto quando a tarefa mencionar partida terminada.
  - recursos rejeitados ou candidatos C para recurso oficial equivalente.

Teste esperado:

- Plano antigo de garfo com video filter vira video direto ou Practice conforme stage.
- Plano antigo de revisao com `https://lichess.org/analysis` e `weaknessTag='fork'` vira
  `/training/fork`.
- Qualquer URL rejeitada vira Practice/puzzle theme oficial.

### Tarefa 6 - Microcopy E UI Minima

- Se labels de video aparecerem na tela, indicar "video em ingles" de modo curto.
- Nao adicionar tela nova.
- Nao criar card dentro de card.
- Nao explicar recursos genericamente na UI; o bloco ja deve dizer a tarefa.

Teste esperado:

- `TutorCard` e `Today` continuam renderizando sem overflow em desktop/mobile.
- Labels continuam curtos e em PT-BR.

### Tarefa 7 - Memoria E Documentacao

- Atualizar `memory/progress.md` ao concluir.
- Atualizar `memory/state.md` com a Etapa 2B concluida e o novo limite conhecido, se houver.
- Atualizar `docs/research/sources.md` somente se novas fontes forem revalidadas durante a execucao.

## Guardrails De Teste

Adicionar ou manter testes para:

- `npm run test`
- `npm run lint`
- `npm run build`
- Sem `puzzle:write` em recursos ou fluxo de catalogo.
- Sem Board API, Bot API, Challenge API.
- Sem `chessking` em id/source/label/description.
- Sem PGN, transcript, comentarios ou solucoes persistidas no catalogo.
- Sem URL fora de `https://lichess.org/...` para destino de treino.
- Sem `/video?tags=...`.
- Sem estudo comunitario sem `qualityStatus`.
- Sem estudo rejeitado no catalogo ativo.

## Criterio De Pronto

Etapa 2B esta pronta quando:

- Catalogo ativo tem recursos oficiais, videos diretos e comunitarios seguros com metadados.
- Cada fraqueza tem pelo menos um recurso `guided`, um recurso `retrieval` e, quando aplicavel, um
  recurso `explain` concreto.
- O gerador de plano usa recursos concretos e nao volta a Analysis generico para revisao de tema.
- Rejeitados por copyright/qualidade nao aparecem no catalogo ativo.
- `npm run test`, `npm run lint` e `npm run build` passam.
- Browser smoke em desktop e mobile confirma que Hoje e TutorCard continuam sem overflow e com labels
  legiveis.

## Riscos Restantes

- Videos e estudos comunitarios estao majoritariamente em ingles.
- A serie jomega tem divergencia de URL entre relatorios; revalidar antes de codar.
- Estudos comunitarios podem mudar ou sair do ar.
- Comunidade/P5 continua congelada; nao transformar este catalogo em produto publico sem nova revisao.
- A decisao sobre aceitar comunitarios como `approved` ou `needs-human-review` ainda pode exigir
  confirmacao do dono, especialmente para jomega.
