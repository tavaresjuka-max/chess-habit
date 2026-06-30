import { ExternalLink, RefreshCw } from 'lucide-react';
import {
  buildEfficacyBaseline,
  buildProgressTrend,
  buildSessionMilestoneSummary,
  buildSkillMap,
  buildTrackEffort,
  buildWeeklyDigest,
  getAchievementDefinition,
  type Achievement,
  type LearnerBand,
  type LichessStudyLink,
  type SessionMinutes,
  type Signal,
  type TrainingLog,
  type Weakness,
  type WeaknessTag,
} from '../domain';
import { DIPLOMAS, getDiplomaProgress } from '../domain/method/diplomas';
import { isDueToday } from '../domain/method/pendingItems';
import type { DiplomaAttempt, PendingTrainingItem } from '../domain/method/types';
import type { DiagnosisState, LichessConnectionState } from '../app/state';
import { lichessThemeLabel } from '../domain/lichessThemeLabels';
import { DiplomaSeal } from './art/DiplomaSeal';
import { formatWeaknessTag } from './formatWeakness';
import { MedalhaIcon } from './art/MedalhaIcon';
import { CurriculumCard } from './CurriculumCard';
import { Fold } from './Fold';
import { SessionMilestonesCard, type NextDiplomaSummary } from './SessionMilestonesCard';

type ProgressProps = {
  today: string;
  allTrainingLogs: TrainingLog[];
  diplomaAttempts: DiplomaAttempt[];
  achievements: Achievement[];
  weaknesses: Weakness[];
  signals: Signal[];
  sessionMinutes: SessionMinutes;
  learnerBand: LearnerBand | undefined;
  weeklyFocusTag: WeaknessTag | undefined;
  pendingItems: PendingTrainingItem[];
  diagnosisState: DiagnosisState;
  diagnosisMessage: string | undefined;
  lichessConnectionState: LichessConnectionState;
  lichessConnected: boolean;
  lichessMessage: string | undefined;
  lichessStudyLink: LichessStudyLink | undefined;
  onConnectLichess: () => Promise<void>;
  onSyncChesscomDiagnosis: () => Promise<void>;
  onSyncLichessDiagnosis: () => Promise<void>;
  onCreateLichessStudy: () => Promise<void>;
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
  return <progress aria-hidden="true" className="skill-map-bar-fill" max={100} value={clampPercent(percent)} />;
}

function clampPercent(percent: number): number {
  return Math.max(0, Math.min(100, percent));
}

function getNextDiplomaSummary(attempts: DiplomaAttempt[]): NextDiplomaSummary | undefined {
  for (const diploma of DIPLOMAS) {
    const progress = getDiplomaProgress(attempts, diploma.id);

    if (progress === null) {
      continue;
    }

    const passedSections = progress.sections.filter((section) => section.passed).length;
    const progressPercent = Math.round((passedSections / progress.sections.length) * 100);

    if (!progress.overallPassed) {
      return {
        title: progress.diploma.title,
        progressPercent,
      };
    }
  }

  return undefined;
}

