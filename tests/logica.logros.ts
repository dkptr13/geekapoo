/**
 * Los CONTADORES DE PROGRESO, sin navegador y sin firebase-admin.
 *
 * Existe por lo que arregla: los contadores de `stats` se quedaban
 * clavados en 1 para siempre. Al concederse una recompensa se
 * ASIGNABA el incremento en lugar de SUMARLO, asi que:
 *
 *     1er comentario -> est.commentsCreated = 1
 *     2º comentario -> est.commentsCreated = 1   (1 encima del 1)
 *     3er comentario -> est.commentsCreated = 1
 *
 * Que es exactamente lo que se vio: alguien con seis comentarios
 * publicados tenia el contador en 1, y por lo tanto la medalla de
 * "N comentarios" decia que le faltaban 5.
 *
 * ── POR QUÉ NO ESTÁ EN UN `.ts` SUELTO DEL SERVIDOR ────────────────
 *
 * Porque `functions/src/index.ts` importa `firebase-admin`, y Node no
 * puede cargarlo en una prueba: se cae al importar, antes de ejecutar
 * nada. Por eso la aritmética vive en `functions/src/stats.ts`, que
 * solo tiene numeros, y esa es la que se comprueba aqui.
 */
import assert from 'node:assert/strict';

import {
  ESTADISTICAS_VACIAS,
  diasDesde,
  leerEstadisticas,
  marcarEnMapa,
  num,
  pasarDia,
  ponerTotales,
  sumarContadores,
  subirTecho,
  tamanoMapa,
  type Estadisticas,
} from '../functions/src/stats';
import {
  cumpleRequisito,
  medallasNuevas,
  tieneCustom,
} from '../functions/src/medallas';

// ═══════════════════════════════════════════════════════════
// EL CASO QUE SE VIO
// ═══════════════════════════════════════════════════════════
//
// Se reproduce el fallo antiguo ("asignar en vez de sumar") y se
// comprueba que ahora NO pasa. Si alguien vuelve a cambiar la suma
// por una asignacion, esta seccion es la que se cae.

{
  let est: Estadisticas = { ...ESTADISTICAS_VACIAS };

  // Seis comentarios, uno detrás de otro, que es lo que hizo la
  // persona que aviso del fallo.
  for (let i = 0; i < 6; i++) {
    est = sumarContadores(est, { commentsCreated: 1, commentsInThreads: 1 });
  }

  assert.equal(est.commentsCreated, 6, 'seis comentarios se cuentan como seis');
  assert.equal(est.commentsInThreads, 6, 'los seis eran en hilos, que son debates');
}

// ── Y UNO DE CADA VEZ, QUE ES COMO PASA DE VERDAD ───────────
//
// Los triggers no llegan todos juntos, pero da igual: la suma es la
// misma. Esta es la comprobacion que falla si vuelve la asignacion.

{
  let est: Estadisticas = { ...ESTADISTICAS_VACIAS };

  const pasos = [1, 2, 3, 4, 5];

  pasos.forEach((total) => {
    est = sumarContadores(est, { threadsCreated: 1 });

    assert.equal(
      est.threadsCreated,
      total,
      `al hilo numero ${total} el contador va en ${total}`,
    );
  });
}

// ═══════════════════════════════════════════════════════════
// SUMAR
// ═══════════════════════════════════════════════════════════

assert.equal(
  sumarContadores({ ...ESTADISTICAS_VACIAS }, { commentsCreated: 1 }).commentsCreated,
  1,
  'un comentario en un contador a cero deja 1',
);

assert.equal(
  sumarContadores(
    { ...ESTADISTICAS_VACIAS, commentsCreated: 7 },
    { commentsCreated: 1 },
  ).commentsCreated,
  8,
  'un comentario con 7 de antes deja 8, no 1',
);

assert.equal(
  sumarContadores(
    { ...ESTADISTICAS_VACIAS, commentsCreated: 7 },
    { commentsCreated: -1 },
  ).commentsCreated,
  6,
  'borrar un comentario con 7 de antes deja 6',
);

// ── EL SUELO EN CERO ─────────────────────────────────────
//
// Los "Me gusta" y las reacciones se pueden quitar. Si el contador
// se quedara en -1, la persona perdia progreso que ya habia
// conseguido, y la medalla se le descontaria.

