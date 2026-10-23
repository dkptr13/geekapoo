/**
 * Pruebas de las reglas de seguridad de Storage.
 *
 * ── POR QUE HAY UN FICHERO ESTE Y NO OTRO ───────────────────────────
 *
 * Las reglas de Storage son un lenguaje aparte. El `tsc --noEmit` no las
 * mira y los emuladores de Firestore tampoco las ejecutan: hacen falta
 * el emulador de Storage y un cliente de pruebas que hable su
 * protocolo.
 *
 * Esto se nota al leer las reglas: `chats/{chatId}/{folder}/{fileName}`
 * comprueba la pertenencia al grupo con un `firestore.get`, y eso no se
 * puede probar a ojo. Si el identificador del chat va mal escrito en la
 * ruta, la comprobación mira un documento que no existe, da error, y
 * TODAS las subidas de chat se rechazan sin que se entienda por qué.
 *
 * ── QUÉ SE COMPRUEBA ────────────────────────────────────────────────
 *
 * Lo que importa de la carpeta `chats/` es que la comprobación de
 * pertenencia funciona en las dos direcciones:
 *
 *   · Un miembro puede subir a la carpeta de su conversación.
 *   · Quien NO es miembro no puede, aunque conozca el identificador.
 *
 * La segunda es la que importa de verdad. Si faltara, cualquier cuenta
 * con sesión podría subir ficheros a la carpeta de cualquier grupo con
 * solo adivinar el id, y como las fotos de los mensajes son públicas
 * para quien tenga el enlace, se podría llenar el almacenamiento del
 * proyecto con lo que fuera.
 *
 * Y una tercera, que es la que rompe todo en silencio: un chat que no
 * existe tiene que rechazar la subida, no aceptarla. Con la función
 * mal escrita, `firestore.get` sobre un documento inexistente lanza un
 * error de evaluación y la regla da `false`, que es lo que queremos,
 * pero conviene comprobarlo y no suponerlo.
 */
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const {
  ref,
  uploadBytes,
  getBytes,
  deleteObject,
} = require('firebase/storage');
const { doc, setDoc, getDoc } = require('firebase/firestore');

const fs = require('fs');

const ALICE = 'alice';
const BOB = 'bob';
const CARA = 'carla'; // cuenta normal que NO está en ningún chat
const BANEADO = 'baneado';
const BANEADO_REGISTRO = 'baneado-registro';
const DESBANEADO = 'desbaneado';

/** Un PNG de 1x1, porque lo que se comprueba son las reglas. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

/**
 * El entorno de pruebas. Va en el ambito del modulo y no dentro del
 * `describe` porque `subir()` lo necesita y se llama desde los tests:
 * una variable de bloque no se ve desde fuera.
 */
let testEnv = null;

/**
 * Sube un fichero como lo haría un navegador.
 *
 * El contexto sale de `authenticatedContext(uid)`, que es lo que
 * aplica las reglas de seguridad. Con el contexto sin autenticar, las
 * reglas no se miran.
 */
async function subir(uid, ruta, contenido = PNG, tipo = 'image/png') {
  // `uid: null` es el caso "sin sesión": es lo que hace
  // `authenticatedContext(null)` en esta librería.
  const contexto = testEnv.authenticatedContext(uid);

  return uploadBytes(ref(contexto.storage(), ruta), contenido, {
    contentType: tipo,
  });
}

/** Sube sin sesión, que es el caso de quien no ha iniciado sesión. */
async function subirSinSesion(ruta, contenido = PNG, tipo = 'image/png') {
  return uploadBytes(ref(testEnv.unauthenticatedContext().storage(), ruta), contenido, {
    contentType: tipo,
  });
}

/** Escribe saltándose las reglas, para sembrar el estado inicial. */
async function sembrar(fn) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await fn(ctx.firestore());
  });
}

