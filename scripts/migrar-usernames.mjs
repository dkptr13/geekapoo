/**
 * MIGRACIÓN: identificadores únicos de usuario.
 *
 * Asigna a cada cuenta existente un `username` normalizado y crea su
 * reserva en `usernames/{username}`. No toca UID, correo, XP,
 * medallas, publicaciones, mensajes ni relaciones.
 *
 * Reglas:
 *   - Si el username actual ya es válido y está libre, se conserva.
 *   - Si no, se genera desde el nombre visible o el username actual.
 *   - Las colisiones se resuelven con sufijos `_2`, `_3`...
 *   - El username anterior, si cambia, se guarda en
 *     `usernameAliases/{viejo}` para que las menciones ya escritas
 *     sigan llegando a la misma persona.
 *
 * Uso:
 *   node scripts/migrar-usernames.mjs                 # simulación
 *   node scripts/migrar-usernames.mjs --escribir      # aplica
 */

import {
  arrayDe,
  coleccion,
  crear,
  escribir,
  momento,
  s,
  str,
  uno,
} from './firestore-rest.mjs';

const ESCRIBIR = process.argv.includes('--escribir');

const RESERVED = new Set([
  'admin', 'administrador', 'administrator', 'mod', 'moderator',
  'moderador', 'support', 'soporte', 'help', 'ayuda', 'geekapoo',
  'kapo', 'kapochan', 'system', 'sistema', 'official', 'oficial',
  'staff', 'team', 'equipo', 'security', 'seguridad', 'root',
  'owner', 'api', 'bot', 'null', 'undefined', 'anonymous', 'anonimo',
  'webmaster', 'contacto', 'contact', 'info', 'noreply', 'no_reply',
  'mail', 'correo', 'me', 'yo', 'user', 'usuario', 'guest',
  'invitado', 'deleted', 'eliminado', 'cuenta', 'soporte_tecnico',
]);

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

