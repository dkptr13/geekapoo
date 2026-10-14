/**
 * El catálogo de medallas del servidor y cómo se evalúa.
 *
 * ── POR QUÉ ESTÁ SUELTO ─────────────────────────────────────
 *
 * `functions/src/index.ts` importa `firebase-admin`, y Node no
 * puede cargarlo en una prueba. La evaluación de requisitos son
 * comparaciones puras, así que vive aquí y `tests/logica.logros.ts`
 * la comprueba de verdad (igual que `stats.ts` con los
 * contadores).
 *
 * ── COPIA DEL CATÁLOGO ──────────────────────────────────────
 *
 * Es COPIA del de `src/utils/progression.ts`. Los ids TIENEN que
 * coincidir: son la clave con la que se guarda
 * `users/{uid}.medals`. Aquí solo viajan id y requisito (la
 * rareza, el nombre y el icono solo los pinta el cliente).
 *
 * Las pendientes NO están aquí: si no están, ni se conceden
 * solas ni a mano (`concederMedalla` las rechaza con not-found).
 */
import { num, tamanoMapa, hilosEnTopico, topicosDistintos, type Estadisticas } from './stats';

export type Requisito =
  | { tipo: 'hilos'; valor: number }
  | { tipo: 'comentarios'; valor: number }
  | { tipo: 'likes'; valor: number }
  | { tipo: 'nivel'; valor: number }
  | { tipo: 'debates'; valor: number }
  | { tipo: 'xp'; valor: number }
  | { tipo: 'seriesDiferentes'; valor: number }
  | { tipo: 'xpEnAnime'; animeId: string; valor: number }
  | { tipo: 'seguidores'; valor: number }
  | { tipo: 'trivias'; valor: number }
  | { tipo: 'aciertosTrivia'; valor: number }
  | { tipo: 'triviasPerfectas'; valor: number }
  | { tipo: 'rachaTrivia'; valor: number }
  // ── Comunidad y funciones (Fase 2) ───────────────────
  //
  // Leen de los mapas y números de `stats` que escriben los
  // triggers de clubes, canales, chats, tier lists y encuestas
  // (ver `index.ts`). Nada de esto lo toca el cliente: `stats`
  // está bloqueado en las reglas.
  | { tipo: 'dias'; valor: number }
  | { tipo: 'clubes'; valor: number }
  | { tipo: 'clubesCreados'; valor: number }
  | { tipo: 'canales'; valor: number }
  | { tipo: 'chats'; valor: number }
  | { tipo: 'tiers'; valor: number }
  | { tipo: 'encuestas'; valor: number }
  | { tipo: 'visuales'; valor: number }
  | { tipo: 'tiersPopulares'; valor: number }
  // ── Tópicos de hilos ───────────────────────────────
  //
  // Cuentan hilos creados con tópicos oficiales
  // (`TOPICOS_OFICIALES` en `src/data/threadTopics.ts`). Lo que no
  // coincide no cuenta y no se inventa categoría.
  | { tipo: 'hilosTopico'; topico: string; valor: number }
  | { tipo: 'topicosDistintos'; valor: number }
  // ── Perfil y antigüedad ──────────────────────────────
  //
  // No leen `stats`: vienen calculados de `users/{uid}` (ver
  // `concederXP` en `index.ts`). `antiguedadDias` son días desde
  // `createdAt`; `perfilCompleto` es nombre, bio y avatar no
  // vacíos (el mismo criterio que el cliente en
  // `ProgressionContext`).
  | { tipo: 'antiguedadDias'; valor: number }
  | { tipo: 'perfilCompleto'; valor: 1 }
  | { tipo: 'perfilCustom'; valor: 1 };

export interface EntradaMedalla {
  id: string;
  requisito: Requisito | null;
}

