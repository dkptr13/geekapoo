import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';

import { db } from '../../lib/firebase';
import { collectionOf } from '../../services/catalogAdmin';
import { toIsoString } from '../../services/firestoreUtils';
import { SUPPORT_TICKETS } from '../../services/support';
import type { SupportTicket, User } from '../../types';

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

export function useAdminCatalog() {
  const [docs, setDocs] = useState<Record<ListenedSection, RawDoc[]>>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubs: (() => void)[] = [];
    let responded = 0;

    LISTENED_SECTIONS.forEach((section) => {
      unsubs.push(
        onSnapshot(
          collection(db, COLLECTION_MAP[section]),
          (snap) => {
            setDocs((prev) => ({
              ...prev,
              [section]: snap.docs.map((d) => ({ ...(d.data() as RawDoc), id: d.id })),
            }));
            responded += 1;
            if (responded === LISTENED_SECTIONS.length) setLoading(false);
          },
          (e) => {
            console.error(`[Admin] Error leyendo "${COLLECTION_MAP[section]}":`, e);
            setError(
              `No se pudo leer "${COLLECTION_MAP[section]}": ${e.message}. ` +
              `Comprueba que tienes rol admin o moderador y que las reglas están desplegadas.`,
            );
            responded += 1;
            if (responded === LISTENED_SECTIONS.length) setLoading(false);
          },
        ),
      );
    });

    return () => unsubs.forEach((u) => u());
  }, []);

  const counts = useMemo(() => {
    const out = {} as Record<AdminSection, number>;
    LISTENED_SECTIONS.forEach((s) => {
      out[s] = docs[s].length;
    });
    // Estas dos no se escuchan aquí; la pestaña las pinta a 0 y
    // sus datos vienen de SiteContentContext.
    out.weeklyWorks = 0;
    out.settings = 0;
    return out;
  }, [docs]);

  // ── Gestión de usuarios ─────────────────────────────

  const users: (User & { id: string })[] = useMemo(
    () =>
      docs.users.map((u) => ({
        ...(u as unknown as User),
        id: u.id,
        createdAt: toIsoString(u.createdAt),
      })),
    [docs.users],
  );

  const setUserRole = useCallback(
    async (uid: string, role: User['role']): Promise<void> => {
      await updateDoc(doc(db, 'users', uid), { role });
    },
    [],
  );

  const setUserBanned = useCallback(async (uid: string, banned: boolean): Promise<void> => {
    await updateDoc(doc(db, 'users', uid), { isBanned: banned });
  }, []);

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
  const deleteUser = useCallback(async (uid: string): Promise<void> => {
    await deleteDoc(doc(db, 'users', uid));
  }, []);

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
    },
    [],
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
