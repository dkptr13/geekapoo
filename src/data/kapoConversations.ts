// ======================================================
// CONVERSACIONES DE KAPO-CHAN
// ======================================================
//
// Un mensaje normal es una frase; una conversación es una frase con
// respuestas. Viven aquí, en código, por el mismo motivo que el
// banco de diálogos: son un conjunto cerrado, no necesitan red y
// así se pueden probar sin navegador.
//
// Cada opción lleva escrita su propia respuesta. No hay IA ni
// servicios externos: Kapo contesta con reglas locales y, cuando
// una opción navega, usa la pestaña real de Geekapoo.
//
// `contextos` limita dónde tiene sentido la conversación. 'todas'
// vale para las que funcionan en cualquier sección.

import type { KapoAnimation, KapoContext } from './kapoDialogues';

export interface KapoOpcion {
  id: string;
  /** Texto del botón. Corto: el bocadillo no es un formulario. */
  texto: string;
  emoji: string;
  /** Lo que responde Kapo al elegirla. */
  respuesta: string;
  animacion?: KapoAnimation;
  /** Pestaña a la que lleva la respuesta, si toca. */
  tab?: string;
  /** Segunda ronda de opciones, para conversaciones con más chicha. */
  seguimiento?: KapoOpcion[];
}

export interface KapoConversacion {
  id: string;
  contextos: KapoContext[] | 'todas';
  apertura: string;
  animacion: KapoAnimation;
  opciones: KapoOpcion[];
}

/**
 * El banco de conversaciones.
 *
 * No todas las secciones necesitan una propia: las que no la tienen
 * usan las marcadas como 'todas' (descubrir la web, funciones poco
 * conocidas) y las que comparten contexto con otra.
 */
