import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { db, functions } from '../lib/firebase';
import { httpsCallable } from 'firebase/functions';
import type {
  DailyQuiz,
  TriviaLeaderboardDoc,
  TriviaQuestion,
  TriviaResult,
} from '../types/trivia';

// ======================================================
// TRIVIA DIARIA: LA PARTE DEL CLIENTE
// ======================================================
//
// Aquí solo hay lectura y un envío. Ni una nota, ni un punto, ni
// un XP: eso lo pone la Cloud Function cuando ve el documento del
// resultado, porque es la única que sabe qué respuesta es la
// buena (vive en un bloque que el cliente no puede leer).
//
// ── El día es UTC, y es a propósito ──────────────────────
//
// La clave del día se calcula aquí igual que en la función
// (`diaDeAhora`): `toISOString().slice(0, 10)`, que es UTC. La
// consecuencia es que la trivia cambia de día a las 02:00 (o
// 03:00 en verano) hora de España, no a medianoche.
//
// Podría seeming más amable usar la hora local del navegador, y
// por eso merece la pena decir por qué no: la racha se calcula
// comparando días, y si el día dependiera de un reloj que cada
// usuario controla, un jugador que viviera en UTC+14 llevaría
// un día por delante y otro en UTC-11 iría un día por detrás, y
// la racha se rompería sin que nadie hubiera hecho trampas. Con
// UTC todos ven el mismo día y las reglas no dependen del reloj
// de nadie. La función además acepta "hoy o ayer" en UTC, que
// cubre a quien juegue justo en el cambio de día.

export const DAILY_QUIZZES = 'dailyQuizzes';
export const TRIVIA_RESULTS = 'triviaResults';
export const TRIVIA_LEADERBOARD = 'triviaLeaderboard';

const DIA_MS = 24 * 60 * 60 * 1000;

/** `AAAA-MM-DD` del día actual en UTC. */
export function claveDia(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Qué trivia se está mostrando.
 *
 * OJO: `correctIndex` NO está aquí, y no porque se haya
 * olvidado. Vive en `dailyQuizzes/{fecha}/answers/`, que las
 * reglas de Firestore leen solo con el Admin SDK. Cualquier
 * versión de este objeto que lo incluyera haría la trivia
 * trampeable desde la consola del navegador.
 */
export interface TriviaDelDia {
  date: string;
  active: boolean;
  label?: string;
  questions: TriviaQuestion[];
  /** `true` cuando el jugador ya la completó. */
  yaHecho: boolean;
}

/** Lo que devuelve la función tras corregir, leído del resultado. */
export interface ResultadoCorregido {
  correct: number;
  total: number;
  perfecto: boolean;
  points: number;
  streak: number;
  xpGanado: number;
  /** Explicación por pregunta, para el resultado. */
  explicaciones: Record<string, string>;
  xp: {
    completed: number;
    correct: number;
    perfect: number;
    streak: number;
    total: number;
  };
}

/** Errores que la interfaz distingue para explicar qué ha pasado. */
export type ErrorTrivia =
  | 'sin-sesion'
  | 'sin-trivia'
  | 'cerrada'
  | 'ya-hecha'
  | 'sin-permiso'
  | 'sin-conexion'
  | 'desconocido';

export class TriviaError extends Error {
  readonly motivo: ErrorTrivia;

  constructor(motivo: ErrorTrivia, mensaje: string) {
    super(mensaje);
    this.name = 'TriviaError';
    this.motivo = motivo;
  }
}

/** Texto que se enseña por cada error. */
export const MENSAJE_ERROR: Record<ErrorTrivia, string> = {
  'sin-sesion': 'Inicia sesión para jugar a la trivia diaria.',
  'sin-trivia': 'Hoy no hay trivia. Vuelve mañana, anda.',
  cerrada: 'La trivia de hoy se ha cerrado. Ya no se puede jugar.',
  'ya-hecha': 'Ya has jugado la trivia de hoy. Mañana hay otra.',
  'sin-permiso': 'No se ha podido guardar la respuesta.',
  'sin-conexion': 'Sin conexión. El XP se guardará en cuanto vuelvas.',
  desconocido: 'Algo ha ido mal al enviar las respuestas.',
};

// ======================================================
// LECTURA
// ======================================================

/**
 * La trivia del día, con sus tres preguntas.
 *
 * Devuelve `null` si hoy no hay trivia preparada (o está
 * cerrada), que es el caso normal la mayoría de los días hasta
 * que el equipo la programe.
 */
export async function triviaDeHoy(
  date: string = claveDia(),
): Promise<TriviaDelDia | null> {
  const [quizSnap, preguntasSnap] = await Promise.all([
    getDoc(doc(db, DAILY_QUIZZES, date)),
    getDocs(query(collection(db, DAILY_QUIZZES, date, 'questions'), limit(10))),
  ]);

  if (!quizSnap.exists()) return null;

  const quiz = quizSnap.data() as DailyQuiz;
  if (quiz.active === false) return null;

  const questions = preguntasSnap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<TriviaQuestion, 'id'>),
  }));

  if (questions.length === 0) return null;

  return { date, active: true, label: quiz.label, questions, yaHecho: false };
}

