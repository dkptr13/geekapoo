/**
 * LOS AVISOS DE MEDALLA, sin navegador y sin React.
 *
 * Existe por un fallo muy visible: al iniciar sesión salía SIEMPRE el
 * mismo aviso de medalla desbloqueada. "Primero Voz" salía en cada
 * entrada, porque se concede al registrarse y todo el mundo la tiene
 * desde el primer momento.
 *
 * ── LO QUE NO SE VE LEYENDO EL CÓDIGO ─────────────────────────────
 *
 * La causa no era que se celebraran todas las medallas, sino que
 * "es la primera lectura" se deducía mirando el `ref` de OTRO efecto
 * (el de la subida de nivel, que va antes en el fichero). Para
 * cualquiera que alguna vez hubiera subido de nivel, ese `ref` ya
 * estaba escrito en la primera lectura, así que el efecto de las
 * medallas creía que era la segunda, tercera o vigésima, y celebraba
 * todo lo que el usuario ya tenía.
 *
 * Y lo que lo hace más tramposo: quien NUNCA hubiera subido de nivel sí
 * recibía ese `null` por casualidad. El fallo parecía intermitente, y
 * depende de si la cuenta tiene historial o no.
 *
 * ── LO QUE SE COMPRUEBA ───────────────────────────────────────────
 *
 *   · En la primera lectura no se celebra nada, pero todas las
 *     medallas quedan apuntadas como vistas.
 *   · Una medalla nueva SÍ se celebra, aunque sea en la segunda
 *     lectura.
 *   · Volver a ver las mismas medallas no vuelve a celebrar ninguna.
 *   · El aviso de subida de nivel tiene el mismo cuidado.
 */
import assert from 'node:assert/strict';

import {
  detectarMedallasNuevas,
  detectarSubidaNivel,
  laMasRara,
} from '../src/utils/medallas';

// ═══════════════════════════════════════════════════════════
// EL CASO QUE SE VIO
// ═══════════════════════════════════════════════════════════
//
// Un usuario con UNA medalla de antes, entrando en la web.

const PRIMERO_VOZ = '2026-01-01T10:00:00.000Z';

{
  const medals = { medal_miembro_fundador: PRIMERO_VOZ };

  // Primera lectura del documento: se marca como vista, no se celebra.
  const primera = detectarMedallasNuevas({}, medals, true);

  assert.equal(
    primera.celebrar.length,
    0,
    'en la primera lectura no se celebra NADA, aunque haya medallas',
  );
  assert.deepEqual(
    primera.marcar,
    medals,
    'pero se apuntan todas como vistas, para que no vuelvan a salir',
  );
}

{
  // Y lo que de verdad rompía: la segunda lectura en la MISMA sesion,
  // con el estado ya anotado. Esto es lo que pasaba al iniciar sesion,
  // porque el segundo efecto encontraba el `ref` ya escrito.
  const medals = { medal_miembro_fundador: PRIMERO_VOZ };

  let vistas: Record<string, string> = {};

  // Primera lectura: como el usuario acaba de entrar.
  const primera = detectarMedallasNuevas(vistas, medals, true);

  vistas = { ...vistas, ...primera.marcar };

  // El documento llega otra vez (o el componente se vuelve a montar).
  const segunda = detectarMedallasNuevas(vistas, medals, false);

  assert.equal(
    segunda.celebrar.length,
    0,
    'la segunda vez tampoco se celebra, porque ya constan como vistas',
  );
}

// ═══════════════════════════════════════════════════════════
// UNA MEDALLA DE VERDAD NUEVA
// ═══════════════════════════════════════════════════════════

{
  const vistas = { medal_miembro_fundador: PRIMERO_VOZ };

  const medals = {
    ...vistas,
    medal_primer_hilo: '2026-06-01T12:00:00.000Z',
  };

  const r = detectarMedallasNuevas(vistas, medals, false);

  assert.deepEqual(r.celebrar, ['medal_primer_hilo'], 'la nueva sí se celebra');
  assert.deepEqual(r.marcar, { medal_primer_hilo: '2026-06-01T12:00:00.000Z' });
}

// ═══════════════════════════════════════════════════════════
// VARIAS A LA VEZ
// ═══════════════════════════════════════════════════════════

{
  const medals = {
    medal_a: '2026-06-01T12:00:00.000Z',
    medal_b: '2026-06-02T12:00:00.000Z',
    medal_c: '2026-06-03T12:00:00.000Z',
  };

  const r = detectarMedallasNuevas({}, medals, false);

  assert.equal(r.celebrar.length, 3, 'las tres se detectan');
  assert.deepEqual(r.marcar, medals, 'las tres se apuntan como vistas');

  // Volver a leer el mismo documento no celebra ninguna otra vez.
  const otra = detectarMedallasNuevas(r.marcar, medals, false);

  assert.equal(otra.celebrar.length, 0, 'y no se repiten');
}

// ═══════════════════════════════════════════════════════════
// SIN MEDALLAS
// ═══════════════════════════════════════════════════════════

