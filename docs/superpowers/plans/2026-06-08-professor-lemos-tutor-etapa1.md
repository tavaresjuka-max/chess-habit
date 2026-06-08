# Professor Lemos — Etapa 1 (Envelope de Sessão) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar o "envelope de sessão" do Professor Lemos — mensagem de abertura/retorno, fechamento ramificado por feedback, reconhecimento sóbrio de constância e diagnóstico travado por evidência — exibidos num card dedicado na tela "Hoje".

**Architecture:** Três funções puras no domínio (`computeConsistency`, `diagnose`, `buildSessionMessage`) sem rede nem React, mais um componente `TutorCard` que as consome. A camada de aplicação já expõe `trainingLogs`, `weaknesses` e `plan`; o card recebe tudo por props. Etapa 2 (diagnóstico por tema via `puzzle:read`) fica fora deste plano.

**Tech Stack:** TypeScript estrito, React 18, Vitest, @testing-library/react. Sem novas dependências.

**Spec:** `docs/superpowers/specs/2026-06-08-professor-lemos-tutor-design.md`

> Nota de refinamento sobre o spec: `Consistency.returnedAfterGap` é definido aqui como
> `daysSinceLastSession >= 2` (sinal pré-sessão de "voltando após ausência"), porque a mensagem de
> retorno é exibida ANTES do treino. Serve à intenção do spec (chamar de volta sem cobrança).

---

## File Structure

- `src/domain/types.ts` (modify) — novos tipos: `Consistency`, `CoachMessagePhase`, `CoachMessage`, `DiagnosisBasis`, `Diagnosis`, `PuzzleThemeStat`, `PuzzleThemeStats`.
- `src/domain/metrics/consistency.ts` (create) — `computeConsistency`.
- `src/domain/metrics/consistency.test.ts` (create).
- `src/domain/coach/diagnosis.ts` (create) — `diagnose`.
- `src/domain/coach/diagnosis.test.ts` (create).
- `src/domain/coach/sessionMessage.ts` (create) — `buildSessionMessage`, `SessionContext`.
- `src/domain/coach/sessionMessage.test.ts` (create).
- `src/domain/index.ts` (modify) — re-exportar os três módulos novos.
- `src/ui/TutorCard.tsx` (create) — card dedicado.
- `src/ui/TutorCard.test.tsx` (create).
- `src/ui/Today.tsx` (modify) — renderizar `TutorCard` após o cabeçalho da seção.

---

### Task 1: Tipos do domínio + `computeConsistency`

**Files:**
- Modify: `src/domain/types.ts` (append ao final)
- Create: `src/domain/metrics/consistency.ts`
- Test: `src/domain/metrics/consistency.test.ts`
- Modify: `src/domain/index.ts`

- [ ] **Step 1: Adicionar os tipos novos ao final de `src/domain/types.ts`**

```ts
export type Consistency = {
  currentStreakDays: number;
  longestStreakDays: number;
  daysSinceLastSession: number;
  returnedAfterGap: boolean;
};

export type CoachMessagePhase = 'welcome' | 'close' | 'return';

export type CoachMessage = {
  phase: CoachMessagePhase;
  lines: string[];
};

export type DiagnosisBasis = 'aggregate' | 'puzzle-theme';

export type Diagnosis =
  | {
      kind: 'cause';
      weaknessTag: WeaknessTag;
      basis: DiagnosisBasis;
      message: string;
      procedure: string;
    }
  | { kind: 'question'; message: string };

export type PuzzleThemeStat = { theme: string; attempts: number; losses: number };

export type PuzzleThemeStats = { since: string; until: string; themes: PuzzleThemeStat[] };
```

