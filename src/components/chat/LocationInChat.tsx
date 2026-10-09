import { useCallback, useEffect, useRef, useState } from 'react';
import type { FC } from 'react';
import { Map, MapPin, Loader2, Crosshair, AlertCircle, X, ExternalLink } from 'lucide-react';

import type { LocationAttachment } from '../../types';
import { enlaceGoogleMaps, enlaceMapa } from '../../services/ubicacion';
import { pedirPosicion } from '../../services/geolocacion';

// ======================================================
// EL MENÚ DEL BOTÓN
// ======================================================
//
// El botón de la barra de escritura no manda la ubicación: abre un
// menú con dos caminos. Lo hace así porque los dos son de verdad
// distintos y porque uno de ellos no puede fallar.
//
// "Usar mi ubicación actual" necesita que el navegador sepa dónde
// estás. En un portátil sin sensor, dentro de un edificio con el GPS
// tapado, en un navegador que no tiene la API, o con el permiso
// denegado a propósito, no hay manera de que salga.
//
 // "Elegir en el mapa" no necesita permiso. Funciona siempre, y
// además es la manera más precisa de las dos para decir "aquí en este
// portal", que es lo que se dice casi siempre en un chat.
//
// Si solo hubiera habido botón directo, la mitad de la gente se
// habría quedado sin poder compartir sitio. El menú es lo que evita
// eso.
//
// ── CUÁNDO SE PIDE PERMISO ──────────────────────────────────────────
//
// Ni al abrir Geekapoo, ni al entrar, ni al abrir una conversación, ni
// al abrir el menú. Solo al pulsar "Usar mi ubicación actual". La razón
// es práctica además de legal: un permiso que aparece sin que nadie haya
// pedido nada se deniega casi siempre, y después ya no se puede volver
// a pedir sin que el usuario entre a los ajustes del navegador.

interface MenuProps {
  /** La posición del navegador ya está conseguida. */
  onLocated: (ubicacion: LocationAttachment) => void;
  /** Se ha elegido ir al mapa a mano. */
  onAbrirMapa: () => void;
  /** Un fallo al pedir la posición, para poder enseñarlo. */
  onError: (mensaje: string) => void;
  className?: string;
}

