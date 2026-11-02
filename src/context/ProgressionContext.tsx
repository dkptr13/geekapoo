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
  aProgreso,
  escucharProgreso,
  equiparTitulo,
  getConfigCached,
  type ProgresoCrudo,
} from '../services/gamification';
import {
  catalogoConAnimeIds,
  nivelDesdeXp,
  progresoDeMedalla,
  rangoDeNivel,
} from '../utils/progression';

import {
  detectarMedallasNuevas,
  detectarSubidaNivel,
  laMasRara,
} from '../utils/medallas';
import {
  apuntarCelebradas,
  guardadoNavegador,
  leerCelebradas,
} from '../utils/celebraciones';
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

  // ====================================================
  // ESCUCHA DEL PROGRESO
  // ====================================================

  useEffect(() => {
    if (!uid) {
      setProgreso(null);
      setLoading(false);
      return;
    }

    // El perfil propio ya llega en vivo por AuthContext. Abrir otro
    // listener sobre `users/{uid}` duplicaba la misma lectura y cada
    // cambio de XP activaba los dos.
    if (uid === currentUser?.uid) {
      setProgreso(aProgreso(currentUser as unknown as Record<string, unknown>));
      setLoading(false);
    }
  }, [uid, currentUser]);

  useEffect(() => {
    if (!uid || uid === currentUser?.uid) return;
    setLoading(true);

    const cancelar = escucharProgreso(uid, (p) => {
      setProgreso(p);
      setLoading(false);
      // El error no se limpia aqui a proposito: si venia de antes
      // se mantiene, y cada fallo nuevo lo vuelve a poner.
    });

    return cancelar;
  }, [uid, currentUser?.uid]);

  // ====================================================
  // ESCUCHA DE LA CONFIGURACION
  // ====================================================

  useEffect(() => {
    if (!currentUser) {
      setConfig(CONFIG_POR_DEFECTO);
      setError(null);
      return;
    }

    let activo = true;
    const cargar = (force = false) => {
      void getConfigCached(force)
        .then((c) => {
          if (!activo) return;
          setConfig(c);
          setError(null);
        })
        .catch((e: Error) => {
          console.warn('[Gamificacion] No se pudo leer la configuracion:', e.message);
        });
    };
    const alInvalidar = (event: Event) => {
      const key = (event as CustomEvent<{ key?: string }>).detail?.key;
      if (key === 'gamification:config') void cargar(true);
    };
    window.addEventListener('geekapoo:cache-invalidated', alInvalidar);
    cargar();

    return () => {
      activo = false;
      window.removeEventListener('geekapoo:cache-invalidated', alInvalidar);
    };
    // Depende de la sesión porque la configuración exige usuario
    // autenticado; al entrar se vuelve a leer con token.
  }, [currentUser?.uid]);

  // ====================================================
  // AVISOS
  // ====================================================

  /**
   * Lo ya celebrado por este usuario en este navegador.
   *
   * ── POR QUÉ PERSISTE ──────────────────────────────────────────
   *
   * La regla es "una medalla se celebra UNA vez, al conseguirla, y
   * nunca más". Con solo memoria de sesión, cada remontaje, cada
   * cambio de usuario y cada primera lectura con el documento vacío
   * volvía a empezar de cero, y el aviso salía en cada inicio de
   * sesión. Por eso lo visto vive en `localStorage` (ver
   * `utils/celebraciones.ts`) y aquí solo se consulta.
   *
   * El conjunto mezcla medallas y subidas: las subidas van con
   * prefijo `nivel:` y no chocan con ningún id de medalla.
   *
   * `null` significa "sin sembrar": todavía no se ha leído el
   * documento con este usuario. Al cambiar de usuario se vuelve a
   * `null`, porque lo visto por otro no vale y su aviso pendiente
   * no puede quedarse colgado.
   */
  const vistos = useRef<Set<string> | null>(null);
  const primeraMedalla = useRef(true);
  const primeraSubida = useRef(true);

  // Al cambiar de usuario se resiembra todo y se apagan los avisos
  // del anterior. Sin esto, entrar con otra cuenta celebraría sus
  // medallas como si fueran nuevas.
  useEffect(() => {
    vistos.current = null;
    primeraMedalla.current = true;
    primeraSubida.current = true;
    setMedallaPendiente(null);
    setSubidaPendiente(null);
  }, [uid]);

  // Detecta una subida de nivel comparando con lo ya celebrado.
  //
  // Se apoya en `lastLevelUpAt`, que escriben las funciones solo al
  // subir de verdad. Pero solo se celebra si la clave aparece
  // DESPUÉS de haber leído el documento: lo que ya estaba al entrar
  // es historial, no algo que acaba de pasar.
  useEffect(() => {
    if (!uid || !progreso?.lastLevelUpAt) return;

    if (vistos.current === null) {
      vistos.current = leerCelebradas(guardadoNavegador(), uid);
    }

    const clave = `${progreso.lastLevelUpAt}`;
    const llave = `nivel:${clave}`;

    const { avisar } = detectarSubidaNivel(
      clave,
      vistos.current.has(llave) ? clave : null,
      primeraSubida.current,
    );

    // Se apunta se avise o no: lo que ya estaba al entrar es
    // historial, y lo celebrado no se repite.
    vistos.current.add(llave);
    apuntarCelebradas(guardadoNavegador(), uid, vistos.current, [llave]);
    primeraSubida.current = false;

    if (!avisar) return;

    setSubidaPendiente({
      nivel: progreso.lastLevelUpLevel ?? progreso.level,
      key: Date.now(),
    });
  }, [uid, progreso?.lastLevelUpAt, progreso?.lastLevelUpLevel, progreso?.level]);

  /** Análoga para las medallas nuevas. */
  useEffect(() => {
    if (!uid || !progreso?.medals) return;

    if (vistos.current === null) {
      vistos.current = leerCelebradas(guardadoNavegador(), uid);
    }

    const ids = Object.keys(progreso.medals);
    const { celebrar, nuevas } = detectarMedallasNuevas(
      vistos.current,
      ids,
      primeraMedalla.current,
    );

    // Se apunta TODO lo nuevo, se celebre o no: de las que salen a
    // la vez solo se avisa la más rara, y las demás tampoco pueden
    // salir después. "Solo una vez" vale para cada medalla.
    nuevas.forEach((id) => vistos.current!.add(id));
    apuntarCelebradas(guardadoNavegador(), uid, vistos.current, nuevas);
    primeraMedalla.current = false;

    if (celebrar.length === 0) return;

    // Se elige la mas rara de las nuevas: si a la vez le dan tres
    // medallas, avisar solo por la mejor es menos molesto que
    // encadenar tres avisos.
    const configActual = catalogoConAnimeIds(config.animeMedallas ?? {});
    const mejor = laMasRara(celebrar, configActual);

    if (mejor) setMedallaPendiente(mejor);
  }, [uid, progreso?.medals, config]);

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
      xp: progreso?.xp ?? 0,
      // Series distintas con actividad: claves de animeXp con XP
      // mayor que cero. Es "en cuántos animes has participado".
      seriesDiferentes: Object.values(stats?.animeXp ?? {}).filter(
        (v) => typeof v === 'number' && v > 0,
      ).length,
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
      dias: stats?.diasActivosTotal ?? 0,
      clubes: Object.keys(stats?.clubesUnidos ?? {}).length,
      clubesCreados: Object.keys(stats?.clubesCreados ?? {}).length,
      canales: Object.keys(stats?.canalesCreados ?? {}).length,
      chats: Object.keys(stats?.chatsPropios ?? {}).length,
      tiers: Object.keys(stats?.tiersCreadas ?? {}).length,
      encuestas: Object.keys(stats?.encuestasCreadas ?? {}).length,
      antiguedadDias: progreso?.antiguedadDias ?? 0,
      perfilCompleto: progreso?.perfilCompleto ?? false,
      perfilCustom: progreso?.perfilCustom ?? false,
      visuales: Object.keys(stats?.visualesIds ?? {}).length,
      tiersPopulares: Object.keys(stats?.tiersPopularesIds ?? {}).length,
      hilosTopico: (topico: string) =>
        Object.keys(stats?.hilosPorTopico?.[topico] ?? {}).length,
      topicosDistintos: Object.values(stats?.hilosPorTopico ?? {}).filter(
        (m) => m && typeof m === 'object' && Object.keys(m).length > 0,
      ).length,
    };

    return conIds.map((medal) => {
      const fecha = medals[medal.id];
      const desbloqueada = Boolean(fecha);
      const { progreso: p, falta } = progresoDeMedalla(medal.requisito, medidas);

      // Pendiente = su sistema no existe todavía: sin barra que
      // confunda, solo el motivo.
      if (!desbloqueada && medal.disponible === false) {
        return {
          medal,
          desbloqueada,
          fecha: null,
          progreso: 0,
          falta: medal.motivoPendiente ?? 'Próximamente',
        };
      }

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
