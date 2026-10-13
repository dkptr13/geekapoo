/**
 * Pruebas de las reglas de las TIER LISTS.
 *
 * La clasificación vive en `tierlists/{id}` y se comparte en
 * hilos (campo `tierList` del thread) y en chats (campo
 * `tierList` del mensaje): esos dos guardan solo id y título.
 * Los votos van en `tierlists/{id}/votes/{uid}`, un documento
 * por persona, igual que las encuestas.
 *
 *   1. Un usuario crea su tier list y queda como autor.
 *   2. La forma se valida (título, tamaños, visibilidad...).
 *   3. Las públicas las lee cualquiera; las de club, sus miembros.
 *   4. Solo el autor edita o borra la suya.
 *   5. Se vota por un nivel que exista, una vez por persona.
 *   6. Cambiar de nivel solo si el autor lo permitió.
 *   7. Quien no ve la tier list no vota en ella.
 *   8. El autor adjunta su tier list a su hilo (y la quita).
 *   9. Un miembro manda un mensaje solo con tier list.
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
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} = require('firebase/firestore');

const fs = require('fs');
const path = require('path');

const RULES = fs.readFileSync(
  path.join(__dirname, '..', 'firestore.rules'),
  'utf8',
);
const PROJECT = 'demo-geekapoo-tierlists';

const ALICE = 'alice';
const BOB = 'bob';
const CARA = 'carla';
const DUENO = 'dueno';
const MOD = 'moderador';

let testEnv;

function db(uid) {
  return testEnv.authenticatedContext(uid).firestore();
}

function anon() {
  return testEnv.unauthenticatedContext().firestore();
}

/** Escribe saltándose las reglas, para sembrar el escenario. */
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

/** Una tier list tal cual la escribe `crearTierList`. */
function nuevaTier(autor, extra = {}) {
  return {
    authorId: autor,
    authorName: autor,
    authorAvatar: '',
    title: 'Mejores openings',
    description: 'Mi ranking personal.',
    category: 'anime-manga',
    tiers: {
      t1: { label: 'S', color: '#ff7f7f', order: 0 },
      t2: { label: 'A', color: '#ffbf7f', order: 1 },
    },
    items: {
      i1: { name: 'Unravel', imageUrl: 'https://x/y1.jpg' },
      i2: { name: 'Gurenge', imageUrl: 'https://x/y2.jpg' },
    },
    placement: { i1: 't1', i2: 'pool' },
    poolOrder: { t1: ['i1'], t2: [], pool: ['i2'] },
    visibility: 'public',
    voting: { enabled: true, allowChange: false },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  };
}

function sembrarClubConMiembros() {
  return sembrar(async (f) => {
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
      memberIds: [DUENO, MOD, BOB],
      members: {
        [DUENO]: { uid: DUENO, role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
        [MOD]: { uid: MOD, role: 'moderator', joinedAt: '2026-01-02T00:00:00.000Z' },
        [BOB]: { uid: BOB, role: 'member', joinedAt: '2026-01-03T00:00:00.000Z' },
      },
      memberCount: 3,
      chatId: 'chat-club-x',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    await setDoc(doc(f, 'chats', 'chat-club-x'), {
      type: 'club',
      name: 'Club X',
      slug: 'club-x',
      ownerId: DUENO,
      memberIds: [DUENO, MOD, BOB],
      hiddenFor: [],
      lastMessage: '',
      lastMessageAt: '2026-01-01T00:00:00.000Z',
      lastMessageSenderId: DUENO,
      readAt: {},
      createdAt: '2026-01-01T00:00:00.000Z',
    });
  });
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
});

// ── CREAR ────────────────────────────────────────────

describe('Crear una tier list', () => {
  it('un usuario crea la suya y queda como autor', async () => {
    await assertSucceeds(
      setDoc(doc(collection(db(ALICE), 'tierlists')), nuevaTier(ALICE)),
    );
  });

  it('pero no como si fuera de otro', async () => {
    await assertFails(
      setDoc(doc(collection(db(ALICE), 'tierlists')), nuevaTier(BOB)),
    );
  });

  it('sin sesión no se crea nada', async () => {
    await assertFails(
      setDoc(doc(collection(anon(), 'tierlists')), nuevaTier(ALICE)),
    );
  });

  it('sin niveles no vale', async () => {
    await assertFails(
      setDoc(doc(collection(db(ALICE), 'tierlists')), nuevaTier(ALICE, { tiers: {} })),
    );
  });

  it('sin elementos tampoco', async () => {
    await assertFails(
      setDoc(doc(collection(db(ALICE), 'tierlists')), nuevaTier(ALICE, { items: {} })),
    );
  });

  it('ni con trece niveles', async () => {
    const tiers = {};
    for (let i = 0; i < 13; i++) tiers[`t${i}`] = { label: `N${i}`, color: '#ffffff', order: i };
    await assertFails(
      setDoc(doc(collection(db(ALICE), 'tierlists')), nuevaTier(ALICE, { tiers })),
    );
  });

  it('el título no puede pasarse de 80', async () => {
    await assertFails(
      setDoc(doc(collection(db(ALICE), 'tierlists')), nuevaTier(ALICE, { title: 'x'.repeat(81) })),
    );
  });

  it('la visibilidad tiene que ser válida', async () => {
    await assertFails(
      setDoc(doc(collection(db(ALICE), 'tierlists')), nuevaTier(ALICE, { visibility: 'todos' })),
    );
  });

  it('de club sin club no vale', async () => {
    await assertFails(
      setDoc(doc(collection(db(ALICE), 'tierlists')), nuevaTier(ALICE, { visibility: 'club' })),
    );
  });
});

