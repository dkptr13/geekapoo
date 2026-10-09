import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import type { ReactionTargetType } from '../types';

// ======================================================
// REPORTES DE CONTENIDO
// ======================================================
//
// Lo que escribe un usuario al denunciar un comentario o un
// hilo: "esto es spam". Y lo que encuentra el equipo en el
// panel para decidir qué hacer.
//
// ── Un reporte por persona y contenido ─────────────────────
//
// El id del documento es `{tipo}_{id del contenido}_{uid}`, que
// es lo mismo que se hizo con las reacciones y los votos de la
// trivia: al ser determinista, un usuario no puede llenar la
// cola de mil veces con el mismo comentario. Si quiere quitar el
// reporte porque se arrepiente, lo borra (y se lo puede
// permitir) y vuelve a escribirlo; lo que no puede es
// multiplicarlo.
//
// ── Por qué no se reutilizan los tickets de soporte ───────
//
// Un ticket es "no me funciona el buscador, escribo desde
// hola@example.com". Un reporte es "este comentario es un insulto"
// y va con el contenido al que apunta. Meterlos en la misma
// colección obligaría a los tickets a llevar un id de comentario
// y haría que la cola de soporte se llenara de quejas que
// nadie puede ordenar. Son dos colas distintas.
//
// ── Que un reporte no se pueda amañar ──────────────────────
//
// El usuario escribe el motivo y una explicación libre, y no
// puede escribir el estado, ni a quién se le ha avisado, ni la
// acción que se ha tomado: las reglas lo limitan a las seis
// claves de abajo. Y el contenido señalado tiene que existir,
// que es lo que impide inventarse mil reportes de hilos
// borrados.

export const REPORTS = 'reports';

/** Motivos. Texto cerrado para que el equipo pueda agrupar. */
export const MOTIVOS = [
  { id: 'spam', label: 'Spam o publicidad', emoji: '📢' },
  { id: 'insulto', label: 'Insulto o acoso', emoji: '😠' },
  { id: 'contenido-inapropiado', label: 'Contenido inapropiado', emoji: '🚫' },
  { id: 'spoiler', label: 'Spoiler sin avisar', emoji: '💣' },
  { id: 'otro', label: 'Otra cosa', emoji: '❓' },
] as const;

export type MotivoReporte = (typeof MOTIVOS)[number]['id'];

/** Lo que se puede denunciar: un hilo o un comentario. */
export type ReportableTarget = Extract<ReactionTargetType, 'thread' | 'comment'>;

/** Cómo está un reporte. Solo el equipo lo cambia. */
export type EstadoReporte = 'pendiente' | 'resuelto' | 'descartado';

export interface ContentReport {
  id: string;
  /** `thread` o `comment`. */
  targetType: ReportableTarget;
  targetId: string;
  /** Quién denuncia. */
  reportadoPor: string;
  reportadoPorNombre: string;
  motivo: MotivoReporte;
  /** Texto libre del usuario. */
  detalle?: string;
  estado: EstadoReporte;
  /** Lo rellena el equipo al cerrar el reporte. */
  resueltoPor?: string;
  resueltoAt?: string;
  /** Qué se hizo con el contenido: borrarlo o dejarlo. */
  accion?: 'borrado' | 'nada';
  createdAt: string;
}

/** Id determinista: un reporte por persona y contenido. */
export function reportId(
  targetType: ReportableTarget,
  targetId: string,
  uid: string,
): string {
  return `${targetType}_${targetId}_${uid}`;
}

/**
 * Denuncia un comentario o un hilo.
 *
 * Devuelve `true` si se guardó. Si el usuario ya lo había
 * denunciado, las reglas rechazan la escritura (el documento ya
 * existe) y aquí se distingue para poder decir "ya lo has
 * reportado" en vez de un error seco.
 */
