// Gera os ícones PWA a partir do medalhão pintado do Professor Lemos.
// Fonte: entrega/lemos-avatar-medalhao.png → public/icon-*.png
// Run: node scripts/make-icons.mjs

import sharp from 'sharp';

const SRC = 'entrega/lemos-avatar-medalhao.png';
const BG = '#1f3f36';

function circleMask(diameter) {
  const radius = diameter / 2;

  return Buffer.from(
    `<svg width="${diameter}" height="${diameter}"><circle cx="${radius}" cy="${radius}" r="${radius}" fill="#fff"/></svg>`,
  );
}

async function medallion(diameter) {
  const cropped = await sharp(SRC)
    .resize(diameter, diameter, { fit: 'cover' })
    .composite([{ input: circleMask(diameter), blend: 'dest-in' }])
    .png()
    .toBuffer();

  return cropped;
}

async function iconOnGreen(size, medallionDiameter, file) {
  const art = await medallion(medallionDiameter);
  const offset = Math.round((size - medallionDiameter) / 2);

  await sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: art, top: offset, left: offset }])
    .png({ palette: true, quality: 90 })
    .toFile(file);

  const stat = await import('node:fs/promises').then((m) => m.stat(file));

  console.log(`OK  ${file}  ${(stat.size / 1024).toFixed(0)} KB`);
}

// "any": medalhão grande (90%); "maskable": zona segura de 78%.
await iconOnGreen(512, 460, 'public/icon-512.png');
await iconOnGreen(512, 400, 'public/icon-maskable-512.png');
await iconOnGreen(192, 172, 'public/icon-192.png');
await iconOnGreen(180, 160, 'public/apple-touch-icon.png');

console.log('\n✓ Ícones gerados em public/');
