/**
 * Pruebas de las reglas de las ENCUESTAS EN LOS CHATS.
 *
 * La encuesta viaja dentro del mensaje (`messages/{id}.poll`)
 * y los votos van en `messages/{id}/pollVotes/{uid}`, con el
 * mismo modelo que las encuestas de los hilos: sin contadores
 * que el cliente pueda mentir y un documento por persona.
 *
 *   1. Un miembro puede mandar un mensaje SOLO con encuesta.
 *   2. Quien no es miembro, no.
 *   3. Una encuesta mal formada no pasa.
 *   4. Un miembro puede votar; un ajeno no (ni leer los votos).
 *   5. El voto tiene que ir a una opción que exista.
 *   6. Cambiar de opción solo si el autor lo permitió.
 *   7. En una encuesta cerrada o caducada no se vota.
 *   8. Cerrar la encuesta lo puede hacer el autor (y reabrir).
 *   9. Un miembro que no es el autor no puede cerrarla.
 *  10. En un club, un moderador sí puede cerrarla.
 *  11. Cerrar no permite reescribir la pregunta ni las opciones.
 *
 * Se ejecuta con `npm run test:rules`.
 */
const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} = require('@firebase/rules-unit-testing');
const {
  Timestamp,
  collection,
  doc,
  setDoc,
  updateDoc,
  getDocs,
  query,
  serverTimestamp,
} = require('firebase/firestore');

const fs = require('fs');
const path = require('path');

const RULES = fs.readFileSync(
  path.join(__dirname, '..', 'firestore.rules'),
  'utf8',
);
const PROJECT = 'demo-geekapoo-chat-polls';

const ALICE = 'alice';
const BOB = 'bob';
const CARA = 'cara';
const DUENO = 'dueno';
const MOD = 'moderador';

let testEnv;

function db(uid) {
  return testEnv.authenticatedContext(uid).firestore();
}

/** Escribe saltándose las reglas, para sembrar el escenario. */
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
      chatId: `GK-${uid.toUpperCase()}`,
      avatarUrl: '',
      role: 'user',
      createdAt: '2026-01-01T00:00:00.000Z',
      isBanned: false,
    });
  });
}

function encuestaBase(extra = {}) {
  return {
    question: '¿Quién gana este combate?',
    options: { o1: 'Goku', o2: 'Vegeta' },
    expiresAt: null,
    isClosed: false,
    allowChangeVote: false,
    ...extra,
  };
}

function mensajeConEncuesta(autor, encuesta) {
  return {
    chatId: 'chat-1',
    senderId: autor,
    senderName: autor,
    senderAvatar: '',
    body: '',
    type: 'poll',
    poll: encuesta,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT,
    firestore: { rules: RULES },
  });
});

