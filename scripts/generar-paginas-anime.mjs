// ======================================================
// PÁGINAS ESTÁTICAS DE CADA ANIME (PRERENDER)
// ======================================================
// La app es una SPA: el HTML que sirve Vercel es siempre el mismo
// (<div id="root"></div>) y el contenido aparece después con
// JavaScript. Google puede ejecutar JS, pero es lento y poco fiable,
// y una ficha metida en un parámetro no se posiciona como página.
//
// Este script corre DESPUÉS de `vite build` y, por cada anime del
// catálogo, escribe `dist/anime/<slug>/index.html` con:
//
//   · <title> y <meta description> propios
//   · canonical y Open Graph apuntando a esa ficha
//   · JSON-LD (TVSeries + migas de pan) para los resultados
//     enriquecidos de Google
//   · contenido real dentro de #root, que React sustituye al montar:
//     sinopsis, episodios, dónde verla en España y personajes.
//
// Vercel sirve el archivo estático antes que la reescritura de
// vercel.json, así que la ficha sale ya renderizada desde el primer
// byte.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(RAIZ, 'dist');
const PLANTILLA = path.join(DIST, 'index.html');

const PROYECTO = process.env.VITE_FIREBASE_PROJECT_ID || 'geekapoo-7624d';
const SITIO = (
  process.env.VITE_SITE_URL || 'https://www.geekapoo.es'
).replace(/\/+$/, '');

const BASE = `https://firestore.googleapis.com/v1/projects/${PROYECTO}/databases/(default)/documents`;
const COLECCION = `${BASE}/animes`;

const CAMPOS = [
  'id',
  'slug',
  'title',
  'japaneseTitle',
  'alternativeTitles',
  'synopsis',
  'year',
  'studio',
  'status',
  'episodesCount',
  'genres',
  'rating',
  'coverUrl',
  'bannerUrl',
];

const ESTADOS = {
  finished: 'Finalizado',
  emitiendo: 'En emisión',
  ongoing: 'En emisión',
  upcoming: 'Próximamente',
};

// Nombres de las plataformas de la semilla. La colección
// `streamingPlatforms` los pisa si tiene el mismo id.
const PLATAFORMAS = {
  netflix: 'Netflix',
  crunchyroll: 'Crunchyroll',
  'disney-plus': 'Disney+',
  'amazon-prime-video': 'Amazon Prime Video',
  max: 'Max',
  hulu: 'Hulu',
  'apple-tv-plus': 'Apple TV+',
  youtube: 'YouTube',
  filmin: 'Filmin',
  'selecta-vision': 'Selecta Visión',
  'movistar-plus': 'Movistar Plus+',
  atresplayer: 'Atresplayer',
  'rtve-play': 'RTVE Play',
};

const escaparHtml = (valor) =>
  String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const escaparJson = (valor) =>
  JSON.stringify(valor).replace(/</g, '\\u003c');

const texto = (campo) => campo?.stringValue ?? '';
const numero = (campo) => {
  if (!campo) return null;
  if (campo.integerValue != null) return Number(campo.integerValue);
  if (campo.doubleValue != null) return Number(campo.doubleValue);
  return null;
};
const lista = (campo) =>
  (campo?.arrayValue?.values ?? [])
    .map((v) => v.stringValue)
    .filter(Boolean);

/** Recorta la sinopsis a un tamaño de meta description. */
function descripcionCorta(sinopsis, titulo) {
  const limpia = String(sinopsis ?? '').replace(/\s+/g, ' ').trim();
  const base = limpia ? `${titulo}: ${limpia}` : `${titulo} en Geekapoo.`;
  if (base.length <= 158) return base;
  return `${base.slice(0, 155).trimEnd()}...`;
}

