import { describe, expect, it } from 'vitest';
import { lichessDestinationsByWeakness, normalizeDestination } from './destinations';

const allowedLichessUrl = /^https:\/\/lichess\.org\/(training\/[A-Za-z0-9]+|practice|learn|analysis(?:#explorer)?)$/;

describe('lichessDestinationsByWeakness', () => {
  it('uses only allowed Lichess destination formats', () => {
    for (const destination of Object.values(lichessDestinationsByWeakness)) {
      if ('url' in destination) {
        expect(destination.url).toMatch(allowedLichessUrl);
      }
    }
  });

  it('uses analysis explorer instead of generic Learn for opening principles', () => {
    expect(lichessDestinationsByWeakness['opening-principles'].url).toBe('https://lichess.org/analysis#explorer');
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
});
