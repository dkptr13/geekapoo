import {
  MAX_AVATAR_URL,
  MAX_BIO,
  MAX_DISPLAY_NAME,
  MAX_FAVORITE_ANIME,
  type PerfilDatos,
  type PerfilEditable,
  type PerfilEvento,
  type PerfilStats,
  type ValidacionEditable,
} from '../types/profile';
import type { Comment } from '../types';

// ======================================================
// LÓGICA DEL PERFIL (sin Firestore, sin React)
// ======================================================
//
// Separado del componente por el mismo motivo que
// `reactionLogic`, `notificaciones` y `follows`: lo que se puede
// decidir sin red es lo que se puede comprobar en cero segundos
// (`npm run test:logica`), y este archivo es donde viven las
// decisiones que antes estaban incrustadas en `ProfileView`.
//
// Se escribe SIN TILDES a propósito, igual que los otros módulos
// de lógica (`reactionLogic`, `notificaciones`, `follows`), porque
// los comentarios técnicos se leen en cualquier terminal y aquí
// conviven tres flavours de codificación que dan guerra al pegarlos
// en otro fichero.
//
// Los TEXTOS QUE VE EL USUARIO sí llevan tildes: viven en los
// componentes y en los tipos, no aquí.

// ──────────────────────────────────────────────────────────
// ESTADÍSTICAS
// ──────────────────────────────────────────────────────────

/**
 * Suma de reacciones sobre un mapa de recuentos.
 *
 * Se usa `reactionsTotal` cuando existe (es lo que escribe el
 * servidor) y solo se recurre a sumar el mapa cuando no. La razón
 * es que el mapa no siempre está: los hilos y comentarios más
 * antiguos no lo tienen, y sin esta cuenta el perfil de un usuario
 * viejo diría "0 reacciones" teniendo cientos.
 */

// ──────────────────────────────────────────────────────────
// ESTADÍSTICAS
// ──────────────────────────────────────────────────────────

/**
 * Las estadísticas del perfil, de los datos que ya están
 * cargados.
 *
 * Cada campo viene de un sitio y solo de uno:
 *
 *   · hilos, comentarios  → se CUENTAN sobre el contenido del
 *     usuario, no se leen de `stats`. `stats.threadsCreated` es un
 *     contador histórico del servidor y puede estar desfasado
 *     (un hilo borrado por el equipo sigue contado ahí). El perfil
 *     muestra lo que existe ahora, que es lo que el usuario puede
 *     comprobar.
 *   · meGusta  → `stats.likesReceived`, que es lo único que hay.
 *   · reacciones → se SUMAN los `reactionCounts` de su contenido.
 *     Esa suma la hace el servidor y se guarda en el documento de
 *     cada hilo y comentario, así que no cuesta ninguna lectura
 *     nueva.
 *   · xp, medallas → de la gamificación.
 *   · seguidores, seguidos → de `FollowsContext`.
 *   · días → desde `createdAt`.
 */
export function calcularStats(datos: PerfilDatos): PerfilStats {
  const suyos = datos.threads.filter((t) => t.authorId === datos.uid);
  const susComentarios = datos.comments.filter((c) => c.authorId === datos.uid);

  return {
    hilos: suyos.length,
    comentarios: susComentarios.length,
    meGusta: Math.max(0, datos.likesReceived),
    reacciones: reaccionesDe(suyos, susComentarios),
    xp: Math.max(0, datos.xp),
    medallas: Object.keys(datos.medals ?? {}).length,
    seguidores: Math.max(0, datos.followersCount),
    seguidos: Math.max(0, datos.followingCount),
    dias: diasDesde(datos.createdAt),
  };
}

/** Suma de `reactionsTotal` (con `reactionCounts` como plan B). */
function reaccionesDe(
  threads: PerfilDatos['threads'],
  comments: Comment[],
): number {
  const deHilo = threads.reduce(
    (total, t) => total + (t.reactionsTotal ?? sumaDeMapa(t.reactionCounts)),
    0,
  );
  const deComentario = comments.reduce(
    (total, c) => total + (c.reactionsTotal ?? sumaDeMapa(c.reactionCounts)),
    0,
  );
  return deHilo + deComentario;
}

/** Suma los valores de un mapa de recuentos. Ver `reaccionesDe`. */
function sumaDeMapa(mapa: Record<string, number> | undefined): number {
  if (!mapa || typeof mapa !== 'object') return 0;
  return Object.values(mapa).reduce(
    (total, n) => total + (typeof n === 'number' && Number.isFinite(n) ? n : 0),
    0,
  );
}

