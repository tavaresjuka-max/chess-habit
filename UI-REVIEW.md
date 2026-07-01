# Chess Habit / lichess-tutor — UI Review

**Audited:** 2026-06-30
**Baseline:** Abstract 6-pillar standards (no UI-SPEC.md present)
**Screenshots:** Not captured — no dev server detected at localhost:3000 or 5173. Code-only audit.

---

## ⏱️ Resolution status — 2026-07-01 (verified against `master`)

> This is a point-in-time audit. The **Top 3 Priority Fixes below were all actioned** and are
> merged into `master`. Do **not** re-open them.

| # | Finding | Status | Where |
|---|---------|--------|-------|
| 1 | Undefined tokens `--accent`, `--ink`, `--ink-400`, `--surface-2` | ✅ Resolved — phantom refs removed (no defs **and** no uses remain) | `69506c8` |
| 2 | TodayHero breakpoint collapses 430–560px | ✅ Resolved — media query now `@media (max-width: 519px)` | `63e96d7` (`src/index.css:1407`) |
| 3 | Hardcoded hex in `.today-hero` block | ✅ Resolved — hero palette tokenized + type scale declared | `6e4875f` |
| — | "Config" tab label = jargon | ✅ Resolved — renamed to "Ajustes" | `e707411` (`src/ui/App.tsx:345`) |
| — | Duplicate progressbar ARIA | ✅ Resolved — aria differentiated | `69506c8` |

**Still open (minor, backlog):** "Salvar" → "Salvar configuração" label; TutorCard showing 5+ buttons
at once; spacing not yet on a token scale; a few icon-only buttons. None block beta.

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | Copy is mostly purposeful and Portuguese-first; "Salvar" button and one bare "Config" tab label are the main offenders |
| 2. Visuals | 2/4 | Hero action-first structure is correct but the TodayHero portrait uses a hardcoded 112x131px column that collapses badly in the 430–560px band; 5 hardcoded hex colors in that component's CSS |
| 3. Color | 2/4 | Dark theme is forced via `@media all` but 8 hardcoded hex values exist in the hero block alone; undefined tokens `--accent`, `--ink-400`, `--surface-2`, `--ink` are silently swallowed |
| 4. Typography | 2/4 | 35+ distinct font-size values (from 0.68rem to 2.1rem) with no declared scale; 10 distinct font-weight integers used (450, 500, 640, 650, 680, 700, 720, 750, 760, 780) — no type ramp |
| 5. Spacing | 3/4 | Token-free but internally consistent px values; the only real smell is a mix of raw px (6px, 7px, 10px, 12px, 14px, 16px, 18px, 20px) without a declared scale |
| 6. Experience Design | 3/4 | Loading, error, and empty states all handled; destructive actions have confirmation; TDAH audience gets visible numbers; main gap is TodayHero duplicate progressbar ARIA and unresolved undefined CSS tokens that produce silent visual breakage |

**Overall: 15/24**

---

## Top 3 Priority Fixes

1. **Undefined CSS tokens `--accent`, `--ink`, `--ink-400`, `--surface-2` are silently ignored** — Affects `self-explanation-input` outline, `organizer-ceiling-note` border, and any component referencing `--ink`. In dark mode these elements render with no border/color at all. Concrete fix: add `--accent: var(--green-700)` and `--ink: var(--ink-900)` and `--ink-400: var(--green-600)` and `--surface-2: rgba(31, 63, 54, 0.05)` to the `:root` block in `src/index.css` lines 9–73.

2. **TodayHero grid breaks between 430–560px** — The `.today-hero-body` is a `grid-template-columns: 112px 1fr` that switches to single-column only at `≤430px`, but the panel is `min(100%, 560px)`. Between 431px and 560px the portrait column still forces a two-column layout where text gets ~200px — too narrow for the 1.4rem title, causing 2-word line breaks. Concrete fix: in `src/index.css` change the media query at line 1377 from `@media (max-width: 430px)` to `@media (max-width: 519px)` and test at 430–520px.

