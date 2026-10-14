import {
  CONFIG_POR_DEFECTO,
  type GamificationConfig,
  type LevelCurveConfig,
  type Medal,
  type MedalRarity,
  type MedalRequirement,
} from '../types/gamification';

// ======================================================
// CURVA DE NIVELES
// ======================================================
// CURVA DE NIVELES
// ======================================================
//
// `xpParaNivel(n) = round(base * n^exponente)`
//
// Con los valores por defecto (100 y 1.5):
//   nivel  2 →  283 XP      nivel 30 → 16.432
//   nivel  5 → 1.118       nivel 40 → 25.298
//   nivel 10 → 3.162       nivel 50 → 35.355
//   nivel 25 → 12.500      nivel 60 → 46.476  (tope)
//
// El exponente 1.5 es lo que hace que cada nivel cueste más que
// el anterior sin que la curva se vuelva inalcanzable: es
// proporcional a la raíz, no exponencial pura.
//
// ESTA FUNCIÓN SE COPIA TAL CUAL en `functions/src/index.ts`.
// El cliente la usa para pintar la barra al instante (sin
// esperar a que la función escriba el nivel) y las funciones
// para calcular el nivel de verdad. Si se tocase solo una de
// las dos copias, la barra y el nivel guardado no coincidirían.

/** XP total que hace falta para alcanzar un nivel desde cero. */
export function xpParaNivel(nivel: number, curva: LevelCurveConfig): number {
  if (nivel <= 1) return 0;
  const n = Math.min(nivel, curva.nivelesMaximos);
  return Math.round(curva.base * Math.pow(n, curva.exponente));
}

/**
 * Nivel al que corresponde una cantidad de XP.
 *
 * `xpEnNivel` es lo que le sobra al usuario dentro de su nivel
 * actual, que es lo que llena la barra de progreso.
 */
export function nivelDesdeXp(
  xp: number,
  curva: LevelCurveConfig = CONFIG_POR_DEFECTO,
): { level: number; xpEnNivel: number; xpParaSiguienteNivel: number } {
  const total = Math.max(0, Math.floor(xp) || 0);
  const tope = xpParaNivel(curva.nivelesMaximos, curva);

  // En el tope no hay "siguiente": la barra se llena entera.
  if (total >= tope) {
    return {
      level: curva.nivelesMaximos,
      xpEnNivel: tope - xpParaNivel(curva.nivelesMaximos - 1, curva),
      xpParaSiguienteNivel: 0,
    };
  }

  // levels van de 1 a 60, así que este bucle da como mucho 60
  // vueltas. No es un problema de rendimiento, pero se corta
  // en el tope por si acaso.
  let level = 1;
  while (level < curva.nivelesMaximos && xpParaNivel(level + 1, curva) <= total) {
    level += 1;
  }

  const base = xpParaNivel(level, curva);
  const siguiente = xpParaNivel(level + 1, curva);

  return {
    level,
    xpEnNivel: total - base,
    xpParaSiguienteNivel: siguiente - base,
  };
}

/**
 * Nombres de rango por tramo de nivel.
 *
 * Se muestran en el perfil y junto al nivel. Los tramos están
 * elegidos para que 25 y 50 (los que dan "-{rank}" deanilla)
 * caigan justo en un cambio de nombre.
 */
const RANGOS: { desde: number; nombre: string }[] = [
  { desde: 60, nombre: 'Leyenda Absoluta' },
  { desde: 50, nombre: 'Leyenda Otaku' },
  { desde: 40, nombre: 'Maestro Geek' },
  { desde: 30, nombre: 'Guardián de Temporada' },
  { desde: 25, nombre: 'Veterano Geek' },
  { desde: 15, nombre: 'Habitual' },
  { desde: 8, nombre: 'Participante' },
  { desde: 1, nombre: 'Novato' },
];

/** Rango legible de un nivel. */
export function rangoDeNivel(level: number): string {
  return RANGOS.find((r) => level >= r.desde)?.nombre ?? 'Novato';
}

/**
 * Hitos que dan XP extra al cruzarse.
 *
 * No se guardan en la configuración de Firestore porque su
 *recompensa ya es una decisión de diseño, no un número que el
 * admin vaya a tocar: están aquí y en la copia de las
 * funciones.
 */
export const HITOS_DE_NIVEL = [5, 10, 25, 50] as const;