/** Días transcurridos desde una fecha ISO. 0 si no se puede leer. */
export function diasDesde(fechaIso: string | undefined | null): number {
  const ms = new Date(fechaIso ?? '').getTime();
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return Math.max(0, Math.floor((Date.now() - ms) / 86_400_000));
}

// ──────────────────────────────────────────────────────────
// LA LÍNEA DE TIEMPO
// ──────────────────────────────────────────────────────────

/**
 * La actividad del usuario, de más reciente a más antigua.
 *
 * Se DERIVA de lo que ya hay en Firestore, y no de un registro
 * propio. Es la decisión más importante de este archivo:
 *
 *   · No se añade ninguna escritura a ninguna parte. No hay
 *     colección nueva, ni trigger nuevo, ni campo nuevo. Si mañana
 *     se publica un hilo desde una vía nueva, sale en el perfil
 *     sin tocar nada, porque el perfil lee los hilos.
 *   · No se puede quedar desincronizado con la realidad: la
 *     realidad ES la fuente.
 *
 * Lo que NO tiene es historia completa. De las subidas de nivel
 * solo queda la última (`lastLevelUpAt`, que es un campo único) y
 * de las medallas las fechas sí están (`medals` es un mapa
 * id → fecha). Se muestra lo que hay, y no se rellena lo que no se
 * sabe.
 *
 * @param limite  Cuántos hito devuelve. El perfil pide pocos y
 *                carga más al bajar, porque la lista entera de un
 *                usuario con años de actividad puede tener cientos
 *                de entradas y no caben ni en un modal.
 */
export function lineaDeTiempo(datos: PerfilDatos, limite = 0): PerfilEvento[] {
  const eventos: PerfilEvento[] = [];

  // ── Hilos ──────────────────────────────────────────
  for (const t of datos.threads) {
    if (t.authorId !== datos.uid) continue;
    eventos.push({
      id: `thread_${t.id}`,
      tipo: 'thread',
      texto: 'Publico un hilo',
      detalle: t.title,
      at: t.createdAt,
      irA: { threadId: t.id },
    });
  }

  // ── Comentarios ────────────────────────────────────
  //
  // Solo los que están en un HILO se marcan como navegables: el
  // feed (`HomeFeed`) es el único sitio que sabe abrir un hilo y
  // saltar a un comentario dentro. Los de la wiki no tienen
  // `irA`, y se pin igual.
  for (const c of datos.comments) {
    if (c.authorId !== datos.uid) continue;
    eventos.push({
      id: `comment_${c.id}`,
      tipo: 'comment',
      texto: c.targetType === 'thread' ? 'Comentó en un hilo' : 'Comentó en la wiki',
      detalle: c.body,
      at: c.createdAt,
      irA: c.targetType === 'thread' ? { threadId: c.targetId, commentId: c.id } : null,
    });
  }

  // ── Medallas ──────────────────────────────────────
  //
  // El nombre sale del CATÁLOGO (`medals` solo tiene el id y la
  // fecha). Si el id no está en el catálogo, la medalla se quiitó
  // del catálogo: se enseña el id entre paréntesis en lugar de
  // inventar un nombre, porque un nombre inventado sería una
  // mentira en la vitrina de logros de una persona.
  for (const [id, fecha] of Object.entries(datos.medals ?? {})) {
    const medalla = datos.catalogo.find((m) => m.id === id);
    eventos.push({
      id: `medal_${id}`,
      tipo: 'medal',
      texto: 'Consiguio una medalla',
      detalle: medalla ? medalla.nombre : id,
      at: fecha,
      // Una medalla no lleva a ninguna parte: no hay pagina de
      // "esta medalla", y abrir el perfil de quien la gano desde
      // su propia vitrina no tiene sentido.
      irA: null,
    });
  }

  // ── Subida de nivel ────────────────────────────────
  //
  // Solo la última, y solo si se sabe el nivel. Con
  // `lastLevelUpAt` a secas se pinaria "Subio de nivel" sin decir a
  // cual, que es un dato que no sirve.
  if (datos.lastLevelUpAt && typeof datos.lastLevelUpLevel === 'number') {
    eventos.push({
      id: `level_${datos.lastLevelUpAt}_${datos.lastLevelUpLevel}`,
      tipo: 'level',
      texto: `Subio al nivel ${datos.lastLevelUpLevel}`,
      at: datos.lastLevelUpAt,
      irA: null,
    });
  }

  // De más nuevo a más viejo. El `id` va en el comparador como
  // desempate para que dos eventos del mismo instante no cambien
  // de sitio entre renders (eso hace que la lista "salte" al
  // recargar).
  eventos.sort((a, b) => {
    const dif = new Date(b.at).getTime() - new Date(a.at).getTime();
    if (dif !== 0) return dif;
    return a.id.localeCompare(b.id);
  });

  return limite > 0 ? eventos.slice(0, limite) : eventos;
}

