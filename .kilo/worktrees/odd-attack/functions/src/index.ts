/**
 * GAMIFICACION DE geekapoo.com
 * ============================
 *
 * Este archivo es el UNICO que escribe XP, nivel, medallas y
 * estadisticas en `users/{uid}`. El cliente los lee y no puede
 * tocarlos: las reglas de Firestore lo prohiben expresamente.
 *
 * Por que en el servidor y no en el cliente: porque cualquier
 * XP que se calculara en el navegador lo podría escribir el
 * propio usuario con la consola abierta. Aqui no: el Admin SDK
 * ignora las reglas, y lo que hace es deducir la recompensa del
 * contenido que ya existe en Firestore, no de lo que dice el
 * cliente.
 *
 * ── Idempotencia ────────────────────────────────────────────
 *
 * Los triggers de Firestore se entregan "al menos una vez": la
 * misma creacion puede disparar la funcion dos veces. Cada
 * recompensa escribe ademas un documento en un libro mayor
 * (`users/{uid}/rewardLedger/{id}`) con un id DETERMINISTA
 * derivado del contenido. Si ese documento ya existe, no se
 * concede nada. Ese libro es lo que impide, tambien, que un
 * "Me gusta" que se quita y se vuelve a poner pague las dos
 * veces.
 *
 * ── Coherencia ─────────────────────────────────────────────
 *
 * Todo se resuelve en transacciones de Firestore. El XP, el
 * nivel, el contador de la estadistica y la entrada del libro
 * mayor se escriben juntos o no se escribe nada.
 *
 * ── Antes de desplegar ─────────────────────────────────────
 *
 * En `gamification/config` hay un documento con
 * `{ "activo": false }` por defecto. Mientras siga en false,
 * estas funciones no escriben NADA. Es deliberado: si se
 * despliega a medias y alguna parte falla, es preferible que
 * no haya XP a que haya XP que luego haya que recalcular a
 * mano. El panel de administracion lo activa.
 */

import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore, FieldPath } from 'firebase-admin/firestore';
import { onDocumentCreated, onDocumentWritten } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';

initializeApp();

const db = getFirestore();

const USERS = 'users';
const THREADS = 'threads';
const COMMENTS = 'comments';
const EPISODES = 'episodes';
const CHARACTERS = 'characters';
const CHATS = 'chats';
const REACTIONS = 'reactions';
const DAILY_QUIZZES = 'dailyQuizzes';
const TRIVIA_RESULTS = 'triviaResults';
const TRIVIA_LEADERBOARD = 'triviaLeaderboard';
const POLL_VOTES = 'pollVotes';
const POLL_STATS = 'pollStats';
const LEDGER = 'rewardLedger';
const CONFIG_PATH = 'gamification/config';

// ======================================================
// CURVA DE NIVELES
// ======================================================
//
// COPIA LITERAL de `src/utils/progression.ts`. Los dos viven en
// paquetes distintos y no comparten codigo, asi que cualquier
// cambio hay que hacerlo en los dos sitios. Si divergieran,
// el nivel guardado y la barra que pinta el cliente no
// coincidirian nunca.
//
// `xpParaNivel(n) = round(base * n^exponente)`

const CURVA_POR_DEFECTO = {
  base: 100,
  exponente: 1.5,
  nivelesMaximos: 60,
};

const XP_POR_DEFECTO: Record<string, number> = {
  thread_created: 20,
  comment_created: 5,
  thread_like_received: 3,
  comment_like_received: 2,
  // Las reacciones son un sistema paralelo a los "me gusta", asi
  // que se pagan por separado y mas barato: un "me gusta" sigue
  // valiendo mas que un emoji. Si el administrador quiere que no
  // paguen, las pone a 0 desde el panel.
  thread_reaction_received: 2,
  comment_reaction_received: 1,
  // Votar en una encuesta. Se le paga a QUIEN VOTA, no al autor
  // del hilo: si se le pagara al autor, bastaba con abrir cinco
  // encuestas para farmear XP.
  poll_vote_cast: 2,
  // ── Trivia diaria ─────────────────────────────────────
  //
  // Las cuatro se conceden juntas en UNA sola entrada del libro
  // mayor (la de `trivia_{fecha}_{uid}`), ya con la cantidad total
  // sumada. Los valores están aquí para que el panel los pueda
  // cambiar, pero la SUMA se hace en la función: si el
  // administrador pone `trivia_correct` a 0, ese término desaparece
  // del total en lugar de dejar el XP a medias.
  trivia_completed: 10,
  trivia_correct: 5,
  trivia_perfect: 15,
  trivia_streak: 20,
};

const XP_POR_HITO_POR_DEFECTO = 100;

/** Hitos que dan XP extra al cruzarse. Copia de `HITOS_DE_NIVEL`. */
const HITOS_DE_NIVEL = [5, 10, 25, 50];

interface Config {
  base: number;
  exponente: number;
  nivelesMaximos: number;
  xp: Record<string, number>;
  xpPorHito: number;
  activo: boolean;
  /** Ids reales de los animes de las medallas tematicas. */
  animeMedallas: Record<string, string>;
}

const CONFIG_POR_DEFECTO: Config = {
  ...CURVA_POR_DEFECTO,
  xp: XP_POR_DEFECTO,
  xpPorHito: XP_POR_HITO_POR_DEFECTO,
  activo: false,
  animeMedallas: {},
};

/**
 * Lee la configuracion.
 *
 * Si el documento no existe se devuelven los valores por
 * defecto, que tienen `activo: false`. Es lo que hace que un
 * despliegue sin configurar no toque nada.
 */
async function leerConfig(): Promise<Config> {
  try {
    const snap = await db.doc(CONFIG_PATH).get();
    if (!snap.exists) return CONFIG_POR_DEFECTO;
    const d = snap.data() ?? {};
    return {
      ...CONFIG_POR_DEFECTO,
      ...d,
      xp: { ...XP_POR_DEFECTO, ...(d.xp ?? {}) },
      animeMedallas: d.animeMedallas ?? {},
    };
  } catch (e) {
    logger.error('No se pudo leer la configuracion de gamificacion', e);
    return CONFIG_POR_DEFECTO;
  }
}

// ======================================================
// MEDALLAS
// ======================================================
//
// COPIA del catalogo de `src/utils/progression.ts`. Los ids
// TIENEN que coincidir: son la clave con la que se guarda
// `users/{uid}.medals`.

const MEDALLAS = [
  { id: 'medal_primer_hilo', requisito: { tipo: 'hilos', valor: 1 } },
  { id: 'medal_primera_voz', requisito: { tipo: 'comentarios', valor: 1 } },
  { id: 'medal_debatiente_pro', requisito: { tipo: 'comentarios', valor: 50 } },
  { id: 'medal_creador_comunidad', requisito: { tipo: 'hilos', valor: 25 } },
  { id: 'medal_voz_comunidad', requisito: { tipo: 'likes', valor: 100 } },
  { id: 'medal_critico_temporada', requisito: { tipo: 'debates', valor: 15 } },
  {
    id: 'medal_mago_frieren',
    requisito: { tipo: 'xpEnAnime', animeId: 'CONFIGURAR_FRIEREN', valor: 150 },
  },
  {
    id: 'medal_netrunner_night_city',
    requisito: { tipo: 'xpEnAnime', animeId: 'CONFIGURAR_CYBERPUNK', valor: 150 },
  },
  { id: 'medal_veterano_geek', requisito: { tipo: 'nivel', valor: 25 } },
  { id: 'medal_leyenda_otaku', requisito: { tipo: 'nivel', valor: 50 } },
  { id: 'medal_geek_de_geeks', requisito: { tipo: 'nivel', valor: 60 } },
  // ── Trivia diaria ─────────────────────────────────────
  //
  // Los ids tienen que coincidir con los de
  // `src/utils/progression.ts`: es la clave con la que se guarda
  // `users/{uid}.medals`. Si uno de los dos cambia, la medalla se
  // sigue concediendo pero no aparece en el perfil.
  { id: 'medal_cerebro_otaku', requisito: { tipo: 'trivias', valor: 10 } },
  { id: 'medal_maestro_anime', requisito: { tipo: 'aciertosTrivia', valor: 100 } },
  { id: 'medal_racha_inparable', requisito: { tipo: 'rachaTrivia', valor: 7 } },
  { id: 'medal_leyenda_trivia', requisito: { tipo: 'rachaTrivia', valor: 30 } },
  { id: 'medal_perfect_score', requisito: { tipo: 'triviasPerfectas', valor: 10 } },
  { id: 'medal_sabio_otaku', requisito: { tipo: 'aciertosTrivia', valor: 500 } },
  // Sin requisito: la concede el administrador a mano.
  { id: 'medal_miembro_fundador', requisito: null },
] as const;

type Requisito =
  | { tipo: 'hilos'; valor: number }
  | { tipo: 'comentarios'; valor: number }
  | { tipo: 'likes'; valor: number }
  | { tipo: 'nivel'; valor: number }
  | { tipo: 'debates'; valor: number }
  | { tipo: 'xpEnAnime'; animeId: string; valor: number }
  | { tipo: 'trivias'; valor: number }
  | { tipo: 'aciertosTrivia'; valor: number }
  | { tipo: 'triviasPerfectas'; valor: number }
  | { tipo: 'rachaTrivia'; valor: number };

interface Estadisticas {
  threadsCreated: number;
  commentsCreated: number;
  /** Comentarios publicados DENTRO de hilos, que son los debates. */
  commentsInThreads: number;
  likesReceived: number;
  animeXp: Record<string, number>;
  /** Contadores de la trivia diaria. Los pone `onTriviaResultCreated`. */
  triviaCompleted: number;
  triviaCorrect: number;
  triviaPerfect: number;
  triviaStreakBest: number;
}

const ESTADISTICAS_VACIAS: Estadisticas = {
  threadsCreated: 0,
  commentsCreated: 0,
  commentsInThreads: 0,
  likesReceived: 0,
  animeXp: {},
  triviaCompleted: 0,
  triviaCorrect: 0,
  triviaPerfect: 0,
  triviaStreakBest: 0,
};

/** Lee las estadísticas del documento del usuario. */
function leerEstadisticas(data: Record<string, any> | undefined): Estadisticas {
  const s = data?.stats;
  if (!s || typeof s !== 'object') return { ...ESTADISTICAS_VACIAS };
  return {
    threadsCreated: num(s.threadsCreated),
    commentsCreated: num(s.commentsCreated),
    commentsInThreads: num(s.commentsInThreads),
    likesReceived: num(s.likesReceived),
    animeXp:
      s.animeXp && typeof s.animeXp === 'object'
        ? (s.animeXp as Record<string, number>)
        : {},
    triviaCompleted: num(s.triviaCompleted),
    triviaCorrect: num(s.triviaCorrect),
    triviaPerfect: num(s.triviaPerfect),
    triviaStreakBest: num(s.triviaStreakBest),
  };
}

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** ¿Se cumple este requisito con las estadísticas de este usuario? */
function cumpleRequisito(
  req: Requisito | null,
  stats: Estadisticas,
  nivel: number,
  config: Config,
): boolean {
  if (!req) return false; // Las medallas manuales no se conceden solas.

  switch (req.tipo) {
    case 'hilos':
      return stats.threadsCreated >= req.valor;
    case 'comentarios':
      return stats.commentsCreated >= req.valor;
    case 'debates':
      return stats.commentsInThreads >= req.valor;
    case 'likes':
      return stats.likesReceived >= req.valor;
    case 'nivel':
      return nivel >= req.valor;
    case 'xpEnAnime': {
      // El id del anime se resuelve desde la configuracion, porque
      // el catalogo lo escribe con un marcador de texto.
      const animeId = config.animeMedallas[req.animeId] ?? req.animeId;
      if (animeId.startsWith('CONFIGURAR_')) return false;
      return num(stats.animeXp[animeId]) >= req.valor;
    }
    // ── Trivia diaria ─────────────────────────────────
    //
    // Se leen de contadores que solo escribe esta misma función al
    // corregir un resultado, así que no hay forma de que el cliente
    // se los suba: se ganan jugando.
    case 'trivias':
      return stats.triviaCompleted >= req.valor;
    case 'aciertosTrivia':
      return stats.triviaCorrect >= req.valor;
    case 'triviasPerfectas':
      return stats.triviaPerfect >= req.valor;
    case 'rachaTrivia':
      return stats.triviaStreakBest >= req.valor;
    default:
      return false;
  }
}