async function leerAnimes() {
  const animes = [];
  let token = '';

  do {
    const url = new URL(COLECCION);
    url.searchParams.set('pageSize', '300');
    for (const campo of CAMPOS) {
      url.searchParams.append('mask.fieldPaths', campo);
    }
    if (token) url.searchParams.set('pageToken', token);

    const respuesta = await fetch(url);
    if (!respuesta.ok) {
      throw new Error(`Firestore respondió ${respuesta.status}`);
    }

    const datos = await respuesta.json();
    for (const doc of datos.documents ?? []) {
      const f = doc.fields ?? {};
      const slug = texto(f.slug) || doc.name.split('/').pop();
      const title = texto(f.title);
      if (!slug || !title) continue;

      animes.push({
        id: texto(f.id) || doc.name.split('/').pop(),
        slug,
        title,
        japaneseTitle: texto(f.japaneseTitle),
        alternativeTitles: lista(f.alternativeTitles),
        synopsis: texto(f.synopsis),
        year: texto(f.year),
        studio: texto(f.studio),
        status: texto(f.status),
        episodes: numero(f.episodesCount),
        genres: lista(f.genres),
        rating: numero(f.rating),
        coverUrl: texto(f.coverUrl),
        bannerUrl: texto(f.bannerUrl),
      });
    }
    token = datos.nextPageToken ?? '';
  } while (token);

  return animes;
}

/** Lee una colección entera paginando de 300 en 300. */
async function leerColeccion(coleccion, campos) {
  const docs = [];
  let token = '';

  do {
    const url = new URL(`${BASE}/${coleccion}`);
    url.searchParams.set('pageSize', '300');
    for (const campo of campos) {
      url.searchParams.append('mask.fieldPaths', campo);
    }
    if (token) url.searchParams.set('pageToken', token);

    const respuesta = await fetch(url);
    if (!respuesta.ok) throw new Error(`${coleccion}: ${respuesta.status}`);

    const datos = await respuesta.json();
    docs.push(...(datos.documents ?? []));
    token = datos.nextPageToken ?? '';
  } while (token);

  return docs;
}

/** Consulta con un único filtro de igualdad (sin índices compuestos). */
async function consultar(coleccion, campoFiltro, valor) {
  const respuesta = await fetch(`${BASE}:runQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: coleccion }],
        where: {
          fieldFilter: {
            field: { fieldPath: campoFiltro },
            op: 'EQUAL',
            value: { stringValue: valor },
          },
        },
      },
    }),
  });

  if (!respuesta.ok) throw new Error(`${coleccion}: ${respuesta.status}`);

  const filas = await respuesta.json();
  return filas.filter((f) => f.document).map((f) => f.document);
}

/**
 * Consulta con varios filtros de igualdad.
 *
 * El prerender solo necesita las filas de España que están
 * disponibles. Antes descargaba las 786 filas de España y filtraba
 * el estado en memoria; ahora la consulta devuelve solo las 207
 * disponibles.
 */
async function consultarFiltros(coleccion, filtros) {
  const where = filtros.length === 1
    ? {
        fieldFilter: {
          field: { fieldPath: filtros[0][0] },
          op: 'EQUAL',
          value: { stringValue: filtros[0][1] },
        },
      }
    : {
        compositeFilter: {
          op: 'AND',
          filters: filtros.map(([campo, valor]) => ({
            fieldFilter: {
              field: { fieldPath: campo },
              op: 'EQUAL',
              value: { stringValue: valor },
            },
          })),
        },
      };

  const respuesta = await fetch(`${BASE}:runQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: coleccion }],
        where,
      },
    }),
  });

  if (!respuesta.ok) throw new Error(`${coleccion}: ${respuesta.status}`);

  const filas = await respuesta.json();
  return filas.filter((f) => f.document).map((f) => f.document);
}

async function leerEpisodios() {
  const docs = await leerColeccion('episodes', [
    'animeId',
    'number',
    'title',
    'airDate',
  ]);
  const mapa = new Map();

  for (const doc of docs) {
    const f = doc.fields ?? {};
    const animeId = texto(f.animeId);
    const number = numero(f.number);
    const title = texto(f.title);
    if (!animeId || number == null || !title) continue;

    if (!mapa.has(animeId)) mapa.set(animeId, []);
    mapa.get(animeId).push({ number, title, airDate: texto(f.airDate) });
  }

  for (const listaEpisodios of mapa.values()) {
    listaEpisodios.sort(
      (a, b) =>
        (a.airDate || '').localeCompare(b.airDate || '') || a.number - b.number,
    );
  }

  return mapa;
}

