/**
 * Comprobaciones del NUMERO DE EPISODIO, sin navegador y sin red.
 *
 * Existe por el caso que la motivó: una OVA que cae entre el 15
 * y el 16 no cabe en un entero, y hasta que se permitsio el 15.5 no
 * habia forma de meterla sin renumerar la temporada entera (y sin
 * romper los enlaces de la wiki).
 *
 * Aqui se comprueba lo que NO es obvio de leer el codigo:
 *
 *   · que el 15.5 se ordena entre el 15 y el 16, que es lo unico
 *     que lo hace util;
 *   · que un numero con tres decimales se RECHAZA y no se redondea
 *     en silencio, porque un 15.499 guardado como 15.5 ha cambiado
 *     de sitio entre dos capitulos;
 *   · que el 0 sigue sin valer, aunque en television exista el
 *     "episodio 0" de recapitulative.
 *
 *   npm run test:logica
 */
import assert from 'node:assert/strict';

import {
  ERROR_NUMERO_EPISODIO,
  MAX_DECIMALES_EPISODIO,
  MAX_NUMERO_EPISODIO,
  numeroDeEpisodioValido,
} from '../src/utils/seasonData';

// ──────────────────────────────────────────────────────────
// LO QUE TIENE QUE VALER
// ──────────────────────────────────────────────────────────

assert.equal(numeroDeEpisodioValido(1), 1, 'el primer capitulo es el 1');
assert.equal(numeroDeEpisodioValido(23), 23, 'un capitulo normal');
assert.equal(numeroDeEpisodioValido('12'), 12, 'el panel llega como texto');

// ── EL CASO QUE MOTIVO EL CAMBIO ─────────────────────────

assert.equal(
  numeroDeEpisodioValido(15.5),
  15.5,
  'una OVA entre el 15 y el 16 tiene que poder guardarse',
);
assert.equal(numeroDeEpisodioValido('15.5'), 15.5, 'y llegar escrito desde el panel');
assert.equal(numeroDeEpisodioValido(1.5), 1.5, 'un extra antes del primer capitulo tambien');

// ── EL OTRO CASO: POR DEBAJO DEL 1 ──────────────────────
//
// "No Regrets", de Ataca a los Titanes, son los dos capitulos de Levi
// en el Subsuelo, anteriores a toda la serie. La propia Wikipedia los
// numera 0.5A y 0.5B, o sea que por debajo del 1 hay hueco de
// sobra.
//
// Cuando se escribio esta regla el minimo era 1, porque el panel
// trata "sin temporada" como la AUSENCIA del campo y un 0 guardado se
// confundia con eso. Ese motivo sigue valiendo para el 0 exacto, pero
// no para un 0.5: no es un cero, es un numero, y es tan
// inequivoco como el 15.5.
assert.equal(
  numeroDeEpisodioValido(0.5),
  0.5,
  'un extra antes del capitulo 1 tiene que poder guardarse',
);
assert.equal(numeroDeEpisodioValido('0.5'), 0.5, 'y llegar escrito desde el panel');
assert.equal(
  numeroDeEpisodioValido(0.75),
  0.75,
  'y con dos decimales, que es lo que usa el tercero de los extras',
);

// Y lo que de verdad lo hace util: que se queden EN SU SITIO.
assert.deepEqual(
  [0.5, 1, 2].sort((a, b) => a - b),
  [0.5, 1, 2],
  'el 0.5 tiene que ordenarse antes del 1, no despues',
);
assert.deepEqual(
  [1, 0.5].sort((a, b) => a - b),
  [0.5, 1],
  'una lista sin ordenar coloca el 0.5 en su sitio al ordenarla',
);

