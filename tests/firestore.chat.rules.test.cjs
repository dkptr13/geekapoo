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
 *     una solicitud de conversacion y crear un grupo con ella dentro.
 *     Aceptar una solicitud, entrar a un grupo o abrir el chat directo
 *     son cosas del servidor (Cloud Functions), no del cliente.
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

/** Una invitacion a un grupo, tal cual la escribe `inviteToGroup`. */
function nuevaInvitacion(from, to, groupId, extra = {}) {
  return {
    type: 'invite',
    fromId: from,
    fromName: from,
    fromAvatar: '',
    toId: to,
    toName: to,
    toAvatar: '',
    groupId,
    groupName: 'Grupo de prueba',
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

  it('el destinatario NO puede aceptar desde el cliente: lo hace el servidor', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chatRequests', 's1'), nuevaSolicitud(ALICE, BOB));
    });

    // Aceptar es cosa de `responderSolicitudChat`: si el cliente
    // pudiera escribir `accepted`, se aceptaria su propia solicitud.
    await assertFails(
      updateDoc(doc(db(BOB), 'chatRequests', 's1'), { status: 'accepted' }),
    );

    // Y tampoco puede crear el chat directo por su cuenta: el
    // documento solo lo crea la Cloud Function al aceptar.
    await assertFails(
      setDoc(doc(collection(db(BOB), 'chats')), nuevoChat(BOB, [ALICE, BOB], { type: 'direct' })),
    );
  });

  it('el destinatario SI puede rechazar, y quien la envio cancelarla', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chatRequests', 's1'), nuevaSolicitud(ALICE, BOB));
      await setDoc(doc(f, 'chatRequests', 's2'), nuevaSolicitud(ALICE, BOB));
    });

    await assertSucceeds(
      updateDoc(doc(db(BOB), 'chatRequests', 's1'), {
        status: 'rejected',
        respondedAt: serverTimestamp(),
        respondedBy: BOB,
      }),
    );

    await assertSucceeds(
      updateDoc(doc(db(ALICE), 'chatRequests', 's2'), {
        status: 'cancelled',
        respondedAt: serverTimestamp(),
        respondedBy: ALICE,
      }),
    );
  });

  it('nadie puede aceptar una solicitud de otro ni cambiar el destinatario', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chatRequests', 's1'), nuevaSolicitud(ALICE, BOB));
    });

    await assertFails(
      updateDoc(doc(db(CARA), 'chatRequests', 's1'), { status: 'accepted' }),
    );

    await assertFails(
      updateDoc(doc(db(BOB), 'chatRequests', 's1'), {
        status: 'accepted',
        toId: CARA,
      }),
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

  it('el dueno NO puede anadir a nadie directamente: manda una invitacion', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'g1'), nuevoChat(ALICE, [ALICE]));
    });

    // El ataque que se quiere cerrar: el dueño (o quien se haga
    // pasar por él) escribe el uid de un tercero en `memberIds`.
    await assertFails(
      updateDoc(doc(db(ALICE), 'chats', 'g1'), {
        memberIds: arrayUnion(BOB),
        hiddenFor: arrayRemove(BOB),
      }),
    );

    // La via legitima: el dueño crea una invitacion y BOB entra
    // cuando la acepta (la entrada real la hace el servidor).
    const invitacion = doc(collection(db(ALICE), 'chatRequests'));
    await assertSucceeds(
      setDoc(invitacion, nuevaInvitacion(ALICE, BOB, 'g1')),
    );

    // Y el invitado tampoco puede aceptarla desde el cliente.
    await assertFails(
      updateDoc(doc(db(BOB), 'chatRequests', invitacion.id), {
        status: 'accepted',
      }),
    );
  });

  it('un miembro que no es dueno NO puede invitar ni anadir gente', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'g1'), nuevoChat(ALICE, [ALICE, BOB]));
    });

    await assertFails(
      updateDoc(doc(db(BOB), 'chats', 'g1'), { memberIds: arrayUnion(CARA) }),
    );

    await assertFails(
      setDoc(
        doc(collection(db(BOB), 'chatRequests')),
        nuevaInvitacion(BOB, CARA, 'g1'),
      ),
    );
  });

  it('el dueno tampoco puede invitar a quien ya esta dentro', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'g1'), nuevoChat(ALICE, [ALICE, BOB]));
    });

    await assertFails(
      setDoc(
        doc(collection(db(ALICE), 'chatRequests')),
        nuevaInvitacion(ALICE, BOB, 'g1'),
      ),
    );
  });

  it('nadie puede cambiar el tipo, el codigo de canal ni el dueno a mano', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'g1'), nuevoChat(ALICE, [ALICE, BOB]));
    });

    await assertFails(
      updateDoc(doc(db(ALICE), 'chats', 'g1'), { type: 'direct' }),
    );
    await assertFails(
      updateDoc(doc(db(ALICE), 'chats', 'g1'), { slug: 'club-ajeno' }),
    );
    await assertFails(
      updateDoc(doc(db(ALICE), 'chats', 'g1'), { channelId: 'general' }),
    );
    await assertFails(
      updateDoc(doc(db(BOB), 'chats', 'g1'), { ownerId: BOB }),
    );
  });

  it('el dueno SI puede transferir el grupo a otro miembro, no a un ajeno', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'g1'), nuevoChat(ALICE, [ALICE, BOB]));
    });

    await assertSucceeds(
      updateDoc(doc(db(ALICE), 'chats', 'g1'), { ownerId: BOB }),
    );

    await sembrar(async (f) => {
      await updateDoc(doc(f, 'chats', 'g1'), { ownerId: ALICE });
    });

    await assertFails(
      updateDoc(doc(db(ALICE), 'chats', 'g1'), { ownerId: CARA }),
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
    const chatRef = doc(collection(db(CARA), 'chats'));

    await assertSucceeds(
      setDoc(chatRef, nuevoChat(CARA, [CARA], { code: codigo })),
    );

    await assertSucceeds(
      setDoc(doc(db(CARA), 'groupCodes', codigo), {
        code: codigo,
        // El indice tiene que apuntar al grupo REAL que se acaba
        // de crear, no a un id inventado.
        groupId: chatRef.id,
        name: 'Grupo de prueba',
        ownerId: CARA,
        ownerName: CARA,
        memberCount: 1,
        createdAt: '2026-01-01T00:00:00.000Z',
      }),
    );
  });

  it('no se puede crear un indice que apunte al grupo de otra persona', async () => {
    const codigo = 'GRP-A1B2-C3D4';
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'g-ajeno'), nuevoChat(ALICE, [ALICE]));
    });

    await assertFails(
      setDoc(doc(db(CARA), 'groupCodes', codigo), {
        code: codigo,
        groupId: 'g-ajeno',
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

  it('el dueno puede ponerle codigo a un grupo antiguo que no lo tiene', async () => {
    // Los grupos de antes del codigo existen sin el campo, y la
    // barra del chat no se pinta sin el. Sin esta rama ese grupo
    // se quedaba sin codigo para siempre.
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'g1'), nuevoChat(ALICE, [ALICE, BOB]));
    });

    await assertSucceeds(
      updateDoc(doc(db(ALICE), 'chats', 'g1'), { code: 'GRP-A1B2-C3D4' }),
    );

    await assertSucceeds(
      setDoc(doc(db(ALICE), 'groupCodes', 'GRP-A1B2-C3D4'), {
        code: 'GRP-A1B2-C3D4',
        groupId: 'g1',
        name: 'Grupo de prueba',
        ownerId: ALICE,
        ownerName: ALICE,
        memberCount: 2,
        createdAt: '2026-01-01T00:00:00.000Z',
      }),
    );
  });

  it('pero un miembro que no es dueno NO puede poner el codigo', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'g1'), nuevoChat(ALICE, [ALICE, BOB]));
    });

    await assertFails(
      updateDoc(doc(db(BOB), 'chats', 'g1'), { code: 'GRP-X9Y9-Z9Z9' }),
    );
  });

  it('al traspasar el grupo, el indice del codigo sigue al nuevo dueno', async () => {
    const codigo = 'GRP-A1B2-C3D4';
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'g1'), nuevoChat(ALICE, [ALICE, BOB], { code: codigo }));
      await setDoc(doc(f, 'groupCodes', codigo), {
        code: codigo,
        groupId: 'g1',
        name: 'Grupo de prueba',
        ownerId: ALICE,
        ownerName: ALICE,
        memberCount: 2,
        createdAt: '2026-01-01T00:00:00.000Z',
      });
    });

    // 1. El dueño viejo traspasa el chat.
    await assertSucceeds(
      updateDoc(doc(db(ALICE), 'chats', 'g1'), { ownerId: BOB }),
    );

    // 2. Y actualiza el índice (lo hace `transferGroupOwnership`).
    await assertSucceeds(
      updateDoc(doc(db(ALICE), 'groupCodes', codigo), {
        ownerId: BOB,
        ownerName: BOB,
      }),
    );

    // 3. Quien entra con el código ya puede pedirle entrar al
    //    dueño NUEVO; si el índice siguiera con ALICE, la regla
    //    de `chatRequests` lo rechazaría.
    await assertSucceeds(
      setDoc(
        doc(collection(db(CARA), 'chatRequests')),
        nuevaSolicitud(CARA, BOB, { type: 'group', groupId: 'g1' }),
      ),
    );

    // 4. Ni el dueño nuevo puede regalar el índice a un tercero.
    await assertFails(
      updateDoc(doc(db(BOB), 'groupCodes', codigo), {
        ownerId: CARA,
        ownerName: CARA,
      }),
    );

    // 5. Ni cambiar a qué grupo apunta.
    await assertFails(
      updateDoc(doc(db(BOB), 'groupCodes', codigo), { groupId: 'g2' }),
    );
  });

  it('el dueno actual puede reclamar un indice que se quedo con el anterior', async () => {
    const codigo = 'GRP-A1B2-C3D4';
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'g1'), nuevoChat(BOB, [ALICE, BOB], { code: codigo }));
      await setDoc(doc(f, 'groupCodes', codigo), {
        code: codigo,
        groupId: 'g1',
        name: 'Grupo de prueba',
        ownerId: ALICE,
        ownerName: ALICE,
        memberCount: 2,
        createdAt: '2026-01-01T00:00:00.000Z',
      });
    });

    await assertSucceeds(
      updateDoc(doc(db(BOB), 'groupCodes', codigo), {
        ownerId: BOB,
        ownerName: BOB,
      }),
    );

    // El dueño anterior ya no puede recuperarlo.
    await assertFails(
      updateDoc(doc(db(ALICE), 'groupCodes', codigo), {
        ownerId: ALICE,
        ownerName: ALICE,
      }),
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
// ATAQUES DE PERTENENCIA
// ═══════════════════════════════════════════════════════════
//
// Estos son los cuatro ataques que motivaron el cambio:
//
//   1. Meter a un tercero en un chat privado.
//   2. Meter a alguien de fuera en un grupo y leer lo viejo.
//   3. Hacerse pasar por el dueño para aceptar una entrada.
//   4. Colarse en un club público (o en su chat) sin unirse.

describe('Ataques de pertenencia', () => {
  it('a un chat privado no se le puede meter a un tercero', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'd1'), nuevoChat(ALICE, [ALICE, BOB], {
        type: 'direct',
      }));
      await setDoc(doc(f, 'chats', 'd1', 'messages', 'viejo'), {
        chatId: 'd1',
        senderId: ALICE,
        senderName: 'alice',
        senderAvatar: '',
        body: 'Esto es privado',
        type: 'text',
        createdAt: '2026-01-01T00:00:00.000Z',
      });
    });

    await assertFails(
      updateDoc(doc(db(ALICE), 'chats', 'd1'), {
        memberIds: arrayUnion(CARA),
        hiddenFor: arrayRemove(CARA),
      }),
    );

    // Y CARA sigue sin poder leer el historial.
    await assertFails(getDoc(doc(db(CARA), 'chats', 'd1', 'messages', 'viejo')));
  });

  it('un ajeno no puede colarse en un grupo y leer el historial viejo', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'g1'), nuevoChat(ALICE, [ALICE, BOB]));
      await setDoc(doc(f, 'chats', 'g1', 'messages', 'viejo'), {
        chatId: 'g1',
        senderId: ALICE,
        senderName: 'alice',
        senderAvatar: '',
        body: 'Lo que se hablo antes',
        type: 'text',
        createdAt: '2026-01-01T00:00:00.000Z',
      });
    });

    await assertFails(
      updateDoc(doc(db(CARA), 'chats', 'g1'), {
        memberIds: arrayUnion(CARA),
        hiddenFor: arrayRemove(CARA),
      }),
    );

    await assertFails(getDoc(doc(db(CARA), 'chats', 'g1', 'messages', 'viejo')));
  });

  it('un ajeno no puede colarse en el chat de un club publico', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'clubs', 'club-publico'), {
        slug: 'club-publico',
        name: 'Club publico',
        accessType: 'public',
        ownerId: ALICE,
        moderatorIds: [],
        memberIds: [ALICE],
        members: {
          [ALICE]: { uid: ALICE, role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
        },
        memberCount: 1,
        chatId: 'c1',
      });
      await setDoc(doc(f, 'chats', 'c1'), nuevoChat(ALICE, [ALICE], {
        type: 'club',
        slug: 'club-publico',
        ownerId: ALICE,
      }));
      await setDoc(doc(f, 'chats', 'c1', 'messages', 'viejo'), {
        chatId: 'c1',
        senderId: ALICE,
        senderName: 'alice',
        senderAvatar: '',
        body: 'Solo para el club',
        type: 'text',
        createdAt: '2026-01-01T00:00:00.000Z',
      });
    });

    // CARA no esta en `club.memberIds`: la rama de auto-join del
    // club publico exige ser miembro ANTES de tocar el chat.
    await assertFails(
      updateDoc(doc(db(CARA), 'chats', 'c1'), {
        memberIds: arrayUnion(CARA),
        hiddenFor: arrayRemove(CARA),
      }),
    );

    await assertFails(getDoc(doc(db(CARA), 'chats', 'c1', 'messages', 'viejo')));
  });

  it('un miembro no puede aceptar una entrada en nombre del dueno', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'g1'), nuevoChat(ALICE, [ALICE, BOB]));
      await setDoc(doc(f, 'chatRequests', 's1'), nuevaSolicitud(CARA, ALICE, {
        type: 'group',
        groupId: 'g1',
      }));
    });

    // BOB es miembro, pero no el destinatario (ALICE) ni el dueño.
    await assertFails(
      updateDoc(doc(db(BOB), 'chatRequests', 's1'), { status: 'accepted' }),
    );

    // CARA es quien la envio: tampoco puede aceptarla.
    await assertFails(
      updateDoc(doc(db(CARA), 'chatRequests', 's1'), { status: 'accepted' }),
    );

    // Y no puede fabricar una solicitud dirigida a un falso dueño.
    await assertFails(
      setDoc(
        doc(collection(db(CARA), 'chatRequests')),
        nuevaSolicitud(CARA, BOB, { type: 'group', groupId: 'g1' }),
      ),
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

// ═══════════════════════════════════════════════════════════
// BORRAR MENSAJES
// ═══════════════════════════════════════════════════════════
//
// El borrado para todos lo hace SOLO el servidor
// (`eliminarMensajeParaTodos`), y el personal son registros
// propios. Estas pruebas fijan lo que el cliente NO puede:
//
//   - Ni el autor puede reescribir, marcar o destruir su mensaje.
//   - Nadie puede ocultar mensajes de otro.
//   - Lo oculto no se modifica: o está o no está.

/** Un chat con un mensaje de ALICE, listo para intentar borrarlo. */
async function sembrarMensaje(chatId = 'g1', msgId = 'm1', de = ALICE) {
  await sembrar(async (f) => {
    await setDoc(doc(f, 'chats', chatId), nuevoChat(ALICE, [ALICE, BOB]));
    await setDoc(doc(f, 'chats', chatId, 'messages', msgId), {
      chatId,
      senderId: de,
      senderName: de,
      senderAvatar: '',
      body: 'Hola',
      type: 'text',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
  });
}

describe('Borrar mensajes: el cliente no toca mensajes', () => {
  it('el autor ya no puede reescribir su mensaje', async () => {
    await sembrarMensaje();

    // Antes la regla dejaba al autor actualizar lo suyo sin mirar
    // qué campos: se podía cambiar el texto sin dejar rastro.
    await assertFails(updateDoc(doc(db(ALICE), 'chats', 'g1', 'messages', 'm1'), {
      body: 'Yo nunca dije eso',
    }));
  });

  it('el autor no puede marcar borrado-para-todos a mano', async () => {
    await sembrarMensaje();

    // El camino es la callable, que comprueba autoría y 2 horas
    // con el reloj del servidor. Por reglas no pasa nadie.
    await assertFails(
      updateDoc(doc(db(ALICE), 'chats', 'g1', 'messages', 'm1'), {
        deletedForEveryone: true,
        deletedAt: '2026-10-09T18:00:00.000Z',
        deletedBy: ALICE,
      }),
    );
  });

  it('el autor no puede destruir su mensaje', async () => {
    await sembrarMensaje();

    await assertFails(deleteDoc(doc(db(ALICE), 'chats', 'g1', 'messages', 'm1')));
  });

  it('un receptor no puede tocar un mensaje ajeno', async () => {
    await sembrarMensaje();

    await assertFails(
      updateDoc(doc(db(BOB), 'chats', 'g1', 'messages', 'm1'), { body: 'Editado' }),
    );
    await assertFails(deleteDoc(doc(db(BOB), 'chats', 'g1', 'messages', 'm1')));
  });

  it('quien no es miembro tampoco', async () => {
    await sembrarMensaje();

    await assertFails(
      updateDoc(doc(db(CARA), 'chats', 'g1', 'messages', 'm1'), {
        deletedForEveryone: true,
      }),
    );
  });

  it('crear mensajes sigue funcionando igual', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'g1'), nuevoChat(ALICE, [ALICE, BOB]));
    });

    // La regla de creación no se ha tocado: si esto falla, el
    // cierre de update/delete se ha llevado algo por delante.
    await assertSucceeds(
      setDoc(doc(collection(db(ALICE), 'chats', 'g1', 'messages'), 'm2'), {
        chatId: 'g1',
        senderId: ALICE,
        senderName: 'alice',
        senderAvatar: '',
        body: 'Otro',
        type: 'text',
        createdAt: '2026-01-01T00:00:00.000Z',
      }),
    );
  });
});

