// Selo de conceito: ilustra uma ideia recorrente (diagnóstico, ritmo, plano…)
// para reduzir texto. Usa o selo pintado quando disponível e mantém o lucide
// como fallback explícito por conceito.

import {
  Castle,
  CircleAlert,
  Compass,
  Feather,
  Library,
  Mail,
  Medal,
  Ruler,
  Scale,
  ScrollText,
  Search,
  Settings2,
  TrendingUp,
  Vault,
  Watch,
  type LucideIcon,
} from 'lucide-react';

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

const concepts: Record<ConceptId, { icon: LucideIcon; artReady: boolean }> = {
  diagnostico: { icon: Search, artReady: true },
  ritmo: { icon: TrendingUp, artReady: true },
  registro: { icon: Feather, artReady: true },
  pendencias: { icon: Mail, artReady: true },
  sessao: { icon: Watch, artReady: true },
  plano: { icon: ScrollText, artReady: true },
  trilha: { icon: Compass, artReady: true },
  habilidades: { icon: Library, artReady: true },
  conquistas: { icon: Medal, artReady: true },
  'linha-base': { icon: Scale, artReady: true },
  trava: { icon: CircleAlert, artReady: true },
  dados: { icon: Vault, artReady: true },
  avaliacao: { icon: Ruler, artReady: true },
  lichess: { icon: Castle, artReady: true },
  essencial: { icon: Settings2, artReady: true },
};

type ConceptSealProps = {
  concept: ConceptId;
  size?: number;
};

export function ConceptSeal({ concept, size = 28 }: ConceptSealProps) {
  const entry = concepts[concept];

  if (entry.artReady) {
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

  const Icon = entry.icon;

  return (
    <span className="concept-seal" aria-hidden="true" style={{ width: size, height: size }}>
      <Icon size={Math.round(size * 0.56)} strokeWidth={2.2} />
    </span>
  );
}