/**
 * Cuántos días lleva un usuario, en texto corto.
 *
 * "un día" en vez de "1 día" no es un detalle de estilo: son tres
 * palabras menos en la tarjeta, que es lo que se lee de un vistazo.
 */
export function textoDias(dias: number): string {
  if (dias <= 0) return 'hoy';
  if (dias === 1) return 'un día';
  if (dias < 30) return `${dias} días`;
  if (dias < 365) {
    const meses = Math.floor(dias / 30);
    return meses === 1 ? 'un mes' : `${meses} meses`;
  }
  const anios = Math.floor(dias / 365);
  return anios === 1 ? 'un año' : `${anios} años`;
}

// ──────────────────────────────────────────────────────────
// VALIDACIÓN DEL FORMULARIO
// ──────────────────────────────────────────────────────────

/**
 * Qué caracteres se admiten en el username.
 *
 * El mismo criterio que usan las reglas de las menciones
 * (`mencionesDe` en `utils/notificaciones.ts`), y por el mismo
 * motivo: si un nombre pudiera llevar un espacio, un "@usuario"
 * con dos palabras se cortaría por la mitad y la mención no
 * llegaría a nadie. Ver `MAX_MENCIONES`.
 */
const USERNAME_VALIDO = /^[A-Za-z0-9._-]{3,24}$/;

/**
 * Valida lo que el usuario quiere guardar.
 *
 * Se valida AQUÍ y no solo en las reglas a propósito. Las reglas
 * de Firestore pueden comprobar longitudes con `size()`, pero no
 * pueden dar un mensaje útil: el error que sale es
 * "permission-denied" y el usuario no entiende qué ha escrito
 * mal. Comprobando antes, el mensaje se puede escribir en humano.
 *
 * La comprobación NO sustituye a las reglas: si alguien falsea
 * la llamada desde la consola, las reglas siguen exigiendo lo
 * suyo. Esto es la capa que da una explicación.
 */
export function validarEditable(
  datos: PerfilEditable,
  contexto: {
    /** `true` si este username ya lo tiene otra cuenta. */
    usernameEnUso?: boolean;
    /** Nombres reservados que no se pueden usar. */
    reservado?: string[];
  } = {},
): ValidacionEditable {
  const errores: ValidacionEditable['errores'] = {};

  const nombre = (datos.displayName ?? '').trim();
  if (!nombre) {
    errores.displayName = 'El nombre no puede estar vacio.';
  } else if (nombre.length > MAX_DISPLAY_NAME) {
    errores.displayName = `Maximo ${MAX_DISPLAY_NAME} caracteres.`;
  }

  const bio = (datos.bio ?? '').trim();
  if (bio.length > MAX_BIO) {
    errores.bio = `La bio puede tener ${MAX_BIO} caracteres como maximo.`;
  }

  const avatar = (datos.avatarUrl ?? '').trim();
  if (avatar) {
    if (avatar.length > MAX_AVATAR_URL) {
      errores.avatarUrl = `La URL del avatar es demasiado larga (maximo ${MAX_AVATAR_URL}).`;
    } else if (!/^https?:\/\//i.test(avatar)) {
      // Solo http(s). Sin esto, un "javascript:alert(...)" en el
      // campo se guardaria y el atributo src lo ejecutaria en
      // algunos navegadores. Firestore no lo comprueba.
      errores.avatarUrl = 'La URL tiene que empezar por http:// o https://';
    }
  }

  const anime = (datos.favoriteAnime ?? '').trim();
  if (anime.length > MAX_FAVORITE_ANIME) {
    errores.favoriteAnime = `Maximo ${MAX_FAVORITE_ANIME} caracteres.`;
  }

  // El username NO se edita desde el perfil (ver `PerfilEditable`),
  // pero se comprueba igual para el registro, que es donde se
  // escribe. Que la función lo mire no cuesta nada y evita tener
  // dos reglas distintas para el mismo campo.
  if (contexto.usernameEnUso) {
    errores.displayName = errores.displayName ?? 'Ese nombre de usuario ya esta en uso.';
  }

  if (contexto.reservado?.some((r) => r.toLowerCase() === nombre.toLowerCase())) {
    errores.displayName = 'Ese nombre esta reservado.';
  }

  return { ok: Object.keys(errores).length === 0, errores };
}

/** Si un username es válido. Para el registro. */
export function usernameEsValido(username: string): boolean {
  return USERNAME_VALIDO.test(username.trim());
}