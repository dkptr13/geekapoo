import type {
  StreamingAccessType,
  StreamingAvailabilityStatus,
  StreamingPlatform,
  StreamingRegion,
} from '../types';

// ======================================================
// DISPONIBILIDAD REGIONAL: CATÁLOGOS BASE
// ======================================================
// Esta lista es la semilla de países y plataformas. No es una
// lista de disponibilidad: que una plataforma exista aquí no
// significa que una obra esté en ella.
//
// Las plataformas y los países nuevos se pueden añadir desde el
// panel; se guardan en `streamingPlatforms` y `streamingRegions`.
// Las listas de aquí siguen funcionando aunque esas colecciones
// estén vacías o las reglas todavía no se hayan desplegado.
// ======================================================

/** Región que se usa cuando el usuario todavía no ha elegido ninguna. */
export const REGION_POR_DEFECTO = 'ES';

export const REGIONES_INICIALES: StreamingRegion[] = [
  { code: 'ES', name: 'España', order: 10 },
  { code: 'MX', name: 'México', order: 20 },
  { code: 'AR', name: 'Argentina', order: 30 },
  { code: 'CO', name: 'Colombia', order: 40 },
  { code: 'CL', name: 'Chile', order: 50 },
  { code: 'US', name: 'Estados Unidos', order: 60 },
  { code: 'JP', name: 'Japón', order: 70 },
  { code: 'FR', name: 'Francia', order: 80 },
  { code: 'DE', name: 'Alemania', order: 90 },
  { code: 'GB', name: 'Reino Unido', order: 100 },
];

/**
 * Plataformas conocidas de partida. Son solo nombres, colores e
 * identificadores: ninguna fila de disponibilidad se crea sola.
 */
export const PLATAFORMAS_INICIALES: StreamingPlatform[] = [
  { id: 'netflix', name: 'Netflix', badgeColor: '#e11d48', order: 10 },
  { id: 'crunchyroll', name: 'Crunchyroll', badgeColor: '#f47521', order: 20 },
  { id: 'disney-plus', name: 'Disney+', badgeColor: '#2563eb', order: 30 },
  {
    id: 'amazon-prime-video',
    name: 'Amazon Prime Video',
    badgeColor: '#00a8e1',
    order: 40,
  },
  { id: 'max', name: 'Max', badgeColor: '#7c3aed', order: 50 },
  { id: 'hulu', name: 'Hulu', badgeColor: '#1ce783', order: 60 },
  { id: 'apple-tv-plus', name: 'Apple TV+', badgeColor: '#a3a3a3', order: 70 },
  { id: 'youtube', name: 'YouTube', badgeColor: '#ff0000', order: 80 },
  { id: 'filmin', name: 'Filmin', badgeColor: '#00b3b0', order: 90 },
  { id: 'selecta-vision', name: 'Selecta Visión', badgeColor: '#f59e0b', order: 100 },
  { id: 'movistar-plus', name: 'Movistar Plus+', badgeColor: '#019df4', order: 110 },
  { id: 'atresplayer', name: 'Atresplayer', badgeColor: '#e30613', order: 120 },
  { id: 'rtve-play', name: 'RTVE Play', badgeColor: '#00a651', order: 130 },
];

/**
 * Nombres antiguos que ya pueden estar en `animes/{id}.streaming`.
 * Se normalizan para no duplicar la tarjeta de una plataforma que
 * ya tiene una fila regional.
 */
const ALIAS_PLATAFORMA: Record<string, string> = {
  netflix: 'netflix',
  crunchyroll: 'crunchyroll',
  hulu: 'hulu',
  'disney+': 'disney-plus',
  'disney plus': 'disney-plus',
  disneyplus: 'disney-plus',
  'amazon prime': 'amazon-prime-video',
  'amazon prime video': 'amazon-prime-video',
  'prime video': 'amazon-prime-video',
  max: 'max',
  'hbo max': 'max',
  'apple tv+': 'apple-tv-plus',
  'apple tv': 'apple-tv-plus',
  youtube: 'youtube',
  filmin: 'filmin',
  'selecta vision': 'selecta-vision',
  'movistar+': 'movistar-plus',
  'movistar plus+': 'movistar-plus',
  'movistar plus': 'movistar-plus',
  atresplayer: 'atresplayer',
  'rtve play': 'rtve-play',
  anilist: 'anilist',
  otro: 'otro',
};

/** Códigos de región válidos: dos o más letras, sin espacios. */
export function normalizarCodigoRegion(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  const code = value.trim().toUpperCase();

  return /^[A-Z]{2,10}$/.test(code) ? code : null;
}

/** Bandera emoji a partir de un código ISO de dos letras. */
export function banderaDeRegion(code: string): string {
  const normalized = normalizarCodigoRegion(code);

  if (!normalized || !/^[A-Z]{2}$/.test(normalized)) return '🌐';

  return String.fromCodePoint(
    ...Array.from(normalized).map((letter) => 0x1f1e6 + letter.charCodeAt(0) - 65),
  );
}

/** Nombre visible de una región, con la lista que esté cargada. */
export function nombreDeRegion(
  code: string,
  regions: StreamingRegion[] = REGIONES_INICIALES,
): string {
  const normalized = normalizarCodigoRegion(code);
  if (!normalized) return '';

  return regions.find((region) => region.code === normalized)?.name ?? normalized;
}

/** Normaliza el estado de una fila; cualquier cosa rara se descarta. */
export function normalizarEstadoDisponibilidad(
  value: unknown,
): StreamingAvailabilityStatus | null {
  return value === 'available' || value === 'unavailable' || value === 'unverified'
    ? value
    : null;
}

/** Normaliza la modalidad de acceso; lo desconocido no se inventa. */
export function normalizarAcceso(value: unknown): StreamingAccessType {
  return value === 'subscription' ||
    value === 'rental' ||
    value === 'purchase' ||
    value === 'free_ads'
    ? value
    : 'unknown';
}

function claveDePlataforma(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9+]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** Id estable para una plataforma nueva. */
export function slugifyPlatformId(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/**
 * Id de una plataforma a partir de su nombre.
 *
 * Se usa con los datos antiguos: si allí pone "Amazon Prime", la
 * ficha regional de `amazon-prime-video` sustituye a la tarjeta
 * heredada en vez de salir duplicada.
 */
export function plataformaIdDeNombre(name: string): string {
  const clave = claveDePlataforma(name);
  if (!clave) return '';

  return ALIAS_PLATAFORMA[clave] ?? slugifyPlatformId(name);
}

/** Texto legible cuando solo queda el id (plataforma eliminada, etc.). */
export function nombreDesdePlatformId(id: string): string {
  return id
    .split(/[-_]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
