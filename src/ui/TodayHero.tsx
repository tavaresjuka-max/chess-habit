import { useState, type MouseEvent } from 'react';
import { isAllowedExternalUrl, openExternalUrl } from '../app/externalOpen';
import type { LearnerBand, PlanBlock } from '../domain';

// Conceitos com arte premium gerada em public/art/conceito-<tag>.webp. Os demais
// continuam com o diagrama SVG preciso (TacticDiagram) no cartão de treino abaixo.
const CONCEPT_IMAGE_TAGS = new Set<string>(['fork']);

// Cabeçalho action-first da tela Hoje. Componente PRESENTACIONAL: recebe valores
// já computados por Today.tsx e NÃO recalcula regra de negócio. O botão "Treinar
// agora" reusa o MESMO handler de abrir/treinar (onStartBlockTraining +
// openExternalUrl) que o PlanBlockCard usa — zero lógica nova de treino.
type TodayHeroProps = {
  heroBlock: PlanBlock | undefined;
  doneBlockCount: number;
  totalBlocks: number;
  currentStreakDays: number;
  learnerBand: LearnerBand | undefined;
  dueCount: number;
  checkpointLabel: string;
  remainingSessions: number;
  onStartBlockTraining: (block: PlanBlock) => Promise<void>;
  onChangeFocus: () => void;
};

export function TodayHero({
  heroBlock,
  doneBlockCount,
  totalBlocks,
  currentStreakDays,
  learnerBand,
  dueCount,
  checkpointLabel,
  remainingSessions,
  onStartBlockTraining,
  onChangeFocus,
}: TodayHeroProps) {
  const [isOpening, setIsOpening] = useState(false);
  const [openWarning, setOpenWarning] = useState<string | undefined>(undefined);

  const safeUrl =
    heroBlock?.destination.url !== undefined && isAllowedExternalUrl(heroBlock.destination.url)
      ? heroBlock.destination.url
      : undefined;

  const percent = totalBlocks === 0 ? 0 : Math.min(100, Math.round((doneBlockCount / totalBlocks) * 100));
  const isConcluded = heroBlock === undefined;
  // "Sem vergonha de zero": a sequência só aparece quando já é real (>=2 dias).
  const showStreak = currentStreakDays >= 2;

  // Mesma ação de abrir/treinar do PlanBlockCard: onStartBlockTraining + openExternalUrl.
  async function handleTrainClick(event: MouseEvent<HTMLAnchorElement>): Promise<void> {
    event.preventDefault();
    if (heroBlock === undefined || isOpening) {
      return;
    }
    setIsOpening(true);
    setOpenWarning(undefined);
    try {
      await onStartBlockTraining(heroBlock);
      if (safeUrl !== undefined) {
        setOpenWarning(openExternalUrl(safeUrl));
      }
    } finally {
      setIsOpening(false);
    }
  }

  async function handleTrainButtonClick(): Promise<void> {
    if (heroBlock === undefined || isOpening) {
      return;
    }
    setIsOpening(true);
    setOpenWarning(undefined);
    try {
      await onStartBlockTraining(heroBlock);
    } finally {
      setIsOpening(false);
    }
  }

  return (
    <section className="today-hero" aria-label="Resumo de hoje">
      <div className="today-hero-strip">
        {showStreak ? (
          <span
            className="today-hero-streak"
            aria-label={`${String(currentStreakDays)} dias seguidos de treino`}
          >
            <strong>{String(currentStreakDays)}</strong>
            <span>dias seguidos</span>
          </span>
        ) : null}
        <div className="today-hero-progress">
          <div
            className="today-hero-progress-track"
            role="progressbar"
            aria-label="Progresso do dia"
            aria-valuemin={0}
            aria-valuemax={totalBlocks}
            aria-valuenow={doneBlockCount}
            aria-valuetext={
              totalBlocks === 0
                ? 'Sem blocos planejados'
                : `${String(doneBlockCount)} de ${String(totalBlocks)} blocos`
            }
          >
            <div className="today-hero-progress-fill" style={{ width: `${String(percent)}%` }} />
          </div>
          <span className="today-hero-progress-label">
            {`${String(doneBlockCount)}/${String(totalBlocks)} blocos`}
            {learnerBand !== undefined ? ` · faixa ${learnerBand}` : ''}
          </span>
          {dueCount > 0 ? (
            <span
              className="today-hero-due-badge"
              aria-label={`${String(dueCount)} revis${dueCount === 1 ? 'ão' : 'ões'} vencida${dueCount === 1 ? '' : 's'}`}
            >
              {`${String(dueCount)} vencida${dueCount === 1 ? '' : 's'}`}
            </span>
          ) : null}
        </div>
      </div>

      <div className="today-hero-body">
        <img
          className="today-hero-portrait"
          src="/art/tavarez-hero-retrato.webp"
          alt="Professor Tavarez pronto para orientar o treino de hoje"
          width={112}
          height={112}
        />
        <div className="today-hero-mission">
          {isConcluded ? (
            <>
              <p className="today-hero-eyebrow">Dia concluído</p>
              <h2 className="today-hero-title">Treino de hoje fechado</h2>
              <p className="today-hero-coach-note">
                Você cumpriu o plano do dia. Descanse e volte amanhã para a próxima rodada.
              </p>
            </>
          ) : (
            <>
              <p className="today-hero-eyebrow">Missão de agora</p>
              <h2 className="today-hero-title">{heroBlock.title}</h2>
              <p className="today-hero-meta">{`≈ ${String(heroBlock.estimatedMinutes)} min · ${heroBlock.destination.label}`}</p>
              {heroBlock.weaknessTag !== undefined && CONCEPT_IMAGE_TAGS.has(heroBlock.weaknessTag) ? (
                <img
                  className="today-hero-concept"
                  src={`/art/conceito-${heroBlock.weaknessTag}.webp`}
                  alt=""
                  aria-hidden="true"
                  width={72}
                  height={72}
                />
              ) : null}
              <p className="today-hero-coach-note">{heroBlock.coachNote}</p>
              <div className="today-hero-actions">
                {safeUrl !== undefined ? (
                  <a
                    className="button-link today-hero-train"
                    href={safeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Treinar agora: ${heroBlock.title} (abre em nova aba)`}
                    onClick={(event) => {
                      void handleTrainClick(event);
                    }}
                  >
                    {isOpening ? 'Abrindo…' : 'Treinar agora'}
                  </a>
                ) : (
                  <button
                    type="button"
                    className="today-hero-train"
                    disabled={isOpening}
                    onClick={() => {
                      void handleTrainButtonClick();
                    }}
                  >
                    {isOpening ? 'Abrindo…' : 'Treinar agora'}
                  </button>
                )}
                <button type="button" className="link-button today-hero-change" onClick={onChangeFocus}>
                  Trocar o foco de hoje
                </button>
              </div>
              {openWarning !== undefined ? (
                <p className="today-hero-warning" role="status">
                  {openWarning}
                </p>
              ) : null}
            </>
          )}
          <ul className="today-hero-chips" role="list" aria-label="Sinais de hoje">
            <li>
              <span>A recuperar</span>
              <strong>{String(dueCount)}</strong>
            </li>
            <li>
              <span>Checkpoint</span>
              <strong>{checkpointLabel}</strong>
            </li>
            <li>
              <span>Sessões restantes</span>
              <strong>{String(remainingSessions)}</strong>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
