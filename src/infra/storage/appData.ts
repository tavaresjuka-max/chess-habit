import type {
  DailyPlan,
  LearnerProfile,
  LichessOAuthToken,
  LichessStudyLink,
  Signal,
  SourceId,
  TrainingLog,
  Weakness,
} from '../../domain';
import type { DiplomaAttempt, MethodTrack, PendingTrainingItem } from '../../domain/method/types';
import type { Achievement, AchievementId, PlacementCompletion } from '../../domain/badges/evaluateAchievements';
import type { ChesscomMonthCache } from '../chesscom/chesscomClient';
import { countBackupRecords, createBackupFile, parseBackupFile, validateBackupData, type BackupData } from './backup';
import {
  db,
  type AchievementRecord,
  type PlacementResultRecord,
  type AutoBackupConfigRecord,
  type BackupMetaRecord,
  type DiplomaAttemptRecord,
  type AppMetaRecord,
  type ErrorLogRecord,
  type LearningLogRecord,
  type LichessOAuthTokenRecord,
  type LichessStudyLinkRecord,
  type MethodTrackRecord,
  type PendingItemRecord,
  type PlanRecord,
  type ProfileRecord,
  type SignalRecord,
  type WeaknessRecord,
} from './db';
import { QUOTA_EXCEEDED_MESSAGE, isQuotaExceeded } from './quotaError';

const defaultProfileId: ProfileRecord['id'] = 'default';
const lichessTokenId: LichessOAuthTokenRecord['id'] = 'lichess';

export async function loadProfile(): Promise<LearnerProfile | undefined> {
  const record = await db.profile.get(defaultProfileId);

  if (record === undefined) {
    return undefined;
  }

  return {
    lichessUsername: record.lichessUsername,
    chesscomUsername: record.chesscomUsername,
    band: record.band,
    defaultSessionMinutes: record.defaultSessionMinutes,
    goals: record.goals,
    // themeStages (PED-3) precisa voltar do storage, senão o estagio por tema
    // persistido se perde no reload e o plano cai sempre em 'guided'.
    ...(record.themeStages === undefined ? {} : { themeStages: record.themeStages }),
    updatedAt: record.updatedAt,
  };
}

export async function saveProfile(profile: LearnerProfile): Promise<void> {
  await db.profile.put({
    ...profile,
    id: defaultProfileId,
  });
}

export async function savePlan(plan: DailyPlan): Promise<void> {
  await db.plans.put(plan);
}

export async function saveProfileAndPlan(profile: LearnerProfile, plan: DailyPlan): Promise<void> {
  await db.transaction('rw', [db.profile, db.plans], async () => {
    await db.profile.put({
      ...profile,
      id: defaultProfileId,
    });
    await db.plans.put(plan);
  });
}

export async function getPlan(date: string): Promise<DailyPlan | undefined> {
  return db.plans.get(date);
}

export async function getLatestPlanBefore(date: string): Promise<DailyPlan | undefined> {
  return db.plans.where('date').below(date).reverse().first();
}

export async function saveTrainingLog(log: TrainingLog): Promise<void> {
  await db.logs.put(log);
}

// Persiste log e plano numa única transação: o status do bloco (no plano) e o
// log que o comprova commitam juntos ou nenhum. Evita o estado corrompido de
// "bloco done com plano não salvo" se o app fechar entre as duas escritas.
export async function saveTrainingLogAndPlan(log: TrainingLog, plan: DailyPlan): Promise<void> {
  await db.transaction('rw', [db.logs, db.plans], async () => {
    await db.logs.put(log);
    await db.plans.put(plan);
  });
}

export async function saveTrainingLogsAndPlan(logs: TrainingLog[], plan: DailyPlan): Promise<void> {
  await db.transaction('rw', [db.logs, db.plans], async () => {
    await db.logs.bulkPut(logs);
    await db.plans.put(plan);
  });
}

export async function getTrainingLog(id: string): Promise<TrainingLog | undefined> {
  return db.logs.get(id);
}

export async function loadTrainingLogs(): Promise<TrainingLog[]> {
  return db.logs.toArray();
}

export async function loadTrainingLogsForDate(date: string): Promise<TrainingLog[]> {
  return db.logs.where('date').equals(date).toArray();
}

const softDeletePurgeDays = 90;