async function leerPersonajesPrincipales() {
  const docs = await consultar('characters', 'role', 'main');
  const mapa = new Map();

  for (const doc of docs) {
    const f = doc.fields ?? {};
    const animeId = texto(f.animeId);
    const name = texto(f.name);
    if (!animeId || !name) continue;

    if (!mapa.has(animeId)) mapa.set(animeId, []);
    mapa.get(animeId).push({
      name,
      voiceActor: texto(f.voiceActor),
      likes: numero(f.likesCount) ?? 0,
    });
  }

  for (const listaPersonajes of mapa.values()) {
    listaPersonajes.sort((a, b) => b.likes - a.likes);
  }

  return mapa;
}

async function leerDisponibilidadEspana() {
  const docs = await consultarFiltros('streamingAvailability', [
    ['region', 'ES'],
    ['status', 'available'],
  ]);
  console.log(`streaming ES: ${docs.length} filas disponibles`);
  const mapa = new Map();

  for (const doc of docs) {
    const f = doc.fields ?? {};
    if (texto(f.status) !== 'available') continue;

    const animeId = texto(f.animeId);
    const platformId = texto(f.platformId);
    if (!animeId || !platformId) continue;

    if (!mapa.has(animeId)) mapa.set(animeId, []);
    mapa.get(animeId).push({
      platformId,
      url: texto(f.url),
    });
  }

  return mapa;
}

/**
 * Índice que genera `prebuild`.
 *
 * Si existe, de aquí salen los animes y los episodios/personajes
 * principales. Eso evita repetir en el prerender las mismas
 * lecturas que ya hizo la generación del índice: antes cada build
 * volvía a leer `animes`, todos los episodios y todos los
 * personajes principales solo para escribir las fichas estáticas.
 */
async function leerIndiceLocal() {
  try {
    const textoIndice = await readFile(
      path.join(RAIZ, 'public', 'busqueda', 'indice.json'),
      'utf8',
    );
    const indice = JSON.parse(textoIndice);
    if (indice?.version !== 1 || !Array.isArray(indice.animes)) return null;
    if (!Array.isArray(indice.episodes) || !Array.isArray(indice.characters)) return null;

    // El índice se refresca a mano con `npm run index:buscar`; no
    // caduca por tiempo. Si está viejo, el script del índice avisa.
    return indice;
  } catch {
    return null;
  }
}

function mapasDesdeIndice(indice) {
  const episodios = new Map();
  for (const ep of indice.episodes) {
    if (!ep.animeId || !ep.title) continue;
    if (!episodios.has(ep.animeId)) episodios.set(ep.animeId, []);
    episodios.get(ep.animeId).push({
      number: ep.number,
      title: ep.title,
      airDate: ep.airDate ?? '',
    });
  }
  for (const listaEpisodios of episodios.values()) {
    listaEpisodios.sort(
      (a, b) =>
        (a.airDate || '').localeCompare(b.airDate || '') || a.number - b.number,
    );
  }

  const personajes = new Map();
  for (const p of indice.characters) {
    if (p.role !== 'main' || !p.animeId || !p.name) continue;
    if (!personajes.has(p.animeId)) personajes.set(p.animeId, []);
    personajes.get(p.animeId).push({
      name: p.name,
      voiceActor: p.voiceActor ?? '',
      likes: p.likesCount ?? 0,
    });
  }
  for (const listaPersonajes of personajes.values()) {
    listaPersonajes.sort((a, b) => b.likes - a.likes);
  }

  // El índice puede traer la disponibilidad. Si es un índice antiguo
  // sin `streaming`, se devuelve `null` para que el build pregunte a
  // Firestore como antes.
  let streaming = null;
  if (Array.isArray(indice.streaming)) {
    streaming = new Map();
    for (const fila of indice.streaming) {
      if (fila.region !== 'ES' || fila.status !== 'available') continue;
      if (!fila.animeId || !fila.platformId) continue;
      if (!streaming.has(fila.animeId)) streaming.set(fila.animeId, []);
      streaming.get(fila.animeId).push({
        platformId: fila.platformId,
        url: fila.url ?? '',
      });
    }
  }

  return { episodios, personajes, streaming };
}

