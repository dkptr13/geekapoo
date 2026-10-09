/**
 * Pruebas de las reglas de seguridad de la comunidad: encuestas,
 * reacciones y GIFs en comentarios.
 *
 * Van aparte de `firestore.rules.test.cjs` (que es de la
 * gamificación) porque son otro grupo de reglas y porque cada
 * archivo monta su propio entorno del emulador.
 *
 * Se ejecuta con `npm run test:rules`, que levanta el emulador
 * de Firestore (necesita Java) y lanza esto dentro.
 *
 * Lo que se comprueba aquí son los ATAJOS, que es donde fallan
 * estas reglas:
 *
 *   - Votar dos veces (o "crear" un voto con el id de otro).
 *   - Desvotar.
 *   - Cambiar de opinión cuando el autor no lo permitió.
 *   - Votar en una encuesta cerrada o ya caducada.
 *   - Escribir los contadores de votos o de reacciones a mano.
 *   - Tener dos reacciones del mismo tipo, o reacted con el
 *     documento de otra persona.
 *   - Guardar en un comentario una URL que no sea de GIPHY ni de
 *     Tenor.
 */
const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} = require('@firebase/rules-unit-testing');
const {
  doc,
  collection,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
} = require('firebase/firestore');

const fs = require('fs');
const path = require('path');
const assert = require('assert');

/**
 * El TEXTO de las reglas, no la ruta: `initializeTestEnvironment`
 * manda lo que le pases tal cual al emulador para que lo
 * compile, así que darle 'firestore.rules' compila esas palabras.
 */
const RULES = fs.readFileSync(
  path.join(__dirname, '..', 'firestore.rules'),
  'utf8',
);
const PROJECT = 'demo-geekapoo-comunidad';

const ALICE = 'alice';
const BOB = 'bob';
const MOD = 'moderador';
/** Cuenta normal que NO está en el chat: sirve para comprobar
 *  que las reacciones y los mensajes se cierran al chat. */
const CARA = 'carla';

let testEnv;

function db(uid) {
  return testEnv.authenticatedContext(uid).firestore();
}

/** Contexto sin sesión. */
function anon() {
  return testEnv.unauthenticatedContext().firestore();
}

/** Escribe saltándose las reglas (para sembrar el escenario). */
async function sembrar(fn) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await fn(ctx.firestore());
  });
}

async function crearUsuario(uid, extra = {}) {
  await sembrar(async (f) => {
    await setDoc(doc(f, 'users', uid), {
      uid,
      email: `${uid}@test.com`,
      username: uid,
      displayName: uid,
      chatId: `GK-${uid}`,
      avatarUrl: '',
      role: 'user',
      createdAt: '2026-01-01T00:00:00.000Z',
      isBanned: false,
      ...extra,
    });
  });
}

const POLO = {
  question: '¿Quién gana este combate?',
  options: { o1: 'Goku', o2: 'Saitama', o3: 'Naruto', o4: 'Ichigo' },
  isClosed: false,
  allowChangeVote: false,
};

/** Un hilo normal, con los campos que exige la regla de creación. */
function nuevoHilo(extra = {}) {
  return {
    authorId: ALICE,
    authorName: 'alice',
    authorAvatar: '',
    title: 'Debate',
    body: 'Goku vs Saitama',
    categoryId: 'debates',
    categoryName: 'Debates',
    tags: ['General', 'Debate'],
    likesCount: 0,
    likedBy: [],
    commentsCount: 0,
    pinned: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  };
}

function nuevoComentario(extra = {}) {
  return {
    authorId: ALICE,
    authorName: 'alice',
    authorAvatar: '',
    targetType: 'thread',
    targetId: 'hilo1',
    parentId: null,
    body: 'Yo voto a Goku',
    likesCount: 0,
    likedBy: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  };
}

const GIF_VALIDO = {
  provider: 'giphy',
  id: 'abc123',
  url: 'https://media3.giphy.com/media/abc123/giphy.gif',
  previewUrl: 'https://media3.giphy.com/media/abc123/100w.gif',
  width: 480,
  height: 270,
};

