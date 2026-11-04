import {
  Timestamp,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { db, functions } from '../lib/firebase';
import type { NewPollInput, Poll, PollOption, PollSummary } from '../types';

// ======================================================
// ENCUESTAS DE LOS HILOS
// ======================================================
//
// ── Dónde vive cada cosa ──────────────────────────────────
//
//   threads/{threadId}.poll              configuración (autor)
//     question, options[{id,text}], expiresAt, isClosed,
//     allowChangeVote
//
//   threads/{threadId}/pollVotes/{uid}    el voto de cada persona
//     { userId, optionId, createdAt, updatedAt? }
//
//   pollStats/{threadId}                  resumen del servidor
//     { options: {o1: 3}, totalVotes, actualizadoAt }
//
// ── El voto es PRIVADO ────────────────────────────────────
//
// El documento de voto solo lo puede leer quien votó. Antes la
// tarjeta contaba los votos en el cliente, y eso obligaba a dejar
// toda la subcolección legible: cualquiera podía saber quién había
// votado y qué opción había elegido. Ahora la tarjeta consume:
//
//   · `pollStats/{threadId}`, que escribe la Cloud Function con
//     el Admin SDK y NO se puede escribir desde el cliente;
//   · el documento propio de voto, para saber qué opción marcó
//     quien mira.
//
// Los totales siguen saliendo de documentos reales: la función
// cuenta los votos, no acepta números del navegador. Si el trigger
// aún no está desplegado no hay resultados agregados; por eso la
// migración `migrar-resumenes-encuestas.mjs` rellena los que
// falten.

export const POLL_VOTES = 'pollVotes';
export const POLL_STATS = 'pollStats';

export const LIMITS = {
  question: 160,
  option: 80,
  minOptions: 2,
  maxOptions: 10,
};

/** Duraciones que ofrece el formulario. Vacío = sin fecha de cierre. */
export const DURACIONES: { value: string; label: string; ms: number | null }[] = [
  { value: '', label: 'Sin límite', ms: null },
  { value: '1h', label: '1 hora', ms: 60 * 60 * 1000 },
  { value: '12h', label: '12 horas', ms: 12 * 60 * 60 * 1000 },
  { value: '24h', label: '24 horas', ms: 24 * 60 * 60 * 1000 },
  { value: '72h', label: '3 días', ms: 72 * 60 * 60 * 1000 },
  { value: '168h', label: '7 días', ms: 168 * 60 * 60 * 1000 },
];

/** Millisegundos de una duración del formulario. `null` = sin límite. */
export function duracionAMillis(valor: string): number | null {
  return DURACIONES.find((d) => d.value === valor)?.ms ?? null;
}

/**
 * Las opciones del mapa a una lista ordenada.
 *
 * Se ordenan por número (`o1`, `o2`... `o10`) y no por texto, que
 * es como las escribió quien creó la encuesta. Ordenar por texto
 * las movería de sitio y, en las Bars, saltaría el resaltado.
 */
export function opcionesDePoll(poll: Poll): PollOption[] {
  return Object.entries(poll.options ?? {})
    .map(([id, text]) => ({ id, text }))
    .sort((a, b) => numeroDeOpcion(a.id) - numeroDeOpcion(b.id));
}

/** "o7" → 7. Lo que no encaja devuelve 999 para que quede al final. */
function numeroDeOpcion(id: string): number {
  const n = Number(id.replace(/^o/, ''));
  return Number.isFinite(n) ? n : 999;
}

/** Una opción tal y como se pinta, con sus votos ya contados. */
export interface PollOptionResult extends PollOption {
  votes: number;
  /** 0-100, redondeado. */
  porcentaje: number;
  /** `true` si esta opción es la que votó quien mira. */
  mia: boolean;
}

export interface PollResult {
  question: string;
  options: PollOptionResult[];
  totalVotes: number;
  /** `true` cuando quien mira ya ha votado. */
  haVotado: boolean;
  /** Opción que eligió quien mira. */
  miOpcion: string | null;
  /** `true` si ya no se puede votar: cerrada, caducada o cerrada de facto. */
  cerrada: boolean;
  /** `true` si votó pero el autor no permite cambiar de opinión. */
  votoFijo: boolean;
  /** `true` si se puede seguir votando o cambiando de opción. */
  editable: boolean;
  /** Segundos que quedan, si hay caducidad. */
  segundosRestantes: number | null;
}

/**
 * Valida el borrador del formulario y devuelve la encuesta
 * lista para guardarse en Firestore.
 *
 * Lanza si algo no cuadra, con un texto pensado para enseñarse
 * tal cual debajo del formulario. Las reglas vuelven a validar
 * lo mismo en el servidor: aquí es para no fallar al publicar,
 * allí para que no se pueda falsear.
 */
export function normalizarPoll(input: NewPollInput): Poll {
  const question = input.question.trim();

  if (!question) throw new Error('La encuesta necesita una pregunta.');
  if (question.length > LIMITS.question) {
    throw new Error(`La pregunta no puede pasar de ${LIMITS.question} caracteres.`);
  }

  // Se limpian y se descartan las vacías: el usuario puede dejar
  // un hueco en medio al borrar una opción.
  const textos = input.options.map((o) => o.trim()).filter(Boolean);

  if (textos.length < LIMITS.minOptions) {
    throw new Error('La encuesta necesita al menos 2 opciones.');
  }
  if (textos.length > LIMITS.maxOptions) {
    throw new Error(`La encuesta no puede tener más de ${LIMITS.maxOptions} opciones.`);
  }

  textos.forEach((t) => {
    if (t.length > LIMITS.option) {
      throw new Error(`La opción "${t.slice(0, 20)}…" pasa de ${LIMITS.option} caracteres.`);
    }
  });

  const ms = duracionAMillis(input.duration ?? '');

  const options: Record<string, string> = {};
  textos.forEach((texto, i) => {
    options[`o${i + 1}`] = texto;
  });

  return {
    question,
    // Mapa y no lista, por lo que explican los comentarios de
    // `Poll.options`: es lo que permite a las reglas exigir que
    // el voto vaya a una opción que existe de verdad.
    options,
    expiresAt: ms ? Timestamp.fromMillis(Date.now() + ms) : null,
    isClosed: false,
    allowChangeVote: input.allowChangeVote,
  };
}

/** Referencia al documento de la encuesta de un hilo. */
export function pollRef(threadId: string) {
  return doc(db, 'threads', threadId);
}

/** Referencia al documento de voto de una persona. */
export function voteRef(threadId: string, uid: string) {
  return doc(db, 'threads', threadId, POLL_VOTES, uid);
}

/**
 * Registra el voto de una persona.
 *
 * Si ya había votado, cambia de opinión SOLO si el autor lo
 * permitió; el servidor lo comprueba otra vez, así que aquí el
 * aviso es solo para no fallar con un error feo.
 */
export async function votePoll(
  threadId: string,
  poll: Poll,
  optionId: string,
  uid: string,
): Promise<void> {
  if (!(optionId in (poll.options ?? {}))) {
    throw new Error('Esa opción no existe en la encuesta.');
  }

  const ref = voteRef(threadId, uid);
  const previo = await getDoc(ref);

  if (previo.exists()) {
    const yaElegida = previo.data()?.optionId as string | undefined;
    if (yaElegida === optionId) return;
    if (!poll.allowChangeVote) {
      throw new Error('En esta encuesta solo se puede votar una vez.');
    }
    await updateDoc(ref, { optionId, updatedAt: serverTimestamp() });
    return;
  }

  // `setDoc` sin `merge`: el documento tiene que CREARSE. Si ya
  // existiera (dos pestañas pulsando a la vez), la escritura
  // entera se rechaza y el voto se queda con el primero, que es
  // justo lo que quiere decir "un solo voto por persona".
  await setDoc(ref, {
    userId: uid,
    optionId,
    createdAt: serverTimestamp(),
  });
}

/** Un voto tal y como viene de Firestore. */
export interface PollVoteRow {
  id: string;
  userId: string;
  optionId: string;
}

/**
 * Escucha SOLO el voto de quien mira.
 *
 * Es el único documento de `pollVotes` que las reglas dejan leer a
 * una persona normal. La tarjeta no necesita los demás: los totales
 * vienen del resumen del servidor.
 */
export function listenMyPollVote(
  threadId: string,
  uid: string,
  alCambiar: (vote: PollVoteRow | null, error?: Error) => void,
): () => void {
  return onSnapshot(
    voteRef(threadId, uid),
    (snap) => {
      if (!snap.exists()) {
        alCambiar(null);
        return;
      }
      const optionId = String(snap.data().optionId ?? '');
      alCambiar(
        optionId
          ? { id: snap.id, userId: uid, optionId }
          : null,
      );
    },
    (e) => {
      console.error('[Encuestas] Error escuchando tu voto:', e);
      alCambiar(null, e);
    },
  );
}

/** Escucha el resumen agregado que mantiene la Cloud Function. */
export function listenPollSummary(
  threadId: string,
  alCambiar: (resumen: PollSummary | null, error?: Error) => void,
): () => void {
  return onSnapshot(
    doc(db, POLL_STATS, threadId),
    (snap) => {
      alCambiar(snap.exists() ? (snap.data() as PollSummary) : null);
    },
    (e) => {
      console.error('[Encuestas] Error escuchando el resumen:', e);
      alCambiar(null, e);
    },
  );
}

/**
 * Lee el resumen que calcula el servidor.
 *
 * Es la única fuente de resultados. No hay lectura de votos ajenos
 * ni siquiera para el panel: los votos son anónimos también para
 * moderadores y administradores.
 */
export async function leerResumen(threadId: string): Promise<PollSummary | null> {
  const ref = doc(db, POLL_STATS, threadId);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as PollSummary) : null;
}