// ======================================================
// CATÁLOGO DE MEDALLAS
// ======================================================
//
// IMPORTANTE: este catálogo tiene una copia en
// `functions/src/index.ts`. Son paquetes distintos y no
// comparten código, así que los ids DEBEN coincidir: es la
// clave con la que se guarda `users/{uid}.medals`.
//
// Las ids nunca se renombran ni se reutilizan. Si una medalla
// desaparece del catálogo, sus usuarios conservan el registro
// y el nombre se queda guardado junto a la fecha, para que el
// perfil siga siendo legible.

/**
 * Las medallas temáticas "Mago de Frieren" y "Netrunner de Night
 * City".
 *
 * Se calibran por anime, no por título: el requisito mira
 * `stats.animeXp[animeId]`, así que da igual cómo se escriba
 * el nombre en el catálogo. El `animeId` de estas dos hay que
 * ponerlo a mano tras desplegar, porque depende de qué
 * documentos hay en `animes`. Se puede cambiar desde el panel
 * de administración sin tocar código.
 */
export const MEDALLA_ANIME_FRIEREN = 'medal_mago_frieren';
export const MEDALLA_ANIME_CYBERPUNK = 'medal_netrunner_night_city';

export const CATALOGO_MEDALLAS: Medal[] = [
  {
    id: 'medal_primer_hilo',
    nombre: 'Debut',
    descripcion: 'Publicaste tu primer hilo en la comunidad.',
    rareza: 'comun',
    icono: '🌱',
    requisito: { tipo: 'hilos', valor: 1 },
  },
  {
    id: 'medal_primera_voz',
    nombre: 'Primera Voz',
    descripcion: 'Escribiste tu primer comentario.',
    rareza: 'comun',
    icono: '💬',
    requisito: { tipo: 'comentarios', valor: 1 },
  },
  {
    id: 'medal_debatiente_pro',
    nombre: 'Debatiente Pro',
    descripcion: 'Has publicado 50 comentarios.',
    rareza: 'rara',
    icono: '🗣️',
    requisito: { tipo: 'comentarios', valor: 50 },
    titulo: 'Debatiente Pro',
  },
  {
    id: 'medal_creador_comunidad',
    nombre: 'Creador de Comunidad',
    descripcion: 'Has creado 25 hilos.',
    rareza: 'rara',
    icono: '🏗️',
    requisito: { tipo: 'hilos', valor: 25 },
    titulo: 'Creador de Comunidad',
  },
  {
    id: 'medal_voz_comunidad',
    nombre: 'Voz de la Comunidad',
    descripcion: 'Tus contenidos han recibido 100 "Me gusta".',
    rareza: 'rara',
    icono: '📣',
    requisito: { tipo: 'likes', valor: 100 },
    titulo: 'Voz de la Comunidad',
  },
  {
    id: 'medal_critico_temporada',
    nombre: 'Crítico de Temporada',
    descripcion:
      'Has participado en 15 debates: comentarios dentro de los hilos de anime.',
    rareza: 'epica',
    icono: '🎬',
    requisito: { tipo: 'debates', valor: 15 },
    titulo: 'Crítico de Temporada',
  },
  {
    id: MEDALLA_ANIME_FRIEREN,
    nombre: 'Mago de Frieren',
    descripcion:
      'Has acumulado 150 XP participando en la sección de Frieren: comentarios y "Me gusta" en sus episodios y personajes.',
    rareza: 'epica',
    icono: '🧙',
    requisito: { tipo: 'xpEnAnime', animeId: 'CONFIGURAR_FRIEREN', valor: 150 },
    titulo: 'Mago de Frieren',
  },
  {
    id: MEDALLA_ANIME_CYBERPUNK,
    nombre: 'Netrunner de Night City',
    descripcion:
      'Has acumulado 150 XP participando en la sección de Cyberpunk.',
    rareza: 'epica',
    icono: '💾',
    requisito: { tipo: 'xpEnAnime', animeId: 'CONFIGURAR_CYBERPUNK', valor: 150 },
    titulo: 'Netrunner de Night City',
  },
  {
    id: 'medal_veterano_geek',
    nombre: 'Veterano Geek',
    descripcion: 'Has alcanzado el nivel 25.',
    rareza: 'epica',
    icono: '🎖️',
    requisito: { tipo: 'nivel', valor: 25 },
    titulo: 'Veterano Geek',
  },
  // ── Comunidad: seguidores ─────────────────────────────
  //
  // Las cuatro miden `stats.followersReceived`, que es el máximo de
  // seguidores que ha tenido, NO los que tiene ahora. Es una
  // decisión: si un usuario llegó a tener 100 seguidores y luego se
  // fueron, no le quitamos la medalla. El follow es reversible con
  // un clic (no una suscripción de pago), y una medalla que se
  // pierde por eso parece un castigo por usar la web.
  //
  // El XP sí depende de lo que pase AHORA: lo concede la Cloud
  // Function con el contador vivo `followersCount`, y solo una vez
  // por persona (lo garantiza el libro mayor).
  {
    id: 'medal_primer_fan',
    nombre: 'Primer Fan',
    descripcion: 'Alguien te ha seguido por primera vez.',
    rareza: 'comun',
    icono: '⭐',
    requisito: { tipo: 'seguidores', valor: 1 },
  },
  {
    id: 'medal_popular',
    nombre: 'Popular',
    descripcion: 'Has llegado a tener 10 seguidores.',
    rareza: 'rara',
    icono: '🌟',
    requisito: { tipo: 'seguidores', valor: 10 },
  },
  {
    id: 'medal_figura_comunidad',
    nombre: 'Figura de la Comunidad',
    descripcion: 'Has llegado a tener 100 seguidores.',
    rareza: 'epica',
    icono: '🌟',
    requisito: { tipo: 'seguidores', valor: 100 },
    titulo: 'Figura de la Comunidad',
  },
  {
    id: 'medal_icono_geekapoo',
    nombre: 'Icono Geekapoo',
    descripcion: 'Has llegado a tener 500 seguidores.',
    rareza: 'legendaria',
    icono: '💫',
    requisito: { tipo: 'seguidores', valor: 500 },
    titulo: 'Icono Geekapoo',
  },
  {
    id: 'medal_leyenda_otaku',
    nombre: 'Leyenda Otaku',
    descripcion: 'Has alcanzado el nivel 50.',
    rareza: 'legendaria',
    icono: '👑',
    requisito: { tipo: 'nivel', valor: 50 },
    titulo: 'Leyenda Otaku',
  },
  {
    id: 'medal_geek_de_geeks',
    nombre: 'Geek de Geeks',
    descripcion: 'Has alcanzado el nivel 60, el máximo posible.',
    rareza: 'legendaria',
    icono: '💎',
    requisito: { tipo: 'nivel', valor: 60 },
    titulo: 'Geek de Geeks',
  },
  // ── Trivia diaria ─────────────────────────────────────
  //
  // Las cuatro leen de contadores que escribe la Cloud Function
  // al corregir la trivia. El jugador no puede tocarlos (ver
  // `firestore.rules`), así que se consiguen jugando.
  {
    id: 'medal_cerebro_otaku',
    nombre: 'Cerebro Otaku',
    descripcion: 'Has completado 10 trivias diarias.',
    rareza: 'rara',
    icono: '🧠',
    requisito: { tipo: 'trivias', valor: 10 },
  },
  {
    id: 'medal_maestro_anime',
    nombre: 'Maestro del Anime',
    descripcion: 'Has acertado 100 preguntas de la trivia diaria.',
    rareza: 'epica',
    icono: '🎓',
    requisito: { tipo: 'aciertosTrivia', valor: 100 },
    titulo: 'Maestro del Anime',
  },
  {
    id: 'medal_racha_inparable',
    nombre: 'Racha Imparable',
    descripcion: 'Has completado la trivia 7 días seguidos.',
    rareza: 'rara',
    icono: '🔥',
    requisito: { tipo: 'rachaTrivia', valor: 7 },
    titulo: 'Racha Imparable',
  },
  {
    id: 'medal_leyenda_trivia',
    nombre: 'Leyenda de la Trivia',
    descripcion: 'Has completado la trivia 30 días seguidos.',
    rareza: 'legendaria',
    icono: '⚡',
    requisito: { tipo: 'rachaTrivia', valor: 30 },
    titulo: 'Leyenda de la Trivia',
  },
  {
    id: 'medal_perfect_score',
    nombre: 'Perfect Score',
    descripcion: 'Has acertado las 3 preguntas de 10 trivias.',
    rareza: 'rara',
    icono: '🏆',
    requisito: { tipo: 'triviasPerfectas', valor: 10 },
  },
  {
    id: 'medal_sabio_otaku',
    nombre: 'Sabio Otaku',
    descripcion: 'Has acertado 500 preguntas de la trivia diaria.',
    rareza: 'legendaria',
    icono: '👑',
    requisito: { tipo: 'aciertosTrivia', valor: 500 },
    titulo: 'Sabio Otaku',
  },
  {
    id: 'medal_miembro_fundador',
    nombre: 'Miembro Fundador',
    descripcion:
      'Reservada a quienes cumplieron las condiciones históricas de la comunidad. La concede el equipo a mano.',
    rareza: 'legendaria',
    icono: '🏛️',
    requisito: null,
    titulo: 'Miembro Fundador',
  },
  // ── Progresión y conocimiento (automáticas) ──────────
  //
  // Requisitos que las funciones ya pueden comprobar con los
  // contadores que existen: comentarios, nivel, XP total y series
  // distintas con actividad. Nada de esto pide triggers nuevos.
  {
    id: 'medal_rompehielos',
    nombre: 'Rompehielos',
    descripcion: 'Has publicado 10 comentarios.',
    rareza: 'comun',
    icono: '🧊',
    requisito: { tipo: 'comentarios', valor: 10 },
  },
  {
    id: 'medal_novato_multiverso',
    nombre: 'Novato del Multiverso',
    descripcion: 'Has alcanzado el nivel 1. Todo multiverso empieza aquí.',
    rareza: 'comun',
    icono: '🌌',
    requisito: { tipo: 'nivel', valor: 1 },
    titulo: 'Novato del Multiverso',
  },
  {
    id: 'medal_otaku_ascenso',
    nombre: 'Otaku en Ascenso',
    descripcion: 'Has alcanzado el nivel 5.',
    rareza: 'poco_comun',
    icono: '🚀',
    requisito: { tipo: 'nivel', valor: 5 },
    titulo: 'Otaku en Ascenso',
  },
  {
    id: 'medal_guardian_lore',
    nombre: 'Guardián del Lore',
    descripcion: 'Has alcanzado el nivel 10.',
    rareza: 'rara',
    icono: '📜',
    requisito: { tipo: 'nivel', valor: 10 },
    titulo: 'Guardián del Lore',
  },
  {
    id: 'medal_coleccionista_xp',
    nombre: 'Coleccionista de XP',
    descripcion: 'Has acumulado 10.000 XP en total.',
    rareza: 'rara',
    icono: '💰',
    requisito: { tipo: 'xp', valor: 10000 },
  },
  {
    id: 'medal_biblioteca',
    nombre: 'Biblioteca Viviente',
    descripcion: 'Has participado en 10 series diferentes.',
    rareza: 'epica',
    icono: '📚',
    requisito: { tipo: 'seriesDiferentes', valor: 10 },
  },
  {
    id: 'medal_enciclopedia',
    nombre: 'Enciclopedia Anime',
    descripcion: 'Has participado en 25 series diferentes.',
    rareza: 'epica',
    icono: '🧭',
    requisito: { tipo: 'seriesDiferentes', valor: 25 },
  },
  {
    id: 'medal_elite_geekapoo',
    nombre: 'Élite de Geekapoo',
    descripcion: 'Has alcanzado el nivel 20.',
    rareza: 'epica',
    icono: '🎖️',
    requisito: { tipo: 'nivel', valor: 20 },
    titulo: 'Élite de Geekapoo',
  },
  {
    id: 'medal_leyenda_multiverso',
    nombre: 'Leyenda del Multiverso',
    descripcion: 'Has alcanzado el nivel 35.',
    rareza: 'legendaria',
    icono: '🌠',
    requisito: { tipo: 'nivel', valor: 35 },
    titulo: 'Leyenda del Multiverso',
  },
  {
    id: 'medal_entidad_otro_mundo',
    nombre: 'Entidad de Otro Mundo',
    descripcion: 'Has alcanzado el nivel 55, casi en el tope.',
    rareza: 'mitica',
    icono: '👁️',
    requisito: { tipo: 'nivel', valor: 55 },
    titulo: 'Entidad de Otro Mundo',
  },
  // ── Manuales (las concede el equipo) ────────────────
  //
  // Requisito `null` como la de Miembro Fundador: dependen de
  // criterios que solo una persona puede comprobar (trayectoria
  // de moderación, guías aprobadas, respuestas útiles). La
  // descripción lo dice para no fingir un automatismo.
  {
    id: 'medal_moderador_confianza',
    nombre: 'Moderador de Confianza',
    descripcion:
      'Reconocimiento del equipo tras una trayectoria de moderación responsable. Se concede a mano.',
    rareza: 'legendaria',
    icono: '🛡️',
    requisito: null,
    titulo: 'Moderador de Confianza',
  },
  {
    id: 'medal_guia_comunidad',
    nombre: 'Guía de la Comunidad',
    descripcion:
      'Publicaste una guía aprobada por la moderación. Se concede a mano tras la revisión.',
    rareza: 'epica',
    icono: '🗺️',
    requisito: null,
    titulo: 'Guía de la Comunidad',
  },
  {
    id: 'medal_comentario_oro',
    nombre: 'Comentario de Oro',
    descripcion: 'Tus comentarios han recibido 25 reacciones positivas.',
    rareza: 'rara',
    icono: '🥇',
    requisito: { tipo: 'likes', valor: 25 },
  },
  {
    id: 'medal_mano_amiga',
    nombre: 'Mano Amiga',
    descripcion:
      'Diez reconocimientos por respuestas útiles. Se concede a mano mientras no haya sistema automático.',
    rareza: 'rara',
    icono: '🤝',
    requisito: null,
    titulo: 'Mano Amiga',
  },
  // ── Pendientes (su sistema no existe todavía) ───────
  //
  // `disponible: false` y las funciones las ignoran: ni se
  // conceden solas ni a mano. La galería las enseña como
  // "Próximamente" con el motivo, para documentar lo que viene
  // sin fingir que ya funciona.
  {
    id: 'medal_habitante',
    nombre: 'Habitante de Geekapoo',
    descripcion: 'Completa los datos básicos de tu perfil.',
    rareza: 'comun',
    icono: '🏠',
    requisito: { tipo: 'perfilCompleto', valor: 1 },
  },
  {
    id: 'medal_otaku_formacion',
    nombre: 'Otaku en Formación',
    descripcion: 'Participa en tu primer hilo sobre anime o manga.',
    rareza: 'comun',
    icono: '🎒',
    requisito: { tipo: 'seriesDiferentes', valor: 1 },
  },
  {
    id: 'medal_siempre_presente',
    nombre: 'Siempre Presente',
    descripcion: 'Participa en 7 días diferentes.',
    rareza: 'poco_comun',
    icono: '📅',
    requisito: { tipo: 'dias', valor: 7 },
  },
  {
    id: 'medal_veterano_comunidad',
    nombre: 'Veterano de la Comunidad',
    descripcion: 'Cumple un año desde el registro.',
    rareza: 'rara',
    icono: '🎂',
    requisito: { tipo: 'antiguedadDias', valor: 365 },
  },
  {
    id: 'medal_maestro_manga',
    nombre: 'Maestro del Manga',
    descripcion: 'Crea 10 hilos sobre manga.',
    rareza: 'poco_comun',
    icono: '📖',
    requisito: { tipo: 'hilosTopico', topico: 'manga', valor: 10 },
  },
  {
    id: 'medal_cazador_referencias',
    nombre: 'Cazador de Referencias',
    descripcion: 'Completa 5 trivias diarias.',
    rareza: 'rara',
    icono: '🔎',
    requisito: { tipo: 'trivias', valor: 5 },
  },
  {
    id: 'medal_bienvenida',
    nombre: 'Bienvenida Cálida',
    descripcion: 'Ayuda a 5 usuarios nuevos con interacciones válidas.',
    rareza: 'poco_comun',
    icono: '💐',
    requisito: null,
    disponible: false,
    motivoPendiente: 'Próximamente: ayuda a novatos',
  },
  {
    id: 'medal_puentes',
    nombre: 'Constructor de Puentes',
    descripcion: 'Participa en 5 clubes diferentes (unirse cuenta).',
    rareza: 'rara',
    icono: '🌉',
    requisito: { tipo: 'clubes', valor: 5 },
    titulo: 'Embajador Geek',
  },
  {
    id: 'medal_explorador_social',
    nombre: 'Explorador Social',
    descripcion: 'Únete a 5 clubes diferentes.',
    rareza: 'poco_comun',
    icono: '🧭',
    requisito: { tipo: 'clubes', valor: 5 },
  },
  {
    id: 'medal_fundador_club',
    nombre: 'Fundador',
    descripcion: 'Crea tu primer club.',
    rareza: 'rara',
    icono: '🏗️',
    requisito: { tipo: 'clubesCreados', valor: 1 },
  },
  {
    id: 'medal_arquitecto_canales',
    nombre: 'Arquitecto de Canales',
    descripcion: 'Crea 5 canales en clubes que puedas gestionar.',
    rareza: 'epica',
    icono: '🧱',
    requisito: { tipo: 'canales', valor: 5 },
    titulo: 'Señor de los Canales',
  },
  {
    id: 'medal_conector_social',
    nombre: 'Conector Social',
    descripcion: 'Participa de forma válida en 5 chats diferentes.',
    rareza: 'rara',
    icono: '🔌',
    requisito: { tipo: 'chats', valor: 5 },
  },
  {
    id: 'medal_arquitecto_tiers',
    nombre: 'Arquitecto de Tier Lists',
    descripcion: 'Crea 5 tier lists válidas.',
    rareza: 'poco_comun',
    icono: '📊',
    requisito: { tipo: 'tiers', valor: 5 },
  },
  {
    id: 'medal_rey_ranking',
    nombre: 'Rey del Ranking',
    descripcion: 'Una de tus tier lists llegó a popular (votos configurados).',
    rareza: 'epica',
    icono: '👑',
    requisito: { tipo: 'tiersPopulares', valor: 1 },
    titulo: 'Rey de las Tier Lists',
  },
  {
    id: 'medal_encuestador',
    nombre: 'Encuestador Profesional',
    descripcion: 'Crea 10 encuestas válidas.',
    rareza: 'rara',
    icono: '🗳️',
    requisito: { tipo: 'encuestas', valor: 10 },
  },
  {
    id: 'medal_perfil_leyenda',
    nombre: 'Perfil de Leyenda',
    descripcion: 'Equipa personalización en tu perfil (marco, pegatinas, vitrinas o insignias).',
    rareza: 'epica',
    icono: '✨',
    requisito: { tipo: 'perfilCustom', valor: 1 },
  },
  {
    id: 'medal_kapo_master',
    nombre: 'Kapo-chan Master',
    descripcion: 'Completa 30 retos diarios de Kapo-chan.',
    rareza: 'legendaria',
    icono: '🤖',
    requisito: null,
    disponible: false,
    motivoPendiente: 'Próximamente: retos de Kapo-chan',
  },
  {
    id: 'medal_kapo_reconoce',
    nombre: 'Kapo-chan te Reconoce',
    descripcion: 'Completa el desafío especial de Kapo-chan.',
    rareza: 'legendaria',
    icono: '🏵️',
    requisito: null,
    disponible: false,
    motivoPendiente: 'Próximamente: retos de Kapo-chan',
    titulo: 'Kapo-chan te Reconoce',
  },
  {
    id: 'medal_fundador_leyendas',
    nombre: 'Fundador de Leyendas',
    descripcion: 'Crea un club y cumple sus hitos comunitarios.',
    rareza: 'legendaria',
    icono: '🏰',
    requisito: null,
    disponible: false,
    motivoPendiente: 'Próximamente: clubes',
    titulo: 'Fundador de Leyendas',
  },
  {
    id: 'medal_arquitecto_comunidades',
    nombre: 'Arquitecto de Comunidades',
    descripcion: 'Crea un club y cumple sus objetivos de participación.',
    rareza: 'epica',
    icono: '🌐',
    requisito: null,
    disponible: false,
    motivoPendiente: 'Próximamente: clubes',
    titulo: 'Arquitecto de Comunidades',
  },
  {
    id: 'medal_recomendador',
    nombre: 'El Recomendador',
    descripcion: 'Publica 10 hilos de recomendaciones.',
    rareza: 'poco_comun',
    icono: '💡',
    requisito: { tipo: 'hilosTopico', topico: 'recomendacion', valor: 10 },
    titulo: 'El Recomendador',
  },
  {
    id: 'medal_explorador_generos',
    nombre: 'Explorador de Géneros',
    descripcion: 'Publica en 5 tópicos distintos.',
    rareza: 'poco_comun',
    icono: '🧪',
    requisito: { tipo: 'topicosDistintos', valor: 5 },
  },
  {
    id: 'medal_teorico',
    nombre: 'Teórico Profesional',
    descripcion: 'Publica 5 hilos de teorías.',
    rareza: 'epica',
    icono: '🔬',
    requisito: { tipo: 'hilosTopico', topico: 'teoria', valor: 5 },
  },
  {
    id: 'medal_coleccionista_historias',
    nombre: 'Coleccionista de Historias',
    descripcion: 'Participa en conversaciones sobre 20 series.',
    rareza: 'rara',
    icono: '🗂️',
    requisito: null,
    disponible: false,
    motivoPendiente: 'Próximamente: series en chats',
  },
  {
    id: 'medal_memes',
    nombre: 'Maestro de los Memes',
    descripcion: 'Publica 10 hilos con imagen.',
    rareza: 'rara',
    icono: '🐸',
    requisito: { tipo: 'visuales', valor: 10 },
  },
  {
    id: 'medal_protagonista',
    nombre: 'El Protagonista',
    descripcion: 'Crea tu primer hilo y completa tu perfil.',
    rareza: 'comun',
    icono: '🌟',
    requisito: null,
    disponible: false,
    motivoPendiente: 'Próximamente: perfil completado',
    titulo: 'El Protagonista',
  },
  // ── Secretas (arquitectura lista, contenido futuro) ─
  //
  // `secreta: true` oculta nombre y requisito hasta
  // desbloquearla. De momento están pendientes: sirven para
  // validar el formato sin conceder nada.
  {
    id: 'medal_secreto_guardado',
    nombre: 'El Secreto Mejor Guardado',
    descripcion: '???',
    rareza: 'epica',
    icono: '❔',
    requisito: null,
    disponible: false,
    motivoPendiente: 'Secreto',
    secreta: true,
  },
  {
    id: 'medal_leyenda_fundadora',
    nombre: 'Leyenda Fundadora',
    descripcion: '???',
    rareza: 'legendaria',
    icono: '❔',
    requisito: null,
    disponible: false,
    motivoPendiente: 'Secreto',
    secreta: true,
  },
  {
    id: 'medal_maestro_multiverso',
    nombre: 'Maestro del Multiverso',
    descripcion: '???',
    rareza: 'legendaria',
    icono: '❔',
    requisito: null,
    disponible: false,
    motivoPendiente: 'Secreto',
    secreta: true,
    titulo: 'Maestro del Multiverso',
  },
  {
    id: 'medal_incatalogable',
    nombre: 'El Incatalogable',
    descripcion: '???',
    rareza: 'epica',
    icono: '❔',
    requisito: null,
    disponible: false,
    motivoPendiente: 'Secreto',
    secreta: true,
  },
  {
    id: 'medal_kapo_eligio',
    nombre: 'Kapo-chan te Eligió',
    descripcion: '???',
    rareza: 'mitica',
    icono: '❔',
    requisito: null,
    disponible: false,
    motivoPendiente: 'Secreto',
    secreta: true,
    titulo: 'Kapo-chan te Eligió',
  },
  {
    id: 'medal_cronista',
    nombre: 'Cronista de Geekapoo',
    descripcion: '???',
    rareza: 'epica',
    icono: '❔',
    requisito: null,
    disponible: false,
    motivoPendiente: 'Secreto',
    secreta: true,
  },
];

