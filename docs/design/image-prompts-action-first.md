# Prompts premium — elementos do redesign action-first (Fase 5)

Complementa `image-prompts-premium.md` (M0 style guide). Mesma estética: cavalo
professor (persona **Tavarez**), aquarela/colored-pencil de storybook acadêmico,
grão de papel, paleta verde-floresta + parchment `#f5f3ec` + ouro discreto.
Regra de ouro mantida: **imagem não contém texto** — o app renderiza o texto por cima.

Persona Tavarez = o mesmo personagem do `image-prompts-premium.md` (lá ainda
chamado "Lemos"): cavalo cinza-escuro, crina preta/cinza, óculos redondos,
cardigã verde-escuro, gravata-borboleta dourada. Use aquela descrição-base.

---

## 1. Retrato grande do herói (tela Hoje action-first)

A tela Hoje agora abre com a "missão de agora" e um retrato grande do Tavarez
(`TodayHero`, exibido ~120×140 mas serve maior). **Curto-prazo:** reusar as poses
1024² já existentes (`tavarez-pose-boas-vindas.webp` / `tavarez-pose-chamando-de-volta.webp`).
**Premium dedicado (opcional):** um retrato meio-corpo, enquadramento vertical, pensado para o herói.

### `tavarez-hero-retrato.webp` — 768x896 (3:3.5, vertical)

> [base Tavarez] Pose: half-body portrait, Tavarez leaning slightly forward over a study desk corner, one hand resting on a chess knight piece, warm attentive expression as if about to start today's lesson. Framing: vertical, head-and-shoulders-plus, subject occupying upper two-thirds. Background: warm study (deep forest green to parchment), soft depth-of-field, a hint of chessboard and brass lamp glow. Mood: "ready when you are", calm authority. Lighting: warm key light from upper left, premium painterly finish.

### `tavarez-hero-retrato-noite.webp` — 768x896 (variante tema escuro)

> [base Tavarez] Mesma composição do retrato do herói, porém à noite: brass desk
> lamp como fonte principal, fundo verde-escuro profundo `#122a22`, brilho âmbar quente,
> contraste maior. Para o par claro/escuro do app.

---

## 2. Thumbnails de conceito tático (ao lado da missão)

O maior ganho de "tornar a leitura interessante" (pedido do dono 2026-06-29): cada
missão/tema ganha um thumbnail premium do conceito, ao lado do texto no herói e/ou
no cartão de bloco. Hoje o conceito é um diagrama SVG de tabuleiro (`TacticDiagram`,
preciso/pedagógico); este lote é a **camada artística premium** por cima/ao lado dele.

Template-mestre (aplique a TODOS os conceitos):

> [estética Tavarez, sem o personagem] Small premium illustration of a single chess
> tactic concept, painterly storybook style, soft paper grain. A clean wooden chessboard
> fragment (3x3 to 5x5 squares) with 2–3 finely rendered chess pieces showing the motif,
> plus an elegant hand-drawn gold arrow indicating the key move. Palette: warm wood board,
> parchment `#f5f3ec` background, forest-green and muted-gold accents. Composition: centered,
> generous margins, square. No text, no UI, no numbers. Mood: a beautiful diagram from an
> antique chess manual.

Gerar um por conceito do set `TacticDiagram` (ver `src/ui/art/TacticDiagram.tsx`
para a lista canônica). Saída quadrada, fundo transparente ou parchment.

### `conceito-garfo.webp` — 512x512
> [template conceito] Motif: FORK — a knight attacking two pieces at once (e.g. king and rook). Two gold arrows from the knight to both targets.

### `conceito-cravada.webp` — 512x512
> [template conceito] Motif: PIN — a bishop pinning a knight against the king on a diagonal. Gold line along the diagonal.

### `conceito-espeto.webp` — 512x512
> [template conceito] Motif: SKEWER — a rook/queen forcing a valuable piece to move and exposing the piece behind it. Gold arrow through both along the line.

### `conceito-descoberto.webp` — 512x512
> [template conceito] Motif: DISCOVERED ATTACK — a piece moves and unveils an attack from the piece behind it. Two subtle arrows: the moving piece and the revealed line.

> Demais conceitos (espeto duplo, ataque duplo, desvio, atração, raio-x, peão
> passado, mate do corredor, etc.): mesmo template, trocando o motif. Manter a lista
> 1:1 com `TacticDiagram` para o app casar thumbnail ↔ tema.

---

## 3. Wiring (passo de código futuro — NÃO é F5)

Para os thumbnails entrarem no app: mapear `tema do bloco → /art/conceito-<slug>.webp`
e exibir no `TodayHero` (ao lado da missão) e opcionalmente no `PlanBlockCard`.
Fallback para o `TacticDiagram` SVG quando não houver imagem premium do conceito.
Pares claro/escuro só se o thumbnail não ler bem sobre papel escuro (provavelmente
lê — fundo parchment neutro). Isso é trabalho de uma fase de integração, depois
que o dono gerar os assets.
