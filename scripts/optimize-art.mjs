// One-time script: converts entrega/*.png → public/art/*.webp at display-ready sizes.
// Run: node scripts/optimize-art.mjs

import sharp from 'sharp';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

const SRC = 'entrega';
const DST = 'public/art';

// width, quality per filename stem
const SPECS = {
  // Lemos character sheet — reference only, not shipped to the app
  'lemos-character-sheet': null,

  // Poses shown inside TutorCard (portrait ~200px display → 400px @2x)
  'lemos-pose-boas-vindas':       { w: 400, q: 82 },
  'lemos-pose-explicando':        { w: 400, q: 82 },
  'lemos-pose-aprovando':         { w: 400, q: 82 },
  'lemos-pose-chamando-de-volta': { w: 400, q: 82 },
  'lemos-pose-pensando':          { w: 400, q: 82 },
  'lemos-pose-celebracao':        { w: 400, q: 82 },

  // Avatar medalhão — 96px display → 192px @2x
  'lemos-avatar-medalhao': { w: 192, q: 85 },

  // Button frames — displayed at ~44px height, but border-image corners need
  // good resolution; keep wider, use height constraint
  'moldura-botao-primario':   { h: 200, q: 85 },
  'moldura-botao-secundario': { h: 200, q: 85 },

  // TutorCard frame — displayed at ~220px × ~165px → 440px @2x
  'moldura-tutorcard': { w: 440, q: 85 },

  // Seamless textures — 512×512 tile
  'textura-papel':  { w: 512, h: 512, q: 80 },
  'textura-couro':  { w: 512, h: 512, q: 80 },
};

const files = await readdir(SRC);
let done = 0, skipped = 0;

for (const file of files) {
  if (!file.endsWith('.png')) continue;
  const stem = file.replace(/\.png$/, '');
  const spec = SPECS[stem];

  if (spec === null) { console.log(`SKIP (ref only): ${stem}`); skipped++; continue; }
  if (spec === undefined) { console.warn(`UNKNOWN spec for ${stem}, skipping`); skipped++; continue; }

  const src = join(SRC, file);
  const dst = join(DST, stem + '.webp');

  let img = sharp(src);
  if (spec.w !== undefined || spec.h !== undefined) {
    img = img.resize(spec.w ?? null, spec.h ?? null, { fit: 'inside', withoutEnlargement: true });
  }
  await img.webp({ quality: spec.q }).toFile(dst);

  const stat = await import('node:fs/promises').then(m => m.stat(dst));
  console.log(`OK  ${stem}.webp  ${(stat.size / 1024).toFixed(0)} KB`);
  done++;
}

console.log(`\n✓ ${done} images optimized, ${skipped} skipped → ${DST}/`);
