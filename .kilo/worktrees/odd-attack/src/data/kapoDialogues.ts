// ======================================================
// BANCO DE FRASES DE KAPO-CHAN
// ======================================================
//
// Los textos están AQUÍ, en el código, y no en Firestore, por el
// mismo motivo que el catálogo de emojis: son un conjunto fijo de
// frases cortas, y para leerlas de la base de datos habría que
// hacer una consulta antes de poder pintar un bocadillo.
//
// La colección `mascot_dialogues` de antes SIGUE funcionando y NO
// se ignora: esos textos se quedan como banco de reserva para los
// mensajes normales (lo ve `useKapo`), así que un administrador
// que escriba frases en el panel las sigue viendo.
//
// ── Cómo se elige un mensaje ──────────────────────────────
//
// No al azar de una sola lista, sino en tres pasos:
//
//   1. Lo que HA PASADO (un evento): subir de nivel, ganar una
//      medalla, terminar la trivia. Son raros y ganan a todo lo
//      demás.
//   2. Dónde ESTÁS (un contexto): la wiki, la comunidad, el
//      perfil.
//   3. Qué ESTÁS HACIENDO (normal): un poke, la bienvenida.
//
// La prioridad es un NÚMERO y no un simple orden de `if`, porque
// así `useKapo` decide con una comparación si un mensaje pendiente
// tiene que reemplazar el que está en pantalla, en vez de una
// escalera de condiciones que alguien acabará rompiendo.

export type KapoContext =
  // ── By section ────────────────────────────────────────
  | 'home'
  | 'wiki'
  | 'search'
  | 'community'
  | 'profile'
  | 'chats'
  | 'achievements'
  | 'trivia'
  | 'support'
  // ── Events ────────────────────────────────────────────
  | 'level_up'
  | 'achievement'
  | 'trivia_done'
  | 'first_thread'
  | 'first_comment'
  // ── Normal ────────────────────────────────────────────
  | 'welcome_back'
  | 'poke'
  // ── User-chosen ───────────────────────────────────────
  | 'navigating';

export type KapoAnimation = 'idle' | 'happy' | 'hype' | 'thinking';

export interface KapoMessage {
  /** Id único, y además sirve para "no repetir este". */
  id: string;
  context: KapoContext;
  text: string;
  /** Mayor gana. Ver la tabla de arriba. */
  priority: number;
  /** Ánimo que pone la mascota mientras lo dice. */
  animation: KapoAnimation;
}

/**
 * Prioridades.
 *
 * Números y no un simple orden, porque `useKapo` los compara para
 * decidir si un mensaje en cola reemplaza al que está en pantalla.
 * Ponerlos aquí deja esa comparación legible de un vistazo, en vez
 * de escondida en una escalera de `if`s.
 *
 * 100 nivel, 95 medalla, 90 trivia: las tres cosas que el usuario
 * quiere saber y que solo pasan una vez.
 * 70 primer hilo / primer comentario: también de una vez, un pelo
 * por debajo porque celebran el perfil más que un logro.
 * 50 bienvenida: solo al cargar, una vez.
 * 10 contexto: al cambiar de sección.
 * 0 poke: cuando lo pide, y el único que puede interrumpir.
 */
export const PRIORIDAD = {
  level_up: 100,
  achievement: 95,
  trivia_done: 90,
  first_thread: 70,
  first_comment: 70,
  welcome_back: 50,
  context: 10,
  poke: 0,
} as const satisfies Record<string, number>;

const P = PRIORIDAD;

/**
 * El banco.
 *
 * Cuatro o cinco frases por contexto, no una, para que la mascota
 * no diga siempre lo mismo. `elegirMensaje` además evita repetir
 * la última que salió, así que ir y venir entre dos secciones no
 * se queda enganchado en las dos únicas frases que tienen.
 */
