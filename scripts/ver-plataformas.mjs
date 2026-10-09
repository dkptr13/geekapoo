// Que animes tienen plataformas declaradas en el fichero y cuales las
// tienen ya puestas en Firestore.
//    node scripts/ver-plataformas.mjs
//
// ── PARA QUE ESTE SCRIPT ───────────────────────────────────────
//
// `STREAMING` esta en `datos/<prefijo>-meta.mjs` y `anadir-plataformas.mjs`
// lo sube a Firestore, pero nada obliga a que se hayan hecho las dos
// cosas: un anime puede tener la lista escrita en el fichero y el
// campo `streaming` vaciado, porque son dos pasos separados y el
// segundo es opcional.
//
// Que va a pasar. Chainsaw Man tenia la lista en el fichero y el
// campo vacio, y solo se vio al mirar el documento. Este script dice
// eso de golpe, para los animes que haya, sin abrir 14 ficheros.

import { readdir } from 'node:fs/promises';

import { coleccion, str } from './firestore-rest.mjs';

const BASE = new URL('./datos/', import.meta.url);

const ficheros = (await readdir(BASE))
  .filter((n) => n.endsWith('-meta.mjs'))
  .map((n) => n.replace('-meta.mjs', ''))
  .sort();

const animes = await coleccion('animes');

const plataformaDe = (doc) => {
  const v = doc?.f?.streaming;

  if (!v) return [];

  const values = v.arrayValue?.values ?? [];
  return values.map((p) => p.mapValue?.fields?.name?.stringValue ?? '?');
};

const enBase = new Map(animes.map((a) => [a.id, a]));

const faltan = [];

for (const prefijo of ficheros) {
  const mod = await import(new URL(`${prefijo}-meta.mjs`, BASE));
  const declarados = (mod.STREAMING ?? []).map((p) => p.name);
  const animeId = mod.ANIME_ID ?? prefijo;
  const puestas = plataformaDe(enBase.get(animeId));

  const declaradas = declarados.length > 0 ? 'si' : 'NO';
  const enFirestore = puestas.length > 0 ? String(puestas.length) : 'VACIO';

  const misma =
    declarados.length === puestas.length && declarados.every((n) => puestas.includes(n));

  console.log(
    `  ${animeId.padEnd(34)} fichero: ${declaradas.padEnd(3)}  base: ${enFirestore.padEnd(6)} ` +
      (declarados.length === 0 ? '' : misma ? 'cuadra' : 'DIFIERE'),
  );

  if (declarados.length > 0 && puestas.length === 0) faltan.push(prefijo);
}

console.log('');
console.log(`  ${ficheros.length} animes, ${faltan.length} con la lista escrita pero sin subir`);

if (faltan.length) console.log(`  faltan: ${faltan.join(' ')}`);