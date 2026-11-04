import type { Comment, Thread } from './index';
import type { Medal } from './gamification';
import type { ImageCropSettings } from '../services/imageCrop';
import type {
  Decoracion,
  PersonajeFavorito,
  TipoVitrina,
} from '../data/profileCustomization';

// ======================================================
// TIPOS DEL PERFIL
// ======================================================
//
// El perfil ya existía (`components/profile/ProfileView.tsx`) y
// ya tenía casi todos estos datos: el nivel y el XP venían de
// `ProgressionContext`, las medallas de `catalogo`, los seguidores
// de `FollowsContext`, y los hilos y comentarios de
// `CommunityContext`. Lo que se añade aquí son los TIPOS, no
// sistemas nuevos.
//
// Lo importante es que ninguno de estos tipos describe una fuente
// de datos nueva: son las mismas colecciones de siempre, leídas
// para un fin que antes no se leía.

/**
 * Un hito de la línea de tiempo del perfil.
 *
 * Se DERIVA de lo que ya está en Firestore, no de un registro
 * nuevo. Es una decisión con dos caras, y conviene que sea
 * consciente:
 *
 *   · A favor: no hay ninguna escritura nueva, ni colección nueva,
 *     ni trigger nuevo. No se puede quedar a medias ni
 *     desincronizarse con la realidad, porque la realidad ES la
 *     fuente.
 *   · En contra: no se puede inventar historia. Si alguien
 *     escribió un hilo antes de que existiera el perfil, ese hilo
 *     sale (los hilos tienen `createdAt`), pero de sus subidas de
 *     nivel de hace dos años no queda más que `lastLevelUpAt`,
 *     que es la ÚLTIMA, no un historial.
 *
 * Un registro de actividad propio (`users/{uid}/activity`) daría
 * un historial completo, pero exigiría una escritura por cada
 * acción en toda la web y se quedaría corto el día que alguien
 * publicara algo por una vía que no pasara por el registro. Se
 * prefiere lo que no se puede desincronizar.
 */
/**
 * Los tipos de hito que la línea de tiempo sabe construir.
 *
 * NO hay un tipo "follow" (un nuevo seguidor), y es a propósito.
 * Sería el más interesante de todos, pero para construirlo haría
 * falta leer los documentos de `followers/{uid}`, que son los
 * nombres de personas y no llevan fecha dentro: la fecha está en el
 * documento espejo de la otra persona. O sea, un hito de seguidor
 * exigiría N lecturas, una por seguidor, solo para el perfil.
 *
 * Y el dato que ya se enseña está en otro sitio mejor: el número
 * de seguidores, en la cabecera, con su botón para ver QUIÉNES
 * son. Un hito de "X te siguió hace 2 días" sería el mismo dato
 * en peor formato.
 */
export type PerfilEventoTipo = 'thread' | 'comment' | 'medal' | 'level';

export interface PerfilEvento {
  /** Clave estable, para que React no re-monte la fila. */
  id: string;
  tipo: PerfilEventoTipo;
  /** Texto ya redactado: "Publicó un hilo", "Consiguió la medalla X". */
  texto: string;
  /** Texto extra: el título del hilo, el nombre de la medalla. */
  detalle?: string;
  /** Fecha ISO. */
  at: string;
  /**
   * A dónde lleva al pulsar, si lleva a alguna parte.
   *
   * `null` en los hitos que no son navegables (una medalla ya no
   * está en ningún sitio al que ir). Es `null` y no un hilo vacío
   * porque son dos cosas distintas: "no lleva a nada" y "lleva a
   * un sitio que ya no existe".
   */
  irA?: { threadId: string; commentId?: string } | null;
}

/** Las estadísticas del perfil, ya calculadas. */
export interface PerfilStats {
  hilos: number;
  comentarios: number;
  /** "Me gusta" recibidos: `stats.likesReceived`. */
  meGusta: number;
  /** Suma de reacciones en todo su contenido. */
  reacciones: number;
  /** XP total acumulado. */
  xp: number;
  /** Medallas conseguidas. */
  medallas: number;
  /** Seguidores y seguidos, de `FollowsContext`. */
  seguidores: number;
  seguidos: number;
  /**
   * Días desde que se registró. Se cuenta desde `createdAt`, que es
   * un hecho; NO es "días activo" (días en los que hizo algo), que
   * no se puede saber sin un registro de actividad.
   */
  dias: number;
}

/** Los datos crudos que necesita el cálculo, tal y como llegan. */
export interface PerfilDatos {
  uid: string;
  /** Solo los hilos escritos por este perfil. */
  threads: Thread[];
  /** id del hilo → título, para los comentarios que apuntan a un hilo. */
  threadTitles?: Record<string, string>;
  comments: Comment[];
  /** Recuento exacto si viene del servidor; si falta, se usa la lista. */
  commentsTotal?: number;
  /**
   * Reacciones recibidas en todos sus comentarios, si la agregación
   * respondió. Si falta, se suman solo los comentarios cargados.
   */
  commentsReactions?: number | null;
  /** Id de medalla → fecha ISO, tal cual viene en `users/{uid}.medals`. */
  medals: Record<string, string>;
  /**
   * El catálogo de medallas completo, para poder poner nombre a
   * los ids que se han ganado.
   *
   * Es `Medal[]` y no `MedalStatus[]` porque a la línea de tiempo
   * no le hace falta saber si una medalla está conseguida: ya lo
   * sabe, porque sale del mapa `medals`. Solo le hace falta el
   * nombre. Pasarle el catálogo con estado obligaría a este módulo
   * a depender del progreso de alguien.
   */
  catalogo: Medal[];
  xp: number;
  likesReceived: number;
  createdAt: string;
  followersCount: number;
  followingCount: number;
  /** Última subida de nivel conocida. Ver `PerfilEventoTipo`. */
  lastLevelUpAt?: string | null;
  lastLevelUpLevel?: number | null;
}

