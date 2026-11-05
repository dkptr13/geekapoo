// ======================================================
// IDENTIDAD DE USUARIO (BACKEND)
// ======================================================
//
// Copia deliberada de la parte pura de `src/data/usernames.ts`.
// Cloud Functions y la web son paquetes separados y no comparten
// código. `tests/logica.usuarios.ts` compara las listas y los
// formatos para que no diverjan.

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export const DISPLAY_NAME_MIN = 2;
export const DISPLAY_NAME_MAX = 30;

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
