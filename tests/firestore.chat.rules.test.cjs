/**
 * Pruebas de las reglas del CHAT: conversaciones, solicitudes y grupos.
 *
 * Va aparte de los demas porque es otro grupo de reglas y porque cada
 * archivo monta su propio entorno del emulador.
 *
 * Se ejecuta con `npm run test:rules`.
 *
 * ── POR QUE ESTE ARCHIVO ──────────────────────────────────────────
 *
 * Porque "no puedo anadir a nadie" no se reproduce leyendo las reglas: hay
 * que ejecutarlas. Y una comprobacion que solo mira el texto de la regla
 * pasaria sin problemas con reglas que en Firestore NO funcionan, porque
 * lo que decide es si el analizador puede PROBAR que una consulta es
 * segura, no si la condicion es verdadera.
 *
 * Lo que se comprueba:
 *
 *   - Que CUALQUIER cuenta con sesion (no solo el equipo) pueda enviar
 *     una solicitud de conversacion, crear un grupo y aceptar una
 *     solicitud que le llega.
 *   - Que lo mismo siga SIN dar permisos a un usuario baneado.
 *   - Que la lista de conversaciones se pueda leer con la forma de
 *     consulta que usa el cliente (`array-contains`), porque si el
 *     analizador no lo puede demostrar devuelve "Missing or insufficient
 *     permissions" y el chat entero aparece vacio.
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
const PROJECT = 'demo-geekapoo-chat';

const ALICE = 'alice';
const BOB = 'bob';
const CARA = 'carla';
const BANEADO = 'baneado';

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

/** Una solicitud de conversacion tal cual la escribe `requestDirectChat`. */
function nuevaSolicitud(from, to, extra = {}) {
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
    ...extra,
  };
}

/** Un chat nuevo, con los campos que exige la regla de creacion. */
function nuevoChat(dueno, miembros, extra = {}) {
  return {
    type: 'group',
    name: 'Grupo de prueba',
    avatar: '',
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
  await crearUsuario(BANEADO, { isBanned: true });
});

// ═══════════════════════════════════════════════════════════
// AÑADIR A ALGUIEN
// ═══════════════════════════════════════════════════════════

describe('Anadir contactos: cualquier cuenta con sesion', () => {
  it('un usuario normal puede enviar una solicitud', async () => {
    await assertSucceeds(
      setDoc(doc(collection(db(ALICE), 'chatRequests')), nuevaSolicitud(ALICE, BOB)),
    );
  });

  it('otra cuenta normal tambien, no solo el primero', async () => {
    // El fallo que se vio era de permisos para cuentas sin rol. Esta
    // comprueba que no depende de quien seas: CARA no ha tocado nada
    // antes y le tiene que dejar igual que a ALICE.
    await assertSucceeds(
      setDoc(doc(collection(db(CARA), 'chatRequests')), nuevaSolicitud(CARA, BOB)),
    );
  });

  it('la solicitud se puede leer despues (la lista no esta vacia)', async () => {
    await assertSucceeds(
      setDoc(doc(collection(db(ALICE), 'chatRequests')), nuevaSolicitud(ALICE, BOB)),
    );

    const recibidas = await assertSucceeds(
      getDocs(query(collection(db(BOB), 'chatRequests'), where('toId', '==', BOB))),
    );
    const enviadas = await assertSucceeds(
      getDocs(query(collection(db(ALICE), 'chatRequests'), where('fromId', '==', ALICE))),
    );

    assert.strictEqual(recibidas.size, 1, 'el receptor ve la solicitud');
    assert.strictEqual(enviadas.size, 1, 'el emisor ve la suya');
  });

  it('no se puede enviar en nombre de otra persona', async () => {
    // fromId de CARA pero escribiendo ALICE: esto si es un ataque y tiene
    // que seguir fallando aunque se haya relajado el "quien puede".
    await assertFails(
      setDoc(doc(collection(db(ALICE), 'chatRequests')), nuevaSolicitud(CARA, BOB)),
    );
  });

  it('uno no puede mandarse una solicitud a si mismo', async () => {
    await assertFails(
      setDoc(doc(collection(db(ALICE), 'chatRequests')), nuevaSolicitud(ALICE, ALICE)),
    );
  });

  it('un baneado no puede enviar solicitudes', async () => {
    await assertFails(
      setDoc(
        doc(collection(db(BANEADO), 'chatRequests')),
        nuevaSolicitud(BANEADO, BOB),
      ),
    );
  });

  it('no se puede escribir en la solicitud de otro', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chatRequests', 's1'), nuevaSolicitud(ALICE, BOB));
    });

    // CARA no es ni emisor ni destinatario: le tiene que estar vedado.
    await assertFails(
      updateDoc(doc(db(CARA), 'chatRequests', 's1'), { status: 'accepted' }),
    );
  });

  it('el destinatario puede aceptar, y eso crea la conversacion', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chatRequests', 's1'), nuevaSolicitud(ALICE, BOB));
    });

    await assertSucceeds(
      updateDoc(doc(db(BOB), 'chatRequests', 's1'), { status: 'accepted' }),
    );

    // Y ahora el chat nuevo, que es el paso siguiente del flujo.
    await assertSucceeds(
      setDoc(doc(collection(db(BOB), 'chats')), nuevoChat(BOB, [ALICE, BOB], { type: 'direct' })),
    );
  });
});

