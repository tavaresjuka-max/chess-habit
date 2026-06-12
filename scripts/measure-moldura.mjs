// One-off: encontra o bounding box real da placa nas molduras de botão.
// Primário: placa verde escura sobre papel → busca pixels escuros.
// Secundário: placa creme com filete verde → busca o filete (verde domina).

import sharp from 'sharp';

async function bounds(file, isDark) {
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  let minX = width, minY = height, maxX = 0, maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const hit = isDark
        ? r + g + b < 330 // placa verde escura
        : g > r + 12 && g > b + 12 && r + g + b < 560; // filete verde sobre creme
      if (hit) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, minY, maxX, maxY, width, height };
}

const prim = await bounds('entrega/moldura-botao-primario.png', true);
console.log('primario  ', JSON.stringify(prim));
const sec = await bounds('entrega/moldura-botao-secundario.png', false);
console.log('secundario', JSON.stringify(sec));
