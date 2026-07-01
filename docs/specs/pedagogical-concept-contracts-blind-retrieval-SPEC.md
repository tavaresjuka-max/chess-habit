# Pedagogical Concept Contracts + Blind Retrieval SPEC

Data: 2026-07-01
Status: draft for implementation
Owner: Chess Habit / Professor Tavarez

## Context

Chess Habit already has the core loop:

```text
real signal -> probable weakness -> Lichess destination -> timed training -> feedback -> adjustment
```

Implemented foundations include `WeaknessTag`, `catalogSkillNodes`, adaptive plan generation, five method tracks, pending review, SM-2-style spacing, diploma attempts and progress UI.

The current gap is not more book inventory. The gap is making the pedagogy from the book/acervo analysis executable without copying content: each concept needs a small contract that tells the app how to scaffold, when to remove scaffolding, and what counts as real retrieval.

A separate known issue is retrieval leakage: when a concept cue is shown before a `retrieval`, `review`, or `transfer` attempt, the student may solve by label rather than memory. A diploma or spacing system that advances from labeled attempts can overstate mastery.

Council input used for this SPEC: DeepSeek V4 Pro + GLM 5.2, no Claude model. Main convergence: avoid heavy multiple-choice taxonomy after every block; do not let self-labeling drive SM-2/diploma; guard against Lichess/platform metadata leaking the theme.

## Goals

1. Add a lightweight concept contract for each current `WeaknessTag`.
2. Separate scaffolded exposure from blind retrieval.
3. Ensure only blind attempts can count toward strong advancement/diploma evidence.
4. Keep flow TDAH-safe: no mandatory post-puzzle quiz, no taxonomic form after every block.
5. Preserve clean-room rules: books influence sequence, cues and error models, but no copied positions, diagrams, problem sets or prose.

## Non-goals

- Do not create a chessboard.
- Do not scrape Lichess or Chess.com.
- Do not copy book exercises, diagrams, positions, prose or proprietary taxonomies.
- Do not require text answers or multi-question forms after each training block.
- Do not make self-reported concept labels a hard progression gate.
- Do not claim rating improvement or causal efficacy.
- Do not solve platform-side leakage if Lichess itself visibly shows a theme; instead mark such attempts as not blind for strong evidence.

## Concept contract model

Add a domain-level contract layer, likely `src/domain/pedagogy/conceptContracts.ts`.

```ts
export type ConceptContract = {
  id: WeaknessTag;
  title: string;
  prerequisiteTags: WeaknessTag[];
  typicalError: string;
  observableGoal: string;
  scaffoldCue: string;
  retrievalPrompt: string;
  postAttemptReflection: string;
  mastery: {
    blindCorrectStreak: number;
    minAttempts: number;
  };
  transfer: {
    mixedBlindCorrectStreak: number;
  };
  sourceInfluences: string[];
  cleanRoomNote: string;
};
```

Field rules:

- `typicalError`: describes the student mistake, not a copied book example.
- `observableGoal`: must be measurable through existing logs/results, e.g. solve, explain, retain, or avoid repeated hard feedback.
- `scaffoldCue`: shown only during `explain` and `guided` stages.
- `retrievalPrompt`: may be shown in blind stages only if it does not name or strongly reveal the concept. Example: for fork, avoid “procure dois alvos”; prefer a neutral “antes do lance, confira ameaças forçadas”. If this cannot be neutral, hide it.
- `postAttemptReflection`: one short optional prompt after feedback.
- `sourceInfluences`: abstract influences only, e.g. `Capablanca`, `Heisman/LPDO`, `Hertan/CCT`, `Neiman pattern-before-calculation`, not quotations.
- `cleanRoomNote`: records that no direct content was copied.

Initial coverage: all current `WeaknessTag` values:

- `hanging-piece`
- `blunder-rate`
- `fork`
- `pin`
- `skewer`
- `discovered`
- `mate-in-1`
- `mate-in-2`
- `back-rank`
- `opening-principles`
- `time-trouble`
- `endgame-pawn`
- `endgame-rook`
- `conversion`

## Blind attempt model

Extend `PlanBlock`:

