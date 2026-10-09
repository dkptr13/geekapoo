// Descarga las miniaturas de un anime y las guarda como imagenes.
//    node scripts/bajar-miniaturas.mjs <animeId> [cuantas]
//
// `mirar-miniaturas.mjs` monta un HTML para que las mire una persona. Esto
// es para que las mire el script: descarga los ficheros a disco y de ahi
// se pueden abrir y mirar de verdad, una por una.
//
// La razon de tener las dos cosas es que una imagen que se descarga bien
// puede estar en el capitulo equivocado. Que la URL responda 200 no dice
// nada del capitulo: por eso hace falta verlas.

import { writeFile, mkdir } from 'node:fs/promises';
import { coleccion, str, num } from './firestore-rest.mjs';

const animeId = process.argv[2] ?? 'grand-blue';

const cuantas = Number(process.argv[3] ?? 12);

const CARPETA = 'C:/Users/Oscar/AppData/Local/Temp/opencode/miniaturas';

const capitulos = await coleccion('episodes');

const mios = capitulos
  .filter((c) => str(c.f, 'animeId') === animeId && str(c.f, 'thumbnailUrl'))
  .sort((a, b) => {
    const ta = (str(a.f, 'seasonId') ?? '').match(/-s(\d+)$/)?.[1] ?? '0';
    const tb = (str(b.f, 'seasonId') ?? '').match(/-s(\d+)$/)?.[1] ?? '0';

    return Number(ta) - Number(tb) || (num(a.f, 'number') ?? 0) - (num(b.f, 'number') ?? 0);
  })
  .slice(0, cuantas);

if (!mios.length) {
  console.log(`"${animeId}" no tiene capitulos con miniatura`);

  process.exit(1);
}

await mkdir(CARPETA, { recursive: true });

let bajadas = 0;
let falladas = 0;

for (const c of mios) {
  const temporada = (str(c.f, 'seasonId') ?? '').match(/-s(\d+)$/)?.[1] ?? '?';

  const numero = num(c.f, 'number');

  const nombre = `${animeId}-t${temporada}-e${String(numero).replace('.', '_')}.jpg`;

  const destino = `${CARPETA}/${nombre}`;

  try {
    const r = await fetch(str(c.f, 'thumbnailUrl'));

    if (!r.ok) throw new Error(String(r.status));

    await writeFile(destino, Buffer.from(await r.arrayBuffer()));

    bajadas++;
    console.log(`  ${nombre}`);
  } catch (e) {
    falladas++;

    console.log(`  ${nombre}  NO: ${e.message}`);
  }
}

console.log(`\n${bajadas} bajadas, ${falladas} falladas, en ${CARPETA}`);