// ═══════════════════════════════════════════════════════════
// CREAR GRUPOS
// ═══════════════════════════════════════════════════════════

describe('Crear grupos: cualquier cuenta con sesion', () => {
  it('un usuario normal puede crear un grupo siendo el unico miembro', async () => {
    await assertSucceeds(
      setDoc(doc(collection(db(ALICE), 'chats')), nuevoChat(ALICE, [ALICE])),
    );
  });

  it('otra cuenta normal tambien', async () => {
    await assertSucceeds(
      setDoc(doc(collection(db(CARA), 'chats')), nuevoChat(CARA, [CARA])),
    );
  });

  it('el grupo recien creado aparece en la lista de su dueno', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'g1'), nuevoChat(ALICE, [ALICE]));
    });

    const lista = await assertSucceeds(
      getDocs(query(collection(db(ALICE), 'chats'), where('memberIds', 'array-contains', ALICE))),
    );

    assert.strictEqual(lista.size, 1, 'el dueno ve su grupo recien creado');
  });

  it('el dueno puede anadir gente al grupo', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'g1'), nuevoChat(ALICE, [ALICE]));
    });

    await assertSucceeds(
      updateDoc(doc(db(ALICE), 'chats', 'g1'), {
        memberIds: arrayUnion(BOB),
        hiddenFor: arrayRemove(BOB),
      }),
    );

    // Y el nuevo miembro lo ve ya en su lista.
    const lista = await assertSucceeds(
      getDocs(query(collection(db(BOB), 'chats'), where('memberIds', 'array-contains', BOB))),
    );

    assert.strictEqual(lista.size, 1, 'al que le anaden ve el grupo');
  });

  it('un miembro que no es dueno NO puede anadir gente', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'g1'), nuevoChat(ALICE, [ALICE, BOB]));
    });

    await assertFails(
      updateDoc(doc(db(BOB), 'chats', 'g1'), { memberIds: arrayUnion(CARA) }),
    );
  });

  it('no se puede crear un grupo del que uno no es miembro', async () => {
    await assertFails(
      setDoc(doc(collection(db(ALICE), 'chats')), nuevoChat(CARA, [CARA])),
    );
  });

  it('crear un grupo escribe el chat Y su indice de codigo', async () => {
    // `createGroupChat` hace DOS escrituras, no una: el chat y el
    // indice de `groupCodes`, que es lo que permite entrar luego
    // presenting el codigo. Comprobar solo el chat deja un hueco
    // exactamente igual de grande al que acabamos de encontrar en las
    // solicitudes.
    const codigo = 'GRP-A1B2-C3D4';

    await assertSucceeds(
      setDoc(doc(collection(db(CARA), 'chats')), nuevoChat(CARA, [CARA], { code: codigo })),
    );

    await assertSucceeds(
      setDoc(doc(db(CARA), 'groupCodes', codigo), {
        code: codigo,
        groupId: 'g1',
        name: 'Grupo de prueba',
        ownerId: CARA,
        ownerName: CARA,
        memberCount: 1,
        createdAt: '2026-01-01T00:00:00.000Z',
      }),
    );
  });

  it('el indice de codigos es publico, para poder entrar sin ser miembro', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'groupCodes', 'GRP-A1B2-C3D4'), {
        code: 'GRP-A1B2-C3D4',
        groupId: 'g1',
        name: 'Grupo de prueba',
        ownerId: ALICE,
        ownerName: ALICE,
        memberCount: 1,
        createdAt: '2026-01-01T00:00:00.000Z',
      });
    });

    const visto = await assertSucceeds(getDocs(collection(anon(), 'groupCodes')));

    assert.strictEqual(visto.size, 1, 'cualquiera puede mirar el indice');
  });

  it('un baneado no puede crear grupos', async () => {
    await assertFails(
      setDoc(doc(collection(db(BANEADO), 'chats')), nuevoChat(BANEADO, [BANEADO])),
    );
  });

  it('un usuario sin sesion no puede crear grupos', async () => {
    await assertFails(
      setDoc(doc(collection(anon(), 'chats')), nuevoChat('x', ['x'])),
    );
  });

  it('un chat ajeno no se puede leer', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'g1'), nuevoChat(ALICE, [ALICE]));
    });

    await assertFails(getDocs(collection(db(CARA), 'chats')));
  });

  it('el dueno puede renombrar su grupo, pero otro miembro no', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'g1'), nuevoChat(ALICE, [ALICE, BOB]));
    });

    await assertSucceeds(
      updateDoc(doc(db(ALICE), 'chats', 'g1'), { name: 'Otro nombre' }),
    );

    await assertFails(
      updateDoc(doc(db(BOB), 'chats', 'g1'), { name: 'nombre ajeno' }),
    );
  });
});