export const KAPO_MENSAJES: KapoMessage[] = [
  // ── Start ─────────────────────────────────────────────
  { id: 'home_1', context: 'home', text: '👋 ¡Bienvenido a Geekapoo!', priority: P.context, animation: 'happy' },
  { id: 'home_2', context: 'home', text: '🍜 ¿Qué anime tenemos pendiente hoy?', priority: P.context, animation: 'idle' },
  { id: 'home_3', context: 'home', text: '✨ ¡Qué bueno verte por aquí!', priority: P.context, animation: 'happy' },
  { id: 'home_4', context: 'home', text: '👀 A ver qué descubrimos hoy...', priority: P.context, animation: 'thinking' },
  { id: 'home_5', context: 'home', text: '🎌 ¿Listo para una sesión de maratón?', priority: P.context, animation: 'hype' },

  // ── Wiki ──────────────────────────────────────────────
  { id: 'wiki_1', context: 'wiki', text: '📚 ¿Buscando información sobre algún anime?', priority: P.context, animation: 'thinking' },
  { id: 'wiki_2', context: 'wiki', text: '👀 ¡Veo que estás investigando a fondo!', priority: P.context, animation: 'idle' },
  { id: 'wiki_3', context: 'wiki', text: '🔎 Aquí tienes todo lo que hay de esa serie.', priority: P.context, animation: 'happy' },
  { id: 'wiki_4', context: 'wiki', text: '📖 Los detalles más finos están aquí. Siempre.', priority: P.context, animation: 'thinking' },

  // ── Search ────────────────────────────────────────────
  { id: 'search_1', context: 'search', text: '🔎 ¿Qué estás buscando, otaku?', priority: P.context, animation: 'thinking' },
  { id: 'search_2', context: 'search', text: '👀 Buena elección... voy a ver qué encontramos.', priority: P.context, animation: 'happy' },
  { id: 'search_3', context: 'search', text: '🕵️ Si no aparece, igual no existe. Pero casi.', priority: P.context, animation: 'idle' },

  // ── Community ─────────────────────────────────────────
  { id: 'community_1', context: 'community', text: '💬 ¡Aquí siempre hay algún debate interesante!', priority: P.context, animation: 'hype' },
  { id: 'community_2', context: 'community', text: '🥊 Apúntate a un debate. Promete que no te pasarás de intenso.', priority: P.context, animation: 'happy' },
  { id: 'community_3', context: 'community', text: '🧵 Hoy alguien va a defender una postura insostenible. Ya verás.', priority: P.context, animation: 'idle' },

  // ── Chats ─────────────────────────────────────────────
  { id: 'chats_1', context: 'chats', text: '💬 Escribe algo, que el silencio incomoda.', priority: P.context, animation: 'happy' },
  { id: 'chats_2', context: 'chats', text: '👥 ¿AVer a quién le picaron el botón de hoy?', priority: P.context, animation: 'hype' },
  { id: 'chats_3', context: 'chats', text: '😼 Los chats vuelan. Como yo.', priority: P.context, animation: 'idle' },

  // ── Profile ───────────────────────────────────────────
  { id: 'profile_1', context: 'profile', text: '🪞 ¿Te ves bien en la galería de medallas?', priority: P.context, animation: 'thinking' },
  { id: 'profile_2', context: 'profile', text: '📈 Los primeros pasos en Geekapoo dan mucho XP.', priority: P.context, animation: 'happy' },
  { id: 'profile_3', context: 'profile', text: '🎖️ ¿Ves? Lo que hiciste aquí está a la vista.', priority: P.context, animation: 'idle' },

  // ── Achievements ──────────────────────────────────────
  { id: 'achievements_1', context: 'achievements', text: '🏆 ¿Sabías que muchas medallas se consiguen jugando a la trivia?', priority: P.context, animation: 'hype' },
  { id: 'achievements_2', context: 'achievements', text: '🎖️ Un nivel más y hay premio. Así funciona esto.', priority: P.context, animation: 'happy' },
  { id: 'achievements_3', context: 'achievements', text: '📖 Tu vitrina dice mucho de ti. Lo bueno, espero.', priority: P.context, animation: 'thinking' },

  // ── Trivia ────────────────────────────────────────────
  { id: 'trivia_1', context: 'trivia', text: '🧠 ¿Te atreves con las tres de hoy?', priority: P.context, animation: 'thinking' },
  { id: 'trivia_2', context: 'trivia', text: '🎯 Tres preguntas. Una vida. Fácil.', priority: P.context, animation: 'hype' },
  { id: 'trivia_3', context: 'trivia', text: '🤔 Cuidado con la segunda. Siempre cae alguien.', priority: P.context, animation: 'thinking' },

  // ── Support ───────────────────────────────────────────
  { id: 'support_1', context: 'support', text: '🛠️ ¿Algo roto? Cuéntamelo por aquí.', priority: P.context, animation: 'idle' },
  { id: 'support_2', context: 'support', text: '📮 Los tickets se leen de verdad. Todos.', priority: P.context, animation: 'happy' },
  { id: 'support_3', context: 'support', text: '🧰 Describe lo que pasa y lo miramos.', priority: P.context, animation: 'idle' },

  // ── Events: FIRST THREAD (once) ────────────────────────
  { id: 'first_thread_1', context: 'first_thread', text: '🎉 ¡Tu primer hilo en Geekapoo!', priority: P.first_thread, animation: 'hype' },
  { id: 'first_thread_2', context: 'first_thread', text: '🌱 ¡Ya formas parte oficialmente de la comunidad!', priority: P.first_thread, animation: 'happy' },
  { id: 'first_thread_3', context: 'first_thread', text: "📣 ¡Primer hilo y ya tienes un lugar en la mesa de debates!", priority: P.first_thread, animation: 'hype' },

  // ── Events: FIRST COMMENT (once) ──────────────────────
  { id: 'first_comment_1', context: 'first_comment', text: '💬 ¡Primer comentario!', priority: P.first_comment, animation: 'hype' },
  { id: 'first_comment_2', context: 'first_comment', text: '🎤 ¡Ya estás participando en la conversación!', priority: P.first_comment, animation: 'happy' },
  { id: 'first_comment_3', context: 'first_comment', text: '✨ Una opinión y ya formas parte. Se nota que te animas.', priority: P.first_comment, animation: 'idle' },

  // ── Events: LEVEL UP ──────────────────────────────────
  { id: 'level_up_1', context: 'level_up', text: '🎊 ¡LEVEL UP!', priority: P.level_up, animation: 'hype' },
  { id: 'level_up_2', context: 'level_up', text: '🚀 ¡Otro nivel más! Sigue así, máquina.', priority: P.level_up, animation: 'hype' },
  { id: 'level_up_3', context: 'level_up', text: '⭐ ¡LEVEL UP! Cada nivel cuesta más. Bienvenido al club.', priority: P.level_up, animation: 'hype' },

  // ── Events: MEDAL ─────────────────────────────────────
  { id: 'achievement_1', context: 'achievement', text: '🏆 ¡Nueva medalla!', priority: P.achievement, animation: 'hype' },
  { id: 'achievement_2', context: 'achievement', text: '🎖️ ¡Se ha desbloqueado una insignia más!', priority: P.achievement, animation: 'happy' },
  { id: 'achievement_3', context: 'achievement', text: '👑 Sinceramente, ya no es broma. Sigue así.', priority: P.achievement, animation: 'hype' },

  // ── Events: TRIVIA FINISHED ───────────────────────────
  { id: 'trivia_done_1', context: 'trivia_done', text: '🧠 ¡Nada mal! Se te dan mejor de lo que crees.', priority: P.trivia_done, animation: 'hype' },
  { id: 'trivia_done_2', context: 'trivia_done', text: '📚 ¡Otra más mañana! La racha no se rompe sola.', priority: P.trivia_done, animation: 'happy' },
  { id: 'trivia_done_3', context: 'trivia_done', text: '✨ Perfecto: te lo has ganado. Ahora a por la racha.', priority: P.trivia_done, animation: 'hype' },

  // ── Welcome back (once per session) ───────────────────
  { id: 'welcome_1', context: 'welcome_back', text: '👋 ¡Bienvenido de nuevo!', priority: P.welcome_back, animation: 'happy' },
  { id: 'welcome_2', context: 'welcome_back', text: '✨ Qué bueno verte por aquí otra vez.', priority: P.welcome_back, animation: 'happy' },
  { id: 'welcome_3', context: 'welcome_back', text: '🍜 ¿Volvemos a la faena?', priority: P.welcome_back, animation: 'idle' },

  // ── Poke (on demand) ──────────────────────────────────
  { id: 'poke_1', context: 'poke', text: '😎 ¡Eh! ¿Necesitas ayuda?', priority: P.poke, animation: 'happy' },
  { id: 'poke_2', context: 'poke', text: '🐱 ¡Miau! Dime y te oriento.', priority: P.poke, animation: 'idle' },
  { id: 'poke_3', context: 'poke', text: '☕ ¿Té, café o una recomendación de anime?', priority: P.poke, animation: 'thinking' },
  { id: 'poke_4', context: 'poke', text: '🎮 Te enseño la trivia, la wiki o donde estés. Tú dirás.', priority: P.poke, animation: 'hype' },
];