describe('Ocultar para mí: cada uno lo suyo', () => {
  it('puedo ocultar un mensaje y leer mi registro', async () => {
    await sembrarMensaje();

    await assertSucceeds(
      setDoc(doc(db(ALICE), 'users', ALICE, 'hiddenMessages', 'm1'), {
        chatId: 'g1',
        messageId: 'm1',
        hiddenAt: '2026-10-09T18:00:00.000Z',
      }),
    );

    const propio = await assertSucceeds(
      getDoc(doc(db(ALICE), 'users', ALICE, 'hiddenMessages', 'm1')),
    );

    assert.ok(propio.exists(), 'mi registro se puede leer');
  });

  it('no puedo ocultar en nombre de otro ni leer lo suyo', async () => {
    await sembrarMensaje();

    await assertFails(
      setDoc(doc(db(ALICE), 'users', BOB, 'hiddenMessages', 'm1'), {
        chatId: 'g1',
        messageId: 'm1',
        hiddenAt: '2026-10-09T18:00:00.000Z',
      }),
    );

    await assertFails(getDoc(doc(db(ALICE), 'users', BOB, 'hiddenMessages', 'm1')));
  });

  it('lo oculto no se modifica: o está o no está', async () => {
    await sembrarMensaje();

    await assertSucceeds(
      setDoc(doc(db(ALICE), 'users', ALICE, 'hiddenMessages', 'm1'), {
        chatId: 'g1',
        messageId: 'm1',
        hiddenAt: '2026-10-09T18:00:00.000Z',
      }),
    );

    await assertFails(
      updateDoc(doc(db(ALICE), 'users', ALICE, 'hiddenMessages', 'm1'), {
        chatId: 'otra',
      }),
    );
  });

  it('ocultar dos veces no duplica y se puede deshacer', async () => {
    await sembrarMensaje();

    const ref = doc(db(ALICE), 'users', ALICE, 'hiddenMessages', 'm1');

    await assertSucceeds(
      setDoc(ref, { chatId: 'g1', messageId: 'm1', hiddenAt: '1' }),
    );
    await assertSucceeds(
      setDoc(ref, { chatId: 'g1', messageId: 'm1', hiddenAt: '2' }),
    );
    await assertSucceeds(deleteDoc(ref));

    const trasBorrar = await assertSucceeds(getDoc(ref));

    assert.ok(!trasBorrar.exists(), 'al borrar el registro vuelve a verse');
  });

  it('el id tiene que ser el del mensaje', async () => {
    await sembrarMensaje();

    // Sin esto se podría rellenar la carpeta de otro... bueno, la
    // propia, con basura que no apunta a ningún mensaje.
    await assertFails(
      setDoc(doc(db(ALICE), 'users', ALICE, 'hiddenMessages', 'm1'), {
        chatId: 'g1',
        messageId: 'otro',
        hiddenAt: '2026-10-09T18:00:00.000Z',
      }),
    );
  });
});


