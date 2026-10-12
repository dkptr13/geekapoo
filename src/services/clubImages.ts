import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';

import { storage } from '../lib/firebase';

// ======================================================
// IMÁGENES DE LOS CLUBES
// ======================================================
// Dos carpetas, según lo que sea la imagen:
//
//   clubs/{slug}/portada/...  el banner horizontal
//   clubs/{slug}/icono/...    el avatar cuadrado
//
// La ruta NO lleva el uid del usuario, y es a propósito:
// la portada de un club la cambia su propietario pero la
// ven todos los miembros. Con el slug en la ruta, las reglas
// de Storage pueden comprobar el rol directamente contra el
// documento del club, sin depender de que la ruta case con
// un usuario concreto.
//
// Sobre el orden de subida: el club TIENE QUE EXISTIR antes
// de poder subir. Mientras no exista, la regla no puede
// comprobar que quien escribe sea administrador de ese club,
// así que la subida se rechazaría. De ahí que el modal cree
// primero el club y suba las imágenes después.
// ======================================================

export type TipoImagenClub = 'portada' | 'icono';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

function validar(file: File): void {
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

/** Quita del nombre lo que pueda romper la ruta en Storage. */
function sanitizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9._-]/g, '_')
    .slice(0, 60);
}

/**
 * Sube la portada o el icono de un club y devuelve su URL.
 *
 * La fecha va en el nombre del fichero para que dos subidas
 * seguidas no se pisen: si se llamaran igual, la segunda
 * machacaría la primera y quien la hubiera visto antes se
 * quedaría con una imagen que ya no existe.
 *
 * @param file  la imagen elegida
 * @param slug  el identificador del club (ya creado)
 * @param tipo  "portada" o "icono"
 */
export async function uploadClubImage(
  file: File,
  slug: string,
  tipo: TipoImagenClub,
): Promise<string> {
  validar(file);

  const cleanSlug = String(slug).replace(/[^A-Za-z0-9_-]/g, '_');
  if (!cleanSlug) {
    throw new Error('No se sabe a qué club pertenece la imagen.');
  }

  const stamp = Date.now();
  const path = `clubs/${cleanSlug}/${tipo}/${tipo}-${stamp}.${extensionOf(file)}`;

  const target = storageRef(storage, path);
  await uploadBytes(target, file, { contentType: file.type });
  return getDownloadURL(target);
}
