// Integrates M0 premium art batches:
// - user-generated PNGs from entrega/m0/*.png -> public/art/*.webp
// - badge PNGs from assets/badges-gold/*.png -> public/art/*.webp with --badges
//
// Usage:
//   node scripts/integrate-m0-assets.mjs
//   node scripts/integrate-m0-assets.mjs --only=lemos-pose-boas-vindas
//   node scripts/integrate-m0-assets.mjs --badges

import sharp from 'sharp';
import { access, mkdir, readdir, stat } from 'node:fs/promises';
import { basename, join } from 'node:path';

const PUBLIC = 'public/art';
const M0_SRC = 'entrega/m0';
const BADGES_SRC = 'assets/badges-gold';
const ONLY = process.argv.find((arg) => arg.startsWith('--only='))?.slice('--only='.length);
const BADGES = process.argv.includes('--badges');

const ASSET_SPECS = {
  'lemos-pose-boas-vindas': { width: 1024, height: 1024, quality: 85, maxKb: 80 },
  'lemos-pose-aprovando': { width: 1024, height: 1024, quality: 85, maxKb: 80 },
  'lemos-pose-celebracao': { width: 1024, height: 1024, quality: 85, maxKb: 80 },
  'lemos-pose-chamando-de-volta': { width: 1024, height: 1024, quality: 85, maxKb: 80 },
  'lemos-pose-explicando': { width: 1024, height: 1024, quality: 85, maxKb: 80 },
  'lemos-pose-pensando': { width: 1024, height: 1024, quality: 85, maxKb: 80 },
  'lemos-avatar-medalhao': { width: 512, height: 512, quality: 85, maxKb: 40 },
  'loading-lemos': { width: 512, height: 512, quality: 85, maxKb: 40 },
  'diploma-peao': { width: 1024, height: 1024, quality: 85, maxKb: 120 },
  'diploma-rei': { width: 1024, height: 1024, quality: 85, maxKb: 120 },
  'diploma-torre': { width: 1024, height: 1024, quality: 85, maxKb: 120 },
  'fundo-mesa-dia': { width: 1792, height: 1024, quality: 85, maxKb: 200 },
  'fundo-mesa-noite': { width: 1792, height: 1024, quality: 85, maxKb: 200 },
  'bilhete-lemos': { width: 600, height: 300, quality: 85, maxKb: 60 },
  'bilhete-lemos-noite': { width: 600, height: 300, quality: 85, maxKb: 60 },
  'boas-vindas-placement': { width: 800, height: 600, quality: 85, maxKb: 100 },
  'boletim-semanal': { width: 800, height: 600, quality: 85, maxKb: 100 },
  'pagina-caderno': { width: 800, height: 600, quality: 85, maxKb: 100 },
};

const BADGE_RENAME = /^\d+-/;

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function sourceFiles(dir) {
  if (!(await exists(dir))) {
    console.error(`Pasta nao encontrada: ${dir}`);
    process.exit(1);
  }
  const files = (await readdir(dir)).filter((file) => file.endsWith('.png'));
  return ONLY === undefined
    ? files
    : files.filter((file) => basename(file, '.png').replace(BADGE_RENAME, '') === ONLY);
}

async function convert(file, sourceDir, badgeMode) {
  const stem = basename(file, '.png').replace(BADGE_RENAME, '');
  const spec = badgeMode
    ? { width: 512, height: 512, quality: 85, maxKb: 80 }
    : ASSET_SPECS[stem];

  if (spec === undefined) {
    console.warn(`SKIP ${file}: asset M0 desconhecido`);
    return { converted: 0, warnings: 1 };
  }

  const src = join(sourceDir, file);
  const dst = join(PUBLIC, `${stem}.webp`);

  await sharp(src)
    .resize(spec.width, spec.height, { fit: 'cover', position: 'center' })
    .webp({ quality: spec.quality })
    .toFile(dst);

  const metadata = await sharp(dst).metadata();
  const { size } = await stat(dst);
  const kb = size / 1024;
  const sizeWarning = kb > spec.maxKb ? ` WARN >${spec.maxKb}KB` : '';
  const dimensionWarning =
    metadata.width !== spec.width || metadata.height !== spec.height
      ? ` WARN ${metadata.width}x${metadata.height}`
      : '';

  console.log(`OK ${stem}.webp ${metadata.width}x${metadata.height} ${kb.toFixed(1)}KB${sizeWarning}${dimensionWarning}`);
  return { converted: 1, warnings: sizeWarning || dimensionWarning ? 1 : 0 };
}

await mkdir(PUBLIC, { recursive: true });

const sourceDir = BADGES ? BADGES_SRC : M0_SRC;
const files = await sourceFiles(sourceDir);

if (files.length === 0) {
  console.error(ONLY === undefined ? `Nenhum PNG encontrado em ${sourceDir}` : `Nenhum PNG encontrado para --only=${ONLY}`);
  process.exit(1);
}

let converted = 0;
let warnings = 0;

for (const file of files) {
  const result = await convert(file, sourceDir, BADGES);
  converted += result.converted;
  warnings += result.warnings;
}

console.log(`\nPronto: ${converted} WebP(s) em ${PUBLIC}${warnings > 0 ? `, ${warnings} aviso(s) para revisar` : ''}.`);
