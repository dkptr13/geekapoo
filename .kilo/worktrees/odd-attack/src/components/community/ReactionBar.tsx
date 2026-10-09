import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FC } from 'react';
import { ChevronDown, SmilePlus } from 'lucide-react';

import {
  DESTACADAS,
  REACCIONES_VACIAS,
  REACTION_META,
  topReacciones,
  totalReacciones,
  votos,
  type ReaccionesDeObjetivo,
} from '../../services/reactions';
import { EmojiPicker } from './EmojiPicker';
import type { ReactionTargetType, ReactionType } from '../../types';

// ======================================================
// BARRA DE REACCIONES
// ======================================================
//
// Va debajo de los hilos, de los comentarios y de las
// respuestas. Es el MISMO componente en los tres sitios: lo que
// se reacciona y cómo se comporta no puede cambiar según dónde
// esté puesto.
//
// Dos partes:
//
//   1. Los CONTADORES. Solo salen las reacciones que alguien ha
//      usado, y la del usuario va marcada con el color de su
//      reaction_type y con el borde. Se puede pulsar: si es la
//      suya, se quita; si es otra, se cambia a esa.
//
//   2. El SELECTOR, detrás del botón de la cara. Es un panel
//      pequeño con las cinco reacciones y, al lado de cada una,
//      cuántos usuarios la han usado. Poner el número AHÍ, y no
//      solo en los contadores, es lo que hace que en el móvil
//      no haya que depender de pasar el ratón por encima.
//
// El botón de la cara abre y cierra con el mismo gesto, y el
// panel se cierra solo si se pulsa fuera, si se pulsa Escape o
// al elegir (que es lo que espera cualquiera en un móvil).
//
// No pide sesión aquí: eso lo hace quien lo llama
// (`CommunityContext.toggleReaction`), que además avisa de que
// hace falta iniciar sesión.

interface ReactionBarProps {
  targetType: ReactionTargetType;
  targetId: string;
  /**
   * Recuentos y nombres de este contenido.
   *
   * OPCIONAL a propósito: los recuentos llegan en un mapa que solo
   * tiene los objetivos que alguien ya reaccionó, así que en un
   * contenido sin reacciones esto es `undefined` y, si se leyera
   * sin comprobar, reventaría la página entera. Aquí se resuelve
   * a una barra vacía.
   */
  datos?: ReaccionesDeObjetivo;
  /** La reacción que tiene puesta quien mira, si tiene alguna. */
  mia: ReactionType | undefined;
  onElegir: (tipo: ReactionType) => void;
  /** Versión pequeña, para las respuestas anidadas. */
  compacta?: boolean;
}

/** Ancho del panel. Se usa también para no salirse por la derecha. */
const ANCHO_PANEL = 210;

/** Ancho cuando está abierto el catálogo completo de emojis. */
const ANCHO_COMPLETO = 300;

