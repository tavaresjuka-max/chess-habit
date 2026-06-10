import { describe, expect, it } from 'vitest';
import { isLearnerBand, learnerBands, migrateLegacyBand } from './bands';

describe('learner bands spine 0-2200', () => {
  it('has 7 bands with smaller steps at the start', () => {
    expect(learnerBands).toEqual([
      '0-400',
      '400-800',
      '800-1000',
      '1000-1200',
      '1200-1600',
      '1600-2000',
      '2000-2200',
    ]);
  });

  it('validates band membership', () => {
    expect(isLearnerBand('800-1000')).toBe(true);
    expect(isLearnerBand('0-800')).toBe(false);
    expect(isLearnerBand('800-1200')).toBe(false);
  });

  it('migrates legacy bands to the new spine', () => {
    expect(migrateLegacyBand('0-800')).toBe('400-800');
    expect(migrateLegacyBand('800-1200')).toBe('800-1000');
    expect(migrateLegacyBand('1200-1600')).toBe('1200-1600');
    expect(migrateLegacyBand('desconhecida')).toBe('800-1000');
  });
});
