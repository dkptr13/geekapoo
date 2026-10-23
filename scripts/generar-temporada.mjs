// Junta los capitulos de UNA temporada y escribe su fichero de datos.
//   node scripts/generar-temporada.mjs <prefijo> <id-imdb> <fichero-json>
//
// De donde sale cada cosa:
//
//   · titulo japones -> TVDB (la wiki solo tiene las temporadas
//     de television; las peliculas y los OVA no aparecen).
//   · titulo, fecha y nota -> IMDb, de la temporada pedida.
//   · resumen -> el fichero JSON de entrada, escrito a mano.
//
// El JSON dice que temporada es, que serie de TVDB le toca y
// cuantos capitulos tiene.
//
// La imagen de cada capitulo la pone despues
// `emparejar-miniaturas-tvdb.mjs`, que busca la serie por su
// titulo y la temporada por su numero.

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = join(aqui, '..');

const prefijo = process.argv[2];
const idImdb = process.argv[3];
const ficheroJson = process.argv[4];

if (!prefijo || !idImdb || !ficheroJson) {
  console.error(
    '  uso: node scripts/generar-temporada.mjs <prefijo> <id-imdb> <fichero-json>',
  );
  process.exit(1);
}

// ── TVDB: los capitulos de una temporada, con su titulo japones ──
async function loginTvdb() {
  const clave = process.env.TVDB_KEY;
  if (!clave) {
    console.error('  falta TVDB_KEY');
    process.exit(1);
  }
  const r = await fetch('https://api4.thetvdb.com/v4/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ apikey: clave }),
  });
  return (await r.json())?.data?.token;
}

async function capitulosTvdb(serie, temporada) {
  const token = await loginTvdb();
  const pedir = async (ruta) => {
    const r = await fetch(`https://api4.thetvdb.com/v4${ruta}`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    });
    return (await r.json())?.data ?? [];
  };

  const capitulos = [];
  for (let pagina = 0; pagina < 20; pagina++) {
    const d = await pedir(`/series/${serie}/episodes/default?page=${pagina}`);
    const lista = d?.episodes ?? [];
    if (!lista.length) break;
    capitulos.push(...lista);
  }
  const mapa = new Map();
  for (const c of capitulos) {
    if ((c.seasonNumber ?? 0) !== temporada) continue;
    if (!c.number) continue;
    mapa.set(c.number, c.name ?? '');
  }
  return mapa;
}

// ── IMDB: titulo, fecha y nota de una temporada ─────────
const CABECERAS = {
  'Content-Type': 'application/json',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
  Origin: 'https://www.imdb.com',
  Referer: 'https://www.imdb.com/',
};

async function capitulosImdb(id, temporada) {
  const Q = `query ($id: ID!) {
    title(id: $id) {
      titleText { text }
      titleType { id }
      releaseDate { day month year }
      ratingsSummary { aggregateRating voteCount }
      episodes {
        episodes(first: 300) {
          edges {
            node {
              titleText { text }
              releaseDate { day month year }
              series { episodeNumber { episodeNumber seasonNumber } }
              ratingsSummary { aggregateRating voteCount }
            }
          }
        }
      }
    }
  }`;
  const r = await fetch('https://api.graphql.imdb.com/', {
    method: 'POST',
    headers: CABECERAS,
    body: JSON.stringify({ query: Q, variables: { id } }),
  });
  const d = await r.json();
  if (d.errors) throw new Error(`IMDb: ${JSON.stringify(d.errors).slice(0, 200)}`);
  const titulo = d.data?.title;
  const capitulos = new Map();

  // Una PELICULA no tiene episodios: es un capitulo entero. Por
  // eso las peliculas del catalogo van como temporada de un solo
  // capitulo, con su fecha y su nota propias.
  if (!titulo.episodes?.episodes?.edges?.length) {
    const rd = titulo.releaseDate;
    const fecha = rd?.year
      ? `${rd.year}-${String(rd.month ?? 1).padStart(2, '0')}-${String(rd.day ?? 1).padStart(2, '0')}`
      : '';
    const nota = titulo.ratingsSummary?.aggregateRating ?? null;
    capitulos.set(1, {
      titulo: titulo.titleText?.text ?? '',
      fecha,
      nota: nota == null ? null : Math.round(nota * 10) / 10,
    });
    return capitulos;
  }

  const edges = titulo.episodes.episodes.edges;
  for (const e of edges) {
    const n = e.node;
    const num = n?.series?.episodeNumber?.episodeNumber;
    const temp = n?.series?.episodeNumber?.seasonNumber;
    if (num == null) continue;
    if (temp !== temporada) continue;
    const rd = n.releaseDate;
    const fecha = rd?.year
      ? `${rd.year}-${String(rd.month ?? 1).padStart(2, '0')}-${String(rd.day ?? 1).padStart(2, '0')}`
      : '';
    const nota = n.ratingsSummary?.aggregateRating ?? null;
    capitulos.set(num, {
      titulo: n.titleText?.text ?? '',
      fecha,
      nota: nota == null ? null : Math.round(nota * 10) / 10,
    });
  }
  return capitulos;
}

