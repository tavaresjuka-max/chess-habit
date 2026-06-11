# Pacote Completo de Prompts — Visual Premium Ilustrado (Rotina)

Data: 2026-06-11. Decisões do dono: Lemos = **cavalo antropomórfico professor**;
escopo = **pacote completo**; direção estética = **testar as 3** antes de fechar.

Por isso o pacote é modular: **todo prompt começa com `[ESTILO]`** — substitua pelo
bloco da direção escolhida (seção 1). Os prompts de teste para comparar as direções
estão em `direcao-estetica-premium-2026-06-11.md` §6.

## Fluxo de trabalho

1. **Teste**: cole os 3 prompts de teste, compare, escolha a direção.
2. **Referência mestra**: gere o PROMPT 01 (character sheet do Lemos) com o bloco
   da direção escolhida. Essa imagem vira a referência de TUDO.
3. **Geração com referência**: em todo prompt que tem o Lemos, anexe o character
   sheet como referência de personagem (Midjourney: `--cref URL`; Ideogram/ChatGPT/
   Gemini: anexar imagem + "same character as the reference image"). Para manter o
   estilo nos assets sem personagem, anexe qualquer imagem já aprovada como
   referência de estilo (`--sref` ou "in the same style as the reference image").
4. **Entrega**: traga as imagens aprovadas (PNG, maior resolução disponível).
   Eu corto fundo, converto para WebP, monto pares claro/escuro e integro.

Regras fixas (já embutidas nos prompts): sem texto dentro da imagem, sem marcas,
sem emoji, fundo simples nos sprites (eu removo na integração).

---

## 1. Blocos de estilo (escolher 1 e colar no lugar de [ESTILO])

### BLOCO A — Gabinete do Professor (pintura quente)

```
Painted storybook illustration for adults, digital gouache with visible brush
texture, soft warm lamp lighting, cozy academic atmosphere of an old chess
professor's study. Sophisticated muted palette: deep forest green #1f3f36, warm
cream paper #f5f3ec, antique gold #d6c48b, dark walnut brown, touches of slate
blue #2e4b67. Dignified and warm, never childish, never cartoonish. No text, no
watermark, no logos.
```

### BLOCO B — Atlas Mid-century (editorial texturizado)

```
Mid-century modern editorial illustration, flat stylized shapes with silkscreen
print texture and subtle paper grain, like a refined 1950s book cover. Strictly
limited palette: deep forest green #1f3f36, warm cream #f5f3ec, antique gold
#d6c48b, slate blue #2e4b67. Elegant, calm, adult, generous negative space.
No text, no watermark, no logos.
```

### BLOCO C — A Velha Academia (gravura + dourado)

```
Antique copperplate engraving, fine etched linework with delicate cross-hatching,
19th-century academic ex-libris style, hand-tinted with deep forest green #1f3f36
and antique gold leaf #d6c48b on warm cream paper #f5f3ec. Dignified, scholarly,
formal. No text, no watermark, no logos.
```

> Híbrido recomendado A+C: use o BLOCO A em tudo, exceto nos PROMPTS 14-17
> (medalhas, selos, diplomas, emblemas), que usam o BLOCO C.

---

## 2. O personagem (PROMPTS 01-08)

### PROMPT 01 — Character sheet do Lemos (referência mestra) `--ar 1:1`

```
[ESTILO]
Character design sheet of "Professor Lemos": an elderly, distinguished
anthropomorphic horse, professor of chess. Dark dappled coat, thin round
spectacles, wool cardigan in deep green over a cream shirt, discreet antique-gold
bow tie. Calm, attentive, kind expression of a patient teacher. Sheet shows the
same character three times on a plain cream background: front view standing,
three-quarter view standing, and a close-up bust portrait. Consistent proportions:
gentle posture, slightly stooped with age, expressive eyebrows.
```

### PROMPTS 02-07 — As 6 poses `--ar 1:1` (anexar character sheet como referência)