// Los cinco extras de Ataca a los Titanes que van antes o entre
// capitulos de la primera temporada, con los numeros que les da la
// propia Wikipedia. Si esto se desordena, la wiki los teacha en orden
// y no hay ningun aviso.
assert.deepEqual(
  [0.5, 0.6, 0.75, 1, 2, 3, 3.25, 3.5, 3.75, 4, 16, 16.5, 16.6, 17].sort((a, b) => a - b),
  [0.5, 0.6, 0.75, 1, 2, 3, 3.25, 3.5, 3.75, 4, 16, 16.5, 16.6, 17],
  'los ocho extras de Attack on Titan entremezclados con sus capitulos',
);

// El comparador es la resta directa (`a - b`), que es exactamente lo
// que hacen la wiki y el panel. Poner aqui el `numeroDeEpisodioValido`
// seria probar una cosa distinta de la que se usa: esa funcion
// devuelve `null` en lo invalido, y dentro de un `.sort()` un `null`
// se convierte en 0 en silencio, con lo que la comprobacion pasaria
// siempre.
const capitulos = [15, 15.5, 16].sort((a, b) => a - b);
assert.deepEqual(
  capitulos,
  [15, 15.5, 16],
  'el 15.5 tiene que ordenarse entre el 15 y el 16, no al principio ni al final',
);

// Con una OVA entre el 3 y el 4 en una lista mas larga, para que el
// fallo de orden no se esconda con una lista de tres.
const conVarios = [1, 2, 3, 3.5, 4, 4.5, 5].sort((a, b) => a - b);
assert.deepEqual(conVarios, [1, 2, 3, 3.5, 4, 4.5, 5], 'varias OVAs intercaladas');

// Y desde una lista sin ordenar, que es como llega de Firestore.
const desordenada = [16, 15.5, 15, 17].sort((a, b) => a - b);
assert.deepEqual(
  desordenada,
  [15, 15.5, 16, 17],
  'una lista sin ordenar coloca la OVA en su sitio al ordenarla',
);

// ──────────────────────────────────────────────────────────
// LO QUE NO TIENE QUE VALER
// ──────────────────────────────────────────────────────────

// El cero SIGUE sin valer, aunque el minimo ya no sea 1. El motivo
// es otro y no tiene nada que ver con el 1: existe en television
// (el recapitulative que abre muchas temporadas), pero el panel
// trata "sin temporada" como la AUSENCIA del campo, y un 0 guardado
// se confundia con eso. Por eso el limite es "mayor que 0" y no
// "1 o mas": el 0.5 tiene que poder guardarse y el 0 no.
//
// Si alguna vez esto se relaja hasta permitir el 0, esta comprobacion
// es la que avisa, y el motivo habra que escribirlo aqui.
assert.equal(numeroDeEpisodioValido(0), null, 'el 0 no vale');
assert.equal(numeroDeEpisodioValido('0'), null, 'ni escrito como texto');
assert.equal(numeroDeEpisodioValido(-3), null, 'un numero negativo no vale');
assert.equal(numeroDeEpisodioValido(-0.5), null, 'ni un negativo con decimales');
// El 0.001 no vale por la regla de los dos decimales, no por
// acercarse al 0. Se comprueba aparte porque es el numero que
// separa las dos reglas: si algun dia el limite de decimales
// bajara a 1, este pasaria a valer y habria que decidir si un
// capitulo a milésimas tiene sentido.
assert.equal(
  numeroDeEpisodioValido(0.001),
  null,
  '0.001 no vale, por tener tres decimales',
);
assert.equal(numeroDeEpisodioValido(MAX_NUMERO_EPISODIO + 1), null, 'pasarse del tope no vale');
assert.equal(numeroDeEpisodioValido(MAX_NUMERO_EPISODIO), MAX_NUMERO_EPISODIO, 'el tope si vale');

// Tres decimales se rechazan, y NO se redondean. Este es el detalle
// que hace que la comprobacion exista: `Math.round(15.499 * 100) /
// 100` da 15.5 sin avisar, y un capitulo guardado en el sitio
// equivocado no produce ningun error.
assert.equal(numeroDeEpisodioValido(15.499), null, 'tres decimales no valen');
assert.equal(numeroDeEpisodioValido(15.005), null, 'ni 15.005, que redondearia a 15.01');
assert.equal(
  numeroDeEpisodioValido(1 + 0.001),
  null,
  'un numero que al redondear cambia de sitio tiene que rechazarse',
);

