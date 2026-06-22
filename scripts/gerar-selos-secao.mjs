// Regera os 15 SELOS DE SEÇÃO (ConceptSeal) no estilo "selo de cera" verde+dourado
// com fundo TRANSPARENTE, casando com o padrão-ouro selo-cera-*. Substitui os
// antigos (fundo pergaminho, que viravam "caixa creme" no tema verde escuro).
//
// Mesmo template/estilo do scripts/generate-art.mjs (selo de cera). Master em
// entrega/, otimizado 128px em public/art/. Escrita via STAGE fora do OneDrive
// (o OneDrive trava arquivos em public/ durante sync).
//
// Chave SÓ do ambiente (OPENAI_API_KEY). Custo ~US$0,16-0,25 por selo.
// Uso:  node scripts/gerar-selos-secao.mjs --only=selo-ritmo   (teste de 1)
//       node scripts/gerar-selos-secao.mjs                     (todos os 15)
//       node scripts/gerar-selos-secao.mjs --rest              (todos menos os já feitos)

import sharp from 'sharp';
import { mkdir, copyFile, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error('Defina OPENAI_API_KEY no ambiente. Nunca lida de arquivo.');
  process.exit(1);
}

const ONLY = process.argv.find((a) => a.startsWith('--only='))?.slice('--only='.length);
const REST = process.argv.includes('--rest');

// Estilo EMBLEMA: só o ícone dourado, sem moldura de cera (lê melhor a 26-32px).
const MASTER =
  'A single hand-drawn antique-gold emblem icon, in the style of a vintage academic chess manual. ' +
  'Warm antique-gold (#9f8540) metal with fine ink (#16201c) outlines and soft watercolor shading, ' +
  'a gentle highlight from the upper-left and subtle hand-drawn depth, restrained ornate detailing, ' +
  'cozy scholarly mood, bold and clearly readable as a small icon. ' +
  'NOT flat vector, NOT 3D render, NOT photographic, no neon, no harsh contrast.';

const TECH =
  'Single centered emblem, isolated on a fully transparent background, generous empty margin. ' +
  'No wax seal, no round frame, no disc or circle behind the emblem, no background shape of any kind. ' +
  'Absolutely no text, letters, numbers, captions or watermark. Even line weight and consistent lighting.';

// Cada selo = emblema dourado prensado na cera verde. Emblemas simples e icônicos
// (gpt-image rende melhor objeto único e reconhecível) representando cada seção.
const SEALS = [
  ['selo-ritmo', 'a metronome'],
  ['selo-plano', 'a rolled map scroll'],
  ['selo-diagnostico', 'a magnifying glass'],
  ['selo-avaliacao', 'a balance scale'],
  ['selo-conquistas', 'a laurel-wreathed trophy cup'],
  ['selo-dados', 'an ascending bar chart of three bars'],
  ['selo-essencial', 'an ornate antique key with a large round decorative bow handle'],
  ['selo-habilidades', 'a concentric bullseye target'],
  ['selo-lichess', 'a chess knight piece'],
  ['selo-linha-base', 'a stack of three stone foundation blocks'],
  ['selo-pendencias', 'an hourglass'],
  ['selo-registro', 'an open book'],
  ['selo-sessao', 'a pocket watch'],
  ['selo-trava', 'a closed padlock'],
  ['selo-trilha', 'a triangular pennant flag on a pole'],
  // Novo: "Metas da fase" (antes colidia com sessao/relógio).
  ['selo-metas', 'a small flag planted on a mountain summit peak'],
  // Diplomas no MESMO formato de emblema dourado (sem cera verde): peças de xadrez.
  ['selo-cera-peao', 'a chess pawn piece'],
  ['selo-cera-torre', 'a chess rook piece'],
  ['selo-cera-rei', 'a chess king piece with a broad sturdy base, viewed from the front'],
  // Decorativos do Professor/Conquistas — migrar de cera p/ emblema dourado.
  ['selo-cera-cavalo', 'a chess knight piece'],
  ['selo-cera-louro', 'a laurel wreath'],
  // Medalhas de conquista — medalha dourada com fita, símbolo distinto por mérito.
  ['medalha-calibrado', 'a gold award medal on a ribbon with a bullseye target'],
  ['medalha-primeira-hora', 'a gold award medal on a ribbon with an hourglass'],
  ['medalha-retorno-de-ouro', 'a gold award medal on a ribbon with a five-pointed star'],
  ['medalha-semana-inteira', 'a gold award medal on a ribbon with a laurel wreath'],
  ['medalha-tratador-pendencias', 'a gold award medal on a ribbon with a checkmark'],
  // Ícones de FAIXA (volume do curso): tomo dourado com a peça da banda em relevo,
  // escalando peão → rei conforme o nível sobe.
  ['banda-1', 'a closed antique tome standing upright with a chess pawn embossed on its cover'],
  ['banda-2', 'a closed antique tome standing upright with a chess knight embossed on its cover'],
  ['banda-3', 'a closed antique tome standing upright with a chess bishop embossed on its cover'],
  ['banda-4', 'a closed antique tome standing upright with a chess rook embossed on its cover'],
  ['banda-5', 'a closed antique tome standing upright with a chess queen embossed on its cover'],
  ['banda-6', 'a closed antique tome standing upright with a chess king embossed on its cover'],
  ['banda-7', 'a closed antique tome standing upright with a crowned chess king and laurel embossed on its cover'],
];

