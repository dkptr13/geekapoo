// ======================================================
// NOTICIAS RSS: LEER FEEDS Y DEJARLOS LIMPIOS
// ======================================================
//
// Este fichero hace la parte que se puede equivocar sin que se vea:
// quitar el HTML de un resumen, cortarlo donde se pueda leer, y
// decidir el id del documento a partir del enlace.
//
// Sale separado de index.ts por el mismo motivo que
// services/ubicacion.ts en la web: para poder probarlo. Aquí no se
// importa Firebase ni se escribe nada, así que la prueba lo carga
// desde Node sin emulador y sin red.
//
// Lo que escribe en Firestore se queda en index.ts, que sí necesita el
// Admin SDK.
// ======================================================

// `createHash` viene del modulo de Node y no del `crypto` del
// navegador, que en Cloud Functions no existe. Se usa para el id de
// cada noticia a partir de su enlace, que es lo que evita que la
// funcion cree duplicados cada dos horas.
import { createHash } from 'crypto';

// El unico paquete de tercero del proyecto. El resto de funciones no
// necesita ninguno.
import Parser from 'rss-parser';

// Trae las noticias de uno o varios feeds RSS y las deja en la
// colección `news`, para que el navegador solo lea de Firestore.
//
// ── POR QUÉ UNA FUNCIÓN Y NO EL NAVEGADOR ───────────────────────────
//
// Un feed RSS no manda cabeceras CORS, así que un `fetch` desde la web
// lo bloquea. Y si no lo bloquea, se puede rastrear quién está
// leyendo, porque cada visita sería una petición con la dirección de
// quien la hace. Trayendo el feed aquí se resuelve lo de CORS y además
// nadie en la web necesita saber que las noticias vienen de fuera.
//
// ── POR QUÉ NO SE PIDEN LOS FEEDS EN CADA VISITA ───────────────────
//
// Porque el feed no cambia entre visitas, y porque hacerlo convertiría
// cada carga de la portada en una petición a un servidor ajeno. Aquí se
// lee una vez cada dos horas y se guarda.
//
// ── LOS IDs ─────────────────────────────────────────────────────────
//
// El id del documento es un hash del enlace. Eso es lo que hace que
// ejecutar la función cada dos horas no cree 137 noticias nuevas cada
// vez: el mismo enlace da siempre el mismo id, y escribir dos veces en
// el mismo documento actualiza en lugar de duplicar.
//
// El id va con prefijo de fuente, y no solo con el enlace, porque dos
// feeds distintos pueden traer la misma URL. Con el prefijo, cada
// fuente tiene su copia y no se pisan entre ellas.


/** Una fuente de noticias. Para añadir otra, una línea más aquí. */
export interface FuenteRss {
  /** Lo que se guarda en `sourceName` y lo que se enseña en el widget. */
  nombre: string;
  /** La dirección del feed. */
  url: string;
}

/**
 * Las fuentes de las que se lee.
 *
 * ── OJO CON EL PARÁMETRO `ann-edition=es` ───────────────────────────
 *
 * No es que Anime News Network sirva su edición española por aquí: no
 * lo hace. El parámetro es obligatorio —sin él el feed vuelve vacío—,
 * pero lo que sale sigue siendo en inglés, y el propio feed lo declara
 * con `<language>en-US</language>`.
 *
 * Está como está porque es el que funciona. Si algún día se cambia,
 * el nombre de la fuente es lo primero que hay que revisar: si el
 * contenido pasa a estar en español, `Anime News Network` se queda
 * corto.
 */
export const FUENTES_RSS: FuenteRss[] = [
  {
    // En inglés, y muy completo: avisa de cada adelanto de una
    // temporada nueva el mismo día. Se queda por eso.
    nombre: 'Anime News Network',
    url: 'https://www.animenewsnetwork.com/all/rss.xml?ann-edition=es',
  },
  {
    // En español, que es lo que se lee de verdad aquí. Su URL no se
    // deduce: no es `/rss.xml` sino `/anime/feed/`, y sale del
    // `<link rel="alternate">` que lleva el HTML de la sección.
    //
    // Se eligió un medio de información y no un blog de fans porque hay
    // muchos feeds en español que son de sitios de streaming ilegal, y
    // enlazarlos desde aquí es justo el tipo de cosa que no compensa
    // por tener más noticias.
    nombre: 'Areajugones',
    url: 'https://areajugones.sport.es/anime/feed/',
  },
];

