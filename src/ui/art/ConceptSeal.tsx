export type ConceptId =
  | 'diagnostico'
  | 'ritmo'
  | 'registro'
  | 'pendencias'
  | 'sessao'
  | 'plano'
  | 'trilha'
  | 'habilidades'
  | 'conquistas'
  | 'linha-base'
  | 'trava'
  | 'dados'
  | 'avaliacao'
  | 'lichess'
  | 'essencial';

type ConceptSealProps = {
  concept: ConceptId;
  size?: number;
};

export function ConceptSeal({ concept, size = 28 }: ConceptSealProps) {
  return (
    <img
      src={`/art/selo-${concept}.webp`}
      alt=""
      aria-hidden="true"
      className="concept-seal concept-seal-art"
      width={size}
      height={size}
    />
  );
}
