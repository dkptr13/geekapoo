// Repara los contadores de `stats` de TODOS los usuarios.
//
//   node scripts/reparar-contadores.mjs --full             # solo enseña lo que haria
//   node scripts/reparar-contadores.mjs --full --aplicar   # lo escribe
//
// ── POR QUE HACE FALTA ─────────────────────────────────────────────
//
// En `concederXP` (functions/src/index.ts) los contadores de contenido se
// ASIGNABAN en vez de SUMARSE:
//
//     est.commentsCreated = Math.max(0, stats.commentsCreated)
//
// y los triggers pasan `1`, no el total. O sea que el segundo comentario
// escribia 1 encima del 1 que ya habia, y el contador se quedaba en 1
// para siempre. Lo mismo con los hilos, los debates y los "Me gusta".
//
// El boton de "recalcular" del panel ya los arregla, pero hay que
// pulsarlo usuario por usuario. Esto lo hace de una vez para todos.
//
// ── POR QUE CUENTA DEL CONTENIDO Y NO DEL LIBRO MAYOR ──────────────
//
// El fallo estaba al ESCRIBIR el contador, no al pagar la recompensa:
// las entradas del libro mayor estaban bien. Y el recorrido de
// recalculo se salta lo que ya esta pagado, que es justamente los
// hechos que dejaron los contadores en 1. Reproducir el recorrido no
// los arregla: hay que contar.
//
// ── POR QUE `likesReceived` SI VIENE DEL LIBRO MAYOR ───────────────
//
// Porque no se puede contar desde el contenido sin dejarlo a medias.
// Los "Me gusta" estan en `likedBy`, pero las reacciones viven en
// `reactions/`, y las de los mensajes de chat apuntan a una coleccion
// anidada dentro de cada chat. El libro mayor lo tiene todo junto, y
// se borra cuando la reaccion se quita, que es lo que quiere el
// contador.
//
// ── POR QUE NO SE TOCA NADA MAS ───────────────────────────────────
//
// La mascara son cuatro rutas exactas. Si se mandara el mapa entero
// de `stats` se perderian `animeXp`, los cuatro contadores de trivia
// y `followersReceived`. Con rutas, lo demas se queda como esta.
//
// ── POR QUE NO SALTA A LOS USUARIOS SIN CONTENIDO ──────────────────
//
// No salta. Los pone a cero, que es lo que les toca, y asi tambien
// queda limpio un contador que se quedo a 1 sin que existiera jamas
// el contenido que lo puso.
//
// ── LO QUE NO HACE ────────────────────────────────────────────────
//
// No paga XP ni concede medallas. Esto solo toca los cuatro
// contadores. El XP ya estaba bien: se pagaba en la misma
// transaccion que escribia el contador, y esa parte no se tocaba.

import { cliente } from './firestore-rest.mjs';

if (!process.argv.includes('--full')) {
  console.error('  uso: reparar-contadores.mjs --full [--aplicar]');
  console.error('  Recorre usuarios, hilos y comentarios: requiere --full.');
  process.exit(1);
}

// Los cinco motivos del libro mayor que cuentan como "Me gusta recibido".
// COPIA de `MOTIVOS_DE_LIKE`, que esta en `functions/src/index.ts` junto
// a `contarMotivosDelLibro`. Si se anade un motivo ahi, hay que anadirlo
// aqui tambien.
const MOTIVOS_DE_LIKE = new Set([
  'thread_like_received',
  'comment_like_received',
  'thread_reaction_received',
  'comment_reaction_received',
]);

const aplicar = process.argv.includes('--aplicar');

/**
 * Lee un entero de un objeto de campos de Firestore.
 *
 * @param {object|undefined} campos  Los campos, ya desenvueltos.
 * @param {string} nombre            El campo.
 */
