import type { AppNotification, NotificationType } from '../types/notifications';
import { MAX_CONTADOR } from '../types/notifications';
import { emojiDeReaccion } from '../services/reactionLogic';

// ======================================================
// LOGICA DE NOTIFICACIONES (sin Firestore, sin React)
// ======================================================
//
// Todo lo que decide QUE se le dice a una notificacion y como se
// ensena, separado del componente que la pinta. El motivo es el
// mismo que en `services/reactionLogic.ts`: esta parte se puede
// comprobar sin navegador ni emulador (`npm run test:logica`), y
// es justo la clase de bug que no se ve en la consola: una
// notificacion que se pinta con el emoji equivocado, o un "Hace 0
// minutos" que nadie mira.
//
// Se escriben SIN TILDES a proposito: el resto del proyecto
// escribe los textos de interfaz con tildes, pero los comentarios
// tecnicos se leen en cualquier terminal y aqui conviven las
// tres salts de codificacion que dan guerra al pegarlos en otro
// fichero.

/**
 * Icono de cada tipo de notificacion.
 *
 * El emoji va como texto y no como componente: los tipos son
 * datos, y meter un componente de React en un `Record` que
 * comparan `functions/` y `src/` cruzaria los dos paquetes.
 */
type Icono =
  | 'comment'
  | 'at'
  | 'follow'
  | 'heart'
  | 'reaction'
  | 'level'
  | 'medal'
  | 'trivia';

const ESTILO: Record<NotificationType, { icono: Icono }> = {
  comment_reply: { icono: 'comment' },
  comment_thread: { icono: 'comment' },
  mention: { icono: 'at' },
  follow: { icono: 'follow' },
  post_like: { icono: 'heart' },
  post_reaction: { icono: 'reaction' },
  comment_like: { icono: 'heart' },
  comment_reaction: { icono: 'reaction' },
  level_up: { icono: 'level' },
  achievement: { icono: 'medal' },
  trivia: { icono: 'trivia' },
};

export function iconoDe(n: Pick<AppNotification, 'type' | 'reaction'>): string {
  switch (ESTILO[n.type]?.icono) {
    case 'comment':
      return '💬';
    case 'at':
      return '🏷️';
    case 'follow':
      return '👥';
    case 'heart':
      return '❤️';
    case 'reaction':
      // La reaccion concreta es lo que el autor puso, no una
      // estrella generica: "reacciono con 🔥" dice mucho mas que
      // "reacciono".
      return emojiDeReaccion(n.reaction);
    case 'level':
      return '🎉';
    case 'medal':
      return '🏆';
    case 'trivia':
      return '🎯';
    default:
      return '🔔';
  }
}

/** Lo que se le dice al usuario, en una linea. */
export function textoDe(
  n: Pick<
    AppNotification,
    | 'type'
    | 'actorName'
    | 'level'
    | 'medalName'
    | 'triviaCorrect'
    | 'triviaTotal'
    | 'title'
  >,
): string {
  // La gamificacion no la hace NADIE: se la gana uno mismo. Por eso
  // el texto viene compuesto desde el servidor y aqui no se toca.
  if (n.title) return n.title;

  const quien = n.actorName || 'Alguien';

  switch (n.type) {
    case 'comment_reply':
      return `${quien} respondio a tu comentario`;
    case 'comment_thread':
      return `${quien} comento en tu hilo`;
    case 'follow':
      return `${quien} ahora te sigue`;
    case 'mention':
      return `${quien} te menciono`;
    case 'post_like':
      return `${quien} le dio Me gusta a tu publicacion`;
    case 'comment_like':
      return `${quien} le dio Me gusta a tu comentario`;
    case 'post_reaction':
      return `${quien} reacciono a tu publicacion`;
    case 'comment_reaction':
      return `${quien} reacciono a tu comentario`;
    case 'level_up':
      return `Has subido al nivel ${n.level ?? 1}`;
    case 'achievement':
      return `Has desbloqueado la medalla "${n.medalName ?? 'desconocida'}"`;
    case 'trivia':
      return `Trivia completada: ${n.triviaCorrect ?? 0} de ${n.triviaTotal ?? 0}`;
    default:
      return 'Tienes actividad en la comunidad';
  }
}

/**
 * Si la notificacion merece la atencion de KAPO-CHAN.
 *
 * Solo lo que es un hecho unico y que pasa una vez: subir de nivel,
 * ganar una medalla, cerrar la trivia. Un "Me gusta" no vale una
 * interrupcion de la mascota: puede haber veinte en un rato y
 * ninguna es un evento.
 *
 * `level_up` y `achievement` ya los celebra Kapo por su cuenta (los
 * ve en `ProgressionContext`), asi que estan aqui para que quien
 * llame pueda filtrar sin conocer el detalle.
 */
export function esNotificacionImportante(n: Pick<AppNotification, 'type'>): boolean {
  return n.type === 'level_up' || n.type === 'achievement' || n.type === 'trivia';
}

