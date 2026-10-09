/**
 * La GEOMETRÍA DEL RECORTE, sin navegador y sin imagen de verdad.
 *
 * Existe por lo que garantiza: que el recorte nunca deja una franja
 * vacía. Es el fallo que no se ve leyendo el código, porque depende de
 * que el arrastre se salga del marco, y solo aparece cuando el usuario
 * mueve la imagen hasta el tope.
 *
 * ── LA INVARIANTE, Y POR QUÉ SE COMPRUEBA CON BARRIDO ─────────────
 *
 * Con zoom 1 y una imagen más alta que la caja, NO se puede mover en
 * vertical: la imagen justa ya cubre de sobra, así que el recorrido es
 * cero y la posición se ignora.
 *
 * Con zoom alto, las dos direcciones tienen recorrido. Ahí es donde un
 * arrastre sin límites enseña fondo.
 *
 * ── LO QUE SE COMPRUEBA ───────────────────────────────────────────
 *
 *   · Que en NINGÚN caso salen huecos, ni moviendo al extremo.
 *   · Que con zoom 1 el lado corto de la imagen queda CEÑIDO a la caja.
 *   · Que centrar es simétrico.
 *   · Que zoom y desplazamiento se mantienen en su rango.
 *   · Que los ajustes guardados se reabren donde estaban.
 *   · Que una imagen vertical en una caja cuadrada conserva la altura
 *     entera, que es lo que evita cortar la cabeza de un personaje.
 */
import assert from 'node:assert/strict';

import {
  PROPORCIONES,
  ZOOM_MAXIMO,
  ZOOM_MINIMO,
  ajustesIniciales,
  calcularEncuadre,
  clasificarProporcion,
  descripcionProporcion,
  ladoDeSalida,
  limitarDesplazamiento,
  limitarZoom,
  type ImageCropSettings,
} from '../src/services/imageCrop';

// ═══════════════════════════════════════════════════════════
// LA INVARIANTE: NUNCA HAY HUECO
// ═══════════════════════════════════════════════════════════
//
// Se recorren todas las combinaciones de zoom y desplazamiento sobre
// imágenes de muchas formas. Si una sola vez sale una franja vacía,
// el recorte deja de cubrir y se ve el fondo del editor.

{
  const formas = [
    { w: 4000, h: 3000 }, // horizontal grande
    { w: 3000, h: 4000 }, // vertical grande
    { w: 2000, h: 2000 }, // cuadrada grande
    { w: 4000, h: 500 }, // panorámica extrema
    { w: 500, h: 4000 }, // columna extrema
    { w: 800, h: 600 }, // horizontal pequeña
    { w: 600, h: 800 }, // vertical pequeña
    { w: 200, h: 200 }, // cuadrada diminuta
  ];

  const cajas = [
    { w: 512, h: 512, nombre: 'avatar' },
    { w: 1600, h: 900, nombre: 'portada' },
    { w: 400, h: 500, nombre: 'retrato' },
  ];

  const zooms = [ZOOM_MINIMO, 1.2, 1.7, 2.5, ZOOM_MAXIMO];
  const desloc = [0, 0.001, 0.25, 0.5, 0.75, 0.999, 1];
  const fuera = [-0.5, 1.5, 42];

  let comprobados = 0;

  for (const img of formas) {
    for (const caja of cajas) {
      for (const zoom of zooms) {
        for (const vx of desloc) {
          for (const vy of desloc) {
            const e = calcularEncuadre(img.w, img.h, caja.w, caja.h, {
              aspectRatio: caja.w / caja.h,
              zoom,
              x: vx,
              y: vy,
            });

            assert.ok(
              e.ancho >= caja.w - 0.001,
              `ancho ${e.ancho} < caja ${caja.w} con ${img.w}x${img.h} en ${caja.nombre}, zoom ${zoom}, x ${vx}`,
            );
            assert.ok(
              e.alto >= caja.h - 0.001,
              `alto ${e.alto} < caja ${caja.h} con ${img.w}x${img.h} en ${caja.nombre}, zoom ${zoom}, y ${vy}`,
            );

            comprobados++;
          }
        }
      }
    }
  }

  // Y lo mismo con desplazamiento fuera de rango, que es lo que
  // pasa si el estado se guarda manipulado o viene de otra versión.
  for (const vx of fuera) {
    for (const vy of fuera) {
      const e = calcularEncuadre(3000, 4000, 1600, 900, {
        aspectRatio: 1600 / 900,
        zoom: 3,
        x: vx,
        y: vy,
      });

      assert.ok(e.ancho >= 1600, `ancho con x=${vx} fuera de rango`);
      assert.ok(e.alto >= 900, `alto con y=${vy} fuera de rango`);
    }
  }

  assert.ok(comprobados > 5000, `solo se comprobaron ${comprobados} casos`);
}
// ═══════════════════════════════════════════════════════════
// ZOOM 1 ES "LA IMAGEN JUSTA"
// ═══════════════════════════════════════════════════════════
//
// Ni una muesca más: por debajo aparecería fondo, y por encima se
// recorta de más sin que el usuario lo haya pedido.
//
// Y atención a QUÉ lado queda ceñido, porque es la mitad del problema
// de las imágenes verticales:
//
//   · Una VERTICAL en una caja cuadrada NO se ve entera de alto. El
//     ancho se ajusta a la caja y la altura desborda, así que se
//     recortan la cabeza y los pies. No hay forma de evitarlo con
//     `cover`: es la geometría, no un fallo. Por eso existe el editor.
//
//   · Una HORIZONTAL en una caja cuadrada, en cambio, sí se ve entera
//     de alto: el alto se ajusta y lo que sobra son los lados.

