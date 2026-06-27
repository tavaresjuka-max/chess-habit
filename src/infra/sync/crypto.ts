export const ENVELOPE_VERSION = 1 as const;
export const PBKDF2_HASH = 'SHA-256';

export const DEFAULT_PBKDF2_ITERATIONS = 600_000;
export const MAX_PBKDF2_ITERATIONS = 2_000_000;

const SALT_BYTES = 16;
const IV_BYTES = 12;
const AES_KEY_LENGTH = 256;
const B64_RE = /^[A-Za-z0-9+/]+={0,2}$/;

export type KdfName = 'PBKDF2-SHA256';

export interface EncryptedBlob {
  readonly v: typeof ENVELOPE_VERSION;
  readonly kdf: KdfName;
  readonly iterations: number;
  readonly salt: string;
  readonly iv: string;
  readonly ciphertext: string;
}

export interface EncryptOptions {
  readonly iterations?: number;
}

export class SyncCryptoError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'SyncCryptoError';
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  const parts: string[] = [];
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const slice = bytes.subarray(i, i + CHUNK);
    let chunk = '';
    for (const byte of slice) {
      chunk += String.fromCharCode(byte);
    }
    parts.push(chunk);
  }
  return btoa(parts.join(''));
}

function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function encodeText(value: string): Uint8Array<ArrayBuffer> {
  return new Uint8Array(new TextEncoder().encode(value));
}

function decodeText(bytes: Uint8Array<ArrayBuffer>): string {
  return new TextDecoder().decode(bytes);
}

function assertWebCryptoAvailable(): void {
  const root = globalThis as unknown as { crypto?: { subtle?: unknown } };
  if (root.crypto === undefined || root.crypto.subtle === undefined) {
    throw new SyncCryptoError(
      'WebCrypto SubtleCrypto indisponivel (contexto inseguro ou ambiente sem suporte).',
    );
  }
}

function getSubtle(): SubtleCrypto {
  assertWebCryptoAvailable();
  return globalThis.crypto.subtle;
}

function getRandom(bytes: number): Uint8Array<ArrayBuffer> {
  assertWebCryptoAvailable();
  return globalThis.crypto.getRandomValues(new Uint8Array(bytes));
}

async function deriveKey(
  passphrase: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
): Promise<CryptoKey> {
  const subtle = getSubtle();
  const keyMaterial = await subtle.importKey(
    'raw',
    encodeText(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );
  return subtle.deriveKey(
    { name: 'PBKDF2', hash: PBKDF2_HASH, salt, iterations },
    keyMaterial,
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    false,
    ['encrypt', 'decrypt'],
  );
}

function requirePassphrase(passphrase: string): void {
  if (typeof passphrase !== 'string' || passphrase.length === 0) {
    throw new SyncCryptoError('passphrase e obrigatoria e nao pode ser vazia.');
  }
}

function resolveIterations(input: number | undefined): number {
  const iterations = input ?? DEFAULT_PBKDF2_ITERATIONS;
  assertIterations(iterations);
  return iterations;
}

function assertIterations(iterations: number): void {
  if (!Number.isInteger(iterations) || iterations < 1) {
    throw new SyncCryptoError('iterations deve ser um inteiro positivo.');
  }
  if (iterations > MAX_PBKDF2_ITERATIONS) {
    throw new SyncCryptoError(
      `iterations excede o teto anti-DoS (${String(MAX_PBKDF2_ITERATIONS)}).`,
    );
  }
}

function isBase64Field(value: string): boolean {
  return value.length > 0 && B64_RE.test(value) && value.length % 4 === 0;
}

function decodeBase64Field(field: string, name: string): Uint8Array<ArrayBuffer> {
  if (!isBase64Field(field)) {
    throw new SyncCryptoError(`campo ${name} nao e base64 valido.`);
  }
  try {
    return base64ToBytes(field);
  } catch (err) {
    throw new SyncCryptoError(`campo ${name} nao e base64 valido.`, { cause: err });
  }
}

export async function encryptJson(
  value: unknown,
  passphrase: string,
  options?: EncryptOptions,
): Promise<EncryptedBlob> {
  requirePassphrase(passphrase);
  const iterations = resolveIterations(options?.iterations);
  const json = JSON.stringify(value) as string | undefined;
  if (json === undefined) {
    throw new SyncCryptoError(
      'valor nao serializavel em JSON (undefined/function/symbol).',
    );
  }
  const salt = getRandom(SALT_BYTES);
  const iv = getRandom(IV_BYTES);
  const key = await deriveKey(passphrase, salt, iterations);
  const plaintext = encodeText(json);
  const cipherBuffer = await getSubtle().encrypt({ name: 'AES-GCM', iv }, key, plaintext);
  return {
    v: ENVELOPE_VERSION,
    kdf: 'PBKDF2-SHA256',
    iterations,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(cipherBuffer)),
  };
}

export async function decryptJson<T = unknown>(
  blob: EncryptedBlob,
  passphrase: string,
): Promise<T> {
  requirePassphrase(passphrase);
  assertIterations(blob.iterations);
  const salt = decodeBase64Field(blob.salt, 'salt');
  const iv = decodeBase64Field(blob.iv, 'iv');
  const cipher = decodeBase64Field(blob.ciphertext, 'ciphertext');
  const key = await deriveKey(passphrase, salt, blob.iterations);
  let plainBuffer: ArrayBuffer;
  try {
    plainBuffer = await getSubtle().decrypt({ name: 'AES-GCM', iv }, key, cipher);
  } catch (err) {
    throw new SyncCryptoError('passphrase incorreta ou blob corrompido.', { cause: err });
  }
  return JSON.parse(decodeText(new Uint8Array(plainBuffer))) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isEncryptedBlob(value: unknown): value is EncryptedBlob {
  if (!isRecord(value)) return false;
  const v = value['v'];
  const kdf = value['kdf'];
  const iterations = value['iterations'];
  const salt = value['salt'];
  const iv = value['iv'];
  const ciphertext = value['ciphertext'];
  return (
    v === ENVELOPE_VERSION &&
    kdf === 'PBKDF2-SHA256' &&
    typeof iterations === 'number' &&
    Number.isInteger(iterations) &&
    iterations >= 1 &&
    iterations <= MAX_PBKDF2_ITERATIONS &&
    typeof salt === 'string' &&
    isBase64Field(salt) &&
    typeof iv === 'string' &&
    isBase64Field(iv) &&
    typeof ciphertext === 'string' &&
    isBase64Field(ciphertext)
  );
}

export function serializeEncryptedBlob(blob: EncryptedBlob): string {
  return JSON.stringify(blob);
}

export function parseEncryptedBlob(serialized: string): EncryptedBlob {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch (err) {
    throw new SyncCryptoError('blob serializado nao e JSON valido.', { cause: err });
  }
  if (!isEncryptedBlob(parsed)) {
    throw new SyncCryptoError('blob serializado nao tem o formato de envelope esperado.');
  }
  return parsed;
}
