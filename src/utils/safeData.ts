// ======================================================
// TEXTO Y LISTAS QUE NUNCA FALLAN
// ======================================================
//
// Los documentos de Firestore llegan sin validar. Un personaje
// creado desde el panel no tenía campo de etiquetas, y un anime
// viejo puede no tener género o categoría.
//
// Con un campo ausente, algo como `doc.tags.map(...)` lanza
// "Cannot read properties of undefined" y React desmonta el
// árbol entero: la web se queda en blanco.
//
// Estas funciones hacen que recorrer datos incompletos no pueda
// romper la interfaz. El precio es cero y el sitio aguanta.

/** Devuelve el texto, o cadena vacía si no es texto. */
export function toText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/** Devuelve una lista de cadenas, o lista vacía si no lo es. */
export function toTextList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

/** ¿El texto contiene la búsqueda? */
export function matchesText(value: unknown, query: string): boolean {
  return toText(value).toLowerCase().includes(query);
}

/** ¿Algún elemento de la lista coincide con la búsqueda? */
export function anyMatches(value: unknown, query: string): boolean {
  return toTextList(value).some((item) => item.toLowerCase().includes(query));
}

/** ¿La lista contiene ese elemento exacto? Sin fallar si no es lista. */
export function listHas(value: unknown, item: string): boolean {
  return toTextList(value).includes(item);
}

export interface PuntoEncuadre {
  x: number;
  y: number;
}

export const CENTRO: PuntoEncuadre = { x: 0.5, y: 0.5 };

/**
 * Lee el punto de enfoque de una imagen y lo devuelve acotado
 * entre 0 y 1.
 *
 * Si el documento no lo tiene, está mal escrito o viene como
 * número suelto, se devuelve el centro. Es un dato opcional que
 * puede faltar en toda la colección, así que nunca puede dar
 * problemas.
 */
export function puntoEncuadre(value: unknown): PuntoEncuadre {
  if (!value || typeof value !== 'object') return CENTRO;

  const v = value as { x?: unknown; y?: unknown };
  const num = (n: unknown) =>
    typeof n === 'number' && Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : null;

  const x = num(v.x);
  const y = num(v.y);

  return { x: x ?? CENTRO.x, y: y ?? CENTRO.y };
}

/**
 * El `object-position` de una imagen, a partir de su punto de enfoque.
 *
 * ── POR QUÉ VIVE AQUÍ Y NO DULPLICADO ──────────────────────────────
 *
 * Estaba copiado literalmente en `AnimeWiki` y en `ProfileView`, y por
 * eso cuatro sitios más se quedaron sin él: el navegador del catálogo,
 * la barra lateral y los dos buscadores pintaban la portada sin
 * encuadre, mientras la ficha del wiki sí lo aplicaba. El mismo dato,
 * aplicado en un sitio y no en el otro según dónde mires.
 *
 * Aquí está una vez, junto a `puntoEncuadre`, que es de donde sale.
 *
 * ── PARA QUÉ SIGUE VALIENDO CON EL EDITOR DE RECORTE ──────────────
 *
 * Para las imágenes que ya estaban subidas SIN recortar, que son las
 * que todavía necesitan esto. Las nuevas se guardan ya recortadas a la
 * proporción de su sitio, y entonces no hay nada que recortar, así que
 * el `object-position` no llega a hacer nada. No estorba.
 *
 * Por eso display y editor no se pisan: este solo mueve una imagen que
 * sigue siendo más grande que su caja.
 */
export function encuadre(focus: unknown): React.CSSProperties {
  const p = puntoEncuadre(focus);

  return { objectPosition: `${p.x * 100}% ${p.y * 100}%` };
}