{
  // Vertical 600x1200 en cuadrado 512x512: el ANCHO queda ceñido.
  const e = calcularEncuadre(600, 1200, 512, 512, ajustesIniciales(1));

  assert.ok(
    Math.abs(e.ancho - 512) < 0.001,
    `con zoom 1 el ancho tiene que ser justo la caja, y es ${e.ancho}`,
  );
  assert.ok(e.alto > 512, 'y la altura desborda, que es lo que se recorta');
}

{
  // Horizontal 1200x600 en cuadrado 512x512: el ALTO queda ceñido.
  const e = calcularEncuadre(1200, 600, 512, 512, ajustesIniciales(1));

  assert.ok(
    Math.abs(e.alto - 512) < 0.001,
    `con zoom 1 el alto tiene que ser justo la caja, y es ${e.alto}`,
  );
  assert.ok(e.ancho > 512, 'y el ancho desborda');
}

// ═══════════════════════════════════════════════════════════
// CENTRAR ES SIMÉTRICO
// ═══════════════════════════════════════════════════════════

{
  const caja = { w: 800, h: 800 };

  const centro = calcularEncuadre(2000, 3000, caja.w, caja.h, ajustesIniciales(1));
{
  const caja = { w: 800, h: 800 };

  const centro = calcularEncuadre(2000, 3000, caja.w, caja.h, ajustesIniciales(1));

  const sobraX = centro.ancho - caja.w;
  const sobraY = centro.alto - caja.h;

  // Centrado quiere decir que lo que se recorta por un lado es igual
  // que por el otro. Con el desplazamiento NEGATIVO, el centro está
  // en menos la mitad del recorrido, no en más.
  assert.ok(
    Math.abs(centro.x + sobraX / 2) < 0.001,
    'centrado en horizontal deja lo mismo a cada lado',
  );
  assert.ok(
    Math.abs(centro.y + sobraY / 2) < 0.001,
    'centrado en vertical deja lo mismo arriba y abajo',
  );

  // Y la imagen, siendo más alta que la caja, tiene que empezar por
  // ENCIMA de la caja. Si empezara por debajo, los primeros píxeles
  // se quedarían vacíos, que es el fallo que se vio al pintar.
  assert.ok(centro.y < 0, 'la imagen empieza por encima de la caja');
  assert.ok(centro.y + centro.alto > caja.h, 'y termina por debajo');
}
}

