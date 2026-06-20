import { useCallback, type Dispatch, type SetStateAction } from 'react';
import {
  buildPuzzleThemeStats,
  createWeaknessFromPuzzleStats,
  createKnownManualSignals,
  createTutorQuestionSignal,
  detectWeaknesses,
  filterFreshSignals,
  generatePlan,
  type DailyPlan,
  type LearnerProfile,
  type LichessOAuthToken,
  type Signal,
  type SessionMinutes,
  type TrainingLog,
  type TutorQuestionAnswer,
  type Weakness,
} from '../domain';
import { confidenceRank } from '../domain/confidence';
import type { DiplomaAttempt, PendingTrainingItem } from '../domain/method/types';
import { importChesscomSignals } from '../infra/chesscom/chesscomClient';
import { importLichessSignals } from '../infra/lichess/games';
import {
  appendSignals,
  loadChesscomMonthCache,
  loadLichessOAuthToken,
  loadSignals,
  loadWeaknesses,
  replaceSignalsForSource,
  replaceWeaknesses,
  saveChesscomMonthCache,
  savePlan,
} from '../infra/storage/appData';
import type { AppView, DiagnosisState, LichessConnectionState } from './state';
import { getTodayDate } from './date';
import { toDiagnosisErrorMessage, toLichessErrorMessage } from './errorMessages';
import { getOperationEpoch, isCurrentOperationEpoch } from './operationEpoch';
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

let diagnosisWriteQueue: Promise<void> = Promise.resolve();

function runExclusiveDiagnosisWrite<T>(task: () => Promise<T>): Promise<T> {
  const run = diagnosisWriteQueue.then(task, task);
  diagnosisWriteQueue = run.then(
    () => undefined,
    () => undefined,
  );

  return run;
}

