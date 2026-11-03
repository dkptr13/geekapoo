import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { db, functions } from '../../lib/firebase';
import { cachedRead, userCacheScope } from '../../lib/firestoreCache';
import { measureRead } from '../../lib/firestoreDiagnostics';
import { useAuth } from '../../context/AuthContext';
import { collectionOf } from '../../services/catalogAdmin';
import { toIsoString } from '../../services/firestoreUtils';
import { SUPPORT_TICKETS } from '../../services/support';
import { USER_PRIVATE, soloCamposPublicos } from '../../services/userPrivate';
import type { SupportTicket, User, UserPrivateData } from '../../types';

// ======================================================
// DATOS DEL PANEL DE ADMINISTRACIÓN
// ======================================================
// Antes esto era getItemsBySection(), una función normal que
// recorría mockData. Ahora son listeners reales: lo que ves
// en el panel es lo mismo que ve el resto de la web, y al
// cambiar una imagen aparece actualizada al momento.
// ======================================================

// Páginas del panel. "categories" no es un editor de catálogo
// pero sí se escucha: el editor de anime necesita la lista para
// ofrecerla en el desplegable de categoría.
export type AdminSection =
  | 'animes'
  | 'seasons'
  | 'characters'
  | 'episodes'
  | 'trivia'
  // La trivia DIARIA. Va aparte de "trivia" (que son las
  // curiosidades de la wiki) porque no salen del mismo sitio ni se
  // gestionan igual: estas se programan por fecha y las otras se
  // editan una a una.
  | 'triviaDiaria'
  | 'categories'
  | 'weeklyWorks'
  | 'settings'
  | 'users'
  | 'threads'
  | 'tickets'
  // Cola de denuncias de comentarios e hilos.
  | 'reportes'
  | 'gamificacion';

// Solo el catálogo se escucha aquí. "weeklyWorks" y "settings"
// aparecen como pestañas, pero sus datos ya los trae
// SiteContentContext con sus propios listeners: escucharlos
// también aquí duplicaría las suscripciones sin ganar nada.
export const LISTENED_SECTIONS = [
  'animes',
  'seasons',
  'characters',
  'episodes',
  'trivia',
  'categories',
  'users',
  'threads',
  'tickets',
] as const;

export type ListenedSection = (typeof LISTENED_SECTIONS)[number];

// El mapa de sección -> colección vive en catalogAdmin, que es donde
// se escribe. Antes estaba duplicado aquí y se desincronizó: el panel
// leía de "trivia_extras" mientras que el guardado escribía en
// "trivia", así que las curiosidades no se podían guardar.
export const COLLECTION_MAP: Record<ListenedSection, string> = LISTENED_SECTIONS.reduce(
  (acc, section) => {
    acc[section] = collectionOf(section);
    return acc;
  },
  {} as Record<ListenedSection, string>,
);

type RawDoc = Record<string, unknown> & { id: string };

const EMPTY: Record<ListenedSection, RawDoc[]> = {
  animes: [],
  seasons: [],
  characters: [],
  episodes: [],
  trivia: [],
  categories: [],
  users: [],
  threads: [],
  tickets: [],
};

const ADMIN_CACHE_TTL = 2 * 60 * 1000;

const SECTION_BY_CACHE_KEY: Record<string, ListenedSection> = {
  'community:animes': 'animes',
  'community:seasons': 'seasons',
  'community:characters': 'characters',
  'community:episodes': 'episodes',
  'community:categories': 'categories',
  'community:trivia-extras': 'trivia',
  'community:threads': 'threads',
};

/**
 * Qué colecciones necesita cada pestaña.
 *
 * Antes el panel leía las nueve secciones al abrirse, incluidas
 * `episodes` y `characters` completas, aunque el admin solo fuera a
 * cambiar un título. Ahora cada pestaña pide lo suyo: Animes carga
 * animes, temporadas y categorías; los episodios y personajes de
 * una serie se piden al desplegar su editor.
 */
const SECTION_DEPS: Record<AdminSection, ListenedSection[]> = {
  animes: ['animes', 'seasons', 'categories'],
  seasons: ['seasons'],
  characters: ['characters'],
  episodes: ['episodes'],
  trivia: ['trivia'],
  triviaDiaria: [],
  categories: ['categories'],
  weeklyWorks: [],
  settings: [],
  users: ['users'],
  threads: ['threads'],
  tickets: ['tickets'],
  reportes: [],
  gamificacion: [],
};

/**
 * Recuento exacto de una sección sin descargar sus documentos.
 *
 * Firestore cobra las agregaciones aparte y suelen ser mucho más
 * baratas que traer miles de fichas solo para enseñar el número de
 * la pestaña. Se cachea cinco minutos por usuario.
 */
