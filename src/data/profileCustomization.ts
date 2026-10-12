/**
 * Personalización del perfil: catálogo y desbloqueos en un solo sitio.
 *
 * Todo lo que un usuario puede ponerse (colores, banners, marcos)
 * vive aquí, con su nivel mínimo. NADA de esto se guarda como
 * "desbloqueado" en Firestore: el desbloqueo se DERIVA del nivel
 * (que sale del XP, escrito por las Cloud Functions) y de las
 * medallas (también del servidor). Así no hay ningún campo que
 * falsear desde la consola para conseguir algo antes de tiempo, y
 * desbloquear no concede XP porque no escribe nada.
 *
 * Si mañana cambian los niveles o se añaden colores, se toca este
 * fichero y nada más. Las reglas de Firestore (`firestore.rules`,
 * `personalizacionValida()`) solo comprueban FORMATOS (hex de la
 * lista, tamaños, https), no niveles: la lista de valores válidos
 * de aquí es la misma que miran ellas.
 */

export interface ColorPerfil {
  id: string;
  nombre: string;
  /** Hex en minúsculas, tal cual se guarda en `profileColor`. */
  hex: string;
  nivelMinimo: number;
}

export const COLORES_PERFIL: ColorPerfil[] = [
  { id: 'violeta', nombre: 'Violeta Geekapoo', hex: '#8b5cf6', nivelMinimo: 1 },
  { id: 'grafito', nombre: 'Grafito', hex: '#71717a', nivelMinimo: 1 },
  { id: 'cian', nombre: 'Cian Neón', hex: '#22d3ee', nivelMinimo: 1 },
  { id: 'rosa', nombre: 'Rosa Neón', hex: '#ec4899', nivelMinimo: 3 },
  { id: 'ambar', nombre: 'Ámbar', hex: '#f59e0b', nivelMinimo: 3 },
  { id: 'esmeralda', nombre: 'Esmeralda', hex: '#10b981', nivelMinimo: 5 },
  { id: 'carmesi', nombre: 'Carmesí', hex: '#ef4444', nivelMinimo: 8 },
  { id: 'dorado', nombre: 'Dorado Legendario', hex: '#eab308', nivelMinimo: 10 },
];

export const COLOR_POR_DEFECTO = '#8b5cf6';

/** Hex válidos, para validar sin recorrer objetos. */
export const HEXES_VALIDOS: string[] = COLORES_PERFIL.map((c) => c.hex);

export interface BannerPerfil {
  id: string;
  nombre: string;
  nivelMinimo: number;
  /** Fondo CSS del banner (degradado). Sin imágenes: no pesa nada. */
  css: string;
}

export const BANNERS_PERFIL: BannerPerfil[] = [
  {
    id: 'defecto',
    nombre: 'Geekapoo',
    nivelMinimo: 1,
    css: 'radial-gradient(120%_100%_at_50%_0%,rgba(139,92,246,0.35),transparent_70%),linear-gradient(135deg,#18181b,#27272a)',
  },
  {
    id: 'ocaso',
    nombre: 'Ocaso',
    nivelMinimo: 1,
    css: 'linear-gradient(135deg,#3b0764,#9d174d 55%,#431407)',
  },
  {
    id: 'abismo',
    nombre: 'Abismo',
    nivelMinimo: 3,
    css: 'linear-gradient(135deg,#082f49,#155e75 50%,#1e1b4b)',
  },
  {
    id: 'neon',
    nombre: 'Neón',
    nivelMinimo: 5,
    css: 'linear-gradient(135deg,#4c1d95,#db2777 50%,#f59e0b)',
  },
  {
    id: 'cosmos',
    nombre: 'Cosmos',
    nivelMinimo: 8,
    css: 'radial-gradient(80%_90%_at_20%_10%,rgba(34,211,238,0.25),transparent_60%),radial-gradient(80%_90%_at_80%_20%,rgba(236,72,153,0.25),transparent_60%),linear-gradient(135deg,#020617,#0f172a)',
  },
  {
    id: 'leyenda',
    nombre: 'Leyenda',
    nivelMinimo: 10,
    css: 'radial-gradient(100%_100%_at_50%_0%,rgba(234,179,8,0.3),transparent_65%),linear-gradient(135deg,#1c1917,#451a03 55%,#18181b)',
  },
];

export const BANNER_PREDETERMINADO_ID = 'defecto';

