# M-Pedagogia — Wire computeMastery + nudge puzzle-perf (Plano FINAL pós-council)

> Executor: GLM 5.2. TDD onde houver lógica nova. NÃO commitar (Opus commita).
> Gates ao fim: `npm run test`, `npm run lint`, `npm run build`.

**Goal:** (1) Acurácia real passa a gatear avanço de estágio quando não há feedback
explícito recente. (2) `puzzle-perf` vira nudge qualitativo na tela de sync,
reusando o sinal já salvo no DB — zero chamada de API extra.

**NON-GOALS:** não mudar banda, não mexer em M2a, não deploy. NÃO corrigir
"feedback sem timeout temporal" (backlog separado).

---

## Correções do council (DeepSeek V4 Pro, 2026-06-23)

| ID | Correção incorporada |
|----|---------------------|
| C1 | Sem mapeamento reverso WeaknessTag→LichessTheme: iterar `recentThemeStats.themes` com `weaknessTagFromPuzzleTheme` (já importado) para achar o stat, chamar `computeMastery` DIRETO |
| C2 | Zero chamada duplicada à API: nudge lê o sinal `puzzle-perf` já salvo no DB após sync (via `loadSignals`, já importado) |
| C3 | Usar `themeStat.accuracy` nativo se disponível; calcular via attempts-losses só como fallback |
| C4 | Usar `computeMastery` diretamente, NÃO `masteryTargetFromCompletedLog` |
| C5 | Nudge contradiz DD2 nominalmente mas foi **aprovado pelo dono**; adicionar comentário explicando a tensão |

---

## Task 1: Wire `computeMastery` em `generatePlan`

**Arquivo:** `src/domain/plan/generatePlan.ts`

**Localização:** entre a linha 89 (`persistedThemeStage`) e linha 93 (`getResourceStage`).

**Lógica a adicionar** (sem mudar `getThemeResourceStage`):
```ts
// Busca o PuzzleThemeStat que corresponde ao tema primário, se disponível.
// weaknessTagFromPuzzleTheme já está importado neste arquivo.
const primaryThemeStat = options.recentThemeStats?.themes?.find(
  (s) => weaknessTagFromPuzzleTheme(s.theme) === primaryWeakness.tag,
);
// Se não há feedback explícito recente E há dados de acurácia com volume
// suficiente (>= 3 tentativas), usar computeMastery para refinar o fallback.
const masteryAwareFallback: PlanResourceStage = (() => {
  if (latestThemeSignal?.feedback !== undefined) return persistedThemeStage ?? 'guided';
  if (primaryThemeStat === undefined || primaryThemeStat.attempts < 3) {
    return persistedThemeStage ?? 'guided';
  }
  // C3: usar accuracy nativo do Lichess se disponível; fallback para win/loss.
  const accuracyPercent =
    primaryThemeStat.accuracy !== undefined
      ? primaryThemeStat.accuracy
      : ((primaryThemeStat.attempts - primaryThemeStat.losses) / primaryThemeStat.attempts) * 100;
  const mastery = computeMastery({
    accuracyPercent,
    recentFeedbacks: [],
    minVolumeReached: true,
  });
  if (mastery === 'advance') return advanceThemeStage(persistedThemeStage, 'transfer');
  if (mastery === 'regress') return 'guided';
  return persistedThemeStage ?? 'guided';
})();
```

Então substituir na chamada a `getResourceStage` (linha 93):
```ts
// ANTES:
const primaryThemeStage = getResourceStage('tema', latestThemeSignal, persistedThemeStage);
// DEPOIS:
const primaryThemeStage = getResourceStage('tema', latestThemeSignal, masteryAwareFallback);
```

**Import necessário:** `computeMastery` de `'../method/mastery'` (adicionar ao import existente).

**Testes a adicionar em `src/domain/plan/generatePlan.test.ts`:**
- Sem feedback + accuracy >= 80% + attempts >= 3 → estágio avança (mastery=advance)
- Sem feedback + accuracy < 50% + attempts >= 3 → estágio cai para 'guided' (mastery=regress)
- Sem feedback + attempts < 3 → `persistedThemeStage` mantido (volume insuficiente)
- Com feedback explícito 'good' → feedback vence (não usa computeMastery)

---

## Task 2: Nudge puzzle-perf em `runLichessSync`

**Arquivo:** `src/app/useDiagnosisActions.ts`

**Localização:** dentro do callback de `runLichessSync`, APÓS `importLichessSignals` concluir e
DENTRO do bloco `runExclusiveDiagnosisWrite`. O nudge é construído junto com `successMessage`.

**Lógica:**
```ts
// C2: ler sinal puzzle-perf já salvo no DB — sem chamada extra à API.
// C5: nudge usa puzzle rating como qualitativo; aprovado pelo dono (DD-Ped2).
// Tensão com DD2 (lichessBand.ts) é intencional: aqui sugerimos ação, não
// aplicamos banda automaticamente.
let puzzleNudge = '';
try {
  const allSignals = await loadSignals(); // já importado
  const puzzlePerfSignal = [...allSignals]
    .filter((s) => s.value.kind === 'puzzle-perf')
    .sort((a, b) => b.observedAt.localeCompare(a.observedAt))[0];
  if (puzzlePerfSignal?.value.kind === 'puzzle-perf') {
    const upperBound = parseInt(effectiveProfile.band.split('-')[1] ?? '9999', 10);
    if (puzzlePerfSignal.value.rating > upperBound * 0.9) {
      puzzleNudge = ` Seu rating de puzzles (${puzzlePerfSignal.value.rating}) está perto do teto da sua banda — bom sinal!`;
    }
  }
} catch {
  // silencioso: nudge é opcional, não pode travar o sync
}
```

Então concatenar `puzzleNudge` ao final da `successMessage` existente.

**Testes a adicionar em `src/app/useDiagnosisActions.test.ts`:**
- Signal puzzle-perf com rating > 90% do teto → nudge aparece na mensagem
- Signal puzzle-perf com rating baixo → sem nudge
- Sem signal puzzle-perf no DB → sem nudge
- `loadSignals` lança → sync continua sem nudge

---

## Task 3: Gates

`npm run test && npm run lint && npm run build` — tudo verde.

RELATÓRIO FINAL: arquivos criados/modificados; nº de testes antes/depois;
resultado de cada gate; qualquer BUG real encontrado (não corrigir silenciosamente).

---

## Decisões de produto (fechadas)

| ID | Decisão |
|----|---------|
| DD-Ped1 | Feedback explícito vence acurácia histórica (caso undefined = sem feedback) |
| DD-Ped2 | Nudge só quando puzzleRating > 90% do teto da banda atual |
| DD-Ped3 | Nudge é efêmero (mensagem no sync), não persiste em banco |
| DD-Ped4 | Mínimo 3 tentativas para acurácia ter peso |
| DD-Ped5 | `computeMastery` chamado diretamente, sem `masteryTargetFromCompletedLog` |
| DD-Ped6 | Feedback sem timeout temporal → backlog (não este milestone) |
