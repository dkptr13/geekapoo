/**
 * Genera `firestore.deploy.rules` a partir de `firestore.rules`.
 *
 * El compilador de Firestore cuenta TODO el texto enviado, incluidos
 * los comentarios, y rechaza el conjunto si supera los 262.144 bytes
 * ("Total size of sources must be smaller than 262144"). Las reglas
 * del proyecto están muy documentadas, así que el archivo fuente ya
 * no cabe aunque el código real sí.
 *
 * Este paso elimina los comentarios para el despliegue, pero mantiene
 * los saltos de línea: los errores del compilador siguen apuntando al
 * mismo número de línea que en `firestore.rules`. Las cadenas se
 * respetan escrupulosamente para no romper las URLs ni los textos que
 * contienen `//`.
 *
 * Uso:
 *   npm run rules:build
 *
 * `firebase.json` apunta a este archivo y ejecuta el script antes de
 * cada `firebase deploy --only firestore:rules`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const LIMITE = 262144;
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origen = path.join(raiz, 'firestore.rules');
const destino = path.join(raiz, 'firestore.deploy.rules');

const fuente = fs.readFileSync(origen, 'utf8');

let salida = '';
let i = 0;
let estado = 'codigo';

while (i < fuente.length) {
  const actual = fuente[i];
  const siguiente = fuente[i + 1];

  if (estado === 'codigo') {
    if (actual === '/' && siguiente === '/') {
      estado = 'linea';
      i += 2;
      continue;
    }
    if (actual === '/' && siguiente === '*') {
      estado = 'bloque';
      i += 2;
      continue;
    }
    if (actual === "'") {
      estado = 'simple';
      salida += actual;
      i += 1;
      continue;
    }
    if (actual === '"') {
      estado = 'doble';
      salida += actual;
      i += 1;
      continue;
    }
    salida += actual;
    i += 1;
    continue;
  }

  if (estado === 'linea') {
    if (actual === '\n') {
      salida += actual;
      estado = 'codigo';
    }
    i += 1;
    continue;
  }

  if (estado === 'bloque') {
    if (actual === '*' && siguiente === '/') {
      estado = 'codigo';
      i += 2;
      continue;
    }
    if (actual === '\n') salida += actual;
    i += 1;
    continue;
  }

  // Dentro de una cadena: se copia tal cual, incluidos los escapes.
  salida += actual;
  if (actual === '\\' && i + 1 < fuente.length) {
    salida += fuente[i + 1];
    i += 2;
    continue;
  }
  if ((estado === 'simple' && actual === "'") || (estado === 'doble' && actual === '"')) {
    estado = 'codigo';
  }
  i += 1;
}

if (estado !== 'codigo') {
  throw new Error(`El archivo termina dentro de un comentario o una cadena (${estado}).`);
}

const bytes = Buffer.byteLength(salida, 'utf8');
if (bytes >= LIMITE) {
  throw new Error(
    `Las reglas sin comentarios siguen superando el límite: ${bytes} bytes (máximo ${LIMITE}). ` +
      'Hay que dividir el archivo o recortar código.',
  );
}

fs.writeFileSync(destino, salida, 'utf8');
console.log(
  `Reglas para desplegar: ${path.basename(destino)} (${bytes} bytes, ` +
    `${LIMITE - bytes} de margen sobre ${LIMITE}).`,
);