export const LocationMenu: FC<MenuProps> = ({
  onLocated,
  onAbrirMapa,
  onError,
  className = '',
}) => {
  const [abierto, setAbierto] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const botonRef = useRef<HTMLButtonElement>(null);

  // ── Dónde se coloca la ventana ───────────────────────
  //
  // Va `fixed`, no `absolute`, por el mismo motivo que la del selector
  // de emojis: el chat tiene scroll propio y una ventana `absolute` se
  // recorta contra él. Con `absolute` esta ventana se cortaba por la
  // derecha y solo se leia "Usar mi ubicaci".
  //
  // Al ser `fixed` hay que decirle donde está en píxeles, y eso se saca
  // del botón. Se mide `left` y `bottom` en vez de `top`: la altura de
  // la ventana depende de si el navegador tiene los textos traducidos
  // o no, y `bottom` la da por hecha sin tener que medirla.
  const [sitio, setSitio] = useState({ left: 12, bottom: 12 });

  const colocar = useCallback(() => {
    const r = botonRef.current?.getBoundingClientRect();

    if (!r) return;

    // `w-60` del Tailwind son 240 px. Va en la misma constante que la
    // clase: si se cambia el ancho hay que cambiarla aqui tambien.
    const ANCHO = 240;
    const MARGEN = 12;

    setSitio({
      left: Math.max(MARGEN, Math.min(r.left, window.innerWidth - ANCHO - MARGEN)),
      bottom: Math.max(MARGEN, window.innerHeight - r.top + 8),
    });
  }, []);

  useEffect(() => {
    if (!abierto) return;

    colocar();

    // Al mover o redimensionar se recoloca, porque `fixed` se queda
    // quieto y el botón no. El `true` del scroll recoge tambien el del
    // contenedor propio del chat, que es lo que mas se mueve.
    const alMover = () => colocar();

    window.addEventListener('scroll', alMover, true);
    window.addEventListener('resize', alMover);

    return () => {
      window.removeEventListener('scroll', alMover, true);
      window.removeEventListener('resize', alMover);
    };
  }, [abierto, colocar]);

  // ── Cerrar al pulsar fuera ─────────────────────────────
  //
  // Un menú que se queda abierto después de haber hecho lo suyo
  // tapona el chat. Se cierra con el ratón fuera, con el botón de
  // cerrar, y con el Escape, que es lo que espera quien usa teclado.
  useEffect(() => {
    if (!abierto) return;

    const fuera = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setAbierto(false);
    };

    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false);
    };

    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', escape);

    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('keydown', escape);
    };
  }, [abierto]);

  // ── Mi ubicación ───────────────────────────────────────
  const propia = async () => {
    setAbierto(false);
    setBuscando(true);

    try {
      onLocated(await pedirPosicion());
    } catch (e) {
      // El texto ya viene puesto en el error: los cuatro motivos
      // posibles tienen su propio mensaje, y ninguno es técnico.
      onError(e instanceof Error ? e.message : 'No se ha podido obtener tu ubicación.');
    } finally {
      setBuscando(false);
    }
  };

  const mapa = () => {
    setAbierto(false);
    onAbrirMapa();
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        ref={botonRef}
        type="button"
        onClick={() => setAbierto((v) => !v)}
        disabled={buscando}
        aria-label="Compartir una ubicación"
        aria-expanded={abierto}
        title="Compartir una ubicación"
        className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition-all ${
          buscando || abierto
            ? 'border-violet-500/60 bg-violet-600/20 text-violet-300'
            : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-violet-500/50 hover:text-violet-300'
        } ${className}`}
      >
        {buscando ? <Loader2 size={17} className="animate-spin" /> : <MapPin size={17} />}
      </button>

      {abierto && (
        <div
          className="geo-pop-in-arriba fixed z-[85] w-60 overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl shadow-black/60"
          style={{ left: sitio.left, bottom: sitio.bottom }}
        >
          <p className="border-b border-zinc-800 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            Compartir ubicación
          </p>

          <button
            type="button"
            onClick={() => void propia()}
            className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-zinc-800"
          >
            <Crosshair size={15} className="mt-0.5 flex-shrink-0 text-violet-400" />
            <span>
              <span className="block text-[11px] font-semibold text-zinc-200">
                Usar mi ubicación actual
              </span>
              <span className="block text-[10px] text-zinc-500">
                Te la pide el navegador
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={mapa}
            className="flex w-full items-start gap-2.5 border-t border-zinc-800 px-3 py-2.5 text-left transition-colors hover:bg-zinc-800"
          >
            <Map size={15} className="mt-0.5 flex-shrink-0 text-emerald-400" />
            <span>
              <span className="block text-[11px] font-semibold text-zinc-200">
                Elegir en el mapa
              </span>
              <span className="block text-[10px] text-zinc-500">Sin pedir ningún permiso</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

// ======================================================
// LA TARJETA DENTRO DEL CHAT
// ======================================================
//
// Un mapa de verdad dentro de cada mensaje sale caro: son cientos de
// peticiones de teselas por mensaje, la lista de mensajes es larga y se
// pinta entero cada vez que llega uno nuevo. En su lugar hay una
// tarjeta con el icono, el sitio y un botón, que es lo que se ve en el
// móvil y lo que menos estorba.
//
// ── POR QUÉ HAY DOS BOTONES Y NO UNO ──────────────────────────
//
// Porque el destino de un enlace no es lo mismo para todo el mundo.
// OpenStreetMap va bien para mirar el mapa y callejear; Google Maps es
// el que la gente tiene en el móvil y por el que sabe llegar. Los dos
// se generan desde las MISMAS coordenadas, que vienen de OpenStreetMap
// o del navegador. A Google no se le pide nada mas.
//
// ── POR QUÉ LA TARJETA ES UN DIV Y NO UN ENLACE ───────────────
//
// Porque antes toda la tarjeta era un `<a>` y ahora lleva dos enlaces
// dentro. Un enlace dentro de otro enlace es HTML invalido y cada
// navegador lo arregla como puede: o el segundo deja de funcionar, o el
// primero se come el clic entero. Con un `div` los dos enlaces son
// hermanos y cada uno hace lo suyo.
//
// Los enlaces son de verdad, no manejadores de clic que abren una
// pestaña: se pueden abrir con el boton derecho y con el del medio,
// que es lo que se espera de un enlace.
//
// ── LO QUE NO SE HACE ──────────────────────────────────────────
//
// No se copian las coordenadas al portapapeles: se enseñan en la
// tarjeta, que es como se consulta un dato y no como se copia uno.
// No se pide permiso de geolocalizacion para nada de esto, porque las
// coordenadas ya estan en el mensaje.
//
// El mapa de elegir sitio sigue siendo OpenStreetMap, con sus teselas
// de OSM y su atribucion. Abrir Google Maps desde la tarjeta no cambia
// de donde salen las coordenadas ni de que se dibuja el mapa.

export const LocationCard: FC<{ ubicacion: LocationAttachment }> = ({ ubicacion }) => {
  const { lat, lng, accuracy, place } = ubicacion;

  const urlOsm = enlaceMapa(lat, lng);

  // Viene en `null` si las coordenadas no pasan la validacion. El boton
  // no se enseña en ese caso: es mejor un boton menos que un enlace que
  // lleva a un sitio imposible.
  const urlGoogle = enlaceGoogleMaps(lat, lng);

  const coordenadas = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

  return (
    <div className="my-1 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 transition-colors hover:border-violet-500/60">
      <div className="relative flex h-24 items-center justify-center bg-gradient-to-br from-violet-950 via-zinc-900 to-emerald-950">
        {/* Baliza: el punto que se movería en un mapa. */}
        <div className="relative flex items-center justify-center">
          {accuracy !== undefined && (
            <span
              className="absolute rounded-full bg-violet-500/20"
              style={{
                // El círculo de precisión, a escala. Un radio de 300
                // píxeles representa unos 5 km, así que cada píxel vale
                // unos 17 m.
                width: `${Math.min(300, Math.max(28, accuracy / 17))}px`,
                height: `${Math.min(300, Math.max(28, accuracy / 17))}px`,
              }}
            />
          )}
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg shadow-violet-900/50">
            <Crosshair size={17} />
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-2">
        <MapPin size={13} className="flex-shrink-0 text-emerald-400" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-semibold text-zinc-200">
            {place || 'Ubicación compartida'}
          </p>
          <p className="truncate font-mono text-[10px] text-zinc-500">{coordenadas}</p>
        </div>
        {accuracy !== undefined && (
          <span className="flex-shrink-0 rounded-md bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
            ±{accuracy} m
          </span>
        )}
      </div>

      {/* ── Los dos enlaces ──────────────────────────────
          Son hermanos dentro de un `div`, no enlaces anidados. Ver la
          nota de arriba: era un error meter un `<a>` dentro de otro. */}
      <div className="flex divide-x divide-zinc-800 border-t border-zinc-800">
        <a
          href={urlOsm}
          target="_blank"
          rel="noopener noreferrer"
          title="Abrir en OpenStreetMap"
          className="flex flex-1 items-center justify-center gap-1.5 py-2 text-[10px] font-semibold text-violet-300 transition-colors hover:bg-zinc-800/60"
        >
          <Map size={11} />
          Abrir en OpenStreetMap
        </a>

        {urlGoogle && (
          <a
            href={urlGoogle}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir en Google Maps"
            className="flex flex-1 items-center justify-center gap-1.5 py-2 text-[10px] font-semibold text-zinc-300 transition-colors hover:bg-zinc-800/60"
          >
            <ExternalLink size={11} />
            Abrir en Google Maps
          </a>
        )}
      </div>
    </div>
  );
};

// ======================================================
// EL AVISO
// ======================================================
//
// Salen dos: que no se ha podido obtener la posición, y que ha fallado
// al subir una foto. Son el mismo recuadro porque se leen igual.
//
// El aviso de la ubicación lleva una salida: si el navegador no ha
// podido, el mapa sí. Sin ella, quien no tiene sensor en el portátil se
// queda mirando un "no se ha podido" y sin manera de seguir adelante, y
// es exactamente la gente que más veces va a querer compartir un sitio.
// Por eso `accion` no es opcional en la práctica: la pasa ChatView.

export const LocationNotice: FC<{
  mensaje: string;
  onClose: () => void;
  accion?: { texto: string; onClick: () => void };
}> = ({ mensaje, onClose, accion }) => (
  <div className="mb-2 flex flex-wrap items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2">
    <AlertCircle size={14} className="mt-0.5 flex-shrink-0 text-red-400" />
    <p className="min-w-0 flex-1 text-[11px] text-red-300">{mensaje}</p>

    {accion && (
      <button
        type="button"
        onClick={accion.onClick}
        className="flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-red-500/20 px-2 py-1 text-[10px] font-bold text-red-200 transition-colors hover:bg-red-500/30"
      >
        <Map size={11} />
        {accion.texto}
      </button>
    )}

    <button
      type="button"
      onClick={onClose}
      aria-label="Cerrar el aviso"
      className="flex-shrink-0 text-red-400 hover:text-red-200"
    >
      <X size={13} />
    </button>
  </div>
);
