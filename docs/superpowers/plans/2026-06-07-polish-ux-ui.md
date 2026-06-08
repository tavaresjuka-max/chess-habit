# Polish UX/UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Make the personal Lichess study tool calm and finished on mobile — training-first "Hoje" screen, a two-step block card with required difficulty rating, a sectioned Config screen, accessibility polish, PT-BR accents, and lightweight feedback (toasts) + icons.

**Architecture:** Pure front-end changes in a Vite + React 19 + TypeScript (strict) PWA. Keep the existing hand-written CSS (`src/index.css`); no UI framework. Add two small runtime deps — `sonner` (toasts) and `lucide-react` (icons). No changes to the domain or state layers except where wiring is unavoidable. Tests are React Testing Library + Vitest (jsdom).

**Tech Stack:** React 19.2, TypeScript strict, Vite, Vitest + @testing-library/react (jsdom), `sonner`, `lucide-react`.

**Spec:** `docs/superpowers/specs/2026-06-07-polish-ux-ui-design.md`

**Executor:** Codex.

**Execution status:** Completed in commits `dea7891` through `dac5d55`. Final gate re-run after completion:
`npm run lint`, `npm run test`, and `npm run build` passed. Final desktop/mobile visual artifacts were
captured in `output/playwright/` during closure.

---

## Conventions for every task

- Run the full gate after each task: `npm run lint && npm run test && npm run build`.
- Commit messages in PT-BR, present tense, scoped (e.g. `feat(ui): ...`, `style(ui): ...`, `test(ui): ...`).
- Never touch `AGENTS.md`/`PLANO.md`. Diagnostics/OAuth/data behaviour is unchanged — only presentation moves.
- If a step needs a domain/state change not described here, STOP and ask. Do not invent it.

## File map

- `package.json` — add `sonner`, `lucide-react` (Task 1).
- `src/ui/App.tsx` — mount `<Toaster>` (Task 1); nav icons (Task 8); accent on `aria-label` (Task 2).
- `src/ui/Today.tsx` — accents (Task 2); block card two-step flow (Task 4); screen reorder + diagnostics `<details>` (Task 5); icons (Task 8).
- `src/ui/Config.tsx` — accents (Task 2); three sections + danger zone (Task 6); toasts (Task 7); icons (Task 8).
- `src/index.css` — a11y/disabled/44px (Task 3); rating-row (Task 4); details + next-session (Task 5); config sections/danger zone (Task 6); link-button (Task 4).
- `src/app/trainingFlow.test.tsx` — accent assertions (Task 2); card-flow rewrite (Task 4); open diagnostics `<details>` (Task 5).
- `src/smoke.test.tsx` — accent assertion (Task 2).

---

## Task 1: Add `sonner` + `lucide-react`, mount the Toaster

**Files:**
- Modify: `package.json` (via npm)
- Modify: `src/ui/App.tsx`

- [x] **Step 1: Install the two runtime deps**

Run:
```bash
npm install sonner lucide-react
```
Expected: both land in `dependencies`; `npm install` completes clean.

- [x] **Step 2: Mount the Toaster in the app shell**

In `src/ui/App.tsx`, add the import at the top (after the existing imports):
```tsx
import { Toaster } from 'sonner';
```
Then, inside the main return, add the Toaster as the first child of `<main className="app-shell">` (just before `<nav ...>`):
```tsx
    <main className="app-shell">
      <Toaster richColors position="bottom-right" />
      <nav className="top-nav" aria-label="Navegacao principal">
```

- [x] **Step 3: Run the full gate**

Run: `npm run lint && npm run test && npm run build`
Expected: all green. (The Toaster renders nothing visible yet; no test asserts on it.)

- [x] **Step 4: Commit**

```bash
git add package.json package-lock.json src/ui/App.tsx
git commit -m "feat(ui): adicionar sonner e lucide-react e montar Toaster global"
```

---

## Task 2: PT-BR microcopy with accents (+ keep tests green)

Pure string edits to visible copy, plus the two test assertions that depend on those strings. **Do not** touch the block-card buttons (`Foi facil/bom/dificil`) — those are removed in Task 4.

**Files:**
- Modify: `src/ui/App.tsx`, `src/ui/Config.tsx`, `src/ui/Today.tsx`
- Test: `src/smoke.test.tsx`, `src/app/trainingFlow.test.tsx`

- [x] **Step 1: Update the failing test assertions first (they will fail until the copy changes)**

In `src/smoke.test.tsx`, line 16, change:
```tsx
    expect(await screen.findByText('Usuario Lichess')).toBeTruthy();
```
to:
```tsx
    expect(await screen.findByText('Usuário Lichess')).toBeTruthy();
```

