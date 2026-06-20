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
    step: 'accounts' as const,
    defaults: defaultProfile,
    plan: undefined,
    roadmap,
    sessionMinutes: 15 as const,
    weaknesses,
    learningPlanResponse: undefined,
    onStartSetup: vi.fn(),
    onQuickStart: vi.fn<() => Promise<void>>(() => Promise.resolve()),
    onBackToWelcome: vi.fn(),
    onContinueAccounts: vi.fn<(profile: LearnerProfile) => Promise<void>>(() => Promise.resolve()),
    onConnectLichess: vi.fn<(profile: LearnerProfile) => Promise<void>>(() => Promise.resolve()),
    onRunImport: vi.fn<() => Promise<{ weaknessCount: number; confidentWeaknessCount: number }>>(() =>
      Promise.resolve({ weaknessCount: 0, confidentWeaknessCount: 0 }),
    ),
    onImportDone: vi.fn<(result: { weaknessCount: number; confidentWeaknessCount: number }) => void>(),
    onApplyPlacement: vi.fn<() => Promise<void>>(() => Promise.resolve()),
    onSkipQuestions: vi.fn(),
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
  it('labels the welcome step', () => {
    render(<Onboarding {...makeProps({ step: 'welcome' })} />);
    expect(screen.getByText('Boas-vindas')).toBeInTheDocument();
  });

  it('labels the accounts step', () => {
    render(<Onboarding {...makeProps({ step: 'accounts' })} />);
    expect(screen.getAllByText('Suas contas').length).toBeGreaterThan(0);
  });

  it('labels the importing step', () => {
    render(<Onboarding {...makeProps({ step: 'importing' })} />);
    expect(screen.getAllByText('Importando').length).toBeGreaterThan(0);
  });

  it('labels the questions step', () => {
    render(<Onboarding {...makeProps({ step: 'questions' })} />);
    expect(screen.getAllByText('Avaliação de entrada').length).toBeGreaterThan(0);
  });

  it('labels the plan step', () => {
    render(<Onboarding {...makeProps({ step: 'plan' })} />);
    expect(screen.getByText('Seu plano')).toBeInTheDocument();
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
});

// ---------------------------------------------------------------------------
// Accounts step — fields
// ---------------------------------------------------------------------------

describe('Onboarding — accounts step — fields', () => {
  it('renders the accounts heading', () => {
    render(<Onboarding {...makeProps()} />);
    expect(screen.getByRole('heading', { name: 'Suas contas' })).toBeInTheDocument();
  });

  it('renders the Lichess and Chess.com username fields', () => {
    render(<Onboarding {...makeProps()} />);
    expect(screen.getByText('Usuário Lichess')).toBeInTheDocument();
    expect(screen.getByText('Usuário Chess.com')).toBeInTheDocument();
  });

  it('renders the band and session selectors', () => {
    render(<Onboarding {...makeProps()} />);
    expect(screen.getByText('Faixa atual')).toBeInTheDocument();
    expect(screen.getByText('Tempo padrão')).toBeInTheDocument();
  });

  it('renders the Continuar and Voltar buttons', () => {
    render(<Onboarding {...makeProps()} />);
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeInTheDocument();
  });

  it('explains that leaving accounts blank leads to the questions', () => {
    render(<Onboarding {...makeProps()} />);
    expect(screen.getByText(/Deixe em branco e\s+continue/)).toBeInTheDocument();
  });

  it('hides the optional "Conectar Lichess" button until a Lichess username is typed', () => {
    render(<Onboarding {...makeProps()} />);
    expect(screen.queryByRole('button', { name: /Conectar Lichess/ })).toBeNull();

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0] as HTMLElement, { target: { value: 'jukaxadrez' } });

    expect(screen.getByRole('button', { name: /Conectar Lichess/ })).toBeInTheDocument();
  });

  it('pre-fills usernames from defaults', () => {
    const profileWithUsers: LearnerProfile = {
      ...defaultProfile,
      lichessUsername: 'jukalichess',
      chesscomUsername: 'jukachess',
    };
    render(<Onboarding {...makeProps({ defaults: profileWithUsers })} />);
    const inputs = screen.getAllByRole('textbox');
    expect(inputs[0]).toHaveValue('jukalichess');
    expect(inputs[1]).toHaveValue('jukachess');
  });
});

// ---------------------------------------------------------------------------
// Accounts step — submission and navigation
// ---------------------------------------------------------------------------

