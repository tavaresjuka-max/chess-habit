// Professor Lemos — mascote original em flat geométrico (clean-room).
// Cores via tokens CSS: o avatar acompanha o tema claro/escuro sozinho.

type LemosAvatarProps = {
  size?: number;
  className?: string;
};

export function LemosAvatar({ size = 44, className }: LemosAvatarProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Professor Lemos"
    >
      {/* Medalhão */}
      <circle cx="32" cy="32" r="31" fill="var(--green-050, #f0f6f2)" stroke="var(--line, #d9d4c6)" strokeWidth="1.5" />

      {/* Cabeça de cavalo (perfil, voltada à esquerda) */}
      <path
        d="M17 55
           H47
           V50
           L42 47
           C47.5 42 50.5 35.5 50.5 28
           C50.5 15.5 40 7.5 27 8
           L21.5 15.5
           L27.5 18
           C18.5 23 13 31.5 13 40.5
           L20 43.5
           C21.5 37 25.5 32.5 30.5 31.5
           L26 47
           L21 50
           Z"
        fill="var(--green-700, #1f3f36)"
      />

      {/* Orelha */}
      <path d="M31 8 L36.5 2.5 L40 10 Z" fill="var(--green-700, #1f3f36)" />

      {/* Crina (detalhe) */}
      <path
        d="M44 14 C48 18 50 23 50 28 C50 33 48.5 37.5 45.5 41 L43 39 C45.5 36 46.8 32.3 46.8 28 C46.8 24 45.5 20 43 17 Z"
        fill="var(--green-900, #122a22)"
        opacity="0.55"
      />

      {/* Óculos redondos de professor */}
      <g stroke="var(--surface, #fffdf9)" strokeWidth="2.4" fill="none">
        <circle cx="31" cy="23.5" r="5.2" />
        <circle cx="43.5" cy="21.5" r="5.2" />
        <path d="M36.2 23 L38.4 22.4" />
      </g>

      {/* Olho atento atrás da lente */}
      <circle cx="31.6" cy="23.5" r="1.7" fill="var(--surface, #fffdf9)" />

      {/* Gravata-borboleta âmbar */}
      <g fill="var(--gold-300, #d6c48b)">
        <path d="M24.5 46.5 L32 50 L24.5 53.5 Z" />
        <path d="M39.5 46.5 L32 50 L39.5 53.5 Z" />
        <circle cx="32" cy="50" r="1.8" fill="var(--gold-600, #7a5b16)" />
      </g>
    </svg>
  );
}
