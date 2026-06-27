import { learnerBands } from '../../domain/bands';
import { isAllowedLichessUrl } from '../lichess/urlPolicy';

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
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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

const MIN_BACKUP_DATE_MS = Date.UTC(2000, 0, 1);
const MAX_BACKUP_DATE_MS = Date.UTC(2150, 0, 1);

function isIsoDate(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  const ms = Date.parse(value);

  return !Number.isNaN(ms) && ms >= MIN_BACKUP_DATE_MS && ms <= MAX_BACKUP_DATE_MS;
}

function isCalendarDate(value: unknown): boolean {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parts = value.split('-');
  const [rawYear, rawMonth, rawDay] = parts;
  const year = Number(rawYear);
  const month = Number(rawMonth);
  const day = Number(rawDay);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    isIsoDate(date.toISOString())
  );
}

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isCount(value: unknown): value is number {
  return isFiniteNonNegative(value) && Number.isInteger(value);
}

function isRate(value: unknown): value is number {
  return isFiniteNonNegative(value) && value <= 1;
}

function isPercent(value: unknown): value is number {
  return isFiniteNonNegative(value) && value <= 100;
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

const SOURCE_IDS = ['lichess', 'chesscom', 'outro'] as const;
const CONFIDENCES = ['low', 'medium', 'high'] as const;
const SESSION_MINUTES = [5, 15, 30, 60] as const;
const SIGNAL_KINDS = [
  'rating',
  'opening',
  'time-control',
  'color',
  'judgment',
  'clock',
  'accuracy',
  'manual',
  'puzzle-perf',
] as const;
const LEGACY_BANDS = ['0-800', '800-1200'] as const;
const METHOD_TRACK_IDS = [
  'pending-review',
  'calculation-bridge',
  'active-defense',
  'opening-as-plan',
  'progress-diplomas',
] as const;
const DIPLOMA_IDS = ['peao', 'torre', 'rei'] as const;
const DIPLOMA_SOURCES = ['local', 'lichess'] as const;
const LOG_STATUSES = ['active', 'done', 'skipped'] as const;
const BLOCK_STATUSES = ['pending', 'done', 'skipped'] as const;
const METHOD_TRACK_STATUSES = ['active', 'review', 'paused', 'completed'] as const;
const PENDING_ORIGINS = ['puzzle', 'game-review', 'manual', 'diploma'] as const;
const FEEDBACKS = ['easy', 'good', 'hard'] as const;
const LOG_KINDS = ['puzzle', 'free-activity', 'standard'] as const;
const STUDY_VISIBILITY = ['private', 'unlisted'] as const;

function isAmong<T extends string>(list: readonly T[]): (value: unknown) => value is T {
  return (value: unknown): value is T => typeof value === 'string' && (list as readonly string[]).includes(value);
}

const isSourceId = isAmong(SOURCE_IDS);
const isConfidence = isAmong(CONFIDENCES);
const isSignalKind = isAmong(SIGNAL_KINDS);
const isMethodTrackId = isAmong(METHOD_TRACK_IDS);
const isDiplomaId = isAmong(DIPLOMA_IDS);
const isDiplomaSource = isAmong(DIPLOMA_SOURCES);
const isLogStatus = isAmong(LOG_STATUSES);
const isBlockStatus = isAmong(BLOCK_STATUSES);
const isMethodTrackStatus = isAmong(METHOD_TRACK_STATUSES);
const isPendingOrigin = isAmong(PENDING_ORIGINS);
const isFeedback = isAmong(FEEDBACKS);
const isLogKind = isAmong(LOG_KINDS);
const isStudyVisibility = isAmong(STUDY_VISIBILITY);

function isProfileBand(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  return (learnerBands as readonly string[]).includes(value) || (LEGACY_BANDS as readonly string[]).includes(value);
}

function isSessionMinutes(value: unknown): boolean {
  return typeof value === 'number' && (SESSION_MINUTES as readonly number[]).includes(value);
}

function ifPresent(value: unknown, ok: (value: unknown) => boolean): boolean {
  return value === undefined || ok(value);
}

function signalValueNumericError(value: Record<string, unknown>): string | null {
  const kind = value.kind;

  switch (kind) {
    case 'rating':
      if (!isFiniteNonNegative(value.rating)) {
        return 'rating';
      }

      return null;
    case 'opening':
    case 'time-control':
    case 'color':
      if (!ifPresent(value.games, isCount)) {
        return 'games';
      }
      if (!ifPresent(value.lossRate, isRate)) {
        return 'lossRate';
      }

      return null;
    case 'judgment':
      if (!ifPresent(value.games, isCount)) {
        return 'games';
      }
      if (!ifPresent(value.blunders, isCount)) {
        return 'blunders';
      }
      if (!ifPresent(value.mistakes, isCount)) {
        return 'mistakes';
      }
      if (!ifPresent(value.inaccuracies, isCount)) {
        return 'inaccuracies';
      }
      if (!ifPresent(value.acpl, isFiniteNonNegative)) {
        return 'acpl';
      }

      return null;
    case 'clock':
      if (!ifPresent(value.games, isCount)) {
        return 'games';
      }
      if (!ifPresent(value.timeoutLosses, isCount)) {
        return 'timeoutLosses';
      }

      return null;
    case 'accuracy':
      if (!ifPresent(value.games, isCount)) {
        return 'games';
      }
      if (!ifPresent(value.lowAccuracyGames, isCount)) {
        return 'lowAccuracyGames';
      }

      return null;
    case 'puzzle-perf':
      if (!ifPresent(value.games, isCount)) {
        return 'games';
      }
      if (!isFiniteNonNegative(value.rating)) {
        return 'rating';
      }

      return null;
    default:
      return null;
  }
}

function duplicateKey(table: string, items: unknown[], key: string): string | null {
  const seen = new Set<string>();

  for (const [i, item] of items.entries()) {
    if (!isObj(item) || !isValidId(item[key])) {
      continue;
    }
    const pk = item[key];

    if (seen.has(pk)) {
      return `${table}: chave primária duplicada em ${table}[${String(i)}] ("${key}"="${pk}").`;
    }
    seen.add(pk);
  }

  return null;
}

export function validateBackupData(data: BackupData): string | null {
  const requiredDupChecks: ReadonlyArray<readonly [string, unknown[], string]> = [
    ['profile', data.profile, 'id'],
    ['plans', data.plans, 'date'],
    ['logs', data.logs, 'id'],
    ['signals', data.signals, 'id'],
    ['weaknesses', data.weaknesses, 'id'],
    ['methodTracks', data.methodTracks, 'id'],
    ['pendingItems', data.pendingItems, 'id'],
    ['diplomaAttempts', data.diplomaAttempts, 'id'],
  ];

  for (const [table, items, key] of requiredDupChecks) {
    const dup = duplicateKey(table, items, key);

    if (dup !== null) {
      return dup;
    }
  }

  const optionalDupChecks: ReadonlyArray<readonly [string, unknown[] | undefined]> = [
    ['achievements', data.achievements],
    ['placementResults', data.placementResults],
    ['lichessStudies', data.lichessStudies],
    ['appMeta', data.appMeta],
  ];

  for (const [table, items] of optionalDupChecks) {
    if (items !== undefined) {
      const dup = duplicateKey(table, items, 'id');

      if (dup !== null) {
        return dup;
      }
    }
  }

  for (const [i, item] of data.profile.entries()) {
    if (!isObj(item) || !isValidId(item.id)) {
      return entityError('profile', i, 'id');
    }
    if (!isProfileBand(item.band) || !isIsoDate(item.updatedAt)) {
      return entityError('profile', i, 'band" ou "updatedAt');
    }
    if (!ifPresent(item.defaultSessionMinutes, isSessionMinutes)) {
      return entityError('profile', i, 'defaultSessionMinutes');
    }
  }

  for (const [i, item] of data.plans.entries()) {
    if (!isObj(item) || !isCalendarDate(item.date)) {
      return entityError('plans', i, 'date');
    }
    if (!Array.isArray(item.blocks)) {
      return entityError('plans', i, 'blocks');
    }
    for (const [blockIndex, block] of item.blocks.entries()) {
      if (!isObj(block)) {
        return entityError('plans', i, `blocks[${String(blockIndex)}]`);
      }
      if (!ifPresent(block.status, isBlockStatus)) {
        return entityError('plans', i, `blocks[${String(blockIndex)}].status`);
      }
      if (!ifPresent(block.feedback, isFeedback)) {
        return entityError('plans', i, `blocks[${String(blockIndex)}].feedback`);
      }
      if (!ifPresent(block.methodTrackId, isMethodTrackId)) {
        return entityError('plans', i, `blocks[${String(blockIndex)}].methodTrackId`);
      }

      const destination = block.destination;

      if (destination !== undefined) {
        if (!isObj(destination)) {
          return entityError('plans', i, `blocks[${String(blockIndex)}].destination`);
        }
        if (destination.url !== undefined) {
          if (typeof destination.url !== 'string' || !isAllowedLichessUrl(destination.url)) {
            return entityError('plans', i, `blocks[${String(blockIndex)}].destination.url`);
          }
        }
      }
    }
  }

  for (const [i, item] of data.logs.entries()) {
    if (!isObj(item) || !isValidId(item.id)) {
      return entityError('logs', i, 'id');
    }
    if (!isIsoDate(item.startedAt)) {
      return entityError('logs', i, 'startedAt');
    }
    if (!ifPresent(item.completedAt, isIsoDate)) {
      return entityError('logs', i, 'completedAt');
    }
    if (!ifPresent(item.status, isLogStatus)) {
      return entityError('logs', i, 'status');
    }
    if (!ifPresent(item.logKind, isLogKind)) {
      return entityError('logs', i, 'logKind');
    }
    if (!ifPresent(item.source, isSourceId)) {
      return entityError('logs', i, 'source');
    }
    if (!ifPresent(item.plannedSeconds, isCount)) {
      return entityError('logs', i, 'plannedSeconds');
    }
    if (!ifPresent(item.elapsedSeconds, isCount)) {
      return entityError('logs', i, 'elapsedSeconds');
    }
    if (!ifPresent(item.feedback, isFeedback)) {
      return entityError('logs', i, 'feedback');
    }
    if (!ifPresent(item.methodTrackId, isMethodTrackId)) {
      return entityError('logs', i, 'methodTrackId');
    }
  }

  for (const [i, item] of data.signals.entries()) {
    if (!isObj(item) || !isValidId(item.id)) {
      return entityError('signals', i, 'id');
    }
    if (!isIsoDate(item.observedAt)) {
      return entityError('signals', i, 'observedAt');
    }
    if (!ifPresent(item.source, isSourceId)) {
      return entityError('signals', i, 'source');
    }
    if (!ifPresent(item.confidence, isConfidence)) {
      return entityError('signals', i, 'confidence');
    }
    // O discriminador do Signal vive em value.kind (Signal = { source, value:{kind}, ... });
    // nao ha "kind" no topo. Validar o caminho real evita rejeitar um backup legitimo.
    if (!isObj(item.value)) {
      return entityError('signals', i, 'value');
    }
    if (!isSignalKind(item.value.kind)) {
      return entityError('signals', i, 'value.kind');
    }
    const badNumeric = signalValueNumericError(item.value);

    if (badNumeric !== null) {
      return entityError('signals', i, `value.${badNumeric}`);
    }
  }

  for (const [i, item] of data.weaknesses.entries()) {
    if (!isObj(item) || !isValidId(item.id)) {
      return entityError('weaknesses', i, 'id');
    }
    if (typeof item.tag !== 'string' || item.tag.length === 0) {
      return entityError('weaknesses', i, 'tag');
    }
    if (!ifPresent(item.confidence, isConfidence)) {
      return entityError('weaknesses', i, 'confidence');
    }
    if (!ifPresent(item.score, isRate)) {
      return entityError('weaknesses', i, 'score');
    }
    if (!ifPresent(item.observedAt, isIsoDate)) {
      return entityError('weaknesses', i, 'observedAt');
    }
  }

  for (const [i, item] of data.methodTracks.entries()) {
    if (!isObj(item) || !isMethodTrackId(item.id)) {
      return entityError('methodTracks', i, 'id');
    }
    if (!ifPresent(item.status, isMethodTrackStatus)) {
      return entityError('methodTracks', i, 'status');
    }
    if (!ifPresent(item.startedAt, isIsoDate)) {
      return entityError('methodTracks', i, 'startedAt');
    }
    if (!ifPresent(item.updatedAt, isIsoDate)) {
      return entityError('methodTracks', i, 'updatedAt');
    }
  }

  for (const [i, item] of data.pendingItems.entries()) {
    if (!isObj(item) || !isValidId(item.id)) {
      return entityError('pendingItems', i, 'id');
    }
    if (!isPendingItemStatus(item.status)) {
      return entityError('pendingItems', i, 'status');
    }
    if (!ifPresent(item.origin, isPendingOrigin)) {
      return entityError('pendingItems', i, 'origin');
    }
    if (!ifPresent(item.methodTrackId, isMethodTrackId)) {
      return entityError('pendingItems', i, 'methodTrackId');
    }
    if (item.lichessUrl !== undefined && (typeof item.lichessUrl !== 'string' || !isAllowedLichessUrl(item.lichessUrl))) {
      return entityError('pendingItems', i, 'lichessUrl');
    }
    if (!ifPresent(item.attempts, isCount)) {
      return entityError('pendingItems', i, 'attempts');
    }
    if (!ifPresent(item.dueAt, isIsoDate)) {
      return entityError('pendingItems', i, 'dueAt');
    }
    if (!ifPresent(item.createdAt, isIsoDate)) {
      return entityError('pendingItems', i, 'createdAt');
    }
    if (!ifPresent(item.updatedAt, isIsoDate)) {
      return entityError('pendingItems', i, 'updatedAt');
    }
  }

  for (const [i, item] of data.diplomaAttempts.entries()) {
    if (!isObj(item) || !isValidId(item.id)) {
      return entityError('diplomaAttempts', i, 'id');
    }
    if (!ifPresent(item.diplomaId, isDiplomaId)) {
      return entityError('diplomaAttempts', i, 'diplomaId');
    }
    if (!ifPresent(item.source, isDiplomaSource)) {
      return entityError('diplomaAttempts', i, 'source');
    }
    if (!ifPresent(item.scorePercent, isPercent)) {
      return entityError('diplomaAttempts', i, 'scorePercent');
    }
    if (!ifPresent(item.totalItems, isCount)) {
      return entityError('diplomaAttempts', i, 'totalItems');
    }
    if (!ifPresent(item.passed, isBoolean)) {
      return entityError('diplomaAttempts', i, 'passed');
    }
    if (!ifPresent(item.createdAt, isIsoDate)) {
      return entityError('diplomaAttempts', i, 'createdAt');
    }
    if (!ifPresent(item.updatedAt, isIsoDate)) {
      return entityError('diplomaAttempts', i, 'updatedAt');
    }
  }

  if (data.achievements !== undefined) {
    for (const [i, item] of data.achievements.entries()) {
      if (!isObj(item) || !isValidId(item.id)) {
        return entityError('achievements', i, 'id');
      }
      if (!isIsoDate(item.unlockedAt)) {
        return entityError('achievements', i, 'unlockedAt');
      }
      if (!ifPresent(item.updatedAt, isIsoDate)) {
        return entityError('achievements', i, 'updatedAt');
      }
    }
  }

  if (data.placementResults !== undefined) {
    for (const [i, item] of data.placementResults.entries()) {
      if (!isObj(item) || !isValidId(item.id)) {
        return entityError('placementResults', i, 'id');
      }
      if (!ifPresent(item.completedAt, isIsoDate)) {
        return entityError('placementResults', i, 'completedAt');
      }
      if (!ifPresent(item.confidence, isConfidence)) {
        return entityError('placementResults', i, 'confidence');
      }
      if (!ifPresent(item.calibrated, isBoolean)) {
        return entityError('placementResults', i, 'calibrated');
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
      if (typeof item.url !== 'string' || !isAllowedLichessUrl(item.url)) {
        return entityError('lichessStudies', i, 'url');
      }
      if (!ifPresent(item.date, isCalendarDate)) {
        return entityError('lichessStudies', i, 'date');
      }
      if (!ifPresent(item.visibility, isStudyVisibility)) {
        return entityError('lichessStudies', i, 'visibility');
      }
    }
  }

  if (data.appMeta !== undefined) {
    for (const [i, item] of data.appMeta.entries()) {
      if (!isObj(item) || !isValidId(item.id)) {
        return entityError('appMeta', i, 'id');
      }
      if (!ifPresent(item.updatedAt, isIsoDate)) {
        return entityError('appMeta', i, 'updatedAt');
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
