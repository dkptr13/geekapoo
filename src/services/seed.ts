import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  setDoc,
  serverTimestamp,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import { CATEGORIES, TRIVIA_EXTRAS, MASCOT_DIALOGUES } from '../data/seedCatalog';
import { Anime } from '../types';

// ======================================================
// MIGRACIÓN DE DATOS: mockData.ts -> Firestore
// ======================================================
// Estas funciones SOLO se ejecutan desde el botón
// "Migrar datos" del panel de administración.
// Son idempotentes: si las vuelve a pulsar, no duplican nada.
// ======================================================

export interface StepReport {
  step: string;
  created: number;
  skipped: number;
  details: string;
}

export interface SeedReport {
  steps: StepReport[];
  ok: boolean;
}

// ────────────────────────────────────────────────────────
// 1. SIEMBRA DEL CATÁLOGO QUE NUNCA EXISTIÓ EN FIRESTORE
// ────────────────────────────────────────────────────────

async function seedCollectionIfEmpty(
  collectionName: string,
  items: { id: string }[],
  label: string,
): Promise<StepReport> {
  const ref = collection(db, collectionName);
  const existing = await getDocs(ref);

  if (!existing.empty) {
    return {
      step: label,
      created: 0,
      skipped: items.length,
      details: `La colección "${collectionName}" ya tenía ${existing.size} documentos. No se toca nada.`,
    };
  }

  const batch = writeBatch(db);
  items.forEach((item) => {
    batch.set(doc(db, collectionName, item.id), item);
  });
  await batch.commit();

  return {
    step: label,
    created: items.length,
    skipped: 0,
    details: `Escritos ${items.length} documentos en "${collectionName}".`,
  };
}

// ────────────────────────────────────────────────────────
// 2. NORMALIZACIÓN DE FECHAS
// ────────────────────────────────────────────────────────
// Los datos antiguos guardaban la fecha como texto ISO
// ("2026-09-27T18:30:00Z"). Los nuevos usan serverTimestamp(),
// que es un Timestamp. Si coexisten, orderBy('createdAt')
// falla en tiempo de ejecución. Esto convierte los textos
// ISO que ya existan en Timestamps reales.
// ────────────────────────────────────────────────────────

function toTimestamp(value: unknown): Timestamp | null {
  if (value instanceof Timestamp) return null; // ya es correcto
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (Number.isNaN(parsed)) return null;
    return Timestamp.fromDate(new Date(parsed));
  }
  if (value && typeof value === 'object' && 'seconds' in (value as object)) {
    return null; // ya viene como Timestamp
  }
  return null;
}

async function normalizeDatesIn(collectionName: string, fields: string[]): Promise<StepReport> {
  const snapshot = await getDocs(collection(db, collectionName));
  const batch = writeBatch(db);
  let converted = 0;

  snapshot.docs.forEach((d) => {
    const data = d.data() as Record<string, unknown>;
    const patch: Record<string, Timestamp> = {};

    fields.forEach((field) => {
      const ts = toTimestamp(data[field]);
      if (ts) {
        patch[field] = ts;
      }
    });

    if (Object.keys(patch).length > 0) {
      batch.set(d.ref, patch, { merge: true });
      converted++;
    }
  });

  if (converted > 0) await batch.commit();

  return {
    step: `Normalizar fechas en "${collectionName}"`,
    created: converted,
    skipped: snapshot.size - converted,
    details:
      converted > 0
        ? `${converted} de ${snapshot.size} documentos convertidos de texto ISO a Timestamp.`
        : `Los ${snapshot.size} documentos ya usaban Timestamp. Nada que hacer.`,
  };
}

// ────────────────────────────────────────────────────────
// 3. RECALCULAR animeCount DE LAS CATEGORÍAS
// ────────────────────────────────────────────────────────
// El campo animeCount venía hardcodeado (14, 28, 19...)
// y nunca se ajustaba al añadir o quitar animes.
// ────────────────────────────────────────────────────────

