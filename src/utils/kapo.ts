import {
  KAPO_FALLBACK,
  KAPO_MENSAJES,
  mensajesDe,
  type KapoContext,
  type KapoMessage,
} from '../data/kapoDialogues';
import type { AppNotification } from '../types/notifications';

// ======================================================
// LÓGICA DE KAPO-CHAN (sin React)
// ======================================================
//
// Todo lo que decide QUÉ decir y CUÁNTO se calla la mascota,
// separado del componente que la pinta. Así se puede comprobar
// sin navegador (`tests/logica.kapo.ts`), que es lo que evita el
// tipo de bug que no se ve: un mensaje que nunca sale, o uno que
// sale cada cinco segundos.

/**
 * Elige un mensaje de un contexto sin repetir el último ni los
 * que se recuerdan en `recientes`.
 *
 * El "último" se excluye de la tirada siempre que haya más de
 * una opción. Es lo que hace que alternar entre dos secciones
 * no se quede enganchado en las dos únicas frases que tienen:
 * sin esto, ir y venir entre la wiki y la comunidad daría
 * siempre las mismas dos.
 *
 * `recientes` es una memoria corta de sesión: si se puede elegir
 * algo que no haya salido hace poco, se elige. Cuando ya se han
 * gastado todas las variantes se vuelve al banco completo, porque
 * es preferible repetir a quedarse muda.
 *
 * El número aleatorio se recibe como parámetro y no se genera
 * aquí. Es lo que permite que los tests sean deterministas: con
 * `Math.random()` dentro, comprobar que "no repite" sería
 * imposible.
 */
export function elegirMensaje(
  contexto: KapoContext,
  ultimoId: string | null,
  azar: number = Math.random(),
  banco: KapoMessage[] = KAPO_MENSAJES,
  recientes: string[] = [],
): KapoMessage {
  const candidatos = banco.filter((m) => m.context === contexto);
  if (candidatos.length === 0) return KAPO_FALLBACK;

  let disponibles = candidatos;
  if (recientes.length > 0) {
    const frescos = candidatos.filter((m) => !recientes.includes(m.id));
    if (frescos.length > 0) disponibles = frescos;
  }

  const sinRepetir =
    ultimoId && disponibles.length > 1
      ? disponibles.filter((m) => m.id !== ultimoId)
      : disponibles;

  const i = Math.min(sinRepetir.length - 1, Math.floor(azar * sinRepetir.length));
  return sinRepetir[i];
}

/** Cuántas frases hay para un contexto. */
export const frasesDe = (contexto: KapoContext): number => mensajesDe(contexto).length;

/**
 * Cuánto tiempo retiene la pantalla un evento importante antes de
 * que un mensaje normal pueda taparlo.
 *
 * TIENE QUE SER MAYOR que `ENFRIADO_MS`, y hay un assert que lo
 * vigila. No es un detalle: con un valor menor, la protección no
 * existiría. El enfriado ya impide un mensaje normal durante 45
 * segundos, así que un tope de 12s se cumpliría siempre en el
 * momento en que el mensaje normal se presentara, y el evento se
 * taparía en cuanto le dejara hablar. Con 60s, tras un "¡LEVEL
 * UP!" la mascota aguanta el evento un minuto entero.
 */
export const EVENTO_EN_PANTALLA_MS = 60_000;

/**
 * ¿Tiene sentido enseñar ya este mensaje?
 *
 * Las reglas, en orden:
 *
 *   1. Los mensajes NORMALES esperan al enfriado. Los eventos
 *      importantes (prioridad 50 o más) no: si el usuario acaba de
 *      subir de nivel y la mascota está en pleno mensaje, esperar
 *      a que "pueda hablar" es perder el momento.
 *
 *   2. Un poke interrumpe siempre. Es el usuario pidiendo que
 *      hable, y la única razón por la que un texto de prioridad 0
 *      puede algo.
 *
 *   3. Un evento importante pisa a un mensaje normal.
 *
 *   4. Un mensaje normal NO pisa a un evento importante mientras
 *      este lleve `EVENTO_EN_PANTALLA_MS` en pantalla. Ese valor
 *      tiene que ser mayor que el enfriado (hay un assert que lo
 *      vigila): si fuera menor, la protección no serviría de nada,
 *      porque para cuando el normal se presentara ya se habría
 *      cumplido.
 *
 *   5. Dos mensajes del mismo peso: sale el nuevo. Ya ha pasado
 *      el enfriado (punto 1), así que no hay nada más que mirar.
 */
export function debeMostrar(
  actual: KapoMessage | null,
  nuevo: KapoMessage,
  ahoraMs: number,
  ultimoMs: number | null,
  enfriadoMs: number,
): boolean {
  if (ultimoMs === null) return true;

  const pasado = ahoraMs - ultimoMs;

  // 1. Enfriado de los normales.
  if (nuevo.priority < 50 && pasado < enfriadoMs) return false;

  if (!actual) return true;

  // 2. El poke interrumpe.
  if (nuevo.context === 'poke' && actual.context !== 'poke') return true;

  // 3. Importante gana a normal.
  if (nuevo.priority > actual.priority) return true;

  // 4. Normal sobre importante: solo cuando este ya ha pasado.
  if (nuevo.priority < actual.priority) return pasado > EVENTO_EN_PANTALLA_MS;

  // 5. Mismo peso: sale el nuevo.
  return true;
}

