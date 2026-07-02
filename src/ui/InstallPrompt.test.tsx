// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, act, fireEvent } from '@testing-library/react';
import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest';
import { InstallPrompt } from './InstallPrompt';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const createMockEvent = (outcome: 'accepted' | 'dismissed') => {
  const event = new Event('beforeinstallprompt');
  Object.defineProperty(event, 'prompt', {
    value: vi.fn().mockResolvedValue(undefined),
    writable: true
  });
  Object.defineProperty(event, 'userChoice', {
    value: Promise.resolve({ outcome }),
    writable: true
  });
  return event as unknown as BeforeInstallPromptEvent;
};

describe('InstallPrompt', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('sem canInstall nao renderiza nada', () => {
    const { container } = render(<InstallPrompt />);
    expect(container).toBeEmptyDOMElement();
  });

  it('com evento capturado mostra o texto e os 2 botoes', () => {
    const mockEvent = createMockEvent('dismissed');
    render(<InstallPrompt />);
    
    act(() => {
      window.dispatchEvent(mockEvent);
    });
    
    expect(screen.getByText('Leve o professor com você: instale o app na sua tela inicial.')).toBeInTheDocument();
    expect(screen.getByText('Instalar agora')).toBeInTheDocument();
    expect(screen.getByText('Depois')).toBeInTheDocument();
  });

  it('Instalar agora chama prompt() do evento', async () => {
    const mockEvent = createMockEvent('dismissed');
    const promptSpy = vi.spyOn(mockEvent, 'prompt');
    render(<InstallPrompt />);

    act(() => {
      window.dispatchEvent(mockEvent);
    });

    const installButton = screen.getByText('Instalar agora');
    await act(async () => {
      fireEvent.click(installButton);
      // Deixa o promptInstall assíncrono resolver dentro do act.
      await Promise.resolve();
    });

    expect(promptSpy).toHaveBeenCalled();
  });

  it('Depois esconde o banner', () => {
    const mockEvent = createMockEvent('dismissed');
    const { container } = render(<InstallPrompt />);
    
    act(() => {
      window.dispatchEvent(mockEvent);
    });

    const dismissButton = screen.getByText('Depois');
    act(() => {
      fireEvent.click(dismissButton);
    });

    expect(container).toBeEmptyDOMElement();
  });
});