describe('reglas de Storage', () => {
  before(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'demo-geekapoo-reglas',
      // Los host y puerto se escriben a mano a proposito. Con los dos
      // emuladores levantados a la vez, el de Storage se conecta al
      // hub como si fuera el de Firestore, y `clearDatabase()` acaba
      // fallando con "the database emulator is not running": son dos
      // procesos distintos hablando con el hub y cada uno espera al
      // suyo.
      //
      // Escribirlos aqui los separa. Los puertos son los de
      // `firebase.json`.
      firestore: {
        rules: fs.readFileSync('firestore.rules', 'utf8'),
        host: '127.0.0.1',
        port: 8080,
      },
      storage: {
        rules: fs.readFileSync('storage.rules', 'utf8'),
        host: '127.0.0.1',
        port: 9199,
      },
    });
  });

  after(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    // NO se llama a `clearDatabase()`. Esa función consulta al hub de
    // los emuladores para averiguar en qué puerto está Firestore, y
    // con dos emuladores levantados a la vez el hub contesta el del
    // último que arrancó (Storage), no el de Firestore. El resultado es
    // "the database emulator is not running".
    //
    // La libreria lo avisa de otra forma: `clearDatabase()` funciona si
    // se le pasa el host y el puerto a mano, pero eso es un parametro
    // distinto del de `initializeTestEnvironment` y hay que pasarlo en
    // cada llamada.
    //
    // aqui no hace falta: cada prueba sube ficheros con nombres únicos
    // y el documento del grupo se vuelve a escribir siempre igual. Lo
    // que no se hace es depender del orden.

    // alice es la dueña del grupo y bob es un miembro más; cara está
    // fuera. Para comprobar la pertenencia hace falta el chat con su
    // lista de miembros.
    await sembrar(async (f) => {
      await setDoc(doc(f, 'chats', 'chat1'), {
        type: 'group',
        name: 'grupo',
        ownerId: ALICE,
        memberIds: [ALICE, BOB],
      });

      await setDoc(doc(f, 'users', ALICE), { displayName: 'alice' });
      await setDoc(doc(f, 'users', BOB), { displayName: 'bob' });
      await setDoc(doc(f, 'users', CARA), { displayName: 'carla' });

      // Baneos: uno con la bandera visible y otro SOLO con el
      // registro duradero (su perfil dice isBanned:false, como
      // quedaría después de borrarlo y recrearlo).
      await setDoc(doc(f, 'users', BANEADO), {
        displayName: 'baneado',
        isBanned: true,
      });
      await setDoc(doc(f, 'users', BANEADO_REGISTRO), {
        displayName: 'baneado por registro',
        isBanned: false,
      });
      await setDoc(doc(f, 'accountRestrictions', BANEADO_REGISTRO), {
        uid: BANEADO_REGISTRO,
        tipo: 'ban',
        activo: true,
      });

      // Y uno al que ya le levantaron la sanción: el documento del
      // registro sigue ahí, pero inactivo.
      await setDoc(doc(f, 'users', DESBANEADO), {
        displayName: 'desbaneado',
        isBanned: false,
      });
      await setDoc(doc(f, 'accountRestrictions', DESBANEADO), {
        uid: DESBANEADO,
        tipo: 'ban',
        activo: false,
      });
    });
  });


