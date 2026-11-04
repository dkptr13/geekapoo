// ======================================================
// SITEMAP DE LAS FICHAS DE ANIME
// ======================================================
// Google necesita una lista de las páginas que existen. Sin ella
// solo encuentra lo que alguien enlaza, y al principio nadie
// enlaza nada: el sitemap es lo que hace que las 170+ fichas se
// descubran solas.
//
// Se genera en cada build leyendo el catálogo público de
// Firestore, así que añadir un anime en el panel lo mete en el
// sitemap en el siguiente despliegue sin tocar nada a mano.
//
// Si Firestore no responde, el build NO se rompe: se conserva el
// sitemap anterior y se avisa por consola. Un sitemap de hace un
// día es mejor que un despliegue caído.

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
  process.env.VITE_SITE_URL || 'https://www.geekapoo.es'
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
      animes.push({ slug, id, actualizado: doc.updateTime });
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

    const generado = Date.parse(datos.generado);
    if (!Number.isFinite(generado) || Date.now() - generado > 6 * 60 * 60 * 1000) {
      return null;
    }

    return datos.animes
      .filter((a) => a?.slug)
      .map((a) => ({
        slug: a.slug,
        id: a.id,
        actualizado: a.actualizado ?? '',
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
    const lastmod = anime.actualizado
      ? `\n    <lastmod>${anime.actualizado.slice(0, 10)}</lastmod>`
      : '';

    urls.push(
      `  <url>
    <loc>${SITIO}/anime/${encodeURIComponent(anime.slug)}</loc>${lastmod}
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`,
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
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
  console.log(`sitemap.xml: ${animes.length + 1} URLs (${animes.length} animes)`);
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
