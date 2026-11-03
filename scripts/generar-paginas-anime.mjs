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
//   · un bloque de contenido real dentro de #root, que React
//     sustituye al montar. Si el JS falla, el usuario sigue viendo
//     la sinopsis en vez de una pantalla vacía.
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
  process.env.VITE_SITE_URL || 'https://geekapoo.vercel.app'
).replace(/\/+$/, '');

const COLECCION = `https://firestore.googleapis.com/v1/projects/${PROYECTO}/databases/(default)/documents/animes`;

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

function contenidoEstatico(anime) {
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
    <p style="margin:0 0 10px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#a78bfa">Wiki de anime · Geekapoo</p>
    <h1 style="margin:0 0 6px;font-size:34px;line-height:1.15;font-weight:800">${escaparHtml(anime.title)}</h1>
    ${anime.japaneseTitle ? `<p style="margin:0 0 14px;font-size:15px;color:#a1a1aa">${escaparHtml(anime.japaneseTitle)}</p>` : ''}
    <p style="margin:0 0 12px;font-size:14px;color:#a1a1aa">${escaparHtml(meta)}</p>
    ${nota}
    <h2 style="margin:26px 0 8px;font-size:18px;font-weight:700">Sinopsis</h2>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.75;color:#d4d4d8">${escaparHtml(anime.synopsis)}</p>
    ${generos}
    <a href="/?tab=wiki" style="display:inline-block;margin-top:8px;padding:11px 20px;border-radius:12px;background:#7c3aed;color:#fff;font-size:14px;font-weight:700;text-decoration:none">Explorar la wiki completa</a>
  </div>
</div>`;
}

function jsonLd(anime) {
  const url = `${SITIO}/anime/${encodeURIComponent(anime.slug)}`;
  const imagen = anime.bannerUrl || anime.coverUrl || `${SITIO}/img/og-geekapoo.png`;

  const serie = {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: anime.title,
    description: anime.synopsis,
    url,
    image: imagen,
    inLanguage: 'ja',
    ...(anime.japaneseTitle ? { alternateName: anime.japaneseTitle } : {}),
    ...(anime.alternativeTitles.length
      ? { alternateName: [anime.japaneseTitle, ...anime.alternativeTitles].filter(Boolean) }
      : {}),
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

function personalizar(plantilla, anime) {
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
    `<div id="root">${contenidoEstatico(anime)}</div>`,
  );

  return html;
}

try {
  const plantilla = await readFile(PLANTILLA, 'utf8');
  const animes = await leerAnimes();

  let generadas = 0;
  for (const anime of animes) {
    const html = personalizar(plantilla, anime);
    const carpeta = path.join(DIST, 'anime', anime.slug);
    await mkdir(carpeta, { recursive: true });
    await writeFile(path.join(carpeta, 'index.html'), html, 'utf8');
    generadas += 1;
  }

  console.log(`páginas de anime: ${generadas} generadas en dist/anime/`);
} catch (error) {
  // Un fallo aquí no debe tumbar el despliegue: se sirve la SPA de
  // siempre y se avisa para poder revisarlo.
  console.warn(
    `No se pudieron generar las páginas de anime (${error.message}). Se despliega solo la SPA.`,
  );
}
