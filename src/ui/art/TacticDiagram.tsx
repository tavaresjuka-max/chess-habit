import { useEffect, useRef, useState } from 'react';
import type { WeaknessTag } from '../../domain';
import { getTacticDiagram } from './tacticDiagrams';

const CELL = 40;
const LIGHT = '#f0d9b5';
const DARK = '#b58863';
const ARROW = '#e0701a';

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
            </defs>

            {Array.from({ length: spec.size }, (_, row) =>
              Array.from({ length: spec.size }, (_, col) => (
                <rect
                  key={`${String(col)}-${String(row)}`}
                  x={col * CELL}
                  y={row * CELL}
                  width={CELL}
                  height={CELL}
                  fill={(col + row) % 2 === 0 ? LIGHT : DARK}
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
                fontSize={CELL * 0.82}
                textAnchor="middle"
                dominantBaseline="central"
                fill={piece.side === 'white' ? '#f7f4ee' : '#26221d'}
                stroke={piece.side === 'white' ? '#26221d' : '#f7f4ee'}
                strokeWidth={1.1}
                paintOrder="stroke"
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
