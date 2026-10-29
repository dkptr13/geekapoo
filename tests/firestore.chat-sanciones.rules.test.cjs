/**
 * Pruebas de SANCIONES en las reglas del chat.
 *
 * Aquí se mezclan dos cosas que NO son lo mismo:
 *
 *   · el baneo GLOBAL de Geekapoo (`isActive()`), que debe dejar
 *     la cuenta en solo lectura en todo el chat; y
 *   · las sanciones de un club (`puedeEscribirEnChat()`), que
 *     solo afectan a los mensajes de ESE club y respetan su
 *     duración y los permisos del equipo.
 *
 * Lo que se comprueba, operación por operación:
 *
 *   - crear chats, mensajes, votos, reacciones y fijados;
 *   - cambiar el voto, cerrar/reabrir una encuesta y desfijar;
 *   - moderar mensajes y votos;
 *   - tocar metadatos/miembros del chat, prefs, solicitudes e
 *     índice de códigos.
 *
 * Actores: usuario normal, baneado por la bandera visible,
 * baneado solo por el registro duradero, cuenta sin perfil,
 * usuario con la restricción ya levantada, silenciado en un club,
 * silenciado con la sanción caducada, moderador de club, admin
 * global y moderador/admin globales baneados.
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
  arrayRemove,
  arrayUnion,
  serverTimestamp,
  Timestamp,
} = require('firebase/firestore');

const fs = require('fs');
const path = require('path');

const RULES = fs.readFileSync(
  path.join(__dirname, '..', 'firestore.rules'),
  'utf8',
);
const PROJECT = 'demo-geekapoo-chat-sanciones';

const ALICE = 'alice'; // dueña del grupo y del club
const BOB = 'bob'; // miembro normal
const CARA = 'cara'; // fuera de los chats
const MOD = 'moderador'; // moderador del club
const MOD_MUTE = 'moderador-silenciado'; // moderador del club silenciado
const ADMIN = 'admin'; // admin global, dentro del club
const BAN_FLAG = 'baneado-bandera';
const BAN_REG = 'baneado-registro';
const BAN_ADMIN = 'admin-baneado';
const BAN_MOD = 'moderador-baneado';
const MUTE = 'silenciado';
const MUTE_EXP = 'sancion-caducada';
const DESBANEADO = 'desbaneado';
const NO_PROFILE = 'sin-perfil';

const CHAT_CLUB = 'c1';
const CLUB_SLUG = 'club-sanciones';

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

async function crearRestriccion(uid, extra = {}) {
  await sembrar(async (f) => {
    await setDoc(doc(f, 'accountRestrictions', uid), {
      uid,
      tipo: 'ban',
      activo: true,
      motivo: 'Prueba de baneo',
      fechaFin: null,
      creadoEn: '2026-01-01T00:00:00.000Z',
      actualizadoEn: '2026-01-01T00:00:00.000Z',
      ...extra,
    });
  });
}

function miembro(uid, role) {
  return {
    uid,
    role,
    joinedAt: '2026-01-01T00:00:00.000Z',
  };
}

function nuevoChatGrupo(ownerId, memberIds, extra = {}) {
  return {
    type: 'group',
    name: 'Grupo de prueba',
    avatar: '',
    coverUrl: '',
    category: 'general',
    ownerId,
    memberIds,
    hiddenFor: [],
    lastMessage: '',
    // La vista previa la escribe el servidor desde el mensaje real.
    lastMessageAt: serverTimestamp(),
    lastMessageSenderId: ownerId,
    readAt: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  };
}

function nuevoChatClub(ownerId, memberIds, extra = {}) {
  return {
    type: 'club',
    name: 'Club de sanciones',
    slug: CLUB_SLUG,
    category: 'anime-manga',
    avatar: '',
    coverUrl: '',
    ownerId,
    memberIds,
    hiddenFor: [],
    lastMessage: '',
    // La vista previa la escribe el servidor desde el mensaje real.
    lastMessageAt: serverTimestamp(),
    lastMessageSenderId: ownerId,
    readAt: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  };
}

function nuevoClub(extra = {}) {
  const memberIds = [
    ALICE,
    BOB,
    MOD,
    MOD_MUTE,
    ADMIN,
    BAN_ADMIN,
    BAN_MOD,
    BAN_FLAG,
    BAN_REG,
    MUTE,
    MUTE_EXP,
    DESBANEADO,
    NO_PROFILE,
  ];

  const members = {
    [ALICE]: miembro(ALICE, 'owner'),
    [BOB]: miembro(BOB, 'member'),
    [MOD]: miembro(MOD, 'moderator'),
    [MOD_MUTE]: miembro(MOD_MUTE, 'moderator'),
    [ADMIN]: miembro(ADMIN, 'admin'),
    [BAN_ADMIN]: miembro(BAN_ADMIN, 'admin'),
    [BAN_MOD]: miembro(BAN_MOD, 'moderator'),
    [BAN_FLAG]: miembro(BAN_FLAG, 'member'),
    [BAN_REG]: miembro(BAN_REG, 'member'),
    [MUTE]: miembro(MUTE, 'member'),
    [MUTE_EXP]: miembro(MUTE_EXP, 'member'),
    [DESBANEADO]: miembro(DESBANEADO, 'member'),
    [NO_PROFILE]: miembro(NO_PROFILE, 'member'),
  };

  return {
    slug: CLUB_SLUG,
    name: 'Club de sanciones',
    description: 'Club de prueba con sanciones y moderación.',
    category: 'anime-manga',
    coverUrl: '',
    iconUrl: '',
    rules: 'Respeta a los demás.',
    accessType: 'private',
    ownerId: ALICE,
    moderatorIds: [MOD, MOD_MUTE, BAN_MOD],
    adminIds: [ADMIN, BAN_ADMIN],
    memberIds,
    members,
    memberCount: memberIds.length,
    chatId: CHAT_CLUB,
    permisos: { moderadorFijaMensajes: true },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  };
}

function mensajeTexto(chatId, autor, extra = {}) {
  return {
    chatId,
    senderId: autor,
    senderName: autor,
    senderAvatar: '',
    body: 'Hola',
    type: 'text',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  };
}

function encuesta(extra = {}) {
  return {
    question: '¿Sí o no?',
    options: { o1: 'Sí', o2: 'No' },
    isClosed: false,
    allowChangeVote: true,
    ...extra,
  };
}

function mensajeEncuesta(chatId, autor, extra = {}) {
  return {
    chatId,
    senderId: autor,
    senderName: autor,
    senderAvatar: '',
    body: '',
    type: 'poll',
    poll: encuesta(),
    createdAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  };
}

function voto(uid, optionId = 'o1', extra = {}) {
  return {
    userId: uid,
    optionId,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  };
}

function reaccion(uid, chatId, targetId, extra = {}) {
  return {
    targetType: 'chat_message',
    targetId,
    chatId,
    userId: uid,
    userName: uid,
    type: 'fire',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  };
}

function fijado(chatId, messageId, autorId, fijadoPor, extra = {}) {
  return {
    chatId,
    messageId,
    autorId,
    autorNombre: autorId,
    autorAvatar: '',
    texto: 'Hola',
    tipo: 'text',
    mensajeCreadoEn: '2026-01-01T00:00:00.000Z',
    mensajeCreadoEnMs: Date.parse('2026-01-01T00:00:00.000Z'),
    fijadoPor,
    fijadoPorNombre: fijadoPor,
    fijadoEn: '2026-01-01T00:00:00.000Z',
    ...extra,
  };
}

function nuevaSolicitud(fromId, toId, extra = {}) {
  return {
    type: 'direct',
    fromId,
    fromName: fromId,
    fromAvatar: '',
    toId,
    toName: toId,
    toAvatar: '',
    status: 'pending',
    createdAt: serverTimestamp(),
    ...extra,
  };
}

function reaccionId(uid, targetId) {
  return `reac_chat_message_${targetId}_${uid}`;
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

  // Perfiles normales.
  await crearUsuario(ALICE);
  await crearUsuario(BOB);
  await crearUsuario(CARA);
  await crearUsuario(MOD);
  await crearUsuario(MOD_MUTE);
  await crearUsuario(ADMIN, { role: 'admin' });
  await crearUsuario(MUTE);
  await crearUsuario(MUTE_EXP);
  await crearUsuario(DESBANEADO);

  // Baneos: bandera visible, registro duradero y equipo baneado.
  await crearUsuario(BAN_FLAG, { isBanned: true });
  await crearUsuario(BAN_REG);
  await crearUsuario(BAN_ADMIN, { role: 'admin', isBanned: true });
  await crearUsuario(BAN_MOD, { isBanned: true });

  await crearRestriccion(BAN_REG);
  await crearRestriccion(DESBANEADO, { activo: false, motivo: 'Ya cumplido' });

  // NO_PROFILE no tiene documento en `users`: es una cuenta de
  // Firebase Auth que nunca creó su perfil.

  const miembros = [
    ALICE,
    BOB,
    MOD,
    MOD_MUTE,
    ADMIN,
    BAN_ADMIN,
    BAN_MOD,
    BAN_FLAG,
    BAN_REG,
    MUTE,
    MUTE_EXP,
    DESBANEADO,
    NO_PROFILE,
  ];

  await sembrar(async (f) => {
    // Grupo normal, con todos los actores dentro para que un fallo
    // no se pueda confundir con "no es miembro".
    await setDoc(
      doc(f, 'chats', 'g1'),
      nuevoChatGrupo(ALICE, miembros),
    );

    // Grupos con dueño baneado / sin perfil, para las rutas de
    // propietario y del índice de códigos.
    await setDoc(
      doc(f, 'chats', 'g-ban'),
      nuevoChatGrupo(BAN_FLAG, [BAN_FLAG, BOB]),
    );
    await setDoc(
      doc(f, 'chats', 'g-ban-reg'),
      nuevoChatGrupo(BAN_REG, [BAN_REG, BOB]),
    );
    await setDoc(
      doc(f, 'chats', 'g-sin'),
      nuevoChatGrupo(NO_PROFILE, [NO_PROFILE]),
    );

    // Club y su chat general.
    await setDoc(doc(f, 'clubs', CLUB_SLUG), nuevoClub());
    await setDoc(
      doc(f, 'chats', CHAT_CLUB),
      nuevoChatClub(ALICE, miembros),
    );

    // Club cuyo dueño está baneado: sirve para comprobar que no
    // puede vaciar/borrar su chat saltándose la puerta global.
    await setDoc(
      doc(f, 'clubs', 'club-baneado'),
      {
        slug: 'club-baneado',
        name: 'Club baneado',
        description: 'Club cuyo dueño está baneado.',
        category: 'general',
        coverUrl: '',
        iconUrl: '',
        rules: '',
        accessType: 'private',
        ownerId: BAN_FLAG,
        moderatorIds: [],
        adminIds: [],
        memberIds: [BAN_FLAG, BOB],
        members: {
          [BAN_FLAG]: miembro(BAN_FLAG, 'owner'),
          [BOB]: miembro(BOB, 'member'),
        },
        memberCount: 2,
        chatId: 'cb1',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    );
    await setDoc(
      doc(f, 'chats', 'cb1'),
      nuevoChatClub(BAN_FLAG, [BAN_FLAG, BOB], {
        slug: 'club-baneado',
        name: 'Club baneado',
      }),
    );

    // Sanciones del club: una activa y otra caducada.
    await setDoc(doc(f, 'clubs', CLUB_SLUG, 'sancion', MUTE), {
      clubId: CLUB_SLUG,
      tipo: 'silencio',
      objetivoUid: MUTE,
      objetivoNombre: MUTE,
      motivo: 'Prueba',
      inicio: '2026-01-01T00:00:00.000Z',
      fin: '2099-01-01T00:00:00.000Z',
      permanente: false,
      expira: Timestamp.fromMillis(Date.now() + 60 * 60 * 1000),
      aplicadaPor: MOD,
      aplicadaPorNombre: MOD,
      aplicadaPorRango: 'moderator',
      retirada: false,
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    await setDoc(doc(f, 'clubs', CLUB_SLUG, 'sancion', MOD_MUTE), {
      clubId: CLUB_SLUG,
      tipo: 'silencio',
      objetivoUid: MOD_MUTE,
      objetivoNombre: MOD_MUTE,
      motivo: 'Prueba de moderador silenciado',
      inicio: '2026-01-01T00:00:00.000Z',
      fin: '2099-01-01T00:00:00.000Z',
      permanente: false,
      expira: Timestamp.fromMillis(Date.now() + 60 * 60 * 1000),
      aplicadaPor: ALICE,
      aplicadaPorNombre: ALICE,
      aplicadaPorRango: 'owner',
      retirada: false,
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    await setDoc(doc(f, 'clubs', CLUB_SLUG, 'sancion', MUTE_EXP), {
      clubId: CLUB_SLUG,
      tipo: 'silencio',
      objetivoUid: MUTE_EXP,
      objetivoNombre: MUTE_EXP,
      motivo: 'Sanción ya cumplida',
      inicio: '2025-01-01T00:00:00.000Z',
      fin: '2025-01-02T00:00:00.000Z',
      permanente: false,
      expira: Timestamp.fromMillis(Date.now() - 60 * 60 * 1000),
      aplicadaPor: MOD,
      aplicadaPorNombre: MOD,
      aplicadaPorRango: 'moderator',
      retirada: true,
      createdAt: '2025-01-01T00:00:00.000Z',
    });

    // Mensajes de texto y encuestas.
    await setDoc(doc(f, 'chats', 'g1', 'messages', 'm-text'), mensajeTexto('g1', ALICE));
    await setDoc(doc(f, 'chats', 'g1', 'messages', 'm-poll'), mensajeEncuesta('g1', BOB));
    await setDoc(doc(f, 'chats', 'g1', 'messages', 'm-poll-ban'), mensajeEncuesta('g1', BAN_FLAG));
    await setDoc(doc(f, 'chats', 'g1', 'messages', 'm-poll-ban-reg'), mensajeEncuesta('g1', BAN_REG));
    await setDoc(doc(f, 'chats', 'g1', 'messages', 'm-poll-sin'), mensajeEncuesta('g1', NO_PROFILE));
    await setDoc(doc(f, 'chats', 'g1', 'messages', 'm-poll-des'), mensajeEncuesta('g1', DESBANEADO));

    await setDoc(doc(f, 'chats', CHAT_CLUB, 'messages', 'mc-text'), mensajeTexto(CHAT_CLUB, BOB));
    await setDoc(doc(f, 'chats', CHAT_CLUB, 'messages', 'mc-pin'), mensajeTexto(CHAT_CLUB, BOB));
    await setDoc(doc(f, 'chats', CHAT_CLUB, 'messages', 'mc-poll'), mensajeEncuesta(CHAT_CLUB, BOB));
    await setDoc(doc(f, 'chats', CHAT_CLUB, 'messages', 'mc-poll-admin'), mensajeEncuesta(CHAT_CLUB, BOB));
    await setDoc(doc(f, 'chats', CHAT_CLUB, 'messages', 'mc-poll-mute'), mensajeEncuesta(CHAT_CLUB, MUTE));
    await setDoc(doc(f, 'chats', CHAT_CLUB, 'messages', 'mc-poll-ban'), mensajeEncuesta(CHAT_CLUB, BAN_FLAG));

    // Votos existentes para probar cambio y moderación.
    await setDoc(
      doc(f, 'chats', 'g1', 'messages', 'm-poll', 'pollVotes', BOB),
      voto(BOB),
    );
    await setDoc(
      doc(f, 'chats', 'g1', 'messages', 'm-poll', 'pollVotes', BAN_FLAG),
      voto(BAN_FLAG),
    );
    await setDoc(
      doc(f, 'chats', CHAT_CLUB, 'messages', 'mc-poll', 'pollVotes', MUTE),
      voto(MUTE),
    );
    await setDoc(
      doc(f, 'chats', CHAT_CLUB, 'messages', 'mc-poll', 'pollVotes', ALICE),
      voto(ALICE),
    );
    await setDoc(
      doc(f, 'chats', CHAT_CLUB, 'messages', 'mc-poll-mute', 'pollVotes', MUTE),
      voto(MUTE),
    );
    await setDoc(
      doc(f, 'chats', CHAT_CLUB, 'messages', 'mc-poll-ban', 'pollVotes', MUTE),
      voto(MUTE),
    );
    await setDoc(
      doc(f, 'chats', CHAT_CLUB, 'messages', 'mc-poll', 'pollVotes', BAN_MOD),
      voto(BAN_MOD),
    );

    // Reacciones existentes de un usuario activo y de un baneado.
    await setDoc(
      doc(f, 'reactions', reaccionId(BOB, 'm-text')),
      reaccion(BOB, 'g1', 'm-text'),
    );
    await setDoc(
      doc(f, 'reactions', reaccionId(BAN_FLAG, 'm-text')),
      reaccion(BAN_FLAG, 'g1', 'm-text'),
    );

    // Fijados existentes: uno del grupo y uno del club.
    await setDoc(
      doc(f, 'chats', 'g1', 'fijados', 'm-text'),
      fijado('g1', 'm-text', ALICE, ALICE),
    );
    await setDoc(
      doc(f, 'chats', 'g1', 'fijados', 'm-text-ban'),
      fijado('g1', 'm-text', ALICE, BAN_FLAG),
    );
    await setDoc(
      doc(f, 'chats', CHAT_CLUB, 'fijados', 'mc-text'),
      fijado(CHAT_CLUB, 'mc-text', BOB, MOD),
    );

    // Solicitudes de chat.
    await setDoc(doc(f, 'chatRequests', 'r-bob'), nuevaSolicitud(BOB, ALICE));
    await setDoc(
      doc(f, 'chatRequests', 'r-ban'),
      nuevaSolicitud(BAN_FLAG, ALICE),
    );

    // Índice de códigos de los grupos.
    await setDoc(doc(f, 'groupCodes', 'GRP-ALICE'), {
      code: 'GRP-ALICE',
      groupId: 'g1',
      name: 'Grupo de prueba',
      ownerId: ALICE,
      ownerName: ALICE,
      memberCount: miembros.length,
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    await setDoc(doc(f, 'groupCodes', 'GRP-BAN'), {
      code: 'GRP-BAN',
      groupId: 'g-ban',
      name: 'Grupo baneado',
      ownerId: BAN_FLAG,
      ownerName: BAN_FLAG,
      memberCount: 2,
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    await setDoc(doc(f, 'groupCodes', 'GRP-BAN-REG'), {
      code: 'GRP-BAN-REG',
      groupId: 'g-ban-reg',
      name: 'Grupo baneado por registro',
      ownerId: BAN_REG,
      ownerName: BAN_REG,
      memberCount: 2,
      createdAt: '2026-01-01T00:00:00.000Z',
    });
  });
});

// ═══════════════════════════════════════════════════════════
// PUERTA GLOBAL: isActive()
// ═══════════════════════════════════════════════════════════

describe('isActive(): perfil y baneo duradero', () => {
  it('un miembro normal puede escribir en el grupo', async () => {
    await assertSucceeds(
      setDoc(
        doc(collection(db(BOB), 'chats', 'g1', 'messages')),
        mensajeTexto('g1', BOB),
      ),
    );
  });

  it('la bandera visible isBanned bloquea aunque sea miembro', async () => {
    await assertFails(
      setDoc(
        doc(collection(db(BAN_FLAG), 'chats', 'g1', 'messages')),
        mensajeTexto('g1', BAN_FLAG),
      ),
    );
  });

  it('el registro duradero bloquea aunque el perfil diga isBanned:false', async () => {
    await assertFails(
      setDoc(
        doc(collection(db(BAN_REG), 'chats', 'g1', 'messages')),
        mensajeTexto('g1', BAN_REG),
      ),
    );
  });

  it('una cuenta sin perfil no puede escribir aunque esté en memberIds', async () => {
    await assertFails(
      setDoc(
        doc(collection(db(NO_PROFILE), 'chats', 'g1', 'messages')),
        mensajeTexto('g1', NO_PROFILE),
      ),
    );
  });

  it('una restricción levantada (activo:false) deja escribir', async () => {
    await assertSucceeds(
      setDoc(
        doc(collection(db(DESBANEADO), 'chats', 'g1', 'messages')),
        mensajeTexto('g1', DESBANEADO),
      ),
    );
  });
});

// ═══════════════════════════════════════════════════════════
// CREAR CHATS, SOLICITUDES E ÍNDICE
// ═══════════════════════════════════════════════════════════

describe('crear chats, solicitudes e índice', () => {
  it('un usuario activo puede crear su grupo', async () => {
    await assertSucceeds(
      setDoc(
        doc(db(BOB), 'chats', 'g-nuevo'),
        nuevoChatGrupo(BOB, [BOB], { name: 'Nuevo grupo' }),
      ),
    );
  });

  it('un baneado por bandera no puede crear un grupo', async () => {
    await assertFails(
      setDoc(
        doc(db(BAN_FLAG), 'chats', 'g-baneado'),
        nuevoChatGrupo(BAN_FLAG, [BAN_FLAG]),
      ),
    );
  });

  it('un baneado por registro no puede crear un grupo', async () => {
    await assertFails(
      setDoc(
        doc(db(BAN_REG), 'chats', 'g-baneado-reg'),
        nuevoChatGrupo(BAN_REG, [BAN_REG]),
      ),
    );
  });

  it('una cuenta sin perfil no puede crear un grupo', async () => {
    await assertFails(
      setDoc(
        doc(db(NO_PROFILE), 'chats', 'g-sin-perfil'),
        nuevoChatGrupo(NO_PROFILE, [NO_PROFILE]),
      ),
    );
  });

  it('un baneado no puede crear una solicitud de chat', async () => {
    await assertFails(
      setDoc(
        doc(db(BAN_REG), 'chatRequests', `direct_${BAN_REG}_${ALICE}`),
        nuevaSolicitud(BAN_REG, ALICE),
      ),
    );
  });

  it('un baneado no puede cancelar ni borrar su solicitud pendiente', async () => {
    await assertFails(
      updateDoc(doc(db(BAN_FLAG), 'chatRequests', 'r-ban'), {
        status: 'cancelled',
        respondedAt: serverTimestamp(),
        respondedBy: BAN_FLAG,
      }),
    );
    await assertFails(deleteDoc(doc(db(BAN_FLAG), 'chatRequests', 'r-ban')));
  });

  it('un usuario activo sí puede cancelar y borrar la suya', async () => {
    await assertSucceeds(
      updateDoc(doc(db(BOB), 'chatRequests', 'r-bob'), {
        status: 'cancelled',
        respondedAt: serverTimestamp(),
        respondedBy: BOB,
      }),
    );
    await assertSucceeds(deleteDoc(doc(db(BOB), 'chatRequests', 'r-bob')));
  });

  it('un baneado no puede crear ni borrar el índice de su grupo', async () => {
    await assertFails(
      setDoc(doc(db(BAN_FLAG), 'groupCodes', 'GRP-BBBB-CCCC-DDDD'), {
        code: 'GRP-BBBB-CCCC-DDDD',
        groupId: 'g-ban',
        name: 'Grupo de prueba',
        ownerId: BAN_FLAG,
        ownerName: BAN_FLAG,
        memberCount: 2,
        createdAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(doc(db(BAN_FLAG), 'groupCodes', 'GRP-BAN'), {
        memberCount: 1,
      }),
    );
    await assertFails(deleteDoc(doc(db(BAN_FLAG), 'groupCodes', 'GRP-BAN')));
  });

  it('un usuario activo sí actualiza y borra el índice de su grupo', async () => {
    await assertSucceeds(
      updateDoc(doc(db(ALICE), 'groupCodes', 'GRP-ALICE'), {
        memberCount: 13,
      }),
    );
    await assertSucceeds(deleteDoc(doc(db(ALICE), 'groupCodes', 'GRP-ALICE')));
  });

  it('un admin activo puede reparar el índice; uno baneado no', async () => {
    await assertSucceeds(
      updateDoc(doc(db(ADMIN), 'groupCodes', 'GRP-ALICE'), {
        memberCount: 12,
      }),
    );
    await assertFails(
      updateDoc(doc(db(BAN_ADMIN), 'groupCodes', 'GRP-ALICE'), {
        memberCount: 11,
      }),
    );
  });
});

// ═══════════════════════════════════════════════════════════
// MENSAJES Y SANCIONES DE CLUB
// ═══════════════════════════════════════════════════════════

describe('crear mensajes: baneo global frente a silencio de club', () => {
  it('un miembro normal escribe en el grupo y en el club', async () => {
    await assertSucceeds(
      setDoc(
        doc(collection(db(BOB), 'chats', 'g1', 'messages')),
        mensajeTexto('g1', BOB),
      ),
    );
    await assertSucceeds(
      setDoc(
        doc(collection(db(BOB), 'chats', CHAT_CLUB, 'messages')),
        mensajeTexto(CHAT_CLUB, BOB),
      ),
    );
  });

  it('un silenciado en el club no puede escribir allí', async () => {
    await assertFails(
      setDoc(
        doc(collection(db(MUTE), 'chats', CHAT_CLUB, 'messages')),
        mensajeTexto(CHAT_CLUB, MUTE),
      ),
    );
  });

  it('el silencio del club no se extiende a otros chats', async () => {
    await assertSucceeds(
      setDoc(
        doc(collection(db(MUTE), 'chats', 'g1', 'messages')),
        mensajeTexto('g1', MUTE),
      ),
    );
  });

  it('cuando la sanción caduca, el miembro vuelve a escribir', async () => {
    await assertSucceeds(
      setDoc(
        doc(collection(db(MUTE_EXP), 'chats', CHAT_CLUB, 'messages')),
        mensajeTexto(CHAT_CLUB, MUTE_EXP),
      ),
    );
  });

  it('un moderador silenciado no puede mandar mensajes, pero el equipo sí', async () => {
    await assertFails(
      setDoc(
        doc(collection(db(MOD_MUTE), 'chats', CHAT_CLUB, 'messages')),
        mensajeTexto(CHAT_CLUB, MOD_MUTE),
      ),
    );
    await assertSucceeds(
      setDoc(
        doc(collection(db(MOD), 'chats', CHAT_CLUB, 'messages')),
        mensajeTexto(CHAT_CLUB, MOD),
      ),
    );
  });

  it('un moderador del club baneado globalmente no puede escribir', async () => {
    await assertFails(
      setDoc(
        doc(collection(db(BAN_MOD), 'chats', CHAT_CLUB, 'messages')),
        mensajeTexto(CHAT_CLUB, BAN_MOD),
      ),
    );
  });
});

// ═══════════════════════════════════════════════════════════
// MODERACIÓN DE MENSAJES
// ═══════════════════════════════════════════════════════════

describe('moderación de mensajes', () => {
  function retirada(uid) {
    return updateDoc(doc(db(uid), 'chats', CHAT_CLUB, 'messages', 'mc-text'), {
      body: '',
      deletedForEveryone: true,
      deletedAt: '2026-01-02T00:00:00.000Z',
      deletedBy: uid,
      deletedByMod: true,
    });
  }

  it('un moderador activo puede retirar el mensaje de otro', async () => {
    await assertSucceeds(retirada(MOD));
  });

  it('un moderador silenciado en el club sigue pudiendo moderar', async () => {
    await assertSucceeds(retirada(MOD_MUTE));
  });

  it('un admin global activo puede retirarlo', async () => {
    await assertSucceeds(retirada(ADMIN));
  });

  it('un moderador baneado globalmente no puede moderar', async () => {
    await assertFails(retirada(BAN_MOD));
  });

  it('un admin baneado globalmente tampoco', async () => {
    await assertFails(retirada(BAN_ADMIN));
  });

  it('un miembro normal no puede retirar el mensaje de otro', async () => {
    await assertFails(retirada(BOB));
  });
});

// ═══════════════════════════════════════════════════════════
// ENCUESTAS: VOTOS
// ═══════════════════════════════════════════════════════════

describe('votos de encuesta', () => {
  it('un miembro normal vota', async () => {
    await assertSucceeds(
      setDoc(
        doc(db(ALICE), 'chats', 'g1', 'messages', 'm-poll', 'pollVotes', ALICE),
        voto(ALICE),
      ),
    );
  });

  it('un miembro normal puede cambiar su voto', async () => {
    await assertSucceeds(
      updateDoc(
        doc(db(BOB), 'chats', 'g1', 'messages', 'm-poll', 'pollVotes', BOB),
        { optionId: 'o2' },
      ),
    );
  });

  it('un baneado por bandera no puede votar ni cambiar su voto', async () => {
    await assertFails(
      setDoc(
        doc(db(BAN_FLAG), 'chats', 'g1', 'messages', 'm-poll-des', 'pollVotes', BAN_FLAG),
        voto(BAN_FLAG, 'o2'),
      ),
    );
    await assertFails(
      updateDoc(
        doc(db(BAN_FLAG), 'chats', 'g1', 'messages', 'm-poll', 'pollVotes', BAN_FLAG),
        { optionId: 'o2' },
      ),
    );
  });

  it('un baneado por registro no puede votar', async () => {
    await assertFails(
      setDoc(
        doc(db(BAN_REG), 'chats', 'g1', 'messages', 'm-poll', 'pollVotes', BAN_REG),
        voto(BAN_REG),
      ),
    );
  });

  it('una cuenta sin perfil no puede votar', async () => {
    await assertFails(
      setDoc(
        doc(db(NO_PROFILE), 'chats', 'g1', 'messages', 'm-poll', 'pollVotes', NO_PROFILE),
        voto(NO_PROFILE),
      ),
    );
  });

  it('un usuario con la restricción levantada sí vota', async () => {
    await assertSucceeds(
      setDoc(
        doc(db(DESBANEADO), 'chats', 'g1', 'messages', 'm-poll', 'pollVotes', DESBANEADO),
        voto(DESBANEADO),
      ),
    );
  });

  it('un moderador y un admin activos pueden votar en el club', async () => {
    await assertSucceeds(
      setDoc(
        doc(db(MOD), 'chats', CHAT_CLUB, 'messages', 'mc-poll', 'pollVotes', MOD),
        voto(MOD),
      ),
    );
    await assertSucceeds(
      setDoc(
        doc(db(ADMIN), 'chats', CHAT_CLUB, 'messages', 'mc-poll', 'pollVotes', ADMIN),
        voto(ADMIN),
      ),
    );
  });

  it('un moderador baneado globalmente no puede votar ni cambiar su voto', async () => {
    await assertFails(
      setDoc(
        doc(db(BAN_MOD), 'chats', CHAT_CLUB, 'messages', 'mc-poll-mute', 'pollVotes', BAN_MOD),
        voto(BAN_MOD, 'o2'),
      ),
    );
    await assertFails(
      updateDoc(
        doc(db(BAN_MOD), 'chats', CHAT_CLUB, 'messages', 'mc-poll', 'pollVotes', BAN_MOD),
        { optionId: 'o2' },
      ),
    );
  });

  it('borrar votos es moderación: mods y admin activos sí; baneados no', async () => {
    await assertSucceeds(
      deleteDoc(
        doc(db(MOD), 'chats', CHAT_CLUB, 'messages', 'mc-poll', 'pollVotes', MUTE),
      ),
    );
    await assertSucceeds(
      deleteDoc(
        doc(db(MOD_MUTE), 'chats', CHAT_CLUB, 'messages', 'mc-poll-mute', 'pollVotes', MUTE),
      ),
    );
    await assertSucceeds(
      deleteDoc(
        doc(db(ADMIN), 'chats', CHAT_CLUB, 'messages', 'mc-poll-ban', 'pollVotes', MUTE),
      ),
    );
    await assertFails(
      deleteDoc(
        doc(db(BAN_MOD), 'chats', CHAT_CLUB, 'messages', 'mc-poll', 'pollVotes', BAN_MOD),
      ),
    );
    await assertFails(
      deleteDoc(
        doc(db(BAN_ADMIN), 'chats', CHAT_CLUB, 'messages', 'mc-poll', 'pollVotes', ALICE),
      ),
    );
  });

  it('un miembro normal no puede borrar el voto de otro', async () => {
    await assertFails(
      deleteDoc(
        doc(db(BOB), 'chats', CHAT_CLUB, 'messages', 'mc-poll', 'pollVotes', ALICE),
      ),
    );
  });
});

// ═══════════════════════════════════════════════════════════
// ENCUESTAS: CIERRE
// ═══════════════════════════════════════════════════════════

describe('cerrar y reabrir encuestas', () => {
  it('el autor activo cierra su encuesta del grupo', async () => {
    await assertSucceeds(
      updateDoc(doc(db(BOB), 'chats', 'g1', 'messages', 'm-poll'), {
        'poll.isClosed': true,
      }),
    );
  });

  it('el autor baneado por bandera no puede cerrarla', async () => {
    await assertFails(
      updateDoc(doc(db(BAN_FLAG), 'chats', 'g1', 'messages', 'm-poll-ban'), {
        'poll.isClosed': true,
      }),
    );
  });

  it('el autor baneado por registro no puede cerrarla', async () => {
    await assertFails(
      updateDoc(doc(db(BAN_REG), 'chats', 'g1', 'messages', 'm-poll-ban-reg'), {
        'poll.isClosed': true,
      }),
    );
  });

  it('el autor sin perfil no puede cerrarla', async () => {
    await assertFails(
      updateDoc(doc(db(NO_PROFILE), 'chats', 'g1', 'messages', 'm-poll-sin'), {
        'poll.isClosed': true,
      }),
    );
  });

  it('el autor con la restricción levantada sí puede', async () => {
    await assertSucceeds(
      updateDoc(doc(db(DESBANEADO), 'chats', 'g1', 'messages', 'm-poll-des'), {
        'poll.isClosed': true,
      }),
    );
  });

  it('un moderador y un admin activos cierran la encuesta de otro en el club', async () => {
    await assertSucceeds(
      updateDoc(doc(db(MOD), 'chats', CHAT_CLUB, 'messages', 'mc-poll'), {
        'poll.isClosed': true,
      }),
    );
    await assertSucceeds(
      updateDoc(doc(db(ADMIN), 'chats', CHAT_CLUB, 'messages', 'mc-poll-admin'), {
        'poll.isClosed': true,
      }),
    );
  });

  it('un moderador silenciado en el club sigue pudiendo cerrarla', async () => {
    await assertSucceeds(
      updateDoc(doc(db(MOD_MUTE), 'chats', CHAT_CLUB, 'messages', 'mc-poll'), {
        'poll.isClosed': true,
      }),
    );
  });

  it('un moderador baneado globalmente no puede cerrarla', async () => {
    await assertFails(
      updateDoc(doc(db(BAN_MOD), 'chats', CHAT_CLUB, 'messages', 'mc-poll'), {
        'poll.isClosed': true,
      }),
    );
  });

  it('un admin baneado globalmente no puede cerrarla', async () => {
    await assertFails(
      updateDoc(doc(db(BAN_ADMIN), 'chats', CHAT_CLUB, 'messages', 'mc-poll'), {
        'poll.isClosed': true,
      }),
    );
  });

  it('un miembro normal que no es autor no puede cerrarla', async () => {
    await assertFails(
      updateDoc(doc(db(MUTE), 'chats', CHAT_CLUB, 'messages', 'mc-poll'), {
        'poll.isClosed': true,
      }),
    );
  });

  it('un silenciado en el club puede cerrar la encuesta que él creó', async () => {
    await assertSucceeds(
      updateDoc(doc(db(MUTE), 'chats', CHAT_CLUB, 'messages', 'mc-poll-mute'), {
        'poll.isClosed': true,
      }),
    );
  });
});

// ═══════════════════════════════════════════════════════════
// REACCIONES
// ═══════════════════════════════════════════════════════════

describe('reacciones a mensajes de chat', () => {
  it('un miembro activo crea, cambia y borra su reacción', async () => {
    await assertSucceeds(
      setDoc(
        doc(db(BOB), 'reactions', reaccionId(BOB, 'mc-text')),
        reaccion(BOB, CHAT_CLUB, 'mc-text'),
      ),
    );
    await assertSucceeds(
      updateDoc(doc(db(BOB), 'reactions', reaccionId(BOB, 'mc-text')), {
        type: 'cry',
      }),
    );
    await assertSucceeds(
      deleteDoc(doc(db(BOB), 'reactions', reaccionId(BOB, 'mc-text'))),
    );
  });

  it('un baneado por bandera no puede crear, cambiar ni borrar reacciones', async () => {
    await assertFails(
      setDoc(
        doc(db(BAN_FLAG), 'reactions', reaccionId(BAN_FLAG, 'mc-text')),
        reaccion(BAN_FLAG, CHAT_CLUB, 'mc-text'),
      ),
    );
    await assertFails(
      updateDoc(doc(db(BAN_FLAG), 'reactions', reaccionId(BAN_FLAG, 'm-text')), {
        type: 'cry',
      }),
    );
    await assertFails(
      deleteDoc(doc(db(BAN_FLAG), 'reactions', reaccionId(BAN_FLAG, 'm-text'))),
    );
  });

  it('un baneado por registro no puede reaccionar', async () => {
    await assertFails(
      setDoc(
        doc(db(BAN_REG), 'reactions', reaccionId(BAN_REG, 'm-text')),
        reaccion(BAN_REG, 'g1', 'm-text'),
      ),
    );
  });

  it('una cuenta sin perfil no puede reaccionar', async () => {
    await assertFails(
      setDoc(
        doc(db(NO_PROFILE), 'reactions', reaccionId(NO_PROFILE, 'm-text')),
        reaccion(NO_PROFILE, 'g1', 'm-text'),
      ),
    );
  });

  it('un usuario con la restricción levantada sí reacciona', async () => {
    await assertSucceeds(
      setDoc(
        doc(db(DESBANEADO), 'reactions', reaccionId(DESBANEADO, 'm-text')),
        reaccion(DESBANEADO, 'g1', 'm-text'),
      ),
    );
  });

  it('moderador y admin activos reaccionan en el club', async () => {
    await assertSucceeds(
      setDoc(
        doc(db(MOD), 'reactions', reaccionId(MOD, 'mc-text')),
        reaccion(MOD, CHAT_CLUB, 'mc-text'),
      ),
    );
    await assertSucceeds(
      setDoc(
        doc(db(ADMIN), 'reactions', reaccionId(ADMIN, 'mc-text')),
        reaccion(ADMIN, CHAT_CLUB, 'mc-text'),
      ),
    );
  });

  it('moderador y admin baneados globalmente no reaccionan', async () => {
    await assertFails(
      setDoc(
        doc(db(BAN_MOD), 'reactions', reaccionId(BAN_MOD, 'mc-text')),
        reaccion(BAN_MOD, CHAT_CLUB, 'mc-text'),
      ),
    );
    await assertFails(
      setDoc(
        doc(db(BAN_ADMIN), 'reactions', reaccionId(BAN_ADMIN, 'mc-text')),
        reaccion(BAN_ADMIN, CHAT_CLUB, 'mc-text'),
      ),
    );
  });

  it('quien no es miembro del chat no puede reaccionar', async () => {
    await assertFails(
      setDoc(
        doc(db(CARA), 'reactions', reaccionId(CARA, 'm-text')),
        reaccion(CARA, 'g1', 'm-text'),
      ),
    );
  });
});

// ═══════════════════════════════════════════════════════════
// MENSAJES FIJADOS
// ═══════════════════════════════════════════════════════════

describe('mensajes fijados', () => {
  it('un miembro activo fija en un grupo', async () => {
    await assertSucceeds(
      setDoc(
        doc(db(BOB), 'chats', 'g1', 'fijados', 'm-poll'),
        // La encuesta no tiene cuerpo: el resumen que guarda el
        // cliente es "Mensaje sin texto", no "Hola".
        fijado('g1', 'm-poll', BOB, BOB, { texto: 'Mensaje sin texto' }),
      ),
    );
  });

  it('un baneado no puede fijar en un grupo', async () => {
    await assertFails(
      setDoc(
        doc(db(BAN_FLAG), 'chats', 'g1', 'fijados', 'm-poll'),
        fijado('g1', 'm-poll', BOB, BAN_FLAG, { texto: 'Mensaje sin texto' }),
      ),
    );
  });

  it('un miembro normal del club no puede fijar; el moderador sí', async () => {
    await assertFails(
      setDoc(
        doc(db(BOB), 'chats', CHAT_CLUB, 'fijados', 'mc-pin'),
        fijado(CHAT_CLUB, 'mc-pin', BOB, BOB),
      ),
    );
    await assertSucceeds(
      setDoc(
        doc(db(MOD), 'chats', CHAT_CLUB, 'fijados', 'mc-pin'),
        fijado(CHAT_CLUB, 'mc-pin', BOB, MOD),
      ),
    );
  });

  it('un moderador silenciado en el club sigue pudiendo fijar', async () => {
    await assertSucceeds(
      setDoc(
        doc(db(MOD_MUTE), 'chats', CHAT_CLUB, 'fijados', 'mc-pin'),
        fijado(CHAT_CLUB, 'mc-pin', BOB, MOD_MUTE),
      ),
    );
  });

  it('moderador y admin baneados globalmente no pueden fijar', async () => {
    await assertFails(
      setDoc(
        doc(db(BAN_MOD), 'chats', CHAT_CLUB, 'fijados', 'mc-pin'),
        fijado(CHAT_CLUB, 'mc-pin', BOB, BAN_MOD),
      ),
    );
    await assertFails(
      setDoc(
        doc(db(BAN_ADMIN), 'chats', CHAT_CLUB, 'fijados', 'mc-pin'),
        fijado(CHAT_CLUB, 'mc-pin', BOB, BAN_ADMIN),
      ),
    );
  });

  it('el autor del fijado puede quitarlo; un baneado no', async () => {
    await assertSucceeds(
      deleteDoc(doc(db(ALICE), 'chats', 'g1', 'fijados', 'm-text')),
    );
    await assertFails(
      deleteDoc(doc(db(BAN_FLAG), 'chats', 'g1', 'fijados', 'm-text-ban')),
    );
  });

  it('un moderador silenciado en el club puede desfijar; uno baneado no', async () => {
    await assertFails(
      deleteDoc(doc(db(BAN_MOD), 'chats', CHAT_CLUB, 'fijados', 'mc-text')),
    );
    await assertFails(
      deleteDoc(doc(db(BAN_ADMIN), 'chats', CHAT_CLUB, 'fijados', 'mc-text')),
    );
    await assertSucceeds(
      deleteDoc(doc(db(MOD_MUTE), 'chats', CHAT_CLUB, 'fijados', 'mc-text')),
    );
  });
});

// ═══════════════════════════════════════════════════════════
// DOCUMENTO DEL CHAT: METADATOS, MIEMBROS Y PREFERENCIAS
// ═══════════════════════════════════════════════════════════

describe('documento del chat', () => {
  it('el dueño activo cambia metadatos; el baneado no', async () => {
    await assertSucceeds(
      updateDoc(doc(db(ALICE), 'chats', 'g1'), { name: 'Grupo renombrado' }),
    );
    await assertFails(
      updateDoc(doc(db(BAN_FLAG), 'chats', 'g-ban'), { name: 'Renombrado por baneado' }),
    );
  });

  it('el dueño activo transfiere el grupo; el baneado no', async () => {
    await assertSucceeds(
      updateDoc(doc(db(ALICE), 'chats', 'g1'), { ownerId: BOB }),
    );
    await assertFails(
      updateDoc(doc(db(BAN_FLAG), 'chats', 'g-ban'), { ownerId: BOB }),
    );
  });

  it('el dueño activo expulsa a un miembro del grupo; el baneado no', async () => {
    await assertSucceeds(
      updateDoc(doc(db(ALICE), 'chats', 'g1'), {
        memberIds: arrayRemove(BOB),
        hiddenFor: arrayUnion(BOB),
      }),
    );
    await assertFails(
      updateDoc(doc(db(BAN_FLAG), 'chats', 'g-ban'), {
        memberIds: arrayRemove(BOB),
        hiddenFor: arrayUnion(BOB),
      }),
    );
  });

  it('un admin activo puede tocar cualquier chat; uno baneado no', async () => {
    await assertSucceeds(
      updateDoc(doc(db(ADMIN), 'chats', 'g1'), { name: 'Moderado por admin' }),
    );
    await assertFails(
      updateDoc(doc(db(BAN_ADMIN), 'chats', 'g1'), { name: 'No debería' }),
    );
  });

  it('un miembro activo marca leído; un baneado no', async () => {
    await assertSucceeds(
      updateDoc(doc(db(BOB), 'chats', 'g1'), {
        // El cliente escribe un Timestamp del servidor, no una
        // cadena: la regla solo acepta su propia clave y un
        // timestamp real.
        readAt: { [BOB]: serverTimestamp() },
      }),
    );
    await assertFails(
      updateDoc(doc(db(BAN_FLAG), 'chats', 'g1'), {
        readAt: { [BAN_FLAG]: serverTimestamp() },
      }),
    );
  });

  it('un miembro activo sale del grupo; un baneado no', async () => {
    await assertSucceeds(
      updateDoc(doc(db(BOB), 'chats', 'g1'), {
        memberIds: arrayRemove(BOB),
        hiddenFor: arrayUnion(BOB),
      }),
    );
    await assertFails(
      updateDoc(doc(db(BAN_FLAG), 'chats', 'g1'), {
        memberIds: arrayRemove(BAN_FLAG),
        hiddenFor: arrayUnion(BAN_FLAG),
      }),
    );
  });

  it('el moderador activo expulsa a un miembro del club', async () => {
    await assertSucceeds(
      updateDoc(doc(db(MOD), 'chats', CHAT_CLUB), {
        memberIds: arrayRemove(BOB),
        hiddenFor: arrayUnion(BOB),
      }),
    );
  });

  it('el moderador silenciado en el club sigue expulsando', async () => {
    await assertSucceeds(
      updateDoc(doc(db(MOD_MUTE), 'chats', CHAT_CLUB), {
        memberIds: arrayRemove(BOB),
        hiddenFor: arrayUnion(BOB),
      }),
    );
  });

  it('el equipo baneado globalmente no puede expulsar', async () => {
    await assertFails(
      updateDoc(doc(db(BAN_MOD), 'chats', CHAT_CLUB), {
        memberIds: arrayRemove(BOB),
        hiddenFor: arrayUnion(BOB),
      }),
    );
    await assertFails(
      updateDoc(doc(db(BAN_ADMIN), 'chats', CHAT_CLUB), {
        memberIds: arrayRemove(BOB),
        hiddenFor: arrayUnion(BOB),
      }),
    );
  });

  it('el propietario activo vacía el chat del club; el baneado no', async () => {
    await assertSucceeds(
      updateDoc(doc(db(ALICE), 'chats', CHAT_CLUB), {
        memberIds: [],
        hiddenFor: arrayUnion(ALICE),
      }),
    );
    await assertFails(
      updateDoc(doc(db(BAN_FLAG), 'chats', 'cb1'), {
        memberIds: [],
        hiddenFor: arrayUnion(BAN_FLAG),
      }),
    );
  });

  it('el dueño activo borra el chat; el baneado no', async () => {
    await assertSucceeds(deleteDoc(doc(db(ALICE), 'chats', 'g1')));
    await assertFails(deleteDoc(doc(db(BAN_FLAG), 'chats', 'g-ban')));
  });

  it('un admin activo borra un chat; uno baneado no', async () => {
    await assertFails(deleteDoc(doc(db(BAN_ADMIN), 'chats', 'g1')));
    await assertSucceeds(deleteDoc(doc(db(ADMIN), 'chats', 'g1')));
  });

  it('solo un admin activo escribe la subcolección histórica members', async () => {
    await assertSucceeds(
      setDoc(doc(db(ADMIN), 'chats', 'g1', 'members', BOB), {
        uid: BOB,
        role: 'member',
      }),
    );
    await assertFails(
      setDoc(doc(db(BAN_ADMIN), 'chats', 'g1', 'members', BOB), {
        uid: BOB,
        role: 'member',
      }),
    );
  });

  it('un miembro activo escribe sus prefs; un baneado no', async () => {
    await assertSucceeds(
      setDoc(doc(db(BOB), 'chats', 'g1', 'prefs', BOB), {
        color: '#112233',
      }),
    );
    await assertFails(
      setDoc(doc(db(BAN_FLAG), 'chats', 'g1', 'prefs', BAN_FLAG), {
        color: '#112233',
      }),
    );
  });
});
