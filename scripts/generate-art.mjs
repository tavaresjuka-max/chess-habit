// Gera os assets premium do council (template "Escrivaninha do Professor") via
// OpenAI Images API (gpt-image-1) e otimiza para WebP em public/art/.
//
// A chave vem SOMENTE do ambiente (OPENAI_API_KEY) — nunca é lida de arquivo nem
// commitada. O modelo de imagem é gpt-image-1: o chat "gpt-5.5" não emite arquivo
// de imagem via API direta; ele é o modelo de imagem da OpenAI.
//
// Uso (PowerShell):  $env:OPENAI_API_KEY="sk-..."; node scripts/generate-art.mjs
// Uso (bash):        OPENAI_API_KEY=sk-... node scripts/generate-art.mjs
// Flags:  --force            regera mesmo se o .webp já existir
//         --only=<nome>      gera só um asset (ex.: --only=selo-cera-torre)
//
// Custo aproximado: gpt-image-1 quality "high" ~US$0,16-0,25 por imagem;
// os ~8 assets abaixo ficam em torno de US$1,5-2 no total.

import sharp from 'sharp';
import { mkdir, writeFile, stat, access } from 'node:fs/promises';
import { join } from 'node:path';

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error('Defina OPENAI_API_KEY no ambiente. A chave NUNCA é lida de arquivo nem commitada.');
  process.exit(1);
}

const FORCE = process.argv.includes('--force');
const ONLY = process.argv.find((arg) => arg.startsWith('--only='))?.slice('--only='.length);

// Template MESTRE. Garante que todo asset combine com Lemos, os diplomas e os selos.
const MASTER =
  'Warm storybook illustration, slightly painterly, soft depth-of-field, clean composition, no harsh outlines. ' +
  'Aged parchment / cream paper (#f5f3ec), deep forest-green (#1f3f36), muted gold (#c9a227), and dark wood accents. ' +
  'Warm diffused light, gentle natural drop shadow, antique academic storybook mood. ' +
  'Cohesive with a set featuring Lemos, a wise anthropomorphic dark gray horse chess tutor with a long thoughtful face, ' +
  'soft black-gray mane, small round reading glasses, friendly intelligent eyes, a dark forest-green knitted cardigan, ' +
  'cream shirt, and muted gold bow tie. ' +
  'Muted warm palette only. NOT flat vector, NOT 3D render, NOT photographic, no neon, no harsh contrast.';

const TECH =
  'Single centered subject isolated on a transparent background, generous empty margin. ' +
  'Absolutely no text, letters, numbers, captions or watermark of any kind. Even line weight and consistent lighting.';

const SEAL_EMBLEMS = [
  ['selo-cera-peao', 'a pawn'],
  ['selo-cera-torre', 'a rook'],
  ['selo-cera-rei', 'a king'],
  ['selo-cera-cavalo', 'a knight horse-head'],
  ['selo-cera-louro', 'a laurel wreath'],
];

