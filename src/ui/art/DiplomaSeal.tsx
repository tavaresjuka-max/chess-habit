import type { DiplomaId } from '../../domain/method/types';

type DiplomaSealProps = {
  diplomaId: DiplomaId;
  achieved: boolean;
  size?: number;
};

const pieceTitles: Record<DiplomaId, string> = {
  peao: 'Selo do Diploma do Peão',
  torre: 'Selo do Diploma da Torre',
  rei: 'Selo do Diploma do Rei',
};

function PiecePath({ diplomaId, fill }: { diplomaId: DiplomaId; fill: string }) {
  switch (diplomaId) {
    case 'peao':
      return (
        <g fill={fill}>
          <circle cx="32" cy="22" r="6" />
          <path d="M25.5 42 L38.5 42 L35.5 28 L28.5 28 Z" />
          <rect x="22.5" y="42" width="19" height="4.5" rx="1.5" />
        </g>
      );
    case 'torre':
      return (
        <g fill={fill}>
          <path d="M22 16 h4.5 v4 h4.5 v-4 h4.5 v4 h4.5 v-4 h4.5 v8 l-3 3 v11 l3 4 h-23 l3-4 V27 l-3-3 Z" />
          <rect x="21" y="44" width="22" height="4.5" rx="1.5" />
        </g>
      );
    case 'rei':
      return (
        <g fill={fill}>
          <path d="M30 12 h4 v4 h4 v4 h-4 v4 h-4 v-4 h-4 v-4 h4 Z" />
          <path d="M25.5 44 L38.5 44 L36 27 L28 27 Z" />
          <rect x="22.5" y="44" width="19" height="4.5" rx="1.5" />
        </g>
      );
  }
}

export function DiplomaSeal({ diplomaId, achieved, size = 44 }: DiplomaSealProps) {
  const label = `${pieceTitles[diplomaId]}${achieved ? ' conquistado' : ' em progresso'}`;

  if (achieved) {
    return (
      <img
        src={`/art/selo-diploma-${diplomaId}.webp`}
        alt={label}
        width={size}
        height={size}
        className="diploma-seal-img"
      />
    );
  }

  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label={label}>
      <circle
        cx="32"
        cy="32"
        r="28.5"
        fill="none"
        stroke="var(--line, #d9d4c6)"
        strokeWidth="5"
        strokeDasharray="3.1 3.1"
      />
      <circle
        cx="32"
        cy="32"
        r="25"
        fill="var(--surface, #fffdf9)"
        stroke="var(--line, #d9d4c6)"
        strokeWidth="2"
      />
      <circle
        cx="32"
        cy="32"
        r="21"
        fill="none"
        stroke="var(--line-soft, #e6e2d6)"
        strokeWidth="1.8"
      />
      <PiecePath diplomaId={diplomaId} fill="var(--ink-500, #5a6877)" />
    </svg>
  );
}
