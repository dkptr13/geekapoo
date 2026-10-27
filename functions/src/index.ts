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
import { FieldValue, getFirestore, FieldPath, Timestamp } from 'firebase-admin/firestore';
import { onDocumentCreated, onDocumentUpdated, onDocumentWritten } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';

import {
  leerEstadisticas,
  num,
  conMarca,
  esCampoMapa,
  marcarTopico,
  pasarDia,
  diasDesde,
  ponerTotales,
  sumarContadores,
  subirTecho,
  type Estadisticas,
} from './stats';
import { topicosDe } from './topicos';

// `rss-parser` y `createHash` viven en `functions/src/rss.ts`, que es
// donde se usan. Aquí no hacen falta: lo que se importa de `./rss` son
// las funciones y las constantes, y lo demás vive en su sitio.

initializeApp();

const db = getFirestore();

const USERS = 'users';
/**
 * Registro duradero de baneos. Una colección plana con el uid como
 * id, escrita SOLO por este archivo con el Admin SDK. Las reglas de
 * Firestore y Storage la consultan para que un baneo sobreviva a
 * borrar y recrear el perfil.
 */
const ACCOUNT_RESTRICTIONS = 'accountRestrictions';
/**
 * Subcolecciones de seguimiento. Los mismos nombres que en
 * `src/types/follows.ts` y `services/follows.ts`.
 *
 * Se nombran como constantes porque aparecen en dos sitios del
 * trigger (`onFollowChanged`), donde una errata en la cadena sería
 * un bug silencioso: la función escucharía una ruta que nadie
 * escribe y no pasaría nada, sin ningún error.
 */
const FOLLOWING = 'following';
const FOLLOWERS = 'followers';
const THREADS = 'threads';
const COMMENTS = 'comments';
const EPISODES = 'episodes';
const CHARACTERS = 'characters';
const CHATS = 'chats';
const CLUBS = 'clubs';
const CHANNELS = 'channels';
const TIERLISTS = 'tierlists';
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
  // Que alguien te siga. Es el unico caso del proyecto donde el XP
  // depende de una relacion asimetrica y reversible con un clic, y
  // por eso lleva tres candados (ver `onFollowChanged`):
  //
  //   1. Lo paga QUIEN RECIBE el follow, no quien lo hace. Si lo
  //      pagara al que sigue, bastaria con crear cuentas y seguirlas
  //      entre si para farmear XP.
  //   2. El libro mayor tiene el id del par (quien sigue, a quien),
  //      asi que un follow/unfollow/follow del MISMO par no paga la
  //      segunda vez: el documento ya existe y no se concede nada.
  //   3. No se retira al dejar de seguir (a diferencia de los "me
  //      gusta"), precisamente por el punto 2. Si se retirara,
  //      el ciclo volvería a pagar.
  //
  // Por eso es pequeno (2 XP, menos que un "me gusta" en un hilo) y
  // por eso las MEDALLAS de comunidad se conceden por el maximo de
  // seguidores, no por este XP.
  follow_received: 2,
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
  votosTierPopular: number;
  activo: boolean;
  /** Ids reales de los animes de las medallas tematicas. */
  animeMedallas: Record<string, string>;
}

