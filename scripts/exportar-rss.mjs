// Marca lo que `index.ts` necesita de este fichero y limpia lo que no.
//
// Los helpers se exportan uno a uno, con `export` delante de la
// palabra clave, en vez de un `export { ... }` al final del fichero: se
// ve de un vistazo qué es parte de la API y qué es detalle interno.

import { readFile, writeFile } from 'node:fs/promises';

const RUTA = new URL('../functions/src/rss.ts', import.meta.url);

const texto = await readFile(RUTA, 'utf8');

const EXPORTABLES = [
  'interface FuenteRss',
  'const FUENTES_RSS',
  'const MAX_NOTICIAS_GUARDADAS',
  'const RESUMEN_MAX',
  'interface Noticia',
  'function idDeNoticia',
  'function limpiarResumen',
  'function recortarResumen',
  'async function leerFeed',
];

// `NEWS` se queda aqui porque el nombre de la coleccion es de este
// modulo, y `podar` NO se exporta: borra, y para borrar hace falta el
// Admin SDK, que es lo unico que este fichero no carga.

let salida = texto;

 for (const pieza of EXPORTABLES) {
  const antes = salida;

  // Se busca SOLO al principio de una linea, y sin mirar lo que venga
  // despues. Entre el nombre y el resto de la declaracion hay tipos
  // ("const FUENTES_RSS: FuenteRss[] = ["), asi que buscar el nombre
  // seguido de un espacio no encuentra nada.
  salida = salida.replace(new RegExp(`^${pieza}`, 'm'), `export ${pieza}`);

  if (salida === antes) {
    console.error(`  no encuentro "${pieza}" para exportarlo`);

    process.exit(1);
  }
}

await writeFile(RUTA, salida, 'utf8');

console.log(`  exportados ${EXPORTABLES.length} símbolos de rss.ts`);
