import { buildCurriculumOutlook, type LearnerBand, type WeaknessTag } from '../domain';
import { ConceptSeal } from './art/ConceptSeal';

type CurriculumCardProps = {
  band: LearnerBand | undefined;
  weeklyFocusTag: WeaknessTag | undefined;
  // Dentro de um Fold o título vem do summary da dobra — sem h2 duplicado.
  hideHeading?: boolean;
};

// Mapa da jornada: mostra o que o aluno vai aprender, semana a semana, fase
// por fase. A fase atual abre expandida com o marcador "agora" na semana cujo
// tema coincide com o foco do plano; as demais ficam recolhidas.
export function CurriculumCard({ band, weeklyFocusTag, hideHeading = false }: CurriculumCardProps) {
  const outlook = buildCurriculumOutlook(band, weeklyFocusTag);

  return (
    <section
      className="curriculum-card"
      {...(hideHeading ? { 'aria-label': 'O que você vai aprender' } : { 'aria-labelledby': 'curriculum-title' })}
    >
      {hideHeading ? null : (
        <h2 id="curriculum-title" className="curriculum-heading">
          <ConceptSeal concept="trilha" size={26} /> O que você vai aprender
        </h2>
      )}
      {outlook.map(({ phase, status, currentWeekNumber }) => (
        <details
          className={`curriculum-phase curriculum-phase-${status}`}
          key={phase.id}
          open={status === 'current'}
        >
          <summary>
            <span className="curriculum-phase-name">{phase.title}</span>
            <span className="curriculum-phase-sub">{phase.subtitle}</span>
            {status === 'current' ? <span className="curriculum-here">você está aqui</span> : null}
          </summary>
          {phase.weeks.length > 0 ? (
            <ol className="curriculum-weeks" role="list">
              {phase.weeks.map((week) => {
                const isNow = week.number === currentWeekNumber;

                return (
                  <li className={isNow ? 'curriculum-week curriculum-week-now' : 'curriculum-week'} key={week.number}>
                    <span className="curriculum-week-chip">Semana {week.number}</span>
                    <div className="curriculum-week-body">
                      <strong>
                        {week.title}
                        {isNow ? <span className="curriculum-now-badge">agora</span> : null}
                      </strong>
                      <p>{week.summary}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="curriculum-phase-note">{phase.note}</p>
          )}
        </details>
      ))}
      <p className="curriculum-caveat">A ordem se adapta ao que seus jogos mostram.</p>
    </section>
  );
}
