import type { LearnerBand } from '../../domain';

const bandaIndex: Record<LearnerBand, number> = {
  '0-400': 1,
  '400-800': 2,
  '800-1000': 3,
  '1000-1200': 4,
  '1200-1600': 5,
  '1600-2000': 6,
  '2000-2200': 7,
};

type BandaIconProps = {
  band: LearnerBand;
  size?: number;
};

export function BandaIcon({ band, size = 48 }: BandaIconProps) {
  const n = bandaIndex[band];

  return (
    <img
      src={`/art/banda-${String(n)}.webp`}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className="banda-icon"
    />
  );
}
