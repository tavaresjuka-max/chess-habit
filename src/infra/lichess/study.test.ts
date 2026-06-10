import { describe, expect, it } from 'vitest';
import { generatePlan } from '../../domain';
import type { LearnerProfile } from '../../domain';
import { buildDailyPlanStudyPgn, createDailyStudy } from './study';

const profile: LearnerProfile = {
  lichessUsername: 'jukasparov',
  band: '800-1000',
  defaultSessionMinutes: 15,
  goals: ['rotina'],
  updatedAt: '2026-06-06T00:00:00.000Z',
};

describe('lichess study', () => {
  it('builds transient PGN chapters from a daily plan without full game PGNs', () => {
    const plan = generatePlan(profile, [], 15, '2026-06-06');
    const pgn = buildDailyPlanStudyPgn(plan);

    expect(pgn).toContain('[Event "Tema do dia: garfos"]');
    expect(pgn).toContain('{ Tarefa: Estude a lição guiada de garfo');
    expect(pgn).toContain('Destino: https://lichess.org/practice/fundamental-tactics/the-fork/Qj281y1p');
    expect(pgn).toContain('{ Garfo é quando uma peça sua ataca dois alvos ao mesmo tempo.');
    expect(pgn).not.toContain('[FEN');
  });

  it('adds method track and guiding question comments to Study chapters', () => {
    const plan = generatePlan(profile, [], 5, '2026-06-06');
    const [baseBlock] = plan.blocks;

    if (baseBlock === undefined) {
      throw new Error('Fixture plan should have at least one block.');
    }

    const pgn = buildDailyPlanStudyPgn({
      ...plan,
      blocks: [
        {
          ...baseBlock,
          methodTrackId: 'calculation-bridge',
          guidingQuestion: 'Quais s\u00e3o meus 2 candidatos?',
        },
      ],
    });

    expect(pgn).toContain('{ Trilha: C\u00e1lculo Ponte 800-1200 }');
    expect(pgn).toContain('{ Pergunta: Quais s\u00e3o meus 2 candidatos? }');
    expect(pgn).toContain('{ Tarefa: ');
    expect(pgn).toContain('{ Stop Rule: ');
    expect(pgn).toContain('{ Destino: ');
  });

  it('rejects plans with more than 64 Study chapters', () => {
    const plan = generatePlan(profile, [], 5, '2026-06-06');
    const [baseBlock] = plan.blocks;

    if (baseBlock === undefined) {
      throw new Error('Fixture plan should have at least one block.');
    }

    expect(() =>
      buildDailyPlanStudyPgn({
        ...plan,
        blocks: Array.from({ length: 65 }, (_, index) => ({
          ...baseBlock,
          id: `block-${String(index + 1)}`,
          title: `Bloco ${String(index + 1)}`,
        })),
      }),
    ).toThrow('Lichess Study aceita no maximo 64 capitulos por import.');
  });

  it('creates a private study and imports the plan PGN with study:write bearer token', async () => {
    const plan = generatePlan(profile, [], 5, '2026-06-06');
    const requests: Array<{ url: string; body: string; authorization: string | null }> = [];
    const fetcher = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      requests.push({
        url: requestUrl(input),
        body: requestBodyText(init?.body),
        authorization: new Headers(init?.headers).get('Authorization'),
      });

      if (requestUrl(input).endsWith('/api/study')) {
        return Promise.resolve(Response.json({ id: 'abc12345' }));
      }

      return Promise.resolve(Response.json([{ id: 'chapter1', name: 'Plano do dia' }]));
    };

    const link = await createDailyStudy({
      token: 'secret-token',
      plan,
      nowIso: '2026-06-06T10:00:00.000Z',
      fetcher,
    });

    expect(requests).toHaveLength(2);
    expect(requests[0]?.url).toBe('https://lichess.org/api/study');
    expect(requests[0]?.authorization).toBe('Bearer secret-token');
    expect(requests[0]?.body).toContain('visibility=private');
    expect(requests[1]?.url).toBe('https://lichess.org/api/study/abc12345/import-pgn');
    expect(requests[1]?.body).toContain('pgn=');
    expect(link).toEqual({
      id: '2026-06-06',
      date: '2026-06-06',
      studyId: 'abc12345',
      url: 'https://lichess.org/study/abc12345',
      visibility: 'private',
      imported: true,
      createdAt: '2026-06-06T10:00:00.000Z',
      updatedAt: '2026-06-06T10:00:00.000Z',
    });
  });

  it('reuses an existing study id instead of creating a new study', async () => {
    const plan = generatePlan(profile, [], 5, '2026-06-06');
    const requests: string[] = [];
    const fetcher = (input: RequestInfo | URL): Promise<Response> => {
      requests.push(requestUrl(input));

      return Promise.resolve(Response.json([{ id: 'chapter1', name: 'Plano do dia' }]));
    };

    const link = await createDailyStudy({
      token: 'secret-token',
      plan,
      existingStudyId: 'reused99',
      nowIso: '2026-06-06T10:00:00.000Z',
      fetcher,
    });

    expect(requests).toEqual(['https://lichess.org/api/study/reused99/import-pgn']);
    expect(link.studyId).toBe('reused99');
    expect(link.imported).toBe(true);
  });

  it('reports the new study id before importing so a partial study can be recovered', async () => {
    const plan = generatePlan(profile, [], 5, '2026-06-06');
    const events: string[] = [];
    const fetcher = (input: RequestInfo | URL): Promise<Response> => {
      if (requestUrl(input).endsWith('/api/study')) {
        events.push('create');

        return Promise.resolve(Response.json({ id: 'fresh77' }));
      }

      events.push('import');

      return Promise.resolve(Response.json([{ id: 'chapter1', name: 'Plano do dia' }]));
    };

    await createDailyStudy({
      token: 'secret-token',
      plan,
      nowIso: '2026-06-06T10:00:00.000Z',
      fetcher,
      onStudyCreated: (studyId) => {
        events.push(`saved:${studyId}`);
      },
    });

    expect(events).toEqual(['create', 'saved:fresh77', 'import']);
  });
});

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}

function requestBodyText(body: BodyInit | null | undefined): string {
  if (body instanceof URLSearchParams) {
    return body.toString();
  }

  if (typeof body === 'string') {
    return body;
  }

  return '';
}