/**
 * Nivel desde el que se puede subir un banner propio.
 *
 * La subida va a `community/{uid}/` con `uploadCommunityImage`, la
 * misma carpeta y reglas que los avatares: el GIF animado pasa si
 * es de verdad una imagen (ver `esImagenSegura` en
 * `storage.rules`), así que el "banner animado" no necesita nada
 * especial.
 */
export const BANNER_PROPIO_NIVEL = 3;

/** Prefijo con el que se guarda un banner de la lista. */
export const PREFIJO_BANNER = 'preset:';

export interface MarcoAvatar {
  id: string;
  nombre: string;
  nivelMinimo: number;
  /** Anillo del avatar. Solo CSS, sin imágenes. */
  clase: string;
}

export const MARCOS_AVATAR: MarcoAvatar[] = [
  { id: 'ninguno', nombre: 'Sin marco', nivelMinimo: 1, clase: 'ring-zinc-800' },
  { id: 'neon', nombre: 'Neón', nivelMinimo: 5, clase: 'ring-violet-500/70 shadow-lg shadow-violet-500/30' },
  { id: 'dorado', nombre: 'Dorado', nivelMinimo: 10, clase: 'ring-amber-400/80 shadow-lg shadow-amber-500/30' },
];

export const MARCO_POR_DEFECTO: string | null = null;

/** Los avatares de siempre (antes en `EditProfileModal`). */
export const AVATAR_PRESETS: string[] = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
];

/** Límites. Los mira el editor, la validación y las reglas. */
export const MAX_INSIGNIAS_VISIBLES = 6;
export const MAX_DESTACADAS = 3;
export const MAX_NOMBRE_PERSONAJE = 60;
export const MAX_URL_IMAGEN_PERFIL = 500;

// ──────────────────────────────────────────────────────────
// RESOLUCIÓN (valores guardados → lo que se pinta)
// ──────────────────────────────────────────────────────────
//
// Todo con valores por defecto: una cuenta anterior a esta
// función no tiene ningún campo y se ve como la casa (banner y
// color por defecto, sin marco ni personaje). Si un valor
// guardado ya no existe o aún no está desbloqueado para ese
// nivel, también cae al defecto: nunca se pinta nada roto.

export function colorDePerfil(profileColor: string | undefined, level: number): string {
  const color = COLORES_PERFIL.find((c) => c.hex === (profileColor ?? '').toLowerCase());
  if (!color) return COLOR_POR_DEFECTO;
  if (level < color.nivelMinimo) return COLOR_POR_DEFECTO;
  return color.hex;
}

export type BannerResuelto =
  | { tipo: 'preset'; css: string }
  | { tipo: 'url'; url: string };

export function bannerDePerfil(
  bannerUrl: string | undefined,
  level: number,
): BannerResuelto {
  const porDefecto = BANNERS_PERFIL[0];
  if (!bannerUrl) return { tipo: 'preset', css: porDefecto.css };

  if (bannerUrl.startsWith(PREFIJO_BANNER)) {
    const preset = BANNERS_PERFIL.find(
      (b) => b.id === bannerUrl.slice(PREFIJO_BANNER.length),
    );
    if (!preset || level < preset.nivelMinimo) return { tipo: 'preset', css: porDefecto.css };
    return { tipo: 'preset', css: preset.css };
  }

  if (/^https:\/\//i.test(bannerUrl) && level >= BANNER_PROPIO_NIVEL) {
    return { tipo: 'url', url: bannerUrl };
  }

  return { tipo: 'preset', css: porDefecto.css };
}

export function marcoDeAvatar(avatarFrame: string | null | undefined, level: number): string {
  const base = MARCOS_AVATAR[0].clase;
  if (!avatarFrame) return base;
  const marco = MARCOS_AVATAR.find((m) => m.id === avatarFrame);
  if (!marco || level < marco.nivelMinimo) return base;
  return marco.clase;
}

/** Si un requisito de nivel está cumplido. Para los candados. */
export function desbloqueadoPorNivel(nivelMinimo: number, level: number): boolean {
  return level >= nivelMinimo;
}

/**
 * Arma el fondo tal cual se guarda en Firestore.
 *
 * Solo con claves DEFINIDAS: Firestore rechaza `undefined`
 * dentro de un mapa ("Unsupported field value: undefined"), así
 * que aquí no vale el atajo de `preset: x || undefined`. Sin
 * preset ni URL es null (campo ausente = fondo del sitio).
 */
