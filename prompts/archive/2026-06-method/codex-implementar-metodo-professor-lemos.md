# Prompt de Implementação — Método Professor Lemos no Lichess

Data de referência: 2026-06-10
Para: Codex
Projeto: `lichess-tutor` — PWA local-first, React + Vite + TypeScript + Dexie
Árbitro/Autor: Claude (Sonnet 4.6) com base em 4 relatórios de implementação comparados

---

## 0. LEIA ANTES DE COMEÇAR

Este prompt é **autossuficiente**. Não precisas abrir outros arquivos para entender o que fazer — os tipos, regras e decisões estão todos aqui. Os arquivos do repo existem para consulta técnica (ver seção 2), mas o **o quê** e o **porquê** estão neste documento.

Documentos de referência que podes ler mas NÃO precisas repetir:
- `plano-implementacao-metodo-lichess-IDEAL.md` — análise comparativa completa dos 4 planos
- `docs/pedagogy/metodo-consolidado-acervo-2026-06-09.md` — método pedagógico consolidado
- `memory/state.md` — histórico completo do que foi implementado

**Regra de ouro:** se algo não está explicitamente autorizado neste prompt, não faças. Pergunte antes de inventar.

---

## 1. VISÃO DO PROJETO

### O que é o lichess-tutor

Um curso completo de xadrez do 0 ao além do rating, usando o Lichess como plataforma de treino. O **Professor Lemos** é o tutor virtual — voz humana, PT-BR, sem condescendência, sem gamificação infantil. Ele diagnostica fraquezas, propõe o próximo passo e acompanha o progresso.

**Objetivo atual:** fazer o dono (TDAH, aprendiz 0→1200+) evoluir ao máximo sem perder motivação.

**Objetivo futuro:** o curso vira lições estruturadas, numeradas e compartilháveis gratuitamente com a comunidade.

### O usuário tem TDAH — isso muda o design

O TDAH afeta planejamento, memória de trabalho e regulação de motivação. O app precisa **externalizar essas funções**. Isso significa:

1. **Próxima ação SEMPRE visível e clara.** Nunca deixar o usuário pensar "o que faço agora?".
2. **Números que mostram evolução o tempo todo.** Streak de dias, tempo estudado hoje, puzzles resolvidos, pendências fechadas, % do checkpoint.
3. **Metas pequenas e frequentes.** 8 puzzles, 10 min, 1 bloco concluído — cada um é uma vitória real.
4. **Microcelebrações funcionais.** Não decorativas. Uma mensagem curta do Professor Lemos ao fechar um bloco difícil vale mais que uma animação.
5. **Sessões de 5 minutos são legítimas.** Nunca punir sessão curta. O app deve celebrar "5 min hoje é melhor que 0".
6. **Sem decisão fatigue.** O app propõe; o usuário confirma. Nunca apresentar 3+ opções sem recomendação clara.
7. **Revisões programadas visíveis.** "Você tem 2 pendências para hoje" é informação crítica, não decoração.
8. **Progresso nunca se perde.** Spaced repetition automático para que o que foi estudado volte no momento certo.

---

## 2. ESTADO ATUAL DO REPO

### O que já existe e NÃO deve ser tocado sem necessidade

```
src/domain/types.ts              — tipos base (WeaknessTag, PlanBlock, DailyPlan, etc.)
src/domain/plan/generatePlan.ts  — gerador de plano adaptativo
src/domain/plan/timeBudget.ts    — alocação de tempo 5/15/30/60 min
src/domain/plan/planSessions.ts  — sessões extras no mesmo dia
src/domain/plan/normalizePlan.ts — normaliza planos antigos
src/domain/sources/resourceCatalog.ts   — catálogo de recursos Lichess
src/domain/sources/destinations.ts     — deep links por fraqueza
src/domain/sources/resourceSelector.ts — seleção por stage/band/fraqueza
src/domain/sources/catalogSkills.ts    — sub-habilidades do catálogo
src/domain/weakness/detectWeaknesses.ts — detector de fraquezas
src/domain/coach/diagnosis.ts           — diagnóstico por tema
src/domain/coach/sessionMessage.ts      — mensagem de abertura/fechamento
src/domain/coach/learningPlanProposal.ts — proposta de fase
src/domain/coach/sessionMilestones.ts   — metas acumuladas
src/domain/coach/dayCompletionSummary.ts — resumo de fechamento
src/domain/metrics/consistency.ts       — streak e consistência
src/infra/storage/db.ts          — Dexie v3 (profile, plans, logs, signals, weaknesses, chesscomMonthSignals, lichessOAuthTokens, lichessStudies)
src/infra/storage/appData.ts     — funções de acesso ao Dexie
src/infra/lichess/study.ts       — createDailyStudy, buildBlockPgn
src/infra/lichess/puzzleActivity.ts  — GET /api/puzzle/activity
src/infra/lichess/puzzleDashboard.ts — GET /api/puzzle/dashboard, replay
src/infra/lichess/games.ts       — GET /api/games/user
src/infra/lichess/oauth.ts       — PKCE OAuth
src/app/trainingLogFlow.ts       — loop de reconciliação de logs
src/app/state.ts                 — estado global do app
src/app/externalOpen.ts          — abre Lichess preservando log
```

### Dexie v3 — tabelas existentes

```
profile      — id: 'default'
plans        — key: date
logs         — id, date, blockId
signals      — id, source, observedAt
weaknesses   — id, tag, confidence
chesscomMonthSignals — id, username
lichessOAuthTokens   — id: 'lichess'
lichessStudies       — id, date, studyId
```

### Tipos existentes relevantes (em `src/domain/types.ts`)

