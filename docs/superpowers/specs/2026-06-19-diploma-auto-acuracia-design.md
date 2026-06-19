# Diploma automático por acurácia de tema (destrava a subida de banda)

Data: 2026-06-19
Status: aprovado (forks A e B decididos pelo dono) — aguardando revisão da spec
Decisão de produto: **Open Decision #1 = "Auto por acurácia de tema"**

## Problema

A promoção de banda (`promoteBandForDiplomas`, [src/domain/method/bandProgression.ts:46](../../../src/domain/method/bandProgression.ts))
está totalmente plugada em `saveProfile` ([src/app/state.ts:209](../../../src/app/state.ts)),
mas é **funcionalmente morta**: um diploma só passa quando todas as suas seções têm um
`DiplomaAttempt` registrado, e `saveDiplomaAttempt`
([src/infra/storage/appData.ts:326](../../../src/infra/storage/appData.ts))
**não tem nenhum chamador de produção** (só testes). Logo `isDiplomaPassed` é sempre `false`,
a banda nunca sobe e a estagnação que o dono quer corrigir persiste — apesar do código pronto.

## Objetivo

Conquistar diplomas **automaticamente** a partir da acurácia por tema dos puzzles do Lichess
(os mesmos números já exibidos no painel Progresso), gravando um `DiplomaAttempt` por seção.
A maquinaria de promoção de banda já existente faz o resto. A promoção é **monotônica**
(`promoteBandForDiplomas` só sobe, nunca rebaixa), então uma queda posterior de acurácia
não rebaixa a banda.

## Decisões travadas

- **Fork A — Coordenadas:** sai do gate da banda. O treinador de coordenadas
  (`lichess.org/training/coordinate`) não é puzzle e não gera acurácia; continua no plano da
  semana como aquecimento (texto do currículo), mas **não trava** o Diploma do Peão.
  Peão passa a ter 2 seções mensuráveis.
- **Fork B — Exigência:** **80% de acurácia, mínimo 30 puzzles** por seção (uniforme nos 3 diplomas).
- **Fonte de dados única:** `buildSkillMap` ([src/domain/metrics/progressOverview.ts:41](../../../src/domain/metrics/progressOverview.ts)).
  Já é a fonte do painel Progresso (consistência com "números visíveis") e já deduplica
  dashboard vs atividade (bug obs 7040), evitando contagem dupla.

## Modelo de dados (aditivo, não-quebra)

`getDiplomaProgress` faz spread da seção (`{...section}`), então campos novos fluem sem quebra.

`DiplomaSection` ganha:

```ts
export type DiplomaSection = {
  id: string;
  title: string;
  description: string;
  lichessDestination: string;
  kind: 'accuracy' | 'practice';      // discriminador
  lichessThemes?: string[];           // chaves camelCase do Lichess (só p/ kind 'accuracy')
  accuracyTarget?: number;            // % exigido (só 'accuracy') — 80
  minAttempts?: number;              // piso de volume (só 'accuracy') — 30
};
```

Não há seção `kind: 'practice'` neste escopo (Coordenadas saiu do gate). O campo `kind`
existe para deixar o modelo honesto e extensível; todas as seções definidas serão `'accuracy'`.

Constantes em `diplomas.ts`: `SECTION_ACCURACY_TARGET = 80`, `SECTION_MIN_ATTEMPTS = 30`
(aplicadas por seção; per-seção permite calibrar por banda no futuro sem mudar o tipo).

## Catálogo de seções (novo)

Todas as chaves abaixo são temas reais de puzzle do Lichess (`lichess.org/training/{tema}`).
Onde há mais de um tema, os attempts/wins são **somados (pool)** antes de calcular a acurácia
e o piso de 30 — facilita atingir volume e respeita o rótulo amplo da seção.

| Diploma | Seção (id) | lichessThemes (pool) | destino |
|---|---|---|---|
| Peão (→ 800-1000) | Valor das peças (`valor-pecas`) | `hangingPiece` | training/hangingPiece |
| Peão | Mates em 1 (`mates-basicos`) | `mateIn1` | training/mateIn1 |
| Torre (→ 1000-1200) | Tática rotulada (`tatica-rotulada`) | `fork`, `pin`, `skewer` | training/fork |
| Torre | Segurança material (`seguranca-material`) | `hangingPiece` | training/hangingPiece |
| Torre | Finais de peão (`finais-peao`) | `pawnEndgame` | training/pawnEndgame |
| Rei (→ 1200-1600) | Cálculo de 2-3 lances (`calculo-curto`) | `mateIn2` | training/mateIn2 |
| Rei | Princípios de abertura (`abertura-principios`) | `opening` | training/opening |
| Rei | Finais básicos (`finais-basicos`) | `rookEndgame` | training/rookEndgame |

Mudanças vs catálogo atual: Peão perde `coordenadas` do gate e `mates-basicos` migra de
`practice/checkmates` → puzzle `mateIn1`; Torre `finais-peao` migra de `practice/pawn-endgames`
→ `pawnEndgame`; Rei `finais-basicos` migra de `practice/rook-endgames` → `rookEndgame`.
Os ids existentes são preservados (menos `coordenadas`, removido).

## Avaliador (domínio puro)

Nova função em `src/domain/method/` (ex.: `evaluateDiplomas.ts`):

```ts
evaluateDiplomaSections(
  skillMap: SkillMapEntry[],
  existing: DiplomaAttempt[],
  nowIso: string,
): DiplomaAttempt[]
```

