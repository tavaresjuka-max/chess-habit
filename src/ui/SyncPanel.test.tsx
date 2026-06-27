// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';
import type { CanaryStore } from '../infra/sync/canaryStore';
import type { EncryptedBlob } from '../infra/sync/crypto';
import type {
  PullDecryptedInput,
  PullResult,
  PushEncryptedInput,
  SyncPassphraseResult,
} from '../infra/sync/syncEngine';
import type { SyncClient } from '../infra/sync/syncClient';
import { SyncPanel } from './SyncPanel';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const FAKE_CANARY: EncryptedBlob = {
  v: 1,
  kdf: 'PBKDF2-SHA256',
  iterations: 1000,
  salt: 'AAAAAAAAAAAAAAAAAAAAAA==',
  iv: 'AAAAAAAAAAAAAAAA',
  ciphertext: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
};

interface OpsMocks {
  createCanary: Mock<(passphrase: string) => Promise<EncryptedBlob>>;
  verifyCanary: Mock<(canary: EncryptedBlob, passphrase: string) => Promise<boolean>>;
  pushEncrypted: Mock<(input: PushEncryptedInput) => Promise<SyncPassphraseResult>>;
  pullAndDecrypt: Mock<(input: PullDecryptedInput) => Promise<PullResult>>;
}

function makeOps(): OpsMocks {
  let lastPushedValue: unknown;
  return {
    createCanary: vi.fn(() => Promise.resolve(FAKE_CANARY)),
    verifyCanary: vi.fn(() => Promise.resolve(true)),
    pushEncrypted: vi.fn((input: PushEncryptedInput) => {
      lastPushedValue = input.value;
      return Promise.resolve<SyncPassphraseResult>({ ok: true });
    }),
    pullAndDecrypt: vi.fn(() =>
      Promise.resolve<PullResult>({
        ok: true,
        items: [{ collection: 'probe', clientMutationId: 'm', updatedAt: 1, value: lastPushedValue }],
      }),
    ),
  };
}

function makeMemoryStore(initial?: EncryptedBlob): CanaryStore & { snapshot(): EncryptedBlob | undefined } {
  let current = initial;
  return {
    load: () => current,
    save: (blob) => {
      current = blob;
      return true;
    },
    clear: () => {
      current = undefined;
      return true;
    },
    snapshot: () => current,
  };
}

const noopClient = (): SyncClient => ({}) as unknown as SyncClient;

function flush(): Promise<void> {
  return Promise.resolve().then().then().then();
}

describe('SyncPanel — aviso de perda de passphrase', () => {
  it('mostra aviso visivel de que perder a passphrase torna os blobs irrecuperaveis', () => {
    render(<SyncPanel operations={makeOps()} canaryStore={makeMemoryStore()} />);
    expect(screen.getByText(/não pode ser recuperada/i)).toBeInTheDocument();
    expect(screen.getByText(/irrecuperáveis/i)).toBeInTheDocument();
  });

  it('deixa claro que a passphrase e independente do login Lichess', () => {
    render(<SyncPanel operations={makeOps()} canaryStore={makeMemoryStore()} />);
    expect(screen.getByText(/independente do seu login Lichess/i)).toBeInTheDocument();
  });
});

describe('SyncPanel — passphrase vazia bloqueia', () => {
  it('desabilita "Sincronizar agora" e "Definir passphrase" quando a passphrase esta vazia', () => {
    render(
      <SyncPanel operations={makeOps()} canaryStore={makeMemoryStore(FAKE_CANARY)} backendUrl="http://x" />,
    );
    expect(screen.getByRole('button', { name: /Sincronizar agora/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Definir passphrase/i })).toBeDisabled();
  });

  it('nao chama push nem createCanary enquanto a passphrase esta vazia', () => {
    const ops = makeOps();
    render(
      <SyncPanel
        operations={ops}
        canaryStore={makeMemoryStore(FAKE_CANARY)}
        createClient={noopClient}
        backendUrl="http://x"
      />,
    );
    expect(ops.pushEncrypted).not.toHaveBeenCalled();
    expect(ops.createCanary).not.toHaveBeenCalled();
  });
});

describe('SyncPanel — botao sync desabilitado sem backend local', () => {
  it('mantem "Sincronizar agora" desabilitado quando a URL do backend esta vazia', () => {
    render(<SyncPanel operations={makeOps()} canaryStore={makeMemoryStore(FAKE_CANARY)} backendUrl="" />);
    const pass = screen.getByLabelText(/passphrase de sincronização/i);
    fireEvent.change(pass, { target: { value: 'alguma-pass' } });
    expect(screen.getByRole('button', { name: /Sincronizar agora/i })).toBeDisabled();
  });

  it('habilita "Sincronizar agora" ao informar uma URL de backend valida', () => {
    render(<SyncPanel operations={makeOps()} canaryStore={makeMemoryStore(FAKE_CANARY)} backendUrl="" />);
    fireEvent.change(screen.getByLabelText(/passphrase de sincronização/i), {
      target: { value: 'alguma-pass' },
    });
    const url = screen.getByPlaceholderText('http://127.0.0.1:8787');
    fireEvent.change(url, { target: { value: 'http://127.0.0.1:8787' } });
    expect(screen.getByRole('button', { name: /Sincronizar agora/i })).toBeEnabled();
  });
});