- [ ] **Step 2: Escrever o teste que falha** — `src/domain/metrics/consistency.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import type { TrainingLog } from '../types';
import { computeConsistency } from './consistency';

function doneLog(date: string, id: string): TrainingLog {
  return {
    id,
    date,
    blockId: `${date}-01-tema`,
    blockTitle: 'Tema do dia',
    source: 'lichess',
    destinationLabel: 'Lichess',
    plannedSeconds: 600,
    startedAt: `${date}T10:00:00.000Z`,
    completedAt: `${date}T10:08:00.000Z`,
    elapsedSeconds: 480,
    timeLimitReached: false,
    status: 'done',
    updatedAt: `${date}T10:08:00.000Z`,
  };
}

describe('computeConsistency', () => {
  it('returns zeros when there are no logs', () => {
    expect(computeConsistency([], '2026-06-08')).toEqual({
      currentStreakDays: 0,
      longestStreakDays: 0,
      daysSinceLastSession: 0,
      returnedAfterGap: false,
    });
  });

  it('counts a 3-day consecutive streak ending today', () => {
    const logs = [doneLog('2026-06-06', 'a'), doneLog('2026-06-07', 'b'), doneLog('2026-06-08', 'c')];
    const result = computeConsistency(logs, '2026-06-08');
    expect(result.currentStreakDays).toBe(3);
    expect(result.longestStreakDays).toBe(3);
    expect(result.daysSinceLastSession).toBe(0);
    expect(result.returnedAfterGap).toBe(false);
  });

  it('keeps the streak alive when the last session was yesterday', () => {
    const logs = [doneLog('2026-06-06', 'a'), doneLog('2026-06-07', 'b')];
    expect(computeConsistency(logs, '2026-06-08').currentStreakDays).toBe(2);
  });

  it('breaks the streak when a calendar day has no done log', () => {
    const logs = [doneLog('2026-06-06', 'a'), doneLog('2026-06-08', 'b')];
    const result = computeConsistency(logs, '2026-06-08');
    expect(result.currentStreakDays).toBe(1);
    expect(result.longestStreakDays).toBe(1);
  });

  it('counts two done logs on the same day as one', () => {
    const logs = [doneLog('2026-06-08', 'a'), doneLog('2026-06-08', 'b')];
    expect(computeConsistency(logs, '2026-06-08').currentStreakDays).toBe(1);
  });

  it('flags returnedAfterGap when away for 2+ days', () => {
    const logs = [doneLog('2026-06-04', 'a')];
    expect(computeConsistency(logs, '2026-06-08').returnedAfterGap).toBe(true);
  });

  it('ignores non-done logs', () => {
    const skipped: TrainingLog = { ...doneLog('2026-06-08', 'a'), status: 'skipped', completedAt: undefined };
    expect(computeConsistency([skipped], '2026-06-08').currentStreakDays).toBe(0);
  });
});
```

- [ ] **Step 3: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/domain/metrics/consistency.test.ts`
Expected: FAIL — `Failed to resolve import "./consistency"`.

- [ ] **Step 4: Implementar `src/domain/metrics/consistency.ts`**

```ts
import type { Consistency, TrainingLog } from '../types';

const MS_PER_DAY = 86_400_000;

function toUtcDayIndex(date: string): number {
  const [year, month, day] = date.split('-').map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / MS_PER_DAY);
}

