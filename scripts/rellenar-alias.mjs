// Rellena los alias de búsqueda desde AniList, sin inventar ninguno.
//    node scripts/rellenar-alias.mjs [--escribir] [--anime <id>] [--solo <animes|personajes>]
//
// Escribe dos campos que la búsqueda inteligente ya sabe leer:
//
//   animes/{id}      alternativeTitles: inglés + sinónimos de AniList
//   characters/{id}  aliases:           apodos de AniList
//
// Sin --escribir enseña lo que pondría y no toca nada.
//
// ── POR QUÉ HACE FALTA ─────────────────────────────────────
//
// AniList sabe que "Ataque a los Titanes" también es "Attack on
// Titan" y "Shingeki no Kyojin", y que "Eren Yeager" también es
// "Eren Jaeger". Esa información ya se usaba para portadas y
// repartos, pero no estaba guardada en ningún documento, así
// que el buscador no podía usarla.
//
// ── CÓMO NO SE CUELA UNA OBRA DISTINTA ──────────────────────
//
// AniList devuelve parecidos al buscar ("Bear in the Big Blue
// House" al buscar "Grand Blue"). Para no pegar los alias de
// otro anime se exigen dos cosas a la vez:
//
//   1. El año coincide (±1 con el del catálogo).
//   2. El título del catálogo comparte alguna palabra con el
//      romanizado, el inglés, el nativo o un sinónimo.
//
// Y para personajes, el nombre o el japonés tienen que ser el
// mismo normalizado: sin coincidencia exacta no hay alias.
//
// Los documentos antiguos sin estos campos siguen funcionando:
// la búsqueda los encuentra por el título principal.

import { coleccion, escribir, str, num, arrayDe } from './firestore-rest.mjs';
import { comoBuscar } from './busquedas-anime.mjs';
import { arbol } from './anilist.mjs';
import { mkdir, readFile, writeFile, unlink, readdir } from 'node:fs/promises';

const args = process.argv.slice(2);
const ESCRIBIR = args.includes('--escribir');
const solo = (() => {
  const i = args.indexOf('--solo');
  return i >= 0 ? args[i + 1] : null;
})();
const soloAnimes = args.reduce((acc, a, k) => (a === '--anime' ? [...acc, args[k + 1]] : acc), []);

if (solo && solo !== 'animes' && solo !== 'personajes') {
  console.error('  --solo debe ser: animes | personajes');
  process.exit(1);
}

// Títulos españoles de la licencia que AniList no trae en sus
// sinónimos, verificados uno a uno: la búsqueda de AniList los
// devuelve dentro de la misma franquicia ("Guardianes de la
// Noche" -> la peli de Mugen) y son el título de la
// distribuidora en España. Solo se añaden, nunca se quitan.
const MANUALES = {
  'kimetsu-no-yaiba': ['Guardianes de la Noche'],
};

// Apodos que AniList no trae pero la serie sí usa, verificados
// en los créditos ("Krista Lenz" es la propia ficha 62481 de
// AniList en la T1). Por id de documento del catálogo.
const MANUALES_PERSONAJES = {
  'ataque-a-los-titanes-historia-reiss': ['Krista Lenz'],
};

// ── AniList ──────────────────────────────────────────────────

const Q_MEDIA = `query ($q: String) {
  Page(perPage: 5) {
    media(search: $q, type: ANIME) {
      id
      title { romaji english native }
      synonyms
      seasonYear
    }
  }
}`;

const Q_PERSONAJES = `query ($id: Int, $pagina: Int) {
  Media(id: $id, type: ANIME) {
    characters(page: $pagina, perPage: 50, sort: [ROLE, ID]) {
      pageInfo { hasNextPage }
      edges {
        role
        node { id name { full native alternative } }
      }
    }
  }
}`;

async function pedir(consulta, variables) {
  const ruta = rutaDeCache(consulta, variables);
  const deCache = await leerCache(ruta);
  if (deCache !== undefined) return deCache;
  for (;;) {
    const r = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query: consulta, variables }),
    });
    if (r.status === 429) {
      const espera = Math.max(Number(r.headers.get('retry-after') ?? 10), 5);
      await new Promise((res) => setTimeout(res, espera * 1000));
      continue;
    }
    const d = await r.json();
    if (d.errors) throw new Error(`AniList: ${JSON.stringify(d.errors).slice(0, 200)}`);
    await guardarCache(ruta, d.data);
    return d.data;
  }
}

