type EpistemicBadgeProps = {
  // Rótulo curto e honesto. Default cobre o caso comum (medição em andamento,
  // nada comprovado); telas específicas podem sobrepor com uma frase mais
  // precisa (ex.: "sem dado suficiente ainda"), sempre no mesmo tom.
  label?: string;
};

// Selo pequeno e reutilizável: lembra, em qualquer superfície que meça o
// método, que a medição está em andamento e não é prova de eficácia. Ver
// docs/specs/falsification-protocol-DECISION.md — postura "tenta se
// falsificar, não se provar".
export function EpistemicBadge({ label = 'medição em andamento — nada comprovado' }: EpistemicBadgeProps) {
  return (
    <span className="epistemic-badge" role="status">
      {label}
    </span>
  );
}
