import type { BackupMetaRecord } from '../infra/storage/db';

export type { BackupImportResult, StoredPlacementResult } from '../infra/storage/appData';
export { describeAutoBackupStatus, type AutoBackupStatus } from '../infra/storage/autoBackup';
export { describePersistenceStatus, type StoragePersistenceStatus } from '../infra/storage/persistence';

export type BackupMeta = Pick<BackupMetaRecord, 'checksum' | 'exportedAt' | 'recordCount'>;
