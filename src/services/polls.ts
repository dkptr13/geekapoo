import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
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
// ── Por qué la configuración NO lleva contadores ───────────
//
// Lo natural sería guardar `votes` en cada opción, pero eso
// obliga a que el cliente escriba el número que él mismo ha
// calculado, y las reglas de Firestore no tienen forma de
// comprobar que ese número corresponda con el voto que se está
// creando en ese momento. Con lo único que se puede atar es con
// la seguridad de los propios documentos de voto:
//
//   - El id es el uid, así que no hay dos votos de la misma
//     persona, y NO se pueden borrar (no hay `allow delete`).
//   - `optionId` tiene que existir en las opciones de la
//     encuesta.
//   - Solo se puede cambiar de opinión si el autor activó
//     `allowChangeVote`, y nunca en una encuesta cerrada o
//     caducada.
//
// Con eso, el número de votos se obtiene contando documentos:
// no hay contador que nadie pueda mentir. El resumen de
// `pollStats` lo calcula la Cloud Function con el Admin SDK y es
// una caché para estadísticas, orden y el panel de
// administración (ver `onPollVotesChanged` en
// `functions/src/index.ts`).

export const POLL_VOTES = 'pollVotes';
export const POLL_STATS = 'pollStats';

export const LIMITS = {
  question: 160,
  option: 80,
  minOptions: 2,
  maxOptions: 6,
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
 * Escucha los votos de una encuesta.
 *
 * Solo se suscribe la encuesta que se está viendo, así que abrir
 * veinte hilos no abre veinte escuchas de votos: únicamente las
 * de las tarjetas que se han abierto.
 *
 * El límite de 400 es una red de seguridad: una encuesta con más
 * votos que eso no cabe en una lectura, y sin tope Firestore
 * devolvería un error y se vería la tarjeta en blanco. Con el
 * tope, como mucho se ve el resumen del servidor.
 */
export function listenPollVotes(
  threadId: string,
  alCambiar: (votes: PollVoteRow[], error?: Error) => void,
): () => void {
  return onSnapshot(
    // Sin filtros ni órdenes a propósito: la subcolección entera
    // son los votos de esa encuesta, y así la consulta no
    // depende de ningún índice compuesto.
    query(collection(db, 'threads', threadId, POLL_VOTES), limit(TOPE_VOTOS_ESCUCHA)),
    (snap) => {
      const votes: PollVoteRow[] = snap.docs.map((d) => ({
        id: d.id,
        userId: String(d.data().userId ?? d.id),
        optionId: String(d.data().optionId ?? ''),
      }));
      alCambiar(votes.filter((v) => v.optionId !== ''));
    },
    (e) => {
      console.error('[Encuestas] Error escuchando los votos:', e);
      alCambiar([], e);
    },
  );
}

/**
 * Tope de votos que trae una escucha.
 *
 * No es un límite inventado: Firestore entrega 1 MB por lectura y
 * un documento de voto son unos 100 bytes, así que a partir de
 * unos miles la propia plataforma se complaintaría. Con 400 votos
 * de margen, el día que se llegue al tope entra el resumen del
 * servidor (ver `leerResumen`).
 */
export const TOPE_VOTOS_ESCUCHA = 400;

/**
 * Lee el resumen que calcula el servidor.
 *
 * Solo se usa cuando los votos NO caben en una escucha. Es una
 * caché, pero la mantiene la Cloud Function contando los
 * documentos de verdad, así que no es un número que se pueda
 * inventar ni desde el cliente ni desde la consola.
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
 * `resumen` es opcional: si se pasa, sus totales sustituyen a los
 * que saldrían de contar `votes`, para el caso de una encuesta
 * con más votos de los que trae una escucha.
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

/** Borra el campo `poll` del hilo (lo deja sin encuesta). */
export async function clearPoll(threadId: string): Promise<void> {
  await updateDoc(pollRef(threadId), { poll: null });
}

/**
 * Lectura de los votos para el panel de administración.
 *
 * No es una escucha: el panel solo los necesita cuando alguien
 * pide ver las estadísticas de una encuesta, y una lectura suelta
 * sale más barato que dejar una escucha abierta.
 */
export async function readPollVotes(threadId: string): Promise<PollVoteRow[]> {
  const snap = await getDocs(
    query(collection(db, 'threads', threadId, POLL_VOTES), limit(1000)),
  );
  return snap.docs.map((d) => ({
    id: d.id,
    userId: String(d.data().userId ?? d.id),
    optionId: String(d.data().optionId ?? ''),
  }));
}

/**
 * Pide al servidor que elimine la encuesta y todos sus votos.
 *
 * Es lo que hace la Cloud Function `gestionarEncuesta` cuando el
 * panel pide "eliminar encuesta": Firestore no borra en cascada,
 * y dejar los votos ahí sería dejar basura que además se
 * seguiría leyendo. El cliente solo llama a la función; el
 * borrado real va con el Admin SDK, que es lo único que puede
 * saltarse las reglas.
 */
export async function requestDeletePoll(threadId: string): Promise<number> {
  const llamar = httpsCallable<{ threadId: string; accion: string }, { borrados: number }>(
    functions,
    'gestionarEncuesta',
  );
  const res = await llamar({ threadId, accion: 'eliminar' });
  return res.data?.borrados ?? 0;
}

/**
 * Borra los votos desde el propio navegador, por si la Cloud
 * Function no está desplegada.
 *
 * Las reglas SÍ dejan que el equipo borre votos sueltos
 * (`allow delete: if isModerator()`), así que esto funciona sin
 * desplegar nada. Es el plan B, no el bueno: son dos viajes por
 * cada 200 votos y no toca el resumen del servidor, que para eso
 * está `pollStats`. Por eso solo se usa cuando la función no está
 * desplegada, y avisando por la consola para que nadie piense
 * que ha ido todo bien.
 */
async function borrarVotosDesdeCliente(threadId: string): Promise<number> {
  console.warn(
    '[Encuestas] La función gestionarEncuesta no está desplegada; se borran los votos ' +
      'desde el cliente (más lento y sin tocar el resumen del servidor).',
  );

  let borrados = 0;

  for (;;) {
    const snap = await getDocs(
      query(collection(db, 'threads', threadId, POLL_VOTES), limit(200)),
    );
    if (snap.empty) break;

    const lote = writeBatch(db);
    snap.docs.forEach((d) => lote.delete(d.ref));
    await lote.commit();
    borrados += snap.size;

    if (borrados > 2000) break;
  }

  await clearPoll(threadId);
  return borrados;
}

/**
 * Elimina una encuesta entera, votes included.
 *
 * Intenta la Cloud Function (que es lo correcto, porque usa el
 * Admin SDK) y, si no está desplegada, cae al borrado desde el
 * cliente para que el botón del panel no se quede muerto.
 */
export async function deletePollEverywhere(threadId: string): Promise<number> {
  try {
    return await requestDeletePoll(threadId);
  } catch (e) {
    const code = (e as { code?: string })?.code ?? '';
    if (code.includes('not-found') || code.includes('unavailable') || code.includes('internal')) {
      return borrarVotosDesdeCliente(threadId);
    }
    throw e;
  }
}

/** Texto para "1 voto" / "3 votos", en el singular que toca. */
export function votos(n: number): string {
  return `${n} ${n === 1 ? 'voto' : 'votos'}`;
}
