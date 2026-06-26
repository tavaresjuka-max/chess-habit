// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { db } from './db';
import { computeBackupChecksum } from './backup';
import { importBackupFromJson } from './appData';
import { writeAutoBackup, type FileSystemFileHandleLike } from './autoBackup';
import { QUOTA_EXCEEDED_MESSAGE, isQuotaExceeded } from './quotaError';

afterEach(() => {
  vi.restoreAllMocks();
});

// Backup minimo e valido (todas as tabelas requeridas como arrays vazios) para
// passar por parseBackupFile + validateBackupData e alcancar a transacao/try.
async function buildValidBackupJson(): Promise<string> {
  const data = {
    profile: [],
    plans: [],
    logs: [],
    signals: [],
    weaknesses: [],
    methodTracks: [],
    pendingItems: [],
    diplomaAttempts: [],
  };
  const checksum = await computeBackupChecksum(JSON.stringify(data), 'fnv1a');

  return JSON.stringify({
    format: 'lichess-tutor-backup',
    version: 1,
    exportedAt: '2026-06-25T00:00:00.000Z',
    checksum,
    data,
  });
}

describe('isQuotaExceeded (discriminador)', () => {
  it('detecta DOMException com name === QuotaExceededError', () => {
    expect(isQuotaExceeded(new DOMException('quota exceeded', 'QuotaExceededError'))).toBe(true);
  });

  it('detecta o equivalente Dexie (Error envelopado preservando so o name)', () => {
    // Dexie envelopa o erro mas propaga o nome; nao e instanceof DOMException.
    const dexieLike = Object.assign(new Error('quota'), { name: 'QuotaExceededError' });

    expect(dexieLike).not.toBeInstanceOf(DOMException);
    expect(isQuotaExceeded(dexieLike)).toBe(true);
  });

  it('NAO classifica erro generico como quota (sem falso-positivo)', () => {
    expect(isQuotaExceeded(new Error('disk full'))).toBe(false);
    expect(isQuotaExceeded(new DOMException('cancelled', 'AbortError'))).toBe(false);
    expect(isQuotaExceeded(null)).toBe(false);
    expect(isQuotaExceeded(undefined)).toBe(false);
    expect(isQuotaExceeded('QuotaExceededError')).toBe(false);
  });
});

// SPEC caso 1: restore sob quota devolve mensagem PT, nao o DOMException cru.
describe('quota no restore (importBackupFromJson)', () => {
  it('devolve a mensagem PT acionavel quando o IndexedDB enche', async () => {
    // Simula a primeira escrita do restore (db.profile.clear) estourando a cota.
    vi.spyOn(db.profile, 'clear').mockRejectedValueOnce(
      new DOMException('quota exceeded', 'QuotaExceededError'),
    );

    const result = await importBackupFromJson(await buildValidBackupJson());

    expect(result.ok).toBe(false);
    if (!result.ok) {
      // Mensagem PT tipada, nao o template generico nem o DOMException cru.
      expect(result.error).toBe(QUOTA_EXCEEDED_MESSAGE);
      expect(result.error).not.toContain('Erro ao restaurar dados');
      expect(result.error).not.toContain('DOMException');
    }
  });
});

// SPEC caso 2: auto-backup sob quota nao quebra o fluxo; degrada com aviso PT.
describe('quota no auto-backup (writeAutoBackup)', () => {
  it('degrada com aviso PT claro e NAO quebra o fluxo do app', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const handle: FileSystemFileHandleLike = {
      queryPermission: vi.fn().mockResolvedValue('granted'),
      createWritable: () => Promise.reject(new DOMException('quota', 'QuotaExceededError')),
    };

    const result = await writeAutoBackup(handle, 'conteudo');

    // Nao quebra o fluxo: retorna status distinto em vez de lancar.
    expect(result).toBe('quota-error');
    // Log claro com a MESMA classe de mensagem PT usada pelo restore.
    expect(warnSpy).toHaveBeenCalledWith(QUOTA_EXCEEDED_MESSAGE);
  });
});

// SPEC caso 3: erro generico NAO vira quota — o caminho atual (return 'error')
// e o template tecnico do restore seguem intactos.
describe('erro generico nao e classificado como quota (integracao)', () => {
  it('writeAutoBackup continua retornando error para falha nao-quota', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const handle: FileSystemFileHandleLike = {
      queryPermission: vi.fn().mockResolvedValue('granted'),
      createWritable: () => Promise.reject(new Error('disk full')),
    };

    const result = await writeAutoBackup(handle, 'conteudo');

    expect(result).toBe('error');
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