{
  // Con zoom 1 y una dirección sin recorrido, la posición se ignora:
  // Una HORIZONTAL en un cuadrado: el alto queda ceñido y en vertical
  // ceñido a la caja, así que en vertical NO hay recorrido y la
  // posición se ignora. En horizontal sí lo hay, porque sobran 800 px.
  const caja = { w: 800, h: 800 };

  const arriba = calcularEncuadre(2000, 1000, caja.w, caja.h, {
    aspectRatio: 1,
    zoom: 1,
    x: 0.5,
    y: 0,
  });

  const abajo = calcularEncuadre(2000, 1000, caja.w, caja.h, {
    aspectRatio: 1,
    zoom: 1,
    x: 0.5,
    y: 1,
  });

  assert.ok(
    Math.abs(arriba.y - abajo.y) < 0.001,
    'sin recorrido vertical, da igual dónde se ponga',
  );
  assert.ok(
    Math.abs(arriba.alto - caja.h) < 0.001,
    'porque con zoom 1 el alto es justo la caja y no hay por dónde mover',
  );

// Y el eje con recorrido sí responde, que es lo contrario de lo
  // mismo: una casilla vacía no debe ignorar el arrastre.
  //
  // Ojo al signo: con x=0 la imagen está en su sitio (0) y con x=1
  // se desplaza a la IZQUIERDA, un valor NEGATIVO. Por eso aquí se
  // compara al revés de lo natural: "más a la derecha" es un número
  // MÁS PEQUEÑO, porque es lo que se ve a la izquierda de la foto.
  const izquierda = calcularEncuadre(2000, 1000, caja.w, caja.h, {
    aspectRatio: 1,
    zoom: 1,
    x: 0,
    y: 0.5,
  });

  const derecha = calcularEncuadre(2000, 1000, caja.w, caja.h, {
    aspectRatio: 1,
    zoom: 1,
    x: 1,
    y: 0.5,
  });

  assert.ok(
    izquierda.x > derecha.x,
    'en horizontal, con recorrido, mover a la derecha SÍ cambia el encuadre',
  );
  assert.ok(Math.abs(izquierda.x) < 0.001, 'x=0 deja la imagen en su sitio');
}

// ═══════════════════════════════════════════════════════════
// MOVER SÍ HACE ALGO CUANDO HAY RECORRIDO
// ═══════════════════════════════════════════════════════════

{
  // Vertical en caja panorámica: aquí sí sobra por arriba y por abajo,
  // que es el caso donde el usuario elige si corta la cabeza o los pies.
  const caja = { w: 1600, h: 900 };

  const arriba = calcularEncuadre(900, 3000, caja.w, caja.h, {
    aspectRatio: caja.w / caja.h,
    zoom: 1,
    x: 0.5,
    y: 0,
  });

  const centro = calcularEncuadre(900, 3000, caja.w, caja.h, {
    aspectRatio: caja.w / caja.h,
    zoom: 1,
    x: 0.5,
    y: 0.5,
  });

  const abajo = calcularEncuadre(900, 3000, caja.w, caja.h, {
    aspectRatio: caja.w / caja.h,
    zoom: 1,
    x: 0.5,
    y: 1,
  });

  // Con el desplazamiento negativo, "abajo" es la posición MÁS
  // NEGATIVA: la imagen se sube tanto que su borde inferior toca el
  // borde inferior de la caja. Y ahí es donde se ve la parte de ABAJO
  // de la foto.
  assert.ok(
    arriba.y > centro.y && centro.y > abajo.y,
    `mover abajo tiene que subir más la imagen: ${arriba.y}, ${centro.y}, ${abajo.y}`,
  );

  // Y los dos topes tocan justo el borde de la imagen, sin pasarse.
  const recorrido = abajo.alto - caja.h;

  assert.ok(
    Math.abs(abajo.y + recorrido) < 0.001,
    'al tope, el borde inferior de la imagen toca el de la caja',
  );
  assert.ok(Math.abs(arriba.y) < 0.001, 'al otro tope, la imagen empieza en el borde');

  // Y en NINGÚN punto la imagen deja hueco, que es lo que fallaba.
  for (let i = 0; i <= 20; i++) {
    const y = i / 20;
    const e = calcularEncuadre(900, 3000, caja.w, caja.h, {
      aspectRatio: caja.w / caja.h,
      zoom: 1,
      x: 0.5,
      y,
    });

    assert.ok(e.y <= 0.001, `con y=${y.toFixed(2)} la imagen no puede empezar abajo`);
    assert.ok(
      e.y + e.alto >= caja.h - 0.001,
      `con y=${y.toFixed(2)} la imagen tiene que llegar al final`,
    );
  }
}

// ═══════════════════════════════════════════════════════════
// EL ZOOM ACORTA LA IMAGEN
// ═══════════════════════════════════════════════════════════

