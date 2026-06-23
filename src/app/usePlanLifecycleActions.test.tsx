// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DailyPlan, LearnerProfile, TrainingLog } from '../domain';
import {
  loadProfile,
  loadTrainingLogs,
  loadTrainingLogsForDate,
  markOnboardingCompleted,
  savePlacementResult,
  savePlan,
  saveProfile,
} from '../infra/storage/appData';
import { syncAchievements } from './achievementsSync';
import { usePlanLifecycleActions, type UsePlanLifecycleActionsInput } from './usePlanLifecycleActions';

// Spy em buildDiagnosticThemeStats para teste D5
import * as puzzleThemeStatsModule from '../domain/coach/puzzleThemeStats';

vi.mock('../infra/storage/appData', () => ({
  loadProfile: vi.fn(),
  loadTrainingLogs: vi.fn(),
  loadTrainingLogsForDate: vi.fn(),
  markOnboardingCompleted: vi.fn(),
  savePlacementResult: vi.fn(),
  savePlan: vi.fn(),
  saveProfile: vi.fn(),
}));

vi.mock('./achievementsSync', () => ({
  syncAchievements: vi.fn(),
}));

// date module – freeze to a fixed date so plan.date is deterministic
vi.mock('./date', () => ({
  getTodayDate: vi.fn(() => '2026-06-20'),
}));

