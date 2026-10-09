/**
 * Pruebas de las reglas de la trivia diaria.
 *
 * Aquí está lo importante del sistema: que no se pueda hacer
 * trampa. Un cliente normal no puede
 *
 *   - leer las respuestas correctas (ni antes ni después),
 *   - escribir sus propias respuestas correctas,
 *   - inventarse las notas ni los puntos,
 *   - jugar dos veces el mismo día,
 *   - cambiar lo que ya respondió,
 *   - jugar una trivia que no existe o está cerrada,
 *   - tocar la trivia si no es admin,
 *   - escribirse el XP, las medallas o la racha.
 *
 * Va en su propio archivo (y no en `firestore.community`) porque
 * son otro grupo de reglas y porque monta su propio emulador.
 *
 *   npm run test:rules
 */
const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} = require('@firebase/rules-unit-testing');
const { doc, collection, setDoc, updateDoc, deleteDoc, getDoc } = require('firebase/firestore');

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const RULES = fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8');
const PROJECT = 'demo-geekapoo-trivia';

const ALICE = 'alice';
const BOB = 'bob';
const ADMIN = 'admin';

/** Fecha de la trivia del test. */
const DIA = '2026-10-04';
const OTRO_DIA = '2026-10-05';
const CERRADA = '2026-10-06';

let testEnv;

const db = (uid) => testEnv.authenticatedContext(uid).firestore();
const anon = () => testEnv.unauthenticatedContext().firestore();

async function sembrar(fn) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => fn(ctx.firestore()));
}

/** Crea una trivia completa (pública + privada). */
async function sembrarTrivia(f, dia, { active = true } = {}) {
  await setDoc(doc(f, 'dailyQuizzes', dia), {
    date: dia,
    totalQuestions: 3,
    active,
    createdAt: '2026-10-01T00:00:00.000Z',
  });

  const preguntas = [
    { q: '¿Cómo se llama el protagonista de Solo Leveling?', o: ['Sung Jin-Woo', 'Gojo Satoru', 'Tanjiro Kamado'], c: 0 },
    { q: '¿Qué Fruits es el de Luffy?', o: ['Bara Bara', 'Mera Mera', 'Gomu Gomu'], c: 2 },
    { q: '¿Quién es el autor de Chainsaw Man?', o: ['Tatsuki Fujimoto', 'Eiichiro Oda', 'Gege Akutami'], c: 0 },
  ];

  for (const p of preguntas) {
    await setDoc(doc(f, 'dailyQuizzes', dia, 'questions', p.q.startsWith('¿Cómo') ? 'q1' : p.q.startsWith('¿Qué') ? 'q2' : 'q3'), {
      question: p.q,
      options: p.o,
      category: 'Shonen',
      difficulty: 'media',
    });
    await setDoc(doc(f, 'dailyQuizzes', dia, 'answers', p.q.startsWith('¿Cómo') ? 'q1' : p.q.startsWith('¿Qué') ? 'q2' : 'q3'), {
      correctIndex: p.c,
      explanation: `La respuesta es ${p.o[p.c]}.`,
    });
  }
}

