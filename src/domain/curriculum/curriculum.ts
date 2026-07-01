import type { DiplomaId } from '../method/types';
import type { LearnerBand, WeaknessTag } from '../types';

// Mapa curricular exibivel: a visao "o que voce vai aprender" semana a semana,
// ancorada nas estruturas reais do app (bandas, temas WeaknessTag e diplomas).
// E um mapa de referencia — o plano diario continua adaptativo, entao a ordem
// real pode mudar conforme os sinais dos jogos. Sem rating na copy (regra do
// spine em bands.ts: referencia interna, nunca promessa de rating na UI).

export type CurriculumWeek = {
  number: number;
  title: string;
  summary: string;
  // Tema correspondente no diagnostico; semanas sem tag (coordenadas, provas
  // de diploma) nao participam do destaque "agora" via foco semanal.
  tag?: WeaknessTag;
};

export type CurriculumPhaseId = 'fundamentos' | 'tatica-nomeada' | 'calculo-e-plano' | 'autonomia';

export type CurriculumPhase = {
  id: CurriculumPhaseId;
  title: string;
  subtitle: string;
  bands: readonly LearnerBand[];
  diplomaId?: DiplomaId;
  weeks: readonly CurriculumWeek[];
  // Fases sem detalhe semanal (curriculo denso e escopo do Corte 8).
  note?: string;
};

export type CurriculumPhaseStatus = 'past' | 'current' | 'future';

export type CurriculumPhaseOutlook = {
  phase: CurriculumPhase;
  status: CurriculumPhaseStatus;
  // Semana destacada como "agora" na fase atual, quando o foco da semana do
  // plano corresponde a uma semana do mapa.
  currentWeekNumber?: number;
};

// Teto explícito (council 2026-06-24): mensagem honesta quando o aluno atinge a
// banda FM (2200-2400). Tom Professor Tavarez — sem promessa de rating, sem fingir
// que há tier de ensino novo. Passa pela banlist (BANNED_PHRASES).
export const ORGANIZER_CEILING_MESSAGE =
  'Você chegou ao topo do que este app ensina. Daqui em diante ele vira mais um ' +
  'organizador do seu autoestudo — trilha de leitura do acervo, autoanálise das ' +
  'suas partidas e finais teóricos — do que um professor que prescreve cada lance. ' +
  'Para subir além deste ponto, um treinador humano rende mais que qualquer app.';

