/**
 * Pruebas de las reglas de los CLUBES.
 *
 * Va aparte porque las reglas de clubes son un bloque nuevo, y
 * aquí se comprueba justo lo que el enunciado pide:
 *
 *   1. Un usuario puede crear un club y queda como propietario.
 *   2. Otro usuario NO puede crear un club con un slug que ya
 *      existe, ni duplicar el mapa de miembros con gente
 *      dentro.
 *   3. Un visitante sin sesión NO puede leer los clubes
 *      privados.
 *   4. Un usuario ajeno NO puede leer los mensajes del chat de
 *      un club privado.
 *   5. Un usuario normal NO puede darse un rol escribiendo su
 *      propio uid en el mapa de miembros.
 *   6. Un moderador SÝ puede expulsar (tocar la ficha de otro)
 *      pero NO puede cambiarse a sí mismo.
 *   7. Un moderador NO puede borrar mensajes de un club ajeno.
 *   8. El propietario SÝ puede borrar mensajes de su club.
 *   9. Nadie puede concederse la propiedad del club a mano.
 *
 * Se ejecuta con `npm run test:rules`.
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
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} = require('firebase/firestore');

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const RULES = fs.readFileSync(
  path.join(__dirname, '..', 'firestore.rules'),
  'utf8',
);
const PROJECT = 'demo-geekapoo-clubs';

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

/** Escribe saltandose las reglas, para sembrar el escenario. */
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