async function leerNombresPlataformas() {
  const nombres = { ...PLATAFORMAS };
  try {
    const docs = await leerColeccion('streamingPlatforms', ['name']);
    for (const doc of docs) {
      const id = doc.name.split('/').pop();
      const name = texto(doc.fields?.name);
      if (id && name) nombres[id] = name;
    }
  } catch {
    // La semilla local basta si la colección no responde.
  }
  return nombres;
}

function bloqueEpisodios(episodios) {
  if (!episodios?.length) return '';

  const visibles = episodios.slice(0, 24);
  const filas = visibles
    .map(
      (e) =>
        `<li style="margin:0 0 6px;color:#d4d4d8">Episodio ${e.number}: ${escaparHtml(e.title)}</li>`,
    )
    .join('');

  const resto =
    episodios.length > visibles.length
      ? `<p style="margin:8px 0 0;font-size:13px;color:#71717a">Y ${episodios.length - visibles.length} episodios más en la ficha completa.</p>`
      : '';

  return `<h2 style="margin:28px 0 10px;font-size:18px;font-weight:700">Episodios (${episodios.length})</h2>
    <ol style="margin:0;padding-left:20px;font-size:14px;line-height:1.6">${filas}</ol>${resto}`;
}

function bloqueStreaming(plataformas, nombres) {
  if (!plataformas?.length) return '';

  const filas = plataformas
    .map((p) => {
      const nombre = nombres[p.platformId] ?? p.platformId;
      return p.url
        ? `<li style="margin:0 0 6px"><a href="${escaparHtml(p.url)}" style="color:#a78bfa">${escaparHtml(nombre)}</a></li>`
        : `<li style="margin:0 0 6px;color:#d4d4d8">${escaparHtml(nombre)}</li>`;
    })
    .join('');

  return `<h2 style="margin:28px 0 10px;font-size:18px;font-weight:700">Dónde verla en España</h2>
    <ul style="margin:0;padding-left:20px;font-size:14px;line-height:1.7">${filas}</ul>`;
}

function bloquePersonajes(personajes) {
  if (!personajes?.length) return '';

  const visibles = personajes.slice(0, 8);
  const filas = visibles
    .map(
      (p) =>
        `<li style="margin:0 0 6px;color:#d4d4d8">${escaparHtml(p.name)}${
          p.voiceActor
            ? ` <span style="color:#71717a">(voz: ${escaparHtml(p.voiceActor)})</span>`
            : ''
        }</li>`,
    )
    .join('');

  return `<h2 style="margin:28px 0 10px;font-size:18px;font-weight:700">Personajes principales</h2>
    <ul style="margin:0;padding-left:20px;font-size:14px;line-height:1.7">${filas}</ul>`;
}

