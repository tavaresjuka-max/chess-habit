import { getCoachNote } from '../coach/coachCatalog';
import { getDestinationForWeakness } from '../sources/destinations';
import type { DailyPlan, LearnerProfile, PlanBlock, SessionMinutes, Weakness, WeaknessTag } from '../types';
import { getTimeBudget, type PlanBlockKind } from './timeBudget';

type BlockCopy = {
  title: string;
  task: string;
  stopRule: string;
  reason: string;
  weaknessTag: WeaknessTag;
};

const primaryThemeByBand = {
  '0-800': 'hanging-piece',
  '800-1200': 'fork',
} satisfies Record<LearnerProfile['band'], WeaknessTag>;

export function generatePlan(
  profile: LearnerProfile,
  weaknesses: Weakness[],
  sessionMinutes: SessionMinutes,
  date: string,
): DailyPlan {
  const primaryTheme = primaryThemeByBand[profile.band];
  const updatedAt = toPlanTimestamp(date);
  const blocks = getTimeBudget(sessionMinutes).map((budgetBlock, index) =>
    createPlanBlock({
      date,
      index,
      kind: budgetBlock.kind,
      minutes: budgetBlock.minutes,
      primaryTheme,
      updatedAt,
    }),
  );

  return {
    date,
    sessionMinutes,
    blocks,
    generatedFromWeaknessesAt: weaknesses[0]?.evidence ? updatedAt : updatedAt,
  };
}

function createPlanBlock(input: {
  date: string;
  index: number;
  kind: PlanBlockKind;
  minutes: number;
  primaryTheme: WeaknessTag;
  updatedAt: string;
}): PlanBlock {
  const copy = getBlockCopy(input.kind, input.primaryTheme);
  const destination = getDestinationForWeakness(copy.weaknessTag);

  return {
    id: `${input.date}-${String(input.index + 1).padStart(2, '0')}-${input.kind}`,
    title: copy.title,
    source: destination.source,
    destination,
    estimatedMinutes: input.minutes,
    task: copy.task,
    stopRule: copy.stopRule,
    reason: copy.reason,
    coachNote: getCoachNote(input.kind),
    status: 'pending',
    updatedAt: input.updatedAt,
  };
}

function getBlockCopy(kind: PlanBlockKind, primaryTheme: WeaknessTag): BlockCopy {
  switch (kind) {
    case 'aquecimento':
      return {
        title: 'Aquecimento tactico',
        task: 'Resolva puzzles simples com atencao total ao primeiro lance candidato.',
        stopRule: 'Pare ao fechar o tempo do bloco, mesmo se houver uma sequencia boa em andamento.',
        reason: 'Aquecimento prepara a vista antes do tema principal da P0.',
        weaknessTag: 'blunder-rate',
      };
    case 'tema':
      return {
        title: primaryTheme === 'fork' ? 'Tema do dia: garfos' : 'Tema do dia: pecas penduradas',
        task:
          primaryTheme === 'fork'
            ? 'Treine puzzles de garfo e procure dois alvos antes de jogar.'
            : 'Treine puzzles de peca pendurada e confirme quem defende cada alvo.',
        stopRule: 'Pare quando o tempo acabar ou quando errar duas vezes seguidas por pressa.',
        reason: 'Tema fixo da P0 para validar o fluxo antes do detector adaptativo.',
        weaknessTag: primaryTheme,
      };
    case 'revisao':
      return {
        title: 'Revisao curta',
        task: 'Revise uma posicao terminada e escreva mentalmente qual ameaca passou batida.',
        stopRule: 'Pare depois de uma posicao bem entendida.',
        reason: 'Revisao conecta puzzle com partida real sem sugerir lance ao vivo.',
        weaknessTag: 'conversion',
      };
    case 'transferencia':
      return {
        title: 'Transferencia para partida',
        task: 'Abra uma analise livre e procure o mesmo padrao em uma posicao menos limpa.',
        stopRule: 'Pare ao encontrar uma posicao em que voce consiga explicar o plano em uma frase.',
        reason: 'Transferencia evita que o tema fique preso ao formato de puzzle.',
        weaknessTag: 'opening-principles',
      };
    case 'final':
      return {
        title: 'Final basico',
        task: 'Treine finais simples e conte material, rei ativo e promocao antes de calcular.',
        stopRule: 'Pare no fim do tempo ou apos uma linha que voce consiga reconstruir sem olhar.',
        reason: 'Finais curtos consolidam precisao sem depender de engine no app.',
        weaknessTag: 'endgame-pawn',
      };
  }
}

function toPlanTimestamp(date: string): string {
  return date.includes('T') ? date : `${date}T00:00:00.000Z`;
}