async function recomputeCategoryCounts(): Promise<StepReport> {
  const animesSnapshot = await getDocs(collection(db, 'animes'));
  const animes = animesSnapshot.docs.map((d) => d.data() as Anime);

  const batch = writeBatch(db);
  let updated = 0;

  for (const category of CATEGORIES) {
    // Anime.category guarda el NOMBRE de la categoría
    // ("Romance & Comedia"), no su id ("romance")
    const count = animes.filter((a) => a.category === category.name).length;
    batch.set(
      doc(db, 'categories', category.id),
      { animeCount: count },
      { merge: true },
    );
    updated++;
  }

  await batch.commit();

  return {
    step: 'Recalcular contador de animes por categoría',
    created: updated,
    skipped: 0,
    details: CATEGORIES.map(
      (c) => `${c.name}: ${animes.filter((a) => a.category === c.name).length}`,
    ).join(' · '),
  };
}

// ────────────────────────────────────────────────────────
// 3b. COMPLETAR CAMPOS QUE FALTAN EN LOS USUARIOS
// ────────────────────────────────────────────────────────
// Las cuentas creadas antes de esta migración no tienen "role"
// ni "chatId". Un usuario sin "role" no puede ser admin ni
// moderador porque isAdmin() compara contra null, y sin "chatId"
// el buscador de contactos no lo encuentra.
//
// "isBanned" ya NO se rellena aquí: las reglas tratan un campo
// ausente como "no baneado" (comprueban con `in` antes de leerlo)
// y el estado de sanción solo lo escribe el servidor. Un update
// del cliente que toque ese campo se rechaza, aunque sea para
// ponerlo a false.
// ────────────────────────────────────────────────────────

async function ensureUserFields(): Promise<StepReport> {
  const snapshot = await getDocs(collection(db, 'users'));
  const batch = writeBatch(db);
  let patched = 0;

  snapshot.docs.forEach((d) => {
    const data = d.data() as Record<string, unknown>;
    const patch: Record<string, unknown> = {};

    if (data.role === undefined) patch.role = 'user';
    if (data.lastSeen === undefined) patch.lastSeen = 'En línea';

    // El chatId es el identificador público que la gente escribe
    // para abrir un chat. Si falta, el buscador de contactos se
    // queda sin nada que comparar y no encuentra a nadie.
    if (typeof data.chatId !== 'string' || data.chatId.trim() === '') {
      const username = String(data.username ?? 'user');
      patch.chatId = `GK-${Math.floor(1000 + Math.random() * 9000)}-${username
        .substring(0, 4)
        .toUpperCase()}`;
    }

    if (Object.keys(patch).length > 0) {
      batch.set(d.ref, patch, { merge: true });
      patched++;
    }
  });

  if (patched > 0) await batch.commit();

  return {
    step: 'Completar campos de los usuarios',
    created: patched,
    skipped: snapshot.size - patched,
    details:
      patched > 0
        ? `${patched} de ${snapshot.size} usuarios rellenados con role, lastSeen y chatId.`
        : `Los ${snapshot.size} usuarios ya tenían todos los campos.`,
  };
}

// ────────────────────────────────────────────────────────
// 4b. CONTADORES DE "ME GUSTA" REALES
// ────────────────────────────────────────────────────────
// Los datos de ejemplo traían contadores inventados (342, 512,
// 680...) que no correspondían a ningún usuario real, porque
// likedBy solo guardaba un par de identificadores ficticios.
// Aquí el contador se iguala a la lista real de personas que
// han pulsado, así que si nadie lo ha marcado aparece 0.
// ────────────────────────────────────────────────────────

