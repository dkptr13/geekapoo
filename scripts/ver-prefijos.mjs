// See los ficheros de datos y como se emparejan con los ids del catalogo.
//    node scripts/ver-prefijos.mjs
//
// `emparejar-miniaturas-tvdb.mjs` localiza el fichero de datos de cada
// anime leyendo el `ANIME_ID` de cada `-meta.mjs` y luego Busca los
// `-tN.mjs` de ese prefijo. Si un anime no tiene prefijos, el emparejador
// dice "sin fichero de datos con los titulos japoneses" y se salta, que
// es un fallo mio y no que falte el dato.
//
// Este lo enseña todo para poder ver de una vez por que.

import { readdir } from 'node:fs/promises';

const datosUrl = new URL('./datos/', import.meta.url);

const ficheros = await readdir(datosUrl);

const metas = ficheros.filter((x) => x.endsWith('-meta.mjs'));

console.log(`${ficheros.length} ficheros, ${metas.length} de meta\n`);

for (const m of metas) {
  const prefijo = m.replace('-meta.mjs', '');

  let id = '(no exporta ANIME_ID)';

  try {
    const mod = await import(new URL(m, datosUrl));

    id = mod.ANIME_ID ?? '(sin ANIME_ID)';
  } catch (e) {
    id = 'ERROR al importar: ' + String(e.message).slice(0, 50);
  }

  const temporadas = ficheros.filter(
    (x) => x.startsWith(`${prefijo}-t`) && x.endsWith('.mjs'),
  );

  // Que exporta cada fichero de temporada y quantas filas tiene.
  const detalle = [];

  for (const t of temporadas) {
    try {
      const mod = await import(new URL(t, datosUrl));

      const filas = Object.values(mod).find((v) => Array.isArray(v));

      detalle.push(`${t}=${Array.isArray(filas) ? filas.length : '?'}`);
    } catch (e) {
      detalle.push(`${t}=ERROR`);
    }
  }

  console.log(`${prefijo.padEnd(6)} ${id.padEnd(44)} ${detalle.join(' ')}`);
}