3. **5 hardcoded hex colors in `.today-hero` block with no dark-mode variant** — `src/index.css` lines 1176 (`#3b5446`), 1178 (`#22322b`), 1194 (`#26352d`), 1291 (`#7fb594`), 1309 (`#aebfb2`), 1315 (`#c6d3c8`) are raw hex values not in the token system. If the forced dark `@media all` block ever changes, or if a user has inverted-colors accessibility setting, these fail silently. Concrete fix: promote these to tokens — `--hero-border: #3b5446`, `--hero-bg: #22322b`, `--hero-strip-bg: #26352d`, `--hero-eyebrow: #7fb594`, `--hero-meta: #aebfb2`, `--hero-note: #c6d3c8` — and override in the dark block alongside the other tokens.

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)

**What passes:** The app is consistently in Portuguese. CTAs are action-oriented and specific: "Treinar agora", "Montar meu plano de hoje", "Guardar para revisar amanhã", "Apagar definitivamente". Empty states are contextual ("Sem treinos. A primeira sessão ativa este painel." — `Progress.tsx:208`; "Sem plano para hoje. Posso montar um agora com base no seu perfil." — `Today.tsx:178`). Error messages are human-readable, not technical codes. Destructive confirmation prompts are specific ("Apagar todos os dados locais?" / "Restaurar substitui todos os dados atuais. Continuar?"). Timer feedback is quantitative ("Treinando há X min. Faltam Y min.").

**WARNING — Generic label on primary save button:** `Config.tsx:296` renders `<button type="submit">Salvar</button>` with no qualifying object. Given the context (profile form inside a Fold), the correct label is "Salvar configuração" to distinguish from "Exportar backup JSON" and "Ativar backup automático" on the same screen.

**WARNING — Navigation tab truncated to "Config":** `App.tsx:346` shows the settings tab as "Config". To a chess beginner this is jargon. "Ajustes" or "Configurações" is clearer. This is the secondary navigation pillar of the app.

**WARNING — English copy fragment in audio error comment:** `Today.tsx:746` has an English comment in production code: `// Audio can be blocked by the browser; the visible timer message still carries the warning.` While not user-visible, it breaks the Portuguese-only rule the codebase otherwise follows.

**MINOR — "Exportar backup JSON" exposes implementation detail:** `Config.tsx:403`. The word "JSON" is a technical format name invisible to the ADHD chess beginner. "Exportar backup" is sufficient.

**MINOR — "Registrar assim" on error-type selector is ambiguous:** `PlanBlockCard.tsx:321`. This link means "complete the block without selecting an error type" but reads as "save as-is". "Registrar sem selecionar" is more explicit.

---

### Pillar 2: Visuals (2/4)

**What passes:** The action-first hierarchy in `Today.tsx` is well-executed. `TodayHero` renders at the top with a single primary CTA ("Treinar agora") before any secondary content. The `day-stats` block with large serif numbers satisfies the "numbers visible" ADHD requirement. Folds reduce cognitive load on Config and Progress by hiding secondary content. The `PlanBlockCard` uses icon-per-line layout (Lightbulb, Target, Feather, HelpCircle, Flag) making tasks scannable without reading everything. Block carousel with 92% width slide "peek" correctly signals swipeable content.

**BLOCKER — Portrait collapse at 431–560px:** As described in Priority Fix #2. `.today-hero-body` is `grid-template-columns: 112px 1fr` with a `@media (max-width: 430px)` breakpoint in `src/index.css:1377`. The panel width is `min(100%, 560px)`. Any device from 431px to 559px viewport width renders the two-column layout where the text column is approximately `[panel width] - 112px - 16px gap - 2*20px padding`. At 480px that is roughly 312px, but the hero title (`today-hero-title` at `1.4rem`, font-family Fraunces) wraps aggressively. The observation at memory entry 13990 confirms this was known as a mobile layout issue.

**WARNING — Duplicate progress indicator in Today:** `Today.tsx:361-375` renders a `.day-progress` progressbar AND `TodayHero.tsx:90-105` renders `today-hero-progress-track` — both show block completion %. The hero progress bar is visually richer; the thin `.day-progress` bar immediately below it is redundant information with no added context. This creates two competing focal points for the same metric. Fix: remove the `.day-progress` / `DayProgressFill` section from `Today.tsx:359-375`; the hero already carries this.

