export type SingleFlight<T> = (task: () => Promise<T>) => Promise<T>;

/**
 * Deduplica execucoes concorrentes: enquanto uma task estiver em voo, novas
 * chamadas recebem a mesma promessa em vez de disparar a task de novo. Usado
 * para a finalizacao do OAuth, em que o StrictMode monta o efeito duas vezes e
 * o codigo de autorizacao do Lichess so pode ser trocado uma unica vez.
 */
export function createSingleFlight<T>(): SingleFlight<T> {
  let pending: Promise<T> | null = null;

  return (task) => {
    if (pending === null) {
      pending = task().finally(() => {
        pending = null;
      });
    }

    return pending;
  };
}