export const KAPO_CONVERSACIONES: KapoConversacion[] = [
  {
    id: 'que_ves',
    contextos: ['home', 'wiki', 'community', 'profile'],
    apertura: '🎬 Vale, curiosidad: ¿qué anime estás viendo ahora mismo?',
    animacion: 'thinking',
    opciones: [
      {
        id: 'temporada',
        texto: 'Uno de la temporada',
        emoji: '📺',
        respuesta:
          '¡Buena época! Yo no puedo seguir tres a la vez, pero lo intento. ¿Te está enganchando?',
        animacion: 'happy',
        seguimiento: [
          {
            id: 'enganchado',
            texto: 'Me tiene enganchado',
            emoji: '🔥',
            respuesta:
              'Entonces no te interrumpo más... aunque un comentario en la wiki siempre se agradece.',
            animacion: 'hype',
          },
          {
            id: 'cuesta',
            texto: 'Me está costando',
            emoji: '😅',
            respuesta:
              'Tranquilo, no todo tiene que enganchar. A veces se ve por el paisaje.',
            animacion: 'idle',
          },
        ],
      },
      {
        id: 'clasico',
        texto: 'Un clásico de fondo',
        emoji: '📼',
        respuesta: 'Los clásicos no se ven, se revisitán. ¿Cuál es?',
        animacion: 'happy',
        seguimiento: [
          {
            id: 'secreto',
            texto: 'Uno que no pienso confesar',
            emoji: '🤫',
            respuesta: 'Misterio. Me gusta. Lo respeto.',
            animacion: 'thinking',
          },
          {
            id: 'otro',
            texto: 'Recomiéndame otro',
            emoji: '🍿',
            respuesta:
              'Pásate por la wiki y mira las categorías. Seguro que hay uno que no has visto.',
            animacion: 'hype',
            tab: 'wiki',
          },
        ],
      },
      {
        id: 'necesito',
        texto: 'Nada, necesito recomendación',
        emoji: '🆘',
        respuesta:
          'Tenemos wiki para aburrirte de opciones. Empieza por una categoría y déjate llevar.',
        animacion: 'hype',
        tab: 'wiki',
      },
      {
        id: 'saludo',
        texto: 'Solo pasaba a saludar',
        emoji: '👋',
        respuesta: 'Saludo aceptado. Vuelve cuando quieras.',
        animacion: 'happy',
      },
    ],
  },

  {
    id: 'personaje',
    contextos: ['home', 'wiki', 'search', 'profile'],
    apertura:
      '🫶 Pregunta seria: ¿qué personaje te cae mejor que el propio protagonista?',
    animacion: 'thinking',
    opciones: [
      {
        id: 'secundario',
        texto: 'Un secundario con más carisma',
        emoji: '🌟',
        respuesta:
          'Los secundarios son los que se llevan los memes. ¿Tiene nombre o lo dejamos en misterio?',
        animacion: 'hype',
        seguimiento: [
          {
            id: 'nombre',
            texto: 'Tiene nombre, pero no lo digo',
            emoji: '🤐',
            respuesta: 'Perfecto. Así alimentamos el debate.',
            animacion: 'happy',
          },
          {
            id: 'pista',
            texto: 'Te doy una pista',
            emoji: '🔍',
            respuesta:
              'Me encantan las pistas. Con eso ya tenemos tema para un hilo.',
            animacion: 'thinking',
            tab: 'inicio',
          },
        ],
      },
      {
        id: 'villano',
        texto: 'El villano, sin dudarlo',
        emoji: '😈',
        respuesta: 'Los villanos tienen mejor guardarropa. Es un hecho científico.',
        animacion: 'hype',
      },
      {
        id: 'protagonista',
        texto: 'El protagonista, y no me da vergüenza',
        emoji: '🦸',
        respuesta: 'Valiente. A veces el que lleva el título se lo gana.',
        animacion: 'happy',
      },
      {
        id: 'ninguno',
        texto: 'No tengo favorito',
        emoji: '🤷',
        respuesta: 'Mentira piadosa. Todos tenemos uno, aunque sea por pena.',
        animacion: 'thinking',
      },
    ],
  },

  {
    id: 'debate_relleno',
    contextos: ['home', 'community', 'wiki'],
    apertura:
      '🔥 Debate de sobremesa: ¿el relleno es arte, castigo o una forma de cariño mal entendida?',
    animacion: 'hype',
    opciones: [
      {
        id: 'arte',
        texto: 'Arte incomprendido',
        emoji: '🎨',
        respuesta:
          'Opinión fuerte. Yo respeto al que dice esto con la cara seria.',
        animacion: 'thinking',
      },
      {
        id: 'castigo',
        texto: 'Castigo',
        emoji: '⛓️',
        respuesta: 'Directo. Sin anestesia. Me gusta.',
        animacion: 'hype',
      },
      {
        id: 'depende',
        texto: 'Depende del anime',
        emoji: '⚖️',
        respuesta:
          'La respuesta más sabia y la más difícil de discutir. Bien jugado.',
        animacion: 'happy',
      },
      {
        id: 'suerte',
        texto: 'No he visto relleno nunca',
        emoji: '🍀',
        respuesta: 'Qué suerte. O qué mentira. Una de dos.',
        animacion: 'thinking',
      },
    ],
  },

  {
    id: 'chat_consejo',
    contextos: ['chats'],
    apertura:
      '💬 ¿Ya has probado los clubes o solo vienes por los mensajes directos?',
    animacion: 'thinking',
    opciones: [
      {
        id: 'clubes',
        texto: 'Clubes, claro',
        emoji: '🏰',
        respuesta:
          'Buena elección. Mira los canales antes de escribir; hay temas con más vida que otros.',
        animacion: 'hype',
      },
      {
        id: 'directos',
        texto: 'Mensajes directos',
        emoji: '✉️',
        respuesta:
          'Los directos son más tranquilos. Y las solicitudes se aceptan desde aquí mismo.',
        animacion: 'idle',
      },
      {
        id: 'nadie',
        texto: 'Todavía no he hablado con nadie',
        emoji: '🫥',
        respuesta:
          'Pues hoy es un buen día. Un saludo corto y ya está; el resto sale solo.',
        animacion: 'happy',
      },
      {
        id: 'grupos',
        texto: 'Grupos',
        emoji: '👥',
        respuesta:
          'Los grupos son un club pequeño. Si se lían, siempre puedes silenciar.',
        animacion: 'thinking',
      },
    ],
  },

  {
    id: 'perfil_meta',
    contextos: ['profile', 'achievements', 'settings'],
    apertura:
      '🎯 ¿Cuál es tu siguiente objetivo en Geekapoo: nivel, medalla o simplemente pasarlo bien?',
    animacion: 'thinking',
    opciones: [
      {
        id: 'nivel',
        texto: 'Subir de nivel',
        emoji: '📈',
        respuesta:
          'Entonces comenta, reacciona y juega la trivia. El XP no se gana mirando.',
        animacion: 'hype',
      },
      {
        id: 'medalla',
        texto: 'Una medalla concreta',
        emoji: '🎖️',
        respuesta:
          'Mira su requisito en Logros y ve a por ella. Yo te espero aquí.',
        animacion: 'happy',
        tab: 'logros',
      },
      {
        id: 'pasarlo',
        texto: 'Pasarlo bien',
        emoji: '😄',
        respuesta: 'El objetivo más sano. Y el que más dura.',
        animacion: 'happy',
      },
      {
        id: 'nose',
        texto: 'No lo había pensado',
        emoji: '🤔',
        respuesta:
          'Pues empezamos por algo pequeño: una respuesta en un hilo. Ya verás.',
        animacion: 'idle',
      },
    ],
  },

  {
    id: 'extras_tour',
    contextos: ['extras', 'support', 'admin'],
    apertura: '🧰 ¿Sabes qué hay en Extras, o entramos a mirar juntos?',
    animacion: 'thinking',
    opciones: [
      {
        id: 'tour',
        texto: 'Hazme un tour',
        emoji: '🗺️',
        respuesta:
          'Trivia, noticias, encuestas y alguna herramienta más. No todo está en la portada.',
        animacion: 'hype',
        tab: 'extras',
      },
      {
        id: 'herramienta',
        texto: 'Busco una herramienta concreta',
        emoji: '🔧',
        respuesta:
          'Dime qué quieres hacer y te digo dónde está. Si no existe, aún no la han inventado.',
        animacion: 'thinking',
      },
      {
        id: 'curiosear',
        texto: 'Solo estoy curioseando',
        emoji: '👀',
        respuesta: 'El mejor motivo para estar aquí. Curiosear no rompe nada.',
        animacion: 'happy',
      },
      {
        id: 'panel',
        texto: 'Vengo por el panel',
        emoji: '🛠️',
        respuesta:
          'Entonces ya sabes más que yo. Aquí lo importante es no tocar lo que no pide guerra.',
        animacion: 'idle',
      },
    ],
  },

  {
    id: 'nuevo',
    contextos: ['register', 'login', 'home'],
    apertura: '🌱 Ya que estás aquí, ¿qué te apetece hacer primero?',
    animacion: 'happy',
    opciones: [
      {
        id: 'wiki',
        texto: 'Mirar la wiki',
        emoji: '📚',
        respuesta:
          'Buena elección. Busca una serie que te guste y mira su ficha.',
        animacion: 'happy',
        tab: 'wiki',
      },
      {
        id: 'feed',
        texto: 'Ver qué se cuece',
        emoji: '💬',
        respuesta: 'El feed está arriba. Entra en un hilo y lee sin prisa.',
        animacion: 'hype',
        tab: 'inicio',
      },
      {
        id: 'trivia',
        texto: 'Probar la trivia',
        emoji: '🧠',
        respuesta: 'Tres preguntas y a presumir. O a aprender, según salga.',
        animacion: 'hype',
        tab: 'trivia',
      },
      {
        id: 'presentarme',
        texto: 'Presentarme',
        emoji: '🙋',
        respuesta:
          'Buena idea. Un hilo corto contando qué te gusta y ya tienes la puerta abierta.',
        animacion: 'hype',
        tab: 'inicio',
      },
      {
        id: 'mirar',
        texto: 'Solo mirar',
        emoji: '🫣',
        respuesta:
          'Mirar también cuenta. Cuando quieras participar, aquí estoy.',
        animacion: 'idle',
      },
    ],
  },

  {
    id: 'trivia_reto',
    contextos: ['trivia', 'achievements'],
    apertura: '🧠 ¿Vienes a por la trivia de hoy o a calentar?',
    animacion: 'thinking',
    opciones: [
      {
        id: 'hoy',
        texto: 'A por la de hoy',
        emoji: '🎯',
        respuesta: 'Esa es la actitud. Tres preguntas, sin presión... mucha.',
        animacion: 'hype',
        tab: 'trivia',
      },
      {
        id: 'racha',
        texto: 'A mantener la racha',
        emoji: '🔥',
        respuesta: 'Las rachas se rompen con una distracción. Concéntrate.',
        animacion: 'hype',
      },
      {
        id: 'practicar',
        texto: 'Solo a practicar',
        emoji: '📝',
        respuesta: 'Practicar también da XP. Y excusas, pero de las buenas.',
        animacion: 'happy',
      },
      {
        id: 'otro_dia',
        texto: 'Hoy paso',
        emoji: '😴',
        respuesta: 'Descansar también es parte del plan. Mañana te espero.',
        animacion: 'idle',
      },
    ],
  },

  {
    id: 'soporte_caso',
    contextos: ['support', 'error'],
    apertura: '🛠️ ¿Te ha dado guerra algo o vienes a mirar cómo va esto?',
    animacion: 'thinking',
    opciones: [
      {
        id: 'error',
        texto: 'Me ha dado un error',
        emoji: '⚠️',
        respuesta:
          'Cuéntalo en el ticket con la sección y lo que hacías. Con eso se puede seguir la pista.',
        animacion: 'thinking',
      },
      {
        id: 'duda',
        texto: 'Tengo una duda',
        emoji: '❓',
        respuesta: 'Pregunta sin rodeos. Si no lo sé, te digo dónde mirarlo.',
        animacion: 'happy',
      },
      {
        id: 'mirar',
        texto: 'Solo miraba',
        emoji: '👀',
        respuesta: 'Aquí no se rompe nada por mirar. Bueno, casi nada.',
        animacion: 'idle',
      },
    ],
  },

  {
    id: 'admin_pausa',
    contextos: ['admin'],
    apertura: '🛠️ ¿Mucha cola hoy o es una tarde tranquila?',
    animacion: 'idle',
    opciones: [
      {
        id: 'cola',
        texto: 'Bastante cola',
        emoji: '📋',
        respuesta:
          'Entonces ve de lo urgente a lo importante. Lo demás puede esperar.',
        animacion: 'thinking',
      },
      {
        id: 'tranquila',
        texto: 'Tranquila',
        emoji: '☕',
        respuesta:
          'Aprovecha para revisar lo que siempre se queda para después.',
        animacion: 'idle',
      },
      {
        id: 'duda',
        texto: 'Tengo una duda de moderación',
        emoji: '🛡️',
        respuesta:
          'Las decisiones delicadas mejor con otra persona del equipo. No hace falta cargarlo todo solo.',
        animacion: 'thinking',
      },
      {
        id: 'fuera',
        texto: 'Solo pasaba por aquí',
        emoji: '🚪',
        respuesta: 'Bienvenido al backstage. No toques los botones rojos.',
        animacion: 'happy',
      },
    ],
  },

  {
    id: 'descubrir',
    contextos: 'todas',
    apertura: '🗺️ ¿Te enseño un rincón de Geekapoo que igual no has tocado?',
    animacion: 'thinking',
    opciones: [
      {
        id: 'vamos',
        texto: 'Vamos',
        emoji: '🚀',
        respuesta:
          '¡Esa actitud! Mira las pestañas de arriba: hay más de las que parecen.',
        animacion: 'hype',
      },
      {
        id: 'otro_dia',
        texto: 'Otro día',
        emoji: '🙃',
        respuesta: 'Vale, pero luego no digas que no te avisé.',
        animacion: 'idle',
      },
      {
        id: 'cual',
        texto: '¿Cuál me recomiendas?',
        emoji: '🧭',
        respuesta:
          'Si te gusta leer, la wiki. Si te gusta hablar, el feed. Si te gusta competir, la trivia.',
        animacion: 'happy',
      },
    ],
  },

  {
    id: 'funcion_oculta',
    contextos: 'todas',
    apertura: '🔍 ¿Sabías que hay funciones de Geekapoo que casi nadie usa?',
    animacion: 'thinking',
    opciones: [
      {
        id: 'cuales',
        texto: '¿Como cuáles?',
        emoji: '👀',
        respuesta:
          'Las tier lists, las encuestas en hilos y los clubes con canales. Casi nada.',
        animacion: 'hype',
      },
      {
        id: 'tier',
        texto: 'Enséñame las tier lists',
        emoji: '📊',
        respuesta:
          'Están en Extras. Sirven para ordenar personajes y discutir con criterio.',
        animacion: 'happy',
        tab: 'extras',
      },
      {
        id: 'encuestas',
        texto: 'Lo de las encuestas',
        emoji: '🗳️',
        respuesta:
          'Puedes poner una encuesta al crear un hilo. La gente vota más de lo que comenta.',
        animacion: 'thinking',
        tab: 'inicio',
      },
      {
        id: 'clubes',
        texto: 'Los clubes',
        emoji: '🏰',
        respuesta:
          'Están dentro de Chats. Un club es un grupo con canales y sus propias reglas.',
        animacion: 'hype',
        tab: 'chats',
      },
    ],
  },
];

/** Las conversaciones que tienen sentido en un contexto. */
export function conversacionesDe(contexto: KapoContext): KapoConversacion[] {
  return KAPO_CONVERSACIONES.filter(
    (c) => c.contextos === 'todas' || c.contextos.includes(contexto),
  );
}

/**
 * Elige una conversación sin repetir la última, igual que hace
 * `elegirMensaje` con las frases. El azar se recibe como parámetro
 * para poder probarlo sin depender de `Math.random()`.
 */
export function elegirConversacion(
  contexto: KapoContext,
  ultimaId: string | null,
  azar: number = Math.random(),
): KapoConversacion | null {
  const candidatas = conversacionesDe(contexto);
  if (candidatas.length === 0) return null;

  const sinRepetir =
    ultimaId && candidatas.length > 1
      ? candidatas.filter((c) => c.id !== ultimaId)
      : candidatas;

  const i = Math.min(
    sinRepetir.length - 1,
    Math.floor(azar * sinRepetir.length),
  );
  return sinRepetir[i];
}

/** Busca una conversación por id (para el arranque de una cuenta nueva). */
export function conversacionPorId(id: string): KapoConversacion | null {
  return KAPO_CONVERSACIONES.find((c) => c.id === id) ?? null;
}
