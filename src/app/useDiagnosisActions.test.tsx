// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DailyPlan, LearnerProfile, Signal, TrainingLog } from '../domain';
import { importChesscomSignals } from '../infra/chesscom/chesscomClient';
import { fetchLichessAccount } from '../infra/lichess/account';
import { importLichessSignals } from '../infra/lichess/games';
import {
  appendSignals,
  loadChesscomMonthCache,
  loadLichessOAuthToken,
  loadSignals,
  loadStoredPuzzleWeakness,
  loadTrainingLogs,
  loadWeaknesses,
  replaceSignalsForSource,
  replaceWeaknesses,
  saveChesscomMonthCache,
  saveDiplomaAttempts,
  savePlacementResult,
  savePlan,
  saveProfile,
} from '../infra/storage/appData';
import { bumpOperationEpoch } from './operationEpoch';
import { useDiagnosisActions, type UseDiagnosisActionsInput } from './useDiagnosisActions';

vi.mock('../infra/chesscom/chesscomClient', () => ({
  importChesscomSignals: vi.fn(),
}));

vi.mock('../infra/lichess/games', () => ({
  importLichessSignals: vi.fn(),
}));

vi.mock('../infra/lichess/account', () => ({
  fetchLichessAccount: vi.fn(),
}));

vi.mock('../infra/storage/appData', () => ({
  appendSignals: vi.fn(),
  loadChesscomMonthCache: vi.fn(),
  loadLichessOAuthToken: vi.fn(),
  loadSignals: vi.fn(),
  loadStoredPuzzleWeakness: vi.fn(),
  loadTrainingLogs: vi.fn(),
  loadWeaknesses: vi.fn(),
  replaceSignalsForSource: vi.fn(),
  replaceWeaknesses: vi.fn(),
  saveChesscomMonthCache: vi.fn(),
  saveDiplomaAttempts: vi.fn(),
  savePlacementResult: vi.fn(),
  savePlan: vi.fn(),
  saveProfile: vi.fn(),
}));

const profile: LearnerProfile = {
  lichessUsername: undefined,
  chesscomUsername: 'jukatavares',
  band: '800-1000',
  defaultSessionMinutes: 15,
  goals: ['treinar com constancia'],
  updatedAt: '2026-06-15T00:00:00.000Z',
};

const chesscomSignal: Signal = {
  source: 'chesscom',
  confidence: 'medium',
  observedAt: '2026-06-15T00:00:00.000Z',
  value: { kind: 'judgment', blunders: 4, mistakes: 0, inaccuracies: 0, games: 6 },
};

