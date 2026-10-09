// Saca la tabla de capitulos de una pagina de wikipedia en japones.
//
//    node scripts ver-capitulos-ja.mjs <pagina>
//
// A diferencia de otrosExtractor, este imprime la tabla completa con
// celdas separadas por `|`, para poder leerla y comprobarla antes de
// escribir el fichero de datos. Los capitulos de Grand Blue, por ejemplo,
// traen el subtitulo japones en una columna y el ingles en otra, y las dos
// hacen falta.

const pagina = process.argv[2];

if (!pagina) {
  console.error('  uso: node scripts ver-capitulos-ja.mjs <pagina>');
  process.exit(1);
}

const r = await fetch(
  `https://ja.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pagina)}` +
    '&prop=text&format=json&formatversion=2',
  { headers: { 'User-Agent': 'geekapoo-script/1.0' } },
);

const html = (await r.json()).parse?.text ?? '';

const limpio = (s) =>
  s
    .replace(/<sup[\s\S]*?<\/sup>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#\d+;/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const filas = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((m) => m[1]);

console.log(`${pagina}: ${filas.length} filas\n`);

// Se imprime todo lo que parezca una fila de capitulo: algo con un numero
// de episodio o con una fecha de emision.
for (const fila of filas) {
  const celdas = [...fila.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((m) =>
    limpio(m[1]),
  );

  if (celdas.length < 2) continue;

  const linea = celdas.join(' | ');

  if (/\d+話|EPISODE|第\d+話|初放送日|\d{4}年\d{1,2}月\d{1,2}日/.test(linea)) {
    console.log('  ' + linea.slice(0, 190));
  }
}