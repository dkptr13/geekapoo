/**
 * MIGRACIÓN: `chatId` en las reacciones a mensajes de chat.
 *
 * Las reglas nuevas de `reactions/` solo dejan leer una reacción a un
 * mensaje si el documento dice a qué chat pertenece y quien lee es
 * miembro de ese chat. Las reacciones viejas que se escribieron antes
 * de que `chatId` fuera obligatorio no se pueden autorizar: sin ese
 * campo no hay forma de saber si el mensaje es de un chat privado.
 *
 * Este script NO borra nada. Solo completa `chatId` cuando el id del
 * mensaje aparece en UN ÚNICO chat, que es lo que permite demostrar la
 * pertenencia sin adivinar. Si el mismo id aparece en varios chats o
 * el mensaje ya no existe, lo deja intacto y lo lista para revisión
 * manual: son documentos que las reglas nuevas no van a devolver,
 * pero los datos siguen ahí.
 *
 * Uso:
 *
 *   # Simulación (por defecto): no escribe nada.
 *   node scripts/migrar-reacciones-chat.mjs --project mi-proyecto
 *
 *   # Aplicar los cambios seguros.
 *   node scripts/migrar-reacciones-chat.mjs --project mi-proyecto --escribir
 *
 *   # Además, corregir un chatId presente que apunta a otro chat
 *   # cuando el mensaje existe en un único chat.
 *   node scripts/migrar-reacciones-chat.mjs --project mi-proyecto --escribir --reparar
 *
 * Credenciales:
 *   - En producción, `GOOGLE_APPLICATION_CREDENTIALS` o una cuenta con
 *     `gcloud auth application-default login`.
 *   - `firebase login` NO sirve para este script: el Admin SDK usa
 *     Application Default Credentials, que son otras credenciales.
 *   - Con `FIRESTORE_EMULATOR_HOST` usa el emulador y no pide
 *     credenciales; sirve para probar el script sin tocar datos reales.
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
const reparar = args.includes('--reparar');
const projectIndex = args.indexOf('--project');
const projectId =
  projectIndex >= 0 ? args[projectIndex + 1] : process.env.GCLOUD_PROJECT;

if (!projectId) {
  console.error(
    'Falta el proyecto. Pasa --project <id> o define GCLOUD_PROJECT.',
  );
  process.exit(1);
}

const enEmulador = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

admin.initializeApp(
  enEmulador
    ? { projectId }
    : {
        projectId,
        credential: admin.credential.applicationDefault(),
      },
);

const db = admin.firestore();
const CAMPO_ID = admin.firestore.FieldPath.documentId();
const TAM_PAGINA = 200;

console.log(
  `[reacciones] Proyecto: ${projectId} · modo: ${
    escribir ? 'ESCRITURA' : 'SIMULACIÓN (sin escribir)'
  }${enEmulador ? ' · emulador' : ''}`,
);
console.log(
  '[reacciones] Solo se completa chatId; no se borra ni se mueve ninguna reacción.',
);

/** Consulta paginada por id de documento, sin cargar todo de golpe. */
async function porPaginas(consulta, tam, callback) {
  let ultimo = null;
  for (;;) {
    let pagina = consulta.orderBy(CAMPO_ID).limit(tam);
    if (ultimo) pagina = pagina.startAfter(ultimo);

    const snap = await pagina.get();
    for (const d of snap.docs) {
      await callback(d);
    }

    if (snap.size < tam) break;
    ultimo = snap.docs[snap.docs.length - 1];
  }
}

/**
 * Índice de los ids de mensaje que nos interesan.
 *
 * Se recorren los chats y su subcolección `messages` en vez de usar
 * una consulta collectionGroup: así el script no depende de que haya
 * un índice de grupo preparado solo para esta migración.
 */
async function indexarMensajes(idsBuscados) {
  const indice = new Map();

  await porPaginas(db.collection('chats'), TAM_PAGINA, async (chat) => {
    const mensajes = await chat.ref.collection('messages').get();
    for (const msg of mensajes.docs) {
      if (!idsBuscados.has(msg.id)) continue;

      const chats = indice.get(msg.id) ?? new Set();
      chats.add(chat.id);
      indice.set(msg.id, chats);
    }
  });

  return indice;
}

function listarEjemplos(lista, limite = 12) {
  return lista.slice(0, limite).map((x) => `  · ${x}`).join('\n');
}

