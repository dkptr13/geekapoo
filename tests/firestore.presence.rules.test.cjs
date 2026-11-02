/**
 * Reglas de presencia.
 *
 * Cada persona solo puede escribir su propio documento, con los dos
 * campos permitidos y la fecha del servidor. El resto de usuarios con
 * sesión puede leerla; sin sesión, no.
 */
const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} = require('@firebase/rules-unit-testing');
const { doc, getDoc, setDoc, serverTimestamp } = require('firebase/firestore');

const fs = require('fs');
const path = require('path');

const RULES = fs.readFileSync(
  path.join(__dirname, '..', 'firestore.rules'),
  'utf8',
);
const PROJECT = 'demo-geekapoo-presence';

const ALICE = 'alice';
const BOB = 'bob';

let testEnv;

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
});

function db(uid) {
  return testEnv.authenticatedContext(uid).firestore();
}

function anon() {
  return testEnv.unauthenticatedContext().firestore();
}

describe('presencia', () => {
  it('el dueño puede escribir su estado con el reloj del servidor', async () => {
    await assertSucceeds(
      setDoc(doc(db(ALICE), 'presence', ALICE), {
        online: true,
        lastSeenAt: serverTimestamp(),
      }),
    );
  });

  it('también puede marcarse desconectado', async () => {
    await assertSucceeds(
      setDoc(doc(db(ALICE), 'presence', ALICE), {
        online: false,
        lastSeenAt: serverTimestamp(),
      }),
    );
  });

  it('no puede escribir la presencia de otra persona', async () => {
    await assertFails(
      setDoc(doc(db(ALICE), 'presence', BOB), {
        online: true,
        lastSeenAt: serverTimestamp(),
      }),
    );
  });

  it('no puede inventarse la fecha', async () => {
    await assertFails(
      setDoc(doc(db(ALICE), 'presence', ALICE), {
        online: true,
        lastSeenAt: new Date(),
      }),
    );
  });

  it('no puede colar campos adicionales', async () => {
    await assertFails(
      setDoc(doc(db(ALICE), 'presence', ALICE), {
        online: true,
        lastSeenAt: serverTimestamp(),
        texto: 'hola',
      }),
    );
  });

  it('online tiene que ser booleano', async () => {
    await assertFails(
      setDoc(doc(db(ALICE), 'presence', ALICE), {
        online: 'sí',
        lastSeenAt: serverTimestamp(),
      }),
    );
  });

  it('un usuario con sesión puede leer la presencia de otro', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'presence', ALICE), {
        online: true,
        lastSeenAt: new Date(),
      });
    });

    await assertSucceeds(getDoc(doc(db(BOB), 'presence', ALICE)));
  });

  it('sin sesión no se puede leer', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'presence', ALICE), {
        online: true,
        lastSeenAt: new Date(),
      });
    });

    await assertFails(getDoc(doc(anon(), 'presence', ALICE)));
  });
});
