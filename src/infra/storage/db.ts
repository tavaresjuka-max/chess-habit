import Dexie, { type Table } from 'dexie';
import type { DailyPlan, LearnerProfile, Signal, Weakness } from '../../domain';
import type { ChesscomMonthCache } from '../chesscom/chesscomClient';

export const storageDatabaseName = 'lichess-tutor' as const;

export type ProfileRecord = LearnerProfile & {
  id: 'default';
};

export type PlanRecord = DailyPlan;

export type LearningLogRecord = {
  id: string;
  date: string;
  blockId: string;
  status: 'done' | 'skipped';
  updatedAt: string;
};

export type SignalRecord = Signal & {
  id: string;
};

export type WeaknessRecord = Weakness & {
  id: string;
};

export type ChesscomMonthSignalCacheRecord = ChesscomMonthCache;

export class TutorDatabase extends Dexie {
  profile!: Table<ProfileRecord, string>;
  plans!: Table<PlanRecord, string>;
  logs!: Table<LearningLogRecord, string>;
  signals!: Table<SignalRecord, string>;
  weaknesses!: Table<WeaknessRecord, string>;
  chesscomMonthSignals!: Table<ChesscomMonthSignalCacheRecord, string>;

  constructor(name = storageDatabaseName) {
    super(name);

    this.version(1).stores({
      profile: 'id, updatedAt',
      plans: 'date, generatedFromWeaknessesAt',
      logs: 'id, date, blockId, updatedAt',
      signals: 'id, source, observedAt',
      weaknesses: 'id, tag, confidence',
    });

    this.version(2).stores({
      chesscomMonthSignals: 'id, username, updatedAt, expiresAt',
    });
  }
}

export const db = new TutorDatabase();
