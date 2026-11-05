import type { User } from '../types';

// ======================================================
// IDENTIDAD DE USUARIO
// ======================================================
//
// `username` es el identificador único y permanente. Se guarda
// SIEMPRE en minúsculas y sin acentos. `displayName` es el nombre
// visible, libre y repetible.
//
// Este módulo es la fuente de verdad del formato en el cliente. Las
// reglas de Firestore y la Cloud Function vuelven a comprobarlo: la
// interfaz solo da mensajes útiles.

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export const DISPLAY_NAME_MIN = 2;
export const DISPLAY_NAME_MAX = 30;

/** Días mínimos entre cambios de nombre visible. */
export const DISPLAY_NAME_COOLDOWN_DAYS = 7;

/**
 * Identificadores que no se pueden reservar.
 *
 * Se comprueban en el cliente, en las reglas (mediante la reserva
 * del backend) y en la Cloud Function. La lista del backend está en
 * `functions/src/usernames.ts`; `tests/logica.usuarios.ts` comprueba
 * que las dos listas sean iguales.
 */
export const RESERVED_USERNAMES: readonly string[] = [
  'admin',
  'administrador',
  'administrator',
  'mod',
  'moderator',
  'moderador',
  'support',
  'soporte',
  'help',
  'ayuda',
  'geekapoo',
  'kapo',
  'kapochan',
  'system',
  'sistema',
  'official',
  'oficial',
  'staff',
  'team',
  'equipo',
  'security',
  'seguridad',
  'root',
  'owner',
  'api',
  'bot',
  'null',
  'undefined',
  'anonymous',
  'anonimo',
  'webmaster',
  'contacto',
  'contact',
  'info',
  'noreply',
  'no_reply',
  'mail',
  'correo',
  'me',
  'yo',
  'user',
  'usuario',
  'guest',
  'invitado',
  'deleted',
  'eliminado',
  'cuenta',
  'soporte_tecnico',
];

const RESERVADOS = new Set(RESERVED_USERNAMES);

/**
 * Normaliza un identificador para almacenarlo o compararlo.
 *
 * Quita tildes, pasa a minúsculas y recorta los extremos. NO quita
 * otros caracteres inválidos a propósito: si alguien escribe un
 * guion, el formulario debe avisar de que no vale, no cambiarlo en
 * silencio por otra cosa.
 */
export function normalizarUsername(valor: string): string {
  return valor
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function usernameValido(valor: string): boolean {
  return USERNAME_RE.test(normalizarUsername(valor));
}

export function usernameReservado(valor: string): boolean {
  return RESERVADOS.has(normalizarUsername(valor));
}

/** Mensaje de error del identificador, o `null` si es válido. */
export function errorUsername(valor: string): string | null {
  const limpio = normalizarUsername(valor);
  if (!limpio) return 'Introduce un nombre de usuario.';
  if (limpio.length < USERNAME_MIN) {
    return `El nombre de usuario necesita al menos ${USERNAME_MIN} caracteres.`;
  }
  if (limpio.length > USERNAME_MAX) {
    return `El nombre de usuario no puede superar los ${USERNAME_MAX} caracteres.`;
  }
  if (!USERNAME_RE.test(limpio)) {
    return 'Solo puede llevar letras sin acentos, números y guiones bajos.';
  }
  if (RESERVADOS.has(limpio)) {
    return 'Ese nombre de usuario está reservado.';
  }
  return null;
}

/** Nombre visible limpio (sin recortar por dentro). */
export function normalizarDisplayName(valor: string): string {
  return valor.trim().replace(/\s+/g, ' ');
}

export function displayNameValido(valor: string): boolean {
  const limpio = normalizarDisplayName(valor);
  return (
    limpio.length >= DISPLAY_NAME_MIN &&
    limpio.length <= DISPLAY_NAME_MAX &&
    !/[\u0000-\u001f\u007f]/.test(limpio)
  );
}

export function errorDisplayName(valor: string): string | null {
  const limpio = normalizarDisplayName(valor);
  if (!limpio) return 'El nombre visible no puede estar vacío.';
  if (limpio.length < DISPLAY_NAME_MIN) {
    return `El nombre visible necesita al menos ${DISPLAY_NAME_MIN} caracteres.`;
  }
  if (limpio.length > DISPLAY_NAME_MAX) {
    return `El nombre visible no puede superar los ${DISPLAY_NAME_MAX} caracteres.`;
  }
  if (/[\u0000-\u001f\u007f]/.test(limpio)) {
    return 'El nombre visible contiene caracteres no permitidos.';
  }
  return null;
}

function fechaDe(valor: unknown): Date | null {
  if (!valor) return null;
  if (valor instanceof Date) return valor;
  if (typeof valor === 'string') {
    const fecha = new Date(valor);
    return Number.isFinite(fecha.getTime()) ? fecha : null;
  }
  if (
    typeof valor === 'object' &&
    typeof (valor as { toDate?: unknown }).toDate === 'function'
  ) {
    try {
      const fecha = (valor as { toDate: () => Date }).toDate();
      return Number.isFinite(fecha.getTime()) ? fecha : null;
    } catch {
      return null;
    }
  }
  return null;
}

/** Cuándo podrá volver a cambiarse el nombre visible, o `null` si ya puede. */
export function siguienteCambioDisplayName(
  usuario: Pick<User, 'displayNameChangedAt' | 'role'> | null | undefined,
  ahora = Date.now(),
): Date | null {
  if (!usuario || usuario.role === 'admin') return null;
  const ultimo = fechaDe(usuario.displayNameChangedAt);
  if (!ultimo) return null;

  const siguiente = new Date(
    ultimo.getTime() + DISPLAY_NAME_COOLDOWN_DAYS * 86_400_000,
  );
  return siguiente.getTime() > ahora ? siguiente : null;
}

export function puedeCambiarDisplayName(
  usuario: Pick<User, 'displayNameChangedAt' | 'role'> | null | undefined,
  ahora = Date.now(),
): boolean {
  return siguienteCambioDisplayName(usuario, ahora) === null;
}

/** `@usuario`, para pintarlo donde corresponda. */
export function handleDe(usuario: Pick<User, 'username'> | null | undefined): string {
  const username = (usuario?.username ?? '').trim();
  return username ? `@${username}` : '';
}

/** Texto principal: nombre visible, con el identificador como respaldo. */
export function nombreVisibleDe(
  usuario: Pick<User, 'displayName' | 'username'> | null | undefined,
  respaldo = 'Usuario',
): string {
  return usuario?.displayName?.trim() || usuario?.username?.trim() || respaldo;
}
