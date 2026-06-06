import { describe, expect, it } from 'vitest';
import { lichessDestinationsByWeakness, normalizeDestination } from './destinations';

const allowedLichessUrl =
  /^https:\/\/lichess\.org\/(analysis|training\/[A-Za-z0-9]+|practice\/[a-z0-9-]+\/[a-z0-9-]+\/[A-Za-z0-9]+|video\?tags=beginner%2Fopening)$/;

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
      'https://lichess.org/video?tags=beginner%2Fopening',
    );
  });

  it('uses specific Practice studies instead of the generic Practice index when available', () => {
    expect(lichessDestinationsByWeakness.fork.url).toBe(
      'https://lichess.org/practice/fundamental-tactics/the-fork/Qj281y1p',
    );
    expect(lichessDestinationsByWeakness['endgame-pawn'].url).toBe(
      'https://lichess.org/practice/pawn-endgames/key-squares/xebrDvFe',
    );
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

  it('normalizes old puzzle links to guided Practice studies when a matching lesson exists', () => {
    expect(
      normalizeDestination({
        source: 'lichess',
        label: 'Puzzles Lichess: garfos',
        url: 'https://lichess.org/training/fork',
      }),
    ).toEqual(lichessDestinationsByWeakness.fork);
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
