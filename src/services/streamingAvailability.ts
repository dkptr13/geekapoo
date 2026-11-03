import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import { invalidateCache, PUBLIC_CACHE } from '../lib/firestoreCache';
import {
  PLATAFORMAS_INICIALES,
  REGIONES_INICIALES,
  normalizarAcceso,
  normalizarCodigoRegion,
  normalizarEstadoDisponibilidad,
  plataformaIdDeNombre,
} from '../data/streaming';
import {
  esUrlHttp,
  normalizarDisponibilidad,
} from './streamingAvailabilityLogic';
import type {
  StreamingAccessType,
  StreamingAvailabilityStatus,
} from '../types';

// ======================================================
// ESCRITURA DE DISPONIBILIDAD REGIONAL
// ======================================================
// Solo se llama desde el panel. Las reglas son las que deciden de
// verdad: administradores y moderadores pueden escribir; el resto,
// no. Aquí se valida lo suficiente para no guardar filas rotas.
// ======================================================

const COLECCION_DISPONIBILIDAD = 'streamingAvailability';
const COLECCION_PLATAFORMAS = 'streamingPlatforms';
const COLECCION_REGIONES = 'streamingRegions';

export interface GuardarDisponibilidadInput {
  animeId: string;
  platformId: string;
  region: string;
  status: StreamingAvailabilityStatus;
  accessType?: StreamingAccessType;
  url?: string;
  verifiedAt?: string;
}

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : '';
}

function idDisponibilidad(animeId: string, platformId: string, region: string): string {
  return `${animeId}__${platformId}__${region}`;
}

function esFechaValida(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function colorValido(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value);
}

/**
 * Crea una plataforma nueva en el catálogo compartido.
 *
 * No se crean filas de disponibilidad: una plataforma nueva no
 * significa que ninguna obra esté en ella.
 */
export async function crearPlataforma(input: {
  name: string;
  badgeColor?: string;
  logoUrl?: string;
}): Promise<string> {
  const name = texto(input.name);
  if (name.length < 2) throw new Error('El nombre de la plataforma es demasiado corto.');
  if (name.length > 80) throw new Error('El nombre de la plataforma es demasiado largo.');

  const id = plataformaIdDeNombre(name);
  if (!id) throw new Error('El nombre no genera un identificador válido.');

  if (PLATAFORMAS_INICIALES.some((platform) => platform.id === id)) {
    throw new Error('Esa plataforma ya existe en el catálogo.');
  }

  const ref = doc(db, COLECCION_PLATAFORMAS, id);
  if ((await getDoc(ref)).exists()) {
    throw new Error('Esa plataforma ya existe en el catálogo.');
  }

  const badgeColor = texto(input.badgeColor);
  if (badgeColor && !colorValido(badgeColor)) {
    throw new Error('El color debe tener el formato #RRGGBB.');
  }

  const logoUrl = texto(input.logoUrl);
  if (logoUrl && !esUrlHttp(logoUrl)) {
    throw new Error('El logotipo debe ser una URL HTTP o HTTPS.');
  }

  await setDoc(ref, {
    name,
    badgeColor: badgeColor || '#71717a',
    ...(logoUrl ? { logoUrl } : {}),
    order: 1000,
    createdAt: serverTimestamp(),
  });

  invalidateCache('streaming:platforms', PUBLIC_CACHE);
  return id;
}

/**
 * Crea una región nueva. Las diez iniciales viven en el código y
 * ya están disponibles; esta función es para las que se añadan
 * después desde el panel.
 */
export async function crearRegion(input: {
  code: string;
  name: string;
}): Promise<string> {
  const code = normalizarCodigoRegion(input.code);
  if (!code) throw new Error('El código debe tener entre 2 y 10 letras (por ejemplo, PT).');

  const name = texto(input.name);
  if (name.length < 2) throw new Error('El nombre de la región es demasiado corto.');
  if (name.length > 80) throw new Error('El nombre de la región es demasiado largo.');

  if (REGIONES_INICIALES.some((region) => region.code === code)) {
    throw new Error('Esa región ya existe en el catálogo.');
  }

  const ref = doc(db, COLECCION_REGIONES, code);
  if ((await getDoc(ref)).exists()) {
    throw new Error('Esa región ya existe en el catálogo.');
  }

  await setDoc(ref, {
    name,
    order: 1000,
    createdAt: serverTimestamp(),
  });

  invalidateCache('streaming:regions', PUBLIC_CACHE);
  return code;
}