Para cada seção `kind: 'accuracy'` de cada diploma:
1. `pooled = soma de {attempts, wins}` das entradas de `skillMap` cujo `theme ∈ section.lichessThemes`.
2. Se `pooled.attempts === 0` → **não emite attempt** (seção fica não-tentada).
3. Senão: `scorePercent = round(wins/attempts*100)`, `totalItems = pooled.attempts`,
   `passed = pooled.attempts >= minAttempts && scorePercent >= accuracyTarget`.
4. `id` determinístico = `${diplomaId}:${sectionId}` (upsert idempotente, sem duplicatas).
5. `source = 'lichess'`. `createdAt`: preservar o da attempt existente de mesmo id; se não
   existir, usar `nowIso`. `updatedAt = nowIso`.

Função pura (sem `Date.now`); o `nowIso` vem da camada app.

## Mudança na semântica do gate

Hoje `isDiplomaPassed` recomputa `scorePercent >= definition.threshold`. Passa a usar a flag
`passed` já presente no `DiplomaAttempt` (o avaliador é quem decide, considerando acurácia **e**
volume):

```ts
// isDiplomaPassed: toda seção precisa de latest attempt com passed === true
definition.sections.every((s) => getLatestSectionAttempt(...)?.passed === true)
```

`getDiplomaProgress`: `passed = latest?.passed ?? false`; mantém `scorePercent` e `attempted`
para exibição. Decisão: **manter** o campo `DiplomaDefinition.threshold` (e `DIPLOMA_THRESHOLDS`
em `mastery.ts`) no modelo, mas ele **deixa de gatear** — o gate passa a ser a flag `passed`.
Não removemos para evitar churn em quem importa `DIPLOMA_THRESHOLDS`; o gate de acurácia real
vive em `accuracyTarget` por seção.

## Orquestração (camada app)

Após cada reconciliação de dados do Lichess (mesmo ponto onde os logs de `puzzle-activity` /
`puzzle-dashboard` são persistidos), em sequência:
1. `buildSkillMap(allLogs)`.
2. `evaluateDiplomaSections(skillMap, diplomaAttempts, nowIso)` → upsert via `saveDiplomaAttempt`
   + atualiza o estado React de `diplomaAttempts`.
3. `promoteBandForDiplomas(currentBand, attemptsAtualizadas)`; se a banda mudou, persistir o
   perfil e regenerar o plano pelo caminho já existente (reuso de `saveProfileAndPlan`) e
   disparar um toast de conquista (apenas quando a banda realmente muda — comparar antes/depois).

O ponto exato de chamada será fixado na fase de plano (candidatos: a ação que reconcilia
resultados do Lichess / busca o dashboard em `src/app/*Actions*` ou `state.ts`).

### Idempotência / re-entrância
- Upsert por id determinístico → reavaliar sobrescreve com os números mais recentes.
- Promoção monotônica → reavaliar nunca rebaixa.
- Toast só quando `bandRank(depois) > bandRank(antes)`.

## Impacto na UI (verificado — baixo)

- `Progress.tsx` itera seções dinamicamente (`diploma.sections.length`, [Progress.tsx:182](../../../src/ui/Progress.tsx)) → Peão com 2 seções funciona.
- `Today.tsx`/`SessionMilestonesCard` usam só o percentual computado → ok.
- `DiplomaSeal`/`BandaIcon` chaveiam por `DiplomaId` (peao/torre/rei) — inalterado.
- `curriculum.ts`: Coordenadas continua no texto da semana (aquecimento) — sem mudança de código.

## Plano de testes (TDD)

1. `evaluateDiplomaSections`:
   - Peão: `hangingPiece` 30/27 (90%) + `mateIn1` 30/24 (80%) → 2 attempts `passed=true`.
   - Volume insuficiente: `hangingPiece` 10/10 (100%) → `passed=false`.
   - Acurácia insuficiente: `hangingPiece` 30/20 (67%) → `passed=false`.
   - Pool de temas: `fork`+`pin`+`skewer` somando ≥30 com ≥80% → `passed=true`.
   - Sem dado do tema → nenhuma attempt emitida.
   - `createdAt` preservado em reavaliação; `updatedAt` atualizado.
2. `isDiplomaPassed`/`getDiplomaProgress` com a semântica de flag `passed` (atualizar testes existentes em `diplomas.test.ts`).
3. Integração: skill map forte → avaliar → `isDiplomaPassed('peao')` true →
   `promoteBandForDiplomas('400-800')` → `'800-1000'`.
4. App: após reconciliação com estatísticas fortes, a banda é promovida e o plano regenerado
   (estender o padrão de `trainingFlow.test.tsx`).

## Migração de dados

Beta pessoal sem `DiplomaAttempt` reais em produção → remover/renomear ids é inócuo
(attempts órfãos seriam tratados como "não tentado"). Sem hook de migração necessário.
Atualizar fixtures de `diplomas.test.ts` (remoção de `coordenadas`; novos campos de seção).

## Fora de escopo (YAGNI nesta fase)

- Exibir progresso parcial "23/30 puzzles" por seção (a UI atual mostra `scorePercent`; refino futuro).
- Tela dedicada de "fazer o diploma" (era a alternativa rejeitada do Fork A).
- Recalibrar limiares por banda (mantido uniforme 80/30; são constantes ajustáveis).
- Bug do diagnóstico Chess.com mudo (item separado de alto valor, fora desta rodada).

## Riscos / caveats honestos

- **Acurácia é proxy:** o Lichess adapta a dificuldade do puzzle ao jogador, então a acurácia
  tende a um ponto fixo. 80%/30 é uma meta calibrável; ajustamos as constantes se a banda subir
  rápido ou travar demais.
- **Destinos `practice` viram `training/{tema}`:** o aluno passa a treinar o tema como puzzle
  (mensurável) em vez do recurso "practice" do Lichess — alinhado ao objetivo de medir acurácia.
