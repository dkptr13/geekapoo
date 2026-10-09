// Muestra como queda el texto plano de una pagina, linea a linea.
//    node scripts ver-plano.mjs <pagina> [<fragma>] [<n>]
//
// Para depurar los extractores: cuando uno no encuentra lo que deberia,
// lo que hay que ver es como queda el HTML al quitarle las etiquetas, no
// el HTML entero.

const [pagina, fragma = '声 -', n = '14'] = process.argv.slice(2);

const r = await fetch(
  `https://ja.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pagina)}` +
    '&prop=text&format=json&formatversion=2',
  { headers: { 'User-Agent': 'geekapoo-script/1.0' } },
);

const html = (await r.json()).parse?.text ?? '';

const plano = html
  .replace(/<style[\s\S]*?<\/style>/g, '')
  .replace(/<sup[\s\S]*?<\/sup>/g, '')
  .replace(/<[^>]+>/g, '\n')
  .replace(/&#\d+;/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .split('\n')
  .map((l) => l.replace(/[ \t]+/g, ' ').trim())
  .filter(Boolean);

const desde = plano.findIndex((l) => l.includes(fragma));

if (desde < 0) {
  console.log('no aparece:', fragma);
  process.exit(1);
}

console.log(`${pagina}: ${plano.length} lineas, "${fragma}" en la ${desde}\n`);

for (let i = Math.max(0, desde - Number(n)); i < desde + Number(n); i++) {
  console.log(`${i}: ${JSON.stringify(plano[i])}`);
}