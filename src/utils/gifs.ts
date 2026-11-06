import type { GifAttachment } from '../types';

/**
 * ¿La URL viene de un CDN de GIF permitido?
 *
 * Se acepta GIPHY y Tenor, los dos proveedores integrados. La misma
 * comprobación está en `firestore.rules`.
 */
export function esUrlDeGifValida(url: string): boolean {
  if (typeof url !== 'string' || url.length === 0 || url.length > 1000) {
    return false;
  }
  return (
    /^https:\/\/media\d*\.giphy\.com\//.test(url) ||
    /^https:\/\/media\d*\.tenor\.com\//.test(url) ||
    /^https:\/\/tenor\.com\/[a-zA-Z0-9\/-]+\.gif/.test(url)
  );
}

/**
 * Comprueba la ficha completa de un GIF.
 *
 * Es la comprobación que comparten comentarios, hilos y chats: el
 * proveedor tiene que ser uno de los dos integrados y las dos URLs
 * (la grande y la de vista previa) tienen que venir de su CDN.
 * `firestore.rules` vuelve a hacer la misma comprobación.
 */
export function esGifValido(
  gif: GifAttachment | null | undefined,
): boolean {
  if (!gif) return true;
  if (gif.provider !== 'giphy' && gif.provider !== 'tenor') return false;
  if (!gif.id || gif.id.length > 120) return false;
  if (
    gif.title !== undefined &&
    (typeof gif.title !== 'string' || gif.title.length > 200)
  ) {
    return false;
  }
  return esUrlDeGifValida(gif.url) && esUrlDeGifValida(gif.previewUrl);
}
