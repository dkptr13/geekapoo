/**
 * Comprobaciones de la LOGICA del perfil, sin navegador y sin
 * emulador.
 *
 * Se separa del componente (`ProfileView` y sus secciones) por el
 * mismo motivo que `reactionLogic`, `notificaciones` y `follows`: lo
 * que se puede decidir sin red se comprueba en cero segundos.
 *
 * Lo que se comprueba aqui es justo lo que NO da error si se
 * rompe. Una linea de tiempo con dos hilos de otra persona, un
 * requisito de medalla mal calculada o una fecha de subida de
 * nivel que se pinta como "Invalid Date" no lanza nada: la pagina
 * se ve igual, solo que mintiendo. Eso no lo caza un error de
 * consola.
 *
 *   npm run test:logica
 *
 * Se escribe SIN TILDES, igual que los otros modulos de logica,
 * porque los comentarios tecnicos se leen en cualquier terminal.
 * Las cadenas que se comparan son de codigo del modulo, no texto
 * para el usuario (los textos con tildes viven en los componentes).
 */
import assert from 'node:assert/strict';

import {
  calcularStats,
  diasDesde,
  lineaDeTiempo,
  textoDias,
  usernameEsValido,
  validarEditable,
} from '../src/utils/profile';
import { MAX_AVATAR_URL, MAX_BIO, MAX_DISPLAY_NAME } from '../src/types/profile';
import {
  COLOR_POR_DEFECTO,
  MAX_DESTACADAS,
  MAX_INSIGNIAS_VISIBLES,
  MAX_NOMBRE_PERSONAJE,
} from '../src/data/profileCustomization';
import type { PerfilDatos, PerfilEditable } from '../src/types/profile';
import type { Comment, Thread, User } from '../src/types';

// ──────────────────────────────────────────────────────────
// DATOS DE PRUEBA
// ──────────────────────────────────────────────────────────
//
// Se montan a mano y NO se falsean: si un campo no está, no se
// pone. La razón es que un objeto de prueba completo esconde
// justo los bugs que se buscan aquí, que son los de los datos que
// NO llegan.

type Medicallas = { id: string; nombre: string };

const catalogo: Medicallas[] = [
  { id: 'primer_hilo', nombre: 'Primer Hilo' },
  { id: 'veterano', nombre: 'Veterano Geekapoo' },
];

/** Un hilo mínimo. Solo se mira lo que usa la linea de tiempo. */
function hilo(id: string, authorId: string, createdAt: string, title = `Hilo ${id}`): Thread {
  return { id, authorId, createdAt, title } as unknown as Thread;
}

/** Un comentario minimo. */
function comentario(
  id: string,
  authorId: string,
  createdAt: string,
  targetType: Comment['targetType'] = 'thread',
): Comment {
  return {
    id,
    authorId,
    createdAt,
    body: `Comentario ${id}`,
    targetType,
    targetId: 't1',
  } as unknown as Comment;
}

function datosDe(extra: Partial<PerfilDatos> = {}): PerfilDatos {
  return {
    uid: 'u1',
    threads: [],
    comments: [],
    medals: {},
    catalogo: catalogo as never,
    xp: 0,
    likesReceived: 0,
    createdAt: new Date(Date.now() - 86_400_000).toISOString(),
    followersCount: 0,
    followingCount: 0,
    ...extra,
  };
}

// ──────────────────────────────────────────────────────────
// 1. LAS ESTADISTICAS
// ──────────────────────────────────────────────────────────

const stats = calcularStats(
  datosDe({
    threads: [
      hilo('t1', 'u1', '2024-01-01'),
      hilo('t2', 'u1', '2024-01-02'),
      // De OTRA persona: no puede contar.
      hilo('t3', 'u2', '2024-01-03'),
    ],
    comments: [
      comentario('c1', 'u1', '2024-01-04'),
      comentario('c2', 'u1', '2024-01-05'),
      comentario('c3', 'u2', '2024-01-06'),
    ],
    xp: 7240,
    medals: { primer_hilo: '2024-01-01T00:00:00.000Z', veterano: '2024-06-01T00:00:00.000Z' },
    likesReceived: 42,
    followersCount: 1284,
    followingCount: 347,
  }),
);