// ── LEER ─────────────────────────────────────────────

describe('Leer tier lists', () => {
  beforeEach(async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'tierlists', 'pub'), { ...nuevaTier(ALICE), visibility: 'public' });
      await sembrarClubConMiembros();
      await setDoc(doc(f, 'tierlists', 'priv'), {
        ...nuevaTier(DUENO),
        visibility: 'club',
        clubId: 'club-x',
      });
    });
  });

  it('una pública la lee cualquiera, hasta sin sesión', async () => {
    await assertSucceeds(getDoc(doc(anon(), 'tierlists', 'pub')));
  });

  it('una de club la lee un miembro', async () => {
    await assertSucceeds(getDoc(doc(db(BOB), 'tierlists', 'priv')));
  });

  it('pero no un ajeno', async () => {
    await assertFails(getDoc(doc(db(ALICE), 'tierlists', 'priv')));
  });

  it('el autor la lee aunque no sea del club', async () => {
    // DUENO sí es del club aquí; CARA crea una de club sin ser
    // miembro de ninguno para comprobar la rama de autor.
    await sembrar(async (f) => {
      await setDoc(doc(f, 'tierlists', 'mia'), {
        ...nuevaTier(CARA),
        visibility: 'club',
        clubId: 'club-x',
      });
    });
    await assertSucceeds(getDoc(doc(db(CARA), 'tierlists', 'mia')));
  });

  it('el autor lista las suyas', async () => {
    const lista = await assertSucceeds(
      getDocs(
        query(
          collection(db(ALICE), 'tierlists'),
          where('authorId', '==', ALICE),
          orderBy('updatedAt', 'desc'),
          limit(50),
        ),
      ),
    );
    if (lista.size < 1) throw new Error('Debería traer al menos la pública de ALICE');
  });
});

// ── EDITAR Y BORRAR ──────────────────────────────────

