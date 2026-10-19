import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import { CLUBS } from './clubs';
import { toIsoString } from './firestoreUtils';
import {
  calcularFin,
  estadoDe,
  motivoValido,
  puedeAdvertir,
  puedeLevantar,
  puedeSancionar,
  rangoEnClub,
  PERMISOS_DELEGABLES,
} from '../data/clubModeracion';
import type {
  Club,
  ClubModeracionEvento,
  ClubPermisos,
  ClubRango,
  ClubRole,
  ClubSancion,
  SancionTipo,
} from '../types';

// ======================================================
// SANCIONES DE CLUB
// ======================================================
//
// DÓNDE VIVE CADA COSA, Y POR QUÉ:
//
// 1. `clubs/{clubId}/sancion/{uid}`  → la sanción VIGENTE de
//    una persona. El id del documento ES su uid, y eso no es
//    casualidad: las reglas de Firestore solo pueden consultar
//    la ruta exacta de un documento (`exists()` y `get()` no
//    admiten consultas), así que al preguntar siempre por la
//    persona que está escribiendo (`request.auth.uid`), tener el
//    id predetermined hace que el bloqueo se pueda comprobar en
//    el servidor. Con un id automático, no se podría.
//
//    Este documento se BORRA al levantar la sanción o al
//    caducar (la caducidad la decide la regla comparando
//    `expira` con `request.time`, no un temporizador del
//    navegador: cerrar y abrir sesión no lo reactivaría).
//
// 2. `clubs/{clubId}/sanciones/{autoId}` → el HISTORIAL, un
//    documento por acción (silencio, baneo, retirada, cambio de
//    rango). Solo se crea: `allow update, delete: if false`.
//    Es la trazabilidad que consulta el propietario si hay una
//    disputa.
//
// Las dos escrituras de aplicar una sanción van en un ÚNICO
// lote para que no exista un instante con el historial escrito y
// el bloqueo sin poner (o al revés): en ese hueco, la persona
// sancionada todavía podría escribir.
// ======================================================

/** Sanciones vigentes (id = uid). */
const SANCION_ACTIVA = 'sancion';
/** Historial de acciones. */
const SANCIONES = 'sanciones';

export interface ResultadoSancion {
  ok: boolean;
  error?: string;
  /** La sanción creada, para pintarla sin esperar al listener. */
  sancion?: ClubSancion;
}

/** Lee un documento de historial y lo tipa. */
function mapearSancion(id: string, data: Record<string, unknown>): ClubSancion {
  const rango = data.aplicadaPorRango;
  return {
    id,
    clubId: typeof data.clubId === 'string' ? data.clubId : '',
    tipo:
      data.tipo === 'baneo'
        ? 'baneo'
        : data.tipo === 'advertencia'
          ? 'advertencia'
          : 'silencio',
    objetivoUid: typeof data.objetivoUid === 'string' ? data.objetivoUid : '',
    objetivoNombre: typeof data.objetivoNombre === 'string' ? data.objetivoNombre : '',
    motivo: typeof data.motivo === 'string' ? data.motivo : '',
    inicio: toIsoString(data.inicio),
    fin: data.fin == null ? null : toIsoString(data.fin),
    permanente: data.permanente === true,
    aplicadaPor: typeof data.aplicadaPor === 'string' ? data.aplicadaPor : '',
    aplicadaPorNombre:
      typeof data.aplicadaPorNombre === 'string' ? data.aplicadaPorNombre : '',
    aplicadaPorRango:
      rango === 'owner' || rango === 'admin' || rango === 'moderator' ? rango : 'member',
    retirada: data.retirada === true,
    retiradaPor: typeof data.retiradaPor === 'string' ? data.retiradaPor : undefined,
    retiradaPorNombre:
      typeof data.retiradaPorNombre === 'string' ? data.retiradaPorNombre : undefined,
    retiradaEn: data.retiradaEn == null ? undefined : toIsoString(data.retiradaEn),
    motivoRetirada:
      typeof data.motivoRetirada === 'string' ? data.motivoRetirada : undefined,
    createdAt: toIsoString(data.createdAt),
  };
}

