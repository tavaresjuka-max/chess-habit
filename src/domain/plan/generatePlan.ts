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
  const primaryWeakness = selectPrimaryWeakness(profile, weaknesses);
  const updatedAt = toPlanTimestamp(date);
  const blocks = getTimeBudget(sessionMinutes).map((budgetBlock, index) =>
    createPlanBlock({
      date,
      index,
      kind: budgetBlock.kind,
      minutes: budgetBlock.minutes,
      primaryWeakness,
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
  primaryWeakness: Weakness;
  updatedAt: string;
}): PlanBlock {
  const copy = getBlockCopy(input.kind, input.primaryWeakness);
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

function getBlockCopy(kind: PlanBlockKind, primaryWeakness: Weakness): BlockCopy {
  const primaryTheme = primaryWeakness.tag;

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
        title: `Tema do dia: ${weaknessTitleByTag[primaryTheme]}`,
        task: getThemeTask(primaryTheme),
        stopRule: 'Pare quando o tempo acabar ou quando errar duas vezes seguidas por pressa.',
        reason: primaryWeakness.evidence,
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

function selectPrimaryWeakness(profile: LearnerProfile, weaknesses: Weakness[]): Weakness {
  const [firstWeakness] = [...weaknesses].sort((left, right) => right.score - left.score);

  if (firstWeakness !== undefined) {
    return firstWeakness;
  }

  const fallbackTag = primaryThemeByBand[profile.band];

  return {
    tag: fallbackTag,
    score: 0,
    confidence: 'low',
    evidence: 'Tema conservador da faixa atual enquanto ainda faltam sinais suficientes do historico real.',
  };
}

const weaknessTitleByTag = {
  'hanging-piece': 'pecas penduradas',
  fork: 'garfos',
  pin: 'cravadas',
  skewer: 'espetos',
  discovered: 'ataques descobertos',
  'mate-in-1': 'mate em 1',
  'mate-in-2': 'mate em 2',
  'back-rank': 'mate na ultima fileira',
  'opening-principles': 'principios de abertura',
  'time-trouble': 'gestao de tempo',
  'endgame-pawn': 'finais de peoes',
  'endgame-rook': 'finais de torres',
  conversion: 'conversao',
  'blunder-rate': 'seguranca anti-blunder',
} satisfies Record<WeaknessTag, string>;

function getThemeTask(tag: WeaknessTag): string {
  switch (tag) {
    case 'fork':
      return 'Treine puzzles de garfo e procure dois alvos antes de jogar.';
    case 'hanging-piece':
      return 'Treine puzzles de peca pendurada e confirme quem defende cada alvo.';
    case 'mate-in-1':
    case 'mate-in-2':
    case 'back-rank':
      return 'Treine mates curtos e fale a ameaca antes de clicar no primeiro lance.';
    case 'opening-principles':
      return 'Revise principios de abertura e procure desenvolvimento, centro e seguranca do rei.';
    case 'time-trouble':
      return 'Revise uma partida terminada e marque onde o relogio passou a mandar na decisao.';
    case 'endgame-pawn':
    case 'endgame-rook':
      return 'Treine final simples e conte plano, oposicao ou atividade antes de calcular.';
    case 'conversion':
      return 'Revise uma posicao ganha ja terminada e explique como transformar vantagem em ponto.';
    case 'blunder-rate':
      return 'Treine puzzles de seguranca de pecas e faca uma checagem curta antes de cada lance.';
    case 'pin':
    case 'skewer':
    case 'discovered':
      return 'Treine o padrao tatico e confirme a peca-alvo antes de escolher o lance.';
  }
}

function toPlanTimestamp(date: string): string {
  return date.includes('T') ? date : `${date}T00:00:00.000Z`;
}
