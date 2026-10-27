/**
 * PRIVACIDAD DE PERFILES, LISTAS DE BLOQUEO Y VOTOS
 * =================================================
 *
 * Estas pruebas fijan el modelo de acceso que separa los datos
 * privados del perfil público:
 *
 *   users/{uid}                 lectura para gente con sesión, sin
 *                               campos privados
 *   userPrivate/{uid}           dueño (leer/escribir), admin (leer/listar),
 *                               moderador y demás usuarios NO
 *   users/{uid}/blocked/*       solo su dueño
 *   pollVotes/{uid}             solo quien votó; nadie puede listar
 *   pollStats                   lectura, pero escritura solo servidor
 *
 * Los cuatro roles se prueban en cada bloque: dueño, otro usuario,
 * moderador y administrador.
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
  serverTimestamp,
  setDoc,
  updateDoc,
} = require('firebase/firestore');

const fs = require('fs');
const path = require('path');

const RULES = fs.readFileSync(
  path.join(__dirname, '..', 'firestore.rules'),
  'utf8',
);
const PROJECT = 'demo-geekapoo-privacidad-perfiles';

const ALICE = 'alice';
const BOB = 'bob';
const MOD = 'moderador';
const ADMIN = 'admin';
const NUEVO = 'nuevo';

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

function usuario(uid, role = 'user') {
  return {
    uid,
    username: uid,
    displayName: uid,
    chatId: `GK-${uid.toUpperCase()}`,
    avatarUrl: '',
    role,
    privateProfile: false,
    activityHidden: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

function privado(uid) {
  return {
    email: `${uid}@test.com`,
    privacy: {
      profileVisibility: 'public',
      allowChatRequests: true,
      showActivity: true,
    },
    chatApariencia: { tema: 'oscuro' },
    regionPreferida: 'ES',
    updatedAt: serverTimestamp(),
  };
}

function encuesta() {
  return {
    question: '¿Qué opción?',
    options: { o1: 'Uno', o2: 'Dos' },
    expiresAt: null,
    isClosed: false,
    allowChangeVote: false,
  };
}

/** Solicitud directa tal cual la escribe `requestDirectChat`. */
function solicitudDirecta(from, to) {
  return {
    type: 'direct',
    fromId: from,
    fromName: from,
    fromAvatar: '',
    toId: to,
    toName: to,
    toAvatar: '',
    status: 'pending',
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

  await sembrar(async (f) => {
    for (const uid of [ALICE, BOB, NUEVO]) {
      await setDoc(doc(f, 'users', uid), usuario(uid));
    }
    await setDoc(doc(f, 'users', MOD), usuario(MOD, 'moderator'));
    await setDoc(doc(f, 'users', ADMIN), usuario(ADMIN, 'admin'));

    await setDoc(doc(f, 'userPrivate', ALICE), privado(ALICE));
    await setDoc(doc(f, 'userPrivate', BOB), privado(BOB));

    await setDoc(doc(f, 'users', ALICE, 'blocked', BOB), {
      blockedAt: '2026-01-01T00:00:00.000Z',
    });

    await setDoc(doc(f, 'threads', 'hilo1'), {
      authorId: ALICE,
      title: 'Hilo con encuesta',
      body: 'Texto',
      createdAt: '2026-01-01T00:00:00.000Z',
      poll: encuesta(),
    });
    await setDoc(doc(f, 'threads', 'hilo1', 'pollVotes', ALICE), {
      userId: ALICE,
      optionId: 'o1',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    await setDoc(doc(f, 'pollStats', 'hilo1'), {
      threadId: 'hilo1',
      options: { o1: 1 },
      totalVotes: 1,
      actualizadoAt: '2026-01-01T00:00:00.000Z',
    });

    await setDoc(doc(f, 'chats', 'chat1'), {
      type: 'group',
      name: 'Grupo',
      avatar: '',
      code: 'GRP-PRIV-0001',
      ownerId: ALICE,
      memberIds: [ALICE, BOB],
      hiddenFor: [],
      lastMessage: '',
      lastMessageAt: '2026-01-01T00:00:00.000Z',
      lastMessageSenderId: ALICE,
      readAt: {},
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    await setDoc(doc(f, 'chats', 'chat1', 'messages', 'm1'), {
      chatId: 'chat1',
      senderId: ALICE,
      senderName: ALICE,
      senderAvatar: '',
      body: '',
      type: 'poll',
      poll: encuesta(),
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    await setDoc(doc(f, 'chats', 'chat1', 'messages', 'm1', 'pollVotes', ALICE), {
      userId: ALICE,
      optionId: 'o1',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    await setDoc(
      doc(f, 'chats', 'chat1', 'messages', 'm1', 'pollStats', 'summary'),
      {
        chatId: 'chat1',
        messageId: 'm1',
        options: { o1: 1 },
        totalVotes: 1,
        actualizadoAt: '2026-01-01T00:00:00.000Z',
      },
    );
  });
});

// ═══════════════════════════════════════════════════════════
// PERFIL PÚBLICO Y DATOS PRIVADOS
// ═══════════════════════════════════════════════════════════

describe('perfil público', () => {
  it('cualquier persona con sesión puede leer el perfil público', async () => {
    await assertSucceeds(getDoc(doc(db(BOB), 'users', ALICE)));
    await assertFails(getDoc(doc(anon(), 'users', ALICE)));
  });

  it('el dueño puede editar campos públicos y sus señales de privacidad', async () => {
    await assertSucceeds(
      updateDoc(doc(db(ALICE), 'users', ALICE), {
        bio: 'Nueva bio',
        privateProfile: true,
        activityHidden: true,
      }),
    );
  });

  it('NO se pueden escribir datos privados en el perfil público', async () => {
    for (const campo of [
      { email: 'otro@test.com' },
      { chatApariencia: { tema: 'claro' } },
      { regionPreferida: 'MX' },
      { profileVisibility: 'private' },
      { allowChatRequests: false },
      { showActivity: false },
    ]) {
      await assertFails(updateDoc(doc(db(ALICE), 'users', ALICE), campo));
    }
  });

  it('ni siquiera un admin puede colar datos privados en el perfil público', async () => {
    await assertFails(
      updateDoc(doc(db(ADMIN), 'users', ALICE), { email: 'admin@test.com' }),
    );
  });

  it('un perfil nuevo no puede nacer con correo ni con isBanned', async () => {
    await assertFails(
      setDoc(doc(db('nuevo-email'), 'users', 'nuevo-email'), {
        ...usuario('nuevo-email'),
        email: 'nuevo@test.com',
      }),
    );
    await assertFails(
      setDoc(doc(db('nuevo-baneado'), 'users', 'nuevo-baneado'), {
        ...usuario('nuevo-baneado'),
        isBanned: true,
      }),
    );
  });

  it('un perfil nuevo normal se puede crear sin campos privados', async () => {
    await assertSucceeds(
      setDoc(doc(db('nuevo-ok'), 'users', 'nuevo-ok'), usuario('nuevo-ok')),
    );
  });
});

describe('userPrivate', () => {
  it('el dueño lee su documento privado', async () => {
    await assertSucceeds(getDoc(doc(db(ALICE), 'userPrivate', ALICE)));
  });

  it('otro usuario NO puede leer los datos privados ajenos', async () => {
    await assertFails(getDoc(doc(db(BOB), 'userPrivate', ALICE)));
  });

  it('un moderador NO puede leer los datos privados', async () => {
    await assertFails(getDoc(doc(db(MOD), 'userPrivate', ALICE)));
    await assertFails(getDocs(collection(db(MOD), 'userPrivate')));
  });

  it('un admin puede leer y listar los datos privados', async () => {
    await assertSucceeds(getDoc(doc(db(ADMIN), 'userPrivate', ALICE)));
    await assertSucceeds(getDocs(collection(db(ADMIN), 'userPrivate')));
  });

  it('el dueño puede crear y actualizar su documento privado', async () => {
    await assertSucceeds(
      setDoc(doc(db(NUEVO), 'userPrivate', NUEVO), {
        email: 'nuevo@test.com',
        privacy: {
          profileVisibility: 'private',
          allowChatRequests: false,
          showActivity: false,
        },
        chatApariencia: { tema: 'oscuro' },
        regionPreferida: 'MX',
        updatedAt: serverTimestamp(),
      }),
    );
    await assertSucceeds(
      updateDoc(doc(db(NUEVO), 'userPrivate', NUEVO), {
        regionPreferida: 'AR',
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('NO puede escribir el documento privado de otra persona', async () => {
    await assertFails(
      updateDoc(doc(db(BOB), 'userPrivate', ALICE), {
        email: 'bob@test.com',
      }),
    );
    await assertFails(
      setDoc(doc(db(BOB), 'userPrivate', ALICE), privado(ALICE)),
    );
  });

  it('el admin puede leer pero NO escribir datos privados', async () => {
    await assertFails(
      updateDoc(doc(db(ADMIN), 'userPrivate', ALICE), {
        email: 'cambiado@test.com',
      }),
    );
  });

  it('valida el correo, la privacidad y las claves permitidas', async () => {
    await assertFails(
      updateDoc(doc(db(ALICE), 'userPrivate', ALICE), {
        privacy: { profileVisibility: 'visible', allowChatRequests: true, showActivity: true },
      }),
    );
    await assertFails(
      updateDoc(doc(db(ALICE), 'userPrivate', ALICE), {
        campoInventado: true,
      }),
    );
    await assertFails(
      updateDoc(doc(db(ALICE), 'userPrivate', ALICE), {
        email: 42,
      }),
    );
  });

  it('un moderador no puede escribir el documento privado de nadie', async () => {
    await assertFails(
      updateDoc(doc(db(MOD), 'userPrivate', ALICE), { email: 'x@test.com' }),
    );
  });

  it('las solicitudes de chat respetan la privacidad guardada aparte', async () => {
    await assertSucceeds(
      updateDoc(doc(db(ALICE), 'userPrivate', ALICE), {
        privacy: {
          profileVisibility: 'public',
          allowChatRequests: false,
          showActivity: true,
        },
      }),
    );
    await assertFails(
      setDoc(
        doc(collection(db(BOB), 'chatRequests')),
        solicitudDirecta(BOB, ALICE),
      ),
    );

    await assertSucceeds(
      updateDoc(doc(db(ALICE), 'userPrivate', ALICE), {
        privacy: {
          profileVisibility: 'private',
          allowChatRequests: true,
          showActivity: true,
        },
      }),
    );
    await assertFails(
      setDoc(
        doc(collection(db(BOB), 'chatRequests')),
        solicitudDirecta(BOB, ALICE),
      ),
    );

    await assertSucceeds(
      updateDoc(doc(db(ALICE), 'userPrivate', ALICE), {
        privacy: {
          profileVisibility: 'public',
          allowChatRequests: true,
          showActivity: true,
        },
      }),
    );
    await assertSucceeds(
      setDoc(
        doc(collection(db(BOB), 'chatRequests')),
        solicitudDirecta(BOB, ALICE),
      ),
    );
  });

  it('si el documento privado no tiene privacy, mandan los campos públicos', async () => {
    // Caso real antes de migrar: el usuario solo guardó su
    // apariencia del chat en `userPrivate`, así que ese documento
    // existe pero no tiene `privacy`. Los ajustes antiguos del
    // perfil público siguen siendo la única fuente.
    await sembrar(async (f) => {
      await updateDoc(doc(f, 'users', ALICE), {
        profileVisibility: 'public',
        allowChatRequests: false,
        showActivity: true,
      });
    });

    await assertSucceeds(
      setDoc(doc(db(ALICE), 'userPrivate', ALICE), {
        updatedAt: serverTimestamp(),
        chatApariencia: { tema: 'neon' },
      }),
    );

    await assertFails(
      setDoc(
        doc(collection(db(BOB), 'chatRequests')),
        solicitudDirecta(BOB, ALICE),
      ),
    );
  });

  it('si existe el documento privado, la copia pública antigua no manda', async () => {
    // Simula una cuenta migrada a medias: el perfil público conserva
    // los campos viejos en true, pero el documento privado ya dice
    // que no se aceptan solicitudes.
    await sembrar(async (f) => {
      await updateDoc(doc(f, 'users', ALICE), {
        profileVisibility: 'public',
        allowChatRequests: true,
        showActivity: true,
      });
    });

    await updateDoc(doc(db(ALICE), 'userPrivate', ALICE), {
      privacy: {
        profileVisibility: 'public',
        allowChatRequests: false,
        showActivity: true,
      },
    });

    await assertFails(
      setDoc(
        doc(collection(db(BOB), 'chatRequests')),
        solicitudDirecta(BOB, ALICE),
      ),
    );
  });
});

// ═══════════════════════════════════════════════════════════
// LISTAS DE BLOQUEO
// ═══════════════════════════════════════════════════════════

describe('users/{uid}/blocked', () => {
  it('solo el dueño lee su lista', async () => {
    await assertSucceeds(
      getDoc(doc(db(ALICE), 'users', ALICE, 'blocked', BOB)),
    );
    await assertSucceeds(getDocs(collection(db(ALICE), 'users', ALICE, 'blocked')));
  });

  it('otros usuarios, moderadores y admin NO leen listas ajenas', async () => {
    for (const uid of [BOB, MOD, ADMIN]) {
      await assertFails(getDoc(doc(db(uid), 'users', ALICE, 'blocked', BOB)));
      await assertFails(getDocs(collection(db(uid), 'users', ALICE, 'blocked')));
    }
  });

  it('sin sesión tampoco se lee', async () => {
    await assertFails(
      getDocs(collection(anon(), 'users', ALICE, 'blocked')),
    );
  });

  it('solo el dueño escribe su lista', async () => {
    await assertSucceeds(
      setDoc(doc(db(ALICE), 'users', ALICE, 'blocked', NUEVO), {
        blockedAt: '2026-01-01T00:00:00.000Z',
      }),
    );
    await assertFails(
      setDoc(doc(db(BOB), 'users', ALICE, 'blocked', NUEVO), {
        blockedAt: '2026-01-01T00:00:00.000Z',
      }),
    );
    await assertFails(
      setDoc(doc(db(ADMIN), 'users', ALICE, 'blocked', NUEVO), {
        blockedAt: '2026-01-01T00:00:00.000Z',
      }),
    );
  });
});

// ═══════════════════════════════════════════════════════════
// ENCUESTAS DE HILO
// ═══════════════════════════════════════════════════════════

describe('votos de encuestas de hilo', () => {
  it('solo se lee el voto propio; nadie puede listar los votos', async () => {
    await assertSucceeds(
      getDoc(doc(db(ALICE), 'threads', 'hilo1', 'pollVotes', ALICE)),
    );

    for (const uid of [BOB, MOD, ADMIN]) {
      await assertFails(
        getDoc(doc(db(uid), 'threads', 'hilo1', 'pollVotes', ALICE)),
      );
      await assertFails(
        getDocs(collection(db(uid), 'threads', 'hilo1', 'pollVotes')),
      );
    }

    await assertFails(
      getDocs(collection(anon(), 'threads', 'hilo1', 'pollVotes')),
    );
  });

  it('el resumen agregado se lee, pero solo lo escribe el servidor', async () => {
    await assertSucceeds(getDoc(doc(anon(), 'pollStats', 'hilo1')));
    await assertSucceeds(getDoc(doc(db(BOB), 'pollStats', 'hilo1')));

    for (const uid of [ALICE, MOD, ADMIN]) {
      await assertFails(
        setDoc(doc(db(uid), 'pollStats', 'hilo1'), {
          totalVotes: 999,
          options: { o1: 999 },
        }),
      );
      await assertFails(
        updateDoc(doc(db(uid), 'pollStats', 'hilo1'), { totalVotes: 999 }),
      );
    }
  });
});

// ═══════════════════════════════════════════════════════════
// ENCUESTAS DE CHAT
// ═══════════════════════════════════════════════════════════

describe('votos de encuestas de chat', () => {
  it('solo el autor del voto puede leerlo; ni miembros ni equipo listan', async () => {
    await assertSucceeds(
      getDoc(doc(db(ALICE), 'chats', 'chat1', 'messages', 'm1', 'pollVotes', ALICE)),
    );

    for (const uid of [BOB, MOD, ADMIN]) {
      await assertFails(
        getDoc(doc(db(uid), 'chats', 'chat1', 'messages', 'm1', 'pollVotes', ALICE)),
      );
      await assertFails(
        getDocs(
          collection(db(uid), 'chats', 'chat1', 'messages', 'm1', 'pollVotes'),
        ),
      );
    }
  });

  it('el resumen agregado lo leen miembros y admin, pero no se escribe', async () => {
    await assertSucceeds(
      getDoc(
        doc(db(BOB), 'chats', 'chat1', 'messages', 'm1', 'pollStats', 'summary'),
      ),
    );
    await assertSucceeds(
      getDoc(
        doc(db(ADMIN), 'chats', 'chat1', 'messages', 'm1', 'pollStats', 'summary'),
      ),
    );
    await assertFails(
      getDoc(
        doc(db(NUEVO), 'chats', 'chat1', 'messages', 'm1', 'pollStats', 'summary'),
      ),
    );

    for (const uid of [ALICE, MOD, ADMIN]) {
      await assertFails(
        updateDoc(
          doc(db(uid), 'chats', 'chat1', 'messages', 'm1', 'pollStats', 'summary'),
          { totalVotes: 999 },
        ),
      );
    }
  });
});
