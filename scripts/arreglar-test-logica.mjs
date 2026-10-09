// Anade una comprobacion al script de pruebas de logica.
//    node scripts/arreglar-test-logica.mjs <nombre-del-fichero>
//
// Sin esto, añadir una comprobacion es editar el `package.json` a mano,
// que es una forma facil de romperlo sin enterarse: si el fichero nuevo
// no existe o esta mal escrito, el script entero deja de funcionar y
 // `npm run test:logica` no dice ni cual de los muchos fallo.

import { readFile, writeFile } from 'node:fs/promises';

const nuevo = process.argv[2];

if (!nuevo) {
  console.error('  uso: node scripts/arreglar-test-logica.mjs <nombre-del-fichero>');

  process.exit(1);
}

if (!/^tests\/logica\.[a-z]+\.ts$/.test(nuevo)) {
  console.error(`  "${nuevo}" no parece un fichero de comprobaciones`);

  process.exit(1);
}

const RUTA = new URL('../package.json', import.meta.url);
const texto = await readFile(RUTA, 'utf8');

if (texto.includes(nuevo)) {
  console.log('  ya esta anadida');

  process.exit(0);
}

const ANCLA = 'tsx tests/logica.etiquetas.ts';

if (!texto.includes(ANCLA)) {
  console.error('  no encuentro el final del script de pruebas');

  process.exit(1);
}

// El nombre que se pasa ya viene con la ruta (`tests/logica.x.ts`), pero
// el script lo ejecuta con `tsx`, y ese prefijo hay que ponerlo aqui: si
// se pasa tal cual, npm intenta ejecutar el fichero con el nombre y falla
// con un error de Windows que no tiene nada que ver con la comprobacion
// que se queria añadir.
await writeFile(RUTA, texto.replace(ANCLA, `${ANCLA} && tsx ${nuevo}`), 'utf8');

const despues = JSON.parse(await readFile(RUTA, 'utf8'));

if (!despues.scripts['test:logica'].includes(nuevo)) {
  console.error('  el cambio no se aplico');

  process.exit(1);
}

console.log(`  anadida ${nuevo}`);

console.log('  el JSON sigue siendo valido');
