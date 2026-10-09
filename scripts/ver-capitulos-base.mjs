// Los capitulos de un anime tal y como estan en Firestore.
//    node scripts/ver-capitulos-base.mjs <animeId>
//
// `ver-temporadas.mjs` enseña la temporada; este enseña los capitulos,
// que es donde se ven los titulos y las notas.
//
// Hace falta para comprobar que una carga ha ido bien. Cuando se
// reescribe un fichero de datos y se vuelve a cargar con `--actualizar`,
// lo unico que demuestra que ha funcionado es leer lo que queda escrito.

import { coleccion, str, num } from './firestore-rest.mjs';

const animeId = process.argv[2];

if (!animeId) {
  console.error('  uso: node scripts/ver-capitulos-base.mjs <animeId>');

  process.exit(1);
}

const capitulos = await coleccion('episodes');

const mios = capitulos.filter((c) => str(c.f, 'animeId') === animeId);

if (!mios.length) {
  console.log(`no hay capitulos de "${animeId}"`);

  process.exit(1);
}

// Se ordena por temporada y numero. Los capitulos con numero "0.5" van
// antes que el 1, que es como los cuenta el catalogo.
const orden = (a, b) => {
  const ta = (str(a.f, 'seasonId') ?? '').match(/-s(\d+)$/)?.[1] ?? '0';
  const tb = (str(b.f, 'seasonId') ?? '').match(/-s(\d+)$/)?.[1] ?? '0';

  return Number(ta) - Number(tb) || (num(a.f, 'number') ?? 0) - (num(b.f, 'number') ?? 0);
};

mios.sort(orden);

console.log(`\n${animeId}: ${mios.length} capitulos\n`);

for (const c of mios) {
  const temporada = (str(c.f, 'seasonId') ?? '').match(/-s(\d+)$/)?.[1] ?? '?';

  const numero = num(c.f, 'number');

  const nota = str(c.f, 'rating');

  const mini = str(c.f, 'thumbnailUrl');

  console.log(
    `T${temporada} ${String(numero).padStart(5, ' ')}  ${String(nota ?? '-').padStart(4)}  ` +
      `${String(str(c.f, 'title') ?? '').padEnd(38)}${String(str(c.f, 'japaneseTitle') ?? '').padEnd(24)}` +
      `${str(c.f, 'airDate') ?? ''}  ${mini ? 'img' : '---'}`,
  );
}

const conImagen = mios.filter((c) => str(c.f, 'thumbnailUrl')).length;

console.log(`\n${conImagen} de ${mios.length} con miniatura`);