/** Nivel que corresponde a una cantidad de XP. */
function nivelDesdeXp(
  xp: number,
  curva: { base: number; exponente: number; nivelesMaximos: number },
): { level: number; xpEnNivel: number; xpParaSiguienteNivel: number } {
  const total = Math.max(0, Math.floor(xp) || 0);
  const tope = xpParaNivel(curva.nivelesMaximos, curva);

  if (total >= tope) {
    return {
      level: curva.nivelesMaximos,
      xpEnNivel: tope - xpParaNivel(curva.nivelesMaximos - 1, curva),
      xpParaSiguienteNivel: 0,
    };
  }

  let level = 1;
  while (level < curva.nivelesMaximos && xpParaNivel(level + 1, curva) <= total) {
    level += 1;
  }

  const base = xpParaNivel(level, curva);
  const siguiente = xpParaNivel(level + 1, curva);
  return {
    level,
    xpEnNivel: total - base,
    xpParaSiguienteNivel: siguiente - base,
  };
}

function xpParaNivel(nivel: number, curva: { base: number; exponente: number; nivelesMaximos: number }): number {
  if (nivel <= 1) return 0;
  const n = Math.min(nivel, curva.nivelesMaximos);
  return Math.round(curva.base * Math.pow(n, curva.exponente));
}

/**
 * Que medallas faltan y ya se cumplen.
 *
 * Devuelve solo las NUEVAS: las que ya estaban no se vuelven a
 * escribir, para no tocar la fecha de desbloqueo.
 */
function medallasNuevas(
  stats: Estadisticas,
  nivel: number,
  yaDesbloqueadas: Record<string, unknown>,
  config: Config,
): string[] {
  return MEDALLAS.filter((m) => {
    if (yaDesbloqueadas[m.id]) return false;
    return cumpleRequisito(
      m.requisito as Requisito | null,
      stats,
      nivel,
      config,
    );
  }).map((m) => m.id);
}

// ======================================================
// CONCEDER XP
// ======================================================

/** Que se guarda en una entrada del libro mayor. */
interface Recompensa {
  /** Motivo. Los mismos nombres que usa el cliente. */
  reason: string;
  /**
   * Cuanto XP concede, si se quiere forzar un valor.
   *
   * Si se omite, se saca de la configuracion (`xp[reason]`). Es lo
   * que se usa en los triggers, para que cambiar el valor de una
   * recompensa no obligue a desplegar.
   *
   * Los ajustes del administrador SIEMPRE llevan cantidad
   * explicita: el numero que pondra en el panel es el que se
   * guarda, no el que hubiera en la configuracion.
   */
  amount?: number;
  /** Que lo provoco: id del hilo, comentario o anime. */
  sourceId: string | null;
  /** Quien dio el "Me gusta", cuando aplica. */
  actorId: string | null;
  /** Texto para el panel de administracion. */
  nota: string;
  /**
   * Anime al que se atribuye el XP. Es lo que permite que las
   * medallas tematicas funcionen.
   */
  animeId: string | null;
}

/** Fecha ISO del momento. Para texto que se pinta en pantalla. */
function ahoraIso(): string {
  return new Date().toISOString();
}


/**
 * Concede o retira XP de un usuario.
 *
 * Es la unica funcion del archivo que escribe en `users/{uid}`.
 * Todo lo demas (medallas, nivel, estadisticas) se deriva de aqui.
 *
 * Se hace en transaccion porque son cuatro escrituras que tienen
 * que ir juntas: el XP, el nivel, el contador de la estadistica y
 * la entrada del libro mayor. Con escrituras sueltas, un fallo en
 * medio dejaria XP sin nivel o nivel sin XP, y las medallas se
 * evaluarian sobre numeros que no cuadran.
 *
 * `idLibro` es lo que hace idempotente: es un id DETERMINISTA
 * derivado del contenido (por ejemplo, el id del hilo y el de
 * quien lo gusto). Si ya hay un documento con ese id, no se
 * concede nada, por muy pronto que llegue la llamada. Ese mismo
 * mecanismo hace que quitar un "Me gusta" lo devuelva.
 *
 * @param uid       Quien recibe el XP.
 * @param idLibro   Id del documento del libro mayor.
 * @param r         Que se concede y por que.
 * @param stats     Como ajustar las estadisticas.
 * @param opciones  `permitirNegativo` para los retiros.
 */
interface ResultadoXP {
  /** Si llego a escribirse algo. */
  aplicado: boolean;
  /**
   * Nivel con el que estaba el usuario ANTES de esta llamada.
   *
   * Se devuelve porque `concederConHitos` lo necesita: los hitos
   * que se cruzan son los que quedan entre ese nivel y el nuevo.
   * Sin el nivel de partida, un salto de dos niveles pasaria por
   * alto el hito intermedio.
   */
  nivelAntes: number;
  /** Nivel con el que queda. */
  nivel: number;
  /** XP total con el que queda. */
  xp: number;
  /** Medallas ganadas en ESTA llamada. */
  medallasNuevas: string[];
}

async function concederXP(
  uid: string,
  idLibro: string,
  r: Recompensa,
  stats: Partial<Estadisticas>,
  opciones: { permitirNegativo?: boolean } = {},
): Promise<ResultadoXP> {
  const config = await leerConfig();
  if (!config.activo) {
    logger.debug('Gamificacion desactivada; no se concede XP', { uid, motivo: r.reason });
    return { aplicado: false, nivelAntes: 1, nivel: 1, xp: 0, medallasNuevas: [] };
  }

  const userRef = db.doc(`${USERS}/${uid}`);
  const ledgerRef = userRef.collection(LEDGER).doc(idLibro);

  return db.runTransaction(async (tx) => {
    const [userSnap, ledgerSnap] = await Promise.all([
      tx.get(userRef),
      tx.get(ledgerRef),
    ]);

    // El usuario puede haberse borrado entre el trigger y aqui.
    if (!userSnap.exists) {
      logger.warn('El usuario ya no existe; se ignora la recompensa', { uid });
      return { aplicado: false, nivelAntes: 1, nivel: 1, xp: 0, medallasNuevas: [] };
    }

    // La recompensa ya se concedio. Esto es lo que impide cobrar
    // dos veces por lo mismo.
    if (ledgerSnap.exists) {
      const guardado = userSnap.data() ?? {};
      return {
        aplicado: false,
        nivelAntes: num(guardado.level) || 1,
        nivel: num(guardado.level) || 1,
        xp: num(guardado.xp),
        medallasNuevas: [],
      };
    }

    const data = userSnap.data() ?? {};
    const xpAntes = num(data.xp);
    const nivelAntes = num(data.level) || 1;

    // Si la recompensa no trae cantidad, se saca de la
    // configuracion. Asi el valor de "+20 por hilo" se cambia
    // desde el panel y no desplegando.
    const cantidad = r.amount ?? num(config.xp[r.reason]);

    if (cantidad === 0) {
      logger.warn('La recompensa es cero; no se escribe nada', {
        uid,
        motivo: r.reason,
      });
      return {
        aplicado: false,
        nivelAntes,
        nivel: nivelAntes,
        xp: xpAntes,
        medallasNuevas: [],
      };
    }

    // Un retiro nunca deja el XP por debajo de cero: un error de
    // calculo no puede costar progreso a nadie.
    const xpDespues = Math.max(0, xpAntes + cantidad);

    const nivel = nivelDesdeXp(xpDespues, {
      base: config.base,
      exponente: config.exponente,
      nivelesMaximos: config.nivelesMaximos,
    });

    // ── Estadisticas ───────────────────────────────────────
    const est = leerEstadisticas(data);

    if (stats.threadsCreated !== undefined) {
      est.threadsCreated = Math.max(0, stats.threadsCreated);
    }
    if (stats.commentsCreated !== undefined) {
      est.commentsCreated = Math.max(0, stats.commentsCreated);
    }
    if (stats.commentsInThreads !== undefined) {
      est.commentsInThreads = Math.max(0, stats.commentsInThreads);
    }
    if (stats.likesReceived !== undefined) {
      est.likesReceived = Math.max(0, stats.likesReceived);
    }
    // ── Trivia ─────────────────────────────────────────────
    //
    // Estos cuatro vienen con valores ABSOLUTOS, no con
    // incrementos: el trigger de la trivia ya ha leído el
    // documento del usuario y sabe cuántos tenía. Es lo mismo que
    // hace el ajuste del administrador, y evita que dos trivias
    // simultáneas se pisen el contador.
    if (stats.triviaCompleted !== undefined) {
      est.triviaCompleted = Math.max(0, stats.triviaCompleted);
    }
    if (stats.triviaCorrect !== undefined) {
      est.triviaCorrect = Math.max(0, stats.triviaCorrect);
    }
    if (stats.triviaPerfect !== undefined) {
      est.triviaPerfect = Math.max(0, stats.triviaPerfect);
    }
    if (stats.triviaStreakBest !== undefined) {
      est.triviaStreakBest = Math.max(0, stats.triviaStreakBest);
    }
    if (r.animeId && cantidad > 0) {
      est.animeXp[r.animeId] = num(est.animeXp[r.animeId]) + cantidad;
    }

    // ── Medallas ───────────────────────────────────────────
    const yaDesbloqueadas =
      data.medals && typeof data.medals === 'object'
        ? (data.medals as Record<string, unknown>)
        : {};
    const nuevas = medallasNuevas(est, nivel.level, yaDesbloqueadas, config);

    const update: Record<string, unknown> = {
      xp: xpDespues,
      level: nivel.level,
      xpEnNivel: nivel.xpEnNivel,
      xpParaSiguienteNivel: nivel.xpParaSiguienteNivel,
      stats: est,
      xpActualizadoAt: FieldValue.serverTimestamp(),
    };

    // La fecha se escribe solo la PRIMERA vez que se sube de
    // nivel. El cliente la mira para enseñar el aviso, y si se
    // reescribiera en cada subida volveria a saltar el aviso sin
    // motivo.
    if (nivel.level > nivelAntes) {
      update.lastLevelUpAt = FieldValue.serverTimestamp();
      update.lastLevelUpLevel = nivel.level;
    }

    if (nuevas.length > 0) {
      const medals = { ...yaDesbloqueadas };
      nuevas.forEach((id) => {
        // Fecha ISO en texto: es lo que espera el tipo
        // `UserProgress` del cliente. Con un `Timestamp` habria
        // que convertirlo al pintarlo.
        medals[id] = ahoraIso();
      });
      update.medals = medals;
    }

    tx.update(userRef, update);

    // ── Libro mayor ────────────────────────────────────────
    // Se guarda SIEMPRE, tambien en los retiros: es lo que hace
    // que un "Me gusta" quitado y puesto otra vez no pague dos
    // veces. En el retiro se borra en vez de escribir, y por eso
    // el documento puede volver a crearse despues (que es justo
    // lo que quiere: un like nuevo vuelve a pagar).
    if (opciones.permitirNegativo && cantidad < 0) {
      tx.delete(ledgerRef);
    } else {
      tx.set(ledgerRef, {
        reason: r.reason,
        amount: cantidad,
        sourceId: r.sourceId,
        actorId: r.actorId,
        animeId: r.animeId,
        nota: r.nota,
        at: FieldValue.serverTimestamp(),
      });
    }

    if (nuevas.length > 0) {
      logger.info('Medallas nuevas', { uid, medallas: nuevas });
    }

    return {
      aplicado: true,
      nivelAntes,
      nivel: nivel.level,
      xp: xpDespues,
      medallasNuevas: nuevas,
    };
  });
}


