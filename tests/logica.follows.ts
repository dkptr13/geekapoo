/**
 * Comprobaciones de la LÓGICA de seguimientos, sin navegador y sin
 * emulador.
 *
 * Existe porque el botón de "Seguir" es la clase de cosa que se
 * rompe sin que salte ningún error: si el estado se pinta mal, la
 * web sigue funcionando, el botón está ahí, y lo único que pasa es
 * que el usuario no sabe si sigue a alguien o no. Un `console.log`
 * vacío no lo delata.
 *
 * Se separa del servicio (`services/follows.ts`) por el mismo motivo
 * que `reactionLogic` y `notificaciones`: lo que se puede decidir sin
 * red se comprueba en cero segundos.
 *
 *   npm run test:logica
 */
import assert from 'node:assert/strict';

import {
  estadoBotonSeguir,
  etiquetaLista,
  formatearNumero,
  ordenarParaMostrar,
  pedirConfirmacionAlDejarDeSeguir,
  sePuedeSeguir,
  textoContadores,
} from '../src/utils/follows';
import { PAGINA_SEGUIDORES, PASO_SEGUIDOS } from '../src/types/follows';

// ──────────────────────────────────────────────────────────
// 1. Los números
// ──────────────────────────────────────────────────────────

// El formato del enunciado: "1.284 seguidores · 347 seguidos".
// El separador de miles en español es el punto, y el habitual
// (espacio fino) se copia como un espacio normal en algunos
// navegadores.
assert.equal(formatearNumero(1284), '1.284');
assert.equal(formatearNumero(347), '347');
assert.equal(formatearNumero(999), '999');
assert.equal(formatearNumero(1000), '1.000');
assert.equal(formatearNumero(1000000), '1.000.000');

// Un contador roto (undefined, NaN, negativo) tiene que enseñar 0 y
// no "NaN". Los contadores los escribe una Cloud Function, así que
// un `null` o un `NaN` son cosas que pueden ocurrir de verdad.
assert.equal(formatearNumero(0), '0');
assert.equal(formatearNumero(-5), '0');
assert.equal(formatearNumero(NaN), '0');
assert.equal(formatearNumero(Infinity), '0');

assert.equal(
  textoContadores({ followersCount: 1284, followingCount: 347 }),
  '1.284 seguidores · 347 seguidos',
);
assert.equal(
  textoContadores({ followersCount: 0, followingCount: 0 }),
  '0 seguidores · 0 seguidos',
);

assert.equal(etiquetaLista(1284, true), '1.284 seguidores');
assert.equal(etiquetaLista(347, false), '347 seguidos');

// ──────────────────────────────────────────────────────────
// 2. A quién se puede seguir
// ──────────────────────────────────────────────────────────

// El caso normal.
assert.equal(sePuedeSeguir({ miUid: 'a', suUid: 'b' }), true);

// Seguirse a sí mismo: no, y no por estética. Un self-follow
// sumaría un seguidor sin que hubiera nadie detrás, y la Cloud
// Function lo pagaría como si fuera real.
assert.equal(
  sePuedeSeguir({ miUid: 'a', suUid: 'a' }),
  false,
  'nadie puede seguirse a si mismo',
);

// Sin sesión: lo cubre `requireAuth`, que abre el login. Aquí no se
// permite porque "seguir" necesita un autor.
assert.equal(sePuedeSeguir({ miUid: null, suUid: 'b' }), false);

// Una cuenta baneada no aparece en el directorio (`AuthContext` las
// filtra), así que tampoco debería poder seguirse.
assert.equal(
  sePuedeSeguir({ miUid: 'a', suUid: 'b', estaBaneado: true }),
  false,
  'una cuenta baneada no se puede seguir',
);

// Y `undefined` (el campo no está en el documento) NO es baneado: se
// puede seguir. Es la diferencia entre "no hay campo" y "vale
// false", y confundirla dejaría a la mayoría de cuentas sin poder
// seguir a nadie.
assert.equal(sePuedeSeguir({ miUid: 'a', suUid: 'b', estaBaneado: undefined }), true);

// Sin uid de destino no hay a quién.
assert.equal(sePuedeSeguir({ miUid: 'a', suUid: null }), false);

// ──────────────────────────────────────────────────────────
// 3. El estado del botón
// ──────────────────────────────────────────────────────────

// No lo sigue: la acción principal, la que tiene que verse clara.
const paraSeguir = estadoBotonSeguir({ siguiendo: false, cargando: false, miUid: 'a' });
assert.equal(paraSeguir.texto, 'Seguir');
assert.equal(paraSeguir.estilo, 'primario');
assert.equal(paraSeguir.deshabilitado, false, 'un boton de seguir sin seguir esta activo');

// Lo sigue: un estado, no un boton de confirmar. El texto NO es
// "Dejar de seguir": un boton que cambia de ancho al pulsarse
// empuja el titulo equipado y el boton de ajustes de la cabecera.
const yaSigue = estadoBotonSeguir({ siguiendo: true, cargando: false, miUid: 'a' });
assert.equal(yaSigue.texto, 'Siguiendo');
assert.notEqual(
  yaSigue.texto,
  'Dejar de seguir',
  'la etiqueta no debe cambiar al pulsarse: mueve la maquetacion',
);
assert.equal(yaSigue.deshabilitado, false);