/** Sanciones vivas de un club (las vigentes), para pintar avisos. */
function mapearActiva(id: string, data: Record<string, unknown>): ClubSancion {
  const rango = data.aplicadaPorRango;
  return {
    id,
    clubId: typeof data.clubId === 'string' ? data.clubId : '',
    tipo: data.tipo === 'baneo' ? 'baneo' : 'silencio',
    objetivoUid: id,
    objetivoNombre: typeof data.objetivoNombre === 'string' ? data.objetivoNombre : '',
    motivo: typeof data.motivo === 'string' ? data.motivo : '',
    inicio: toIsoString(data.inicio),
    fin: data.fin == null ? null : toIsoString(data.fin),
    permanente: data.permanente === true,
    aplicadaPor: typeof data.aplicadaPor === 'string' ? data.aplicadaPor : '',
    aplicadaPorNombre:
      typeof data.aplicadaPorNombre === 'string' ? data.aplicadaPorNombre : '',
    aplicadaPorRango:
      rango === 'owner' || rango === 'admin' || rango === 'moderator' ? rango : 'member',
    retirada: false,
    createdAt: toIsoString(data.inicio),
  };
}

/**
 * Aplica un silencio o un baneo.
 *
 * El cliente valida lo mismo que validan las reglas (permisos,
 * jerarquía, motivo obligatorio) para poder avisar al momento sin
 * una escritura rechazada. El candado está en el servidor: si
 * alguien manipulase esta función, las reglas la rechazarían
 * igual.
 */
export async function aplicarSancion(params: {
  club: Club;
  actorUid: string;
  actorNombre: string;
  objetivoUid: string;
  objetivoNombre: string;
  tipo: SancionTipo;
  /** Duración en ms. `null` = permanente (solo válido para baneo). */
  duracionMs: number | null;
  motivo: string;
}): Promise<ResultadoSancion> {
  const { club, actorUid, actorNombre, objetivoUid, objetivoNombre, tipo, duracionMs } =
    params;

  const motivo = motivoValido(params.motivo);
  if (!motivo) return { ok: false, error: 'Escribe un motivo de al menos 5 caracteres.' };

  const { fin, permanente } = calcularFin(duracionMs, tipo);
  const permiso = puedeSancionar(club, actorUid, objetivoUid, tipo, permanente);
  if (!permiso.ok) return { ok: false, error: permiso.motivo };

  // Dos sanciones encadenadas no tienen sentido: se levanta la
  // anterior y se aplica la nueva, para que el historial cuente
  // la verdad. La razón de levantarla se anota.
  const refActiva = doc(db, CLUBS, club.id, SANCION_ACTIVA, objetivoUid);
  const previa = await getDoc(refActiva);
  let liftPrevia: ClubSancion | null = null;
  if (previa.exists()) {
    liftPrevia = mapearActiva(objetivoUid, previa.data());
    if (estadoDe(liftPrevia) === 'activa') {
      return {
        ok: false,
        error: 'Esa persona ya tiene una sanción activa en este club.',
      };
    }
  }

  const rangoActor = rangoEnClub(club, actorUid) ?? 'member';
  const inicioIso = new Date().toISOString();
  // El cargo que tenía ANTES del baneo. El baneo saca a la
  // persona del club, así que al desbanearla hay que devolverla
  // con el cargo que tenía: si no, un moderador baneado
  // volvería como miembro normal sin que nadie lo decidiera.
  const rolPrevio = club.members?.[objetivoUid]?.role ?? 'member';

  const registro = {
    clubId: club.id,
    tipo,
    objetivoUid,
    objetivoNombre,
    motivo,
    inicio: inicioIso,
    fin,
    permanente,
    aplicadaPor: actorUid,
    aplicadaPorNombre: actorNombre,
    aplicadaPorRango: rangoActor,
    retirada: false,
    ...(tipo === 'baneo' ? { rolPrevio } : {}),
    createdAt: serverTimestamp(),
  };

  const docActiva = {
    clubId: club.id,
    tipo,
    objetivoUid,
    objetivoNombre,
    motivo,
    inicio: serverTimestamp(),
    // Timestamp de verdad: es contra `request.time` con lo que
    // comparan las reglas. Un ISO en texto no se puede comparar.
    expira: fin ? Timestamp.fromDate(new Date(fin)) : null,
    permanente,
    aplicadaPor: actorUid,
    aplicadaPorNombre: actorNombre,
    aplicadaPorRango: rangoActor,
    ...(tipo === 'baneo' ? { rolPrevio } : {}),
  };

  try {
    const batch = writeBatch(db);
    batch.set(refActiva, docActiva);

    // El baneo expulsa: sin estar en `memberIds` no entra al
    // chat del club ni puede reincorporarse mientras dure.
    const miembros = { ...(club.members ?? {}) };
    const memberIdsAntes = (await getDoc(doc(db, CLUBS, club.id))).data()?.memberIds;
    if (tipo === 'baneo') {
      delete miembros[objetivoUid];
    } else if (miembros[objetivoUid]) {
      // Reflejo en la ficha: es lo que ya leía el chat, para que
      // el aviso salga sin depender de leer la subcolección.
      miembros[objetivoUid] = {
        ...miembros[objetivoUid],
        mutedUntil: fin ?? undefined,
      };
    }
    batch.update(doc(db, CLUBS, club.id), {
      members: miembros,
      ...(tipo === 'baneo'
        ? {
            memberIds: Array.isArray(memberIdsAntes)
              ? memberIdsAntes.filter((m: string) => m !== objetivoUid)
              : Object.keys(miembros),
            memberCount: Object.keys(miembros).length,
          }
        : {}),
      updatedAt: serverTimestamp(),
    });

    await batch.commit();

    const hist = await addDoc(collection(db, CLUBS, club.id, SANCIONES), registro);

    return {
      ok: true,
      sancion: {
        ...mapearSancion(hist.id, { ...registro, createdAt: inicioIso }),
        inicio: inicioIso,
      },
    };
  } catch (e: unknown) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'No se pudo aplicar la sanción.',
    };
  }
}

