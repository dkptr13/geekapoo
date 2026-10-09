/**
 * Si una ubicacion tiene sentido.
 *
 * ── POR QUE ESTÁ SUELTO ────────────────────────────────────────────
 *
 * La funcion original estaba en `services/chats.ts`, que importa
 * Firebase. Eso la hace imposible de probar sin un navegador: Node no
 * resuelve los imports de un `.ts` que a su vez importa `firebase`, y
 * la prueba se cae al importar antes de ejecutar nada.
 *
 * Aqui no hay nada mas que numeros, asi que el fichero se puede leer
 * desde Node y se puede probar de verdad. `probar-ubicacion.mjs` lo
 * hace, y con el caso del `NaN`, que es el que no se ve a ojo.
 *
 * ── EL NaN ─────────────────────────────────────────────────────────
 *
 * Con un rango escrito al reves,
 *
 *     if (u.lat < -90 || u.lat > 90) return false;
 *
 * un `NaN` lo pasaria: las dos comparaciones son falsas, con lo que
 * `||` devuelve falso y la funcion acepta una latitud que no existe.
 * El mapa se dibujaria en un sitio imposible y el enlace llevaria a
 * donde le diese el gana.
 *
 * `Number.isFinite` va antes que los rangos por eso. Comprobado en
 * `probar-ubicacion.mjs`.
 *
 * ── POR QUE NO ES LA GARANTIA ───────────────────────────────────────
 *
 * La garantia la dan las reglas de Firestore (`ubicacionValida` en
 * firestore.rules), que no se pueden saltar desde la consola del
 * navegador. Esta es la copia del cliente, y sirve para poder avisar
 * al instante en lugar de dejarle ver un error de permisos.
 *
 * Las dos tienen que aceptar exactamente lo mismo. Si el cliente
 * acepta algo que las reglas no, el usuario ve un fallo seco; si las
 * reglas aceptan algo que el cliente no, es un agujero.
 */

/** El limite de lo que tiene sentido para un punto en la Tierra. */
export const RANGOS = {
  lat: { min: -90, max: 90 },
  lng: { min: -180, max: 180 },
} as const;

/** El nombre de un sitio no puede pasar de esto. */
export const MAX_LUGAR = 200;

/**
 * Donde se abre el mapa la primera vez.
 *
 * La peninsula, en el centro. Es lo unico que se puede poner sin
 * inventarse nada: si el mapa saliera en otro sitio, el usuario
 * tendria que acertar donde esta el mundo para empezar a buscar, y
 * casi todos los que comparten un sitio estan en Espana.
 *
 * Cuando ya se sabe la ubicacion del usuario, el mapa va ahi y esto
 * no se usa. Es solo el punto de partida de la busqueda manual.
 */
export const PUNTO_POR_DEFECTO = { lat: 40.4, lng: -3.7 } as const;

/**
 * Cuanto se aleja el mapa al abrirlo, en niveles de zoom de Leaflet.
 *
 * 5 es un país entero. Es lo que hace falta para ver de qué sitio se
 * trata antes de escribir nada, y evita empezar tan cerca que solo se
 * vea una calle sin saber en qué ciudad está.
 */
export const ZOOM_POR_DEFECTO = 6;

/**
 * El nombre corto de un sitio, como va en el mensaje.
 *
 * ── POR QUE SE CORTA Y NO SE ACORTA ─────────────────────────────────
 *
 * La tarjeta del chat tiene una sola linea para el sitio, y con
 * "Calle de Alcalá de Henares, 34, 3º izquierda, barrio de Santo
 * Domingo, Alcorcón, Comunidad de Madrid, España" no cabe ni
 * cabe ni acortandolo. Aquí se quitan las partes repetidas y se corta al
 *
 * El corte es a `MAX_LUGAR`, que es el mismo tope que comprueban las
 * reglas de Firestore. Si se pasara, el usuario vería la
 * previsualizacion con el nombre entero y el mensaje saldría con el
 * nombre partido, sin avisar: mejor que se quede corto antes.
 *
 * Las partes vacías se ignoran, para que no salgan comas sueltas: si
 * no hay calle, el resultado es "Madrid", no ", Madrid".
 *
 * @param {Array<string | undefined | null>} partes el nombre, la calle, la ciudad...
 * @returns {string} como mucho `MAX_LUGAR` caracteres
 */
