import { useEffect, useRef, useState } from 'react';
import { DIPLOMAS, isDiplomaPassed } from '../domain/method/diplomas';
import type { DiplomaAttempt, DiplomaId } from '../domain/method/types';

// Momento de diploma (council UX 2026-06-20): a conquista vira uma celebração em
// tela cheia, passageira, em vez de mais ruído permanente. Comemora uma vez por
// diploma; o conjunto "já comemorado" mora no localStorage (UI efêmera, como a
// fase do funil). No pior caso (sem localStorage) recomemora uma vez — não quebra.
const CELEBRATED_KEY = 'rotina:celebrated-diplomas';

function readCelebrated(): Set<string> {
  try {
    const raw = localStorage.getItem(CELEBRATED_KEY);

    return new Set(raw === null ? [] : (JSON.parse(raw) as string[]));
  } catch {
    return new Set();
  }
}

function markCelebrated(id: DiplomaId): void {
  try {
    const set = readCelebrated();
    set.add(id);
    localStorage.setItem(CELEBRATED_KEY, JSON.stringify([...set]));
  } catch {
    // Sem localStorage o momento ainda aparece; só pode repetir numa próxima sessão.
  }
}

export function DiplomaCelebration({ diplomaAttempts }: { diplomaAttempts: DiplomaAttempt[] }) {
  const [earned, setEarned] = useState<DiplomaId | undefined>(undefined);
  const continueRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const celebrated = readCelebrated();
    const fresh = DIPLOMAS.find((diploma) => isDiplomaPassed(diplomaAttempts, diploma.id) && !celebrated.has(diploma.id));

    if (fresh !== undefined) {
      setEarned(fresh.id);
    }
  }, [diplomaAttempts]);

  useEffect(() => {
    if (earned !== undefined) {
      continueRef.current?.focus();
    }
  }, [earned]);

  if (earned === undefined) {
    return null;
  }

  const diploma = DIPLOMAS.find((item) => item.id === earned);

  if (diploma === undefined) {
    return null;
  }

  const dismiss = (): void => {
    markCelebrated(earned);
    setEarned(undefined);
  };

  return (
    <div
      className="diploma-celebration"
      role="dialog"
      aria-modal="true"
      aria-label={`Diploma conquistado: ${diploma.title}`}
      onClick={dismiss}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          dismiss();
        } else if (event.key === 'Tab') {
          // Foco preso (B3, council): o diálogo tem um único alvo focável (Continuar).
          event.preventDefault();
          continueRef.current?.focus();
        }
      }}
    >
      <div
        className="diploma-celebration-card"
        onClick={(event) => {
          // Clicar no cartão não fecha; só o fundo (ou o botão) fecha.
          event.stopPropagation();
        }}
      >
        <p className="diploma-celebration-kicker">Diploma conquistado</p>
        <img
          src={`/art/diploma-${earned}.webp`}
          alt={diploma.title}
          className="diploma-celebration-art"
          width={260}
          height={260}
        />
        <h2>{diploma.title}</h2>
        <p>{diploma.description}</p>
        <button ref={continueRef} type="button" onClick={dismiss}>
          Continuar
        </button>
      </div>
    </div>
  );
}