/**
 * Levanta una sanción vigente.
 *
 * Borra el documento de `sancion/{uid}` (para que deje de
 * bloquear) y deja constancia en el historial. El documento
 * histórico NO se toca.
 */
export async function levantarSancion(params: {
  club: Club;
  actorUid: string;
  actorNombre: string;
  objetivoUid: string;
  objetivoNombre: string;
  motivoRetirada?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { club, actorUid, actorNombre, objetivoUid, objetivoNombre } = params;

  const refActiva = doc(db, CLUBS, club.id, SANCION_ACTIVA, objetivoUid);
  const snap = await getDoc(refActiva);
  if (!snap.exists()) return { ok: false, error: 'Esa persona no tiene ninguna sanción.' };

  const vigente = mapearActiva(objetivoUid, snap.data());
  const permiso = puedeLevantar(club, actorUid, vigente);
  if (!permiso.ok) return { ok: false, error: permiso.motivo };
  if (estadoDe(vigente) !== 'activa') {
    return { ok: false, error: 'Esa sanción ya no está activa.' };
  }

  const motivo = (params.motivoRetirada ?? '').trim().slice(0, 200);
  const rangoActor = rangoEnClub(club, actorUid) ?? 'member';

  try {
    const batch = writeBatch(db);
    batch.delete(refActiva);

    const miembros = { ...(club.members ?? {}) };

    if (vigente.tipo === 'baneo') {
      // El baneo SACÓ a la persona del club, así que al
      // desbanearla hay que devolverla: si no, se quedaba fuera
      // para siempre y el baneo era una expulsión sin vuelta atrás.
      // Vuelve con el cargo que tenía antes, no con el que le
      // toque por defecto.
      const rolPrevio =
        (snap.data().rolPrevio as ClubRole | undefined) ?? 'member';
      if (!miembros[objetivoUid]) {
        miembros[objetivoUid] = {
          uid: objetivoUid,
          role: rolPrevio,
          joinedAt: new Date().toISOString(),
        };
      }
    } else if (miembros[objetivoUid]) {
      // Un silencio no saca a nadie del club: solo se limpia la
      // marca para que pueda escribir otra vez.
      const { mutedUntil: _fuera, ...resto } = miembros[objetivoUid];
      miembros[objetivoUid] = resto;
    }

    // `memberIds` es la lista espejo que leen las reglas, así que
    // va en la misma escritura que `members`.
    const memberIdsAntes = (await getDoc(doc(db, CLUBS, club.id))).data()?.memberIds;
    const memberIds = Array.isArray(memberIdsAntes)
      ? memberIdsAntes
      : Object.keys(miembros);
    if (vigente.tipo === 'baneo' && !memberIds.includes(objetivoUid)) {
      memberIds.push(objetivoUid);
    }

    batch.update(doc(db, CLUBS, club.id), {
      members: miembros,
      memberIds,
      memberCount: Object.keys(miembros).length,
      updatedAt: serverTimestamp(),
    });

    // La entrada del historial va con id automático. `doc()` con
    // una ruta de COLECCIÓN (clubs/{id}/sanciones) no vale:
    // `doc()` necesita una ruta de documento, y una de colección
    // son 3 segmentos impares. Para eso está `collection()`:
    // `doc(collection(...))` genera el id.
    batch.set(doc(collection(db, CLUBS, club.id, SANCIONES)), {
      clubId: club.id,
      accion: 'retirada',
      tipo: vigente.tipo,
      objetivoUid,
      objetivoNombre,
      aplicadoSobreId: vigente.id,
      motivo: motivo || 'Sin motivo indicado.',
      inicio: vigente.inicio,
      fin: vigente.fin,
      permanente: false,
      aplicadaPor: actorUid,
      aplicadaPorNombre: actorNombre,
      aplicadaPorRango: rangoActor,
      retirada: true,
      createdAt: serverTimestamp(),
    });

    await batch.commit();
    return { ok: true };
  } catch (e: unknown) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'No se pudo levantar la sanción.',
    };
  }
}

