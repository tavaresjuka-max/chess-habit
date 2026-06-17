import { useState, type ReactNode } from 'react';
import { ConceptSeal, type ConceptId } from './art/ConceptSeal';

type FoldProps = {
  concept: ConceptId;
  title: string;
  meta?: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

// Dobra do caderno: a seção abre fechada — só o selo, o título e um número.
// Expande no lugar (details nativo), sem carregar nada novo.
// O estado aberto/fechado é do usuário: defaultOpen vale só na montagem,
// e re-renders (ex.: tick do timer) não desfazem o toque.
export function Fold({ concept, title, meta, defaultOpen = false, children }: FoldProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <details
      className="fold"
      open={open}
      onToggle={(event) => {
        setOpen(event.currentTarget.open);
      }}
    >
      <summary className="fold-summary">
        <ConceptSeal concept={concept} size={26} />
        <span className="fold-title">{title}</span>
        {meta !== undefined ? <span className="fold-meta">{meta}</span> : null}
      </summary>
      <div className="fold-body">{children}</div>
    </details>
  );
}
