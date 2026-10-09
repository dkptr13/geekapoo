// Pone el reparto de temporadas de un anime a partir de una tabla, sin
// tocar el resto de campos del personaje.
//
//   node scripts/corregir-reparto.mjs <animeId> <fichero.json>
//
// El fichero JSON es un objeto:
//   { "Nombre del personaje": "1,3" }
//
// ...donde el valor son las temporadas separadas por comas, y `""` significa
// "en todas" (que en el modelo es un array vacio, no lo mismo que "1,3").
//
// ── POR QUE ESTE SCRIPT Y NO `cargar-anime.mjs --actualizar` ──────
//
// Porque este hace un PATCH de TODOS los campos, incluido `createdAt`, y
// ademas reconstruye el id del personaje por slug. Los personajes subidos
// por el panel tienen id autogenerado (`QGZl4W3k7zSmz2Gii6cb`,
// `char-kaguya`...), no slug: con ese script se crearian duplicados vacios
// en vez de corregir los que ya hay.
//
// Aqui se busca el personaje por NOMBRE dentro del anime, que es como se
// conoce, y se parchea solo `seasonIds` con su mascara de un campo.
//
// ── POR QUE HACE FALTA ──────────────────────────────────────────
//
// `verificar-anime.mjs` compara Firestore contra los ficheros de datos. Si
// los dos estan mal, dice que todo esta bien. Este script es para
// cuando ya se ha comprobado contra el anime real cual es el reparto
// correcto y hay que levar ese dato a Firestore.

import { readFileSync } from 'node:fs';
import { tokenDeAcceso } from './token-firebase.mjs';

const [, , animeId, fichero] = process.argv;

if (!animeId || !fichero) {
  console.error('  uso: node scripts/corregir-reparto.mjs <animeId> <reparto.json>');
  process.exit(1);
}

// El BOM se quita aqui porque `Set-Content -Encoding utf8` en PowerShell 5
// lo pone, y ahi adelante el fichero con `import` lo lee UTF-8 con BOM y
// eso no lo traga.
const reparto = JSON.parse(readFileSync(fichero, 'utf8').replace(/^﻿/, ''));

const token = await tokenDeAcceso();
const BASE = `https://firestore.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID || 'geekapoo-7624d'}/databases/(default)/documents`;
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

/** Todos los personajes de la coleccion, con su id real. */
async function personajes() {
  const salida = [];
  let pagina = null;

  do {
    const url = `${BASE}/characters?pageSize=1000${pagina ? `&pageToken=${pagina}` : ''}`;
    const r = await fetch(url, { headers });
    if (!r.ok) return salida;

    const d = await r.json();
    salida.push(
      ...(d.documents ?? []).map((x) => ({
        id: x.name.split('/').pop(),
        f: x.fields,
      })),
    );
    pagina = d.nextPageToken ?? null;
  } while (pagina);

  return salida;
}

const todos = await personajes();
const delAnime = todos.filter((p) => p.f.animeId?.stringValue === animeId);

console.log(`${animeId}: ${delAnime.length} personajes en Firestore, ${Object.keys(reparto).length} en la tabla\n`);

/** Ids de temporada que existen de verdad, para no apuntar al vacio. */
const idsTemporada = new Set();

{
  let pagina = null;
  do {
    const url = `${BASE}/seasons?pageSize=1000${pagina ? `&pageToken=${pagina}` : ''}`;
    const r = await fetch(url, { headers });
    const d = await r.json();
    for (const x of d.documents ?? []) idsTemporada.add(x.name.split('/').pop());
    pagina = d.nextPageToken ?? null;
  } while (pagina);
}

let corregidos = 0;
let iguales = 0;
let avisos = 0;

for (const [nombre, temporadas] of Object.entries(reparto)) {
  const p = delAnime.find((x) => x.f.name?.stringValue === nombre);

  if (!p) {
    console.log(`  AVISO  "${nombre}" no esta en Firestore (no se toca nada)`);
    avisos++;
    continue;
  }

  const lista = temporadas === '' ? [] : temporadas.split(',').map((n) => `${animeId}-s${n}`);

  // Si la temporada no existe, avisar en vez de escribir un id roto: la
  // wiki no lo encontraria y el personaje se quedaria sin Seasons.
  const rota = lista.filter((id) => !idsTemporada.has(id));

  if (rota.length) {
    console.log(`  AVISO  "${nombre}": temporada(s) sin documento ${rota.join(', ')}`);
    avisos++;
  }

  const antes = (p.f.seasonIds?.arrayValue?.values ?? []).map((v) => v.stringValue);

  const yaEsta =
    antes.length === lista.length && [...antes].sort().join(',') === [...lista].sort().join(',');

  if (yaEsta) {
    iguales++;
    continue;
  }

  const r = await fetch(`${BASE}/characters/${p.id}?updateMask.fieldPaths=seasonIds`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      fields: { seasonIds: { arrayValue: { values: lista.map((id) => ({ stringValue: id })) } } },
    }),
  });

  corregidos++;

  const fmt = (xs) => (xs.length ? xs.map((x) => x.replace(`${animeId}-s`, '')).join(',') : 'todas');

  console.log(`  ${nombre}: [${fmt(antes)}] -> [${fmt(lista)}]${r.ok ? '' : ` ERROR ${r.status}`}`);
}

console.log(`\n${corregidos} corregidos, ${iguales} ya estaban bien, ${avisos} avisos`);