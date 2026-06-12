import { ExternalLink } from 'lucide-react';
import { isDueToday } from '../domain/method/pendingItems';
import type { PendingTrainingItem } from '../domain/method/types';
import { ConceptSeal } from './art/ConceptSeal';

type PendingReviewCardProps = {
  pendingItems: PendingTrainingItem[];
  onOpenItem: (item: PendingTrainingItem) => void;
  onDeferItem: (item: PendingTrainingItem) => void;
};

export function PendingReviewCard({ pendingItems, onOpenItem, onDeferItem }: PendingReviewCardProps) {
  const dueItems = pendingItems.filter(isDueToday);

  if (dueItems.length === 0) {
    return null;
  }

  return (
    <section className="pending-review-card" aria-labelledby="pending-review-title">
      <div className="pending-review-heading">
        <ConceptSeal concept="pendencias" size={28} />
        <div>
          <h2 id="pending-review-title">Pendências de hoje ({dueItems.length})</h2>
          <p>Antes de avançar, feche o que ficou em aberto.</p>
        </div>
      </div>

      <ul className="pending-review-list">
        {dueItems.map((item) => (
          <li key={item.id}>
            <div>
              <strong>{item.title}</strong>
              <span>{formatDueDate(item.dueAt)}</span>
            </div>
            <p>{item.prompt}</p>
            <div className="button-row">
              <button
                type="button"
                onClick={() => {
                  onOpenItem(item);
                }}
              >
                <ExternalLink aria-hidden="true" size={16} />
                Abrir no Lichess
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  onDeferItem(item);
                }}
              >
                Adiar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function formatDueDate(dueAt: string): string {
  const today = new Date().toISOString().slice(0, 10);

  if (dueAt === today) {
    return 'vence hoje';
  }

  if (dueAt < today) {
    return 'atrasada';
  }

  return `vence em ${dueAt}`;
}