// Dos decimales si valen, que es lo que dice el limite.
assert.equal(
  numeroDeEpisodioValido(15.25),
  15.25,
  'dos decimales si valen',
);
assert.equal(MAX_DECIMALES_EPISODIO, 2, 'el limite son dos decimales');

// Basura.
assert.equal(numeroDeEpisodioValido(''), null, 'una cadena vacia no vale');
assert.equal(numeroDeEpisodioValido('hola'), null, 'texto no vale');
assert.equal(numeroDeEpisodioValido(undefined), null, 'undefined no vale');
assert.equal(numeroDeEpisodioValido(null), null, 'null no vale');
assert.equal(numeroDeEpisodioValido(NaN), null, 'NaN no vale');
assert.equal(numeroDeEpisodioValido(Infinity), null, 'Infinity no vale');

// Lo que se escribe a mano SIEMPRE vale, porque un numero tecleado
// se convierte sin ruido: "15.5" es exactamente 15.5. Esto es lo que
// importa, porque lo que llega al servicio es lo que ha escrito una
// persona en el campo.
assert.equal(numeroDeEpisodioValido('15.5'), 15.5, 'un decimal tecleado vale');
assert.equal(numeroDeEpisodioValido('15.25'), 15.25, 'dos decimales tecleados valen');

// Lo que se CALCULA puede traer ruido de coma flotante, y eso se
// rechaza. No es un caso real en el panel (ahi siempre se teclea),
// pero deja claro por que la comprobacion compara el numero
// redondeado con el original en vez de solo redondear: en JavaScript
// 0.1 + 0.2 no es 0.3, es 0.30000000000000004, y si el servicio
// redondeara en silencio guardaria un numero que nadie ha escrito.
//
// OJO con el 0.1 + 0.5: este SI da 0.6 exacto, porque el doble mas
// cercano al 0.6000000000000000055 es el propio 0.6. Cuando el
// minimo era 1, una comprobacion de este estilo pasaba por el motivo
// equivocado (la rechazaba el minimo, no los decimales) y decia que
// el 0.1 + 0.5 salia con ruido. Al bajar el minimo a "mayor que 0"
// ha salido a la luz: ahora vale, y vale bien.
assert.equal(
  numeroDeEpisodioValido(0.1 + 0.2),
  null,
  '0.1+0.2 vale 0.30000000000000004 y no vale',
);
assert.equal(
  numeroDeEpisodioValido(0.1 + 0.5),
  0.6,
  '0.1+0.5 si da 0.6 exacto, y es un numero valido',
);
assert.equal(
  numeroDeEpisodioValido(0.2 + 0.15),
  0.35,
  '0.2+0.15 tambien es exacto',
);

// ──────────────────────────────────────────────────────────
// EL MENSAJE DE ERROR
// ──────────────────────────────────────────────────────────

// El mensaje tiene que mencionar los DOS casos de decimal, no solo
// uno. Un error que solo dice "debe ser un numero" deja al autor sin
// pista de que 15.5 vale; y uno que solo menciona 15.5 le hace
// pensar que por debajo del 1 no se puede, que ya no es verdad.
assert.ok(
  ERROR_NUMERO_EPISODIO.includes('15.5'),
  'el mensaje enseña un ejemplo de decimal ENTRE capitulos',
);
assert.ok(
  ERROR_NUMERO_EPISODIO.includes('0.5'),
  'y otro de un extra ANTES del primero',
);
assert.ok(
  ERROR_NUMERO_EPISODIO.includes('mayor que 0'),
  'y dice el minimo de verdad, que ya no es 1',
);

console.log('logica.numeros: OK');
