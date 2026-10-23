// Carga temporadas, capitulos y personajes de un anime del catalogo.
//
//   node scripts/cargar-anime.mjs <prefijo> [--actualizar]
//
//   <prefijo>   mt   = Mushoku Tensei
//               aot  = Ataque a los Titanes
//               ysa  = Your Lie in April
//               tg   = Tokyo Ghoul
//               agk  = Akame ga Kill!
//
// ── POR QUE UN SCRIPT Y NO VARIOS ─────────────────────────
//
// El primero de estos scripts se escribio para un solo anime y traia
// su nombre pegado en veinte sitios: los imports, el id, el nombre
// del fichero. Al meter un segundo anime, copiarlo entero habria
// dejado DOS copias de la parte dificil, que es la que se equivoca
// sin dar error: la conversion a los tipos del REST, la mascara de
// campos del PATCH, y el `seasonIds` de cada personaje. Una copia
// arreglada y otra sin arreglar divergen sin que nada lo diga.
//
// Asi que el nombre del anime no aparece NINGUNA vez en este
// fichero. Todo lo que cambia entre uno y otro son los datos, y los
// datos viven en `datos/<prefijo>-*.mjs`. Lo que se lee de ahi:
//   · <prefijo>-meta.mjs      ANIME_ID, RATING_SERIE, TEMPORADAS...
//   · <prefijo>-<clave>.mjs   los capitulos de una temporada
//   · <prefijo>-personajes.mjs el reparto
//   · <prefijo>-tags.mjs      las etiquetas
//
// Para anadir un tercero se copian los ficheros de datos y ya.
//
// ── ESCRITURA ────────────────────────────────────────────
//
// Por REST con las credenciales del `firebase login` de quien lo
// ejecuta, igual que `crear-anime.mjs`. La razon de no usar el SDK
// de cliente es la misma: por REST entra con permisos de
// administracion y escribe exactamente lo que habria escrito el
// panel.
//
// ── IDEMPOTENTE ───────────────────────────────────────────
//
// Cada documento se comprueba antes de escribirse y se salta si ya
// existe, salvo que se pase `--actualizar`. Sin ese flag, un
// documento existente no se toca: es lo que hace que el script no
// pise correcciones hechas a mano en el panel, que es el riesgo
// real de un script de carga.
//
// Con `--actualizar` sobrescribe SOLO los campos que el script
// declara, gracias a la mascara de campos. Sin ella, el PATCH de
// Firestore borra del documento todo lo que no venga en el cuerpo,
// y un "actualizar" desatento se comeria la sinopsis.
//
// Para BORRAR algo y volver a crearlo hay que hacerlo desde el
// panel. Que un script decida que destruir es lo que no queremos.

import { tokenDeAcceso } from './token-firebase.mjs';

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'geekapoo-7624d';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// ──────────────────────────────────────────────────────────
// LOS DATOS DE ESTE ANIME
// ──────────────────────────────────────────────────────────

const prefijo = process.argv[2];
const ACTUALIZAR = process.argv.includes('--actualizar');

if (!prefijo || prefijo.startsWith('-')) {
  console.error('Falta el prefijo del anime. Uso:');
  console.error('  node scripts/cargar-anime.mjs <mt|aot|ysa|tg|agk> [--actualizar]');
  process.exit(1);
}

/**
 * Los datos, por prefijo.
 *
 * El `import()` es dinamico a proposito: el nombre del fichero sale
 * del argumento de la linea de ordenes, y un `import` estatico no
 * puede construir una ruta. Los datos de cada anime son ESCRITURA,
 * mientras que todo lo de este fichero es comun.
 */
const datos = async () => {
  const base = new URL('./datos/', import.meta.url);

  const meta = await import(new URL(`${prefijo}-meta.mjs`, base));
  const { PERSONAJES } = await import(new URL(`${prefijo}-personajes.mjs`, base));
  const { TAGS } = await import(new URL(`${prefijo}-tags.mjs`, base));

  // Cada temporada dice en `capitulos` el nombre de su fichero. "T1"
  // vive en `mt-t1.mjs` y exporta `T1`. Se averigua en el meta y no
  // se hardcodea una lista, porque si el meta dice que hay cinco
  // temporadas el script tiene que buscar cinco ficheros.
  const capitulos = {};

  for (const t of meta.TEMPORADAS) {
    const clave = t.capitulos;
    const modulo = await import(new URL(`${prefijo}-${clave.toLowerCase()}.mjs`, base));
    const filas = modulo[clave];

    if (!Array.isArray(filas)) {
      throw new Error(
        `${prefijo}-${clave.toLowerCase()}.mjs no exporta un array llamado ${clave}`,
      );
    }

    capitulos[clave] = filas;
  }

  return { ...meta, CAPITULOS: capitulos, PERSONAJES, TAGS };
};

