/**
 * Comprobaciones de la lógica de Kapo-chan (mensajes, prioridad,
 * enfriados y recomendaciones), sin navegador ni emulador.
 *
 *   npm run test:logica
 *
 * Va en el mismo fichero que el de las reacciones porque comparte
 * el comando: las dos cosas se pueden comprobar en cero segundos y
 * sin nada desplegado, que es cuando más caros salen los errores
 * silenciosos (un mensaje que nunca sale, o una mascota que habla
 * sin parar).
 */
import assert from 'node:assert/strict';

import {
  KAPO_MENSAJES,
  KAPO_FALLBACK,
  contextoDesdeSeccion,
  type KapoContext,
} from '../src/data/kapoDialogues';
import {
  ENFRIADO_EVENTO_MS,
  ENFRIADO_MS,
  EVENTO_EN_PANTALLA_MS,
  debeMostrar,
  elegirMensaje,
  frasesDe,
  recomendacionDesdeActividad,
} from '../src/utils/kapo';

// ──────────────────────────────────────────────────────────
// 1. El banco está sano
// ──────────────────────────────────────────────────────────

const ids = KAPO_MENSAJES.map((m) => m.id);
assert.equal(
  ids.filter((id, i) => ids.indexOf(id) !== i).length,
  0,
  `ids de mensaje repetidos: ${ids.join(', ')}`,
);

const contextos: KapoContext[] = [
  'home',
  'wiki',
  'search',
  'community',
  'profile',
  'chats',
  'achievements',
  'trivia',
  'support',
  'first_thread',
  'first_comment',
  'level_up',
  'achievement',
  'trivia_done',
  'welcome_back',
  'poke',
];

for (const c of contextos) {
  assert.ok(
    frasesDe(c) >= 3,
    `el contexto "${c}" tiene ${frasesDe(c)} frases y debería tener al menos 3`,
  );
}

// ──────────────────────────────────────────────────────────
// 2. La sección se traduce al contexto
// ──────────────────────────────────────────────────────────

assert.equal(contextoDesdeSeccion('inicio'), 'home');
assert.equal(contextoDesdeSeccion('wiki'), 'wiki');
assert.equal(contextoDesdeSeccion('trivia'), 'trivia');
assert.equal(contextoDesdeSeccion('logros'), 'achievements');
assert.equal(contextoDesdeSeccion('perfil'), 'profile');
assert.equal(contextoDesdeSeccion('chats'), 'chats');
assert.equal(contextoDesdeSeccion('soporte'), 'support');
// "?tab=buscar" ya no existe: el buscador está dentro de la wiki y
// el Navbar lo redirige allí, así que esa pestaña vuelve a "inicio".
assert.equal(contextoDesdeSeccion('buscar'), 'home', 'el buscador ya no es sección');
// Cualquier sección desconocida cae en 'inicio' en vez de romperse.
assert.equal(contextoDesdeSeccion('no-existe'), 'home');
assert.equal(contextoDesdeSeccion(undefined), 'home');

// ──────────────────────────────────────────────────────────
// 3. Nunca repite el último mensaje
// ──────────────────────────────────────────────────────────

// Con una sola opción se repite, porque no hay alternativa. Se
// comprueba con un banco a medida para no depender de cuántos
// poke_ haya ahora mismo.
const unoSolo = KAPO_MENSAJES.filter((m) => m.context === 'poke').slice(0, 1);
assert.equal(
  elegirMensaje('poke', unoSolo[0].id, 0.99, unoSolo).id,
  unoSolo[0].id,
  'con una sola opción se repite',
);

// Con varias, nunca sale la misma dos veces seguidas. Se prueba
// con todos los valores de azar para que no dependa del azar.
const primero = elegirMensaje('home', null, 0).id;
for (let i = 0; i <= 20; i += 1) {
  const siguiente = elegirMensaje('home', primero, i / 20);
  assert.notEqual(siguiente.id, primero, 'nunca dos iguales seguidos');
  assert.equal(siguiente.context, 'home', 'y siempre del contexto pedido');
}

// Un contexto vacío devuelve el de reserva, no lanza.
assert.equal(elegirMensaje('nada' as KapoContext, null).id, KAPO_FALLBACK.id);

// ──────────────────────────────────────────────────────────
// 4. Prioridades: lo importante gana a lo normal
// ──────────────────────────────────────────────────────────

const normal = elegirMensaje('home', null, 0);
const nivel = KAPO_MENSAJES.find((m) => m.context === 'level_up')!;
const medalla = KAPO_MENSAJES.find((m) => m.context === 'achievement')!;

assert.ok(nivel.priority > medalla.priority, 'el nivel va por delante de la medalla');
assert.ok(medalla.priority > normal.priority, 'los eventos van por delante del contexto');
assert.equal(elegirMensaje('first_thread', null, 0).priority, 70);
assert.equal(normal.priority, 10, 'un mensaje de contexto vale 10');
assert.equal(
  KAPO_MENSAJES.find((m) => m.context === 'poke')!.priority,
  0,
  'el poke vale 0: es el único que puede interrumpir',
);

