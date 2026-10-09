import {
  collection,
  doc,
  getCountFromServer,
  getDocs,
  limit as limitQuery,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  writeBatch,
  type DocumentReference,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import { withId, type WithId } from './firestoreUtils';
import {
  PASO_SEGUIDOS,
  type Follow,
  type UserSocialStats,
} from '../types/follows';

// ======================================================
// SEGUIR / DEJAR DE SEGUIR
// ======================================================
//
// Es la ÚNICA escritura que hace este servicio desde el cliente
// (junto con el borrado correspondiente), y escribe en dos sitios:
//
//   users/{yo}/following/{ellos}   → "yo sigo a ellos"
//   users/{ellos}/followers/{yo}   → "yo soy seguidor de ellos"
//
// Los dos en un ÚNICO lote, que en Firestore es atómico: o se
// escriben los dos documentos o ninguno.
//
// ── Por qué las dos mitades las escribe quien sigue ───────
//
// Podría dejar que la Cloud Function creara la segunda mitad, y es
// lo que hacen los avisos. Aquí NO se hace, y el motivo es el coste
// y la latencia:
//
//   · El botón tiene que cambiar a "Siguiendo" al instante. Si la
//     mitad del otro lado la pusiera una función, habría una
//     ventana en la que "yo sigo a X" es cierto y "X tiene a Y como
//     seguidor" todavía no, y el perfil de X enseñaría un número
//     viejo. Con el lote, las dos mitades son verdad o no son
//     verdad.
//   · Escribir en `users/{ellos}/followers/{yo}` NO da ningún poder
//     sobre el documento de ellos: es una subcolección aparte, y las
//     reglas comprueban que el id sea tu propio uid y que no puedas
//     tocar los documentos de otros.
//
// Lo que el cliente NO puede hacer (y por eso lo hace la función)
// es tocar los contadores: viven en el documento del usuario
// seguido, que el navegador no tiene permiso de escribir.

// ──────────────────────────────────────────────────────────
// ERRORES
// ──────────────────────────────────────────────────────────

/** Traduce el error de Firestore a algo legible, como en `gamification`. */
function mensajeDeError(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  if (code.includes('not-found')) return 'Ese usuario ya no existe.';
  if (code.includes('permission-denied')) {
    return (
      'Las reglas de seguridad no permiten esta operación. Sube las reglas con ' +
      '"npx firebase deploy --only firestore:rules".'
    );
  }
  if (code.includes('unavailable')) return 'No hay conexión con el servidor.';
  return e instanceof Error ? e.message : 'No se pudo completar la operación.';
}

/**
 * Error de la escritura de seguimiento, ya en texto.
 *
 * Se exporta para que los componentes puedan enseñar el mensaje
 * sin repetir el `switch` de los códigos de Firebase.
 */
export function errorDeFollow(e: unknown): string {
  return mensajeDeError(e);
}

// ──────────────────────────────────────────────────────────
// LAS DOS SUBCOLECCIONES
// ──────────────────────────────────────────────────────────

/** La lista de personas a las que sigue un usuario. */
const following = (uid: string) => collection(db, 'users', uid, 'following');

/** La lista de personas que siguen a un usuario. */
const followers = (uid: string) => collection(db, 'users', uid, 'followers');

/**
 * Qué lista se mira: los que te siguen o a los que sigues.
 *
 * Se usa un enum y no dos booleanos sueltos porque con dos
 * booleanos se puede pasar `seguidores` y `seguidos` a true a la
 * vez, que es la forma más fácil de acabar leyendo la colección
 * equivocada sin que nada avise.
 */
export type ListaSeguidos = 'followers' | 'following';

const coleccionDe = (uid: string, lista: ListaSeguidos) =>
  lista === 'followers' ? followers(uid) : following(uid);

// ──────────────────────────────────────────────────────────
// ESCRIBIR
// ──────────────────────────────────────────────────────────

/**
 * Sigue a una persona.
 *
 * No lleva al revés que el que la sigue, y no es un error: es lo
 * que hace Twitter y no.reddit. "Seguir" no es una suscripción
 * bilateral, y obligar a la otra parte a devolverla convertiría el
 * botón en algo que casi nadie usaría.
 *
 * @throws Si `yo === ellos`. Es un error de PROGRAMACIÓN, no de
 *         usuario: la interfaz ni siquiera pinta el botón en ese
 *         caso (ver `FollowButton`), así que si llega aquí es que
 *         alguien lo llamó mal.
 */
export async function followUser(yo: string, ellos: string): Promise<void> {
  if (yo === ellos) {
    throw new Error('No te puedes seguir a ti mismo.');
  }

  const ahora = serverTimestamp();

  const batch = writeBatch(db);

  batch.set(
    doc(db, 'users', yo, 'following', ellos),
    { followerId: yo, followingId: ellos, createdAt: ahora },
  );
  batch.set(
    doc(db, 'users', ellos, 'followers', yo),
    { followerId: yo, followingId: ellos, createdAt: ahora },
  );

  await batch.commit();
}

/**
 * Deja de seguir a una persona.
 *
 * Borra las dos mitades en un lote, por el mismo motivo que al
 * seguirlas: o se deshace del todo o no se deshace nada. Un
 * borrado a medias dejaría a esa persona con un seguidor fantasma
 * en su contador, que es justo lo que el contador no puede tener.
 */
export async function unfollowUser(yo: string, ellos: string): Promise<void> {
  if (yo === ellos) return;

  const batch = writeBatch(db);
  batch.delete(doc(db, 'users', yo, 'following', ellos));
  batch.delete(doc(db, 'users', ellos, 'followers', yo));
  await batch.commit();
}

/**
 * Invierte el estado, como `toggleLike`.
 *
 * @returns `true` si ahora sigue, `false` si ha dejado de seguir.
 *
 * Es idempotente por diseño: si el documento ya no existe (o ya
 * existe) escribe el estado que corresponde al que se ha leído, no
 * el contrario. Un doble clic rápido no puede acabar con la
 * relación deshecha cuando el usuario la quería.
 */
export async function toggleFollow(
  yo: string,
  ellos: string,
  sigueAhora: boolean,
): Promise<boolean> {
  if (sigueAhora) {
    await unfollowUser(yo, ellos);
    return false;
  }
  await followUser(yo, ellos);
  return true;
}

// ──────────────────────────────────────────────────────────
// LEER EL ESTADO "YA LE SIGO"
// ──────────────────────────────────────────────────────────

/**
 * Escucha si un usuario sigue a otro.
 *
 * Un listener de UN documento, no de la colección entera: así el
 * botón se pone a "Siguiendo" en cuanto llega la confirmación, sin
 * recargar, y sin traer toda la lista de seguido solo para
 * preguntar por uno.
 *
 * @param alCambiar Recibe el estado y el error. `siguiendo` es
 *                  `false` mientras carga, que es lo que el botón
 *                  pinta como "Seguir" deshabilitado.
 */
export function escucharSiSigo(
  yo: string | null,
  ellos: string | null,
  alCambiar: (siguiendo: boolean, cargando: boolean, error: string | null) => void,
): () => void {
  if (!yo || !ellos || yo === ellos) {
    alCambiar(false, false, null);
    return () => {};
  }

  return onSnapshot(
    doc(db, 'users', yo, 'following', ellos),
    (snap) => alCambiar(snap.exists(), false, null),
    (e) => {
      console.error('[Follows] No se pudo leer el estado del seguimiento:', e);
      alCambiar(false, false, mensajeDeError(e));
    },
  );
}

// ──────────────────────────────────────────────────────────
// LOS CONTADORES
// ──────────────────────────────────────────────────────────

/**
 * Escucha los dos contadores del documento de un usuario.
 *
 * Un listener del documento, no una cuenta por lista: leer los
 * contadores con `getCountFromServer` en cada visita al perfil
 * costaría dos lecturas agregadas siempre, y el número que se
 * busca cambia sin que nadie recargue (alguien te sigue desde otra
 * pestaña). Con el documento entero, el contador llega solo.
 *
 * Son los mismos contadores que ya trae `usersList` de
 * `AuthContext` para el directorio, pero aquí hace falta un
 * listener propio porque `usersList` se vacía al cerrar sesión y
 * porque el modal y el botón los necesitan aunque el perfil se esté
 * mirando de otra persona.
 */
export function escucharContadores(
  uid: string | null,
  alCambiar: (stats: UserSocialStats | null, error: string | null) => void,
): () => void {
  if (!uid) {
    alCambiar(null, null);
    return () => {};
  }

  return onSnapshot(
    doc(db, 'users', uid),
    (snap) => alCambiar(aSocial(snap.data() as Record<string, unknown> | undefined), null),
    (e) => {
      console.error('[Follows] No se pudieron leer los contadores:', e);
      alCambiar(null, mensajeDeError(e));
    },
  );
}

// ──────────────────────────────────────────────────────────
// LAS LISTAS, PAGINADAS
// ──────────────────────────────────────────────────────────

export interface PaginaSeguidos {
  /** La gente de esta página, en orden. */
  items: WithId<Follow>[];
  /** Si hay más gente detrás de esta página. */
  hayMas: boolean;
  /** Para pedir la siguiente página. */
  cursor: QueryDocumentSnapshot | null;
}

/**
 * Una página de la lista, de más nuevos a más antiguos.
 *
 * El `orderBy('createdAt', 'desc')` no es solo para que se vea
 * reciente: es lo que hace que la paginación por `startAfter` sea
 * correcta. Sin un orden explícito, Firestore devuelve los
 * documentos en un orden arbitrario pero estable, y saltar al
 * "siguiente" con un cursor sobre un orden no garantizado repite o
 * se salta gente entre páginas.
 *
 * Se pide UN documento de más (`PASO + 1`) para saber si hay más
 * sin hacer una consulta de conteo aparte: el `size` del resultado
 * ya lo dice.
 */
export async function cargarPagina(
  uid: string,
  lista: ListaSeguidos,
  cursor: QueryDocumentSnapshot | null = null,
  paso: number = PASO_SEGUIDOS,
): Promise<PaginaSeguidos> {
  // El tipo del array se anota a mano y no se deja que TypeScript
  // lo deduzca. Sin la anotación, los dos primeros elementos ya
  // estrechan el array al tipo de esos (`orderBy | limit`) y al
  // meter `startAfter` dentro el compilador lo rechaza, aunque la
  // firma de `query()` lo admita sin problema. Es un estrechamiento
  // demasiado agresivo del literal, no un error real.
  const constraints: QueryConstraint[] = [
    orderBy('createdAt', 'desc'),
    limitQuery(paso + 1),
  ];

  if (cursor) constraints.push(startAfter(cursor));

  const snap = await getDocs(query(coleccionDe(uid, lista), ...constraints));
  const docs = snap.docs;

  const hayMas = docs.length > paso;
  const items = (hayMas ? docs.slice(0, paso) : docs).map((d) => withId<Follow>(d));

  return {
    items,
    hayMas,
    // Si no hay más, el cursor es null: pedir "la siguiente" de una
    // lista ya completa devolvería una página vacía y el botón
    // "cargar más" parpadearía.
    cursor: hayMas ? docs[docs.length - 1] : null,
  };
}

/**
 * Cuenta cuántos hay en una lista, sin traerlos.
 *
 * Se usa para el subtítulo del modal ("1.284 seguidores"). Es una
 * consulta de agregación: en Firestore cuesta una lectura y UN
 * documento de resultado, sin importar si hay diez o diez mil
 * personas. `getDocs` aquí costaría leerlos todos, que es
 * justo lo que no se quiere.
 */
export async function contarSeguidos(uid: string, lista: ListaSeguidos): Promise<number> {
  const snap = await getCountFromServer(coleccionDe(uid, lista));
  return snap.data().count;
}

// ──────────────────────────────────────────────────────────
// RECUENTOS DE LOS DOCUMENTOS DE USUARIO
// ──────────────────────────────────────────────────────────

/** Normaliza los contadores que vienen del documento de un usuario. */
export function aSocial(data: Record<string, unknown> | undefined): UserSocialStats {
  const numero = (v: unknown): number =>
    typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;

  return {
    followersCount: numero(data?.followersCount),
    followingCount: numero(data?.followingCount),
  };
}

// ──────────────────────────────────────────────────────────
// BORRADO DE CUENTA
// ──────────────────────────────────────────────────────────

/**
 * Quita las relaciones de seguimiento de una cuenta que se borra.
 *
 * Firestore no borra en cascada, así que sin esto el documento del
 * usuario desaparecería dejando sus documentos de `following` y
 * `followers` colgando de un id que ya no existe. Y el peor caso no
 * es el huérfano: es que si ese mismo uid se volviera a usar, la
 * cuenta nueva aparecería siguiendo a gente.
 *
 * Hay que tocar CUATRO sitios, y olvidar los que están en la
 * carpeta de otra persona es lo que más duele:
 *
 *   1. `users/{yo}/following/{ellos}`   lo que yo sigo       (mío)
 *   2. `users/{otros}/followers/{yo}`  mi mitad de su lista (ajeno)
 *   3. `users/{yo}/followers/{otros}`  quién me sigue       (mío)
 *   4. `users/{otros}/following/{yo}`  su mitad de mi lista (ajeno)
 *
 * Sin los puntos 2 y 4, la gente que esta persona seguía la
 * seguiría viendo en su contador sin poder quitar a nadie de en
 * medio.
 *
 * Va antes de borrar el documento del perfil, por el mismo motivo
 * que los bloqueados en `accountSettings.ts`: en cuanto el
 * documento se borra, cualquier escritura posterior sale con
 * permission-denied.
 *
 * Los borrados de las mitades ajenas los permiten las reglas (el
 * id del documento tiene que ser el uid de quien lo borra), así
 * que no hace falta el Admin SDK para esto.
 */
export async function borrarRelacionesDe(uid: string): Promise<void> {
  const [aQuienSigo, quienMeSigue] = await Promise.all([
    getDocs(following(uid)),
    getDocs(followers(uid)),
  ]);

  // Los ids de los documentos SON los uids de la otra persona: por
  // eso no hace falta leer el campo `followerId` de cada uno.
  const otros = new Set<string>();
  aQuienSigo.docs.forEach((d) => otros.add(d.id));
  quienMeSigue.docs.forEach((d) => otros.add(d.id));

  const aBorrar: DocumentReference[] = [
    // Puntos 1 y 3: dentro de mi propio documento.
    ...aQuienSigo.docs.map((d) => d.ref),
    ...quienMeSigue.docs.map((d) => d.ref),
    // Puntos 2 y 4: dentro del documento de la otra persona.
    ...[...otros].map((otro) => doc(db, 'users', otro, 'followers', uid)),
    ...[...otros].map((otro) => doc(db, 'users', otro, 'following', uid)),
  ];

  const LOTE = 400; // por debajo del límite de 500 escrituras por lote

  for (let i = 0; i < aBorrar.length; i += LOTE) {
    const batch = writeBatch(db);
    for (const ref of aBorrar.slice(i, i + LOTE)) {
      batch.delete(ref);
    }
    await batch.commit();
  }
}
