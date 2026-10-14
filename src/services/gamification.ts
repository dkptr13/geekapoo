import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { db, functions } from '../lib/firebase';
import { GAMIFICATION, type GamificationConfig } from '../types/gamification';
import { configDesdeFirestore } from '../utils/progression';

// ======================================================
// GAMIFICACION: LADO DEL CLIENTE
// ======================================================
//
// Aqui no se concede NADA. Solo se lee el progreso y se llama a
// las funciones del servidor, que son las unicas que escriben
// XP, nivel y medallas.
//
// Hay exactamente una escritura desde el cliente:
// `equiparTitulo`, que cambia el titulo que se ve junto al
// nombre. Las reglas de Firestore comprueban en el servidor que
// ese titulo corresponda a una medalla ya desbloqueada, asi que
// aunque alguien falsee la llamada no conseguiria un titulo que
// no le toca.

// ======================================================
// PROGRESO DEL USUARIO
// ======================================================

/**
 * Los campos de gamificacion tal y como vienen en `users/{uid}`.
 *
 * Se leen sueltos, con `unknown`, porque los documentos de
 * usuarios son heterogeneos: los que se crearon antes de que
 * existiera esto no tienen ninguno de estos campos, y los tipos
 * solo estan en TypeScript, no en el servidor. `aProgreso` se
 * encarga de poner los valores por defecto.
 */
export interface ProgresoCrudo {
  xp: number;
  level: number;
  xpEnNivel: number;
  xpParaSiguienteNivel: number;
  medals: Record<string, string>;
  equippedTitle: string | null;
  stats: {
    threadsCreated: number;
    commentsCreated: number;
    commentsInThreads: number;
    likesReceived: number;
    animeXp: Record<string, number>;
    /** Contadores de la trivia diaria (los escribe la Cloud Function). */
    triviaCompleted: number;
    triviaCorrect: number;
    triviaPerfect: number;
    triviaStreakBest: number;
    /**
     * Máximo de seguidores que ha tenido.
     *
     * No es lo mismo que `followersCount` del documento (que es el
     * número vivo): este es el techo, y por eso las medallas de
     * comunidad no se pierden al dejar de seguirte.
     */
    followersReceived: number;
    /** Días distintos con actividad que dio XP. Solo sube. */
    diasActivosTotal: number;
    /** Mapas de ids (`clubId: true`): pertenencia y creación. */
    clubesUnidos: Record<string, true>;
    clubesCreados: Record<string, true>;
    canalesCreados: Record<string, true>;
    chatsPropios: Record<string, true>;
    tiersCreadas: Record<string, true>;
    encuestasCreadas: Record<string, true>;
    visualesIds: Record<string, true>;
    tiersPopularesIds: Record<string, true>;
    /** Hilos creados por tópico oficial (`topicoId: {threadId: true}`). */
    hilosPorTopico: Record<string, Record<string, true>>;
  };
  /** Días desde el registro. 0 si no hay fecha fiable. */
  antiguedadDias: number;
  /** Nombre, bio y avatar no vacíos (mismo criterio que el servidor). */
  perfilCompleto: boolean;
  /** Personalización equipada (mismo criterio que el servidor). */
  perfilCustom: boolean;
  /** ISO de la ultima subida de nivel, para el aviso. */
  lastLevelUpAt: string | null;
  /** Nivel al que se subio en ese momento. */
  lastLevelUpLevel: number | null;
}

/**
 * Rellena los huecos de un documento de usuario.
 *
 * Todo lo que llega aqui puede faltar, y con mas razon cuanto mas
 * viejo sea el documento: un usuario de hace dos años no tiene ni
 * `xp` ni `stats`. Por eso cada campo tiene su valor por defecto
 * y ninguno se da por supuesto.
 */
