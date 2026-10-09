// Saca las tablas de capitulos de "List of ... episodes" de wikipedia.
//    node scripts ver-capitulos-lista.mjs <pagina>
//
// La pagina de lista es mejor fuente que la del anime porque trae una
// tabla por temporada con el numero, el titulo, la transliteracion, el
// director y la fecha. Los resumenes, si los hay, salen como prosa antes
// de la tabla: se imprimen enteros para poder leerlos antes de escribir
// el fichero de datos.

const pagina = process.argv[2];

if (!pagina) {
  console.error('  uso: node scripts ver-capitulos-lista.mjs <pagina>');
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

console.log(`${pagina}: ${html.length} caracteres\n`);

// ── 1. Los resumenes en prosa, si los hay ───────────────────────────

const plano = limpio(html);

for (const bloque of plano.split(/\s(?=Season \d)/)) {
  if (/Season \d \(/.test(bloque) && bloque.length < 2500) {
    console.log(`\n--- ${bloque.slice(0, 2400)}`);
  }
}

// ── 2. Las tablas ───────────────────────────────────────────────────

console.log('\n\n===== TABLAS =====');

for (const tabla of html.matchAll(/<table[\s\S]*?<\/table>/g)) {
  const filas = [...tabla[0].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((m) => m[1]);

  const datos = filas.map((f) => [...f.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => limpio(m[1])));

  const lineas = datos.filter((c) => c.length >= 3 && /^[\d.]+$/.test(c[0]));

  if (!lineas.length) continue;

  console.log(`\ntabla con ${lineas.length} filas de capitulo`);

  for (const c of lineas) {
    console.log('  ' + c.slice(0, 6).join(' | ').slice(0, 170));
  }
}