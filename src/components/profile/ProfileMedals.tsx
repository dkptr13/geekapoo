import React, { useState } from 'react';
import { Trophy, Sparkles, ChevronDown, AlertCircle, X } from 'lucide-react';

import { MedalCard } from '../gamification/MedalCard';
import type { MedalStatus } from '../../types/gamification';

// ======================================================
// MEDALLAS DEL PERFIL
// ======================================================
//
// La vitrina de logros, con el MISMO `MedalCard` que usan la
// galería de la pestaña "Logros" y la ficha de cada serie.
// Reutilizar esa tarjeta es lo que hace que una medalla se vea
// IGUAL en los tres sitios: si se escribiera una segunda versión,
// un día cambiarían las tres por separado y nadie se acordaría de
// la cuarta.
//
// ── Qué se ve en cada caso ─────────────────────────────
//
//   · Perfil propio → todas las medallas con su barra de
//     progreso, la que lleva el título equipado marcada, el
//     botón de equipar y las cuatro más próximas. Es lo que
//     había en `ProgressionPanel`.
//
//   · Perfil de otra persona → solo las conseguidas, y sin
//     botones. Las pendientes de un desconocido son ruido, y
//     además son información sobre lo que él NO tiene, que no
//     es de lo que se ha venido a mirar.
//
// ── Por qué la sección no lleva borde ni fondo propio ─────
//
// Antes esta vitrina era una tarjeta más, con su marco y su
// sombra. En la página nueva el nivel vive en la cabecera y las
// cifras en las estadísticas, así que un bloque más con borde
// alrededor haría que el perfil pareciera una pila de cajas
// sueltas en lugar de una ficha. El encabezado de sección es lo
// único que separa: el contenido va directamente sobre el fondo.

/** Cuántas se ven sin pedir más. */
const TOPE = 8;

/** Cuántas "próximos logros" se enseñan. */
const PROXIMAS = 4;