export function etiquetaDeLugar(partes: (string | undefined | null)[]): string {
  const limpio = partes
    .map((p) => (typeof p === 'string' ? p.replace(/\s+/g, ' ').trim() : ''))
    .filter((p) => p.length > 0);

  // Sin repetir: un sitio puede venir con el nombre en `name` y otra
  // vez en `street` ("Gran Vía" y "Gran Vía, 1"), y puesto dos veces
  // queda "Gran Vía, Gran Vía".
  const sinRepetir = limpio.filter((p, i) => !limpio.slice(0, i).includes(p));

  if (sinRepetir.length === 0) return '';

  // ── SI NO CABE, SE VAN QUITANDO PARTES POR EL FINAL ────────────────
  //
  // Recortar el texto entero por el final tira lo último, que es la
  // ciudad, y la ciudad es justo lo que distingue dos sitios que se
  // llaman igual. Con un nombre enorme, "Gran Vía" a secas se podría
  // estar en Madrid, en Valencia o en medio de la nada.
  //
  // Por eso se va quitando la parte menos específica —la más amplia—
  // Por eso se va quitando la parte menos específica —la más amplia—
  // hasta que el conjunto quepa, y solo si el nombre a secas sigue
  // sin caber se recorta con los tres puntos. Nunca se pierde el
  // nombre: es lo único que identifica el sitio.
  const utiles = [...sinRepetir];

  while (utiles.length > 1) {
    if (utiles.join(', ').length <= MAX_LUGAR) break;

    utiles.pop();
  }

  const texto = utiles.join(', ');

  return texto.length > MAX_LUGAR ? texto.slice(0, MAX_LUGAR - 1).trimEnd() + '…' : texto;
}

/**
 * Si una ubicacion tiene sentido para mandarla a Firestore.
 *
 * @param {object} u
 * @param {number} u.lat
 * @param {number} u.lng
 * @param {number} [u.accuracy]
 * @param {string} [u.place]
 * @returns {boolean}
 */
export function ubicacionPlausible(u: {
  lat: number;
  lng: number;
  accuracy?: number;
  place?: string;
}): boolean {
  if (!u) return false;

  // `Number.isFinite` y no una comparacion, por el NaN. Ver la nota de
  // arriba en la cabecera.
  if (!Number.isFinite(u.lat) || !Number.isFinite(u.lng)) return false;

  if (u.lat < RANGOS.lat.min || u.lat > RANGOS.lat.max) return false;
  if (u.lng < RANGOS.lng.min || u.lng > RANGOS.lng.max) return false;

  if (u.accuracy !== undefined && u.accuracy !== null) {
    if (!Number.isFinite(u.accuracy) || u.accuracy < 0) return false;
  }

  if (u.place !== undefined && u.place !== null) {
    if (typeof u.place !== 'string') return false;
    if (u.place.length > MAX_LUGAR) return false;
  }

  return true;
}

/**
 * El enlace al mapa.
 *
 * Cinco decimales: un grado son unos 111 km y el quinto decimal es del
 * orden de un metro. Con menos, el enlace abriría en la calle de al
 * lado, que es justo lo que pasa con cuatro en un barrio normal.
 *
 * Va a OpenStreetMap y no a Google Maps porque no pide clave de API, no
 * manda la peticion a un tercero con la direccion de quien la pide, y
 * el mapa abre sin publicidad de por medio.
 */
export function enlaceMapa(lat: number, lng: number): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
}