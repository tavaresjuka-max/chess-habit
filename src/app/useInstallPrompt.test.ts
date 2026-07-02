// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useInstallPrompt } from './useInstallPrompt';

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
  vi.spyOn(event, 'preventDefault');
  return event as unknown as BeforeInstallPromptEvent;
};

describe('useInstallPrompt', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('sem evento -> canInstall === false', () => {
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.canInstall).toBe(false);
  });

  it('dispara beforeinstallprompt -> canInstall === true e preventDefault chamado', () => {
    const mockEvent = createMockEvent('accepted');
    const preventDefaultSpy = vi.spyOn(mockEvent, 'preventDefault');
    const { result } = renderHook(() => useInstallPrompt());

    act(() => {
      window.dispatchEvent(mockEvent);
    });

    expect(result.current.canInstall).toBe(true);
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('dismiss() -> canInstall === false e grava dismissed-at; reoferece apos 14 dias', () => {
    const mockEvent = createMockEvent('accepted');
    const { result } = renderHook(() => useInstallPrompt());
    
    act(() => {
      window.dispatchEvent(mockEvent);
    });
    expect(result.current.canInstall).toBe(true);

    act(() => {
      result.current.dismiss();
    });
    expect(result.current.canInstall).toBe(false);
    expect(localStorage.getItem('rotina:install-dismissed-at')).not.toBeNull();

    // Novo mount com dismissed-at de AGORA -> continua false
    const { result: result2 } = renderHook(() => useInstallPrompt());
    act(() => {
      window.dispatchEvent(mockEvent);
    });
    expect(result2.current.canInstall).toBe(false);

    // Novo mount com dismissed-at de 15 dias atras -> habilita
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 15);
    localStorage.setItem('rotina:install-dismissed-at', oldDate.toISOString());

    const { result: result3 } = renderHook(() => useInstallPrompt());
    act(() => {
      window.dispatchEvent(mockEvent);
    });
    expect(result3.current.canInstall).toBe(true);
  });

  it('promptInstall() com outcome accepted -> grava install-done e canInstall === false', async () => {
    const mockEvent = createMockEvent('accepted');
    const { result } = renderHook(() => useInstallPrompt());
    
    act(() => {
      window.dispatchEvent(mockEvent);
    });

    await act(async () => {
      await result.current.promptInstall();
    });

    expect(localStorage.getItem('rotina:install-done')).toBe('1');
    expect(result.current.canInstall).toBe(false);
  });

  it('install-done === 1 no mount -> evento chega mas canInstall continua false', () => {
    localStorage.setItem('rotina:install-done', '1');
    const mockEvent = createMockEvent('accepted');
    
    const { result } = renderHook(() => useInstallPrompt());
    act(() => {
      window.dispatchEvent(mockEvent);
    });
    
    expect(result.current.canInstall).toBe(false);
  });

  it('appinstalled -> canInstall === false + install-done gravado', () => {
    const { result } = renderHook(() => useInstallPrompt());
    
    act(() => {
      window.dispatchEvent(new Event('appinstalled'));
    });
    
    expect(result.current.canInstall).toBe(false);
    expect(localStorage.getItem('rotina:install-done')).toBe('1');
  });
});