```ts
isBlindAttempt?: boolean;
hintWasVisible?: boolean;
platformThemeLeakRisk?: boolean;
conceptContractId?: WeaknessTag;
```

Meaning:

- `isBlindAttempt`: true only when the app did not reveal the concept before the attempt.
- `hintWasVisible`: true when `scaffoldCue`, concept title, or concept-revealing prompt was shown before the attempt.
- `platformThemeLeakRisk`: true when the destination likely exposes the concept label outside the app’s control.
- `conceptContractId`: links the block to its contract.

Stage rules:

| Stage | Pre-attempt display | Strong advancement? |
| --- | --- | --- |
| `explain` | `scaffoldCue` visible | no |
| `guided` | `scaffoldCue` or guided framing visible | no |
| `retrieval` | no concept-revealing text | yes, if no platform leak |
| `review` | no concept-revealing text | yes, if no platform leak |
| `transfer` | no concept-revealing text; mixed context preferred | yes, if no platform leak |

A block is strong-evidence eligible only if:

```text
isBlindAttempt === true
hintWasVisible !== true
platformThemeLeakRisk !== true
status === done
observed result is not too-hard/regress
```

## Platform leakage policy

DeepSeek and GLM both flagged the key failure mode: hiding the local Tavarez cue is not enough if the Lichess destination itself reveals the theme.

Therefore:

1. Before marking a block as blind, the app must classify the destination.
2. Theme-specific URLs like `/training/fork` are presumed to leak the theme.
3. Mixed destinations like generic `/training`, Puzzle Streak, or replay without visible theme may be eligible, subject to actual UI check.
4. If leakage cannot be controlled or verified, set `platformThemeLeakRisk: true` and do not count the attempt as strong blind evidence.
5. Do not invent workarounds that violate rules: no scraping, no board, no local puzzle DB unless separately approved.

## Post-attempt reflection

Avoid mandatory multiple-choice taxonomy. It measures recognition and adds friction.

Instead, after feedback, optionally ask one low-friction question:

```text
Você reconheceu o padrão antes de calcular?
[Sim] [Mais ou menos] [Não]
```

Extend `TrainingLog`:

```ts
patternRecognition?: 'yes' | 'partial' | 'no';
conceptContractId?: WeaknessTag;
isBlindAttempt?: boolean;
hintWasVisible?: boolean;
platformThemeLeakRisk?: boolean;
```

Rules:

- The reflection is optional and must not block completion.
- It may inform UI coaching and diagnostics.
- It must not be the sole source for SM-2/diploma advancement.
- If later adding `conceptTag`, keep it optional and diagnostic-only.

## SM-2 / pending review impact

Current pending review can keep its existing spacing mechanics. Add only eligibility gating:

- Scaffolded attempts (`hintWasVisible === true`) may create exposure history, but do not count as strong blind mastery.
- Blind attempts may advance strong streaks and diploma evidence.
- If `platformThemeLeakRisk === true`, the attempt may still be useful practice but cannot count toward blind streak/diploma evidence.
- Hard feedback or observed too-hard still routes to support/relearn as today.

This avoids trusting a student’s self-labeling while preserving learning flow.

## Diploma impact

Diplomas currently use Lichess theme accuracy and minimum attempts. That remains initially unchanged, but a new “blind evidence” field should be introduced before making diplomas stricter.

Phase 1 only records blind eligibility.
Phase 2 can require blind evidence for new diploma attempts.

Do not immediately invalidate existing diplomas or create regression.

## Implementation phases

### Phase 1 — Contracts and display flags

- Add `ConceptContract` registry for the 14 tags.
- Add tests proving every `WeaknessTag` has a contract.
- Add `conceptContractId`, `isBlindAttempt`, `hintWasVisible`, `platformThemeLeakRisk` to `PlanBlock`.
- In `generatePlan`, classify by `resourceStage`:
  - `explain/guided`: not blind, hint visible.
  - `retrieval/review/transfer`: blind by default unless destination leaks theme.
- Do not change SM-2/diploma behavior yet.

Acceptance:

