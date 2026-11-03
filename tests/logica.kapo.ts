/**
 * Comprobaciones de la lógica de Kapo-chan (mensajes, prioridad,
 * enfriados, conversaciones, preferencias y eventos), sin navegador
 * ni emulador.
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
  PRIORIDAD,
  contextoDesdeSeccion,
  type KapoContext,
} from '../src/data/kapoDialogues';
import {
  KAPO_CONVERSACIONES,
  conversacionPorId,
  conversacionesDe,
  elegirConversacion,
  type KapoOpcion,
} from '../src/data/kapoConversations';
import {
  ENFRIADO_EVENTO_MS,
  ENFRIADO_MS,
  EVENTO_EN_PANTALLA_MS,
  contextoDeMedalla,
  debeMostrar,
  elegirMensaje,
  frasesDe,
  mensajeDeNotificacion,
  recomendacionDesdeActividad,
} from '../src/utils/kapo';
import {
  PREFERENCIAS_POR_DEFECTO,
  SECCIONES_DESCUBRIBLES,
  etiquetaFrecuencia,
  intervaloEspontaneoMs,
  leerPreferencias,
  normalizarPreferencias,
  pausaTrasCierreMs,
  registrarVisita,
  seccionPorDescubrir,
} from '../src/utils/kapoPrefs';

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
  'extras',
  'admin',
  'settings',
  'first_thread',
  'first_comment',
  'first_message',
  'club',
  'reaction',
  'login',
  'register',
  'level_up',
  'achievement',
  'trivia_done',
  'welcome_back',
  'error',
  'idle',
  'spontaneous',
  'discovery',
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
// Estas tres antes caían en "achievements" y la mascota hablaba de
// medallas mientras el usuario estaba en Extras o en el panel.
assert.equal(contextoDesdeSeccion('extras'), 'extras');
assert.equal(contextoDesdeSeccion('admin'), 'admin');
assert.equal(contextoDesdeSeccion('ajustes'), 'settings');
// El buscador se fusionó en la wiki, pero la traducción directa
// sigue existiendo por si llega un enlace antiguo.
assert.equal(contextoDesdeSeccion('buscar'), 'search');
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

// La memoria de sesión evita repetir lo que acaba de salir, no solo
// el último. Hay ocho frases en Inicio, así que tres recientes
// siguen dejando margen.
const recientes = KAPO_MENSAJES.filter((m) => m.context === 'home')
  .slice(0, 3)
  .map((m) => m.id);
for (let i = 0; i <= 20; i += 1) {
  const elegido = elegirMensaje('home', null, i / 20, KAPO_MENSAJES, recientes);
  assert.ok(
    !recientes.includes(elegido.id),
    `no debe repetir un mensaje reciente: ${elegido.id}`,
  );
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
assert.equal(PRIORIDAD.reaction, 62, 'una reacción es un evento social');
assert.ok(PRIORIDAD.reaction > PRIORIDAD.error, 'una reacción pesa más que un error');
assert.equal(PRIORIDAD.error, 45, 'el error respeta el enfriado de los normales');
assert.ok(PRIORIDAD.spontaneous < PRIORIDAD.context, 'lo espontáneo espera al contexto');

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

// Un espontáneo no pisa un mensaje de contexto recién puesto.
const espontaneo = KAPO_MENSAJES.find((m) => m.context === 'spontaneous')!;
assert.equal(
  debeMostrar(normal, espontaneo, ahora + ENFRIADO_MS + 1, ahora, ENFRIADO_MS),
  false,
  'lo espontáneo espera a que el contexto se asiente',
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

// ──────────────────────────────────────────────────────────
// 7. Conversaciones con opciones
// ──────────────────────────────────────────────────────────

const idsConversacion = KAPO_CONVERSACIONES.map((c) => c.id);
assert.equal(
  idsConversacion.filter((id, i) => idsConversacion.indexOf(id) !== i).length,
  0,
  `ids de conversación repetidos: ${idsConversacion.join(', ')}`,
);

function comprobarOpciones(opciones: KapoOpcion[], ruta: string): void {
  assert.ok(opciones.length >= 2, `${ruta} debe ofrecer al menos dos respuestas`);
  const idsOpcion = opciones.map((o) => o.id);
  assert.equal(
    idsOpcion.filter((id, i) => idsOpcion.indexOf(id) !== i).length,
    0,
    `${ruta} tiene ids de opción repetidos`,
  );
  for (const opcion of opciones) {
    assert.ok(opcion.texto.trim().length > 0, `${ruta}: opción sin texto`);
    assert.ok(
      opcion.respuesta.trim().length >= 8,
      `${ruta}: "${opcion.texto}" no tiene una respuesta de verdad`,
    );
    if (opcion.seguimiento) {
      comprobarOpciones(opcion.seguimiento, `${ruta}/${opcion.id}`);
    }
  }
}

for (const conversacion of KAPO_CONVERSACIONES) {
  assert.ok(conversacion.apertura.trim().length > 10, `${conversacion.id}: apertura corta`);
  assert.ok(
    conversacion.contextos === 'todas' || conversacion.contextos.length > 0,
    `${conversacion.id}: sin contextos`,
  );
  comprobarOpciones(conversacion.opciones, conversacion.id);
}

// Hay conversaciones propias en las secciones importantes, no solo
// la genérica de "descubrir".
assert.ok(conversacionesDe('home').some((c) => c.id === 'que_ves'));
assert.ok(conversacionesDe('chats').some((c) => c.id === 'chat_consejo'));
assert.ok(conversacionesDe('admin').some((c) => c.id === 'admin_pausa'));
assert.ok(conversacionesDe('trivia').some((c) => c.id === 'trivia_reto'));
assert.ok(conversacionPorId('nuevo'), 'la bienvenida de cuenta nueva existe');

// Elegir conversación tampoco repite la última.
const convPrimera = elegirConversacion('home', null, 0);
assert.ok(convPrimera, 'Inicio debe tener conversaciones');
for (let i = 0; i <= 20; i += 1) {
  const siguiente = elegirConversacion('home', convPrimera!.id, i / 20);
  assert.ok(siguiente);
  assert.notEqual(siguiente!.id, convPrimera!.id, 'no repite la misma conversación seguida');
}
// Un contexto desconocido cae en las conversaciones comodín, no
// en un error: la mascota siempre tiene algo que ofrecer.
const comodin = elegirConversacion('nada' as KapoContext, null, 0);
assert.ok(comodin);
assert.equal(comodin!.contextos, 'todas');

// ──────────────────────────────────────────────────────────
// 8. Preferencias locales (sin Firebase)
// ──────────────────────────────────────────────────────────

// En Node no hay window: se devuelven los valores por defecto sin
// lanzar. Es justo lo que queremos si el navegador bloquea el
// almacenamiento local.
const porDefecto = leerPreferencias();
assert.equal(porDefecto.espontaneos, true);
assert.equal(porDefecto.frecuencia, 'normal');
assert.deepEqual(porDefecto.visitadas, []);
assert.notEqual(porDefecto.visitadas, PREFERENCIAS_POR_DEFECTO.visitadas, 'sin arrays compartidos');

// Un JSON roto o con tipos raros se normaliza, no rompe.
const sucio = normalizarPreferencias({
  espontaneos: 'sí',
  frecuencia: 'cada_minuto',
  ultimoCierreMs: 'ayer',
  visitadas: ['wiki', 'wiki', 7, 'trivia'],
});
assert.equal(sucio.espontaneos, true);
assert.equal(sucio.frecuencia, 'normal');
assert.equal(sucio.ultimoCierreMs, null);
assert.deepEqual(sucio.visitadas, ['wiki', 'trivia']);

// Los ritmos tienen que ir de menos a más y las pausas también:
// si "discreto" hablara más que "charlatán", el botón mentiría.
assert.ok(intervaloEspontaneoMs('discreta') > intervaloEspontaneoMs('normal'));
assert.ok(intervaloEspontaneoMs('normal') > intervaloEspontaneoMs('parlanchina'));
assert.ok(pausaTrasCierreMs('discreta') > pausaTrasCierreMs('normal'));
assert.ok(pausaTrasCierreMs('normal') > pausaTrasCierreMs('parlanchina'));
assert.equal(etiquetaFrecuencia('discreta'), 'discreto');
assert.equal(etiquetaFrecuencia('normal'), 'normal');
assert.equal(etiquetaFrecuencia('parlanchina'), 'charlatán');

// Visitar dos veces no duplica ni crea un objeto nuevo.
const unaVisita = registrarVisita(PREFERENCIAS_POR_DEFECTO, 'wiki');
assert.deepEqual(unaVisita.visitadas, ['wiki']);
assert.equal(registrarVisita(unaVisita, 'wiki'), unaVisita);
assert.deepEqual(registrarVisita(unaVisita, 'trivia').visitadas, ['wiki', 'trivia']);
assert.equal(registrarVisita(unaVisita, null), unaVisita);

// No recomendar una sección que ya se ha visitado.
const pendiente = seccionPorDescubrir(['wiki', 'trivia'], SECCIONES_DESCUBRIBLES, 0);
assert.ok(pendiente);
assert.ok(!['wiki', 'trivia'].includes(pendiente!.seccion));
assert.equal(
  seccionPorDescubrir(SECCIONES_DESCUBRIBLES.map((s) => s.seccion), SECCIONES_DESCUBRIBLES, 0),
  null,
  'si ya las conoce todas, no se inventa una',
);

// ──────────────────────────────────────────────────────────
// 9. Notificaciones y medallas reales
// ──────────────────────────────────────────────────────────

const respuesta = mensajeDeNotificacion({ type: 'comment_reply', actorName: 'Mika' });
assert.ok(respuesta);
assert.equal(respuesta!.context, 'community');
assert.ok(respuesta!.text.includes('Mika'));

const reaccion = mensajeDeNotificacion({ type: 'post_like', actorName: 'Kaguya' });
assert.ok(reaccion);
assert.equal(reaccion!.context, 'reaction');
assert.ok(reaccion!.text.includes('Kaguya'));

const follow = mensajeDeNotificacion({ type: 'follow', actorName: '' });
assert.ok(follow);
assert.ok(follow!.text.includes('Alguien'), 'sin nombre no se inventa uno');

const trivia = mensajeDeNotificacion({ type: 'trivia', actorName: 'x' });
assert.ok(trivia);
assert.equal(trivia!.context, 'trivia_done');

// Los niveles y medallas ya los cuenta Progression; las sanciones
// no se airean en un bocadillo.
assert.equal(mensajeDeNotificacion({ type: 'level_up', actorName: 'x' }), null);
assert.equal(mensajeDeNotificacion({ type: 'achievement', actorName: 'x' }), null);
assert.equal(mensajeDeNotificacion({ type: 'club_sanction', actorName: 'x' }), null);

assert.equal(contextoDeMedalla('medal_primer_hilo'), 'first_thread');
assert.equal(contextoDeMedalla('medal_primera_voz'), 'first_comment');
assert.equal(contextoDeMedalla('medal_fundador_club'), 'club');
assert.equal(contextoDeMedalla('medal_conector_social'), 'chats');
assert.equal(contextoDeMedalla('medal_cualquiera'), 'achievement');

console.log('✓ lógica de Kapo-chan: todo correcto');
console.log(`  · ${KAPO_MENSAJES.length} frases en ${contextos.length} contextos`);
console.log(`  · ${KAPO_CONVERSACIONES.length} conversaciones con respuestas`);
console.log('  · nunca repite lo último ni lo reciente');
console.log('  · nivel > medalla > primer hito > reacción > contexto > espontáneo > poke');
console.log('  · los eventos importantes no esperan al enfriado');
console.log('  · preferencias, visitas y silencio se guardan en local');
console.log('  · sin actividad real no hay recomendación inventada');
