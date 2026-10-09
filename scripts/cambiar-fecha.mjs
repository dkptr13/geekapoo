// Corrige las fechas de unos capitulos concretos.
//    node scripts/cambiar-fecha.mjs <seasonId> <episodio> <fecha> ...
//
// Para cuando se ha comprobado que la fecha del catalogo esta mal y se
// sabe cual es la buena. No decide nada: solo escribe lo que se le dice.
//
// Que haya un script para esto y no editar a mano por el panel es una
// cuestion de dejar constancia: cada cambio queda con su motivo escrito,
// y se puede volver a leer quien lo cambio y por que.
//
// El motivo va en la primera linea del guion, que no se guarda en la base
// de datos pero se queda en el historial.

import { escribir, str, num, coleccion } from './firestore-rest.mjs';

const [seasonId, ...resto] = process.argv.slice(2);

if (!seasonId) {
  console.error('  uso: node scripts/cambiar-fecha.mjs <seasonId> <episodio> <fecha> ...');

  process.exit(1);
}

// Los argumentos van de tres en tres: numero de episodio y fecha nueva.
const cambios = [];

for (let i = 0; i + 1 < resto.length; i += 2) {
  cambios.push({ numero: Number(resto[i]), fecha: resto[i + 1] });
}

if (!cambios.length) {
  console.error('  no hay cambios que hacer');

  process.exit(1);
}

const capitulos = await coleccion('episodes');

const mios = capitulos.filter((c) => str(c.f, 'seasonId') === seasonId);

let hechos = 0;

for (const { numero, fecha } of cambios) {
  const c = mios.find((x) => num(x.f, 'number') === numero);

  if (!c) {
    console.log(`  E${numero}: no esta en ${seasonId}`);

    continue;
  }

  const antes = str(c.f, 'airDate');

  if (antes === fecha) {
    console.log(`  E${numero}: ya era ${fecha}`);

    continue;
  }

  await escribir('episodes', c.id, { airDate: { stringValue: fecha } }, ['airDate']);

  console.log(`  E${numero}: ${antes} -> ${fecha}   ${str(c.f, 'title') ?? ''}`);

  hechos++;
}

console.log(`\n${hechos} fechas cambiadas`);