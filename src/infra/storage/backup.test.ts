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
      signals: [
        {
          id: 's1',
          source: 'lichess',
          observedAt: '2026-06-01T00:00:00.000Z',
          confidence: 'medium',
          value: { kind: 'judgment', blunders: 4, mistakes: 0, inaccuracies: 0, games: 6 },
        },
      ],
      weaknesses: [{ id: 'w1', tag: 'fork' }],
      pendingItems: [{ id: 'pending-1', status: 'open' }],
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

  it('aceita um signal no formato real exportado (value.kind, sem kind no topo)', () => {
    // Espelha exatamente o que exportAllAsJson grava (db.signals.toArray()):
    // SignalRecord = Signal & { id, updatedAt }, com o discriminador em value.kind
    // e NUNCA um campo kind no topo. Restaurar um backup real precisa passar aqui.
    const data: BackupData = {
      ...createEmptyData(),
      signals: [
        {
          id: 's1',
          source: 'lichess',
          observedAt: '2026-06-01T00:00:00.000Z',
          confidence: 'medium',
          updatedAt: '2026-06-01T00:00:00.000Z',
          value: { kind: 'accuracy', lowAccuracyGames: 6, games: 8 },
        },
      ],
    };

    expect(validateBackupData(data)).toBeNull();
  });

  it('rejects signals item where value.kind is not a string', () => {
    const data: BackupData = {
      ...createEmptyData(),
      signals: [{ id: 's1', source: 'lichess', observedAt: '2026-06-01T00:00:00.000Z', value: { kind: 42 } }],
    };
    const error = validateBackupData(data);

    expect(error).not.toBeNull();
    expect(error).toContain('signals');
    expect(error).toContain('kind');
  });

  it('rejects signals item without a value object', () => {
    const data: BackupData = {
      ...createEmptyData(),
      signals: [{ id: 's1', source: 'lichess', observedAt: '2026-06-01T00:00:00.000Z' }],
    };
    const error = validateBackupData(data);

    expect(error).not.toBeNull();
    expect(error).toContain('signals');
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

  it('rejects pending items missing status', () => {
    const data: BackupData = { ...createEmptyData(), pendingItems: [{ id: 'pending-1' }] };
    const error = validateBackupData(data);

    expect(error).not.toBeNull();
    expect(error).toContain('pendingItems');
    expect(error).toContain('status');
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
      lichessStudies: [
        { id: '2026-06-06', date: '2026-06-06', studyId: 'abc123', url: 'https://lichess.org/study/abc123' },
      ],
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

  it('rejeita lichessStudies com URL fora do Lichess', () => {
    const data: BackupData = {
      ...createEmptyData(),
      lichessStudies: [
        { id: '2026-06-06', date: '2026-06-06', studyId: 'abc123', url: 'https://evil.example/study/abc123' },
      ],
    };
    const error = validateBackupData(data);

    expect(error).not.toBeNull();
    expect(error).toContain('lichessStudies');
    expect(error).toContain('url');
  });

  it('rejeita destino de treino importado fora do Lichess', () => {
    const data: BackupData = {
      ...createEmptyData(),
      plans: [
        {
          date: '2026-06-01',
          blocks: [
            {
              id: 'block-1',
              destination: {
                source: 'lichess',
                label: 'Quebrado',
                url: 'javascript:alert(1)',
              },
            },
          ],
        },
      ],
    };
    const error = validateBackupData(data);

    expect(error).not.toBeNull();
    expect(error).toContain('destination.url');
  });

  it('passa para backup antigo sem lichessStudies/appMeta', () => {
    const data: BackupData = createEmptyData();

    expect(data.lichessStudies).toBeUndefined();
    expect(data.appMeta).toBeUndefined();
    expect(validateBackupData(data)).toBeNull();
  });

  it('rejects profile item missing band', () => {
    const data: BackupData = { ...createEmptyData(), profile: [{ updatedAt: '2026-06-01T00:00:00.000Z' }] };
    const error = validateBackupData(data);

    expect(error).not.toBeNull();
    expect(error).toContain('profile');
  });

  it('rejects profile item missing updatedAt', () => {
    const data: BackupData = { ...createEmptyData(), profile: [{ band: '800-1000' }] };
    const error = validateBackupData(data);

    expect(error).not.toBeNull();
    expect(error).toContain('profile');
  });

  // --- plans validation sub-branches ---

  it('rejects plans item where blocks is not an array', () => {
    const data: BackupData = { ...createEmptyData(), plans: [{ date: '2026-06-01', blocks: 'bad' }] };
    const error = validateBackupData(data);

    expect(error).not.toBeNull();
    expect(error).toContain('blocks');
  });

  it('rejects plans item where a block is not an object', () => {
    const data: BackupData = { ...createEmptyData(), plans: [{ date: '2026-06-01', blocks: [null] }] };
    const error = validateBackupData(data);

    expect(error).not.toBeNull();
    expect(error).toContain('blocks[0]');
  });

  it('rejects plans item where block destination is not an object', () => {
    const data: BackupData = {
      ...createEmptyData(),
      plans: [{ date: '2026-06-01', blocks: [{ id: 'b1', destination: 'bad' }] }],
    };
    const error = validateBackupData(data);

    expect(error).not.toBeNull();
    expect(error).toContain('destination');
  });

  it('accepts a plan block with a valid Lichess destination URL', () => {
    const data: BackupData = {
      ...createEmptyData(),
      plans: [
        {
          date: '2026-06-01',
          blocks: [{ id: 'b1', destination: { url: 'https://lichess.org/training/fork' } }],
        },
      ],
    };

    expect(validateBackupData(data)).toBeNull();
  });

  it('accepts a plan block with no destination (undefined)', () => {
    const data: BackupData = {
      ...createEmptyData(),
      plans: [{ date: '2026-06-01', blocks: [{ id: 'b1' }] }],
    };

    expect(validateBackupData(data)).toBeNull();
  });

  it('accepts a plan block with a destination that has no url field', () => {
    const data: BackupData = {
      ...createEmptyData(),
      plans: [{ date: '2026-06-01', blocks: [{ id: 'b1', destination: { label: 'No URL' } }] }],
    };

    expect(validateBackupData(data)).toBeNull();
  });

  // --- logs validation sub-branches ---

  it('rejects logs item that is not an object', () => {
    const data: BackupData = { ...createEmptyData(), logs: ['not-an-object'] };
    const error = validateBackupData(data);

    expect(error).not.toBeNull();
    expect(error).toContain('logs');
    expect(error).toContain('id');
  });

  // --- signals validation sub-branches ---

  it('rejects signals item that is not an object', () => {
    const data: BackupData = { ...createEmptyData(), signals: [42] };
    const error = validateBackupData(data);

    expect(error).not.toBeNull();
    expect(error).toContain('signals');
    expect(error).toContain('id');
  });

  it('rejects signals item missing observedAt', () => {
    const data: BackupData = {
      ...createEmptyData(),
      signals: [{ id: 's1', source: 'lichess', value: { kind: 'accuracy' } }],
    };
    const error = validateBackupData(data);

    expect(error).not.toBeNull();
    expect(error).toContain('signals');
    expect(error).toContain('observedAt');
  });

  // --- weaknesses validation sub-branches ---

  it('rejects weaknesses item with empty tag string', () => {
    const data: BackupData = { ...createEmptyData(), weaknesses: [{ id: 'w1', tag: '' }] };
    const error = validateBackupData(data);

    expect(error).not.toBeNull();
    expect(error).toContain('weaknesses');
    expect(error).toContain('tag');
  });

  // --- methodTracks validation sub-branches ---

  it('rejects methodTracks item that is not an object', () => {
    const data: BackupData = { ...createEmptyData(), methodTracks: [null] };
    const error = validateBackupData(data);

    expect(error).not.toBeNull();
    expect(error).toContain('methodTracks');
    expect(error).toContain('id');
  });

  it('rejects methodTracks item with empty id', () => {
    const data: BackupData = { ...createEmptyData(), methodTracks: [{ id: '' }] };
    const error = validateBackupData(data);

    expect(error).not.toBeNull();
    expect(error).toContain('methodTracks');
    expect(error).toContain('id');
  });

  it('accepts valid methodTracks items', () => {
    const data: BackupData = {
      ...createEmptyData(),
      methodTracks: [{ id: 'track-1', method: 'puzzle', updatedAt: '2026-06-01T00:00:00.000Z' }],
    };

    expect(validateBackupData(data)).toBeNull();
  });

  // --- pendingItems validation sub-branches ---

  it('rejects pendingItems item that is not an object', () => {
    const data: BackupData = { ...createEmptyData(), pendingItems: [null] };
    const error = validateBackupData(data);

    expect(error).not.toBeNull();
    expect(error).toContain('pendingItems');
    expect(error).toContain('id');
  });

  // --- diplomaAttempts validation sub-branches ---

  it('rejects diplomaAttempts item that is not an object', () => {
    const data: BackupData = { ...createEmptyData(), diplomaAttempts: [null] };
    const error = validateBackupData(data);

    expect(error).not.toBeNull();
    expect(error).toContain('diplomaAttempts');
    expect(error).toContain('id');
  });

  it('rejects diplomaAttempts item with empty id', () => {
    const data: BackupData = { ...createEmptyData(), diplomaAttempts: [{ id: '' }] };
    const error = validateBackupData(data);

    expect(error).not.toBeNull();
    expect(error).toContain('diplomaAttempts');
    expect(error).toContain('id');
  });

  it('accepts valid diplomaAttempts items', () => {
    const data: BackupData = {
      ...createEmptyData(),
      diplomaAttempts: [{ id: 'attempt-1', theme: 'fork', accuracy: 90, attemptedAt: '2026-06-01T00:00:00.000Z' }],
    };

    expect(validateBackupData(data)).toBeNull();
  });

  // --- lichessStudies validation sub-branches ---

  it('rejects lichessStudies item that is not an object', () => {
    const data: BackupData = { ...createEmptyData(), lichessStudies: [null] };
    const error = validateBackupData(data);

    expect(error).not.toBeNull();
    expect(error).toContain('lichessStudies');
    expect(error).toContain('id');
  });

  it('rejects achievements item with empty id', () => {
    const data: BackupData = {
      ...createEmptyData(),
      achievements: [{ id: '', unlockedAt: '2026-06-01T00:00:00.000Z' }],
    };
    const error = validateBackupData(data);

    expect(error).not.toBeNull();
    expect(error).toContain('achievements');
    expect(error).toContain('id');
  });

  it('rejects placementResults item with empty id', () => {
    const data: BackupData = {
      ...createEmptyData(),
      placementResults: [{ id: '' }],
    };
    const error = validateBackupData(data);

    expect(error).not.toBeNull();
    expect(error).toContain('placementResults');
    expect(error).toContain('id');
  });

  it('rejects appMeta item with empty id', () => {
    const data: BackupData = {
      ...createEmptyData(),
      appMeta: [{ id: '' }],
    };
    const error = validateBackupData(data);

    expect(error).not.toBeNull();
    expect(error).toContain('appMeta');
    expect(error).toContain('id');
  });
});

describe('parseBackupFile error paths', () => {
  it('rejects non-JSON input', async () => {
    const result = await parseBackupFile('not json at all {{{');

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toContain('JSON');
    }
  });

  it('rejects a JSON null value', async () => {
    const result = await parseBackupFile('null');

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toContain('estrutura');
    }
  });

  it('rejects a backup with a wrong format name', async () => {
    const file = await createBackupFile(createEmptyData(), '2026-06-10T12:00:00.000Z');
    const broken = JSON.parse(JSON.stringify(file)) as Record<string, unknown>;

    broken.format = 'wrong-format';

    const result = await parseBackupFile(JSON.stringify(broken));

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toContain('lichess-tutor');
    }
  });

  it('rejects a backup with an unsupported version number', async () => {
    const file = await createBackupFile(createEmptyData(), '2026-06-10T12:00:00.000Z');
    const broken = JSON.parse(JSON.stringify(file)) as Record<string, unknown>;

    broken.version = 99;

    const result = await parseBackupFile(JSON.stringify(broken));

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toContain('99');
    }
  });

  it('rejects a backup where exportedAt is missing', async () => {
    const file = await createBackupFile(createEmptyData(), '2026-06-10T12:00:00.000Z');
    const broken = JSON.parse(JSON.stringify(file)) as Record<string, unknown>;

    delete broken.exportedAt;

    const result = await parseBackupFile(JSON.stringify(broken));

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toContain('checksum');
    }
  });

  it('rejects a backup where data is null', async () => {
    const file = await createBackupFile(createEmptyData(), '2026-06-10T12:00:00.000Z');
    const broken = JSON.parse(JSON.stringify(file)) as Record<string, unknown>;

    broken.data = null;
    broken.checksum = await (await import('./backup')).computeBackupChecksum(JSON.stringify(null));

    const result = await parseBackupFile(JSON.stringify(broken));

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toContain('dados');
    }
  });

  it('rejects a backup whose checksum does not match the data', async () => {
    const file = await createBackupFile(createEmptyData(), '2026-06-10T12:00:00.000Z');
    const tampered = JSON.parse(JSON.stringify(file)) as Record<string, unknown>;
    const data = tampered.data as Record<string, unknown>;

    // Inject an extra record so data no longer matches the stored checksum.
    (data['logs'] as unknown[]).push({ id: 'injected', startedAt: '2026-01-01T00:00:00.000Z' });

    const result = await parseBackupFile(JSON.stringify(tampered));

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toContain('Checksum');
    }
  });

  it('rejects a backup whose fnv1a checksum does not match', async () => {
    // Build a valid backup and replace the checksum prefix so the algorithm
    // branch that detects "fnv1a:" is exercised, then corrupt the hash value.
    const file = await createBackupFile(createEmptyData(), '2026-06-10T12:00:00.000Z');
    const broken = JSON.parse(JSON.stringify(file)) as Record<string, unknown>;

    broken.checksum = 'fnv1a:deadbeef';

    const result = await parseBackupFile(JSON.stringify(broken));

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toContain('Checksum');
    }
  });
});

