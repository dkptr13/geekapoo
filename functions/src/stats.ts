/**
 * Las estadísticas de un usuario, y cómo se actualizan.
 *
 * ── POR QUÉ ESTÁ SUELTO ────────────────────────────────────────────
 *
 * `index.ts` importa `firebase-admin` y `firebase-functions`, así que
 * Node no puede cargarlo en una prueba: la prueba se caería al
 * importar, antes de ejecutar nada. Aquí no hay nada más que
 * números y comparaciones, con lo que `tests/logica.logros.ts` lo
 * puede leer y comprobar de verdad.
 *
 * No es un capricho de pruebas. El fallo que motive este fichero era
 * de una línea, `est.x = inc` en vez de `est.x = est.x + inc`, y esa
 * línea no se ve leyendo el trigger: se ve ejecutándola veinte veces.
 *
 * ── LAS TRES FORMAS DE ACTUALIZAR UN CONTADOR ──────────────────────
 *
 * Hay tres y no una, y confundirlas es justo lo que pasaba. Un mismo
 * campo del mismo objeto se toca de tres maneras según de dónde venga
 * el número:
 *
 *   · SUMAR      → lo que manda un trigger. `1` por cada comentario
 *                  nuevo. El trigger NO sabe cuántos tenía el usuario.
 *   · PONER      → lo que manda un recuento. El total, no la diferencia.
 *                  Aquí lo usa la trivia, que lee el documento antes.
 *   · MÁXIMO     → para lo que es un techo y no una cuenta, como los
 *                  seguidores que se han tenido.
 *
 * Con la suma mal escrita (poniendo en vez de sumando) los contadores
 * se quedan clavados en 1 para siempre: el segundo comentario
 * reescribe 1 encima del 1 que ya había, y ninguna medalla de "N
 * comentarios" se puede llegar a completar porque N nunca pasa de 1.
 */

/** Los contadores de un usuario. */
export interface Estadisticas {
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
  /**
   * MAXIMO de seguidores que ha tenido, no el numero vivo.
   *
   * Es deliberadamente distinto de `users/{uid}.followersCount` (que si
   * es el numero de ahora): las medallas de comunidad no se pierden al
   * dejar de seguirte.
   */
  followersReceived: number;
  // ── Comunidad y funciones (Fase 2) ───────────────────
  //
  // Los mapas guardan IDS (`clubId: true`), no cantidades: un id
  // que ya esta no se cuenta dos veces, y nada se resta nunca.
  // Una medalla conseguida no se pierde por salir de un club,
  // borrar un canal o cerrar un chat. Es la misma idea que el
  // techo de seguidores, aplicada a pertenencia y creacion.
  /** Días distintos con actividad que dio XP. Solo sube. */
  diasActivosTotal: number;
  /** Ultimo día contado, en `YYYY-MM-DD` (hora del servidor). */
  diasActivosUltimo: string;
  /** Clubes que ha creado. */
  clubesCreados: Record<string, true>;
  /** Clubes a los que se ha unido (incluye los creados). */
  clubesUnidos: Record<string, true>;
  /** Canales que ha creado en clubes. */
  canalesCreados: Record<string, true>;
  /** Conversaciones donde ha escrito al menos un mensaje. */
  chatsPropios: Record<string, true>;
  /** Tier lists que ha creado. */
  tiersCreadas: Record<string, true>;
  /** Encuestas que ha creado (hilos con `poll`). */
  encuestasCreadas: Record<string, true>;
  /** Hilos con imagen que ha creado. */
  visualesIds: Record<string, true>;
  /** Tier lists propias que llegaron a populares. */
  tiersPopularesIds: Record<string, true>;
  /**
   * Hilos creados por tópico oficial (`topicoId: {threadId: true}`).
   * Solo cuenta lo que coincide con `TOPICOS_OFICIALES`; lo demás
   * se ignora sin inventar categoría.
   */
  hilosPorTopico: Record<string, Record<string, true>>;
}