// Exportada para teste. UTC para ser independente de fuso (igual a addDays em
// pendingItems): com getDate/setDate LOCAIS o corte de 90d variava ±1 dia em
// fusos negativos (ex.: GMT-3), purgando sinais com 89 ou 91 dias. (B1, council)
export function getPurgeCutoff(nowIso: string): string {
  const cutoff = new Date(nowIso);

  cutoff.setUTCDate(cutoff.getUTCDate() - softDeletePurgeDays);

  return cutoff.toISOString();
}

export async function loadSignals(): Promise<Signal[]> {
  // Com ids UUID a ordem da chave primaria e aleatoria; ordenar por observedAt
  // mantem a ordem cronologica que o restante do app espera.
  const records = await db.signals.orderBy('observedAt').toArray();

  return records.filter((record) => record.deletedAt === undefined).map(fromSignalRecord);
}

// Substituicao logica, nao fisica: os registros antigos da fonte recebem
// deletedAt (soft delete) e so sao purgados apos 90 dias. Isso preserva o
// historico para merge por registro quando o sync (P4) for descongelado.
export async function replaceSignalsForSource(source: SourceId, signals: Signal[]): Promise<void> {
  const now = new Date().toISOString();
  const purgeCutoff = getPurgeCutoff(now);

  await db.transaction('rw', db.signals, async () => {
    await db.signals
      .where('source')
      .equals(source)
      .modify((record) => {
        if (record.deletedAt === undefined) {
          record.deletedAt = now;
          record.updatedAt = now;
        }
      });
    await db.signals
      .filter((record) => record.deletedAt !== undefined && record.deletedAt < purgeCutoff)
      .delete();
    await db.signals.bulkPut(signals.map((signal) => toSignalRecord(signal, now)));
  });
}

export async function appendSignals(signals: Signal[]): Promise<void> {
  if (signals.length === 0) {
    return;
  }

  const now = new Date().toISOString();

  await db.signals.bulkPut(signals.map((signal) => toSignalRecord(signal, now)));
}

export async function loadWeaknesses(): Promise<Weakness[]> {
  const records = await db.weaknesses.toArray();

  return records.filter((record) => record.deletedAt === undefined).map(fromWeaknessRecord);
}

// Upsert por tag (merge-key natural): tags que sairam do diagnostico recebem
// deletedAt; tags presentes sao regravadas sem deletedAt (revividas).
export async function replaceWeaknesses(weaknesses: Weakness[]): Promise<void> {
  const now = new Date().toISOString();
  const nextTags = new Set(weaknesses.map((weakness) => weakness.tag));

  await db.transaction('rw', db.weaknesses, async () => {
    await db.weaknesses.toCollection().modify((record) => {
      if (!nextTags.has(record.tag) && record.deletedAt === undefined) {
        record.deletedAt = now;
        record.updatedAt = now;
      }
    });
    await db.weaknesses.bulkPut(weaknesses.map((weakness) => toWeaknessRecord(weakness, now)));
  });
}

export async function loadChesscomMonthCache(id: string, nowIso: string): Promise<ChesscomMonthCache | undefined> {
  const record = await db.chesscomMonthSignals.get(id);

  if (record === undefined || record.expiresAt <= nowIso) {
    return undefined;
  }

  return record;
}

export async function saveChesscomMonthCache(record: ChesscomMonthCache): Promise<void> {
  await db.chesscomMonthSignals.put(record);
}

export async function loadLichessOAuthToken(nowIso = new Date().toISOString()): Promise<LichessOAuthToken | undefined> {
  const record = await db.lichessOAuthTokens.get(lichessTokenId);

  if (record === undefined) {
    return undefined;
  }

  if (record.expiresAt <= nowIso) {
    await clearLichessOAuthToken();
    return undefined;
  }

  return fromLichessOAuthTokenRecord(record);
}

export async function saveLichessOAuthToken(token: LichessOAuthToken): Promise<void> {
  await db.lichessOAuthTokens.put({
    ...token,
    id: lichessTokenId,
  });
}

export async function clearLichessOAuthToken(): Promise<void> {
  await db.lichessOAuthTokens.delete(lichessTokenId);
}

export async function getLichessStudyLink(date: string): Promise<LichessStudyLink | undefined> {
  return db.lichessStudies.get(date);
}

export async function saveLichessStudyLink(link: LichessStudyLink): Promise<void> {
  await db.lichessStudies.put(link);
}

export async function loadMethodTracks(): Promise<MethodTrack[]> {
  return db.methodTracks.toArray();
}

export async function saveMethodTrack(track: MethodTrack): Promise<void> {
  await db.methodTracks.put(track);
}

