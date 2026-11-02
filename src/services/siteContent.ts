import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import { cachedRead, invalidateCache, PUBLIC_CACHE } from '../lib/firestoreCache';
import { measureRead } from '../lib/firestoreDiagnostics';
import type { SiteSettings, WeeklyWork } from '../types';

// ======================================================
// CONTENIDO EDITABLE DESDE EL PANEL DE ADMIN
// ======================================================
// A diferencia del catálogo (animes, episodios...), esto no es
// contenido cultural: es el chrome de la web, lo que se ve al
// entrar. El texto de bienvenida y el logo estaban escritos
// dentro del código, así que cambiarlos exigía tocar y
// recompilar. Aquí viven en Firestore y el panel los modifica.
// ======================================================

export const SITE_SETTINGS = 'siteSettings';
export const SETTINGS_DOC = 'main';
export const WEEKLY_WORKS = 'weeklyWorks';

// Valores por defecto, idénticos a los que había en el
// código. Se usan mientras Firestore no responde, para que la
// portada nunca se quede en blanco.
export const DEFAULT_SETTINGS: SiteSettings = {
  welcomeTitle: 'Bienvenido a',
  welcomeHighlight: 'geekapoo.com',
  welcomeText:
    'Un espacio cómodo, seguro y sin restricciones (salvo el respeto mutuo) diseñado para que jóvenes, ' +
    'amantes del anime, series, películas, cultura pop y tecnología puedan debatir, opinar, compartir ' +
    'teorías y criticar libremente.',
  logoUrl: '',
  // Las dos ilustraciones delSoporte salen de "public/img" y se
  // referencian con ruta absoluta, que es como sirve Vite la
  // carpeta "public". Son WebP: los PNG pasaban de 800 KB y estos mismos
  // archivos quedan en 110 KB sin perder nada visible. Al ser el valor
  // por defecto se ven desde el
  // primer momento, y el panel puede sustituirlas por una subida
  // a Firebase Storage sin tocar código.
  supportArtLeftUrl: '/img/de78172d-0a71-4466-a45a-9bc3321ac51d-Photoroom.webp',
  supportArtRightUrl: '/img/Gemini_Generated_Image_poiww1poiww1poiw-Photoroom.webp',
};

const asStr = (v: unknown, fallback = ''): string =>
  typeof v === 'string' && v.trim() !== '' ? v : fallback;

const TTL_AJUSTES = 60 * 60 * 1000;
const TTL_OBRAS = 30 * 60 * 1000;
const KEY_AJUSTES = 'site:settings';
const KEY_OBRAS = 'site:weekly-works';

function normalizarAjustes(data: Partial<SiteSettings> | undefined): SiteSettings {
  if (!data) return DEFAULT_SETTINGS;
  return {
    welcomeTitle: asStr(data.welcomeTitle, DEFAULT_SETTINGS.welcomeTitle),
    welcomeHighlight: asStr(data.welcomeHighlight, DEFAULT_SETTINGS.welcomeHighlight),
    welcomeText: asStr(data.welcomeText, DEFAULT_SETTINGS.welcomeText),
    logoUrl: typeof data.logoUrl === 'string' ? data.logoUrl : '',
    supportArtLeftUrl:
      typeof data.supportArtLeftUrl === 'string'
        ? data.supportArtLeftUrl
        : DEFAULT_SETTINGS.supportArtLeftUrl,
    supportArtRightUrl:
      typeof data.supportArtRightUrl === 'string'
        ? data.supportArtRightUrl
        : DEFAULT_SETTINGS.supportArtRightUrl,
  };
}

function normalizarObras(
  docs: { id: string; data: () => Record<string, unknown> }[],
): WeeklyWork[] {
  const works = docs.map((d) => {
    const data = d.data() as Omit<WeeklyWork, 'id'> & { createdAt?: unknown };
    return {
      ...data,
      id: d.id,
      order: typeof data.order === 'number' ? data.order : 99,
      score: typeof data.score === 'number' ? data.score : 0,
      active: data.active !== false,
    };
  });
  works.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  return works;
}

