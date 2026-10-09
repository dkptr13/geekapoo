import { useCallback, useEffect, useRef, useState } from 'react';
import type { FC, PointerEvent as ReactPointerEvent } from 'react';
import { Loader2, Maximize2, RotateCcw, X, Check, Crop, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

import {
  PROPORCIONES,
  ZOOM_MAXIMO,
  ZOOM_MINIMO,
  ajustesIniciales,
  clasificarProporcion,
  descripcionProporcion,
  desplazarEncuadre,
  limitarDesplazamiento,
  limitarZoom,
  type ImageCropSettings,
  type MedidasArrastre,
} from '../../services/imageCrop';

import { cargarImagen, pintarEncuadre, recortarImagen } from '../../services/imageCanvas';

// ======================================================
// EL EDITOR DE RECORTE
// ======================================================
//
// Aparece cuando alguien elige una imagen para su avatar o para una
// portada, ANTES de subirla. Desde ahí se puede mover y ampliar, y se
// ve exactamente lo que va a quedar.
//
// ── POR QUÉ UN CANVAS Y NO CSS ─────────────────────────────────────
//
// Porque con CSS, recortar es poner `object-fit: cover` y, como mucho,
// elegir con `object-position` entre nueve puntos. Eso no deja mover la
// imagen un píxel, y no deja ampliar. El resultado son la mitad de los
// problemas de este encargo: una vertical metida en un cuadrado que se
// come la cabeza, o una panorámica metida en una franja que se queda en
// medio.
//
// Con un canvas se elige el rectángulo y se dibuja lo que hay dentro.
// Es la misma operación que hace el móvil al recortar, y el resultado
// se guarda YA recortado, así que en la web solo hay que pintarlo.
//
// ── POR QUÉ EL AJUSTE ES NORMALIZADO Y NO EN PÍXELES ───────────────
//
// El encuadre se guarda como cuatro números (proporción, zoom y dos
// desplazamientos de 0 a 1), no como coordenadas. Así el mismo recorte
// vale para la vista previa, que es pequeña, y para el resultado, que
// es grande; y se puede volver a abrir meses después aunque la imagen
// se vea en otro sitio a otro tamaño. Ver `services/imageCrop.ts`.
//
// ── LOS BOTONES ────────────────────────────────────────────────────
//
//   · Centrar     devuelve a 0.5 / 0.5 sin tocar el zoom. Es lo que
//                  quiere la mayoría de las veces, y con el zoom
//                  puesto ya no es el botón de "deshacer".
//   · Restablecer vuelve al punto de partida: sin ampliar y centrado.
//                  Se usa cuando se ha movido sin querer.
//
// ── EL ZOOM DE UN MÍNIMO ───────────────────────────────────────────
//
// El 1 no es "sin zoom": es la imagen JUSTA, la más pequeña que
// todavía tapa la caja. Si se dejara bajar de ahí se vería el fondo del
// editor, que es justo el defecto que se quiere evitar. Por eso el
// mínimo del deslizador es 1 y no 0.
//
// ── RATÓN Y DEDO, CON LO MISMO ─────────────────────────────────────
//
// Se usa la API de punteros y no los eventos de ratón ni los de
// contacto por separado. `touch-action: none` en la caja es lo que
// hace que en el móvil el dedo arrastre la imagen en vez de subir la
// página, y `setPointerCapture` es lo que hace que el arrastre siga
// funcionando aunque el dedo se salga de la caja por un momento.

interface CropEditorProps {
  /** El fichero que el usuario acaba de elegir. */
  file: File;
  /** Proporción de la caja: 1 para un avatar, 16/9 para una portada. */
  aspectRatio: number;
  /** Encuadre anterior, para reabrir donde estaba. */
  initial?: ImageCropSettings;
  /**
   * Cómo se enseña la vista previa.
   *
   * 'circular' es para avatares, que se ven redondos casi en todas
   * partes. Mostrar la caja cuadrada mientras se recorta y luego
   * enseñar un círculo es el momento en que la gente se da cuenta de
   * que ha elegido mal, y es mejor que se lo vea antes.
   */
  forma?: 'circular' | 'rectangular';
  /** Lado mayor del resultado, en píxeles. */
  maximo?: number;
  titulo?: string;
  onCancelar: () => void;
  onGuardar: (fichero: File, ajustes: ImageCropSettings) => Promise<void> | void;
}

/** El tamaño en píxeles de la caja de recorte en la pantalla. */
const ANCHO_CAJA = 420;

export const CropEditor: FC<CropEditorProps> = ({
  file,
  aspectRatio,
  initial,
  forma = 'rectangular',
  maximo = 1200,
  titulo,
  onCancelar,
  onGuardar,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cajaRef = useRef<HTMLDivElement | null>(null);

  const [imagen, setImagen] = useState<HTMLImageElement | null>(null);
  const [ajustes, setAjustes] = useState<ImageCropSettings>(() =>
    initial ?? ajustesIniciales(aspectRatio),
  );
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // El ancho y alto en píxeles reales del canvas. Se guardan aparte de
  // la caja porque el canvas se pinta a resolución propia para que se
  // vea nítido en pantallas grandes, y no puede ser `w-full h-full`
  // sobre un tamaño que se calcula en píxeles.
  const [tamano, setTamano] = useState({ ancho: 0, alto: 0 });

  // ── Cargar la imagen ───────────────────────────────────────────
  useEffect(() => {
    let vivo = true;

    setCargando(true);
    setError(null);

    cargarImagen(file)
      .then((img) => {
        if (!vivo) return;
        setImagen(img);
        setCargando(false);
      })
      .catch((e: unknown) => {
        if (!vivo) return;
        setCargando(false);
        setError(e instanceof Error ? e.message : 'No se ha podido abrir la imagen.');
      });

    return () => {
      vivo = false;
    };
  }, [file]);

  // ── Ajustar el tamaño del canvas a la proporción pedida ────────
  useEffect(() => {
    const ancho = ANCHO_CAJA;
    const alto = Math.round(ANCHO_CAJA / aspectRatio);

    setTamano({ ancho, alto });
  }, [aspectRatio]);

  // ── Pintar ─────────────────────────────────────────────────────
  //
  // Va en un efecto y no en el manejador de eventos porque los ajustes
  // cambian desde tres sitios: el arrastre, el deslizador y los
  // botones. Si se pintara en cada uno habría tres copias de lo mismo.
  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || !imagen || tamano.ancho <= 0) return;

    canvas.width = tamano.ancho;
    canvas.height = tamano.alto;

    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    pintarEncuadre(
      ctx,
      imagen,
      imagen.naturalWidth,
      imagen.naturalHeight,
      tamano.ancho,
      tamano.alto,
      ajustes,
    );
  }, [imagen, ajustes, tamano]);

  // Si hay algo cargando o guardando, nada se puede tocar: ni el
  // arrastre, ni las flechas, ni los botones. Va aquí arriba porque
  // los manejadores de más abajo lo leen.
  const ocupado = cargando || guardando;

  // ── El arrastre ────────────────────────────────────────────────
  //
  // El desplazamiento se guarda normalizado, así que un píxel de
  // pantalla se traduce a una fracción del recorrido disponible. Si
  // el recorrido es cero (no hay nada que mover en ese eje) el valor
  // no se toca, y por eso no hay que comprobarlo antes.
  //
  // ── POR QUÉ EL ORIGEN AVANZA EN CADA EVENTO ──────────────────────
  //
  // Antes el origen se fijaba al empezar (`pointerdown`) y cada evento
  // restaba el desplazamiento DESDE EL INICIO al estado actual, que ya
  // incluía los eventos anteriores. El movimiento se contaba dos
  // veces y la imagen corría más que el dedo, acelerando cuanto más
  // se arrastraba: por eso el arrastre se sentía tosco y sin
  // precisión. Ahora cada evento solo aporta lo movido desde el
  // anterior, y la imagen sigue al dedo uno a uno.
  //
  // ── MAYÚS PARA PRECISIÓN ─────────────────────────────────────────
  //
  // Con Mayús pulsada el movimiento va a la décima parte. Es para
  // colocar la cara al píxel sin pelearse con el dedo, y no necesita
  // ningún botón más en un modal que ya va lleno.
  const arrastrando = useRef<{ x: number; y: number } | null>(null);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!imagen || ocupado) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    arrastrando.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const desde = arrastrando.current;

    if (!desde || !imagen || tamano.ancho <= 0) return;

    const dxPantalla = e.clientX - desde.x;
    const dyPantalla = e.clientY - desde.y;

    if (dxPantalla === 0 && dyPantalla === 0) return;

    // El origen avanza: lo de este evento ya está contado al salir.
    arrastrando.current = { x: e.clientX, y: e.clientY };

    // Los eventos vienen en píxeles de pantalla y el recorrido en
    // píxeles del canvas. Solo coinciden si la caja se enseña a su
    // tamaño real; en un móvil estrecho la caja encoge y sin esta
    // escala la imagen correría más que el dedo.
    const rect = e.currentTarget.getBoundingClientRect();
    const escala = rect.width > 0 ? tamano.ancho / rect.width : 1;

    const paso = e.shiftKey ? 0.1 : 1;
    const dx = dxPantalla * escala * paso;
    const dy = dyPantalla * escala * paso;

    // El recorrido se calcula con el estado ACTUAL, dentro del
    // actualizador: el `ajustes` del cierre puede ir por detrás si
    // los eventos llegan más rápido que los repintados.
    const medidas: MedidasArrastre = {
      fuenteAncho: imagen.naturalWidth,
      fuenteAlto: imagen.naturalHeight,
      cajaAncho: tamano.ancho,
      cajaAlto: tamano.alto,
    };

    // El signo va invertido porque el desplazamiento va hacia el lado
    // contrario al dedo: si tiras de la foto hacia la derecha, lo que
    // se ve es lo que había a la derecha.
    setAjustes((prev) => desplazarEncuadre(prev, dx, dy, medidas));
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    arrastrando.current = null;

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  // ── Ajuste fino ────────────────────────────────────────────────
  //
  // El dedo, ni siquiera con Mayús, coloca al píxel: un milímetro de
  // pantalla son varios pasos normalizados. Por eso hay tres niveles:
  //
  //   · Botones: 0.02 por pulsación (2% del recorrido).
  //   · Flechas del teclado: 0.01, y 0.05 con Mayús.
  //   · Arrastre con Mayús: décima parte de velocidad.
  //
  // Van en pasos normalizados y no en píxeles a propósito: el mismo
  // paso vale para la vista previa pequeña y para el recorte final
  // grande, igual que el resto del encuadre.
  const PASO_BOTON = 0.02;
  const PASO_TECLA = 0.01;
  const PASO_TECLA_RAPIDO = 0.05;

  const mover = useCallback(
    (dx: number, dy: number) => {
      if (!imagen || ocupado) return;

      setAjustes((prev) => ({
        ...prev,
        x: limitarDesplazamiento(prev.x + dx),
        y: limitarDesplazamiento(prev.y + dy),
      }));
    },
    [imagen, ocupado],
  );

  const onTecla = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!imagen || ocupado) return;

    const paso = e.shiftKey ? PASO_TECLA_RAPIDO : PASO_TECLA;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      mover(paso, 0);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      mover(-paso, 0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      mover(0, paso);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      mover(0, -paso);
    }
  };
  // ── Rueda del ratón, como atajo del zoom ───────────────────────
  const onWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    setAjustes((prev) => ({
      ...prev,
      zoom: limitarZoom(prev.zoom + (e.deltaY < 0 ? 0.08 : -0.08)),
    }));
  }, []);

  // ── Guardar ────────────────────────────────────────────────────
  const guardar = async () => {
    if (!imagen || guardando) return;

    setGuardando(true);
    setError(null);

    try {
      const recortada = await recortarImagen(imagen, ajustes, { maximo });

      await onGuardar(recortada, ajustes);
    } catch (e: unknown) {
      setGuardando(false);
      setError(
        e instanceof Error ? e.message : 'No se ha podido recortar la imagen.',
      );
    }
  };

  const clase = imagen
    ? clasificarProporcion(imagen.naturalWidth, imagen.naturalHeight)
    : null;

  const etiquetaProporcion =
    aspectRatio === 1 ? 'Cuadrada' : `${aspectRatio.toFixed(2)} : 1`;

  return (
    <div
      // `z-[200]`, por encima del modal de perfil (`z-[100]`).
      //
      // El editor se abre DESDE el modal de perfil: el fichero se
      // elige dentro y el editor se pinta fuera, antes en el DOM. Con
      // el mismo `z-[100]`, el que va después pinta encima, así que el
      // editor quedaba DETRÁS del formulario: el fondo se oscurecía
      // (su propio `bg-black/80` sí se sumaba) pero el diálogo no se
      // veía ni recibía clics, y parecía que el botón no hacía nada.
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={titulo ?? 'Recortar imagen'}
    >
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl sm:p-6">
        {/* ── Cabecera ─────────────────────────────────────── */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-base font-black text-white">
              <Crop size={16} className="text-violet-400" />
              {titulo ?? 'Recortar imagen'}
            </h3>
            <p className="mt-0.5 text-[11px] text-zinc-400">
              Arrastra para mover y usa el zoom para acercar. Con Mayús,
              el arrastre va a la décima parte; con las flechas del
              teclado, al píxel.
            </p>
          </div>

          <button
            type="button"
            onClick={onCancelar}
            disabled={ocupado}
            aria-label="Cerrar sin guardar"
            className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-40"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── La caja ──────────────────────────────────────── */}
        <div className="flex justify-center">
          <div
            ref={cajaRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={onWheel}
            onKeyDown={onTecla}
            tabIndex={imagen && !ocupado ? 0 : -1}
            aria-label="Encuadre: pulsa las flechas del teclado para mover la imagen al píxel"
            title="Flechas para mover al píxel (con Mayús, saltos mayores)"
            style={{
              // La caja encoge en pantallas estrechas en vez de
              // desbordar: antes medía 420 px fijos y en un móvil se
              // salía del modal. La resolución interna sigue siendo
              // la misma, así que la vista previa no pierde nitidez.
              width: '100%',
              maxWidth: ANCHO_CAJA,
              aspectRatio: `${tamano.ancho} / ${Math.max(1, tamano.alto)}`,
              // Lo que hace que en el móvil el dedo arrastre la foto
              // y no suba la página. Sin esto, cualquier gesto vertical
              // se lo queda el scroll y la foto no se mueve.
              touchAction: 'none',
              cursor: ocupado ? 'default' : 'grab',
            }}
            className={`relative overflow-hidden bg-zinc-950 ${
              forma === 'circular' ? 'rounded-full' : 'rounded-2xl'
            } border border-zinc-700 outline-none focus-visible:border-violet-500/70`}
          >
            <canvas
              ref={canvasRef}
              className="block h-full w-full select-none"
              style={{ pointerEvents: 'none' }}
            />

            {/* La retícula: solo avisa de dónde va la imagen, no
                tapa. Tres líneas de guía bastan y no tapan la cara. */}
            {!ocupado && (
              <div className="pointer-events-none absolute inset-0 opacity-40">
                <div className="absolute left-1/3 top-0 h-full w-px bg-white/40" />
                <div className="absolute left-2/3 top-0 h-full w-px bg-white/40" />
                <div className="absolute left-0 top-1/3 h-px w-full bg-white/40" />
                <div className="absolute left-0 top-2/3 h-px w-full bg-white/40" />
              </div>
            )}

            {cargando && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/70">
                <Loader2 size={22} className="animate-spin text-violet-400" />
              </div>
            )}
          </div>
        </div>

        {/* ── Qué imagen es, y si va a necesitar recorte ──── */}
        {clase && (
          <p className="mt-3 text-center text-[11px] leading-relaxed text-zinc-400">
            {descripcionProporcion(clase)}
            <span className="text-zinc-500">
              {' '}
              Imagen {imagen!.naturalWidth}×{imagen!.naturalHeight} px · se
              guardará a {etiquetaProporcion}.
            </span>
          </p>
        )}

        {/* ── Zoom ─────────────────────────────────────────── */}
        <div className="mt-4 flex items-center gap-3">
          <span className="w-12 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Zoom
          </span>

          <input
            type="range"
            min={ZOOM_MINIMO}
            max={ZOOM_MAXIMO}
            step={0.01}
            value={ajustes.zoom}
            disabled={ocupado}
            onChange={(e) =>
              setAjustes((prev) => ({ ...prev, zoom: Number(e.target.value) }))
            }
            aria-label="Zoom del recorte"
            className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-zinc-700 accent-violet-500 disabled:opacity-40"
          />

          <span className="w-10 shrink-0 text-right text-[11px] tabular-nums text-zinc-400">
            {ajustes.zoom.toFixed(2)}×
          </span>
        </div>

        {/* ── Ajuste fino ──────────────────────────────────── */}
        <div className="mt-3 flex items-center gap-3">
          <span className="w-12 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Mover
          </span>

          <div className="flex flex-1 items-center justify-center gap-1.5">
            <button
              type="button"
              onClick={() => mover(PASO_BOTON, 0)}
              disabled={ocupado || !imagen}
              aria-label="Mover a la izquierda"
              title="Mover a la izquierda"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/60 text-zinc-200 transition-colors hover:bg-zinc-800 disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              onClick={() => mover(0, PASO_BOTON)}
              disabled={ocupado || !imagen}
              aria-label="Mover hacia arriba"
              title="Mover hacia arriba"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/60 text-zinc-200 transition-colors hover:bg-zinc-800 disabled:opacity-40"
            >
              <ChevronUp size={14} />
            </button>
            <button
              type="button"
              onClick={() => mover(0, -PASO_BOTON)}
              disabled={ocupado || !imagen}
              aria-label="Mover hacia abajo"
              title="Mover hacia abajo"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/60 text-zinc-200 transition-colors hover:bg-zinc-800 disabled:opacity-40"
            >
              <ChevronDown size={14} />
            </button>
            <button
              type="button"
              onClick={() => mover(-PASO_BOTON, 0)}
              disabled={ocupado || !imagen}
              aria-label="Mover a la derecha"
              title="Mover a la derecha"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/60 text-zinc-200 transition-colors hover:bg-zinc-800 disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <span className="w-10 shrink-0 text-right text-[11px] tabular-nums text-zinc-400">
            {Math.round(ajustes.x * 100)}·{Math.round(ajustes.y * 100)}
          </span>
        </div>

        {/* ── Centrar y restablecer ───────────────────────── */}
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setAjustes((prev) => ({ ...prev, x: 0.5, y: 0.5 }))}
            disabled={ocupado}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-[11px] font-semibold text-zinc-200 transition-colors hover:bg-zinc-800 disabled:opacity-40"
          >
            <Maximize2 size={12} />
            Centrar
          </button>

          <button
            type="button"
            onClick={() => setAjustes(ajustesIniciales(aspectRatio))}
            disabled={ocupado}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-[11px] font-semibold text-zinc-200 transition-colors hover:bg-zinc-800 disabled:opacity-40"
          >
            <RotateCcw size={12} />
            Restablecer
          </button>
        </div>

        {error && (
          <p className="mt-3 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-[11px] text-red-300">
            {error}
          </p>
        )}

        {/* ── Guardar y cancelar ───────────────────────────── */}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancelar}
            disabled={ocupado}
            className="flex-1 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-40"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={() => void guardar()}
            disabled={ocupado || !imagen}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-violet-500 disabled:opacity-40"
          >
            {guardando ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Check size={15} />
            )}
            {guardando ? 'Guardando...' : 'Guardar imagen'}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Las proporciones que se ofrecen, para donde el usuario elija.
 *
 * Se exporta porque hay sitios donde el usuario tiene que elegir (el
 * panel para las imágenes de una temporada, por ejemplo) y no tiene
 * sentido repetir el `<select>` en cada uno.
 */
export const OPCIONES_PROPORCION = [
  PROPORCIONES.cuadrado,
  PROPORCIONES.vertical,
  PROPORCIONES.retrato,
  PROPORCIONES.horizontal,
  PROPORCIONES.panoramica,
  PROPORCIONES.cinematico,
];

/** Si un ajuste guardado tiene sentido, o si hay que empezar de cero. */
export function ajustesValidos(ajustes: unknown): ImageCropSettings | null {
  if (typeof ajustes !== 'object' || ajustes === null) return null;

  const a = ajustes as Partial<ImageCropSettings>;

  if (
    typeof a.aspectRatio !== 'number' ||
    !Number.isFinite(a.aspectRatio) ||
    a.aspectRatio <= 0 ||
    typeof a.zoom !== 'number' ||
    typeof a.x !== 'number' ||
    typeof a.y !== 'number'
  ) {
    return null;
  }

  return {
    aspectRatio: a.aspectRatio,
    zoom: limitarZoom(a.zoom),
    x: limitarDesplazamiento(a.x),
    y: limitarDesplazamiento(a.y),
  };
}