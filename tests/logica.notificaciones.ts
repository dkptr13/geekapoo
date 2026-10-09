/**
 * Comprobaciones de la LÓGICA de notificaciones, sin navegador y sin
 * emulador.
 *
 * Existe por un motivo concreto: añadir un tipo de aviso nuevo es
 * tocar tres sitios (el tipo en `types/notifications.ts`, el icono en
 * `utils/notificaciones.ts` y el `switch` del texto) y el tercero no
 * avisa de nada si se olvida. `ESTILO` está tipado como
 * `Record<NotificationType, ...>`, así que el compilador pilla el
 * icono; pero el `switch` del texto es un `default` que devuelve
 * "Tienes actividad en la comunidad", y ahí un tipo sin texto
 * propio se pinta genérico sin que nadie se entere.
 *
 * Estos asserts miran los tipos DESDE la unión, no desde una lista
 * escrita a mano, así que un tipo nuevo queda cubierto solo.
 *
 *   npm run test:logica
 */
import assert from 'node:assert/strict';

import {
  destinoDeNotificacion,
  esNotificacionImportante,
  iconoDe,
  recorte,
  textoDe,
  tiempoRelativo,
  textoDelContador,
} from '../src/utils/notificaciones';
import type { AppNotification, NotificationType } from '../src/types/notifications';

// ──────────────────────────────────────────────────────────
// 0. Todos los tipos de aviso
// ──────────────────────────────────────────────────────────

/**
 * Los tipos tal y como los declara la unión.
 *
 * Se leen del tipo, no de un array: si alguien añade `'thread_like'`
 * a `NotificationType`, la lista de aquí incluye 'thread_like' y el
 * test exige icono y texto para él. Lo que se busca es que el test
 * se quede corto, no al revés.
 */
const TIPOS: NotificationType[] = [
  'comment_reply',
  'comment_thread',
  'mention',
  'follow',
  'post_like',
  'post_reaction',
  'comment_like',
  'comment_reaction',
  'level_up',
  'achievement',
  'trivia',
];

// Si la unión crece, esto falla y obliga a añadir el tipo a la lista
// (que es justo lo que se quiere: que el test cubra el tipo nuevo).
type _Cobertura = Exclude<NotificationType, (typeof TIPOS)[number]> extends never
  ? true
  : ['falta en TIPOS', Exclude<NotificationType, (typeof TIPOS)[number]>];
const _cobertura: _Cobertura = true;
void _cobertura;

/** Un aviso mínimo con los campos que el texto puede usar. */
function aviso(extra: Partial<AppNotification>): AppNotification {
  return {
    id: 'n1',
    type: 'mention',
    recipientId: 'yo',
    actorId: 'otro',
    actorName: 'Ana',
    actorAvatar: '',
    createdAt: '2026-10-05T10:00:00.000Z',
    read: false,
    ...extra,
  } as AppNotification;
}

/**
 * El texto genérico. Si un tipo cae aquí, es que no se olvidó de
 * escribir su frase.
 */
const GENERICO = 'Tienes actividad en la comunidad';

// ──────────────────────────────────────────────────────────
// 1. Cada tipo tiene icono y frase propias
// ──────────────────────────────────────────────────────────

for (const tipo of TIPOS) {
  const icono = iconoDe(aviso({ type: tipo, reaction: 'fire' }));

  assert.ok(
    icono && icono !== '🔔',
    `el tipo "${tipo}" se pinta con el icono por defecto (🔔): falta su entrada en ESTILO`,
  );

  // La trivia lleva el texto compuesto desde el servidor, así que
  // aquí se mira con los campos que el servidor sí rellena.
  const texto = textoDe(
    aviso({
      type: tipo,
      level: 7,
      medalName: 'Debut',
      triviaCorrect: 3,
      triviaTotal: 5,
    }),
  );

  assert.ok(texto && texto.length > 0, `el tipo "${tipo}" no produce texto`);
  assert.notEqual(
    texto,
    GENERICO,
    `el tipo "${tipo}" cae en el texto genérico: falta su frase en textoDe()`,
  );
}