export const ReactionBar: FC<ReactionBarProps> = ({
  targetType,
  targetId,
  datos,
  mia,
  onElegir,
  compacta = false,
}) => {
  const [abierto, setAbierto] = useState(false);
  const [todos, setTodos] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);

  // Contenido sin reacciones = barra vacía. Se resuelve aquí y no
  // en los tres sitios que llaman a este componente, que es donde
  // se colaría el mismo fallo otra vez.
  const info = datos ?? REACCIONES_VACIAS;

  // Dónde va el panel.
  //
  // Con `position: absolute` se recortaba contra la barra
  // lateral, que tiene scroll propio: si el botón caía cerca del
  // borde, el panel salía cortado sin poder verse. Con `fixed` y
  // estas coordenadas no hay ningún sitio donde se esconda.
  const [pos, setPos] = useState<{ left: number; bottom: number } | null>(null);

  const medir = useCallback(() => {
    const rect = boton.current?.getBoundingClientRect();
    if (!rect) return;

    const margen = 8;

    setPos({
      // Pegado a la izquierda del botón, pero sin salirse por la
      // derecha en pantallas estrechas.
      left: Math.max(margen, Math.min(rect.left, window.innerWidth - ANCHO_PANEL - margen)),
      // Encima del botón: su borde superior es el suelo del
      // panel, más un pequeño hueco.
      bottom: Math.max(margen, window.innerHeight - rect.top + margen),
    });
  }, []);

  // Cierra al pulsar fuera o al pulsar Escape. Con un `mousedown`
  // y no con `click`, porque si no, el clic que abre el panel
  // (que también es un click) lo cerraría en el mismo instante.
  useEffect(() => {
    if (!abierto) return;

    medir();

    const fuera = (e: MouseEvent | TouchEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) setAbierto(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    // Con el scroll, el panel se quedaría pegado a la ventana si
    // no se recalcula: se recalcula.
    const mover = () => medir();

    document.addEventListener('mousedown', fuera);
    document.addEventListener('touchstart', fuera);
    document.addEventListener('keydown', escape);
    window.addEventListener('scroll', mover, true);
    window.addEventListener('resize', mover);

    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('touchstart', fuera);
      document.removeEventListener('keydown', escape);
      window.removeEventListener('scroll', mover, true);
      window.removeEventListener('resize', mover);
    };
  }, [abierto, medir]);

  // Las pastillas que se pintan son las TRES MÁS PUESTAS, no las
  // cinco primeras del catálogo: lo que interesa de una reacción es
  // la que más gente comparte. `topReacciones` también se encarga
  // de descartar las claves que no están en el catálogo (puede haber
  // documentos viejos) y de desempatar por orden de catálogo, para
  // que dos reacciones empatadas no cambien de sitio solas.
  //
  // Con cuatro o más tipos distintos, el resto NO se pierde: se
  // esconde detrás de la pastilla "+N", que abre el catálogo
  // completo con los contadores de cada uno.
  const usados = useMemo(
    () => topReacciones(info.counts),
    [info.counts],
  );
  const ocultos = useMemo(
    () => Math.max(0, totalReacciones(info.counts) - usados.length),
    [info.counts, usados.length],
  );

  const metaMia = mia ? REACTION_META[mia] : null;

  const elegir = (tipo: ReactionType) => {
    onElegir(tipo);
    setAbierto(false);
    setTodos(false);
  };

  // Abrir el catálogo entero. Se mide la posición al abrir, que es
  // lo que hace el efecto de `abierto`.
  const abrirTodos = () => {
    setTodos(true);
    setAbierto(true);
  };

  // El id no hace falta para nada más, pero deja ver en las
  // herramientas de desarrollo a qué contenido pertenece cada
  // barra cuando hay muchas en pantalla.
  const etiqueta = `reacciones-${targetType}-${targetId}`;

  return (
    <div
      ref={contenedor}
      id={etiqueta}
      className={`relative flex flex-wrap items-center gap-1.5 ${compacta ? 'text-[11px]' : 'text-xs'}`}
    >
      {/* ── Contadores de lo que ya se ha usado ───────── */}
      {usados.map((tipo) => {
        const meta = REACTION_META[tipo];
        const n = info.counts[tipo] ?? 0;
        const esMia = mia === tipo;
        const quienes = info.nombres[tipo] ?? [];

        return (
          <button
            key={tipo}
            type="button"
            onClick={() => elegir(tipo)}
            // El `title` con los nombres es el "hover" del
            // escritorio. En el móvil no hace falta: el selector
            // ya enseña el número, y los nombres van en el propio
            // botón.
            title={
              quienes.length > 0
                ? `${meta.label} · ${votos(n)}: ${quienes.slice(0, 8).join(', ')}${
                    quienes.length > 8 ? '...' : ''
                  }`
                : `${meta.label} · ${votos(n)}`
            }
            aria-label={`${meta.label}, ${votos(n)}`}
            aria-pressed={esMia}
            className={`group inline-flex items-center gap-1 rounded-full border px-2 py-1 font-semibold transition-all duration-150 active:scale-95 ${
              esMia
                ? meta.activa
                : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700 hover:text-white'
            }`}
          >
            <span
              className={`text-[13px] leading-none transition-transform duration-150 ${
                esMia ? 'scale-110' : 'group-hover:scale-110'
              }`}
            >
              {meta.emoji}
            </span>
            <span className={`font-mono ${esMia ? meta.texto : 'text-zinc-400'}`}>{n}</span>
          </button>
        );
      })}

      {/* "+N": hay más reacciones de las que caben en tres
          pastillas. Se enseña cuántas son, para que nadie piense
          que se han perdido, y al pulsarlo se abre el catálogo
          entero con el número de cada una. */}
      {ocultos > 0 && (
        <button
          type="button"
          onClick={abrirTodos}
          title={`Ver las ${votos(totalReacciones(info.counts))} reacciones`}
          aria-label={`Ver ${ocultos} reacciones más`}
          className="inline-flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-950/60 px-2 py-1 font-mono text-[11px] font-semibold text-zinc-400 transition-all duration-150 hover:border-violet-500/60 hover:text-violet-300 active:scale-95"
        >
          +{ocultos}
        </button>
      )}

      {/* ── Botón que abre el selector ──────────────────
          Con una reacción ya puesta, el botón enseña SU emoji y
          no el icono genérico: es lo que confirma de un vistazo
          que ya has reaccionado y a qué, y de paso ocupa menos
          sitio en la barra. Sin reacción, el icono y la palabra
          "Reaccionar" de siempre, que es lo que invita a
          probarlo. */}
      <button
        ref={boton}
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-haspopup="true"
        aria-label={metaMia ? `Cambiar tu reacción (${metaMia.label})` : 'Reaccionar'}
        title={metaMia ? `Cambiar tu reacción (${metaMia.label})` : 'Reaccionar'}
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 font-semibold transition-all duration-150 active:scale-95 ${
          metaMia
            ? metaMia.activa
            : 'border-dashed border-zinc-800 bg-zinc-950/40 text-zinc-500 hover:border-violet-500/60 hover:text-violet-300'
        }`}
      >
        {metaMia ? (
          <>
            <span className="text-[15px] leading-none">{metaMia.emoji}</span>
            {!compacta && <span className="hidden sm:inline">Cambiar</span>}
          </>
        ) : (
          <>
            <SmilePlus size={compacta ? 12 : 14} />
            {!compacta && <span className="hidden sm:inline">Reaccionar</span>}
          </>
        )}
      </button>

      {/* ── El panel de reacciones ─────────────────────
          Dos pasos, y a propósito. Primero las CINCO
          destacadas, que se eligen con un clic; y debajo, un
          botón para abrir el catálogo entero con buscador.

          Poner doscientos emojis en la primera pantalla
          convertiría el botón de "reaccionar" en un muro: la
          gente no reacciona si tiene que buscar. Con los cinco
          de siempre delante y el resto a un clic, se sigue
          usando lo que se usa y además se puede usar todo. */}
      {abierto && pos && (
        <div
          className="geo-pop-in-arriba fixed z-[90] flex flex-col gap-1.5 rounded-2xl border border-violet-500/30 bg-zinc-900/95 p-2 shadow-2xl shadow-violet-950/60 backdrop-blur"
          style={{
            left: pos.left,
            bottom: pos.bottom,
            width: todos ? `min(${ANCHO_COMPLETO}px, calc(100vw - 16px))` : `min(${ANCHO_PANEL}px, calc(100vw - 16px))`,
          }}
          role="menu"
        >
          {todos ? (
            <>
              <div className="flex items-center justify-between gap-2 px-1 pb-1">
                <span className="text-[11px] font-bold text-violet-300">
                  Todos los emojis
                </span>
                <button
                  type="button"
                  onClick={() => setTodos(false)}
                  className="inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-[10px] text-zinc-400 hover:bg-zinc-800 hover:text-white"
                >
                  <ChevronDown size={11} />
                  Las de siempre
                </button>
              </div>
              <EmojiPicker
                seleccionado={mia ?? null}
                onElegir={(e) => elegir(e.key)}
                counts={info.counts}
              />
            </>
          ) : (
            <>
              {DESTACADAS.map((tipo) => {
                const meta = REACTION_META[tipo];
                const n = info.counts[tipo] ?? 0;
                const esMia = mia === tipo;

                return (
                  <button
                    key={tipo}
                    type="button"
                    role="menuitem"
                    onClick={() => elegir(tipo)}
                    title={`${meta.label}${n > 0 ? ` · ${votos(n)}` : ''}`}
                    className={`flex min-w-0 items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-all duration-150 active:scale-[0.97] ${
                      esMia ? meta.activa : 'hover:bg-violet-500/10'
                    }`}
                  >
                    {/* Emoji dentro de un círculo de 32 px:
                        grande para apuntar con el dedo sin fallar. */}
                    <span
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-base transition-transform duration-150 ${
                        esMia ? 'scale-110' : ''
                      } ${esMia ? `${meta.anillo} ring-2` : 'bg-zinc-800/70'}`}
                    >
                      {meta.emoji}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span
                        className={`truncate text-[11px] font-semibold ${
                          esMia ? meta.texto : 'text-zinc-300'
                        }`}
                      >
                        {meta.label}
                      </span>
                      <span className="font-mono text-[10px] text-zinc-500">
                        {n > 0 ? votos(n) : 'sin usar'}
                      </span>
                    </span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setTodos(true)}
                className="mt-0.5 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-700 px-2 py-1.5 text-[11px] font-semibold text-zinc-400 transition-colors hover:border-violet-500/60 hover:text-violet-300"
              >
                <SmilePlus size={12} />
                Todos los emojis
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