export async function loadOpenPendingItems(): Promise<PendingTrainingItem[]> {
  return db.pendingItems.where('status').equals('open').toArray();
}

export async function loadDonePendingItems(): Promise<PendingTrainingItem[]> {
  return db.pendingItems.where('status').equals('done').toArray();
}

export async function loadAchievements(): Promise<Achievement[]> {
  const records = await db.achievements.toArray();

  return records.map((record) => ({
    id: record.id as AchievementId,
    unlockedAt: record.unlockedAt,
  }));
}

export async function saveAchievements(achievements: Achievement[]): Promise<void> {
  if (achievements.length === 0) {
    return;
  }

  const now = new Date().toISOString();

  await db.achievements.bulkPut(
    achievements.map((achievement) => ({
      id: achievement.id,
      unlockedAt: achievement.unlockedAt,
      updatedAt: now,
    })),
  );
}

export type StoredPlacementResult = {
  band: string;
  confidence: PlacementCompletion['confidence'];
  calibrated: boolean;
  completedAt: string;
};

export async function savePlacementResult(result: StoredPlacementResult): Promise<void> {
  await db.placementResults.put({
    ...result,
    id: 'latest',
    updatedAt: new Date().toISOString(),
  });
}

export async function loadPlacementCompletion(): Promise<PlacementCompletion | undefined> {
  const record = await db.placementResults.get('latest');

  if (record === undefined) {
    return undefined;
  }

  return {
    confidence: record.confidence as PlacementCompletion['confidence'],
    calibrated: record.calibrated,
  };
}

export async function savePendingItem(item: PendingTrainingItem): Promise<void> {
  await db.pendingItems.put(item);
}

export async function updatePendingItemStatus(
  id: string,
  status: PendingTrainingItem['status'],
): Promise<void> {
  await db.pendingItems.update(id, {
    status,
    updatedAt: new Date().toISOString(),
  });
}

export async function loadDiplomaAttempts(): Promise<DiplomaAttempt[]> {
  return db.diplomaAttempts.toArray();
}

export async function saveDiplomaAttempt(attempt: DiplomaAttempt): Promise<void> {
  await db.diplomaAttempts.put(attempt);
}

// Grava varias tentativas de uma vez, de forma atomica: na promocao de banda o
// app avalia varios diplomas juntos; um put() por vez podia deixar o IndexedDB
// com diplomas parciais se o app fechasse no meio, causando re-avaliacao errada.
export async function saveDiplomaAttempts(attempts: DiplomaAttempt[]): Promise<void> {
  if (attempts.length === 0) {
    return;
  }

  await db.transaction('rw', db.diplomaAttempts, async () => {
    await db.diplomaAttempts.bulkPut(attempts);
  });
}

export async function exportAllAsJson(nowIso = new Date().toISOString()): Promise<string> {
  // Snapshot consistente: ler todas as tabelas dentro de uma transação 'r' evita
  // um export inconsistente se um sync de fundo escrever no meio da leitura.
  const data: BackupData = await db.transaction(
    'r',
    [
      db.profile,
      db.plans,
      db.logs,
      db.signals,
      db.weaknesses,
      db.methodTracks,
      db.pendingItems,
      db.diplomaAttempts,
      db.achievements,
      db.placementResults,
      db.lichessStudies,
      db.appMeta,
    ],
    async () => ({
      profile: await db.profile.toArray(),
      plans: await db.plans.toArray(),
      logs: await db.logs.toArray(),
      signals: await db.signals.toArray(),
      weaknesses: await db.weaknesses.toArray(),
      methodTracks: await db.methodTracks.toArray(),
      pendingItems: await db.pendingItems.toArray(),
      diplomaAttempts: await db.diplomaAttempts.toArray(),
      achievements: await db.achievements.toArray(),
      placementResults: await db.placementResults.toArray(),
      lichessStudies: await db.lichessStudies.toArray(),
      appMeta: await db.appMeta.toArray(),
    }),
  );

  const backupFile = await createBackupFile(data, nowIso);

  await db.backupMeta.put({
    id: 'last-export',
    exportedAt: backupFile.exportedAt,
    checksum: backupFile.checksum,
    recordCount: countBackupRecords(data),
  });

  return JSON.stringify(backupFile, null, 2);
}

export async function loadBackupMeta(): Promise<BackupMetaRecord | undefined> {
  return db.backupMeta.get('last-export');
}