async function syncLikeCounters(collectionName: string, counterField: string): Promise<StepReport> {
  const snapshot = await getDocs(collection(db, collectionName));
  const batch = writeBatch(db);
  let changed = 0;

  snapshot.docs.forEach((d) => {
    const data = d.data() as Record<string, unknown>;
    const likedBy: string[] = Array.isArray(data.likedBy) ? (data.likedBy as string[]) : [];
    const current = typeof data[counterField] === 'number' ? (data[counterField] as number) : 0;

    if (current !== likedBy.length) {
      batch.set(d.ref, { [counterField]: likedBy.length }, { merge: true });
      changed++;
    }
  });

  if (changed > 0) await batch.commit();

  return {
    step: `Ajustar me gusta reales en "${collectionName}"`,
    created: changed,
    skipped: snapshot.size - changed,
    details:
      changed > 0
        ? `${changed} de ${snapshot.size} documentos recalculados según los usuarios reales.`
        : `Los ${snapshot.size} documentos ya tenían el contador correcto.`,
  };
}

async function recomputeThreadCounts(): Promise<StepReport> {
  const threadsSnapshot = await getDocs(collection(db, 'threads'));
  const threads = threadsSnapshot.docs.map((d) => d.data() as { categoryId?: string });

  const batch = writeBatch(db);

  for (const category of CATEGORIES) {
    const count = threads.filter((t) => t.categoryId === category.id).length;
    batch.set(
      doc(db, 'categories', category.id),
      { threadsCount: count },
      { merge: true },
    );
  }

  await batch.commit();

  return {
    step: 'Recalcular hilos por categoría',
    created: CATEGORIES.length,
    skipped: 0,
    details: CATEGORIES.map(
      (c) => `${c.name}: ${threads.filter((t) => t.categoryId === c.id).length}`,
    ).join(' · '),
  };
}

// ────────────────────────────────────────────────────────
// 6. ASEGURAR CAMPOS DE "ME GUSTA" EN DOCUMENTOS EXISTENTES
// ────────────────────────────────────────────────────────
// Si likesCount existe pero likedBy no, el primer like
// rompería (leería undefined y haría [...undefined]).
// ────────────────────────────────────────────────────────

async function ensureLikedBy(collectionName: string, counterField: string): Promise<StepReport> {
  const snapshot = await getDocs(collection(db, collectionName));
  const batch = writeBatch(db);
  let patched = 0;

  snapshot.docs.forEach((d) => {
    const data = d.data() as Record<string, unknown>;
    if (data.likedBy === undefined) {
      batch.set(d.ref, { likedBy: [] }, { merge: true });
      patched++;
    } else if (typeof data[counterField] !== 'number') {
      const likedBy = (data.likedBy as string[] | undefined) ?? [];
      batch.set(d.ref, { [counterField]: likedBy.length }, { merge: true });
      patched++;
    }
  });

  if (patched > 0) await batch.commit();

  return {
    step: `Reparar "me gusta" en "${collectionName}"`,
    created: patched,
    skipped: snapshot.size - patched,
    details:
      patched > 0
        ? `${patched} documentos reparados.`
        : `Los ${snapshot.size} documentos ya estaban bien.`,
  };
}

// ────────────────────────────────────────────────────────
// 7. LIMPIAR AUTORES FANTASMAS DEL FORO
// ────────────────────────────────────────────────────────
// Los hilos y comentarios que se sembraron al principio
// tenían autores como "user_otaku_01" o "user_cyber_02",
// que son identificadores inventados: no existen como cuentas
// de Firebase Auth. Se ven bien porque el nombre y el avatar
// están copiados dentro del documento, pero no hay forma de
// iniciar sesión con ellos ni de gestionarlos desde el panel.
//
// Aquí se borra todo lo que tenga un autor inexistente y se
// crea contenido nuevo firmado por la cuenta que ejecuta la
// migración, para que el foro no quede vacío.
// ────────────────────────────────────────────────────────