export const MEDALLAS: EntradaMedalla[] = [
  { id: 'medal_primer_hilo', requisito: { tipo: 'hilos', valor: 1 } },
  { id: 'medal_primera_voz', requisito: { tipo: 'comentarios', valor: 1 } },
  { id: 'medal_debatiente_pro', requisito: { tipo: 'comentarios', valor: 50 } },
  { id: 'medal_creador_comunidad', requisito: { tipo: 'hilos', valor: 25 } },
  { id: 'medal_voz_comunidad', requisito: { tipo: 'likes', valor: 100 } },
  { id: 'medal_critico_temporada', requisito: { tipo: 'debates', valor: 15 } },
  // ── Comunidad: seguidores ─────────────────────────────
  //
  // Se conceden por `stats.followersReceived`, que es el MAXIMO
  // de seguidores que ha tenido, no el numero vivo: un follow se
  // deshace con un clic y una medalla que desaparece por eso
  // parece un castigo.
  { id: 'medal_primer_fan', requisito: { tipo: 'seguidores', valor: 1 } },
  { id: 'medal_popular', requisito: { tipo: 'seguidores', valor: 10 } },
  { id: 'medal_figura_comunidad', requisito: { tipo: 'seguidores', valor: 100 } },
  { id: 'medal_icono_geekapoo', requisito: { tipo: 'seguidores', valor: 500 } },
  {
    id: 'medal_mago_frieren',
    requisito: { tipo: 'xpEnAnime', animeId: 'CONFIGURAR_FRIEREN', valor: 150 },
  },
  {
    id: 'medal_netrunner_night_city',
    requisito: { tipo: 'xpEnAnime', animeId: 'CONFIGURAR_CYBERPUNK', valor: 150 },
  },
  { id: 'medal_veterano_geek', requisito: { tipo: 'nivel', valor: 25 } },
  { id: 'medal_leyenda_otaku', requisito: { tipo: 'nivel', valor: 50 } },
  { id: 'medal_geek_de_geeks', requisito: { tipo: 'nivel', valor: 60 } },
  // ── Trivia diaria ─────────────────────────────────────
  //
  // Se leen de contadores que solo escribe la función al corregir
  // un resultado, así que no hay forma de que el cliente se los
  // suba: se ganan jugando.
  { id: 'medal_cerebro_otaku', requisito: { tipo: 'trivias', valor: 10 } },
  { id: 'medal_maestro_anime', requisito: { tipo: 'aciertosTrivia', valor: 100 } },
  { id: 'medal_racha_inparable', requisito: { tipo: 'rachaTrivia', valor: 7 } },
  { id: 'medal_leyenda_trivia', requisito: { tipo: 'rachaTrivia', valor: 30 } },
  { id: 'medal_perfect_score', requisito: { tipo: 'triviasPerfectas', valor: 10 } },
  { id: 'medal_sabio_otaku', requisito: { tipo: 'aciertosTrivia', valor: 500 } },
  // Sin requisito: la concede el administrador a mano.
  { id: 'medal_miembro_fundador', requisito: null },
  // ── Progresión y conocimiento ───────────────────────
  //
  // Solo entran las que se pueden comprobar con lo que ya hay:
  // contadores, nivel, XP total y series distintas. Las pendientes
  // NO están aquí (ver arriba).
  { id: 'medal_rompehielos', requisito: { tipo: 'comentarios', valor: 10 } },
  { id: 'medal_novato_multiverso', requisito: { tipo: 'nivel', valor: 1 } },
  { id: 'medal_otaku_ascenso', requisito: { tipo: 'nivel', valor: 5 } },
  { id: 'medal_guardian_lore', requisito: { tipo: 'nivel', valor: 10 } },
  { id: 'medal_coleccionista_xp', requisito: { tipo: 'xp', valor: 10000 } },
  { id: 'medal_biblioteca', requisito: { tipo: 'seriesDiferentes', valor: 10 } },
  { id: 'medal_enciclopedia', requisito: { tipo: 'seriesDiferentes', valor: 25 } },
  { id: 'medal_elite_geekapoo', requisito: { tipo: 'nivel', valor: 20 } },
  { id: 'medal_leyenda_multiverso', requisito: { tipo: 'nivel', valor: 35 } },
  { id: 'medal_entidad_otro_mundo', requisito: { tipo: 'nivel', valor: 55 } },
  // Manuales: trayectoria de moderación, guías aprobadas y
  // respuestas útiles. Las concede el equipo tras revisar.
  { id: 'medal_moderador_confianza', requisito: null },
  { id: 'medal_guia_comunidad', requisito: null },
  { id: 'medal_mano_amiga', requisito: null },
  // ── Comunidad y funciones (Fase 2) ───────────────────
  { id: 'medal_habitante', requisito: { tipo: 'perfilCompleto', valor: 1 } },
  { id: 'medal_otaku_formacion', requisito: { tipo: 'seriesDiferentes', valor: 1 } },
  { id: 'medal_siempre_presente', requisito: { tipo: 'dias', valor: 7 } },
  { id: 'medal_veterano_comunidad', requisito: { tipo: 'antiguedadDias', valor: 365 } },
  { id: 'medal_comentario_oro', requisito: { tipo: 'likes', valor: 25 } },
  { id: 'medal_explorador_social', requisito: { tipo: 'clubes', valor: 5 } },
  { id: 'medal_fundador_club', requisito: { tipo: 'clubesCreados', valor: 1 } },
  { id: 'medal_arquitecto_canales', requisito: { tipo: 'canales', valor: 5 } },
  { id: 'medal_conector_social', requisito: { tipo: 'chats', valor: 5 } },
  { id: 'medal_arquitecto_tiers', requisito: { tipo: 'tiers', valor: 5 } },
  { id: 'medal_encuestador', requisito: { tipo: 'encuestas', valor: 10 } },
  { id: 'medal_memes', requisito: { tipo: 'visuales', valor: 10 } },
  { id: 'medal_rey_ranking', requisito: { tipo: 'tiersPopulares', valor: 1 } },
  { id: 'medal_perfil_leyenda', requisito: { tipo: 'perfilCustom', valor: 1 } },
  { id: 'medal_puentes', requisito: { tipo: 'clubes', valor: 5 } },
  { id: 'medal_maestro_manga', requisito: { tipo: 'hilosTopico', topico: 'manga', valor: 10 } },
  { id: 'medal_recomendador', requisito: { tipo: 'hilosTopico', topico: 'recomendacion', valor: 10 } },
  { id: 'medal_teorico', requisito: { tipo: 'hilosTopico', topico: 'teoria', valor: 5 } },
  { id: 'medal_explorador_generos', requisito: { tipo: 'topicosDistintos', valor: 5 } },
  { id: 'medal_cazador_referencias', requisito: { tipo: 'trivias', valor: 5 } },
];

