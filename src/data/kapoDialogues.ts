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
// pokes (los ve `useKapo`), así que un administrador que escriba
// frases en el panel las sigue viendo.
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
  // ── Por sección ───────────────────────────────────────
  | 'home'
  | 'wiki'
  | 'search'
  | 'community'
  | 'profile'
  | 'chats'
  | 'achievements'
  | 'trivia'
  | 'support'
  | 'extras'
  | 'admin'
  | 'settings'
  // ── Eventos ───────────────────────────────────────────
  | 'level_up'
  | 'achievement'
  | 'trivia_done'
  | 'first_thread'
  | 'first_comment'
  | 'first_message'
  | 'club'
  | 'reaction'
  | 'login'
  | 'register'
  // ── Ayuda y compañía ──────────────────────────────────
  | 'error'
  | 'idle'
  | 'spontaneous'
  | 'discovery'
  // ── Normal ────────────────────────────────────────────
  | 'welcome_back'
  | 'poke';

export type KapoAnimation = 'idle' | 'happy' | 'hype' | 'thinking';

export interface KapoMessage {
  /** Id único, y además sirve para "no repetir este". */
  id: string;
  context: KapoContext;
  text: string;
  /** Mayor gana. Ver la tabla de abajo. */
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
 * 70 primer hilo / primer comentario: también de una vez.
 * 66 primer mensaje de chat, 64 club, 62 reacción: hitos sociales.
 * 60 registro, 55 inicio de sesión, 50 bienvenida.
 * 45 error: ayuda, pero sin pisar una celebración.
 * 10 contexto, 9 descubrimiento, 8 espontáneo, 0 poke.
 */
export const PRIORIDAD = {
  level_up: 100,
  achievement: 95,
  trivia_done: 90,
  first_thread: 70,
  first_comment: 70,
  first_message: 66,
  club: 64,
  reaction: 62,
  register: 60,
  login: 55,
  welcome_back: 50,
  error: 45,
  context: 10,
  discovery: 9,
  spontaneous: 8,
  poke: 0,
} as const satisfies Record<string, number>;

const P = PRIORIDAD;

/**
 * El banco.
 *
 * Varias frases por contexto, no una, para que la mascota no diga
 * siempre lo mismo. `elegirMensaje` además evita repetir la última
 * que salió y las últimas que se han visto, así que ir y venir
 * entre dos secciones no se queda enganchado en las dos únicas
 * frases que tienen.
 */
export const KAPO_MENSAJES: KapoMessage[] = [
  // ── Inicio ────────────────────────────────────────────
  { id: 'home_1', context: 'home', text: '👋 ¡Bienvenido a Geekapoo!', priority: P.context, animation: 'happy' },
  { id: 'home_2', context: 'home', text: '🍜 ¿Qué anime tenemos pendiente hoy?', priority: P.context, animation: 'idle' },
  { id: 'home_3', context: 'home', text: '✨ ¡Qué bueno verte por aquí!', priority: P.context, animation: 'happy' },
  { id: 'home_4', context: 'home', text: '👀 A ver qué descubrimos hoy...', priority: P.context, animation: 'thinking' },
  { id: 'home_5', context: 'home', text: '🎌 ¿Listo para una sesión de maratón?', priority: P.context, animation: 'hype' },
  { id: 'home_6', context: 'home', text: 'La comunidad está tranquila... demasiado. ¿Rompes el hielo?', priority: P.context, animation: 'thinking' },
  { id: 'home_7', context: 'home', text: '📰 Si algo del feed te gusta, dale una reacción. Se nota, y mucho.', priority: P.context, animation: 'happy' },
  { id: 'home_8', context: 'home', text: '¿Sabías que los títulos raros reciben más clics? Fuente: yo.', priority: P.context, animation: 'hype' },

  // ── Wiki ──────────────────────────────────────────────
  { id: 'wiki_1', context: 'wiki', text: '📚 ¿Buscando información sobre algún anime?', priority: P.context, animation: 'thinking' },
  { id: 'wiki_2', context: 'wiki', text: '👀 ¡Veo que estás investigando a fondo!', priority: P.context, animation: 'idle' },
  { id: 'wiki_3', context: 'wiki', text: '🔎 Aquí tienes todo lo que hay de esa serie.', priority: P.context, animation: 'happy' },
  { id: 'wiki_4', context: 'wiki', text: '📖 Los detalles más finos están aquí. Siempre.', priority: P.context, animation: 'thinking' },
  { id: 'wiki_5', context: 'wiki', text: 'Si una ficha se queda corta, dímelo y miramos otra cosa.', priority: P.context, animation: 'happy' },
  { id: 'wiki_6', context: 'wiki', text: 'Los personajes secundarios también tienen lo suyo. No los ignores.', priority: P.context, animation: 'idle' },

  // ── Buscador ──────────────────────────────────────────
  { id: 'search_1', context: 'search', text: '🔎 ¿Qué estás buscando, otaku?', priority: P.context, animation: 'thinking' },
  { id: 'search_2', context: 'search', text: '👀 Buena elección... voy a ver qué encontramos.', priority: P.context, animation: 'happy' },
  { id: 'search_3', context: 'search', text: '🕵️ Si no aparece, igual no existe. Pero casi.', priority: P.context, animation: 'idle' },
  { id: 'search_4', context: 'search', text: 'Prueba con el nombre en inglés, en japonés o solo con una parte.', priority: P.context, animation: 'thinking' },
  { id: 'search_5', context: 'search', text: 'A veces el título que recuerdas no es el título real. Me pasa con las citas.', priority: P.context, animation: 'happy' },
  { id: 'search_6', context: 'search', text: 'Si no hay resultados, quita filtros antes de rendirte.', priority: P.context, animation: 'idle' },

  // ── Comunidad ─────────────────────────────────────────
  { id: 'community_1', context: 'community', text: '💬 ¡Aquí siempre hay algún debate interesante!', priority: P.context, animation: 'hype' },
  { id: 'community_2', context: 'community', text: '🥊 Apúntate a un debate. Promete que no te pasarás de intenso.', priority: P.context, animation: 'happy' },
  { id: 'community_3', context: 'community', text: '🧵 Hoy alguien va a defender una postura insostenible. Ya verás.', priority: P.context, animation: 'idle' },
  { id: 'community_4', context: 'community', text: 'Un buen hilo empieza con una pregunta, no con una pared de texto.', priority: P.context, animation: 'thinking' },
  { id: 'community_5', context: 'community', text: 'Responder a alguien es la forma más rápida de que te respondan.', priority: P.context, animation: 'happy' },

  // ── Perfil ────────────────────────────────────────────
  { id: 'profile_1', context: 'profile', text: '🪞 ¿Te ves bien en la galería de medallas?', priority: P.context, animation: 'thinking' },
  { id: 'profile_2', context: 'profile', text: '📈 Los primeros pasos en Geekapoo dan mucho XP.', priority: P.context, animation: 'happy' },
  { id: 'profile_3', context: 'profile', text: '🎖️ ¿Ves? Lo que hiciste aquí está a la vista.', priority: P.context, animation: 'idle' },
  { id: 'profile_4', context: 'profile', text: 'Tu perfil cuenta una historia. ¿La quieres contar mejor?', priority: P.context, animation: 'thinking' },
  { id: 'profile_5', context: 'profile', text: 'Cambiar el título equipado no da XP, pero da estilo.', priority: P.context, animation: 'happy' },

  // ── Chats ─────────────────────────────────────────────
  { id: 'chats_1', context: 'chats', text: '💬 Escribe algo, que el silencio incomoda.', priority: P.context, animation: 'happy' },
  { id: 'chats_2', context: 'chats', text: '👥 ¿A ver a quién le picaron el botón de hoy?', priority: P.context, animation: 'hype' },
  { id: 'chats_3', context: 'chats', text: '😼 Los chats vuelan. Como yo.', priority: P.context, animation: 'idle' },
  { id: 'chats_4', context: 'chats', text: 'Los clubes son chats con más gente y menos vergüenza.', priority: P.context, animation: 'thinking' },
  { id: 'chats_5', context: 'chats', text: 'Antes de escribir, respira. Y luego escribe igual.', priority: P.context, animation: 'happy' },

  // ── Logros ────────────────────────────────────────────
  { id: 'achievements_1', context: 'achievements', text: '🏆 ¿Sabías que muchas medallas se consiguen jugando a la trivia?', priority: P.context, animation: 'hype' },
  { id: 'achievements_2', context: 'achievements', text: '🎖️ Un nivel más y hay premio. Así funciona esto.', priority: P.context, animation: 'happy' },
  { id: 'achievements_3', context: 'achievements', text: '📖 Tu vitrina dice mucho de ti. Lo bueno, espero.', priority: P.context, animation: 'thinking' },
  { id: 'achievements_4', context: 'achievements', text: 'Las medallas raras no se regalan. Se sufren.', priority: P.context, animation: 'hype' },
  { id: 'achievements_5', context: 'achievements', text: 'No todas las medallas están activas todavía. Algunas son leyenda.', priority: P.context, animation: 'idle' },

  // ── Trivia ────────────────────────────────────────────
  { id: 'trivia_1', context: 'trivia', text: '🧠 ¿Te atreves con las tres de hoy?', priority: P.context, animation: 'thinking' },
  { id: 'trivia_2', context: 'trivia', text: '🎯 Tres preguntas. Una vida. Fácil.', priority: P.context, animation: 'hype' },
  { id: 'trivia_3', context: 'trivia', text: '🤔 Cuidado con la segunda. Siempre cae alguien.', priority: P.context, animation: 'thinking' },
  { id: 'trivia_4', context: 'trivia', text: 'Si fallas, no pasa nada. Si aciertas, presumes.', priority: P.context, animation: 'happy' },
  { id: 'trivia_5', context: 'trivia', text: 'La racha se rompe sola. No la dejes.', priority: P.context, animation: 'hype' },

  // ── Soporte ───────────────────────────────────────────
  { id: 'support_1', context: 'support', text: '🛠️ ¿Algo roto? Cuéntamelo por aquí.', priority: P.context, animation: 'idle' },
  { id: 'support_2', context: 'support', text: '📮 Los tickets se leen de verdad. Todos.', priority: P.context, animation: 'happy' },
  { id: 'support_3', context: 'support', text: '🧰 Describe lo que pasa y lo miramos.', priority: P.context, animation: 'idle' },
  { id: 'support_4', context: 'support', text: 'Si puedes, di qué estabas haciendo cuando falló. Ahorra medio camino.', priority: P.context, animation: 'thinking' },
  { id: 'support_5', context: 'support', text: 'No hace falta que sepas arreglarlo. Solo que sepas contarlo.', priority: P.context, animation: 'happy' },

  // ── Extras ────────────────────────────────────────────
  { id: 'extras_1', context: 'extras', text: '🧪 Aquí están las herramientas raras. Las buenas.', priority: P.context, animation: 'hype' },
  { id: 'extras_2', context: 'extras', text: '🎲 ¿Ya has probado los extras? Hay más de los que parecen.', priority: P.context, animation: 'thinking' },
  { id: 'extras_3', context: 'extras', text: '🧰 Trivia, noticias, encuestas y algún juguete más.', priority: P.context, animation: 'happy' },
  { id: 'extras_4', context: 'extras', text: 'Estos extras no se gastan. Úsalos sin miedo.', priority: P.context, animation: 'idle' },
  { id: 'extras_5', context: 'extras', text: 'Si algo de aquí te resulta útil, cuéntaselo a alguien.', priority: P.context, animation: 'happy' },

  // ── Administración ────────────────────────────────────
  { id: 'admin_1', context: 'admin', text: '🛠️ Modo equipo: aquí se ve lo que no se ve en público.', priority: P.context, animation: 'thinking' },
  { id: 'admin_2', context: 'admin', text: '📋 Sin prisas. Un cambio bien hecho ahorra diez avisos.', priority: P.context, animation: 'idle' },
  { id: 'admin_3', context: 'admin', text: '🧹 La cola de reportes no se limpia sola. Bueno, sí, pero hay que darle.', priority: P.context, animation: 'happy' },
  { id: 'admin_4', context: 'admin', text: 'No hace falta que lo arregles todo hoy. Solo lo importante.', priority: P.context, animation: 'idle' },
  { id: 'admin_5', context: 'admin', text: 'Los datos de la gente se tratan con cuidado. Ya lo sabes.', priority: P.context, animation: 'thinking' },

  // ── Ajustes ───────────────────────────────────────────
  { id: 'settings_1', context: 'settings', text: '⚙️ Aquí se ajustan las cosas finas de la cuenta.', priority: P.context, animation: 'thinking' },
  { id: 'settings_2', context: 'settings', text: '🔒 Tu privacidad manda. Cambia lo que necesites.', priority: P.context, animation: 'idle' },
  { id: 'settings_3', context: 'settings', text: '🧩 Si algo no encaja, revisa primero los ajustes.', priority: P.context, animation: 'happy' },
  { id: 'settings_4', context: 'settings', text: 'No todo el mundo sabe que esto existe. Tú sí.', priority: P.context, animation: 'hype' },

  // ── Eventos: primer hilo (una vez) ────────────────────
  { id: 'first_thread_1', context: 'first_thread', text: '🎉 ¡Tu primer hilo en Geekapoo!', priority: P.first_thread, animation: 'hype' },
  { id: 'first_thread_2', context: 'first_thread', text: '🌱 ¡Ya formas parte oficialmente de la comunidad!', priority: P.first_thread, animation: 'happy' },
  { id: 'first_thread_3', context: 'first_thread', text: '📣 ¡Primer hilo y ya tienes un lugar en la mesa de debates!', priority: P.first_thread, animation: 'hype' },
  { id: 'first_thread_4', context: 'first_thread', text: '🧵 Primer hilo publicado. Ahora toca mirar el correo cada cinco minutos.', priority: P.first_thread, animation: 'happy' },

  // ── Eventos: primer comentario (una vez) ──────────────
  { id: 'first_comment_1', context: 'first_comment', text: '💬 ¡Primer comentario!', priority: P.first_comment, animation: 'hype' },
  { id: 'first_comment_2', context: 'first_comment', text: '🎤 ¡Ya estás participando en la conversación!', priority: P.first_comment, animation: 'happy' },
  { id: 'first_comment_3', context: 'first_comment', text: '✨ Una opinión y ya formas parte. Se nota que te animas.', priority: P.first_comment, animation: 'idle' },
  { id: 'first_comment_4', context: 'first_comment', text: 'Tu primera respuesta ya está. La segunda sale sola.', priority: P.first_comment, animation: 'happy' },

  // ── Eventos: primer mensaje de chat ───────────────────
  { id: 'first_message_1', context: 'first_message', text: '💬 ¡Mensaje enviado! El chat ya está vivo.', priority: P.first_message, animation: 'hype' },
  { id: 'first_message_2', context: 'first_message', text: '📨 Mensaje fuera. Ahora espera la respuesta con dignidad.', priority: P.first_message, animation: 'happy' },
  { id: 'first_message_3', context: 'first_message', text: '🗨️ ¡Has roto el hielo! Eso ya es más que muchos.', priority: P.first_message, animation: 'hype' },

  // ── Eventos: club ─────────────────────────────────────
  { id: 'club_1', context: 'club', text: '🏰 ¡Ya estás dentro de un club! Ahora a ver de qué se habla.', priority: P.club, animation: 'hype' },
  { id: 'club_2', context: 'club', text: '👥 Un club nuevo, gente nueva y un canal general esperando.', priority: P.club, animation: 'happy' },
  { id: 'club_3', context: 'club', text: '🎪 Has entrado en un club. Presume de ello.', priority: P.club, animation: 'hype' },
  { id: 'club_4', context: 'club', text: '🔔 Los clubes enganchan. Mira los canales antes de escribir.', priority: P.club, animation: 'thinking' },

  // ── Eventos: reacciones y respuestas ──────────────────
  { id: 'reaction_1', context: 'reaction', text: '❤️ Alguien ha reaccionado a lo que escribiste. Se siente bien, ¿eh?', priority: P.reaction, animation: 'happy' },
  { id: 'reaction_2', context: 'reaction', text: '🔥 Tienes reacciones nuevas. No dejes que se te suba a la cabeza.', priority: P.reaction, animation: 'hype' },
  { id: 'reaction_3', context: 'reaction', text: '👀 A la gente le está gustando lo que publicas.', priority: P.reaction, animation: 'happy' },
  { id: 'reaction_4', context: 'reaction', text: '💬 Te han respondido por ahí. Igual toca contestar.', priority: P.reaction, animation: 'thinking' },
  { id: 'reaction_5', context: 'reaction', text: '🌱 Alguien te ha seguido. La comunidad crece.', priority: P.reaction, animation: 'happy' },

  // ── Eventos: sesión ───────────────────────────────────
  { id: 'login_1', context: 'login', text: '👋 ¡Bienvenido de nuevo!', priority: P.login, animation: 'happy' },
  { id: 'login_2', context: 'login', text: '✨ Qué bueno verte por aquí otra vez.', priority: P.login, animation: 'happy' },
  { id: 'login_3', context: 'login', text: '🍜 ¿Volvemos a la faena?', priority: P.login, animation: 'idle' },
  { id: 'login_4', context: 'login', text: '😺 Ya estabas tardando. Yo no me movía de aquí.', priority: P.login, animation: 'hype' },

  { id: 'register_1', context: 'register', text: '🎉 ¡Cuenta nueva! Bienvenido a Geekapoo, otaku.', priority: P.register, animation: 'hype' },
  { id: 'register_2', context: 'register', text: '🌱 Ya eres oficialmente parte de esto. ¿Por dónde empezamos?', priority: P.register, animation: 'happy' },
  { id: 'register_3', context: 'register', text: '📚 Primer día: wiki, un hilo y una trivia. Ese es el camino.', priority: P.register, animation: 'thinking' },
  { id: 'register_4', context: 'register', text: '🐾 Me llamo Kapo-chan. Voy a estar por aquí para lo que necesites.', priority: P.register, animation: 'happy' },

  // ── Eventos: nivel ────────────────────────────────────
  { id: 'level_up_1', context: 'level_up', text: '🎊 ¡LEVEL UP!', priority: P.level_up, animation: 'hype' },
  { id: 'level_up_2', context: 'level_up', text: '🚀 ¡Otro nivel más! Sigue así, máquina.', priority: P.level_up, animation: 'hype' },
  { id: 'level_up_3', context: 'level_up', text: '⭐ ¡LEVEL UP! Cada nivel cuesta más. Bienvenido al club.', priority: P.level_up, animation: 'hype' },
  { id: 'level_up_4', context: 'level_up', text: '📈 El número sube. La actitud también.', priority: P.level_up, animation: 'hype' },

  // ── Eventos: medalla ──────────────────────────────────
  { id: 'achievement_1', context: 'achievement', text: '🏆 ¡Nueva medalla!', priority: P.achievement, animation: 'hype' },
  { id: 'achievement_2', context: 'achievement', text: '🎖️ ¡Se ha desbloqueado una insignia más!', priority: P.achievement, animation: 'happy' },
  { id: 'achievement_3', context: 'achievement', text: '👑 Sinceramente, ya no es broma. Sigue así.', priority: P.achievement, animation: 'hype' },
  { id: 'achievement_4', context: 'achievement', text: '✨ Vitrina más llena. Eso no se consigue mirando.', priority: P.achievement, animation: 'happy' },

  // ── Eventos: trivia terminada ─────────────────────────
  { id: 'trivia_done_1', context: 'trivia_done', text: '🧠 ¡Nada mal! Se te dan mejor de lo que crees.', priority: P.trivia_done, animation: 'hype' },
  { id: 'trivia_done_2', context: 'trivia_done', text: '📚 ¡Otra más mañana! La racha no se rompe sola.', priority: P.trivia_done, animation: 'happy' },
  { id: 'trivia_done_3', context: 'trivia_done', text: '✨ Perfecto: te lo has ganado. Ahora a por la racha.', priority: P.trivia_done, animation: 'hype' },
  { id: 'trivia_done_4', context: 'trivia_done', text: '🎯 Trivia finiquitada. Mañana te espero aquí.', priority: P.trivia_done, animation: 'happy' },

  // ── Bienvenida (una vez por carga) ────────────────────
  { id: 'welcome_1', context: 'welcome_back', text: '👋 ¡Bienvenido de nuevo!', priority: P.welcome_back, animation: 'happy' },
  { id: 'welcome_2', context: 'welcome_back', text: '✨ Qué bueno verte por aquí otra vez.', priority: P.welcome_back, animation: 'happy' },
  { id: 'welcome_3', context: 'welcome_back', text: '🍜 ¿Volvemos a la faena?', priority: P.welcome_back, animation: 'idle' },

  // ── Errores ───────────────────────────────────────────
  { id: 'error_1', context: 'error', text: '🛠️ Algo no ha salido como esperaba. Si sigue pasando, abre Soporte.', priority: P.error, animation: 'thinking' },
  { id: 'error_2', context: 'error', text: '😿 Vaya. No te preocupes: prueba otra vez y, si no, lo miramos.', priority: P.error, animation: 'thinking' },
  { id: 'error_3', context: 'error', text: '📮 Ese error no me gusta nada. Cuéntalo en Soporte con lo que hacías.', priority: P.error, animation: 'thinking' },
  { id: 'error_4', context: 'error', text: '🔧 Se ha torcido algo. No es culpa tuya. Casi nunca.', priority: P.error, animation: 'thinking' },

  // ── Inactividad ───────────────────────────────────────
  { id: 'idle_1', context: 'idle', text: '👀 Llevas un rato en silencio. ¿Sigo aquí o te dejo pensar?', priority: P.spontaneous, animation: 'idle' },
  { id: 'idle_2', context: 'idle', text: '🫧 La página sigue aquí. Yo también.', priority: P.spontaneous, animation: 'idle' },
  { id: 'idle_3', context: 'idle', text: '🍵 Pausa aceptada. Cuando quieras, seguimos.', priority: P.spontaneous, animation: 'happy' },
  { id: 'idle_4', context: 'idle', text: '😺 ¿Te has quedado leyendo o te has perdido? Las dos valen.', priority: P.spontaneous, animation: 'thinking' },

  // ── Preguntas espontáneas ─────────────────────────────
  { id: 'spontaneous_1', context: 'spontaneous', text: '🎬 ¿Qué anime estás viendo estos días?', priority: P.spontaneous, animation: 'thinking' },
  { id: 'spontaneous_2', context: 'spontaneous', text: '🫶 ¿Cuál es tu personaje favorito? Y no vale decir el protagonista.', priority: P.spontaneous, animation: 'happy' },
  { id: 'spontaneous_3', context: 'spontaneous', text: '🔥 Debate rápido: ¿el relleno es arte o castigo?', priority: P.spontaneous, animation: 'hype' },
  { id: 'spontaneous_4', context: 'spontaneous', text: '🎮 Si Geekapoo fuera un videojuego, ¿qué clase elegirías?', priority: P.spontaneous, animation: 'thinking' },
  { id: 'spontaneous_5', context: 'spontaneous', text: '📼 ¿Qué obra te gustaría poder ver por primera vez otra vez?', priority: P.spontaneous, animation: 'idle' },
  { id: 'spontaneous_6', context: 'spontaneous', text: '🎧 ¿Con qué opening te pondrías a limpiar la casa? Sin juicios.', priority: P.spontaneous, animation: 'hype' },
  { id: 'spontaneous_7', context: 'spontaneous', text: '🍥 ¿Sub o doblaje? Responde con valentía.', priority: P.spontaneous, animation: 'thinking' },
  { id: 'spontaneous_8', context: 'spontaneous', text: '🧠 ¿Qué teoría friki defiendes aunque no haya pruebas?', priority: P.spontaneous, animation: 'thinking' },

  // ── Descubrir secciones ───────────────────────────────
  { id: 'discovery_1', context: 'discovery', text: '🗺️ Hay una parte de Geekapoo que todavía no has tocado. ¿La vemos?', priority: P.discovery, animation: 'thinking' },
  { id: 'discovery_2', context: 'discovery', text: '🧭 ¿Sabías que hay más secciones aparte de esta? Te hago un tour.', priority: P.discovery, animation: 'happy' },
  { id: 'discovery_3', context: 'discovery', text: '🔍 Me sé un rincón de la web que te puede gustar. ¿Te llevo?', priority: P.discovery, animation: 'hype' },
  { id: 'discovery_4', context: 'discovery', text: '🚪 Una puerta que no has abierto todavía. Solo digo eso.', priority: P.discovery, animation: 'thinking' },

  // ── Poke (a petición) ─────────────────────────────────
  { id: 'poke_1', context: 'poke', text: '😎 ¡Eh! ¿Necesitas ayuda?', priority: P.poke, animation: 'happy' },
  { id: 'poke_2', context: 'poke', text: '🐱 ¡Miau! Dime y te oriento.', priority: P.poke, animation: 'idle' },
  { id: 'poke_3', context: 'poke', text: '☕ ¿Té, café o una recomendación de anime?', priority: P.poke, animation: 'thinking' },
  { id: 'poke_4', context: 'poke', text: '🎮 Te enseño la trivia, la wiki o donde estés. Tú dirás.', priority: P.poke, animation: 'hype' },
  { id: 'poke_5', context: 'poke', text: '📎 ¿Sabes que puedes arrastrarme? No me rompo.', priority: P.poke, animation: 'happy' },
  { id: 'poke_6', context: 'poke', text: '🌸 Estoy aquí. Pregunta sin miedo.', priority: P.poke, animation: 'idle' },
  { id: 'poke_7', context: 'poke', text: '🎲 ¿Charlamos un rato o te dejo explorar?', priority: P.poke, animation: 'happy' },
  { id: 'poke_8', context: 'poke', text: '🫥 A veces me quedo callada. No es que no te quiera.', priority: P.poke, animation: 'idle' },
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
 * `?tab=buscar` ya no existe como pestaña (el buscador está dentro
 * de la wiki), pero se sigue traduciendo por si algún enlace
 * antiguo o una llamada directa llega con ese nombre.
 */
export function contextoDesdeSeccion(seccion?: string | null): KapoContext {
  switch (seccion) {
    case 'inicio':
      return 'home';
    case 'wiki':
      return 'wiki';
    case 'buscar':
      return 'search';
    case 'chats':
      return 'chats';
    case 'logros':
      return 'achievements';
    case 'trivia':
      return 'trivia';
    case 'soporte':
      return 'support';
    case 'extras':
      return 'extras';
    case 'perfil':
      return 'profile';
    case 'ajustes':
      return 'settings';
    case 'admin':
      return 'admin';
    case 'comunidad':
      return 'community';
    default:
      return 'home';
  }
}

/**
 * AYUDA CONCRETA POR SECCIÓN
 *
 * No son frases de relleno: cada una dice dónde está algo o cómo se
 * hace. Se usan en las opciones de las conversaciones ("Ayuda por
 * aquí") y en los mensajes de error.
 */
const KAPO_AYUDA: Partial<Record<KapoContext, string>> = {
  home:
    'El feed es la portada: arriba tienes los hilos recientes y a la derecha las categorías. Si algo te interesa, entra y responde; es la forma más rápida de que te conozcan.',
  wiki:
    'En la wiki puedes buscar por serie, personaje o episodio. Si el nombre no te sale, prueba con una parte o con el título en inglés.',
  search:
    'La búsqueda mira series, episodios, personajes e hilos. Si no sale nada, quita filtros o prueba con menos palabras.',
  community:
    'Para publicar un hilo, pulsa el botón de crear: título claro, categoría y un cuerpo que invite a responder.',
  profile:
    'En tu perfil están tus medallas, tu nivel y tu actividad. Puedes cambiar el título equipado desde Logros.',
  chats:
    'En Chats puedes hablar en directo, crear grupos y entrar en clubes. Las solicitudes se aceptan desde la propia sección.',
  achievements:
    'En Logros ves las medallas que tienes y las que te faltan. Cada una explica su requisito.',
  trivia:
    'La trivia diaria son tres preguntas. Cada acierto da XP y la racha premia la constancia.',
  support:
    'En Soporte puedes abrir un ticket. Cuenta qué pasaba, en qué sección y qué esperabas que ocurriera.',
  extras:
    'En Extras están las herramientas adicionales: trivia, noticias, encuestas y más. No necesitas hacer nada especial para usarlas.',
  admin:
    'El panel está para moderar y mantener la comunidad. Los cambios sensibles pasan por Cloud Functions; aquí solo se preparan.',
  settings:
    'En Ajustes puedes cambiar privacidad, apariencia y preferencias de la cuenta. Nada de esto se comparte con otros usuarios.',
  error:
    'Si el error sigue, abre Soporte y cuenta lo que estabas haciendo. Con eso se puede reproducir.',
  login:
    'Puedes empezar por la wiki, mirar el feed o jugar la trivia. No hace falta hacerlo todo el primer día.',
  register:
    'Puedes empezar por la wiki, mirar el feed o jugar la trivia. No hace falta hacerlo todo el primer día.',
};

export function ayudaDeSeccion(contexto: KapoContext): string {
  return (
    KAPO_AYUDA[contexto] ??
    'Explora la pestaña en la que estás; si algo no aparece, pregúntame o abre Soporte.'
  );
}

/** Un mensaje neutro para cuando no hay nada mejor que decir. */
export const KAPO_FALLBACK: KapoMessage = {
  id: 'fallback',
  context: 'home',
  text: '😺',
  priority: 0,
  animation: 'idle',
};
