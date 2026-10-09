// ======================================================
// SEGUIMIENTOS ENTRE USUARIOS
// ======================================================
//
// Sigue el mismo criterio que el resto de relaciones del proyecto
// (`blocked`, `notifications`, `rewardLedger`): un documento por
// persona, en subcolecciones del usuario, con el id siendo el uid.
//
// ── Por qué DOS subcolecciones y no una ────────────────
//
// Guardar solo `following` obligaría a buscar "¿quién me sigue?"
// con una consulta de grupo sobre todos los usuarios, que es
// exactamente lo que el proyecto ya rechazó para las
// notificaciones (ver `types/notifications.ts`: con una colección
// plana había que traerse los avisos de todo el mundo para enseñar
// los tuyos, y las reglas no podían impedir que otro los leyera).
//
// Con las dos mitades:
//
//   · "¿a quién sigo?"      → `users/{yo}/following`   (la tiene el que escribe)
//   · "¿quién me sigue?"    → `users/{yo}/followers`   (la tiene el que recibe)
//
// Cada lista se lee con UNA consulta sobre una ruta, sin filtros,
// y las reglas pueden decir "esto es de este usuario" comparando
// el uid de la ruta. Es el mismo criterio que ya usa `blocked`.
//
// ── Por qué NO un array en `users/{uid}` ────────────────
//
// Un array obliga a LEER el documento entero y reescribirlo para
// añadir o quitar a alguien. Con dos personas pulsando a la vez, la
// segunda lectura pisa a la primera y se pierde un seguimiento. Y en
// el peor caso (500 seguidores) el documento pasa de 1 KB a un
// tamaño que cuesta de leer en cada visita al perfil. Un documento
// por persona no se pisa con nadie.

/** Un documento de `following` o de `followers`. */
export interface Follow {
  /**
   * Quién sigue, o quién es seguido, según la subcolección.
   *
   * Va DENTRO del documento y no se deduce solo de la ruta a
   * propósito: las reglas de Firestore no pueden "adivinar" el
   * contenido esperado de una ruta, así que el campo es lo que
   * comprueban (`request.resource.data.followerId == followerUid`).
   * Es lo que hace `blocked/{uid}`.
   */
  followerId: string;
  /** A quién sigue, si es un documento de `following`. */
  followingId: string;
  /**
   * Texto ISO. Lo convierte `withId` al mapear el snapshot (ver
   * `DATE_FIELDS` en `services/firestoreUtils.ts`), igual que los
   * hilos y los comentarios.
   */
  createdAt: string;
}

/**
 * Los dos contadores, tal y como están en `users/{uid}`.
 *
 * Los escribe la Cloud Function con el Admin SDK, nunca el
 * cliente: un contador en el documento de OTRA persona es
 * imposible de escribir desde el navegador con las reglas
 * correctas, y además sería falseable (bajar el contador de otro a
 * cero para que sus medallas de comunidad no le cuadren).
 *
 * Opcionales a propósito, como todos los campos de gamificación:
 * las cuentas anteriores a esto no los tienen y deben leerse como
 * cero, que es lo que significan.
 */
export interface UserSocialStats {
  /** Personas que te siguen. */
  followersCount: number;
  /** Personas a las que sigues. */
  followingCount: number;
}

/** Los dos contadores tal y como vienen del documento, sin normalizar. */
export interface SocialCrudo {
  followersCount: unknown;
  followingCount: unknown;
}

/**
 * Cuántas personas se leen de golpe en el modal.
 *
 * 25 es un número de lista, no de página: es lo que cabe en dos
 * scrolls en un móvil sin que el modal tenga que paginar de
 * verdade, y lo que evita traerse quinientas personas de golpe.
 * Para listas más largas se carga más con `cargarMas`.
 */
export const PAGINA_SEGUIDORES = 25;

/**
 * Cuantas se piden de mas en cada "cargar mas".
 *
 * Se define EN FUNCION de `PAGINA_SEGUIDORES` y no como un `25`
 * suelto, porque son el mismo numero por definicion: si divergieran,
 * el modal paginaria pidiendo un tamano y el servicio cortaria con
 * otro, y la lista se saltaria gente sin que se viera nada raro.
 */
export const PASO_SEGUIDOS = PAGINA_SEGUIDORES;
