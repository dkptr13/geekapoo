/**
 * AUDITORÍA DE TRIGGERS — VERIFICACIÓN POST-P0 DEL FARMEO DE XP
 *
 * Intenta crear comentarios desde el SDK de cliente (con las reglas
 * activas) apuntando a un `targetType`/`targetId` que no existen.
 *
 * Antes de P0 las reglas los aceptaban y `onCommentCreated` pagaba
 * +5 XP por cada uno. Ahora la regla rechaza el comentario antes de
 * que llegue al trigger y el XP no se mueve.
 *
 * Salvaguardas: solo proyecto demo-* y emuladores.
 *
 * Ejecución:
 *   npx firebase emulators:exec --only firestore,auth,functions \
 *     --project demo-geekapoo-auditoria \
 *     "node scripts/auditoria-triggers.mjs"
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  connectAuthEmulator,
  getAuth,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  connectFirestoreEmulator,
  getFirestore,
  serverTimestamp,
} from 'firebase/firestore';

const PROJECT =
  process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || '';
if (!PROJECT.startsWith('demo-')) {
  throw new Error('Abortado: esto solo corre contra un proyecto demo-*.');
}
if (!process.env.FIRESTORE_EMULATOR_HOST) {
  throw new Error('Abortado: falta FIRESTORE_EMULATOR_HOST.');
}

const requireFromFunctions = createRequire(
  path.join(process.cwd(), 'functions', 'package.json'),
);
const admin = requireFromFunctions('firebase-admin');
admin.initializeApp({ projectId: PROJECT });
const dbAdmin = admin.firestore();

const app = initializeApp({
  apiKey: 'demo-key',
  projectId: PROJECT,
  authDomain: `${PROJECT}.firebaseapp.com`,
});
const auth = getAuth(app);
connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
const db = getFirestore(app);
connectFirestoreEmulator(db, '127.0.0.1', 8080);

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const credencial = await createUserWithEmailAndPassword(
    auth,
    `farmeo-${Date.now()}@auditoria.test`,
    'Auditoria123!',
  );
  const uid = credencial.user.uid;

  await dbAdmin.doc(`users/${uid}`).set({
    uid,
    username: 'farmeo',
    displayName: 'farmeo',
    avatarUrl: '',
    chatId: `GK-${uid.slice(0, 8)}`,
    role: 'user',
    createdAt: '2026-01-01T00:00:00.000Z',
    isBanned: false,
  });
  await dbAdmin.doc('gamification/config').set({ activo: true }, { merge: true });

  const antes = (await dbAdmin.doc(`users/${uid}`).get()).data() || {};
  console.log(`XP inicial: ${antes.xp ?? 0}`);

  const ids = [];
  let rechazados = 0;
  for (const n of [1, 2, 3]) {
    try {
      const ref = await addDoc(collection(db, 'comments'), {
        authorId: uid,
        authorName: 'farmeo',
        authorAvatar: '',
        targetType: 'inventado',
        targetId: `objetivo-fantasma-${n}`,
        parentId: null,
        body: `Comentario de farmeo ${n}`,
        createdAt: serverTimestamp(),
      });
      ids.push(ref.id);
      console.log(`!! Comentario ${n} ACEPTADO con objetivo inventado: ${ref.id}`);
    } catch (e) {
      if (e?.code === 'permission-denied') {
        rechazados += 1;
        console.log(`ok Comentario ${n} rechazado por las reglas (permission-denied).`);
      } else {
        throw e;
      }
    }
  }

  // Margen por si alguna escritura hubiera llegado al trigger.
  await esperar(2000);

  const datos = (await dbAdmin.doc(`users/${uid}`).get()).data() || {};
  const xp = Number(datos.xp ?? 0);
  const comentarios = Number(datos.stats?.commentsCreated ?? 0);

  const salida = {
    proyecto: PROJECT,
    fecha: new Date().toISOString(),
    uid,
    comentariosAceptados: ids,
    rechazados,
    xpInicial: Number(antes.xp ?? 0),
    xpFinal: xp,
    commentsCreated: comentarios,
    bloqueado:
      rechazados === 3 && ids.length === 0 && xp === Number(antes.xp ?? 0),
  };

  const destino = path.join(
    process.cwd(),
    'docs',
    'auditoria',
    'resultados-triggers.json',
  );
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, JSON.stringify(salida, null, 2), 'utf8');

  console.log(
    `\nResultado: rechazados=${rechazados}/3; xp ${salida.xpInicial} → ${xp}; ` +
      `commentsCreated=${comentarios}`,
  );
  console.log(
    salida.bloqueado
      ? 'P0 VERIFICADO: los comentarios a objetivos inexistentes no pagan XP.'
      : 'REGRESIÓN: todavía se puede farmear XP con objetivos inexistentes.',
  );
  console.log(`Resultados escritos en ${destino}`);

  await auth.signOut();

  if (!salida.bloqueado) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
