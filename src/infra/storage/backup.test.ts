import { describe, expect, it } from 'vitest';
import {
  backupFormatName,
  backupFormatVersion,
  computeBackupChecksum,
  countBackupRecords,
  createBackupFile,
  type BackupData,
} from './backup';

function createEmptyData(): BackupData {
  return {
    profile: [],
    plans: [],
    logs: [],
    signals: [],
    weaknesses: [],
    methodTracks: [],
    pendingItems: [],
    diplomaAttempts: [],
  };
}

describe('backup file format', () => {
  it('creates a v1 envelope with verifiable checksum', async () => {
    const data: BackupData = { ...createEmptyData(), profile: [{ id: 'default' }] };
    const file = await createBackupFile(data, '2026-06-10T12:00:00.000Z');

    expect(file.format).toBe(backupFormatName);
    expect(file.version).toBe(backupFormatVersion);
    expect(file.exportedAt).toBe('2026-06-10T12:00:00.000Z');
    expect(file.checksum).toBe(await computeBackupChecksum(JSON.stringify(data)));
  });

  it('changes the checksum when the data changes', async () => {
    const original = await computeBackupChecksum(JSON.stringify(createEmptyData()));
    const tampered = await computeBackupChecksum(
      JSON.stringify({ ...createEmptyData(), logs: [{ id: 'x' }] }),
    );

    expect(tampered).not.toBe(original);
  });

  it('is deterministic for the same data', async () => {
    const data = JSON.stringify({ ...createEmptyData(), signals: [{ id: 's1' }] });

    expect(await computeBackupChecksum(data)).toBe(await computeBackupChecksum(data));
  });

  it('counts records across every table', () => {
    const data: BackupData = {
      ...createEmptyData(),
      profile: [{}],
      plans: [{}, {}],
      pendingItems: [{}, {}, {}],
    };

    expect(countBackupRecords(data)).toBe(6);
  });
});
