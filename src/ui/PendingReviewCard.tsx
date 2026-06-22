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
  const dueItems = pendingItems.filter((item) => isDueToday(item));

  // Aluno novo, sem nenhuma pendência: tela limpa, nada a mostrar.
  if (pendingItems.length === 0) {
    return null;
  }

  // Há revisões agendadas, mas nenhuma vence hoje: reforço positivo de que
  // está tudo em ordem, em vez de sumir e deixar o aluno na dúvida.
  if (dueItems.length === 0) {
    return (
      <section className="pending-review-card pending-review-clear" aria-labelledby="pending-review-title">
        <img
          src="/art/vazio-pendencias-em-dia.webp"
          alt=""
          aria-hidden="true"
          className="empty-state-art"
          width={140}
          height={140}
        />
        <h2 id="pending-review-title">Tudo em dia</h2>
        <p>Nenhuma revisão vence hoje. Pendências em ordem.</p>
      </section>
    );
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
  // Data LOCAL (igual a getTodayDate/toDateKey): usar UTC marcava "atrasada"
  // itens que vencem hoje na virada de meia-noite UTC.
  const now = new Date();
  const today = `${String(now.getFullYear())}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  if (dueAt === today) {
    return 'vence hoje';
  }

  if (dueAt < today) {
    return 'atrasada';
  }

  return `vence em ${dueAt}`;
}
