// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LearnerBand } from '../domain';
import { PlacementCard } from './PlacementCard';
import type { PlacementApplication } from './PlacementCard';

afterEach(cleanup);

const currentBand: LearnerBand = '400-800';
const onApplyBand = vi.fn<(placement: PlacementApplication) => Promise<void>>(() => Promise.resolve());

function renderCard(band: LearnerBand = currentBand) {
  return render(
    <PlacementCard
      currentBand={band}
      onApplyBand={onApplyBand}
    />,
  );
}

/** Avança do estado idle para o formulário de perguntas. */
function startQuestionnaire() {
  fireEvent.click(screen.getByRole('button', { name: /Começar avaliação/i }));
}

/** Seleciona uma opção de radio pelo valor (value do input). */
function selectRadio(_name: string, value: string) {
  const input = screen.getByDisplayValue(value);
  fireEvent.click(input);
}

/** Preenche as três perguntas obrigatórias com as opções mais simples. */
function fillMinimalAnswers() {
  selectRadio('placement-experience', 'nunca-joguei');
  selectRadio('placement-tactics', 'nao-sei-nomear');
  selectRadio('placement-endgames', 'nao-sei-mate-simples');
}

describe('PlacementCard — tela inicial (idle)', () => {
  it('exibe o título e a faixa atual', () => {
    renderCard();
    expect(screen.getByText('Avaliação de entrada')).toBeInTheDocument();
    expect(screen.getByText(/Atual: 400-800/)).toBeInTheDocument();
  });

  it('exibe o botão de iniciar avaliação', () => {
    renderCard();
    expect(screen.getByRole('button', { name: /Começar avaliação/i })).toBeInTheDocument();
  });
});

describe('PlacementCard — formulário de perguntas', () => {
  it('exibe as três fieldsets após clicar em iniciar', () => {
    renderCard();
    startQuestionnaire();

    expect(screen.getByText(/experiência com xadrez/i)).toBeInTheDocument();
    expect(screen.getByText('E com táticas?')).toBeInTheDocument();
    expect(screen.getByText('E com finais?')).toBeInTheDocument();
  });

  it('exibe todas as opções de experiência', () => {
    renderCard();
    startQuestionnaire();

    expect(screen.getByDisplayValue('nunca-joguei')).toBeInTheDocument();
    expect(screen.getByDisplayValue('sei-as-regras')).toBeInTheDocument();
    expect(screen.getByDisplayValue('jogo-casual')).toBeInTheDocument();
    expect(screen.getByDisplayValue('jogo-online-regular')).toBeInTheDocument();
    expect(screen.getByDisplayValue('jogo-competitivo')).toBeInTheDocument();
  });

  it('exibe todas as opções de táticas', () => {
    renderCard();
    startQuestionnaire();

    expect(screen.getByDisplayValue('nao-sei-nomear')).toBeInTheDocument();
    expect(screen.getByDisplayValue('reconheco-basicos')).toBeInTheDocument();
    expect(screen.getByDisplayValue('resolvo-rotineiro')).toBeInTheDocument();
    expect(screen.getByDisplayValue('resolvo-avancado')).toBeInTheDocument();
  });

  it('exibe todas as opções de finais', () => {
    renderCard();
    startQuestionnaire();

    expect(screen.getByDisplayValue('nao-sei-mate-simples')).toBeInTheDocument();
    expect(screen.getByDisplayValue('sei-mates-basicos')).toBeInTheDocument();
    expect(screen.getByDisplayValue('sei-finais-peao')).toBeInTheDocument();
    expect(screen.getByDisplayValue('sei-finais-torre')).toBeInTheDocument();
  });

  it('exibe o campo opcional de rating', () => {
    renderCard();
    startQuestionnaire();

    expect(screen.getByPlaceholderText(/ex.: 850/i)).toBeInTheDocument();
  });

  it('o botão "Ver sugestão" fica desabilitado enquanto não há respostas completas', () => {
    renderCard();
    startQuestionnaire();

    const submitBtn = screen.getByRole('button', { name: /Ver sugestão de faixa/i });
    expect(submitBtn).toBeDisabled();
  });

  it('o botão "Ver sugestão" fica desabilitado com apenas experiência preenchida', () => {
    renderCard();
    startQuestionnaire();

    selectRadio('placement-experience', 'sei-as-regras');

    expect(screen.getByRole('button', { name: /Ver sugestão de faixa/i })).toBeDisabled();
  });

  it('o botão "Ver sugestão" fica habilitado ao responder as três perguntas', () => {
    renderCard();
    startQuestionnaire();

    fillMinimalAnswers();

    expect(screen.getByRole('button', { name: /Ver sugestão de faixa/i })).not.toBeDisabled();
  });

  it('o botão Cancelar retorna à tela inicial', () => {
    renderCard();
    startQuestionnaire();
    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));

    expect(screen.getByRole('button', { name: /Começar avaliação/i })).toBeInTheDocument();
  });
});