export async function reportContent(
  uid: string,
  userName: string,
  targetType: ReportableTarget,
  targetId: string,
  motivo: MotivoReporte,
  detalle?: string,
): Promise<'guardado' | 'ya-reportado'> {
  const ref = doc(db, REPORTS, reportId(targetType, targetId, uid));

  try {
    // El `detalle` solo se incluye si hay texto, y eso NO es
    // estética: el SDK de Firestore va con
    // `ignoreUndefinedProperties: false` (su valor por defecto), y
    // con eso un campo a `undefined` LANZA una excepción antes de
    // tocar el servidor ("Unsupported field value: undefined").
    //
    // Es justo lo que pasaba al enviar un reporte sin escribir la
    // explicación, que es lo más normal del mundo: la petición
    // moría en el navegador y el error que veía el usuario era un
    // "no se pudo enviar" sin ninguna pista de por qué.
    const detalleLimpio = (detalle ?? '').trim().slice(0, 500);

    await setDoc(
      ref,
      {
        targetType,
        targetId,
        reportadoPor: uid,
        reportadoPorNombre: userName,
        motivo,
        ...(detalleLimpio ? { detalle: detalleLimpio } : {}),
        estado: 'pendiente',
        createdAt: serverTimestamp(),
      },
      { merge: false },
    );
    return 'guardado';
  } catch (e) {
    const code = (e as { code?: string })?.code ?? '';
    if (code.includes('already-exists') || code.includes('permission-denied')) {
      // Con reglas, el segundo intento es un "already exists"
      // traducido por el SDK a PERMISSION_DENIED, así que se
      // comprueba si el documento está ahí para saber cuál de las
      // dos cosas ha pasado.
      const yaEsta = await yaReportado(targetType, targetId, uid);
      if (yaEsta) return 'ya-reportado';
    }
    throw e;
  }
}

/** Si esta persona ya ha denunciado ese contenido. */
async function yaReportado(
  targetType: ReportableTarget,
  targetId: string,
  uid: string,
): Promise<boolean> {
  try {
    // `getDoc` importado de forma normal, no con un
    // `import()` suelto: dentro de un try, un import dinámico que
    // falla se confunde con un fallo de permisos, y aquí justo
    // necesitamos distinguir los dos casos.
    const snap = await getDoc(doc(db, REPORTS, reportId(targetType, targetId, uid)));
    return snap.exists();
  } catch {
    // Si no se puede comprobar (permisos, red), se asume que sí:
    // es preferible decir "ya lo has reportado" a dejar que el
    // usuario repita la denuncia sin enterarse.
    return true;
  }
}

/** Retira un reporte (el propio, o el equipo al limpiar la cola). */
export async function deleteReport(reportId_: string): Promise<void> {
  await deleteDoc(doc(db, REPORTS, reportId_));
}

/**
 * Escucha la cola de reportes del equipo.
 *
 * Solo el equipo puede leerla (las reglas), así que no hace falta
 * filtrar por rol aquí. Filtra por estado para no arrastrar los
 * ya cerrados en cada cambio.
 */
export function listenReports(
  estado: EstadoReporte,
  alCambiar: (reportes: ContentReport[]) => void,
): () => void {
  return onSnapshot(
    query(
      collection(db, REPORTS),
      where('estado', '==', estado),
      orderBy('createdAt', 'desc'),
      limit(200),
    ),
    (snap) =>
      alCambiar(
        snap.docs.map((d) => {
          const data = d.data() as Omit<ContentReport, 'id'>;
          return { id: d.id, ...data };
        }),
      ),
    (e) => {
      console.error('[Reportes] Error escuchando la cola:', e);
      alCambiar([]);
    },
  );
}

/** Lee los reportes de una vez, para el resumen del panel. */
export async function countReports(estado: EstadoReporte): Promise<number> {
  const snap = await getDocs(
    query(collection(db, REPORTS), where('estado', '==', estado), limit(500)),
  );
  return snap.size;
}

/**
 * Cierra un reporte.
 *
 * Solo puede tocar el estado y lo que se hizo con el contenido:
 * el usuario que lo escribió no puede reopeninglo ni decir que se
 * borró algo, y las reglas tampoco se lo permiten.
 */
export async function resolveReport(
  id: string,
  estado: EstadoReporte,
  uid: string,
  accion?: 'borrado' | 'nada',
): Promise<void> {
  const { updateDoc } = await import('firebase/firestore');
  await updateDoc(doc(db, REPORTS, id), {
    estado,
    resueltoPor: uid,
    resueltoAt: serverTimestamp(),
    accion,
  });
}

/** Texto corto del motivo, para las tablas del panel. */
export function etiquetaMotivo(motivo: string): { texto: string; emoji: string } {
  const encontrado = MOTIVOS.find((m) => m.id === motivo);
  return {
    texto: encontrado?.label ?? 'Motivo desconocido',
    emoji: encontrado?.emoji ?? '❓',
  };
}