// Cuenta lo suyo, no lo de los demas: dos hilos y dos comentarios
// son los de u1, y t3 y c3 son de otra persona.
assert.equal(stats.hilos, 2, 'hilos: solo los suyos');
assert.equal(stats.comentarios, 2, 'comentarios: solo los suyos');
assert.equal(stats.xp, 7240, 'el XP total se lee tal cual');
assert.equal(stats.medallas, 2, 'medallas: cuenta las del mapa');
assert.equal(stats.meGusta, 42, 'los me gusta vienen de stats.likesReceived');
assert.equal(stats.seguidores, 1284, 'los seguidores vienen del contexto');
assert.equal(stats.seguidos, 347, 'los seguidos vienen del contexto');

// Un perfil de verdad nunca tiene contadores negativos, pero un
// documento antiguo puede no tenerlos, y un valor roto tiene que
// salir como 0 y no como "NaN" en la tarjeta.
const statsVacias = calcularStats(
  datosDe({ likesReceived: -5, xp: -10, followersCount: -1, followingCount: -1 }),
);
assert.equal(statsVacias.meGusta, 0, 'un me gusta negativo es 0, no -5');
assert.equal(statsVacias.xp, 0, 'un XP negativo es 0');
assert.equal(statsVacias.seguidores, 0, 'unos seguidores negativos son 0');
assert.equal(statsVacias.seguidos, 0, 'unos seguidos negativos son 0');

// Las reacciones se SACAN del contenido, no de `stats`: no hay
// ningún campo que las cuente, así que el perfil las suma él.
const conReacciones = calcularStats(
  datosDe({
    threads: [
      { ...hilo('t1', 'u1', '2024-01-01'), reactionsTotal: 5 } as unknown as Thread,
      // Un hilo viejo sin `reactionsTotal`: se recurre a sumar el
      // mapa. Si no, un usuario con 300 reacciones（旧） diria 0.
      {
        ...hilo('t2', 'u1', '2024-01-02'),
        reactionCounts: { fuego: 3, pulgar: 2 },
      } as unknown as Thread,
      { ...hilo('t3', 'u2', '2024-01-03'), reactionsTotal: 99 } as unknown as Thread,
    ],
    comments: [
      {
        ...comentario('c1', 'u1', '2024-01-04'),
        reactionsTotal: 7,
      } as unknown as Comment,
    ],
  }),
);
assert.equal(
  conReacciones.reacciones,
  17,
  'reacciones: reactionsTotal + el mapa de los viejos, y solo lo suyo',
);

// ──────────────────────────────────────────────────────────
// 2. LOS DIAS
// ──────────────────────────────────────────────────────────

assert.equal(diasDesde(undefined), 0, 'sin fecha no hay dias');
assert.equal(diasDesde(''), 0, 'una fecha vacia no da dias');
assert.equal(diasDesde('no es una fecha'), 0, 'una fecha rota no da dias');
assert.equal(diasDesde(new Date(Date.now() - 86_400_000).toISOString()), 1, 'un dia');
assert.equal(diasDesde(new Date(Date.now() - 5 * 86_400_000).toISOString()), 5, 'cinco dias');

// Una fecha del futuro (un reloj desajustado, o un documento escrito
// por una maquina con la hora mal) no puede dar un numero NEGATIVO
// de dias en la tarjeta: "hace -3 dias" no existe.
const futuro = diasDesde(new Date(Date.now() + 3 * 86_400_000).toISOString());
assert.ok(futuro >= 0, 'una fecha futura no da dias negativos');

// El texto corto. Importa que "un día" lleve palabras: son tres
// menos en la tarjeta, que es lo que se lee de un vistazo.
//
// Aquí sí se comparan textos CON tildes, y es a proposito:
// `textoDias` devuelve texto que ve el usuario, no codigo. El
// "sin tildes" de este archivo es para los comentarios, que se
// leen en cualquier terminal; una cadena que se muestra en
// pantalla sin tilde seria un fallo suyo, no mio. Si alguien quita
// la tilde de aqui, esta prueba lo detecta.
assert.equal(textoDias(0), 'hoy');
assert.equal(textoDias(1), 'un día');
assert.equal(textoDias(15), '15 días');
assert.equal(textoDias(31), 'un mes');
assert.equal(textoDias(90), '3 meses');
assert.equal(textoDias(366), 'un año');
assert.equal(textoDias(800), '2 años');