/**
 * Avisa a un miembro SIN sanctionarlo.
 *
 * Un aviso no bloquea nada: no hay documento de sanción viva,
 * solo una entrada en el historial del club. Es lo que usa el
 * moderador para decir «va en serio» sin castigar de más, y
 * queda constancia de que se le dijo.
 *
 * Requiere el permiso `moderadorAdvierte` (viene encendido de
 * serie, pero el propietario puede apagarlo).
 */
export async function advertirMiembro(params: {
  club: Club;
  actorUid: string;
  actorNombre: string;
  objetivoUid: string;
  objetivoNombre: string;
  motivo: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { club, actorUid, actorNombre, objetivoUid, objetivoNombre } = params;
  const motivo = motivoValido(params.motivo);
  if (!motivo) return { ok: false, error: 'Escribe un motivo de al menos 5 caracteres.' };

  if (!puedeAdvertir(club, actorUid)) {
    return { ok: false, error: 'No tienes permiso para advertir en este club.' };
  }
  if (rangoEnClub(club, objetivoUid) === null) {
    return { ok: false, error: 'Esa persona ya no es miembro del club.' };
  }
  if (rangoEnClub(club, actorUid) === 'member') {
    return { ok: false, error: 'Solo el equipo del club puede advertir.' };
  }

  try {
    await addDoc(collection(db, CLUBS, club.id, SANCIONES), {
      clubId: club.id,
      tipo: 'advertencia',
      objetivoUid,
      objetivoNombre,
      motivo,
      inicio: new Date().toISOString(),
      // Un aviso no caduca: es un hecho, no una sanción.
      fin: null,
      permanente: false,
      aplicadaPor: actorUid,
      aplicadaPorNombre: actorNombre,
      aplicadaPorRango: rangoEnClub(club, actorUid) ?? 'member',
      retirada: false,
      createdAt: serverTimestamp(),
    });
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'No se pudo enviar el aviso.' };
  }
}