**WARNING — "Trocar o foco de hoje" scrolls but doesn't announce destination:** `TodayHero.tsx:170` triggers `revealFocusCarousel()` (smooth scroll to `#foco-do-dia`) but provides no ARIA live region feedback. Screen reader and keyboard users get no indication that a scroll happened. Fix: add `aria-live="polite"` to the `#foco-do-dia` section, or dispatch a focus event to the section after scroll.

**WARNING — `.day-stats` and `.today-hero-chips` repeat data redundantly:** `Today.tsx:377-388` renders "X/Y blocos" and "Z min hoje" in `.day-stats`. `TodayHero.tsx:183-194` renders "A recuperar", "Checkpoint", and "Sessões restantes" in `.today-hero-chips`. While not identical, the user sees two compact stat-grids within a few pixels of each other, diluting the "single focal point" ADHD principle. The day-stats live under a progress bar that itself has the X/Y count in `aria-valuetext`. The hero chips cover different dimensions (review queue, milestone, remaining sessions) which is useful, but proximity to the stats grid creates visual noise.

**WARNING — Icon-only status in `block-carousel-arrow`:** `src/index.css:243-253` defines `.block-carousel-arrow` with no aria-label requirement enforced at CSS level. Checking `BlockCarousel` usage in `Today.tsx:433-461`, the carousel arrows likely exist in `src/ui/BlockCarousel.tsx` (not read in this audit). This needs verification that each arrow has `aria-label="Bloco anterior"` / `aria-label="Próximo bloco"`.

---

### Pillar 3: Color (2/4)

**Design token system:** The `:root` block defines ~40 tokens (ink, green, paper, gold, slate, state tokens, radii, shadows). The forced dark theme via `@media all { :root { ... } }` in `src/index.css:2737` correctly overrides all tokens for dark mode. The system is intentional and covers most cases.

**BLOCKER — 4 undefined tokens referenced in CSS:**
- `--accent` referenced at `src/index.css:2432` (`.self-explanation-input:focus-visible`) and `2438` (`.error-type-selector .secondary-button.active`) — token is never defined in `:root`. Falls back to `initial` (transparent/no border), meaning the active error-type button has no visible selection state.
- `--ink` referenced at `src/index.css:2423` (`.self-explanation-input` color) — undefined, falls back to `initial`. Input text color will be unset.
- `--ink-400` referenced at `src/index.css:1506` (`.organizer-ceiling-note` border) — undefined. The FM-ceiling note's left border renders with no color.
- `--surface-2` referenced at `src/index.css:1505` (`.organizer-ceiling-note` background) — undefined. Background falls to transparent.

**WARNING — 8 hardcoded hex values in hero block not in token system:**
- `src/index.css:1176`: `border: 1px solid #3b5446`
- `src/index.css:1178`: `background: #22322b`
- `src/index.css:1194`: `background: #26352d`
- `src/index.css:1195`: `color: #cdd9cf`
- `src/index.css:1291`: `color: #7fb594`
- `src/index.css:1300`: `color: #f4f1ea`
- `src/index.css:1309`: `color: #aebfb2`
- `src/index.css:1315`: `color: #c6d3c8; border-left: 3px solid #7fb594`

These are all dark-mode-only values baked into default (non-`@media all`) rules. They are correct for the forced dark theme but bypass the token system, making future theme changes or a11y overrides (e.g. Windows High Contrast, forced-colors) unreliable.

**WARNING — Additional hardcoded values outside hero:**
- `src/index.css:173`: `border: 3px solid #6b4f33` on `.tactic-diagram-svg` (walnut wood frame) — not tokenized.
- `src/index.css:2701`: `border: 1px solid #4a6b58` on `.secondary-button` — not tokenized. The value is close to `--green-600` in dark mode but is a one-off.
- `src/index.css:2715`: `border-color: #6fae8a` on `.secondary-button:hover` — not tokenized.

**MINOR — 60/30/10 color distribution:** Green is the dominant identity color (correct). Gold/amber is used for pending, backup warnings, day completion, and diploma states (correct accent). Slate is a third accent for milestone/session markers (a reasonable third color). The distribution approximately respects the hierarchy. No color is overused on decorative elements. This aspect passes.

---

### Pillar 4: Typography (2/4)