describe('SyncPanel — canary com passphrase errada falha', () => {
  it('mostra falha e NAO baixa blobs quando push retorna wrong-passphrase', async () => {
    const ops = makeOps();
    ops.pushEncrypted.mockResolvedValue({ ok: false, reason: 'wrong-passphrase' });
    render(
      <SyncPanel
        operations={ops}
        canaryStore={makeMemoryStore(FAKE_CANARY)}
        createClient={noopClient}
        backendUrl="http://127.0.0.1:8787"
      />,
    );
    fireEvent.change(screen.getByLabelText(/passphrase de sincronização/i), { target: { value: 'errada' } });
    fireEvent.click(screen.getByRole('button', { name: /Sincronizar agora/i }));

    await waitFor(() => {
      expect(ops.pushEncrypted).toHaveBeenCalledTimes(1);
    });
    expect(ops.pullAndDecrypt).not.toHaveBeenCalled();
    expect(await screen.findByText(/passphrase incorreta/i)).toBeInTheDocument();
  });

  it('mostra falha quando o pull devolve wrong-passphrase (apos push ok)', async () => {
    const ops = makeOps();
    ops.pullAndDecrypt.mockResolvedValue({ ok: false, reason: 'wrong-passphrase' });
    render(
      <SyncPanel
        operations={ops}
        canaryStore={makeMemoryStore(FAKE_CANARY)}
        createClient={noopClient}
        backendUrl="http://127.0.0.1:8787"
      />,
    );
    fireEvent.change(screen.getByLabelText(/passphrase de sincronização/i), { target: { value: 'ok' } });
    fireEvent.click(screen.getByRole('button', { name: /Sincronizar agora/i }));

    await waitFor(() => {
      expect(ops.pushEncrypted).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText(/ao decifrar/i)).toBeInTheDocument();
  });
});

describe('SyncPanel — payload nao expoe passphrase', () => {
  it('o valor entregue ao push e a sonda publica, sem conter a passphrase', async () => {
    const ops = makeOps();
    render(
      <SyncPanel
        operations={ops}
        canaryStore={makeMemoryStore(FAKE_CANARY)}
        createClient={noopClient}
        backendUrl="http://127.0.0.1:8787"
      />,
    );
    const secretPassphrase = 'minha-passphrase-secreta-4242';
    fireEvent.change(screen.getByLabelText(/passphrase de sincronização/i), {
      target: { value: secretPassphrase },
    });
    fireEvent.click(screen.getByRole('button', { name: /Sincronizar agora/i }));
    await flush();

    expect(ops.pushEncrypted).toHaveBeenCalledTimes(1);
    const sent = ops.pushEncrypted.mock.calls[0]?.[0];
    expect(sent).toBeDefined();
    expect(JSON.stringify(sent?.value)).not.toContain(secretPassphrase);
    expect(sent?.value).toEqual(expect.objectContaining({ kind: 'sync-probe' }));
  });
});

describe('SyncPanel — fluxo definir + sincronizar', () => {
  it('define a passphrase (cria canary e persiste so o canary) e depois sincroniza', async () => {
    const store = makeMemoryStore();
    const ops = makeOps();
    render(
      <SyncPanel
        operations={ops}
        canaryStore={store}
        createClient={noopClient}
        backendUrl="http://127.0.0.1:8787"
      />,
    );

    fireEvent.change(screen.getByLabelText(/passphrase de sincronização/i), {
      target: { value: 'nova-pass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Definir passphrase/i }));

    await waitFor(() => {
      expect(ops.createCanary).toHaveBeenCalledTimes(1);
    });
    expect(store.snapshot()).toBe(FAKE_CANARY);
    expect(await screen.findByText(/^passphrase definida neste aparelho/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Sincronizar agora/i }));

    await waitFor(() => {
      expect(ops.pushEncrypted).toHaveBeenCalledTimes(1);
    });
    expect(ops.pullAndDecrypt).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/sincronizado:/i)).toBeInTheDocument();
  });

  it('"Definir passphrase" mostra erro quando createCanary rejeita (ex.: vazia no motor)', async () => {
    const ops = makeOps();
    ops.createCanary.mockRejectedValue(new Error('passphrase vazia'));
    render(<SyncPanel operations={ops} canaryStore={makeMemoryStore()} backendUrl="http://x" />);
    fireEvent.change(screen.getByLabelText(/passphrase de sincronização/i), {
      target: { value: 'nao-importa' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Definir passphrase/i }));

    expect(await screen.findByText(/derivar a chave/i)).toBeInTheDocument();
  });
});

describe('SyncPanel — falha de persistencia do canary (localStorage)', () => {
  it('NAO mostra "Passphrase definida" quando canaryStore.save retorna false', async () => {
    const store = makeMemoryStore();
    const saveMock = vi.fn(() => false);
    store.save = saveMock;
    const ops = makeOps();
    render(<SyncPanel operations={ops} canaryStore={store} backendUrl="http://x" />);
    fireEvent.change(screen.getByLabelText(/passphrase de sincronização/i), {
      target: { value: 'nova-pass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Definir passphrase/i }));

    expect(await screen.findByText(/não foi possível salvar a passphrase/i)).toBeInTheDocument();
    expect(screen.queryByText(/^passphrase definida neste aparelho/i)).not.toBeInTheDocument();
    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(store.snapshot()).toBeUndefined();
    expect(screen.getByRole('button', { name: /Definir passphrase/i })).toBeEnabled();
  });
});

describe('SyncPanel — limpar passphrase deste aparelho', () => {
  it('NAO exibe o botao de limpar quando nao ha canary definido', () => {
    render(<SyncPanel operations={makeOps()} canaryStore={makeMemoryStore()} backendUrl="http://x" />);
    expect(screen.queryByRole('button', { name: /limpar passphrase deste aparelho/i })).not.toBeInTheDocument();
  });

  it('exibe o botao de limpar quando ha canary definido', () => {
    render(
      <SyncPanel
        operations={makeOps()}
        canaryStore={makeMemoryStore(FAKE_CANARY)}
        createClient={noopClient}
        backendUrl="http://x"
      />,
    );
    expect(screen.getByRole('button', { name: /limpar passphrase deste aparelho/i })).toBeInTheDocument();
  });

  it('limpa o canary local e zera o status ao confirmar, sem tocar no backend', async () => {
    const store = makeMemoryStore(FAKE_CANARY);
    const clearSpy = vi.spyOn(store, 'clear');
    const ops = makeOps();
    render(
      <SyncPanel
        operations={ops}
        canaryStore={store}
        createClient={noopClient}
        backendUrl="http://127.0.0.1:8787"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /limpar passphrase deste aparelho/i }));
    fireEvent.click(screen.getByRole('button', { name: /^limpar$/i }));

    expect(clearSpy).toHaveBeenCalledTimes(1);
    expect(store.snapshot()).toBeUndefined();
    expect(await screen.findByText(/^sem passphrase definida neste aparelho/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /limpar passphrase deste aparelho/i })).not.toBeInTheDocument();
    expect(ops.pushEncrypted).not.toHaveBeenCalled();
    expect(ops.pullAndDecrypt).not.toHaveBeenCalled();
  });

  it('cancelar a limpeza mantem o canary definido', () => {
    const store = makeMemoryStore(FAKE_CANARY);
    render(
      <SyncPanel
        operations={makeOps()}
        canaryStore={store}
        createClient={noopClient}
        backendUrl="http://127.0.0.1:8787"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /limpar passphrase deste aparelho/i }));
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(store.snapshot()).toBe(FAKE_CANARY);
    expect(screen.getByRole('button', { name: /limpar passphrase deste aparelho/i })).toBeInTheDocument();
  });

  it('NAO zera canary/status e mostra erro quando clear retorna false (storage indisponivel)', () => {
    const store = makeMemoryStore(FAKE_CANARY);
    const clearMock = vi.fn(() => false);
    store.clear = clearMock;
    render(
      <SyncPanel
        operations={makeOps()}
        canaryStore={store}
        createClient={noopClient}
        backendUrl="http://127.0.0.1:8787"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /limpar passphrase deste aparelho/i }));
    fireEvent.click(screen.getByRole('button', { name: /^limpar$/i }));

    expect(clearMock).toHaveBeenCalledTimes(1);
    expect(store.snapshot()).toBe(FAKE_CANARY);
    expect(screen.getByText(/não foi possível remover a passphrase/i)).toBeInTheDocument();
    expect(screen.queryByText(/^sem passphrase definida neste aparelho/i)).not.toBeInTheDocument();
  });
});