/**
 * Concede XP y, si de paso se cruza un hito de nivel, el XP extra
 * de ese hito.
 *
 * Por que van en rondas separadas y no en la misma transaccion:
 * cruzar un hito puede subir de nivel, y ese nivel nuevo puede
 * cruzar otro hito. Encadenarlo dentro de una sola transaccion
 * quitaria reentrar en Firestore desde dentro de ella, que no se
 * puede. Asi que primero va la recompensa normal, y luego una
 * llamada mas por cada hito cruzado, cada una con su documento en
 * el libro mayor.
 *
 * El libro es lo que evita el bucle infinito: si el hito ya se
 * concedio, la llamada no hace nada y la ronda siguiente ya no
 * encuentra hito nuevo.
 *
 * El limite de 10 rondas es una red de seguridad. No hace falta en
 * el caso normal, porque los hitos van por multiplos (5, 10, 25,
 * 50) y el premio de uno no llega al siguiente; pero si alguien
 * cambiara la lista por hitos consecutivos (1, 2, 3, 4...) esta
 * funcion no se quedaria repartiendo XP indefinidamente.
 */
async function concederConHitos(
  uid: string,
  idLibro: string,
  r: Recompensa,
  stats: Partial<Estadisticas>,
  opciones: { permitirNegativo?: boolean } = {},
): Promise<ResultadoXP> {
  const primero = await concederXP(uid, idLibro, r, stats, opciones);

  // En un retiro no hay hito que celebrar.
  if (!primero.aplicado || opciones.permitirNegativo) return primero;

  const config = await leerConfig();
  const premio = num(config.xpPorHito);
  if (premio <= 0) return primero;

  let resultado = primero;
  let desde = primero.nivelAntes + 1;
  let hasta = primero.nivel;

  for (let ronda = 0; ronda < 10 && desde <= hasta; ronda++) {
    const hito = HITOS_DE_NIVEL.find((h) => h >= desde && h <= hasta);
    if (hito === undefined) break;

    const porHito = await concederXP(
      uid,
      `milestone_${hito}`,
      {
        reason: 'level_milestone',
        amount: premio,
        sourceId: null,
        actorId: null,
        nota: `Alcanzaste el nivel ${hito}`,
        animeId: null,
      },
      {},
    );

    if (!porHito.aplicado) break;

    desde = porHito.nivelAntes + 1;
    hasta = porHito.nivel;
    resultado = {
      aplicado: true,
      nivelAntes: primero.nivelAntes,
      nivel: porHito.nivel,
      xp: porHito.xp,
      medallasNuevas: [...resultado.medallasNuevas, ...porHito.medallasNuevas],
    };
  }

  return resultado;
}


// ======================================================
// RESOLVER A QUE ANIME PERTENECE UN CONTENIDO
// ======================================================
//
// Las medallas tematicas (Mago de Frieren, Netrunner de Night
// City) miran el XP acumulado por anime. Para saber a que anime
// pertenece un comentario hay que mirar su objetivo, y el
// objetivo puede ser un anime, un episodio o un personaje, que
// son colecciones distintas. Por eso hay que leer.
//
// El coste es de una lectura por comentario, y solo cuando el
// comentario va en un anime, episodio o personaje: los que van en
// un hilo NO cuentan para ningun anime.
//
// Si la lectura falla se devuelve null y el XP sigue contando
// para el total del usuario pero no para el anime. Es mejor que
// lo contrario: no atribuir a un anime concreto no rompe nada.

async function resolverAnimeDe(
  targetType: string | undefined,
  targetId: string,
): Promise<string | null> {
  if (!targetType || !targetId) return null;

  try {
    if (targetType === 'anime') return targetId;

    if (targetType === 'episode') {
      const snap = await db.doc(`${EPISODES}/${targetId}`).get();
      const animeId = snap.data()?.animeId;
      return typeof animeId === 'string' ? animeId : null;
    }

    if (targetType === 'character') {
      const snap = await db.doc(`${CHARACTERS}/${targetId}`).get();
      const animeId = snap.data()?.animeId;
      return typeof animeId === 'string' ? animeId : null;
    }
  } catch (e) {
    logger.warn('No se pudo resolver el anime de un comentario', {
      targetType,
      targetId,
      error: e instanceof Error ? e.message : String(e),
    });
  }

  return null;
}

/**
 * Que motivo de XP corresponde a un "Me gusta" de esta coleccion,
 * o `null` si no da XP.
 *
 * Los "Me gusta" del catalogo (animes, episodios, personajes y
 * trivia) NO dan XP, porque es contenido que escribe el equipo y
 * no la comunidad. Darselo inflaria los niveles sin que nadie
 * hiciera nada.
 */
function recompensaDeLike(coleccion: string): string | null {
  if (coleccion === THREADS) return 'thread_like_received';
  if (coleccion === COMMENTS) return 'comment_like_received';
  return null;
}

/**
 * Id del documento del libro mayor para un "Me gusta".
 *
 * El guion bajo, en vez de un guion normal, no es un detalle
 * estetico: los ids de anime y de chat llevan guiones, y con un
 * separador ambiguo "a-b-c" podria leerse como ("a","b","c") o
 * como ("a-b","c"). Con guion bajo no hay duda.
 */
function idLibroDeLike(tipo: string, contenidoId: string, likerUid: string): string {
  return `${tipo}_${contenidoId}_${likerUid}`;
}

// ======================================================
// TRIGGERS
// ======================================================
//
// Se disparan por cambios en Firestore, nunca por lo que diga el
// cliente. Un hilo creado desde la consola sin pasar por la web
// recibe igual su XP: al trigger no le importa como llego el
// documento.
//
// Se deja la region por defecto (la misma que usa Firestore)
// porque ponerlos en otra anade latencia y coste sin ningun
// beneficio aqui.

/**
 * Crear un hilo: +20 XP y una cuenta mas de hilos.
 *
 * El XP no se pasa aqui (`amount` se omite a proposito): lo saca
 * de la configuracion, para que "+20 por hilo" se cambie desde el
 * panel sin desplegar.
 */
export const onThreadCreated = onDocumentCreated(
  `${THREADS}/{threadId}`,
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const authorId = data.authorId;
    if (typeof authorId !== 'string' || !authorId) {
      logger.warn('Hilo sin autor; no se concede XP', {
        id: event.params['threadId'],
      });
      return;
    }

    const threadId = event.params['threadId'];
    const titulo = typeof data.title === 'string' ? data.title : '';

    try {
      await concederConHitos(
        authorId,
        `thread_created_${threadId}`,
        {
          reason: 'thread_created',
          sourceId: threadId,
          actorId: null,
          nota: `Hilo "${titulo}"`,
          animeId: null,
        },
        { threadsCreated: 1 },
      );
    } catch (e) {
      logger.error('Fallo concediendo XP por hilo nuevo', { threadId, error: e });
    }
  },
);

/**
 * Crear un comentario: +5 XP.
 *
 * Ademas apunta a que anime pertenece el objetivo, para que el XP
 * cuente tambien en las medallas tematicas. Un comentario en un
 * hilo NO se atribuye a ningun anime: los hilos son la
 * conversacion de la comunidad, no de una serie.
 */
export const onCommentCreated = onDocumentCreated(
  `${COMMENTS}/{commentId}`,
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const authorId = data.authorId;
    if (typeof authorId !== 'string' || !authorId) {
      logger.warn('Comentario sin autor; no se concede XP', {
        id: event.params['commentId'],
      });
      return;
    }

    const commentId = event.params['commentId'];
    const targetType =
      typeof data.targetType === 'string' ? data.targetType : undefined;
    const targetId = typeof data.targetId === 'string' ? data.targetId : '';

    const animeId = await resolverAnimeDe(targetType, targetId);

    // Comentarios en hilos son "debates". Es lo que separa
    // "Debatiente Pro" (muchos comentarios, en cualquier sitio)
    // de "Critico de Temporada" (que habla de concreto).
    const esDebate = targetType === 'thread';

    try {
      await concederConHitos(
        authorId,
        `comment_created_${commentId}`,
        {
          reason: 'comment_created',
          sourceId: commentId,
          actorId: null,
          nota: esDebate ? 'Comentario en un debate' : `Comentario en ${targetType ?? 'contenido'}`,
          animeId,
        },
        {
          commentsCreated: 1,
          ...(esDebate ? { commentsInThreads: 1 } : {}),
        },
      );
    } catch (e) {
      logger.error('Fallo concediendo XP por comentario nuevo', {
        commentId,
        error: e,
      });
    }
  },
);

/**
 * "Me gusta" en hilos y en comentarios.
 *
 * Es el unico trigger con logica de dos caras. Mira la diferencia
 * entre la lista de antes y la de ahora y, por cada persona que ha
 * PUESTO un "Me gusta", concede XP al autor del contenido; por
 * cada persona que ha desaparecido, lo retira.
 *
 * Sin la parte de la retirada, el truco seria dar "Me gusta",
 * cobrar los XP, quitarlo y volver a dar: el contador del
 * contenido volveria a su sitio y el XP se quedaria. Con el
 * retiro, un like solo paga una vez.
 */
async function procesarLikes(
  coleccion: string,
  docId: string,
  antes: Record<string, unknown> | undefined,
  despues: Record<string, unknown> | undefined,
): Promise<void> {
  const motivo = recompensaDeLike(coleccion);
  if (!motivo) return;

  const likedAntes: string[] = Array.isArray(antes?.likedBy)
    ? (antes!.likedBy as string[])
    : [];
  const likedDespues: string[] = Array.isArray(despues?.likedBy)
    ? (despues!.likedBy as string[])
    : [];

  // Sin cambios en la lista: lo que ha cambiado es otro campo (el
  // titulo, el contador, "pinned"...). No hay nada que hacer.
  if (likedAntes.length === likedDespues.length) return;

  const authorId = despues?.authorId ?? antes?.authorId;
  if (typeof authorId !== 'string' || !authorId) {
    logger.warn('Contenido sin autor; no se concede XP por "Me gusta"', {
      coleccion,
      docId,
    });
    return;
  }

  const nuevos = likedDespues.filter((u) => !likedAntes.includes(u));
  const quitados = likedAntes.filter((u) => !likedDespues.includes(u));
  if (nuevos.length === 0 && quitados.length === 0) return;

  // Un comentario puede apuntar a un anime concreto, y entonces su
  // autor puede ganar XP atribuido a ese anime.
  let animeId: string | null = null;
  if (coleccion === COMMENTS) {
    const targetType =
      typeof despues?.targetType === 'string'
        ? (despues.targetType as string)
        : typeof antes?.targetType === 'string'
          ? (antes.targetType as string)
          : undefined;
    const targetId =
      typeof despues?.targetId === 'string'
        ? (despues.targetId as string)
        : typeof antes?.targetId === 'string'
          ? (antes.targetId as string)
          : '';
    animeId = await resolverAnimeDe(targetType, targetId);
  }

  const config = await leerConfig();
  const valor = num(config.xp[motivo]);
  const tipo = coleccion === THREADS ? 'like_thread' : 'like_comment';

  // Un "Me gusta" por persona. Se concede de uno en uno y no en
  // lote a proposito: cada transaccion mira su propio documento
  // del libro mayor, y asi dos likes a la vez no pueden pisarse.
  for (const liker of nuevos) {
    // Una persona no puede darse "Me gusta" a si misma. Sin esta
    // comprobacion, quien tenga dos cuentas cobraria XP sin que
    // nadie de verdad le hiciera caso.
    if (liker === authorId) continue;

    try {
      await concederConHitos(
        authorId,
        idLibroDeLike(tipo, docId, liker),
        {
          reason: motivo,
          sourceId: docId,
          actorId: liker,
          nota: `Un "Me gusta" en ${
            coleccion === THREADS ? 'un hilo' : 'un comentario'
          }`,
          animeId,
        },
        { likesReceived: 1 },
      );
    } catch (e) {
      logger.error('Fallo concediendo XP por "Me gusta"', {
        coleccion,
        docId,
        liker,
        error: e,
      });
    }
  }

  // Retirada del XP de los likes que se han quitado. El id del
  // libro es el mismo, y `permitirNegativo` borra el documento en
  // vez de escribirlo: por eso un like nuevo puede volver a pagar.
  for (const liker of quitados) {
    if (liker === authorId) continue;

    try {
      await concederConHitos(
        authorId,
        idLibroDeLike(tipo, docId, liker),
        {
          reason: motivo,
          amount: -valor,
          sourceId: docId,
          actorId: liker,
          nota: `Se quito un "Me gusta" de ${
            coleccion === THREADS ? 'un hilo' : 'un comentario'
          }`,
          animeId: null,
        },
        { likesReceived: -1 },
        { permitirNegativo: true },
      );
    } catch (e) {
      logger.error('Fallo retirando XP por "Me gusta" quitado', {
        coleccion,
        docId,
        liker,
        error: e,
      });
    }
  }
}

