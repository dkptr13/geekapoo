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
export const ORDEN_RAREZA: MedalRarity[] = ['legendaria', 'epica', 'rara', 'comun'];

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
    xpEnAnime: 'XP en ese anime',
    trivias: 'trivias',
    aciertosTrivia: 'aciertos en la trivia',
    triviasPerfectas: 'trivias perfectas',
    rachaTrivia: 'días de racha',
    seguidores: 'seguidores',
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