// ──────────────────────────────────────────────────────────
// 3. LA LINEA DE TIEMPO
// ──────────────────────────────────────────────────────────

const linea = lineaDeTiempo(
  datosDe({
    threads: [
      hilo('t1', 'u1', '2024-03-01T10:00:00.000Z', 'MiOpinion'),
      hilo('t2', 'u2', '2024-03-05T10:00:00.000Z', 'De otro'),
    ],
    comments: [comentario('c1', 'u1', '2024-02-01T10:00:00.000Z')],
    medals: { primer_hilo: '2024-01-15T10:00:00.000Z' },
    lastLevelUpAt: '2024-01-01T10:00:00.000Z',
    lastLevelUpLevel: 3,
  }),
);

// Cuatro hitos: un hilo suyo, un comentario suyo, una medalla y
// la subida de nivel. El hilo de u2 NO sale.
assert.equal(linea.length, 4, `solo los hitos de u1 (salieron ${linea.length})`);
assert.ok(
  !linea.some((e) => e.detalle === 'De otro'),
  'un hilo de otra persona no aparece en el perfil',
);

// De mas nuevo a mas viejo. Si se invirtiera, el perfil seria una
// lista desordenada y nadie lo notaria hasta que saliera dos veces
// el mismo hito en sitios raros.
for (let i = 1; i < linea.length; i++) {
  const anterior = new Date(linea[i - 1].at).getTime();
  const actual = new Date(linea[i].at).getTime();
  assert.ok(anterior >= actual, `el hito ${i} es mas nuevo que el ${i + 1}`);
}

// La medalla lleva el NOMBRE del catalogo, no el id: "Consiguio
// Primer Hilo" se lee, "Consiguio primer_hilo" es un volcado de
// base de datos.
const hitoMedalla = linea.find((e) => e.tipo === 'medal');
assert.ok(hitoMedalla, 'la medalla sale');
assert.equal(hitoMedalla!.detalle, 'Primer Hilo', 'la medalla lleva su nombre');

// Una medalla retirada del catalogo: se enseña el id entre
// parentesis en lugar de inventar un nombre. Un nombre inventado
// seria una mentira en la vitrina de una persona.
const huerfana = lineaDeTiempo(datosDe({ medals: { medalla_borrada: '2024-01-01T00:00:00.000Z' } }));
assert.equal(huerfana.length, 1, 'la medalla sin nombre sigue saliendo');
assert.equal(huerfana[0].detalle, 'medalla_borrada', 'sin nombre inventado');

// El limite recorta DESPUES de ordenar, y recorta por la cabeza:
// si se ordenara despues, el limite se llevaria los mas viejos
// y el perfil ensenaria historia vieja en lugar de la reciente.
const conLimite = lineaDeTiempo(
  datosDe({
    threads: [
      hilo('viejo', 'u1', '2020-01-01T00:00:00.000Z'),
      hilo('nuevo', 'u1', '2024-06-01T00:00:00.000Z'),
    ],
  }),
  1,
);
assert.equal(conLimite.length, 1, 'el limite recorta');
assert.equal(conLimite[0].detalle, 'Hilo nuevo', 'el limite se lleva el mas NUEVO');

// Sin limite sale todo. Es lo que necesita el componente, que
// pagina al pintar: si devolviera menos, al pulsar "ver mas" la
// lista no cambiaria.
assert.equal(
  lineaDeTiempo(datosDe({ threads: Array.from({ length: 50 }, (_, i) => hilo(`t${i}`, 'u1', '2024-01-01')) })).length,
  50,
  'sin limite sale todo',
);