function normalizar(valor) {
  return String(valor ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function sanitizar(valor) {
  return normalizar(valor)
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function valido(valor) {
  return USERNAME_RE.test(valor) && !RESERVED.has(valor);
}

function basePara(usuario) {
  const actual = normalizar(str(usuario, 'username'));
  const visible = str(usuario, 'displayName');
  const candidatos = [actual, sanitizar(visible), `user_${usuario.id.slice(0, 6)}`];

  for (const candidato of candidatos) {
    const limpio = sanitizar(candidato).slice(0, 20);
    if (limpio.length >= 3 && valido(limpio)) return limpio;
  }
  return `user_${usuario.id.slice(0, 6)}`.slice(0, 20);
}

function conSufijo(base, n) {
  const sufijo = `_${n}`;
  return `${base.slice(0, 20 - sufijo.length)}${sufijo}`;
}

console.log(
  `[usernames] Proyecto: geekapoo-7624d · modo: ${
    ESCRIBIR ? 'ESCRITURA' : 'SIMULACIÓN (sin escribir)'
  }`,
);

const usuarios = await coleccion('users', {
  select: ['username', 'displayName', 'createdAt'],
});
const reservas = await coleccion('usernames');
const alias = await coleccion('usernameAliases');

function fechaDeCreacion(doc) {
  const valor = doc.f?.createdAt;
  return (
    valor?.timestampValue ||
    valor?.stringValue ||
    ''
  );
}

// Las cuentas más antiguas eligen primero: si dos se llaman "oscar",
// la que lleva más tiempo conserva el identificador limpio.
usuarios.sort((a, b) =>
  fechaDeCreacion(a).localeCompare(fechaDeCreacion(b)),
);

const ocupados = new Map();
for (const reserva of reservas) {
  ocupados.set(reserva.id, str(reserva, 'uid'));
}
const aliasExistentes = new Set(alias.map((doc) => doc.id));
const aliasOcupados = new Set(alias.map((doc) => doc.id));
const reservasConfirmadas = new Set(
  reservas
    .filter((doc) => doc.f?.confirmed?.booleanValue === true)
    .map((doc) => doc.id),
);

const plan = [];
let conservados = 0;
let cambiados = 0;
let aliasNuevos = 0;

const elegidos = new Map();
const yaReservados = new Set();

// Fase 1: conservar los identificadores actuales que ya cumplen el
// formato. Se hace ANTES de generar ninguno para que una cuenta con
// un nombre válido no lo pierda porque otra cuenta anterior tenga un
// nombre inválido que, al limpiarse, acabe en el mismo sitio.
for (const usuario of usuarios) {
  const uid = usuario.id;
  const actual = normalizar(str(usuario, 'username'));
  if (!valido(actual) || aliasOcupados.has(actual)) continue;

  const dueno = ocupados.get(actual);
  if (dueno && dueno !== uid) continue;

  ocupados.set(actual, uid);
  elegidos.set(uid, actual);
  if (dueno === uid) yaReservados.add(uid);
}

// Fase 2: generar identificadores para quienes no conservan el suyo.
for (const usuario of usuarios) {
  const uid = usuario.id;
  const actual = normalizar(str(usuario, 'username'));

  if (yaReservados.has(uid)) {
    conservados += 1;
    continue;
  }

  let elegido = elegidos.get(uid) ?? '';
  if (!elegido) {
    const base = basePara(usuario);
    for (let n = 1; n <= 999; n += 1) {
      const candidato = n === 1 ? base : conSufijo(base, n);
      if (!valido(candidato)) continue;
      if (aliasOcupados.has(candidato)) continue;
      const dueno = ocupados.get(candidato);
      if (dueno && dueno !== uid) continue;
      elegido = candidato;
      break;
    }
  }

  if (!elegido) {
    console.warn(`  · ${uid}: no se pudo generar un identificador`);
    continue;
  }

  elegidos.set(uid, elegido);
  ocupados.set(elegido, uid);
  const cambia = actual !== elegido;
  if (cambia) cambiados += 1;

  plan.push({ uid, actual, elegido, cambia });
}

/**
 * ¿El nombre antiguo puede quedar como alias de esta cuenta?
 *
 * No puede si otro perfil lo usa ahora como identificador: una
 * mención a ese nombre resolvería a la otra persona y el alias sería
 * una mentira. En las colisiones (`oscar` y `oscar_2`) el nombre
 * limpio se queda con quien lo tenía primero.
 */
function aliasViable(item) {
  if (!item.cambia || !item.actual || item.actual === item.elegido) return false;
  if (item.actual.includes('/')) return false;
  // Un nombre reservado no se convierte en alias de una cuenta: sería
  // justo la suplantación que la lista de reservados evita.
  if (RESERVED.has(item.actual)) return false;
  const dueno = ocupados.get(item.actual);
  return !dueno || dueno === item.uid;
}

console.log(`[usernames] Usuarios: ${usuarios.length}`);
console.log(`[usernames] Reservas ya válidas: ${conservados}`);
console.log(`[usernames] Reservas que se crearán: ${plan.length}`);
console.log(`[usernames] Identificadores que cambian: ${cambiados}`);

for (const item of plan) {
  console.log(`  · ${item.uid}: ${item.actual || '(sin username)'} → @${item.elegido}`);
  if (aliasViable(item) && !aliasExistentes.has(item.actual)) {
    aliasNuevos += 1;
  }
}

console.log(`[usernames] Alias nuevos para menciones antiguas: ${aliasNuevos}`);

if (!ESCRIBIR) {
  console.log(
    '[usernames] Simulación terminada. Vuelve a ejecutarlo con --escribir para aplicar.',
  );
  process.exit(0);
}

const ahora = new Date();
for (const item of plan) {
  const reserva = await uno('usernames', item.elegido);
  if (reserva && str(reserva, 'uid') !== item.uid) {
    throw new Error(
      `Carrera detectada: @${item.elegido} ya pertenece a otra cuenta.`,
    );
  }

  if (!reserva) {
    await escribir(
      'usernames',
      item.elegido,
      {
        uid: s(item.uid),
        createdAt: momento(ahora),
        // La cuenta ya tiene perfil: su nombre no se puede liberar.
        confirmed: { booleanValue: true },
      },
      ['uid', 'createdAt', 'confirmed'],
    );
    reservasConfirmadas.add(item.elegido);
  }

  const camposUsuario = { username: s(item.elegido) };
  const mascaraUsuario = ['username'];
  if (aliasViable(item)) {
    camposUsuario.usernameAliases = arrayDe([item.actual]);
    mascaraUsuario.push('usernameAliases');
  }

  await escribir(
    'users',
    item.uid,
    camposUsuario,
    mascaraUsuario,
  );

  if (aliasViable(item) && !aliasExistentes.has(item.actual)) {
    const aliasPrevio = await uno('usernameAliases', item.actual);
    if (!aliasPrevio) {
      await crear('usernameAliases', item.actual, {
        uid: s(item.uid),
        username: s(item.elegido),
        createdAt: momento(ahora),
      });
      aliasExistentes.add(item.actual);
    }
  }
}

// Las reservas que ya existían (cuentas migradas antes o creadas con
// el sistema nuevo) también quedan confirmadas: el perfil existe, así
// que `liberarUsername` no debe poder retirarlas.
for (const [uid, username] of elegidos) {
  if (!username || reservasConfirmadas.has(username)) continue;

  // Se relee para no recrear con un PATCH una reserva que alguien
  // haya borrado entre la planificación y la escritura.
  const actual = await uno('usernames', username);
  if (!actual || str(actual, 'uid') !== uid) continue;

  console.log(`  · confirmando @${username} (${uid})`);
  await escribir(
    'usernames',
    username,
    { confirmed: { booleanValue: true } },
    ['confirmed'],
  );
}

console.log('[usernames] Migración aplicada.');