// ──────────────────────────────────────────────────────────
// 5. Los enfriados
// ──────────────────────────────────────────────────────────

// Invariante entre dos constantes de `utils/kapo`: si el tiempo
// en pantalla de un evento fuera MENOR que el enfriado de los
// normales, la protección del punto 4 de `debeMostrar` no
// serviría de nada (el normal ya habría esperado más que el tope).
assert.ok(
  EVENTO_EN_PANTALLA_MS > ENFRIADO_MS,
  `EVENTO_EN_PANTALLA_MS (${EVENTO_EN_PANTALLA_MS}) debe ser mayor que ENFRIADO_MS (${ENFRIADO_MS})`,
);

const ahora = 1_000_000;

// Primero siempre: no hay último, así que se dice.
assert.equal(debeMostrar(null, normal, ahora, null, ENFRIADO_MS), true);

// Dos mensajes seguidos muy rápido: el segundo NO sale (por eso
// existe el enfriado).
assert.equal(debeMostrar(normal, normal, ahora + 1000, ahora, ENFRIADO_MS), false);

// Pero si ha pasado el enfriado, sí.
assert.equal(debeMostrar(normal, normal, ahora + ENFRIADO_MS + 1, ahora, ENFRIADO_MS), true);

// Un evento importante NO espera al enfriado: si subes de nivel
// con la mascota en pleno mensaje, el aviso se pierde.
assert.equal(
  debeMostrar(normal, nivel, ahora + 1000, ahora, ENFRIADO_MS),
  true,
  'subir de nivel no espera al enfriado',
);
assert.equal(
  debeMostrar(normal, nivel, ahora + 1000, ahora, ENFRIADO_EVENTO_MS),
  true,
  'ni al enfriado corto de eventos',
);

// Dos mensajes del mismo peso, pasado el enfriado: sale el nuevo.
// Antes esto devolvía false y la mascota se quedaba muda para
// siempre después del primer mensaje de contexto, que es
// justo lo que este assert vigila.
assert.equal(debeMostrar(normal, normal, ahora + ENFRIADO_MS + 1, ahora, ENFRIADO_MS), true);

// Un mensaje normal NO pisa a un evento importante mientras este
// siga en pantalla...
assert.equal(
  debeMostrar(nivel, normal, ahora + ENFRIADO_MS + 1, ahora, ENFRIADO_MS),
  false,
  'el evento importante se queda un rato',
);
// ...pero sí cuando lleva demasiado tiempo, para que la mascota
// no se quede clavada en el mismo texto para siempre.
assert.equal(
  debeMostrar(nivel, normal, ahora + EVENTO_EN_PANTALLA_MS + 1, ahora, ENFRIADO_MS),
  true,
  'y a la larga se deja tapar',
);

// El poke sí, porque el usuario lo ha pedido.
assert.equal(
  debeMostrar(normal, KAPO_MENSAJES.find((m) => m.context === 'poke')!, ahora + 999999, ahora, ENFRIADO_MS),
  true,
  'el poke interrumpe',
);

// ──────────────────────────────────────────────────────────
// 6. La recomendación usa datos reales
// ──────────────────────────────────────────────────────────

const animes = {
  a1: { title: 'Frieren', category: 'Shonen', genres: ['Fantasía', 'Aventura'] },
  a2: { title: 'Cyberpunk', category: 'Cyberpunk', genres: ['Ciencia ficción'] },
};

// Sin actividad no hay recomendación. Es lo importante: es
// preferible que la mascota no opine a que diga un gusto que no
// se ha visto en ningún sitio.
assert.equal(recomendacionDesdeActividad(undefined, animes), null);
assert.equal(recomendacionDesdeActividad({}, animes), null);
assert.equal(recomendacionDesdeActividad({ a1: 3 }, animes), null, '3 XP no es actividad');

// Con actividad de verdad, sale el anime con más XP y su género.
const reco = recomendacionDesdeActividad({ a1: 120, a2: 40 }, animes);
assert.ok(reco && reco.includes('Frieren'), `debe nombrar Frieren: ${reco}`);
assert.ok(reco && reco.includes('Fantasía'), `debe decir el género: ${reco}`);
assert.ok(reco && !reco.includes('Cyberpunk'), 'solo habla del que más ha jugado');

// Un anime con XP pero que no está en el catálogo (borrado) no
// rompe nada: no dice nada.
assert.equal(recomendacionDesdeActividad({ borrado: 500 }, animes), null);

console.log('✓ lógica de Kapo-chan: todo correcto');
console.log(`  · ${KAPO_MENSAJES.length} frases en ${contextos.length} contextos`);
console.log('  · nunca repite la misma dos veces seguidas');
console.log('  · nivel > medalla > primer hito > contexto > poke');
console.log('  · los eventos importantes no esperan al enfriado');
console.log('  · sin actividad real no hay recomendación inventada');
