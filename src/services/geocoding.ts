/**
 * Buscar lugares y ponerles nombre.
 *
 * ── POR QUE UN SERVICIO PROPIO Y NO UNO DE PAGOS ────────────────────
 *
 * El proyecto ya trae dos claves externas (GIPHY y Tenor) porque son
 * lo que hacen los GIFs. Para mapas no hace falta ninguna: tanto las
 * teselas como el buscador funcionan con datos abiertos y clave
 * publica. Meter una clave de Google Maps obligaria a pedir una
 * cuenta de pago, a vigilar la cuota y a dejarla escrita en el bundle
 * (una variable VITE_ va incrustada en el JavaScript que descarga
 * cualquiera, y esa clave es de facturacion, no un token de lectura).
 *
 * ── POR QUE PHOTON Y NO NOMINATIM ───────────────────────────────────
 *
 * El buscador va escrito en Photon, no en Nominatim, y no es una
 * preferencia estetica: la politica de uso de Nominatim dice
 * textualmente, en "Unacceptable Use", que el autocompletado en
 * cliente esta prohibido con esa API, porque el servicio publico es
 * el buscador de openstreetmap.org y corre por servidores donados
 * con una capacidad muy justa. Un buscador con retardo es
 * precisamente autocompletado, y hacerlo ahi acaba con el sitio
 * baneado para todo el mundo.
 *
 * Photon esta hecho sobre los mismos datos de OSM y si admite
 * autocompletado, asi que da lo que se necesita sin molestar a nadie.
 * Los dos servicios se pueden cambiar sin tocar codigo, porque la
 * direccion sale de una variable de entorno (ver PHOTON_URL).
 *
 * ── LO QUE NO SE GUARDA ─────────────────────────────────────────────
 *
 * Ni una peticion de este fichero guarda nada. No hay cache en
 * disco, ni historial, ni registro de lo que se ha buscado. La
 * peticion sale de la maquina del usuario y se tira al recibir la
 * respuesta, igual que las de los GIFs. Y solo se lanza cuando el
 * usuario escribe en el buscador o mueve el marcador: abrir el
 * selector no consulta nada por su cuenta.
 */

// Variables que Vite incrusta, como en `services/gifs.ts`.
const ENV = (import.meta.env ?? {}) as Record<string, string | undefined>;

/**
 * Donde vive el geocodificador.
 *
 * Se puede cambiar con `VITE_PHOTON_URL` sin tocar codigo y sin
 * compilar otra vez: es lo que pide la politica de los servicios
 * publicos por si algun dia hay que mudarse a una instancia propia.
 */
const PHOTON_URL = (ENV.VITE_PHOTON_URL ?? 'https://photon.komoot.io').replace(/\/+$/, '');

/**
 * Cuantos resultados se piden y se pintan.
 *
 * Diez es de sobra para elegir un sitio, y cada numero de mas es una
 * respuesta mas grande de bajar para no usar ni la cuarta parte. El
 * limite se manda en la peticion, no se recorta al pintar: asi el
 * servidor no envia lo que se va a descartar.
 */
export const LIMITE_BUSQUEDA = 8;

/**
 * Lo que hay que escribir para que se busque.
 *
 * Con dos letras la lista sale de medio mundo y no ayuda a elegir
 * nada. Es el mismo criterio que usan los buscadores de verdad.
 */
export const MINIMO_BUSQUEDA = 3;

/** Cuánto se espera a que el servidor conteste antes de rendirse. */
const TIEMPO_MS = 12000;

