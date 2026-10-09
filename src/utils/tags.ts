// ======================================================
// ETIQUETAS DE PERSONAJES
// ======================================================
// Las etiquetas son texto libre: no hay una lista cerrada, y el
// autor decide. "#Destacados", "#Meme Queen" o "#Consejo
// Estudiantil" salen bajo el nombre del personaje en la wiki, y el
// buscador las recorre para encontrarlo.
//
// Aquí viven las dos cosas que el panel y el servicio necesitan
// ponerse de acuerdo: el límite de caracteres y cómo se limpia
// una lista antes de escribirla en Firestore. Si el límite
// estuviera duplicado en los dos sitios, acabaría siendo distinto
// en cada uno: el panel dejaría escribir 60 caracteres y el
// servicio los recortaría sin avisar.

/** Caracteres por etiqueta. Es una chapa pequeña bajo el nombre. */
export const MAX_TAG = 40;

/**
 * Etiqueta que el filtro "Destacados" de la wiki reconoce.
 *
 * Está escrito en los dos sitios (el filtro de la wiki y la
 * sugerencia del panel) porque en la wiki es una palabra exacta
 * que además se compara con `listHas`: "destacados" en minúscula no
 * cuenta. Se ofrece como sugerencia justamente para que nadie
 * tenga que acordarse de cómo se escribe.
 */
export const TAG_DESTACADOS = 'Destacados';

/**
 * Limpia una lista de etiquetas para guardarla.
 *
 * Quita los "#" de delante, recorta los espacios, corta por el
 * límite y quita las repetidas sin mirar mayúsculas: en la wiki
 * "Meme Queen" y "meme queen" son dos etiquetas distintas y en el
 * buscador solo aparecería una. Se queda la primera, que es la que
 * ha escrito el autor.
 */
export function normalizaTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const vistas = new Set<string>();

  return value
    .map((tag) =>
      (typeof tag === 'string' ? tag : '')
        .trim()
        .replace(/^#+/, '')
        .slice(0, MAX_TAG),
    )
    .filter((tag) => {
      if (!tag) return false;
      const clave = tag.toLowerCase();
      if (vistas.has(clave)) return false;
      vistas.add(clave);
      return true;
    });
}