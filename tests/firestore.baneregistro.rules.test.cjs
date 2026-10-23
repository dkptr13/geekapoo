/**
 * Pruebas del sistema de BANEOS y del registro duradero.
 *
 * El fallo que se arregla aquí tenía dos mitades:
 *
 *   1. `isActive()` solo miraba "no está baneado", e `isBanned()`
 *      devolvía `false` cuando el perfil no existía. Una cuenta de
 *      Firebase Auth SIN documento en `users/{uid}` podía escribir
 *      hilos, follows y solicitudes como si fuera un usuario más.
 *   2. El baneo vivía SOLO en `users/{uid}.isBanned`, un documento
 *      que su dueño puede borrar. Borrar el perfil y volver a
 *      entrar creaba uno nuevo con `isBanned: false` y el baneo
 *      desaparecía.
 *
 * Ahora la fuente de verdad es `accountRestrictions/{uid}`, que
 * solo escriben las Cloud Functions con el Admin SDK. Estas
 * pruebas levantan el emulador y comprueban, con las reglas de
 * verdad, que:
 *
 *   - un usuario normal puede publicar;
 *   - un baneado (por la bandera o por el registro) no puede;
 *   - el baneo sobrevive a borrar y recrear el perfil;
 *   - un moderador y un admin NO pueden banear desde el cliente:
 *     tienen que usar las callables;
 *   - una cuenta sin perfil no puede escribir nada;
 *   - nadie puede escribir el registro desde el cliente.
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
  collection,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  addDoc,
} = require('firebase/firestore');

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const RULES = fs.readFileSync(
  path.join(__dirname, '..', 'firestore.rules'),
  'utf8',
);
const PROJECT = 'demo-geekapoo-baneos';

const NORMAL = 'normal';
const BANEADO = 'baneado';
const BANEADO_REGISTRO = 'baneado-registro';
const DESBANEADO = 'desbaneado';
const RECREADO = 'recreado';
const MOD = 'moderador';
const ADMIN = 'admin';
const SIN_PERFIL = 'sin-perfil';

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

/**
 * Deja una restricción en el registro duradero, saltándose las
 * reglas (es lo que haría la Cloud Function con el Admin SDK).
 */
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

/** Perfil nuevo tal cual lo escribe AuthContext al recrear la cuenta. */
function perfilNuevo(uid, extra = {}) {
  return {
    uid,
    email: `${uid}@test.com`,
    username: uid,
    displayName: uid,
    chatId: `GK-${uid}`,
    avatarUrl: '',
    role: 'user',
    isBanned: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    lastSeen: 'En línea',
    bio: 'Comunidad geekapoo.com',
    ...extra,
  };
}

/** Un hilo con los campos que exige la regla de creación. */
function hilo(autor) {
  return {
    authorId: autor,
    authorName: autor,
    authorAvatar: '',
    title: 'Hilo de prueba',
    body: 'Contenido del hilo',
    categoryId: 'debates',
    categoryName: 'Debates',
    tags: ['General'],
    likesCount: 0,
    likedBy: [],
    commentsCount: 0,
    createdAt: new Date(),
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

  await crearUsuario(NORMAL);
  await crearUsuario(BANEADO, { isBanned: true });
  await crearUsuario(BANEADO_REGISTRO);
  await crearUsuario(DESBANEADO);
  await crearUsuario(RECREADO);
  await crearUsuario(MOD, { role: 'moderator' });
  await crearUsuario(ADMIN, { role: 'admin' });
  // SIN_PERFIL no tiene documento en `users`: es una cuenta de
  // Firebase Auth que nunca llegó a crear su perfil.

  await crearRestriccion(BANEADO_REGISTRO);
  await crearRestriccion(RECREADO);
  await crearRestriccion(DESBANEADO, { activo: false, motivo: 'Ya cumplido' });
});

// ═══════════════════════════════════════════════════════════
// USUARIO NORMAL
// ═══════════════════════════════════════════════════════════

describe('usuario normal', () => {
  it('puede publicar un hilo', async () => {
    await assertSucceeds(addDoc(collection(db(NORMAL), 'threads'), hilo(NORMAL)));
  });

  it('puede seguir a otra persona', async () => {
    await assertSucceeds(
      setDoc(doc(db(NORMAL), 'users', BANEADO, 'followers', NORMAL), {
        followerId: NORMAL,
        followingId: BANEADO,
        createdAt: new Date(),
      }),
    );
  });

  it('puede leer su propia restricción (aunque no tenga)', async () => {
    await assertSucceeds(
      getDoc(doc(db(NORMAL), 'accountRestrictions', NORMAL)),
    );
  });

  it('NO puede leer la restricción de otra persona', async () => {
    await assertFails(
      getDoc(doc(db(NORMAL), 'accountRestrictions', BANEADO_REGISTRO)),
    );
  });
});

