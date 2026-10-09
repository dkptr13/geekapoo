import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { db, functions } from '../lib/firebase';
import type { NewsItem } from '../types';

// ======================================================
// NOTICIAS RSS
// ======================================================
//
// El navegador NO pide los feeds. Ni por CORS ni por ninguna otra
// razón: lo hace la Cloud Function `syncRssNews` cada dos horas y
// deja el resultado en la colección `news`. Aquí solo se lee.
//
// ── POR QUÉ NO SE USA UN CONTEXTO ───────────────────────────────────
//
// `CommunityContext` y `SiteContentContext` existen para contenido que
// la web necesita en varios sitios a la vez, o que se puede modificar
// desde el panel de admin. Las noticias no son ninguna de las dos
// cosas: se pintan en un único widget y nadie las edita desde aquí.
//
// Meterlas en un contexto obligaría a que toda la aplicación montara
// un listener que casi nadie mira, y a que un problema con las noticias
// se notara en sitios donde no se pintan.
//
// ── EL LÍMITE ───────────────────────────────────────────────────────
//
// Se piden solo las 6 primeras, y el widget enseña 5.
//
// Pedir 6 y no 5 es a propósito: entre el momento de la consulta y el
 // que la pinte, una noticia más nueva puede entrar en la colección. Con
 // 5 justas, esa noticia nueva no saldría hasta la siguiente recarga y el
// titular principal se quedaría viejo sin motivo.
//
// Firestore ordena por `pubDate`, que es un texto ISO. Ordenar por texto
// funciona porque el formato ISO 8601 (`2026-10-08T16:00:00.000Z`) ordena
// lexicográficamente igual que por fecha: siempre 4 dígitos de año, 2 de
// mes, 2 de día, y separadores fijos en las mismas posiciones. Es una de
// las pocas cosas donde ordenar como texto es correcto.

export const NEWS = 'news';

/** Cuántas se piden al servidor. El widget enseña una menos. */
export const MAX_NOTICIAS = 6;

/** Cuántas se enseñan. */
export const NOTICIAS_VISIBLES = 5;

/**
 * Escucha las noticias.
 *
 * Se pide el orden y el límite en la consulta y no al filtrar en el
 * navegador, porque así Firestore solo manda seis documentos en vez de
 * toda la colección: la colección envejece con el tiempo y sin esto
 * acabaría descargándose entera en cada carga de la portada.
 *
 * @param {Function} alCambiar recibe las noticias, ya ordenadas
 * @param {Function} [alError] recibe el error de la suscripción
 * @returns {Unsubscribe} para cerrar la escucha
 */
export function subscribeNews(
  alCambiar: (noticias: NewsItem[]) => void,
  alError?: (e: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(db, NEWS), orderBy('pubDate', 'desc'), limit(MAX_NOTICIAS)),
    (snap) => {
      const noticias = snap.docs.slice(0, MAX_NOTICIAS).map((d) => {
        const datos = d.data() as DocumentData;

        // Cada campo se comprueba por separado. El documento lo escribe
        // una función nuestra, pero una regla o un import a medias
        // pueden dejar campos fuera, y un `titulo` a undefined revienta
        // el React y con él la página entera.
        return {
          id: d.id,
          title: typeof datos.title === 'string' ? datos.title : '',
          snippet: typeof datos.snippet === 'string' ? datos.snippet : '',
          link: typeof datos.link === 'string' ? datos.link : '',
          sourceName: typeof datos.sourceName === 'string' ? datos.sourceName : '',
          pubDate: typeof datos.pubDate === 'string' ? datos.pubDate : '',
        };
      });

      alCambiar(noticias.filter((n) => n.title !== '' && n.link !== ''));
    },
    (e) => alError?.(e),
  );
}

// ======================================================
// SINCRONIZAR A MANO
// ======================================================
//
// La funcion programada corre sola cada dos horas, pero hay dos momentos
// en los que no quieres esperar: despues de anadir una fuente nueva, y
// cuando algo falla y hay que ver el error ya.
//
// La comprobacion de quien es admin la hace la funcion, no el boton: el
 // boton se puede esconder o no, pero aunque se mostrara, las reglas siguen
// sin dejar escribir en ews al navegador y la funcion sigue negando
// el permiso a quien no sea del equipo.

/** Lo que devuelve una sincronizacion a mano. */
export interface ResultadoSincronizacion {
  /** Cuantos items salieron de los feeds. */
  leidas: number;
  /** Cuantos documentos se escribieron de verdad. */
  guardadas: number;
  /** Un texto por cada fuente que no se pudo leer. */
  fallidas: string[];
  /** Cuantas noticias viejas se borraron. */
  podadas: number;
}

/**
 * Fuerza una sincronizacion de las noticias ahora.
 *
 * @returns {Promise<ResultadoSincronizacion>}
 * @throws si no se tiene permiso, o si el servicio no contesta
 */
export function sincronizarAhora(): Promise<ResultadoSincronizacion> {
  const llamar = httpsCallable<Record<string, never>, ResultadoSincronizacion>(
    functions,
    'sincronizarNoticias',
  );

  return llamar({}).then((r) => r.data);
}