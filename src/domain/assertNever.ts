export function assertNever(value: never): never {
  throw new Error(`Caso de união não tratado: ${String(value)}`);
}
