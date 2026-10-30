import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
const clave = process.env.TVDB_KEY;
const base = 'https://api4.thetvdb.com/v4';
const j = await (await fetch(base + '/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apikey: clave }) })).json();
const h = { Authorization: 'Bearer ' + j.data.token };
const arts = await (await fetch(base + '/series/81797/artworks', { headers: h })).json();
const fondos = (arts.data?.artworks ?? []).filter(a => a.type === 3).sort((a, b) => b.score - a.score);
const dir = 'C:/Users/Oscar/AppData/Local/Temp/op-art/fondos';
await mkdir(dir, { recursive: true });
const W = 240, H = 135, COLS = 5, PER = 20;
const lotes = [];
for (let i = 0; i < fondos.length; i += PER) lotes.push(fondos.slice(i, i + PER));
await writeFile(dir + '/lista.txt', fondos.map((a, i) => `${i}\t${a.width}x${a.height}\t${a.image}`).join('\n'), 'utf8');
for (let l = 0; l < lotes.length; l++) {
  const trozos = [];
  for (let k = 0; k < lotes[l].length; k++) {
    const a = lotes[l][k];
    const buf = Buffer.from(await (await fetch(a.thumbnail || a.image)).arrayBuffer());
    const img = await sharp(buf).resize(W, H, { fit: 'cover' }).toBuffer();
    const idx = l * PER + k;
    const etiqueta = Buffer.from(`<svg width="${W}" height="${H}"><rect x="0" y="0" width="34" height="20" fill="black" opacity="0.75"/><text x="5" y="15" font-size="14" fill="white" font-family="Arial">${idx}</text></svg>`);
    trozos.push({ input: await sharp(img).composite([{ input: etiqueta, top: 0, left: 0 }]).toBuffer(), left: (k % COLS) * (W + 4), top: Math.floor(k / COLS) * (H + 4) });
  }
  const filas = Math.ceil(lotes[l].length / COLS);
  await sharp({ create: { width: COLS * (W + 4), height: filas * (H + 4), channels: 3, background: '#111' } })
    .composite(trozos).jpeg({ quality: 82 }).toFile(`${dir}/hoja-${l + 1}.jpg`);
  console.log('hoja', l + 1, lotes[l].length);
}
console.log('total fondos', fondos.length);