/**
 * Cuenta los votos y calcula porcentajes, estado y si quien
 * mira puede seguir tocando cosas.
 *
 * Toda la presentación de la encuesta sale de aquí, para que el
 * "72%" de la tarjeta y el del panel sean el mismo número.
 *
 * `votes` solo debe llevar el voto de quien mira: es el único que
 * las reglas dejan leer. Los totales salen de `resumen`, que es el
 * documento agregado que mantiene el servidor. Si aún no existe
 * (por ejemplo, antes de desplegar el trigger), no se inventan
 * resultados: se muestra 0.
 */
export function calcularPoll(
  poll: Poll,
  votes: PollVoteRow[],
  uid: string | null | undefined,
  now: number = Date.now(),
  resumen?: PollSummary | null,
): PollResult {
  const opciones = opcionesDePoll(poll);

  const contados: Record<string, number> = {};
  opciones.forEach((o) => {
    contados[o.id] = 0;
  });

  votes.forEach((v) => {
    if (v.optionId in contados) contados[v.optionId] += 1;
  });

  const counts = resumen?.options ?? contados;
  const total =
    resumen?.totalVotes ?? votes.filter((v) => v.optionId in contados).length;

  const mio = votes.find((v) => v.userId === uid);
  const miOpcion = mio?.optionId ?? null;

  // La fecha de cierre se guarda como Timestamp de Firestore. Si
  // algún documento viejo la trajera como texto ISO, `toMillis()`
  // no existiría y reventaría la tarjeta entera (y con ella la
  // página), así que se comprueba antes de usar.
  const expiraEn =
    poll.expiresAt && typeof poll.expiresAt.toMillis === 'function'
      ? poll.expiresAt
      : null;

  const caducada = expiraEn != null && expiraEn.toMillis() <= now;
  const cerrada = poll.isClosed || caducada;

  const editable = !cerrada && (miOpcion === null || poll.allowChangeVote);

  return {
    question: poll.question,
    options: opciones.map((o) => ({
      ...o,
      votes: counts[o.id] ?? 0,
      // Se reparte el 100% entre las opciones que tienen votos:
      // con una sola persona que vote, su opción tiene que
      // poner 100% y no 20%.
      porcentaje:
        total > 0 ? Math.round(((counts[o.id] ?? 0) / total) * 100) : 0,
      mia: miOpcion === o.id,
    })),
    totalVotes: total,
    haVotado: miOpcion !== null,
    miOpcion,
    cerrada,
    votoFijo: miOpcion !== null && !poll.allowChangeVote,
    editable,
    segundosRestantes:
      expiraEn != null ? Math.max(0, Math.floor((expiraEn.toMillis() - now) / 1000)) : null,
  };
}

