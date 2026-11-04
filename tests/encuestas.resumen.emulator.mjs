// Prueba de integración del resumen de encuestas con Functions
// Emulator. Comprueba que el trigger cuenta el estado real de los
// votos y no aplica deltas duplicados.
//
//   npm run test:encuestas

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../functions/package.json', import.meta.url));
const admin = require('firebase-admin');

admin.initializeApp({
  projectId: process.env.GCLOUD_PROJECT || 'demo-geekapoo-reglas',
});

const db = admin.firestore();
const hilo = db.doc('threads/encuesta-test');
const stats = db.doc('pollStats/encuesta-test');

await hilo.set({
  authorId: 'autor',
  title: 'Encuesta de prueba',
  poll: {
    question: '¿Prueba?',
    options: { o1: 'Sí', o2: 'No', o3: 'Quizá' },
    allowChangeVote: true,
    isClosed: false,
    expiresAt: null,
  },
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
});

await Promise.all([
  hilo.collection('pollVotes').doc('u1').set({ userId: 'u1', optionId: 'o1' }),
  hilo.collection('pollVotes').doc('u2').set({ userId: 'u2', optionId: 'o2' }),
  hilo.collection('pollVotes').doc('u3').set({ userId: 'u3', optionId: 'o2' }),
  hilo.collection('pollVotes').doc('u4').set({ userId: 'u4', optionId: 'o3' }),
]);

async function esperarResumen(esperado, timeoutMs = 15000) {
  const inicio = Date.now();
  while (Date.now() - inicio < timeoutMs) {
    const snap = await stats.get();
    const data = snap.data() ?? {};
    const options = data.options ?? {};
    const totalVotes = data.totalVotes ?? 0;
    if (
      totalVotes === esperado.totalVotes &&
      Object.entries(esperado.options).every(([id, n]) => (options[id] ?? 0) === n) &&
      Object.keys(options).length === Object.keys(esperado.options).length
    ) {
      return data;
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error('El resumen no llegó al estado esperado');
}

await esperarResumen({ options: { o1: 1, o2: 2, o3: 1 }, totalVotes: 4 });
console.log('OK: cuatro votos contados una sola vez');

await hilo.collection('pollVotes').doc('u1').update({ optionId: 'o3' });
await esperarResumen({ options: { o2: 2, o3: 2 }, totalVotes: 4 });
console.log('OK: cambio de voto sin alterar el total');

await hilo.collection('pollVotes').doc('u2').delete();
await esperarResumen({ options: { o2: 1, o3: 2 }, totalVotes: 3 });
console.log('OK: borrado de voto descuenta exactamente uno');
