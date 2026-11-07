// Prueba de integración de las estadísticas de la wiki con Auth +
// Functions + Firestore Emulator.
//
//   npm run test:anime-stats
//
// Comprueba:
//   - un voto por usuario y anime;
//   - cambiar el voto no crea otro;
//   - la media y el contador se recalculan;
//   - la puntuación 1-10 se valida en servidor;
//   - una visita se cuenta una vez y se deduplica por UID;
//   - sin sesión no se puede votar.

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
  collection,
  connectFirestoreEmulator,
  doc,
  getDocFromServer,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
} from 'firebase/firestore';

const PROJECT = 'demo-geekapoo-anime-stats-fn';
const ANIME_ID = 'anime-estadisticas-test';

const app = initializeApp({
  projectId: PROJECT,
  apiKey: 'demo-api-key',
  appId: 'demo-app',
});

const auth = getAuth(app);
connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
const functions = getFunctions(app);
connectFunctionsEmulator(functions, '127.0.0.1', 5001);
const db = getFirestore(app);
connectFirestoreEmulator(db, '127.0.0.1', 8080);

const crearPerfil = httpsCallable(functions, 'crearPerfilUsuario');
const votar = httpsCallable(functions, 'votarAnime');
const visitar = httpsCallable(functions, 'registrarVisitaAnime');

const sufijo = Date.now().toString(36);

async function crearCuenta(email) {
  const cred = await createUserWithEmailAndPassword(auth, email, 'secreto123');
  return cred.user;
}

async function crearPerfilDe(uid) {
  await crearPerfil({
    username: `stat_${sufijo}_${uid.slice(0, 5)}`,
    displayName: 'Lector de prueba',
    email: `${uid}@test.com`,
  });
}

async function sembrarAnime(id, title, likes, views) {
  const url = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents/animes?documentId=${id}`;
  const respuesta = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer owner',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        title: { stringValue: title },
        slug: { stringValue: id },
        coverUrl: { stringValue: '' },
        likesCount: { integerValue: String(likes) },
        viewsCount: { integerValue: String(views) },
        communityRatingSum: { integerValue: '0' },
        communityRatingCount: { integerValue: '0' },
        communityRatingAvg: { doubleValue: 0 },
        commentsCount: { integerValue: '0' },
      },
    }),
  });
  if (!respuesta.ok) {
    throw new Error(`No se pudo sembrar ${id}: HTTP ${respuesta.status}`);
  }
}

await sembrarAnime(ANIME_ID, 'Anime de prueba', 0, 0);
await sembrarAnime('anime-alto', 'Más gustado', 99, 10);
await sembrarAnime('anime-medio', 'Equilibrado', 10, 100);
await sembrarAnime('anime-visto', 'Más visto', 1, 500);

// ── Orden de los rankings ───────────────────────────────────
const porLikes = await getDocs(
  query(collection(db, 'animes'), orderBy('likesCount', 'desc'), limit(2)),
);
assert.deepEqual(
  porLikes.docs.map((d) => d.id),
  ['anime-alto', 'anime-medio'],
);
const porVistas = await getDocs(
  query(collection(db, 'animes'), orderBy('viewsCount', 'desc'), limit(2)),
);
assert.deepEqual(
  porVistas.docs.map((d) => d.id),
  ['anime-visto', 'anime-medio'],
);
console.log('OK: los rankings se ordenan por Me gusta y por visitas');

// ── Usuario A vota y cambia su voto ─────────────────────────
const usuarioA = await crearCuenta(`a_${sufijo}@test.com`);
await crearPerfilDe(usuarioA.uid);

const votoA = await votar({ animeId: ANIME_ID, score: 8 });
assert.equal(votoA.data.miVoto, 8);
assert.equal(votoA.data.media, 8);
assert.equal(votoA.data.votos, 1);
console.log('OK: el primer voto crea la media');

const cambioA = await votar({ animeId: ANIME_ID, score: 10 });
assert.equal(cambioA.data.miVoto, 10);
assert.equal(cambioA.data.media, 10);
assert.equal(cambioA.data.votos, 1);
console.log('OK: cambiar el voto no crea un voto adicional');

await assert.rejects(
  () => votar({ animeId: ANIME_ID, score: 0 }),
  (error) => String(error.code).includes('invalid-argument'),
);
await assert.rejects(
  () => votar({ animeId: ANIME_ID, score: 11 }),
  (error) => String(error.code).includes('invalid-argument'),
);
console.log('OK: la puntuación fuera de 1-10 se rechaza en servidor');

// ── Usuario B vota y la media se recalcula ──────────────────
await signOut(auth);
const usuarioB = await crearCuenta(`b_${sufijo}@test.com`);
await crearPerfilDe(usuarioB.uid);

const votoB = await votar({ animeId: ANIME_ID, score: 6 });
assert.equal(votoB.data.media, 8);
assert.equal(votoB.data.votos, 2);
console.log('OK: dos usuarios producen una media de 8 con dos votos');

// ── Visitas: una por usuario y 24 h ────────────────────────
const visita1 = await visitar({ animeId: ANIME_ID });
assert.equal(visita1.data.contado, true);
assert.equal(visita1.data.viewsCount, 1);
const visita2 = await visitar({ animeId: ANIME_ID });
assert.equal(visita2.data.contado, false);
assert.equal(visita2.data.viewsCount, 1);
console.log('OK: la segunda visita del mismo usuario no cuenta');

// ── Agregados finales en el documento ───────────────────────
const anime = await getDocFromServer(doc(db, 'animes', ANIME_ID));
assert.equal(anime.data().communityRatingCount, 2);
assert.equal(anime.data().communityRatingSum, 16);
assert.equal(anime.data().communityRatingAvg, 8);
assert.equal(anime.data().viewsCount, 1);
console.log('OK: el documento guarda los agregados correctos');

// ── Sin sesión no se vota ───────────────────────────────────
await signOut(auth);
await assert.rejects(
  () => votar({ animeId: ANIME_ID, score: 7 }),
  (error) => String(error.code).includes('unauthenticated'),
);
console.log('OK: sin sesión no se puede votar');

await deleteApp(app);
process.exit(0);