describe('PlacementCard — resultado (perfil iniciante sem rating)', () => {
  beforeEach(() => {
    onApplyBand.mockClear();
    renderCard();
    startQuestionnaire();
    fillMinimalAnswers();
    fireEvent.click(screen.getByRole('button', { name: /Ver sugestão de faixa/i }));
  });

  it('exibe sugestão de faixa com nível de confiança', () => {
    // Sem rating + respostas mínimas → banda 0-400 (score ~150) confiança baixa
    expect(screen.getByText(/Sugestão: começar na faixa/i)).toBeInTheDocument();
    expect(screen.getByText(/confiança baixa/i)).toBeInTheDocument();
  });

  it('exibe os motivos da sugestão', () => {
    expect(screen.getByText(/respostas sobre experiência, tática e finais/i)).toBeInTheDocument();
  });

  it('exibe o link para calibração com puzzles', () => {
    expect(screen.getByRole('button', { name: /Abrir puzzles de calibração/i })).toBeInTheDocument();
  });

  it('exibe as opções de autoavaliação de calibração', () => {
    expect(screen.getByRole('button', { name: /Acertei quase todos/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Acertei mais da metade/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Acertei menos da metade/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Acertei quase nenhum/i })).toBeInTheDocument();
  });

  it('chama onApplyBand com band e calibrated=false ao aplicar sem calibração', async () => {
    const applyBtn = screen.getByRole('button', { name: /Usar a faixa/i });
    fireEvent.click(applyBtn);

    await vi.waitFor(() => {
      expect(onApplyBand).toHaveBeenCalledTimes(1);
    });

    const arg = onApplyBand.mock.calls[0]?.[0];
    expect(arg).toBeDefined();
    expect(arg?.band).toBe('0-400');
    expect(arg?.calibrated).toBe(false);
    expect(arg?.confidence).toBe('low');
  });

  it('"Refazer perguntas" retorna ao formulário', () => {
    fireEvent.click(screen.getByRole('button', { name: /Refazer perguntas/i }));
    expect(screen.getByRole('button', { name: /Ver sugestão de faixa/i })).toBeInTheDocument();
  });
});

describe('PlacementCard — resultado com calibração (autorrelato)', () => {
  beforeEach(() => {
    onApplyBand.mockClear();
    renderCard();
    startQuestionnaire();
    fillMinimalAnswers();
    fireEvent.click(screen.getByRole('button', { name: /Ver sugestão de faixa/i }));
  });

  it('esconde opções de calibração após autorrelato', () => {
    fireEvent.click(screen.getByRole('button', { name: /Acertei quase nenhum/i }));

    expect(screen.queryByRole('button', { name: /Acertei quase nenhum/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Abrir puzzles de calibração/i })).not.toBeInTheDocument();
  });

  it('chama onApplyBand com calibrated=true após autorrelato', async () => {
    fireEvent.click(screen.getByRole('button', { name: /Acertei mais da metade/i }));
    fireEvent.click(screen.getByRole('button', { name: /Usar a faixa/i }));

    await vi.waitFor(() => {
      expect(onApplyBand).toHaveBeenCalledTimes(1);
    });

    const arg = onApplyBand.mock.calls[0]?.[0];
    expect(arg?.calibrated).toBe(true);
  });
});