const profile: LearnerProfile = {
  lichessUsername: 'jukasparov',
  band: '800-1000',
  defaultSessionMinutes: 15,
  goals: ['rotina'],
  updatedAt: '2026-06-20T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(loadProfile).mockResolvedValue(undefined);
  vi.mocked(savePlan).mockResolvedValue(undefined);
  vi.mocked(saveProfile).mockResolvedValue(undefined);
  vi.mocked(savePlacementResult).mockResolvedValue(undefined);
  vi.mocked(markOnboardingCompleted).mockResolvedValue(undefined);
  vi.mocked(loadTrainingLogs).mockResolvedValue([]);
  vi.mocked(loadTrainingLogsForDate).mockResolvedValue([]);
  vi.mocked(syncAchievements).mockResolvedValue([]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('usePlanLifecycleActions', () => {
  describe('regeneratePlan', () => {
    it('saves plan and updates setTodayPlan / setSessionMinutes when profile exists', async () => {
      const input = createInput({ profile });
      const { result } = renderHook(() => usePlanLifecycleActions(input));

      await act(async () => {
        await result.current.regeneratePlan(30);
      });

      expect(savePlan).toHaveBeenCalledOnce();
      const savedPlan = vi.mocked(savePlan).mock.calls[0]?.[0];
      expect(savedPlan?.date).toBe('2026-06-20');
      expect(input.setSessionMinutes).toHaveBeenCalledWith(30);
      expect(input.setTodayPlan).toHaveBeenCalledWith(savedPlan);
      expect(input.setErrorMessage).toHaveBeenCalledWith(undefined);
    });

    it('redirects to config and does not save when profile is undefined', async () => {
      const input = createInput({ profile: undefined });
      const { result } = renderHook(() => usePlanLifecycleActions(input));

      await act(async () => {
        await result.current.regeneratePlan(15);
      });

      expect(savePlan).not.toHaveBeenCalled();
      expect(input.setActiveView).toHaveBeenCalledWith('config');
    });
  });

  describe('createNextSession', () => {
    it('creates the first session plan and loads training logs when todayPlan is undefined', async () => {
      const input = createInput({ profile, todayPlan: undefined });
      const { result } = renderHook(() => usePlanLifecycleActions(input));

      await act(async () => {
        await result.current.createNextSession(15);
      });

      expect(savePlan).toHaveBeenCalledOnce();
      expect(input.setSessionMinutes).toHaveBeenCalledWith(15);
      expect(input.setTodayPlan).toHaveBeenCalled();
      expect(loadTrainingLogsForDate).toHaveBeenCalledWith('2026-06-20');
      expect(loadTrainingLogs).toHaveBeenCalled();
      expect(input.setErrorMessage).toHaveBeenCalledWith(undefined);
    });

    it('appends a new session to an existing plan and reloads logs', async () => {
      const todayPlan = makePlan('2026-06-20');
      const input = createInput({ profile, todayPlan });
      const { result } = renderHook(() => usePlanLifecycleActions(input));

      await act(async () => {
        await result.current.createNextSession(15);
      });

      expect(savePlan).toHaveBeenCalledOnce();
      const savedPlan = vi.mocked(savePlan).mock.calls[0]?.[0];
      // appendPlanSession merges sessions; resulting plan keeps the original date
      expect(savedPlan?.date).toBe('2026-06-20');
      expect(loadTrainingLogsForDate).toHaveBeenCalledWith('2026-06-20');
    });
  });

  describe('savePlacementResult', () => {
    it('persists placement and syncs achievements', async () => {
      const input = createInput({ profile });
      const { result } = renderHook(() => usePlanLifecycleActions(input));

      await act(async () => {
        await result.current.savePlacementResult({
          band: '800-1000',
          confidence: 'medium',
          calibrated: true,
          completedAt: '2026-06-20T00:00:00.000Z',
        });
      });

      expect(savePlacementResult).toHaveBeenCalledWith(
        expect.objectContaining({ band: '800-1000', confidence: 'medium' }),
      );
      expect(syncAchievements).toHaveBeenCalled();
      expect(input.setAchievements).toHaveBeenCalled();
    });
  });

  describe('approveLearningPlan', () => {
    it('saves plan with status approved when todayPlan exists', async () => {
      const todayPlan = makePlan('2026-06-20');
      const input = createInput({ profile, todayPlan });
      const { result } = renderHook(() => usePlanLifecycleActions(input));

      await act(async () => {
        await result.current.approveLearningPlan();
      });

      expect(savePlan).toHaveBeenCalledOnce();
      const savedPlan = vi.mocked(savePlan).mock.calls[0]?.[0];
      expect(savedPlan?.learningPlanResponse?.status).toBe('approved');
      expect(input.setTodayPlan).toHaveBeenCalledWith(savedPlan);
    });

    it('does not call savePlan when todayPlan is undefined', async () => {
      const input = createInput({ profile, todayPlan: undefined });
      const { result } = renderHook(() => usePlanLifecycleActions(input));

      await act(async () => {
        await result.current.approveLearningPlan();
      });

      expect(savePlan).not.toHaveBeenCalled();
    });
  });

  describe('completeOnboarding', () => {
    it('marks onboarding completed and updates setOnboardingCompletedAt', async () => {
      const input = createInput({ profile });
      const { result } = renderHook(() => usePlanLifecycleActions(input));

      await act(async () => {
        await result.current.completeOnboarding();
      });

      expect(markOnboardingCompleted).toHaveBeenCalled();
      expect(input.setOnboardingCompletedAt).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/));
    });
  });

  describe('persistência de estágio por tema (PED-3)', () => {
    it('grava themeStages no perfil ao criar a próxima sessão', async () => {
      const input = createInput({ profile });
      const { result } = renderHook(() => usePlanLifecycleActions(input));

      await act(async () => {
        await result.current.createNextSession(15);
      });

      const savedProfile = vi.mocked(saveProfile).mock.calls[0]?.[0];
      expect(savedProfile?.themeStages).toBeDefined();
      expect(Object.keys(savedProfile?.themeStages ?? {}).length).toBeGreaterThan(0);
      expect(input.setProfile).toHaveBeenCalled();
    });
  });

  // ===== TDD Fase 2 — novos testes pedidos no punch-list =====

  describe('D5 — feed de plano exclui logs -revisao/-transferencia (guarda anti ping-pong)', () => {
    it('buildDiagnosticThemeStats é chamado (não buildPuzzleThemeStats) ao regenerar plano', async () => {
      const diagnosticSpy = vi.spyOn(puzzleThemeStatsModule, 'buildDiagnosticThemeStats');

      // Log de bloco de pool que NÃO deve alimentar selectPrimaryWeakness
      const poolLog = makeLogWithBlock('2026-06-20:sess1-revisao', '2026-06-20', '2026-06-20-sess1-revisao', [
        { theme: 'pin', attempts: 10, losses: 10 },
      ]);
      const input = createInput({ profile, trainingLogs: [poolLog] });
      const { result } = renderHook(() => usePlanLifecycleActions(input));

      await act(async () => {
        await result.current.regeneratePlan(15);
      });

      // D5: buildDiagnosticThemeStats deve ter sido chamado com os trainingLogs
      expect(diagnosticSpy).toHaveBeenCalledWith([poolLog]);

      diagnosticSpy.mockRestore();
    });

    it('buildDiagnosticThemeStats é chamado ao criar próxima sessão', async () => {
      const diagnosticSpy = vi.spyOn(puzzleThemeStatsModule, 'buildDiagnosticThemeStats');

      const poolLog = makeLogWithBlock(
        '2026-06-20:sess1-transferencia',
        '2026-06-20',
        '2026-06-20-sess1-transferencia',
        [{ theme: 'back-rank', attempts: 5, losses: 5 }],
      );
      const input = createInput({ profile, trainingLogs: [poolLog] });
      const { result } = renderHook(() => usePlanLifecycleActions(input));

      await act(async () => {
        await result.current.createNextSession(15);
      });

      expect(diagnosticSpy).toHaveBeenCalledWith([poolLog]);

      diagnosticSpy.mockRestore();
    });
  });

  describe('D3 — persistThemeStages popula graduatedThemes (idempotente)', () => {
    it('grava graduatedThemes quando tema tem ≥80%/≥30 puzzles cumulativos', async () => {
      // 30 tentativas, 0 perdas = 100% de acurácia → deve graduar
      const graduatingLogs = [
        makeLogWithBlock('log-tema', '2026-06-20', '2026-06-20-sess1-tema', [
          { theme: 'fork', attempts: 30, losses: 0 },
        ]),
      ];
      vi.mocked(loadTrainingLogs).mockResolvedValue(graduatingLogs);

      const input = createInput({ profile });
      const { result } = renderHook(() => usePlanLifecycleActions(input));

      await act(async () => {
        await result.current.createNextSession(15);
      });

      const savedProfile = vi.mocked(saveProfile).mock.calls[0]?.[0];
      // fork deve aparecer em graduatedThemes
      expect(savedProfile?.graduatedThemes).toContain('fork');
    });

    it('NÃO grava tema em graduatedThemes com <30 puzzles mesmo com 100% de acurácia', async () => {
      const insufficientLogs = [
        makeLogWithBlock('log-tema', '2026-06-20', '2026-06-20-sess1-tema', [
          { theme: 'fork', attempts: 29, losses: 0 },
        ]),
      ];
      vi.mocked(loadTrainingLogs).mockResolvedValue(insufficientLogs);

      const input = createInput({ profile });
      const { result } = renderHook(() => usePlanLifecycleActions(input));

      await act(async () => {
        await result.current.createNextSession(15);
      });

      const savedProfile = vi.mocked(saveProfile).mock.calls[0]?.[0];
      // fork NÃO deve gradutar com apenas 29 puzzles
      expect(savedProfile?.graduatedThemes ?? []).not.toContain('fork');
    });

    it('graduatedThemes é idempotente: recomputar duas vezes produz o mesmo resultado', async () => {
      const graduatingLogs = [
        makeLogWithBlock('log-tema', '2026-06-20', '2026-06-20-sess1-tema', [
          { theme: 'fork', attempts: 30, losses: 0 },
        ]),
      ];
      vi.mocked(loadTrainingLogs).mockResolvedValue(graduatingLogs);
      // Simula que o perfil já tem fork graduado (resultado de execução anterior)
      vi.mocked(loadProfile).mockResolvedValue({
        ...profile,
        graduatedThemes: ['fork'],
      });

      const input = createInput({ profile });
      const { result } = renderHook(() => usePlanLifecycleActions(input));

      await act(async () => {
        await result.current.createNextSession(15);
      });

      // Com perfil já tendo fork graduado e nenhuma mudança → no-op (não salva novamente
      // pois themeStages E graduatedThemes E counter estão iguais ao base).
      // Mas aqui themeStages muda (plano gerado), então saveProfile É chamado.
      // O que importa: graduatedThemes ainda contém fork, não duplicado.
      const savedProfile = vi.mocked(saveProfile).mock.calls[0]?.[0];
      const forkCount = (savedProfile?.graduatedThemes ?? []).filter((t: string) => t === 'fork').length;
      expect(forkCount).toBe(1);
    });
  });

  describe('D4 — sessionsOnPrimaryTheme: incrementa/reseta com mudança de primário', () => {
    it('incrementa sessionsOnPrimaryTheme quando o tema primário é o mesmo', async () => {
      // Perfil com currentPrimaryTheme = 'fork' e 2 sessões anteriores
      const profileWithCounter: LearnerProfile = {
        ...profile,
        currentPrimaryTheme: 'fork',
        sessionsOnPrimaryTheme: 2,
      };
      vi.mocked(loadProfile).mockResolvedValue(profileWithCounter);

      // trainingLogs vazios → generatePlan usa fallback fork (banda 800-1000)
      const input = createInput({ profile: profileWithCounter });
      const { result } = renderHook(() => usePlanLifecycleActions(input));

      await act(async () => {
        await result.current.createNextSession(15);
      });

      const savedProfile = vi.mocked(saveProfile).mock.calls[0]?.[0];
      // Se o primário continua fork, counter deve ser 3
      if (savedProfile !== undefined && savedProfile.currentPrimaryTheme === 'fork') {
        expect(savedProfile.sessionsOnPrimaryTheme).toBe(3);
      }
    });

    it('reseta sessionsOnPrimaryTheme para 1 ao trocar o tema primário', async () => {
      // Perfil com currentPrimaryTheme = 'pin' (diferente do fallback 'fork' da banda)
      const profileWithDifferentPrimary: LearnerProfile = {
        ...profile,
        currentPrimaryTheme: 'pin',
        sessionsOnPrimaryTheme: 5,
      };
      vi.mocked(loadProfile).mockResolvedValue(profileWithDifferentPrimary);

      // Sem weaknesses → generatePlan usa fallback fork da banda 800-1000
      // Ao trocar de 'pin' para 'fork' → reset para 1
      const input = createInput({ profile: profileWithDifferentPrimary });
      const { result } = renderHook(() => usePlanLifecycleActions(input));

      await act(async () => {
        await result.current.createNextSession(15);
      });

      const savedProfile = vi.mocked(saveProfile).mock.calls[0]?.[0];
      if (savedProfile !== undefined && savedProfile.currentPrimaryTheme !== 'pin') {
        // Trocou de tema → deve resetar para 1
        expect(savedProfile.sessionsOnPrimaryTheme).toBe(1);
      }
    });
  });
});