export type UseDiagnosisActionsInput = {
  profile: LearnerProfile | undefined;
  todayPlan: DailyPlan | undefined;
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

// Sinal mais recente salvo por fonte. Em Chess.com, observedAt preserva a data
// da evidencia mensal quando existe; maxAgeMs e um atalho best-effort, nao uma
// garantia exata de "ultimo sync".
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
  const {
    diplomaAttempts,
    latestPlanRef,
    pendingItems,
    profile,
    sessionMinutes,
    todayPlan,
    trainingLogs,
    setActiveView,
    setDiagnosisMessage,
    setDiagnosisState,
    setErrorMessage,
    setLichessConnectionState,
    setLichessMessage,
    setSignals,
    setTodayPlan,
    setWeaknesses,
  } = input;

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

      const operationEpoch = getOperationEpoch();
      const signals = await args.fetchSignals();

      if (!isCurrentOperationEpoch(operationEpoch)) {
        return undefined;
      }

      return runExclusiveDiagnosisWrite(async () => {
        if (!isCurrentOperationEpoch(operationEpoch)) {
          return undefined;
        }

        await replaceSignalsForSource(args.source, signals);

        if (!isCurrentOperationEpoch(operationEpoch)) {
          return undefined;
        }

      const allSignals = await loadSignals();
      setSignals(allSignals);
      const nowIso = new Date().toISOString();
      const date = getTodayDate();
      const recentThemeStats = buildPuzzleThemeStats(trainingLogs);
      const nextWeaknesses = mergePuzzleWeakness(
        detectWeaknesses(filterSignalsForDiagnosis(allSignals, nowIso), args.targetProfile.band),
        createWeaknessFromPuzzleStats(recentThemeStats, nowIso),
      );
      const plan = generatePlan(
        args.targetProfile,
        nextWeaknesses,
        sessionMinutes,
        date,
        buildPlanContext({
          previousPlan: latestPlanRef.current,
          recentThemeStats,
          trainingLogs,
          pendingItems,
          diplomaAttempts,
        }),
      );

      // Preserva a aprovação do plano: se o aluno aprovou enquanto a rede
      // respondia, o plano mais recente (ref) carrega a resposta — mantemos.
      const latestPlan = latestPlanRef.current;
      const mergedPlan =
        latestPlan?.date === plan.date && latestPlan.learningPlanResponse !== undefined
          ? { ...plan, learningPlanResponse: latestPlan.learningPlanResponse }
          : plan;

      if (!isCurrentOperationEpoch(operationEpoch)) {
        return undefined;
      }

      await replaceWeaknesses(nextWeaknesses);

      if (!isCurrentOperationEpoch(operationEpoch)) {
        return undefined;
      }

      await savePlan(mergedPlan);

      setWeaknesses(nextWeaknesses);
      setTodayPlan(mergedPlan);
      latestPlanRef.current = mergedPlan;

        return { signals, weaknesses: nextWeaknesses };
      });
    },
    [
      diplomaAttempts,
      latestPlanRef,
      pendingItems,
      sessionMinutes,
      setSignals,
      setTodayPlan,
      setWeaknesses,
      trainingLogs,
    ],
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
            setDiagnosisState('syncing');
            setDiagnosisMessage('Atualizando diagnóstico Chess.com.');
          },
          fetchSignals: () =>
            importChesscomSignals(targetProfile.chesscomUsername ?? '', {
              band: targetProfile.band,
              cache: {
                loadMonth: loadChesscomMonthCache,
                saveMonth: saveChesscomMonthCache,
              },
            }),
        });

        if (result === undefined) {
          return;
        }

        setDiagnosisState('success');
        setDiagnosisMessage(
          result.weaknesses.length === 0
            ? `Diagnóstico atualizado com ${String(result.signals.length)} sinais derivados. Ainda sem limiar suficiente; mantive plano conservador.`
            : `Diagnóstico atualizado com ${String(result.signals.length)} sinais derivados e ${String(result.weaknesses.length)} hipóteses.`,
        );
        setErrorMessage(undefined);
      } catch (error) {
        setDiagnosisState('error');
        setDiagnosisMessage(toDiagnosisErrorMessage(error));
      }
    },
    [runDiagnosisSync, setDiagnosisMessage, setDiagnosisState, setErrorMessage],
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
            setLichessConnectionState('syncing');
            setLichessMessage('Atualizando diagnóstico Lichess.');
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

        setLichessConnectionState(token === undefined ? 'disconnected' : 'connected');
        setLichessMessage(
          result.signals.length === 0
            ? 'Lichess atualizado, mas ainda sem sinais suficientes.'
            : `Lichess atualizado com ${String(result.signals.length)} sinais derivados.`,
        );
      } catch (error) {
        setLichessConnectionState('error');
        setLichessMessage(toLichessErrorMessage(error));
      }
    },
    [runDiagnosisSync, setLichessConnectionState, setLichessMessage],
  );

  // Onboarding: importa as fontes do perfil e ESPERA terminar (await), ao
  // contrário do auto-sync ao salvar, que é fire-and-forget. A tela "Importando"
  // bloqueia no loading até isto resolver e então decide a rota: faixa de dados
  // suficiente (alguma fraqueza detectada) → aprovar plano; senão → perguntas.
  // Lê as fraquezas do storage (fonte da verdade) em vez do estado React, que
  // ainda não terá propagado quando este await retorna.
  const runOnboardingImport = useCallback(
    async (targetProfile: LearnerProfile): Promise<{ weaknessCount: number }> => {
      const wantsChesscom = (targetProfile.chesscomUsername ?? '').trim() !== '';
      const wantsLichess = (targetProfile.lichessUsername ?? '').trim() !== '';

      // Cada sync tem catch próprio (não lança); uma fonte lenta/com erro não
      // cancela a outra. Sem maxAgeMs: puxa o histórico de propósito no onboarding.
      const jobs: Promise<unknown>[] = [];
      if (wantsChesscom) {
        jobs.push(runChesscomSync(targetProfile));
      }
      if (wantsLichess) {
        jobs.push(runLichessSync(targetProfile));
      }

      await Promise.allSettled(jobs);

      const weaknesses = await loadWeaknesses();

      return { weaknessCount: weaknesses.length };
    },
    [runChesscomSync, runLichessSync],
  );

  const syncChesscomDiagnosis = useCallback(async () => {
    if (profile === undefined) {
      setActiveView('config');
      return;
    }

    if (profile.chesscomUsername === undefined || profile.chesscomUsername.trim() === '') {
      setDiagnosisState('error');
      setDiagnosisMessage('Informe seu usuário Chess.com na Config.');
      setActiveView('config');
      return;
    }

    await runChesscomSync(profile);
  }, [profile, runChesscomSync, setActiveView, setDiagnosisMessage, setDiagnosisState]);

  const syncLichessDiagnosis = useCallback(async () => {
    if (profile === undefined) {
      setActiveView('config');
      return;
    }

    if (profile.lichessUsername === undefined || profile.lichessUsername.trim() === '') {
      setLichessConnectionState('error');
      setLichessMessage('Informe seu usuário Lichess na Config.');
      setActiveView('config');
      return;
    }

    await runLichessSync(profile);
  }, [profile, runLichessSync, setActiveView, setLichessConnectionState, setLichessMessage]);

  const importKnownManualSignals = useCallback(async () => {
    const manualSignals = createKnownManualSignals(new Date().toISOString());

    await replaceSignalsForSource('outro', manualSignals);

    const allSignals = await loadSignals();
    setSignals(allSignals);
    const nowIso = new Date().toISOString();
    const recentThemeStats = buildPuzzleThemeStats(trainingLogs);
    const nextWeaknesses = mergePuzzleWeakness(
      detectWeaknesses(filterSignalsForDiagnosis(allSignals, nowIso), profile?.band),
      createWeaknessFromPuzzleStats(recentThemeStats, nowIso),
    );

    await replaceWeaknesses(nextWeaknesses);
    setWeaknesses(nextWeaknesses);

    if (profile !== undefined) {
      const date = getTodayDate();
      const plan = generatePlan(
        profile,
        nextWeaknesses,
        sessionMinutes,
        date,
        buildPlanContext({
          previousPlan: todayPlan,
          recentThemeStats,
          trainingLogs,
          pendingItems,
          diplomaAttempts,
        }),
      );

      await savePlan(plan);
      setTodayPlan(plan);
    }

    return manualSignals.length;
  }, [
    diplomaAttempts,
    pendingItems,
    profile,
    sessionMinutes,
    setSignals,
    setTodayPlan,
    setWeaknesses,
    todayPlan,
    trainingLogs,
  ]);

  const answerTutorQuestion = useCallback(
    async (answer: TutorQuestionAnswer) => {
      const signal = createTutorQuestionSignal(answer, new Date().toISOString());

      await appendSignals([signal]);

      const allSignals = await loadSignals();
      setSignals(allSignals);
      const nowIso = new Date().toISOString();
      const recentThemeStats = buildPuzzleThemeStats(trainingLogs);
      const nextWeaknesses = mergePuzzleWeakness(
        detectWeaknesses(filterSignalsForDiagnosis(allSignals, nowIso), profile?.band),
        createWeaknessFromPuzzleStats(recentThemeStats, nowIso),
      );

      await replaceWeaknesses(nextWeaknesses);
      setWeaknesses(nextWeaknesses);

      if (profile !== undefined) {
        const date = getTodayDate();
        const plan = generatePlan(
          profile,
          nextWeaknesses,
          sessionMinutes,
          date,
          buildPlanContext({
            previousPlan: todayPlan,
            recentThemeStats,
            trainingLogs,
            pendingItems,
            diplomaAttempts,
          }),
        );

        await savePlan(plan);
        setTodayPlan(plan);
      }

      setDiagnosisState('success');
      setDiagnosisMessage('Resposta registrada. Ajustei as hipóteses do treino.');
      setErrorMessage(undefined);
    },
    [
      diplomaAttempts,
      pendingItems,
      profile,
      sessionMinutes,
      setDiagnosisMessage,
      setDiagnosisState,
      setErrorMessage,
      setSignals,
      setTodayPlan,
      setWeaknesses,
      todayPlan,
      trainingLogs,
    ],
  );

  return {
    answerTutorQuestion,
    importKnownManualSignals,
    runChesscomSync,
    runLichessSync,
    runOnboardingImport,
    syncChesscomDiagnosis,
    syncLichessDiagnosis,
  };
}