const { ANIME_ID, EPISODIOS_TOTAL, RATING_SERIE, TEMPORADAS, CAPITULOS, PERSONAJES, TAGS, ALIASES } =
  await datos();

const token = await tokenDeAcceso();
const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
};

// ──────────────────────────────────────────────────────────
// LOS TIPOS QUE PIDE EL REST
// ──────────────────────────────────────────────────────────
//
// Firestore por REST no acepta JSON plano: cada valor va envuelto en
// un objeto que dice de que tipo es.

const v = {
  str: (s) => ({ stringValue: String(s) }),

  // Un entero del REST es `integerValue` y uno con decimales es
  // `doubleValue`. Firestore los distingue, y `Math.round` sobre un
  // 15.5 lo convertia en 16 sin avisar: la OVA de Mushoku Tensei
  // llego a guardarse como el capitulo 16 de verdad y la primera
  // temporada se quedaba con dos capitulos 16.
  //
  // Se comprueba si es entero en vez de redondear por gusto: al reves
  // (mandar un 3.0 como double cuando podria ser entero) haria que
  // Firestore lo metiera en otro grupo al ordenar.
  num: (n) => (Number.isInteger(n) ? { integerValue: String(n) } : { doubleValue: n }),

  dbl: (n) => ({ doubleValue: n }),
  ts: (iso) => ({ timestampValue: iso }),
  punto: (x, y) => ({
    mapValue: { fields: { x: { doubleValue: x }, y: { doubleValue: y } } },
  }),
  arr: (items) => ({ arrayValue: { values: items } }),
};

/**
 * Campos que los ficheros de datos NO son la fuente de verdad.
 *
 * ── POR QUE NO SE ACTUALIZAN ──────────────────────────────────────
 *
 * `imageUrl` de un personaje y `thumbnailUrl` de un capitulo los ponen
 * `enlazar-imagenes.mjs` y `emparejar-miniaturas-tvdb.mjs`, leyendo
 * AniList y TVDB. Aqui se escriben como cadena vacia porque el fichero
 * de datos no trae la URL, y porque un personaje recien creado sin
 * imagen tiene que tener ALGO en el campo, no el campo sin existir.
 *
 * Pero eso significa que un `--actualizar` los vacia. Y asi se perdio
 * el trabajo de enlazar las imagenes de Chainsaw Man: se enlezaron 43
 * URLs, se cargo el anime para corregir un dato y las 43 se fueron,
 * miniaturas de capitulo incluidas.
 *
 * Con esta lista, `--actualizar` deja esos campos como estaban. Es la
 * diferencia entre "actualiza lo que ha cambiado en el fichero" y
 * "actualiza todo, incluido lo que el fichero nunca tuvo".
 *
 * `posterUrl` y `bannerUrl` de la temporada son de la misma familia:
 * los pone `enlazar-imagenes.mjs` desde AniList. En Rent-a-Girlfriend
 * se enlazaron los diez y la recarga del arreglo de numeracion los
 * dejo a cadena vacia, con lo que la wiki enseño la portada de la
 * serie en las cinco temporadas.
 */
const CAMPOS_DE_FUERA = ['imageUrl', 'thumbnailUrl', 'posterUrl', 'bannerUrl'];

/**
 * Escribe un documento si no existe, o lo actualiza con `--actualizar`.
 *
 * @returns 'creado' | 'ya estaba' | 'actualizado'
 */
async function crearSiNoExiste(coleccion, id, fields) {
  const url = `${BASE}/${coleccion}/${id}`;

  const existe = await fetch(url, { headers, method: 'GET' });

  if (existe.ok && !ACTUALIZAR) return 'ya estaba';

  // Al actualizar no se mandan los campos que son de otra fuente: si
  // el documento ya existe, la URL que tiene puesta es la buena.
  const aEscribir =
    existe.ok && ACTUALIZAR
      ? Object.fromEntries(Object.entries(fields).filter(([k]) => !CAMPOS_DE_FUERA.includes(k)))
      : fields;

  const destino = existe.ok
    ? `${url}?${Object.keys(aEscribir).map((f) => `updateMask.fieldPaths=${f}`).join('&')}`
    : url;

  const r = await fetch(destino, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ fields: aEscribir }),
  });

  if (!r.ok) {
    throw new Error(`${coleccion}/${id}: ${r.status} ${await r.text()}`);
  }

  return existe.ok ? 'actualizado' : 'creado';
}