```ts
WeaknessTag = 'hanging-piece' | 'fork' | 'pin' | 'skewer' | 'discovered' |
              'mate-in-1' | 'mate-in-2' | 'back-rank' | 'opening-principles' |
              'time-trouble' | 'endgame-pawn' | 'endgame-rook' | 'conversion' | 'blunder-rate'

PlanBlock = { id, title, source, destination, weaknessTag?, resourceStage?,
              estimatedMinutes, task, stopRule, reason, coachNote,
              status: 'pending'|'done'|'skipped', feedback?, updatedAt }

DailyPlan = { date, sessionMinutes, weeklyFocus?, learningPlanResponse?, blocks[], generatedFromWeaknessesAt }

PlanBlockFeedback = 'easy' | 'good' | 'hard'
PlanResourceStage = 'explain' | 'guided' | 'retrieval' | 'transfer' | 'review'
LearnerBand = '0-800' | '800-1200'
SessionMinutes = 5 | 15 | 30 | 60
```

---

## 3. LIMPEZA E ORGANIZAÇÃO DO PROJETO

Antes de qualquer código novo, faça a limpeza. Esta é a primeira tarefa.

### 3.1 Arquivos a mover para `docs/research/`

Os seguintes arquivos estão na raiz do projeto e pertencem em `docs/`:

```
analise-acervo-CODEX.md                    → docs/research/analise-acervo-CODEX.md
analise-acervo-DEEPSEEK.md                 → docs/research/analise-acervo-DEEPSEEK.md
analise-acervo-GEMINI.md                   → docs/research/analise-acervo-GEMINI.md
analise-acervo-ONDA2-DEEPSEEK-AZW.md      → docs/research/analise-acervo-ONDA2-DEEPSEEK-AZW.md
analise-acervo-ONDA2-DEEPSEEK.md          → docs/research/analise-acervo-ONDA2-DEEPSEEK.md
analise-acervo-ONDA2-GEMINI.md            → docs/research/analise-acervo-ONDA2-GEMINI.md
analise-convertidos-DEEPSEEK.md           → docs/research/analise-convertidos-DEEPSEEK.md
analise-convertidos-GEMINI.md             → docs/research/analise-convertidos-GEMINI.md
analise-pdfs-baixados-onda3-CODEX.md      → docs/research/analise-pdfs-baixados-onda3-CODEX.md
analise-pdfs-baixados-onda3-DEEPSEEK.md   → docs/research/analise-pdfs-baixados-onda3-DEEPSEEK.md
analise-pdfs-baixados-onda3-DIRETOR.md    → docs/research/analise-pdfs-baixados-onda3-DIRETOR.md
analise-pdfs-baixados-onda3-GEMINI.md     → docs/research/analise-pdfs-baixados-onda3-GEMINI.md
plano-implementacao-metodo-lichess-CODEX.md    → docs/research/plano-implementacao-metodo-lichess-CODEX.md
plano-implementacao-metodo-lichess-DEEPSEEK.md → docs/research/plano-implementacao-metodo-lichess-DEEPSEEK.md
plano-implementacao-metodo-lichess-DIRETOR.md  → docs/research/plano-implementacao-metodo-lichess-DIRETOR.md
plano-implementacao-metodo-lichess-GEMINI.md   → docs/research/plano-implementacao-metodo-lichess-GEMINI.md
plano-implementacao-metodo-lichess-IDEAL.md    → docs/research/plano-implementacao-metodo-lichess-IDEAL.md
```

### 3.2 Arquivos a mover para `docs/pedagogy/`

```
(nenhum novo na raiz — pedagogy já existe em docs/pedagogy/)
```

### 3.3 Atualizar `memory/state.md`

Adicionar no início da seção "Próxima Etapa":

```
- Implementação do Método Professor Lemos (5 trilhas) iniciada em 2026-06-10:
  camada de domínio, pendências, Dexie v4, plano com trilha ativa, catálogo expandido,
  UI da tela Hoje, diplomas e Study enriquecido. Commits 1-9 descritos em
  `prompts/codex-implementar-metodo-professor-lemos.md`.
```

### 3.4 Atualizar `memory/progress.md`

Adicionar entrada da implementação do método (seção de tarefas abertas).

### 3.5 Commit de limpeza

```
chore: organize research docs and update memory
```

**Regra:** não modificar conteúdo dos arquivos ao mover — só mover. Se algum arquivo não existir na raiz, pular sem erro.

---

## 4. TIPOS NOVOS — Domínio do Método

### 4.1 Criar `src/domain/method/types.ts`

```ts
import type { WeaknessTag, PlanBlockFeedback } from '../types';

// === Trilhas do Método ===

export type MethodTrackId =
  | 'pending-review'       // Tratamento de Pendências
  | 'calculation-bridge'   // Cálculo Ponte 800-1200
  | 'active-defense'       // Defesa Ativa
  | 'opening-as-plan'      // Abertura Como Plano
  | 'progress-diplomas';   // Diplomas de Progresso

export type MethodTrackStatus = 'active' | 'review' | 'paused' | 'completed';

export type MethodTrack = {
  id: MethodTrackId;
  title: string;
  priority: number;       // 1 = maior prioridade
  status: MethodTrackStatus;
  focusWeaknessTags: WeaknessTag[];
  startedAt: string;      // ISO date string
  updatedAt: string;
};

// === Pendências ===

export type PendingItemOrigin = 'puzzle' | 'game-review' | 'manual' | 'diploma';

export type PendingTrainingItem = {
  id: string;
  origin: PendingItemOrigin;
  title: string;
  weaknessTag: WeaknessTag;
  methodTrackId: MethodTrackId;
  lichessTheme?: string;   // slug de /training/{theme}
  lichessUrl?: string;     // URL completa opcional
  sourceLogId?: string;    // log que gerou esta pendência
  prompt: string;          // pergunta-guia do Professor Lemos
  dueAt: string;           // ISO date — quando revisar
  attempts: number;
  lastFeedback?: PlanBlockFeedback;
  status: 'open' | 'done' | 'deferred';
  createdAt: string;
  updatedAt: string;
};

// === Diplomas ===

export type DiplomaId = 'peao' | 'torre' | 'rei';

export type DiplomaAttempt = {
  id: string;
  diplomaId: DiplomaId;
  sectionId: string;       // ex: 'coordenadas', 'mates-basicos', 'tatica-rotulada'
  scorePercent: number;    // 0-100
  totalItems: number;
  passed: boolean;
  source: 'local' | 'lichess';
  createdAt: string;
  updatedAt: string;
};

// === Formatos de Drill ===

export type DrillFormatId =
  | 'pendency-treatment'       // re-resolver erros reais
  | 'thinking-system-soltis'   // 5-passos: ameaça → candidatos → resposta adversária → posição final
  | 'defense-checklist-crouch' // 5 perguntas de defesa
  | 'opening-principle-emms'   // princípios antes do nome
  | 'diagnostic-profile'       // perfil multi-tema (diploma)
  | 'lpdo-scan'                // varredura anti-blunder (peça pendurada)
  | 'damp-scan';               // detecção tática: Defesa/Alinhamento/Mobilidade/Promoção
```

