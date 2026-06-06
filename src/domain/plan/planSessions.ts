import { getDestinationForWeakness } from '../sources/destinations';
import type { DailyPlan, LearnerProfile, PlanBlock, PlanResourceStage, SessionMinutes, Weakness } from '../types';

export type PlanSessionStatus = 'current' | 'done' | 'future';

export type PlanSessionSummary = {
  sessionNumber: number;
  minutes: number;
  title: string;
  destinationLabel: string;
  status: PlanSessionStatus;
  blocks: PlanBlock[];
};

export type TrainingRoadmapItem = {
  id: string;
  date: string;
  label: string;
  minutes: number;
  title: string;
  destinationLabel: string;
  status: PlanSessionStatus;
};

type FutureRoadmapStep = {
  stage: PlanResourceStage;
  title: (focusTitle: string) => string;
};

const futureRoadmapSteps = [
  {
    stage: 'retrieval',
    title: (focusTitle) => `Repeticao: ${focusTitle}`,
  },
  {
    stage: 'transfer',
    title: (focusTitle) => `Transferencia: ${focusTitle} em partida`,
  },
  {
    stage: 'review',
    title: (focusTitle) => `Revisao: ${focusTitle} sem pressa`,
  },
] satisfies readonly FutureRoadmapStep[];

export function appendPlanSession(plan: DailyPlan, sessionPlan: DailyPlan): DailyPlan {
  const existingBlockIds = new Set(plan.blocks.map((block) => block.id));
  const newBlocks = sessionPlan.blocks.filter((block) => !existingBlockIds.has(block.id));

  return {
    ...plan,
    blocks: [...plan.blocks, ...newBlocks],
    generatedFromWeaknessesAt: sessionPlan.generatedFromWeaknessesAt,
  };
}

export function getNextPlanSessionNumber(plan: DailyPlan): number {
  return Math.max(1, ...plan.blocks.map(getPlanBlockSessionNumber)) + 1;
}

export function getPlanTotalMinutes(plan: DailyPlan): number {
  return plan.blocks.reduce((sum, block) => sum + block.estimatedMinutes, 0);
}

export function getPlanSessionSummaries(plan: DailyPlan): PlanSessionSummary[] {
  const blocksBySession = new Map<number, PlanBlock[]>();

  for (const block of plan.blocks) {
    const sessionNumber = getPlanBlockSessionNumber(block);
    const sessionBlocks = blocksBySession.get(sessionNumber) ?? [];
    sessionBlocks.push(block);
    blocksBySession.set(sessionNumber, sessionBlocks);
  }

  return [...blocksBySession.entries()]
    .sort(([left], [right]) => left - right)
    .map(([sessionNumber, blocks]) => {
      const themeBlock = getThemeBlock(blocks);

      return {
        sessionNumber,
        minutes: blocks.reduce((sum, block) => sum + block.estimatedMinutes, 0),
        title: themeBlock.title,
        destinationLabel: themeBlock.destination.label,
        status: blocks.every((block) => block.status !== 'pending') ? 'done' : 'current',
        blocks,
      };
    });
}

export function createTrainingRoadmap(input: {
  profile: LearnerProfile;
  weaknesses: Weakness[];
  activePlan: DailyPlan;
  sessionMinutes: SessionMinutes;
  futureDays?: number;
}): TrainingRoadmapItem[] {
  const activeItems = getPlanSessionSummaries(input.activePlan).map((session) => ({
    id: `${input.activePlan.date}:session:${String(session.sessionNumber)}`,
    date: input.activePlan.date,
    label: session.sessionNumber === 1 ? 'Hoje' : `Hoje, sessao ${String(session.sessionNumber)}`,
    minutes: session.minutes,
    title: session.title,
    destinationLabel: session.destinationLabel,
    status: session.status,
  }));

  const focus = input.activePlan.weeklyFocus;

  if (focus === undefined) {
    return activeItems;
  }

  const futureItems: TrainingRoadmapItem[] = [];

  for (let dayOffset = 1; dayOffset <= (input.futureDays ?? 3); dayOffset += 1) {
    const date = addDays(input.activePlan.date, dayOffset);
    const step = getFutureRoadmapStep(dayOffset);
    const destination = getDestinationForWeakness(focus.tag, step.stage);

    futureItems.push({
      id: `${date}:session:1`,
      date,
      label: dayOffset === 1 ? 'Amanha' : `Em ${String(dayOffset)} dias`,
      minutes: input.sessionMinutes,
      title: step.title(focus.title),
      destinationLabel: destination.label,
      status: 'future',
    });
  }

  return [...activeItems, ...futureItems];
}

export function getPlanBlockSessionNumber(block: PlanBlock): number {
  return block.sessionNumber ?? 1;
}

function getFutureRoadmapStep(dayOffset: number): FutureRoadmapStep {
  const step = futureRoadmapSteps[(dayOffset - 1) % futureRoadmapSteps.length];

  if (step === undefined) {
    throw new Error('Roadmap progression is missing a future step.');
  }

  return step;
}

function getThemeBlock(blocks: PlanBlock[]): PlanBlock {
  const themeBlock = blocks.find((block) => block.title.startsWith('Tema do dia')) ?? blocks[0];

  if (themeBlock === undefined) {
    throw new Error('Cannot summarize an empty plan session.');
  }

  return themeBlock;
}

function addDays(date: string, days: number): string {
  const parsed = new Date(`${date.slice(0, 10)}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  parsed.setUTCDate(parsed.getUTCDate() + days);

  return parsed.toISOString().slice(0, 10);
}
