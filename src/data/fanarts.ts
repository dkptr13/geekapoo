import type { FanartMedium } from '../types';

// ======================================================
// FANARTS DEL FORO
// ======================================================
//
// No son una colección nueva: son hilos de `threads` con una
// categoría fija (`fanarts`) y una ficha `fanart`. Así reutilizan
// comentarios, reacciones, notificaciones, me gusta, reportes y
// borrado sin duplicar nada.
//
// La categoría NO se añade a `FORUM_CATEGORIES`: no debe salir en
// la barra de categorías ni en el desplegable de hilos normales.
// El formulario de Fanart es el único que la asigna.

export const FANART_CATEGORY_ID = 'fanarts';
export const FANART_CATEGORY_NAME = 'Fanart';

/** Tope de imágenes por publicación. */
export const FANART_MAX_IMAGES = 6;

/** Tope de etiquetas; deja sitio a las automáticas. */
export const FANART_MAX_TAGS = 10;

/**
 * Etiquetas que se ofrecen en el formulario y en los filtros.
 *
 * El valor que se guarda en `tags` es `tag`, no el id: los hilos
 * ya usan etiquetas legibles y las consultas filtran por ese texto.
 */
export const FANART_TAGS = [
  { id: 'anime-manga', label: 'Anime o manga', tag: 'Anime / Manga' },
  { id: 'videojuegos', label: 'Videojuegos', tag: 'Videojuegos' },
  { id: 'digital', label: 'Dibujo digital', tag: 'Dibujo digital' },
  { id: 'tradicional', label: 'Dibujo tradicional', tag: 'Dibujo tradicional' },
  { id: 'original', label: 'Ilustración original', tag: 'Ilustración original' },
] as const;

/** Etiquetas que se añaden solas según la ficha del fanart. */
export const FANART_MEDIA_OPTIONS: {
  id: FanartMedium;
  label: string;
  tags: string[];
}[] = [
  { id: 'digital', label: 'Dibujo digital', tags: ['Dibujo digital'] },
  { id: 'traditional', label: 'Dibujo tradicional', tags: ['Dibujo tradicional'] },
  {
    id: 'mixed',
    label: 'Digital + tradicional',
    tags: ['Dibujo digital', 'Dibujo tradicional'],
  },
];

/** Clave para comparar etiquetas sin distinguir mayúsculas ni tildes. */
function claveEtiqueta(tag: string): string {
  return tag
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^#/, '');
}

/**
 * Limpia, deduplica y completa las etiquetas de un fanart.
 *
 * Además de las que escriba la persona, añade la técnica y, si la
 * obra es original, la etiqueta que alimenta ese filtro. Devuelve
 * como máximo `FANART_MAX_TAGS`; el primero que aparece manda en
 * mayúsculas y tildes.
 */
export function etiquetasDeFanart(
  tags: string[],
  medium: FanartMedium,
  original: boolean,
): string[] {
  // Primero las automáticas: si alguien escribe diez etiquetas, los
  // filtros de técnica y obra original no pueden quedarse fuera.
  const todas: string[] = [];

  for (const opcion of FANART_MEDIA_OPTIONS) {
    if (opcion.id === medium) todas.push(...opcion.tags);
  }
  if (original) todas.push('Ilustración original');
  todas.push(...tags);

  const vistas = new Set<string>();
  const resultado: string[] = [];

  for (const tag of todas) {
    const limpia = tag.trim().replace(/^#/, '');
    if (!limpia) continue;
    const clave = claveEtiqueta(limpia);
    if (!clave || vistas.has(clave)) continue;
    vistas.add(clave);
    resultado.push(limpia);
    if (resultado.length >= FANART_MAX_TAGS) break;
  }

  return resultado;
}

/** ¿Esta etiqueta es una de las fijas del formulario? */
export function esEtiquetaFijaDeFanart(tag: string): boolean {
  const clave = claveEtiqueta(tag);
  return FANART_TAGS.some((t) => claveEtiqueta(t.tag) === clave);
}
