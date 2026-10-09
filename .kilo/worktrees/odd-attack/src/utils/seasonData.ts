import type { Anime, Season } from '../types';

// ======================================================
// LA FICHA QUE SE ESTÁ VIENDO
// ======================================================
// Una temporada tiene su propia ficha: la 2 puede tener otro año,
// otro estudio, otra puntuación, otros capítulos y otras
// imágenes que la 1. Lo único compartido entre temporadas son las
// categorías, los géneros y las plataformas, que son de la serie
// entera.
//
// Aquí se junta lo de la temporada con lo del anime para poder
// pintar una sola cosa: si la temporada no tiene un campo, se
// hereda el del anime. Con `||` a propósito, porque un 0 o una
// cadena vacía en la temporada ("aún no lo he rellenado") tienen
// que caer en el valor del anime y no dejar un hueco en la ficha.
//
// El resultado se usa en la wiki. Las tarjetas del catálogo no
// pasan por aquí: enseñan la serie, no una temporada, y por eso
// leen el anime directamente. Lo que evita que se quede corto es
// que al guardar la temporada 1 su ficha se copia al anime (ver
// `saveSeasonFields`).
// ======================================================

export interface FichaVisible {
  synopsis: string;
  year: number;
  status: string;
  studio: string;
  rating: number;
  episodesCount: number;
  /** Portada vertical. */
  coverUrl: string;
  coverFocus: unknown;
  /** Banner horizontal. */
  bannerUrl: string;
  bannerFocus: unknown;
}

/**
 * Estado tal como se enseña, sea cual sea el documento del que
 * venga.
 *
 * El estado está escrito con dos vocabularios: el anime usa la
 * palabra corta ('emitiendo', 'finished', 'upcoming') porque el
 * filtro del panel compara contra ella, y la temporada la larga
 * ('En emisión', 'Finalizado', 'Próximamente') porque es la que se
 * escribe a mano. Sin traducción, la misma serie se veía como
 * "emitiendo" en la vista general y como "En emisión" al pinchar
 * la T1, y la copia de la ficha al anime era según cuánto
 * hubiera tardado el primero en abrirse.
 *
 * Ambos se aceptan aquí, y también la palabra suelta ("emitiendo")
 * que queda de un campo vacío, para que pinchar cualquier botón
 * de la ficha salga siempre igual.
 */
export function textoEstado(valor: unknown): string {
  const clave = typeof valor === 'string' ? valor.trim().toLowerCase() : '';
  switch (clave) {
    case 'emitiendo':
    case 'en emisión':
    case 'en emision':
      return 'En emisión';
    case 'finished':
    case 'finalizado':
      return 'Finalizado';
    case 'upcoming':
    case 'próximamente':
    case 'proximamente':
      return 'Próximamente';
    default:
      return '';
  }
}

/** 'En emisión' → 'emitiendo'. La forma que espera el filtro. */
const ESTADO_CORTO_POR_ESTADO: Record<string, string> = {
  'En emisión': 'emitiendo',
  emitiendo: 'emitiendo',
  Finalizado: 'finished',
  finished: 'finished',
  'Próximamente': 'upcoming',
  upcoming: 'upcoming',
};

/**
 * Estado al vocabulario del anime, sea cual sea el que venga.
 *
 * Lo usa el filtro del panel y la copia de la ficha de la T1 al
 * anime. Un estado que no está en la tabla se devuelve tal cual:
 * mejor guardar un valor raro que dejar el campo vacío, porque un
 * "" en el estado de la serie la saca de todos los filtros.
 */
export function estadoCorto(valor: unknown): string {
  if (typeof valor !== 'string') return '';
  return ESTADO_CORTO_POR_ESTADO[valor.trim()] ?? valor;
}

/**
 * Ficha de la temporada abierta, con lo que le falte tomado del
 * anime. Sin temporada (la vista de "Todas" o un anime sin
 * temporadas) es directamente la del anime.
 */
export function fichaDe(anime: Anime | null | undefined, season?: Season | null): FichaVisible {
  const s = season ?? undefined;

  return {
    synopsis: s?.synopsis || anime?.synopsis || '',
    year: s?.year || anime?.year || 0,
    status: textoEstado(s?.status) || textoEstado(anime?.status),
    studio: s?.studio || anime?.studio || '',
    rating: s?.rating || anime?.rating || 0,
    episodesCount: s?.episodesCount || anime?.episodesCount || 0,
    coverUrl: s?.posterUrl || anime?.coverUrl || '',
    // El encuadre va con la imagen: si la portada sale del anime,
    // su encuadre también, y mezclar los dos colocaría la foto en
    // un punto pensado para otra.
    coverFocus: s?.posterUrl ? s.posterFocus : anime?.coverFocus,
    bannerUrl: s?.bannerUrl || anime?.bannerUrl || '',
    bannerFocus: s?.bannerUrl ? s.bannerFocus : anime?.bannerFocus,
  };
}
