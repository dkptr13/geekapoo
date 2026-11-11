// Reparto de las miniaturas de episodio.
//    node scripts/ver-miniaturas.mjs <animeId> | --full
//
// Dice cuantos capitulos tienen miniatura y de donde sale cada una,
// agrupados por anime y por origen. Sirve para dos cosas:
//
//   · Ver si un anime nuevo ha dejado Episodios sin imagen cuando antes
//     los tenia.
//   · Ver de donde viene cada miniatura, que es lo que permite saber si
//     algo se ha dejado de actualizar.
//
// Lo normal es que la mayoria no tenga ninguna: no hay ninguna API
// publica que guarde una imagen por capitulo. Las que si tienen son de
// tres sitios, y conviene saber cuales:
//
//   · Storage propio   imagen subida al bucket del proyecto
//   · imgsrv.crunchyroll.com   miniatura oficial de Crunchyroll
//   · otros dominios  miniaturas de terceros

import { coleccion, str } from './firestore-rest.mjs';
import { leerPorCampo } from './firestore-consultas.mjs';

const filtro = process.argv[2];
const full = process.argv.includes('--full');

if (!filtro && !full) {
  console.error('  uso: node scripts/ver-miniaturas.mjs <animeId> | --full');
  console.error('  Sin --full no se lee la colección entera.');
  process.exit(1);
}

const capitulos = filtro
  ? await leerPorCampo({ coleccion: 'episodes', campo: 'animeId', valor: filtro })
  : await coleccion('episodes');

const conImagen = capitulos.filter((e) => str(e.f, 'thumbnailUrl').length > 0);

console.log(`\n${capitulos.length} capitulos, ${conImagen.length} con miniatura`);
console.log(`(${capitulos.length - conImagen.length} sin ninguna)\n`);

// ── De donde sale cada una ─────────────────────────────────────────

const origen = (url) => {
  if (!url) return '(vacio)';
  if (url.includes('firebasestorage') || url.includes('storage.googleapis')) return 'Storage propio';
  if (url.includes('imgsrv.crunchyroll')) return 'Crunchyroll';
  if (url.includes('media-amazon')) return 'Amazon';
  if (url.includes('gstatic')) return 'Google cache';
  if (url.includes('wikia') || url.includes('fandom')) return 'Wikia';
  try {
    return new URL(url).hostname;
  } catch {
    return '(no es una URL)';
  }
};

const porOrigen = new Map();

for (const e of conImagen) {
  const k = origen(str(e.f, 'thumbnailUrl'));

  porOrigen.set(k, (porOrigen.get(k) ?? 0) + 1);
}

console.log('DE DONDE SALEN:');

for (const [k, n] of [...porOrigen].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(4)}  ${k}`);
}

// ── Cuantos tiene cada anime ──────────────────────────────────────

const porAnime = new Map();

for (const e of capitulos) {
  const anime = str(e.f, 'animeId') || '(sin anime)';

  const fila = porAnime.get(anime) ?? { total: 0, conImagen: 0 };

  fila.total++;
  if (str(e.f, 'thumbnailUrl')) fila.conImagen++;

  porAnime.set(anime, fila);
}

console.log('\nPOR ANIME:');

for (const [k, v] of [...porAnime].sort((a, b) => a[0].localeCompare(b[0]))) {
  if (filtro && !k.includes(filtro)) continue;

  const marca = v.conImagen === 0 ? '  <- ninguna' : '';
  console.log(`  ${k.padEnd(42)} ${String(v.total).padStart(4)} capitulos  ${String(v.conImagen).padStart(4)} con miniatura${marca}`);
}