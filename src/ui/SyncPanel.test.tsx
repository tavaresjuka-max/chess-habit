// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';
import type {
  PullBlobsInput,
  PullBlobsResult,
  PushBlobEngineInput,
} from '../infra/sync/syncEngine';
import type { SyncClient } from '../infra/sync/syncClient';
import { SyncPanel } from './SyncPanel';

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

function flush(): Promise<void> {
  return Promise.resolve().then().then().then();
}

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

describe('SyncPanel — round-trip da sonda de sincronização', () => {
  it('mostra "Sincronizado" quando o pull devolve a sonda atual (kind e at iguais)', async () => {
    const ops = makeOps();
    render(
      <SyncPanel
        operations={ops}
        createClient={noopClient}
        backendUrl="http://127.0.0.1:8787"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /sincronizar agora/i }));

    await waitFor(() => {
      expect(ops.pushBlob).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText(/sincronizado:/i)).toBeInTheDocument();
  });

  it('mostra falha quando o pull não devolve a sonda atual (at divergente)', async () => {
    const ops = makeOps();
    ops.pullBlobs.mockResolvedValue({
      ok: true,
      items: [{ collection: 'probe', clientMutationId: 'm', updatedAt: 1, value: { kind: 'sync-probe', at: 1 } }],
    });
    render(
      <SyncPanel
        operations={ops}
        createClient={noopClient}
        backendUrl="http://127.0.0.1:8787"
        probeRetryDelaysMs={[0, 0]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /sincronizar agora/i }));

    await waitFor(() => {
      expect(ops.pushBlob).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText(/não confirmada/i)).toBeInTheDocument();
    expect(screen.queryByText(/sincronizado:/i)).not.toBeInTheDocument();
  });

  it('mostra falha quando o pull devolve lista vazia (sonda não voltou)', async () => {
    const ops = makeOps();
    ops.pullBlobs.mockResolvedValue({ ok: true, items: [] });
    render(
      <SyncPanel
        operations={ops}
        createClient={noopClient}
        backendUrl="http://127.0.0.1:8787"
        probeRetryDelaysMs={[0, 0]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /sincronizar agora/i }));

    await waitFor(() => {
      expect(ops.pushBlob).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText(/não confirmada/i)).toBeInTheDocument();
  });
});

describe('SyncPanel — retry da sonda (consistência eventual)', () => {
  it('recupera quando o primeiro pull não devolve a sonda mas o segundo sim', async () => {
    const ops = makeOps();
    let pushedValue: unknown;
    ops.pushBlob = vi.fn((input: PushBlobEngineInput) => {
      pushedValue = input.value;
      return Promise.resolve();
    });
    let pullCount = 0;
    ops.pullBlobs = vi.fn(() => {
      pullCount += 1;
      if (pullCount === 1) {
        return Promise.resolve<PullBlobsResult>({ ok: true, items: [] });
      }
      return Promise.resolve<PullBlobsResult>({
        ok: true,
        items: [{ collection: 'probe', clientMutationId: 'm', updatedAt: 1, value: pushedValue }],
      });
    });
    render(
      <SyncPanel
        operations={ops}
        createClient={noopClient}
        backendUrl="http://127.0.0.1:8787"
        probeRetryDelaysMs={[0, 0]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /sincronizar agora/i }));

    expect(await screen.findByText(/sincronizado:/i)).toBeInTheDocument();
    expect(ops.pullBlobs).toHaveBeenCalledTimes(2);
  });

  it('falha quando todos os pulls não devolvem a sonda (esgota retries)', async () => {
    const ops = makeOps();
    ops.pullBlobs = vi.fn(() => Promise.resolve<PullBlobsResult>({ ok: true, items: [] }));
    render(
      <SyncPanel
        operations={ops}
        createClient={noopClient}
        backendUrl="http://127.0.0.1:8787"
        probeRetryDelaysMs={[0, 0]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /sincronizar agora/i }));

    expect(await screen.findByText(/não confirmada/i)).toBeInTheDocument();
    expect(ops.pullBlobs).toHaveBeenCalledTimes(3);
    expect(ops.pushBlob).toHaveBeenCalledTimes(1);
  });
});

describe('SyncPanel — payload da sonda não contém o token', () => {
  it('o valor entregue ao pushBlob é a sonda pública (kind+at), sem conter o token', async () => {
    const secretToken = 'meu-token-secreto-lichess-9999';
    const ops = makeOpsWithToken(secretToken);
    render(
      <SyncPanel
        operations={ops}
        createClient={noopClient}
        backendUrl="http://127.0.0.1:8787"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /sincronizar agora/i }));
    await flush();

    expect(ops.pushBlob).toHaveBeenCalledTimes(1);
    const sent = ops.pushBlob.mock.calls[0]?.[0];
    expect(sent).toBeDefined();
    expect(JSON.stringify(sent?.value)).not.toContain(secretToken);
    expect(sent?.value).toEqual(expect.objectContaining({ kind: 'sync-probe' }));
  });
});

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
