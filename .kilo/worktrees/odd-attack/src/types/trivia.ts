// ======================================================
// TRIVIA DIARIA DE ANIME
// ======================================================
//
// Hay UNA trivia al día, la misma para todo el mundo, y se
// guarda en `dailyQuizzes/{AAAA-MM-DD}`. Es al revés que las
// encuestas de los hilos (que puede hacer cada autor): aquí las
// preguntas las prepara el equipo y salen programadas.
//
// ── Por qué las respuestas correctas NO están aquí ─────────
//
// `correctAnswer` e `explanation` viven en la subcolección
// `answers/`, que NADIE puede leer desde el cliente. Si estuvieran
// al lado de la pregunta, cualquier persona podría abrir la
// consola, leer las tres respuestas y enviar el resultado sin
// jugar: el juego perdería toda la gracia y el XP sería gratis.
//
// El reparto queda así:
//
//   dailyQuizzes/{fecha}                     metadatos (abierta, categoría...)
//   dailyQuizzes/{fecha}/questions/{q1..q3}  público: enunciado y opciones
//   dailyQuizzes/{fecha}/answers/{q1..q3}    PRIVADO: respuesta correcta y explicación
//
// Y las reglas lo hacen cumplir: en `questions/` se comprueba
// que el documento NO traiga ninguna clave de las privadas, y en
// `answers/` no hay ninguna rama que conceda lectura ni escritura
// al cliente.
//
// El resultado del jugador lo escribe él, pero SÓLO con sus
// respuestas; las notas las pone la Cloud Function, que es la
// única que sabe qué es correcto.

/** Dificultad de una pregunta. La usa el admin al programarla. */
export type TriviaDificultad = 'facil' | 'media' | 'dificil';

/**
 * Categorías de las preguntas.
 *
 * Se guardan como texto y no como unión cerrada a propósito: el
 * administrador tiene que poder añadir "Temporada actual" sin
 * desplegar código, y una pregunta vieja con una categoría que ya
 * no exista tiene que seguir leyéndose.
 */
export const CATEGORIAS_TRIVIA = [
  'Shonen',
  'Seinen',
  'Romance',
  'Isekai',
  'Cyberpunk',
  'Anime clásico',
  'Temporada actual',
  'Manga',
  'Videojuegos',
  'Cultura japonesa',
] as const;

/**
 * Una pregunta TAL COMO LA VE EL JUGADOR.
 *
 * OJO: aquí no está `correctAnswer`, y no por descuido. La
 * respuesta correcta está en `TriviaAnswer`, que solo lee el
 * servidor. Si alguien añade aquí el campo correcto, rompe la
 * trivia entera, y las reglas de Firestore lo rechazan.
 */
export interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  category?: string;
  difficulty?: TriviaDificultad;
}

/**
 * La parte privada de una pregunta.
 *
 * Vive en `dailyQuizzes/{fecha}/answers/{id}` y la lee solo la
 * Cloud Function (Admin SDK). El cliente jamás la ve, ni antes ni
 * después de responder: la explicación se la devuelve el
 * resultado ya corregido.
 */
export interface TriviaAnswer {
  /** Índice de la opción correcta dentro de `options`. */
  correctIndex: number;
  /** Por qué es esa. Se enseña al responder. */
  explanation: string;
}

/** Los metadatos de la trivia de un día. */
export interface DailyQuiz {
  /** `AAAA-MM-DD`. */
  date: string;
  /** Cuántas preguntas tiene. */
  totalQuestions: number;
  /**
   * `false` para que el equipo la cierre antes de tiempo (por
   * ejemplo, si hay una errata). Nadie del público la ve.
   */
  active: boolean;
  /** Etiqueta libre para el panel ("Semana shonen"...). */
  label?: string;
  createdAt?: string;
}

/**
 * Lo que escribe el jugador al enviar sus respuestas.
 *
 * Fíjate en lo que NO está: ni `correct`, ni `points`, ni
 * `xpEarned`. El jugador no sabe si ha acertado (la respuesta
 * correcta no la ve) y las reglas le prohíben escribir esos
 * campos. Los pone la Cloud Function al corregir.
 */
export interface TriviaResult {
  userId: string;
  /** `AAAA-MM-DD`. */
  date: string;
  /** `q1` → opción elegida. */
  answers: Record<string, number>;
  createdAt?: string;
}

/** Lo que devuelve la Cloud Function tras corregir. */
export interface TriviaScore {
  userId: string;
  date: string;
  correct: number;
  total: number;
  /** Puntos de ranking (no son XP: el XP va aparte). */
  points: number;
  /** Desglose del XP, para poder enseñarlo sin inventarlo. */
  xp: {
    completed: number;
    correct: number;
    perfect: number;
    streak: number;
    total: number;
  };
  /** Racha DESPUÉS de esta trivia. */
  streak: number;
  completedAt: string;
}

/**
 * Racha diaria de trivia de un usuario.
 *
 * Va en `users/{uid}.trivia` y solo lo escriben las funciones: si
 * lo pudiera escribir el cliente, se fabricaría una racha de 30
 * días y se llevaría la medalla sin jugar (las reglas bloquean
 * ese campo; ver `firestore.rules`).
 */
export interface TriviaStreak {
  /** Días seguidos hasta hoy. */
  current: number;
  /** El mejor día de la racha que ha tenido. */
  longest: number;
  /** `AAAA-MM-DD` de la última trivia completada. */
  lastDate: string | null;
}

/** Periodos del ranking. */
export type TriviaPeriodo = 'semanal' | 'mensual' | 'historico';

/** Una fila del ranking, tal y como la pinta la tabla. */
export interface TriviaRankingRow {
  /** Puesto (1, 2, 3...). */
  posicion: number;
  userId: string;
  userName: string;
  avatarUrl: string;
  points: number;
  quizzes: number;
  correct: number;
  streak: number;
  /** `true` si es la fila del usuario que mira. */
  esPropio?: boolean;
}

/**
 * El documento del ranking de un periodo.
 *
 * Un documento por periodo con un mapa `uid → cifras`. Un mapa y
 * no un documento por usuario porque el ranking se lee entero de
 * una vez (no hay paginación: son los primeros 20), y así el
 * cliente hace una lectura en vez de veinte.
 *
 * Lo escribe la Cloud Function. El cliente solo lee, y las reglas
 * no tienen ninguna rama de escritura para él.
 */
export interface TriviaLeaderboardDoc {
  periodKey: string;
  scores: Record<
    string,
    {
      name: string;
      avatar: string;
      points: number;
      quizzes: number;
      correct: number;
      streak: number;
    }
  >;
  updatedAt?: string;
}

/** Cuántas entradas se guardan como mucho en un ranking. */
export const MAX_ENTRADAS_RANKING = 500;

/** Días de racha que dan medalla o bonus. */
export const HITOS_TRIVIA = [3, 7, 14, 30] as const;
