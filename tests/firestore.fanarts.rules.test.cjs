/**
 * Pruebas de las reglas de Fanarts.
 *
 * Comprueba que:
 *   - Un fanart solo se crea con la ficha y las imágenes completas.
 *   - Un hilo normal no puede colarse en la categoría `fanarts`.
 *   - El autor puede editar/borrar lo suyo y nadie más puede.
 *   - Un baneado no publica.
 *   - Los fanarts guardados son privados y solo aceptan fanarts.
 *
 * Se ejecuta con `npm run test:rules`.
 */
const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} = require('@firebase/rules-unit-testing');
const {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  collection,
  getDocs,
  serverTimestamp,
} = require('firebase/firestore');

const fs = require('fs');
const path = require('path');

const RULES = fs.readFileSync(
  path.join(__dirname, '..', 'firestore.rules'),
  'utf8',
);
const PROJECT = 'demo-geekapoo-fanarts';

const ALICE = 'alice';
const BOB = 'bob';
const BANEADO = 'baneado';

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
      chatId: `GK-${uid}`,
      avatarUrl: '',
      role: 'user',
      createdAt: '2026-01-01T00:00:00.000Z',
      isBanned: false,
      ...extra,
    });
  });
}

const IMAGEN_1 =
  'https://firebasestorage.googleapis.com/v0/b/demo/o/community%2Falice%2Ffanart-1.jpg?alt=media';
const IMAGEN_2 =
  'https://firebasestorage.googleapis.com/v0/b/demo/o/community%2Falice%2Ffanart-2.png?alt=media';

function nuevoFanart(extra = {}) {
  return {
    authorId: ALICE,
    authorName: 'alice',
    authorAvatar: '',
    title: 'Frieren en el bosque',
    body: 'Mi homenaje favorito.',
    categoryId: 'fanarts',
    categoryName: 'Fanart',
    tags: ['Dibujo digital', 'Ilustración original', 'Anime / Manga'],
    kind: 'fanart',
    fanart: {
      original: true,
      medium: 'digital',
      source: 'Frieren',
    },
    images: [
      { url: IMAGEN_1, width: 1000, height: 1500 },
      { url: IMAGEN_2, width: 1200, height: 800 },
    ],
    imageUrl: IMAGEN_1,
    imageWidth: 1000,
    imageHeight: 1500,
    likesCount: 0,
    likedBy: [],
    commentsCount: 0,
    pinned: false,
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
  await testEnv.clearFirestore();
  await crearUsuario(ALICE);
  await crearUsuario(BOB);
  await crearUsuario(BANEADO, { isBanned: true });

  await sembrar(async (f) => {
    await setDoc(doc(f, 'threads', 'fanart1'), nuevoFanart());
    await setDoc(doc(f, 'threads', 'normal1'), {
      authorId: ALICE,
      authorName: 'alice',
      authorAvatar: '',
      title: 'Debate normal',
      body: 'Goku vs Saitama',
      categoryId: 'debates',
      categoryName: 'Debates',
      tags: ['General', 'Debate'],
      likesCount: 0,
      likedBy: [],
      commentsCount: 0,
      pinned: false,
      createdAt: '2026-01-01T00:00:00.000Z',
    });
  });
});