// ──────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────

/**
 * El id de una temporada: `${animeId}-s${numero}`, que es lo que
 * construye `uniqueSlug` en `catalogAdmin.ts`. Va aqui y no
 * importado porque ese archivo arrastra el SDK de cliente y este
 * script corre en Node sin Firebase.
 */
const idTemporada = (numero) => `${ANIME_ID}-s${numero}`;

/**
 * El slug de un personaje, con el mismo criterio que el panel.
 * `tests/logica.slug.ts` comprueba que no se separen.
 *
 * El rango de acentos va en escapes y no con los caracteres
 * combinantes metidos a mano: escrito asi es invisible en el fuente
 * y no se distingue de un espacio. Es el mismo criterio que
 * `catalogAdmin.ts`.
 */
const slugify = (text) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

/**
 * La media de las notas de los capítulos de una temporada.
 *
 * Los capítulos sin nota quedan fuera: UNA MEDIA CUENTA. Promediarlos
 * bajaría la nota de la temporada por un capítulo que no tiene nota,
 * no porque sea malo. Devuelve 0 si no hay ninguno con nota, que es
 * lo que el panel guarda cuando "todavía no lo he rellenado".
 */
const notaDe = (capitulos) => {
  const conNota = capitulos.map((c) => c[4]).filter((n) => typeof n === 'number' && n > 0);
  if (conNota.length === 0) return 0;
  return Math.round((conNota.reduce((a, n) => a + n, 0) / conNota.length) * 10) / 10;
};

// ──────────────────────────────────────────────────────────
// 1. LAS TEMPORADAS Y SUS CAPITULOS
// ──────────────────────────────────────────────────────────

let creadasTemporadas = 0;
let creadosCapitulos = 0;

for (const t of TEMPORADAS) {
  const sid = idTemporada(t.numero);
  const nota = notaDe(CAPITULOS[t.capitulos]);

  // `titulo` es opcional. Las temporadas 1 y 2 de Mushoku no tienen
  // subtitulo oficial y no lo declaran, asi que va vacio y la wiki
  // enseña "Temporada N". Las partes finales de Ataque a los Titanes
  // si tienen nombre oficial ("The Final Season"), y ese nombre es
  // justo lo que las hace localizables.
  const r = await crearSiNoExiste('seasons', sid, {
    animeId: v.str(ANIME_ID),
    number: v.num(t.numero),
    title: v.str(t.titulo ?? ''),
    synopsis: v.str(t.synopsis),
    posterUrl: v.str(''),
    bannerUrl: v.str(''),
    posterFocus: v.punto(0.5, 0.5),
    bannerFocus: v.punto(0.5, 0.5),
    year: v.num(t.anio),
    status: v.str(t.estado),
    studio: v.str(t.estudio),
    rating: v.dbl(nota),
    episodesCount: v.num(CAPITULOS[t.capitulos].length),
    createdAt: v.ts(new Date().toISOString()),
  });

  if (r === 'creado') creadasTemporadas++;
  console.log(`  T${t.numero}${t.titulo ? ` "${t.titulo}"` : ''} ${r}, nota ${nota}: ${sid}`);

  for (const [n, titulo, , fecha, notaCap, desc] of CAPITULOS[t.capitulos]) {
    // El id lleva el numero delante, con relleno a dos digitos, para
    // que la lista salga ordenada en el panel y en cualquier volcado.
    // Sin el relleno, el 10 iria detras del 2.
    //
    // El punto se cambia por una "x". Firestore lee el ultimo punto
    // de un nombre de documento como separador de extension, y un id
    // que acaba en ".5" lo trata como un documento de cinco bytes: o
    // lo rechaza, o lo guarda con otro nombre. El numero DENTRO del
    // documento si es 15.5, que es lo que ordena la lista.
    const eid = `${sid}-e${String(n).padStart(2, '0').replace('.', 'x')}`;

    const r2 = await crearSiNoExiste('episodes', eid, {
      animeId: v.str(ANIME_ID),
      seasonId: v.str(sid),
      number: v.num(n),
      title: v.str(titulo),
      description: v.str(desc),
      airDate: v.str(fecha),
      thumbnailUrl: v.str(''),
      thumbnailFocus: v.punto(0.5, 0.5),
      rating: v.dbl(notaCap),
      likesCount: v.num(0),
      likedBy: v.arr([]),
      createdAt: v.ts(new Date().toISOString()),
    });

    if (r2 === 'creado') creadosCapitulos++;
  }
}

