# Auditoria de Arte Premium — 2026-07-02

Varredura do estado atual da arte gerada (`public/art/*.webp`) vs. o que os
componentes React efetivamente renderizam. Objetivo: confirmar a contagem,
mapear consumidores, e listar os gaps residuais com 1 prompt de imagem
premium por gap (sem tocar código nesta auditoria).

## Contagem verificada

```
$ find public -iname "*.webp" -type f | wc -l
59
```

Confere com `docs/design/asset-ledger.md` ("Total em producao: 59 `.webp`
(~2,4 MB) em `public/art/`", varredura de 2026-07-01). **59 confirmado.**

## Componentes que renderizam arte

Mapeamento `.webp` → componente(s) consumidor(es), por busca em `src/`
(`grep -rn "\.webp" src/` cruzado com os usos de cada componente `art/*`):

| Componente | Arquivo | Assets `.webp` renderizados |
|---|---|---|
| `TavarezAvatar` | `src/ui/art/TavarezAvatar.tsx` | `tavarez-avatar-medalhao` |
| `BandaIcon` | `src/ui/art/BandaIcon.tsx` | `banda-1` … `banda-7` (dinâmico) |
| `DiplomaSeal` | `src/ui/art/DiplomaSeal.tsx` | `selo-cera-{peao,cavalo,torre,rei,louro}` (dinâmico por `diplomaId`) |
| `ConceptSeal` | `src/ui/art/ConceptSeal.tsx` | os 16 `selo-*` de seção (dinâmico por `ConceptId`; usado em `CurriculumCard`, `Fold`, `PendingReviewCard`, `PlacementCard`, `Welcome`) |
| `MedalhaIcon` | `src/ui/art/MedalhaIcon.tsx` | `medalha-{calibrado,primeira-hora,retorno-de-ouro,semana-inteira,tratador-pendencias}` |
| `TutorCard` | `src/ui/TutorCard.tsx` | `tavarez-pose-{boas-vindas,chamando-de-volta,aprovando,pensando,explicando}` (dinâmico por fase/feedback) + `selo-cera-cavalo` |
| `TodayHero` | `src/ui/TodayHero.tsx` | `tavarez-hero-retrato` (fixo, sem variante) |
| `Welcome` | `src/ui/Welcome.tsx` | `boas-vindas-placement` |
| `Onboarding` / `App` | `src/ui/Onboarding.tsx`, `src/ui/App.tsx` | `loading-tavarez` |
| `PendingReviewCard` | `src/ui/PendingReviewCard.tsx` | `vazio-pendencias-em-dia` |
| `Today` | `src/ui/Today.tsx` | `vazio-sem-dados` |
| `Progress` | `src/ui/Progress.tsx` | `vazio-sem-treinos`, `diploma-{peao,rei,torre}` (dinâmico), `selo-cera-louro` |
| `DiplomaCelebration` | `src/ui/DiplomaCelebration.tsx` | `diploma-{peao,rei,torre}` (dinâmico) |
| CSS (`src/index.css`) | fundos/texturas de layout, não componente React | `fundo-mesa-dia` (tema base), `fundo-mesa-noite` (`@media all`, sempre ativo — ver gap 3), `textura-couro`, `textura-papel`, `moldura-tutorcard` |
| `TacticDiagram` | `src/ui/art/TacticDiagram.tsx` | **nenhum** — é SVG procedural, não `.webp` (ver gap 1) |

Isso cobre 55 dos 59 arquivos. Os 4 restantes (`bilhete-tavarez.webp`,
`bilhete-tavarez-noite.webp`, `boletim-semanal.webp`,
`tavarez-hero-retrato-noite.webp`) não têm nenhuma referência em `src/**`
(`grep -rn` vazio) — são o gap 2 abaixo.

## Gaps residuais

### Gap 1 (candidato conhecido do prompt) — `TacticDiagram` é SVG, não arte premium

`src/ui/art/TacticDiagram.tsx` desenha o mini-diagrama tático (garfo, cravada,
espeto, ataque descoberto, etc. — ver `src/ui/art/tacticDiagrams.ts` para a
lista canônica) inteiramente em SVG procedural: `<rect>` para casas com
gradiente CSS, `<text>` com glifos Unicode de peça, `<line>`/`<circle>` para
setas/marcas. Zero `.webp`. É o único componente visual do app sem nenhuma
camada de arte gerada.

**Já investigado e documentado antes desta auditoria:**
`docs/design/image-prompts-action-first.md` (seção 2) já testou geração via
IA para estes motivos e encontrou uma limitação real: o gerador é confiável
para garfo/motivos de 1 atacante, mas erra cor e centralização em táticas de
3 peças em linha (cravada, espeto, descoberto, corredor) — decisão registrada
foi **manter o SVG como diagrama oficial** (preciso, sempre correto
pedagogicamente) e usar imagem gerada só como ilustração grande decorativa
complementar, nunca substituindo o SVG nos casos de 3+ peças. O wiring dessa
camada decorativa ficou marcado como trabalho futuro (seção 3 do documento),
não feito até esta data.

Esta auditoria não repete os ~10 prompts já escritos lá (garfo, cravada,
espeto, descoberto, template-mestre com as 3 regras críticas de cor/
centralização/legibilidade). Só acrescenta 1 prompt novo, no mesmo padrão,
para o motivo de exemplo mais comum sem prompt ainda no documento anterior:

**Prompt proposto — `conceito-ataque-duplo.webp` (512×512, thumbnail ~74px):**

> [estética Tavarez, sem o personagem] Small premium illustration of a single
> chess tactic concept, painterly storybook style, soft paper grain, designed
> to read clearly at thumbnail size. A clean wooden chessboard fragment, only
> 3x3 or 4x4 squares, with large bold pieces filling their squares, each
> piece centered precisely within a single board square and sitting flat on
> it, high contrast. Motif: DOUBLE ATTACK — a single LIGHT (cream) knight
> attacking two DARK pieces at once from a fork square, but this time show
> the knight mid-leap (slight motion blur on the hooves) to differentiate
> visually from the plain fork thumbnail. Two gold arrows from the light
> knight to each dark target (a dark rook and a dark bishop). The knight is
> light; both targets are dark — never give the attacker the same color as
> what it attacks. Palette: warm wood board, parchment `#f5f3ec` background,
> muted-gold accents. Minimal or no decorative border. No text, no UI, no
> numbers, no coordinates. Mood: a clean motif from an antique chess manual,
> legible when small.

(Segue as mesmas 3 regras críticas do template-mestre em
`image-prompts-action-first.md:50-68`: cor por peça explícita, centralização
exata na casa, seta do centro-ao-centro. Fallback continua sendo o SVG
`TacticDiagram` enquanto a imagem não existir ou não for aceita na conferência
de cor/centralização.)

### Gap 2 — 4 assets já gerados, nunca integrados a um componente

`bilhete-tavarez.webp`, `bilhete-tavarez-noite.webp`, `boletim-semanal.webp` e
`tavarez-hero-retrato-noite.webp` existem em `public/art/` com conteúdo real
(22–33 KB cada, não placeholders vazios) e têm prompt original documentado em
`docs/design/image-prompts-premium.md:84-101` (então chamados
`bilhete-lemos*`/`boletim-semanal`) — mas nenhum componente em `src/` os
referencia hoje (`grep -rn` sem resultado). Isso não é falta de arte, é falta
de wiring:

- `tavarez-hero-retrato-noite.webp` já tem prompt pronto em
  `docs/design/image-prompts-action-first.md:25-29` (par escuro do retrato
  do herói) — falta só o `TodayHero.tsx` trocar de fonte quando o tema-noite
  estiver ativo. Não requer prompt novo.
- `bilhete-tavarez(.webp|-noite.webp)` e `boletim-semanal.webp` não têm tela
  de destino definida no roadmap atual (nenhum SPEC menciona "bilhete" ou
  "boletim" como feature planejada) — ficam registrados aqui como arte órfã
  à espera de uma feature (ex.: nota pessoal do Tavarez ao final da semana,
  ou o "boletim semanal" mencionado no nome do arquivo). Não é ação deste
  grupo propor a feature; só o registro do gap.

Não é necessário prompt de imagem novo para este gap — a arte já existe. É
puramente um item de backlog de integração (fora do escopo desta auditoria,
que não toca código).

### Gap 3 (observação, não gap de arte) — `fundo-mesa-dia.webp` é inatingível

`src/index.css:126-131` define o fundo `fundo-mesa-dia.webp` no `:root`
base, mas o bloco `@media all { :root { ... } }` em `src/index.css:2859-2924`
(que é *sempre* verdadeiro — decisão do dono 2026-06-21 de forçar o tema
verde-noite sempre, documentada no comentário da linha 2854-2858) sobrescreve
o `background` do `:root` com `fundo-mesa-noite.webp` incondicionalmente.
Não existe toggle de tema no app hoje que alcance o bloco base — logo
`fundo-mesa-dia.webp` nunca é exibido na prática. Não é um gap de arte
faltando (o oposto: sobra uma imagem inatingível) — registrado aqui só para
não ser confundido com um dos 4 do Gap 2 numa auditoria futura. Ação
sugerida (fora de escopo): se não houver plano de reintroduzir tema-dia,
mover para consideração de limpeza de asset morto numa faxina futura.

## Resumo

- **59/59 `.webp` contabilizados**, dos quais 55 têm consumidor confirmado em
  `src/**` e 4 são arte órfã sem wiring (Gap 2, sem ação de prompt — arte já
  existe).
- **1 componente sem nenhuma camada de arte gerada** (`TacticDiagram`,
  Gap 1) — decisão de manter SVG como fonte de verdade pedagógica já tomada
  e documentada; esta auditoria soma 1 prompt novo (`conceito-ataque-duplo`)
  ao lote já existente em `image-prompts-action-first.md`.
- **1 observação de asset morto** (`fundo-mesa-dia.webp`, Gap 3) — não é arte
  faltando, é arte inatingível pelo CSS atual; fora do escopo de "arte
  premium faltando" mas registrado para não ser recontado como gap novo.

Nenhum arquivo de código foi alterado nesta auditoria.
