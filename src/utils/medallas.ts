import type { MedalRarity } from '../types/gamification';
import { ORDEN_RAREZA } from './progression';

/**
 * Qué medallas hay que celebrar, y cuáles anotar como ya vistas.
 *
 * ── POR QUÉ ESTÁ SUELTO ───────────────────────────────────────────
 *
 * Porque estaba dentro de un `useEffect` de React, y eso no se puede
 * probar desde Node. Y aquí hay un fallo que SOLO se ve probando: el
 * efecto miraba un `ref` de otro efecto para decidir si era la primera
 * vez, y por eso no se veía a simple vista.
 *
 * ── EL FALLO ──────────────────────────────────────────────────────
 *
 * Las medallas que un usuario ya tenía se celebraban en CADA inicio
 * de sesión. "Primero Voz" es la más visible porque se concede al
 * registrarse: todo el mundo la tiene desde el minuto uno, así que todo
 * el mundo veía el mismo aviso cada vez que entraba.
 *
 * La causa era que "es la primera lectura" se deducía de que el `ref`
 * de la subida de nivel siguiera en `null`. Ese `ref` lo rellena otro
 * efecto, que va antes en el fichero, así que para cualquiera que
 * alguna vez hubiera subido de nivel ya no era `null` en la primera
 * lectura. Y quien nunca hubiera subido de nivel sí recibía el `null`
 * por casualidad, que es lo que hace el fallo parecer intermitente.
 *
 * ── EL ARREGLO ────────────────────────────────────────────────────
 *
 * `esLaPrimeraLectura` lo dice quien lo sabe: el propio efecto, con su
 * propio `ref`, sin mirar lo que haya hecho nadie más. Y las medallas
 * del usuario se apuntan como vistas SIEMPRE, también en la primera
 * lectura, para que si el documento se actualiza un momento después no
 * se celebren como si fueran nuevas.
 */

/** Lo que devuelve: qué celebrar y qué es nuevo. */
export interface DeteccionMedallas {
  /** Los ids a celebrar. Vacío en la primera lectura. */
  celebrar: string[];
  /** Los ids que no se habían visto: hay que apuntarlos. */
  nuevas: string[];
}

/**
 * Qué medallas hay que celebrar.
 *
 * ── POR QUÉ POR ID Y NO POR FECHA ────────────────────────────────
 *
 * Antes se comparaban FECHAS: si la fecha del documento era distinta
 * a la recordada, la medalla se celebraba. Eso aguantaba la sesión,
 * pero no el inicio: basta con que la primera lectura traiga el
 * documento vacío y la segunda lo traiga lleno para que TODAS las
 * medallas parezcan nuevas. Y cada remontaje volvía a empezar.
 *
 * Ahora la pregunta es solo "¿se ha visto este ID alguna vez?". Una
 * medalla que reaparece (con la fecha que sea) no es nueva. Solo es
 * nuevo un ID que nunca se había visto, y solo se celebra si además
 * no es la primera lectura (lo que ya había al entrar es historial).
 *
 * @param vistas       ids que ya se han visto (memoria o persistencia)
 * @param ids          ids que trae el documento ahora
 * @param esLaPrimera  que no se ha leído el documento en esta sesión
 */
export function detectarMedallasNuevas(
  vistas: ReadonlySet<string>,
  ids: string[],
  esLaPrimera: boolean,
): DeteccionMedallas {
  const nuevas = (ids ?? []).filter((id) => !vistas.has(id));

  return { celebrar: esLaPrimera ? [] : nuevas, nuevas };
}

/**
 * Lo mismo para el aviso de subida de nivel.
 *
 * ── POR QUÉ TAMBIÉN ESTE ───────────────────────────────────────────
 *
 * Porque tenía el mismo defecto. Un usuario con `lastLevelUpAt` guardado
 * veía el aviso de "¡Has subido al nivel N!" en cada inicio de sesión:
 * el nivel lo subiría una vez, pero el aviso salía siempre.
 *
 * Con la clave se evita repetir el MISMO aviso dentro de la sesión
 * (por ejemplo, si el documento llega dos veces), que es lo que
 * para lo que se pedía.
 *
 * @param claveActual        `lastLevelUpAt` del documento, como texto
 * @param claveYaVista       la última clave mostrada en esta sesión
 * @param esLaPrimera        que no se ha leído el documento aún
 * @returns la clave a guardar, y si hay que avisar
 */
export function detectarSubidaNivel(
  claveActual: string,
  claveYaVista: string | null,
  esLaPrimera: boolean,
): { nuevaClave: string; avisar: boolean } {
  if (claveActual === claveYaVista) {
    return { nuevaClave: claveYaVista ?? claveActual, avisar: false };
  }

  // La clave se guarda aunque no se avise: el "ya lo he visto" se
  // cumple desde el principio. Si no, bastaría con que la siguiente
  // lectura vieras `null` otra vez para que saliera el aviso.
  return { nuevaClave: claveActual, avisar: !esLaPrimera };
}

/**
 * La medalla más rara de las nuevas.
 *
 * ── POR QUÉ POR EL ORDEN DE RAREZA Y NO POR LA LONGUEZ ────────────
 *
 * Antes se ordenaba por `.rareza.length`, y `rareza` es un TEXTO: eso
 * es comparar el número de letras. "Épica" (5) y "Común" (5) empatan, y
 * "Legendaria" (10) gana a "Rara" (4) por casualidad de cómo están
 * escritas, no por ser más rara.
 *
 * Aquí se usa `ORDEN_RAREZA`, que va DE MÁS A MENOS: la primera es la
 * más rara. Por eso se ordena al revés, restando. Lo que no esté en
 * la lista se trata como la más común, que es lo prudente: no queremos
 * elegir un id desconocido como la mejor.
 *
 * ── POR QUÉ SOLO UNA ──────────────────────────────────────────────
 *
 * Si a la vez salen tres medallas, tres avisos seguidos encima de la
 * pantalla mientras alguien intenta hacer otra cosa. Con una sola, la
 * mejor, se avisa de lo importante y el resto se ve en el perfil.
 *
 * @param ids        ids a celebrar
 * @param catalogo   las medallas conocidas, por id
 */
export function laMasRara<T extends { id: string; rareza: string }>(
  ids: string[],
  catalogo: T[],
): T | undefined {
  const puesto = (rareza: string) => {
    const i = ORDEN_RAREZA.indexOf(rareza as MedalRarity);

    // Lo que no esté en la lista, al final: no gana por ser raro.
    return i === -1 ? ORDEN_RAREZA.length : i;
  };

  return ids
    .map((id) => catalogo.find((m) => m.id === id))
    .filter((m): m is T => Boolean(m))
    .sort((a, b) => puesto(a.rareza) - puesto(b.rareza))[0];
}