Cada pose é pareada com um tipo de mensagem do coach já existente no app.
Base comum — cole antes de cada variação:

```
[ESTILO]
"Professor Lemos", the same elderly anthropomorphic horse chess professor as the
reference image (thin round spectacles, deep green wool cardigan, antique-gold
bow tie). Three-quarter view, waist-up, plain cream background, generous negative
space.
```

- **02 Boas-vindas** (mensagem de abertura do dia):
  `He gently gestures toward a chessboard beside him, welcoming the student to
  today's short lesson. Warm, calm smile.`
- **03 Explicando** (por que a tarefa de hoje foi escolhida):
  `He points at a single chess piece held in his hand, explaining its idea with
  focused, patient eyes.`
- **04 Aprovando** (reconhecimento de progresso/método):
  `He nods with quiet approval, one hand resting on his chest, eyes warm and
  proud — restrained, dignified satisfaction.`
- **05 Chamando de volta** (retorno após ausência, sem cobrança):
  `He holds a teapot and two cups beside a chessboard, inviting and serene, as
  if saying "the board waited for you". No reproach in his expression.`
- **06 Pensando** (análise, correção de padrão de erro):
  `He studies a chessboard with a thoughtful hand on his chin, concentrated but
  calm, spectacles slightly lowered.`
- **07 Celebração sóbria** (marco alcançado, diploma):
  `He applauds softly with a proud, restrained smile, a rolled parchment diploma
  tucked under one arm.`

### PROMPT 08 — Avatar medalhão `--ar 1:1` (anexar character sheet)

```
[ESTILO]
Circular medallion portrait of "Professor Lemos", the same elderly anthropomorphic
horse chess professor as the reference image. Head and shoulders only, centered
in a circular composition with a thin antique-gold ring border, deep forest green
background inside the circle, plain cream background outside. Reads clearly at
small sizes.
```

---

## 3. Identidade e fundos (PROMPTS 09-13)

### PROMPT 09 — Ícone do app PWA `--ar 1:1`

```
[ESTILO]
App icon: the noble head of an anthropomorphic horse chess professor with thin
round spectacles, in profile, centered on a deep forest green #1f3f36 background
with a subtle radial warmth at the center. Bold, simple silhouette readable at
32 pixels. The head occupies the central 70% of the square (safe margin all
around for maskable icon). Flat solid background, no border, no text.
```

> Favicon: eu derivo do ícone na integração (recorte monocromático).

### PROMPT 10 — Fundo do gabinete, DIA `--ar 9:16`

```
[ESTILO]
Vertical background illustration of an old chess professor's study in soft
daylight: deep green walls, tall wooden bookshelves with old books, a framed
botanical print, a brass chess clock on a shelf, a leather armchair, warm
morning light from a window. NO people, NO animals. Soft focus and low contrast
overall — designed as a calm app background that text cards will sit on top of.
Detail concentrated at top and bottom edges, quieter center.
```

### PROMPT 11 — Fundo do gabinete, NOITE `--ar 9:16` (anexar o 10 como referência)

```
[ESTILO]
The exact same chess professor's study as the reference image, now at night:
lit only by a warm brass desk lamp and the soft glow of the window moonlight,
deep shadows, cozy and quiet. Same composition, same furniture, same framing.
NO people, NO animals. Low contrast, quiet center, calm app background.
```

### PROMPT 12 — Mesa de estudo vista de cima, DIA `--ar 9:16`

```
[ESTILO]
Top-down view of a chess student's wooden study desk in soft daylight: the edge
of a wooden chessboard with a few pieces, a closed leather notebook, a brass
chess clock, a cup of coffee, a fountain pen, all arranged around the EDGES of
the frame leaving the center area calm and empty for interface cards. NO hands,
NO people. Soft shadows, low contrast, app background.
```

### PROMPT 13 — Mesa de estudo, NOITE `--ar 9:16` (anexar o 12 como referência)

