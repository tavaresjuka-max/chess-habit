import type { MethodTrack } from './types';

const methodStartedAt = '2026-06-10T00:00:00.000Z';

export const METHOD_TRACKS: MethodTrack[] = [
  {
    id: 'pending-review',
    title: 'Tratamento de Pendências',
    priority: 1,
    status: 'active',
    focusWeaknessTags: ['hanging-piece', 'fork', 'discovered', 'pin', 'skewer'],
    startedAt: methodStartedAt,
    updatedAt: methodStartedAt,
  },
  {
    id: 'calculation-bridge',
    title: 'Cálculo Ponte 800-1200',
    priority: 2,
    status: 'active',
    focusWeaknessTags: ['fork', 'discovered', 'mate-in-2', 'conversion'],
    startedAt: methodStartedAt,
    updatedAt: methodStartedAt,
  },
  {
    id: 'active-defense',
    title: 'Defesa Ativa',
    priority: 3,
    status: 'active',
    focusWeaknessTags: ['hanging-piece', 'blunder-rate'],
    startedAt: methodStartedAt,
    updatedAt: methodStartedAt,
  },
  {
    id: 'opening-as-plan',
    title: 'Abertura Como Plano',
    priority: 4,
    status: 'active',
    focusWeaknessTags: ['opening-principles'],
    startedAt: methodStartedAt,
    updatedAt: methodStartedAt,
  },
  {
    id: 'progress-diplomas',
    title: 'Diplomas de Progresso',
    priority: 5,
    status: 'active',
    focusWeaknessTags: [],
    startedAt: methodStartedAt,
    updatedAt: methodStartedAt,
  },
];

export function getMethodTrack(id: string): MethodTrack | undefined {
  return METHOD_TRACKS.find((track) => track.id === id);
}

export function getMethodTrackTitle(id: string): string {
  return getMethodTrack(id)?.title ?? id;
}
