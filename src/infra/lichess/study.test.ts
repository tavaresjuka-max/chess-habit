import { describe, expect, it } from 'vitest';
import { generatePlan } from '../../domain';
import type { LearnerProfile } from '../../domain';
import { buildDailyPlanStudyPgn, createDailyStudy } from './study';

const profile: LearnerProfile = {
  lichessUsername: 'jukasparov',
  band: '800-1200',
  defaultSessionMinutes: 15,
  goals: ['rotina'],
  updatedAt: '2026-06-06T00:00:00.000Z',
};

describe('lichess study', () => {
  it('builds transient PGN chapters from a daily plan without full game PGNs', () => {
    const plan = generatePlan(profile, [], 15, '2026-06-06');
    const pgn = buildDailyPlanStudyPgn(plan);

    expect(pgn).toContain('[Event "Tema do dia: garfos"]');
    expect(pgn).toContain('{ Estude a licao guiada de garfo');
    expect(pgn).toContain('Destino: https://lichess.org/practice/fundamental-tactics/the-fork/Qj281y1p');
    expect(pgn).not.toContain('[FEN');
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
      createdAt: '2026-06-06T10:00:00.000Z',
      updatedAt: '2026-06-06T10:00:00.000Z',
    });
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
