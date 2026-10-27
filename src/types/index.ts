import type { Timestamp } from 'firebase/firestore';

import type { ImageCropSettings } from '../services/imageCrop';
import type {
  Decoracion,
  FondoPerfil,
  PersonajeFavorito,
  TipoVitrina,
} from '../data/profileCustomization';
import type { AparienciaChat, FondoChat } from '../data/chatApariencia';

export type UserRole = 'user' | 'moderator' | 'admin';

// ======================================================
// REACCIONES MÚLTIPLES
// ======================================================
//
// El "Me gusta" de siempre NO se toca: sigue viviendo en
// `likedBy`/`likesCount` de cada documento, con su propio botón y
// su propio contador. Las reacciones son un sistema NUEVO y
// paralelo, para que los "me gusta" que ya tienen miles de
// personas no se pierdan al migrarlos.
//
// Cada reacción es un documento suelto en la colección
// `reactions`, con un id DETERMINISTA que se compone del
// objetivo y de quien reacciona (`reac_<tipo>_<id>_<uid>`). Eso
// es lo que hace imposible tener dos reacciones del mismo tipo a
// la vez, y que cambiar de 🔥 a 😂 sea el mismo documento
// editado en vez de uno nuevo creado.
//
// Los contadores agregados (`reactionCounts` en el hilo o el
// comentario) los escribe SOLO la Cloud Function, con el Admin
// SDK. El cliente nunca los toca: las reglas de Firestore lo
// prohíben.

/**
 * Clave de una reacción: NO es el emoji, sino su nombre en el
 * catálogo (`fire`, `heart`, `thumbs_up`...).
 *
 * Se guarda la clave y no el emoji por dos razones: el texto
 * plano depende de la fuente de cada sistema y ocupa cuatro
 * bytes, y una lista de doscientos emojis en las reglas de
 * seguridad sería ilegible. El catálogo está en
 * `src/data/emojis.ts`; las reglas solo comprueban el formato
 * (`^[a-z0-9_]{1,24}$`), que es lo único que pueden saber.
 *
 * Antes eran cinco valores fijos; ahora es una clave del
 * catálogo, así que añadir una reacción es añadir un emoji.
 */
export type ReactionType = string;

/** Qué se puede reaccionar: hilos, comentarios y mensajes de chat. */
export type ReactionTargetType = 'thread' | 'comment' | 'chat_message';

/** Recuento por reacción: clave → número de personas. */
export type ReactionCounts = Record<string, number>;

/** Un documento de la colección `reactions`. */
export interface UserReaction {
  userId: string;
  targetType: ReactionTargetType;
  targetId: string;
  type: ReactionType;
  /** Nombre con el que reaccionó, para poder listar quién lo usó. */
  userName?: string;
  /**
   * Solo para `targetType: 'chat_message'`: en qué chat está el
   * mensaje. Es OBLIGATORIO en las escrituras nuevas. Sin esto, las
   * reglas no pueden comprobar que quien lee o reacciona sea miembro
   * de ese chat ni que el mensaje exista.
   *
   * Queda opcional en el tipo porque puede haber documentos antiguos
   * sin el campo; esos documentos no se leen hasta pasar por
   * `scripts/migrar-reacciones-chat.mjs`. No se borran: se completan
   * con el chat que se pueda demostrar por la ruta del mensaje.
   */
  chatId?: string;
  /** Texto ISO: `withId` convierte los Timestamp de la interfaz. */
  createdAt: string;
}

// ======================================================
// ENCUESTAS
// ======================================================
//
// La CONFIGURACIÓN de la encuesta vive dentro del propio hilo
// (`threads/{id}.poll`), sin contadores: solo lo que escribió el
// autor al publicarlo. El autoincremento de los votos no puede
// vivir ahí, porque las reglas de Firestore no saben comprobar
// que el número enviado corresponda con el voto que se está
// creando.
//
// Los votos van en `threads/{id}/pollVotes/{uid}`: un documento
// por persona, y como el id es el uid, las reglas SOLO permiten
// crearlo una vez. El voto es PRIVADO: solo lo lee quien votó y
// nadie puede listar la subcolección.
//
// El resumen agregado (`pollStats/{threadId}`) lo escribe la
// Cloud Function y es la fuente de resultados de la tarjeta y del
// panel. En los chats el resumen vive en
// `chats/{chatId}/messages/{messageId}/pollStats/summary`.

export interface PollOption {
  /**
   * Id estable de la opción (`o1`, `o2`...).
   *
   * Lo compone el cliente al crear la encuesta y no cambia
   * nunca: los votos guardan este id, no el texto, para que
   * reordenar o retocar las opciones no rompa lo ya votado.
   */
  id: string;
  text: string;
}

export interface Poll {
  question: string;
  /**
   * Las opciones, como MAPA id → texto, y no como lista.
   *
   * No es una manía del orden: es lo único que las reglas de
   * Firestore saben comprobar. Con una lista, el cliente
   * tendría que escribir el número de votos de cada opción (y las
   * reglas no pueden contrastarlo con el voto que se está
   * creando), mientras que con un mapa el servidor sí puede
   * exigir que el id exista:
   * `request.resource.data.optionId in poll.options`.
   *
   * La interfaz lo convierte en lista con `opcionesDePoll`, que
   * las ordena por número (`o2` antes que `o10`).
   */
  options: Record<string, string>;
  /** Cuándo se cierra sola. `null` = sin fecha. */
  expiresAt: Timestamp | null;
  /** Cerrada a mano por el autor o por el equipo. */
  isClosed: boolean;
  /** Si es `true`, quien ya votó puede cambiar de opción. */
  allowChangeVote: boolean;
}

/** Borrador de encuesta que envía el formulario de "Publicar Nuevo Hilo". */
export interface NewPollInput {
  question: string;
  options: string[];
  /** Duración elegida en el formulario: 1h, 12h, 1d, 3d, 7d o "sin límite". */
  duration?: string;
  allowChangeVote: boolean;
}

/**
 * Resumen de votos que calcula el servidor.
 *
 * Hilos: `pollStats/{threadId}`.
 * Chats: `chats/{chatId}/messages/{messageId}/pollStats/summary`.
 */
export interface PollSummary {
  id?: string;
  /** id de opción → votos. */
  options: Record<string, number>;
  totalVotes: number;
  actualizadoAt?: string;
}

// ======================================================
// TIER LISTS
// ======================================================
//
// Una clasificación visual por niveles (S/A/B/C/D/F...). Vive
// en `tierlists/{id}` y se comparte en hilos (campo `tierList`
// del thread) y en chats (campo `tierList` del mensaje). Los
// votos van en `tierlists/{id}/votes/{uid}`, un documento por
// persona, igual que las encuestas: sin contadores que el
// cliente pueda mentir.
//
// Los elementos reutilizan imágenes del catálogo (con `ref` a
// su ficha) o subidas propias (solo URL, el archivo sigue en
// Storage). Nunca se guarda Base64 en Firestore.

/** Un nivel de la clasificación (fila S, A, B...). */
export interface TierRow {
  /** Id estable (`t1`, `t2`...). Lo compone el cliente al crear. */
  id: string;
  /** Nombre visible. */
  label: string;
  /** Color de la etiqueta (hex, p. ej. `#ff7f7f`). */
  color: string;
  /** Posición en la lista (menor = más arriba). */
  order: number;
}

/**
 * Niveles como MAPA id → definición, y no como lista.
 *
 * Igual que las opciones de las encuestas: es lo único que
 * las reglas de Firestore saben comprobar. Con un mapa, el
 * servidor exige que un voto vaya a un nivel que existe de
 * verdad (`tierId in tiers`); con una lista no podría.
 */
export type TierRowMap = Record<string, { label: string; color: string; order: number }>;

/** Un elemento clasificable (personaje, anime, opening...). */
export interface TierItem {
  /** Id estable dentro de la tier list. */
  id: string;
  /** Nombre visible. */
  name: string;
  /** Imagen del elemento (catálogo o subida propia). */
  imageUrl: string;
  /** Dimensiones para reservar sitio sin saltos (si se conocen). */
  width?: number;
  height?: number;
  /**
   * Referencia a la ficha del catálogo, si viene de ahí.
   * Evita duplicar datos: la imagen se reutiliza, no se copia.
   */
  ref?: { kind: 'anime' | 'character'; id: string };
}