function contenidoEstatico(anime, extras) {
  const estado = ESTADOS[anime.status] ?? (anime.status || '');
  const meta = [
    anime.year,
    anime.studio,
    anime.episodes ? `${anime.episodes} episodios` : '',
    estado,
  ]
    .filter(Boolean)
    .join(' · ');

  const generos = anime.genres.length
    ? `<p style="margin:0 0 20px;font-size:13px;color:#a1a1aa">Géneros: ${escaparHtml(
        anime.genres.join(' · '),
      )}</p>`
    : '';

  const nota =
    anime.rating != null
      ? `<p style="margin:0 0 18px;font-size:14px;color:#fbbf24">★ ${anime.rating}/10</p>`
      : '';

  return `<div style="min-height:100vh;background:#080810;color:#e4e4e7;font-family:Outfit,system-ui,sans-serif;padding:48px 20px">
  <div style="max-width:820px;margin:0 auto">
    ${anime.coverUrl ? `<img src="${escaparHtml(anime.coverUrl)}" alt="Portada de ${escaparHtml(anime.title)}" width="180" height="270" style="float:right;margin:0 0 16px 20px;border-radius:12px;object-fit:cover" />` : ''}
    <p style="margin:0 0 10px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#a78bfa">Wiki de anime · Geekapoo</p>
    <h1 style="margin:0 0 6px;font-size:34px;line-height:1.15;font-weight:800">${escaparHtml(anime.title)}</h1>
    ${anime.japaneseTitle ? `<p style="margin:0 0 14px;font-size:15px;color:#a1a1aa">${escaparHtml(anime.japaneseTitle)}</p>` : ''}
    <p style="margin:0 0 12px;font-size:14px;color:#a1a1aa">${escaparHtml(meta)}</p>
    ${nota}
    <h2 style="margin:26px 0 8px;font-size:18px;font-weight:700">Sinopsis</h2>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.75;color:#d4d4d8">${escaparHtml(anime.synopsis)}</p>
    ${generos}
    ${bloqueStreaming(extras.streaming, extras.nombresPlataformas)}
    ${bloqueEpisodios(extras.episodios)}
    ${bloquePersonajes(extras.personajes)}
    <a href="/?tab=wiki" style="display:inline-block;margin-top:26px;padding:11px 20px;border-radius:12px;background:#7c3aed;color:#fff;font-size:14px;font-weight:700;text-decoration:none">Explorar la wiki completa</a>
  </div>
</div>`;
}

function jsonLd(anime) {
  const url = `${SITIO}/anime/${encodeURIComponent(anime.slug)}`;
  // La portada vertical es la que Google usa mejor como miniatura;
  // el banner panorámico queda como segunda opción.
  const imagenes = [anime.coverUrl, anime.bannerUrl].filter(Boolean);
  const imagen = imagenes.length
    ? imagenes
    : `${SITIO}/img/og-geekapoo.png`;

  const serie = {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: anime.title,
    description: anime.synopsis,
    url,
    image: imagen,
    inLanguage: 'ja',
    ...(anime.japaneseTitle ? { alternateName: anime.japaneseTitle } : {}),
    ...(anime.year ? { datePublished: anime.year } : {}),
    ...(anime.genres.length ? { genre: anime.genres } : {}),
    ...(anime.episodes ? { numberOfEpisodes: anime.episodes } : {}),
    ...(anime.studio
      ? { productionCompany: { '@type': 'Organization', name: anime.studio } }
      : {}),
  };

  const migas = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITIO}/` },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Wiki de anime',
        item: `${SITIO}/?tab=wiki`,
      },
      { '@type': 'ListItem', position: 3, name: anime.title, item: url },
    ],
  };

  return `<script type="application/ld+json">${escaparJson(serie)}</script>
