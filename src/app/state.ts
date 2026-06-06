import { useCallback, useEffect, useState } from 'react';
import { generatePlan, type DailyPlan, type LearnerProfile, type PlanBlock, type SessionMinutes } from '../domain';
import {
  clearAll,
  exportAllAsJson,
  getPlan,
  loadProfile,
  savePlan,
  saveProfile as saveStoredProfile,
} from '../infra/storage/appData';

export type AppView = 'today' | 'config';

export type LoadState = 'loading' | 'ready' | 'error';

export type AppState = {
  readonly activeView: AppView;
  readonly loadState: LoadState;
  readonly profile: LearnerProfile | undefined;
  readonly todayPlan: DailyPlan | undefined;
  readonly sessionMinutes: SessionMinutes;
  readonly errorMessage: string | undefined;
  readonly setActiveView: (view: AppView) => void;
  readonly saveProfile: (profile: LearnerProfile) => Promise<void>;
  readonly regeneratePlan: (minutes: SessionMinutes) => Promise<void>;
  readonly updateBlockStatus: (blockId: string, status: PlanBlock['status']) => Promise<void>;
  readonly exportBackup: () => Promise<string>;
  readonly clearAllData: () => Promise<void>;
};

export function useAppState(): AppState {
  const [activeView, setActiveView] = useState<AppView>('today');
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [profile, setProfile] = useState<LearnerProfile | undefined>(undefined);
  const [todayPlan, setTodayPlan] = useState<DailyPlan | undefined>(undefined);
  const [sessionMinutes, setSessionMinutes] = useState<SessionMinutes>(15);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;

    async function loadAppData() {
      try {
        const storedProfile = await loadProfile();

        if (!isMounted) {
          return;
        }

        if (storedProfile === undefined) {
          setActiveView('config');
          setLoadState('ready');
          return;
        }

        const date = getTodayDate();
        const storedPlan = await getPlan(date);
        const plan = storedPlan ?? generatePlan(storedProfile, [], storedProfile.defaultSessionMinutes, date);

        if (storedPlan === undefined) {
          await savePlan(plan);
        }

        setProfile(storedProfile);
        setSessionMinutes(storedProfile.defaultSessionMinutes);
        setTodayPlan(plan);
        setLoadState('ready');
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(toErrorMessage(error));
        setLoadState('error');
      }
    }

    void loadAppData();

    return () => {
      isMounted = false;
    };
  }, []);

  const saveProfile = useCallback(async (nextProfile: LearnerProfile) => {
    const date = getTodayDate();
    const plan = generatePlan(nextProfile, [], nextProfile.defaultSessionMinutes, date);

    await saveStoredProfile(nextProfile);
    await savePlan(plan);

    setProfile(nextProfile);
    setSessionMinutes(nextProfile.defaultSessionMinutes);
    setTodayPlan(plan);
    setActiveView('today');
    setErrorMessage(undefined);
  }, []);

  const regeneratePlan = useCallback(
    async (minutes: SessionMinutes) => {
      if (profile === undefined) {
        setActiveView('config');
        return;
      }

      const plan = generatePlan(profile, [], minutes, getTodayDate());

      await savePlan(plan);
      setSessionMinutes(minutes);
      setTodayPlan(plan);
      setErrorMessage(undefined);
    },
    [profile],
  );

  const updateBlockStatus = useCallback(
    async (blockId: string, status: PlanBlock['status']) => {
      if (todayPlan === undefined) {
        return;
      }

      const updatedAt = new Date().toISOString();
      const nextPlan: DailyPlan = {
        ...todayPlan,
        blocks: todayPlan.blocks.map((block) =>
          block.id === blockId
            ? {
                ...block,
                status,
                updatedAt,
              }
            : block,
        ),
      };

      await savePlan(nextPlan);
      setTodayPlan(nextPlan);
      setErrorMessage(undefined);
    },
    [todayPlan],
  );

  const clearAllData = useCallback(async () => {
    await clearAll();
    setProfile(undefined);
    setTodayPlan(undefined);
    setSessionMinutes(15);
    setActiveView('config');
    setErrorMessage(undefined);
  }, []);

  return {
    activeView,
    loadState,
    profile,
    todayPlan,
    sessionMinutes,
    errorMessage,
    setActiveView,
    saveProfile,
    regeneratePlan,
    updateBlockStatus,
    exportBackup: exportAllAsJson,
    clearAllData,
  };
}

export function createDefaultProfile(): LearnerProfile {
  return {
    lichessUsername: 'jukasparov',
    band: '800-1200',
    defaultSessionMinutes: 15,
    goals: ['Criar uma rotina consistente de treino'],
    updatedAt: new Date().toISOString(),
  };
}

function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${String(year)}-${month}-${day}`;
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Nao foi possivel carregar os dados locais.';
}
