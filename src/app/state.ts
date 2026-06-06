import { useCallback, useEffect, useState } from 'react';
import {
  detectWeaknesses,
  createKnownManualSignals,
  completeTrainingLog,
  createTrainingLog,
  generatePlan,
  normalizePlanDestinations,
  skipTrainingLog,
  type DailyPlan,
  type LearnerProfile,
  type PlanBlock,
  type SessionMinutes,
  type TrainingLog,
  type Weakness,
} from '../domain';
import { ChesscomRateLimitError, importChesscomSignals } from '../infra/chesscom/chesscomClient';
import {
  clearAll,
  exportAllAsJson,
  getPlan,
  getTrainingLog,
  loadChesscomMonthCache,
  loadProfile,
  loadSignals,
  loadTrainingLogsForDate,
  loadWeaknesses,
  replaceSignalsForSource,
  replaceWeaknesses,
  saveChesscomMonthCache,
  savePlan,
  saveProfile as saveStoredProfile,
  saveTrainingLog,
} from '../infra/storage/appData';

export type AppView = 'today' | 'config';

export type LoadState = 'loading' | 'ready' | 'error';
export type DiagnosisState = 'idle' | 'syncing' | 'success' | 'error';

export type AppState = {
  readonly activeView: AppView;
  readonly loadState: LoadState;
  readonly profile: LearnerProfile | undefined;
  readonly todayPlan: DailyPlan | undefined;
  readonly sessionMinutes: SessionMinutes;
  readonly trainingLogs: TrainingLog[];
  readonly weaknesses: Weakness[];
  readonly diagnosisState: DiagnosisState;
  readonly diagnosisMessage: string | undefined;
  readonly errorMessage: string | undefined;
  readonly setActiveView: (view: AppView) => void;
  readonly saveProfile: (profile: LearnerProfile) => Promise<void>;
  readonly regeneratePlan: (minutes: SessionMinutes) => Promise<void>;
  readonly importKnownManualSignals: () => Promise<number>;
  readonly syncChesscomDiagnosis: () => Promise<void>;
  readonly startBlockTraining: (block: PlanBlock) => Promise<void>;
  readonly completeBlockTraining: (blockId: string) => Promise<void>;
  readonly skipBlockTraining: (blockId: string) => Promise<void>;
  readonly exportBackup: () => Promise<string>;
  readonly clearAllData: () => Promise<void>;
};

