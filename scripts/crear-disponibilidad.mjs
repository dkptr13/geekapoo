// ======================================================
// OBSOLETO: NO EJECUTAR
// ======================================================
//
// Este script inventaba la disponibilidad por regla de plataforma
// ("Crunchyroll está en los diez países", "Hulu en Estados Unidos"...).
// Ese es justo el origen de los datos falsos: Akame ga Kill salía en
// Crunchyroll España sin estarlo.
//
// La disponibilidad real vive en `streamingAvailability` y sale de las
// ofertas de JustWatch, contrastadas con Crunchyroll y Netflix. Volver a
// ejecutar esto sustituiría datos comprobados por inventados.
//
//   node scripts/crear-disponibilidad.mjs   ->  se niega a ejecutarse
//
// Para volver a traer las ofertas reales está
// `scripts/importar-disponibilidad-justwatch.mjs` (sin `--escribir` solo
// enseña lo que escribiría).
//
// ======================================================

console.error(
  'crear-disponibilidad.mjs está obsoleto: genera disponibilidad inventada.\n' +
    'Los datos reales ya están en Firestore (ofertas de JustWatch verificadas).',
);
process.exit(1);

// ── POR QUÉ EXISTE ───────────────────────────────────────
//
// La wiki «Dónde verla» NO usa `animes/{id}.streaming` como
// disponibilidad: esa lista antigua es un dato heredado que se pinta
// como «Sin verificar» (ver `construirTarjetas`). Lo que se enseña
// como «Disponible» o «No disponible» son las filas de
// `streamingAvailability`, una por obra, plataforma y país.
//
// Sin esas filas, el catálogo entero sale en «Sin verificar». Este
// script las genera a partir de las plataformas que cada obra ya tiene
// registradas y de la política de disponibilidad de cada plataforma en
// los países que admite la web.
//
// ── QUÉ SE HACE ─────────────────────────────────────────
//
//  1. Lee todas las obras con su lista de plataformas antiguas.
//  2. Decide, por plataforma, en qué países está disponible:
//       · Las plataformas mundiales (Crunchyroll, Netflix, Prime
//         Video, Disney+...) en los diez países que admite la web.
//       · Las regionales (Selecta Vision, Filmin, AnimeBox,
//         Movistar Plus+...) solo en España.
//       · Las de un solo país (Hulu, HIDIVE) en Estados Unidos;
//         U-NEXT en Japón.
//     La pista `regions` de la obra manda sobre la política: si la
//     ficha dice "solo ES, LATAM y JP", la plataforma queda disponible
//     solo ahí y NO disponible en el resto.
//  3. Escribe una fila `available` por cada país donde está y una fila
//     `unavailable` por el resto, para que un país sin licencia lo vea
//     confirmado como «No disponible» en vez de «Sin verificar».
//  4. Crea en `streamingPlatforms` las plataformas que falten en el
//     catálogo (HIDIVE, U-NEXT, AnimeBox...) para que la tarjeta no
//     salga con el nombre inventado a partir del id.
//
// El id de cada fila es determinista (`{animeId}__{platformId}__{region}`),
// así que el script se puede volver a ejecutar: reescribe lo mismo y no
// duplica nada.
//
// NO toca ni borra nada de las fichas: solo añade filas en
// `streamingAvailability` y, si hace falta, en `streamingPlatforms`.

import { coleccion, cliente, s, i, momento } from './firestore-rest.mjs';

// ── POLÍTICA POR PLATAFORMA ─────────────────────────────
//
// Los diez países que admite la web (REGIONES_INICIALES).
const REGIONES = ['ES', 'MX', 'AR', 'CO', 'CL', 'US', 'JP', 'FR', 'DE', 'GB'];

/** Plataformas que se pueden ver en todos los países admitidos. */
const MUNDIALES = new Set([
  'crunchyroll',
  'netflix',
  'amazon-prime-video',
  'disney-plus',
  'apple-tv-plus',
  'youtube',
]);