// Funil de onboarding (primeira vez). Não entra no backup de propósito: ao
// restaurar com perfil + plano aprovado, a máquina de estados re-marca a
// conclusão sozinha; com plano ainda não aprovado, mostra só o passo de
// aprovar. Assim o funil completo nunca reaparece para quem já passou.
export async function loadOnboardingCompletedAt(): Promise<string | undefined> {
  const record = await db.appMeta.get('app');

  return record?.onboardingCompletedAt;
}

// read-merge-put em appMeta: NUNCA um put cego. markOnboardingCompleted antes
// fazia db.appMeta.put({ id:'app', onboardingCompletedAt, updatedAt }) — isso
// substituía o registro inteiro e APAGAVA adoptedAt/errorCaptureEnabled. Agora
// lê, funde preservando os campos existentes e só então grava.
export async function markOnboardingCompleted(nowIso = new Date().toISOString()): Promise<void> {
  const existing = await db.appMeta.get('app');

  await db.appMeta.put({
    id: 'app',
    ...(existing ?? {}),
    onboardingCompletedAt: nowIso,
    updatedAt: nowIso,
  });
}

// adoptedAt é WRITE-ONCE: lê o registro 'app'; se já tem adoptedAt, retorna sem
// reescrever (idempotente); senão grava PRESERVANDO onboardingCompletedAt e
// errorCaptureEnabled (read-merge-put, nunca put cego).
export async function loadAdoptedAt(): Promise<string | undefined> {
  const record = await db.appMeta.get('app');

  return record?.adoptedAt;
}

export async function captureAdoption(nowIso = new Date().toISOString()): Promise<void> {
  const existing = await db.appMeta.get('app');

  if (existing?.adoptedAt !== undefined) {
    return;
  }

  await db.appMeta.put({
    id: 'app',
    ...(existing ?? {}),
    adoptedAt: nowIso,
    updatedAt: nowIso,
  });
}

// --- Consentimento informado (Fase 3) ----------------------------------------
// consentedAt é WRITE-ONCE: só grava se ausente (igual adoptedAt).
// researchOptIn é um toggle: sobrescreve sempre, preservando os demais campos
// (read-merge-put).

export type ConsentState = {
  consentedAt?: string;
  researchOptIn?: boolean;
};

export async function loadConsent(): Promise<ConsentState> {
  const record = await db.appMeta.get('app');

  return {
    consentedAt: record?.consentedAt,
    researchOptIn: record?.researchOptIn,
  };
}

/**
 * Grava consentedAt (write-once) + researchOptIn.
 * read-merge-put: preserva adoptedAt, onboardingCompletedAt, errorCaptureEnabled.
 */
export async function saveConsent(
  researchOptIn: boolean,
  nowIso = new Date().toISOString(),
): Promise<void> {
  const existing = await db.appMeta.get('app');

  await db.appMeta.put({
    id: 'app',
    ...(existing ?? {}),
    // write-once: só grava consentedAt se ainda não existia
    consentedAt: existing?.consentedAt ?? nowIso,
    researchOptIn,
    updatedAt: nowIso,
  });
}

// --- Captura mínima de erros (opt-in, Fase 1) --------------------------------
// Flag opt-in: default ausente = desligado. read-merge-put preserva
// adoptedAt/onboardingCompletedAt ao ligar/desligar.
export async function loadErrorCaptureEnabled(): Promise<boolean> {
  const record = await db.appMeta.get('app');

  return record?.errorCaptureEnabled === true;
}

export async function setErrorCaptureEnabled(
  enabled: boolean,
  nowIso = new Date().toISOString(),
): Promise<void> {
  const existing = await db.appMeta.get('app');

  await db.appMeta.put({
    id: 'app',
    ...(existing ?? {}),
    errorCaptureEnabled: enabled,
    updatedAt: nowIso,
  });
}

export const errorLogCap = 100;

export type ErrorLogEntry = {
  kind: 'error' | 'unhandledrejection';
  message: string;
  stack?: string;
};

// Grava uma entrada no errorLog e mantém só as últimas `errorLogCap` (descarta
// as mais antigas pelo id auto-incremento, que é monotônico).
export async function appendErrorLog(
  entry: ErrorLogEntry,
  nowIso = new Date().toISOString(),
): Promise<number | undefined> {
  const record: ErrorLogRecord = {
    at: nowIso,
    kind: entry.kind,
    message: entry.message,
    ...(entry.stack === undefined ? {} : { stack: entry.stack }),
  };
  const id = await db.errorLog.add(record);
  const count = await db.errorLog.count();

  if (count > errorLogCap) {
    const overflow = count - errorLogCap;
    // toCollection() itera em ordem de chave primária (id ascendente); os
    // primeiros são os mais antigos.
    const oldestKeys = await db.errorLog.toCollection().limit(overflow).primaryKeys();

    await db.errorLog.bulkDelete(oldestKeys);
  }

  return id;
}

