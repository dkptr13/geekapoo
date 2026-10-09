import { httpsCallable } from 'firebase/functions';

import { functions } from '../lib/firebase';
import type { GifAttachment, GifProvider } from '../types';

// ======================================================
// BÚSQUEDA DE GIFs (GIPHY / TENOR)
// ======================================================
//
// El GIF NO se sube a Firebase Storage: se guarda lo mínimo para
// dibujarlo (id, URLs y proveedor) y el archivo se sigue
// sirviendo desde el CDN del proveedor. Un GIF pesa cientos de KB
// y la cuota de Storage es de pago; además el modelo de datos
// queda limpio (`comments/{id}.gif`).
//
// ── De dónde sale la clave ─────────────────────────────────
//
// Hay tres caminos, y se eligen solos en este orden:
//
//  1. `VITE_TENOR_PROXY=1` (o que exista la Cloud Function
//     `buscarGifs`): el navegador llama a la función, y la clave
//     de Tenor se guarda en la Cloud Function con
//     `firebase functions:config` / `--set-params`. ES LA OPCIÓN
//     RECOMENDADA, porque la clave nunca sale del servidor.
//
//  2. `VITE_GIPHY_API_KEY`: llamada directa a GIPHY desde el
//     navegador. La clave pública de GIPHY está pensada para ir
//     en el cliente, pero quien la tenga puede ver la consola de
//     Firebase de otra persona. Sin claves de pago no hay límites
//     de cuota.
//
//  3. `VITE_TENOR_API_KEY`: llamada directa a Tenor. Tenor pide
//     registrar la app para sacar la clave, así que es menos
//     cómodo.
//
// Con ninguna de las tres, `configurarGifs()` devuelve `listo:
// false` con el motivo, y el selector lo enseña en vez de fingir
// que no hay resultados.
//
// OJO: un archivo .env.local SÍ acaba dentro del bundle, porque
// Vite lo incrusta al compilar. Por eso las variables se llaman
// VITE_* (son públicas por definición) y por eso la única clave
// que de verdad es privada —la de Tenor— va en las Cloud
// Functions, no en el .env.local.

// Variables que Vite incrusta. Se leen con `import.meta.env` para
// que no se puedan poner en un archivo cualquiera por error.
const ENV = (import.meta.env ?? {}) as Record<string, string | undefined>;

const GIPHY_KEY = ENV.VITE_GIPHY_API_KEY;
const TENOR_KEY = ENV.VITE_TENOR_API_KEY;
const USAR_PROXY = ENV.VITE_TENOR_PROXY === '1' || ENV.VITE_TENOR_PROXY === 'true';

/** Un GIF listo para pintar, ya sea de un resultado o de Firestore. */
export interface GifResult {
  provider: GifProvider;
  id: string;
  url: string;
  previewUrl: string;
  width: number;
  height: number;
  title?: string;
}

/** Cómo está configurado el buscador en ESTA web. */
export interface GifConfig {
  provider: GifProvider | null;
  listo: boolean;
  /** Texto para enseñar cuando `listo` es false. */
  motivo: string;
}

/**
 * Qué proveedor se va a usar, según lo que haya configurado el
 * administrador.
 *
 * Se llama una vez al abrir el selector: si no hay nada
 * configurado no se abre ninguna petición, y el usuario recibe un
 * aviso útil en vez de un error de red.
 */
export function config(): GifConfig {
  if (USAR_PROXY) {
    return {
      provider: 'tenor',
      listo: true,
      motivo: '',
    };
  }
  if (GIPHY_KEY) {
    return { provider: 'giphy', listo: true, motivo: '' };
  }
  if (TENOR_KEY) {
    return { provider: 'tenor', listo: true, motivo: '' };
  }

  return {
    provider: null,
    listo: false,
    motivo:
      'A esta web todavía no se le ha configurado un proveedor de GIFs. ' +
      'El administrador tiene que añadir VITE_GIPHY_API_KEY (o VITE_TENOR_API_KEY) ' +
      'en el archivo .env.local y reiniciar el servidor de desarrollo.',
  };
}

/** Atribución que exigen GIPHY y Tenor si se usa su CDN. */
export const ATRIBUCION: Record<GifProvider, string> = {
  giphy: 'GIFs por GIPHY',
  tenor: 'GIFs por Tenor',
};

/** Origen del que sale cada proveedor (para el enlace de créditos). */
export const ORIGEN: Record<GifProvider, string> = {
  giphy: 'https://giphy.com',
  tenor: 'https://tenor.com',
};