// ── Caché en disco ───────────────────────────────────────────
//
// Igual que la de `anilist.mjs`: las respuestas no cambian cada
// hora y una pasada son cientos de peticiones. Sin esto, cada
// ejecución (el seco y la de verdad) lo pide todo dos veces y
// AniList responde 429 a mitad.

// ── Normalización mínima, solo para comparar ─────────────────

const normal = (s) =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const palabras = (s) =>
  new Set(normal(s).split(' ').filter((p) => p.length > 2 && !/^\d+$/.test(p)));

const compartePalabra = (titulo, candidatas) => {
  const mias = palabras(titulo);
  for (const c of candidatas) {
    for (const p of palabras(c)) if (mias.has(p)) return true;
  }
  return false;
};

/** Quita duplicados (normalizados) y los que ya son el título. */
const limpiar = (candidatos, titulosPropios) => {
  const propios = new Set(titulosPropios.map(normal).filter(Boolean));
  const vistos = new Set();
  const salida = [];
  for (const c of candidatos) {
    const texto = String(c ?? '').trim();
    const k = normal(texto);
    if (!k || propios.has(k) || vistos.has(k)) continue;
    vistos.add(k);
    salida.push(texto);
  }
  return salida;
};

const DIR_CACHE = new URL('./.cache-alias/', import.meta.url);
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

function rutaDeCache(consulta, variables) {
  const clave = consulta + '::' + JSON.stringify(variables);
  let h = 0;
  for (let i = 0; i < clave.length; i++) h = (h * 31 + clave.charCodeAt(i)) | 0;
  return new URL(`q${(h >>> 0).toString(36)}.json`, DIR_CACHE);
}

async function leerCache(ruta) {
  try {
    const guardado = JSON.parse(await readFile(ruta, 'utf8'));
    if (Date.now() - guardado.cuando < TTL_MS) return guardado.datos;
    await unlink(ruta).catch(() => {});
  } catch {
    // no hay caché: se pide a AniList
  }
  return undefined;
}

async function guardarCache(ruta, datos) {
  try {
    await mkdir(DIR_CACHE, { recursive: true });
    await writeFile(ruta, JSON.stringify({ cuando: Date.now(), datos }));
  } catch {
    // sin caché no se rompe nada
  }
}

// ── Datos ────────────────────────────────────────────────────

const animes = await coleccion('animes');
const personajes = await coleccion('characters');
const capitulos = await coleccion('episodes');

// Capítulos por anime, para detectar pelis (uno solo).
const capitulosPorAnime = new Map();
for (const c of capitulos) {
  const id = str(c.f, 'animeId');
  capitulosPorAnime.set(id, (capitulosPorAnime.get(id) ?? 0) + 1);
}

// Prefijo de datos (knk, yn...) por ANIME_ID, leyendo los metas.
// Hace falta para el título del capítulo único de las pelis.
const prefijoPorAnime = new Map();
{
  const base = new URL('./datos/', import.meta.url);
  const { readdir: leerDir } = await import('node:fs/promises');
  for (const f of await leerDir(base)) {
    if (!f.endsWith('-meta.mjs')) continue;
    try {
      const meta = await import(new URL(f, base));
      if (meta.ANIME_ID) prefijoPorAnime.set(meta.ANIME_ID, f.replace('-meta.mjs', ''));
    } catch {
      // un meta roto no para el relleno
    }
  }
}

/**
 * Título del capítulo único de una peli ("Tu nombre",
 * "El tiempo contigo"...). Es el título español de la
 * licencia y sale de nuestros propios datos, no se inventa.
 * Para series no vale: el E1 no es alias de la serie.
 */
async function tituloPeli(animeId) {
  if (capitulosPorAnime.get(animeId) !== 1) return null;
  const prefijo = prefijoPorAnime.get(animeId);
  if (!prefijo) return null;
  try {
    const base = new URL('./datos/', import.meta.url);
    const mod = await import(new URL(`${prefijo}-t1.mjs`, base));
    const titulo = mod?.T1?.[0]?.[1];
    return typeof titulo === 'string' && titulo.trim() ? titulo.trim() : null;
  } catch {
    return null;
  }
}

