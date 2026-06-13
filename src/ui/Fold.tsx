import { useEffect, useRef, type ReactNode } from 'react';
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
// O estado aberto/fechado é do usuário: aplicamos defaultOpen uma única vez
// via ref para o re-render (ex.: tick do timer) não desfazer o toque.
export function Fold({ concept, title, meta, defaultOpen = false, children }: FoldProps) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (defaultOpen && ref.current !== null) {
      ref.current.open = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só na montagem
  }, []);

  return (
    <details ref={ref} className="fold">
      <summary className="fold-summary">
        <ConceptSeal concept={concept} size={26} />
        <h2 className="fold-title">{title}</h2>
        {meta !== undefined ? <span className="fold-meta">{meta}</span> : null}
      </summary>
      <div className="fold-body">{children}</div>
    </details>
  );
}
