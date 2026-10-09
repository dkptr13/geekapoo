// Cliente de la API de AniList para los scripts de imagenes.
//
//    import { buscarAnime, arbol, personajes, temporadas } from './anilist.mjs';
//
// ── QUE ES Y QUE NO ES ────────────────────────────────────────────
//
// Consulta la API GraphQL publica de AniList y devuelve URLs de
// imagenes. NO descarga ni sube archivos: el script que lo usa se
// limita a guardar la URL, y la imagen se sigue sirviendo desde el CDN
// de AniList.
//
// Enlazar no es copiar: el archivo nunca pasa por el servidor. Aun
// asi, las condiciones de AniList hablan de uso personal y sin
// animo de lucro, y el enlace en caliente tiene sus riesgos. Quien use
// esto deberia haberlas leido antes, no confiar en el script.
//
// ── LIMITE DE PETICIONES ──────────────────────────────────────────
//
// AniList acepta 90 peticiones por minuto; si te pasas, baja a 30 y
// responde 429 con `Retry-After`. Este modulo espera lo que indique la
// cabecera en vez de reintentar a lo loco, que es lo que convierte un
// limite de ritmo en un 403.

import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';

// OJO: esto se llama `ENDPOINT` y no `URL` a proposito. Declarar
// `const URL = ...` tapa el constructor global del mismo nombre, y
// entonces el `new URL(...)` de la cache de mas abajo falla con
// "URL is not a constructor", que no dice nada de la causa.
const ENDPOINT = 'https://graphql.anilist.co';

// ── CACHE EN DISCO ─────────────────────────────────────────────────
//
// Sin esto, recorrer las relaciones de Ataque a los Titanes son unas
// 30 peticiones y el limite de AniList baja a 30 por minuto en cuanto
// te pasas: el script se come diez minutos por anime y se queda sin
// tokens a mitad. Y como esto se ejecuta varias veces mientras se
// revisa, casi siempre es lo mismo.
//
// La cache guarda la respuesta cruda de cada consulta con un TTL
// largo. Los datos de AniList no cambian cada hora, asi que un dia de
// margen no hace perder nada.

const DIR_CACHE = new URL('./.cache-anilist/', import.meta.url);
const TTL_MS = 24 * 60 * 60 * 1000;

function rutaDeCache(consulta, variables) {
  const clave = consulta + '::' + JSON.stringify(variables);

  // El nombre del archivo va hasheado porque una consulta lleva saltos
  // de linea y corchetes que no valen en Windows.
  let h = 0;

  for (let i = 0; i < clave.length; i++) {
    h = (h * 31 + clave.charCodeAt(i)) | 0;
  }

  return new URL(`q${(h >>> 0).toString(36)}.json`, DIR_CACHE);
}

async function leerCache(ruta) {
  try {
    const texto = await readFile(ruta, 'utf8');
    const guardado = JSON.parse(texto);

    if (Date.now() - guardado.cuando < TTL_MS) return guardado.datos;

    // Caducado: se borra para que no ocupe sin servir para nada.
    await unlink(ruta).catch(() => {});
  } catch {
    // no hay cache, o esta corrupta: se pide a AniList
  }

  return undefined;
}

async function guardarCache(ruta, datos) {
  try {
    await mkdir(DIR_CACHE, { recursive: true });
    await writeFile(ruta, JSON.stringify({ cuando: Date.now(), datos }));
  } catch {
    // sin cache no se rompe nada, solo se repite la peticion
  }
}

let peticionesDeEstaPasada = 0;

