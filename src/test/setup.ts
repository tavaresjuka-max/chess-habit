// Setup global dos testes. jsdom não implementa matchMedia, ResizeObserver nem
// IntersectionObserver, e libs de UI (Embla, no carrossel) e o lazy-mount do
// TacticDiagram precisam deles. Stubs benignos. Acesso destipado porque os tipos
// do DOM declaram esses globais como sempre presentes (no jsdom não estão).
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