/**
 * Cuántas noticias se guardan como máximo.
    // En inglés, y muy completo: es el que avisa de cada adelanto de
 * El widget solo enseña 5, pero guardar solo esas sería un error: cada
 * vez que saliera una noticia nueva borraría las anteriores, y al
 * volver a la pestaña un rato después se encontrarían huecos.
 *
 * 120 es unas dos semanas de este feed, que publica unas cinco o seis
 * al día. Es un tope, no un objetivo: la función borra lo que sobra, y
 * por eso la colección no crece sin límite.
 */
export const MAX_NOTICIAS_GUARDADAS = 120;

/** Cuánto se corta el resumen. */
export const RESUMEN_MAX = 200;

/** Cuánto se espera a que un feed conteste antes de rendirse. */
const TIEMPO_FEED_MS = 20000;

/** Se leen de golpe los items de cada feed, para no ir de uno en uno. */
export const LOTE = 400;

/**
 * El id de un documento, a partir del enlace.
 *
 * ── POR QUÉ UN HASH Y NO EL ENLACE LIMPIO ──────────────────────────
 *
 * Porque los id de Firestore no admiten `/`, y todos los enlaces de las
 * noticias llevan `/`. Se podría cambiar por `_`, pero eso es capaz de
 * colisionar con dos enlaces distintos y, sobre todo, deja el enlace
 * entero dentro del id, que acaba en los registros y en las cuotas.
 *
 * Un hash de 32 caracteres, en hexadecimal, es un billón de
 * combinaciones. Los ids van a ser algo como `ann-3f9a2b1c...`.
 *
 * @param {string} fuente el nombre de la fuente
 * @param {string} enlace el enlace de la noticia
 * @returns {string} el id del documento
 */
export function idDeNoticia(fuente: string, enlace: string): string {
  const hash = createHash('sha256')
    .update(`${fuente}|${enlace}`)
    .digest('hex')
    .slice(0, 32);

  // El prefijo es el nombre de la fuente en minusculas y sin espacios,
  // recortado: sirve para leer de un vistazo de dónde sale cada cosa en
  // la consola de Firebase, y no puede colisionar porque el hash ya
  // incluye el nombre.
  const prefijo = fuente.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 12) || 'rss';

  return `${prefijo}-${hash}`;
}

/**
 * Quita el HTML y deja el texto limpio.
 *
 * ── POR QUÉ HAY QUE HACERLO ────────────────────────────────────────
 *
 * Porque el campo `description` de un feed es HTML: trae `<p>`, `<a>`
 * y entidades como `&#39;`. Si eso se guarda tal cual y luego se pinta,
 * sale el HTML en crudo en la tarjeta; y si se pinta con
 * `dangerouslySetInnerHTML`, es un agujero de XSS con un RSS ajeno como
 * fuente.
 *
 * Aquí se quita en el servidor, antes de guardar. En el cliente no hay
 * ni una sola etiqueta, y se puede pintar con texto normal sin
 * dangerouslySetInnerHTML.
 *
 * Los `<script>` y los `style` se quitan ENTEROS, con su contenido
 * incluido, en vez de quedarse sin etiquetas: en un feed de la web
 * abierta, `alert(1)` dentro de un script es texto que acaba en el
 * resumen de la tarjeta.
 *
 * @param {string} sucio el HTML del feed
 * @returns {string} texto plano, de una línea
 */