describe('trivia diaria', () => {
  before(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT,
      firestore: { rules: RULES },
    });

    for (const [uid, extra] of [
      [ALICE, {}],
      [BOB, {}],
      [ADMIN, { role: 'admin' }],
    ]) {
      await sembrar(async (f) => {
        await setDoc(doc(f, 'users', uid), {
          uid,
          email: `${uid}@test.com`,
          username: uid,
          displayName: uid,
          chatId: `GK-${uid}`,
          avatarUrl: '',
          role: 'user',
          createdAt: '2026-01-01T00:00:00.000Z',
          isBanned: false,
          ...extra,
        });
      });
    }

    await sembrar(async (f) => {
      await sembrarTrivia(f, DIA);
      await sembrarTrivia(f, OTRO_DIA);
      await sembrarTrivia(f, CERRADA, { active: false });
    });
  });

  after(async () => {
    await testEnv.cleanup();
  });

  // ==========================================================
  // 1. LAS RESPUESTAS CORRECTAS SON SECRETAS
  // ==========================================================
  describe('las respuestas correctas no se pueden leer', () => {
    it('nadie las lee, ni con sesión ni sin ella', async () => {
      // ESTA es la prueba más importante del archivo. Si este
      // `getDoc` saliera bien, la trivia sería trampeable desde
      // la consola del navegador.
      await assertFails(getDoc(doc(anon(), 'dailyQuizzes', DIA, 'answers', 'q1')));
      await assertFails(getDoc(doc(db(ALICE), 'dailyQuizzes', DIA, 'answers', 'q1')));
      await assertFails(getDoc(doc(db(ADMIN), 'dailyQuizzes', DIA, 'answers', 'q1')));
    });

    it('las preguntas SÍ son públicas (sin la respuesta)', async () => {
      await assertSucceeds(getDoc(doc(anon(), 'dailyQuizzes', DIA, 'questions', 'q1')));

      const snap = await getDoc(doc(anon(), 'dailyQuizzes', DIA, 'questions', 'q1'));
      assert(!('correctIndex' in snap.data()), 'la pregunta no trae la respuesta');
      assert(!('explanation' in snap.data()), 'ni la explicación');
    });

    it('nadie puede escribirlas tampoco', async () => {
      // Ni siquiera el admin. Si pudiera, podría cambiar cuál es
      // la buena con usuarios que ya han jugado.
      await assertFails(setDoc(doc(db(ADMIN), 'dailyQuizzes', DIA, 'answers', 'q1'), {
        correctIndex: 2,
        explanation: 'cambiada',
      }));
      await assertFails(deleteDoc(doc(db(ADMIN), 'dailyQuizzes', DIA, 'answers', 'q1')));
    });
  });

  // ==========================================================
  // 2. PREPARAR LA TRIVIA ES COSA DEL ADMIN
  // ==========================================================
  describe('preparar la trivia', () => {
    it('el admin puede escribir las preguntas', async () => {
      await assertSucceeds(setDoc(doc(db(ADMIN), 'dailyQuizzes', OTRO_DIA, 'questions', 'q9'), {
        question: '¿Nueva pregunta?',
        options: ['A', 'B'],
        category: 'Manga',
        difficulty: 'facil',
      }));
    });

    it('un usuario normal NO', async () => {
      await assertFails(setDoc(doc(db(ALICE), 'dailyQuizzes', OTRO_DIA, 'questions', 'q8'), {
        question: 'Yo decido las preguntas',
        options: ['A', 'B'],
      }));
    });

    it('ni siquiera colando la respuesta correcta en la pública', async () => {
      // El `hasOnly` de las reglas es lo que lo impide. Sin él,
      // un admin (o alguien con el rol mal puesto) podría dejar
      // la respuesta buena a la vista de todo el mundo.
      await assertFails(setDoc(doc(db(ADMIN), 'dailyQuizzes', OTRO_DIA, 'questions', 'q7'), {
        question: '¿Trampa?',
        options: ['A', 'B'],
        correctIndex: 1,
        explanation: 'es la B',
      }));
    });
  });

  // ==========================================================
  // 3. ENVIAR LAS RESPUESTAS
  // ==========================================================
  describe('enviar las respuestas', () => {
    const enviar = (uid, dia = DIA, respuestas = { q1: 0, q2: 2, q3: 0 }) =>
      setDoc(doc(db(uid), 'triviaResults', `${uid}_${dia}`), {
        userId: uid,
        date: dia,
        quizId: dia,
        answers: respuestas,
        createdAt: '2026-10-04T10:00:00.000Z',
      });

    it('el jugador puede enviar las suyas', async () => {
      await assertSucceeds(enviar(ALICE));
    });

    it('NO puede decidir su propia nota', async () => {
      // Este es el agujero clásico. `correct`, `points` y
      // `xpGanado` los pone la Cloud Function; si el `hasOnly`
      // no estuviera, el jugador se pondría 9999 puntos.
      await assertFails(setDoc(doc(db(BOB), 'triviaResults', `${BOB}_${DIA}`), {
        userId: BOB,
        date: DIA,
        quizId: DIA,
        answers: { q1: 0, q2: 0, q3: 0 },
        correct: 3,
        points: 9999,
      }));
    });

    it('NO puede poner XP en el documento', async () => {
      await assertFails(setDoc(doc(db(BOB), 'triviaResults', `${BOB}_${DIA}`), {
        userId: BOB,
        date: DIA,
        quizId: DIA,
        answers: { q1: 0 },
        xpGanado: 500,
      }));
    });

    it('NO puede jugar dos veces el mismo día', async () => {
      // El id lleva el uid dentro, así que el segundo envío
      // choca contra el documento que ya existe.
      await assertFails(enviar(ALICE, DIA, { q1: 1, q2: 1, q3: 1 }));
    });

    it('ni cambiando el nombre del documento', async () => {
      // Se podría pensar que basta con inventar otro id para
      // tener dos. La regla comprueba que el id sea su uid + su
      // fecha, así que no.
      await assertFails(setDoc(doc(db(ALICE), 'triviaResults', 'otro-cualquiera'), {
        userId: ALICE,
        date: DIA,
        quizId: DIA,
        answers: { q1: 0 },
      }));
    });

    it('NO puede cambiar lo que ya respondió', async () => {
      await assertFails(updateDoc(doc(db(ALICE), 'triviaResults', `${ALICE}_${DIA}`), {
        answers: { q1: 1, q2: 1, q3: 1 },
      }));
    });

    it('ni borrarlo para jugar otra vez', async () => {
      await assertFails(deleteDoc(doc(db(ALICE), 'triviaResults', `${ALICE}_${DIA}`)));
    });

    it('NO puede jugar una trivia cerrada', async () => {
      await assertFails(enviar(BOB, CERRADA));
    });

    it('ni una que no existe', async () => {
      await assertFails(enviar(BOB, '2020-01-01'));
    });

    it('ni sin iniciar sesión', async () => {
      await assertFails(setDoc(doc(anon(), 'triviaResults', `anon_${DIA}`), {
        userId: 'anon',
        date: DIA,
        quizId: DIA,
        answers: { q1: 0 },
      }));
    });

    it('cada quien solo ve su resultado', async () => {
      await assertSucceeds(getDoc(doc(db(ALICE), 'triviaResults', `${ALICE}_${DIA}`)));
      await assertFails(getDoc(doc(db(BOB), 'triviaResults', `${ALICE}_${DIA}`)));
      await assertFails(getDoc(doc(anon(), 'triviaResults', `${ALICE}_${DIA}`)));
    });
  });

  // ==========================================================
  // 4. EL RANKING Y LA RACHA NO SE TOCAN
  // ==========================================================
  describe('el ranking y la racha son del servidor', () => {
    it('el ranking es público de lectura', async () => {
      await assertSucceeds(getDoc(doc(anon(), 'triviaLeaderboard', 'historico-historico')));
      await assertSucceeds(getDoc(doc(anon(), 'triviaLeaderboard', 'semanal-2026-W40')));
    });

    it('pero NADIE lo puede escribir desde el cliente', async () => {
      // Ni el jugador (que se metería en el podio) ni el admin
      // (que se metería donde le dé la gana): lo escribe la
      // Cloud Function con Admin SDK.
      await assertFails(setDoc(doc(db(ALICE), 'triviaLeaderboard', 'historico-historico'), {
        scores: { [ALICE]: { points: 9999 } },
      }));
      await assertFails(updateDoc(doc(db(ADMIN), 'triviaLeaderboard', 'historico-historico'), {
        scores: {},
      }));
    });

    it('el jugador no puede fabricarse una racha', async () => {
      // Con `trivia: { current: 30 }` se llevaría la medalla de
      // "Leyenda de la Trivia" sin jugar un solo día.
      await assertFails(updateDoc(doc(db(ALICE), 'users', ALICE), {
        trivia: { current: 30, longest: 30, lastDate: DIA },
      }));
    });

    it('ni los contadores de la trivia', async () => {
      // `stats` entero está bloqueado para el cliente, así que
      // tampoco puede ponerse `triviaCompleted: 500` para
      // desbloquear todas las medallas de un golpe.
      await assertFails(updateDoc(doc(db(ALICE), 'users', ALICE), {
        stats: { triviaCompleted: 500, triviaCorrect: 9999, triviaPerfect: 99, triviaStreakBest: 30 },
      }));
    });

    it('ni las medallas ni el XP (eso ya estaba, pero no debe romperse)', async () => {
      await assertFails(updateDoc(doc(db(ALICE), 'users', ALICE), {
        xp: 999999,
        medals: { medal_leyenda_trivia: '2026-10-04' },
      }));
    });
  });

  // ==========================================================
  // 5. LO VIEJO SIGUE FUNCIONANDO
  // ==========================================================
  describe('no se ha roto nada de antes', () => {
    it('un usuario normal sigue sin poder cambiarse el rol ni el bloqueo', async () => {
      // Lo comprueba la rama que se añadió al `create` y al
      // `update` de `users/{uid}` para tapar el campo `trivia`:
      // si esa lista se hubiera escrito mal, el usuario podría
      // tocar cualquier campo reservado.
      //
      // Se escriben valores DISTINTOS de los que ya tiene el
      // documento: `diff()` solo cuenta los campos que cambian,
      // así que volver a escribir `isBanned: false` sobre un
      // `isBanned: false` no es un cambio y la regla lo deja
      // pasar (correctamente: no ha cambiado nada).
      await assertFails(updateDoc(doc(db(ALICE), 'users', ALICE), { role: 'admin' }));
      await assertFails(updateDoc(doc(db(ALICE), 'users', ALICE), { isBanned: true }));
      await assertFails(updateDoc(doc(db(ALICE), 'users', ALICE), { chatId: 'GK-OTRO' }));
    });

    it('el usuario puede seguir guardando sus favoritos', async () => {
      // La trivia no toca las reglas de los favoritos: es un
      // control para que el arreglo de `users/{uid}` no se haya
      // comido la lista de campos permitidos.
      await assertSucceeds(setDoc(doc(db(ALICE), 'users', ALICE, 'favoriteEmojis', 'fire'), {
        emojiKey: 'fire',
        createdAt: '2026-10-04T00:00:00.000Z',
      }));
    });

    it('y su perfil se sigue pudiendo editar', async () => {
      await assertSucceeds(updateDoc(doc(db(ALICE), 'users', ALICE), {
        bio: 'Me gusta el shonen.',
      }));
    });

    it('y se sigue pudiendo publicar en la comunidad', async () => {
      await assertSucceeds(setDoc(doc(db(ALICE), 'threads', 'hilo-trivia'), {
        authorId: ALICE,
        authorName: ALICE,
        authorAvatar: '',
        title: 'Hilo normal de la comunidad',
        body: 'Esto no tiene nada que ver con la trivia.',
        categoryId: 'debates',
        categoryName: 'Debates',
        tags: ['General'],
        likesCount: 0,
        likedBy: [],
        commentsCount: 0,
        createdAt: '2026-10-04T00:00:00.000Z',
      }));
    });
  });
});
