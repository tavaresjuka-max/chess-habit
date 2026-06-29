// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock, type MockInstance } from 'vitest';
import type {
  PullBlobsInput,
  PullBlobsResult,
  PushBlobEngineInput,
} from '../infra/sync/syncEngine';
import type { SyncClient } from '../infra/sync/syncClient';
import { SyncPanel } from './SyncPanel';
import * as syncStorageMod from '../infra/sync/syncStorage';
import type { SyncAllResult, SyncAllInput } from '../infra/sync/syncStorage';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

interface OpsMocks {
  pushBlob: Mock<(input: PushBlobEngineInput) => Promise<void>>;
  pullBlobs: Mock<(input: PullBlobsInput) => Promise<PullBlobsResult>>;
  loadToken: Mock<() => Promise<string | undefined>>;
}

function makeOps(tokenValue = 'token-abc'): OpsMocks {
  let lastPushedValue: unknown;
  return {
    pushBlob: vi.fn((input: PushBlobEngineInput) => {
      lastPushedValue = input.value;
      return Promise.resolve();
    }),
    pullBlobs: vi.fn(() =>
      Promise.resolve<PullBlobsResult>({
        ok: true,
        items: [{ collection: 'probe', clientMutationId: 'm', updatedAt: 1, value: lastPushedValue }],
      }),
    ),
    loadToken: vi.fn(() => Promise.resolve(tokenValue)),
  };
}

function makeOpsNoToken(): OpsMocks {
  return makeOpsWithToken(undefined);
}

function makeOpsWithToken(tokenValue: string | undefined): OpsMocks {
  const ops = makeOps();
  ops.loadToken = vi.fn(() => Promise.resolve(tokenValue));
  return ops;
}

const noopClient = (): SyncClient => ({}) as unknown as SyncClient;

describe('SyncPanel — estrutura sem passphrase', () => {
  it('NÃO exibe campo de passphrase', () => {
    render(<SyncPanel operations={makeOps()} backendUrl="http://x" />);
    expect(screen.queryByLabelText(/passphrase/i)).not.toBeInTheDocument();
  });

  it('NÃO exibe aviso de passphrase irrecuperável', () => {
    render(<SyncPanel operations={makeOps()} backendUrl="http://x" />);
    expect(screen.queryByText(/não pode ser recuperada/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/irrecuperáveis/i)).not.toBeInTheDocument();
  });

  it('exibe botão "Sincronizar agora"', () => {
    render(<SyncPanel operations={makeOps()} backendUrl="http://x" />);
    expect(screen.getByRole('button', { name: /sincronizar agora/i })).toBeInTheDocument();
  });

  it('NÃO exibe botão "Definir passphrase"', () => {
    render(<SyncPanel operations={makeOps()} backendUrl="http://x" />);
    expect(screen.queryByRole('button', { name: /definir passphrase/i })).not.toBeInTheDocument();
  });
});

describe('SyncPanel — botão sync desabilitado sem backend', () => {
  it('mantém "Sincronizar agora" desabilitado quando a URL do backend está vazia', () => {
    render(<SyncPanel operations={makeOps()} backendUrl="" />);
    expect(screen.getByRole('button', { name: /sincronizar agora/i })).toBeDisabled();
  });

  it('habilita "Sincronizar agora" ao informar uma URL de backend válida', () => {
    render(<SyncPanel operations={makeOps()} backendUrl="" />);
    const url = screen.getByPlaceholderText('http://127.0.0.1:8787');
    fireEvent.change(url, { target: { value: 'http://127.0.0.1:8787' } });
    expect(screen.getByRole('button', { name: /sincronizar agora/i })).toBeEnabled();
  });
});

describe('SyncPanel — sem token Lichess', () => {
  it('mostra mensagem pedindo login quando não há token', async () => {
    const ops = makeOpsNoToken();
    render(
      <SyncPanel
        operations={ops}
        createClient={noopClient}
        backendUrl="http://127.0.0.1:8787"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /sincronizar agora/i }));

    await waitFor(() => {
      expect(ops.loadToken).toHaveBeenCalledTimes(1);
    });
    expect(ops.pushBlob).not.toHaveBeenCalled();
    expect(await screen.findByText(/faça login/i)).toBeInTheDocument();
  });
});

// Testes da sonda antiga removidos — a sonda foi substituída pelo sync real
// (syncAllCollections). Os testes relevantes estão em
// "SyncPanel — sync real chama syncAllCollections" abaixo.

// Testes de retry da sonda removidos — sonda substituída pelo sync real.

// Teste de payload da sonda removido — sonda substituída pelo sync real.
// O token Lichess não é exposto no syncAllCollections (usado apenas no client).