/** Cuanto texto se guarda de lo que provoco el aviso. */
const MAX_SNIPPET = 80;

/**
 * Recorta el texto que acompana a la notificacion.
 *
 * Sale en el panel, en una linea, junto al nombre de quien lo
 * hizo. Se corta por un espacio si se puede, para no partir una
 * palabra por la mitad, y se anade "..." para que se note que
 * sigue.
 */
export function recorte(
  texto: string | undefined,
  max = MAX_SNIPPET,
): string | undefined {
  if (!texto) return undefined;
  const limpio = texto.replace(/\s+/g, ' ').trim();
  if (limpio.length <= max) return limpio;

  const corte = limpio.slice(0, max);
  const ultimoEspacio = corte.lastIndexOf(' ');
  const base = ultimoEspacio > max * 0.6 ? corte.slice(0, ultimoEspacio) : corte;
  return `${base.replace(/[\s,.;:!?-]+$/, '')}...`;
}

// ======================================================
// ANTI-SPAM
// ======================================================
//
// Los ids de las notificaciones los pone el servidor y salen del
// contenido, no de un `doc()` al azar (ver `types/notifications.ts`).
// Lo que se comprueba aqui es la otra mitad: que merece aviso y que
// no, para que la Cloud Function no escriba lo que no toca.

/** Menciones por comentario. Tope de lectura y de ruido. */
export const MAX_MENCIONES = 5;

/**
 * Saca los "@usuario" de un texto.
 *
 * Se admiten letras, numeros, punto, guion y guion bajo, que es lo
 * que ya permite el registro de usuarios. Se corta en 24
 * caracteres porque nadie necesita un nombre mas largo, y asi un
 * "@" pegado a un email entero no se convierte en una busqueda.
 *
 * Se devuelven SIN repetir y EN ORDEN: mencionar dos veces a la
 * misma persona en un parrafo solo genera un aviso.
 */
export function mencionesDe(texto: string | undefined): string[] {
  if (!texto) return [];

  const encontradas = texto.match(/@([A-Za-z0-9._-]{1,24})/g) ?? [];
  const nombres = encontradas.map((m) => m.slice(1));

  const vistas = new Set<string>();
  const unicas: string[] = [];
  for (const nombre of nombres) {
    const clave = nombre.toLowerCase();
    if (vistas.has(clave)) continue;
    vistas.add(clave);
    unicas.push(nombre);
  }

  return unicas.slice(0, MAX_MENCIONES);
}

// ======================================================
// TIEMPO RELATIVO
// ======================================================

/**
 * "Hace 2 minutos", "Ayer", "12 oct 2026".
 *
 * NO hay un `setInterval` en toda la aplicacion reescribiendo la
 * fecha cada segundo: quien lo usa decide cada cuanto refresca (el
 * panel de notificaciones, al abrirse). Ademas, desde el minuto se
 * sube de golpe a "hace X horas" en vez de decir "hace 180
 * minutos", que es lo que se lee mal.
 */
export function tiempoRelativo(
  fecha: string | Date | null | undefined,
  ahora = Date.now(),
): string {
  const fechaReal = fecha instanceof Date ? fecha : new Date(fecha ?? 0);
  const ms = fechaReal.getTime();
  if (!Number.isFinite(ms) || ms <= 0) return '';

  const segundos = Math.max(0, Math.floor((ahora - ms) / 1000));

  if (segundos < 45) return 'Ahora';
  if (segundos < 90) return 'Hace un minuto';

  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `Hace ${minutos} minutos`;

  const horas = Math.floor(minutos / 60);
  if (horas === 1) return 'Hace una hora';
  if (horas < 24) return `Hace ${horas} horas`;

  const dias = Math.floor(horas / 24);
  if (dias === 1) return 'Ayer';
  if (dias < 7) return `Hace ${dias} dias`;

  // A partir de una semana ya no interesa la distancia: interesa
  // cuando fue. Se usa la fecha corta en espanol, que es lo que
  // entiende cualquiera de aqui.
  return fechaReal.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: fechaReal.getFullYear() === new Date(ahora).getFullYear() ? undefined : 'numeric',
  });
}

// ======================================================
// A DONDE LLEVA CADA AVISO
// ======================================================
//
// El destino se calcula AQUI y no en el servidor, a proposito.
//
// Lo comodo seria que la Cloud Function guardara `url: '/?tab=...'`
// en el aviso y el cliente solo navegara. Se descarta: el cliente es
// quien sabe como se llama cada cosa (`hilo=` en el feed, `anime=` y
// `wikiTab=` en la wiki), y si el servidor guardara la ruta,
// renombrar un parametro dejaria inservibles todos los avisos ya
// escritos. Con los IDs, que no cambian, no pasa eso.
//
// La funcion es pura y va en este archivo (y no en el hook) para que
// se pueda comprobar sin navegador:
// `tests/logica.notificaciones.ts`.

