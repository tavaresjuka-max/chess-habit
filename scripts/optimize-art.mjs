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

  // Fundos do gabinete — 9:16 pintado, app max 560px → 1120px @2x
  'fundo-gabinete-dia':   { w: 1120, q: 80 },
  'fundo-gabinete-noite': { w: 1120, q: 80 },
  'fundo-mesa-dia':       { w: 1120, q: 80 },
  'fundo-mesa-noite':     { w: 1120, q: 80 },

  // Medalhas das conquistas — exibidas ~80px → 160px @2x
  'medalha-retorno-de-ouro':     { w: 160, q: 85 },
  'medalha-primeira-hora':       { w: 160, q: 85 },
  'medalha-tratador-pendencias': { w: 160, q: 85 },
  'medalha-semana-inteira':      { w: 160, q: 85 },
  'medalha-calibrado':           { w: 160, q: 85 },

  // Selos dos diplomas — exibidos ~60px → 120px @2x
  'selo-diploma-peao':  { w: 120, q: 85 },
  'selo-diploma-rei':   { w: 120, q: 85 },
  'selo-diploma-torre': { w: 120, q: 85 },

  // Selos de conceito — exibidos ~40px → 128px cobre @3x
  'selo-diagnostico': { w: 128, q: 85 },
  'selo-ritmo': { w: 128, q: 85 },
  'selo-registro': { w: 128, q: 85 },
  'selo-pendencias': { w: 128, q: 85 },
  'selo-sessao': { w: 128, q: 85 },
  'selo-plano': { w: 128, q: 85 },
  'selo-trilha': { w: 128, q: 85 },
  'selo-habilidades': { w: 128, q: 85 },
  'selo-conquistas': { w: 128, q: 85 },
  'selo-linha-base': { w: 128, q: 85 },
  'selo-trava': { w: 128, q: 85 },
  'selo-dados': { w: 128, q: 85 },
  'selo-lichess': { w: 128, q: 85 },
  'selo-avaliacao': { w: 128, q: 85 },
  'selo-essencial': { w: 128, q: 85 },

  // Diplomas completos — exibidos ~240px → 480px @2x
  'diploma-peao':  { w: 480, q: 82 },
  'diploma-rei':   { w: 480, q: 82 },
  'diploma-torre': { w: 480, q: 82 },

  // Ícones de volume de banda — exibidos ~48px → 96px @2x
  'banda-1': { w: 96, q: 82 },
  'banda-2': { w: 96, q: 82 },
  'banda-3': { w: 96, q: 82 },
  'banda-4': { w: 96, q: 82 },
  'banda-5': { w: 96, q: 82 },
  'banda-6': { w: 96, q: 82 },
  'banda-7': { w: 96, q: 82 },

  // Tela de carregamento — exibida ~300px → 600px @2x
  'loading-lemos': { w: 600, q: 82 },

  // Boas-vindas / placement — exibida ~280px → 560px @2x
  'boas-vindas-placement': { w: 560, q: 82 },

  // Ilustrações de estado vazio — exibidas ~180px → 360px @2x
  'vazio-sem-dados':         { w: 360, q: 82 },
  'vazio-sem-treinos':       { w: 360, q: 82 },
  'vazio-pendencias-em-dia': { w: 360, q: 82 },

  // Ícone do app — gerado a partir do medalhão via make-icons.mjs; não reenviar
  'icone-app': null,
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
