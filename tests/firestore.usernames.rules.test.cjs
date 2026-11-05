/**
 * Pruebas de las reglas del sistema de identidad:
 *   - `usernames` solo se lee con `get` y nadie lo escribe desde el cliente.
 *   - Un perfil nuevo exige una reserva hecha para ese uid.
 *   - El @usuario no se puede cambiar ni el dueño ni un admin.
 *   - El nombre visible respeta el plazo de 7 días.
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
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} = require('firebase/firestore');

const fs = require('fs');
const path = require('path');

const RULES = fs.readFileSync(
  path.join(__dirname, '..', 'firestore.rules'),
  'utf8',
);
const PROJECT = 'demo-geekapoo-usernames';

const ALICE = 'uid-alice';
const BOB = 'uid-bob';
const ADMIN = 'admin';
const NUEVO = 'nuevo';
const OTRO = 'otro';
const UID_ALICE = ALICE;
const UID_BOB = BOB;

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

function perfil(uid, username, extra = {}) {
  return {
    uid,
    username,
    displayName: 'Kapo',
    chatId: `GK-0000-${username.slice(0, 4).toUpperCase()}`,
    avatarUrl: '',
    role: 'user',
    bio: 'Comunidad geekapoo.es',
    lastSeen: 'En línea',
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
  await testEnv.clearFirestore();
  await sembrar(async (f) => {
    await setDoc(doc(f, 'users', UID_ALICE), perfil(UID_ALICE, 'kapo_25'));
    await setDoc(doc(f, 'users', UID_BOB), perfil(UID_BOB, 'animefan92'));
    await setDoc(
      doc(f, 'users', ADMIN),
      perfil(ADMIN, 'admin_kapo', { role: 'admin' }),
    );
    await setDoc(doc(f, 'usernames', 'kapo_25'), {
      uid: UID_ALICE,
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    await setDoc(doc(f, 'usernames', 'libre_25'), {
      uid: 'otro-uid',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    await setDoc(doc(f, 'usernames', 'nuevo_25'), {
      uid: NUEVO,
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    await setDoc(doc(f, 'usernameAliases', 'kapo.old'), {
      uid: UID_ALICE,
      username: 'kapo_25',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
  });
});

describe('Reservas de nombres', () => {
  it('el cliente no lee reservas directamente', async () => {
    await assertFails(getDoc(doc(anon(), 'usernames', 'libre_25')));
  });

  it('nadie puede listar el directorio de identificadores', async () => {
    await assertFails(getDocs(collection(db(BOB), 'usernames')));
  });

  it('nadie escribe ni modifica una reserva desde el cliente', async () => {
    await assertFails(
      setDoc(doc(db(BOB), 'usernames', 'robado'), {
        uid: UID_BOB,
        createdAt: serverTimestamp(),
      }),
    );
    await assertFails(
      setDoc(doc(db(BOB), 'usernames', 'libre_25'), {
        uid: UID_BOB,
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('los alias antiguos tampoco se leen desde el cliente', async () => {
    await assertFails(getDoc(doc(anon(), 'usernameAliases', 'kapo.old')));
    await assertFails(
      setDoc(doc(db(BOB), 'usernameAliases', 'otro'), {
        uid: UID_BOB,
        createdAt: serverTimestamp(),
      }),
    );
  });
});

describe('Crear perfil', () => {
  it('se crea con una reserva propia y datos válidos', async () => {
    await assertSucceeds(
      setDoc(doc(db(NUEVO), 'users', NUEVO), {
        ...perfil(NUEVO, 'nuevo_25'),
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('no se crea sin reserva', async () => {
    await assertFails(
      setDoc(doc(db(OTRO), 'users', OTRO), {
        ...perfil(OTRO, 'sin_reserva'),
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('no se crea con una reserva de otra cuenta', async () => {
    await assertFails(
      setDoc(doc(db(NUEVO), 'users', NUEVO), {
        ...perfil(NUEVO, 'kapo_25'),
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('rechaza identificadores con mayúsculas o formato inválido', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'usernames', 'mayus'), {
        uid: NUEVO,
        createdAt: '2026-01-01T00:00:00.000Z',
      });
    });
    await assertFails(
      setDoc(doc(db(NUEVO), 'users', NUEVO), {
        ...perfil(NUEVO, 'MaYus'),
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('rechaza un nombre visible de menos de 2 caracteres', async () => {
    await assertFails(
      setDoc(doc(db(NUEVO), 'users', NUEVO), {
        ...perfil(NUEVO, 'nuevo_25', { displayName: 'K' }),
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('rechaza un nombre visible de solo espacios', async () => {
    await assertFails(
      setDoc(doc(db(NUEVO), 'users', NUEVO), {
        ...perfil(NUEVO, 'nuevo_25', { displayName: '   ' }),
        createdAt: serverTimestamp(),
      }),
    );
  });
});

describe('Editar identidad', () => {
  it('el dueño no puede cambiar su @usuario', async () => {
    await assertFails(
      updateDoc(doc(db(ALICE), 'users', UID_ALICE), {
        username: 'otro_nombre',
      }),
    );
  });

  it('el admin tampoco puede cambiar el @usuario desde el cliente', async () => {
    await assertFails(
      updateDoc(doc(db(ADMIN), 'users', UID_ALICE), {
        username: 'otro_nombre',
      }),
    );
  });

  it('nadie puede escribir alias de identidad a mano', async () => {
    await assertFails(
      updateDoc(doc(db(ALICE), 'users', UID_ALICE), {
        usernameAliases: ['kapo.viejo'],
      }),
    );
  });

  it('el dueño cambia el nombre visible la primera vez', async () => {
    await assertSucceeds(
      updateDoc(doc(db(ALICE), 'users', UID_ALICE), {
        displayName: 'Kapo Moon',
        displayNameChangedAt: serverTimestamp(),
      }),
    );
  });

  it('no se puede cambiar dos veces seguidas', async () => {
    await sembrar(async (f) => {
      await updateDoc(doc(f, 'users', UID_ALICE), {
        displayNameChangedAt: Timestamp.now(),
      });
    });
    await assertFails(
      updateDoc(doc(db(ALICE), 'users', UID_ALICE), {
        displayName: 'Otro nombre',
        displayNameChangedAt: serverTimestamp(),
      }),
    );
  });

  it('cambiar el nombre sin marcar la fecha también falla', async () => {
    await assertFails(
      updateDoc(doc(db(ALICE), 'users', UID_ALICE), {
        displayName: 'Kapo sin fecha',
      }),
    );
  });

  it('un admin sí puede cambiar el nombre visible de otra cuenta', async () => {
    await assertSucceeds(
      updateDoc(doc(db(ADMIN), 'users', UID_ALICE), {
        displayName: 'Kapo revisado',
      }),
    );
  });

  it('dos personas pueden tener el mismo nombre visible', async () => {
    await assertSucceeds(
      updateDoc(doc(db(BOB), 'users', UID_BOB), {
        displayName: 'Kapo Dos',
        displayNameChangedAt: serverTimestamp(),
      }),
    );
    await assertSucceeds(
      updateDoc(doc(db(ALICE), 'users', UID_ALICE), {
        displayName: 'Kapo Dos',
        displayNameChangedAt: serverTimestamp(),
      }),
    );
  });
});
