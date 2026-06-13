// Confere se o bundle em produção contém a copy nova e os selos pintados.
import https from 'node:https';

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (r) => {
        let d = '';
        r.on('data', (c) => (d += c));
        r.on('end', () => resolve({ status: r.statusCode, body: d }));
      })
      .on('error', reject);
  });
}

const page = await get('https://rotina-pied.vercel.app/');
const m = page.body.match(/src="(\/assets\/index-[^"]+\.js)"/);
console.log('index.html status:', page.status);
console.log('JS bundle:', m ? m[1] : 'NAO ACHOU');

if (m) {
  const js = await get('https://rotina-pied.vercel.app' + m[1]);
  console.log('bundle bytes:', js.body.length);
  console.log('copy nova "O que seus jogos revelam":', js.body.includes('O que seus jogos revelam'));
  console.log('selos pintados "/art/selo-":', js.body.includes('/art/selo-'));
  console.log('copy nova "Antes de avançar":', js.body.includes('Antes de avançar'));
  console.log('copy antiga "Antes de conteúdo novo":', js.body.includes('Antes de conteúdo novo'));
  console.log('mapa da jornada "você está aqui":', js.body.toLowerCase().includes('você está aqui'));
}