function leerConteoAdmin(uid: string, section: ListenedSection): Promise<number> {
  const nombre = COLLECTION_MAP[section];
  return cachedRead<number>({
    key: `admin:count:${section}`,
    scope: userCacheScope(uid),
    ttlMs: 5 * 60 * 1000,
    read: () => measureRead(
      { name: `admin:count:${section}`, collection: nombre, origin: 'useAdminCatalog' },
      () => 1,
      () => getCountFromServer(collection(db, nombre)),
    ).then((snap) => snap.data().count),
  });
}

function leerSeccionAdmin(
  uid: string,
  section: ListenedSection,
  force = false,
): Promise<RawDoc[]> {
  const nombre = COLLECTION_MAP[section];
  return cachedRead({
    key: `admin:section:${section}`,
    scope: userCacheScope(uid),
    ttlMs: ADMIN_CACHE_TTL,
    force,
    read: async () => {
      const snap = await measureRead(
        { name: `admin:${section}`, collection: nombre, origin: 'useAdminCatalog' },
        (result) => result.size,
        () => getDocs(collection(db, nombre)),
      );
      return snap.docs.map((d) => ({ ...(d.data() as RawDoc), id: d.id }));
    },
  });
}

function leerRestriccionesAdmin(
  uid: string,
  force = false,
): Promise<Record<string, { activo?: boolean; tipo?: string }>> {
  return cachedRead({
    key: 'admin:restrictions',
    scope: userCacheScope(uid),
    ttlMs: ADMIN_CACHE_TTL,
    force,
    read: async () => {
      const snap = await measureRead(
        { name: 'admin:restrictions', collection: 'accountRestrictions', origin: 'useAdminCatalog' },
        (result) => result.size,
        () => getDocs(collection(db, 'accountRestrictions')),
      );
      const next: Record<string, { activo?: boolean; tipo?: string }> = {};
      snap.docs.forEach((d) => {
        next[d.id] = d.data() as { activo?: boolean; tipo?: string };
      });
      return next;
    },
  });
}

function leerPrivadosAdmin(
  uid: string,
  force = false,
): Promise<Record<string, UserPrivateData>> {
  return cachedRead({
    key: 'admin:user-private',
    scope: userCacheScope(uid),
    ttlMs: ADMIN_CACHE_TTL,
    force,
    read: async () => {
      const snap = await measureRead(
        { name: 'admin:user-private', collection: USER_PRIVATE, origin: 'useAdminCatalog' },
        (result) => result.size,
        () => getDocs(collection(db, USER_PRIVATE)),
      );
      const next: Record<string, UserPrivateData> = {};
      snap.docs.forEach((d) => {
        next[d.id] = d.data() as UserPrivateData;
      });
      return next;
    },
  });
}