export const CURRICULUM: readonly CurriculumPhase[] = [
  {
    id: 'fundamentos',
    title: 'Fase 1 — Fundamentos',
    subtitle: 'Diploma do Peão · 6 semanas',
    bands: ['0-400', '400-800'],
    diplomaId: 'peao',
    weeks: [
      {
        number: 1,
        title: 'Tabuleiro e valor das peças',
        summary: 'Nomear casas rápido e reconhecer trocas boas e ruins.',
      },
      {
        number: 2,
        title: 'Peças penduradas',
        summary: 'Ver peça solta — sua e do oponente — antes de mover.',
        tag: 'hanging-piece',
      },
      {
        number: 3,
        title: 'Checagem de segurança',
        summary: 'Conferir segurança antes de confirmar cada lance.',
        tag: 'blunder-rate',
      },
      {
        number: 4,
        title: 'Mate em 1',
        summary: 'Enxergar o mate disponível em um lance.',
        tag: 'mate-in-1',
      },
      {
        number: 5,
        title: 'Mates básicos',
        summary: 'Levar dama e torre ao mate sem afogar o rei.',
      },
      {
        number: 6,
        title: 'Revisão + Diploma do Peão',
        summary: 'Prova: coordenadas, valor das peças e mates básicos.',
      },
    ],
  },
  {
    id: 'tatica-nomeada',
    title: 'Fase 2 — Tática nomeada',
    subtitle: 'Diploma da Torre · 7 semanas',
    bands: ['800-1000'],
    diplomaId: 'torre',
    weeks: [
      {
        number: 1,
        title: 'Garfos',
        summary: 'Um lance que ataca dois alvos.',
        tag: 'fork',
      },
      {
        number: 2,
        title: 'Cravadas',
        summary: 'Prender a peça que não pode sair.',
        tag: 'pin',
      },
      {
        number: 3,
        title: 'Espetos',
        summary: 'Atacar a peça maior para ganhar a de trás.',
        tag: 'skewer',
      },
      {
        number: 4,
        title: 'Ataque descoberto e xeque duplo',
        summary: 'Abrir a linha e criar duas ameaças de uma vez.',
        tag: 'discovered',
      },
      {
        number: 5,
        title: 'Mate na última fileira',
        summary: 'Explorar o rei preso pelos próprios peões.',
        tag: 'back-rank',
      },
      {
        number: 6,
        title: 'Finais de peões',
        summary: 'Regra do quadrado e oposição.',
        tag: 'endgame-pawn',
      },
      {
        number: 7,
        title: 'Revisão + Diploma da Torre',
        summary: 'Prova: tática nomeada, segurança material e finais de peão.',
      },
    ],
  },
  {
    id: 'calculo-e-plano',
    title: 'Fase 3 — Cálculo e plano',
    subtitle: 'Diploma do Rei · 6 semanas',
    bands: ['1000-1200'],
    diplomaId: 'rei',
    weeks: [
      {
        number: 1,
        title: 'Mate em 2',
        summary: 'Calcular lance, resposta e arremate.',
        tag: 'mate-in-2',
      },
      {
        number: 2,
        title: 'Princípios de abertura',
        summary: 'Centro, desenvolvimento e rei seguro nos 10 primeiros lances.',
        tag: 'opening-principles',
      },
      {
        number: 3,
        title: 'Finais de torres',
        summary: 'Torre ativa decide o final.',
        tag: 'endgame-rook',
      },
      {
        number: 4,
        title: 'Conversão de vantagem',
        summary: 'Simplificar e cortar o contra-jogo quando está ganhando.',
        tag: 'conversion',
      },
      {
        number: 5,
        title: 'Gestão de tempo',
        summary: 'Decidir rápido no simples para pensar no difícil.',
        tag: 'time-trouble',
      },
      {
        number: 6,
        title: 'Revisão + Diploma do Rei',
        summary: 'Prova: cálculo curto, abertura e finais básicos.',
      },
    ],
  },
  {
    id: 'autonomia',
    title: 'Fase 4 — Autonomia',
    subtitle: 'depois do Diploma do Rei',
    bands: ['1200-1600', '1600-2000', '2000-2200', '2200-2400'],
    weeks: [],
    note: 'Os mesmos temas voltam em posições mais difíceis: cálculo longo, conversão refinada, repertório por princípio e finais técnicos. No topo (nível mestre), o app vira mais um organizador do seu autoestudo — trilha de leitura, autoanálise e finais teóricos — do que um professor que prescreve cada lance. Detalhes por semana chegam ao se aproximar.',
  },
];

function getFallbackCurriculumPhase(): CurriculumPhase {
  const phase = CURRICULUM[0];
  if (phase === undefined) {
    throw new Error('Curriculum must define at least one phase.');
  }

  return phase;
}

export function getCurriculumPhaseForBand(band: LearnerBand): CurriculumPhase {
  const phase = CURRICULUM.find((candidate) => candidate.bands.includes(band));

  // Toda banda do spine esta coberta acima; o fallback protege contra bandas
  // novas adicionadas sem atualizar o mapa.
  return phase ?? getFallbackCurriculumPhase();
}

export function buildCurriculumOutlook(
  band: LearnerBand | undefined,
  weeklyFocusTag: WeaknessTag | undefined,
): CurriculumPhaseOutlook[] {
  // Sem perfil ainda, o aluno enxerga a jornada a partir do comeco.
  const currentPhase = getCurriculumPhaseForBand(band ?? '0-400');
  const currentIndex = CURRICULUM.indexOf(currentPhase);

  return CURRICULUM.map((phase, index) => {
    const status: CurriculumPhaseStatus =
      index < currentIndex ? 'past' : index === currentIndex ? 'current' : 'future';
    const currentWeek =
      status === 'current' && weeklyFocusTag !== undefined
        ? phase.weeks.find((week) => week.tag === weeklyFocusTag)
        : undefined;

    return {
      phase,
      status,
      ...(currentWeek === undefined ? {} : { currentWeekNumber: currentWeek.number }),
    };
  });
}
