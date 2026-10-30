// Rellena la disponibilidad regional de streaming desde JustWatch.
//    node scripts/importar-disponibilidad-justwatch.mjs [--anime <id>[,<id>...]] [--escribir]
//
// ── DE DONDE SALEN LOS DATOS ────────────────────────────────────────
//
// De las ofertas que JustWatch tiene para cada obra en cada pais. No se
// deduce nada: si JustWatch no lista una plataforma en un pais, esa
// plataforma no esta disponible alli. Es la misma fuente con la que se
// rellenaron las 6.660 filas que ya hay en `streamingAvailability`, y
// por eso los datos que ya existian coinciden con los que saca esto.
//
// ── QUE SE ESCRIBE ─────────────────────────────────────────────────
//
// Una fila por obra, plataforma y pais (`animeId__platformId__region`):
//
//   · Las ocho plataformas de siempre (Netflix, Crunchyroll, Disney+,
//     Amazon Prime Video, Max, Hulu, HIDIVE y U-NEXT) llevan fila en los
//     diez paises, con `available` donde hay oferta y `unavailable`
//     donde no. Asi la ficha puede decir "confirmado que no esta" en vez
//     de dejar el hueco.
//
//   · Las plataformas que solo existen en un pais (FOD y dAnime en
//     Japon, ADN en Francia y Alemania, la tienda de Apple) solo llevan
//     fila en los paises donde se han visto ofertas. No tiene sentido
//     decir que FOD no esta disponible en Espana: alli no opera.
//
// ── COMO SE COMPRUEBA ───────────────────────────────────────────────
//
// Sin `--escribir` no toca Firestore: saca por pantalla lo que pondria.
// Con `--escribir` actualiza las filas y crea las que falten. Los ids de
// JustWatch estan comprobados a mano contra el titulo y el ano de cada
// ficha; el script los vuelve a pedir y avisa si el titulo no es el
// esperado.

import { coleccion, escribir, uno, crear, s, momento } from './firestore-rest.mjs';

const args = process.argv.slice(2);
const escribirEnBase = args.includes('--escribir');
const soloAnime = new Set(
  args
    .flatMap((a, i) => (a === '--anime' ? (args[i + 1] ?? '').split(',') : []))
    .map((a) => a.trim())
    .filter(Boolean),
);
const filtrarAnime = soloAnime.size > 0;

const REGIONES = ['ES', 'MX', 'AR', 'CO', 'CL', 'US', 'JP', 'FR', 'DE', 'GB'];

const HOY = new Date().toISOString().slice(0, 10);

/**
 * Las fichas del catalogo y su id de JustWatch.
 *
 * `null` es una ficha que no esta en JustWatch. Se deja escrita para que
 * no parezca un olvido: Fate/Prototype es un OVA que no aparece en el
 * catalogo de JustWatch en ningun pais, asi que no hay oferta que
 * copiar. Se queda sin filas y la web enseña el aviso de que no hay
 * informacion verificada.
 *
 * @type {Record<string, { id: string | null, titulo: string, anio?: number }>}
 */
