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
  deleteField,
  serverTimestamp,
  Timestamp,
  runTransaction,
} = require('firebase/firestore');
const {
  guardarSolicitud,
  reabrirSolicitud,
} = require('./helpers/solicitudes.cjs');

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
const RESTRINGIDO = 'restringido';
const PRIVADO = 'privado';
const SIN_SOLICITUDES = 'sin-solicitudes';
const FANTASMA = 'fantasma';

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

function idDirecto(from, to) {
  return `direct_${from}_${to}`;
}

function idGrupo(groupId, from) {
  return `group_${groupId}_${from}`;
}

function idInvitacion(groupId, from, to) {
  return `invite_${groupId}_${from}_${to}`;
}

/** Referencia con el id determinista que exige la regla. */
function refSolicitud(clientDb, from, to, extra = {}) {
  if (extra.type === 'group') {
    return doc(clientDb, 'chatRequests', idGrupo(extra.groupId, from));
  }
  if (extra.type === 'invite') {
    return doc(clientDb, 'chatRequests', idInvitacion(extra.groupId, from, to));
  }
  return doc(clientDb, 'chatRequests', idDirecto(from, to));
}

/** Una solicitud de conversacion tal cual la escribe `requestDirectChat`. */
function nuevaSolicitud(from, to, extra = {}) {
  const tipo = extra.type ?? 'direct';
  const base = {
    type: tipo,
    fromId: from,
    fromName: from,
    fromAvatar: '',
    toId: to,
    status: 'pending',
    createdAt: serverTimestamp(),
    // El cliente de un grupo no manda los datos del destinatario:
    // se derivan del dueño en las reglas. Un tipo desconocido tampoco
    // debe llevar campos de grupo (así el rechazo es de la regla y no
    // un `undefined` del SDK).
    ...(tipo === 'group' ? {} : { toName: to, toAvatar: '' }),
    ...(tipo === 'group' || tipo === 'invite'
      ? { groupId: extra.groupId, groupName: 'Grupo de prueba' }
      : {}),
  };
  return { ...base, ...extra };
}

function crearSolicitud(clientDb, from, to, extra = {}) {
  return guardarSolicitud(
    clientDb,
    from,
    refSolicitud(clientDb, from, to, extra),
    nuevaSolicitud(from, to, extra),
  );
}