/** Ajustes globales con caché larga e invalidación al guardar. */
export function getSiteSettingsCached(force = false): Promise<SiteSettings> {
  return cachedRead({
    key: KEY_AJUSTES,
    scope: PUBLIC_CACHE,
    ttlMs: TTL_AJUSTES,
    force,
    persist: true,
    read: async () => {
      const snap = await measureRead(
        { name: 'settings', collection: SITE_SETTINGS, origin: 'SiteContentContext' },
        () => 1,
        () => getDoc(doc(db, SITE_SETTINGS, SETTINGS_DOC)),
      );
      return normalizarAjustes(snap.data() as Partial<SiteSettings> | undefined);
    },
  });
}

/** Obras de la semana con caché; cambian desde el panel, no cada minuto. */
export function getWeeklyWorksCached(force = false): Promise<WeeklyWork[]> {
  return cachedRead({
    key: KEY_OBRAS,
    scope: PUBLIC_CACHE,
    ttlMs: TTL_OBRAS,
    force,
    persist: true,
    read: async () => {
      const snap = await measureRead(
        { name: 'weeklyWorks', collection: WEEKLY_WORKS, origin: 'SiteContentContext' },
        (result) => result.size,
        () => getDocs(collection(db, WEEKLY_WORKS)),
      );
      return normalizarObras(snap.docs);
    },
  });
}

// ────────────────────────────────────────────────────────
// AJUSTES DEL SITIO
// ────────────────────────────────────────────────────────

export function subscribeSiteSettings(
  onData: (settings: SiteSettings) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, SITE_SETTINGS, SETTINGS_DOC),
    (snap) => {
      const data = snap.data() as Partial<SiteSettings> | undefined;
      if (!data) {
        onData(DEFAULT_SETTINGS);
        return;
      }
      onData({
        welcomeTitle: asStr(data.welcomeTitle, DEFAULT_SETTINGS.welcomeTitle),
        welcomeHighlight: asStr(data.welcomeHighlight, DEFAULT_SETTINGS.welcomeHighlight),
        welcomeText: asStr(data.welcomeText, DEFAULT_SETTINGS.welcomeText),
        logoUrl: typeof data.logoUrl === 'string' ? data.logoUrl : '',

        // Aquí la diferencia entre "el campo no existe" y "el
        // campo está vacío" es la clave.
        //
        // El documento de ajustes ya existía antes de que estas
        // dos imágenes existieran, así que no tiene los campos.
        // Con un 'typeof ... === string ? ... : ""' se convertían
        // en cadena vacía al llegar de Firestore y tapaban el
        // valor por defecto: las imágenes se veían un instante y
        // desaparecían.
        //
        // Que falte el campo -> se usa el valor por defecto.
        // Que exista pero vacío -> se respeta el vacío, que es
        // como el admin apaga la columna a propósito.
        supportArtLeftUrl:
          typeof data.supportArtLeftUrl === 'string'
            ? data.supportArtLeftUrl
            : DEFAULT_SETTINGS.supportArtLeftUrl,
        supportArtRightUrl:
          typeof data.supportArtRightUrl === 'string'
            ? data.supportArtRightUrl
            : DEFAULT_SETTINGS.supportArtRightUrl,
      });
    },
    (e) => {
      console.error('[Site] Error al leer los ajustes:', e);
      onData(DEFAULT_SETTINGS);
      onError?.(e);
    },
  );
}

/** Guarda solo los campos indicados, para no pisar el resto. */
export async function saveSiteSettings(
  patch: Partial<SiteSettings>,
): Promise<void> {
  await setDoc(
    doc(db, SITE_SETTINGS, SETTINGS_DOC),
    { ...patch, updatedAt: serverTimestamp() },
    { merge: true },
  );
  invalidateCache(KEY_AJUSTES, PUBLIC_CACHE);
}

// ────────────────────────────────────────────────────────
// OBRAS DE LA SEMANA
// ────────────────────────────────────────────────────────

const MAX_SCORE = 10;

