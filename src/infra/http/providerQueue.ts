type Fetcher = typeof fetch;

export function createSerialQueue(options?: { cooldownMs?: number; fetcher?: Fetcher }): Fetcher {
  const cooldownMs = options?.cooldownMs ?? 60_000;
  // Resolve at call time (not at creation time) so vi.stubGlobal('fetch', …) works in tests.
  const customFetcher = options?.fetcher;

  let tail: Promise<unknown> = Promise.resolve();
  let cooldownUntil = 0;

  const queued: Fetcher = (input, init) => {
    const call: Promise<Response> = tail.then(async () => {
      const remaining = cooldownUntil - Date.now();
      if (remaining > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, remaining));
      }
      const response = await (customFetcher ?? fetch)(input, init);
      if (response.status === 429) {
        cooldownUntil = Date.now() + cooldownMs;
      }
      return response;
    });
    tail = call.then(
      () => {},
      () => {},
    );
    return call;
  };

  return queued;
}

export const lichessFetch = createSerialQueue();
export const chesscomFetch = createSerialQueue();