export function computeConsistency(logs: TrainingLog[], today: string): Consistency {
  const doneDays = [...new Set(logs.filter((log) => log.status === 'done').map((log) => log.date))]
    .map(toUtcDayIndex)
    .sort((left, right) => left - right);

  if (doneDays.length === 0) {
    return {
      currentStreakDays: 0,
      longestStreakDays: 0,
      daysSinceLastSession: 0,
      returnedAfterGap: false,
    };
  }

  const todayIndex = toUtcDayIndex(today);
  const lastIndex = doneDays[doneDays.length - 1];
  const daysSinceLastSession = Math.max(0, todayIndex - lastIndex);

  let longestStreakDays = 1;
  let run = 1;
  for (let i = 1; i < doneDays.length; i += 1) {
    run = doneDays[i] - doneDays[i - 1] === 1 ? run + 1 : 1;
    longestStreakDays = Math.max(longestStreakDays, run);
  }

  let currentRun = 1;
  for (let i = doneDays.length - 1; i > 0; i -= 1) {
    if (doneDays[i] - doneDays[i - 1] !== 1) {
      break;
    }
    currentRun += 1;
  }

  const currentStreakDays = daysSinceLastSession <= 1 ? currentRun : 0;

  return {
    currentStreakDays,
    longestStreakDays,
    daysSinceLastSession,
    returnedAfterGap: daysSinceLastSession >= 2,
  };
}
```

- [ ] **Step 5: Re-exportar em `src/domain/index.ts`** — adicionar após a linha `export * from './coach/coachCatalog';`

```ts
export * from './metrics/consistency';
```

- [ ] **Step 6: Rodar testes**

Run: `npx vitest run src/domain/metrics/consistency.test.ts`
Expected: PASS (7 passing).

- [ ] **Step 7: Commit**

```bash
git add src/domain/types.ts src/domain/metrics/consistency.ts src/domain/metrics/consistency.test.ts src/domain/index.ts
git commit -m "feat(coach): computar constancia de treino a partir dos logs"
```

---

### Task 2: `diagnose` (diagnóstico travado por evidência)

**Files:**
- Create: `src/domain/coach/diagnosis.ts`
- Test: `src/domain/coach/diagnosis.test.ts`
- Modify: `src/domain/index.ts`

- [ ] **Step 1: Escrever o teste que falha** — `src/domain/coach/diagnosis.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import type { Weakness } from '../types';
import { diagnose } from './diagnosis';

