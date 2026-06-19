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
import { formatWeaknessTag } from './formatWeakness';
import { MedalhaIcon } from './art/MedalhaIcon';
import { Fold } from './Fold';
import { useBarFill } from './useBarFill';

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

function SkillMapBar({ percent }: { percent: number }) {
  return <div className="skill-map-bar-fill" ref={useBarFill(percent)} />;
}

export function Progress({ today, allTrainingLogs, diplomaAttempts, achievements, weaknesses, signals }: ProgressProps) {
  const trend = buildProgressTrend(allTrainingLogs, today);
  const weeklyDigest = buildWeeklyDigest(allTrainingLogs, today);
  const skillMap = buildSkillMap(allTrainingLogs).slice(0, maxSkillRows);
  const trackEffort = buildTrackEffort(allTrainingLogs);
  const baseline = buildEfficacyBaseline({ allLogs: allTrainingLogs, signals, today });
  const diplomasAchieved = DIPLOMAS.filter(
    (diploma) => getDiplomaProgress(diplomaAttempts, diploma.id)?.overallPassed === true,
  ).length;

  return (
    <section aria-labelledby="progress-title" className="panel">
      <div className="section-heading">
        <div>
          <h1 id="progress-title">Progresso</h1>
          <p>Dados reais: o que você já sabe, onde melhora, onde ainda trava.</p>
        </div>
      </div>

      {/* Tudo recolhido: o aluno abre só o que quer ver — mesma lógica do Hoje. */}
      <Fold
        concept="ritmo"
        title="Ritmo"
        defaultOpen
        {...(trend !== undefined ? { meta: `${String(trend.thisWeekMinutes)} min` } : {})}
      >
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
          <div className="progress-empty">
            <img
              src="/art/vazio-sem-treinos.webp"
              alt=""
              aria-hidden="true"
              className="empty-state-art"
              width={140}
              height={140}
            />
            <p>Sem treinos ainda. A primeira sessão ativa este painel.</p>
          </div>
        )}
      </Fold>

      <Fold
        concept="habilidades"
        title="Habilidades por tema"
        {...(skillMap.length > 0 ? { meta: `${String(skillMap.length)} temas` } : {})}
      >
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
                  <SkillMapBar percent={entry.accuracyPercent} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>Sem placar por tema ainda. Conclua blocos de puzzle e use “Conferir puzzles”.</p>
        )}
      </Fold>

      <Fold
        concept="trilha"
        title="Esforço por trilha"
        {...(trackEffort.length > 0 ? { meta: `${String(trackEffort.length)} trilhas` } : {})}
      >
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
      </Fold>

      <Fold concept="plano" title="Diplomas" meta={`${String(diplomasAchieved)}/${String(DIPLOMAS.length)}`}>
        <ul className="diploma-progress" aria-label="Progresso nos diplomas do método">
          {DIPLOMAS.map((diploma) => {
            const progress = getDiplomaProgress(diplomaAttempts, diploma.id);
            const achieved = progress?.overallPassed === true;
            const passedSections = progress?.sections.filter((section) => section.passed).length ?? 0;

            return (
              <li key={diploma.id} className={`diploma-row${achieved ? ' diploma-row-achieved' : ''}`}>
                {achieved ? (
                  <img
                    src={`/art/diploma-${diploma.id}.webp`}
                    alt={`Diploma ${diploma.title} conquistado`}
                    className="diploma-art"
                    width={120}
                    height={160}
                  />
                ) : (
                  <DiplomaSeal diplomaId={diploma.id} achieved={false} size={46} />
                )}
                <div className="diploma-row-text">
                  <div className="skill-map-row">
                    <span className="skill-map-theme">{diploma.title}</span>
                    <span className="skill-map-score">
                      {achieved
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
      </Fold>

      {achievements.length > 0 ? (
        <Fold concept="conquistas" title="Conquistas" meta={String(achievements.length)}>
          <ul className="achievement-list" aria-label="Conquistas de esforço e hábito">
            {achievements.map((achievement) => {
              const definition = getAchievementDefinition(achievement.id);

              return (
                <li key={achievement.id} className="achievement-row">
                  <MedalhaIcon achievementId={achievement.id} size={64} />
                  <div className="achievement-text">
                    <div className="skill-map-row">
                      <span className="achievement-title">{definition.title}</span>
                      <span className="skill-map-score">{formatAchievementDate(achievement.unlockedAt)}</span>
                    </div>
                    <p className="config-hint">{definition.description}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Fold>
      ) : null}

      <Fold concept="linha-base" title="Linha de base do método">
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
        <p className="config-hint">Medem o método, não você. Revisão em julho de 2026.</p>
      </Fold>

      {weaknesses.length > 0 ? (
        <Fold concept="trava" title="Onde ainda trava" meta={String(Math.min(weaknesses.length, 5))}>
          <ul className="track-effort" aria-label="Hipóteses de fraqueza atuais">
            {weaknesses
              .slice()
              .sort((left, right) => right.score - left.score)
              .slice(0, 5)
              .map((weakness) => (
                <li key={weakness.tag}>
                  <span className="skill-map-theme">{formatWeaknessTag(weakness.tag)}</span>
                  <span className="skill-map-score">{weakness.evidence}</span>
                </li>
              ))}
          </ul>
          <p className="config-hint">Hipóteses, não diagnósticos — sinais antigos saem da conta.</p>
        </Fold>
      ) : null}
    </section>
  );
}
