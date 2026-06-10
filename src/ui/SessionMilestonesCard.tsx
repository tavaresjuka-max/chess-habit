import { Target } from 'lucide-react';
import type { SessionMilestone, SessionMilestoneStats, SessionMilestoneSummary } from '../domain';

type SessionMilestonesCardProps = {
  summary: SessionMilestoneSummary;
  openPendingCount?: number;
  nextDiploma?: NextDiplomaSummary;
};

export type NextDiplomaSummary = {
  title: string;
  progressPercent: number;
};

export function SessionMilestonesCard({ summary, openPendingCount = 0, nextDiploma }: SessionMilestonesCardProps) {
  return (
    <section className="session-milestones-card" aria-labelledby="session-milestones-title">
      <div className="session-milestones-heading">
        <Target aria-hidden="true" size={18} />
        <div>
          <h2 id="session-milestones-title">{summary.heading}</h2>
          <p>{summary.intro}</p>
        </div>
      </div>

      <CurrentMilestone milestone={summary.currentMilestone} nextCheckpoint={summary.nextCheckpoint} />
      <MethodProgressBadges openPendingCount={openPendingCount} nextDiploma={nextDiploma} />
      <MilestoneStats stats={summary.stats} />
      <SkillSignals signals={summary.skillSignals} nextSignalToMeasure={summary.nextSignalToMeasure} />

      <ol className="session-milestone-track" aria-label="Marcos da fase">
        {summary.milestones.map((milestone) => (
          <li className={`session-milestone-step milestone-${milestone.status}`} key={milestone.id}>
            <span>{milestone.label}</span>
            <small>
              {formatHours(milestone.targetHours)} / {String(milestone.targetSessions)} sessoes
            </small>
          </li>
        ))}
      </ol>

      <div className="session-milestone-lines" aria-label="Evolucao observada">
        {summary.stats.improvementLines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </section>
  );
}

function MethodProgressBadges({
  openPendingCount,
  nextDiploma,
}: {
  openPendingCount: number;
  nextDiploma: NextDiplomaSummary | undefined;
}) {
  if (openPendingCount === 0 && nextDiploma === undefined) {
    return null;
  }

  return (
    <div className="method-progress-badges" aria-label="Pendências e diplomas">
      {openPendingCount > 0 ? (
        <span>
          {openPendingCount} pendência{openPendingCount > 1 ? 's' : ''} abertas
        </span>
      ) : null}
      {nextDiploma !== undefined ? (
        <span>
          Próximo checkpoint: {nextDiploma.title} ({String(nextDiploma.progressPercent)}%)
        </span>
      ) : null}
    </div>
  );
}

function SkillSignals({
  signals,
  nextSignalToMeasure,
}: {
  signals: readonly string[];
  nextSignalToMeasure: string;
}) {
  return (
    <div className="method-note-panel session-skill-signals" aria-label="Sinais de habilidade">
      <strong>O que esta evoluindo</strong>
      <ul>
        {signals.map((signal) => (
          <li key={signal}>{signal}</li>
        ))}
      </ul>
      <p>{nextSignalToMeasure}</p>
    </div>
  );
}

function CurrentMilestone({
  milestone,
  nextCheckpoint,
}: {
  milestone: SessionMilestone;
  nextCheckpoint: string;
}) {
  return (
    <div className="session-milestone-current" aria-label="Meta atual">
      <div className="session-milestone-current-line">
        <strong>{milestone.label}</strong>
        <span>{String(milestone.progressPercent)}%</span>
      </div>
      <progress
        aria-label={`Progresso de ${milestone.label}`}
        className="session-milestone-progress"
        max={100}
        value={milestone.progressPercent}
      />
      <p>
        {formatHours(milestone.completedHours)} de {formatHours(milestone.targetHours)} -{' '}
        {String(milestone.completedSessions)} de {String(milestone.targetSessions)} sessoes previstas.
      </p>
      <p className="session-milestone-next">{nextCheckpoint}</p>
    </div>
  );
}

function MilestoneStats({ stats }: { stats: SessionMilestoneStats }) {
  const items = [
    {
      id: 'sessions',
      value: String(stats.completedSessions),
      label: stats.completedSessions === 1 ? 'sessao concluida' : 'sessoes concluidas',
    },
    { id: 'hours', value: formatHours(stats.completedHours), label: 'horas treinadas' },
    { id: 'blocks', value: String(stats.completedBlocks), label: 'blocos feitos' },
    ...(stats.puzzleAttempts > 0
      ? [{ id: 'puzzles', value: String(stats.puzzleAttempts), label: 'puzzles reconciliados' }]
      : []),
    ...(stats.puzzleAccuracy === undefined
      ? []
      : [{ id: 'accuracy', value: `${String(stats.puzzleAccuracy)}%`, label: 'acerto em puzzles' }]),
  ];

  return (
    <ul className="session-milestone-stats" aria-label="Estatisticas da fase">
      {items.map((item) => (
        <li key={item.id}>
          <strong>{item.value}</strong>
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

function formatHours(hours: number): string {
  if (hours === 0) {
    return '0h';
  }

  return Number.isInteger(hours) ? `${String(hours)}h` : `${hours.toFixed(1)}h`;
}
