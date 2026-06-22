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

export function DiplomaSeal({ diplomaId, achieved, size = 44 }: DiplomaSealProps) {
  const label = `${pieceTitles[diplomaId]}${achieved ? ' conquistado' : ' em progresso'}`;
  // Emblema dourado da peça (mesmo padrão do resto do app); o estado conquistado
  // é diferenciado pelo container, não por outra arte.
  const src = `/art/selo-cera-${diplomaId}.webp`;

  return (
    <img
      src={src}
      alt={label}
      width={size}
      height={size}
      className="diploma-seal-img"
    />
  );
}
