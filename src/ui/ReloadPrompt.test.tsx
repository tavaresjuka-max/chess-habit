// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const updateServiceWorker = vi.fn<(reload?: boolean) => Promise<void>>(() => Promise.resolve());
const setNeedRefresh = vi.fn();
let needRefresh = false;

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [false, vi.fn()],
    updateServiceWorker,
  }),
}));

import { ReloadPrompt } from './ReloadPrompt';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ReloadPrompt', () => {
  it('não renderiza nada sem versão nova', () => {
    needRefresh = false;

    const { container } = render(<ReloadPrompt />);

    expect(container).toBeEmptyDOMElement();
  });

  it('mostra o banner e aplica a atualização em um toque', () => {
    needRefresh = true;

    render(<ReloadPrompt />);

    expect(screen.getByText('O app melhorou desde a última visita.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Atualizar agora' }));
    expect(updateServiceWorker).toHaveBeenCalledWith(true);
  });

  it('permite adiar a atualização', () => {
    needRefresh = true;

    render(<ReloadPrompt />);

    fireEvent.click(screen.getByRole('button', { name: 'Depois' }));
    expect(setNeedRefresh).toHaveBeenCalledWith(false);
  });
});
