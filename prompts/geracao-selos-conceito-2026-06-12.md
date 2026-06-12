# Selos de conceito — mini-ilustrações premium (pacote 2026-06-12)

Objetivo: substituir texto por imagem nos títulos de seção e cards. Cada selo é
uma ilustração pequena e quadrada que comunica o conceito num relance, no mesmo
universo do Gabinete do Professor Lemos.

## Direção comum (colar antes de cada prompt)

> Warm gouache painting, study-cabinet aesthetic: aged paper, dark walnut wood,
> deep green felt, antique brass and muted gold accents. Soft directional light
> from upper left, gentle painted texture, no outlines, no text, no letters.
> Single centered object on a plain warm cream paper background (#f5f3ec),
> generous margins around the object. Square format, 1:1.

Especificações de entrega: PNG 1024×1024, fundo creme liso (sem cenário),
um arquivo por prompt, nome exato do arquivo indicado em cada bloco.

---

## 1. selo-diagnostico.png — Diagnóstico (lupa)
[DIREÇÃO COMUM] + An antique brass magnifying glass with dark wood handle,
resting at a slight angle over a small painted chess knight piece, as if
examining it. The lens subtly magnifies the knight.

## 2. selo-ritmo.png — Ritmo (metrônomo)
[DIREÇÃO COMUM] + A small wooden metronome with brass pendulum, mid-swing,
warm walnut body with a tiny gold inlay line.

## 3. selo-registro.png — Sinais e registros (pena e tinteiro)
[DIREÇÃO COMUM] + A white quill pen resting against a small glass inkwell
with deep green ink, a thin drawn line of ink curving on the paper beneath.

## 4. selo-pendencias.png — Pendências (carta lacrada)
[DIREÇÃO COMUM] + A folded letter sealed with deep green wax, the seal
stamped with a tiny chess pawn silhouette, one corner of the letter slightly
lifted.

## 5. selo-sessao.png — Sessão de treino (relógio de bolso)
[DIREÇÃO COMUM] + An open antique brass pocket watch with cream face and
elegant dark hands, short chain pooling beside it.

## 6. selo-plano.png — Plano do dia (pergaminho)
[DIREÇÃO COMUM] + A small unrolled parchment scroll with three painted
checkmark strokes in green ink (no readable text), edges gently curled.

## 7. selo-trilha.png — Trilhas do método (bússola)
[DIREÇÃO COMUM] + An antique brass compass with cream dial, needle pointing
upward-right, lid open showing a worn leather strap.

## 8. selo-habilidades.png — Habilidades por tema (estante)
[DIREÇÃO COMUM] + Three small leather-bound books leaning together — deep
green, oxblood red and golden tan spines with blank gold bands, one lying flat.

## 9. selo-conquistas.png — Conquistas (caixa de medalhas)
[DIREÇÃO COMUM] + A small open wooden case lined with deep green felt,
holding a single round gold medal with blank face, lid open behind.

## 10. selo-linha-base.png — Linha de base (balança)
[DIREÇÃO COMUM] + A small brass balance scale, two pans level, one holding
a tiny white pawn and the other a tiny black pawn.

## 11. selo-trava.png — Onde ainda trava (nó)
[DIREÇÃO COMUM] + A short length of cream rope tied in a simple firm knot,
painted with soft shadows, ends frayed slightly.

## 12. selo-dados.png — Dados locais e backup (cofre)
[DIREÇÃO COMUM] + A small antique wooden strongbox with brass corners and
keyhole, lid closed, a tiny brass key lying in front.

## 13. selo-lichess.png — Conexão Lichess (cavalo na janela)
[DIREÇÃO COMUM] + A white chess knight piece on a windowsill with warm light
coming through, suggesting connection to the outside (no logos).

## 14. selo-avaliacao.png — Avaliação de entrada (régua e peão)
[DIREÇÃO COMUM] + A small wooden ruler standing vertically next to a white
pawn, as if measuring its height, brass markings without numbers.

## 15. selo-essencial.png — Perfil essencial (plaquinha de latão)
[DIREÇÃO COMUM] + A small polished brass nameplate on a dark wood base,
blank face with a subtle engraved border, like a desk name plate.

---

## Integração (para o Claude, quando os arquivos chegarem em entrega/)

1. Adicionar specs em `scripts/optimize-art.mjs`: `{ w: 128, q: 85 }` por selo
   (exibição ~40px → 128 cobre @3x).
2. Rodar `node scripts/optimize-art.mjs`.
3. Trocar o fallback lucide pelo webp no componente `ConceptSeal`
   (src/ui/art/ConceptSeal.tsx) — o mapa conceito→arquivo já está pronto lá.
