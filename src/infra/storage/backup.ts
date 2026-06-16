export const backupFormatName = 'lichess-tutor-backup' as const;
export const backupFormatVersion = 1 as const;

export type BackupData = {
  profile: unknown[];
  plans: unknown[];
  logs: unknown[];
  signals: unknown[];
  weaknesses: unknown[];
  methodTracks: unknown[];
  pendingItems: unknown[];
  diplomaAttempts: unknown[];
  // Opcionais para ler backups exportados antes do Corte 7 (conquistas e
  // placement persistido).
  achievements?: unknown[];
  placementResults?: unknown[];
  // Dados duráveis criados pelo usuário, adicionados no Corte F. Opcionais e
  // retrocompatíveis: backups antigos sem estes campos importam sem erro.
  lichessStudies?: unknown[];
  appMeta?: unknown[];
};

export const backupTableNames = [
  'profile',
  'plans',
  'logs',
  'signals',
  'weaknesses',
  'methodTracks',
  'pendingItems',
  'diplomaAttempts',
] as const satisfies readonly (keyof BackupData)[];

export type BackupFile = {
  format: typeof backupFormatName;
  version: typeof backupFormatVersion;
  exportedAt: string;
  checksum: string;
  data: BackupData;
};

type SubtleCryptoLike = {
  digest: (algorithm: string, data: BufferSource) => Promise<ArrayBuffer>;
};

function getSubtleCrypto(): SubtleCryptoLike | undefined {
  if (typeof globalThis.crypto === 'undefined') {
    return undefined;
  }

  // subtle so existe em contexto seguro (https/localhost); fora dele cai no fallback.
  const subtle: SubtleCryptoLike | undefined = globalThis.crypto.subtle;

  return subtle;
}

// Fallback nao-criptografico (FNV-1a) para contexto inseguro: detecta corrupcao
// acidental, nao adulteracao. O prefixo do algoritmo fica gravado no checksum.
function fnv1a(text: string): string {
  let hash = 0x811c9dc5;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  return hash.toString(16).padStart(8, '0');
}

export type BackupChecksumAlgorithm = 'sha256' | 'fnv1a';

export async function computeBackupChecksum(
  serializedData: string,
  algorithm?: BackupChecksumAlgorithm,
): Promise<string> {
  const subtle = getSubtleCrypto();
  const chosen = algorithm ?? (subtle === undefined ? 'fnv1a' : 'sha256');

  if (chosen === 'fnv1a' || subtle === undefined) {
    return `fnv1a:${fnv1a(serializedData)}`;
  }

  const digest = await subtle.digest('SHA-256', new TextEncoder().encode(serializedData));
  const hex = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');

  return `sha256:${hex}`;
}

export async function createBackupFile(data: BackupData, exportedAt: string): Promise<BackupFile> {
  return {
    format: backupFormatName,
    version: backupFormatVersion,
    exportedAt,
    checksum: await computeBackupChecksum(JSON.stringify(data)),
    data,
  };
}

export function countBackupRecords(data: BackupData): number {
  const required = backupTableNames.reduce((total, table) => total + data[table].length, 0);

  return (
    required +
    (data.achievements?.length ?? 0) +
    (data.placementResults?.length ?? 0) +
    (data.lichessStudies?.length ?? 0) +
    (data.appMeta?.length ?? 0)
  );
}

