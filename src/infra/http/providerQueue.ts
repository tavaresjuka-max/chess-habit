type Fetcher = typeof fetch;

export function createSerialQueue(options?: {
  cooldownMs?: number;
  timeoutMs?: number;
  fetcher?: Fetcher;
}): Fetcher {
  const cooldownMs = options?.cooldownMs ?? 60_000;
  const timeoutMs = options?.timeoutMs ?? 30_000;
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
      // Timeout por requisição: se uma chamada travar (3G ruim, servidor mudo),
      // o AbortController a cancela e libera a fila em vez de bloquear tudo.
      const controller = new AbortController();
      const timer = setTimeout(() => {
        controller.abort();
      }, timeoutMs);
      try {
        const response = await (customFetcher ?? fetch)(input, { ...init, signal: controller.signal });
        if (response.status === 429) {
          cooldownUntil = Date.now() + cooldownMs;
        }
        return response;
      } finally {
        clearTimeout(timer);
      }
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
