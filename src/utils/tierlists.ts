// Lógica pura de las tier lists (sin Firestore ni React).
//
// Todo lo que decide si un borrador vale y cómo se mueven los
// elementos vive aquí, para comprobarlo sin navegador:
// `npx tsx tests/logica.tierlists.ts`.
//
// Sin tildes a propósito, como el resto de `utils/`.

import type { ClubCategory, NuevoTierList, TierItem, TierItemMap, TierRow, TierRowMap, TierList } from '../types';

/** Límites del editor. */
export const TIER_LIMITS = {
  title: 80,
  description: 500,
  tierLabel: 12,
  itemName: 60,
  minTiers: 1,
  maxTiers: 12,
  maxItems: 100,
} as const;

/** Colores por defecto de cada nivel (estilo clásico S-F). */
export const COLORES_NIVEL = [
  '#ff7f7f',
  '#ffbf7f',
  '#ffdf7f',
  '#ffff7f',
  '#bfff7f',
  '#7fff7f',
  '#7fffff',
] as const;

/** Niveles iniciales S/A/B/C/D/F. */
export function nivelesIniciales(): TierRow[] {
  const etiquetas = ['S', 'A', 'B', 'C', 'D', 'F'];
  return etiquetas.map((label, i) => ({
    id: `t${i + 1}`,
    label,
    color: COLORES_NIVEL[i % COLORES_NIVEL.length],
    order: i,
  }));
}

/** Id estable único dentro del navegador (no es un id de Firestore). */
export function nuevoId(prefijo: string): string {
  return `${prefijo}_${Date.now().toString(36)}_${Math.floor(Math.random() * 0xffffff).toString(36)}`;
}

/** Color hex válido (`#rgb` o `#rrggbb`). */
export function colorValido(color: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color.trim());
}

/**
 * Valida un borrador y devuelve el error a enseñar, o null si vale.
 *
 * Las reglas de Firestore vuelven a comprobar lo esencial en el
 * servidor; esto es para no fallar al guardar con un error feo.
 */
export function validarTierList(d: NuevoTierList): string | null {
  const title = d.title.trim();
  if (!title) return 'La tier list necesita un título.';
  if (title.length > TIER_LIMITS.title) {
    return `El título no puede pasar de ${TIER_LIMITS.title} caracteres.`;
  }
  if (d.description.length > TIER_LIMITS.description) {
    return `La descripción no puede pasar de ${TIER_LIMITS.description} caracteres.`;
  }

  if (d.tiers.length < TIER_LIMITS.minTiers) {
    return 'La tier list necesita al menos un nivel.';
  }
  if (d.tiers.length > TIER_LIMITS.maxTiers) {
    return `Como máximo ${TIER_LIMITS.maxTiers} niveles.`;
  }

  const ids = new Set<string>();
  for (const t of d.tiers) {
    if (!t.id || ids.has(t.id)) return 'Hay niveles duplicados o sin identificador.';
    ids.add(t.id);
    if (!t.label.trim()) return 'Todos los niveles necesitan nombre.';
    if (t.label.trim().length > TIER_LIMITS.tierLabel) {
      return `El nivel "${t.label.trim().slice(0, 10)}…" es demasiado largo.`;
    }
    if (!colorValido(t.color)) return `El color de "${t.label.trim()}" no es válido.`;
  }

  if (d.items.length === 0) return 'Añade al menos un elemento a clasificar.';
  if (d.items.length > TIER_LIMITS.maxItems) {
    return `Como máximo ${TIER_LIMITS.maxItems} elementos.`;
  }

  const itemIds = new Set<string>();
  for (const item of d.items) {
    if (!item.id || itemIds.has(item.id)) return 'Hay elementos duplicados o sin identificador.';
    itemIds.add(item.id);
    if (!item.name.trim()) return 'Todos los elementos necesitan nombre.';
    if (item.name.trim().length > TIER_LIMITS.itemName) {
      return `El elemento "${item.name.trim().slice(0, 10)}…" es demasiado largo.`;
    }
    if (!item.imageUrl) return `A "${item.name.trim()}" le falta la imagen.`;
  }

  // Cada elemento tiene que estar colocado en un nivel que
  // exista o en el pool, exactamente una vez.
  const validos = new Set([...d.tiers.map((t) => t.id), 'pool']);
  const colocados = new Set<string>();
  for (const [itemId, tierId] of Object.entries(d.placement)) {
    if (!itemIds.has(itemId)) return 'Hay elementos colocados que ya no existen.';
    if (!validos.has(tierId)) return 'Hay elementos en un nivel que ya no existe.';
    if (colocados.has(itemId)) return 'Un elemento no puede estar en dos niveles.';
    colocados.add(itemId);
  }
  for (const id of itemIds) {
    if (!colocados.has(id)) return 'Hay elementos sin colocar.';
  }

  if (d.visibility !== 'public' && d.visibility !== 'club') {
    return 'La visibilidad no es válida.';
  }
  if (d.visibility === 'club' && !d.clubId) {
    return 'Falta el club que puede verla.';
  }

  return null;
}

