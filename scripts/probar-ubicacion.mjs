// Prueba de `ubicacionPlausible`, la validacion del cliente.
//    node scripts/probar-ubicacion.mjs
//
// La copia de esta comprobacion esta en dos sitios: aqui, en el cliente,
// y en `ubicacionValida` de firestore.rules. El del cliente es para
// poder avisar al usuario al instante; el de las reglas es la garantia,
// porque un cliente se puede modificar desde la consola.
//
// Lo que se prueba aqui es que la del cliente no deja pasar nada que las
// reglas van a rechazar, porque si las dos discreparan el usuario ve un
// "ubicación no válida" sin motivo o, peor, un error de permisos.
//
// ── EL CASO QUE NO SE VE ────────────────────────────────────────────
//
// El interesante es el `NaN`. Con un rango escrito al reves, como
//
//     if (u.lat < -90 || u.lat > 90) return false;
//
// un `NaN` lo pasaria: las dos comparaciones son falsas, con lo que
// `||` da falso y la funcion acepta una latitude que no existe. El mapa
// se dibujaria en un sitio imposible. Por eso `Number.isFinite` va
// antes que los rangos.

import { ubicacionPlausible } from '../src/services/ubicacion.ts';

const casos = [
  // [ubicacion, se acepta?, por que]
  [{ lat: 40.41678, lng: -3.70379 }, true, 'una ubicacion normal de Madrid'],
  [{ lat: 0, lng: 0 }, true, 'el cruce de Greenwich, en tierra'],
  [{ lat: -90, lng: -180 }, true, 'el extremo de las dos, que es valido'],
  [{ lat: 90, lng: 180 }, true, 'el otro extremo, que tambien es valido'],
  [{ lat: -89.9, lng: 179.9 }, true, 'casi en el borde, pero dentro'],

  [{ lat: 90.1, lng: 0 }, false, 'la latitud no pasa de 90'],
  [{ lat: -90.1, lng: 0 }, false, 'la latitud no baja de -90'],
  [{ lat: 0, lng: 180.1 }, false, 'la longitud no pasa de 180'],
  [{ lat: 0, lng: -180.1 }, false, 'la longitud no baja de -180'],
  [{ lat: 1000, lng: 1000 }, false, 'las dos fuera, que es lo que da un GPS roto'],

  [{ lat: Number.NaN, lng: 0 }, false, 'NaN en la latitud'],
  [{ lat: 0, lng: Number.NaN }, false, 'NaN en la longitud'],
  [{ lat: Number.POSITIVE_INFINITY, lng: 0 }, false, 'infinito en la latitud'],

  [{ lat: 0, lng: 0, accuracy: -1 }, false, 'una precision negativa'],
  [{ lat: 0, lng: 0, accuracy: 25 }, true, 'una precision normal'],
  [{ lat: 0, lng: 0, accuracy: 0 }, true, 'precision cero, que significa exacta'],
  [{ lat: 0, lng: 0, place: 'Puerta del Sol' }, true, 'con nombre de sitio'],
  [{ lat: 0, lng: 0, place: 'x'.repeat(200) }, true, 'con un nombre de 200 letras'],
  [{ lat: 0, lng: 0, place: 'x'.repeat(201) }, false, 'con un nombre de 201, que es demasiado'],
];

let fallos = 0;

for (const [ubicacion, esperado, motivo] of casos) {
  const obtenido = ubicacionPlausible(ubicacion);

  const bien = obtenido === esperado;

  if (!bien) fallos++;

  const marcado = bien ? 'OK   ' : 'FALLA';

  console.log(
    `${marcado}  ${motivo.padEnd(44)} ` +
      `lat=${String(ubicacion.lat).padStart(9)} lng=${String(ubicacion.lng).padStart(9)}`,
  );
}

console.log(
  fallos
    ? `\n${fallos} de ${casos.length} casos fallan`
    : `\nlos ${casos.length} casos pasan`,
);

process.exit(fallos ? 1 : 0);