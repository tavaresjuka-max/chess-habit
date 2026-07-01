// @vitest-environment node
/**
 * Teste E2E real de sync — B4 Fase 5
 *
 * SyncClient real  →  worker real (backend/worker.ts default.fetch)
 *                  →  fakeD1 in-memory (backend/fakeD1.ts createFakeD1)
 *                  →  Dexie local (fake-indexeddb)
 *
 * "2 aparelhos" são simulados assim:
 *   - Aparelho A: Dexie local populado → syncCollectionOnce → dados no fakeD1
 *   - clearAll() limpa o Dexie local (simula aparelho B vazio)
 *   - Aparelho B: syncCollectionOnce com o MESMO worker/fakeD1 → recebe dados de A
 *
 * O fakeD1 é compartilhado (instância passada via closure do fetcher) e
 * isolado por userId para o cenário 3 (isolamento de usuário).
 */
import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import worker from '../../../backend/worker';
import { createFakeD1 } from '../../../backend/fakeD1';
import type { SyncEnv } from '../../../backend/types';
import { createSyncClient } from './syncClient';
import { syncCollectionOnce } from './syncStorage';
import { clearAll } from '../storage/appData';
import { db } from '../storage/db';
import type { WeaknessTag } from '../../domain/types';

// ── helpers ──────────────────────────────────────────────────────────────────

/**
 * Cria um fetcher que roteia chamadas do SyncClient para o worker real.
 * O `env` capturado pelo closure contém o fakeD1 compartilhado.
 */
function makeFetcher(env: SyncEnv) {
  return (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    return worker.fetch(new Request(url, init), env);
  };
}

/** Cria um SyncClient no modo local apontando para o worker via fetcher. */
function makeClient(env: SyncEnv, userId: string) {
  return createSyncClient({
    mode: 'local',
    baseUrl: 'http://sync.local',
    userId,
    fetcher: makeFetcher(env),
  });
}

/** Record de 'weaknesses' mínimo válido para sync. */
function makeWeakness(id: WeaknessTag, ts: string) {
  return {
    id,
    tag: id,
    score: 0.5,
    confidence: 'medium' as const,
    evidence: `evidence-${id}`,
    updatedAt: ts,
  };
}

afterEach(async () => {
  await clearAll();
});

// ── cenários ─────────────────────────────────────────────────────────────────

