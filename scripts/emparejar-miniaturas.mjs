// Rellena las miniaturas de capitulo desde AniList, verificando cada una.
//    node scripts/emparejar-miniaturas.mjs [--anime <id>] [--escribir]
//
// ── DONDE ESTAN LAS MINIATURAS ─────────────────────────────────────
//
// AniList no tiene un tipo `Episode`. Lo que tiene es
// `Media.streamingEpisodes`: la lista de capitulos con la plataforma en la
// que se emiten, y cada elemento trae un campo `thumbnail` con una URL
// de imagen real, alojada en el CDN de Crunchyroll. De ahi sale lo que
// se puede poner.
//
// ── POR QUE NO SE PUEDE USAR A CIEGAS ─────────────────────────────
//
// Esa lista no es de fiar. En Grand Blue, AniList devuelve cinco
// capitulos que no son de Grand Blue: son el 1 al 5 de Saekano ♭, con
// sus mismos titulos y sus mismas imagenes. Grand Blue y Grand Blue
// Season 2 reciben archivos de tamano identico byte a byte, y la imagen
// que sale es Utaha, Eriri y Megumi.
//
// Escribir eso sin mirar produce justo el fallo que mas da pan: una
// imagen que carga, se ve bien y es de otra serie. Por eso hay dos
// filtros antes de escribir nada:
//
//   1. El titulo que da AniList tiene que coincidir con el que da IMDb
//      para ese numero de capitulo. IMDb es independiente de AniList, de
//      modo que que los dos esten de acuerdo es una comprobacion de
//      verdad y no una conjetura.
//
//   2. Si esa misma miniatura ya esta puesta en otro capitulo de otro
//      anime, se descarta.
//
// ── EL DESPLAZAMIENTO DE NUMEROS ───────────────────────────────────
//
// Unas series numeran desde cero (Saekano va del 0 al 12) y otras desde
// uno. El catalogo va siempre del 1. Se deduce de si la lista de
// AniList empieza en cero, y se comprueba que el numero final cae
// dentro de los capitulos que tiene esa temporada.

import { coleccion, escribir, str, num } from './firestore-rest.mjs';
import * as anilist from './anilist.mjs';
import { elegirTemporadas } from './temporadas-anilist.mjs';
import { comoBuscar } from './busquedas-anime.mjs';

// ── Utilidades ─────────────────────────────────────────────────────

const normalizar = (s) =>
  (s ?? '')
    .toLowerCase()
    .replace(/[''\u2019]/g, "'")
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

// "Episode 12 - The Ups and Downs" -> { numero: 12, titulo: "..." }
function descomponer(titulo) {
  const m = /^episode\s*(\d+)\s*[-–—:]?\s*(.*)$/i.exec(titulo ?? '');

  if (!m) return null;

  return { numero: Number(m[1]), titulo: m[2].trim() };
}

// ── IMDb ───────────────────────────────────────────────────────────

const CABECERAS_IMDB = {
  'Content-Type': 'application/json',
  Origin: 'https://www.imdb.com',
  Referer: 'https://www.imdb.com/',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
};

async function pedirImdb(consulta, variables) {
  const r = await fetch('https://api.graphql.imdb.com/', {
    method: 'POST',
    headers: CABECERAS_IMDB,
    body: JSON.stringify({ query: consulta, variables }),
  });

  return (await r.json()).data;
}

async function buscarImdbId(nombre) {
  const r = await fetch(
    `https://v2.sg.media-imdb.com/suggestion/x/${encodeURIComponent(nombre)}.json`,
    { headers: { 'User-Agent': 'Mozilla/5.0' } },
  );

  const d = await r.json();

  return (d.d ?? []).find((x) => x.q === 'TV series')?.id ?? null;
}

const Q_EPIS = `query ($id: ID!) {
  title(id: $id) {
    episodes {
      seasons { number }
      episodes(first: 300) {
        edges {
          node {
            titleText { text }
            series { episodeNumber { seasonNumber episodeNumber } }
          }
        }
      }
    }
  }
}`;

