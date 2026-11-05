import { httpsCallable } from 'firebase/functions';

import { functions } from '../lib/firebase';
import {
  errorUsername,
  normalizarUsername,
  usernameReservado,
  usernameValido,
} from '../data/usernames';

// ======================================================
// RESERVA DE NOMBRES DE USUARIO
// ======================================================
//
// La disponibilidad del formulario es solo informativa: la reserva
// de verdad la hace la Cloud Function en una transacción. Entre la
// comprobación y el registro pueden pasar milisegundos, así que el
// backend siempre vuelve a comprobar y responde `already-exists` si
// otra persona se adelantó.

export type EstadoUsername =
  | 'vacio'
  | 'invalido'
  | 'reservado'
  | 'comprobando'
  | 'disponible'
  | 'ocupado'
  | 'error';

export interface ResultadoDisponibilidad {
  estado: EstadoUsername;
  mensaje: string;
  username: string;
}

/** Comprueba si un identificador está libre. No reserva nada. */
export async function comprobarUsername(
  valor: string,
): Promise<ResultadoDisponibilidad> {
  const username = normalizarUsername(valor);
  if (!username) {
    return { estado: 'vacio', mensaje: 'Introduce un nombre de usuario.', username };
  }

  const error = errorUsername(username);
  if (error) {
    return {
      estado: usernameReservado(username) ? 'reservado' : 'invalido',
      mensaje: error,
      username,
    };
  }

  try {
    const llamar = httpsCallable<
      { username: string },
      { estado: EstadoUsername; mensaje: string; username: string }
    >(functions, 'comprobarUsername');
    const respuesta = await llamar({ username });
    return {
      estado: respuesta.data.estado,
      mensaje: respuesta.data.mensaje,
      username: respuesta.data.username ?? username,
    };
  } catch (e) {
    console.error('[Identidad] No se pudo comprobar el nombre de usuario:', e);
    return {
      estado: 'error',
      mensaje: 'No se pudo comprobar la disponibilidad. Inténtalo de nuevo.',
      username,
    };
  }
}

/**
 * Identificador permanente de la cuenta autenticada, si ya tiene una
 * reserva confirmada (por ejemplo, después de borrar el perfil).
 *
 * Devuelve `null` si la cuenta es nueva o si la consulta falla: en
 * ese caso el formulario propone un identificador nuevo y el backend
 * sigue siendo quien decide.
 */
export async function obtenerUsernamePermanente(): Promise<string | null> {
  try {
    const llamar = httpsCallable<
      Record<string, never>,
      { username: string | null }
    >(functions, 'miUsername');
    const respuesta = await llamar({});
    return respuesta.data.username ?? null;
  } catch (e) {
    console.warn('[Identidad] No se pudo leer el nombre permanente:', e);
    return null;
  }
}

/**
 * Reserva el identificador para la cuenta autenticada.
 *
 * Debe llamarse DESPUÉS de crear el usuario de Firebase Auth y ANTES
 * de crear su perfil. Si el perfil no llega a crearse, se libera con
 * `liberarUsername`.
 */
export async function reservarUsername(valor: string): Promise<string> {
  const username = normalizarUsername(valor);
  if (!usernameValido(username)) {
    throw new Error(errorUsername(username) ?? 'Ese nombre de usuario no es válido.');
  }

  try {
    const llamar = httpsCallable<
      { username: string },
      { ok: boolean; username: string }
    >(functions, 'reservarUsername');
    const respuesta = await llamar({ username });
    return respuesta.data.username ?? username;
  } catch (e) {
    const code = (e as { code?: string } | null)?.code ?? '';
    if (code.includes('already-exists')) {
      throw new Error('Ese nombre de usuario ya está en uso. Elige otro.');
    }
    if (code.includes('invalid-argument')) {
      throw new Error(
        (e as { message?: string })?.message ||
          'Ese nombre de usuario no es válido.',
      );
    }
    if (code.includes('failed-precondition')) {
      throw new Error('Esta cuenta ya tiene un nombre de usuario.');
    }
    throw e instanceof Error
      ? e
      : new Error('No se pudo reservar el nombre de usuario.');
  }
}

/** Libera una reserva que no llegó a tener perfil. */
export async function liberarUsername(valor: string): Promise<void> {
  const username = normalizarUsername(valor);
  if (!username) return;

  try {
    const llamar = httpsCallable<{ username: string }, { ok: boolean }>(
      functions,
      'liberarUsername',
    );
    await llamar({ username });
  } catch (e) {
    // No es crítico: si falla, la cuenta de Auth se borra igual y la
    // reserva huérfana se puede limpiar con la migración.
    console.warn('[Identidad] No se pudo liberar la reserva:', e);
  }
}

/**
 * Crea el perfil y confirma la reserva del identificador en una sola
 * transacción del servidor. Es el camino normal del registro y de
 * GitHub/Google; no deja un estado intermedio entre reserva y perfil.
 */
export async function crearPerfilUsuario(input: {
  username: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
}): Promise<{ username: string; chatId: string }> {
  try {
    const llamar = httpsCallable<
      {
        username: string;
        displayName: string;
        email?: string;
        avatarUrl?: string;
        bio?: string;
      },
      { ok: boolean; username: string; chatId: string }
    >(functions, 'crearPerfilUsuario');
    const respuesta = await llamar(input);
    return {
      username: respuesta.data.username,
      chatId: respuesta.data.chatId,
    };
  } catch (e) {
    const code = (e as { code?: string } | null)?.code ?? '';
    if (code.includes('already-exists')) {
      throw new Error('Ese nombre de usuario ya está en uso. Elige otro.');
    }
    if (code.includes('invalid-argument')) {
      const mensaje = (e as { message?: string })?.message;
      throw new Error(
        mensaje && !mensaje.includes('internal')
          ? mensaje
          : 'Los datos de identidad no son válidos.',
      );
    }
    if (code.includes('failed-precondition')) {
      throw new Error(
        (e as { message?: string })?.message ||
          'Esta cuenta ya tiene un nombre de usuario permanente.',
      );
    }
    throw e instanceof Error
      ? e
      : new Error('No se pudo crear el perfil de usuario.');
  }
}