/** Si este jugador ya envió sus respuestas de hoy. */
export async function yaCompletada(date: string = claveDia()): Promise<boolean> {
  return (await leerResultado(date)) !== null;
}

/** El documento de resultado del jugador para ese día. */
async function leerResultado(date: string): Promise<(TriviaResult & Partial<ResultadoCorregido>) | null> {
  const snap = await getDoc(resultadoRef(null, date));
  return snap.exists() ? (snap.data() as TriviaResult & Partial<ResultadoCorregido>) : null;
}

/**
 * Id del documento de resultado.
 *
 * Con el `uid` delante a propósito: es lo que hace imposible
 * tener dos resultados del mismo día (el segundo choca contra el
 * primero) sin tener que mirar nada más.
 */
function resultadoRef(uid: string | null, date: string) {
  return doc(db, TRIVIA_RESULTS, `${uid ?? '_'}_${date}`);
}

/**
 * Escucha el resultado del jugador para un día.
 *
 * Hace falta la escucha y no un `getDoc` porque las notas las
 * escribe la Cloud Function DESPUÉS de enviar las respuestas: si
 * el cliente solo leyiera una vez, vería el documento a medio
 * corregir (sin `correct`, sin XP) y se quedaría ahí para siempre.
 */
export function escucharMiResultado(
  uid: string | null | undefined,
  date: string,
  alCambiar: (r: (TriviaResult & Partial<ResultadoCorregido>) | null) => void,
): () => void {
  if (!uid) {
    alCambiar(null);
    return () => {};
  }

  return onSnapshot(
    doc(db, TRIVIA_RESULTS, `${uid}_${date}`),
    (snap) => {
      alCambiar(
        snap.exists() ? (snap.data() as TriviaResult & Partial<ResultadoCorregido>) : null,
      );
    },
    (e) => {
      console.error('[Trivia] Error escuchando el resultado:', e);
      alCambiar(null);
    },
  );
}

// ======================================================
// ENVÍO
// ======================================================

/**
 * Manda las respuestas.
 *
 * Se escribe un documento y solo uno. Las notas no se calculan
 * aquí (no se pueden: la respuesta correcta no la ve el
 * navegador) y las reglas ni siquiera dejan escribir esos campos,
 * así que el documento sale con lo justo.
 */
