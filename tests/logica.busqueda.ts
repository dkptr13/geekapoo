/**
 * Búsqueda inteligente de la wiki: alias, tolerancia a erratas
 * y relevancia.
 *
 * Lógica pura de `src/utils/busqueda.ts`, con fichas de
 * mentira. Los alias reales los pone `scripts/rellenar-alias.mjs`
 * desde AniList; aquí se comprueba que, existiendo, se usan en
 * el orden correcto.
 *
 *   npx tsx tests/logica.busqueda.ts
 */
import assert from 'node:assert/strict';
import {
  buscarConRelevancia,
  buscarPreparadas,
  claveSinEspacios,
  distanciaEdicion,
  normalizarBusqueda,
  prepararFicha,
  puntuarFicha,
  puntuarPreparada,
  similitudTextos,
  type CamposFicha,
} from '../src/utils/busqueda.ts';

// ── Normalización ─────────────────────────────────────────
// Minúsculas, espacios, tildes y puntuación no distinguen.
// La romanización común tampoco ("kyoujin" = "kyojin").
assert.equal(normalizarBusqueda('  Shingeki   NO KYOUJIN '), 'shingeki no kyojin');
assert.equal(normalizarBusqueda('Kimi no Na wa.'), 'kimi no na wa');
assert.equal(normalizarBusqueda('Évasion'), 'evasion');
assert.equal(normalizarBusqueda('SPY×FAMILY'), 'spy family');
assert.equal(normalizarBusqueda('Re:Zero'), 're zero');
assert.equal(normalizarBusqueda(123), '');
assert.equal(claveSinEspacios('SPY×FAMILY'), 'spyfamily');

// ── Distancia ─────────────────────────────────────────────
// "atack" está a 1 de "attack"; con tope corto no se calcula.
assert.equal(distanciaEdicion('atack', 'attack', 3), 1);
assert.equal(distanciaEdicion('attack', 'attack', 3), 0);
assert.equal(distanciaEdicion('abc', 'xyzxyz', 2), 3);
assert.ok(similitudTextos('atack', 'attack') > 0.8);
assert.ok(similitudTextos('titan', 'ninja') < 0.5);

// ── Fichas de mentira ─────────────────────────────────────
const ataque: CamposFicha = {
  principal: 'Ataque a los Titanes',
  originales: ['Shingeki no Kyojin'],
  alias: ['Attack on Titan'],
  claves: ['Eren lucha contra titanes', 'Acción', 'Wit Studio'],
};
const slayer: CamposFicha = {
  principal: 'Guardianes de la Noche',
  originales: ['Kimetsu no Yaiba'],
  alias: ['Demon Slayer'],
  claves: ['Tanjiro caza demonios', 'Acción', 'ufotable'],
};
const vecino: CamposFicha = {
  principal: 'Mi Vecino Totoro',
  originales: ['Tonari no Totoro'],
  claves: ['Dos niñas en el campo', 'Fantasía', 'Ghibli'],
};

// Los cuatro nombres encuentran la misma ficha, sin duplicarla.
for (const q of ['Ataque a los Titanes', 'Attack on Titan', 'Shingeki no Kyojin', 'Shingeki no Kyoujin']) {
  const top = buscarConRelevancia([slayer, ataque, vecino], q, (f) => f)[0];
  assert.equal(top.ficha, ataque, q);
}

// Prioridad: exacta principal > exacta alias > exacta original.
assert.ok(
  puntuarFicha('ataque a los titanes', ataque) > puntuarFicha('attack on titan', ataque),
);
assert.ok(
  puntuarFicha('attack on titan', ataque) > puntuarFicha('shingeki no kyojin', ataque),
);

// Parcial de título por encima de palabra clave, y la clave
// por encima de la difusa.
const parcial = puntuarFicha('ataque', ataque);
const clave = puntuarFicha('wit studio', ataque);
const difusa = puntuarFicha('atack on titan', ataque);
assert.ok(parcial > clave, `parcial ${parcial} > clave ${clave}`);
assert.ok(clave > difusa, `clave ${clave} > difusa ${difusa}`);
assert.ok(difusa > 0, 'la errata encuentra');

// Tokens en otro orden y sin partículas también valen.
assert.ok(puntuarFicha('attack titan', ataque) >= 350);
assert.ok(puntuarFicha('titanes ataque', ataque) >= 350);

// Erratas pequeñas: letra de más, de menos o cambiada.
assert.ok(puntuarFicha('shigeki no kyojin', ataque) > 0);
assert.ok(puntuarFicha('jujutsu kaisen', { principal: 'Jujutsu Kaisen' }) >= 500);
assert.ok(
  puntuarFicha('jujutsu kaisen', { principal: 'Jujutsu Kaisen' }) >
    puntuarFicha('jujutsu kaisen', { principal: 'Jujutsu Kaisen 0' }),
);

// Los apodos con lectura entre paréntesis valen sin ella:
// "Okarin (オカリン)" es "Okarin" exacto.
assert.ok(
  puntuarFicha('okarin', { principal: 'Rintarou Okabe', alias: ['Okarin (オカリン)'] }) >= 450,
);

// Sin alias no se rompe: el principal sigue encontrando.
assert.ok(puntuarFicha('mi vecino totoro', vecino) >= 500);
assert.ok(puntuarFicha('tonari no totoro', vecino) > 0);

// Ruido corto no dispara la difusa ("ax" no es "Sao"; "ao" en
// "Sao" sí es subcadena y conserva el comportamiento de siempre).
assert.equal(puntuarFicha('ax', { principal: 'Sao' }), 0);
assert.equal(puntuarFicha('', ataque), 0);
assert.equal(puntuarFicha('zzz sin sentido', ataque), 0);

// "Kimetsu no Yaiba" encuentra su ficha por el original, por
// delante de coincidencias parciales de otras.
const topYaiba = buscarConRelevancia([slayer, ataque], 'Kimetsu no Yaiba', (f) => f);
assert.equal(topYaiba[0].ficha, slayer);

// Orden de relevancia: exacta primero aunque llegue después,
// y a igual puntos no se repite nadie.
const ranking = buscarConRelevancia([vecino, slayer, ataque], 'demon slayer', (f) => f);
assert.equal(ranking[0].ficha, slayer);
assert.equal(new Set(ranking.map((r) => r.ficha)).size, ranking.length);

// La ficha preparada puntúa igual que la directa: el índice
// solo adelanta trabajo, no cambia resultados.
for (const ficha of [ataque, slayer, vecino]) {
  for (const q of ['attack on titan', 'shigeki', 'demon', 'zzz sin sentido', 'a']) {
    assert.equal(
      puntuarPreparada(normalizarBusqueda(q), prepararFicha(ficha)),
      puntuarFicha(q, ficha),
      `${q} / ${ficha.principal}`,
    );
  }
}
const idx = [ataque, slayer, vecino].map((ficha) => ({ ficha, lista: prepararFicha(ficha) }));
assert.deepEqual(
  buscarPreparadas(idx, normalizarBusqueda('demon slayer')).map((r) => r.ficha),
  buscarConRelevancia([vecino, slayer, ataque], 'demon slayer', (f) => f).map((r) => r.ficha),
);

console.log('  busqueda: TODO CORRECTO');
