# Diploma automático por acurácia — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (execução inline, fase aprovada pelo dono). Steps usam checkbox (`- [ ]`).

**Goal:** Gravar `DiplomaAttempt` automaticamente a partir da acurácia por tema do Lichess e fazer a banda subir sozinha após cada sync.

**Architecture:** Domínio puro novo (`evaluateDiplomas.ts`) lê `SkillMapEntry[]` de `buildSkillMap`, emite attempts idempotentes por seção e compõe a promoção de banda já existente. A camada app (`reconcileLichessResults`) persiste e atualiza estado. Gate do diploma passa a usar a flag `passed` do attempt (não mais `scorePercent ≥ threshold`).

**Tech Stack:** TypeScript, React 19, Dexie, Vitest. Camadas domain/app/infra/ui puras.

Spec: [docs/superpowers/specs/2026-06-19-diploma-auto-acuracia-design.md](../specs/2026-06-19-diploma-auto-acuracia-design.md)

---

## Estrutura de arquivos

- Modify: `src/domain/method/diplomas.ts` — tipo `DiplomaSection` (+`kind`/`lichessThemes`/`accuracyTarget`/`minAttempts`), constantes, catálogo `DIPLOMAS` remapeado, gate por flag `passed`.
- Modify: `src/domain/method/diplomas.test.ts` — fixtures (sem `coordenadas`) e semântica de flag.
- Create: `src/domain/method/evaluateDiplomas.ts` — `evaluateDiplomaSections`, `mergeDiplomaAttempts`, `applyDiplomaProgress`.
- Create: `src/domain/method/evaluateDiplomas.test.ts` — testes do avaliador.
- Modify: `src/app/useStudyActions.ts` — wiring no `reconcileLichessResults` (+`setProfile`/`setDiplomaAttempts` na entrada).
- Modify: `src/app/state.ts` — passar `setProfile`/`setDiplomaAttempts` para `useStudyActions`.
- Modify: `src/app/trainingFlow.test.tsx` — `createPassedPeaoDiplomaAttempts` (2 seções, `passed:true`).

---

### Task 1: Modelo + catálogo + gate por flag (`diplomas.ts`)

**Files:** Modify `src/domain/method/diplomas.ts`, `src/domain/method/diplomas.test.ts`

- [ ] **Step 1: Atualizar testes (semântica nova) em `diplomas.test.ts`**

Substituir os testes que usam `coordenadas`/threshold por catálogo de 2 seções do Peão e flag `passed`. `createAttempt` default `sectionId: 'valor-pecas'`. Manter o teste de threshold (campo `threshold` é mantido). Adicionar teste de "seção não passada reprova o diploma". Casos:
- `isDiplomaPassed([valor-pecas(passed), mates-basicos(passed)], 'peao') === true`
- `isDiplomaPassed([valor-pecas(passed:false), mates-basicos(passed)], 'peao') === false`
- `getDiplomaProgress` retorna 2 seções `[valor-pecas, mates-basicos]` com `passed` vindo da flag.
- `getRecentlyEarnedDiploma`: usar `valor-pecas`+`mates-basicos`; "não concluído" = só `valor-pecas`.

- [ ] **Step 2: Rodar e ver falhar** — `npm test -- diplomas` → FAIL (coordenadas removido / semântica).

- [ ] **Step 3: Implementar em `diplomas.ts`**

Tipo + constantes:
```ts
export type DiplomaSection = {
  id: string;
  title: string;
  description: string;
  lichessDestination: string;
  kind: 'accuracy' | 'practice';
  lichessThemes?: string[];
  accuracyTarget?: number;
  minAttempts?: number;
};

export const SECTION_ACCURACY_TARGET = 80;
export const SECTION_MIN_ATTEMPTS = 30;
```

Catálogo (substitui `DIPLOMAS`), todas as seções `kind: 'accuracy'`, `accuracyTarget: SECTION_ACCURACY_TARGET`, `minAttempts: SECTION_MIN_ATTEMPTS`:
- Peão (`threshold: DIPLOMA_THRESHOLDS.peao ?? 90`):
  - `valor-pecas` — 'Valor das Peças' — themes `['hangingPiece']` — `training/hangingPiece`
  - `mates-basicos` — 'Mates em 1' — themes `['mateIn1']` — `training/mateIn1`
- Torre (`threshold: DIPLOMA_THRESHOLDS.torre ?? 80`):
  - `tatica-rotulada` — 'Tática Rotulada' — themes `['fork','pin','skewer']` — `training/fork`
  - `seguranca-material` — 'Segurança Material' — themes `['hangingPiece']` — `training/hangingPiece`
  - `finais-peao` — 'Finais de Peão' — themes `['pawnEndgame']` — `training/pawnEndgame`
