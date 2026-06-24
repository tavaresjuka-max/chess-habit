import type { DrillFormatId, MethodTrackId } from './method/types';

export type SourceId = 'lichess' | 'chesscom' | 'outro';

export type Destination = {
  source: SourceId;
  label: string;
  url?: string;
};

export type WeaknessTag =
  | 'hanging-piece'
  | 'fork'
  | 'pin'
  | 'skewer'
  | 'discovered'
  | 'mate-in-1'
  | 'mate-in-2'
  | 'back-rank'
  | 'opening-principles'
  | 'time-trouble'
  | 'endgame-pawn'
  | 'endgame-rook'
  | 'conversion'
  | 'blunder-rate';

export type Confidence = 'low' | 'medium' | 'high';

export type SignalValue =
  | { kind: 'rating'; perf: 'rapid' | 'blitz' | 'classical' | 'bullet'; rating: number }
  | { kind: 'opening'; eco: string; name: string; games: number; lossRate: number }
  | { kind: 'time-control'; speed: string; games: number; lossRate: number }
  | { kind: 'color'; color: 'white' | 'black'; games: number; lossRate: number }
  | {
      kind: 'judgment';
      blunders: number;
      mistakes: number;
      inaccuracies: number;
      acpl?: number;
      games: number;
    }
  | { kind: 'clock'; timeoutLosses: number; games: number }
  | { kind: 'accuracy'; lowAccuracyGames: number; games: number }
  | { kind: 'manual'; tag: WeaknessTag; note?: string }
  | { kind: 'puzzle-perf'; rating: number; games: number };

export type Signal = {
  source: SourceId;
  value: SignalValue;
  confidence: Confidence;
  observedAt: string;
};

export type Weakness = {
  tag: WeaknessTag;
  score: number;
  confidence: Confidence;
  evidence: string;
  /** Timestamp do dado-fonte; permite sobreviver ao GC de trainingLogs (1B). */
  observedAt?: string;
  /** Fraquezas de puzzle recebem 'puzzle' para permitir fallback durável. */
  source?: 'puzzle';
};

export type LearnerBand =
  | '0-400'
  | '400-800'
  | '800-1000'
  | '1000-1200'
  | '1200-1600'
  | '1600-2000'
  | '2000-2200';

export type SessionMinutes = 5 | 15 | 30 | 60;

export type PlanResourceStage = 'explain' | 'guided' | 'retrieval' | 'transfer' | 'review';

export type PlanBlockFeedback = 'easy' | 'good' | 'hard';

export type LearningPlanResponseStatus = 'approved' | 'revision-requested';

export type LearningPlanResponse = {
  status: LearningPlanResponseStatus;
  note?: string;
  updatedAt: string;
};

export type LearningPlanProposal = {
  heading: string;
  intro: string;
  phaseTitle: string;
  methodSummary: string;
  evidenceLevel: string;
  methodSteps: string[];
  focusItems: string[];
  progressCriteria: string[];
  estimate: string;
  checkpoint: string;
  caveat: string;
  reviewPrompt: string;
  // Números expostos para a UI destacar (sem parsear texto).
  estimateHours: number;
  estimateSessions: number;
  estimateMinutes: number;
  estimateWeeks: number;
  checkpointHours: number;
  checkpointSessions: number;
};

export type LichessOAuthScope = 'puzzle:read' | 'study:write';

export type LichessOAuthToken = {
  accessToken: string;
  tokenType: 'Bearer';
  scopes: LichessOAuthScope[];
  obtainedAt: string;
  expiresAt: string;
};

