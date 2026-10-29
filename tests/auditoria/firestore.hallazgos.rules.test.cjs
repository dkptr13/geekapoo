/**
 * AUDITORÍA DE SEGURIDAD — PRUEBAS DE REGRESIÓN DE LOS HALLAZGOS
 *
 * Estas pruebas reproducen los agujeros confirmados en la revisión
 * estática. Los casos P0 ya corregidos usan `assertFails`: si alguien
 * vuelve a abrir la puerta, la suite falla.
 *
 * Quedan DOS casos P1 abiertos y documentados con `assertSucceeds`:
 *
 *   · F4: `replyTo` no comprueba que el mensaje citado exista.
 *   · G1: no hay id determinista ni límite para las solicitudes.
 *
 * No entra en `npm run test:rules` porque vive en `tests/auditoria/`
 * (el script solo recoge `tests/*.test.cjs`). Se ejecuta a mano:
 *
 *   npx firebase emulators:exec --only firestore,storage \
 *     --project demo-geekapoo-auditoria \
 *     "npx mocha tests/auditoria/*.test.cjs --timeout 60000"
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
  getDoc,
  addDoc,
  serverTimestamp,
} = require('firebase/firestore');

const fs = require('fs');
const path = require('path');

const RULES = fs.readFileSync(
  path.join(__dirname, '..', '..', 'firestore.rules'),
  'utf8',
);
const PROJECT = 'demo-geekapoo-auditoria';

const ALICE = 'alice';
const BOB = 'bob';
const CAROL = 'carol';
const BANNED = 'baneado';
const ADMIN = 'admin';
const ADMIN_BANEADO = 'admin-baneado';

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
      username: uid,
      displayName: uid,
      chatId: `GK-${uid}`,
      avatarUrl: '',
      role: 'user',
      createdAt: '2026-01-01T00:00:00.000Z',
      isBanned: false,
      ...extra,
    });
  });
}

/** Perfil con baneo vigente en el registro duradero. */
async function crearBaneado(uid, role = 'user') {
  await crearUsuario(uid, { role });
  await sembrar(async (f) => {
    await setDoc(doc(f, 'accountRestrictions', uid), {
      uid,
      tipo: 'ban',
      activo: true,
      motivo: 'Prueba de auditoría',
      fechaFin: null,
      creadoEn: '2026-01-01T00:00:00.000Z',
    });
  });
}

