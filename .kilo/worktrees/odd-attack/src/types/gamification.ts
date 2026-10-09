// ======================================================
// GAMIFICACIÓN: XP, NIVELES, MEDALLAS Y TÍTULOS
// ======================================================
//
// Estos tipos son el contrato entre el cliente y las Cloud
// Functions que escriben el progreso. El cliente NUNCA escribe
// xp, level ni stats: los lee. Las reglas de Firestore lo
// prohíben y las funciones son las únicas que pueden tocar
// esos campos (ver `firestore.rules` y `functions/src/index.ts`).

/** Rareza de una medalla. El orden va de menos a más. */
export type MedalRarity = 'comun' | 'rara' | 'epica' | 'legendaria';

/**
 * Motivo por el que se concede XP.
 *
 * Son cadenas literales y no una enumeración suelta porque
 * acaban guardadas en el libro mayor (`rewardLedger`) de cada
 * usuario, y esos documentos son históricos: cambiar el nombre
 * de uno dejaría sin reconocer pruebas antiguas ya dadas.
 * Añadir uno nuevo es seguro; renombrar uno, no.
 */
export type XpReason =
  | 'thread_created'
  | 'comment_created'
  | 'thread_like_received'
  | 'comment_like_received'
  | 'thread_reaction_received'
  | 'comment_reaction_received'
  | 'poll_vote_cast'
  | 'trivia_completed'
  | 'trivia_correct'
  | 'trivia_perfect'
  | 'trivia_streak'
  | 'level_milestone'
  | 'admin_adjustment'
  | 'admin_grant';

/**
 * Las acciones que dan XP y las que dan **
 * su valor. Lo lee la Cloud Function, no el cliente, y por
 * eso vive en Firestore: para cambiarlo no hace falta
 * desplegar código.
 *
 * Tipos de "acción" de la gamificación:
 * - `thread_created`         → crear un hilo            (+20)
 * - `comment_created`        → publicar un comentario    (+5)
 * - `thread_like_received`   → "Me gusta" en tu hilo     (+3)
 * - `comment_like_received`  → "Me gusta" en tu comentario(+2)
 * - `thread_reaction_received`  → reacción en tu hilo     (+2)
 * - `comment_reaction_received` → reacción en un comentario (+1)
 * - `poll_vote_cast`         → votar en una encuesta     (+2)
 * - `trivia_completed`       → completar la trivia       (+10)
 * - `trivia_correct`          → acertar una pregunta      (+5)
 * - `trivia_perfect`          → las tres correctas        (+15)
 * - `trivia_streak`           → cruzar un hito de racha   (+20)
 *
 * Lo de la trivia lo concede la Cloud Function cuando corrige
 * las respuestas: el cliente no sabe cuántas ha acertado (la
 * respuesta correcta no la ve), así que no puede calcular su
 * propio XP. Y el libro mayor tiene un documento por trivia y
 * persona, así que jugar dos veces el mismo día no paga dos
 * veces.
 *
 * Lo de las reacciones y las encuestas es opcional: si el
 * administrador pone el valor a 0, no se concede nada. Cambiar
 * de una reacción a otra NO vuelve a pagar, porque el libro
 * mayor identifica la reacción por contenido y persona, no por
 * tipo (ver `functions/src/index.ts`).
 *
 * Las que no dependen de una interacción concreta
 * (`level_milestone`, `admin_adjustment`) NO se guardan en la
 * configuración: su valor lo decide el código de las funciones
 * o el administrador, para que no se puedan retocar desde la
 * consola por accidente.
 */
export interface XpConfig {
  [reason: string]: number;
}

/**
 * Parámetros de la curva de niveles.
 *
 * La curva es del tipo `xpParaNivel(n) = base * n^exponente`.
 * Con `base=100` y `exponente=1.5`, llegar al nivel 25 cuesta
 * unos 12.500 XP y al 60 unos 46.400: cada nivel encarece más
 * que el anterior sin llegar nunca a ser imposible.
 *
 * `nivelesMaximos` es el tope. El usuario llega hasta ahí y se
 * queda; pasar de ahí no da nada, y por eso el catálogo tiene
 * "Geek de Geeks" como última medalla.
 */
export interface LevelCurveConfig {
  base: number;
  exponente: number;
  nivelesMaximos: number;
}