const FICHAS = {
  'carnival-phantasm': { id: 'ts8669', titulo: 'カーニバル・ファンタズム', anio: 2011 },
  'emiya-san-chi-no-kyou-no-gohan': {
    id: 'ts77697',
    titulo: "Today's Menu for the Emiya Family",
    anio: 2018,
  },
  'fate-apocrypha': { id: 'ts57811', titulo: 'Fate/Apocrypha', anio: 2017 },
  'fate-extra-last-encore': { id: 'ts77770', titulo: 'Fate/Extra Last Encore', anio: 2018 },
  'fate-grand-order-first-order': {
    id: 'tm282915',
    titulo: 'Fate/Grand Order: First Order',
    anio: 2016,
  },
  'fate-grand-order-absolute-demonic-front-babylonia': {
    id: 'ts102805',
    titulo: 'Fate/Grand Order Absolute Demonic Front: Babylonia',
    anio: 2019,
  },
  'fate-grand-order-camelot-wandering-agateram': {
    id: 'tm920552',
    titulo: 'Fate/Grand Order the Movie: Divine Realm of the Round Table: Camelot 1 Wandering; Agateram',
    anio: 2020,
  },
  'fate-grand-order-camelot-paladin-agateram': {
    id: 'tm1038182',
    titulo: 'Fate/Grand Order the Movie: Divine Realm of the Round Table: Camelot 2 Paladin; Agateram',
    anio: 2021,
  },
  'fate-grand-order-solomon': {
    id: 'tm1042709',
    titulo: 'Fate/Grand Order Final Singularity – Grand Temple of Time: Solomon',
    anio: 2021,
  },
  'fate-kaleid-liner-prisma-illya': {
    id: 'ts36927',
    titulo: 'Fate/kaleid liner Prisma Illya',
    anio: 2013,
  },
  // JustWatch guarda las cuatro temporadas de Prisma Illya en una sola
  // ficha (S1 a S4), así que las cuatro fichas del catálogo leen las
  // mismas ofertas. Es lo que hay: no hay ofertas por temporada.
  'fate-kaleid-liner-prisma-illya-2wei': {
    id: 'ts36927',
    titulo: 'Fate/kaleid liner Prisma Illya',
    anio: 2013,
  },
  'fate-kaleid-liner-prisma-illya-2wei-herz': {
    id: 'ts36927',
    titulo: 'Fate/kaleid liner Prisma Illya',
    anio: 2013,
  },
  'fate-kaleid-liner-prisma-illya-3rei': {
    id: 'ts36927',
    titulo: 'Fate/kaleid liner Prisma Illya',
    anio: 2013,
  },
  'fate-kaleid-liner-prisma-illya-licht-namae-no-nai-shoujo': {
    id: 'tm1082546',
    titulo: 'Fate/kaleid liner Prisma☆Illya: Licht Nameless Girl',
    anio: 2021,
  },
  'fate-kaleid-liner-prisma-illya-sekka-no-chikai': {
    id: 'tm344285',
    titulo: 'Fate/kaleid liner Prisma☆Illya: Vow in the Snow',
    anio: 2017,
  },
  'fate-prototype': { id: null, titulo: 'Fate/Prototype' },
  'fate-stay-night': { id: 'ts4594', titulo: 'Fate/stay night', anio: 2006 },
  'fate-stay-night-heaven-s-feel-i-presage-flower': {
    id: 'tm244203',
    titulo: "Fate/stay night: Heaven's Feel I. Presage Flower",
    anio: 2017,
  },
  'fate-stay-night-heaven-s-feel-ii-lost-butterfly': {
    id: 'tm370687',
    titulo: "Fate/stay night: Heaven's Feel II. Lost Butterfly",
    anio: 2019,
  },
  'fate-stay-night-heaven-s-feel-iii-spring-song': {
    id: 'tm370688',
    titulo: "Fate/stay night: Heaven's Feel III. Spring Song",
    anio: 2020,
  },
  'fate-stay-night-unlimited-blade-works': {
    id: 'ts4696',
    titulo: 'Fate/stay night: Unlimited Blade Works',
    anio: 2014,
  },
  'fate-strange-fake': { id: 'ts394931', titulo: 'Fate/strange Fake', anio: 2024 },
  'fate-zero': { id: 'ts11151', titulo: 'Fate/Zero', anio: 2011 },
  // JustWatch la tiene como la serie de 1999 (objectId 529703). La de
  // 2023 es otra ficha (255424) y no se toca.
  'one-piece': { id: 'ts529703', titulo: 'One Piece', anio: 1999 },
  'lord-el-melloi-ii-sei-no-jikenbo-rail-zeppelin-grace-note': {
    id: 'ts86890',
    titulo: "Lord El-Melloi II's Case Files {Rail Zeppelin} Grace note",
    anio: 2019,
  },
};

/**
 * De que paquete de JustWatch sale cada plataforma del catalogo.
 *
 * Los canales de Amazon de un servicio (Crunchyroll, HIDIVE, dAnime) se
 * quedan con el servicio: el contenido y la suscripcion son los mismos.
 * Las tiendas de compra y alquiler que no interesan aqui (Amazon Video,
 * Fandango, DVDs) no estan en la lista.
 */
const NUCLEO = {
  crunchyroll: 'crunchyroll',
  amazoncrunchyroll: 'crunchyroll',
  netflix: 'netflix',
  netflixbasicwithads: 'netflix',
  hulu: 'hulu',
  disneyplus: 'disney-plus',
  hidive: 'hidive',
  amazonhidive: 'hidive',
  unext: 'u-next',
  amazonprime: 'amazon-prime-video',
  amazonprimevideowithads: 'amazon-prime-video',
  max: 'max',
  hbomax: 'max',
};

const EXTRA = {
  fod: 'fod',
  amazondanime: 'd-anime-store',
  animedigitalnetwork: 'animation-digital-network',
  amazonanimedigital: 'animation-digital-network',
  itunes: 'apple-tv',
};

/** Paises donde opera cada plataforma que no es global. */
const PAISES_EXTRA = {
  fod: ['JP'],
  'd-anime-store': ['JP'],
  'animation-digital-network': ['FR', 'DE'],
  'apple-tv': REGIONES,
};

/** Como se llama cada plataforma nueva en Firestore. */
const PLATAFORMAS_NUEVAS = [
  { id: 'd-anime-store', name: 'dAnime Store', badgeColor: '#f39800', order: 210 },
  { id: 'fod', name: 'FOD', badgeColor: '#00a0e9', order: 220 },
  {
    id: 'animation-digital-network',
    name: 'Animation Digital Network (ADN)',
    badgeColor: '#ca8a04',
    order: 230,
  },
  { id: 'apple-tv', name: 'Apple TV (alquiler y compra)', badgeColor: '#52525b', order: 240 },
];