describe('syncE2E — roundtrip real worker + fakeD1', () => {
  /**
   * Cenário 1 — Roundtrip 2 aparelhos
   *
   * Aparelho A popula Dexie → syncCollectionOnce (push para fakeD1).
   * clearAll() simula troca para aparelho B (Dexie limpo).
   * Aparelho B chama syncCollectionOnce → recebe dados de A.
   */
  it('cenario 1: aparelho B recebe registros de A via worker real (roundtrip)', async () => {
    const sharedD1 = createFakeD1();
    const syncEnv: SyncEnv = { DB: sharedD1, SYNC_AUTH_MODE: 'local', SYNC_LOCAL_ALLOWED: 'true' };
    const userId = 'user-roundtrip';

    // --- Aparelho A: inserir dados locais e sincronizar ---
    const weakA = makeWeakness('fork', '2026-06-28T10:00:00.000Z');
    await db.weaknesses.put(weakA);

    const clientA = makeClient(syncEnv, userId);
    const resultA = await syncCollectionOnce({ collection: 'weaknesses', client: clientA });

    expect(resultA.ok).toBe(true);
    expect(resultA.pushed).toBeGreaterThan(0);

    // --- Simula aparelho B: limpar Dexie local ---
    await clearAll();
    expect(await db.weaknesses.count()).toBe(0);

    // --- Aparelho B: sincronizar contra o mesmo backend ---
    const clientB = makeClient(syncEnv, userId);
    const resultB = await syncCollectionOnce({ collection: 'weaknesses', client: clientB });

    expect(resultB.ok).toBe(true);
    expect(resultB.pulled).toBeGreaterThan(0);

    // Verificar que os dados de A chegaram em B
    const weaknessesB = await db.weaknesses.toArray();
    expect(weaknessesB.length).toBe(1);
    expect(weaknessesB[0]?.id).toBe('fork');
    expect(weaknessesB[0]?.updatedAt).toBe('2026-06-28T10:00:00.000Z');
  });

  /**
   * Cenário 2 (CRÍTICO) — Pull vazio NÃO apaga registros locais
   *
   * Aparelho com dados locais faz sync contra backend vazio (fakeD1 limpo).
   * Os registros locais devem SOBREVIVER — pull vazio não pode apagar local.
   */
  it('cenario 2 (CRITICO): pull vazio nao apaga registros locais', async () => {
    // Backend completamente vazio — fakeD1 novo sem nada
    const emptyD1 = createFakeD1();
    const syncEnv: SyncEnv = { DB: emptyD1, SYNC_AUTH_MODE: 'local', SYNC_LOCAL_ALLOWED: 'true' };
    const userId = 'user-pull-vazio';

    // Inserir dados locais
    const w1 = makeWeakness('pin', '2026-06-28T09:00:00.000Z');
    const w2 = makeWeakness('skewer', '2026-06-28T09:30:00.000Z');
    await db.weaknesses.bulkPut([w1, w2]);

    // Confirmar que existem antes do sync
    expect(await db.weaknesses.count()).toBe(2);

    // Sincronizar contra backend vazio
    const client = makeClient(syncEnv, userId);
    const result = await syncCollectionOnce({ collection: 'weaknesses', client: client });

    expect(result.ok).toBe(true);
    // Pull de backend vazio retorna 0 mutações
    expect(result.pulled).toBe(0);

    // INVARIANTE CRÍTICO: registros locais devem sobreviver
    const weaknessesAfter = await db.weaknesses.toArray();
    expect(weaknessesAfter.length).toBe(2);
    expect(weaknessesAfter.map((w) => w.id).sort()).toEqual(['pin', 'skewer']);
  });

  /**
   * Cenário 3 — Isolamento por usuário
   *
   * userA empurra dados; userB faz pull do mesmo backend.
   * userB NÃO deve ver os dados de userA.
   */
  it('cenario 3: userB nao ve dados de userA (isolamento por userId)', async () => {
    const sharedD1 = createFakeD1();
    const syncEnv: SyncEnv = { DB: sharedD1, SYNC_AUTH_MODE: 'local', SYNC_LOCAL_ALLOWED: 'true' };

    // --- userA: empurrar dados ---
    const weakA = makeWeakness('discovered', '2026-06-28T08:00:00.000Z');
    await db.weaknesses.put(weakA);

    const clientA = makeClient(syncEnv, 'userA');
    await syncCollectionOnce({ collection: 'weaknesses', client: clientA });

    // --- Simula aparelho de userB: Dexie limpo ---
    await clearAll();
    expect(await db.weaknesses.count()).toBe(0);

    // --- userB: pull do mesmo backend ---
    const clientB = makeClient(syncEnv, 'userB');
    const resultB = await syncCollectionOnce({ collection: 'weaknesses', client: clientB });

    expect(resultB.ok).toBe(true);

    // userB não deve ter recebido dados de userA
    const weaknessesB = await db.weaknesses.toArray();
    const weakIds = weaknessesB.map((w) => w.id);
    expect(weakIds).not.toContain('discovered');
    // Dados de userA não devem aparecer em userB
    expect(weaknessesB.length).toBe(0);
  });

  /**
   * Cenário 4 — Registro realista (profile) sobrevive push→pull intacto
   *
   * Profile com campos reais é empurrado por aparelho A e recuperado por
   * aparelho B identicamente — sem corrupção, sem campos perdidos.
   */
  it('cenario 4: profile realista sobrevive push→pull intacto via worker real', async () => {
    const sharedD1 = createFakeD1();
    const syncEnv: SyncEnv = { DB: sharedD1, SYNC_AUTH_MODE: 'local', SYNC_LOCAL_ALLOWED: 'true' };
    const userId = 'user-profile-roundtrip';

    // Profile completo (band usa o tipo LearnerBand)
    const profileFull = {
      id: 'default' as const,
      band: '800-1000' as const,
      lichessUsername: 'jukasparov',
      defaultSessionMinutes: 30 as const,
      goals: ['tactical', 'endgame'] as string[],
      updatedAt: '2026-06-28T11:00:00.000Z',
    };
    await db.profile.put(profileFull);

    // Aparelho A: push
    const clientA = makeClient(syncEnv, userId);
    const pushResult = await syncCollectionOnce({ collection: 'profile', client: clientA });
    expect(pushResult.pushed).toBe(1);

    // Simula aparelho B
    await clearAll();
    expect(await db.profile.count()).toBe(0);

    // Aparelho B: pull
    const clientB = makeClient(syncEnv, userId);
    const pullResult = await syncCollectionOnce({ collection: 'profile', client: clientB });
    expect(pullResult.pulled).toBe(1);

    // Verificar integridade dos dados
    const profileB = await db.profile.get('default');
    expect(profileB).toBeDefined();
    expect(profileB?.band).toBe('800-1000');
    expect(profileB?.lichessUsername).toBe('jukasparov');
    expect(profileB?.defaultSessionMinutes).toBe(30);
    expect(profileB?.updatedAt).toBe('2026-06-28T11:00:00.000Z');
  });
});
