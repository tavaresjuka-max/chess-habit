// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  GAME_WITHOUT_ANALYSIS,
  GAME_WITH_JUDGMENTS,
} from '../domain/autopsy/autopsyReport.fixtures';
import type { AutopsyFetchResult } from '../infra/lichess/autopsyClient';

afterEach(() => {
  cleanup();
  vi.resetModules();
  vi.restoreAllMocks();
});

vi.mock('../infra/lichess/autopsyClient', async (importOriginal) => {
  const original = await importOriginal<typeof import('../infra/lichess/autopsyClient')>();
  return {
    ...original,
    fetchGameForAutopsy: vi.fn(),
  };
});

async function importFreshView() {
  const clientModule = await import('../infra/lichess/autopsyClient');
  const { AutopsyView } = await import('./AutopsyView');
  const fetchGameForAutopsy = vi.mocked(clientModule.fetchGameForAutopsy);
  // `vi.resetModules()` no afterEach recarrega o módulo, mas o mock em si
  // (criado uma vez pela factory de `vi.mock`) persiste entre módulos
  // recarregados dentro do MESMO arquivo de teste — limpamos chamadas
  // manualmente para garantir isolamento entre `it`s.
  fetchGameForAutopsy.mockClear();
  return { AutopsyView, fetchGameForAutopsy };
}

function mockOk(exportJson: unknown, gameId: string) {
  const result: AutopsyFetchResult = { kind: 'ok', exportJson, gameId };
  return result;
}

