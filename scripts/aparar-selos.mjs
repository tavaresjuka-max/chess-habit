// Apara a margem transparente dos 15 selos de seção (o gerador deixa "generous
// empty margin", que com object-fit:contain faz o selo parecer pequeno). Trim do
// alpha → selo justo na borda → preenche o quadro no tamanho de render.
//
// Processa o master (entrega/*.png) → trim → 128px webp. Escrita via STAGE fora
// do OneDrive (evita lock de sync).

import sharp from 'sharp';
import { mkdir, copyFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const SEALS = [
  'selo-ritmo', 'selo-plano', 'selo-diagnostico', 'selo-avaliacao', 'selo-conquistas',
  'selo-dados', 'selo-essencial', 'selo-habilidades', 'selo-lichess', 'selo-linha-base',
  'selo-pendencias', 'selo-registro', 'selo-sessao', 'selo-trava', 'selo-trilha',
  'selo-metas', 'selo-cera-peao', 'selo-cera-torre', 'selo-cera-rei',
  'selo-cera-cavalo', 'selo-cera-louro',
  'medalha-calibrado', 'medalha-primeira-hora', 'medalha-retorno-de-ouro',
  'medalha-semana-inteira', 'medalha-tratador-pendencias',
  'banda-1', 'banda-2', 'banda-3', 'banda-4', 'banda-5', 'banda-6', 'banda-7',
];

const ENTREGA = 'entrega';
const PUBLIC = 'public/art';
const STAGE = join(tmpdir(), 'aparar-stage');
await mkdir(STAGE, { recursive: true });

for (const name of SEALS) {
  try {
    const stageIn = join(STAGE, `${name}.png`);
    const stageOut = join(STAGE, `${name}.webp`);
    await copyFile(join(ENTREGA, `${name}.png`), stageIn);

    // trim: remove a borda totalmente transparente. threshold baixo p/ não comer a sombra.
    const trimmed = await sharp(stageIn).trim({ threshold: 10 }).toBuffer();
    const meta = await sharp(trimmed).metadata();

    // DUAS REGRAS DE PROPORÇÃO:
    // (A) Conjunto de PEÇAS DE XADREZ (peão/torre/rei mostrados juntos na lista
    //     de Diplomas) → proporções REAIS de altura do tabuleiro (Staunton): o
    //     rei é o mais alto, torre baixa-e-grossa, peão o menor. NÃO uniformizar.
    // (B) Emblemas de CONCEITO (ícones de seção independentes) → MESMA massa
    //     visual via ÁREA ÓPTICA (média geométrica), pra um alto-estreito e um
    //     largo terem o mesmo "tamanho" percebido.
    const CANVAS = 128;
    const PIECE_HEIGHT = { 'selo-cera-rei': 1.0, 'selo-cera-torre': 0.6, 'selo-cera-peao': 0.53 };
    const MAX_SIDE = 118;
    let scale;
    if (PIECE_HEIGHT[name] !== undefined) {
      const KING_H = 118; // altura do rei (referência); demais peças em fração real
      scale = (PIECE_HEIGHT[name] * KING_H) / meta.height;
      if (meta.width * scale > MAX_SIDE) scale = MAX_SIDE / meta.width; // teto p/ torre grossa
    } else {
      const GM_TARGET = 102; // área óptica-alvo dos emblemas de conceito
      const gm = Math.sqrt(meta.width * meta.height);
      scale = GM_TARGET / gm;
      if (Math.max(meta.width, meta.height) * scale > MAX_SIDE) {
        scale = MAX_SIDE / Math.max(meta.width, meta.height);
      }
    }
    const w = Math.max(1, Math.round(meta.width * scale));
    const h = Math.max(1, Math.round(meta.height * scale));
    const resized = await sharp(trimmed).resize(w, h).toBuffer();

    await sharp({ create: { width: CANVAS, height: CANVAS, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: resized, left: Math.round((CANVAS - w) / 2), top: Math.round((CANVAS - h) / 2) }])
      .webp({ quality: 85, alphaQuality: 100 })
      .toFile(stageOut);
    await copyFile(stageOut, join(PUBLIC, `${name}.webp`));
    console.log(`✓ ${name.padEnd(22)} trim ${meta.width}x${meta.height} → emblema ${w}x${h} centrado em ${CANVAS}`);
  } catch (err) {
    console.error(`✗ ${name}: ${err instanceof Error ? err.message : String(err)}`);
  }
}
console.log('\nPronto. Selos aparados — agora preenchem o quadro de render.');