export const ESTADISTICAS_VACIAS: Estadisticas = {
  threadsCreated: 0,
  commentsCreated: 0,
  commentsInThreads: 0,
  likesReceived: 0,
  animeXp: {},
  triviaCompleted: 0,
  triviaCorrect: 0,
  triviaPerfect: 0,
  triviaStreakBest: 0,
  followersReceived: 0,
  diasActivosTotal: 0,
  diasActivosUltimo: '',
  clubesCreados: {},
  clubesUnidos: {},
  canalesCreados: {},
  chatsPropios: {},
  tiersCreadas: {},
  encuestasCreadas: {},
  visualesIds: {},
  tiersPopularesIds: {},
  hilosPorTopico: {},
};

/**
 * Un numero, o 0 si no lo es.
 *
 * Todo lo que llega desde un documento de Firestore es de confianza
 * desconocida: un campo puede venir como texto, como `null` o no
 * venir. Sin esto, un `NaN` se cuela en un contador y a partir de ahi
 * el contador es `NaN` para siempre, porque sumar a `NaN` da `NaN`.
 */
export function num(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Lee las estadísticas de un documento de usuario, rellenando huecos. */
export function leerEstadisticas(data: Record<string, any> | undefined): Estadisticas {
  const s = data?.stats;
  if (!s || typeof s !== 'object') return { ...ESTADISTICAS_VACIAS };

  const mapa = (v: unknown): Record<string, true> =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? (v as Record<string, true>)
      : {};

  const texto = (v: unknown): string => (typeof v === 'string' ? v : '');

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
    followersReceived: num(s.followersReceived),
    diasActivosTotal: num(s.diasActivosTotal),
    diasActivosUltimo: texto(s.diasActivosUltimo),
    clubesCreados: mapa(s.clubesCreados),
    clubesUnidos: mapa(s.clubesUnidos),
    canalesCreados: mapa(s.canalesCreados),
    chatsPropios: mapa(s.chatsPropios),
    tiersCreadas: mapa(s.tiersCreadas),
    encuestasCreadas: mapa(s.encuestasCreadas),
    visualesIds: mapa(s.visualesIds),
    tiersPopularesIds: mapa(s.tiersPopularesIds),
    hilosPorTopico:
      s.hilosPorTopico && typeof s.hilosPorTopico === 'object'
        ? (s.hilosPorTopico as Record<string, Record<string, true>>)
        : {},
  };
}

/**
 * Cuantos contadores se tocan. Lo que venga sin numero se ignora.
 *
 * `animeXp` se queda fuera a proposito: no es un contador, es un mapa
 * de XP por anime, y por eso no cabe en un "sumar N" ni en un "poner
 * N". Lo escribe el trigger de XP de anime por su cuenta.
 *
 * Los mapas de comunidad (`clubesUnidos`...) y `diasActivosUltimo`
 * tampoco entran: los mapas se marcan con `marcarEnMapa` (nunca se
 * suman ni se restan) y el ultimo día lo pone `pasarDia`.
 */
type Incrementos = Partial<
  Record<
    Exclude<
      keyof Estadisticas,
      | 'animeXp'
      | 'diasActivosTotal'
      | 'diasActivosUltimo'
      | 'clubesCreados'
      | 'clubesUnidos'
      | 'canalesCreados'
      | 'chatsPropios'
      | 'tiersCreadas'
      | 'encuestasCreadas'
      | 'visualesIds'
      | 'tiersPopularesIds'
      | 'hilosPorTopico'
    >,
    number | undefined
  >
>;