async function titulosImdb(imdbId) {
  const d = await pedirImdb(Q_EPIS, { id: imdbId });

  const porTemporada = new Map();

  for (const e of d?.title?.episodes?.episodes?.edges ?? []) {
    const n = e.node.series?.episodeNumber;

    if (!n) continue;

    const lista = porTemporada.get(n.seasonNumber) ?? [];

    lista.push({ numero: n.episodeNumber, titulo: e.node.titleText?.text ?? '' });

    porTemporada.set(n.seasonNumber, lista);
  }

  for (const lista of porTemporada.values()) lista.sort((a, b) => a.numero - b.numero);

return porTemporada;

}
// Numero de temporada en IMDb para una temporada del catalogo.
//
// Lo normal es que coincidan: temporada 1 con temporada 1, la 2 con la
// 2. Antes esto se deducia buscando la temporada de IMDb que tuviera un
// capitulo numero 0, y eso estaba mal: cuando la serie empieza a numerar
// en cero, esa busqueda devuelve SIEMPRE la primera temporada de IMDb,
// asi que las imagenes de la segunda se comparaban contra los titulos de
// la primera y pasaban el filtro sin ser las suyas.
//
// Con esto no hay que deducir nada: la temporada N del catalogo se
// busca la N de IMDb. Si no existe, se coge la que mas capitulos tenga.

function temporadaDeImdb(titulos, numeroTemporada, cuantos) {
  const directa = titulos.get(numeroTemporada);

  if (directa?.length) return numeroTemporada;

  const numeros = [...titulos.keys()].sort((a, b) => a - b);

  return numeros.find((t) => (titulos.get(t) ?? []).length === cuantos) ?? numeros[0];
}

const Q_STREAMING = `query ($id: Int!) {
  Media(id: $id, type: ANIME) {
    id
    title { romaji }
    episodes
    streamingEpisodes { title site thumbnail }
  }
}`;

async function streamingDe(idMedia) {
  const r = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: Q_STREAMING, variables: { id: idMedia } }),
  });

  return (await r.json())?.data?.Media ?? null;
}

// ── Opciones ───────────────────────────────────────────────────────

const args = process.argv.slice(2);
const escribirEnBase = args.includes('--escribir');
const relajar = args.includes('--relajar');
const soloAnime = args.includes('--anime') ? args[args.indexOf('--anime') + 1] : null;

// ── Catalogo ───────────────────────────────────────────────────────

const animes = await coleccion('animes');
const capitulos = await coleccion('episodes');
const temporadas = await coleccion('seasons');

// Capitulos por anime y por numero de temporada.
const porAnime = new Map();

for (const c of capitulos) {
  const anime = str(c.f, 'animeId');

  const filas = porAnime.get(anime) ?? new Map();

// El campo del capitulo es `seasonId`, en singular. `seasonIds` en plural
  // es el de los personajes, y leerlo aqui daria `undefined` en todos los
  // capitulos.
  const temporadaId = str(c.f, 'seasonId') ?? '';

  const numeroTemporada = (temporadaId.match(/-s(\d+)$/) ?? [])[1] ?? '?';

  const lista = filas.get(numeroTemporada) ?? [];

  lista.push({
    id: c.id,
    numero: num(c.f, 'number') ?? 0,
    titulo: str(c.f, 'title'),
    yaTiene: str(c.f, 'thumbnailUrl').length > 0,
  });

  filas.set(numeroTemporada, lista);

  porAnime.set(anime, filas);
}

// Miniatura -> capitulos que la usan, para no repetirla.
const usadas = new Map();

for (const c of capitulos) {
  const u = str(c.f, 'thumbnailUrl');

  if (!u) continue;

  const lista = usadas.get(u) ?? [];

  lista.push(c.id);

  usadas.set(u, lista);
}

// ── Paso 1: comprobar ──────────────────────────────────────────────

let totalNuevas = 0;
let totalSaltadas = 0;
let sinVerificar = 0;

