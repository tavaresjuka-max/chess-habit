import { useEffect, useRef, type RefCallback } from 'react';

function clampPercent(percent: number): number {
  return Math.max(0, Math.min(100, percent));
}

/** Aplica a largura via CSSOM (setProperty), que nao e bloqueado pela CSP style-src. */
export function useBarFill(percent: number): RefCallback<HTMLElement> {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    ref.current?.style.setProperty('--bar-fill', `${String(clampPercent(percent))}%`);
  }, [percent]);

  return (node) => {
    ref.current = node;
    node?.style.setProperty('--bar-fill', `${String(clampPercent(percent))}%`);
  };
}
