import { DIPLOMA_THRESHOLDS } from './mastery';
import type { DiplomaAttempt, DiplomaId } from './types';

// Open Decision #1 (2026-06-19): o diploma é conquistado automaticamente pela
// acurácia por tema do Lichess. Cada seção mensurável exige acurácia mínima sobre
// um piso de volume; o avaliador (evaluateDiplomas.ts) grava o DiplomaAttempt e a
// promoção de banda (bandProgression.ts) destrava sozinha.
export const SECTION_ACCURACY_TARGET = 80;
export const SECTION_MIN_ATTEMPTS = 30;

export type DiplomaSection = {
  id: string;
  title: string;
  description: string;
  lichessDestination: string;
  // 'accuracy': fecha por acurácia de tema (puzzles). 'practice': reservado para
  // seções não mensuráveis por puzzle (não usado no catálogo atual — coordenadas
  // saiu do gate e vive só no currículo como aquecimento).
  kind: 'accuracy' | 'practice';
  // Chaves camelCase de tema do Lichess (ex.: 'hangingPiece'); somadas (pool)
  // antes de calcular acurácia e piso. Só para kind 'accuracy'.
  lichessThemes?: string[];
  accuracyTarget?: number;
  minAttempts?: number;
  // Fase 4 do SPEC blind-retrieval (docs/specs/pedagogical-concept-contracts-blind-retrieval-SPEC.md):
  // quando true, além de acurácia/volume a seção só fecha (passed) com evidência
  // cega suficiente (blindEvidenceItems >= blindEvidenceTarget). Sem a flag (ou
  // false/undefined), comportamento idêntico ao atual — evidência cega fica só
  // anexada, cosmética. Diploma já earned nunca é reavaliado (ver evaluateDiplomas.ts).
  requiresBlindEvidence?: boolean;
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
  blindEvidenceItems?: number;
  blindEvidenceTarget?: number;
};

export type DiplomaProgress = {
  diploma: DiplomaDefinition;
  sections: DiplomaSectionProgress[];
  overallPassed: boolean;
};

function accuracySection(
  id: string,
  title: string,
  description: string,
  lichessThemes: string[],
): DiplomaSection {
  const [primaryTheme] = lichessThemes;

  return {
    id,
    title,
    description,
    lichessDestination: `https://lichess.org/training/${primaryTheme ?? ''}`,
    kind: 'accuracy',
    lichessThemes,
    accuracyTarget: SECTION_ACCURACY_TARGET,
    minAttempts: SECTION_MIN_ATTEMPTS,
  };
}

export const DIPLOMAS: DiplomaDefinition[] = [
  {
    id: 'peao',
    title: 'Diploma do Peão',
    band: '0-600',
    description: 'Fundamentos sólidos: valor das peças e mates em um lance.',
    threshold: DIPLOMA_THRESHOLDS.peao ?? 90,
    sections: [
      accuracySection(
        'valor-pecas',
        'Valor das Peças',
        'Capturar peça pendurada e evitar trocas ruins.',
        ['hangingPiece'],
      ),
      accuracySection('mates-basicos', 'Mates em 1', 'Encontrar o xeque-mate em um lance.', ['mateIn1']),
    ],
  },
  {
    id: 'torre',
    title: 'Diploma da Torre',
    band: '600-1000',
    description: 'Tática rotulada, segurança material e finais de peão.',
    threshold: DIPLOMA_THRESHOLDS.torre ?? 80,
    sections: [
      accuracySection(
        'tatica-rotulada',
        'Tática Rotulada',
        'Garfo, cravada e espeto com tema visível.',
        ['fork', 'pin', 'skewer'],
      ),
      accuracySection(
        'seguranca-material',
        'Segurança Material',
        'Identificar peças penduradas antes de mover.',
        ['hangingPiece'],
      ),
      accuracySection('finais-peao', 'Finais de Peão', 'Regra do quadrado e oposição.', ['pawnEndgame']),
    ],
  },
  {
    id: 'rei',
    title: 'Diploma do Rei',
    band: '1000-1200',
    description: 'Cálculo curto, abertura por princípios e finais básicos.',
    threshold: DIPLOMA_THRESHOLDS.rei ?? 75,
    sections: [
      accuracySection(
        'calculo-curto',
        'Cálculo de 2-3 Lances',
        'Listar candidatos e prever a resposta adversária.',
        ['mateIn2'],
      ),
      accuracySection(
        'abertura-principios',
        'Princípios de Abertura',
        'Centro, desenvolvimento e segurança do rei.',
        ['opening'],
      ),
      accuracySection('finais-basicos', 'Finais Básicos', 'Rei e peão contra rei; torre contra peão.', [
        'rookEndgame',
      ]),
    ],
  },
];

export function getDiploma(id: DiplomaId): DiplomaDefinition | undefined {
  return DIPLOMAS.find((diploma) => diploma.id === id);
}

// Liga um tema de puzzle do Lichess (ex.: 'fork') à seção de diploma que o exige.
// Usado para mostrar, no bloco do dia, o progresso rumo ao diploma (PROD-5).
export function findDiplomaSectionForTheme(
  theme: string,
): { diploma: DiplomaDefinition; section: DiplomaSection } | undefined {
  for (const diploma of DIPLOMAS) {
    for (const section of diploma.sections) {
      if (section.lichessThemes?.includes(theme) === true) {
        return { diploma, section };
      }
    }
  }

  return undefined;
}

export function isDiplomaPassed(attempts: DiplomaAttempt[], diplomaId: DiplomaId): boolean {
  const definition = getDiploma(diplomaId);

  if (definition === undefined) {
    return false;
  }

  return definition.sections.every((section) => {
    const latest = getLatestSectionAttempt(attempts, diplomaId, section.id);

    // Gate pela flag passed (o avaliador já considerou acurácia E piso de volume).
    return latest !== undefined && latest.passed;
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
        passed: latest?.passed ?? false,
        attempted: latest !== undefined,
        ...(latest?.blindEvidenceItems === undefined ? {} : { blindEvidenceItems: latest.blindEvidenceItems }),
        ...(latest?.blindEvidenceTarget === undefined ? {} : { blindEvidenceTarget: latest.blindEvidenceTarget }),
      };
    }),
    overallPassed: isDiplomaPassed(attempts, diplomaId),
  };
}

// Diploma conquistado há pouco (default: 10 dias): usado para promover o aluno à
// trilha progress-diplomas por uma ou duas semanas (decisão 3 do dono). O momento
// da conquista é a última seção a cruzar o threshold.
export function getRecentlyEarnedDiploma(
  attempts: DiplomaAttempt[],
  nowIso: string,
  windowDays = 10,
): DiplomaId | undefined {
  const now = Date.parse(nowIso);

  if (Number.isNaN(now)) {
    return undefined;
  }

  const cutoff = now - windowDays * 86_400_000;
  let best: { id: DiplomaId; at: number } | undefined;

  for (const definition of DIPLOMAS) {
    if (!isDiplomaPassed(attempts, definition.id)) {
      continue;
    }

    let passedAt = 0;

    for (const section of definition.sections) {
      const latest = getLatestSectionAttempt(attempts, definition.id, section.id);
      const at = latest === undefined ? 0 : Date.parse(latest.createdAt);

      if (!Number.isNaN(at) && at > passedAt) {
        passedAt = at;
      }
    }

    if (passedAt >= cutoff && (best === undefined || passedAt > best.at)) {
      best = { id: definition.id, at: passedAt };
    }
  }

  return best?.id;
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
