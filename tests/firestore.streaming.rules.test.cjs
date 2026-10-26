/**
 * Reglas de la disponibilidad regional de streaming.
 *
 * La wiki es pública, así que el catálogo de plataformas, las
 * regiones y las filas de disponibilidad se leen sin sesión. Lo que
 * no puede hacer cualquiera es escribir: solo admin y moderadores.
 *
 * También se comprueba la forma mínima de una fila (obra,
 * plataforma, región y estado) para que una escritura accidental no
 * deje datos que la interfaz no pueda interpretar.
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
  limit,
  query,
  setDoc,
  updateDoc,
  where,
} = require('firebase/firestore');

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const RULES = fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8');
const PROJECT = 'demo-geekapoo-streaming';

const ADMIN = 'admin';
const MOD = 'moderator';
const USER = 'user';
const SIN_PERFIL = 'sin-perfil';

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

async function crearUsuario(uid, role = 'user') {
  await sembrar(async (f) => {
    await setDoc(doc(f, 'users', uid), {
      uid,
      email: `${uid}@test.com`,
      username: uid,
      displayName: uid,
      chatId: `GK-${uid}`,
      avatarUrl: '',
      role,
      createdAt: '2026-01-01T00:00:00.000Z',
      isBanned: false,
    });
  });
}

function disponibilidad(animeId, platformId, region, extra = {}) {
  return {
    animeId,
    platformId,
    region,
    status: 'available',
    ...extra,
  };
}

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT,
    firestore: { rules: RULES },
  });

  await crearUsuario(ADMIN, 'admin');
  await crearUsuario(MOD, 'moderator');
  await crearUsuario(USER, 'user');

  await sembrar(async (f) => {
    await setDoc(doc(f, 'animes', 'a1'), { title: 'Obra pública' });
    await setDoc(doc(f, 'animes', 'a2'), { title: 'Otra obra' });

    await setDoc(doc(f, 'streamingPlatforms', 'crunchyroll'), {
      name: 'Crunchyroll',
      badgeColor: '#f47521',
    });
    await setDoc(doc(f, 'streamingRegions', 'ES'), {
      name: 'España',
      order: 10,
    });

    await setDoc(
      doc(f, 'streamingAvailability', 'a1__crunchyroll__ES'),
      disponibilidad('a1', 'crunchyroll', 'ES', {
        status: 'available',
        accessType: 'subscription',
        url: 'https://example.com/crunchyroll-es',
        verifiedAt: '2026-03-12',
      }),
    );
    await setDoc(
      doc(f, 'streamingAvailability', 'a1__hulu__ES'),
      disponibilidad('a1', 'hulu', 'ES', { status: 'unverified' }),
    );
    await setDoc(
      doc(f, 'streamingAvailability', 'a1__netflix__MX'),
      disponibilidad('a1', 'netflix', 'MX', { status: 'unavailable' }),
    );
    await setDoc(
      doc(f, 'streamingAvailability', 'a2__crunchyroll__ES'),
      disponibilidad('a2', 'crunchyroll', 'ES', { status: 'unavailable' }),
    );
  });
});

after(async () => {
  await testEnv.cleanup();
});

describe('disponibilidad regional: lectura pública', () => {
  it('permite leer una fila sin sesión, esté disponible o no', async () => {
    await assertSucceeds(
      getDoc(doc(anon(), 'streamingAvailability', 'a1__crunchyroll__ES')),
    );
    await assertSucceeds(getDoc(doc(anon(), 'streamingAvailability', 'a1__hulu__ES')));
    await assertSucceeds(getDoc(doc(anon(), 'streamingAvailability', 'a1__netflix__MX')));
  });

  it('permite consultar solo la obra y la región elegidas', async () => {
    const snap = await assertSucceeds(
      getDocs(
        query(
          collection(anon(), 'streamingAvailability'),
          where('animeId', '==', 'a1'),
          where('region', '==', 'ES'),
          limit(10),
        ),
      ),
    );

    assert.equal(snap.size, 2);
    assert.deepEqual(
      snap.docs.map((row) => row.id).sort(),
      ['a1__crunchyroll__ES', 'a1__hulu__ES'],
    );
  });

  it('permite leer plataformas y regiones sin sesión', async () => {
    await assertSucceeds(getDoc(doc(anon(), 'streamingPlatforms', 'crunchyroll')));
    await assertSucceeds(getDoc(doc(anon(), 'streamingRegions', 'ES')));
  });
});

describe('región preferida en el perfil', () => {
  it('permite guardar la región en el documento propio', async () => {
    await assertSucceeds(
      updateDoc(doc(db(USER), 'users', USER), { regionPreferida: 'MX' }),
    );

    const perfil = await assertSucceeds(getDoc(doc(db(USER), 'users', USER)));
    assert.equal(perfil.data().regionPreferida, 'MX');
  });

  it('no permite cambiar la región del perfil de otra cuenta', async () => {
    await assertFails(
      updateDoc(doc(db(USER), 'users', MOD), { regionPreferida: 'MX' }),
    );
  });
});

describe('disponibilidad regional: escritura', () => {
  it('niega escribir a un visitante, a un usuario normal o sin perfil', async () => {
    const nueva = disponibilidad('a1', 'netflix', 'ES');

    await assertFails(
      setDoc(doc(anon(), 'streamingAvailability', 'a1__netflix__ES'), nueva),
    );
    await assertFails(
      setDoc(doc(db(USER), 'streamingAvailability', 'a1__netflix__ES'), nueva),
    );
    await assertFails(
      setDoc(doc(db(SIN_PERFIL), 'streamingAvailability', 'a1__netflix__ES'), nueva),
    );
  });

  it('permite crear, actualizar y borrar a un moderador', async () => {
    const ref = doc(db(MOD), 'streamingAvailability', 'a2__netflix__MX');

    await assertSucceeds(
      setDoc(
        ref,
        disponibilidad('a2', 'netflix', 'MX', {
          status: 'available',
          accessType: 'subscription',
          url: 'https://example.com/netflix-mx',
          verifiedAt: '2026-03-13',
        }),
      ),
    );

    await assertSucceeds(updateDoc(ref, { status: 'unavailable' }));
    await assertSucceeds(deleteDoc(ref));
  });

  it('permite crear a un administrador', async () => {
    await assertSucceeds(
      setDoc(
        doc(db(ADMIN), 'streamingAvailability', 'a2__hulu__US'),
        disponibilidad('a2', 'hulu', 'US', { status: 'unverified' }),
      ),
    );
  });

  it('rechaza estados o campos imprescindibles inválidos', async () => {
    await assertFails(
      setDoc(
        doc(db(MOD), 'streamingAvailability', 'a1__inventada__ES'),
        disponibilidad('a1', 'inventada', 'ES', { status: 'quizas' }),
      ),
    );

    await assertFails(
      setDoc(doc(db(MOD), 'streamingAvailability', 'a1__sin-region__ES'), {
        animeId: 'a1',
        platformId: 'sin-region',
        region: '',
        status: 'available',
      }),
    );

    await assertFails(
      setDoc(doc(db(MOD), 'streamingAvailability', 'sin-obra__netflix__ES'), {
        platformId: 'netflix',
        region: 'ES',
        status: 'available',
      }),
    );
  });

  it('solo el equipo puede modificar plataformas y regiones', async () => {
    await assertFails(
      setDoc(doc(db(USER), 'streamingPlatforms', 'nueva'), { name: 'Nueva' }),
    );
    await assertSucceeds(
      setDoc(doc(db(MOD), 'streamingPlatforms', 'nueva'), {
        name: 'Nueva',
        badgeColor: '#22c55e',
      }),
    );
    await assertFails(
      setDoc(doc(db(MOD), 'streamingPlatforms', 'mal'), { name: 'X' }),
    );

    await assertFails(
      setDoc(doc(db(USER), 'streamingRegions', 'PT'), { name: 'Portugal' }),
    );
    await assertSucceeds(
      setDoc(doc(db(MOD), 'streamingRegions', 'PT'), { name: 'Portugal' }),
    );
  });
});