assert.equal(
  sumarContadores(
    { ...ESTADISTICAS_VACIAS, likesReceived: 0 },
    { likesReceived: -1 },
  ).likesReceived,
  0,
  'quitar el ultimo "Me gusta" no deja -1',
);

assert.equal(
  sumarContadores(
    { ...ESTADISTICAS_VACIAS, commentsCreated: 0 },
    { commentsCreated: -5 },
  ).commentsCreated,
  0,
  'una correccion que se pasa de la raya tampoco deja negativos',
);

// ── LO QUE NO VIENE NO SE TOCA ───────────────────────────
//
// El trigger de un comentario no manda `threadsCreated`. Si lo
// hiciera "poner 0" en los que no vienen, cada comentario borraria
// los hilos del usuario.

{
  const antes: Estadisticas = {
    ...ESTADISTICAS_VACIAS,
    threadsCreated: 3,
    commentsCreated: 9,
  };

  const despues = sumarContadores(antes, { commentsCreated: 1 });

  assert.equal(despues.threadsCreated, 3, 'un comentario no toca los hilos');
  assert.equal(despues.commentsCreated, 10, 'y sube el suyo');
}

// ── NO SE TOCA EL ORIGINAL ───────────────────────────────
//
// `est` viene de `leerEstadisticas`, que es una copia, pero la
// funcion tambien se llama con objetos compartidos. Que devuelva
// una copia nueva evita que un fallo en un sitio borre el mapa de
// XP por anime de otro.

{
  const antes: Estadisticas = {
    ...ESTADISTICAS_VACIAS,
    animeXp: { frieren: 500 },
  };

  const despues = sumarContadores(antes, { commentsCreated: 1 });

  despues.commentsCreated = 999;

  assert.equal(antes.commentsCreated, 0, 'cambiar el resultado no cambia el original');
  assert.equal(antes.animeXp.frieren, 500, 'el mapa de XP por anime sigue intacto');
}

// ═══════════════════════════════════════════════════════════
// PONER (LA TRIVIA)
// ═══════════════════════════════════════════════════════════
//
// La trivia llega en absoluto, no en incremento, porque su trigger
// lee el documento antes de escribir. Aqui se comprueba que Pony
// el total y que NO suma encima.

assert.equal(
  ponerTotales({ ...ESTADISTICAS_VACIAS, triviaCompleted: 5 }, { triviaCompleted: 3 })
    .triviaCompleted,
  3,
  'la trivia pone el total, no suma encima del que habia',
);

assert.equal(
  ponerTotales({ ...ESTADISTICAS_VACIAS, triviaCorrect: 2 }, { triviaCorrect: 0 })
    .triviaCorrect,
  0,
  'y puede bajar, porque es el total de ahora',
);

assert.equal(
  ponerTotales({ ...ESTADISTICAS_VACIAS, triviaCompleted: 5 }, { triviaPerfect: 1 })
    .triviaCompleted,
  5,
  'lo que no viene no se toca',
);

// ── LA TRIVIA NO MEZCLA CON LOS CONTADORES ────────────────
//
// Que las dos cosas vivan en el mismo objeto es el motivo de que
// acabaran confundidas. Se comprueba que tocar uno no mueve el otro
// en ninguna de las dos direcciones.

{
  const antes: Estadisticas = {
    ...ESTADISTICAS_VACIAS,
    commentsCreated: 4,
    triviaCompleted: 4,
  };

  const conComentario = sumarContadores(antes, { commentsCreated: 1 });

  assert.equal(conComentario.triviaCompleted, 4, 'un comentario no suma trivia');
  assert.equal(conComentario.commentsCreated, 5, 'y sube el suyo');

  const conTrivia = ponerTotales(antes, { triviaCompleted: 9 });

  assert.equal(conTrivia.commentsCreated, 4, 'una trivia no suma comentarios');
  assert.equal(conTrivia.triviaCompleted, 9, 'y pone la suya');
}

// ═══════════════════════════════════════════════════════════
// EL TECHO DE SEGUIDORES
// ═══════════════════════════════════════════════════════════
//
// Este NO es un contador: es el numero mas alto que ha tenido. Si
// bajase, la medalla de "primer fan" se le descontaria a alguien que
// ya la habia ganado, solo por dejar de seguirle.

