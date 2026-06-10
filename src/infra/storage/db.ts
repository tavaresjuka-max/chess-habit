import Dexie, { type Table } from 'dexie';
import type {
  DailyPlan,
  LearnerProfile,
  LichessOAuthToken,
  LichessStudyLink,
  Signal,
  TrainingLog,
  Weakness,
} from '../../domain';
import type { DiplomaAttempt, MethodTrack, PendingTrainingItem } from '../../domain/method/types';
import type { ChesscomMonthCache } from '../chesscom/chesscomClient';

export const storageDatabaseName = 'lichess-tutor' as const;

export type ProfileRecord = LearnerProfile & {
  id: 'default';
};

export type PlanRecord = DailyPlan;

export type LearningLogRecord = TrainingLog;

export type SignalRecord = Signal & {
  id: string;
};

export type WeaknessRecord = Weakness & {
  id: string;
};

export type ChesscomMonthSignalCacheRecord = ChesscomMonthCache;

export type LichessOAuthTokenRecord = LichessOAuthToken & {
  id: 'lichess';
};

export type LichessStudyLinkRecord = LichessStudyLink;

export type MethodTrackRecord = MethodTrack;

export type PendingItemRecord = PendingTrainingItem;

export type DiplomaAttemptRecord = DiplomaAttempt;

export type BackupMetaRecord = {
  id: 'last-export';
  exportedAt: string;
  checksum: string;
  recordCount: number;
};

export type AutoBackupConfigRecord = {
  id: 'config';
  enabled: boolean;
  fileName?: string;
  // FileSystemFileHandle e clonavel por structured clone em browsers reais;
  // fica tipado como unknown para o dominio nao depender da API do browser.
  handle?: unknown;
  updatedAt: string;
};

export class TutorDatabase extends Dexie {
  profile!: Table<ProfileRecord, string>;
  plans!: Table<PlanRecord, string>;
  logs!: Table<LearningLogRecord, string>;
  signals!: Table<SignalRecord, string>;
  weaknesses!: Table<WeaknessRecord, string>;
  chesscomMonthSignals!: Table<ChesscomMonthSignalCacheRecord, string>;
  lichessOAuthTokens!: Table<LichessOAuthTokenRecord, string>;
  lichessStudies!: Table<LichessStudyLinkRecord, string>;
  methodTracks!: Table<MethodTrackRecord, string>;
  pendingItems!: Table<PendingItemRecord, string>;
  diplomaAttempts!: Table<DiplomaAttemptRecord, string>;
  backupMeta!: Table<BackupMetaRecord, string>;
  autoBackup!: Table<AutoBackupConfigRecord, string>;

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

    this.version(3).stores({
      lichessOAuthTokens: 'id, expiresAt',
      lichessStudies: 'id, date, studyId, updatedAt',
    });

    this.version(4).stores({
      methodTracks: 'id, status, updatedAt',
      pendingItems: 'id, status, dueAt, methodTrackId, weaknessTag, updatedAt',
      diplomaAttempts: 'id, diplomaId, sectionId, createdAt, updatedAt',
    });

    this.version(5).stores({
      backupMeta: 'id',
    });

    this.version(6).stores({
      autoBackup: 'id',
    });
  }
}

export const db = new TutorDatabase();