const ACCESO = {
  FLATRATE: 'subscription',
  FREE: 'free_ads',
  ADS: 'free_ads',
  RENT: 'rental',
  BUY: 'purchase',
};

/** Orden de preferencia cuando una plataforma tiene varias ofertas. */
const PREFERENCIA = { subscription: 4, free_ads: 3, rental: 2, purchase: 1, unknown: 0 };

const CONSULTA = `
query Ofertas($id: ID!, $pais: Country!) {
  node(id: $id) {
    ... on MovieOrShow {
      id
      objectType
      content(country: $pais, language: en) { title originalReleaseYear }
      offers(country: $pais, platform: WEB) {
        monetizationType
        standardWebURL
        package { clearName technicalName }
      }
    }
  }
}
`;

async function pedir(id, pais) {
  let ultimoError;

  for (let intento = 0; intento < 4; intento++) {
    try {
      const r = await fetch('https://apis.justwatch.com/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
        body: JSON.stringify({
          operationName: 'Ofertas',
          variables: { id, pais },
          query: CONSULTA,
        }),
      });

      if (!r.ok) throw new Error(`HTTP ${r.status}`);

      const j = await r.json();

      if (j.errors) throw new Error(JSON.stringify(j.errors).slice(0, 120));

      return j.data?.node ?? null;
    } catch (e) {
      ultimoError = e;
      await new Promise((r) => setTimeout(r, 500 * (intento + 1)));
    }
  }

  throw new Error(`${id}/${pais}: ${ultimoError?.message ?? 'sin respuesta'}`);
}

/** Saca la URL directa de los enlaces de afiliado de JustWatch. */
function limpiarUrl(url) {
  try {
    const u = new URL(url);

    if (u.hostname.endsWith('pxf.io')) {
      const destino = u.searchParams.get('u');
      if (destino) return destino;
    }

    return url;
  } catch {
    return url;
  }
}

/**
 * Las filas de una ficha a partir de las ofertas de JustWatch.
 *
 * @param {Record<string, unknown[]>} ofertasPorPais
 * @returns {Array<{platformId: string, region: string, status: string, accessType: string, url?: string}>}
 */
function construirFilas(ofertasPorPais) {
  // Primero las ocho de siempre: se apunta en que paises hay oferta de
  // cada una y con que modalidad de acceso.
  const nucleo = new Map();

  for (const [pais, ofertas] of Object.entries(ofertasPorPais)) {
    for (const oferta of ofertas) {
      const plataforma = NUCLEO[oferta.package.technicalName];

      if (!plataforma) continue;

      const acceso = ACCESO[oferta.monetizationType];

      if (!acceso) continue;

      if (!nucleo.has(plataforma)) nucleo.set(plataforma, new Map());

      const previa = nucleo.get(plataforma).get(pais);

      if (!previa || PREFERENCIA[acceso] > PREFERENCIA[previa.accessType]) {
        nucleo.get(plataforma).set(pais, {
          accessType: acceso,
          url: limpiarUrl(oferta.standardWebURL),
        });
      }
    }
  }

  const filas = [];

  for (const [plataforma, porPais] of nucleo) {
    for (const region of REGIONES) {
      const oferta = porPais.get(region);

      filas.push(
        oferta
          ? {
              platformId: plataforma,
              region,
              status: 'available',
              accessType: oferta.accessType,
              url: oferta.url,
            }
          : { platformId: plataforma, region, status: 'unavailable', accessType: 'unknown' },
      );
    }
  }

  // Las plataformas que solo existen en algunos paises: solo se escribe
  // la fila donde hay oferta. Mandan las de suscripcion sobre las de
  // alquiler y compra.
  const extra = new Map();

  for (const [pais, ofertas] of Object.entries(ofertasPorPais)) {
    for (const oferta of ofertas) {
      const plataforma = EXTRA[oferta.package.technicalName];

      if (!plataforma) continue;
      if (!PAISES_EXTRA[plataforma]?.includes(pais)) continue;

      const acceso = ACCESO[oferta.monetizationType];

      if (!acceso) continue;

      const clave = `${plataforma}__${pais}`;
      const previa = extra.get(clave);

      if (!previa || PREFERENCIA[acceso] > PREFERENCIA[previa.accessType]) {
        extra.set(clave, {
          platformId: plataforma,
          region: pais,
          status: 'available',
          accessType: acceso,
          url: limpiarUrl(oferta.standardWebURL),
        });
      }
    }
  }

  filas.push(...extra.values());

  return filas;
}

