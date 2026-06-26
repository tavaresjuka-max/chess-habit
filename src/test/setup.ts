// Setup global dos testes. jsdom não implementa matchMedia, ResizeObserver nem
// IntersectionObserver, e libs de UI (Embla, no carrossel) e o lazy-mount do
// TacticDiagram precisam deles. Stubs benignos. Acesso destipado porque os tipos
// do DOM declaram esses globais como sempre presentes (no jsdom não estão).

// ---------------------------------------------------------------------------
// Gate de console.error / console.warn
// Qualquer emissão não-allowlisted lança — tornando o teste vermelho.
// Allowlist: mensagens legítimas conhecidas (React strict, etc.) — manter mínima.
// ---------------------------------------------------------------------------
const CONSOLE_ALLOWLIST: ReadonlyArray<string | RegExp> = [
  // React 18 strict mode: double-invoke effects em dev — emite aviso interno.
  /Warning: An update to .* inside a test was not wrapped in act/,
  // jsdom não implementa alguns recursos de CSS que libs usam.
  /Error: Not implemented/,
  // vitest/jsdom: navigation warnings esperados nos smoke tests.
  /Not implemented: navigation/,
  // Best-effort de banda: fetchLichessAccount/fetchChesscomGameRatings podem
  // rejeitar (429, rede) nos testes que validam esse comportamento gracioso.
  /Falha ao ler \/api\/account; mantendo banda\./,
  /Falha ao ler stats Chess\.com; mantendo banda\./,
];

function isAllowlisted(args: unknown[]): boolean {
  const msg = args.map((a) => (typeof a === 'string' ? a : String(a))).join(' ');
  return CONSOLE_ALLOWLIST.some((pattern) =>
    typeof pattern === 'string' ? msg.includes(pattern) : pattern.test(msg),
  );
}

const originalError = console.error.bind(console);
const originalWarn = console.warn.bind(console);

console.error = (...args: unknown[]) => {
  if (isAllowlisted(args)) {
    originalError(...args);
    return;
  }
  originalError(...args);
  throw new Error(`[setup] console.error inesperado: ${args.map(String).join(' ')}`);
};

console.warn = (...args: unknown[]) => {
  if (isAllowlisted(args)) {
    originalWarn(...args);
    return;
  }
  originalWarn(...args);
  throw new Error(`[setup] console.warn inesperado: ${args.map(String).join(' ')}`);
};

const env =
  typeof window === 'undefined' ? undefined : (window as unknown as Record<string, unknown>);

if (env !== undefined) {
  if (env.matchMedia === undefined) {
    env.matchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    });
  }

  if (env.ResizeObserver === undefined) {
    class ResizeObserverStub {
      observe(): void {
        /* no-op */
      }
      unobserve(): void {
        /* no-op */
      }
      disconnect(): void {
        /* no-op */
      }
    }

    env.ResizeObserver = ResizeObserverStub;
  }

  if (env.IntersectionObserver === undefined) {
    class IntersectionObserverStub {
      private readonly callback: IntersectionObserverCallback;
      readonly root = null;
      readonly rootMargin = '';
      readonly thresholds: readonly number[] = [];

      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback;
      }

      observe(target: Element): void {
        // Reporta como visível imediatamente: componentes com lazy-mount
        // (TacticDiagram) e o Embla renderizam nos testes sem viewport real.
        this.callback(
          [{ isIntersecting: true, target } as unknown as IntersectionObserverEntry],
          this as unknown as IntersectionObserver,
        );
      }

      unobserve(): void {
        /* no-op */
      }
      disconnect(): void {
        /* no-op */
      }
      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
    }

    env.IntersectionObserver = IntersectionObserverStub;
    (globalThis as unknown as Record<string, unknown>).IntersectionObserver = IntersectionObserverStub;
  }
}
