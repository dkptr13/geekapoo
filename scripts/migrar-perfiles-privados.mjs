/**
 * MIGRACIÓN: separar los datos privados de `users/{uid}`.
 *
 * Hasta ahora el documento público del usuario llevaba el correo, los
 * ajustes de privacidad, la apariencia del chat y la región. Cualquier
 * persona con sesión podía leerlo entero. Las reglas nuevas ya no
 * permiten escribir esos campos en `users/{uid}` y los leen de
 * `userPrivate/{uid}`, que solo ve su dueño (y un admin).
 *
 * Este script:
 *
 *   1. Copia esos campos a `userPrivate/{uid}`.
 *   2. Escribe en el perfil público solo las dos señales que la
 *      interfaz necesita para pintar a otra persona:
 *      `privateProfile` y `activityHidden`.
 *   3. Borra del perfil público los campos privados y la copia
 *      antigua de `isBanned`.
 *   4. Si `isBanned` era true y no existe una restricción duradera,
 *      crea `accountRestrictions/{uid}` para no perder el baneo.
 *
 * Uso:
 *
 *   # Simulación (por defecto): no escribe nada.
 *   node scripts/migrar-perfiles-privados.mjs --project mi-proyecto
 *
 *   # Aplicar los cambios.
 *   node scripts/migrar-perfiles-privados.mjs --project mi-proyecto --escribir
 *
 * Necesita credenciales del Admin SDK:
 *   - En producción, `GOOGLE_APPLICATION_CREDENTIALS` o una cuenta con
 *     `gcloud auth application-default login`.
 *   - Con `FIRESTORE_EMULATOR_HOST` usa el emulador y no pide
 *     credenciales.
 *
 * Este script no se ejecuta solo ni se despliega. Es una herramienta
 * manual, como el resto de `scripts/`.
 */
import { createRequire } from 'node:module';
import process from 'node:process';

const require = createRequire(import.meta.url);

let admin;
try {
  admin = require('../functions/node_modules/firebase-admin');
} catch {
  try {
    admin = require('firebase-admin');
  } catch {
    console.error(
      'No encuentro firebase-admin. Instala las dependencias de functions/ ' +
        'o ejecuta el script desde la raíz del repositorio.',
    );
    process.exit(1);
  }
}

const args = process.argv.slice(2);
const escribir = args.includes('--escribir');
const projectIndex = args.indexOf('--project');
const projectId =
  projectIndex >= 0 ? args[projectIndex + 1] : process.env.GCLOUD_PROJECT;

if (!projectId) {
  console.error('Falta el proyecto. Pasa --project <id> o define GCLOUD_PROJECT.');
  process.exit(1);
}

const enEmulador = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

admin.initializeApp(
  enEmulador
    ? { projectId }
    : { projectId, credential: admin.credential.applicationDefault() },
);

const db = admin.firestore();
const { FieldValue } = admin.firestore;
const CAMPO_ID = admin.firestore.FieldPath.documentId();
const TAM_PAGINA = 200;

const CAMPOS_PRIVADOS = [
  'email',
  'chatApariencia',
  'regionPreferida',
  'profileVisibility',
  'allowChatRequests',
  'showActivity',
];

const PRIVACIDAD_POR_DEFECTO = {
  profileVisibility: 'public',
  allowChatRequests: true,
  showActivity: true,
};

console.log(
  `[perfiles] Proyecto: ${projectId} · modo: ${
    escribir ? 'ESCRITURA' : 'SIMULACIÓN (sin escribir)'
  }${enEmulador ? ' · emulador' : ''}`,
);
console.log(
  '[perfiles] Se copian datos a userPrivate; no se borra ningún perfil.',
);

async function porPaginas(consulta, tam, callback) {
  let ultimo = null;
  for (;;) {
    let pagina = consulta.orderBy(CAMPO_ID).limit(tam);
    if (ultimo) pagina = pagina.startAfter(ultimo);

    const snap = await pagina.get();
    for (const d of snap.docs) await callback(d);

    if (snap.size < tam) break;
    ultimo = snap.docs[snap.docs.length - 1];
  }
}

function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

