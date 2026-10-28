/**
 * Reglas de los "me gusta" de hilos y comentarios.
 *
 * Comprueba el modelo nuevo: un documento por persona con el uid
 * como id, y los contadores (`likedBy`, `likesCount`,
 * `commentsCount`) escritos solo por la Cloud Function.
 *
 * Los casos importantes son los que antes pasaban y no debían:
 *
 *   - Escribir `likedBy`/`likesCount`/`commentsCount` a mano.
 *   - Crear un "me gusta" en el path de otra persona.
 *   - Duplicar el "me gusta" propio con un id inventado.
 *   - Que un baneado siga pudiendo dar o quitar "me gusta".
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
  serverTimestamp,
} = require('firebase/firestore');

const fs = require('fs');
const path = require('path');

const RULES = fs.readFileSync(
  path.join(__dirname, '..', 'firestore.rules'),
  'utf8',
);
const PROJECT = 'demo-geekapoo-likes';

const ALICE = 'alice';
const BOB = 'bob';
const BANNED = 'baneado';
const MOD = 'moderador';
const ADMIN = 'admin';

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

async function crearUsuario(uid, extra = {}) {
  await sembrar(async (f) => {
    await setDoc(doc(f, 'users', uid), {
      uid,
      email: `${uid}@test.com`,
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

/** Hilo con la forma que deja el cliente nuevo: sin contadores. */
function nuevoHilo(extra = {}) {
  return {
    authorId: ALICE,
    authorName: 'alice',
    authorAvatar: '',
    title: 'Debate',
    body: 'Goku vs Saitama',
    categoryId: 'debates',
    categoryName: 'Debates',
    tags: ['General', 'Debate'],
    pinned: false,
    createdAt: serverTimestamp(),
    ...extra,
  };
}

function nuevoComentario(extra = {}) {
  return {
    authorId: ALICE,
    authorName: 'alice',
    authorAvatar: '',
    targetType: 'thread',
    targetId: 'hilo1',
    parentId: null,
    body: 'Yo voto a Goku',
    createdAt: serverTimestamp(),
    ...extra,
  };
}

function like(uid, extra = {}) {
  return {
    userId: uid,
    createdAt: serverTimestamp(),
    ...extra,
  };
}