export function useAdminCatalog(activeSection: AdminSection = 'animes') {
  const { currentUser } = useAuth();
  const [docs, setDocs] = useState<Record<ListenedSection, RawDoc[]>>(EMPTY);
  const [conteos, setConteos] = useState<Partial<Record<ListenedSection, number>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Datos que NO están en el perfil público. El correo solo lo
  // recibe un admin; el estado de baneo lo recibe todo el equipo
  // desde `accountRestrictions`, que ya era legible para
  // moderadores y administradores.
  const [privados, setPrivados] = useState<Record<string, UserPrivateData>>({});
  const [restricciones, setRestricciones] = useState<
    Record<string, { activo?: boolean; tipo?: string }>
  >({});

  const uid = currentUser?.uid ?? null;
  const role = currentUser?.role;
  const secciones = useMemo(
    () => SECTION_DEPS[activeSection] ?? [],
    [activeSection],
  );

  // Los contadores de las pestañas se piden con agregaciones, no
  // con los documentos. Así se pueden enseñar todos los números sin
  // descargar las nueve colecciones.
  useEffect(() => {
    if (!uid) {
      setConteos({});
      return;
    }

    let activo = true;
    void Promise.allSettled(
      LISTENED_SECTIONS.map(async (section) => {
        try {
          const total = await leerConteoAdmin(uid, section);
          if (activo) setConteos((prev) => ({ ...prev, [section]: total }));
        } catch (e) {
          // Una colección sin permiso de agregación no debe romper
          // el panel: la pestaña se queda con el número que ya
          // tuviera.
          console.warn(`[Admin] No se pudo contar "${COLLECTION_MAP[section]}":`, e);
        }
      }),
    );

    return () => {
      activo = false;
    };
  }, [uid]);

  const refrescarSeccion = useCallback(async (section: ListenedSection, force = true) => {
    if (!uid) return;
    try {
      const datos = await leerSeccionAdmin(uid, section, force);
      setDocs((prev) => ({ ...prev, [section]: datos }));
      setConteos((prev) => ({ ...prev, [section]: datos.length }));
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      console.error(`[Admin] Error leyendo "${COLLECTION_MAP[section]}":`, error);
      setError(
        `No se pudo leer "${COLLECTION_MAP[section]}": ${error.message}. ` +
        `Comprueba que tienes rol admin o moderador y que las reglas están desplegadas.`,
      );
    }
  }, [uid]);

  const refrescarRestricciones = useCallback(async () => {
    if (!uid) return;
    try {
      setRestricciones(await leerRestriccionesAdmin(uid, true));
    } catch (e) {
      console.error('[Admin] No se pudo leer accountRestrictions:', e);
    }
  }, [uid]);

  const refrescarPrivados = useCallback(async () => {
    if (!uid || role !== 'admin') {
      setPrivados({});
      return;
    }
    try {
      setPrivados(await leerPrivadosAdmin(uid, true));
    } catch (e) {
      console.error('[Admin] No se pudo leer userPrivate:', e);
    }
  }, [uid, role]);

  useEffect(() => {
    if (!uid) {
      setDocs(EMPTY);
      setPrivados({});
      setRestricciones({});
      setLoading(false);
      return;
    }

    let activo = true;
    const necesitaUsuarios = activeSection === 'users';
    setLoading(secciones.length > 0);
    setError(null);

    const tareas: Promise<unknown>[] = secciones.map(async (section) => {
      try {
        const datos = await leerSeccionAdmin(uid, section);
        if (!activo) return;
        setDocs((prev) => ({ ...prev, [section]: datos }));
        setConteos((prev) => ({ ...prev, [section]: datos.length }));
      } catch (e) {
        if (!activo) return;
        const error = e instanceof Error ? e : new Error(String(e));
        console.error(`[Admin] Error leyendo "${COLLECTION_MAP[section]}":`, error);
        setError(
          `No se pudo leer "${COLLECTION_MAP[section]}": ${error.message}. ` +
          `Comprueba que tienes rol admin o moderador y que las reglas están desplegadas.`,
        );
      }
    });

    // Los datos de gestión de usuarios solo se piden al abrir esa
    // pestaña. Antes se leían siempre, aunque el admin estuviera
    // editando un anime.
    if (necesitaUsuarios) {
      tareas.push(
        leerRestriccionesAdmin(uid)
          .then((datos) => { if (activo) setRestricciones(datos); })
          .catch((e: Error) => {
            if (activo) console.error('[Admin] No se pudo leer accountRestrictions:', e);
          }),
      );

      // El correo y el resto de preferencias privadas solo los puede
      // listar un admin. Si una sesión pasa de admin a moderador, se
      // vacía lo que ya se había leído para no dejar estado residual.
      if (role === 'admin') {
        tareas.push(
          leerPrivadosAdmin(uid)
            .then((datos) => { if (activo) setPrivados(datos); })
            .catch((e: Error) => {
              if (!activo) return;
              console.error('[Admin] No se pudo leer userPrivate:', e);
              setError(
                `No se pudieron leer los datos privados de los usuarios: ${e.message}. ` +
                'Comprueba que tienes rol admin y que las reglas están desplegadas.',
              );
            }),
        );
      }
    } else {
      setPrivados({});
      setRestricciones({});
    }

    void Promise.allSettled(tareas).then(() => {
      if (activo) setLoading(false);
    });

    return () => {
      activo = false;
    };
  }, [uid, role, activeSection, secciones]);

  // Los editores del catálogo invalidan su colección al guardar. El
  // panel recarga solo la sección que está cargada. Las que no se
  // han abierto no se leen "por si acaso": se pedirán al entrar.
  useEffect(() => {
    const alInvalidar = (event: Event) => {
      const key = (event as CustomEvent<{ key?: string }>).detail?.key;
      if (!key) return;
      const section = SECTION_BY_CACHE_KEY[key];
      if (section && secciones.includes(section)) {
        void refrescarSeccion(section, true);
      }
    };
    window.addEventListener('geekapoo:cache-invalidated', alInvalidar);
    return () => window.removeEventListener('geekapoo:cache-invalidated', alInvalidar);
  }, [refrescarSeccion, secciones]);

  const counts = useMemo(() => {
    const out = {} as Record<AdminSection, number>;
    LISTENED_SECTIONS.forEach((s) => {
      out[s] = conteos[s] ?? docs[s].length;
    });
    // Estas no se escuchan aquí; la pestaña las pinta a 0 y sus
    // datos vienen de SiteContentContext o de otras secciones.
    out.weeklyWorks = 0;
    out.settings = 0;
    out.triviaDiaria = 0;
    out.reportes = 0;
    out.gamificacion = 0;
    return out;
  }, [conteos, docs]);

  // ── Gestión de usuarios ─────────────────────────────

  const users: (User & { id: string })[] = useMemo(
    () =>
      docs.users.map((u) => {
        const privado = privados[u.id];
        const restriccion = restricciones[u.id];
        // El registro duradero manda desde que existe, aunque esté
        // levantado. La copia pública antigua solo se usa mientras
        // el perfil no tenga registro; así un desbaneo no se queda
        // pisado por una bandera vieja.
        const baneado = restriccion
          ? restriccion.activo === true && restriccion.tipo === 'ban'
          : u.isBanned === true;

        return {
          // El perfil público, sin los campos antiguos que todavía
          // pueda conservar un documento sin migrar. El correo solo
          // lo añade el listener privado, que únicamente abre un
          // admin. Un moderador ve la ficha sin datos privados.
          ...(soloCamposPublicos(u as unknown as User) as unknown as User),
          id: u.id,
          // El correo privado manda; el público es solo el respaldo
          // de una cuenta sin migrar, y únicamente lo ve un admin.
          email:
            currentUser?.role === 'admin'
              ? privado?.email ??
                (typeof u.email === 'string' ? u.email : undefined)
              : undefined,
          isBanned: baneado,
          createdAt: toIsoString(u.createdAt),
        };
      }),
    [docs.users, privados, restricciones, currentUser?.role],
  );

  const setUserRole = useCallback(
    async (userId: string, nuevoRol: User['role']): Promise<void> => {
      await updateDoc(doc(db, 'users', userId), { role: nuevoRol });
      await refrescarSeccion('users');
    },
    [refrescarSeccion],
  );

  /**
   * Banea o desbanea a un usuario.
   *
   * NO escribe `users/{uid}.isBanned` desde el cliente. Las
   * callables `banearUsuario` / `desbanearUsuario` escriben SOLO
   * el registro duradero `accountRestrictions`, que es la fuente
   * de verdad y sobrevive a borrar y recrear el perfil.
   */
  const setUserBanned = useCallback(async (userId: string, banned: boolean): Promise<void> => {
    const nombre = banned ? 'banearUsuario' : 'desbanearUsuario';
    const llamar = httpsCallable<{ uid: string }, { ok: boolean }>(functions, nombre);
    await llamar({ uid: userId });
    await refrescarRestricciones();
  }, [refrescarRestricciones]);

  /**
   * Borra el documento de un usuario de Firestore.
   *
   * OJO con lo que esto NO hace: la cuenta de Firebase Auth sigue
   * existiendo. El que se borra es el perfil de la aplicación (su
   * nombre, su avatar, su chatId y su rol). Si esa persona vuelve
   * a entrar con el mismo correo, la app le crea un documento
   * nuevo y entra con normalidad.
   *
   * Por eso, si lo que se quiere es que no vuelva, hay que
   * banearlo en vez de borrarlo, o hacer las dos cosas. La cuenta
   * de Auth solo se puede borrar desde la consola de Firebase o
   * con el Admin SDK en un servidor: desde el navegador no se
   * puede, y pretender lo contrario sería engañoso.
   */
  const deleteUser = useCallback(async (userId: string): Promise<void> => {
    // Primero los datos privados. Si se borrara el perfil público
    // y fallara esta escritura, el correo y las preferencias
    // quedarían huérfanos en `userPrivate` aunque ya no hubiera
    // perfil que enseñar.
    await deleteDoc(doc(db, USER_PRIVATE, userId));
    await deleteDoc(doc(db, 'users', userId));
    await Promise.all([
      refrescarSeccion('users'),
      refrescarPrivados(),
      refrescarRestricciones(),
    ]);
  }, [refrescarSeccion, refrescarPrivados, refrescarRestricciones]);

  // ── Tickets de soporte ─────────────────────────────

  const tickets: (SupportTicket & { id: string })[] = useMemo(
    () =>
      docs.tickets.map((t) => ({
        ...(t as unknown as SupportTicket),
        id: t.id,
        createdAt: toIsoString(t.createdAt),
      })),
    [docs.tickets],
  );

  const setTicketStatus = useCallback(
    async (ticketId: string, status: SupportTicket['status']): Promise<void> => {
      await updateDoc(doc(db, SUPPORT_TICKETS, ticketId), { status });
      await refrescarSeccion('tickets');
    },
    [refrescarSeccion],
  );

  return {
    loading,
    error,
    counts,
    users,
    setUserRole,
    setUserBanned,
    deleteUser,
    tickets,
    setTicketStatus,
    // Documentos en crudo, para los editores que necesitan
    // todos los campos y no solo una imagen y un nombre.
    animes: docs.animes,
    seasons: docs.seasons,
    episodes: docs.episodes,
    characters: docs.characters,
    trivia: docs.trivia,
    categories: docs.categories,
    threads: docs.threads,
  };
}
