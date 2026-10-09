import { useCallback, useEffect, useRef, useState } from 'react';
import type { FC, PointerEvent as ReactPointerEvent } from 'react';
import { Loader2, Maximize2, RotateCcw, X, Check, Crop } from 'lucide-react';

import {
  PROPORCIONES,
  ZOOM_MAXIMO,
  ZOOM_MINIMO,
  ajustesIniciales,
  calcularEncuadre,
  clasificarProporcion,
  descripcionProporcion,
  limitarDesplazamiento,
  limitarZoom,
  type ImageCropSettings,
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

  // ── El arrastre ────────────────────────────────────────────────
  //
  // El desplazamiento se guarda normalizado, así que un píxel de
  // dedo se traduce a una fracción del recorrido disponible. Si el
  // recorrido es cero (no hay nada que mover en ese eje) el valor no
  // se toca, y por eso no hay que comprobarlo antes.
  const arrastrando = useRef<{ x: number; y: number } | null>(null);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!imagen) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    arrastrando.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const desde = arrastrando.current;

    if (!desde || !imagen || tamano.ancho <= 0) return;

    const e0 = calcularEncuadre(
      imagen.naturalWidth,
      imagen.naturalHeight,
      tamano.ancho,
      tamano.alto,
      ajustes,
    );

    const recorridoX = Math.max(1, e0.ancho - tamano.ancho);
    const recorridoY = Math.max(1, e0.alto - tamano.alto);

    // El signo va invertido porque el desplazamiento va hacia el lado
    // contrario al dedo: si tiras de la foto hacia la derecha, lo que
    // se ve es lo que había a la derecha.
    setAjustes((prev) => ({
      ...prev,
      x: limitarDesplazamiento(prev.x - (e.clientX - desde.x) / recorridoX),
      y: limitarDesplazamiento(prev.y - (e.clientY - desde.y) / recorridoY),
    }));
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    arrastrando.current = null;

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
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

  const ocupado = cargando || guardando;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
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
              Arrastra para mover y usa el zoom para acercar.
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
            style={{
              width: ANCHO_CAJA,
              height: tamano.alto,
              // Lo que hace que en el móvil el dedo arrastre la foto
              // y no suba la página. Sin esto, cualquier gesto vertical
              // se lo queda el scroll y la foto no se mueve.
              touchAction: 'none',
              cursor: ocupado ? 'default' : 'grab',
            }}
            className={`relative overflow-hidden bg-zinc-950 ${
              forma === 'circular' ? 'rounded-full' : 'rounded-2xl'
            } border border-zinc-700`}
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