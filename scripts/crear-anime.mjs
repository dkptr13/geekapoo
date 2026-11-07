// Crea el documento de un anime en Firestore.
//
//   node scripts/crear-anime.mjs <prefijo>
//
//   <prefijo>   mt   = Mushoku Tensei
//               aot  = Ataque a los Titanes
//               ysa  = Your Lie in April
//               tg   = Tokyo Ghoul
//
// Esto solo crea la FICHA del anime. Las temporadas, los capitulos y
// el reparto van aparte, con `cargar-anime.mjs <prefijo>`.
//
// ── POR QUE ESCRIBE EL SCRIPT Y NO EL PANEL ───────────────
//
// Porque aqui no esta abierto el panel. Por REST se entra con las
// credenciales del `firebase login` de quien lo ejecuta, que es lo
// mismo que haria el panel pero sin necesitar la sesion.
//
// ── POR QUE ES UN SCRIPT Y NO VARIOS ──────────────────────
//
// El primero de estos scripts traia la ficha de Mushoku Tensei
// pegada en el codigo. Meter Ataque a los Titanes sin copiar el
// script entero significa que el anime se declara UNA VEZ, en
// `datos/<prefijo>-meta.mjs`, y este fichero no sabe el nombre de
// ninguno.
//
// ── NO SE INVENTA NINGUN DATO ─────────────────────────────
//
// Cada valor viene de una fuente consultada (el titulo en espanol, el
// estudio, el ano, los generos) o de la sinopsis del distribuidor en
// castellano. Lo que falte se deja vacio a proposito: las imagenes
// especially, porque no hay una imagen oficial que se pueda enlazar
// sin permiso y un enlace a unahotsite cualquiera se rompe en tres
// meses. Un `src` vacio cae al placeholder de `QuickImageEditor`.
//
// ── NO PISA NADA ──────────────────────────────────────────
//
// Si el anime ya existe, el script se para y avisa. Un script que
// reescribe sin querer la ficha que alguien acaba de corregir a mano
// es la peor forma de perder trabajo.

import { tokenDeAcceso } from './token-firebase.mjs';

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'geekapoo-7624d';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const prefijo = process.argv[2];

if (!prefijo || prefijo.startsWith('-')) {
  console.error('Falta el prefijo del anime. Uso:');
  console.error('  node scripts/crear-anime.mjs <mt|aot|ysa|tg|agk>');
  process.exit(1);
}

const { ANIME, ANIME_ID, ALIASES } = await import(
  new URL(`./datos/${prefijo}-meta.mjs`, import.meta.url)
);

// ──────────────────────────────────────────────────────────
// EL MISMO slugify QUE USA EL PANEL
// ──────────────────────────────────────────────────────────
//
// Copiado de `services/catalogAdmin.ts`. Importarlo de ahi no es una
// opcion: ese archivo arrastra el SDK de cliente y el contexto de
// Firebase, y este script corre en Node sin inicializarlo. Copiarlo
// es lo unico que deja el slug IDENTICO al que habria puesto el
// panel, y el slug es la URL de la wiki: si difiere, el enlace que
// se comparta deja de funcionar.
//
// `tests/logica.slug.ts` comprueba que las copias no se separen.
//
// El rango de acentos va en escapes y no con los caracteres
// combinantes metidos a mano: escrito asi es invisible en el fuente y
// no se distingue de un espacio.

const slugify = (text) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

// ──────────────────────────────────────────────────────────
// TRADUCCION A LOS TIPOS QUE PIDE EL REST
// ──────────────────────────────────────────────────────────
//
// Firestore REST no acepta JSON plano: cada valor va envuelto en un
// objeto que dice de que tipo es. Merece un traductor en vez de
// escribir el envoltorio a mano en cada campo.
//
// OJO: `num` y `dbl` NO son lo mismo. `num` es un entero y `dbl` un
// decimal con decimales. Un numero de episodio con parte fraccionaria
// guardado como `num` se perderia: el `Math.round` lo convertiria en
// el entero de al lado. Ver `cargar-anime.mjs`, donde el caso real
// (una OVA en el 15.5) ya ha pasado por aqui.