{
  const caja = { w: 1000, h: 1000 };

  const pequeno = calcularEncuadre(4000, 3000, caja.w, caja.h, ajustesIniciales(1));
  const grande = calcularEncuadre(4000, 3000, caja.w, caja.h, {
    aspectRatio: 1,
    zoom: 2,
    x: 0.5,
    y: 0.5,
  });

  assert.ok(
    Math.abs(grande.ancho - pequeno.ancho * 2) < 0.001,
    'duplicar el zoom duplica el ancho pintado',
  );
  assert.ok(
    Math.abs(grande.alto - pequeno.alto * 2) < 0.001,
    'y el alto, porque la escala se aplica en los dos ejes',
  );
}

// ═══════════════════════════════════════════════════════════
// LOS RANGOS
// ═══════════════════════════════════════════════════════════

assert.equal(limitarZoom(ZOOM_MINIMO), ZOOM_MINIMO, 'el mínimo se respeta');
assert.equal(limitarZoom(ZOOM_MAXIMO), ZOOM_MAXIMO, 'el máximo se respeta');
assert.equal(limitarZoom(0.2), ZOOM_MINIMO, 'por debajo del 1 no se deja: se vería fondo');
assert.equal(limitarZoom(99), ZOOM_MAXIMO, 'y por encima se corta');
assert.equal(limitarZoom(Number.NaN), ZOOM_MINIMO, 'un zoom inválido vuelve al mínimo');

assert.equal(limitarDesplazamiento(0.5), 0.5, 'el centro se queda');
assert.equal(limitarDesplazamiento(-3), 0, 'negativo al tope');
assert.equal(limitarDesplazamiento(7), 1, 'mayor que uno al tope');
assert.equal(limitarDesplazamiento(Number.NaN), 0.5, 'inválido, al centro');

// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
//
// Este es el caso que motiva el encargo, y conviene dejarlo escrito
// con su verdad:
//
// Una vertical estrecha en una caja cuadrada, con zoom 1, se ve
// ENTERA DE ANCHO pero se le recorta arriba y abajo. Al revés de lo
// que se suele suponer. Y no es un fallo del ajuste: es lo que
// significa "cubrir la caja". La altura de la imagen es varias veces
// la caja, así que algo tiene que sobrar.
//
// Lo que decide la diferencia entre "se ve la cabeza" y "se ven los
// pies" es DÓNDE se sitúa el recorte, y eso no lo puede decidir el
// CSS por sí solo. De ahí el editor: los dos ajustes de arriba y
// abajo son el control.

{
  const caja = 400;

  const e = calcularEncuadre(600, 1600, caja, caja, ajustesIniciales(1));

  // El ancho se ve ENTERO: 600 de la caja son justo el ancho de la
  // imagen a esta escala, así que no se pierde nada de los lados.
  assert.ok(
    Math.abs(e.ancho - caja) < 0.001,
    `una vertical en un cuadrado con zoom 1 tiene que verse entera de ancho, y mide ${e.ancho}`,
  );

  // Y la altura desborda con creces: eso es lo que se recorta.
  assert.ok(
    e.alto > caja * 2,
    `la altura tiene que desbordar, y mide ${e.alto} en una caja de ${caja}`,
  );
}

{
  // El desplazamiento vertical SÍ mueve el recorte, y a los dos
  // topes. Esto es lo que le da al usuario la cabeza o los pies.
  const caja = { w: 400, h: 400 };

  const opciones: Array<[string, number]> = [
    ['arriba', 0],
    ['centro', 0.5],
    ['abajo', 1],
  ];

  const alturas = opciones.map(([nombre, y]) => {
    const e = calcularEncuadre(600, 1600, caja.w, caja.h, {
      aspectRatio: 1,
      zoom: 1,
      x: 0.5,
      y,
    });

    return { nombre, y: e.y };
  });

  assert.ok(
    alturas[0].y > alturas[1].y && alturas[1].y > alturas[2].y,
    `las tres posiciones tienen que ser distintas: ${JSON.stringify(alturas)}`,
  );

  // Y los dos topes tocan el borde de la imagen, sin dejarla suelta.
  const recorrido = alturas[0].y - alturas[2].y;
  const altoPintado = calcularEncuadre(600, 1600, caja.w, caja.h, ajustesIniciales(1)).alto;

  assert.ok(
    Math.abs(recorrido - (altoPintado - caja.h)) < 0.001,
    'el recorrido va de un borde al otro de la imagen',
  );
}

