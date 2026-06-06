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
  | { kind: 'manual'; tag: WeaknessTag; note?: string };

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
};

export type LearnerBand = '0-800' | '800-1200';

export type SessionMinutes = 5 | 15 | 30 | 60;

export type PlanResourceStage = 'explain' | 'guided' | 'retrieval' | 'transfer' | 'review';

export type PlanBlockFeedback = 'easy' | 'good' | 'hard';

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
  updatedAt: string;
};

export type DailyPlan = {
  date: string;
  sessionMinutes: number;
  weeklyFocus?: WeeklyFocus;
  blocks: PlanBlock[];
  generatedFromWeaknessesAt: string;
};

export type TrainingResult = {
  source: 'lichess';
  kind: 'puzzle-activity';
  fetchedAt: string;
  since: string;
  until: string;
  puzzles: number;
  wins: number;
  losses: number;
  themes: string[];
};

export type TrainingLogStatus = 'active' | 'done' | 'skipped';

export type TrainingLog = {
  id: string;
  date: string;
  blockId: string;
  blockTitle: string;
  source: SourceId;
  destinationLabel: string;
  plannedSeconds: number;
  startedAt: string;
  completedAt?: string;
  elapsedSeconds?: number;
  timeLimitReached: boolean;
  status: TrainingLogStatus;
  feedback?: PlanBlockFeedback;
  result?: TrainingResult;
  updatedAt: string;
};