**Font families used:**
- `'Inter Variable'` (body, labels, buttons) — declared in `:root`
- `'Fraunces Variable'` via `--font-display` (panel h1/h2, fold titles, brand, hero title, day-stats numbers, fold-title, hero-now block h3, block-stamp) — declared in `:root`

Two families is within best-practice range.

**Font-size sprawl — BLOCKER:** The CSS contains 35+ distinct `font-size` values. Sampled unique values found:
`0.68rem, 0.7rem, 0.72rem, 0.74rem, 0.78rem, 0.8rem, 0.82rem, 0.84rem, 0.85rem, 0.85em (1 case), 0.86rem, 0.875rem, 0.9rem, 0.92rem, 0.94rem, 1rem, 1.04rem, 1.05rem, 1.08rem, 1.18rem, 1.28rem, 1.35rem, 1.4rem, 1.5rem, 1.9rem, 2rem, 2.1rem`

That is 27 distinct raw values at minimum, with no declared type-scale variable system. Abstract best practice flags >4 sizes as a warning and >6 as a problem. This is more than 4x the warning threshold. The perceptual difference between `0.82rem` and `0.84rem` is sub-pixel and unintentional drift.

**Font-weight sprawl:** Unique values found in the CSS: `450, 500, 640, 650, 680, 700, 720, 750, 760, 780`. That is 10 distinct weights. Variable fonts support granular weights, but using 10 distinct values with no declared weight scale means these are ad-hoc decisions that don't communicate meaning. The difference between `font-weight: 650` and `font-weight: 680` is imperceptible. Best practice for a content product: define 3 weights max (normal/body, medium/label, bold/title).

**Concrete fixes:**
- Define CSS custom properties `--text-xs`, `--text-sm`, `--text-base`, `--text-lg`, `--text-xl`, `--text-2xl`, `--text-display` in `:root`, map to a sensible scale (e.g. 0.75 / 0.875 / 1 / 1.125 / 1.25 / 1.5 / 2rem), and replace the 27 raw values.
- Reduce font-weight palette to `--weight-body: 450`, `--weight-label: 650`, `--weight-bold: 720` and apply consistently.
- The one `font-size: 0.85em` at line 2406 is a unit mismatch (em vs rem) — change to `0.85rem` to avoid compounding with parent em context.

---

### Pillar 5: Spacing (3/4)

**Approach:** No spacing token scale exists (no `--space-*` properties). All spacing is written as raw px values directly on selectors. This is a deliberate trade-off: no pre-processor, no utility classes. The values are consistent within component families — `14px` for fold `margin-bottom`, `16px` for card padding horizontally, `18px` for card padding on large, `12px` for gaps between sections, `8px` for inline gaps.

**WARNING — No declared spacing scale:** Without a token scale, spacing decisions are made per-selector. The CSS has 189 raw px spacing declarations. This works while the codebase is single-author but creates drift risk: `margin-bottom: 14px` on folds vs `margin-bottom: 12px` on some cards vs `margin-bottom: 16px` on mobile folds are micro-inconsistencies that would be prevented by a `--space-3`, `--space-4` token system.

**WARNING — Negative margin technique (`margin: -8px 0 12px`) without comment:** `src/index.css:1488` (`.support-base-note`), line 1495 (`.routing-why-note`) use `margin: -8px 0 12px` to pull content closer to the element above. This is a fragile coupling — if the sibling element's margin changes, the visual result breaks. Fix: use `gap` on the parent grid instead of negative margins; the `.today-main` parent is already a grid.

**MINOR — Arbitrary values in hero:** `src/index.css:1261-1266` (`.today-hero-body` padding `16px`, gap `16px`) and `src/index.css:1384-1390` (mobile override to `14px`) create a parallel set of arbitrary values for a single component that don't match the broader 18px/20px panel padding rhythm.

**MINOR — `.app-shell` bottom padding is 48px desktop / 40px mobile:** Lines 141 and 3198. The 8px difference is not enough to feel intentional for safe-area clearance. If this is for safe-area-inset-bottom, it should use `calc(40px + env(safe-area-inset-bottom, 0px))` as the PWA already does on `.reload-prompt`.

