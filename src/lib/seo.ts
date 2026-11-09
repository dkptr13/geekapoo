import { useEffect } from 'react';

// ======================================================
// SEO CENTRALIZADO
// ======================================================
// La app es una SPA: al cambiar de pestaña no hay recarga, así que
// el <title>, el canonical y las tarjetas sociales se quedarían en
// los de la portada. Este módulo los reescribe en cada vista.
//
// El HTML inicial de las fichas de anime sí sale del servidor (las
// genera `scripts/generar-paginas-anime.mjs`). Aquí se cubre la
// navegación interna y las vistas que no tienen página estática.
//
// Reglas:
//   · Nunca se deja un metadato vacío.
//   · El canonical es autorreferente salvo en filtros y variantes,
//     que apuntan a la URL base y llevan noindex.
//   · El JSON-LD se escapa para que el texto de un usuario no pueda
//     cerrar el <script>.
//   · Las páginas privadas llevan noindex/nofollow.

export const SITE_URL = 'https://www.geekapoo.es';
export const SITE_NAME = 'Geekapoo';
export const DEFAULT_IMAGE = `${SITE_URL}/img/og-geekapoo.png`;

export const DEFAULT_TITLE =
  'Geekapoo – Comunidad Otaku, Anime, Manga y Cultura Geek';

export const DEFAULT_DESCRIPTION =
  'Únete a Geekapoo, una comunidad para debatir sobre anime, manga, videojuegos, series y cultura geek. Comparte tus opiniones, descubre contenidos y conoce a otros aficionados.';

export type SeoData = {
  title: string;
  description: string;
  /** Ruta relativa al sitio, con o sin query. Ej.: "/anime/one-piece". */
  path?: string;
  /** URL absoluta que pisa a `path`. */
  canonical?: string;
  /** Por defecto: index, follow, max-image-preview:large */
  robots?: string;
  image?: string;
  imageAlt?: string;
  type?: 'website' | 'article' | 'profile' | 'video.tv_show' | 'video.movie';
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
};

/** Normaliza espacios y recorta sin cortar palabras a lo bruto. */
export function recortar(texto: string, max = 158): string {
  const limpio = String(texto ?? '').replace(/\s+/g, ' ').trim();
  if (limpio.length <= max) return limpio;

  const corte = limpio.slice(0, max - 1);
  const ultimoEspacio = corte.lastIndexOf(' ');
  return `${(ultimoEspacio > 40 ? corte.slice(0, ultimoEspacio) : corte).trimEnd()}…`;
}

/** Título con el sufijo de marca, sin duplicarlo si ya lo lleva. */
export function tituloPagina(especifico: string, sufijo = SITE_NAME): string {
  const limpio = String(especifico ?? '').replace(/\s+/g, ' ').trim();
  if (!limpio) return DEFAULT_TITLE;
  if (limpio.toLowerCase().includes(sufijo.toLowerCase())) return limpio;
  return `${limpio} | ${sufijo}`;
}

export function urlAbsoluta(ruta: string): string {
  if (/^https?:\/\//i.test(ruta)) return ruta;
  return `${SITE_URL}${ruta.startsWith('/') ? ruta : `/${ruta}`}`;
}

export function urlActual(): string {
  if (typeof window === 'undefined') return `${SITE_URL}/`;
  return urlAbsoluta(`${window.location.pathname}${window.location.search}`);
}

function ponerMeta(atributo: 'name' | 'property', clave: string, valor: string) {
  let etiqueta = document.head.querySelector<HTMLMetaElement>(
    `meta[${atributo}="${clave}"]`,
  );

  if (!etiqueta) {
    etiqueta = document.createElement('meta');
    etiqueta.setAttribute(atributo, clave);
    document.head.appendChild(etiqueta);
  }

  etiqueta.setAttribute('content', valor);
}

function quitarMeta(atributo: 'name' | 'property', clave: string) {
  document.head
    .querySelectorAll(`meta[${atributo}="${clave}"]`)
    .forEach((el) => el.remove());
}

function ponerCanonical(url: string) {
  let enlace = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );

  if (!enlace) {
    enlace = document.createElement('link');
    enlace.setAttribute('rel', 'canonical');
    document.head.appendChild(enlace);
  }

  enlace.setAttribute('href', url);
}