export function fondoAGuardar(
  preset: string,
  url: string,
  position: string,
  dim: number,
): FondoPerfil | null {
  const p = (preset || '').trim();
  const u = (url || '').trim();
  if (!p && !u) return null;

  const fondo: FondoPerfil = {
    position: position === 'top' || position === 'bottom' ? position : 'center',
    dim: Number.isFinite(dim) ? Math.min(DIM_MAXIMO, Math.max(0, dim)) : 50,
  };
  if (p) fondo.preset = p;
  if (u) fondo.url = u;
  return fondo;
}

// ──────────────────────────────────────────────────────────
// FONDO DE PÁGINA (estilo Steam)
// ──────────────────────────────────────────────────────────
//
// El banner es la tira de la cabecera; el FONDO cubre la zona
// principal del perfil. Reutiliza la misma galería (los presets
// valen para los dos) más los ajustes propios: posición,
// oscurecido y subida personalizada (nivel 3, GIF animado
// incluido si es imagen de verdad).
//
// Se guarda en `profileBackground`: ausente o `preset:ninguno`
// es el fondo del sitio (cuentas antiguas, sin cambios).

export type PosicionFondo = 'center' | 'top' | 'bottom';

export const POSICIONES_FONDO: PosicionFondo[] = ['center', 'top', 'bottom'];

/** Oscurecido 0-80 (para que el texto se lea sobre el fondo). */
export const DIM_MAXIMO = 80;

export const FONDO_PREDETERMINADO_ID = 'ninguno';

export interface FondoPerfil {
  preset?: string;
  url?: string;
  position?: PosicionFondo;
  dim?: number;
}

export type FondoResuelto =
  | { tipo: 'ninguno' }
  | { tipo: 'preset'; css: string }
  | { tipo: 'url'; url: string; position: PosicionFondo; dim: number };

export function fondoDePerfil(
  fondo: FondoPerfil | undefined | null,
  level: number,
): FondoResuelto {
  if (!fondo) return { tipo: 'ninguno' };

  if (fondo.url && /^https:\/\//.test(fondo.url) && level >= BANNER_PROPIO_NIVEL) {
    const dim = typeof fondo.dim === 'number' ? Math.min(DIM_MAXIMO, Math.max(0, fondo.dim)) : 50;
    const position: PosicionFondo = POSICIONES_FONDO.includes(fondo.position as PosicionFondo)
      ? (fondo.position as PosicionFondo)
      : 'center';
    return { tipo: 'url', url: fondo.url, position, dim };
  }

  if (fondo.preset && fondo.preset !== FONDO_PREDETERMINADO_ID) {
    const preset = BANNERS_PERFIL.find((b) => b.id === fondo.preset);
    if (preset && level >= preset.nivelMinimo) return { tipo: 'preset', css: preset.css };
  }

  return { tipo: 'ninguno' };
}

// ──────────────────────────────────────────────────────────
// PEGATINAS Y DECORACIONES
// ──────────────────────────────────────────────────────────
//
// Sin assets nuevos: emoticonos (cero peso), imágenes subidas
// por el usuario e iconos de SUS medallas desbloqueadas (los
// pinta `MedalCard`, aquí solo viaja el id). Nada de HTML ni de
// URLs arbitrarias como decoración: `image` es https validado y
// `medal` tiene que estar desbloqueado de verdad.

export type TipoDecoracion = 'sticker' | 'image' | 'medal';
export type TamanoDecoracion = 's' | 'm' | 'l';

export interface Pegatina {
  id: string;
  emoji: string;
  nombre: string;
  nivelMinimo: number;
}

export const PEGATINAS: Pegatina[] = [
  { id: 'mando', emoji: '🎮', nombre: 'Mando', nivelMinimo: 1 },
  { id: 'marciano', emoji: '👾', nombre: 'Marcianito', nivelMinimo: 1 },
  { id: 'robot', emoji: '🤖', nombre: 'Robot', nivelMinimo: 1 },
  { id: 'dragon', emoji: '🐉', nombre: 'Dragón', nivelMinimo: 3 },
  { id: 'espadas', emoji: '⚔️', nombre: 'Espadas', nivelMinimo: 3 },
  { id: 'cohete', emoji: '🚀', nombre: 'Cohete', nivelMinimo: 5 },
  { id: 'ramen', emoji: '🍜', nombre: 'Ramen', nivelMinimo: 5 },
  { id: 'torii', emoji: '⛩️', nombre: 'Torii', nivelMinimo: 8 },
  { id: 'corona', emoji: '👑', nombre: 'Corona', nivelMinimo: 10 },
];

export const IDS_PEGATINAS: string[] = PEGATINAS.map((p) => p.id);

