// El reparto de un anime en AniList, con todo lo que pide `datos/*-personajes.mjs`.
//    node scripts/reparto-anilist.mjs <id-anilist> [<id-anilist> ...]
//
// `anilist.mjs` ya trae los nombres y las imagenes, pero su consulta NO
// pide el rol (`main`, `supporting`, `antagonist`), ni el nombre japones,
// ni los actores de voz. Los tres hacen falta para escribir un fichero
// de reparto, y con lo que hay habia que buscarlos uno a uno a mano en la
// ficha de cada personaje.
//
// Este script saca los tres de una vez y los deja en un formato que se
// puede copiar al fichero. Ademas marca de que medio sale cada uno, que
// es como se distingue a la gente que solo aparece en la pelicula.
//
// ── POR QUE SE FILTRA A LOS QUE IMPORTAN ────────────────────────────
//
// AniList devuelve el reparto entero, y en Chainsaw Man son 85: los doce
 // capitulos, la pelicula y los recaps de ABEMA, y se mezclan setenta
 // y tantos "devils", los policias de nombre "A" "B" "C", los prisioneros
 // de una celda y toda una fila del ejercito de zombis.
//
// Por eso se queda con `main`, `supporting` y `antagonist`: son los que
// tienen nombre de verdad y algún peso en la historia. Los `background`
// se cuentan pero no se sacan, y su numero se imprime para que se vea
// lo que se esta dejando fuera y no haya sorpresas.

const ids = process.argv.slice(2).filter((a) => /^\d+$/.test(a));

if (ids.length === 0) {
  console.error('  uso: node scripts/reparto-anilist.mjs <id-anilist> [<id-anilist> ...]');
  console.error('  por ejemplo: node scripts/reparto-anilist.mjs 127230 171627');

  process.exit(1);
}

const CONSULTA = `query ($id: Int!, $pagina: Int) {
  Media(id: $id, type: ANIME) {
    id
    title { romaji english }
    format
    characters(page: $pagina, sort: [ROLE, RELEVANCE, ID]) {
      pageInfo { hasNextPage currentPage }
      edges {
        role
        node {
          id
          name { full native alternative }
          image { large }
        }
        voiceActors(language: JAPANESE, sort: [RELEVANCE, ID]) {
          name { full native }
        }
      }
    }
  }
}`;

// AniList devuelve el rol en MAYUSCULAS: `MAIN`, `SUPPORTING`,
// `ANTAGONIST`, `BACKGROUND`. El filtro va en mayusculas y se pasa a
// minusculas al imprimir, porque es como lo escriben los ficheros de
// datos del proyecto.
//
// Se comparaba en minusculas y por eso la lista entera salia
// descartada como de fondo, sin ningun error: 94 personajes, cero
// utiles. Un filtro que se equivoca en la caja es peor que no tener
// filtro, porque parece que funciona.
const ROLES = ['MAIN', 'SUPPORTING', 'ANTAGONIST'];

/** Como se escribe el rol en los ficheros de datos: en minusculas. */
const ROL_DATO = {
  MAIN: 'main',
  SUPPORTING: 'supporting',
  ANTAGONIST: 'antagonist',
  BACKGROUND: 'background',
};

async function pagina(id, n) {
  const r = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: CONSULTA, variables: { id, pagina: n } }),
  });

  const j = await r.json();

  if (j.errors) {
    console.error(`  AniList ${id}: ${JSON.stringify(j.errors).slice(0, 250)}`);
    process.exit(1);
  }

  return j.data.Media;
}

// Un personaje puede salir en varios de los medios pedidos. Se juntan en
// una sola fila, que es como los guarda el fichero de datos: el campo de
// temporadas dice en cuales sale, y para Chainsaw Man casi todos estan
// en la 1.
const juntos = new Map();

for (const id of ids) {
  let paginaActual = 1;
  let info;

  do {
    info = await pagina(id, paginaActual);

    for (const e of info.characters.edges) {
      const n = e.node;

      if (!juntos.has(n.id)) {
        juntos.set(n.id, {
          id: n.id,
          nombre: n.name.full,
          japones: n.name.native,
          alternativas: n.name.alternative,
          imagen: n.image?.large ?? null,
          roles: new Set(),
          medios: new Set(),
          voz: null,
        });
      }

      const fila = juntos.get(n.id);

      fila.roles.add(e.role);
      fila.medios.add(`${info.id}:${info.format ?? '?'}`);

      // El nombre japones de AniList a veces es el kanji literal y a
      // veces va con la lectura entre parentesis. Se deja tal cual: es
      // como lo escribe la licencia y no hay una forma "correcta".
      if (!fila.voz && e.voiceActors?.length) {
        fila.voz = e.voiceActors[0].name.full;
      }
    }

    paginaActual++;
  } while (info.characters.pageInfo.hasNextPage && paginaActual < 6);
}

const todos = [...juntos.values()];

const fondo = todos.filter((f) => !ROLES.some((r) => f.roles.has(r)));
const useful = todos
  .filter((f) => ROLES.some((r) => f.roles.has(r)))
  .sort((a, b) => {
    const ra = ROLES.findIndex((r) => a.roles.has(r));
    const rb = ROLES.findIndex((r) => b.roles.has(r));

    return ra - rb || a.id - b.id;
  });

console.log(`  reparto util: ${useful.length}   (de ${todos.length} en total)`);
console.log(`  descartados por ser de fondo: ${fondo.length}`);
console.log('');

for (const f of useful) {
  const rol = ROL_DATO[ROLES.find((r) => f.roles.has(r))];

  console.log(`  ${rol.padEnd(11)} ${f.nombre}`);
  console.log(`  ${''.padEnd(11)} id: ${f.id}`);
  console.log(`  ${''.padEnd(11)} ja: ${f.japones ?? '(sin dato)'}`);
  if (f.voz) console.log(`  ${''.padEnd(11)} voz: ${f.voz}`);
  console.log(`  ${''.padEnd(11)} en: ${[...f.medios].join(' ')}`);
  console.log(`  ${''.padEnd(11)} img: ${f.imagen ?? 'SIN IMAGEN'}`);

  if (f.alternativas?.length) {
    console.log(`  ${''.padEnd(11)} aka: ${f.alternativas.slice(0, 3).join(' / ')}`);
  }

  console.log('');
}

const sinImagen = useful.filter((f) => !f.imagen).length;
const sinVoz = useful.filter((f) => !f.voz).length;

console.log(`  sin imagen: ${sinImagen}   sin voz: ${sinVoz}`);

if (fondo.length > 0) {
  console.log('');
  console.log(`  los descartados (${fondo.length}): ${fondo.slice(0, 14).map((f) => f.nombre).join(', ')}`);
}