/** Cada plataforma no mundial → el único país donde está. */
const UN_PAIS = {
  'selecta-vision': 'ES',
  filmin: 'ES',
  animebox: 'ES',
  'movistar-plus': 'ES',
  atresplayer: 'ES',
  'rtve-play': 'ES',
  hulu: 'US',
  hidive: 'US',
  max: 'US',
  'u-next': 'JP',
};

// Pseudo-códigos que se usan en las pistas `regions` de las fichas:
// se expanden a los códigos ISO que entiende el selector regional.
const EXPANSIONES = {
  WW: REGIONES,
  LATAM: ['MX', 'AR', 'CO', 'CL'],
  UK: ['GB'],
};

// Nombre de plataforma → id, igual que `plataformaIdDeNombre` de
// `src/data/streaming.ts` (no se puede importar desde aquí: es TS).
const ALIAS_PLATAFORMA = {
  netflix: 'netflix',
  crunchyroll: 'crunchyroll',
  hulu: 'hulu',
  'disney+': 'disney-plus',
  'disney plus': 'disney-plus',
  disneyplus: 'disney-plus',
  'amazon prime': 'amazon-prime-video',
  'amazon prime video': 'amazon-prime-video',
  'prime video': 'amazon-prime-video',
  max: 'max',
  'hbo max': 'max',
  'apple tv+': 'apple-tv-plus',
  'apple tv': 'apple-tv-plus',
  youtube: 'youtube',
  filmin: 'filmin',
  'selecta vision': 'selecta-vision',
  'movistar+': 'movistar-plus',
  'movistar plus+': 'movistar-plus',
  'movistar plus': 'movistar-plus',
  atresplayer: 'atresplayer',
  'rtve play': 'rtve-play',
  anilist: 'anilist',
  otro: 'otro',
};

