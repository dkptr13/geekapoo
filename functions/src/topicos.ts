/**
 * Tópicos oficiales de los hilos, para medir actividad temática.
 *
 * ── DUPLICADO A PROPÓSITO ───────────────────────────────
 *
 * Es la misma lista que `src/data/threadTopics.ts`. Son paquetes
 * distintos y no comparten código (igual que el catálogo de
 * medallas o la curva de niveles), así que cualquier cambio hay
 * que hacerlo en los dos sitios. `tests/logica.logros.ts`
 * comprueba que los ids coinciden: si divergen, el test se cae
 * antes que una medalla.
 */
export interface TopicoHilo {
  id: string;
  nombre: string;
}

export const TOPICOS_OFICIALES: TopicoHilo[] = [
  { id: 'manga', nombre: 'Manga' },
  { id: 'recomendacion', nombre: 'Recomendaciones' },
  { id: 'teoria', nombre: 'Teorías' },
  { id: 'resena', nombre: 'Reseñas' },
  { id: 'personajes', nombre: 'Personajes' },
  { id: 'videojuegos', nombre: 'Videojuegos' },
  { id: 'cosplay', nombre: 'Cosplay y fanart' },
  { id: 'noticias', nombre: 'Noticias y novedades' },
  { id: 'anime', nombre: 'Anime' },
  { id: 'cultura', nombre: 'Cultura geek' },
];

/** Tildes combinantes (U+0300–U+036F), para comparar sin acentos. */
const TILDES = new RegExp('[\\u0300-\\u036f]', 'g');

/** Normaliza un tag para compararlo: minúsculas, sin tildes ni espacios de más. */
export function normalizarTag(tag: unknown): string {
  if (typeof tag !== 'string') return '';
  return tag.normalize('NFD').replace(TILDES, '').toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Tópicos oficiales presentes en una lista de tags.
 *
 * Compara el tag normalizado contra id y nombre normalizado.
 * Devuelve ids únicos. Lo desconocido se ignora sin inventar.
 */
export function topicosDe(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  const vistos = new Set<string>();
  for (const t of tags) {
    const n = normalizarTag(t);
    if (!n) continue;
    const hit = TOPICOS_OFICIALES.find(
      (top) => top.id === n || normalizarTag(top.nombre) === n,
    );
    if (hit) vistos.add(hit.id);
  }
  return [...vistos];
}