describe('AUDITORÍA: hallazgos de reglas de Firestore', () => {
  before(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT,
      firestore: { rules: RULES },
    });

    await crearUsuario(ALICE);
    await crearUsuario(BOB);
    await crearUsuario(CAROL);
    await crearBaneado(BANNED);
    await crearUsuario(ADMIN, { role: 'admin' });
    await crearBaneado(ADMIN_BANEADO, 'admin');

    await sembrar(async (f) => {
      // Datos privados para comprobar la lectura del admin baneado.
      await setDoc(doc(f, 'userPrivate', ALICE), {
        email: 'alice@example.com',
        profileVisibility: 'public',
        allowChatRequests: true,
      });

      // Hilo de un usuario baneado (para editar después).
      await setDoc(doc(f, 'threads', 'hilo-baneado'), {
        authorId: BANNED,
        authorName: 'baneado',
        authorAvatar: '',
        title: 'Hilo anterior al baneo',
        body: 'Contenido',
        categoryId: 'general',
        categoryName: 'General',
        tags: [],
        pinned: false,
        createdAt: '2026-01-01T00:00:00.000Z',
      });

      // Hilo de Alice.
      await setDoc(doc(f, 'threads', 'hilo-alice'), {
        authorId: ALICE,
        authorName: 'alice',
        authorAvatar: '',
        title: 'Hilo de Alice',
        body: 'Contenido',
        categoryId: 'general',
        categoryName: 'General',
        tags: [],
        pinned: false,
        createdAt: '2026-01-01T00:00:00.000Z',
      });

      // Comentario de Alice.
      await setDoc(doc(f, 'comments', 'com-alice'), {
        authorId: ALICE,
        authorName: 'alice',
        authorAvatar: '',
        targetType: 'thread',
        targetId: 'hilo-alice',
        parentId: null,
        body: 'Comentario original',
        createdAt: '2026-01-01T00:00:00.000Z',
      });

      // Club con Alice dentro y su chat de club.
      await setDoc(doc(f, 'clubs', 'club-salida'), {
        id: 'club-salida',
        slug: 'club-salida',
        name: 'Club de salida',
        description: 'Club para probar la salida',
        rules: '',
        ownerId: BOB,
        moderatorIds: [],
        adminIds: [],
        memberIds: [BOB, ALICE],
        members: {
          [BOB]: { role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
          [ALICE]: { role: 'member', joinedAt: '2026-01-01T00:00:00.000Z' },
        },
        memberCount: 2,
        accessType: 'public',
        chatId: 'chat-club-salida',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      });

      await setDoc(doc(f, 'chats', 'chat-club-salida'), {
        type: 'club',
        slug: 'club-salida',
        ownerId: BOB,
        name: 'Chat del club',
        memberIds: [BOB, ALICE],
        createdAt: '2026-01-01T00:00:00.000Z',
      });

      await setDoc(doc(f, 'chats', 'chat-club-salida', 'messages', 'msg-1'), {
        senderId: BOB,
        senderName: 'bob',
        body: 'Mensaje anterior a la salida',
        createdAt: '2026-01-01T00:00:00.000Z',
      });

      // Club propiedad de una cuenta baneada.
      await setDoc(doc(f, 'clubs', 'club-baneado'), {
        id: 'club-baneado',
        slug: 'club-baneado',
        name: 'Club del baneado',
        description: 'Club creado antes del baneo',
        rules: '',
        ownerId: BANNED,
        moderatorIds: [],
        adminIds: [],
        memberIds: [BANNED],
        members: {
          [BANNED]: { role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
        },
        memberCount: 1,
        accessType: 'public',
        chatId: 'chat-club-baneado',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      });

      // Chat de grupo normal, con un mensaje real.
      await setDoc(doc(f, 'chats', 'grupo-1'), {
        type: 'group',
        ownerId: ALICE,
        name: 'Grupo de prueba',
        code: 'GRP-AAAA-BBBB-CCCC',
        memberIds: [ALICE, BOB],
        createdAt: '2026-01-01T00:00:00.000Z',
      });

      await setDoc(doc(f, 'chats', 'grupo-1', 'messages', 'msg-1'), {
        senderId: ALICE,
        senderName: 'alice',
        body: 'Mensaje real de Alice',
        createdAt: '2026-01-01T00:00:00.000Z',
      });

      // Chat de grupo del que Carol no es miembro.
      await setDoc(doc(f, 'chats', 'grupo-ajeno'), {
        type: 'group',
        ownerId: BOB,
        name: 'Grupo ajeno',
        code: 'GRP-DDDD-EEEE-FFFF',
        memberIds: [ALICE, BOB],
        createdAt: '2026-01-01T00:00:00.000Z',
      });
    });
  });

  after(async () => {
    await testEnv.cleanup();
  });

  // ==========================================================
  // A. BANEOS Y ROLES
  // ==========================================================

  describe('A. un administrador baneado conserva los permisos de admin', () => {
    it('[CORREGIDO A1] NO puede leer los datos privados de otra persona', async () => {
      // isAdmin() exige ahora isActive(): un admin baneado no pasa.
      await assertFails(
        getDoc(doc(db(ADMIN_BANEADO), 'userPrivate', ALICE)),
      );
    });

    it('[CORREGIDO A2] NO puede promover a otro usuario a admin', async () => {
      await assertFails(
        updateDoc(doc(db(ADMIN_BANEADO), 'users', CAROL), {
          role: 'admin',
        }),
      );

      const snap = await getDoc(doc(db(ADMIN), 'users', CAROL));
      if (snap.data()?.role === 'admin') {
        throw new Error('El admin baneado consiguió cambiar el rol');
      }
    });

    it('CONTROL: un usuario normal no puede leer datos privados ajenos', async () => {
      await assertFails(getDoc(doc(db(BOB), 'userPrivate', ALICE)));
    });

    it('CONTROL: un usuario normal no puede cambiar el rol de otro', async () => {
      await assertFails(
        updateDoc(doc(db(BOB), 'users', ALICE), { role: 'admin' }),
      );
    });
  });

  // ==========================================================
  // B. FECHA DE REGISTRO Y MEDALLA DE VETERANO
  // ==========================================================

  describe('B. createdAt lo controla el usuario', () => {
    it('[CORREGIDO B1] NO puede retrasar su fecha de registro al actualizar el perfil', async () => {
      // `diasDesde(createdAt)` alimenta la medalla de 365 días.
      await assertFails(
        updateDoc(doc(db(ALICE), 'users', ALICE), {
          createdAt: '2020-01-01T00:00:00.000Z',
        }),
      );
    });

    it('[CORREGIDO B2] NO puede nacer con una fecha de registro inventada', async () => {
      await assertFails(
        setDoc(doc(db('cuenta-nueva'), 'users', 'cuenta-nueva'), {
          uid: 'cuenta-nueva',
          username: 'cuenta-nueva',
          displayName: 'Cuenta nueva',
          chatId: 'GK-cuenta-nueva',
          avatarUrl: '',
          role: 'user',
          createdAt: '2019-01-01T00:00:00.000Z',
        }),
      );
    });
  });

  // ==========================================================
  // C. CLUBES
  // ==========================================================

  describe('C. clubes', () => {
    it('[CORREGIDO C1] un baneado NO puede crear un club con un chatId inventado', async () => {
      // `create` exige isActive() y que el chat exista, sea de
      // tipo club, del mismo slug y del creador.
      await assertFails(
        setDoc(doc(db(BANNED), 'clubs', 'club-baneado-nuevo'), {
          id: 'club-baneado-nuevo',
          slug: 'club-baneado-nuevo',
          name: 'Club de un baneado',
          description: 'Creado por una cuenta sancionada',
          rules: '',
          ownerId: BANNED,
          moderatorIds: [],
          adminIds: [],
          memberIds: [BANNED],
          members: {
            [BANNED]: {
              role: 'owner',
              joinedAt: '2026-01-01T00:00:00.000Z',
            },
          },
          memberCount: 1,
          accessType: 'public',
          chatId: 'chat-que-no-existe',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        }),
      );
    });

    it('[CORREGIDO C2] al salir del club pierde el acceso a su chat', async () => {
      // Salir es legítimo: la operación debe seguir funcionando.
      await assertSucceeds(
        updateDoc(doc(db(ALICE), 'clubs', 'club-salida'), {
          memberIds: [BOB],
          members: {
            [BOB]: { role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
          },
          memberCount: 1,
          updatedAt: serverTimestamp(),
        }),
      );

      const club = await getDoc(doc(db(ADMIN), 'clubs', 'club-salida'));
      if (club.data().memberIds.includes(ALICE)) {
        throw new Error('La prueba no llegó a sacar a Alice del club');
      }

      // Ya no puede leer ni escribir los mensajes del chat: la
      // regla de la subcolección cruza con la membresía del club.
      await assertFails(
        getDoc(doc(db(ALICE), 'chats', 'chat-club-salida', 'messages', 'msg-1')),
      );

      await assertFails(
        addDoc(collection(db(ALICE), 'chats', 'chat-club-salida', 'messages'), {
          senderId: ALICE,
          senderName: 'alice',
          body: 'Intento escribir tras salir del club',
          createdAt: serverTimestamp(),
        }),
      );

      // El trigger `onClubMembersChanged` limpia `memberIds` del
      // chat. Aquí no corre, así que lo simulamos para comprobar
      // que, una vez limpio, tampoco lee la ficha del chat.
      await sembrar(async (f) => {
        await updateDoc(doc(f, 'chats', 'chat-club-salida'), {
          memberIds: [BOB],
        });
      });
      await assertFails(getDoc(doc(db(ALICE), 'chats', 'chat-club-salida')));
    });

    it('CONTROL: un no miembro no puede leer un chat ajeno', async () => {
      await assertFails(getDoc(doc(db(CAROL), 'chats', 'grupo-ajeno')));
    });

    it('[CORREGIDO C3] el dueño baneado NO edita la configuración del club', async () => {
      // Las ramas de propietario pasan por isActive().
      await assertFails(
        updateDoc(doc(db(BANNED), 'clubs', 'club-baneado'), {
          name: 'Club editado estando baneado',
          description: 'Sigo administrando el club pese al baneo',
          updatedAt: serverTimestamp(),
        }),
      );
    });

    it('[CORREGIDO C4] el dueño baneado NO añade a otra persona sin consentimiento', async () => {
      await assertFails(
        updateDoc(doc(db(BANNED), 'clubs', 'club-baneado'), {
          memberIds: [BANNED, ALICE],
          members: {
            [BANNED]: { role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
            [ALICE]: { role: 'member', joinedAt: '2026-01-01T00:00:00.000Z' },
          },
          memberCount: 2,
          updatedAt: serverTimestamp(),
        }),
      );
    });
  });

  // ==========================================================
  // D. FORO Y COMENTARIOS
  // ==========================================================

  describe('D. hilos del foro', () => {
    it('[CORREGIDO D1] el autor NO se fija su propio hilo', async () => {
      await assertFails(
        updateDoc(doc(db(ALICE), 'threads', 'hilo-alice'), { pinned: true }),
      );
    });

    it('[CORREGIDO D2] el autor NO pone un título de 300 caracteres (el límite es 200)', async () => {
      await assertFails(
        updateDoc(doc(db(ALICE), 'threads', 'hilo-alice'), {
          title: 'x'.repeat(300),
        }),
      );
    });

    it('[CORREGIDO D3] el autor NO pone un cuerpo de 20 000 caracteres (el límite es 10 000)', async () => {
      await assertFails(
        updateDoc(doc(db(ALICE), 'threads', 'hilo-alice'), {
          body: 'x'.repeat(20000),
        }),
      );
    });

    it('[CORREGIDO D4] un autor baneado NO sigue editando su hilo', async () => {
      // La rama del autor exige ahora isActive().
      await assertFails(
        updateDoc(doc(db(BANNED), 'threads', 'hilo-baneado'), {
          pinned: true,
          title: 'Editado estando baneado',
        }),
      );
    });

    it('CONTROL: un baneado no puede crear un hilo nuevo', async () => {
      await assertFails(
        addDoc(collection(db(BANNED), 'threads'), {
          authorId: BANNED,
          authorName: 'baneado',
          authorAvatar: '',
          title: 'Hilo nuevo',
          body: 'Contenido',
          categoryId: 'general',
          categoryName: 'General',
          tags: [],
          pinned: false,
          createdAt: serverTimestamp(),
        }),
      );
    });
  });

  describe('E. comentarios', () => {
    it('[CORREGIDO E1] el autor NO edita el comentario con 6 000 caracteres (el límite es 5 000)', async () => {
      await assertFails(
        updateDoc(doc(db(ALICE), 'comments', 'com-alice'), {
          body: 'x'.repeat(6000),
        }),
      );
    });

    it('[CORREGIDO E2] NO se crea un comentario apuntando a un objetivo inventado', async () => {
      // La regla valida `targetType` contra la lista real y que
      // `targetId` exista. Antes cada comentario disparaba
      // onCommentCreated (+5 XP y contador) aunque no hubiera
      // objetivo.
      await assertFails(
        addDoc(collection(db(ALICE), 'comments'), {
          authorId: ALICE,
          authorName: 'alice',
          authorAvatar: '',
          targetType: 'inventado',
          targetId: 'objetivo-que-no-existe',
          parentId: null,
          body: 'Comentario para farmear XP',
          createdAt: serverTimestamp(),
        }),
      );
    });

    it('CONTROL: un baneado no puede comentar', async () => {
      await assertFails(
        addDoc(collection(db(BANNED), 'comments'), {
          authorId: BANNED,
          authorName: 'baneado',
          authorAvatar: '',
          targetType: 'thread',
          targetId: 'hilo-alice',
          parentId: null,
          body: 'Comentario de un baneado',
          createdAt: serverTimestamp(),
        }),
      );
    });

    it('CONTROL: nadie edita el comentario de otra persona', async () => {
      await assertFails(
        updateDoc(doc(db(BOB), 'comments', 'com-alice'), {
          body: 'Secuestrado',
        }),
      );
    });
  });

  // ==========================================================
  // F. CHATS
  // ==========================================================

  describe('F. chats', () => {
    it('[CORREGIDO F1] un miembro NO falsea la vista previa del chat', async () => {
      await assertFails(
        updateDoc(doc(db(BOB), 'chats', 'grupo-1'), {
          lastMessage: 'Mensaje urgente del administrador',
          lastMessageSenderId: 'admin',
          lastMessageAt: serverTimestamp(),
        }),
      );
    });

    it('[CORREGIDO F2] un miembro NO oculta ni limpia el chat a otra persona', async () => {
      // `hiddenFor`, `readAt` y `clearedAt` solo pueden llevar la
      // clave de quien escribe.
      await assertFails(
        updateDoc(doc(db(BOB), 'chats', 'grupo-1'), {
          [`hiddenFor.${ALICE}`]: true,
          [`clearedAt.${ALICE}`]: serverTimestamp(),
          [`readAt.${ALICE}`]: serverTimestamp(),
        }),
      );
    });

    it('[CORREGIDO F3] un miembro NO fija un mensaje con texto y autor falsos', async () => {
      await assertFails(
        setDoc(doc(db(BOB), 'chats', 'grupo-1', 'fijados', 'msg-1'), {
          chatId: 'grupo-1',
          messageId: 'msg-1',
          fijadoPor: BOB,
          fijadoPorNombre: 'bob',
          autorId: 'admin',
          autorNombre: 'Administrador',
          autorAvatar: '',
          texto: 'Texto que Alice nunca escribió',
          tipo: 'text',
          mensajeCreadoEn: '2026-01-01T00:00:00.000Z',
        }),
      );
    });

    it('[P1 ABIERTO F4] se puede fabricar una cita de un mensaje inexistente', async () => {
      // Pendiente P1: `replyTo` solo valida la forma, no que el
      // mensaje citado exista. Cuando se cierre, invertir a
      // assertFails.
      await assertSucceeds(
        addDoc(collection(db(BOB), 'chats', 'grupo-1', 'messages'), {
          senderId: BOB,
          senderName: 'bob',
          body: 'Cito algo que nunca se dijo',
          createdAt: serverTimestamp(),
          replyTo: {
            messageId: 'mensaje-inexistente',
            senderName: 'Administrador',
            snippet: 'Texto fabricado',
          },
        }),
      );
    });

    it('CONTROL: un no miembro no puede fijar mensajes', async () => {
      await assertFails(
        setDoc(doc(db(CAROL), 'chats', 'grupo-1', 'fijados', 'msg-1'), {
          chatId: 'grupo-1',
          messageId: 'msg-1',
          fijadoPor: CAROL,
          fijadoPorNombre: 'carol',
          autorId: 'admin',
          autorNombre: 'Administrador',
          texto: 'Intento desde fuera',
          tipo: 'text',
          mensajeCreadoEn: '2026-01-01T00:00:00.000Z',
        }),
      );
    });

    it('CONTROL: un no miembro no puede escribir en el grupo', async () => {
      await assertFails(
        addDoc(collection(db(CAROL), 'chats', 'grupo-1', 'messages'), {
          senderId: CAROL,
          senderName: 'carol',
          body: 'Intento desde fuera',
          createdAt: serverTimestamp(),
        }),
      );
    });
  });

  // ==========================================================
  // G. SOLICITUDES DE CHAT
  // ==========================================================

  describe('G. solicitudes de chat', () => {
    it('[P1 ABIERTO G1] se pueden inundar solicitudes y falsificar el remitente', async () => {
      // Pendiente P1: sin id determinista ni límite de frecuencia,
      // y con `fromName`/`fromAvatar` escritos por el cliente.
      // Cuando se cierre, invertir a assertFails.
      for (const id of ['spam-1', 'spam-2', 'spam-3']) {
        await assertSucceeds(
          setDoc(doc(db(BOB), 'chatRequests', id), {
            type: 'direct',
            fromId: BOB,
            fromName: 'Soporte oficial de Geekapoo',
            fromAvatar: 'https://example.com/falso.png',
            toId: ALICE,
            toName: 'alice',
            toAvatar: '',
            status: 'pending',
            createdAt: serverTimestamp(),
          }),
        );
      }
    });

    it('CONTROL: no se puede suplantar a otra persona como remitente', async () => {
      await assertFails(
        setDoc(doc(db(BOB), 'chatRequests', 'falsa'), {
          type: 'direct',
          fromId: ALICE,
          fromName: 'alice',
          fromAvatar: '',
          toId: CAROL,
          status: 'pending',
          createdAt: serverTimestamp(),
        }),
      );
    });
  });
});
