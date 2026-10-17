import React from 'react';
import { Heart, MessageCircle, Pin, ArrowUpRight } from 'lucide-react';

import type { Thread } from '../../types';

// ======================================================
// PUBLICACIONES DESTACADAS
// ======================================================
//
// Los hilos que el dueño fijó en su perfil, en el orden que
// eligió. No hay lectura nueva: los hilos ya están en memoria
// (`CommunityContext`) y aquí solo se filtran por id.
//
// Si un hilo fijado ya no existe (lo borró el equipo), se salta
// en silencio: pintar "hilo eliminado" en la vitrina de alguien
// sería ruido.

export const ProfileFeatured: React.FC<{
  /** Hilos del dueño, YA en el orden de `featuredPostIds`. */
  hilos: Thread[];
  /** Abre un hilo en el feed. */
  onIrA?: (threadId: string) => void;
}> = ({ hilos, onIrA }) => {
  if (hilos.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-base font-bold text-white">
        <Pin size={16} className="text-violet-400" />
        Destacadas
        <span className="font-mono text-xs font-normal text-zinc-500">{hilos.length}</span>
      </h2>

      <ul className="space-y-3">
        {hilos.map((hilo) => (
          <li key={hilo.id}>
            <button
              type="button"
              onClick={() => onIrA?.(hilo.id)}
              disabled={!onIrA}
              title="Abrir este hilo en el feed"
              className="chat-boton w-full rounded-2xl border border-violet-400/20 bg-white/[0.02] p-4 text-left transition-colors hover:border-violet-400/40 hover:bg-white/[0.05] disabled:cursor-default"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-bold text-white">{hilo.title}</span>
                <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-medium text-violet-200">
                  {hilo.categoryName}
                </span>
              </div>
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-zinc-400">
                {hilo.body}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-4 text-[11px] text-zinc-500">
                <span className="flex items-center gap-1 font-mono font-semibold text-pink-400">
                  <Heart size={11} className="fill-pink-500 text-pink-500" />
                  {hilo.likesCount}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle size={11} />
                  {hilo.commentsCount}
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
        ))}
      </ul>
    </section>
  );
};
