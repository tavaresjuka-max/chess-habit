/**
 * Faixa de acumulação — substitui o contador "X dias seguidos".
 *
 * Tom Professor Tavarez: sóbrio, sem chama, sem cor de alarme, sem números grandes.
 * Dia ativo = bloco preenchido; dia inativo = espaço em branco (contorno).
 * Respeita prefers-reduced-motion (sem animação de enchimento).
 */

type RecentDay = {
  date: string;
  active: boolean;
};

type AccumulationStripProps = {
  recentDays: RecentDay[];
  /** Texto para o aria-label do conjunto (ex.: "12 de 14 dias com treino"). */
  ariaLabel?: string;
};

export function AccumulationStrip({ recentDays, ariaLabel }: AccumulationStripProps) {
  const activeCount = recentDays.filter((d) => d.active).length;
  const total = recentDays.length;
  const label = ariaLabel ?? `${String(activeCount)} de ${String(total)} dias com treino`;

  return (
    <div
      className="accumulation-strip"
      role="img"
      aria-label={label}
    >
      {recentDays.map((day) => (
        <span
          key={day.date}
          className={`accumulation-day${day.active ? ' accumulation-day--active' : ''}`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
