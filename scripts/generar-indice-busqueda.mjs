// ======================================================
// ÍNDICE LIGERO DE BÚSQUEDA
// ======================================================
// Firestore no hace búsqueda de subcadenas. Este script genera un JSON
// con los campos que necesita el buscador y lo deja en
// `public/busqueda/indice.json`, servido como archivo estático.
//
//   npm run index:buscar
//     Reconstrucción completa explícita.
//
//   npm run index:buscar -- --only episodes
//   npm run index:buscar -- --only episodes,characters
//     Actualiza solo esas colecciones usando el índice anterior como base.
//
//   npm run index:buscar -- --only episodes --anime ataque-a-los-titanes
//     Actualiza solo ese anime. El slug se resuelve contra el id real.
//
//   npm run index:buscar -- --only streamingAvailability
//     Actualiza únicamente la disponibilidad.
//
// El prebuild no usa este comando: llama con `--cache` para reutilizar
// el `.gz` versionado y no leer Firestore.
//
// La escritura es todo-o-nada: primero se generan y validan todos los
// artefactos temporales; solo después se sustituyen los anteriores.
// Si algo falla, se conserva la versión previa.

import { copyFile, mkdir, readFile, rename, stat, unlink, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync, gzipSync } from 'node:zlib';

import {
  CAMPOS,
  CLAVE_INDICE,
  SECCIONES,
  TRANSFORMADORES,
  crearIndice,
  esIndiceValido,
  fusionarSeccion,
  mapaDeStreaming,
  mapaDeTemporadas,
  normalizarIndice,
  ordenarIndice,
  resolverAnimeIds,
  validarIndice,
} from './indice-busqueda-logic.mjs';
import {
  leerPorCampo,
  leerPorIds,
  resolverAnime,
} from './firestore-consultas.mjs';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SALIDA = path.join(RAIZ, 'public', 'busqueda', 'indice.json');
const SALIDA_GZ = `${SALIDA}.gz`;
const SALIDA_ANIMES = path.join(RAIZ, 'public', 'busqueda', 'animes.json');
const SALIDA_TEMPORADAS = path.join(RAIZ, 'public', 'busqueda', 'temporadas.json');
const SALIDA_STREAMING = path.join(RAIZ, 'public', 'busqueda', 'streaming.json');
const PROYECTO = process.env.VITE_FIREBASE_PROJECT_ID || 'geekapoo-7624d';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROYECTO}/databases/(default)/documents`;

const args = process.argv.slice(2);

const valoresAnime = args
  .flatMap((arg, i) => (arg === '--anime' ? (args[i + 1] ?? '').split(',') : []))
  .map((item) => item.trim())
  .filter(Boolean);

const onlyArg = args
  .flatMap((arg, i) => (arg === '--only' ? (args[i + 1] ?? '').split(',') : []))
  .map((item) => item.trim())
  .filter(Boolean);

const full = args.includes('--full') || args.includes('--refresh');
const cache = args.includes('--cache');
const dryRun = args.includes('--dry-run');

const ALIAS_SECCIONES = {
  animes: 'animes',
  seasons: 'seasons',
  episodes: 'episodes',
  characters: 'characters',
  streamingAvailability: 'streamingAvailability',
  streaming: 'streamingAvailability',
};

const only = [...new Set(onlyArg.map((nombre) => ALIAS_SECCIONES[nombre]).filter(Boolean))];
const onlyInvalidas = onlyArg.filter((nombre) => !ALIAS_SECCIONES[nombre]);

if (onlyInvalidas.length) {
  console.error(`  --only no reconoce: ${onlyInvalidas.join(', ')}`);
  console.error(`  válidos: ${SECCIONES.join(', ')}`);
  process.exit(1);
}
if (full && only.length) {
  console.error('  --full y --only no se pueden usar juntos.');
  process.exit(1);
}
if (cache && (full || only.length || valoresAnime.length)) {
  console.error('  --cache es interno del prebuild; no se mezcla con --full, --only ni --anime.');
  process.exit(1);
}
if (full && valoresAnime.length) {
  console.error('  --full no se puede combinar con --anime.');
  process.exit(1);
}
if (valoresAnime.length && !only.length && !full) {
  console.error('  --anime necesita --only (por ejemplo: --only episodes --anime one-piece).');
  process.exit(1);
}
if (args.includes('--only') && onlyArg.length === 0) {
  console.error('  --only necesita al menos una colección.');
  process.exit(1);
}
if (args.includes('--anime') && valoresAnime.length === 0) {
  console.error('  --anime necesita al menos un id o slug.');
  process.exit(1);
}

const stats = {
  consultas: 0,
  paginas: 0,
  documentos: 0,
  transformados: 0,
  secciones: new Set(),
};

const inicio = Date.now();

function sumarStats(destino, origen) {
  destino.consultas += origen.consultas ?? 0;
  destino.paginas += origen.paginas ?? 0;
  destino.documentos += origen.documentos ?? 0;
}

function logStats(etiqueta) {
  console.log(
    `  [${etiqueta}] consultas=${stats.consultas} páginas=${stats.paginas} ` +
      `documentos=${stats.documentos} transformados=${stats.transformados}`,
  );
}

async function leerColeccionCompleta(coleccionNombre, campos, metricas) {
  const docs = [];
  let token = '';
  let paginas = 0;

  do {
    const url = new URL(`${BASE}/${coleccionNombre}`);
    url.searchParams.set('pageSize', '300');
    for (const campo of campos) {
      url.searchParams.append('mask.fieldPaths', campo);
    }
    if (token) url.searchParams.set('pageToken', token);

    const respuesta = await fetch(url);
    if (!respuesta.ok) {
      throw new Error(`${coleccionNombre}: HTTP ${respuesta.status}`);
    }

    const datos = await respuesta.json();
    paginas += 1;

    for (const doc of datos.documents ?? []) {
      docs.push({
        id: doc.name.split('/').pop(),
        f: doc.fields ?? {},
        actualizado: doc.updateTime ?? '',
      });
    }
    token = datos.nextPageToken ?? '';
  } while (token);

  metricas.consultas += paginas;
  metricas.paginas += paginas;
  metricas.documentos += docs.length;

  return docs;
}

function transformar(coleccionNombre, docs) {
  const transformador = TRANSFORMADORES[coleccionNombre];
  if (!transformador) throw new Error(`No hay transformador para ${coleccionNombre}.`);

  return docs
    .map(transformador)
    .filter((fila) => fila.id)
    .filter((fila) => {
      if (coleccionNombre === 'animes') return Boolean(fila.title);
      if (coleccionNombre === 'episodes') return Boolean(fila.animeId && fila.title);
      if (coleccionNombre === 'characters') return Boolean(fila.animeId && fila.name);
      if (coleccionNombre === 'seasons') return Boolean(fila.animeId);
      if (coleccionNombre === 'streamingAvailability') {
        return Boolean(fila.animeId && fila.platformId && fila.region);
      }
      return true;
    });
}

async function leerBase() {
  const comprimido = await readFile(SALIDA_GZ);
  const texto = gunzipSync(comprimido).toString('utf8');
  const indice = JSON.parse(texto);

  if (!esIndiceValido(indice)) {
    throw new Error('El índice comprimido no tiene la versión o las secciones esperadas.');
  }

  const normalizado = normalizarIndice(indice);
  const validacion = validarIndice(normalizado);
  if (!validacion.ok) {
    throw new Error(`El índice base no es válido: ${validacion.errores[0]}`);
  }

  return {
    indice: normalizado,
    comprimido,
    huella: createHash('sha256').update(comprimido).digest('hex').slice(0, 16),
    tamano: comprimido.length,
  };
}

function compararSeccion(antes, despues) {
  const mapaAntes = new Map((antes ?? []).map((fila) => [fila.id, fila]));
  const mapaDespues = new Map((despues ?? []).map((fila) => [fila.id, fila]));

  let nuevos = 0;
  let modificados = 0;
  let eliminados = 0;
  let conservados = 0;

  for (const [id, fila] of mapaDespues) {
    const anterior = mapaAntes.get(id);
    if (!anterior) {
      nuevos += 1;
    } else if (JSON.stringify(anterior) !== JSON.stringify(fila)) {
      modificados += 1;
    } else {
      conservados += 1;
    }
  }

  for (const id of mapaAntes.keys()) {
    if (!mapaDespues.has(id)) eliminados += 1;
  }

  return { nuevos, modificados, eliminados, conservados };
}

async function resolverSeleccion(base) {
  const ids = new Set();
  const noEncontrados = [];

  for (const valor of valoresAnime) {
    const locales = resolverAnimeIds(base.indice, [valor]);
    if (locales.length) {
      locales.forEach((id) => ids.add(id));
      continue;
    }

    const doc = await resolverAnime({ valor, stats });
    if (!doc) {
      noEncontrados.push(valor);
      continue;
    }
    ids.add(doc.id);
  }

  if (noEncontrados.length) {
    throw new Error(
      `No se encontró el anime: ${noEncontrados.join(', ')}. ` +
        'Comprueba el id o el slug.',
    );
  }

  return [...ids];
}

async function leerSeccion(seccion, animeIds) {
  const usarFiltro = animeIds && animeIds.length > 0;

  if (!usarFiltro) {
    const docs = await leerColeccionCompleta(seccion, CAMPOS[seccion], stats);
    return transformar(seccion, docs);
  }

  if (seccion === 'animes') {
    const docs = await leerPorIds({
      coleccion: 'animes',
      ids: animeIds,
      stats,
    });
    return transformar(seccion, docs);
  }

  const docs = await leerPorCampo({
    coleccion: seccion,
    campo: 'animeId',
    valor: animeIds,
    campos: CAMPOS[seccion],
    stats,
  });

  return transformar(seccion, docs);
}

function contenidoArtefactos(indice) {
  const serializado = JSON.stringify(indice);
  const comprimido = gzipSync(Buffer.from(serializado, 'utf8'));

  const artefactos = [
    { ruta: SALIDA, contenido: serializado, validarJson: true },
    { ruta: SALIDA_GZ, contenido: comprimido, validarJson: false },
    { ruta: SALIDA_ANIMES, contenido: JSON.stringify(indice.animes), validarJson: true },
    {
      ruta: SALIDA_TEMPORADAS,
      contenido: JSON.stringify(mapaDeTemporadas(indice.animes, indice.seasons)),
      validarJson: true,
    },
    {
      ruta: SALIDA_STREAMING,
      contenido: JSON.stringify(mapaDeStreaming(indice.animes, indice.streaming)),
      validarJson: true,
    },
  ];

  // La copia comprimida tiene que ser exactamente la misma información.
  const descomprimido = gunzipSync(comprimido).toString('utf8');
  if (descomprimido !== serializado) {
    throw new Error('El gzip generado no coincide con el JSON.');
  }

  for (const artefacto of artefactos) {
    if (artefacto.validarJson) JSON.parse(artefacto.contenido);
  }

  return { serializado, comprimido, artefactos };
}

/**
 * Publica todos los artefactos con copia previa.
 *
 * Escribe primero los temporales; si alguno falla, no toca los
 * originales. Después guarda una copia de cada original y renombra los
 * temporales. Si un renombrado falla, restaura las copias.
 */
async function publicarArtefactos(artefactos, { incluirGz = true } = {}) {
  await mkdir(path.dirname(SALIDA), { recursive: true });

  const seleccionados = incluirGz
    ? artefactos
    : artefactos.filter((artefacto) => artefacto.ruta !== SALIDA_GZ);

  const sufijo = `${process.pid}-${Date.now()}`;
  const temporales = [];
  const copias = [];
  const publicados = [];

  const limpiarTemporales = async () => {
    for (const temporal of temporales) {
      await unlink(temporal.ruta).catch(() => {});
    }
  };

  try {
    for (const artefacto of seleccionados) {
      const temporal = `${artefacto.ruta}.tmp-${sufijo}`;
      await writeFile(temporal, artefacto.contenido);
      temporales.push({ ruta: temporal, destino: artefacto.ruta });
    }

    for (const temporal of temporales) {
      const copia = `${temporal.destino}.bak-${sufijo}`;
      const existe = await stat(temporal.destino)
        .then(() => true)
        .catch(() => false);

      if (existe) {
        await copyFile(temporal.destino, copia);
        copias.push({ copia, destino: temporal.destino });
      }

      await rename(temporal.ruta, temporal.destino);
      publicados.push(temporal.destino);
    }

    for (const { copia } of copias) await unlink(copia).catch(() => {});
  } catch (error) {
    await limpiarTemporales();

    for (const { copia, destino } of copias) {
      await copyFile(copia, destino).catch(() => {});
      await unlink(copia).catch(() => {});
    }

    // Si ya se había publicado alguno, la copia lo devuelve al estado
    // anterior.
    for (const destino of publicados) {
      const copia = copias.find((item) => item.destino === destino);
      if (copia) await copyFile(copia.copia, destino).catch(() => {});
    }

    throw error;
  }
}

async function publicarCache(base) {
  const indice = base.indice;
  const { artefactos } = contenidoArtefactos(indice);

  await publicarArtefactos(artefactos, { incluirGz: false });

  console.log(
    `indice-busqueda: usa cache local (${indice.animes.length} animes, ` +
      `${indice.seasons.length} temporadas, ${indice.streaming.length} filas de streaming, ` +
      `${indice.episodes.length} episodios, ${indice.characters.length} personajes)`,
  );
}

async function generarCompleto() {
  const secciones = {};
  for (const seccion of SECCIONES) {
    const filas = await leerSeccion(seccion, null);
    secciones[CLAVE_INDICE[seccion]] = filas;
    stats.transformados += filas.length;
    stats.secciones.add(seccion);
  }

  const indice = crearIndice({
    animes: secciones.animes,
    seasons: secciones.seasons,
    episodes: secciones.episodes,
    characters: secciones.characters,
    streaming: secciones.streaming,
  });

  indice.meta = {
    esquema: 1,
    actualizado: indice.generado,
    tipo: 'full',
    parcial: false,
    colecciones: [...SECCIONES],
    actualizaciones: [...SECCIONES],
    baseGenerado: null,
    baseHuella: null,
  };

  return indice;
}

async function generarIncremental(base) {
  const indiceBase = base.indice;
  const animeIds = valoresAnime.length ? await resolverSeleccion(base) : null;
  let seccionesActualizar = [...only];
  let motivoDependencia = null;

  // Si el anime no estaba en el índice y se pide otra colección, hay
  // que añadir su ficha para que las relaciones no queden huérfanas.
  if (animeIds) {
    const conocidos = new Set(indiceBase.animes.map((anime) => anime.id));
    const faltan = animeIds.filter((id) => !conocidos.has(id));
    if (faltan.length && !seccionesActualizar.includes('animes')) {
      seccionesActualizar.push('animes');
      motivoDependencia =
        `Se añade animes porque ${faltan.join(', ')} no estaba en el índice base.`;
    }
  }

  let indice = { ...indiceBase };
  const comparaciones = {};

  for (const seccion of seccionesActualizar) {
    const antes = indice[CLAVE_INDICE[seccion]] ?? [];
    const filas = await leerSeccion(seccion, animeIds);
    stats.transformados += filas.length;
    stats.secciones.add(seccion);

    indice = fusionarSeccion(indice, seccion, filas, animeIds);
    const despues = indice[CLAVE_INDICE[seccion]] ?? [];
    comparaciones[seccion] = compararSeccion(antes, despues);
  }

  indice = ordenarIndice({
    ...indice,
    generado: new Date().toISOString(),
    version: 1,
  });

  indice.meta = {
    esquema: 1,
    actualizado: indice.generado,
    tipo: 'incremental',
    parcial: true,
    colecciones: seccionesActualizar,
    actualizaciones: seccionesActualizar,
    baseGenerado: indiceBase.generado ?? null,
    baseHuella: base.huella,
    motivoDependencia,
  };

  return { indice, comparaciones, seccionesActualizar };
}

async function main() {
  if (cache) {
    try {
      const base = await leerBase();
      if (!dryRun) await publicarCache(base);
      console.log(
        `  Índice estático ${dryRun ? 'validado (dry-run)' : 'reutilizado'}; ` +
          'no se ha leído Firestore.',
      );
      return;
    } catch (error) {
      console.warn(
        `  No se pudo reutilizar el índice (${error.message}); se reconstruye completo.`,
      );
    }
  }

  if (full || (!only.length && !valoresAnime.length)) {
    const indice = await generarCompleto();
    const validacion = validarIndice(indice);
    if (!validacion.ok) {
      throw new Error(`Índice completo inválido: ${validacion.errores[0]}`);
    }
    if (validacion.avisos.length) {
      console.warn(`  Avisos de integridad: ${validacion.avisos.length}`);
    }

    const { serializado, comprimido, artefactos } = contenidoArtefactos(indice);
    if (!dryRun) await publicarArtefactos(artefactos);
    console.log(
      `indice-busqueda: completo${dryRun ? ' (dry-run)' : ''} · ${indice.animes.length} animes, ` +
        `${indice.seasons.length} temporadas, ${indice.streaming.length} streaming, ` +
        `${indice.episodes.length} episodios, ${indice.characters.length} personajes`,
    );
    console.log(
      `  JSON ${Math.round(Buffer.byteLength(serializado) / 1024)} KB · ` +
        `gzip ${Math.round(comprimido.length / 1024)} KB · ` +
        `${Math.round((Date.now() - inicio) / 1000)} s`,
    );
    logStats('lectura');
    return;
  }

  if (!only.length) {
    throw new Error('Indica --only <colección> o --full.');
  }

  const base = await leerBase();
  const { indice, comparaciones, seccionesActualizar } = await generarIncremental(base);

  const validacion = validarIndice(indice);
  if (!validacion.ok) {
    throw new Error(`Índice incremental inválido: ${validacion.errores[0]}`);
  }
  if (validacion.avisos.length) {
    console.warn(`  Avisos de integridad: ${validacion.avisos.length}`);
  }

  const { serializado, comprimido, artefactos } = contenidoArtefactos(indice);
  if (!dryRun) await publicarArtefactos(artefactos);

  console.log(
    `indice-busqueda: incremental${dryRun ? ' (dry-run)' : ''} · ${seccionesActualizar.join(', ')}` +
      (indice.meta.motivoDependencia ? ` · ${indice.meta.motivoDependencia}` : ''),
  );
  console.log(
    `  ${indice.animes.length} animes, ${indice.seasons.length} temporadas, ` +
      `${indice.streaming.length} streaming, ${indice.episodes.length} episodios, ` +
      `${indice.characters.length} personajes`,
  );

  for (const [seccion, cambios] of Object.entries(comparaciones)) {
    console.log(
      `  ${seccion}: +${cambios.nuevos} ~${cambios.modificados} ` +
        `-${cambios.eliminados} =${cambios.conservados}`,
    );
  }

  console.log(
    `  JSON ${Math.round(Buffer.byteLength(serializado) / 1024)} KB · ` +
      `gzip ${Math.round(comprimido.length / 1024)} KB · ` +
      `${Math.round((Date.now() - inicio) / 1000)} s`,
  );
  logStats('lectura');
}

main().catch((error) => {
  console.error(`\nNo se pudo generar el índice: ${error.message}`);
  console.error('Se conserva el índice anterior.');
  process.exitCode = 1;
});
