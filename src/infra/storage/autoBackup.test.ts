// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import {
  describeAutoBackupStatus,
  getSaveFilePicker,
  isAutoBackupSupported,
  pickAutoBackupFile,
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

  it('writes directly when handle has no queryPermission method', async () => {
    // Covers the false branch of `handle.queryPermission !== undefined`:
    // permission stays 'granted' and the write proceeds without a permission check.
    const { handle, written, closed } = createHandle({
      queryPermission: undefined,
      requestPermission: undefined,
    });

    expect(await writeAutoBackup(handle, 'direct')).toBe('written');
    expect(written).toEqual(['direct']);
    expect(closed.value).toBe(true);
  });

  it('returns needs-permission when requestPermission is called but denies', async () => {
    const { handle } = createHandle({
      queryPermission: vi.fn().mockResolvedValue('prompt'),
      requestPermission: vi.fn().mockResolvedValue('denied'),
    });

    expect(await writeAutoBackup(handle, 'x', { allowPermissionRequest: true })).toBe('needs-permission');
  });
});

describe('getSaveFilePicker', () => {
  it('returns undefined when showSaveFilePicker is not available in the environment', () => {
    // jsdom does not implement the File System Access API
    expect(getSaveFilePicker()).toBeUndefined();
  });

  it('returns the picker function when showSaveFilePicker is available', () => {
    const fakePicker = vi.fn();
    const g = globalThis as Record<string, unknown>;
    g['showSaveFilePicker'] = fakePicker;
    try {
      expect(getSaveFilePicker()).toBe(fakePicker);
    } finally {
      delete g['showSaveFilePicker'];
    }
  });

  it('returns undefined when showSaveFilePicker is a non-function value', () => {
    const g = globalThis as Record<string, unknown>;
    g['showSaveFilePicker'] = 'not-a-function';
    try {
      expect(getSaveFilePicker()).toBeUndefined();
    } finally {
      delete g['showSaveFilePicker'];
    }
  });
});

describe('isAutoBackupSupported', () => {
  it('returns false when File System Access API is absent', () => {
    // jsdom environment: showSaveFilePicker is not defined
    expect(isAutoBackupSupported()).toBe(false);
  });

  it('returns true when showSaveFilePicker is present', () => {
    const g = globalThis as Record<string, unknown>;
    g['showSaveFilePicker'] = vi.fn();
    try {
      expect(isAutoBackupSupported()).toBe(true);
    } finally {
      delete g['showSaveFilePicker'];
    }
  });
});

describe('pickAutoBackupFile', () => {
  it('returns undefined when the File System Access API is not supported', async () => {
    expect(await pickAutoBackupFile()).toBeUndefined();
  });

  it('returns undefined when the user cancels the file picker dialog', async () => {
    const g = globalThis as Record<string, unknown>;
    g['showSaveFilePicker'] = () => Promise.reject(new DOMException('cancelled', 'AbortError'));
    try {
      expect(await pickAutoBackupFile()).toBeUndefined();
    } finally {
      delete g['showSaveFilePicker'];
    }
  });

  it('returns the file handle when the user selects a file', async () => {
    const fakeHandle: FileSystemFileHandleLike = { createWritable: vi.fn() };
    const g = globalThis as Record<string, unknown>;
    g['showSaveFilePicker'] = () => Promise.resolve(fakeHandle);
    try {
      expect(await pickAutoBackupFile()).toBe(fakeHandle);
    } finally {
      delete g['showSaveFilePicker'];
    }
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

  it('omits the file name when enabled status has no fileName', () => {
    // Covers the `fileName === undefined ? '' : ...` false branch (line 110).
    const description = describeAutoBackupStatus('enabled');

    expect(description).toContain('ativo');
    expect(description).not.toContain('em "');
  });
});