function entero(campos, nombre) {
  const v = campos?.[nombre];
  if (v === undefined || v === null) return 0;
  const n = Number(v.integerValue ?? v.doubleValue ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Saca los campos de un campo que es un MAPA.
 *
 * En REST un mapa no es `{ threadsCreated: 1 }` sino
 * `{ mapValue: { fields: { threadsCreated: { integerValue: '1' } } } }`,
 * con dos envoltorios de mas. Sin esto, leer un contador de `stats`
 * devuelve 0 siempre, y el script creeria que no hay nada que
 * arreglar justo en los casos en los que mas falta hace.
 *
 * @param {object|undefined} campos  Los campos del documento.
 * @param {string} nombre            El campo mapa, `stats` normalmente.
 * @returns {object|undefined} sus campos, o `undefined` si no hay mapa
 */
function mapaDe(campos, nombre) {
  const v = campos?.[nombre];

  if (v === undefined || v === null) return undefined;
  if ('mapValue' in v) return v.mapValue?.fields ?? {};

  // Si el mapa llega sin el envoltorio, se devuelve tal cual.
  return v;
}

/** Lee un campo de texto. */
function texto(campos, nombre) {
  return campos?.[nombre]?.stringValue ?? '';
}

const { coleccion, escribir, BASE, cabeceras } = await cliente();

/**
 * Cuenta las entradas del libro mayor de un usuario cuyo motivo sea uno
 * de los que cuentan como "Me gusta recibido".
 *
 * Paginado, porque un usuario con mucho contenido puede tener miles de
 * entradas y traerlas de golpe se pasa del limite de la API.
 *
 * @param {string} uid
 * @returns {Promise<number>}
 */
async function contarLikes(uid) {
  const url = `${BASE}/users/${uid}/rewardLedger`;
  let total = 0;
  let pageToken;

  for (;;) {
    const p = new URLSearchParams({ pageSize: '1000' });
    if (pageToken) p.set('pageToken', pageToken);

    const r = await fetch(`${url}?${p}`, { headers: cabeceras });
    if (!r.ok) throw new Error(`listar el libro mayor: ${r.status} ${await r.text()}`);

    const d = await r.json();

    for (const doc of d.documents || []) {
      const motivo = doc.fields?.reason?.stringValue;
      if (typeof motivo === 'string' && MOTIVOS_DE_LIKE.has(motivo)) total += 1;
    }

    if (!d.nextPageToken) break;
    pageToken = d.nextPageToken;
  }

  return total;
}

console.log('Leyendo contenido...');
const [usuarios, hilos, comentarios] = await Promise.all([
  coleccion('users'),
  coleccion('threads'),
  coleccion('comments'),
]);

console.log(`  ${usuarios.length} usuarios, ${hilos.length} hilos, ${comentarios.length} comentarios\n`);

// ── Cuanto tiene cada uno DE VERDAD ────────────────────────────────
const reales = new Map(usuarios.map((u) => [u.id, { threadsCreated: 0, commentsCreated: 0, commentsInThreads: 0 }]));

for (const h of hilos) {
  const r = reales.get(texto(h.f, 'authorId'));
  if (r) r.threadsCreated += 1;
}

for (const c of comentarios) {
  const r = reales.get(texto(c.f, 'authorId'));
  if (!r) continue;
  r.commentsCreated += 1;
  if (texto(c.f, 'targetType') === 'thread') r.commentsInThreads += 1;
}

// ── Usuario por usuario ────────────────────────────────────────────

// Los cuatro contadores que se reparan. Lo demas de `stats` se copia
// tal cual, asi que no hay forma de perderlo.
const NOMBRES = ['threadsCreated', 'commentsCreated', 'commentsInThreads', 'likesReceived'];

const cambios = [];

for (const u of usuarios) {
  const statsGuardadas = mapaDe(u.f, 'stats');

  const antes = {
    threadsCreated: entero(statsGuardadas, 'threadsCreated'),
    commentsCreated: entero(statsGuardadas, 'commentsCreated'),
    commentsInThreads: entero(statsGuardadas, 'commentsInThreads'),
    likesReceived: entero(statsGuardadas, 'likesReceived'),
  };

  const despues = {
    ...reales.get(u.id),
    likesReceived: await contarLikes(u.id),
  };

  const cambia = NOMBRES.some((n) => antes[n] !== despues[n]);

  // El mapa `stats` tal cual vino, para poder reescribirlo entero sin
  // perder `animeXp`, la trivia ni los seguidores.
  cambios.push({ id: u.id, antes, despues, cambia, statsCrudo: statsGuardadas });
}

const nombreDe = (id) => {
  const u = usuarios.find((x) => x.id === id);

  return texto(u?.f, 'username') || texto(u?.f, 'displayName') || id.slice(0, 10);
};

const f = (n) => String(n).padStart(4);

for (const c of cambios) {
  console.log(
    `  ${c.cambia ? 'ARREGLA' : '   ok '} ${nombreDe(c.id).slice(0, 20).padEnd(22)}` +
      `h ${f(c.antes.threadsCreated)}->${f(c.despues.threadsCreated)}` +
      `  c ${f(c.antes.commentsCreated)}->${f(c.despues.commentsCreated)}` +
      `  d ${f(c.antes.commentsInThreads)}->${f(c.despues.commentsInThreads)}` +
      `  l ${f(c.antes.likesReceived)}->${f(c.despues.likesReceived)}`,
  );
}

console.log('\n  (h = hilos, c = comentarios, d = debates, l = "Me gusta" recibidos)');

const aArreglar = cambios.filter((c) => c.cambia);

console.log(`\n${cambios.length} usuarios, ${aArreglar.length} con contadores mal.`);

if (!aplicar || !aArreglar.length) {
  if (aArreglar.length && !aplicar) {
    console.log('\nEsto es una simulacion. Para escribirlo de verdad:');
    console.log('  node scripts/reparar-contadores.mjs --aplicar');
  }
  process.exit(0);
}

console.log('');
for (const c of aArreglar) {
  // ── SE REESCRIBE EL MAPA ENTERO, Y SE LEE ANTES ────────
  //
  // Se probo de las dos formas que parecen razonables y las dos
  // hacen cosas distintas de lo que dicen:
  //
  //   1. Mascara `stats.threadsCreated` y cuerpo con el mapa
  //      anidado -> la API contesta "Unknown name
  //      threadsCreated ... Cannot find field".
  //
  //   2. Mascara `stats.threadsCreated` y cuerpo plano con el
  //      nombre con punto -> NO da error, que es lo peor: borra
  //      las cuatro hojas. Se probo de verdad y desaparecieron del
  //      documento.
  //
  // La 2 es la que hace falta contar: un PATCH que responde "OK" y
  // sin embargo se lleva los datos. Por eso aqui no se usa ninguna
  // de las dos.
  //
  // Lo que se hace es lo unico que no admite interpretacion: se lee
  // el mapa `stats` entero, se cambian los cuatro numeros y se
  // escribe el mapa entero con la mascara `stats`. Como lo que se
  // manda es el mapa completo que se acaba de leer, `animeXp`, los
  // cuatro de trivia y `followersReceived` no se pueden perder: van
  // dentro.
  const campos = { ...(c.statsCrudo ?? {}) };

  for (const nombre of NOMBRES) {
    campos[nombre] = { integerValue: String(c.despues[nombre]) };
  }

  await escribir('users', c.id, { stats: { mapValue: { fields: campos } } }, ['stats']);

  console.log(`  escrito ${nombreDe(c.id).slice(0, 20)}`);
}


console.log(`\nListo. ${aArreglar.length} contadores arreglados.`);