describe('comunidad: encuestas, reacciones y GIFs', () => {
  before(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT,
      firestore: { rules: RULES },
    });

    await crearUsuario(ALICE);
    await crearUsuario(BOB);
    await crearUsuario(CARA);
    await crearUsuario(MOD, { role: 'moderator' });

    // Hilo de Alice con encuesta, y otro sin encuesta.
    await sembrar(async (f) => {
      await setDoc(doc(f, 'threads', 'hilo1'), nuevoHilo({ poll: POLO }));
      await setDoc(doc(f, 'threads', 'hilo2'), nuevoHilo());
      await setDoc(doc(f, 'threads', 'hiloCerrada'), nuevoHilo({
        poll: { ...POLO, isClosed: true },
      }));
      await setDoc(doc(f, 'comments', 'com1'), nuevoComentario());
    });

    // Votos ya puestos, para probar el cambio de opinión.
    await sembrar(async (f) => {
      await setDoc(doc(f, 'threads', 'hilo1', 'pollVotes', BOB), {
        userId: BOB,
        optionId: 'o1',
        createdAt: '2026-01-01T00:00:00.000Z',
      });
      await setDoc(doc(f, 'threads', 'hiloLibre', 'pollVotes', BOB), {
        userId: BOB,
        optionId: 'o1',
      });
      await setDoc(doc(f, 'threads', 'hiloLibre'), nuevoHilo({
        poll: { ...POLO, allowChangeVote: true },
      }));
    });

    // Un chat con dos miembros (Alice y Bob) y un mensaje de
    // Alice. CARA existe como cuenta pero no está dentro, que es
    // justo lo que se necesita para probar que el chat se cierra.
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'chat1'), {
        type: 'direct',
        name: 'Alice y Bob',
        ownerId: ALICE,
        memberIds: [ALICE, BOB],
        hiddenFor: [],
        createdAt: '2026-01-01T00:00:00.000Z',
      });
      await setDoc(doc(f, 'chats', 'chat1', 'messages', 'msg1'), {
        chatId: 'chat1',
        senderId: ALICE,
        senderName: 'alice',
        senderAvatar: '',
        body: 'hola',
        type: 'text',
        createdAt: '2026-01-01T00:00:00.000Z',
      });
    });
  });

  after(async () => {
    await testEnv.cleanup();
  });

  // ==========================================================
  // 1. CREAR EL HILO CON ENCUESTA
  // ==========================================================
  describe('crear un hilo con encuesta', () => {
    it('permite una encuesta bien formada', async () => {
      await assertSucceeds(setDoc(doc(db(BOB), 'threads', 'nuevo'), nuevoHilo({
        authorId: BOB,
        authorName: 'bob',
        poll: POLO,
      })));
    });

    it('permite un hilo sin encuesta', async () => {
      await assertSucceeds(setDoc(doc(db(BOB), 'threads', 'sine'), nuevoHilo({
        authorId: BOB,
        authorName: 'bob',
      })));
    });

    it('NO permite una encuesta con una sola opción', async () => {
      await assertFails(setDoc(doc(db(BOB), 'threads', 'una'), nuevoHilo({
        authorId: BOB,
        authorName: 'bob',
        poll: { ...POLO, options: { o1: 'Goku' } },
      })));
    });

    it('NO permite una encuesta con siete opciones', async () => {
      const options = {};
      for (let i = 1; i <= 7; i += 1) options[`o${i}`] = `Opción ${i}`;
      await assertFails(setDoc(doc(db(BOB), 'threads', 'siete'), nuevoHilo({
        authorId: BOB,
        authorName: 'bob',
        poll: { ...POLO, options },
      })));
    });

    it('NO permite crear la encuesta ya cerrada', async () => {
      await assertFails(setDoc(doc(db(BOB), 'threads', 'cerrada'), nuevoHilo({
        authorId: BOB,
        authorName: 'bob',
        poll: { ...POLO, isClosed: true },
      })));
    });

    it('NO permite inventarse los contadores de reacciones', async () => {
      await assertFails(setDoc(doc(db(BOB), 'threads', 'falso'), nuevoHilo({
        authorId: BOB,
        authorName: 'bob',
        reactionCounts: { fire: 900 },
        reactionsTotal: 900,
      })));
    });

    it('NO deja a un usuario normal tocar el campo poll', async () => {
      // Bob no es el autor del hilo, así que aunque el cambio
      // fuese solo de `isClosed`, no le toca.
      await assertFails(updateDoc(doc(db(BOB), 'threads', 'hilo1'), {
        'poll.isClosed': true,
      }));
    });
  });

  // ==========================================================
  // 2. VOTAR
  // ==========================================================
  describe('votar en una encuesta', () => {
    it('deja votar con una opción que existe', async () => {
      await assertSucceeds(setDoc(doc(db(ALICE), 'threads', 'hilo1', 'pollVotes', ALICE), {
        userId: ALICE,
        optionId: 'o2',
        createdAt: '2026-01-01T00:00:00.000Z',
      }));
    });

    it('NO deja votar con una opción inventada', async () => {
      await assertFails(setDoc(doc(db(ALICE), 'threads', 'hilo1', 'pollVotes', ALICE), {
        userId: ALICE,
        optionId: 'o99',
        createdAt: '2026-01-01T00:00:00.000Z',
      }));
    });

    it('NO deja votar dos veces (el segundo create choca)', async () => {
      // Ya tiene un voto de la prueba anterior: escribir encima
      // vuelve a fallar porque el documento existe.
      await assertFails(setDoc(doc(db(ALICE), 'threads', 'hilo1', 'pollVotes', ALICE), {
        userId: ALICE,
        optionId: 'o3',
        createdAt: '2026-01-01T00:00:00.000Z',
      }));

      const snap = await getDoc(doc(db(ALICE), 'threads', 'hilo1', 'pollVotes', ALICE));
      assert(snap.data().optionId === 'o2', 'el voto original sigue intacto');
    });

    it('NO deja votar en nombre de otra persona', async () => {
      await assertFails(setDoc(doc(db(ALICE), 'threads', 'hilo1', 'pollVotes', BOB), {
        userId: BOB,
        optionId: 'o1',
        createdAt: '2026-01-01T00:00:00.000Z',
      }));
    });

    it('NO deja anonymously votar', async () => {
      await assertFails(setDoc(doc(anon(), 'threads', 'hilo1', 'pollVotes', 'anon'), {
        userId: 'anon',
        optionId: 'o1',
      }));
    });

    it('NO deja votar en una encuesta cerrada', async () => {
      await assertFails(setDoc(doc(db(BOB), 'threads', 'hiloCerrada', 'pollVotes', BOB), {
        userId: BOB,
        optionId: 'o1',
      }));
    });

    it('NO deja votar en un hilo sin encuesta', async () => {
      await assertFails(setDoc(doc(db(ALICE), 'threads', 'hilo2', 'pollVotes', ALICE), {
        userId: ALICE,
        optionId: 'o1',
      }));
    });

    it('NO deja que nadie escriba el total de votos en el hilo', async () => {
      await assertFails(updateDoc(doc(db(ALICE), 'threads', 'hilo1'), {
        'poll.totalVotes': 9999,
      }));
    });

    it('los votos se pueden leer sin entrar (los resultados son públicos)', async () => {
      await assertSucceeds(getDocs(collection(anon(), 'threads', 'hilo1', 'pollVotes')));
    });
  });

  // ==========================================================
  // 3. CAMBIAR DE OPINIÓN Y DESVOTAR
  // ==========================================================
  describe('cambiar de opinión y desvotar', () => {
    it('NO deja cambiar de opción si el autor no lo permitió', async () => {
      // Bob votó a o1 en hilo1, donde allowChangeVote es false.
      await assertFails(updateDoc(doc(db(BOB), 'threads', 'hilo1', 'pollVotes', BOB), {
        optionId: 'o2',
      }));
    });

    it('deja cambiar de opción si el autor lo permitió', async () => {
      await assertSucceeds(setDoc(doc(db(BOB), 'threads', 'hiloLibre', 'pollVotes', BOB), {
        userId: BOB,
        optionId: 'o1',
      }));
      await assertSucceeds(updateDoc(doc(db(BOB), 'threads', 'hiloLibre', 'pollVotes', BOB), {
        optionId: 'o3',
        updatedAt: '2026-02-01T00:00:00.000Z',
      }));
    });

    it('NO deja cambiar de opinión con una opción que no existe', async () => {
      await assertFails(updateDoc(doc(db(BOB), 'threads', 'hiloLibre', 'pollVotes', BOB), {
        optionId: 'o99',
      }));
    });

    it('NO deja tocar el userId de un voto ajeno', async () => {
      await assertFails(updateDoc(doc(db(BOB), 'threads', 'hiloLibre', 'pollVotes', BOB), {
        userId: ALICE,
      }));
    });

    it('NO deja que nadie se desvote (no hay forma de liberar el voto)', async () => {
      await assertFails(deleteDoc(doc(db(BOB), 'threads', 'hiloLibre', 'pollVotes', BOB)));
    });

    it('el equipo sí puede borrar un voto problemático', async () => {
      await assertFails(deleteDoc(doc(db(ALICE), 'threads', 'hiloLibre', 'pollVotes', BOB)));
      await assertSucceeds(deleteDoc(doc(db(MOD), 'threads', 'hiloLibre', 'pollVotes', BOB)));
    });
  });

  // ==========================================================
  // 4. CERRAR LA ENCUESTA
  // ==========================================================
  describe('cerrar la encuesta', () => {
    it('el autor del hilo puede cerrarla', async () => {
      await assertSucceeds(updateDoc(doc(db(ALICE), 'threads', 'hilo1'), {
        'poll.isClosed': true,
      }));
      await assertSucceeds(updateDoc(doc(db(ALICE), 'threads', 'hilo1'), {
        'poll.isClosed': false,
      }));
    });

    it('el autor NO puede reescribir las opciones', async () => {
      await assertFails(updateDoc(doc(db(ALICE), 'threads', 'hilo1'), {
        poll: { ...POLO, options: { o1: 'Goku', o2: 'Saitama', o3: 'Naruto', o4: 'Yugi' } },
      }));
    });

    it('un moderador puede cerrarla en un hilo de otro', async () => {
      await assertSucceeds(updateDoc(doc(db(MOD), 'threads', 'hilo1'), {
        'poll.isClosed': true,
      }));
      await sembrar(async (f) => {
        await updateDoc(doc(f, 'threads', 'hilo1'), { 'poll.isClosed': false });
      });
    });
  });

  // ==========================================================
  // 5. EL RESUMEN QUE CALCULA EL SERVIDOR
  // ==========================================================
  describe('pollStats', () => {
    it('es público de lectura', async () => {
      await assertSucceeds(getDoc(doc(anon(), 'pollStats', 'hilo1')));
    });

    it('NO lo puede escribir ni el autor del hilo', async () => {
      await assertFails(setDoc(doc(db(ALICE), 'pollStats', 'hilo1'), {
        options: { o1: 9999 },
        totalVotes: 9999,
      }));
    });

    it('NO lo puede escribir ni el equipo', async () => {
      await assertFails(updateDoc(doc(db(MOD), 'pollStats', 'hilo1'), { totalVotes: 9999 }));
    });
  });

  // ==========================================================
  // 7. LO QUE VE LA BARRA DE REACCIONES (lectura)
  // ==========================================================
  //
  // Esto no va de permisos sino de que la LECTURA funcione, que
  // es por donde fallaba: la barra se quedaba vacía y solo se
  // veía la reacción propia.
  //
  // Y va de UNA COSA CONCRETA: la consulta pide el `targetId`
  // CRUDO del documento ("hilo1"), no la clave con el tipo
  // dentro ("thread_hilo1"). Con la clave, la consulta devuelve
  // cero documentos sin dar ningún error, y lo único que se ve es
  // la reacción propia. Estos tests preguntan por los ids
  // crudos, que es como lo hace el hook, y comprueban que la
  // lectura llega y se agrupa bien.
  describe('lectura de reacciones (lo que ve la barra)', () => {
    const consultaDeLaBarra = (targetIds) =>
      query(
        collection(anon(), 'reactions'),
        where('targetId', 'in', targetIds),
        limit(700),
      );

    /** Cuenta lo que devolvería el hook, con la misma lógica de agrupación. */
    const contarComoElHook = (snap) => {
      const contadores = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        const key = `${data.targetType}_${data.targetId}`;
        contadores[key] = contadores[key] || {};
        contadores[key][data.type] = (contadores[key][data.type] || 0) + 1;
      });
      return contadores;
    };

    before(async () => {
      // Tres personas reaccionan al mismo hilo, y una a un
      // comentario. Se siembla sin reglas porque lo que se prueba
      // aquí es la LECTURA.
      await sembrar(async (f) => {
        const Ahora = '2026-01-01T00:00:00.000Z';

        await setDoc(doc(f, 'reactions', `reac_thread_hilo1_${ALICE}`), {
          targetType: 'thread', targetId: 'hilo1', userId: ALICE,
          type: 'fire', userName: 'alice', createdAt: Ahora,
        });
        await setDoc(doc(f, 'reactions', `reac_thread_hilo1_${BOB}`), {
          targetType: 'thread', targetId: 'hilo1', userId: BOB,
          type: 'fire', userName: 'bob', createdAt: Ahora,
        });
        await setDoc(doc(f, 'reactions', `reac_thread_hilo1_${MOD}`), {
          targetType: 'thread', targetId: 'hilo1', userId: MOD,
          type: 'laugh', userName: 'moderador', createdAt: Ahora,
        });
        await setDoc(doc(f, 'reactions', `reac_comment_com1_${BOB}`), {
          targetType: 'comment', targetId: 'com1', userId: BOB,
          type: 'cry', userName: 'bob', createdAt: Ahora,
        });
        // Una reacción de un hilo que NO está en pantalla: la
        // consulta no debe filtrarla, porque la clave de su
        // objetivo no está en la firma.
        await setDoc(doc(f, 'reactions', `reac_thread_hilo2_${CARA}`), {
          targetType: 'thread', targetId: 'hilo2', userId: CARA,
          type: 'fire', userName: 'carla', createdAt: Ahora,
        });
      });
    });

    it('sin iniciar sesión se ven las reacciones de los demás', async () => {
      // Lo más importante: los contadores son públicos. Si esto
      // fallara, un visitante anónimo vería la barra vacía.
      const snap = await getDocs(consultaDeLaBarra(['hilo1', 'com1']));
      assert(snap.size >= 4, `llegan 4 reacciones, llegaron ${snap.size}`);
    });

    it('la barra cuenta las reacciones de los tres usuarios a la vez', async () => {
      const snap = await getDocs(consultaDeLaBarra(['hilo1']));
      const contadores = contarComoElHook(snap);

      assert.equal(contadores.thread_hilo1.fire, 2, 'Alice y Bob han puesto 🔥');
      assert.equal(contadores.thread_hilo1.laugh, 1, 'El moderador ha puesto 😂');
    });

    it('cada usuario ve lo mismo que los demás', async () => {
      const snapAnonimo = await getDocs(consultaDeLaBarra(['hilo1']));
      const snapCarla = await getDocs(
        query(
          collection(db(CARA), 'reactions'),
          where('targetId', 'in', ['hilo1']),
          limit(700),
        ),
      );

      assert.equal(
        contarComoElHook(snapCarla).thread_hilo1.fire,
        contarComoElHook(snapAnonimo).thread_hilo1.fire,
        'Carla ve las mismas reacciones que un visitante sin sesión',
      );
    });

    it('también se leen las de comentarios', async () => {
      const snap = await getDocs(consultaDeLaBarra(['com1']));
      const contadores = contarComoElHook(snap);
      assert.equal(contadores.comment_com1.cry, 1, 'una reacción en un comentario');
    });

    it('funciona con más de 25 objetivos (troceado del hook)', async () => {
      // El hook mete 25 ids por consulta porque `in` no admite más
      // de 30. Con muchos hilos a la vez, un solo trozo no basta.
      const muchos = Array.from({ length: 60 }, (_, i) => `hilo${i}`);
      for (const trozo of [muchos.slice(0, 25), muchos.slice(25, 50), muchos.slice(50)]) {
        await assertSucceeds(getDocs(
          query(collection(anon(), 'reactions'), where('targetId', 'in', trozo), limit(700)),
        ));
      }
    });
  });

  // ==========================================================
  // 6. REACCIONES
  // ==========================================================
  describe('reacciones', () => {
    const reaction = (uid, extra = {}) => ({
      targetType: 'thread',
      targetId: 'hilo1',
      userId: uid,
      type: 'fire',
      createdAt: '2026-01-01T00:00:00.000Z',
      ...extra,
    });

    it('permite reaccionar con el id que compone el servicio', async () => {
      await assertSucceeds(setDoc(doc(db(ALICE), 'reactions', `reac_thread_hilo1_${ALICE}`), reaction(ALICE)));
    });

    it('permite cambiar de reacción (es el mismo documento)', async () => {
      await assertSucceeds(updateDoc(doc(db(ALICE), 'reactions', `reac_thread_hilo1_${ALICE}`), {
        type: 'laugh',
      }));

      const snap = await getDoc(doc(db(ALICE), 'reactions', `reac_thread_hilo1_${ALICE}`));
      assert(snap.data().type === 'laugh');
      assert(snap.data().targetId === 'hilo1', 'no se puede mover de contenido');
    });

    it('NO deja inventarse un id para duplicar la reacción', async () => {
      // Mismo objetivo y mismo usuario, pero con un id propio: la
      // cuenta se contaría dos veces.
      await assertFails(setDoc(doc(db(ALICE), 'reactions', 'mi_reaccion_favorita'), reaction(ALICE)));
    });

    it('NO deja poner la reacción en nombre de otra persona', async () => {
      await assertFails(setDoc(doc(db(ALICE), 'reactions', `reac_thread_hilo2_${BOB}`), {
        ...reaction(BOB),
      }));
    });

    it('NO deja reaccionar a algo que no existe', async () => {
      await assertFails(setDoc(doc(db(ALICE), 'reactions', `reac_thread_fantasma_${ALICE}`), {
        ...reaction(ALICE, { targetId: 'fantasma' }),
      }));
    });

    it('NO deja inventar un tipo de reacción', async () => {
      // Antes la regla tenía una lista de cinco tipos y esto
      // fallaba por no estar en ella. Ahora lo que se comprueba
      // es el FORMATO de la clave, así que "Payaso" (mayúscula),
      // un emoji suelto o un espacio tienen que rechazarse.
      //
      // OJO: una palabra en minúsculas como "payaso" SÍ pasa la
      // regla, porque tiene el formato correcto. Lo que pasa
      // después es que el cliente no la sabe pintar (no está en
      // el catálogo) y la descarta al contar. Las reglas no
      // pueden saber qué emojis hay: el catálogo está en el
      // bundle del navegador.
      await assertFails(setDoc(doc(db(ALICE), 'reactions', `reac_thread_hilo2_${ALICE}`), {
        ...reaction(ALICE, { targetId: 'hilo2', type: 'Payaso' }),
      }));
      await assertFails(setDoc(doc(db(ALICE), 'reactions', `reac_thread_hilo2_${ALICE}`), {
        ...reaction(ALICE, { targetId: 'hilo2', type: '🔥' }),
      }));
      await assertFails(setDoc(doc(db(ALICE), 'reactions', `reac_thread_hilo2_${ALICE}`), {
        ...reaction(ALICE, { targetId: 'hilo2', type: 'con espacio' }),
      }));
      await assertFails(setDoc(doc(db(ALICE), 'reactions', `reac_thread_hilo2_${ALICE}`), {
        ...reaction(ALICE, { targetId: 'hilo2', type: 42 }),
      }));
    });

    it('permite cualquier clave del catálogo, no solo las cinco primeras', async () => {
      // El catálogo tiene más de doscientos emojis; la regla
      // comprueba el formato, no una lista cerrada.
      await assertSucceeds(setDoc(doc(db(ALICE), 'reactions', `reac_thread_hilo2_${ALICE}`), {
        ...reaction(ALICE, { targetId: 'hilo2', type: 'thumbs_up' }),
      }));
      await assertSucceeds(updateDoc(doc(db(ALICE), 'reactions', `reac_thread_hilo2_${ALICE}`), {
        type: 'skull',
      }));

      const snap = await getDoc(doc(db(ALICE), 'reactions', `reac_thread_hilo2_${ALICE}`));
      assert(snap.data().type === 'skull');
    });

    it('NO deja reaccionar sin entrar', async () => {
      await assertFails(setDoc(doc(anon(), 'reactions', 'reac_thread_hilo2_anon'), {
        ...reaction('anon', { targetId: 'hilo2' }),
      }));
    });

    it('NO deja tocar el contenido ni el userId al cambiar de reacción', async () => {
      await assertFails(updateDoc(doc(db(ALICE), 'reactions', `reac_thread_hilo1_${ALICE}`), {
        targetId: 'hilo2',
      }));
      await assertFails(updateDoc(doc(db(ALICE), 'reactions', `reac_thread_hilo1_${ALICE}`), {
        userId: BOB,
      }));
    });

    it('NO deja tocar la reacción de otro', async () => {
      await assertSucceeds(setDoc(doc(db(BOB), 'reactions', `reac_thread_hilo1_${BOB}`), reaction(BOB)));
      await assertFails(updateDoc(doc(db(ALICE), 'reactions', `reac_thread_hilo1_${BOB}`), {
        type: 'trophy',
      }));
      await assertFails(deleteDoc(doc(db(ALICE), 'reactions', `reac_thread_hilo1_${BOB}`)));
    });

    it('cada quien quita la suya', async () => {
      await assertSucceeds(deleteDoc(doc(db(BOB), 'reactions', `reac_thread_hilo1_${BOB}`)));
    });

    it('reaccionar a un comentario también vale', async () => {
      await assertSucceeds(setDoc(doc(db(ALICE), 'reactions', `reac_comment_com1_${ALICE}`), {
        ...reaction(ALICE, { targetType: 'comment', targetId: 'com1', type: 'cry' }),
      }));
    });

    it('los contadores de reacciones del hilo los lleva el servidor', async () => {
      await assertFails(updateDoc(doc(db(ALICE), 'threads', 'hilo1'), {
        reactionCounts: { fire: 900 },
        reactionsTotal: 900,
      }));
      await assertFails(updateDoc(doc(db(ALICE), 'threads', 'hilo1'), {
        likesCount: 9999,
        reactionCounts: { fire: 900 },
      }));
    });

    it('los contadores de reacciones del comentario también', async () => {
      await assertFails(updateDoc(doc(db(ALICE), 'comments', 'com1'), {
        reactionCounts: { fire: 900 },
      }));
      await assertFails(updateDoc(doc(db(ALICE), 'comments', 'com1'), {
        'reactionCounts.fire': 900,
      }));
    });

    it('los "me gusta" siguen funcionando igual que antes', async () => {
      await assertSucceeds(updateDoc(doc(db(BOB), 'threads', 'hilo2'), {
        likedBy: [BOB],
        likesCount: 1,
      }));
      await assertSucceeds(updateDoc(doc(db(BOB), 'comments', 'com1'), {
        likedBy: [BOB],
        likesCount: 1,
      }));
    });
  });

  // ==========================================================
  // 7. REACCIONES Y GIFs EN LOS CHATS
  // ==========================================================
  //
  // Los mensajes de chat tienen su propio 철장 de seguridad: solo
  // los miembros del chat pueden leerlos, escribir mensajes y
  // reaccionar. Lo que se comprueba aquí es que la reacción a un
  // mensaje NO se pueda hacer desde fuera de la conversación, que
  // es el agujero que abriría una colección plana como
  // `reactions/`.
  describe('reacciones y GIFs en los chats', () => {
    const mensaje = (extra = {}) => ({
      chatId: 'chat1',
      senderId: ALICE,
      senderName: 'alice',
      senderAvatar: '',
      body: 'hola',
      type: 'text',
      createdAt: '2026-01-01T00:00:00.000Z',
      ...extra,
    });

    const reaccion = (uid, extra = {}) => ({
      targetType: 'chat_message',
      targetId: 'msg1',
      chatId: 'chat1',
      userId: uid,
      type: 'fire',
      createdAt: '2026-01-01T00:00:00.000Z',
      ...extra,
    });

    const nuevoMensaje = (campos) =>
      // `collection` y no `doc`: un mensaje nuevo recibe el id que
      // genera Firestore, así que la ruta tiene que ser impar.
      setDoc(doc(collection(db(ALICE), 'chats', 'chat1', 'messages')), mensaje(campos));

    it('un miembro puede reaccionar a un mensaje', async () => {
      await assertSucceeds(setDoc(
        doc(db(BOB), 'reactions', `reac_chat_message_msg1_${BOB}`),
        reaccion(BOB),
      ));
    });

    // ── UBICACIONES ─────────────────────────────────────
    //
    // Las coordenadas las escribe el cliente, así que si la regla no
    // comprueba los rangos, cualquiera podría mandar cualquier número y
    // se dibujaría en un sitio imposible. Estos casos cubren lo que la
    // regla tiene que dejar pasar y lo que tiene que rechazar.
    it('se puede mandar un mensaje con una ubicación válida', async () => {
      await assertSucceeds(nuevoMensaje({
        body: '',
        type: 'location',
        location: { lat: 40.41678, lng: -3.70379, accuracy: 25, place: 'Puerta del Sol' },
      }));
    });

    it('una ubicación con la latitud fuera de rango se rechaza', async () => {
      await assertFails(nuevoMensaje({
        body: '',
        type: 'location',
        location: { lat: 1200, lng: 0 },
      }));
    });

    it('una ubicación con la longitud fuera de rango se rechaza', async () => {
      await assertFails(nuevoMensaje({
        body: '',
        type: 'location',
        location: { lat: 0, lng: 999 },
      }));
    });

    it('una ubicación con las coordenadas como texto se rechaza', async () => {
      // Si no se comprobara que sean números, "no sé" llegaría al mapa
      // y lo rompería al pintar.
      await assertFails(nuevoMensaje({
        body: '',
        type: 'location',
        location: { lat: 'no sé', lng: 'tampoco' },
      }));
    });

    it('un nombre de sitio enorme se rechaza', async () => {
      await assertFails(nuevoMensaje({
        body: '',
        type: 'location',
        location: { lat: 40, lng: -3, place: 'x'.repeat(500) },
      }));
    });

    // ── FOTOS EN LOS MENSAJES ───────────────────────────
    it('se puede mandar un mensaje con una foto', async () => {
      await assertSucceeds(nuevoMensaje({
        body: '',
        type: 'image',
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/x/o/chats%2Fchat1.jpg',
      }));
    });

    it('se puede mandar texto y una foto a la vez', async () => {
      // El texto no se pierde por adjuntar la foto: es lo que pasa
      // cuando alguien escribe "mira esto" y manda la foto.
      await assertSucceeds(nuevoMensaje({
        body: 'mira esto',
        type: 'image',
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/x/o/chats%2Fchat1.jpg',
      }));
    });

    it('un mensaje vacío sin ningún adjunto se sigue rechazando', async () => {
      // Lo de antes: un mensaje puede no tener texto si lleva algo, pero
      // no puede no tener nada.
      await assertFails(nuevoMensaje({ body: '', type: 'text' }));
    });

    // ── FOTO DEL GRUPO ──────────────────────────────────
    it('el dueño del grupo puede cambiar su foto', async () => {
      await assertSucceeds(updateDoc(doc(db(ALICE), 'chats', 'chat1'), {
        avatar: 'https://firebasestorage.googleapis.com/v0/b/x/o/grupo.jpg',
      }));
    });

    it('un miembro que NO es dueño NO puede cambiar la foto del grupo', async () => {
      // BOB está en memberIds pero no es el dueño. Si esto pasara,
      // cualquier miembro podría cambiar la identidad visual del grupo.
      await assertFails(updateDoc(doc(db(BOB), 'chats', 'chat1'), {
        avatar: 'https://firebasestorage.googleapis.com/v0/b/x/o/intruso.jpg',
      }));
    });

    it('quien no es del grupo no puede cambiar su foto', async () => {
      await assertFails(updateDoc(doc(db('carla'), 'chats', 'chat1'), {
        avatar: 'https://firebasestorage.googleapis.com/v0/b/x/o/ajena.jpg',
      }));
    });

    it('quien NO es del chat no puede reaccionar a su mensaje', async () => {
      // CARA es una cuenta normal pero no está en memberIds.
      await assertFails(setDoc(
        doc(db('carla'), 'reactions', `reac_chat_message_msg1_carla`),
        reaccion('carla'),
      ));
    });

    it('tampoco se puede reaccionar sin decir a qué chat es', async () => {
      // Sin chatId no hay forma de comprobar la pertenencia. El
      // campo se QUITA del documento (no vale ponerlo a
      // undefined: el SDK lo rechaza antes de llegar a las reglas).
      const { chatId: _omitido, ...sinChat } = reaccion('carla');
      await assertFails(setDoc(
        doc(db('carla'), 'reactions', `reac_chat_message_msg1_carla`),
        sinChat,
      ));
    });

    it('tampoco a un mensaje que no existe', async () => {
      await assertFails(setDoc(
        doc(db(BOB), 'reactions', `reac_chat_message_fantasma_${BOB}`),
        reaccion(BOB, { targetId: 'fantasma' }),
      ));
    });

    it('los miembros siguen sin poder tocar los mensajes de otro', async () => {
      await assertFails(updateDoc(doc(db(BOB), 'chats', 'chat1', 'messages', 'msg1'), {
        body: 'texto cambiado por otro',
      }));
    });

    it('un miembro puede mandar un mensaje con GIF', async () => {
      await assertSucceeds(nuevoMensaje({
        senderId: ALICE,
        body: '',
        type: 'gif',
        gif: GIF_VALIDO,
      }));
    });

    it('NO acepta un GIF con una URL que no es del proveedor', async () => {
      await assertFails(nuevoMensaje({
        senderId: ALICE,
        body: 'mira',
        gif: {
          provider: 'giphy',
          id: 'x',
          url: 'https://mi-sitio-falso.example/trackeame.gif',
          previewUrl: 'https://mi-sitio-falso.example/trackeame.gif',
        },
      }));
    });

    it('NO acepta un mensaje sin texto ni GIF', async () => {
      await assertFails(nuevoMensaje({ senderId: ALICE, body: '' }));
    });

    it('quien no es del chat no puede mandar mensajes', async () => {
      await assertFails(setDoc(
        doc(collection(db(CARA), 'chats', 'chat1', 'messages')),
        mensaje({ senderId: CARA, senderName: 'carla' }),
      ));
    });

    it('ni leerlos', async () => {
      await assertFails(getDoc(doc(db('carla'), 'chats', 'chat1', 'messages', 'msg1')));
    });
  });

  // ==========================================================
  // 7. GIFs EN LOS COMENTARIOS
  // ==========================================================
  describe('GIFs en comentarios', () => {
    it('acepta un GIF de GIPHY', async () => {
      await assertSucceeds(setDoc(doc(db(BOB), 'comments', 'conGif'), nuevoComentario({
        authorId: BOB,
        authorName: 'bob',
        body: '',
        gif: GIF_VALIDO,
      })));
    });

    it('acepta un GIF de Tenor', async () => {
      await assertSucceeds(setDoc(doc(db(BOB), 'comments', 'conTenor'), nuevoComentario({
        authorId: BOB,
        authorName: 'bob',
        body: 'jajaja',
        gif: {
          provider: 'tenor',
          id: 'def456',
          url: 'https://media.tenor.com/def456/aaa/tenor.gif',
          previewUrl: 'https://media.tenor.com/def456/aaa/nanogif.gif',
        },
      })));
    });

    it('NO acepta una URL que no sea del CDN del proveedor', async () => {
      await assertFails(setDoc(doc(db(BOB), 'comments', 'falso'), nuevoComentario({
        authorId: BOB,
        authorName: 'bob',
        body: 'mira esto',
        gif: {
          provider: 'giphy',
          id: 'x',
          url: 'https://mi-sitio-falso.example/trackeame.gif',
          previewUrl: 'https://mi-sitio-falso.example/trackeame.gif',
        },
      })));
    });

    it('NO acepta un proveedor inventado', async () => {
      await assertFails(setDoc(doc(db(BOB), 'comments', 'falso2'), nuevoComentario({
        authorId: BOB,
        authorName: 'bob',
        body: 'mira',
        gif: { ...GIF_VALIDO, provider: 'miweb' },
      })));
    });

    it('NO acepta un comentario vacío', async () => {
      await assertFails(setDoc(doc(db(BOB), 'comments', 'vacio'), nuevoComentario({
        authorId: BOB,
        authorName: 'bob',
        body: '',
      })));
    });
  });

  // ==========================================================
  // 8. FAVORITOS (EMOJIS Y GIFs)
  // ==========================================================
  //
  // Los favoritos cuelgan del documento del usuario, así que lo
  // que se comprueba es que cada persona SOLO pueda tocar los
  // suyos. Aquí es donde un descuido sería más grave: si alguien
  // pudiera escribir en los favoritos de otro, podría meter en
  // la lista de otra persona un GIF con una URL rara, y esa URL
  // es justo el tipo de campo que las reglas revisan en todas
  // partes. Por eso el `gifValido` se repite aquí también.
  describe('favoritos', () => {
    // OJO: `quienEscribe` y `deQuien` van aparte a propósito.
    // Si fueran el mismo, "intentar guardar en los favoritos de
    // otro" acabaría escribiendo en los propios y la regla lo
    // permitiría (bien), así que el test no probaría nada.
    const emoji = (uid, key) =>
      setDoc(doc(db(uid), 'users', uid, 'favoriteEmojis', key), {
        emojiKey: key,
        createdAt: '2026-01-01T00:00:00.000Z',
      });

    const emojiEn = (quienEscribe, deQuien, key) =>
      setDoc(doc(db(quienEscribe), 'users', deQuien, 'favoriteEmojis', key), {
        emojiKey: key,
        createdAt: '2026-01-01T00:00:00.000Z',
      });

    const gif = (uid, id, ficha) =>
      setDoc(doc(db(uid), 'users', uid, 'favoriteGifs', id), {
        gifId: id,
        gif: ficha,
        createdAt: '2026-01-01T00:00:00.000Z',
      });

    const gifEn = (quienEscribe, deQuien, id, ficha) =>
      setDoc(doc(db(quienEscribe), 'users', deQuien, 'favoriteGifs', id), {
        gifId: id,
        gif: ficha,
        createdAt: '2026-01-01T00:00:00.000Z',
      });

    it('cada quien guarda sus emojis favoritos', async () => {
      await assertSucceeds(emoji(ALICE, 'fire'));
      await assertSucceeds(emoji(ALICE, 'skull'));
    });

    it('NO deja guardar un emoji con una clave que no es válida', async () => {
      // Mayúscula, espacio y emoji suelto: los tres pasan el
      // formato que se comprueba en el cliente pero no el de las
      // reglas.
      await assertFails(emoji(ALICE, 'Fire'));
      await assertFails(emoji(ALICE, 'con espacio'));
      await assertFails(emoji(ALICE, '🔥'));
    });

    it('NO deja guardar en los favoritos de otro', async () => {
      // CARA escribiendo en la lista de Alice.
      await assertFails(emojiEn(CARA, ALICE, 'fire'));
    });

    it('ni leer los de otro', async () => {
      await assertFails(getDoc(doc(db(CARA), 'users', ALICE, 'favoriteEmojis', 'fire')));
    });

    it('cada quien guarda sus GIFs favoritos, con la URL del proveedor', async () => {
      await assertSucceeds(gif(BOB, 'abc123', GIF_VALIDO));
    });

    it('NO deja guardar un GIF con una URL falsa', async () => {
      // El mismo agujero que en comentarios y en el chat: sin
      // esta comprobación, el campo `gif.url` de los favoritos
      // sería un sitio para colgar cualquier URL.
      await assertFails(gif(BOB, 'x', {
        provider: 'giphy',
        id: 'x',
        url: 'https://mi-sitio-falso.example/trackeame.gif',
        previewUrl: 'https://mi-sitio-falso.example/trackeame.gif',
      }));
    });

    it('NO deja guardar en los favoritos de GIF de otro', async () => {
      await assertFails(gifEn(CARA, BOB, 'abc123', GIF_VALIDO));
    });

    it('ni leer los de otro', async () => {
      await assertFails(getDoc(doc(db(CARA), 'users', BOB, 'favoriteGifs', 'abc123')));
    });

    it('los favoritos no tocan el XP ni el rol', async () => {
      // Un favorito no puede colarse en los campos de
      // gamificación. Las reglas de `users/{uid}` solo miran el
      // documento del usuario, así que aquí se comprueba que ese
      // documento sigue igual después de guardar favoritos.
      await assertSucceeds(emoji(ALICE, 'heart'));
      const snap = await getDoc(doc(db(ALICE), 'users', ALICE));
      assert(snap.data().role === 'user', 'el rol sigue siendo user');
      assert(snap.data().xp === undefined, 'no se ha creado XP con un favorito');
    });
  });
});
