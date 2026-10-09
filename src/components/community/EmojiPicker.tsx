import { useMemo, useState } from 'react';
import type { FC } from 'react';
import { Search, X } from 'lucide-react';

import {
  CATEGORIAS,
  EMOJIS,
  buscarEmojis,
  type CategoriaEmoji,
  type EmojiInfo,
} from '../../data/emojis';
import { useFavorites } from '../../hooks/useFavorites';
import { FavoriteStar } from './FavoriteStar';
import { votos } from '../../services/reactions';
import type { ReactionCounts } from '../../types';

// ======================================================
// SELECTOR DE EMOJIS
// ======================================================
//
// Es SOLO el contenido (buscador, pestañas y cuadrícula), sin
// posicionamiento: lo envuelve quien lo necesita.
//
//   - `ReactionBar` lo pinta dentro de su panel flotante, encima
//     de los cinco destacados.
//   - El chat lo pinta en su propia ventana, encima del campo de
//     escribir.
//
// Así el buscador de emojis está escrito una vez y las dos
// ventanas se comportan igual, que es justo lo que se nota
// cuando dos sitios parecidos se desincronizan.
//
// El buscador filtra por el texto del emoji ("corazón", "gato") y
// por el nombre de la clave. No hay base de datos de emojis ni
// llamada a internet: el catálogo está en el código
// (`src/data/emojis.ts`), así que funciona sin conexión y no
// cuesta ni un céntimo por búsqueda.
//
// ── Favoritos ────────────────────────────────────────────
//
// La primera pestaña son los emojis que el usuario ha guardado,
// con la estrella puesta en cada celda para quitarlo. Se guardan
// en `users/{uid}/favoriteEmojis/{clave}`, uno por documento (ver
// `services/favorites.ts` para el porqué de no usar un array).

/** Categoría de la pestaña de favoritos. */
const FAVORITOS = 'favoritos' as const;

type Pestana = CategoriaEmoji | typeof FAVORITOS;

interface EmojiPickerProps {
  /** Emoji que ya está puesto, si el caso es una reacción. */
  seleccionado?: string | null;
  onElegir: (emoji: EmojiInfo) => void;
  /** Categoría con la que se abre. */
  inicial?: CategoriaEmoji;
  /** Alto máximo de la zona con scroll. */
  alto?: string;
  /**
   * Recuentos por clave de reacción, para pintar un número en las
   * que ya se han usado.
   *
   * Hace falta sobre todo cuando hay más de tres: en la barra solo
   * se ven las tres más puestas, así que el catálogo es el sitio
   * donde se descubre que hay un ❤️ con seis votos.
   */
  counts?: ReactionCounts;
}