/** Un club tal cual lo escribe `crearClub`. */
function nuevoClub(dueno, extra = {}) {
  return {
    slug: 'club-de-frieren',
    name: 'Club de Frieren',
    description: 'Charlamos del viaje de Frieren y sus compañeros.',
    category: 'anime-manga',
    coverUrl: '',
    iconUrl: '',
    rules: 'Respeta a los demás.',
    accessType: 'private',
    ownerId: dueno,
    moderatorIds: [],
    memberIds: [dueno],
    members: {
      [dueno]: { uid: dueno, role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
    },
    memberCount: 1,
    chatId: 'chat-club-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  };
}

/** Un chat grupal de club. */
function nuevoChatClub(dueno, miembros, slug, extra = {}) {
  return {
    type: 'club',
    name: 'Club de Frieren',
    slug,
    category: 'anime-manga',
    avatar: '',
    coverUrl: '',
    ownerId: dueno,
    memberIds: miembros,
    hiddenFor: [],
    lastMessage: '',
    lastMessageAt: '2026-01-01T00:00:00.000Z',
    lastMessageSenderId: dueno,
    readAt: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  };
}

/** Un mensaje del chat de un club. */
function nuevoMensaje(autor, chatId, extra = {}) {
  return {
    chatId,
    senderId: autor,
    senderName: autor,
    senderAvatar: '',
    body: 'Hola a todos',
    type: 'text',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...extra,
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
  testEnv.clearFirestore();
  await crearUsuario(ALICE);
  await crearUsuario(BOB);
  await crearUsuario(CARA);
  await crearUsuario(DUENO);
  await crearUsuario(MOD);
});

// ╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝
// CREAR UN CLUB
// ╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝

describe('Crear un club', () => {
  // El club ya no puede nacer apuntando a un `chatId` inventado:
  // la regla exige que el chat exista, sea de tipo `club`, tenga el
  // mismo slug y pertenezca al creador. El chat se siembra aquí
  // como lo dejaría `crearClub` antes de escribir la ficha.
  beforeEach(async () => {
    await sembrar(async (f) => {
      await setDoc(
        doc(f, 'chats', 'chat-club-1'),
        nuevoChatClub(ALICE, [ALICE], 'club-de-frieren'),
      );
    });
  });

  it('un usuario normal puede crear un club y queda como propietario', async () => {
    const club = nuevoClub(ALICE);

    await assertSucceeds(
      setDoc(doc(db(ALICE), 'clubs', club.slug), club),
    );
  });

  it('pero no puede meter a más gente dentro al crearlo', async () => {
    // Si se pudiera, cualquiera se inventaría un club con los
    // miembros que quisiera, sin que nadie lo haya pedido.
    const club = nuevoClub(ALICE, {
      memberIds: [ALICE, BOB],
      members: {
        [ALICE]: { uid: ALICE, role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
        [BOB]: { uid: BOB, role: 'member', joinedAt: '2026-01-01T00:00:00.000Z' },
      },
      memberCount: 2,
    });

    await assertFails(setDoc(doc(db(ALICE), 'clubs', club.slug), club));
  });

  it('ni nombrarse moderador en lugar de propietario', async () => {
    const club = nuevoClub(ALICE, {
      members: {
        [ALICE]: { uid: ALICE, role: 'moderator', joinedAt: '2026-01-01T00:00:00.000Z' },
      },
    });

    await assertFails(setDoc(doc(db(ALICE), 'clubs', club.slug), club));
  });

  it('ni crearlo con el id de otro porque el ownerId no cuadra', async () => {
    const club = nuevoClub(ALICE, { ownerId: BOB });

    await assertFails(setDoc(doc(db(ALICE), 'clubs', club.slug), club));
  });

  it('el id del documento tiene que ser el slug', async () => {
    const club = nuevoClub(ALICE);

    await assertFails(setDoc(doc(db(ALICE), 'clubs', 'otra-cosa'), club));
  });

  it('un slug con mayúsculas no se acepta', async () => {
    const club = nuevoClub(ALICE, { slug: 'Club-De-Frieren' });

    await assertFails(setDoc(doc(db(ALICE), 'clubs', club.slug), club));
  });

  it('y no puede nacer con moderadores inventados', async () => {
    const club = nuevoClub(ALICE, { moderatorIds: [BOB] });

    await assertFails(setDoc(doc(db(ALICE), 'clubs', club.slug), club));
  });

  it('una descripción demasiado corta no pasa', async () => {
    const club = nuevoClub(ALICE, { description: 'Hola' });

    await assertFails(setDoc(doc(db(ALICE), 'clubs', club.slug), club));
  });

  it('y sin sesión no se puede crear nada', async () => {
    const club = nuevoClub(ALICE);

    await assertFails(setDoc(doc(anon(), 'clubs', club.slug), club));
  });
});

// ╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝
// LEER CLUBES
// ╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝

describe('Quién puede leer un club', () => {
  const slug = 'club-de-frieren';

  beforeEach(async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'clubs', slug), nuevoClub(DUENO));
      await setDoc(doc(f, 'chats', 'chat-club-1'), nuevoChatClub(DUENO, [DUENO], slug));
    });
  });

  it('un visitante sin sesión NO puede leer un club privado', async () => {
    await assertFails(getDoc(doc(anon(), 'clubs', slug)));
  });

  it('un usuario que no es miembro tampoco', async () => {
    await assertFails(getDoc(doc(db(ALICE), 'clubs', slug)));
  });

  it('el propietario sí lee su club', async () => {
    await assertSucceeds(getDoc(doc(db(DUENO), 'clubs', slug)));
  });

  it('un integrante cualquiera también', async () => {
    await sembrar(async (f) => {
      await updateDoc(doc(f, 'clubs', slug), {
        memberIds: [DUENO, ALICE],
        members: {
          [DUENO]: { uid: DUENO, role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
          [ALICE]: { uid: ALICE, role: 'member', joinedAt: '2026-01-01T00:00:00.000Z' },
        },
        memberCount: 2,
      });
      await updateDoc(doc(f, 'chats', 'chat-club-1'), {
        memberIds: [DUENO, ALICE],
      });
    });

    await assertSucceeds(getDoc(doc(db(ALICE), 'clubs', slug)));
  });

  it('un club PÚBLICO lo lee cualquiera con sesión', async () => {
    await sembrar(async (f) => {
      await updateDoc(doc(f, 'clubs', slug), { accessType: 'public' });
    });

    await assertSucceeds(getDoc(doc(db(ALICE), 'clubs', slug)));
  });
});

// ╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝
// MENSAJES DEL CHAT DEL CLUB
// ╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝

