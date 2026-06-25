import { describe, expect, it } from 'vitest';
import type { WeaknessTag } from '../types';
import { catalogSkillNodes } from './catalogSkills';
import { findLichessResourceById, lichessPuzzleThemes } from './resourceCatalog';

const weaknessTags = [
  'hanging-piece',
  'fork',
  'pin',
  'skewer',
  'discovered',
  'mate-in-1',
  'mate-in-2',
  'back-rank',
  'opening-principles',
  'time-trouble',
  'endgame-pawn',
  'endgame-rook',
  'conversion',
  'blunder-rate',
] satisfies WeaknessTag[];

describe('catalogSkillNodes', () => {
  it('covers every Professor Lemos weakness with at least one sub-skill', () => {
    for (const tag of weaknessTags) {
      expect(catalogSkillNodes.some((node) => node.weaknessTag === tag)).toBe(true);
    }
  });

  it('maps only to resources already present in the curated catalog', () => {
    for (const node of catalogSkillNodes) {
      expect(node.resourceIds.length).toBeGreaterThan(0);

      for (const resourceId of node.resourceIds) {
        expect(findLichessResourceById(resourceId), `${node.id} -> ${resourceId}`).toBeDefined();
      }
    }
  });

  it('maps puzzle themes to official puzzle theme slugs from the catalog', () => {
    const officialThemeIds = new Set(lichessPuzzleThemes.map((resource) => resource.id.replace('puzzle:', '')));

    for (const node of catalogSkillNodes) {
      expect(node.themeSlugs.length).toBeGreaterThan(0);

      for (const slug of node.themeSlugs) {
        expect(officialThemeIds.has(slug), `${node.id} -> ${slug}`).toBe(true);
      }
    }
  });

  it('has original Professor Lemos cues and practical fit metadata', () => {
    for (const node of catalogSkillNodes) {
      expect(node.lemosCue.length).toBeGreaterThan(20);
      expect(node.bands.length).toBeGreaterThan(0);
      expect(node.stageFit.length).toBeGreaterThan(0);
      expect(node.timeFits.length).toBeGreaterThan(0);
    }
  });
});

describe('catalogSkillNodes — acoplamento SEMÂNTICO on-conceito (anti-drift; council 2026-06-25)', () => {
  // Os guards acima provam que cada themeSlug é um slug VÁLIDO do catálogo — NÃO que é o slug CERTO
  // para o conceito. Sem este guard, trocar fork.themeSlugs por ['pin'] passaria verde e o aluno que
  // errou GARFO receberia CRAVADA (furo concreto apontado pelo council GLM 5.2). Fonte de verdade:
  // identidade do conceito + fichas de livros-mestres (Reinfeld/Nunn-LCT). Este teste trava o DRIFT
  // SEMÂNTICO: editar um node para fora do seu conceito-núcleo passa a FALHAR.
  const expectedCoreSlugByTag: ReadonlyArray<readonly [WeaknessTag, readonly string[]]> = [
    ['hanging-piece', ['hangingPiece']],
    ['fork', ['fork']],
    ['pin', ['pin']],
    ['skewer', ['skewer']],
    ['discovered', ['discoveredAttack']],
    ['mate-in-1', ['mateIn1']],
    ['mate-in-2', ['mateIn2']],
    ['back-rank', ['backRankMate']],
    ['opening-principles', ['opening']],
    ['endgame-pawn', ['pawnEndgame']],
    ['endgame-rook', ['rookEndgame']],
    ['conversion', ['advantage', 'crushing']],
    ['blunder-rate', ['hangingPiece', 'defensiveMove']],
  ];

  it('todo node contém ao menos um slug-núcleo do seu conceito (o acoplamento é on-conceito)', () => {
    for (const [tag, cores] of expectedCoreSlugByTag) {
      const nodes = catalogSkillNodes.filter((node) => node.weaknessTag === tag);
      expect(nodes.length, `sem node para ${tag}`).toBeGreaterThan(0);

      const slugs = new Set<string>(nodes.flatMap((node) => node.themeSlugs));
      expect(
        cores.some((core) => slugs.has(core)),
        `node '${tag}' perdeu o acoplamento on-conceito: themeSlugs=[${[...slugs].join(', ')}] não contém nenhum de [${cores.join(', ')}]`,
      ).toBe(true);
    }
  });

  it('time-trouble é EXCEÇÃO-proxy documentada (Lichess não tem tema de gestão de tempo)', () => {
    // Decisão de arquitetura (orquestrador): o Lichess NÃO tem puzzle theme de "gestão de tempo".
    // time-trouble roteia por PROXY ('short' = puzzles rápidos, 'mix' = sortido) — nenhum slug ENSINA
    // o conceito. Isto é dívida de PRODUTO (flag p/ o dono), não bug de slug. O teste fixa a exceção
    // e falha se alguém fingir que existe um core conceitual de tempo aqui.
    const nodes = catalogSkillNodes.filter((node) => node.weaknessTag === 'time-trouble');
    const slugs = new Set(nodes.flatMap((node) => node.themeSlugs));

    expect(nodes.length).toBeGreaterThan(0);
    expect(slugs.has('short') || slugs.has('mix'), 'time-trouble deveria rotear via proxy short/mix').toBe(true);
    expect([...slugs].every((slug) => !/time/i.test(slug)), 'não deve existir slug conceitual de tempo no catálogo').toBe(true);
  });
});