// Sinais Chess.com derivam observedAt do end_time real do jogo, então o corte de
// 90 dias os descartaria cedo demais (achado nº1: 294 sinais -> 0 fraquezas). Mas
// isentá-los por completo deixava ratings/aberturas de anos atrás vivos para sempre
// (fraquezas-fantasma). Meio-termo: Chess.com usa uma janela maior (365d) em vez de
// ilimitada; as demais fontes seguem com 90 dias.
const CHESSCOM_SIGNAL_MAX_AGE_DAYS = 365;

function filterSignalsForDiagnosis(signals: Signal[], nowIso: string): Signal[] {
  const freshSignals = new Set(filterFreshSignals(signals, nowIso));
  const chesscomFreshSignals = new Set(
    filterFreshSignals(signals, nowIso, CHESSCOM_SIGNAL_MAX_AGE_DAYS),
  );

  return signals.filter((signal) => {
    if (signal.source !== 'chesscom') {
      return freshSignals.has(signal);
    }

    // Rating é um retrato do momento: rating antigo (ex.: <1000 de meses atrás) não
    // reflete o jogador de hoje e gerava fraqueza-fantasma de anti-blunder. Rating
    // expira em 90 dias (janela padrão); os demais sinais chesscom (accuracy/opening
    // derivados de jogos) seguem com a janela maior de 365 dias.
    if (signal.value.kind === 'rating') {
      return freshSignals.has(signal);
    }

    return chesscomFreshSignals.has(signal);
  });
}

function mergePuzzleWeakness(weaknesses: Weakness[], puzzleWeakness: Weakness | undefined): Weakness[] {
  if (puzzleWeakness === undefined) {
    return weaknesses;
  }

  const existing = weaknesses.find((weakness) => weakness.tag === puzzleWeakness.tag);

  if (existing === undefined) {
    return [...weaknesses, puzzleWeakness].sort(sortWeaknessesByScore);
  }

  return weaknesses
    .map((weakness) =>
      weakness.tag === puzzleWeakness.tag
        ? {
            ...weakness,
            score: Math.max(weakness.score, puzzleWeakness.score),
            confidence:
              confidenceRank[puzzleWeakness.confidence] > confidenceRank[weakness.confidence]
                ? puzzleWeakness.confidence
                : weakness.confidence,
            evidence: puzzleWeakness.score > weakness.score ? puzzleWeakness.evidence : weakness.evidence,
          }
        : weakness,
    )
    .sort(sortWeaknessesByScore);
}

function sortWeaknessesByScore(left: Weakness, right: Weakness): number {
  if (right.score !== left.score) {
    return right.score - left.score;
  }

  return left.tag.localeCompare(right.tag);
}
