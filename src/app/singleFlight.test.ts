import { describe, expect, it } from 'vitest';

import { createSingleFlight } from './singleFlight';

describe('createSingleFlight', () => {
  it('roda a task uma vez para chamadas concorrentes e compartilha o resultado', async () => {
    const flight = createSingleFlight<number>();
    let calls = 0;
    const task = (): Promise<number> => {
      calls += 1;

      return new Promise<number>((resolve) => {
        setTimeout(() => {
          resolve(42);
        }, 0);
      });
    };

    const [first, second] = await Promise.all([flight(task), flight(task)]);

    expect(calls).toBe(1);
    expect(first).toBe(42);
    expect(second).toBe(42);
  });

  it('roda de novo depois que a task anterior terminou', async () => {
    const flight = createSingleFlight<number>();
    let calls = 0;
    const task = (): Promise<number> => Promise.resolve((calls += 1));

    await flight(task);
    await flight(task);

    expect(calls).toBe(2);
  });

  it('reseta apos rejeicao para a proxima chamada poder tentar de novo', async () => {
    const flight = createSingleFlight<number>();
    let calls = 0;
    const task = (): Promise<number> => {
      calls += 1;

      return calls === 1 ? Promise.reject(new Error('boom')) : Promise.resolve(7);
    };

    await expect(flight(task)).rejects.toThrow('boom');
    await expect(flight(task)).resolves.toBe(7);
    expect(calls).toBe(2);
  });
});
