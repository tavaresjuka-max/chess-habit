import type { DailyPlan, PlanBlock, SessionMinutes } from '../domain';

type TodayProps = {
  plan: DailyPlan | undefined;
  sessionMinutes: SessionMinutes;
  onSessionMinutesChange: (minutes: SessionMinutes) => Promise<void>;
  onBlockStatusChange: (blockId: string, status: PlanBlock['status']) => Promise<void>;
};

const sessionOptions = [5, 15, 30, 60] satisfies SessionMinutes[];

export function Today({ plan, sessionMinutes, onSessionMinutesChange, onBlockStatusChange }: TodayProps) {
  if (plan === undefined) {
    return (
      <section aria-labelledby="today-title" className="panel">
        <h1 id="today-title">Hoje</h1>
        <p>Salve sua configuracao para gerar o plano local.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="today-title" className="panel today-panel">
      <div className="section-heading">
        <div>
          <h1 id="today-title">Hoje</h1>
          <p>{plan.date} · {plan.blocks.length} blocos · {plan.sessionMinutes} min</p>
        </div>
        <label className="compact-field">
          <span>Tempo</span>
          <select
            value={sessionMinutes}
            onChange={(event) => {
              void onSessionMinutesChange(Number(event.target.value) as SessionMinutes);
            }}
          >
            {sessionOptions.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} min
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="block-list">
        {plan.blocks.map((block) => (
          <article className="plan-block" key={block.id}>
            <div className="block-header">
              <h2>{block.title}</h2>
              <span className={`status-pill status-${block.status}`}>{formatStatus(block.status)}</span>
            </div>
            <p className="block-meta">{block.estimatedMinutes} min · {block.destination.label}</p>
            <p>{block.reason}</p>
            <p>{block.task}</p>
            <p className="coach-note">{block.coachNote}</p>
            <p className="stop-rule">{block.stopRule}</p>
            <div className="button-row">
              {block.destination.url !== undefined ? (
                <a className="button-link" href={block.destination.url} target="_blank" rel="noreferrer">
                  Abrir no Lichess
                </a>
              ) : (
                <span className="text-destination">Sem link automatico</span>
              )}
              <button
                type="button"
                onClick={() => {
                  void onBlockStatusChange(block.id, 'done');
                }}
              >
                Concluir
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  void onBlockStatusChange(block.id, 'skipped');
                }}
              >
                Pular
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function formatStatus(status: PlanBlock['status']): string {
  switch (status) {
    case 'pending':
      return 'Pendente';
    case 'done':
      return 'Feito';
    case 'skipped':
      return 'Pulado';
  }
}