/**
 * ── POR QUÉ NO SE MANDA `lang` ─────────────────────────────────────
 *
 * Se mandó `lang=es` porque la web es en español y parecía lo
 * obvious. Es un error: el servicio solo acepta `default`, `de`, `en` y
 * `fr`, y cualquier otro valor contesta con un 400 y este texto:
 *
 *     "Language is not supported. Supported are: default, de, en, fr"
 *
 * Con eso, todas las peticiones fallaban. El buscador se quedaba
 * siempre en "no hay ningún sitio con ese nombre", y el nombre de un
 * punto suelto no salía nunca, porque las dos cosas usan el mismo
 * servicio.
 *
 * Sin el parámetro se perfectiona el nombre que tiene el sitio en su
 * propia lengua, que es justo lo que se quiere aquí: "Puerta del Sol",
 * "Gran Vía", "Paseo de la Castellana" y "Madrid", todo en español.
 * Para un sitio de fuera, "Brandenburger Tor" se queda en alemán, que
 * es más útil que una traducción mala.
 *
 * El fallo se encontró probando el mapa en un navegador de verdad, no
 * leyendo el código: una comprobación de tipos no dice qué valores
 * acepta un servidor de fuera.
 */

/** Un sitio encontrado por el buscador, o el nombre de un punto. */
export interface Lugar {
  /** Latitud. OJO: OSM las devuelve al reves, ver `aLugar`. */
  lat: number;
  /** Longitud. */
  lng: number;
  /** Lo que se pinta en la tarjeta: "Gran Vía, Madrid". */
  titulo: string;
  /** La calle ovia, si la hay. */
  calle?: string;
  /** La ciudad, el pueblo o el barrio. */
  ciudad?: string;
  /** La direccion tal cual, si la sabe. */
  direccion?: string;
}

// ──────────────────────────────────────────────────────────
// LOS DATOS QUE VIENEN
// ──────────────────────────────────────────────────────────

/**
 * Lo único que se lee de un resultado del servidor.
 *
 * ── POR QUÉ NO SE DECLARA LA FORMA COMPLETA ─────────────────────────
 *
 * Se podría escribir la forma exacta que llega y tipar `coordinates`
 * como `number[]`, y quedaría todo bonito. El problema es que esa forma
 * es una promesa sobre lo que va a mandar un servidor ajeno, y lo que
 * mande es `JSON.parse` de lo que devuelva el otro. Un resultado con
 * `"coordinates": null` —que ya ha pasado en servicios de geocodificación
 * cuando se caen a mitad de una consulta— no entraría en el tipo, pero
 * sí entraría en el programa.
 *
 * Por eso el parámetro es `unknown` y cada campo se comprueba antes de
 * usarse. Cuesta ocho líneas y hace que un día malo del servidor se
 * traduzca en "un resultado menos" en vez de en una pantalla en blanco.
 */
interface FeaturePhoton {
  geometry?: { type?: string; coordinates?: unknown };
  properties?: {
    name?: unknown;
    street?: unknown;
    housenumber?: unknown;
    locality?: unknown;
    district?: unknown;
    city?: unknown;
    state?: unknown;
    country?: unknown;
    postcode?: unknown;
  };
}

/**
 * Un texto del servidor, o `undefined`.
 *
 * No usa `String()` a propósito: si un campo llega con un número o con
 * un objeto, sale `undefined` en vez de un "[object Object]" pintado en
 * la tarjeta de un sitio que sí existe.
 *
 * @param {unknown} v
 * @returns {string | undefined}
 */
function texto(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim().length > 0 ? v.replace(/\s+/g, ' ').trim() : undefined;
}

/**
 * Un lugar, con sus partes ya separadas y las coordenadas en el
 * orden que usa el resto de la web.
 *
 * ── EL ORDEN DE LAS COORDENADAS ─────────────────────────────────────
 *
 * GeoJSON, que es lo que devuelve el servicio, pone las coordenadas
 * como `[longitud, latitud]`. Todo lo demas de la web las tiene al
 * reves: `LocationAttachment` va `lat` y luego `lng`, que es como las
 * escribe la gente y como las lee `navigator.geolocation`.
 *
 * Intercambiarlas aqui no da ningun error visible: Madrid acaba en
 * `-3.70, 40.41` en lugar de `40.41, -3.70`, que sigue siendo un par
 * de numeros validos. Solo se ve al pintarlo, con un marcador en el
 * golfo de Guinea. Por eso el cambio de orden se hace UNA vez, aqui,
 * y hay una prueba que lo comprueba.
 *
 * @param {FeaturePhoton} f el resultado del servidor
 * @returns {Lugar | null} `null` si no trae un punto usable
 */
