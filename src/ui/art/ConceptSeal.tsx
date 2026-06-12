// Selo de conceito: ilustra uma ideia recorrente (diagnóstico, ritmo, plano…)
// para reduzir texto. Hoje renderiza lucide dentro de um medalhão dourado;
// quando os selos pintados chegarem (prompts/geracao-selos-conceito-2026-06-12.md),
// trocar artReady para true por conceito — o <img> assume no lugar do ícone.

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
  diagnostico: { icon: Search, artReady: false },
  ritmo: { icon: TrendingUp, artReady: false },
  registro: { icon: Feather, artReady: false },
  pendencias: { icon: Mail, artReady: false },
  sessao: { icon: Watch, artReady: false },
  plano: { icon: ScrollText, artReady: false },
  trilha: { icon: Compass, artReady: false },
  habilidades: { icon: Library, artReady: false },
  conquistas: { icon: Medal, artReady: false },
  'linha-base': { icon: Scale, artReady: false },
  trava: { icon: CircleAlert, artReady: false },
  dados: { icon: Vault, artReady: false },
  avaliacao: { icon: Ruler, artReady: false },
  lichess: { icon: Castle, artReady: false },
  essencial: { icon: Settings2, artReady: false },
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