// Solo el comentario EN UN HILO lleva destino. Los de la wiki se
// pintan pero no se pueden abrir: HomeFeed es el unico que sabe
// abrir una conversacion.
const conWiki = lineaDeTiempo(
  datosDe({
    comments: [
      comentario('c1', 'u1', '2024-02-01T00:00:00.000Z', 'thread'),
      comentario('c2', 'u1', '2024-02-02T00:00:00.000Z', 'anime'),
    ],
  }),
);
// Se busca POR ID y no por tipo: la linea va de mas nueva a mas
// vieja, asi que el primer comentario es el de la wiki (c2) y no
// el del hilo. Elegir el primero por tipo comprobaria justo lo
// contrario de lo que dice el nombre del caso.
assert.equal(
  conWiki.find((e) => e.id === 'comment_c1')!.irA?.threadId,
  't1',
  'el comentario de un hilo lleva al hilo',
);
assert.equal(
  conWiki.find((e) => e.id === 'comment_c1')!.irA?.commentId,
  'c1',
  'y lleva al comentario concreto dentro del hilo',
);
assert.equal(
  conWiki.find((e) => e.id === 'comment_c2')!.irA,
  null,
  'un comentario de la wiki no lleva a ningun sitio',
);

// Una medalla NO lleva a ninguna parte: no hay pagina de "esta
// medalla", y abrir el perfil de quien la gano desde su propia
// vitrina no tiene sentido.
assert.equal(linea.find((e) => e.tipo === 'medal')!.irA, null, 'una medalla no es navegable');

// La subida de nivel solo sale si se sabe A QUE nivel se subio.
// Con la fecha a secas se pinaria "Subio de nivel" sin decir cual,
// que es un dato que no sirve a nadie.
const nivelSinNumero = lineaDeTiempo(
  datosDe({ lastLevelUpAt: '2024-01-01T00:00:00.000Z', lastLevelUpLevel: null }),
);
assert.equal(nivelSinNumero.length, 0, 'sin nivel no hay hito de subida');
const nivelConNumero = lineaDeTiempo(
  datosDe({ lastLevelUpAt: '2024-01-01T00:00:00.000Z', lastLevelUpLevel: 18 }),
);
assert.equal(nivelConNumero[0].texto, 'Subio al nivel 18', 'el hito dice a que nivel');

// Una cuenta sin nada: la linea de tiempo vacia, y el componente
// ensena su texto de "aun no hay actividad". Aqui solo se
// comprueba que no invente hitos de la nada.
assert.equal(lineaDeTiempo(datosDe()).length, 0, 'una cuenta nueva no tiene hitos');

// ──────────────────────────────────────────────────────────
// 4. LA VALIDACION DEL EDITOR
// ──────────────────────────────────────────────────────────

function editable(extra: Partial<PerfilEditable> = {}): PerfilEditable {
  return {
    displayName: 'Oscar',
    bio: 'Manga, anime y cyberpunk.',
    avatarUrl: '',
    favoriteAnime: 'Kaguya-sama',
    equippedTitle: null,
    bannerUrl: '',
    profileColor: '#8b5cf6',
    avatarFrame: null,
    favoriteCharacterName: '',
    favoriteCharacterImage: '',
    favoriteCharacterDesc: '',
    favoriteCharacters: [],
    visibleBadgeIds: null,
    featuredPostIds: [],
    backgroundPreset: '',
    backgroundUrl: '',
    backgroundPosition: 'center',
    backgroundDim: 50,
    decorations: [],
    showcases: [],
    ...extra,
  };
}

assert.ok(validarEditable(editable()).ok, 'un perfil normal valida');

assert.ok(!validarEditable(editable({ displayName: '   ' })).ok, 'el nombre no puede estar vacio');
assert.ok(
  validarEditable(editable({ displayName: '' })).errores.displayName,
  'el nombre vacio tiene su propio mensaje',
);
assert.ok(
  validarEditable(editable({ displayName: 'x'.repeat(MAX_DISPLAY_NAME + 1) })).errores.displayName,
  'el nombre tiene tope',
);
assert.ok(
  validarEditable(editable({ bio: 'x'.repeat(MAX_BIO + 1) })).errores.bio,
  'la bio tiene tope',
);

// El limite es de LONGOUDES, no de palabras: una bio larga sin
// espacios tiene que fallar igual.asi, porque es lo que desborda
// la tarjeta.
assert.ok(
  validarEditable(editable({ bio: 'x'.repeat(MAX_BIO + 1) })).errores.bio,
  'una bio sin espacios tambien tiene tope',
);