/**
 * Elementos como MAPA id → definición, por el mismo motivo
 * que los niveles: las reglas no recorren listas.
 */
export type TierItemMap = Record<
  string,
  {
    name: string;
    imageUrl: string;
    width?: number;
    height?: number;
    ref?: { kind: 'anime' | 'character'; id: string };
  }
>;

/** Dónde está cada elemento: id de nivel o `'pool'` (sin clasificar). */
export type TierPlacement = Record<string, string>;

/** Una tier list completa, tal cual vive en Firestore. */
export interface TierList {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  title: string;
  description: string;
  category: ClubCategory;
  /** Niveles (mapa id → definición, ordenados por `order`). */
  tiers: TierRowMap;
  /** Elementos (mapa id → definición). */
  items: TierItemMap;
  placement: TierPlacement;
  /**
   * Orden de los elementos dentro de cada nivel (incluido el
   * pool): nivel → ids en orden. Así reordenar no reescribe
   * los elementos, solo esta lista.
   */
  poolOrder: Record<string, string[]>;
  /** Portada opcional. */
  coverUrl?: string;
  /** Quién puede verla: todos o solo un club. */
  visibility: 'public' | 'club';
  /** Club que puede verla (solo si `visibility` es `club`). */
  clubId?: string;
  /** Votación por nivel favorito. */
  voting: { enabled: boolean; allowChange: boolean };
  /** Tier list de origen, si nació como copia/plantilla. */
  originId?: string;
  originTitle?: string;
  /** Hilo donde se publicó (informativo, si lo hay). */
  threadId?: string;
  createdAt: string;
  updatedAt: string;
}

/** Borrador que envía el editor al guardar. */
export interface NuevoTierList {
  title: string;
  description: string;
  category: ClubCategory;
  tiers: TierRow[];
  items: TierItem[];
  placement: TierPlacement;
  poolOrder: Record<string, string[]>;
  coverUrl?: string;
  visibility: 'public' | 'club';
  clubId?: string;
  voting: { enabled: boolean; allowChange: boolean };
  originId?: string;
  originTitle?: string;
  threadId?: string;
}

/** Voto por nivel favorito. */
export interface TierVote {
  id: string;
  userId: string;
  tierId: string;
}

/** Referencia compacta que viaja en hilos y mensajes. */
export interface TierListRef {
  tierListId: string;
  title: string;
}

// ======================================================
// GIFs EN COMENTARIOS
// ======================================================
//
// NO se sube el archivo a Firebase Storage: se guarda solo la
// información mínima para representarlo (id, URLs y proveedor)
// y el GIF se sigue sirviendo desde el CDN de GIPHY o Tenor, que
// es justo como funcionan sus APIs oficiales.

export type GifProvider = 'giphy' | 'tenor';

export interface GifAttachment {
  provider: GifProvider;
  id: string;
  /** GIF animado a tamaño completo. */
  url: string;
  /** Versión ligera para la vista previa y la cuadrícula. */
  previewUrl: string;
  width?: number;
  height?: number;
  title?: string;
}

/**
 * Ajustes de privacidad de una cuenta, ya leídos con los
 * valores por defecto puesta (ver `readPrivacy` en
 * `services/accountSettings`).
 *
 * En Firestore viven dentro de `userPrivate/{uid}.privacy`, en un
 * mapa. Ese documento solo lo puede leer su dueño (y un admin).
 * El documento público `users/{uid}` solo lleva dos señales
 * mínimas para pintar el perfil de otra persona:
 * `privateProfile` y `activityHidden`.
 *
 * El correo ya no se ofrece como campo opcional: directamente está
 * fuera del documento público (`userPrivate/{uid}.email`), porque
 * las reglas deciden a nivel de documento y no de campo.
 */
export interface PrivacySettings {
  /**
   * 'public' = cualquiera que conozca tu ID puede ver tu perfil y
   * pedirte conversación. 'private' = nadie puede iniciar una
   * conversación nueva contigo (las que ya tienes siguen).
   */
  profileVisibility: 'public' | 'private';
  /** Interruptor fino: recibir solicitudes aunque el perfil sea público. */
  allowChatRequests: boolean;
  /** Mostrar los hilos y comentarios propios en tu perfil. */
  showActivity: boolean;
}

export interface User {
  uid: string;
  /**
   * Correo de la cuenta.
   *
   * Ya NO vive en el documento público `users/{uid}`: se guarda en
   * `userPrivate/{uid}`, que solo pueden leer su dueño y un admin.
   * En el objeto `currentUser` del cliente sí aparece porque se
   * mezcla con los datos privados; el directorio público
   * (`usersList`) no lo trae.
   */
  email?: string;
  username: string;
  displayName: string;
  chatId: string; // e.g. "GK-9482-OTAKU" or uid
  avatarUrl: string;
  bio?: string;
  favoriteAnime?: string;
  role: UserRole;
  createdAt: string;
  lastSeen?: string;
  /**
   * Copia antigua del baneo. Las cuentas nuevas ya no la escriben:
   * la fuente de verdad es `accountRestrictions/{uid}`. Se mantiene
   * solo para leer perfiles que aún no se hayan migrado y para que
   * el propio usuario sepa que está baneado.
   */
  isBanned?: boolean;

  // ── Comunidad (ver `types/follows.ts`) ────────────
  // Los escribe la Cloud Function `onFollowChanged` al contar los
  // documentos de `following`/`followers`. Opcionales porque las
  // cuentas anteriores a los seguimientos no los tienen: se leen
  // como cero, que es lo que significan.
  //
  // El cliente NO puede escribirlos: están en la lista de campos
  // bloqueados del `allow update` de `users/{uid}`, igual que `xp`
  // o `stats`. Si se pudieran, un usuario se pondría 999999
  // seguidores para enseguida las medallas de comunidad.
  followersCount?: number;
  followingCount?: number;

// ── Privacidad (ver `PrivacySettings`) ──────────────
  // Los ajustes reales viven en `userPrivate/{uid}.privacy`, que
  // solo lee su dueño (y un admin). En el documento público solo
  // queda lo imprescindible para pintar el perfil de otra persona:
  //
  //   · privateProfile: true → no mostrar su actividad.
  //   · activityHidden: true → no mostrar hilos/comentarios.
  //
  // Los campos de abajo se conservan porque `currentUser` mezcla el
  // documento privado. `usersList` no los trae.
  profileVisibility?: 'public' | 'private';
  allowChatRequests?: boolean;
  showActivity?: boolean;
  /** Señal pública mínima de que el perfil está en privado. */
  privateProfile?: boolean;
  /** Señal pública de que la actividad está oculta. */
  activityHidden?: boolean;

  /**
   * Región preferida para «Dónde verla», como código ISO en
   * mayúsculas (`ES`, `MX`, `AR`...). Es opcional a propósito:
   * las cuentas anteriores a la disponibilidad regional no la
   * tienen; en ese caso se usa la preferencia local o España.
   *
   * La escribe el propio usuario desde el selector de la wiki y
   * vive en `userPrivate/{uid}`, no en el perfil público: es una
   * preferencia personal, no información que deba ver el resto.
   */
  regionPreferida?: string;

  // ── Encuadre del avatar ──────────────────────────────
  //
  // Cómo se eligió el trozo de la foto que se ve. Lo escribe el
  // editor de recorte y lo puede volver a abrir.
  //
  // Opcional a propósito: las cuentas que ya tienen avatar no lo
  // tienen, y se ven igual. Sin él se usa el recorte por defecto, que
  // es "cubrir la caja centrado", exactamente lo que hacía
  // `object-fit: cover` antes.
  //
  // Son CUATRO NÚMEROS, no una imagen: la foto recortada va a
  // Storage como siempre y aquí solo queda el encuadre. Ver
  // `services/imageCrop.ts`.
  avatarCrop?: ImageCropSettings | null;

