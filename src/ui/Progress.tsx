import { TrendingUp } from 'lucide-react';
import {
  buildEfficacyBaseline,
  buildProgressTrend,
  buildSkillMap,
  buildTrackEffort,
  buildWeeklyDigest,
  getAchievementDefinition,
  type Achievement,
  type Signal,
  type TrainingLog,
  type Weakness,
} from '../domain';
import { DIPLOMAS, getDiplomaProgress } from '../domain/method/diplomas';
import type { DiplomaAttempt } from '../domain/method/types';
import { DiplomaSeal } from './art/DiplomaSeal';

type ProgressProps = {
  today: string;
  allTrainingLogs: TrainingLog[];
  diplomaAttempts: DiplomaAttempt[];
  achievements: Achievement[];
  weaknesses: Weakness[];
  signals: Signal[];
};

function formatAchievementDate(unlockedAt: string): string {
  const parsed = new Date(unlockedAt);

  if (Number.isNaN(parsed.getTime())) {
    return unlockedAt;
  }

  return parsed.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
}

const maxSkillRows = 12;

export function Progress({ today, allTrainingLogs, diplomaAttempts, achievements, weaknesses, signals }: ProgressProps) {
  const trend = buildProgressTrend(allTrainingLogs, today);
  const weeklyDigest = buildWeeklyDigest(allTrainingLogs, today);
  const skillMap = buildSkillMap(allTrainingLogs).slice(0, maxSkillRows);
  const trackEffort = buildTrackEffort(allTrainingLogs);
  const baseline = buildEfficacyBaseline({ allLogs: allTrainingLogs, signals, today });

  return (
    <section aria-labelledby="progress-title" className="panel">
      <div className="section-heading">
        <div>
          <h1 id="progress-title">Progresso</h1>
          <p>O que você já sabe, onde está melhorando e onde ainda trava — só com dados reais.</p>
        </div>
      </div>

      <section className="progress-section" aria-labelledby="progress-trend-title">
        <h2 id="progress-trend-title">
          <TrendingUp aria-hidden="true" size={16} /> Ritmo
        </h2>
        {trend !== undefined ? (
          <>
            <div className="weekly-report-metrics">
              <span className="metric-chip">{trend.thisWeekMinutes} min esta semana</span>
              <span className="metric-chip">{trend.previousWeekMinutes} min na anterior</span>
              {weeklyDigest !== undefined
                ? weeklyDigest.metrics.map((metric) => (
                    <span key={metric} className="metric-chip">
                      {metric}
                    </span>
                  ))
                : null}
            </div>
            <p>{trend.line}</p>
          </>
        ) : (
          <p>Sem treinos registrados ainda. A primeira sessão de hoje já começa este painel.</p>
        )}
      </section>

      <section className="progress-section" aria-labelledby="progress-skills-title">
        <h2 id="progress-skills-title">Habilidades por tema</h2>
        {skillMap.length > 0 ? (
          <ul className="skill-map" aria-label="Taxa de acerto por tema de puzzle">
            {skillMap.map((entry) => (
              <li key={entry.theme}>
                <div className="skill-map-row">
                  <span className="skill-map-theme">{entry.theme}</span>
                  <span className="skill-map-score">
                    {entry.accuracyPercent}% em {entry.attempts} tentativas
                  </span>
                </div>
                <div
                  className="skill-map-bar"
                  role="img"
                  aria-label={`${entry.theme}: ${String(entry.accuracyPercent)}% de acerto`}
                >
                  <div className="skill-map-bar-fill" style={{ width: `${String(entry.accuracyPercent)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>
            Ainda sem placar real por tema. Conclua blocos de puzzle e use “Conferir puzzles” com o
            Lichess conectado para preencher este mapa.
          </p>
        )}
      </section>

      <section className="progress-section" aria-labelledby="progress-effort-title">
        <h2 id="progress-effort-title">Esforço por trilha</h2>
        {trackEffort.length > 0 ? (
          <ul className="track-effort" aria-label="Minutos de treino por trilha do método">
            {trackEffort.map((entry) => (
              <li key={entry.trackId}>
                <span className="skill-map-theme">{entry.title}</span>
                <span className="skill-map-score">
                  {entry.minutes} min em {entry.blocks} {entry.blocks === 1 ? 'bloco' : 'blocos'}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p>O esforço por trilha aparece aqui depois dos primeiros blocos concluídos.</p>
        )}
      </section>

      <section className="progress-section" aria-labelledby="progress-diplomas-title">
        <h2 id="progress-diplomas-title">Diplomas</h2>
        <ul className="diploma-progress" aria-label="Progresso nos diplomas do método">
          {DIPLOMAS.map((diploma) => {
            const progress = getDiplomaProgress(diplomaAttempts, diploma.id);
            const passedSections = progress?.sections.filter((section) => section.passed).length ?? 0;

            return (
              <li key={diploma.id} className="diploma-row">
                <DiplomaSeal diplomaId={diploma.id} achieved={progress?.overallPassed === true} size={46} />
                <div className="diploma-row-text">
                  <div className="skill-map-row">
                    <span className="skill-map-theme">{diploma.title}</span>
                    <span className="skill-map-score">
                      {progress?.overallPassed === true
                        ? 'Conquistado'
                        : `${String(passedSections)}/${String(diploma.sections.length)} seções`}
                    </span>
                  </div>
                  <p className="config-hint">{diploma.description}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {achievements.length > 0 ? (
        <section className="progress-section" aria-labelledby="progress-achievements-title">
          <h2 id="progress-achievements-title">Conquistas</h2>
          <ul className="achievement-list" aria-label="Conquistas de esforço e hábito">
            {achievements.map((achievement) => {
              const definition = getAchievementDefinition(achievement.id);

              return (
                <li key={achievement.id} className="achievement-row">
                  <div className="skill-map-row">
                    <span className="achievement-title">{definition.title}</span>
                    <span className="skill-map-score">{formatAchievementDate(achievement.unlockedAt)}</span>
                  </div>
                  <p className="config-hint">{definition.description}</p>
                </li>
              );
            })}
          </ul>
          <p className="config-hint">Conquistas premiam esforço e hábito — nunca rating.</p>
        </section>
      ) : null}

      <section className="progress-section" aria-labelledby="progress-baseline-title">
        <h2 id="progress-baseline-title">Linha de base do método</h2>
        <div className="weekly-report-metrics">
          {baseline.overallPuzzleAccuracyPercent !== undefined ? (
            <span className="metric-chip">
              {baseline.overallPuzzleAccuracyPercent}% de acerto em {baseline.puzzleAttempts} puzzles
            </span>
          ) : null}
          {baseline.sessionCompletionPercent !== undefined ? (
            <span className="metric-chip">{baseline.sessionCompletionPercent}% dos blocos concluídos</span>
          ) : null}
          {baseline.averageDaysBetweenSessions !== undefined ? (
            <span className="metric-chip">retorno médio a cada {baseline.averageDaysBetweenSessions} dias</span>
          ) : null}
          {baseline.blundersPerGame !== undefined ? (
            <span className="metric-chip">{baseline.blundersPerGame} erros graves por partida</span>
          ) : null}
        </div>
        <p className="config-hint">
          Estes números medem se o método está funcionando — não são nota sua. Revisão da linha de
          base em julho de 2026.
        </p>
      </section>

      {weaknesses.length > 0 ? (
        <section className="progress-section" aria-labelledby="progress-weakness-title">
          <h2 id="progress-weakness-title">Onde ainda trava</h2>
          <ul className="track-effort" aria-label="Hipóteses de fraqueza atuais">
            {weaknesses
              .slice()
              .sort((left, right) => right.score - left.score)
              .slice(0, 5)
              .map((weakness) => (
                <li key={weakness.tag}>
                  <span className="skill-map-theme">{weakness.tag}</span>
                  <span className="skill-map-score">{weakness.evidence}</span>
                </li>
              ))}
          </ul>
          <p className="config-hint">
            São hipóteses a partir dos seus sinais, não diagnósticos definitivos. Sinais com mais de
            90 dias saem da conta.
          </p>
        </section>
      ) : null}
    </section>
  );
}
