// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SYNC_CANARY_STORAGE_KEY } from '../../config/syncConfig';
import { defaultCanaryStore } from './canaryStore';
import type { EncryptedBlob } from './crypto';

const BLOB: EncryptedBlob = {
  v: 1,
  kdf: 'PBKDF2-SHA256',
  iterations: 1000,
  salt: 'AAAAAAAAAAAAAAAAAAAAAA==',
  iv: 'AAAAAAAAAAAAAAAA',
  ciphertext: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
};

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('defaultCanaryStore.save', () => {
  it('retorna true e persiste o canary quando o storage funciona', () => {
    const ok = defaultCanaryStore.save(BLOB);

    expect(ok).toBe(true);
    expect(defaultCanaryStore.load()).toEqual(BLOB);
    expect(window.localStorage.getItem(SYNC_CANARY_STORAGE_KEY)).not.toBeNull();
  });

  it('retorna false (sem engolir) quando setItem lanca (ex.: quota excedido)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });

    const ok = defaultCanaryStore.save(BLOB);

    expect(ok).toBe(false);
    expect(defaultCanaryStore.load()).toBeUndefined();
  });
});

describe('defaultCanaryStore.load', () => {
  it('retorna undefined quando nao ha canary', () => {
    expect(defaultCanaryStore.load()).toBeUndefined();
  });

  it('retorna undefined quando o valor armazenado e invalido', () => {
    window.localStorage.setItem(SYNC_CANARY_STORAGE_KEY, 'not-a-blob');

    expect(defaultCanaryStore.load()).toBeUndefined();
  });
});

describe('defaultCanaryStore.clear', () => {
  it('remove o canary e preserva as demais chaves (nao apaga dados locais)', () => {
    window.localStorage.setItem('rotina-outro-dado', 'precioso');
    defaultCanaryStore.save(BLOB);

    defaultCanaryStore.clear();

    expect(defaultCanaryStore.load()).toBeUndefined();
    expect(window.localStorage.getItem('rotina-outro-dado')).toBe('precioso');
  });

  it('retorna true quando o canary existia e foi removido', () => {
    defaultCanaryStore.save(BLOB);
    expect(defaultCanaryStore.clear()).toBe(true);
    expect(defaultCanaryStore.load()).toBeUndefined();
  });

  it('retorna true quando o canary ja estava ausente (removeItem no-op)', () => {
    expect(defaultCanaryStore.clear()).toBe(true);
  });

  it('retorna false quando removeItem lanca (storage indisponivel)', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(defaultCanaryStore.clear()).toBe(false);
  });
});
