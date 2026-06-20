import { Brain, Clock, ShieldAlert } from 'lucide-react';
import {
  buildSessionMessage,
  buildPuzzleThemeStats,
  computeConsistency,
  diagnose,
  isPuzzleTrainingLog,
  type CoachMessagePhase,
  type DailyPlan,
  type PlanBlockFeedback,
  type TrainingLog,
  type TutorQuestionAnswer,
  type Weakness,
} from '../domain';

type TutorCardProps = {
  plan: DailyPlan;
  weaknesses: Weakness[];
  trainingLogs: TrainingLog[];
  // Histórico completo: a constância (streak, retorno após pausa) precisa de
  // todos os dias, não só os logs de hoje. trainingLogs segue sendo o recorte
  // do dia para o estado "feito hoje".
  allTrainingLogs: TrainingLog[];
  today: string;
  onAnswerTutorQuestion: (answer: TutorQuestionAnswer) => Promise<void>;
  onReconcileLichessResults: () => Promise<void>;
};

const POSE: Record<CoachMessagePhase, string> & { close_hard: string; close_cause: string } = {
  welcome: 'boas-vindas',
  return: 'chamando-de-volta',
  close: 'aprovando',
  close_hard: 'pensando',
  close_cause: 'explicando',
};

function poseFor(phase: CoachMessagePhase, feedback?: PlanBlockFeedback, diagnosisKind?: string): string {
  if (phase !== 'close') return POSE[phase];
  if (diagnosisKind === 'cause') return POSE.close_cause;
  if (feedback === 'hard') return POSE.close_hard;
  return POSE.close;
}

function LemosPortrait({ pose }: { pose: string }) {
  return (
    <div className="tutor-portrait-frame">
      <img
        src={`/art/lemos-pose-${pose}.webp`}
        alt=""
        aria-hidden="true"
        className="tutor-pose"
      />
    </div>
  );
}

export function TutorCard({
  plan,
  weaknesses,
  trainingLogs,
  allTrainingLogs,
  today,
  onAnswerTutorQuestion,
  onReconcileLichessResults,
}: TutorCardProps) {
  const consistency = computeConsistency(allTrainingLogs, today);
  const primaryWeakness = weaknesses[0];
  const evidenceLine = getEvidenceLine(plan, weaknesses);
  const hasUnreconciledPuzzleLog = trainingLogs.some(
    (log) => log.date === today && log.status === 'done' && log.result === undefined && isPuzzleTrainingLog(log),
  );
  const doneToday = trainingLogs
    .filter((log) => log.date === today && log.status === 'done')
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  const lastDone = doneToday[0];

  if (lastDone === undefined) {
    const message = buildSessionMessage({ phase: 'pre', primaryWeakness, consistency });
    const pose = poseFor(message.phase);
    return (
      <section className="tutor-card" aria-label="Professor Tavarez">
        <div className="tutor-heading">
          <LemosPortrait pose={pose} />
          <h2>Professor Tavarez</h2>
        </div>
        {message.lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
        {evidenceLine !== undefined ? <p className="tutor-diagnosis">{evidenceLine}</p> : null}
      </section>
    );
  }

  const message = buildSessionMessage({
    phase: 'post',
    consistency,
    primaryWeakness,
    lastFeedback: lastDone.feedback,
    puzzleResult: lastDone.result,
  });
  const diagnosis = diagnose(weaknesses, buildPuzzleThemeStats(trainingLogs));
  const pose = poseFor(message.phase, lastDone.feedback, diagnosis.kind);

  return (
    <section className="tutor-card" aria-label="Professor Tavarez">
      <div className="tutor-heading">
        <LemosPortrait pose={pose} />
        <h2>Professor Tavarez</h2>
      </div>
      {message.lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
      {hasUnreconciledPuzzleLog ? (
        <div className="button-row tutor-answer-row">
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              void onReconcileLichessResults();
            }}
          >
            Conferir puzzles
          </button>
        </div>
      ) : null}
      {evidenceLine !== undefined ? <p className="tutor-diagnosis">{evidenceLine}</p> : null}
      {diagnosis.kind === 'cause' ? (
        <p className="tutor-diagnosis">
          {diagnosis.message} {diagnosis.procedure}
        </p>
      ) : (
        <>
          <p className="tutor-diagnosis">{diagnosis.message}</p>
          <TutorAnswerButtons onAnswerTutorQuestion={onAnswerTutorQuestion} />
        </>
      )}
    </section>
  );
}

function TutorAnswerButtons({
  onAnswerTutorQuestion,
}: {
  onAnswerTutorQuestion: (answer: TutorQuestionAnswer) => Promise<void>;
}) {
  return (
    <div className="button-row tutor-answer-row" role="group" aria-label="Registrar resposta para o Professor Tavarez">
      <button
        type="button"
        className="secondary-button"
        onClick={() => {
          void onAnswerTutorQuestion('time');
        }}
      >
        <Clock aria-hidden="true" size={15} />
        Tempo
      </button>
      <button
        type="button"
        className="secondary-button"
        onClick={() => {
          void onAnswerTutorQuestion('calculation');
        }}
      >
        <Brain aria-hidden="true" size={15} />
        Cálculo
      </button>
      <button
        type="button"
        className="secondary-button"
        onClick={() => {
          void onAnswerTutorQuestion('loose-piece');
        }}
      >
        <ShieldAlert aria-hidden="true" size={15} />
        Peça solta
      </button>
    </div>
  );
}

function getEvidenceLine(plan: DailyPlan, weaknesses: Weakness[]): string | undefined {
  if (weaknesses.length > 0) {
    return undefined;
  }

  if (plan.weeklyFocus?.reason.includes('Tema conservador') !== true) {
    return undefined;
  }

  return 'Faltam sinais do seu histórico. Atualize Chess.com ou Lichess para calibrar.';
}