```
[ESTILO]
The exact same top-down study desk as the reference image, now at night under a
single warm desk lamp: pool of warm light, soft deep shadows, the coffee replaced
by a cup of tea with gentle steam. Same composition and framing, calm empty
center. NO hands, NO people.
```

---

## 4. Conquistas e documentos (PROMPTS 14-17) — usar BLOCO C se híbrido

### PROMPT 14 — As 5 medalhas `--ar 1:1` (gerar uma por vez, anexando a 1ª como referência de estilo)

Base comum:

```
[ESTILO]
A single round physical achievement medal with a short ribbon, photographed-style
illustration, centered on a plain cream background. Antique gold rim, deep forest
green ribbon, cream enamel face with the symbol embossed in deep green. Sober,
real, museum-quality — no shine effects, no sparkles. Reads clearly at small size.
The embossed central symbol is:
```

- **14a Retorno de Ouro**: `a circular arrow returning to a single chessboard square.`
- **14b Primeira Hora**: `a minimalist hourglass with a tiny pawn inside the sand.`
- **14c Tratador de Pendências**: `an open padlock above a chessboard square.`
- **14d Semana Inteira**: `a row of five chessboard squares, the last one marked.`
- **14e Calibrado**: `a compass whose needle is a chess knight silhouette.`

> Versão "apagada" (não conquistada): eu gero na integração (dessaturação CSS).

### PROMPT 15 — Os 3 selos de diploma `--ar 1:1` (um por vez, 1º como referência)

Base comum:

```
[ESTILO]
A single round wax seal pressed on cream parchment paper, centered, plain
background. Deep forest green wax with antique gold dusting on the embossed
relief, scalloped irregular wax edge. Dignified and real. The embossed relief is:
```

- **15a Diploma do Peão**: `a noble chess pawn silhouette.`
- **15b Diploma da Torre**: `a chess rook silhouette.`
- **15c Diploma do Rei**: `a chess king silhouette with a simple crown.`

> Versão "em progresso": eu trato na integração (outline/opacidade).

### PROMPT 16 — Diplomas completos `--ar 3:4` (um por vez; texto entra depois via HTML/print)

```
[ESTILO]
An elegant blank chess course diploma on aged cream parchment, portrait
orientation: ornamental engraved border with chess piece motifs in the corners,
a deep green wax seal with gold dusting at the bottom center, a thin gold rule
near the top, and a LARGE EMPTY CENTRAL AREA with no writing at all (text will
be added digitally later). Formal, dignified, 19th-century academy style.
```

- **16a Peão**: `The corner motifs and the seal feature a pawn silhouette.`
- **16b Torre**: `The corner motifs and the seal feature a rook silhouette.`
- **16c Rei**: `The corner motifs and the seal feature a king silhouette.`

### PROMPT 17 — Os 7 emblemas de banda `--ar 1:1` (um por vez, 1º como referência)

Conceito: cada banda do curso é um **volume da biblioteca do professor** — o livro
fica mais rico conforme a banda sobe. Sem números nas lombadas (rótulo fica no app).

Base comum:

```
[ESTILO]
A single antique hardcover book standing upright, three-quarter view, centered
on a plain cream background, photographed-style illustration. Part of a matched
encyclopedia set — same proportions across volumes. No text or numbers anywhere
on the book.
```

- **17a (0-400)**: `Humble volume: worn cream cloth cover, plain spine, a tiny pawn embossed on the front.`
- **17b (400-800)**: `Cream cloth cover with a thin green spine band, a pawn and a small gold dot embossed.`
- **17c (800-1000)**: `Deep green cloth cover, cream spine label area, an embossed knight.`
- **17d (1000-1200)**: `Deep green cover with thin gold rules on the spine, an embossed bishop.`
- **17e (1200-1600)**: `Green leather cover, gold-tooled spine, an embossed rook.`
- **17f (1600-2000)**: `Rich green leather, ornate gold tooling, an embossed queen.`
- **17g (2000-2200)**: `Majestic volume: full green leather with gilded page edges, ornate gold frame, an embossed king with crown.`