### 4.2 Estender `src/domain/types.ts`

Adicionar ao tipo `PlanBlock` os campos opcionais abaixo (sem remover nenhum campo existente):

```ts
export type PlanBlock = {
  // ... campos existentes mantidos integralmente ...

  // NOVOS — retrocompatíveis (opcionais)
  methodTrackId?: MethodTrackId;
  methodStepId?: string;
  pendingItemId?: string;
  masteryTarget?: 'advance' | 'review' | 'regress';
  drillFormatId?: DrillFormatId;
  guidingQuestion?: string;   // pergunta-guia para o Study PGN e para exibir na UI
};
```

Adicionar import no topo de `types.ts`:

```ts
import type { MethodTrackId, DrillFormatId } from './method/types';
```

**ATENÇÃO:** `PlanBlock` deve continuar compilando com os campos anteriores. Nada existente é removido. Campos novos são todos opcionais (`?:`).

---

## 5. CATÁLOGO DAS 5 TRILHAS

### 5.1 Criar `src/domain/method/methodTracks.ts`

Este arquivo define as 5 trilhas como constantes autorais. Não copiar texto de livros. Todo texto é original.

```ts
import type { MethodTrack } from './types';

export const METHOD_TRACKS: MethodTrack[] = [
  {
    id: 'pending-review',
    title: 'Tratamento de Pendências',
    priority: 1,
    status: 'active',
    focusWeaknessTags: ['hanging-piece', 'fork', 'discovered', 'pin', 'skewer'],
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'calculation-bridge',
    title: 'Cálculo Ponte 800-1200',
    priority: 2,
    status: 'active',
    focusWeaknessTags: ['fork', 'discovered', 'mate-in-2', 'conversion'],
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'active-defense',
    title: 'Defesa Ativa',
    priority: 3,
    status: 'active',
    focusWeaknessTags: ['hanging-piece', 'blunder-rate'],
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'opening-as-plan',
    title: 'Abertura Como Plano',
    priority: 4,
    status: 'active',
    focusWeaknessTags: ['opening-principles'],
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'progress-diplomas',
    title: 'Diplomas de Progresso',
    priority: 5,
    status: 'active',
    focusWeaknessTags: [],
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function getMethodTrack(id: string): MethodTrack | undefined {
  return METHOD_TRACKS.find(t => t.id === id);
}

export function getMethodTrackTitle(id: string): string {
  return getMethodTrack(id)?.title ?? id;
}
```

### 5.2 Criar `src/domain/method/mastery.ts`

Lógica pura de progressão. Sem efeitos colaterais.

```ts
export type MasteryInput = {
  accuracyPercent: number;         // 0-100, acertos recentes
  recentFeedbacks: ('easy' | 'good' | 'hard')[];  // últimas 3-5 sessões
  minVolumeReached: boolean;       // se há volume mínimo de tentativas (ex: >=5 puzzles)
};

export type MasteryResult = 'advance' | 'review' | 'regress';

export function computeMastery(input: MasteryInput): MasteryResult {
  const { accuracyPercent, recentFeedbacks, minVolumeReached } = input;

  // Hard recente impede avanço independente da accuracy
  const hasRecentHard = recentFeedbacks.slice(-2).includes('hard');

  if (!minVolumeReached) return 'review';

  if (accuracyPercent >= 80 && !hasRecentHard) return 'advance';
  if (accuracyPercent >= 50) return 'review';
  return 'regress';
}

export const DIPLOMA_THRESHOLDS: Record<string, number> = {
  peao: 90,
  torre: 80,
  rei: 75,   // média: 70-80 por seção, usamos 75 como default
};
```

### 5.3 Criar `src/domain/method/pendingItems.ts`

```ts
import type { PendingTrainingItem, MethodTrackId, PendingItemOrigin } from './types';
import type { WeaknessTag, PlanBlockFeedback, TrainingLog } from '../types';

// Agenda de revisão espaçada: 1, 3, 7, 14 dias
const SPACING_DAYS = [1, 3, 7, 14];

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function getNextDueDate(attempts: number): string {
  const days = SPACING_DAYS[Math.min(attempts, SPACING_DAYS.length - 1)];
  return addDays(new Date().toISOString(), days);
}

export function createPendingItemFromFeedback(
  log: TrainingLog,
  weaknessTag: WeaknessTag,
  methodTrackId: MethodTrackId,
  lichessTheme?: string,
): PendingTrainingItem {
  const now = new Date().toISOString();
  return {
    id: `pending-${log.id}-${Date.now()}`,
    origin: 'puzzle',
    title: `Revisar: ${log.blockTitle}`,
    weaknessTag,
    methodTrackId,
    lichessTheme,
    lichessUrl: lichessTheme ? `https://lichess.org/training/${lichessTheme}` : undefined,
    sourceLogId: log.id,
    prompt: buildGuidingPrompt(methodTrackId),
    dueAt: getNextDueDate(0),
    attempts: 0,
    lastFeedback: 'hard',
    status: 'open',
    createdAt: now,
    updatedAt: now,
  };
}

export function createPendingItemFromTheme(
  theme: string,
  lossCount: number,
  weaknessTag: WeaknessTag,
  methodTrackId: MethodTrackId,
): PendingTrainingItem {
  const now = new Date().toISOString();
  return {
    id: `pending-theme-${theme}-${Date.now()}`,
    origin: 'puzzle',
    title: `Revisar tema: ${theme} (${lossCount} erros)`,
    weaknessTag,
    methodTrackId,
    lichessTheme: theme,
    lichessUrl: `https://lichess.org/training/${theme}`,
    prompt: buildGuidingPrompt(methodTrackId),
    dueAt: getNextDueDate(0),
    attempts: 0,
    status: 'open',
    createdAt: now,
    updatedAt: now,
  };
}