export type LichessStudyLink = {
  id: string;
  date: string;
  studyId: string;
  url: string;
  visibility: 'private' | 'unlisted';
  imported: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WeeklyFocus = {
  tag: WeaknessTag;
  title: string;
  reason: string;
  startsOn: string;
};

export type LearnerProfile = {
  lichessUsername?: string;
  chesscomUsername?: string;
  band: LearnerBand;
  defaultSessionMinutes: SessionMinutes;
  goals: string[];
  // Estágio (guided→retrieval→transfer) alcançado por tema, persistido para o
  // aluno intermitente (perfil TDAH) retomar de onde parou em vez de recomeçar
  // no 'guided' quando não há plano recente. Opcional e retrocompatível.
  themeStages?: Partial<Record<WeaknessTag, PlanResourceStage>>;
  // D3 (scheduler híbrido 2026-06-22): temas que já atingiram o critério de
  // graduação (stage=transfer + acurácia≥80% sobre ≥30 puzzles) e agora integram
  // o pool de revisão espaçada. Derivado de avaliação externa; não gerenciado aqui.
  graduatedThemes?: WeaknessTag[];
  // D4 (scheduler híbrido 2026-06-22): tema que era primário na última sessão criada.
  // Usado em conjunto com sessionsOnPrimaryTheme para detectar mudança de tema e
  // resetar o contador. Não gerenciado por generatePlan — atualizado em createNextSession.
  currentPrimaryTheme?: WeaknessTag;
  // D4 (scheduler híbrido 2026-06-22): número de sessões em que o tema atual foi
  // primário sem graduar. Reset ao graduar ou forçar rotação. Usado para aplicar
  // o teto anti-trava de 12 sessões.
  sessionsOnPrimaryTheme?: number;
  updatedAt: string;
};

export type PlanBlock = {
  id: string;
  sessionNumber?: number;
  title: string;
  source: SourceId;
  destination: Destination;
  weaknessTag?: WeaknessTag;
  resourceStage?: PlanResourceStage;
  estimatedMinutes: number;
  task: string;
  stopRule: string;
  reason: string;
  coachNote: string;
  status: 'pending' | 'done' | 'skipped';
  feedback?: PlanBlockFeedback;
  methodTrackId?: MethodTrackId;
  methodStepId?: string;
  pendingItemId?: string;
  masteryTarget?: 'advance' | 'review' | 'regress';
  drillFormatId?: DrillFormatId;
  guidingQuestion?: string;
  // D6 (scheduler híbrido 2026-06-22): bloco de transferência misto (âncora +
  // pool sem rótulo). Persiste o dado de discriminação agora; exibição no
  // Progresso vem depois. Derivável também pelo sufixo do blockId.
  isDiscrimination?: boolean;
  updatedAt: string;
};

export type DailyPlan = {
  date: string;
  sessionMinutes: number;
  weeklyFocus?: WeeklyFocus;
  learningPlanResponse?: LearningPlanResponse;
  blocks: PlanBlock[];
  generatedFromWeaknessesAt: string;
  // D4 (scheduler híbrido 2026-06-22): sinaliza que o tema primário atingiu o
  // teto de 12 sessões sem graduar e foi forçado a rotar neste plano.
  primaryThemeForced?: boolean;
  // R2b (council 2026-06-23): o aluno está num estágio avançado SEGURADO pelo
  // floor (feedback expirado) mas a acurácia real caiu de forma sustentada — risco
  // de "penhasco de incompetência". Flag de DETECÇÃO (não altera o plano nem o
  // estágio exibido); habilita uma oferta sóbria de "reforçar a base". Decoplado
  // da persistência: detecção é só-leitura, não toca profile.themeStages.
  chronicSupportSuggested?: boolean;
};

export type PuzzleActivityTrainingResult = {
  source: 'lichess';
  kind: 'puzzle-activity';
  fetchedAt: string;
  since: string;
  until: string;
  puzzles: number;
  wins: number;
  losses: number;
  themes: string[];
  themeStats?: PuzzleThemeStat[];
  // Tempo ATIVO estimado pelos timestamps do Lichess (a API não dá tempo por
  // puzzle). Honesto: ignora pausas longas. Métrica principal é `puzzles`.
  activeSeconds?: number;
};

export type PuzzleDashboardTrainingResult = {
  source: 'lichess';
  kind: 'puzzle-dashboard';
  fetchedAt: string;
  since: string;
  until: string;
  days: number;
  puzzles: number;
  wins: number;
  losses: number;
  themes: string[];
  themeStats: PuzzleThemeStat[];
  weakThemes: string[];
  strongThemes: string[];
  averageRating?: number;
  performance?: number;
  accuracy?: number;
};

export type PuzzleReplaySummaryTrainingResult = {
  source: 'lichess';
  kind: 'puzzle-replay-summary';
  fetchedAt: string;
  since: string;
  until: string;
  days: number;
  theme: string;
  nb: number;
  remainingCount: number;
  url: string;
  puzzles: number;
  wins: number;
  losses: number;
  themes: string[];
  themeStats: PuzzleThemeStat[];
};

export type TrainingResult =
  | PuzzleActivityTrainingResult
  | PuzzleDashboardTrainingResult
  | PuzzleReplaySummaryTrainingResult;

export type TrainingLogStatus = 'active' | 'done' | 'skipped';

export type TrainingLogKind = 'puzzle' | 'free-activity' | 'standard';

export type ErrorType = 'nao-vi' | 'errei-conta' | 'escolhi-errado';

export type TrainingLog = {
  id: string;
  date: string;
  blockId: string;
  blockTitle: string;
  source: SourceId;
  destinationLabel: string;
  logKind?: TrainingLogKind;
  plannedSeconds: number;
  startedAt: string;
  completedAt?: string;
  elapsedSeconds?: number;
  timeLimitReached: boolean;
  status: TrainingLogStatus;
  feedback?: PlanBlockFeedback;
  // Sinal pedagógico (Fase 1 — 2026-06-24): taxonomia de erro em 1 toque,
  // capturado SÓ quando feedback='hard'. Opcional — não indexado no Dexie,
  // sem migração de schema. NÃO bloqueia o fluxo.
  errorType?: ErrorType;
  // Autoexplicação de 1 frase ("Por que esse lance?"). Convite, nunca obrigatório.
  selfExplanation?: string;
  result?: TrainingResult;
  methodTrackId?: MethodTrackId;
  updatedAt: string;
};

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

export type PuzzleThemeStat = {
  theme: string;
  attempts: number;
  losses: number;
  averageRating?: number;
  performance?: number;
  accuracy?: number;
};

export type PuzzleThemeStats = { since: string; until: string; themes: PuzzleThemeStat[] };