// La URL del avatar tiene que ser http(s). Sin esta comprobacion,
// un "javascript:alert(...)" se guardaria y el atributo src lo
// ejecutaria en algunos navegadores. Firestore no lo comprueba.
const urlMala = validarEditable(editable({ avatarUrl: 'javascript:alert(1)' }));
assert.ok(!urlMala.ok, 'una URL que no es http(s) no vale');
assert.ok(urlMala.errores.avatarUrl, 'la URL mala tiene su mensaje');
assert.ok(
  validarEditable(editable({ avatarUrl: 'x'.repeat(MAX_AVATAR_URL + 1) })).errores.avatarUrl,
  'la URL tiene tope',
);

// Una URL vacia es legal: es la manera de quitar el avatar. Si
// fallara, no habria forma de volver al avatar por defecto.
assert.ok(validarEditable(editable({ avatarUrl: '' })).ok, 'una URL vacia es legal');

// Si HAY un error anterior, sigue estando: tocar un campo no
// borra el error de otro. Si se borrara, alguien con un nombre
// demasiado largo y una bio larga veria como el segundo aviso
// desaparece sin motivo y creeria que ya lo habia arreglado.
const conDos = validarEditable(
  editable({ displayName: '', bio: 'x'.repeat(MAX_BIO + 1) }),
);
assert.ok(conDos.errores.displayName, 'el error del nombre sigue ahi');
assert.ok(conDos.errores.bio, 'el error de la bio tambien');

// Un nombre reservado no pasa.
assert.ok(
  validarEditable(editable({ displayName: 'admin' }), { reservado: ['admin', 'root'] }).errores
    .displayName,
  'un nombre reservado no vale',
);
// Y la comparacion es sin mayusculas: "Admin" es el mismo sitio
// reservado que "admin".
assert.ok(
  validarEditable(editable({ displayName: 'AdMiN' }), { reservado: ['admin'] }).errores.displayName,
  'reservado tambien compara sin mayusculas',
);

// Un nombre en uso por otra cuenta tampoco pasa.
assert.ok(
  validarEditable(editable(), { usernameEnUso: true }).errores.displayName,
  'un nombre ya usado no vale',
);

// ──────────────────────────────────────────────────────────
// 4b. LA VALIDACION DE LA PERSONALIZACION
// ──────────────────────────────────────────────────────────
//
// Los desbloqueos por nivel NO se comprueban aqui (ver
// `validarEditable`): dependen del nivel de quien edita. Aqui
// solo los formatos, que es lo que las reglas tambien exigen.

assert.ok(validarEditable(editable()).ok, 'la personalizacion por defecto valida');

assert.ok(
  validarEditable(editable({ profileColor: COLOR_POR_DEFECTO })).ok,
  'el color por defecto vale',
);
assert.ok(
  validarEditable(editable({ profileColor: '#ffffff' })).errores.profileColor,
  'un color fuera de la paleta no vale',
);

assert.ok(
  validarEditable(editable({ bannerUrl: '' })).ok,
  'sin banner es legal (el de la casa)',
);
assert.ok(
  validarEditable(editable({ bannerUrl: 'preset:defecto' })).ok,
  'un preset valido vale',
);
assert.ok(
  validarEditable(editable({ bannerUrl: 'preset:inventado' })).errores.bannerUrl,
  'un preset inventado no vale',
);
assert.ok(
  validarEditable(editable({ bannerUrl: 'javascript:alert(1)' })).errores.bannerUrl,
  'un banner que no es https no vale',
);

assert.ok(
  validarEditable(editable({ avatarFrame: null })).ok,
  'sin marco es legal',
);
assert.ok(
  validarEditable(editable({ avatarFrame: 'dorado' })).ok,
  'un marco valido vale',
);
assert.ok(
  validarEditable(editable({ avatarFrame: 'inventado' })).errores.avatarFrame,
  'un marco inventado no vale',
);

assert.ok(
  validarEditable(editable({ favoriteCharacterName: 'Spike Spiegel' })).ok,
  'un personaje con nombre vale',
);
assert.ok(
  validarEditable(editable({ favoriteCharacterName: 'x'.repeat(MAX_NOMBRE_PERSONAJE + 1) })).errores
    .favoriteCharacterName,
  'el nombre del personaje tiene tope',
);
assert.ok(
  validarEditable(editable({ favoriteCharacterImage: 'https://x/y.jpg' })).errores
    .favoriteCharacterName,
  'imagen sin nombre no vale',
);
assert.ok(
  validarEditable(
    editable({ favoriteCharacterName: 'Spike', favoriteCharacterImage: 'ftp://x/y.jpg' }),
  ).errores.favoriteCharacterImage,
  'la imagen del personaje tiene que ser https',
);