export function advancePendingItem(item: PendingTrainingItem): PendingTrainingItem {
  const newAttempts = item.attempts + 1;
  const nextDue = getNextDueDate(newAttempts);
  return {
    ...item,
    attempts: newAttempts,
    dueAt: nextDue,
    status: newAttempts >= SPACING_DAYS.length ? 'done' : 'open',
    updatedAt: new Date().toISOString(),
  };
}

export function isDueToday(item: PendingTrainingItem): boolean {
  if (item.status !== 'open') return false;
  const today = new Date().toISOString().split('T')[0];
  return item.dueAt <= today;
}

function buildGuidingPrompt(trackId: MethodTrackId): string {
  const prompts: Record<MethodTrackId, string> = {
    'pending-review': 'Qual sinal do tabuleiro você ignorou quando jogou o lance errado?',
    'calculation-bridge': 'Quais são meus 2 candidatos e qual é a melhor resposta do adversário?',
    'active-defense': 'O que o oponente ameaça e como posso incomodá-lo ao defender?',
    'opening-as-plan': 'Essa jogada desenvolve peças e protege o rei, ou é só um movimento sem motivo?',
    'progress-diplomas': 'Você confia nas suas decisões neste tema? Sem pressa, sem chutar.',
  };
  return prompts[trackId];
}
```

### 5.4 Criar `src/domain/method/diplomas.ts`

```ts
import type { DiplomaId, DiplomaAttempt } from './types';
import { DIPLOMA_THRESHOLDS } from './mastery';

export type DiplomaSection = {
  id: string;
  title: string;
  description: string;
  lichessDestination: string;  // URL de treino para esta seção
};

export type DiplomaDefinition = {
  id: DiplomaId;
  title: string;
  band: string;
  description: string;
  threshold: number;
  sections: DiplomaSection[];
};

export const DIPLOMAS: DiplomaDefinition[] = [
  {
    id: 'peao',
    title: 'Diploma do Peão',
    band: '0-600',
    description: 'Fundamentos sólidos: regras, coordenadas, valor de peças e mates básicos.',
    threshold: DIPLOMA_THRESHOLDS.peao,
    sections: [
      {
        id: 'coordenadas',
        title: 'Coordenadas do Tabuleiro',
        description: 'Nomear casas rapidamente.',
        lichessDestination: 'https://lichess.org/training/coordinate',
      },
      {
        id: 'valor-pecas',
        title: 'Valor das Peças',
        description: 'Identificar trocas favoráveis e desfavoráveis.',
        lichessDestination: 'https://lichess.org/training/hangingPiece',
      },
      {
        id: 'mates-basicos',
        title: 'Mates Básicos',
        description: 'Mate com dama, mate com torre, mate do pastor.',
        lichessDestination: 'https://lichess.org/practice/checkmates',
      },
    ],
  },
  {
    id: 'torre',
    title: 'Diploma da Torre',
    band: '600-1000',
    description: 'Tática básica rotulada, segurança material e finais simples de peão.',
    threshold: DIPLOMA_THRESHOLDS.torre,
    sections: [
      {
        id: 'tatica-rotulada',
        title: 'Tática Rotulada',
        description: 'Garfo, cravada, espeto, ataque descoberto com tema visível.',
        lichessDestination: 'https://lichess.org/training/fork',
      },
      {
        id: 'seguranca-material',
        title: 'Segurança Material',
        description: 'Identificar peças penduradas antes de mover.',
        lichessDestination: 'https://lichess.org/training/hangingPiece',
      },
      {
        id: 'finais-peao',
        title: 'Finais de Peão',
        description: 'Regra do quadrado e oposição.',
        lichessDestination: 'https://lichess.org/practice/pawn-endgames',
      },
    ],
  },
  {
    id: 'rei',
    title: 'Diploma do Rei',
    band: '1000-1200',
    description: 'Cálculo curto, abertura por princípios e revisão de partida terminada.',
    threshold: DIPLOMA_THRESHOLDS.rei,
    sections: [
      {
        id: 'calculo-curto',
        title: 'Cálculo de 2-3 Lances',
        description: 'Listar candidatos e prever resposta adversária.',
        lichessDestination: 'https://lichess.org/training/mateIn2',
      },
      {
        id: 'abertura-principios',
        title: 'Princípios de Abertura',
        description: 'Centro, desenvolvimento e segurança do rei nos 10 primeiros lances.',
        lichessDestination: 'https://lichess.org/training/opening',
      },
      {
        id: 'finais-basicos',
        title: 'Finais Básicos',
        description: 'Rei e peão vs rei; torre vs peão.',
        lichessDestination: 'https://lichess.org/practice/rook-endgames',
      },
    ],
  },
];

export function getDiploma(id: DiplomaId): DiplomaDefinition | undefined {
  return DIPLOMAS.find(d => d.id === id);
}

export function isDiplomaPassed(attempts: DiplomaAttempt[], diplomaId: DiplomaId): boolean {
  const def = getDiploma(diplomaId);
  if (!def) return false;

  return def.sections.every(section => {
    const sectionAttempts = attempts.filter(
      a => a.diplomaId === diplomaId && a.sectionId === section.id
    );
    if (sectionAttempts.length === 0) return false;
    const latest = sectionAttempts.sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    )[0];
    return latest.scorePercent >= def.threshold;
  });
}