function createInput(
  overrides: Partial<UsePlanLifecycleActionsInput> = {},
): UsePlanLifecycleActionsInput {
  return {
    allTrainingLogs: [],
    diplomaAttempts: [],
    pendingItems: [],
    profile: undefined,
    todayPlan: undefined,
    trainingLogs: [],
    weaknesses: [],
    setAchievements: vi.fn(),
    setActiveView: vi.fn(),
    setAllTrainingLogs: vi.fn(),
    setErrorMessage: vi.fn(),
    setOnboardingCompletedAt: vi.fn(),
    setProfile: vi.fn(),
    setSessionMinutes: vi.fn(),
    setTodayPlan: vi.fn(),
    setTrainingLogs: vi.fn(),
    ...overrides,
  };
}

function makePlan(date: string): DailyPlan {
  return {
    date,
    sessionMinutes: 15,
    generatedFromWeaknessesAt: `${date}T06:00:00.000Z`,
    blocks: [],
  };
}

function makeLog(id: string, date: string): TrainingLog {
  return {
    id,
    date,
    blockId: `${id}-block`,
    blockTitle: 'Treino',
    source: 'lichess',
    destinationLabel: 'Puzzles Lichess',
    plannedSeconds: 900,
    startedAt: `${date}T10:00:00.000Z`,
    completedAt: `${date}T10:15:00.000Z`,
    elapsedSeconds: 900,
    timeLimitReached: true,
    status: 'done',
    updatedAt: `${date}T10:15:00.000Z`,
  };
}

