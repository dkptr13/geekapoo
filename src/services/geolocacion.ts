/**
 * Pedir la posición al navegador.
 *
 * ── POR QUE ESTÁ SUELTO ─────────────────────────────────────────────
 *
 * Lo usan dos sitios: el botón del chat y el botón de "centrar en mí"
 * del selector de mapa. Si estuviera dentro de un componente, el otro
 * tendría que importarlo y no se podría probar. Aquí no hay nada
 * de React, solo la API del navegador.
 *
 * El motivo del error se separa del texto porque el texto cambia con
 * el idioma y el motivo no: el que decide qué hacer a continuación
 * —ofrecer el mapa, reintentar, rendirse— es el motivo, y eso sí se
 * puede probar sin navegador.
 *
 * ── LO QUE NO HACE ──────────────────────────────────────────────────
 *
 * No guarda la posición, no la manda a ningún sitio y no se queda
 * escuchando. Es una llamada de las muchas que hace una página al
 * abrirse y desaparece al terminar. La posición solo sale de aquí si el
 * usuario ha pulsado antes un botón que ponía "Enviar ubicación", que
 * es la única forma de que este fichero se llegue a ejecutar.
 */

import type { LocationAttachment } from '../types';

/** Por qué no se ha podido obtener la posición. */
export type MotivoFallo =
  /** El navegador no tiene geolocalización. */
  | 'sin-soporte'
  /** El usuario ha dicho que no. */
  | 'denegado'
  /** El navegador no ha podido determinar la posición. */
  | 'no-disponible'
  /** Ha pasado el tiempo y no ha llegado nada. */
  | 'timeout'
  /** Cualquier otra cosa. */
  | 'desconocido';

/**
 * Un fallo al pedir la posición, con el motivo por separado del texto.
 *
 * Se distingue de un `Error` normal con `instanceof`, no con una
 * propiedad, porque el mensaje se enseña al usuario y el motivo lo lee
 * el código: si mezclaran los dos, un cambio de texto rompería la
 * lógica.
 */
export class FalloGeoloc extends Error {
  readonly motivo: MotivoFallo;

  constructor(motivo: MotivoFallo) {
    super(mensajeDeFallo(motivo));
    this.name = 'FalloGeoloc';
    this.motivo = motivo;
  }
}

/**
 * El texto que ve la persona.
 *
 * Ninguno de los cuatro es un error técnico, y ninguno dice "permiso
 * denegado" a quien no lo ha denegado: se llega al mismo sitio
 * por cuatro causas distintas y solo el navegador sabe cuál fue.
 *
 * ── POR QUÉ NINGUNO ES UN ERROR BLOQUEANTE ──────────────────────────
 *
 * Los cuatro casos ofrecen el mapa. Compartir un lugar sin dar
 * permiso tiene que ser posible: mucha gente usa el chat desde un
 * ordenador de sobremesa, sin sensor de posición, y para decir
 * "aquí, en el bar de la esquina" el mapa es mejor herramienta que el
 * GPS.
 *
 * @param {MotivoFallo} motivo
 * @returns {string}
 */
export function mensajeDeFallo(motivo: MotivoFallo): string {
  switch (motivo) {
    case 'sin-soporte':
      return 'Tu navegador no puede saber dónde estás.';
    case 'denegado':
      return 'No hemos podido acceder a tu ubicación, porque no has dado permiso.';
    case 'no-disponible':
      return 'No hemos podido saber dónde estás. Inténtalo otra vez.'
    case 'timeout':
      return 'Está tardando demasiado en encontrarte. Inténtalo en un sitio abierto.';
    default:
      return 'No hemos podido obtener tu ubicación.'
  }
}

/**
 * Traduce el número que da el navegador a un motivo.
 *
 * Los códigos del `GeolocationPositionError` son 1 (denegado), 2 (no
 * disponible) y 3 (tiempo agotado). El 0 no existe en la práctica y
 * el 4 y el 5 llegaron en algunos navegadores, así que cualquier
 * código fuera de los tres conocidos cae en "desconocido" en vez de
 * inventar un texto.
 *
 * @param {number} codigo
 * @returns {MotivoFallo}
 */