// ──────────────────────────────────────────────────────────
// EDICIÓN
// ──────────────────────────────────────────────────────────

/**
 * Lo que el usuario puede cambiar de su perfil.
 *
 * Deliberadamente corto. Cada campo de aquí es algo que las reglas
 * de Firestore permiten escribir (`firestore.rules`, el `allow
 * update` de `users/{uid}`) y que además tiene sentido que cambie:
 *
 *   · displayName — el nombre visible, con tildes y espacios.
 *   · bio — la descripción.
 *   · avatarUrl — la URL de la imagen (la imagen vive en Storage).
 *   · favoriteAnime — la serie favorita.
 *   · equippedTitle — el título puesto. OJO: el enunciado pedía
 *     `activeTitle`, pero ese campo YA EXISTE como `equippedTitle`,
 *     con sus reglas (`tituloValido()`), su servicio
 *     (`equiparTitulo`) y su botón en la galería de logros. Crear
 *     `activeTitle` sería tener el título en dos sitios, que es
 *     justo lo que hace que dos valores no cuadren.
 *
 * Lo que NO está, y no se puede añadir: `uid`, `role`, `xp`,
 * `level`, `medals`, `stats`, `followersCount`, `followingCount`.
 * Los bloquean las reglas, no esta interfaz.
 *
 * Los desbloqueos (`unlockedCustomizationIds` que pedía el
 * enunciado) NO existen como campo: se derivan del nivel y de las
 * medallas en `data/profileCustomization.ts`. Guardarlos sería un
 * campo que falsear desde la consola para conseguirlo todo.
 */
export interface PerfilEditable {
  displayName: string;
  bio: string;
  avatarUrl: string;
  /**
   * El encuadre que eligió el usuario con el editor de recorte.
   *
   * Opcional porque las cuentas que ya tenían avatar no lo tienen: se
   * ven igual, con el recorte por defecto.
   *
   * `null` significa "sin encuadre elegido", que NO es lo mismo que
   * "vaciar el ajuste": con `null` el avatar se muestra como siempre,
   * y con un ajuste se reabre el editor donde estaba.
   */
  avatarCrop?: ImageCropSettings | null;
  favoriteAnime: string;
  equippedTitle: string | null;
  /** Banner: '' (defecto), 'preset:<id>' o URL https. */
  bannerUrl: string;
  /** Color de perfil: hex de `COLORES_PERFIL`. */
  profileColor: string;
  /** Marco del avatar: id de `MARCOS_AVATAR` o null. */
  avatarFrame: string | null;
  /** Personaje favorito (nombre + imagen). */
  favoriteCharacterName: string;
  favoriteCharacterImage: string;
  /** Descripción breve del personaje principal. */
  favoriteCharacterDesc: string;
  /** Personajes de la vitrina (nombre, imagen, serie). */
  favoriteCharacters: PersonajeFavorito[];
  /** Medallas a la vista: subset de las desbloqueadas, o null (todas). */
  visibleBadgeIds: string[] | null;
  /** Hilos fijados, en orden. */
  featuredPostIds: string[];
  /** Fondo de página: preset de la galería ('' = ninguno). */
  backgroundPreset: string;
  /** Fondo propio subido (URL https, nivel 3+). */
  backgroundUrl: string;
  /** Posición del fondo propio: center | top | bottom. */
  backgroundPosition: string;
  /** Oscurecido del fondo propio, 0-80. */
  backgroundDim: number;
  /** Decoraciones colocadas (x/y en %, tamaño s/m/l). */
  decorations: Decoracion[];
  /** Vitrinas activas, en orden. */
  showcases: TipoVitrina[];
}

/** Resultado de validar el formulario de edición. */
export interface ValidacionEditable {
  ok: boolean;
  /** Mensajes por campo. Vacío si todo está bien. */
  errores: Partial<Record<keyof PerfilEditable, string>>;
}

// ──────────────────────────────────────────────────────────
// LÍMITES
// ──────────────────────────────────────────────────────────

/**
 * Longitudes máximas.
 *
 * La del avatar NO es un límite de Firestore: el documento entero
 * tiene un tope de 1 MB y una URL ocupa un puñado de bytes. Es un
 * límite de sentido común, para que alguien no pegue una URL de
 * mil caracteres que se rompe al pintar.
 */
export const MAX_BIO = 300;
export const MAX_DISPLAY_NAME = 40;
export const MAX_AVATAR_URL = 500;
export const MAX_FAVORITE_ANIME = 60;

/**
 * Cuántos elementos se pintan de más cada vez que se pulsa "ver
 * más".
 *
 * Es un número de PANTALLA, no de red: los hilos y los comentarios
 * ya están en memoria (`CommunityContext` los trae todos, para el
 * feed), así que aquí no hay ninguna consulta que hacer. Lo que se
 * pagina es lo que se PINTA, que es lo que cuesta en el DOM.
 */
export const PASO_PERFIL = 5;