const v = {
  str: (s) => ({ stringValue: String(s) }),
  num: (n) => (Number.isInteger(n) ? { integerValue: String(n) } : { doubleValue: n }),
  dbl: (n) => ({ doubleValue: n }),
  bool: (b) => ({ booleanValue: Boolean(b) }),
  ts: (iso) => ({ timestampValue: iso }),
  punto: (x, y) => ({
    mapValue: { fields: { x: { doubleValue: x }, y: { doubleValue: y } } },
  }),
  arr: (items) => ({ arrayValue: { values: items } }),
};

// ──────────────────────────────────────────────────────────
// EL DOCUMENTO
// ──────────────────────────────────────────────────────────

const categorias = ANIME.categorias ?? [];

const anime = {
  // ── Identidad ──────────────────────────────────────
  id: v.str(ANIME_ID),
  slug: v.str(ANIME_ID),
  title: v.str(ANIME.titulo),
  japaneseTitle: v.str(ANIME.japaneseTitle ?? ''),

  // ── Títulos alternativos ───────────────────────────────
  // Los que la gente escribe para encontrar esta obra. Los
  // pone el agente que añade el anime, a mano, en el fichero
  // de datos; aquí solo se copian al documento, que es lo que
  // lee la búsqueda inteligente ("alternativeTitles").
  //
  // Si el fichero de datos no los define, el campo se deja
  // como estaba: una ficha vieja que ya los traía no debe
  // perderlos por volver a cargarla.
  ...(Array.isArray(ALIASES)
    ? { alternativeTitles: v.arr(ALIASES.map((a) => v.str(a))) }
    : {}),

  // ── Ficha ──────────────────────────────────────────
  synopsis: v.str(ANIME.synopsis ?? ''),
  year: v.num(ANIME.anio),
  status: v.str(ANIME.estado),
  studio: v.str(ANIME.estudio),
  // Lo pone a 0 el cargador, no el creador: en el momento de crear el
  // anime todavia no hay capitulos que contar ni nota que poner.
  episodesCount: v.num(0),

  // ── Clasificacion ──────────────────────────────────
  category: v.str(categorias[0] ?? ''),
  categories: v.arr(categorias.map((c) => v.str(c))),
  genres: v.arr((ANIME.generos ?? []).map((g) => v.str(g))),

  // ── Imagenes ───────────────────────────────────────
  // Vacias a proposito. Ver la cabecera del fichero.
  coverUrl: v.str(''),
  bannerUrl: v.str(''),
  coverFocus: v.punto(0.5, 0.5),
  bannerFocus: v.punto(0.5, 0.5),

  // ── Contadores ─────────────────────────────────────
  // Se ponen a 0, no se omiten: la wiki los lee sin comprobar si
  // existen, y omitirlos haria que un contador undefined se pintara
  // como "NaN".
  rating: v.dbl(0),
  likesCount: v.num(0),
  likedBy: v.arr([]),
  commentsCount: v.num(0),
  viewsCount: v.num(0),
  communityRatingSum: v.num(0),
  communityRatingCount: v.num(0),
  communityRatingAvg: v.dbl(0),
  streaming: v.arr([]),
  createdAt: v.ts(new Date().toISOString()),
};

// ──────────────────────────────────────────────────────────
// ESCRIBIR
// ──────────────────────────────────────────────────────────

const token = await tokenDeAcceso();
const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
};

const url = `${BASE}/animes/${ANIME_ID}`;

const existe = await fetch(url, { headers, method: 'GET' });

if (existe.ok) {
  console.error(`\n  YA EXISTE: animes/${ANIME_ID}`);
  console.error('  No se toca nada.\n');
  process.exit(1);
}

const respuesta = await fetch(url, {
  method: 'PATCH',
  headers,
  body: JSON.stringify({ fields: anime }),
});

if (!respuesta.ok) {
  console.error(`\n  NO SE PUDO CREAR (${respuesta.status})\n`);
  console.error(await respuesta.text(), '\n');
  process.exit(1);
}

console.log(`\n  Creado: animes/${ANIME_ID}`);
console.log(`  ${ANIME.titulo}\n`);
console.log('  Ahora las temporadas y el reparto:');
console.log(`    node scripts/cargar-anime.mjs ${prefijo}\n`);
console.log('  La portada tambien: el placeholder aguanta hasta entonces.\n');