/**
 * Los contadores de contenido: hilos, comentarios, debates y "Me gusta".
 *
 * SUMAN, y el suelo es cero.
 *
 * El suelo en cero no es un adorno: los "Me gusta" y las reacciones
 * se pueden quitar, y quien quita algo no puede quedarse con un
 * contador negativo que le bloqueara medallas que ya había alcanzado.
 *
 * Que sume dentro de la transacción de Firestore es seguro: si dos
 * comentarios entran a la vez, la transacción se reintenta con el
 * valor ya escrito y no se pierde ninguno. Por eso aquí no hace falta
 * un incremento de campo del servidor, que además no serviría para
 * decidir un total a cero.
 *
 * @param antes  Lo que había. No se modifica.
 * @param inc    Lo que hay que sumar. `undefined` = no tocar.
 * @returns una copia nueva con los contadores ya sumados
 */
export function sumarContadores(
  antes: Estadisticas,
  inc: Incrementos,
): Estadisticas {
  const est = { ...antes };

  if (inc.threadsCreated !== undefined) {
    est.threadsCreated = Math.max(0, est.threadsCreated + inc.threadsCreated);
  }
  if (inc.commentsCreated !== undefined) {
    est.commentsCreated = Math.max(0, est.commentsCreated + inc.commentsCreated);
  }
  if (inc.commentsInThreads !== undefined) {
    est.commentsInThreads = Math.max(0, est.commentsInThreads + inc.commentsInThreads);
  }
  if (inc.likesReceived !== undefined) {
    est.likesReceived = Math.max(0, est.likesReceived + inc.likesReceived);
  }

  return est;
}

/**
 * Los contadores de la trivia diaria.
 *
 * PONEN el total, no lo suman. El trigger de la trivia lee el
 * documento antes de escribir y pasa el valor entero, porque dos
 * trivias simultaneas con incrementos se pisarian.
 *
 * Si estos cuatro se sumaran igual que los de arriba, con `increment`, dos
 * trivias a la vez darian un numero de menos. De ahi el nombre: son
 * la unica parte de `stats` que llega en absoluto.
 *
 * @param antes  Lo que había. No se modifica.
 * @param abs    Los totales. `undefined` = no tocar.
 * @returns una copia nueva
 */
export function ponerTotales(
  antes: Estadisticas,
  abs: Incrementos,
): Estadisticas {
  const est = { ...antes };

  if (abs.triviaCompleted !== undefined) {
    est.triviaCompleted = Math.max(0, abs.triviaCompleted);
  }
  if (abs.triviaCorrect !== undefined) {
    est.triviaCorrect = Math.max(0, abs.triviaCorrect);
  }
  if (abs.triviaPerfect !== undefined) {
    est.triviaPerfect = Math.max(0, abs.triviaPerfect);
  }
  if (abs.triviaStreakBest !== undefined) {
    est.triviaStreakBest = Math.max(0, abs.triviaStreakBest);
  }

  return est;
}

/**
 * Marca un id en un mapa de pertenencia o creación.
 *
 * Devuelve una copia nueva con el id dentro. Si ya estaba, la
 * copia es igual: llamar dos veces con lo mismo no cuenta dos
 * veces, y por eso los triggers pueden reintentarse sin miedo.
 */
export function marcarEnMapa(
  antes: Record<string, true>,
  id: string,
): Record<string, true> {
  if (!id || antes[id]) return { ...antes };
  return { ...antes, [id]: true };
}

/** Cuántos ids hay en un mapa. Lo que no es un objeto, cero. */
export function tamanoMapa(mapa: unknown): number {
  if (!mapa || typeof mapa !== 'object' || Array.isArray(mapa)) return 0;
  return Object.keys(mapa).length;
}

/**
 * Marca un hilo en un tópico (`topicoId: {threadId: true}`).
 *
 * Idempotente como `marcarEnMapa`: el mismo hilo no cuenta dos
 * veces aunque el trigger se reintente.
 */
export function marcarTopico(
  antes: Estadisticas,
  topico: string,
  threadId: string,
): Estadisticas {
  if (!topico || !threadId) return { ...antes };
  const dentro = antes.hilosPorTopico[topico] ?? {};
  if (dentro[threadId]) return { ...antes };
  return {
    ...antes,
    hilosPorTopico: {
      ...antes.hilosPorTopico,
      [topico]: { ...dentro, [threadId]: true },
    },
  };
}