export const onThreadLikesChanged = onDocumentWritten(
  `${THREADS}/{threadId}`,
  async (event) => {
    try {
      await procesarLikes(
        THREADS,
        event.params['threadId'],
        event.data?.before.data(),
        event.data?.after.data(),
      );
    } catch (e) {
      logger.error('Fallo procesando likes de un hilo', { error: e });
    }
  },
);

export const onCommentLikesChanged = onDocumentWritten(
  `${COMMENTS}/{commentId}`,
  async (event) => {
    try {
      await procesarLikes(
        COMMENTS,
        event.params['commentId'],
        event.data?.before.data(),
        event.data?.after.data(),
      );
    } catch (e) {
      logger.error('Fallo procesando likes de un comentario', { error: e });
    }
  },
);


// ======================================================
// REACCIONES
// ======================================================
//
// Cada reacción es un documento en `reactions/` con un id
// determinista (`reac_<tipo>_<id>_<uid>`). De ahí sale lo más
// importante: no hay contador que el cliente pueda falsear, porque
// el contador se CUENTA a partir de estos documentos.
//
// Este trigger mantiene la caché `reactionCounts` del hilo o del
// comentario, que sirve para ordenar y sacar estadísticas. Los
// resultados que ve el usuario en la tarjeta salen de los propios
// documentos (los escucha el cliente), así que aunque este trigger
// todavia no este desplegado, los números que se ven son
// correctos: solo faltaría la caché.
//
// Los "me gusta" NO se tocan. Son otro sistema (`likedBy` +
// `likesCount`) con sus propios triggers, y siguen valiendo lo que
// valian antes de que existieran las reacciones.

/**
 * Formato de la clave de reacción.
 *
 * Son más de doscientos emojis (el catálogo está en
 * `src/data/emojis.ts`), así que aquí no puede haber una lista de
 * literales como antes. Se comprueba el FORMATO, que es lo mismo
 * que exigen las reglas de Firestore: minúsculas, números y
 * guiones bajos.
 *
 * Que la clave exista de verdad en el catálogo no se puede
 * comprobar aquí (el catálogo vive en el cliente), pero tampoco
 * hace falta: una clave inventada no la pinta nadie y no altera
 * ningún contador.
 */
const CLAVE_REACCION = /^[a-z0-9_]{1,24}$/;

interface ReactionDoc {
  targetType?: string;
  targetId?: string;
  userId?: string;
  type?: string;
  userName?: string;
  /** Solo para reacciones en mensajes de chat. */
  chatId?: string;
}

/**
 * Documento donde se guarda el recuento de reacciones.
 *
 * Los mensajes de chat NO tienen contador agregado en su
 * documento: los recuentos se cuentan desde `reactions/` en el
 * cliente y nadie mira un `reactionCounts` dentro de un mensaje.
 * Por eso aquí se devuelven `null` y el ajuste se salta, en vez
 * de escribir un campo que nadie lee.
 */
function docDelObjetivo(
  targetType: string | undefined,
  targetId: string,
  chatId?: string,
) {
  if (targetType === 'thread') return db.doc(`${THREADS}/${targetId}`);
  if (targetType === 'comment') return db.doc(`${COMMENTS}/${targetId}`);
  if (targetType === 'chat_message' && chatId) {
    return db.doc(`${CHATS}/${chatId}/messages/${targetId}`);
  }
  return null;
}

/**
 * Suma o resta una reacción del mapa de recuentos.
 *
 * Va en transacción porque dos reacciones simultáneas (dos
 * personas reaccionando en el mismo instante) se restarian si se
 * leyeran y escribieran fuera de ella.
 *
 * Los ceros se BORRAN del mapa en lugar de quedarse: un mapa con
 * cinco ceros se lee peor y ocupa lo mismo.
 */
async function ajustarContadorReacciones(
  targetType: string | undefined,
  targetId: string | undefined,
  tipo: string | undefined,
  delta: number,
  chatId?: string,
): Promise<void> {
  if (!targetType || !targetId || !tipo || !CLAVE_REACCION.test(tipo)) return;

  const ref = docDelObjetivo(targetType, targetId, chatId);

  // Los mensajes de chat no llevan contador agregado (ver
  // `docDelObjetivo`): no hay documento donde escribirlo.
  if (!ref) return;

  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) return;

      const data = (snap.data() ?? {}) as Record<string, unknown>;
      const actual =
        data.reactionCounts && typeof data.reactionCounts === 'object'
          ? { ...(data.reactionCounts as Record<string, number>) }
          : {};

      const valor = Math.max(0, (num(actual[tipo]) || 0) + delta);
      if (valor === 0) delete actual[tipo];
      else actual[tipo] = valor;

      const total = Object.values(actual).reduce((a, b) => a + num(b), 0);

      tx.update(ref, { reactionCounts: actual, reactionsTotal: total });
    });
  } catch (e) {
    logger.error('Fallo ajustando el contador de reacciones', {
      targetType,
      targetId,
      tipo,
      delta,
      error: e,
    });
  }
}

/**
 * Que motivo de XP corresponde a una reacción sobre este tipo de
 * contenido (o `null` si no paga).
 *
 * Los mensajes de chat pagan lo mismo que un comentario: es la
 * misma idea (una reacción corta a algo que alguien escribió) y
 * así el panel no necesita una fila más.
 */
function recompensaDeReaccion(targetType: string | undefined): string | null {
  if (targetType === 'thread') return 'thread_reaction_received';
  if (targetType === 'comment' || targetType === 'chat_message') {
    return 'comment_reaction_received';
  }
  return null;
}

/**
 * Paga (o retira) el XP de UNA reacción.
 *
 * El id del libro mayor NO lleva el tipo de reacción a propósito:
 * eso es lo que impide farmear XP cambiando 🔥 por 😂 una y otra
 * vez. Paga la primera vez; cambiar de reacción no vuelve a pagar,
 * y si la quita del todo se retira el XP y la entrada del libro.
 */
async function procesarReaccion(
  data: ReactionDoc | undefined,
  accion: 'crear' | 'borrar',
): Promise<void> {
  if (!data) return;

  const motivo = recompensaDeReaccion(data.targetType);
  const userId = data.userId;
  const targetId = data.targetId;

  if (!motivo || !userId || !targetId) return;

  const docId = `${data.targetType}_${targetId}`;
  const idLibro = `reaction_${docId}_${userId}`;

  const config = await leerConfig();
  const valor = num(config.xp[motivo]);
  if (valor === 0) return;

  try {
    // Para un mensaje de chat, el "autor" es quien lo escribió
    // (`senderId`), y hace falta su `chatId` para llegar al
    // documento. Un mensaje vacío o de otro chat no paga nada.
    const ref = docDelObjetivo(data.targetType, targetId, data.chatId);
    if (!ref) return;

    const snap = await ref.get();
    const d = snap.data() ?? {};
    const authorId = data.targetType === 'chat_message' ? d.senderId : d.authorId;

    // Nadie se paga a sí mismo por SUYA reacción: si no, una
    // cuenta con dos perfiles se haría XP sola y para siempre.
    if (typeof authorId !== 'string' || !authorId || authorId === userId) return;

    // El texto que sale en el historial del XP. Un mensaje puede
    // no tener texto (solo un GIF), así que se recorta por si
    // acaso.
    const donde =
      data.targetType === 'thread'
        ? 'un hilo'
        : data.targetType === 'comment'
          ? 'un comentario'
          : 'un mensaje';
    const que = (typeof d.body === 'string' ? d.body : '').slice(0, 40);

    if (accion === 'crear') {
      await concederConHitos(
        authorId,
        idLibro,
        {
          reason: motivo,
          sourceId: targetId,
          actorId: userId,
          nota: `Una reaccion (${data.type ?? '?'}) en ${donde}${que ? `: "${que}"` : ''}`,
          animeId: null,
        },
        { likesReceived: 1 },
      );
      return;
    }

    await concederConHitos(
      authorId,
      idLibro,
      {
        reason: motivo,
        amount: -valor,
        sourceId: targetId,
        actorId: userId,
        nota: `Se quito una reaccion de ${donde}`,
        animeId: null,
      },
      { likesReceived: -1 },
      { permitirNegativo: true },
    );
  } catch (e) {
    logger.error('Fallo procesando el XP de una reaccion', {
      docId,
      userId,
      accion,
      error: e,
    });
  }
}

/**
 * Cada cambio en `reactions/`: mueve el contador y paga el XP.
 *
 * Los tres casos posibles de un `onDocumentWritten`:
 *
 *   - Creacion: +1 en el contador y XP al autor del contenido.
 *   - Borrado: -1 en el contador y se retira el XP.
 *   - Cambio de tipo (de 🔥 a 😂): -1 del viejo y +1 del nuevo, y
 *     NO se toca el XP, porque el libro mayor ya tiene la entrada
 *     y la persona sigue teniendo la misma reacción.
 */
export const onReactionChanged = onDocumentWritten(
  `${REACTIONS}/{reactionId}`,
  async (event) => {
    const antes = event.data?.before.data() as ReactionDoc | undefined;
    const despues = event.data?.after.data() as ReactionDoc | undefined;

    try {
      if (antes && despues) {
        if (antes.type !== despues.type) {
          await ajustarContadorReacciones(
            antes.targetType, antes.targetId, antes.type, -1, antes.chatId,
          );
          await ajustarContadorReacciones(
            despues.targetType, despues.targetId, despues.type, +1, despues.chatId,
          );
        }
        return;
      }

      if (despues) {
        await ajustarContadorReacciones(
          despues.targetType, despues.targetId, despues.type, +1, despues.chatId,
        );
        await procesarReaccion(despues, 'crear');
        return;
      }

      if (antes) {
        await ajustarContadorReacciones(
          antes.targetType, antes.targetId, antes.type, -1, antes.chatId,
        );
        await procesarReaccion(antes, 'borrar');
      }
    } catch (e) {
      logger.error('Fallo procesando una reaccion', { error: e });
    }
  },
);