for (const anime of animes) {
  const id = anime.id;
  const nombre = str(anime.f, 'title');

  if (soloAnime && id !== soloAnime) continue;

const base = await anilist.buscarAnime(comoBuscar(id, nombre));

  if (!base) {
    console.log(`${id}: AniList no encuentra "${nombre}"`);
    continue;
  }

  const { todos } = await anilist.arbol(base.id);

  if (!todos.size) continue;

  const delCatalogo = porAnime.get(id);

  if (!delCatalogo) continue;

const imdbId = await buscarImdbId(comoBuscar(id, nombre));

  if (!imdbId) {
    console.log(`${id}: sin serie en IMDb, no se puede verificar`);
    sinVerificar++;
    continue;
  }

  const titulos = await titulosImdb(imdbId);

  if (!titulos.size) {
    console.log(`${id}: IMDb (${imdbId}) no lista capitulos`);
    sinVerificar++;
    continue;
  }

  console.log(`\n=== ${id}   IMDb ${imdbId}`);

  // `number` y `year` de las temporadas son enteros: con `str` salen
  // vacios y todas las temporadas se quedan en cero.
  const delCatalogoT = temporadas
    .filter((s) => str(s.f, 'animeId') === id)
    .map((s) => ({
      numero: num(s.f, 'number') ?? 0,
      anio: num(s.f, 'year') ?? 0,
      titulo: str(s.f, 'title'),
    }))
    .sort((a, b) => a.numero - b.numero);

  const decisiones = elegirTemporadas(delCatalogoT, todos, base);

  for (const [i, temporada] of delCatalogoT.entries()) {
    const { elegido, explicacion } = decisiones[i];

    const lista = delCatalogo.get(String(temporada.numero)) ?? [];

    if (!elegido) {
      console.log(`  T${temporada.numero}: sin media en AniList (${explicacion})`);
      continue;
    }

    const info = await streamingDe(elegido.id);

    const conImagen = (info?.streamingEpisodes ?? []).filter((e) => e.thumbnail);

    if (!conImagen.length) {
console.log(`  T${temporada.numero}: AniList no tiene miniaturas de esta temporada`);
      continue;
    }

    const buenos = conImagen.map((e) => ({ ...descomponer(e.title), url: e.thumbnail }))
      .filter((d) => d !== null);

    const menor = Math.min(...buenos.map((d) => d.numero));
    const desplazamiento = menor === 0 ? 1 : 0;

const temporadaImdb = temporadaDeImdb(titulos, temporada.numero, lista.length);
    const deImdb = titulos.get(temporadaImdb) ?? [];

    let puestas = 0;
    let saltadas = 0;

    for (const d of buenos) {
      const numeroCatalogo = d.numero + desplazamiento;

      const nuestro = lista.find((c) => c.numero === numeroCatalogo);

      if (!nuestro || nuestro.yaTiene) {
        saltadas++;
        continue;
      }

// ── Filtro 1: IMDb tiene que estar de acuerdo ─────────────────────
      //
      // Este filtro es el que detecta que la lista de capitulos que
      // devuelve AniList es de otra serie: Grand Blue trae cinco
      // capitulos de Saekano ♭ y los titulos no coinciden con ninguno.
      //
      // Pero tambien descarta capitulos buenos, porque IMDb no siempre
      // tiene el titulo oficial. En Tokyo Ghoul, AniList da Tragedy,
      // Incubation y Dove, que son los titulos reales, e IMDb da New
      // Surge, Dancing Flowers y Hangman. En Toradora y en Your Lie in
      // April pasa lo mismo.
      //
      // Para esos casos esta `--relajar`, que se salta este filtro y
      // deja solo el segundo (que la misma miniatura no este ya puesta en
      // otro capitulo). Con eso solo se rellena la primera temporada del
      // anime, que es la unica que tiene datos propios: el filtro del
      // duplicado para las siguientes.
      //
      // Y aun asi hay que mirar las imagenes antes de usar `--relajar`.
      // Los tres animes para los que se ha usado estan en la lista de
      // `REVISADOS`, con lo que se vio al mirar la imagen.

const referencia = deImdb.find((x) => x.numero === d.numero);

if (!relajar && (!referencia || normalizar(referencia.titulo) !== normalizar(d.titulo))) {
  saltadas++;
  continue;
}
      // ── Filtro 2: que no este ya en otro capitulo ──────────────

      const previa = usadas.get(d.url);

      if (previa && previa.includes(nuestro.id)) continue;
      if (previa && previa.length) {
        saltadas++;
        continue;
      }

      puestas++;
      totalNuevas++;

      console.log(
        `  T${temporada.numero} ${String(numeroCatalogo).padStart(3)}  ${d.titulo.slice(0, 44).padEnd(46)}${d.url.slice(0, 88)}`,
      );

      if (escribirEnBase) {
        await escribir('episodes', nuestro.id, { thumbnailUrl: { stringValue: d.url } }, [
          'thumbnailUrl',
        ]);

        nuestro.yaTiene = true;
      }

      const listaUsadas = usadas.get(d.url) ?? [];

      listaUsadas.push(nuestro.id);

      usadas.set(d.url, listaUsadas);
    }

    totalSaltadas += saltadas;

console.log(
      `  T${temporada.numero}: ${conImagen.length} en AniList ` +
        `(desplazamiento ${desplazamiento}), ${puestas} verificadas` +
        (saltadas ? `, ${saltadas} descartadas` : ''),
    );
  }
}

console.log(
  `\n${totalNuevas} verificadas, ${totalSaltadas} descartadas` +
    (sinVerificar ? `, ${sinVerificar} animes sin poder verificar` : ''),
);

if (!escribirEnBase && totalNuevas) console.log('\nNo se ha escrito nada. Usa --escribir.');