/** Los textos de un contexto concreto. */
export function mensajesDe(contexto: KapoContext): KapoMessage[] {
  return KAPO_MENSAJES.filter((m) => m.context === contexto);
}

/**
 * Traduce la sección en la que está el usuario al contexto de
 * Kapo.
 *
 * Es la pieza que evita que el componente tenga un `switch` con
 * todas las secciones: si mañana se añade una pestaña nueva, se
 * añade una línea aquí y no hay que tocar nada más.
 *
 * `?tab=buscar` ya no existe (el buscador está dentro de la
 * wiki), así que cae en `home` como cualquier sección
 * desconocida.
 */
export function contextoDesdeSeccion(seccion?: string | null): KapoContext {
  switch (seccion) {
    case 'inicio':
      return 'home';
    case 'wiki':
      return 'wiki';
    case 'chats':
      return 'chats';
    case 'logros':
      return 'achievements';
    case 'trivia':
      return 'trivia';
    case 'soporte':
      return 'support';
    case 'extras':
      return 'achievements';
    case 'perfil':
      return 'profile';
    case 'admin':
      return 'achievements';
    default:
      return 'home';
  }
}

/** Un mensaje neutro para cuando no hay nada mejor que decir. */
export const KAPO_FALLBACK: KapoMessage = {
  id: 'fallback',
  context: 'home',
  text: '😺',
  priority: 0,
  animation: 'idle',
};
