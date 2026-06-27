// @vitest-environment node

import { describe, expect, it } from 'vitest';
import {
  type EncryptedBlob,
  DEFAULT_PBKDF2_ITERATIONS,
  ENVELOPE_VERSION,
  MAX_PBKDF2_ITERATIONS,
  SyncCryptoError,
  decryptJson,
  encryptJson,
  parseEncryptedBlob,
  serializeEncryptedBlob,
} from './crypto';

const FAST = { iterations: 1_000 };

function decodeB64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

describe('sync crypto (P4 M13 local-only)', () => {
  describe('roundtrip AES-GCM + PBKDF2-SHA256', () => {
    it('devolve o mesmo objeto apos encrypt -> decrypt', async () => {
      const data = { name: 'Tavarez', band: '800-1200', n: 42, list: [1, 2, 3] };
      const blob = await encryptJson(data, 'minha-passphrase-secreta', FAST);
      const back = await decryptJson<typeof data>(blob, 'minha-passphrase-secreta');
      expect(back).toEqual(data);
    });

    it('roundtrip preserva strings unicode e emojis', async () => {
      const data = { trilha: 'Peão ♟️', acento: 'ençãoçãoáà' };
      const blob = await encryptJson(data, 'p', FAST);
      expect(await decryptJson(blob, 'p')).toEqual(data);
    });

    it('roundtrip com objeto vazio, array e null', async () => {
      for (const value of [{}, [], null, 0, '', true]) {
        const blob = await encryptJson(value, 'k', FAST);
        expect(await decryptJson(blob, 'k')).toEqual(value);
      }
    });

    it('usa as iterations default de producao (OWASP 2023 PBKDF2-SHA256)', () => {
      expect(DEFAULT_PBKDF2_ITERATIONS).toBe(600_000);
      expect(ENVELOPE_VERSION).toBe(1);
    });

    it('envelope registra as iterations usadas', async () => {
      const blob = await encryptJson('x', 'k', { iterations: 7_777 });
      expect(blob.iterations).toBe(7_777);
    });

    it('salt e iv tem o tamanho esperado (16 e 12 bytes)', async () => {
      const blob = await encryptJson('x', 'k', FAST);
      expect(decodeB64(blob.salt).length).toBe(16);
      expect(decodeB64(blob.iv).length).toBe(12);
    });
  });

  describe('passphrase errada falha', () => {
    it('lancam SyncCryptoError com passphrase divergente', async () => {
      const blob = await encryptJson({ segredo: 'x' }, 'correta', FAST);
      await expect(decryptJson(blob, 'errada')).rejects.toBeInstanceOf(SyncCryptoError);
      await expect(decryptJson(blob, 'errada')).rejects.toThrow(/passphrase|corrompido/i);
    });

    it('nao decifra com passphrase vazia', async () => {
      const blob = await encryptJson({ a: 1 }, 'k', FAST);
      await expect(decryptJson(blob, '')).rejects.toBeInstanceOf(SyncCryptoError);
    });

    it('encrypt recusa passphrase vazia', async () => {
      await expect(encryptJson({ a: 1 }, '')).rejects.toBeInstanceOf(SyncCryptoError);
    });

    it('blob corrompido (iv adulterado) falha ao decifrar', async () => {
      const blob = await encryptJson({ a: 1 }, 'k', FAST);
      const corrupted: typeof blob = { ...blob, iv: blob.iv.slice(0, -2) + 'AA' };
      await expect(decryptJson(corrupted, 'k')).rejects.toBeInstanceOf(SyncCryptoError);
    });

    it('ciphertext adulterado falha ao decifrar (integridade GCM)', async () => {
      const blob = await encryptJson({ a: 1 }, 'k', FAST);
      const corrupted: typeof blob = { ...blob, ciphertext: blob.ciphertext.slice(0, -4) + 'AAAA' };
      await expect(decryptJson(corrupted, 'k')).rejects.toBeInstanceOf(SyncCryptoError);
    });
  });

  describe('aleatoriedade e nao-vazamento', () => {
    it('duas cifragens do mesmo valor geram salt/iv/ciphertext distintos', async () => {
      const a = await encryptJson({ x: 1 }, 'k', FAST);
      const b = await encryptJson({ x: 1 }, 'k', FAST);
      expect(a.salt).not.toBe(b.salt);
      expect(a.iv).not.toBe(b.iv);
      expect(a.ciphertext).not.toBe(b.ciphertext);
      expect(await decryptJson(a, 'k')).toEqual({ x: 1 });
      expect(await decryptJson(b, 'k')).toEqual({ x: 1 });
    });

    it('envelope serializado NAO contem plaintext nem passphrase', async () => {
      const plaintext = 'PLAINTEXT-MARKER-123';
      const passphrase = 'PASSPHRASE-MARKER-XYZ';
      const blob = await encryptJson({ token: plaintext }, passphrase, FAST);
      const wire = serializeEncryptedBlob(blob);
      expect(wire).not.toContain(plaintext);
      expect(wire).not.toContain(passphrase);
      expect(JSON.parse(wire)).toMatchObject({
        v: 1,
        kdf: 'PBKDF2-SHA256',
        iterations: FAST.iterations,
      });
    });

    it('kdf e versao constantes; salt/iv/ciphertext sao base64', async () => {
      const blob = await encryptJson('x', 'k', FAST);
      expect(blob.kdf).toBe('PBKDF2-SHA256');
      expect(blob.v).toBe(1);
      const base64Re = /^[A-Za-z0-9+/]+={0,2}$/;
      expect(blob.salt).toMatch(base64Re);
      expect(blob.iv).toMatch(base64Re);
      expect(blob.ciphertext).toMatch(base64Re);
    });
  });

  describe('serializacao / parse do envelope', () => {
    it('serialize -> parse e identidade', async () => {
      const blob = await encryptJson({ a: 1 }, 'k', FAST);
      const wire = serializeEncryptedBlob(blob);
      const parsed = parseEncryptedBlob(wire);
      expect(parsed).toEqual(blob);
      expect(await decryptJson(parsed, 'k')).toEqual({ a: 1 });
    });

    it('parse rejeita JSON invalido', () => {
      expect(() => parseEncryptedBlob('nao-e-json')).toThrow(SyncCryptoError);
    });

    it('parse rejeita objeto sem forma de envelope', () => {
      expect(() => parseEncryptedBlob(JSON.stringify({ foo: 'bar' }))).toThrow(SyncCryptoError);
      expect(() => parseEncryptedBlob(JSON.stringify([1, 2, 3]))).toThrow(SyncCryptoError);
      expect(() => parseEncryptedBlob('null')).toThrow(SyncCryptoError);
    });

    it('parse rejeita envelope de versao futura', async () => {
      const blob = await encryptJson({ a: 1 }, 'k', FAST);
      const future = JSON.stringify({ ...blob, v: 999 });
      expect(() => parseEncryptedBlob(future)).toThrow(SyncCryptoError);
    });

    it('decrypt rejeita kdf desconhecido mesmo com shape valido', async () => {
      const blob = await encryptJson({ a: 1 }, 'k', FAST);
      const wrongKdf = JSON.stringify({ ...blob, kdf: 'ARGON2ID-FUTURO' });
      expect(() => parseEncryptedBlob(wrongKdf)).toThrow(SyncCryptoError);
    });
  });

  describe('iterations invalidas', () => {
    it('recusa iterations nao-inteiro ou < 1', async () => {
      await expect(encryptJson('x', 'k', { iterations: 0 })).rejects.toBeInstanceOf(SyncCryptoError);
      await expect(
        encryptJson('x', 'k', { iterations: 1.5 }),
      ).rejects.toBeInstanceOf(SyncCryptoError);
    });
  });

  describe('campos nao-base64 viram SyncCryptoError (nunca DOMException)', () => {
    it('decrypt rejeita salt/iv/ciphertext nao-base64', async () => {
      const blob = await encryptJson({ a: 1 }, 'k', FAST);
      await expect(decryptJson({ ...blob, salt: 'nao-base64!!!' }, 'k')).rejects.toBeInstanceOf(
        SyncCryptoError,
      );
      await expect(decryptJson({ ...blob, iv: '!!!!' }, 'k')).rejects.toBeInstanceOf(
        SyncCryptoError,
      );
      await expect(decryptJson({ ...blob, ciphertext: 'x.x.x' }, 'k')).rejects.toBeInstanceOf(
        SyncCryptoError,
      );
    });

    it('parse rejeita salt/iv/ciphertext nao-base64', async () => {
      const blob = await encryptJson({ a: 1 }, 'k', FAST);
      expect(() =>
        parseEncryptedBlob(JSON.stringify({ ...blob, salt: 'nao-base64!!!' })),
      ).toThrow(SyncCryptoError);
      expect(() => parseEncryptedBlob(JSON.stringify({ ...blob, iv: '!!!!' }))).toThrow(
        SyncCryptoError,
      );
      expect(() => parseEncryptedBlob(JSON.stringify({ ...blob, ciphertext: 'x.x.x' }))).toThrow(
        SyncCryptoError,
      );
    });
  });

  describe('anti-DoS: teto de iterations', () => {
    it('exporta MAX_PBKDF2_ITERATIONS = 2_000_000 mantendo DEFAULT 600_000', () => {
      expect(MAX_PBKDF2_ITERATIONS).toBe(2_000_000);
      expect(DEFAULT_PBKDF2_ITERATIONS).toBe(600_000);
    });

    it('decrypt rejeita iterations acima do teto ANTES de deriveKey (falha rapida)', async () => {
      const blob = await encryptJson({ a: 1 }, 'k', FAST);
      const abusive: EncryptedBlob = { ...blob, iterations: 50_000_000 };
      const start = Date.now();
      await expect(decryptJson(abusive, 'k')).rejects.toThrow(SyncCryptoError);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(2000);
    });

    it('decrypt rejeita iterations nao-inteiro do envelope', async () => {
      const blob = await encryptJson({ a: 1 }, 'k', FAST);
      await expect(decryptJson({ ...blob, iterations: 1.5 }, 'k')).rejects.toThrow(
        SyncCryptoError,
      );
    });

    it('parse rejeita envelope com iterations acima do teto', async () => {
      const blob = await encryptJson({ a: 1 }, 'k', FAST);
      const over = JSON.stringify({ ...blob, iterations: MAX_PBKDF2_ITERATIONS + 1 });
      expect(() => parseEncryptedBlob(over)).toThrow(SyncCryptoError);
    });

    it('encrypt recusa iterations acima do teto', async () => {
      await expect(
        encryptJson('x', 'k', { iterations: MAX_PBKDF2_ITERATIONS + 1 }),
      ).rejects.toThrow(SyncCryptoError);
    });
  });

  describe('valor nao-serializavel em JSON', () => {
    it('encryptJson(undefined) rejeita com SyncCryptoError (nao gera blob indecifrável)', async () => {
      await expect(encryptJson(undefined, 'k', FAST)).rejects.toBeInstanceOf(SyncCryptoError);
    });

    it('encryptJson de function/symbol rejeita com SyncCryptoError', async () => {
      await expect(encryptJson(() => 0, 'k', FAST)).rejects.toBeInstanceOf(SyncCryptoError);
      await expect(encryptJson(Symbol('s'), 'k', FAST)).rejects.toBeInstanceOf(SyncCryptoError);
    });
  });
});
