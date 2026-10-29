/**
 * AUDITORÍA DE CALLABLES — VERIFICACIÓN POST-P0
 *
 * Comprueba, contra el Emulator Suite, que un moderador YA NO puede
 * llamar a funciones que son solo de administración, y que un
 * moderador baneado no puede usar el panel.
 *
 * Salvaguardas:
 *   - Se niega a ejecutarse si el proyecto no empieza por `demo-`.
 *   - Se niega a ejecutarse si FIRESTORE_EMULATOR_HOST no está puesto.
 *   - No despliega nada ni escribe en producción.
 *
 * Ejecución:
 *   npx firebase emulators:exec --only firestore,auth,functions \
 *     --project demo-geekapoo-auditoria \
 *     "node scripts/auditoria-callables.mjs"
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const PROJECT = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || '';
const REGION = 'us-central1';
const AUTH_EMULATOR = 'http://127.0.0.1:9099';
const FUNCTIONS_EMULATOR = 'http://127.0.0.1:5001';
const TIMEOUT_MS = 120_000;

if (!PROJECT.startsWith('demo-')) {
  throw new Error(
    `Abortado: el proyecto "${PROJECT}" no es de demo. Estas pruebas solo corren contra emuladores.`,
  );
}
if (!process.env.FIRESTORE_EMULATOR_HOST) {
  throw new Error(
    'Abortado: falta FIRESTORE_EMULATOR_HOST. Ejecuta esto con firebase emulators:exec.',
  );
}

const requireFromFunctions = createRequire(
  path.join(process.cwd(), 'functions', 'package.json'),
);
const admin = requireFromFunctions('firebase-admin');
admin.initializeApp({ projectId: PROJECT });
const db = admin.firestore();

const resultados = [];

function registrar(caso, estado, detalle) {
  resultados.push({ caso, estado, detalle });
  const icono = estado === 'CONFIRMADO' ? '!!' : estado === 'OK' ? 'ok' : '??';
  console.log(`[${icono}] ${caso}: ${estado} — ${detalle}`);
}

async function signUp(email) {
  const res = await fetch(
    `${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: 'Auditoria123!',
        returnSecureToken: true,
      }),
      signal: AbortSignal.timeout(30_000),
    },
  );
  const json = await res.json();
  if (!json.idToken || !json.localId) {
    throw new Error(`No se pudo crear ${email}: ${JSON.stringify(json)}`);
  }
  return { uid: json.localId, token: json.idToken, email };
}

async function sembrarUsuario(cuenta, extra = {}) {
  await db.doc(`users/${cuenta.uid}`).set(
    {
      uid: cuenta.uid,
      username: cuenta.email.split('@')[0],
      displayName: cuenta.email.split('@')[0],
      avatarUrl: '',
      chatId: `GK-${cuenta.uid.slice(0, 8)}`,
      role: 'user',
      createdAt: '2026-01-01T00:00:00.000Z',
      isBanned: false,
      ...extra,
    },
    { merge: true },
  );
}

async function llamar(nombre, token, data = {}) {
  const res = await fetch(
    `${FUNCTIONS_EMULATOR}/${PROJECT}/${REGION}/${nombre}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ data }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    },
  );
  const texto = await res.text();
  let cuerpo;
  try {
    cuerpo = JSON.parse(texto);
  } catch {
    cuerpo = { crudo: texto.slice(0, 500) };
  }
  return { status: res.status, body: cuerpo };
}

function estadoError(respuesta) {
  return respuesta.body?.error?.status || respuesta.body?.error?.code || 'SIN_ESTADO';
}

function mensajeError(respuesta) {
  return respuesta.body?.error?.message || JSON.stringify(respuesta.body).slice(0, 300);
}

/**
 * Un moderador llama a una función de panel. Si la llamada termina en
 * 200, el hallazgo queda confirmado. Si termina en PERMISSION_DENIED,
 * la función está bien protegida y el hallazgo no se reproduce.
 */
async function moderadorLlama(caso, nombre, token, data, verificar) {
  try {
    const respuesta = await llamar(nombre, token, data);
    if (respuesta.status === 200) {
      let extra = '';
      if (verificar) {
        extra = await verificar(respuesta.body?.result);
        if (extra === false) {
          registrar(caso, 'ERROR', 'La llamada devolvió 200 pero el efecto esperado no se escribió');
          return { confirmado: false, respuesta };
        }
      }
      registrar(caso, 'CONFIRMADO', `el moderador obtuvo 200${extra ? `; ${extra}` : ''}`);
      return { confirmado: true, respuesta };
    }
    if (estadoError(respuesta) === 'PERMISSION_DENIED') {
      registrar(caso, 'OK', `el moderador recibió PERMISSION_DENIED: ${mensajeError(respuesta)}`);
      return { confirmado: false, respuesta };
    }
    registrar(
      caso,
      'ERROR',
      `respuesta inesperada ${respuesta.status} (${estadoError(respuesta)}): ${mensajeError(respuesta)}`,
    );
    return { confirmado: false, respuesta };
  } catch (e) {
    registrar(caso, 'ERROR', `fallo de red/ejecución: ${e.message}`);
    return { confirmado: false };
  }
}

