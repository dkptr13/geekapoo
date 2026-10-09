// Informa de cuántas imágenes del catálogo tienen encuadre guardado.
//
//   node scripts/ver-encuadres.mjs
//
// Sirve para saber si la migración hay quearla, y sobre qué
// colecciones. No escribe nada.

import { coleccion } from './firestore-rest.mjs';

// Cada colección con la imagen y el campo de encuadre que la acompaña.
const OBJETIVO = [
  { coleccion: 'animes', imagen: ['coverUrl'], foco: ['coverFocus'], ratio: 3 / 4, maximo: 900 },
  { coleccion: 'seasons', imagen: ['coverUrl', 'posterUrl'], foco: ['coverFocus', 'posterFocus'], ratio: 3 / 4, maximo: 900 },
  { coleccion: 'seasons', imagen: ['bannerUrl'], foco: ['bannerFocus'], ratio: 16 / 9, maximo: 1600 },
  { coleccion: 'episodes', imagen: ['thumbnailUrl'], foco: ['thumbnailFocus'], ratio: 16 / 9, maximo: 800 },
  { coleccion: 'characters', imagen: ['imageUrl'], foco: ['imageFocus'], ratio: 2 / 3, maximo: 900 },
];

const FOCOS = ['coverFocus', 'posterFocus', 'bannerFocus', 'thumbnailFocus', 'imageFocus'];

console.log('coleccion/campo        docs  con imagen  con encuadre  mirado por');

let totalImagen = 0;
let totalFoco = 0;

for (const t of OBJETIVO) {
  let docs;

  try {
    docs = await coleccion(t.coleccion);
  } catch (e) {
    console.log(`  ${t.coleccion}: no se ha podido leer (${e.message})`);

    continue;
  }

  let conImagen = 0;
  let conFoco = 0;

  for (const d of docs) {
    const img = t.imagen.find((c) => d.f[c]?.stringValue);

    if (!img) continue;

    conImagen++;

    const foco = t.foco.find((c) => d.f[c]);

    if (foco) conFoco++;
  }

  totalImagen += conImagen;
  totalFoco += conFoco;

  console.log(
    `  ${(t.coleccion + '/' + t.imagen.join('|')).padEnd(24)} ` +
      `${String(docs.length).padStart(4)} ${String(conImagen).padStart(11)} ` +
      `${String(conFoco).padStart(13)}  ${t.foco.join('/')}`,
  );
}

// Imágenes de la web que también llevan encuadre guardado.
let web = 0;

for (const col of ['siteSettings', 'settings']) {
  try {
    const docs = await coleccion(col);

    for (const d of docs) {
      if (FOCOS.some((k) => d.f[k])) web++;
    }
  } catch {
    // La colección puede no existir. No es un problema.
  }
}

console.log('');
console.log(`  Total con imagen: ${totalImagen}`);
console.log(`  Total con encuadre guardado (a migrar): ${totalFoco}`);

if (web) {
  console.log(`  Además, ${web} documento(s) de ajustes con encuadre guardado.`);
}

if (totalFoco === 0) {
  console.log('');
  console.log('  No hay nada que migrar: nadie ha guardado un encuadre a mano todavía.');
}