  // ── Gamificación (ver `types/gamification.ts`) ──────
  // Los escribe la Cloud Function con el Admin SDK. Son
  // opcionales porque el cliente los LEE y las cuentas que ya
  // existían no los tienen: se leen como cero o como lista
  // vacía, que es lo que deben mostrar.
  //
  // El cliente no puede escribirlos: lo prohíben las reglas de
  // Firestore, y lo único que escribe el usuario de este bloque es
  // `equippedTitle`.
  xp?: number;
  level?: number;
  /**
   * Marcadores que escribe la Cloud Function. Ver
   * `services/gamification.ts` para la lista completa y qué
   * cuenta cada uno.
   *
   * Va declarado aquí, y no solo en `ProgresoCrudo`, porque el
   * perfil lo lee del DIRECTORIO de usuarios (`usersList`), que
   * viene entero con un solo listener: así el perfil de otra
   * persona enseña sus mismas estadísticas sin montar un
   * `ProgressionProvider` anidado ni hacer una lectura por
   * persona visitada.
   *
   * Todo el bloque es opcional: las cuentas anteriores a la
   * gamificación no lo tienen y se leen como cero, que es lo que
   * deben mostrar.
   */
  stats?: {
    threadsCreated?: number;
    commentsCreated?: number;
    commentsInThreads?: number;
    likesReceived?: number;
    triviaCompleted?: number;
    triviaCorrect?: number;
    triviaPerfect?: number;
    triviaStreakBest?: number;
    /** Seguidores acumulados. Es un máximo histórico, no el actual. */
    followersReceived?: number;
    /** XP por serie: id de anime → XP. */
    animeXp?: Record<string, number>;
  };

  /** Última subida de nivel. ISO. Escrito por la Cloud Function. */
  lastLevelUpAt?: string | null;
  /** A qué nivel se subió entonces. */
  lastLevelUpLevel?: number | null;

  /** Medallas desbloqueadas: id de medalla → fecha ISO. */
  medals?: Record<string, string>;
  /** Id de la medalla cuyo título lleva puesto. */
  equippedTitle?: string | null;

  // ── Personalizacion del perfil (ver `data/profileCustomization.ts`) ──
  //
  // Todo opcional: las cuentas anteriores a esta funcion no los
  // tienen y se leen con los valores por defecto del modulo de
  // personalizacion (banner y color de la casa, sin marco, sin
  // personaje, todas las insignias y sin destacados).
  //
  // El cliente SI puede escribirlos (son cosmetica propia); lo que
  // NO puede tocar sigue bloqueado en `firestore.rules` (xp,
  // level, medals, stats, role...). Los desbloqueos NO se guardan:
  // se derivan del nivel y de las medallas, que son del servidor.
  /** Banner: '' (defecto), 'preset:<id>' o URL https subida. */
  bannerUrl?: string;
  /** Color de perfil: uno de los hex de `COLORES_PERFIL`. */
  profileColor?: string;
  /** Marco del avatar: id de `MARCOS_AVATAR` o null. */
  avatarFrame?: string | null;
  /** Personaje favorito, con su imagen. */
  favoriteCharacter?: { name: string; imageUrl: string; desc?: string } | null;
  /** Personajes de la vitrina (nombre, imagen y serie opcional). */
  favoriteCharacters?: PersonajeFavorito[];
  /** Medallas a la vista. `undefined` o `null` = todas. `[]` = ninguna. */
  visibleBadgeIds?: string[] | null;
  /** Hilos fijados, en orden. Vacio o ausente = ninguno. */
  featuredPostIds?: string[];
  /**
   * Fondo de la página: preset de `BANNERS_PERFIL` o URL propia,
   * con posición y oscurecido. Ausente = fondo del sitio.
   */
  profileBackground?: FondoPerfil | null;
  /** Decoraciones colocadas sobre la cabecera (x/y en %). */
  decorations?: Decoracion[];
  /** Vitrinas activas, en orden. Ausente = logros + destacadas. */
  showcases?: TipoVitrina[];
  /**
   * Apariencia del chat (ver `data/chatApariencia.ts`).
   *
   * Solo la ve quien la pone: cada usuario pinta SU conversación
   * con sus colores. Ausente = tema oscuro de la casa.
   */
  chatApariencia?: AparienciaChat | null;
}

/**
 * Documento privado de una cuenta: `userPrivate/{uid}`.
 *
 * No es una subcolección de `users/{uid}` a propósito. El panel de
 * administración necesita listar los correos de todos los usuarios
 * de una sola consulta, y una subcolección obligaría a un
 * `collectionGroup` con índices y reglas más frágiles. Al ser una
 * colección plana, el dueño lee su documento y un admin puede
 * listarlos; nadie más.
 *
 * Lo que NO va aquí: `isBanned`. La fuente de verdad de las
 * sanciones es `accountRestrictions/{uid}`, que ya existe y
 * sobrevive a borrar el perfil.
 */
export interface UserPrivateData {
  email?: string;
  privacy?: Partial<PrivacySettings>;
  chatApariencia?: AparienciaChat | null;
  regionPreferida?: string;
  updatedAt?: Timestamp;
}

/**
 * Plataforma antigua de la ficha (`animes/{id}.streaming`).
 *
 * Se conserva tal cual para no romper el catálogo anterior. NO se
 * interpreta como disponibilidad confirmada: una entrada antigua
 * no tiene país (o su `regions` es solo una pista) y en la wiki se
 * muestra como «Sin verificar» hasta que exista una fila regional
 * en `streamingAvailability`.
 */
export interface StreamingService {
  name: string;
  url: string;
  badgeColor?: string;
  /** Pista antigua de región. No confirma disponibilidad. */
  regions?: string[];
}

/** Estado de una obra en una plataforma para una región concreta. */
export type StreamingAvailabilityStatus = 'available' | 'unavailable' | 'unverified';

/** Cómo se accede al contenido cuando se conoce. */
export type StreamingAccessType =
  | 'subscription'
  | 'rental'
  | 'purchase'
  | 'free_ads'
  | 'unknown';

/**
 * Catálogo de plataformas reutilizable.
 *
 * Vive en `streamingPlatforms/{platformId}`. La disponibilidad
 * guarda solo el id, no una copia de la plataforma, para que
 * renombrar o cambiar el color se refleje en todas las fichas.
 */
export interface StreamingPlatform {
  id: string;
  name: string;
  badgeColor?: string;
  /** Logotipo opcional. Si falta, la wiki usa la inicial y el color. */
  logoUrl?: string;
  order?: number;
}

/**
 * País o región que se puede elegir en «Dónde verla».
 *
 * Los diez iniciales viven en el código; el panel puede añadir
 * más a `streamingRegions/{code}` sin tocar las fichas.
 */
export interface StreamingRegion {
  code: string;
  name: string;
  order?: number;
}

/**
 * Una fila de disponibilidad regional.
 *
 * El id es determinista: `{animeId}__{platformId}__{region}`. Así
 * no puede haber dos filas para la misma obra, plataforma y país.
 * El campo `animeId` sirve para las series y las películas: las
 * dos viven en la colección `animes`.
 */
export interface StreamingAvailability {
  id: string;
  animeId: string;
  /** Id de `streamingPlatforms`; el nombre y el logo no se copian. */
  platformId: string;
  region: string;
  status: StreamingAvailabilityStatus;
  accessType?: StreamingAccessType;
  /** Enlace regional verificado. Solo se pinta si el estado es «Disponible». */
  url?: string;
  /** Última fecha de verificación, en formato `YYYY-MM-DD`. */
  verifiedAt?: string;
  updatedAt?: string;
}

export interface Episode {
  id: string;
  animeId: string;
  /**
   * Temporada a la que pertenece. Es OPCIONAL a propósito: los
   * episodios que ya existían antes de las temporadas no lo
   * tienen, y siguen(se) mostrando como la temporada 1 del anime.
   * Hacerlo obligatorio habría obligado a migrar el catálogo.
   */
  seasonId?: string;
  number: number;
  title: string;
  romajiTitle?: string;
  description: string;
  thumbnailUrl: string;
  /** A qué parte de la miniatura se ancla el recorte. Ver `Character.imageFocus`. */
  thumbnailFocus?: { x: number; y: number };
  airDate: string;
  duration: string;
  /** Nota del 1 al 10 que pone el equipo, como en el anime. 0 = sin nota. */
  rating?: number;
  likesCount: number;
  likedBy?: string[];
}

