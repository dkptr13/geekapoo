/**
 * Pruebas de las reglas de los MENSAJES FIJADOS.
 *
 * Lo que se comprueba:
 *
 *   1. En un club, solo el equipo con permiso puede fijar.
 *   2. En un privado o un grupo, cualquier miembro puede.
 *   3. No se puede fijar dos veces el mismo mensaje.
 *   4. No se puede fijar un mensaje que no existe.
 *   5. No se puede fingir que lo fijó otra persona.
 *   6. Quitar lo puede quien lo fijó, el autor del mensaje o el
 *      equipo.
 *   7. El texto guardado está acotado.
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
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  serverTimestamp,
  Timestamp,
} = require('firebase/firestore');

const fs = require('fs');
const path = require('path');

const RULES = fs.readFileSync(
  path.join(__dirname, '..', 'firestore.rules'),
  'utf8',
);
const PROJECT = 'demo-geekapoo-fijados';

const DUENO = 'dueno';
const ADMIN = 'admin';
const MOD = 'moderador';
const BOB = 'bob';
const CARA = 'cara';

let testEnv;

function db(uid) {
  return testEnv.authenticatedContext(uid).firestore();
}

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
      chatId: `GK-${uid.toUpperCase()}`,
      avatarUrl: '',
      role: 'user',
      createdAt: '2026-01-01T00:00:00.000Z',
      isBanned: false,
      ...extra,
    });
  });
}

function nuevoClub(extra = {}) {
  return {
    slug: 'club-fijados',
    name: 'Club de prueba',
    description: 'Un club para probar los mensajes fijados.',
    category: 'anime-manga',
    coverUrl: '',
    iconUrl: '',
    rules: 'Respeta a los demás.',
    accessType: 'public',
    ownerId: DUENO,
    moderatorIds: [MOD],
    adminIds: [ADMIN],
    memberIds: [DUENO, ADMIN, MOD, BOB, CARA],
    members: {
      [DUENO]: { uid: DUENO, role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
      [ADMIN]: { uid: ADMIN, role: 'admin', joinedAt: '2026-01-01T00:00:00.000Z' },
      [MOD]: { uid: MOD, role: 'moderator', joinedAt: '2026-01-02T00:00:00.000Z' },
      [BOB]: { uid: BOB, role: 'member', joinedAt: '2026-01-03T00:00:00.000Z' },
      [CARA]: { uid: CARA, role: 'member', joinedAt: '2026-01-03T00:00:00.000Z' },
    },
    memberCount: 5,
    chatId: 'chat-club',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  };
}

function mensaje(extra = {}) {
  return {
    chatId: 'chat-club',
    senderId: BOB,
    senderName: 'bob',
    senderAvatar: '',
    body: 'un mensaje cualquiera',
    type: 'text',
    createdAt: serverTimestamp(),
    ...extra,
  };
}

function fijado(extra = {}) {
  return {
    chatId: 'chat-club',
    messageId: 'm1',
    autorId: BOB,
    autorNombre: 'bob',
    autorAvatar: '',
    texto: 'un mensaje cualquiera',
    tipo: 'text',
    mensajeCreadoEn: '2026-10-19T10:00:00.000Z',
    fijadoPor: ADMIN,
    fijadoPorNombre: 'admin',
    fijadoEn: serverTimestamp(),
    ...extra,
  };
}

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT,
    firestore: { rules: RULES, host: '127.0.0.1', port: 8080 },
  });
});

after(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  for (const uid of [DUENO, ADMIN, MOD, BOB, CARA]) {
    await crearUsuario(uid);
  }
  await sembrar(async (f) => {
    await setDoc(doc(f, 'clubs', 'club-fijados'), nuevoClub());
    await setDoc(doc(f, 'chats', 'chat-club'), {
      type: 'club',
      name: 'Club de prueba',
      slug: 'club-fijados',
      channelId: 'general',
      memberIds: [DUENO, ADMIN, MOD, BOB, CARA],
      ownerId: DUENO,
    });
    await setDoc(doc(f, 'chats', 'chat-grupo'), {
      type: 'group',
      name: 'Grupo',
      memberIds: [BOB, CARA],
      ownerId: BOB,
    });
    await setDoc(doc(f, 'chats', 'chat-club', 'messages', 'm1'), mensaje());
    await setDoc(doc(f, 'chats', 'chat-grupo', 'messages', 'g1'), mensaje({
      chatId: 'chat-grupo',
    }));
  });
});

describe('Fijar mensajes en un club', () => {
  it('el dueño puede fijar', async () => {
    await assertSucceeds(
      setDoc(doc(db(DUENO), 'chats', 'chat-club', 'fijados', 'm1'), fijado({
        fijadoPor: DUENO,
      })),
    );
  });

  it('un admin puede fijar (el permiso viene encendido)', async () => {
    await assertSucceeds(
      setDoc(doc(db(ADMIN), 'chats', 'chat-club', 'fijados', 'm1'), fijado()),
    );
  });

  it('un moderador NO puede fijar sin permiso', async () => {
    await assertFails(
      setDoc(doc(db(MOD), 'chats', 'chat-club', 'fijados', 'm1'), fijado({
        fijadoPor: MOD,
      })),
    );
  });

  it('un moderador SÍ puede con el permiso concedido', async () => {
    await sembrar(async (f) => {
      await updateDoc(doc(f, 'clubs', 'club-fijados'), {
        permisos: { moderadorFijaMensajes: true },
      });
    });
    await assertSucceeds(
      setDoc(doc(db(MOD), 'chats', 'chat-club', 'fijados', 'm1'), fijado({
        fijadoPor: MOD,
      })),
    );
  });

  it('un miembro normal NO puede fijar', async () => {
    await assertFails(
      setDoc(doc(db(BOB), 'chats', 'chat-club', 'fijados', 'm1'), fijado({
        fijadoPor: BOB,
      })),
    );
  });

  it('nadie puede fijar dos veces el mismo mensaje', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'chat-club', 'fijados', 'm1'), fijado({
        fijadoPor: DUENO,
      }));
    });
    await assertFails(
      setDoc(doc(db(DUENO), 'chats', 'chat-club', 'fijados', 'm1'), fijado({
        fijadoPor: DUENO,
      })),
    );
  });

  it('no se puede fijar un mensaje que no existe', async () => {
    await assertFails(
      setDoc(doc(db(DUENO), 'chats', 'chat-club', 'fijados', 'inventado'), fijado({
        messageId: 'inventado',
        fijadoPor: DUENO,
      })),
    );
  });

  it('no se puede fingir que lo fijó otra persona', async () => {
    await assertFails(
      setDoc(doc(db(BOB), 'chats', 'chat-club', 'fijados', 'm1'), fijado({
        fijadoPor: DUENO,
      })),
    );
  });

  it('el texto guardado está acotado', async () => {
    await assertFails(
      setDoc(doc(db(DUENO), 'chats', 'chat-club', 'fijados', 'm1'), fijado({
        fijadoPor: DUENO,
        texto: 'x'.repeat(400),
      })),
    );
  });

  it('no se puede editar un fijado (se quita y se vuelve a fijar)', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'chat-club', 'fijados', 'm1'), fijado({
        fijadoPor: DUENO,
      }));
    });
    await assertFails(
      updateDoc(doc(db(DUENO), 'chats', 'chat-club', 'fijados', 'm1'), {
        texto: 'otro texto',
      }),
    );
  });
});

describe('Quitar mensajes fijados', () => {
  it('quien lo fijó puede quitarlo', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'chat-club', 'fijados', 'm1'), fijado({
        fijadoPor: ADMIN,
      }));
    });
    await assertSucceeds(deleteDoc(doc(db(ADMIN), 'chats', 'chat-club', 'fijados', 'm1')));
  });

  it('el autor del mensaje puede quitar su propio fijado', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'chat-club', 'fijados', 'm1'), fijado({
        fijadoPor: ADMIN,
        autorId: CARA,
      }));
    });
    await assertSucceeds(deleteDoc(doc(db(CARA), 'chats', 'chat-club', 'fijados', 'm1')));
  });

  it('un miembro normal que no lo fijó NO puede', async () => {
    await sembrar(async (f) => {
      // El mensaje es de CARA: BOB no lo fijó ni lo escribió, así
      // que no puede quitarlo.
      await setDoc(doc(f, 'chats', 'chat-club', 'fijados', 'm1'), fijado({
        fijadoPor: ADMIN,
        autorId: CARA,
      }));
    });
    await assertFails(deleteDoc(doc(db(BOB), 'chats', 'chat-club', 'fijados', 'm1')));
  });
});

describe('Fijar en un chat que no es de club', () => {
  it('cualquier miembro puede fijar en un grupo', async () => {
    await assertSucceeds(
      setDoc(doc(db(BOB), 'chats', 'chat-grupo', 'fijados', 'g1'), fijado({
        chatId: 'chat-grupo',
        messageId: 'g1',
        fijadoPor: BOB,
      })),
    );
  });

  it('quien no está en el grupo no puede ni leer', async () => {
    await assertFails(
      setDoc(doc(db(MOD), 'chats', 'chat-grupo', 'fijados', 'g1'), fijado({
        chatId: 'chat-grupo',
        messageId: 'g1',
        fijadoPor: MOD,
      })),
    );
    await assertFails(getDoc(doc(db(MOD), 'chats', 'chat-grupo', 'fijados', 'g1')));
  });
});

describe('Leer los fijados', () => {
  it('cualquier miembro del chat ve la lista', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'chat-club', 'fijados', 'm1'), fijado());
    });
    await assertSucceeds(getDoc(doc(db(CARA), 'chats', 'chat-club', 'fijados', 'm1')));
  });

  it('quien no está en el chat no la ve', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'chat-club', 'fijados', 'm1'), fijado());
    });
    await assertFails(getDoc(doc(db('ajeno'), 'chats', 'chat-club', 'fijados', 'm1')));
  });
});
