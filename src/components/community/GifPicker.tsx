import { useCallback, useEffect, useRef, useState } from 'react';
import type { FC } from 'react';
import {
  AlertCircle,
  ExternalLink,
  Loader2,
  Search,
  X,
} from 'lucide-react';

import {
  ATRIBUCION,
  ORIGEN,
  QUERY_POR_DEFECTO,
  aGifAdjunto,
  buscarGifs,
  config,
  type GifResult,
} from '../../services/gifs';
import { useFavorites } from '../../hooks/useFavorites';
import { FavoriteStar } from './FavoriteStar';
import type { GifAttachment } from '../../types';

// ======================================================
// SELECTOR DE GIFs PARA PUBLICACIONES, COMENTARIOS Y RESPUESTAS
// ======================================================
//
// Modal con buscador, cuadrícula y los estados que hacen falta:
// cargando, sin resultados y con error. Debajo del todo va el
// crédito que exigen GIPHY y Tenor.
//
// Va como VENTANA CENTRADA y no como panel anclado al botón a
// propósito. Un panel pegado al botón se sale de la pantalla en
// cuanto el botón está cerca de un borde, y en un comentario de
// un hilo conscroll eso pasa constantemente: la barra lateral
// tiene scroll propio y cualquier posición absoluta se acababa
// recortando. Con `fixed` + `inset-0` no hay posición que
// pueda salirse; en móvil se apoya abajo (tipo hoja) y en
// escritorio se centra.
//
// El GIF elegido NO se sube a Storage: se guarda su ficha (id,
// URLs y proveedor) en el comentario. El archivo se sigue
// sirviendo desde el CDN del proveedor.

interface GifPickerProps {
  /** GIF ya elegido, si lo hay. */
  value: GifAttachment | null;
  onChange: (gif: GifAttachment | null) => void;
  disabled?: boolean;
}