export interface Decoracion {
  id: string;
  kind: TipoDecoracion;
  /** Pegatina (`id`), imagen (URL https) o medalla (`id`). */
  ref: string;
  /** Posición en % sobre la zona de decoración (cabecera). */
  x: number;
  y: number;
  size: TamanoDecoracion;
}

/** Cuántas decoraciones como máximo (para no tapar el contenido). */
export const MAX_DECORACIONES = 6;

/** Tamaños en px (lado mayor). Con tope: nada tapa la cabecera. */
export const TAMANOS_DECORACION: Record<TamanoDecoracion, number> = { s: 40, m: 64, l: 96 };

/** Posiciones predefinidas (rejilla 3x3) para quien no quiera arrastrar. */
export const POSICIONES_PREDEFINIDAS: Array<{ id: string; nombre: string; x: number; y: number }> = [
  { id: 'sup-izq', nombre: 'Arriba izquierda', x: 6, y: 8 },
  { id: 'sup-cen', nombre: 'Arriba centro', x: 50, y: 8 },
  { id: 'sup-der', nombre: 'Arriba derecha', x: 94, y: 8 },
  { id: 'cen-izq', nombre: 'Centro izquierda', x: 6, y: 50 },
  { id: 'centro', nombre: 'Centro', x: 50, y: 50 },
  { id: 'cen-der', nombre: 'Centro derecha', x: 94, y: 50 },
  { id: 'inf-izq', nombre: 'Abajo izquierda', x: 6, y: 92 },
  { id: 'inf-cen', nombre: 'Abajo centro', x: 50, y: 92 },
  { id: 'inf-der', nombre: 'Abajo derecha', x: 94, y: 92 },
];

export function sujetarDecoracion(d: Decoracion): Decoracion {
  const x = Number.isFinite(d.x) ? Math.min(100, Math.max(0, d.x)) : 50;
  const y = Number.isFinite(d.y) ? Math.min(100, Math.max(0, d.y)) : 50;
  const size: TamanoDecoracion = d.size === 's' || d.size === 'm' || d.size === 'l' ? d.size : 'm';
  return { ...d, x: Math.round(x), y: Math.round(y), size };
}

// ──────────────────────────────────────────────────────────
// VITRINAS (showcases)
// ──────────────────────────────────────────────────────────
//
// Bloques que el dueño añade, ordena y quita. El nivel/XP, las
// estadísticas, la actividad y el contenido propio NO son
// vitrinas: son la identidad fija del perfil (como la cabecera
// fija de Steam) y siempre están. Las vitrinas son el resto.
//
// `showcases` guarda SOLO los ids en orden. Ausente = diseño de
// siempre (logros + destacadas), para no cambiarle el perfil a
// nadie por actualizar.

export type TipoVitrina =
  | 'personajes'
  | 'principal'
  | 'logros'
  | 'destacadas'
  | 'coleccion'
  | 'texto';

export interface Vitrina {
  id: TipoVitrina;
  nombre: string;
  descripcion: string;
  nivelMinimo: number;
}

export const VITRINAS: Vitrina[] = [
  { id: 'personajes', nombre: 'Personajes favoritos', descripcion: 'Varios personajes con imagen y serie', nivelMinimo: 1 },
  { id: 'principal', nombre: 'Personaje principal', descripcion: 'Un personaje a lo grande, con descripción', nivelMinimo: 1 },
  { id: 'logros', nombre: 'Logros', descripcion: 'Medallas y títulos conseguidos', nivelMinimo: 1 },
  { id: 'destacadas', nombre: 'Publicaciones destacadas', descripcion: 'Tus hilos fijados', nivelMinimo: 1 },
  { id: 'coleccion', nombre: 'Colección', descripcion: 'Series que te gustan', nivelMinimo: 3 },
  { id: 'texto', nombre: 'Texto personal', descripcion: 'Tu presentación y gustos', nivelMinimo: 1 },
];

/** Orden de siempre, para quien nunca tocó las vitrinas. */
export const VITRINAS_POR_DEFECTO: TipoVitrina[] = ['logros', 'destacadas'];

export const MAX_VITRINAS = 6;

/** Personajes de la vitrina (y de las decoraciones propias). */
export interface PersonajeFavorito {
  name: string;
  imageUrl: string;
  /** Serie a la que pertenece (opcional). */
  serie?: string;
}

export const MAX_PERSONAJES = 6;
export const MAX_SERIE_PERSONAJE = 60;
export const MAX_DESC_PERSONAJE = 140;
