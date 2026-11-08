/**
 * Contratos del importador de disponibilidad de JustWatch.
 *
 * No se habla con Firestore ni con JustWatch: se prueban la
 * planificación de consultas, la paginación y la clasificación de
 * filas. Así se cubren los casos que podrían borrar o pisar datos
 * antes de ejecutar el script contra producción.
 *
 *   npm run test:logica
 */
import assert from 'node:assert/strict';

import {
  LIMITE_ANIME_POR_CONSULTA,
  LIMITE_DOCUMENTOS_POR_PAGINA,
  bloquesDe,
  clasificarDisponibilidad,
  crearConsultaDisponibilidad,
  indiceExistente,
  leerPaginado,
  normalizarIds,
} from '../scripts/disponibilidad-justwatch-logic.mjs';

const REGIONES = ['ES', 'MX', 'AR', 'CO', 'CL', 'US', 'JP', 'FR', 'DE', 'GB'];
const PLATAFORMAS = [
  'amazon-prime-video',
  'crunchyroll',
  'disney-plus',
  'hidive',
  'hulu',
  'max',
  'netflix',
  'u-next',
];

const fila = (extra: Record<string, unknown> = {}): any => ({
  animeId: 'anime-a',
  platformId: 'netflix',
  region: 'ES',
  status: 'available',
  accessType: 'subscription',
  url: 'https://example.test/a',
  ...extra,
});

// ──────────────────────────────────────────────────────────
// 1. PLANIFICACIÓN DE CONSULTAS
// ──────────────────────────────────────────────────────────

assert.deepEqual(normalizarIds(['b', 'a', 'b', '  ', ' a ']), ['a', 'b']);

assert.equal(bloquesDe([], LIMITE_ANIME_POR_CONSULTA).length, 0);
assert.equal(bloquesDe(['a'], LIMITE_ANIME_POR_CONSULTA).length, 1);
assert.equal(bloquesDe(Array.from({ length: 10 }, (_, i) => `a-${i}`), 30).length, 1);
assert.equal(bloquesDe(Array.from({ length: 30 }, (_, i) => `a-${i}`), 30).length, 1);
assert.equal(bloquesDe(Array.from({ length: 31 }, (_, i) => `a-${i}`), 30).length, 2);
assert.equal(bloquesDe(Array.from({ length: 61 }, (_, i) => `a-${i}`), 30).length, 3);
assert.equal(
  bloquesDe(Array.from({ length: 211 }, (_, i) => `a-${i}`), 30).length,
  8,
  'un catálogo de 211 animes se planifica en 8 bloques',
);

const una: any = crearConsultaDisponibilidad(['anime-a']);
assert.equal(una.where.fieldFilter.op, 'EQUAL');
assert.equal(una.where.fieldFilter.value.stringValue, 'anime-a');
assert.equal(una.limit, LIMITE_DOCUMENTOS_POR_PAGINA);
assert.equal(una.startAt, undefined);

const diez: any = crearConsultaDisponibilidad(Array.from({ length: 10 }, (_, i) => `a-${i}`));
assert.equal(diez.where.fieldFilter.op, 'IN');
assert.equal(diez.where.fieldFilter.value.arrayValue.values.length, 10);

const treinta: any = crearConsultaDisponibilidad(
  Array.from({ length: 30 }, (_, i) => `a-${i}`),
);
assert.equal(treinta.where.fieldFilter.op, 'IN');
assert.equal(treinta.where.fieldFilter.value.arrayValue.values.length, 30);

assert.throws(
  () => crearConsultaDisponibilidad(Array.from({ length: 31 }, (_, i) => `a-${i}`)),
  /máximo 30/,
  'un bloque de más de 30 animeId no debe llegar a Firestore',
);

const conCursor: any = crearConsultaDisponibilidad(
  ['anime-a'],
  'projects/demo/databases/(default)/documents/streamingAvailability/anime-a__netflix__ES',
);
assert.equal(conCursor.startAt.before, false, 'el cursor REST es exclusivo');
assert.equal(
  conCursor.startAt.values[0].referenceValue,
  'projects/demo/databases/(default)/documents/streamingAvailability/anime-a__netflix__ES',
);

// ──────────────────────────────────────────────────────────
// 2. PAGINACIÓN
// ──────────────────────────────────────────────────────────

let llamadas = 0;
const { documentos, consultas } = await leerPaginado(async ({
  startAfter,
}: {
  startAfter: string | null;
  limite: number;
}) => {
  llamadas += 1;

  if (!startAfter) {
    return Array.from({ length: 300 }, (_, i) => ({ name: `doc-${i}` }));
  }

  if (startAfter === 'doc-299') {
    return Array.from({ length: 300 }, (_, i) => ({ name: `doc-${300 + i}` }));
  }

  return Array.from({ length: 50 }, (_, i) => ({ name: `doc-${600 + i}` }));
});

assert.equal(llamadas, 3, '300 + 300 + 50 necesita tres consultas');
assert.equal(consultas, 3);
assert.equal(documentos.length, 650, 'no se pierde ningún documento entre páginas');

let vacia = 0;
const paginacionVacia = await leerPaginado(async () => {
  vacia += 1;
  return [];
});
assert.equal(paginacionVacia.consultas, 1);
assert.equal(paginacionVacia.documentos.length, 0);
assert.equal(vacia, 1);

// ──────────────────────────────────────────────────────────
// 3. ÍNDICE Y CLASIFICACIÓN
// ──────────────────────────────────────────────────────────

