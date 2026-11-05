// Prueba de integración de la identidad con Auth + Functions +
// Firestore Emulator.
//
//   npm run test:identidad
//
// Comprueba lo que no se puede probar solo con reglas: que
// `crearPerfilUsuario` reserva y crea el perfil en una transacción,
// que dos cuentas no pueden quedarse el mismo identificador, que una
// reserva confirmada no se puede liberar ni aunque el perfil se borre
// y que `liberarUsername` solo borra la reserva de quien la creó.

import assert from 'node:assert/strict';
import { deleteApp, initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  signOut,
} from 'firebase/auth';
import {
  connectFunctionsEmulator,
  getFunctions,
  httpsCallable,
} from 'firebase/functions';
import {
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getFirestore,
} from 'firebase/firestore';

const app = initializeApp({
  projectId: 'demo-geekapoo-identidad',
  apiKey: 'demo-api-key',
  appId: 'demo-app',
});

const auth = getAuth(app);
connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });

const functions = getFunctions(app);
connectFunctionsEmulator(functions, '127.0.0.1', 5001);

const db = getFirestore(app);
connectFirestoreEmulator(db, '127.0.0.1', 8080);

const reservar = httpsCallable(functions, 'reservarUsername');
const liberar = httpsCallable(functions, 'liberarUsername');
const comprobar = httpsCallable(functions, 'comprobarUsername');
const crearPerfil = httpsCallable(functions, 'crearPerfilUsuario');
const miUsername = httpsCallable(functions, 'miUsername');

const sufijo = Date.now().toString(36);
const usernameA = `kapo_${sufijo}`;
const usernameB = `otro_${sufijo}`;
const usernameD = `libre_${sufijo}`;

const disponible = await comprobar({ username: usernameA });
assert.equal(disponible.data.estado, 'disponible');
console.log('OK: la comprobación pública ve el nombre libre');

async function crearCuenta(email) {
  const cred = await createUserWithEmailAndPassword(auth, email, 'secreto123');
  return cred.user;
}

// ── Cuenta A: perfil creado de forma atómica ────────────────
const usuarioA = await crearCuenta(`a_${sufijo}@test.com`);
const resultadoA = await crearPerfil({
  username: usernameA,
  displayName: 'Kapo',
});
assert.equal(resultadoA.data.username, usernameA);
assert.ok(resultadoA.data.chatId.startsWith('GK-'));
console.log('OK: crearPerfilUsuario reserva el nombre y crea el perfil');

const ocupado = await comprobar({ username: usernameA });
assert.equal(ocupado.data.estado, 'ocupado');
console.log('OK: la comprobación pública ve el nombre ocupado');

await assert.rejects(
  () => liberar({ username: usernameA }),
  (error) => String(error.code).includes('failed-precondition'),
);
console.log('OK: no se libera un nombre que ya tiene perfil');

// Se borra el perfil: la reserva sigue confirmada y no se puede
// reutilizar. Es lo que impide que una cuenta borrada pierda su
// @usuario para siempre.
await deleteDoc(doc(db, 'users', usuarioA.uid));
await assert.rejects(
  () => liberar({ username: usernameA }),
  (error) => String(error.code).includes('failed-precondition'),
);
console.log('OK: una reserva confirmada no se libera ni sin perfil');

const permanente = await miUsername({});
assert.equal(permanente.data.username, usernameA);
console.log('OK: la cuenta recupera su @usuario permanente tras borrar el perfil');

await assert.rejects(
  () => crearPerfil({ username: usernameB, displayName: 'Kapo' }),
  (error) => String(error.code).includes('failed-precondition'),
);
console.log('OK: no se puede cambiar de @usuario borrando el perfil');

const recreado = await crearPerfil({
  username: usernameA,
  displayName: 'Kapo de nuevo',
});
assert.equal(recreado.data.username, usernameA);
console.log('OK: se recrea el perfil con el mismo @usuario');