// ═══════════════════════════════════════════════════════════
// USUARIO BANEADO
// ═══════════════════════════════════════════════════════════

describe('usuario baneado', () => {
  it('puede seguir LEYENDO (el baneo no es una censura de lectura)', async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'threads', 'visible'), hilo(NORMAL));
    });

    await assertSucceeds(getDoc(doc(db(BANEADO), 'threads', 'visible')));
  });

  it('NO puede publicar si la bandera isBanned está puesta', async () => {
    await assertFails(addDoc(collection(db(BANEADO), 'threads'), hilo(BANEADO)));
  });

  it('NO puede seguir a nadie', async () => {
    await assertFails(
      setDoc(doc(db(BANEADO), 'users', NORMAL, 'followers', BANEADO), {
        followerId: BANEADO,
        followingId: NORMAL,
        createdAt: new Date(),
      }),
    );
  });

  it('NO puede publicar si el baneo vive SOLO en el registro duradero', async () => {
    // Su documento dice `isBanned: false` (lo recreó o se lo
    // escribieron a mano), pero el registro sigue activo.
    await assertFails(
      addDoc(collection(db(BANEADO_REGISTRO), 'threads'), hilo(BANEADO_REGISTRO)),
    );
  });

  it('puede leer su propia restricción para saber que sigue baneado', async () => {
    const snap = await assertSucceeds(
      getDoc(doc(db(BANEADO_REGISTRO), 'accountRestrictions', BANEADO_REGISTRO)),
    );
    assert.strictEqual(snap.data().activo, true);
  });

  it('NO puede desactivar ni borrar su propia restricción', async () => {
    await assertFails(
      updateDoc(doc(db(BANEADO_REGISTRO), 'accountRestrictions', BANEADO_REGISTRO), {
        activo: false,
      }),
    );
    await assertFails(
      deleteDoc(doc(db(BANEADO_REGISTRO), 'accountRestrictions', BANEADO_REGISTRO)),
    );
  });
});

// ═══════════════════════════════════════════════════════════
// PERFIL ELIMINADO Y RECREADO
// ═══════════════════════════════════════════════════════════

describe('perfil eliminado y recreado', () => {
  it('el baneo sobrevive a borrar y recrear el perfil', async () => {
    // 1. El usuario baneado borra su propio perfil (borrado
    //    legítimo de cuenta: las reglas lo siguen permitiendo).
    await assertSucceeds(deleteDoc(doc(db(RECREADO), 'users', RECREADO)));

    // 2. Al volver a entrar, AuthContext se lo recrea con
    //    `isBanned: false` (es lo único que permite la regla).
    await assertSucceeds(
      setDoc(doc(db(RECREADO), 'users', RECREADO), perfilNuevo(RECREADO)),
    );

    // 3. El registro duradero no se ha tocado y el perfil nuevo
    //    sigue sin poder publicar.
    await assertFails(addDoc(collection(db(RECREADO), 'threads'), hilo(RECREADO)));

    // 4. La restricción sigue existiendo y activa.
    let activo;
    await sembrar(async (f) => {
      const snap = await f.doc(`accountRestrictions/${RECREADO}`).get();
      activo = snap.data().activo;
    });
    assert.strictEqual(activo, true);
  });

  it('el usuario NO puede crearse el perfil ya baneado', async () => {
    await assertFails(
      setDoc(doc(db('nuevo-baneado'), 'users', 'nuevo-baneado'), {
        ...perfilNuevo('nuevo-baneado'),
        isBanned: true,
      }),
    );
  });

  it('el usuario NO puede crearse el perfil como admin', async () => {
    await assertFails(
      setDoc(doc(db('nuevo-admin'), 'users', 'nuevo-admin'), {
        ...perfilNuevo('nuevo-admin'),
        role: 'admin',
      }),
    );
  });

  it('un perfil normal se puede recrear sin problema', async () => {
    await assertSucceeds(deleteDoc(doc(db(NORMAL), 'users', NORMAL)));
    await assertSucceeds(setDoc(doc(db(NORMAL), 'users', NORMAL), perfilNuevo(NORMAL)));
    await assertSucceeds(addDoc(collection(db(NORMAL), 'threads'), hilo(NORMAL)));
  });

  it('una restricción levantada (activo:false) deja publicar', async () => {
    // Es lo que hace `desbanearUsuario`: no borra el documento,
    // solo lo marca inactivo.
    await assertSucceeds(
      addDoc(collection(db(DESBANEADO), 'threads'), hilo(DESBANEADO)),
    );
  });
});

