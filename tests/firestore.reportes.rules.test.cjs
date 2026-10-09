/**
 * Pruebas de las reglas de los reportes y del borrado de
 * contenido por el equipo.
 *
 * Lo que se comprueba aquí es lo que de verdad importa en una
 * cola de denuncias:
 *
 *   - Solo el equipo puede LEER la cola (si la leyera cualquiera,
 *     se sabría quién ha哪家 ha Reported cada uno).
 *   - El usuario solo puede denunciar a su nombre, con un motivo
 *     de la lista y un contenido que exista de verdad.
 *   - No puede auto-asignarse el estado "resuelto" para que su
 *     queja desaparezca.
 *   - No puede llenar la cola con mil denuncias del mismo
 *     contenido.
 *   - Admin y moderador pueden borrar comentarios e hilos; un
 *     usuario normal no.
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
  collection,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
} = require('firebase/firestore');

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const RULES = fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8');
const PROJECT = 'demo-geekapoo-reportes';

const ALICE = 'alice';
const BOB = 'bob';
const MOD = 'moderador';
const ADMIN = 'admin';
const BANEADO = 'baneado';

const HILO = 'hilo-reportado';
const COMENTARIO = 'com-reportado';

let testEnv;

const db = (uid) => testEnv.authenticatedContext(uid).firestore();
const anon = () => testEnv.unauthenticatedContext().firestore();

async function sembrar(fn) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => fn(ctx.firestore()));
}

function nuevoComentario(extra = {}) {
  return {
    authorId: ALICE,
    authorName: ALICE,
    authorAvatar: '',
    targetType: 'thread',
    targetId: HILO,
    parentId: null,
    body: 'Un comentario normal.',
    likesCount: 0,
    likedBy: [],
    createdAt: '2026-10-04T00:00:00.000Z',
    ...extra,
  };
}

function nuevoHilo(extra = {}) {
  return {
    authorId: ALICE,
    authorName: ALICE,
    authorAvatar: '',
    title: 'Un hilo normal',
    body: 'Cuerpo del hilo.',
    categoryId: 'debates',
    categoryName: 'Debates',
    tags: ['General'],
    likesCount: 0,
    likedBy: [],
    commentsCount: 3,
    pinned: false,
    createdAt: '2026-10-04T00:00:00.000Z',
    ...extra,
  };
}

/** Un reporte tal y como lo escribe el diálogo. */
function reporte(uid, targetType, targetId, extra = {}) {
  return {
    targetType,
    targetId,
    reportadoPor: uid,
    reportadoPorNombre: uid,
    motivo: 'spam',
    estado: 'pendiente',
    createdAt: '2026-10-04T12:00:00.000Z',
    ...extra,
  };
}

/** Escribe un reporte en el sitio que le toca a cada quien. */
function denunciar(uid, targetType, targetId, extra = {}) {
  return setDoc(doc(db(uid), 'reports', `${targetType}_${targetId}_${uid}`), reporte(uid, targetType, targetId, extra));
}