describe('SyncPanel — token Lichess via loadToken', () => {
  it('chama loadToken (não pede passphrase) e usa o token no cliente', async () => {
    const ops = makeOps('bearer-xyz');
    const createClientSpy = vi.fn(noopClient);
    render(
      <SyncPanel
        operations={ops}
        createClient={createClientSpy}
        backendUrl="http://127.0.0.1:8787"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /sincronizar agora/i }));

    await waitFor(() => {
      expect(ops.loadToken).toHaveBeenCalledTimes(1);
    });
    // createClient recebe (backendUrl, bearerToken)
    expect(createClientSpy).toHaveBeenCalledWith('http://127.0.0.1:8787', 'bearer-xyz');
  });
});

// ── Novos testes: sync real (syncAllCollections) ──────────────────────────────

describe('SyncPanel — sync real chama syncAllCollections', () => {
  let syncAllSpy: MockInstance<(input: SyncAllInput) => Promise<SyncAllResult>>;

  beforeEach(() => {
    syncAllSpy = vi.spyOn(syncStorageMod, 'syncAllCollections');
  });

  afterEach(() => {
    syncAllSpy.mockRestore();
  });

  function makeSuccessResult(pushed = 7, applied = 3, collectionsOk = 12): SyncAllResult {
    return {
      ok: true,
      perCollection: [],
      totals: { pushed, applied, collectionsOk, collectionsFailed: 0 },
    };
  }

  it('chama syncAllCollections ao clicar "Sincronizar agora" com token válido', async () => {
    syncAllSpy.mockResolvedValue(makeSuccessResult());
    const ops = makeOps('token-ok');
    render(
      <SyncPanel
        operations={ops}
        createClient={noopClient}
        backendUrl="http://127.0.0.1:8787"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /sincronizar agora/i }));

    await waitFor(() => {
      expect(syncAllSpy).toHaveBeenCalledOnce();
    });
  });

  it('exibe resumo com registros enviados e coleções após sync bem-sucedido', async () => {
    syncAllSpy.mockResolvedValue(makeSuccessResult(7, 3, 12));
    const ops = makeOps('token-ok');
    render(
      <SyncPanel
        operations={ops}
        createClient={noopClient}
        backendUrl="http://127.0.0.1:8787"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /sincronizar agora/i }));

    // O resumo exibido é: "Sincronizado: 7 registros enviados em 12 coleções."
    await waitFor(() => {
      expect(screen.getByText(/sincronizado:.*7 registros enviados em 12 coleções/i)).toBeInTheDocument();
    });
  });

  it('sem token → mensagem de login, NÃO chama syncAllCollections', async () => {
    syncAllSpy.mockResolvedValue(makeSuccessResult());
    const ops = makeOpsNoToken();
    render(
      <SyncPanel
        operations={ops}
        createClient={noopClient}
        backendUrl="http://127.0.0.1:8787"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /sincronizar agora/i }));

    await waitFor(() => {
      expect(ops.loadToken).toHaveBeenCalledTimes(1);
    });
    expect(syncAllSpy).not.toHaveBeenCalled();
    expect(await screen.findByText(/faça login/i)).toBeInTheDocument();
  });

  it('SyncUnauthorizedError → mensagem de re-login, NÃO trava a UI', async () => {
    syncAllSpy.mockResolvedValue({ ok: false, reason: 'unauthorized' });
    const ops = makeOps('token-expirado');
    render(
      <SyncPanel
        operations={ops}
        createClient={noopClient}
        backendUrl="http://127.0.0.1:8787"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /sincronizar agora/i }));

    await waitFor(() => {
      expect(screen.getByText(/sessão.*expirou|entre de novo/i)).toBeInTheDocument();
    });
    // Botão deve voltar a ficar habilitado (não travou)
    expect(screen.getByRole('button', { name: /sincronizar agora/i })).toBeEnabled();
  });

  it('falha parcial em coleções mostra aviso de quais falharam', async () => {
    const partialResult: SyncAllResult = {
      ok: true,
      perCollection: [
        { collection: 'weaknesses', pulled: 0, applied: 0, pushed: 0, error: 'timeout' },
        { collection: 'plans', pulled: 1, applied: 1, pushed: 1 },
      ],
      totals: { pushed: 1, applied: 1, collectionsOk: 1, collectionsFailed: 1 },
    };
    syncAllSpy.mockResolvedValue(partialResult);
    const ops = makeOps('token-ok');
    render(
      <SyncPanel
        operations={ops}
        createClient={noopClient}
        backendUrl="http://127.0.0.1:8787"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /sincronizar agora/i }));

    await waitFor(() => {
      // Avisa sobre coleções com erro
      expect(screen.getByText(/weaknesses/i)).toBeInTheDocument();
    });
  });
});