function claveDePlataforma(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9+]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function slugifyPlatformId(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function plataformaIdDeNombre(name) {
  const clave = claveDePlataforma(name);
  if (!clave) return '';
  return ALIAS_PLATAFORMA[clave] ?? slugifyPlatformId(name);
}

/** Colores por defecto para las plataformas que aún no están en el catálogo. */
const COLORES = {
  hidive: '#0e86b4',
  'u-next': '#2f9e44',
  animebox: '#e91e63',
};

/**
 * Ids que ya viven en PLATAFORMAS_INICIALES (src/data/streaming.ts).
 *
 * No se crean en Firestore: el merge de `StreamingCatalogContext` da
 * prioridad a lo que haya allí, y un documento con color y orden
 * inventados pisaría el de la lista inicial.
 */
const INICIALES = new Set([
  'netflix',
  'crunchyroll',
  'disney-plus',
  'amazon-prime-video',
  'max',
  'hulu',
  'apple-tv-plus',
  'youtube',
  'filmin',
  'selecta-vision',
  'movistar-plus',
  'atresplayer',
  'rtve-play',
]);

/** Fichas de las plataformas que hay que crear si no existen. */
function plataformaDoc(id, name) {
  return {
    name: s(name),
    badgeColor: s(COLORES[id] ?? '#71717a'),
    order: i(200),
    createdAt: momento(new Date().toISOString()),
  };
}

/** Las regiones de una plataforma según la política + la pista de la obra. */
function regionesDe(platformId, pistas) {
  if (pistas && pistas.length) {
    const set = new Set();
    for (const pista of pistas) {
      const clave = pista.trim().toUpperCase();
      const expandida = EXPANSIONES[clave] ?? [clave];
      for (const r of expandida) if (REGIONES.includes(r)) set.add(r);
    }
    if (set.size) return [...set];
  }

  if (MUNDIALES.has(platformId)) return [...REGIONES];
  const unPais = UN_PAIS[platformId];
  if (unPais) return [unPais];

  // Plataforma no conocida: se asume disponible en todos los países
  // admitidos, pero se avisa para que se revise a mano.
  console.log(`  [aviso] plataforma desconocida "${platformId}": se asume disponible en todos los países.`);
  return [...REGIONES];
}

// ── LECTURA ─────────────────────────────────────────────

const { cabeceras, BASE } = await cliente();

// El `name` de un documento en un commit va sin el prefijo del API:
// "projects/.../documents/..." y no la URL entera.
const DOCS = BASE.replace(/^https:\/\/firestore\.googleapis\.com\/v1\//, '');

const animes = await coleccion('animes');
console.log(`Obras leídas: ${animes.length}`);

const plataformasCatalogo = await coleccion('streamingPlatforms');
const idsCatalogo = new Set(plataformasCatalogo.map((p) => p.id));

// ── CONSTRUIR FILAS ─────────────────────────────────────

const writes = [];
const porPlataforma = {};
const faltan = [];

for (const doc of animes) {
  const animeId = doc.id;
  const servicios = doc.f.streaming;
  if (!servicios || !servicios.arrayValue || !servicios.arrayValue.values) continue;

  for (const valor of servicios.arrayValue.values) {
    const campos = valor.mapValue?.fields;
    if (!campos) continue;

    const nombre = campos.name?.stringValue;
    if (!nombre) continue;

    const platformId = plataformaIdDeNombre(nombre);
    if (!platformId) continue;

    const url = campos.url?.stringValue || '';
    const pistas = campos.regions?.arrayValue?.values?.map((v) => v.stringValue) ?? [];

    const disponibles = regionesDe(platformId, pistas);
    const faltanEnDisponibles = REGIONES.filter((r) => !disponibles.includes(r));

    if (!idsCatalogo.has(platformId) && !INICIALES.has(platformId)) {
      faltan.push({ id: platformId, name: nombre });
    }

    for (const region of disponibles) {
      writes.push({
        update: {
          name: `${DOCS}/streamingAvailability/${animeId}__${platformId}__${region}`,
          fields: {
            animeId: s(animeId),
            platformId: s(platformId),
            region: s(region),
            status: s('available'),
            accessType: s('subscription'),
            ...(url ? { url: s(url) } : {}),
            verifiedAt: s('2026-10-27'),
            updatedAt: momento(new Date().toISOString()),
          },
        },
      });
      const t = (porPlataforma[platformId] ??= { disp: 0, nodisp: 0 });
      t.disp += 1;
    }

    for (const region of faltanEnDisponibles) {
      writes.push({
        update: {
          name: `${DOCS}/streamingAvailability/${animeId}__${platformId}__${region}`,
          fields: {
            animeId: s(animeId),
            platformId: s(platformId),
            region: s(region),
            status: s('unavailable'),
            accessType: s('unknown'),
            verifiedAt: s('2026-10-27'),
            updatedAt: momento(new Date().toISOString()),
          },
        },
      });
      const t = (porPlataforma[platformId] ??= { disp: 0, nodisp: 0 });
      t.nodisp += 1;
    }
  }
}

// Plataformas que faltan en el catálogo: se crean con el nombre tal
// cual viene de la ficha (que es como se escribieron siempre).
const creadas = new Set();
for (const { id, name } of faltan) {
  if (creadas.has(id)) continue;
  creadas.add(id);
  writes.push({
    update: { name: `${DOCS}/streamingPlatforms/${id}`, fields: plataformaDoc(id, name) },
  });
}

// ── ESCRITURA POR LOTES ─────────────────────────────────
//
// El commit de Firestore admite 500 escrituras por petición.
const LOTE = 480;
let enviadas = 0;

for (let i = 0; i < writes.length; i += LOTE) {
  const lote = writes.slice(i, i + LOTE);
  const r = await fetch(`${BASE}:commit`, {
    method: 'POST',
    headers: cabeceras,
    body: JSON.stringify({ writes: lote }),
  });

  if (!r.ok) {
    console.error(`  NO SE PUDO ESCRIBIR (${r.status})\n`);
    console.error(await r.text(), '\n');
    process.exit(1);
  }

  enviadas += lote.length;
}

console.log(`\nFechas escritas: ${enviadas} (en ${Math.ceil(enviadas / LOTE)} lotes)`);
console.log('\nPor plataforma:');
for (const [id, t] of Object.entries(porPlataforma)) {
  console.log(`  ${id.padEnd(24)} disponibles ${t.disp} · no disponibles ${t.nodisp}`);
}
if (faltan.length) console.log('\nPlataformas creadas en el catálogo:', faltan.map((f) => f.id).join(', '));
console.log('');
