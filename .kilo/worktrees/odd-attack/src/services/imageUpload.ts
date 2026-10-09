import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  getMetadata,
  listAll,
} from 'firebase/storage';

import { storage } from '../lib/firebase';

// ======================================================
// SUBIDA DE IMÁGENES PARA EL PANEL DE ADMINISTRACIÓN
// ======================================================
// Dos opciones disponibles:
//
// 1. Firebase Storage (recomendado)
//    La imagen se guarda en tu propio proyecto, sin claves
//    exposed en el navegador y sin depender de un tercero.
//
// 2. ImgBB
//    Funciona, pero VITE_IMGBB_API_KEY viaja dentro del bundle
//    JS. Cualquiera que abra las herramientas de desarrollo de
//    la web puede leerla y subir imágenes a tu cuenta con ella.
// ======================================================

export type UploadProvider = 'storage' | 'imgbb';

const IMGBB_API_KEY = (import.meta as { env?: Record<string, string> }).env
  ?.VITE_IMGBB_API_KEY as string | undefined;

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

function validate(file: File): void {
  if (!ALLOWED.includes(file.type)) {
    throw new Error(
      `Formato no permitido (${file.type || 'desconocido'}). Usa JPG, PNG, WebP, GIF o AVIF.`,
    );
  }
  if (file.size > MAX_BYTES) {
    throw new Error(
      `La imagen pesa ${(file.size / 1024 / 1024).toFixed(1)} MB y el máximo son 5 MB.`,
    );
  }
}

function extensionOf(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase();
  if (fromName && fromName.length <= 5) return fromName;
  switch (file.type) {
    case 'image/png': return 'png';
    case 'image/webp': return 'webp';
    case 'image/gif': return 'gif';
    case 'image/avif': return 'avif';
    default: return 'jpg';
  }
}

async function uploadToImgBB(file: File): Promise<string> {
  if (!IMGBB_API_KEY) {
    throw new Error(
      'Falta VITE_IMGBB_API_KEY en el archivo .env.local. Usa Firebase Storage o define la clave.',
    );
  }

  const formData = new FormData();
  formData.append('image', file);
  formData.append('key', IMGBB_API_KEY);

  const res = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: formData });
  if (!res.ok) throw new Error('ImgBB rechazó la imagen (error de red).');

  const data = (await res.json()) as { success?: boolean; data?: { url?: string } };
  if (!data.success || !data.data?.url) throw new Error('ImgBB no devolvió una URL válida.');

  return data.data.url;
}

async function uploadToStorage(
  file: File,
  collectionName: string,
  itemId: string,
  field: string,
): Promise<string> {
  // La fecha evita que dos subidas al mismo elemento se pisen
  // en el nombre del archivo.
  const stamp = Date.now();
  const path = `content/${collectionName}/${itemId}/${field}-${stamp}.${extensionOf(file)}`;

  const target = storageRef(storage, path);
  await uploadBytes(target, file, { contentType: file.type });
  return getDownloadURL(target);
}

/**
 * Sube una imagen y devuelve la URL con la que guardarla.
 * Elige proveedor según la disponibilidad y te devuelve
 * cuál se usó al final, para poder avisar en la interfaz.
 */
export async function uploadImage(
  file: File,
  options: {
    provider: UploadProvider;
    collectionName: string;
    itemId: string;
    field: string;
  },
): Promise<{ url: string; provider: UploadProvider }> {
  validate(file);

  if (options.provider === 'storage') {
    return {
      url: await uploadToStorage(file, options.collectionName, options.itemId, options.field),
      provider: 'storage',
    };
  }

  return { url: await uploadToImgBB(file), provider: 'imgbb' };
}

/**
 * Sube una imagen de la comunidad (hilos y comentarios) y
 * devuelve su URL.
 *
 * Va a "community/{uid}/", una carpeta por persona. Las reglas
 * de Storage comprueban que el {uid} de la ruta sea el mismo
 * que el de quien escribe, así que nadie puede subir al
 * espacio de otro.
 *
 * A diferencia de las imágenes del catálogo, aquí sube
 * cualquier usuario con sesión, que es justo lo que se pide:
 * los hilos son contenido de la comunidad, no del panel.
 *
 * El nombre lleva la fecha para que dos subidas seguidas no
 * se pisen: si se llamaran igual, la segunda machacaría la
 * primera.
 */
export async function uploadCommunityImage(file: File, uid: string): Promise<string> {
  validate(file);

  if (!uid) {
    throw new Error('Necesitas iniciar sesión para adjuntar una imagen.');
  }

  const stamp = Date.now();
  const path = `community/${uid}/${stamp}-${sanitizeName(file.name)}`;

  const target = storageRef(storage, path);
  await uploadBytes(target, file, { contentType: file.type });
  return getDownloadURL(target);
}

