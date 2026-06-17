import type { DailyPlan, LichessStudyLink, PlanBlock } from '../../domain';
import { getMethodTrackTitle } from '../../domain/method/methodTracks';
import { APP_NAME } from '../../config/appIdentity';
import { lichessFetch } from '../http/providerQueue';
import { LichessRateLimitError } from './puzzleActivity';

export type CreateStudyResponse = {
  id: string;
};

export type ImportStudyPgnResponse = Array<{
  id: string;
  name: string;
}>;

export type CreateDailyStudyOptions = {
  token: string;
  plan: DailyPlan;
  visibility?: LichessStudyLink['visibility'];
  existingStudyId?: string;
  onStudyCreated?: (studyId: string) => Promise<void> | void;
  nowIso?: string;
  fetcher?: typeof fetch;
};

const lichessBaseUrl = 'https://lichess.org';
const maxStudyChaptersPerImport = 64;

export async function createDailyStudy(options: CreateDailyStudyOptions): Promise<LichessStudyLink> {
  const token = options.token.trim();

  if (token === '') {
    throw new Error('Token Lichess ausente para criar Study.');
  }

  const fetcher = options.fetcher ?? lichessFetch;
  const nowIso = options.nowIso ?? new Date().toISOString();
  const visibility = options.visibility ?? 'private';
  // Reaproveita um Study ja criado (retry apos import falhar) para nao deixar
  // Studies vazios orfaos no Lichess a cada tentativa.
  let studyId = options.existingStudyId;

  if (studyId === undefined) {
    studyId = await createStudy({
      token,
      name: `Seu treino de hoje - ${options.plan.date}`,
      visibility,
      fetcher,
    });

    // Reporta o id antes do import para o chamador persistir um link parcial e
    // poder recuperar o mesmo Study se o import falhar.
    await options.onStudyCreated?.(studyId);
  }

  await importPgnToStudy({
    token,
    studyId,
    pgn: buildDailyPlanStudyPgn(options.plan),
    name: 'Plano do dia',
    fetcher,
  });

  return {
    id: options.plan.date,
    date: options.plan.date,
    studyId,
    url: `${lichessBaseUrl}/study/${studyId}`,
    visibility,
    imported: true,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

export async function createStudy(input: {
  token: string;
  name: string;
  visibility: LichessStudyLink['visibility'];
  fetcher?: typeof fetch;
}): Promise<string> {
  const fetcher = input.fetcher ?? lichessFetch;
  const body = new URLSearchParams({
    name: input.name,
    visibility: input.visibility,
    computer: 'owner',
    explorer: 'owner',
    cloneable: 'nobody',
    shareable: 'nobody',
    chat: 'nobody',
    sticky: 'false',
  });
  const response = await fetcher(`${lichessBaseUrl}/api/study`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${input.token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (response.status === 429) {
    throw new LichessRateLimitError();
  }

  if (!response.ok) {
    throw new Error(`Lichess respondeu HTTP ${String(response.status)} ao criar Study.`);
  }

  const parsed = (await response.json()) as unknown;

  if (!isCreateStudyResponse(parsed)) {
    throw new Error('Resposta inesperada ao criar Study Lichess.');
  }

  return parsed.id;
}

export async function importPgnToStudy(input: {
  token: string;
  studyId: string;
  pgn: string;
  name?: string;
  fetcher?: typeof fetch;
}): Promise<ImportStudyPgnResponse> {
  const fetcher = input.fetcher ?? lichessFetch;
  const body = new URLSearchParams({
    pgn: input.pgn,
    orientation: 'white',
    variant: 'standard',
  });

  if (input.name !== undefined) {
    body.set('name', input.name);
  }

  const response = await fetcher(`${lichessBaseUrl}/api/study/${encodeURIComponent(input.studyId)}/import-pgn`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${input.token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (response.status === 429) {
    throw new LichessRateLimitError();
  }

  if (!response.ok) {
    throw new Error(`Lichess respondeu HTTP ${String(response.status)} ao importar PGN no Study.`);
  }

  return (await response.json()) as ImportStudyPgnResponse;
}

export function buildDailyPlanStudyPgn(plan: DailyPlan): string {
  if (plan.blocks.length > maxStudyChaptersPerImport) {
    throw new Error('Lichess Study aceita no maximo 64 capitulos por import.');
  }

  return plan.blocks.map((block, index) => buildBlockPgn(plan, block, index + 1)).join('\n\n\n');
}

function buildBlockPgn(plan: DailyPlan, block: PlanBlock, round: number): string {
  const date = plan.date.replace(/-/g, '.');
  const trackTitle = block.methodTrackId === undefined ? 'Treino' : getMethodTrackTitle(block.methodTrackId);
  const comments = [
    `Trilha: ${trackTitle}`,
    block.guidingQuestion === undefined ? undefined : `Pergunta: ${block.guidingQuestion}`,
    block.reason,
    `Tarefa: ${block.task}`,
    block.coachNote,
    `Stop Rule: ${block.stopRule}`,
    block.destination.url === undefined ? undefined : `Destino: ${block.destination.url}`,
  ]
    .filter((line): line is string => line !== undefined && line.trim() !== '')
    .map((line) => `{ ${sanitizePgnComment(line)} }`);

  return [
    `[Event "${sanitizePgnTag(block.title)}"]`,
    '[Site "https://lichess.org"]',
    `[Date "${date}"]`,
    `[Round "${String(round)}"]`,
    `[White "${sanitizePgnTag(APP_NAME)}"]`,
    '[Black "Lichess"]',
    '[Result "*"]',
    '',
    ...comments,
    '*',
  ].join('\n');
}

function sanitizePgnTag(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').slice(0, 100);
}

function sanitizePgnComment(value: string): string {
  return value.replace(/[{}]/g, '').slice(0, 500);
}

function isCreateStudyResponse(value: unknown): value is CreateStudyResponse {
  return typeof value === 'object' && value !== null && typeof (value as { id?: unknown }).id === 'string';
}