describe('PlacementCard — caminho com rating conhecido', () => {
  beforeEach(() => {
    onApplyBand.mockClear();
  });

  it('inclui o rating na sugestão e mostra confiança média', () => {
    renderCard();
    startQuestionnaire();
    fillMinimalAnswers();

    const ratingInput = screen.getByPlaceholderText(/ex.: 850/i);
    fireEvent.change(ratingInput, { target: { value: '1100' } });

    fireEvent.click(screen.getByRole('button', { name: /Ver sugestão de faixa/i }));

    // Com rating 1100 (peso 70%) + score ~150 (peso 30%): estimate ~815 → banda 800-1000
    expect(screen.getByText(/Sugestão: começar na faixa/i)).toBeInTheDocument();
    expect(screen.getByText(/confiança média/i)).toBeInTheDocument();
    expect(screen.getByText(/rating online que você informou/i)).toBeInTheDocument();
  });

  it('chama onApplyBand com a faixa calculada a partir do rating', async () => {
    renderCard();
    startQuestionnaire();
    fillMinimalAnswers();

    const ratingInput = screen.getByPlaceholderText(/ex.: 850/i);
    fireEvent.change(ratingInput, { target: { value: '1100' } });

    fireEvent.click(screen.getByRole('button', { name: /Ver sugestão de faixa/i }));
    fireEvent.click(screen.getByRole('button', { name: /Usar a faixa/i }));

    await vi.waitFor(() => {
      expect(onApplyBand).toHaveBeenCalledTimes(1);
    });

    const arg = onApplyBand.mock.calls[0]?.[0];
    expect(arg?.band).toBe('800-1000');
    expect(arg?.confidence).toBe('medium');
    expect(arg?.calibrated).toBe(false);
  });

  it('ignora rating inválido (letras) e cai no caminho sem rating', () => {
    renderCard();
    startQuestionnaire();
    fillMinimalAnswers();

    const ratingInput = screen.getByPlaceholderText(/ex.: 850/i);
    fireEvent.change(ratingInput, { target: { value: 'abc' } });

    fireEvent.click(screen.getByRole('button', { name: /Ver sugestão de faixa/i }));

    expect(screen.getByText(/confiança baixa/i)).toBeInTheDocument();
  });

  it('ignora rating zero e cai no caminho sem rating', () => {
    renderCard();
    startQuestionnaire();
    fillMinimalAnswers();

    const ratingInput = screen.getByPlaceholderText(/ex.: 850/i);
    fireEvent.change(ratingInput, { target: { value: '0' } });

    fireEvent.click(screen.getByRole('button', { name: /Ver sugestão de faixa/i }));

    expect(screen.getByText(/confiança baixa/i)).toBeInTheDocument();
  });
});

describe('PlacementCard — hideHeading=true', () => {
  it('não renderiza o h2 quando hideHeading está ativo', () => {
    render(
      <PlacementCard
        currentBand="800-1000"
        onApplyBand={onApplyBand}
        hideHeading={true}
      />,
    );

    expect(screen.queryByRole('heading', { name: /Avaliação de entrada/i })).not.toBeInTheDocument();
  });

  it('ainda exibe o botão de iniciar quando hideHeading está ativo', () => {
    render(
      <PlacementCard
        currentBand="800-1000"
        onApplyBand={onApplyBand}
        hideHeading={true}
      />,
    );

    expect(screen.getByRole('button', { name: /Começar avaliação/i })).toBeInTheDocument();
  });
});
