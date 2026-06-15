// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LearnerProfile, TrainingRoadmapItem, Weakness } from '../domain';
import { Onboarding } from './Onboarding';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const defaultProfile: LearnerProfile = {
  lichessUsername: undefined,
  chesscomUsername: undefined,
  band: '800-1000',
  defaultSessionMinutes: 15,
  goals: [],
  updatedAt: '2026-06-15T00:00:00.000Z',
};

const roadmap: TrainingRoadmapItem[] = [];
const weaknesses: Weakness[] = [];

function makeProps(overrides: Partial<Parameters<typeof Onboarding>[0]> = {}) {
  return {
    step: 'setup' as const,
    defaults: defaultProfile,
    plan: undefined,
    roadmap,
    sessionMinutes: 15 as const,
    weaknesses,
    learningPlanResponse: undefined,
    onStartSetup: vi.fn(),
    onQuickStart: vi.fn<() => Promise<void>>(() => Promise.resolve()),
    onBackToWelcome: vi.fn(),
    onSaveProfile: vi.fn<(profile: LearnerProfile) => Promise<void>>(() => Promise.resolve()),
    onApprovePlan: vi.fn<() => Promise<void>>(() => Promise.resolve()),
    onRequestPlanRevision: vi.fn<(note: string) => Promise<void>>(() => Promise.resolve()),
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

describe('Onboarding — step indicator', () => {
  it('shows "Passo 1 de 3" on welcome step', () => {
    render(<Onboarding {...makeProps({ step: 'welcome' })} />);
    expect(screen.getByText('Passo 1 de 3')).toBeInTheDocument();
  });

  it('shows "Passo 2 de 3" on setup step', () => {
    render(<Onboarding {...makeProps({ step: 'setup' })} />);
    expect(screen.getByText('Passo 2 de 3')).toBeInTheDocument();
  });

  it('shows "Passo 3 de 3" on plan step', () => {
    render(<Onboarding {...makeProps({ step: 'plan' })} />);
    expect(screen.getByText('Passo 3 de 3')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Welcome step
// ---------------------------------------------------------------------------

describe('Onboarding — welcome step', () => {
  it('renders the welcome heading and action buttons', () => {
    render(<Onboarding {...makeProps({ step: 'welcome' })} />);
    expect(screen.getByRole('heading', { name: 'A aula pode começar.' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Vamos configurar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Começar rápido' })).toBeInTheDocument();
  });

  it('calls onStartSetup when "Vamos configurar" is clicked', () => {
    const onStartSetup = vi.fn();
    render(<Onboarding {...makeProps({ step: 'welcome', onStartSetup })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Vamos configurar' }));
    expect(onStartSetup).toHaveBeenCalledTimes(1);
  });

  it('calls onQuickStart when "Começar rápido" is clicked', async () => {
    const onQuickStart = vi.fn<() => Promise<void>>(() => Promise.resolve());
    render(<Onboarding {...makeProps({ step: 'welcome', onQuickStart })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Começar rápido' }));
    await waitFor(() => {
      expect(onQuickStart).toHaveBeenCalledTimes(1);
    });
  });

  it('renders notice text when provided', () => {
    render(<Onboarding {...makeProps({ step: 'welcome', notice: 'Seu perfil foi atualizado.' })} />);
    expect(screen.getByText('Seu perfil foi atualizado.')).toBeInTheDocument();
  });

  it('does not render notice element when notice is undefined', () => {
    render(<Onboarding {...makeProps({ step: 'welcome', notice: undefined })} />);
    expect(screen.queryByText('Seu perfil foi atualizado.')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// EssentialSetup step — field rendering
// ---------------------------------------------------------------------------

describe('Onboarding — EssentialSetup step — fields', () => {
  it('renders the setup heading', () => {
    render(<Onboarding {...makeProps()} />);
    expect(screen.getByRole('heading', { name: 'Vamos configurar' })).toBeInTheDocument();
  });

  it('renders the Lichess username field label', () => {
    render(<Onboarding {...makeProps()} />);
    expect(screen.getByText('Usuário Lichess')).toBeInTheDocument();
  });

  it('renders the Chess.com username field label', () => {
    render(<Onboarding {...makeProps()} />);
    expect(screen.getByText('Usuário Chess.com')).toBeInTheDocument();
  });

  it('renders the band selector label', () => {
    render(<Onboarding {...makeProps()} />);
    expect(screen.getByText('Faixa atual')).toBeInTheDocument();
  });

  it('renders the session time selector label', () => {
    render(<Onboarding {...makeProps()} />);
    expect(screen.getByText('Tempo padrão')).toBeInTheDocument();
  });

  it('renders the save button', () => {
    render(<Onboarding {...makeProps()} />);
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument();
  });

  it('renders the back button', () => {
    render(<Onboarding {...makeProps()} />);
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeInTheDocument();
  });

  it('renders the OAuth hint text under the Lichess field', () => {
    render(<Onboarding {...makeProps()} />);
    expect(
      screen.getByText(/conecte o Lichess na aba Config depois de salvar/),
    ).toBeInTheDocument();
  });

  it('renders the Chess.com "apenas dados públicos" hint', () => {
    render(<Onboarding {...makeProps()} />);
    expect(screen.getByText(/Só dados públicos, sem login/)).toBeInTheDocument();
  });

  it('pre-fills Lichess username from defaults when provided', () => {
    const profileWithUser: LearnerProfile = { ...defaultProfile, lichessUsername: 'jukaxadrez' };
    render(<Onboarding {...makeProps({ defaults: profileWithUser })} />);
    const inputs = screen.getAllByRole('textbox');
    // First textbox is Lichess username
    expect(inputs[0]).toHaveValue('jukaxadrez');
  });

  it('pre-fills Chess.com username from defaults when provided', () => {
    const profileWithUser: LearnerProfile = { ...defaultProfile, chesscomUsername: 'jukachess' };
    render(<Onboarding {...makeProps({ defaults: profileWithUser })} />);
    const inputs = screen.getAllByRole('textbox');
    // Second textbox is Chess.com username
    expect(inputs[1]).toHaveValue('jukachess');
  });

  it('renders all band options in the select', () => {
    render(<Onboarding {...makeProps()} />);
    const selects = screen.getAllByRole('combobox');
    // First select is Faixa atual
    const bandSelect = selects[0];
    const options = Array.from((bandSelect as HTMLSelectElement).options).map((o) => o.value);
    expect(options).toContain('0-400');
    expect(options).toContain('800-1000');
    expect(options).toContain('2000-2200');
  });

  it('renders the session time options (5, 15, 30, 60 min)', () => {
    render(<Onboarding {...makeProps()} />);
    const selects = screen.getAllByRole('combobox');
    // Second select is Tempo padrão
    const timeSelect = selects[1];
    const optionTexts = Array.from((timeSelect as HTMLSelectElement).options).map((o) => o.text);
    expect(optionTexts).toContain('5 min');
    expect(optionTexts).toContain('15 min');
    expect(optionTexts).toContain('30 min');
    expect(optionTexts).toContain('60 min');
  });
});

// ---------------------------------------------------------------------------
// EssentialSetup step — form submission
// ---------------------------------------------------------------------------

describe('Onboarding — EssentialSetup step — form submission', () => {
  it('calls onSaveProfile with typed Lichess username on submit', async () => {
    const onSaveProfile = vi.fn<(profile: LearnerProfile) => Promise<void>>(() => Promise.resolve());
    render(<Onboarding {...makeProps({ onSaveProfile })} />);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0] as HTMLElement, { target: { value: 'meu_lichess' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(onSaveProfile).toHaveBeenCalledTimes(1);
    });
    const saved = onSaveProfile.mock.calls[0]?.[0];
    expect(saved?.lichessUsername).toBe('meu_lichess');
  });

  it('calls onSaveProfile with typed Chess.com username on submit', async () => {
    const onSaveProfile = vi.fn<(profile: LearnerProfile) => Promise<void>>(() => Promise.resolve());
    render(<Onboarding {...makeProps({ onSaveProfile })} />);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[1] as HTMLElement, { target: { value: 'meu_chesscom' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(onSaveProfile).toHaveBeenCalledTimes(1);
    });
    const saved = onSaveProfile.mock.calls[0]?.[0];
    expect(saved?.chesscomUsername).toBe('meu_chesscom');
  });

  it('passes undefined for lichessUsername when left empty', async () => {
    const onSaveProfile = vi.fn<(profile: LearnerProfile) => Promise<void>>(() => Promise.resolve());
    render(<Onboarding {...makeProps({ onSaveProfile })} />);

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(onSaveProfile).toHaveBeenCalledTimes(1);
    });
    const saved = onSaveProfile.mock.calls[0]?.[0];
    expect(saved?.lichessUsername).toBeUndefined();
  });

  it('passes undefined for chesscomUsername when left empty', async () => {
    const onSaveProfile = vi.fn<(profile: LearnerProfile) => Promise<void>>(() => Promise.resolve());
    render(<Onboarding {...makeProps({ onSaveProfile })} />);

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(onSaveProfile).toHaveBeenCalledTimes(1);
    });
    const saved = onSaveProfile.mock.calls[0]?.[0];
    expect(saved?.chesscomUsername).toBeUndefined();
  });

  it('trims whitespace from lichessUsername before saving', async () => {
    const onSaveProfile = vi.fn<(profile: LearnerProfile) => Promise<void>>(() => Promise.resolve());
    render(<Onboarding {...makeProps({ onSaveProfile })} />);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0] as HTMLElement, { target: { value: '  lichess_user  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(onSaveProfile).toHaveBeenCalledTimes(1);
    });
    const saved = onSaveProfile.mock.calls[0]?.[0];
    expect(saved?.lichessUsername).toBe('lichess_user');
  });

  it('passes only-whitespace lichessUsername as undefined', async () => {
    const onSaveProfile = vi.fn<(profile: LearnerProfile) => Promise<void>>(() => Promise.resolve());
    render(<Onboarding {...makeProps({ onSaveProfile })} />);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0] as HTMLElement, { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(onSaveProfile).toHaveBeenCalledTimes(1);
    });
    const saved = onSaveProfile.mock.calls[0]?.[0];
    expect(saved?.lichessUsername).toBeUndefined();
  });

  it('passes the selected band to onSaveProfile', async () => {
    const onSaveProfile = vi.fn<(profile: LearnerProfile) => Promise<void>>(() => Promise.resolve());
    render(<Onboarding {...makeProps({ onSaveProfile })} />);

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0] as HTMLSelectElement, { target: { value: '1200-1600' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(onSaveProfile).toHaveBeenCalledTimes(1);
    });
    const saved = onSaveProfile.mock.calls[0]?.[0];
    expect(saved?.band).toBe('1200-1600');
  });

  it('passes the selected session minutes to onSaveProfile', async () => {
    const onSaveProfile = vi.fn<(profile: LearnerProfile) => Promise<void>>(() => Promise.resolve());
    render(<Onboarding {...makeProps({ onSaveProfile })} />);

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1] as HTMLSelectElement, { target: { value: '30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(onSaveProfile).toHaveBeenCalledTimes(1);
    });
    const saved = onSaveProfile.mock.calls[0]?.[0];
    expect(saved?.defaultSessionMinutes).toBe(30);
  });

  it('preserves the goals array from defaults', async () => {
    const profileWithGoals: LearnerProfile = { ...defaultProfile, goals: ['melhorar tática'] };
    const onSaveProfile = vi.fn<(profile: LearnerProfile) => Promise<void>>(() => Promise.resolve());
    render(<Onboarding {...makeProps({ defaults: profileWithGoals, onSaveProfile })} />);

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(onSaveProfile).toHaveBeenCalledTimes(1);
    });
    const saved = onSaveProfile.mock.calls[0]?.[0];
    expect(saved?.goals).toEqual(['melhorar tática']);
  });

  it('disables the save button while saving', async () => {
    let resolvePromise!: () => void;
    const onSaveProfile = vi.fn<(profile: LearnerProfile) => Promise<void>>(
      () => new Promise<void>((resolve) => { resolvePromise = resolve; }),
    );
    render(<Onboarding {...makeProps({ onSaveProfile })} />);

    const saveButton = screen.getByRole('button', { name: 'Salvar' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(saveButton).toBeDisabled();
    });

    resolvePromise();

    await waitFor(() => {
      expect(saveButton).not.toBeDisabled();
    });
  });
});

// ---------------------------------------------------------------------------
// EssentialSetup step — navigation
// ---------------------------------------------------------------------------

describe('Onboarding — EssentialSetup step — navigation', () => {
  it('calls onBackToWelcome when "Voltar" is clicked', () => {
    const onBackToWelcome = vi.fn();
    render(<Onboarding {...makeProps({ onBackToWelcome })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(onBackToWelcome).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Plan step
// ---------------------------------------------------------------------------

describe('Onboarding — plan step', () => {
  it('shows loading message when plan is undefined', () => {
    render(<Onboarding {...makeProps({ step: 'plan', plan: undefined })} />);
    expect(screen.getByText('O professor está montando seu plano…')).toBeInTheDocument();
  });
});