async function cleanGhostAuthors(owner: {
  uid: string;
  name: string;
  avatar: string;
}): Promise<StepReport> {
  const usersSnapshot = await getDocs(collection(db, 'users'));
  const realUids = new Set(usersSnapshot.docs.map((d) => d.id));

  const isGhost = (authorId: unknown) =>
    typeof authorId !== 'string' || !realUids.has(authorId);

  let deletedThreads = 0;
  let deletedComments = 0;

  const threadSnap = await getDocs(collection(db, 'threads'));
  const threadBatch = writeBatch(db);
  threadSnap.docs.forEach((d) => {
    if (isGhost(d.data().authorId)) {
      threadBatch.delete(d.ref);
      deletedThreads++;
    }
  });
  if (deletedThreads > 0) await threadBatch.commit();

  const commentSnap = await getDocs(collection(db, 'comments'));
  const commentBatch = writeBatch(db);
  commentSnap.docs.forEach((d) => {
    if (isGhost(d.data().authorId)) {
      commentBatch.delete(d.ref);
      deletedComments++;
    }
  });
  if (deletedComments > 0) await commentBatch.commit();

  // ── Contenido de ejemplo con una cuenta real ─────────
  // Ids fijos: si se vuelve a ejecutar, no se duplica nada.
  const now = serverTimestamp();
  const author = {
    authorId: owner.uid,
    authorName: owner.name,
    authorAvatar: owner.avatar,
  };

  const demoThreads: {
    id: string;
    title: string;
    body: string;
    categoryId: string;
    categoryName: string;
    tags: string[];
  }[] = [
    {
      id: 'demo-thread-kaguya',
      title: '¿Kaguya-sama sigue siendo la mejor romcomedia de la última década?',
      body: 'Acabo de releer la tercera temporada y sigue sosteniendo el ritmo aunque ya no sorprenda. Lo que más me gusta es que funcione sin romance explícito durante tramos largos: la tensión entre los dos protagonistas hace más trabajo que cualquier confesión. Para mí sigue siendo el techo del género. ¿Alguien pone otra por delante?',
      categoryId: 'romance',
      categoryName: 'Romance & Comedia',
      tags: ['Kaguya-sama', 'Romance', 'Debate'],
    },
    {
      id: 'demo-thread-frieren',
      title: 'Frieren y el paso del tiempo: ¿qué serie os dejó esa sensación?',
      body: 'El detalle de que una elfa inmortal no entienda los emojis de los difuntos me destrozó. Es una idea simple y a la vez devastadora: el duelo solo duele cuando te das cuenta de que el tiempo no pasa igual para todos. Busco mezclas de pacifismo y melancolía sin caer en el típico "el shonen de la vuelta".',
      categoryId: 'fantasia-aventura',
      categoryName: 'Fantasía & Aventura',
      tags: ['Frieren', 'Aventura'],
    },
  ];

  let createdThreads = 0;
  let createdComments = 0;

  const demoBatch = writeBatch(db);
  for (const t of demoThreads) {
    const ref = doc(db, 'threads', t.id);
    if ((await getDoc(ref)).exists()) continue;
    demoBatch.set(ref, {
      ...author,
      title: t.title,
      body: t.body,
      categoryId: t.categoryId,
      categoryName: t.categoryName,
      tags: t.tags,
      likesCount: 0,
      likedBy: [],
      commentsCount: 0,
      pinned: false,
      createdAt: now,
    });
    createdThreads++;
  }
  if (createdThreads > 0) await demoBatch.commit();

  const demoComments: { id: string; targetType: string; targetId: string; body: string }[] = [
    {
      id: 'demo-comment-1',
      targetType: 'thread',
      targetId: 'demo-thread-kaguya',
      body: 'Totalmente de acuerdo. El episodio del festival cultural es de los mejores de la serie entera y no tiene ni un segundo de relleno. Lo que funciona es el timing: siempre dejan el chiste justo antes del silencio.',
    },
    {
      id: 'demo-comment-2',
      targetType: 'thread',
      targetId: 'demo-thread-kaguya',
      body: 'Yo diría que el competidor directo es Toradora, pero no le gana en nada. Al final transmite lo mismo con menos personajes y en la mitad de tiempo.',
    },
    {
      id: 'demo-comment-3',
      targetType: 'thread',
      targetId: 'demo-thread-frieren',
      body: 'Frieren es el ejemplo perfecto de lo que dices. No necesita villanos: el antagonista real es el tiempo. Y aun así no cae en el drama vacío porque cada recuerdo está anclado a un objeto concreto.',
    },
  ];

  const demoCommentBatch = writeBatch(db);
  for (const c of demoComments) {
    const ref = doc(db, 'comments', c.id);
    if ((await getDoc(ref)).exists()) continue;

    demoCommentBatch.set(ref, {
      ...author,
      targetType: c.targetType,
      targetId: c.targetId,
      parentId: null,
      body: c.body,
      likesCount: 0,
      likedBy: [],
      createdAt: now,
    });

    // El hilo recibe su contador de comentarios en el mismo lote
    demoCommentBatch.set(
      doc(db, 'threads', c.targetId),
      { commentsCount: increment(1) },
      { merge: true },
    );

    createdComments++;
  }
  if (createdComments > 0) await demoCommentBatch.commit();

  return {
    step: 'Limpiar autores fantasmas del foro',
    created: createdThreads + createdComments,
    skipped: 0,
    details:
      `Borrados ${deletedThreads} hilos y ${deletedComments} comentarios con autores inexistentes. ` +
      `Creados ${createdThreads} hilos y ${createdComments} comentarios con @${owner.name}.`,
  };
}

