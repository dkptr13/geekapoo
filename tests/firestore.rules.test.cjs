/**
 * Pruebas de las reglas de seguridad de la gamificacion.
 *
 * Comprueban los vectores de ataque concretos: que un usuario no
 * pueda concederse XP ni medallas, y que solo pueda equipar un
 * titulo que de verdad tenga desbloqueado.
 *
 * Se ejecuta con `npm run test:rules`, que levanta el emulador de
 * Firestore (necesita Java) y lanza esto dentro. Va aparte del
 * resto de la app porque las reglas son su propio lenguaje: el
 * `tsc --noEmit` no las mira, asi que sin esto un `permission-`
 * `denied` equivocado no lo detecta nadie hasta que esta en
 * produccion.
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
  getDoc,
  collection,
  addDoc,
} = require('firebase/firestore');

const fs = require('fs');
const path = require('path');
const assert = require('assert');

/**
 * El texto de las reglas, NO la ruta.
 *
 * `initializeTestEnvironment` manda lo que le pases tal cual al
 * emulador para que lo compile. Si se le pasa 'firestore.rules',
 * compila la palabra "firestore.rules" y falla con un error de
 * sintaxis que no dice nada del contenido real de las reglas.
 */
const RULES = fs.readFileSync(
  path.join(__dirname, '..', 'firestore.rules'),
  'utf8',
);
const PROJECT = 'demo-geekapoo-reglas';

const ALICE = 'alice';
const BOB = 'bob';
const MOD = 'moderador';

let testEnv;

function db(uid) {
  return testEnv.authenticatedContext(uid).firestore();
}

/** Deja a alguien en la base de datos, saltandose las reglas. */
async function sembrar(uid, extra) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'users', uid), {
      uid,
      email: uid + '@test.com',
      username: uid,
      displayName: uid,
      chatId: 'GK-' + uid,
      avatarUrl: '',
      role: 'user',
      createdAt: '2026-01-01T00:00:00.000Z',
      // Como lo escribe AuthContext al crear la cuenta.
      isBanned: false,
      ...extra,
    });
  });
}

const perfil = (extra) => ({
  displayName: 'X',
  bio: 'hola',
  favoriteAnime: '',
  avatarUrl: '',
  ...extra,
});

constdescribe = null; // marcador para no escribir "describe" en el sitio equivocado

