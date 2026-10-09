/**
 * Pruebas de las reglas del Centro de Notificaciones
 * (`users/{uid}/notifications`).
 *
 * Estas reglas son especiales por una cosa: son SUBNIVEL de
 * `users/{uid}`, así que si el `match` está colocado en el sitio
 * equivocado (por ejemplo en la raíz, como
 * `match /notifications/{id}`) no da error de compilación: el
 * `match /{document=**}` de abajo se limita a barrer la carpeta
 * entera, y la campana del Navbar responde
 * "Missing or insufficient permissions" sin más explicación.
 * Por eso lo primero que se comprueba es que la LECTURA de las
 * propias notificaciones funciona, y luego todo lo demás:
 *
 *   - Solo el dueño lee sus avisos (ni el admin desde el cliente:
 *     una mención ya revela que estás en una conversación).
 *   - NADIE los crea desde el navegador: quien los escribe es la
 *     Cloud Function con el Admin SDK. Sin esto, un `for` de mil
 *     iteraciones le mandaba mil avisos a otra persona.
 *   - El dueño solo puede pasar un aviso a "leído". No puede
 *     reescribir el actor (el aviso parecería de otra persona) ni
 *     volver a ponerlo en no-leído (el contador volvería a subir).
 *   - Nadie los borra: si pudiera, "marcar todas como leídas"
 *     acabaría vaciando el histórico.
 *
 *   npm run test:rules
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
  orderBy,
  Timestamp,
} = require('firebase/firestore');

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const RULES = fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8');
const PROJECT = 'demo-geekapoo-notif';

const ALICE = 'alice';
const BOB = 'bob';
const ADMIN = 'admin';

// Id determinista, como el que genera la Cloud Function.
const AVISO = 'thread_t1_comentario_c1';

let testEnv;

const db = (uid) => testEnv.authenticatedContext(uid).firestore();
const anon = () => testEnv.unauthenticatedContext().firestore();

/** Perfil minimo + un aviso, saltandose las reglas. */
async function sembrarUsuario(uid, conAviso = true) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const base = ctx.firestore();
    await setDoc(doc(base, 'users', uid), {
      uid,
      email: uid + '@test.com',
      username: uid,
      displayName: uid,
      chatId: 'GK-' + uid,
      avatarUrl: '',
      role: 'user',
      createdAt: '2026-10-05T00:00:00.000Z',
      isBanned: false,
    });

    if (conAviso) {
      await setDoc(doc(base, 'users', uid, 'notifications', AVISO), nuevoAviso(uid));
    }
  });
}

/** Un aviso tal y como los escribe `notificar()` en functions/src. */
function nuevoAviso(dueno, extra = {}) {
  return {
    type: 'comment',
    recipientId: dueno,
    actorId: BOB,
    actorName: BOB,
    actorAvatar: '',
    targetType: 'thread',
    targetId: 't1',
    commentId: 'c1',
    snippet: 'Un comentario normal.',
    read: false,
    createdAt: Timestamp.fromDate(new Date('2026-10-05T10:00:00Z')),
    ...extra,
  };
}

const rutaAviso = (fdb, dueno, id = AVISO) =>
  doc(fdb, 'users', dueno, 'notifications', id);

