// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DiplomaAttempt } from '../domain/method/types';
import { DiplomaCelebration } from './DiplomaCelebration';

afterEach(cleanup);
beforeEach(() => {
  localStorage.clear();
});

function passAttempt(sectionId: string): DiplomaAttempt {
  return {
    id: `peao:${sectionId}`,
    diplomaId: 'peao',
    sectionId,
    scorePercent: 95,
    totalItems: 30,
    passed: true,
    source: 'lichess',
    createdAt: '2026-06-20T00:00:00.000Z',
    updatedAt: '2026-06-20T00:00:00.000Z',
  };
}

const peaoPassed: DiplomaAttempt[] = [passAttempt('valor-pecas'), passAttempt('mates-basicos')];

describe('DiplomaCelebration', () => {
  it('celebra um diploma recém-conquistado em tela cheia', () => {
    render(<DiplomaCelebration diplomaAttempts={peaoPassed} />);

    expect(screen.getByRole('dialog', { name: /Diploma conquistado: Diploma do Peão/ })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Diploma do Peão' })).toHaveAttribute('src', '/art/diploma-peao.webp');
  });

  it('fecha ao continuar e não recomemora o mesmo diploma', () => {
    const { rerender } = render(<DiplomaCelebration diplomaAttempts={peaoPassed} />);

    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    rerender(<DiplomaCelebration diplomaAttempts={[...peaoPassed]} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('não celebra quando o diploma ainda não foi conquistado', () => {
    render(<DiplomaCelebration diplomaAttempts={[passAttempt('valor-pecas')]} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('prende o foco: Tab é cancelado dentro do diálogo (B3, a11y)', () => {
    render(<DiplomaCelebration diplomaAttempts={peaoPassed} />);

    const dialog = screen.getByRole('dialog');
    // fireEvent.keyDown devolve false quando o handler chama preventDefault.
    expect(fireEvent.keyDown(dialog, { key: 'Tab' })).toBe(false);
    expect(screen.getByRole('button', { name: 'Continuar' })).toHaveFocus();
  });
});