export async function enviarTrivia(
  uid: string,
  date: string,
  answers: Record<string, number>,
): Promise<void> {
  try {
    await setDoc(resultadoRef(uid, date), {
      userId: uid,
      date,
      quizId: date,
      answers,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    const code = (e as { code?: string })?.code ?? '';

    if (code.includes('unavailable')) {
      throw new TriviaError('sin-conexion', MENSAJE_ERROR['sin-conexion']);
    }
    // Las reglas rechazan la escritura cuando ya existe el
    // documento (segunda trivia del día) o cuando la trivia no
    // existe. Firestore no dice cuál de las dos cosas es, así que
    // se comprueba el caso bueno antes de culpar a las reglas.
    const yaEsta = await yaCompletada(date);
    if (yaEsta) throw new TriviaError('ya-hecha', MENSAJE_ERROR['ya-hecha']);

    const trivia = await triviaDeHoy(date);
    if (!trivia) throw new TriviaError('sin-trivia', MENSAJE_ERROR['sin-trivia']);

    throw new TriviaError('sin-permiso', MENSAJE_ERROR['sin-permiso']);
  }
}

// ======================================================
// RANKING
// ======================================================

/**
 * Clave del periodo semanal: `AAAA-Www`, con la semana empezando
 * en lunes.
 *
 * Es una copia de la que hay en `functions/src/index.ts`. Si
 * cambias una, cambia la otra: el cliente busca el documento por
 * este nombre y la función escribe por el suyo, así que si no
 * coinciden el ranking saldría vacío sin dar ningún error.
 */
export function claveSemanal(date: string): string {
  const d = new Date(`${date}T00:00:00.000Z`);
  const dia = d.getUTCDay() === 0 ? 7 : d.getUTCDay();
  const jueves = new Date(d.getTime() - (dia - 4) * DIA_MS);
  const anio = jueves.getUTCFullYear();
  const primeroEnero = Date.UTC(anio, 0, 1) / DIA_MS;
  const semana = Math.floor((jueves.getTime() / DIA_MS - primeroEnero) / 7) + 1;
  return `${anio}-W${String(semana).padStart(2, '0')}`;
}

/** Periodos disponibles, con la clave del documento de cada uno. */
export function claveRanking(
  periodo: 'diario' | 'semanal' | 'mensual' | 'historico',
  date: string = claveDia(),
): string {
  switch (periodo) {
    case 'diario':
      return `diario-${date}`;
    case 'semanal':
      return `semanal-${claveSemanal(date)}`;
    case 'mensual':
      return `mensual-${date.slice(0, 7)}`;
    default:
      return 'historico-historico';
  }
}

/** Las tres medallas del podio, para pintarlas con su color. */
export const MEDALLAS_PODIO = ['🥇', '🥈', '🥉'];

/**
 * Lee el ranking de un periodo.
 *
 * Viene en un solo documento con un mapa, así que es una
 * lectura y no veinte. Se ordena aquí en vez de en la función
 * porque un mapa en Firestore no tiene orden y el cliente tiene
 * que paginar de alguna forma.
 */
export async function leerRanking(
  periodo: 'diario' | 'semanal' | 'mensual' | 'historico',
  date: string = claveDia(),
): Promise<{ posicionPropia: number | null; filas: FilaRanking[] }> {
  const snap = await getDoc(doc(db, TRIVIA_LEADERBOARD, claveRanking(periodo, date)));
  if (!snap.exists()) return { posicionPropia: null, filas: [] };

  const datos = snap.data() as TriviaLeaderboardDoc;
  const entradas = Object.entries(datos.scores ?? {});

  const filas: FilaRanking[] = entradas
    .map(([userId, e]) => ({
      userId,
      userName: e.name ?? 'Otaku',
      avatarUrl: e.avatar ?? '',
      points: e.points ?? 0,
      quizzes: e.quizzes ?? 0,
      correct: e.correct ?? 0,
      streak: e.streak ?? 0,
      posicion: 0,
    }))
    .sort((a, b) => b.points - a.points || a.userName.localeCompare(b.userName));

  filas.forEach((f, i) => {
    f.posicion = i + 1;
  });

  return { posicionPropia: null, filas: filas.slice(0, 20) };
}

/** Una fila del ranking, ya ordenada y con su posición. */
export interface FilaRanking {
  posicion: number;
  userId: string;
  userName: string;
  avatarUrl: string;
  points: number;
  quizzes: number;
  correct: number;
  streak: number;
}

// ======================================================
// GESTIÓN (ADMIN)
// ======================================================

/**
 * Borra (o cierra) la trivia de una fecha.
 *
 * Va por la Cloud Function y no con escrituras sueltas porque
 * borrar una trivia incluye borrar sus RESPUESTAS CORRECTAS, y
 * ese bloque no tiene ninguna rama de escritura para el cliente
 * (a propósito, para que nadie pueda reescribir cuál es la
 * buena). Desde el navegador no se puede; desde la función, con
 * Admin SDK, sí.
 */
export async function gestionTrivia(
  fecha: string,
  accion: 'eliminar' | 'cerrar' | 'abrir',
): Promise<{ borrados: number }> {
  const llamar = httpsCallable<
    { fecha: string; accion: string },
    { borrados: number }
  >(functions, 'gestionarTriviaDiaria');

  const res = await llamar({ fecha, accion });
  return res.data;
}
