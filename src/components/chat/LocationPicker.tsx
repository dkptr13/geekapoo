// El mapa del selector de ubicación.
//
// El CSS de Leaflet va importado aquí arriba, y a propósito.
//
// Las hojas de Leaflet son 15 KB y salen en el CSS principal; meterlas
// en el trozo aparte obligaría a cargar un trozo de estilo sin estilo
// en cuanto se abre el modal, que es justo cuando se nota el fallo. Lo
// que sí pesa —el JavaScript, 145 KB— se carga aparte: el `import()`
// del efecto de más abajo no se ejecuta hasta que el mapa se abre, de
// manera que nadie que no abra el mapa lo descarga. La diferencia
// entre 15 KB de siempre y 145 KB de a veces es la que decide.
import 'leaflet/dist/leaflet.css';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FC } from 'react';
import { AlertCircle, Crosshair, Loader2, MapPin, Search, X } from 'lucide-react';
import type * as Leaflet from 'leaflet';

// Los iconos del marcador, importados para que Vite les ponga una URL.
// El problema que resuelven: Leaflet apunta a sus propias imágenes con
// rutas relativas al CSS, y bajo un empaquetador esa ruta se rompe y
// sale el marcador roto. Importándolos se le dan las direcciones ya
// resueltas.
import iconoUrl from 'leaflet/dist/images/marker-icon.png';
import iconoDobleUrl from 'leaflet/dist/images/marker-icon-2x.png';
import sombraUrl from 'leaflet/dist/images/marker-shadow.png';

import type { LocationAttachment } from '../../types';
import { buscarLugares, lugarDeCoordenadas, MINIMO_BUSQUEDA } from '../../services/geocoding';
import type { Lugar } from '../../services/geocoding';
import { pedirPosicion } from '../../services/geolocacion';
import {
  PUNTO_POR_DEFECTO,
  ZOOM_POR_DEFECTO,
  etiquetaDeLugar,
  ubicacionPlausible,
} from '../../services/ubicacion';

// Variables que Vite incrusta.
const ENV = (import.meta.env ?? {}) as Record<string, string | undefined>;

/**
 * De dónde salen las teselas del mapa.
 *
 * Por defecto, las de OpenStreetMap, que son gratuitas y no
 * valen para un sitio con este tamaño. Su política deja usarlas en
 * sitios que no reciba mucho tráfico, así que si algún día esto
 * creciera, la variable `VITE_TILE_URL` permite cambiar a otro
 * proveedor sin tocar código ni recompilar.
 */
const TILE_URL = ENV.VITE_TILE_URL ?? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

/**
 * Cuánto se espera a que se pare la escritura antes de buscarse.
 *
 * Milisegundos y medio. Es el mismo criterio que el buscador de GIFs,
 * y por el mismo motivo: por debajo, "Gran" dispara una petición y
 * "Grana" otra, y el usuario solo necesitaba la segunda. Por encima,
 * el buscador se siente lento y parece que no responde.
 */
const ESPERA_BUSQUEDA = 450;

/** Cuánto se espera antes de poner nombre a un punto suelto. */
const ESPERA_REVERSO = 500;

/** El zoom al acercarse a un sitio elegido. */
const ZOOM_SITIO = 17;

/**
 * El icono del marcador.
 *
 * ── POR QUÉ HAY QUE DARLE LAS IMÁGENES ──────────────────────────────
 *
 * Leaflet tiene sus propias imágenes de marcador y las encuentra con
 * rutas relativas al CSS que se carga. Bajo un empaquetador esa ruta
 * no lleva a ningún sitio y sale el marcador roto, con el hueco vacío
 * donde va la cabeza. Pasándoselas importadas, Vite les da direcciones
 * que sí existen.
 *
 * Va en una función y no en una constante porque necesita el módulo de
 * Leaflet, que no se conoce hasta que se carga. Así, además de no
 * repetirlo en los dos sitios donde nace el marcador, no se puede
 * crear por accidente antes de tiempo.
 *
 * @param {typeof Leaflet} L el módulo ya cargado
 * @returns {Leaflet.Icon}
 */