describe('Editar y borrar', () => {
  beforeEach(async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'tierlists', 't1'), nuevaTier(ALICE));
    });
  });

  it('el autor edita el título', async () => {
    await assertSucceeds(
      updateDoc(doc(db(ALICE), 'tierlists', 't1'), {
        title: 'Mejores endings',
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('otro usuario no la toca', async () => {
    await assertFails(
      updateDoc(doc(db(BOB), 'tierlists', 't1'), {
        title: 'hackeada',
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('ni se la apropia cambiando el autor', async () => {
    await assertFails(
      updateDoc(doc(db(ALICE), 'tierlists', 't1'), {
        authorId: BOB,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('el autor la borra', async () => {
    await assertSucceeds(deleteDoc(doc(db(ALICE), 'tierlists', 't1')));
  });

  it('otro no', async () => {
    await assertFails(deleteDoc(doc(db(BOB), 'tierlists', 't1')));
  });
});

// ── VOTOS ────────────────────────────────────────────

describe('Votar el nivel favorito', () => {
  beforeEach(async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'tierlists', 't1'), nuevaTier(ALICE));
    });
  });

  it('un usuario vota por un nivel', async () => {
    await assertSucceeds(
      setDoc(doc(db(BOB), 'tierlists', 't1', 'votes', BOB), {
        userId: BOB,
        tierId: 't1',
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('pero no por un nivel que no existe', async () => {
    await assertFails(
      setDoc(doc(db(BOB), 'tierlists', 't1', 'votes', BOB), {
        userId: BOB,
        tierId: 't99',
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('ni con el id de otra persona', async () => {
    await assertFails(
      setDoc(doc(db(BOB), 'tierlists', 't1', 'votes', ALICE), {
        userId: ALICE,
        tierId: 't1',
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('sin cambio permitido, cambiar falla', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'tierlists', 't1', 'votes', BOB), {
        userId: BOB,
        tierId: 't1',
        createdAt: '2026-01-02T00:00:00.000Z',
      });
    });

    await assertFails(
      updateDoc(doc(db(BOB), 'tierlists', 't1', 'votes', BOB), {
        tierId: 't2',
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('con cambio permitido, cambiar pasa', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'tierlists', 't1'), {
        ...nuevaTier(ALICE),
        voting: { enabled: true, allowChange: true },
      });
      await setDoc(doc(f, 'tierlists', 't1', 'votes', BOB), {
        userId: BOB,
        tierId: 't1',
        createdAt: '2026-01-02T00:00:00.000Z',
      });
    });

    await assertSucceeds(
      updateDoc(doc(db(BOB), 'tierlists', 't1', 'votes', BOB), {
        tierId: 't2',
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('con votación apagada no se vota', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'tierlists', 't1'), {
        ...nuevaTier(ALICE),
        voting: { enabled: false, allowChange: false },
      });
    });

    await assertFails(
      setDoc(doc(db(BOB), 'tierlists', 't1', 'votes', BOB), {
        userId: BOB,
        tierId: 't1',
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('quien no ve la tier list no vota en ella', async () => {
    await sembrarClubConMiembros();
    await sembrar(async (f) => {
      await setDoc(doc(f, 'tierlists', 'priv'), {
        ...nuevaTier(DUENO),
        visibility: 'club',
        clubId: 'club-x',
      });
    });

    // ALICE no es del club: ni lee ni vota.
    await assertFails(getDoc(doc(db(ALICE), 'tierlists', 'priv', 'votes', ALICE)));
    await assertFails(
      setDoc(doc(db(ALICE), 'tierlists', 'priv', 'votes', ALICE), {
        userId: ALICE,
        tierId: 't1',
        createdAt: serverTimestamp(),
      }),
    );
  });
});

// ── ADJUNTAR EN HILOS ────────────────────────────────

describe('Adjuntar en hilos', () => {
  beforeEach(async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'threads', 'h1'), {
        authorId: ALICE,
        authorName: ALICE,
        authorAvatar: '',
        title: 'Hilo de prueba',
        body: 'Cuerpo del hilo de prueba.',
        categoryId: 'c1',
        categoryName: 'General',
        tags: [],
        likesCount: 0,
        likedBy: [],
        commentsCount: 0,
        createdAt: '2026-01-01T00:00:00.000Z',
      });
      await setDoc(doc(f, 'tierlists', 't1'), nuevaTier(ALICE));
    });
  });

  it('el autor adjunta su tier list a su hilo', async () => {
    await assertSucceeds(
      updateDoc(doc(db(ALICE), 'threads', 'h1'), {
        tierList: { tierListId: 't1', title: 'Mejores openings' },
      }),
    );
  });

  it('y la quita', async () => {
    await sembrar(async (f) => {
      await updateDoc(doc(f, 'threads', 'h1'), {
        tierList: { tierListId: 't1', title: 'Mejores openings' },
      });
    });

    await assertSucceeds(updateDoc(doc(db(ALICE), 'threads', 'h1'), { tierList: null }));
  });

  it('otro usuario no toca la del hilo ajeno', async () => {
    await assertFails(
      updateDoc(doc(db(BOB), 'threads', 'h1'), {
        tierList: { tierListId: 't1', title: 'Mejores openings' },
      }),
    );
  });

  it('una referencia sin id no pasa', async () => {
    await assertFails(
      updateDoc(doc(db(ALICE), 'threads', 'h1'), {
        tierList: { tierListId: '', title: 'Vacía' },
      }),
    );
  });
});

// ── ADJUNTAR EN CHATS ────────────────────────────────

describe('Adjuntar en chats', () => {
  beforeEach(async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'chat-1'), {
        type: 'group',
        name: 'Grupo de prueba',
        avatar: '',
        ownerId: ALICE,
        memberIds: [ALICE, BOB],
        hiddenFor: [],
        lastMessage: '',
        lastMessageAt: '2026-01-01T00:00:00.000Z',
        lastMessageSenderId: ALICE,
        readAt: {},
        createdAt: '2026-01-01T00:00:00.000Z',
      });
      await setDoc(doc(f, 'tierlists', 't1'), nuevaTier(ALICE));
    });
  });

  it('un miembro manda un mensaje solo con tier list', async () => {
    await assertSucceeds(
      setDoc(doc(collection(db(BOB), 'chats', 'chat-1', 'messages')), {
        chatId: 'chat-1',
        senderId: BOB,
        senderName: BOB,
        senderAvatar: '',
        body: '',
        type: 'tier',
        tierList: { tierListId: 't1', title: 'Mejores openings' },
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
        type: 'tier',
        tierList: { tierListId: 't1', title: 'Mejores openings' },
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('una referencia sin id no pasa', async () => {
    await assertFails(
      setDoc(doc(collection(db(BOB), 'chats', 'chat-1', 'messages')), {
        chatId: 'chat-1',
        senderId: BOB,
        senderName: BOB,
        senderAvatar: '',
        body: 'mira',
        type: 'text',
        tierList: { tierListId: '', title: '' },
        createdAt: serverTimestamp(),
      }),
    );
  });
});
