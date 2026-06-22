// Remove o fundo BRANCO contíguo das bordas de assets que, no tema verde escuro
// forçado, apareciam como "caixa branca" (selos de seção, medalhas, avatar,
// estados-vazios). Usa flood-fill a partir dos 4 cantos: só apaga o branco
// conectado à borda — preserva qualquer branco/claro DENTRO do emblema.
//
// Reversível: faz backup dos .webp originais em public/art/_backup_defundo/.
// Uso: node scripts/defundo-assets.mjs   (--check para só inspecionar)

import sharp from 'sharp';
import { mkdir, copyFile, readdir, access } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const PUBLIC = 'public/art';
const BACKUP = 'public/art/_backup_defundo';
// Pasta de trabalho FORA do OneDrive: o OneDrive trava arquivos em public/art
// durante sync. O sharp só toca arquivos aqui; o OneDrive é tocado só por
// fs.copyFile (que funciona mesmo com o sync ativo).
const STAGE = join(tmpdir(), 'defundo-stage');
const exists = (p) => access(p).then(() => true).catch(() => false);

// Limiar de "branco de fundo": canais altos o suficiente. Anti-aliasing do WebP
// deixa o branco em ~250; 234 cobre a borda sem comer dourado/verde do emblema.
const WHITE = 234;

const TARGETS = [
  'selo-avaliacao', 'selo-conquistas', 'selo-dados', 'selo-diagnostico',
  'selo-essencial', 'selo-habilidades', 'selo-lichess', 'selo-linha-base',
  'selo-pendencias', 'selo-plano', 'selo-registro', 'selo-ritmo',
  'selo-sessao', 'selo-trava', 'selo-trilha',
  'medalha-calibrado', 'medalha-primeira-hora', 'medalha-retorno-de-ouro',
  'medalha-semana-inteira', 'medalha-tratador-pendencias',
  'lemos-avatar-medalhao',
  'vazio-pendencias-em-dia', 'vazio-sem-dados', 'vazio-sem-treinos',
];

const isWhite = (data, i) => data[i] >= WHITE && data[i + 1] >= WHITE && data[i + 2] >= WHITE;

async function defundo(name) {
  const path = join(PUBLIC, `${name}.webp`);
  const stageIn = join(STAGE, `${name}.in.webp`);
  const stageOut = join(STAGE, `${name}.out.webp`);

  // 1) backup (só na 1ª vez) e 2) cópia p/ fora do OneDrive antes de tocar c/ sharp.
  const backupPath = join(BACKUP, `${name}.webp`);
  if (!(await exists(backupPath))) await copyFile(path, backupPath);
  await copyFile(path, stageIn);

  const { data, info } = await sharp(stageIn)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info; // channels = 4 após ensureAlpha
  const visited = new Uint8Array(width * height);
  const stack = [];

  const pushIfWhite = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (visited[p]) return;
    if (isWhite(data, p * channels)) {
      visited[p] = 1;
      stack.push(p);
    }
  };

  // Semeia pelos 4 cantos + bordas inteiras (cobre fundo que toca qualquer borda).
  for (let x = 0; x < width; x++) { pushIfWhite(x, 0); pushIfWhite(x, height - 1); }
  for (let y = 0; y < height; y++) { pushIfWhite(0, y); pushIfWhite(width - 1, y); }

  let cleared = 0;
  while (stack.length > 0) {
    const p = stack.pop();
    data[p * channels + 3] = 0; // alpha = 0
    cleared++;
    const x = p % width;
    const y = (p - x) / width;
    pushIfWhite(x - 1, y);
    pushIfWhite(x + 1, y);
    pushIfWhite(x, y - 1);
    pushIfWhite(x, y + 1);
  }

  // Escreve o resultado no STAGE (fora do OneDrive) e copia de volta.
  await sharp(data, { raw: { width, height, channels } })
    .webp({ quality: 85, alphaQuality: 100 })
    .toFile(stageOut);
  await copyFile(stageOut, path);

  const pct = ((cleared / (width * height)) * 100).toFixed(0);
  console.log(`✓ ${name.padEnd(26)} ${width}x${height}  limpou ${pct}% (borda → transparente)`);
}

await mkdir(BACKUP, { recursive: true });
await mkdir(STAGE, { recursive: true });
const existing = new Set((await readdir(PUBLIC)).filter((f) => f.endsWith('.webp')).map((f) => f.replace('.webp', '')));

console.log(`Removendo fundo branco de ${TARGETS.length} assets (backup em ${BACKUP}/).\n`);
for (const name of TARGETS) {
  if (!existing.has(name)) { console.log(`SKIP ${name} (não encontrado)`); continue; }
  try {
    await defundo(name);
  } catch (err) {
    console.error(`✗ ${name}: ${err instanceof Error ? err.message : String(err)}`);
  }
}
console.log('\nPronto. Backups em public/art/_backup_defundo/ (reverter: copiar de volta).');
