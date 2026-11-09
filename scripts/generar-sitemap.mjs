// ======================================================
// SITEMAP DE LAS PÁGINAS PÚBLICAS
// ======================================================
// Incluye solo lo que hoy tiene HTML estático propio y canonical
// autorreferente:
//
//   · Inicio.
//   · Fichas de anime (con lastmod real e imagen de portada).
//
// Wiki y extras quedan fuera mientras su HTML inicial sea el shell de
// la SPA: su canonical inicial sería "/" y entrarían como páginas
// alternativas. Hilos, perfiles y noticias tampoco tienen URL pública
// estable todavía.
//
// Se genera en cada build desde el índice de búsqueda (sin leer
// Firestore entero) y, si el índice no existe, cae a Firestore.
//
// Si algo falla, el build NO se rompe: se conserva el sitemap
// anterior y se avisa por consola.

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SALIDA = path.join(RAIZ, 'public', 'sitemap.xml');

const PROYECTO =
  process.env.VITE_FIREBASE_PROJECT_ID || 'geekapoo-7624d';

// Cambiar el dominio aquí (o con VITE_SITE_URL en Vercel) cuando
// geekapoo.es esté registrado.
const SITIO = (
  process.env.VITE_SITE_URL || 'https://geekapoo.es'
).replace(/\/+$/, '');

const COLECCION = `https://firestore.googleapis.com/v1/projects/${PROYECTO}/databases/(default)/documents/animes`;

/** Escapa lo justo para XML; los slugs ya son seguros. */
const xml = (valor) =>
  String(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

async function leerAnimes() {
  const animes = [];
  let token = '';

  do {
    const url = new URL(COLECCION);
    url.searchParams.set('pageSize', '300');
    // Dos campos ⇒ dos llamadas a append. Con set, la segunda
    // borraría la primera y el slug no llegaría en la respuesta.
    url.searchParams.append('mask.fieldPaths', 'slug');
    url.searchParams.append('mask.fieldPaths', 'title');
    url.searchParams.append('mask.fieldPaths', 'coverUrl');
    if (token) url.searchParams.set('pageToken', token);

    const respuesta = await fetch(url);
    if (!respuesta.ok) {
      throw new Error(`Firestore respondió ${respuesta.status}`);
    }

    const datos = await respuesta.json();
    for (const doc of datos.documents ?? []) {
      const slug = doc.fields?.slug?.stringValue;
      const id = doc.name.split('/').pop();
      if (!slug) continue;
      animes.push({
        slug,
        id,
        actualizado: doc.updateTime,
        coverUrl: doc.fields?.coverUrl?.stringValue ?? '',
      });
    }
    token = datos.nextPageToken ?? '';
  } while (token);

  return animes;
}

/**
 * Animes del índice de búsqueda, si está fresco.
 *
 * `prebuild` genera primero el índice y después este sitemap. Si el
 * índice existe y tiene menos de seis horas, se reutiliza: evita
 * volver a leer los 195 animes en cada build. Si falta o está viejo,
 * el sitemap sigue funcionando con la lectura directa de Firestore.
 */
async function leerAnimesDelIndice() {
  try {
    const datos = JSON.parse(
      await readFile(path.join(RAIZ, 'public', 'busqueda', 'indice.json'), 'utf8'),
    );
    if (datos?.version !== 1 || !Array.isArray(datos.animes)) return null;

    // El índice se refresca a mano con `npm run index:buscar`; no
    // caduca por tiempo. Si está viejo, el script del índice avisa.
    return datos.animes
      .filter((a) => a?.slug)
      .map((a) => ({
        slug: a.slug,
        id: a.id,
        actualizado: a.actualizado ?? '',
        coverUrl: a.coverUrl ?? '',
      }));
  } catch {
    return null;
  }
}

function construirSitemap(animes) {
  const urls = [
    `  <url>
    <loc>${SITIO}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`,
  ];

  for (const anime of animes) {
    const fecha = anime.actualizado
      ? String(anime.actualizado).slice(0, 10)
      : '';
    const lastmod = /^\d{4}-\d{2}-\d{2}$/.test(fecha)
      ? `\n    <lastmod>${fecha}</lastmod>`
      : '';

    const imagen = anime.coverUrl
      ? `\n    <image:image>
      <image:loc>${xml(anime.coverUrl)}</image:loc>
    </image:image>`
      : '';

    urls.push(
      `  <url>
    <loc>${SITIO}/anime/${encodeURIComponent(anime.slug)}</loc>${lastmod}${imagen}
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`,
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>
`;
}

try {
  const delIndice = await leerAnimesDelIndice();
  const animes = delIndice ?? (await leerAnimes());
  if (delIndice) console.log('sitemap: reutiliza el indice de busqueda');
  const sitemap = construirSitemap(animes);
  await writeFile(SALIDA, sitemap, 'utf8');
  console.log(
    `sitemap.xml: ${animes.length + 1} URLs (${animes.length} animes)`,
  );
} catch (error) {
  let anterior = 'desconocido';
  try {
    const texto = await readFile(SALIDA, 'utf8');
    anterior = `${(texto.match(/<url>/g) ?? []).length} URLs`;
  } catch {
    // Ni siquiera existe el anterior: no hay nada que conservar.
  }

  console.warn(
    `No se pudo generar el sitemap (${error.message}). Se conserva el anterior: ${anterior}.`,
  );
}

// Siempre 0: un fallo de red no debe tumbar el despliegue.