In `src/app/trainingFlow.test.tsx`, line 45, change:
```tsx
      expect(screen.getByText(/Treinando ha/i)).toBeTruthy();
```
to:
```tsx
      expect(screen.getByText(/Treinando há/i)).toBeTruthy();
```

- [x] **Step 2: Run those tests to confirm they now fail**

Run: `npm run test -- smoke trainingFlow`
Expected: FAIL — "Unable to find ... Usuário Lichess" / "Treinando há" (source still says `Usuario` / `Treinando ha`).

- [x] **Step 3: Apply accents in `src/ui/App.tsx`**

Change the nav `aria-label`:
```tsx
      <nav className="top-nav" aria-label="Navegação principal">
```

- [x] **Step 4: Apply accents in `src/ui/Config.tsx`**

Make these exact replacements:
- `<h1 id="config-title">Config</h1>` → `<h1 id="config-title">Configuração</h1>`
- `<span>Usuario Lichess</span>` → `<span>Usuário Lichess</span>`
- `<span>Usuario Chess.com</span>` → `<span>Usuário Chess.com</span>`
- `<span>Tempo padrao</span>` → `<span>Tempo padrão</span>`
- `setStatusMessage('Configuracao salva.');` → `setStatusMessage('Configuração salva.');`
- In `formatLichessConnection`: `return 'Conexao Lichess precisa de atencao.';` → `return 'Conexão Lichess precisa de atenção.';`
- Button text `Remover conexao` → `Remover conexão`

(Leave the nav button label `Config` in `App.tsx` unchanged — the page H1 carries the full word; the nav stays compact.)

- [x] **Step 5: Apply accents in `src/ui/Today.tsx`**

Replacements:
- Empty-plan message: `Salve sua configuracao para gerar o plano local.` → `Salve sua configuração para gerar o plano local.`
- Header count: `{sessionSummaries.length === 1 ? 'sessao' : 'sessoes'}` → `{sessionSummaries.length === 1 ? 'sessão' : 'sessões'}`
- Session heading: `Sessao {session.sessionNumber}` → `Sessão {session.sessionNumber}`
- Roadmap title: `<h2 id="roadmap-title">Proximos passos</h2>` → `<h2 id="roadmap-title">Próximos passos</h2>`
- In `formatTimerStatus`: `Treinando ha ${...}` → `Treinando há ${...}`; `Pulou apos ${...}` → `Pulou após ${...}`
- In `formatResourceStage`: `explicacao` → `explicação`; `repeticao` → `repetição`; `transferencia` → `transferência`; `revisao` → `revisão`
- In `formatFeedback`: `'facil'` (return value) → `'fácil'`; `'dificil'` → `'difícil'`
- In `formatWeaknessTag`: `'pecas penduradas'` → `'peças penduradas'`; `'conversao'` → `'conversão'`; `'mate na ultima fileira'` → `'mate na última fileira'`
- In `formatRoadmapStatus`: `'Proximo'` → `'Próximo'`

- [x] **Step 6: Run the full gate**

Run: `npm run lint && npm run test && npm run build`
Expected: all green.

- [x] **Step 7: Commit**

```bash
git add src/ui/App.tsx src/ui/Config.tsx src/ui/Today.tsx src/smoke.test.tsx src/app/trainingFlow.test.tsx
git commit -m "style(ui): aplicar acentuacao PT-BR na microcopy visivel"
```

---

## Task 3: Accessibility & state CSS polish (focus-visible, disabled cursor, 44px touch)

