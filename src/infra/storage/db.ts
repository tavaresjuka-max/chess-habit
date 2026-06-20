import Dexie, { type Table } from 'dexie';
import { migrateLegacyBand } from '../../domain/bands';
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

// updatedAt universal + deletedAt (soft delete) preparam o merge por registro
// do P4 (sync): nenhum replace fisico destrutivo nessas tabelas.
export type SignalRecord = Signal & {
  id: string;
  updatedAt: string;
  deletedAt?: string;
};

export type WeaknessRecord = Weakness & {
  id: string;
  updatedAt: string;
  deletedAt?: string;
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

export type AchievementRecord = {
  id: string;
  unlockedAt: string;
  updatedAt: string;
};

// Resultado da avaliacao de entrada aplicado pelo aluno (sempre o mais
// recente); alimenta a conquista Calibrado e futuros ajustes de placement.
export type PlacementResultRecord = {
  id: 'latest';
  band: string;
  confidence: string;
  calibrated: boolean;
  completedAt: string;
  updatedAt: string;
};

// Marcos do app que não pertencem ao perfil nem aos planos. Hoje só guarda a
// conclusão do funil de onboarding (primeira vez): uma vez definido, o app
// abre direto no Hoje e a aprovação diária volta a ser a dobra dentro do Hoje.
export type AppMetaRecord = {
  id: 'app';
  onboardingCompletedAt?: string;
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
  achievements!: Table<AchievementRecord, string>;
  placementResults!: Table<PlacementResultRecord, string>;
  appMeta!: Table<AppMetaRecord, string>;

  constructor(name: string = storageDatabaseName) {
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

    this.version(7)
      .stores({
        signals: 'id, source, observedAt, updatedAt',
        weaknesses: 'id, tag, confidence, updatedAt',
      })
      .upgrade(async (transaction) => {
        const now = new Date().toISOString();

        await transaction
          .table('signals')
          .toCollection()
          .modify((record: Partial<SignalRecord>) => {
            record.updatedAt ??= record.observedAt ?? now;
          });
        await transaction
          .table('weaknesses')
          .toCollection()
          .modify((record: Partial<WeaknessRecord>) => {
            record.updatedAt ??= now;
          });
      });

    // Spine 0-2200 (Corte 2): perfis com bandas antigas ('0-800'/'800-1200')
    // migram para a banda equivalente do novo spine; placement (Corte 3) refina.
    this.version(8).upgrade(async (transaction) => {
      await transaction
        .table('profile')
        .toCollection()
        .modify((record: { band?: string }) => {
          if (typeof record.band === 'string') {
            record.band = migrateLegacyBand(record.band);
          }
        });
    });

    // Conquistas de esforco/habito (Corte 7): unica por id, nunca expira.
    this.version(9).stores({
      achievements: 'id, unlockedAt, updatedAt',
    });

    // Placement persistido (conquista Calibrado + historico de calibracao).
    this.version(10).stores({
      placementResults: 'id, updatedAt',
    });

    // Marco do funil de onboarding (primeira vez). Registro unico 'app'.
    this.version(11).stores({
      appMeta: 'id',
    });
  }
}

export const db = new TutorDatabase();