// Ponto de entrada dos handlers globais (main.tsx). Verifica a flag opt-in e só
// então grava. Tudo envolvido em try/catch: falha de gravação NUNCA pode quebrar
// o app (erro dentro de handler de erro = dupla falha silenciosa).
export async function recordGlobalError(
  entry: ErrorLogEntry,
  nowIso = new Date().toISOString(),
): Promise<void> {
  try {
    const enabled = await loadErrorCaptureEnabled();

    if (!enabled) {
      return;
    }

    await appendErrorLog(entry, nowIso);
  } catch {
    // Silencioso de propósito (ver acima).
  }
}

export async function loadErrorLog(): Promise<ErrorLogRecord[]> {
  return db.errorLog.orderBy('at').toArray();
}

export type ErrorLogExport = {
  format: 'lichess-tutor-errorlog';
  version: 1;
  exportedAt: string;
  records: ErrorLogRecord[];
};

export async function exportErrorLogAsJson(nowIso = new Date().toISOString()): Promise<string> {
  const records = await loadErrorLog();

  return JSON.stringify(
    {
      format: 'lichess-tutor-errorlog',
      version: 1,
      exportedAt: nowIso,
      records,
    } satisfies ErrorLogExport,
    null,
    2,
  );
}

export async function clearErrorLog(): Promise<void> {
  await db.errorLog.clear();
}

export async function loadAutoBackupConfig(): Promise<AutoBackupConfigRecord | undefined> {
  return db.autoBackup.get('config');
}

export async function saveAutoBackupConfig(
  config: Omit<AutoBackupConfigRecord, 'id' | 'updatedAt'>,
): Promise<void> {
  await db.autoBackup.put({
    ...config,
    id: 'config',
    updatedAt: new Date().toISOString(),
  });
}

export async function clearAutoBackupConfig(): Promise<void> {
  await db.autoBackup.delete('config');
}

export type BackupImportResult =
  | { ok: true; recordCount: number; exportedAt: string }
  | { ok: false; error: string };

export async function importBackupFromJson(json: string): Promise<BackupImportResult> {
  const parsed = await parseBackupFile(json);

  if (!parsed.ok) {
    return parsed;
  }

  const { data } = parsed.file;

  const shapeError = validateBackupData(data);

  if (shapeError !== null) {
    return { ok: false, error: `O backup contém dados inválidos: ${shapeError}` };
  }

  try {
    await db.transaction(
      'rw',
      [
        db.profile,
        db.plans,
        db.logs,
        db.signals,
        db.weaknesses,
        db.methodTracks,
        db.pendingItems,
        db.diplomaAttempts,
        db.achievements,
        db.placementResults,
        db.lichessStudies,
        db.appMeta,
        db.backupMeta,
      ],
      async () => {
        await db.profile.clear();
        await db.profile.bulkPut(data.profile as ProfileRecord[]);
        await db.plans.clear();
        await db.plans.bulkPut(data.plans as PlanRecord[]);
        await db.logs.clear();
        await db.logs.bulkPut(data.logs as LearningLogRecord[]);
        await db.signals.clear();
        await db.signals.bulkPut(data.signals as SignalRecord[]);
        await db.weaknesses.clear();
        await db.weaknesses.bulkPut(data.weaknesses as WeaknessRecord[]);
        await db.methodTracks.clear();
        await db.methodTracks.bulkPut(data.methodTracks as MethodTrackRecord[]);
        await db.pendingItems.clear();
        await db.pendingItems.bulkPut(data.pendingItems as PendingItemRecord[]);
        await db.diplomaAttempts.clear();
        await db.diplomaAttempts.bulkPut(data.diplomaAttempts as DiplomaAttemptRecord[]);
        await db.achievements.clear();
        // Backups antigos (pre-Corte 7) nao tem a tabela; importa como vazia.
        await db.achievements.bulkPut((data.achievements ?? []) as AchievementRecord[]);
        await db.placementResults.clear();
        await db.placementResults.bulkPut((data.placementResults ?? []) as PlacementResultRecord[]);
        await db.lichessStudies.clear();
        await db.lichessStudies.bulkPut((data.lichessStudies ?? []) as LichessStudyLinkRecord[]);
        await db.appMeta.clear();
        await db.appMeta.bulkPut((data.appMeta ?? []) as AppMetaRecord[]);
        // Os dados restaurados SAO o backup importado: o meta passa a refletir
        // esse arquivo, senao o lembrete de backup no Hoje mostra a data antiga
        // (de outro export/aparelho). autoBackup nao e tocado de proposito: e
        // config local do aparelho, nao faz parte do arquivo de backup.
        await db.backupMeta.put({
          id: 'last-export',
          exportedAt: parsed.file.exportedAt,
          checksum: parsed.file.checksum,
          recordCount: countBackupRecords(data),
        });
      },
    );
  } catch (err) {
    // Quota do IndexedDB: mensagem PT acionavel em vez do erro tecnico cru.
    // Demais erros seguem exatamente o caminho anterior (template com message).
    if (isQuotaExceeded(err)) {
      return { ok: false, error: QUOTA_EXCEEDED_MESSAGE };
    }
    return {
      ok: false,
      error: `Erro ao restaurar dados: ${err instanceof Error ? err.message : 'falha desconhecida'}.`,
    };
  }

  return {
    ok: true,
    recordCount: countBackupRecords(data),
    exportedAt: parsed.file.exportedAt,
  };
}