- Rei (`threshold: DIPLOMA_THRESHOLDS.rei ?? 75`):
  - `calculo-curto` — 'Cálculo de 2-3 Lances' — themes `['mateIn2']` — `training/mateIn2`
  - `abertura-principios` — 'Princípios de Abertura' — themes `['opening']` — `training/opening`
  - `finais-basicos` — 'Finais Básicos' — themes `['rookEndgame']` — `training/rookEndgame`

Gate por flag:
```ts
export function isDiplomaPassed(attempts: DiplomaAttempt[], diplomaId: DiplomaId): boolean {
  const definition = getDiploma(diplomaId);
  if (definition === undefined) return false;
  return definition.sections.every((section) => {
    const latest = getLatestSectionAttempt(attempts, diplomaId, section.id);
    return latest !== undefined && latest.passed;
  });
}
```
Em `getDiplomaProgress`: `passed: latest?.passed ?? false` (mantém `scorePercent`/`attempted`).

- [ ] **Step 4: Rodar e ver passar** — `npm test -- diplomas` → PASS.
- [ ] **Step 5: Commit** — `feat(diploma): catalogo mensuravel por tema + gate pela flag passed`

---

### Task 2: Avaliador de domínio (`evaluateDiplomas.ts`)

**Files:** Create `src/domain/method/evaluateDiplomas.ts`, `src/domain/method/evaluateDiplomas.test.ts`

- [ ] **Step 1: Teste falhando** — `evaluateDiplomas.test.ts`:
  - Peão com skillMap `hangingPiece 30/27` + `mateIn1 30/24` → 2 attempts `passed:true`, `source:'lichess'`, `totalItems:30`.
  - Volume insuficiente `hangingPiece 10/10` → attempt `passed:false`.
  - Acurácia baixa `hangingPiece 30/20` (67%) → `passed:false`.
  - Pool `fork+pin+skewer` somando ≥30 e ≥80% → `tatica-rotulada` `passed:true`.
  - Sem dado do tema → seção não emitida.
  - `createdAt` preservado de `existing`; `updatedAt = nowIso`.
  - `applyDiplomaProgress` com skillMap forte do Peão em banda `'400-800'` → `promotedBand '800-1000'`, `bandChanged true`.

- [ ] **Step 2: Rodar e ver falhar** — `npm test -- evaluateDiplomas` → FAIL (módulo inexistente).

- [ ] **Step 3: Implementar `evaluateDiplomas.ts`**
```ts
import type { LearnerBand } from '../bands';
import type { SkillMapEntry } from '../metrics/progressOverview';
import { promoteBandForDiplomas } from './bandProgression';
import { DIPLOMAS } from './diplomas';
import type { DiplomaAttempt } from './types';

export function evaluateDiplomaSections(
  skillMap: SkillMapEntry[],
  existing: DiplomaAttempt[],
  nowIso: string,
): DiplomaAttempt[] {
  const byTheme = new Map(skillMap.map((entry) => [entry.theme, entry]));
  const evaluated: DiplomaAttempt[] = [];

  for (const diploma of DIPLOMAS) {
    for (const section of diploma.sections) {
      if (section.kind !== 'accuracy' || section.lichessThemes === undefined) continue;

      let attempts = 0;
      let wins = 0;
      for (const theme of section.lichessThemes) {
        const entry = byTheme.get(theme);
        if (entry !== undefined) {
          attempts += entry.attempts;
          wins += entry.wins;
        }
      }
      if (attempts === 0) continue;

      const scorePercent = Math.round((wins / attempts) * 100);
      const passed = attempts >= (section.minAttempts ?? 0) && scorePercent >= (section.accuracyTarget ?? 0);
      const id = `${diploma.id}:${section.id}`;
      const prior = existing.find((attempt) => attempt.id === id);

      evaluated.push({
        id,
        diplomaId: diploma.id,
        sectionId: section.id,
        scorePercent,
        totalItems: attempts,
        passed,
        source: 'lichess',
        createdAt: prior?.createdAt ?? nowIso,
        updatedAt: nowIso,
      });
    }
  }
  return evaluated;
}

export function mergeDiplomaAttempts(existing: DiplomaAttempt[], evaluated: DiplomaAttempt[]): DiplomaAttempt[] {
  const byId = new Map(existing.map((attempt) => [attempt.id, attempt]));
  for (const attempt of evaluated) byId.set(attempt.id, attempt);
  return [...byId.values()];
}

export type DiplomaProgressOutcome = {
  evaluated: DiplomaAttempt[];
  nextAttempts: DiplomaAttempt[];
  promotedBand: LearnerBand;
  bandChanged: boolean;
};

export function applyDiplomaProgress(
  skillMap: SkillMapEntry[],
  existing: DiplomaAttempt[],
  currentBand: LearnerBand,
  nowIso: string,
): DiplomaProgressOutcome {
  const evaluated = evaluateDiplomaSections(skillMap, existing, nowIso);
  const nextAttempts = mergeDiplomaAttempts(existing, evaluated);
  const promotedBand = promoteBandForDiplomas(currentBand, nextAttempts);
  return { evaluated, nextAttempts, promotedBand, bandChanged: promotedBand !== currentBand };
}
```

