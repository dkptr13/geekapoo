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
