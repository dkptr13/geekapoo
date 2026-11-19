// ======================================================
// ESTADO OPTIMISTA DE "ME GUSTA"
// ======================================================
//
// En hilos y comentarios el servidor recalcula el contador desde la
// subcolección `likes/{uid}`. Mientras llega esa confirmación, la
// interfaz puede aplicar el cambio de la persona actual sin tocar
// Firestore ni alterar los likes de nadie más.

export interface ContadorLike {
  likedBy?: string[];
  likesCount: number;
}

/**
 * Pone o quita un uid en la copia local del agregado.
 *
 * Es idempotente: aplicar dos veces el mismo estado no vuelve a sumar
 * ni a restar. Eso importa cuando la confirmación de la transacción
 * llega después de que el listener ya haya traído el mismo cambio.
 */
export function ponerLikeLocal<T extends ContadorLike>(
  item: T,
  uid: string,
  liked: boolean,
): T {
  const likedBy = Array.isArray(item.likedBy) ? item.likedBy : [];
  const yaEstaba = likedBy.includes(uid);

  if (yaEstaba === liked) return item;

  return {
    ...item,
    likedBy: liked
      ? [...likedBy, uid]
      : likedBy.filter((id) => id !== uid),
    likesCount: Math.max(0, item.likesCount + (liked ? 1 : -1)),
  };
}

/**
 * Aplica el cambio a una lista de hilos.
 *
 * El feed normal pinta `threads` y las vistas filtradas pintan
 * `allThreads`; el mismo cambio tiene que aplicarse a las dos. Esta
 * función devuelve la MISMA lista cuando el hilo no está, para no
 * provocar renders ni invalidar memoizaciones sin motivo.
 */
export function actualizarLikeEnLista<T extends { id: string } & ContadorLike>(
  lista: T[],
  id: string,
  uid: string,
  liked: boolean,
): T[] {
  if (!lista.some((item) => item.id === id)) return lista;
  return lista.map((item) =>
    item.id === id ? ponerLikeLocal(item, uid, liked) : item,
  );
}

/**
 * Aplica el cambio a una página paginada de la ficha.
 *
 * Las páginas de episodios y personajes no guardan un array: guardan
 * un objeto `{ items, hasMore... }` en la caché. Tratarlas como una
 * lista hacía que el parche del "me gusta" lanzara y el clic no
 * llegara ni a escribir en Firestore. Devuelve la MISMA página si el
 * elemento no está, para no invalidar caché ni provocar renders.
 */
export interface PaginaConItems<T> {
  items: T[];
}

export function actualizarLikeEnPagina<
  T extends { id: string } & ContadorLike,
  P extends PaginaConItems<T>,
>(pagina: P, id: string, uid: string, liked: boolean): P {
  const items = actualizarLikeEnLista(pagina.items, id, uid, liked);
  return (items === pagina.items ? pagina : { ...pagina, items }) as P;
}