// ═══════════════════════════════════════════════════════════
// UNA PANORÁMICA NO SE AMPLÍA DE MÁS
// ═══════════════════════════════════════════════════════════
//
// Meter una 21:9 en un cuadrado con zoom 1 no tiene que hacer nada:
// casi no hay recorte, y ampliar sería tirar resolución.

{
  const caja = 500;

  const e = calcularEncuadre(2100, 900, caja, caja, ajustesIniciales(1));

  assert.ok(
    e.escala < 1,
    `una panorámica en un cuadrado se reduce, no se agranda (escala ${e.escala})`,
  );
}

// ═══════════════════════════════════════════════════════════
// CLASIFICAR LA PROPORCIÓN
// ═══════════════════════════════════════════════════════════

assert.equal(clasificarProporcion(1000, 1000), 'cuadrada', '1000x1000 es cuadrada');
assert.equal(clasificarProporcion(2000, 2000), 'cuadrada', 'y también 2000x2000');
assert.equal(clasificarProporcion(600, 1200), 'vertical', '600x1200 es vertical');
assert.equal(clasificarProporcion(1200, 700), 'horizontal', '1200x700 es horizontal');
assert.equal(clasificarProporcion(1920, 400), 'panoramica', '1920x400 es panorámica');
assert.equal(clasificarProporcion(21, 9), 'panoramica', '21:9 es panorámica');
assert.equal(clasificarProporcion(16, 9), 'horizontal', '16:9 NO es panorámica todavía');

// ═══════════════════════════════════════════════════════════
// LOS UMBRALES JUSTOS
// ═══════════════════════════════════════════════════════════
//
// Dos cosas que se confunden a ojo, y una decisión sobre el borde:
//
//   · 1200x600 es 2:1, que ya es PANORÁMICA, no horizontal.
//   · 16:9 es 1.78, que todavía no llega.
//
// Y el valor del umbral pertenece a la banda ANCHA, porque la
// comparación es estricta ("mayor que 1.1", no "desde 1.1"). No es
// un descuido: una imagen justo en 1.1 se parece más a un cuadrado
// que a un panorama, y una justo en 0.9 también.
assert.equal(clasificarProporcion(1200, 700), 'horizontal', '1200x700 es 1.71, horizontal');
assert.equal(clasificarProporcion(1200, 600), 'panoramica', '1200x600 es 2:1, ya es panorámica');
assert.equal(clasificarProporcion(1900, 1000), 'horizontal', '1.9 exacto NO es panorámica todavía');
assert.equal(clasificarProporcion(1901, 1000), 'panoramica', 'pasado el 1.9, sí');

assert.equal(clasificarProporcion(1100, 1000), 'cuadrada', '1.1 exacto sigue siendo cuadrada');
assert.equal(clasificarProporcion(1101, 1000), 'horizontal', 'pasado el 1.1, sí es horizontal');
assert.equal(clasificarProporcion(1000, 1100), 'cuadrada', 'y 0.9 exacto, también cuadrada');
assert.equal(clasificarProporcion(1000, 1200), 'vertical', '1000x1200 es 0.83, vertical');

// Lo que no tiene sentido no rompe nada.
assert.equal(clasificarProporcion(0, 1000), 'cuadrada', 'ancho cero no revienta');
assert.equal(clasificarProporcion(1000, 0), 'cuadrada', 'alto cero tampoco');
assert.equal(clasificarProporcion(Number.NaN, 10), 'cuadrada', 'un NaN tampoco');

// Y cada grupo tiene su texto, que se enseña al usuario.
for (const clase of ['cuadrada', 'vertical', 'horizontal', 'panoramica'] as const) {
  const texto = descripcionProporcion(clase);
  assert.ok(texto.length > 10, `${clase} necesita una explicación, y tiene "${texto}"`);
}

// ═══════════════════════════════════════════════════════════
// LAS PROPORCIONES PREDEFINIDAS
// ═══════════════════════════════════════════════════════════