export function aLugar(f: FeaturePhoton): Lugar | null {
  // Lo que llega no es de fiar, así que antes de tocar nada se
  // comprueba que sea un objeto. Un `null` o un número sueltos en la
  // lista de resultados son cosas que han pasado.
  if (!f || typeof f !== 'object') return null;

  const coords = f.geometry?.coordinates;

  // Sin coordenadas no hay lugar. Una respuesta con `geometry: null`
  // es posible en consultas raras, y se descarta en vez de romperse.
  if (!Array.isArray(coords) || coords.length < 2) return null;

  const [lng, lat] = coords;

  // `Number.isFinite` y no una comparación, por el `NaN`: las dos
  // comparaciones con `NaN` son falsas y un rango comprobaría que el
  // número está dentro porque no está fuera de ninguna parte.
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  // Que el punto esté en la Tierra. El servicio no lo comprobará, pero
  // un cero en la longitud y un latitud de 90 son respuestas que un día
  // se cuelan y hay que filtrar en cuanto se ven.
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  const p = f.properties ?? {};

  const numero = texto(p.housenumber);
  const via = texto(p.street);

  const calle = [via, numero].filter(Boolean).join(' ') || undefined;

  const ciudad =
    texto(p.city) ?? texto(p.locality) ?? texto(p.district) ?? texto(p.state) ?? texto(p.country);

  const codigo = texto(p.postcode);
  const pais = texto(p.country);

  const titulo = texto(p.name) ?? calle ?? ciudad;

  // Un punto sin nombre de ningun tipo no se puede enseñar: se
  // seleccionaria a ciegas.
  if (!titulo) return null;

  const direccion = [codigo, texto(p.city) ?? texto(p.locality), pais].filter(Boolean).join(', ');

  return {
    lat,
    lng,
    titulo,
    ...(calle ? { calle } : {}),
    ...(ciudad ? { ciudad } : {}),
    ...(direccion ? { direccion } : {}),
  };
}

// ──────────────────────────────────────────────────────────
// PETICIONES
// ──────────────────────────────────────────────────────────

/** Quita los query strings que se cuelan al pegar un enlace. */
function soloTexto(t: string): string {
  return t.replace(/\s+/g, ' ').trim().slice(0, 120);
}

/**
 * La respuesta del servidor, convertida y sin repetir sitios.
 *
 * El buscador devuelve a veces varias entradas para el mismo edificio
 * (una por via, otra por el nombre oficial). Si no se quitan, la
 * lista se llena de tres lineas casi iguales y parece que funciona
 * peor de lo que funciona.
 *
 * La deduplicación es por punto redondeado, no por texto: dos sitios
 * con el mismo nombre en barrios distintos son dos sitios de verdad.
 *
 * @param {unknown} json lo que responde el servicio
 * @returns {Lugar[]}
 */
export function aLugares(json: unknown): Lugar[] {
  const lista =
    json && typeof json === 'object' && Array.isArray((json as { features?: unknown }).features)
      ? ((json as { features: FeaturePhoton[] }).features ?? [])
      : [];

  const vistos = new Set<string>();
  const salida: Lugar[] = [];

  for (const f of lista) {
    const lugar = aLugar(f);

    if (!lugar) continue;

    // Cinco decimales son unos metros: mas fino separa dos puntos del
    // mismo portal, que no hace falta distinguir.
    const clave = `${lugar.lat.toFixed(5)}|${lugar.lng.toFixed(5)}`;

    if (vistos.has(clave)) continue;

    vistos.add(clave);
    salida.push(lugar);
  }

  return salida.slice(0, LIMITE_BUSQUEDA);
}

