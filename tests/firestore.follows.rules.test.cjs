/**
 * Pruebas de las reglas de seguridad de los seguimientos.
 *
 * Son las más importantes de este sistema por una razón concreta:
 * las dos subcolecciones se escriben desde el cliente, y una de
 * ellas (`users/{otros}/followers/{yo}`) vive en el documento de
 * OTRA persona. Eso es lo que permite que el botón funcione sin
 * backend, y también lo que podría convertir "seguir" en "elegir
 * tus propios seguidores" si las reglas se escribieran con
 *nada.
 *
 * Lo que se comprueba aquí, entonces:
 *
 *   - Se puede seguir y se puede dejar de seguir, de verdad.
 *   - NO se puede seguir a uno mismo (sumaría un seguidor que no
 *     existe y pagaría XP).
 *   - NO se puede crear un seguidor en nombre de otra persona.
 *   - NO se puede meter en un documento de seguimiento nada más que
 *     los tres campos permitidos (ni un contador, ni un nombre).
 *   - NO se pueden editar las relaciones (ni la fecha, ni el
 *     destino).
 *   - NO se puede borrar la relación de otra persona.
 *   - NO se pueden escribir los contadores desde el cliente.
 *
 *   npm run test:rules
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
  getDocs,
  collection,
  writeBatch,
  Timestamp,
} = require('firebase/firestore');

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const RULES = fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8');
const PROJECT = 'demo-geekapoo-follows';

const ALICE = 'alice';
const BOB = 'bob';
const ADMIN = 'admin';

let testEnv;

const db = (uid) => testEnv.authenticatedContext(uid).firestore();
const anon = () => testEnv.unauthenticatedContext().firestore();

/** Siembra usuarios saltándose las reglas. */
async function sembrar() {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    for (const [uid, extra] of [
      [ALICE, {}],
      [BOB, {}],
      [ADMIN, { role: 'admin' }],
    ]) {
      await setDoc(doc(ctx.firestore(), 'users', uid), {
        uid,
        email: uid + '@test.com',
        username: uid,
        displayName: uid,
        chatId: 'GK-' + uid,
        avatarUrl: '',
        role: 'user',
        createdAt: '2026-10-05T00:00:00.000Z',
        isBanned: false,
        ...extra,
      });
    }
  });
}

/** El documento tal y como lo escribe `followUser`. */
function relacion(followerId, followingId) {
  return {
    followerId,
    followingId,
    createdAt: Timestamp.now(),
  };
}

// La mitad que escribe quien sigue: en SU carpeta, `following`.
//   users/{mi}/following/{ellos}
const sigoA = (uid) => doc(db(uid), 'users', uid, 'following', BOB);

// La mitad que escribe quien recibe: en la carpeta del otro.
//   users/{ellos}/followers/{mi}
//
// El `uid` de la ruta es el de la persona SEGUIDA (BOB) y el del
// documento es el de quien sigue (el que le pasa la función). Es
// fácil intercambiarlos al escribir el test, y entonces se acaba
// probando `users/{alice}/followers/{alice}`, que es un
// self-follow y falla por lo correcto sin que se note por qué.
const meSigue = (uid) => doc(db(uid), 'users', BOB, 'followers', uid);