---

## 5. Superfícies e molduras (PROMPTS 18-21)

> Aqui a ilustração vira componente: gero a arte, eu fatio (9-slice) e o texto
> continua HTML. Estados de hover/disabled saem por CSS.

### PROMPT 18 — Moldura de botão primário `--ar 2:1`

```
[ESTILO]
An ornamental horizontal plaque or frame, wide rounded-rectangle shape, deep
forest green with a thin antique gold border line, subtle material texture
(leather or lacquered wood depending on style), COMPLETELY EMPTY in the center.
Centered on a plain cream background. Understated and elegant — a button surface,
not a decoration.
```

### PROMPT 19 — Moldura de botão secundário `--ar 2:1`

```
[ESTILO]
The same ornamental horizontal plaque as the reference image, but inverted:
warm cream surface with a thin deep green border line, COMPLETELY EMPTY center,
plain background. Quieter than the primary version.
```

### PROMPT 20 — Moldura "quadro" do TutorCard `--ar 4:3`

```
[ESTILO]
An elegant thin picture frame in dark walnut wood with a delicate antique gold
inner lip, landscape orientation, COMPLETELY EMPTY inside (transparent center
for content), centered on a plain cream background. The frame of a professor's
study — refined, not ornate.
```

### PROMPT 21 — Texturas de superfície de card `--ar 1:1` (2 gerações)

- **21a Papel**: `[ESTILO] Seamless subtle texture of warm cream laid paper #f5f3ec, very low contrast, no objects, no borders — a quiet surface texture for interface cards.`
- **21b Couro**: `[ESTILO] Seamless subtle texture of deep forest green #1f3f36 fine-grain leather, very low contrast, no objects, no borders — a quiet dark surface texture.`

---

## 6. Cenas de apoio (PROMPTS 22-26)

### PROMPT 22 — Loading `--ar 1:1` (anexar character sheet)

```
[ESTILO]
"Professor Lemos", the same anthropomorphic horse chess professor as the
reference image, seen from behind at three-quarter angle, calmly arranging
chess pieces on a board to start the lesson, warm lamp light. Plain cream
background, generous negative space.
```

### PROMPT 23 — Boas-vindas / placement `--ar 4:3` (anexar character sheet)

```
[ESTILO]
"Professor Lemos", the same anthropomorphic horse chess professor as the
reference image, standing beside an empty chair he offers to the viewer, a
chessboard set up on the desk between them, welcoming gesture, warm and
unhurried. The student's seat is empty — the invitation to begin.
```

### PROMPTS 24-26 — Estados vazios `--ar 2:1` (sem personagem)

- **24 Sem treinos ainda**: `[ESTILO] A wooden chessboard seen at a low angle with all pieces in starting position and one cream pawn slightly advanced, soft warm light, plain background, calm and inviting. No people.`
- **25 Sem dados de progresso**: `[ESTILO] A closed leather notebook with a fountain pen resting on it, next to a single chess pawn, soft warm light, plain cream background, quiet still life. No people.`
- **26 Pendências em dia**: `[ESTILO] A paused brass chess clock beside a cup of tea with gentle steam, soft warm light, plain cream background, peaceful still life. No people.`

---

## 7. Checklist de entrega (para o dono)

- [ ] Direção escolhida após os 3 testes: ___
- [ ] 01 character sheet aprovado (é a âncora de tudo — itere até amar)
- [ ] 02-08 poses + avatar
- [ ] 09 ícone
- [ ] 10-13 fundos (pares dia/noite — sempre gerar a noite com o dia anexado)
- [ ] 14a-e medalhas
- [ ] 15a-c selos
- [ ] 16a-c diplomas
- [ ] 17a-g volumes de banda
- [ ] 18-21 molduras e texturas
- [ ] 22-26 cenas de apoio

Total: ~36 imagens. Em todas: maior resolução que a ferramenta der, PNG.
Traga em lotes — integro conforme chegam, começando por personagem + fundos.