// Cargando: deshabilitado SIEMPRE, y con el texto del estado que se
// cree. Poner "Seguir" mientras carga haria que un clic rapido
// creara una relacion duplicada.
const cargandoNoSigue = estadoBotonSeguir({ siguiendo: false, cargando: true, miUid: 'a' });
assert.equal(cargandoNoSigue.deshabilitado, true, 'mientras carga no se puede pulsar');
assert.notEqual(cargandoNoSigue.texto, 'Seguir', 'no debe ofrecer seguir antes de saber el estado');

const cargandoSigue = estadoBotonSeguir({ siguiendo: true, cargando: true, miUid: 'a' });
assert.equal(cargandoSigue.deshabilitado, true);
assert.equal(cargandoSigue.texto, 'Siguiendo', 'si se cree que se sigue, se dice "Siguiendo"');

// Sin sesion: el texto dice por que, no parece un boton roto.
const sinSesion = estadoBotonSeguir({ siguiendo: false, cargando: false, miUid: null });
assert.equal(sinSesion.deshabilitado, true);
assert.ok(
  sinSesion.texto.toLowerCase().includes('sesi'),
  'sin sesion el texto debe explicar que hay que iniciar sesion',
);

// ──────────────────────────────────────────────────────────
// 4. La confirmacion al dejar de seguir
// ──────────────────────────────────────────────────────────

// Seguir NO se pregunta. Es un clic y el efecto es inmediato:
// preguntar por eso seria una molestia para un gesto reversible.
assert.equal(
  pedirConfirmacionAlDejarDeSeguir(false, false),
  null,
  'seguir no se pregunta',
);

// Dejar de seguir SI se pregunta, y con el motivo a la vista: sin
// saber que pasa, el usuario no puede decidir.
const preguntar = pedirConfirmacionAlDejarDeSeguir(true, false);
assert.ok(preguntar?.preguntar, 'dejar de seguir se pregunta');
assert.ok((preguntar?.motivo ?? '').length > 10, 'y con un motivo, no un "estas seguro"');

// Si ya confirmo, no se pregunta otra vez (el segundo clic es el
// "Si").
assert.equal(
  pedirConfirmacionAlDejarDeSeguir(true, true),
  null,
  'una vez confirmado, el siguiente clic es el si',
);

// ──────────────────────────────────────────────────────────
// 5. El orden de la lista
// ──────────────────────────────────────────────────────────

// Por nivel, y no por fecha: a quien mira los seguidores de alguien
// no le interesa cuando empezo a seguirle, sino quien es.
const ordenados = ordenarParaMostrar(
  [
    { id: 'c', nivel: 3, nombre: 'C' },
    { id: 'a', nivel: 20, nombre: 'A' },
    { id: 'b', nivel: 3, nombre: 'B' },
  ],
  (x) => x.nivel,
  (a, b) => a.nombre.localeCompare(b.nombre),
);
assert.deepEqual(
  ordenados.map((x) => x.id),
  ['a', 'b', 'c'],
  'el de mas nivel va primero, y a igual nivel por el comparador',
);

// Los que no estan en el directorio (nivel 0) van al final, pero NO
// desaparecen: la relacion existe, y si la fila se escondiera el
// contador no cuadraria con lo que se ve.
const conHuerfano = ordenarParaMostrar(
  [
    { id: 'x', nivel: 0, nombre: 'X' },
    { id: 'a', nivel: 1, nombre: 'A' },
  ],
  (x) => x.nivel,
  (a, b) => a.nombre.localeCompare(b.nombre),
);
assert.equal(conHuerfano.length, 2, 'nadie desaparece de la lista');
assert.equal(conHuerfano[1].id, 'x', 'el que no se encuentra va al final');

// Y no muta el array original: el estado de React debe ser un array
// NUEVO o React no se entera de que cambio.
const original = [
  { id: 'b', nivel: 1 },
  { id: 'a', nivel: 9 },
];
const copia = ordenarParaMostrar(
  original,
  (x) => x.nivel,
  () => 0,
);
assert.notEqual(copia, original, 'no se puede devolver el mismo array');
assert.equal(original[0].id, 'b', 'el array original no se toca');

// ──────────────────────────────────────────────────────────
// 6. La paginacion
// ──────────────────────────────────────────────────────────

// 25 es lo que cabe en dos scrolls en un movil. Lo que importa es
// que sea un numero de LISTA y no un valor enorme: si esto se
// cambia a 5000, el modal vuelve a traerse cinco mil perfiles de una
// vez, que es justo lo que la paginacion evita.
assert.ok(
  PAGINA_SEGUIDORES > 0 && PAGINA_SEGUIDORES <= 50,
  'la pagina tiene que ser corta',
);
assert.equal(PASO_SEGUIDOS, PAGINA_SEGUIDORES, 'el paso de "cargar mas" es una pagina');

console.log('logica.follows: OK');