/** Quita del nombre lo que pueda romper la ruta en Storage. */
function sanitizeName(name: string): string {
  const clean = name.replace(/[^A-Za-z0-9._-]/g, '-');
  return clean || 'imagen.jpg';
}

// ======================================================
// BORRADO DE IMÁGENES
// ======================================================
// Cada subida usa un nombre con fecha ("coverUrl-1712345.jpg"),
// así que al cambiar una imagen el archivo viejo se queda ahí
// para siempre: la cuenta de Storage se llena de copias que
// nadie vuelve a mirar. Estas funciones lo evitan.
//
// Se borra DESPUÉS de guardar el documento nuevo, nunca antes:
// si el borrado va primero y el guardado falla, se ha quedado
// sin imagen y sin archivo.
// ======================================================

/**
 * Saca la ruta del objeto dentro del bucket a partir de su URL
 * de descarga.
 *
 * Las URLs tienen esta forma:
 *   https://firebasestorage.googleapis.com/v0/b/<bucket>/o/content%2Fanimes%2Fkaguya%2FcoverUrl-1.jpg
 *   ...&alt=media
 *
 * Ojo: hay que decodificar con decodeURIComponent, porque las
 * barras del path vienen codificadas como %2F. Sin eso se
 * devolvería la ruta con %2F y Storage no encontraría nada.
 *
 * Devuelve null si la URL no es de nuestro Storage (por ejemplo
 * una de ImgBB o una externa), porque esas no se pueden borrar
 * desde aquí.
 */
export function storagePathFromUrl(url: string): string | null {
  if (!url) return null;
  if (!url.startsWith('https://')) return null;

  // Formato nuevo: /v0/b/<bucket>/o/<ruta codificada>
  const nuevo = /\/o\/(.+?)(?:\?|$)/.exec(url);
  if (nuevo && url.includes('/v0/b/')) {
    try {
      return decodeURIComponent(nuevo[1]);
    } catch {
      return null;
    }
  }

  // Formato antiguo: /v0/b/<bucket>.o?alt=media&token=...
  const viejo = /\/o\?/.exec(url);
  if (viejo) return null;

  return null;
}

/**
 * Borra un archivo por su ruta dentro del bucket.
 *
 * Es la operación de verdad; deleteStoredImage() es el envoltorio
 * que acepta una URL. Trabajar por ruta evita tener que
 * reconstruir la URL de descarga (y adivinar el nombre del
 * bucket) solo para poder borrar.
 */
export async function deleteStoredPath(path: string): Promise<boolean> {
  if (!path.startsWith('content/')) return false;

  try {
    await deleteObject(storageRef(storage, path));
    return true;
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'storage/object-not-found') return false;

    console.warn('No se pudo borrar la imagen anterior:', path, e);
    return false;
  }
}

/**
 * Borra la imagen de una URL, si es del catálogo de este
 * proyecto.
 *
 * Nunca lanza: si la URL no es nuestra, si ya no estaba, o si
 * las reglas lo impiden, se avisa por consola y se sigue. Que
 * falle el borrado de un archivo viejo no puede ser motivo para
 * perder un guardado bueno.
 */
export async function deleteStoredImage(url: string): Promise<boolean> {
  const path = storagePathFromUrl(url);
  if (!path) return false;
  return deleteStoredPath(path);
}

/**
 * Borra la imagen anterior SOLO si realmente se ha sustituido por
 * otra. Pensado para llamar justo después de guardar.
 *
 * No espera al borrado a propósito: el usuario acaba de cambiar
 * una imagen y no tiene por qué quedarse mirando hasta que
 * Storage conteste.
 */
export function deleteReplacedImage(previousUrl: string, nextUrl: string): void {
  if (!previousUrl || previousUrl === nextUrl) return;
  if (!storagePathFromUrl(previousUrl)) return;

  void deleteStoredImage(previousUrl);
}

/**
 * Lista recursivamente las rutas de todo lo que hay bajo un
 * prefijo.
 *
 * Devuelve rutas, no URLs: para comparar contra lo que
 * referencian los documentos es más barato de verdad (pedir la
 * URL de descarga de cada archivo sería una llamada extra por
 * archivo).
 *
 * listAll no trae el tamaño, así que no se intenta aquí: el peso
 * se consulta solo de los archivos que interesan, que son menos.
 */
export async function listStoredImages(prefix: string): Promise<string[]> {
  const res = await listAll(storageRef(storage, prefix));
  return res.items.map((item) => item.fullPath);
}

/** Peso en bytes de un archivo, o 0 si no se puede saber. */
export async function storedImageSize(path: string): Promise<number> {
  try {
    const meta = await getMetadata(storageRef(storage, path));
    return Number(meta.size ?? 0);
  } catch {
    return 0;
  }
}