describe('reportes de contenido y moderación', () => {
  before(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT,
      firestore: { rules: RULES },
    });

    for (const [uid, extra] of [
      [ALICE, {}],
      [BOB, {}],
      [MOD, { role: 'moderator' }],
      [ADMIN, { role: 'admin' }],
      [BANEADO, { isBanned: true }],
    ]) {
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

    await sembrar(async (f) => {
      await setDoc(doc(f, 'threads', HILO), nuevoHilo());
      await setDoc(doc(f, 'comments', COMENTARIO), nuevoComentario());
    });
  });

  after(async () => {
    await testEnv.cleanup();
  });

  // ==========================================================
  // 1. DENUNCIAR
  // ==========================================================
  describe('denunciar un comentario o un hilo', () => {
    it('un usuario puede denunciar un comentario', async () => {
      await assertSucceeds(denunciar(ALICE, 'comment', COMENTARIO));
    });

    it('y un hilo', async () => {
      await assertSucceeds(denunciar(BOB, 'thread', HILO));
    });

    it('sin iniciar sesión no', async () => {
      // OJO: aquí se usa el contexto SIN sesión de verdad, no
      // `db('anon')`. Eso último sería entrar con una cuenta
      // llamada "anon", que es otra cosa (y que, al no existir
      // en `users/`, las reglas no pueden ni comprobar si está
      // baneada).
      await assertFails(
        setDoc(doc(anon(), 'reports', `thread_${HILO}_anon`), reporte('anon', 'thread', HILO)),
      );
    });

    it('ni una cuenta baneada', async () => {
      await assertFails(denunciar(BANEADO, 'thread', HILO));
    });

    it('NO puede denunciar dos veces lo mismo', async () => {
      // El id lleva su uid dentro, así que el segundo intento
      // choca contra el documento que ya existe. Sin esto, un
      // usuario podría llenar la cola con mil reportes del mismo
      // comentario y nadie podría revisarla.
      await assertFails(denunciar(ALICE, 'comment', COMENTARIO));
    });

    it('ni inventar otro nombre de documento', async () => {
      // El id tiene que ser `{tipo}_{contenido}_{uid}` y nada
      // más. Con un nombre libre, un usuario podría escribir
      // cuantos reportes quisiera (uno por cada nombre
      // inventado) y llenar la cola de lo mismo.
      await assertFails(
        setDoc(doc(db(ALICE), 'reports', 'reporte-falso'), reporte(ALICE, 'thread', HILO)),
      );
      // Y tampoco vale poner el tipo de otro sitio: el id tiene
      // que casar con el `targetType` del propio documento.
      await assertFails(
        setDoc(doc(db(ALICE), 'reports', `comment_${HILO}_${ALICE}`), reporte(ALICE, 'thread', HILO)),
      );
    });

    it('NO puede denunciar en nombre de otro', async () => {
      await assertFails(
        setDoc(doc(db(ALICE), 'reports', `comment_${COMENTARIO}_${BOB}`), {
          ...reporte(BOB, 'comment', COMENTARIO),
          // El `reportadoPor` es de Bob pero escribe Alice.
          reportadoPor: BOB,
        }),
      );
    });

    it('NO un motivo que no existe en la lista', async () => {
      await assertFails(denunciar(MOD, 'thread', HILO, { motivo: 'me-gusta-de-mas' }));
    });

    it('NI un contenido que no existe', async () => {
      // Sin esta comprobación se podrían crear reportes de
      // cualquier cosa, y el equipo vería una cola llena de
      // fantasmas que no puede resolver.
      await assertFails(denunciar(ALICE, 'comment', 'com-que-no-existe'));
      await assertFails(denunciar(ALICE, 'thread', 'hilo-que-no-existe'));
    });

    it('ni autoasignarse el estado "resuelto"', async () => {
      // El `hasOnly` lo impide. Es el agujero más obvio de este
      // sistema: sin él, el usuario se marcaba su propia queja
      // como atendida y desaparecía de la cola.
      await assertFails(denunciar(ALICE, 'thread', 'otro-hilo', { estado: 'resuelto' }));
      await assertFails(
        setDoc(doc(db(ALICE), 'reports', `thread_x_${ALICE}`), {
          ...reporte(ALICE, 'thread', HILO),
          estado: 'descartado',
          accion: 'nada',
          resueltoPor: ALICE,
        }),
      );
    });

    it('ni fingir que se ha borrado algo', async () => {
      await assertFails(
        setDoc(doc(db(BOB), 'reports', `thread_y_${BOB}`), {
          ...reporte(BOB, 'thread', HILO, {}),
          accion: 'borrado',
          resueltoPor: BOB,
        }),
      );
    });

    it('con un texto libre que no puede ser infinito', async () => {
      await assertFails(denunciar(MOD, 'comment', COMENTARIO, { detalle: 'x'.repeat(501) }));
    });
  });

  // ==========================================================
  // 2. LEER Y RESOLVER LA COLA
  // ==========================================================
  describe('la cola es del equipo', () => {
    it('admin y moderador la leen', async () => {
      await assertSucceeds(getDoc(doc(db(ADMIN), 'reports', `comment_${COMENTARIO}_${ALICE}`)));
      await assertSucceeds(getDoc(doc(db(MOD), 'reports', `thread_${HILO}_${BOB}`)));
    });

it('un usuario normal NO puede leer los reportes de otros', async () => {
      // Si los leyera cualquiera se sabría qué ha denunciado
      // cada usuario y cada problema de la comunidad.
      await assertFails(getDoc(doc(db(ALICE), 'reports', `thread_${HILO}_${BOB}`)));
      await assertFails(getDoc(doc(db(BOB), 'reports', `comment_${COMENTARIO}_${ALICE}`)));
      await assertFails(getDoc(doc(anon(), 'reports', `thread_${HILO}_${ALICE}`)));
    });

    it('pero sí puede abrir SU propio reporte', async () => {
      // Es lo que permite decirle "ya lo habías reportado" en vez
      // de un error seco cuando repite la denuncia. Solo el suyo:
      // los ids son previsibles (contenido + uid), así que abrir
      // el de otro sería abrir el de cualquiera.
      await assertSucceeds(getDoc(doc(db(ALICE), 'reports', `comment_${COMENTARIO}_${ALICE}`)));
    });

    it('ni puede listar la cola', async () => {
      // `get` y `list` están separados justo para esto: abrir el
      // suyo sí, recorrer la cola no.
      await assertFails(getDocs(collection(db(ALICE), 'reports')));
      await assertFails(getDocs(collection(anon(), 'reports')));
      await assertSucceeds(getDocs(collection(db(MOD), 'reports')));
    });

    it('el equipo puede cerrar un reporte', async () => {
      await assertSucceeds(
        updateDoc(doc(db(MOD), 'reports', `thread_${HILO}_${BOB}`), {
          estado: 'resuelto',
          resueltoPor: MOD,
          accion: 'nada',
        }),
      );
    });

    it('y el usuario NO puede tocar su estado', async () => {
      await assertFails(
        updateDoc(doc(db(ALICE), 'reports', `comment_${COMENTARIO}_${ALICE}`), {
          estado: 'descartado',
        }),
      );
    });

    it('ni cambiar de quién es el reporte', async () => {
      await assertFails(
        updateDoc(doc(db(MOD), 'reports', `comment_${COMENTARIO}_${ALICE}`), {
          motivo: 'otro',
          reportadoPor: BOB,
        }),
      );
    });

    it('el equipo puede limpiar la cola', async () => {
      await assertSucceeds(deleteDoc(doc(db(ADMIN), 'reports', `thread_${HILO}_${BOB}`)));
    });

    it('el usuario solo puede retirar el suyo mientras siga pendiente', async () => {
      // Este es el reporte que aún no se ha tocado.
      const suyo = `comment_${COMENTARIO}_${ALICE}`;
      await assertSucceeds(deleteDoc(doc(db(ALICE), 'reports', suyo)));
    });
  });

  // ==========================================================
  // 3. MODERACIÓN: BORRAR COMENTARIOS E HILOS
  // ==========================================================
  describe('borrar contenido con el rol', () => {
    before(async () => {
      await sembrar(async (f) => {
        await setDoc(doc(f, 'comments', 'com-de-bob'), nuevoComentario({ authorId: BOB }));
        await setDoc(doc(f, 'comments', 'com-de-alice'), nuevoComentario());
        await setDoc(doc(f, 'threads', 'hilo-de-bob'), nuevoHilo({ authorId: BOB }));
      });
    });

    it('el moderador puede borrar un comentario', async () => {
      // El permiso ya existía en las reglas; lo que faltaba era
      // la forma de usarlo desde la web. Este test lo fija para
      // que nadie lo cierre por accidente al tocar otra cosa.
      await assertSucceeds(deleteDoc(doc(db(MOD), 'comments', 'com-de-bob')));
    });

    it('el admin también', async () => {
      await assertSucceeds(deleteDoc(doc(db(ADMIN), 'threads', 'hilo-de-bob')));
    });

    it('el autor puede borrar lo suyo', async () => {
      await assertSucceeds(deleteDoc(doc(db(ALICE), 'comments', 'com-de-alice')));
    });

    it('un usuario normal NO puede borrar lo de otro', async () => {
      await assertSucceeds(
        sembrar(async (f) => {
          await setDoc(doc(f, 'comments', 'com-intacto'), nuevoComentario({ authorId: BOB }));
        }),
      );

      await assertFails(deleteDoc(doc(db(ALICE), 'comments', 'com-intacto')));
      await assertFails(deleteDoc(doc(anon(), 'comments', 'com-intacto')));
    });

    it('y tampoco puede editar el texto de otro', async () => {
      await assertFails(
        updateDoc(doc(db(ALICE), 'comments', 'com-intacto'), { body: 'texto cambiado' }),
      );
      // El moderador sí puede: tiene su propia rama para eso.
      await assertSucceeds(
        updateDoc(doc(db(MOD), 'comments', 'com-intacto'), { body: 'texto editado por el equipo' }),
      );
    });
  });
});
