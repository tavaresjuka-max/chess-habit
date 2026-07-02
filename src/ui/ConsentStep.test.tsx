// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConsentStep } from './ConsentStep';

afterEach(cleanup);

function renderStep(onAccept = vi.fn<(researchOptIn: boolean) => Promise<void>>(() => Promise.resolve())) {
  render(<ConsentStep onAccept={onAccept} />);
  return onAccept;
}

describe('ConsentStep — postura epistemológica', () => {
  it('nunca alega eficácia comprovada (postura: falsificar, não provar)', () => {
    renderStep();
    const panel = screen.getByRole('region', { name: /Seus dados e sua privacidade/i });
    expect(panel.textContent).not.toMatch(/comprovad/i);
  });

  it('declara o acordo honesto: o app tenta se falsificar, não se provar', () => {
    renderStep();
    expect(screen.getByText(/tenta se falsificar, não se provar/i)).toBeInTheDocument();
  });
});

describe('ConsentStep — consentimento', () => {
  it('opt-in de pesquisa começa marcado e pode ser desmarcado', () => {
    renderStep();
    const checkbox = screen.getByRole('checkbox', {
      name: /Participar da medição de eficácia/i,
    });
    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it('aceitar envia o valor atual do opt-in', async () => {
    const onAccept = renderStep();
    fireEvent.click(screen.getByRole('checkbox', { name: /Participar da medição de eficácia/i }));
    fireEvent.click(screen.getByRole('button', { name: /Aceitar e continuar/i }));
    await waitFor(() => {
      expect(onAccept).toHaveBeenCalledWith(false);
    });
  });

  it('desabilita o botão enquanto o aceite está em andamento', async () => {
    let resolveAccept: () => void = () => {};
    const onAccept = vi.fn<(researchOptIn: boolean) => Promise<void>>(
      () =>
        new Promise<void>((resolve) => {
          resolveAccept = resolve;
        }),
    );
    renderStep(onAccept);
    const button = screen.getByRole('button', { name: /Aceitar e continuar/i });
    fireEvent.click(button);
    await waitFor(() => {
      expect(button).toBeDisabled();
    });
    resolveAccept();
    await waitFor(() => {
      expect(button).toBeEnabled();
    });
  });
});