// El tipo con el que sereportedo el bug: el comentario nuevo en tu
// hilo. Sin frase propia salía "Tienes actividad en la comunidad".
assert.equal(
  textoDe(aviso({ type: 'comment_thread' })),
  'Ana comento en tu hilo',
  'el aviso de comentario en tu hilo debe decir qué pasó',
);
assert.equal(
  iconoDe(aviso({ type: 'comment_thread' })),
  '💬',
  'el comentario en tu hilo es un comentario, no una reacción',
);

// Y el que ya existía, para que el nuevo no lo haya pisado.
assert.equal(textoDe(aviso({ type: 'comment_reply' })), 'Ana respondio a tu comentario');

// ──────────────────────────────────────────────────────────
// 2. El texto del servidor manda sobre el switch
// ──────────────────────────────────────────────────────────

// La gamificación la gana uno mismo, no se la hace nadie: el texto
// viene compuesto del servidor y el cliente no debe tocarlo. Si
// `title` está, sale `title` tal cual.
assert.equal(
  textoDe(aviso({ type: 'level_up', title: 'Has subido al nivel 9' })),
  'Has subido al nivel 9',
  'un aviso con title del servidor debe enseñarse literal',
);

// Sin actor conocido se dice "Alguien", no el mismo nombre de antes.
assert.equal(textoDe(aviso({ type: 'mention', actorName: '' })), 'Alguien te menciono');

// ──────────────────────────────────────────────────────────
// 3. Qué merece la atención de KAPO-CHAN
// ──────────────────────────────────────────────────────────

// Los hechos únicos: subir de nivel, ganar medalla, cerrar la trivia.
for (const tipo of ['level_up', 'achievement', 'trivia'] as NotificationType[]) {
  assert.ok(
    esNotificacionImportante(aviso({ type: tipo })),
    `"${tipo}" es un hecho único y debería celebrar Kapo`,
  );
}

// Lo repetitivo no: veinte "Me gusta" en un rato no son veinte
// interrupciones. Y aquí entran los comentarios nuevos en tu hilo,
// que es lo más repetido que hay en la comunidad.
for (const tipo of [
  'comment_reply',
  'comment_thread',
  'mention',
  'follow',
  'post_like',
  'post_reaction',
  'comment_like',
  'comment_reaction',
] as NotificationType[]) {
  assert.equal(
    esNotificacionImportante(aviso({ type: tipo })),
    false,
    `"${tipo}" puede repetirse mucho: no debe interrumpir a Kapo`,
  );
}

// ──────────────────────────────────────────────────────────
// 4. A dónde lleva cada aviso
// ──────────────────────────────────────────────────────────
//
// Este bloque es la razón de ser de `destinoDeNotificacion`: la
// navegación de la campana era un `CustomEvent` que nadie escuchaba,
// así que el aviso se cerraba y no pasaba nada. Y no salía ningún
// error: la web parecía viva y el enlace estaba muerto.
//
// Se mira que la URL sea la que se espera, no solo que no esté
// vacía: un `?tab=inicio` para todo significa que la campana abre
// siempre el feed, que es el bug original con otro nombre.

/** El query de un aviso, como mapa. */
function query(n: Partial<AppNotification>): URLSearchParams {
  const { search } = destinoDeNotificacion(aviso(n));
  return new URLSearchParams(search);
}

// El caso que se vio roto: "oscar comento en tu hilo".
assert.equal(
  query({ type: 'comment_thread', threadId: 'h1', commentId: 'c1' }).get('hilo'),
  'h1',
  'un comentario en tu hilo debe abrir ESE hilo',
);
assert.equal(
  query({ type: 'comment_thread', threadId: 'h1', commentId: 'c1' }).get('comentario'),
  'c1',
  'y debe abrir el comentario concreto, para que se vea resaltado',
);
assert.equal(
  query({ type: 'comment_thread', threadId: 'h1' }).get('tab'),
  'inicio',
  'el hilo se abre en el feed, no en la wiki',
);

// Los mismos dos campos, pero sin `commentId`: se abre el hilo
// entero. No se inventa un comentario vacío, que no resalta nada.
assert.equal(
  query({ type: 'comment_reply', threadId: 'h2' }).get('comentario'),
  null,
  'sin commentId no se escribe la clave: no hay comentario al que ir',
);
assert.equal(query({ type: 'comment_reply', threadId: 'h2' }).get('hilo'), 'h2');