function crearInvitacion(clientDb, from, to, groupId, extra = {}) {
  return guardarSolicitud(
    clientDb,
    from,
    doc(clientDb, 'chatRequests', idInvitacion(groupId, from, to)),
    nuevaInvitacion(from, to, groupId, extra),
  );
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
    createdAt: serverTimestamp(),
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
    // El servidor es quien pone la fecha de la vista previa. El
    // cliente ya no puede elegirla (F1).
    lastMessageAt: serverTimestamp(),
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
    await assertSucceeds(crearSolicitud(db(ALICE), ALICE, BOB));
  });

  it('otra cuenta normal tambien, no solo el primero', async () => {
    // El fallo que se vio era de permisos para cuentas sin rol. Esta
    // comprueba que no depende de quien seas: CARA no ha tocado nada
    // antes y le tiene que dejar igual que a ALICE.
    await assertSucceeds(crearSolicitud(db(CARA), CARA, BOB));
  });

  it('la solicitud se puede leer despues (la lista no esta vacia)', async () => {
    await assertSucceeds(crearSolicitud(db(ALICE), ALICE, BOB));

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
    await assertFails(crearSolicitud(db(ALICE), CARA, BOB));
  });

  it('uno no puede mandarse una solicitud a si mismo', async () => {
    await assertFails(crearSolicitud(db(ALICE), ALICE, ALICE));
  });

  it('no se puede mandar una solicitud a un destinatario que no existe', async () => {
    await assertFails(crearSolicitud(db(ALICE), ALICE, FANTASMA));
  });

  it('no se puede mandar una solicitud a una cuenta baneada', async () => {
    await assertFails(crearSolicitud(db(ALICE), ALICE, BANEADO));
  });

  it('no se puede mandar una solicitud a una cuenta con baneo duradero', async () => {
    await crearUsuario(RESTRINGIDO);
    await sembrar(async (f) => {
      await setDoc(doc(f, 'accountRestrictions', RESTRINGIDO), {
        uid: RESTRINGIDO,
        tipo: 'ban',
        activo: true,
        motivo: 'Prueba de baneo',
        fechaFin: null,
        creadoEn: '2026-01-01T00:00:00.000Z',
        actualizadoEn: '2026-01-01T00:00:00.000Z',
      });
    });

    await assertFails(crearSolicitud(db(ALICE), ALICE, RESTRINGIDO));
  });

  it('no se puede mandar una solicitud a un perfil privado', async () => {
    await crearUsuario(PRIVADO, { profileVisibility: 'private' });

    await assertFails(crearSolicitud(db(ALICE), ALICE, PRIVADO));
  });

  it('no se puede mandar una solicitud a quien tiene los mensajes cerrados', async () => {
    await crearUsuario(SIN_SOLICITUDES, { allowChatRequests: false });

    await assertFails(crearSolicitud(db(ALICE), ALICE, SIN_SOLICITUDES));
  });

  it('rechaza un tipo de solicitud que no existe', async () => {
    await assertFails(
      crearSolicitud(db(ALICE), ALICE, BOB, { type: 'broadcast' }),
    );
  });

  it('una entrada a un grupo respeta la privacidad del dueno', async () => {
    await crearUsuario(PRIVADO, { profileVisibility: 'private' });
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'g-privado'), nuevoChat(PRIVADO, [PRIVADO]));
      await setDoc(doc(f, 'chats', 'g-alice'), nuevoChat(ALICE, [ALICE]));
    });

    await assertFails(
      crearSolicitud(db(ALICE), ALICE, PRIVADO, {
        type: 'group',
        groupId: 'g-privado',
      }),
    );

    // La invitación también llega al mismo destinatario; tampoco debe
    // poder saltarse su ajuste de privacidad.
    await assertFails(
      crearInvitacion(db(ALICE), ALICE, PRIVADO, 'g-alice'),
    );
  });

  it('un baneado no puede enviar solicitudes', async () => {
    await assertFails(crearSolicitud(db(BANEADO), BANEADO, BOB));
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

  it('el emisor NO puede aceptar su propia solicitud', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chatRequests', 's1'), nuevaSolicitud(ALICE, BOB));
    });

    await assertFails(
      updateDoc(doc(db(ALICE), 'chatRequests', 's1'), {
        status: 'accepted',
        respondedAt: serverTimestamp(),
        respondedBy: ALICE,
      }),
    );
  });

  it('el destinatario NO puede cancelar la solicitud del emisor', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chatRequests', 's1'), nuevaSolicitud(ALICE, BOB));
    });

    await assertFails(
      updateDoc(doc(db(BOB), 'chatRequests', 's1'), {
        status: 'cancelled',
        respondedAt: serverTimestamp(),
        respondedBy: BOB,
      }),
    );
  });

  it('no se puede falsificar quien respondio ni la hora de respuesta', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chatRequests', 's1'), nuevaSolicitud(ALICE, BOB));
    });

    await assertFails(
      updateDoc(doc(db(BOB), 'chatRequests', 's1'), {
        status: 'rejected',
        respondedAt: serverTimestamp(),
        respondedBy: ALICE,
      }),
    );

    await assertFails(
      updateDoc(doc(db(BOB), 'chatRequests', 's1'), {
        status: 'rejected',
        respondedAt: new Date(0),
        respondedBy: BOB,
      }),
    );
  });

  it('mantiene inmutables los identificadores y la fecha de creacion', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chatRequests', 's1'), nuevaSolicitud(ALICE, BOB));
      await setDoc(doc(f, 'chats', 'g1'), nuevoChat(ALICE, [ALICE]));
      await setDoc(doc(f, 'chatRequests', 's2'), nuevaSolicitud(CARA, ALICE, {
        type: 'group',
        groupId: 'g1',
      }));
    });

    const cancelar = () => ({
      status: 'cancelled',
      respondedAt: serverTimestamp(),
      respondedBy: ALICE,
    });

    await assertFails(
      updateDoc(doc(db(ALICE), 'chatRequests', 's1'), {
        ...cancelar(),
        toId: CARA,
      }),
    );
    await assertFails(
      updateDoc(doc(db(ALICE), 'chatRequests', 's1'), {
        ...cancelar(),
        fromId: CARA,
      }),
    );
    await assertFails(
      updateDoc(doc(db(ALICE), 'chatRequests', 's1'), {
        ...cancelar(),
        type: 'group',
      }),
    );
    await assertFails(
      updateDoc(doc(db(ALICE), 'chatRequests', 's1'), {
        ...cancelar(),
        createdAt: '2026-02-01T00:00:00.000Z',
      }),
    );
    await assertFails(
      updateDoc(doc(db(ALICE), 'chatRequests', 's1'), {
        ...cancelar(),
        resultingChatId: 'chat-inventado',
      }),
    );

    // En una solicitud de grupo, el identificador del grupo tampoco
    // se puede cambiar al responder.
    await assertFails(
      updateDoc(doc(db(ALICE), 'chatRequests', 's2'), {
        status: 'rejected',
        respondedAt: serverTimestamp(),
        respondedBy: ALICE,
        groupId: 'g2',
      }),
    );
  });

  // ── G1: identidad, id determinista y reapertura ──────────

  it('no se puede presentar la solicitud con otro nombre', async () => {
    await assertFails(
      crearSolicitud(db(ALICE), ALICE, BOB, {
        fromName: 'Soporte oficial de Geekapoo',
      }),
    );
  });

  it('no se puede presentar la solicitud con otro avatar', async () => {
    await assertFails(
      crearSolicitud(db(ALICE), ALICE, BOB, {
        fromAvatar: 'https://example.com/falso.png',
      }),
    );
  });

  it('no se puede falsear el nombre del destinatario', async () => {
    await assertFails(
      crearSolicitud(db(ALICE), ALICE, BOB, { toName: 'Soporte oficial' }),
    );
  });

  it('un id que no es el determinista no pasa', async () => {
    await assertFails(
      setDoc(
        doc(db(ALICE), 'chatRequests', 'direct_inventado'),
        nuevaSolicitud(ALICE, BOB),
      ),
    );
  });

  it('la fecha de creación tiene que ser la del servidor', async () => {
    await assertFails(
      crearSolicitud(db(ALICE), ALICE, BOB, {
        createdAt: '2026-01-01T00:00:00.000Z',
      }),
    );
  });

  it('el nombre del grupo tiene que ser el real', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'g1'), nuevoChat(ALICE, [ALICE]));
    });

    await assertFails(
      crearSolicitud(db(CARA), CARA, ALICE, {
        type: 'group',
        groupId: 'g1',
        groupName: 'Otro nombre',
      }),
    );
  });

  it('una solicitud cancelada se puede reabrir', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chatRequests', idDirecto(ALICE, BOB)), {
        ...nuevaSolicitud(ALICE, BOB),
        status: 'cancelled',
        respondedAt: Timestamp.now(),
        respondedBy: ALICE,
      });
    });

    const alice = db(ALICE);
    await assertSucceeds(
      reabrirSolicitud(
        alice,
        ALICE,
        doc(alice, 'chatRequests', idDirecto(ALICE, BOB)),
      ),
    );
  });

  it('una solicitud rechazada no se puede repetir antes de 24 h', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chatRequests', idDirecto(ALICE, BOB)), {
        ...nuevaSolicitud(ALICE, BOB),
        status: 'rejected',
        respondedAt: Timestamp.now(),
        respondedBy: BOB,
      });
    });

    const alice = db(ALICE);
    await assertFails(
      reabrirSolicitud(
        alice,
        ALICE,
        doc(alice, 'chatRequests', idDirecto(ALICE, BOB)),
      ),
    );
  });

  it('una solicitud rechazada se puede repetir pasadas 24 h', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chatRequests', idDirecto(ALICE, BOB)), {
        ...nuevaSolicitud(ALICE, BOB),
        status: 'rejected',
        respondedAt: Timestamp.fromDate(
          new Date(Date.now() - 25 * 60 * 60 * 1000),
        ),
        respondedBy: BOB,
      });
    });

    const alice = db(ALICE);
    await assertSucceeds(
      reabrirSolicitud(
        alice,
        ALICE,
        doc(alice, 'chatRequests', idDirecto(ALICE, BOB)),
      ),
    );
  });

  it('una entrada aceptada se puede repetir si ya no es miembro', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'g1'), nuevoChat(ALICE, [ALICE]));
      await setDoc(doc(f, 'chatRequests', idGrupo('g1', BOB)), {
        ...nuevaSolicitud(BOB, ALICE, { type: 'group', groupId: 'g1' }),
        status: 'accepted',
        respondedAt: Timestamp.now(),
        respondedBy: ALICE,
        resultingChatId: 'chat-viejo',
      });
    });

    const bob = db(BOB);
    await assertSucceeds(
      reabrirSolicitud(
        bob,
        BOB,
        doc(bob, 'chatRequests', idGrupo('g1', BOB)),
      ),
    );
  });

  it('una entrada aceptada NO se repite si sigue siendo miembro', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'g1'), nuevoChat(ALICE, [ALICE, BOB]));
      await setDoc(doc(f, 'chatRequests', idGrupo('g1', BOB)), {
        ...nuevaSolicitud(BOB, ALICE, { type: 'group', groupId: 'g1' }),
        status: 'accepted',
        respondedAt: Timestamp.now(),
        respondedBy: ALICE,
        resultingChatId: 'chat-viejo',
      });
    });

    await assertFails(
      updateDoc(doc(db(BOB), 'chatRequests', idGrupo('g1', BOB)), {
        status: 'pending',
        respondedAt: deleteField(),
        respondedBy: deleteField(),
      }),
    );
  });

  it('una invitación aceptada se puede repetir si el invitado ya no está', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'g1'), nuevoChat(ALICE, [ALICE]));
      await setDoc(doc(f, 'chatRequests', idInvitacion('g1', ALICE, BOB)), {
        ...nuevaInvitacion(ALICE, BOB, 'g1'),
        status: 'accepted',
        respondedAt: Timestamp.now(),
        respondedBy: BOB,
        resultingChatId: 'chat-viejo',
      });
    });

    const alice = db(ALICE);
    await assertSucceeds(
      reabrirSolicitud(
        alice,
        ALICE,
        doc(alice, 'chatRequests', idInvitacion('g1', ALICE, BOB)),
      ),
    );
  });

  it('una conversación directa aceptada no se reabre', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chatRequests', idDirecto(ALICE, BOB)), {
        ...nuevaSolicitud(ALICE, BOB),
        status: 'accepted',
        respondedAt: Timestamp.now(),
        respondedBy: BOB,
        resultingChatId: 'chat-directo',
      });
    });

    await assertFails(
      updateDoc(doc(db(ALICE), 'chatRequests', idDirecto(ALICE, BOB)), {
        status: 'pending',
        respondedAt: deleteField(),
        respondedBy: deleteField(),
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
    const invitacion = doc(db(ALICE), 'chatRequests', idInvitacion('g1', ALICE, BOB));
    await assertSucceeds(
      crearInvitacion(db(ALICE), ALICE, BOB, 'g1'),
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

    await assertFails(crearInvitacion(db(BOB), BOB, CARA, 'g1'));
  });

  it('el dueno tampoco puede invitar a quien ya esta dentro', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'g1'), nuevoChat(ALICE, [ALICE, BOB]));
    });

    await assertFails(crearInvitacion(db(ALICE), ALICE, BOB, 'g1'));
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
    const codigo = 'GRP-1A2B-3C4D-5E6F';
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
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('no se puede crear un indice que apunte al grupo de otra persona', async () => {
    const codigo = 'GRP-1A2B-3C4D-5E6F';
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

  it('el indice se consulta con el codigo exacto, pero no se enumera', async () => {
    const codigo = 'GRP-1A2B-3C4D-5E6F';
    await sembrar(async (f) => {
      await setDoc(doc(f, 'groupCodes', codigo), {
        code: codigo,
        groupId: 'g1',
        name: 'Grupo de prueba',
        ownerId: ALICE,
        ownerName: ALICE,
        memberCount: 1,
        createdAt: '2026-01-01T00:00:00.000Z',
      });
    });

    // CARA no es miembro, pero tiene una cuenta activa y conoce el
    // código: puede ver a qué grupo pertenece para pedir entrar.
    const visto = await assertSucceeds(getDoc(doc(db(CARA), 'groupCodes', codigo)));
    assert.strictEqual(visto.exists(), true);

    // Lo que NO puede es listar la colección y llevarse todos los
    // códigos de una vez.
    await assertFails(getDocs(collection(db(CARA), 'groupCodes')));
    await assertFails(getDocs(collection(anon(), 'groupCodes')));
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
      updateDoc(doc(db(ALICE), 'chats', 'g1'), { code: 'GRP-1A2B-3C4D-5E6F' }),
    );

    await assertSucceeds(
      setDoc(doc(db(ALICE), 'groupCodes', 'GRP-1A2B-3C4D-5E6F'), {
        code: 'GRP-1A2B-3C4D-5E6F',
        groupId: 'g1',
        name: 'Grupo de prueba',
        ownerId: ALICE,
        ownerName: ALICE,
        memberCount: 2,
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('pero un miembro que no es dueno NO puede poner el codigo', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'g1'), nuevoChat(ALICE, [ALICE, BOB]));
    });

    await assertFails(
      updateDoc(doc(db(BOB), 'chats', 'g1'), { code: 'GRP-1111-2222-3333' }),
    );
  });

  it('al traspasar el grupo, el indice del codigo sigue al nuevo dueno', async () => {
    const codigo = 'GRP-1A2B-3C4D-5E6F';
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
      crearSolicitud(db(CARA), CARA, BOB, { type: 'group', groupId: 'g1' }),
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
    const codigo = 'GRP-1A2B-3C4D-5E6F';
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
      crearSolicitud(db(CARA), CARA, BOB, { type: 'group', groupId: 'g1' }),
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
// escribe el cliente, la regla lee el mensaje citado de verdad y
// compara autor y texto canónico completo.

/** Un mensaje real que se puede citar. */
function mensajeCitado(extra = {}) {
  return {
    chatId: 'g1',
    senderId: BOB,
    senderName: 'bob',
    senderAvatar: '',
    body: 'Hola',
    type: 'text',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  };
}

async function sembrarChatConMensaje() {
  await sembrar(async (f) => {
    await setDoc(doc(f, 'chats', 'g1'), nuevoChat(ALICE, [ALICE, BOB]));
    await setDoc(doc(f, 'chats', 'g1', 'messages', 'm0'), mensajeCitado());
  });
}

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
    replyTo: { messageId: 'm0', senderName: 'bob', texto: 'Hola' },
  };
}

describe('Citar mensajes: contra el mensaje real', () => {
  it('un mensaje con una cita real se puede enviar', async () => {
    await sembrarChatConMensaje();

    await assertSucceeds(
      setDoc(doc(collection(db(ALICE), 'chats', 'g1', 'messages'), 'm1'), mensajeConCita()),
    );
  });

  it('la cita sin id no pasa', async () => {
    await sembrarChatConMensaje();

    const mala = mensajeConCita();

    mala.replyTo = { senderName: 'bob', texto: 'Hola' };

    await assertFails(
      setDoc(doc(collection(db(ALICE), 'chats', 'g1', 'messages'), 'm1'), mala),
    );
  });

  it('la cita que no es un mapa no pasa', async () => {
    await sembrarChatConMensaje();

    const mala = mensajeConCita();

    mala.replyTo = 'm0';

    await assertFails(
      setDoc(doc(collection(db(ALICE), 'chats', 'g1', 'messages'), 'm1'), mala),
    );
  });

  it('no se puede citar un mensaje que no existe', async () => {
    await sembrarChatConMensaje();

    const mala = mensajeConCita();

    mala.replyTo = { messageId: 'inventado', senderName: 'bob', texto: 'Hola' };

    await assertFails(
      setDoc(doc(collection(db(ALICE), 'chats', 'g1', 'messages'), 'm1'), mala),
    );
  });

  it('no se puede cambiar el autor del mensaje citado', async () => {
    await sembrarChatConMensaje();

    const mala = mensajeConCita();

    mala.replyTo = {
      messageId: 'm0',
      senderName: 'Administrador',
      texto: 'Hola',
    };

    await assertFails(
      setDoc(doc(collection(db(ALICE), 'chats', 'g1', 'messages'), 'm1'), mala),
    );
  });

  it('no se puede cambiar el texto del mensaje citado', async () => {
    await sembrarChatConMensaje();

    const mala = mensajeConCita();

    mala.replyTo = {
      messageId: 'm0',
      senderName: 'bob',
      texto: 'x'.repeat(500),
    };

    await assertFails(
      setDoc(doc(collection(db(ALICE), 'chats', 'g1', 'messages'), 'm1'), mala),
    );
  });

  it('una cita antigua con solo `snippet` ya no se puede escribir', async () => {
    await sembrarChatConMensaje();

    const mala = mensajeConCita();

    mala.replyTo = { messageId: 'm0', senderName: 'bob', snippet: 'Hola' };

    await assertFails(
      setDoc(doc(collection(db(ALICE), 'chats', 'g1', 'messages'), 'm1'), mala),
    );
  });

  it('una cita de un mensaje largo guarda el texto completo', async () => {
    const largo = 'x'.repeat(500);

    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'g1'), nuevoChat(ALICE, [ALICE, BOB]));
      await setDoc(
        doc(f, 'chats', 'g1', 'messages', 'm0'),
        mensajeCitado({ body: largo }),
      );
    });

    const buena = mensajeConCita();

    buena.replyTo = { messageId: 'm0', senderName: 'bob', texto: largo };

    await assertSucceeds(
      setDoc(doc(collection(db(ALICE), 'chats', 'g1', 'messages'), 'm1'), buena),
    );
  });

  it('una foto se cita con el mismo texto canónico', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'g1'), nuevoChat(ALICE, [ALICE, BOB]));
      await setDoc(
        doc(f, 'chats', 'g1', 'messages', 'm0'),
        mensajeCitado({
          body: '',
          type: 'image',
          imageUrl: 'https://example.com/foto.webp',
        }),
      );
    });

    const buena = mensajeConCita();

    buena.replyTo = { messageId: 'm0', senderName: 'bob', texto: '[Foto]' };

    await assertSucceeds(
      setDoc(doc(collection(db(ALICE), 'chats', 'g1', 'messages'), 'm1'), buena),
    );
  });

  it('una encuesta se cita con su pregunta canónica', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'g1'), nuevoChat(ALICE, [ALICE, BOB]));
      await setDoc(
        doc(f, 'chats', 'g1', 'messages', 'm0'),
        mensajeCitado({
          body: '',
          type: 'poll',
          poll: {
            question: '¿Sí o no?',
            options: { o1: 'Sí', o2: 'No' },
            isClosed: false,
          },
        }),
      );
    });

    const buena = mensajeConCita();

    buena.replyTo = {
      messageId: 'm0',
      senderName: 'bob',
      texto: '📊 ¿Sí o no?',
    };

    await assertSucceeds(
      setDoc(doc(collection(db(ALICE), 'chats', 'g1', 'messages'), 'm1'), buena),
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

// ═══════════════════════════════════════════════════════════
// CUPO DE SOLICITUDES (rateLimits)
// ═══════════════════════════════════════════════════════════

describe('Cupo de solicitudes de chat', () => {
  it('la primera solicitud crea el libro con un hueco', async () => {
    await assertSucceeds(crearSolicitud(db(ALICE), ALICE, BOB));

    const libro = await assertSucceeds(
      getDoc(doc(db(ALICE), 'rateLimits', ALICE)),
    );
    assert.strictEqual(libro.exists(), true);
    assert.strictEqual(libro.data().count, 1);
    assert.strictEqual(libro.data().ultimaSolicitudId, idDirecto(ALICE, BOB));
  });

  it('la segunda solicitud suma exactamente un hueco', async () => {
    await assertSucceeds(crearSolicitud(db(ALICE), ALICE, BOB));
    await assertSucceeds(crearSolicitud(db(ALICE), ALICE, CARA));

    const libro = await getDoc(doc(db(ALICE), 'rateLimits', ALICE));
    assert.strictEqual(libro.data().count, 2);
  });

  it('sin escribir el libro, la solicitud se rechaza', async () => {
    await assertFails(
      setDoc(
        doc(db(ALICE), 'chatRequests', idDirecto(ALICE, BOB)),
        nuevaSolicitud(ALICE, BOB),
      ),
    );
  });

  it('no vale con escribir el libro por separado', async () => {
    await assertSucceeds(
      setDoc(doc(db(ALICE), 'rateLimits', ALICE), {
        count: 1,
        windowStart: serverTimestamp(),
        ultimaSolicitud: serverTimestamp(),
        ultimaSolicitudId: idDirecto(ALICE, BOB),
      }),
    );

    // El libro ya está, pero ESTA transacción no lo ha incrementado.
    await assertFails(
      setDoc(
        doc(db(ALICE), 'chatRequests', idDirecto(ALICE, BOB)),
        nuevaSolicitud(ALICE, BOB),
      ),
    );
  });

  it('dos solicitudes no pueden compartir un solo hueco', async () => {
    const alice = db(ALICE);
    const idBob = idDirecto(ALICE, BOB);
    const idCara = idDirecto(ALICE, CARA);

    await assertFails(
      runTransaction(alice, async (tx) => {
        tx.set(
          doc(alice, 'chatRequests', idBob),
          nuevaSolicitud(ALICE, BOB),
        );
        tx.set(
          doc(alice, 'chatRequests', idCara),
          nuevaSolicitud(ALICE, CARA),
        );
        tx.set(doc(alice, 'rateLimits', ALICE), {
          count: 1,
          windowStart: serverTimestamp(),
          ultimaSolicitud: serverTimestamp(),
          ultimaSolicitudId: idBob,
        });
      }),
    );
  });

  it('no se puede abrir la solicitud y sumar dos huecos a la vez', async () => {
    const alice = db(ALICE);
    await assertFails(
      runTransaction(alice, async (tx) => {
        tx.set(
          doc(alice, 'chatRequests', idDirecto(ALICE, BOB)),
          nuevaSolicitud(ALICE, BOB),
        );
        tx.set(doc(alice, 'rateLimits', ALICE), {
          count: 2,
          windowStart: serverTimestamp(),
          ultimaSolicitud: serverTimestamp(),
          ultimaSolicitudId: idDirecto(ALICE, BOB),
        });
      }),
    );
  });

  it('no se puede reiniciar el contador antes de 24 h', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'rateLimits', ALICE), {
        count: 5,
        windowStart: Timestamp.fromDate(new Date(Date.now() - 60 * 60 * 1000)),
      });
    });

    const alice = db(ALICE);
    await assertFails(
      runTransaction(alice, async (tx) => {
        await tx.get(doc(alice, 'rateLimits', ALICE));
        tx.set(
          doc(alice, 'chatRequests', idDirecto(ALICE, BOB)),
          nuevaSolicitud(ALICE, BOB),
        );
        tx.set(doc(alice, 'rateLimits', ALICE), {
          count: 1,
          windowStart: serverTimestamp(),
          ultimaSolicitud: serverTimestamp(),
          ultimaSolicitudId: idDirecto(ALICE, BOB),
        });
      }),
    );
  });

  it('sí se puede reiniciar cuando la ventana caducó', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'rateLimits', ALICE), {
        count: 5,
        windowStart: Timestamp.fromDate(
          new Date(Date.now() - 25 * 60 * 60 * 1000),
        ),
      });
    });

    await assertSucceeds(crearSolicitud(db(ALICE), ALICE, BOB));

    const libro = await getDoc(doc(db(ALICE), 'rateLimits', ALICE));
    assert.strictEqual(libro.data().count, 1);
  });

  it('con 19 huecos usados, la solicitud 20 pasa y deja el libro en 20', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'rateLimits', ALICE), {
        count: 19,
        windowStart: Timestamp.now(),
      });
    });

    await assertSucceeds(crearSolicitud(db(ALICE), ALICE, BOB));

    const libro = await getDoc(doc(db(ALICE), 'rateLimits', ALICE));
    assert.strictEqual(libro.data().count, 20);
  });

  it('el hueco 21 no se puede consumir', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'rateLimits', ALICE), {
        count: 20,
        windowStart: Timestamp.now(),
      });
    });

    const alice = db(ALICE);
    await assertFails(
      runTransaction(alice, async (tx) => {
        await tx.get(doc(alice, 'rateLimits', ALICE));
        tx.set(
          doc(alice, 'chatRequests', idDirecto(ALICE, BOB)),
          nuevaSolicitud(ALICE, BOB),
        );
        tx.update(doc(alice, 'rateLimits', ALICE), {
          count: 21,
          ultimaSolicitud: serverTimestamp(),
          ultimaSolicitudId: idDirecto(ALICE, BOB),
        });
      }),
    );
  });

  it('solo el dueño lee y escribe su libro', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'rateLimits', ALICE), {
        count: 1,
        windowStart: Timestamp.now(),
      });
    });

    await assertSucceeds(getDoc(doc(db(ALICE), 'rateLimits', ALICE)));
    await assertFails(getDoc(doc(db(BOB), 'rateLimits', ALICE)));
    await assertFails(getDocs(collection(db(ALICE), 'rateLimits')));

    await assertFails(
      updateDoc(doc(db(BOB), 'rateLimits', ALICE), { count: 2 }),
    );
    await assertFails(deleteDoc(doc(db(ALICE), 'rateLimits', ALICE)));
  });

  it('el libro no admite campos de más', async () => {
    const alice = db(ALICE);
    await assertFails(
      runTransaction(alice, async (tx) => {
        await tx.get(doc(alice, 'rateLimits', ALICE));
        tx.set(doc(alice, 'rateLimits', ALICE), {
          count: 1,
          windowStart: serverTimestamp(),
          ultimaSolicitud: serverTimestamp(),
          ultimaSolicitudId: idDirecto(ALICE, BOB),
          extra: true,
        });
      }),
    );
  });
});