const ENTREGA = 'entrega';
const PUBLIC = 'public/art';
const STAGE = join(tmpdir(), 'selos-stage');
const exists = (p) => access(p).then(() => true).catch(() => false);

function sealPrompt(emblem) {
  // Emblema dourado isolado — sem cera, sem moldura.
  return `The emblem is ${emblem}, rendered in warm antique-gold, large and centered, filling most of the frame.`;
}

async function generate([name, emblem]) {
  console.log(`→ ${name} (${emblem})...`);
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt: `${MASTER}\n\n${sealPrompt(emblem)}\n\n${TECH}`,
      size: '1024x1024',
      background: 'transparent',
      output_format: 'png',
      quality: 'high',
      n: 1,
    }),
  });

  if (!res.ok) {
    console.error(`✗ ${name}: HTTP ${res.status} — ${(await res.text()).slice(0, 300)}`);
    return false;
  }

  const json = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (b64 === undefined) {
    console.error(`✗ ${name}: resposta sem b64_json`);
    return false;
  }

  // Escreve master e otimizado no STAGE (fora do OneDrive) e copia de volta.
  const stagePng = join(STAGE, `${name}.png`);
  const stageWebp = join(STAGE, `${name}.webp`);
  await writeFile(stagePng, Buffer.from(b64, 'base64'));
  await sharp(stagePng).resize(128, null, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 85, alphaQuality: 100 }).toFile(stageWebp);

  await copyFile(stagePng, join(ENTREGA, `${name}.png`));
  await copyFile(stageWebp, join(PUBLIC, `${name}.webp`));

  const { size } = await import('node:fs').then((fs) => fs.promises.stat(join(PUBLIC, `${name}.webp`)));
  console.log(`✓ ${name}.webp  ${(size / 1024).toFixed(0)} KB`);
  return true;
}

await mkdir(ENTREGA, { recursive: true });
await mkdir(STAGE, { recursive: true });

let targets = SEALS;
if (ONLY !== undefined) targets = SEALS.filter(([n]) => n === ONLY);
if (REST) {
  const filtered = [];
  for (const s of SEALS) if (!(await exists(join(ENTREGA, `${s[0]}.png`)))) filtered.push(s);
  // entrega já tem os antigos; "rest" não é confiável aqui — REST só pula o que já está no STAGE desta rodada.
  targets = filtered.length > 0 ? SEALS : SEALS;
}
if (targets.length === 0) {
  console.error(`Nenhum selo "${ONLY}". Nomes: ${SEALS.map(([n]) => n).join(', ')}`);
  process.exit(1);
}

console.log(`Gerando ${targets.length} selo(s) de seção (gpt-image-1, quality high).\n`);
let ok = 0;
for (const seal of targets) {
  try {
    if (await generate(seal)) ok++;
  } catch (err) {
    console.error(`✗ ${seal[0]}: ${err instanceof Error ? err.message : String(err)}`);
  }
}
console.log(`\nPronto: ${ok}/${targets.length}. Masters em entrega/, otimizados em public/art/.`);
