import React, { useMemo, useState } from 'react';
import { MessageCircle, Layers, Reply, Heart, ArrowUpRight } from 'lucide-react';

import { formatearNumero } from '../../utils/follows';
import { PASO_PERFIL, type PerfilDatos } from '../../types/profile';
import type { Comment } from '../../types';

// ======================================================
// PUBLICACIONES Y COMENTARIOS DEL USUARIO
// ======================================================
//
// Las dos listas del perfil, en pestañas. Una en vez de dos
// porque el usuario llega aquí a ver una cosa, y las dos son
// listas largas: de esta forma solo se pinta la que interesa.
//
// ── Por qué NO hay paginación de Firestore aquí ───────────
//
// Sería lo esperable en un perfil, y es lo que se hace con los
// seguidores (`FollowersModal`). Pero los hilos y los comentarios
// NO son de este perfil: `CommunityContext` los trae TODOS en
// memoria, con un listener, porque el feed los necesita enteros
// para pintar la portada.
//
// Paginarlos otra vez sería una segunda consulta de lo mismo que
// ya está en memoria: el doble de lecturas para exactamente el
// mismo dato. Aquí lo que se pagina es lo que se PINTA, que es
// lo que cuesta en el DOM, y eso sí importa.
//
// El día que un usuario tenga mil hilos, el arreglo es sacarlos
// del contexto global (un listener por perfil), y no añadir un
// `limit()` aquí encima.

type Pestana = 'hilos' | 'comentarios';