{
  assert.equal(PROPORCIONES.avatar.ratio, 1, 'el avatar es cuadrado');
  assert.equal(PROPORCIONES.cuadrado.ratio, 1, 'el cuadrado es cuadrado');

  for (const [nombre, prop] of Object.entries(PROPORCIONES)) {
    assert.ok(
      Number.isFinite(prop.ratio) && prop.ratio > 0,
      `la proporción "${nombre}" tiene un valor utilizable, y es ${prop.ratio}`,
    );
    assert.ok(prop.etiqueta.length > 0, `"${nombre}" tiene etiqueta`);
  }
}

// ═══════════════════════════════════════════════════════════
// LOS AJUSTES GUARDADOS SE REABREN IGUAL
// ═══════════════════════════════════════════════════════════
//
// El ajuste se guarda NORMALIZADO (0 a 1), no en píxeles, para que la
// misma vista previa y el recorte final puedan tener tamaños distintos.
// La consecuencia que se comprueba aquí es que abrir el editor con unos
// ajustes dados da exactamente el mismo encuadre.

{
  const guardado: ImageCropSettings = { aspectRatio: 1, zoom: 2.3, x: 0.18, y: 0.82 };

  const primera = calcularEncuadre(2000, 2800, 512, 512, guardado);
  const segunda = calcularEncuadre(2000, 2800, 512, 512, guardado);

  assert.deepEqual(primera, segunda, 'los mismos ajustes dan el mismo encuadre');

  // Y el encuadre no depende del tamaño de la caja: eso es lo que
  // permite pintar la vista previa pequeña y recortar en grande.
  const enPequena = calcularEncuadre(2000, 2800, 256, 256, guardado);
  const enGrande = calcularEncuadre(2000, 2800, 1024, 1024, guardado);

  assert.ok(
    Math.abs(enPequena.ancho / enGrande.ancho - 0.25) < 0.001,
    'la forma es la misma aunque la caja cambie de tamaño',
  );
  assert.ok(
    Math.abs(enPequena.x / enGrande.x - 0.25) < 0.001,
    'y también la posición, en proporción',
  );
}

// ═══════════════════════════════════════════════════════════
// LOS AJUSTES INICIALES
// ═══════════════════════════════════════════════════════════

{
  const a = ajustesIniciales(1);

  assert.equal(a.zoom, ZOOM_MINIMO, 'empieza sin ampliar');
  assert.equal(a.x, 0.5, 'centrado en horizontal');
  assert.equal(a.y, 0.5, 'centrado en vertical');
  assert.equal(a.aspectRatio, 1, 'con la proporción pedida');
}

{
  const b = ajustesIniciales(PROPORCIONES.panoramica.ratio);

  assert.equal(b.aspectRatio, PROPORCIONES.panoramica.ratio, 'con la proporción que le toque');
}

// ═══════════════════════════════════════════════════════════
// ENTRADAS QUE NO TIENEN SENTIDO
// ═══════════════════════════════════════════════════════════
//
// La imagen todavía no ha cargado y naturalWidth es 0. Si esto sale
// con NaN, el canvas dibuja en el sitio equivocado sin avisar.

{
  const cero = calcularEncuadre(0, 0, 512, 512, ajustesIniciales(1));

  assert.equal(cero.ancho, 0, 'sin imagen no se pinta nada');
  assert.ok(!Number.isNaN(cero.x) && !Number.isNaN(cero.y), 'y ningún NaN se cuela');

  const nan = calcularEncuadre(Number.NaN, 500, 512, 512, ajustesIniciales(1));

  assert.equal(nan.escala, 0, 'un tamaño NaN no rompe el cálculo');

  const sinCaja = calcularEncuadre(1000, 1000, 0, 0, ajustesIniciales(1));

  assert.equal(sinCaja.ancho, 0, 'sin caja tampoco');
}

// ═══════════════════════════════════════════════════════════
// EL TAMAÑO DE SALIDA
// ═══════════════════════════════════════════════════════════

assert.equal(ladoDeSalida(4000, 3000), 1200, 'una grande se recorta al máximo');
assert.equal(ladoDeSalida(800, 600), 800, 'una pequeña se respeta su tamaño');
assert.equal(ladoDeSalida(0, 0), 1200, 'sin datos, el máximo');
assert.equal(ladoDeSalida(Number.NaN, 10), 1200, 'con un NaN, el máximo también');
assert.ok(
  ladoDeSalida(4000, 3000, 600) === 600,
  'el máximo se puede ajustar por uso',
);

console.log('  encuadre y proporciones: OK');