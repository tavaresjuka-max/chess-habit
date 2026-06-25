import { describe, expect, it } from 'vitest';
import type { WeaknessTag } from '../types';
import { catalogSkillNodes } from './catalogSkills';
import { selectLichessResource } from './resourceSelector';

describe('selectLichessResource', () => {
  it('uses guided Practice for a 15-minute style guided tactics block', () => {
    expect(
      selectLichessResource({
        weaknessTag: 'fork',
        resourceStage: 'guided',
        learnerBand: '800-1000',
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
        learnerBand: '800-1000',
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
        learnerBand: '800-1000',
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
      learnerBand: '800-1000',
      blockMinutes: 5,
    });
    const withStats = selectLichessResource({
      weaknessTag: 'fork',
      resourceStage: 'review',
      learnerBand: '800-1000',
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
        learnerBand: '800-1000',
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
        learnerBand: '800-1000',
        blockMinutes: 20,
      }).kind,
    ).not.toBe('community-study');
  });

  it('never selects rejected resources and keeps conversion on concrete training resources', () => {
    const conversion = selectLichessResource({
      weaknessTag: 'conversion',
      resourceStage: 'retrieval',
      learnerBand: '800-1000',
      blockMinutes: 10,
    });

    expect(conversion.qualityStatus).not.toBe('rejected');
    expect(conversion.kind).not.toBe('analysis-tool');
    expect(['puzzle:advantage', 'puzzle:crushing', 'puzzle:defensiveMove']).toContain(conversion.id);
  });
});

describe('selectLichessResource — acoplamento COMPORTAMENTAL no retrieval (council 2026-06-25)', () => {
  // Os guards referencial/semântico (catalogSkills.test.ts) provam que os slugs existem e são do
  // conceito certo. Este prova que o SCORER de fato USA o acoplamento: no estágio retrieval (recall
  // ativo = resolver puzzles), a seleção deve devolver um puzzle-theme ON-CONCEITO (slug ∈
  // node.themeSlugs) — não um Study/vídeo. É o "teste comportamental" que o council (GLM 5.2) apontou
  // como o lever real além do guard de slug, e a sonda do risco +250(resourceId) vs +180(slug)
  // sabotando o estágio (Study venceria o puzzle no retrieval). O gate é o árbitro.
  const tacticalTags = [
    'hanging-piece',
    'fork',
    'pin',
    'skewer',
    'discovered',
    'mate-in-1',
    'mate-in-2',
    'back-rank',
  ] satisfies WeaknessTag[];

  for (const tag of tacticalTags) {
    it(`retrieval de '${tag}' devolve um puzzle-theme on-conceito (o +180 dispara e vence)`, () => {
      const node = catalogSkillNodes.find((candidate) => candidate.weaknessTag === tag);
      const onConceptSlugs = new Set<string>(node?.themeSlugs ?? []);

      const selected = selectLichessResource({
        weaknessTag: tag,
        resourceStage: 'retrieval',
        learnerBand: '800-1000',
        blockMinutes: 5,
      });

      expect(
        selected.kind,
        `${tag}: retrieval devolveu ${selected.kind} (${selected.id}); retrieval pede puzzle-theme`,
      ).toBe('puzzle-theme');

      const slug = selected.id.replace(/^puzzle:/, '');
      expect(
        onConceptSlugs.has(slug),
        `${tag}: retrieval devolveu puzzle '${slug}' fora do node.themeSlugs [${[...onConceptSlugs].join(', ')}]`,
      ).toBe(true);
    });
  }

  // Sonda direta do risco do council: a 10min o practice-study fica viável no tempo e disputa por
  // SCORE com o puzzle (+250 resourceId vs +180 slug). Pedagogicamente retrieval = drill = puzzle,
  // independente do tempo. Se um Study vencer aqui, é vazamento de estágio (achado p/ o dono).
  for (const tag of ['fork', 'pin'] satisfies WeaknessTag[]) {
    it(`retrieval de '${tag}' a 10min ainda prefere puzzle-theme ao Study (+180 vence +250 no estágio)`, () => {
      const selected = selectLichessResource({
        weaknessTag: tag,
        resourceStage: 'retrieval',
        learnerBand: '800-1000',
        blockMinutes: 10,
      });
      expect(
        selected.kind,
        `${tag}: retrieval 10min devolveu ${selected.kind} (${selected.id}); Study vazando no estágio de drill`,
      ).toBe('puzzle-theme');
    });
  }
});