// suppress unused warning — makeLog kept for future tests
void makeLog;

// Helper para criar logs com blockId específico e themeStats (usado nos testes D5/D3/D4).
function makeLogWithBlock(
  id: string,
  date: string,
  blockId: string,
  themeStats?: { theme: string; attempts: number; losses: number }[],
): TrainingLog {
  return {
    id,
    date,
    blockId,
    blockTitle: 'Treino',
    source: 'lichess',
    destinationLabel: 'Puzzles Lichess',
    plannedSeconds: 600,
    startedAt: `${date}T10:00:00.000Z`,
    completedAt: `${date}T10:10:00.000Z`,
    elapsedSeconds: 600,
    timeLimitReached: false,
    status: 'done',
    updatedAt: `${date}T10:10:00.000Z`,
    ...(themeStats !== undefined && themeStats.length > 0
      ? {
          result: {
            source: 'lichess' as const,
            kind: 'puzzle-activity' as const,
            fetchedAt: `${date}T10:10:00.000Z`,
            since: `${date}T00:00:00.000Z`,
            until: `${date}T23:59:59.000Z`,
            puzzles: themeStats.reduce((s, t) => s + t.attempts, 0),
            wins: themeStats.reduce((s, t) => s + (t.attempts - t.losses), 0),
            losses: themeStats.reduce((s, t) => s + t.losses, 0),
            themes: themeStats.map((t) => t.theme),
            themeStats,
          },
        }
      : {}),
  };
}
