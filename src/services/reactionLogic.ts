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
 * Se usa para indexar los mapas de la interfaz y para filtrar los
 * documentos que llegan de Firestore. La "firma" del hook es otra
 * cosa: incluye tipo, chat e id para decidir cuándo reiniciar las
 * escuchas. Si la clave y el filtro divergen, no se ven contadores
 * y no hay error que lo delate; por eso está aquí, sola.
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
  /**
   * Solo para `chat_message`: chat al que pertenece el mensaje.
   *
   * Sin este dato no se puede consultar ni leer la reacción con las
   * reglas nuevas: la consulta tiene que filtrar por `chatId` y la
   * regla comprueba que quien lee sea miembro.
   */
  chatId?: string;
}

/**
 * Una consulta de reacciones ya delimitada por lo que las reglas
 * pueden autorizar.
 *
 * No se pueden mezclar hilos, comentarios y mensajes en una sola
 * consulta: la regla de un mensaje depende de `chatId` y de la
 * pertenencia al chat, y Firestore no aplica reglas como filtro.
 * Cada grupo se consulta con sus igualdades correspondientes.
 */
export interface ConsultaReacciones {
  targetType: ReactionTargetType;
  /** Solo en `chat_message`. */
  chatId?: string;
  /** Ids de objetivo que van en el `in` de esa consulta. */
  ids: string[];
}

/**
 * Agrupa los objetivos de la pantalla en consultas que las reglas
 * pueden aceptar:
 *
 *   · hilo / comentario → `targetType` + `targetId in [...]`;
 *   · mensaje → `targetType` + `chatId` + `targetId in [...]`.
 *
 * Los mensajes sin `chatId` se omiten: consultarlos sin ese campo
 * devolvería un listado que las reglas tienen que denegar (y, si no
 * lo hicieran, estaría enseñando reacciones de un chat privado).
 */
export function consultasDeReacciones(
  objetivos: ObjetivoReaccion[],
): ConsultaReacciones[] {
  const grupos = new Map<
    string,
    { targetType: ReactionTargetType; chatId?: string; ids: Set<string> }
  >();

  objetivos.forEach((o) => {
    if (!o.targetId) return;
    if (o.targetType === 'chat_message' && !o.chatId) return;

    const chatId = o.targetType === 'chat_message' ? o.chatId : undefined;
    const clave = `${o.targetType}\u0000${chatId ?? ''}`;
    const grupo = grupos.get(clave) ?? {
      targetType: o.targetType,
      ...(chatId ? { chatId } : {}),
      ids: new Set<string>(),
    };
    grupo.ids.add(o.targetId);
    grupos.set(clave, grupo);
  });

  return [...grupos.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, g]) => ({
      targetType: g.targetType,
      ...(g.chatId ? { chatId: g.chatId } : {}),
      ids: [...g.ids].sort(),
    }));
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
 * `targetId` fuera literalmente "thread_demo-thread-kaguya", que
 * no existe. No hay error, no hay aviso y no sale un solo
 * contador.
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
 * aunque la consulta ya va separada por tipo y chat, el mapa de la
 * interfaz necesita el tipo dentro para que un hilo y un comentario
 * con el mismo id no se pisen. Con este filtro, cada tarjeta enseña
 * lo suyo y solo lo suyo.
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

/**
 * Tope de mensajes por consulta de reacciones de chat.
 *
 * La regla de lectura de un mensaje comprueba la pertenencia al chat
 * y que el mensaje exista. Firestore limita las lecturas que puede
 * hacer una regla por petición (10), y cada mensaje del `in` gasta
 * una. Con 8 mensajes más la lectura del chat quedamos por debajo;
 * si se subiera al mismo 25 que las reacciones públicas, una lista
 * con muchas reacciones podría fallar entera por presupuesto.
 */
export const MAX_POR_CONSULTA_CHAT = 8;

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
