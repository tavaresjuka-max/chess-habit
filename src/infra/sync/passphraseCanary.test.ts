// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { encryptJson, SyncCryptoError, type EncryptedBlob } from './crypto';
import { CANARY_MAGIC, createCanary, verifyCanary } from './passphraseCanary';

const FAST = { iterations: 1_000 };

describe('passphrase canary (P4 M13 local-only)', () => {
  describe('createCanary', () => {
    it('devolve um envelope valido (cifrado) do magic', async () => {
      const canary = await createCanary('minha-pass', FAST);
      expect(canary.v).toBe(1);
      expect(canary.kdf).toBe('PBKDF2-SHA256');
      expect(canary.iterations).toBe(1_000);
      const serialized = JSON.stringify(canary);
      expect(serialized).not.toContain(CANARY_MAGIC);
    });

    it('recusa passphrase vazia (delegado ao motor E2EE)', async () => {
      await expect(createCanary('', FAST)).rejects.toBeInstanceOf(SyncCryptoError);
    });

    it('gera canaries distintos (salt/iv aleatorios) para a mesma passphrase', async () => {
      const a = await createCanary('mesma', FAST);
      const b = await createCanary('mesma', FAST);
      expect(a.salt).not.toBe(b.salt);
      expect(a.iv).not.toBe(b.iv);
      expect(a.ciphertext).not.toBe(b.ciphertext);
    });
  });

  describe('verifyCanary', () => {
    it('confirma true para a passphrase correta', async () => {
      const canary = await createCanary('correta', FAST);
      expect(await verifyCanary(canary, 'correta')).toBe(true);
    });

    it('retorna false (sem lancar) para passphrase errada', async () => {
      const canary = await createCanary('correta', FAST);
      expect(await verifyCanary(canary, 'errada')).toBe(false);
    });

    it('retorna false para passphrase vazia', async () => {
      const canary = await createCanary('correta', FAST);
      expect(await verifyCanary(canary, '')).toBe(false);
    });

    it('retorna false para canary corrompido (iv adulterado)', async () => {
      const canary = await createCanary('correta', FAST);
      const tampered: EncryptedBlob = { ...canary, iv: canary.iv.slice(0, -2) + 'AA' };
      expect(await verifyCanary(tampered, 'correta')).toBe(false);
    });

    it('retorna false para canary cujo plaintext nao e o magic esperado', async () => {
      const foreign = await encryptJson('outra-coisa', 'k', FAST);
      const forged: EncryptedBlob = { ...foreign };
      expect(await verifyCanary(forged, 'k')).toBe(false);
    });
  });

  describe('round-trip canary', () => {
    it('canary de producao (600k iter) verifica com a mesma passphrase', async () => {
      const canary = await createCanary('forte-e-longa-passphrase');
      expect(canary.iterations).toBe(600_000);
      expect(await verifyCanary(canary, 'forte-e-longa-passphrase')).toBe(true);
      expect(await verifyCanary(canary, 'outra')).toBe(false);
    });
  });
});
