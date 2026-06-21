# Pacote de prompts — visual premium (Chess Habit)

Gerado 2026-06-21 a partir do council de UX e da análise dos assets que JÁ existem
(`public/art/`), para manter consistência (risco nº1 do council: assets com
tratamentos diferentes). Use o **TEMPLATE MESTRE** em TODO prompt — é o que garante
que cada imagem nova combine com o Professor Lemos, os diplomas e os selos atuais.

Regra de ouro de a11y/PWA (council): **as imagens são SÓ o papel/elemento — sem
texto embutido.** O texto real (plano, notas, números) é renderizado pelo app por
cima, para ser selecionável, acessível e traduzível. Gere superfícies em branco.

---

## Automação (gerar via API)

Já existe um script que faz tudo: `scripts/generate-art.mjs`. Ele chama a OpenAI
Images API (`gpt-image-1`), salva o master em `entrega/` e otimiza para WebP em
`public/art/`. A chave vem só do ambiente (`OPENAI_API_KEY`) — nunca de arquivo.

```
# PowerShell
$env:OPENAI_API_KEY="sk-..."; node scripts/generate-art.mjs
# bash
OPENAI_API_KEY=sk-... node scripts/generate-art.mjs
# um só:  node scripts/generate-art.mjs --only=selo-cera-torre
```

O modelo de imagem é `gpt-image-1` (o chat `gpt-5.5` não emite arquivo via API
direta). Os prompts abaixo são a referência humana; a versão canônica executável
está embutida no script. Custo ~US$1,5-2 pelos 8 assets.

## TEMPLATE MESTRE (cole no início de cada prompt)

> Vintage academic storybook illustration, in the style of a hand-drawn antique
> chess manual. Aged parchment / cream paper (#f5f3ec), deep forest-green (#1f3f36)
> and antique-gold (#9f8540) accents, ink (#16201c) linework. Rendered in soft
> colored pencil and light watercolor with fine pen outlines and subtle paper grain.
> Warm, diffused light from the upper-left, gentle natural drop shadow, restrained
> ornate detailing, cozy and scholarly mood. Part of a cohesive set that includes an
> anthropomorphic horse professor in a green cardigan and ornate green-and-gold
> diploma frames with a wax seal. Muted warm palette only. NOT flat vector, NOT 3D
> render, NOT photographic, no neon, no harsh contrast.

## RESTRIÇÕES TÉCNICAS (valem para todos)

> Single centered subject, isolated on a transparent background (alpha), generous
> empty margin. No text, letters, numbers, captions or watermark of any kind. Even
> line weight and identical lighting across the whole set. Master render 1024 px on
> the long side; trim and export to WebP, quality ~70, target ≤40 KB.

---

## 1. Página de caderno — plano do dia (`pagina-caderno.webp`)

**Uso:** fundo do plano do dia (o app desenha os blocos por cima).
**Formato:** retrato 4:5 (~1024×1280).

> [TEMPLATE MESTRE] A single sheet of aged ruled notebook paper lying flat, faint
> horizontal rules and one thin vertical margin line in dusty red, softly worn and
> slightly darkened edges, a gentle curl at the bottom-right corner, one or two very
> light coffee-ring stains. Completely blank (no writing). [RESTRIÇÕES]

## 2. Bilhete do Professor — nota/post-it (`bilhete-lemos.webp`)

**Uso:** fundo do TutorCard (a fala do Professor vai por cima). Máx. 1 por tela.
**Formato:** paisagem ~5:3 (~1024×620).

> [TEMPLATE MESTRE] A small note card of warm cream paper, gently rotated about -2
> degrees, one top corner slightly lifted, held by a short strip of translucent
> washi tape at the top center, soft drop shadow beneath. Faint horizontal guide
> lines, blank surface. Cozy, hand-made feel. [RESTRIÇÕES]
>
> Variante modo-noite (council alertou contraste): repetir trocando "warm cream
> paper" por "soft dark slate paper (#22303c) with a faint warm grain", mantendo a
> fita translúcida — para o texto claro do app ter contraste.

## 3. Selos de cera — seções (`selo-cera-{peao,torre,rei,cavalo,louro}.webp`)

**Uso:** elevar os selos de seção ao mesmo tratamento do selo do diploma (consistência).
**Formato:** quadrado ~512×512 cada, fundo transparente.

> [TEMPLATE MESTRE] A round wax seal in deep forest-green sealing wax with an
> antique-gold chess emblem pressed into the center — [EMBLEMA] — glossy wax sheen,
> slightly irregular hand-pressed wax rim, small soft drop shadow. Identical in
> style to the green-and-gold wax seal at the bottom of the existing diploma.
> [RESTRIÇÕES]
>
> Trocar [EMBLEMA] por: a pawn / a rook / a king / a knight horse-head / a laurel
> wreath. Gerar todos no MESMO ângulo e iluminação.

## 4. Boletim semanal (`boletim-semanal.webp`)

**Uso:** fundo do resumo semanal no Progresso (o app desenha as métricas/carimbos por cima).
**Formato:** retrato 4:5 (~1024×1280).

> [TEMPLATE MESTRE] An aged academic report-card sheet of parchment, a slim
> green-and-gold ruled header band across the top, faint horizontal rows below it, a
> small green-and-gold chess crest centered at the very top, a narrow side column
> marked off for a stack of day stamps, softly worn edges. All rows completely blank
> (no writing). [RESTRIÇÕES]

## 5. (Opcional) Carimbo de tinta "FEITO/BOA" (`carimbo-feito.webp`)

**Uso:** substituir o carimbo CSS atual ao concluir bloco, se quiser textura real.
**Formato:** ~512×320, transparente. (Hoje é CSS puro; só gere se quiser o look de borracha.)

> [TEMPLATE MESTRE] A diagonal rubber-stamp imprint in muted brick-red ink
> (#9d3d37), an empty rounded-rectangle stamp frame with distressed, slightly
> uneven hand-pressed edges and ink speckle. Blank inside (the app prints the word).
> Transparent background. [RESTRIÇÕES]

---

## Ordem sugerida (impacto/esforço)

1. **Selos de cera** (#3) — destravam consistência de TODO o sistema de selos; 5 imagens, mesmo molde.
2. **Bilhete do Professor** (#2) + variante noite — alto afeto, 1 lugar.
3. **Página de caderno** (#1) — transforma a tela principal.
4. **Boletim semanal** (#4) — fecha o Progresso.
5. Carimbo "FEITO" (#5) — opcional (já há versão CSS).

Depois de gerar: cada asset entra com `loading="lazy"`, exceto os 1–2 críticos da
primeira dobra (`<link rel="preload">`). Manter ≤40 KB por arquivo.
