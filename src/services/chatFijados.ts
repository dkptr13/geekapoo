import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import { toIsoString } from './firestoreUtils';
import type { ChatMessage } from '../types';

// ======================================================
// MENSAJES FIJADOS
// ======================================================
//
// DÓNDE VIVEN: `chats/{chatId}/fijados/{messageId}`.
//
// El id del documento es el id del MENSAJE. Eso no es un
// detalle: es lo que hace el sistema entero.
//
//   · No se puede fijar dos veces el mismo mensaje: el
//     documento ya existiría y `setDoc` (sin merge) fallaría.
//   · Las reglas pueden comprobar la ruta exacta, sin
//     consultas: `get(/chats/X/messages/Y)` para saber que el
//     mensaje existe, y `exists(/chats/X/fijados/Y)` para saber
//     que no está ya fijado.
//   · El panel se abre con UNA consulta a la subcolección, sin
//     descargar el historial del chat.
//
// El texto del mensaje se COPIA en el documento del fijado:
// así el panel se pinta sin necesidad de leer los mensajes, y
// el aviso sobrevive aunque el original se borre.
// ======================================================

const FIJADOS = 'fijados';

/** Un mensaje fijado en una conversación. */
export interface ChatFijado {
  /** Id del documento = id del mensaje fijado. */
  id: string;
  chatId: string;
  /** Id del mensaje original. */
  messageId: string;
  /** Quién escribió el mensaje. */
  autorId: string;
  autorNombre: string;
  autorAvatar: string;
  /** Texto (o resumen) del mensaje. */
  texto: string;
  /** Tipo de contenido: 'text' | 'image' | 'gif' | 'link' | ... */
  tipo: string;
  /** Si lleva imagen, su URL (para la vista previa). */
  imagenUrl?: string;
  /** Si lleva GIF, su URL. */
  gifUrl?: string;
  /** Cuándo se escribió el mensaje original (ISO). */
  mensajeCreadoEn: string;
  /** Quién lo fijó. */
  fijadoPor: string;
  fijadoPorNombre: string;
  /** Cuándo se fijó (ISO). */
  fijadoEn: string;
}

/**
 * Resumen del contenido de un mensaje, para el panel.
 *
 * No se guarda el mensaje entero (con su adjunto entero), solo
 * lo justo para reconocerlo de un vistazo: un texto, o una
 * descripción del adjunto.
 */
function resumenDe(msg: ChatMessage): { texto: string; tipo: string; imagenUrl?: string; gifUrl?: string } {
  const cuerpo = (msg.body ?? '').trim();
  if (msg.gif) {
    return {
      texto: cuerpo || 'GIF',
      tipo: 'gif',
      gifUrl: typeof msg.gif.url === 'string' ? msg.gif.url : undefined,
    };
  }
  if (msg.imageUrl) {
    return { texto: cuerpo || 'Imagen', tipo: 'image', imagenUrl: msg.imageUrl };
  }
  if (cuerpo) {
    const esEnlace = /https?:\/\/\S+/i.test(cuerpo);
    return { texto: cuerpo.slice(0, 300), tipo: esEnlace ? 'link' : 'text' };
  }
  return { texto: 'Mensaje sin texto', tipo: 'text' };
}

/**
 * Fija un mensaje.
 *
 * `setDoc` SIN merge: si el mensaje ya estaba fijado, el
 * documento existe y la escritura falla. Así "fijar dos veces"
 * no es posible ni por la interfaz ni llamando a la función a
 * mano.
 */
export async function fijarMensaje(params: {
  chatId: string;
  msg: ChatMessage;
  uid: string;
  nombre: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { chatId, msg, uid, nombre } = params;
  try {
    const resumen = resumenDe(msg);
    await setDoc(doc(db, 'chats', chatId, FIJADOS, msg.id), {
      chatId,
      messageId: msg.id,
      autorId: msg.senderId,
      autorNombre: msg.senderName,
      autorAvatar: msg.senderAvatar ?? '',
      texto: resumen.texto,
      tipo: resumen.tipo,
      ...(resumen.imagenUrl ? { imagenUrl: resumen.imagenUrl } : {}),
      ...(resumen.gifUrl ? { gifUrl: resumen.gifUrl } : {}),
      mensajeCreadoEn: msg.createdAt,
      fijadoPor: uid,
      fijadoPorNombre: nombre,
      fijadoEn: serverTimestamp(),
    });
    return { ok: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '';
    if (msg.includes('already exists') || msg.includes('ALREADY_EXISTS')) {
      return { ok: false, error: 'Ese mensaje ya estaba fijado.' };
    }
    return { ok: false, error: e instanceof Error ? e.message : 'No se pudo fijar el mensaje.' };
  }
}

/** Quita un mensaje de los fijados. */
export async function desfijarMensaje(
  chatId: string,
  messageId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await deleteDoc(doc(db, 'chats', chatId, FIJADOS, messageId));
    return { ok: true };
  } catch (e: unknown) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'No se pudo quitar el mensaje fijado.',
    };
  }
}

/** Escucha los mensajes fijados de una conversación. */
export function subscribeFijados(
  chatId: string,
  alCambiar: (fijados: ChatFijado[]) => void,
  alError?: (e: Error) => void,
): () => void {
  if (!chatId) {
    alCambiar([]);
    return () => undefined;
  }
  return onSnapshot(
    query(collection(db, 'chats', chatId, FIJADOS), orderBy('fijadoEn', 'desc')),
    (snap) =>
      alCambiar(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            chatId: typeof data.chatId === 'string' ? data.chatId : chatId,
            messageId: typeof data.messageId === 'string' ? data.messageId : d.id,
            autorId: typeof data.autorId === 'string' ? data.autorId : '',
            autorNombre: typeof data.autorNombre === 'string' ? data.autorNombre : 'Alguien',
            autorAvatar: typeof data.autorAvatar === 'string' ? data.autorAvatar : '',
            texto: typeof data.texto === 'string' ? data.texto : '',
            tipo: typeof data.tipo === 'string' ? data.tipo : 'text',
            imagenUrl: typeof data.imagenUrl === 'string' ? data.imagenUrl : undefined,
            gifUrl: typeof data.gifUrl === 'string' ? data.gifUrl : undefined,
            mensajeCreadoEn:
              typeof data.mensajeCreadoEn === 'string' ? data.mensajeCreadoEn : '',
            fijadoPor: typeof data.fijadoPor === 'string' ? data.fijadoPor : '',
            fijadoPorNombre:
              typeof data.fijadoPorNombre === 'string' ? data.fijadoPorNombre : 'Alguien',
            fijadoEn: toIsoString(data.fijadoEn),
          } satisfies ChatFijado;
        }),
      ),
    (e) => alError?.(e),
  );
}

/** Si un mensaje está fijado (para pintar el distintivo). */
export async function estaFijado(chatId: string, messageId: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'chats', chatId, FIJADOS, messageId));
    return snap.exists();
  } catch {
    return false;
  }
}