// ======================================================
// ENCUESTAS
// ======================================================
//
// Los votos están en `threads/{threadId}/pollVotes/{uid}`: un
// documento por persona, sin borrado, y las reglas solo dejan
// crearlo si la encuesta está abierta y el id de opción existe.
// Eso ya es la garantía de "un voto por persona"; no hay ningún
// número que un cliente pueda escribir.
//
// Aquí se mantiene `pollStats/{threadId}`, que es la CACHÉ de esos
// votos: se usa para ordenar, para las estadísticas del panel y
// para no tener que recorrer mil votos cada vez que se mira un
// resumen. Si un día el trigger no estuviera desplegado, los
// resultados de la tarjeta seguirían siendo correctos (se cuentan
// en el cliente) y solo faltarían las estadísticas.

interface PollVoteDoc {
  userId?: string;
  optionId?: string;
}

/** Resumen de los votos de una encuesta. */
async function ajustarResumenEncuesta(
  threadId: string,
  antes: PollVoteDoc | undefined,
  despues: PollVoteDoc | undefined,
): Promise<void> {
  const ref = db.doc(`${POLL_STATS}/${threadId}`);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = (snap.exists ? snap.data() : {}) as {
      options?: Record<string, number>;
      totalVotes?: number;
    };

    const opciones = { ...(data.options ?? {}) };
    let total = num(data.totalVotes);

    const mover = (opcion: string | undefined, delta: number) => {
      if (!opcion) return;
      const valor = Math.max(0, (num(opciones[opcion]) || 0) + delta);
      if (valor === 0) delete opciones[opcion];
      else opciones[opcion] = valor;
    };

    if (antes && despues) {
      // Cambio de opinión: sale de una opción y entra en otra. El
      // total NO cambia, que es justo lo que distingue un cambio de
      // un voto nuevo.
      if (antes.optionId !== despues.optionId) {
        mover(antes.optionId, -1);
        mover(despues.optionId, +1);
      }
    } else if (despues) {
      mover(despues.optionId, +1);
      total += 1;
    } else if (antes) {
      mover(antes.optionId, -1);
      total = Math.max(0, total - 1);
    } else {
      return;
    }

    tx.set(
      ref,
      {
        threadId,
        options: opciones,
        totalVotes: total,
        actualizadoAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });
}

/**
 * XP por participar en una encuesta.
 *
 * Se le paga a QUIEN VOTA, no al autor del hilo: si se le pagara
 * al autor, bastaba con abrir cinco encuestas para farmear. Y el
 * id del libro mayor no lleva la opción, así que cambiar de opinión
 * no paga dos veces.
 */
async function procesarVotoEncuesta(
  threadId: string,
  data: PollVoteDoc | undefined,
  accion: 'crear' | 'borrar',
): Promise<void> {
  const uid = data?.userId;
  if (!uid) return;

  const config = await leerConfig();
  const valor = num(config.xp['poll_vote_cast']);
  if (valor === 0) return;

  const idLibro = `poll_vote_${threadId}_${uid}`;

  try {
    const snap = await db.doc(`${THREADS}/${threadId}`).get();
    const autor = snap.data()?.authorId;
    if (autor === uid) return;

    if (accion === 'crear') {
      await concederConHitos(
        uid,
        idLibro,
        {
          reason: 'poll_vote_cast',
          sourceId: threadId,
          actorId: null,
          nota: 'Voto en una encuesta',
          animeId: null,
        },
        {},
      );
      return;
    }

    await concederConHitos(
      uid,
      idLibro,
      {
        reason: 'poll_vote_cast',
        amount: -valor,
        sourceId: threadId,
        actorId: null,
        nota: 'Se elimino su voto de una encuesta',
        animeId: null,
      },
      {},
      { permitirNegativo: true },
    );
  } catch (e) {
    logger.error('Fallo procesando el XP de un voto', { threadId, uid, accion, error: e });
  }
}

/** Cada voto nuevo o borrado actualiza el resumen de la encuesta. */
export const onPollVotesChanged = onDocumentWritten(
  `${THREADS}/{threadId}/${POLL_VOTES}/{voteId}`,
  async (event) => {
    const threadId = event.params['threadId'];
    const antes = event.data?.before.data() as PollVoteDoc | undefined;
    const despues = event.data?.after.data() as PollVoteDoc | undefined;

    try {
      await ajustarResumenEncuesta(threadId, antes, despues);
    } catch (e) {
      logger.error('Fallo actualizando el resumen de una encuesta', { threadId, error: e });
    }

    // El XP solo se mueve al CREAR el voto o al BORRARLO (que
    // solo hace el equipo, por moderación). Cambiar de opinión no
    // toca el XP: el libro mayor ya tiene la entrada.
    if (antes && despues) return;

    try {
      await procesarVotoEncuesta(threadId, despues ?? antes, despues ? 'crear' : 'borrar');
    } catch (e) {
      logger.error('Fallo procesando el voto de una encuesta', { threadId, error: e });
    }
  },
);

/**
 * Cierra sola las encuestas cuya fecha ya pasó.
 *
 * Las reglas de Firestore Y la interfaz ya tratan una encuesta
 * caducada como cerrada (nadie puede votar y la tarjeta dice
 * "finalizada"), así que esto no es una condición de seguridad:
 * es para que el estado guardado también lo esté, que es lo que
 * usan las estadísticas y el orden.
 *
 * Es idempotente (poner `isClosed: true` donde ya lo está no pasa
 * nada) y va cada hora, que es de sobra: nadie nota la diferencia
 * entre cerrarse a la hora exacta o una hora después.
 */
export const cerrarEncuestasVencidas = onSchedule('every 1 hours', async () => {
  const ahora = new Date();

  try {
    const snap = await db
      .collection(THREADS)
      .where('poll.isClosed', '==', false)
      .where('poll.expiresAt', '<=', ahora)
      .limit(200)
      .get();

    if (snap.empty) return;

    const lote = db.batch();
    let n = 0;
    snap.docs.forEach((d) => {
      lote.update(d.ref, { 'poll.isClosed': true });
      n += 1;
    });
    await lote.commit();

    logger.info('Encuestas cerradas por caducidad', { cerrados: n });
  } catch (e) {
    // Sin el indice compuesto esta consulta falla. Es un error
    // de infraestructura, no de la web: las encuestas siguen
    // funcionando igual, asi que no se relanza.
    logger.error('No se pudieron cerrar las encuestas vencidas', { error: e });
  }
});


// ======================================================
// ADMINISTRACION
// ======================================================
//
// Funciones que se llaman desde el panel con `httpsCallable`.
// Todas comprueban el rol en el servidor: que el boton este oculto
// en la interfaz no vale de nada, porque el panel tambien se
// puede abrir con la consola.
//
// El rol se lee del documento del usuario con el Admin SDK, que
// es la unica fuente que no depende de lo que diga el cliente.

/** Lanza si el que llama no es del equipo. Devuelve su uid. */
async function exigirAdmin(auth: unknown): Promise<string> {
  const uid = (auth as { uid?: string } | undefined)?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Tienes que iniciar sesion.');
  }

  const snap = await db.doc(`${USERS}/${uid}`).get();
  const rol = snap.data()?.role;

  if (rol !== 'admin' && rol !== 'moderator') {
    throw new HttpsError('permission-denied', 'No tienes permiso para esto.');
  }

  return uid;
}

/**
 * Lee y escribe la configuracion de la gamificacion.
 *
 * Sin datos, devuelve la actual. Es la unica via para cambiar el
 * valor de las recompensas, la curva o la lista de ids de anime de
 * las medallas tematicas.
 */
export const configurarGamificacion = onCall(async (request) => {
  await exigirAdmin(request.auth);

  const ref = db.doc(CONFIG_PATH);

  if (!request.data || Object.keys(request.data).length === 0) {
    const snap = await ref.get();
    return snap.exists ? snap.data() : CONFIG_POR_DEFECTO;
  }

  const antes = (await ref.get()).data() ?? {};
  const d = request.data as Record<string, unknown>;
  const siguiente: Record<string, unknown> = { ...antes };

  // Se validan los numeros uno a uno en vez de fiarse de lo que
  // llega. Un exponente raro o una curva de 0 niveles dejaria la
  // barra de progreso rota en TODOS los perfiles, y eso no lo
  // detecta nadie hasta que alguien se para a mirarla.
  if (d.base !== undefined) {
    const base = num(d.base);
    if (base < 1 || base > 10000) {
      throw new HttpsError('invalid-argument', 'La base debe estar entre 1 y 10000.');
    }
    siguiente.base = base;
  }

  if (d.exponente !== undefined) {
    const exp = num(d.exponente);
    if (exp < 1 || exp > 3) {
      throw new HttpsError('invalid-argument', 'El exponente debe estar entre 1 y 3.');
    }
    siguiente.exponente = exp;
  }

  if (d.nivelesMaximos !== undefined) {
    const max = Math.floor(num(d.nivelesMaximos));
    if (max < 1 || max > 200) {
      throw new HttpsError('invalid-argument', 'El maximo de niveles debe estar entre 1 y 200.');
    }
    siguiente.nivelesMaximos = max;
  }

  if (d.xpPorHito !== undefined) {
    const hito = num(d.xpPorHito);
    if (hito < 0 || hito > 100000) {
      throw new HttpsError('invalid-argument', 'La recompensa por hito es demasiado grande.');
    }
    siguiente.xpPorHito = hito;
  }

  if (d.activo !== undefined) {
    siguiente.activo = d.activo === true;
  }

  if (d.xp !== undefined && d.xp && typeof d.xp === 'object') {
    const xp: Record<string, number> = { ...((antes.xp as Record<string, number>) ?? XP_POR_DEFECTO) };
    Object.entries(d.xp as Record<string, unknown>).forEach(([motivo, valor]) => {
      const n = num(valor);
      if (n < 0 || n > 1000) {
        throw new HttpsError(
          'invalid-argument',
          `La recompensa de "${motivo}" debe estar entre 0 y 1000.`,
        );
      }
      xp[motivo] = n;
    });
    siguiente.xp = xp;
  }

  if (d.animeMedallas !== undefined && d.animeMedallas && typeof d.animeMedallas === 'object') {
    const mapa: Record<string, string> = {
      ...((antes.animeMedallas as Record<string, string>) ?? {}),
    };
    Object.entries(d.animeMedallas as Record<string, unknown>).forEach(([marcador, animeId]) => {
      if (typeof animeId !== 'string' || !animeId) {
        delete mapa[marcador];
        return;
      }
      mapa[marcador] = animeId;
    });
    siguiente.animeMedallas = mapa;
  }

  await ref.set(
    { ...siguiente, actualizadoAt: FieldValue.serverTimestamp() },
    { merge: true },
  );

  logger.info('Configuracion de gamificacion actualizada', {
    cambios: Object.keys(d),
    por: request.auth?.uid,
  });

  return siguiente;
});

/**
 * Suma o resta XP a mano.
 *
 * Es la via para corregir un error o premiar una colaboracion. El
 * movimiento queda en el libro mayor, y el id lleva el uid de quien
 * lo hizo y el momento, asi que dos admins que ajusten a la vez no
 * se pisan.
 */
