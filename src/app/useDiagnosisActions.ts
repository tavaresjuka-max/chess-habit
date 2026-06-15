import { useCallback, type Dispatch, type SetStateAction } from 'react';
import {
  buildPuzzleThemeStats,
  detectWeaknesses,
  filterFreshSignals,
  generatePlan,
  type DailyPlan,
  type LearnerProfile,
  type LichessOAuthToken,
  type Signal,
  type SessionMinutes,
  type TrainingLog,
  type Weakness,
} from '../domain';
import type { DiplomaAttempt, PendingTrainingItem } from '../domain/method/types';
import { importChesscomSignals } from '../infra/chesscom/chesscomClient';
import { importLichessSignals } from '../infra/lichess/games';
import {
  loadChesscomMonthCache,
  loadLichessOAuthToken,
  loadSignals,
  replaceSignalsForSource,
  replaceWeaknesses,
  saveChesscomMonthCache,
  savePlan,
} from '../infra/storage/appData';
import type { AppView, DiagnosisState, LichessConnectionState } from './state';
import { getTodayDate } from './date';
import { toDiagnosisErrorMessage, toLichessErrorMessage } from './errorMessages';
import { buildPlanContext } from './stateHelpers';

// Decisão 4 do dono (aprovada): o auto-sync (ao salvar) puxa só as partidas
// recentes para não travar no celular; o botão manual "Atualizar Lichess"
// continua puxando o histórico completo (max indefinido).
const AUTO_SYNC_MAX_LICHESS_GAMES = 500;

type DiagnosisSyncOptions = { maxAgeMs?: number };

type DiagnosisSyncResult = {
  signals: Signal[];
  weaknesses: Weakness[];
};

type LatestPlanRef = {
  current: DailyPlan | undefined;
};

export type UseDiagnosisActionsInput = {
  profile: LearnerProfile | undefined;
  sessionMinutes: SessionMinutes;
  trainingLogs: TrainingLog[];
  pendingItems: PendingTrainingItem[];
  diplomaAttempts: DiplomaAttempt[];
  latestPlanRef: LatestPlanRef;
  setActiveView: Dispatch<SetStateAction<AppView>>;
  setDiagnosisState: Dispatch<SetStateAction<DiagnosisState>>;
  setDiagnosisMessage: Dispatch<SetStateAction<string | undefined>>;
  setErrorMessage: Dispatch<SetStateAction<string | undefined>>;
  setSignals: Dispatch<SetStateAction<Signal[]>>;
  setWeaknesses: Dispatch<SetStateAction<Weakness[]>>;
  setTodayPlan: Dispatch<SetStateAction<DailyPlan | undefined>>;
  setLichessConnectionState: Dispatch<SetStateAction<LichessConnectionState>>;
  setLichessMessage: Dispatch<SetStateAction<string | undefined>>;
};

// Quando foi o último diagnóstico bem-sucedido de uma fonte: derivado do
// observedAt mais recente dos sinais salvos daquela fonte (cada sync grava
// observedAt = agora). undefined se a fonte nunca sincronizou.
async function latestSignalObservedAt(source: Signal['source']): Promise<string | undefined> {
  const all = await loadSignals();
  let latest: string | undefined;

  for (const signal of all) {
    if (signal.source === source && (latest === undefined || signal.observedAt > latest)) {
      latest = signal.observedAt;
    }
  }

  return latest;
}