Pure CSS. Verified manually (focus rings and cursors aren't unit-testable); tests must stay green.

**Files:**
- Modify: `src/index.css`

- [x] **Step 1: Fix the disabled cursor and add a real loading class**

In `src/index.css`, replace this rule (lines ~80–83):
```css
button:disabled {
  cursor: wait;
  opacity: 0.7;
}
```
with:
```css
button:disabled,
button[aria-disabled='true'] {
  cursor: not-allowed;
  opacity: 0.7;
}

.is-loading {
  cursor: wait;
}
```

- [x] **Step 2: Add a consistent focus-visible ring**

In `src/index.css`, immediately after the block from Step 1, add:
```css
:focus-visible {
  outline: 2px solid #1f3f36;
  outline-offset: 2px;
}
```

- [x] **Step 3: Raise mobile touch targets to 44px**

In `src/index.css`, inside the existing `@media (max-width: 560px)` block, add this rule (e.g. right after the `.app-shell` override):
```css
  button,
  .button-link,
  input,
  select {
    min-height: 44px;
  }
```

- [x] **Step 4: Run the full gate**

Run: `npm run lint && npm run test && npm run build`
Expected: all green.

- [x] **Step 5: Manual visual check**

Run: `npm run dev`, then in the browser: Tab through nav/buttons/inputs → a 2px dark-green ring is visible on each. A disabled button shows `not-allowed`, not the loading cursor. At 390px width, buttons are at least 44px tall.

- [x] **Step 6: Commit**

```bash
git add src/index.css
git commit -m "style(ui): foco visivel, cursor de desabilitado correto e alvo de toque 44px"
```

---

## Task 4: Block card — two-step flow with required rating

The pending card shows only `Abrir no Lichess` (primary) + `Concluir` + a discreet `Pular` link. Tapping `Concluir` reveals "Como foi o treino?" → `Fácil`/`Bom`/`Difícil` (+ `Voltar`). Choosing a rating completes the block (with feedback). There is no neutral completion from the UI.

**Files:**
- Modify: `src/ui/Today.tsx` (the `PlanBlockCard` function, lines ~277–385)
- Modify: `src/index.css`
- Test: `src/app/trainingFlow.test.tsx`

- [x] **Step 1: Rewrite the card-flow tests (they will fail first)**

In `src/app/trainingFlow.test.tsx`, replace the test `'hides destructive completion controls after a block is already done'` with:
```tsx
  it('hides destructive completion controls after a block is already done', async () => {
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: 'Concluir' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Bom' }));

    await waitFor(() => {
      expect(screen.getByText('Feito')).toBeTruthy();
    });

    expect(screen.queryByRole('button', { name: 'Concluir' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Fácil' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Bom' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Difícil' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Pular' })).toBeNull();
    expect(screen.getByRole('link', { name: /Abrir de novo/i })).toBeTruthy();
  });
```

Replace `'records zero elapsed seconds honestly when completing without starting first'` with:
```tsx
  it('records zero elapsed seconds honestly when completing without starting first', async () => {
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: 'Concluir' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Bom' }));

    await waitFor(() => {
      expect(screen.getByText(/Treinou por menos de 1 min/i)).toBeTruthy();
    });

    const log = await getFirstBlockLog();

    expect(log?.status).toBe('done');
    expect(log?.elapsedSeconds).toBe(0);
  });
```

Replace the `it.each([...])('uses feedback %s ...')` block with:
```tsx
  it.each([
    ['Fácil', 'easy', 'retrieval', 'https://lichess.org/training/fork'],
    ['Bom', 'good', 'guided', 'https://lichess.org/practice/fundamental-tactics/the-fork/Qj281y1p'],
    ['Difícil', 'hard', 'explain', 'https://lichess.org/video?tags=beginner%2Ftactics'],
  ] satisfies Array<[string, PlanBlockFeedback, PlanResourceStage, string]>)(
    'uses feedback %s to adapt the next generated plan',
    async (buttonName, expectedFeedback, expectedStage, expectedUrl) => {
      render(<App />);

      fireEvent.click(await screen.findByRole('button', { name: 'Concluir' }));
      fireEvent.click(await screen.findByRole('button', { name: buttonName }));

      await waitFor(async () => {
        expect((await getFirstBlockLog())?.feedback).toBe(expectedFeedback);
      });

      fireEvent.click(screen.getByRole('button', { name: 'Config' }));
      fireEvent.click(await screen.findByRole('button', { name: 'Salvar' }));

      await waitFor(async () => {
        const plan = await getPlan(getTodayDateForTest());

        expect(plan?.blocks[0]?.resourceStage).toBe(expectedStage);
        expect(plan?.blocks[0]?.destination.url).toBe(expectedUrl);
      });
    },
  );
```

In the test `'reopens a done block without recreating an active log'`, replace the single completion click:
```tsx
    fireEvent.click(await screen.findByRole('button', { name: 'Concluir' }));
```
with:
```tsx
    fireEvent.click(await screen.findByRole('button', { name: 'Concluir' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Bom' }));
```

Add a new test (after the `'reopens a done block...'` test) covering the cancel path:
```tsx
  it('cancels completion with Voltar without finishing the block', async () => {
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: 'Concluir' }));
    expect(await screen.findByText('Como foi o treino?')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Concluir' })).toBeTruthy();
    });
    expect(screen.queryByText('Como foi o treino?')).toBeNull();
    expect((await getFirstBlockLog())?.status).not.toBe('done');
  });
```

- [x] **Step 2: Run the card tests to confirm they fail**

Run: `npm run test -- trainingFlow`
Expected: FAIL — the current card shows `Foi bom` (not `Bom`) and `Concluir` completes immediately, so `Como foi o treino?` is never found.

- [x] **Step 3: Rewrite `PlanBlockCard` for the two-step flow**

In `src/ui/Today.tsx`, replace the entire `PlanBlockCard` function (lines ~277–385) with:
```tsx
function PlanBlockCard({
  block,
  nowIso,
  trainingLog,
  onStartBlockTraining,
  onCompleteBlockTraining,
  onSkipBlockTraining,
}: {
  block: PlanBlock;
  nowIso: string;
  trainingLog: TrainingLog | undefined;
  onStartBlockTraining: (block: PlanBlock) => Promise<void>;
  onCompleteBlockTraining: (blockId: string, feedback?: PlanBlockFeedback) => Promise<void>;
  onSkipBlockTraining: (blockId: string) => Promise<void>;
}) {
  const [isRating, setIsRating] = useState(false);
  const timerStatus = trainingLog === undefined ? undefined : formatTimerStatus(trainingLog, nowIso);
  const isDone = block.status === 'done';

  return (
    <article className="plan-block">
      <div className="block-header">
        <h2>{block.title}</h2>
        <span className={`status-pill status-${block.status}`}>{formatStatus(block.status)}</span>
      </div>
      <p className="block-meta">
        {block.estimatedMinutes} min - {formatResourceStage(block.resourceStage)} - {block.destination.label}
      </p>
      <p>{block.reason}</p>
      <p>{block.task}</p>
      <p className="coach-note">{block.coachNote}</p>
      <p className="stop-rule">{block.stopRule}</p>
      {block.feedback !== undefined ? <p className="feedback-note">Feedback: {formatFeedback(block.feedback)}</p> : null}
      {timerStatus !== undefined ? <p className={`timer-status ${timerStatus.kind}`}>{timerStatus.label}</p> : null}

      {isDone ? (
        <div className="button-row">
          {block.destination.url !== undefined ? (
            <a
              className="button-link"
              href={block.destination.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Abrir de novo: ${block.title}`}
              onClick={() => {
                void onStartBlockTraining(block);
              }}
            >
              Abrir de novo
            </a>
          ) : null}
        </div>
      ) : isRating ? (
        <div className="rating-row" role="group" aria-label="Como foi o treino?">
          <p className="rating-prompt">Como foi o treino?</p>
          <div className="button-row">
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                void onCompleteBlockTraining(block.id, 'easy');
              }}
            >
              Fácil
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                void onCompleteBlockTraining(block.id, 'good');
              }}
            >
              Bom
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                void onCompleteBlockTraining(block.id, 'hard');
              }}
            >
              Difícil
            </button>
            <button
              type="button"
              className="link-button"
              onClick={() => {
                setIsRating(false);
              }}
            >
              Voltar
            </button>
          </div>
        </div>
      ) : (
        <div className="button-row">
          {block.destination.url !== undefined ? (
            <a
              className="button-link"
              href={block.destination.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Abrir no Lichess: ${block.title}`}
              onClick={() => {
                void onStartBlockTraining(block);
              }}
            >
              Abrir no Lichess
            </a>
          ) : (
            <button
              type="button"
              onClick={() => {
                void onStartBlockTraining(block);
              }}
            >
              Iniciar bloco
            </button>
          )}
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setIsRating(true);
            }}
          >
            Concluir
          </button>
          <button
            type="button"
            className="link-button"
            onClick={() => {
              void onSkipBlockTraining(block.id);
            }}
          >
            Pular
          </button>
        </div>
      )}
    </article>
  );
}
```
(`useState` is already imported at the top of `Today.tsx`.)

- [x] **Step 4: Add CSS for the rating row and link-button**

In `src/index.css`, append:
```css
.rating-row {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}

.plan-block .rating-prompt {
  margin: 0;
  font-weight: 650;
  color: #22303c;
}

.link-button {
  min-height: auto;
  border: none;
  background: none;
  color: #46515e;
  text-decoration: underline;
  padding: 4px 6px;
}

.link-button:hover {
  background: none;
  color: #1f3f36;
}
```

- [x] **Step 5: Run the full gate**

Run: `npm run lint && npm run test && npm run build`
Expected: all green (all rewritten card tests + the new Voltar test pass).

- [x] **Step 6: Commit**

```bash
git add src/ui/Today.tsx src/index.css src/app/trainingFlow.test.tsx
git commit -m "feat(ui): card de treino em duas etapas com avaliacao obrigatoria"
```

---

## Task 5: Reorder "Hoje" — training first, diagnostics in a collapsed `<details>`

New order: compact header → weakness chips → training blocks → "Próxima sessão" (time selector + next-session button) → roadmap → "Diagnóstico" `<details>` (closed by default). Single column, no two-column desktop.

**Files:**
- Modify: `src/ui/Today.tsx` (the `Today` return, lines ~106–246)
- Modify: `src/index.css`
- Test: `src/app/trainingFlow.test.tsx` (open the `<details>` before using diagnostics buttons)

- [x] **Step 1: Make the diagnostics tests open the section first (they will fail otherwise once it's collapsed)**

In `src/app/trainingFlow.test.tsx`, in `'syncs Lichess diagnosis even when the NDJSON stream has a broken line'`, replace:
```tsx
    fireEvent.click(await screen.findByRole('button', { name: 'Atualizar Lichess' }));
```
with:
```tsx
    fireEvent.click(await screen.findByText('Diagnóstico'));
    fireEvent.click(screen.getByRole('button', { name: 'Atualizar Lichess' }));
```

In `'asks for Lichess connection before creating a Study'`, replace:
```tsx
    fireEvent.click(await screen.findByRole('button', { name: 'Gerar Study' }));
```
with:
```tsx
    fireEvent.click(await screen.findByText('Diagnóstico'));
    fireEvent.click(screen.getByRole('button', { name: 'Gerar Study' }));
```

- [x] **Step 2: Rewrite the `Today` return to the new order**

In `src/ui/Today.tsx`, replace the returned JSX of the `Today` component (the block starting `return (` at ~line 106 and ending at its matching `);` before `function RoadmapList`, i.e. lines ~106–246) with:
```tsx
  return (
    <section aria-labelledby="today-title" className="panel today-panel">
      <div className="section-heading">
        <div>
          <h1 id="today-title">Hoje</h1>
          <p>
            {plan.date} - {sessionSummaries.length} {sessionSummaries.length === 1 ? 'sessão' : 'sessões'} -{' '}
            {totalPlannedMinutes} min
          </p>
          {plan.weeklyFocus !== undefined ? (
            <p className="weekly-focus">
              Semana: {plan.weeklyFocus.title} - {plan.weeklyFocus.reason}
            </p>
          ) : null}
        </div>
      </div>

      {weaknesses.length > 0 ? (
        <div className="weakness-row" aria-label="Hipóteses atuais">
          {weaknesses
            .slice()
            .sort((left, right) => right.score - left.score)
            .slice(0, 3)
            .map((weakness) => (
              <span className="weakness-chip" key={weakness.tag}>
                {formatWeaknessTag(weakness.tag)} ({Math.round(weakness.score * 100)}%)
              </span>
            ))}
        </div>
      ) : null}

      <div className="block-list">
        {sessionSummaries.map((session) => (
          <section
            className="session-group"
            key={session.sessionNumber}
            aria-labelledby={`session-${String(session.sessionNumber)}`}
          >
            <div className="session-heading">
              <h2 id={`session-${String(session.sessionNumber)}`}>Sessão {session.sessionNumber}</h2>
              <span>{session.minutes} min</span>
            </div>
            {session.blocks.map((block) => (
              <PlanBlockCard
                block={block}
                key={block.id}
                nowIso={nowIso}
                trainingLog={trainingLogs.find((log) => log.blockId === block.id)}
                onStartBlockTraining={onStartBlockTraining}
                onCompleteBlockTraining={onCompleteBlockTraining}
                onSkipBlockTraining={onSkipBlockTraining}
              />
            ))}
          </section>
        ))}
      </div>

      <section className="next-session" aria-label="Próxima sessão">
        <div className="session-actions">
          <label className="compact-field">
            <span>Tempo</span>
            <select
              value={sessionMinutes}
              onChange={(event) => {
                void onSessionMinutesChange(Number(event.target.value) as SessionMinutes);
              }}
            >
              {sessionOptions.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} min
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="secondary-button"
            disabled={hasActiveTraining}
            onClick={() => {
              void onCreateNextSession(sessionMinutes);
            }}
          >
            Fazer próxima sessão
          </button>
        </div>
      </section>

      <RoadmapList items={roadmap} />

      <details className="diagnosis-details">
        <summary>Diagnóstico</summary>
        <div className="diagnosis-strip" aria-live="polite">
          <div className="diagnosis-actions">
            <button
              type="button"
              className="secondary-button"
              disabled={diagnosisState === 'syncing'}
              onClick={() => {
                void onSyncChesscomDiagnosis();
              }}
            >
              {diagnosisState === 'syncing' ? 'Atualizando...' : 'Atualizar Chess.com'}
            </button>
            <button
              type="button"
              className="secondary-button"
              disabled={lichessConnectionState === 'syncing'}
              onClick={() => {
                void onSyncLichessDiagnosis();
              }}
            >
              {lichessConnectionState === 'syncing' ? 'Lichess...' : 'Atualizar Lichess'}
            </button>
            <button
              type="button"
              className="secondary-button"
              disabled={lichessConnectionState === 'syncing'}
              onClick={() => {
                void onReconcileLichessResults();
              }}
            >
              Reconciliar puzzles
            </button>
            <button
              type="button"
              className="secondary-button"
              disabled={lichessConnectionState === 'syncing'}
              onClick={() => {
                void onCreateLichessStudy();
              }}
            >
              Gerar Study
            </button>
          </div>
          <div className="diagnosis-messages">
            {diagnosisMessage !== undefined ? <p>{diagnosisMessage}</p> : null}
            {lichessMessage !== undefined ? <p>{lichessMessage}</p> : null}
            {lichessStudyLink !== undefined ? (
              <a className="button-link secondary-link" href={lichessStudyLink.url} target="_blank" rel="noreferrer">
                Abrir Study do dia
              </a>
            ) : null}
          </div>
        </div>
      </details>
    </section>
  );
```

- [x] **Step 3: Add CSS for the next-session block and diagnostics details**

In `src/index.css`, append:
```css
.next-session {
  margin-top: 4px;
}

.diagnosis-details {
  border: 1px solid #cdd7cf;
  border-radius: 8px;
  background: #fff;
  margin-top: 16px;
  padding: 4px 12px;
}

.diagnosis-details > summary {
  cursor: pointer;
  font-weight: 650;
  color: #22303c;
  padding: 10px 0;
}

.diagnosis-details[open] .diagnosis-strip {
  margin: 8px 0 12px;
}
```

- [x] **Step 4: Run the full gate**

Run: `npm run lint && npm run test && npm run build`
Expected: all green (diagnostics tests now open the `<details>` first).

- [x] **Step 5: Manual visual check (mobile-first)**

Run: `npm run dev`. At 390×844: the first `Abrir no Lichess` is at/near the first fold; the 4 diagnostics buttons are NOT visible until you expand "Diagnóstico". Order top→bottom: header → weakness chips → training → Próxima sessão → Próximos passos → Diagnóstico (closed).

- [x] **Step 6: Commit**

```bash
git add src/ui/Today.tsx src/index.css src/app/trainingFlow.test.tsx
git commit -m "feat(ui): reordenar Hoje com treino primeiro e diagnostico recolhido"
```

---

## Task 6: Config — three sections + danger zone

Group the screen into **Essencial** (fields + Salvar), **Lichess (opcional)** (existing connection box, clearer copy), and **Dados locais** (backup, sinais manuais, Apagar tudo) in a visually distinct danger zone. The three data buttons move OUT of the form into their own section.

**Files:**
- Modify: `src/ui/Config.tsx` (the returned JSX, lines ~82–188)
- Modify: `src/index.css`

- [x] **Step 1: Restructure the Config JSX**

In `src/ui/Config.tsx`, replace the returned JSX (from `return (` at ~line 82 to the matching `);` at ~line 188) with:
```tsx
  return (
    <section aria-labelledby="config-title" className="panel">
      <h1 id="config-title">Configuração</h1>

      <section className="config-section" aria-labelledby="config-essential-title">
        <h2 id="config-essential-title">Essencial</h2>
        <p className="config-hint">O que define seu plano do dia.</p>
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          <label className="field">
            <span>Usuário Lichess</span>
            <input
              autoComplete="username"
              value={lichessUsername}
              onChange={(event) => {
                setLichessUsername(event.target.value);
              }}
            />
          </label>

          <label className="field">
            <span>Usuário Chess.com</span>
            <input
              autoComplete="username"
              value={chesscomUsername}
              onChange={(event) => {
                setChesscomUsername(event.target.value);
              }}
            />
          </label>

          <label className="field">
            <span>Faixa atual</span>
            <select
              value={band}
              onChange={(event) => {
                setBand(event.target.value as LearnerBand);
              }}
            >
              <option value="0-800">0-800</option>
              <option value="800-1200">800-1200</option>
            </select>
          </label>

          <label className="field">
            <span>Tempo padrão</span>
            <select
              value={defaultSessionMinutes}
              onChange={(event) => {
                setDefaultSessionMinutes(Number(event.target.value) as SessionMinutes);
              }}
            >
              {sessionOptions.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} min
                </option>
              ))}
            </select>
          </label>

          <div className="button-row">
            <button type="submit">Salvar</button>
          </div>
        </form>
      </section>

      <section className="config-section connection-box" aria-labelledby="lichess-connection-title" aria-live="polite">
        <div>
          <h2 id="lichess-connection-title">Lichess <span className="optional-tag">opcional</span></h2>
          <p className="config-hint">
            Conectar habilita reconciliar puzzles e criar o Study do dia. O backup não inclui o token.
          </p>
          <p>{formatLichessConnection(lichessToken, lichessConnectionState)}</p>
          {lichessMessage !== undefined ? <p>{lichessMessage}</p> : null}
        </div>
        <div className="button-row">
          <button
            type="button"
            disabled={lichessConnectionState === 'syncing'}
            onClick={() => {
              void onConnectLichess();
            }}
          >
            {lichessToken === undefined ? 'Conectar Lichess' : 'Reconectar Lichess'}
          </button>
          <button
            type="button"
            className="secondary-button"
            disabled={lichessToken === undefined || lichessConnectionState === 'syncing'}
            onClick={() => {
              void onDisconnectLichess();
            }}
          >
            Remover conexão
          </button>
        </div>
      </section>

      <section className="config-section data-zone" aria-labelledby="config-data-title">
        <h2 id="config-data-title">Dados locais</h2>
        <p className="config-hint">Tudo fica só neste navegador.</p>
        <div className="button-row">
          <button type="button" className="secondary-button" onClick={() => void handleExport()}>
            Exportar backup JSON
          </button>
          <button type="button" className="secondary-button" onClick={() => void handleImportKnownManualSignals()}>
            Adicionar sinais manuais
          </button>
          <button type="button" className="danger-button" onClick={() => void handleClear()}>
            Apagar tudo
          </button>
        </div>
      </section>

      {statusMessage !== undefined ? <p className="status-message">{statusMessage}</p> : null}
    </section>
  );
```
(The `statusMessage` line is removed in Task 7. Keep it for now so this task stays self-contained.)

- [x] **Step 2: Add CSS for the sections, optional tag, and danger zone**

In `src/index.css`, append:
```css
.config-section {
  display: grid;
  gap: 12px;
  margin-bottom: 24px;
}

.config-section > h2 {
  margin: 0;
  font-size: 1.05rem;
}

.config-hint {
  margin: 0;
  font-size: 0.9rem;
}

.optional-tag {
  border: 1px solid #cdd7cf;
  border-radius: 999px;
  color: #46515e;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 1px 8px;
  vertical-align: middle;
}

.data-zone {
  border: 1px solid #e3b7b7;
  border-radius: 8px;
  background: #fdf7f7;
  padding: 14px;
}
```
Then update the existing `.connection-box` rule (lines ~151–157) — remove its now-redundant top border/margin since `.config-section` handles spacing:
```css
.connection-box {
  display: grid;
  gap: 10px;
}
```

- [x] **Step 3: Run the full gate**

Run: `npm run lint && npm run test && npm run build`
Expected: all green (smoke test still finds nav `Config` and `Usuário Lichess`).

- [x] **Step 4: Manual visual check**

Run: `npm run dev` → Config view. Three clear sections; `Apagar tudo` sits inside the pink danger zone, separated from setup.

- [x] **Step 5: Commit**

```bash
git add src/ui/Config.tsx src/index.css
git commit -m "feat(ui): agrupar Config em Essencial, Lichess opcional e Dados locais"
```

---

## Task 7: Toasts for non-critical Config feedback (Sonner)

Replace the static `status-message` paragraph with `sonner` toasts for the four local success actions (save, export, import, clear). Critical/inline messages elsewhere (OAuth, load, diagnostics) are untouched.

**Files:**
- Modify: `src/ui/Config.tsx`

- [x] **Step 1: Import toast and replace the status calls**

In `src/ui/Config.tsx`, add the import at the top:
```tsx
import { toast } from 'sonner';
```
Replace each `setStatusMessage(...)` call:
- in `handleSubmit`: `setStatusMessage('Configuração salva.');` → `toast.success('Configuração salva.');`
- in `handleExport`: `setStatusMessage('Backup exportado.');` → `toast.success('Backup exportado.');`
- in `handleImportKnownManualSignals`: `setStatusMessage(\`${String(count)} sinais manuais salvos.\`);` → `toast.success(\`${String(count)} sinais manuais salvos.\`);`
- in `handleClear`: `setStatusMessage('Dados locais apagados.');` → `toast.success('Dados locais apagados.');`

- [x] **Step 2: Remove the now-unused state and paragraph**

Delete the state declaration:
```tsx
  const [statusMessage, setStatusMessage] = useState<string | undefined>(undefined);
```
Delete the trailing render line:
```tsx
      {statusMessage !== undefined ? <p className="status-message">{statusMessage}</p> : null}
```
`useState` is still used for the other fields, so keep the `import { useState } from 'react';`.

- [x] **Step 3: Run the full gate**

Run: `npm run lint && npm run test && npm run build`
Expected: all green. Lint must not flag an unused `statusMessage`/`setStatusMessage` (both removed).

- [x] **Step 4: Manual visual check**

Run: `npm run dev` → Config → click `Salvar`: a green toast "Configuração salva." appears bottom-right and auto-dismisses. Export/import/Apagar tudo each toast similarly. OAuth errors still render inline in the connection box.

- [x] **Step 5: Commit**

```bash
git add src/ui/Config.tsx
git commit -m "feat(ui): usar toasts sonner para feedback nao critico da Config"
```

---

## Task 8: Restrained lucide-react icons

Icons only where they aid scanning, always `aria-hidden` so accessible names (and the existing tests) are unchanged.

**Files:**
- Modify: `src/ui/App.tsx`, `src/ui/Today.tsx`, `src/ui/Config.tsx`

- [x] **Step 1: Nav icons in `src/ui/App.tsx`**

Add import:
```tsx
import { CalendarDays, Settings } from 'lucide-react';
```
Add an icon as the first child of each nav button (text stays — the accessible name is unchanged):
```tsx
          <CalendarDays size={18} aria-hidden="true" />
          Hoje
```
```tsx
          <Settings size={18} aria-hidden="true" />
          Config
```

- [x] **Step 2: Action icons in `src/ui/Today.tsx`**

Add import:
```tsx
import { Check, ExternalLink, RefreshCw } from 'lucide-react';
```
- In both `Abrir no Lichess` and `Abrir de novo` links, add as first child: `<ExternalLink size={18} aria-hidden="true" />` (the links already carry an explicit `aria-label`, so their name is unaffected).
- In the `Concluir` button, add as first child: `<Check size={18} aria-hidden="true" />`.
- In `Atualizar Chess.com` and `Atualizar Lichess` buttons, add as first child: `<RefreshCw size={16} aria-hidden="true" />`.

- [x] **Step 3: Danger icon in `src/ui/Config.tsx`**

Add import:
```tsx
import { Trash2 } from 'lucide-react';
```
In the `Apagar tudo` button, add as first child: `<Trash2 size={18} aria-hidden="true" />`.

- [x] **Step 4: Ensure icon + text spacing**

In `src/index.css`, append:
```css
button > svg,
.button-link > svg {
  margin-right: 6px;
}

.nav-button > svg {
  margin-right: 6px;
}
```

- [x] **Step 5: Run the full gate**

Run: `npm run lint && npm run test && npm run build`
Expected: all green. Critically, `getByRole('button', { name: 'Concluir' })` and `findByRole('link', { name: /Abrir no Lichess/i })` still match because the icons are `aria-hidden`.

- [x] **Step 6: Manual visual check**

Run: `npm run dev`. Icons appear inline-left of their labels; no icon clutter on secondary/feedback buttons. Tab focus still shows the ring from Task 3.

- [x] **Step 7: Commit**

```bash
git add src/ui/App.tsx src/ui/Today.tsx src/ui/Config.tsx src/index.css
git commit -m "feat(ui): icones lucide contidos em nav e acoes principais"
```

---

## Self-Review (completed by planner)

**Spec coverage:**
- §4.1 reorder Hoje + diagnostics `<details>` → Task 5. ✓
- §4.2 two-step card, required rating, done-state preserved, Pular as plain link → Task 4. ✓
- §4.3 Config three sections + danger zone, `window.confirm` kept → Task 6. ✓
- §4.4 focus-visible, disabled→not-allowed + `.is-loading`, 44px, PT-BR accents → Tasks 3 + 2. ✓
- §4.5 Sonner non-critical only + critical inline; restrained lucide → Tasks 1, 7, 8. ✓
- §5 out-of-scope items → none implemented. ✓
- §6 verification (lint/test/build + 390×844 & 1280×800) → gate + manual checks each task. ✓
- Decision "reject UI frameworks / no two-column" → honoured (vanilla CSS, single column). ✓

**Boundary note (deliberate):** Diagnostics success/error messages stay inline (aria-live), NOT toasted — distinguishing success from error there would require touching `state.ts`, which is out of this polish pass. Spec §4.5's "diagnóstico concluído" toast is therefore scoped to the Config-local actions only. If the owner wants diagnostics toasts, that's a follow-up that touches state.

**Placeholder scan:** none — every step has concrete code/commands.

**Type/label consistency:** rating buttons `Fácil`/`Bom`/`Difícil` map to `'easy'`/`'good'`/`'hard'` consistently in component and tests; `onCompleteBlockTraining(blockId, feedback?)` signature unchanged; `setIsRating` used consistently; diagnostics summary text `Diagnóstico` matches the test's `findByText('Diagnóstico')`.