assert.ok(
  validarEditable(editable({ visibleBadgeIds: null })).ok,
  'null son todas las insignias',
);
assert.ok(
  validarEditable(editable({ visibleBadgeIds: ['a', 'b'] })).ok,
  'una lista corta vale',
);
assert.ok(
  validarEditable(editable({ visibleBadgeIds: Array(MAX_INSIGNIAS_VISIBLES + 1).fill('x') })).errores
    .visibleBadgeIds,
  'las insignias tienen tope',
);

assert.ok(
  validarEditable(editable({ featuredPostIds: [] })).ok,
  'sin destacadas es legal',
);
assert.ok(
  validarEditable(editable({ featuredPostIds: Array(MAX_DESTACADAS + 1).fill('x') })).errores
    .featuredPostIds,
  'las destacadas tienen tope',
);

assert.ok(
  validarEditable(editable({ backgroundPreset: 'ocaso' })).ok,
  'un fondo de la galeria vale',
);
assert.ok(
  validarEditable(editable({ backgroundPreset: 'inventado' })).errores.backgroundPreset,
  'un fondo inventado no vale',
);
assert.ok(
  validarEditable(editable({ backgroundUrl: 'https://x/y.jpg' })).ok,
  'un fondo propio https vale',
);
assert.ok(
  validarEditable(editable({ backgroundUrl: 'ftp://x/y.jpg' })).errores.backgroundUrl,
  'un fondo propio que no es https no vale',
);
assert.ok(
  validarEditable(editable({ backgroundPosition: 'top' })).ok,
  'la posicion top vale',
);
assert.ok(
  validarEditable(editable({ backgroundPosition: 'izquierda' })).errores.backgroundPosition,
  'una posicion inventada no vale',
);
assert.ok(
  validarEditable(editable({ backgroundDim: 80 })).ok,
  'el oscurecido al maximo vale',
);
assert.ok(
  validarEditable(editable({ backgroundDim: 81 })).errores.backgroundDim,
  'el oscurecido por encima del tope no vale',
);

assert.ok(
  validarEditable(
    editable({ favoriteCharacters: [{ name: 'Spike', imageUrl: '', serie: 'Cowboy Bebop' }] }),
  ).ok,
  'un personaje de vitrina vale',
);
assert.ok(
  validarEditable(
    editable({ favoriteCharacters: [{ name: '', imageUrl: '', serie: '' }] }),
  ).errores.favoriteCharacters,
  'un personaje sin nombre no vale',
);
assert.ok(
  validarEditable(
    editable({
      favoriteCharacters: Array(7).fill({ name: 'x', imageUrl: '', serie: '' }),
    }),
  ).errores.favoriteCharacters,
  'los personajes tienen tope',
);
assert.ok(
  validarEditable(editable({ favoriteCharacterDesc: 'x'.repeat(141) })).errores
    .favoriteCharacterDesc,
  'la descripcion del principal tiene tope',
);

const decOk = { id: 'a', kind: 'sticker', ref: 'mando', x: 10, y: 20, size: 'm' } as const;
assert.ok(validarEditable(editable({ decorations: [decOk] })).ok, 'una decoracion vale');
assert.ok(
  validarEditable(editable({ decorations: [{ ...decOk, x: 101 }] })).errores.decorations,
  'una decoracion fuera del lienzo no vale',
);
assert.ok(
  validarEditable(editable({ decorations: [{ ...decOk, kind: 'nube' }] as never })).errores
    .decorations,
  'un tipo inventado no vale',
);
assert.ok(
  validarEditable(editable({ decorations: Array(7).fill(decOk) })).errores.decorations,
  'las decoraciones tienen tope',
);

