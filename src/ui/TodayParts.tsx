import type { DayCompletionSummary, TrainingRoadmapItem } from '../domain';
import { clampPercent, formatRoadmapStatus } from './todayHelpers';

export function DayProgressFill({ percent }: { percent: number }) {
  return <progress aria-hidden="true" className="day-progress-fill" max={100} value={clampPercent(percent)} />;
}

export function DayCompletionCard({ summary }: { summary: DayCompletionSummary | undefined }) {
  if (summary === undefined) {
    return null;
  }

  return (
    <section className="day-completion-card" aria-labelledby="day-completion-title">
      <div>
        <h2 id="day-completion-title">{summary.heading}</h2>
        <ul className="completion-metrics" role="list" aria-label="Resumo do treino">
          {summary.metrics.map((metric) => (
            <li key={metric}>{metric}</li>
          ))}
        </ul>
      </div>
      {summary.lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </section>
  );
}

// O título "Próximos passos" vem do Fold que embrulha a lista.
export function RoadmapList({ items }: { items: TrainingRoadmapItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <ol className="roadmap-list" role="list" aria-label="Próximos passos do roteiro">
      {items.map((item) => (
        <li className={`roadmap-item roadmap-${item.status}`} key={item.id}>
          <div>
            <strong>{item.label}</strong>
            <span>{item.minutes} min</span>
          </div>
          <p>{item.title}</p>
          <small>
            {formatRoadmapStatus(item.status)} - {item.destinationLabel}
          </small>
        </li>
      ))}
    </ol>
  );
}