describe('Mensajes del chat de un club', () => {
  beforeEach(async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'clubs', 'club-de-frieren'), nuevoClub(DUENO));
      await setDoc(
        doc(f, 'chats', 'chat-club-1'),
        nuevoChatClub(DUENO, [DUENO], 'club-de-frieren'),
      );
    });
  });

  it('un miembro puede enviar un mensaje como sí mismo', async () => {
    await assertSucceeds(
      setDoc(doc(collection(db(DUENO), 'chats', 'chat-club-1', 'messages')), {
        ...nuevoMensaje(DUENO, 'chat-club-1'),
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('pero NO puede enviarlo como otra persona', async () => {
    await assertFails(
      setDoc(doc(collection(db(DUENO), 'chats', 'chat-club-1', 'messages')), {
        ...nuevoMensaje(ALICE, 'chat-club-1'),
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('un usuario ajeno NO puede leer los mensajes de un club privado', async () => {
    await sembrar(async (f) => {
      await setDoc(
        doc(f, 'chats', 'chat-club-1', 'messages', 'm1'),
        nuevoMensaje(DUENO, 'chat-club-1'),
      );
    });

    await assertFails(getDocs(query(collection(db(ALICE), 'chats', 'chat-club-1', 'messages'))));
  });

  it('el propietario sí lee el historial de su club', async () => {
    await sembrar(async (f) => {
      await setDoc(
        doc(f, 'chats', 'chat-club-1', 'messages', 'm1'),
        nuevoMensaje(DUENO, 'chat-club-1'),
      );
    });

    await assertSucceeds(
      getDocs(query(collection(db(DUENO), 'chats', 'chat-club-1', 'messages'))),
    );
  });
});

// ╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝
// MODERACIÓN DE MENSAJES
// ╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝

describe('Moderación de mensajes en el chat de un club', () => {
  beforeEach(async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'clubs', 'club-de-frieren'), nuevoClub(DUENO, {
        moderatorIds: [MOD],
        memberIds: [DUENO, MOD, CARA],
        members: {
          [DUENO]: { uid: DUENO, role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
          [MOD]: { uid: MOD, role: 'moderator', joinedAt: '2026-01-02T00:00:00.000Z' },
          [CARA]: { uid: CARA, role: 'member', joinedAt: '2026-01-03T00:00:00.000Z' },
        },
        memberCount: 3,
      }));
      await setDoc(
        doc(f, 'chats', 'chat-club-1'),
        nuevoChatClub(DUENO, [DUENO, MOD, CARA], 'club-de-frieren'),
      );
      await setDoc(
        doc(f, 'chats', 'chat-club-1', 'messages', 'm1'),
        nuevoMensaje(CARA, 'chat-club-1'),
      );
    });
  });

  it('el moderador puede vaciar el contenido de un mensaje', async () => {
    await assertSucceeds(
      updateDoc(doc(db(MOD), 'chats', 'chat-club-1', 'messages', 'm1'), {
        body: '',
        deletedForEveryone: true,
        deletedAt: serverTimestamp(),
        deletedBy: MOD,
        deletedByMod: true,
      }),
    );
  });

  it('pero NO puede restaurar el texto que borró otro', async () => {
    // Si pudiera rellenar el body, el borrado de un moderador
    // no significaría nada.
    await assertFails(
      updateDoc(doc(db(MOD), 'chats', 'chat-club-1', 'messages', 'm1'), {
        body: 'Texto inventado',
        deletedForEveryone: true,
        deletedAt: serverTimestamp(),
        deletedBy: MOD,
        deletedByMod: true,
      }),
    );
  });

  it('ni cambiar quién escribió el mensaje', async () => {
    await assertFails(
      updateDoc(doc(db(MOD), 'chats', 'chat-club-1', 'messages', 'm1'), {
        body: '',
        deletedForEveryone: true,
        deletedAt: serverTimestamp(),
        deletedBy: MOD,
        deletedByMod: true,
        senderId: MOD,
      }),
    );
  });

  it('un miembro normal NO puede tocar los mensajes de nadie', async () => {
    await assertFails(
      updateDoc(doc(db(CARA), 'chats', 'chat-club-1', 'messages', 'm1'), {
        body: '',
        deletedForEveryone: true,
        deletedAt: serverTimestamp(),
        deletedBy: CARA,
        deletedByMod: true,
      }),
    );
  });

  it('y un moderador de OTRO club tampoco', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'clubs', 'club-de-one-piece'), nuevoClub(DUENO, {
        slug: 'club-de-one-piece',
        name: 'One Piece',
        moderatorIds: [ALICE],
        memberIds: [DUENO, ALICE],
        members: {
          [DUENO]: { uid: DUENO, role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
          [ALICE]: { uid: ALICE, role: 'moderator', joinedAt: '2026-01-02T00:00:00.000Z' },
        },
        memberCount: 2,
      }));
    });

    // ALICE es moderadora, pero de otro club. El chat de Frieren
    // no es el suyo.
    await assertFails(
      updateDoc(doc(db(ALICE), 'chats', 'chat-club-1', 'messages', 'm1'), {
        body: '',
        deletedForEveryone: true,
        deletedAt: serverTimestamp(),
        deletedBy: ALICE,
        deletedByMod: true,
      }),
    );
  });
});

// ╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝
// MIEMBROS Y ROLES
// ╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝

describe('Miembros y roles de un club', () => {
  beforeEach(async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'clubs', 'club-de-frieren'), nuevoClub(DUENO, {
        moderatorIds: [MOD],
        memberIds: [DUENO, MOD, CARA],
        members: {
          [DUENO]: { uid: DUENO, role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
          [MOD]: { uid: MOD, role: 'moderator', joinedAt: '2026-01-02T00:00:00.000Z' },
          [CARA]: { uid: CARA, role: 'member', joinedAt: '2026-01-03T00:00:00.000Z' },
        },
        memberCount: 3,
      }));
      await setDoc(
        doc(f, 'chats', 'chat-club-1'),
        nuevoChatClub(DUENO, [DUENO, MOD, CARA], 'club-de-frieren'),
      );
    });
  });

  const conMiembros = (mapa) => ({
    members: mapa,
    memberIds: Object.keys(mapa),
    memberCount: Object.keys(mapa).length,
    updatedAt: serverTimestamp(),
  });

  it('un usuario normal NO puede colarse en el mapa de miembros', async () => {
    await assertFails(
      updateDoc(doc(db(ALICE), 'clubs', 'club-de-frieren'), conMiembros({
        [DUENO]: { uid: DUENO, role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
        [MOD]: { uid: MOD, role: 'moderator', joinedAt: '2026-01-02T00:00:00.000Z' },
        [CARA]: { uid: CARA, role: 'member', joinedAt: '2026-01-03T00:00:00.000Z' },
        [ALICE]: { uid: ALICE, role: 'member', joinedAt: '2026-01-04T00:00:00.000Z' },
      })),
    );
  });

  it('ni volverse moderador él solo', async () => {
    await assertFails(
      updateDoc(doc(db(MOD), 'clubs', 'club-de-frieren'), conMiembros({
        [DUENO]: { uid: DUENO, role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
        [MOD]: { uid: MOD, role: 'owner', joinedAt: '2026-01-02T00:00:00.000Z' },
        [CARA]: { uid: CARA, role: 'member', joinedAt: '2026-01-03T00:00:00.000Z' },
      })),
    );
  });

  it('el moderador PUEDE silenciar (tocar la ficha de otro)', async () => {
    // Silenciar no cambia la lista de miembros: solo la ficha.
    // Eso lo puede el equipo entero, siempre.
    await assertSucceeds(
      updateDoc(doc(db(MOD), 'clubs', 'club-de-frieren'), {
        members: {
          [DUENO]: { uid: DUENO, role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
          [MOD]: { uid: MOD, role: 'moderator', joinedAt: '2026-01-02T00:00:00.000Z' },
          [CARA]: { uid: CARA, role: 'member', joinedAt: '2026-01-03T00:00:00.000Z', mutedUntil: '2026-12-31T00:00:00.000Z' },
        },
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('pero NO puede expulsar a un miembro', async () => {
    // Expulsar quita a alguien de la lista de miembros, y eso
    // es del dueño o de un admin con el permiso concedido.
    await assertFails(
      updateDoc(doc(db(MOD), 'clubs', 'club-de-frieren'), conMiembros({
        [DUENO]: { uid: DUENO, role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
        [MOD]: { uid: MOD, role: 'moderator', joinedAt: '2026-01-02T00:00:00.000Z' },
      })),
    );
  });

  it('un admin SI puede expulsar si el propietario le da el permiso', async () => {
    await sembrar(async (f) => {
      // Un admin es un miembro del club: sin estar en 'memberIds'
      // las reglas no le dan ningún poder (el club entero se
      // apoya en la pertenencia).
      await updateDoc(doc(f, 'clubs', 'club-de-frieren'), {
        adminIds: [ALICE],
        permisos: { adminExpulsa: true },
        memberIds: [DUENO, MOD, CARA, ALICE],
        members: {
          [DUENO]: { uid: DUENO, role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
          [MOD]: { uid: MOD, role: 'moderator', joinedAt: '2026-01-02T00:00:00.000Z' },
          [CARA]: { uid: CARA, role: 'member', joinedAt: '2026-01-03T00:00:00.000Z' },
          [ALICE]: { uid: ALICE, role: 'admin', joinedAt: '2026-01-04T00:00:00.000Z' },
        },
        memberCount: 4,
      });
    });
    await assertSucceeds(
      updateDoc(doc(db(ALICE), 'clubs', 'club-de-frieren'), conMiembros({
        [DUENO]: { uid: DUENO, role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
        [MOD]: { uid: MOD, role: 'moderator', joinedAt: '2026-01-02T00:00:00.000Z' },
        [ALICE]: { uid: ALICE, role: 'admin', joinedAt: '2026-01-04T00:00:00.000Z' },
      })),
    );
  });

  it('y un admin SIN ese permiso no puede', async () => {
    await sembrar(async (f) => {
      await updateDoc(doc(f, 'clubs', 'club-de-frieren'), {
        adminIds: [ALICE],
        memberIds: [DUENO, MOD, CARA, ALICE],
        members: {
          [DUENO]: { uid: DUENO, role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
          [MOD]: { uid: MOD, role: 'moderator', joinedAt: '2026-01-02T00:00:00.000Z' },
          [CARA]: { uid: CARA, role: 'member', joinedAt: '2026-01-03T00:00:00.000Z' },
          [ALICE]: { uid: ALICE, role: 'admin', joinedAt: '2026-01-04T00:00:00.000Z' },
        },
        memberCount: 4,
      });
    });
    await assertFails(
      updateDoc(doc(db(ALICE), 'clubs', 'club-de-frieren'), conMiembros({
        [DUENO]: { uid: DUENO, role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
        [MOD]: { uid: MOD, role: 'moderator', joinedAt: '2026-01-02T00:00:00.000Z' },
        [ALICE]: { uid: ALICE, role: 'admin', joinedAt: '2026-01-04T00:00:00.000Z' },
      })),
    );
  });

  it('pero NO puede tocar la configuración del club', async () => {
    await assertFails(
      updateDoc(doc(db(MOD), 'clubs', 'club-de-frieren'), {
        name: 'Club renombrado por el moderador',
      }),
    );
  });

  it('el moderador puede cambiar el rol en el espejo, pero no la autoridad', async () => {
    // El espejo cambia (escribe members[CARA].role = moderator)...
    await assertSucceeds(
      updateDoc(doc(db(MOD), 'clubs', 'club-de-frieren'), conMiembros({
        [DUENO]: { uid: DUENO, role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
        [MOD]: { uid: MOD, role: 'moderator', joinedAt: '2026-01-02T00:00:00.000Z' },
        [CARA]: { uid: CARA, role: 'moderator', joinedAt: '2026-01-03T00:00:00.000Z' },
      })),
    );
    // ...pero moderatorIds NO cambia (no estÃ¡ en claves permitidas).
    await assertFails(
      updateDoc(doc(db(MOD), 'clubs', 'club-de-frieren'), {
        moderatorIds: [DUENO, MOD, CARA],
      }),
    );
  });

  it('ni cambiar la propiedad', async () => {
    await assertFails(
      updateDoc(doc(db(MOD), 'clubs', 'club-de-frieren'), { ownerId: MOD }),
    );
  });

  it('el propietario SÝ puede transferir la propiedad', async () => {
    await assertSucceeds(
      updateDoc(doc(db(DUENO), 'clubs', 'club-de-frieren'), conMiembros({
        [DUENO]: { uid: DUENO, role: 'moderator', joinedAt: '2026-01-01T00:00:00.000Z' },
        [CARA]: { uid: CARA, role: 'owner', joinedAt: '2026-01-03T00:00:00.000Z' },
        [MOD]: { uid: MOD, role: 'moderator', joinedAt: '2026-01-02T00:00:00.000Z' },
      })),
    );
  });

  it('y cambiar el nombre y las normas', async () => {
    await assertSucceeds(
      updateDoc(doc(db(DUENO), 'clubs', 'club-de-frieren'), {
        name: 'Club de Frieren y compañía',
        rules: 'Nada de spoilers sin avisar.',
      }),
    );
  });

  // ── Ataques de suplantación de rol ───────────────────
  // El moderador intenta intercambiar las fichas del
  // propietario y un miembro: DUENO pasa a member, CARA a
  // owner. Como la autoridad real está en moderatorIds (no en
  // members[uid].role), la rama del moderador no incluye
  // moderatorIds y la escritura falla.
  it('el moderador puede intercambiar fichas en el espejo, pero no la autoridad', async () => {
    await assertSucceeds(
      updateDoc(doc(db(MOD), 'clubs', 'club-de-frieren'), conMiembros({
        [DUENO]: { uid: DUENO, role: 'member', joinedAt: '2026-01-01T00:00:00.000Z' },
        [CARA]: { uid: CARA, role: 'owner', joinedAt: '2026-01-03T00:00:00.000Z' },
        [MOD]: { uid: MOD, role: 'moderator', joinedAt: '2026-01-02T00:00:00.000Z' },
      })),
    );
    // moderatorIds no se puede tocar desde la rama del moderador
    await assertFails(
      updateDoc(doc(db(MOD), 'clubs', 'club-de-frieren'), {
        moderatorIds: [CARA, MOD],
      }),
    );
  });

  // El moderador intenta expulsar al propietario.
  // duenoSigueDentro() en la rama del moderador lo impide.
  it('el moderador NO puede expulsar al propietario', async () => {
    await assertFails(
      updateDoc(doc(db(MOD), 'clubs', 'club-de-frieren'), conMiembros({
        [MOD]: { uid: MOD, role: 'moderator', joinedAt: '2026-01-02T00:00:00.000Z' },
        [CARA]: { uid: CARA, role: 'member', joinedAt: '2026-01-03T00:00:00.000Z' },
      })),
    );
  });

  // ── Altas directas ───────────────────────────────────
  // Las altas solo las hacen `unirseClubPublico`,
  // `responderSolicitudClub` y `levantarSancionClub`. Si el
  // propietario pudiera añadir desde el navegador, la persona
  // entraría sin consentimiento y la medalla de club unido se
  // dispararía sin una acción real.
  it('el propietario NO puede dar de alta a nadie desde el cliente', async () => {
    await assertFails(
      updateDoc(doc(db(DUENO), 'clubs', 'club-de-frieren'), conMiembros({
        [DUENO]: { uid: DUENO, role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
        [MOD]: { uid: MOD, role: 'moderator', joinedAt: '2026-01-02T00:00:00.000Z' },
        [CARA]: { uid: CARA, role: 'member', joinedAt: '2026-01-03T00:00:00.000Z' },
        [ALICE]: { uid: ALICE, role: 'member', joinedAt: '2026-01-04T00:00:00.000Z' },
      })),
    );
  });

  it('un admin no puede colar a alguien mientras expulsa a otro', async () => {
    await sembrar(async (f) => {
      await updateDoc(doc(f, 'clubs', 'club-de-frieren'), {
        adminIds: [ALICE],
        permisos: { adminExpulsa: true },
        memberIds: [DUENO, MOD, CARA, ALICE],
        members: {
          [DUENO]: { uid: DUENO, role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
          [MOD]: { uid: MOD, role: 'moderator', joinedAt: '2026-01-02T00:00:00.000Z' },
          [CARA]: { uid: CARA, role: 'member', joinedAt: '2026-01-03T00:00:00.000Z' },
          [ALICE]: { uid: ALICE, role: 'admin', joinedAt: '2026-01-04T00:00:00.000Z' },
        },
        memberCount: 4,
      });
    });

    // Quita a CARA y mete a BOB en la misma escritura: el tamaño
    // baja en uno, pero hay una alta encubierta.
    await assertFails(
      updateDoc(doc(db(ALICE), 'clubs', 'club-de-frieren'), conMiembros({
        [DUENO]: { uid: DUENO, role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
        [MOD]: { uid: MOD, role: 'moderator', joinedAt: '2026-01-02T00:00:00.000Z' },
        [ALICE]: { uid: ALICE, role: 'admin', joinedAt: '2026-01-04T00:00:00.000Z' },
        [BOB]: { uid: BOB, role: 'member', joinedAt: '2026-01-05T00:00:00.000Z' },
      })),
    );
  });

  it('un club público ya no se auto-une desde el cliente', async () => {
    await sembrar(async (f) => {
      await updateDoc(doc(f, 'clubs', 'club-de-frieren'), { accessType: 'public' });
    });

    await assertFails(
      updateDoc(doc(db(ALICE), 'clubs', 'club-de-frieren'), conMiembros({
        [DUENO]: { uid: DUENO, role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
        [MOD]: { uid: MOD, role: 'moderator', joinedAt: '2026-01-02T00:00:00.000Z' },
        [CARA]: { uid: CARA, role: 'member', joinedAt: '2026-01-03T00:00:00.000Z' },
        [ALICE]: { uid: ALICE, role: 'member', joinedAt: '2026-01-04T00:00:00.000Z' },
      })),
    );
  });
});

// ╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝
// SALIR DEL CLUB
// ╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝

describe('Salir de un club', () => {
  beforeEach(async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'clubs', 'club-de-frieren'), nuevoClub(DUENO, {
        memberIds: [DUENO, CARA],
        members: {
          [DUENO]: { uid: DUENO, role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
          [CARA]: { uid: CARA, role: 'member', joinedAt: '2026-01-03T00:00:00.000Z' },
        },
        memberCount: 2,
      }));
      await setDoc(
        doc(f, 'chats', 'chat-club-1'),
        nuevoChatClub(DUENO, [DUENO, CARA], 'club-de-frieren'),
      );
    });
  });

  it('un miembro puede quitarse a sí mismo', async () => {
    await assertSucceeds(
      updateDoc(doc(db(CARA), 'clubs', 'club-de-frieren'), {
        members: {
          [DUENO]: { uid: DUENO, role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
        },
        memberIds: [DUENO],
        memberCount: 1,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('pero el PROPIETARIO no puede salir por esta vía', async () => {
    // Si pudiera, el club se quedaría sin nadie que lo administre.
    await assertFails(
      updateDoc(doc(db(DUENO), 'clubs', 'club-de-frieren'), {
        members: {
          [CARA]: { uid: CARA, role: 'member', joinedAt: '2026-01-03T00:00:00.000Z' },
        },
        memberIds: [CARA],
        memberCount: 1,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('y salirse tiene que quitar también el acceso al chat', async () => {
    await assertSucceeds(
      updateDoc(doc(db(CARA), 'chats', 'chat-club-1'), {
        memberIds: [DUENO],
        hiddenFor: arrayUnion(CARA),
      }),
    );
  });

  it('el propietario puede eliminar el club entero', async () => {
    await assertSucceeds(deleteDoc(doc(db(DUENO), 'clubs', 'club-de-frieren')));
  });

  it('pero un moderador no', async () => {
    await sembrar(async (f) => {
      await updateDoc(doc(f, 'clubs', 'club-de-frieren'), {
        members: {
          [DUENO]: { uid: DUENO, role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
          [CARA]: { uid: CARA, role: 'moderator', joinedAt: '2026-01-03T00:00:00.000Z' },
        },
      });
    });

    await assertFails(deleteDoc(doc(db(CARA), 'clubs', 'club-de-frieren')));
  });
});

// ╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝
// SOLICITUDES DE ACCESO
// ╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝

describe('Solicitudes de acceso a un club', () => {
  const slug = 'club-de-jujutsu';

  const solicitud = (de, extra = {}) => ({
    clubId: slug,
    clubName: 'Jujutsu Kaisen',
    fromId: de,
    fromName: de,
    fromAvatar: '',
    status: 'pending',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  });

  beforeEach(async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'clubs', slug), nuevoClub(DUENO, {
        slug,
        name: 'Jujutsu Kaisen',
        accessType: 'request',
      }));
      await setDoc(
        doc(f, 'chats', 'chat-club-1'),
        nuevoChatClub(DUENO, [DUENO], slug),
      );
    });
  });

  it('un usuario puede solicitar entrar', async () => {
    await assertSucceeds(
      setDoc(doc(db(ALICE), 'clubs', slug, 'requests', `${slug}_${ALICE}`), solicitud(ALICE)),
    );
  });

  it('y repetir la solicitud no crea un documento nuevo', async () => {
    // El id es determinista, así que la segunda vez pisa la
    // primera en lugar de llenar el club de duplicados.
    await assertSucceeds(
      setDoc(doc(db(ALICE), 'clubs', slug, 'requests', `${slug}_${ALICE}`), solicitud(ALICE)),
    );
    await assertSucceeds(
      setDoc(doc(db(ALICE), 'clubs', slug, 'requests', `${slug}_${ALICE}`), solicitud(ALICE)),
    );
  });

  it('no se puede pedir con el id de otra persona', async () => {
    await assertFails(
      setDoc(
        doc(db(ALICE), 'clubs', slug, 'requests', `${slug}_${ALICE}`),
        solicitud(BOB),
      ),
    );
  });

  it('ni colar un estado que no es "pendiente"', async () => {
    await assertFails(
      setDoc(
        doc(db(ALICE), 'clubs', slug, 'requests', `${slug}_${ALICE}`),
        solicitud(ALICE, { status: 'accepted' }),
      ),
    );
  });

  it('quien ya es miembro no puede solicitar nada', async () => {
    await assertFails(
      setDoc(
        doc(db(DUENO), 'clubs', slug, 'requests', `${slug}_${DUENO}`),
        solicitud(DUENO),
      ),
    );
  });

  it('y en un club PÚBLICO no hace falta solicitud: se entra directo', async () => {
    await sembrar(async (f) => {
      await updateDoc(doc(f, 'clubs', slug), { accessType: 'public' });
    });

    await assertFails(
      setDoc(
        doc(db(ALICE), 'clubs', slug, 'requests', `${slug}_${ALICE}`),
        solicitud(ALICE),
      ),
    );
  });

  it('ni el dueno puede aceptar la solicitud desde el cliente', async () => {
    // Aceptar la hace `responderSolicitudClub`, que ademas mete a
    // la persona en todos los chats publicos en la misma
    // transaccion. Si el cliente pudiera escribir `accepted`, se
    // quedaria a medias: miembro del club pero no de sus chats.
    await sembrar(async (f) => {
      await setDoc(
        doc(f, 'clubs', slug, 'requests', `${slug}_${ALICE}`),
        solicitud(ALICE),
      );
    });

    await assertFails(
      updateDoc(
        doc(db(DUENO), 'clubs', slug, 'requests', `${slug}_${ALICE}`),
        { status: 'accepted', respondedAt: serverTimestamp(), respondedBy: DUENO },
      ),
    );
  });

  it('pero quien la envió no puede aceptarla sola', async () => {
    await sembrar(async (f) => {
      await setDoc(
        doc(f, 'clubs', slug, 'requests', `${slug}_${ALICE}`),
        solicitud(ALICE),
      );
    });

    await assertFails(
      updateDoc(
        doc(db(ALICE), 'clubs', slug, 'requests', `${slug}_${ALICE}`),
        { status: 'accepted', respondedAt: serverTimestamp() },
      ),
    );
  });

  it('quien la envió SÝ puede cancelarla', async () => {
    await sembrar(async (f) => {
      await setDoc(
        doc(f, 'clubs', slug, 'requests', `${slug}_${ALICE}`),
        solicitud(ALICE),
      );
    });

    await assertSucceeds(
      updateDoc(
        doc(db(ALICE), 'clubs', slug, 'requests', `${slug}_${ALICE}`),
        { status: 'cancelled' },
      ),
    );
  });
});

// ╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝
// QUE NO SE HAYA ROTO NADA DE ANTES
// ╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝

describe('los chats de siempre siguen funcionando', () => {
  it('se puede crear un chat de grupo clásico', async () => {
    await assertSucceeds(
      setDoc(doc(collection(db(ALICE), 'chats')), {
        type: 'group',
        name: 'Grupo de prueba',
        avatar: '',
        code: 'GRP-AAAA-BBBB',
        ownerId: ALICE,
        memberIds: [ALICE],
        hiddenFor: [],
        lastMessage: '',
        lastMessageAt: serverTimestamp(),
        lastMessageSenderId: ALICE,
        readAt: {},
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('y los mensajes siguen llegando al grupo', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'chat-normal'), {
        type: 'group',
        name: 'Grupo de prueba',
        avatar: '',
        code: 'GRP-AAAA-BBBB',
        ownerId: ALICE,
        memberIds: [ALICE],
        hiddenFor: [],
        lastMessage: '',
        lastMessageAt: serverTimestamp(),
        lastMessageSenderId: ALICE,
        readAt: {},
        createdAt: serverTimestamp(),
      });
    });

    await assertSucceeds(
      setDoc(doc(collection(db(ALICE), 'chats', 'chat-normal', 'messages')), {
        chatId: 'chat-normal',
        senderId: ALICE,
        senderName: ALICE,
        senderAvatar: '',
        body: 'Hola',
        type: 'text',
        createdAt: serverTimestamp(),
      }),
    );
  });
});