async function pedir(consulta, variables = {}) {
  const ruta = rutaDeCache(consulta, variables);
  const deCache = await leerCache(ruta);

  if (deCache !== undefined) return deCache;

  for (;;) {
    const r = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query: consulta, variables }),
    });

    if (r.status === 429) {
      const espera = Math.max(Number(r.headers.get('retry-after') ?? 10), 5);

      // AniList manda `retry-after: 0` cuando solo esta aplicando el
      // limite suave. Esperar 0s no cuenta como esperar: se llega al
      // mismo 429 otra vez y el bucle se queda dando vueltas.
      if (peticionesDeEstaPasada % 5 === 0 || espera >= 5) {
        console.log(`  (limite de AniList, esperando ${espera}s)`);
      }

      await new Promise((res) => setTimeout(res, espera * 1000));

      continue;
    }

    if (!r.ok) {
      const cuerpo = await r.text();

      // Un 404 con `data` no es un fallo: AniList responde "Not Found"
      // con `{"data":{"Character":null},"errors":[...]}` cuando el
      // nombre no existe en su base. Es un "no hay", que es justo lo
      // que el script quiere saber, no un error que merezca tumbarlo.
      try {
        const json = JSON.parse(cuerpo);

        if (json.data) {
          await guardarCache(ruta, json.data);
          return json.data;
        }
      } catch {
        // no es JSON: cae al throw de abajo
      }

      throw new Error(`AniList ${r.status}: ${cuerpo.slice(0, 300)}`);
    }

    const d = await r.json();

    if (d.errors) throw new Error(`AniList: ${JSON.stringify(d.errors).slice(0, 300)}`);

    peticionesDeEstaPasada++;
    await guardarCache(ruta, d.data);

    return d.data;
  }
}

// ── Buscar el anime base ───────────────────────────────────────────

const Q_BUSCAR = `query ($nombre: String) {
  Media(search: $nombre, type: ANIME) {
    id
    title { romaji english }
    seasonYear
    coverImage { extraLarge }
    bannerImage
  }
}`;

/**
 * Busca un anime por nombre y devuelve el primer resultado.
 *
 * @returns {Promise<null | {id:number, titulo:string, portada:string, banner:string, anio:number|null}>}
 */
export async function buscarAnime(nombre) {
  const d = await pedir(Q_BUSCAR, { nombre });
  const m = d?.Media;

  if (!m) return null;

  return {
    id: m.id,
    titulo: m.title.romaji,
    portada: m.coverImage?.extraLarge ?? null,
    banner: m.bannerImage ?? null,
    anio: m.seasonYear ?? null,
  };
}

// ── Arbol de temporadas ────────────────────────────────────────────
//
// En AniList cada temporada es un Media DISTINTO, no una propiedad del
// primero. La forma de llegar a la tercera es saltar del segundo, asi
// que hay que recorrer las relaciones en vez de pedirlas todas de una
// vez.
//
// Y no todas las relaciones son temporadas seguidas: un PRequel, una
// historia paralela o un resumen tambien salen ahi. Por eso se
// recorren todas y luego se ordenan por el numero de temporada que
// lleva el titulo.

const Q_RELACIONES = `query ($id: Int) {
  Media(id: $id, type: ANIME) {
    id
    title { romaji }
    seasonYear
    format
    coverImage { extraLarge }
    bannerImage
    relations {
      edges {
        relationType(version: 2)
        node {
          id
          type
          title { romaji }
          seasonYear
          format
          coverImage { extraLarge }
          bannerImage
        }
      }
    }
  }
}`;

const nodoDe = (m, relacion = null) => ({
  id: m.id,
  titulo: m.title.romaji,
  anio: m.seasonYear ?? null,
  formato: m.format ?? null,
  portada: m.coverImage?.extraLarge ?? null,
  banner: m.bannerImage ?? null,
  relacion,
});

/**
 * Devuelve el anime base y TODOS los animes relacionados que salgan en
 * su misma franquicia, indexados por id.
 *
 * ── POR QUE HAY QUE FILTRAR POR FRANQUICIA ────────────────────────
 *
 * Las relaciones de AniList no se quedan en la serie. Recorriendolas
 * en crudo, Ataque a los Titanes llegaba a 200 media, y entre ellas
 * estaban "Love Live! Sunshine!! 2nd Season" o "Enen no Shouboutai":
 * una relacion apunta a una aparicion de un personaje en otra serie, y
 * desde ahi el arbol se ramifica hacia franquicias enteras.
 *
 * El filtro es que el titulo comparta alguna palabra con el del anime
 * base. "Shingeki no Kyojin Season 2" la comparte, "Love Live!" no, y
 * asi el recorrido se queda donde debe.
 *
 * @returns {Promise<{base:object, todos:Map<number,object>}>}
 */
