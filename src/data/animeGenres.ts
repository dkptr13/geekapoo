// ======================================================
// GÉNEROS DEL CATÁLOGO: UN SOLO VOCABULARIO
// ======================================================
//
// Los géneros han entrado al catálogo desde sitios distintos
// (AniList, TVDB, fichas escritas a mano) y cada importación
// dejó su propia grafía: "Accion" y "Acción", "Sci-Fi" y
// "Ciencia ficción", "Slice of Life" y "Recuentos de la vida"...
//
// Para el filtro eso eran géneros diferentes, así que marcar
// "Acción" no encontraba las series guardadas con "Accion".
//
// Aquí vive la lista canónica y los alias. `normalizarGenero`
// devuelve siempre la etiqueta que se pinta en el filtro, y
// `claveGenero` la clave con la que se compara (sin tildes,
// mayúsculas ni signos). Así los datos viejos siguen valiendo
// aunque no se hayan migrado todavía.

import { normalize } from './animeCategories';

/**
 * Etiquetas que puede mostrar el filtro.
 *
 * Las que no están aquí se conservan tal cual: el catálogo tiene
 * etiquetas de nicho ("Buceo", "Palacio", "Recetas"...) que no
 * conviene borrar solo porque no estén en una lista cerrada.
 */
export const GENEROS_CANONICOS = [
  'Acción',
  'Apocalipsis',
  'Artes marciales',
  'Asesinos',
  'Aventura',
  'Bádminton',
  'Baloncesto',
  'Buceo',
  'Chicas mágicas',
  'Ciencia ficción',
  'Comedia',
  'Competencia',
  'Coming-of-age',
  'Cosplay',
  'Crimen',
  'Cyberpunk',
  'Demonios',
  'Deportes',
  'Distopía',
  'Drama',
  'Dragones',
  'Ecchi',
  'Equipo',
  'Escolar',
  'Espionaje',
  'Familiar',
  'Fantasía',
  'Fantasía Oscura',
  'Fantasía medieval',
  'Fútbol',
  'Harem',
  'Histórico',
  'Isekai',
  'Jazz',
  'Josei',
  'Juego',
  'Magia',
  'Mazmorras',
  'Mecha',
  'Militar',
  'Misterio',
  'Monstruos',
  'Música',
  'Ninja',
  'Palacio',
  'Parodia',
  'Psicológico',
  'Recetas',
  'Recuentos de la vida',
  'Romance',
  'Samuráis',
  'Seinen',
  'Shojo',
  'Shonen',
  'Sobrenatural',
  'Superhéroes',
  'Supervivencia',
  'Terror',
  'Thriller',
  'Trabajo',
  'Tragedia',
  'Universitario',
  'Vampiros',
  'Venganza',
  'Voleibol',
  'Zombis',
] as const;

/**
 * Nombres que significan lo mismo pero no comparten clave.
 *
 * Las claves se escriben ya normalizadas (minúsculas, sin tildes
 * ni signos), porque `normalize` es lo que usa el filtro. Las
 * variantes que solo cambian en tildes o mayúsculas no necesitan
 * alias: las resuelve `GENEROS_CANONICOS`.
 */
const ALIAS: Record<string, string> = {
  belico: 'Militar',
  curro: 'Trabajo',
  darkfantasy: 'Fantasía Oscura',
  horror: 'Terror',
  musical: 'Música',
  medieval: 'Fantasía medieval',
  sciencefiction: 'Ciencia ficción',
  scifi: 'Ciencia ficción',
  sliceoflife: 'Recuentos de la vida',
  suspense: 'Thriller',
  universidad: 'Universitario',
  vidaescolar: 'Escolar',
};

const CANONICO_POR_CLAVE = new Map(
  GENEROS_CANONICOS.map((genero) => [normalize(genero), genero] as const),
);

/**
 * Valores que no son géneros aunque hayan llegado como texto.
 *
 * "Ekstasis" se coló en Blue Lock y no significa nada; el resto
 * son restos de volcar objetos a string ("[object Object]").
 */
const CLAVES_INVALIDAS = new Set(['ekstasis', 'nan', 'null', 'objectobject', 'undefined']);

const PARECE_OBJETO = /^\[object\b/i;

/**
 * Convierte cualquier género guardado en su etiqueta canónica.
 * Devuelve `null` si no es un texto válido.
 */
export function normalizarGenero(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;

  const nombre = valor.trim().replace(/\s+/g, ' ');
  if (!nombre || PARECE_OBJETO.test(nombre)) return null;

  const clave = normalize(nombre);
  if (!clave || CLAVES_INVALIDAS.has(clave)) return null;

  return ALIAS[clave] ?? CANONICO_POR_CLAVE.get(clave) ?? nombre;
}

/**
 * Clave de comparación de un género. Dos etiquetas que suenan
 * igual ("Accion" y "Acción") devuelven la misma clave.
 */
export function claveGenero(valor: unknown): string {
  const nombre = normalizarGenero(valor);
  return nombre ? normalize(nombre) : '';
}
