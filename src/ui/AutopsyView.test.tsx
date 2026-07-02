// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  GAME_WITHOUT_ANALYSIS,
  GAME_WITH_CLOCKS_WHITE_NO_PRESSURE,
  GAME_WITH_CLOCKS_WHITE_TIME_PRESSURE,
  GAME_WITH_JUDGMENTS,
} from '../domain/autopsy/autopsyReport.fixtures';
import type { AutopsyFetchResult } from '../infra/lichess/autopsyClient';
import type { PendingTrainingItem } from '../domain/method/types';

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

vi.mock('../infra/storage/appData', async (importOriginal) => {
  const original = await importOriginal<typeof import('../infra/storage/appData')>();
  return {
    ...original,
    loadAllPendingItems: vi.fn(),
    savePendingItem: vi.fn(),
  };
});

async function importFreshView() {
  const clientModule = await import('../infra/lichess/autopsyClient');
  const appDataModule = await import('../infra/storage/appData');
  const { AutopsyView } = await import('./AutopsyView');
  const fetchGameForAutopsy = vi.mocked(clientModule.fetchGameForAutopsy);
  const loadAllPendingItems = vi.mocked(appDataModule.loadAllPendingItems);
  const savePendingItem = vi.mocked(appDataModule.savePendingItem);
  // `vi.resetModules()` no afterEach recarrega o módulo, mas o mock em si
  // (criado uma vez pela factory de `vi.mock`) persiste entre módulos
  // recarregados dentro do MESMO arquivo de teste — limpamos chamadas
  // manualmente para garantir isolamento entre `it`s.
  fetchGameForAutopsy.mockClear();
  loadAllPendingItems.mockReset();
  loadAllPendingItems.mockResolvedValue([]);
  savePendingItem.mockReset();
  savePendingItem.mockResolvedValue(undefined);
  return { AutopsyView, fetchGameForAutopsy, loadAllPendingItems, savePendingItem };
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

  it('GRUPO TAGS: mostra a linha do Tavarez ligando ao currículo quando o tema é detectado com confidence high (mate-in-1)', async () => {
    const gameWithMateIn1Best = {
      id: 'tag00001',
      // 1.e4 e5 2.Qh5 Nc6 3.Bc4 Nf6 chega exatamente na posição do fixture
      // MATE_IN_1_POSITIVE[0] (spike D1) com as brancas a jogar — fenBefore
      // do ply 7 é 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w
      // KQkq - 4 4'. As brancas jogam 4.d3?? (perdendo o mate) em vez do
      // Qxf7# marcado como `best`/judgment — validado via chessops
      // (isLegal + isCheckmate) antes de commitar.
      moves: 'e4 e5 Qh5 Nc6 Bc4 Nf6 d3',
      players: {
        white: { user: { name: 'AlunoBranco' } },
        black: { user: { name: 'RivalPreto' } },
      },
      analysis: [
        { eval: 20 },
        { eval: 15 },
        { eval: 25 },
        { eval: 10 },
        { eval: 30 },
        { eval: 40 },
        {
          eval: -900,
          judgment: { name: 'Blunder', comment: 'Deixa passar o mate em Qxf7#.' },
          best: 'h5f7',
        },
      ],
    };
    const { AutopsyView, fetchGameForAutopsy } = await importFreshView();
    fetchGameForAutopsy.mockResolvedValue(mockOk(gameWithMateIn1Best, 'tag00001'));

    render(<AutopsyView lichessUsername="AlunoBranco" />);

    fireEvent.change(screen.getByLabelText(/Link ou ID da partida/i), {
      target: { value: 'tag00001' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Fazer autópsia/i }));

    await waitFor(() => {
      expect(screen.getByText(/Capote/i)).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Isso tem cara de mate em 1\. Eu conheço esse padrão — está no seu currículo\./i),
    ).toBeInTheDocument();
  });

  it('GRUPO TAGS: NÃO mostra a linha do Tavarez quando nenhum tema high foi detectado', async () => {
    const { AutopsyView, fetchGameForAutopsy } = await importFreshView();
    fetchGameForAutopsy.mockResolvedValue(mockOk(GAME_WITH_JUDGMENTS, 'abcd1234'));

    render(<AutopsyView lichessUsername="AlunoBranco" />);

    fireEvent.change(screen.getByLabelText(/Link ou ID da partida/i), {
      target: { value: 'abcd1234' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Fazer autópsia/i }));

    await waitFor(() => {
      expect(screen.getByText(/Capote/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/Isso tem cara de/i)).not.toBeInTheDocument();
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

  describe('Treinar estes erros (GRUPO A2, 2026-07-02)', () => {
    async function renderWithCards(AutopsyView: typeof import('./AutopsyView').AutopsyView) {
      render(<AutopsyView />);

      fireEvent.change(screen.getByLabelText(/Link ou ID da partida/i), {
        target: { value: 'abcd1234' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Fazer autópsia/i }));

      fireEvent.click(await screen.findByRole('button', { name: /Eu joguei de brancas/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Treinar estes erros|Já agendado/i })).toBeInTheDocument();
      });
    }

    it('clicar "Treinar estes erros" injeta os itens e mostra a confirmação honesta', async () => {
      const { AutopsyView, fetchGameForAutopsy, savePendingItem } = await importFreshView();
      fetchGameForAutopsy.mockResolvedValue(mockOk(GAME_WITH_JUDGMENTS, 'abcd1234'));

      await renderWithCards(AutopsyView);

      fireEvent.click(screen.getByRole('button', { name: /Treinar estes erros/i }));

      await waitFor(() => {
        expect(savePendingItem).toHaveBeenCalledTimes(1);
      });

      const savedItem = savePendingItem.mock.calls[0]?.[0] as PendingTrainingItem;
      expect(savedItem).toMatchObject({
        origin: 'game-review',
        source: 'autopsy',
        methodTrackId: 'pending-review',
        gameId: 'abcd1234',
        ply: 5,
      });

      await waitFor(() => {
        expect(
          screen.getByText(/Agendei\. Eles voltam em 1 dia — e eu pergunto de novo antes de mostrar a resposta\./i),
        ).toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: /Já agendado/i })).toBeDisabled();
    });

    it('reinjeção (mesma partida já agendada no storage) mostra "Já agendado" sem duplicar', async () => {
      const { AutopsyView, fetchGameForAutopsy, loadAllPendingItems, savePendingItem } = await importFreshView();
      fetchGameForAutopsy.mockResolvedValue(mockOk(GAME_WITH_JUDGMENTS, 'abcd1234'));
      loadAllPendingItems.mockResolvedValue([
        {
          id: 'pending-autopsy-abcd1234-5-existing',
          origin: 'game-review',
          title: 'Capote no lance 3: d4',
          weaknessTag: 'blunder-rate',
          methodTrackId: 'pending-review',
          source: 'autopsy',
          gameId: 'abcd1234',
          ply: 5,
          prompt: 'Antes de ver a resposta: o que você jogaria aqui?',
          dueAt: '2026-07-03',
          attempts: 0,
          status: 'open',
          createdAt: '2026-07-02T00:00:00.000Z',
          updatedAt: '2026-07-02T00:00:00.000Z',
        } satisfies PendingTrainingItem,
      ]);

      await renderWithCards(AutopsyView);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Já agendado/i })).toBeDisabled();
      });
      expect(
        screen.getByText(/Agendei\. Eles voltam em 1 dia — e eu pergunto de novo antes de mostrar a resposta\./i),
      ).toBeInTheDocument();
      expect(savePendingItem).not.toHaveBeenCalled();
    });
  });

  describe('lembrete de backup (GRUPO A3, 2026-07-02)', () => {
    async function renderAndSchedule(AutopsyView: typeof import('./AutopsyView').AutopsyView, props = {}) {
      render(<AutopsyView {...props} />);

      fireEvent.change(screen.getByLabelText(/Link ou ID da partida/i), {
        target: { value: 'abcd1234' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Fazer autópsia/i }));

      fireEvent.click(await screen.findByRole('button', { name: /Eu joguei de brancas/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Treinar estes erros|Já agendado/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Treinar estes erros/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Já agendado/i })).toBeDisabled();
      });
    }

    it('não mostra o lembrete de backup antes de agendar', async () => {
      const { AutopsyView, fetchGameForAutopsy } = await importFreshView();
      fetchGameForAutopsy.mockResolvedValue(mockOk(GAME_WITH_JUDGMENTS, 'abcd1234'));

      render(<AutopsyView />);
      fireEvent.change(screen.getByLabelText(/Link ou ID da partida/i), {
        target: { value: 'abcd1234' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Fazer autópsia/i }));
      fireEvent.click(await screen.findByRole('button', { name: /Eu joguei de brancas/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Treinar estes erros/i })).toBeInTheDocument();
      });

      expect(screen.queryByText(/Seu progresso fica só neste aparelho/i)).not.toBeInTheDocument();
    });

    it('após agendar, mostra o lembrete de backup com link para Ajustes', async () => {
      const { AutopsyView, fetchGameForAutopsy } = await importFreshView();
      fetchGameForAutopsy.mockResolvedValue(mockOk(GAME_WITH_JUDGMENTS, 'abcd1234'));
      const onNavigateToSettings = vi.fn();

      await renderAndSchedule(AutopsyView, { onNavigateToSettings });

      expect(screen.getByText(/Seu progresso fica só neste aparelho/i)).toBeInTheDocument();
      const settingsLink = screen.getByRole('button', { name: /Ajustes → Dados/i });
      expect(settingsLink).toBeInTheDocument();

      fireEvent.click(settingsLink);
      expect(onNavigateToSettings).toHaveBeenCalledTimes(1);
    });

    it('sem onNavigateToSettings, ainda mostra o texto do lembrete (sem link clicável)', async () => {
      const { AutopsyView, fetchGameForAutopsy } = await importFreshView();
      fetchGameForAutopsy.mockResolvedValue(mockOk(GAME_WITH_JUDGMENTS, 'abcd1234'));

      await renderAndSchedule(AutopsyView);

      expect(screen.getByText(/Seu progresso fica só neste aparelho/i)).toBeInTheDocument();
      expect(screen.getByText(/Faça um backup em Ajustes → Dados\./i)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Ajustes → Dados/i })).not.toBeInTheDocument();
    });
  });

  describe('sinal de pressão de relógio (GRUPO CLOCKS, 2026-07-02)', () => {
    it('mostra o badge de pressão de tempo quando o relógio de quem errou estava abaixo de 20s', async () => {
      const { AutopsyView, fetchGameForAutopsy } = await importFreshView();
      fetchGameForAutopsy.mockResolvedValue(mockOk(GAME_WITH_CLOCKS_WHITE_TIME_PRESSURE, 'clok0001'));

      render(<AutopsyView />);

      fireEvent.change(screen.getByLabelText(/Link ou ID da partida/i), {
        target: { value: 'clok0001' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Fazer autópsia/i }));

      fireEvent.click(await screen.findByRole('button', { name: /Eu joguei de brancas/i }));

      await waitFor(() => {
        expect(screen.getByText(/Você tinha 15s no relógio/i)).toBeInTheDocument();
      });
      expect(screen.getByText(/parte do erro é gestão de tempo, não só tática/i)).toBeInTheDocument();
    });

    it('não mostra o badge quando o relógio de quem errou estava confortável (>= 20s)', async () => {
      const { AutopsyView, fetchGameForAutopsy } = await importFreshView();
      fetchGameForAutopsy.mockResolvedValue(mockOk(GAME_WITH_CLOCKS_WHITE_NO_PRESSURE, 'clok0002'));

      render(<AutopsyView />);

      fireEvent.change(screen.getByLabelText(/Link ou ID da partida/i), {
        target: { value: 'clok0002' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Fazer autópsia/i }));

      fireEvent.click(await screen.findByRole('button', { name: /Eu joguei de brancas/i }));

      await waitFor(() => {
        expect(screen.getByText(/Lance 3 \(brancas\): d4/i)).toBeInTheDocument();
      });
      expect(screen.queryByText(/no relógio — parte do erro é gestão de tempo/i)).not.toBeInTheDocument();
    });

    it('sem clocks no export (GAME_WITH_JUDGMENTS), o badge não aparece', async () => {
      const { AutopsyView, fetchGameForAutopsy } = await importFreshView();
      fetchGameForAutopsy.mockResolvedValue(mockOk(GAME_WITH_JUDGMENTS, 'abcd1234'));

      render(<AutopsyView />);

      fireEvent.change(screen.getByLabelText(/Link ou ID da partida/i), {
        target: { value: 'abcd1234' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Fazer autópsia/i }));

      fireEvent.click(await screen.findByRole('button', { name: /Eu joguei de brancas/i }));

      await waitFor(() => {
        expect(screen.getByText(/Lance 3 \(brancas\): d4/i)).toBeInTheDocument();
      });
      expect(screen.queryByText(/no relógio — parte do erro é gestão de tempo/i)).not.toBeInTheDocument();
    });
  });
});