export const GifPicker: FC<GifPickerProps> = ({ value, onChange, disabled = false }) => {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [resultados, setResultados] = useState<GifResult[]>([]);
  const [error, setError] = useState('');

  // ── Favoritos ───────────────────────────────────────────
  //
  // El GIF elegido se guarda entero (`GifAttachment`), así que
  // volver a insertarlo no cuesta ninguna llamada a la API:
  // los favoritos son justo para no tener que buscar "el de la
  // risa que usé la semana pasada".
  //
  // La escucha solo existe con el panel abierto (este componente
  // se monta en cada comentario, así que escuchar siempre
  // multiplicaría las lecturas por todos los comentarios de la
  // página).
  const [verFavoritos, setVerFavoritos] = useState(false);
  const { gifs: favoritos, esFavoritoGif, alternarGif, haySesion } = useFavorites();

  const entrada = useRef<HTMLInputElement>(null);

  const cfg = config();

  // Sube a 1 cada vez que se pulsa "Reintentar", para que la
  // búsqueda vuelva a lanzarse aunque la palabra sea la misma
  // (si no, cambiar el texto a lo mismo no dispara nada).
  const [intento, setIntento] = useState(0);

  const cerrar = useCallback(() => {
    setAbierto(false);
    setResultados([]);
    setError('');
    setVerFavoritos(false);
  }, []);

  // ── Búsqueda con retardo ───────────────────────────────
  //
  // Se escribe en un temporizador de 350 ms para no lanzar una
  // petición por cada tecla, y se cancela si llega otra antes de
  // tiempo. `AbortController` además corta la petición anterior
  // cuando se puede; el proxy de Tenor no admite cancelación y
  // su respuesta se descarta igualmente al comparar con el
  // `signal`.
  //
  // En la pestaña de favoritos NO se busca: son los guardados, y
  // abrirlos no debe gastar una petición de API.
  useEffect(() => {
    if (!abierto || verFavoritos) return;

    if (!cfg.listo) {
      setResultados([]);
      setBuscando(false);
      setError('');
      return;
    }

    const controller = new AbortController();
    setBuscando(true);
    setError('');

    const t = setTimeout(() => {
      buscarGifs(texto, controller.signal)
        .then((lista) => {
          if (controller.signal.aborted) return;
          setResultados(lista);
          setBuscando(false);
        })
        .catch((e: unknown) => {
          if (controller.signal.aborted) return;
          setResultados([]);
          setBuscando(false);
          if (e instanceof Error && e.name === 'AbortError') return;
          setError(
            e instanceof Error ? e.message : 'No se pudieron buscar GIFs.',
          );
        });
    }, 350);

    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [abierto, texto, intento, cfg.listo, verFavoritos]);

  // Al abrir se pone el foco en el buscador: en el móvil eso
  // abre el teclado y se puede escribir directamente, que es lo
  // que se espera de un buscador. En favoritos no, porque ahí no
  // hay nada que escribir.
  useEffect(() => {
    if (abierto && !verFavoritos) setTexto(QUERY_POR_DEFECTO);
  }, [abierto, verFavoritos]);

  useEffect(() => {
    if (abierto && cfg.listo && !verFavoritos) {
      const t = setTimeout(() => entrada.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [abierto, cfg.listo, verFavoritos]);

  // Escape cierra, y el scroll de detrás se bloquea mientras el
  // panel está abierto (si no, en móvil se mueve el foro entero
  // al arrastrar sobre el modal).
  useEffect(() => {
    if (!abierto) return;

    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cerrar();
    };
    document.addEventListener('keydown', escape);

    const antes = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', escape);
      document.body.style.overflow = antes;
    };
  }, [abierto, cerrar]);

  /**
   * Inserta el GIF de una celda (de la búsqueda o de favoritos).
   *
   * Se pasa por la misma puerta en los dos casos porque `celdas`
   * ya trae la ficha convertida, así el botón de la estrella y el
   * de insertar no pueden discrepar sobre qué GIF es.
   */
  const elegirFavorito = (gif: GifAttachment) => {
    onChange(gif);
    cerrar();
  };

  /** Un resultado de búsqueda y un favorito, con la misma forma para pintar. */
  type Celda = {
    id: string;
    previewUrl: string;
    gif: GifAttachment;
  };

  const celdas: Celda[] = verFavoritos
    ? favoritos.map((f) => ({ id: f.id, previewUrl: f.gif.previewUrl, gif: f.gif }))
    : resultados.map((g) => ({ id: g.id, previewUrl: g.previewUrl, gif: aGifAdjunto(g) }));

  // ── Botón + vista previa ───────────────────────────────
  if (value) {
    return (
      <div className="relative inline-block">
        <img
          src={value.previewUrl || value.url}
          alt={value.title ?? 'GIF de la publicación'}
          className="h-16 w-24 rounded-xl border border-zinc-800 bg-zinc-950 object-cover"
        />

        {/* La estrella del GIF ya elegido: se puede guardar sin
            volver a abrir el buscador, que es justo cuando se
            decide si vuelve a usarse. */}
        <FavoriteStar
          size={12}
          marcado={esFavoritoGif(value.id)}
          que={
            esFavoritoGif(value.id)
              ? 'Quitar este GIF de favoritos'
              : 'Guardar este GIF en favoritos'
          }
          onClick={() => alternarGif(value)}
        />

        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-300 shadow-lg transition-colors hover:border-red-500/60 hover:text-red-400"
          aria-label="Quitar GIF"
        >
          <X size={12} />
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        disabled={disabled}
        title="Buscar un GIF"
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed px-2.5 py-1.5 text-[11px] font-semibold text-zinc-500 transition-colors hover:border-fuchsia-500/60 hover:text-fuchsia-300 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="text-sm leading-none">🎬</span>
        GIF
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) cerrar();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Buscar un GIF"
            className="geo-pop-in flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-violet-500/30 bg-zinc-900 shadow-2xl shadow-violet-950/60 sm:rounded-3xl"
          >
            {/* ── Cabecera ─────────────────────────────── */}
            <div className="flex items-center justify-between gap-2 border-b border-zinc-800 px-4 py-3">
              <h3 className="text-sm font-bold text-white">Insertar GIF</h3>
              <span className="flex items-center gap-1">
                {/* Pestaña de favoritos. Se puede abrir SIN
                    proveedor configurado: los GIFs guardados
                    están en Firestore, no en la API. Es lo que
                    hace que esta pestaña sirva de algo
                    aunque el buscador esté caído. */}
                <button
                  type="button"
                  onClick={() => setVerFavoritos((v) => !v)}
                  aria-pressed={verFavoritos}
                  title="Tus GIFs guardados"
                  className={`relative flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-colors ${
                    verFavoritos
                      ? 'bg-amber-400/20 text-amber-300'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  <span aria-hidden="true">⭐</span>
                  <span className="hidden sm:inline">Favoritos</span>
                  {favoritos.length > 0 && (
                    <span className="rounded-full bg-amber-400/90 px-1 font-mono text-[9px] font-bold text-zinc-950">
                      {favoritos.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={cerrar}
                  aria-label="Cerrar el buscador de GIFs"
                  className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                >
                  <X size={16} />
                </button>
              </span>
            </div>

            {/* ── Buscador ─────────────────────────────── */}
            {!verFavoritos && (
              <div className="px-4 py-3">
                <div className="relative">
                  <Search
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                  />
                  <input
                    ref={entrada}
                    type="text"
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    placeholder="Busca un GIF: sonreír, llorar, wtf..."
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 pl-9 pr-3 text-xs text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* ── Cuerpo ───────────────────────────────── */}
            <div className="min-h-[16rem] flex-1 overflow-y-auto px-4 pb-3">
              {verFavoritos ? (
                celdas.length === 0 ? (
                  <FavoritosGifVacios haySesion={haySesion} />
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {celdas.map((c) => (
                      <CeldaGif
                        key={c.id}
                        celda={c}
                        marcado={esFavoritoGif(c.id)}
                        onInsertar={() => elegirFavorito(c.gif)}
                        onAlternar={() => alternarGif(c.gif)}
                      />
                    ))}
                  </div>
                )
              ) : !cfg.listo ? (
                <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-center">
                  <AlertCircle size={18} className="mx-auto mb-2 text-amber-400" />
                  <p className="text-[11px] leading-relaxed text-amber-200/90">
                    {cfg.motivo}
                  </p>
                </div>
              ) : error ? (
                <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-center">
                  <AlertCircle size={18} className="mx-auto mb-2 text-red-400" />
                  <p className="text-[11px] leading-relaxed text-red-300">{error}</p>
                  <button
                    type="button"
                    onClick={() => setIntento((n) => n + 1)}
                    className="mt-2 rounded-lg bg-zinc-800 px-3 py-1.5 text-[11px] font-semibold text-zinc-200 transition-colors hover:bg-zinc-700"
                  >
                    Reintentar
                  </button>
                </div>
              ) : buscando && resultados.length === 0 ? (
                // Esqueleto de carga: seis recuadros pulsando.
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square animate-pulse rounded-xl bg-zinc-800/70"
                    />
                  ))}
                </div>
              ) : resultados.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-xs text-zinc-400">
                    No hay GIFs para «{texto}».
                  </p>
                  <p className="mt-1 text-[11px] text-zinc-600">
                    Prueba con otra palabra: los GIFs se buscan por su etiqueta.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {celdas.map((c) => (
                    <CeldaGif
                      key={c.id}
                      celda={c}
                      marcado={esFavoritoGif(c.id)}
                      onInsertar={() => elegirFavorito(c.gif)}
                      onAlternar={() => alternarGif(c.gif)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── Pie: crédito y cancelar ──────────────── */}
            <div className="flex items-center justify-between gap-2 border-t border-zinc-800 px-4 py-2.5">
              {cfg.provider ? (
                <a
                  href={ORIGEN[cfg.provider]}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 text-[10px] text-zinc-500 transition-colors hover:text-zinc-300"
                >
                  {ATRIBUCION[cfg.provider]}
                  <ExternalLink size={9} />
                </a>
              ) : (
                <span className="text-[10px] text-zinc-600">
                  {buscando && <Loader2 size={10} className="mr-1 inline animate-spin" />}
                  Sin proveedor configurado
                </span>
              )}

              <button
                type="button"
                onClick={cerrar}
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-[11px] font-semibold text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/**
 * Una celda de la cuadrícula: la imagen, el botón de insertar y
 * la estrella de favorito.
 *
 * Se usa tanto para los resultados de la búsqueda como para los
 * favoritos, porque se comportan igual y duplicar el marcado
 * acabaría haciendo que uno de los dos se quedara sin estrella.
 *
 * El `div` posicionado es el padre de los dos botones: no pueden
 * ir anidados (dos botones dentro de otro no es HTML válido, y el
 * clic del de dentro no llega al de fuera).
 */
const CeldaGif: FC<{
  celda: { id: string; previewUrl: string; gif: GifAttachment };
  marcado: boolean;
  onInsertar: () => void;
  onAlternar: () => void;
}> = ({ celda, marcado, onInsertar, onAlternar }) => (
  <div className="relative">
    <button
      type="button"
      onClick={onInsertar}
      title={celda.gif.title ?? celda.id}
      aria-label="Insertar este GIF"
      className="group relative aspect-square w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 transition-all duration-150 hover:border-violet-500/70 active:scale-95"
    >
      <img
        src={celda.previewUrl}
        alt={celda.gif.title ?? 'GIF'}
        loading="lazy"
        className="h-full w-full object-cover"
      />
      <span className="pointer-events-none absolute inset-0 bg-violet-500/0 transition-colors group-hover:bg-violet-500/10" />
    </button>

    <FavoriteStar
      marcado={marcado}
      que={marcado ? 'Quitar este GIF de favoritos' : 'Guardar este GIF en favoritos'}
      onClick={onAlternar}
    />
  </div>
);

/**
 * Lo que se ve al abrir la pestaña de favoritos sin tener ninguno.
 *
 * Sin sesión no se puede guardar nada, así que se explica en vez
 * de dejar un hueco vacío que parece un fallo.
 */
const FavoritosGifVacios: FC<{ haySesion: boolean }> = ({ haySesion }) => (
  <div className="py-10 text-center">
    <span className="mb-1 block text-2xl opacity-60" aria-hidden="true">
      ⭐
    </span>
    <p className="text-xs text-zinc-400">
      {haySesion
        ? 'Todavía no has guardado ningún GIF.'
        : 'Inicia sesión para guardar tus GIFs favoritos.'}
    </p>
    <p className="mt-1 text-[11px] text-zinc-600">
      Toca la estrella de un GIF y aparecerá aquí, listo para insertar.
    </p>
  </div>
);