export const ajustarXp = onCall(async (request) => {
  const adminUid = await exigirAdmin(request.auth);

  const uid = typeof request.data?.uid === 'string' ? request.data.uid : '';
  const cantidad = Math.floor(num(request.data?.cantidad));
  const nota = typeof request.data?.nota === 'string' ? request.data.nota : '';

  if (!uid) throw new HttpsError('invalid-argument', 'Falta el usuario.');
  if (cantidad === 0) {
    throw new HttpsError('invalid-argument', 'La cantidad no puede ser cero.');
  }
  if (Math.abs(cantidad) > 100000) {
    throw new HttpsError('invalid-argument', 'Esa cantidad es demasiado grande.');
  }
  if (!nota.trim()) {
    throw new HttpsError('invalid-argument', 'Escribe un motivo: queda en el historial.');
  }

  const resultado = await concederConHitos(
    uid,
    `admin_${adminUid}_${Date.now()}`,
    {
      reason: 'admin_adjustment',
      amount: cantidad,
      sourceId: null,
      actorId: adminUid,
      nota: `${nota.trim()} (por ${adminUid.slice(0, 8)})`,
      animeId: null,
    },
    {},
    { permitirNegativo: true },
  );

  logger.info('Ajuste manual de XP', { objetivo: uid, cantidad, por: adminUid });

  return resultado;
});

/**
 * Gestión de encuestas desde el panel: cerrar, reabrir y eliminar.
 *
 * Existe como función y no como escritura directa porque borrar
 * una encuesta entails borrar los votos que cuelgan de ella, y
 * Firestore no borra en cascada. Con reglas de cliente eso
 * significaría "borra los votos que puedas y ya": aquí se borran
 * TODOS, por lotes, y el trigger `onPollVotesChanged` va
 * descuenta el XP de quien votó, que es lo que toca.
 *
 * Cerrar y reabrir NO vienen aquí: eso lo puede hacer el autor
 * del hilo desde el propio hilo (una actualización de un solo
 * campo, que las reglas ya permiten), y así el botón está donde
 * la gente vota y no escondido en un panel.
 */
export const gestionarEncuesta = onCall(async (request) => {
  await exigirAdmin(request.auth);

  const threadId = typeof request.data?.threadId === 'string' ? request.data.threadId : '';
  const accion = typeof request.data?.accion === 'string' ? request.data.accion : '';

  if (!threadId || threadId.length > 150) {
    throw new HttpsError('invalid-argument', 'Falta el hilo de la encuesta.');
  }
  if (accion !== 'eliminar') {
    throw new HttpsError('invalid-argument', 'Acción desconocida.');
  }

  const threadRef = db.doc(`${THREADS}/${threadId}`);
  const snap = await threadRef.get();

  if (!snap.exists) {
    throw new HttpsError('not-found', 'Ese hilo ya no existe.');
  }
  if (!snap.data()?.poll) {
    throw new HttpsError('failed-precondition', 'Ese hilo no tiene encuesta.');
  }

  // 1. Los votos, por lotes de 300 (el máximo que acepta un
  //    borrado en Firestore). Cada voto borrado dispara su
  //    trigger, que descuenta el XP del votante.
  let borrados = 0;
  for (;;) {
    const votos = await threadRef
      .collection(POLL_VOTES)
      .limit(300)
      .get();

    if (votos.empty) break;

    const lote = db.batch();
    votos.docs.forEach((v) => lote.delete(v.ref));
    await lote.commit();
    borrados += votos.size;

    // Red de seguridad: si algo saliese mal y el bucle no
    // acabara nunca, se corta a los diez lotes.
    if (borrados > 3000) {
      logger.warn('Borrado de votos demasiado largo; se corta', { threadId, borrados });
      break;
    }
  }

  // 2. El resumen, que es del servidor.
  await db.doc(`${POLL_STATS}/${threadId}`).delete();

  // 3. La encuesta, del hilo.
  await threadRef.update({ poll: FieldValue.delete() });

  logger.info('Encuesta eliminada por el equipo', { threadId, votos: borrados });

  return { borrados };
});

/**
 * Buscador de GIFs, de paso por el servidor.
 *
 * Es el camino RECOMENDADO para Tenor: la clave se guarda en las
 * variables de la Cloud Function (`functions/.env`, que está en el
 * .gitignore) y no viaja nunca al bundle del navegador. Si la clave
 * fuera de tipo `VITE_*`, acabaría dentro del JavaScript que sirve
 * la web y cualquiera que abra la consola la leería.
 *
 * Con `VITE_GIPHY_API_KEY` no hace falta esta función: GIPHY tiene
 * claves públicas pensadas para ir en el cliente. Son las dos
 * opciones que hay; lo que no se puede es poner una clave
 * privada en el frontend.
 *
 * La respuesta se normaliza al MISMO formato que la llamada
 * directa, así que el selector de la web no sabe por dónde han
 * salido los resultados.
 */
