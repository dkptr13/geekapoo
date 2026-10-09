import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  CONFIG_POR_DEFECTO,
  type GamificationConfig,
  type Medal,
  type MedalStatus,
} from '../types/gamification';
import {
  escucharConfiguracion,
  escucharProgreso,
  equiparTitulo,
  type ProgresoCrudo,
} from '../services/gamification';
import {
  catalogoConAnimeIds,
  nivelDesdeXp,
  progresoDeMedalla,
  rangoDeNivel,
} from '../utils/progression';

import { useAuth } from './AuthContext';

// ======================================================
// PROGRESION DEL USUARIO
// ======================================================
//
// Se escucha el documento del usuario con un listener propio,
// aparte del `getDoc` que hace `AuthContext` al iniciar sesion.
// Ese `getDoc` es una foto: si el XP sube despues, el perfil
// seguira enseñando el nivel viejo hasta que se recargue.
//
// A quien se le escucha:
//   - el propio usuario, para su perfil y su aviso de subida
//   - el usuario que se este mirando, si el perfil llegara a
//     mostrar el progreso de otro
//   - si no hay ninguno, no se escucha nada

export interface ProgressionContextType {
  /** Progreso del usuario mirado, o `null` si no hay. */
  progreso: ProgresoCrudo | null;
  /** Configuracion vigente. Nunca es `undefined`. */
  config: GamificationConfig;

  /** Nivel, calculado en el cliente para pintar sin esperar. */
  nivel: number;
  /** "Novato", "Veterano Geek"... */
  rango: string;
  /** 0 a 1. En el nivel maximo es 1. */
  progresoNivel: number;
  /** XP que falta para el siguiente nivel. 0 en el tope. */
  faltaParaSiguiente: number;
  /** En el nivel maximo, `true`. */
  enNivelMaximo: boolean;

  /** El catalogo con el estado de este usuario. */
  catalogo: MedalStatus[];
  /** Solo las ya desbloqueadas. */
  desbloqueadas: Medal[];
  /** La medalla del titulo equipado, o `null`. */
  titulo: Medal | null;

  /** Cambia el titulo equipado. Lanza si no está desbloqueado. */
  equipar: (medalId: string | null) => Promise<void>;
  /** Si hay una subida de nivel pendiente de avisar. */
  subidaPendiente: { nivel: number; key: number } | null;
  /** Cierra el aviso de subida. */
  cerrarAviso: () => void;
  /** Si hay alguna medalla nueva pendiente de celebrar. */
  medallaPendiente: Medal | null;
  cerrarMedalla: () => void;

  loading: boolean;
  error: string | null;
}

const ProgressionContext = createContext<ProgressionContextType | undefined>(undefined);

