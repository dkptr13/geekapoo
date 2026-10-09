import type { ReactionType } from './index';

/**
 * TIPOS DE NOTIFICACIÓN
 * ====================
 *
 * ── Por qué van en `users/{uid}/notifications/` ──────────────
 *
 * Y no en una colección plana `notifications/`, que es lo que se
 * suele hacer primero: con una colección plana hay que filtrar por
 * `recipientId`, y eso obliga a traerse TODAS las notificaciones de
 * TODOS los usuarios para teaches las tuyas. En una comunidad
 * activa eso son miles de documentos por lectura, y encima las
 * reglas no pueden impedir que alguien lea las de otro: haría
 * falta un filtro en la consulta que el usuario pueda quitar.
 *
 * Con la subcolección, la propia ruta ya dice de quién es, y las
 * reglas son una comparación de uid. Es el mismo criterio que ya
 * usa el proyecto para `rewardLedger` y `blocked`.
 *
 * ── Quién escribe ──────────────────────────────────────────
 *
 * SOLO el servidor (Cloud Functions con Admin SDK). El cliente no
 * puede crear ni borrar notificaciones, y solo puede tocar el
 * campo `read` de las suyas. Está en las reglas, y es lo que
 * impide la TONtería de las menciones: si el navegador pudiera
 * escribir, bastaría un `for` para mandarle cien notificaciones a
 * otro usuario.
 *
 * ── Los ids son deterministas ───────────────────────────────
 *
 * El id del documento sale del contenido que lo provocó (la
 * respuesta, la mención, el like), no de un `doc()` vacío. Es lo
 * que hace tres cosas a la vez, y las tres importan:
 *
 *   1. Si el trigger se dispara dos veces (Firestore entrega los
 *      eventos "al menos una vez"), la segunda escritura actualiza
 *      el mismo documento en vez de duplicar la notificación.
 *   2. Cambiar una reacción de 🔥 a 😂 no crea otra
 *      notificación: el id no lleva el tipo de reacción.
 *   3. Quitar un "Me gusta" y volver a ponerlo no apila avisos.
 *
 * Lo mismo que hace `reactionDocId` con las reacciones.
 */

export type NotificationType =
  | 'comment_reply'
  | 'comment_thread'
  | 'mention'
  /** Alguien te ha seguido. El único aviso sin contenido asociado. */
  | 'follow'
  | 'post_like'
  | 'post_reaction'
  | 'comment_like'
  | 'comment_reaction'
  | 'level_up'
  | 'achievement'
  | 'trivia'
  /** Alguien te ha escrito en el chat. Lleva `chatId` para abrir la conversación. */
  | 'chat_message';

/**
 * Un aviso en la campana.
 *
 * `createdAt` llega como texto ISO, no como `Timestamp`: lo
 * convierte `withId` al mapear el snapshot (ver `DATE_FIELDS` en
 * `services/firestoreUtils.ts`), igual que los hilos y los
 * comentarios.
 */
export interface AppNotification {
  id: string;
  type: NotificationType;

  /** Dueño de la notificación. Siempre el uid de la ruta. */
  recipientId: string;
  /** Quien hizo la acción. En la gamificación, el propio usuario. */
  actorId: string;
  actorName: string;
  actorAvatar: string;

  createdAt: string;
  read: boolean;
  /** Cuándo se leyó. Solo lo escribe el cliente, y solo este campo. */
  readAt?: string;

  /** ── A dónde lleva ──────────────────────────────────────── */

  /**
   * Hilo donde mirar.
   *
   * Para un comentario en un anime, un episodio o un personaje,
   * `targetType`/`targetId` dicen cuál es. Se rellenan los dos
   * campos juntos para que el enlace sea el mismo en todos los
   * casos y el panel no tenga que adivinarlo.
   */
  threadId?: string;
  targetType?: 'thread' | 'anime' | 'episode' | 'character';
  targetId?: string;
  /** Comentario concreto: el que se resalta al llegar. */
  commentId?: string;

  /**
   * Conversación del chat a la que pertenece el aviso.
   *
   * Solo lo trae `chat_message`. Con esto el panel abre ESA
   * conversación y no la primera de la lista, que es lo que pasaba
   * si solo se navegaba a `?tab=chats` con varios chats abiertos.
   */
  chatId?: string;

  /**
   * Anime al que pertenece el contenido del aviso.
   *
   * Para un comentario en un episodio o un personaje, `targetId` es
   * el id del capítulo o del personaje, y con eso solo no se puede
   * abrir nada: la wiki se navega por serie. El servidor lo resuelve
   * y lo guarda aquí (ver `resolverAnimeDe` en `functions/`), así el
   * cliente no tiene que buscarlo.
   *
   * Opcional a propósito: los avisos ya escritos antes de que
   * existiera este campo no lo tienen, y el panel los abre por su
   * `threadId` o avisa de que ya no está.
   */
  animeId?: string;

  /** Texto recortado de lo que hailó el aviso. */
  snippet?: string;

  /** ── Solo reacciones ────────────────────────────────────── */

  /** Qué reacción se puso: 'heart', 'fire', 'laugh'... */
  reaction?: ReactionType;

  /** ── Solo gamificación ──────────────────────────────────── */

  /** Nivel alcanzado. */
  level?: number;
  /** Id de la medalla y su nombre, para no tener que mirar el catálogo. */
  medalId?: string;
  medalName?: string;
  /** Aciertos y preguntas de la trivia. */
  triviaCorrect?: number;
  triviaTotal?: number;

  /**
   * Texto ya escrito, para lo que no depende de otra persona
   * (subir de nivel, ganar una medalla, cerrar la trivia). Se
   * guarda en Firestore en vez de componerse en el cliente porque
   * son frases con un número dentro y así quedan tal cual.
   */
  title?: string;
}

/** Cuántas se cargan de golpe. Ver `NotificationsContext`. */
export const PAGINA_NOTIFICACIONES = 20;

/** Cuántas se cargan de más cada vez que se pide "cargar más". */
export const PASO_NOTIFICACIONES = 20;

/** Por encima de este número el contador se muestra como "99+". */
export const MAX_CONTADOR = 99;