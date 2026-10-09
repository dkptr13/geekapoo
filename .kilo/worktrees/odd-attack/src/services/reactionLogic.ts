import { EMOJIS, EMOJI_POR_CLAVE, type EmojiInfo } from '../data/emojis';
import type {
  ReactionCounts,
  ReactionTargetType,
  ReactionType,
} from '../types';

// ======================================================
// LÓGICA DE REACCIONES (sin Firestore)
// ======================================================
//
// Todo lo que decide CÓMO se agrupan y se pintan las reacciones,
// separado de lo que las escribe en Firestore
// (`services/reactions.ts`).
//
// El motivo no es la.mockito: es que esta parte no necesita
// conexión ni credenciales, así que se puede comprobar sin
// navegador y sin emulador (`npm run test:logica`). Ya ha
// pasado algo que solo se habría visto en la web: la clave de un
// objetivo se armaba con dos separadores distintos en dos sitios,
// el filtro no coincidía con nada y los contadores no se
// pintaban, sin un solo error en consola.

/**
 * Clave de un objetivo dentro de los mapas de la interfaz.
 *
 * Se usa en DOS sitios que tienen que decir exactamente lo mismo:
 * la "firma" que el hook arma para saber qué está en pantalla, y
 * el filtro que agrupa los documentos que llegan. Si divergen, no
 * se ven contadores y no hay error que lo delate. Por eso está
 * aquí, sola, y en un solo archivo.
 */
export function reactionKey(
  targetType: ReactionTargetType,
  targetId: string,
): string {
  return `${targetType}_${targetId}`;
}

/** Un objetivo que se puede reaccionar: un hilo, un comentario o un mensaje. */
export interface ObjetivoReaccion {
  targetType: ReactionTargetType;
  targetId: string;
}

/**
 * Los valores que se piden en la consulta: el `targetId` DE CADA
 * OBJETIVO, sin más.
 *
 * ── La trampa ──────────────────────────────────────────────
 *
 * La reacción se guarda con `targetId` = el id del contenido a
 * secas ("demo-thread-kaguya"), pero en la interfaz se agrupa con
 * `reactionKey` = "tipo" + "_" + id ("thread_demo-thread-kaguya"),
 * porque un hilo y un comentario pueden compartir id.
 *
 * Son dos cosas distintas, y confundirlas hace que la consulta
 * devuelva SIEMPRE CERO documentos: se buscarían reacciones cuyo
 * `targetId` fuera literally "thread_demo-thread-kaguya", que no
 * existe. No hay error, no hay aviso y no sale un solo contador;
 * solo se ve la reacción propia, que viene de otra escucha.
 *
 * Por eso están en dos funciones separadas y no en una.
 */
export function idsParaConsulta(objetivos: ObjetivoReaccion[]): string[] {
  return [...new Set(objetivos.map((o) => o.targetId).filter(Boolean))].sort();
}

/**
 * Las claves con las que se indexan los mapas: una por objetivo,
 * y con el tipo dentro.
 *
 * Sirve para FILTRAR en el cliente lo que llega de la consulta:
 * la consulta pide solo por `targetId`, así que también puede
 * devolver reacciones de un comentario cuando lo que se está
 * mirando es un hilo con ese mismo id. Con este filtro, cada
 * tarjeta enseña lo suyo y solo lo suyo.
 */
export function clavesParaAgrupar(objetivos: ObjetivoReaccion[]): Set<string> {
  return new Set(
    objetivos
      .map((o) => (o.targetId ? reactionKey(o.targetType, o.targetId) : ''))
      .filter(Boolean),
  );
}

/**
 * Id del documento de una reacción.
 *
 * Fijar el id en vez de dejar que lo genere Firestore es lo que
 * hace que "cambiar de reacción" edite un documento en vez de
 * crear otro, y lo que hace imposible tener dos reacciones del
 * mismo tipo a la vez.
 */
