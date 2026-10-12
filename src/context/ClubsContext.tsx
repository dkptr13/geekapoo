import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  abandonarClub,
  aceptarSolicitud,
  actualizarClub,
  cambiarRol,
  crearClub,
  eliminarClub,
  getClub,
  listarClubes,
  quitarMiembro,
  rechazarSolicitud,
  silenciarMiembro,
  solicitarEntrada,
  subscribeMisClubes,
  subscribeSolicitudesClub,
  transferirPropiedad,
  type ClubResult,
  type NuevoClub,
} from '../services/clubs';

import {
  eliminarMensajeClub,
  esModerador,
  esPropietario,
  rolDe,
} from '../services/clubs';

import { useAuth } from './AuthContext';
import type {
  Club,
  ClubCategory,
  ClubListing,
  ClubMember,
  ClubRequest,
} from '../types';

// ======================================================
// CLUBES: ESTADO GLOBAL
// ======================================================
// El contexto guarda la lista de clubes del usuario y las
// solicitudes que debe revisar. No guarda los mensajes: eso
// es cosa del `ChatContext`, que ya se encarga del chat
// grupal de cada club porque el chat de un club es un
// documento de `chats/` más.
//
// Cada club se comporta como una conversación normal en la
// interfaz: se abre con el mismo componente que los chats
// privados, pero con la cabecera y los permisos propios.
// ======================================================

type ClubChatInfo = {
  clubId: string;
  chatId: string;
};

interface ClubsContextType {
  /** Clubes a los que pertenece el usuario. */
  misClubes: Club[];
  /** Clubes para descubrir (galería). */
  descubrir: ClubListing[];
  /** Solicitudes pendientes de los clubes que modero. */
  solicitudesPendientes: ClubRequest[];
  loading: boolean;
  error: string | null;
  /** Recarga la galería de descubrimiento. */
  refrescarDescubrir: (
    busqueda?: string,
    categoria?: ClubCategory | 'todas',
  ) => Promise<void>;

  /** Crea un club. El usuario queda como propietario. */
  crear: (datos: NuevoClub) => Promise<ClubResult>;
  /** Pide entrar en un club (o entra directamente si es público). */
  unirse: (club: Club) => Promise<ClubResult>;
  /** Sale del club. */
  abandonar: (club: Club) => Promise<ClubResult>;

  /** Acepta una solicitud de acceso. */
  aceptar: (clubId: string, request: ClubRequest) => Promise<ClubResult>;
  /** Rechaza una solicitud de acceso. */
  rechazar: (clubId: string, requestId: string) => Promise<ClubResult>;

  /** Expulsa a un miembro. */
  expulsar: (clubId: string, uid: string) => Promise<ClubResult>;
  /** Cambia el rol de un miembro. */
  rol: (clubId: string, uid: string, rol: 'moderator' | 'member') => Promise<ClubResult>;
  /** Transfiere la propiedad del club. */
  transferir: (clubId: string, nuevoOwnerId: string) => Promise<ClubResult>;
  /** Silencia a un miembro. Cadena vacía = quitar el silencio. */
  silenciar: (clubId: string, uid: string, hastaIso: string) => Promise<ClubResult>;
  /** Actualiza la configuración del club. */
  actualizar: (clubId: string, cambios: Partial<Club>) => Promise<ClubResult>;
  /** Elimina el club. */
  eliminar: (clubId: string) => Promise<ClubResult>;
  /** Borra un mensaje del chat del club (moderación). */
  borrarMensaje: (chatId: string, messageId: string) => Promise<ClubResult>;

  /** Si el usuario es propietario del club. */
  soyPropietario: (club: Club | null) => boolean;
  /** Si el usuario es moderador (o propietario) del club. */
  soyModerador: (club: Club | null) => boolean;
  /** Rol del usuario en el club. */
  miRolEn: (club: Club | null) => ClubMember | null;

  /** Club abierto en la vista de chat, si es un club. */
  clubActivo: Club | null;
  setClubActivo: (club: Club | null) => void;
}

const ClubsContext = createContext<ClubsContextType | undefined>(undefined);

