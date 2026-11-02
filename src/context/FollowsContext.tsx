import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';

import { db } from '../lib/firebase';
import { cachedRead, setCached, userCacheScope } from '../lib/firestoreCache';
import { measureRead } from '../lib/firestoreDiagnostics';
import { useAuth } from './AuthContext';
import {
  errorDeFollow,
  escucharContadores,
  followUser,
  unfollowUser,
} from '../services/follows';
import type { UserSocialStats } from '../types/follows';

// ======================================================
// ESTADO DE SEGUIMIENTOS
// ======================================================
//
// Un solo contexto para toda la web, y no uno por botón, porque el
// botón de seguir aparece en varios sitios a la vez (el perfil, cada
// fila del modal de seguidores, cada comentario) y con un estado
// por botón habría Thirty suscripciones a Firestore.
//
// ── Qué se escucha y qué no ──────────────────────────────
//
// `AuthContext` mantiene el directorio de usuarios en una caché
// compartida. Aquí no se duplica. Solo hay DOS lecturas propias:
//
//   1. `users/{yo}/following` → un conjunto de uids, para saber de
//      un vistazo a quién sigo.
//
//      Podría ser un documento por persona ("¿sigo a esta?") en
//      lugar de la lista, pero entonces el modal de "seguidos" y
//      los treinta botones de la lista de seguidores necesitarían
//      treinta oocumentos cada uno. La lista es una suscripción y
//      sirve para todo. Es el mismo criterio que ya usa
//      `AuthContext` con el directorio.
//
//   2. `users/{quien se mira}` → los dos contadores.
//
// Lo que NO se escucha: el perfil de cada persona de la lista. De
// eso se encarga `usersList`, que ya está en memoria. Por eso no
// hay consultas N+1.
//
// ── Por qué se trae la lista entera ───────────────────────
//
// Una preocupación real: con 2.000 seguidos, el listener se trae
// 2.000 documentos de una vez y eso cuesta. Pero es un coste FIJO
// por sesión (una vez), no por botón ni por render, y el proyecto
// ya lo asume para el directorio de usuarios, que es del mismo
// tamaño. Lo que no se hace es traer también la lista de
// SEGUIDORES del perfil mirado: esa se pide paginada y solo
// mientras el modal está abierto (ver `FollowersModal`).

// Lo que se hace es un tope (`MAX_SEGUIDOS`). Está, porque el
// listener es de una sola vez y sin tope un usuario con 20.000
// seguidos traería 20.000 documentos en cada carga de la página,
// que es un gasto que no se ve en la interfaz pero sí en la
// factura. Con el tope se ven los más recientes, que es lo que
// se usa, y si se llega al tope se avisa por log para subirlo.

export interface FollowsContextType {
  /**
   * Contadores del usuario mirado.
   *
   * `socialUid` va en el valor porque los contadores son los de UNA
   * persona: sin él, un modal abierto sobre otro perfil podría
   * pintar el número de la persona equivocada. Los componentes
   * comparan antes de usarlo.
   */
  social: UserSocialStats | null;
  socialLoading: boolean;
  socialUid: string | null;

  /**
   * ¿Sigo a esta persona?
   *
   * Devuelve `null` cuando todavía no se sabe (o cuando no tiene
   * sentido: tú a ti, o sin sesión). Distinguir "no lo sigo" de
   * "no lo sé todavía" es lo que evita que el botón se ponga a
   * "Seguir" en un perfil al que ya sigues.
   */
  siguiendoA: (uid: string) => boolean | null;
  /** `true` mientras la lista de seguidos está cargando. */
  siguiendoCargando: boolean;

  /** Sigue o deja de seguir. Devuelve el estado resultante. */
  alternar: (uid: string) => Promise<boolean>;
  /**
   * `true` si hay una escritura en marcha para ESTE usuario.
   *
   * Es una función y no un booleano a propósito: el modal puede
   * tener treinta filas con su propio botón, y con un booleano
   * global, seguir a alguien en la fila 5 pondría en "cargando"
   * los treinta a la vez.
   */
  escribiendo: (uid: string) => boolean;
  /** Error de la última operación, ya en texto. */
  error: string | null;
  /** Borra el error a mano, para que el componente lo oculte. */
  limpiarError: () => void;

