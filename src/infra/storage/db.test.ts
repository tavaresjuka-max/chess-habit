import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { TutorDatabase } from './db';

// Schema cumulativo até v6 (espelha as versões 1-6 de db.ts). Um banco fresco
// criado com este schema fica "na versão 6"; ao reabrir com TutorDatabase (v11),
// o Dexie roda os upgrades v7..v11. Testamos que os upgrade hooks com lógica
// (v7 backfill de updatedAt, v8 migrateLegacyBand) preservam os dados do dono.
const V6_STORES: Record<string, string> = {
  profile: 'id, updatedAt',
  plans: 'date, generatedFromWeaknessesAt',
  logs: 'id, date, blockId, updatedAt',
  signals: 'id, source, observedAt',
  weaknesses: 'id, tag, confidence',
  chesscomMonthSignals: 'id, username, updatedAt, expiresAt',
  lichessOAuthTokens: 'id, expiresAt',
  lichessStudies: 'id, date, studyId, updatedAt',
  methodTracks: 'id, status, updatedAt',
  pendingItems: 'id, status, dueAt, methodTrackId, weaknessTag, updatedAt',
  diplomaAttempts: 'id, diplomaId, sectionId, createdAt, updatedAt',
  backupMeta: 'id',
  autoBackup: 'id',
};

// v7 acrescenta updatedAt ao índice de signals/weaknesses.
const V7_STORES: Record<string, string> = {
  ...V6_STORES,
  signals: 'id, source, observedAt, updatedAt',
  weaknesses: 'id, tag, confidence, updatedAt',
};

const createdDbs: string[] = [];

async function seedLegacyDb(
  name: string,
  version: number,
  stores: Record<string, string>,
  seed: (db: Dexie) => Promise<void>,
): Promise<void> {
  const legacy = new Dexie(name);
  legacy.version(version).stores(stores);
  await legacy.open();
  await seed(legacy);
  legacy.close();
  createdDbs.push(name);
}

afterEach(async () => {
  for (const name of createdDbs.splice(0)) {
    await Dexie.delete(name);
  }
});

describe('migração Dexie v7 — backfill de updatedAt', () => {
  it('preenche updatedAt em signals (a partir de observedAt) e weaknesses ao migrar de v6', async () => {
    const name = 'migracao-test-v7';

    await seedLegacyDb(name, 6, V6_STORES, async (legacy) => {
      await legacy.table('signals').put({
        id: 's1',
        source: 'lichess',
        observedAt: '2026-01-01T00:00:00.000Z',
        confidence: 'medium',
        value: { kind: 'accuracy', lowAccuracyGames: 6, games: 8 },
      });
      await legacy.table('weaknesses').put({
        id: 'w1',
        tag: 'fork',
        score: 0.7,
        confidence: 'medium',
        evidence: 'Sinal de garfo.',
      });
    });

    const upgraded = new TutorDatabase(name);
    await upgraded.open();

    try {
      const signal = await upgraded.signals.get('s1');
      const weakness = await upgraded.weaknesses.get('w1');

      // signals: updatedAt vem do observedAt do próprio registro (não se perde).
      expect(signal?.updatedAt).toBe('2026-01-01T00:00:00.000Z');
      // weaknesses: updatedAt é preenchido com um ISO válido (now).
      expect(typeof weakness?.updatedAt).toBe('string');
      expect(Number.isNaN(Date.parse(weakness?.updatedAt ?? ''))).toBe(false);
      // os demais campos do registro permanecem intactos.
      expect(signal?.source).toBe('lichess');
      expect(weakness?.tag).toBe('fork');
    } finally {
      upgraded.close();
    }
  });

  it('preserva updatedAt de signal que já o tinha antes da migração v7 (??= não sobrescreve)', async () => {
    const name = 'migracao-test-v7-preserva-signal';

    await seedLegacyDb(name, 6, V6_STORES, async (legacy) => {
      await legacy.table('signals').put({
        id: 's-existing',
        source: 'lichess',
        observedAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2025-12-01T00:00:00.000Z', // já definido no v6 (campo extra, não indexado)
        confidence: 'medium',
        value: { kind: 'accuracy', lowAccuracyGames: 3, games: 5 },
      });
    });

    const upgraded = new TutorDatabase(name);
    await upgraded.open();

    try {
      const signal = await upgraded.signals.get('s-existing');

      // updatedAt já estava definido → ??= não sobrescreve.
      expect(signal?.updatedAt).toBe('2025-12-01T00:00:00.000Z');
    } finally {
      upgraded.close();
    }
  });

  it('usa now quando signal não tem observedAt nem updatedAt na migração v7', async () => {
    const name = 'migracao-test-v7-sem-observedat';
    const before = Date.now();

    await seedLegacyDb(name, 6, V6_STORES, async (legacy) => {
      // Registro sem observedAt nem updatedAt (campo omitido completamente).
      await legacy.table('signals').put({
        id: 's-nodate',
        source: 'chesscom',
        confidence: 'medium',
        value: { kind: 'judgment', blunders: 2, mistakes: 1, inaccuracies: 0, games: 5 },
      });
    });

    const upgraded = new TutorDatabase(name);
    await upgraded.open();

    try {
      const signal = await upgraded.signals.get('s-nodate');

      // updatedAt deve ser um timestamp válido de "agora" (fallback quando observedAt ausente).
      expect(typeof signal?.updatedAt).toBe('string');
      const parsed = Date.parse(signal?.updatedAt ?? '');
      expect(Number.isNaN(parsed)).toBe(false);
      expect(parsed).toBeGreaterThanOrEqual(before);
    } finally {
      upgraded.close();
    }
  });
});