let puestosAnimes = 0;
let puestosPersonajes = 0;
let vistos = 0;
let sinCandidato = [];

/** El Media de AniList de este anime, o null si no pasa las compuertas. */
async function mediaDe(anime) {
  const titulo = str(anime.f, 'title');
  const japones = str(anime.f, 'japaneseTitle');
  const anio = num(anime.f, 'year') ?? 0;
  // El término de `busquedas-anime.mjs` es el exacto de TVDB y a
  // AniList a veces no le vale ("DEATH NOTE -デスノート-" no
  // devuelve nada): se reintenta con el título del catálogo.
  const terminos = [comoBuscar(anime.id, titulo), titulo].filter(Boolean);
  const propios = [titulo, japones].map(normal).filter(Boolean);
  let mejor = null;
  let mejorNota = -Infinity;
  for (const q of new Set(terminos)) {
    const d = await pedir(Q_MEDIA, { q });
    const lista = d?.Page?.media ?? [];
    for (const m of lista) {
      if (anio > 0 && m.seasonYear != null && Math.abs(m.seasonYear - anio) > 1) continue;
      const titulos = [m.title?.romaji, m.title?.english, m.title?.native, ...(m.synonyms ?? [])];
      if (!compartePalabra(`${titulo} ${japones}`, titulos)) continue;
      // Desempate entre parecidos (la serie y su mini, la T1 y la
      // T2): título exacto primero, luego año más cercano, luego
      // más palabras en común. Sin esto, Frieren caía en el mini
      // anime y K-On! en la segunda temporada.
      const normas = titulos.map(normal).filter(Boolean);
      let nota = 0;
      if (propios.some((p) => normas.includes(p))) nota += 100;
      if (anio > 0 && m.seasonYear != null) nota -= 10 * Math.abs(m.seasonYear - anio);
      for (const t of normas) {
        for (const p of palabras(t)) if (palabras(`${titulo} ${japones}`).has(p)) nota += 1;
      }
      if (nota > mejorNota) {
        mejorNota = nota;
        mejor = m;
      }
    }
  }
  return mejor;
}