export function motivoDeCodigo(codigo: number): MotivoFallo {
  if (codigo === 1) return 'denegado';
  if (codigo === 2) return 'no-disponible';
  if (codigo === 3) return 'timeout';

  return 'desconocido';
}

/**
 * Cuánto se espera antes de rendirse.
 *
 * `getCurrentPosition` no siempre contesta: sin red, con el GPS sin
 * ver satélites o en un portátil sin sensor, se queda esperando para
 * siempre. Sin límite el botón gira indefinidamente y no hay manera
 * de saber si ha fallado.
 *
 * Quince segundos es lo que usan casi todos los sitios y va sobrado
 * para un móvil. En interior, sin red y con el GPS tapado, se nota
 * que tarda, pero vuelve.
 */
export const TIMEOUT_MS = 15000;

/** Opciones para pedir la posición. */
export interface OpcionesPosicion {
  /** Cuánto se espera. Por defecto, `TIMEOUT_MS`. */
  timeout?: number;
}

/**
 * La posición actual, una vez y solo una.
 *
 * ── POR QUÉ NO `watchPosition` ──────────────────────────────────────
 *
 * La API de geolocalización tiene una forma de pedir la posición una
 * sola vez y otra de pedirla en continuo. Aquí hace falta la primera.
 * La otra dejaría al navegador pidiendo la posición para siempre
 * detrás de la web, que es justo lo que nadie espera al mandar un
 * mensaje de la ubicación.
 *
 * ── EL TIMEOUT DE LA API Y EL DE AQUÍ ───────────────────────────────
 *
 * Los dos son el mismo número y llegan por dos caminos. El que se
 * pone en las opciones lo pone el propio navegador, que lanza el error
 * por su cuenta. El `Promise.race` de abajo es el que funciona si el
 * navegador se cuelga y no dispara nada, que es un caso raro pero
 * conocido: ocurre en algunos navegadores con la pestaña en segundo plano.
 *
 * @param {OpcionesPosicion} [opciones]
 * @returns {Promise<LocationAttachment>}
 * @throws {FalloGeoloc} si no se puede
 */
export function pedirPosicion(opciones: OpcionesPosicion = {}): Promise<LocationAttachment> {
  const timeout = opciones.timeout ?? TIMEOUT_MS;

  return new Promise<LocationAttachment>((resolver, rechazar) => {
    // Un navegador sin geolocalización no es raro: navegadores muy
    // antiguos, algunos modos privados, y cualquier sitio abierto por
    // http sin HTTPS.
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      rechazar(new FalloGeoloc('sin-soporte'));

      return;
    }

    let terminado = false;

    const acabar = (fn: () => void) => {
      if (terminado) return;
      terminado = true;
      clearTimeout(guarda);
      fn();
    };

    const guarda = setTimeout(() => acabar(() => rechazar(new FalloGeoloc('timeout'))), timeout);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        acabar(() =>
          resolver({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            // El navegador a veces no da precisión. Se omite el campo
            // en lugar de mandar un 0, que significaría "exacta".
            ...(Number.isFinite(pos.coords.accuracy)
              ? { accuracy: Math.round(pos.coords.accuracy) }
              : {}),
          }),
        );
      },
      (error) => acabar(() => rechazar(new FalloGeoloc(motivoDeCodigo(error.code)))),
      {
        timeout,
        // Con `enableHighAccuracy` en false no se enciende el GPS, que
        // en un portátil puede tardar más de lo que el timeout
        // permite. Para señalar un punto en un mapa da igual.
        enableHighAccuracy: false,
        // Un minuto es tiempo de sobra para que pulsar dos veces seguidas
        // no haga dos peticiones al servidor de posición.
        maximumAge: 60000,
      },
    );
  });
}
