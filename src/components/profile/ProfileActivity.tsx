import React, { useMemo, useState } from 'react';
import { Sparkles, MessageCircle, Trophy, Star, ChevronDown } from 'lucide-react';

import { tiempoRelativo } from '../../utils/notificaciones';
import { lineaDeTiempo } from '../../utils/profile';
import { PASO_PERFIL, type PerfilDatos } from '../../types/profile';

// ======================================================
// ACTIVIDAD RECIENTE
// ======================================================
//
// La línea de tiempo del perfil. Se DERIVA de los hilos, los
// comentarios, las medallas y la última subida de nivel: no hay
// ninguna colección nueva ni ninguna escritura (ver el comentario
// largo de `lineaDeTiempo` en `utils/profile.ts`).
//
// ── Por qué NO se pinta un "hace 2 días" inventado ───────
//
// Se podría rellenar el hueco de la subida de nivel con datos
// aproximados a partir de la curva de XP, y quedaría una línea de
// tiempo muy completa. Sería mentira: un usuario que subió del
// nivel 10 al 18 de golpe tiene UNA fecha guardada
// (`lastLevelUpAt`), no nueve. Fabricar las otras ocho sería
// enseñar a alguien una historia de su cuenta que no ocurrió.

/** Icono y color por tipo de hito. */
const ESTILO: Record<
  string,
  { icono: React.ReactNode; clase: string; etiqueta: string }
> = {
  thread: {
    icono: <MessageCircle size={12} />,
    clase: 'border-white/[0.06] bg-white/[0.02] text-zinc-400',
    etiqueta: 'Publicación',
  },
  comment: {
    icono: <MessageCircle size={12} />,
    clase: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
    etiqueta: 'Comentario',
  },
  medal: {
    icono: <Trophy size={12} />,
    clase: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    etiqueta: 'Medalla',
  },
  level: {
    icono: <Star size={12} />,
    clase: 'border-violet-500/40 bg-violet-500/10 text-violet-300',
    etiqueta: 'Nivel',
  },
};

export const ProfileActivity: React.FC<{
  datos: PerfilDatos;
  /** Lleva al hilo y opcionalmente a un comentario. */
  onIrA?: (threadId: string, commentId?: string) => void;
}> = ({ datos, onIrA }) => {
  const [cuantos, setCuantos] = useState(PASO_PERFIL);

  // Se calcula SIN límite y se recorta al pintar. Al revés sería
  // un bug esperando: `cuantos` no entraría en el cálculo, así
  // que al pulsar "ver más" la línea no cambiaría.
  const todos = useMemo(() => lineaDeTiempo(datos), [datos]);
  const visibles = todos.slice(0, cuantos);

  if (todos.length === 0) {
    return (
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-white">
          <Sparkles size={16} className="text-violet-400" />
          Actividad reciente
        </h2>
        <p className="rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.02] px-4 py-8 text-center text-xs text-zinc-500">
          Todavía no hay actividad pública que enseñar.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-base font-bold text-white">
        <Sparkles size={16} className="text-violet-400" />
        Actividad reciente
      </h2>

      {/*
        Una lista, no una línea vertical con un círculo por fila.

        La línea vertical es más bonita pero en móvil (donde el
        texto se parte en tres líneas) el círculo se queda desalineado
        del principio de su propia fila, y parece un error. Con la
        fila centrada al principio queda bien a los dos anchos.
      */}
      <ul className="space-y-1.5">
        {visibles.map((e) => {
          const estilo = ESTILO[e.tipo] ?? ESTILO.comment;

          const contenido = (
            <>
              <span
                className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg border ${estilo.clase}`}
              >
                {estilo.icono}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-xs text-zinc-200">
                  {e.texto}
                  {e.detalle && (
                    <span className="ml-1 text-zinc-400">— {recortar(e.detalle, 70)}</span>
                  )}
                </span>
                <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-zinc-500">
                  <span>{estilo.etiqueta}</span>
                  <span aria-hidden="true">·</span>
                  <span>{tiempoRelativo(e.at)}</span>
                </span>
              </span>
            </>
          );

          return (
            <li
              key={e.id}
              className="flex items-start gap-2.5 rounded-xl border border-zinc-800/70 bg-zinc-950/40 p-2.5"
            >
              {/*
                Solo los hitos que llevan a alguna parte son
                botón. Un premio no lleva a nada, y una fila que
                parece pulsable y no lo es enseña mal cómo funciona
                la web.
              */}
              {e.irA && onIrA ? (
                <button
                  type="button"
                  onClick={() => onIrA(e.irA!.threadId, e.irA!.commentId)}
                  className="chat-boton flex min-w-0 flex-1 items-start gap-2.5 text-left transition-colors hover:text-white"
                  title={e.detalle ? e.detalle : e.texto}
                >
                  {contenido}
                </button>
              ) : (
                <div className="flex min-w-0 flex-1 items-start gap-2.5">{contenido}</div>
              )}
            </li>
          );
        })}
      </ul>

      {todos.length > visibles.length && (
        <button
          type="button"
          onClick={() => setCuantos((n) => n + PASO_PERFIL)}
            className="chat-boton flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/[0.06] py-2 text-[11px] font-bold text-zinc-400 transition-colors hover:border-violet-400/40 hover:text-white"
        >
          <ChevronDown size={13} />
          Ver más ({todos.length - visibles.length} más)
        </button>
      )}
    </section>
  );
};

/**
 * Recorta un texto para una línea.
 *
 * Se hace aquí y no con `recorte` de `utils/notificaciones`, que
 * está pensado para el `snippet` de un aviso (que se pinta en dos
 * líneas y lleva puntos suspensivos). Aquí es una sola línea en
 * una lista, y 70 caracteres es lo que entra sin que el resto de
 * la fila se descentre.
 */
function recortar(texto: string, max: number): string {
  const limpio = texto.replace(/\s+/g, ' ').trim();
  return limpio.length <= max ? limpio : `${limpio.slice(0, max - 1).trimEnd()}…`;
}