assert.equal(
  subirTecho({ ...ESTADISTICAS_VACIAS }, 7).followersReceived,
  7,
  'siete seguidores dejan el techo en 7',
);

assert.equal(
  subirTecho({ ...ESTADISTICAS_VACIAS, followersReceived: 12 }, 4).followersReceived,
  12,
  'dejar de seguirle NO baja el techo',
);

assert.equal(
  subirTecho({ ...ESTADISTICAS_VACIAS, followersReceived: 3 }, 9).followersReceived,
  9,
  'pero si sube, sube',
);

assert.equal(
  subirTecho({ ...ESTADISTICAS_VACIAS }, 0).followersReceived,
  0,
  'cero seguidores es cero, no menos',
);

// ═══════════════════════════════════════════════════════════
// LEER UN DOCUMENTO QUE NO ESTA ENTERO
// ═══════════════════════════════════════════════════════════
//
// Los documentos de usuario son heterogeneos: los de antes de que
// existiera la gamificacion no tienen nada de esto. Un campo que
// falta, o que viene como texto, tiene que dar 0 y no romper nada.

assert.deepEqual(
  leerEstadisticas(undefined),
  ESTADISTICAS_VACIAS,
  'un documento sin stats da las vacias',
);

assert.deepEqual(
  leerEstadisticas({}),
  ESTADISTICAS_VACIAS,
  'un documento con stats vacio tambien',
);

assert.deepEqual(
  leerEstadisticas({ stats: 'esto no es un objeto' }),
  ESTADISTICAS_VACIAS,
  'un stats que no es un objeto no revienta',
);

assert.equal(
  leerEstadisticas({ stats: { commentsCreated: '6' } }).commentsCreated,
  6,
  'un numero guardado como texto se lee igual',
);

// ── EL NaN, QUE ES EL QUE MAS DAÑOS HACE ─────────────────
//
// Si un contador llega a ser NaN, se queda en NaN para siempre,
// porque sumar a NaN da NaN. Con esto vuelve a 0.

assert.equal(num(Number.NaN), 0, 'NaN es cero');
assert.equal(num('hola'), 0, 'un texto que no es numero es cero');
assert.equal(num(undefined), 0, 'undefined es cero');
assert.equal(num(null), 0, 'null es cero');
assert.equal(num(Number.POSITIVE_INFINITY), 0, 'un infinito es cero, no Infinity');
assert.equal(num(-12), -12, 'un negativo se respeta, el suelo lo pone el que suma');

assert.equal(
  leerEstadisticas({ stats: { commentsCreated: Number.NaN } }).commentsCreated,
  0,
  'un commentsCreated en NaN se recupera como 0',
);

// ── animeXp, QUE NO ES UN CONTADOR ───────────────────────
//
// Es el unico campo que no es un numero suelto, y por eso queda
// fuera de los tres procedimientos. Si en algun momento se colara en
// la suma, TS lo dira; aqui se comprueba que sobrevive.

{
  const est = leerEstadisticas({ stats: { animeXp: { frieren: 1200 } } });

  assert.equal(est.animeXp['frieren'], 1200, 'el XP por anime se lee bien');

  const despues = sumarContadores(est, { commentsCreated: 1 });

  assert.deepEqual(
    despues.animeXp,
    { frieren: 1200 },
    'y no lo toca sumar un comentario',
  );
}

assert.deepEqual(
  leerEstadisticas({ stats: { animeXp: 'nada' } }).animeXp,
  {},
  'un animeXp que no es un objeto se queda vacio',
);

console.log('  contadores de progreso: OK');

// ═══════════════════════════════════════════════════════════
// EVALUACIÓN DE REQUISITOS (LO QUE CONCEDE DE VERDAD)
// ═══════════════════════════════════════════════════════════
//
// `cumpleRequisito` y `medallasNuevas` son lo que ejecuta la
// Cloud Function al dar XP. Si esto falla aquí, falla allí.

const EST_BASE = { ...ESTADISTICAS_VACIAS };

assert.equal(
  cumpleRequisito({ tipo: 'hilos', valor: 1 }, EST_BASE, 1, {}, 0),
  false,
  'sin hilos no se cumple el de un hilo',
);