export function limpiarResumen(sucio: string): string {
  return sucio
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    // Las entidades comunes del RSS. Las numéricas se pasan por
    // `String.fromCharCode` porque no hay un equivalente de HTML en
    // Node que no sea una dependencia más.
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * El resumen, cortado en un punto que se pueda leer.
 *
 * ── POR QUÉ SE CORTA EN UN PUNTO Y NO EN MEDIO DE UNA PALABRA ──────
 *
 * Por lo mismo que en los titulares: cortar "Season 2 Anime Series" por
 * la mitad y poner "..." encima da "Season 2 Anime Ser...", que no dice
 * nada. Buscando el último punto antes del tope, el resumen termina
 * hablando de algo.
 *
 * ── Y SI NO HAY NINGÚN PUNTO ───────────────────────────────────────
 *
 * Se corta por la última palabra entera, que es el peor de los casos
 * pero sigue siendo texto. Y si aun así no cabe, se corta a lo bruto:
 * un resumen de 4000 caracteres tampoco cabe en una tarjeta.
 *
 * @param {string} texto el resumen ya sin HTML
 * @returns {string} como mucho `RESUMEN_MAX` caracteres
 */
export function recortarResumen(texto: string): string {
  if (texto.length <= RESUMEN_MAX) return texto;

  const trozo = texto.slice(0, RESUMEN_MAX);

  // El último punto, pero sin contar el del final. Y sin quedarse con
  // un texto de cinco caracteres, que no es un resumen.
  const punto = trozo.lastIndexOf('.', RESUMEN_MAX - 1);

  if (punto > RESUMEN_MAX * 0.5) return `${trozo.slice(0, punto + 1)}…`;

  const espacio = trozo.lastIndexOf(' ', RESUMEN_MAX - 1);

  if (espacio > RESUMEN_MAX * 0.5) return `${trozo.slice(0, espacio)}…`;

  // Sin punto ni palabras, que es un texto de una sola palabra larguísima
  // o de caracteres sueltos. Aquí el corte es a lo bruto, y se corta en
  // `RESUMEN_MAX - 1` y no en `RESUMEN_MAX` porque los puntos
  // suspensivos también cuentan: con el corte a lo bruto, `slice(0, 200)
  // + '…'` mide 201 y el resumen se pasa del tope que se había
  // prometido, que es justo lo que se comprueba en la prueba.
  return `${trozo.slice(0, RESUMEN_MAX - 1)}…`;
}

/** Un item del feed, ya limpio y listo para guardar. */
export interface Noticia {
  titulo: string;
  resumen: string;
  enlace: string;
  fuente: string;
  /** Fecha de publicación en ISO, que es como se ordena. */
  fecha: string;
}

/**
 * Qué se guarda de un feed.
 *
 * Se descartan los items sin enlace o sin título, que no se pueden
 * ni enlazar ni enseñar. También los que no tienen fecha válida: sin
 * fecha no hay forma de ordenarlos y acabarían al final de la lista
 * para siempre, y una noticia sin fecha en un widget ordenado por
 * fecha es una noticia que nadie encuentra.
 *
 * @param {FuenteRss} fuente la fuente de la que vienen
 * @returns {Promise<Noticia[]>} las noticias de esa fuente
 */
export async function leerFeed(fuente: FuenteRss): Promise<Noticia[]> {
  const control = new AbortController();
  const guarda = setTimeout(() => control.abort(), TIEMPO_FEED_MS);

  try {
    const xml = await fetch(fuente.url, {
      signal: control.signal,
      headers: {
        // Sin esto hay feeds que devuelven HTML en vez de RSS, y el
        // error sale como "no se encontró ningún item" en lugar de
        // "el servidor devolvió otra cosa", que es lo que pasó.
        'User-Agent': 'geekapoo.com RSS reader (+https://geekapoo.com)',
        Accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
      },
    });

    if (!xml.ok) {
      throw new Error(`${fuente.nombre} respondió ${xml.status}`);
    }

    const cuerpo = await xml.text();

    const parser = new Parser();

    const feed = await parser.parseString(cuerpo);

    const salida: Noticia[] = [];

    for (const item of feed.items ?? []) {
      const enlace = (item.link ?? '').trim();
      const titulo = (item.title ?? '').replace(/\s+/g, ' ').trim();

      if (!enlace || !titulo) continue;
      if (!/^https?:\/\//i.test(enlace)) continue;

      // La fecha del feed viene en formato RFC 822 ("Thu, 08 Oct 2026
      // 12:00:00 -0400"). `toISOString()` la deja en UTC y en el
      // formato que ordena bien como texto. Si no hay fecha, no vale.
      const cuando = item.pubDate ? new Date(item.pubDate) : null;

      if (!cuando || Number.isNaN(cuando.getTime())) continue;

      salida.push({
        titulo,
        resumen: recortarResumen(limpiarResumen(item.contentSnippet ?? item.content ?? '')),
        enlace,
        fuente: fuente.nombre,
        fecha: cuando.toISOString(),
      });
    }

    return salida;
  } finally {
    clearTimeout(guarda);
  }
}
