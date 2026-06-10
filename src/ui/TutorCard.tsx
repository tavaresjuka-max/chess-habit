import {
  buildSessionMessage,
  buildPuzzleThemeStats,
  computeConsistency,
  diagnose,
  type DailyPlan,
  type TrainingLog,
  type TutorQuestionAnswer,
  type Weakness,
} from '../domain';
import { LemosAvatar } from './art/LemosAvatar';

type TutorCardProps = {
  plan: DailyPlan;
  weaknesses: Weakness[];
  trainingLogs: TrainingLog[];
  today: string;
  onAnswerTutorQuestion: (answer: TutorQuestionAnswer) => Promise<void>;
  onReconcileLichessResults: () => Promise<void>;
};

export function TutorCard({
  plan,
  weaknesses,
  trainingLogs,
  today,
  onAnswerTutorQuestion,
  onReconcileLichessResults,
}: TutorCardProps) {
  const consistency = computeConsistency(trainingLogs, today);
  const primaryWeakness = weaknesses[0];
  const evidenceLine = getEvidenceLine(plan, weaknesses);
  const hasUnreconciledPuzzleLog = trainingLogs.some(
    (log) => log.date === today && log.status === 'done' && log.result === undefined && isPuzzleLog(log),
  );
  const doneToday = trainingLogs
    .filter((log) => log.date === today && log.status === 'done')
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  const lastDone = doneToday[0];

  if (lastDone === undefined) {
    const message = buildSessionMessage({ phase: 'pre', primaryWeakness, consistency });
    return (
      <section className="tutor-card" aria-label="Professor Lemos">
        <div className="tutor-heading">
          <LemosAvatar size={46} />
          <h2>Professor Lemos</h2>
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

  return (
    <section className="tutor-card" aria-label="Professor Lemos">
      <div className="tutor-heading">
        <LemosAvatar size={46} />
        <h2>Professor Lemos</h2>
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
    <div className="button-row tutor-answer-row" role="group" aria-label="Registrar resposta para o Professor Lemos">
      <button
        type="button"
        className="secondary-button"
        onClick={() => {
          void onAnswerTutorQuestion('time');
        }}
      >
        Tempo
      </button>
      <button
        type="button"
        className="secondary-button"
        onClick={() => {
          void onAnswerTutorQuestion('calculation');
        }}
      >
        Cálculo
      </button>
      <button
        type="button"
        className="secondary-button"
        onClick={() => {
          void onAnswerTutorQuestion('loose-piece');
        }}
      >
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

  return 'Plano inicial: ainda faltam sinais suficientes do seu historico. Atualize Chess.com ou Lichess para calibrar melhor.';
}

function isPuzzleLog(log: TrainingLog): boolean {
  return log.destinationLabel.includes('Puzzle') || log.destinationLabel.includes('Puzzles');
}