export function getDiplomaProgress(attempts: DiplomaAttempt[], diplomaId: DiplomaId) {
  const def = getDiploma(diplomaId);
  if (!def) return null;

  return {
    diploma: def,
    sections: def.sections.map(section => {
      const sectionAttempts = attempts.filter(
        a => a.diplomaId === diplomaId && a.sectionId === section.id
      );
      const latest = sectionAttempts.sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt)
      )[0];
      return {
        ...section,
        scorePercent: latest?.scorePercent ?? 0,
        passed: (latest?.scorePercent ?? 0) >= def.threshold,
        attempted: sectionAttempts.length > 0,
      };
    }),
    overallPassed: isDiplomaPassed(attempts, diplomaId),
  };
}
```

### 5.5 Criar `src/domain/method/selectMethodTrack.ts`

```ts
import type { MethodTrackId } from './types';
import type { WeaknessTag, PuzzleThemeStat } from '../types';
import { isDueToday } from './pendingItems';
import type { PendingTrainingItem } from './types';

export type TrackSelectionInput = {
  openPendingItems: PendingTrainingItem[];
  primaryWeakness?: WeaknessTag;
  weakThemes: string[];      // temas fracos do puzzle dashboard
  puzzleThemeStats?: PuzzleThemeStat[];
};

const CALCULATION_THEMES = ['fork', 'discoveredAttack', 'mateIn2', 'deflection', 'quietMove'];
const DEFENSE_THEMES = ['defensiveMove', 'hangingPiece', 'trappedPiece'];
const DEFENSE_WEAKNESS_TAGS: WeaknessTag[] = ['hanging-piece', 'blunder-rate'];
const CALCULATION_WEAKNESS_TAGS: WeaknessTag[] = ['fork', 'discovered', 'mate-in-2', 'conversion'];

export function selectMethodTrack(input: TrackSelectionInput): MethodTrackId {
  const { openPendingItems, primaryWeakness, weakThemes } = input;

  // Regra 1: pendência vencida tem prioridade máxima
  const hasDueItem = openPendingItems.some(isDueToday);
  if (hasDueItem) return 'pending-review';

  // Regra 2: temas fracos de defesa no dashboard
  const hasWeakDefenseTheme = weakThemes.some(t => DEFENSE_THEMES.includes(t));
  const hasDefenseWeakness = primaryWeakness && DEFENSE_WEAKNESS_TAGS.includes(primaryWeakness);
  if (hasWeakDefenseTheme || hasDefenseWeakness) return 'active-defense';

  // Regra 3: fraqueza dominante em cálculo tático
  const hasCalculationTheme = weakThemes.some(t => CALCULATION_THEMES.includes(t));
  const hasCalculationWeakness = primaryWeakness && CALCULATION_WEAKNESS_TAGS.includes(primaryWeakness);
  if (hasCalculationTheme || hasCalculationWeakness) return 'calculation-bridge';

  // Regra 4: abertura como plano (quando sinal de abertura presente)
  if (primaryWeakness === 'opening-principles') return 'opening-as-plan';

  // Default: cálculo ponte (maior ganho para faixa 800-1200)
  return 'calculation-bridge';
}
```

### 5.6 Criar `src/domain/method/index.ts`

```ts
export * from './types';
export * from './methodTracks';
export * from './mastery';
export * from './pendingItems';
export * from './diplomas';
export * from './selectMethodTrack';
```

---

## 6. PERSISTÊNCIA — DEXIE V4

### 6.1 Atualizar `src/infra/storage/db.ts`

Adicionar versão 4 ao constructor da `TutorDatabase`. **Não modificar versões 1-3.**

```ts
// Novos imports no topo:
import type { MethodTrack, PendingTrainingItem, DiplomaAttempt } from '../../domain/method/types';

// Novos tipos de record:
export type MethodTrackRecord = MethodTrack;
export type PendingItemRecord = PendingTrainingItem;
export type DiplomaAttemptRecord = DiplomaAttempt;

// Dentro da classe TutorDatabase, adicionar novas tabelas:
methodTracks!: Table<MethodTrackRecord, string>;
pendingItems!: Table<PendingItemRecord, string>;
diplomaAttempts!: Table<DiplomaAttemptRecord, string>;

// Dentro do constructor, depois de version(3):
this.version(4).stores({
  methodTracks:    'id, status, updatedAt',
  pendingItems:    'id, status, dueAt, methodTrackId, weaknessTag, updatedAt',
  diplomaAttempts: 'id, diplomaId, sectionId, createdAt, updatedAt',
});
```

### 6.2 Atualizar `src/infra/storage/appData.ts`

Adicionar as funções abaixo. Não remover nenhuma função existente.

```ts
// === Method Tracks ===

export async function loadMethodTracks(): Promise<MethodTrack[]> {
  return db.methodTracks.toArray();
}

export async function saveMethodTrack(track: MethodTrack): Promise<void> {
  await db.methodTracks.put(track);
}

// === Pending Items ===

export async function loadOpenPendingItems(): Promise<PendingTrainingItem[]> {
  return db.pendingItems.where('status').equals('open').toArray();
}

export async function savePendingItem(item: PendingTrainingItem): Promise<void> {
  await db.pendingItems.put(item);
}

export async function updatePendingItemStatus(
  id: string,
  status: PendingTrainingItem['status'],
): Promise<void> {
  await db.pendingItems.update(id, { status, updatedAt: new Date().toISOString() });
}

// === Diploma Attempts ===

export async function loadDiplomaAttempts(): Promise<DiplomaAttempt[]> {
  return db.diplomaAttempts.toArray();
}

export async function saveDiplomaAttempt(attempt: DiplomaAttempt): Promise<void> {
  await db.diplomaAttempts.put(attempt);
}
```

Atualizar `clearAll` para incluir as novas tabelas:

```ts
await db.methodTracks.clear();
await db.pendingItems.clear();
await db.diplomaAttempts.clear();
```

Atualizar `exportAllAsJson` para incluir as novas tabelas (mantendo exclusão de tokens OAuth):

```ts
const methodTracks = await db.methodTracks.toArray();
const pendingItems = await db.pendingItems.toArray();
const diplomaAttempts = await db.diplomaAttempts.toArray();
// incluir no objeto de export
```

---

## 7. GERADOR DE PLANO COM TRILHA ATIVA

### 7.1 Atualizar `src/domain/plan/generatePlan.ts`

O gerador existente deve ser **expandido**, não substituído. Adicionar:

#### a) Importações novas

```ts
import { selectMethodTrack } from '../method/selectMethodTrack';
import { isDueToday } from '../method/pendingItems';
import { getMethodTrackTitle } from '../method/methodTracks';
import type { MethodTrackId } from '../method/types';
import type { PendingTrainingItem } from '../method/types';
```

#### b) Novo parâmetro em `GeneratePlanInput`

```ts
export type GeneratePlanInput = {
  // ... campos existentes mantidos ...
  openPendingItems?: PendingTrainingItem[];   // NOVO
  weakThemesFromDashboard?: string[];         // NOVO — já pode existir, confirmar
};
```

#### c) Lógica de trilha ativa

No início da função `generatePlan`, antes de gerar blocos:

```ts
const activeTrack: MethodTrackId = selectMethodTrack({
  openPendingItems: input.openPendingItems ?? [],
  primaryWeakness: input.weaknesses?.[0]?.tag,
  weakThemes: input.weakThemesFromDashboard ?? [],
});