// ──────────────────────────────────────────────────────────
// 2. LOS PERSONAJES
// ──────────────────────────────────────────────────────────
//
// Aqui es donde esta el detalle de las TEMPORADAS. `seasonIds` no es
// un adorno: si un personaje sale solo en la primera temporada y se
// le deja el array vacio, la wiki lo muestra en las tres, porque
// lista vacia significa "compartido" (ver `seasonIdsDe` en
// `utils/seasonData.ts`). Por eso se traduce el '1,3' del fichero de
// datos a los ids reales de temporada.
//
// Un array con un solo elemento NO es lo mismo que uno vacio: es
// exactamente la diferencia entre "sale en todas" y "solo en esta".

let creadosPersonajes = 0;

for (const [nombre, temporada, rol, japones, voz, desc] of PERSONAJES) {
  const temporadas = temporada === '' ? [] : temporada.split(',').map(Number);

  const tags = TAGS[nombre] ?? [];
  if (tags.length === 0) {
    throw new Error(`"${nombre}" no tiene etiquetas en ${prefijo}-tags.mjs`);
  }

  const r = await crearSiNoExiste('characters', `${ANIME_ID}-${slugify(nombre)}`, {
    animeId: v.str(ANIME_ID),
    seasonIds: v.arr(temporadas.map((n) => v.str(idTemporada(n)))),
    name: v.str(nombre),
    slug: v.str(slugify(nombre)),
    description: v.str(desc),
    role: v.str(rol),
    imageUrl: v.str(''),
    japaneseName: v.str(japones),
    voiceActor: v.str(voz),
    imageFocus: v.punto(0.5, 0.5),
    tags: v.arr(tags.map((tag) => v.str(tag))),
    likesCount: v.num(0),
    likedBy: v.arr([]),
    createdAt: v.ts(new Date().toISOString()),
  });

  if (r === 'creado') creadosPersonajes++;
}

// ──────────────────────────────────────────────────────────
// 3. LA NOTA DE LA SERIE, EL RECUENTO DE CAPITULOS Y LOS ALIAS
// ──────────────────────────────────────────────────────────
//
// Campos del anime que el panel no guarda en "crear anime". Se
// actualizan con un PATCH limitado a esos campos, porque un
// update completo con el anime entero pisaria lo que alguien haya
// corregido en el panel desde que se creo.
//
// La mascara de campos no es opcional: sin ella el REST borra del
// documento todo lo que no venga en el cuerpo, y el anime se
// quedaria sin synopsis ni categorias.
//
// Los alias ("alternativeTitles") van en la misma llamada: son
// datos del fichero, como la nota, y los pone el agente que anade
// el anime. Si el fichero no los define, el campo no entra en la
// mascara y la ficha conserva los que ya tuviera.

const animeUrl = `${BASE}/animes/${ANIME_ID}`;

const camposAnime = {
  rating: v.dbl(RATING_SERIE),
  episodesCount: v.num(EPISODIOS_TOTAL),
};

const conAlias = Array.isArray(ALIASES);
if (conAlias) camposAnime.alternativeTitles = v.arr(ALIASES.map((a) => v.str(a)));

const mascara = Object.keys(camposAnime)
  .map((campo) => `updateMask.fieldPaths=${campo}`)
  .join('&');

const rAnime = await fetch(`${animeUrl}?${mascara}`, {
  method: 'PATCH',
  headers,
  body: JSON.stringify({ fields: camposAnime }),
});

if (!rAnime.ok) {
  throw new Error(`animes/${ANIME_ID}: ${rAnime.status} ${await rAnime.text()}`);
}

// ──────────────────────────────────────────────────────────

console.log('');
console.log(`  Anime:              ${ANIME_ID}`);
console.log(`  Temporadas nuevas:  ${creadasTemporadas} de ${TEMPORADAS.length}`);
console.log(`  Capitulos nuevos:   ${creadosCapitulos} de ${EPISODIOS_TOTAL}`);
console.log(`  Personajes nuevos:  ${creadosPersonajes} de ${PERSONAJES.length}`);
console.log(`  Nota de la serie:   ${RATING_SERIE} (IMDb)`);
console.log(`  Modo:               ${ACTUALIZAR ? 'actualizar' : 'crear (no toca lo existente)'}`);
console.log('');