/**
 * Una temporada dentro de un anime. Los episodios y los
 * personajes cuelgan de ella con `seasonId`; el anime al que
 * pertenece se sigue sabiendo por `animeId`.
 *
 * LA FICHA ES DE CADA TEMPORADA: la 2 puede tener su propio año,
 * estado, estudio, puntuación, capítulos, portada y banner. Lo
 * único que se comparte entre temporadas son las categorías, los
 * géneros y las plataformas de streaming, que son de la serie
 * entera y viven en el anime.
 *
 * Todos los campos de abajo son opcionales y, cuando faltan, se
 * hereda el valor del anime (ver `fichaDe` en
 * `utils/seasonData.ts`). Eso es lo que hace que un catálogo
 * antiguo, con todo en el anime y sin temporadas, siga
 * enseñándose igual sin tocar un solo documento.
 */
export interface Season {
  id: string;
  animeId: string;
  /** 1, 2, 3... El orden en que se listan y en la wiki. */
  number: number;
  /** Nombre propio de la temporada, si tiene ("Segunda Parte"). */
  title?: string;
  synopsis?: string;
  year?: number;
  status?: 'En emisión' | 'Finalizado' | 'Próximamente';
  /** Ficha técnica. */
  studio?: string;
  rating?: number;
  episodesCount?: number;
  /**
   * Portada vertical PROPIA de la temporada.
   *
   * Antes esto no se enseñaba en ningún sitio: era un dato que se
   * rellenaba en el panel y no se veía. Ahora la wiki lo usa.
   */
  posterUrl: string;
  /**
   * Banner PROPIO de la temporada, horizontal como el del anime.
   *
   * Opcional a propósito: si se deja vacío, la wiki enseña el
   * banner del anime. Una segunda temporada no tiene por qué
   * tener una imagen distinta.
   */
  bannerUrl?: string;
  /** A qué parte de la portada se ancla el recorte. */
  posterFocus?: { x: number; y: number };
  /** A qué parte del banner se ancla el recorte. */
  bannerFocus?: { x: number; y: number };
  createdAt: string;
}

export interface Character {
  id: string;
  animeId: string;
  /**
   * Temporadas en las que sale, si NO es de toda la serie.
   *
   * Un personaje puede estar en varias: Kaguya está en las tres
   * temporadas y repetirla tres veces obligaría a darle imagen,
   * "me gusta" y comentarios distintos en cada copia. Así que el
   * campo es un ARRAY de ids.
   *
   *VACÍO = COMPARTIDO, que sale en todas las temporadas de la
   * wiki, que es lo normal. Solo se rellena para los que no están
   * en todas, como alguien que debuta en la temporada 3.
   */
  seasonIds?: string[];
  /**
   * Campo ANTIGUO, de cuando solo cabía una temporada. Se sigue
   * leyendo para que los personajes que ya había no cambien de
   * golpe (ver `seasonIdsDe`), pero al editar un personaje se
   * borra: a partir de ahí manda "seasonIds".
   */
  seasonId?: string;
  name: string;
  japaneseName?: string;
  /**
   * Nombres alternativos (apodos, romanizaciones) de AniList.
   *
   * OPCIONAL como en Anime: sin ellos se busca por el nombre y
   * el japonés. Los rellena `scripts/rellenar-alias.mjs`.
   */
  aliases?: string[];
  slug: string;
  imageUrl: string;
  /**
   * Punto de la imagen que se ve en el recorte, de 0 a 1.
   *
   * Las fotos de personaje casi nunca vienen cuadradas, y al
   * recortarlas para la tarjeta se perdían la cabeza o el cuerpo.
   * Con esto se elige a qué parte se ancla el recorte, así cada
   * una se ve como toca. Por defecto, el centro.
   */
  imageFocus?: { x: number; y: number };
  description: string;
  role: 'main' | 'supporting' | 'antagonist';
  voiceActor?: string;
  likesCount: number;
  likedBy?: string[];
  tags: string[];
}

export interface Anime {
  id: string;
  slug: string;
  /**
   * Título de la SERIE, no de una temporada. Es lo que usan las
   * tarjetas, el buscador y la URL, que no saben qué temporada se
   * está viendo. El subtítulo de cada una ("Segunda Parte") vive
   * en `Season.title`.
   */
  title: string;
  japaneseTitle?: string;
  /**
   * Sinopsis general de la serie. Cada temporada puede tener la
   * suya, que es la que sale en la wiki al elegirla.
   */
  synopsis: string;
  /**
   * Portada y banner de la SERIE.
   *
   * Son la base que heredan las temporadas que no tengan las
   * suyas propias, y de ellas salen las tarjetas del catálogo. Al
   * guardar la ficha de la temporada 1, sus imágenes se copían
   * aquí (ver `saveSeasonFields`), así que no se quedan
   * desincronizadas.
   */
  coverUrl: string;
  bannerUrl: string;
  /**
   * A qué parte de la portada y del banner se ancla el recorte,
   * de 0 a 1. Ver `Character.imageFocus`.
   *
   * Van separados porque la portada se recorta en un recuadro
   * vertical pequeño y el banner en uno horizontal enorme: lo
   * que funciona para uno no funciona para el otro.
   */
  coverFocus?: { x: number; y: number };
  bannerFocus?: { x: number; y: number };
  /**
   * Año, puntuación, estado y capítulos emitidos de la serie.
   *
   * Igual que las imágenes, son la BASE: los usa el catálogo y los
   * heredan las temporadas que no tengan los suyos.
   */
  year: number;
  rating: number;
  /**
   * Estado de la serie, con la palabra CORTA que espera el filtro
   * del panel ('emitiendo' | 'finished' | 'upcoming'). La
   * temporada usa las largas ('En emisión' | 'Finalizado' |
   * 'Próximamente') y `saveSeasonFields` traduce al copiar.
   *
   * Antes este tipo declaraba las palabras largas, que es lo que
   * se acaba de escribir: mentía sobre lo que hay en Firestore, y
   * por eso el estado se enseñaba tal cual en la wiki ("emitiendo"
   * en minúsculas para la serie, "En emisión" para la T1). Para
   * pintarlo usa `textoEstado` de `utils/seasonData.ts`, que
   * entiende los dos vocabularios.
   */
  status: 'emitiendo' | 'finished' | 'upcoming' | 'En emisión' | 'Finalizado' | 'Próximamente';
  episodesCount: number;
  /**
   * Categoría principal. Se sigue escribiendo para no romper lo
   * que ya había: el filtro del catálogo y las fichas la usan.
   *
   * Para lo nuevo, usar "categories": una serie puede encajar en
   * varias ("Shonen & Acción" y "Seinen & Psicológico"), y forzar
   * a elegir una sola obligaba a que la dejara fuera de la otra.
   */
  category: string;
  /**
   * Títulos alternativos: inglés, romanizado y sinónimos de
   * AniList ("Attack on Titan", "Shingeki no Kyojin"...).
   *
   * OPCIONAL a propósito: los documentos antiguos no lo tienen
   * y la búsqueda los sigue encontrando por el título
   * principal. Los rellena `scripts/rellenar-alias.mjs` desde
   * AniList, sin inventar ninguno.
   */
  alternativeTitles?: string[];
  /**
   * Todas las categorías de la serie. Es opcional a propósito: las
   * que ya estaban en Firestore solo tienen "category".
   *
   * El filtro usa esta lista cuando existe, y "category" cuando no,
   * de forma que las series viejas se sigan viendo en su sitio sin
   * tener que migrar nada.
   */
  categories?: string[];
  genres: string[];
  /** También la base: cada temporada puede tener el suyo. */
  studio: string;
  /**
   * Plataformas de la serie. Compartidas por TODAS las
   * temporadas a propósito: dónde se emite no cambia entre la 1 y
   * la 2, y copiarlo al revés obligaría a duplicar la lista.
   */
  streaming: StreamingService[];
  likesCount: number;
  likedBy?: string[];
  commentsCount: number;
}

