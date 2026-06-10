// Gerador de id unico para merge por registro (preparacao do sync P4).
// crypto.randomUUID existe em todos os browsers alvo e no Node; o fallback
// cobre ambientes sem Web Crypto sem colidir em criacoes no mesmo milissegundo.
export function createId(): string {
  const cryptoObject = globalThis.crypto as { randomUUID?: () => string } | undefined;

  if (cryptoObject?.randomUUID !== undefined) {
    return cryptoObject.randomUUID();
  }

  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