describe('diagnose', () => {
  it('names the cause when the primary weakness has a clear signal', () => {
    const weaknesses: Weakness[] = [
      { tag: 'blunder-rate', score: 0.6, confidence: 'medium', evidence: 'erros graves recentes' },
    ];
    const result = diagnose(weaknesses);
    expect(result).toEqual({
      kind: 'cause',
      weaknessTag: 'blunder-rate',
      basis: 'aggregate',
      message: expect.stringContaining('peça'),
      procedure: expect.stringContaining('defensores'),
    });
  });

  it('asks a question when confidence is too low', () => {
    const weaknesses: Weakness[] = [
      { tag: 'blunder-rate', score: 0.6, confidence: 'low', evidence: 'sinal fraco' },
    ];
    expect(diagnose(weaknesses).kind).toBe('question');
  });

  it('asks a question when score is below the threshold', () => {
    const weaknesses: Weakness[] = [
      { tag: 'time-trouble', score: 0.3, confidence: 'high', evidence: 'pouco volume' },
    ];
    expect(diagnose(weaknesses).kind).toBe('question');
  });

  it('asks a question when there is no weakness at all', () => {
    expect(diagnose([])).toEqual({
      kind: 'question',
      message: expect.stringContaining('O que pesou'),
    });
  });

  it('asks a question when the tag has no mapped procedure', () => {
    const weaknesses: Weakness[] = [
      { tag: 'endgame-pawn', score: 0.9, confidence: 'high', evidence: 'tema fora do mapa agregado' },
    ];
    expect(diagnose(weaknesses).kind).toBe('question');
  });

  it('names the cause for a tactical tag that has a mapped procedure', () => {
    const weaknesses: Weakness[] = [
      { tag: 'discovered', score: 0.9, confidence: 'high', evidence: 'descobertas recentes' },
    ];
    const result = diagnose(weaknesses);
    expect(result.kind).toBe('cause');
    if (result.kind === 'cause') {
      expect(result.weaknessTag).toBe('discovered');
    }
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/domain/coach/diagnosis.test.ts`
Expected: FAIL — `Failed to resolve import "./diagnosis"`.

- [ ] **Step 3: Implementar `src/domain/coach/diagnosis.ts`**

```ts
import type { Confidence, Diagnosis, PuzzleThemeStats, Weakness, WeaknessTag } from '../types';

const confidenceRank: Record<Confidence, number> = { low: 0, medium: 1, high: 2 };
const MIN_SCORE = 0.5;

const causeByTag: Partial<Record<WeaknessTag, { message: string; procedure: string }>> = {
  'blunder-rate': {
    message: 'O padrão recente é deixar peça vulnerável antes da hora.',
    procedure: 'Antes do ataque, conte os defensores da peça que você quer mover.',
  },
  'time-trouble': {
    message: 'O relógio tem decidido partidas contra você.',
    procedure: 'Decida o plano em uma frase antes de calcular variantes.',
  },
  'opening-principles': {
    message: 'A abertura tem saído do trilho dos princípios.',
    procedure: 'Desenvolva as peças e proteja o rei antes de atacar.',
  },
  'hanging-piece': {
    message: 'Peça solta aparece antes de checar o tabuleiro inteiro.',
    procedure: 'Antes de mover, verifique o que está sem defensor dos dois lados.',
  },
  fork: {
    message: 'Garfos têm passado batido na sua visão.',
    procedure: 'Procure dois alvos do mesmo cavalo ou peão antes de calcular.',
  },
  pin: {
    message: 'Cravadas têm escapado do seu radar.',
    procedure: 'Antes de mover, veja se há peça presa contra o rei ou a dama.',
  },
  skewer: {
    message: 'Espetos têm sido difíceis de enxergar a tempo.',
    procedure: 'Cheque linhas onde a peça maior está na frente da menor.',
  },
  discovered: {
    message: 'Descobertas têm surpreendido você.',
    procedure: 'Antes de mover, veja qual peça atrás abre linha ao se mover.',
  },
  'back-rank': {
    message: 'A última fileira tem ficado frágil.',
    procedure: 'Confira escape do rei antes de afastar as torres.',
  },
};

const QUESTION_MESSAGE = 'O que pesou mais hoje: tempo, cálculo ou peça solta?';

export function diagnose(weaknesses: Weakness[], _puzzleThemeStats?: PuzzleThemeStats): Diagnosis {
  const primary = weaknesses[0];

  if (
    primary !== undefined &&
    confidenceRank[primary.confidence] >= confidenceRank.medium &&
    primary.score >= MIN_SCORE
  ) {
    const cause = causeByTag[primary.tag];
    if (cause !== undefined) {
      return {
        kind: 'cause',
        weaknessTag: primary.tag,
        basis: 'aggregate',
        message: cause.message,
        procedure: cause.procedure,
      };
    }
  }

  return { kind: 'question', message: QUESTION_MESSAGE };
}
```

- [ ] **Step 4: Re-exportar em `src/domain/index.ts`** — adicionar após `export * from './coach/coachCatalog';`

```ts
export * from './coach/diagnosis';
```

- [ ] **Step 5: Rodar testes e confirmar que passam**

Run: `npx vitest run src/domain/coach/diagnosis.test.ts`
Expected: PASS (6 passing).

- [ ] **Step 6: Commit**

```bash
git add src/domain/coach/diagnosis.ts src/domain/coach/diagnosis.test.ts src/domain/index.ts
git commit -m "feat(coach): diagnostico de erro travado por evidencia"
```

---

### Task 3: `buildSessionMessage` (abertura / retorno / fechamento)

**Files:**
- Create: `src/domain/coach/sessionMessage.ts`
- Test: `src/domain/coach/sessionMessage.test.ts`
- Modify: `src/domain/index.ts`

- [ ] **Step 1: Escrever o teste que falha** — `src/domain/coach/sessionMessage.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import type { Consistency, TrainingResult, Weakness } from '../types';
import { BANNED_PHRASES, buildSessionMessage } from './sessionMessage';

const baseConsistency: Consistency = {
  currentStreakDays: 0,
  longestStreakDays: 0,
  daysSinceLastSession: 0,
  returnedAfterGap: false,
};

const weakness: Weakness = {
  tag: 'fork',
  score: 0.9,
  confidence: 'high',
  evidence: 'Garfos apareceram com frequência nas partidas recentes.',
};

describe('buildSessionMessage', () => {
  it('opens with the reason of the day in welcome phase', () => {
    const message = buildSessionMessage({ phase: 'pre', primaryWeakness: weakness, consistency: baseConsistency });
    expect(message.phase).toBe('welcome');
    expect(message.lines).toContain(weakness.evidence);
  });

  it('adds a sober streak line from 2 days on', () => {
    const message = buildSessionMessage({
      phase: 'pre',
      primaryWeakness: weakness,
      consistency: { ...baseConsistency, currentStreakDays: 3 },
    });
    expect(message.lines.some((line) => line.includes('3 dias seguidos'))).toBe(true);
  });

  it('uses the return phase after an absence', () => {
    const message = buildSessionMessage({
      phase: 'pre',
      primaryWeakness: weakness,
      consistency: { ...baseConsistency, daysSinceLastSession: 4, returnedAfterGap: true },
    });
    expect(message.phase).toBe('return');
    expect(message.lines[0]).toContain('Sem cobrança');
  });

  it('branches the close message by feedback', () => {
    const hard = buildSessionMessage({ phase: 'post', consistency: baseConsistency, lastFeedback: 'hard' });
    const easy = buildSessionMessage({ phase: 'post', consistency: baseConsistency, lastFeedback: 'easy' });
    expect(hard.phase).toBe('close');
    expect(hard.lines.some((line) => line.includes('reduzir'))).toBe(true);
    expect(easy.lines.some((line) => line.includes('subir') || line.includes('dificuldade'))).toBe(true);
  });

  it('reports real puzzle numbers without inventing', () => {
    const result: TrainingResult = {
      source: 'lichess',
      kind: 'puzzle-activity',
      fetchedAt: '2026-06-08T10:00:00.000Z',
      since: '2026-06-08T00:00:00.000Z',
      until: '2026-06-08T10:00:00.000Z',
      puzzles: 5,
      wins: 4,
      losses: 1,
      themes: ['fork'],
    };
    const message = buildSessionMessage({ phase: 'post', consistency: baseConsistency, lastFeedback: 'good', puzzleResult: result });
    expect(message.lines.some((line) => line.includes('4') && line.includes('1'))).toBe(true);
  });

  it('never uses banned phrases', () => {
    const messages = [
      buildSessionMessage({ phase: 'pre', primaryWeakness: weakness, consistency: { ...baseConsistency, currentStreakDays: 5 } }),
      buildSessionMessage({ phase: 'pre', consistency: { ...baseConsistency, daysSinceLastSession: 3, returnedAfterGap: true } }),
      buildSessionMessage({ phase: 'post', consistency: baseConsistency, lastFeedback: 'hard' }),
    ];
    for (const message of messages) {
      for (const line of message.lines) {
        for (const banned of BANNED_PHRASES) {
          expect(line.toLowerCase()).not.toContain(banned);
        }
      }
    }
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/domain/coach/sessionMessage.test.ts`
Expected: FAIL — `Failed to resolve import "./sessionMessage"`.

- [ ] **Step 3: Implementar `src/domain/coach/sessionMessage.ts`**

```ts
import type { CoachMessage, Consistency, PlanBlockFeedback, TrainingResult, Weakness } from '../types';

export type SessionContext = {
  phase: 'pre' | 'post';
  consistency: Consistency;
  primaryWeakness?: Weakness;
  lastFeedback?: PlanBlockFeedback;
  puzzleResult?: TrainingResult;
};

// Lista da banlist do docs/pedagogy/professor-lemos.md, em minúsculas.
export const BANNED_PHRASES = [
  'você falhou',
  'sumiu',
  'gênio',
  'talento',
  'missão épica',
  'parabéns',
];

const MAINTENANCE_REASON = 'Hoje o treino é de manutenção: visão e segurança de peças.';

function reasonLine(weakness: Weakness | undefined): string {
  return weakness?.evidence ?? MAINTENANCE_REASON;
}

function streakLines(consistency: Consistency): string[] {
  if (consistency.currentStreakDays >= 2) {
    return [`${String(consistency.currentStreakDays)} dias seguidos. Isso já é rotina.`];
  }
  return [];
}

function buildWelcome(context: SessionContext): CoachMessage {
  return {
    phase: 'welcome',
    lines: [
      'Bom treino. Comece observando o tabuleiro inteiro antes do primeiro lance.',
      reasonLine(context.primaryWeakness),
      ...streakLines(context.consistency),
    ],
  };
}

function buildReturn(context: SessionContext): CoachMessage {
  return {
    phase: 'return',
    lines: ['Sem cobrança. O tabuleiro espera.', reasonLine(context.primaryWeakness)],
  };
}

const closeByFeedback: Record<PlanBlockFeedback, string> = {
  easy: 'Fácil hoje. Da próxima a gente sobe um pouco a dificuldade.',
  good: 'Bom treino. Vale consolidar o padrão com uma variação.',
  hard: 'Hoje pesou. Vamos reduzir a carga e voltar à explicação.',
};

function puzzleLines(result: TrainingResult | undefined): string[] {
  if (result === undefined) {
    return [];
  }
  return [`Nos puzzles: ${String(result.wins)} certos, ${String(result.losses)} errados.`];
}

function buildClose(context: SessionContext): CoachMessage {
  const base = context.lastFeedback === undefined ? 'Treino registrado.' : closeByFeedback[context.lastFeedback];
  return {
    phase: 'close',
    lines: [base, ...puzzleLines(context.puzzleResult)],
  };
}

export function buildSessionMessage(context: SessionContext): CoachMessage {
  if (context.phase === 'pre') {
    return context.consistency.returnedAfterGap ? buildReturn(context) : buildWelcome(context);
  }
  return buildClose(context);
}
```

- [ ] **Step 4: Re-exportar em `src/domain/index.ts`** — adicionar após `export * from './coach/diagnosis';`

```ts
export * from './coach/sessionMessage';
```

- [ ] **Step 5: Rodar testes e confirmar que passam**

Run: `npx vitest run src/domain/coach/sessionMessage.test.ts`
Expected: PASS (6 passing).

- [ ] **Step 6: Commit**

```bash
git add src/domain/coach/sessionMessage.ts src/domain/coach/sessionMessage.test.ts src/domain/index.ts
git commit -m "feat(coach): mensagens de abertura, retorno e fechamento da sessao"
```

---

### Task 4: `TutorCard` + integração no `Today`

**Files:**
- Create: `src/ui/TutorCard.tsx`
- Test: `src/ui/TutorCard.test.tsx`
- Modify: `src/ui/Today.tsx`

- [ ] **Step 1: Escrever o teste que falha** — `src/ui/TutorCard.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { DailyPlan, TrainingLog, Weakness } from '../domain';
import { TutorCard } from './TutorCard';

const plan: DailyPlan = {
  date: '2026-06-08',
  sessionMinutes: 15,
  blocks: [],
  generatedFromWeaknessesAt: '2026-06-08T09:00:00.000Z',
};

const weakness: Weakness = {
  tag: 'fork',
  score: 0.9,
  confidence: 'high',
  evidence: 'Garfos apareceram com frequência nas partidas recentes.',
};

function doneLog(): TrainingLog {
  return {
    id: 'log-1',
    date: '2026-06-08',
    blockId: '2026-06-08-01-tema',
    blockTitle: 'Tema do dia',
    source: 'lichess',
    destinationLabel: 'Lichess',
    plannedSeconds: 600,
    startedAt: '2026-06-08T10:00:00.000Z',
    completedAt: '2026-06-08T10:08:00.000Z',
    elapsedSeconds: 480,
    timeLimitReached: false,
    status: 'done',
    feedback: 'hard',
    updatedAt: '2026-06-08T10:08:00.000Z',
  };
}

describe('TutorCard', () => {
  it('shows the welcome reason before any training is done', () => {
    render(<TutorCard plan={plan} weaknesses={[weakness]} trainingLogs={[]} today="2026-06-08" />);
    expect(screen.getByText('Professor Lemos')).toBeInTheDocument();
    expect(screen.getByText(weakness.evidence)).toBeInTheDocument();
  });

  it('shows the close message and the diagnosis after a done log', () => {
    render(<TutorCard plan={plan} weaknesses={[weakness]} trainingLogs={[doneLog()]} today="2026-06-08" />);
    expect(screen.getByText(/reduzir a carga/)).toBeInTheDocument();
    expect(screen.getByText(/dois alvos/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/ui/TutorCard.test.tsx`
Expected: FAIL — `Failed to resolve import "./TutorCard"`.

- [ ] **Step 3: Implementar `src/ui/TutorCard.tsx`**

```tsx
import {
  buildSessionMessage,
  computeConsistency,
  diagnose,
  type DailyPlan,
  type TrainingLog,
  type Weakness,
} from '../domain';

type TutorCardProps = {
  plan: DailyPlan;
  weaknesses: Weakness[];
  trainingLogs: TrainingLog[];
  today: string;
};

export function TutorCard({ plan, weaknesses, trainingLogs, today }: TutorCardProps) {
  const consistency = computeConsistency(trainingLogs, today);
  const primaryWeakness = weaknesses[0];
  const doneToday = trainingLogs
    .filter((log) => log.date === today && log.status === 'done')
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  const lastDone = doneToday[0];

  if (lastDone === undefined) {
    const message = buildSessionMessage({ phase: 'pre', primaryWeakness, consistency });
    return (
      <section className="tutor-card" aria-label="Professor Lemos">
        <h2>Professor Lemos</h2>
        {message.lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </section>
    );
  }

  const message = buildSessionMessage({
    phase: 'post',
    consistency,
    primaryWeakness,
    lastFeedback: lastDone.feedback,
    puzzleResult: lastDone.result,
  });
  const diagnosis = diagnose(weaknesses);

  return (
    <section className="tutor-card" aria-label="Professor Lemos">
      <h2>Professor Lemos</h2>
      {message.lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
      {diagnosis.kind === 'cause' ? (
        <p className="tutor-diagnosis">
          {diagnosis.message} {diagnosis.procedure}
        </p>
      ) : (
        <p className="tutor-diagnosis">{diagnosis.message}</p>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Rodar testes e confirmar que passam**

Run: `npx vitest run src/ui/TutorCard.test.tsx`
Expected: PASS (2 passing). (O texto "dois alvos" vem do procedimento de `fork` em `diagnosis.ts`.)

- [ ] **Step 5: Integrar no `src/ui/Today.tsx`**

Adicionar `TutorCard` ao import no topo (após a linha 17 `import type { DiagnosisState, ... } from '../app/state';`):

```tsx
import { TutorCard } from './TutorCard';
```

Renderizar o card logo após o `</div>` que fecha o `section-heading` (atualmente linha 122), antes do bloco `{weaknesses.length > 0 ? (`:

```tsx
      </div>

      <TutorCard plan={plan} weaknesses={weaknesses} trainingLogs={trainingLogs} today={plan.date} />

      {weaknesses.length > 0 ? (
```

- [ ] **Step 6: Rodar a suíte completa, lint e build**

Run: `npm run test`
Expected: PASS — todos os testes anteriores (108) mais os novos verdes.

Run: `npm run lint`
Expected: sem erros.

Run: `npm run build`
Expected: build conclui sem erros de tipo.

- [ ] **Step 7: Commit**

```bash
git add src/ui/TutorCard.tsx src/ui/TutorCard.test.tsx src/ui/Today.tsx
git commit -m "feat(ui): card do Professor Lemos no Hoje"
```

---

## Notes

- Estilo do `.tutor-card`/`.tutor-diagnosis`: opcional nesta etapa. Se quiser polir, seguir o
  padrão de painel existente em `src/index.css` (mesma família de `.panel`/`.weakness-row`). Não é
  bloqueante para os testes nem para o build.
- Etapa 2 (diagnóstico por tema via `puzzle:read`) ganha plano próprio: deriva `PuzzleThemeStats`
  de `src/infra/lichess/puzzleActivity.ts` e habilita o ramo `puzzle-theme` de `diagnose` (hoje o
  parâmetro `_puzzleThemeStats` é ignorado de propósito).
- **Deferido desta etapa (item do spec §7):** quando `Diagnosis.kind === 'question'`, oferecer ao
  aluno registrar a resposta como sinal manual via `knownManualSignals`. Nesta etapa o card apenas
  exibe a pergunta. A interação de captura exige fiar um callback de escrita de sinal manual do
  `state.ts` até o `TutorCard`; fica para um plano de acompanhamento para não inflar este escopo.
