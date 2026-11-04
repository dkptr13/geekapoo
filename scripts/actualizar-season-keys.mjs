// Rellena `seasonKeys` en los personajes existentes.
//
//   node scripts/actualizar-season-keys.mjs            (simulación)
//   node scripts/actualizar-season-keys.mjs --escribir (escribe)
//
// `seasonKeys` es el campo consultable que usa la ficha para paginar
// personajes por temporada:
//
//   ['*']              → compartido, sale en todas
//   ['s1', 's3']       → solo en esas temporadas
//
// Es una desnormalización de `seasonIds`/`seasonId`. Solo se escribe
// ese campo; no se toca ningún otro.

import { arrayDe, coleccion, escribir, str } from './firestore-rest.mjs';

const ESCRIBIR = process.argv.includes('--escribir');

const personajes = await coleccion('characters', {
  select: ['name', 'seasonId', 'seasonIds', 'seasonKeys'],
});

function listaDe(doc, campo) {
  const values = doc?.f?.[campo]?.arrayValue?.values;
  return Array.isArray(values)
    ? values.map((v) => v.stringValue).filter((v) => typeof v === 'string' && v)
    : [];
}

let cambios = 0;
let iguales = 0;
let compartidos = 0;

for (const personaje of personajes) {
  const ids = listaDe(personaje, 'seasonIds');
  const antiguo = str(personaje, 'seasonId');
  const keys = ids.length > 0 ? ids : antiguo ? [antiguo] : ['*'];
  if (keys[0] === '*') compartidos += 1;

  const actuales = listaDe(personaje, 'seasonKeys');
  if (JSON.stringify(actuales) === JSON.stringify(keys)) {
    iguales += 1;
    continue;
  }

  console.log(
    `${personaje.id}: ${keys.join(', ')} — ${str(personaje, 'name') || personaje.id}`,
  );

  if (ESCRIBIR) {
    await escribir('characters', personaje.id, { seasonKeys: arrayDe(keys) }, ['seasonKeys']);
  }
  cambios += 1;
}

console.log(
  `\n${personajes.length} personajes. ${cambios} ${
    ESCRIBIR ? 'actualizados' : 'a actualizar'
  }; ${iguales} ya estaban bien; ${compartidos} compartidos.`,
);

if (!ESCRIBIR) {
  console.log('Simulación. Vuelve a ejecutarlo con --escribir para guardar.');
}
