// El fragmento que se guarda al citar un mensaje, sin servidor.
//
// ── POR QUÉ ESTÁ SUELTO ───────────────────────────────────────────
//
// Porque la cita tiene dos decisiones con borde que solo se fijan
// probando: qué se enseña cuando el mensaje no tiene texto (una foto
// no se puede "citar" con palabras) y qué pasa si el citado se
// borra después (no puede filtrar por la cita lo que el borrado
// quitó).

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

/** Cuánto del texto se guarda en la cita. */
export const MAX_CITA = 120;

/**
 * El fragmento de un mensaje para citarlo.
 *
 * Con texto, el texto recortado. Sin texto, lo que lleva: una foto
 * citada como "[Foto]" dice qué era sin inventar palabras. Vacío
 * total no debería llegar (las reglas exigen contenido), pero si
 * llega no rompe: devuelve "".
 */
export function fragmentoParaCita(mensaje: MensajeCitable): string {
  const texto = (mensaje.body ?? '').trim();

  if (texto) return texto.slice(0, MAX_CITA);
  if (mensaje.imageUrl) return '[Foto]';
  if (mensaje.gif) return 'GIF';
  if (mensaje.location) return 'Ubicación';
  if (mensaje.poll) {
    const pregunta = typeof mensaje.poll.question === 'string' ? mensaje.poll.question.trim() : '';
    return pregunta ? `📊 ${pregunta}`.slice(0, MAX_CITA) : '📊 Encuesta';
  }
  if (mensaje.tierList) {
    const titulo = typeof mensaje.tierList.title === 'string' ? mensaje.tierList.title.trim() : '';
    return titulo ? `🏆 ${titulo}`.slice(0, MAX_CITA) : '🏆 Tier list';
  }

  return '';
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