// ── Cuenta B: no puede quedarse el nombre de A ──────────────
await signOut(auth);
await crearCuenta(`b_${sufijo}@test.com`);

await assert.rejects(
  () => crearPerfil({ username: usernameA, displayName: 'Otro Kapo' }),
  (error) => String(error.code).includes('already-exists'),
);
console.log('OK: la segunda cuenta recibe "ya está en uso"');

await assert.rejects(
  () => crearPerfil({ username: 'admin', displayName: 'Admin falso' }),
  (error) => String(error.code).includes('invalid-argument'),
);
console.log('OK: los nombres reservados se rechazan en el backend');

const resultadoB = await crearPerfil({
  username: usernameB,
  displayName: 'Kapo',
});
assert.equal(resultadoB.data.username, usernameB);
console.log('OK: otra cuenta puede usar el mismo nombre visible');

// ── Cuenta C: no puede liberar la reserva de A ──────────────
await signOut(auth);
await crearCuenta(`c_${sufijo}@test.com`);
await assert.rejects(
  () => liberar({ username: usernameA }),
  (error) => String(error.code).includes('permission-denied'),
);
console.log('OK: otra cuenta no puede liberar la reserva ajena');

// ── Reserva sin perfil: se puede liberar ────────────────────
await signOut(auth);
await crearCuenta(`d_${sufijo}@test.com`);
const resultadoD = await reservar({ username: usernameD });
assert.equal(resultadoD.data.username, usernameD);
console.log('OK: un nombre libre se reserva sin problema');

await liberar({ username: usernameD });
const liberado = await comprobar({ username: usernameD });
assert.equal(liberado.data.estado, 'disponible');
console.log('OK: el dueño libera su reserva antes de crear el perfil');

// ── Dos registros simultáneos con el mismo @usuario ─────────
const appB = initializeApp(
  {
    projectId: 'demo-geekapoo-identidad',
    apiKey: 'demo-api-key',
    appId: 'demo-app-b',
  },
  'identidad-concurrente',
);
const authB = getAuth(appB);
connectAuthEmulator(authB, 'http://127.0.0.1:9099', { disableWarnings: true });
const functionsB = getFunctions(appB);
connectFunctionsEmulator(functionsB, '127.0.0.1', 5001);
const crearPerfilB = httpsCallable(functionsB, 'crearPerfilUsuario');
const miUsernameB = httpsCallable(functionsB, 'miUsername');

await signOut(auth);
await crearCuenta(`e_${sufijo}@test.com`);
await createUserWithEmailAndPassword(
  authB,
  `f_${sufijo}@test.com`,
  'secreto123',
);

const usernameCarrera = `carrera_${sufijo}`;
const [carreraA, carreraB] = await Promise.allSettled([
  crearPerfil({ username: usernameCarrera, displayName: 'Carrera A' }),
  crearPerfilB({ username: usernameCarrera, displayName: 'Carrera B' }),
]);

const ganadoras = [carreraA, carreraB].filter(
  (resultado) => resultado.status === 'fulfilled',
);
const perdedoras = [carreraA, carreraB].filter(
  (resultado) => resultado.status === 'rejected',
);
assert.equal(ganadoras.length, 1, 'solo una cuenta gana la carrera');
assert.equal(perdedoras.length, 1, 'la otra recibe el rechazo');
assert.ok(
  String(perdedoras[0].reason?.code ?? '').includes('already-exists'),
  'el rechazo es already-exists',
);
console.log('OK: dos registros simultáneos con el mismo @usuario: solo uno gana');

const miA = await miUsername({});
const miB = await miUsernameB({});
const ganador = carreraA.status === 'fulfilled' ? miA : miB;
const perdedor = carreraA.status === 'fulfilled' ? miB : miA;
assert.equal(ganador.data.username, usernameCarrera);
assert.equal(perdedor.data.username, null);
console.log('OK: solo la cuenta ganadora conserva la reserva');

await deleteApp(appB);
await deleteApp(app);
process.exit(0);