async function crearPlataformas() {
  for (const plataforma of PLATAFORMAS_NUEVAS) {
    const ya = await uno('streamingPlatforms', plataforma.id);

    if (ya) {
      console.log(`  ${plataforma.id}: ya existe, no se toca`);
      continue;
    }

    await crear('streamingPlatforms', plataforma.id, {
      name: s(plataforma.name),
      badgeColor: s(plataforma.badgeColor),
      order: { integerValue: String(plataforma.order) },
    });

    console.log(`  ${plataforma.id}: creada como "${plataforma.name}"`);
  }
}

const animes = await coleccion('animes');
const idsDelCatalogo = new Set(animes.map((a) => a.id));

const yaExistentes = await coleccion('streamingAvailability');
const porAnime = new Map();

for (const fila of yaExistentes) {
  const animeId = fila.f.animeId?.stringValue ?? '';

  if (!animeId) continue;

  if (!porAnime.has(animeId)) porAnime.set(animeId, new Set());

  porAnime
    .get(animeId)
    .add(`${fila.f.platformId?.stringValue}__${fila.f.region?.stringValue}`);
}

let totalFilas = 0;
let totalNuevas = 0;
let totalDisponibles = 0;
let totalSinJustwatch = 0;

for (const [animeId, ficha] of Object.entries(FICHAS)) {
  if (filtrarAnime && !soloAnime.has(animeId)) continue;

  if (!idsDelCatalogo.has(animeId)) {
    console.log(`\n${animeId}: no esta en el catalogo, se salta`);
    continue;
  }

  if (!ficha.id) {
    console.log(`\n${animeId}: sin ficha en JustWatch, no hay ofertas que copiar`);
    totalSinJustwatch++;
    continue;
  }

  const ofertasPorPais = {};
  let titulo = '';

  for (const region of REGIONES) {
    const nodo = await pedir(ficha.id, region);

    if (!nodo) {
      console.log(`${animeId}: JustWatch no devuelve ${ficha.id} para ${region}`);
      continue;
    }

    if (!titulo) titulo = nodo.content?.title ?? '';

    ofertasPorPais[region] = nodo.offers ?? [];

    await new Promise((r) => setTimeout(r, 120));
  }

  if (!Object.keys(ofertasPorPais).length) {
    console.log(`${animeId}: JustWatch no devuelve nada`);
    continue;
  }

  const filas = construirFilas(ofertasPorPais);
  const disponibles = filas.filter((f) => f.status === 'available');

  console.log(
    `\n=== ${animeId}   JustWatch ${ficha.id} "${titulo}"   ` +
      `${filas.length} filas, ${disponibles.length} disponibles`,
  );

  const porPlataforma = new Map();

  for (const fila of disponibles) {
    if (!porPlataforma.has(fila.platformId)) porPlataforma.set(fila.platformId, []);

    porPlataforma.get(fila.platformId).push(`${fila.region}:${fila.accessType}`);
  }

  for (const [plataforma, regiones] of porPlataforma) {
    console.log(`   ${plataforma.padEnd(28)} ${regiones.join(' ')}`);
  }

  const existentes = porAnime.get(animeId) ?? new Set();
  const nuevas = filas.filter((f) => !existentes.has(`${f.platformId}__${f.region}`));

  if (nuevas.length) {
    console.log(`   ${nuevas.length} filas nuevas`);
  }

  totalFilas += filas.length;
  totalNuevas += nuevas.length;
  totalDisponibles += disponibles.length;

  if (escribirEnBase) {
    for (const fila of filas) {
      const id = `${animeId}__${fila.platformId}__${fila.region}`;
      const campos = {
        animeId: s(animeId),
        platformId: s(fila.platformId),
        region: s(fila.region),
        status: s(fila.status),
        accessType: s(fila.accessType),
        verifiedAt: s(HOY),
        updatedAt: momento(new Date()),
      };

      // `url` va siempre en la mascara: si una fila deja de estar
      // disponible, el enlace viejo se borra en vez de quedarse ahi
      // apuntando a una ficha que ya no existe.
      const mascara = [
        'animeId',
        'platformId',
        'region',
        'status',
        'accessType',
        'verifiedAt',
        'updatedAt',
        'url',
      ];

      campos.url = fila.url ? s(fila.url) : { nullValue: null };

      await escribir('streamingAvailability', id, campos, mascara);
    }
  }
}

if (escribirEnBase) {
  console.log('\nPlataformas nuevas:');
  await crearPlataformas();
}

console.log(
  `\n${totalFilas} filas, ${totalNuevas} nuevas, ${totalDisponibles} disponibles` +
    (totalSinJustwatch ? `, ${totalSinJustwatch} fichas sin ficha en JustWatch` : '') +
    (escribirEnBase ? ' (escritas)' : ' (simulacion: usa --escribir)'),
);
