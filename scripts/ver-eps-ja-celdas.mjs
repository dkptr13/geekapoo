// Saca la tabla de capitulos de la wiki japonesa con TODAS las celdas.
//    node scripts/ver-eps-ja-celdas.mjs <pagina> [encabezado]
//
// `ver-eps-ja.mjs` se queda con el par "numero, titulo" porque es lo que
// hace falta para emparejar. Para las fechas no vale: hay tablas donde la
// fecha va en una columna aparte y hay que verlas todas antes de
// decidir.
//
// Que las fechas de un anime se.detail_importen mal importa: en Toradora
// la serie se emitia en jueves, y una tabla que pone las ultimas quince
// en miercoles esta mal aunque el orden de los capitulos sea el
// correcto.

const pagina = process.argv[2] ?? 'とらドラ!';

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

let cuenta = 0;

for (const fila of filas) {
  const celdas = [...fila.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((m) =>
    limpio(m[1]),
  );

  if (celdas.length < 2) continue;

  const numero =
    /^第\s*(\d+(?:\.\d+)?)\s*話$/.exec(celdas[0])?.[1] ??
    /^(\d+(?:\.\d+)?)$/.exec(celdas[0])?.[1];

  if (!numero) continue;

  cuenta++;

  console.log(`${String(numero).padStart(4)}  ${celdas.map((c) => c || '-').join(' | ')}`);
}

console.log(`\n${cuenta} filas`);