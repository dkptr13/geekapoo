/**
 * PRIVACIDAD DE `reactions/`.
 *
 * Hilos y comentarios son públicos, así que sus reacciones también
 * se pueden leer sin sesión. Los mensajes de chat NO: una reacción a
 * un mensaje privado también revela que existe una conversación y
 * quién participa. Solo la lee quien es miembro del chat al que
 * apunta el documento.
 *
 * Las reglas no son un filtro: por eso se comprueban las dos formas
 * de lectura (documento individual y consulta/listado) y que las
 * consultas del cliente lleven el `targetType` y, en chats, el
 * `chatId` que las hace autorizables.
 *
 * Se ejecuta con `npm run test:rules`.
 */
const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} = require('@firebase/rules-unit-testing');
const {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
} = require('firebase/firestore');

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const RULES = fs.readFileSync(
  path.join(__dirname, '..', 'firestore.rules'),
  'utf8',
);
const PROJECT = 'demo-geekapoo-reacciones';

const ALICE = 'alice';
const BOB = 'bob';
const CARA = 'cara';
const CHAT_ALICE = 'chat-alice-bob';
const CHAT_CARA = 'chat-cara';

let testEnv;

function db(uid) {
  return testEnv.authenticatedContext(uid).firestore();
}

function anon() {
  return testEnv.unauthenticatedContext().firestore();
}

async function sembrar(fn) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await fn(ctx.firestore());
  });
}

async function crearUsuario(uid) {
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
    });
  });
}