**What passes:** The `.fold margin-bottom: 14px` rhythm is consistent. `gap: 8px` / `gap: 10px` for flex lists and button rows is consistent. Card padding (16px/18px) is consistent across `plan-block`, `tutor-card`, `learning-plan-card`, `pending-review-card`, `session-milestones-card`. `.button-row gap: 10px` is consistent. These are good signals of intentional spacing despite the lack of tokens.

---

### Pillar 6: Experience Design (3/4)

**State coverage — what passes:**

- **Loading state:** `App.tsx:193-212` renders a dedicated loading panel with pulsing illustration and "O professor está arrumando o tabuleiro." Lazy-loaded Config/Progress use `<Suspense fallback={<ViewFallback />}>` with "Carregando…" on a `aria-live="polite"` panel (`App.tsx:56-70`).
- **Error state:** `App.tsx:349-364` renders `.app-error` with `role="alert"` and a "Recarregar" button for load errors. `Config.tsx:143` uses `toast.error()` for restore failures. Error messages use `toast.error()` throughout.
- **Empty states:** `Today.tsx:166-193` shows an illustrated panel with a specific action button when `plan === undefined`. `Progress.tsx:198-210` shows illustrated empty for no training data. These are contextual and action-oriented, not generic "no data".
- **Disabled states:** Buttons are disabled during async ops (`disabled={isCreatingPlan}`, `disabled={isReconciling}`, `disabled={lichessConnectionState === 'syncing'}`). Opacity 0.55 applied via CSS to `button:disabled`.
- **Destructive action confirmation:** "Apagar tudo" uses a two-step confirm (`confirmingClear` state, `Config.tsx:457-485`). Backup restore uses the same pattern (`Config.tsx:406-421`). Skip block uses `isConfirmingSkip` with focus management to the safe "Voltar" button (`PlanBlockCard.tsx:67-75`).
- **TDAH-friendly specifics:** Timer beep respects `prefers-reduced-motion` (`Today.tsx:721-723`). Numbers are large and visible (day-stats 2.1rem serif). Progress is always visible at hero top. Streak only shows at ≥2 days (no "shame of zero").

**WARNING — Duplicate ARIA progressbar on Today screen:**
`TodayHero.tsx:93-105` renders a `role="progressbar"` with `aria-label="Progresso do dia"`. `Today.tsx:361-375` renders a second `role="progressbar"` with the same `aria-label="Progresso do dia"` and the same `aria-valuenow={doneBlockCount}`. This creates duplicate ARIA landmarks that screen readers will announce twice. Fix: remove the `<div className="day-progress" role="progressbar">` from `Today.tsx:359-375` (the hero progressbar is superior — larger, more visible, already aria-labelled).

**WARNING — TutorCard appears even when `suppressPreSessionMessage` but post-session is empty-ish:**
When `lastDone === undefined` and `suppressPreSessionMessage === true`, `TutorCard` returns null (`TutorCard.tsx:93-95`). But when `lastDone` exists, the full post-session card renders even if `diagnosis.kind` is not `'cause'` and `TutorAnswerButtons` prompts "Tempo / Cálculo / Peça solta" — three secondary buttons that compete visually with the primary "Treinar agora" in the hero. The ADHD user now has 5+ action buttons visible (Treinar agora, Trocar o foco de hoje, Conferir puzzles, Tempo, Cálculo, Peça solta). Fix: show TutorCard answer buttons only after all blocks are done or in a Fold.

**WARNING — `PlanBlockCard` inside `BlockCarousel`: scroll-snapping is not implemented:** The carousel uses Embla (`BlockCarousel.tsx` not read but referenced). The `.block-carousel-slide` flex item at `flex: 0 0 92%` creates the peek effect but this relies entirely on Embla's drag/scroll. If Embla fails to load or has a JS error, the carousel degrades to a horizontal scroll without any touch affordance being visible to the user. No CSS `scroll-snap-type` fallback is present in `index.css`. This is a progressive enhancement gap.

