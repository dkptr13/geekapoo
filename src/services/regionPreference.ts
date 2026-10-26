import { REGION_POR_DEFECTO, normalizarCodigoRegion } from '../data/streaming';

// ======================================================
// PREFERENCIA REGIONAL DEL USUARIO
// ======================================================
// El perfil manda cuando ya tiene una región (así se conserva al
// entrar desde otro dispositivo). Si todavía no la tiene, se
// recupera la del navegador y se sincroniza con la cuenta. Si no
// hay ninguna de las dos, se usa España.
//
// Este archivo no toca React ni Firestore para poder probar la
// precedencia con un almacenamiento falso.
// ======================================================

export const REGION_STORAGE_KEY = 'geekapoo.region';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export type OrigenRegion = 'profile' | 'local' | 'default';

export interface RegionResuelta {
  code: string;
  origen: OrigenRegion;
}

function almacenDelNavegador(): StorageLike | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    // Safari privado y algunos navegadores pueden lanzar al
    // acceder a localStorage. La wiki tiene que seguir abriendo.
    return null;
  }
}

/** Lee la región guardada en el navegador, si es válida. */
export function leerRegionGuardada(
  storage: StorageLike | null = almacenDelNavegador(),
): string | null {
  if (!storage) return null;

  try {
    return normalizarCodigoRegion(storage.getItem(REGION_STORAGE_KEY));
  } catch {
    return null;
  }
}

/** Guarda la región en el navegador. Nunca rompe la navegación. */
export function guardarRegionGuardada(
  code: string,
  storage: StorageLike | null = almacenDelNavegador(),
): void {
  const normalized = normalizarCodigoRegion(code);
  if (!normalized || !storage) return;

  try {
    storage.setItem(REGION_STORAGE_KEY, normalized);
  } catch {
    // Sin almacenamiento disponible, la preferencia durará lo que
    // dure la pestaña. No es motivo para mostrar un error.
  }
}

/**
 * Decide qué región mostrar al cargar la app o al iniciar sesión.
 *
 * Precedencia:
 *   1. La del perfil (viaja entre dispositivos).
 *   2. La del navegador (elección como invitado).
 *   3. España.
 */
export function resolverRegion(
  regionDelPerfil: unknown,
  regionDelNavegador: unknown,
): RegionResuelta {
  const perfil = normalizarCodigoRegion(regionDelPerfil);
  if (perfil) return { code: perfil, origen: 'profile' };

  const local = normalizarCodigoRegion(regionDelNavegador);
  if (local) return { code: local, origen: 'local' };

  return { code: REGION_POR_DEFECTO, origen: 'default' };
}