export function reactionDocId(
  targetType: ReactionTargetType,
  targetId: string,
  uid: string,
): string {
  return `reac_${targetType}_${targetId}_${uid}`;
}

/** Cuántos ids caben en un `in` de Firestore (el límite son 30). */
export const MAX_POR_CONSULTA = 25;

/** Una reacción tal y como viene de Firestore. */
export interface ReactionRow {
  id: string;
  targetType: ReactionTargetType;
  targetId: string;
  userId: string;
  type: ReactionType;
  userName?: string;
  chatId?: string;
}

/** Lo que se guarda en memoria para un objetivo concreto. */
export interface ReaccionesDeObjetivo {
  /** clave → número de personas. */
  counts: ReactionCounts;
  /** clave → nombres de quien la tiene (para el popup de "quién"). */
  nombres: Record<string, string[]>;
  /** Cuántas reacciones lleva en total este objetivo. */
  total: number;
}

/** Contenido sin reacciones: la barra se pinta vacía, no se rompe. */
export const REACCIONES_VACIAS: ReaccionesDeObjetivo = {
  counts: {},
  nombres: {},
  total: 0,
};

/** Suma (o resta) una reacción a un recuento ya calculado. */
export function sumar(
  counts: ReactionCounts,
  type: ReactionType,
  delta: number,
): ReactionCounts {
  const siguiente = { ...counts };
  const valor = (siguiente[type] ?? 0) + delta;

  if (valor > 0) siguiente[type] = valor;
  else delete siguiente[type];

  return siguiente;
}

/**
 * Cuántas reacciones se pintan como pastilla.
 *
 * Tres, y no más. Con cinco o seis tipos distintos la barra se
 * convierte en una lista de números que nadie lee, y lo que
 * interesa de una reacción es la que más gente comparte. El resto
 * no se pierde: se esconde detrás de una pastilla "+N" que abre
 * el catálogo entero con los contadores de cada uno.
 */
export const MAX_PASTILLAS = 3;

/**
 * Las reacciones más puestas, de más a menos.
 *
 * El desempate es el ORDEN DEL CATÁLOGO (🔥 antes que 😂), no un
 * criterio accidental: si dos reacciones tienen los mismos votos
 * tienen que salir siempre en el mismo sitio, o la barra
 * recolocaría sola las pastillas cada vez que alguien reacciona.
 *
 * Las claves que no están en el catálogo se descartan: puede
 * haber documentos viejos con una clave que ya no existe (el
 * catálogo ha cambiado), y pintar un hueco vacío —"• 3"— sería
 * peor que no enseñarlo.
 */
export function topReacciones(
  counts: ReactionCounts,
  limite: number = MAX_PASTILLAS,
): string[] {
  const conVotos: { clave: string; votos: number; orden: number }[] = [];

  EMOJIS.forEach((e, orden) => {
    const n = counts[e.key] ?? 0;
    if (n > 0) conVotos.push({ clave: e.key, votos: n, orden });
  });

  return conVotos
    .sort((a, b) => b.votos - a.votos || a.orden - b.orden)
    .slice(0, limite)
    .map((r) => r.clave);
}

/** Cuántos tipos de reacción hay en total (los que se pintan + los ocultos). */
export function totalReacciones(counts: ReactionCounts): number {
  return EMOJIS.reduce((n, e) => n + ((counts[e.key] ?? 0) > 0 ? 1 : 0), 0);
}

/** Emoji de una clave del catálogo, o un punto si no existe. */
export function emojiDeReaccion(clave: string | undefined | null): string {
  return (clave && EMOJI_POR_CLAVE[clave]?.emoji) || '•';
}

/** Datos del emoji de una clave, si existe. */
export function infoDeReaccion(clave: string | undefined | null): EmojiInfo | undefined {
  return clave ? EMOJI_POR_CLAVE[clave] : undefined;
}

/** Texto para "1 voto" / "3 votos", en el singular que toca. */
export function votos(n: number): string {
  return `${n} ${n === 1 ? 'voto' : 'votos'}`;
}
