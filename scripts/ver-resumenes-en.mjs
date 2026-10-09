// Saca los resumenes de capitulo de una pagina de wikipedia en ingles.
//    node scripts ver-resumenes-en.mjs <pagina>
//
// Formato de salida: una linea por capitulo con el numero, el titulo y
// el resumen. Sirve para comprobar los argumentos antes de escribirlos:
// los capitulos de una temporada que no se han visto nunca hay que
// escribirlos a mano, y escribirlos de memoria es inventarlos.

const pagina = process.argv[2];

if (!pagina) {
  console.error('  uso: node scripts ver-resumenes-en.mjs <pagina>');
  process.exit(1);
}

const r = await fetch(
  `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pagina)}` +
    '&prop=text&format=json&formatversion=2',
  { headers: { 'User-Agent': 'geekapoo-script/1.0' } },
);

const html = (await r.json()).parse?.text ?? '';

const limpio = (s) =>
  s
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<sup[\s\S]*?<\/sup>/g, '')
    .replace(/<br\s*\/?>/g, ' / ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#\d+;/g, '')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const filas = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((m) => m[1]);

console.log(`${pagina}: ${filas.length} filas\n`);

for (const fila of filas) {
  const celdas = [...fila.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => limpio(m[1]));

  // Se buscan las filas que tienen un numero de episodio largo, que es
  // como los marca wikipedia ("104", "113", ...).
  if (!/^\d+$/.test(celdas[0] ?? '')) continue;

  console.log(`${celdas[0]}  ${celdas[1] ?? ''}`);
  console.log(`    ${celdas[2] ?? '(sin resumen)'}\n`);
}