export function Progress({
  today,
  allTrainingLogs,
  diplomaAttempts,
  achievements,
  weaknesses,
  signals,
  sessionMinutes,
  learnerBand,
  weeklyFocusTag,
  pendingItems,
  diagnosisState,
  diagnosisMessage,
  lichessConnectionState,
  lichessConnected,
  lichessMessage,
  lichessStudyLink,
  onConnectLichess,
  onSyncChesscomDiagnosis,
  onSyncLichessDiagnosis,
  onCreateLichessStudy,
}: ProgressProps) {
  const trend = buildProgressTrend(allTrainingLogs, today);
  const weeklyDigest = buildWeeklyDigest(allTrainingLogs, today);
  const skillMap = buildSkillMap(allTrainingLogs).slice(0, maxSkillRows);
  const trackEffort = buildTrackEffort(allTrainingLogs);
  const baseline = buildEfficacyBaseline({ allLogs: allTrainingLogs, signals, today });
  const sessionMilestoneSummary = buildSessionMilestoneSummary({ logs: allTrainingLogs, sessionMinutes });
  const nextDiploma = getNextDiplomaSummary(diplomaAttempts);
  // Mesmo critério (isDueToday) do badge "vencidas" da tela Hoje — os dois números
  // contam exatamente a mesma coisa, então nunca se contradizem entre as telas.
  const dueTodayCount = pendingItems.filter((item) => isDueToday(item)).length;
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

      {/* Status compacto: banda atual + vencidas hoje + próximo checkpoint visíveis
          em 1 segundo, SEM abrir nenhum fold. O council alertou que escancarar tudo
          vira sobrecarga — então é só este resumo no topo, não os folds abertos. */}
      <div className="progress-status-strip" aria-label="Resumo rápido">
        {learnerBand !== undefined ? <span className="metric-chip">Faixa {learnerBand}</span> : null}
        <span className={dueTodayCount > 0 ? 'metric-chip metric-chip-due' : 'metric-chip'}>
          {dueTodayCount > 0
            ? `${String(dueTodayCount)} ${dueTodayCount === 1 ? 'revisão vencida' : 'revisões vencidas'} hoje`
            : 'Nada vencido hoje'}
        </span>
        {nextDiploma !== undefined ? (
          <span className="metric-chip">
            Próximo: {nextDiploma.title} · {String(nextDiploma.progressPercent)}%
          </span>
        ) : null}
      </div>

      <Fold
        concept="metas"
        title={sessionMilestoneSummary.heading}
        meta={`${String(sessionMilestoneSummary.currentMilestone.progressPercent)}%`}
      >
        <SessionMilestonesCard
          summary={sessionMilestoneSummary}
          openPendingCount={pendingItems.length}
          dueTodayCount={dueTodayCount}
          nextDiploma={nextDiploma}
          hideHeading
        />
      </Fold>

      <Fold concept="trilha" title="O que você vai aprender">
        <CurriculumCard band={learnerBand} weeklyFocusTag={weeklyFocusTag} hideHeading />
      </Fold>

      {/* Tudo recolhido: o aluno abre só o que quer ver — mesma lógica do Hoje. */}
      <Fold
        concept="ritmo"
        title="Ritmo"
        {...(trend !== undefined ? { meta: `${String(trend.thisWeekExercises)} exercícios` } : {})}
      >
        {trend !== undefined ? (
          <>
            <div className="weekly-report-metrics">
              <span className="metric-chip">{trend.thisWeekExercises} exercícios esta semana</span>
              <span className="metric-chip">{trend.previousWeekExercises} na anterior</span>
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
            <p>Sem treinos. A primeira sessão ativa este painel.</p>
          </div>
        )}
      </Fold>

      <Fold
        concept="habilidades"
        title="Habilidades por tema"
        {...(skillMap.length > 0 ? { meta: `${String(skillMap.length)} temas` } : {})}
      >
        {skillMap.length > 0 ? (
          <ul className="skill-map" role="list" aria-label="Taxa de acerto por tema de puzzle">
            {skillMap.map((entry) => (
              <li key={entry.theme}>
                <div className="skill-map-row">
                  <span className="skill-map-theme">{lichessThemeLabel(entry.theme)}</span>
                  <span className="skill-map-score">
                    {entry.accuracyPercent}% em {entry.attempts} tentativas
                  </span>
                </div>
                <div
                  className="skill-map-bar"
                  role="img"
                  aria-label={`${lichessThemeLabel(entry.theme)}: ${String(entry.accuracyPercent)}% de acerto`}
                >
                  <SkillMapBar percent={entry.accuracyPercent} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>Sem placar por tema. Conclua blocos de puzzle e use “Conferir puzzles”.</p>
        )}
      </Fold>

      <Fold
        concept="trilha"
        title="Esforço por trilha"
        {...(trackEffort.length > 0 ? { meta: `${String(trackEffort.length)} trilhas` } : {})}
      >
        {trackEffort.length > 0 ? (
          <ul className="track-effort" role="list" aria-label="Exercícios por trilha do método">
            {trackEffort.map((entry) => (
              <li key={entry.trackId}>
                <span className="skill-map-theme">{entry.title}</span>
                <span className="skill-map-score">
                  {entry.blocks} {entry.blocks === 1 ? 'bloco' : 'blocos'} · {entry.exercises} exercícios
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p>O esforço por trilha aparece aqui depois dos primeiros blocos concluídos.</p>
        )}
      </Fold>

      <Fold concept="plano" title="Diplomas" meta={`${String(diplomasAchieved)}/${String(DIPLOMAS.length)}`}>
        <ul className="diploma-progress" role="list" aria-label="Progresso nos diplomas do método">
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
          <ul className="achievement-list" role="list" aria-label="Conquistas de esforço e hábito">
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
          <img
            src="/art/selo-cera-louro.webp"
            alt=""
            aria-hidden="true"
            className="conquistas-cera-seal"
            width={48}
            height={48}
          />
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
          <ul className="track-effort" role="list" aria-label="Hipóteses de fraqueza atuais">
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

      <Fold
        concept="lichess"
        title="Sincronizar e estudar"
        {...(lichessConnected ? {} : { meta: 'conectar' })}
      >
        <div className="diagnosis-strip" aria-live="polite">
          {!lichessConnected ? (
            <div className="diagnosis-group diagnosis-connect">
              <p className="config-hint">
                Conecte sua conta do Lichess para criar o Study do dia e conferir o resultado dos seus
                puzzles. O diagnóstico das partidas já funciona sem conectar.
              </p>
              <div className="diagnosis-actions">
                <button
                  type="button"
                  disabled={lichessConnectionState === 'syncing'}
                  onClick={() => {
                    void onConnectLichess();
                  }}
                >
                  <ExternalLink aria-hidden="true" size={16} />
                  Conectar Lichess
                </button>
              </div>
            </div>
          ) : null}

          <div className="diagnosis-group">
            <p className="config-hint">
              Puxa suas partidas recentes — o professor usa para achar onde você trava.
            </p>
            <div className="diagnosis-actions">
              <button
                type="button"
                className="secondary-button"
                disabled={diagnosisState === 'syncing'}
                onClick={() => {
                  void onSyncChesscomDiagnosis();
                }}
              >
                <RefreshCw aria-hidden="true" size={16} />
                {diagnosisState === 'syncing' ? 'Atualizando...' : 'Atualizar Chess.com'}
              </button>
              <button
                type="button"
                className="secondary-button"
                disabled={lichessConnectionState === 'syncing'}
                onClick={() => {
                  void onSyncLichessDiagnosis();
                }}
              >
                <RefreshCw aria-hidden="true" size={16} />
                {lichessConnectionState === 'syncing' ? 'Lichess...' : 'Atualizar Lichess'}
              </button>
            </div>
          </div>

          <div className="diagnosis-group">
            <p className="config-hint">
              Reúne os exercícios do dia num tabuleiro só, dentro do Lichess. Útil para treinar sem
              pular entre links.
            </p>
            <div className="diagnosis-actions">
              <button
                type="button"
                className="secondary-button"
                disabled={lichessConnectionState === 'syncing'}
                onClick={() => {
                  void onCreateLichessStudy();
                }}
              >
                Gerar Study do dia
              </button>
              {lichessStudyLink !== undefined ? (
                <a
                  className="button-link secondary-link"
                  href={lichessStudyLink.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Abrir Study do dia no Lichess (abre em nova aba)"
                >
                  Abrir Study do dia
                </a>
              ) : null}
            </div>
          </div>

          <div className="diagnosis-messages">
            {diagnosisMessage !== undefined ? <p>{diagnosisMessage}</p> : null}
            {lichessMessage !== undefined ? <p>{lichessMessage}</p> : null}
          </div>
        </div>
      </Fold>
    </section>
  );
}