assert.equal(
  cumpleRequisito(
    { tipo: 'hilos', valor: 1 },
    { ...EST_BASE, threadsCreated: 1 },
    1,
    {},
    0,
  ),
  true,
  'con un hilo sí',
);

// ── XP total ─────────────────────────────────────────

assert.equal(
  cumpleRequisito({ tipo: 'xp', valor: 10000 }, EST_BASE, 5, {}, 9999),
  false,
  'a 9.999 no hay medalla de 10.000 XP',
);

assert.equal(
  cumpleRequisito({ tipo: 'xp', valor: 10000 }, EST_BASE, 5, {}, 10000),
  true,
  'a 10.000 sí, aunque los stats no digan nada',
);

// ── Series distintas ───────────────────────────────

assert.equal(
  cumpleRequisito(
    { tipo: 'seriesDiferentes', valor: 10 },
    { ...EST_BASE, animeXp: { a: 5, b: 0, c: 20 } },
    1,
    {},
    0,
  ),
  false,
  'dos series con XP no son diez (el cero no cuenta)',
);

assert.equal(
  cumpleRequisito(
    { tipo: 'seriesDiferentes', valor: 2 },
    { ...EST_BASE, animeXp: { a: 5, b: 0, c: 20 } },
    1,
    {},
    0,
  ),
  true,
  'pero sí son dos',
);

// ── Manuales y pendientes nunca solas ──────────────

assert.equal(
  cumpleRequisito(null, EST_BASE, 60, {}, 999999),
  false,
  'una medalla manual no se concede sola ni con todo al máximo',
);

// ── medallasNuevas: solo las nuevas ────────────────

{
  const nuevas = medallasNuevas(
    { ...EST_BASE, commentsCreated: 10 },
    1,
    { medal_primera_voz: '2026-01-01' },
    {},
    0,
  );

  assert.ok(
    nuevas.includes('medal_rompehielos'),
    'diez comentarios dan Rompehielos',
  );
  assert.ok(
    !nuevas.includes('medal_primera_voz'),
    'la ya desbloqueada no se repite',
  );
  assert.ok(
    !nuevas.includes('medal_miembro_fundador'),
    'la manual no sale sola',
  );
}

console.log('  requisitos del servidor: OK');

// ═══════════════════════════════════════════════════════════
// FASE 2: MAPAS, DÍAS, ANTIGÜEDAD Y PERFIL
// ═══════════════════════════════════════════════════════════

{
  // marcarEnMapa no duplica: dos marcas del mismo club cuentan uno.
  const uno = marcarEnMapa({}, 'club1');
  const dos = marcarEnMapa(uno, 'club1');
  const tres = marcarEnMapa(dos, 'club2');

  assert.deepEqual(Object.keys(dos).sort(), ['club1'], 'repetir no duplica');
  assert.deepEqual(Object.keys(tres).sort(), ['club1', 'club2'], 'otro sí suma');

  assert.equal(tamanoMapa({}), 0, 'mapa vacío, cero');
  assert.equal(tamanoMapa(null), 0, 'lo que no es mapa, cero');
  assert.equal(tamanoMapa(tres), 2, 'dos clubs son dos');
}

{
  // pasarDia solo suma si el día no estaba contado.
  const a = pasarDia(6, '2026-10-01', '2026-10-01');

  assert.deepEqual(a, { total: 6, ultimo: '2026-10-01' }, 'el mismo día no suma');

  const b = pasarDia(6, '2026-10-01', '2026-10-02');

  assert.deepEqual(b, { total: 7, ultimo: '2026-10-02' }, 'un día nuevo suma uno');
}

{
  // diasDesde con Timestamp y con ISO.
  const ahora = Date.parse('2026-10-14T00:00:00.000Z');

  assert.equal(
    diasDesde({ toMillis: () => Date.parse('2025-10-14T00:00:00.000Z') }, ahora),
    365,
    'un año son 365 días',
  );
  assert.equal(
    diasDesde('2026-10-13T12:00:00.000Z', ahora),
    0,
    'menos de un día son cero',
  );
  assert.equal(diasDesde(null, ahora), 0, 'sin fecha no hay antigüedad');
  assert.equal(diasDesde('esto no es fecha', ahora), 0, 'ni con texto roto');
}

