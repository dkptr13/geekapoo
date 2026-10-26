import { deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore';

import { db } from '../lib/firebase';
import { DESTACADOS, EMOJIS, esClaveDeReaccion } from '../data/emojis';
import { reactionDocId } from './reactionLogic';
import type { ReactionTargetType, ReactionType } from '../types';

// La lógica pura (claves, contadores, "las tres más puestas") vive
// en `reactionLogic.ts`, sin Firestore, para poder comprobarla sin
// navegador. Aquí solo están las escrituras.
//
// Se reexporta para que los componentes sigan importando todo de
// un solo sitio, como se ha hecho siempre.
export * from './reactionLogic';

// ======================================================
// REACCIONES MÚLTIPLES
// ======================================================
//
// Son un sistema PARALELO al "Me gusta". Los "me gusta" siguen
// donde estaban (`likedBy` + `likesCount` en el documento, con
// su botón de corazón y su propio contador), así que no se
// pierde ni uno solo de los que ya había.
//
// ── El truco que evita las reacciones duplicadas ───────────
//
// Cada reacción es un documento cuyo id se COMPONE del
// objetivo y de la persona:
//
//     reac_<targetType>_<targetId>_<uid>
//
// Como el id es el mismo para todas las reacciones de una misma
// persona sobre un mismo contenido, no puede haber dos a la vez:
// o existe el documento (con un tipo) o no existe. Cambiar de 🔥
// a 😂 es un `update` del mismo documento, y quitarlo es borrar
// ese mismo documento. Las reglas de seguridad lo vuelven a
// comprobar por su cuenta (que el documento tenga ese nombre
// exacto), así que tampoco se puede falsear desde la consola.
//
// ── Qué se puede reaccionar ────────────────────────────────
//
// Hilos, comentarios (y respuestas, que son comentarios) y
// mensajes de chat. Los mensajes de chat no llevan contador
// agregado en su documento (se cuentan desde aquí), pero sí
// guardan su `chatId` para que las reglas puedan comprobar que
// quien lee o reacciona es miembro de ese chat. Es un campo
// obligatorio: sin él, la reacción se rechaza.
//
// Lectura: las reacciones de hilos y comentarios son públicas,
// como el contenido. Las de mensajes de chat solo las lee un
// miembro del chat. Por eso el hook no puede pedir todos los
// `targetId` en la misma consulta: separa por tipo y, en chats,
// filtra por `chatId`.
//
// ── Por qué los contadores no se escriben desde aquí ───────
//
// Los contadores que ve el usuario se CUENTAN a partir de estos
// documentos, que siempre son la verdad. El agregado
// (`reactionCounts` del hilo o del comentario) lo escribe la
// Cloud Function con el Admin SDK y las reglas prohíben que el
// cliente lo toque: un contador que escribe el mismo que lo lee
// se falsea con dos líneas en la consola del navegador.
//
// OJO, dos cosas que se pisaron entre sí una vez y hay que
// volver a mirar si se tocan otra vez:
//
//   - La clave de un objetivo (`reactionKey`) la arma el hook en
//     una "firma" y también la usa para filtrar lo que llega. Si
//     las dos se arman con separadores distintos, el filtro
//     descarta TODO y los contadores no se pintan nunca, sin
//     ningún error de JavaScript que lo delate.
//
//   - El botón de reaccionar usa `mia` (una reacción por
//     persona), que sigue funcionando aunque los contadores de los
//     demás no lleguen. Por eso se veía "la mía" y no la de nadie
//     más: el síntoma era "no se pintan los contadores", no "no
//     hay reacciones".
//
// Ver `onReactionChanged` en `functions/src/index.ts`.

export const REACTIONS = 'reactions';

/**
 * Los emojis y las clases de estilo viven en el catálogo
 * (`src/data/emojis.ts`); aquí solo se le añade lo que depende
 * de cómo se pinta, que es la paleta.
 *
 * Se mantiene el nombre `REACTION_META` porque lo usan varios
 * sitios y porque "meta" describe justo esto: el emoji más las
 * clases de Tailwind para pintarlo.
 */
export interface ReactionMeta {
  emoji: string;
  label: string;
  /** Borde y fondo del botón cuando esa reacción está puesta. */
  activa: string;
  /** Color del texto del contador cuando está seleccionada. */
  texto: string;
  /** Anillo que se dibuja al elegirla. */
  anillo: string;
}

/** Un color por grupo de emojis, para que la barra no sea un arcoíris. */
const PALETA: Record<string, Pick<ReactionMeta, 'activa' | 'texto' | 'anillo'>> = {
  destacados: {
    activa: 'border-orange-400/70 bg-orange-500/20',
    texto: 'text-orange-300',
    anillo: 'ring-orange-400/40',
  },
  caras: {
    activa: 'border-amber-400/70 bg-amber-500/20',
    texto: 'text-amber-300',
    anillo: 'ring-amber-400/40',
  },
  gestos: {
    activa: 'border-emerald-400/70 bg-emerald-500/20',
    texto: 'text-emerald-300',
    anillo: 'ring-emerald-400/40',
  },
  personas: {
    activa: 'border-sky-400/70 bg-sky-500/20',
    texto: 'text-sky-300',
    anillo: 'ring-sky-400/40',
  },
  corazones: {
    activa: 'border-pink-400/70 bg-pink-500/20',
    texto: 'text-pink-300',
    anillo: 'ring-pink-400/40',
  },
  animales: {
    activa: 'border-lime-400/70 bg-lime-500/20',
    texto: 'text-lime-300',
    anillo: 'ring-lime-400/40',
  },
  comida: {
    activa: 'border-orange-400/70 bg-orange-500/20',
    texto: 'text-orange-300',
    anillo: 'ring-orange-400/40',
  },
  actividades: {
    activa: 'border-yellow-400/70 bg-yellow-500/20',
    texto: 'text-yellow-300',
    anillo: 'ring-yellow-400/40',
  },
  objetos: {
    activa: 'border-teal-400/70 bg-teal-500/20',
    texto: 'text-teal-300',
    anillo: 'ring-teal-400/40',
  },
  simbolos: {
    activa: 'border-violet-400/70 bg-violet-500/20',
    texto: 'text-violet-300',
    anillo: 'ring-violet-400/40',
  },
};

const META_POR_DEFECTO = PALETA['simbolos'];

/** Emoji + paleta de cada reacción del catálogo. */
export const REACTION_META: Record<string, ReactionMeta> = EMOJIS.reduce(
  (acc, e) => {
    acc[e.key] = { emoji: e.emoji, label: e.label, ...(PALETA[e.categoria] ?? META_POR_DEFECTO) };
    return acc;
  },
  {} as Record<string, ReactionMeta>,
);

/**
 * Las reacciones "rápidas": las cinco de siempre, que salen en
 * la primera pantalla del selector.
 *
 * El catálogo tiene muchas más, pero llegar a 🔥 con un clic es
 * lo que hace que la gente use las reacciones en vez de
 * ignorarlas. El resto está a un botón de distancia.
 */
export const DESTACADAS: string[] = DESTACADOS.map((e) => e.key);

/**
 * Todas las reacciones del catálogo, en el orden en que se
 * enseñan. Antes eran cinco; ahora son todas, que es lo que
 * pidió el usuario: "todos los emojis, no solo esos cinco".
 */
export const REACTION_TYPES: string[] = EMOJIS.map((e) => e.key);

/**
 * Pone una reacción.
 *
 * `setDoc` con el id ya calculado y no `addDoc`: si la persona
 * ya tenía 🔥 y ahora elige 😂, lo que hay que hacer es cambiar
 * el `type` del documento que YA existe.
 *
 * Para los mensajes de chat hay que pasar `chatId`: sin él, las
 * reglas no pueden comprobar que quien escribe es miembro de ese
 * chat, y la reacción se rechaza.
 */
export async function setReaction(
  targetType: ReactionTargetType,
  targetId: string,
  uid: string,
  type: ReactionType,
  userName?: string,
  chatId?: string,
): Promise<void> {
  if (!esClaveDeReaccion(type)) {
    throw new Error('Esa reacción no existe.');
  }
  if (targetType === 'chat_message' && !chatId) {
    throw new Error('Falta el chat del mensaje al que se reacciona.');
  }

  await setDoc(
    doc(db, REACTIONS, reactionDocId(targetType, targetId, uid)),
    {
      targetType,
      targetId,
      userId: uid,
      type,
      // El nombre se guarda para poder listar quién reacciona con
      // qué sin leer cien perfiles. Es el mismo truco que usan los
      // comentarios con `authorName`.
      ...(userName ? { userName } : {}),
      ...(targetType === 'chat_message' && chatId ? { chatId } : {}),
      createdAt: new Date().toISOString(),
    },
    { merge: true },
  );
}

/** Cambia el tipo de una reacción ya puesta. */
export async function changeReactionType(
  targetType: ReactionTargetType,
  targetId: string,
  uid: string,
  type: ReactionType,
): Promise<void> {
  if (!esClaveDeReaccion(type)) {
    throw new Error('Esa reacción no existe.');
  }

  await updateDoc(doc(db, REACTIONS, reactionDocId(targetType, targetId, uid)), {
    type,
  });
}

/** Quita la reacción de una persona sobre un contenido. */
export async function removeReaction(
  targetType: ReactionTargetType,
  targetId: string,
  uid: string,
): Promise<void> {
  await deleteDoc(doc(db, REACTIONS, reactionDocId(targetType, targetId, uid)));
}