const duePendingItems = (input.openPendingItems ?? []).filter(isDueToday);
```

#### d) Injetar `methodTrackId` nos blocos gerados

Quando um bloco for criado, adicionar:

```ts
methodTrackId: activeTrack,
guidingQuestion: getGuidingQuestion(activeTrack),
```

Criar função pura `getGuidingQuestion(trackId: MethodTrackId): string` no mesmo arquivo:

```ts
function getGuidingQuestion(trackId: MethodTrackId): string {
  const questions: Record<MethodTrackId, string> = {
    'pending-review': 'Qual sinal do tabuleiro você ignorou?',
    'calculation-bridge': 'Quais são meus 2 candidatos?',
    'active-defense': 'O que o oponente ameaça?',
    'opening-as-plan': 'Essa jogada desenvolve peças e protege o rei?',
    'progress-diplomas': 'Você confia nessa decisão?',
  };
  return questions[trackId];
}
```

#### e) Prioridade de pendência vencida

Se há `duePendingItems.length > 0`, o primeiro bloco do plano deve ser o de pendência. Usar destino Lichess do item pendente.

#### f) reviewRatio adaptativo

```ts
const pendencyCount = duePendingItems.length;
const reviewRatio = pendencyCount > 0
  ? Math.min(0.70, 0.40 + pendencyCount * 0.05)
  : 0.30;
```

Usar `reviewRatio` para decidir proporção de blocos de revisão vs novo no plano.

---

## 8. CATÁLOGO LICHESS — SLUGS DE DEFESA E CÁLCULO

### 8.1 Atualizar `src/domain/sources/destinations.ts`

Verificar se os slugs abaixo já existem. **Adicionar apenas os que faltam**, usando `allowlist` — não fazer fetch de página:

```ts
// Slugs confirmados para Defesa Ativa
{ weaknessTag: 'hanging-piece', lichessTheme: 'hangingPiece',  url: 'https://lichess.org/training/hangingPiece' }
{ weaknessTag: 'blunder-rate',  lichessTheme: 'defensiveMove', url: 'https://lichess.org/training/defensiveMove' }

// Slugs para Cálculo Ponte
{ weaknessTag: 'fork',       lichessTheme: 'fork',            url: 'https://lichess.org/training/fork' }
{ weaknessTag: 'discovered', lichessTheme: 'discoveredAttack',url: 'https://lichess.org/training/discoveredAttack' }
{ weaknessTag: 'mate-in-2',  lichessTheme: 'mateIn2',         url: 'https://lichess.org/training/mateIn2' }
{ weaknessTag: 'conversion', lichessTheme: 'deflection',      url: 'https://lichess.org/training/deflection' }

// Adicional para ambos
// 'trappedPiece' e 'quietMove' — adicionar se não existirem
```

Formato do URL de treino: `https://lichess.org/training/{slugCamelCase}`.

---

## 9. UX — TELA HOJE

### 9.1 Princípios de Design TDAH para esta implementação

Todo elemento novo na tela Hoje deve seguir estas regras:

- **Um número sempre visível** sem precisar abrir nada: quantas pendências hoje, dias de streak, % do checkpoint.
- **Próxima ação clara**: se há pendência vencida, ela aparece como primeiro bloco com destaque visual (não apenas mais um bloco na lista).
- **Microcelebrações do Professor Lemos**: ao fechar bloco com feedback `hard`, uma linha como *"Esse foi difícil. Guardei para revisão amanhã."* Ao fechar bloco com `easy`, *"Está ficando mais fácil — sinal de progresso real."*
- **Trilha ativa sempre visível**: uma linha discreta acima dos blocos mostrando "Trilha: Cálculo Ponte 800-1200".
- **Pendências de hoje em destaque**: se há itens vencidos, mostrar um card pequeno antes dos blocos do plano com contagem e botão de ação.

### 9.2 Atualizar `src/ui/LearningPlanProposalCard.tsx`

Adicionar exibição da trilha ativa abaixo do título da fase:

```tsx
{activeTrackId && (
  <p className="text-xs text-muted-foreground mt-1">
    Trilha atual: {getMethodTrackTitle(activeTrackId)}
  </p>
)}
```

O `activeTrackId` deve vir das props. Atualizar a prop type e a chamada no `Today.tsx`.

### 9.3 Adicionar `src/ui/PendingReviewCard.tsx`

Novo componente que aparece na tela Hoje quando há pendências vencidas.

```tsx
type Props = {
  pendingItems: PendingTrainingItem[];
  onOpenItem: (item: PendingTrainingItem) => void;
  onDeferItem: (item: PendingTrainingItem) => void;
};
```

Layout:
```
┌─ Pendências de hoje (2) ──────────────────────┐
│ Professor Lemos: "Antes de conteúdo novo,      │
│ vamos fechar o que ficou em aberto."           │
│                                                │
│ • Revisar: Garfo (2 dias atrás)               │
│   [Abrir no Lichess] [Adiar]                   │
│                                                │
│ • Revisar tema: fork (3 erros)                │
│   [Abrir no Lichess] [Adiar]                   │
└────────────────────────────────────────────────┘
```

Exibir apenas itens com `isDueToday(item) === true`.

### 9.4 Atualizar `src/ui/SessionMilestonesCard.tsx`