  /** Abre el modal de seguidores o seguidos. */
  abrirModal: (uid: string, lista: 'followers' | 'following') => void;
  modalAbierto: boolean;
  modalUid: string | null;
  modalLista: 'followers' | 'following';
  cerrarModal: () => void;
}

const FollowsContext = createContext<FollowsContextType | undefined>(undefined);

/** Cuántos seguidos se traen de golpe al abrir la sesión. */
const MAX_SEGUIDOS = 500;
const TTL_SIGUIENDO = 10 * 60 * 1000;

function cacheSiguiendo(uid: string, ids: Set<string>): void {
  setCached('auth:following', [...ids], TTL_SIGUIENDO, userCacheScope(uid));
}

export const FollowsProvider: React.FC<{
  children: React.ReactNode;
  /** Usuario al que se le escuchan los contadores. */
  uid: string | null;
}> = ({ children, uid: uidMirado }) => {
  const { currentUser } = useAuth();
  const miUid = currentUser?.uid ?? null;

  // ── 1. Contadores del usuario mirado ──────────────
  const [social, setSocial] = useState<UserSocialStats | null>(null);
  const [socialLoading, setSocialLoading] = useState(false);

  useEffect(() => {
    if (!uidMirado) {
      setSocial(null);
      setSocialLoading(false);
      return;
    }

    setSocialLoading(true);

    const cancelar = escucharContadores(uidMirado, (stats) => {
      setSocial(stats);
      setSocialLoading(false);
    });

    return cancelar;
  }, [uidMirado]);

  // ── 2. A quién sigo ───────────────────────────────
  //
  // Un `Set` y no un array: la pregunta es "¿está este uid?", y
  // `Set.has` no es una búsqueda lineal. Con 2.000 seguidos y
  // treinta filas pintándose en cada cambio, un `includes` en cada
  // render se nota.
  const [siguiendo, setSiguiendo] = useState<Set<string>>(new Set());
  const [siguiendoCargando, setSiguiendoCargando] = useState(true);

  useEffect(() => {
    if (!miUid) {
      setSiguiendo(new Set());
      setSiguiendoCargando(false);
      return;
    }

    let activo = true;
    setSiguiendoCargando(true);

    const scope = userCacheScope(miUid);
    void cachedRead({
      key: 'auth:following',
      scope,
      ttlMs: TTL_SIGUIENDO,
      read: async () => {
        const q = query(
          collection(db, 'users', miUid, 'following'),
          orderBy('createdAt', 'desc'),
          limit(MAX_SEGUIDOS),
        );
        const snap = await measureRead(
          { name: 'following', collection: 'following', origin: 'FollowsContext' },
          (result) => result.size,
          () => getDocs(q),
        );
        if (snap.size >= MAX_SEGUIDOS) {
          console.warn(
            `[Follows] Hay ${MAX_SEGUIDOS} seguidos o mas y solo se cargan los ` +
              `${MAX_SEGUIDOS} mas recientes.`,
          );
        }
        return snap.docs.map((d) => d.id);
      },
    })
      .then((ids) => {
        if (!activo) return;
        setSiguiendo(new Set(ids));
        setSiguiendoCargando(false);
      })
      .catch((e: Error) => {
        console.error('[Follows] No se pudo leer la lista de seguidos:', e);
        if (activo) setSiguiendoCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [miUid]);

  const siguiendoA = useCallback(
    (uid: string): boolean | null => {
      if (!miUid || uid === miUid) return null;
      // Antes de que llegue la lista, `null` y no `false`: decir
      // "no lo sigo" sin saberlo haría que el botón se pusiera a
      // "Seguir" en un perfil al que ya se sigue, y un clic ahí
      // crearía un duplicado.
      if (siguiendoCargando) return null;
      return siguiendo.has(uid);
    },
    [miUid, siguiendo, siguiendoCargando],
  );

  // ── 3. Seguir / dejar de seguir ───────────────────
  //
  // El uid que se está escribiendo AHORA, y no un booleano.
  //
  // Es un Set y no un `boolean` porque el modal puede tener
  // treinta filas con su propio botón: con un booleano global,
  // seguir a alguien en la fila 5 pondría en "cargando" los
  // treinta botones a la vez, y el usuario vería treinta botones
  // quietos sin saber cuál es el suyo.
  const [escribiendoUids, setEscribiendo] = useState<Set<string>>(new Set());

  const [error, setError] = useState<string | null>(null);

  const alternar = useCallback(
    async (uid: string): Promise<boolean> => {
      if (!miUid) {
        setError('Tienes que iniciar sesión para seguir.');
        return false;
      }
      if (uid === miUid) {
        setError('No te puedes seguir a ti mismo.');
        return false;
      }

      setEscribiendo((prev) => new Set(prev).add(uid));
      setError(null);

      const estaba = siguiendo.has(uid);

      try {
        // El estado OPTIMISTA va antes que la escritura, a
        // propósito. El botón tiene que responder al clic, no
        // cuando Firestore confirme: con la red lenta se percibe
        // como un botón roto, y un doble clic rápido en ese hueco
        // crearía una relación que el usuario no quería.
        //
        // Si la escritura falla se vuelve al estado anterior y se
        // avisa. Es preferible a dejar el botón mintiendo.
        const siguiente = new Set(siguiendo);
        if (estaba) siguiente.delete(uid);
        else siguiente.add(uid);
        setSiguiendo(siguiente);
        cacheSiguiendo(miUid, siguiente);

        if (estaba) {
          await unfollowUser(miUid, uid);
          return false;
        }

        await followUser(miUid, uid);
        return true;
      } catch (e) {
        const anterior = new Set(siguiendo);
        setSiguiendo(anterior);
        cacheSiguiendo(miUid, anterior);
        setError(errorDeFollow(e));
        console.error('[Follows] No se pudo cambiar el seguimiento:', e);
        return estaba;
      } finally {
        setEscribiendo((prev) => {
          const siguiente = new Set(prev);
          siguiente.delete(uid);
          return siguiente;
        });
      }
    },
    [miUid, siguiendo],
  );

  const escribiendo = useCallback((uid: string) => escribiendoUids.has(uid), [escribiendoUids]);

  const limpiarError = useCallback(() => setError(null), []);

  // ── 4. El modal ───────────────────────────────────
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalUid, setModalUid] = useState<string | null>(null);
  const [modalLista, setModalLista] = useState<'followers' | 'following'>('followers');

  const abrirModal = useCallback((uid: string, lista: 'followers' | 'following') => {
    setModalUid(uid);
    setModalLista(lista);
    setModalAbierto(true);
  }, []);

  const cerrarModal = useCallback(() => setModalAbierto(false), []);

  const valor = useMemo<FollowsContextType>(
    () => ({
      social,
      socialLoading,
      socialUid: uidMirado,
      siguiendoA,
      siguiendoCargando,
      alternar,
      escribiendo,
      error,
      limpiarError,
      abrirModal,
      modalAbierto,
      modalUid,
      modalLista,
      cerrarModal,
    }),
    [
      social,
      socialLoading,
      uidMirado,
      siguiendoA,
      siguiendoCargando,
      alternar,
      escribiendo,
      error,
      limpiarError,
      abrirModal,
      modalAbierto,
      modalUid,
      modalLista,
      cerrarModal,
    ],
  );

  return <FollowsContext.Provider value={valor}>{children}</FollowsContext.Provider>;
};

export const useFollows = (): FollowsContextType => {
  const ctx = useContext(FollowsContext);
  if (!ctx) {
    throw new Error('useFollows debe usarse dentro de un FollowsProvider');
  }
  return ctx;
};