/**
 * Mueve un elemento a otro nivel (o dentro del mismo).
 *
 * Devuelve `placement` y `poolOrder` nuevos, sin tocar el
 * original. `indice` es la posición dentro del destino (-1 =
 * al final).
 */
export function moverElemento(
  placement: Record<string, string>,
  poolOrder: Record<string, string[]>,
  itemId: string,
  destino: string,
  indice = -1,
): { placement: Record<string, string>; poolOrder: Record<string, string[]> } {
  const origen = placement[itemId] ?? 'pool';
  const nuevoPlacement = { ...placement, [itemId]: destino };
  const nuevoOrden: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(poolOrder)) {
    nuevoOrden[k] = v.filter((id) => id !== itemId);
  }
  if (!nuevoOrden[origen]) nuevoOrden[origen] = [];
  if (!nuevoOrden[destino]) nuevoOrden[destino] = [];
  const lista = nuevoOrden[destino];
  if (indice < 0 || indice >= lista.length) lista.push(itemId);
  else lista.splice(indice, 0, itemId);
  return { placement: nuevoPlacement, poolOrder: nuevoOrden };
}

/**
 * Quita un elemento de la clasificación (vuelve al pool si
 * estaba en un nivel, o se elimina del todo con `borrar`).
 */
export function quitarElemento(
  placement: Record<string, string>,
  poolOrder: Record<string, string[]>,
  itemId: string,
  borrar: boolean,
  items: TierItem[],
): {
  placement: Record<string, string>;
  poolOrder: Record<string, string[]>;
  items: TierItem[];
} {
  if (borrar) {
    const nuevoPlacement = { ...placement };
    delete nuevoPlacement[itemId];
    const nuevoOrden: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(poolOrder)) {
      nuevoOrden[k] = v.filter((id) => id !== itemId);
    }
    return { placement: nuevoPlacement, poolOrder: nuevoOrden, items: items.filter((i) => i.id !== itemId) };
  }
  return {
    ...moverElemento(placement, poolOrder, itemId, 'pool'),
    items,
  };
}

/** Borrador del editor (listas ordenadas, cómodo de editar). */
export interface EditorDraft {
  title: string;
  description: string;
  category: ClubCategory;
  tiers: TierRow[];
  items: TierItem[];
  placement: Record<string, string>;
  poolOrder: Record<string, string[]>;
  coverUrl?: string;
  voting: { enabled: boolean; allowChange: boolean };
  visibility: 'public' | 'club';
}

/** Del documento al borrador del editor (editar o plantilla). */
export function borradorDesdeDoc(tier: TierList): EditorDraft {
  return {
    title: tier.title,
    description: tier.description,
    category: tier.category,
    tiers: tiersOrdenados(tier.tiers),
    items: itemsComoLista(tier.items),
    placement: { ...tier.placement },
    poolOrder: Object.fromEntries(
      Object.entries(tier.poolOrder).map(([k, v]) => [k, [...v]]),
    ),
    ...(tier.coverUrl ? { coverUrl: tier.coverUrl } : {}),
    voting: { ...tier.voting },
    visibility: tier.visibility,
  };
}
/** Elementos de un nivel, en orden. */
export function elementosDe(
  items: TierItemMap,
  poolOrder: Record<string, string[]>,
  tierId: string,
): TierItem[] {
  return (poolOrder[tierId] ?? [])
    .map((id) => {
      const def = items[id];
      if (!def) return null;
      return { id, ...def };
    })
    .filter((i): i is TierItem => !!i);
}

/** Niveles ordenados para pintar o editar. */
export function tiersOrdenados(tiers: TierRowMap): TierRow[] {
  return Object.entries(tiers)
    .map(([id, def]) => ({ id, ...def }))
    .sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.id < b.id ? -1 : 1;
    });
}

/** Elementos como lista (para el editor). */
export function itemsComoLista(items: TierItemMap): TierItem[] {
  return Object.entries(items).map(([id, def]) => ({ id, ...def }));
}

/** Del editor (listas) al documento (mapas). */
export function aMapas(tiers: TierRow[], items: TierItem[]): {
  tiers: TierRowMap;
  items: TierItemMap;
} {
  const mapaTiers: TierRowMap = {};
  for (const t of tiers) {
    mapaTiers[t.id] = { label: t.label, color: t.color, order: t.order };
  }
  const mapaItems: TierItemMap = {};
  for (const item of items) {
    const { id, ...def } = item;
    mapaItems[id] = def;
  }
  return { tiers: mapaTiers, items: mapaItems };
}

/** Cuenta votos por nivel. */
export function contarVotos(votos: { tierId: string }[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const v of votos) {
    counts[v.tierId] = (counts[v.tierId] ?? 0) + 1;
  }
  return counts;
}