export function aProgreso(data: Record<string, unknown> | undefined): ProgresoCrudo {
  const d = data ?? {};
  const stats = (d.stats ?? {}) as Record<string, unknown>;

  const numero = (v: unknown): number =>
    typeof v === 'number' && Number.isFinite(v) ? v : 0;

  const medals = (d.medals ?? {}) as Record<string, string>;

  const mapa = (v: unknown): Record<string, true> =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? (v as Record<string, true>)
      : {};

  const noVacio = (v: unknown): boolean =>
    typeof v === 'string' && v.trim().length > 0;

  // Días desde el registro para la barra de Veterano. Acepta
  // Timestamp de Firestore o ISO en texto; lo demás es cero.
  const creado = d.createdAt as { toMillis?: unknown } | string | undefined;
  const msCreado =
    typeof creado === 'string'
      ? Date.parse(creado)
      : typeof creado?.toMillis === 'function'
        ? Number((creado as { toMillis: () => number }).toMillis())
        : NaN;
  const antiguedadDias =
    Number.isFinite(msCreado) && msCreado > 0
      ? Math.max(0, Math.floor((Date.now() - msCreado) / 86400000))
      : 0;

  return {
    xp: numero(d.xp),
    level: numero(d.level),
    xpEnNivel: numero(d.xpEnNivel),
    xpParaSiguienteNivel: numero(d.xpParaSiguienteNivel),
    medals: typeof medals === 'object' && medals ? medals : {},
    equippedTitle: typeof d.equippedTitle === 'string' ? d.equippedTitle : null,
    stats: {
      threadsCreated: numero(stats.threadsCreated),
      commentsCreated: numero(stats.commentsCreated),
      commentsInThreads: numero(stats.commentsInThreads),
      likesReceived: numero(stats.likesReceived),
      animeXp: (stats.animeXp as Record<string, number>) ?? {},
      triviaCompleted: numero(stats.triviaCompleted),
      triviaCorrect: numero(stats.triviaCorrect),
      triviaPerfect: numero(stats.triviaPerfect),
      triviaStreakBest: numero(stats.triviaStreakBest),
      followersReceived: numero(stats.followersReceived),
      diasActivosTotal: numero(stats.diasActivosTotal),
      clubesUnidos: mapa(stats.clubesUnidos),
      clubesCreados: mapa(stats.clubesCreados),
      canalesCreados: mapa(stats.canalesCreados),
      chatsPropios: mapa(stats.chatsPropios),
      tiersCreadas: mapa(stats.tiersCreadas),
      encuestasCreadas: mapa(stats.encuestasCreadas),
      visualesIds: mapa(stats.visualesIds),
      tiersPopularesIds: mapa(stats.tiersPopularesIds),
      hilosPorTopico:
        stats.hilosPorTopico && typeof stats.hilosPorTopico === 'object'
          ? (stats.hilosPorTopico as Record<string, Record<string, true>>)
          : {},
    },
    antiguedadDias,
    // Mismo criterio que el servidor al conceder Habitante:
    // nombre, bio y avatar no vacíos.
    perfilCompleto: noVacio(d.displayName) && noVacio(d.bio) && noVacio(d.avatarUrl),
    // Mismo criterio que el servidor al conceder Perfil de
    // Leyenda: marco distinto de ninguno, alguna decoración,
    // vitrinas distintas de las de defecto o insignias elegidas.
    perfilCustom:
      (typeof d.avatarFrame === 'string' && d.avatarFrame !== '' && d.avatarFrame !== 'ninguno') ||
      (Array.isArray(d.decorations) && d.decorations.length > 0) ||
      (Array.isArray(d.showcases) &&
        (d.showcases.length !== 2 || d.showcases.join(',') !== 'logros,destacadas')) ||
      (d.visibleBadgeIds !== null && d.visibleBadgeIds !== undefined),
    lastLevelUpAt:
      d.lastLevelUpAt instanceof Date ? d.lastLevelUpAt.toISOString() : null,
    lastLevelUpLevel:
      typeof d.lastLevelUpLevel === 'number' ? d.lastLevelUpLevel : null,
  };
}

/**
 * Escucha el progreso de un usuario en tiempo real.
 *
 * Hace falta un listener propio, y no leer el usuario del
 * contexto, porque `AuthContext` lo lee UNA vez con un `getDoc`
 * al iniciar sesion y no se vuelve a escuchar: si el nivel
 * cambia al publicar un hilo, el perfil seguiria enseñando el
 * viejo hasta que se recargara la pagina.
 *
 * @param uid    A quien escuchar. `null` cancela la escucha.
 * @param alCambiar  Se llama con el progreso nuevo, o con `null`
 *                   si el documento ya no existe.
 */
export function escucharProgreso(
  uid: string | null,
  alCambiar: (progreso: ProgresoCrudo | null) => void,
): () => void {
  if (!uid) {
    alCambiar(null);
    return () => {};
  }

  return onSnapshot(
    doc(db, 'users', uid),
    (snap) => {
      if (!snap.exists()) {
        alCambiar(null);
        return;
      }
      alCambiar(aProgreso(snap.data() as Record<string, unknown>));
    },
    (e) => {
      // Un error de lectura del progreso no debe romper la web: el
      // perfil se enseña igual, solo que con las barras vacias.
      console.error('[Gamificacion] No se pudo leer el progreso:', e);
      alCambiar(null);
    },
  );
}

// ======================================================
// CONFIGURACION
// ======================================================

/**
 * Escucha la configuracion de la gamificacion.
 *
 * Es un unico documento que se lee una vez y se comparte. Se
 * escucha en vez de leerse con `getDoc` para que un cambio en el
 * panel se vea sin recargar.
 *
 * @param alCambiar  Recibe la configuracion ya rellenada con los
 *                   valores por defecto.
 */
export function escucharConfiguracion(
  alCambiar: (config: GamificationConfig) => void,
): () => void {
  return onSnapshot(
    doc(db, GAMIFICATION.CONFIG_PATH),
    (snap) => {
      alCambiar(configDesdeFirestore(snap.data() as Partial<GamificationConfig>));
    },
    (e) => {
      // Si el documento no existe todavia es lo normal: se pasa
      // la configuracion por defecto, que viene con la
      // gamificacion desactivada.
      console.warn('[Gamificacion] No se pudo leer la configuracion:', e.message);
      alCambiar(configDesdeFirestore(null));
    },
  );
}

// ======================================================
// EQUIPAR TITULO
// ======================================================