export interface Thread {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  title: string;
  body: string;
  categoryId: string;
  categoryName: string;
  tags: string[];
  likesCount: number;
  likedBy: string[];
  commentsCount: number;
  createdAt: string;
  pinned?: boolean;
  /** Imagen adjunta, como máximo una por publicación. */
  imageUrl?: string;
  /**
   * Dimensiones originales de la imagen, en píxeles.
   *
   * Se miden al subir y se guardan para reservar su sitio
   * antes de descargarla (ver `StableImage`): sin ellas, la
   * pantalla salta cuando la foto aparece. El archivo no se
   * toca: sigue siendo el original con toda su calidad.
   *
   * Opcionales porque los hilos antiguos no los tienen; sin
   * ellos la imagen se pinta como antes, con fundido.
   */
  imageWidth?: number;
  imageHeight?: number;
  /**
   * Encuesta opcional. Solo existe si el autor la añadió al
   * publicar. No lleva contadores: los votos viven en la
   * subcolección privada `pollVotes` y los totales en `pollStats`
   * (ver `Poll`).
   */
  poll?: Poll;
  /**
   * Tier list adjunta (solo referencia: vive en su documento).
   * Se pinta dentro del hilo con `TierListCard`.
   */
  tierList?: TierListRef;
  /**
   * Recuento de reacciones. Lo escribe la Cloud Function al
   * leer `reactions`; el cliente solo lo LEE.
   *
   * Los resultados que ve el usuario se calculan con los
   * documentos de `reactions`, que siempre son la verdad; esto
   * es la caché que permite ordenar y sacar estadísticas sin
   * recorrer todas las reacciones.
   */
  reactionCounts?: ReactionCounts;
  /** Suma de `reactionCounts`. También solo lo escribe el servidor. */
  reactionsTotal?: number;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  targetType: 'thread' | 'anime' | 'episode' | 'character';
  targetId: string; // threadId, animeId, episodeId, or characterId
  parentId: string | null;
  body: string;
  likesCount: number;
  likedBy: string[];
  createdAt: string;
  /** Imagen adjunta al comentario. */
  imageUrl?: string;
  /**
   * Dimensiones originales de la imagen, en píxeles.
   *
   * Igual que en los hilos: se miden al subir para reservar
   * el sitio antes de descargar (ver `StableImage`), sin
   * tocar el archivo. Los comentarios antiguos no los tienen.
   */
  imageWidth?: number;
  imageHeight?: number;
  /**
   * GIF adjunto al comentario (como máximo uno).
   *
   * Se guarda junto a la imagen para no reescribir el cuerpo:
   * el texto del comentario sigue siendo texto plano y el GIF
   * se pinta debajo, igual que una foto.
   */
  gif?: GifAttachment;
  /** Recuento de reacciones. Solo lo escribe la Cloud Function. */
  reactionCounts?: ReactionCounts;
  reactionsTotal?: number;
}

/**
 * Ubicación que comparte alguien en un chat.
 *
 * Va como un campo más del mensaje, no como texto. La razón es que un
 * texto con las coordenadas dentro no se puede comprobar: cualquiera
 * podría escribir "estoy en Madrid" o pegar un enlace, y no hay forma
 * de saber si es real. Con el mapa aparte, el botón dibuja una
 * baliza y el enlace se abre en el mapa de verdad.
 *
 * `accuracy` viene en metros y es opcional porque el navegador no
 * siempre lo da: Safari lo omitía y Firefox lo redondea. Sin él se
 * dibuja la baliza sin el círculo de precisión.
 */
export interface LocationAttachment {
  /** Latitud, entre -90 y 90. */
  lat: number;
  /** Longitud, entre -180 y 180. */
  lng: number;
  /** Precisión en metros, si el navegador la dio. */
  accuracy?: number;
  /** Nombre del sitio, si el navegador lo sabe resolver. */
  place?: string;
}

/**
 * A qué mensaje responde otro (cita).
 *
 * Es una foto fija del citado, no un enlace vivo: si el original
 * cambia o se borra, la cita conserva quién lo escribió y qué
 * decía en ese momento. Al pintar, si el citado sigue en la lista
 * y está borrado para todos, se enseña el marcador en su lugar.
 */
export interface ChatReplyTo {
  /** Id del mensaje citado. */
  messageId: string;
  /** Quién lo escribió, tal como se veía al citar. */
  senderName: string;
  /** Fragmento del contenido (o "[Foto]", "GIF", "Ubicación"). */
  snippet: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  body: string;
  createdAt: string;
  /**
   * 'text' | 'image' | 'gif' | 'location' | 'poll' | 'tier' (según lo que lleve adjunto).
   *
   * 'location' se añadió después que los demás, así que los mensajes
   * antiguos no lo tienen. Todo el que lo pinte tiene que tolerar
   * que venga vacío: se comprueba `msg.location` y no `msg.type`.
   * Lo mismo vale para 'poll' (se comprueba `msg.poll`) y para
   * 'tier' (se comprueba `msg.tierList`).
   */
  type: 'text' | 'image' | 'gif' | 'location' | 'poll' | 'tier';
  /**
   * GIF adjunto al mensaje.
   *
   * Igual que en los comentarios: no se sube a Storage, se
   * guarda la ficha (id, URLs y proveedor) y el archivo se sigue
   * sirviendo desde el CDN. Las reglas comprueban que las URLs
   * sean del proveedor.
   */
  gif?: GifAttachment;
  /**
   * Imagen adjunta al mensaje.
   *
   * A diferencia del GIF, esta sí se sube a Storage: es una foto del
   * usuario y no hay de dónde servirla aparte.
   */
  imageUrl?: string;
  /** Ubicación adjunta al mensaje. */
  location?: LocationAttachment;
  /**
   * Encuesta adjunta al mensaje.
   *
   * Es el mismo `Poll` de los hilos (pregunta, opciones como
   * mapa, caducidad y cierre), pero vive dentro del mensaje y
   * sus votos van en `chats/{chatId}/messages/{id}/pollVotes/`.
   * Igual que allí, el voto solo lo lee quien votó y los
   * resultados salen de `pollStats/summary`.
   */
  poll?: Poll;
  /**
   * Tier list adjunta al mensaje (solo referencia: vive en su documento).
   *
   * Se pinta como tarjeta compacta con `ChatTierCard` y se abre
   * en el visor. Como el resto de adjuntos, se comprueba
   * `msg.tierList` y no `msg.type`.
   */
  tierList?: TierListRef;
  /**
   * Cita a otro mensaje (responder).
   *
   * Guarda una FOTO del citado en el momento de responder: quién lo
   * escribió y un fragmento. Si el citado se borra para todos
   * después, al pintarlo se comprueba si sigue en la lista y en ese
   * caso se enseña "eliminado" en vez del fragmento guardado, para
   * no filtrar por la cita lo que el borrado quitó.
   */
  replyTo?: ChatReplyTo;
  /**
   * Cuándo se editó el texto, en ISO. Lo pone el servidor
   * (`editarMensajeChat`). La creación (`createdAt`) no se toca
   * nunca: editar no rejuvenece el mensaje y el plazo de borrado
   * sigue contando desde el envío.
   */
  editedAt?: string;
  /**
   * Borrado para todos (estilo WhatsApp).
   *
   * Es un borrado LÓGICO: el documento sigue existiendo para no
   * romper el orden ni las referencias, pero el contenido
   * (texto, foto, GIF, ubicación) lo vacía el servidor al borrar
   * y aquí solo se pinta "Este mensaje fue eliminado".
   *
   * Solo lo escribe la Cloud Function `eliminarMensajeParaTodos`,
   * que comprueba autoría y plazo. Las reglas no dejan a ningún
   * cliente tocar estos campos.
   */
  deletedForEveryone?: boolean;
  /** Cuándo se borró para todos, en ISO. Lo pone el servidor. */
  deletedAt?: string;
  /** Quién lo borró para todos: siempre coincide con `senderId`. */
  deletedBy?: string;
}

