import { describe, expect, it, vi } from 'vitest';
import {
  describeAutoBackupStatus,
  writeAutoBackup,
  type FileSystemFileHandleLike,
} from './autoBackup';

function createHandle(overrides?: Partial<FileSystemFileHandleLike>): {
  handle: FileSystemFileHandleLike;
  written: string[];
  closed: { value: boolean };
} {
  const written: string[] = [];
  const closed = { value: false };
  const handle: FileSystemFileHandleLike = {
    name: 'lichess-tutor-backup.json',
    queryPermission: vi.fn().mockResolvedValue('granted'),
    requestPermission: vi.fn().mockResolvedValue('granted'),
    createWritable: () =>
      Promise.resolve({
        write: (content: string) => {
          written.push(content);
          return Promise.resolve();
        },
        close: () => {
          closed.value = true;
          return Promise.resolve();
        },
      }),
    ...overrides,
  };

  return { handle, written, closed };
}

describe('writeAutoBackup', () => {
  it('writes and closes when permission is granted', async () => {
    const { handle, written, closed } = createHandle();

    expect(await writeAutoBackup(handle, '{"v":1}')).toBe('written');
    expect(written).toEqual(['{"v":1}']);
    expect(closed.value).toBe(true);
  });

  it('returns needs-permission on prompt without a user gesture', async () => {
    const { handle, written } = createHandle({
      queryPermission: vi.fn().mockResolvedValue('prompt'),
    });

    expect(await writeAutoBackup(handle, 'x')).toBe('needs-permission');
    expect(written).toEqual([]);
  });

  it('requests permission when a user gesture allows it', async () => {
    const requestPermission = vi.fn().mockResolvedValue('granted');
    const { handle, written } = createHandle({
      queryPermission: vi.fn().mockResolvedValue('prompt'),
      requestPermission,
    });

    expect(await writeAutoBackup(handle, 'x', { allowPermissionRequest: true })).toBe('written');
    expect(requestPermission).toHaveBeenCalledWith({ mode: 'readwrite' });
    expect(written).toEqual(['x']);
  });

  it('returns needs-permission when the user denies', async () => {
    const { handle } = createHandle({
      queryPermission: vi.fn().mockResolvedValue('denied'),
    });

    expect(await writeAutoBackup(handle, 'x')).toBe('needs-permission');
  });

  it('returns error when writing fails', async () => {
    const { handle } = createHandle({
      createWritable: () => Promise.reject(new Error('disk full')),
    });

    expect(await writeAutoBackup(handle, 'x')).toBe('error');
  });
});

describe('describeAutoBackupStatus', () => {
  it('describes every status honestly', () => {
    expect(describeAutoBackupStatus('unsupported')).toContain('não suporta');
    expect(describeAutoBackupStatus('disabled')).toContain('desligado');
    expect(describeAutoBackupStatus('enabled', 'meu.json')).toContain('meu.json');
    expect(describeAutoBackupStatus('needs-permission')).toContain('permissão');
    expect(describeAutoBackupStatus('error')).toContain('falhou');
  });
});
