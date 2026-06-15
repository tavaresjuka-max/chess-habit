import { describe, expect, it } from 'vitest';
import {
  backupFormatName,
  backupFormatVersion,
  computeBackupChecksum,
  countBackupRecords,
  createBackupFile,
  parseBackupFile,
  validateBackupData,
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

  it('round-trips through parseBackupFile', async () => {
    const file = await createBackupFile({ ...createEmptyData(), logs: [{ id: 'l1' }] }, '2026-06-10T12:00:00.000Z');
    const parsed = await parseBackupFile(JSON.stringify(file));

    expect(parsed.ok).toBe(true);

    if (parsed.ok) {
      expect(parsed.file.data.logs).toEqual([{ id: 'l1' }]);
    }
  });

  it('rejects a backup missing a table', async () => {
    const file = await createBackupFile(createEmptyData(), '2026-06-10T12:00:00.000Z');
    const broken = JSON.parse(JSON.stringify(file)) as { data: Record<string, unknown> };

    delete broken.data.pendingItems;

    const parsed = await parseBackupFile(JSON.stringify(broken));

    expect(parsed.ok).toBe(false);

    if (!parsed.ok) {
      expect(parsed.error).toContain('pendingItems');
    }
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

describe('validateBackupData', () => {
  it('returns null for a valid backup with populated tables', () => {
    const data: BackupData = {
      ...createEmptyData(),
      profile: [{ id: 'default', band: '800-1000', updatedAt: '2026-06-01T00:00:00.000Z' }],
      plans: [{ id: 'p1', date: '2026-06-01', blocks: [] }],
      logs: [{ id: 'l1', startedAt: '2026-06-01T10:00:00.000Z', elapsedSeconds: 30 }],
      signals: [{ id: 's1', kind: 'weakness' }],
      weaknesses: [{ id: 'w1', tag: 'fork' }],
      achievements: [{ id: 'primeira-hora', unlockedAt: '2026-06-01T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z' }],
      placementResults: [{ id: 'latest', band: '800-1000' }],
    };

    expect(validateBackupData(data)).toBeNull();
  });

  it('rejects plans item missing date', () => {
    const data: BackupData = { ...createEmptyData(), plans: [{ blocks: [] }] };
    const error = validateBackupData(data);

    expect(error).not.toBeNull();
    expect(error).toContain('plans');
    expect(error).toContain('date');
  });

  it('rejects plans item with date in wrong format', () => {
    const data: BackupData = { ...createEmptyData(), plans: [{ date: '01/06/2026', blocks: [] }] };
    const error = validateBackupData(data);

    expect(error).not.toBeNull();
    expect(error).toContain('plans');
    expect(error).toContain('date');
  });

  it('rejects signals item where kind is not a string', () => {
    const data: BackupData = { ...createEmptyData(), signals: [{ id: 's1', kind: 42 }] };
    const error = validateBackupData(data);

    expect(error).not.toBeNull();
    expect(error).toContain('signals');
    expect(error).toContain('kind');
  });

  it('rejects an item whose id is an empty string (corrupting PK)', () => {
    const data: BackupData = { ...createEmptyData(), weaknesses: [{ id: '', tag: 'fork' }] };
    const error = validateBackupData(data);

    expect(error).not.toBeNull();
    expect(error).toContain('weaknesses');
    expect(error).toContain('id');
  });

  it('rejects logs item missing startedAt', () => {
    const data: BackupData = { ...createEmptyData(), logs: [{ id: 'l1' }] };
    const error = validateBackupData(data);

    expect(error).not.toBeNull();
    expect(error).toContain('logs');
    expect(error).toContain('startedAt');
  });

  it('rejects achievements item missing unlockedAt', () => {
    const data: BackupData = { ...createEmptyData(), achievements: [{ id: 'a1' }] };
    const error = validateBackupData(data);

    expect(error).not.toBeNull();
    expect(error).toContain('achievements');
    expect(error).toContain('unlockedAt');
  });

  it('passes for a legacy backup without achievements field', () => {
    const data: BackupData = createEmptyData();

    expect(data.achievements).toBeUndefined();
    expect(validateBackupData(data)).toBeNull();
  });

  it('passes for a legacy backup without placementResults field', () => {
    const data: BackupData = createEmptyData();

    expect(data.placementResults).toBeUndefined();
    expect(validateBackupData(data)).toBeNull();
  });

  it('aceita lichessStudies e appMeta válidos', () => {
    const data: BackupData = {
      ...createEmptyData(),
      lichessStudies: [{ id: '2026-06-06', date: '2026-06-06', studyId: 'abc123' }],
      appMeta: [{ id: 'app', updatedAt: '2026-06-06T00:00:00.000Z' }],
    };

    expect(validateBackupData(data)).toBeNull();
  });

  it('rejeita lichessStudies sem studyId', () => {
    const data: BackupData = {
      ...createEmptyData(),
      lichessStudies: [{ id: '2026-06-06', date: '2026-06-06' }],
    };
    const error = validateBackupData(data);

    expect(error).not.toBeNull();
    expect(error).toContain('lichessStudies');
    expect(error).toContain('studyId');
  });

  it('passa para backup antigo sem lichessStudies/appMeta', () => {
    const data: BackupData = createEmptyData();

    expect(data.lichessStudies).toBeUndefined();
    expect(data.appMeta).toBeUndefined();
    expect(validateBackupData(data)).toBeNull();
  });
});