// ═══════════════════════════════════════════════════════════
// BLOQUEOS Y SOLICITUDES
// ═══════════════════════════════════════════════════════════

describe('Bloqueos y solicitudes de chat', () => {
  async function bloquear(a, b) {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'users', a, 'blocked', b), {
        blockedAt: Timestamp.now(),
      });
    });
  }

  it('quien bloqueó no puede mandar una solicitud directa', async () => {
    await bloquear(ALICE, BOB);

    await assertFails(crearSolicitud(db(ALICE), ALICE, BOB));
  });

  it('tampoco puede mandarla si es la otra persona quien le bloqueó', async () => {
    await bloquear(BOB, ALICE);

    await assertFails(crearSolicitud(db(ALICE), ALICE, BOB));
  });

  it('con el bloqueo deshecho, la solicitud vuelve a pasar', async () => {
    await bloquear(ALICE, BOB);
    await assertFails(crearSolicitud(db(ALICE), ALICE, BOB));

    await sembrar(async (f) => {
      await deleteDoc(doc(f, 'users', ALICE, 'blocked', BOB));
    });

    await assertSucceeds(crearSolicitud(db(ALICE), ALICE, BOB));
  });

  it('no se puede pedir entrar en el grupo de quien te bloqueó', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'g1'), nuevoChat(BOB, [BOB]));
      await setDoc(doc(f, 'users', BOB, 'blocked', ALICE), {
        blockedAt: Timestamp.now(),
      });
    });

    await assertFails(
      crearSolicitud(db(ALICE), ALICE, BOB, { type: 'group', groupId: 'g1' }),
    );
  });

  it('el dueño no puede invitar a quien le bloqueó', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'g1'), nuevoChat(ALICE, [ALICE]));
      await setDoc(doc(f, 'users', BOB, 'blocked', ALICE), {
        blockedAt: Timestamp.now(),
      });
    });

    await assertFails(crearInvitacion(db(ALICE), ALICE, BOB, 'g1'));
  });

  it('el bloqueo también impide reabrir una solicitud cancelada', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chatRequests', idDirecto(ALICE, BOB)), {
        ...nuevaSolicitud(ALICE, BOB),
        status: 'cancelled',
        respondedAt: Timestamp.now(),
        respondedBy: ALICE,
      });
    });
    await bloquear(BOB, ALICE);

    const alice = db(ALICE);
    await assertFails(
      reabrirSolicitud(
        alice,
        ALICE,
        doc(alice, 'chatRequests', idDirecto(ALICE, BOB)),
      ),
    );
  });
});