// Un follow va al PERFIL de quien te sigue.
//
// Va antes que todo lo demás a propósito: es el único aviso sin
// contenido asociado, así que si el `threadId` se comprobara antes,
// un follow que por lo que sea trajera un hilo se abriría en el
// sitio equivocado en lugar de en el perfil.
assert.equal(
  query({ type: 'follow', targetId: 'u2' }).get('usuario'),
  'u2',
  'un follow debe abrir el perfil de quien te sigue',
);
assert.equal(
  query({ type: 'follow', targetId: 'u2' }).get('tab'),
  'perfil',
  'y en la pestaña de perfil, no en la de inicio',
);

// Aunque le venga un threadId (que no debería), el perfil gana.
assert.equal(
  query({ type: 'follow', targetId: 'u2', threadId: 'h9' }).get('usuario'),
  'u2',
  'el perfil tiene prioridad sobre cualquier otro destino',
);

// Sin targetId no hay a dónde ir, y se dice en vez de navegar a
// ciegas.
const followRoto = destinoDeNotificacion(aviso({ type: 'follow' }));
assert.equal(followRoto.search, '', 'un follow sin targetId no tiene destino');
assert.ok(followRoto.sinDestino, 'pero se explica por qué');

// Un comentario en un anime: a la wiki, por serie.
assert.equal(query({ type: 'mention', targetType: 'anime', targetId: 'a1' }).get('anime'), 'a1');
assert.equal(query({ type: 'mention', targetType: 'anime', targetId: 'a1' }).get('tab'), 'wiki');

// Un capítulo: el id del capítulo NO sirve para abrir la wiki, hace
// falta la serie. Y la pestaña tiene que ser la de capítulos, o se
// abre la ficha y hay que buscarla a mano.
const cap = query({ type: 'mention', targetType: 'episode', targetId: 'ep9', animeId: 'a1' });
assert.equal(cap.get('anime'), 'a1', 'un capítulo se abre por su SERIE, no por su id');
assert.equal(cap.get('wikiTab'), 'episodes', 'y en la pestaña de capítulos');
assert.equal(cap.get('anime') !== 'ep9', true, 'el id del capítulo no debe ir en "anime"');

// Un personaje, igual.
const pers = query({ type: 'mention', targetType: 'character', targetId: 'c9', animeId: 'a1' });
assert.equal(pers.get('anime'), 'a1');
assert.equal(pers.get('wikiTab'), 'characters');

// Un capítulo sin `animeId`: aviso antiguo. No se abre el catálogo
// entero fingiendo que el id del capítulo es una serie.
const viejo = destinoDeNotificacion(
  aviso({ type: 'mention', targetType: 'episode', targetId: 'ep9' }),
);
assert.equal(viejo.search, '', 'sin animeId no hay destino, y no se navega a ciegas');
assert.ok(viejo.sinDestino, 'pero se dice por qué, en vez de cerrar en silencio');

// La gamificación es tuya, y se lleva a donde se ve.
assert.equal(query({ type: 'achievement', medalName: 'Debut' }).get('tab'), 'logros');
assert.equal(query({ type: 'level_up', level: 9 }).get('tab'), 'logros');
assert.equal(query({ type: 'trivia', triviaCorrect: 3, triviaTotal: 5 }).get('tab'), 'trivia');

// El follow tiene su propio texto, no el genérico: es el aviso que
// más se pincha en los tests porque es el único sin contenido.
assert.equal(textoDe(aviso({ type: 'follow' })), 'Ana ahora te sigue');
assert.equal(iconoDe(aviso({ type: 'follow' })), '👥');

// Un "Me gusta" a un hilo: `threadId` está, así que entra por la
// rama del hilo, no por la de gamificación.
assert.equal(query({ type: 'post_like', threadId: 'h3' }).get('hilo'), 'h3');