async function main() {
  const snap = await db
    .collection('reactions')
    .where('targetType', '==', 'chat_message')
    .get();

  console.log(`[reacciones] Encontradas ${snap.size} reacciones a mensajes.`);

  const existeCache = new Map();
  const idsABuscar = new Set();
  const pendientes = [];
  const malformadas = [];
  let validas = 0;

  for (const d of snap.docs) {
    const data = d.data();
    const targetId =
      typeof data.targetId === 'string' && data.targetId.length > 0
        ? data.targetId
        : null;
    // No se normaliza aquí: un `chatId` con espacios no coincide con
    // el id real y las consultas del cliente tampoco lo encontrarían.
    // Se deja como "sin chatId válido" y la migración lo repara solo
    // si el mensaje aparece en un único chat.
    const chatId =
      typeof data.chatId === 'string' && data.chatId.length > 0
        ? data.chatId
        : null;

    if (!targetId) {
      malformadas.push(`${d.ref.path} (sin targetId válido)`);
      continue;
    }

    if (chatId) {
      const clave = `${chatId}/${targetId}`;
      let existe = existeCache.get(clave);
      if (existe === undefined) {
        const msg = await db
          .doc(`chats/${chatId}/messages/${targetId}`)
          .get();
        existe = msg.exists;
        existeCache.set(clave, existe);
      }

      if (existe) {
        validas++;
        continue;
      }
    }

    idsABuscar.add(targetId);
    pendientes.push({
      ref: d.ref,
      targetId,
      chatId,
      motivo: chatId
        ? 'el chat indicado no contiene ese mensaje'
        : 'sin chatId',
    });
  }

  const indice = idsABuscar.size > 0
    ? await indexarMensajes(idsABuscar)
    : new Map();

  const reparadas = [];
  const ambiguas = [];
  const huerfanas = [];
  const incoherentes = [];

  for (const p of pendientes) {
    const candidatos = indice.get(p.targetId);

    if (!candidatos || candidatos.size === 0) {
      huerfanas.push(
        `${p.ref.path} (mensaje ${p.targetId} no existe en ningún chat)`,
      );
      continue;
    }

    if (candidatos.size > 1) {
      ambiguas.push(
        `${p.ref.path} (mensaje ${p.targetId} está en: ${[
          ...candidatos,
        ].join(', ')})`,
      );
      continue;
    }

    const chatId = [...candidatos][0];

    // Un chatId presente que apunta a otro chat no se cambia en la
    // pasada normal: podría ser una referencia manipulada. Con
    // --reparar se corrige solo si el mensaje aparece en un único chat.
    if (p.chatId && !reparar) {
      incoherentes.push(
        `${p.ref.path} (dice ${p.chatId}, pero el mensaje solo existe en ${chatId})`,
      );
      continue;
    }

    if (escribir) {
      await p.ref.update({ chatId });
    }
    reparadas.push(`${p.ref.path} → chatId: ${chatId}`);
  }

  console.log('\n[reacciones] RESUMEN');
  console.log(`  Válidas:                  ${validas}`);
  console.log(`  Pendientes de revisar:    ${pendientes.length}`);
  console.log(`  Completadas/corregidas:   ${reparadas.length}`);
  console.log(`  Referencias incoherentes: ${incoherentes.length}`);
  console.log(`  Ambiguas:                 ${ambiguas.length}`);
  console.log(`  Huérfanas:                ${huerfanas.length}`);
  console.log(`  Malformadas:              ${malformadas.length}`);

  if (reparadas.length > 0) {
    console.log(
      `\n[reacciones] ${
        escribir ? 'Actualizadas' : 'Se actualizarían'
      } (${reparadas.length}):`,
    );
    console.log(listarEjemplos(reparadas));
  }
  if (incoherentes.length > 0) {
    console.log(
      `\n[reacciones] Con chatId incoherente (${incoherentes.length}). ` +
        'No se tocan sin --reparar:',
    );
    console.log(listarEjemplos(incoherentes));
  }
  if (ambiguas.length > 0) {
    console.log(
      `\n[reacciones] Ambiguas (${ambiguas.length}). Hay que revisarlas a mano:`,
    );
    console.log(listarEjemplos(ambiguas));
  }
  if (huerfanas.length > 0) {
    console.log(
      `\n[reacciones] Huérfanas (${huerfanas.length}). No se borran:`,
    );
    console.log(listarEjemplos(huerfanas));
  }
  if (malformadas.length > 0) {
    console.log(
      `\n[reacciones] Malformadas (${malformadas.length}). No se tocan:`,
    );
    console.log(listarEjemplos(malformadas));
  }

  if (!escribir) {
    console.log(
      '\n[reacciones] Simulación terminada. Repite con --escribir para aplicar los cambios seguros.',
    );
  }
  if (ambiguas.length + huerfanas.length + malformadas.length > 0) {
    console.log(
      '\n[reacciones] Las ambiguas/huérfanas/malformadas no se pueden autorizar con las reglas nuevas. ' +
        'Quedan en la base de datos para revisión manual; no se ha perdido nada.',
    );
  }
}

function esErrorDeCredenciales(error) {
  const texto = error instanceof Error ? error.message : String(error);
  return texto.includes('Could not load the default credentials')
    || texto.includes('Could not load the default credentials. Browse to');
}

main().catch((e) => {
  if (esErrorDeCredenciales(e)) {
    console.error(
      '\n[reacciones] Falta autenticación de Google para el Admin SDK.\n' +
        '`firebase login` NO sirve para este script: Firebase Admin usa\n' +
        'Application Default Credentials, que son otras credenciales.\n\n' +
        'Opción A (con gcloud):\n' +
        '  gcloud auth application-default login\n\n' +
        'Opción B (con una clave de servicio):\n' +
        '  $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\\ruta\\clave-servicio.json"\n\n' +
        'Después repite este mismo comando. El modo simulación no escribe nada.',
    );
    process.exitCode = 1;
    return;
  }

  console.error('[reacciones] Error:', e);
  process.exitCode = 1;
});