/**
 * Cambia el titulo que se ve junto al nombre.
 *
 * Se comprueba aqui, en el cliente, que la medalla este
 * desbloqueada, para poder avisar sin ir al servidor. El filtro no
 * sustituye a las reglas: la comprobacion que manda es la de
 * `tituloValido()` en `firestore.rules`, que mira el documento
 * del servidor. Aqui solo se evita el viaje en redondo.
 *
 * @param medalId  Id de la medalla cuyo titulo se equipa. `null`
 *                 para quitarse el titulo.
 */
export async function equiparTitulo(
  uid: string,
  medalId: string | null,
  desbloqueadas: Record<string, string>,
): Promise<void> {
  if (medalId !== null && !desbloqueadas[medalId]) {
    throw new Error('Todavia no has desbloqueado esa medalla.');
  }

  // updateDoc y no setDoc: si el documento no existiera,
  // updateDoc falla en vez de crearlo con un solo campo, que
  // seria un usuario sin perfil.
  await updateDoc(doc(db, 'users', uid), { equippedTitle: medalId });
}

// ======================================================
// LLAMADAS AL SERVIDOR (SOLO ADMIN)
// ======================================================
//
// Las cuatro funciones son `httpsCallable`. Todas comprueban el
// rol en el servidor, asi que aunque el panel se manipule desde
// la consola del navegador, el permiso se vuelve a comprobar en
// el servidor y la llamada se rechaza.

/** Normaliza el error de una callable a un texto para pintar. */
function mensajeDeError(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  if (code.includes('not-found')) return 'No se ha encontrado lo que se buscaba.';
  if (code.includes('invalid-argument')) return 'Los datos no son validos.';
  if (code.includes('permission-denied')) return 'No tienes permiso para esto.';
  if (code.includes('unauthenticated')) return 'Tienes que iniciar sesion.';
  if (code.includes('failed-precondition')) return 'No se puede hacer todavia.';
  if (code.includes('unavailable')) {
    return 'No hay conexion con el servidor. Intentalo de nuevo.';
  }
  return e instanceof Error ? e.message : 'Algo ha ido mal.';
}

export { mensajeDeError };

/** Lee o escribe la configuracion de la gamificacion. */
export async function configurar(
  cambios: Partial<GamificationConfig>,
): Promise<GamificationConfig> {
  const llamar = httpsCallable<Partial<GamificationConfig>, GamificationConfig>(
    functions,
    'configurarGamificacion',
  );
  const res = await llamar(cambios);
  return configDesdeFirestore(res.data);
}

/** Suma o resta XP a un usuario, con un motivo obligatorio. */
export async function ajustarXpAdmin(
  uid: string,
  cantidad: number,
  nota: string,
): Promise<{ xp: number; nivel: number }> {
  const llamar = httpsCallable<{ uid: string; cantidad: number; nota: string }, unknown>(
    functions,
    'ajustarXp',
  );
  const res = await llamar({ uid, cantidad, nota });
  return res.data as { xp: number; nivel: number };
}

/** Concede o retira una medalla a mano. */
export async function concederMedallaAdmin(
  uid: string,
  medallaId: string,
  quitar: boolean,
): Promise<void> {
  const llamar = httpsCallable<{ uid: string; medallaId: string; quitar: boolean }, unknown>(
    functions,
    'concederMedalla',
  );
  await llamar({ uid, medallaId, quitar });
}

/**
 * Recalcula el progreso de un usuario desde su contenido ya
 * existente.
 *
 * Es lo que hay que usar con los usuarios anteriores a la
 * gamificacion: los triggers solo saltan con contenido nuevo.
 */
export async function recalcular(
  uid: string,
): Promise<{ concedidas: number; omitidas: number; medallasPorRecuento?: number; fases?: Record<string, string> }> {
  // El recálculo recorre todo el contenido y puede tardar
  // minutos: el plazo del cliente (60 s por defecto) cortaría
  // antes que el servidor (5 min) y parecería un fallo aunque
  // el trabajo siguiera y terminara detrás.
  const llamar = httpsCallable<
    { uid: string },
    { concedidas: number; omitidas: number; medallasPorRecuento?: number; fases?: Record<string, string> }
  >(functions, 'recalcularUsuario', { timeout: 300000 });
  try {
    const res = await llamar({ uid });
    if (res.data.fases) {
      const fallos = Object.entries(res.data.fases).filter(([, v]) => v !== 'ok');
      if (fallos.length > 0) {
        console.warn('[Gamificacion] Recalculo con fases fallidas:', Object.fromEntries(fallos));
      } else {
        console.info('[Gamificacion] Recalculo ok:', res.data.fases);
      }
    }
    return res.data;
  } catch (e) {
    // El 500 mudo de antes: si el servidor responde INTERNAL sin
    // `fases`, aquí se normaliza a un texto con el código para que
    // el panel no enseñe solo "internal". Con el servidor ya
    // parcheado, este catch casi no se toca: las fases fallidas
    // llegan como 200 con `fases.<nombre> = mensaje`.
    console.error('[Gamificacion] Fallo recalculando:', e);
    throw e;
  }
}