/**
 * Guarda (o corrige) una combinación obra + plataforma + región.
 *
 * El id determinista hace imposible tener dos filas para la misma
 * combinación. Al guardar se reemplaza el documento entero para
 * que, al pasar de «Disponible» a «No disponible», no quede un
 * enlace viejo escondido en la base.
 */
export async function guardarDisponibilidad(
  input: GuardarDisponibilidadInput,
): Promise<string> {
  const animeId = texto(input.animeId);
  const platformId = texto(input.platformId);
  const region = normalizarCodigoRegion(input.region);
  const status = normalizarEstadoDisponibilidad(input.status);

  if (!animeId || animeId.includes('/')) {
    throw new Error('La obra no tiene un identificador válido.');
  }
  if (!platformId || platformId.includes('/')) {
    throw new Error('La plataforma no tiene un identificador válido.');
  }
  if (!region) throw new Error('La región no es válida.');
  if (!status) throw new Error('El estado de disponibilidad no es válido.');

  const verifiedAt = texto(input.verifiedAt);

  if (verifiedAt && !esFechaValida(verifiedAt)) {
    throw new Error('La fecha de verificación no es válida.');
  }

  let accessType: StreamingAccessType = 'unknown';
  let url = '';

  if (status === 'available') {
    accessType = normalizarAcceso(input.accessType);
    url = texto(input.url);

    if (url && !esUrlHttp(url)) {
      throw new Error('El enlace debe ser una URL HTTP o HTTPS.');
    }
  }

  const data: Record<string, unknown> = {
    animeId,
    platformId,
    region,
    status,
    updatedAt: serverTimestamp(),
  };

  if (status === 'available' && accessType !== 'unknown') {
    data.accessType = accessType;
  }
  if (status === 'available' && url) data.url = url;
  if (status !== 'unverified' && verifiedAt) data.verifiedAt = verifiedAt;

  const id = idDisponibilidad(animeId, platformId, region);
  await setDoc(doc(db, COLECCION_DISPONIBILIDAD, id), data);

  // Se invalida SOLO esta obra y esta región. Antes se borraban
  // todas las claves `streaming:availability:` y cualquier ficha
  // abierta (de otra serie) volvía a leer su disponibilidad.
  invalidateCache(`streaming:availability:${animeId}:all`, PUBLIC_CACHE);
  invalidateCache(`streaming:availability:${animeId}:${region}`, PUBLIC_CACHE);

  return id;
}

/**
 * Borra una fila regional. No toca el anime ni las demás filas.
 *
 * El contexto (`animeId` + `region`) evita una lectura extra: el
 * editor ya tiene la fila en memoria. Si no se pasa, se lee el
 * documento antes de borrarlo para poder invalidar la caché exacta.
 */
export async function eliminarDisponibilidad(
  id: string,
  contexto?: { animeId?: string; region?: string },
): Promise<void> {
  const limpio = texto(id);
  if (!limpio || limpio.includes('/')) {
    throw new Error('La fila de disponibilidad no es válida.');
  }

  let animeId = texto(contexto?.animeId);
  let region = normalizarCodigoRegion(contexto?.region);

  if (!animeId || !region) {
    const snap = await getDoc(doc(db, COLECCION_DISPONIBILIDAD, limpio));
    const fila = snap.data();
    animeId = texto(fila?.animeId);
    region = normalizarCodigoRegion(fila?.region);
  }

  await deleteDoc(doc(db, COLECCION_DISPONIBILIDAD, limpio));

  if (animeId) {
    invalidateCache(`streaming:availability:${animeId}:all`, PUBLIC_CACHE);
    if (region) {
      invalidateCache(`streaming:availability:${animeId}:${region}`, PUBLIC_CACHE);
    }
  }
}

/** Reexporta el normalizador para que el panel y la wiki usen el mismo. */
export { normalizarDisponibilidad };
