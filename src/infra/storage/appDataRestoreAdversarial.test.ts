// GRUPO D (dados-1): teste adversarial de restore de backup.
//
// Confirmação RED (rodada antes do fix, 2026-07-02): os 3 cenários abaixo
// FALHARAM antes do saneamento em importBackupFromJson —
//   (a) band alta sem diplomaAttempts que a justifiquem: importava a banda
//       forjada '1200-1600' sem nenhum diploma (loadProfile resolvia para
//       '1200-1600' em vez de clampar para '0-400').
//   (b) diplomaAttempts com passed=true e totalItems=5 (< SECTION_MIN_ATTEMPTS
//       de 30): validateBackupData aceitava o backup (import ok:true) porque
//       só checava o TIPO de totalItems (isCount), não o piso de volume.
//   (c) adoptedAt/consentedAt no futuro (ano 2099): captureAdoption e o
//       merge/import aceitavam a data forjada sem clamp — loadAdoptedAt
//       resolvia para 2099 em vez de <= now.
// Depois do fix (sanitizeRestoredState + validateBackupData endurecido),
// os 3 cenários passam a se comportar de forma segura, ver asserts abaixo.
import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import type { LearnerProfile } from '../../domain';
import { SECTION_MIN_ATTEMPTS } from '../../domain/pedagogyConstants';
import type { DiplomaAttempt } from '../../domain/method/types';
import { clearAll, importBackupFromJson, loadAdoptedAt, loadDiplomaAttempts, loadProfile } from './appData';
import { createBackupFile, type BackupData } from './backup';
import { db } from './db';

const baseProfile: LearnerProfile = {
  lichessUsername: 'jukasparov',
  band: '0-400',
  defaultSessionMinutes: 15,
  goals: [],
  updatedAt: '2026-06-06T00:00:00.000Z',
};

function emptyBackupData(): BackupData {
  return {
    profile: [],
    plans: [],
    logs: [],
    signals: [],
    weaknesses: [],
    methodTracks: [],
    pendingItems: [],
    diplomaAttempts: [],
  };
}

async function forgeBackupJson(data: BackupData, exportedAt = '2026-06-10T12:00:00.000Z'): Promise<string> {
  const file = await createBackupFile(data, exportedAt);

  return JSON.stringify(file);
}

afterEach(async () => {
  await clearAll();
});

describe('importBackupFromJson — adversarial de restore (GRUPO D, dados-1/2/4)', () => {
  it('(a) clampa a banda para baixo quando o backup alega banda alta sem diplomaAttempts que a justifiquem', async () => {
    const data = emptyBackupData();
    data.profile = [{ ...baseProfile, id: 'default', band: '1200-1600' }];
    // Nenhum diplomaAttempts: nenhum diploma foi conquistado, então nenhuma
    // banda acima de '0-400' pode ser justificada.

    const json = await forgeBackupJson(data);
    const result = await importBackupFromJson(json);

    expect(result).toMatchObject({ ok: true });
    const restored = await loadProfile();

    // A banda restaurada NUNCA pode ficar acima do que os diplomaAttempts
    // restaurados justificam — sem diplomas, a banda cai para o piso.
    expect(restored?.band).toBe('0-400');
  });

  it('(b) validateBackupData rejeita diplomaAttempts.passed=true com totalItems abaixo de SECTION_MIN_ATTEMPTS', async () => {
    const data = emptyBackupData();
    data.profile = [{ ...baseProfile, id: 'default' }];
    const forgedAttempt: DiplomaAttempt = {
      id: 'attempt-forged',
      diplomaId: 'peao',
      sectionId: 'valor-pecas',
      scorePercent: 95,
      totalItems: 5, // abaixo de SECTION_MIN_ATTEMPTS (30) — amostra insuficiente para "passed"
      passed: true,
      source: 'local',
      createdAt: '2026-06-10T00:00:00.000Z',
      updatedAt: '2026-06-10T00:00:00.000Z',
    };
    data.diplomaAttempts = [forgedAttempt];

    expect(forgedAttempt.totalItems).toBeLessThan(SECTION_MIN_ATTEMPTS);

    const json = await forgeBackupJson(data);
    const result = await importBackupFromJson(json);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/diplomaAttempts/);
    }
    // O import rejeitado não pode ter tocado o banco.
    await expect(loadDiplomaAttempts()).resolves.toEqual([]);
  });

  it('(c) clampa adoptedAt/consentedAt para <= now quando o backup alega datas no futuro', async () => {
    const data = emptyBackupData();
    data.profile = [{ ...baseProfile, id: 'default' }];
    data.appMeta = [
      {
        id: 'app',
        adoptedAt: '2099-12-31T23:59:59.000Z',
        consentedAt: '2099-12-31T23:59:59.000Z',
        updatedAt: '2026-06-10T00:00:00.000Z',
      },
    ];

    const beforeImportMs = Date.now();
    const json = await forgeBackupJson(data, '2026-06-10T12:00:00.000Z');
    const result = await importBackupFromJson(json);
    const afterImportMs = Date.now();

    expect(result).toMatchObject({ ok: true });

    const adoptedAt = await loadAdoptedAt();
    expect(adoptedAt).toBeDefined();
    // adoptedAt restaurado nunca pode estar no futuro em relação ao momento
    // real do import (o saneamento clampa contra o relógio real, não contra
    // exportedAt do arquivo — um backup antigo não deve "voltar no tempo").
    expect(Date.parse(adoptedAt as string)).toBeLessThanOrEqual(afterImportMs);
    expect(Date.parse(adoptedAt as string)).toBeGreaterThanOrEqual(beforeImportMs - 1000);

    const appMetaRecord = await db.appMeta.get('app');
    expect(appMetaRecord?.consentedAt).toBeDefined();
    expect(Date.parse(appMetaRecord?.consentedAt as string)).toBeLessThanOrEqual(afterImportMs);
  });
});