describe('migração Dexie v8 — migrateLegacyBand', () => {
  it('migra a banda legada do perfil (0-800 -> 400-800) ao migrar de v7', async () => {
    const name = 'migracao-test-v8';

    await seedLegacyDb(name, 7, V7_STORES, async (legacy) => {
      await legacy.table('profile').put({
        id: 'default',
        band: '0-800',
        defaultSessionMinutes: 15,
        goals: [],
        updatedAt: '2026-01-01T00:00:00.000Z',
      });
    });

    const upgraded = new TutorDatabase(name);
    await upgraded.open();

    try {
      const profile = await upgraded.profile.get('default');

      expect(profile?.band).toBe('400-800');
      // o restante do perfil não é tocado pela migração.
      expect(profile?.defaultSessionMinutes).toBe(15);
    } finally {
      upgraded.close();
    }
  });

  it('mantém uma banda já válida do spine intacta ao migrar', async () => {
    const name = 'migracao-test-v8-valida';

    await seedLegacyDb(name, 7, V7_STORES, async (legacy) => {
      await legacy.table('profile').put({
        id: 'default',
        band: '800-1000',
        defaultSessionMinutes: 15,
        goals: [],
        updatedAt: '2026-01-01T00:00:00.000Z',
      });
    });

    const upgraded = new TutorDatabase(name);
    await upgraded.open();

    try {
      const profile = await upgraded.profile.get('default');

      expect(profile?.band).toBe('800-1000');
    } finally {
      upgraded.close();
    }
  });

  it('não quebra quando perfil não tem campo band (typeof !== string → skip)', async () => {
    const name = 'migracao-test-v8-sem-band';

    await seedLegacyDb(name, 7, V7_STORES, async (legacy) => {
      await legacy.table('profile').put({
        id: 'default',
        defaultSessionMinutes: 15,
        goals: [],
        updatedAt: '2026-01-01T00:00:00.000Z',
        // band propositalmente ausente — simula perfil antigo incompleto.
      });
    });

    const upgraded = new TutorDatabase(name);
    await upgraded.open();

    try {
      const profile = await upgraded.profile.get('default');

      // Sem band no input, a migração pula silenciosamente (typeof !== 'string').
      expect(profile?.band).toBeUndefined();
      expect(profile?.defaultSessionMinutes).toBe(15);
    } finally {
      upgraded.close();
    }
  });
});