export async function arbol(idBase) {
  const vistos = new Set();
  const todos = new Map();
  let base = null;
  let palabrasBase = null;
  const cola = [idBase];

  while (cola.length && vistos.size < 120) {
    const id = cola.shift();

    if (vistos.has(id)) continue;
    vistos.add(id);

    const d = await pedir(Q_RELACIONES, { id });
    const m = d?.Media;

    if (!m) continue;

    const nodo = nodoDe(m);

    if (id === idBase) {
      base = nodo;
      todos.set(m.id, nodo);
      palabrasBase = new Set(palabrasDe(nodo.titulo));
    } else {
      // Fuera de la franquicia no se sigue: no se guarda ni se encola
      // a donde seguir, que es como el arbol se metia en "Love Live!".
      if (!palabrasBase || !compartePalabra(nodo.titulo, palabrasBase)) continue;

      todos.set(m.id, nodo);
    }

    for (const e of m.relations?.edges ?? []) {
      if (e.node.type !== 'ANIME') continue;
      if (!vistos.has(e.node.id)) cola.push(e.node.id);
    }
  }

  return { base, todos };
}

/**
 * Palabras "con peso" de un titulo, sin los numeros sueltos: en
 * "Season 2" o "OVA" el numero no distingue una temporada de otra.
 */
