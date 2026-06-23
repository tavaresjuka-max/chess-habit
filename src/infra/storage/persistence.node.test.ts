// @vitest-environment node
// Tests requestPersistentStorage in node environments.
import { describe, expect, it } from 'vitest';
import { requestPersistentStorage } from './persistence';

describe('requestPersistentStorage (node / no StorageManager)', () => {
  it('returns unsupported when navigator.storage is absent', async () => {
    // Node.js 22+ has navigator but navigator.storage is undefined.
    // getStorageManager() returns the storage object (undefined) →
    // storage?.persist === undefined → requestPersistentStorage → 'unsupported'.
    expect(await requestPersistentStorage()).toBe('unsupported');
  });

  it('returns unsupported when navigator global is removed', async () => {
    // Exercise the typeof navigator === 'undefined' branch by temporarily
    // removing the navigator global that Node 22 provides.
    const saved = (globalThis as Record<string, unknown>)['navigator'];

    try {
       
      delete (globalThis as Record<string, unknown>)['navigator'];
      expect(await requestPersistentStorage()).toBe('unsupported');
    } finally {
      (globalThis as Record<string, unknown>)['navigator'] = saved;
    }
  });
});