- Every tag has a contract.
- No contract field is empty.
- `retrieval/review/transfer` blocks do not render concept-revealing Tavarez cue before the attempt.
- Theme-specific destination marks `platformThemeLeakRisk === true`.

### Phase 2 — Optional reflection logging

- Add `patternRecognition` and blind metadata to `TrainingLog`.
- UI shows one optional question after feedback.
- Persist fields in IndexedDB/export/import/sync if applicable.

Acceptance:

- Completion works if the user skips reflection.
- Reflection is saved when answered.
- Reflection does not affect SM-2/diploma in this phase.

### Phase 3 — Strong evidence gate

- Add a derived blind streak per concept, using completed logs.
- Add tests for scaffolded vs blind attempts.
- Allow strong advancement only from eligible blind attempts.
- Keep fallback behavior for old logs with missing blind metadata.

Acceptance:

- Five eligible blind successes can produce a mastery signal.
- Scaffolded successes do not increment blind streak.
- Theme-leaking attempts do not increment blind streak.
- Hard/too-hard breaks or reduces streak according to existing difficulty policy.

### Phase 4 — Diploma integration

- Add blind evidence display to diploma progress.
- Only after dogfood, require blind evidence for future diploma sections.
- Existing earned diplomas remain earned.

Acceptance:

- Diploma UI distinguishes accuracy evidence from blind retrieval evidence.
- No existing diploma is removed.
- New stricter gate is feature-flagged or migration-safe.

## Required tests

Domain:

1. `conceptContracts.test.ts`: covers all `WeaknessTag` values exactly once.
2. `generatePlan.test.ts`: `explain/guided` blocks set `hintWasVisible: true`, `isBlindAttempt: false`.
3. `generatePlan.test.ts`: `retrieval/review/transfer` blocks set `isBlindAttempt: true` only when destination is non-leaking.
4. `generatePlan.test.ts`: theme-specific Lichess URLs set `platformThemeLeakRisk: true`.
5. `trainingSession.test.ts`: completion persists blind metadata and optional pattern recognition.
6. Future Phase 3 test: scaffolded attempts do not increment blind streak.
7. Future Phase 3 test: leaking attempts do not increment blind streak.

UI:

1. `PlanBlockCard.test.tsx`: no concept-revealing cue rendered before blind attempt.
2. `PlanBlockCard.test.tsx`: scaffold cue rendered for explain/guided.
3. Reflection prompt can be skipped.
4. Reflection answer is passed to completion handler.

E2E/smoke later:

1. User completes a blind retrieval block without answering reflection.
2. User answers “Sim” and log persists.
3. No broken mobile flow or extra blocking modal.

## Counterexamples the implementation must resist

### Label leakage

A fork block in `retrieval` opens a theme-specific Lichess URL and the user can see “fork”. If the app increments blind streak, the implementation is wrong. The block must be `platformThemeLeakRisk: true` and not strong-evidence eligible.

### Recognition menu masquerading as retrieval

After a puzzle, the app asks “Foi garfo, cravada ou espeto?” and uses the answer to advance mastery. This is wrong: it measures recognition from a menu and metacognitive vocabulary, not blind retrieval.

### Scaffolded success inflates diploma

The student solves guided fork practice after seeing `scaffoldCue`. If this counts as blind mastery/diploma evidence, the implementation is wrong.

### Taxonomy overload

Every completed block forces concept classification before completion. This is wrong: it breaks the habit loop and increases cognitive load.

## Open decisions

1. Exact blind streak threshold: default 5 or 3?
   - Council suggested 3 for simplicity; prior pedagogy often uses 30 attempts for robust accuracy. Proposed compromise: Phase 3 starts with `blindCorrectStreak: 5` and logs data.
2. Whether generic Lichess `/training` can be considered non-leaking in practice.
   - Needs manual Playwright/UI check.
3. Whether `patternRecognition` should affect future copy.
   - Allowed as coaching signal, not progression gate.
4. Whether diploma Phase 4 should require blind evidence for all sections or only tactical sections.
   - Decide after dogfood.

## Verification gates

Before closing implementation:

```bash
npm run lint
npm test
npm run build
```

If storage/sync schema changes:

```bash
npm run typecheck:worker
npm run test:worker
```