// ═══════════════════════════════════════════════════════════
// CITAR AL ENVIAR
// ═══════════════════════════════════════════════════════════
//
// La cita viaja dentro del mensaje nuevo (`replyTo`). Como la
// escribe el cliente, la regla exige forma: mapa con id, autor y
// fragmento acotado. Sin eso serviría para colar datos.

/** Un mensaje válido con cita, tal cual lo manda el cliente. */
function mensajeConCita(de = ALICE) {
  return {
    chatId: 'g1',
    senderId: de,
    senderName: de,
    senderAvatar: '',
    body: 'Totalmente',
    type: 'text',
    createdAt: '2026-01-01T00:00:00.000Z',
    replyTo: { messageId: 'm0', senderName: 'bob', snippet: 'Hola' },
  };
}

describe('Citar mensajes: forma obligatoria', () => {
  it('un mensaje con cita bien formada se puede enviar', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'g1'), nuevoChat(ALICE, [ALICE, BOB]));
    });

    await assertSucceeds(
      setDoc(doc(collection(db(ALICE), 'chats', 'g1', 'messages'), 'm1'), mensajeConCita()),
    );
  });

  it('la cita sin id no pasa', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'g1'), nuevoChat(ALICE, [ALICE, BOB]));
    });

    const mala = mensajeConCita();

    mala.replyTo = { senderName: 'bob', snippet: 'Hola' };

    await assertFails(
      setDoc(doc(collection(db(ALICE), 'chats', 'g1', 'messages'), 'm1'), mala),
    );
  });

  it('la cita que no es un mapa no pasa', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'g1'), nuevoChat(ALICE, [ALICE, BOB]));
    });

    const mala = mensajeConCita();

    mala.replyTo = 'm0';

    await assertFails(
      setDoc(doc(collection(db(ALICE), 'chats', 'g1', 'messages'), 'm1'), mala),
    );
  });

  it('un fragmento gigante no pasa', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'g1'), nuevoChat(ALICE, [ALICE, BOB]));
    });

    const mala = mensajeConCita();

    mala.replyTo = { messageId: 'm0', senderName: 'bob', snippet: 'x'.repeat(500) };

    await assertFails(
      setDoc(doc(collection(db(ALICE), 'chats', 'g1', 'messages'), 'm1'), mala),
    );
  });

  it('sin cita sigue igual que siempre', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'g1'), nuevoChat(ALICE, [ALICE, BOB]));
    });

    await assertSucceeds(
      setDoc(doc(collection(db(ALICE), 'chats', 'g1', 'messages'), 'm1'), {
        chatId: 'g1',
        senderId: ALICE,
        senderName: 'alice',
        senderAvatar: '',
        body: 'Sin cita',
        type: 'text',
        createdAt: '2026-01-01T00:00:00.000Z',
      }),
    );
  });
});