describe('seguimientos', () => {
  before(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT,
      firestore: { rules: RULES },
    });
    await sembrar();
  });

  after(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    // Cada prueba empieza sin relaciones: si no, una prueba que
    // crea un follow "pasa" en la siguiente por el documento que
    // dejó la anterior.
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      for (const uid of [ALICE, BOB]) {
        for (const otro of [ALICE, BOB]) {
          await deleteDoc(doc(ctx.firestore(), 'users', uid, 'following', otro));
          await deleteDoc(doc(ctx.firestore(), 'users', uid, 'followers', otro));
        }
      }
    });
  });

  /**
   * Una referencia del CONTEXTO DE UN USUARIO CONCRETO.
   *
   * Se pasa la instancia y no se vuelve a llamar a
   * `authenticatedContext` cada vez, porque cada llamada devuelve un
   * objeto nuevo: un `writeBatch` con referencias de dos instancias
   * distintas falla con "Provided document reference is from a
   * different Firestore instance", que no dice nada de permisos.
   */
  function refs(fdb) {
    return {
      sigoA: doc(fdb, 'users', ALICE, 'following', BOB),
      meSigue: doc(fdb, 'users', BOB, 'followers', ALICE),
    };
  }

  // ==========================================================
  // 1. El caso normal: seguir y dejar de seguir
  // ==========================================================
  describe('seguir a alguien', () => {
    it('se puede crear la relacion en MI carpeta de following', async () => {
      await assertSucceeds(setDoc(sigoA(ALICE), relacion(ALICE, BOB)));
    });

    it('y la mitad del otro, en SU carpeta de followers', async () => {
      // Esta es la parte "rara": se escribe en el documento de Bob
      // sin tener ningun permiso sobre el. Las reglas lo permiten
      // porque el id del documento es MI uid, asi que solo puedo
      // crear el documento que dice "yo te sigo".
      await assertSucceeds(setDoc(meSigue(ALICE), relacion(ALICE, BOB)));
    });

    it('las dos mitades a la vez, como hace el boton', async () => {
      // El servicio escribe las dos en un lote atomico. Aqui se
      // comprueba que un lote con las dos pasa, que es lo que de
      // verdad ocurre en la web.
      const fdb = db(ALICE);
      const { sigoA, meSigue } = refs(fdb);

      const batch = writeBatch(fdb);
      batch.set(sigoA, relacion(ALICE, BOB));
      batch.set(meSigue, relacion(ALICE, BOB));
      await assertSucceeds(batch.commit());
    });

    it('se puede dejar de seguir (borrar las dos mitades)', async () => {
      await sembrarRelacion();

      const fdb = db(ALICE);
      const { sigoA, meSigue } = refs(fdb);

      const batch = writeBatch(fdb);
      batch.delete(sigoA);
      batch.delete(meSigue);
      await assertSucceeds(batch.commit());

      const snap = await getDoc(sigoA);
      assert(snap.data() === undefined, 'la relacion deberia haberse borrado');
    });

    it('dejar de seguir es idempotente (borrar dos veces no falla)', async () => {
      // Si el boton se pulsa dos veces rapido, la segunda escritura
      // va sobre un documento que ya no esta. Si eso fallara, la
      // web mostraría un error en un doble clic normal.
      await assertSucceeds(deleteDoc(sigoA(ALICE)));
      await assertSucceeds(deleteDoc(meSigue(ALICE)));
    });
  });

  /** Crea la relacion saltandose las reglas, para probar el borrado. */
  async function sembrarRelacion() {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', ALICE, 'following', BOB), relacion(ALICE, BOB));
      await setDoc(doc(ctx.firestore(), 'users', BOB, 'followers', ALICE), relacion(ALICE, BOB));
    });
  }

  // ==========================================================
  // 2. One's own: el agujero que daria XP gratis
  // ==========================================================
  describe('nadie se sigue a si mismo', () => {
    it('ni en following', async () => {
      await assertFails(
        setDoc(doc(db(ALICE), 'users', ALICE, 'following', ALICE), relacion(ALICE, ALICE)),
      );
    });

    it('ni en followers', async () => {
      await assertFails(
        setDoc(doc(db(ALICE), 'users', ALICE, 'followers', ALICE), relacion(ALICE, ALICE)),
      );
    });

    it('ni por un rodeo:doc con el otro campo mal', async () => {
      // Aunque el id del documento sea el de otra persona, si
      // `followerId` es el propio, esta escribiendo a si
      // mismo. Las dos mitades tienen que estar de acuerdo.
      await assertFails(
        setDoc(
          doc(db(ALICE), 'users', BOB, 'followers', ALICE),
          { ...relacion(ALICE, ALICE) },
        ),
      );
    });
  });

  // ==========================================================
  // 3. Seguidores falsos
  // ==========================================================
  describe('no se pueden inventar seguidores', () => {
    it('no puedo poner a OTRO en MI lista de seguidores', async () => {
      // Bob no puede escribir `users/{alice}/followers/{bob}` con
      // un `followerId` que no sea el suyo. Es el ataque
      // principal: subirse su propio numero de seguidores.
      await assertFails(
        setDoc(
          doc(db(BOB), 'users', ALICE, 'followers', BOB),
          { ...relacion(BOB, ALICE), followerId: ALICE },
        ),
      );
    });

    it('no puedo crear un documento con un id que no sea el mio', async () => {
      // El id del documento DEBE ser mi uid. Con otro, no hay
      // forma de saber a quien "pertenece" la relacion.
      await assertFails(
        setDoc(doc(db(BOB), 'users', ALICE, 'followers', CARTA), relacion(BOB, ALICE)),
      );
    });

    it('ni tampoco en la carpeta de la otra persona', async () => {
      await assertFails(
        setDoc(doc(db(BOB), 'users', BOB, 'following', ALICE), relacion(BOB, BOB)),
      );
    });
  });

  const CARTA = 'cartera-falsa';

  // ==========================================================
  // 4. Campos de mas: el/documento no puede ser un contenedor
  // ==========================================================
  describe('el documento no puede llevar nada mas', () => {
    it('ni un contador', async () => {
      // Si `hasOnly` no estuviera, el cliente podria meter
      // cualquier cosa dentro de la subcoleccion: un "level", un
      // "admin", lo que fuera. Estas reglas no miran el interior
      // de los documentos de seguimiento.
      await assertFails(
        setDoc(sigoA(ALICE), { ...relacion(ALICE, BOB), followersCount: 999999 }),
      );
    });

    it('ni un campo de nombre', async () => {
      await assertFails(setDoc(sigoA(ALICE), { ...relacion(ALICE, BOB), displayName: 'Admin' }));
    });

    it('ni un campo anidado con cualquier cosa', async () => {
      await assertFails(
        setDoc(sigoA(ALICE), { ...relacion(ALICE, BOB), extra: { role: 'admin' } }),
      );
    });

    it('ni aunque el documento ya exista (un update)', async () => {
      // Un `set` sobre un documento existente es un update en
      // Firestore, no un create. Con `update: if false` no hay
      // forma de=colarse por ahi.
      await sembrarRelacion();
      await assertFails(updateDoc(sigoA(ALICE), { followersCount: 999999 }));
    });
  });

  // ==========================================================
  // 5. Editar una relacion
  // ==========================================================
  describe('una relacion no se edita', () => {
    it('ni para cambiar la fecha', async () => {
      // Cambiar `createdAt` es cambiar cuando empezo la relacion.
      // Con eso, "hace 2 años" es indistinguible de "hace 5
      // minutos".
      await sembrarRelacion();
      await assertFails(
        updateDoc(sigoA(ALICE), { createdAt: Timestamp.fromDate(new Date('2020-01-01')) }),
      );
    });

    it('ni para cambiar a quien sigue', async () => {
      // Este es el grave: decir "sigo a Bob" cuando en realidad
      // sigo a Carol. El contador de Carol no se entera.
      await sembrarRelacion();
      await assertFails(updateDoc(sigoA(ALICE), { followingId: 'otra-persona' }));
    });

    it('ni aunque el update no cambie nada visible', async () => {
      await sembrarRelacion();
      await assertFails(updateDoc(sigoA(ALICE), { followerId: ALICE }));
    });
  });

  // ==========================================================
  // 6. Borrar la relacion de otro
  // ==========================================================
  describe('nadie borra la relacion de otro', () => {
    it('ni su following', async () => {
      await sembrarRelacion();
      // Bob intenta borrar la relacion de Alice. Sobre `following`
      // no tiene ningun permiso (esa carpeta solo la escribe su
      // dueno), asi que falla por el `isSelf`. El caso
      // interesante es el de abajo.
      await assertFails(deleteDoc(doc(db(BOB), 'users', ALICE, 'following', BOB)));
    });

    it('sobre `followers` no hay "la relacion de otro" que borrar', async () => {
      await sembrarRelacion();

      // Matiz que no cabe en un `assertFails`, y que conviene
      // dejar escrito: el documento se llama
      // `users/{alice}/followers/{bob}`, y el NOMBRE del documento
      // es el uid de quien sigue. Bob no puede borrar "la relacion
      // de otro" porque no existe una relacion con ese nombre: lo
      // unico que hay ahi es `followers/{bob}`, que es suya.
      //
      // Y borrarla tiene que estar permitido, porque es la
      // segunda mitad de "dejar de seguir".
      //
      // O sea: lo que hace imposible un seguidor falso no es una
      // comprobacion extra en las reglas, es la ESTRUCTURA (un
      // documento por persona, con el uid como id). No hay forma de
      // escribir "soy el seguidor de otra persona" porque el
      // documento que eso significaria ya lo ocupa alguien, y ese
      // alguien eres tu.
      await assertSucceeds(deleteDoc(doc(db(BOB), 'users', ALICE, 'followers', BOB)));
    });

    it('ni sin sesion', async () => {
      await sembrarRelacion();
      await assertFails(deleteDoc(doc(anon(), 'users', ALICE, 'following', BOB)));
      await assertFails(deleteDoc(doc(anon(), 'users', BOB, 'followers', ALICE)));
    });

    // El caso legitimo: uno mismo puede quitarse de la lista de
    // otro. Es el "dejar de seguir" de verdad, por la otra mitad.
    it('pero si puedes quitarte TU de la lista de otro', async () => {
      await sembrarRelacion();
      await assertSucceeds(deleteDoc(doc(db(ALICE), 'users', BOB, 'followers', ALICE)));
    });
  });

  // ==========================================================
  // 7. Crear sin sesion
  // ==========================================================
  describe('sin sesion no hay follow', () => {
    it('ni en following', async () => {
      await assertFails(
        setDoc(doc(anon(), 'users', ALICE, 'following', BOB), relacion(ALICE, BOB)),
      );
    });

    it('ni en followers', async () => {
      await assertFails(
        setDoc(doc(anon(), 'users', BOB, 'followers', ALICE), relacion(ALICE, BOB)),
      );
    });
  });

  // ==========================================================
  // 8. Los contadores NO se escriben desde el cliente
  // ==========================================================
  describe('los contadores son del servidor', () => {
    it('no puedo subirme mis propios seguidores', async () => {
      // El ataque de las medallas: si esto pasara, bastaba con
      // escribirse 999999 y consequences las cuatro medallas de
      // comunidad (Primer Fan, Popular, Figura de la Comunidad,
      // Icono Geekapoo) sin seguir a nadie.
      await assertFails(updateDoc(doc(db(ALICE), 'users', ALICE), { followersCount: 999999 }));
    });

    it('ni mis seguidos', async () => {
      await assertFails(updateDoc(doc(db(ALICE), 'users', ALICE), { followingCount: 999999 }));
    });

    it('ni los de otra persona (aunque el rol no sea admin)', async () => {
      // Esta parte la cubre ya el "sin rol no se escribe en el
      // documento de nadie mas", pero se comprueba por separado
      // porque es el agujero mas gordo si las reglas se tocaran.
      await assertFails(updateDoc(doc(db(BOB), 'users', ALICE), { followersCount: 0 }));
    });

    it('ni traerlos ya puestos al crear la cuenta', async () => {
      // El mismo ataque por la puerta del `create`: registrarse
      // con 999999 seguidores de salida.
      await assertFails(
        setDoc(doc(db(BOB), 'users', 'nuevo-con-seguidores'), {
          uid: 'nuevo-con-seguidores',
          email: 'nuevo@test.com',
          username: 'nuevo',
          displayName: 'Nuevo',
          chatId: 'GK-nuevo',
          avatarUrl: '',
          role: 'user',
          createdAt: '2026-10-05T00:00:00.000Z',
          isBanned: false,
          followersCount: 999999,
        }),
      );
    });

    it('ni mezclarlos con un cambio de perfil legitimo', async () => {
      // El ataque con mas esmero: cambiar tu nombre (que si puede)
      // y colar el contador en el mismo update. El diff
      // `affectedKeys` lo pilla porque ve "followersCount" entre
      // los campos tocados.
      await assertFails(
        updateDoc(doc(db(ALICE), 'users', ALICE), {
          displayName: 'me llamo rico',
          followersCount: 999999,
        }),
      );
    });

    it('el admin si puede (para corregir un numero a mano)', async () => {
      // El rol admin esta por encima de todo en el `allow
      // update`. Es lo que permite arreglar un contador desfasado
      // desde el panel, que es el caso real que hace falta.
      await assertSucceeds(
        updateDoc(doc(db(ADMIN), 'users', ALICE), { followersCount: 12345 }),
      );
    });
  });

  // ==========================================================
  // 9. La lectura
  // ==========================================================
  describe('las listas se leen', () => {
    it('puedes leer tus seguidos y tus seguidores', async () => {
      await sembrarRelacion();
      await assertSucceeds(getDocs(collection(db(ALICE), 'users', ALICE, 'following')));
      await assertSucceeds(getDocs(collection(db(ALICE), 'users', BOB, 'followers')));
    });

    it('y tambien los de otro (los perfiles son publicos)', async () => {
      await sembrarRelacion();
      await assertSucceeds(getDocs(collection(db(BOB), 'users', ALICE, 'followers')));
    });

    it('pero sin sesion, no', async () => {
      await sembrarRelacion();
      await assertFails(getDocs(collection(anon(), 'users', ALICE, 'followers')));
    });
  });
});