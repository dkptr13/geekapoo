/**
 * Pruebas de las reglas de MODERACIÓN de clubes.
 *
 * Lo que se comprueba, que es justo lo que un usuario normal
 * podría intentar saltarse:
 *
 *   1. Un miembro normal NO puede silenciar ni banear a nadie.
 *   2. Un moderador puede silenciar a un miembro, pero banear
 *      solo si el propietario se lo ha habilitado.
 *   3. Nadie se sanciona a sí mismo, ni a alguien de su rango o
 *      superior (ni un moderador a otro moderador).
 *   4. La sanción no se puede modificar ni borrar a la brava.
 *   5. Un SANCIADO no puede escribir en el chat del club, y sí
 *      puede seguir en sus chats privados.
 *   6. Un baneo vigente impide reincorporarse al club.
 *   7. Moderar un club no afecta a otros clubes.
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
  serverTimestamp,
  Timestamp,
} = require('firebase/firestore');

const fs = require('fs');
const path = require('path');

const RULES = fs.readFileSync(
  path.join(__dirname, '..', 'firestore.rules'),
  'utf8',
);
const PROJECT = 'demo-geekapoo-moderacion';

const DUENO = 'dueno';
const MOD = 'moderador';
const OTRO_MOD = 'otro-mod';
const ADMIN = 'admin';
const BOB = 'bob';
const CARA = 'cara';
const AJENO = 'ajeno';

let testEnv;

function db(uid) {
  return testEnv.authenticatedContext(uid).firestore();
}

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
    slug: 'club-prueba',
    name: 'Club de prueba',
    description: 'Un club para probar las reglas de moderación.',
    category: 'anime-manga',
    coverUrl: '',
    iconUrl: '',
    rules: 'Respeta a los demás.',
    accessType: 'public',
    ownerId: DUENO,
    moderatorIds: [MOD, OTRO_MOD],
    adminIds: [ADMIN],
    memberIds: [DUENO, ADMIN, MOD, OTRO_MOD, BOB, CARA],
    members: {
      [DUENO]: { uid: DUENO, role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
      [ADMIN]: { uid: ADMIN, role: 'admin', joinedAt: '2026-01-01T00:00:00.000Z' },
      [MOD]: { uid: MOD, role: 'moderator', joinedAt: '2026-01-02T00:00:00.000Z' },
      [OTRO_MOD]: { uid: OTRO_MOD, role: 'moderator', joinedAt: '2026-01-02T00:00:00.000Z' },
      [BOB]: { uid: BOB, role: 'member', joinedAt: '2026-01-03T00:00:00.000Z' },
      [CARA]: { uid: CARA, role: 'member', joinedAt: '2026-01-03T00:00:00.000Z' },
    },
    memberCount: 6,
    chatId: 'chat-club',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  };
}

function nuevaSancion(extra = {}) {
  return {
    clubId: 'club-prueba',
    tipo: 'silencio',
    objetivoUid: BOB,
    objetivoNombre: 'bob',
    motivo: 'Insultos reiterados a otros miembros.',
    inicio: serverTimestamp(),
    expira: Timestamp.fromDate(new Date(Date.now() + 3600_000)),
    permanente: false,
    aplicadaPor: MOD,
    aplicadaPorNombre: 'moderador',
    aplicadaPorRango: 'moderator',
    ...extra,
  };
}

function nuevoHistorial(extra = {}) {
  return {
    clubId: 'club-prueba',
    tipo: 'silencio',
    objetivoUid: BOB,
    objetivoNombre: 'bob',
    motivo: 'Insultos reiterados a otros miembros.',
    inicio: '2026-10-19T10:00:00.000Z',
    fin: '2026-10-19T11:00:00.000Z',
    permanente: false,
    aplicadaPor: MOD,
    aplicadaPorNombre: 'moderador',
    aplicadaPorRango: 'moderator',
    retirada: false,
    createdAt: serverTimestamp(),
    ...extra,
  };
}

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT,
    firestore: { rules: RULES, host: '127.0.0.1', port: 8080 },
  });
});

after(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  for (const uid of [DUENO, ADMIN, MOD, OTRO_MOD, BOB, CARA, AJENO]) {
    await crearUsuario(uid);
  }
  await sembrar(async (f) => {
    await setDoc(doc(f, 'clubs', 'club-prueba'), nuevoClub());
    // El chat del club, con sus miembros.
    await setDoc(doc(f, 'chats', 'chat-club'), {
      type: 'club',
      name: 'Club de prueba',
      slug: 'club-prueba',
      channelId: 'general',
      memberIds: [DUENO, ADMIN, MOD, OTRO_MOD, BOB, CARA],
      ownerId: DUENO,
    });
    // Un chat privado de BOB, que NO debe verse afectado.
    await setDoc(doc(f, 'chats', 'chat-privado'), {
      type: 'direct',
      name: 'privado',
      memberIds: [BOB, CARA],
      ownerId: BOB,
    });
  });
});

describe('Sanciones: quién puede aplicarlas', () => {
  it('un miembro normal NO puede silenciar a nadie', async () => {
    await assertFails(
      setDoc(doc(db(BOB), 'clubs', 'club-prueba', 'sancion', CARA), nuevaSancion({
        objetivoUid: CARA,
        aplicadaPor: BOB,
        aplicadaPorRango: 'member',
      })),
    );
  });

  it('un miembro normal NO puede banear a nadie', async () => {
    await assertFails(
      setDoc(doc(db(BOB), 'clubs', 'club-prueba', 'sancion', CARA), nuevaSancion({
        tipo: 'baneo',
        objetivoUid: CARA,
        aplicadaPor: BOB,
        aplicadaPorRango: 'member',
      })),
    );
  });

  it('un moderador SÍ puede silenciar a un miembro', async () => {
    await assertSucceeds(
      setDoc(doc(db(MOD), 'clubs', 'club-prueba', 'sancion', BOB), nuevaSancion()),
    );
  });

  it('un moderador NO puede banear si el propietario no lo habilitó', async () => {
    await assertFails(
      setDoc(doc(db(MOD), 'clubs', 'club-prueba', 'sancion', BOB), nuevaSancion({
        tipo: 'baneo',
      })),
    );
  });

  it('un moderador SÍ puede banear con el permiso del propietario', async () => {
    await sembrar(async (f) => {
      await updateDoc(doc(f, 'clubs', 'club-prueba'), {
        permisos: { moderadorBanea: true, moderadorLevanta: true },
      });
    });
    await assertSucceeds(
      setDoc(doc(db(MOD), 'clubs', 'club-prueba', 'sancion', BOB), nuevaSancion({
        tipo: 'baneo',
      })),
    );
  });

  it('nadie se sanciona a sí mismo', async () => {
    await assertFails(
      setDoc(doc(db(MOD), 'clubs', 'club-prueba', 'sancion', MOD), nuevaSancion({
        objetivoUid: MOD,
        aplicadaPor: MOD,
      })),
    );
  });

  it('un moderador NO puede sancionar a otro moderador', async () => {
    await assertFails(
      setDoc(doc(db(MOD), 'clubs', 'club-prueba', 'sancion', OTRO_MOD), nuevaSancion({
        objetivoUid: OTRO_MOD,
      })),
    );
  });

  it('un admin NO puede sancionar a otro admin', async () => {
    await assertFails(
      setDoc(doc(db(ADMIN), 'clubs', 'club-prueba', 'sancion', ADMIN), nuevaSancion({
        objetivoUid: ADMIN,
        aplicadaPor: ADMIN,
        aplicadaPorRango: 'admin',
      })),
    );
  });

  it('el dueño NO puede sancionar al propietario (sí a un admin)', async () => {
    await assertFails(
      setDoc(doc(db(DUENO), 'clubs', 'club-prueba', 'sancion', DUENO), nuevaSancion({
        objetivoUid: DUENO,
        aplicadaPor: DUENO,
        aplicadaPorRango: 'owner',
      })),
    );
    await assertSucceeds(
      setDoc(doc(db(DUENO), 'clubs', 'club-prueba', 'sancion', ADMIN), nuevaSancion({
        objetivoUid: ADMIN,
        aplicadaPor: DUENO,
        aplicadaPorRango: 'owner',
      })),
    );
  });

  it('un moderador de OTRO club no sanciona en este', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'clubs', 'otro-club'), {
        ...nuevoClub({ slug: 'otro-club' }),
        ownerId: AJENO,
        moderatorIds: [AJENO],
        adminIds: [],
        memberIds: [AJENO],
        members: { [AJENO]: { uid: AJENO, role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' } },
        memberCount: 1,
      });
    });
    await assertFails(
      setDoc(doc(db(AJENO), 'clubs', 'club-prueba', 'sancion', BOB), nuevaSancion({
        aplicadaPor: AJENO,
        aplicadaPorRango: 'owner',
      })),
    );
  });
});

describe('Sanciones: no se pueden falsear', () => {
  it('el expediente no se puede editar ni borrar', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'clubs', 'club-prueba', 'sanciones', 'hist-1'), nuevoHistorial());
    });
    await assertFails(
      updateDoc(doc(db(MOD), 'clubs', 'club-prueba', 'sanciones', 'hist-1'), {
        motivo: 'Motivo cambiado a posteriori',
      }),
    );
    await assertFails(deleteDoc(doc(db(DUENO), 'clubs', 'club-prueba', 'sanciones', 'hist-1')));
  });

  it('no se puede escribir un expediente con el autor puesto a otro', async () => {
    await assertFails(
      setDoc(doc(db(MOD), 'clubs', 'club-prueba', 'sanciones', 'hist-2'), nuevoHistorial({
        aplicadaPor: DUENO,
      })),
    );
  });

  it('un miembro normal no lee el historial de sanciones de OTROS', async () => {
    await sembrar(async (f) => {
      // El historial es de CARA, no de BOB: BOB es un miembro
      // normal y no tiene por qué ver las sanciones de otro.
      await setDoc(doc(f, 'clubs', 'club-prueba', 'sanciones', 'hist-3'), nuevoHistorial({
        objetivoUid: CARA,
        objetivoNombre: 'cara',
      }));
    });
    await assertFails(getDoc(doc(db(BOB), 'clubs', 'club-prueba', 'sanciones', 'hist-3')));
  });

  it('el sancionado SÍ lee su propia sanción (para ver el motivo)', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'clubs', 'club-prueba', 'sancion', BOB), nuevaSancion());
    });
    await assertSucceeds(getDoc(doc(db(BOB), 'clubs', 'club-prueba', 'sancion', BOB)));
  });
});

describe('Permisos delegables en el servidor', () => {
  it('un admin NO puede banear permanentemente sin permiso', async () => {
    await assertFails(
      setDoc(doc(db(ADMIN), 'clubs', 'club-prueba', 'sancion', BOB), nuevaSancion({
        objetivoUid: BOB,
        tipo: 'baneo',
        permanente: true,
        expira: null,
        aplicadaPor: ADMIN,
        aplicadaPorRango: 'admin',
      })),
    );
  });

  it('un admin SÍ puede banear permanentemente con el permiso', async () => {
    await sembrar(async (f) => {
      await updateDoc(doc(f, 'clubs', 'club-prueba'), {
        permisos: { adminBaneaPermanente: true },
      });
    });
    await assertSucceeds(
      setDoc(doc(db(ADMIN), 'clubs', 'club-prueba', 'sancion', BOB), nuevaSancion({
        objetivoUid: BOB,
        tipo: 'baneo',
        permanente: true,
        expira: null,
        aplicadaPor: ADMIN,
        aplicadaPorRango: 'admin',
      })),
    );
  });

  it('un moderador NUNCA puede banear permanentemente', async () => {
    await sembrar(async (f) => {
      await updateDoc(doc(f, 'clubs', 'club-prueba'), {
        permisos: { moderadorBanea: true, moderadorBaneoPermanente: true },
      });
    });
    await assertFails(
      setDoc(doc(db(MOD), 'clubs', 'club-prueba', 'sancion', BOB), nuevaSancion({
        objetivoUid: BOB,
        tipo: 'baneo',
        permanente: true,
        expira: null,
      })),
    );
  });

  it('un admin NO puede editar el aspecto del club sin permiso', async () => {
    await assertFails(
      updateDoc(doc(db(ADMIN), 'clubs', 'club-prueba'), {
        name: 'Nombre cambiado por un admin',
      }),
    );
  });

  it('un admin SÍ puede editarlo con el permiso', async () => {
    await sembrar(async (f) => {
      await updateDoc(doc(f, 'clubs', 'club-prueba'), {
        permisos: { adminEditaAspecto: true },
      });
    });
    await assertSucceeds(
      updateDoc(doc(db(ADMIN), 'clubs', 'club-prueba'), {
        name: 'Nombre cambiado por un admin con permiso',
      }),
    );
  });

  it('un admin NUNCA puede tocar los roles ni los permisos', async () => {
    await sembrar(async (f) => {
      await updateDoc(doc(f, 'clubs', 'club-prueba'), {
        permisos: { adminEditaAspecto: true },
      });
    });
    await assertFails(
      updateDoc(doc(db(ADMIN), 'clubs', 'club-prueba'), {
        moderatorIds: [BOB],
      }),
    );
    await assertFails(
      updateDoc(doc(db(ADMIN), 'clubs', 'club-prueba'), {
        adminIds: [BOB],
      }),
    );
    await assertFails(
      updateDoc(doc(db(ADMIN), 'clubs', 'club-prueba'), {
        ownerId: BOB,
      }),
    );
    await assertFails(
      updateDoc(doc(db(ADMIN), 'clubs', 'club-prueba'), {
        permisos: { adminBaneaPermanente: true },
      }),
    );
  });

  it('un moderador no puede tocar los roles ni los permisos', async () => {
    await assertFails(
      updateDoc(doc(db(MOD), 'clubs', 'club-prueba'), {
        moderatorIds: [BOB],
      }),
    );
    await assertFails(
      updateDoc(doc(db(MOD), 'clubs', 'club-prueba'), {
        permisos: { moderadorBanea: true },
      }),
    );
  });

  it('el dueño puede cambiar los permisos', async () => {
    await assertSucceeds(
      updateDoc(doc(db(DUENO), 'clubs', 'club-prueba'), {
        permisos: { moderadorBanea: true, adminExpulsa: false },
      }),
    );
  });

  it('un admin puede advertir (aviso sin sanción)', async () => {
    await assertSucceeds(
      setDoc(doc(collection(db(ADMIN), 'clubs', 'club-prueba', 'sanciones')), {
        ...nuevoHistorial({
          tipo: 'advertencia',
          fin: null,
          permanente: false,
          aplicadaPor: ADMIN,
          aplicadaPorRango: 'admin',
        }),
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('pero el aviso no bloquea: la persona sigue escribiendo', async () => {
    await assertSucceeds(
      setDoc(doc(db(BOB), 'chats', 'chat-club', 'messages', 'm-aviso'), {
        chatId: 'chat-club',
        senderId: BOB,
        senderName: 'bob',
        senderAvatar: '',
        body: 'sigo aqui',
        type: 'text',
        createdAt: serverTimestamp(),
      }),
    );
  });
});
describe('Sanciones: efecto sobre el chat', () => {
  it('un silenciado NO puede escribir en el chat del club', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'clubs', 'club-prueba', 'sancion', BOB), nuevaSancion());
    });
    await assertFails(
      setDoc(doc(db(BOB), 'chats', 'chat-club', 'messages', 'm1'), {
        chatId: 'chat-club',
        senderId: BOB,
        senderName: 'bob',
        senderAvatar: '',
        body: 'hola',
        type: 'text',
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('el silenciado SÍ puede escribir en sus chats privados', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'clubs', 'club-prueba', 'sancion', BOB), nuevaSancion());
    });
    await assertSucceeds(
      setDoc(doc(db(BOB), 'chats', 'chat-privado', 'messages', 'm2'), {
        chatId: 'chat-privado',
        senderId: BOB,
        senderName: 'bob',
        senderAvatar: '',
        body: 'hola',
        type: 'text',
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('una sanción CADUCADA ya no bloquea', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'clubs', 'club-prueba', 'sancion', BOB), nuevaSancion({
        expira: Timestamp.fromDate(new Date(Date.now() - 60_000)),
      }));
    });
    await assertSucceeds(
      setDoc(doc(db(BOB), 'chats', 'chat-club', 'messages', 'm3'), {
        chatId: 'chat-club',
        senderId: BOB,
        senderName: 'bob',
        senderAvatar: '',
        body: 'hola',
        type: 'text',
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('un baneo VIGENTE impide reincorporarse al club', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'clubs', 'club-prueba', 'sancion', CARA), nuevaSancion({
        objetivoUid: CARA,
        tipo: 'baneo',
        permanente: true,
        expira: null,
      }));
      // Y se la saca del club, como hace la web.
      await updateDoc(doc(f, 'clubs', 'club-prueba'), {
        memberIds: [DUENO, ADMIN, MOD, OTRO_MOD, BOB],
        memberCount: 5,
      });
    });
    await assertFails(
      updateDoc(doc(db(CARA), 'clubs', 'club-prueba'), {
        memberIds: [DUENO, ADMIN, MOD, OTRO_MOD, BOB, CARA],
        memberCount: 6,
        members: {
          [DUENO]: { uid: DUENO, role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
          [ADMIN]: { uid: ADMIN, role: 'admin', joinedAt: '2026-01-01T00:00:00.000Z' },
          [MOD]: { uid: MOD, role: 'moderator', joinedAt: '2026-01-02T00:00:00.000Z' },
          [OTRO_MOD]: { uid: OTRO_MOD, role: 'moderator', joinedAt: '2026-01-02T00:00:00.000Z' },
          [BOB]: { uid: BOB, role: 'member', joinedAt: '2026-01-03T00:00:00.000Z' },
          [CARA]: { uid: CARA, role: 'member', joinedAt: '2026-01-03T00:00:00.000Z' },
        },
      }),
    );
  });

  it('moderar un club NO afecta a otro club', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'clubs', 'otro-club'), {
        ...nuevoClub({ slug: 'otro-club' }),
        ownerId: AJENO,
        moderatorIds: [],
        adminIds: [],
        memberIds: [AJENO, BOB],
        members: {
          [AJENO]: { uid: AJENO, role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
          [BOB]: { uid: BOB, role: 'member', joinedAt: '2026-01-03T00:00:00.000Z' },
        },
        memberCount: 2,
        chatId: 'chat-otro',
      });
      await setDoc(doc(f, 'chats', 'chat-otro'), {
        type: 'club',
        name: 'Otro club',
        slug: 'otro-club',
        channelId: 'general',
        memberIds: [AJENO, BOB],
        ownerId: AJENO,
      });
      await setDoc(doc(f, 'clubs', 'club-prueba', 'sancion', BOB), nuevaSancion());
    });
    // BOB está sancionado en `club-prueba`, pero escribe sin
    // problema en `otro-club`.
    await assertSucceeds(
      setDoc(doc(db(BOB), 'chats', 'chat-otro', 'messages', 'm4'), {
        chatId: 'chat-otro',
        senderId: BOB,
        senderName: 'bob',
        senderAvatar: '',
        body: 'hola',
        type: 'text',
        createdAt: serverTimestamp(),
      }),
    );
  });
});

describe('Sanciones: levantarlas', () => {
  it('el que la aplicó puede levantarla', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'clubs', 'club-prueba', 'sancion', BOB), nuevaSancion());
    });
    await assertSucceeds(deleteDoc(doc(db(MOD), 'clubs', 'club-prueba', 'sancion', BOB)));
  });

  it('el dueño puede levantar la de un moderador', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'clubs', 'club-prueba', 'sancion', BOB), nuevaSancion());
    });
    await assertSucceeds(deleteDoc(doc(db(DUENO), 'clubs', 'club-prueba', 'sancion', BOB)));
  });

  // El caso que más dolía: el dueño (o el admin) que aplicó la
  // sanción y luego quiere deshacerla. Con la regla antigua
  // («nadie toca lo de alguien de su rango») el dueño no podía
  // levantar la suya, aunque sea la máxima autoridad.
  it('el dueño puede levantar la sanción que él mismo aplicó', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'clubs', 'club-prueba', 'sancion', BOB), nuevaSancion({
        aplicadaPor: DUENO,
        aplicadaPorRango: 'owner',
      }));
    });
    await assertSucceeds(deleteDoc(doc(db(DUENO), 'clubs', 'club-prueba', 'sancion', BOB)));
  });

  it('un admin puede levantar la sanción que él mismo aplicó', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'clubs', 'club-prueba', 'sancion', BOB), nuevaSancion({
        aplicadaPor: ADMIN,
        aplicadaPorRango: 'admin',
      }));
    });
    await assertSucceeds(deleteDoc(doc(db(ADMIN), 'clubs', 'club-prueba', 'sancion', BOB)));
  });

  // El servicio NO borra solo: escribe tres cosas en un lote
  // (borra la sanción, actualiza el club y deja entrada en el
  // historial). Si una de las tres la rechazan las reglas, el
  // lote entero falla y el botón no hace nada. Estos tests
  // reproducen el lote tal cual, que es donde se escondía el
  // fallo.
  it('el dueño puede levantar una sanción con el LOTE completo', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'clubs', 'club-prueba', 'sancion', BOB), nuevaSancion());
    });
    const f = db(DUENO);
    const batch = f.batch();
    batch.delete(doc(f, 'clubs', 'club-prueba', 'sancion', BOB));
    batch.update(doc(f, 'clubs', 'club-prueba'), {
      members: nuevoClub().members,
      memberIds: nuevoClub().memberIds,
      memberCount: 6,
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(collection(f, 'clubs', 'club-prueba', 'sanciones')), {
      clubId: 'club-prueba',
      accion: 'retirada',
      tipo: 'silencio',
      objetivoUid: BOB,
      objetivoNombre: 'bob',
      aplicadoSobreId: 'san-1',
      motivo: 'Sin motivo indicado.',
      inicio: '2026-10-19T10:00:00.000Z',
      fin: '2026-10-19T11:00:00.000Z',
      permanente: false,
      aplicadaPor: DUENO,
      aplicadaPorNombre: 'dueno',
      aplicadaPorRango: 'owner',
      retirada: true,
      createdAt: serverTimestamp(),
    });
    await assertSucceeds(batch.commit());
  });

  it('un moderador puede levantar SU sanción con el LOTE completo', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'clubs', 'club-prueba', 'sancion', BOB), nuevaSancion());
    });
    const f = db(MOD);
    const batch = f.batch();
    batch.delete(doc(f, 'clubs', 'club-prueba', 'sancion', BOB));
    batch.update(doc(f, 'clubs', 'club-prueba'), {
      members: {
        ...nuevoClub().members,
        [BOB]: { uid: BOB, role: 'member', joinedAt: '2026-01-03T00:00:00.000Z' },
      },
      memberIds: nuevoClub().memberIds,
      memberCount: 6,
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(collection(f, 'clubs', 'club-prueba', 'sanciones')), {
      clubId: 'club-prueba',
      accion: 'retirada',
      tipo: 'silencio',
      objetivoUid: BOB,
      objetivoNombre: 'bob',
      aplicadoSobreId: 'san-1',
      motivo: 'Sin motivo indicado.',
      inicio: '2026-10-19T10:00:00.000Z',
      fin: '2026-10-19T11:00:00.000Z',
      permanente: false,
      aplicadaPor: MOD,
      aplicadaPorNombre: 'moderador',
      aplicadaPorRango: 'moderator',
      retirada: true,
      createdAt: serverTimestamp(),
    });
    await assertSucceeds(batch.commit());
  });

  it('desbanear NO se puede hacer desde el cliente: lo hace la callable', async () => {
    await sembrar(async (f) => {
      // La persona está baneada: fuera de memberIds, sin ficha.
      await updateDoc(doc(f, 'clubs', 'club-prueba'), {
        memberIds: [DUENO, ADMIN, MOD, OTRO_MOD, CARA],
        memberCount: 5,
        members: {
          [DUENO]: { uid: DUENO, role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
          [ADMIN]: { uid: ADMIN, role: 'admin', joinedAt: '2026-01-01T00:00:00.000Z' },
          [MOD]: { uid: MOD, role: 'moderator', joinedAt: '2026-01-02T00:00:00.000Z' },
          [OTRO_MOD]: { uid: OTRO_MOD, role: 'moderator', joinedAt: '2026-01-02T00:00:00.000Z' },
          [CARA]: { uid: CARA, role: 'member', joinedAt: '2026-01-03T00:00:00.000Z' },
        },
      });
      await setDoc(doc(f, 'clubs', 'club-prueba', 'sancion', BOB), nuevaSancion({
        tipo: 'baneo',
        permanente: true,
        expira: null,
        rolPrevio: 'moderator',
      }));
    });
    const f = db(DUENO);
    const batch = f.batch();
    batch.delete(doc(f, 'clubs', 'club-prueba', 'sancion', BOB));
    batch.update(doc(f, 'clubs', 'club-prueba'), {
      members: {
        ...nuevoClub().members,
        [BOB]: { uid: BOB, role: 'moderator', joinedAt: '2026-10-19T10:00:00.000Z' },
      },
      memberIds: [...nuevoClub().memberIds],
      memberCount: 6,
      updatedAt: serverTimestamp(),
    });
    await assertFails(batch.commit());
  });

  it('un moderador NO puede levantar la de otro moderador sin permiso', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'clubs', 'club-prueba', 'sancion', BOB), nuevaSancion({
        aplicadaPor: OTRO_MOD,
      }));
    });
    await assertFails(deleteDoc(doc(db(MOD), 'clubs', 'club-prueba', 'sancion', BOB)));
  });

  it('un miembro normal no puede levantar nada', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'clubs', 'club-prueba', 'sancion', BOB), nuevaSancion());
    });
    await assertFails(deleteDoc(doc(db(BOB), 'clubs', 'club-prueba', 'sancion', BOB)));
  });
});