export const buscarGifs = onCall(async (request) => {
  // Sin sesión no hay buscador: es lo mismo que para comentar, y
  // evita que alguien use la función de proxy desde una página
  // ajena.
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Inicia sesión para buscar GIFs.');
  }

  const clave = process.env.TENOR_API_KEY;
  if (!clave) {
    throw new HttpsError(
      'failed-precondition',
      'La funcion no tiene TENOR_API_KEY. Añadela en functions/.env y vuelve a desplegar.',
    );
  }

  const busqueda =
    typeof request.data?.busqueda === 'string' ? request.data.busqueda.slice(0, 80) : '';
  const limite = Math.min(24, Math.max(1, Math.floor(num(request.data?.limite)) || 12));

  const params = new URLSearchParams({
    key: clave,
    limit: String(limite),
    // Sin esto, el buscador se llena de cosas que no tienen nada
    // que ver con un foro de anime.
    media_filter: 'gif,nanogif,tinygif',
    content_filter: 'medium',
  });
  if (busqueda) params.set('q', busqueda);

  const url = busqueda
    ? `https://tenor.googleapis.com/v2/search?${params.toString()}`
    : `https://tenor.googleapis.com/v2/featured?${params.toString()}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });

    if (res.status === 429) {
      throw new HttpsError('resource-exhausted', 'Se ha superado la cuota de Tenor.');
    }
    if (!res.ok) {
      logger.error('Tenor respondio con error', { status: res.status });
      throw new HttpsError('internal', `Tenor respondió ${res.status}.`);
    }

    const json = (await res.json()) as {
      results?: Array<{
        id: string;
        title?: string;
        media_formats?: Record<string, { url?: string; w?: number; h?: number }>;
      }>;
    };

    const results = (json.results ?? [])
      .map((item) => {
        const f = item.media_formats ?? {};
        const urlGif = f.gif?.url || f.mp4?.url || '';
        const preview = f.tinygif?.url || f.nanogif?.url || f.webp?.url || urlGif;

        return {
          provider: 'tenor' as const,
          id: item.id,
          url: urlGif,
          previewUrl: preview,
          width: f.gif?.w ?? 480,
          height: f.gif?.h ?? 270,
          title: item.title,
        };
      })
      .filter((g) => g.url !== '' && g.previewUrl !== '');

    return { results };
  } catch (e) {
    if (e instanceof HttpsError) throw e;
    logger.error('Fallo la llamada a Tenor', { error: e });
    throw new HttpsError('unavailable', 'No se pudo contactar con Tenor.');
  }
});

/**
 * Concede o retira una medalla a mano.
 *
 * Sirve para "Miembro Fundador", que no se concede sola, y para
 * corregir un olvido. Una medalla con requisito automatico se
 * puede retirar, pero en cuanto el usuario vuelva a cumplir el
 * requisito reaparece: por eso el panel lo avisa.
 */
export const concederMedalla = onCall(async (request) => {
  const adminUid = await exigirAdmin(request.auth);

  const uid = typeof request.data?.uid === 'string' ? request.data.uid : '';
  const medallaId = typeof request.data?.medallaId === 'string' ? request.data.medallaId : '';
  const quitar = request.data?.quitar === true;

  if (!uid || !medallaId) {
    throw new HttpsError('invalid-argument', 'Faltan datos.');
  }

  if (!MEDALLAS.some((m) => m.id === medallaId)) {
    throw new HttpsError('not-found', 'Esa medalla no existe en el catalogo.');
  }

  const userRef = db.doc(`${USERS}/${uid}`);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) throw new HttpsError('not-found', 'Ese usuario no existe.');

    const data = snap.data() ?? {};
    const medals = { ...((data.medals as Record<string, unknown>) ?? {}) };

    if (quitar) {
      delete medals[medallaId];
    } else {
      medals[medallaId] = ahoraIso();
    }

    tx.update(userRef, {
      medals,
      // Si el titulo equipado era el de esa medalla y se retira,
      // el titulo se quita con ella: si no, el usuario se
      // quedaria con un titulo que ya no tiene ninguna medalla
      // detras.
      ...(quitar && data.equippedTitle === medallaId ? { equippedTitle: null } : {}),
    });
  });

  logger.info('Medalla tocada a mano', {
    objetivo: uid,
    medallaId,
    quitar,
    por: adminUid,
  });

  return { ok: true };
});

/**
 * Recalcula el progreso de un usuario a partir del contenido que ya
 * existe en Firestore.
 *
 * POR QUE HACE FALTA: los triggers solo saltan cuando algo se
 * escribe. Todo lo que ya estaba en Firestore cuando se desplego la
 * gamificacion no va a disparar nada, asi que los usuarios antiguos
 * se quedarian con 0 XP y sin ninguna medalla para siempre. Esta
 * funcion es la que les pone al dia.
 *
 * NO es una funcion programada: se llama a mano desde el panel,
 * usuario por usuario. Se deja asi a proposito, porque recorrer
 * toda la comunidad leyendo cada hilo y cada comentario es un
 * trabajo caro, y porque decidir a quien se le calcula el historico
 * es una decision del administrador y no del codigo.
 *
 * Es idempotente: los ids del libro mayor llevan el contenido
 * (`thread_created_x`, `like_thread_y_z`), asi que si se repite
 * sobre un usuario al que ya se le concedio, no vuelve a pagar.
 */
export const recalcularUsuario = onCall(async (request) => {
  const adminUid = await exigirAdmin(request.auth);

  const uid = typeof request.data?.uid === 'string' ? request.data.uid : '';
  if (!uid) throw new HttpsError('invalid-argument', 'Falta el usuario.');

  const config = await leerConfig();
  if (!config.activo) {
    throw new HttpsError(
      'failed-precondition',
      'La gamificacion esta desactivada. Activala antes de recalcular.',
    );
  }

  logger.info('Recalculando progreso', { objetivo: uid, por: adminUid });

  // Se recogen los ids del libro mayor de una vez, en vez de
  // comprobar documento a documento: son muchos, y asi se sabe de
  // antemano que ya estaba concedido.
  //
  // Va por paginas de 500 porque un usuario muy activo puede tener
  // miles de recompensas, y leerlas todas de una vez podria pasarse
  // del limite de 1 MB que tiene una lectura de Firestore.
  const concedidos = new Set<string>();
  const userRef = db.doc(`${USERS}/${uid}`);
  let ultimaPagina: FirebaseFirestore.QueryDocumentSnapshot | null = null;

  for (;;) {
    let consulta = userRef.collection(LEDGER).orderBy(FieldPath.documentId()).limit(500);
    if (ultimaPagina) consulta = consulta.startAfter(ultimaPagina);

    const page = await consulta.get();
    page.docs.forEach((d) => concedidos.add(d.id));

    if (page.docs.length < 500) break;
    ultimaPagina = page.docs[page.docs.length - 1];
  }

  logger.info('El usuario ya tiene estas recompensas', {
    objetivo: uid,
    total: concedidos.size,
  });

  let concedidas = 0;
  let omitidas = 0;

  const anotar = (res: { aplicado: boolean }) => {
    if (res.aplicado) concedidas += 1;
    else omitidas += 1;
  };

  // ── Hilos ─────────────────────────────────────────────
  const hilos = await db.collection(THREADS).where('authorId', '==', uid).get();
  for (const doc of hilos.docs) {
    const id = `thread_created_${doc.id}`;
    if (concedidos.has(id)) {
      omitidas += 1;
      continue;
    }
    anotar(
      await concederConHitos(
        uid,
        id,
        {
          reason: 'thread_created',
          sourceId: doc.id,
          actorId: null,
          nota: 'Recalculado: hilo',
          animeId: null,
        },
        { threadsCreated: 1 },
      ),
    );
  }

  // ── Comentarios ───────────────────────────────────────
  const comentarios = await db
    .collection(COMMENTS)
    .where('authorId', '==', uid)
    .get();

  for (const doc of comentarios.docs) {
    const d = doc.data();
    const id = `comment_created_${doc.id}`;
    if (concedidos.has(id)) {
      omitidas += 1;
      continue;
    }

    const targetType = typeof d.targetType === 'string' ? d.targetType : undefined;
    const targetId = typeof d.targetId === 'string' ? d.targetId : '';
    const animeId = await resolverAnimeDe(targetType, targetId);
    const esDebate = targetType === 'thread';

    anotar(
      await concederConHitos(
        uid,
        id,
        {
          reason: 'comment_created',
          sourceId: doc.id,
          actorId: null,
          nota: 'Recalculado: comentario',
          animeId,
        },
        {
          commentsCreated: 1,
          ...(esDebate ? { commentsInThreads: 1 } : {}),
        },
      ),
    );
  }

  // ── "Me gusta" recibidos ─────────────────────────────
  //
  // Aqui hay que recorrer lo que ha publicado el usuario, porque el
  // XP de un "Me gusta" se lo lleva quien ha escrito, no quien ha
  // pulsado el corazon. Por eso se filtran las colecciones enteras
  // por "authorId" y no por "likedBy".
  for (const coleccion of [THREADS, COMMENTS]) {
    const motivo = recompensaDeLike(coleccion);
    if (!motivo) continue;

    const tipo = coleccion === THREADS ? 'like_thread' : 'like_comment';
    const publicados = await db.collection(coleccion).where('authorId', '==', uid).get();

    for (const doc of publicados.docs) {
      const d = doc.data();
      const likedBy: string[] = Array.isArray(d.likedBy) ? d.likedBy : [];
      if (likedBy.length === 0) continue;

      let animeId: string | null = null;
      if (coleccion === COMMENTS) {
        const targetType = typeof d.targetType === 'string' ? d.targetType : undefined;
        const targetId = typeof d.targetId === 'string' ? d.targetId : '';
        animeId = await resolverAnimeDe(targetType, targetId);
      }

      for (const liker of likedBy) {
        if (liker === uid) continue;

        const id = idLibroDeLike(tipo, doc.id, liker);
        if (concedidos.has(id)) {
          omitidas += 1;
          continue;
        }

        anotar(
          await concederConHitos(
            uid,
            id,
            {
              reason: motivo,
              sourceId: doc.id,
              actorId: liker,
              nota: 'Recalculado: Me gusta',
              animeId,
            },
            { likesReceived: 1 },
          ),
        );
        concedidos.add(id);
      }
    }
  }

  logger.info('Recalculo terminado', { objetivo: uid, concedidas, omitidas });

  return { concedidas, omitidas };
});


// ======================================================
// TRIVIA DIARIA
// ======================================================
//
// El jugador escribe en `triviaResults/{uid}_{fecha}` SOLO sus
// respuestas, y eso es todo lo que las reglas le dejan escribir.
// Aquí, al ver ese documento, esta función:
//
//   1. Lee las respuestas correctas de
//      `dailyQuizzes/{fecha}/answers/`, que el cliente no puede
//      leer, y corrige.
//   2. Escribe las notas y las explicaciones en el resultado,
//      para que el cliente pueda enseñarlas.
//   3. Calcula el XP (completar + acertar + perfecto + racha) y
//      lo concede en UNA transacción, con el libro mayor como
//      red: si el documento `trivia_{fecha}_{uid}` ya existe, no
//      se paga dos veces.
//   4. Actualiza la racha y los contadores de estadísticas.
//   5. Suma los puntos al ranking del día, del mes, de la semana
//      y al histórico.
//
// ── La fecha la pone el SERVIDOR ──────────────────────────
//
// La racha depende de saber qué día es, y si el cliente dijera
// su fecha podría mandar la de mañana yEngañar al ranking. Así
// que la clave del día se calcula aquí, con la hora del
// servidor, en UTC. Elegir UTC y no la hora local del navegador
// es lo que hace que la racha no se rompa al cambiar de zona
// horaria: es una decisión que puede molestar (si juegas a las
// 00:30 en España, tu día cambia 2 horas antes que el de
// alguien en México) pero es estable y no depende de un reloj
// que el usuario controla.

/** Días de racha que dan bonus de XP. */
const HITOS_TRIVIA = [3, 7, 14, 30];

/** Cuántos días vale un día, para sumar y restar fechas. */
const DIA_MS = 24 * 60 * 60 * 1000;

/** `AAAA-MM-DD` del día actual, en UTC y con la hora del servidor. */
function diaDeAhora(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Qué día es `fecha` en número de días desde la época.
 *
 * Sirve para comparar fechas y para pedir "el día anterior" sin
 * pelearse con los finales de mes: restar 86.400.000 a la fecha
 * ISO y volver a cortar da el día anterior aunque sea el 1 de
 * marzo (que en el calendario gregoriano no tiene día 0).
 */
function diaNumero(fecha: string): number {
  return Math.floor(Date.parse(`${fecha}T00:00:00.000Z`) / DIA_MS);
}

/** El día anterior a `fecha`, en el mismo formato. */
function diaAnterior(fecha: string): string {
  return new Date((diaNumero(fecha) - 1) * DIA_MS).toISOString().slice(0, 10);
}

/** Clave del periodo semanal en formato `AAAA-Www` (lunes = 1). */
function claveSemanal(fecha: string): string {
  const d = new Date(`${fecha}T00:00:00.000Z`);
  // getUTCDay() da 0 en domingo; se pasa a 1-7 con lunes=1, que
  // es como se cuentan las semanas ISO.
  const dia = d.getUTCDay() === 0 ? 7 : d.getUTCDay();
  const jueves = new Date(d.getTime() - (dia - 4) * DIA_MS);
  const año = jueves.getUTCFullYear();
  const primeroEnero = Date.UTC(año, 0, 1) / DIA_MS;
  const semana = Math.floor((jueves.getTime() / DIA_MS - primeroEnero) / 7) + 1;
  return `${año}-W${String(semana).padStart(2, '0')}`;
}

/**
 * Cómo queda la racha después de jugar hoy.
 *
 * Tres casos, y solo tres:
 *
 *   - primera trivia → 1
 *   - la última fue AYER → +1 (sigue)
 *   - la última fue HOY MISMO → se devuelve tal cual (no pasa
 *     nada: es una repetición, y no tiene que romper la racha)
 *   - la última fue hace dos días o más → vuelve a 1
 *
 * `longest` nunca baja: es el mejor día que ha tenido.
 */
function rachaTrasCompletar(
  previa: { current: number; longest: number; lastDate: string | null } | undefined,
  hoy: string,
): { current: number; longest: number; lastDate: string } {
  const anterior = previa?.lastDate ?? null;
  const current0 = num(previa?.current);
  const longest0 = num(previa?.longest);

  if (anterior === hoy) {
    return { current: Math.max(1, current0), longest: Math.max(longest0, current0), lastDate: hoy };
  }

  const seguida = anterior !== null && diaNumero(anterior) === diaNumero(hoy) - 1;
  const current = seguida ? current0 + 1 : 1;

  return { current, longest: Math.max(longest0, current), lastDate: hoy };
}

/** Puntos del ranking: 10 por trivia, 5 por acierto. */
function puntosDeTrivia(correct: number): number {
  return 10 + correct * 5;
}

/**
 * Cada trivia enviada se corrige una sola vez.
 *
 * El disparador es `onDocumentCreated` porque las reglas no
 * permiten modificar ni borrar un resultado: el documento nace
 * una vez y se queda. Aun así se comprueba el libro mayor, porque
 * una reejecución de la función (que Firebase hace cuando algo
 * falla a medio camino) no puede dar XP dos veces.
 */
export const onTriviaResultCreated = onDocumentCreated(
  `${TRIVIA_RESULTS}/{resultId}`,
  async (event) => {
    const doc = event.data;
    if (!doc) return;

    const datos = doc.data() ?? {};
    const uid = String(datos.userId ?? '');
    const fecha = String(datos.date ?? '');

      if (!uid || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        logger.warn('Resultado de trivia sin usuario o fecha valida', { datos });
        return;
      }

      // La trivia solo se juega el día que toca.
      //
      // Las reglas ya comprueban que la trivia exista y esté
      // activa, pero no pueden saber qué día es: eso lo decide el
      // servidor. Sin esta comprobación, si el equipo programa una
      // trivia para dentro de una semana (que es lo normal, para
      // tenerla preparada), cualquiera podría jugar mañana y
      // llevar su resultado al ranking de mañana antes de tiempo.
      //
      // Se admite también el día anterior porque con la trivia
      // abierta de madrugada hay zonas horarias donde aún es el
      // día anterior, y no es justo tirarles su trivia a esas
      // personas.
      const hoy = diaDeAhora();
      if (fecha !== hoy && fecha !== diaAnterior(hoy)) {
        logger.warn('Trivia enviada fuera de fecha', { uid, fecha, hoy });
        return;
      }

    try {
      // ── 1. La trivia y sus respuestas correctas ──────
      //
      // `answers/` es la parte que el cliente no puede leer. Si
      // falta alguna de las respuestas (trivia a medio
      // preparar), no se corrige nada: es preferible dejar el
      // resultado sin notas a dar por buena una trivia que no
      // está.
      const [quizSnap, preguntasSnap, respuestasSnap] = await Promise.all([
        db.doc(`${DAILY_QUIZZES}/${fecha}`).get(),
        db.collection(`${DAILY_QUIZZES}/${fecha}/questions`).get(),
        db.collection(`${DAILY_QUIZZES}/${fecha}/answers`).get(),
      ]);

      if (!quizSnap.exists) {
        logger.warn('Trivia enviada que no existe', { uid, fecha });
        return;
      }
      if (quizSnap.data()?.active === false) {
        logger.info('Trivia cerrada: no se corrige', { uid, fecha });
        return;
      }
      if (respuestasSnap.empty) {
        logger.warn('Trivia sin respuestas correctas', { uid, fecha });
        return;
      }

      const privadas: Record<string, { correctIndex: number; explanation?: string }> = {};
      respuestasSnap.docs.forEach((d) => {
        const a = d.data() as { correctIndex?: number; explanation?: string };
        if (typeof a.correctIndex !== 'number') return;
        privadas[d.id] = { correctIndex: a.correctIndex, explanation: a.explanation };
      });

      const publicas: Record<string, { question?: string; options?: unknown[] }> = {};
      preguntasSnap.docs.forEach((d) => {
        publicas[d.id] = d.data() as { question?: string; options?: unknown[] };
      });

      const enviadas =
        datos.answers && typeof datos.answers === 'object'
          ? (datos.answers as Record<string, unknown>)
          : {};

      // ── 2. Corregir ─────────────────────────────────
      //
      // Solo se corrigen las preguntas que existen de verdad en
      // las dos mitades (pública y privada). Así, si alguien se
      // inventa una clave en `answers` —las reglas lo permiten
      // porque no pueden comprobar el contenido del mapa— no
      // cuenta como acierto.
      let correct = 0;
      let total = 0;
      const explicaciones: Record<string, string> = {};

      Object.keys(privadas)
        .sort()
        .forEach((qId) => {
          const privada = privadas[qId];
          const opciones = publicas[qId]?.options;
          if (!Array.isArray(opciones) || opciones.length === 0) return;

          const elegida = num(enviadas[qId]);
          const valida = elegida >= 0 && elegida < opciones.length;

          total += 1;
          if (valida && elegida === privada.correctIndex) correct += 1;
          if (privada.explanation) explicaciones[qId] = privada.explanation;
        });

      const perfecto = total > 0 && correct === total;

      // ── 3. Racha y estadísticas, en una transacción ──
      //
      // En transacción por dos motivos: dos ejecuciones de la
      // función para el mismo usuario (que Firebase hace cuando
      // algo falla a medio camino) no pueden leerse la racha dos
      // veces con el mismo valor y perder un día, y las
      // estadísticas que se le pasan a `concederXP` salen de la
      // MISMA lectura que actualiza la racha, así que los
      // contadores y la racha siempre cuadran entre sí.
      const userRef = db.doc(`${USERS}/${uid}`);
      let racha = { current: 1, longest: 1, lastDate: fecha };
      let estPrevias = leerEstadisticas(undefined);

      await db.runTransaction(async (tx) => {
        const snap = await tx.get(userRef);
        const data = snap.data() ?? {};

        racha = rachaTrasCompletar(data.trivia, fecha);
        estPrevias = leerEstadisticas(data);

        tx.set(userRef, { trivia: racha }, { merge: true });
      });

      // ── 4. XP ────────────────────────────────────────
      //
      // Los términos se suman y se conceden en UNA sola entrada
      // del libro mayor. Si el administrador pone a 0 uno de ellos
      // (los valores salen de la configuración), su término
      // desaparece del total en vez de dejar la recompensa a
      // medias.
      const config = await leerConfig();
      const xpCompletado = num(config.xp['trivia_completed']);
      const xpAcierto = num(config.xp['trivia_correct']);
      const xpPerfecto = num(config.xp['trivia_perfect']);
      const xpRacha = num(config.xp['trivia_streak']);

      // El bonus de racha se paga al CAER en un hito (3, 7, 14,
      // 30 días). Que se pague una sola vez por hito lo
      // garantiza el libro mayor, cuyo id incluye el número del
      // hito: volver a alcanzar 7 días dentro de otro mes ya no
      // paga, porque la entrada sigue ahí.
      const cruzaHito = (HITOS_TRIVIA as readonly number[]).includes(racha.current);

      const xpTotal = xpCompletado + correct * xpAcierto + (perfecto ? xpPerfecto : 0);

      const idLibro = `trivia_${fecha}_${uid}`;
      const resultado = await concederConHitos(
        uid,
        idLibro,
        {
          reason: 'trivia_completed',
          // Se manda el total ya sumado, no el valor de un solo
          // motivo: el libro mayor guarda el importe de la
          // recompensa y el `reason` es solo la etiqueta que ve
          // el panel.
          amount: xpTotal,
          sourceId: fecha,
          actorId: null,
          nota: `Trivia de ${fecha}: ${correct}/${total} correctas`,
          animeId: null,
        },
        {
          triviaCompleted: estPrevias.triviaCompleted + 1,
          triviaCorrect: estPrevias.triviaCorrect + correct,
          triviaPerfect: estPrevias.triviaPerfect + (perfecto ? 1 : 0),
          triviaStreakBest: Math.max(estPrevias.triviaStreakBest, racha.current),
        },
      );

      // El bonus de racha va en SU PROPIA entrada del libro, con
      // el hito en el id: volver a cruzar 7 días dentro de un mes
      // paga otra vez, que es justo lo que significa "racha".
      if (cruzaHito) {
        await concederConHitos(
          uid,
          `trivia_hito_${racha.current}_${uid}`,
          {
            reason: 'trivia_streak',
            amount: xpRacha,
            sourceId: fecha,
            actorId: null,
            nota: `Racha de trivia de ${racha.current} días`,
            animeId: null,
          },
          {},
        );
      }

      // ── 5. Notas en el resultado ─────────────────────
      //
      // Aquí se escriben `correct`, `points` y las explicaciones,
      // que es justo lo que las reglas prohíben al cliente. La
      // función va con Admin SDK, que es lo único que se salta
      // las reglas, y por eso puede hacerlo sin abrirle la
      // puerta a nadie más.
      await doc.ref.update({
        correct,
        total,
        perfecto,
        points: puntosDeTrivia(correct),
        explicaciones,
        xp: {
          completed: xpCompletado,
          correct: correct * xpAcierto,
          perfect: perfecto ? xpPerfecto : 0,
          streak: cruzaHito ? xpRacha : 0,
          total: xpTotal + (cruzaHito ? xpRacha : 0),
        },
        streak: racha.current,
        xpGanado: xpTotal + (cruzaHito ? xpRacha : 0),
        completedAt: FieldValue.serverTimestamp(),
      });

      // ── 6. Ranking ───────────────────────────────────
      await sumarAlRanking(uid, fecha, puntosDeTrivia(correct), racha.current, correct);

      logger.info('Trivia corregida', {
        uid,
        fecha,
        correct,
        total,
        xp: xpTotal,
        nivel: resultado.nivel,
        medallas: resultado.medallasNuevas,
      });
    } catch (e) {
      logger.error('Fallo corrigiendo la trivia', { uid, fecha, error: e });
      throw e;
    }
  },
);

/** Cuántas entradas se guardan en un ranking antes de podar. */
const TOPE_RANKING = 800;

/** Y cuántas se quedan al podar. */
const MAX_ENTRADAS_RANKING = 500;

/**
 * Suma los puntos de una trivia a los cuatro rankings.
 *
 * Un documento por periodo con un mapa `uid → cifras`. Se elige
 * un mapa y no un documento por jugador porque el ranking se lee
 * entero de golpe (no hay paginación: son los primeros veinte),
 * y así el cliente hace una lectura en vez de veinte.
 *
 * Primero se LEEN los cuatro y después se escribe el lote, todo
 * en el mismo orden. Es importante que sea en ese orden y no
 * "leer y escribir a la vez": montar el lote mientras llegan las
 * lecturas dejaría fuera de él los documentos que aún no han
 * llegado, y el commit se llevaría por delante la información
 * que acababa de traer la lectura.
 *
 * No va en transacción porque los cuatro periodos son
 * independientes: si el semanal falla, el histórico sigue valiendo
 * y el trigger reintenta. Con una transacción, un fallo de cuota
 * tiraría los cuatro.
 */
async function sumarAlRanking(
  uid: string,
  fecha: string,
  points: number,
  streak: number,
  correct: number,
): Promise<void> {
  try {
    const userSnap = await db.doc(`${USERS}/${uid}`).get();
    const d = userSnap.data() ?? {};
    const nombre = String(d.displayName ?? d.username ?? 'Otaku');
    const avatar = String(d.avatarUrl ?? '');

    // `periodo` es el prefijo y `clave` lo que va después del
    // guion, para poder filtrar por el prefijo cuando se lea
    // "todos los históricos" sin traerlos todos.
    const periodos: { periodo: string; clave: string }[] = [
      { periodo: 'historico', clave: 'historico' },
      { periodo: 'mensual', clave: fecha.slice(0, 7) },
      { periodo: 'semanal', clave: claveSemanal(fecha) },
      { periodo: 'diario', clave: fecha },
    ];

    // 1. Leer los cuatro.
    const leidos = await Promise.all(
      periodos.map(async (p) => {
        const ref = db.doc(`${TRIVIA_LEADERBOARD}/${p.periodo}-${p.clave}`);
        const snap = await ref.get();
        const datos = snap.data() as { scores?: Record<string, EntradaRanking> } | undefined;
        return { ref, scores: { ...(datos?.scores ?? {}) } };
      }),
    );

    // 2. Montar el lote con lo leído.
    const lote = db.batch();

    leidos.forEach(({ ref, scores }) => {
      const previa = scores[uid];

      scores[uid] = {
        name: nombre,
        avatar,
        points: num(previa?.points) + points,
        quizzes: num(previa?.quizzes) + 1,
        correct: num(previa?.correct) + correct,
        streak: Math.max(num(previa?.streak), streak),
      };

      podarRanking(scores);

      lote.set(
        ref,
        { scores, updatedAt: FieldValue.serverTimestamp() },
        { merge: true },
      );
    });

    // 3. Escribir.
    await lote.commit();
  } catch (e) {
    // El ranking es lo único de aquí que no es imprescindible: la
    // trivia ya está corregida y el XP ya está pagado. Un fallo
    // aquí no se relanza para no reintentar el trigger entero.
    logger.error('Fallo sumando al ranking de trivia', { uid, fecha, error: e });
  }
}

/**
 * Quita las entradas sobrantes de un mapa de ranking.
 *
 * Hace falta porque Firestore tiene un límite de 1 MB por
 * documento: un mapa de mil entradas de usuarios llenaría el
 * documento y el ranking dejaría de funcionar para TODO el
 * mundo, no solo para los nuevos. Se quedan las de más puntos, y
 * quien se cae puede volver a aparecer jugando otra trivia.
 */
function podarRanking(scores: Record<string, EntradaRanking>): void {
  const claves = Object.keys(scores);
  if (claves.length <= TOPE_RANKING) return;

  claves
    .sort((a, b) => num(scores[b].points) - num(scores[a].points))
    .slice(MAX_ENTRADAS_RANKING)
    .forEach((k) => delete scores[k]);
}

interface EntradaRanking {
  name: string;
  avatar: string;
  points: number;
  quizzes: number;
  correct: number;
  streak: number;
}

/**
 * Gestión de la trivia diaria desde el panel.
 *
 * Existe como función y no como escritura directa porque borrar
 * una trivia entails borrar sus RESPUESTAS CORRECTAS, y ese
 * bloque (`dailyQuizzes/{fecha}/answers/`) no tiene ninguna rama
 * de escritura para el cliente: es a propósito, para que nadie
 * pueda reescribir cuál es la respuesta buena. Desde aquí, con el
 * Admin SDK, sí se puede, porque la función es código del
 * servidor y no un cliente.
 *
 * `eliminar` borra la trivia entera; `cerrar` la marca como no
 * activa sin borrar nada, que es lo que se usa cuando hay una
 * errata y no se quiere perder los resultados ya jugados.
 */
export const gestionarTriviaDiaria = onCall(async (request) => {
  await exigirAdmin(request.auth);

  const fecha = typeof request.data?.fecha === 'string' ? request.data.fecha : '';
  const accion = typeof request.data?.accion === 'string' ? request.data.accion : '';

  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    throw new HttpsError('invalid-argument', 'La fecha no tiene el formato AAAA-MM-DD.');
  }

  const ref = db.doc(`${DAILY_QUIZZES}/${fecha}`);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError('not-found', 'Esa trivia no existe.');
  }

  if (accion === 'cerrar' || accion === 'abrir') {
    await ref.update({ active: accion === 'abrir' });
    logger.info('Trivia abierta/cerrada por el equipo', { fecha, accion, admin: true });
    return { borrados: 0 };
  }

  if (accion !== 'eliminar') {
    throw new HttpsError('invalid-argument', 'Acción desconocida.');
  }

  // Preguntas y respuestas, por lotes de 300 (el máximo que
  // acepta un borrado). Cada subcolección necesita su propio
  // recorrido porque no hay borrado en cascada.
  let borrados = 0;

  for (const bloque of ['questions', 'answers']) {
    for (;;) {
      const docs = await ref.collection(bloque).limit(300).get();
      if (docs.empty) break;

      const lote = db.batch();
      docs.docs.forEach((d) => lote.delete(d.ref));
      await lote.commit();
      borrados += docs.size;

      if (borrados > 3000) break;
    }
  }

  await ref.delete();

  logger.info('Trivia diaria eliminada por el equipo', { fecha, borrados });

  return { borrados };
});
