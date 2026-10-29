/**
 * Pruebas del ÍNDICE DE CÓDIGOS DE GRUPO (`groupCodes`).
 *
 * Un código es una INVITACIÓN SECRETA, no un identificador público:
 *
 *   · con el código exacto se puede consultar a qué grupo apunta,
 *     pero solo con una cuenta autenticada y activa;
 *   · la colección NO se puede enumerar;
 *   · el índice solo lo crea el dueño del grupo, apuntando a un
 *     grupo real, con el contador real y con hora del servidor;
 *   · conocer el código no da acceso al chat: la entrada sigue
 *     pasando por una solicitud que acepta el dueño (y que la Cloud
 *     Function vuelve a validar al añadir al miembro);
 *   · un código no puede apuntar a un chat de club ni servir para
 *     saltarse una sanción o un baneo.
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
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} = require('firebase/firestore');

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const RULES = fs.readFileSync(
  path.join(__dirname, '..', 'firestore.rules'),
  'utf8',
);
const PROJECT = 'demo-geekapoo-group-codes';

const ALICE = 'alice'; // dueña del grupo de pruebas
const BOB = 'bob'; // miembro del grupo
const CARA = 'cara'; // cuenta activa, fuera del grupo
const ADMIN = 'admin'; // admin global
const BANEADO = 'baneado-bandera';
const BAN_REG = 'baneado-registro';
const NO_PROFILE = 'sin-perfil';

const GRUPO = 'g-alice';
const GRUPO_CARA = 'g-cara';
const GRUPO_BANEADO = 'g-baneado';
const CHAT_CLUB = 'c-club-privado';

const CODIGO = 'GRP-1A2B-3C4D-5E6F';
const CODIGO_CARA = 'GRP-9999-8888-7777';
const CODIGO_NUEVO = 'GRP-1234-ABCD-EF56';
const CODIGO_OTRO = 'GRP-0F0F-1E1E-2D2D';
const CODIGO_LEGACY = 'GRP-A1B2-C3D4';
const CODIGO_BANEADO = 'GRP-BBBB-CCCC-DDDD';

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

async function crearRestriccion(uid) {
  await sembrar(async (f) => {
    await setDoc(doc(f, 'accountRestrictions', uid), {
      uid,
      tipo: 'ban',
      activo: true,
      motivo: 'Prueba de baneo',
      fechaFin: null,
      creadoEn: '2026-01-01T00:00:00.000Z',
      actualizadoEn: '2026-01-01T00:00:00.000Z',
    });
  });
}

function nuevoChat(dueno, miembros, extra = {}) {
  return {
    type: 'group',
    name: 'Grupo de prueba',
    avatar: '',
    ownerId: dueno,
    memberIds: miembros,
    hiddenFor: [],
    lastMessage: '',
    lastMessageAt: serverTimestamp(),
    lastMessageSenderId: dueno,
    readAt: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  };
}

function codigoDe(dueno, groupId, extra = {}) {
  return {
    code: CODIGO,
    groupId,
    name: 'Grupo de prueba',
    ownerId: dueno,
    ownerName: dueno,
    memberCount: 2,
    createdAt: serverTimestamp(),
    ...extra,
  };
}

function solicitudGrupo(from, to, groupId, extra = {}) {
  return {
    type: 'group',
    fromId: from,
    fromName: from,
    fromAvatar: '',
    toId: to,
    groupId,
    groupName: 'Grupo de prueba',
    status: 'pending',
    createdAt: serverTimestamp(),
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

  await crearUsuario(ALICE);
  await crearUsuario(BOB);
  await crearUsuario(CARA);
  await crearUsuario(ADMIN, { role: 'admin' });
  await crearUsuario(BANEADO, { isBanned: true });
  await crearUsuario(BAN_REG);
  await crearRestriccion(BAN_REG);

  await sembrar(async (f) => {
    await setDoc(
      doc(f, 'chats', GRUPO),
      nuevoChat(ALICE, [ALICE, BOB], {
        name: 'Grupo de Alice',
        code: CODIGO,
      }),
    );
    await setDoc(
      doc(f, 'chats', GRUPO_CARA),
      nuevoChat(CARA, [CARA], {
        name: 'Grupo de Cara',
        code: CODIGO_CARA,
      }),
    );
    await setDoc(
      doc(f, 'chats', GRUPO_BANEADO),
      nuevoChat(BANEADO, [BANEADO], {
        name: 'Grupo de baneado',
        code: CODIGO_BANEADO,
      }),
    );
    await setDoc(doc(f, 'chats', CHAT_CLUB), {
      type: 'club',
      name: 'Club privado',
      slug: 'club-privado',
      ownerId: ALICE,
      memberIds: [ALICE],
      hiddenFor: [],
      lastMessage: '',
      lastMessageAt: '2026-01-01T00:00:00.000Z',
      lastMessageSenderId: ALICE,
      readAt: {},
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    await setDoc(
      doc(f, 'groupCodes', CODIGO),
      codigoDe(ALICE, GRUPO, { code: CODIGO, name: 'Grupo de Alice' }),
    );
    await setDoc(
      doc(f, 'groupCodes', CODIGO_CARA),
      codigoDe(CARA, GRUPO_CARA, {
        code: CODIGO_CARA,
        name: 'Grupo de Cara',
        memberCount: 1,
      }),
    );
    await setDoc(
      doc(f, 'groupCodes', CODIGO_LEGACY),
      codigoDe(ALICE, GRUPO, {
        code: CODIGO_LEGACY,
        name: 'Grupo de Alice',
      }),
    );
    await setDoc(
      doc(f, 'groupCodes', CODIGO_BANEADO),
      codigoDe(BANEADO, GRUPO_BANEADO, {
        code: CODIGO_BANEADO,
        name: 'Grupo de baneado',
        memberCount: 1,
      }),
    );
  });
});

// ═══════════════════════════════════════════════════════════
// LEER: GET CON EL CÓDIGO, NUNCA LIST
// ═══════════════════════════════════════════════════════════

describe('groupCodes: consultar la invitación', () => {
  it('una cuenta activa que no es miembro puede consultar el código exacto', async () => {
    const snap = await assertSucceeds(
      getDoc(doc(db(CARA), 'groupCodes', CODIGO)),
    );

    assert.strictEqual(snap.exists(), true);
    assert.strictEqual(snap.data().groupId, GRUPO);
    assert.strictEqual(snap.data().ownerId, ALICE);
  });

  it('un código antiguo de dos bloques se sigue pudiendo consultar', async () => {
    const snap = await assertSucceeds(
      getDoc(doc(db(CARA), 'groupCodes', CODIGO_LEGACY)),
    );

    assert.strictEqual(snap.exists(), true);
    assert.strictEqual(snap.data().groupId, GRUPO);
  });

  it('NO se puede enumerar la colección', async () => {
    await assertFails(getDocs(collection(db(CARA), 'groupCodes')));
  });

  it('tampoco se puede enumerar con una consulta por campo', async () => {
    await assertFails(
      getDocs(
        query(
          collection(db(CARA), 'groupCodes'),
          where('ownerId', '==', ALICE),
        ),
      ),
    );
  });

  it('un anónimo no puede leer ni siquiera el código exacto', async () => {
    await assertFails(getDoc(doc(anon(), 'groupCodes', CODIGO)));
    await assertFails(getDocs(collection(anon(), 'groupCodes')));
  });

  it('un baneado por la bandera visible no puede leer el código', async () => {
    await assertFails(getDoc(doc(db(BANEADO), 'groupCodes', CODIGO)));
  });

  it('un baneado por el registro duradero tampoco', async () => {
    await assertFails(getDoc(doc(db(BAN_REG), 'groupCodes', CODIGO)));
  });

  it('una cuenta sin perfil no puede leer el código', async () => {
    await assertFails(getDoc(doc(db(NO_PROFILE), 'groupCodes', CODIGO)));
  });

  it('un código inventado con formato válido no devuelve ningún grupo', async () => {
    const snap = await assertSucceeds(
      getDoc(doc(db(CARA), 'groupCodes', 'GRP-FFFF-FFFF-FFFF')),
    );

    assert.strictEqual(snap.exists(), false);
  });

  it('conocer el código NO da acceso al chat ni a sus mensajes', async () => {
    await assertSucceeds(getDoc(doc(db(CARA), 'groupCodes', CODIGO)));

    await assertFails(getDoc(doc(db(CARA), 'chats', GRUPO)));
    await assertFails(
      getDocs(collection(db(CARA), 'chats', GRUPO, 'messages')),
    );
  });

  it('conocer el código NO permite añadirse a uno mismo al chat', async () => {
    await assertFails(
      updateDoc(doc(db(CARA), 'chats', GRUPO), {
        memberIds: [ALICE, BOB, CARA],
      }),
    );
  });

  it('el camino autorizado sigue siendo pedir entrada al dueño', async () => {
    await assertSucceeds(
      setDoc(
        doc(db(CARA), 'chatRequests', `group_${GRUPO}_${CARA}`),
        solicitudGrupo(CARA, ALICE, GRUPO, {
          groupName: 'Grupo de Alice',
        }),
      ),
    );

    // La solicitud no crea el chat ni añade a nadie: eso lo hace la
    // Cloud Function al aceptarla, comprobando perfil y baneo.
    await assertFails(getDoc(doc(db(CARA), 'chats', GRUPO)));
  });

  it('un baneado no puede pedir entrada ni conociendo el código', async () => {
    await assertFails(getDoc(doc(db(BANEADO), 'groupCodes', CODIGO)));
    await assertFails(
      setDoc(
        doc(db(BANEADO), 'chatRequests', `group_${GRUPO}_${BANEADO}`),
        solicitudGrupo(BANEADO, ALICE, GRUPO, {
          groupName: 'Grupo de Alice',
        }),
      ),
    );
  });

  it('una solicitud de grupo no puede apuntar a un chat de club', async () => {
    await assertFails(
      setDoc(
        doc(db(CARA), 'chatRequests', `group_${CHAT_CLUB}_${CARA}`),
        solicitudGrupo(CARA, ALICE, CHAT_CLUB, {
          groupName: 'Club privado',
        }),
      ),
    );
  });
});

// ═══════════════════════════════════════════════════════════
// CREAR: FORMATO, DUEÑO, CHAT REAL Y CAMPOS MÍNIMOS
// ═══════════════════════════════════════════════════════════

describe('groupCodes: crear el índice', () => {
  it('el dueño puede crear el índice de un grupo nuevo y real', async () => {
    await assertSucceeds(
      setDoc(
        doc(db(ALICE), 'chats', 'g-nuevo'),
        nuevoChat(ALICE, [ALICE], {
          name: 'Grupo nuevo',
          code: CODIGO_NUEVO,
        }),
      ),
    );

    await assertSucceeds(
      setDoc(
        doc(db(ALICE), 'groupCodes', CODIGO_NUEVO),
        codigoDe(ALICE, 'g-nuevo', {
          code: CODIGO_NUEVO,
          name: 'Grupo nuevo',
          memberCount: 1,
        }),
      ),
    );
  });

  it('rechaza un código con formato antiguo o inventado', async () => {
    await assertFails(
      setDoc(
        doc(db(ALICE), 'groupCodes', 'GRP-1234-ABCD'),
        codigoDe(ALICE, GRUPO, {
          code: 'GRP-1234-ABCD',
          name: 'Grupo de Alice',
        }),
      ),
    );
    await assertFails(
      setDoc(
        doc(db(ALICE), 'groupCodes', 'GRP-123'),
        codigoDe(ALICE, GRUPO, { code: 'GRP-123' }),
      ),
    );
    await assertFails(
      setDoc(
        doc(db(ALICE), 'groupCodes', 'grp-1234-abcd-ef56'),
        codigoDe(ALICE, GRUPO, { code: 'grp-1234-abcd-ef56' }),
      ),
    );
  });

  it('el código del documento y el campo code tienen que coincidir', async () => {
    await assertFails(
      setDoc(
        doc(db(ALICE), 'groupCodes', CODIGO_NUEVO),
        codigoDe(ALICE, GRUPO, { code: CODIGO_OTRO }),
      ),
    );
  });

  it('ownerId tiene que ser el usuario que escribe y el dueño real del chat', async () => {
    await assertFails(
      setDoc(
        doc(db(ALICE), 'groupCodes', CODIGO_NUEVO),
        codigoDe(BOB, GRUPO, { code: CODIGO_NUEVO }),
      ),
    );

    await assertFails(
      setDoc(
        doc(db(CARA), 'groupCodes', CODIGO_NUEVO),
        codigoDe(CARA, GRUPO, { code: CODIGO_NUEVO }),
      ),
    );
  });

  it('no se puede crear un índice que apunte al grupo de otra persona', async () => {
    await assertFails(
      setDoc(
        doc(db(CARA), 'groupCodes', CODIGO_NUEVO),
        codigoDe(CARA, GRUPO, { code: CODIGO_NUEVO }),
      ),
    );
    await assertFails(
      setDoc(
        doc(db(ALICE), 'groupCodes', CODIGO_NUEVO),
        codigoDe(ALICE, GRUPO_CARA, { code: CODIGO_NUEVO }),
      ),
    );
  });

  it('groupId tiene que existir y ser un grupo, no un club ni un id inventado', async () => {
    await assertFails(
      setDoc(
        doc(db(ALICE), 'groupCodes', CODIGO_NUEVO),
        codigoDe(ALICE, 'g-inexistente', { code: CODIGO_NUEVO }),
      ),
    );
    await assertFails(
      setDoc(
        doc(db(ALICE), 'groupCodes', CODIGO_NUEVO),
        codigoDe(ALICE, CHAT_CLUB, {
          code: CODIGO_NUEVO,
          memberCount: 1,
        }),
      ),
    );
  });

  it('el contador tiene que ser el real del chat', async () => {
    await assertFails(
      setDoc(
        doc(db(ALICE), 'groupCodes', CODIGO_NUEVO),
        codigoDe(ALICE, GRUPO, {
          code: CODIGO_NUEVO,
          memberCount: 1,
        }),
      ),
    );
    await assertFails(
      setDoc(
        doc(db(ALICE), 'groupCodes', CODIGO_NUEVO),
        codigoDe(ALICE, GRUPO, {
          code: CODIGO_NUEVO,
          memberCount: 51,
        }),
      ),
    );
  });

  it('createdAt tiene que ser la hora del servidor', async () => {
    await assertFails(
      setDoc(
        doc(db(ALICE), 'groupCodes', CODIGO_NUEVO),
        codigoDe(ALICE, GRUPO, {
          code: CODIGO_NUEVO,
          createdAt: '2026-01-01T00:00:00.000Z',
        }),
      ),
    );
  });

  it('no se pueden guardar campos de más', async () => {
    await assertFails(
      setDoc(
        doc(db(ALICE), 'groupCodes', CODIGO_NUEVO),
        codigoDe(ALICE, GRUPO, {
          code: CODIGO_NUEVO,
          publico: true,
        }),
      ),
    );
  });

  it('un baneado no puede crear el índice aunque sea el dueño del grupo', async () => {
    await assertFails(
      setDoc(
        doc(db(BANEADO), 'groupCodes', CODIGO_NUEVO),
        codigoDe(BANEADO, GRUPO_BANEADO, {
          code: CODIGO_NUEVO,
          name: 'Grupo de baneado',
          memberCount: 1,
        }),
      ),
    );
  });

  it('una cuenta sin perfil no puede crear el índice', async () => {
    await sembrar(async (f) => {
      await setDoc(
        doc(f, 'chats', 'g-sin-perfil'),
        nuevoChat(NO_PROFILE, [NO_PROFILE], {
          name: 'Grupo sin perfil',
          code: CODIGO_NUEVO,
        }),
      );
    });

    await assertFails(
      setDoc(
        doc(db(NO_PROFILE), 'groupCodes', CODIGO_NUEVO),
        codigoDe(NO_PROFILE, 'g-sin-perfil', {
          code: CODIGO_NUEVO,
          name: 'Grupo sin perfil',
          memberCount: 1,
        }),
      ),
    );
  });

  it('un anónimo no puede crear el índice', async () => {
    await assertFails(
      setDoc(
        doc(anon(), 'groupCodes', CODIGO_NUEVO),
        codigoDe(ALICE, GRUPO, { code: CODIGO_NUEVO }),
      ),
    );
  });
});

// ═══════════════════════════════════════════════════════════
// ACTUALIZAR Y BORRAR: SOLO EL DUEÑO (O UN ADMIN)
// ═══════════════════════════════════════════════════════════

describe('groupCodes: modificar y borrar', () => {
  it('el dueño puede actualizar el contador', async () => {
    await assertSucceeds(
      updateDoc(doc(db(ALICE), 'groupCodes', CODIGO), {
        memberCount: 3,
      }),
    );
  });

  it('otro usuario no puede actualizarlo ni borrarlo', async () => {
    await assertFails(
      updateDoc(doc(db(CARA), 'groupCodes', CODIGO), {
        memberCount: 3,
      }),
    );
    await assertFails(
      setDoc(
        doc(db(CARA), 'groupCodes', CODIGO),
        codigoDe(CARA, GRUPO_CARA, { code: CODIGO }),
      ),
    );
    await assertFails(deleteDoc(doc(db(CARA), 'groupCodes', CODIGO)));
  });

  it('el dueño no puede cambiar el código, el grupo, el nombre ni añadir campos', async () => {
    await assertFails(
      updateDoc(doc(db(ALICE), 'groupCodes', CODIGO), {
        code: CODIGO_OTRO,
      }),
    );
    await assertFails(
      updateDoc(doc(db(ALICE), 'groupCodes', CODIGO), {
        groupId: GRUPO_CARA,
      }),
    );
    await assertFails(
      updateDoc(doc(db(ALICE), 'groupCodes', CODIGO), {
        name: 'Otro grupo',
      }),
    );
    await assertFails(
      updateDoc(doc(db(ALICE), 'groupCodes', CODIGO), {
        memberCount: 3,
        publico: true,
      }),
    );
  });

  it('el dueño no puede regalar el índice a un tercero', async () => {
    await assertFails(
      updateDoc(doc(db(ALICE), 'groupCodes', CODIGO), {
        ownerId: CARA,
        ownerName: CARA,
      }),
    );
  });

  it('un baneado no puede actualizar ni borrar su propio código', async () => {
    await assertFails(
      updateDoc(doc(db(BANEADO), 'groupCodes', CODIGO_BANEADO), {
        memberCount: 1,
      }),
    );
    await assertFails(
      deleteDoc(doc(db(BANEADO), 'groupCodes', CODIGO_BANEADO)),
    );
  });

  it('un admin activo puede reparar el contador', async () => {
    await assertSucceeds(
      updateDoc(doc(db(ADMIN), 'groupCodes', CODIGO), {
        memberCount: 3,
      }),
    );
  });

  it('el dueño puede borrar su código', async () => {
    await assertSucceeds(deleteDoc(doc(db(ALICE), 'groupCodes', CODIGO)));
  });
});
