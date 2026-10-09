// Cuándo se puede borrar un mensaje para todos, sin servidor.
//
// ── POR QUÉ ESTÁ SUELTO ───────────────────────────────────────────
//
// Porque la ventana de 2 horas tiene bordes exactos (a los 10
// minutos sí, a las 2 horas justas NO) y eso solo se fija probando.
// Aquí vive la cuenta que usa el cliente para ENSEÑAR o esconder la
// opción; la que MANDA es la del servidor
// (`eliminarMensajeParaTodos` en `functions/`), que repite la
// comprobación con su propio reloj.
//
// ── LO QUE NO DECIDE ESTE ARCHIVO ─────────────────────────────────
//
// Ni quién es miembro, ni si el mensaje existe, ni si ya se borró.
// Eso lo sabe el servidor leyendo Firestore. Aquí solo: autoría y
// plazo, con fechas que pueden venir rotas.

/** Dos horas en milisegundos. El plazo de borrar para todos. */
export const VENTANA_BORRADO_MS = 2 * 60 * 60 * 1000;

/** Lo mínimo de un mensaje para decidir. */
export interface MensajeBorrable {
  senderId: string;
  /** Fecha ISO de creación. */
  createdAt: string;
}

/**
 * Si `uid` puede pedir el borrado para todos de `mensaje`.
 *
 * Dos condiciones, y las dos a la vez:
 *
 *   1. Es el autor. Un receptor nunca puede, tenga la edad que
 *      tenga el mensaje.
 *   2. No han pasado 2 horas desde `createdAt`. A las 2 horas
 *      JUSTAS ya no (`<` estricto, no `<=`): el plazo es "menos
 *      de 2 horas", no "hasta 2 horas".
 *
 * Una fecha ilegible o ausente cierra la puerta: sin creación
 * fiable no hay borrado global. Es lo prudente, porque un mensaje
 * viejo sin fecha pasaría por reciente si se tratara como nuevo.
 *
 * @param mensaje  el mensaje candidato
 * @param uid      quien lo pide (null/undefined = nadie)
 * @param ahoraMs  para probar; por defecto el reloj actual
 */
export function puedeBorrarParaTodos(
  mensaje: MensajeBorrable,
  uid: string | null | undefined,
  ahoraMs: number = Date.now(),
): boolean {
  if (!uid || mensaje.senderId !== uid) return false;

  const creado = Date.parse(mensaje.createdAt);

  if (Number.isNaN(creado)) return false;

  return ahoraMs - creado < VENTANA_BORRADO_MS;
}