/** Curva y recompensas, en el único documento que las lee todo. */
export interface GamificationConfig extends LevelCurveConfig {
  xp: XpConfig;
  /** Recompensa por cada hito de nivel (hitos = 5, 10, 25, 50...). */
  xpPorHito: number;
  /**
   * Ids reales de los animes de las medallas temáticas.
   *
   * El catálogo de código escribe marcadores (`CONFIGURAR_FRIEREN`)
   * porque los ids los genera Firestore y no se conocen al
   * escribir el código. El panel los sustituye por los de verdad,
   * y son las funciones los que los usan para comprobar el
   * requisito.
   */
  animeMedallas: Record<string, string>;
  /**
   * `true` mientras el catálogo de funciones no esté desplegado.
   *
   * El panel de admin lo pone a `true` a mano después de
   * desplegar. Mientras esté en `false` NO se escribe nada de
   * la gamificación, para que un despliegue a medias no llene
   * los perfiles de XP y medallas que luego habría que
   * recalcular a mano.
   */
  activo: boolean;
  /** Marca de versión del catálogo, para saber si hay que recalcular. */
  version: number;
}

/** Configuración tal y como viene de Firestore, con los huecos rellenos. */
export const CONFIG_POR_DEFECTO: GamificationConfig = {
  base: 100,
  exponente: 1.5,
  nivelesMaximos: 60,
  xpPorHito: 100,
  animeMedallas: {},
  activo: false,
  version: 1,
  xp: {
    thread_created: 20,
    comment_created: 5,
    thread_like_received: 3,
    comment_like_received: 2,
    thread_reaction_received: 2,
    comment_reaction_received: 1,
    poll_vote_cast: 2,
    trivia_completed: 10,
    trivia_correct: 5,
    trivia_perfect: 15,
    trivia_streak: 20,
  },
};

/**
 * Una condicion de desbloqueo de medalla.
 *
 * Solo se admiten estas cuatro porque son las que las funciones
 * pueden comprobar sin leer medio Firestore. Cada condición se
 * guarda con su clave explícita (`tipo`) en vez de deducirla de
 * los campos: así el formato en Firestore es explícito y se
 * puede ampliar sin tener que adivinar qué se quiso decir.
 *
 * - `hilos`       → número de hilos creados (`stats.threadsCreated`)
 * - `comentarios` → número de comentarios (`stats.commentsCreated`)
 * - `debates`     → comentarios publicados DENTRO de hilos
 *                   (`stats.commentsInThreads`). Los hilos son la
 *                   conversación de la comunidad, así que esto es
 *                   "haber participado en debates", que es lo que
 *                   distingue "Debatiente Pro" (muchos
 *                   comentarios en cualquier sitio) de "Crítico
 *                   de Temporada" (que participa en los debates).
 * - `likes`       → "Me gusta" recibidos en total
 * - `nivel`       → nivel alcanzado
 * - `xpEnAnime`   → XP acumulado en un anime concreto
 *                   (`stats.animeXp[animeId]`). Es la base de las
 *                  medallas temáticas: en vez de mirar títulos
 *                  (que cambian según cómo se escriba el
 *                  nombre), se mira en qué anime se ha acumulado
 *                  la actividad.
 */
export type MedalRequirement =
  | { tipo: 'hilos'; valor: number }
  | { tipo: 'comentarios'; valor: number }
  | { tipo: 'debates'; valor: number }
  | { tipo: 'likes'; valor: number }
  | { tipo: 'nivel'; valor: number }
  | { tipo: 'xpEnAnime'; animeId: string; valor: number }
  // ── Trivia diaria ──────────────────────────────────────
  //
  // Las cuatro leen de `stats.trivia*`, que solo escriben las
  // Cloud Functions corrigiendo el resultado. El cliente las lee
  // para pintar la barra de progreso de la galería, y no puede
  // tocarlas (las reglas bloquean `stats`).
  | { tipo: 'trivias'; valor: number }
  | { tipo: 'aciertosTrivia'; valor: number }
  | { tipo: 'triviasPerfectas'; valor: number }
  | { tipo: 'rachaTrivia'; valor: number };

/**
 * Una medalla del catálogo.
 *
 * El catálogo vive en el código (y su copia en las funciones)
 * y no en Firestore, a propósito: así el cliente puede pintar
 * todas las medallas, bloqueadas y desbloqueadas, sin
 * descargar un documento extra, y las funciones pueden
 * comprobar las condiciones sin ninguna lectura.
 *
 * Las condiciones se cambian desplegando código, que es la
 * forma que de verdad se puede revisar en un pull request.
 */
export interface Medal {
  id: string;
  nombre: string;
  descripcion: string;
  rareza: MedalRarity;
  /**
   * Emoji que hace de icono. Se usa texto y no un fichero de
   * imagen porque es lo único que se pinta igual en un módulo
   * de React, en las funciones y en el futuro en las
   * notificaciones push, sin subir nada.
   */
  icono: string;
  /**
   * Requisito para desbloquearla. `null` significa que NO se
   * concede sola: hay que darla a mano (es el caso de
   * "Miembro Fundador", que depende de criterios históricos
   * que solo conoce el administrador).
   */
  requisito: MedalRequirement | null;
  /** Si es `true`, el título que se puede equipar al desbloquearla. */
  titulo?: string;
}

