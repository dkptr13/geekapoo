import React, { useCallback, useEffect, useState } from 'react';
import { X, Loader2, UserRound } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useFollows } from '../../context/FollowsContext';
import { useGoToProfile } from '../../hooks/useGoToProfile';
import { cargarPagina, errorDeFollow, type ListaSeguidos } from '../../services/follows';
import { nivelDesdeXp } from '../../utils/progression';
import { textoTitulo } from '../gamification/AuthorBadge';
import { CONFIG_POR_DEFECTO } from '../../types/gamification';
import { FollowButton } from './FollowButton';
import { etiquetaLista } from '../../utils/follows';
import type { Follow } from '../../types/follows';
import type { User } from '../../types';
import type { WithId } from '../../services/firestoreUtils';

// ======================================================
// MODAL DE SEGUIDORES Y SEGUIDOS
// ======================================================
//
// Un solo componente para las dos listas, con un parámetro, en vez
// de dos. Se differentiate por la pestaña, no por el código: el
// cuerpo (la lista, la paginación, los estados vacío/cargando/error
// y el botón de seguir de cada fila) es IDÉNTICO en los dos casos,
// y duplicarlo haría que los dos se desincronicen.
//
// ── La lista sale paginada, sin excepción ─────────────────
//
// Ni siquiera para 30 seguidores. El motivo no es la cantidad sino
// que el coste de una lista mal planteada es invisible hasta que
// es enorme: `getDocs` sobre una colección que un día tiene 400
// documentos funciona igual de bien y cuesta 400 lecturas. La
// paginación cuesta un `startAfter` y un `limit`, y no se nota.
//
// Con eso, el modal pide 26 documentos (25 + 1 para saber si hay
// más) en vez de miles, y el botón "Cargar más" aparece solo si de
// verdad hay más gente detrás.
//
// ── Los perfiles salen de `usersList`, sin consultas ─────
//
// Cada fila necesita avatar, nombre, nivel y título. Todo eso está
// en el documento de usuario, y `AuthContext` ya tiene un listener
// con TODOS los usuarios en memoria. Leerlos de ahí es un `find`
// sobre un array: coste cero, cero lecturas.
//
// Si se leyera cada perfil con un `getDoc` al pintar la fila,
// treinta filas serían treinta lecturas por cada apertura del modal
// (el clásico N+1). Con `usersList`, cero.

interface FollowersModalProps {
  /** A quién se le mira la lista. */
  userId: string;
  /** Qué lista: los que te siguen o a los que sigues. */
  lista: ListaSeguidos;
  /** Para el título: "Seguidores" o "Seguidos". */
  nombreLista: string;
  onCerrar: () => void;
  /** Si viene, se dibuja la cabecera con su nombre. */
  titulo?: string;
}