describe('computeBackupChecksum algorithm selection', () => {
  it('uses fnv1a when crypto is completely undefined', async () => {
    const originalCrypto = globalThis.crypto;

    try {
      // Delete the crypto global so typeof globalThis.crypto === 'undefined'
      // triggering the very first early-return in getSubtleCrypto.
      Object.defineProperty(globalThis, 'crypto', {
        value: undefined,
        configurable: true,
        writable: true,
      });

      const checksum = await computeBackupChecksum('hello');

      expect(checksum).toMatch(/^fnv1a:/);
    } finally {
      Object.defineProperty(globalThis, 'crypto', {
        value: originalCrypto,
        configurable: true,
        writable: true,
      });
    }
  });

  it('uses fnv1a when crypto.subtle is unavailable (insecure context)', async () => {
    const originalCrypto = globalThis.crypto;

    try {
      // Replace crypto with an object that has no `subtle` property so the
      // code takes the fnv1a fallback branch (second guard in getSubtleCrypto).
      Object.defineProperty(globalThis, 'crypto', {
        value: {},
        configurable: true,
        writable: true,
      });

      const checksum = await computeBackupChecksum('hello');

      expect(checksum).toMatch(/^fnv1a:/);
    } finally {
      Object.defineProperty(globalThis, 'crypto', {
        value: originalCrypto,
        configurable: true,
        writable: true,
      });
    }
  });

  it('uses fnv1a when explicitly requested even with subtle available', async () => {
    const checksum = await computeBackupChecksum('hello', 'fnv1a');

    expect(checksum).toMatch(/^fnv1a:[0-9a-f]{8}$/);
  });

  it('countBackupRecords includes all optional tables when present', () => {
    const data: BackupData = {
      ...createEmptyData(),
      achievements: [{}],
      placementResults: [{}, {}],
      lichessStudies: [{}, {}, {}],
      appMeta: [{}],
    };

    // 0 required + 1 + 2 + 3 + 1 = 7
    expect(countBackupRecords(data)).toBe(7);
  });
});