function isObj(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function entityError(table: string, index: number, field: string): string {
  return `${table}[${String(index)}]: campo "${field}" ausente ou inválido.`;
}

// Chave primária do Dexie: precisa ser string não-vazia. Um id em branco
// (string vazia) é tipo válido mas corrompe o registro ao gravar.
function isValidId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isPendingItemStatus(value: unknown): value is 'open' | 'done' | 'deferred' {
  return value === 'open' || value === 'done' || value === 'deferred';
}

export function validateBackupData(data: BackupData): string | null {
  for (const [i, item] of data.profile.entries()) {
    if (!isObj(item) || typeof item.band !== 'string' || typeof item.updatedAt !== 'string') {
      return entityError('profile', i, 'band" ou "updatedAt');
    }
  }

  // DailyPlan usa date como chave primaria no Dexie — nao ha campo id separado.
  const dateRe = /^\d{4}-\d{2}-\d{2}$/;

  for (const [i, item] of data.plans.entries()) {
    if (!isObj(item) || typeof item.date !== 'string' || !dateRe.test(item.date)) {
      return entityError('plans', i, 'date');
    }
    if (!Array.isArray(item.blocks)) {
      return entityError('plans', i, 'blocks');
    }
  }

  // elapsedSeconds e completedAt sao opcionais em TrainingLog (sessao ativa nao tem ainda).
  for (const [i, item] of data.logs.entries()) {
    if (!isObj(item) || !isValidId(item.id)) {
      return entityError('logs', i, 'id');
    }
    if (typeof item.startedAt !== 'string') {
      return entityError('logs', i, 'startedAt');
    }
  }

  for (const [i, item] of data.signals.entries()) {
    if (!isObj(item) || !isValidId(item.id)) {
      return entityError('signals', i, 'id');
    }
    if (typeof item.kind !== 'string' || item.kind.length === 0) {
      return entityError('signals', i, 'kind');
    }
  }

  for (const [i, item] of data.weaknesses.entries()) {
    if (!isObj(item) || !isValidId(item.id)) {
      return entityError('weaknesses', i, 'id');
    }
    if (typeof item.tag !== 'string' || item.tag.length === 0) {
      return entityError('weaknesses', i, 'tag');
    }
  }

  for (const [i, item] of data.methodTracks.entries()) {
    if (!isObj(item) || !isValidId(item.id)) {
      return entityError('methodTracks', i, 'id');
    }
  }

  for (const [i, item] of data.pendingItems.entries()) {
    if (!isObj(item) || !isValidId(item.id)) {
      return entityError('pendingItems', i, 'id');
    }
    if (!isPendingItemStatus(item.status)) {
      return entityError('pendingItems', i, 'status');
    }
  }

  for (const [i, item] of data.diplomaAttempts.entries()) {
    if (!isObj(item) || !isValidId(item.id)) {
      return entityError('diplomaAttempts', i, 'id');
    }
  }

  if (data.achievements !== undefined) {
    for (const [i, item] of data.achievements.entries()) {
      if (!isObj(item) || !isValidId(item.id)) {
        return entityError('achievements', i, 'id');
      }
      if (typeof item.unlockedAt !== 'string') {
        return entityError('achievements', i, 'unlockedAt');
      }
    }
  }

  if (data.placementResults !== undefined) {
    for (const [i, item] of data.placementResults.entries()) {
      if (!isObj(item) || !isValidId(item.id)) {
        return entityError('placementResults', i, 'id');
      }
    }
  }

  if (data.lichessStudies !== undefined) {
    for (const [i, item] of data.lichessStudies.entries()) {
      if (!isObj(item) || !isValidId(item.id)) {
        return entityError('lichessStudies', i, 'id');
      }
      if (typeof item.studyId !== 'string') {
        return entityError('lichessStudies', i, 'studyId');
      }
    }
  }

  if (data.appMeta !== undefined) {
    for (const [i, item] of data.appMeta.entries()) {
      if (!isObj(item) || !isValidId(item.id)) {
        return entityError('appMeta', i, 'id');
      }
    }
  }

  return null;
}

export type ParsedBackup = { ok: true; file: BackupFile } | { ok: false; error: string };

export async function parseBackupFile(json: string): Promise<ParsedBackup> {
  let raw: unknown;

  try {
    raw = JSON.parse(json);
  } catch {
    return { ok: false, error: 'O arquivo não é um JSON válido.' };
  }

  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, error: 'O arquivo não tem a estrutura de um backup.' };
  }

  const candidate = raw as Record<string, unknown>;

  if (candidate.format !== backupFormatName) {
    return { ok: false, error: 'O arquivo não é um backup do lichess-tutor.' };
  }

  if (candidate.version !== backupFormatVersion) {
    return {
      ok: false,
      error: `Versão de backup não suportada: ${String(candidate.version)}. Esta versão do app lê backups v${String(backupFormatVersion)}.`,
    };
  }

  if (typeof candidate.exportedAt !== 'string' || typeof candidate.checksum !== 'string') {
    return { ok: false, error: 'O backup não tem data de exportação ou checksum.' };
  }

  const data: unknown = candidate.data;

  if (typeof data !== 'object' || data === null) {
    return { ok: false, error: 'O backup não contém dados.' };
  }

  const dataRecord = data as Record<string, unknown>;

  for (const table of backupTableNames) {
    if (!Array.isArray(dataRecord[table])) {
      return { ok: false, error: `O backup está incompleto: tabela "${table}" ausente ou inválida.` };
    }
  }

  const algorithm: BackupChecksumAlgorithm = candidate.checksum.startsWith('fnv1a:') ? 'fnv1a' : 'sha256';
  const recomputed = await computeBackupChecksum(JSON.stringify(data), algorithm);

  if (recomputed !== candidate.checksum) {
    return { ok: false, error: 'Checksum não confere: o arquivo pode estar corrompido ou alterado.' };
  }

  return {
    ok: true,
    file: {
      format: backupFormatName,
      version: backupFormatVersion,
      exportedAt: candidate.exportedAt,
      checksum: candidate.checksum,
      data: data as BackupData,
    },
  };
}