describe('SyncPanel — round-trip da sonda de sincronizacao', () => {
  it('mostra "Sincronizado" quando o pull devolve a sonda atual (kind e at iguais)', async () => {
    const ops = makeOps();
    render(
      <SyncPanel
        operations={ops}
        canaryStore={makeMemoryStore(FAKE_CANARY)}
        createClient={noopClient}
        backendUrl="http://127.0.0.1:8787"
      />,
    );
    fireEvent.change(screen.getByLabelText(/passphrase de sincronização/i), { target: { value: 'ok' } });
    fireEvent.click(screen.getByRole('button', { name: /Sincronizar agora/i }));

    await waitFor(() => {
      expect(ops.pushEncrypted).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText(/sincronizado:/i)).toBeInTheDocument();
  });

  it('mostra falha quando o pull nao devolve a sonda atual (at divergente)', async () => {
    const ops = makeOps();
    ops.pullAndDecrypt.mockResolvedValue({
      ok: true,
      items: [{ collection: 'probe', clientMutationId: 'm', updatedAt: 1, value: { kind: 'sync-probe', at: 1 } }],
    });
    render(
      <SyncPanel
        operations={ops}
        canaryStore={makeMemoryStore(FAKE_CANARY)}
        createClient={noopClient}
        backendUrl="http://127.0.0.1:8787"
        probeRetryDelaysMs={[0, 0]}
      />,
    );
    fireEvent.change(screen.getByLabelText(/passphrase de sincronização/i), { target: { value: 'ok' } });
    fireEvent.click(screen.getByRole('button', { name: /Sincronizar agora/i }));

    await waitFor(() => {
      expect(ops.pushEncrypted).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText(/não confirmada/i)).toBeInTheDocument();
    expect(screen.queryByText(/sincronizado:/i)).not.toBeInTheDocument();
  });

  it('mostra falha quando o pull devolve lista vazia (sonda nao voltou)', async () => {
    const ops = makeOps();
    ops.pullAndDecrypt.mockResolvedValue({ ok: true, items: [] });
    render(
      <SyncPanel
        operations={ops}
        canaryStore={makeMemoryStore(FAKE_CANARY)}
        createClient={noopClient}
        backendUrl="http://127.0.0.1:8787"
        probeRetryDelaysMs={[0, 0]}
      />,
    );
    fireEvent.change(screen.getByLabelText(/passphrase de sincronização/i), { target: { value: 'ok' } });
    fireEvent.click(screen.getByRole('button', { name: /Sincronizar agora/i }));

    await waitFor(() => {
      expect(ops.pushEncrypted).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText(/não confirmada/i)).toBeInTheDocument();
  });
});

describe('SyncPanel — retry da sonda (consistência eventual)', () => {
  it('recupera quando o primeiro pull nao devolve a sonda mas o segundo sim', async () => {
    const ops = makeOps();
    let pushedValue: unknown;
    ops.pushEncrypted = vi.fn((input: PushEncryptedInput) => {
      pushedValue = input.value;
      return Promise.resolve<SyncPassphraseResult>({ ok: true });
    });
    let pullCount = 0;
    ops.pullAndDecrypt = vi.fn(() => {
      pullCount += 1;
      if (pullCount === 1) {
        return Promise.resolve<PullResult>({ ok: true, items: [] });
      }
      return Promise.resolve<PullResult>({
        ok: true,
        items: [{ collection: 'probe', clientMutationId: 'm', updatedAt: 1, value: pushedValue }],
      });
    });
    render(
      <SyncPanel
        operations={ops}
        canaryStore={makeMemoryStore(FAKE_CANARY)}
        createClient={noopClient}
        backendUrl="http://127.0.0.1:8787"
        probeRetryDelaysMs={[0, 0]}
      />,
    );
    fireEvent.change(screen.getByLabelText(/passphrase de sincronização/i), { target: { value: 'ok' } });
    fireEvent.click(screen.getByRole('button', { name: /Sincronizar agora/i }));

    expect(await screen.findByText(/sincronizado:/i)).toBeInTheDocument();
    expect(ops.pullAndDecrypt).toHaveBeenCalledTimes(2);
  });

  it('falha quando todos os pulls nao devolvem a sonda (esgota retries)', async () => {
    const ops = makeOps();
    ops.pullAndDecrypt = vi.fn(() => Promise.resolve<PullResult>({ ok: true, items: [] }));
    render(
      <SyncPanel
        operations={ops}
        canaryStore={makeMemoryStore(FAKE_CANARY)}
        createClient={noopClient}
        backendUrl="http://127.0.0.1:8787"
        probeRetryDelaysMs={[0, 0]}
      />,
    );
    fireEvent.change(screen.getByLabelText(/passphrase de sincronização/i), { target: { value: 'ok' } });
    fireEvent.click(screen.getByRole('button', { name: /Sincronizar agora/i }));

    expect(await screen.findByText(/não confirmada/i)).toBeInTheDocument();
    expect(ops.pullAndDecrypt).toHaveBeenCalledTimes(3);
    expect(ops.pushEncrypted).toHaveBeenCalledTimes(1);
  });
});
