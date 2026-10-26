import {
  normalizarAcceso,
  normalizarCodigoRegion,
  normalizarEstadoDisponibilidad,
  nombreDesdePlatformId,
  plataformaIdDeNombre,
} from '../data/streaming';
import type {
  StreamingAccessType,
  StreamingAvailability,
  StreamingAvailabilityStatus,
  StreamingPlatform,
  StreamingService,
} from '../types';

// ======================================================
// LÓGICA PURA DE «DÓNDE VERLA»
// ======================================================
// Aquí no hay Firestore ni React: se puede probar sin navegador.
// La interfaz solo pinta lo que sale de `construirTarjetas`.
// ======================================================

export const ETIQUETAS_ESTADO: Record<StreamingAvailabilityStatus, string> = {
  available: 'Disponible',
  unavailable: 'No disponible',
  unverified: 'Sin verificar',
};

export const ETIQUETAS_ACCESO: Record<StreamingAccessType, string> = {
  subscription: 'Suscripción',
  rental: 'Alquiler',
  purchase: 'Compra',
  free_ads: 'Gratis con anuncios',
  unknown: '',
};

export const OPCIONES_ESTADO: { value: StreamingAvailabilityStatus; label: string }[] = [
  { value: 'available', label: ETIQUETAS_ESTADO.available },
  { value: 'unavailable', label: ETIQUETAS_ESTADO.unavailable },
  { value: 'unverified', label: ETIQUETAS_ESTADO.unverified },
];

export const OPCIONES_ACCESO: { value: StreamingAccessType; label: string }[] = [
  { value: 'subscription', label: ETIQUETAS_ACCESO.subscription },
  { value: 'rental', label: ETIQUETAS_ACCESO.rental },
  { value: 'purchase', label: ETIQUETAS_ACCESO.purchase },
  { value: 'free_ads', label: ETIQUETAS_ACCESO.free_ads },
  { value: 'unknown', label: 'No conocida' },
];

export interface StreamingCard {
  key: string;
  platformId: string;
  name: string;
  badgeColor: string;
  logoUrl?: string;
  status: StreamingAvailabilityStatus;
  accessType: StreamingAccessType;
  url?: string;
  verifiedAt?: string;
  /** `true` = viene de `animes/{id}.streaming`, sin país confirmado. */
  legacy: boolean;
  region: string;
}

const ORDEN_ESTADO: Record<StreamingAvailabilityStatus, number> = {
  available: 0,
  unavailable: 1,
  unverified: 2,
};

const COLOR_POR_DEFECTO = '#71717a';

/** Comprueba que un enlace sea HTTP(S), no javascript: ni similares. */
export function esUrlHttp(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Convierte un documento crudo de Firestore en una fila válida.
 * Devuelve `null` si falta lo imprescindible: es mejor no pintar
 * una disponibilidad rota que inventarse una región o un estado.
 */
export function normalizarDisponibilidad(
  raw: Record<string, unknown> & { id?: string },
): StreamingAvailability | null {
  const animeId = typeof raw.animeId === 'string' ? raw.animeId.trim() : '';
  const platformId = typeof raw.platformId === 'string' ? raw.platformId.trim() : '';
  const region = normalizarCodigoRegion(raw.region);
  const status = normalizarEstadoDisponibilidad(raw.status);

  if (!animeId || !platformId || !region || !status) return null;

  const urlTexto =
    typeof raw.url === 'string' && raw.url.trim() ? raw.url.trim() : undefined;
  const url =
    status === 'available' && urlTexto && esUrlHttp(urlTexto) ? urlTexto : undefined;
  const verifiedAt =
    status !== 'unverified' && typeof raw.verifiedAt === 'string' && raw.verifiedAt.trim()
      ? raw.verifiedAt.trim()
      : undefined;
  const updatedAt =
    typeof raw.updatedAt === 'string' && raw.updatedAt.trim()
      ? raw.updatedAt.trim()
      : undefined;

  return {
    id: raw.id || `${animeId}__${platformId}__${region}`,
    animeId,
    platformId,
    region,
    status,
    accessType: status === 'available' ? normalizarAcceso(raw.accessType) : 'unknown',
    ...(url ? { url } : {}),
    ...(verifiedAt ? { verifiedAt } : {}),
    ...(updatedAt ? { updatedAt } : {}),
  };
}

/**
 * Junta las filas regionales con las plataformas antiguas.
 *
 * Las filas nuevas mandan: si Crunchyroll ya tiene una fila para
 * España, la tarjeta heredada de Crunchyroll no se duplica. Las
 * plataformas antiguas que no tengan fila se enseñan como «Sin
 * verificar» y sin enlace, porque no se sabe a qué país
 * corresponden.
 */
export function construirTarjetas(input: {
  registros: StreamingAvailability[];
  legado?: StreamingService[];
  region: string;
  platforms: StreamingPlatform[];
}): StreamingCard[] {
  const platformMap = new Map(input.platforms.map((platform) => [platform.id, platform]));
  const region = normalizarCodigoRegion(input.region) ?? input.region;
  const cards: StreamingCard[] = [];
  const plataformasConFila = new Set<string>();

  input.registros.forEach((registro) => {
    plataformasConFila.add(registro.platformId);

    const platform = platformMap.get(registro.platformId);
    const status = registro.status;

    cards.push({
      key: registro.id,
      platformId: registro.platformId,
      name:
        platform?.name ||
        nombreDesdePlatformId(registro.platformId) ||
        registro.platformId,
      badgeColor: platform?.badgeColor || COLOR_POR_DEFECTO,
      ...(platform?.logoUrl ? { logoUrl: platform.logoUrl } : {}),
      status,
      accessType: status === 'available' ? normalizarAcceso(registro.accessType) : 'unknown',
      ...(status === 'available' && registro.url ? { url: registro.url } : {}),
      ...(status !== 'unverified' && registro.verifiedAt
        ? { verifiedAt: registro.verifiedAt }
        : {}),
      legacy: false,
      region,
    });
  });

  const plataformasLegado = new Set<string>();
  const legado = Array.isArray(input.legado) ? input.legado : [];

  legado.forEach((servicio) => {
    if (!servicio || typeof servicio !== 'object') return;

    const nombre = typeof servicio.name === 'string' ? servicio.name.trim() : '';
    const platformId = plataformaIdDeNombre(nombre);

    if (!nombre || !platformId) return;
    if (plataformasConFila.has(platformId) || plataformasLegado.has(platformId)) return;

    plataformasLegado.add(platformId);

    cards.push({
      key: `legacy:${platformId}`,
      platformId,
      name: nombre,
      badgeColor: servicio.badgeColor || COLOR_POR_DEFECTO,
      status: 'unverified',
      accessType: 'unknown',
      legacy: true,
      region,
    });
  });

  return cards.sort(
    (a, b) =>
      ORDEN_ESTADO[a.status] - ORDEN_ESTADO[b.status] ||
      a.name.localeCompare(b.name, 'es'),
  );
}

/** Fecha `YYYY-MM-DD` (o ISO) a texto corto en español. */
export function formatearFechaVerificacion(value?: string): string {
  if (!value) return '';

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!match) return value;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day, 12));

  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return value;
  }

  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/** Hay al menos una disponibilidad confirmada que enseñar. */
export function hayDisponibilidadConfirmada(cards: StreamingCard[]): boolean {
  return cards.some((card) => card.status === 'available');
}