export const ClubsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const [misClubes, setMisClubes] = useState<Club[]>([]);
  const [descubrir, setDescubrir] = useState<ClubListing[]>([]);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState<ClubRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clubActivo, setClubActivo] = useState<Club | null>(null);

  // ── Clubes del usuario ───────────────────────────────
  //
  // La consulta es la que garantiza que nadie ve clubes
  // ajenos: filtra por `memberIds array-contains`, igual que
  // la regla de seguridad. Un usuario sin sesión no recibe
  // nada, ni siquiera la galería pública.
  useEffect(() => {
    if (!currentUser) {
      setMisClubes([]);
      setSolicitudesPendientes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsub = subscribeMisClubes(
      currentUser.uid,
      (clubs) => {
        setMisClubes(clubs);
        setLoading(false);
        setError(null);
      },
      (e) => {
        console.error('[Clubes] Error al leer los clubes:', e);
        setError('No se pudo cargar la lista de clubes.');
        setLoading(false);
      },
    );

    return unsub;
  }, [currentUser]);

  // ── Solicitudes de los clubes que modero ─────────────
  //
  // Cada club tiene su propia subcolección de solicitudes, así
  // que hay una escucha por club. Se montan y se desmontan
  // según cambia la lista de clubes moderados, para no dejar
  // escuchas colgando de clubes que ya no lo son.
  const clubesModerados = useMemo(
    () => misClubes.filter((c) => esModerador(c, currentUser?.uid ?? null)),
    [misClubes, currentUser],
  );

  useEffect(() => {
    if (clubesModerados.length === 0) {
      setSolicitudesPendientes([]);
      return;
    }

    const desuscrs = clubesModerados.map((club) =>
      subscribeSolicitudesClub(
        club.id,
        (reqs) => {
          setSolicitudesPendientes((prev) => {
            const deOtros = prev.filter((r) => r.clubId !== club.id);
            return [...deOtros, ...reqs.map((r) => ({ ...r, clubId: club.id }))];
          });
        },
        () => undefined,
      ),
    );

    return () => desuscrs.forEach((d) => d());
  }, [clubesModerados]);

  const refrescarDescubrir = useCallback(
    async (busqueda = '', categoria: ClubCategory | 'todas' = 'todas') => {
      try {
        const clubs = await listarClubes(busqueda, categoria);
        setDescubrir(clubs);
      } catch (e) {
        console.error('[Clubes] Error al buscar clubes:', e);
        setError('No se pudo cargar la galería de clubes.');
      }
    },
    [],
  );

  // La galería se carga al montar: no depende de la sesión
  // porque un visitante puede ver los clubes públicos.
  useEffect(() => {
    void refrescarDescubrir();
  }, [refrescarDescubrir]);

  const crear = useCallback(
    async (datos: NuevoClub): Promise<ClubResult> => {
      if (!currentUser) return { ok: false, error: 'Debes iniciar sesión.' };

      const result = await crearClub(currentUser, datos);
      if (!result.ok) return result;

      // El club recién creado se añade a la lista sin esperar
      // al listener, así que se abre al instante. Sin el
      // `some` de abajo, el añadido optimista MÁS el listener
      // pintaban la misma fila dos veces en «Mis clubes».
      const nuevo = await getClub(result.clubId!);
      if (nuevo) {
        setMisClubes((prev) =>
          prev.some((c) => c.id === nuevo.id)
            ? prev.map((c) => (c.id === nuevo.id ? nuevo : c))
            : [nuevo, ...prev],
        );
        // Y aparece al instante en «Descubrir» sin esperar al
        // refresco de la galería. Los privados no salen ahí por
        // diseño (las reglas ni siquiera dejan leerlos a quien
        // no es miembro).
        if (nuevo.accessType !== 'private') {
          setDescubrir((prev) =>
            prev.some((c) => c.id === nuevo.id)
              ? prev
              : [
                  {
                    id: nuevo.id,
                    slug: nuevo.slug,
                    name: nuevo.name,
                    description: nuevo.description,
                    category: nuevo.category,
                    coverUrl: nuevo.coverUrl,
                    iconUrl: nuevo.iconUrl,
                    accessType: nuevo.accessType,
                    ownerId: nuevo.ownerId,
                    ownerName: '',
                    moderatorIds: nuevo.moderatorIds,
                    memberCount: nuevo.memberCount,
                    createdAt: nuevo.createdAt,
                  },
                  ...prev,
                ],
          );
        }
        setClubActivo(nuevo);
      }

      return result;
    },
    [currentUser],
  );

  const unirse = useCallback(
    async (club: Club): Promise<ClubResult> => {
      if (!currentUser) return { ok: false, error: 'Debes iniciar sesión para unirte.' };

      return solicitarEntrada(club, currentUser);
    },
    [currentUser],
  );

  const abandonar = useCallback(
    async (club: Club): Promise<ClubResult> => {
      if (!currentUser) return { ok: false, error: 'Debes iniciar sesión.' };

      const result = await abandonarClub(club, currentUser.uid);
      if (result.ok && clubActivo?.id === club.id) {
        setClubActivo(null);
      }
      return result;
    },
    [currentUser, clubActivo],
  );

  const aceptar = useCallback(
    async (clubId: string, request: ClubRequest): Promise<ClubResult> => {
      const result = await aceptarSolicitud(clubId, request);
      if (result.ok) {
        setSolicitudesPendientes((prev) => prev.filter((r) => r.id !== request.id));
      }
      return result;
    },
    [],
  );

  const rechazar = useCallback(
    async (clubId: string, requestId: string): Promise<ClubResult> => {
      const result = await rechazarSolicitud(clubId, requestId);
      if (result.ok) {
        setSolicitudesPendientes((prev) => prev.filter((r) => r.id !== requestId));
      }
      return result;
    },
    [],
  );

  const expulsar = useCallback(
    (clubId: string, uid: string) => quitarMiembro(clubId, uid),
    [],
  );

  const rol = useCallback(
    (clubId: string, uid: string, nuevoRol: 'moderator' | 'member') =>
      cambiarRol(clubId, uid, nuevoRol),
    [],
  );

  const transferir = useCallback(
    (clubId: string, nuevoOwnerId: string) =>
      transferirPropiedad(clubId, nuevoOwnerId),
    [],
  );

  const silenciar = useCallback(
    (clubId: string, uid: string, hastaIso: string) =>
      silenciarMiembro(clubId, uid, hastaIso),
    [],
  );

  const actualizar = useCallback(
    async (clubId: string, cambios: Partial<Club>): Promise<ClubResult> => {
      const result = await actualizarClub(clubId, cambios);
      if (result.ok && clubActivo?.id === clubId) {
        setClubActivo((prev) => (prev ? { ...prev, ...cambios } : prev));
      }
      return result;
    },
    [clubActivo],
  );

  const eliminar = useCallback(
    async (clubId: string): Promise<ClubResult> => {
      const result = await eliminarClub(clubId);
      if (result.ok && clubActivo?.id === clubId) {
        setClubActivo(null);
      }
      return result;
    },
    [clubActivo],
  );

  const borrarMensaje = useCallback(
    (chatId: string, messageId: string) => {
      const mod = misClubes
        .find((c) => c.chatId === chatId)
        ?.members[currentUser?.uid ?? ''];
      return eliminarMensajeClub(chatId, messageId, currentUser?.uid ?? mod?.uid ?? '');
    },
    [misClubes, currentUser],
  );

  const soyPropietario = useCallback(
    (club: Club | null) => esPropietario(club, currentUser?.uid ?? null),
    [currentUser],
  );

  const soyModerador = useCallback(
    (club: Club | null) => esModerador(club, currentUser?.uid ?? null),
    [currentUser],
  );

  const miRolEn = useCallback(
    (club: Club | null) => rolDe(club, currentUser?.uid ?? null),
    [currentUser],
  );

  const value: ClubsContextType = useMemo(
    () => ({
      misClubes,
      descubrir,
      solicitudesPendientes,
      loading,
      error,
      refrescarDescubrir,
      crear,
      unirse,
      abandonar,
      aceptar,
      rechazar,
      expulsar,
      rol,
      transferir,
      silenciar,
      actualizar,
      eliminar,
      borrarMensaje,
      soyPropietario,
      soyModerador,
      miRolEn,
      clubActivo,
      setClubActivo,
    }),
    [
      misClubes,
      descubrir,
      solicitudesPendientes,
      loading,
      error,
      refrescarDescubrir,
      crear,
      unirse,
      abandonar,
      aceptar,
      rechazar,
      expulsar,
      rol,
      transferir,
      silenciar,
      actualizar,
      eliminar,
      borrarMensaje,
      soyPropietario,
      soyModerador,
      miRolEn,
      clubActivo,
    ],
  );

  return <ClubsContext.Provider value={value}>{children}</ClubsContext.Provider>;
};

export const useClubs = (): ClubsContextType => {
  const context = useContext(ClubsContext);
  if (!context) throw new Error('useClubs must be used within a ClubsProvider');
  return context;
};
