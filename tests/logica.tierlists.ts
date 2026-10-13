/**
 * Lógica pura de las tier lists (ver `src/utils/tierlists.ts`).
 *
 * Sin navegador ni Firebase: lo que decide si un borrador vale
 * y cómo se mueven los elementos, que es justo lo que no se ve
 * en la consola cuando falla.
 *
 *   npx tsx tests/logica.tierlists.ts
 */
import assert from 'node:assert/strict';

import {
  COLORES_NIVEL,
  aMapas,
  colorValido,
  contarVotos,
  elementosDe,
  itemsComoLista,
  moverElemento,
  nivelesIniciales,
  quitarElemento,
  tiersOrdenados,
  validarTierList,
} from '../src/utils/tierlists';
import type { TierItem } from '../src/types';

// Los niveles iniciales son S/A/B/C/D/F con color.
const niveles = nivelesIniciales();
assert.deepEqual(
  niveles.map((n) => n.label),
  ['S', 'A', 'B', 'C', 'D', 'F'],
);
assert.equal(niveles.length, 6);
assert.ok(niveles.every((n) => colorValido(n.color)));
assert.ok(COLORES_NIVEL.length > 0);

// Colores: hex de 3 o 6, nada más.
assert.equal(colorValido('#ff7f7f'), true);
assert.equal(colorValido('#FFF'), true);
assert.equal(colorValido('red'), false);
assert.equal(colorValido('#gggggg'), false);
assert.equal(colorValido(''), false);

// Un borrador mínimo vale.
const base = {
  title: 'Mejores openings',
  description: '',
  category: 'anime-manga' as const,
  tiers: nivelesIniciales(),
  items: [{ id: 'i1', name: 'Unravel', imageUrl: 'https://x/y.jpg' }],
  placement: { i1: 'pool' },
  poolOrder: { pool: ['i1'] },
  visibility: 'public' as const,
  voting: { enabled: false, allowChange: false },
};
assert.equal(validarTierList(base), null);

// Sin título, sin niveles o sin elementos no vale.
assert.ok(validarTierList({ ...base, title: '  ' }) !== null);
assert.ok(validarTierList({ ...base, tiers: [] }) !== null);
assert.ok(validarTierList({ ...base, items: [] }) !== null);

// Un elemento sin colocar no vale, y uno en un nivel
// inexistente tampoco.
assert.ok(validarTierList({ ...base, placement: {} }) !== null);
assert.ok(validarTierList({ ...base, placement: { i1: 't99' } }) !== null);

// Club sin club no vale.
assert.ok(
  validarTierList({ ...base, visibility: 'club' as const }) !== null,
);
assert.equal(
  validarTierList({ ...base, visibility: 'club' as const, clubId: 'c1' }),
  null,
);

// Mover entre niveles actualiza colocación y orden.
const items: TierItem[] = [
  { id: 'i1', name: 'A', imageUrl: 'u1' },
  { id: 'i2', name: 'B', imageUrl: 'u2' },
];
let estado = moverElemento({ i1: 'pool', i2: 'pool' }, { pool: ['i1', 'i2'] }, 'i1', 't1');
assert.equal(estado.placement.i1, 't1');
assert.deepEqual(estado.poolOrder.pool, ['i2']);
assert.deepEqual(estado.poolOrder.t1, ['i1']);

// Mover dentro del mismo nivel reordena.
estado = moverElemento(
  { i1: 't1', i2: 't1' },
  { t1: ['i1', 'i2'] },
  'i2',
  't1',
  0,
);
assert.deepEqual(estado.poolOrder.t1, ['i2', 'i1']);

// No muta el original.
const coloc = { i1: 'pool' };
const orden = { pool: ['i1'] };
moverElemento(coloc, orden, 'i1', 't1');
assert.deepEqual(coloc, { i1: 'pool' });
assert.deepEqual(orden, { pool: ['i1'] });

// Quitar manda al pool; borrar elimina del todo.
const q1 = quitarElemento({ i1: 't1' }, { t1: ['i1'], pool: [] }, 'i1', false, items);
assert.equal(q1.placement.i1, 'pool');
assert.deepEqual(q1.poolOrder.pool, ['i1']);
const q2 = quitarElemento({ i1: 't1', i2: 'pool' }, { t1: ['i1'], pool: ['i2'] }, 'i1', true, items);
assert.ok(!('i1' in q2.placement));
assert.equal(q2.items.length, 1);

// elementosDe respeta el orden y salta ids rotos.
const mapaItems = {
  i1: { name: 'A', imageUrl: 'u1' },
  i2: { name: 'B', imageUrl: 'u2' },
};
assert.deepEqual(
  elementosDe(mapaItems, { t1: ['i2', 'i1', 'roto'] }, 't1').map((i) => i.id),
  ['i2', 'i1'],
);

// Conversión editor <-> documento no pierde nada.
const { tiers: mapaTiers, items: mapaItems2 } = aMapas(nivelesIniciales(), items);
assert.equal(Object.keys(mapaTiers).length, 6);
assert.equal(mapaTiers.t1.label, 'S');
assert.deepEqual(
  tiersOrdenados(mapaTiers).map((t) => t.id),
  ['t1', 't2', 't3', 't4', 't5', 't6'],
);
assert.deepEqual(
  itemsComoLista(mapaItems2).map((i) => i.id),
  ['i1', 'i2'],
);

// Contar votos por nivel.
assert.deepEqual(contarVotos([{ tierId: 't1' }, { tierId: 't1' }, { tierId: 't2' }]), {
  t1: 2,
  t2: 1,
});

console.log('tier lists: OK');