/** Cuántos GIFs se piden por búsqueda. */
const LIMITE = 24;

/** Un texto para probar el buscador: "con fin de semana". */
export const QUERY_POR_DEFECTO = 'anime reaction';

/**
 * Busca GIFs.
 *
 * Si la búsqueda falla, avisa con el motivo (lo dice el mensaje
 * del proveedor, que es lo que hace falta para arreglarlo) y
 * devuelve una lista vacía. El selector enseña ese error.
 */
export async function buscarGifs(texto: string, señal?: AbortSignal): Promise<GifResult[]> {
  const cfg = config();
  if (!cfg.listo || !cfg.provider) {
    throw new Error(cfg.motivo);
  }

  const busqueda = texto.trim();

  return cfg.provider === 'giphy'
    ? buscarEnGiphy(busqueda, señal)
    : buscarEnTenor(busqueda, señal);
}

// ======================================================
// GIPHY
// ======================================================

interface GiphyItem {
  id: string;
  title?: string;
  width: number;
  height: number;
  images?: Record<string, GiphyImage>;
}

interface GiphyImage {
  url?: string;
  width?: string;
  height?: string;
}

function aGif(item: GiphyItem): GifResult {
  // "downsized" (ancho 480) para pintar en el comentario y
  // "original" para abrir en grande. "fixed_width_small" en la
  // cuadrícula del selector: son unos 100 px de ancho.
  const img = item.images ?? {};
  const original = img.original?.url;
  const grande = img.downsized_medium?.url || img.downsized?.url || original;
  const preview = img.fixed_width_small?.url || img.fixed_width?.url || grande;

  return {
    provider: 'giphy',
    id: item.id,
    url: original || grande || '',
    previewUrl: preview || grande || original || '',
    width: Number(img.downsized?.width ?? item.width ?? 480),
    height: Number(img.downsized?.height ?? item.height ?? 270),
    title: item.title || undefined,
  };
}

async function buscarEnGiphy(busqueda: string, señal?: AbortSignal): Promise<GifResult[]> {
  const base = busqueda
    ? 'https://api.giphy.com/v1/gifs/search'
    : 'https://api.giphy.com/v1/gifs/trending';

  const params = new URLSearchParams({
    api_key: GIPHY_KEY ?? '',
    limit: String(LIMITE),
    // "g" quita lo explícito, que es lo que hace falta en una
    // comunidad donde alguien puede escribir cualquier cosa.
    rating: 'g',
    lang: 'es',
  });
  if (busqueda) params.set('q', busqueda);

  const res = await fetch(`${base}?${params.toString()}`, { signal: señal });
  if (!res.ok) throw new Error(await errorDeGiphy(res));

  const json = (await res.json()) as { data?: GiphyItem[] };
  return (json.data ?? [])
    .map(aGif)
    .filter((g) => g.url !== '' && g.previewUrl !== '');
}

// ======================================================
// TENOR
// ======================================================

interface TenorItem {
  id: string;
  title?: string;
  media_formats?: Record<string, TenorMedia>;
}

interface TenorMedia {
  url?: string;
  w?: number;
  h?: number;
}

function aTenor(item: TenorItem): GifResult {
  const f = item.media_formats ?? {};
  const url = f.gif?.url || f.mp4?.url || '';
  const preview = f.tinygif?.url || f.nanogif?.url || f.webp?.url || url;

  return {
    provider: 'tenor',
    id: item.id,
    url,
    previewUrl: preview,
    width: f.gif?.w ?? 480,
    height: f.gif?.h ?? 270,
    title: item.title || undefined,
  };
}

async function buscarEnTenor(busqueda: string, señal?: AbortSignal): Promise<GifResult[]> {
  // El límite lo pone la Cloud Function `buscarGifs`, que
  // normaliza la respuesta al mismo formato que la llamada
  // directa. Así el selector no sabe por dónde han salido los
  // resultados.
  if (USAR_PROXY) {
    return buscarPorProxy(busqueda || QUERY_POR_DEFECTO);
  }

  const base = busqueda
    ? 'https://tenor.googleapis.com/v2/search'
    : 'https://tenor.googleapis.com/v2/featured';

  const params = new URLSearchParams({
    key: TENOR_KEY ?? '',
    limit: String(LIMITE),
    media_filter: 'gif,nanogif,tinygif',
    content_filter: 'medium',
    ...(busqueda ? { q: busqueda } : {}),
  });

  const res = await fetch(`${base}?${params.toString()}`, { signal: señal });
  if (!res.ok) throw new Error(await errorDeTenor(res));

  const json = (await res.json()) as { results?: TenorItem[] };
  return (json.results ?? [])
    .map(aTenor)
    .filter((g) => g.url !== '' && g.previewUrl !== '');
}