/** Hilos contados en un tópico. */
export function hilosEnTopico(est: Estadisticas, topico: string): number {
  return tamanoMapa(est.hilosPorTopico[topico]);
}

/** Tópicos distintos con al menos un hilo. */
export function topicosDistintos(est: Estadisticas): number {
  return Object.values(est.hilosPorTopico).filter(
    (m) => tamanoMapa(m) > 0,
  ).length;
}

/**
 * Pasa el día de actividad si hoy no estaba contado.
 *
 * `hoy` viene en `YYYY-MM-DD` (hora del servidor) y lo pone quien
 * llama, para poder probarlo sin congelar relojes: aquí solo se
 * compara texto.
 *
 * @returns el total y el último día resultantes.
 */
export function pasarDia(
  total: number,
  ultimo: string,
  hoy: string,
): { total: number; ultimo: string } {
  if (!hoy || ultimo === hoy) return { total, ultimo };
  return { total: total + 1, ultimo: hoy };
}

/**
 * Días enteros desde una fecha hasta hoy.
 *
 * `createdAt` es lo que trae el documento (Timestamp de
 * Firestore o ISO en texto). Lo que no se entiende, cero: una
 * cuenta sin fecha no gana antigüedad por defecto.
 */
export function diasDesde(createdAt: unknown, ahoraMs: number): number {
  const ms =
    typeof createdAt === 'string'
      ? Date.parse(createdAt)
      : typeof (createdAt as { toMillis?: unknown })?.toMillis === 'function'
        ? Number((createdAt as { toMillis: () => number }).toMillis())
        : NaN;

  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return Math.max(0, Math.floor((ahoraMs - ms) / 86400000));
}

/** Campos de `stats` que son mapas de ids (`clubId: true`). */
export type CampoMapa =
  | 'clubesCreados'
  | 'clubesUnidos'
  | 'canalesCreados'
  | 'chatsPropios'
  | 'tiersCreadas'
  | 'encuestasCreadas'
  | 'visualesIds'
  | 'tiersPopularesIds';

const CAMPOS_MAPA: readonly CampoMapa[] = [
  'clubesCreados',
  'clubesUnidos',
  'canalesCreados',
  'chatsPropios',
  'tiersCreadas',
  'encuestasCreadas',
  'visualesIds',
  'tiersPopularesIds',
];

/** ¿Es este texto uno de los campos-mapa de `stats`? */
export function esCampoMapa(campo: string): campo is CampoMapa {
  return (CAMPOS_MAPA as readonly string[]).includes(campo);
}

/**
 * Devuelve las estadísticas con el id marcado en uno de sus mapas.
 *
 * Es la única forma de tocar un mapa: copiar y añadir. Nunca se
 * suma (un reintento no cuenta dos veces) y nunca se resta (la
 * medalla no se pierde por irse o borrar).
 */
export function conMarca(
  antes: Estadisticas,
  campo: CampoMapa,
  id: string,
): Estadisticas {
  if (!id) return { ...antes };
  return { ...antes, [campo]: marcarEnMapa(antes[campo], id) };
}

/**
 * `followersReceived`, que es un MAXIMO y no una cuenta.
 *
 * Suma y se queda con el valor mas alto de los dos, porque lo que
 * interesa es cuantos seguidores ha tenido la persona ALGUNA VEZ. Si
 * dejase de seguirla bajaria el contador, y con el una medalla ya
 * conseguida.
 *
 * Suma y no se queda con el nuevo tal cual, porque el valor que llega
 * es el de ahora y podria ser menor que el techo anterior.
 *
 * @param antes  Lo que había. No se modifica.
 * @param valor  El numero de seguidores de ahora.
 * @returns una copia nueva
 */
export function subirTecho(antes: Estadisticas, valor: number): Estadisticas {
  return {
    ...antes,
    followersReceived: Math.max(antes.followersReceived, valor, 0),
  };
}