/**
 * Abre o cierra una encuesta.
 *
 * Lo pueden hacer el autor del hilo y el equipo (admin o
 * moderador): es una cuenta de lo emitida, no un dato sensible.
 * Las reglas de Firestore lo comprueban en el servidor
 * (`firestore.rules`, rama `poll.isClosed`).
 */
export async function setPollClosed(
  threadId: string,
  closed: boolean,
): Promise<void> {
  await updateDoc(pollRef(threadId), { 'poll.isClosed': closed });
}

/**
 * Pide al servidor que elimine la encuesta y todos sus votos.
 *
 * Es lo que hace la Cloud Function `gestionarEncuesta` cuando el
 * panel pide "eliminar encuesta": Firestore no borra en cascada,
 * y dejar los votos ahí sería dejar basura. El cliente solo llama
 * a la función; el borrado real va con el Admin SDK, que es lo
 * único que puede saltarse las reglas y leer los votos ajenos.
 *
 * Ya NO hay plan B desde el navegador: para que los votos sean
 * anónimos, las reglas tampoco dejan listarlos al equipo. Si la
 * función no está desplegada, el botón falla y se avisa; no se
 * abre un agujero para que funcione.
 */
export async function requestDeletePoll(threadId: string): Promise<number> {
  const llamar = httpsCallable<{ threadId: string; accion: string }, { borrados: number }>(
    functions,
    'gestionarEncuesta',
  );
  const res = await llamar({ threadId, accion: 'eliminar' });
  return res.data?.borrados ?? 0;
}

/** Elimina una encuesta entera, votos incluidos. */
export async function deletePollEverywhere(threadId: string): Promise<number> {
  return requestDeletePoll(threadId);
}

/** Texto para "1 voto" / "3 votos", en el singular que toca. */
export function votos(n: number): string {
  return `${n} ${n === 1 ? 'voto' : 'votos'}`;
}

/**
 * Momento en que se actualizó un resumen.
 *
 * Firestore devuelve `actualizadoAt` como Timestamp, aunque el tipo
 * lo declare string por comodidad. El cliente lo usa para no dejar
 * que una instantánea anterior al voto pise la actualización
 * optimista.
 */
export function fechaResumenEnMs(
  resumen: PollSummary | null | undefined,
): number | null {
  const valor = resumen?.actualizadoAt as unknown;

  if (
    valor &&
    typeof valor === 'object' &&
    typeof (valor as { toMillis?: unknown }).toMillis === 'function'
  ) {
    return (valor as { toMillis: () => number }).toMillis();
  }

  if (typeof valor === 'string') {
    const ms = Date.parse(valor);
    return Number.isFinite(ms) ? ms : null;
  }

  return null;
}