export const FollowersModal: React.FC<FollowersModalProps> = ({
  userId,
  lista,
  nombreLista,
  onCerrar,
  titulo,
}) => {
  const { usersList } = useAuth();
  const { social, socialUid } = useFollows();
  const goToProfile = useGoToProfile();

  const [items, setItems] = useState<WithId<Follow>[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<Parameters<typeof cargarPagina>[2]>(null);
  const [hayMas, setHayMas] = useState(false);

  // ── Cargar ─────────────────────────────────────────
  //
  // La primera página se pide al montar y cada vez que cambia de
  // quién o de qué lista. Las siguientes, con "cargar más".
  const cargarPrimera = useCallback(async () => {
    setCargando(true);
    setError(null);

    try {
      const pagina = await cargarPagina(userId, lista);
      setItems(pagina.items);
      setCursor(pagina.cursor);
      setHayMas(pagina.hayMas);
    } catch (e) {
      console.error('[Follows] No se pudo cargar la lista:', e);
      setError(errorDeFollow(e));
      setItems([]);
    } finally {
      setCargando(false);
    }
  }, [userId, lista]);

  useEffect(() => {
    void cargarPrimera();
  }, [cargarPrimera]);

  // ── Cerrar con Escape ──────────────────────────────
  //
  // Sin esto, un modal que se abre con el botón del perfil no se
  // puede cerrar con el teclado. Es un detalle pequeño pero de los
  // que se notan: el usuario que ya sabe que Escape cierra las
  // cosas (porque en el resto de la app lo hace) prueba y nada.
  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar();
    };
    document.addEventListener('keydown', alPulsar);
    return () => document.removeEventListener('keydown', alPulsar);
  }, [onCerrar]);

  const cargarMas = async () => {
    if (!cursor || cargandoMas) return;

    setCargandoMas(true);
    setError(null);

    try {
      const pagina = await cargarPagina(userId, lista, cursor);
      setItems((prev) => [...prev, ...pagina.items]);
      setCursor(pagina.cursor);
      setHayMas(pagina.hayMas);
    } catch (e) {
      console.error('[Follows] No se pudo cargar más de la lista:', e);
      setError(errorDeFollow(e));
    } finally {
      setCargandoMas(false);
    }
  };

  // ── El perfil de cada fila ────────────────────────
  //
  // Sale de `usersList`. Si no está (cuenta borrada, o alguien que
  // el directorio filtra por estar baneado), se pinta una fila con
  // lo mínimo en vez de esconderla: la RELACIÓN existe y si
  // desaparece de la lista el contador no cuadra con lo que se ve.
  const perfilDe = (uid: string): User | undefined =>
    usersList.find((u) => u.uid === uid);

  // El nivel sale del documento (`users/{uid}.level`), que es el
  // que escribe la Cloud Function, y solo si no está se calcula.
  //
  // Calcularlo con la curva por defecto como única opción daría un
  // nivel equivocado a todo el mundo si el administrador cambiara
  // la curva: el perfil y el modal enseñarían números distintos
  // para la misma persona.
  const nivelDe = (u: User | undefined): number => {
    if (!u) return 0;
    if (typeof u.level === 'number' && u.level > 0) return u.level;
    return nivelDesdeXp(u.xp ?? 0, CONFIG_POR_DEFECTO).level;
  };

  // El título sale de `textoTitulo`, que es el MISMO criterio que
  // usan el perfil y la chapa de autor: no se enseña si su medalla
  // ya no está desbloqueada. Estaba repetido aquí con tres líneas
  // propias, y esa es la forma de que un día uno cambie el criterio
  // y el otro no.
  const tituloDe = (u: User | undefined): string | null => textoTitulo(u);

  // ── El contador de la cabecera ────────────────────
  //
  // Viene de `users/{uid}` (el listener del contexto), NO de
  // `items.length`: al paginar solo hay 25 de 300 en la lista, y
  // enseñar "25 seguidores" sería mentir.
  //
  // El `socialUid === userId` no es un detalle: los contadores son
  // los de UNA persona, y si el modal se abre sobre un perfil
  // mientras el contexto sigue escuchando a otro, sin la
  // comparación saldría el número equivocado.
  const total =
    socialUid === userId
      ? (social?.[lista === 'followers' ? 'followersCount' : 'followingCount'] ?? null)
      : null;

  const vacio = !cargando && !error && items.length === 0;

  return (
    // El fondo cierra al pulsar fuera del contenido. Es lo que
    // espera cualquiera que ya haya usado un modal: pulsar fuera
    // es "cerrar".
    //
    // `items-end` en móvil y `items-center` en `sm`: en el teléfono
    // el teclado virtual tapa media pantalla y un modal centrado
    // queda debajo, así que ahí se ancla abajo. En escritorio,
    // centrado, que es lo que se espera a partir de cierta anchura.
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onCerrar}
    >
      {/*
        El panel lleva `role="dialog"` y `aria-modal` para que los
        lectores de pantalla sepan que es un modal, y el
        `stopPropagation` para que el clic interior no lo cierre.

        El `max-h` con `dvh` en vez de `vh`: en móvil, `vh` mide
        mal cuando el navegador cambia los barras de direcciones al
        hacer scroll, y el modal se salía por abajo.
      */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={nombreLista}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-white/[0.06] bg-[#0c0c14]/95 shadow-[0_24px_64px_-24px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:max-w-md sm:rounded-3xl"
      >
        {/* ── Cabecera ─────────────────────────────────── */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold text-white">
              {titulo ? `${nombreLista} de ${titulo}` : nombreLista}
            </h2>
            {/* El total sale del contador del documento, no de las
                filas cargadas: al paginar solo hay 25 de 300. */}
            <p className="mt-0.5 text-[11px] text-zinc-500">
              {total !== null
                ? etiquetaLista(total, lista === 'followers')
                : 'Cargando...'}
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="chat-boton flex-shrink-0 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/[0.05] hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Cuerpo ───────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-3">
          {cargando && (
            <div className="flex items-center justify-center gap-2 py-10">
              <Loader2 size={16} className="animate-spin text-violet-400" />
              <span className="text-xs text-zinc-400">Cargando...</span>
            </div>
          )}

          {!cargando && error && (
            <div className="py-8 text-center">
              <p className="text-xs text-rose-400">{error}</p>
              <button
                type="button"
                onClick={() => void cargarPrimera()}
                className="chat-boton mt-3 rounded-lg border border-white/[0.08] px-3 py-1.5 text-[11px] font-bold text-zinc-300 transition-colors hover:border-violet-400/40 hover:text-white"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Los dos estados vacíos que pide el enunciado, y son
              distintos a propósito: "no hay nadie" no es lo mismo
              que "no tienes popularity". */}
          {vacio && lista === 'followers' && (
            <p className="rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.02] px-4 py-8 text-center text-xs text-zinc-500">
              Este usuario todavía no tiene seguidores.
            </p>
          )}

          {vacio && lista === 'following' && (
            <p className="rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.02] px-4 py-8 text-center text-xs text-zinc-500">
              Este usuario todavía no sigue a nadie.
            </p>
          )}

          {!cargando && !error && items.length > 0 && (
            <>
              <ul className="space-y-1.5">
                {items.map((item) => {
                  const uid = item.followerId || item.id;
                  const perfil = perfilDe(uid);

                  return (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 rounded-2xl border border-white/[0.04] bg-white/[0.02] p-2.5"
                    >
                      {/* El avatar y el nombre abren el perfil, y
                          son dos zonas dentro de un MISMO botón, no
                          una zona que abarque la fila entera. La
                          razón es HTML: un `<button>` dentro de
                          otro `<button>` es inválido, y el interior
                          deja de pulsarse. Separate del botón de
                          "Seguir" de la derecha por un hueco real,
                          no por un margen. */}
                      <button
                        type="button"
                        onClick={() => {
                          goToProfile(uid);
                          onCerrar();
                        }}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        title={`Ver el perfil de ${perfil?.username ?? 'esta persona'}`}
                      >
                        {perfil?.avatarUrl ? (
                          <img
                            src={perfil.avatarUrl}
                            alt={perfil.username}
                            className="h-10 w-10 flex-shrink-0 rounded-xl object-cover ring-2 ring-white/10"
                          />
                        ) : (
                          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-zinc-400 ring-2 ring-white/10">
                            <UserRound size={16} />
                          </span>
                        )}

                        <span className="min-w-0 flex-1">
                          {/* El nombre visible si existe, y el
                              username debajo. Al revés sería
                              menos útil: el nombre es lo que
                              reconoce la gente. */}
                          <span className="block truncate text-xs font-bold text-white">
                            {perfil?.displayName ||
                              perfil?.username ||
                              'Cuenta eliminada'}
                          </span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                            {perfil?.username && perfil.displayName && (
                              <span className="text-[10px] text-zinc-500">
                                @{perfil.username}
                              </span>
                            )}
                            {perfil && (
                              <span className="text-[10px] font-semibold text-violet-300">
                                Nv.{nivelDe(perfil)}
                              </span>
                            )}
                            {tituloDe(perfil) && (
                              <span className="truncate text-[10px] text-amber-400">
                                {tituloDe(perfil)}
                              </span>
                            )}
                          </span>
                        </span>
                      </button>

                      {/* El botón de seguir de cada fila.
                          `compacto` porque treinta filas de botones
                          grandes no caben en un móvil. */}
                      <FollowButton userId={uid} usuario={perfil} compacto />
                    </li>
                  );
                })}
              </ul>

              {hayMas && (
                <button
                  type="button"
                  onClick={() => void cargarMas()}
                  disabled={cargandoMas}
                  className="chat-boton mt-3 w-full rounded-xl border border-white/[0.06] py-2.5 text-[11px] font-bold text-zinc-400 transition-colors hover:border-violet-400/40 hover:text-white disabled:opacity-50"
                >
                  {cargandoMas ? 'Cargando...' : 'Cargar más'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};