// Saca el reparto verificado de un anime a un JSON.
//    node scripts/exportar-reparto.mjs <id-anilist> [...] <salida.json>
//
// ── PARA QUE ESTE SCRIPT ──────────────────────────────────────
//
// `reparto-anilist.mjs` saca el reparto a la pantalla, que esta bien
// para mirarlo pero mal para usarlo: no se puede copiar a un fichero de
// datos sin volver a escribirlo a mano, y escribirlo a mano es
// justamente lo que sale mal.
//
// Aqui se escribe a disco lo que devuelve AniList: nombre, nombre
// japones, voz, rol y URL de imagen. Son datos que no llevan prosa, y
// por eso no se estropean al guardarlos.
//
// ── LO QUE NO HACE ────────────────────────────────────────────
//
// No pone la temporada de cada personaje ni la descripcion en espanol.
// La temporada hay que decidirla a mano, porque AniList no la tiene
// como campo y algunas decisiones no son suyas: Reze figura en la
// serie de television y en la pelicula, pero no sale en los doce
// capitulos, asi que va solo en la temporada 2.
//
// La descripcion hay que escribirla, y ahi es donde el trabajo de
// verdad esta.

import { writeFile } from 'node:fs/promises';

const argumentos = process.argv.slice(2);
const salida = argumentos.pop();

const ids = argumentos.filter((a) => /^\d+$/.test(a));

if (ids.length === 0 || !salida) {
  console.error('  uso: node scripts/exportar-reparto.mjs <id-anilist> [...] <salida.json>');
  console.error('  por ejemplo: node scripts/exportar-reparto.mjs 127230 171627 csm-reparto.json');

  process.exit(1);
}

const CONSULTA = `query ($id: Int!, $pagina: Int) {
  Media(id: $id, type: ANIME) {
    id
    title { romaji english }
    format
    characters(page: $pagina, sort: [ROLE, RELEVANCE, ID]) {
      pageInfo { hasNextPage }
      edges {
        role
        node { id name { full native } image { large } }
        voiceActors(language: JAPANESE, sort: [RELEVANCE, ID]) { name { full } }
      }
    }
  }
}`;

/**
 * AniList devuelve el rol en mayusculas; el fichero lo usa en minusculas.
 *
 * Solo se exportan `main`, `supporting` y `antagonist`. Los de fondo son
 * figurantes con nombre generico y no sirven para la wiki.
 */
const ROL = { MAIN: 'main', SUPPORTING: 'supporting', ANTAGONIST: 'antagonist' };
const ROLES_UTIL = new Set(Object.keys(ROL));

const medios = new Map();

for (const id of ids) {
  let pagina = 1;
  let info;

  do {
    const r = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: CONSULTA, variables: { id, pagina } }),
    });

    const j = await r.json();

    if (j.errors) {
      console.error(`  AniList ${id}: ${JSON.stringify(j.errors).slice(0, 250)}`);

      process.exit(1);
    }

    info = j.data.Media;

    for (const e of info.characters.edges) {
      if (!ROLES_UTIL.has(e.role)) continue;

      const n = e.node;

      if (!medios.has(n.id)) {
        medios.set(n.id, {
          anilistId: n.id,
          nombre: n.name.full,
          japones: n.name.native,
          voz: e.voiceActors?.[0]?.name?.full ?? null,
          rol: ROL[e.role],
          imagen: n.image?.large ?? null,
          en: [],
        });
      }

      medios.get(n.id).en.push(`${info.title.romaji} (${info.format})`);
    }

    pagina++;
  } while (info.characters.pageInfo.hasNextPage && pagina < 6);
}

console.log(`  personajes: ${medios.size}`);

const conImagen = [...medios.values()].filter((p) => p.imagen).length;
const conVoz = [...medios.values()].filter((p) => p.voz).length;

console.log(`  con imagen: ${conImagen}   con voz: ${conVoz}`);

const sinVoz = [...medios.values()].filter((p) => !p.voz).map((p) => p.nombre);

if (sinVoz.length) console.log(`  SIN voz: ${sinVoz.join(', ')}`);

await writeFile(new URL(`../${salida}`, import.meta.url), JSON.stringify([...medios.values()], null, 2));

console.log(`  escrito en ${salida}`);