export function useDiagnosisActions(input: UseDiagnosisActionsInput) {
  const runDiagnosisSync = useCallback(
    async (args: {
      source: Extract<Signal['source'], 'chesscom' | 'lichess'>;
      targetProfile: LearnerProfile;
      fetchSignals: () => Promise<Signal[]>;
      onStart: () => void;
      options?: DiagnosisSyncOptions;
    }): Promise<DiagnosisSyncResult | undefined> => {
      if (args.options?.maxAgeMs !== undefined) {
        const lastSyncAt = await latestSignalObservedAt(args.source);
        if (lastSyncAt !== undefined && Date.now() - Date.parse(lastSyncAt) < args.options.maxAgeMs) {
          return undefined;
        }
      }

      args.onStart();

      const signals = await args.fetchSignals();

      await replaceSignalsForSource(args.source, signals);

      const allSignals = await loadSignals();
      input.setSignals(allSignals);
      const nextWeaknesses = detectWeaknesses(
        filterFreshSignals(allSignals, new Date().toISOString()),
        args.targetProfile.band,
      );
      const date = getTodayDate();
      const recentThemeStats = buildPuzzleThemeStats(input.trainingLogs);
      const plan = generatePlan(
        args.targetProfile,
        nextWeaknesses,
        input.sessionMinutes,
        date,
        buildPlanContext({
          previousPlan: input.latestPlanRef.current,
          recentThemeStats,
          trainingLogs: input.trainingLogs,
          pendingItems: input.pendingItems,
          diplomaAttempts: input.diplomaAttempts,
        }),
      );

      // Preserva a aprovação do plano: se o aluno aprovou enquanto a rede
      // respondia, o plano mais recente (ref) carrega a resposta — mantemos.
      const latestPlan = input.latestPlanRef.current;
      const mergedPlan =
        latestPlan?.date === plan.date && latestPlan.learningPlanResponse !== undefined
          ? { ...plan, learningPlanResponse: latestPlan.learningPlanResponse }
          : plan;

      await replaceWeaknesses(nextWeaknesses);
      await savePlan(mergedPlan);

      input.setWeaknesses(nextWeaknesses);
      input.setTodayPlan(mergedPlan);
      input.latestPlanRef.current = mergedPlan;

      return { signals, weaknesses: nextWeaknesses };
    },
    [input],
  );

  const runChesscomSync = useCallback(
    async (targetProfile: LearnerProfile, options?: DiagnosisSyncOptions) => {
      if (targetProfile.chesscomUsername === undefined || targetProfile.chesscomUsername.trim() === '') {
        return;
      }

      try {
        const result = await runDiagnosisSync({
          source: 'chesscom',
          targetProfile,
          options,
          onStart: () => {
            input.setDiagnosisState('syncing');
            input.setDiagnosisMessage('Atualizando diagnóstico Chess.com.');
          },
          fetchSignals: () =>
            importChesscomSignals(targetProfile.chesscomUsername ?? '', {
              cache: {
                loadMonth: loadChesscomMonthCache,
                saveMonth: saveChesscomMonthCache,
              },
            }),
        });

        if (result === undefined) {
          return;
        }

        input.setDiagnosisState('success');
        input.setDiagnosisMessage(
          result.weaknesses.length === 0
            ? `Diagnóstico atualizado com ${String(result.signals.length)} sinais derivados. Ainda sem limiar suficiente; mantive plano conservador.`
            : `Diagnóstico atualizado com ${String(result.signals.length)} sinais derivados e ${String(result.weaknesses.length)} hipóteses.`,
        );
        input.setErrorMessage(undefined);
      } catch (error) {
        input.setDiagnosisState('error');
        input.setDiagnosisMessage(toDiagnosisErrorMessage(error));
      }
    },
    [input, runDiagnosisSync],
  );

  const runLichessSync = useCallback(
    async (targetProfile: LearnerProfile, options?: DiagnosisSyncOptions) => {
      if (targetProfile.lichessUsername === undefined || targetProfile.lichessUsername.trim() === '') {
        return;
      }

      let token: LichessOAuthToken | undefined;

      try {
        const result = await runDiagnosisSync({
          source: 'lichess',
          targetProfile,
          options,
          onStart: () => {
            input.setLichessConnectionState('syncing');
            input.setLichessMessage('Atualizando diagnóstico Lichess.');
          },
          fetchSignals: async () => {
            token = await loadLichessOAuthToken();
            // Auto-sync (maxAgeMs presente) limita ao recente; manual puxa tudo.
            const max = options?.maxAgeMs !== undefined ? AUTO_SYNC_MAX_LICHESS_GAMES : undefined;

            return importLichessSignals({
              username: targetProfile.lichessUsername ?? '',
              token: token?.accessToken,
              ...(max === undefined ? {} : { max }),
            });
          },
        });

        if (result === undefined) {
          return;
        }

        input.setLichessConnectionState(token === undefined ? 'disconnected' : 'connected');
        input.setLichessMessage(
          result.signals.length === 0
            ? 'Lichess atualizado, mas ainda sem sinais suficientes.'
            : `Lichess atualizado com ${String(result.signals.length)} sinais derivados.`,
        );
      } catch (error) {
        input.setLichessConnectionState('error');
        input.setLichessMessage(toLichessErrorMessage(error));
      }
    },
    [input, runDiagnosisSync],
  );

  const syncChesscomDiagnosis = useCallback(async () => {
    if (input.profile === undefined) {
      input.setActiveView('config');
      return;
    }

    if (input.profile.chesscomUsername === undefined || input.profile.chesscomUsername.trim() === '') {
      input.setDiagnosisState('error');
      input.setDiagnosisMessage('Informe seu usuário Chess.com na Config.');
      input.setActiveView('config');
      return;
    }

    await runChesscomSync(input.profile);
  }, [input, runChesscomSync]);

  const syncLichessDiagnosis = useCallback(async () => {
    if (input.profile === undefined) {
      input.setActiveView('config');
      return;
    }

    if (input.profile.lichessUsername === undefined || input.profile.lichessUsername.trim() === '') {
      input.setLichessConnectionState('error');
      input.setLichessMessage('Informe seu usuário Lichess na Config.');
      input.setActiveView('config');
      return;
    }

    await runLichessSync(input.profile);
  }, [input, runLichessSync]);

  return {
    runChesscomSync,
    runLichessSync,
    syncChesscomDiagnosis,
    syncLichessDiagnosis,
  };
}
