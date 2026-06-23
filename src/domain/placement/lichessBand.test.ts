import { describe, expect, it } from 'vitest';
import { bandFromLichessGameRatings } from './lichessBand';

describe('bandFromLichessGameRatings', () => {
  it('AC1: usa rapid direto (não-provisório) -> 1200-1600', () => {
    expect(
      bandFromLichessGameRatings({ rapid: { rating: 1500, games: 40, provisional: false } })?.band,
    ).toBe('1200-1600');
  });

  it('AC2: ignora provisório, usa blitz -> 1600-2000', () => {
    const result = bandFromLichessGameRatings({
      rapid: { rating: 2100, games: 2, provisional: true },
      blitz: { rating: 1700, games: 30, provisional: false },
    });

    expect(result?.band).toBe('1600-2000');
    expect(result?.source).toBe('blitz');
    expect(result?.confidence).toBe('high');
    expect(result?.estimate).toBe(1700);
  });

  it('preferência rapid > blitz no desempate (determinístico, não por games)', () => {
    const result = bandFromLichessGameRatings({
      rapid: { rating: 1100, games: 50, provisional: false },
      blitz: { rating: 1800, games: 50, provisional: false },
    });

    // rapid vence pela ordem de preferência fixa, não pela contagem de games.
    expect(result?.band).toBe('1000-1200');
    expect(result?.source).toBe('rapid');
  });

  it('pula para classical quando rapid e blitz estão provisórios', () => {
    const result = bandFromLichessGameRatings({
      rapid: { rating: 2100, games: 1, provisional: true },
      blitz: { rating: 1900, games: 1, provisional: true },
      classical: { rating: 1850, games: 20, provisional: false },
    });

    expect(result?.band).toBe('1600-2000');
    expect(result?.source).toBe('classical');
  });

  it('AC4: sem perf de jogo não-provisório -> undefined', () => {
    expect(
      bandFromLichessGameRatings({
        puzzle: { rating: 1500, games: 99, provisional: false },
      } as never),
    ).toBeUndefined();
    expect(bandFromLichessGameRatings({})).toBeUndefined();
  });

  it('AC4: só perfs de jogo provisórios -> undefined', () => {
    expect(
      bandFromLichessGameRatings({
        rapid: { rating: 1500, games: 1, provisional: true },
      }),
    ).toBeUndefined();
  });

  it('razão cita o perf de jogo usado como fonte', () => {
    const result = bandFromLichessGameRatings({
      rapid: { rating: 1500, games: 40, provisional: false },
    });

    expect(result?.reasons).toEqual(['Seu rating de rapid no Lichess.']);
  });
});