/** Datos calculados del documento, no de `stats` (ver tipos arriba). */
export interface ExtraMedallas {
  /** Días desde `createdAt`. 0 si no hay fecha fiable. */
  antiguedadDias: number;
  /** Nombre, bio y avatar no vacíos. */
  perfilCompleto: boolean;
  /**
   * Personalización equipada: marco distinto de ninguno, alguna
   * decoración, vitrinas distintas de las de defecto
   * (`logros,destacadas`) o insignias visibles elegidas. Mismo
   * criterio que el cliente en `services/gamification.ts`.
   */
  perfilCustom: boolean;
}

export const EXTRA_VACIO: ExtraMedallas = {
  antiguedadDias: 0,
  perfilCompleto: false,
  perfilCustom: false,
};

/** ¿Tiene este documento personalización equipada? (criterio compartido). */
export function tieneCustom(data: {
  avatarFrame?: unknown;
  decorations?: unknown;
  showcases?: unknown;
  visibleBadgeIds?: unknown;
}): boolean {
  if (typeof data.avatarFrame === 'string' && data.avatarFrame !== '' && data.avatarFrame !== 'ninguno')
    return true;
  if (Array.isArray(data.decorations) && data.decorations.length > 0) return true;
  if (
    Array.isArray(data.showcases) &&
    (data.showcases.length !== 2 || data.showcases.join(',') !== 'logros,destacadas')
  )
    return true;
  if (data.visibleBadgeIds !== null && data.visibleBadgeIds !== undefined) return true;
  return false;
}