export function subscribeWeeklyWorks(
  onData: (works: WeeklyWork[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  return onSnapshot(collection(db, WEEKLY_WORKS), (snap) => {
    const works = snap.docs.map((d) => {
      const data = d.data() as Omit<WeeklyWork, 'id'> & { createdAt?: unknown };
      return {
        ...data,
        id: d.id,
        order: typeof data.order === 'number' ? data.order : 99,
        score: typeof data.score === 'number' ? data.score : 0,
        active: data.active !== false,
      };
    });

    works.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
    onData(works);
  }, (e) => onError?.(e));
}

export interface NewWeeklyWorkInput {
  title: string;
  author: string;
  synopsis: string;
  imageUrl: string;
  badge: string;
  score: number;
  active?: boolean;
}

function validateWork(input: NewWeeklyWorkInput) {
  if (!input.title.trim()) throw new Error('El título no puede estar vacío.');
  if (input.title.length > 120) throw new Error('El título es demasiado largo.');
  if (input.synopsis.length > 2000) throw new Error('La sinopsis es demasiado larga.');
  if (input.score < 0 || input.score > MAX_SCORE) {
    throw new Error(`La nota debe estar entre 0 y ${MAX_SCORE}.`);
  }
}

export async function createWeeklyWork(
  input: NewWeeklyWorkInput,
): Promise<string> {
  validateWork(input);

  // El orden se calcula a partir de las que ya hay, para que
  // la nueva aparezca la última y el admin la suba desde el
  // panel con los botones de posición.
  const existing = await getDocsOrdered();

  const ref = doc(collection(db, WEEKLY_WORKS));
  await setDoc(ref, {
    title: input.title.trim(),
    author: input.author.trim(),
    synopsis: input.synopsis.trim(),
    imageUrl: input.imageUrl,
    badge: input.badge.trim(),
    score: input.score,
    active: input.active !== false,
    order: existing.length + 1,
    createdAt: serverTimestamp(),
  });

  invalidateCache(KEY_OBRAS, PUBLIC_CACHE);
  return ref.id;
}

export async function updateWeeklyWork(
  workId: string,
  patch: Partial<NewWeeklyWorkInput> & { order?: number },
): Promise<void> {
  const clean: Record<string, unknown> = { ...patch };

  if (typeof clean.title === 'string') clean.title = clean.title.trim();
  if (typeof clean.synopsis === 'string') clean.synopsis = clean.synopsis.trim();
  if (typeof clean.author === 'string') clean.author = clean.author.trim();
  if (typeof clean.badge === 'string') clean.badge = clean.badge.trim();

  if (Object.keys(clean).length === 0) return;

  await updateDoc(doc(db, WEEKLY_WORKS, workId), clean);
  invalidateCache(KEY_OBRAS, PUBLIC_CACHE);
}

export async function deleteWeeklyWork(workId: string): Promise<void> {
  await deleteDoc(doc(db, WEEKLY_WORKS, workId));
  invalidateCache(KEY_OBRAS, PUBLIC_CACHE);
}

/**
 * Sube o baja una obra de posición. Intercambia su "order"
 * con la de la vecina, en un único lote, para que las dos
 * posiciones queden siempre distintas.
 */
export async function moveWeeklyWork(
  workId: string,
  direction: 'up' | 'down',
  works: WeeklyWork[],
): Promise<void> {
  const index = works.findIndex((w) => w.id === workId);
  const targetIndex = direction === 'up' ? index - 1 : index + 1;

  const current = works[index];
  const neighbour = works[targetIndex];
  if (!current || !neighbour) return;

  // Si alguno de los dos nunca tuvo "order" (dato antiguo),
  // se les asigna posiciones fijas y exchanges antes de
  // intercambiarlos, o el resultado sería impredecible.
  const currentOrder = Number.isInteger(current.order) ? current.order : index + 1;
  const neighbourOrder = Number.isInteger(neighbour.order)
    ? neighbour.order
    : targetIndex + 1;

  if (currentOrder === neighbourOrder) {
    const patch = writeBatch(db);
    patch.set(doc(db, WEEKLY_WORKS, current.id), { order: index + 1 });
    patch.set(doc(db, WEEKLY_WORKS, neighbour.id), { order: targetIndex + 1 });
    await patch.commit();
    invalidateCache(KEY_OBRAS, PUBLIC_CACHE);
    return;
  }

  const batch = writeBatch(db);
  batch.set(doc(db, WEEKLY_WORKS, current.id), { order: neighbourOrder });
  batch.set(doc(db, WEEKLY_WORKS, neighbour.id), { order: currentOrder });
  await batch.commit();
  invalidateCache(KEY_OBRAS, PUBLIC_CACHE);
}

async function getDocsOrdered(): Promise<WeeklyWork[]> {
  const snap = await getDocs(collection(db, WEEKLY_WORKS));
  return snap.docs.map((d) => ({ ...(d.data() as Omit<WeeklyWork, 'id'>), id: d.id }));
}