describe('Onboarding — accounts step — submission', () => {
  it('calls onContinueAccounts with the trimmed Lichess username', async () => {
    const onContinueAccounts = vi.fn<(profile: LearnerProfile) => Promise<void>>(() => Promise.resolve());
    render(<Onboarding {...makeProps({ onContinueAccounts })} />);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0] as HTMLElement, { target: { value: '  meu_lichess  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    await waitFor(() => {
      expect(onContinueAccounts).toHaveBeenCalledTimes(1);
    });
    expect(onContinueAccounts.mock.calls[0]?.[0].lichessUsername).toBe('meu_lichess');
  });

  it('passes undefined usernames when both fields are empty', async () => {
    const onContinueAccounts = vi.fn<(profile: LearnerProfile) => Promise<void>>(() => Promise.resolve());
    render(<Onboarding {...makeProps({ onContinueAccounts })} />);

    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    await waitFor(() => {
      expect(onContinueAccounts).toHaveBeenCalledTimes(1);
    });
    const saved = onContinueAccounts.mock.calls[0]?.[0];
    expect(saved?.lichessUsername).toBeUndefined();
    expect(saved?.chesscomUsername).toBeUndefined();
  });

  it('passes the selected band and session minutes', async () => {
    const onContinueAccounts = vi.fn<(profile: LearnerProfile) => Promise<void>>(() => Promise.resolve());
    render(<Onboarding {...makeProps({ onContinueAccounts })} />);

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0] as HTMLSelectElement, { target: { value: '1200-1600' } });
    fireEvent.change(selects[1] as HTMLSelectElement, { target: { value: '30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    await waitFor(() => {
      expect(onContinueAccounts).toHaveBeenCalledTimes(1);
    });
    const saved = onContinueAccounts.mock.calls[0]?.[0];
    expect(saved?.band).toBe('1200-1600');
    expect(saved?.defaultSessionMinutes).toBe(30);
  });

  it('calls onConnectLichess with the assembled profile when connecting', async () => {
    const onConnectLichess = vi.fn<(profile: LearnerProfile) => Promise<void>>(() => Promise.resolve());
    render(<Onboarding {...makeProps({ onConnectLichess })} />);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0] as HTMLElement, { target: { value: 'jukaxadrez' } });
    fireEvent.click(screen.getByRole('button', { name: /Conectar Lichess/ }));

    await waitFor(() => {
      expect(onConnectLichess).toHaveBeenCalledTimes(1);
    });
    expect(onConnectLichess.mock.calls[0]?.[0].lichessUsername).toBe('jukaxadrez');
  });

  it('calls onBackToWelcome when "Voltar" is clicked', () => {
    const onBackToWelcome = vi.fn();
    render(<Onboarding {...makeProps({ onBackToWelcome })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(onBackToWelcome).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Importing step
// ---------------------------------------------------------------------------

describe('Onboarding — importing step', () => {
  it('shows the loading copy and the sources being imported', () => {
    const profileWithUsers: LearnerProfile = {
      ...defaultProfile,
      lichessUsername: 'jukalichess',
      chesscomUsername: 'jukachess',
    };
    render(<Onboarding {...makeProps({ step: 'importing', defaults: profileWithUsers })} />);
    expect(screen.getByRole('heading', { name: 'Buscando suas partidas…' })).toBeInTheDocument();
    expect(screen.getByText(/Lichess e Chess\.com/)).toBeInTheDocument();
  });

  it('runs the import once on mount and reports the weakness counts', async () => {
    const onRunImport = vi.fn<() => Promise<{ weaknessCount: number; confidentWeaknessCount: number }>>(() =>
      Promise.resolve({ weaknessCount: 3, confidentWeaknessCount: 2 }),
    );
    const onImportDone = vi.fn<(result: { weaknessCount: number; confidentWeaknessCount: number }) => void>();
    render(<Onboarding {...makeProps({ step: 'importing', onRunImport, onImportDone })} />);

    await waitFor(() => {
      expect(onImportDone).toHaveBeenCalledWith({ weaknessCount: 3, confidentWeaknessCount: 2 });
    });
    expect(onRunImport).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Questions step
// ---------------------------------------------------------------------------

describe('Onboarding — questions step', () => {
  it('opens straight into the placement questions', () => {
    render(<Onboarding {...makeProps({ step: 'questions' })} />);
    expect(screen.getByText('Qual é a sua experiência com xadrez?')).toBeInTheDocument();
  });

  it('explains the no-account case when no username is present', () => {
    render(<Onboarding {...makeProps({ step: 'questions' })} />);
    expect(screen.getByText(/Sem partidas para analisar ainda/)).toBeInTheDocument();
  });

  it('explains the insufficient-data case when an account is present', () => {
    const profileWithUser: LearnerProfile = { ...defaultProfile, chesscomUsername: 'jukachess' };
    render(<Onboarding {...makeProps({ step: 'questions', defaults: profileWithUser })} />);
    expect(screen.getByText(/ainda não deram um sinal concentrado/)).toBeInTheDocument();
  });

  it('calls onSkipQuestions when the learner skips the assessment', () => {
    const onSkipQuestions = vi.fn();
    render(<Onboarding {...makeProps({ step: 'questions', onSkipQuestions })} />);
    fireEvent.click(screen.getByRole('button', { name: /Pular e usar a faixa/ }));
    expect(onSkipQuestions).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Plan step
// ---------------------------------------------------------------------------

describe('Onboarding — plan step', () => {
  it('shows the loading message when plan is undefined', () => {
    render(<Onboarding {...makeProps({ step: 'plan', plan: undefined })} />);
    expect(screen.getByText('O professor está montando seu plano…')).toBeInTheDocument();
  });
});
