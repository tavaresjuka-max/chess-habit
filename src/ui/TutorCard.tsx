import {
  buildSessionMessage,
  computeConsistency,
  diagnose,
  type DailyPlan,
  type TrainingLog,
  type Weakness,
} from '../domain';

type TutorCardProps = {
  plan: DailyPlan;
  weaknesses: Weakness[];
  trainingLogs: TrainingLog[];
  today: string;
};

export function TutorCard({ weaknesses, trainingLogs, today }: TutorCardProps) {
  const consistency = computeConsistency(trainingLogs, today);
  const primaryWeakness = weaknesses[0];
  const doneToday = trainingLogs
    .filter((log) => log.date === today && log.status === 'done')
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  const lastDone = doneToday[0];

  if (lastDone === undefined) {
    const message = buildSessionMessage({ phase: 'pre', primaryWeakness, consistency });
    return (
      <section className="tutor-card" aria-label="Professor Lemos">
        <h2>Professor Lemos</h2>
        {message.lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
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
  const diagnosis = diagnose(weaknesses);

  return (
    <section className="tutor-card" aria-label="Professor Lemos">
      <h2>Professor Lemos</h2>
      {message.lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
      {diagnosis.kind === 'cause' ? (
        <p className="tutor-diagnosis">
          {diagnosis.message} {diagnosis.procedure}
        </p>
      ) : (
        <p className="tutor-diagnosis">{diagnosis.message}</p>
      )}
    </section>
  );
}
