import { DIPLOMA_THRESHOLDS } from './mastery';
import type { DiplomaAttempt, DiplomaId } from './types';

export type DiplomaSection = {
  id: string;
  title: string;
  description: string;
  lichessDestination: string;
};

export type DiplomaDefinition = {
  id: DiplomaId;
  title: string;
  band: string;
  description: string;
  threshold: number;
  sections: DiplomaSection[];
};

export type DiplomaSectionProgress = DiplomaSection & {
  scorePercent: number;
  passed: boolean;
  attempted: boolean;
};

export type DiplomaProgress = {
  diploma: DiplomaDefinition;
  sections: DiplomaSectionProgress[];
  overallPassed: boolean;
};

export const DIPLOMAS: DiplomaDefinition[] = [
  {
    id: 'peao',
    title: 'Diploma do Peão',
    band: '0-600',
    description: 'Fundamentos sólidos: regras, coordenadas, valor de peças e mates básicos.',
    threshold: DIPLOMA_THRESHOLDS.peao ?? 90,
    sections: [
      {
        id: 'coordenadas',
        title: 'Coordenadas do Tabuleiro',
        description: 'Nomear casas rapidamente.',
        lichessDestination: 'https://lichess.org/training/coordinate',
      },
      {
        id: 'valor-pecas',
        title: 'Valor das Peças',
        description: 'Identificar trocas favoráveis e desfavoráveis.',
        lichessDestination: 'https://lichess.org/training/hangingPiece',
      },
      {
        id: 'mates-basicos',
        title: 'Mates Básicos',
        description: 'Mate com dama, mate com torre, mate do pastor.',
        lichessDestination: 'https://lichess.org/practice/checkmates',
      },
    ],
  },
  {
    id: 'torre',
    title: 'Diploma da Torre',
    band: '600-1000',
    description: 'Tática básica rotulada, segurança material e finais simples de peão.',
    threshold: DIPLOMA_THRESHOLDS.torre ?? 80,
    sections: [
      {
        id: 'tatica-rotulada',
        title: 'Tática Rotulada',
        description: 'Garfo, cravada, espeto e ataque descoberto com tema visível.',
        lichessDestination: 'https://lichess.org/training/fork',
      },
      {
        id: 'seguranca-material',
        title: 'Segurança Material',
        description: 'Identificar peças penduradas antes de mover.',
        lichessDestination: 'https://lichess.org/training/hangingPiece',
      },
      {
        id: 'finais-peao',
        title: 'Finais de Peão',
        description: 'Regra do quadrado e oposição.',
        lichessDestination: 'https://lichess.org/practice/pawn-endgames',
      },
    ],
  },
  {
    id: 'rei',
    title: 'Diploma do Rei',
    band: '1000-1200',
    description: 'Cálculo curto, abertura por princípios e revisão de partida terminada.',
    threshold: DIPLOMA_THRESHOLDS.rei ?? 75,
    sections: [
      {
        id: 'calculo-curto',
        title: 'Cálculo de 2-3 Lances',
        description: 'Listar candidatos e prever resposta adversária.',
        lichessDestination: 'https://lichess.org/training/mateIn2',
      },
      {
        id: 'abertura-principios',
        title: 'Princípios de Abertura',
        description: 'Centro, desenvolvimento e segurança do rei nos 10 primeiros lances.',
        lichessDestination: 'https://lichess.org/training/opening',
      },
      {
        id: 'finais-basicos',
        title: 'Finais Básicos',
        description: 'Rei e peão contra rei; torre contra peão.',
        lichessDestination: 'https://lichess.org/practice/rook-endgames',
      },
    ],
  },
];

export function getDiploma(id: DiplomaId): DiplomaDefinition | undefined {
  return DIPLOMAS.find((diploma) => diploma.id === id);
}

export function isDiplomaPassed(attempts: DiplomaAttempt[], diplomaId: DiplomaId): boolean {
  const definition = getDiploma(diplomaId);

  if (definition === undefined) {
    return false;
  }

  return definition.sections.every((section) => {
    const latest = getLatestSectionAttempt(attempts, diplomaId, section.id);

    return latest !== undefined && latest.scorePercent >= definition.threshold;
  });
}

export function getDiplomaProgress(attempts: DiplomaAttempt[], diplomaId: DiplomaId): DiplomaProgress | null {
  const definition = getDiploma(diplomaId);

  if (definition === undefined) {
    return null;
  }

  return {
    diploma: definition,
    sections: definition.sections.map((section) => {
      const latest = getLatestSectionAttempt(attempts, diplomaId, section.id);
      const scorePercent = latest?.scorePercent ?? 0;

      return {
        ...section,
        scorePercent,
        passed: scorePercent >= definition.threshold,
        attempted: latest !== undefined,
      };
    }),
    overallPassed: isDiplomaPassed(attempts, diplomaId),
  };
}

function getLatestSectionAttempt(
  attempts: DiplomaAttempt[],
  diplomaId: DiplomaId,
  sectionId: string,
): DiplomaAttempt | undefined {
  return attempts
    .filter((attempt) => attempt.diplomaId === diplomaId && attempt.sectionId === sectionId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
}
