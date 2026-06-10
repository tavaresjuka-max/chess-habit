// Selos dos diplomas (Peão, Torre, Rei) — lacre flat geométrico original.
// achieved=false rende a versão "em progresso" (contorno).

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
  const sealColor = 'var(--green-700, #1f3f36)';
  const pieceColor = achieved ? 'var(--surface, #fffdf9)' : 'var(--ink-500, #5a6877)';

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role="img"
      aria-label={`${pieceTitles[diplomaId]}${achieved ? ' conquistado' : ' em progresso'}`}
    >
      {/* Serrilha do lacre */}
      <circle
        cx="32"
        cy="32"
        r="28.5"
        fill="none"
        stroke={achieved ? sealColor : 'var(--line, #d9d4c6)'}
        strokeWidth="5"
        strokeDasharray="3.1 3.1"
      />
      {/* Corpo do lacre */}
      <circle
        cx="32"
        cy="32"
        r="25"
        fill={achieved ? sealColor : 'var(--surface, #fffdf9)'}
        stroke={achieved ? 'none' : 'var(--line, #d9d4c6)'}
        strokeWidth={achieved ? 0 : 2}
      />
      {/* Anel interno âmbar */}
      <circle
        cx="32"
        cy="32"
        r="21"
        fill="none"
        stroke={achieved ? 'var(--gold-300, #d6c48b)' : 'var(--line-soft, #e6e2d6)'}
        strokeWidth="1.8"
      />
      <PiecePath diplomaId={diplomaId} fill={pieceColor} />
    </svg>
  );
}