const CONFIG_POR_DEFECTO: Config = {
  ...CURVA_POR_DEFECTO,
  xp: XP_POR_DEFECTO,
  xpPorHito: XP_POR_HITO_POR_DEFECTO,
  votosTierPopular: 10,
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
// Viven en `./medallas`, que es puro y testeable
// (`tests/logica.logros.ts`): `index.ts` importa `firebase-admin`
// y Node no puede cargarlo en una prueba. Los ids TIENEN que
// coincidir con los de `src/utils/progression.ts`: son la clave
// con la que se guarda `users/{uid}.medals`.
import {
  MEDALLAS,
  medallasNuevas,
  tieneCustom,
} from './medallas';

// (Requisito, cumpleRequisito y medallasNuevas viven en
// `./medallas`, que es puro y testeable. Aquí solo se usan.)

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

// (medallasNuevas vive en `./medallas`.)

// ======================================================
// NOTIFICACIONES
// ======================================================
//
// Avisos para la campana del Navbar. Se escriben AQUÍ, con el
// Admin SDK, y nunca desde el cliente: las reglas de Firestore no
// permiten crear nada en `users/{uid}/notifications`, y con razón
// (si el navegador pudiera escribirlas, bastaría un `for` para
// mandarle mil avisos a otra persona).
//
// El destinatario se deduce SIEMPRE del contenido que ya existe
// en Firestore —el autor del comentario, el de la respuesta, el de
// la publicación— y nunca de un campo que envíe el cliente. Un
// cliente podría mandar `recipientId: 'otraPersona'` al responder,
// y quien lo lee no sabría si es un error o un intento.
//
// ── El id es determinista ─────────────────────────────────────
//
// Sale del contenido que provocó el aviso, no de un `.doc()` al
// azar. Consecuencias, todas deseadas:
//
//   · El trigger se entrega "al menos una vez": la segunda
//     ejecución no crea un aviso nuevo, porque `create()` falla en
//     silencio si el documento ya existe (y no pisa el que había).
//   · Cambiar una reacción de 🔥 a 😂 no genera otro aviso: el id
//     no incluye el tipo de reacción.
//   · Quitar un "Me gusta" y volver a ponerlo no apila avisos.
//
// Es el mismo truco que `reactionDocId` en las reacciones.

const NOTIFICACIONES = 'notifications';

/**
 * Nombres de las medallas, SOLO para el texto del aviso.
 *
 * COPIA de `src/utils/progression.ts`, igual que la lista de ids de
 * más arriba. Si divergieran, el aviso diría el nombre de otra
 * medalla, así que cualquier clueless demedalla nueva hay que
 * añadirlo en los dos sitios.
 */
const NOMBRES_DE_MEDALLA: Record<string, string> = {
  medal_primer_hilo: 'Debut',
  medal_primera_voz: 'Primera Voz',
  medal_debatiente_pro: 'Debatiente Pro',
  medal_creador_comunidad: 'Creador de Comunidad',
  medal_voz_comunidad: 'Voz de la Comunidad',
  medal_critico_temporada: 'Critico de Temporada',
  medal_primer_fan: 'Primer Fan',
  medal_popular: 'Popular',
  medal_figura_comunidad: 'Figura de la Comunidad',
  medal_icono_geekapoo: 'Icono Geekapoo',
  medal_mago_frieren: 'Mago de Frieren',
  medal_netrunner_night_city: 'Netrunner de Night City',
  medal_veterano_geek: 'Veterano Geek',
  medal_leyenda_otaku: 'Leyenda Otaku',
  medal_geek_de_geeks: 'Geek de Geeks',
  medal_cerebro_otaku: 'Cerebro Otaku',
  medal_maestro_anime: 'Maestro del Anime',
  medal_racha_inparable: 'Racha Imparable',
  medal_leyenda_trivia: 'Leyenda de la Trivia',
  medal_perfect_score: 'Perfect Score',
  medal_sabio_otaku: 'Sabio Otaku',
  medal_miembro_fundador: 'Miembro Fundador',
  medal_rompehielos: 'Rompehielos',
  medal_novato_multiverso: 'Novato del Multiverso',
  medal_otaku_ascenso: 'Otaku en Ascenso',
  medal_guardian_lore: 'Guardián del Lore',
  medal_coleccionista_xp: 'Coleccionista de XP',
  medal_biblioteca: 'Biblioteca Viviente',
  medal_enciclopedia: 'Enciclopedia Anime',
  medal_elite_geekapoo: 'Élite de Geekapoo',
  medal_leyenda_multiverso: 'Leyenda del Multiverso',
  medal_entidad_otro_mundo: 'Entidad de Otro Mundo',
  medal_moderador_confianza: 'Moderador de Confianza',
  medal_guia_comunidad: 'Guía de la Comunidad',
  medal_mano_amiga: 'Mano Amiga',
  medal_habitante: 'Habitante de Geekapoo',
  medal_otaku_formacion: 'Otaku en Formación',
  medal_siempre_presente: 'Siempre Presente',
  medal_veterano_comunidad: 'Veterano de la Comunidad',
  medal_comentario_oro: 'Comentario de Oro',
  medal_explorador_social: 'Explorador Social',
  medal_fundador_club: 'Fundador',
  medal_arquitecto_canales: 'Arquitecto de Canales',
  medal_conector_social: 'Conector Social',
  medal_arquitecto_tiers: 'Arquitecto de Tier Lists',
  medal_encuestador: 'Encuestador Profesional',
};

/** Lo que se guarda en un aviso. Todo opcional menos lo básico. */
interface Aviso {
  /** Id determinista. Ver el comentario de arriba. */
  id: string;
  type: string;
  recipientId: string;
  actorId: string;
  actorName: string;
  actorAvatar: string;

  threadId?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  commentId?: string | null;
  /** Serie a la que pertenece, para abrir la wiki. Ver `Aviso`. */
  animeId?: string | null;
  /** Conversación del chat, para abrirla desde la campana. Solo `chat_message`. */
  chatId?: string | null;
  snippet?: string | null;
  reaction?: string | null;

  level?: number | null;
  medalId?: string | null;
  medalName?: string | null;
  triviaCorrect?: number | null;
  triviaTotal?: number | null;
  title?: string | null;
}

/**
 * Escribe un aviso, si toca.
 *
 * Tres filtros, y todos en un sitio solo para que no se puedan
 * saltar por un camino distinto:
 *
 *   1. Nadie se avisa a sí mismo. Un "Me gusta" a tu propio hilo,
 *      una respuesta a tu propio comentario o un "@tu_usuario"
 *      tuyo no generan nada. Es el filtro más importante de
 *      todos: sin él, cualquier cuenta podría llenarse el centro de
 *      notificaciones y, peor, fingir actividad.
 *   2. El documento se CREA, no se sobrescribe. `create()` falla en
 *      silencio si ya existe, así que un trigger repetido no
 *      devuelve el aviso a "no leída" y un "Me gusta" repetido no
 *      lo duplica.
 *   3. Si el texto de lo que hailó el aviso está vacío, se recorta
 *      para que el panel no tenga un hueco raro.
 *
 * Los fallos se registran pero no se relanzan: una notificación
 * que no se pudo escribir no puede tumbar el "Me gusta" ni el XP,
 * que ya están concedidos.
 */
async function notificar(a: Aviso): Promise<void> {
  try {
    if (!a.recipientId || !a.actorId) return;
    if (a.recipientId === a.actorId) return;

    const ref = db.doc(`${USERS}/${a.recipientId}/${NOTIFICACIONES}/${a.id}`);

    const datos: Record<string, unknown> = {
      type: a.type,
      recipientId: a.recipientId,
      actorId: a.actorId,
      actorName: a.actorName || 'Alguien',
      actorAvatar: a.actorAvatar || '',
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    };

    // Solo se escribe lo que hay. Un `null` en un campo opcional se
    // pinta igual que un `undefined` en el cliente, pero ocupa
    // espacio en el documento y ensucia las consultas.
    const opcionales: Record<string, unknown> = {
      threadId: a.threadId,
      targetType: a.targetType,
      targetId: a.targetId,
      commentId: a.commentId,
      animeId: a.animeId,
      chatId: a.chatId,
      snippet: a.snippet ? recortar(a.snippet) : undefined,
      reaction: a.reaction,
      level: a.level,
      medalId: a.medalId,
      medalName: a.medalName,
      triviaCorrect: a.triviaCorrect,
      triviaTotal: a.triviaTotal,
      title: a.title,
    };

    Object.keys(opcionales).forEach((k) => {
      const v = opcionales[k];
      if (v !== undefined && v !== null) datos[k] = v;
    });

    // Devuelve `false` si ya existía. No es un error: es el caso
    // normal de un trigger que se repite.
    await ref.create(datos);
  } catch (e) {
    logger.error('Fallo escribiendo una notificacion', { id: a.id, error: e });
  }
}

/** Recorta el texto que acompaña al aviso, como hace el cliente. */
function recortar(texto: string, max = 80): string {
  const limpio = texto.replace(/\s+/g, ' ').trim();
  if (limpio.length <= max) return limpio;
  const corte = limpio.slice(0, max);
  const espacio = corte.lastIndexOf(' ');
  const base = espacio > max * 0.6 ? corte.slice(0, espacio) : corte;
  return `${base.replace(/[\s,.;:!?-]+$/, '')}...`;
}

/** Cuántas menciones se resuelven como máximo en un comentario. */
const MAX_MENCIONES = 5;

/**
 * Saca los "@usuario" de un texto.
 *
 * COPIA de `mencionesDe` en `src/utils/notificaciones.ts`: los dos
 * paquetes no comparten código, así que el cambio hay que hacerlo en
 * los dos sitios. Si divergieran, se crearía el aviso y el
 * autocompletado escribiría otra cosa, que es el peor resultado
 * posible porque no se ve.
 */
function mencionesDe(texto: string | undefined): string[] {
  if (!texto) return [];

  const encontradas = texto.match(/@([A-Za-z0-9._-]{1,24})/g) ?? [];
  const nombres = encontradas.map((m) => m.slice(1));

  const vistas = new Set<string>();
  const unicas: string[] = [];
  for (const nombre of nombres) {
    const clave = nombre.toLowerCase();
    if (vistas.has(clave)) continue;
    vistas.add(clave);
    unicas.push(nombre);
  }

  return unicas.slice(0, MAX_MENCIONES);
}

/**
 * Convierte un "@nombre" en el uid de esa persona.
 *
 * Son DOS consultas y no una porque `username` se guarda tal cual
 * lo escribió el usuario, y no siempre en minúscula: buscar solo
 * por el texto exacto dejaría sin notificar a quien se registró
 * como "NekoChan" y fue mencionado como "@nekochan".
 *
 * Se intenta primero la exacta (que es el caso normal, y solo
 * cuesta una lectura) y la de minúsculas solo si la primera no dio
 * nada.
 */
async function uidDeUsuario(username: string): Promise<string | null> {
  const limpio = username.trim();
  if (!limpio) return null;

  try {
    const exacta = await db
      .collection(USERS)
      .where('username', '==', limpio)
      .limit(1)
      .get();
    if (!exacta.empty) return exacta.docs[0].id;

    // Si el nombre ya venía en minúscula, la primera consulta ya
    // lo buscó: repetirla sería la misma lectura dos veces.
    const minuscula = limpio.toLowerCase();
    if (minuscula === limpio) return null;

    const porMinuscula = await db
      .collection(USERS)
      .where('username', '==', minuscula)
      .limit(1)
      .get();
    if (!porMinuscula.empty) return porMinuscula.docs[0].id;

    return null;
  } catch (e) {
    logger.error('Fallo buscando el usuario de una mencion', { username: limpio, error: e });
    return null;
  }
}

/**
 * Avisa a todos los "@mencionados" de un comentario.
 *
 * Los que no existen se ignoran sin error: escribir "@ anecdote" o
 * "@spoiler2026" es texto normal, no un nombre roto, y no puede
 * ser motivo de que el comentario no se publique.
 *
 * Se resuelven en serie y no en `Promise.all` a propósito: con
 * cinco menciones son cinco lecturas seguidas, y en paralelo se
 * dispararían las cinco de golpe. Aquí van de una en una, que es
 * lo que ya hace el resto del archivo.
 */
async function avisarMenciones(
  body: string | undefined,
  commentId: string,
  autorId: string,
  autorNombre: string,
  autorAvatar: string,
  contexto: {
    threadId: string | null;
    targetType: string | null;
    targetId: string | null;
    /** Serie del contenido, para que el aviso se pueda abrir. */
    animeId?: string | null;
  },
): Promise<void> {
  const nombres = mencionesDe(body);
  if (nombres.length === 0) return;

  for (const nombre of nombres) {
    const uid = await uidDeUsuario(nombre);
    if (!uid) continue;

    await notificar({
      id: `mention_${commentId}_${uid}`,
      type: 'mention',
      recipientId: uid,
      actorId: autorId,
      actorName: autorNombre,
      actorAvatar: autorAvatar,
      threadId: contexto.threadId,
      targetType: contexto.targetType,
      targetId: contexto.targetId,
      animeId: contexto.animeId ?? null,
      commentId,
      snippet: body,
    });
  }
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
  marcas: Record<string, string> = {},
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

// ── Estadísticas ───────────────────────────────────────
    //
    // Se aplican en tres grupos y en tres procedimientos distintos,
    // porque son tres cosas distintas. Ver `stats.ts`, donde está
    // el porqué de cada uno.
    let est = leerEstadisticas(data);

    // 1. Los contadores de contenido SUMAN. Los triggers pasan `1` o
    //    `-1` y no saben cuántos había, así que esto no puede ser un
    //    "ponte 1": con "ponte" el segundo comentario reescribía 1
    //    encima del 1 anterior y el contador se quedaba en 1 para
    //    siempre. Ninguna medalla de "N comentarios" se completaba
    //    nunca, porque N no pasaba de 1.
    est = sumarContadores(est, stats);

    // 2. Los de la trivia PONEN el total, porque el trigger de la
    //    trivia lee el documento antes de escribir. Con incrementos,
    //    dos trivias simultáneas darían un número de menos.
est = ponerTotales(est, stats);

    // 3. El de seguidores es un MAXIMO, ni suma ni total: viene el
    //    numero de ahora y lo que importa es el mas alto que haya
    //    tenido, para que la medalla no retroceda si alguien le
    //    deja de seguir.
    if (stats.followersReceived !== undefined) {
      est = subirTecho(est, stats.followersReceived);
    }

    if (r.animeId && cantidad > 0) {
      est.animeXp[r.animeId] = num(est.animeXp[r.animeId]) + cantidad;
    }

    // ── Marcas de pertenencia y creación ─────────────
    //
    // Los triggers que no dan XP (clubes, canales, chats, tier
    // lists, encuestas creadas con el hilo) marcan ids en los
    // mapas de `stats`. Un id que ya está no cuenta dos veces, y
    // nada se resta nunca: la medalla no se pierde por salir de
    // un club o borrar un canal.
    for (const [campo, id] of Object.entries(marcas)) {
      if (campo.startsWith('topico:') && id) {
        est = marcarTopico(est, campo.slice('topico:'.length), id);
      } else if (esCampoMapa(campo) && id) {
        est = conMarca(est, campo, id);
      }
    }

    // ── Día de actividad ─────────────────────────────
    //
    // Cada acción que da XP cuenta el día una sola vez (hora del
    // servidor). No hay trigger diario que recorrer usuarios: el
    // día se marca al pasar por aquí, que es por donde pasan
    // todas las acciones que puntúan.
    const hoy = new Date().toISOString().slice(0, 10);
    const dia = pasarDia(est.diasActivosTotal, est.diasActivosUltimo, hoy);
    est.diasActivosTotal = dia.total;
    est.diasActivosUltimo = dia.ultimo;

    // ── Medallas ───────────────────────────────────────────
    const yaDesbloqueadas =
      data.medals && typeof data.medals === 'object'
        ? (data.medals as Record<string, unknown>)
        : {};
    // Antigüedad y perfil se calculan del documento, no de
    // `stats`: la fecha de registro y los datos básicos no son
    // contadores. El criterio de perfil completo es el mismo que
    // el cliente usa para la barra (ver `ProgressionContext`).
    const noVacio = (v: unknown): boolean =>
      typeof v === 'string' && v.trim().length > 0;
    const nuevas = medallasNuevas(
      est,
      nivel.level,
      yaDesbloqueadas,
      config.animeMedallas,
      xpDespues,
      {
        antiguedadDias: diasDesde(data.createdAt, Date.now()),
        perfilCompleto:
          noVacio(data.displayName) && noVacio(data.bio) && noVacio(data.avatarUrl),
        perfilCustom: tieneCustom(data),
      },
    );

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

      try {
        await notificar({
          id: `level_up_${uid}_${Date.now()}`,
          type: 'level_up',
          recipientId: uid,
          actorId: uid,
          actorName: '',
          actorAvatar: '',
          level: nivel.level,
          title: `¡Has subido al nivel ${nivel.level}!`,
        });
      } catch (e) {
        logger.error('Fallo notificando subida de nivel', {
          uid,
          nivel: nivel.level,
          error: e,
        });
      }
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
      const mejor = nuevas[0];
      const nombre = NOMBRES_DE_MEDALLA[mejor] ?? mejor;

      try {
        await notificar({
          id: `achievement_${uid}_${mejor}`,
          type: 'achievement',
          recipientId: uid,
          actorId: uid,
          actorName: '',
          actorAvatar: '',
          medalId: mejor,
          medalName: nombre,
          title: `Has desbloqueado la medalla "${nombre}"`,
        });
      } catch (e) {
        logger.error('Fallo notificando medalla', { uid, medalla: mejor, error: e });
      }
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
  opciones: { permitirNegativo?: boolean; marcas?: Record<string, string> } = {},
): Promise<ResultadoXP> {
  const primero = await concederXP(uid, idLibro, r, stats, opciones, opciones.marcas ?? {});

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
// MARCAR PERTENENCIA SIN DAR XP
// ======================================================
//
// Crear un club, unirse a uno, abrir un canal, escribir en un
// chat, publicar una tier list o una encuesta NO dan XP (no hay
// motivo en la configuración para eso): solo marcan el id en los
// mapas de `stats`, que es lo que miran esas medallas.
//
// Va separado de `concederXP` porque ahí todo pasa por el libro
// mayor, y aquí no hay nada que pagar ni que impedir que se
// repita: el mapa ya es idempotente por construcción. Lo que sí
// se comparte es la evaluación de medallas y el aviso.
//
// Los triggers llaman aquí con el id ya validado por las reglas
// (solo el dueño crea el club, solo miembros escriben...): si el
// documento existe, la acción fue legítima.
async function marcarMapa(
  uid: string,
  marcas: Record<string, string>,
): Promise<string[]> {
  const config = await leerConfig();
  if (!config.activo) return [];

  const userRef = db.doc(`${USERS}/${uid}`);

  return db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) return [];

    const data = userSnap.data() ?? {};
    let est = leerEstadisticas(data);

    for (const [campo, id] of Object.entries(marcas)) {
      if (campo.startsWith('topico:') && id) {
        est = marcarTopico(est, campo.slice('topico:'.length), id);
      } else if (esCampoMapa(campo) && id) {
        est = conMarca(est, campo, id);
      }
    }

    const nivel = num(data.level) || 1;
    const noVacio = (v: unknown): boolean =>
      typeof v === 'string' && v.trim().length > 0;
    const nuevas = medallasNuevas(
      est,
      nivel,
      data.medals && typeof data.medals === 'object'
        ? (data.medals as Record<string, unknown>)
        : {},
      config.animeMedallas,
      num(data.xp),
      {
        antiguedadDias: diasDesde(data.createdAt, Date.now()),
        perfilCompleto:
          noVacio(data.displayName) && noVacio(data.bio) && noVacio(data.avatarUrl),
        perfilCustom: tieneCustom(data),
      },
    );

    const update: Record<string, unknown> = { stats: est };

    if (nuevas.length > 0) {
      const medals = { ...(data.medals as Record<string, unknown>) };
      nuevas.forEach((id) => {
        medals[id] = ahoraIso();
      });
      update.medals = medals;
    }

    tx.update(userRef, update);

    if (nuevas.length > 0) {
      const mejor = nuevas[0];
      const nombre = NOMBRES_DE_MEDALLA[mejor] ?? mejor;

      try {
        await notificar({
          id: `achievement_${uid}_${mejor}`,
          type: 'achievement',
          recipientId: uid,
          actorId: uid,
          actorName: '',
          actorAvatar: '',
          title: `¡Medalla desbloqueada: ${nombre}!`,
        });
      } catch (e) {
        logger.error('Fallo notificando medalla por marca', {
          uid,
          medalla: mejor,
          error: e,
        });
      }
    }

    return nuevas;
  });
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

    // Marcas sin XP: encuesta creada con el hilo, imagen en el
    // hilo y tópicos oficiales de sus tags (medallas Encuestador,
    // Maestro de los Memes, Manga, Recomendador, Teórico y
    // Explorador de Géneros). Solo hilos: los comentarios no
    // llevan imagen en este modelo.
    const marcas: Record<string, string> = {};
    if (data.poll && typeof data.poll === 'object') {
      marcas.encuestasCreadas = threadId;
    }
    if (typeof data.imageUrl === 'string' && data.imageUrl.trim() !== '') {
      marcas.visualesIds = threadId;
    }
    for (const topico of topicosDe(data.tags)) {
      marcas[`topico:${topico}`] = threadId;
    }

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
        // Un hilo creado CON encuesta cuenta también como encuesta
        // creada (medalla Encuestador). Si la encuesta se añade
        // después, este trigger no la ve: es la limitación
        // documentada, y por eso la medalla pide 10 y no 1.
        Object.keys(marcas).length > 0 ? { marcas } : {},
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

    // ── Avisos ───────────────────────────────────────────
    //
    // Van DESPUÉS del XP y con su propio `try`: que falle un aviso
    // no puede tumbar la recompensa ni el contador del hilo, que ya
    // están concedidos.
    try {
      await avisarMenciones(
        typeof data.body === 'string' ? data.body : '',
        commentId,
        authorId,
        typeof data.authorName === 'string' ? data.authorName : '',
        typeof data.authorAvatar === 'string' ? data.authorAvatar : '',
        {
          threadId: targetType === 'thread' ? targetId : null,
          targetType: targetType ?? null,
          targetId: targetType === 'thread' ? null : targetId,
          animeId,
        },
      );

      // Respuesta: si el comentario tiene `parentId`, quien wrote el
      // padre tiene derecho a saber que le han contestado. El padre
      // puede haber sido borrado mientras tanto; entonces no hay
      // aviso, y es lo correcto: nadie puede leer un comentario que
      // ya no existe.
      const parentId = typeof data.parentId === 'string' ? data.parentId : null;
      let padreId: string | null = null;

      if (parentId) {
        const padre = await db.doc(`${COMMENTS}/${parentId}`).get();
        padreId = padre.exists ? padre.data()?.authorId ?? null : null;

        if (typeof padreId === 'string' && padreId) {
          await notificar({
            id: `reply_${commentId}`,
            type: 'comment_reply',
            recipientId: padreId,
            actorId: authorId,
            actorName: typeof data.authorName === 'string' ? data.authorName : '',
            actorAvatar: typeof data.authorAvatar === 'string' ? data.authorAvatar : '',
            threadId: targetType === 'thread' ? targetId : null,
            targetType,
            targetId: targetType === 'thread' ? null : targetId,
            animeId,
            commentId,
            snippet: typeof data.body === 'string' ? data.body : '',
          });
        }
      }

      // ── Comentario nuevo en TU hilo ─────────────────────────
      //
      // Esto NO es un caso raro: es lo que pasa el 90% de las
      // veces que alguien abre la campana esperando algo. Sin
      // esto, el único aviso que genera un comentario es la
      // respuesta a un comentario tuyo o un "@mension", y un hilo
      // con veinte comentarios nuevos no genera ni uno.
      //
      // El aviso va al AUTOR DEL HILO, que se deduce del
      // documento del hilo (nunca de un campo que envíe el
      // cliente). Que te avise a ti es lo que toca; los que ya
      // tienen su propio aviso no reciben un segundo:
      //
      //   · Si eres tú quien comenta, `notificar` lo descarta
      //     (filtro 1: nadie se avisa a sí mismo).
      //   · Si el hilo es tuyo y además contestan a un comentario
      //     tuyo, `padreId` ya es tu uid y con `notificar` a
      //     secas tendrías DOS avisos por el mismo comentario: uno
      //     de "respondió a tu comentario" y otro de "comentó en
      //     tu hilo". Se salta el segundo, porque el primero ya
      //     dice lo mismo y mejor.
      if (targetType === 'thread' && targetId && padreId !== authorId) {
        const hilo = await db.doc(`${THREADS}/${targetId}`).get();
        const autorHiloId = hilo.exists ? hilo.data()?.authorId ?? null : null;

        // El hilo puede haberse borrado entre el comentario y
        // esta lectura. Entonces no hay aviso, que es lo correcto:
        // el aviso llevaría a un hilo que ya no existe.
        if (typeof autorHiloId === 'string' && autorHiloId && autorHiloId !== padreId) {
          await notificar({
            // Determinista igual que los demás: el comentario es
            // único, así que el aviso también. Un reintento del
            // trigger no duplica nada.
            id: `thread_comment_${commentId}`,
            type: 'comment_thread',
            recipientId: autorHiloId,
            actorId: authorId,
            actorName: typeof data.authorName === 'string' ? data.authorName : '',
            actorAvatar: typeof data.authorAvatar === 'string' ? data.authorAvatar : '',
            threadId: targetId,
            targetType: null,
            targetId: null,
            commentId,
            snippet: typeof data.body === 'string' ? data.body : '',
          });
        }
      }
    } catch (e) {
      logger.error('Fallo avisando de un comentario nuevo', { commentId, error: e });
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
  // Dónde está el contenido, para el XP y para el aviso. Se resuelve
  // UNA vez y se reutiliza en los dos sitios: si el aviso guardara
  // 'comment' en vez del sitio real, no llevaría a nada.
  let animeId: string | null = null;
  let targetTypeDelComentario: string | undefined;
  let targetIdDelComentario = '';

  if (coleccion === COMMENTS) {
    targetTypeDelComentario =
      typeof despues?.targetType === 'string'
        ? (despues.targetType as string)
        : typeof antes?.targetType === 'string'
          ? (antes.targetType as string)
          : undefined;
    targetIdDelComentario =
      typeof despues?.targetId === 'string'
        ? (despues.targetId as string)
        : typeof antes?.targetId === 'string'
          ? (antes.targetId as string)
          : '';
    animeId = await resolverAnimeDe(targetTypeDelComentario, targetIdDelComentario);
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

      // ── Notificación ───────────────────────────────────
      try {
        await notificar({
          id: `like_${docId}_${liker}`,
          type: coleccion === THREADS ? 'post_like' : 'comment_like',
          recipientId: authorId,
          actorId: liker,
          actorName: '',
          actorAvatar: '',
          // Para un comentario se guarda DÓNDE está el comentario, no que
          // es un comentario. Con `targetType: 'comment'` el aviso no
          // lleva a ningún sitio: la wiki y el feed no saben abrir
          // "un comentario" sin el hilo o la serie que lo contiene.
          // `targetTypeDelComentario` y `targetIdDelComentario` ya
          // están resueltos de arriba para el XP.
          threadId:
            coleccion === THREADS
              ? docId
              : targetTypeDelComentario === 'thread'
                ? targetIdDelComentario
                : null,
          targetType: coleccion === COMMENTS ? targetTypeDelComentario : null,
          targetId: coleccion === COMMENTS ? targetIdDelComentario : null,
          animeId,
          commentId: coleccion === COMMENTS ? docId : null,
          snippet: (() => {
            const raw = (antes ?? despues)?.body;
            return typeof raw === 'string' ? raw.slice(0, 120) : undefined;
          })(),
        });
      } catch (e) {
        logger.error('Fallo notificando "Me gusta"', {
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

// ── Aviso de mensaje de chat ─────────────────────────────────────
//
// Antes no existía: los mensajes solo movían el punto de "sin leer"
// dentro de la sección de chats, y la campana no se enteraba. Por
// eso "no salen en notificaciones los mensajes que te envían".
//
// Se dispara al crearse el documento del mensaje, no al actualizar
// la vista previa del chat (`lastMessageAt`): la vista previa se
// escribe en una segunda escritura separada y puede fallar sin que
// el mensaje se pierda, y el aviso debe salir aunque eso pase.
//
// El id es `chat_${messageId}`: el mismo para todos los
// destinatarios porque cada uno vive en su propia subcolección
// (`users/{uid}/notifications/{id}`), y `create()` hace que un
// reintento del trigger no duplique el aviso.
export const onChatMessageCreated = onDocumentCreated(
  `${CHATS}/{chatId}/messages/{messageId}`,
  async (event) => {
    try {
      const data = event.data?.data();
      if (!data) return;

      const senderId = typeof data.senderId === 'string' ? data.senderId : '';
      if (!senderId) {
        logger.warn('Mensaje de chat sin emisor; no se avisa', {
          chatId: event.params['chatId'],
          messageId: event.params['messageId'],
        });
        return;
      }

      const chatId = event.params['chatId'];
      const messageId = event.params['messageId'];

      const chatSnap = await db.doc(`${CHATS}/${chatId}`).get();
      if (!chatSnap.exists) {
        logger.warn('Aviso de chat: la conversación ya no existe', { chatId, messageId });
        return;
      }

      const miembros = chatSnap.data()?.memberIds;
      if (!Array.isArray(miembros)) {
        logger.warn('Aviso de chat: la conversación no tiene miembros', { chatId, messageId });
        return;
      }

      const destinatarios = miembros.filter(
        (id): id is string => typeof id === 'string' && !!id && id !== senderId,
      );
      if (destinatarios.length === 0) {
        logger.info('Aviso de chat: nadie a quien avisar', { chatId, messageId, senderId });
        return;
      }

      logger.info('Aviso de chat: avisando', {
        chatId,
        messageId,
        senderId,
        destinatarios: destinatarios.length,
      });

      const tipoMensaje = typeof data.type === 'string' ? data.type : 'text';
      const cuerpo = typeof data.body === 'string' ? data.body.trim() : '';

      // Sin texto no hay cita que enseñar, pero el aviso tiene que
      // decir algo: un aviso sin `snippet` sale con el texto
      // genérico y parece vacío.
      const snippet =
        cuerpo ||
        (tipoMensaje === 'gif'
          ? 'GIF'
          : tipoMensaje === 'image'
            ? 'Foto'
            : tipoMensaje === 'location'
              ? 'Ubicación'
              : '');

      const actorName = typeof data.senderName === 'string' ? data.senderName : '';
      const actorAvatar = typeof data.senderAvatar === 'string' ? data.senderAvatar : '';

      await Promise.all(
        destinatarios.map((recipientId) =>
          notificar({
            id: `chat_${messageId}`,
            type: 'chat_message',
            recipientId,
            actorId: senderId,
            actorName,
            actorAvatar,
            chatId,
            snippet: snippet || null,
          }),
        ),
      );
    } catch (e) {
      logger.error('Fallo notificando mensaje de chat', {
        chatId: event.params['chatId'],
        messageId: event.params['messageId'],
        error: e,
      });
    }
  },
);


// ── Borrado para todos de un mensaje (estilo WhatsApp) ─────────
//
// El cliente NO puede hacerlo solo: las reglas solo dejan a un
// admin tocar mensajes, así que esta callable es el único camino.
// Aquí se comprueba con el reloj del servidor:
//
//   1. Quien llama tiene sesión.
//   2. El chat existe y quien llama es miembro.
//   3. El mensaje existe y es SUYO (senderId == uid).
//   4. No han pasado 2 horas desde `createdAt` (< estricto: a las
//      2 horas justas ya no se puede).
//   5. Sin fecha fiable no hay borrado (fail closed).
//
// Es un borrado LÓGICO: el documento sigue para no romper el orden
// ni las referencias, pero el contenido se vacía en el servidor.
// Vaciarlo aquí (y no solo esconderlo en el cliente) importa porque
// los miembros pueden LEER los documentos: si el texto siguiera en
// el documento, "eliminar para todos" sería cosmético y cualquiera
// con la consola lo leería igual.
//
// El archivo de Storage NO se borra: podría compartirlo otro
// mensaje y comprobarlo exigiría un rastreo caro. Sin `imageUrl` en
// el documento ya no se muestra ni se descubre desde el chat.
const VENTANA_BORRADO_MS = 2 * 60 * 60 * 1000;

/**
 * Exige sesión, perfil y que la cuenta no esté baneada.
 *
 * Es el equivalente en servidor de `isActive()` en las reglas.
 * Se usa en las callables de chat para que un baneado no pueda
 * seguir editando, borrando o aceptando solicitudes aunque su
 * documento siga estando en `memberIds`.
 */
async function exigirActivo(auth: unknown): Promise<string> {
  const uid = (auth as { uid?: string } | undefined)?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Tienes que iniciar sesión.');
  }

  const [perfil, restriccion] = await Promise.all([
    db.doc(`${USERS}/${uid}`).get(),
    db.doc(`${ACCOUNT_RESTRICTIONS}/${uid}`).get(),
  ]);

  if (!perfil.exists) {
    throw new HttpsError(
      'permission-denied',
      'Tu cuenta no tiene perfil de usuario.',
    );
  }

  const baneoDuradero =
    restriccion.exists &&
    restriccion.data()?.activo === true &&
    restriccion.data()?.tipo === 'ban';

  if (baneoDuradero || perfil.data()?.isBanned === true) {
    throw new HttpsError(
      'permission-denied',
      'Tu cuenta está baneada y no puede hacer esto.',
    );
  }

  return uid;
}

export const eliminarMensajeParaTodos = onCall(async (request) => {
  const uid = await exigirActivo(request.auth);

  const chatId = typeof request.data?.chatId === 'string' ? request.data.chatId : '';
  const messageId =
    typeof request.data?.messageId === 'string' ? request.data.messageId : '';

  if (!chatId || !messageId) {
    throw new HttpsError('invalid-argument', 'Falta el chat o el mensaje.');
  }

  const chatSnap = await db.doc(`${CHATS}/${chatId}`).get();
  const miembros = chatSnap.data()?.memberIds;

  if (!chatSnap.exists || !Array.isArray(miembros) || !miembros.includes(uid)) {
    throw new HttpsError('permission-denied', 'No estás en esa conversación.');
  }

  const ref = db.doc(`${CHATS}/${chatId}/messages/${messageId}`);
  const snap = await ref.get();

  if (!snap.exists) {
    throw new HttpsError('not-found', 'Ese mensaje ya no está.');
  }

  const data = snap.data() ?? {};

  // Solo el autor. Ni el dueño del grupo ni un admin por aquí:
  // los admins ya pueden por reglas y esto es para usuarios.
  if (data.senderId !== uid) {
    throw new HttpsError('permission-denied', 'Solo el autor puede borrar para todos.');
  }

  // Idempotente: si ya se borró, no es un error.
  if (data.deletedForEveryone) {
    return { ok: true };
  }

  const creado = data.createdAt?.toMillis?.();

  if (typeof creado !== 'number' || Number.isNaN(creado)) {
    throw new HttpsError(
      'permission-denied',
      'Ese mensaje no tiene fecha fiable y no se puede borrar para todos.',
    );
  }

  if (Date.now() - creado >= VENTANA_BORRADO_MS) {
    throw new HttpsError('permission-denied', 'Pasaron las 2 horas.');
  }

  await ref.update({
    body: '',
    imageUrl: FieldValue.delete(),
    gif: FieldValue.delete(),
    location: FieldValue.delete(),
    // La encuesta también se quita: un mensaje borrado no vota.
    // Sus votos se limpian justo debajo, acotados a un lote, para
    // no dejar una subcolección huérfana que nadie puede ver pero
    // que seguiría contando cuota.
    poll: FieldValue.delete(),
    deletedForEveryone: true,
    deletedAt: FieldValue.serverTimestamp(),
    deletedBy: uid,
  });

  try {
    const votos = await ref.collection('pollVotes').limit(400).get();
    if (!votos.empty) {
      const lote = db.batch();
      votos.docs.forEach((d) => lote.delete(d.ref));
      await lote.commit();
    }
  } catch (e) {
    logger.error('No se pudieron limpiar los votos de la encuesta al borrar', {
      chatId,
      messageId,
      error: e,
    });
  }

  // Si era el último, la vista previa no puede seguir enseñando el
  // texto borrado. Se deja este marcador sin tocar la fecha: el
  // orden de la conversación no cambia por borrar.
  try {
    const top = await db
      .collection(`${CHATS}/${chatId}/messages`)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (!top.empty && top.docs[0].id === messageId) {
      await db.doc(`${CHATS}/${chatId}`).update({
        lastMessage: 'Este mensaje fue eliminado',
      });
    }
  } catch (e) {
    logger.error('No se pudo actualizar la vista previa al borrar', {
      chatId,
      messageId,
      error: e,
    });
  }

  return { ok: true };
});


// ── Editar el texto de un mensaje propio ─────────────────────────
//
// Como el borrado, solo el servidor puede: las reglas no dejan a
// ningún cliente actualizar mensajes. Aquí se comprueba:
//
//   1. Quien llama tiene sesión y es miembro del chat.
//   2. El mensaje existe y es SUYO.
//   3. No está borrado para todos (lo borrado no se reedita).
//   4. El texto cabe (1 a 4000, como al enviar; vacío solo si el
//      mensaje ya lleva foto, GIF o ubicación).
//
// La creación NO se toca: editar no rejuvenece el mensaje y el
// plazo de borrado sigue contando desde el envío. Se guarda
// `editedAt` para pintar el "editado".
export const editarMensajeChat = onCall(async (request) => {
  const uid = await exigirActivo(request.auth);

  const chatId = typeof request.data?.chatId === 'string' ? request.data.chatId : '';
  const messageId =
    typeof request.data?.messageId === 'string' ? request.data.messageId : '';
  const body = typeof request.data?.body === 'string' ? request.data.body.trim() : '';

  if (!chatId || !messageId) {
    throw new HttpsError('invalid-argument', 'Falta el chat o el mensaje.');
  }

  if (body.length > 4000) {
    throw new HttpsError('invalid-argument', 'El mensaje no puede superar los 4000 caracteres.');
  }

  const chatSnap = await db.doc(`${CHATS}/${chatId}`).get();
  const miembros = chatSnap.data()?.memberIds;

  if (!chatSnap.exists || !Array.isArray(miembros) || !miembros.includes(uid)) {
    throw new HttpsError('permission-denied', 'No estás en esa conversación.');
  }

  const ref = db.doc(`${CHATS}/${chatId}/messages/${messageId}`);
  const snap = await ref.get();

  if (!snap.exists) {
    throw new HttpsError('not-found', 'Ese mensaje ya no está.');
  }

  const data = snap.data() ?? {};

  if (data.senderId !== uid) {
    throw new HttpsError('permission-denied', 'Solo el autor puede editar.');
  }

  if (data.deletedForEveryone) {
    throw new HttpsError(
      'failed-precondition',
      'Ese mensaje se eliminó para todos y no se puede editar.',
    );
  }

  const llevaAlgo = Boolean(data.gif ?? data.imageUrl ?? data.location);

  if (!body && !llevaAlgo) {
    throw new HttpsError('invalid-argument', 'El mensaje no puede quedar vacío.');
  }

  await ref.update({
    body,
    editedAt: FieldValue.serverTimestamp(),
  });

  // Si es el último, la vista previa sigue al texto nuevo. Como al
  // borrar: se mira cuál es el último de verdad, no se supone.
  try {
    const top = await db
      .collection(`${CHATS}/${chatId}/messages`)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (!top.empty && top.docs[0].id === messageId) {
      await db.doc(`${CHATS}/${chatId}`).update({
        lastMessage: body || 'Mensaje con archivo adjunto',
      });
    }
  } catch (e) {
    logger.error('No se pudo actualizar la vista previa al editar', {
      chatId,
      messageId,
      error: e,
    });
  }

  return { ok: true };
});


// ======================================================
// SOLICITUDES DE CHAT Y MIEMBROS
// ======================================================
//
// Aceptar una solicitud NO puede hacerlo el cliente. Si pudiera
// escribir `status: 'accepted'`, se aceptaría su propia solicitud
// y el estado que lee la interfaz dejaría de significar algo.
//
// Aquí se hacen las tres cosas que necesitan confianza:
//
//   · responderSolicitudChat: acepta/rechaza/cancela una solicitud
//     de chat privado, de entrada a un grupo o de invitación.
//   · responderSolicitudClub: acepta/rechaza una solicitud de
//     acceso a un club y mete al miembro en todos sus chats
//     públicos en la MISMA transacción.
//   · unirseClubPublico: entrada directa a un club público, también
//     con el club y los chats en una sola transacción.
//
// El Admin SDK ignora las reglas, pero no las comprobaciones de
// este archivo: cada callable vuelve a mirar quién llama, el estado
// real de la solicitud y el estado de la cuenta.

/** Texto recortado y acotado, para no guardar lo que mande el cliente. */
function texto(valor: unknown, max = 500): string {
  return typeof valor === 'string' ? valor.trim().slice(0, max) : '';
}

function nombreDePerfil(datos: Record<string, unknown> | undefined): string {
  const nombre = typeof datos?.displayName === 'string' ? datos.displayName.trim() : '';
  const usuario = typeof datos?.username === 'string' ? datos.username.trim() : '';
  return (nombre || usuario || 'Usuario').slice(0, 80);
}

function avatarDePerfil(datos: Record<string, unknown> | undefined): string {
  const avatar =
    (typeof datos?.avatarUrl === 'string' && datos.avatarUrl) ||
    (typeof datos?.photoURL === 'string' && datos.photoURL) ||
    (typeof datos?.photoUrl === 'string' && datos.photoUrl) ||
    '';
  return avatar.slice(0, 500);
}

function restriccionEsBaneo(datos: Record<string, unknown> | undefined): boolean {
  return !!datos && datos.activo === true && datos.tipo === 'ban';
}

function cuentaBaneada(
  perfil: Record<string, unknown> | undefined,
  restriccion: Record<string, unknown> | undefined,
): boolean {
  return restriccionEsBaneo(restriccion) || perfil?.isBanned === true;
}

/** Una sanción de club sigue viva si no tiene fecha o si expira en el futuro. */
function sancionDeClubActiva(
  datos: Record<string, unknown> | undefined,
  ahora: number,
): boolean {
  if (!datos) return false;
  const expira = datos.expira;
  if (!expira) return true;

  const conToMillis = expira as { toMillis?: () => number };
  if (typeof conToMillis.toMillis === 'function') {
    return conToMillis.toMillis() > ahora;
  }
  if (typeof expira === 'number') return expira > ahora;

  const ms = Date.parse(String(expira));
  return Number.isNaN(ms) ? true : ms > ahora;
}

function listaDeUids(valor: unknown): string[] {
  if (!Array.isArray(valor)) return [];
  return valor.filter((v): v is string => typeof v === 'string' && v.length > 0);
}

function unicos(valores: string[]): string[] {
  return valores.filter((v, i, arr) => arr.indexOf(v) === i);
}

/**
 * Acepta, rechaza o cancela una solicitud de chat.
 *
 * `accion`:
 *   · aceptar  → solo el destinatario (`toId`). Crea el chat directo
 *                o mete al solicitante en el grupo.
 *   · rechazar → solo el destinatario. No toca miembros.
 *   · cancelar → solo quien la envió. No toca miembros.
 *
 * Para un grupo, aceptar una solicitud `group` la hace el dueño y
 * añade al solicitante; aceptar una `invite` la hace el invitado y
 * lo añade a él. En los dos casos el chat y la solicitud se
 * actualizan en la misma transacción.
 */
export const responderSolicitudChat = onCall(async (request) => {
  const uid = await exigirActivo(request.auth);
  const requestId = texto(request.data?.requestId, 200);
  const accion = texto(request.data?.accion, 20);

  if (!requestId || !['aceptar', 'rechazar', 'cancelar'].includes(accion)) {
    throw new HttpsError('invalid-argument', 'Falta la solicitud o la acción.');
  }

  const solicitudRef = db.doc(`chatRequests/${requestId}`);

  const resultado = await db.runTransaction(async (tx) => {
    const solicitudSnap = await tx.get(solicitudRef);
    if (!solicitudSnap.exists) {
      throw new HttpsError('not-found', 'Esa solicitud ya no existe.');
    }

    const solicitud = solicitudSnap.data() ?? {};
    const tipo = solicitud.type;
    const fromId = solicitud.fromId;
    const toId = solicitud.toId;

    if (typeof fromId !== 'string' || typeof toId !== 'string') {
      throw new HttpsError('failed-precondition', 'La solicitud está incompleta.');
    }

    if (fromId === toId) {
      throw new HttpsError(
        'failed-precondition',
        'Una solicitud no puede tener el mismo emisor y destinatario.',
      );
    }

    if (solicitud.status !== 'pending') {
      // Reintento de una ACEPTACIÓN ya hecha: devolver el chat es
      // mejor que un error, porque la interfaz puede haber perdido
      // la respuesta de la primera llamada. Solo vale para la misma
      // acción y para el destinatario; un reintento de "rechazar"
      // sobre una solicitud aceptada no debe devolver un chat como
      // si la hubiera rechazado.
      if (
        accion === 'aceptar' &&
        solicitud.status === 'accepted' &&
        toId === uid &&
        typeof solicitud.resultingChatId === 'string'
      ) {
        return { chatId: solicitud.resultingChatId };
      }
      throw new HttpsError(
        'failed-precondition',
        'Esa solicitud ya no está pendiente.',
      );
    }

    if (accion === 'cancelar') {
      if (fromId !== uid) {
        throw new HttpsError(
          'permission-denied',
          'Solo quien envió la solicitud puede cancelarla.',
        );
      }

      tx.update(solicitudRef, {
        status: 'cancelled',
        respondedAt: FieldValue.serverTimestamp(),
        respondedBy: uid,
      });
      return {};
    }

    if (toId !== uid) {
      throw new HttpsError(
        'permission-denied',
        'Solo la persona que recibió la solicitud puede responderla.',
      );
    }

    if (accion === 'rechazar') {
      tx.update(solicitudRef, {
        status: 'rejected',
        respondedAt: FieldValue.serverTimestamp(),
        respondedBy: uid,
      });
      return {};
    }

    // ── Aceptar ────────────────────────────────────────
    if (tipo === 'direct') {
      if (fromId === uid) {
        throw new HttpsError(
          'permission-denied',
          'No puedes aceptar tu propia solicitud.',
        );
      }

      const perfilSnap = await tx.get(db.doc(`${USERS}/${fromId}`));
      const restriccionSnap = await tx.get(
        db.doc(`${ACCOUNT_RESTRICTIONS}/${fromId}`),
      );

      if (!perfilSnap.exists) {
        throw new HttpsError(
          'failed-precondition',
          'La otra persona ya no tiene perfil.',
        );
      }

      const perfil = perfilSnap.data() ?? {};
      if (cuentaBaneada(perfil, restriccionSnap.data())) {
        throw new HttpsError(
          'permission-denied',
          'La otra persona está baneada.',
        );
      }

      const chatRef = db.collection(CHATS).doc();
      tx.set(chatRef, {
        type: 'direct',
        name: nombreDePerfil(perfil),
        avatar: avatarDePerfil(perfil),
        ownerId: uid,
        memberIds: [uid, fromId],
        hiddenFor: [],
        lastMessage: '',
        lastMessageAt: FieldValue.serverTimestamp(),
        lastMessageSenderId: fromId,
        readAt: { [uid]: FieldValue.serverTimestamp() },
        createdAt: FieldValue.serverTimestamp(),
      });

      tx.update(solicitudRef, {
        status: 'accepted',
        respondedAt: FieldValue.serverTimestamp(),
        respondedBy: uid,
        resultingChatId: chatRef.id,
      });

      return { chatId: chatRef.id };
    }

    if (tipo !== 'group' && tipo !== 'invite') {
      throw new HttpsError('failed-precondition', 'Tipo de solicitud desconocido.');
    }

    const groupId = typeof solicitud.groupId === 'string' ? solicitud.groupId : '';
    if (!groupId) {
      throw new HttpsError('failed-precondition', 'La solicitud no trae grupo.');
    }

    const chatRef = db.doc(`${CHATS}/${groupId}`);
    const chatSnap = await tx.get(chatRef);

    if (!chatSnap.exists) {
      throw new HttpsError('not-found', 'Ese grupo ya no existe.');
    }

    const chat = chatSnap.data() ?? {};
    if (chat.type !== 'group') {
      throw new HttpsError('failed-precondition', 'Ese chat no es un grupo.');
    }

    // En una entrada, quien acepta es el dueño y el nuevo miembro es
    // quien la pidió. En una invitación, quien acepta es el invitado
    // y el dueño es quien la mandó. Las dos comprobaciones se hacen
    // contra el documento real, no contra lo que diga la solicitud.
    if (tipo === 'group' && chat.ownerId !== uid) {
      throw new HttpsError(
        'permission-denied',
        'Solo el dueño del grupo puede aceptar esta solicitud.',
      );
    }
    if (tipo === 'invite' && chat.ownerId !== fromId) {
      throw new HttpsError(
        'permission-denied',
        'La invitación no la envió el dueño actual del grupo.',
      );
    }

    const nuevoMiembro = tipo === 'group' ? fromId : uid;
    if (nuevoMiembro === chat.ownerId) {
      throw new HttpsError('failed-precondition', 'Esa persona ya es del grupo.');
    }

    const perfilSnap = await tx.get(db.doc(`${USERS}/${nuevoMiembro}`));
    const restriccionSnap = await tx.get(
      db.doc(`${ACCOUNT_RESTRICTIONS}/${nuevoMiembro}`),
    );

    if (!perfilSnap.exists) {
      throw new HttpsError(
        'failed-precondition',
        'La persona que entra ya no tiene perfil.',
      );
    }

    if (cuentaBaneada(perfilSnap.data(), restriccionSnap.data())) {
      throw new HttpsError(
        'permission-denied',
        'La persona que entra está baneada.',
      );
    }

    const miembros = listaDeUids(chat.memberIds);
    const yaEstaba = miembros.includes(nuevoMiembro);
    const nuevos = yaEstaba ? miembros : [...miembros, nuevoMiembro];

    if (!yaEstaba && nuevos.length > 50) {
      throw new HttpsError(
        'resource-exhausted',
        'El grupo ya tiene el máximo de miembros.',
      );
    }

    // El contador del índice de invitación se lee ANTES de escribir.
    // Si no existe o apunta a otro grupo, no se toca.
    const codigo = typeof chat.code === 'string' ? chat.code : '';
    const codigoRef = codigo ? db.doc(`groupCodes/${codigo}`) : null;
    const codigoSnap = codigoRef ? await tx.get(codigoRef) : null;

    if (!yaEstaba) {
      tx.update(chatRef, {
        memberIds: nuevos,
        hiddenFor: FieldValue.arrayRemove(nuevoMiembro),
      });
    }

    if (
      codigoRef &&
      codigoSnap?.exists &&
      codigoSnap.data()?.groupId === groupId
    ) {
      tx.update(codigoRef, { memberCount: nuevos.length });
    }

    tx.update(solicitudRef, {
      status: 'accepted',
      respondedAt: FieldValue.serverTimestamp(),
      respondedBy: uid,
      resultingChatId: groupId,
    });

    return { chatId: groupId };
  });

  return { ok: true, chatId: resultado.chatId ?? null };
});

/**
 * Acepta o rechaza una solicitud de acceso a un club.
 *
 * Solo el equipo del club (propietario, admins o moderadores) puede
 * responder. Al aceptar se añade a la persona al club y a TODOS los
 * chats públicos (el histórico y los canales visibles) en la misma
 * transacción. Los canales `mods` no se tocan: la persona entra como
 * miembro normal.
 */
export const responderSolicitudClub = onCall(async (request) => {
  const uid = await exigirActivo(request.auth);
  const clubId = texto(request.data?.clubId, 100);
  const requestId = texto(request.data?.requestId, 200);
  const accion = texto(request.data?.accion, 20);

  if (!clubId || !requestId || !['aceptar', 'rechazar'].includes(accion)) {
    throw new HttpsError('invalid-argument', 'Falta el club, la solicitud o la acción.');
  }

  const clubRef = db.doc(`${CLUBS}/${clubId}`);
  const solicitudRef = db.doc(`${CLUBS}/${clubId}/requests/${requestId}`);

  // Los canales se leen fuera de la transacción (las transacciones
  // de Admin SDK no aceptan consultas). Después se relee cada chat
  // dentro, que es lo que de verdad importa.
  const canalesSnap = await db.collection(`${CLUBS}/${clubId}/${CHANNELS}`).get();
  const canales = canalesSnap.docs.map((d) => {
    const datos = d.data() as Record<string, unknown>;
    return { id: d.id, visibility: datos.visibility, chatId: datos.chatId };
  });

  await db.runTransaction(async (tx) => {
    const clubSnap = await tx.get(clubRef);
    const solicitudSnap = await tx.get(solicitudRef);

    if (!clubSnap.exists) {
      throw new HttpsError('not-found', 'Ese club ya no existe.');
    }
    if (!solicitudSnap.exists) {
      throw new HttpsError('not-found', 'Esa solicitud ya no existe.');
    }

    const club = clubSnap.data() ?? {};
    const solicitud = solicitudSnap.data() ?? {};

    const miembrosClub = listaDeUids(club.memberIds);
    const esMiembro = miembrosClub.includes(uid);
    const esEquipo =
      club.ownerId === uid ||
      (Array.isArray(club.moderatorIds) && club.moderatorIds.includes(uid)) ||
      (Array.isArray(club.adminIds) && club.adminIds.includes(uid));

    if (!esMiembro || !esEquipo) {
      throw new HttpsError(
        'permission-denied',
        'Solo el equipo del club puede responder solicitudes.',
      );
    }

    if (solicitud.clubId && solicitud.clubId !== clubId) {
      throw new HttpsError('failed-precondition', 'La solicitud no es de este club.');
    }

    const fromId = typeof solicitud.fromId === 'string' ? solicitud.fromId : '';
    if (!fromId) {
      throw new HttpsError('failed-precondition', 'La solicitud no trae usuario.');
    }

    if (solicitud.status !== 'pending') {
      const yaDentro = miembrosClub.includes(fromId);
      if (solicitud.status === 'accepted' && yaDentro) return;
      if (solicitud.status === 'rejected' && accion === 'rechazar') return;
      throw new HttpsError(
        'failed-precondition',
        'Esa solicitud ya no está pendiente.',
      );
    }

    if (accion === 'rechazar') {
      tx.update(solicitudRef, {
        status: 'rejected',
        respondedAt: FieldValue.serverTimestamp(),
        respondedBy: uid,
      });
      return;
    }

    // ── Aceptar: perfil, baneo y sanción del club ──────
    const perfilSnap = await tx.get(db.doc(`${USERS}/${fromId}`));
    const restriccionSnap = await tx.get(
      db.doc(`${ACCOUNT_RESTRICTIONS}/${fromId}`),
    );
    const sancionSnap = await tx.get(
      db.doc(`${CLUBS}/${clubId}/sancion/${fromId}`),
    );

    if (!perfilSnap.exists) {
      throw new HttpsError(
        'failed-precondition',
        'La persona que quiere entrar ya no tiene perfil.',
      );
    }

    if (cuentaBaneada(perfilSnap.data(), restriccionSnap.data())) {
      throw new HttpsError(
        'permission-denied',
        'La persona que quiere entrar está baneada.',
      );
    }

    if (sancionDeClubActiva(sancionSnap.data(), Date.now())) {
      throw new HttpsError(
        'permission-denied',
        'La persona tiene una sanción vigente en este club.',
      );
    }

    const members = { ...((club.members ?? {}) as Record<string, unknown>) };
    const yaEstaba = !!members[fromId] || miembrosClub.includes(fromId);
    const nuevosMiembros = yaEstaba
      ? unicos([...miembrosClub, fromId])
      : [...miembrosClub, fromId];

    if (!yaEstaba) {
      members[fromId] = {
        uid: fromId,
        role: 'member',
        joinedAt: new Date().toISOString(),
      };
    }

    // Chats que tienen que recibir a la persona: el histórico y los
    // canales públicos. Los `mods` se quedan como están.
    const chats = unicos([
      typeof club.chatId === 'string' ? club.chatId : '',
      ...canales
        .filter((c) => c.visibility === 'all' && typeof c.chatId === 'string')
        .map((c) => c.chatId as string),
    ]).filter((id) => id.length > 0);

    const chatsSnap = await Promise.all(
      chats.map((id) => tx.get(db.doc(`${CHATS}/${id}`))),
    );

    if (!yaEstaba) {
      tx.update(clubRef, {
        members,
        memberIds: nuevosMiembros,
        memberCount: nuevosMiembros.length,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    chatsSnap.forEach((chatSnap) => {
      if (!chatSnap.exists) return;
      tx.update(chatSnap.ref, {
        memberIds: FieldValue.arrayUnion(fromId),
        hiddenFor: FieldValue.arrayRemove(fromId),
      });
    });

    tx.update(solicitudRef, {
      status: 'accepted',
      respondedAt: FieldValue.serverTimestamp(),
      respondedBy: uid,
    });
  });

  return { ok: true };
});

/**
 * Entrada directa a un club público.
 *
 * El club y sus chats públicos se actualizan en una transacción.
 * Antes lo hacía el cliente en dos escrituras separadas y las
 * reglas no podían comprobar que la persona ya era miembro del
 * club en el momento de tocar el chat (cada escritura de un lote
 * se evalúa contra el estado ANTERIOR): quedaba un hueco para
 * meterse en el chat de un club público sin unirse.
 */
export const unirseClubPublico = onCall(async (request) => {
  const uid = await exigirActivo(request.auth);
  const clubId = texto(request.data?.clubId, 100);
  if (!clubId) {
    throw new HttpsError('invalid-argument', 'Falta el club.');
  }

  const clubRef = db.doc(`${CLUBS}/${clubId}`);
  const canalesSnap = await db.collection(`${CLUBS}/${clubId}/${CHANNELS}`).get();
  const canales = canalesSnap.docs.map((d) => {
    const datos = d.data() as Record<string, unknown>;
    return { id: d.id, visibility: datos.visibility, chatId: datos.chatId };
  });

  await db.runTransaction(async (tx) => {
    const clubSnap = await tx.get(clubRef);
    if (!clubSnap.exists) {
      throw new HttpsError('not-found', 'Ese club ya no existe.');
    }

    const club = clubSnap.data() ?? {};
    if (club.accessType !== 'public') {
      throw new HttpsError(
        'permission-denied',
        'Este club no es público: hay que pedir acceso.',
      );
    }

    const sancionSnap = await tx.get(
      db.doc(`${CLUBS}/${clubId}/sancion/${uid}`),
    );
    if (sancionDeClubActiva(sancionSnap.data(), Date.now())) {
      throw new HttpsError(
        'permission-denied',
        'Tienes una sanción vigente en este club.',
      );
    }

    const members = { ...((club.members ?? {}) as Record<string, unknown>) };
    const miembrosClub = listaDeUids(club.memberIds);
    const yaEstaba = !!members[uid] || miembrosClub.includes(uid);
    const nuevosMiembros = yaEstaba ? unicos([...miembrosClub, uid]) : [...miembrosClub, uid];

    if (!yaEstaba) {
      members[uid] = {
        uid,
        role: 'member',
        joinedAt: new Date().toISOString(),
      };
    }

    const chats = unicos([
      typeof club.chatId === 'string' ? club.chatId : '',
      ...canales
        .filter((c) => c.visibility === 'all' && typeof c.chatId === 'string')
        .map((c) => c.chatId as string),
    ]).filter((id) => id.length > 0);

    const chatsSnap = await Promise.all(
      chats.map((id) => tx.get(db.doc(`${CHATS}/${id}`))),
    );

    if (!yaEstaba) {
      tx.update(clubRef, {
        members,
        memberIds: nuevosMiembros,
        memberCount: nuevosMiembros.length,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    chatsSnap.forEach((chatSnap) => {
      if (!chatSnap.exists) return;
      tx.update(chatSnap.ref, {
        memberIds: FieldValue.arrayUnion(uid),
        hiddenFor: FieldValue.arrayRemove(uid),
      });
    });
  });

  return { ok: true };
});

/**
 * Abre un chat privado desde el servidor.
 *
 * Es una herramienta de administración/migración: el flujo normal es
 * solicitud → aceptación, que ya crea el chat. Se mantiene la función
 * que usaba el cliente, pero solo la puede llamar el equipo. Un
 * usuario normal no puede abrirle una conversación a nadie.
 */
export const abrirChatDirecto = onCall(async (request) => {
  const uid = await exigirAdmin(request.auth);
  const targetUid = texto(request.data?.targetUid, 200);

  if (!targetUid) {
    throw new HttpsError('invalid-argument', 'Falta la otra persona.');
  }
  if (targetUid === uid) {
    throw new HttpsError('invalid-argument', 'No puedes abrir un chat contigo.');
  }

  const [perfilSnap, restriccionSnap] = await Promise.all([
    db.doc(`${USERS}/${targetUid}`).get(),
    db.doc(`${ACCOUNT_RESTRICTIONS}/${targetUid}`).get(),
  ]);

  if (!perfilSnap.exists) {
    throw new HttpsError('not-found', 'Ese usuario no existe.');
  }

  const perfil = perfilSnap.data() ?? {};
  if (cuentaBaneada(perfil, restriccionSnap.data())) {
    throw new HttpsError('permission-denied', 'Ese usuario está baneado.');
  }

  const chatRef = db.collection(CHATS).doc();
  await chatRef.set({
    type: 'direct',
    name: nombreDePerfil(perfil),
    avatar: avatarDePerfil(perfil),
    ownerId: uid,
    memberIds: [uid, targetUid],
    hiddenFor: [],
    lastMessage: '',
    lastMessageAt: FieldValue.serverTimestamp(),
    lastMessageSenderId: uid,
    readAt: { [uid]: FieldValue.serverTimestamp() },
    createdAt: FieldValue.serverTimestamp(),
  });

  return { ok: true, chatId: chatRef.id };
});

/**
 * Cambia la visibilidad de un canal y sincroniza su chat.
 *
 * Las reglas ya no dejan cambiar `visibility` desde el cliente: si
 * un canal pasa de `all` a `mods`, hay que quitar del chat a todos
 * los que no son del equipo, y si pasa de `mods` a `all`, hay que
 * meterlos. Hacerlo en dos escrituras dejaba una ventana en la que
 * el canal era restringido pero su historial seguía abierto.
 */
export const cambiarVisibilidadCanal = onCall(async (request) => {
  const uid = await exigirActivo(request.auth);
  const clubId = texto(request.data?.clubId, 100);
  const channelId = texto(request.data?.channelId, 50);
  const visibility = texto(request.data?.visibility, 10);

  if (!clubId || !channelId || !['all', 'mods'].includes(visibility)) {
    throw new HttpsError('invalid-argument', 'Faltan el canal o la visibilidad.');
  }
  if (channelId === 'general' && visibility !== 'all') {
    throw new HttpsError(
      'invalid-argument',
      'El canal general no puede ser restringido.',
    );
  }

  const clubRef = db.doc(`${CLUBS}/${clubId}`);
  const canalRef = db.doc(`${CLUBS}/${clubId}/${CHANNELS}/${channelId}`);

  const resultado = await db.runTransaction(async (tx) => {
    const [clubSnap, canalSnap, perfilSnap] = await Promise.all([
      tx.get(clubRef),
      tx.get(canalRef),
      tx.get(db.doc(`${USERS}/${uid}`)),
    ]);

    if (!clubSnap.exists) {
      throw new HttpsError('not-found', 'Ese club ya no existe.');
    }
    if (!canalSnap.exists) {
      throw new HttpsError('not-found', 'Ese canal ya no existe.');
    }

    const club = clubSnap.data() ?? {};
    const canal = canalSnap.data() ?? {};
    const perfil = perfilSnap.data() ?? {};

    const esAdminGlobal = perfil.role === 'admin';
    const esMiembro = listaDeUids(club.memberIds).includes(uid);
    const rango =
      club.ownerId === uid
        ? 3
        : Array.isArray(club.adminIds) && club.adminIds.includes(uid)
          ? 2
          : Array.isArray(club.moderatorIds) && club.moderatorIds.includes(uid)
            ? 1
            : 0;
    const permisos = (club.permisos ?? {}) as Record<string, unknown>;
    const puedeGestionar =
      esAdminGlobal ||
      (esMiembro &&
        (rango === 3 ||
          (rango === 2 && permisos.adminGestionaCanales === true) ||
          (rango === 1 && permisos.moderadorGestionaCanales === true)));

    if (!puedeGestionar) {
      throw new HttpsError(
        'permission-denied',
        'No tienes permiso para gestionar los canales de este club.',
      );
    }

    if (canal.clubId && canal.clubId !== clubId) {
      throw new HttpsError('failed-precondition', 'El canal no es de este club.');
    }

    const chatId = typeof canal.chatId === 'string' ? canal.chatId : '';
    if (!chatId) {
      throw new HttpsError('failed-precondition', 'El canal no tiene chat.');
    }

    const chatSnap = await tx.get(db.doc(`${CHATS}/${chatId}`));
    if (!chatSnap.exists) {
      throw new HttpsError('failed-precondition', 'El chat del canal no existe.');
    }

    const chat = chatSnap.data() ?? {};
    if (
      chat.type !== 'club' ||
      chat.slug !== clubId ||
      chat.channelId !== channelId
    ) {
      throw new HttpsError(
        'failed-precondition',
        'El chat del canal no es el que le corresponde.',
      );
    }

    const todos = unicos([
      ...listaDeUids(club.memberIds),
      ...(typeof club.ownerId === 'string' ? [club.ownerId] : []),
    ]);
    const equipo = unicos([
      ...(typeof club.ownerId === 'string' ? [club.ownerId] : []),
      ...(Array.isArray(club.moderatorIds)
        ? club.moderatorIds.filter((m): m is string => typeof m === 'string')
        : []),
    ]).filter((m) => todos.includes(m));

    const nuevos = visibility === 'mods' ? equipo : todos;

    tx.update(canalRef, {
      visibility,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const cambioChat: Record<string, unknown> = { memberIds: nuevos };
    if (nuevos.length > 0) {
      cambioChat.hiddenFor = FieldValue.arrayRemove(...nuevos);
    }
    tx.update(chatSnap.ref, cambioChat);

    return { miembros: nuevos.length };
  });

  return { ok: true, ...resultado };
});

/**
 * Mantiene el contador del índice de invitación de los grupos.
 *
 * Antes lo actualizaba el cliente, y solo el dueño podía: cuando
 * alguien salía por su cuenta, el contador se quedaba viejo. Ahora
 * cualquier cambio de `memberIds` (aceptación, salida, expulsión)
 * lo pone al día el servidor.
 */
export const onChatMembersChanged = onDocumentUpdated(
  `${CHATS}/{chatId}`,
  async (event) => {
    try {
      const antes = event.data?.before.data();
      const despues = event.data?.after.data();
      if (!despues || despues.type !== 'group') return;

      const miembrosAntes = listaDeUids(antes?.memberIds);
      const miembrosDespues = listaDeUids(despues.memberIds);
      const mismos =
        miembrosAntes.length === miembrosDespues.length &&
        miembrosAntes.every((id) => miembrosDespues.includes(id));
      if (mismos) return;

      const codigo = typeof despues.code === 'string' ? despues.code : '';
      if (!codigo) return;

      const ref = db.doc(`groupCodes/${codigo}`);
      const snap = await ref.get();
      if (!snap.exists || snap.data()?.groupId !== event.params.chatId) return;

      await ref.update({ memberCount: miembrosDespues.length });
    } catch (e) {
      logger.error('No se pudo actualizar el contador del grupo', {
        chatId: event.params.chatId,
        error: e,
      });
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

      // ── Notificación de reacción ───────────────────────
      try {
        if (authorId !== userId) {
          const ref = docDelObjetivo(data.targetType, targetId, data.chatId);
          const snap = await ref?.get();
          const contenido = snap?.data() ?? {};
          const body =
            data.targetType === 'thread'
              ? typeof contenido.title === 'string'
                ? contenido.title
                : ''
              : typeof contenido.body === 'string'
                ? contenido.body
                : '';

          // Para un comentario o un mensaje, el aviso tiene que
          // llevar a DÓNDE están, no a qué son. El documento que
          // acaba de leerse (`contenido`) ya dice dónde: un
          // comentario tiene `targetType`/`targetId` de su
          // contexto, y un mensaje de chat tiene `chatId`.
          //
          // Con 'comment' en `targetType` el aviso no lleva a
          // ninguna parte, que es el motivo por el que antes un
          // "reaccionó a tu comentario" no movía nada.
          const dondeEs =
            data.targetType === 'thread'
              ? { threadId: targetId, targetType: null, targetId: null }
              : data.targetType === 'comment'
                ? {
                    threadId:
                      contenido.targetType === 'thread'
                        ? typeof contenido.targetId === 'string'
                          ? contenido.targetId
                          : null
                        : null,
                    targetType:
                      typeof contenido.targetType === 'string'
                        ? contenido.targetType
                        : null,
                    targetId:
                      typeof contenido.targetId === 'string'
                        ? contenido.targetId
                        : null,
                  }
                : { threadId: null, targetType: null, targetId: null };

          const animeDelAviso =
            data.targetType === 'comment' && dondeEs.targetType
              ? await resolverAnimeDe(dondeEs.targetType, dondeEs.targetId ?? '')
              : null;

          await notificar({
            id: `reaction_${data.targetType}_${targetId}_${userId}`,
            type: data.targetType === 'thread'
              ? 'post_reaction'
              : 'comment_reaction',
            recipientId: authorId,
            actorId: userId,
            actorName: typeof data.userName === 'string' ? data.userName : 'Alguien',
            actorAvatar: '',
            threadId: dondeEs.threadId,
            targetType: dondeEs.targetType,
            targetId: dondeEs.targetId,
            animeId: animeDelAviso,
            commentId: data.targetType === 'comment' ? targetId : null,
            reaction: typeof data.type === 'string' ? data.type : undefined,
            snippet: body.slice(0, 120),
          });
        }
      } catch (e) {
        logger.error('Fallo notificando reaccion', {
          docId,
          userId,
          accion,
          error: e,
        });
      }

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
// SEGUIMIENTOS ENTRE USUARIOS
// ======================================================
//
// El cliente escribe las DOS mitades de la relacion en un lote
// atomico (ver `followUser` en `src/services/follows.ts`):
//
//   users/{yo}/following/{ellos}   → "yo sigo a ellos"
//   users/{ellos}/followers/{yo}   → "ellos me tiene como seguidor"
//
// Aqui solo se hace lo que el cliente NO puede hacer: mover los
// contadores del documento de la persona seguida, escribir el aviso
// y conceder el XP.
//
// ── Por que un trigger y no lo hace el cliente ─────────
//
// Los contadores (`followersCount` en el documento de la persona
// seguida, `followingCount` en el del que sigue) estan en
// `users/{uid}`, y las reglas ya bloquean que un usuario escriba en
// el documento de otro. Ademas, aunque se le dejara, podria
// falsearlos a su antojo: bajarse el contador a mano para que sus
// medallas de comunidad no le cuadren, o subírselo para
// conseguirlas.
//
// ── Por que los contadores se CUENTAN y no se suman ─────
//
// `increment` parece lo natural, pero con un trigger que se
// entrega "al menos una vez" un reintento lo aplicaria dos veces y
// el contador se desfasaria para siempre. Contar los documentos de
// la subcoleccion da el valor REAL, y el trigger es idempotente
// por construccion: se puede ejecutar tres veces y el contador
// sigue siendo el mismo.
//
// El coste es una lectura agregada por evento, que es exactamente
// lo que hace `getCountFromServer`: una lectura, sin importar si hay
// 3 seguidores o 3.000.
//
// ── El XP no se retira ───────────────────────────────────
//
// Es lo unico que se aleja del patron de los "me gusta", y es
// deliberado (ver `XP_POR_DEFECTO.follow_received`):
//
//   · Si se retirara al dejar de seguir, un follow/unfollow/follow
//     volvería a pagar, porque el documento del libro mayor se
//     habría borrado. Eso es un farm de XP con dos clics.
//   · El libro mayor con id del par hace que un segundo follow del
//     MISMO par no pague nada.
//
// Así que "dejar de seguir" no devuelve el XP. Es coherente con que
// la medalla de comunidad tampoco se pierda, y con que los hitos de
// nivel (que se pagan una vez) no se devuelvan nunca.
//
// El aviso es al revés: solo se manda al SEGUIR. "X ya no te sigue"
// no es información, es ruido.
export const onFollowChanged = onDocumentWritten(
  `${USERS}/{uid}/${FOLLOWING}/{targetUid}`,
  async (event) => {
    const antes = event.data?.before?.data();
    const despues = event.data?.after?.data();

    // create -> sigue. delete -> deja de seguir. update -> no
    // debería pasar nunca (las reglas lo prohíben), pero se
    // comprueba para no pagar dos veces si alguien lo fuerza desde la
    // consola con el Admin SDK.
    if (antes && despues) return;

    const uid = event.params['uid'];
    const targetUid = event.params['targetUid'];

    // Nadie se sigue a sí mismo. Las reglas ya lo impiden, pero el
    // trigger lo comprueba también: si esa regla se relajara
    // alguna vez, un self-follow daría XP y no tendría ningún
    // sentido.
    if (!uid || !targetUid || uid === targetUid) {
      logger.warn('Relacion de seguimiento invalida', { uid, targetUid });
      return;
    }

    const ahoraSigue = Boolean(despues);

    try {
      // ── 1. Contadores ────────────────────────────────────
      //
      // Los dos se CUENTAN sobre el estado actual, no se suman. Un
      // reintento del trigger vuelve a contar lo mismo y deja el
      // mismo numero, que es lo que hace que esto sea idempotente.
      const [siguiendoAhora, seguidaPorAhora] = await Promise.all([
        contarEn(`${USERS}/${uid}/${FOLLOWING}`),
        contarEn(`${USERS}/${targetUid}/${FOLLOWERS}`),
      ]);

      // `merge: true` en vez de `set` a secas: el documento del
      // usuario tiene veinte campos (xp, level, stats, medals...) y
      // un `set` sin merge los BORRARÍA todos. Es el mismo aviso que
      // ya está escrito en `concederXP` sobre lo fácil que es
      // perder el progreso con una escritura mal puesta.
      const batch = db.batch();
      batch.set(
        db.doc(`${USERS}/${uid}`),
        { followingCount: siguiendoAhora },
        { merge: true },
      );
      batch.set(
        db.doc(`${USERS}/${targetUid}`),
        { followersCount: seguidaPorAhora },
        { merge: true },
      );
      await batch.commit();

      logger.info('Contadores de seguimiento actualizados', {
        uid,
        targetUid,
        siguiendoAhora,
        seguidaPorAhora,
      });

      // ── 2. El aviso, solo al seguir ──────────────────────
      //
      // Al dejar de seguir NO hay aviso. "X ya no te sigue" no es
      // información: es ruido, y además permitiría que alguien
      // mandara spam de "deja de seguirme" con la misma frecuencia.
      if (!ahoraSigue) return;

      // El nombre y el avatar se leen del documento del que sigue.
      // Es lo que ya hacen las demas notificaciones, y es lo que
      // evita guardar en el aviso datos que el cliente pueda
      // falsear: si el campo `actorName` del aviso lo escribiera
      // quien sigue, podría poner el nombre de otra persona.
      const actorSnap = await db.doc(`${USERS}/${uid}`).get();
      const actor: Record<string, unknown> = actorSnap.data() ?? {};

      await notificar({
        // Determinista por el par. Si el trigger se repite, el
        // aviso ya existe y `create()` falla en silencio, así que
        // no se duplica. Y si dejan de seguir y vuelven a seguir,
        // el par es el mismo y el aviso ANTIGUO sigue ahí sin
        // volverse a crear: es lo correcto, porque su estado
        // ("le sigo") es el de ahora.
        id: `follow_${uid}_${targetUid}`,
        type: 'follow',
        recipientId: targetUid,
        actorId: uid,
        actorName: typeof actor.displayName === 'string' && actor.displayName
          ? actor.displayName
          : typeof actor.username === 'string'
            ? actor.username
            : 'Alguien',
        actorAvatar: typeof actor.avatarUrl === 'string' ? actor.avatarUrl : '',
        // El aviso lleva al perfil de quien te sigue, que es donde
        // se le puede seguir de vuelta. `targetId` es el que sigue,
        // que en este caso es el propio actor.
        targetType: 'profile',
        targetId: uid,
      });

      // ── 3. XP y medallas de comunidad ───────────────────
      //
      // Se le paga a QUIEN RECIBE el follow (targetUid), nunca a
      // quien lo hace. Pagar al que sigue sería un farm trivial con
      // dos cuentas.
      await concederConHitos(
        targetUid,
        // El id del par. Es lo que hace que un
        // follow/unfollow/follow del mismo par no pague la segunda
        // vez, porque el documento del libro mayor sigue ahí.
        `follow_${uid}_${targetUid}`,
        {
          reason: 'follow_received',
          sourceId: uid,
          actorId: uid,
          nota: 'Alguien te ha seguido',
          animeId: null,
        },
        // `followersReceived` es un máximo, y `concederXP` usa
        // `Math.max` con lo que ya había, así que aquí se le pasa
        // el número vivo sin miedo a que la medalla retroceda.
        { followersReceived: seguidaPorAhora },
      );
    } catch (e) {
      // Un fallo aquí no puede romper el follow: los dos
      // documentos ya están escritos y son la verdad. Lo que se
      // pierde es el contador, el aviso o el XP, y queda en el log.
      //
      // NO se relanza a propósito: Cloud Functions reintentaría, y
      // un reintento volvería a intentar el aviso. El id es
      // determinista, así que no se duplicaría, pero el retardo en
      // el log y en las métricas no compensa. Además los
      // documentos ya están bien, y eso es lo que importa.
      logger.error('Fallo procesando un cambio de seguimiento', {
        uid,
        targetUid,
        error: e,
      });
    }
  },
);

/**
 * Cuántos documentos hay en una ruta de colección.
 *
 * Una lectura agregada: en Firestore cuesta lo mismo con 3
 * documentos que con 3.000, y es lo que devuelve el numero REAL en
 * lugar de un incremento que un reintento del trigger aplicaría dos
 * veces.
 */
async function contarEn(ruta: string): Promise<number> {
  const snap = await db.collection(ruta).count().get();
  return snap.data().count;
}


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

/**
 * Lanza si el que llama no es del equipo. Devuelve su uid.
 *
 * Ademas del rol, se exige que el perfil EXISTA y que la cuenta no
 * tenga un baneo vigente. Son las mismas tres condiciones que
 * `isActive()` en las reglas, y por el mismo motivo: una cuenta de
 * Auth sin perfil, o un miembro del equipo baneado, no puede seguir
 * usando el panel aunque su documento diga `role: 'admin'`.
 *
 * Se miran las DOS copias del baneo (el registro duradero y la
 * bandera visible) para que una cuenta baneada antes de existir
 * `accountRestrictions` tampoco se cuele.
 */
async function exigirAdmin(auth: unknown): Promise<string> {
  const uid = (auth as { uid?: string } | undefined)?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Tienes que iniciar sesion.');
  }

  const [snap, restriccion] = await Promise.all([
    db.doc(`${USERS}/${uid}`).get(),
    db.doc(`${ACCOUNT_RESTRICTIONS}/${uid}`).get(),
  ]);

  if (!snap.exists) {
    throw new HttpsError(
      'permission-denied',
      'Tu cuenta no tiene perfil de usuario.',
    );
  }

  const datos = snap.data();
  const rol = datos?.role;

  if (rol !== 'admin' && rol !== 'moderator') {
    throw new HttpsError('permission-denied', 'No tienes permiso para esto.');
  }

  const baneoDuradero =
    restriccion.exists &&
    restriccion.data()?.activo === true &&
    restriccion.data()?.tipo === 'ban';

  if (baneoDuradero || datos?.isBanned === true) {
    throw new HttpsError(
      'permission-denied',
      'Tu cuenta esta baneada y no puede usar el panel.',
    );
  }

  return uid;
}

// ======================================================
// REGISTRO DURABLE DE BANEOS
// ======================================================
//
// Un baneo NO puede vivir solo en `users/{uid}.isBanned`: ese
// documento lo puede borrar su dueño (el borrado legítimo de
// cuenta) y, al volver a entrar, el cliente se lo recrea con
// `isBanned: false`. Si la sanción viviera solo ahí, borrar y
// recrear sería la forma más fácil de saltarse un baneo.
//
// Por eso la fuente de verdad es `accountRestrictions/{uid}`,
// que solo escribe este archivo con el Admin SDK. Las reglas de
// Firestore y Storage la consultan en `isBanned()`. El documento
// de `users` sigue llevando la copia visible para el panel.
//
// Las dos escrituras van en una transacción: o quedan las dos
// copias de acuerdo, o no queda ninguna.

/**
 * Deja el baneo (o su levantamiento) en el registro duradero y en
 * la copia visible de `users/{uid}`, a la vez.
 *
 * `fechaFin` solo se usa al banear: `null` es un baneo permanente.
 * Al levantar la restricción se conserva el motivo y la fecha del
 * baneo original (con `merge`), y se añade quién y cuándo lo
 * levantó, para que el registro siga contando lo que pasó.
 */
async function guardarBaneo(
  uid: string,
  activo: boolean,
  motivo: string | null,
  fechaFin: Timestamp | null,
  por: string,
): Promise<void> {
  const restriccionRef = db.doc(`${ACCOUNT_RESTRICTIONS}/${uid}`);
  const usuarioRef = db.doc(`${USERS}/${uid}`);

  await db.runTransaction(async (tx) => {
    const [usuario, restriccion] = await Promise.all([
      tx.get(usuarioRef),
      tx.get(restriccionRef),
    ]);

    if (!usuario.exists && activo) {
      // Para banear hace falta un perfil: el panel trabaja sobre
      // usuarios que existen. Para LEVANTAR una restricción no: si
      // el baneado borró su perfil, el registro sigue ahí y un
      // administrador (o la limpieza de baneos temporales) tiene
      // que poder desactivarlo igualmente.
      throw new HttpsError('not-found', 'Ese usuario no existe.');
    }

    if (activo) {
      const datos: Record<string, unknown> = {
        uid,
        tipo: 'ban',
        activo: true,
        motivo,
        fechaFin,
        // La fecha de alta no se pisa si la restricción ya existía
        // (por ejemplo, un rebaneo después de un levantamiento).
        creadoEn: restriccion.exists
          ? restriccion.data()?.creadoEn ?? FieldValue.serverTimestamp()
          : FieldValue.serverTimestamp(),
        actualizadoEn: FieldValue.serverTimestamp(),
        actualizadoPor: por,
      };
      tx.set(restriccionRef, datos);
    } else {
      tx.set(
        restriccionRef,
        {
          uid,
          tipo: 'ban',
          activo: false,
          actualizadoEn: FieldValue.serverTimestamp(),
          actualizadoPor: por,
          levantadoEn: FieldValue.serverTimestamp(),
          levantadoPor: por,
        },
        { merge: true },
      );
    }

    if (usuario.exists) {
      tx.update(usuarioRef, { isBanned: activo });
    }
  });
}

/**
 * Banea a un usuario.
 *
 * La llama el panel con `httpsCallable`. El rol se comprueba aquí,
 * con el documento real, no con lo que diga el cliente. Los
 * moderadores pueden banear usuarios normales; a otro moderador o
 * a un admin solo lo puede banear un admin.
 *
 * `fechaFinMs` es opcional: sin ella el baneo es permanente. Si
 * viene, tiene que ser futura; un baneo temporal vencido lo
 * levanta sola `levantarBaneosVencidos`.
 */
export const banearUsuario = onCall(async (request) => {
  const adminUid = await exigirAdmin(request.auth);

  const uid = typeof request.data?.uid === 'string' ? request.data.uid.trim() : '';
  const motivo =
    typeof request.data?.motivo === 'string'
      ? request.data.motivo.trim().slice(0, 500)
      : '';
  const fechaFinMs =
    typeof request.data?.fechaFinMs === 'number' ? request.data.fechaFinMs : null;

  if (!uid) throw new HttpsError('invalid-argument', 'Falta el usuario.');

  if (uid === adminUid) {
    throw new HttpsError(
      'invalid-argument',
      'No puedes banear tu propia cuenta.',
    );
  }

  const objetivo = await db.doc(`${USERS}/${uid}`).get();
  if (!objetivo.exists) {
    throw new HttpsError('not-found', 'Ese usuario no existe.');
  }

  const rolObjetivo = objetivo.data()?.role;
  const llamante = await db.doc(`${USERS}/${adminUid}`).get();
  const rolLlamante = llamante.data()?.role;

  // El panel ya esconde el botón, pero el servidor no se fía de la
  // interfaz: un moderador no puede banear a otro moderador ni a
  // un admin.
  if (
    (rolObjetivo === 'admin' || rolObjetivo === 'moderator') &&
    rolLlamante !== 'admin'
  ) {
    throw new HttpsError(
      'permission-denied',
      'No puedes banear a un miembro del equipo.',
    );
  }

  let fechaFin: Timestamp | null = null;
  if (fechaFinMs !== null) {
    if (!Number.isFinite(fechaFinMs) || fechaFinMs <= Date.now()) {
      throw new HttpsError(
        'invalid-argument',
        'La fecha de fin del baneo tiene que ser futura.',
      );
    }
    fechaFin = Timestamp.fromMillis(fechaFinMs);
  }

  await guardarBaneo(uid, true, motivo || null, fechaFin, adminUid);

  logger.info('Usuario baneado', {
    objetivo: uid,
    por: adminUid,
    motivo,
    permanente: fechaFin === null,
  });

  return {
    ok: true,
    uid,
    activo: true,
    fechaFin: fechaFin ? fechaFin.toMillis() : null,
  };
});

/**
 * Levanta el baneo de un usuario.
 *
 * No borra el documento de `accountRestrictions`: lo marca
 * `activo: false`. Así queda constancia de que hubo una sanción y
 * de quién la levantó, y el registro sigue existiendo si hay que
 * volver a banear.
 */
export const desbanearUsuario = onCall(async (request) => {
  const adminUid = await exigirAdmin(request.auth);

  const uid = typeof request.data?.uid === 'string' ? request.data.uid.trim() : '';
  if (!uid) throw new HttpsError('invalid-argument', 'Falta el usuario.');

  await guardarBaneo(uid, false, null, null, adminUid);

  logger.info('Usuario desbaneado', { objetivo: uid, por: adminUid });

  return { ok: true, uid, activo: false };
});

/**
 * Levanta los baneos temporales que ya han vencido.
 *
 * Las reglas solo miran `activo` (no comparan fechas: Storage no
 * tiene `request.time` y no queremos dos lenguajes distintos para
 * lo mismo), así que alguien tiene que poner ese `activo` a false.
 * Va cada hora, como el cierre de encuestas: una hora de más en un
 * baneo temporal no cambia nada.
 *
 * Se consulta solo por `activo == true` y se filtra en memoria
 * para no depender de un índice compuesto.
 */
export const levantarBaneosVencidos = onSchedule('every 1 hours', async () => {
  try {
    const ahora = Timestamp.now();
    const snap = await db
      .collection(ACCOUNT_RESTRICTIONS)
      .where('activo', '==', true)
      .limit(500)
      .get();

    let levantados = 0;

    for (const d of snap.docs) {
      const datos = d.data();
      if (datos.tipo !== 'ban') continue;

      const fin = datos.fechaFin;
      if (!fin || typeof fin.toMillis !== 'function') continue;
      if (fin.toMillis() > ahora.toMillis()) continue;

      try {
        await guardarBaneo(d.id, false, null, null, 'sistema');
        levantados += 1;
      } catch (e) {
        logger.error('No se pudo levantar un baneo vencido', {
          uid: d.id,
          error: e,
        });
      }
    }

    if (levantados > 0) {
      logger.info('Baneos temporales levantados', { levantados });
    }
  } catch (e) {
    logger.error('No se pudieron revisar los baneos vencidos', { error: e });
  }
});

/**
 * Vuelca los baneos antiguos al registro duradero.
 *
 * Antes de existir `accountRestrictions`, un baneo solo vivía en
 * `users/{uid}.isBanned`. Ese documento lo puede borrar su dueño,
 * así que los baneos anteriores a este cambio seguirían siendo
 * fáciles de esquivar: bastaría con borrar el perfil y volver a
 * entrar. Esta callable recorre los perfiles con la bandera puesta
 * y crea el registro que falte.
 *
 * Es idempotente: si ya hay una restricción activa, no la toca. Se
 * llama una vez después de desplegar (desde el panel o con
 * `httpsCallable`); no hace falta programarla.
 */
export const sincronizarBaneos = onCall(
  { timeoutSeconds: 300 },
  async (request) => {
    await exigirAdmin(request.auth);

    const snap = await db.collection(USERS).where('isBanned', '==', true).get();

    let creados = 0;
    let existentes = 0;

    for (const usuario of snap.docs) {
      const ref = db.doc(`${ACCOUNT_RESTRICTIONS}/${usuario.id}`);
      const actual = await ref.get();
      const datosActuales = actual.data();

      if (datosActuales?.activo === true && datosActuales?.tipo === 'ban') {
        existentes += 1;
        continue;
      }

      await ref.set(
        {
          uid: usuario.id,
          tipo: 'ban',
          activo: true,
          motivo:
            typeof datosActuales?.motivo === 'string'
              ? datosActuales.motivo
              : 'Baneo anterior al registro duradero',
          fechaFin: datosActuales?.fechaFin ?? null,
          creadoEn: datosActuales?.creadoEn ?? FieldValue.serverTimestamp(),
          actualizadoEn: FieldValue.serverTimestamp(),
          actualizadoPor: 'migracion',
        },
        { merge: true },
      );
      creados += 1;
    }

    logger.info('Baneos antiguos sincronizados', {
      revisados: snap.size,
      creados,
      existentes,
    });

    return { revisados: snap.size, creados, existentes };
  },
);

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

  if (d.votosTierPopular !== undefined) {
    const umbral = Math.floor(num(d.votosTierPopular));
    if (umbral < 1 || umbral > 500) {
      throw new HttpsError('invalid-argument', 'El umbral de tier popular debe estar entre 1 y 500.');
    }
    siguiente.votosTierPopular = umbral;
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

// ======================================================
// COMUNIDAD: CLUBES, CANALES, CHATS, TIER LISTS
// ======================================================
//
// Estos triggers NO dan XP (no hay motivo en la configuración
// para crear un club o escribir en un chat): solo marcan el id
// en los mapas de `stats` mediante `marcarMapa`, que es lo que
// miran esas medallas.
//
// La legitimidad la dan las reglas, no el trigger: si el
// documento existe es que las reglas dejaron crearlo (solo el
// dueño crea el club, solo miembros escriben...). Y el mapa es
// idempotente por construcción, así que reintentos y
// re-ejecuciones no cuentan dos veces.

/** Crear un club: cuenta como creado y como unido (el dueño entra). */
export const onClubCreated = onDocumentCreated(
  `${CLUBS}/{clubId}`,
  async (event) => {
    try {
      const data = event.data?.data();
      if (!data) return;
      const ownerId = typeof data.ownerId === 'string' ? data.ownerId : '';
      if (!ownerId) return;
      const clubId = event.params['clubId'];
      await marcarMapa(ownerId, { clubesCreados: clubId, clubesUnidos: clubId });
    } catch (e) {
      logger.error('Fallo marcando club creado', { error: e });
    }
  },
);

/**
 * Entrar o salir de un club: solo suman los que ENTRAN.
 *
 * Se comparan los `memberIds` de antes y después, y se marca a
 * cada miembro nuevo. Salir no resta nada: la medalla no se
 * pierde por irse, igual que con los seguidores.
 */
export const onClubMembersChanged = onDocumentUpdated(
  `${CLUBS}/{clubId}`,
  async (event) => {
    try {
      const antes = event.data?.before?.data();
      const despues = event.data?.after?.data();
      if (!antes || !despues) return;
      const eran = new Set(
        (Array.isArray(antes.memberIds) ? antes.memberIds : []).filter(
          (m): m is string => typeof m === 'string',
        ),
      );
      const son = (Array.isArray(despues.memberIds) ? despues.memberIds : []).filter(
        (m): m is string => typeof m === 'string',
      );
      const clubId = event.params['clubId'];
      for (const uid of son) {
        if (eran.has(uid)) continue;
        try {
          await marcarMapa(uid, { clubesUnidos: clubId });
        } catch (e) {
          logger.error('Fallo marcando miembro de club', { clubId, uid, error: e });
        }
      }
    } catch (e) {
      logger.error('Fallo en cambio de miembros de club', { error: e });
    }
  },
);

/** Crear un canal en un club: cuenta para quien lo crea. */
export const onChannelCreated = onDocumentCreated(
  `${CLUBS}/{clubId}/${CHANNELS}/{channelId}`,
  async (event) => {
    try {
      const data = event.data?.data();
      if (!data) return;
      const creador = typeof data.createdBy === 'string' ? data.createdBy : '';
      if (!creador) return;
      await marcarMapa(creador, {
        canalesCreados: event.params['channelId'],
      });
    } catch (e) {
      logger.error('Fallo marcando canal creado', { error: e });
    }
  },
);

/** Escribir en un chat: la conversación cuenta para quien escribe. */
export const onChatParticipado = onDocumentCreated(
  `${CHATS}/{chatId}/messages/{messageId}`,
  async (event) => {
    try {
      const data = event.data?.data();
      if (!data) return;
      const senderId = typeof data.senderId === 'string' ? data.senderId : '';
      if (!senderId) return;
      await marcarMapa(senderId, { chatsPropios: event.params['chatId'] });
    } catch (e) {
      logger.error('Fallo marcando chat participado', { error: e });
    }
  },
);

/**
 * Sanciones de club: avisa a la persona sancionada.
 *
 * El aviso lo escribe la Function con el Admin SDK, igual que
 * el resto, porque las reglas no permiten crear notificaciones
 * desde el cliente (si lo hicieran, cualquiera podría avisar a
 * quien quisiera). El id lleva el documento de origen, así un
 * reintento del trigger no duplica el aviso.
 *
 * Solo avisa al sancionado, y solo del motivo y el tipo: no se
 * manda ningún dato de otros miembros ni se le da forma de tocar
 * la sanción desde la notificación.
 */
export const onClubSancionCreated = onDocumentCreated(
  `${CLUBS}/{clubId}/sanciones/{sancionId}`,
  async (event) => {
    try {
      const data = event.data?.data();
      if (!data) return;

      const objetivoUid = typeof data.objetivoUid === 'string' ? data.objetivoUid : '';
      const aplicadaPor = typeof data.aplicadaPor === 'string' ? data.aplicadaPor : '';
      const tipo = data.tipo === 'baneo' ? 'baneo' : 'silencio';
      const motivo = typeof data.motivo === 'string' ? data.motivo : '';
      if (!objetivoUid || !aplicadaPor) return;

      // Una retirada no es un castigo: es lo contrario. Se avisa
      // igualmente, pero con otro texto.
      const retirada = data.retirada === true;

      const clubId = event.params['clubId'];
      const clubSnap = await db.doc(`${CLUBS}/${clubId}`).get();
      const club = clubSnap.data();
      const clubName = typeof club?.name === 'string' ? club.name : 'un club';

      const actorSnap = await db.doc(`${USERS}/${aplicadaPor}`).get();
      const actor = actorSnap.data();

      await notificar({
        id: `sancion_${clubId}_${event.params['sancionId']}`,
        type: 'club_sanction',
        recipientId: objetivoUid,
        actorId: aplicadaPor,
        actorName: typeof actor?.displayName === 'string' ? actor.displayName : 'Moderación',
        actorAvatar: typeof actor?.avatarUrl === 'string' ? actor.avatarUrl : '',
        title: retirada
          ? `Sanción levantada en ${clubName}`
          : tipo === 'baneo'
            ? `Has sido baneado de ${clubName}`
            : `Has sido silenciado en ${clubName}`,
        snippet: motivo,
      });
    } catch (e) {
      logger.error('Fallo avisando de una sanción de club', { error: e });
    }
  },
);

/** Crear una tier list: cuenta para su autor. */
export const onTierListCreated = onDocumentCreated(
  `${TIERLISTS}/{tierListId}`,
  async (event) => {
    try {
      const data = event.data?.data();
      if (!data) return;
      const authorId = typeof data.authorId === 'string' ? data.authorId : '';
      if (!authorId) return;
      await marcarMapa(authorId, { tiersCreadas: event.params['tierListId'] });
    } catch (e) {
      logger.error('Fallo marcando tier list creada', { error: e });
    }
  },
);

/**
 * Votar en una tier list: si llega al umbral de votantes distintos,
 * la tier entra en `tiersPopularesIds` de su autor (medalla Rey del
 * Ranking).
 *
 * El umbral (`votosTierPopular`, 10 por defecto) lo pone el admin
 * en la configuración: es "participación legítima" con número, y
 * los votos son un documento por persona (ver `tierlists.ts`), así
 * que coordinarse para inflarlo deja rastro por votante.
 */
export const onTierListVoteChanged = onDocumentWritten(
  `${TIERLISTS}/{tierListId}/votes/{uid}`,
  async (event) => {
    try {
      const tierListId = event.params['tierListId'];
      const tierSnap = await db.doc(`${TIERLISTS}/${tierListId}`).get();
      if (!tierSnap.exists) return;
      const authorId = tierSnap.data()?.authorId;
      if (typeof authorId !== 'string' || !authorId) return;

      const config = await leerConfig();
      const umbral = Math.max(1, num(config.votosTierPopular ?? 10));

      const votos = await db
        .doc(`${TIERLISTS}/${tierListId}`)
        .collection('votes')
        .limit(umbral + 1)
        .get();

      // Votantes distintos: el id del documento es el uid.
      const distintos = new Set(votos.docs.map((d) => d.id)).size;
      if (distintos < umbral) return;

      await marcarMapa(authorId, { tiersPopularesIds: tierListId });
    } catch (e) {
      logger.error('Fallo evaluando popularidad de tier list', { error: e });
    }
  },
);

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
 * Los motivos del libro mayor que cuentan como "Me gusta recibido".
 *
 * Son cinco, porque un "Me gusta" y una reacción son dos caminos
 * distintos al mismo contador: el botón de corazón escribe en el
 * documento (y el trigger lo ve), y la reacción escribe su propio
 * documento en `reactions/`. Los dos acaban pagando a QUIEN HA
 * ESCRITO, no a quien ha pulsado.
 *
 * Los dos de reacción están juntos porque `procesarReaccion` usa un
 * solo motivo para comentarios y para mensajes de chat: el contador
 * es el mismo y separarlos no aportaría nada.
 */
const MOTIVOS_DE_LIKE = new Set([
  'thread_like_received',
  'comment_like_received',
  'thread_reaction_received',
  'comment_reaction_received',
]);

/**
 * Cuenta las entradas del libro mayor cuyo motivo está en el conjunto.
 *
 * ── POR QUÉ EL LIBRO MAYOR Y NO EL CONTENIDO ────────────────────────
 *
 * Porque `likesReceived` no se puede contar desde el contenido sin
 * dejar cosas fuera: los "Me gusta" sí están en `likedBy`, pero las
 * reacciones viven en `reactions/`, y las de los mensajes de chat
 * apuntan a `chats/{id}/messages/{id}`, que es una colección anidada
 * dentro de un chat concreto. Para contarlas harían falta los uids
 * de todos los chats de todas las personas, y en cada mensaje.
 *
 * El libro mayor ya lo tiene resuelto: una entrada por cada reaction
 * pagada, y se borra cuando la reacción se quita. Es exactamente el
 * mismo conjunto de hechos que el contador quiere, escrito una vez y
 * en el sitio donde ya vive.
 *
 * ── POR QUÉ SE CUENTA AL FINAL DEL RECÁLCULO ───────────────────────
 *
 * Porque antes de pagar lo que faltaba, el libro está incompleto: un
 * "Me gusta" antiguo que nadie ha vuelto a tocar no tiene entrada, y
 * el propio recálculo se la va a crear. Contar aquí dentro lo daría
 * por debajo. Se cuenta cuando el recorrido ya ha pagado todo.
 *
 * @param uid      Whose ledger to count.
 * @param motivos  Which reasons to count.
 * @returns how many entries of those reasons exist.
 */
async function contarMotivosDelLibro(
  uid: string,
  motivos: Set<string>,
): Promise<number> {
  const coleccion = db.doc(`${USERS}/${uid}`).collection(LEDGER);

  let total = 0;
  let ultimaPagina: FirebaseFirestore.QueryDocumentSnapshot | null = null;

  // Por páginas de 500, por lo mismo que la lectura de ids de arriba:
  // un usuario con mucho contenido puede tener miles de entradas, y
  // traerlas todas de una vez se pasa del límite de 1 MB.
  for (;;) {
    let consulta = coleccion.orderBy(FieldPath.documentId()).limit(500);
    if (ultimaPagina) consulta = consulta.startAfter(ultimaPagina);

    const page = await consulta.get();

    page.docs.forEach((d) => {
      const motivo = (d.data() as { reason?: unknown }).reason;

      if (typeof motivo === 'string' && motivos.has(motivo)) total += 1;
    });

    if (page.docs.length < 500) break;
    ultimaPagina = page.docs[page.docs.length - 1];
  }

  return total;
}
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
export const recalcularUsuario = onCall(
  // Recalcular recorre TODO el contenido de una persona (hilos,
  // comentarios, likes, seguidores, clubes, mensajes...), con
  // lecturas secuenciales. Con 60 s (el defecto) una cuenta
  // activa muere a mitad sin dejar rastro útil: el cliente ve
  // un error de plazo y los contadores quedan a medias. 5 min y
  // memoria de sobra para un botón que pulsa un admin de vez
  // en cuando.
  { timeoutSeconds: 300, memory: '512MiB' },
  async (request) => {
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

  // ── Fases aisladas con diagnóstico ───────────────────
  //
  // Cada fase corre en su propio try/catch y deja constancia
  // de si pasó o con qué mensaje falló. Si un documento raro
  // tumba una fase, las demás siguen y la respuesta dice CUÁL
  // falló, en vez de un INTERNAL mudo que no dice nada. Todo
  // lo que se escribe aquí es idempotente (libro mayor,
  // recuentos absolutos, merges por clave, medallas ya
  // filtradas), así que reintentarlo no duplica nada.
  const fases: Record<string, string> = {};
  const paso = async (nombre: string, fn: () => Promise<void>): Promise<void> => {
    try {
      await fn();
      fases[nombre] = 'ok';
      logger.info(`Recalculo: fase ${nombre} ok`, { objetivo: uid });
    } catch (e) {
      const mensaje = e instanceof Error ? e.message : String(e);
      fases[nombre] = mensaje.slice(0, 300);
      logger.error(`Recalculo: fase ${nombre} fallo`, { objetivo: uid, error: e });
    }
  };

  // Se recogen los ids del libro mayor de una vez, en vez de
  // comprobar documento a documento: son muchos, y asi se sabe de
  // antemano que ya estaba concedido.
  //
  // Va por paginas de 500 porque un usuario muy activo puede tener
  // miles de recompensas, y leerlas todas de una vez podria pasarse
  // del limite de 1 MB que tiene una lectura de Firestore.
  const concedidos = new Set<string>();
  const userRef = db.doc(`${USERS}/${uid}`);

  await paso('libro', async () => {
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
  });

  let concedidas = 0;
  let omitidas = 0;

  // ── El recuento, que es otra cosa ─────────────────────
  //
  // `concedidas` y `omitidas` cuentan lo que este recorrido ha
  // pagado. Esto cuenta otra cosa: cuantos hilos, comentarios y
  // comentarios en debates tiene la persona DE VERDAD, lean o no
  // lean lo que ya estaba pagado.
  //
  // La diferencia es justo el fallo que se arregla aquí. Los
  // contadores de `stats` se quedaban clavados en 1 porque al
  // concederse una recompensa se asignaba el incremento en vez de
  // sumarlo, y por eso reproducir el recorrido (que se salta lo ya
  // pagado) NO los arregla: los eventos que los subieron ya están
  // en el libro mayor, asi que aqui no volverian a pasar.
  //
  // Por eso se cuentan sin mirar el libro mayor. Se cuentan ANTES de
  // comprobar si la recompensa estaba pagada, porque el contenido
  // cuenta exista o no exista su premio.
  const recuento = { threadsCreated: 0, commentsCreated: 0, commentsInThreads: 0 };

  // Marcas de comunidad para el merge final (ver abajo): se van
  // juntando durante el recorrido y se escriben por clave, nunca
  // reemplazando mapas enteros.
  const marcasRecalculo: Record<string, true> = {};
  const marcarRecalculo = (campo: string, id: string) => {
    marcasRecalculo[`${campo}.${id}`] = true;
  };

  const anotar = (res: { aplicado: boolean }) => {
    if (res.aplicado) concedidas += 1;
    else omitidas += 1;
  };

  // ── Hilos ─────────────────────────────────────────────
  // Los documentos se guardan para la fase de encuestas, que
  // mira cuáles traían `poll` sin volver a leerlos.
  let hilosDocs: FirebaseFirestore.QueryDocumentSnapshot[] = [];
  await paso('hilos', async () => {
    const hilos = await db.collection(THREADS).where('authorId', '==', uid).get();
    hilosDocs = hilos.docs;
    for (const doc of hilos.docs) {
    // Antes de mirar el libro mayor: el hilo cuenta aunque su XP ya
    // estuviera pagado hace meses.
    recuento.threadsCreated += 1;

    // Tópicos oficiales de sus tags (medallas temáticas). Merge por
    // clave, como los mapas de comunidad: nunca reemplazo.
    const dHilo = doc.data() ?? {};
    for (const topico of topicosDe(dHilo.tags)) {
      marcasRecalculo[`stats.hilosPorTopico.${topico}.${doc.id}`] = true;
    }

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
  });

  // ── Comentarios ───────────────────────────────────────
  await paso('comentarios', async () => {
  const comentarios = await db
    .collection(COMMENTS)
    .where('authorId', '==', uid)
    .get();

  for (const doc of comentarios.docs) {
    const d = doc.data();

    // Igual que en los hilos: se cuenta antes de mirar si el XP ya
    // estaba pagado.
    recuento.commentsCreated += 1;
    if (d.targetType === 'thread') recuento.commentsInThreads += 1;

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
  });

  // ── "Me gusta" recibidos ─────────────────────────────
  //
  // Aqui hay que recorrer lo que ha publicado el usuario, porque el
  // XP de un "Me gusta" se lo lleva quien ha escrito, no quien ha
  // pulsado el corazon. Por eso se filtran las colecciones enteras
  // por "authorId" y no por "likedBy".
  await paso('likes', async () => {
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
  });

  // ── Seguidores ────────────────────────────────────────
  //
  // El XP de un follow se lo lleva QUIEN LO RECIBE, asi que hay que
  // recorrer `users/{uid}/followers` (quien le sigue), no lo que él
  // sigue.
  //
  // Y hay que pagar el MAXIMO como una sola entrada del libro mayor,
  // no un documento por seguidor: con un documento por persona, un
  // recalculo pagaria de mas a quien ya lo cobró en su momento, y
  // `followersReceived` (que es un maximo, no una suma) se
  // actualiza igualmente con `Math.max` dentro de `concederXP`.
  await paso('seguidores', async () => {
  const seguidores = await db.collection(USERS).doc(uid).collection(FOLLOWERS).get();
  const cuantos = seguidores.size;

  if (cuantos > 0) {
    const id = `followers_${cuantos}`;

    if (concedidos.has(id)) {
      omitidas += 1;
    } else {
      anotar(
        await concederConHitos(
          uid,
          id,
          {
            reason: 'follow_received',
            sourceId: null,
            actorId: null,
            nota: `Recalculado: ${cuantos} seguidores`,
            animeId: null,
          },
          { followersReceived: cuantos },
        ),
      );
    }
  }
  });

  // ── Recontar los contadores ─────────────────────────────
  //
  // Esta es la parte que arregla de verdad el fallo. El recorrido
  // anterior paga lo que falta, pero los contadores que se habían
  // quedado clavados no se arreglan reproduciéndolo: los hechos que
  // los dejaron en 1 ya están en el libro mayor, así que el recorrido
  // se los salta y nunca vuelven a pasar por la línea que los suma.
  //
  // Por eso aquí no se vuelve a conceder nada: se escribe el número
  // que sale de contar el contenido. Es un valor ABSOLUTO, no un
  // incremento, y por eso va directo al documento y no por
  // `concederXP`, que lo sumaría encima de lo que ya hubiera.
  //
  // Que se escriba siempre, y no solo cuando ha cambiado, es a
  // propósito: el botón de recalcular del panel tiene que servir
  // también para esto, y no solo para pagar lo que faltaba.
  // ── Recontar los contadores ─────────────────────────────
  //
  // Esta es la parte que arregla de verdad el fallo. El recorrido
  // anterior paga lo que falta, pero los contadores que se habían
  // quedado clavados no se arreglan reproduciéndolo: los hechos que
  // los dejaron en 1 ya están en el libro mayor, así que el recorrido
  // se los salta y nunca vuelven a pasar por la línea que los suma.
  //
  // Por eso aquí no se vuelve a conceder nada: se escribe el número
  // que sale de contar el contenido. Es un valor ABSOLUTO, no un
  // incremento, y por eso va directo al documento y no por
  // `concederXP`, que lo sumaría encima de lo que ya hubiera.
  //
  // Que se escriba siempre, y no solo cuando ha cambiado, es a
  // propósito: el botón de recalcular del panel tiene que servir
  // también para esto, y no solo para pagar lo que faltaba.
  //
  // ── UNA FASE POR FUENTE, NO UNA SOLA ───────────────────
  //
  // Antes todo esto era un único `paso('recuento')`. El problema:
  // si una sola fuente fallaba (un `collectionGroup` sin índice,
  // un documento con forma rara), la fase entera se marcaba como
  // fallida y no se sabía si los contadores se habían escrito o
  // no. Peor: en producción desplegada sin este aislamiento, ese
  // mismo fallo era un 500 mudo en el cliente.
  //
  // Ahora cada fuente tiene su fase: `recuento-contadores` escribe
  // los 4 números sí o sí; `recuento-clubes`, `recuento-canales`,
  // `recuento-mensajes`, `recuento-tiers` y `recuento-marcas`
  // solo AÑADEN claves. Si una falla, las demás siguen y `fases`
  // dice cuál fue.
  await paso('recuento-contadores', async () => {
    const likesReceived = await contarMotivosDelLibro(uid, MOTIVOS_DE_LIKE);

    // ── CON RUTAS DE CAMPO, Y NO CON EL MAPA ENTERO ─────────
    //
    // Esto parece un detalle y no lo es. Si se escribiera
    // `update({ stats: { ...recuento, likesReceived } })`, el resultado
    // dependeria de como interpreta la API los mapas anidados en un
    // `update`: si los MERGEA, se pierde lo de al lado; si los REEMPLAZA,
    // desaparecen `animeXp`, los cuatro contadores de trivia y
    // `followersReceived`, y el admin que pulsa "recalcular" le acaba de
    // borrar el progreso a un usuario sin que salga ningun aviso.
    //
    // Con rutas de campo no hay interpretacion que discutir: se
    // escriben esas cuatro hojas y punto. Lo demas se queda como estaba,
    // que es lo unico aceptable en un boton que el panel presenta como
    // "recalcular lo que ya tienes".
    await db.doc(`${USERS}/${uid}`).update({
      'stats.threadsCreated': recuento.threadsCreated,
      'stats.commentsCreated': recuento.commentsCreated,
      'stats.commentsInThreads': recuento.commentsInThreads,
      'stats.likesReceived': likesReceived,
    });

    logger.info('Contadores recalculados desde el contenido', {
      objetivo: uid,
      ...recuento,
      likesReceived,
    });
  });

  // ── Mapas de comunidad: MERGE, nunca reemplazo ───────
  //
  // A diferencia de los contadores de arriba, estos mapas son
  // "lo que alguna vez fue": si alguien salió de un club, el
  // recuento por `memberIds` ya no lo trae, pero la medalla no se
  // puede perder por irse. Por eso aquí se AÑADEN claves
  // (`stats.clubesUnidos.${id}: true`) y jamás se escribe el mapa
  // entero, que borraría lo que el contenido actual ya no dice.
  //
  // Los días activos no se recalculan: el pasado no se puede
  // reconstruir y el contador solo sube desde ahora. La
  // antigüedad no necesita nada: se calcula de `createdAt` al
  // evaluar, y el perfil se evalúa en cada concesión.

  await paso('recuento-clubes', async () => {
    // Clubes creados y clubes donde está.
    const clubesPropios = await db.collection(CLUBS).where('ownerId', '==', uid).get();
    for (const doc of clubesPropios.docs) {
      marcarRecalculo('stats.clubesCreados', doc.id);
      marcarRecalculo('stats.clubesUnidos', doc.id);
    }
    const clubesMiembro = await db
      .collection(CLUBS)
      .where('memberIds', 'array-contains', uid)
      .get();
    for (const doc of clubesMiembro.docs) {
      marcarRecalculo('stats.clubesUnidos', doc.id);
    }
  });

  await paso('recuento-canales', async () => {
    // Canales creados. Intento rápido por `collectionGroup` y, si el
    // índice COLLECTION_GROUP aún se está creando, repliegue por club
    // (ámbito COLLECTION, sin índice extra) para no dejar la fase en
    // rojo mientras Firestore lo construye.
    try {
      const canales = await db
        .collectionGroup(CHANNELS)
        .where('createdBy', '==', uid)
        .get();
      for (const doc of canales.docs) {
        marcarRecalculo('stats.canalesCreados', doc.id);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const codigo = (e as { code?: unknown })?.code;
      const esIndice = codigo === 9 || msg.includes('index') || msg.includes('FAILED_PRECONDITION');
      if (!esIndice) throw e;
      logger.warn('Indice COLLECTION_GROUP de canales aun no listo; repliegue por club', {
        objetivo: uid,
      });
      const vistos = new Set<string>();
      const propios = await db.collection(CLUBS).where('ownerId', '==', uid).get();
      for (const d of propios.docs) vistos.add(d.id);
      const miembro = await db.collection(CLUBS).where('memberIds', 'array-contains', uid).get();
      for (const d of miembro.docs) vistos.add(d.id);
      for (const clubId of vistos) {
        const cs = await db
          .collection(`${CLUBS}/${clubId}/${CHANNELS}`)
          .where('createdBy', '==', uid)
          .get();
        for (const doc of cs.docs) {
          marcarRecalculo('stats.canalesCreados', doc.id);
        }
      }
    }
  });

  await paso('recuento-mensajes', async () => {
    // Conversaciones donde ha escrito. Igual que arriba: primero el
    // `collectionGroup` (completo, hasta 1000 mensajes) y si el índice
    // aún se está creando, repliegue por chat con `limit(1)` por
    // conversación — basta para saber "estuvo aquí", que es lo que
    // alimenta `chatsPropios`.
    try {
      const mensajes = await db
        .collectionGroup('messages')
        .where('senderId', '==', uid)
        .limit(1000)
        .get();
      for (const doc of mensajes.docs) {
        const chatId = doc.ref.parent.parent?.id;
        if (chatId) marcarRecalculo('stats.chatsPropios', chatId);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const codigo = (e as { code?: unknown })?.code;
      const esIndice = codigo === 9 || msg.includes('index') || msg.includes('FAILED_PRECONDITION');
      if (!esIndice) throw e;
      logger.warn('Indice COLLECTION_GROUP de messages aun no listo; repliegue por chat', {
        objetivo: uid,
      });
      const chats = await db.collection(CHATS).where('memberIds', 'array-contains', uid).get();
      for (const chat of chats.docs) {
        const uno = await chat.ref
          .collection('messages')
          .where('senderId', '==', uid)
          .limit(1)
          .get();
        if (!uno.empty) marcarRecalculo('stats.chatsPropios', chat.id);
      }
    }
  });

  await paso('recuento-tiers', async () => {
    // Tier lists creadas, y las que llegaron a populares (mismo
    // umbral que el trigger: votantes distintos en `votes`).
    const umbralRecalculo = Math.max(
      1,
      num((await leerConfig()).votosTierPopular ?? 10),
    );
    const tiers = await db.collection(TIERLISTS).where('authorId', '==', uid).get();
    for (const doc of tiers.docs) {
      marcarRecalculo('stats.tiersCreadas', doc.id);
      const votos = await doc.ref.collection('votes').limit(umbralRecalculo + 1).get();
      if (new Set(votos.docs.map((v) => v.id)).size >= umbralRecalculo) {
        marcarRecalculo('stats.tiersPopularesIds', doc.id);
      }
    }
  });

  await paso('recuento-marcas', async () => {
    // Hilos creados CON encuesta (el bucle de hilos de arriba no la
    // miraba: aquí solo se marcan, el XP ya está pagado o contado).
    for (const doc of hilosDocs) {
      const poll = doc.data()?.poll;
      if (poll && typeof poll === 'object') {
        marcarRecalculo('stats.encuestasCreadas', doc.id);
      }
    }

    if (Object.keys(marcasRecalculo).length > 0) {
      await db.doc(`${USERS}/${uid}`).update(marcasRecalculo);
    }
  });

  // ── Concesión final de medallas ──────────────────────
  //
  // ESTO es lo que faltaba y por lo que recalcular no daba
  // medallas: el recorrido de arriba solo evalúa medallas al
  // PAGAR algo nuevo (`concederXP`), y el recuento solo
  // escribe números. Quien ya lo tenía todo pagado (o pagado
  // con contadores clavados) se quedaba con los números
  // corregidos pero sin las medallas que esos números dan.
  //
  // Se lee el documento recién escrito y se evalúa todo el
  // catálogo una vez. `medallasNuevas` ya filtra las que
  // estaban: solo entran las que faltan, con su fecha, y se
  // avisa una sola vez. Idempotente por construcción: repetir
  // el recálculo no duplica nada.
  //
  // Va en su propia fase por el mismo motivo que el resto: si
  // el documento trae una forma heredada que rompe un helper
  // (`stats` con un array donde se espera un mapa, `medals`
  // con null...), el 500 mudo se convierte en
  // `fases.medallas = "<mensaje>"` y el cliente lo ve.
  let medallasPorRecuento = 0;
  await paso('medallas', async () => {
    const frescoSnap = await db.doc(`${USERS}/${uid}`).get();
    if (!frescoSnap.exists) return;
    const fd = frescoSnap.data() ?? {};
    const fx = num(fd.xp);
    const fnivel = nivelDesdeXp(fx, {
      base: config.base,
      exponente: config.exponente,
      nivelesMaximos: config.nivelesMaximos,
    });
    const fest = leerEstadisticas(fd);
    const fya =
      fd.medals && typeof fd.medals === 'object'
        ? (fd.medals as Record<string, unknown>)
        : {};
    const noVacioFinal = (v: unknown): boolean =>
      typeof v === 'string' && v.trim().length > 0;
    const faltantes = medallasNuevas(fest, fnivel.level, fya, config.animeMedallas, fx, {
      antiguedadDias: diasDesde(fd.createdAt, Date.now()),
      perfilCompleto:
        noVacioFinal(fd.displayName) && noVacioFinal(fd.bio) && noVacioFinal(fd.avatarUrl),
      perfilCustom: tieneCustom(fd),
    });

    if (faltantes.length > 0) {
      const medals = { ...fya };
      faltantes.forEach((id) => {
        medals[id] = ahoraIso();
      });
      await db.doc(`${USERS}/${uid}`).update({ medals });
      medallasPorRecuento = faltantes.length;

      logger.info('Medallas concedidas por recuento', {
        objetivo: uid,
        medallas: faltantes,
      });

      try {
        const mejor = faltantes[0];
        const nombre = NOMBRES_DE_MEDALLA[mejor] ?? mejor;
        await notificar({
          id: `achievement_${uid}_${mejor}`,
          type: 'achievement',
          recipientId: uid,
          actorId: uid,
          actorName: '',
          actorAvatar: '',
          medalId: mejor,
          medalName: nombre,
          title: `Has desbloqueado la medalla "${nombre}"`,
        });
      } catch (e) {
        logger.error('Fallo notificando medalla de recuento', { objetivo: uid, error: e });
      }
    } else {
      logger.info('Sin medallas pendientes tras el recuento', { objetivo: uid });
    }
  });

  logger.info('Recalculo terminado', {
    objetivo: uid,
    concedidas,
    omitidas,
    medallasPorRecuento,
    fases,
  });

  return { concedidas, omitidas, medallasPorRecuento, fases };
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

      // ── 6. Notificación de trivia ──────────────────────
      try {
        await notificar({
          id: `trivia_${fecha}_${uid}`,
          type: 'trivia',
          recipientId: uid,
          actorId: uid,
          actorName: '',
          actorAvatar: '',
          triviaCorrect: correct,
          triviaTotal: total,
          title: `Trivia completada: ${correct} de ${total}`,
        });
      } catch (e) {
        logger.error('Fallo notificando trivia', { uid, fecha, error: e });
      }

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

  // ── Escribir las respuestas correctas ──────────────────
  //
  // Este es el ÚNICO sitio del proyecto donde se pueden
  // escribir, y hace falta: el bloque `answers/` no tiene
  // ninguna rama de escritura para el cliente (a propósito,
  // para que la trivia no sea falseable desde el navegador),
  // y antes de esta acción tampoco había forma de
  // prepararlas. La función que corrige los resultados
  // (`onTriviaResultCreated`) lee justo de aquí, así que sin
  // esto una trivia recién creada se queda sin corregir.
  //
  // No se puede leer, ni siquiera desde aquí: quien la prepara
  // tiene que fiarse de lo que escribió, igual que en el papel.
  if (accion === 'respuestas') {
    const respuestas = request.data?.respuestas;

    if (!respuestas || typeof respuestas !== 'object' || Array.isArray(respuestas)) {
      throw new HttpsError('invalid-argument', 'No se han enviado las respuestas.');
    }

    // Si ya se ha jugado, no se toca la respuesta buena.
    //
    // Es la misma garantía que dan las reglas para los
    // resultados, aplicada al revés: mientras nadie haya
    // jugado se puede corregir sin perder nada, y en cuanto hay
    // una nota repartida cambiarla dejaría los resultados
    // antiguos descuadrados.
    const jugadas = await db
      .collection(TRIVIA_RESULTS)
      .where('date', '==', fecha)
      .limit(1)
      .get();

    if (!jugadas.empty) {
      throw new HttpsError(
        'failed-precondition',
        'Ya alguien ha jugado esta trivia. Cambiar ahora la respuesta correcta ' +
          'dejaría descuadradas las notas que ya se han repartido.',
      );
    }

    let guardadas = 0;

    for (const [qid, valor] of Object.entries(respuestas as Record<string, unknown>)) {
      if (!/^q[0-9]+$/.test(qid)) continue;

      const v = (valor ?? {}) as { correctIndex?: unknown; explanation?: unknown };
      const idx = typeof v.correctIndex === 'number' ? Math.round(v.correctIndex) : 0;
      if (idx < 0) continue;

      const explicacion = typeof v.explanation === 'string' ? v.explanation.trim() : '';

      await ref
        .collection('answers')
        .doc(qid)
        .set({ correctIndex: idx, explanation: explicacion }, { merge: true });

      guardadas++;
    }

    if (guardadas === 0) {
      throw new HttpsError('invalid-argument', 'No había respuestas válidas que guardar.');
    }

    logger.info('Respuestas correctas guardadas por el equipo', { fecha, guardadas, admin: true });

    return { borrados: 0, guardadas };
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
// NOTICIAS RSS: TRAERLAS Y GUARDARLAS
// ======================================================
//
// Lee los feeds declarados en `./rss` y deja el resultado en la
// coleccion `news`. Lo que hace falta para limpiar un item -quitar el
// HTML, cortar el resumen, decidir el id- vive en `rss.ts`, que no
// depende de nada y se puede probar sin red.
//
// El navegador no pide ningun feed: lee de Firestore y ya. Eso quita
// el problema de CORS y hace que nadie en la web tenga que saber de
// donde salen las noticias.

import {
  FUENTES_RSS,
  LOTE,
  MAX_NOTICIAS_GUARDADAS,
  idDeNoticia,
  leerFeed,
} from './rss';
import type { Noticia } from './rss';


const NEWS = 'news';

/**
 * Lo que devuelve una sincronización, para poder contarlo.
 *
 * `guardadas` y `leidas` casi nunca son lo mismo, y la diferencia es
 * justamente lo que hay que mirar cuando se pulsa el botón a mano: si
 * `leidas` son 137 y `guardadas` son 0, es que ya estaban todas, que es
 * lo normal la segunda vez. Si `guardadas` son 0 y `leidas` también, el
 * feed devolvió nada y hay que mirar `fallidas`.
 */
interface ResultadoSincronizacion {
  /** Cuántos items han salido de los feeds en total. */
  leidas: number;
  /** Cuántos documentos se han escrito de verdad. */
  guardadas: number;
  /** Un texto por cada fuente que no se pudo leer. */
  fallidas: string[];
  /** Cuántas noticias viejas se han borrado. */
  podadas: number;
}

/**
 * Borra las noticias más antiguas que sobren.
 *
 * ── POR QUÉ CUENTA ANTES DE BORRAR ─────────────────────────────────
 *
 * Porque la versión anterior pedía los 400 más antiguas y los borraba
 * sin más. Con 137 noticias guardadas, que es lo que trae un feed
 * entero, eso no borraba nada nunca: la cuenta salía de "hay al menos
 * 120" y 137 lo cumple, pero la colección se queda como estaba para
 * siempre. Y en cuanto un día hubiera más de 400, se habrían borrado
 * 400 de golpe, incluyendo las que no sobraban.
 *
 * Ahora se cuenta cuántas hay, se resta el tope, y se borra solo ese
 * número. Con 137 y un tope de 120, se borran 17. Con 90, no se borra
 * ninguna, que es lo que tiene que pasar la primera vez.
 *
 * El borrado va en lotes porque Firestore no borra más de 500
 * documentos por llamada.
 *
 * @returns {Promise<number>} cuántas se han borrado
 */
async function podar(): Promise<number> {
  const total = await db.collection(NEWS).count().get();

  const sobran = total.data().count - MAX_NOTICIAS_GUARDADAS;

  if (sobran <= 0) return 0;

  const viejas = await db
    .collection(NEWS)
    .orderBy('pubDate', 'asc')
    .limit(sobran)
    .get();

  const lote = db.batch();
  let borradas = 0;

  for (const doc of viejas.docs) {
    lote.delete(doc.ref);
    borradas++;
  }

  await lote.commit();

  return borradas;
}

/**
 * Lee los feeds y guarda lo que salga.
 *
 * Vive suelto, y no dentro de `onSchedule`, porque la usan dos cosas: el
 * planificador y el botón de sincronizar a mano. Si estuviera dentro del
 * `onSchedule` no se podría llamar desde ningún otro sitio, y para
 * forzar una sincronización habría que esperar a la próxima hora.
 *
 * ── IDEMPOTENTE ────────────────────────────────────────────────────
 *
 * Se puede ejecutar las veces que haga falta sin que duplique nada,
 * porque el id sale del enlace: el mismo enlace da siempre el mismo
 * documento. Antes de escribir se lee cuáles de esos ya existen y solo
 * se escriben los que faltan, así que ni se duplica ni se pisa un
 * titular que ya estaba.
 *
 * Sigue escribiendo con `create` y no con `set`: si el documento ya
 * existe la escritura falla y no se toca nada. Es una segunda barrera,
 * por si el filtro de arriba se quedara corto, y hace que un titular
 * existente no se pueda sobrescribir por accidente.
 *
 * ── LO QUE PASÓ ANTES ──────────────────────────────────────────────
 *
 * Se escribía el lote entero a pelo, sin mirar qué había ya. Un
 * `create` falla si el documento existe y el commit de un lote es
 * atómico, así que en cuanto el feed traía un solo enlace repetido, y
 * siempre trae, el lote entero no se guardaba. La sincronización
 * escribía la primera vez y luego se quedaba sin hacer nada para
 * siempre, con el widget congelado en las noticias de aquel día.
 *
 *
 * @param {'programada' | 'manual'} origen quién la ha llamado
 * @returns {Promise<ResultadoSincronizacion>}
 */
async function sincronizar(
  origen: 'programada' | 'manual',
): Promise<ResultadoSincronizacion> {
  logger.info('Sincronizando noticias RSS', { origen, fuentes: FUENTES_RSS.length });

  let leidas = 0;
  let guardadas = 0;
  const fallidas: string[] = [];

  for (const fuente of FUENTES_RSS) {
    let noticias: Noticia[];

    try {
      noticias = await leerFeed(fuente);
    } catch (e) {
      // Una fuente que falla NO debe parar las demás. Si un día se cae
      // el feed de una, el widget se queda con lo que había en vez de
      // vaciarse entero.
      const motivo = e instanceof Error ? e.message : 'error desconocido';

      logger.error(`No se pudo leer ${fuente.nombre}`, motivo);
      fallidas.push(`${fuente.nombre}: ${motivo}`);

      continue;
    }

    logger.info(`${fuente.nombre}: ${noticias.length} items`);

    // Por lotes, porque escribir documento a documento un feed de 137
    // items son 137 viajes de ida y vuelta a Firestore. Con lotes de
    // 400 caben todos en uno, o en un par.
    //
    // ── POR QUÉ HAY QUE FILTRAR LO QUE YA ESTÁ ANTES DE ESCRIBIR ──
    //
    // Un `create` falla si el documento ya existe, y el commit de un
    // lote es atómico: si UN item del lote está repetido, el lote
    // entero no se guarda. Y un feed trae siempre casi todo lo que se
    // guardó la vez anterior.
    //
    // Eso significa que el lote falla SIEMPRE a partir de la segunda
    // pasada, y que por lo tanto no se guarda ni una sola noticia
    // nueva. No es que se pierdan algunas: es que en cuanto se ejecuta
    // dos veces, el widget se queda congelado con lo que había.
    //
    // Lo que había antes era exactamente eso: `create` a pelo y, si el
    // lote fallaba, contar cero y decir "ya se guardará en la
    // siguiente". No se guardaba nunca, porque el enlace seguía en el
    // feed y volvía a hacer fallar el lote.
    //
    // El arreglo es quitar del lote lo que ya está, y eso es una
    // lectura: un `getAll` con los ids del trozo, en una sola llamada,
    // y un Set con los que existen. Lo que no esté en el Set se
    // escribe, y como ya no puede haber repetidos, el `create` ya no
    // puede fallar por eso.
    for (let i = 0; i < noticias.length; i += LOTE) {
      const trozo = noticias.slice(i, i + LOTE);
      const ids = trozo.map((n) => idDeNoticia(fuente.nombre, n.enlace));

      // Una lectura para el trozo entero. `getAll` no trae los que no
      // existen, pero se filtra por `exists` igual: si otra versión del
      // SDK los devolviera todos con `exists` en falso, el filtro lo
      // salvaría y no dependería de ese detalle.
      const yaGuardadas = new Set(
        (await db.getAll(...ids.map((id) => db.collection(NEWS).doc(id))))
          .filter((d) => d.exists)
          .map((d) => d.id),
      );

      const nuevas = trozo.filter((_, k) => !yaGuardadas.has(ids[k]));

      if (nuevas.length === 0) continue;

      const lote = db.batch();

      for (const noticia of nuevas) {
        lote.create(db.collection(NEWS).doc(idDeNoticia(fuente.nombre, noticia.enlace)), {
          title: noticia.titulo,
          snippet: noticia.resumen,
          link: noticia.enlace,
          sourceName: noticia.fuente,
          pubDate: noticia.fecha,
          createdAt: FieldValue.serverTimestamp(),
        });
      }

      try {
        await lote.commit();

        guardadas += nuevas.length;
      } catch (e) {
        // Con el filtro de arriba no debería llegar nada repetido al
        // lote, así que un fallo aquí es otra cosa: cuota, una regla, o
        // la red. Se cuenta el lote como fallido y se sigue con el
        // siguiente, que como mucho son unos minutos de retraso.
        logger.warn(
          `Lote de ${nuevas.length} items no guardado`,
          e instanceof Error ? e.message : e,
        );
      }
    }

    leidas += noticias.length;
  }

  let podadas = 0;

  try {
    podadas = await podar();
  } catch (e) {
    // Podar es limpieza, no sincronización. Si falla, las noticias
    // nuevas están guardadas igualmente y solo se queda la lista un
    // poco más larga de lo normal.
    logger.error('No se pudieron podar las noticias antiguas', e);
  }

  const resultado: ResultadoSincronizacion = { leidas, guardadas, fallidas, podadas };

  logger.info('Noticias sincronizadas', { origen, ...resultado });

  return resultado;
}

/**
 * Sincroniza las noticias cada dos horas.
 *
 * Dos horas es de sobra: el feed más activo del mundo publica unas
 * cinco o seis noticias al día. Ponerlo cada hora solo gastaría cuota
 * para ir a por lo mismo.
 *
 * ── POR QUÉ NO CORRE AL DESPLEGARLA ─────────────────────────────────
 *
 * Porque una función programada no se ejecuta al desplegarla: espera a
 * su próxima hora de turno, que con `every 2 hours` son las 00, 02,
 * 04... UTC. Una función recién subida puede pasarse casi dos horas
 * sin haber hecho nada, y quien la acaba de subir se queda sin saber si
 * funciona.
 *
 * Por eso está `sincronizarNoticias` debajo, que hace exactamente lo
 * mismo pero a petición.
 */
export const syncRssNews = onSchedule('every 2 hours', async () => {
  await sincronizar('programada');
});

/**
 * Sincroniza las noticias ahora mismo, a petición.
 *
 * ── PARA QUÉ ESTÁ ──────────────────────────────────────────────────
 *
 * Para las dos veces que hace falta:
 *
 *   1. Después de añadir una fuente nueva, para no esperar dos horas a
 *      ver si el feed ese tiene la forma que creemos.
 *   2. Cuando algo va mal y hay que ver el error ahora, en lugar de
 *      esperar al siguiente turno.
 *
 * Es de las pocas cosas del proyecto que el admin puede pedir desde el
 * navegador. No es una puerta trasera: lo único que hace es ir a buscar
 * noticias a las mismas direcciones públicas de siempre y guardarlas.
219|  * Lo que no puede es escribir en la colección news desde el cliente, y eso
220|  * lo sigue estando en las reglas de Firestore, no por la confianza en
221|  * quien llama. Este botón solo va a buscar noticias a las direcciones
222|  * públicas de siempre.
 *
 * Pide lo mismo que el resto de funciones de panel (`ajustarXp`,
 * `gestionarTriviaDaria`), que admiten admin y moderacion.
 */
export const sincronizarNoticias = onCall(async (request) => {
  const uid = await exigirAdmin(request.auth);

  const resultado = await sincronizar('manual');

  logger.info('Noticias sincronizadas a mano', { por: uid.slice(0, 8), ...resultado });

  return resultado;
});