export function palabrasDe(titulo) {
  return new Set(
    (titulo ?? '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((p) => p.length > 2 && !/^\d+$/.test(p)),
  );
}

/** ¿Comparten alguna palabra estos dos titulos? */
export function compartePalabra(titulo, palabras) {
  for (const p of palabrasDe(titulo)) if (palabras.has(p)) return true;

  return false;
}

// ── Numero de temporada en el titulo ───────────────────────────────

/**
 * Saca el numero de temporada de un titulo de AniList.
 *
 * Los titulos viene en varios formatos y hay que reconocerlos todos:
 *
 *   "[Oshi no Ko] 2nd Season"   -> 2
 *   "Kaguya-sama 3rd Season"    -> 3
 *   "Frieren Season 2"          -> 2
 *   "Re:Zero 2nd Season Part 2" -> 2
 *
 * Las palabras sueltas ("the beginning", "the movie") NO dan numero:
 * es mejor no devolver nada que inventar un 1.
 *
 * @returns {number | null}
 */
export function numeroDeTemporada(titulo) {
  if (!titulo) return null;

  const t = titulo;

  // "2nd Season", "3rd Season"...
  const ord = /\b(\d+)(?:st|nd|rd|th)\s+season\b/i.exec(t);
  if (ord) return Number(ord[1]);

  // "Season 2", "Season 3 - Un climax avassalador"
  const num = /\bseason\s+(\d+)/i.exec(t);
  if (num) return Number(num[1]);

  // "2ª temporada", "3. Staffel" (aleman), "2 saison" (frances)
  const otros = [/\b(\d+)\s*[ªa]\s*temporada\b/i, /\bstaffel\s+(\d+)/i, /\bsaison\s+(\d+)/i];
  for (const re of otros) {
    const m = re.exec(t);
    if (m) return Number(m[1]);
  }

  // japones: 第2期
  const jp = /第\s*(\d+)\s*期/.exec(t);
  if (jp) return Number(jp[1]);

  return null;
}

// ── Personajes de un anime ─────────────────────────────────────────

const Q_PERSONAJES = `query ($id: Int, $pagina: Int) {
  Media(id: $id, type: ANIME) {
    characters(page: $pagina, perPage: 50, sort: [ROLE, ID]) {
      pageInfo { hasNextPage }
      edges {
        role
        node {
          id
          name { full native }
          image { large }
        }
      }
    }
  }
}`;

/**
 * Todos los personajes de un anime que tengan imagen.
 *
 * @returns {Promise<{nombre:string, nativo:string, imagen:string, id:number}[]>}
 */
export async function personajes(idMedia) {
  const salida = [];
  let pagina = 1;

  for (;;) {
    const d = await pedir(Q_PERSONAJES, { id: idMedia, pagina });
    const m = d?.Media;

    if (!m) break;

    for (const e of m.characters.edges) {
      if (!e.node.image?.large) continue;

      salida.push({
        id: e.node.id,
        nombre: e.node.name.full,
        nativo: e.node.name.native ?? '',
        imagen: e.node.image.large,
      });
    }

    if (!m.characters.pageInfo.hasNextPage) break;

    pagina++;
  }

  return salida;
}

/**
 * Formatos que NO son una temporada y se dejan fuera.
 *
 * Antes esto era una lista de formatos válidos (TV, TV_SHORT, MOVIE) y
 * por eso Cyberpunk: Edgerunners y Witch Hat Atelier se quedaban sin
 * candidatos: en AniList los dos son ONA, no TV. Una lista de
 * EXCLUIDOS aguanta mejor, porque lo único que de verdad no es una
 * temporada es el recap.
 */
const FORMATOS_EXCLUIDOS = new Set(['SPECIAL']);

/**
 * Personajes de VARIOS animes a la vez, unidos y sin repetir.
 *
 * ── POR QUE HACE FALTA ────────────────────────────────────────────
 *
 * La lista de personajes de un anime es la de ESE anime. La primera
 * temporada de Ataque a los Titanes no tiene a Zeke, porque no sale
 * hasta la segunda, y a Historia la llama "Krista Lenz", que es el
 * nombre con el que aparece en la primera. Buscando solo en la
 * temporada base, los personajes que no debutan en ella se quedan sin
 * imagen, y son justo los más conocidos.
 *
 * Uniendo las listas de todas las temporadas de la franquicia, salen
 * todos. Se deduplican por el id de AniList, que es el único fiable:
 * el mismo personaje aparece con nombres distintos en cada temporada.
 *
 * @param {Map<number,object>} todos  Medias de la franquicia.
 * @returns {Promise<{nombre:string,nativo:string,imagen:string,id:number}[]>}
 */
export async function personajesDeFranquicia(todos) {
  const vistos = new Map();

  const ids = [...todos.values()]
    .filter((m) => !FORMATOS_EXCLUIDOS.has(m.formato))
    .map((m) => m.id);

  for (const id of ids) {
    for (const c of await personajes(id)) {
      if (!vistos.has(c.id)) vistos.set(c.id, c);
    }
  }

  return [...vistos.values()];
}

// ── Buscar un personaje suelto ─────────────────────────────────────

const Q_BUSCAR_PERSONAJE = `query ($nombre: String) {
  Character(search: $nombre) {
    id
    name { full native }
    image { large }
    media(perPage: 20) {
      edges {
        node { id type title { romaji } }
      }
    }
  }
}`;

/**
 * Busca un personaje en TODA la base de AniList, no solo en un anime.
 *
 * Es la red de seguridad para los que no salen en la lista de
 * personajes del anime pero AniList los tiene en su propia ficha.
 *
 * ── POR QUE DEVUELVE LOS ANIMES EN LOS QUE SALE ───────────────────
 *
 * Porque la busqueda por nombre da falsos positivos con bastante
 * facilidad: "Miyu" devuelve a "Miyuki Shirogane", de Kaguya-sama, y
 * "Tsukuyomi" a "Tsukasa Yuzaki", de Tonikaku Kawaii. Ninguno de los
 * dos es el personaje que se busca. Quien use esto tiene que
 * comprobar que el resultado sale en el anime que interesa; por eso se
 * devuelve la lista en vez de decidir aqui.
 *
 * @returns {Promise<null | {id:number,nombre:string,nativo:string,imagen:string,animes:{id:number,titulo:string}[]}>}
 */
export async function buscarPersonaje(nombre) {
  const d = await pedir(Q_BUSCAR_PERSONAJE, { nombre });
  const c = d?.Character;

  if (!c) return null;

  return {
    id: c.id,
    nombre: c.name.full,
    nativo: c.name.native ?? '',
    imagen: c.image?.large ?? null,
    animes: (c.media?.edges ?? [])
      .filter((e) => e.node.type === 'ANIME')
      .map((e) => ({ id: e.node.id, titulo: e.node.title.romaji })),
  };
}