Adicionar ao card de metas:
- Número de pendências abertas (total, não só hoje)
- Próximo diploma (qual diploma está sendo trabalhado e % de conclusão)

```tsx
{openPendingCount > 0 && (
  <span className="text-xs text-amber-600">
    {openPendingCount} pendência{openPendingCount > 1 ? 's' : ''} abertas
  </span>
)}

{nextDiploma && (
  <span className="text-xs text-muted-foreground">
    Próximo checkpoint: {nextDiploma.title}
  </span>
)}
```

### 9.5 Atualizar `src/app/trainingLogFlow.ts`

Quando um bloco recebe feedback `hard` ao ser concluído, **sugerir criação de pendência**:

```ts
// Após salvar o log com feedback 'hard':
export async function suggestPendingFromHardFeedback(
  log: TrainingLog,
  weaknessTag: WeaknessTag,
  methodTrackId: MethodTrackId,
  lichessTheme?: string,
): Promise<PendingTrainingItem> {
  const item = createPendingItemFromFeedback(log, weaknessTag, methodTrackId, lichessTheme);
  return item; // retorna para o caller decidir se salva
}
```

Na UI (`Today.tsx` ou no card de feedback), após feedback `hard`, mostrar botão discreto:
```
"Guardar como pendência para revisão amanhã"
```
Se o usuário clicar, salvar via `savePendingItem`. Se não clicar, não salvar — a criação é **sugerida, não automática**.

---

## 10. STUDY DO DIA ENRIQUECIDO

### 10.1 Atualizar `src/infra/lichess/study.ts`

A função `buildBlockPgn` (ou equivalente que gera o texto do capítulo) deve incluir:

```ts
// Adicionar nos comentários do PGN gerado:
{ Trilha: ${block.methodTrackId ? getMethodTrackTitle(block.methodTrackId) : 'Treino'} }
{ Pergunta: ${block.guidingQuestion ?? ''} }
{ Tarefa: ${block.task} }
{ Stop Rule: ${block.stopRule} }
{ Destino: ${block.destination.url ?? ''} }
```

**Regras:**
- Nenhum texto de livro nos comentários
- Nenhum FEN/PGN de fonte protegida
- Apenas conteúdo autoral
- Verificar que `buildBlockPgn` não produz mais de 64 capítulos por Study (manter verificação existente se já houver, adicionar se não houver)

---

## 11. TESTES OBRIGATÓRIOS

Criar os seguintes arquivos de teste com os casos descritos. Usar Vitest.

### `src/domain/method/methodTracks.test.ts`
```ts
// 1. Catálogo tem exatamente 5 trilhas
// 2. Cada trilha tem id, title e priority únicos
// 3. getMethodTrack('pending-review') retorna a trilha correta
// 4. getMethodTrackTitle('calculation-bridge') retorna string não vazia
```

### `src/domain/method/mastery.test.ts`
```ts
// 1. accuracy >= 80, sem hard recente, volume ok → 'advance'
// 2. accuracy 50-79 → 'review'
// 3. accuracy < 50 → 'regress'
// 4. accuracy >= 80, mas tem 'hard' nos últimos 2 feedbacks → 'review' (não advance)
// 5. sem volume mínimo → 'review' (não advance)
```

### `src/domain/method/pendingItems.test.ts`
```ts
// 1. createPendingItemFromFeedback → status 'open', dueAt = amanhã
// 2. isDueToday(item com dueAt = hoje) → true
// 3. isDueToday(item com dueAt = amanhã) → false
// 4. isDueToday(item com status 'done') → false
// 5. advancePendingItem 4 vezes → status 'done'
// 6. buildGuidingPrompt → retorna string não vazia para cada trilha
```

### `src/domain/method/selectMethodTrack.test.ts`
```ts
// 1. item vencido presente → 'pending-review'
// 2. tema fraco 'defensiveMove' no dashboard → 'active-defense'
// 3. fraqueza 'fork' dominante → 'calculation-bridge'
// 4. fraqueza 'opening-principles' → 'opening-as-plan'
// 5. sem sinal específico → 'calculation-bridge' (default)
```

### `src/domain/method/diplomas.test.ts`
```ts
// 1. DIPLOMAS tem 3 itens: peao, torre, rei
// 2. getDiploma('peao').threshold === 90
// 3. isDiplomaPassed sem attempts → false
// 4. isDiplomaPassed com todas seções >=threshold → true
// 5. getDiplomaProgress retorna seções com passed correto
```

### `src/infra/storage/appData.test.ts` (expandir existente)
```ts
// Adicionar:
// 1. Dexie v4 cria tabelas methodTracks, pendingItems, diplomaAttempts
// 2. savePendingItem + loadOpenPendingItems → retorna item salvo
// 3. updatePendingItemStatus 'done' → item some de loadOpenPendingItems
// 4. exportAllAsJson inclui methodTracks, pendingItems, diplomaAttempts
// 5. exportAllAsJson NÃO inclui lichessOAuthTokens
// 6. clearAll apaga as novas tabelas
```

### `src/domain/plan/generatePlan.test.ts` (expandir existente)
```ts
// Adicionar:
// 1. Pendência vencida → primeiro bloco é de pendência com methodTrackId 'pending-review'
// 2. Fraqueza 'fork' → activeTrack = 'calculation-bridge'
// 3. reviewRatio com 3 pendências = min(0.70, 0.40 + 3*0.05) = 0.55
// 4. Bloco gerado tem guidingQuestion não vazio
```

### `src/ui/PendingReviewCard.test.tsx`
```ts
// 1. Renderiza contagem de pendências
// 2. Exibe mensagem do Professor Lemos
// 3. Botão "Abrir no Lichess" chama onOpenItem
// 4. Botão "Adiar" chama onDeferItem
// 5. Não renderiza nada se pendingItems.length === 0
```

---

## 12. ESTRUTURA DE COMMITS

Execute nesta ordem exata. Cada commit deve passar em `npm run lint && npm run test && npm run build` antes de ser criado.