export const ProgressionProvider: React.FC<{
  children: React.ReactNode;
  /** Usuario cuyo progreso se mira. Por defecto, el de la sesion. */
  uid?: string | null;
}> = ({ children, uid: uidForzado }) => {
  const { currentUser } = useAuth();

  const uid = uidForzado !== undefined ? uidForzado : (currentUser?.uid ?? null);

  const [progreso, setProgreso] = useState<ProgresoCrudo | null>(null);
  const [config, setConfig] = useState<GamificationConfig>(CONFIG_POR_DEFECTO);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [subidaPendiente, setSubidaPendiente] = useState<{
    nivel: number;
    key: number;
  } | null>(null);
  const [medallaPendiente, setMedallaPendiente] = useState<Medal | null>(null);

  /**
   * Ultima subida de nivel que ya se ha avisado.
   *
   * Se guarda en una ref y no en estado porque no debe provocar
   * un repintado, y porque necesita sobrevivir a los renders: sin
   * esto, el aviso saltaria cada vez que se montara el componente.
   */
  const ultimaSubidaVista = useRef<string | null>(null);

  // ====================================================
  // ESCUCHA DEL PROGRESO
  // ====================================================

  useEffect(() => {
    setLoading(true);

    const cancelar = escucharProgreso(uid, (p) => {
      setProgreso(p);
      setLoading(false);
      // El error no se limpia aqui a proposito: si venia de antes
      // se mantiene, y cada fallo nuevo lo vuelve a poner.
    });

    return cancelar;
  }, [uid]);

  // ====================================================
  // ESCUCHA DE LA CONFIGURACION
  // ====================================================

  useEffect(() => {
    const cancelar = escucharConfiguracion((c) => {
      setConfig(c);
      setError(null);
    });
    return cancelar;
  }, []);

  // ====================================================
  // AVISOS
  // ====================================================

  /**
   * Detecta una subida de nivel comparando con lo que ya se ha
   * avisado.
   *
   * Se apoya en `lastLevelUpAt`, que escriben las funciones solo
   * al subir de verdad. Asi el aviso no depende de que el
   * listener haya estado conectado en el momento exacto de la
   * subida: si alguien estaba en otra pestana y vuelve, ve el
   * aviso de lo que se ha perdido, que es justo lo que quiere.
   */
  useEffect(() => {
    if (!progreso?.lastLevelUpAt) return;

    // La clave de unicidad es la marca de tiempo de la subida, no
    // el nivel: si se sube dos veces al mismo nivel en dos
    // momentos distintos, tiene que avisar las dos.
    const clave = `${progreso.lastLevelUpAt}`;
    if (clave === ultimaSubidaVista.current) return;

    ultimaSubidaVista.current = clave;
    setSubidaPendiente({
      nivel: progreso.lastLevelUpLevel ?? progreso.level,
      key: Date.now(),
    });
  }, [progreso?.lastLevelUpAt, progreso?.lastLevelUpLevel, progreso?.level]);

  /** Analoga para las medallas nuevas. */
  const medalsVistas = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!progreso?.medals) return;

    const nuevas = Object.keys(progreso.medals).filter(
      (id) => medalsVistas.current[id] !== progreso.medals[id],
    );

    // La primera vez que llegan medallas no se celebran: son las
    // que ya tenia el usuario de antes, no algo que acaba de
    // conseguir. Para no saltarse ninguna hay que haber visto el
    // documento al menos una vez.
    const primeraCarga =
      Object.keys(medalsVistas.current).length === 0 &&
      ultimaSubidaVista.current === null;

    nuevas.forEach((id) => {
      medalsVistas.current[id] = progreso.medals[id];
    });

    if (primeraCarga || nuevas.length === 0) return;

    // Se elige la mas rara de las nuevas: si a la vez le dan tres
    // medallas, avisar solo por la mejor es menos molesto que
    // encadenar tres avisos.
    const configActual = catalogoConAnimeIds(config.animeMedallas ?? {});
    const mejor = nuevas
      .map((id) => configActual.find((m) => m.id === id))
      .filter((m): m is Medal => Boolean(m))
      .sort((a, b) => b.rareza.length - a.rareza.length)[0];

    if (mejor) setMedallaPendiente(mejor);
  }, [progreso?.medals, config]);

  // ====================================================
  // CALCULOS
  // ====================================================

  const calculos = useMemo(() => {
    const xp = progreso?.xp ?? 0;

    // El nivel se recalcula aqui en vez de fiarse del que viene
    // guardado. Motivo: el cliente y las funciones tienen copias
    // de la curva, y si alguien cambia la curva sin pasar por las
    // funciones, el numero guardado seria el viejo y la barra se
    // veria a medias. Recalculando, siempre cuadra con lo que se
    // pinta. El valor guardado se usa para el aviso, que es lo
    // unico donde importa decir "el nivel al que subiste".
    const nivelActual = nivelDesdeXp(xp, config);

    const nivel = nivelActual.level || 1;
    const enMaximo = config.nivelesMaximos > 0 && nivel >= config.nivelesMaximos;

    const progresoNivel =
      enMaximo || nivelActual.xpParaSiguienteNivel === 0
        ? 1
        : Math.min(1, nivelActual.xpEnNivel / nivelActual.xpParaSiguienteNivel);

    return {
      nivel,
      rango: rangoDeNivel(nivel),
      progresoNivel,
      faltaParaSiguiente: Math.max(
        0,
        nivelActual.xpParaSiguienteNivel - nivelActual.xpEnNivel,
      ),
      enNivelMaximo: enMaximo,
    };
  }, [progreso?.xp, config]);

  /**
   * Catalogo con el estado de este usuario.
   *
   * Se resuelve el `animeId` de las medallas tematicas con lo que
   * haya en la configuracion. Si no hay ninguno pondrado, el
   * requisito conserva el marcador de texto y la medalla se
   * queda como imposible: es preferible a fingir que se puede
   * ganar con un anime que no existe.
   */
  const catalogo = useMemo<MedalStatus[]>(() => {
    const conIds = catalogoConAnimeIds(config.animeMedallas ?? {});
    const medals = progreso?.medals ?? {};
    const stats = progreso?.stats;

    const medidas = {
      hilos: stats?.threadsCreated ?? 0,
      comentarios: stats?.commentsCreated ?? 0,
      debates: stats?.commentsInThreads ?? 0,
      likes: stats?.likesReceived ?? 0,
      nivel: calculos.nivel,
      xpEnAnime: (animeId: string) => stats?.animeXp?.[animeId] ?? 0,
      // Trivia: contadores que escribe la Cloud Function al
      // corregir el resultado. Aquí solo se leen para la barra.
      trivias: stats?.triviaCompleted ?? 0,
      aciertosTrivia: stats?.triviaCorrect ?? 0,
      triviasPerfectas: stats?.triviaPerfect ?? 0,
      rachaTrivia: stats?.triviaStreakBest ?? 0,
      // El máximo de seguidores que ha tenido, no los que tiene
      // ahora: las medallas de comunidad no se pierden por dejar de
      // seguirte (ver `MedalRequirement` en `types/gamification.ts`).
      seguidores: stats?.followersReceived ?? 0,
    };

    return conIds.map((medal) => {
      const fecha = medals[medal.id];
      const desbloqueada = Boolean(fecha);
      const { progreso: p, falta } = progresoDeMedalla(medal.requisito, medidas);

      return {
        medal,
        desbloqueada,
        fecha: desbloqueada ? fecha : null,
        progreso: desbloqueada ? 1 : p,
        falta,
      };
    });
  }, [config, progreso?.medals, progreso?.stats, calculos.nivel]);

  const desbloqueadas = useMemo(
    () => catalogo.filter((m) => m.desbloqueada).map((m) => m.medal),
    [catalogo],
  );

  /**
   * Titulo equipado.
   *
   * Se comprueba que su medalla siga desbloqueada. Puede haber
   * dejado de estarlo si un admin se la retiro, y en ese caso se
   * trata como si no hubiera titulo en vez de pintar uno que ya
   * no le corresponde.
   */
  const titulo = useMemo(() => {
    const id = progreso?.equippedTitle;
    if (!id) return null;
    return desbloqueadas.find((m) => m.id === id) ?? null;
  }, [progreso?.equippedTitle, desbloqueadas]);

  // ====================================================
  // EQUIPAR TITULO
  // ====================================================

  const equipar = useCallback(
    async (medalId: string | null) => {
      if (!uid) throw new Error('No hay ningun usuario.');
      await equiparTitulo(uid, medalId, progreso?.medals ?? {});
    },
    [uid, progreso?.medals],
  );

  const cerrarAviso = useCallback(() => setSubidaPendiente(null), []);
  const cerrarMedalla = useCallback(() => setMedallaPendiente(null), []);

  const valor: ProgressionContextType = {
    progreso,
    config,
    nivel: calculos.nivel,
    rango: calculos.rango,
    progresoNivel: calculos.progresoNivel,
    faltaParaSiguiente: calculos.faltaParaSiguiente,
    enNivelMaximo: calculos.enNivelMaximo,
    catalogo,
    desbloqueadas,
    titulo,
    equipar,
    subidaPendiente,
    cerrarAviso,
    medallaPendiente,
    cerrarMedalla,
    loading,
    error,
  };

  return <ProgressionContext.Provider value={valor}>{children}</ProgressionContext.Provider>;
};

export const useProgression = (): ProgressionContextType => {
  const ctx = useContext(ProgressionContext);
  if (!ctx) {
    throw new Error('useProgression debe usarse dentro de un ProgressionProvider');
  }
  return ctx;
};