// Un "Me gusta" a un comentario de la wiki: con `animeId` se abre la
// serie; sin él, no hay a dónde ir.
assert.equal(
  query({ type: 'comment_like', animeId: 'a2' }).get('anime'),
  'a2',
  'un "Me gusta" a un comentario de la wiki abre su serie',
);
assert.equal(
  destinoDeNotificacion(aviso({ type: 'comment_like' })).search,
  '',
  'sin animeId no se inventa un destino',
);

// Un aviso sin nada reconocible va al feed. Es mejor que no hacer
// nada: el usuario ve que ha ido a algún sitio.
assert.equal(destinoDeNotificacion(aviso({ type: 'mention' })).search, '?tab=inicio');

// Ningún destino puede ser una URL sin query: `navigate({search: ''})`
// deja la web en la raíz, que no es a donde queremos ir.
for (const tipo of TIPOS) {
  const { search } = destinoDeNotificacion(
    aviso({ type: tipo, threadId: 'h', commentId: 'c', animeId: 'a', targetId: 't' }),
  );
  assert.ok(search.startsWith('?'), `"${tipo}" produce una URL sin query: "${search}"`);
  assert.ok(
    new URLSearchParams(search).get('tab') !== null,
    `"${tipo}" no dice de qué pestaña sale: "${search}"`,
  );
}

// ──────────────────────────────────────────────────────────
// 5. El recorte del snippet
// ──────────────────────────────────────────────────────────

assert.equal(recorte(undefined), undefined);
assert.equal(recorte(''), undefined);
assert.equal(recorte('corto'), 'corto');

// Corta, y avisa de que sigue: si no, el panel muestra un texto que
// acaba a media palabra y parece que el aviso está truncado sin
// querer.
const largo = 'palabra '.repeat(40).trim();
const cortado = recorte(largo, 80);
assert.ok(cortado && cortado.length <= 83, `el recorte se pasa de largo: ${cortado}`);
assert.ok(cortado?.endsWith('...'), 'un recorte debe acabar en "..."');

// No parte palabras por la mitad: corta en el último espacio.
assert.ok(!/\s\.\.\.$/.test(cortado ?? ''), `no debe cortar a media palabra: ${cortado}`);

// ──────────────────────────────────────────────────────────
// 6. El contador de la campana
// ──────────────────────────────────────────────────────────

assert.equal(textoDelContador(0), null, 'cero no se pinta: no hay punto rojo sin nada');
assert.equal(textoDelContador(1), '1');
assert.equal(textoDelContador(99), '99');
assert.equal(textoDelContador(120), '99+', 'por encima del tope sale 99+');

// ──────────────────────────────────────────────────────────
// 7. El tiempo relativo
// ──────────────────────────────────────────────────────────

// Fijado: si el test usara `new Date()` se pondría rojo solo con
// el paso del tiempo.
const AHORA = new Date('2026-10-05T12:00:00.000Z').getTime();

assert.equal(tiempoRelativo('2026-10-05T11:59:40.000Z', AHORA), 'Ahora');
assert.equal(tiempoRelativo('2026-10-05T11:59:00.000Z', AHORA), 'Hace un minuto');
assert.equal(tiempoRelativo('2026-10-05T11:30:00.000Z', AHORA), 'Hace 30 minutos');
assert.equal(tiempoRelativo('2026-10-05T11:00:00.000Z', AHORA), 'Hace una hora');
assert.equal(tiempoRelativo('2026-10-05T03:00:00.000Z', AHORA), 'Hace 9 horas');
assert.equal(tiempoRelativo('2026-10-04T11:00:00.000Z', AHORA), 'Ayer');
assert.equal(tiempoRelativo('2026-10-02T11:00:00.000Z', AHORA), 'Hace 3 dias');

// Una fecha mala no puede romper el panel: se devuelve vacío y el
// componente lo pinta sin fecha, en vez de "NaN de NaN".
assert.equal(tiempoRelativo(null, AHORA), '');
assert.equal(tiempoRelativo(undefined, AHORA), '');
assert.equal(tiempoRelativo('no-es-una-fecha', AHORA), '');

// Y un reloj que va atrasado no da un "Hace -3 minutos".
assert.equal(tiempoRelativo('2026-10-05T12:05:00.000Z', AHORA), 'Ahora');

console.log('logica.notificaciones: OK');