```
Commit 1:
chore: organize research docs and update memory state
  - Mover arquivos da raiz para docs/research/
  - Atualizar memory/state.md e memory/progress.md

Commit 2:
feat: add method domain types and tracks catalog
  - src/domain/method/types.ts (novo)
  - src/domain/method/methodTracks.ts (novo)
  - src/domain/method/mastery.ts (novo)
  - src/domain/method/index.ts (novo)
  - src/domain/method/methodTracks.test.ts (novo)
  - src/domain/method/mastery.test.ts (novo)
  - Estender PlanBlock em src/domain/types.ts com campos opcionais

Commit 3:
feat: add pending training items with spaced repetition
  - src/domain/method/pendingItems.ts (novo)
  - src/domain/method/selectMethodTrack.ts (novo)
  - src/domain/method/pendingItems.test.ts (novo)
  - src/domain/method/selectMethodTrack.test.ts (novo)

Commit 4:
feat: add diploma checkpoints
  - src/domain/method/diplomas.ts (novo)
  - src/domain/method/diplomas.test.ts (novo)

Commit 5:
feat: persist method state with Dexie v4
  - src/infra/storage/db.ts (versão 4 adicionada)
  - src/infra/storage/appData.ts (novas funções)
  - src/infra/storage/appData.test.ts (expandido)

Commit 6:
feat: expand daily plan generator with active track and pending priority
  - src/domain/plan/generatePlan.ts (expandido)
  - src/domain/plan/generatePlan.test.ts (expandido)

Commit 7:
feat: expand lichess catalog with defense and calculation slugs
  - src/domain/sources/destinations.ts (slugs adicionados)
  - src/domain/sources/destinations.test.ts (URLs verificadas)

Commit 8:
feat: show active track, pending review card and diploma progress in today
  - src/ui/PendingReviewCard.tsx (novo)
  - src/ui/PendingReviewCard.test.tsx (novo)
  - src/ui/LearningPlanProposalCard.tsx (trilha ativa)
  - src/ui/SessionMilestonesCard.tsx (pendências + diploma)
  - src/ui/Today.tsx (integração)
  - src/app/trainingLogFlow.ts (sugestão de pendência após 'hard')

Commit 9:
feat: enrich daily study chapters with track and guiding question
  - src/infra/lichess/study.ts (buildBlockPgn enriquecido)
  - src/infra/lichess/study.test.ts (verificações de conteúdo)
```

---

## 13. REGRAS DO PROJETO — NÃO VIOLAR

1. **Não criar tabuleiro próprio.** O app abre o Lichess. Nunca renderiza posição de xadrez, move peças ou sugere lances.

2. **Não substituir `PlanBlock` por outro tipo.** Campos opcionais retrocompatíveis somente.

3. **Não adicionar WeaknessTags psicológicas** (psychological-collapse, evaluation-error, etc.). Máximo: `defensive-move` se o catálogo precisar.

4. **Não criar 5 Studies permanentes por trilha agora.** Apenas melhorar o Study do dia existente.

5. **Não fazer hard gate em diplomas.** Soft gate: recomenda revisão, mostra lacunas, não bloqueia.

6. **Tokens OAuth fora de export/log/bundle.** Sempre.

7. **PGN completo nunca persiste.** Transiente em memória, descartado após import.

8. **Pendências automáticas = sugestão, não obrigação.** O usuário confirma cada pendência.

9. **Pendências agrupam por tema, não por puzzle individual.** Um tema com 5 erros = 1 pendência, não 5.

10. **Gates de qualidade obrigatórios** antes de cada commit:
    ```bash
    npm run lint
    npm run test
    npm run build
    ```

11. **Não baixar Lichess Puzzle DB agora.** Deep links + puzzle:read já são suficientes para o primeiro corte.

12. **Não fazer `gamebook`/`conceal` no Study.** Modo normal primeiro.

---

## 14. DECISÕES FECHADAS

| pergunta | decisão |
|---|---|
| Mais análise antes de codar? | Não. Consenso suficiente entre 4 IAs. |
| Trilha ativa: manual ou automática? | Automática via selectMethodTrack; override manual fica para depois. |
| Pendências: automáticas ou curadas? | Sugestão automática; usuário confirma cada uma. |
| Diplomas bloqueiam avanço? | Não. Soft gate com plano de revisão. |
| Studies por trilha agora? | Não. Study do dia melhorado primeiro. |
| Novo WeaknessTag? | Máximo defensive-move se necessário. Não mais. |
| gamebook/conceal no Study? | Não. Modo normal. |
| Puzzle DB local? | Não. Deep links + API. |
| Substituir PlanBlock? | Não. Campos opcionais. |
| trainingCatalog em Dexie? | Não. Constantes no bundle. |

---

## 15. CHECKLIST FINAL

Antes de declarar implementação concluída:

- [ ] `npm run lint` passou com zero erros
- [ ] `npm run test` passou com zero falhas
- [ ] `npm run build` gerou bundle sem erros
- [ ] Todos os 9 commits foram criados com mensagens corretas
- [ ] Arquivos de análise movidos da raiz para `docs/research/`
- [ ] `memory/state.md` atualizado com o histórico desta implementação
- [ ] `memory/progress.md` atualizado
- [ ] Nenhum texto de livro protegido no código
- [ ] Nenhum token OAuth em export/log
- [ ] PendingReviewCard aparece na tela Hoje quando há itens vencidos
- [ ] Trilha ativa visível no LearningPlanProposalCard
- [ ] Diplomas visíveis no SessionMilestonesCard
- [ ] Feedback 'hard' oferece botão "Guardar como pendência"
- [ ] Study do dia inclui trilha/pergunta/tarefa nos comentários do PGN
- [ ] Todos os testes novos têm pelo menos os casos listados na seção 11

---

*Documento gerado em 2026-06-10 por Claude (Sonnet 4.6). Base: análise comparativa de 4 planos de implementação (CODEX, DEEPSEEK, GEMINI, DIRETOR), estado atual do repo lichess-tutor (P0-P3 concluídas) e perfil TDAH do usuário. Próxima revisão: após 2 semanas de uso real — considerar studies permanentes por trilha e testes interativos mais sofisticados.*
