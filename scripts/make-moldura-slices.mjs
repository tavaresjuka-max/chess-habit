// Gera as molduras de botão prontas para border-image 9-slice:
// 1) recorta o canvas na placa exata (bbox medido por scan de pixels);
// 2) flood-fill a partir dos 4 cantos remove o papel de fundo dos chanfros
//    (vira alpha 0 — a placa funciona sobre qualquer superfície, claro/escuro);
// 3) reduz para 160px de altura e exporta webp com alpha.
// Run: node scripts/make-moldura-slices.mjs

import sharp from 'sharp';

const JOBS = [
  { stem: 'moldura-botao-primario', crop: { left: 60, top: 189, width: 1654, height: 512 } },
  { stem: 'moldura-botao-secundario', crop: { left: 111, top: 174, width: 1552, height: 562 } },
];

// Tolerância de cor vs o pixel do canto; caixa limita o vazamento do fill.
const TOLERANCE = 26;
const CORNER_BOX = 220;

function floodCorner(data, width, height, startX, startY) {
  const idx = (x, y) => (y * width + x) * 4;
  const si = idx(startX, startY);
  const ref = [data[si], data[si + 1], data[si + 2]];
  const x0 = Math.max(0, startX - CORNER_BOX);
  const x1 = Math.min(width - 1, startX + CORNER_BOX);
  const y0 = Math.max(0, startY - CORNER_BOX);
  const y1 = Math.min(height - 1, startY + CORNER_BOX);

  const stack = [[startX, startY]];
  const seen = new Set([startX + ',' + startY]);

  while (stack.length > 0) {
    const [x, y] = stack.pop();
    const i = idx(x, y);
    const dr = data[i] - ref[0];
    const dg = data[i + 1] - ref[1];
    const db = data[i + 2] - ref[2];
    if (Math.sqrt(dr * dr + dg * dg + db * db) > TOLERANCE) continue;

    data[i + 3] = 0;

    for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
      if (nx < x0 || nx > x1 || ny < y0 || ny > y1) continue;
      const key = nx + ',' + ny;
      if (!seen.has(key)) { seen.add(key); stack.push([nx, ny]); }
    }
  }
}

for (const job of JOBS) {
  const { data, info } = await sharp(`entrega/${job.stem}.png`)
    .extract(job.crop)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  floodCorner(data, width, height, 0, 0);
  floodCorner(data, width, height, width - 1, 0);
  floodCorner(data, width, height, 0, height - 1);
  floodCorner(data, width, height, width - 1, height - 1);

  const dst = `public/art/${job.stem}-slice.webp`;
  await sharp(data, { raw: { width, height, channels: 4 } })
    .resize(null, 160)
    .webp({ quality: 88 })
    .toFile(dst);

  const meta = await sharp(dst).metadata();
  console.log(`OK  ${job.stem}-slice.webp  ${meta.width}x${meta.height}`);
}
