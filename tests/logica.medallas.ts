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
// Un usuario con medallas de antes, entrando en la web. La primera
// lectura no celebra nada pero lo apunta todo; la segunda, con lo
// mismo, tampoco celebra.

{
  const ids = ['medal_miembro_fundador'];

  // Primera lectura del documento: se marca como vista, no se celebra.
  const primera = detectarMedallasNuevas(new Set(), ids, true);

  assert.equal(
    primera.celebrar.length,
    0,
    'en la primera lectura no se celebra NADA, aunque haya medallas',
  );
  assert.deepEqual(
    primera.nuevas,
    ids,
    'pero se apuntan todas como vistas, para que no vuelvan a salir',
  );

  // La segunda lectura, con lo ya anotado, tampoco celebra.
  const vistas = new Set(primera.nuevas);
  const segunda = detectarMedallasNuevas(vistas, ids, false);

  assert.equal(
    segunda.celebrar.length,
    0,
    'la segunda vez tampoco se celebra, porque ya constan como vistas',
  );
  assert.deepEqual(segunda.nuevas, [], 'y no hay nada nuevo que apuntar');
}

// ═══════════════════════════════════════════════════════════
// UNA MEDALLA DE VERDAD NUEVA
// ═══════════════════════════════════════════════════════════
//
// Solo es nueva si el ID no se había visto. Y solo se celebra si
// además no es la primera lectura: lo que ya había al entrar es
// historial, aunque el navegador no lo tuviera apuntado.

{
  const vistas = new Set(['medal_miembro_fundador']);
  const ids = ['medal_miembro_fundador', 'medal_primer_hilo'];

  const r = detectarMedallasNuevas(vistas, ids, false);

  assert.deepEqual(r.celebrar, ['medal_primer_hilo'], 'la nueva sí se celebra');
  assert.deepEqual(r.nuevas, ['medal_primer_hilo'], 'y solo esa se apunta');
}

{
  // La misma medalla nueva, pero en la primera lectura: es historial
  // (navegador nuevo, por ejemplo), así que se apunta sin celebrar.
  const r = detectarMedallasNuevas(new Set(), ['medal_primer_hilo'], true);

  assert.deepEqual(r.celebrar, [], 'en la primera lectura no se celebra');
  assert.deepEqual(r.nuevas, ['medal_primer_hilo'], 'pero se apunta igualmente');
}

// ═══════════════════════════════════════════════════════════
// VARIAS A LA VEZ
// ═══════════════════════════════════════════════════════════

{
  const ids = ['medal_a', 'medal_b', 'medal_c'];

  const r = detectarMedallasNuevas(new Set(), ids, false);

  assert.equal(r.celebrar.length, 3, 'las tres se detectan');
  assert.deepEqual(r.nuevas, ids, 'las tres se apuntan como vistas');

  // Volver a leer el mismo documento no celebra ninguna otra vez.
  const otra = detectarMedallasNuevas(new Set(r.nuevas), ids, false);

  assert.equal(otra.celebrar.length, 0, 'y no se repiten');
}

// ═══════════════════════════════════════════════════════════
// SIN MEDALLAS
// ═══════════════════════════════════════════════════════════

assert.deepEqual(
  detectarMedallasNuevas(new Set(), [], true),
  { celebrar: [], nuevas: [] },
  'conversación vacía en primera lectura',
);
assert.deepEqual(
  detectarMedallasNuevas(new Set(), [], false),
  { celebrar: [], nuevas: [] },
  'y en las demás',
);

// Un documento sin el campo no rompe: se trata como lista vacía.
assert.deepEqual(
  detectarMedallasNuevas(new Set(), undefined as never, false),
  { celebrar: [], nuevas: [] },
  'sin campo de medallas no se celebra nada ni se rompe',
);

// ═══════════════════════════════════════════════════════════
// UNA MEDALLA QUE DESAPARECE Y VUELVE
// ═══════════════════════════════════════════════════════════
//
// La propiedad que fija el fallo de raíz: lo que se ha visto no
// vuelve a ser nuevo NUNCA, traiga la fecha que traiga. Antes se
// comparaban fechas, y bastaba con que la primera lectura trajera
// el documento vacío para que todo pareciera nuevo al llegar la
// segunda. Por ID eso no puede pasar: vacío no apunta nada, y al
// llegar lo lleno todo es... primera lectura, que no celebra.

{
  const vistas = new Set(['medal_x']);

  // El documento la pierde una lectura (o llega vacío) y la
  // recupera en la siguiente: no es nueva, ya se vio.
  const sinElla = detectarMedallasNuevas(vistas, [], false);

  assert.deepEqual(sinElla.celebrar, [], 'que falte no celebra');

  const conElla = detectarMedallasNuevas(vistas, ['medal_x'], false);

  assert.deepEqual(conElla.celebrar, [], 'y que vuelva tampoco');
  assert.deepEqual(conElla.nuevas, [], 'porque nunca dejó de estar vista');
}

{
  // Y el caso del inicio de sesión: primera lectura vacía, segunda
  // llena. La primera no apunta nada (no había nada), pero sigue
  // siendo la primera: la segunda no celebra.
  const primera = detectarMedallasNuevas(new Set(), [], true);

  assert.deepEqual(primera.celebrar, [], 'vacío no celebra');

  const vistas = new Set(primera.nuevas);
  const segunda = detectarMedallasNuevas(vistas, ['medal_x'], true);

  assert.deepEqual(
    segunda.celebrar,
    [],
    'en la primera lectura no se celebra aunque traiga medallas',
  );
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