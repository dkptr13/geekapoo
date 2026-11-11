// Ensena una rejilla de imagenes de capitulo para poder mirarlas.
//    node scripts/mirar-miniaturas.mjs <animeId> [cuantas]
//
// La pregunta de si una imagen es del capitulo correcto no se responde
// leyendo la URL: se responde mirandola. Y para eso hace falta ver
// varias juntas, porque el fallo tipico no es una imagen que no cuadre,
// sino la imagen de otro capitulo puesta en el sitio.
//
// Por eso se enseña el numero al lado de cada imagen. Si las imagenes
// estan ordenadas y en el sitio, los numeros tienen que ir en orden
// tambien.
//
// Las imagenes se descargan a una carpeta temporal y se montan en un
// HTML con los numeros puestos encima. No es un navegador: es una tabla
// con imagenes, que se puede abrir y mirar de un vistazo.

import { writeFile, mkdir } from 'node:fs/promises';
import { str, num } from './firestore-rest.mjs';
import { leerPorCampo } from './firestore-consultas.mjs';

const animeId = process.argv[2];

if (!animeId) {
  console.error('  uso: node scripts/mirar-miniaturas.mjs <animeId> [cuantas]');
  process.exit(1);
}

const cuantas = Number(process.argv[3] ?? 40);

const CARPETA = 'C:/Users/Oscar/AppData/Local/Temp/opencode/miniaturas';

// Las imagenes que son del almacenamiento propio se ven raro porque son
// recortes, pero tambien hay que mirarlas: por eso se avisa de cuales
// son para no confundir un fallo con un recorte.
const PROPIA = 'storage.googleapis.com';

const capitulos = await leerPorCampo({
  coleccion: 'episodes',
  campo: 'animeId',
  valor: animeId,
});

const mios = capitulos.filter((c) => str(c.f, 'thumbnailUrl'));

if (!mios.length) {
  console.log(`"${animeId}" no tiene capitulos con miniatura`);

  process.exit(1);
}

const orden = (a, b) => {
  const ta = (str(a.f, 'seasonId') ?? '').match(/-s(\d+)$/)?.[1] ?? '0';
  const tb = (str(b.f, 'seasonId') ?? '').match(/-s(\d+)$/)?.[1] ?? '0';

  return Number(ta) - Number(tb) || (num(a.f, 'number') ?? 0) - (num(b.f, 'number') ?? 0);
};

mios.sort(orden);

await mkdir(CARPETA, { recursive: true });

const celdas = [];

let propias = 0;

for (const [i, c] of mios.slice(0, cuantas).entries()) {
  const url = str(c.f, 'thumbnailUrl');

  const temporada = (str(c.f, 'seasonId') ?? '').match(/-s(\d+)$/)?.[1] ?? '?';

  const numero = num(c.f, 'number');

  const nombre = `${animeId}-${temporada}-${String(numero).replace('.', '_')}.jpg`;

  if (url.includes(PROPIA)) propias++;

  celdas.push({ nombre, etiqueta: `T${temporada} ${numero}`, url, propia: url.includes(PROPIA) });
}

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Miniaturas de ${animeId}</title>
<style>
  body { font-family: system-ui, sans-serif; background: #14161a; color: #ddd; margin: 16px; }
  h1 { font-size: 16px; font-weight: 600; }
  .g { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
  figure { margin: 0; }
  img { width: 100%; aspect-ratio: 16/9; object-fit: cover; border-radius: 4px; background: #000; display: block; }
  figcaption { font-size: 13px; padding-top: 4px; }
  .propia { color: #e0a458; }
</style>
</head>
<body>
<h1>${animeId} &mdash; ${celdas.length} capitulos${propias ? ` (${propias} del almacenamiento propio, en ambar)` : ''}</h1>
<div class="g">
${celdas
  .map(
    (c) => `  <figure>
    <img src="${c.url}" alt="${c.etiqueta}" loading="lazy">
    <figcaption class="${c.propia ? 'propia' : ''}">${c.etiqueta}</figcaption>
  </figure>`,
  )
  .join('\n')}
</div>
</body>
</html>
`;

const salida = `${CARPETA}/${animeId}.html`;

await writeFile(salida, html, 'utf8');

console.log(`\n${celdas.length} imagenes en ${salida}`);

if (propias) console.log(`${propias} son del almacenamiento propio`);

console.log('\nAbre el fichero y mira si los numeros van en orden.');