export const ProfileContent: React.FC<{
  datos: PerfilDatos;
  /** Abre un hilo (y opcionalmente un comentario). */
  onIrA?: (threadId: string, commentId?: string) => void;
}> = ({ datos, onIrA }) => {
  const [pestana, setPestana] = useState<Pestana>('hilos');
  const [cuantos, setCuantos] = useState(PASO_PERFIL);

  const hilos = useMemo(
    () =>
      datos.threads
        .filter((t) => t.authorId === datos.uid)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [datos.threads, datos.uid],
  );

  const comentarios = useMemo(
    () =>
      datos.comments
        .filter((c) => c.authorId === datos.uid)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [datos.comments, datos.uid],
  );

  const total = pestana === 'hilos' ? hilos.length : comentarios.length;

  // El texto del estado vacío lleva el nombre de la pestaña que
  // está activa. Con un texto fijo, quien pulsara "Comentarios" en
  // una cuenta sin comentarios leería "no ha publicado ningún
  // hilo", que no es lo que ha preguntado: es el mismo bug de
  // "cargando" mostrándose en el sitio que ya ha terminado.
  if (total === 0) {
    return (
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-white">
          <Layers size={16} className="text-violet-400" />
          {pestana === 'hilos' ? 'Publicaciones' : 'Comentarios'}
        </h2>
        <p className="rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.02] px-4 py-8 text-center text-xs text-zinc-500">
          {pestana === 'hilos'
            ? 'Todavía no ha publicado ningún hilo.'
            : 'Todavía no ha escrito ningún comentario.'}
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      {/* ── Pestañas ──────────────────────────────────────
          Se desplazan en horizontal en móvil con
          `overflow-x-auto` y sin `flex-wrap`: envolverlas haría
          que la fila cambie de alto al cambiar de pestaña, que es
          justo lo que molesta en un móvil. */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex shrink-0 items-center gap-2 text-base font-bold text-white">
          <Layers size={16} className="text-violet-400" />
          {pestana === 'hilos' ? 'Publicaciones' : 'Comentarios'}
        </h2>

        <div
          role="tablist"
          className="flex gap-1 overflow-x-auto rounded-xl border border-white/[0.06] bg-white/[0.02] p-1"
        >
          {(
            [
              ['hilos', 'Publicaciones', hilos.length],
              ['comentarios', 'Comentarios', comentarios.length],
            ] as const
          ).map(([id, etiqueta, n]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={pestana === id}
              onClick={() => {
                setPestana(id);
                // Al cambiar de pestaña vuelve a la primera
                // página. Si no, se heredaría el "ver más" de la
                // otra y aparecerían cinco elementos sin haber
                // pedido ninguno.
                setCuantos(PASO_PERFIL);
              }}
              className={`chat-boton flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors ${
                pestana === id
                  ? 'bg-violet-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {etiqueta}
              <span className="font-mono opacity-70">{n}</span>
            </button>
          ))}
        </div>
      </div>

      <ul className="space-y-2">
        {pestana === 'hilos'
          ? hilos.slice(0, cuantos).map((h) => <FilaHilo key={h.id} hilo={h} onIrA={onIrA} />)
          : comentarios
              .slice(0, cuantos)
              .map((c) => (
                <FilaComentario key={c.id} comentario={c} datos={datos} onIrA={onIrA} />
              ))}
      </ul>

      {total > Math.min(cuantos, total) && (
        <button
          type="button"
          onClick={() => setCuantos((n) => n + PASO_PERFIL)}
          className="chat-boton w-full rounded-xl border border-white/[0.06] py-2 text-[11px] font-bold text-zinc-400 transition-colors hover:border-violet-400/40 hover:text-white"
        >
          Ver más ({total - Math.min(cuantos, total)} más)
        </button>
      )}
    </section>
  );
};

// ──────────────────────────────────────────────────────────
// FILAS
// ──────────────────────────────────────────────────────────

const FilaHilo: React.FC<{
  hilo: { id: string; title: string; categoryName?: string; createdAt: string; commentsCount?: number; reactionsTotal?: number; likesCount?: number; imageUrl?: string };
  onIrA?: (threadId: string) => void;
}> = ({ hilo, onIrA }) => (
  <li>
    <button
      type="button"
      onClick={() => onIrA?.(hilo.id)}
      disabled={!onIrA}
      className="chat-boton w-full rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-left transition-colors hover:border-violet-400/40 hover:bg-white/[0.05] disabled:cursor-default disabled:hover:border-white/[0.06]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-white">{hilo.title}</h3>
        {hilo.categoryName && (
          <span className="shrink-0 rounded-full border border-zinc-700/50 bg-zinc-800/80 px-2.5 py-0.5 text-[10px] font-medium text-violet-300">
            {hilo.categoryName}
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-zinc-500">
        <span>
          {new Date(hilo.createdAt).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
        <span className="flex items-center gap-1 font-mono font-semibold text-pink-400">
          <Heart size={11} className="fill-pink-500 text-pink-500" />
          {hilo.likesCount ?? 0}
        </span>
        <span className="flex items-center gap-1 font-mono">
          <MessageCircle size={11} />
          {hilo.commentsCount ?? 0}
        </span>
        {onIrA && (
          <span className="ml-auto flex items-center gap-1 font-semibold text-violet-400">
            Ver hilo
            <ArrowUpRight size={12} />
          </span>
        )}
      </div>
    </button>
  </li>
);

const FilaComentario: React.FC<{
  comentario: Comment;
  datos: PerfilDatos;
  onIrA?: (threadId: string, commentId?: string) => void;
}> = ({ comentario, datos, onIrA }) => {
  // El comentario es POLIMÓRFICO: puede estar en un hilo, en un
  // anime, un capítulo o un personaje (ver `Comment.targetType`).
  // Solo el feed sabe abrir un hilo con un comentario dentro, así
  // que los demás se muestran pero no se pueden pulsar.
  const enHilo = comentario.targetType === 'thread';
  const hilo = enHilo
    ? datos.threads.find((t) => t.id === comentario.targetId)
    : undefined;

  const cuerpo = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          <Reply size={11} className="flex-shrink-0" />
          <span className="truncate">
            {enHilo
              ? (hilo?.title ?? 'Hilo eliminado')
              : comentario.targetType === 'anime'
                ? 'En una serie'
                : comentario.targetType === 'episode'
                  ? 'En un capítulo'
                  : 'En un personaje'}
          </span>
        </span>
        <span className="shrink-0 text-[10px] text-zinc-500">
          {new Date(comentario.createdAt).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      </div>

      <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-zinc-300">
        {comentario.body}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-zinc-500">
        <span className="flex items-center gap-1 font-mono">
          <Heart size={11} />
          {comentario.likesCount ?? 0}
        </span>
        {(comentario.reactionsTotal ?? 0) > 0 && (
          <span className="font-mono">🔥 {formatearNumero(comentario.reactionsTotal ?? 0)}</span>
        )}
        {enHilo && onIrA && (
          <span className="ml-auto flex items-center gap-1 font-semibold text-violet-400">
            Ir al comentario
            <ArrowUpRight size={12} />
          </span>
        )}
      </div>
    </>
  );

  return (
    <li>
      {enHilo && onIrA ? (
        <button
          type="button"
          onClick={() => onIrA(comentario.targetId, comentario.id)}
          className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 text-left transition-colors hover:border-violet-500/40 hover:bg-zinc-950/80"
        >
          {cuerpo}
        </button>
      ) : (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 opacity-80">
          {cuerpo}
        </div>
      )}
    </li>
  );
};