// ═══════════════════════════════════════════════════════════
// LEER Y ESCRIBIR MENSAJES
// ═══════════════════════════════════════════════════════════

describe('Mensajes', () => {
  it('un miembro puede escribir y leer', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'g1'), nuevoChat(ALICE, [ALICE, BOB]));
    });

    await assertSucceeds(
      setDoc(doc(collection(db(BOB), 'chats', 'g1', 'messages'), 'm1'), {
        chatId: 'g1',
        senderId: BOB,
        senderName: 'bob',
        senderAvatar: '',
        body: 'Hola',
        type: 'text',
        createdAt: '2026-01-01T00:00:00.000Z',
      }),
    );

    const msgs = await assertSucceeds(
      getDocs(collection(db(ALICE), 'chats', 'g1', 'messages')),
    );

    assert.strictEqual(msgs.size, 1, 'el otro miembro ve el mensaje');
  });

  it('quien no es miembro no puede leer ni escribir', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'g1'), nuevoChat(ALICE, [ALICE]));
    });

    await assertFails(getDocs(collection(db(CARA), 'chats', 'g1', 'messages')));

    await assertFails(
      setDoc(doc(collection(db(CARA), 'chats', 'g1', 'messages'), 'm1'), {
        chatId: 'g1',
        senderId: CARA,
        senderName: 'carla',
        senderAvatar: '',
        body: 'Me colé',
        type: 'text',
        createdAt: '2026-01-01T00:00:00.000Z',
      }),
    );
  });
});

// ═══════════════════════════════════════════════════════════
// LA LISTA DE CONVERSACIONES
// ═══════════════════════════════════════════════════════════

describe('La lista de conversaciones del cliente', () => {
  it('se lee con "array-contains", que es la forma que usa el chat', async () => {
    // Si el analizador no puede PROBAR que la consulta es segura con
    // esta forma, la devuelve el error "Missing or insufficient
    // permissions" y el chat aparece vacio sin decir por que. Por eso
    // esta prueba existe aunque no compruebe nada nuevo sobre los datos.
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'g1'), nuevoChat(ALICE, [ALICE, BOB]));
      await setDoc(doc(f, 'chats', 'g2'), nuevoChat(CARA, [CARA]));
    });

    const deAlice = await assertSucceeds(
      getDocs(query(collection(db(ALICE), 'chats'), where('memberIds', 'array-contains', ALICE))),
    );

    assert.strictEqual(deAlice.size, 1, 'solo sus conversaciones, no las de los demas');
    assert.strictEqual(deAlice.docs[0].id, 'g1');
  });

  it('un grupo recien creado se ve al instante en la lista', async () => {
    // El caso que se rompio: crear el grupo, y que no saliera hasta
    // recargar. Con el listener abierto, un documento nuevo con el
    // propio uid en memberIds tiene que entrar en la consulta.
    await assertSucceeds(
      setDoc(doc(collection(db(ALICE), 'chats')), nuevoChat(ALICE, [ALICE])),
    );

    const lista = await assertSucceeds(
      getDocs(query(collection(db(ALICE), 'chats'), where('memberIds', 'array-contains', ALICE))),
    );

    assert.ok(lista.size >= 1, 'el grupo recien creado esta en la lista');
  });
});