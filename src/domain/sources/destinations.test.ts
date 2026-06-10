import { describe, expect, it } from 'vitest';
import {
  getDestinationForWeakness,
  lichessDestinationsByWeakness,
  methodTrainingDestinationAllowlist,
  normalizeDestination,
} from './destinations';
import { findLichessResourceById } from './resourceCatalog';

const allowedLichessUrl =
  /^https:\/\/lichess\.org\/(analysis|learn|streak|storm|training(?:\/(?:[A-Za-z0-9]+|of-player|themes))?|practice\/[a-z0-9-]+\/[a-z0-9-]+\/[A-Za-z0-9]+|video\/[A-Za-z0-9_-]+)$/;

describe('lichessDestinationsByWeakness', () => {
  it('uses only allowed Lichess destination formats', () => {
    for (const destination of Object.values(lichessDestinationsByWeakness)) {
      if ('url' in destination) {
        expect(destination.url).toMatch(allowedLichessUrl);
      }
    }
  });

  it('uses beginner opening lessons instead of free-form tools for opening principles', () => {
    expect(lichessDestinationsByWeakness['opening-principles'].url).toBe(
      'https://lichess.org/video/gpsZAim-mYc',
    );
  });

  it('never returns generic video search pages for generated weakness stages', () => {
    const weaknessTags = Object.keys(lichessDestinationsByWeakness) as Array<keyof typeof lichessDestinationsByWeakness>;
    const stages = ['explain', 'guided', 'retrieval', 'transfer', 'review'] as const;

    for (const tag of weaknessTags) {
      for (const stage of stages) {
        expect(getDestinationForWeakness(tag, stage).url).not.toContain('/video?');
      }
    }
  });

  it('uses specific Practice studies instead of the generic Practice index when available', () => {
    expect(lichessDestinationsByWeakness.fork.url).toBe(
      'https://lichess.org/practice/fundamental-tactics/the-fork/Qj281y1p',
    );
    expect(lichessDestinationsByWeakness['endgame-pawn'].url).toBe(
      'https://lichess.org/practice/pawn-endgames/key-squares/xebrDvFe',
    );
  });

  it('uses raw puzzle themes for retrieval instead of guided lessons', () => {
    expect(getDestinationForWeakness('fork', 'retrieval').url).toBe('https://lichess.org/training/fork');
  });

  it('uses direct videos as explanation resources', () => {
    expect(getDestinationForWeakness('fork', 'explain')).toEqual({
      source: 'lichess',
      label: 'Lichess Video (em ingles): garfos',
      url: 'https://lichess.org/video/mbiR0tcdqBY',
    });
    expect(getDestinationForWeakness('pin', 'explain').url).toBe('https://lichess.org/video/VjwSudAqLn8');
    expect(getDestinationForWeakness('endgame-pawn', 'explain').url).toBe('https://lichess.org/video/QUqq7wSLE78');
  });

  it('uses concrete tools instead of generic Analysis for time trouble and conversion', () => {
    expect(lichessDestinationsByWeakness['time-trouble'].url).toBe('https://lichess.org/streak');
    expect(getDestinationForWeakness('time-trouble', 'retrieval').url).toBe('https://lichess.org/streak');
    expect(lichessDestinationsByWeakness.conversion.url).toBe('https://lichess.org/training/deflection');
  });

  it('keeps method defense and calculation slugs on the Lichess training allowlist', () => {
    expect(getDestinationForWeakness('hanging-piece', 'retrieval').url).toBe(
      'https://lichess.org/training/hangingPiece',
    );
    expect(lichessDestinationsByWeakness['blunder-rate'].url).toBe(
      'https://lichess.org/training/defensiveMove',
    );
    expect(getDestinationForWeakness('fork', 'retrieval').url).toBe('https://lichess.org/training/fork');
    expect(getDestinationForWeakness('discovered', 'retrieval').url).toBe(
      'https://lichess.org/training/discoveredAttack',
    );
    expect(getDestinationForWeakness('mate-in-2', 'retrieval').url).toBe('https://lichess.org/training/mateIn2');
    expect(lichessDestinationsByWeakness.conversion.url).toBe('https://lichess.org/training/deflection');
    expect(findLichessResourceById('puzzle:trappedPiece')?.url).toBe(
      'https://lichess.org/training/trappedPiece',
    );
    expect(findLichessResourceById('puzzle:quietMove')?.url).toBe('https://lichess.org/training/quietMove');
    expect(methodTrainingDestinationAllowlist.map((item) => item.url)).toEqual(
      expect.arrayContaining([
        'https://lichess.org/training/hangingPiece',
        'https://lichess.org/training/defensiveMove',
        'https://lichess.org/training/fork',
        'https://lichess.org/training/discoveredAttack',
        'https://lichess.org/training/mateIn2',
        'https://lichess.org/training/deflection',
        'https://lichess.org/training/trappedPiece',
        'https://lichess.org/training/quietMove',
      ]),
    );
  });

  it('keeps tactical transfer and review on concrete training resources', () => {
    expect(getDestinationForWeakness('fork', 'transfer')).toEqual({
      source: 'lichess',
      label: 'Puzzles Lichess: Fork',
      url: 'https://lichess.org/training/fork',
    });
    expect(getDestinationForWeakness('fork', 'review').url).toBe('https://lichess.org/training/fork');
    expect(getDestinationForWeakness('opening-principles', 'review').url).toBe('https://lichess.org/training/opening');
  });

  it('normalizes old opening-principles links that pointed to generic Learn', () => {
    expect(
      normalizeDestination({
        source: 'lichess',
        label: 'Lichess Learn: principios de abertura',
        url: 'https://lichess.org/learn',
      }),
    ).toEqual(lichessDestinationsByWeakness['opening-principles']);
  });

  it('normalizes old opening-principles links that pointed to analysis explorer', () => {
    expect(
      normalizeDestination({
        source: 'lichess',
        label: 'Lichess Analysis: principios e explorador de abertura',
        url: 'https://lichess.org/analysis#explorer',
      }),
    ).toEqual(lichessDestinationsByWeakness['opening-principles']);
  });

  it('normalizes old opening video filters to a concrete lesson', () => {
    expect(
      normalizeDestination({
        source: 'lichess',
        label: 'Lichess Videos: aulas de abertura para iniciantes',
        url: 'https://lichess.org/video?tags=beginner%2Fopening',
      }),
    ).toEqual(lichessDestinationsByWeakness['opening-principles']);
  });

  it('normalizes old puzzle links to guided Practice studies when a matching lesson exists', () => {
    expect(
      normalizeDestination({
        source: 'lichess',
        label: 'Puzzles Lichess: garfos',
        url: 'https://lichess.org/training/fork',
      }),
    ).toEqual(lichessDestinationsByWeakness.fork);
  });

  it('keeps raw puzzle links when the block is deliberate retrieval practice', () => {
    const destination = {
      source: 'lichess' as const,
      label: 'Puzzles Lichess: garfos',
      url: 'https://lichess.org/training/fork',
    };

    expect(normalizeDestination(destination, 'retrieval')).toEqual(destination);
  });

  it('normalizes old generic Practice endgame links to specific studies', () => {
    expect(
      normalizeDestination({
        source: 'lichess',
        label: 'Lichess Practice: finais de peoes',
        url: 'https://lichess.org/practice',
      }),
    ).toEqual(lichessDestinationsByWeakness['endgame-pawn']);
  });
});
