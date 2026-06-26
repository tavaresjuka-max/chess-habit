// Mensagem user-facing PT acionável para quando o armazenamento do aparelho
// enche. Compartilhada entre restore (mostrada na UI) e auto-backup (log) para
// manter um unico tom e evitar vazar o erro tecnico cru do IndexedDB.
export const QUOTA_EXCEEDED_MESSAGE =
  'Armazenamento do dispositivo cheio. Libere espaço ou exporte um backup antes de continuar.';

// Nomes de erro que representam cota de armazenamento excedida.
// - `QuotaExceededError`: nome do DOMException lancado pelo IndexedDB. O Dexie
//   envelopa o erro mas PROPAGA o mesmo nome (nao tem nome Dexie-specific), por
//   isso o Set cobre os dois caminhos. Se um nome Dexie distinto surgir, basta
//   adiciona-lo aqui sem tocar na logica de deteccao.
const QUOTA_ERROR_NAMES: ReadonlySet<string> = new Set<string>(['QuotaExceededError']);

// Discriminador reutilizavel de QuotaExceededError. Checa o `name` em vez de
// `instanceof DOMException` porque (1) o Dexie pode envelopar o erro preservando
// apenas o nome e (2) realms diferentes (jsdom vs node) quebram o instanceof.
// Assim cobre tanto o DOMException cru do IndexedDB quanto o equivalente Dexie.
export function isQuotaExceeded(err: unknown): boolean {
  if (err === null || typeof err !== 'object') {
    return false;
  }

  const name = (err as { name?: unknown }).name;

  if (typeof name !== 'string') {
    return false;
  }

  return QUOTA_ERROR_NAMES.has(name);
}