/**
 * Escucha el historial de sanciones de un club.
 *
 * Solo se monta en el panel de moderación: el chat no necesita
 * el listado, y traerlo siempre serían documentos de más en cada
 * apertura.
 */
export function subscribeHistorial(
  clubId: string,
  alCambiar: (sanciones: ClubSancion[]) => void,
  alError?: (e: Error) => void,
): () => void {
  return onSnapshot(
    query(collection(db, CLUBS, clubId, SANCIONES), orderBy('createdAt', 'desc')),
    (snap) => alCambiar(snap.docs.map((d) => mapearSancion(d.id, d.data()))),
    (e) => alError?.(e),
  );
}

/**
 * Escucha la sanción vigente de UNA persona.
 *
 * Es una lectura de un solo documento por el id de su uid: lo
 * mínimo que hace falta para el aviso del chat, y solo mientras
 * ese chat está abierto.
 */
export function subscribeSancionPropia(
  clubId: string,
  uid: string | null,
  alCambiar: (sancion: ClubSancion | null) => void,
  alError?: (e: Error) => void,
): () => void {
  if (!uid) {
    alCambiar(null);
    return () => {};
  }
  return onSnapshot(
    doc(db, CLUBS, clubId, SANCION_ACTIVA, uid),
    (snap) => alCambiar(snap.exists() ? mapearActiva(uid, snap.data()) : null),
    (e) => alError?.(e),
  );
}

/**
 * Sanciones vigentes de varios miembros a la vez (panel).
 *
 * Cada documento va por su uid, así que se leen uno a uno. El
 * panel solo lo abre el equipo y solo mientras está abierto.
 */
export async function leerSancionesVigentes(
  clubId: string,
  uids: string[],
): Promise<ClubSancion[]> {
  if (uids.length === 0) return [];
  const snaps = await Promise.all(
    uids.map((uid) => getDoc(doc(db, CLUBS, clubId, SANCION_ACTIVA, uid))),
  );
  return snaps
    .map((s, i) => (s.exists() ? mapearActiva(uids[i], s.data()) : null))
    .filter((s): s is ClubSancion => s !== null);
}

