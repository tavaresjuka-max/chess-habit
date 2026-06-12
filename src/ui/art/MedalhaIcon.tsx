import type { AchievementId } from '../../domain/badges/evaluateAchievements';

const medalFiles: Record<AchievementId, string> = {
  'retorno-de-ouro': '/art/medalha-retorno-de-ouro.webp',
  'primeira-hora': '/art/medalha-primeira-hora.webp',
  'tratador-de-pendencias': '/art/medalha-tratador-pendencias.webp',
  'semana-inteira': '/art/medalha-semana-inteira.webp',
  calibrado: '/art/medalha-calibrado.webp',
};

type MedalhaIconProps = {
  achievementId: AchievementId;
  size?: number;
};

export function MedalhaIcon({ achievementId, size = 72 }: MedalhaIconProps) {
  return (
    <img
      src={medalFiles[achievementId]}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className="medalha-icon"
    />
  );
}