describe('Crear fanarts', () => {
  it('el autor crea un fanart válido', async () => {
    await assertSucceeds(
      setDoc(doc(db(ALICE), 'threads', 'nuevo'), nuevoFanart()),
    );
  });

  it('un fanart necesita al menos una imagen', async () => {
    await assertFails(
      setDoc(
        doc(db(ALICE), 'threads', 'sin-imagenes'),
        nuevoFanart({ images: [], imageUrl: '' }),
      ),
    );
  });

  it('rechaza URLs que no sean https', async () => {
    await assertFails(
      setDoc(
        doc(db(ALICE), 'threads', 'http'),
        nuevoFanart({
          images: [{ url: 'http://evil.example/a.jpg' }],
          imageUrl: 'http://evil.example/a.jpg',
        }),
      ),
    );
  });

  it('rechaza más de seis imágenes', async () => {
    const images = Array.from({ length: 7 }, (_, i) => ({
      url: `https://example.com/${i}.jpg`,
    }));
    await assertFails(
      setDoc(
        doc(db(ALICE), 'threads', 'muchas'),
        nuevoFanart({ images, imageUrl: images[0].url }),
      ),
    );
  });

  it('un hilo normal no puede marcarse como fanart', async () => {
    await assertFails(
      setDoc(
        doc(db(ALICE), 'threads', 'colado'),
        nuevoFanart({ categoryId: 'debates', categoryName: 'Debates' }),
      ),
    );
  });

  it('la categoría fanarts no vale sin la ficha', async () => {
    await assertFails(
      setDoc(
        doc(db(ALICE), 'threads', 'sin-ficha'),
        nuevoFanart({ kind: null, fanart: null }),
      ),
    );
  });

  it('un hilo normal sigue creándose sin campos de fanart', async () => {
    await assertSucceeds(
      setDoc(doc(db(ALICE), 'threads', 'normal2'), {
        authorId: ALICE,
        authorName: 'alice',
        authorAvatar: '',
        title: 'Hilo normal',
        body: 'Esto no es un fanart.',
        categoryId: 'debates',
        categoryName: 'Debates',
        tags: ['General', 'Debate'],
        likesCount: 0,
        likedBy: [],
        commentsCount: 0,
        pinned: false,
        createdAt: '2026-01-01T00:00:00.000Z',
      }),
    );
  });

  it('un baneado no publica', async () => {
    await assertFails(
      setDoc(
        doc(db(BANEADO), 'threads', 'baneado'),
        nuevoFanart({
          authorId: BANEADO,
          authorName: 'baneado',
        }),
      ),
    );
  });

  it('nadie publica en nombre de otra persona', async () => {
    await assertFails(
      setDoc(doc(db(BOB), 'threads', 'suplantado'), nuevoFanart()),
    );
  });
});

describe('Editar y borrar fanarts', () => {
  it('el autor edita título, cuerpo y etiquetas', async () => {
    await assertSucceeds(
      updateDoc(doc(db(ALICE), 'threads', 'fanart1'), {
        title: 'Frieren, versión final',
        body: 'Cambié la luz.',
        tags: ['Dibujo digital', 'Anime / Manga'],
      }),
    );
  });

  it('otra persona no edita el fanart', async () => {
    await assertFails(
      updateDoc(doc(db(BOB), 'threads', 'fanart1'), {
        title: 'robado',
      }),
    );
  });

  it('otra persona no borra el fanart', async () => {
    await assertFails(deleteDoc(doc(db(BOB), 'threads', 'fanart1')));
  });

  it('el autor borra su fanart', async () => {
    await assertSucceeds(deleteDoc(doc(db(ALICE), 'threads', 'fanart1')));
  });
});

describe('Fanarts guardados', () => {
  it('el dueño guarda un fanart en su subcolección', async () => {
    await assertSucceeds(
      setDoc(doc(db(ALICE), 'users', ALICE, 'favoriteFanarts', 'fanart1'), {
        threadId: 'fanart1',
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('no se puede guardar en la carpeta de otra persona', async () => {
    await assertFails(
      setDoc(doc(db(BOB), 'users', ALICE, 'favoriteFanarts', 'fanart1'), {
        threadId: 'fanart1',
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('solo se guardan hilos de la categoría fanarts', async () => {
    await assertFails(
      setDoc(doc(db(ALICE), 'users', ALICE, 'favoriteFanarts', 'normal1'), {
        threadId: 'normal1',
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('no se puede guardar un id inventado', async () => {
    await assertFails(
      setDoc(doc(db(ALICE), 'users', ALICE, 'favoriteFanarts', 'no-existe'), {
        threadId: 'no-existe',
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('cada persona solo lee los suyos', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'users', ALICE, 'favoriteFanarts', 'fanart1'), {
        threadId: 'fanart1',
        createdAt: '2026-01-01T00:00:00.000Z',
      });
    });

    await assertSucceeds(
      getDoc(doc(db(ALICE), 'users', ALICE, 'favoriteFanarts', 'fanart1')),
    );
    await assertFails(
      getDoc(doc(db(BOB), 'users', ALICE, 'favoriteFanarts', 'fanart1')),
    );
  });

  it('el dueño quita el guardado', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'users', ALICE, 'favoriteFanarts', 'fanart1'), {
        threadId: 'fanart1',
        createdAt: '2026-01-01T00:00:00.000Z',
      });
    });

    await assertSucceeds(
      deleteDoc(doc(db(ALICE), 'users', ALICE, 'favoriteFanarts', 'fanart1')),
    );
  });
});