/**
 * La共通 con el text que se ha escrito.
 *
 * @param {string} base la direccion del servicio
 * @param {string} params el query ya montado
 * @param {AbortSignal} [senal]
 * @returns {Promise<Lugar[]>}
 */
async function pedir(base: string, params: string, senal?: AbortSignal): Promise<Lugar[]> {
  // El abort se une al que le pasan para que el llamante pueda
  // cancelar Y el propio fetch pueda cortarse por su cuenta. Sin lo
  // segundo, cancelar deja la conexion abierta hasta que conteste el
  // servidor, que es justo lo que se quiere evitar al escribir rapido.
  const control = new AbortController();
  const mio = new AbortController();
  senal?.addEventListener('abort', () => control.abort(), { once: true });

  const t = setTimeout(() => mio.abort(), TIEMPO_MS);

  try {
    const res = await fetch(`${base}?${params}`, {
      signal: control.signal,
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      // El código se queda en la consola y no en el texto. Un 400 en
      // pantalla le dice a quien está escribiendo que la web está mal,
      // y lo único que puede hacer es otra cosa. En la consola lo ve
      // quien pueda arreglarlo.
      console.error('[Mapa] El buscador de lugares respondió', res.status, await res.text().catch(() => ''));

      throw new Error('No se ha podido buscar ese sitio. Prueba con otro nombre.');
    }

    return aLugares(await res.json());
  } catch (e) {
    // Un `AbortError` por nuestra cuenta (el temporizador) se cuenta
    // como "tarda"; uno pedido por el llamante se propaga tal cual,
    // porque quien cancela ya sabe lo que ha pasado.
    if (e instanceof Error && e.name === 'AbortError') {
      if (senal?.aborted) throw e;
      throw new Error('El buscador de lugares está tardando demasiado.');
    }

    if (e instanceof TypeError) {
      // Sin conexion, DNS mal, CORS. El error real no dice nada
      // entendible y no se enseña nunca.
      throw new Error('No se ha podido conectar para buscar el lugar.');
    }

    throw e;
  } finally {
    clearTimeout(t);
    control.abort();
  }
}

/**
 * Busca un sitio por su nombre o su direccion.
 *
 * `limit` va en la URL y no se recorta al pintar, para que el servidor
 * no mande lo que luego se tira.
 *
 * @param {string} texto lo que ha escrito el usuario
 * @param {AbortSignal} [senal] para cancelar si sigue escribiendo
 * @returns {Promise<Lugar[]>} como mucho `LIMITE_BUSQUEDA` sitios
 */
export function buscarLugares(texto: string, senal?: AbortSignal): Promise<Lugar[]> {
  const limpio = soloTexto(texto);

  if (limpio.length < MINIMO_BUSQUEDA) return Promise.resolve([]);

  const params = new URLSearchParams({
    q: limpio,
    limit: String(LIMITE_BUSQUEDA),
  });

  return pedir(`${PHOTON_URL}/api`, params.toString(), senal);
}

/**
 * Le pone nombre a unas coordenadas sueltas.
 *
 * Sirve para cuando el marcador se pone a mano: las coordenadas
 * solas son un numero, y "Puerta del Sol" es un sitio.
 *
 * ── CUANDO SE LLAMA ─────────────────────────────────────────────────
 *
 * Solo al soltar el marcador, no mientras se mueve. Preguntar por cada
 * fotograma de un arrastre es exactamente el uso que la politica del
 * servicio llama "systematic queries", y ademas no sirve de nada: a
 * medio arrastre el punto todavia no es el final.
 *
 * @param {number} lat
 * @param {number} lng
 * @param {AbortSignal} [senal]
 * @returns {Promise<Lugar | null>} `null` si no se sabe que hay ahi
 */
export async function lugarDeCoordenadas(
  lat: number,
  lng: number,
  senal?: AbortSignal,
): Promise<Lugar | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    limit: '1',
  });

  const lista = await pedir(`${PHOTON_URL}/reverse`, params.toString(), senal);

  return lista[0] ?? null;
}