export function useAppState(): AppState {
  const [activeView, setActiveView] = useState<AppView>('today');
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [profile, setProfile] = useState<LearnerProfile | undefined>(undefined);
  const [todayPlan, setTodayPlan] = useState<DailyPlan | undefined>(undefined);
  const [sessionMinutes, setSessionMinutes] = useState<SessionMinutes>(15);
  const [trainingLogs, setTrainingLogs] = useState<TrainingLog[]>([]);
  const [weaknesses, setWeaknesses] = useState<Weakness[]>([]);
  const [diagnosisState, setDiagnosisState] = useState<DiagnosisState>('idle');
  const [diagnosisMessage, setDiagnosisMessage] = useState<string | undefined>(undefined);
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
        const storedWeaknesses = await loadWeaknesses();
        const storedPlan = await getPlan(date);
        const storedTrainingLogs = await loadTrainingLogsForDate(date);
        const plan =
          storedPlan === undefined
            ? generatePlan(storedProfile, storedWeaknesses, storedProfile.defaultSessionMinutes, date)
            : normalizePlanDestinations(storedPlan);

        if (storedPlan === undefined || plan !== storedPlan) {
          await savePlan(plan);
        }

        setProfile(storedProfile);
        setSessionMinutes(storedProfile.defaultSessionMinutes);
        setTrainingLogs(storedTrainingLogs);
        setWeaknesses(storedWeaknesses);
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
    const plan = generatePlan(nextProfile, weaknesses, nextProfile.defaultSessionMinutes, date);

    await saveStoredProfile(nextProfile);
    await savePlan(plan);

    setProfile(nextProfile);
    setSessionMinutes(nextProfile.defaultSessionMinutes);
      setTodayPlan(plan);
      setActiveView('today');
      setErrorMessage(undefined);
      setTrainingLogs(await loadTrainingLogsForDate(date));
  }, [weaknesses]);

  const regeneratePlan = useCallback(
    async (minutes: SessionMinutes) => {
      if (profile === undefined) {
        setActiveView('config');
        return;
      }

      const plan = generatePlan(profile, weaknesses, minutes, getTodayDate());

      await savePlan(plan);
      setSessionMinutes(minutes);
      setTodayPlan(plan);
      setErrorMessage(undefined);
    },
    [profile, weaknesses],
  );

  const syncChesscomDiagnosis = useCallback(async () => {
    if (profile === undefined) {
      setActiveView('config');
      return;
    }

    if (profile.chesscomUsername === undefined || profile.chesscomUsername.trim() === '') {
      setDiagnosisState('error');
      setDiagnosisMessage('Informe seu usuario Chess.com na Config.');
      setActiveView('config');
      return;
    }

    setDiagnosisState('syncing');
    setDiagnosisMessage('Atualizando diagnostico Chess.com.');

    try {
      const signals = await importChesscomSignals(profile.chesscomUsername, {
        cache: {
          loadMonth: loadChesscomMonthCache,
          saveMonth: saveChesscomMonthCache,
        },
      });

      await replaceSignalsForSource('chesscom', signals);

      const allSignals = await loadSignals();
      const nextWeaknesses = detectWeaknesses(allSignals);
      const date = getTodayDate();
      const plan = generatePlan(profile, nextWeaknesses, sessionMinutes, date);

      await replaceWeaknesses(nextWeaknesses);
      await savePlan(plan);

      setWeaknesses(nextWeaknesses);
      setTodayPlan(plan);
      setDiagnosisState('success');
      setDiagnosisMessage(
        nextWeaknesses.length === 0
          ? `Diagnostico atualizado com ${String(signals.length)} sinais derivados. Ainda sem limiar suficiente; mantive plano conservador.`
          : `Diagnostico atualizado com ${String(signals.length)} sinais derivados e ${String(nextWeaknesses.length)} hipoteses.`,
      );
      setErrorMessage(undefined);
    } catch (error) {
      setDiagnosisState('error');
      setDiagnosisMessage(toDiagnosisErrorMessage(error));
    }
  }, [profile, sessionMinutes]);

  const importKnownManualSignals = useCallback(async () => {
    const manualSignals = createKnownManualSignals(new Date().toISOString());

    await replaceSignalsForSource('outro', manualSignals);

    const allSignals = await loadSignals();
    const nextWeaknesses = detectWeaknesses(allSignals);

    await replaceWeaknesses(nextWeaknesses);
    setWeaknesses(nextWeaknesses);

    if (profile !== undefined) {
      const date = getTodayDate();
      const plan = generatePlan(profile, nextWeaknesses, sessionMinutes, date);

      await savePlan(plan);
      setTodayPlan(plan);
    }

    return manualSignals.length;
  }, [profile, sessionMinutes]);

  const startBlockTraining = useCallback(
    async (block: PlanBlock) => {
      if (todayPlan === undefined) {
        return;
      }

      const startedAt = new Date().toISOString();
      const log = createTrainingLog({
        block,
        date: todayPlan.date,
        startedAt,
      });

      await saveTrainingLog(log);
      setTrainingLogs(upsertTrainingLog(trainingLogs, log));

      if (block.destination.url !== undefined) {
        window.open(block.destination.url, '_blank', 'noopener,noreferrer');
      }
    },
    [todayPlan, trainingLogs],
  );

  const updateBlockStatusWithTrainingLog = useCallback(
    async (blockId: string, status: PlanBlock['status']) => {
      if (todayPlan === undefined) {
        return;
      }

      const updatedAt = new Date().toISOString();
      const existingLog = await getTrainingLog(`${todayPlan.date}:${blockId}`);

      if (status === 'done') {
        const block = todayPlan.blocks.find((planBlock) => planBlock.id === blockId);

        if (block !== undefined) {
          const baseLog =
            existingLog ??
            createTrainingLog({
              block,
              date: todayPlan.date,
              startedAt: updatedAt,
            });
          const completedLog = completeTrainingLog({
            log: baseLog,
            completedAt: updatedAt,
          });

          await saveTrainingLog(completedLog);
          setTrainingLogs(upsertTrainingLog(trainingLogs, completedLog));
        }
      }

      if (status === 'skipped' && existingLog !== undefined) {
        const skippedLog = skipTrainingLog({
          log: existingLog,
          skippedAt: updatedAt,
        });

        await saveTrainingLog(skippedLog);
        setTrainingLogs(upsertTrainingLog(trainingLogs, skippedLog));
      }

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
    [todayPlan, trainingLogs],
  );

  const skipBlockTraining = useCallback(
    async (blockId: string) => {
      await updateBlockStatusWithTrainingLog(blockId, 'skipped');
    },
    [updateBlockStatusWithTrainingLog],
  );

  const clearAllData = useCallback(async () => {
    await clearAll();
    setProfile(undefined);
    setTodayPlan(undefined);
    setSessionMinutes(15);
    setTrainingLogs([]);
    setWeaknesses([]);
    setDiagnosisState('idle');
    setDiagnosisMessage(undefined);
    setActiveView('config');
    setErrorMessage(undefined);
  }, []);

  return {
    activeView,
    loadState,
    profile,
    todayPlan,
    sessionMinutes,
    trainingLogs,
    weaknesses,
    diagnosisState,
    diagnosisMessage,
    errorMessage,
    setActiveView,
    saveProfile,
    regeneratePlan,
    importKnownManualSignals,
    syncChesscomDiagnosis,
    startBlockTraining,
    completeBlockTraining: (blockId: string) => updateBlockStatusWithTrainingLog(blockId, 'done'),
    skipBlockTraining,
    exportBackup: exportAllAsJson,
    clearAllData,
  };
}

export function createDefaultProfile(): LearnerProfile {
  return {
    lichessUsername: 'jukasparov',
    chesscomUsername: 'jukatavares',
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

function toDiagnosisErrorMessage(error: unknown): string {
  if (error instanceof ChesscomRateLimitError) {
    return error.message;
  }

  return error instanceof Error ? error.message : 'Nao foi possivel atualizar o diagnostico Chess.com.';
}

function upsertTrainingLog(logs: TrainingLog[], nextLog: TrainingLog): TrainingLog[] {
  const existingIndex = logs.findIndex((log) => log.id === nextLog.id);

  if (existingIndex === -1) {
    return [...logs, nextLog];
  }

  return logs.map((log, index) => (index === existingIndex ? nextLog : log));
}