/** ¿Se cumple este requisito con las estadísticas de este usuario? */
export function cumpleRequisito(
  req: Requisito | null,
  stats: Estadisticas,
  nivel: number,
  animeMedallas: Record<string, string>,
  xp: number,
  extra: ExtraMedallas = EXTRA_VACIO,
): boolean {
  if (!req) return false; // Las medallas manuales no se conceden solas.

  switch (req.tipo) {
    case 'hilos':
      return stats.threadsCreated >= req.valor;
    case 'comentarios':
      return stats.commentsCreated >= req.valor;
    case 'debates':
      return stats.commentsInThreads >= req.valor;
    case 'likes':
      return stats.likesReceived >= req.valor;
    case 'nivel':
      return nivel >= req.valor;
    // XP total del documento, no un contador: ya viene calculado
    // por quien llama, que es quien acaba de escribirlo.
    case 'xp':
      return xp >= req.valor;
    // Series distintas con actividad: claves de animeXp con algo
    // mayor que cero. Es "en cuántos animes has participado".
    case 'seriesDiferentes':
      return Object.values(stats.animeXp).filter((v) => num(v) > 0).length >= req.valor;
    case 'xpEnAnime': {
      // El id del anime se resuelve desde la configuracion, porque
      // el catalogo lo escribe con un marcador de texto.
      const animeId = animeMedallas[req.animeId] ?? req.animeId;
      if (animeId.startsWith('CONFIGURAR_')) return false;
      return num(stats.animeXp[animeId]) >= req.valor;
    }
    // Comunidad. Es el MAXIMO de seguidores que ha tenido, asi que
    // la medalla se queda aunque la persona deje de seguirle.
    case 'seguidores':
      return stats.followersReceived >= req.valor;
    // ── Trivia diaria ─────────────────────────────────
    //
    // Se leen de contadores que solo escribe esta misma función al
    // corregir un resultado, así que no hay forma de que el cliente
    // se los suba: se ganan jugando.
    case 'trivias':
      return stats.triviaCompleted >= req.valor;
    case 'aciertosTrivia':
      return stats.triviaCorrect >= req.valor;
    case 'triviasPerfectas':
      return stats.triviaPerfect >= req.valor;
    case 'rachaTrivia':
      return stats.triviaStreakBest >= req.valor;
    case 'dias':
      return stats.diasActivosTotal >= req.valor;
    case 'clubes':
      return tamanoMapa(stats.clubesUnidos) >= req.valor;
    case 'clubesCreados':
      return tamanoMapa(stats.clubesCreados) >= req.valor;
    case 'canales':
      return tamanoMapa(stats.canalesCreados) >= req.valor;
    case 'chats':
      return tamanoMapa(stats.chatsPropios) >= req.valor;
    case 'tiers':
      return tamanoMapa(stats.tiersCreadas) >= req.valor;
    case 'encuestas':
      return tamanoMapa(stats.encuestasCreadas) >= req.valor;
    case 'visuales':
      return tamanoMapa(stats.visualesIds) >= req.valor;
    case 'tiersPopulares':
      return tamanoMapa(stats.tiersPopularesIds) >= req.valor;
    case 'hilosTopico':
      return hilosEnTopico(stats, req.topico) >= req.valor;
    case 'topicosDistintos':
      return topicosDistintos(stats) >= req.valor;
    case 'antiguedadDias':
      return extra.antiguedadDias >= req.valor;
    case 'perfilCompleto':
      return extra.perfilCompleto;
    case 'perfilCustom':
      return extra.perfilCustom;
    default:
      return false;
  }
}

/**
 * Que medallas faltan y ya se cumplen.
 *
 * Devuelve solo las NUEVAS: las que ya estaban no se vuelven a
 * escribir, para no tocar la fecha de desbloqueo.
 */
export function medallasNuevas(
  stats: Estadisticas,
  nivel: number,
  yaDesbloqueadas: Record<string, unknown>,
  animeMedallas: Record<string, string>,
  xp: number,
  extra: ExtraMedallas = EXTRA_VACIO,
): string[] {
  return MEDALLAS.filter((m) => {
    if (yaDesbloqueadas[m.id]) return false;
    return cumpleRequisito(m.requisito, stats, nivel, animeMedallas, xp, extra);
  }).map((m) => m.id);
}