const lichessSignal: Signal = {
  source: 'lichess',
  confidence: 'medium',
  observedAt: '2026-06-15T00:01:00.000Z',
  value: { kind: 'manual', tag: 'fork', note: 'Sinal controlado do Lichess.' },
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(importChesscomSignals).mockResolvedValue([chesscomSignal]);
  vi.mocked(importLichessSignals).mockResolvedValue([]);
  vi.mocked(fetchLichessAccount).mockResolvedValue(undefined);
  vi.mocked(appendSignals).mockResolvedValue(undefined);
  vi.mocked(loadChesscomMonthCache).mockResolvedValue(undefined);
  vi.mocked(loadLichessOAuthToken).mockResolvedValue(undefined);
  vi.mocked(loadSignals).mockResolvedValue([chesscomSignal]);
  vi.mocked(loadStoredPuzzleWeakness).mockResolvedValue(undefined);
  vi.mocked(loadWeaknesses).mockResolvedValue([]);
  vi.mocked(replaceSignalsForSource).mockResolvedValue(undefined);
  vi.mocked(replaceWeaknesses).mockResolvedValue(undefined);
  vi.mocked(saveChesscomMonthCache).mockResolvedValue(undefined);
  vi.mocked(savePlacementResult).mockResolvedValue(undefined);
  vi.mocked(savePlan).mockResolvedValue(undefined);
  vi.mocked(saveProfile).mockResolvedValue(undefined);
  vi.mocked(loadTrainingLogs).mockResolvedValue([]);
  vi.mocked(saveDiplomaAttempts).mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('useDiagnosisActions', () => {
  it('syncs Chess.com signals into persisted weaknesses and a regenerated plan', async () => {
    const input = createInput();
    const { result } = renderHook(() => useDiagnosisActions(input));

    await act(async () => {
      await result.current.syncChesscomDiagnosis();
    });

    expect(importChesscomSignals).toHaveBeenCalledWith(
      'jukatavares',
      expect.objectContaining({
        band: '800-1000',
        cache: {
          loadMonth: loadChesscomMonthCache,
          saveMonth: saveChesscomMonthCache,
        },
      }),
    );
    expect(replaceSignalsForSource).toHaveBeenCalledWith('chesscom', [chesscomSignal]);
    expect(replaceWeaknesses).toHaveBeenCalledWith([
      expect.objectContaining({ tag: 'blunder-rate', confidence: 'medium' }),
    ]);
    const savedPlan = vi.mocked(savePlan).mock.calls[0]?.[0];

    expect(savedPlan?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(input.setDiagnosisState).toHaveBeenLastCalledWith('success');
    expect(input.setErrorMessage).toHaveBeenCalledWith(undefined);
  });

  it('keeps historic Chess.com signals in diagnosis even when generic freshness would decay them', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));

    const staleChesscomOpeningSignal: Signal = {
      source: 'chesscom',
      confidence: 'medium',
      observedAt: '2026-01-01T00:00:00.000Z',
      value: { kind: 'opening', eco: 'C20', name: 'King Pawn Game', games: 12, lossRate: 0.67 },
    };

    vi.mocked(importChesscomSignals).mockResolvedValue([staleChesscomOpeningSignal]);
    vi.mocked(loadSignals).mockResolvedValue([staleChesscomOpeningSignal]);

    const input = createInput();
    const { result } = renderHook(() => useDiagnosisActions(input));

    await act(async () => {
      await result.current.syncChesscomDiagnosis();
    });

    expect(replaceWeaknesses).toHaveBeenCalledWith([
      expect.objectContaining({ tag: 'opening-principles', confidence: 'medium' }),
    ]);
  });

  it('preserves the union of weaknesses when onboarding imports Chess.com and Lichess in parallel', async () => {
    vi.mocked(importLichessSignals).mockResolvedValue([lichessSignal]);

    let loadCount = 0;
    vi.mocked(loadSignals).mockImplementation(() => {
      loadCount += 1;
      return Promise.resolve(loadCount === 1 ? [chesscomSignal] : [chesscomSignal, lichessSignal]);
    });
    const completedWrites: string[][] = [];
    vi.mocked(replaceWeaknesses).mockImplementation(async (weaknesses) => {
      const tags = weaknesses.map((weakness) => weakness.tag);

      if (tags.includes('blunder-rate') && !tags.includes('fork')) {
        await new Promise((resolve) => window.setTimeout(resolve, 0));
      }

      completedWrites.push(tags);
    });

    const input = createInput({
      profile: { ...profile, lichessUsername: 'jukasparov' },
    });
    const { result } = renderHook(() => useDiagnosisActions(input));

    await act(async () => {
      await result.current.runOnboardingImport(input.profile as LearnerProfile);
    });

    expect(completedWrites.at(-1)).toEqual(expect.arrayContaining(['blunder-rate', 'fork']));
  });

  it('conta só fraquezas confiáveis (confidence != low) para rotear o onboarding', async () => {
    vi.mocked(loadWeaknesses).mockResolvedValue([
      { tag: 'blunder-rate', score: 0.3, confidence: 'low', evidence: 'pouca amostra' },
      { tag: 'fork', score: 0.6, confidence: 'medium', evidence: 'amostra ok' },
      { tag: 'opening-principles', score: 0.9, confidence: 'high', evidence: 'amostra forte' },
    ]);

    const input = createInput({ profile });
    const { result } = renderHook(() => useDiagnosisActions(input));

    let imported: { weaknessCount: number; confidentWeaknessCount: number } | undefined;
    await act(async () => {
      imported = await result.current.runOnboardingImport(input.profile as LearnerProfile);
    });

    // 3 fraquezas, mas só 2 confiáveis: poucos jogos (só 'low') iriam para a calibração.
    expect(imported).toEqual({ weaknessCount: 3, confidentWeaknessCount: 2 });
  });

  it('does not write an in-flight diagnosis after local data is cleared', async () => {
    let resolveSignals: ((signals: Signal[]) => void) | undefined;
    vi.mocked(importChesscomSignals).mockReturnValue(
      new Promise((resolve) => {
        resolveSignals = resolve;
      }),
    );

    const input = createInput();
    const { result } = renderHook(() => useDiagnosisActions(input));

    await act(async () => {
      const sync = result.current.syncChesscomDiagnosis();
      await Promise.resolve();
      bumpOperationEpoch();
      resolveSignals?.([chesscomSignal]);
      await sync;
    });

    expect(replaceSignalsForSource).not.toHaveBeenCalled();
    expect(replaceWeaknesses).not.toHaveBeenCalled();
    expect(savePlan).not.toHaveBeenCalled();
  });

  describe('M2a — banda automática a partir do Lichess', () => {
    const lichessToken = {
      accessToken: 'tok-123',
      tokenType: 'Bearer' as const,
      scopes: ['puzzle:read' as const],
      obtainedAt: '2026-06-15T00:00:00.000Z',
      expiresAt: '2027-01-01T00:00:00.000Z',
    };

    it('AC1: sobe da banda 400-800 para 1200-1600 via rapid 1500 não-provisório', async () => {
      vi.mocked(loadLichessOAuthToken).mockResolvedValue(lichessToken);
      vi.mocked(fetchLichessAccount).mockResolvedValue({
        id: 'jukasparov',
        username: 'jukasparov',
        rapid: { rating: 1500, games: 40, provisional: false },
      });

      const input = createInput({
        profile: { ...profile, lichessUsername: 'jukasparov', band: '400-800' },
      });
      const { result } = renderHook(() => useDiagnosisActions(input));

      await act(async () => {
        await result.current.runLichessSync(input.profile as LearnerProfile);
      });

      expect(saveProfile).toHaveBeenCalledWith(expect.objectContaining({ band: '1200-1600' }));
      expect(input.setProfile).toHaveBeenCalledWith(expect.objectContaining({ band: '1200-1600' }));
      expect(savePlacementResult).toHaveBeenCalledWith(
        expect.objectContaining({ band: '1200-1600', confidence: 'high' }),
      );
      // O plano do mesmo sync é regenerado com a banda nova (saveProfile provou que
      // effectiveProfile foi construído e passou a generatePlan dentro do guard).
      expect(savePlan).toHaveBeenCalled();
      // Mensagem final inclui a nota de promoção (DD7).
      expect(input.setLichessMessage).toHaveBeenCalledWith(
        expect.stringContaining('Subi sua faixa para 1200-1600'),
      );
    });

    it('AC3: banda atual 2000-2200 com rapid 900 → NÃO rebaixa; saveProfile não chamado', async () => {
      vi.mocked(loadLichessOAuthToken).mockResolvedValue(lichessToken);
      vi.mocked(fetchLichessAccount).mockResolvedValue({
        id: 'jukasparov',
        username: 'jukasparov',
        rapid: { rating: 900, games: 40, provisional: false },
      });

      const input = createInput({
        profile: { ...profile, lichessUsername: 'jukasparov', band: '2000-2200' },
      });
      const { result } = renderHook(() => useDiagnosisActions(input));

      await act(async () => {
        await result.current.runLichessSync(input.profile as LearnerProfile);
      });

      expect(saveProfile).not.toHaveBeenCalled();
      expect(input.setProfile).not.toHaveBeenCalled();
      expect(savePlacementResult).not.toHaveBeenCalled();
      // Plano segue com a banda original (sem promoção).
      expect(savePlan).toHaveBeenCalled();
      // Mensagem NÃO inclui nota de promoção.
      expect(input.setLichessMessage).toHaveBeenCalledWith(
        expect.not.stringContaining('Subi sua faixa'),
      );
    });

    it('AC4: sem perf de jogo não-provisório → saveProfile não chamado; banda intacta', async () => {
      vi.mocked(loadLichessOAuthToken).mockResolvedValue(lichessToken);
      vi.mocked(fetchLichessAccount).mockResolvedValue({
        id: 'jukasparov',
        username: 'jukasparov',
        puzzle: { rating: 1500, games: 99, provisional: false },
      });

      const input = createInput({
        profile: { ...profile, lichessUsername: 'jukasparov', band: '800-1000' },
      });
      const { result } = renderHook(() => useDiagnosisActions(input));

      await act(async () => {
        await result.current.runLichessSync(input.profile as LearnerProfile);
      });

      expect(saveProfile).not.toHaveBeenCalled();
      expect(input.setProfile).not.toHaveBeenCalled();
      expect(savePlacementResult).not.toHaveBeenCalled();
      expect(savePlan).toHaveBeenCalled();
    });

    it('best-effort: fetchLichessAccount rejeita (429) → sync completa sem throw e banda intacta', async () => {
      vi.mocked(loadLichessOAuthToken).mockResolvedValue(lichessToken);
      vi.mocked(fetchLichessAccount).mockRejectedValue(new Error('HTTP 429'));

      const input = createInput({
        profile: { ...profile, lichessUsername: 'jukasparov', band: '800-1000' },
      });
      const { result } = renderHook(() => useDiagnosisActions(input));

      await expect(
        act(async () => {
          await result.current.runLichessSync(input.profile as LearnerProfile);
        }),
      ).resolves.toBeUndefined();

      expect(saveProfile).not.toHaveBeenCalled();
      // O sync ainda persiste plano/sinais normalmente (best-effort).
      expect(savePlan).toHaveBeenCalled();
      expect(input.setLichessConnectionState).toHaveBeenCalledWith('connected');
    });

    describe('nudge puzzle-perf (DD-Ped2)', () => {
      const puzzlePerfSignal: Signal = {
        source: 'lichess',
        confidence: 'medium',
        observedAt: '2026-06-23T10:00:00.000Z',
        // rating 950 > 90% de 1000 (teto de '800-1000') → deve mostrar nudge
        value: { kind: 'puzzle-perf', rating: 950, games: 60 },
      };

      it('rating de puzzles > 90% do teto → nudge aparece na mensagem', async () => {
        vi.mocked(loadSignals).mockResolvedValue([puzzlePerfSignal]);
        vi.mocked(importLichessSignals).mockResolvedValue([lichessSignal]);

        const input = createInput({
          profile: { ...profile, lichessUsername: 'jukasparov', band: '800-1000' },
        });
        const { result } = renderHook(() => useDiagnosisActions(input));

        await act(async () => {
          await result.current.runLichessSync(input.profile as LearnerProfile);
        });

        expect(input.setLichessMessage).toHaveBeenCalledWith(
          expect.stringContaining('rating de puzzles (950)'),
        );
      });

      it('rating de puzzles < 90% do teto → sem nudge', async () => {
        const lowSignal: Signal = { ...puzzlePerfSignal, value: { kind: 'puzzle-perf', rating: 700, games: 60 } };
        vi.mocked(loadSignals).mockResolvedValue([lowSignal]);
        vi.mocked(importLichessSignals).mockResolvedValue([lichessSignal]);

        const input = createInput({
          profile: { ...profile, lichessUsername: 'jukasparov', band: '800-1000' },
        });
        const { result } = renderHook(() => useDiagnosisActions(input));

        await act(async () => {
          await result.current.runLichessSync(input.profile as LearnerProfile);
        });

        expect(input.setLichessMessage).toHaveBeenCalledWith(
          expect.not.stringContaining('rating de puzzles'),
        );
      });

      it('sem sinal puzzle-perf no DB → sem nudge, sync completa normalmente', async () => {
        vi.mocked(loadSignals).mockResolvedValue([chesscomSignal]);
        vi.mocked(importLichessSignals).mockResolvedValue([lichessSignal]);

        const input = createInput({
          profile: { ...profile, lichessUsername: 'jukasparov', band: '800-1000' },
        });
        const { result } = renderHook(() => useDiagnosisActions(input));

        await act(async () => {
          await result.current.runLichessSync(input.profile as LearnerProfile);
        });

        expect(input.setLichessMessage).toHaveBeenCalledWith(
          expect.not.stringContaining('rating de puzzles'),
        );
        expect(savePlan).toHaveBeenCalled();
      });

      it('loadSignals rejeita no nudge → sync completa sem nudge e sem throw', async () => {
        // 1ª call = diagnose (linha 169, deve ter sucesso); 2ª call = nudge (rejeita).
        vi.mocked(loadSignals)
          .mockResolvedValueOnce([chesscomSignal])
          .mockRejectedValueOnce(new Error('DB error'));
        vi.mocked(importLichessSignals).mockResolvedValue([lichessSignal]);

        const input = createInput({
          profile: { ...profile, lichessUsername: 'jukasparov', band: '800-1000' },
        });
        const { result } = renderHook(() => useDiagnosisActions(input));

        await act(async () => {
          await result.current.runLichessSync(input.profile as LearnerProfile);
        });

        // Sync completou sem throw (nudge é silencioso)
        expect(savePlan).toHaveBeenCalled();
        expect(input.setLichessMessage).toHaveBeenCalledWith(
          expect.not.stringContaining('rating de puzzles'),
        );
      });
    });
  });

  describe('PROD-6 — diploma promove no sync (não só no boot/botão manual)', () => {
    it('avalia diploma por acurácia de puzzle no runLichessSync e promove a banda na hora', async () => {
      // Logs de treino com puzzle-dashboard cruzando o limiar do Diploma do Peão:
      // 'hangingPiece' (seção valor-pecas) e 'mateIn1' (seção mates-basicos), ambos
      // com ≥30 tentativas e ≥80% de acurácia (40 tentativas, 36 acertos = 90%).
      // SEM reboot e SEM chamar o reconcile manual.
      const dashboardLog: TrainingLog = {
        id: 'diploma-dashboard',
        date: '2026-06-19',
        blockId: 'lichess-puzzle-dashboard',
        blockTitle: 'Puzzles Lichess',
        source: 'lichess',
        destinationLabel: 'Puzzles Lichess',
        plannedSeconds: 900,
        startedAt: '2026-06-19T10:00:00.000Z',
        completedAt: '2026-06-19T10:15:00.000Z',
        elapsedSeconds: 900,
        timeLimitReached: true,
        status: 'done',
        updatedAt: '2026-06-19T10:15:00.000Z',
        result: {
          source: 'lichess',
          kind: 'puzzle-dashboard',
          fetchedAt: '2026-06-19T10:15:00.000Z',
          since: '2026-05-20',
          until: '2026-06-19',
          days: 30,
          puzzles: 80,
          wins: 72,
          losses: 8,
          themes: ['hangingPiece', 'mateIn1'],
          weakThemes: [],
          strongThemes: ['hangingPiece', 'mateIn1'],
          themeStats: [
            { theme: 'hangingPiece', attempts: 40, losses: 4 },
            { theme: 'mateIn1', attempts: 40, losses: 4 },
          ],
        },
      };

      vi.mocked(loadTrainingLogs).mockResolvedValue([dashboardLog]);

      // Banda '400-800' é gateada pelo Diploma do Peão; passou → sobre para '800-1000'.
      const input = createInput({
        profile: { ...profile, lichessUsername: 'jukasparov', band: '400-800' },
      });
      const { result } = renderHook(() => useDiagnosisActions(input));

      await act(async () => {
        await result.current.runLichessSync(input.profile as LearnerProfile);
      });

      expect(saveDiplomaAttempts).toHaveBeenCalled();
      expect(saveProfile).toHaveBeenCalledWith(expect.objectContaining({ band: '800-1000' }));
      expect(input.setProfile).toHaveBeenCalledWith(expect.objectContaining({ band: '800-1000' }));
    });
  });
});

function createInput(overrides: Partial<UseDiagnosisActionsInput> = {}): UseDiagnosisActionsInput {
  return {
    profile,
    todayPlan: undefined,
    sessionMinutes: 15,
    trainingLogs: [],
    pendingItems: [],
    diplomaAttempts: [],
    latestPlanRef: { current: undefined as DailyPlan | undefined },
    setActiveView: vi.fn(),
    setDiagnosisState: vi.fn(),
    setDiagnosisMessage: vi.fn(),
    setErrorMessage: vi.fn(),
    setSignals: vi.fn(),
    setWeaknesses: vi.fn(),
    setTodayPlan: vi.fn(),
    setLichessConnectionState: vi.fn(),
    setLichessMessage: vi.fn(),
    setProfile: vi.fn(),
    setDiplomaAttempts: vi.fn(),
    ...overrides,
  };
}