**WARNING — Backup reminder shown on first day before any training even when `hasData = false`:** `Today.tsx:648-651` returns `'Backup local: ainda não há export JSON registrado para este aparelho.'` when `meta === undefined && hasData === true`. The guard `hasData` is based on `allTrainingLogs.length > 0`. A new user who approved the plan but has not started any block will have `allTrainingLogs.length === 0` so `hasData = false` and no reminder — this is correct. However if the user logs even one block, the "still no backup" message appears permanently until an export is done. For an ADHD user on day 1, this is distracting noise. Fix: suppress backup reminder until at least 7 days of data exist (use the same daysSinceBackup threshold for both branches).

**MINOR — No optimistic UI on "Montar meu plano de hoje":** `Today.tsx:179-192`. The button says "Montando seu plano…" during the async call, which is correct. But there is no skeleton or placeholder for what will appear. After the call completes, the full Today panel with hero, stats, carousel, and folds all flash in at once. A skeleton with 2-3 placeholder cards would reduce the perceived latency. Low priority but relevant for ADHD (jarring transitions).

---

## Additional Findings (beyond Top 3)

### Copywriting
- `App.tsx:358-363`: The generic `appState.errorMessage` is displayed verbatim in `.app-error`. If the error is a JS exception message it will be in English or developer-speak. Consider wrapping with a friendlier fallback: "Algo saiu do esperado. Recarregue e tente de novo." with the raw message in a `<details>`.

### Visuals
- `Today.tsx:301-313`: The `.section-heading` contains only the `<h1>Hoje</h1>` and date/session count. On mobile (`≤560px`) `src/index.css:3297-3299` sets `.section-heading { flex-direction: column }` which stacks them vertically. The h1 then precedes the date line naturally. This is fine.
- `Progress.tsx:133-139`: Progress screen h1 is "Progresso" with subtitle "Dados reais: o que você já sabe, onde melhora, onde ainda trava." The subtitle is good copy. The `section-heading` wrapper mirrors Today's pattern — consistent.

### Color
- `src/index.css:1506` references `--ink-400` which does not exist. The closest defined token is `--ink-500: #5a6877` (light) and `--ink-600: #46515e` (dark). This is a typo for `--green-600` given context (`.organizer-ceiling-note` border should be green).

### Typography
- The `.block-carousel-status` font-size is `0.82rem` at line 194. `.block-carousel-dot` font-size is `0.8rem` at line 272. These are separate element classes but visually adjacent elements with imperceptibly different sizes — a cleanup candidate.
- `src/index.css:3335` (`.day-stats strong`) sets `font-size: 2.1rem` in the polish section, overriding the `1.35rem` at line 1435. The override works but the double declaration is confusing — the original should be removed.

### Spacing
- `src/index.css:3153` (`.learning-plan-chips`): `margin-top: 6px` is a one-off. The siblings above it in `.learning-plan-card` use `gap: 12px`. Remove `margin-top` and rely on the parent's `gap`.

### Experience Design
- `Config.tsx:552`: `<p className="config-version">versão {__APP_VERSION__}</p>` — the version is displayed. The memory context notes `__APP_VERSION__` is injected by Vite DefinePlugin. Confirm the production build correctly substitutes this (not "0.0.0").

---

## Files Audited

**Primary (read in full):**
- `src/index.css` (3,589 lines)
- `src/ui/Today.tsx` (759 lines)
- `src/ui/Config.tsx` (589 lines)
- `src/ui/Progress.tsx` (465 lines)
- `src/ui/App.tsx` (459 lines)

**Secondary (read in full):**
- `src/ui/TodayHero.tsx` (199 lines)
- `src/ui/TutorCard.tsx` (213 lines)
- `src/ui/PlanBlockCard.tsx` (548 lines)
- `src/ui/Fold.tsx` (35 lines)
- `src/ui/Onboarding.tsx` (first 200 lines)

**Not read (out of scope or referenced but not listed):**
- `src/ui/BlockCarousel.tsx`
- `src/ui/PlacementCard.tsx`
- `src/ui/SyncPanel.tsx`
- `src/ui/PendingReviewCard.tsx`
- `src/ui/SessionMilestonesCard.tsx`
- `src/ui/CurriculumCard.tsx`
- `src/ui/BeginnerOrientation.tsx`
- `src/ui/Welcome.tsx`
- `src/ui/LearningPlanProposalCard.tsx`

**Registry audit:** No `components.json` found — shadcn not initialized. Registry audit skipped.
