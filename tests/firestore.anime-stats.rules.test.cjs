/**
 * Reglas de las estadísticas de la wiki:
 *   - Los agregados (visitas y puntuación) no se tocan desde el cliente.
 *   - Los Me gusta del catálogo siguen funcionando aparte.
 *   - Cada usuario solo puede leer su propio voto.
 *   - Los registros de visitas no son accesibles desde el cliente.
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
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} = require('firebase/firestore');

const fs = require('fs');
const path = require('path');

const RULES = fs.readFileSync(
  path.join(__dirname, '..', 'firestore.rules'),
  'utf8',
);
const PROJECT = 'demo-geekapoo-anime-stats';
const ALICE = 'alice';
const BOB = 'bob';
const ADMIN = 'admin';

let testEnv;

function db(uid) {
  return testEnv.authenticatedContext(uid).firestore();
}

async function sembrar(fn) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await fn(ctx.firestore());
  });
}

function usuario(uid, role = 'user') {
  return {
    uid,
    username: uid,
    displayName: uid,
    chatId: `GK-${uid.toUpperCase()}`,
    avatarUrl: '',
    role,
    privateProfile: false,
    activityHidden: false,
    createdAt: serverTimestamp(),
  };
}

function anime(extra = {}) {
  return {
    slug: 'anime1',
    title: 'Anime de prueba',
    coverUrl: '',
    bannerUrl: '',
    synopsis: '',
    year: 2024,
    rating: 8.2,
    status: 'finished',
    episodesCount: 12,
    category: 'Shonen',
    categories: ['Shonen'],
    genres: ['Acción'],
    studio: 'Estudio',
    streaming: [],
    likesCount: 0,
    likedBy: [],
    commentsCount: 0,
    viewsCount: 0,
    communityRatingSum: 0,
    communityRatingCount: 0,
    communityRatingAvg: 0,
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
  await sembrar(async (f) => {
    await setDoc(doc(f, 'users', ALICE), usuario(ALICE));
    await setDoc(doc(f, 'users', BOB), usuario(BOB));
    await setDoc(doc(f, 'users', ADMIN), usuario(ADMIN, 'admin'));
    await setDoc(doc(f, 'animes', 'anime1'), anime());
    await setDoc(doc(f, 'animeRatings', 'anime1', 'votes', ALICE), {
      animeId: 'anime1',
      uid: ALICE,
      score: 9,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
  });
});

describe('agregados de los animes', () => {
  it('un admin puede crear un anime con las estadísticas a cero', async () => {
    await assertSucceeds(
      setDoc(doc(db(ADMIN), 'animes', 'nuevo'), {
        ...anime({ slug: 'nuevo', title: 'Nuevo' }),
        commentsCount: 0,
      }),
    );
  });

  it('NO puede crear un anime con visitas inventadas', async () => {
    await assertFails(
      setDoc(doc(db(ADMIN), 'animes', 'inventado'), {
        ...anime({ slug: 'inventado', title: 'Inventado' }),
        viewsCount: 999,
      }),
    );
  });

  it('un admin NO puede modificar viewsCount desde el cliente', async () => {
    await assertFails(
      updateDoc(doc(db(ADMIN), 'animes', 'anime1'), { viewsCount: 999 }),
    );
  });

  it('un moderador tampoco puede modificar la media', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', 'mod'), usuario('mod', 'moderator'));
    });
    await assertFails(
      updateDoc(doc(db('mod'), 'animes', 'anime1'), {
        communityRatingAvg: 10,
      }),
    );
  });

  it('los Me gusta del catálogo siguen funcionando', async () => {
    await assertSucceeds(
      updateDoc(doc(db(ALICE), 'animes', 'anime1'), {
        likedBy: [ALICE],
        likesCount: 1,
      }),
    );
  });

  it('no se puede mezclar un Me gusta con estadísticas', async () => {
    await assertFails(
      updateDoc(doc(db(ALICE), 'animes', 'anime1'), {
        likedBy: [ALICE],
        likesCount: 1,
        viewsCount: 50,
      }),
    );
  });
});

describe('votos de la comunidad', () => {
  it('cada usuario lee su propio voto', async () => {
    await assertSucceeds(
      getDoc(doc(db(ALICE), 'animeRatings', 'anime1', 'votes', ALICE)),
    );
  });

  it('no puede leer el voto de otra persona', async () => {
    await assertFails(
      getDoc(doc(db(BOB), 'animeRatings', 'anime1', 'votes', ALICE)),
    );
  });

  it('no puede listar todos los votos', async () => {
    await assertFails(
      getDocs(collection(db(ALICE), 'animeRatings', 'anime1', 'votes')),
    );
  });

  it('nadie escribe votos desde el cliente', async () => {
    await assertFails(
      setDoc(doc(db(BOB), 'animeRatings', 'anime1', 'votes', BOB), {
        animeId: 'anime1',
        uid: BOB,
        score: 10,
      }),
    );
  });
});

describe('registro de visitas', () => {
  it('nadie lee ni escribe los registros de visitas', async () => {
    await assertFails(getDoc(doc(db(ALICE), 'animeViewLogs', 'anime1_alice')));
    await assertFails(
      setDoc(doc(db(ALICE), 'animeViewLogs', 'anime1_alice'), {
        animeId: 'anime1',
      }),
    );
  });
});
