// Dónde empieza lo nuevo en una conversación, y cómo se llama.
//
// ── POR QUÉ ESTÁ SUELTO ───────────────────────────────────────────
//
// Porque dentro de un componente de React no se puede probar. Y aquí
// hay un detalle que solo se ve con los datos delante:
//
//   · La barra se coloca con la marca de lectura de ANTES de abrir la
//     conversación.
//   · En cuanto se marca como leído, esa marca avanza y la barra se
//     calcularía contra sí misma, desapareciendo al instante.
//
// Por eso esta función NO lee el estado actual: recibe la frontera
// que el contexto congeló al abrir el chat.
//
// ── LO QUE NO PUEDE HACER ESTE ARCHIVO ────────────────────────────
//
// No toca Firestore, no dibuja nada y no sabe de chats. Solo mira una
// lista de mensajes y dice dónde está la frontera.

// Lo mínimo de un mensaje para saber si es nuevo. Evita arrastrar
// aquí el tipo entero del chat, que además crece con cada añadido.
export interface MensajeLectura {
  id: string;
  senderId: string;
  /** Fecha ISO. */
  createdAt: string;
}

/** Dónde parte la barra de "mensajes nuevos". */
export interface CorteNuevos {
  /**
   * Índice del primer mensaje nuevo dentro del array, o -1 si no hay
   * ninguno.
   *
   * La barra se pinta ANTES de este índice, así que el primer
   * mensaje nuevo queda debajo, que es lo que se pidió.
   */
  indice: number;

  /** Cuántos mensajes nuevos hay desde ahí. */
  total: number;
}

/** Cuando no hay nada nuevo. Se reutiliza para no crear objetos nuevos. */
export const SIN_NUEVOS: CorteNuevos = { indice: -1, total: 0 };

/**
 * Busca el primer mensaje que todavía no se había leído.
 *
 * ── LAS TRES REGLAS ──────────────────────────────────────────────
 *
 *   1. Solo cuenta lo que viene de OTRO. Un mensaje tuyo es tuyo:
 *      lo escribiste tú, no hay nada que descubrir.
 *   2. Un mensaje es nuevo si su fecha es POSTERIOR a la marca de
 *      lectura. Anterior o igual ya estaba leído.
 *   3. Si no hay marca de lectura, TODOS los mensajes de los demás
 *      son nuevos. Es lo que pasa con la primera conversación: la
 *      marca solo se pone al crearla, y para quien la acepta no
 *      existe hasta que lee.
 *
 * ── LA MARCA PUEDE NO LLEGAR ──────────────────────────────────────
 *
 * La marca viene de Firestore como texto, pero no hay ninguna
 * garantía de que siga siendo una fecha: puede haber quedado a medias
 * una escritura, o un documento antiguo con otro formato.
 *
 * Por eso hay que distinguir TRES estados y no dos. Con dos, la marca
 * rota se confundía con "no hay marca" y toda la conversación salía
 * como nueva, en una conversación que el usuario lleva leyendo
 * semanas. Con tres, la marca rota se trata como leída y la barra no
 * sale: es lo prudente, porque inventarse un historial de "nuevos"
 * es peor que no avisar de uno.
 */
export function corteDeNuevos(
  mensajes: MensajeLectura[],
  readAt: string | null | undefined,
  miUid: string | null | undefined,
): CorteNuevos {
  if (!mensajes || mensajes.length === 0) return SIN_NUEVOS;

  // Hay TRES estados de la marca, no dos, y confundirlos rompe:
  //
  //   · No hay marca (undefined, null, ""): nunca has leído esta
  //     conversación. Todo lo del otro es nuevo. Es el caso normal de
  //     la primera conversación, porque la marca solo la escribe quien
  //     creó el chat.
  //   · La marca existe y se entiende: se compara.
  //   · La marca existe pero NO se entiende: está corrupta. Entonces
  //     no se da por leída, que sería inventarse un historial entero
  //     de "nuevos" encima de una conversación que el usuario lleva
  //     leyendo semanas. Se trata como leída: la barra no sale.
  const hayMarca = typeof readAt === 'string' && readAt.trim() !== '';
  const limite = hayMarca ? Date.parse(readAt as string) : NaN;
  const marcaRota = hayMarca && Number.isNaN(limite);

  if (marcaRota) return SIN_NUEVOS;

  let indice = -1;
  let total = 0;

  for (let i = 0; i < mensajes.length; i += 1) {
    const m = mensajes[i];

    // Los tuyos no cuentan, aunque sean posteriores a la marca.
    if (miUid && m.senderId === miUid) continue;

    const at = Date.parse(m.createdAt);
    if (Number.isNaN(at)) continue;

    // Sin marca, todo lo de los demás es nuevo.
    if (hayMarca && at <= limite) continue;

    if (indice === -1) indice = i;
    total += 1;
  }

  if (indice === -1) return SIN_NUEVOS;

  return { indice, total };
}

/**
 * El texto de la barra.
 *
 * El plural tiene que estar bien: "1 mensajes nuevos" en una barra
 * que separa un solo mensaje se lee como un error de la web, y es
 * justo lo que aparece al recibir el primer mensaje en una
 * conversación.
 */
export function textoDeNuevos(total: number): string {
  if (total <= 1) return '1 mensaje nuevo';

  return `${total} mensajes nuevos`;
}

/**
 * Cuántos mensajes nuevos hay sin mirar la lista entera.
 *
 * Es lo mismo que `corteDeNuevos(...).total`, pero sin recorrerla dos
 * veces. Se usa para pintar el contador del rooms list, donde solo
 * hace falta el número y no la posición.
 */
export function cuentaDeNuevos(
  mensajes: MensajeLectura[],
  readAt: string | null | undefined,
  miUid: string | null | undefined,
): number {
  return corteDeNuevos(mensajes, readAt, miUid).total;
}
