// Saca una seccion entera de una pagina de wikipedia en japones.
//    node scripts ver-seccion-ja.mjs <pagina> <encabezado>
//
// A veces el reparto de la wiki japonesa esta repartido en varios
// subapartados (una tabla para los de la serie y otra para los de la
// pelicula, por ejemplo) y ningun extractor automatico los pilla a los
// dos. Esto imprime el texto plano de la seccion pedida, para
// leerlo entero antes de escribir el fichero de datos.

const [pagina, encabezado] = process.argv.slice(2);

if (!pagina || !encabezado) {
  console.error('  uso: node scripts ver-seccion-ja.mjs <pagina> <encabezado>');
  process.exit(1);
}

const r = await fetch(
  `https://ja.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pagina)}` +
    '&prop=text&format=json&formatversion=2',
  { headers: { 'User-Agent': 'geekapoo-script/1.0' } },
);

const html = (await r.json()).parse?.text ?? '';

// Se corta por los encabezados de nivel 2 y 3, que son los que separan
// las secciones de un articulo de wikipedia.
const limpio = html
  .replace(/<style[\s\S]*?<\/style>/g, '')
  .replace(/<sup[\s\S]*?<\/sup>/g, '')
  .replace(/<br\s*\/?>/g, '\n')
  .replace(/<\/(h2|h3|li|p|tr|dd|dt)>/g, '\n')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&#\d+;/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/[ \t]+/g, ' ')
  .replace(/\n{3,}/g, '\n\n');

const lineas = limpio.split('\n');

const desde = lineas.findIndex((l) => l.trim().startsWith(encabezado));

if (desde < 0) {
  console.log(`no encuentro la seccion "${encabezado}"`);
  console.log('\nencabezados que hay:');
  for (const l of lineas) {
    if (/^(==|人物|キャ|声|登場)/.test(l)) console.log('  ' + l.trim().slice(0, 60));
  }
  process.exit(1);
}

let hasta = lineas.length;

for (let i = desde + 1; i < lineas.length; i++) {
  if (/^=+[^=]+=+$/.test(lineas[i].trim())) {
    hasta = i;
    break;
  }
}

console.log(lineas.slice(desde, hasta).join('\n'));