// ── FOTOS DEL GRUPO Y DE LOS MENSAJES ─────────────────
  describe('carpeta chats/', () => {
    it('la dueña puede subir la foto del grupo', async () => {
      await assertSucceeds(subir(ALICE, 'chats/chat1/group-avatar/1700000000-foto.jpg'));
    });

    it('un miembro puede subir una foto a un mensaje', async () => {
      // Bob no es dueño, pero SÍ es miembro: los mensajes son de
      // cualquiera del grupo.
      await assertSucceeds(subir(BOB, 'chats/chat1/messages/1700000000-foto.jpg'));
    });

    it('quien NO es miembro NO puede subir a la carpeta del grupo', async () => {
      // El ataque: conocer el identificador del chat vale para subir si
      // la regla no comprueba la pertenencia.
      await assertFails(subir(CARA, 'chats/chat1/group-avatar/1700000000-intrusa.jpg'));
    });

    it('sin sesión no se puede subir', async () => {
      // Sin sesión no se usa `authenticatedContext`: se usa
      // `unauthenticatedContext`. Pasar `null` a `authenticatedContext`
      // hace que la librería lance un error al construir el token, y ese
      // error cuenta como "fallo inesperado", no como "rechazado".
      await assertFails(
        subirSinSesion('chats/chat1/messages/1700000000.jpg'),
      );
    });

    it('un chat que no existe rechaza la subida', async () => {
      // Si la función de pertenencia se escribiera mal, en vez de
      // rechazar daría error de evaluación, que también es `false`
      // pero por otra razón. Lo que no puede pasar es que lo ACEPTE.
      await assertFails(subir(ALICE, 'chats/chat-inexistente/group-avatar/1700000000.jpg'));
    });

    it('un fichero que no es imagen se rechaza', async () => {
      await assertFails(
        subir(
          ALICE,
          'chats/chat1/group-avatar/1700000000-malicioso.svg',
          Buffer.from('<svg onload="alert(1)"></svg>'),
          'image/svg+xml',
        ),
      );
    });

    it('cualquiera puede LEER una foto del grupo una vez subida', async () => {
      // Las fotos de los chats son públicas para quien tenga el
      // enlace: los mensajes se ven desde cualquier navegador, sin
      // sesión, así que la foto tiene que verse igual.
      await subir(ALICE, 'chats/chat1/group-avatar/1700000000-foto.jpg');

      await assertSucceeds(
        getBytes(
          ref(
            testEnv.unauthenticatedContext().storage(),
            'chats/chat1/group-avatar/1700000000-foto.jpg',
          ),
        ),
      );
    });

    it('un miembro puede borrar su foto antigua', async () => {
      // Es lo que hace el servicio al cambiar la foto del grupo: sube
      // la nueva, escribe el campo y borra el fichero viejo.
      await subir(ALICE, 'chats/chat1/group-avatar/1700000000-vieja.jpg');

      await assertSucceeds(
        deleteObject(
          ref(
            testEnv.authenticatedContext(ALICE).storage(),
            'chats/chat1/group-avatar/1700000000-vieja.jpg',
          ),
        ),
      );
    });
  });

  // ── BANEOS ────────────────────────────────────────────
  describe('baneos', () => {
    it('un usuario baneado NO puede subir imágenes a la comunidad', async () => {
      // El avatar propio no se bloquea (cambiarlo no publica nada),
      // pero las imágenes de hilos y comentarios sí.
      await assertFails(subir(BANEADO, `community/${BANEADO}/1700000000.jpg`));
    });

    it('el registro duradero bloquea aunque el perfil diga isBanned:false', async () => {
      // Es el estado que queda después de borrar el perfil y
      // volver a entrar: el documento nuevo nace con
      // `isBanned: false`, pero la restricción sigue activa.
      await assertFails(
        subir(BANEADO_REGISTRO, `community/${BANEADO_REGISTRO}/1700000000.jpg`),
      );
    });

    it('un baneo levantado (activo:false) deja subir otra vez', async () => {
      await assertSucceeds(
        subir(DESBANEADO, `community/${DESBANEADO}/1700000000.jpg`),
      );
    });
  });

  // ── QUE NO SE ROMPA LO DE ANTES ────────────────────────
  describe('las carpetas de siempre siguen igual', () => {
    it('un usuario puede subir a su carpeta de avatar', async () => {
      await assertSucceeds(subir(ALICE, `avatars/${ALICE}/1700000000.jpg`));
    });

    it('un usuario NO puede subir a la carpeta de otro', async () => {
      await assertFails(subir(CARA, `avatars/${ALICE}/1700000000.jpg`));
    });

    it('un usuario puede subir a su carpeta de comunidad', async () => {
      await assertSucceeds(subir(ALICE, `community/${ALICE}/1700000000.jpg`));
    });

    it('un usuario NO puede subir a la carpeta de comunidad de otro', async () => {
      await assertFails(subir(CARA, `community/${ALICE}/1700000000.jpg`));
    });

    it('el contenido del catálogo sigue siendo solo del admin', async () => {
      await assertFails(subir(ALICE, 'content/anime/portada.jpg'));
    });
  });
});