/** Índice por id, para no recorrer el catálogo en cada consulta. */
const POR_ID: Record<string, Medal> = CATALOGO_MEDALLAS.reduce<Record<string, Medal>>(
  (acc, m) => {
    acc[m.id] = m;
    return acc;
  },
  {},
);

export function medallaPorId(id: string | null | undefined): Medal | null {
  if (!id) return null;
  return POR_ID[id] ?? null;
}

/** Orden de rareza, para pintar la galería de la más rara a la menos. */
export const ORDEN_RAREZA: MedalRarity[] = [
  'mitica',
  'legendaria',
  'epica',
  'rara',
  'poco_comun',
  'comun',
];

/**
 * Ajusta los ids de anime de las medallas temáticas.
 *
 * El catálogo se escribe con marcadores (`CONFIGURAR_FRIEREN`)
 * porque los ids de los documentos de `animes` los genera
 * Firestore y no se saben al escribir el código. El panel de
 * administración los sustituye al guardar la configuración.
 *
 * Es una operación aparte a propósito: si el catálogo se
 * calculara al vuelo, un cambio de configuración alteraría los
 * requisitos en memoria sin que nadie lo hubiera escrito, y las
 * funciones leería median otro catálogo distinto.
 */
export function catalogoConAnimeIds(mapa: Record<string, string>): Medal[] {
  return CATALOGO_MEDALLAS.map((m) => {
    const requisito = m.requisito;
    if (requisito?.tipo !== 'xpEnAnime') return m;
    const animeId = mapa[requisito.animeId] ?? requisito.animeId;
    return { ...m, requisito: { ...requisito, animeId } };
  });
}