function nuevoChat(ownerId, memberIds) {
  return {
    type: 'group',
    name: 'Chat de prueba',
    ownerId,
    memberIds,
    hiddenFor: [],
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

function mensaje(chatId, senderId, extra = {}) {
  return {
    chatId,
    senderId,
    senderName: senderId,
    senderAvatar: '',
    body: 'hola',
    type: 'text',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  };
}

function reaccion(uid, extra = {}) {
  return {
    targetType: 'thread',
    targetId: 'hilo1',
    userId: uid,
    type: 'fire',
    userName: uid,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  };
}

function reaccionChat(uid, chatId, targetId, extra = {}) {
  return reaccion(uid, {
    targetType: 'chat_message',
    targetId,
    chatId,
    ...extra,
  });
}

function consultaPublica(ctx, targetType, targetIds) {
  return query(
    collection(ctx, 'reactions'),
    where('targetType', '==', targetType),
    where('targetId', 'in', targetIds),
    limit(700),
  );
}

function consultaChat(ctx, chatId, targetIds) {
  return query(
    collection(ctx, 'reactions'),
    where('targetType', '==', 'chat_message'),
    where('chatId', '==', chatId),
    where('targetId', 'in', targetIds),
    limit(700),
  );
}

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT,
    firestore: { rules: RULES },
  });

  await crearUsuario(ALICE);
  await crearUsuario(BOB);
  await crearUsuario(CARA);

  await sembrar(async (f) => {
    await setDoc(doc(f, 'threads', 'hilo1'), {
      authorId: ALICE,
      title: 'Hilo público',
      body: 'contenido',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    await setDoc(doc(f, 'threads', 'hilo2'), {
      authorId: ALICE,
      title: 'Otro hilo',
      body: 'contenido',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    await setDoc(doc(f, 'comments', 'com1'), {
      authorId: BOB,
      targetType: 'thread',
      targetId: 'hilo1',
      body: 'comentario',
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    await setDoc(doc(f, 'chats', CHAT_ALICE), nuevoChat(ALICE, [ALICE, BOB]));
    await setDoc(doc(f, 'chats', CHAT_CARA), nuevoChat(CARA, [CARA]));

    // El mismo id de mensaje en dos chats distintos: cada reacción
    // tiene que quedar atada a SU chat, no al id suelto.
    for (const chatId of [CHAT_ALICE, CHAT_CARA]) {
      await setDoc(
        doc(f, 'chats', chatId, 'messages', 'm1'),
        mensaje(chatId, chatId === CHAT_ALICE ? ALICE : CARA),
      );
    }
    for (const id of ['m2', 'm3', 'm4']) {
      await setDoc(
        doc(f, 'chats', CHAT_ALICE, 'messages', id),
        mensaje(CHAT_ALICE, ALICE),
      );
    }

    // Reacciones públicas.
    await setDoc(
      doc(f, 'reactions', `reac_thread_hilo1_${ALICE}`),
      reaccion(ALICE),
    );
    await setDoc(
      doc(f, 'reactions', `reac_comment_com1_${BOB}`),
      reaccion(BOB, { targetType: 'comment', targetId: 'com1', type: 'cry' }),
    );

    // Reacciones al chat de Alice/Bob.
    await setDoc(
      doc(f, 'reactions', `reac_chat_message_m1_${ALICE}`),
      reaccionChat(ALICE, CHAT_ALICE, 'm1'),
    );
    await setDoc(
      doc(f, 'reactions', `reac_chat_message_m1_${BOB}`),
      reaccionChat(BOB, CHAT_ALICE, 'm1', { type: 'laugh' }),
    );

    // Reacción al chat de Cara, con el MISMO targetId "m1". Alice
    // no puede verla aunque conozca el id del mensaje.
    await setDoc(
      doc(f, 'reactions', `reac_chat_message_m1_${CARA}`),
      reaccionChat(CARA, CHAT_CARA, 'm1'),
    );

    // Legado: reacción a un mensaje del chat de Alice sin chatId.
    // No se borra; queda pendiente de la migración y no se puede
    // leer por la puerta pública.
    const legado = reaccionChat(BOB, CHAT_ALICE, 'm2');
    delete legado.chatId;
    await setDoc(doc(f, 'reactions', `reac_chat_message_m2_${BOB}`), legado);

    // Referencia incoherente: chat de Cara + mensaje que solo existe
    // en el chat de Alice. La regla no debe dejar leerla.
    await setDoc(
      doc(f, 'reactions', `reac_chat_message_m2_${CARA}`),
      reaccionChat(CARA, CHAT_CARA, 'm2'),
    );

    // Cara tiene una reacción en un chat del que no es miembro.
    // Las reglas nuevas no le dejan actualizarla ni borrarla.
    await setDoc(
      doc(f, 'reactions', `reac_chat_message_m4_${CARA}`),
      reaccionChat(CARA, CHAT_ALICE, 'm4'),
    );
  });
});

after(async () => {
  await testEnv.cleanup();
});

describe('reactions: lectura pública de hilos y comentarios', () => {
  it('un anónimo lee una reacción individual de un hilo', async () => {
    const snap = await assertSucceeds(
      getDoc(doc(anon(), 'reactions', `reac_thread_hilo1_${ALICE}`)),
    );

    assert.strictEqual(snap.exists(), true);
    assert.strictEqual(snap.data().targetType, 'thread');
  });

  it('un anónimo lista las reacciones de un hilo', async () => {
    const snap = await assertSucceeds(
      getDocs(consultaPublica(anon(), 'thread', ['hilo1'])),
    );

    const deAlice = snap.docs.find((d) => d.id === `reac_thread_hilo1_${ALICE}`);
    assert.ok(deAlice, 'la reacción pública tiene que llegar');
  });

  it('un anónimo lista las reacciones de un comentario', async () => {
    const snap = await assertSucceeds(
      getDocs(consultaPublica(anon(), 'comment', ['com1'])),
    );

    assert.strictEqual(snap.size, 1);
    assert.strictEqual(snap.docs[0].data().type, 'cry');
  });

  it('un usuario autenticado ve las mismas reacciones públicas', async () => {
    const snap = await assertSucceeds(
      getDocs(consultaPublica(db(CARA), 'thread', ['hilo1'])),
    );

    assert.ok(snap.size >= 1);
  });
});

describe('reactions: reacciones de mensajes privados', () => {
  it('un miembro lee una reacción individual de su chat', async () => {
    const snap = await assertSucceeds(
      getDoc(doc(db(ALICE), 'reactions', `reac_chat_message_m1_${ALICE}`)),
    );

    assert.strictEqual(snap.exists(), true);
    assert.strictEqual(snap.data().chatId, CHAT_ALICE);
  });

  it('un miembro lista solo las reacciones de su chat y sus mensajes', async () => {
    const snap = await assertSucceeds(
      getDocs(consultaChat(db(ALICE), CHAT_ALICE, ['m1'])),
    );

    assert.strictEqual(snap.size, 2, 'Alice y Bob, no la reacción de Cara');
    const ids = snap.docs.map((d) => d.id).sort();
    assert.deepStrictEqual(ids, [
      `reac_chat_message_m1_${ALICE}`,
      `reac_chat_message_m1_${BOB}`,
    ]);
  });

  it('un miembro puede listar las reacciones de los mensajes visibles de su chat', async () => {
    const snap = await assertSucceeds(
      getDocs(consultaChat(db(ALICE), CHAT_ALICE, ['m1', 'm2', 'm3', 'm4'])),
    );

    assert.ok(snap.size >= 2);
    assert.ok(snap.docs.every((d) => d.data().chatId === CHAT_ALICE));
  });

  it('un usuario externo NO lee una reacción individual del chat', async () => {
    await assertFails(
      getDoc(doc(db(CARA), 'reactions', `reac_chat_message_m1_${ALICE}`)),
    );
  });

  it('un usuario externo NO lista las reacciones del chat', async () => {
    await assertFails(
      getDocs(consultaChat(db(CARA), CHAT_ALICE, ['m1'])),
    );
  });

  it('un anónimo NO lee una reacción de chat ni la lista', async () => {
    await assertFails(
      getDoc(doc(anon(), 'reactions', `reac_chat_message_m1_${ALICE}`)),
    );
    await assertFails(
      getDocs(consultaChat(anon(), CHAT_ALICE, ['m1'])),
    );
  });

  it('un miembro de otro chat NO lista las reacciones del chat ajeno', async () => {
    await assertFails(
      getDocs(consultaChat(db(CARA), CHAT_ALICE, ['m1'])),
    );
  });

  it('la reacción del otro chat con el mismo mensaje no se mezcla', async () => {
    const snap = await assertSucceeds(
      getDocs(consultaChat(db(ALICE), CHAT_ALICE, ['m1'])),
    );

    assert.ok(!snap.docs.some((d) => d.id === `reac_chat_message_m1_${CARA}`));
  });

  it('el miembro del otro chat sí lee la reacción de su propio chat', async () => {
    const snap = await assertSucceeds(
      getDoc(doc(db(CARA), 'reactions', `reac_chat_message_m1_${CARA}`)),
    );

    assert.strictEqual(snap.data().chatId, CHAT_CARA);
  });

  it('NO se enumeran todas las reacciones de chat sin filtrar el chat', async () => {
    await assertFails(
      getDocs(
        query(
          collection(db(ALICE), 'reactions'),
          where('targetType', '==', 'chat_message'),
          limit(700),
        ),
      ),
    );
  });

  it('una reacción de chat sin chatId no se lee ni aunque sea del miembro', async () => {
    await assertFails(
      getDoc(doc(db(BOB), 'reactions', `reac_chat_message_m2_${BOB}`)),
    );
    const snap = await assertSucceeds(
      getDocs(consultaChat(db(BOB), CHAT_ALICE, ['m2'])),
    );
    assert.strictEqual(snap.size, 0, 'el legado queda pendiente de migración');
  });

  it('NO se lee una reacción cuyo chat no contiene el mensaje', async () => {
    await assertFails(
      getDoc(doc(db(CARA), 'reactions', `reac_chat_message_m2_${CARA}`)),
    );
  });
});

describe('reactions: escrituras y actualizaciones', () => {
  it('un miembro puede crear una reacción a un mensaje de su chat', async () => {
    await assertSucceeds(
      setDoc(
        doc(db(BOB), 'reactions', `reac_chat_message_m3_${BOB}`),
        reaccionChat(BOB, CHAT_ALICE, 'm3'),
      ),
    );
  });

  it('NO se puede crear una reacción de chat sin chatId', async () => {
    const { chatId: _omitido, ...sinChat } = reaccionChat(BOB, CHAT_ALICE, 'm4');
    await assertFails(
      setDoc(
        doc(db(BOB), 'reactions', `reac_chat_message_m4_${BOB}`),
        sinChat,
      ),
    );
  });

  it('NO se puede crear una reacción de chat en nombre de otra persona', async () => {
    await assertFails(
      setDoc(
        doc(db(BOB), 'reactions', `reac_chat_message_m4_${BOB}`),
        reaccionChat(ALICE, CHAT_ALICE, 'm4'),
      ),
    );
  });

  it('NO se puede crear una reacción a un mensaje de un chat ajeno', async () => {
    await assertFails(
      setDoc(
        doc(db(CARA), 'reactions', `reac_chat_message_m3_${CARA}`),
        reaccionChat(CARA, CHAT_ALICE, 'm3'),
      ),
    );
  });

  it('NO se puede crear una reacción con chat y mensaje incoherentes', async () => {
    await assertFails(
      setDoc(
        doc(db(CARA), 'reactions', `reac_chat_message_m3_${CARA}`),
        reaccionChat(CARA, CHAT_CARA, 'm3'),
      ),
    );
  });

  it('un miembro puede cambiar solo el tipo de su reacción', async () => {
    await assertSucceeds(
      updateDoc(doc(db(BOB), 'reactions', `reac_chat_message_m3_${BOB}`), {
        type: 'heart',
      }),
    );
  });

  it('NO se puede cambiar el mensaje, el chat ni el usuario de una reacción', async () => {
    await assertFails(
      updateDoc(doc(db(BOB), 'reactions', `reac_chat_message_m3_${BOB}`), {
        targetId: 'm4',
      }),
    );
    await assertFails(
      updateDoc(doc(db(BOB), 'reactions', `reac_chat_message_m3_${BOB}`), {
        chatId: CHAT_CARA,
      }),
    );
    await assertFails(
      updateDoc(doc(db(BOB), 'reactions', `reac_chat_message_m3_${BOB}`), {
        userId: ALICE,
      }),
    );
  });

  it('NO se puede tocar la reacción de otra persona', async () => {
    await assertFails(
      updateDoc(doc(db(ALICE), 'reactions', `reac_chat_message_m3_${BOB}`), {
        type: 'laugh',
      }),
    );
    await assertFails(
      deleteDoc(doc(db(ALICE), 'reactions', `reac_chat_message_m3_${BOB}`)),
    );
  });

  it('quien ya no es miembro no puede actualizar ni borrar su reacción de chat', async () => {
    // La reacción está sembrada en el chat de Alice, pero Cara no
    // está en memberIds. No puede usarla para tocar el documento.
    await assertFails(
      updateDoc(doc(db(CARA), 'reactions', `reac_chat_message_m4_${CARA}`), {
        type: 'laugh',
      }),
    );
    await assertFails(
      deleteDoc(doc(db(CARA), 'reactions', `reac_chat_message_m4_${CARA}`)),
    );
  });

  it('las reacciones públicas no aceptan un chatId pegado', async () => {
    await assertFails(
      setDoc(
        doc(db(ALICE), 'reactions', `reac_thread_hilo2_${ALICE}`),
        reaccion(ALICE, {
          targetId: 'hilo2',
          chatId: CHAT_ALICE,
        }),
      ),
    );
  });

  it('una reacción pública se puede crear sin chatId', async () => {
    await assertSucceeds(
      setDoc(
        doc(db(ALICE), 'reactions', `reac_thread_hilo2_${ALICE}`),
        reaccion(ALICE, { targetId: 'hilo2' }),
      ),
    );
  });

  it('cada quien puede borrar su propia reacción de chat', async () => {
    await assertSucceeds(
      deleteDoc(doc(db(BOB), 'reactions', `reac_chat_message_m3_${BOB}`)),
    );
  });
});