describe('notificaciones', () => {
  before(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT,
      firestore: { rules: RULES },
    });

    await sembrarUsuario(ALICE);
    await sembrarUsuario(BOB);
    await sembrarUsuario(ADMIN, false);

    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), 'users', ADMIN), { role: 'admin' });
    });
  });

  after(async () => {
    await testEnv.cleanup();
  });

  // ==========================================================
  // 1. LECTURA: el bug de "Missing or insufficient permissions"
  // ==========================================================
  describe('la campana puede leer tus avisos', () => {
    it('listar las propias notificaciones NO da permission-denied', async () => {
      // Esta es la consulta exacta que hace `escucharNotificaciones`:
      // collection + orderBy('createdAt', 'desc'). Si el `match` de
      // las reglas se cae al `/{document=**}`, esto falla aqui.
      const q = query(
        collection(db(ALICE), 'users', ALICE, 'notifications'),
        orderBy('createdAt', 'desc'),
      );
      const snap = await assertSucceeds(getDocs(q));
      assert(snap.docs.length === 1);
      assert(snap.docs[0].data().recipientId === ALICE);
    });

    it('leer una en concreto tambien', async () => {
      const snap = await assertSucceeds(getDoc(rutaAviso(db(ALICE), ALICE)));
      assert(snap.exists());
    });

    it('un usuario normal puede leer su propia carpeta vacia', async () => {
      const snap = await assertSucceeds(
        getDocs(collection(db(ADMIN), 'users', ADMIN, 'notifications')),
      );
      assert(snap.empty);
    });
  });

  // ==========================================================
  // 2. LECTURA ajena: ni la tuya es de los demas
  // ==========================================================
  describe('nadie lee los avisos de otro', () => {
    it('otro usuario no puede listarlos', async () => {
      await assertFails(getDocs(collection(db(BOB), 'users', ALICE, 'notifications')));
    });

    it('ni leer uno suelto', async () => {
      await assertFails(getDoc(rutaAviso(db(BOB), ALICE)));
    });

    it('ni siquiera el admin desde el cliente', async () => {
      // El admin no tiene nada que hacer aqui, y una mencion ya
      // revela que alguien esta en una conversacion: no es
      // contenido moderable.
      await assertFails(getDoc(rutaAviso(db(ADMIN), ALICE)));
      await assertFails(getDocs(collection(db(ADMIN), 'users', ALICE, 'notifications')));
    });

    it('ni uno sin sesion', async () => {
      await assertFails(getDocs(collection(anon(), 'users', ALICE, 'notifications')));
    });
  });

  // ==========================================================
  // 3. CREACION: cerrada. La escribe la Cloud Function
  // ==========================================================
  describe('el cliente no puede crear avisos', () => {
    it('ni en tu propia carpeta', async () => {
      await assertFails(setDoc(rutaAviso(db(ALICE), ALICE), nuevoAviso(ALICE)));
    });

    it('ni en la de otro (el spam)', async () => {
      await assertFails(setDoc(rutaAviso(db(BOB), ALICE), nuevoAviso(ALICE)));
    });

    it('ni el admin', async () => {
      await assertFails(setDoc(rutaAviso(db(ADMIN), ALICE), nuevoAviso(ALICE)));
    });

    it('ni sin sesion', async () => {
      await assertFails(setDoc(rutaAviso(anon(), ALICE), nuevoAviso(ALICE)));
    });
  });

  // ==========================================================
  // 4. MODIFICACION: solo pasar a leida
  // ==========================================================
  describe('marcar como leida', () => {
    it('el dueno puede poner read y readAt', async () => {
      // Aqui se usa Bob como dueno para no pisar el aviso de Alice,
      // que las pruebas de lectura necesitan sin leer.
      await assertSucceeds(
        updateDoc(rutaAviso(db(BOB), BOB), {
          read: true,
          readAt: '2026-10-05T11:00:00.000Z',
        }),
      );

      const snap = await getDoc(rutaAviso(db(BOB), BOB));
      assert(snap.data().read === true);
    });

    it('pero no puede volver a ponerlo en no leida', async () => {
      // Si pudiera, el contador de la campana volveria a subir y el
      // aviso apareceria otra vez.
      await assertFails(
        updateDoc(rutaAviso(db(BOB), BOB), {
          read: false,
          readAt: null,
        }),
      );
    });

    it('ni reescribir el autor', async () => {
      // El aviso parecería de otra persona.
      await assertFails(
        updateDoc(rutaAviso(db(BOB), BOB), { actorId: ALICE, actorName: ALICE }),
      );
    });

    it('ni el tipo, ni el texto, ni el destino', async () => {
      await assertFails(updateDoc(rutaAviso(db(BOB), BOB), { type: 'admin' }));
      await assertFails(updateDoc(rutaAviso(db(BOB), BOB), { snippet: 'te debo dinero' }));
      await assertFails(
        updateDoc(rutaAviso(db(BOB), BOB), { targetType: 'chat', targetId: 'otro' }),
      );
    });

    it('ni cambiar el destinatario para redirigirlo', async () => {
      await assertFails(updateDoc(rutaAviso(db(BOB), BOB), { recipientId: ALICE }));
    });

    it('ni marcar como leida la notificacion de otro', async () => {
      await assertFails(
        updateDoc(rutaAviso(db(BOB), ALICE), { read: true, readAt: 'x' }),
      );
    });

    it('ni meter campos nuevos en el mismo update', async () => {
      // El "ataque con mas iran": marcar como leida y de paso
      // colar un campo que el cliente jamas deberia escribir.
      await assertFails(
        updateDoc(rutaAviso(db(BOB), BOB), {
          read: true,
          readAt: '2026-10-05T12:00:00.000Z',
          xp: 999999,
        }),
      );
    });

    it('ni sin sesion', async () => {
      await assertFails(updateDoc(rutaAviso(anon(), BOB), { read: true }));
    });
  });

  // ==========================================================
  // 5. BORRADO: nadie, desde el cliente
  // ==========================================================
  describe('el cliente no puede borrar avisos', () => {
    it('ni el dueno', async () => {
      // Si pudiera, "marcar todas como leidas" podria acabar
      // vaciando el historico y el contador dejaria de reflejar lo
      // que pasó. La limpieza es tarea del mantenimiento.
      await assertFails(deleteDoc(rutaAviso(db(ALICE), ALICE)));
    });

    it('ni el admin', async () => {
      await assertFails(deleteDoc(rutaAviso(db(ADMIN), ALICE)));
    });

    it('ni sin sesion', async () => {
      await assertFails(deleteDoc(rutaAviso(anon(), ALICE)));
    });

    it('el aviso sigue ahi', async () => {
      const snap = await getDoc(rutaAviso(db(ALICE), ALICE));
      assert(snap.exists());
    });
  });
});