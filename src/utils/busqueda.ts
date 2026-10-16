// ======================================================
// BÚSQUEDA INTELIGENTE DE LA WIKI
// ======================================================
// Reconoce que una misma obra tiene varios nombres
// ("Ataque a los Titanes", "Attack on Titan", "Shingeki no
// Kyojin") y que el usuario se equivoca al escribir
// ("Atack on Titan", "Shigeki no Kyojin").
//
// Todo es lógica pura, sin React ni Firebase: se prueba con
// `tsx` como el resto (`tests/logica.busqueda.ts`). Los datos
// ya están en memoria (los trae `useCommunity`), así que no
// hay consultas por tecla ni índices nuevos que mantener.
//
// ── DE DÓNDE SALEN LOS ALIAS ─────────────────────────────
// De AniList, que ya es la fuente de portadas y repartos: el
// título en inglés, el romanizado y sus sinónimos. Los guarda
// `scripts/rellenar-alias.mjs` en `alternativeTitles` (animes)
// y `aliases` (personajes). Aquí no se inventa ninguno: sin
// alias, la ficha se busca por su título principal.
// ======================================================

import { toTextList } from './safeData';

// ======================================================
// NORMALIZACIÓN
// ======================================================
// Deja la consulta y los títulos en la misma forma antes de
// compararlos. Los títulos en pantalla no se tocan.

/**
 * Variantes habituales de romanización, para que "Kyoujin" y
 * "Kyojin" sean el mismo texto.
 *
 * Van en este orden a propósito: primero los dígrafos ("ou")
 * y luego las vocales dobles. Solo cubren los casos comunes
 * del japonés romanizado; no es un transliterador general.
 */
const VARIANTES_ROMANIZACION: [RegExp, string][] = [
  [/ou/g, 'o'],
  [/uu/g, 'u'],
  [/oo/g, 'o'],
  [/ee/g, 'e'],
  [/aa/g, 'a'],
];

/**
 * Normaliza un texto para compararlo.
 *
 * - Minúsculas, sin espacios de más por fuera ni por dentro.
 * - Sin tildes ni macrones ("ō" -> "o", "é" -> "e").
 * - La puntuación separa palabras ("Re:Zero" -> "re zero",
 *   "Kimi no Na wa." -> "kimi no na wa").
 * - Variantes de romanización unificadas ("kyoujin" -> "kyojin").
 */
export function normalizarBusqueda(valor: unknown): string {
  if (typeof valor !== 'string') return '';
  let s = valor
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  for (const [re, repuesto] of VARIANTES_ROMANIZACION) s = s.replace(re, repuesto);
  return s.replace(/\s+/g, ' ').trim();
}

/** Lo mismo sin espacios: pilla "spyfamily" contra "spy family". */
export function claveSinEspacios(valor: unknown): string {
  return normalizarBusqueda(valor).replace(/\s+/g, '');
}

// ======================================================
// DISTANCIA DE EDICIÓN (LEVENSHTEIN CON TOPE)
// ======================================================
// Tolera letras omitidas, duplicadas o cambiadas ("atack" por
// "attack", "shigeki" por "shingeki").
//
// Con tope: en cuanto supera el máximo deja de contar, porque
// para decidir "no se parece" no hace falta el número exacto.
// Es lo que la hace barata con miles de fichas por tecla.

export function distanciaEdicion(a: string, b: string, tope: number): number {
  if (a === b) return 0;
  // La diferencia de longitud ya es una cota inferior: si solo
  // con eso se pasa del tope, no hay nada que calcular.
  if (Math.abs(a.length - b.length) > tope) return tope + 1;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let anterior = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    let actual: number[] = [i];
    let minimoFila = i;
    for (let j = 1; j <= b.length; j++) {
      const coste = a[i - 1] === b[j - 1] ? 0 : 1;
      const v = Math.min(anterior[j] + 1, actual[j - 1] + 1, anterior[j - 1] + coste);
      actual.push(v);
      if (v < minimoFila) minimoFila = v;
    }
    // Fila entera por encima del tope: ya no puede bajar.
    if (minimoFila > tope) return tope + 1;
    anterior = actual;
  }

  return anterior[b.length];
}

/** Parecido de 0 a 1 entre dos textos ya normalizados. */
export function similitudTextos(a: string, b: string): number {
  const largo = Math.max(a.length, b.length);
  if (largo === 0) return 1;
  const tope = Math.max(1, Math.floor(largo * 0.5));
  const d = distanciaEdicion(a, b, tope);
  if (d > tope) return 0;
  return 1 - d / largo;
}

// ======================================================
// PUNTUACIÓN POR RELEVANCIA
// ======================================================
// Bandas fijas, de más a menos relevante. Una coincidencia
// aproximada nunca supera a una exacta, por muchos puntos
// que saque dentro de su banda.

const PUNTOS = {
  exactaPrincipal: 500,
  exactaAlias: 450,
  exactaOriginal: 400,
  // Todos los tokens de la consulta abren algún token del
  // título ("attack titan", "titanes ataque").
  tokensCompletos: 350,
  parcialPrincipal: 300,
  parcialAlias: 250,
  parcialOriginal: 200,
  // Sinopsis, géneros, estudio...: encuentran, pero no son
  // el título y van por debajo de cualquier parcial de título.
  palabraClave: 150,
  // Banda difusa: 40 + 60 * similitud (máximo ~100).
  difusaBase: 40,
  difusaVariable: 60,
} as const;

