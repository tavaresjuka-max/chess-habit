import { afterEach, describe, expect, it, vi } from 'vitest';
import { describePersistenceStatus, requestPersistentStorage } from './persistence';

type NavigatorWithStorage = Navigator & { storage: StorageManager };

function stubStorageManager(manager: Partial<StorageManager> | undefined): void {
  Object.defineProperty(navigator, 'storage', {
    value: manager,
    configurable: true,
  });
}

describe('requestPersistentStorage', () => {
  const originalStorage = (navigator as NavigatorWithStorage).storage as StorageManager | undefined;

  afterEach(() => {
    stubStorageManager(originalStorage);
    vi.restoreAllMocks();
  });

  it('returns unsupported when navigator.storage is missing', async () => {
    stubStorageManager(undefined);

    expect(await requestPersistentStorage()).toBe('unsupported');
  });

  it('returns persisted without asking again when already persisted', async () => {
    const persist = vi.fn().mockResolvedValue(true);

    stubStorageManager({
      persisted: vi.fn().mockResolvedValue(true),
      persist,
    });

    expect(await requestPersistentStorage()).toBe('persisted');
    expect(persist).not.toHaveBeenCalled();
  });

  it('returns persisted when the browser grants persistence', async () => {
    stubStorageManager({
      persisted: vi.fn().mockResolvedValue(false),
      persist: vi.fn().mockResolvedValue(true),
    });

    expect(await requestPersistentStorage()).toBe('persisted');
  });

  it('returns not-persisted when the browser denies persistence', async () => {
    stubStorageManager({
      persisted: vi.fn().mockResolvedValue(false),
      persist: vi.fn().mockResolvedValue(false),
    });

    expect(await requestPersistentStorage()).toBe('not-persisted');
  });

  it('returns unsupported when the storage manager throws', async () => {
    stubStorageManager({
      persisted: vi.fn().mockRejectedValue(new Error('blocked')),
      persist: vi.fn().mockResolvedValue(false),
    });

    expect(await requestPersistentStorage()).toBe('unsupported');
  });

  it('returns unsupported when navigator.storage has no persist method', async () => {
    // Covers the branch where storage exists but lacks the persist API
    // (partial StorageManager implementation in older browsers).
    stubStorageManager({ persisted: vi.fn().mockResolvedValue(false) });

    expect(await requestPersistentStorage()).toBe('unsupported');
  });

  it('returns unsupported when navigator.storage has no persisted method', async () => {
    // Covers the branch where storage exists but lacks the persisted API.
    stubStorageManager({ persist: vi.fn().mockResolvedValue(true) });

    expect(await requestPersistentStorage()).toBe('unsupported');
  });
});

describe('describePersistenceStatus', () => {
  it('describes every status with honest copy', () => {
    expect(describePersistenceStatus('persisted')).toContain('persistente ativo');
    expect(describePersistenceStatus('not-persisted')).toContain('podem ser apagados');
    expect(describePersistenceStatus('unsupported')).toContain('não informa persistência');
  });
});