- [ ] **Step 4: Rodar e ver passar** — `npm test -- evaluateDiplomas` → PASS.
- [ ] **Step 5: Commit** — `feat(diploma): avaliador de secoes por acuracia + promocao de banda`

---

### Task 3: Wiring no sync do Lichess (`useStudyActions.ts` + `state.ts`)

**Files:** Modify `src/app/useStudyActions.ts`, `src/app/state.ts`, `src/app/trainingFlow.test.tsx`

- [ ] **Step 1: Atualizar fixture `createPassedPeaoDiplomaAttempts` em `trainingFlow.test.tsx`** — 2 seções (`valor-pecas`, `mates-basicos`), `passed:true` (ler o helper e remover `coordenadas`).

- [ ] **Step 2: Imports/entrada em `useStudyActions.ts`**
  - Importar `buildSkillMap` de `../domain` (ou `../domain/metrics/progressOverview`), `applyDiplomaProgress` de `../domain/method/evaluateDiplomas`, `saveDiplomaAttempt` e `saveProfile` de `../infra/storage/appData`.
  - Adicionar a `UseStudyActionsInput`: `setProfile: Dispatch<SetStateAction<LearnerProfile | undefined>>`, `setDiplomaAttempts: Dispatch<SetStateAction<DiplomaAttempt[]>>`. Desestruturar ambos.

- [ ] **Step 3: Inserir avaliação + promoção em `reconcileLichessResults`** (após `nextAllTrainingLogs`, dentro do bloco `profile !== undefined && todayPlan !== undefined`, antes de `generatePlan`):
```ts
const nowIso = new Date().toISOString();
const skillMap = buildSkillMap(nextAllTrainingLogs);
const { evaluated, nextAttempts, promotedBand, bandChanged } = applyDiplomaProgress(
  skillMap, diplomaAttempts, profile.band, nowIso,
);
for (const attempt of evaluated) await saveDiplomaAttempt(attempt);
setDiplomaAttempts(nextAttempts);

const effectiveProfile = bandChanged ? { ...profile, band: promotedBand } : profile;
```
  - Usar `effectiveProfile` no `generatePlan` e passar `diplomaAttempts: nextAttempts` ao `buildPlanContext`.
  - Após `saveTrainingLogsAndPlan(reconciledLogs, nextPlan)`: se `bandChanged`, `await saveProfile(effectiveProfile); setProfile(effectiveProfile);` e setar `setLichessMessage` com mensagem de subida de banda (ex.: `Diploma conquistado! Banda subiu para ${promotedBand}.`).
  - Atualizar o array de dependências do `useCallback` (incluir `setProfile`, `setDiplomaAttempts`).

- [ ] **Step 4: `state.ts`** — passar `setProfile` e `setDiplomaAttempts` ao `useStudyActions({...})` (ambos já existem no escopo: `setProfile` de `useState`, `setDiplomaAttempts` de `useAppData`).

- [ ] **Step 5: Rodar suíte + typecheck** — `npm test` e `npm run build` → PASS.
- [ ] **Step 6: Commit** — `feat(diploma): grava diploma e sobe banda no sync do Lichess`

---

### Task 4: Gates verdes + revisão

- [ ] `npm run lint` limpo · `npm test` verde · `npm run build` ok.
- [ ] Revisão de código (requesting-code-review) das mudanças.
- [ ] Atualizar memória do projeto (estado do beta-roadmap).

---

## Self-review (spec coverage)

- Modelo aditivo + catálogo remapeado → Task 1. ✓
- Fonte única `buildSkillMap` → Task 2/3. ✓
- 80%/30 e pool de temas → Task 2 (`accuracyTarget`/`minAttempts`/soma). ✓
- Gate por flag `passed` (piso de volume) → Task 1. ✓
- Coordenadas fora do gate → Task 1 (catálogo). ✓
- Wiring pós-sync + promoção monotônica + plano regenerado + mensagem → Task 3. ✓
- Idempotência (id determinístico, `createdAt` preservado) → Task 2. ✓
- Sem placeholders; tipos/assinaturas consistentes (`applyDiplomaProgress`, `evaluateDiplomaSections`, `mergeDiplomaAttempts`). ✓