// ======================================================
// ERRORES
// ======================================================

/**
 * Búsqueda a través de la Cloud Function.
 *
 * Es el camino recomendado: la clave de Tenor vive en el
 * servidor (definida como parámetro secreto de la función) y
 * nunca llega al bundle del navegador. La función devuelve los
 * resultados YA normalizados al mismo formato, así que este
 * archivo no necesita saber de dónde vienen.
 *
 * `httpsCallable` no admite `AbortSignal`, así que una búsqueda
 * cancelada simplemente se ignora cuando vuelve: la petición se
 * queda, pero el estado ya es otro y no se pinta. Buscar un GIF
 * no cuesta nada a nadie.
 */
async function buscarPorProxy(busqueda: string): Promise<GifResult[]> {
  const llamar = httpsCallable<
    { busqueda: string; limite: number },
    { results?: GifResult[] }
  >(functions, 'buscarGifs');

  try {
    const res = await llamar({ busqueda, limite: LIMITE });
    return res.data?.results ?? [];
  } catch (e) {
    const code = (e as { code?: string })?.code ?? '';
    if (code.includes('unavailable')) {
      throw new Error(
        'La función que busca GIFs no está desplegada todavía. Despliégala con ' +
          '"npm --prefix functions run deploy" o quita VITE_TENOR_PROXY del .env.local ' +
          'y pon una VITE_GIPHY_API_KEY.',
      );
    }
    if (code.includes('permission-denied') || code.includes('unauthenticated')) {
      throw new Error('No se puede usar el buscador de GIFs sin iniciar sesión.');
    }
    throw e;
  }
}

async function textoDelError(res: Response): Promise<string> {
  try {
    const texto = await res.text();
    return texto.slice(0, 200);
  } catch {
    return '';
  }
}

async function errorDeGiphy(res: Response): Promise<string> {
  const cuerpo = await textoDelError(res);
  if (res.status === 403) {
    return 'GIPHY rechazó la clave (403). Revisa VITE_GIPHY_API_KEY en el .env.local.';
  }
  if (res.status === 429) {
    return 'Se ha superado la cuota de la API de GIPHY. Inténtalo en un momento.';
  }
  return `GIPHY respondió ${res.status}${cuerpo ? `: ${cuerpo}` : ''}`;
}

async function errorDeTenor(res: Response): Promise<string> {
  const cuerpo = await textoDelError(res);
  if (res.status === 400 || res.status === 403) {
    return 'Tenor rechazó la clave. Revisa la configuración de VITE_TENOR_API_KEY.';
  }
  if (res.status === 429) {
    return 'Se ha superado la cuota de la API de Tenor. Inténtalo en un momento.';
  }
  return `Tenor respondió ${res.status}${cuerpo ? `: ${cuerpo}` : ''}`;
}

// ======================================================
// GUARDAR
// ======================================================

/** Pasa un resultado de la búsqueda al campo `gif` de un comentario. */
export function aGifAdjunto(gif: GifResult): GifAttachment {
  return {
    provider: gif.provider,
    id: gif.id,
    url: gif.url,
    previewUrl: gif.previewUrl,
    width: gif.width,
    height: gif.height,
    ...(gif.title ? { title: gif.title } : {}),
  };
}

/**
 * Comprueba que una URL pegada venga del proveedor.
 *
 * La misma comprobación la vuelven a hacer las reglas de
 * Firestore en `firestore.rules`: sin ella, un cliente podría
 * meter en `comment.gif` cualquier URL (una de rastreo, una de
 * contenido ilegal...). Con las dos, está bloqueado también
 * desde el navegador.
 */
export function esUrlDeGifValida(url: string): boolean {
  if (typeof url !== 'string' || url.length === 0 || url.length > 1000) return false;
  return (
    /^https:\/\/media\d*\.giphy\.com\//.test(url) ||
    /^https:\/\/media\d*\.tenor\.com\//.test(url) ||
    /^https:\/\/tenor\.com\/[a-zA-Z0-9\/-]+\.gif/.test(url)
  );
}
