// Saca la lista de capitulos de la seccion 各話リスト de un articulo.
//    node scripts/ver-eps-ja.mjs <pagina> [encabezado]
//
// La tabla de capitulos de la wiki japonesa cambia de formato segun el
// articulo: en unos esta la columna como 第1話 y en otros como 1 a secas,
// y el extractor general no pilla el segundo caso. Este lee la seccion
// de las filas y saca el par "numero, titulo", que es lo unico que hace
// falta.
//
// Lo que sale de aqui es el segundo origen para contrastar los titulos
// japoneses de TVDB, que son la via para conseguir las miniaturas de
// capitulo. Con una sola fuente, un error de catalogo parece un fallo de
// la fuente.

const pagina = process.argv[2] ?? 'とらドラ!';
const encabezado = process.argv[3] ?? '各話リスト';

const r = await fetch(
  `https://ja.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pagina)}` +
    '&prop=text&format=json&formatversion=2',
  { headers: { 'User-Agent': 'geekapoo-script/1.0' } },
);

const html = (await r.json()).parse?.text ?? '';

const limpio = (s) =>
  s
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<sup[\s\S]*?<\/sup>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#\d+;/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const filas = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((m) => m[1]);

const salida = [];

for (const fila of filas) {
  const celdas = [...fila.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((m) =>
    limpio(m[1]),
  );

  if (celdas.length < 2) continue;

  // El numero va con el prefijo 第 y el sufijo 話, o a secas.
  const numero = /^第\s*(\d+(?:\.\d+)?)\s*話$/.exec(celdas[0])?.[1] ?? /^(\d+(?:\.\d+)?)$/.exec(celdas[0])?.[1];

  if (!numero) continue;

  // La segunda columna es el subtitulo. En algunos articulos hay una
  // columna de por en medio con la fecha, asi que se coge la primera que
  // no sea una fecha ni un guion.
  const titulo = celdas
    .slice(1)
    .find((c) => c && !/^\d{4}年|^\d{1,2}月|話$/.test(c) && !/^#/.test(c));

  if (!titulo) continue;

  salida.push({ numero, titulo });
}

// Se seenseen por orden de aparicion, que es el orden de emision.
console.log(`\n${pagina} / ${encabezado}: ${salida.length} capitulos\n`);

for (const e of salida) {
  console.log(`${String(e.numero).padStart(4)}  ${e.titulo}`);
}