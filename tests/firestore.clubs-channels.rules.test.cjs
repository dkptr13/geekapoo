/**
 * Pruebas de las reglas de los CANALES TEMÁTICOS de los clubes.
 *
 * Cada canal es una ficha en `clubs/{clubId}/channels/{id}`
 * con su historial en `chats/{chatId}/messages/`. Lo que se
 * comprueba:
 *
 *   1. Propietario y moderadores crean canales; miembros no.
 *   2. La forma se valida (slug, nombre, visibilidad...).
 *   3. Cualquier miembro migra el `general` de clubes antiguos
 *      (apuntando al chat histórico), pero nada más.
 *   4. Los miembros listan canales; los ajenos solo en clubes
 *      descubribles; nadie ajeno en privados.
 *   5. Un miembro normal no lee la ficha de un canal `mods`.
 *   6. Mods editan/ordenan; miembros no; nadie toca `chatId`.
 *   7. El `general` no se borra ni se restringe.
 *   8. Un moderador de OTRO club no gestiona canales ajenos.
 *   9. Nadie se auto-añade al chat de un canal restringido.
 *  10. Quien no está en el chat no escribe en él.
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
  serverTimestamp,
} = require('firebase/firestore');

const fs = require('fs');
const path = require('path');

const RULES = fs.readFileSync(
  path.join(__dirname, '..', 'firestore.rules'),
  'utf8',
);
const PROJECT = 'demo-geekapoo-clubs-canales';

const ALICE = 'alice';
const BOB = 'bob';
const CARA = 'cara';
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

function nuevoClub(extra = {}) {
  return {
    slug: 'club-de-frieren',
    name: 'Club de Frieren',
    description: 'Charlamos del viaje de Frieren y sus compañeros.',
    category: 'anime-manga',
    coverUrl: '',
    iconUrl: '',
    rules: 'Respeta a los demás.',
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
    chatId: 'chat-club-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  };
}

function nuevoCanal(id, extra = {}) {
  return {
    id,
    clubId: 'club-de-frieren',
    chatId: `chat-${id}`,
    name: id,
    description: '',
    type: 'text',
    visibility: 'all',
    spoiler: false,
    order: 1,
    createdBy: DUENO,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  };
}

function nuevoChatCanal(chatId, miembros, extra = {}) {
  const base = {
    type: 'club',
    name: 'teorias',
    slug: 'club-de-frieren',
    // El `channelId` es el id del CANAL (no el del chat): es lo
    // que une el chat con su ficha en `channels/`. El histórico
    // (`chat-club-1`) no lo lleva: se pasa como `undefined`.
    channelId: 'teorias',
    category: 'anime-manga',
    avatar: '',
    coverUrl: '',
    ownerId: DUENO,
    memberIds: miembros,
    hiddenFor: [],
    lastMessage: '',
    lastMessageAt: serverTimestamp(),
    lastMessageSenderId: DUENO,
    readAt: {},
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  // `channelId: undefined` no se puede escribir en Firestore
  // (falla en el cliente): el histórico simplemente no lo lleva.
  if (extra.channelId === undefined && 'channelId' in extra) {
    const { channelId, ...resto } = extra;
    return { ...base, ...resto };
  }
  return { ...base, ...extra };
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
    await setDoc(doc(f, 'clubs', 'club-de-frieren'), nuevoClub());
    await setDoc(
      doc(f, 'chats', 'chat-club-1'),
      nuevoChatCanal('chat-club-1', [DUENO, MOD, BOB], { channelId: undefined }),
    );
  });
});

// ── CREAR CANALES ────────────────────────────────────

describe('Crear canales', () => {
  it('el propietario puede crear un canal', async () => {
    await sembrar(async (f) => {
      // El chat del canal se crea ANTES que la ficha (lo hace
      // `crearCanal`), así que aquí ya tiene que existir y llevar
      // exactamente a los miembros del club.
      await setDoc(
        doc(f, 'chats', 'chat-teorias'),
        nuevoChatCanal('chat-teorias', [DUENO, MOD, BOB], { channelId: 'teorias' }),
      );
    });

    await assertSucceeds(
      setDoc(doc(db(DUENO), 'clubs', 'club-de-frieren', 'channels', 'teorias'), nuevoCanal('teorias')),
    );
  });

  it('un moderador del club, si el propietario le da el permiso', async () => {
    await sembrar(async (f) => {
      // Los canales son configuración del club: un moderador
      // necesita que el propietario se lo conceda.
      await updateDoc(doc(f, 'clubs', 'club-de-frieren'), {
        permisos: { moderadorGestionaCanales: true },
      });
      await setDoc(
        doc(f, 'chats', 'chat-fanart'),
        nuevoChatCanal('chat-fanart', [DUENO, MOD, BOB], { channelId: 'fanart' }),
      );
    });
    await assertSucceeds(
      setDoc(
        doc(db(MOD), 'clubs', 'club-de-frieren', 'channels', 'fanart'),
        nuevoCanal('fanart', { chatId: 'chat-fanart', createdBy: MOD }),
      ),
    );
  });

  it('un canal `mods` sigue funcionando con moderadores antiguos en moderatorIds', async () => {
    // `moderatorIds` puede conservar a alguien que ya no está en
    // `memberIds` (datos de antes de limpiar al expulsar). El chat
    // se crea solo con el equipo ACTIVO; la regla no puede exigir
    // que estén todos los moderatorIds, pero sí que no haya nadie
    // de fuera y que el dueño esté dentro.
    await sembrar(async (f) => {
      await updateDoc(doc(f, 'clubs', 'club-de-frieren'), {
        moderatorIds: [MOD, 'moderador-viejo'],
      });
    });

    const chatRef = doc(collection(db(DUENO), 'chats'));
    await assertSucceeds(
      setDoc(
        chatRef,
        nuevoChatCanal(chatRef.id, [DUENO, MOD], { channelId: 'mods' }),
      ),
    );

    await assertSucceeds(
      setDoc(
        doc(db(DUENO), 'clubs', 'club-de-frieren', 'channels', 'mods'),
        nuevoCanal('mods', { visibility: 'mods', chatId: chatRef.id }),
      ),
    );
  });

  it('un canal `mods` no puede enlazar un chat con un miembro normal', async () => {
    await sembrar(async (f) => {
      await setDoc(
        doc(f, 'chats', 'chat-mods'),
        nuevoChatCanal('chat-mods', [DUENO, MOD, BOB], { channelId: 'mods' }),
      );
    });

    await assertFails(
      setDoc(
        doc(db(DUENO), 'clubs', 'club-de-frieren', 'channels', 'mods'),
        nuevoCanal('mods', { visibility: 'mods', chatId: 'chat-mods' }),
      ),
    );
  });

  it('no se puede crear el chat de un canal con alguien de fuera del club', async () => {
    // Ojo: al crear el chat todavía no existe el canal, así que
    // "todos los miembros" es indistinguible de un canal público.
    // Lo que sí se puede comprobar aquí es que no entre un tercero;
    // que un canal `mods` no lleve miembros normales lo comprueba
    // la regla de creación del CANAL (test de arriba).
    await assertFails(
      setDoc(
        doc(collection(db(DUENO), 'chats')),
        nuevoChatCanal('chat-mods', [DUENO, MOD, CARA], { channelId: 'mods' }),
      ),
    );
  });

  it('no se puede enlazar un chat con gente de fuera del club', async () => {
    await sembrar(async (f) => {
      await setDoc(
        doc(f, 'chats', 'chat-teorias'),
        nuevoChatCanal('chat-teorias', [DUENO, MOD, BOB, CARA], {
          channelId: 'teorias',
        }),
      );
    });

    await assertFails(
      setDoc(
        doc(db(DUENO), 'clubs', 'club-de-frieren', 'channels', 'teorias'),
        nuevoCanal('teorias'),
      ),
    );
  });

  it('no se puede enlazar un chat que no es de ese canal', async () => {
    await sembrar(async (f) => {
      await setDoc(
        doc(f, 'chats', 'chat-teorias'),
        nuevoChatCanal('chat-teorias', [DUENO, MOD, BOB], {
          channelId: 'otro-canal',
        }),
      );
    });

    await assertFails(
      setDoc(
        doc(db(DUENO), 'clubs', 'club-de-frieren', 'channels', 'teorias'),
        nuevoCanal('teorias'),
      ),
    );
  });

  it('un moderador SIN permiso de canales NO puede crearlos', async () => {
    // El club no tiene 'moderadorGestionaCanales' concedido.
    await assertFails(
      setDoc(
        doc(db(MOD), 'clubs', 'club-de-frieren', 'channels', 'fanart'),
        nuevoCanal('fanart', { chatId: 'chat-fanart', createdBy: MOD }),
      ),
    );
  });

  it('un miembro normal NO puede', async () => {
    await assertFails(
      setDoc(doc(db(BOB), 'clubs', 'club-de-frieren', 'channels', 'teorias'), nuevoCanal('teorias')),
    );
  });

  it('y un ajeno tampoco', async () => {
    await assertFails(
      setDoc(doc(db(ALICE), 'clubs', 'club-de-frieren', 'channels', 'teorias'), nuevoCanal('teorias')),
    );
  });

  it('el slug tiene que ser válido', async () => {
    await assertFails(
      setDoc(
        doc(db(DUENO), 'clubs', 'club-de-frieren', 'channels', 'Teorias Locas'),
        nuevoCanal('Teorias Locas'),
      ),
    );
  });

  it('la visibilidad tiene que ser válida', async () => {
    await assertFails(
      setDoc(
        doc(db(DUENO), 'clubs', 'club-de-frieren', 'channels', 'teorias'),
        nuevoCanal('teorias', { visibility: 'todos' }),
      ),
    );
  });

  it('un moderador de OTRO club no gestiona canales ajenos', async () => {
    // BOB es moderador en One Piece, pero en Frieren es un
    // miembro normal: su rol de allí no le da nada aquí.
    await sembrar(async (f) => {
      await setDoc(doc(f, 'clubs', 'club-de-one-piece'), nuevoClub({
        slug: 'club-de-one-piece',
        name: 'One Piece',
        accessType: 'public',
        ownerId: CARA,
        moderatorIds: [BOB],
        memberIds: [CARA, BOB],
        members: {
          [CARA]: { uid: CARA, role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
          [BOB]: { uid: BOB, role: 'moderator', joinedAt: '2026-01-02T00:00:00.000Z' },
        },
        memberCount: 2,
        chatId: 'chat-club-2',
      }));
    });

    await assertFails(
      setDoc(doc(db(BOB), 'clubs', 'club-de-frieren', 'channels', 'teorias'), nuevoCanal('teorias')),
    );
  });
});

// ── MIGRACIÓN DEL GENERAL ────────────────────────────

describe('Migración del canal general', () => {
  it('cualquier miembro crea el general apuntando al chat histórico', async () => {
    await assertSucceeds(
      setDoc(doc(db(BOB), 'clubs', 'club-de-frieren', 'channels', 'general'), {
        id: 'general',
        clubId: 'club-de-frieren',
        chatId: 'chat-club-1',
        name: 'General',
        description: 'Conversación general del club.',
        type: 'text',
        visibility: 'all',
        spoiler: false,
        order: 0,
        createdBy: DUENO,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('pero NO apuntando a otro chat', async () => {
    await assertFails(
      setDoc(doc(db(BOB), 'clubs', 'club-de-frieren', 'channels', 'general'), {
        id: 'general',
        clubId: 'club-de-frieren',
        chatId: 'chat-inventado',
        name: 'General',
        description: '',
        type: 'text',
        visibility: 'all',
        spoiler: false,
        order: 0,
        createdBy: BOB,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('ni restringido', async () => {
    await assertFails(
      setDoc(doc(db(BOB), 'clubs', 'club-de-frieren', 'channels', 'general'), {
        id: 'general',
        clubId: 'club-de-frieren',
        chatId: 'chat-club-1',
        name: 'General',
        description: '',
        type: 'text',
        visibility: 'mods',
        spoiler: false,
        order: 0,
        createdBy: BOB,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  });
});

// ── LEER CANALES ─────────────────────────────────────

describe('Leer canales', () => {
  beforeEach(async () => {
    await sembrar(async (f) => {
      await setDoc(
        doc(f, 'clubs', 'club-de-frieren', 'channels', 'teorias'),
        nuevoCanal('teorias'),
      );
      await setDoc(
        doc(f, 'clubs', 'club-de-frieren', 'channels', 'coordinacion'),
        nuevoCanal('coordinacion', {
          chatId: 'chat-coordinacion',
          name: 'coordinacion',
          visibility: 'mods',
        }),
      );
    });
  });

  it('un miembro lista los canales', async () => {
    await assertSucceeds(getDocs(query(collection(db(BOB), 'clubs', 'club-de-frieren', 'channels'))));
  });

  it('un ajeno no lista los de un club privado', async () => {
    await assertFails(getDocs(query(collection(db(ALICE), 'clubs', 'club-de-frieren', 'channels'))));
  });

  it('pero sí los de uno público', async () => {
    await sembrar(async (f) => {
      await updateDoc(doc(f, 'clubs', 'club-de-frieren'), { accessType: 'public' });
    });

    await assertSucceeds(getDocs(query(collection(db(ALICE), 'clubs', 'club-de-frieren', 'channels'))));
  });

  it('un miembro NO lee la ficha de un canal restringido', async () => {
    await assertFails(getDoc(doc(db(BOB), 'clubs', 'club-de-frieren', 'channels', 'coordinacion')));
  });

  it('un moderador sí', async () => {
    await assertSucceeds(getDoc(doc(db(MOD), 'clubs', 'club-de-frieren', 'channels', 'coordinacion')));
  });
});

// ── EDITAR Y BORRAR ──────────────────────────────────

describe('Editar y borrar canales', () => {
  beforeEach(async () => {
    await sembrar(async (f) => {
      await setDoc(
        doc(f, 'clubs', 'club-de-frieren', 'channels', 'teorias'),
        nuevoCanal('teorias'),
      );
      await setDoc(
        doc(f, 'clubs', 'club-de-frieren', 'channels', 'general'),
        nuevoCanal('general', { chatId: 'chat-club-1', name: 'General', order: 0 }),
      );
    });
  });

  it('un moderador edita nombre y descripción, con permiso', async () => {
    await sembrar(async (f) => {
      // Los canales son configuración del club: un moderador
      // necesita que el propietario se lo conceda.
      await updateDoc(doc(f, 'clubs', 'club-de-frieren'), {
        permisos: { moderadorGestionaCanales: true },
      });
    });
    await assertSucceeds(
      updateDoc(doc(db(MOD), 'clubs', 'club-de-frieren', 'channels', 'teorias'), {
        name: 'Teorías locas',
        description: 'Solo teorías con pruebas.',
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('un miembro normal NO edita', async () => {
    await assertFails(
      updateDoc(doc(db(BOB), 'clubs', 'club-de-frieren', 'channels', 'teorias'), {
        name: 'hackeado',
      }),
    );
  });

  it('nadie cambia el chat del canal por la vía de editar', async () => {
    await assertFails(
      updateDoc(doc(db(DUENO), 'clubs', 'club-de-frieren', 'channels', 'teorias'), {
        chatId: 'chat-club-1',
      }),
    );
  });

  it('el general no se puede restringir', async () => {
    await assertFails(
      updateDoc(doc(db(DUENO), 'clubs', 'club-de-frieren', 'channels', 'general'), {
        visibility: 'mods',
      }),
    );
  });

  it('un moderador borra un canal normal, con permiso', async () => {
    await sembrar(async (f) => {
      // Los canales son configuración del club: un moderador
      // necesita que el propietario se lo conceda.
      await updateDoc(doc(f, 'clubs', 'club-de-frieren'), {
        permisos: { moderadorGestionaCanales: true },
      });
    });
    await assertSucceeds(
      deleteDoc(doc(db(MOD), 'clubs', 'club-de-frieren', 'channels', 'teorias')),
    );
  });

  it('pero ni el propietario borra el general', async () => {
    await assertFails(
      deleteDoc(doc(db(DUENO), 'clubs', 'club-de-frieren', 'channels', 'general')),
    );
  });

  it('y un miembro no borra nada', async () => {
    await assertFails(
      deleteDoc(doc(db(BOB), 'clubs', 'club-de-frieren', 'channels', 'teorias')),
    );
  });
});

// ── MENSAJES Y ACCESO A CANALES RESTRINGIDOS ─────────

describe('Mensajes en canales restringidos', () => {
  beforeEach(async () => {
    await sembrar(async (f) => {
      await setDoc(
        doc(f, 'clubs', 'club-de-frieren', 'channels', 'coordinacion'),
        nuevoCanal('coordinacion', {
          chatId: 'chat-coordinacion',
          name: 'coordinacion',
          visibility: 'mods',
        }),
      );
      await setDoc(
        doc(f, 'chats', 'chat-coordinacion'),
        nuevoChatCanal('chat-coordinacion', [DUENO, MOD], { channelId: 'coordinacion' }),
      );
    });
  });

  it('un moderador escribe en el restringido', async () => {
    await assertSucceeds(
      setDoc(doc(collection(db(MOD), 'chats', 'chat-coordinacion', 'messages')), {
        chatId: 'chat-coordinacion',
        senderId: MOD,
        senderName: MOD,
        senderAvatar: '',
        body: 'Revisemos las solicitudes.',
        type: 'text',
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('un miembro normal NO escribe en él', async () => {
    await assertFails(
      setDoc(doc(collection(db(BOB), 'chats', 'chat-coordinacion', 'messages')), {
        chatId: 'chat-coordinacion',
        senderId: BOB,
        senderName: BOB,
        senderAvatar: '',
        body: 'Hola, ¿me oís?',
        type: 'text',
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('ni se auto-añade a su chat aunque el club sea público', async () => {
    await sembrar(async (f) => {
      await updateDoc(doc(f, 'clubs', 'club-de-frieren'), { accessType: 'public' });
    });

    await assertFails(
      updateDoc(doc(db(BOB), 'chats', 'chat-coordinacion'), {
        memberIds: [DUENO, MOD, BOB],
        hiddenFor: [],
      }),
    );
  });

  it('al ascender a moderador, entra en el chat restringido', async () => {
    // Es el segundo paso de `cambiarRol`: el club ya lo tiene en
    // `moderatorIds`, y ahora se le mete en los chats `mods`.
    await sembrar(async (f) => {
      await updateDoc(doc(f, 'clubs', 'club-de-frieren'), {
        moderatorIds: [MOD, BOB],
      });
    });

    await assertSucceeds(
      updateDoc(doc(db(BOB), 'chats', 'chat-coordinacion'), {
        memberIds: [DUENO, MOD, BOB],
        hiddenFor: [],
      }),
    );
  });

  it('al degradarlo, el dueño lo saca del chat restringido', async () => {
    await sembrar(async (f) => {
      await updateDoc(doc(f, 'clubs', 'club-de-frieren'), {
        moderatorIds: [MOD, BOB],
      });
      await updateDoc(doc(f, 'chats', 'chat-coordinacion'), {
        memberIds: [DUENO, MOD, BOB],
      });
      await updateDoc(doc(f, 'clubs', 'club-de-frieren'), {
        moderatorIds: [MOD],
      });
    });

    await assertSucceeds(
      updateDoc(doc(db(DUENO), 'chats', 'chat-coordinacion'), {
        memberIds: [DUENO, MOD],
      }),
    );
  });
});
