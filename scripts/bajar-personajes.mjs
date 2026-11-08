// Baja las imagenes de los personajes de un anime para poder mirarlas.
//    node scripts/bajar-personajes.mjs <animeId> [cuantos]
//
// Igual que `bajar-miniaturas.mjs` pero con los personajes. Hace falta
// porque una imagen que responde puede ser la del personaje equivocado: a
// veces dos personajes tienen el mismo nombre de pila, y el emparejador
// coge el primero.
//
// El nombre japones va al lado del fichero, que es la parte que no cambia
// entre fuentes.

import { writeFile, mkdir } from 'node:fs/promises';
import { str } from './firestore-rest.mjs';
import { leerPorCampo } from './firestore-consultas.mjs';

const animeId = process.argv[2] ?? 'toradora';

const cuantas = Number(process.argv[3] ?? 12);

const CARPETA = 'C:/Users/Oscar/AppData/Local/Temp/opencode/personajes';

const mios = (
  await leerPorCampo({
    coleccion: 'characters',
    campo: 'animeId',
    valor: animeId,
    campos: ['animeId', 'name', 'japaneseName', 'imageUrl'],
  })
).filter((c) => str(c.f, 'imageUrl'));

if (!mios.length) {
  console.log(`"${animeId}" no tiene personajes con imagen`);

  process.exit(1);
}

await mkdir(CARPETA, { recursive: true });

let bajadas = 0;

// La lista con la que hay que mirar las imagenes: indice, nombre en
// espanol y nombre japones, que es la parte que no cambia entre fuentes.
const lista = mios.slice(0, cuantas);

console.log(`\n${animeId}: ${lista.length} personajes\n`);

for (const [i, c] of lista.entries()) {
  console.log(
    `  ${String(i + 1).padStart(3)}  ${String(str(c.f, 'name') ?? '').padEnd(28)}` +
      `${str(c.f, 'japaneseName') ?? ''}`,
  );
}

console.log('');

for (const c of lista) {
  // El nombre del fichero sale del indice, no del nombre del personaje.
//
// Un nombre con acentos o con la "ō" de "Kōta" produce un fichero que
// Windows no crea tal cual, y el script se come el error sin decir nada:
// de 25 personajes descargas solo 6. Con un indice correlativo no hay
// ningun caracter que pueda fallar, y el nombre va en un fichero aparte.
const indice = mios.indexOf(c) + 1;

const destino = `${CARPETA}/${animeId}-${String(indice).padStart(3, '0')}.jpg`;

  try {
    const r = await fetch(str(c.f, 'imageUrl'));

    if (!r.ok) throw new Error(String(r.status));

    await writeFile(destino, Buffer.from(await r.arrayBuffer()));

    bajadas++;

    console.log(`  ${destino.split('/').pop()}`);
  } catch (e) {
    console.log(`  ${nombre}  NO: ${e.message}`);
  }
}

console.log(`\n${bajadas} bajadas en ${CARPETA}`);