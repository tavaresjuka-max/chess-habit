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

### Estratégia (validada no lote de teste 2026-06-30)

O gerador é confiável para: **retratos** e **motivos de 1 atacante** (garfo = cavalo branco
atacando 2 alvos pretos — saiu perfeito). É NÃO-confiável para táticas de **3 peças numa
linha** (cravada, espeto, descoberto, mate do corredor): inverte cor ou borra a composição,
mesmo com prompt apertado. Recomendação:
- **Garfo + qualquer motivo de 1 atacante:** pode usar imagem gerada (conferir cor/centralização).
- **Cravada / espeto / descoberto / corredor:** usar o **SVG `TacticDiagram`** (preciso, sempre
  certo) como o diagrama; imagem gerada só como ilustração GRANDE decorativa, não como o diagrama exato.

### ⚠️ Regras CRÍTICAS de cor e posição (o gerador erra isto — repita em todo prompt)

1. **Cor = lado.** Use o vocabulário de xadrez **"white" e "black"** (o gerador mapeia
   muito melhor que "claro/escuro"). As peças ATACANTES (as que executam o golpe) são
   TODAS **white (ivory)**. As peças do OPONENTE — sempre o rei alvo, e qualquer peça
   defendida/atacada — são TODAS **black**. **Nunca** pinte uma peça atacante da mesma cor
   da peça que ela ataca. Atribua a cor PEÇA POR PEÇA no prompt, ex.: "a white rook and a
   white bishop attacking a black king" — e repita "the rook is white, NOT black".
2. **Centralização.** Cada peça fica EXATAMENTE no centro de UMA casa do tabuleiro —
   nunca entre casas, nunca sobre a linha, nunca flutuando. "each piece centered
   precisely within a single board square, sitting flat on it".
3. **Setas.** Seta dourada parte do CENTRO da peça atacante até o CENTRO da casa alvo,
   seguindo a linha/coluna/diagonal real do movimento.
4. **Legibilidade em miniatura (o thumbnail é exibido ~74px).** O desenho TEM de ler
   pequeno: tabuleiro **3x3 ou 4x4 no máximo**, peças GRANDES e bold preenchendo as
   casas, alto contraste, **sem a moldura ornamentada** (a moldura parchment verde/ouro
   é para arte GRANDE de recompensa/capa, NÃO para estes thumbnails pequenos). "minimal
   border, large bold pieces, high contrast, reads clearly at thumbnail size".
   Se a intenção for uma ilustração GRANDE (capa/recompensa), aí sim pode 5x5 + moldura.

Template-mestre (aplique a TODOS os conceitos, sempre com as 3 regras acima):

> [estética Tavarez, sem o personagem] Small premium illustration of a single chess
> tactic concept, painterly storybook style, soft paper grain, designed to read clearly at
> thumbnail size. A clean wooden chessboard fragment, only **3x3 or 4x4 squares**, with
> **large bold pieces** filling their squares, each piece centered precisely within a single
> board square and sitting flat on it, high contrast. The attacking pieces are light
> cream/ivory; the enemy king and any target piece are dark/black — never give an attacking
> piece the same color as the piece it attacks. An elegant hand-drawn gold arrow from the
> center of the attacking piece to the center of the target square, following the real line
> of movement. Palette: warm wood board, parchment `#f5f3ec` background, muted-gold accents.
> **Minimal or no decorative border.** No text, no UI, no numbers, no coordinates. Mood: a
> clean motif from an antique chess manual, legible when small.

Gerar um por conceito do set `TacticDiagram` (ver `src/ui/art/TacticDiagram.tsx`
para a lista canônica). Saída quadrada, fundo transparente ou parchment. **Sempre
conferir cor (atacante claro / rei escuro) e centralização antes de aceitar — regerar se errar.**

### `conceito-garfo.webp` — 512x512
> [template conceito] Motif: FORK — a single LIGHT (cream) knight attacking two DARK pieces at once: a dark king and a dark rook. Two gold arrows from the light knight to each dark target. The knight is light; both targets are dark.

### `conceito-cravada.webp` — 512x512
> [template conceito] Motif: PIN — a LIGHT (cream) bishop pinning a DARK knight against the DARK king on one diagonal. Gold line along the diagonal from the light bishop through the dark knight to the dark king. Attacker light; knight and king dark.

### `conceito-espeto.webp` — 512x512
> [template conceito] Motif: SKEWER — a LIGHT (cream) rook on a file; in front a DARK king, behind it a DARK queen on the same file. Gold arrow along the file from the light rook through the dark king to the dark queen. Attacker light; king and queen dark.

### `conceito-descoberto.webp` — 512x512
> [template conceito] Motif: DISCOVERED ATTACK — a LIGHT (cream) bishop and a LIGHT (cream) rook are the SAME side (both light). The light bishop steps off the file, unveiling the light rook's attack on the DARK king at the top of the file. The rook and bishop are BOTH light (they attack together); the king is dark. One gold arrow up the file from the light rook to the dark king (the revealed attack) and one short gold arrow showing the light bishop stepping aside. Do NOT color the rook dark — it is on the attacking side with the bishop.

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
