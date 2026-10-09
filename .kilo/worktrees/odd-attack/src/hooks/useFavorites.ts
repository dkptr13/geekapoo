import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '../context/AuthContext';
import {
  listenFavoriteEmojis,
  listenFavoriteGifs,
  toggleFavoriteEmoji,
  toggleFavoriteGif,
  type FavoriteGif,
} from '../services/favorites';
import type { GifAttachment } from '../types';

// ======================================================
// FAVORITOS DE LA SESIÓN ACTUAL
// ======================================================
//
// Un solo hook para los dos selectores (emojis y GIFs), porque
// los dos necesitan lo mismo: la lista de lo guardado y la
// manera de alternarlo. Los dos escuchan por su cuenta y solo
// cuando el selector está abierto (los hooks viven dentro de
// `EmojiPicker` y de `GifPicker`), así que una conversación sin
// favoritos no cuesta ninguna lectura.
//
// Todas las acciones pasan por `requireAuth`: sin sesión, marcar
// un emoji te abre el login en vez de fallar en silencio.

export interface UseFavorites {
  /** Claves de los emojis guardados. */
  emojiKeys: string[];
  /** `true` si ese emoji está guardado. */
  esFavorito: (emojiKey: string) => boolean;
  alternarEmoji: (emojiKey: string) => void;

  /** GIFs guardados, del más reciente al más antiguo. */
  gifs: FavoriteGif[];
  /** `true` si ese GIF está guardado. */
  esFavoritoGif: (gifId: string) => boolean;
  alternarGif: (gif: GifAttachment) => void;

  /** `true` mientras llegan los datos de favoritos. */
  cargando: boolean;
  /** `false` si no hay sesión: entonces no hay favoritos que enseñar. */
  haySesion: boolean;
}

export function useFavorites(): UseFavorites {
  const { currentUser, requireAuth } = useAuth();
  const uid = currentUser?.uid ?? null;

  const [emojiKeys, setEmojiKeys] = useState<string[]>([]);
  const [gifs, setGifs] = useState<FavoriteGif[]>([]);
  const [cargando, setCargando] = useState(false);

  // ── Emojis guardados ───────────────────────────────────
  useEffect(() => {
    setCargando(Boolean(uid));
    return listenFavoriteEmojis(uid, (claves) => {
      setEmojiKeys(claves);
      setCargando(false);
    });
  }, [uid]);

  // ── GIFs guardados ─────────────────────────────────────
  useEffect(() => listenFavoriteGifs(uid, (lista) => {
    setGifs(lista);
    setCargando(false);
  }), [uid]);

  const setEmojiKeysMemo = useMemo(() => new Set(emojiKeys), [emojiKeys]);
  const idsGifsMemo = useMemo(() => new Set(gifs.map((g) => g.id)), [gifs]);

  const esFavorito = useCallback(
    (emojiKey: string) => setEmojiKeysMemo.has(emojiKey),
    [setEmojiKeysMemo],
  );

  const esFavoritoGif = useCallback(
    (gifId: string) => idsGifsMemo.has(gifId),
    [idsGifsMemo],
  );

  const alternarEmoji = useCallback(
    (emojiKey: string) => {
      if (!requireAuth('guardar emojis en favoritos')) return;
      if (!uid) return;

      const estaba = setEmojiKeysMemo.has(emojiKey);

      // El cambio se pinta al instante y la escritura va detrás.
      // Si la escritura falla, la escucha vuelve a traer la
      // verdad y el botón se corrige solo: mejor eso que un
      // "cargando" en cada estrella.
      setEmojiKeys((antes) =>
        estaba ? antes.filter((k) => k !== emojiKey) : [emojiKey, ...antes],
      );

      toggleFavoriteEmoji(uid, emojiKey, estaba).catch((e) => {
        console.error('[Favoritos] No se pudo guardar el emoji:', e);
      });
    },
    [requireAuth, uid, setEmojiKeysMemo],
  );

  const alternarGif = useCallback(
    (gif: GifAttachment) => {
      if (!requireAuth('guardar GIFs en favoritos')) return;
      if (!uid) return;

      const estaba = idsGifsMemo.has(gif.id);

      setGifs((antes) =>
        estaba
          ? antes.filter((g) => g.id !== gif.id)
          : [{ id: gif.id, gif }, ...antes],
      );

      toggleFavoriteGif(uid, gif, estaba).catch((e) => {
        console.error('[Favoritos] No se pudo guardar el GIF:', e);
      });
    },
    [requireAuth, uid, idsGifsMemo],
  );

  return {
    emojiKeys,
    esFavorito,
    alternarEmoji,
    gifs,
    esFavoritoGif,
    alternarGif,
    cargando,
    haySesion: Boolean(uid),
  };
}
