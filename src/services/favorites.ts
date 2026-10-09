import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import { esClaveDeReaccion } from '../data/emojis';
import { esUrlDeGifValida } from './gifs';
import type { GifAttachment } from '../types';

// ======================================================
// FAVORITOS: EMOJIS Y GIFs
// ======================================================
//
// Para no tener que buscar "el emoji de siempre" o "el GIF del
// chiste del otro día" en cada mensaje.
//
// ── Dónde se guardan ──────────────────────────────────────
//
//   users/{uid}/favoriteEmojis/{claveDelEmoji}
//   users/{uid}/favoriteGifs/{idDelGif}
//
// Un documento por favorito, NO un array en el documento del
// usuario. La razón es la de siempre: un array obliga a leer el
// documento entero y reescribirlo para cambiar una entrada, así
// que dos pulsaciones seguidas (quitar 🔥 y poner 😂) se pisan y
// se pierde una. Con un documento por favorito, cada pulsación va
// a su sitio y no hay carrera.
//
// Además, el nombre del documento ES la clave del emoji: no hay
// que filtrar duplicados ni comprobar nada.
//
// ── De los GIFs se guarda la ficha entera ─────────────────
//
// A propósito, y al revés que con los emojis: aquí se guarda
// el `GifAttachment` completo (proveedor, id y URLs) para poder
// volver a insertarlo SIN volver a llamar a la API. Si solo se
// guardara el id, "favoritos" sería un buscador que además cobra
// por abrir.
//
// Las reglas comprueban que esas URLs sean del CDN del
// proveedor (mismo `gifValido` que comentarios y mensajes), y solo
// quien es su dueño puede leerlas o escribirlas.

export const FAV_EMOJIS = 'favoriteEmojis';
export const FAV_GIFS = 'favoriteGifs';

/** Un GIF guardado, tal y como vuelve de Firestore. */
export interface FavoriteGif {
  id: string;
  gif: GifAttachment;
}

// ──────────────────────────────────────────────────────────
// EMOJIS
// ──────────────────────────────────────────────────────────

/** Marca un emoji como favorito. */
export async function addFavoriteEmoji(uid: string, emojiKey: string): Promise<void> {
  // Se valida antes de escribir: la regla también lo comprueba,
  // pero aquí el error es un mensaje útil y no un PERMISSION_DENIED.
  if (!esClaveDeReaccion(emojiKey)) {
    throw new Error('Ese emoji no existe.');
  }

  await setDoc(
    doc(db, 'users', uid, FAV_EMOJIS, emojiKey),
    { emojiKey, createdAt: serverTimestamp() },
    { merge: true },
  );
}

/** Quita un emoji de favoritos. */
export async function removeFavoriteEmoji(uid: string, emojiKey: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, FAV_EMOJIS, emojiKey));
}

/** Marca o quita, según lo que haya. */
export async function toggleFavoriteEmoji(
  uid: string,
  emojiKey: string,
  estaMarcado: boolean,
): Promise<void> {
  if (estaMarcado) await removeFavoriteEmoji(uid, emojiKey);
  else await addFavoriteEmoji(uid, emojiKey);
}

/**
 * Escucha los emojis favoritos.
 *
 * Con `orderBy('createdAt')` para que salgan en el orden en que
 * la persona los fue guardando, que es el orden útil: lo último
 * que guardó es lo que probablemente quiere ahora.
 *
 * Sin sesión, o sin ninguna escucha posible, se avisa con una
 * lista vacía en vez de dejar el selector en "cargando".
 */
export function listenFavoriteEmojis(
  uid: string | null | undefined,
  alCambiar: (claves: string[]) => void,
): () => void {
  if (!uid) {
    alCambiar([]);
    return () => {};
  }

  return onSnapshot(
    query(
      collection(db, 'users', uid, FAV_EMOJIS),
      orderBy('createdAt', 'desc'),
    ),
    (snap) => alCambiar(snap.docs.map((d) => d.id)),
    (e) => {
      console.error('[Favoritos] Error escuchando los emojis guardados:', e);
      alCambiar([]);
    },
  );
}

// ──────────────────────────────────────────────────────────
// GIFs
// ──────────────────────────────────────────────────────────

/** Guarda un GIF en favoritos. */
export async function addFavoriteGif(uid: string, gif: GifAttachment): Promise<void> {
  if (!esUrlDeGifValida(gif.url) || !esUrlDeGifValida(gif.previewUrl)) {
    throw new Error('Ese GIF no es válido.');
  }

  await setDoc(
    doc(db, 'users', uid, FAV_GIFS, gif.id),
    { gifId: gif.id, gif, createdAt: serverTimestamp() },
    { merge: true },
  );
}

/** Quita un GIF de favoritos. */
export async function removeFavoriteGif(uid: string, gifId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, FAV_GIFS, gifId));
}

/** Marca o quita un GIF de favoritos. */
export async function toggleFavoriteGif(
  uid: string,
  gif: GifAttachment,
  estaMarcado: boolean,
): Promise<void> {
  if (estaMarcado) await removeFavoriteGif(uid, gif.id);
  else await addFavoriteGif(uid, gif);
}

/** Escucha los GIFs guardados, del más reciente al más antiguo. */
export function listenFavoriteGifs(
  uid: string | null | undefined,
  alCambiar: (favoritos: FavoriteGif[]) => void,
): () => void {
  if (!uid) {
    alCambiar([]);
    return () => {};
  }

  return onSnapshot(
    query(collection(db, 'users', uid, FAV_GIFS), orderBy('createdAt', 'desc')),
    (snap) =>
      alCambiar(
        snap.docs
          .map((d) => ({ id: d.id, gif: d.data().gif as GifAttachment }))
          // Un GIF guardado sin ficha (o con una URL que ya no
          // vale) no se pinta: mejor no ofrecerlo que reventar
          // el <img> al abrirlo.
          .filter(
            (f) =>
              f.gif &&
              esUrlDeGifValida(f.gif.url) &&
              esUrlDeGifValida(f.gif.previewUrl),
          ),
      ),
    (e) => {
      console.error('[Favoritos] Error escuchando los GIFs guardados:', e);
      alCambiar([]);
    },
  );
}
