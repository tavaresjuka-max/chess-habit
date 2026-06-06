import { describe, expect, it } from 'vitest';
import { lichessDestinationsByWeakness } from './destinations';

const allowedLichessUrl = /^https:\/\/lichess\.org\/(training\/[A-Za-z0-9]+|practice|learn|analysis)$/;

describe('lichessDestinationsByWeakness', () => {
  it('uses only allowed Lichess destination formats', () => {
    for (const destination of Object.values(lichessDestinationsByWeakness)) {
      if ('url' in destination) {
        expect(destination.url).toMatch(allowedLichessUrl);
      }
    }
  });
});