{
  // Los tipos nuevos se evalúan contra mapas y extra.
  const est = {
    ...ESTADISTICAS_VACIAS,
    diasActivosTotal: 7,
    clubesUnidos: { a: true, b: true, c: true, d: true, e: true } as Record<string, true>,
    clubesCreados: { a: true } as Record<string, true>,
  };

  assert.equal(
    cumpleRequisito({ tipo: 'dias', valor: 7 }, est, 1, {}, 0, { antiguedadDias: 0, perfilCompleto: false, perfilCustom: false }),
    true,
    'siete días dan Siempre Presente',
  );
  assert.equal(
    cumpleRequisito({ tipo: 'clubes', valor: 5 }, est, 1, {}, 0, { antiguedadDias: 0, perfilCompleto: false, perfilCustom: false }),
    true,
    'cinco clubes dan Explorador Social',
  );
  assert.equal(
    cumpleRequisito({ tipo: 'canales', valor: 5 }, est, 1, {}, 0, { antiguedadDias: 0, perfilCompleto: false, perfilCustom: false }),
    false,
    'sin canales no hay Arquitecto',
  );
  assert.equal(
    cumpleRequisito({ tipo: 'antiguedadDias', valor: 365 }, est, 1, {}, 0, { antiguedadDias: 364, perfilCompleto: false, perfilCustom: false }),
    false,
    'a 364 días no hay Veterano',
  );
  assert.equal(
    cumpleRequisito({ tipo: 'perfilCompleto', valor: 1 }, est, 1, {}, 0, { antiguedadDias: 0, perfilCompleto: true, perfilCustom: false }),
    true,
    'perfil completo da Habitante',
  );
}

{
  // leerEstadisticas rellena los mapas nuevos.
  const est = leerEstadisticas({});

  assert.deepEqual(est.clubesUnidos, {}, 'sin mapa hay mapa vacío');
  assert.equal(est.diasActivosTotal, 0, 'sin días hay cero');
  assert.equal(est.diasActivosUltimo, '', 'sin último hay vacío');
}

console.log('  fase 2 del servidor: OK');

// ═══════════════════════════════════════════════════════════
// FASE 2B: VISUALES, TIERS POPULARES Y PERFIL CUSTOM
// ═══════════════════════════════════════════════════════════

{
  const est = {
    ...ESTADISTICAS_VACIAS,
    visualesIds: { h1: true } as Record<string, true>,
    tiersPopularesIds: {} as Record<string, true>,
  };

  assert.equal(
    cumpleRequisito({ tipo: 'visuales', valor: 10 }, est, 1, {}, 0, { antiguedadDias: 0, perfilCompleto: false, perfilCustom: false }),
    false,
    'un hilo con imagen no son diez',
  );
  assert.equal(
    cumpleRequisito({ tipo: 'tiersPopulares', valor: 1 }, est, 1, {}, 0, { antiguedadDias: 0, perfilCompleto: false, perfilCustom: false }),
    false,
    'sin tiers populares no hay Rey del Ranking',
  );
  assert.equal(
    cumpleRequisito({ tipo: 'perfilCustom', valor: 1 }, est, 1, {}, 0, { antiguedadDias: 0, perfilCompleto: false, perfilCustom: true }),
    true,
    'con personalización hay Perfil de Leyenda',
  );
}

{
  // tieneCustom: lo mismo que mira el cliente en aProgreso.
  assert.equal(
    tieneCustom({ avatarFrame: null, decorations: [], showcases: ['logros', 'destacadas'] }),
    false,
    'perfil virgen no es custom',
  );
  assert.equal(
    tieneCustom({ avatarFrame: 'dorado', decorations: [], showcases: ['logros', 'destacadas'] }),
    true,
    'marco equipado sí',
  );
  assert.equal(
    tieneCustom({ decorations: [{ id: 'x' }], showcases: [] }),
    true,
    'una pegatina sí',
  );
  assert.equal(
    tieneCustom({ showcases: ['logros', 'destacadas', 'coleccion'] }),
    true,
    'vitrinas tocadas sí',
  );
  assert.equal(
    tieneCustom({ visibleBadgeIds: [] }),
    true,
    'elegir insignias (aunque sea lista vacía explícita) sí',
  );
}

console.log('  fase 2b del servidor: OK');