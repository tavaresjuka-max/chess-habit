import { useEffect, useRef, useState } from 'react';
import type { WeaknessTag } from '../../domain';
import { getTacticDiagram } from './tacticDiagrams';

const CELL = 40;
// Estética "Gabinete": madeira quente + seta dourada (casa com o tema papel/tabuleiro).
const ARROW = '#c08a2a';

type TacticDiagramProps = { tag: WeaknessTag | undefined };

/**
 * Mini-diagrama de tabuleiro (estilo A) ilustrando um conceito tático.
 * Sem spec para a tag (ex.: time-trouble) → não renderiza nada.
 * Monta o conteúdo pesado só quando entra na viewport (IntersectionObserver);
 * em ambiente sem IO (jsdom/teste) renderiza direto.
 */
export function TacticDiagram({ tag }: TacticDiagramProps) {
  const spec = getTacticDiagram(tag);
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    if (visible || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const node = ref.current;
    if (node === null) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '120px' },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [visible]);

  if (spec === undefined) {
    return null;
  }

  const px = spec.size * CELL;
  const center = (n: number): number => n * CELL + CELL / 2;

  return (
    <div ref={ref} className="tactic-diagram">
      <svg
        viewBox={`0 0 ${String(px)} ${String(px)}`}
        className="tactic-diagram-svg"
        role="img"
        aria-label={spec.label}
        xmlns="http://www.w3.org/2000/svg"
      >
        {visible ? (
          <>
            <defs>
              <marker id="tactic-arrowhead" markerWidth="6" markerHeight="6" refX="4.5" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill={ARROW} />
              </marker>
              {/* Madeira pintada: gradiente sutil dá profundidade (vs. cor chapada). */}
              <linearGradient id="tactic-sq-light" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#ecdcbb" />
                <stop offset="1" stopColor="#e0cda3" />
              </linearGradient>
              <linearGradient id="tactic-sq-dark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#a78458" />
                <stop offset="1" stopColor="#8d6d47" />
              </linearGradient>
              <filter id="tactic-piece-shadow" x="-25%" y="-25%" width="150%" height="150%">
                <feDropShadow dx="0" dy="1.2" stdDeviation="1.1" floodColor="#241606" floodOpacity="0.45" />
              </filter>
            </defs>

            {Array.from({ length: spec.size }, (_, row) =>
              Array.from({ length: spec.size }, (_, col) => (
                <rect
                  key={`${String(col)}-${String(row)}`}
                  x={col * CELL}
                  y={row * CELL}
                  width={CELL}
                  height={CELL}
                  fill={(col + row) % 2 === 0 ? 'url(#tactic-sq-light)' : 'url(#tactic-sq-dark)'}
                />
              )),
            )}

            {(spec.marks ?? []).map((mark) => (
              <circle
                key={`mark-${String(mark.col)}-${String(mark.row)}`}
                cx={center(mark.col)}
                cy={center(mark.row)}
                r={CELL * 0.38}
                fill="none"
                stroke={ARROW}
                strokeWidth={2}
                strokeDasharray="3 3"
                opacity={0.85}
              />
            ))}

            {spec.arrows.map((arrow, index) => (
              <line
                key={`arrow-${String(index)}`}
                x1={center(arrow.from.col)}
                y1={center(arrow.from.row)}
                x2={center(arrow.to.col)}
                y2={center(arrow.to.row)}
                stroke={ARROW}
                strokeWidth={5}
                strokeLinecap="round"
                markerEnd="url(#tactic-arrowhead)"
                opacity={0.92}
              />
            ))}

            {spec.pieces.map((piece) => (
              <text
                key={`piece-${piece.glyph}-${String(piece.at.col)}-${String(piece.at.row)}`}
                x={center(piece.at.col)}
                y={center(piece.at.row) + CELL * 0.06}
                fontSize={CELL * 0.84}
                textAnchor="middle"
                dominantBaseline="central"
                fill={piece.side === 'white' ? '#f7f1e3' : '#241d15'}
                stroke={piece.side === 'white' ? '#5c4a35' : '#0f0b07'}
                strokeWidth={1.2}
                paintOrder="stroke"
                filter="url(#tactic-piece-shadow)"
              >
                {piece.glyph}
              </text>
            ))}
          </>
        ) : null}
      </svg>
    </div>
  );
}