// ── Entrada ─────────────────────────────────────────────
const entrada = JSON.parse(await readFile(ficheroJson, 'utf8'));
const temporada = entrada.temporada ?? 1;
const temporadaImdb = entrada.temporadaImdb ?? temporada;

/** Si el titulo japones tiene kanji o kana de verdad. */
const tieneKana = (s) => /[぀-ヿ㐀-鿿]/.test(s);

const deImdb = await capitulosImdb(idImdb, temporadaImdb);
const deTvdb = entrada.tvdb
  ? await capitulosTvdb(entrada.tvdb, entrada.tvdbTemporada ?? temporada)
  : new Map();

// Los titulos en castellano, que son los que guarda el catalogo.
async function leerTitulos(p, temporada) {
  let crudo = '';
  // El fichero de titulos va por temporada, como el de sinopsis.
  for (const nombre of [`${p}-t${temporada}-titulos.txt`, `${p}-titulos.txt`]) {
    try {
      crudo = await readFile(join(raiz, 'scripts', 'entradas', nombre), 'utf8');
      break;
    } catch {
      // Se prueba el siguiente nombre.
    }
  }
  const mapa = new Map();
  for (const linea of crudo.split(/\r?\n/)) {
    const t = linea.trim();
    if (!t) continue;
    const corte = t.indexOf('|');
    if (corte < 0) continue;
    mapa.set(Number(t.slice(0, corte)), t.slice(corte + 1));
  }
  return mapa;
}
const titulosPropios = await leerTitulos(prefijo, temporada);

const numeros = [...deImdb.keys()].sort((a, b) => a - b);
console.log(
  `  ${prefijo} T${temporada}: IMDb ${numeros.length} capitulos · TVDB ${deTvdb.size}`,
);

const filas = [];
for (const n of numeros) {
  const i = deImdb.get(n);
  const sinopsis = entrada.sinopsis?.[n - 1];
  if (!sinopsis) {
    console.error(`  falta la sinopsis del capitulo ${n}`);
    process.exit(1);
  }
  const japonesCrudo = deTvdb.get(n) ?? '';
  const japones = tieneKana(japonesCrudo) ? japonesCrudo : '';
  const titulo = titulosPropios.get(n) || i.titulo;
  filas.push([n, titulo, japones, i.fecha, i.nota ?? 0, sinopsis]);
}

if (entrada.soloVer) {
  for (const f of filas) console.log(`  ${f[0]}\t${f[4]}\t${f[3]}\t${f[1]}\t${f[2]}`);
  process.exit(0);
}

const clave = `T${temporada}`;
const lineas = filas.map(
  (f) =>
    `  [${f[0]}, '${f[1].replace(/'/g, "\\'")}', '${f[2].replace(/'/g, "\\'")}', '${f[3]}', ${f[4]}, '${f[5].replace(/'/g, "\\'")}'],`,
);
const contenido = `${entrada.cabecera ?? ''}\nexport const ${clave} = [\n${lineas.join('\n')}\n];\n`;
const destino = join(raiz, 'scripts', 'datos', `${prefijo}-${clave.toLowerCase()}.mjs`);
await writeFile(destino, contenido, 'utf8');
console.log(`  escrito ${destino}`);