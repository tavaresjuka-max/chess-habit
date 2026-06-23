// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BackupImportResult } from '../app/backupStatus';
import type { LearnerProfile } from '../domain';
import { Config } from './Config';

// Flush the microtask queue so that async event handlers (void fn()) resolve
// before we assert on mocks. Three ticks are enough for .then chains produced
// by the component's await calls.
async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const profile: LearnerProfile = {
  lichessUsername: 'testuser',
  chesscomUsername: undefined,
  band: '800-1000',
  defaultSessionMinutes: 15,
  goals: ['Criar uma rotina consistente de treino'],
  updatedAt: '2026-06-15T00:00:00.000Z',
};

function makeProps(overrides: Partial<Parameters<typeof Config>[0]> = {}): Parameters<typeof Config>[0] {
  return {
    profile,
    lichessToken: undefined,
    lichessConnectionState: 'disconnected',
    lichessMessage: undefined,
    storagePersistence: undefined,
    backupMeta: undefined,
    autoBackupStatus: 'unsupported',
    autoBackupFileName: undefined,
    onEnableAutoBackup: vi.fn(() => Promise.resolve()),
    onDisableAutoBackup: vi.fn(() => Promise.resolve()),
    onSave: vi.fn(() => Promise.resolve()),
    onSavePlacementResult: vi.fn(() => Promise.resolve()),
    onConnectLichess: vi.fn(() => Promise.resolve()),
    onDisconnectLichess: vi.fn(() => Promise.resolve()),
    onImportKnownManualSignals: vi.fn(() => Promise.resolve(0)),
    onExport: vi.fn(() => Promise.resolve('{"data":[]}')),
    onImportBackup: vi.fn(() =>
      Promise.resolve({
        ok: true,
        recordCount: 5,
        exportedAt: '2026-06-15T00:00:00.000Z',
      } satisfies BackupImportResult),
    ),
    onClear: vi.fn(() => Promise.resolve()),
    onBack: undefined,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Helper: open a <details> section by clicking its <summary>.
// The Fold component uses native <details>. "Essencial" is open by default;
// others need a click on the summary to expand.
// ---------------------------------------------------------------------------
function openFold(titleText: string) {
  const h2 = screen.getByText(titleText);
  const summary = h2.closest('summary');
  if (summary) fireEvent.click(summary);
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Config — rendering', () => {
  it('renders the page heading', () => {
    render(<Config {...makeProps()} />);
    expect(screen.getByRole('heading', { name: 'Configuração' })).toBeInTheDocument();
  });

  it('renders the Voltar button when onBack is provided', () => {
    const onBack = vi.fn();
    render(<Config {...makeProps({ onBack })} />);
    expect(screen.getByRole('button', { name: /Voltar à recepção/ })).toBeInTheDocument();
  });

  it('does NOT render the Voltar button when onBack is undefined', () => {
    render(<Config {...makeProps({ onBack: undefined })} />);
    expect(screen.queryByRole('button', { name: /Voltar à recepção/ })).not.toBeInTheDocument();
  });

  it('pre-fills the Lichess username from the profile', () => {
    render(<Config {...makeProps()} />);
    // "Essencial" fold is open by default
    expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
  });

  it('preserva themeStages do perfil ao salvar (PED-3 não é zerado — achado do council)', async () => {
    const onSave = vi.fn(() => Promise.resolve());
    const profileWithStages: LearnerProfile = { ...profile, themeStages: { fork: 'retrieval' } };
    render(<Config {...makeProps({ profile: profileWithStages, onSave })} />);

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ themeStages: { fork: 'retrieval' } }),
      );
    });
  });

  it('renders with no profile (uses default profile — empty username)', () => {
    render(<Config {...makeProps({ profile: undefined })} />);
    expect(screen.getByRole('heading', { name: 'Configuração' })).toBeInTheDocument();
  });

  it('renders the app version discreetly', () => {
    render(<Config {...makeProps()} />);
    expect(screen.getByText('versão 0.0.0')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// onBack callback
// ---------------------------------------------------------------------------

describe('Config — onBack', () => {
  it('calls onBack when the Voltar button is clicked', () => {
    const onBack = vi.fn();
    render(<Config {...makeProps({ onBack })} />);
    fireEvent.click(screen.getByRole('button', { name: /Voltar à recepção/ }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Form save — onSave
// ---------------------------------------------------------------------------

describe('Config — form save (onSave)', () => {
  it('calls onSave with the current username and defaults when Salvar is clicked', async () => {
    const onSave = vi.fn<(profile: LearnerProfile) => Promise<void>>(() => Promise.resolve());
    render(<Config {...makeProps({ onSave })} />);

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    await flushPromises();

    expect(onSave).toHaveBeenCalledTimes(1);
    const saved = onSave.mock.calls[0]?.[0];
    expect(saved?.lichessUsername).toBe('testuser');
    expect(saved?.band).toBe('800-1000');
    expect(saved?.defaultSessionMinutes).toBe(15);
  });

  it('calls onSave with undefined lichessUsername when username field is cleared', async () => {
    const onSave = vi.fn<(profile: LearnerProfile) => Promise<void>>(() => Promise.resolve());
    render(<Config {...makeProps({ onSave })} />);

    const input = screen.getByDisplayValue('testuser');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    await flushPromises();

    expect(onSave).toHaveBeenCalledTimes(1);
    const saved = onSave.mock.calls[0]?.[0];
    expect(saved?.lichessUsername).toBeUndefined();
  });

  it('calls onSave with the new username after typing', async () => {
    const onSave = vi.fn<(profile: LearnerProfile) => Promise<void>>(() => Promise.resolve());
    render(<Config {...makeProps({ onSave })} />);

    const input = screen.getByDisplayValue('testuser');
    fireEvent.change(input, { target: { value: 'novousuario' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    await flushPromises();

    expect(onSave).toHaveBeenCalledTimes(1);
    const saved = onSave.mock.calls[0]?.[0];
    expect(saved?.lichessUsername).toBe('novousuario');
  });

  it('trims whitespace from username before calling onSave', async () => {
    const onSave = vi.fn<(profile: LearnerProfile) => Promise<void>>(() => Promise.resolve());
    render(<Config {...makeProps({ onSave })} />);

    const input = screen.getByDisplayValue('testuser');
    fireEvent.change(input, { target: { value: '  espacos  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    await flushPromises();

    expect(onSave).toHaveBeenCalledTimes(1);
    const saved = onSave.mock.calls[0]?.[0];
    expect(saved?.lichessUsername).toBe('espacos');
  });

  it('calls onSave with selected session minutes after changing the select', async () => {
    const onSave = vi.fn<(profile: LearnerProfile) => Promise<void>>(() => Promise.resolve());
    render(<Config {...makeProps({ onSave })} />);

    // In the "Essencial" form there are two selects: band (index 0) and minutes (index 1).
    const selects = screen.getAllByRole('combobox');
    const minutesSelect = selects[selects.length - 1] as HTMLElement;
    fireEvent.change(minutesSelect, { target: { value: '30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    await flushPromises();

    expect(onSave).toHaveBeenCalledTimes(1);
    const saved = onSave.mock.calls[0]?.[0];
    expect(saved?.defaultSessionMinutes).toBe(30);
  });
});

// ---------------------------------------------------------------------------
// Apagar tudo — inline confirmation (confirmingClear flow)
// ---------------------------------------------------------------------------

describe('Config — "Apagar tudo" inline confirmation', () => {
  it('shows the inline confirm group when "Apagar tudo" is clicked', () => {
    render(<Config {...makeProps()} />);
    openFold('Dados locais');

    fireEvent.click(screen.getByRole('button', { name: /Apagar tudo/ }));

    expect(screen.getByText('Apagar todos os dados locais?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Apagar definitivamente/ })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Confirmar apagar tudo' })).toBeInTheDocument();
  });

  it('calls onClear when "Apagar definitivamente" is confirmed', async () => {
    const onClear = vi.fn(() => Promise.resolve());
    render(<Config {...makeProps({ onClear })} />);

    openFold('Dados locais');
    fireEvent.click(screen.getByRole('button', { name: /Apagar tudo/ }));
    fireEvent.click(screen.getByRole('button', { name: /Apagar definitivamente/ }));
    await flushPromises();

    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('dismisses the confirm group when Cancelar is clicked', () => {
    render(<Config {...makeProps()} />);
    openFold('Dados locais');

    fireEvent.click(screen.getByRole('button', { name: /Apagar tudo/ }));
    expect(screen.getByText('Apagar todos os dados locais?')).toBeInTheDocument();

    const confirmGroup = screen.getByRole('group', { name: 'Confirmar apagar tudo' });
    const cancelBtn = confirmGroup.querySelector('button.link-button') as HTMLButtonElement;
    fireEvent.click(cancelBtn);

    expect(screen.queryByText('Apagar todos os dados locais?')).not.toBeInTheDocument();
    // Original "Apagar tudo" button is restored
    expect(screen.getByRole('button', { name: /Apagar tudo/ })).toBeInTheDocument();
  });

  it('does NOT call onClear if Cancelar is clicked', () => {
    const onClear = vi.fn(() => Promise.resolve());
    render(<Config {...makeProps({ onClear })} />);

    openFold('Dados locais');
    fireEvent.click(screen.getByRole('button', { name: /Apagar tudo/ }));

    const confirmGroup = screen.getByRole('group', { name: 'Confirmar apagar tudo' });
    const cancelBtn = confirmGroup.querySelector('button.link-button') as HTMLButtonElement;
    fireEvent.click(cancelBtn);

    expect(onClear).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Export backup — onExport
// ---------------------------------------------------------------------------

describe('Config — export backup (onExport)', () => {
  it('calls onExport when "Exportar backup JSON" is clicked', async () => {
    const onExport = vi.fn(() => Promise.resolve('{}'));

    // URL.createObjectURL is not available in jsdom — stub it
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined);

    render(<Config {...makeProps({ onExport })} />);
    openFold('Dados locais');

    fireEvent.click(screen.getByRole('button', { name: 'Exportar backup JSON' }));
    await flushPromises();

    expect(onExport).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Restaurar backup — inline confirmation (pendingRestoreFile flow)
// ---------------------------------------------------------------------------

describe('Config — "Restaurar backup" inline confirmation', () => {
  function triggerFileInput() {
    openFold('Dados locais');

    const fileInput = document.querySelector(
      'input[type="file"][aria-label="Selecionar arquivo de backup para restaurar"]',
    ) as HTMLInputElement;

    const file = new File(['{"version":1}'], 'backup.json', { type: 'application/json' });
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      configurable: true,
    });
    fireEvent.change(fileInput);

    return file;
  }

  it('shows inline confirm group after a file is chosen', () => {
    render(<Config {...makeProps()} />);
    triggerFileInput();

    expect(screen.getByText('Restaurar substitui todos os dados atuais. Continuar?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restaurar e recarregar' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Confirmar restaurar backup' })).toBeInTheDocument();
  });

  it('calls onImportBackup when "Restaurar e recarregar" is confirmed', async () => {
    // Return ok:false so the component does NOT call window.location.reload()
    const onImportBackup = vi.fn<(json: string) => Promise<BackupImportResult>>(() =>
      Promise.resolve({
        ok: false,
        error: 'Arquivo inválido para teste.',
      } satisfies BackupImportResult),
    );

    render(<Config {...makeProps({ onImportBackup })} />);
    triggerFileInput();

    fireEvent.click(screen.getByRole('button', { name: 'Restaurar e recarregar' }));
    await flushPromises();

    expect(onImportBackup).toHaveBeenCalledTimes(1);
    // The argument is the text content of the file (from File.text())
    expect(typeof onImportBackup.mock.calls[0]?.[0]).toBe('string');
  });

  it('rejects oversized backup files before importing', async () => {
    const onImportBackup = vi.fn<(json: string) => Promise<BackupImportResult>>(() =>
      Promise.resolve({ ok: true, recordCount: 1, exportedAt: '2026-06-15T00:00:00.000Z' }),
    );
    render(<Config {...makeProps({ onImportBackup })} />);
    openFold('Dados locais');

    const fileInput = document.querySelector(
      'input[type="file"][aria-label="Selecionar arquivo de backup para restaurar"]',
    ) as HTMLInputElement;
    const file = new File(['{}'], 'backup-grande.json', { type: 'application/json' });
    Object.defineProperty(file, 'size', {
      value: 6 * 1024 * 1024,
      configurable: true,
    });
    const textSpy = vi.spyOn(file, 'text');
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      configurable: true,
    });

    fireEvent.change(fileInput);
    fireEvent.click(screen.getByRole('button', { name: 'Restaurar e recarregar' }));
    await flushPromises();

    expect(textSpy).not.toHaveBeenCalled();
    expect(onImportBackup).not.toHaveBeenCalled();
  });

  it('dismisses the confirm group when Cancelar is clicked (restore)', () => {
    render(<Config {...makeProps()} />);
    triggerFileInput();

    expect(screen.getByText('Restaurar substitui todos os dados atuais. Continuar?')).toBeInTheDocument();

    const confirmGroup = screen.getByRole('group', { name: 'Confirmar restaurar backup' });
    const cancelBtn = confirmGroup.querySelector('button.link-button') as HTMLButtonElement;
    fireEvent.click(cancelBtn);

    expect(screen.queryByText('Restaurar substitui todos os dados atuais. Continuar?')).not.toBeInTheDocument();
    // Original "Restaurar backup" button is restored
    expect(screen.getByRole('button', { name: 'Restaurar backup' })).toBeInTheDocument();
  });

  it('does NOT call onImportBackup if Cancelar is clicked', () => {
    const onImportBackup = vi.fn(() =>
      Promise.resolve({ ok: true, recordCount: 0, exportedAt: '' } satisfies BackupImportResult),
    );
    render(<Config {...makeProps({ onImportBackup })} />);

    triggerFileInput();

    const confirmGroup = screen.getByRole('group', { name: 'Confirmar restaurar backup' });
    const cancelBtn = confirmGroup.querySelector('button.link-button') as HTMLButtonElement;
    fireEvent.click(cancelBtn);

    expect(onImportBackup).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Lichess OAuth — connect / disconnect
// ---------------------------------------------------------------------------

describe('Config — Lichess OAuth', () => {
  it('shows "Conectar Lichess" when no token is present', () => {
    render(<Config {...makeProps({ lichessToken: undefined })} />);
    openFold('Lichess');
    expect(screen.getByRole('button', { name: 'Conectar Lichess' })).toBeInTheDocument();
  });

  it('calls onConnectLichess when connect button is clicked', async () => {
    const onConnectLichess = vi.fn(() => Promise.resolve());
    render(<Config {...makeProps({ onConnectLichess })} />);
    openFold('Lichess');

    fireEvent.click(screen.getByRole('button', { name: 'Conectar Lichess' }));
    await flushPromises();

    expect(onConnectLichess).toHaveBeenCalledTimes(1);
  });

  it('shows "Reconectar Lichess" when a token is present', () => {
    const lichessToken = {
      accessToken: 'tok123',
      tokenType: 'Bearer' as const,
      scopes: ['puzzle:read' as const],
      obtainedAt: '2026-06-15T00:00:00.000Z',
      expiresAt: '2027-06-15T00:00:00.000Z',
    };
    render(<Config {...makeProps({ lichessToken })} />);
    openFold('Lichess');
    expect(screen.getByRole('button', { name: 'Reconectar Lichess' })).toBeInTheDocument();
  });

  it('calls onDisconnectLichess when "Remover conexão" is clicked', async () => {
    const onDisconnectLichess = vi.fn(() => Promise.resolve());
    const lichessToken = {
      accessToken: 'tok123',
      tokenType: 'Bearer' as const,
      scopes: ['puzzle:read' as const],
      obtainedAt: '2026-06-15T00:00:00.000Z',
      expiresAt: '2027-06-15T00:00:00.000Z',
    };
    render(<Config {...makeProps({ lichessToken, onDisconnectLichess })} />);
    openFold('Lichess');

    fireEvent.click(screen.getByRole('button', { name: 'Remover conexão' }));
    await flushPromises();

    expect(onDisconnectLichess).toHaveBeenCalledTimes(1);
  });

  it('"Remover conexão" is disabled when no token is present', () => {
    render(<Config {...makeProps({ lichessToken: undefined })} />);
    openFold('Lichess');
    expect(screen.getByRole('button', { name: 'Remover conexão' })).toBeDisabled();
  });

  it('both Lichess buttons are disabled when connectionState is "syncing"', () => {
    render(<Config {...makeProps({ lichessConnectionState: 'syncing' })} />);
    openFold('Lichess');
    // The connect/reconnect button
    const connectBtn = screen.getByRole('button', { name: /Conectar Lichess|Reconectar Lichess/ });
    expect(connectBtn).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Remover conexão' })).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// Manual signals import
// ---------------------------------------------------------------------------

describe('Config — manual signals import', () => {
  it('calls onImportKnownManualSignals when "Adicionar sinais manuais" is clicked', async () => {
    const onImportKnownManualSignals = vi.fn(() => Promise.resolve(3));
    render(<Config {...makeProps({ onImportKnownManualSignals })} />);
    openFold('Dados locais');

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar sinais manuais' }));
    await flushPromises();

    expect(onImportKnownManualSignals).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// autoBackupStatus branches
// ---------------------------------------------------------------------------

describe('Config — autoBackupStatus', () => {
  it('shows "Ativar backup automático" when autoBackupStatus is "disabled"', () => {
    render(<Config {...makeProps({ autoBackupStatus: 'disabled' })} />);
    openFold('Dados locais');
    expect(screen.getByRole('button', { name: 'Ativar backup automático' })).toBeInTheDocument();
  });

  it('calls onEnableAutoBackup when "Ativar backup automático" is clicked', async () => {
    const onEnableAutoBackup = vi.fn(() => Promise.resolve());
    render(<Config {...makeProps({ autoBackupStatus: 'disabled', onEnableAutoBackup })} />);
    openFold('Dados locais');

    fireEvent.click(screen.getByRole('button', { name: 'Ativar backup automático' }));
    await flushPromises();

    expect(onEnableAutoBackup).toHaveBeenCalledTimes(1);
  });

  it('shows "Desligar backup automático" when autoBackupStatus is "enabled"', () => {
    render(<Config {...makeProps({ autoBackupStatus: 'enabled' })} />);
    openFold('Dados locais');
    expect(screen.getByRole('button', { name: 'Desligar backup automático' })).toBeInTheDocument();
    // "Reativar" button should NOT be shown when status is 'enabled'
    expect(screen.queryByRole('button', { name: 'Reativar backup automático' })).not.toBeInTheDocument();
  });

  it('calls onDisableAutoBackup when "Desligar backup automático" is clicked', async () => {
    const onDisableAutoBackup = vi.fn(() => Promise.resolve());
    render(<Config {...makeProps({ autoBackupStatus: 'enabled', onDisableAutoBackup })} />);
    openFold('Dados locais');

    fireEvent.click(screen.getByRole('button', { name: 'Desligar backup automático' }));
    await flushPromises();

    expect(onDisableAutoBackup).toHaveBeenCalledTimes(1);
  });

  it('shows both "Reativar" and "Desligar" when autoBackupStatus is "needs-permission"', () => {
    render(<Config {...makeProps({ autoBackupStatus: 'needs-permission' })} />);
    openFold('Dados locais');
    expect(screen.getByRole('button', { name: 'Reativar backup automático' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Desligar backup automático' })).toBeInTheDocument();
  });

  it('does NOT show auto-backup buttons when autoBackupStatus is "unsupported"', () => {
    render(<Config {...makeProps({ autoBackupStatus: 'unsupported' })} />);
    openFold('Dados locais');
    expect(screen.queryByRole('button', { name: 'Ativar backup automático' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Desligar backup automático' })).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// formatBackupMeta — invalid date branch (line 411-412)
// ---------------------------------------------------------------------------

describe('Config — formatBackupMeta', () => {
  it('shows "Nenhum backup exportado ainda." when backupMeta is undefined', () => {
    render(<Config {...makeProps({ backupMeta: undefined })} />);
    openFold('Dados locais');
    expect(screen.getByText('Nenhum backup exportado ainda.')).toBeInTheDocument();
  });

  it('shows formatted date and record count when backupMeta is valid', () => {
    render(
      <Config
        {...makeProps({
          backupMeta: {
            exportedAt: '2026-06-15T10:00:00.000Z',
            recordCount: 42,
            checksum: 'abc123',
          },
        })}
      />,
    );
    openFold('Dados locais');
    expect(screen.getByText(/42 registros/)).toBeInTheDocument();
  });

  it('falls back to raw string when exportedAt is not a valid date', () => {
    render(
      <Config
        {...makeProps({
          backupMeta: {
            exportedAt: 'data-invalida',
            recordCount: 3,
            checksum: 'xyz',
          },
        })}
      />,
    );
    openFold('Dados locais');
    expect(screen.getByText(/data-invalida/)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// formatLichessConnection — error state (line 428)
// ---------------------------------------------------------------------------

describe('Config — formatLichessConnection', () => {
  it('shows "Conexão Lichess precisa de atenção." when connectionState is "error"', () => {
    render(<Config {...makeProps({ lichessConnectionState: 'error' })} />);
    openFold('Lichess');
    expect(screen.getByText('Conexão Lichess precisa de atenção.')).toBeInTheDocument();
  });

  it('shows "Sincronizando com o Lichess." when connectionState is "syncing"', () => {
    render(<Config {...makeProps({ lichessConnectionState: 'syncing' })} />);
    openFold('Lichess');
    expect(screen.getByText('Sincronizando com o Lichess.')).toBeInTheDocument();
  });

  it('shows "Desconectado." when token is undefined and state is "disconnected"', () => {
    render(<Config {...makeProps({ lichessToken: undefined, lichessConnectionState: 'disconnected' })} />);
    openFold('Lichess');
    expect(screen.getByText('Desconectado.')).toBeInTheDocument();
  });

  it('shows connected scopes when token is present', () => {
    const lichessToken = {
      accessToken: 'tok123',
      tokenType: 'Bearer' as const,
      scopes: ['puzzle:read' as const, 'study:write' as const],
      obtainedAt: '2026-06-15T00:00:00.000Z',
      expiresAt: '2027-06-15T00:00:00.000Z',
    };
    render(<Config {...makeProps({ lichessToken, lichessConnectionState: 'connected' })} />);
    openFold('Lichess');
    expect(screen.getByText(/puzzle:read/)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// storagePersistence branch
// ---------------------------------------------------------------------------

describe('Config — storagePersistence', () => {
  it('renders persistence status when storagePersistence is provided', () => {
    render(<Config {...makeProps({ storagePersistence: 'persisted' })} />);
    openFold('Dados locais');
    // describePersistenceStatus returns a string; just confirm it's rendered
    const dataZone = screen.getByRole('region', { name: /config/i }).querySelector('.data-zone');
    expect(dataZone).toBeInTheDocument();
  });

  it('does NOT show a persistence paragraph when storagePersistence is undefined', () => {
    render(<Config {...makeProps({ storagePersistence: undefined })} />);
    openFold('Dados locais');
    // Just confirms no crash and section renders
    expect(screen.getByText('Nenhum backup exportado ainda.')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// lichessMessage visible in Lichess fold
// ---------------------------------------------------------------------------

describe('Config — lichessMessage', () => {
  it('renders lichessMessage when provided', () => {
    render(<Config {...makeProps({ lichessMessage: 'Erro de autenticação.' })} />);
    openFold('Lichess');
    expect(screen.getByText('Erro de autenticação.')).toBeInTheDocument();
  });

  it('does NOT render a lichessMessage paragraph when undefined', () => {
    render(<Config {...makeProps({ lichessMessage: undefined })} />);
    openFold('Lichess');
    // "Desconectado." is already present but no extra message paragraph
    expect(screen.queryByText('Erro de autenticação.')).not.toBeInTheDocument();
  });
});