/**
 * Cómo va un usuario.
 *
 * Va DENTRO del documento de `users/{uid}`, y no en una
 * colección aparte, por dos razones: siempre se lee junto al
 * perfil (no hace falta una suscripción extra) y el usuario no
 * puede tener dos sitios de la verdad.
 *
 * Todos los campos son opcionales porque las cuentas que ya
 * existen no los tienen: se leen como cero o como lista vacía,
 * que es exactamente lo que deben mostrar.
 */
export interface UserProgress {
  /** XP total acumulado. Nunca baja por actividad normal. */
  xp: number;
  /** Nivel actual. Lo calcula y escribe la función. */
  level: number;
  /** XP ya gastado en subir hasta `level`. */
  xpEnNivel: number;
  /** XP que cuesta el siguiente nivel. 0 en el nivel máximo. */
  xpParaSiguienteNivel: number;
  /** Medallas desbloqueadas: id → fecha ISO. */
  medals: Record<string, string>;
  /** Título equipado. `null` o ausente = ninguno. */
  equippedTitle: string | null;
  /** Estadísticas que alimentan los requisitos de las medallas. */
  stats: {
    threadsCreated: number;
    commentsCreated: number;
    likesReceived: number;
    /** XP por anime: `animeId` → XP. Base de las medallas temáticas. */
    animeXp: Record<string, number>;
    /**
     * Contadores de la trivia diaria.
     *
     * Van DENTRO de `stats` y no sueltos para no inventar un
     * segundo sitio donde mirar el progreso: el perfil ya trae
     * `stats`, y las mismas funciones que conceden las medallas los
     * actualizan.
     */
    triviaCompleted: number;
    triviaCorrect: number;
    triviaPerfect: number;
    /** La mejor racha que ha conseguido. */
    triviaStreakBest: number;
  };
}

/** Un usuario tal y como viene de Firestore: perfil + progreso. */
export type GamifiedUser = UserProgress & {
  /** Rango legible del nivel ("Novato", "Veterano"...). */
  rank: string;
  /** El título equipado, si su medalla está desbloqueada. */
  title: Medal | null;
  /** Medallas desbloqueadas, ya resueltas a objetos `Medal`. */
  unlockedMedals: Medal[];
  /** Todas las del catálogo, con su estado. */
  catalog: MedalStatus[];
};

/** Una medalla del catálogo junto con si este usuario la tiene. */
export interface MedalStatus {
  medal: Medal;
  desbloqueada: boolean;
  /** Fecha ISO de desbloqueo. Solo si `desbloqueada`. */
  fecha: string | null;
  /**
   * Progreso hacia el requisito, de 0 a 1.
   *
   * Se calcula en el cliente solo con fines de la barra. Las
   * funciones son las que deciden de verdad, porque son las
   * que tienen los contadores al día.
   */
  progreso: number;
  /** Cuánto falta para conseguirla. Texto ya formateado. */
  falta: string;
}

/**
 * Un movimiento del libro mayor.
 *
 * El libro mayor (`users/{uid}/rewardLedger/{id}`) es lo que
 * impide dar el mismo XP dos veces: cada "Me gusta" genera un
 * documento con un id derivado del contenido y de quién lo
 * pulsa, y la escritura se hace en transacción. Si el documento
 * ya existe, no se concede nada. Y si el "Me gusta" se quita,
 * se borra el documento y se resta el XP.
 *
 * No se pinta en el perfil porque ahí estorba: es una lista
 * larga de números. Lo consulta el panel de administración, y
 * solo el admin puede leerlo (ver `firestore.rules`).
 */
export interface XpMovement {
  /** Por qué se concedió. */
  reason: XpReason;
  /** Cuánto XP. Negativo si se retiró. */
  amount: number;
  /** Qué lo provocó: id de hilo, comentario, anime o usuario. */
  sourceId: string | null;
  /** Con qué usuario se relacionó, si aplica (quien dio el like). */
  actorId: string | null;
  /** Fecha ISO. */
  at: string;
  /**
   * Texto para el panel. Lo pone la función, que es quien sabe
   * qué pasó de verdad.
   */
  nota: string;
}

/** Colecciones y documentos que usa la gamificación. */
export const GAMIFICATION = {
  /** Documento único de configuración. */
  CONFIG_PATH: 'gamification/config',
  /** Libro mayor de XP de cada usuario. */
  LEDGER_PATH: 'rewardLedger',
  /** Nombre del campo del contador de XP en `users/{uid}`. */
  XP_FIELD: 'xp',
} as const;