function iconoMarcador(L: typeof Leaflet): Leaflet.Icon {
  return L.icon({
    iconUrl: iconoUrl,
    iconRetinaUrl: iconoDobleUrl,
    shadowUrl: sombraUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
}

/**
 * Crea el marcador y le pone su manejador de arrastre.
 *
 * Va fuera del componente y en una función porque pasa en dos momentos
 * distintos —al abrir el mapa con una posición ya puesta, y al primer
 * clic en un mapa que estaba vacío— y porque enganchar el arrastre aquí
 * es lo que garantiza que exista: el manejador se pone en el mismo
 * instante en que nace el marcador, así que no hay ninguna ventana en la
 * que el marcador exista sin quien lo escuche.
 *
 * El manejador llega como parámetro y no se busca de fuera porque esta
 * función es de módulo y no tiene acceso al componente. Quien llama le
 * pasa lo que tiene que hacer cuando alguien suelta el marcador.
 *
 * @param {typeof Leaflet} L el módulo ya cargado
 * @param {Leaflet.Map} mapa dónde va puesto
 * @param {number} lat
 * @param {number} lng
 * @param {(lat: number, lng: number) => void} alSoltar qué hacer al soltar
 * @returns {Leaflet.Marker}
 */
function crearMarcador(
  L: typeof Leaflet,
  mapa: Leaflet.Map,
  lat: number,
  lng: number,
  alSoltar: (lat: number, lng: number) => void,
): Leaflet.Marker {
  const marcador = L.marker([lat, lng], {
    icon: iconoMarcador(L),
    draggable: true,
  }).addTo(mapa);

  // Solo al soltar, no mientras se arrastra. Preguntar por el nombre en
  // cada movimiento es gastar una petición por fotograma, y además el
  // punto todavía no es el final: se movería tres veces por cada clic.

  marcador.on('dragend', () => {
    const p = marcador.getLatLng();
    alSoltar(p.lat, p.lng);
  });

  return marcador;
}

// ======================================================
// EL COMPONENTE
// ======================================================

interface Props {
  /**
   * El punto con el que se abre el selector, si viene de "usar mi
   * ubicación". Si no hay ninguno, el mapa se abre en el centro por
   * defecto y esperando a que se elija algo.
   */
  inicial?: LocationAttachment | null;
  /** Se llama con el punto confirmado, ya validado. */
  onConfirmar: (ubicacion: LocationAttachment) => void;
  /** Botón de cancelar y pulsar fuera. */
  onCancelar: () => void;
}

export const LocationPicker: FC<Props> = ({ inicial = null, onConfirmar, onCancelar }) => {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<Leaflet.Map | null>(null);
  const marcadorRef = useRef<Leaflet.Marker | null>(null);
  const moduloRef = useRef<typeof Leaflet | null>(null);

  /**
   * Un número que va cambiando con cada petición de nombre.
   *
   * Es para que una respuesta que llega tarde no pise lo que se ha
   * elegido después. Sin esto, si alguien suelta el marcador en Madrid
   * y acto seguido en Barcelona, puede ganar la respuesta de Madrid y
   * quedarse el marcador en Barcelona con el nombre de Madrid, que es
   * la peor forma de mentir.
   */
  const vueltaRef = useRef(0);

  /**
   * La última versión de `fijar`.
   *
   * Los manejadores del mapa y del marcador se enganchan dentro del
   * efecto que los crea, y ese efecto solo se ejecuta una vez, con lo
   * que se queda con la `fijar` de aquel momento. Como `fijar` solo
   * depende de `colocar`, que no cambia nunca, en la práctica daría
   * igual; pero si mañana `fijar` empieza a depender de algo que cambia,
   * el manejador se quedaría con la versión vieja sin avisar.
   *
   * Con una referencia, el manejador va siempre a la función actual. Es
   * el mismo truco que usan las librerías para escuchar eventos sin
   * volver a suscribirse, y la alternativa —volver a enganchar cada vez
   * que cambia— obliga a acordarse de quitar el manejador anterior.
   */
  const fijarRef = useRef<(lat: number, lng: number, nombre?: string) => void>(() => {});

  /**
   * La búsqueda de nombre que está en curso, o `null`.
   *
   * Se guarda el temporizador y su cancelación juntos porque van
   * siempre juntos: o se cancelan los dos o no se cancela ninguno, y
   * una peticion de red que sigue abierta porque se ha olvidado el
   * `clearTimeout` es justo lo que este componente quiere evitar.
   */
  const esperaRef = useRef<{
    t: ReturnType<typeof setTimeout>;
    c: AbortController;
  } | null>(null);

  /** Corta la búsqueda de nombre anterior, si había alguna. */
  const cancelarEspera = useCallback(() => {
    if (!esperaRef.current) return;

    clearTimeout(esperaRef.current.t);
    esperaRef.current.c.abort();
    esperaRef.current = null;
  }, []);

  /**
   * Lo que se hace cuando alguien suelta el marcador.
   *
   * Va por la referencia y no directo a `fijar` porque `fijar` todavía no
   * está definida en este punto del componente, y porque así el manejador
   * se engancha una vez y sigue funcionando igual después de que `fijar`
   * cambie.
   */
  const soltarMarcador = useCallback((nuevaLat: number, nuevaLng: number) => {
    fijarRef.current(nuevaLat, nuevaLng);
  }, []);

  const [punto, setPunto] = useState<LocationAttachment | null>(inicial);
  const [texto, setTexto] = useState('');
  const [resultados, setResultados] = useState<Lugar[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [naming, setNaming] = useState(false);
  const [error, setError] = useState('');
  const [errorBusqueda, setErrorBusqueda] = useState('');

  const { lat, lng } = punto ?? PUNTO_POR_DEFECTO;

  // ── El mapa ────────────────────────────────────────────
  //
  // Se crea una sola vez, al montar. El componente no se monta nunca
  // con el modal cerrado: quien lo abre, lo monta. Por eso el mapa no
  // existe en el resto de la web, y por eso cerrarlo es pelearse con
  // un mapa que no está.
  useEffect(() => {
    let vivo = true;

    const crear = async () => {
      const modulo = await import('leaflet');

      if (!vivo) return;

      // Leaflet se publica como UMD. Vite lo envuelve en un objeto con
      // `default`, pero según cómo se importe puede venir
      // suelto, y `modulo.default ?? modulo` cubre las dos formas sin
      // adivinar.
      const L = ((modulo as unknown as { default?: typeof Leaflet }).default ??
        modulo) as typeof Leaflet;

      moduloRef.current = L;

      const contenedor = contenedorRef.current;

      if (!contenedor) return;

      const mapa = L.map(contenedor, {
        center: [lat, lng],
        zoom: punto ? ZOOM_SITIO : ZOOM_POR_DEFECTO,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer(TILE_URL, {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(mapa);

      mapaRef.current = mapa;

      // El clic en el mapa pone el marcador.
      //
      // POR QUE AQUI Y NO EN UN EFECTO
      //
      // El mapa no existe hasta que el `import()` de arriba termina, y
      // eso es despues del primer pintado del componente. Un efecto que
      // se ejecutara al montar encontraria `mapaRef.current` a null y no
      // engancharia nada; y como no vuelve a ejecutarse, el mapa se
      // quedaria sin poder moverse con un efecto de ese tipo.
      //
      // Enganchandolo aqui, en el mismo sitio donde nace el mapa, se
      // cumple una regla mas general y mas dificil de romper por
      // accidente: cada manejador se pone sobre el objeto que existe,
      // en el momento en que existe, y no en un momento posterior en el
      // que ya no esta.
      mapa.on('click', (e: Leaflet.LeafletMouseEvent) => {
        fijarRef.current(e.latlng.lat, e.latlng.lng);
      });

      if (punto) {
        marcadorRef.current = crearMarcador(L, mapa, punto.lat, punto.lng, soltarMarcador);
      }

      // Un mapa se mide en el momento de crearse, y si el contenedor
      // todavia no tiene tamaño -porque el modal acaba de aparecer-
      // sale a medio camino y se ve en la mitad equivocada. Esto lo
      // vuelve a medir cuando ya esta colocado.
      mapa.invalidateSize();

      const medir = () => mapa.invalidateSize();
      const id = requestAnimationFrame(medir);

      // Y otra vez si cambia el tamaño, que pasa al girar el movil, al
      // abrir el teclado, y al plegarse la hoja de resultados.
      const observador = new ResizeObserver(medir);
      observador.observe(contenedor);

      return () => {
        cancelAnimationFrame(id);
        observador.disconnect();
      };
    };

    const promesa = crear();

    return () => {
      vivo = false;

      cancelarEspera();

      void promesa.then((limpiar) => limpiar?.()).catch(() => {});

      // Quitar el mapa es lo que libera los manejadores de eventos y el
      // nodo del DOM. Sin esto, abrir y cerrar el selector veinte veces
      // deja veinte mapas colgando escuchando clics.
      mapaRef.current?.remove();
      mapaRef.current = null;
      marcadorRef.current = null;
    };
    // Solo al montar: `punto` y `lat` se leen a proposito de aqui, con
    // el valor del primer render, que es el punto con el que se abre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Poner y mover el marcador ──────────────────────────
  const colocar = useCallback((nuevo: LocationAttachment, mover: boolean) => {
    const L = moduloRef.current;
    const mapa = mapaRef.current;

    if (!L || !mapa) return;

    if (!marcadorRef.current) {
      marcadorRef.current = crearMarcador(L, mapa, nuevo.lat, nuevo.lng, soltarMarcador);
    } else {
      marcadorRef.current.setLatLng([nuevo.lat, nuevo.lng]);
    }

    if (mover) mapa.setView([nuevo.lat, nuevo.lng], ZOOM_SITIO);
  }, []);

  /**
   * Elige un punto y le pone nombre.
   *
   * El nombre se busca despues, no antes: si al pinchar en el mapa se
   * hiciera antes una peticion para preguntar que hay en un sitio que
   * todavia no se sabe cual es, se gasta una consulta por cada clic de
   * los muchos que hace quien esta buscando. Con el punto ya puesto se
   * ve si el nombre encaja, y si no encaja, la siguiente busqueda lo
   * corrige.
   *
   * @param {number} nuevaLat
   * @param {number} nuevaLng
   * @param {string} [nombre] si ya se sabe, no hace falta preguntar
   */
  const fijar = useCallback(
    (nuevaLat: number, nuevaLng: number, nombre?: string) => {
      setPunto((p) => ({
        ...(p ?? {}),
        lat: nuevaLat,
        lng: nuevaLng,
        ...(nombre ? { place: nombre } : {}),
      }));

      colocar({ lat: nuevaLat, lng: nuevaLng }, false);

      if (nombre !== undefined) {
        cancelarEspera();
        setNaming(false);

        return;
      }

      // Se anota la vuelta antes de salir, y la respuesta solo vale si
      // sigue siendo la ultima peticion.
      vueltaRef.current += 1;

      const vuelta = vueltaRef.current;

      cancelarEspera();
      setNaming(true);

      const control = new AbortController();
      const espera = setTimeout(() => {
        void lugarDeCoordenadas(nuevaLat, nuevaLng, control.signal)
          .then((lugar) => {
            if (!lugar || control.signal.aborted) return;

            setPunto((p) =>
              p && p.lat === nuevaLat && p.lng === nuevaLng
                ? { ...p, place: etiquetaDeLugar([lugar.titulo, lugar.ciudad]) }
                : p,
            );
          })
          .catch(() => {
            // Fallar el nombre no es un fallo: las coordenadas ya
            // estan puestas y la tarjeta se puede mandar igual. El
            // texto que sale mientras tanto avisa de que se esta
            // buscando.
          })
          .finally(() => {
            // Se suelta la espera solo si sigue siendo ESTA, no una
            // más reciente: si alguien ha movido el marcador otra vez,
            // la que corre ahora es la suya y esta ya no manda.
            if (esperaRef.current?.t === espera) esperaRef.current = null;

            if (vuelta === vueltaRef.current) setNaming(false);
          });
      }, ESPERA_REVERSO);

      // La espera se guarda para poder cortarla. Sin esto, cada clic
      // deja un temporizador vivo que puede responder sobre un mapa que
      // ya se ha cerrado, y una peticion de red abierta sin motivo.
      esperaRef.current = { t: espera, c: control };
    },
    [colocar],
  );

  // Los manejadores se enganchan dentro del efecto que crea el mapa, y
  // eso necesita poder llamar a `fijar` sin depender de el: `fijar` usa
  // `colocar`, que usa los mismos manejadores, y encadenarlos en
  // `useCallback` seria un circulo. Con una referencia a la ultima
  // version, el manejador ve siempre la funcion actual sin crear el
  // circulo. Se asigna en cada pintado, que es justo cuando cambia.
  fijarRef.current = fijar;

  // ── El buscador ────────────────────────────────────────
  //
  // Se escribe en un temporizador y se cancela si llega otra tecla
  // antes de tiempo, y además se corta la petición anterior por
  // `AbortController`. Las dos cosas hacen falta: el temporizador evita
  // pedir lo que aún no se ha terminado de escribir, y el corte evita
  // que la respuesta de una búsqueda vieille se pinte encima de la
  // nueva. Es el mismo esquema que el buscador de GIFs.
  useEffect(() => {
    const limpio = texto.trim();

    if (limpio.length < MINIMO_BUSQUEDA) {
      setResultados([]);
      setBuscando(false);
      setErrorBusqueda('');

      return;
    }

    const control = new AbortController();

    setBuscando(true);
    setErrorBusqueda('');

    const espera = setTimeout(() => {
      void buscarLugares(limpio, control.signal)
        .then((lista) => {
          if (control.signal.aborted) return;
          setResultados(lista);
          setBuscando(false);
        })
        .catch((e: unknown) => {
          if (control.signal.aborted) return;

          setResultados([]);
          setBuscando(false);

          // Una cancelación no es un error que se enseñe.
          if (e instanceof Error && e.name === 'AbortError') return;

          setErrorBusqueda(e instanceof Error ? e.message : 'No se ha podido buscar ese lugar.');
        });
    }, ESPERA_BUSQUEDA);

    return () => {
      clearTimeout(espera);
      control.abort();
    };
  }, [texto]);

  // ── Elegir un resultado ────────────────────────────────
  const elegirSitio = useCallback(
    (lugar: Lugar) => {
      setTexto('');
      setResultados([]);
      fijar(lugar.lat, lugar.lng, etiquetaDeLugar([lugar.titulo, lugar.ciudad]));
      colocar({ lat: lugar.lat, lng: lugar.lng }, true);
    },
    [colocar, fijar],
  );

  // ── Centrarse en la posición del usuario ───────────────
  //
  // También es un botón, y también pide permiso: en ningún momento se
  // pide la posición sin que se haya pulsado algo que lo dice. Para
  // quien ya ha compartido una posición, esto no pregunta nada, porque el
  // navegador ya le había dado permiso.
  const [centrando, setCentrando] = useState(false);

  const centrar = useCallback(async () => {
    setCentrando(true);
    setError('');

    try {
      const pos = await pedirPosicion();

      fijar(pos.lat, pos.lng, pos.place ?? etiquetaDeLugar(['Mi ubicación']));
      colocar(pos, true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se ha podido obtener tu ubicación.');
    } finally {
      setCentrando(false);
    }
  }, [colocar, fijar]);

  // ── Confirmar ──────────────────────────────────────────
  const confirmar = useCallback(() => {
    if (!punto) return;

    const sitio: LocationAttachment = {
      lat: punto.lat,
      lng: punto.lng,
      ...(punto.accuracy !== undefined ? { accuracy: Math.round(punto.accuracy) } : {}),
      ...(punto.place ? { place: punto.place } : {}),
    };

    // La misma comprobación que hacen las reglas del servidor. Aquí no
    // protege de nada —las reglas lo hacen de verdad— pero evita que
    // un número raro llegue a Firestore y se muestre un error de
    // permisos, que no explica nada.
    if (!ubicacionPlausible(sitio)) {
      setError('Ese punto no parece válido. Prueba a mover el mapa.');

      return;
    }

    onConfirmar(sitio);
  }, [onConfirmar, punto]);

  const quedan = texto.trim().length >= MINIMO_BUSQUEDA;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancelar();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Compartir una ubicación"
        className="geo-pop-in flex h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-violet-500/30 bg-zinc-900 shadow-2xl shadow-violet-950/60 sm:h-auto sm:max-h-[88vh] sm:rounded-3xl"
      >
        {/* ── Cabecera ────────────────────────────────── */}
        <div className="flex items-center justify-between gap-2 border-b border-zinc-800 px-4 py-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-white">
            <MapPin size={16} className="text-violet-400" />
            Compartir ubicación
          </h3>

          <button
            type="button"
            onClick={onCancelar}
            aria-label="Cerrar sin compartir"
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── El buscador ─────────────────────────────── */}
        <div className="border-b border-zinc-800 px-4 py-3">
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              type="text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              autoComplete="off"
              placeholder="Busca un lugar: Gran Vía, Bernabéu, Barcelona Sants..."
              aria-label="Buscar un lugar"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 pl-9 pr-3 text-xs text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
            />
          </div>

          <p className="mt-2 text-[10px] leading-relaxed text-zinc-500">
            Escribe un sitio y elige uno de la lista, o mueve el mapa y pon el marcador donde
            quieras.
          </p>

          {/* ── Los resultados ───────────────────────── */}
          {quedan && (
            <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950">
              {buscando && resultados.length === 0 && (
                <p className="flex items-center gap-2 px-3 py-2.5 text-[11px] text-zinc-500">
                  <Loader2 size={12} className="animate-spin" />
                  Buscando...
                </p>
              )}

              {!buscando && errorBusqueda && (
                <p className="px-3 py-2.5 text-[11px] text-amber-300">{errorBusqueda}</p>
              )}

              {!buscando && !errorBusqueda && resultados.length === 0 && (
                <p className="px-3 py-2.5 text-[11px] text-zinc-500">
                  No hay ningún sitio con ese nombre. Prueba con la ciudad, o mueve el mapa.
                </p>
              )}

              {resultados.map((lugar) => (
                <button
                  key={`${lugar.lat.toFixed(5)},${lugar.lng.toFixed(5)}`}
                  type="button"
                  onClick={() => elegirSitio(lugar)}
                  className="flex w-full items-start gap-2 border-b border-zinc-900 px-3 py-2 text-left last:border-b-0 hover:bg-zinc-900"
                >
                  <MapPin size={13} className="mt-0.5 flex-shrink-0 text-violet-400" />
                  <span className="min-w-0">
                    <span className="block truncate text-[11px] font-semibold text-zinc-200">
                      {lugar.titulo}
                    </span>
                    {lugar.ciudad && (
                      <span className="block truncate text-[10px] text-zinc-500">
                        {lugar.ciudad}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── El mapa ─────────────────────────────────── */}
        {/* `min-h` con valor fijo y no sólo `flex-1`: sin altura mínima,
            un `flex-1` dentro de una columna sin contenido se queda a
            cero píxeles y Leaflet avisa por consola de que no puede
            medir nada. */}
        <div className="relative min-h-[240px] flex-1 bg-zinc-950">
          <div ref={contenedorRef} className="absolute inset-0" />

          {/* Centrarse en la posición. Va sobre el mapa porque es una
              acción del mapa, no del formulario. */}
          <button
            type="button"
            onClick={() => void centrar()}
            disabled={centrando}
            aria-label="Centrar en mi ubicación"
            title="Centrar en mi ubicación"
            className="absolute right-3 top-3 z-[500] flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900/95 text-zinc-300 shadow-lg transition-colors hover:border-violet-500/60 hover:text-violet-300 disabled:opacity-50"
          >
            {centrando ? <Loader2 size={16} className="animate-spin" /> : <Crosshair size={16} />}
          </button>
        </div>

        {/* ── El pie: qué se va a compartir ───────────── */}
        <div className="border-t border-zinc-800 px-4 py-3">
          {error && (
            <p className="mb-2 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[11px] text-red-300">
              <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              {punto ? (
                <>
                  <p className="flex items-center gap-1.5 truncate text-[11px] font-semibold text-zinc-200">
                    <MapPin size={12} className="flex-shrink-0 text-emerald-400" />
                    {punto.place || 'Punto elegido en el mapa'}
                  </p>
                  <p className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-500">
                    {punto.lat.toFixed(5)}, {punto.lng.toFixed(5)}
                    {naming && (
                      <span className="flex items-center gap-1 font-sans text-zinc-400">
                        <Loader2 size={9} className="animate-spin" />
                        buscando el nombre
                      </span>
                    )}
                  </p>
                </>
              ) : (
                <p className="text-[11px] text-zinc-500">
                  Elige un sitio de la lista o pon el marcador en el mapa.
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onCancelar}
                className="rounded-xl border border-zinc-700 px-4 py-2.5 text-xs font-semibold text-zinc-300 transition-colors hover:bg-zinc-800"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmar}
                disabled={!punto}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-violet-500 disabled:pointer-events-none disabled:opacity-40 shadow-lg shadow-violet-600/25"
              >
                <MapPin size={14} />
                Compartir ubicación
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