// ═══════════════════════════════════════════════════════════
// MODERADOR Y ADMINISTRADOR
// ═══════════════════════════════════════════════════════════

describe('moderador', () => {
  it('puede publicar como cualquier usuario', async () => {
    await assertSucceeds(addDoc(collection(db(MOD), 'threads'), hilo(MOD)));
  });

  it('NO puede banear escribiendo users/{uid}', async () => {
    await assertFails(updateDoc(doc(db(MOD), 'users', NORMAL), { isBanned: true }));
  });

  it('NO puede escribir el registro duradero', async () => {
    await assertFails(
      setDoc(doc(db(MOD), 'accountRestrictions', NORMAL), {
        uid: NORMAL,
        tipo: 'ban',
        activo: true,
        motivo: 'desde el cliente',
      }),
    );
    await assertFails(
      updateDoc(doc(db(MOD), 'accountRestrictions', BANEADO_REGISTRO), {
        activo: false,
      }),
    );
    await assertFails(
      deleteDoc(doc(db(MOD), 'accountRestrictions', BANEADO_REGISTRO)),
    );
  });

  it('puede leer una restricción para moderar', async () => {
    await assertSucceeds(
      getDoc(doc(db(MOD), 'accountRestrictions', BANEADO_REGISTRO)),
    );
  });
});

describe('administrador', () => {
  it('puede seguir tocando campos de servidor que no son sanciones', async () => {
    await assertSucceeds(
      updateDoc(doc(db(ADMIN), 'users', NORMAL), { xp: 777, level: 20 }),
    );
  });

  it('NO puede banear escribiendo users/{uid}', async () => {
    await assertFails(updateDoc(doc(db(ADMIN), 'users', NORMAL), { isBanned: true }));
    // BANEADO sí tiene la bandera puesta: cambiarla a false también
    // está prohibido desde el cliente (solo lo hace la callable).
    await assertFails(
      updateDoc(doc(db(ADMIN), 'users', BANEADO), { isBanned: false }),
    );
  });

  it('NO puede crear un perfil ya baneado desde el cliente', async () => {
    await assertFails(
      setDoc(doc(db(ADMIN), 'users', 'nuevo-baneado-admin'), {
        ...perfilNuevo('nuevo-baneado-admin'),
        isBanned: true,
      }),
    );
  });

  it('NO puede escribir el registro duradero', async () => {
    await assertFails(
      setDoc(doc(db(ADMIN), 'accountRestrictions', NORMAL), {
        uid: NORMAL,
        tipo: 'ban',
        activo: true,
      }),
    );
    await assertFails(
      updateDoc(doc(db(ADMIN), 'accountRestrictions', BANEADO_REGISTRO), {
        activo: false,
      }),
    );
    await assertFails(
      deleteDoc(doc(db(ADMIN), 'accountRestrictions', BANEADO_REGISTRO)),
    );
  });

  it('puede leer restricciones ajenas', async () => {
    await assertSucceeds(
      getDoc(doc(db(ADMIN), 'accountRestrictions', BANEADO_REGISTRO)),
    );
  });
});

// ═══════════════════════════════════════════════════════════
// CUENTA SIN PERFIL
// ═══════════════════════════════════════════════════════════

describe('cuenta sin perfil', () => {
  it('NO puede publicar un hilo', async () => {
    // Este es el agujero de `isActive()`: antes bastaba con tener
    // sesión, porque `isBanned()` devolvía false al no encontrar
    // el documento.
    await assertFails(addDoc(collection(db(SIN_PERFIL), 'threads'), hilo(SIN_PERFIL)));
  });

  it('NO puede seguir a nadie', async () => {
    await assertFails(
      setDoc(doc(db(SIN_PERFIL), 'users', NORMAL, 'followers', SIN_PERFIL), {
        followerId: SIN_PERFIL,
        followingId: NORMAL,
        createdAt: new Date(),
      }),
    );
  });

  it('NO puede crear contenido aunque se invente un perfil en el payload', async () => {
    await assertFails(
      addDoc(collection(db(SIN_PERFIL), 'threads'), {
        ...hilo(SIN_PERFIL),
        authorId: SIN_PERFIL,
      }),
    );
  });
});
