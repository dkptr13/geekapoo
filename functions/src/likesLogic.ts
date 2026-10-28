// ======================================================
// LÓGICA PURA DE LOS "ME GUSTA"
// ======================================================
//
// Vive aparte de los triggers para poder comprobarla sin emulador:
// qué ha pasado con un documento de "me gusta" y cómo se convierte
// la lista de documentos de una subcolección en el `likedBy` que se
// guarda en el padre.
//
// El punto importante es que la lista se RECALCULA entera desde los
// documentos, no se suma o resta un delta. Así un trigger repetido
// (Firestore entrega "al menos una vez") o dos "me gusta" a la vez
// no pueden dejar el contador desfasado.

/** Qué ha pasado con el documento de un "me gusta". */
export type AccionLike = 'crear' | 'borrar' | null;

/**
 * Deduce la acción a partir de si el documento existía antes y
 * existe después.
 *
 * - `false → true`: se ha puesto el "me gusta".
 * - `true → false`: se ha quitado.
 * - Cualquier otra combinación no cambia el estado (un `update` no
 *   está permitido por las reglas, pero el trigger puede recibirlo
 *   desde la consola de administración).
 */
export function accionDeLike(
  antesExiste: boolean,
  despuesExiste: boolean,
): AccionLike {
  if (!antesExiste && despuesExiste) return 'crear';
  if (antesExiste && !despuesExiste) return 'borrar';
  return null;
}

/**
 * Ids de los documentos de una subcolección `likes`, listos para
 * guardarlos como `likedBy`.
 *
 * Se eliminan duplicados (no debería haberlos: el id es el uid, pero
 * un documento antiguo o una importación podría repetirlos), se
 * descartan valores que no sean textos y se ordenan. El orden fijo
 * evita que dos ejecuciones con el mismo contenido escriban arrays
 * distintos y provoquen escrituras que no cambian nada.
 */
export function idsDeLikes(ids: Iterable<unknown>): string[] {
  const limpios = new Set<string>();

  for (const id of ids) {
    if (typeof id === 'string' && id.length > 0) limpios.add(id);
  }

  return [...limpios].sort();
}

/**
 * Si un cambio de "me gusta" debe pagar o retirar XP, mirando el
 * estado FINAL de la subcolección.
 *
 * Los triggers pueden llegar desordenados o repetidos. Si alguien da
 * y quita el "me gusta" antes de que corra el primer trigger, la
 * creación ya no representa un "me gusta" real: el estado final no
 * lo contiene y no se paga nada. Al revés, si un borrado y una alta
 * se cruzan, el estado final manda.
 *
 * Esto solo decide el XP. El contador del padre se recalcula igual,
 * porque el documento de la subcolección ya es la fuente de verdad.
 */
export function debeProcesarLike(
  accion: AccionLike,
  liker: string,
  likedByFinal: readonly string[],
): boolean {
  if (!accion) return false;
  const sigue = likedByFinal.includes(liker);
  return accion === 'crear' ? sigue : !sigue;
}