describe('AutopsyView', () => {
  it('estado inicial: mostra campo, botão e a frase do Tavarez', async () => {
    const { AutopsyView } = await importFreshView();
    render(<AutopsyView />);

    expect(screen.getByRole('heading', { name: /Autópsia/i })).toBeInTheDocument();
    expect(screen.getByText(/eu mostro o que você vai treinar/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Link ou ID da partida/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Fazer autópsia/i })).toBeInTheDocument();
  });

  it('botão "Fazer autópsia" começa desabilitado até haver texto no campo', async () => {
    const { AutopsyView } = await importFreshView();
    render(<AutopsyView />);

    expect(screen.getByRole('button', { name: /Fazer autópsia/i })).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Link ou ID da partida/i), {
      target: { value: 'abcd1234' },
    });

    expect(screen.getByRole('button', { name: /Fazer autópsia/i })).toBeEnabled();
  });

  it('link válido sem perfil conhecido → perspectiva → cartões renderizam com retrieval-first (melhor lance oculto até o clique)', async () => {
    const { AutopsyView, fetchGameForAutopsy } = await importFreshView();
    fetchGameForAutopsy.mockResolvedValue(mockOk(GAME_WITH_JUDGMENTS, 'abcd1234'));

    render(<AutopsyView />);

    fireEvent.change(screen.getByLabelText(/Link ou ID da partida/i), {
      target: { value: 'https://lichess.org/abcd1234' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Fazer autópsia/i }));

    // Escolha de perspectiva: os dois lados aparecem como botões com nomes reais.
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Eu joguei de brancas \(AlunoBranco\)/i }),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole('button', { name: /Eu joguei de pretas \(RivalPreto\)/i }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Eu joguei de brancas/i }));

    // Cartão de erro aparece com severidade e lance jogado.
    await waitFor(() => {
      expect(screen.getByText(/Capote/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Lance 3 \(brancas\): d4/i)).toBeInTheDocument();

    // Retrieval-first: a pergunta do Tavarez aparece, a revelação (melhor
    // lance OU o aviso honesto de que não veio) ainda não.
    expect(screen.getByText(/o que você jogaria aqui/i)).toBeInTheDocument();
    expect(screen.queryByText(/Melhor lance:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/não trouxe o melhor lance/i)).not.toBeInTheDocument();

    // Só após clicar em "Mostrar o melhor lance" a revelação aparece. A
    // fixture não traz `best`/`variation`, então o app mostra o aviso
    // honesto em vez de inventar um SAN.
    fireEvent.click(screen.getByRole('button', { name: /Mostrar o melhor lance/i }));
    await waitFor(() => {
      expect(screen.getByText(/não trouxe o melhor lance/i)).toBeInTheDocument();
    });

    // Link externo para o Lichess presente.
    const lichessLink = screen.getByRole('link', { name: /Ver o lance.*no Lichess/i });
    expect(lichessLink).toHaveAttribute('href', 'https://lichess.org/abcd1234/white#5');
    expect(lichessLink).toHaveAttribute('target', '_blank');
    expect(lichessLink).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
  });

  it('revela o SAN do melhor lance quando a análise do Lichess traz `best`', async () => {
    const gameWithBestMove = {
      id: 'wxyz2468',
      moves: 'e4 e5 Nf3 Nc6 d4 exd4',
      players: {
        white: { user: { name: 'AlunoBranco' } },
        black: { user: { name: 'RivalPreto' } },
      },
      analysis: [
        { eval: 20 },
        { eval: 15 },
        { eval: 25 },
        { eval: 10 },
        {
          eval: -180,
          judgment: { name: 'Blunder', comment: 'Perde um peão central sem compensação.' },
          // Posição antes do lance 3.d4: cavalo branco já está em f3 (2.Nf3
          // jogado antes), então o "melhor lance" alternativo válido é
          // 3.Nc3 (b1c3) — g1f3 seria ilegal (a peça já saiu de g1).
          best: 'b1c3',
        },
        { eval: -190 },
      ],
    };
    const { AutopsyView, fetchGameForAutopsy } = await importFreshView();
    fetchGameForAutopsy.mockResolvedValue(mockOk(gameWithBestMove, 'wxyz2468'));

    render(<AutopsyView lichessUsername="AlunoBranco" />);

    fireEvent.change(screen.getByLabelText(/Link ou ID da partida/i), {
      target: { value: 'wxyz2468' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Fazer autópsia/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Mostrar o melhor lance/i })).toBeInTheDocument();
    });
    expect(screen.queryByText(/Melhor lance:/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Mostrar o melhor lance/i }));

    await waitFor(() => {
      expect(screen.getByText(/Melhor lance: Nc3/i)).toBeInTheDocument();
    });
  });

  it('pré-seleciona a perspectiva quando o username do perfil bate com um dos jogadores', async () => {
    const { AutopsyView, fetchGameForAutopsy } = await importFreshView();
    fetchGameForAutopsy.mockResolvedValue(mockOk(GAME_WITH_JUDGMENTS, 'abcd1234'));

    render(<AutopsyView lichessUsername="AlunoBranco" />);

    fireEvent.change(screen.getByLabelText(/Link ou ID da partida/i), {
      target: { value: 'abcd1234' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Fazer autópsia/i }));

    // Pula direto para os cartões — sem tela de escolha de perspectiva.
    await waitFor(() => {
      expect(screen.getByText(/Capote/i)).toBeInTheDocument();
    });
    expect(
      screen.queryByRole('button', { name: /Eu joguei de brancas/i }),
    ).not.toBeInTheDocument();
  });

  it('estado sem análise: mostra instrução de 1 toque e link para a partida', async () => {
    const { AutopsyView, fetchGameForAutopsy } = await importFreshView();
    fetchGameForAutopsy.mockResolvedValue(mockOk(GAME_WITHOUT_ANALYSIS, 'ijkl9012'));

    render(<AutopsyView />);

    fireEvent.change(screen.getByLabelText(/Link ou ID da partida/i), {
      target: { value: 'ijkl9012' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Fazer autópsia/i }));

    await waitFor(() => {
      expect(screen.getByText(/ainda não tem análise do Lichess/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: /Abrir a partida no Lichess/i })).toHaveAttribute(
      'href',
      'https://lichess.org/ijkl9012',
    );
  });

  it('resultado explícito no-analysis do client também mostra a instrução', async () => {
    const { AutopsyView, fetchGameForAutopsy } = await importFreshView();
    fetchGameForAutopsy.mockResolvedValue({ kind: 'no-analysis', gameId: 'qrst7890' });

    render(<AutopsyView />);

    fireEvent.change(screen.getByLabelText(/Link ou ID da partida/i), {
      target: { value: 'qrst7890' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Fazer autópsia/i }));

    await waitFor(() => {
      expect(screen.getByText(/ainda não tem análise do Lichess/i)).toBeInTheDocument();
    });
  });

  it('parseGameRef inválido mostra erro honesto sem chamar o client', async () => {
    const { AutopsyView, fetchGameForAutopsy } = await importFreshView();

    render(<AutopsyView />);

    fireEvent.change(screen.getByLabelText(/Link ou ID da partida/i), {
      target: { value: 'não é um link válido' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Fazer autópsia/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Não reconheci esse link/i);
    });
    expect(fetchGameForAutopsy).not.toHaveBeenCalled();
  });

  it('rate-limited mostra mensagem honesta com opção de retry', async () => {
    const { AutopsyView, fetchGameForAutopsy } = await importFreshView();
    fetchGameForAutopsy.mockResolvedValue({ kind: 'rate-limited' });

    render(<AutopsyView />);

    fireEvent.change(screen.getByLabelText(/Link ou ID da partida/i), {
      target: { value: 'abcd1234' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Fazer autópsia/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/esperar um pouco/i);
    });
    expect(screen.getByRole('alert')).toHaveTextContent(/Pode tentar de novo/i);
  });

  it('erro de rede mostra mensagem honesta e permite tentar de novo', async () => {
    const { AutopsyView, fetchGameForAutopsy } = await importFreshView();
    fetchGameForAutopsy.mockResolvedValue({ kind: 'network-error' });

    render(<AutopsyView />);

    fireEvent.change(screen.getByLabelText(/Link ou ID da partida/i), {
      target: { value: 'abcd1234' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Fazer autópsia/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Não consegui falar com o Lichess/i);
    });
  });
});
