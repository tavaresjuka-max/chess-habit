import type { PlanBlockFeedback, WeaknessTag } from '../types';

export type MethodTrackId =
  | 'pending-review'
  | 'calculation-bridge'
  | 'active-defense'
  | 'opening-as-plan'
  | 'progress-diplomas';

export type MethodTrackStatus = 'active' | 'review' | 'paused' | 'completed';

export type MethodTrack = {
  id: MethodTrackId;
  title: string;
  priority: number;
  status: MethodTrackStatus;
  focusWeaknessTags: WeaknessTag[];
  startedAt: string;
  updatedAt: string;
};

export type PendingItemOrigin = 'puzzle' | 'game-review' | 'manual' | 'diploma';

export type PendingTrainingItem = {
  id: string;
  origin: PendingItemOrigin;
  title: string;
  weaknessTag: WeaknessTag;
  methodTrackId: MethodTrackId;
  lichessTheme?: string;
  lichessUrl?: string;
  sourceLogId?: string;
  prompt: string;
  dueAt: string;
  attempts: number;
  lastFeedback?: PlanBlockFeedback;
  // Ciclos consecutivos em que a graduação ficou bloqueada pela acurácia no teto de
  // espaçamento. Válvula de escape: após GRADUATION_GATE_ESCAPE_CYCLES, forma assim
  // mesmo (o tema segue rastreado como fraqueza). Persistido no item.
  gateBlockedCount?: number;
  // SR adaptativo (SM-2, council 2026-06-24): fator de facilidade por item. Intervalo
  // = SPACING_DAYS[attempts] × (easeFactor / 2.5). Default 2.5 = comportamento da
  // escada fixa (retrocompatível); sobe com 'easy'/'good', desce com 'hard'. Clamp [1.3, 2.8].
  easeFactor?: number;
  // Gate de retenção (council 2026-06-24): ao atingir o teto, o item NÃO gradua direto —
  // faz um resgate CEGO de longo prazo (RETENTION_GATE_DAYS) antes de virar 'done'.
  // Mede retenção real, não acerto recente. true = aguardando esse resgate.
  retentionPending?: boolean;
  // Gate por resultado observado (council 2026-06-24): quando o solve-rate recente mostra que os
  // puzzles do tema ficaram difíceis demais (mismatch) e NÃO há Study curada, o conceito é ADIADO
  // com esta nota honesta em vez de repetir volume duro. Decisão do dono (UX TDAH).
  deferReason?: string;
  status: 'open' | 'done' | 'deferred';
  createdAt: string;
  updatedAt: string;
};

export type DiplomaId = 'peao' | 'torre' | 'rei';

export type DiplomaAttempt = {
  id: string;
  diplomaId: DiplomaId;
  sectionId: string;
  scorePercent: number;
  totalItems: number;
  passed: boolean;
  source: 'local' | 'lichess';
  createdAt: string;
  updatedAt: string;
};

export type DrillFormatId =
  | 'pendency-treatment'
  | 'thinking-system-soltis'
  | 'defense-checklist-crouch'
  | 'opening-principle-emms'
  | 'diagnostic-profile'
  | 'lpdo-scan'
  | 'damp-scan';