/** A donde lleva un aviso, o por que no lleva a ninguna parte. */
export interface DestinoNotificacion {
  /** Solo el query: "?tab=inicio". Vacio si no hay destino. */
  search: string;
  /** Texto para avisar al usuario si `search` esta vacio. */
  sinDestino?: string;
}

/**
 * Que URL abre un aviso.
 *
 * El orden importa: `threadId` va primero porque es el caso mas
 * comun (respuestas, comentarios nuevos en tu hilo, menciones dentro
 * de un hilo) y el unico que sabe llegar hasta el comentario
 * concreto, con el `comment-` resaltado en pantalla.
 */
export function destinoDeNotificacion(n: AppNotification): DestinoNotificacion {
  // Un follow va al PERFIL de quien te sigue.
  //
  // Va el primero de todos, antes incluso que `threadId`, porque es
  // el único aviso sin contenido asociado: no hay hilo, no hay
  // comentario, no hay serie. Ir a otra cosa sería inventar un
  // destino.
  //
  // `targetType: 'profile'` con `targetId` = el uid de quien te sigue.
  // Lo escribe `onFollowChanged` leyendo el documento de esa
  // persona, nunca un campo del cliente, así que el enlace no se
  // puede falsear.
  //
  // La comprobación del `targetId` NO es una redundancia. Un aviso
  // sin él es de los antiguos o está corrupto, y sin el `if`
  // caería en la última rama, que lo llevaría al feed: un aviso de
  // "Ana ahora te sigue" que abre el feed es peor que uno que
  // explica que no se puede abrir, porque el usuario creería que
  // ha ido a su perfil.
  if (n.type === 'follow') {
    if (!n.targetId) {
      return {
        search: '',
        sinDestino: 'Ese aviso no guarda a quién se refiere, así que no se puede abrir.',
      };
    }
    return { search: `?tab=perfil&usuario=${encodeURIComponent(n.targetId)}` };
  }

  // Un comentario en un hilo: al hilo, y al comentario resaltado.
  if (n.threadId) {
    const params = new URLSearchParams({ tab: 'inicio', hilo: n.threadId });
    if (n.commentId) params.set('comentario', n.commentId);
    return { search: `?${params.toString()}` };
  }

  // Un comentario en un anime, un capitulo o un personaje: a la
  // wiki. Se abre por SERIE (`animeId`), que es lo unico que la wiki
  // sabe abrir, y a la pestana que corresponde al tipo.
  if (
    n.targetType === 'anime' ||
    n.targetType === 'episode' ||
    n.targetType === 'character'
  ) {
    // Un comentario en un anime lleva el id de la serie en
    // `targetId`. Un capitulo o un personaje lo llevan en `targetId`
    // pero eso no abre nada: hace falta `animeId`, que el servidor
    // resuelve (`resolverAnimeDe`). Los avisos escritos antes de que
    // ese campo existiera no lo tienen, y no hay forma de averiguarlo
    // desde aqui sin el catalogo entero.
    const serie = n.targetType === 'anime' ? n.targetId : n.animeId;

    if (!serie) {
      return {
        search: '',
        sinDestino:
          'Ese aviso es anterior a que se guardara la serie, y no se sabe a cual iba.',
      };
    }

    const params = new URLSearchParams({ tab: 'wiki', anime: serie });
    if (n.targetType === 'episode') params.set('wikiTab', 'episodes');
    if (n.targetType === 'character') params.set('wikiTab', 'characters');
    return { search: `?${params.toString()}` };
  }

  // La gamificacion no viene de nadie: te la ganas tu. Lleva a donde
  // se ve.
  if (n.type === 'level_up' || n.type === 'achievement') {
    return { search: '?tab=logros' };
  }
  if (n.type === 'trivia') {
    return { search: '?tab=trivia' };
  }

  // Un "Me gusta" o una reaccion sobre un comentario de la wiki: se
  // abre la serie. Sin `animeId` no hay nada que abrir.
  if (n.type === 'comment_like' || n.type === 'comment_reaction') {
    if (n.animeId) {
      return { search: `?tab=wiki&anime=${encodeURIComponent(n.animeId)}` };
    }
    return {
      search: '',
      sinDestino: 'Ese comentario ya no esta, asi que no hay a donde ir.',
    };
  }

  // Cualquier otra cosa (un "Me gusta" a un hilo ya ha entrado
  // arriba) no tiene destino conocido. Se lleva al feed en vez de no
  // hacer nada: el usuario ve que ha ido a algun sitio, que es mejor
  // que un panel que se cierra sin explicarse.
  return { search: '?tab=inicio' };
}

/** Que se pone en la campana: "5" o "99+". Nunca un 0. */
export function textoDelContador(pendientes: number): string | null {
  if (pendientes <= 0) return null;
  if (pendientes > MAX_CONTADOR) return `${MAX_CONTADOR}+`;
  return String(pendientes);
}
