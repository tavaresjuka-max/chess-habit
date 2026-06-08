import { describe, expect, it } from 'vitest';
import { selectLichessResource } from './resourceSelector';

describe('selectLichessResource', () => {
  it('uses guided Practice for a 15-minute style guided tactics block', () => {
    expect(
      selectLichessResource({
        weaknessTag: 'fork',
        resourceStage: 'guided',
        learnerBand: '800-1200',
        blockMinutes: 10,
      }),
    ).toMatchObject({
      id: 'practice:fundamental-tactics:the-fork',
      kind: 'practice-study',
    });
  });

  it('uses a concrete puzzle theme for a 5-minute block', () => {
    expect(
      selectLichessResource({
        weaknessTag: 'fork',
        resourceStage: 'guided',
        learnerBand: '800-1200',
        blockMinutes: 5,
      }),
    ).toMatchObject({
      id: 'puzzle:fork',
      kind: 'puzzle-theme',
      url: 'https://lichess.org/training/fork',
    });
  });

  it('uses direct Lichess video lessons for explanation stage', () => {
    expect(
      selectLichessResource({
        weaknessTag: 'pin',
        resourceStage: 'explain',
        learnerBand: '800-1200',
        blockMinutes: 10,
      }),
    ).toMatchObject({
      id: 'video:pin',
      kind: 'video-lesson',
      url: 'https://lichess.org/video/VjwSudAqLn8',
    });
  });

  it('recommends replay only when recent OAuth-derived theme errors exist', () => {
    const withoutStats = selectLichessResource({
      weaknessTag: 'fork',
      resourceStage: 'review',
      learnerBand: '800-1200',
      blockMinutes: 5,
    });
    const withStats = selectLichessResource({
      weaknessTag: 'fork',
      resourceStage: 'review',
      learnerBand: '800-1200',
      blockMinutes: 5,
      recentThemeStats: {
        since: '2026-06-01T00:00:00.000Z',
        until: '2026-06-08T00:00:00.000Z',
        themes: [{ theme: 'fork', attempts: 4, losses: 3 }],
      },
    });

    expect(withoutStats.kind).toBe('puzzle-theme');
    expect(withStats).toMatchObject({
      id: 'puzzle-replay:fork',
      kind: 'puzzle-replay',
      requiresOAuth: true,
      oauthScopes: ['puzzle:read'],
      url: 'https://lichess.org/training/fork',
    });
  });

  it('avoids repeating a completed equivalent resource when there is an alternative', () => {
    expect(
      selectLichessResource({
        weaknessTag: 'fork',
        resourceStage: 'explain',
        learnerBand: '800-1200',
        blockMinutes: 10,
        completedResourceIds: ['video:fork'],
      }),
    ).toMatchObject({
      id: 'practice:fundamental-tactics:the-fork',
      kind: 'practice-study',
    });
  });

  it('keeps needs-human-review community studies below official alternatives', () => {
    expect(
      selectLichessResource({
        weaknessTag: 'fork',
        resourceStage: 'transfer',
        learnerBand: '800-1200',
        blockMinutes: 20,
      }).kind,
    ).not.toBe('community-study');
  });

  it('never selects rejected resources and keeps conversion on concrete training resources', () => {
    const conversion = selectLichessResource({
      weaknessTag: 'conversion',
      resourceStage: 'retrieval',
      learnerBand: '800-1200',
      blockMinutes: 10,
    });

    expect(conversion.qualityStatus).not.toBe('rejected');
    expect(conversion.kind).not.toBe('analysis-tool');
    expect(['puzzle:advantage', 'puzzle:crushing', 'puzzle:defensiveMove']).toContain(conversion.id);
  });
});