describe('gamificacion: XP y medallas', () => {
  before(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT,
      firestore: { rules: RULES },
    });

    await sembrar(ALICE, { xp: 1000, level: 12 });
    await sembrar(BOB, { xp: 0, level: 1 });
    await sembrar(MOD, { role: 'moderator', xp: 500 });
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      // Un admin de verdad, para los casos positivos.
      await setDoc(doc(ctx.firestore(), 'users', 'jefe'), {
        uid: 'jefe',
        email: 'jefe@test.com',
        username: 'jefe',
        displayName: 'jefe',
        chatId: 'GK-jefe',
        avatarUrl: '',
        role: 'admin',
        createdAt: '2026-01-01T00:00:00.000Z',
        xp: 0,
        level: 1,
      });
    });
  });

  after(async () => {
    await testEnv.cleanup();
  });

  // ==========================================================
  // 1. Un usuario NO puede escribirse XP a si mismo
  // ==========================================================
  describe('el usuario no puede tocar su progreso', () => {
    it('ni escribir xp', async () => {
      await assertFails(updateDoc(doc(db(ALICE), 'users', ALICE), { xp: 999999 }));
    });

    it('ni el nivel', async () => {
      await assertFails(updateDoc(doc(db(ALICE), 'users', ALICE), { level: 60 }));
    });

    it('ni las barras de progreso', async () => {
      await assertFails(
        updateDoc(doc(db(ALICE), 'users', ALICE), {
          xpEnNivel: 99999,
          xpParaSiguienteNivel: 1,
        }),
      );
    });

    it('ni las estadisticas', async () => {
      await assertFails(
        updateDoc(doc(db(ALICE), 'users', ALICE), {
          stats: { threadsCreated: 9999, likesReceived: 9999 },
        }),
      );
    });

    it('ni las medallas', async () => {
      await assertFails(
        updateDoc(doc(db(ALICE), 'users', ALICE), {
          medals: { medal_geek_de_geeks: '2026-10-03T00:00:00.000Z' },
        }),
      );
    });

    it('ni las marcas de la subida de nivel', async () => {
      await assertFails(
        updateDoc(doc(db(ALICE), 'users', ALICE), {
          lastLevelUpAt: '2026-10-03T00:00:00.000Z',
          lastLevelUpLevel: 60,
        }),
      );
    });

    it('ni el XP escondido dentro de una actualizacion normal', async () => {
      // El ataque con mas empeño: cambiar tu nombre (que si puede)
      // y colar el XP en el mismo update. El diff affectedKeys
      // lo pilla porque ve "xp" entre los campos tocados.
      await assertFails(
        updateDoc(doc(db(ALICE), 'users', ALICE), {
          displayName: 'me llamo rico',
          xp: 999999,
        }),
      );
    });

    it('ni de otro usuario', async () => {
      await assertFails(updateDoc(doc(db(BOB), 'users', ALICE), { xp: 999999 }));
    });

    it('el XP sigue intacto despues de todos los intentos', async () => {
      const snap = await getDoc(doc(db(ALICE), 'users', ALICE));
      assert(snap.data().xp === 1000);
      assert(snap.data().level === 12);
    });
  });

  // ==========================================================
  // 2. NO puede crear su cuenta ya con XP (el agujero del create)
  // ==========================================================
  describe('la creacion de cuenta', () => {
    it('permite crear un perfil normal', async () => {
      await assertSucceeds(
        setDoc(doc(db('nuevo'), 'users', 'nuevo'), {
          ...perfil(),
          uid: 'nuevo',
          email: 'nuevo@test.com',
          username: 'nuevo',
          chatId: 'GK-nuevo',
          role: 'user',
          createdAt: '2026-01-01T00:00:00.000Z',
        }),
      );
    });

    it('NO permite crearse la cuenta con XP', async () => {
      await assertFails(
        setDoc(doc(db('tramposo'), 'users', 'tramposo'), {
          ...perfil(),
          uid: 'tramposo',
          email: 't@test.com',
          username: 'tramposo',
          chatId: 'GK-t',
          role: 'user',
          createdAt: '2026-01-01T00:00:00.000Z',
          xp: 999999,
          level: 60,
        }),
      );
    });

    it('NO permite crearse la cuenta con medallas puestas', async () => {
      await assertFails(
        setDoc(doc(db('tramposo2'), 'users', 'tramposo2'), {
          ...perfil(),
          uid: 'tramposo2',
          email: 't2@test.com',
          username: 'tramposo2',
          chatId: 'GK-t2',
          role: 'user',
          createdAt: '2026-01-01T00:00:00.000Z',
          medals: { medal_geek_de_geeks: '2026-10-03T00:00:00.000Z' },
        }),
      );
    });

    it('NO permite crearse la cuenta como admin', async () => {
      await assertFails(
        setDoc(doc(db('falso'), 'users', 'falso'), {
          ...perfil(),
          uid: 'falso',
          email: 'f@test.com',
          username: 'falso',
          chatId: 'GK-f',
          role: 'admin',
          createdAt: '2026-01-01T00:00:00.000Z',
        }),
      );
    });
  });

  // ==========================================================
  // 3. El titulo equipado: solo lo que de verdad tiene
  // ==========================================================
  describe('el titulo equipado', () => {
    before(async () => {
      await sembrar('conmedalla', {
        xp: 5000,
        medals: { medal_debatiente_pro: '2026-10-01T00:00:00.000Z' },
      });
      await sembrar('sinmedalla', { xp: 10, medals: {} });
      // Sin el campo "medals" en absoluto, que es como estan las
      // cuentas antiguas.
      await sembrar('campoausente', { xp: 10 });
    });

    it('puede equipar el titulo de una medalla suya', async () => {
      await assertSucceeds(
        updateDoc(doc(db('conmedalla'), 'users', 'conmedalla'), {
          equippedTitle: 'medal_debatiente_pro',
        }),
      );
    });

    it('NO puede equipar una medalla que no tiene', async () => {
      await assertFails(
        updateDoc(doc(db('sinmedalla'), 'users', 'sinmedalla'), {
          equippedTitle: 'medal_geek_de_geeks',
        }),
      );
    });

    it('NO puede inventarse la medalla y el titulo en el mismo update', async () => {
      // El ataque que importa: escribir equippedTitle y medals a
      // la vez. Las reglas miran "resource" (antes del update), no
      // "request.resource" (despues), asi que la medalla inventada
      // no cuenta.
      await assertFails(
        updateDoc(doc(db('sinmedalla'), 'users', 'sinmedalla'), {
          equippedTitle: 'medal_inventada',
          medals: { medal_inventada: '2026-10-03T00:00:00.000Z' },
        }),
      );
    });

    it('NO puede equipar en una cuenta sin campo medals', async () => {
      await assertFails(
        updateDoc(doc(db('campoausente'), 'users', 'campoausente'), {
          equippedTitle: 'medal_debatiente_pro',
        }),
      );
    });

    it('puede quitarse el titulo', async () => {
      await assertSucceeds(
        updateDoc(doc(db('conmedalla'), 'users', 'conmedalla'), {
          equippedTitle: null,
        }),
      );
    });

    it('el titulo NO puede moverse a otro campo en el mismo update', async () => {
      await assertFails(
        updateDoc(doc(db('conmedalla'), 'users', 'conmedalla'), {
          equippedTitle: null,
          role: 'admin',
        }),
      );
    });
  });

  // ==========================================================
  // 4. Personalizacion del perfil
  // ==========================================================
  describe('la personalizacion del perfil', () => {
    it('puede ponerse banner, color, marco, personaje, visibles y destacadas', async () => {
      await assertSucceeds(
        updateDoc(doc(db(ALICE), 'users', ALICE), {
          bannerUrl: 'preset:ocaso',
          profileColor: '#ec4899',
          avatarFrame: 'neon',
          favoriteCharacter: { name: 'Spike Spiegel', imageUrl: 'https://x/y.jpg' },
          visibleBadgeIds: ['medal_debatiente_pro'],
          featuredPostIds: ['hilo1', 'hilo2'],
        }),
      );
    });

    it('puede quitarse el personaje y la personalizacion', async () => {
      await assertSucceeds(
        updateDoc(doc(db(ALICE), 'users', ALICE), {
          bannerUrl: '',
          avatarFrame: null,
          favoriteCharacter: null,
          visibleBadgeIds: [],
          featuredPostIds: [],
        }),
      );
    });

    it('NO puede ponerse un color fuera de la paleta', async () => {
      await assertFails(
        updateDoc(doc(db(ALICE), 'users', ALICE), { profileColor: '#ffffff' }),
      );
    });

    it('NO puede ponerse un banner que no sea preset ni https', async () => {
      await assertFails(
        updateDoc(doc(db(ALICE), 'users', ALICE), { bannerUrl: 'javascript:alert(1)' }),
      );
      await assertFails(
        updateDoc(doc(db(ALICE), 'users', ALICE), { bannerUrl: 'preset:inventado' }),
      );
    });

    it('NO puede ponerse un marco inventado', async () => {
      await assertFails(
        updateDoc(doc(db(ALICE), 'users', ALICE), { avatarFrame: 'inventado' }),
      );
    });

    it('NO puede guardar un personaje sin nombre o con URL rara', async () => {
      await assertFails(
        updateDoc(doc(db(ALICE), 'users', ALICE), {
          favoriteCharacter: { name: '', imageUrl: 'https://x/y.jpg' },
        }),
      );
      await assertFails(
        updateDoc(doc(db(ALICE), 'users', ALICE), {
          favoriteCharacter: { name: 'Spike', imageUrl: 'ftp://x/y.jpg' },
        }),
      );
    });

    it('NO puede pasarse del tope de visibles ni de destacadas', async () => {
      await assertFails(
        updateDoc(doc(db(ALICE), 'users', ALICE), {
          visibleBadgeIds: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
        }),
      );
      await assertFails(
        updateDoc(doc(db(ALICE), 'users', ALICE), {
          featuredPostIds: ['a', 'b', 'c', 'd'],
        }),
      );
    });

    it('NO puede colar XP dentro de una actualizacion de personalizacion', async () => {
      await assertFails(
        updateDoc(doc(db(ALICE), 'users', ALICE), {
          bio: 'hola',
          profileColor: '#ec4899',
          xp: 999999,
        }),
      );
    });

    it('NO puede personalizar el perfil de otro', async () => {
      await assertFails(
        updateDoc(doc(db(BOB), 'users', ALICE), { profileColor: '#ec4899' }),
      );
    });

    it('puede guardar fondo, personajes, decoraciones y vitrinas', async () => {
      await assertSucceeds(
        updateDoc(doc(db(ALICE), 'users', ALICE), {
          profileBackground: { preset: 'ocaso', position: 'top', dim: 30 },
          favoriteCharacters: [{ name: 'Spike', imageUrl: '', serie: 'Cowboy Bebop' }],
          decorations: [{ id: 'a', kind: 'sticker', ref: 'mando', x: 10, y: 20, size: 'm' }],
          showcases: ['logros', 'personajes'],
        }),
      );
    });

    it('puede quitarse el fondo y las vitrinas', async () => {
      await assertSucceeds(
        updateDoc(doc(db(ALICE), 'users', ALICE), {
          profileBackground: null,
          favoriteCharacters: [],
          decorations: [],
          showcases: [],
        }),
      );
    });

    it('NO puede guardar un fondo con preset inventado ni dim imposible', async () => {
      await assertFails(
        updateDoc(doc(db(ALICE), 'users', ALICE), {
          profileBackground: { preset: 'inventado' },
        }),
      );
      await assertFails(
        updateDoc(doc(db(ALICE), 'users', ALICE), {
          profileBackground: { url: 'https://x/y.jpg', dim: 81 },
        }),
      );
      await assertFails(
        updateDoc(doc(db(ALICE), 'users', ALICE), {
          profileBackground: { url: 'ftp://x/y.jpg' },
        }),
      );
    });

    it('NO puede pasarse del tope de personajes, decoraciones ni vitrinas', async () => {
      await assertFails(
        updateDoc(doc(db(ALICE), 'users', ALICE), {
          favoriteCharacters: ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((name) => ({ name })),
        }),
      );
      await assertFails(
        updateDoc(doc(db(ALICE), 'users', ALICE), {
          decorations: ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((id) => ({
            id,
            kind: 'sticker',
            ref: 'mando',
            x: 1,
            y: 1,
            size: 'm',
          })),
        }),
      );
      await assertFails(
        updateDoc(doc(db(ALICE), 'users', ALICE), {
          showcases: ['logros', 'texto', 'a', 'b', 'c', 'd', 'e'],
        }),
      );
    });

    it('puede guardar la apariencia del chat', async () => {
      await assertSucceeds(
        updateDoc(doc(db(ALICE), 'users', ALICE), {
          chatApariencia: {
            tema: 'neon',
            colorPropio: '#2563eb',
            fondo: { preset: 'ola', dim: 30 },
            forma: 'suave',
            letra: 'grande',
            reducirMovimiento: true,
          },
        }),
      );
    });

    it('puede quitarse la apariencia del chat', async () => {
      await assertSucceeds(
        updateDoc(doc(db(ALICE), 'users', ALICE), { chatApariencia: null }),
      );
    });

    it('NO puede guardar una apariencia del chat con valores inventados', async () => {
      await assertFails(
        updateDoc(doc(db(ALICE), 'users', ALICE), { chatApariencia: { tema: 'inventado' } }),
      );
      await assertFails(
        updateDoc(doc(db(ALICE), 'users', ALICE), { chatApariencia: { colorPropio: 'rojo' } }),
      );
      await assertFails(
        updateDoc(doc(db(ALICE), 'users', ALICE), {
          chatApariencia: { fondo: { url: 'https://x/y.jpg', dim: 81 } },
        }),
      );
      await assertFails(
        updateDoc(doc(db(ALICE), 'users', ALICE), {
          chatApariencia: { fondo: { url: 'ftp://x/y.jpg' } },
        }),
      );
      await assertFails(
        updateDoc(doc(db(ALICE), 'users', ALICE), { chatApariencia: { forma: 'triangulo' } }),
      );
    });

    it('NO puede personalizar el chat de otro', async () => {
      await assertFails(
        updateDoc(doc(db(BOB), 'users', ALICE), { chatApariencia: { tema: 'neon' } }),
      );
    });

    it('un visibleBadgeIds en null no bloquea otros guardados', async () => {
      await assertSucceeds(
        updateDoc(doc(db(ALICE), 'users', ALICE), { visibleBadgeIds: null }),
      );
      await assertSucceeds(updateDoc(doc(db(ALICE), 'users', ALICE), { bio: 'hola' }));
      await assertSucceeds(
        updateDoc(doc(db(ALICE), 'users', ALICE), { chatApariencia: { tema: 'neon' } }),
      );
    });
  });

  // ==========================================================
  // 5. El libro mayor es inaccesible
  // ==========================================================
  describe('el libro mayor de XP', () => {
    before(async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'users', ALICE, 'rewardLedger', 'x'), {
          reason: 'thread_created',
          amount: 20,
          at: '2026-10-01T00:00:00.000Z',
        });
      });
    });

    it('ni el usuario ni un moderador pueden escribirlo', async () => {
      await assertFails(
        updateDoc(doc(db(ALICE), 'users', ALICE, 'rewardLedger', 'x'), { amount: 5000 }),
      );
      await assertFails(
        setDoc(doc(db(MOD), 'users', ALICE, 'rewardLedger', 'inventado'), {
          reason: 'admin_adjustment',
          amount: 999999,
        }),
      );
    });

    it('el usuario no puede ni leerlo', async () => {
      await assertFails(getDoc(doc(db(ALICE), 'users', ALICE, 'rewardLedger', 'x')));
    });

    it('el admin si puede leerlo', async () => {
      await assertSucceeds(getDoc(doc(db('jefe'), 'users', ALICE, 'rewardLedger', 'x')));
    });
  });

  // ==========================================================
  // 6. Lo de antes sigue funcionando
  // ==========================================================
  describe('no se ha roto nada de lo anterior', () => {
    it('el usuario sigue pudiendo editar su perfil', async () => {
      await assertSucceeds(
        updateDoc(doc(db(BOB), 'users', BOB), {
          displayName: 'Nombre nuevo',
          bio: 'Bio nueva',
          avatarUrl: 'https://example.com/a.png',
          favoriteAnime: 'Frieren',
        }),
      );
    });

    it('sigue sin poder cambiar su rol', async () => {
      await assertFails(updateDoc(doc(db(BOB), 'users', BOB), { role: 'admin' }));
    });

    it('un moderador NO puede banear escribiendo el documento', async () => {
      // El baneo solo lo aplica la callable `banearUsuario`, que
      // escribe también `accountRestrictions` en la misma
      // transacción. Si el cliente pudiera poner `isBanned`, las
      // dos copias se desincronizarían (un "desbaneo" desde el
      // panel dejaría la restricción duradera activa).
      await assertFails(updateDoc(doc(db(MOD), 'users', BOB), { isBanned: true }));
      await assertFails(
        updateDoc(doc(db(MOD), 'users', BOB), { isBanned: true, xp: 5000 }),
      );
    });

    it('ni un admin puede banear escribiendo el documento', async () => {
      await assertFails(updateDoc(doc(db('jefe'), 'users', BOB), { isBanned: true }));
    });

    it('una cuenta SIN campo isBanned puede publicar igual', async () => {
      // La cuenta mas vieja de todas: creada antes de que
      // existiera ese campo. Antes, leer 'myDoc().data.isBanned'
      // lanzaba un error de evaluacion y la regla entera caia con
      // PERMISSION_DENIED, dejando a esas cuentas sin poder
      // publicar nada.
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'users', 'veterano'), {
          uid: 'veterano',
          email: 'veterano@test.com',
          username: 'veterano',
          displayName: 'veterano',
          chatId: 'GK-vet',
          avatarUrl: '',
          role: 'user',
          createdAt: '2020-01-01T00:00:00.000Z',
        });
      });

      await assertSucceeds(
        addDoc(collection(db('veterano'), 'threads'), {
          authorId: 'veterano',
          authorName: 'veterano',
          authorAvatar: '',
          title: 'Hilo de una cuenta veteranas',
          body: 'Sin campo isBanned en su documento',
          categoryId: 'debates',
          categoryName: 'Debates',
          tags: ['General'],
          likesCount: 0,
          likedBy: [],
          commentsCount: 0,
          createdAt: new Date(),
        }),
      );
    });

    it('el admin sigue pudiendo tocar lo que sea', async () => {
      await assertSucceeds(
        updateDoc(doc(db('jefe'), 'users', BOB), { xp: 777, level: 20 }),
      );
    });

    it('los hilos y comentarios siguen publicandose', async () => {
      await assertSucceeds(
        addDoc(collection(db(BOB), 'threads'), {
          authorId: BOB,
          authorName: 'bob',
          authorAvatar: '',
          title: 'Mi hilo de prueba',
          body: 'Contenido del hilo',
          categoryId: 'debates',
          categoryName: 'Debates',
          tags: ['General'],
          likesCount: 0,
          likedBy: [],
          commentsCount: 0,
          createdAt: new Date(),
        }),
      );
    });

    it('la configuracion de la gamificacion la lee cualquiera con sesion', async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'gamification', 'config'), {
          activo: false,
          base: 100,
        });
      });
      await assertSucceeds(getDoc(doc(db(BOB), 'gamification', 'config')));
      await assertFails(getDoc(doc(testEnv.unauthenticatedContext().firestore(), 'gamification', 'config')));
    });

    it('un usuario normal no puede escribir la configuracion', async () => {
      await assertFails(
        setDoc(doc(db(BOB), 'gamification', 'config'), { activo: true, xp: { thread_created: 9999 } }),
      );
    });

    it('el admin si puede escribir la configuracion', async () => {
      await assertSucceeds(setDoc(doc(db('jefe'), 'gamification', 'config'), { activo: false }));
    });
  });
});
