# M0 - Style Guide: Chess Habit Visual Premium

Status: todos os assets ja existem em `public/art/` como imagens provisorias. M0 e sobre substituir esses arquivos por versoes premium geradas pelo usuario no ChatGPT Plus e integradas no repo.

Regra de ouro: as imagens nao devem conter texto real. O app renderiza textos por cima para manter acessibilidade, traducao e contraste.

## Lemos

Use esta base em todos os prompts do Lemos:

> Lemos, a wise horse chess tutor. Character design: anthropomorphic dark gray horse professor with a long thoughtful face, soft black-gray mane, small round reading glasses, friendly intelligent eyes, wearing a dark forest-green knitted cardigan, cream shirt, and muted gold bow tie. Art style: antique academic storybook illustration, painterly colored pencil and watercolor, soft paper grain, clean composition, no harsh outlines. Color palette: deep forest greens, warm parchment tones (#f5f3ec background family), muted gold accents, dark wood. Always consistent: same horse face, same mane, same glasses, same cardigan, same bow tie.

Consistencia:

- Mesmo cavalo professor em todos os assets: pelagem cinza-escura, crina preta/cinza, oculos pequenos, cardigan verde-escuro e gravata-borboleta dourada.
- Expressoes podem variar, mas o rosto e a silhueta precisam permanecer estaveis.
- Fundo parchment cream `#f5f3ec` ou neutro suave.
- Evitar fundo branco puro, fantasia medieval exagerada, armadura, sombras duras e traco de cartoon moderno.

## Lote 1 - impacto maximo

### `lemos-pose-boas-vindas.webp` - 1024x1024

> [base Lemos] Pose: Lemos standing upright, arms slightly open in a welcoming gesture, warm genuine smile, slightly leaning forward. Mood: welcoming, warm, "come on in". Background: soft parchment, subtle chess board pattern in the distance.

### `lemos-pose-aprovando.webp` - 1024x1024

> [base Lemos] Pose: Lemos giving a firm thumbs up, confident smile, slight nod energy. Mood: approval, "well done", confident. Background: soft glow behind him, parchment.

### `lemos-pose-celebracao.webp` - 1024x1024

> [base Lemos] Pose: Lemos arms raised in celebration, huge grin, one hand holding a small trophy or chess piece (knight). Mood: joyful victory, "you did it!". Background: warm golden light, confetti or sparkles, parchment base.

### `lemos-avatar-medalhao.webp` - 512x512

> [base Lemos] Bust/portrait shot of Lemos, from shoulders up. Framing: circular or oval medallion crop effect. Expression: confident, friendly, direct eye contact. Background: rich dark green (#1f3f36), subtle ornamental border. Style: portrait medallion, slightly more formal than the poses.

## Lote 2 - poses complementares

### `lemos-pose-chamando-de-volta.webp` - 1024x1024

> [base Lemos] Pose: Lemos waving with one hand raised, the other hand gesturing "come here", friendly beckoning smile. Mood: "come back, we miss you", gentle invitation. Background: soft parchment, hint of a chess clock ticking.

### `lemos-pose-pensando.webp` - 1024x1024

> [base Lemos] Pose: Lemos in classic thinking pose - chin resting on one hand, eyes slightly upward, a small chess piece (knight or queen) on the table in front of him. Mood: contemplative, analyzing, focused. Background: dim study light, parchment.

### `lemos-pose-explicando.webp` - 1024x1024

> [base Lemos] Pose: Lemos at a small chalkboard or pointing at a chess diagram, teaching posture, one hand extended pointing, focused but friendly expression. Mood: "let me explain", patient tutor. Background: study room, books visible, parchment tones.

### `loading-lemos.webp` - 512x512

> [base Lemos] Pose: Lemos seated at a small desk, looking at a tiny chess board, hand on chin, thinking. Small hourglass or chess clock nearby. Mood: patient waiting, studying. Background: warm study light, parchment. Style: cozy, calm, patient.

## Lote 3 - diplomas

Conceito geral:

> Medieval parchment diploma/certificate. Style: illuminated manuscript aesthetic, gold leaf accents, ornamental border. Color: aged parchment (#f5f3ec base), deep forest green (#1f3f36) for borders, gold (#c9a227) for decorations. Typography space: large central area for the chess piece icon + title text, leave clean.

### `diploma-peao.webp` - 1024x1024

> [diploma concept] Central icon: a beautiful golden chess pawn piece, rendered with depth and gleam. Border: simple but elegant - vines and pawns repeating. Bottom: space for text "Mestre dos Peoes" (text added in UI).

### `diploma-rei.webp` - 1024x1024

> [diploma concept] Central icon: a majestic golden chess king, ornate crown, gleaming. Border: royal ornamental - fleur-de-lis and kings. Bottom: space for "Mestre do Rei".

### `diploma-torre.webp` - 1024x1024

> [diploma concept] Central icon: a solid golden chess rook/tower, fortress-like. Border: castellated top border, stone texture accent. Bottom: space for "Mestre das Torres".

## Lote 4 - fundos e bilhetes

### `fundo-mesa-dia.webp` - 1792x1024

> A warm medieval study room from above/angle view. A large wooden desk with: an open chess book, a chessboard mid-game, a cup of tea, scattered notes, a quill pen. Lighting: warm golden daylight from a window, dust particles visible. Color: warm ambers, dark woods, parchment whites. Style: detailed painterly illustration, slightly realistic, no characters visible. Aspect: 1792x1024 widescreen landscape.

### `fundo-mesa-noite.webp` - 1792x1024

> Same scene as fundo-mesa-dia but at night. Lighting: warm oil lamp / candlelight, deep shadows, cozy amber glow. The chess book is open to a different page, as if someone has been studying for hours. Color: deeper ambers, near-black wood, warm candlelight pools. Style: same painterly illustration, nighttime atmosphere. Aspect: 1792x1024 widescreen landscape.

### `bilhete-lemos.webp` - about 600x300

> A handwritten note on aged parchment paper. Lemos's handwriting style: neat but warm, medieval-influenced script. Content placeholder: ruled lines on parchment, a small ink stamp of Lemos's fox paw. No actual words needed - just the texture of a personal note. Style: physical note, slightly worn edges.

### `bilhete-lemos-noite.webp` - 600x300

> Same parchment note but on a darker background (night reading). The parchment has slightly warmer/amber tint from candlelight. Same Lemos paw stamp.

## Lote 5 - paginas/documentos UI

### `boas-vindas-placement.webp` - about 800x600

> A chess board seen slightly from above, elegant wooden pieces mid-setup. Surrounding: a parchment frame, feeling of "diagnosis day". Style: warm, inviting, "let's see where you are". No text needed - UI adds text overlay.

### `boletim-semanal.webp` - about 800x600

> A formal parchment document style - a weekly report/bulletin. Decorative header with chess motifs. Body: placeholder lines (not real text), feels like a weekly report. Stamp/seal in corner: a knight or chess piece.

### `pagina-caderno.webp` - about 800x600

> An open notebook page, slightly cream/parchment. Style: college-rule lines but in warm parchment tones. Corner: a small chess piece doodle (like a student would draw). Feels: personal study notes, warm and human.

## Lote 6 - selos gold

Os PNGs existem em `assets/badges-gold/`. Converter em massa para WebP, sem regenerar.

Conceito geral dos selos gold:

> Circular badge/seal design. Style: wax seal or embossed coin aesthetic. Color: rich gold (#c9a227) on dark green (#1f3f36) background. Each seal has: a central icon + ring border with small text/ornament. Style: premium heraldic, slightly 3D embossed look.

## Integracao por lote

Coloque os PNGs recebidos em `entrega/m0/` com os nomes finais, por exemplo `lemos-pose-boas-vindas.png`, e rode:

```powershell
node scripts/integrate-m0-assets.mjs
```

Para integrar um unico arquivo:

```powershell
node scripts/integrate-m0-assets.mjs --only=lemos-pose-boas-vindas
```

Para converter os PNGs de badges:

```powershell
node scripts/integrate-m0-assets.mjs --badges
```

Checklist:

- Converter para `public/art/<nome>.webp`.
- Verificar peso: poses 1024x1024 abaixo de 80 KB; fundos 1792x1024 abaixo de 200 KB; avatares 512x512 abaixo de 40 KB.
- Verificar dimensoes.
- Rodar `npm run build`.
- Fazer check visual em preview desktop e mobile.
- Commitar por lote pequeno, por exemplo `art(m0): add lemos welcome pose premium`.
- Deploy obrigatorio via prebuilt: `vercel build --prod --yes` e `vercel deploy --prebuilt --prod --yes`.

Nota de cache: depois do deploy, o app Android pode precisar do botao "Atualizar agora" quando o service worker detectar novo hash.