export interface ChatRoom {
  id: string;
  /**
   * 'direct'  → conversación entre dos personas
   * 'group'   → grupo clásico, por código
   * 'club'    → chat grupal de un club. Es un grupo con
   *             ficha propia en `clubs/`: categoría, normas,
   *             roles y solicitudes. Los mensajes se guardan
   *             en la misma subcolección que los demás.
   */
  type: 'direct' | 'group' | 'club';
  name: string; // for group: group name, for direct: name of other participant
  avatar?: string;
  /** Solo en clubes: identificador del club (igual que su slug). */
  slug?: string;
  /** Solo en clubes: categoría del club. */
  category?: ClubCategory;
  /** Solo en clubes: banner de portada. */
  coverUrl?: string;
  ownerId: string;
  memberIds: string[];
  lastMessage?: string;
  lastMessageAt?: string;
  lastMessageSenderId?: string;
  /** uid → fecha ISO hasta la que esa persona ha leído. Vive en el
   *  propio chat para no necesitar una suscripción por conversación. */
  readAt?: Record<string, string>;
  /** uids que han eliminado el chat de su lista. */
  hiddenFor?: string[];
  /** Solo en grupos: código único (GRP-1A2B-3C4D-5E6F) con el que
   *  se pide entrar. El nombre se puede repetir; el código no. */
  code?: string;
  /** uid → fecha ISO. Al "vaciar" la conversación, los mensajes
   *  anteriores a esta fecha dejan de aparecerle a esa persona.
   *  Los mensajes siguen en Firestore, así que los demás los
   *  conservan intactos. */
  clearedAt?: Record<string, string>;
  unreadCount?: number;
}

// ======================================================
// SOLICITUDES DE CONVERSACIÓN
// ======================================================
// El chat no existe hasta que se acepta la solicitud. Así el
// documento de conversación solo está entre personas que ya se
// han aceptado, y no hay conversaciones a medio hacer.

export type ChatRequestType = 'direct' | 'group' | 'invite';
export type ChatRequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface ChatRequest {
  id: string;
  type: ChatRequestType;
  fromId: string;
  fromName: string;
  fromAvatar: string;
  /** Destinatario: la persona (tipo direct) o el dueño del grupo. */
  toId: string;
  /** Nombre y foto del destinatario, para que quien envía la
   *  solicitud sepa a quién se la mandó sin tener que buscarlo. */
  toName?: string;
  toAvatar?: string;
  /** Solo en tipo 'group': el grupo al que se quiere entrar. */
  groupId?: string;
  groupName?: string;
  status: ChatRequestStatus;
  createdAt: string;
  respondedAt?: string;
  /** Chat creado al aceptarse. */
  resultingChatId?: string;
}

/** Ficha de un grupo, obtainable solo con su código. */
export interface GroupListing {
  id: string;
  code: string;
  name: string;
  ownerId: string;
  ownerName: string;
  memberCount: number;
  createdAt: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  animeCount: number;
  threadsCount?: number;
  color: string;
}

export interface TriviaExtra {
  id: string;
  title: string;
  characterOrAnime: string;
  fact: string;
  imageUrl: string;
  category: string;
  likes: number;
  likedBy?: string[];
}

export interface MascotDialogue {
  id: string;
  text: string;
}

export interface SupportTicket {
  id: string;
  trackingId: string;
  userId: string;
  userName: string;
  contactEmail: string;
  category: 'bug' | 'suggestion' | 'account' | 'report';
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
}

// ======================================================
// CONTENIDO EDITABLE DEL SITIO
// ======================================================
// Lo que el admin puede cambiar sin tocar código: el texto de
// bienvenida de la portada y el logo. Se guarda en un único
// documento para no tener una colección entera de ajustes.

export interface SiteSettings {
  /** Parte inicial: "Bienvenido a". */
  welcomeTitle: string;
  /** La parte con color degradado: "geekapoo.com". */
  welcomeHighlight: string;
  /** Párrafo descriptivo bajo el título. */
  welcomeText: string;
  /** Logo del navbar. Si está vacío, se dibuja la "G". */
  logoUrl: string;
  /**
   * Ilustración de la columna izquierda en la página de Soporte.
   * Vacío = no se pinta nada.
   */
  supportArtLeftUrl: string;
  /** Ilustración de la columna derecha en la página de Soporte. */
  supportArtRightUrl: string;
}

// ======================================================
// NOTICIAS
// ======================================================

/**
 * Una noticia de anime, traída de un feed RSS.
 *
 * La escribe la Cloud Function `syncRssNews` y no se toca nunca desde
 * el navegador: las reglas de Firestore no dan ninguna operación de
 * escritura al cliente sobre `news`. Estos tipos son de solo lectura.
 *
 * ── POR QUÉ NO HAY CAMPO DE IMAGEN ─────────────────────────────────
 *
 * Porque el feed no la trae, y `link` con el icono de "leer más" hace
 * el mismo apaño. Poner una imagen inventada o una genérica por cada
 * noticia sería rellenar el hueco con mentira.
 */
export interface NewsItem {
  id: string;
  /** Titular, tal cual lo publica la fuente. Puede estar en inglés. */
  title: string;
  /** Resumen corto, sin HTML y cortado. */
  snippet: string;
  /** Enlace a la noticia original, en la web de la fuente. */
  link: string;
  /** De qué fuente viene: "Anime News Network". */
  sourceName: string;
  /** Fecha de publicación en ISO, para ordenar. */
  pubDate: string;
}

export interface WeeklyWork {
  id: string;
  title: string;
  /** Autor o estudio. */
  author: string;
  synopsis: string;
  imageUrl: string;
  /** Etiqueta corta arriba: "Nº1", "Nuevo", "Top"... */
  badge: string;
  /** Nota del 1 al 10, o 0 si no se quiere mostrar. */
  score: number;
  /** Posición en la lista. Menor número, más arriba. */
  order: number;
  active: boolean;
}

// ======================================================
// CLUBES Y COMUNIDADES
// ======================================================
//
// Los clubes son grupos temáticos con su propio chat grupal.
// Extienden el concepto de "grupo" actual añadiendo:
// - Categorías temáticas
// - Imagen de portada e icono
// - Descripción y normas
// - Tipos de acceso (público, privado, por solicitud)
// - Roles de miembro (propietario, moderador, miembro)
// - Solicitudes de ingreso pendientes

export type ClubCategory =
  | 'anime-manga'
  | 'videojuegos'
  | 'cosplay-fanart'
  | 'cultura-japonesa'
  | 'tecnologia-programacion'
  | 'otros';

export const CLUB_CATEGORIES: { id: ClubCategory; label: string; icon: string }[] = [
  { id: 'anime-manga', label: 'Anime y Manga', icon: '📺' },
  { id: 'videojuegos', label: 'Videojuegos', icon: '🎮' },
  { id: 'cosplay-fanart', label: 'Cosplay y Fanart', icon: '🎭' },
  { id: 'cultura-japonesa', label: 'Cultura Japonesa', icon: '🗾' },
  { id: 'tecnologia-programacion', label: 'Tecnología y Programación', icon: '💻' },
  { id: 'otros', label: 'Otros Intereses Geek', icon: '✨' },
];

export type ClubAccessType = 'public' | 'private' | 'request';

/**
 * Cargo DENTRO de un club.
 *
 * `admin` se añadió con el sistema de moderación. Ojo: la
 * autoridad real está en `ownerId` / `adminIds` / `moderatorIds`
 * (arrays que las reglas pueden comparar). Este tipo describe el
 * reflejo en la ficha de cada miembro, que se escribe en la
 * MISMA operación que los arrays para que no se separen.
 */
export type ClubRole = 'owner' | 'admin' | 'moderator' | 'member';

export interface ClubMember {
  uid: string;
  role: ClubRole;
  joinedAt: string; // ISO timestamp
  mutedUntil?: string; // ISO timestamp, si está silenciado
}