const ASSETS = [
  {
    name: 'pagina-caderno',
    size: '1024x1536',
    web: { w: 720, q: 78 },
    prompt:
      'A single sheet of aged ruled notebook paper lying flat, faint horizontal rules and one thin vertical ' +
      'margin line in dusty red, softly worn and slightly darkened edges, a gentle curl at the bottom-right ' +
      'corner, one or two very light coffee-ring stains. Completely blank, no writing.',
  },
  {
    name: 'bilhete-lemos',
    size: '1536x1024',
    web: { w: 600, q: 80 },
    prompt:
      'A small note card of warm cream paper, gently rotated about -2 degrees, one top corner slightly lifted, ' +
      'held by a short strip of translucent washi tape at the top center, soft drop shadow beneath, faint ' +
      'horizontal guide lines, blank surface.',
  },
  {
    name: 'bilhete-lemos-noite',
    size: '1536x1024',
    web: { w: 600, q: 80 },
    prompt:
      'A small note card of soft dark slate paper (#22303c) with a faint warm grain, gently rotated about -2 ' +
      'degrees, one top corner slightly lifted, held by a short strip of translucent washi tape at the top ' +
      'center, soft drop shadow, faint light-colored guide lines, blank surface (for light text on top).',
  },
  ...SEAL_EMBLEMS.map(([name, emblem]) => ({
    name,
    size: '1024x1024',
    web: { w: 128, q: 85 },
    prompt:
      `A round wax seal in deep forest-green sealing wax with an antique-gold chess emblem pressed into the ` +
      `center — ${emblem} — glossy wax sheen, slightly irregular hand-pressed wax rim, small soft drop shadow. ` +
      `Identical in style to the green-and-gold wax seal at the bottom of an academic diploma.`,
  })),
  {
    name: 'boletim-semanal',
    size: '1024x1536',
    web: { w: 720, q: 78 },
    prompt:
      'An aged academic report-card sheet of parchment, a slim green-and-gold ruled header band across the top, ' +
      'faint horizontal rows below it, a small green-and-gold chess crest centered at the very top, a narrow ' +
      'side column marked off for a stack of stamps, softly worn edges. All rows completely blank, no writing.',
  },
  // Opcional (já existe versão em CSS): descomente para gerar o carimbo como imagem.
  // {
  //   name: 'carimbo-feito',
  //   size: '1536x1024',
  //   web: { w: 256, q: 85 },
  //   prompt:
  //     'A diagonal rubber-stamp imprint outline in muted brick-red ink (#9d3d37), an empty rounded-rectangle ' +
  //     'stamp frame with distressed slightly uneven hand-pressed edges and ink speckle, blank inside.',
  // },
];

const ENTREGA = 'entrega';
const PUBLIC = 'public/art';
const exists = (path) => access(path).then(() => true).catch(() => false);

async function generate(asset) {
  const pngPath = join(ENTREGA, `${asset.name}.png`);
  const webpPath = join(PUBLIC, `${asset.name}.webp`);

  if (!FORCE && (await exists(webpPath))) {
    console.log(`SKIP ${asset.name} (já existe; --force para regerar)`);
    return;
  }

  console.log(`→ gerando ${asset.name} (${asset.size})...`);
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt: `${MASTER}\n\n${asset.prompt}\n\n${TECH}`,
      size: asset.size,
      background: 'transparent',
      output_format: 'png',
      quality: 'high',
      n: 1,
    }),
  });

  if (!res.ok) {
    console.error(`✗ ${asset.name}: HTTP ${res.status} — ${(await res.text()).slice(0, 300)}`);
    return;
  }

  const json = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (b64 === undefined) {
    console.error(`✗ ${asset.name}: resposta sem b64_json`);
    return;
  }

  const png = Buffer.from(b64, 'base64');
  await writeFile(pngPath, png); // master preservado em entrega/

  await sharp(png)
    .resize(asset.web.w, null, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: asset.web.q })
    .toFile(webpPath);

  const { size } = await stat(webpPath);
  const kb = (size / 1024).toFixed(0);
  console.log(`✓ ${asset.name}.webp  ${kb} KB${size > 40 * 1024 ? '  ⚠️ >40KB — baixe a quality (web.q)' : ''}`);
}

await mkdir(ENTREGA, { recursive: true });

const targets = ONLY === undefined ? ASSETS : ASSETS.filter((asset) => asset.name === ONLY);
if (targets.length === 0) {
  console.error(`Nenhum asset "${ONLY}". Nomes: ${ASSETS.map((asset) => asset.name).join(', ')}`);
  process.exit(1);
}

console.log(`Gerando ${targets.length} asset(s) via gpt-image-1 (a chave vem só de OPENAI_API_KEY).\n`);
for (const asset of targets) {
  try {
    await generate(asset);
  } catch (err) {
    console.error(`✗ ${asset.name}: ${err instanceof Error ? err.message : String(err)}`);
  }
}
console.log('\nPronto. Masters em entrega/, otimizados em public/art/. Reotimização futura: node scripts/optimize-art.mjs');
