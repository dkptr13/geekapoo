import assert from 'node:assert/strict';

import {
  crearConsulta,
  leerPaginas,
  LIMITE_IN,
} from '../scripts/firestore-consultas.mjs';

const una: any = crearConsulta({
  coleccion: 'episodes',
  campo: 'animeId',
  valor: 'anime-a',
  campos: ['animeId', 'number', 'title'],
});
assert.equal(una.where.fieldFilter.op, 'EQUAL');
assert.equal(una.where.fieldFilter.value.stringValue, 'anime-a');
assert.equal(una.limit, 300);
assert.equal(una.select.fields.length, 3);

const varias: any = crearConsulta({
  coleccion: 'characters',
  campo: 'animeId',
  valor: ['anime-a', 'anime-b'],
});
assert.equal(varias.where.fieldFilter.op, 'IN');
assert.equal(varias.where.fieldFilter.value.arrayValue.values.length, 2);

assert.throws(
  () =>
    crearConsulta({
      coleccion: 'characters',
      campo: 'animeId',
      valor: Array.from({ length: LIMITE_IN + 1 }, (_, i) => `a-${i}`),
    }),
  /límite de 30/,
);

const cursor: any = crearConsulta({
  coleccion: 'episodes',
  campo: 'seasonId',
  valor: 'anime-a-s1',
  startAfter: 'projects/demo/databases/(default)/documents/episodes/e1',
});
assert.equal(cursor.startAt.before, false);
assert.equal(
  cursor.startAt.values[0].referenceValue,
  'projects/demo/databases/(default)/documents/episodes/e1',
);

let llamadas = 0;
const paginado = await leerPaginas(async ({
  startAfter,
}: {
  startAfter: string | null;
  limite: number;
}) => {
  llamadas += 1;

  if (!startAfter) return Array.from({ length: 300 }, (_, i) => ({ name: `a-${i}` }));
  if (startAfter === 'a-299') {
    return Array.from({ length: 20 }, (_, i) => ({ name: `b-${i}` }));
  }

  return [];
});

assert.equal(llamadas, 2);
assert.equal(paginado.consultas, 2);
assert.equal(paginado.documentos.length, 320);

console.log('logica.consultas: OK');