describe('me gusta por usuario y contadores del servidor', () => {
  before(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT,
      firestore: { rules: RULES },
    });

    await crearUsuario(ALICE);
    await crearUsuario(BOB);
    await crearUsuario(BANNED, { isBanned: true });
    await crearUsuario(MOD, { role: 'moderator' });
    await crearUsuario(ADMIN, { role: 'admin' });

    await sembrar(async (f) => {
      await setDoc(doc(f, 'threads', 'hilo1'), {
        ...nuevoHilo(),
        likesCount: 0,
        likedBy: [],
        commentsCount: 0,
      });
      await setDoc(doc(f, 'threads', 'hilo2'), {
        ...nuevoHilo(),
        likesCount: 0,
        likedBy: [],
        commentsCount: 0,
      });
      await setDoc(doc(f, 'comments', 'com1'), {
        ...nuevoComentario(),
        likesCount: 0,
        likedBy: [],
      });
      await setDoc(doc(f, 'animes', 'anime1'), {
        title: 'Anime',
        commentsCount: 0,
        likesCount: 0,
        likedBy: [],
      });
    });
  });

  after(async () => {
    await testEnv.cleanup();
  });

  // ==========================================================
  // 1. DOCUMENTO POR PERSONA
  // ==========================================================

  describe('documento de "me gusta" del hilo', () => {
    it('cada persona crea el suyo con su uid como id', async () => {
      await assertSucceeds(
        setDoc(doc(db(ALICE), 'threads', 'hilo1', 'likes', ALICE), like(ALICE)),
      );
    });

    it('cualquiera puede leer los "me gusta" de un hilo público', async () => {
      await assertSucceeds(
        getDoc(doc(anon(), 'threads', 'hilo1', 'likes', ALICE)),
      );
      await assertSucceeds(
        getDocs(collection(db(BOB), 'threads', 'hilo1', 'likes')),
      );
    });

    it('NO se puede reescribir el documento (no hay update)', async () => {
      await assertFails(
        setDoc(
          doc(db(ALICE), 'threads', 'hilo1', 'likes', ALICE),
          like(BOB),
        ),
      );
      await assertFails(
        updateDoc(doc(db(ALICE), 'threads', 'hilo1', 'likes', ALICE), {
          userId: BOB,
        }),
      );
    });

    it('NO se puede crear en el path de otra persona', async () => {
      await assertFails(
        setDoc(doc(db(ALICE), 'threads', 'hilo1', 'likes', BOB), like(ALICE)),
      );
      await assertFails(
        setDoc(doc(db(ALICE), 'threads', 'hilo1', 'likes', BOB), like(BOB)),
      );
    });

    it('NO se puede inventar un id para duplicar el "me gusta"', async () => {
      await assertFails(
        setDoc(
          doc(db(ALICE), 'threads', 'hilo1', 'likes', 'mi-like-favorito'),
          like(ALICE),
        ),
      );
    });

    it('NO se puede meter un userId distinto del path', async () => {
      await assertFails(
        setDoc(
          doc(db(ALICE), 'threads', 'hilo1', 'likes', ALICE),
          like(BOB),
        ),
      );
    });

    it('NO se pueden colar campos extra', async () => {
      await assertFails(
        setDoc(doc(db(ALICE), 'threads', 'hilo2', 'likes', ALICE), {
          ...like(ALICE),
          likesCount: 9999,
        }),
      );
    });

    it('NO se puede dar "me gusta" a un hilo que no existe', async () => {
      await assertFails(
        setDoc(
          doc(db(ALICE), 'threads', 'fantasma', 'likes', ALICE),
          like(ALICE),
        ),
      );
    });

    it('NO se puede dar "me gusta" sin iniciar sesión', async () => {
      await assertFails(
        setDoc(doc(anon(), 'threads', 'hilo2', 'likes', ALICE), like(ALICE)),
      );
    });

    it('cada quien borra el suyo, y solo el suyo', async () => {
      await assertSucceeds(
        setDoc(doc(db(BOB), 'threads', 'hilo2', 'likes', BOB), like(BOB)),
      );
      await assertFails(
        deleteDoc(doc(db(ALICE), 'threads', 'hilo2', 'likes', BOB)),
      );
      await assertSucceeds(
        deleteDoc(doc(db(BOB), 'threads', 'hilo2', 'likes', BOB)),
      );
    });
  });

  describe('documento de "me gusta" del comentario', () => {
    it('cada persona crea el suyo y lo puede quitar', async () => {
      await assertSucceeds(
        setDoc(doc(db(ALICE), 'comments', 'com1', 'likes', ALICE), like(ALICE)),
      );
      await assertFails(
        deleteDoc(doc(db(BOB), 'comments', 'com1', 'likes', ALICE)),
      );
      await assertSucceeds(
        deleteDoc(doc(db(ALICE), 'comments', 'com1', 'likes', ALICE)),
      );
    });

    it('NO se puede dar "me gusta" a un comentario que no existe', async () => {
      await assertFails(
        setDoc(
          doc(db(ALICE), 'comments', 'fantasma', 'likes', ALICE),
          like(ALICE),
        ),
      );
    });
  });

  // ==========================================================
  // 2. BANEADOS
  // ==========================================================

  describe('usuarios baneados', () => {
    it('NO pueden dar "me gusta" a un hilo', async () => {
      await assertFails(
        setDoc(doc(db(BANNED), 'threads', 'hilo1', 'likes', BANNED), like(BANNED)),
      );
    });

    it('NO pueden quitarlo aunque el documento ya exista', async () => {
      await sembrar(async (f) => {
        await setDoc(
          doc(f, 'threads', 'hilo1', 'likes', BANNED),
          { userId: BANNED, createdAt: '2026-01-01T00:00:00.000Z' },
        );
      });

      await assertFails(
        deleteDoc(doc(db(BANNED), 'threads', 'hilo1', 'likes', BANNED)),
      );
    });

    it('tampoco pueden dar "me gusta" a un comentario', async () => {
      await assertFails(
        setDoc(
          doc(db(BANNED), 'comments', 'com1', 'likes', BANNED),
          like(BANNED),
        ),
      );
    });
  });

  // ==========================================================
  // 3. CONTADORES DEL SERVIDOR
  // ==========================================================

  describe('contadores de hilos y comentarios', () => {
    it('el autor NO puede escribir likedBy/likesCount/commentsCount', async () => {
      await assertFails(
        updateDoc(doc(db(ALICE), 'threads', 'hilo1'), {
          likesCount: 9999,
        }),
      );
      await assertFails(
        updateDoc(doc(db(ALICE), 'threads', 'hilo1'), {
          likedBy: [ALICE, BOB],
        }),
      );
      await assertFails(
        updateDoc(doc(db(ALICE), 'threads', 'hilo1'), {
          commentsCount: 9999,
        }),
      );
    });

    it('el moderador y el admin tampoco pueden tocarlos', async () => {
      await assertFails(
        updateDoc(doc(db(MOD), 'threads', 'hilo1'), {
          likesCount: 9999,
        }),
      );
      await assertFails(
        updateDoc(doc(db(ADMIN), 'threads', 'hilo1'), {
          likedBy: [ADMIN],
        }),
      );
      await assertFails(
        updateDoc(doc(db(MOD), 'threads', 'hilo1'), {
          commentsCount: 9999,
        }),
      );
    });

    it('el equipo sigue pudiendo moderar otros campos', async () => {
      await assertSucceeds(
        updateDoc(doc(db(MOD), 'threads', 'hilo2'), { pinned: true }),
      );
      await assertSucceeds(
        updateDoc(doc(db(MOD), 'threads', 'hilo2'), { title: 'Título moderado' }),
      );
    });

    it('el autor NO puede tocar likedBy/likesCount de su comentario', async () => {
      await assertFails(
        updateDoc(doc(db(ALICE), 'comments', 'com1'), {
          likesCount: 9999,
        }),
      );
      await assertFails(
        updateDoc(doc(db(ALICE), 'comments', 'com1'), {
          likedBy: [ALICE],
        }),
      );
    });

    it('el autor sí puede editar el texto de su comentario', async () => {
      await assertSucceeds(
        updateDoc(doc(db(ALICE), 'comments', 'com1'), {
          body: 'Texto nuevo',
        }),
      );
    });

    it('NO se pueden inventar los contadores al crear el hilo', async () => {
      await assertFails(
        setDoc(
          doc(db(BOB), 'threads', 'hiloFalso'),
          nuevoHilo({
            authorId: BOB,
            likesCount: 10,
            likedBy: [BOB],
            commentsCount: 5,
          }),
        ),
      );
    });

    it('sí se aceptan los ceros iniciales de un cliente antiguo', async () => {
      await assertSucceeds(
        setDoc(
          doc(db(BOB), 'threads', 'hiloCeros'),
          nuevoHilo({
            authorId: BOB,
            likesCount: 0,
            likedBy: [],
            commentsCount: 0,
          }),
        ),
      );
    });

    it('NO se pueden inventar los "me gusta" al crear el comentario', async () => {
      await assertFails(
        setDoc(
          doc(db(BOB), 'comments', 'comFalso'),
          nuevoComentario({
            authorId: BOB,
            likesCount: 1,
            likedBy: [BOB],
          }),
        ),
      );
    });

    it('NO se puede tocar commentsCount desde el panel de anime', async () => {
      await assertFails(
        updateDoc(doc(db(MOD), 'animes', 'anime1'), {
          commentsCount: 9999,
        }),
      );
      await assertSucceeds(
        updateDoc(doc(db(MOD), 'animes', 'anime1'), {
          title: 'Anime editado',
        }),
      );
    });

    it('el libro de contadores es solo del servidor', async () => {
      await assertFails(
        setDoc(doc(db(ADMIN), 'engagement_ledger', 'com1'), {
          commentId: 'com1',
          action: 'created',
        }),
      );
      await assertFails(
        getDoc(doc(db(ADMIN), 'engagement_ledger', 'com1')),
      );
      await assertFails(
        getDoc(doc(anon(), 'engagement_ledger', 'com1')),
      );
    });
  });
});