assert.ok(
  validarEditable(editable({ showcases: ['logros', 'texto'] })).ok,
  'dos vitrinas validas valen',
);
assert.ok(
  validarEditable(editable({ showcases: ['logros', 'logros'] })).errores.showcases,
  'una vitrina repetida no vale',
);
assert.ok(
  validarEditable(editable({ showcases: ['inventada'] as never })).errores.showcases,
  'una vitrina inventada no vale',
);

// ──────────────────────────────────────────────────────────
// 5. EL USERNAME
// ──────────────────────────────────────────────────────────
//
// El perfil NO deja cambiar el username (ver `PerfilEditable`), pero
// la funcion se comprueba igual porque la usa el registro. Lo que
// importa aqui es el criterio: si un nombre pudiera llevar un
// espacio, un "@usuario con dos palabras" se cortaria por la mitad
// y la mencion no llegaria a nadie.

assert.ok(usernameEsValido('oscar'), 'un nombre normal vale');
assert.ok(usernameEsValido('oscar_2'), 'guion bajo y numero valen');
assert.ok(!usernameEsValido('os car'), 'un espacio no vale: parte las menciones');
assert.ok(!usernameEsValido('ab'), 'muy corto');
assert.ok(!usernameEsValido('x'.repeat(25)), 'muy largo');
assert.ok(!usernameEsValido('@oscar'), 'la arroba no se escribe en el campo');

// ──────────────────────────────────────────────────────────
// 6. LO QUE EL PERFIL NO TOCA
// ──────────────────────────────────────────────────────────
//
// No es una prueba de `validarEditable`, sino una del TIPO. La
// razon de existir es que `PerfilEditable` es la lista de lo que el
// usuario puede cambiar, y si alguien añadiera ahí `xp` o `role` la
// interfaz wouldnaria avisar: escribiria el campo, lo pediria al
// servidor, y las reglas lo rechazarian con un error seco. El
// daño estaria hecho antes de que nadie se entere.
//
// Estas comprobaciones fallan al COMPILAR si alguien añade un campo
// peligroso, que es justo cuando hay que enterarse.

const camposEditables = Object.keys(editable()).sort();
assert.deepEqual(
  camposEditables,
  ['avatarFrame', 'avatarUrl', 'backgroundDim', 'backgroundPosition', 'backgroundPreset', 'backgroundUrl', 'bannerUrl', 'bio', 'decorations', 'displayName', 'equippedTitle', 'favoriteAnime', 'favoriteCharacterDesc', 'favoriteCharacterImage', 'favoriteCharacterName', 'favoriteCharacters', 'featuredPostIds', 'profileColor', 'showcases', 'visibleBadgeIds'],
  'los unicos campos editables son los de personalizacion',
);

// Y cada uno tiene que existir en `User`, que es de donde se
// leen. Si uno se renombrara aqui y no en el tipo, el guardado
// escribiria un campo que nadie lee y el perfil no cambiaria.
//
// `favoriteCharacterName` e `favoriteCharacterImage` son las dos
// mitades del mapa `favoriteCharacter` de `User` (mas `desc`),
// `backgroundPreset/Url/Position/Dim` las cuatro del mapa
// `profileBackground`: el formulario las edita por separado y al
// guardar las junta.
const camposDeUser: Array<keyof User> = [
  'displayName',
  'bio',
  'avatarUrl',
  'favoriteAnime',
  'equippedTitle',
  'bannerUrl',
  'profileColor',
  'avatarFrame',
  'favoriteCharacters',
  'visibleBadgeIds',
  'featuredPostIds',
  'decorations',
  'showcases',
];
const PARTES_DE_MAPA = [
  'favoriteCharacterName',
  'favoriteCharacterImage',
  'favoriteCharacterDesc',
  'backgroundPreset',
  'backgroundUrl',
  'backgroundPosition',
  'backgroundDim',
];
for (const campo of camposEditables) {
  if ((PARTES_DE_MAPA as string[]).includes(campo)) continue;
  assert.ok(
    camposDeUser.includes(campo as keyof User),
    `${campo} existe en User`,
  );
}
assert.ok(
  (['favoriteCharacter', 'profileBackground'] as Array<keyof User>).includes('favoriteCharacter'),
  'favoriteCharacter existe en User',
);
assert.ok(
  (['profileBackground'] as Array<keyof User>).includes('profileBackground'),
  'profileBackground existe en User',
);

console.log('logica.perfil: OK');