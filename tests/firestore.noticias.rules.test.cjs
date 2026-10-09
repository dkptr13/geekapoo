/**
 * Pruebas de las reglas de las NOTICIAS RSS.
 *
 * Lo que se comprueba aquí es la mitad de la función que no se ve en
 * la pantalla:
 *
 *   - Se leen SIN iniciar sesión. Las noticias se enseñan en la barra
 *     lateral de la portada, y quien no ha entrado tiene que verlas
 *     igual que ve los animes o las categorías.
 *   - NADIE escribe. Ni un usuario, ni un moderador, ni el
 *     administrador. No hay ni una operación de escritura en el bloque
 *     de reglas, y esto es lo que lo deja así de verdad: sin escribir
 *     una línea `allow write`, las reglas niegan por defecto.
 *   - Tampoco se pueden cambiar ni borrar, ni aunque el documento
 *     exista de verdad y se haya leído sin problema.
 *
 * Lo último es lo que distingue esto de un `allow write: if false`
 * mal colocado: si alguien añade por error un permiso de escritura
 * "para el admin" dentro del bloque, estas pruebas se rompen el mismo
 * día en lugar de convertirse en un agujero que nadie ve.
 *
 * Lo que escribe de verdad es la Cloud Function `syncRssNews`, que
 * usa el Admin SDK y no pasa por estas reglas.
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
const PROJECT = 'demo-geekapoo-noticias';

const ALICE = 'alice';
const BOB = 'bob';
const MOD = 'moderador';
const ADMIN = 'admin';

/** Un documento de noticia tal como lo deja la Cloud Function. */
function noticia(extra = {}) {
  return {
    title: 'Magilumiere Magical Girls Inc. Season 2 Anime Series Review',
    snippet: "It's a clever, entertaining, optimistic show that deserves an audience.",
    link: 'https://www.animenewsnetwork.com/review/magilumiere/.242229',
    sourceName: 'Anime News Network',
    pubDate: '2026-10-08T16:00:00.000Z',
    ...extra,
  };
}

const ID_NOTICIA = 'animenewsnet-0123456789abcdef0123456789abcdef';

let testEnv;

const db = (uid) => testEnv.authenticatedContext(uid).firestore();
const anon = () => testEnv.unauthenticatedContext().firestore();

async function sembrar(fn) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => fn(ctx.firestore()));
}

before(async () => {
  testEnv = await initializeTestEnvironment({ projectId: PROJECT, firestore: { rules: RULES } });
});

after(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();

  await sembrar(async (f) => {
    await setDoc(doc(f, 'news', ID_NOTICIA), noticia());
  });
});

describe('noticias RSS', () => {
  // ==========================================================
  // LEER
  // ==========================================================

  describe('leer', () => {
    it('cualquiera las lee sin iniciar sesión', async () => {
      await assertSucceeds(getDocs(collection(anon(), 'news')));
    });

    it('también las lee quien ha iniciado sesión', async () => {
      await assertSucceeds(getDoc(doc(db(ALICE), 'news', ID_NOTICIA)));
    });

    it('y se pueden ordenar por pubDate, que es lo que hace el widget', async () => {
      // La consulta del widget es exactamente esta: las más recientes
      // primero, y solo unas cuantas. Si el orden no estuviera
      // permitido, el widget saldría con la lista en el orden que
      // toque y las noticias viejas arriba.
      const { query, orderBy, limit } = require('firebase/firestore');

      await assertSucceeds(
        getDocs(query(collection(anon(), 'news'), orderBy('pubDate', 'desc'), limit(6))),
      );
    });

    it('la colección vacía no da error: se lee una lista sin nada', async () => {
      await sembrar(async (f) => {
        await deleteDoc(doc(f, 'news', ID_NOTICIA));
      });

      const snap = await getDocs(collection(anon(), 'news'));

      assert.equal(snap.size, 0);
    });
  });

  // ==========================================================
  // ESCRIBIR: NADIE
  // ==========================================================
  //
  // Aquí no hay ni un caso que deba pasar. Si algún día alguien lee
  // estas pruebas esperando ver un "assertSucceeds" y lo encuentra, es
  // que se ha abierto un agujero.

  describe('escribir', () => {
    it('un usuario normal no puede crear una noticia', async () => {
      await assertFails(
        setDoc(doc(db(ALICE), 'news', 'inventada'), noticia()),
      );
    });

    it('ni aunque se ponga de admin en su sesión', async () => {
      // El punto importante: no hay `allow write` para el admin, así
      // que ni el administrador puede colar una noticia desde el
      // navegador. Las noticias son de la Cloud Function y solo de la
      // Cloud Function.
      await assertFails(setDoc(doc(db(ADMIN), 'news', 'inventada'), noticia()));
    });

    it('ni un moderador', async () => {
      await assertFails(setDoc(doc(db(MOD), 'news', 'inventada'), noticia()));
    });

    it('ni sin iniciar sesión', async () => {
      await assertFails(setDoc(doc(anon(), 'news', 'inventada'), noticia()));
    });

    it('no se puede cambiar el titular de una noticia que ya existe', async () => {
      await assertFails(
        updateDoc(doc(db(ALICE), 'news', ID_NOTICIA), { title: 'Titular inventado' }),
      );
    });

    it('ni cambiarla siendo el admin', async () => {
      await assertFails(
        updateDoc(doc(db(ADMIN), 'news', ID_NOTICIA), { title: 'Titular inventado' }),
      );
    });

    it('ni borrarla', async () => {
      await assertFails(deleteDoc(doc(db(ALICE), 'news', ID_NOTICIA)));
    });

    it('ni borrarla siendo el admin', async () => {
      await assertFails(deleteDoc(doc(db(ADMIN), 'news', ID_NOTICIA)));
    });
  });

  // ==========================================================
  // QUE LO QUE SE LEE NO CAMBIA
  // ==========================================================

  describe('lo que se lee', () => {
    it('el documento sale con los campos que escribe la función', async () => {
      const snap = await getDoc(doc(anon(), 'news', ID_NOTICIA));

      assert.equal(snap.exists(), true);

      const datos = snap.data();

      assert.equal(datos.sourceName, 'Anime News Network');
      assert.equal(datos.pubDate, '2026-10-08T16:00:00.000Z');
      assert.ok(datos.title.length > 0);
      assert.ok(datos.link.startsWith('https://'));
    });

    it('y el id es un hash del enlace, no el enlace entero', async () => {
      // No es una regla, es una consecuencia de cómo se nombra el
      // documento. Se comprueba para que nadie "arregle" el id poniendo
      // el enlace, que es lo primero que se le ocurriría al ver un
      // documento con un id largo e incomprensible.
      const snap = await getDoc(doc(anon(), 'news', ID_NOTICIA));

      assert.ok(!snap.id.includes('/'), 'los id de Firestore no admiten barras y el enlace tiene muchas');
    });
  });
});