/**
 * Enfriado por defecto entre mensajes normales.
 *
 * 45 segundos. Es lo bastante corto para que la mascota parezca
 * viva y lo bastante largo para no estar hablando sin parar.
 */
export const ENFRIADO_MS = 45_000;

/** Enfriado para los eventos importantes: mucho más corto. */
export const ENFRIADO_EVENTO_MS = 2_000;

/**
 * Una recomendación hecha con la actividad REAL del usuario.
 *
 * La fuente es `stats.animeXp`: el XP que ha acumulado en cada
 * anime, que la Cloud Function lleva la cuenta cada vez que
 * comenta o recibe un "Me gusta" en esa sección. Es una
 * actividad real y contada por el servidor, no una opinión.
 *
 * Y si no hay nada, no se dice nada. Es preferible que Kapo se
 * quede callada a que diga "te gustan los shonen" sin nada detrás:
 * inventar un gusto es justo lo que no hay que hacer. Por eso
 * devuelve `null` en lugar de un texto de relleno, y quien lo
 * llama simplemente no pinta nada.
 *
 * @param animeXp  `animeId → XP acumulado` (de `stats`).
 * @param animes   Catálogo, para poner el título y la categoría.
 * @param umbral   XP mínimo para darlo por relevante.
 */
export function recomendacionDesdeActividad(
  animeXp: Record<string, number> | undefined,
  animes: Record<string, { title: string; category?: string; genres?: string[] }>,
  umbral = 20,
): string | null {
  const entradas = Object.entries(animeXp ?? {})
    .map(([id, xp]) => ({ id, xp: Math.max(0, Number(xp) || 0) }))
    .filter((e) => e.xp >= umbral)
    .sort((a, b) => b.xp - a.xp);

  if (entradas.length === 0) return null;

  const mejor = entradas[0];
  const anime = animes[mejor.id];
  if (!anime?.title) return null;

  const genero = anime.genres?.[0] ?? anime.category;

  if (!genero) {
    return `👀 Llevas mucho con ${anime.title}. Se te dan bien las cosas de anime.`;
  }

  return `👀 Por lo que llevas con ${anime.title}, diría que el ${genero} te pega. ¿Seguimos por ahí?`;
}

// ======================================================
// EVENTOS SOCIALES → MENSAJE
// ======================================================

const MEDALLAS_DE_CLUB = new Set([
  'medal_puentes',
  'medal_explorador_social',
  'medal_fundador_club',
  'medal_arquitecto_canales',
  'medal_fundador_leyendas',
  'medal_arquitecto_comunidades',
]);

/**
 * Qué contexto de Kapo merece una medalla.
 *
 * No se inventa nada: las de primer hilo y primera voz tienen
 * mensaje propio, las de club también, y el resto cae en el
 * genérico de "medalla". Así una medalla de club no se celebra
 * como si fuera un comentario.
 */
export function contextoDeMedalla(medallaId: string): KapoContext {
  if (medallaId === 'medal_primer_hilo') return 'first_thread';
  if (medallaId === 'medal_primera_voz') return 'first_comment';
  if (MEDALLAS_DE_CLUB.has(medallaId)) return 'club';
  if (medallaId === 'medal_conector_social') return 'chats';
  return 'achievement';
}

export interface KapoNotificacionMinima {
  type: AppNotification['type'];
  actorName?: string;
}

/**
 * Traduce una notificación REAL a una frase de Kapo.
 *
 * Devuelve `null` para los tipos que ya se cuentan por otro lado
 * (`level_up`, `achievement`) o que no deben airearse en un
 * bocadillo (`club_sanction`). No se inventa el nombre de nadie:
 * si no viene, se dice "Alguien".
 */
export function mensajeDeNotificacion(
  notificacion: KapoNotificacionMinima,
): { context: KapoContext; text: string } | null {
  const actor = (notificacion.actorName ?? '').trim().slice(0, 40) || 'Alguien';

  switch (notificacion.type) {
    case 'comment_reply':
      return { context: 'community', text: `💬 ${actor} te ha respondido.` };
    case 'comment_thread':
      return { context: 'community', text: `🧵 ${actor} ha comentado en tu hilo.` };
    case 'mention':
      return { context: 'community', text: `📣 ${actor} te ha mencionado.` };
    case 'post_like':
    case 'post_reaction':
      return { context: 'reaction', text: `❤️ ${actor} ha reaccionado a tu publicación.` };
    case 'comment_like':
    case 'comment_reaction':
      return { context: 'reaction', text: `🔥 ${actor} ha reaccionado a tu comentario.` };
    case 'follow':
      return { context: 'reaction', text: `🌱 ${actor} te sigue.` };
    case 'chat_message':
      return { context: 'chats', text: `✉️ ${actor} te ha escrito por chat.` };
    case 'trivia':
      return { context: 'trivia_done', text: '🧠 ¡Trivia completada! Mañana toca otra.' };
    // Los niveles y las medallas ya los cuenta ProgressionContext.
    // Las sanciones de club se tratan en Soporte, no en un bocadillo.
    case 'level_up':
    case 'achievement':
    case 'club_sanction':
    default:
      return null;
  }
}