function privacidadDe(data, existente) {
  const privada = existente?.privacy ?? {};
  const base = { ...PRIVACIDAD_POR_DEFECTO, ...privada };

  const hayDatos =
    existente?.privacy ||
    'profileVisibility' in data ||
    'allowChatRequests' in data ||
    'showActivity' in data;

  if (!hayDatos) {
    return { privacy: {}, senales: { privateProfile: false, activityHidden: false } };
  }

  // El documento privado ya existente manda: si la app nueva escribió
  // allí un ajuste, una copia vieja que quedara en el perfil público
  // no debe revertirlo. Solo se usa el valor público para los campos
  // que aún no estén en el documento privado.
  const privacy = {
    profileVisibility:
      'profileVisibility' in privada
        ? base.profileVisibility === 'private'
          ? 'private'
          : 'public'
        : 'profileVisibility' in data
          ? data.profileVisibility === 'private'
            ? 'private'
            : 'public'
          : 'public',
    allowChatRequests:
      'allowChatRequests' in privada
        ? base.allowChatRequests !== false
        : 'allowChatRequests' in data
          ? data.allowChatRequests !== false
          : true,
    showActivity:
      'showActivity' in privada
        ? base.showActivity !== false
        : 'showActivity' in data
          ? data.showActivity !== false
          : true,
  };

  return {
    privacy,
    senales: {
      privateProfile: privacy.profileVisibility === 'private',
      activityHidden: privacy.showActivity === false,
    },
  };
}

let usuarios = 0;
let conDatosPrivados = 0;
let baneosMigrados = 0;

await porPaginas(db.collection('users'), TAM_PAGINA, async (user) => {
  usuarios += 1;

  const data = user.data() ?? {};
  const privateRef = db.doc(`userPrivate/${user.id}`);
  const existingSnap = await privateRef.get();
  const existente = existingSnap.exists ? existingSnap.data() : null;

  const privado = {};

  // En todos los campos, si el documento privado ya existe manda él.
  // La copia pública solo sirve para completar lo que falte.
  const email = texto(existente?.email) || texto(data.email);
  if (email) privado.email = email;

  const { privacy, senales } = privacidadDe(data, existente);
  if (Object.keys(privacy).length > 0) privado.privacy = privacy;

  if (existente && 'chatApariencia' in existente) {
    privado.chatApariencia = existente.chatApariencia ?? null;
  } else if ('chatApariencia' in data) {
    privado.chatApariencia = data.chatApariencia ?? null;
  }

  const region = texto(existente?.regionPreferida) || texto(data.regionPreferida);
  if (region) privado.regionPreferida = region;

  if (Object.keys(privado).length > 0) {
    conDatosPrivados += 1;
    privado.updatedAt = FieldValue.serverTimestamp();
  }

  const actualizacionPublica = {
    privateProfile: senales.privateProfile,
    activityHidden: senales.activityHidden,
  };
  CAMPOS_PRIVADOS.forEach((campo) => {
    actualizacionPublica[campo] = FieldValue.delete();
  });
  actualizacionPublica.isBanned = FieldValue.delete();

  // ¿Hay un baneo antiguo que deba sobrevivir? La restricción es
  // la fuente de verdad nueva; si ya existe, no se toca.
  let crearRestriccion = false;
  if (data.isBanned === true) {
    const restriccionRef = db.doc(`accountRestrictions/${user.id}`);
    const restriccion = await restriccionRef.get();

    // Si YA existe una restricción, es la fuente de verdad: puede
    // estar activa o levantada. No se reactiva un baneo levantado
    // solo porque el perfil viejo se quedara con la bandera puesta.
    if (!restriccion.exists) {
      crearRestriccion = true;
      if (escribir) {
        await restriccionRef.set(
          {
            uid: user.id,
            tipo: 'ban',
            activo: true,
            motivo: 'Migración de isBanned',
            fechaFin: null,
            creadoEn: FieldValue.serverTimestamp(),
            actualizadoEn: FieldValue.serverTimestamp(),
            actualizadoPor: 'migracion-perfiles-privados',
          },
          { merge: true },
        );
      }
      baneosMigrados += 1;
    }
  }

  if (escribir) {
    if (Object.keys(privado).length > 0) {
      await privateRef.set(privado, { merge: true });
    }
    await user.ref.update(actualizacionPublica);
  }

  if (usuarios <= 10 || crearRestriccion) {
    console.log(
      `  · ${user.id}: ${Object.keys(privado).join(', ') || 'sin datos privados'}` +
        `${crearRestriccion ? ' · baneo migrado' : ''}`,
    );
  }
});

console.log('\n[perfiles] RESUMEN');
console.log(`  Usuarios revisados:          ${usuarios}`);
console.log(`  Con datos privados:          ${conDatosPrivados}`);
console.log(`  Baneos migrados:             ${baneosMigrados}`);
console.log(
  `  ${escribir ? 'Aplicado' : 'Se aplicaría'} en userPrivate y users.`,
);
if (!escribir) {
  console.log('  Vuelve a ejecutarlo con --escribir para aplicar los cambios.');
}
