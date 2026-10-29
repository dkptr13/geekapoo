// El texto que se guarda al citar un mensaje, sin servidor.
//
// ── POR QUÉ ESTÁ SUELTO ───────────────────────────────────────────
//
// Porque la cita tiene dos decisiones con borde que solo se fijan
// probando: qué se enseña cuando el mensaje no tiene texto (una foto
// no se puede "citar" con palabras) y qué pasa si el citado se
// borra después (no puede filtrar por la cita lo que el borrado
// quitó).
//
// ── TEXTO COMPLETO Y FRAGMENTO ────────────────────────────────────
//
// La cita guarda DOS cosas con el mismo contenido y distinto uso:
//
//   · `texto`   → el texto canónico COMPLETO. Las reglas lo comparan
//                 exacto con el mensaje citado. No se puede recortar:
//                 las reglas no tienen `slice`/`substring` y no
//                 podrían comprobar un prefijo.
//   · `snippet` → lo que pintan los mensajes antiguos. Ya no se
//                 escribe; al leer se prefiere `texto`.
//
// El fragmento para la vista sí se recorta (`MAX_CITA`), pero eso es
// una decisión de presentación, no de seguridad.

/** Lo mínimo de un mensaje para citarlo. */
export interface MensajeCitable {
  id: string;
  senderName: string;
  body: string;
  gif?: unknown;
  imageUrl?: string;
  location?: unknown;
  poll?: { question?: unknown } | null;
  tierList?: { title?: unknown } | null;
}

/** Cuánto del texto se enseña en la cita. */
export const MAX_CITA = 120;

/**
 * El texto canónico de un mensaje, sin recortar.
 *
 * Es exactamente lo que comparan las reglas contra `messages/{id}`.
 * Por eso tiene que replicar la misma elección que
 * `textoCanonicoDeMensaje` en `firestore.rules`: primero el cuerpo
 * (sin espacios en los extremos) y, si no hay, una descripción del
 * adjunto. Vacío total no debería llegar (las reglas exigen
 * contenido), pero si llega no rompe: devuelve "".
 */
export function textoParaCita(mensaje: MensajeCitable): string {
  const texto = (mensaje.body ?? '').trim();

  if (texto) return texto;
  if (typeof mensaje.imageUrl === 'string' && mensaje.imageUrl.length > 0) return '[Foto]';
  if (mensaje.gif) return 'GIF';
  if (mensaje.location) return 'Ubicación';
  if (mensaje.poll) {
    const pregunta = typeof mensaje.poll.question === 'string' ? mensaje.poll.question.trim() : '';
    return pregunta ? `📊 ${pregunta}` : '📊 Encuesta';
  }
  if (mensaje.tierList) {
    const titulo = typeof mensaje.tierList.title === 'string' ? mensaje.tierList.title.trim() : '';
    return titulo ? `🏆 ${titulo}` : '🏆 Tier list';
  }

  return '';
}

/**
 * El fragmento de un mensaje para pintarlo en la cita.
 *
 * Es el texto canónico recortado. La garantía de que la cita
 * corresponde al mensaje real la da `texto`; esto es solo la vista.
 */
export function fragmentoParaCita(mensaje: MensajeCitable): string {
  return textoParaCita(mensaje).slice(0, MAX_CITA);
}

/**
 * Qué se pinta en la cita si el citado ya no está visible.
 *
 * Si el mensaje citado sigue en la lista y está borrado para
 * todos, la cita guardada enseñaría el texto que el borrado quitó.
 * En ese caso se pinta el marcador y no el fragmento.
 *
 * @param citadoEl borrado del citado, o `undefined` si ya no está
 *   en la lista (antiguo o vaciado: se enseña lo guardado tal cual)
 */
export function citaVisible(
  snippet: string,
  citadoBorradoParaTodos: boolean | undefined,
): string {
  if (citadoBorradoParaTodos) return 'Este mensaje fue eliminado';

  return snippet;
}