/** Modo de aviso de nuevas conversaciones. */
export type ChatNotifyMode = 'all' | 'mentions' | 'muted';

/** Duración del silencio cuando notify === 'muted'. */
export type ChatMuteUntil = '1h' | '8h' | '24h' | 'until';

/** Ajustes personales que cada participante guarda de un chat. */
export interface ChatPrefs {
  /** Color propio del chat (hex de 7 caracteres). */
  color?: string;
  /** Apodo local que el participante puso al contacto o grupo. */
  nickname?: string;
  /** Política de avisos de nuevas conversaciones. */
  notify?: ChatNotifyMode;
  /** Hasta cuándo está silenciada (solo si notify === 'muted'). */
  muteUntil?: ChatMuteUntil;
  /** Favorito personal: fija la conversación en la parte alta. */
  favorite?: boolean;
  /**
   * Fondo PROPIO de esta conversación.
   *
   * Vive aquí, y no en `userPrivate/{uid}.chatApariencia`, porque
   * ese campo es UNO para toda la cuenta: al guardar un fondo en un
   * club, pisaba el que la persona tenía en sus privados. Al
   * guardarlo por conversación, cada chat tiene el suyo.
   *
   * `null` significa «esta conversación, sin fondo». Si la clave
   * NO está, es que nunca se tocó y se usa el fondo general
   * (el antiguo `chatApariencia.fondo`) como respaldo.
   */
  fondo?: FondoChat | null;
}

/**
 * ══════════════════════════════════════════════════════════
 * MODERACIÓN DE CLUBES
 * ══════════════════════════════════════════════════════════
 *
 * Las sanciones viven en la subcolección `clubs/{clubId}/sanciones/`,
 * un documento por sanción. Se eligió una subcolección y no un
 * campo más en `members[uid]` porque una sanción necesita motivo,
 * quién la puso y cuándo se retiró: metido todo eso en la ficha
 * del miembro, las reglas no podrían distinguir «le han cambiado
 * el silencio» de «le han cambiado el rol» (`affectedKeys()` solo
 * ve la clave de primer nivel del mapa).
 *
 * El club guarda además un índice denormalizado
 * (`sancionesActivas`) porque las reglas sí necesitan comprobar
 * la sanción de una persona concreta en cada envío.
 */

/**
 * Qué se le aplicó a una persona.
 *
 *   · 'silencio'   → no puede escribir en el chat del club.
 *   · 'baneo'      → además sale del club y no puede volver.
 *   · 'advertencia' → solo un AVISO, sin consecuencia: no
 *     bloquea nada, pero queda escrito en el historial del club.
 *     Los moderadores lo usan para avisar sin sanctionar.
 *
 * 'advertencia' solo existe en el HISTORIAL: nunca hay un
 * documento de sanción viva de ese tipo.
 */
export type SancionTipo = 'silencio' | 'baneo' | 'advertencia';

/** Lo que el usuario ve: activa, expirada o retirada a mano. */
export type SancionEstado = 'activa' | 'expirada' | 'retirada';

/**
 * Rango dentro de un club. La autoridad SIEMPRE se lee de
 * `ownerId` / `adminIds` / `moderatorIds`, nunca de `members[uid].role`
 * (que es solo un reflejo para pintar la interfaz).
 */
export type ClubRango = 'owner' | 'admin' | 'moderator' | 'member';

/**
 * Permisos que el propietario puededelegar en los moderadores.
 *
 * Los administradores NO tienen مجموع lo que ven: silenciar y
 * banear siempre. Lo que cambia es hasta dónde llegan.
 */
/**
 * Permisos que el propietario puede DELEGAR dentro de su club.
 *
 * Son los que separan a un administrador de un moderador, y a un
 * moderador de un miembro. Lo que NO está aquí NO se puede
 * delegar nunca: la propiedad, la seguridad, el reparto de roles
 * superiores y el borrado del club son del propietario, y punto.
 *
 * Cada permiso guarda tres cosas:
 *
 *   · Si está en el club, vale lo que vale. Si NO está, se usa
 *     el valor por defecto de `PERMISOS_POR_DEFECTO`. Así un club
 *     antiguo (sin este campo) se comporta igual que antes, y el
 *     propietario puede activar O DESACTIVAR cada cosa: quitar
 *     un permiso es escribirlo en `false`, no borrarlo.
 */
export interface ClubPermisos {
  // ── Moderadores ────────────────────────────────────

  /**
   * Un moderador puede aplicar baneos temporales.
   *
   * Por defecto NO: silenciar sí, banear no. Si lo activa, el
   * baneo TEMPORAL, nunca el permanente.
   */
  moderadorBanea?: boolean;
  /**
   * Un moderador puede levantar sanciones que él NO aplicó.
   *
   * Por defecto NO: siempre puede levantar las suyas.
   */
  moderadorLevanta?: boolean;
  /**
   * Un moderador puede retirar mensajes de otros usuarios.
   *
   * Por defecto SÍ: es lo más básico de la convivencia y ya
   * podía hacerlo. El propietario puede quitárselo.
   */
  moderadorRetiraMensajes?: boolean;
  /**
   * Un moderador puede ADVERTIR a un usuario (un aviso sin
   * sanción, que queda en el historial).
   *
   * Por defecto SÍ.
   */
  moderadorAdvierte?: boolean;
  /**
   * Un moderador puede crear, editar y eliminar canales.
   *
   * Por defecto NO: los canales son configuración del club, y eso
   * es del dueño (o de un admin con el permiso concedido).
   */
  moderadorGestionaCanales?: boolean;
  /**
   * Un moderador puede FIJAR mensajes importantes del chat.
   *
   * Por defecto NO: fijar es cosa del dueño y de los admins. Un
   * moderador puede usarlo si el propietario se lo concede.
   */
  moderadorFijaMensajes?: boolean;

  // ── Administradores ─────────────────────────────────

  /**
   * Un administrador puede aplicar baneos PERMANENTES.
   *
   * Por defecto NO: el baneo permanente es una de las decisiones
   * más graves de un club, y por defecto es solo del propietario.
   */
  adminBaneaPermanente?: boolean;
  /**
   * Un administrador puede editar el aspecto del club: nombre,
   * descripción, icono, banner y normas.
   *
   * Por defecto NO: el contenido del club es del propietario.
   */
  adminEditaAspecto?: boolean;
  /**
   * Un administrador puede crear, editar, ordenar y eliminar
   * canales.
   *
   * Por defecto NO.
   */
  adminGestionaCanales?: boolean;
  /**
   * Un administrador puede levantar sanciones de los moderadores.
   *
   * Por defecto SÍ: para deshacer un exceso hace falta poder
   * hacerlo. NUNCA puede levantar las de otro administrador ni
   * las del propietario: eso es del dueño siempre.
   */
  adminLevanta?: boolean;
  /**
   * Un administrador puede expulsar miembros del club.
   *
   * Por defecto SÍ.
   */
  adminExpulsa?: boolean;
  /**
   * Un administrador puede fijar mensajes importantes.
   *
   * Por defecto SÍ.
   */
  adminFijaMensajes?: boolean;
}

/**
 * Una sanción (silencio o baneo) aplicada a un miembro.
 *
 * El documento es INMUTABLE salvo por los campos de retirada:
 * las reglas solo permiten actualizar `retirada`, `retiradaPor`,
 * `retiradaPorNombre`, `retiradaEn` y `motivoRetirada`, y nunca
 * borrar. Así el historial no se puede reescribir a posteriori.
 */