export async function clearAll(): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.profile,
      db.plans,
      db.logs,
      db.signals,
      db.weaknesses,
      db.chesscomMonthSignals,
      db.lichessOAuthTokens,
      db.lichessStudies,
      db.methodTracks,
      db.pendingItems,
      db.diplomaAttempts,
      db.backupMeta,
      db.autoBackup,
      db.achievements,
      db.placementResults,
      db.appMeta,
      db.errorLog,
    ],
    async () => {
      await db.profile.clear();
      await db.plans.clear();
      await db.logs.clear();
      await db.signals.clear();
      await db.weaknesses.clear();
      await db.chesscomMonthSignals.clear();
      await db.lichessOAuthTokens.clear();
      await db.lichessStudies.clear();
      await db.methodTracks.clear();
      await db.pendingItems.clear();
      await db.diplomaAttempts.clear();
      await db.achievements.clear();
      await db.placementResults.clear();
      await db.appMeta.clear();
      await db.errorLog.clear();
      await db.backupMeta.clear();
      // Apagar tudo desliga o backup automatico: sem isso, a proxima abertura
      // gravaria um backup vazio por cima do arquivo bom do usuario.
      await db.autoBackup.clear();
    },
  );
}

function fromLichessOAuthTokenRecord(record: LichessOAuthTokenRecord): LichessOAuthToken {
  return {
    accessToken: record.accessToken,
    tokenType: record.tokenType,
    scopes: record.scopes,
    obtainedAt: record.obtainedAt,
    expiresAt: record.expiresAt,
  };
}

function createRecordId(): string {
  const cryptoObject = globalThis.crypto as { randomUUID?: () => string } | undefined;

  if (cryptoObject?.randomUUID !== undefined) {
    return cryptoObject.randomUUID();
  }

  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function toSignalRecord(signal: Signal, updatedAt: string): SignalRecord {
  return {
    ...signal,
    id: createRecordId(),
    updatedAt,
  };
}

function fromSignalRecord(record: SignalRecord): Signal {
  return {
    source: record.source,
    value: record.value,
    confidence: record.confidence,
    observedAt: record.observedAt,
  };
}

function toWeaknessRecord(weakness: Weakness, updatedAt: string): WeaknessRecord {
  return {
    ...weakness,
    id: weakness.tag,
    updatedAt,
  };
}

function fromWeaknessRecord(record: WeaknessRecord): Weakness {
  return {
    tag: record.tag,
    score: record.score,
    confidence: record.confidence,
    evidence: record.evidence,
    ...(record.observedAt !== undefined && { observedAt: record.observedAt }),
    ...(record.source !== undefined && { source: record.source }),
  };
}

/** Retorna a fraqueza de puzzle armazenada se ainda for fresca (dentro de maxAgeDays). */
export async function loadStoredPuzzleWeakness(nowIso: string, maxAgeDays = 90): Promise<Weakness | undefined> {
  const records = await db.weaknesses.toArray();
  const record = records.find((r) => r.source === 'puzzle' && r.deletedAt === undefined);
  if (record === undefined || record.observedAt === undefined) return undefined;
  const age = Date.parse(nowIso) - Date.parse(record.observedAt);
  if (Number.isNaN(age) || age > maxAgeDays * 86_400_000) return undefined;
  return fromWeaknessRecord(record);
}
