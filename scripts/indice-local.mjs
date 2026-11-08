// Lectura del índice estático para scripts de mantenimiento.
//
// Es una fuente de candidatos y relaciones, no una verdad absoluta:
// quien vaya a borrar o pisar un documento debe leer después su estado
// actual en Firestore.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const RUTA_GZ = path.join(RAIZ, 'public', 'busqueda', 'indice.json.gz');
const RUTA_JSON = path.join(RAIZ, 'public', 'busqueda', 'indice.json');

function normalizar(indice) {
  if (
    indice?.version !== 1 ||
    !Array.isArray(indice.animes) ||
    !Array.isArray(indice.episodes) ||
    !Array.isArray(indice.characters)
  ) {
    return null;
  }

  return {
    ...indice,
    seasons: Array.isArray(indice.seasons) ? indice.seasons : [],
    streaming: Array.isArray(indice.streaming) ? indice.streaming : [],
  };
}

export async function leerIndiceLocal() {
  try {
    const comprimido = await readFile(RUTA_GZ);
    return normalizar(JSON.parse(gunzipSync(comprimido).toString('utf8')));
  } catch {
    try {
      return normalizar(JSON.parse(await readFile(RUTA_JSON, 'utf8')));
    } catch {
      return null;
    }
  }
}