async function main() {
  console.log(`Proyecto de emulador: ${PROJECT}`);
  console.log(`Firestore: ${process.env.FIRESTORE_EMULATOR_HOST}`);

  const mod = await signUp('moderador@auditoria.test');
  const mod2 = await signUp('moderador2@auditoria.test');
  const adminUser = await signUp('admin@auditoria.test');
  const normal = await signUp('normal@auditoria.test');
  const objetivo = await signUp('objetivo@auditoria.test');
  const adminObjetivo = await signUp('admin-objetivo@auditoria.test');
  const modBaneado = await signUp('mod-baneado@auditoria.test');

  await sembrarUsuario(mod, { role: 'moderator' });
  await sembrarUsuario(mod2, { role: 'moderator' });
  await sembrarUsuario(adminUser, { role: 'admin' });
  await sembrarUsuario(normal, { role: 'user' });
  await sembrarUsuario(objetivo, { role: 'user' });
  await sembrarUsuario(adminObjetivo, { role: 'admin', isBanned: true });
  await sembrarUsuario(modBaneado, { role: 'moderator', isBanned: true });

  await db.doc(`accountRestrictions/${adminObjetivo.uid}`).set({
    uid: adminObjetivo.uid,
    tipo: 'ban',
    activo: true,
    motivo: 'Baneo de prueba',
    fechaFin: null,
    creadoEn: admin.firestore.FieldValue.serverTimestamp(),
    actualizadoEn: admin.firestore.FieldValue.serverTimestamp(),
    actualizadoPor: 'auditoria',
  });
  await db.doc(`accountRestrictions/${modBaneado.uid}`).set({
    uid: modBaneado.uid,
    tipo: 'ban',
    activo: true,
    motivo: 'Baneo de prueba',
    fechaFin: null,
    creadoEn: admin.firestore.FieldValue.serverTimestamp(),
    actualizadoEn: admin.firestore.FieldValue.serverTimestamp(),
    actualizadoPor: 'auditoria',
  });

  await db.doc('gamification/config').set({ activo: true }, { merge: true });
  await db.doc('dailyQuizzes/2026-10-28').set(
    {
      date: '2026-10-28',
      active: true,
      label: 'Auditoría',
      questionCount: 0,
    },
    { merge: true },
  );

  // ── Control negativo: un usuario normal no entra ───────────
  {
    const r = await llamar('ajustarXp', normal.token, {
      uid: objetivo.uid,
      cantidad: 10,
      nota: 'control negativo',
    });
    if (estadoError(r) === 'PERMISSION_DENIED') {
      registrar('CONTROL: usuario normal → ajustarXp', 'OK', 'PERMISSION_DENIED');
    } else {
      registrar(
        'CONTROL: usuario normal → ajustarXp',
        'ERROR',
        `esperaba PERMISSION_DENIED y obtuve ${r.status} (${estadoError(r)})`,
      );
    }
  }

  // ── Control negativo: un moderador baneado no entra ────────
  {
    const r = await llamar('ajustarXp', modBaneado.token, {
      uid: objetivo.uid,
      cantidad: 10,
      nota: 'control baneado',
    });
    if (estadoError(r) === 'PERMISSION_DENIED') {
      registrar('CONTROL: moderador baneado → ajustarXp', 'OK', 'PERMISSION_DENIED');
    } else {
      registrar(
        'CONTROL: moderador baneado → ajustarXp',
        'ERROR',
        `esperaba PERMISSION_DENIED y obtuve ${r.status} (${estadoError(r)})`,
      );
    }
  }

  // ── El moderador llama a las funciones de panel ────────────
  await moderadorLlama(
    'P0 H1: moderador → ajustarXp',
    'ajustarXp',
    mod.token,
    { uid: objetivo.uid, cantidad: 10, nota: 'Ajuste de auditoría' },
    async () => {
      const snap = await db.doc(`users/${objetivo.uid}`).get();
      const xp = snap.data()?.xp;
      return typeof xp === 'number' && xp >= 10 ? `xp del objetivo = ${xp}` : false;
    },
  );

  await moderadorLlama(
    'P0 H2: moderador → concederMedalla',
    'concederMedalla',
    mod.token,
    { uid: objetivo.uid, medallaId: 'medal_primer_hilo' },
    async () => {
      const snap = await db.doc(`users/${objetivo.uid}`).get();
      return snap.data()?.medals?.['medal_primer_hilo']
        ? 'medalla escrita en el perfil del objetivo'
        : false;
    },
  );

  await moderadorLlama(
    'P0 H3: moderador → configurarGamificacion',
    'configurarGamificacion',
    mod.token,
    { xpPorHito: 77 },
    async () => {
      const snap = await db.doc('gamification/config').get();
      return snap.data()?.xpPorHito === 77 ? 'xpPorHito = 77' : false;
    },
  );

  await moderadorLlama(
    'P0 H4: moderador → recalcularUsuario',
    'recalcularUsuario',
    mod.token,
    { uid: objetivo.uid },
    async (resultado) => {
      return resultado && typeof resultado === 'object'
        ? `resultado devuelto: ${JSON.stringify(resultado).slice(0, 160)}`
        : 'recalculó sin error';
    },
  );

  await moderadorLlama(
    'P0 H5: moderador → abrirChatDirecto',
    'abrirChatDirecto',
    mod.token,
    { targetUid: objetivo.uid },
    async (resultado) => {
      const chatId = resultado?.chatId;
      if (!chatId) return false;
      const snap = await db.doc(`chats/${chatId}`).get();
      const miembros = snap.data()?.memberIds || [];
      return miembros.includes(mod.uid) && miembros.includes(objetivo.uid)
        ? `chat privado ${chatId} creado sin consentimiento`
        : false;
    },
  );

  await moderadorLlama(
    'P0 H6: moderador → desbanearUsuario (objetivo admin)',
    'desbanearUsuario',
    mod.token,
    { uid: adminObjetivo.uid },
    async () => {
      const snap = await db.doc(`accountRestrictions/${adminObjetivo.uid}`).get();
      return snap.data()?.activo === false
        ? 'baneo del administrador levantado por un moderador'
        : false;
    },
  );

  await moderadorLlama(
    'P0 H7: moderador → gestionarTriviaDiaria',
    'gestionarTriviaDiaria',
    mod.token,
    { fecha: '2026-10-28', accion: 'cerrar' },
    async () => {
      const snap = await db.doc('dailyQuizzes/2026-10-28').get();
      return snap.data()?.active === false ? 'trivia cerrada por un moderador' : false;
    },
  );

  await moderadorLlama(
    'P0 H8: moderador → sincronizarBaneos',
    'sincronizarBaneos',
    mod.token,
    {},
    async () => 'la función de mantenimiento se ejecutó',
  );

  // Esta puede tardar: va a por feeds RSS reales. Si falla por red,
  // el estado será ERROR, no un falso positivo de autorización.
  await moderadorLlama(
    'P0 H9: moderador → sincronizarNoticias',
    'sincronizarNoticias',
    mod.token,
    {},
    async (resultado) => {
      return resultado && typeof resultado === 'object'
        ? `resultado: ${JSON.stringify(resultado).slice(0, 160)}`
        : 'sincronización ejecutada';
    },
  );

  // ── Jerarquía de baneos: lo que SÍ está bien ───────────────
  {
    const r = await llamar('banearUsuario', mod.token, {
      uid: adminUser.uid,
      motivo: 'Intento de un moderador contra un admin',
    });
    if (estadoError(r) === 'PERMISSION_DENIED') {
      registrar('CONTROL: moderador no puede banear a un admin', 'OK', 'PERMISSION_DENIED');
    } else {
      registrar(
        'CONTROL: moderador no puede banear a un admin',
        'ERROR',
        `obtuve ${r.status} (${estadoError(r)})`,
      );
    }
  }

  {
    const r = await llamar('banearUsuario', mod.token, {
      uid: mod2.uid,
      motivo: 'Intento de un moderador contra otro moderador',
    });
    if (estadoError(r) === 'PERMISSION_DENIED') {
      registrar('CONTROL: moderador no puede banear a otro moderador', 'OK', 'PERMISSION_DENIED');
    } else {
      registrar(
        'CONTROL: moderador no puede banear a otro moderador',
        'ERROR',
        `obtuve ${r.status} (${estadoError(r)})`,
      );
    }
  }

  // ── Control positivo: el admin sí puede ───────────────────
  {
    const r = await llamar('configurarGamificacion', adminUser.token, {
      xpPorHito: 80,
    });
    if (r.status === 200) {
      const snap = await db.doc('gamification/config').get();
      if (snap.data()?.xpPorHito === 80) {
        registrar('CONTROL: admin → configurarGamificacion', 'OK', 'cambió xpPorHito a 80');
      } else {
        registrar('CONTROL: admin → configurarGamificacion', 'ERROR', 'no se escribió el cambio');
      }
    } else {
      registrar(
        'CONTROL: admin → configurarGamificacion',
        'ERROR',
        `obtuve ${r.status} (${estadoError(r)})`,
      );
    }
  }

  const salida = {
    proyecto: PROJECT,
    fecha: new Date().toISOString(),
    resultados,
  };
  const destino = path.join(process.cwd(), 'docs', 'auditoria', 'resultados-callables.json');
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, JSON.stringify(salida, null, 2), 'utf8');
  console.log(`\nResultados escritos en ${destino}`);

  const errores = resultados.filter((r) => r.estado === 'ERROR');
  const confirmados = resultados.filter((r) => r.estado === 'CONFIRMADO');
  console.log(
    `\nResumen: ${confirmados.length} hallazgo(s) confirmado(s), ` +
      `${resultados.filter((r) => r.estado === 'OK').length} control(es) correcto(s), ` +
      `${errores.length} error(es) de ejecución.`,
  );

  if (errores.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
