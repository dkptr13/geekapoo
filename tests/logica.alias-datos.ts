/**
 * Alias de búsqueda: los datos del catálogo y la búsqueda inteligente.
 *
 * Los alias son los nombres por los que la gente busca una obra
 * ("Ataque a los Titanes", "Attack on Titan", "Shingeki no Kyojin").
 * Los pone a mano el agente que añade el anime, en
 * `scripts/datos/<prefijo>-meta.mjs`, como `ALIASES`, y se guardan en
 * `alternativeTitles` del documento de Firestore.
 *
 * Aquí se comprueba, sin red y contra la lógica real del buscador
 * (`src/utils/busqueda.ts`), que:
 *
 *   1. Cada alias encuentra SU ficha, y solo la suya.
 *   2. Un alias no es el título ni otro alias de OTRA obra: si lo
 *      fuera, buscarlo llevaría a dos fichas y la gente acabaría
 *      en la equivocada.
 *   3. Dentro de una ficha no se repiten alias: el buscador
 *      normaliza, así que dos que se leen igual sobran.
 *   4. Una ficha SIN alias sigue encontrándose por su título
 *      principal.
 *
 *   npx tsx tests/logica.alias-datos.ts
 */
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import {
  buscarConRelevancia,
  normalizarBusqueda,
  type CamposFicha,
} from '../src/utils/busqueda.ts';

const dir = new URL('../scripts/datos/', import.meta.url);

interface Ficha {
  id: string;
  prefijo: string;
  principal: string;
  japones: string;
  alias: string[];
}

const fichas: Ficha[] = [];

for (const fichero of readdirSync(dir).filter((f) => f.endsWith('-meta.mjs')).sort()) {
  const meta = await import(new URL(fichero, dir).href);
  const prefijo = fichero.replace('-meta.mjs', '');
  fichas.push({
    id: meta.ANIME_ID as string,
    prefijo,
    principal: meta.ANIME.titulo as string,
    japones: (meta.ANIME.japaneseTitle ?? '') as string,
    alias: Array.isArray(meta.ALIASES) ? (meta.ALIASES as string[]) : [],
  });
}

const conAlias = fichas.filter((f) => f.alias.length > 0);
const sinAlias = fichas.filter((f) => f.alias.length === 0);

assert.ok(conAlias.length > 0, 'no hay ningun anime con alias: el test no comprobaria nada');
assert.ok(sinAlias.length > 0, 'no hay ningun anime sin alias: falta el caso de las fichas viejas');

/** La ficha tal y como la ve el buscador. */
const camposDe = (f: Ficha): CamposFicha => ({
  principal: f.principal,
  originales: [f.japones],
  alias: f.alias,
});

// ── 1. Cada alias encuentra SU ficha ─────────────────────────
for (const ficha of conAlias) {
  for (const alias of ficha.alias) {
    const resultados = buscarConRelevancia(fichas, alias, camposDe);
    assert.ok(resultados.length > 0, `"${alias}" (${ficha.id}) no encuentra nada`);
    assert.equal(
      resultados[0].ficha.id,
      ficha.id,
      `"${alias}" lleva a ${resultados[0].ficha.id} en vez de a ${ficha.id}`,
    );
    // Y no puede haber dos fichas con el MISMO nombre en cabeza:
    // si empatan, la primera que llega se lleva el puesto y la
    // persona se va a la ficha equivocada.
    const empatadas = resultados.filter((r) => r.puntos === resultados[0].puntos);
    assert.equal(
      empatadas.length,
      1,
      `"${alias}" empata entre ${empatadas.map((e) => e.ficha.id).join(' y ')}`,
    );
  }
}

// ── 2. Un alias no puede ser el nombre de OTRA obra ──────────
//
// Se comparan ya normalizados, que es como los ve el buscador:
// "Hunter × Hunter" y "HUNTER×HUNTER" son el mismo texto.
const duenos = new Map<string, string>();

for (const ficha of fichas) {
  for (const titulo of [ficha.principal, ficha.japones, ...ficha.alias]) {
    const clave = normalizarBusqueda(titulo);
    if (!clave) continue;
    const dueno = duenos.get(clave);
    assert.ok(
      dueno === undefined || dueno === ficha.id,
      `"${titulo}" es a la vez de ${dueno} y de ${ficha.id}`,
    );
    if (dueno === undefined) duenos.set(clave, ficha.id);
  }
}

// ── 3. Sin repeticiones dentro de una ficha ─────────────────
for (const ficha of conAlias) {
  const vistos = new Set<string>();
  for (const alias of ficha.alias) {
    const clave = normalizarBusqueda(alias);
    assert.ok(!vistos.has(clave), `${ficha.id}: alias repetido "${alias}"`);
    vistos.add(clave);
  }
}

// ── 4. Las fichas sin alias siguen encontrándose ─────────────
for (const ficha of sinAlias) {
  const resultados = buscarConRelevancia(fichas, ficha.principal, camposDe);
  assert.ok(resultados.length > 0, `${ficha.id} no se encuentra por su titulo principal`);
  assert.equal(resultados[0].ficha.id, ficha.id, `${ficha.id} no sale el primero por su titulo`);
}

// ── Resumen ──────────────────────────────────────────────────
console.log(`Alias comprobados: ${conAlias.length} fichas con alias, ${sinAlias.length} sin alias.`);
console.log(`Nombres indexados: ${duenos.size}.`);
console.log('OK');
