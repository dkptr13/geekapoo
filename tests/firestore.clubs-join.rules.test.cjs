/**
 * Regresión: unirse a un club PÚBLICO.
 *
 * La rama de «entrar en club público» de `firestore.rules`
 * tenía el `hasAll` al revés (los miembros viejos debían
 * contener a los nuevos), así que NINGÚN «Unirme» pasaba:
 * todo join público acababa en `permission-denied`.
 *
 * Aquí se reproduce la escritura EXACTA que hace
 * `anadirMiembro` (transacción club + chat) y se comprueba
 * que pasa, además de los casos negativos.
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
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  runTransaction,
} = require('firebase/firestore');

const fs = require('fs');
const path = require('path');

const RULES = fs.readFileSync(
  path.join(__dirname, '..', 'firestore.rules'),
  'utf8',
);
const PROJECT = 'demo-geekapoo-clubs-join';

const ALICE = 'alice';
const DUENO = 'dueno';

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

function nuevoClubPublico() {
  return {
    slug: 'club-test',
    name: 'Club Test',
    description: 'Descripcion larga de prueba para el club.',
    category: 'anime-manga',
    coverUrl: '',
    iconUrl: '',
    rules: '',
    accessType: 'public',
    ownerId: DUENO,
    moderatorIds: [],
    memberIds: [DUENO],
    members: {
      [DUENO]: { uid: DUENO, role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
    },
    memberCount: 1,
    chatId: 'chat-test-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function nuevoChatClub() {
  return {
    type: 'club',
    name: 'Club Test',
    slug: 'club-test',
    category: 'anime-manga',
    avatar: '',
    coverUrl: '',
    ownerId: DUENO,
    memberIds: [DUENO],
    hiddenFor: [],
    lastMessage: 'Club creado por dueno',
    lastMessageAt: '2026-01-01T00:00:00.000Z',
    lastMessageSenderId: DUENO,
    readAt: {},
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
  await crearUsuario(DUENO);
  await sembrar(async (f) => {
    await setDoc(doc(f, 'clubs', 'club-test'), nuevoClubPublico());
    await setDoc(doc(f, 'chats', 'chat-test-1'), nuevoChatClub());
  });
});

describe('Unirse a un club público', () => {
  // La escritura exacta de `anadirMiembro`: una transacción que
  // toca la ficha del club Y el chat grupal a la vez.
  it('la transacción completa (club + chat) pasa', async () => {
    const adb = db(ALICE);
    await assertSucceeds(
      runTransaction(adb, async (tx) => {
        const clubRef = doc(adb, 'clubs', 'club-test');
        const snap = await tx.get(clubRef);
        if (!snap.exists()) throw new Error('El club ya no existe.');

        const data = snap.data();
        const miembros = { ...(data.members ?? {}) };
        const chatId = data.chatId;
        if (miembros[ALICE]) return;

        miembros[ALICE] = {
          uid: ALICE,
          role: 'member',
          joinedAt: new Date().toISOString(),
        };
        const uids = Object.keys(miembros);

        tx.update(clubRef, {
          members: miembros,
          memberIds: uids,
          memberCount: uids.length,
          updatedAt: serverTimestamp(),
        });
        tx.update(doc(adb, 'chats', chatId), {
          memberIds: arrayUnion(ALICE),
          hiddenFor: arrayRemove(ALICE),
        });
      }),
    );
  });

  it('quien ya es miembro no puede volver a entrar por esta vía', async () => {
    await sembrar(async (f) => {
      await updateDoc(doc(f, 'clubs', 'club-test'), {
        memberIds: [DUENO, ALICE],
        members: {
          [DUENO]: { uid: DUENO, role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
          [ALICE]: { uid: ALICE, role: 'member', joinedAt: '2026-01-02T00:00:00.000Z' },
        },
        memberCount: 2,
      });
    });

    await assertFails(
      updateDoc(doc(db(ALICE), 'clubs', 'club-test'), {
        memberIds: [DUENO, ALICE],
        members: {
          [DUENO]: { uid: DUENO, role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
          [ALICE]: { uid: ALICE, role: 'member', joinedAt: '2026-01-02T00:00:00.000Z' },
        },
        memberCount: 2,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('en un club privado esta vía no cuela', async () => {
    await sembrar(async (f) => {
      await updateDoc(doc(f, 'clubs', 'club-test'), { accessType: 'private' });
    });

    await assertFails(
      updateDoc(doc(db(ALICE), 'clubs', 'club-test'), {
        memberIds: [DUENO, ALICE],
        members: {
          [DUENO]: { uid: DUENO, role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
          [ALICE]: { uid: ALICE, role: 'member', joinedAt: '2026-01-02T00:00:00.000Z' },
        },
        memberCount: 2,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('ni colarse como moderador al entrar', async () => {
    await assertFails(
      updateDoc(doc(db(ALICE), 'clubs', 'club-test'), {
        memberIds: [DUENO, ALICE],
        members: {
          [DUENO]: { uid: DUENO, role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
          [ALICE]: { uid: ALICE, role: 'moderator', joinedAt: '2026-01-02T00:00:00.000Z' },
        },
        memberCount: 2,
        updatedAt: serverTimestamp(),
      }),
    );
  });
});