assert.deepEqual(detectarMedallasNuevas({}, {}, true), { celebrar: [], marcar: {} });
assert.deepEqual(detectarMedallasNuevas({}, {}, false), { celebrar: [], marcar: {} });

// Un documento sin el campo, que en Firestore pasa a `{}` pero en un
// documento a mano podría no venir.
assert.deepEqual(
  detectarMedallasNuevas({}, undefined as never, false),
  { celebrar: [], marcar: {} },
  'sin campo de medallas no se celebra nada ni se rompe',
);

// ═══════════════════════════════════════════════════════════
// UNA MEDALLA QUE YA SE HA VISTO CON OTRA FECHA
// ═══════════════════════════════════════════════════════════
//
// No debería pasar: la fecha es la del desbloqueo y no cambia. Pero si
// alguien tocara el campo, el aviso se repetiría en cada lectura para
// siempre, así que también se avisa de ello.

{
  const medals = { medal_x: '2026-02-02T00:00:00.000Z' };

  const antes = detectarMedallasNuevas({}, medals, true);
  const despues = detectarMedallasNuevas(antes.marcar, medals, false);

  assert.equal(despues.celebrar.length, 0, 'misma fecha, no se repite');
}

// ═══════════════════════════════════════════════════════════
// LA MEDALLA MÁS RARA
// ═══════════════════════════════════════════════════════════

{
  // `rareza` es un TEXTO, no una lista. Se ordenan por `ORDEN_RAREZA`,
  // que va de menos a más, y no por la longitud del texto: "épica" y
  // "común" tienen las mismas letras y son rarezas distintas.
  const catalogo = [
    { id: 'comun', rareza: 'comun' },
    { id: 'epica', rareza: 'epica' },
    { id: 'rara', rareza: 'rara' },
    { id: 'legendaria', rareza: 'legendaria' },
  ];

  const mejor = laMasRara(['comun', 'rara', 'legendaria', 'epica'], catalogo);

  assert.equal(mejor?.id, 'legendaria', 'gana la legendaria, la más rara de verdad');

  // El caso que el fallo antiguo no distingue: dos rarezas con el
  // mismo número de letras. Con `rareza.length` empataban y ganaba la
  // queFIRST se hubiera encontrado, que dependía del orden del
  // catálogo.
  const empateLetras = laMasRara(['comun', 'epica'], catalogo);

  assert.equal(
    empateLetras?.id,
    'epica',
    'con las mismas letras, gana la más rara y no la primera que aparezca',
  );

  assert.equal(laMasRara(['comun'], catalogo)?.id, 'comun', 'con una sola, esa');

  assert.equal(
    laMasRara(['no_existe'], catalogo),
    undefined,
    'un id que no está en el catálogo no inventa una medalla',
  );

  assert.equal(laMasRara([], catalogo), undefined, 'sin ids no hay nada');

  // Y una rareza desconocida se trata como la más común, no como la
  // mejor: no se elige un id raro por escribirlo raro.
  const conDesconocida = laMasRara(
    ['raro', 'comun'],
    [
      { id: 'raro', rareza: 'mitica' },
      { id: 'comun', rareza: 'comun' },
    ],
  );

  assert.equal(
    conDesconocida?.id,
    'comun',
    'una rareza que no está en la lista no gana por ser rara',
  );
}

// ═══════════════════════════════════════════════════════════
// EL AVISO DE SUBIDA DE NIVEL, QUE TENÍA EL MISMO FALLO
// ═══════════════════════════════════════════════════════════

{
  // Un usuario con `lastLevelUpAt` guardado: es historial, no una
  // subida que acabe de pasar.
  const primera = detectarSubidaNivel('2026-01-01T10:00:00.000Z', null, true);

  assert.equal(primera.avisar, false, 'la primera lectura no avisa de nivel');
  assert.equal(
    primera.nuevaClave,
    '2026-01-01T10:00:00.000Z',
    'pero la clave se guarda igualmente',
  );
}

{
  // Lo que rompia: la clave guardada pero la marca de "primera vez"
  // perdida. Con el `ref` de otro efecto, esto era lo normal.
  const repetida = detectarSubidaNivel('2026-01-01T10:00:00.000Z', '2026-01-01T10:00:00.000Z', false);

  assert.equal(repetida.avisar, false, 'la misma subida no se repite');
}

{
  // Una subida de verdad, después de haber visto el documento.
  const nueva = detectarSubidaNivel('2026-06-01T12:00:00.000Z', '2026-01-01T10:00:00.000Z', false);

  assert.equal(nueva.avisar, true, 'una subida posterior sí avisa');
  assert.equal(nueva.nuevaClave, '2026-06-01T12:00:00.000Z');
}

{
  // Y el detalle que evita el bucle: si no se guardara la clave en la
  // primera lectura, bastaria con que la siguiente llegara a null para
  // que el aviso saliera.
  const primera = detectarSubidaNivel('2026-01-01T10:00:00.000Z', null, true);

  const segunda = detectarSubidaNivel('2026-01-01T10:00:00.000Z', primera.nuevaClave, false);

  assert.equal(segunda.avisar, false, 'con la clave guardada, no vuelve a avisar');
}

console.log('  avisos de medalla: OK');