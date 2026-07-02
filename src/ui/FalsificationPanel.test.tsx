// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { FalsificationPanel } from './FalsificationPanel';

afterEach(cleanup);

describe('FalsificationPanel', () => {
  it('mostra o selo epistêmico e a explicação do gate duplo em qualquer estado', () => {
    render(<FalsificationPanel gateInput={{}} />);

    expect(screen.getByText('medição em andamento — nada comprovado')).toBeInTheDocument();
    expect(screen.getByText(/testa se o método sobrevive a duas provas/)).toBeInTheDocument();
  });

  it('estado "sem-dados" (relógio não começou / gateInput vazio): texto honesto de placar vazio', () => {
    render(<FalsificationPanel gateInput={{}} />);

    expect(screen.getByText('Em teste')).toBeInTheDocument();
    expect(
      screen.getByText(/ainda não há partidas ou sondas suficientes medidas — o placar começa vazio de propósito/i),
    ).toBeInTheDocument();
  });

  it('estado "aguardando" (dentro da janela de 30 dias) é visualmente distinto de "sem-dados" real', () => {
    render(<FalsificationPanel gateInput={{ daysElapsed: 10 }} />);

    expect(screen.getByText('Em teste')).toBeInTheDocument();
    expect(screen.getByText(/Faltam 20 dia\(s\)/)).toBeInTheDocument();
  });

  it('estado "sem-dados" após 30 dias sem sonda/blunder ainda medidos', () => {
    render(<FalsificationPanel gateInput={{ daysElapsed: 30, adherence: { percent: 80, floorPercent: 40 } }} />);

    expect(screen.getByText('Ainda sem dado suficiente')).toBeInTheDocument();
    expect(screen.getByText(/Ainda falta medir/)).toBeInTheDocument();
  });

  it('estado "nao-avaliavel" quando adesão fica abaixo do piso', () => {
    render(
      <FalsificationPanel
        gateInput={{ daysElapsed: 30, adherence: { percent: 10, floorPercent: 40 } }}
      />,
    );

    expect(screen.getByText('Não avaliável agora')).toBeInTheDocument();
    expect(screen.getByText(/Adesão de 10%/)).toBeInTheDocument();
  });

  it('estado "passou" (mock): ambos os critérios do gate duplo satisfeitos', () => {
    render(
      <FalsificationPanel
        gateInput={{
          daysElapsed: 30,
          adherence: { percent: 80, floorPercent: 40 },
          probe: { accuracyPercent: 80, itemCount: 10 },
          blunder: { ratePost: 1, rateBaseline: 3, baselineGameCount: 20 },
        }}
      />,
    );

    expect(screen.getByText('Não falsificado (até agora)')).toBeInTheDocument();
  });

  it('estado "falsificado" (mock): sonda falha', () => {
    render(
      <FalsificationPanel
        gateInput={{
          daysElapsed: 30,
          adherence: { percent: 80, floorPercent: 40 },
          probe: { accuracyPercent: 40, itemCount: 10 },
          blunder: { ratePost: 1, rateBaseline: 3, baselineGameCount: 20 },
        }}
      />,
    );

    expect(screen.getByText('Falsificado')).toBeInTheDocument();
    expect(screen.getByText(/Sonda de transferência falhou/)).toBeInTheDocument();
  });

  it('não mostra a nota de placar vazio quando o estado é "passou" ou "falsificado"', () => {
    render(
      <FalsificationPanel
        gateInput={{
          daysElapsed: 30,
          adherence: { percent: 80, floorPercent: 40 },
          probe: { accuracyPercent: 80, itemCount: 10 },
          blunder: { ratePost: 1, rateBaseline: 3, baselineGameCount: 20 },
        }}
      />,
    );

    expect(screen.queryByText(/ainda não há partidas ou sondas suficientes medidas/i)).not.toBeInTheDocument();
  });

  it('exibe o sinal secundário (proxy global) somente quando fornecido, com o rótulo de aviso', () => {
    const { rerender } = render(<FalsificationPanel gateInput={{}} />);
    expect(screen.queryByText(/Proxy global — não é prova/)).not.toBeInTheDocument();

    rerender(
      <FalsificationPanel
        gateInput={{}}
        proxySignal={{ correctedDeltaLabel: 'rating subiu 12 pontos (corrigido por RTM)' }}
      />,
    );
    expect(screen.getByText(/Proxy global — não é prova/)).toBeInTheDocument();
    expect(screen.getByText(/rating subiu 12 pontos/)).toBeInTheDocument();
  });
});