export const EmojiPicker: FC<EmojiPickerProps> = ({
  seleccionado,
  onElegir,
  inicial = 'destacados',
  alto = 'h-56',
  counts,
}) => {
  const [texto, setTexto] = useState('');
  const [pestana, setPestana] = useState<Pestana>(inicial);

  const { emojiKeys, esFavorito, alternarEmoji, haySesion } = useFavorites();

  const buscando = texto.trim().length > 0;

  // Los favoritos se piden por clave: si el catálogo deja de
  // tener un emoji, se ignora en vez de romper el selector. (La
  // regla impide guardar uno que no exista, pero el catálogo
  // puede cambiar después.)
  const favoritos = useMemo(
    () =>
      emojiKeys
        .map((k) => EMOJIS.find((e) => e.key === k))
        .filter((e): e is EmojiInfo => Boolean(e)),
    [emojiKeys],
  );

  // Con búsqueda sale lo que coincida, sea de la categoría que sea;
  // sin ella, solo la pestaña activa. La pestaña no se toca al
  // escribir: se busca en todo y, al borrar la búsqueda, se vuelve
  // a donde estabas.
  const lista = useMemo(() => {
    if (buscando) return buscarEmojis(texto);
    if (pestana === FAVORITOS) return favoritos;
    return EMOJIS.filter((e) => e.categoria === pestana);
  }, [buscando, texto, pestana, favoritos]);

  return (
    <div className="flex flex-col gap-2">
      {/* ── Buscador ─────────────────────────────────── */}
      <div className="relative px-1">
        <Search
          size={13}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
        />
        <input
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar emoji: risa, gato, Fired..."
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2 pl-8 pr-8 text-[11px] text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
        />
        {texto && (
          <button
            type="button"
            onClick={() => setTexto('')}
            aria-label="Borrar la búsqueda"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* ── Pestañas ─────────────────────────────────── */}
      {!buscando && (
        <div className="flex gap-1 overflow-x-auto px-1 pb-1">
          {/* Favoritos van los primeros: es lo que se busca casi
              siempre, y con el contador al lado se sabe si hay
              algo guardado sin abrir la pestaña. */}
          <button
            type="button"
            onClick={() => setPestana(FAVORITOS)}
            title="Tus favoritos"
            aria-label="Tus favoritos"
            className={`relative flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-sm transition-colors ${
              pestana === FAVORITOS
                ? 'bg-amber-400/20 ring-1 ring-amber-400/50'
                : 'hover:bg-zinc-800'
            }`}
          >
            <span aria-hidden="true">⭐</span>
            {emojiKeys.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-amber-400 px-1 font-mono text-[8px] font-bold text-zinc-950">
                {emojiKeys.length}
              </span>
            )}
          </button>

          {CATEGORIAS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setPestana(c.id)}
              title={c.label}
              aria-label={c.label}
              className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-sm transition-colors ${
                pestana === c.id
                  ? 'bg-violet-600/30 ring-1 ring-violet-500/50'
                  : 'hover:bg-zinc-800'
              }`}
            >
              {c.icono}
            </button>
          ))}
        </div>
      )}

      {/* ── Cuadrícula ───────────────────────────────── */}
      <div className={`panel-scroll overflow-y-auto px-1 ${alto}`}>
        {lista.length === 0 ? (
          pestana === FAVORITOS && !buscando ? (
            <FavoritosVacios haySesion={haySesion} />
          ) : (
            <p className="px-2 py-6 text-center text-[11px] text-zinc-500">
              No hay emojis para «{texto}».
            </p>
          )
        ) : (
          <div className="grid grid-cols-8 gap-0.5">
            {lista.map((e) => (
              // El `div` es el padre posicionado de los dos
              // botones (el emoji y la estrella). No pueden ir
              // anidados: dos botones dentro de otro no valen.
              <div key={e.key} className="relative">
                <button
                  type="button"
                  onClick={() => onElegir(e)}
                  title={
                    (counts?.[e.key] ?? 0) > 0
                      ? `${e.label} · ${votos(counts?.[e.key] ?? 0)}`
                      : e.label
                  }
                  aria-label={e.label}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-xl transition-all duration-100 hover:scale-110 hover:bg-violet-500/20 active:scale-95 ${
                    seleccionado === e.key
                      ? 'bg-violet-600/30 ring-1 ring-violet-500/60'
                      : ''
                  }`}
                >
                  {e.emoji}
                </button>

                {/* Contador de reacciones, abajo a la derecha. Va
                    en la esquina opuesta a la estrella (arriba) para
                    que los dos no se tapen. */}
                {(counts?.[e.key] ?? 0) > 0 && (
                  <span className="pointer-events-none absolute bottom-0.5 right-0.5 rounded-full bg-violet-600/90 px-1 font-mono text-[8px] font-bold leading-none text-white">
                    {counts?.[e.key]}
                  </span>
                )}

                <FavoriteStar
                  marcado={esFavorito(e.key)}
                  que={
                    esFavorito(e.key)
                      ? `Quitar ${e.label} de favoritos`
                      : `Guardar ${e.label} en favoritos`
                  }
                  onClick={() => alternarEmoji(e.key)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Lo que se ve cuando no hay favoritos guardados.
 *
 * Sin sesión no se puede guardar nada, así que se explica en vez
 * de enseñar un hueco vacío que parece un fallo.
 */
const FavoritosVacios: FC<{ haySesion: boolean }> = ({ haySesion }) => (
  <div className="px-2 py-6 text-center">
    <span className="mb-1 block text-2xl opacity-60" aria-hidden="true">
      ⭐
    </span>
    <p className="text-[11px] text-zinc-400">
      {haySesion
        ? 'Todavía no has guardado ningún emoji.'
        : 'Inicia sesión para guardar tus emojis favoritos.'}
    </p>
    <p className="mt-1 text-[10px] text-zinc-600">
      Toca la estrella de un emoji y aparecerá aquí.
    </p>
  </div>
);
