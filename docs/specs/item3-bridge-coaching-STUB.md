# STUB — Item #3: bridge Chess.com→puzzles rotuladas + modo coaching bandas altas

> **STATUS: PENDENTE — NÃO IMPLEMENTAR.** Gated atrás de E1-E4 (eficácia) na re-sequência
> ([[beta-plan-council-2026-06-25]]). Precisa de **council ANTES** de virar SPEC executável.
> Este arquivo só registra o substrato scouteado (fatos read-only 2026-06-25) + a pergunta de
> design aberta, pra o council ser concreto e não re-scoutear.

## Decisão fechada (council DIVERGIR + dono)
Bandas altas = **coaching + curadoria** (não conteúdo oco). Sinal tático Chess.com = **bridge
pras puzzles rotuladas do Lichess via motif-tag** (reusa `catalogSkillNodes`), NÃO gerar
posição própria (= motor de táticas, fere o non-goal orquestrador).

## Substrato scouteado (file:line — o que REUSA vs o que é NET-NEW)

**REUSÁVEL (já existe):**
- `src/domain/sources/catalogSkills.ts:1-16` — `CatalogSkillNode` mapeia `weaknessTag →
  themeSlugs` (slugs de tema de puzzle do Lichess) + `resourceIds` (ex.: `puzzle:hangingPiece`,
  `practice:fundamental-tactics:the-fork`) + `bands`/`stageFit`/`timeFits`. **É a ponte
  weakness→puzzle-rotulada que a feature precisa — não inventar store.**
- `src/domain/sources/resourceCatalog.ts:930-935` — `getLichessResourcesForWeakness(tag)`
  filtra catálogo por `recommendedFor`. App **não hospeda DB de puzzle**; roteia p/ URL de
  training do Lichess por tema. (Honra non-goal: NÃO inventar puzzle/study IDs.)
- `src/domain/sources/resourceSelector.ts:71-89` — filtragem por `learnerBand` na seleção.
- `src/domain/sources/resourceSelector.ts:154-189` — padrão `puzzle-replay` sintético em
  stage='review' (rota pro tema mais-perdido). **Modelo p/ o replay, mas hoje só usa stats de
  puzzle-dashboard.**

**NET-NEW (NÃO existe — é o trabalho real):**
- Roteamento p/ fontes **externas/CC** (Lichess Practice como destino, tablebases, artigos):
  hoje tudo fica no catálogo INTERNO; externas só aparecem como data-source marcada
  review/reject, nunca como destino. Hook: `resourceSelector`.
- Replay de erro do **próprio JOGO** como drill espaçado: o `puzzle-replay` atual usa stats de
  puzzle, NÃO partidas. Converter erro-de-partida→item de revisão é novo.

## GAP que define o teto honesto (confirma risco residual do council)
`src/infra/chesscom/extractSignals.ts:67-120` extrai SÓ sinal **game-level**: `accuracy`
(contagem de lowAccuracyGames thresholded por banda), aggregates de color/time-control/opening/
judgment (contagens de blunder/mistake/inaccuracy). **NÃO há acurácia por-lance.** Sem engine, a
bridge **não** sabe "errou garfo no lance 23" — dispara em sinal AGREGADO ("seus jogos mostram
baixa acurácia / N blunders na banda X → puzzles rotuladas de tática X"). Bake isso no label
honesto; não prometer diagnóstico de motivo por-lance.

## Pergunta aberta p/ o council (quando chegar a vez)
Dado que só há sinal game-level: **em que a bridge dispara e como mapeia agregado→themeSlug sem
inventar motivo?** (judgment aggregate → família de tema? accuracy baixa → tática genérica da
banda?) — divergência provável; adjudicar com o gate de não-fabricar-sinal.

## NON-GOALS (já firmes)
NÃO gerar posições próprias. NÃO inventar puzzle/study IDs (404 = fragilidade). NÃO prometer
diagnóstico por-lance (não há dado). NÃO implementar antes de E1-E4. NÃO commitar sem council.
