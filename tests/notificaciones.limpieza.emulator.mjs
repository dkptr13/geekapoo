// Prueba de integración del trigger `onCommentDeleted` con Functions
// Emulator: al borrar un comentario desaparecen solo sus avisos, no
// los de otros comentarios del mismo hilo.
//
//   npm run test:notificaciones
//
// El emulador debe estar arrancado por `firebase emulators:exec`; este
// script no se conecta a producción.

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../functions/package.json', import.meta.url));
const admin = require('firebase-admin');

admin.initializeApp({
  projectId: process.env.GCLOUD_PROJECT || 'demo-geekapoo-reglas',
});

const db = admin.firestore();
const avisoC1 = db.doc('users/u1/notifications/reply_c1');
const avisoC2 = db.doc('users/u1/notifications/thread_comment_c2');

await db.doc('comments/c1').set({
  authorId: 'u2',
  targetType: 'thread',
  targetId: 't1',
  body: 'Comentario que se va a borrar',
});

await db.doc('comments/c2').set({
  authorId: 'u3',
  targetType: 'thread',
  targetId: 't1',
  body: 'Comentario que debe seguir existiendo',
});

const base = {
  recipientId: 'u1',
  actorId: 'u2',
  actorName: 'U2',
  actorAvatar: '',
  threadId: 't1',
  read: false,
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
};

await avisoC1.set({ ...base, type: 'comment_reply', commentId: 'c1' });
await avisoC2.set({ ...base, type: 'comment_thread', commentId: 'c2' });

await db.doc('comments/c1').delete();

let existeC1 = true;
for (let i = 0; i < 60; i += 1) {
  const snap = await avisoC1.get();
  existeC1 = snap.exists;
  if (!existeC1) break;
  await new Promise((resolve) => setTimeout(resolve, 500));
}

assert.equal(existeC1, false, 'el aviso del comentario borrado debe desaparecer');
assert.equal(
  (await avisoC2.get()).exists,
  true,
  'el aviso de otro comentario del mismo hilo debe seguir',
);

console.log('OK: limpieza de avisos por comentario borrado');