const existentes = indiceExistente([
  fila(),
  fila({
    platformId: 'crunchyroll',
    url: 'https://example.test/vieja',
  }),
  fila({
    platformId: 'max',
    status: 'unavailable',
    accessType: 'unknown',
    url: '',
  }),
  fila({
    platformId: 'manual-app',
    url: 'https://manual.test',
  }),
  fila({
    platformId: 'netflix',
    region: 'XX',
  }),
  fila({
    platformId: 'fod',
    region: 'JP',
    status: 'unverified',
    accessType: 'unknown',
    url: '',
  }),
  fila({ animeId: 'anime-b' }),
]);

const clasificacion = clasificarDisponibilidad({
  generadas: [
    fila(),
    fila({
      platformId: 'crunchyroll',
      url: 'https://example.test/nueva',
    }),
    fila({ platformId: 'disney-plus' }),
  ],
  existentes,
  animeIds: new Set(['anime-a']),
  regionesPermitidas: REGIONES,
  plataformasConocidas: PLATAFORMAS,
});

assert.equal(clasificacion.nuevas.length, 1, 'disney-plus es nueva');
assert.equal(clasificacion.modificadas.length, 1, 'crunchyroll cambia de URL');
assert.equal(clasificacion.sinCambios.length, 1, 'netflix sigue igual');
assert.equal(clasificacion.repetidas.length, 0);
assert.equal(clasificacion.obsoletas.length, 1, 'max ya no lo genera JustWatch');
assert.equal(clasificacion.obsoletas[0].platformId, 'max');
assert.equal(clasificacion.protegidas.length, 3, 'manual-app, región XX y fod sin verificar');
assert.ok(
  clasificacion.protegidas.every((item) => item.animeId === 'anime-a'),
  'solo se clasifican filas del anime seleccionado',
);
assert.ok(
  clasificacion.obsoletas.every((item) => item.animeId === 'anime-a'),
  'otro anime nunca entra en la lista de borrado',
);

// Un anime ajeno no aparece ni como obsoleto ni como protegido.
assert.ok(
  ![ 
    ...clasificacion.obsoletas,
    ...clasificacion.protegidas,
    ...clasificacion.nuevas,
    ...clasificacion.modificadas,
  ].some((item) => item.animeId === 'anime-b'),
  'las filas de anime-b quedan fuera de la importación',
);

// Repetidas: la segunda fila con la misma clave no se escribe dos veces.
const repetidas = clasificarDisponibilidad({
  generadas: [fila(), fila()],
  existentes: new Map<string, any>(),
  animeIds: new Set(['anime-a']),
  regionesPermitidas: REGIONES,
  plataformasConocidas: PLATAFORMAS,
});
assert.equal(repetidas.nuevas.length, 1);
assert.equal(repetidas.repetidas.length, 1);

const otroAnime = clasificarDisponibilidad({
  generadas: [fila({ animeId: 'anime-b' })],
  existentes: new Map<string, any>(),
  animeIds: new Set(['anime-a']),
  regionesPermitidas: REGIONES,
  plataformasConocidas: PLATAFORMAS,
});
assert.equal(otroAnime.nuevas.length, 0, 'no se generan escrituras para un anime ajeno');

// Una fila manual sin verificar con la misma clave no se pisa.
const manualMismaClave = clasificarDisponibilidad({
  generadas: [fila({ status: 'available', url: 'https://example.test/justwatch' })],
  existentes: indiceExistente([
    fila({ status: 'unverified', accessType: 'unknown', url: '' }),
  ]),
  animeIds: new Set(['anime-a']),
  regionesPermitidas: REGIONES,
  plataformasConocidas: PLATAFORMAS,
});
assert.equal(manualMismaClave.modificadas.length, 0);
assert.equal(manualMismaClave.protegidas.length, 1);
assert.equal(manualMismaClave.protegidas[0].status, 'unverified');

// Varias plataformas y varias regiones del mismo anime.
const multi = clasificarDisponibilidad({
  generadas: [
    fila({ platformId: 'netflix', region: 'ES' }),
    fila({ platformId: 'netflix', region: 'US' }),
    fila({ platformId: 'crunchyroll', region: 'ES' }),
    fila({ platformId: 'crunchyroll', region: 'MX' }),
  ],
  existentes: indiceExistente([
    fila({ platformId: 'netflix', region: 'ES' }),
    fila({ platformId: 'netflix', region: 'US' }),
    fila({ platformId: 'crunchyroll', region: 'ES' }),
  ]),
  animeIds: new Set(['anime-a']),
  regionesPermitidas: REGIONES,
  plataformasConocidas: PLATAFORMAS,
});
assert.equal(multi.sinCambios.length, 3);
assert.equal(multi.nuevas.length, 1, 'MX de crunchyroll es nueva');
assert.equal(multi.obsoletas.length, 0);

// Estado y modalidad también cuentan como cambio.
const estado = clasificarDisponibilidad({
  generadas: [fila({ status: 'unavailable', accessType: 'unknown', url: '' })],
  existentes: indiceExistente([fila({ status: 'available' })]),
  animeIds: new Set(['anime-a']),
  regionesPermitidas: REGIONES,
  plataformasConocidas: PLATAFORMAS,
});
assert.equal(estado.modificadas.length, 1, 'pasar de disponible a no disponible es un cambio');

console.log('logica.justwatch: OK');
