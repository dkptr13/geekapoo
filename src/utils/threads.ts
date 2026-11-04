import type { Thread } from '../types';

/**
 * Rellena los campos que ahora escribe el servidor.
 *
 * Los hilos nuevos ya no nacen con `likedBy`, `likesCount` ni
 * `commentsCount`: los pone la Cloud Function. Hasta que el trigger
 * corre (o si un documento antiguo viene sin ellos), la interfaz
 * tiene que seguir viendo 0 y una lista vacía en vez de `undefined`,
 * que rompería los contadores y los filtros del perfil.
 */
export function normalizarHilo(thread: Thread): Thread {
  return {
    ...thread,
    likesCount: typeof thread.likesCount === 'number' ? thread.likesCount : 0,
    likedBy: Array.isArray(thread.likedBy) ? thread.likedBy : [],
    commentsCount:
      typeof thread.commentsCount === 'number' ? thread.commentsCount : 0,
  };
}
