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
  };
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
    },
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
): Promise<{ concedidas: number; omitidas: number }> {
  const llamar = httpsCallable<{ uid: string }, { concedidas: number; omitidas: number }>(
    functions,
    'recalcularUsuario',
  );
  const res = await llamar({ uid });
  return res.data;
}