// ────────────────────────────────────────────────────────
// MIGRACIÓN COMPLETA
// ────────────────────────────────────────────────────────

export interface MigrationOwner {
  uid: string;
  name: string;
  avatar: string;
}

export async function runFullMigration(owner: MigrationOwner): Promise<SeedReport> {
  const steps: StepReport[] = [];

  // Orden importante: primero el catálogo, luego la
  // normalización de fechas que affects al orden del foro.
  steps.push(await seedCollectionIfEmpty('categories', CATEGORIES, 'Sembrar categorías'));
  steps.push(await seedCollectionIfEmpty('trivia_extras', TRIVIA_EXTRAS, 'Sembrar trivia'));
  steps.push(
    await seedCollectionIfEmpty('mascot_dialogues', MASCOT_DIALOGUES, 'Sembrar diálogos de la mascota'),
  );

  steps.push(await normalizeDatesIn('threads', ['createdAt']));
  steps.push(await normalizeDatesIn('comments', ['createdAt']));
  steps.push(await normalizeDatesIn('users', ['createdAt']));

  steps.push(await ensureUserFields());

  steps.push(await ensureLikedBy('threads', 'likesCount'));
  steps.push(await ensureLikedBy('comments', 'likesCount'));
  steps.push(await ensureLikedBy('animes', 'likesCount'));
  steps.push(await ensureLikedBy('episodes', 'likesCount'));
  steps.push(await ensureLikedBy('characters', 'likesCount'));
  steps.push(await ensureLikedBy('trivia_extras', 'likes'));

  steps.push(await syncLikeCounters('threads', 'likesCount'));
  steps.push(await syncLikeCounters('comments', 'likesCount'));
  steps.push(await syncLikeCounters('animes', 'likesCount'));
  steps.push(await syncLikeCounters('episodes', 'likesCount'));
  steps.push(await syncLikeCounters('characters', 'likesCount'));
  steps.push(await syncLikeCounters('trivia_extras', 'likes'));

  steps.push(await recomputeCategoryCounts());
  steps.push(await recomputeThreadCounts());

  // Va al final porque necesita conocer los usuarios reales
  // para saber qué autores son inventados.
  steps.push(await cleanGhostAuthors(owner));

  return { steps, ok: true };
}
