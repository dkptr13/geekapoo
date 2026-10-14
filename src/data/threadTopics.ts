/**
 * Tópicos oficiales de los hilos, para medir actividad temática.
 *
 * ── POR QUÉ UNA LISTA CERRADA ────────────────────────────
 *
 * Los `tags` de un hilo son texto libre: "manga", "Manga" y
 * "mangas" serían tres cosas distintas y ninguna medalla podría
 * contar "10 publicaciones sobre manga" sin adivinar. Estos ids
 * son estables (el nombre visible puede cambiar sin romper el
 * histórico) y la comparación normaliza mayúsculas, tildes y
 * espacios. Lo que no coincide con nada no cuenta, y no se
 * inventa categoría para lo ambiguo.
 *
 * Se usa SOLO para medir (triggers de gamificación). El
 * formulario sigue aceptando texto libre: aquí no se prohíbe
 * nada, solo se reconoce lo conocido.
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
