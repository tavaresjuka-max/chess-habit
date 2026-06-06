import { describe, expect, it } from 'vitest';
import { lichessDestinationsByWeakness, normalizeDestination } from './destinations';

const allowedLichessUrl =
  /^https:\/\/lichess\.org\/(training\/[A-Za-z0-9]+|practice|learn|analysis(?:#explorer)?|video\?tags=beginner%2Fopening)$/;

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
});
