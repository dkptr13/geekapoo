// Los personajes de un anime, tal y como estan en Firestore.
//    node scripts/ver-personajes-base.mjs <animeId>
//
// `ver-capitulos-base.mjs` hace lo mismo con los capitulos. Este esta
// separado porque son colecciones distintas y porque los personajes
// tienen un campo mas que importa: la imagen.
//
// Un personaje sin `imageUrl` sale en la ficha con el marcador de
// posicion, que es lo que se ve si el anime esta bien.
//
// Se enseńa tambien el nombre japones, porque es el que permite
// emparejar con AniList: es la unica parte del nombre que no cambia
// entre fuentes.

import { coleccion, str, num } from './firestore-rest.mjs';

const animeId = process.argv[2];

if (!animeId) {
  console.error('  uso: node scripts/ver-personajes-base.mjs <animeId>');

  process.exit(1);
}

const personajes = await coleccion('characters');

const mios = personajes.filter((c) => str(c.f, 'animeId') === animeId);

if (!mios.length) {
  console.log(`no hay personajes de "${animeId}" en la coleccion`);

  process.exit(1);
}

const conImagen = mios.filter((c) => str(c.f, 'imageUrl') || str(c.f, 'image'));

console.log(`\n${animeId}: ${mios.length} personajes, ${conImagen.length} con imagen\n`);

for (const p of mios.sort((a, b) => String(str(a.f, 'name') ?? '').localeCompare(String(str(b.f, 'name') ?? '')))) {
  const imagen = str(p.f, 'imageUrl') || str(p.f, 'image');

  console.log(
    `  ${imagen ? 'img' : '---'}  ` +
      `${String(str(p.f, 'name') ?? '(sin nombre)').padEnd(30)}` +
      `${String(str(p.f, 'japaneseName') ?? '').padEnd(24)}` +
      `${str(p.f, 'role') ?? str(p.f, 'importance') ?? ''}`,
  );
}

const sinImagen = mios.filter((c) => !str(c.f, 'imageUrl') && !str(c.f, 'image'));

if (sinImagen.length) {
  console.log(`\n${sinImagen.length} sin imagen:`);

  for (const p of sinImagen) {
    console.log(`  ${str(p.f, 'name') ?? ''}  (${str(p.f, 'japaneseName') ?? ''})`);
  }
}