export interface ClubSancion {
  id: string;
  /** Club al que pertenece. También va en la ruta. */
  clubId: string;
  /** `silencio` o `baneo`. */
  tipo: SancionTipo;
  /** A quién se le aplica. */
  objetivoUid: string;
  /** Nombre del sancionado, para el panel sin tener que buscarlo. */
  objetivoNombre: string;
  /** Motivo obligatorio (1-500 caracteres). Sin motivo no hay sanción. */
  motivo: string;
  /** Inicio en ISO. */
  inicio: string;
  /** Fin en ISO. `null` = permanente (solo baneo). */
  fin: string | null;
  /** Un baneo sin fecha de fin. */
  permanente: boolean;
  /** Quién la aplicó. */
  aplicadaPor: string;
  /** Nombre de quien la aplicó (foto fija, como en los mensajes). */
  aplicadaPorNombre: string;
  /** Rango de quien la aplicó, para no permitir retirarla si no puede. */
  aplicadaPorRango: ClubRango;
  /** Retirada a mano antes de tiempo. */
  retirada: boolean;
  retiradaPor?: string;
  retiradaPorNombre?: string;
  /** Cuándo se retiró (ISO). */
  retiradaEn?: string;
  /** Por qué se retiró, si el que la levantó da un motivo. */
  motivoRetirada?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Documento de sanción VIGENTE: `clubs/{clubId}/sancion/{uid}`.
 *
 * El id es el uid de la persona sancionada, y por eso el
 * bloqueo se puede comprobar en las reglas: siempre se pregunta
 * por la persona que escribe, y esa ruta es conocida. Un
 * documento se BORRA al levantar la sanción; el historial
 * completo está aparte, en `sanciones/`.
 */
export interface ClubSancionVigente {
  clubId: string;
  tipo: SancionTipo;
  objetivoUid: string;
  objetivoNombre: string;
  motivo: string;
  /** ISO. */
  inicio: string;
  /**
   * Cuándo termina, como Timestamp de Firestore (NO texto ISO):
   * es contra `request.time` con lo que lo comparan las reglas.
   * `null` = permanente.
   */
  expira: Timestamp | null;
  permanente: boolean;
  aplicadaPor: string;
  aplicadaPorNombre: string;
  aplicadaPorRango: ClubRango;
}

/**
 * Entrada del registro de auditoría (`clubs/{clubId}/moderacion/`).
 *
 * SOLO se crea, nunca se edita ni se borra (`allow update, delete:
 * if false`): es la traza que el propietario consulta si hay una
 * disputa entre miembros.
 */
export interface ClubModeracionEvento {
  id: string;
  clubId: string;
  /** Qué pasó: `silencio`, `baneo`, `retirada` o `rol`. */
  accion: 'silencio' | 'baneo' | 'retirada' | 'rol';
  /** A quién se le aplicó (o a quién se le cambió el rol). */
  objetivoUid: string;
  objetivoNombre: string;
  /** Quién lo hizo. */
  actorId: string;
  actorNombre: string;
  /** Rango de quien lo hizo, para el panel. */
  actorRango: ClubRango;
  motivo: string;
  /** ISO. `null` si es permanente. */
  fin: string | null;
  createdAt: string;
}

export interface Club {
  id: string;
  /** Identificador único para URLs (slug). */
  slug: string;
  name: string;
  description: string;
  category: ClubCategory;
  /** URL de la imagen de portada (banner horizontal). */
  coverUrl?: string;
  /** URL del icono del club (avatar cuadrado). */
  iconUrl?: string;
  /** Normas de convivencia del club. */
  rules?: string;
  /** Tipo de acceso al club. */
  accessType: ClubAccessType;
  /** Propietario del club (creador). */
  ownerId: string;
  /**
   * Moderadores del club (además del propietario).
   *
   * Vive como array de primer nivel, y no solo dentro de
   * `members[uid].role`, porque las reglas de Firestore
   * pueden comparar arrays enteros pero no recorrer un mapa
   * clave a clave: así se puede impedir que un moderador
   * ascienda a alguien (o se ascienda a sí mismo) sin
   * depender de que nadie toque la ficha de otro.
   *
   * El campo `members[uid].role` se mantiene como reflejo
   * para mostrar el rol en la interfaz, pero la autoridad
   * (reglas) se lee de aquí y de `ownerId`.
   */
  moderatorIds: string[];
  /**
   * Administradores del club.
   *
   * Mismo criterio que `moderatorIds`: un array de primer nivel
   * para que las reglas puedan comparar la jerarquía (dueño >
   * admin > moderador > miembro) sin recorrer el mapa de
   * miembros. Solo el propietario puede tocarlo.
   *
   * Opcional a propósito: los clubes creados antes de este
   * sistema no lo tienen, y todos los lectores usan `?? []`.
   */
  adminIds?: string[];
  /**
   * Permisos que el propietario concede a los moderadores.
   *
   * Solo guardan lo que NO viene por defecto, así un club
   * antiguo sin este campo se comporta igual que antes.
   */
  permisos?: ClubPermisos;
  /** Mapa de miembros: uid -> ClubMember. */
  members: Record<string, ClubMember>;
  /** Contador de miembros (desnormalizado para consultas rápidas). */
  memberCount: number;
  /**
   * Chat grupal principal del club (id en chats/).
   *
   * Es el chat HISTÓRICO: con canales, equivale al canal
   * `general` (la migración lo reutiliza para no perder
   * mensajes). Los demás canales tienen su propio `chatId`
   * en su ficha (`clubs/{id}/channels/`).
   */
  chatId: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface ClubRequest {
  id: string;
  clubId: string;
  clubName: string;
  clubSlug: string;
  fromId: string;
  fromName: string;
  fromAvatar: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: string;
  respondedAt?: string;
  respondedBy?: string;
}

export interface ClubListing {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: ClubCategory;
  coverUrl?: string;
  iconUrl?: string;
  accessType: ClubAccessType;
  ownerId: string;
  ownerName: string;
  moderatorIds: string[];
  memberCount: number;
  createdAt: string;
}

/**
 * Quién puede ver un canal (y sus mensajes).
 *
 * - `all`: todos los miembros autorizados del club.
 * - `mods`: solo propietario y moderadores (p. ej. coordinación).
 *
 * La protección es doble: el cliente oculta los `mods` a los
 * miembros normales, y las reglas de Firestore deniegan la
 * lectura del canal y de sus mensajes a quien no corresponda.
 */
export type ClubChannelVisibility = 'all' | 'mods';

/**
 * Un canal temático de un club.
 *
 * Vive en `clubs/{clubId}/channels/{channelId}` y su historial
 * en `chats/{chatId}/messages/`, reutilizando TODA la
 * infraestructura de chats (tiempo real, recibos, sin leer,
 * encuestas, reacciones, moderación).
 *
 * El `id` es un slug estable e INMUTABLE (es el id del
 * documento): renombrar el canal cambia `name`, nunca `id`,
 * para no romper los mensajes ya asociados.
 */
export interface ClubChannel {
  /** Identificador estable (slug). Igual que el id del documento. */
  id: string;
  /** Club al que pertenece. */
  clubId: string;
  /** Chat con el historial: `chats/{chatId}/messages/`. */
  chatId: string;
  /** Nombre visible (`# teorias`). Se puede renombrar. */
  name: string;
  /** Propósito y normas básicas del canal. */
  description: string;
  /** De momento solo hay texto; preparado para más tipos. */
  type: 'text';
  visibility: ClubChannelVisibility;
  /** Si el canal va de spoilers (se avisa en la interfaz). */
  spoiler: boolean;
  /** Posición en la lista (menor = más arriba). */
  order: number;
  /** Uid de quien lo creó (propietario o moderador). */
  createdBy: string;
  /** Fondo compartido del canal (visible para todos los miembros). */
  chatFondo?: {
    preset?: string;
    url?: string;
    position?: 'center' | 'top' | 'bottom';
    dim?: number;
  } | null;
  /**
   * Apariencia COMPLETA compartida del canal.
   *
   * La pone el equipo del club (propietario o moderador) desde el
   * botón «Apariencia» del chat, y la ven TODOS los miembros, no
   * solo quien la guardó. Cuando está presente, manda sobre la
   * apariencia personal de cada uno: en un chat de club el marco
   * es común.
   */
  chatApariencia?: AparienciaChat | null;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/** Datos para crear un canal (el `id`/`chatId` los pone el servicio). */
export interface NuevoCanal {
  name: string;
  /** Identificador interno normalizado (minúsculas, números, guiones). */
  slug: string;
  description: string;
  visibility: ClubChannelVisibility;
  spoiler: boolean;
  order: number;
}