export interface CamposFicha {
  /** Título que se muestra en Geekapoo. */
  principal: string;
  /** Original: japonés, nativo, romaji del capítulo... */
  originales?: string[];
  /** Inglés, sinónimos y apodos de AniList. */
  alias?: string[];
  /** Resto de texto que también busca: sinopsis, géneros... */
  claves?: string[];
}

/**
 * Similitud mínima para aceptar una coincidencia difusa, según
 * lo larga que sea la consulta. Corta y permisiva es la receta
 * de los falsos positivos ("ao" encontraría "Sao").
 */
function similitudMinima(longitudConsulta: number): number {
  if (longitudConsulta < 4) return Infinity;
  if (longitudConsulta < 6) return 0.8;
  if (longitudConsulta < 10) return 0.65;
  return 0.55;
}

function textosDe(lista: string[] | undefined): string[] {
  const crudos = toTextList(lista).filter((t) => t.trim().length > 0);
  const base = crudos.map(normalizarBusqueda).filter((t) => t.length > 0);
  // Sin paréntesis también: "Okarin (オカリン)" tiene que valer
  // como "Okarin" exacto, no solo por tokens. Se recortan en
  // crudo porque la normalización ya los habría convertido en
  // espacios.
  const sinParentesis = crudos
    .map((t) => normalizarBusqueda(t.replace(/\(.*?\)/g, ' ')))
    .filter((t) => t.length > 0);
  return [...new Set([...base, ...sinParentesis])];
}

function incluyeEn(aguja: string, pajar: string): boolean {
  if (!aguja) return false;
  if (pajar.includes(aguja)) return true;
  // Sin espacios por si la puntuación pegaba palabras.
  const a = aguja.replace(/\s+/g, '');
  const p = pajar.replace(/\s+/g, '');
  return a.length > 0 && p.includes(a);
}

/**
 * ¿Cada token de la consulta abre algún token de los títulos?
 * Es lo que encuentra "attack titan" o "kyojin shingeki" sin
 * exigir el orden ni las partículas ("no", "la"...).
 */
function cubreTokens(consulta: string, titulos: string[]): boolean {
  // Solo tokens con cuerpo: las partículas ("a", "y", "no")
  // no pueden acreditar nada por sí solas.
  const tokensQ = consulta.split(' ').filter((t) => t.length > 1);
  if (tokensQ.length === 0) return false;
  const tokensT = new Set(titulos.flatMap((t) => t.split(' ').filter((x) => x.length > 1)));
  if (tokensT.size === 0) return false;
  return tokensQ.every((q) => [...tokensT].some((t) => t.startsWith(q) || q.startsWith(t)));
}

/**
 * Puntuación de una ficha para una consulta. 0 = no coincide.
 *
 * La consulta llega sin normalizar; aquí se normaliza una vez
 * y se compara contra principal, alias, originales, claves y,
 * en última instancia, parecido de edición.
 */
export function puntuarFicha(consulta: string, campos: CamposFicha): number {
  const q = normalizarBusqueda(consulta);
  if (!q) return 0;

  const principal = normalizarBusqueda(campos.principal);
  const originales = textosDe(campos.originales);
  const alias = textosDe(campos.alias);
  const claves = textosDe(campos.claves);
  const titulos = [principal, ...alias, ...originales].filter((t) => t.length > 0);

  // 1-3. Exactas, en orden: principal, alias, original.
  if (principal && q === principal) return PUNTOS.exactaPrincipal;
  if (alias.some((t) => t === q)) return PUNTOS.exactaAlias;
  if (originales.some((t) => t === q)) return PUNTOS.exactaOriginal;

  // 4a. Todos los tokens colocados, en cualquier orden.
  if (cubreTokens(q, titulos)) return PUNTOS.tokensCompletos;

  // 4b. Parciales (subcadena), con el mismo orden de bandas.
  if (principal && incluyeEn(q, principal)) return PUNTOS.parcialPrincipal;
  if (alias.some((t) => incluyeEn(q, t))) return PUNTOS.parcialAlias;
  if (originales.some((t) => incluyeEn(q, t))) return PUNTOS.parcialOriginal;

  // Palabras clave: texto que acompaña a la ficha, no su nombre.
  if (claves.some((t) => incluyeEn(q, t))) return PUNTOS.palabraClave;

  // 5. Difusa: contra el título completo y contra cada token,
  // para que un apellido mal escrito también cuente.
  const minimo = similitudMinima(q.length);
  if (minimo === Infinity) return 0;
  let mejor = 0;
  const candidatos = [...titulos, ...titulos.flatMap((t) => t.split(' '))];
  for (const c of candidatos) {
    if (!c || Math.abs(c.length - q.length) > q.length) continue;
    const s = similitudTextos(q, c);
    if (s > mejor) mejor = s;
    if (mejor >= 0.99) break;
  }
  if (mejor < minimo) return 0;
  return PUNTOS.difusaBase + Math.round(PUNTOS.difusaVariable * mejor);
}

/**
 * Filtra y ordena por relevancia. Sin duplicados posibles:
 * cada ficha sale una vez, con su mejor puntuación.
 */
export function buscarConRelevancia<T>(
  fichas: T[],
  consulta: string,
  camposDe: (ficha: T) => CamposFicha,
): { ficha: T; puntos: number }[] {
  const q = normalizarBusqueda(consulta);
  if (!q) return [];
  const salida: { ficha: T; puntos: number }[] = [];
  for (const ficha of fichas) {
    const puntos = puntuarFicha(q, camposDe(ficha));
    if (puntos > 0) salida.push({ ficha, puntos });
  }
  // Estable: a igual puntos, manda el orden de llegada.
  return salida.sort((a, b) => b.puntos - a.puntos);
}