/** Bitácora de cambios de rango (append-only). */
export async function registrarCambioRango(params: {
  clubId: string;
  actorUid: string;
  actorNombre: string;
  objetivoUid: string;
  objetivoNombre: string;
  rango: ClubRango;
}): Promise<void> {
  try {
    await addDoc(collection(db, CLUBS, params.clubId, SANCIONES), {
      clubId: params.clubId,
      accion: 'rol',
      tipo: 'silencio',
      objetivoUid: params.objetivoUid,
      objetivoNombre: params.objetivoNombre,
      motivo: `Rango cambiado a ${params.rango}.`,
      inicio: new Date().toISOString(),
      fin: null,
      permanente: false,
      aplicadaPor: params.actorUid,
      aplicadaPorNombre: params.actorNombre,
      aplicadaPorRango: 'owner',
      retirada: false,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.warn('[Clubes] No se pudo registrar el cambio de rango:', e);
  }
}

/** Lectura del historial con el tipo correcto, para el panel. */
export function subscribeEventos(
  clubId: string,
  alCambiar: (eventos: ClubModeracionEvento[]) => void,
  alError?: (e: Error) => void,
): () => void {
  return subscribeHistorial(
    clubId,
    (lista) =>
      alCambiar(
        lista.map((s) => ({
          id: s.id,
          clubId: s.clubId,
          accion: (s.retirada ? 'retirada' : s.motivo.startsWith('Rango cambiado')
            ? 'rol'
            : s.tipo) as ClubModeracionEvento['accion'],
          objetivoUid: s.objetivoUid,
          objetivoNombre: s.objetivoNombre,
          actorId: s.aplicadaPor,
          actorNombre: s.aplicadaPorNombre,
          actorRango: s.aplicadaPorRango,
          motivo: s.motivo,
          fin: s.fin,
          createdAt: s.createdAt,
        })),
      ),
    alError,
  );
}

// ────────────────────────────────────────────────────────
// ROLES Y PERMISOS DEL EQUIPO
// ────────────────────────────────────────────────────────

/**
 * Nombra o retira a un moderador o a un administrador.
 *
 * Solo el propietario (lo comprueban las reglas). Se escribe en
 * `adminIds`/`moderatorIds` y en el reflejo `members[uid].role`
 * en el MISMO lote: por separado habría un instante con el rol
 * pintado y sin autoridad, o al revés.
 *
 * Nombrar a un moderador como admin lo quita de
 * `moderatorIds`: así solo hay una lista donde buscarlo y nadie
 * puede ser las dos cosas.
 */
export async function cambiarRangoEquipo(params: {
  clubId: string;
  actorUid: string;
  actorNombre: string;
  uid: string;
  nombre: string;
  rango: 'admin' | 'moderator' | 'member';
}): Promise<{ ok: boolean; error?: string }> {
  const { clubId, actorUid, actorNombre, uid, nombre, rango } = params;
  const ref = doc(db, CLUBS, clubId);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return { ok: false, error: 'El club ya no existe.' };
    const data = snap.data();

    if (data.ownerId === uid) {
      return { ok: false, error: 'El propietario no puede cambiar su propio rango.' };
    }
    if (actorUid === uid) {
      return { ok: false, error: 'No puedes cambiarte tu propio rango.' };
    }
    if (!(uid in ((data.members ?? {}) as Record<string, unknown>))) {
      return { ok: false, error: 'Esa persona ya no es miembro del club.' };
    }

    const mods = (data.moderatorIds ?? []) as string[];
    const admins = (data.adminIds ?? []) as string[];
    const miembros = { ...((data.members ?? {}) as Record<string, { role: string }>) };

    const quitar = (lista: string[]) => lista.filter((m) => m !== uid);

    let nuevosMods = quitar(mods);
    let nuevosAdmins = quitar(admins);
    if (rango === 'moderator') nuevosMods = [...nuevosMods, uid];
    if (rango === 'admin') nuevosAdmins = [...nuevosAdmins, uid];

    miembros[uid] = { ...miembros[uid], role: rango };

    await updateDoc(ref, {
      moderatorIds: nuevosMods,
      adminIds: nuevosAdmins,
      members: miembros,
      updatedAt: serverTimestamp(),
    });

    await registrarCambioRango({
      clubId,
      actorUid,
      actorNombre,
      objetivoUid: uid,
      objetivoNombre: nombre,
      rango,
    });

    return { ok: true };
  } catch (e: unknown) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'No se pudo cambiar el rango.',
    };
  }
}

/**
 * El propietario guarda qué permisos delega.
 *
 * Se escriben TODOS los permisos, encendidos o apagados: así
 * queda constancia de lo que el propietario decidió, y apagar
 * uno que venía por defecto es tan solo un `false` (si la clave
 * no estuviera, el club usaría el valor por defecto y no se
 * podría quitar nada).
 *
 * Solo el propietario puede llamarlo: las reglas dejan el
 * campo `permisos` únicamente en su rama.
 */
export async function guardarPermisos(
  clubId: string,
  permisos: ClubPermisos,
): Promise<{ ok: boolean; error?: string }> {
  const p = permisos as Record<string, unknown>;
  const salir: Record<string, boolean> = {};
  for (const info of PERMISOS_DELEGABLES) {
    salir[info.id] = p[info.id] === true;
  }
  try {
    await updateDoc(doc(db, CLUBS, clubId), {
      permisos: salir,
      updatedAt: serverTimestamp(),
    });
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'No se pudieron guardar.' };
  }
}