function meterJsonLd(datos: SeoData['jsonLd']) {
  document.head
    .querySelectorAll('script[data-seo-jsonld="1"]')
    .forEach((el) => el.remove());

  if (!datos) return;

  const bloques = Array.isArray(datos) ? datos : [datos];

  for (const bloque of bloques) {
    if (!bloque || typeof bloque !== 'object') continue;

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-seo-jsonld', '1');
    // `<` escapado: el texto de un hilo podría contener "</script>".
    script.textContent = JSON.stringify(bloque).replace(/</g, '\\u003c');
    document.head.appendChild(script);
  }
}

export function aplicarSeo(datos: SeoData) {
  if (typeof document === 'undefined') return;

  const titulo = datos.title?.trim() || DEFAULT_TITLE;
  const descripcion = recortar(datos.description || DEFAULT_DESCRIPTION);
  const canonical = datos.canonical ?? urlAbsoluta(datos.path ?? urlActual());
  const imagen = datos.image ? urlAbsoluta(datos.image) : DEFAULT_IMAGE;
  const imagenAlt =
    datos.imageAlt?.trim() || `Vista previa de ${SITE_NAME}`;
  const tipo = datos.type ?? 'website';

  document.title = titulo;

  ponerMeta('name', 'description', descripcion);
  ponerMeta(
    'name',
    'robots',
    datos.robots ?? 'index, follow, max-image-preview:large',
  );

  ponerCanonical(canonical);

  ponerMeta('property', 'og:site_name', SITE_NAME);
  ponerMeta('property', 'og:locale', 'es_ES');
  ponerMeta('property', 'og:type', tipo);
  ponerMeta('property', 'og:title', titulo);
  ponerMeta('property', 'og:description', descripcion);
  ponerMeta('property', 'og:url', canonical);
  ponerMeta('property', 'og:image', imagen);
  ponerMeta('property', 'og:image:alt', imagenAlt);

  // Las medidas del PNG por defecto no valen para una portada real.
  if (imagen === DEFAULT_IMAGE) {
    ponerMeta('property', 'og:image:width', '1200');
    ponerMeta('property', 'og:image:height', '630');
  } else {
    quitarMeta('property', 'og:image:width');
    quitarMeta('property', 'og:image:height');
  }

  ponerMeta('name', 'twitter:card', 'summary_large_image');
  ponerMeta('name', 'twitter:title', titulo);
  ponerMeta('name', 'twitter:description', descripcion);
  ponerMeta('name', 'twitter:image', imagen);
  ponerMeta('name', 'twitter:image:alt', imagenAlt);

  meterJsonLd(datos.jsonLd);
}

/**
 * Aplica los metadatos cuando cambia la vista. La clave serializada
 * evita reescribir el <head> en cada render si nada ha cambiado.
 */
export function useSeo(datos: SeoData | null) {
  const clave = datos
    ? JSON.stringify({
        title: datos.title,
        description: datos.description,
        path: datos.path,
        canonical: datos.canonical,
        robots: datos.robots,
        image: datos.image,
        imageAlt: datos.imageAlt,
        type: datos.type,
        jsonLd: datos.jsonLd,
      })
    : 'sin-seo-propio';

  useEffect(() => {
    // null = esta vista delega en un hijo (ficha, hilo...). No se
    // toca el <head> para no pisar lo que el hijo acaba de escribir.
    if (datos) aplicarSeo(datos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);
}

// ======================================================
// HELPERS DE CONTENIDO
// ======================================================

/** Fecha ISO a partir de un Date de Firestore o de un string. */
export function fechaIso(valor: unknown): string | undefined {
  if (!valor) return undefined;
  if (valor instanceof Date) return valor.toISOString();

  if (typeof valor === 'object' && valor !== null && 'toDate' in valor) {
    try {
      return (valor as { toDate: () => Date }).toDate().toISOString();
    } catch {
      return undefined;
    }
  }

  if (typeof valor === 'string') {
    const fecha = new Date(valor);
    return Number.isNaN(fecha.getTime()) ? undefined : fecha.toISOString();
  }

  if (typeof valor === 'number') {
    const fecha = new Date(valor);
    return Number.isNaN(fecha.getTime()) ? undefined : fecha.toISOString();
  }

  return undefined;
}

/** Texto plano a partir del cuerpo de un hilo o comentario. */
export function textoPlano(valor: unknown, max = 158): string {
  return recortar(String(valor ?? '').replace(/<[^>]*>/g, ' '), max);
}

/** Primera imagen real de un hilo, fanart o publicación. */
export function imagenDeHilo(hilo: {
  imageUrl?: string;
  images?: Array<{ url?: string }>;
  fanart?: unknown;
}): string | undefined {
  if (hilo.imageUrl) return hilo.imageUrl;
  const primera = hilo.images?.find((imagen) => imagen?.url);
  return primera?.url;
}