after(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await crearUsuario(ALICE);
  await crearUsuario(BOB);
  await crearUsuario(CARA);
  await crearUsuario(DUENO);
  await crearUsuario(MOD);

  await sembrar(async (f) => {
    await setDoc(doc(f, 'chats', 'chat-1'), {
      type: 'group',
      name: 'Grupo de prueba',
      avatar: '',
      code: 'GRP-AAAA-BBBB',
      ownerId: ALICE,
      memberIds: [ALICE, BOB],
      hiddenFor: [],
      lastMessage: '',
      lastMessageAt: '2026-01-01T00:00:00.000Z',
      lastMessageSenderId: ALICE,
      readAt: {},
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    await setDoc(
      doc(f, 'chats', 'chat-1', 'messages', 'm1'),
      mensajeConEncuesta(ALICE, encuestaBase()),
    );
  });
});

// ── CREAR MENSAJES CON ENCUESTA ──────────────────────────

describe('Crear un mensaje con encuesta', () => {
  it('un miembro puede mandar un mensaje SOLO con encuesta', async () => {
    await assertSucceeds(
      setDoc(doc(collection(db(BOB), 'chats', 'chat-1', 'messages')), {
        chatId: 'chat-1',
        senderId: BOB,
        senderName: BOB,
        senderAvatar: '',
        body: '',
        type: 'poll',
        poll: encuestaBase({ question: '¿Sub o doblaje?' }),
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('quien no es miembro no puede', async () => {
    await assertFails(
      setDoc(doc(collection(db(CARA), 'chats', 'chat-1', 'messages')), {
        chatId: 'chat-1',
        senderId: CARA,
        senderName: CARA,
        senderAvatar: '',
        body: '',
        type: 'poll',
        poll: encuestaBase(),
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('una encuesta con una sola opción no pasa', async () => {
    await assertFails(
      setDoc(doc(collection(db(BOB), 'chats', 'chat-1', 'messages')), {
        chatId: 'chat-1',
        senderId: BOB,
        senderName: BOB,
        senderAvatar: '',
        body: '',
        type: 'poll',
        poll: encuestaBase({ options: { o1: 'Solo Goku' } }),
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('ni una encuesta que nace ya cerrada', async () => {
    await assertFails(
      setDoc(doc(collection(db(BOB), 'chats', 'chat-1', 'messages')), {
        chatId: 'chat-1',
        senderId: BOB,
        senderName: BOB,
        senderAvatar: '',
        body: '',
        type: 'poll',
        poll: encuestaBase({ isClosed: true }),
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('un mensaje vacío de verdad sigue sin valer', async () => {
    await assertFails(
      setDoc(doc(collection(db(BOB), 'chats', 'chat-1', 'messages')), {
        chatId: 'chat-1',
        senderId: BOB,
        senderName: BOB,
        senderAvatar: '',
        body: '',
        type: 'text',
        createdAt: serverTimestamp(),
      }),
    );
  });
});

// ── VOTAR ────────────────────────────────────────────────

describe('Votar en la encuesta de un mensaje', () => {
  it('un miembro puede votar', async () => {
    await assertSucceeds(
      setDoc(doc(db(BOB), 'chats', 'chat-1', 'messages', 'm1', 'pollVotes', BOB), {
        userId: BOB,
        optionId: 'o1',
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('quien no es miembro no puede votar', async () => {
    await assertFails(
      setDoc(doc(db(CARA), 'chats', 'chat-1', 'messages', 'm1', 'pollVotes', CARA), {
        userId: CARA,
        optionId: 'o1',
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('ni leer los votos', async () => {
    await assertFails(
      getDocs(query(collection(db(CARA), 'chats', 'chat-1', 'messages', 'm1', 'pollVotes'))),
    );
  });

  it('el voto tiene que ir a una opción que exista', async () => {
    await assertFails(
      setDoc(doc(db(BOB), 'chats', 'chat-1', 'messages', 'm1', 'pollVotes', BOB), {
        userId: BOB,
        optionId: 'o99',
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('no se puede votar con el id de otra persona', async () => {
    await assertFails(
      setDoc(doc(db(BOB), 'chats', 'chat-1', 'messages', 'm1', 'pollVotes', ALICE), {
        userId: ALICE,
        optionId: 'o1',
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('sin cambio de voto permitido, cambiar de opción falla', async () => {
    await sembrar(async (f) => {
      await setDoc(
        doc(f, 'chats', 'chat-1', 'messages', 'm1', 'pollVotes', BOB),
        { userId: BOB, optionId: 'o1', createdAt: '2026-01-02T00:00:00.000Z' },
      );
    });

    await assertFails(
      updateDoc(doc(db(BOB), 'chats', 'chat-1', 'messages', 'm1', 'pollVotes', BOB), {
        optionId: 'o2',
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('con cambio permitido, cambiar de opción pasa', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'chat-1', 'messages', 'm2'), {
        ...mensajeConEncuesta(ALICE, encuestaBase({ allowChangeVote: true })),
      });
      await setDoc(
        doc(f, 'chats', 'chat-1', 'messages', 'm2', 'pollVotes', BOB),
        { userId: BOB, optionId: 'o1', createdAt: '2026-01-02T00:00:00.000Z' },
      );
    });

    await assertSucceeds(
      updateDoc(doc(db(BOB), 'chats', 'chat-1', 'messages', 'm2', 'pollVotes', BOB), {
        optionId: 'o2',
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('en una encuesta cerrada no se vota', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'chat-1', 'messages', 'm3'), {
        ...mensajeConEncuesta(ALICE, encuestaBase({ isClosed: true })),
      });
    });

    await assertFails(
      setDoc(doc(db(BOB), 'chats', 'chat-1', 'messages', 'm3', 'pollVotes', BOB), {
        userId: BOB,
        optionId: 'o1',
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('en una encuesta caducada tampoco', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'chat-1', 'messages', 'm4'), {
        ...mensajeConEncuesta(
          ALICE,
          encuestaBase({ expiresAt: Timestamp.fromMillis(Date.now() - 3600 * 1000) }),
        ),
      });
    });

    await assertFails(
      setDoc(doc(db(BOB), 'chats', 'chat-1', 'messages', 'm4', 'pollVotes', BOB), {
        userId: BOB,
        optionId: 'o1',
        createdAt: serverTimestamp(),
      }),
    );
  });
});

// ── CERRAR LA ENCUESTA ───────────────────────────────────

describe('Cerrar la encuesta de un mensaje', () => {
  it('el autor puede cerrarla', async () => {
    await assertSucceeds(
      updateDoc(doc(db(ALICE), 'chats', 'chat-1', 'messages', 'm1'), {
        'poll.isClosed': true,
      }),
    );
  });

  it('y reabrirla', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'chat-1', 'messages', 'm1'), {
        ...mensajeConEncuesta(ALICE, encuestaBase({ isClosed: true })),
      });
    });

    await assertSucceeds(
      updateDoc(doc(db(ALICE), 'chats', 'chat-1', 'messages', 'm1'), {
        'poll.isClosed': false,
      }),
    );
  });

  it('un miembro que no es el autor no puede', async () => {
    await assertFails(
      updateDoc(doc(db(BOB), 'chats', 'chat-1', 'messages', 'm1'), {
        'poll.isClosed': true,
      }),
    );
  });

  it('cerrar no permite reescribir la pregunta', async () => {
    await assertFails(
      updateDoc(doc(db(ALICE), 'chats', 'chat-1', 'messages', 'm1'), {
        poll: encuestaBase({ question: '¿Pregunta cambiada?', isClosed: true }),
      }),
    );
  });

  it('en un club, un moderador sí puede cerrarla', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'clubs', 'club-x'), {
        slug: 'club-x',
        name: 'Club X',
        description: 'Descripcion larga del club de prueba.',
        category: 'anime-manga',
        coverUrl: '',
        iconUrl: '',
        rules: '',
        accessType: 'private',
        ownerId: DUENO,
        moderatorIds: [MOD],
        memberIds: [DUENO, MOD],
        members: {
          [DUENO]: { uid: DUENO, role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
          [MOD]: { uid: MOD, role: 'moderator', joinedAt: '2026-01-02T00:00:00.000Z' },
        },
        memberCount: 2,
        chatId: 'chat-club',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      });
      await setDoc(doc(f, 'chats', 'chat-club'), {
        type: 'club',
        name: 'Club X',
        slug: 'club-x',
        category: 'anime-manga',
        avatar: '',
        coverUrl: '',
        ownerId: DUENO,
        memberIds: [DUENO, MOD],
        hiddenFor: [],
        lastMessage: '',
        lastMessageAt: '2026-01-01T00:00:00.000Z',
        lastMessageSenderId: DUENO,
        readAt: {},
        createdAt: '2026-01-01T00:00:00.000Z',
      });
      await setDoc(doc(f, 'chats', 'chat-club', 'messages', 'mc1'), {
        ...mensajeConEncuesta(DUENO, encuestaBase()),
        chatId: 'chat-club',
      });
    });

    await assertSucceeds(
      updateDoc(doc(db(MOD), 'chats', 'chat-club', 'messages', 'mc1'), {
        'poll.isClosed': true,
      }),
    );
  });
});