<script type="application/ld+json">${escaparJson(migas)}</script>`;
}

function personalizar(plantilla, anime, extras) {
  const url = `${SITIO}/anime/${encodeURIComponent(anime.slug)}`;
  const titulo = `${anime.title} — Sinopsis, episodios y dónde verla | Geekapoo`;
  const descripcion = descripcionCorta(anime.synopsis, anime.title);
  const imagen = anime.bannerUrl || anime.coverUrl || `${SITIO}/img/og-geekapoo.png`;

  let html = plantilla;

  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escaparHtml(titulo)}</title>`);

  html = html.replace(
    /(<meta name="description" content=")[\s\S]*?(" \/>)/,
    `$1${escaparHtml(descripcion)}$2`,
  );
  html = html.replace(
    /(<link rel="canonical" href=")[^"]*(" \/>)/,
    `$1${url}$2`,
  );
  html = html.replace(
    /(<meta property="og:url" content=")[^"]*(" \/>)/,
    `$1${url}$2`,
  );
  html = html.replace(
    /(<meta property="og:title" content=")[\s\S]*?(" \/>)/,
    `$1${escaparHtml(titulo)}$2`,
  );
  html = html.replace(
    /(<meta property="og:description" content=")[\s\S]*?(" \/>)/,
    `$1${escaparHtml(descripcion)}$2`,
  );
  html = html.replace(
    /(<meta property="og:image" content=")[^"]*(" \/>)/,
    `$1${escaparHtml(imagen)}$2`,
  );
  // Las medidas del banner genérico (1200x630) no son las de la
  // imagen real de cada anime: mejor no declararlas que declararlas
  // mal, porque Google puede descartar la miniatura.
  html = html.replace(/\s*<meta property="og:image:width" content="[^"]*" \/>/, '');
  html = html.replace(/\s*<meta property="og:image:height" content="[^"]*" \/>/, '');
  html = html.replace(
    /(<meta property="og:image:alt" content=")[^"]*(" \/>)/,
    `$1${escaparHtml(`Portada de ${anime.title}`)}$2`,
  );
  html = html.replace(
    /(<meta property="og:type" content=")[^"]*(" \/>)/,
    '$1video.tv_show$2',
  );
  html = html.replace(
    /(<meta name="twitter:title" content=")[\s\S]*?(" \/>)/,
    `$1${escaparHtml(titulo)}$2`,
  );
  html = html.replace(
    /(<meta name="twitter:description" content=")[\s\S]*?(" \/>)/,
    `$1${escaparHtml(descripcion)}$2`,
  );
  html = html.replace(
    /(<meta name="twitter:image" content=")[^"]*(" \/>)/,
    `$1${escaparHtml(imagen)}$2`,
  );

  html = html.replace('</head>', `${jsonLd(anime)}\n  </head>`);
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root">${contenidoEstatico(anime, extras)}</div>`,
  );

  return html;
}

try {
  const plantilla = await readFile(PLANTILLA, 'utf8');
  const indice = await leerIndiceLocal();
  const animes = indice?.animes?.length
    ? indice.animes.map((a) => ({ ...a, episodes: a.episodesCount ?? 0 }))
    : await leerAnimes();
  const desdeIndice = indice ? mapasDesdeIndice(indice) : null;

  if (desdeIndice?.streaming) {
    console.log(
      `streaming ES: reutiliza el indice (${desdeIndice.streaming.size} animes)`,
    );
  }

  // Los extras son opcionales: si una colección falla, las fichas
  // se generan igual con lo que haya. Si el índice está disponible,
  // los episodios, personajes y streaming salen de ahí y no se
  // vuelven a leer.
  const [episodios, personajes, streaming, nombresPlataformas] =
    await Promise.all([
      desdeIndice
        ? Promise.resolve(desdeIndice.episodios)
        : leerEpisodios().catch((e) => {
            console.warn(`Sin episodios: ${e.message}`);
            return new Map();
          }),
      desdeIndice
        ? Promise.resolve(desdeIndice.personajes)
        : leerPersonajesPrincipales().catch((e) => {
            console.warn(`Sin personajes: ${e.message}`);
            return new Map();
          }),
      desdeIndice?.streaming
        ? Promise.resolve(desdeIndice.streaming)
        : leerDisponibilidadEspana().catch((e) => {
            console.warn(`Sin streaming: ${e.message}`);
            return new Map();
          }),
      leerNombresPlataformas(),
    ]);

  let generadas = 0;
  for (const anime of animes) {
    const extras = {
      episodios: episodios.get(anime.id) ?? [],
      personajes: personajes.get(anime.id) ?? [],
      streaming: (streaming.get(anime.id) ?? []).sort((a, b) =>
        (nombresPlataformas[a.platformId] ?? a.platformId).localeCompare(
          nombresPlataformas[b.platformId] ?? b.platformId,
          'es',
        ),
      ),
      nombresPlataformas,
    };

    const html = personalizar(plantilla, anime, extras);
    const carpeta = path.join(DIST, 'anime', anime.slug);
    await mkdir(carpeta, { recursive: true });
    await writeFile(path.join(carpeta, 'index.html'), html, 'utf8');
    generadas += 1;
  }

  console.log(
    `páginas de anime: ${generadas} generadas (${episodios.size} con episodios, ${streaming.size} con streaming ES)`,
  );
} catch (error) {
  // Un fallo aquí no debe tumbar el despliegue: se sirve la SPA de
  // siempre y se avisa para poder revisarlo.
  console.warn(
    `No se pudieron generar las páginas de anime (${error.message}). Se despliega solo la SPA.`,
  );
}
