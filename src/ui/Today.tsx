import type { DailyPlan, PlanBlock, SessionMinutes, Weakness } from '../domain';
import type { DiagnosisState } from '../app/state';

type TodayProps = {
  plan: DailyPlan | undefined;
  sessionMinutes: SessionMinutes;
  weaknesses: Weakness[];
  diagnosisState: DiagnosisState;
  diagnosisMessage: string | undefined;
  onSessionMinutesChange: (minutes: SessionMinutes) => Promise<void>;
  onSyncChesscomDiagnosis: () => Promise<void>;
  onBlockStatusChange: (blockId: string, status: PlanBlock['status']) => Promise<void>;
};

const sessionOptions = [5, 15, 30, 60] satisfies SessionMinutes[];

export function Today({
  plan,
  sessionMinutes,
  weaknesses,
  diagnosisState,
  diagnosisMessage,
  onSessionMinutesChange,
  onSyncChesscomDiagnosis,
  onBlockStatusChange,
}: TodayProps) {
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

      <div className="diagnosis-strip" aria-live="polite">
        <button
          type="button"
          className="secondary-button"
          disabled={diagnosisState === 'syncing'}
          onClick={() => {
            void onSyncChesscomDiagnosis();
          }}
        >
          {diagnosisState === 'syncing' ? 'Atualizando...' : 'Atualizar Chess.com'}
        </button>
        {diagnosisMessage !== undefined ? <p>{diagnosisMessage}</p> : null}
      </div>

      {weaknesses.length > 0 ? (
        <div className="weakness-row" aria-label="Hipoteses atuais">
          {weaknesses
            .slice()
            .sort((left, right) => right.score - left.score)
            .slice(0, 3)
            .map((weakness) => (
            <span className="weakness-chip" key={weakness.tag}>
              {formatWeaknessTag(weakness.tag)} ({Math.round(weakness.score * 100)}%)
            </span>
            ))}
        </div>
      ) : null}

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

function formatWeaknessTag(tag: Weakness['tag']): string {
  switch (tag) {
    case 'hanging-piece':
      return 'pecas penduradas';
    case 'fork':
      return 'garfos';
    case 'pin':
      return 'cravadas';
    case 'skewer':
      return 'espetos';
    case 'discovered':
      return 'ataques descobertos';
    case 'mate-in-1':
      return 'mate em 1';
    case 'mate-in-2':
      return 'mate em 2';
    case 'back-rank':
      return 'mate na ultima fileira';
    case 'opening-principles':
      return 'abertura';
    case 'time-trouble':
      return 'tempo';
    case 'endgame-pawn':
      return 'final de peoes';
    case 'endgame-rook':
      return 'final de torres';
    case 'conversion':
      return 'conversao';
    case 'blunder-rate':
      return 'anti-blunder';
  }
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