/**
 * Qué falta para conseguir una medalla, en texto y en proporción.
 *
 * Solo para la barra de la galería: el color de verdad lo
 * ponen las funciones. Si el requisito es nulo (medalla manual),
 * no hay progreso que enseñar.
 */
export function progresoDeMedalla(
  requisito: MedalRequirement | null,
  medidas: {
    hilos: number;
    comentarios: number;
    debates: number;
    likes: number;
    nivel: number;
    xp: number;
    seriesDiferentes: number;
    dias: number;
    clubes: number;
    clubesCreados: number;
    canales: number;
    chats: number;
    tiers: number;
    encuestas: number;
    antiguedadDias: number;
    perfilCompleto: boolean;
    perfilCustom: boolean;
    visuales: number;
    tiersPopulares: number;
    hilosTopico: (topico: string) => number;
    topicosDistintos: number;
    xpEnAnime: (animeId: string) => number;
    trivias: number;
    aciertosTrivia: number;
    triviasPerfectas: number;
    rachaTrivia: number;
    /** Seguidores que ha tenido como máximo. Ver `MedalRequirement`. */
    seguidores: number;
  },
): { progreso: number; falta: string } {
  if (!requisito) {
    return { progreso: 0, falta: 'Se concede a mano por el equipo' };
  }

  // Un "switch" y no una cadena de ternarios anidados: con diez
  // tipos de requisito el anidamiento llega a diez niveles y hay
  // que contar los parentesis para saber a que rama se cae.
  const UNIDADES: Record<MedalRequirement['tipo'], string> = {
    hilos: 'hilos',
    comentarios: 'comentarios',
    debates: 'debates',
    likes: '"Me gusta" recibidos',
    nivel: 'niveles',
    xp: 'XP',
    seriesDiferentes: 'series',
    xpEnAnime: 'XP en ese anime',
    trivias: 'trivias',
    aciertosTrivia: 'aciertos en la trivia',
    triviasPerfectas: 'trivias perfectas',
    rachaTrivia: 'días de racha',
    seguidores: 'seguidores',
    dias: 'días activos',
    clubes: 'clubes',
    clubesCreados: 'clubes creados',
    canales: 'canales creados',
    chats: 'conversaciones',
    tiers: 'tier lists',
    encuestas: 'encuestas',
    antiguedadDias: 'días registrado',
    perfilCompleto: 'perfil completado',
    perfilCustom: 'personalización equipada',
    visuales: 'aportes visuales',
    tiersPopulares: 'tiers populares',
    hilosTopico: 'hilos de ese tópico',
    topicosDistintos: 'tópicos distintos',
  };

  let actual: number;
  switch (requisito.tipo) {
    case 'hilos':
      actual = medidas.hilos;
      break;
    case 'comentarios':
      actual = medidas.comentarios;
      break;
    case 'debates':
      actual = medidas.debates;
      break;
    case 'likes':
      actual = medidas.likes;
      break;
    case 'nivel':
      actual = medidas.nivel;
      break;
    case 'xp':
      actual = medidas.xp;
      break;
    case 'seriesDiferentes':
      actual = medidas.seriesDiferentes;
      break;
    case 'visuales':
      actual = medidas.visuales;
      break;
    case 'tiersPopulares':
      actual = medidas.tiersPopulares;
      break;
    case 'hilosTopico':
      actual = medidas.hilosTopico(requisito.topico);
      break;
    case 'topicosDistintos':
      actual = medidas.topicosDistintos;
      break;
    case 'xpEnAnime':
      actual = medidas.xpEnAnime(requisito.animeId);
      break;
    case 'trivias':
      actual = medidas.trivias;
      break;
    case 'aciertosTrivia':
      actual = medidas.aciertosTrivia;
      break;
    case 'triviasPerfectas':
      actual = medidas.triviasPerfectas;
      break;
    case 'rachaTrivia':
      actual = medidas.rachaTrivia;
      break;
    case 'seguidores':
      actual = medidas.seguidores;
      break;
    case 'dias':
      actual = medidas.dias;
      break;
    case 'clubes':
      actual = medidas.clubes;
      break;
    case 'clubesCreados':
      actual = medidas.clubesCreados;
      break;
    case 'canales':
      actual = medidas.canales;
      break;
    case 'chats':
      actual = medidas.chats;
      break;
    case 'tiers':
      actual = medidas.tiers;
      break;
    case 'encuestas':
      actual = medidas.encuestas;
      break;
    case 'antiguedadDias':
      actual = medidas.antiguedadDias;
      break;
    case 'perfilCompleto':
      return medidas.perfilCompleto
        ? { progreso: 1, falta: 'Completada' }
        : { progreso: 0, falta: 'Completa tu nombre, bio y avatar' };
    case 'perfilCustom':
      return medidas.perfilCustom
        ? { progreso: 1, falta: 'Completada' }
        : { progreso: 0, falta: 'Equipa marco, pegatinas, vitrinas o insignias' };
  }

  const objetivo = requisito.valor;
  const progreso = objetivo <= 0 ? 1 : Math.min(1, actual / objetivo);
  const faltaN = Math.max(0, objetivo - actual);

  return {
    progreso,
    falta: faltaN === 0 ? 'Completada' : `Faltan ${faltaN} ${UNIDADES[requisito.tipo]}`,
  };
}

/** Aplica la configuración de Firestore sobre los valores por defecto. */
export function configDesdeFirestore(
  data: Partial<GamificationConfig> | null | undefined,
): GamificationConfig {
  if (!data) return CONFIG_POR_DEFECTO;
  return {
    ...CONFIG_POR_DEFECTO,
    ...data,
    xp: { ...CONFIG_POR_DEFECTO.xp, ...(data.xp ?? {}) },
  };
}