for (const anime of animes) {
  if (soloAnimes.length && !soloAnimes.includes(anime.id)) continue;
  vistos++;
  if (vistos % 10 === 0) console.log(`  … ${vistos} animes revisados`);

  // ── 1. El anime ──────────────────────────────────────────
  if (!solo || solo === 'animes') {
    const actuales = anime.f.alternativeTitles?.arrayValue?.values?.map((v) => v.stringValue) ?? [];
    if (actuales.length === 0) {
      const m = await mediaDe(anime).catch((e) => {
        console.log(`  ${anime.id}: AniList falló (${String(e.message).slice(0, 60)})`);
        return null;
      });
      if (!m) {
        sinCandidato.push(anime.id);
      } else {
        const alias = limpiar(
          [m.title?.english, ...(m.synonyms ?? []), ...(MANUALES[anime.id] ?? []), await tituloPeli(anime.id)],
          [str(anime.f, 'title'), str(anime.f, 'japaneseTitle')],
        ).slice(0, 16);
        if (alias.length) {
          console.log(
            `  ${anime.id} -> AniList ${m.id} (${m.title?.romaji ?? '?'}): ${alias.length} alias` +
              ` (${alias.slice(0, 4).join(' / ')}${alias.length > 4 ? ' / …' : ''})`,
          );
          if (ESCRIBIR) {
            await escribir('animes', anime.id, { alternativeTitles: arrayDe(alias) }, [
              'alternativeTitles',
            ]);
          }
          puestosAnimes++;
        }
      }
    } else {
      // Ya tiene alias: solo se añade lo que falte (título
      // español de la peli o manuales). No se reescribe por
      // reescribir.
      const extra = [await tituloPeli(anime.id), ...(MANUALES[anime.id] ?? [])];
      const merged = limpiar([...actuales, ...extra], [
        str(anime.f, 'title'),
        str(anime.f, 'japaneseTitle'),
      ]).slice(0, 16);
      if (merged.length > actuales.length) {
        console.log(`  ${anime.id}: +${merged.length - actuales.length} alias (${extra.filter(Boolean).join(' / ')})`);
        if (ESCRIBIR) {
          await escribir('animes', anime.id, { alternativeTitles: arrayDe(merged) }, [
            'alternativeTitles',
          ]);
        }
        puestosAnimes++;
      }
    }
  }

  // ── 2. Sus personajes ────────────────────────────────────
  if (!solo || solo === 'personajes') {
    const pendientes = personajes.filter((c) => str(c.f, 'animeId') === anime.id);
    if (!pendientes.length) continue;

    const m = await mediaDe(anime).catch(() => null);
    if (!m) {
      if (!sinCandidato.includes(anime.id)) sinCandidato.push(anime.id);
      continue;
    }

    // Reparto de TODA la franquicia con sus apodos, no solo del
    // primer anime: en la T1 Historia es "Krista Lenz" y Zeke ni
    // sale, y con una sola lista se quedan sin alias (igual que
    // pasaba con las imágenes: ver `personajesDeFranquicia`).
    const { todos } = await arbol(m.id).catch(() => ({ todos: new Map([[m.id, m]]) }));
    const candidatos = new Map();
    for (const idMedia of todos.keys()) {
      let pagina = 1;
      for (;;) {
        const d = await pedir(Q_PERSONAJES, { id: idMedia, pagina });
        const bloque = d?.Media?.characters;
        if (!bloque) break;
        for (const e of bloque.edges ?? []) {
          if (!['MAIN', 'SUPPORTING', 'ANTAGONIST'].includes(e.role)) continue;
          if (!candidatos.has(e.node.id)) candidatos.set(e.node.id, e.node);
        }
        if (!bloque.pageInfo?.hasNextPage || pagina >= 6) break;
        pagina++;
      }
    }

    let puestos = 0;
    for (const c of pendientes) {
      if (c.f.aliases?.arrayValue?.values?.length > 0) continue;
      const nombre = normal(str(c.f, 'name'));
      const japones = normal(str(c.f, 'japaneseName'));
      // Vale el nombre, el japonés o estar entre sus apodos de
      // AniList ("Historia Reiss" vive en los alternative de
      // "Krista Lenz"): todo es igualdad normalizada, nada
      // aproximado.
      const normalAlt = (n) => (n.name?.alternative ?? []).map(normal);
      const hallado = [...candidatos.values()].find(
        (n) =>
          normal(n.name?.full) === nombre ||
          (japones && normal(n.name?.native) === japones) ||
          normalAlt(n).includes(nombre) ||
          (japones && normalAlt(n).includes(japones)),
      );
      if (!hallado) {
        // Sin coincidencia en AniList, mira los manuales
        // verificados antes de rendirse.
        const manual = MANUALES_PERSONAJES[c.id] ?? [];
        if (manual.length) {
          if (ESCRIBIR) {
            await escribir('characters', c.id, { aliases: arrayDe(manual) }, ['aliases']);
          }
          console.log(`  ${c.id}: alias manual (${manual.join(' / ')})`);
          puestos++;
        }
        continue;
      }
      const aka = limpiar(hallado.name?.alternative ?? [], [
        str(c.f, 'name'),
        str(c.f, 'japaneseName'),
      ]).slice(0, 8);
      if (!aka.length) continue;
      if (ESCRIBIR) {
        await escribir('characters', c.id, { aliases: arrayDe(aka) }, ['aliases']);
      }
      puestos++;
    }
    if (puestos) {
      console.log(`  ${anime.id}: ${puestos} personajes con alias`);
      puestosPersonajes += puestos;
    }
  }
}

console.log('');
console.log(
  ESCRIBIR
    ? `PUESTOS ${puestosAnimes} animes y ${puestosPersonajes} personajes`
    : `SE PONDRÍAN ${puestosAnimes} animes y ${puestosPersonajes} personajes (nada escrito: usa --escribir)`,
);
if (sinCandidato.length) console.log(`Sin candidato en AniList (${sinCandidato.length}): ${sinCandidato.join(', ')}`);