export const ProfileMedals: React.FC<{
  /**
   * Catálogo con el estado de QUIEN SE ESTÁ MIRANDO.
   *
   * Lo resuelve quien lo monta, y no se calcula aquí, porque
   * depende de a quién siga el `ProgressionProvider`: en el perfil
   * propio sigue a la sesión y en el de otro hay un provider
   * anidado para esa persona. Si esto lo calculara por su cuenta,
   * leería el progreso equivocado en uno de los dos casos.
   */
  catalogo: MedalStatus[];

  /**
   * `true` en el perfil propio: muestra también las pendientes y
   * deja equipar el título.
   */
  propio: boolean;

  /**
   * Cambia el título equipado. Solo se pasa en el perfil propio;
   * sin él, `MedalCard` no pinta los botones de equipar.
   */
  onEquipar?: (medalId: string | null) => void;

  /** Id del título que lleva puesto, para marcar la tarjeta. */
  equipado?: string | null;

  /**
   * Aviso de que la gamificación sigue apagada.
   *
   * Se ve mientras `gamification/config` tenga `activo: false`,
   * que es lo que pasa si las Cloud Functions no están
   * desplegadas. Sin el aviso, alguien publica un hilo, no le
   * sube nada, y lo primero que va a pensar es que está roto.
   */
  avisoDesactivada?: boolean;
}> = ({ catalogo, propio, onEquipar, equipado, avisoDesactivada }) => {
  const [todas, setTodas] = useState(false);

  // En el propio, el catálogo entero (las pendientes ya traen su
  // barra de progreso). En el de otro, solo las conseguidas.
  const visibles = propio ? catalogo : catalogo.filter((c) => c.desbloqueada);
  const conseguidas = visibles.filter((c) => c.desbloqueada).length;

  // En el propio el contador dice "3 de 20": cuántas hay y cuántas
  // hay en total, que es lo que hace que la vitrina parezca una
  // meta y no una lista de premios. En el de otro, solo el número.
  const contador = propio ? `${conseguidas} de ${visibles.length}` : String(conseguidas);

  // Solo tiene sentido "ver más" si de verdad hay más: con ocho
  // o menos medallas, un botón que abre y cierra la misma lista
  // es ruido.
  const aPintar = todas ? visibles : visibles.slice(0, TOPE);

  // Las cuatro más próximas van por progreso y solo en el perfil
  // propio: son el siguiente objetivo personal, no información
  // sobre otra persona.
  const pendientes = propio
    ? catalogo
        .filter((c) => !c.desbloqueada)
        .sort((a, b) => b.progreso - a.progreso)
        .slice(0, PROXIMAS)
    : [];

  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-base font-bold text-white">
        <Trophy size={16} className="text-amber-400" />
        Medallas
        <span className="font-mono text-xs font-normal text-zinc-500">{contador}</span>
      </h2>

      {avisoDesactivada && (
        <p className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-[11px] leading-relaxed text-amber-300">
          <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
          <span>
            El sistema de experiencia todavía no está activo. Nadie está ganando XP
            hasta que se desplieguen las funciones del servidor y se active desde el
            panel de administración.
          </span>
        </p>
      )}

      {/* ── Título equipado ────────────────────────────
          Solo en el perfil propio y solo si hay uno. Va
          encima de las medallas porque el título sale de una
          medalla: es la primera pregunta ("¿qué es?") antes de
          la lista entera.

          El botón de quitar es de un clic, a propósito: es lo
          más frecuente que se hace con un título, y abrir el
          editor para ello sería un rodeo. */}
      {propio && equipado && onEquipar && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
          <Sparkles size={15} className="flex-shrink-0 text-amber-400" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Tu título
            </p>
            <p className="truncate text-sm font-bold text-white">
              {catalogo.find((c) => c.medal.id === equipado)?.medal.titulo ??
                catalogo.find((c) => c.medal.id === equipado)?.medal.nombre ??
                'Sin título equipado'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onEquipar(null)}
            aria-label="Quitar el título"
            className="flex flex-shrink-0 items-center gap-1 rounded-lg border border-zinc-700 px-2.5 py-1.5 text-[11px] font-bold text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white"
          >
            <X size={11} />
            Quitar
          </button>
        </div>
      )}

      {visibles.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 px-4 py-8 text-center text-xs text-zinc-500">
          {propio
            ? 'Todavía no has desbloqueado ninguna medalla. Publica un hilo o un comentario para empezar.'
            : 'Todavía no ha desbloqueado ninguna medalla.'}
        </p>
      ) : (
        <>
          {/* `sm:grid-cols-2` y no más: la tarjeta lleva icono de
              48px más nombre, descripción y barra, y a tres
              columnas en un portátil el texto se parte en cuatro
              líneas. */}
          <div className="grid gap-3 sm:grid-cols-2">
            {aPintar.map((estado) => (
              <MedalCard
                key={estado.medal.id}
                estado={estado}
                equipping={equipado === estado.medal.id}
                onEquipar={onEquipar}
              />
            ))}
          </div>

          {visibles.length > TOPE && (
            <button
              type="button"
              onClick={() => setTodas((v) => !v)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-zinc-800 py-2 text-[11px] font-bold text-zinc-400 transition-colors hover:border-amber-500/40 hover:text-white"
            >
              {!todas ? (
                <>
                  <ChevronDown size={13} />
                  Ver todas ({visibles.length - TOPE} más)
                </>
              ) : (
                'Ver menos'
              )}
            </button>
          )}
        </>
      )}

      {/* ── Próximos logros ───────────────────────────────
          Solo si quedan medallas y solo en el perfil propio.
          El catálogo entero con filtro por rareza está en la
          pestaña "Logros"; aquí van las cuatro que están más
          cerca, que es lo que sirve para decidir la siguiente
          cosa que hacer. */}
      {pendientes.length > 0 && (
        <div className="space-y-3 pt-1">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            Próximos logros
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {pendientes.map((estado) => (
              <MedalCard key={estado.medal.id} estado={estado} compacto />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};